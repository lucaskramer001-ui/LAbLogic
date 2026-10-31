# Titles, descriptions, tags, platforms, posting

## Before writing
- Write 3 search queries the video should win; the title and the first two description lines must contain their words.
- Only facts that are in the video and its sources. Source links go in the description.
- End each packaging answer with: **Ship it, or change it?** (the user's preferred close, from the yt-seo skill).

## Title
- The question in the "Why Don't We Just…?" format, ≤ ~60 characters, title case.
- Examples: "Why Don't We Just Tow an Iceberg for Water?" (Short), "Why Don't We Just Fire Our Trash Into the Sun?" (long).
- The thumbnail text adds the surprise; the title asks the question.

## Description template
```
<Line 1: the question + the scale/setup, with the search words.>
<Line 2: the surprising mechanism in one sentence, with the key numbers.>

<Chapters for long-form: 0:00 first, ≥3 chapters, from the word timings>

Sources you can check:
<Source title>: <URL>
...

Lab Logic: obvious fixes, surprising answers.

#shorts #science #<topic>        (long-form: #science #<topic> #<topic>)
```

## Tags
10-15 tags, < 500 characters: spellings and phrasings people search ("tow an iceberg", "towing icebergs"),
the topic's entities (Parker Solar Probe, Falcon Heavy, Cape Town water crisis), "why don't we just", "Lab Logic",
"science shorts"/"science animation". No unrelated tags.

## Pinned comment (long-form)
A question that invites answers plus one extra fact, e.g. "What 'obvious fix' should we test next? (Bonus: it's
easier to throw something out of the solar system than to hit the Sun.)" The API can post it; pinning is manual.

## Subtitles
Long-form: upload the SRT in YouTube Studio → Subtitles → Upload file → With timing.

## Platform versions
| Platform | File | Notes |
|---|---|---|
| YouTube Shorts | 1080×1920 (rendered 4K), ≤ 3 min | cover = frame 0, `#shorts`, title ≤ 60 chars |
| TikTok | same, no watermark | captions clear of the right-side buttons and bottom text, short hook caption, 3-5 hashtags |
| Instagram Reels | same | cover image 1080×1920 with grid-safe 3:4 centre, own caption |
| YouTube long-form | 1920×1080 60 fps | thumbnail, chapters, SRT, pinned comment; publish 1-3 days after the Short and link them |

## Posting (built: `publish/`, see publish/README.md)
- `python publish/post.py check | plan <plan.json> | run <plan.json> [--now] | due`. Plans live in
  `publish/episodes/<slug>.json` (+ text files for description/caption); posted items are recorded in
  `publish/state.json` so nothing posts twice.
- YouTube: resumable upload with `publishAt` (scheduled by YouTube), thumbnail, SRT captions, first comment
  (pin by hand). Unaudited API projects upload private only - the audit was to be requested by the user.
- Instagram: Reels via Instagram API with Instagram Login (resumable upload, then publish); no API scheduling, so
  `post.py` posts when due. Token lasts 60 days (`auth.py instagram-refresh`).
- TikTok: Content Posting API Direct Post (FILE_UPLOAD in 5-64 MB chunks); private (SELF_ONLY) until the app passes
  review/audit.
- Credentials only as environment variables (YT_*, IG_*, TIKTOK_*); the user runs `publish/auth.py` on their own
  computer so tokens never appear in chat. Instagram/TikTok files go in `publish/outbox/` (1080x1920, committed,
  < 100 MB) so scheduled sessions can reach them.
- Audience time zone: **US Eastern** (confirmed). Default slots: Shorts Tue/Thu/Sat 12:00 YouTube, 18:00 TikTok,
  19:00 Instagram; long-form Sat/Sun 10:00, 1-3 days after the Short. Adjust from analytics after 3-4 weeks.
