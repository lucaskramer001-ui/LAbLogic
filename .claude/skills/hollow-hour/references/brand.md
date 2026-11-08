# Hollow Hour brand

## Identity
- **Name:** HOLLOW HOUR (working name, chosen 2026-11-08; handle availability not checked - ideas: @hollowhour,
  @hollowhour.tv, @thehollowhour). **Tagline:** REAL RECORDS. UNREAL STORIES.
- **Concept:** short, true, unsettling stories - dark history, legends, experiments on humans, hoaxes - told by a
  calm cold narrator over papercut shadow-puppet animation. Every Short loops.
- **Wordmark:** "HOLLOW HOUR" in Cinzel Black, bone, ink outline, two thin ember rules and an ember crescent moon
  between them (`Wordmark` in `video/src/hollow/kit.tsx`).

## Look: papercut shadow-puppet theatre
- Characters are pure ink silhouettes (`Puppet`: woman, man, doctor, fiddler, drummer, saint, official; poses stand,
  dance, walk, play, point, cower, collapse via `fall`). No faces, no gore. Objects can have flat colour (bread,
  scrolls, books, candles).
- Behind them a **light source**: moon halo, candle, lantern, window glow (`Glow` radial backdrop, `Moon`).
  **Silhouettes must always stand in front of light**, never in front of other silhouettes (they vanish - first QA
  sheet of episode 1). Towns are drawn as a street corridor with the gap in the middle.
- Hypnotic motion: `Spiral` (slow rotating spiral arms, low contrast), `drift()` (camera never stops pushing in),
  `flicker()` on every light, dancers spin with a paper-puppet flip.
- Cuts are a quick **blink to black** (0.18 s), not punch-ins. Film grain + vignette on top (`Overlay`).
- One colour wash per mood: blood red for death / danger, sickly green (rot) for poison / disease.

## Palette (`HC` in kit.tsx)
| Name | Hex | Use |
|---|---|---|
| Void | `#0A0809` | background, silhouettes |
| Ink | `#050405` | text outlines |
| Bone | `#EDE3CF` | main text, moon, parchment |
| Ember | `#F2A93B` (hi `#FFD27A`) | candle light, active caption word, payoff titles |
| Blood | `#B3261E` (hi `#FF5A47`) | stamps, death, caption keywords |
| Dusk | `#2B1D33` (hi `#4A3157`) | night sky |
| Fog | `#8C93A3` | moonlight on the ground |
| Rot | `#9DB36B` | poison, disease (sparingly) |

## Type
- **Cinzel Black 900 / Bold 700** (OFL): titles, captions, stamps. `video/public/fonts/cinzel-latin-*.woff2`.
- **IM Fell English italic** (OFL): dates, places, "later accounts", source notes - the old-print voice.
- `Title` auto-fits to 940 px. Captions: 2-3 words, Cinzel Black 92 px, bone, 18 px ink stroke, active word ember,
  keywords blood-red once said, centred at y 1500. Numbers as digits (1518, 400).

## Voice
- ElevenLabs **Jack - Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`, American, low, cold calm), `eleven_v4`.
- Writing voice: short sentences, plain words, no hype, no "you won't believe", no call to action. Calm is scarier.

## Sound
- Bed: low drone the whole video (−20 dB). Heartbeat on the hook word and on scary beats (−8 to −10 dB). Bell toll on
  deaths / bans (−9 to −14). Dark whoosh before each blink cut (−26). Scene sounds (fiddle, stomping) −22 to −26.
- Library in `video/public/dance/sfx/`: drone, heart, bell, whoosh, fiddle, stomp (reuse them).

## Covers (frame 0)
- Wordmark at top (y 320), two-line title rotated −3° (bone line + ember payoff line), the single figure in the moon
  halo in the centre, italic place/date note under it. Keep everything in the grid-safe rows 240-1680.
- The cover text adds the hook the title doesn't ("THEY COULDN'T / STOP DANCING").

## Bios (drafts)
- YouTube: "Real records. Unreal stories. Dark history, old legends, experiments on humans and the hoaxes people
  believed - told in under a minute, with the sources in every description."
- Instagram: "Real records. Unreal stories. 🕯 / Dark history in 60 seconds. Sources in every caption."
- TikTok: "Real records. Unreal stories. 🕯 Dark history in 60 s."
