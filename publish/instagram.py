"""Instagram API with Instagram Login: publish a Reel from a local file (resumable upload).

Credentials (environment): IG_USER_ID, IG_ACCESS_TOKEN (long-lived, scope instagram_business_basic +
instagram_business_content_publish). Long-lived tokens last 60 days: run `python auth.py instagram-refresh`
before then and store the new token. Instagram has no scheduled publishing in the API - post.py posts when due.
"""
import os
import time

import requests

from common import PublishError, check, env, log

GRAPH = 'https://graph.instagram.com'
VERSION = os.environ.get('IG_API_VERSION', 'v23.0')


def whoami() -> dict:
    r = requests.get(f'{GRAPH}/{VERSION}/me', params={'fields': 'user_id,username', 'access_token': env('IG_ACCESS_TOKEN')}, timeout=30)
    return check(r, 'Instagram account lookup').json()


def post_reel(video: str, caption: str, thumb_offset_ms: int = 0, share_to_feed: bool = True) -> str:
    tok, uid = env('IG_ACCESS_TOKEN'), env('IG_USER_ID')
    r = requests.post(f'{GRAPH}/{VERSION}/{uid}/media', data={
        'media_type': 'REELS', 'upload_type': 'resumable', 'caption': caption,
        'share_to_feed': 'true' if share_to_feed else 'false', 'thumb_offset': str(thumb_offset_ms), 'access_token': tok,
    }, timeout=60)
    created = check(r, 'Instagram container').json()
    container, uri = created['id'], created['uri']
    size = os.path.getsize(video)
    log(f'Instagram: uploading {size / 1e6:.1f} MB')
    with open(video, 'rb') as f:
        r = requests.post(uri, headers={'Authorization': f'OAuth {tok}', 'offset': '0', 'file_size': str(size)}, data=f, timeout=3600)
    check(r, 'Instagram upload')
    for _ in range(120):  # up to ~10 minutes of processing
        r = requests.get(f'{GRAPH}/{VERSION}/{container}', params={'fields': 'status_code,status', 'access_token': tok}, timeout=30)
        st = check(r, 'Instagram status').json()
        if st.get('status_code') == 'FINISHED':
            break
        if st.get('status_code') in ('ERROR', 'EXPIRED'):
            raise PublishError(f'Instagram processing failed: {st}')
        time.sleep(5)
    else:
        raise PublishError('Instagram processing timed out')
    r = requests.post(f'{GRAPH}/{VERSION}/{uid}/media_publish', data={'creation_id': container, 'access_token': tok}, timeout=60)
    media_id = check(r, 'Instagram publish').json()['id']
    log(f'Instagram: published media {media_id}')
    return media_id
