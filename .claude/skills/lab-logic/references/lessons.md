# Lessons learned (mistakes already made - don't repeat them)

## Layout and text
- **Labels out of frame / overlapping** was the user's main complaint on the first long-form render. Causes:
  pills placed near edges, pop-in overshoot (~1.12×) pushing them out, camera zoom/pan moving them, and two pills
  sharing a spot at different moments that overlap during transitions. Fix: run the layout check (production.md §5)
  and keep ≥ 60 px margin after overshoot. Labels tied to moving objects (Earth on its orbit) should sit at fixed
  screen positions instead.
- **Pill width from character count is wrong** - text spilled out of pills. Use `textWidth()` (real Montserrat
  advance widths from `fontWidths.json`) + 1.4 × font size padding.
- **Montserrat lacks `≈` and `→`** - they rendered in a fallback font. Write words instead.
- Labels inside a zoomed `Stage` get zoomed too; put fixed labels in a screen-space layer outside the Stage.
- During camera pans, shrink labels away before the pan starts and pop new ones after it ends.
- Labels must not sit on the Sun, planets or the scientist - tag objects `data-obj` so the check sees them.
- Captions (Shorts): word gap 58 px, auto-fit to 1000 px width; group ≤ 3 words and ≤ 13 characters.

## Timing
- `at(word, nth)` occurrence counting is error-prone (e.g. "the" #7 vs #9). Prefer `ph('phrase', after)`.
- Phrase lookups must match apostrophes: "keeps the train's", "and here's".
- Validate every phrase before rendering (a missing phrase throws at bundle time) - quick Python check over
  `words.json` lists any phrase that isn't found.

## Voice / audio
- ElevenLabs TTS max **5,000 characters per take**; the over-long take failed after the cost was shown.
- Tim Riley at natural pace ran 83.6 s for 228 words - trim pauses and use `atempo=1.1` for Shorts.
- Normalise final audio to −14 LUFS (raw mixes landed at −20 to −24 LUFS).

## Rendering
- A render started with `&` inside a normal Bash call was killed when the call returned; the old file was then
  "finished" by mistake. Use `run_in_background: true`, and check the output file's timestamp and frame count.
- `pgrep -f "remotion render"` matched its own waiting loop; wait on a log marker or the background task instead.
- Remotion GIF probe with `everyNthFrame 1` failed for 20k frames; use 2-3.
- 4 CPU cores: 1080p ≈ 30 fps of render speed for flat SVG scenes, 4K Short ≈ 7 fps.

## Pictures
- The brand cover's scientist holds a bomb (hurricane episode) - never use that crop as a pose; generate the hero.
- Shading/positions: when an animal must grip something, check its anatomy in the cut-out (claws were 140 px
  right of the beak tip) and adjust (tilt) instead of leaving feet floating.
- Rope/hand anchors: `prep.py` stores the rightmost opaque point; use `handAt()` so ropes start in the hand.

## Environment
- Higgsfield needs `upload.higgsfield.ai` and `*.cloudfront.net` allowed (environment → Edit → Network access).
  Network changes may only apply to new sessions.
- YouTube (www.youtube.com, i.ytimg.com), nature.com, whoi.edu, ncbi, astronomy.com were blocked; research via
  web search snippets and say so.
- Huggingface is blocked (no faster-whisper models) - use ElevenLabs Scribe for word timings.

## Communication
- The user writes in English and sometimes German; answer in the language of the message.
- They prefer concrete deliverables sent as files, honest notes on what wasn't verified, and options with a
  recommendation (thumbnail variants, title options).
