"""Post a Lab Logic episode to YouTube, Instagram and TikTok from a plan file.

    python post.py check                         credentials present + which account each one signs in as
    python post.py plan episodes/<slug>.json      dry run: validate files and show the schedule (US Eastern)
    python post.py run  episodes/<slug>.json      YouTube: upload now, scheduled with publishAt;
                                                  Instagram/TikTok: post the items that are due
    python post.py run  episodes/<slug>.json --now   post Instagram/TikTok items immediately
    python post.py due                            run every plan in episodes/ (for an hourly routine)

What was posted is recorded in state.json, so nothing is posted twice.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from common import ET, PublishError, log, parse_et

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
STATE = HERE / 'state.json'


def load_state():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save_state(state):
    STATE.write_text(json.dumps(state, indent=2) + '\n')


def text_of(item, key):
    """A field can be given inline or as '<key>_file' (path relative to the repo)."""
    if item.get(f'{key}_file'):
        return (ROOT / item[f'{key}_file']).read_text().strip()
    return item.get(key, '')


def validate(plan):
    problems = []
    for i, it in enumerate(plan['items']):
        p = it.get('platform')
        if p not in ('youtube', 'instagram', 'tiktok'):
            problems.append(f'item {i}: unknown platform {p}')
            continue
        for k in ('file', 'thumbnail', 'captions'):
            if it.get(k) and not (ROOT / it[k]).exists():
                problems.append(f'item {i} ({p}): missing {k} {it[k]}')
        if p == 'youtube' and not it.get('title'):
            problems.append(f'item {i}: YouTube needs a title')
        if p == 'youtube' and len(it.get('title', '')) > 100:
            problems.append(f'item {i}: YouTube title over 100 characters')
        if p == 'instagram' and len(text_of(it, 'caption')) > 2200:
            problems.append(f'item {i}: Instagram caption over 2,200 characters')
        if it.get('publish_at_et'):
            parse_et(it['publish_at_et'])
    return problems


def frame0_cover(video, slug):
    """Shorts covers are frame 0 by design (brand rule). Export it as a JPEG when the plan names no thumbnail."""
    import subprocess
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                            '-of', 'csv=p=0', video], capture_output=True, text=True)
    w, h = (int(x) for x in probe.stdout.strip().split(',')[:2])
    if h <= w:
        return None  # landscape videos need a designed thumbnail in the plan
    out = HERE / 'episodes' / slug / 'cover.jpg'
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-frames:v', '1', '-vf', 'scale=1080:1920:flags=lanczos',
                    '-q:v', '3', str(out)], check=True)
    return str(out)


def key(plan, i):
    return f"{plan['slug']}#{i}:{plan['items'][i]['platform']}"


def do_plan(path):
    plan = json.loads(Path(path).read_text())
    problems = validate(plan)
    state = load_state()
    print(f"Episode: {plan['slug']}")
    for i, it in enumerate(plan['items']):
        when = it.get('publish_at_et', 'now')
        done = state.get(key(plan, i))
        size = os.path.getsize(ROOT / it['file']) / 1e6 if (ROOT / it['file']).exists() else 0
        print(f"  {it['platform']:9s} {when:16s} ET  {it['file']} ({size:.1f} MB)  {'POSTED ' + str(done) if done else ''}")
    print('\n'.join(['Problems:'] + problems) if problems else 'Plan is valid.')
    return plan, problems


def do_run(path, now=False):
    plan, problems = do_plan(path)
    if problems:
        raise PublishError('fix the plan first')
    state = load_state()
    t_now = datetime.now(timezone.utc)
    for i, it in enumerate(plan['items']):
        k = key(plan, i)
        if state.get(k):
            continue
        p = it['platform']
        when = parse_et(it['publish_at_et']) if it.get('publish_at_et') else None
        video = str(ROOT / it['file'])
        if p == 'youtube':
            import youtube
            publish_at = when.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ') if when and when > t_now else None
            vid = youtube.upload(video, it['title'], text_of(it, 'description'), it.get('tags', []), publish_at)
            thumb = str(ROOT / it['thumbnail']) if it.get('thumbnail') else frame0_cover(video, plan['slug'])
            if thumb:
                youtube.set_thumbnail(vid, thumb)
            if it.get('captions'):
                youtube.add_captions(vid, str(ROOT / it['captions']))
            if text_of(it, 'comment'):
                youtube.comment(vid, text_of(it, 'comment'))
                log('YouTube: comment posted - pin it in YouTube Studio')
            state[k] = {'id': vid, 'url': f'https://youtu.be/{vid}', 'scheduled_for_et': it.get('publish_at_et')}
        elif now or not when or when <= t_now:
            if p == 'instagram':
                import instagram
                state[k] = {'id': instagram.post_reel(video, text_of(it, 'caption'), it.get('thumb_offset_ms', 0))}
            else:
                import tiktok
                state[k] = {'publish_id': tiktok.post_video(video, text_of(it, 'caption'), it.get('privacy'))}
            state[k]['posted_at_et'] = datetime.now(ET).strftime('%Y-%m-%d %H:%M')
        else:
            log(f'{p}: not due until {it["publish_at_et"]} ET')
            continue
        save_state(state)


def do_check():
    for name in ('youtube', 'instagram', 'tiktok'):
        try:
            mod = __import__(name)
            if name == 'tiktok':
                info = mod.creator_info(mod.access_token())
                who = f"{info.get('creator_username')} (privacy options: {info.get('privacy_level_options')})"
            else:
                who = mod.whoami()
            print(f'{name:9s} OK  {who}')
        except Exception as e:  # report every platform, not just the first failure
            print(f'{name:9s} NOT READY  {e}')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    args = sys.argv[1:]
    try:
        if args[:1] == ['check']:
            do_check()
        elif args[:1] == ['plan'] and len(args) == 2:
            do_plan(args[1])
        elif args[:1] == ['run'] and len(args) >= 2:
            do_run(args[1], now='--now' in args)
        elif args[:1] == ['due']:
            for f in sorted((HERE / 'episodes').glob('*.json')):
                do_run(str(f))
        else:
            sys.exit(__doc__)
    except PublishError as e:
        sys.exit(f'ERROR: {e}')
