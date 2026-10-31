# Lab Logic publishing (YouTube, Instagram, TikTok)

Posts an episode from a plan file in `episodes/`. Times are **US Eastern**. Credentials come from environment
variables (cloud environment settings or your shell); nothing secret is stored in this repo.

```
python post.py check                        # credentials OK? which account?
python post.py plan episodes/iceberg.json   # dry run
python post.py run  episodes/iceberg.json   # YouTube scheduled now; IG/TikTok posted when due
python post.py due                          # all plans, for an hourly routine
```

| Variable | Platform |
|---|---|
| `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` | YouTube |
| `IG_USER_ID`, `IG_ACCESS_TOKEN` (60 days, refresh with `auth.py instagram-refresh`) | Instagram |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REFRESH_TOKEN` (about a year) | TikTok |

Network access the cloud environment needs: `oauth2.googleapis.com`, `www.googleapis.com` (already allowed),
`graph.instagram.com`, `rupload.facebook.com`, `graph.facebook.com`, `open.tiktokapis.com`.

Instagram and TikTok can't schedule through their APIs, so `post.py` posts them when they're due. Their video files
must be in the repo (`outbox/`, 1080×1920, < 100 MB) so a scheduled session can reach them. YouTube is uploaded right
away with `publishAt`, so its file can stay in `video/out/`.

## Setup: YouTube (about 15 minutes)
1. https://console.cloud.google.com → create a project "Lab Logic Publisher".
2. APIs & Services → Library → **YouTube Data API v3** → Enable.
3. Google Auth Platform / OAuth consent screen → External → app name "Lab Logic Publisher", your email → add
   scopes `youtube.upload` and `youtube.force-ssl` → add your Google account as a test user.
   Then **Publish app** (status "In production"): in "Testing" status refresh tokens expire after 7 days. The app
   stays unverified, which only means Google shows you a warning when you sign in yourself.
4. Credentials → Create credentials → OAuth client ID → **Desktop app** → note the client ID and secret.
5. On your computer: `pip install requests` and `python publish/auth.py youtube` → sign in with the account that
   owns the Lab Logic channel → store the three printed values as environment variables.
6. Request the **YouTube API audit** (YouTube API Services audit and quota extension form). Until it's approved,
   videos uploaded through the API are locked to private. Also verify the channel by phone (needed for custom
   thumbnails). An upload uses a large share of the default 10,000-unit daily quota, so a few uploads a day is the limit.

## Setup: Instagram (about 20 minutes, no review needed for your own account)
1. https://developers.facebook.com → My Apps → Create app → use case "Manage messaging & content on Instagram".
2. In the app: Instagram → **API setup with Instagram login**.
3. Easiest: under "Generate access tokens", add the Lab Logic Instagram (Professional) account, log in, and copy the
   generated token and the Instagram user ID → `IG_ACCESS_TOKEN`, `IG_USER_ID`.
   Alternative: set a redirect URL under "Set up Instagram business login" and run `python publish/auth.py instagram`.
4. The app can stay in development mode for posting to your own account.

## Setup: TikTok (about 30 minutes + review time)
1. https://developers.tiktok.com → Manage apps → create an app (platform **Web**). It needs an icon, description,
   **Terms of Service URL** and **Privacy Policy URL** (I can write and host simple pages if you don't have them).
2. Add products **Login Kit** (register an https redirect URL) and **Content Posting API** with **Direct Post** on.
   Scopes: `user.info.basic`, `video.publish`.
3. Use the app's **Sandbox** to test with the Lab Logic account, then run `python publish/auth.py tiktok` and store
   the printed values.
4. Submit the app for review (TikTok asks for a short demo video of the posting flow). Until the app is reviewed
   and audited, API posts can only be private (`SELF_ONLY`); `post.py` uses the best privacy level TikTok allows.

## Posting times (US Eastern, starting defaults)
| Format | Default slots | Why |
|---|---|---|
| YouTube Shorts | Tue/Thu/Sat 12:00 | lunch-break viewing; Shorts keep getting pushed for days |
| TikTok | same day 18:00 | evening is usually TikTok's busiest window |
| Instagram Reels | same day 19:00 | evening, staggered from TikTok |
| YouTube long-form | Sat or Sun 10:00, 1-3 days after the Short | weekend morning for longer watch sessions |
These are starting points, not measured for this channel. After 3-4 weeks, use each platform's audience-activity
analytics to move the slots.
