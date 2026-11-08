# Production (differences from Lab Logic)

Pipeline, commands, QA and render settings are the same as `.claude/skills/lab-logic/references/production.md`.

- Episode code: copy `video/src/dance/` (Main.tsx, timing.ts with `ph()`, words.json) and import the kit from
  `video/src/hollow/kit.tsx` and captions from `video/src/hollow/Captions.tsx` (`buildGroups(words, merges)`).
- Register the composition and a `<Still>` cover in `video/src/Root.tsx` (Dance / DanceCover).
- Voice: `python3 video/images/dance/scripts/voice.py KEEP TEMPO` (edit `VO` for the new episode) -> vo.wav +
  words.json; copy words.json into the episode's src folder.
- Sound effects: ElevenLabs `creative_generate_in_flow` sfx on the episode flow; they come back 1-6 s long, so the
  loop code in the episode notes (`video/images/dance/notes.md`) builds 30-75 s beds with crossfades.
- Textures: `video/public/hollow/grain.png` (moving film grain), `paper.png` (unused so far).
- Scenes: one idea per scene, camera always drifting, blink cut between scenes (`CUTS` in Main.tsx).
- Titles must fit (Title auto-fits); notes must stay clear of the caption band (y 1440-1560).
- Render 4K: `npx remotion render src/index.ts <Comp> out/<ep>/<ep>-raw.mp4 --scale=2 --image-format=png --crf=16
  --pixel-format=yuv420p --concurrency=4 --browser-executable=<chromium>` with `run_in_background`, then two-pass
  loudnorm to −14 LUFS, then a 1080x1920 copy for `publish/outbox/`.
