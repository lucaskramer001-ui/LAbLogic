---
name: hollow-hour
description: Everything needed to produce content for Hollow Hour, the mystical / creepy / scary Shorts channel (true dark history, myths and legends, experiments on humans, hoaxes and creepypastas) on YouTube Shorts, Instagram Reels and TikTok - brand, papercut shadow-puppet look, narrator voice, hypnotic-hook and loop script rules, fact-check sheet, the Remotion + ElevenLabs pipeline (shared with Lab Logic), covers, titles, descriptions, tags and posting. Use this skill whenever the user asks for a new Hollow Hour video, a creepy/scary/mystery Short, a dark history or myth script, an "experiments on humans" story, a horror narration or voice, or mentions the dancing plague episode or the new creepy channel - even if they don't say "Hollow Hour".
---

# Hollow Hour production skill

Hollow Hour is a dark-history Shorts channel: **real records, unreal stories.** Strange events from history, the
legends people believed, experiments done on humans, and famous hoaxes - told in a calm, cold voice over a
papercut shadow-puppet animation that pulls you in and loops.

It is a sister channel of Lab Logic and reuses its pipeline (`video/`, ElevenLabs flows, Remotion, QA, render,
packaging, posting). Read `.claude/skills/lab-logic/references/production.md` and `lessons.md` for the shared
machinery; this skill holds what is different.

## Where things are
| What | Where |
|---|---|
| Brand: name, palette, type, puppet look, voice, covers, bios | `references/brand.md` |
| Topics, research and fact-check rules (Strategos-style verification) | `references/research.md` |
| Script rules: hypnotic hook, loop ending, word counts | `references/scripts.md` |
| Production differences from Lab Logic (kit, puppets, sound, render) | `references/production.md` |
| Title, description, tags, platform captions | `references/packaging.md` |
| Episodes made, topics used, costs, lessons | `references/episodes.md` |
| Shared kit (palette, Puppet, Town, Glow, Spiral, Title, Seal, Overlay) | `video/src/hollow/kit.tsx`, captions `video/src/hollow/Captions.tsx` |
| First episode (reference implementation) | `video/src/dance/Main.tsx` |

## Workflow at a glance
1. **Topic** (`research.md`): pick from the four pillars, rotate them, check `episodes.md` for repeats.
2. **Research + fact-check sheet** (`research.md`): every claim gets a source and a confidence level
   (confirmed / disputed / legend). Disputed numbers are said as disputed in the voice-over.
3. **Script** (`scripts.md`): 190-230 words, hypnotic first line, last line echoes the first so the Short loops.
4. **Voice**: ElevenLabs, **Jack - Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`), `eleven_v4`, 1 take; Scribe
   on the same flow; `video/images/dance/scripts/voice.py 0.38 1.1` (pauses capped 0.38 s, atempo 1.1).
5. **Sound**: drone bed + heartbeat + bell + whoosh + scene sounds (ElevenLabs sfx, ~17 credits each).
6. **Animation**: copy `video/src/dance/Main.tsx`, keep the kit. Silhouettes must always stand against light.
7. **QA**: contact sheets of every scene (`COMP=<id> REBUNDLE=1 node scripts/stills.mjs ...`), look at them.
8. **Render** 4K (`--scale=2`), −14 LUFS, verify, cover still → `publish/episodes/<slug>/cover.jpg`.
9. **Package** (`packaging.md`), record the episode in `episodes.md`, commit and push.

## Things that matter most
- **Truth first, then chills.** Legends are called legends, disputed numbers are called disputed, hoaxes are
  revealed as hoaxes. The creepiness comes from what really happened and what people believed.
- **No gore, no real victims mocked.** Experiments on humans are told with respect for the people they were done to
  (name the harm, not the details). Keeps the channel inside YouTube's violent/graphic content rules.
- **The hook hypnotises:** a specific date, place and one strange action in the first sentence; a slow, never-stopping
  camera; a single figure in a halo of light; a heartbeat on the key word.
- **The loop:** the last sentence repeats the first and the last shot matches the first frame.
