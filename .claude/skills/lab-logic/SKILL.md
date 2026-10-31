---
name: lab-logic
description: Everything needed to produce content for the Lab Logic cartoon-science channel (YouTube Shorts, Instagram Reels, TikTok and 5-7 minute YouTube videos) - brand kit, mascot, voice, script rules, the Remotion + Higgsfield + ElevenLabs production pipeline, thumbnails, titles, descriptions, tags and posting. Use this skill whenever the user asks for a new Lab Logic video, Short, script, topic idea, voiceover, animation, render, thumbnail, title, description, tags, hashtags, pinned comment, platform version or posting plan, or mentions the scientist mascot, the brand kit, "why don't we just...?" topics, or any earlier episode (iceberg, trash into the Sun, woodpecker, hurricane) - even if they don't say "Lab Logic".
---

# Lab Logic production skill

Lab Logic is a cartoon science channel. Every video asks **"Why don't we just…?"** about an obvious-sounding
fix and the scientist mascot finds out why it doesn't work. Tagline: **OBVIOUS FIXES. SURPRISING ANSWERS.**

This skill exists so nothing has to be rediscovered. It holds the brand, every reference picture and ID, the
working pipeline and the mistakes already made and fixed. Read the reference that matches the step you are on;
do not guess brand values or tool settings from memory.

## Where things are

| What | Where |
|---|---|
| Brand kit (colours, fonts, mascot, captions, covers, bios) | `references/brand.md`, original PDF in `assets/brand/` |
| Script rules + the user's original Short prompt | `references/scripts.md` |
| Voice, pictures, animation, sound, render, QA | `references/production.md` |
| Higgsfield prompts, reference IDs, pose list | `references/higgsfield.md` |
| Thumbnail system (MrBeast-style in the brand look) | `references/thumbnails.md` |
| Titles, descriptions, tags, chapters, SRT, platforms, posting | `references/packaging.md` |
| Mistakes already made and how they were fixed | `references/lessons.md` - read before rendering |
| Episodes made so far, topics used, costs | `references/episodes.md` |
| Plan for automating the whole pipeline | `references/automation.md` |
| Remotion project (all code, sprites, sounds, fonts) | `video/` in this repo |
| Helper scripts (voice, sprite prep, sfx, stills, layout QA) | `scripts/` (originals live in `video/`) |

## Workflow at a glance

1. **Topic + research** (`scripts.md`): pick a new "why don't we just…?" topic not in `episodes.md`, verify the
   central facts with primary sources (NASA, universities, World Bank, peer-reviewed papers), keep the sources.
2. **Script** (`scripts.md`): Short = 60-70 s, 190-230 words. Long-form = 5-7 min, ~900-1,100 words.
   Start straight with the question, no greeting, no hype, no call to action. Say plainly what you could not verify.
3. **Voice** (`production.md`): ElevenLabs, voice **Tim Riley** (`1gZSmkYVRMS8w1i4plmP`), model `eleven_v4`,
   1 take. Max 5,000 characters per take: split long scripts. Get word timings with Scribe on the same flow.
4. **Pictures** (`higgsfield.md`): reuse the 13 existing scientist poses in `video/public/iceberg/sci/`.
   Make new poses/objects with Higgsfield GPT Image 2.5 (4k, high, transparent), always with the hero picture as
   reference, then trim and measure with `scripts/prep.py`.
5. **Animation** (`production.md`): Remotion. Shorts 1080×1920 with brand captions; long-form 1920×1080.
   Objects with faces, flat colours, ink outlines, labels as pills, beats timed to words with `ph()`/`at()`.
6. **QA before every final render** (`lessons.md`): run the layout check (`scripts/layout-qa.mjs` +
   `layout_report.py`) until it reports nothing, then look at contact sheets of every scene.
7. **Render** at 60 fps (Shorts 4K via `--scale=2`, long-form 1080p), normalise audio to −14 LUFS, verify
   frame count, duration and audio, and pull a few frames from the final file to confirm the fixes are in it.
8. **Package** (`thumbnails.md`, `packaging.md`): thumbnail (2-3 options), title, description with chapters and
   sources, tags, hashtags, pinned comment, SRT, and platform captions for Shorts / Reels / TikTok.
9. **Commit and push** the project to the working branch so the next session can continue.

## Things that matter most

- **Brand first.** Colours, Montserrat Black/ExtraBold, ink outlines with hard shadows, the scientist as the only
  human, objects get simple faces. Details in `brand.md`.
- **Real facts only.** Every number in the voice-over, on screen or in a description must trace to a source in
  the episode's notes. Cartoon exaggeration is fine in what characters do, never in the facts.
- **Check, don't assume.** Labels that leave the frame or overlap were the user's main complaint on the first long
  video - the layout check exists because of that. A render that "finished" once turned out never to have run;
  always confirm the file's timestamp and frame count.
- **Show progress.** Send previews, contact sheets and final files with the file-sending tool as they are ready,
  and keep the user informed while long renders run.
- **Network.** This cloud environment needs `upload.higgsfield.ai` and `*.cloudfront.net` allowed for Higgsfield;
  YouTube itself is blocked (research titles/thumbnails from memory or ask the user for screenshots).
