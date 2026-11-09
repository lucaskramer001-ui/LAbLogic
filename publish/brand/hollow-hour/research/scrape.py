import re, json, sys, subprocess, statistics, os
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
def page(url):
    return subprocess.run(['curl', '-s', '-m', '25', '-A', UA, '-H', 'Accept-Language: en-US,en;q=0.9', '-b', 'CONSENT=YES+1', url], capture_output=True, text=True).stdout
def initial(html):
    m = re.search(r'ytInitialData = (\{.*?\});</script>', html)
    return json.loads(m.group(1)) if m else {}
def num(t):
    t = t.replace(',', '').strip()
    m = re.match(r'([\d.]+)\s*(thousand|million|billion|K|M|B)?', t, re.I)
    if not m: return 0
    v = float(m.group(1)); u = (m.group(2) or '').lower()
    return int(v * {'thousand': 1e3, 'k': 1e3, 'million': 1e6, 'm': 1e6, 'billion': 1e9, 'b': 1e9}.get(u, 1))
def find(o, key, acc):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == key: acc.append(v)
            else: find(v, key, acc)
    elif isinstance(o, list):
        for x in o: find(x, key, acc)
    return acc
def channel(h):
    sh = initial(page(f'https://www.youtube.com/@{h}/shorts'))
    if not sh: return None
    meta = json.dumps(sh)
    subs = re.search(r'"content": "([\d.,]+[KMB]?) subscribers"', meta)
    desc = find(sh, 'description', [])
    title = find(sh, 'pageTitle', [])
    shorts = []
    for s in find(sh, 'shortsLockupViewModel', []):
        a = s.get('accessibilityText', '')
        m = re.match(r'(.*), ([\d.,]+ ?(?:thousand|million|billion)?) views', a)
        vid = s.get('onTap', {}).get('innertubeCommand', {}).get('reelWatchEndpoint', {}).get('videoId')
        if m: shorts.append({'id': vid, 'title': m.group(1), 'views': num(m.group(2))})
    vd = initial(page(f'https://www.youtube.com/@{h}/videos'))
    longs = []
    for v in find(vd, 'videoRenderer', []):
        t = ''.join(r.get('text', '') for r in v.get('title', {}).get('runs', []))
        vc = v.get('viewCountText', {}).get('simpleText', '0')
        longs.append({'id': v.get('videoId'), 'title': t, 'views': num(vc), 'age': v.get('publishedTimeText', {}).get('simpleText', ''), 'len': v.get('lengthText', {}).get('simpleText', '')})
    return {'handle': h, 'title': title[0] if title else h, 'subs': subs.group(1) if subs else '?', 'desc': (desc[0] if desc and isinstance(desc[0], str) else ''), 'shorts': shorts, 'long': longs}
if __name__ == '__main__':
    out = {}
    for h in sys.argv[1].split(','):
        c = channel(h)
        if not c: print('missing', h); continue
        out[h] = c
        ms = statistics.median([x['views'] for x in c['shorts']]) if c['shorts'] else 0
        ml = statistics.median([x['views'] for x in c['long']]) if c['long'] else 0
        print(f"{h:22s} {c['subs']:>7s}  shorts {len(c['shorts']):2d} med {int(ms):>9,}   long {len(c['long']):2d} med {int(ml):>9,}")
    json.dump(out, open(sys.argv[2], 'w'), indent=1)
