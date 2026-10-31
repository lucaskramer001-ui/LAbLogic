"""YouTube Data API v3: resumable upload with scheduled publishing, thumbnail, captions and a first comment.

Credentials (environment): YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (scope youtube.upload +
youtube.force-ssl). Until Google audits the API project, uploads are locked to private.
"""
import json
import os

import requests

from common import PublishError, check, env, log

TOKEN_URL = 'https://oauth2.googleapis.com/token'
API = 'https://www.googleapis.com/youtube/v3'
UPLOAD = 'https://www.googleapis.com/upload/youtube/v3'


def access_token() -> str:
    r = requests.post(TOKEN_URL, data={
        'client_id': env('YT_CLIENT_ID'),
        'client_secret': env('YT_CLIENT_SECRET'),
        'refresh_token': env('YT_REFRESH_TOKEN'),
        'grant_type': 'refresh_token',
    }, timeout=30)
    return check(r, 'YouTube token refresh').json()['access_token']


def upload(video: str, title: str, description: str, tags: list, publish_at_utc: str | None = None,
           category_id: str = '28', made_for_kids: bool = False, language: str = 'en') -> str:
    """Upload a video. With publish_at_utc (RFC 3339) it stays private and goes public at that time."""
    tok = access_token()
    status = {'privacyStatus': 'private' if publish_at_utc else 'public', 'selfDeclaredMadeForKids': made_for_kids}
    if publish_at_utc:
        status['publishAt'] = publish_at_utc
    meta = {
        'snippet': {'title': title, 'description': description, 'tags': tags, 'categoryId': category_id,
                    'defaultLanguage': language, 'defaultAudioLanguage': language},
        'status': status,
    }
    size = os.path.getsize(video)
    r = requests.post(f'{UPLOAD}/videos?uploadType=resumable&part=snippet,status', headers={
        'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': str(size), 'X-Upload-Content-Type': 'video/mp4',
    }, data=json.dumps(meta), timeout=60)
    session = check(r, 'YouTube upload start').headers['Location']
    log(f'YouTube: uploading {size / 1e6:.1f} MB')
    with open(video, 'rb') as f:
        r = requests.put(session, headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'video/mp4'}, data=f, timeout=3600)
    video_id = check(r, 'YouTube upload').json()['id']
    log(f'YouTube: uploaded https://youtu.be/{video_id}')
    return video_id


def set_thumbnail(video_id: str, image: str):
    tok = access_token()
    with open(image, 'rb') as f:
        r = requests.post(f'{UPLOAD}/thumbnails/set?videoId={video_id}', headers={
            'Authorization': f'Bearer {tok}', 'Content-Type': 'image/png' if image.endswith('.png') else 'image/jpeg'}, data=f, timeout=300)
    check(r, 'YouTube thumbnail (needs a verified channel)')


def add_captions(video_id: str, srt: str, language: str = 'en', name: str = 'English'):
    tok = access_token()
    meta = {'snippet': {'videoId': video_id, 'language': language, 'name': name}}
    boundary = 'lablogicboundary'
    body = (f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{json.dumps(meta)}\r\n'
            f'--{boundary}\r\nContent-Type: application/octet-stream\r\n\r\n').encode() + open(srt, 'rb').read() + f'\r\n--{boundary}--'.encode()
    r = requests.post(f'{UPLOAD}/captions?uploadType=multipart&part=snippet', headers={
        'Authorization': f'Bearer {tok}', 'Content-Type': f'multipart/related; boundary={boundary}'}, data=body, timeout=300)
    check(r, 'YouTube captions')


def comment(video_id: str, text: str) -> str:
    """Post a top-level comment as the channel. Pinning it has to be done by hand in YouTube Studio."""
    tok = access_token()
    body = {'snippet': {'videoId': video_id, 'topLevelComment': {'snippet': {'textOriginal': text}}}}
    r = requests.post(f'{API}/commentThreads?part=snippet', headers={'Authorization': f'Bearer {tok}'}, json=body, timeout=60)
    return check(r, 'YouTube comment').json()['id']


def whoami() -> dict:
    tok = access_token()
    r = requests.get(f'{API}/channels?part=snippet&mine=true', headers={'Authorization': f'Bearer {tok}'}, timeout=30)
    items = check(r, 'YouTube channel lookup').json().get('items', [])
    if not items:
        raise PublishError('no YouTube channel on this account')
    return {'id': items[0]['id'], 'title': items[0]['snippet']['title']}
