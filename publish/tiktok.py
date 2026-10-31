"""TikTok Content Posting API (Direct Post) from a local file.

Credentials (environment): TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REFRESH_TOKEN (scope video.publish).
Until TikTok audits the app, only privacy level SELF_ONLY is allowed (the post is visible to you only).
"""
import math
import os
import time

import requests

from common import PublishError, check, env, log

API = 'https://open.tiktokapis.com/v2'
MB = 1024 * 1024


def access_token() -> str:
    r = requests.post(f'{API}/oauth/token/', data={
        'client_key': env('TIKTOK_CLIENT_KEY'), 'client_secret': env('TIKTOK_CLIENT_SECRET'),
        'grant_type': 'refresh_token', 'refresh_token': env('TIKTOK_REFRESH_TOKEN'),
    }, headers={'Content-Type': 'application/x-www-form-urlencoded'}, timeout=30)
    data = check(r, 'TikTok token refresh').json()
    if 'access_token' not in data:
        raise PublishError(f'TikTok token refresh failed: {data.get("error")} {data.get("error_description")}')
    if data.get('refresh_token') and data['refresh_token'] != os.environ.get('TIKTOK_REFRESH_TOKEN'):
        log('TikTok issued a new refresh token: run `python auth.py tiktok-show-refresh` locally and update TIKTOK_REFRESH_TOKEN')
    return data['access_token']


def creator_info(tok: str) -> dict:
    r = requests.post(f'{API}/post/publish/creator_info/query/', headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json; charset=UTF-8'}, timeout=30)
    data = check(r, 'TikTok creator info').json()
    if data.get('error', {}).get('code') not in (None, 'ok'):
        raise PublishError(f'TikTok creator info: {data["error"]}')
    return data['data']


def post_video(video: str, caption: str, privacy: str | None = None) -> str:
    tok = access_token()
    info = creator_info(tok)
    options = info.get('privacy_level_options', [])
    privacy = privacy or ('PUBLIC_TO_EVERYONE' if 'PUBLIC_TO_EVERYONE' in options else 'SELF_ONLY')
    if privacy not in options:
        raise PublishError(f'TikTok privacy {privacy} not allowed for this app/account (allowed: {options})')
    size = os.path.getsize(video)
    # chunks of 5-64 MB; a file up to 64 MB goes in one chunk, the last chunk absorbs the remainder
    chunk = size if size <= 64 * MB else 10 * MB
    count = max(1, math.floor(size / chunk))
    body = {
        'post_info': {'title': caption[:2200], 'privacy_level': privacy, 'disable_duet': False, 'disable_comment': False,
                      'disable_stitch': False, 'video_cover_timestamp_ms': 0},
        'source_info': {'source': 'FILE_UPLOAD', 'video_size': size, 'chunk_size': chunk, 'total_chunk_count': count},
    }
    r = requests.post(f'{API}/post/publish/video/init/', headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json; charset=UTF-8'}, json=body, timeout=60)
    data = check(r, 'TikTok init').json()
    if data.get('error', {}).get('code') not in (None, 'ok'):
        raise PublishError(f'TikTok init: {data["error"]}')
    publish_id, upload_url = data['data']['publish_id'], data['data']['upload_url']
    log(f'TikTok: uploading {size / 1e6:.1f} MB in {count} chunk(s) as {privacy}')
    with open(video, 'rb') as f:
        for i in range(count):
            start = i * chunk
            end = size - 1 if i == count - 1 else start + chunk - 1
            f.seek(start)
            part = f.read(end - start + 1)
            r = requests.put(upload_url, headers={'Content-Type': 'video/mp4', 'Content-Length': str(len(part)),
                                                  'Content-Range': f'bytes {start}-{end}/{size}'}, data=part, timeout=1800)
            check(r, f'TikTok chunk {i + 1}/{count}')
    for _ in range(120):
        r = requests.post(f'{API}/post/publish/status/fetch/', headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json; charset=UTF-8'},
                          json={'publish_id': publish_id}, timeout=30)
        st = check(r, 'TikTok status').json().get('data', {})
        if st.get('status') == 'PUBLISH_COMPLETE':
            log('TikTok: published')
            return publish_id
        if st.get('status') == 'FAILED':
            raise PublishError(f'TikTok publish failed: {st.get("fail_reason")}')
        time.sleep(5)
    log('TikTok: still processing; check the TikTok app')
    return publish_id
