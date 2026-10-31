"""One-time sign-in helper. Run it on YOUR computer (not in the cloud session), so tokens never pass through chat:

    pip install requests
    python auth.py youtube             -> prints YT_REFRESH_TOKEN
    python auth.py instagram           -> prints IG_USER_ID and a 60-day IG_ACCESS_TOKEN
    python auth.py instagram-refresh   -> prints a fresh IG_ACCESS_TOKEN (do this every ~50 days)
    python auth.py tiktok              -> prints TIKTOK_REFRESH_TOKEN

Then store the printed values as environment variables in the cloud environment settings.
"""
import getpass
import http.server
import secrets
import sys
import threading
import urllib.parse
import webbrowser

import requests


def ask(prompt, secret=False):
    return (getpass.getpass(prompt) if secret else input(prompt)).strip()


def code_from_pasted_url(state=None):
    url = ask('After approving, paste the full URL your browser was sent to: ')
    q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    if state and q.get('state', [''])[0] != state:
        sys.exit('state mismatch - start again')
    if 'code' not in q:
        sys.exit(f'no code in that URL: {q}')
    return q['code'][0]


def youtube():
    print('Google Cloud Console -> APIs & Services -> Credentials -> your OAuth client (type: Desktop app).')
    cid = ask('YT_CLIENT_ID: ')
    csec = ask('YT_CLIENT_SECRET: ', secret=True)
    port = 8765
    redirect = f'http://localhost:{port}'
    state = secrets.token_urlsafe(16)
    got = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            got.update(urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query))
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'Lab Logic: signed in. You can close this tab.')

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(('localhost', port), Handler)
    threading.Thread(target=srv.handle_request, daemon=True).start()
    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode({
        'client_id': cid, 'redirect_uri': redirect, 'response_type': 'code', 'state': state,
        'scope': 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
        'access_type': 'offline', 'prompt': 'consent'})
    print('Opening the Google sign-in page. Choose the account that owns the Lab Logic channel.\n' + url)
    webbrowser.open(url)
    while not got:
        pass
    if got.get('state', [''])[0] != state:
        sys.exit('state mismatch - start again')
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': cid, 'client_secret': csec, 'code': got['code'][0], 'redirect_uri': redirect, 'grant_type': 'authorization_code'})
    r.raise_for_status()
    print('\nStore these as environment variables:\n  YT_CLIENT_ID      =', cid, '\n  YT_CLIENT_SECRET  = (the secret you entered)\n  YT_REFRESH_TOKEN  =', r.json()['refresh_token'])


def instagram():
    print('Meta app -> Instagram -> API setup with Instagram login. Add your redirect URL there first.')
    app_id = ask('Instagram app ID: ')
    app_secret = ask('Instagram app secret: ', secret=True)
    redirect = ask('Redirect URL exactly as registered (https://...): ')
    state = secrets.token_urlsafe(16)
    url = 'https://www.instagram.com/oauth/authorize?' + urllib.parse.urlencode({
        'client_id': app_id, 'redirect_uri': redirect, 'response_type': 'code', 'state': state,
        'scope': 'instagram_business_basic,instagram_business_content_publish'})
    print('Open this, log in as the Lab Logic Instagram account and allow access:\n' + url)
    webbrowser.open(url)
    code = code_from_pasted_url(state).split('#')[0]
    r = requests.post('https://api.instagram.com/oauth/access_token', data={
        'client_id': app_id, 'client_secret': app_secret, 'grant_type': 'authorization_code', 'redirect_uri': redirect, 'code': code})
    r.raise_for_status()
    short = r.json()
    r = requests.get('https://graph.instagram.com/access_token', params={
        'grant_type': 'ig_exchange_token', 'client_secret': app_secret, 'access_token': short['access_token']})
    r.raise_for_status()
    long_lived = r.json()
    print('\nStore these as environment variables:\n  IG_USER_ID      =', short['user_id'], '\n  IG_ACCESS_TOKEN =', long_lived['access_token'],
          f"\n(expires in about {int(long_lived.get('expires_in', 0)) // 86400} days - refresh with `python auth.py instagram-refresh`)")


def instagram_refresh():
    tok = ask('Current IG_ACCESS_TOKEN: ', secret=True)
    r = requests.get('https://graph.instagram.com/refresh_access_token', params={'grant_type': 'ig_refresh_token', 'access_token': tok})
    r.raise_for_status()
    print('\nNew IG_ACCESS_TOKEN =', r.json()['access_token'])


def tiktok():
    print('TikTok for Developers -> your app -> Login Kit + Content Posting API (Direct Post on). Register the redirect URL first.')
    key = ask('TIKTOK_CLIENT_KEY: ')
    sec = ask('TIKTOK_CLIENT_SECRET: ', secret=True)
    redirect = ask('Redirect URL exactly as registered (https://...): ')
    state = secrets.token_urlsafe(16)
    url = 'https://www.tiktok.com/v2/auth/authorize/?' + urllib.parse.urlencode({
        'client_key': key, 'scope': 'user.info.basic,video.publish', 'response_type': 'code', 'redirect_uri': redirect, 'state': state})
    print('Open this, log in as the Lab Logic TikTok account and allow access:\n' + url)
    webbrowser.open(url)
    code = code_from_pasted_url(state)
    r = requests.post('https://open.tiktokapis.com/v2/oauth/token/', data={
        'client_key': key, 'client_secret': sec, 'code': code, 'grant_type': 'authorization_code', 'redirect_uri': redirect},
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    r.raise_for_status()
    data = r.json()
    if 'refresh_token' not in data:
        sys.exit(f'TikTok error: {data}')
    print('\nStore these as environment variables:\n  TIKTOK_CLIENT_KEY     =', key, '\n  TIKTOK_CLIENT_SECRET  = (the secret you entered)\n  TIKTOK_REFRESH_TOKEN  =', data['refresh_token'],
          f"\n(refresh token valid for about {int(data.get('refresh_expires_in', 0)) // 86400} days)")


if __name__ == '__main__':
    cmds = {'youtube': youtube, 'instagram': instagram, 'instagram-refresh': instagram_refresh, 'tiktok': tiktok}
    if len(sys.argv) != 2 or sys.argv[1] not in cmds:
        sys.exit(__doc__)
    cmds[sys.argv[1]]()
