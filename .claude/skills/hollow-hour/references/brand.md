# Hollow Hour brand

## Identity
- **Name:** HOLLOW HOUR (working name, chosen 2026-11-08; handle availability not checked - ideas: @hollowhour,
  @hollowhour.tv, @thehollowhour). **Tagline:** REAL RECORDS. UNREAL STORIES.
- **Concept:** short, true, unsettling stories - dark history, legends, experiments on humans, hoaxes - told by a
  calm cold narrator over papercut shadow-puppet animation. Every Short loops.
- **Brand book (v1, 2026-11-09):** https://claude.ai/artifact/FrxujGo7uTbSJ78sV6VPtD - niche analysis (MrBallen, Mr.
  Nightmare, Scary Interesting, Lazy Masquerade, Wendigoon, Bedtime Stories/LEMMiNO/Nexpo, faceless AI Shorts accounts),
  seven findings -> decisions, all assets.
- **Logo:** "HOLLOW HOUR" in Cinzel Black, bone, ink outline + hard drop; the O of HOUR is the **moon mark** (full moon,
  ember ring, the Keeper inside). Horizontal `LogoH` and stacked `LogoStack` in `video/src/hollow/Brand.tsx`; the small
  in-video `Wordmark` in kit.tsx is the older simple version.
- **Mascot: the Keeper** - hooded faceless figure with a lantern who "keeps the records" (`Keeper`, `Mark` in
  Brand.tsx). Avatar, logo O, end card; can walk into first/last shots as a silent host.
- **Record numbers:** every Short is RECORD 001, 002 ... (red stamp on the cover) to build a binge/collect habit.
- **Assets** (full res, rendered from Brand.tsx Stills HollowLogo, HollowLogoStacked, HollowAvatar, HollowBanner,
  HollowCoverTemplate, HollowThumbTemplate, HollowEndCard): `publish/brand/hollow-hour/`.
  Render: `npx remotion still build/bundle <Id> out/brand/<Id>.png --image-format=png --browser-executable=<chromium>`.

## Look: papercut shadow-puppet theatre
- Characters are pure ink silhouettes (`Puppet`: woman, man, doctor, fiddler, drummer, saint, official; poses stand,
  dance, walk, play, point, cower, collapse via `fall`). No faces, no gore. Objects can have flat colour (bread,
  scrolls, books, candles).
- Behind them a **light source**: moon halo, candle, lantern, window glow (`Glow` radial backdrop, `Moon`).
  **Silhouettes must always stand in front of light**, never in front of other silhouettes (they vanish - first QA
  sheet of episode 1). Towns are drawn as a street corridor with the gap in the middle.
- Hypnotic motion: `Spiral` (slow rotating spiral arms, low contrast), `drift()` (camera never stops pushing in),
  `flicker()` on every light, dancers spin with a paper-puppet flip.
- **Style v2 (2026-11-09, "more professional and smooth"):** scenes **cross-dissolve** (0.5 s, incoming settles from
  1.035x) instead of blink cuts; the whole frame has a slow camera sway (±0.35°); titles **reveal** smoothly (fade,
  18 px rise, tracking closes, blur clears; `reveal()`), never springy pops; `Title` is Cinzel Bold with wide tracking,
  a thin dark edge, soft black shadow and faint coloured glow (no thick cartoon outline); `Overlay` adds drifting fog
  bands and floating dust motes over film grain and vignette.
- **Watermark:** small "HOLLOW HOUR" + crescent between ember rules at y 1668 on every frame after the cover
  (`Watermark` in kit.tsx), like Scary Interesting / MORGAR.
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
- `Title` auto-fits to 940 px. **Captions (horror style, v2):** 2-3 words, Cinzel Bold 84 px, tracking 6, bone on a
  soft black halo (2 px edge only); each word rises out of a blur as it is spoken; the spoken word burns red `#FF4F3F`
  with a glow and faint flicker; keywords stay ember once said; centred at y 1500. Numbers as digits (1518, 400).

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

## Competitor analysis v2 (real YouTube data, 2026-11-09; raw data + scraper in publish/brand/hollow-hour/research/)
| Channel | Subs | Median Short views | Format |
|---|---|---|---|
| Zack D. Films | 29.6M | 7.85M | 3D animation, "Why ..." + 1 emoji |
| Sean Andrew | 7.51M | 5.1M | face, history/myth tests |
| ParaHaunt (closest to us) | 453K | 2.25M | flat 2D animated urban legends, red/black, "[Urban Legend]" tag |
| MrBallen Shorts | 3.26M | 349K | host face |
| Mr. Nightmare | 7.16M | 288K | photos, red-box captions |
| Scary Interesting | 2.06M | 208K | stock footage, 2-word titles, name on every frame |
| Absolute History | 3.7M | 195K | presenter, numbered series |
Biggest topics in 355 search results: human experiments (Milgram ~43M, "Worst Experiment in History" 39M), urban legends
around the world (40M), bizarre punishments/royals (26M), photos with disturbing backstories.

Rules that follow from it:
- Titles: one curiosity line < 50 chars + series tag, e.g. "The Town That Couldn't Stop Dancing [Record 001]".
  No hashtags in the title (put them in the description). One emoji optional (🕯 fits the brand).
- Topic mix per 4 Shorts: 2 experiments, 1 legend, 1 dark record; hoaxes as specials.
- Small "HOLLOW HOUR" watermark low on every frame (built: `Watermark`).
- Frame 0 = cover but visible < 0.5 s (COVER_END 0.5 in the dance Short); test a no-text opening frame against it.
- Stay distinct from ParaHaunt: true records, narration, sources, warm candle/moon light, the Keeper.
