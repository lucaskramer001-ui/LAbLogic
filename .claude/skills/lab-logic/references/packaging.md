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

## Posting (see automation.md)
- YouTube Data API supports scheduled uploads (`publishAt`), but unaudited API projects can only upload private
  videos - request the audit early.
- TikTok and Instagram need app review / a Business account linked to a Facebook page; a scheduler with approved
  access (Buffer, Metricool, Publer) is the quickest route.
- Best times: start with sensible defaults, then read each platform's audience-activity analytics weekly.
- The user's audience time zone is not confirmed yet (assumed English-speaking/US) - ask.
