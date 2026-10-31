# Automation plan (agreed direction, not built yet)

Goal: from one idea to a Short + platform versions + a 5-7 min long-form + thumbnails, metadata and scheduled
posts, with two short human checkpoints (approve script/facts, approve preview).

| Step | Automatable | Manual part |
|---|---|---|
| Script | ~95% | approve topic + facts |
| Pictures, animation, render | ~80% now, ~90% with a scene library | look at the preview sheet |
| Thumbnail, title, description, tags | ~95% | pick a thumbnail |
| Shorts / TikTok / Reels versions | ~100% | - |
| Posting + timing | ~90% | account/API setup once; pinning the YouTube comment |
| Long-form from the same idea | ~80% | preview check |

## Architecture
Each idea is an episode folder that moves through stages, each writing files the next reads:
```
episodes/<slug>/
  research.md + script.json      topic, sources, Short + long scripts
  vo/                            voice takes, vo.wav, words.json
  storyboard.json                scenes (type, props, labels, poses, word cues)
  assets/                        new Higgsfield cut-outs (only if needed)
  renders/                       short 1080x1920, long 1920x1080, QA report
  package/                       thumbnails, titles, descriptions, tags, SRT, chapters, pinned comment, captions
  schedule.json                  per-platform publish times
```
A Claude Code routine (scheduled cloud session) runs research → package and opens a pull request with the
preview; merging it is the approval; a GitHub Action renders the finals and publishes on schedule.

## Build order
1. Episode pipeline: folders, script, voice, timing, QA, packaging (1-2 sessions).
2. Scene library + storyboard renderer from the iceberg and Sun scenes (3-5 sessions) - the biggest piece.
3. Long-form generator reusing 1 and 2 (1-2 sessions).
4. Publishing: YouTube Data API (`publishAt`; request the API audit - unaudited projects upload private only) +
   a scheduler with approved TikTok/Instagram access (Buffer, Metricool, Publer) (1-2 sessions + approvals).
5. Weekly analytics routine: best posting times, which hooks/thumbnails won (1 session).

## Needed from the user
ElevenLabs and Higgsfield API keys as GitHub secrets (connectors only work in chat sessions), a Google Cloud project
with the YouTube Data API, a scheduler account or TikTok developer app + Instagram Business account, posting
cadence, audience time zone, and whether to keep the two approval checkpoints.

## Risks
YouTube's "inauthentic / mass-produced content" rules - keep research original, topics new, scenes varied.
Rough cost per episode: ~1,500 ElevenLabs credits (Short), ~6,000 (long-form), 10-40 Higgsfield credits.
