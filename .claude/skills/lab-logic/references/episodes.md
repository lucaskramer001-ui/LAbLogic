# Episodes and topics

Add a row for every new episode (and every topic the user mentions as already done) so topics are not repeated.

## Topics already used or announced (do not repeat or make close variations)
| Topic | Format | Status |
|---|---|---|
| Why don't we just nuke a hurricane? | Short | made by the user before this skill (brand-kit cover example) |
| Why don't we throw trash into volcanoes? | example in the brief | treat as used |
| Why don't we just fire our trash into the Sun? | Short (user's, Oct 28) + long-form | Short published: youtube.com/shorts/yXsZ-k38ZKA; long-form made |
| Woodpecker: 400 G to the head, no headache? | Short (user's) | thumbnail redone in the new style |
| Why don't we just tow an iceberg for water? | Short + long-form | made in this project |
| Why don't we just drink the ocean? (seawater) | Short (user's 23 s, recreated in 4K) | posted 2026-11-03 YouTube + Instagram |
| Why don't we just build planes out of the black box? | Short + long-form | Short made 2026-11-07, long-form 2026-11-09 |
| Why don't we just print more money? | Short + long-form | Short scheduled 2026-11-04 18:00 ET; long-form made |
| Why don't we just catch lightning for electricity? | Short | made 2026-11-10 |
| Why don't we just stream the black box live? | Short (cross-promo for the black box long-form) | made 2026-11-11 |
| Why don't we just drill to Earth's core for energy? | Short | made 2026-11-12 |
| Why don't we just kill all the mosquitoes? | Short | made 2026-11-13 |

## Iceberg Short - "Why don't we just tow an iceberg?"
- 228 words, 68.6 s after pause trim + atempo 1.1, Tim Riley. Render `video/out/iceberg-lablogic-4K.mp4`
  (2160×3840, 60 fps, −14 LUFS). Composition `Iceberg`, code `video/src/iceberg/`.
- Facts: Cape Town 2018 near "Day Zero"; ~90% of an iceberg underwater (USGS); Condron 2023 Scientific Reports
  (WHOI): tow ~59 days at 0.5 m/s, start ≥ ~300 m long and ~200 m thick, sea off Cape Town 15-20 °C, could melt in
  weeks or days, a year's supply would need ~3 km on arrival without insulation; no proven way to capture
  meltwater; 1970s Saudi plan.
- Packaging: title "Why Don't We Just Tow an Iceberg for Water?", description + 14 tags written in the chat.
- Costs: ~1,240 ElevenLabs credits voice + ~200 sfx; Higgsfield ~38 credits (hero + 8 poses).

## Trash into the Sun - long-form (5:37)
- 921 words in two takes (185.5 s + 155.8 s), pauses capped at 0.5 s → 5:33 voice. Render
  `video/out/sun/trash-into-the-sun-1080p.mp4` (1920×1080, 60 fps, 20,250 frames, −14 LUFS) + SRT
  `video/out/sun/trash-into-the-sun.en.srt`. Composition `TrashSun`, code `video/src/sun/`.
- Facts and sources: World Bank What a Waste 2.0 (2.01 bn t in 2016 → 3.40 bn t by 2050; a third or more
  mismanaged); Earth ~30 km/s (~67,000 mph); NASA "It's Surprisingly Hard to Go to the Sun" (shed ~53,000 mph,
  55× the energy of Mars); Parker: launched 2018, 7 Venus flybys, Dec 24 2024, ~3.8 million miles, ~430,000 mph
  (Guinness record); escape ~12 km/s extra vs. almost all of 30 km/s to fall in (Illinois Physics Q&A, rough);
  Falcon Heavy ~64 t to LEO (strongest setup) → ~31 million launches per year of trash, ~86,000/day; 263 orbital
  launch attempts in 2024 (Aviation Week); NASA nuclear-waste studies 1973 (Sun impact not possible with the
  vehicles considered), 1981 status report (8 t/year = 3 Shuttle launches), never carried out.
- Chapters: 0:00 Why not fire trash into the Sun? / 0:42 Earth is moving sideways / 1:23 The train trick /
  1:49 How hard is it? Parker Solar Probe / 2:40 Easier to leave than to hit / 3:00 The trash math /
  3:48 When rockets fail / 4:04 NASA's nuclear waste studies / 4:50 The real answer.
- Thumbnail chosen: "31 MILLION ROCKETS" (`SunThumbC`). Title "Why Don't We Just Fire Our Trash Into the Sun?".
- Costs: ~10,400 ElevenLabs credits (incl. a failed 5,133-char take, check whether it was charged), Higgsfield
  ~17 credits (4 poses).

## Woodpecker thumbnail redesign
- `WoodpeckerThumb`: dizzy scientist + new high-res woodpecker, "400 G / NO HEADACHE?", red circle and arrow.
  ~8.5 Higgsfield credits.

## Iceberg - long-form "Why Don't We Just Tow Icebergs for Drinking Water?" (5:29)
- 919 words in two takes (155.0 s + 179.3 s), pauses capped at 0.5 s, no speed-up -> 324.7 s voice.
  Render `video/out/iceberglong/iceberg-tow-long-1080p.mp4` (1920x1080, 60 fps, -14 LUFS) + SRT. Composition
  `IcebergLong`, code `video/src/iceberglong/` (kit.tsx = shared long-form stage/labels/probe/end card; reuse it).
- Extra facts beyond the Short: Day Zero, ~4 million people; Antarctica ~4,000 km south; 1977 Iowa State iceberg
  conference backed by Prince Mohammed al-Faisal, glacier ice shipped from Alaska to Iowa, plan for a ~100 million t
  berg, "within three years" (Time, 1977, via search snippets); berg ~200 m thick = ~50-story building; tugs tow
  icebergs off Newfoundland away from oil platforms, ropes slip off and bergs can roll; tow 0.5 m/s (slower than a
  slow walk); fabric skirt idea untested; Nick Sloane 2018: a fifth to a third of Cape Town's yearly water, ~$100M
  tow + tens of millions to harvest; city said groundwater/desalination cheaper and less risky; residents cut use
  to ~half (limit 50 L per person per day); Day Zero avoided after rain returned.
- Chapters: 0:00 Day Zero / 0:27 obvious fix / 0:44 1977 plan / 1:17 90% underwater / 1:24 size / 1:44 harbor /
  1:55 Newfoundland / 2:19 two months / 2:32 melting / 3:03 parked / 3:17 3 km / 3:46 getting water out /
  4:13 Sloane plan + cost / 4:43 what Cape Town did / 5:01 recap.
- Thumbnail `IcebergThumbB` "3 KM ICEBERG?!". Package in `publish/episodes/iceberg-long*`.
- Costs: ~5,030 ElevenLabs credits (voice), Scribe free on the TTS node, no new Higgsfield pictures.

## Seawater Short - "Why Don't We Just Drink the Ocean?" (24 s)
- User's own 23 s Short (720p download) recreated in 4K: composition `Seawater`, code `video/src/seawater/`, new poses
  `glass` and `thirsty`. Source: NOAA Ocean Service "Can humans drink seawater?". Posted 2026-11-03: YouTube
  nT71Ss44oQ0 (public), Instagram reel DfSE1FEmwic; TikTok refused by the API (uploaded by hand).

## Money Short - "Why Don't We Just Print More Money?" (~69 s)
- 215 words, 82.8 s raw -> 67.75 s (pauses 0.26, atempo 1.1). Composition `Money`, code `video/src/money/`, new pose
  `cash` (tossing banknotes). Facts: Berlin loaf ~160 marks end 1922 -> ~200 billion marks late 1923 (figures vary
  by source/date; Berlin ~2x10^11 most cited); Zimbabwe Nov 2008 prices doubling every 24.7 h (Hanke & Kwok, Cato
  Journal 2009 - estimate); 100 trillion dollar note issued Jan 2009. Bread-town example is illustrative.
- Costs: ~1,221 ElevenLabs credits, 4.25 Higgsfield credits.

## Money long-form (5:32)
- 848 words, takes 186.1 s + 156.8 s, pauses 0.5 s -> 328.2 s. Composition `MoneyLong`, code `video/src/moneylong/`
  (reuses money Short props exported from `video/src/money/Main.tsx`). Render `video/out/moneylong/print-money-long-1080p.mp4`.
- Extra facts: Hanke-Krus hyperinflation = >50% a month; Ruhr occupied early 1923, passive resistance financed by
  printing; Rentenmark Nov 1923 = 1 trillion old marks; Zimbabwe farm seizures from 2000, June 2007 order to cut
  prices ~in half -> arrests, empty shelves (Mail & Guardian); currency given up April 2009; Hungary 1946 doubling
  ~15 h (Hanke-Krus); Fed aims for 2% inflation over the long run (federalreserve.gov FAQ).
- Thumbnails `MoneyThumbA` "FOR ONE / LOAF?!" (recommended) and `MoneyThumbB` "100 TRILLION / DOLLAR NOTE?!".
- Costs: ~4,900 ElevenLabs credits.

## Black box Short - "Why Don't We Just Build Planes Out of the Black Box?" (~71 s)
- 224 words, Tim Riley, pauses 0.26 + atempo 1.1 -> 70.2 s. Composition `BlackBox`, cover Still `BlackBoxCover`
  ("SURVIVES / 3,400 G?!", dizzy scientist), code `video/src/blackbox/` (BlackBox and Plane characters).
- Facts: recorders are bright orange; memory chips in insulation + titanium/stainless shell; ETEP CSMU ~2 kg;
  ED-112 tests 3,400 g / 6.5 ms, 1,100 C for 60 min, 5,000 lb crush (search snippets, manufacturer documents);
  John Paul Stapp, Air Force flight surgeon, 46.2 g on 10 Dec 1954.
- Fix made: first take said "a test pilot" - Stapp was a doctor; the two sentences were regenerated and spliced
  into the take (levels matched to -1.5 dB) instead of redoing the whole take (~123 credits vs ~1,225).
- Costs: ~1,350 ElevenLabs credits, no Higgsfield (out of credits).

## Black box long-form (5:32)
- 873 words, takes 138.9 s + 199.1 s -> 327.6 s voice. Composition `BlackBoxLong`, code `video/src/blackboxlong/`,
  render `video/out/blackboxlong/blackbox-long-1080p.mp4`. 24 scenes in 9 chapters.
- First video with the "pro" motion layer (`video/src/pro/kit.tsx`): Lab Yellow/Sky diagonal wipes at chapter starts,
  sliding chapter cards (bottom left), slow camera drift on every shot (s 1.0 -> 1.025, dx 16), parallax clouds,
  count-up numbers (3,400 G, 1,100 C, 6,000 M, 3,900 M, 2 -> 25 hours), idle bobbing, soft contact shadows.
- Extra facts: David Warren (ARL Melbourne), Comet investigation, prototype 1956; FDR vs CVR; FAA final rule
  (Feb 2026) 25-hour CVR on new aircraft, EASA/ICAO 25 h for >27 t; recorders in the tail; ED-112 tests incl.
  500 lb spike from 10 ft, 260 C for 10 h, 6,000 m pressure, 30-day beacon; AF447 (2009) recorders found 2011 at
  ~3,900 m, readable; MH370 (2014) recorders never found; deployable/floating recorders; Stapp 46.2 g (1954);
  16 g dynamic seat tests (14 CFR 25.562, 1988); 90-second evacuation (14 CFR 25.803).
- Thumbnails BlackBoxThumbA "SURVIVES / 3,400 G" (think), B "FOUND / 3,900 M DOWN" (point), C "TOO HEAVY / TO FLY?!"
  (facepalm). Costs ~4,920 ElevenLabs credits voice; music + sfx pass ~2,070 credits + 1,980 for an unneeded vocal check.

## Lightning Short - "Why Don't We Just Catch Lightning for Electricity?" (~70 s)
- Hook chosen with the `youtube-agent:yt-script` scorer (hook A, 62 WORKABLE): "You could catch every bolt of lightning
  that hits the Empire State Building for a whole year, and you'd still power only about three homes. But why?"
- 228 words, Tim Riley, 82.1 s raw -> 68.6 s (pauses 0.26, atempo 1.1). Composition `Lightning`, cover Still
  `LightningCover` ("A YEAR OF LIGHTNING / = 3 HOMES?!", calc pose), code `video/src/lightning/` (Bolt with face,
  Tower = Empire State-style, Battery with face, Stopwatch, PowerPlant, LitHouse, StormSky, Strike).
- Facts (search snippets only; weather.gov and engineering.mit.edu blocked): NWS 300 million V / 30,000 A, air to
  ~50,000 F; NWS Upton: Empire State Building ~23 strikes/yr (NYC.gov says 25); flash ~0.2 s, strokes a few ms
  (Britannica); ~5 billion J per bolt is a GENEROUS estimate (HowStuffWorks, UNSW; Leicester student paper 7.5e7 J);
  EIA 2024 865 kWh/month per home. 5e9 J = 1,389 kWh = 1.6 months; x 23 = ~3.1 homes/yr.
- New sfx in `public/lightning/sfx/` (zap, thunder, rain bed 9 s, ding, spark). Costs: 1,282 ElevenLabs credits voice
  + 85 sfx, no Higgsfield.

## Channel snapshot 2026-11-11 (YouTube RSS: https://www.youtube.com/feeds/videos.xml?channel_id=UCk-qhhhrSOOLCZotQlr2q2w)
youtube.com is reachable again (feed + watch pages); channel id UCk-qhhhrSOOLCZotQlr2q2w.
Shorts (views): woodpecker concussions 1,379 | trash into the Sun 2,958 | tow an iceberg 3,087 | nuke a hurricane 1,405 |
drink the ocean 1,389 | print more money 8 (scheduled upload) | black box 1,411 | catch lightning 1,335 (posted by the user 11-10).
Long-forms (views): woodpecker "12,000 Head Hits a Day!" 41 | trash into the Sun 44 | icebergs 26 |
print money "to end poverty" 12 | black box 1. Shorts reach ~1.3-3k each; long-forms barely get found -> cross-promote
long-forms from new Shorts (Shorts "Related video" link + pinned comment).

## Black box streaming Short - "Why Don't We Just Stream the Black Box Live?" (~70.7 s) - first cross-promo Short
- Picked from the channel snapshot: long-forms get almost no views, so this Short links the black box long-form
  (https://youtu.be/RTJLi1DO8S0) in the description + pinned comment; set it as the Short's "Related video" in Studio.
- Hook (yt-script scorer 68): "You can text from thirty-five thousand feet, but in 2014 a whole airliner vanished, and
  its black boxes were never found. So why don't we just stream them?" 229 words, 85.8 s raw -> 69.0 s (pauses 0.26,
  atempo 1.13 - 1.1 gave 70.9 s). Composition `BBStream`, cover `BBStreamCover` ("STREAM THE BLACK BOX? / $300M /
  A YEAR?!", nervous pose), code `video/src/bbstream/` (reuses BlackBox + Plane from video/src/blackbox/Main.tsx;
  new Satellite, Station, DataFlow, Ping, Phone, Car with dash cam, Bubble). SFX cues take an optional `len` so beds
  stop with their scene (ocean only under the hook).
- Facts (search snippets): 2002 L-3 estimate ~$300M/yr for one big US airline (secondhand via Bloomberg/FlyerTalk -
  said as "one industry estimate"); cost = main obstacle (PBS NOVA, NBC); ocean coverage/bandwidth (ITU); pilots'
  privacy (CORDIS); IATA 2024 one accident per 880,000 flights; GADSS 15-min tracking since Nov 2018; ADT 1/min in
  distress for new >27 t aircraft (ICAO 2024).
- Costs: 1,315 ElevenLabs credits voice + 85 sfx.

## Earth core Short - "Why Don't We Just Drill to Earth's Core for Energy?" (~69.8 s)
- User asked for an attention-grabbing topic with a hook in the first 2 s. Hook (scorer 69): "You're standing on a
  five-thousand-degree furnace. Drill down, and you'd never pay for power again. So why don't we?" - "furnace" lands at
  2.06 s; visuals: cover 0.3 s, hard cut to the cut-open Earth with a smug glowing core, "5,000°C" slams at ~1.0 s with
  a boom + shake. 222 words, 80.7 s raw -> 68.0 s (0.26, atempo 1.1). Composition `Core`, cover `CoreCover`
  ("DEEPEST HOLE EVER: / 0.2%?!", hot pose), code `video/src/core/` (EarthCut, Rig, Bit with face, Turbine, Magma,
  Ground cross-section, magnifier on the 0.2% bar).
- Facts (search snippets): inner core ~5,200 C (Nat Geo; some estimates ~6,000 C); Kola 12,262 m, ~180 C vs ~100 C
  expected, stopped 1992 (heat + end of USSR/funding); core starts ~2,900 km; IDDP-1 Krafla hit magma at 2,104 m in
  2009, steam >450 C. 0.2% = 12.26/6,371 km (own math).
- Captions: the shared Captions.tsx stripped dots and digits ("0.2" -> "02"); core/Captions.tsx keeps digits/dots.
- Costs: 1,263 ElevenLabs credits voice + 85 sfx.

## Mosquito Short - "Why Don't We Just Kill All the Mosquitoes?" (~68.7 s)
- Hook (scorer 68): "You've been bitten by the deadliest animal on Earth. Malaria alone left about 597,000 people dead in
  2023." "Deadliest animal" at 1.3 s with a boom + "DEADLIEST / ANIMAL ON EARTH" slam, slap on "Earth".
  204 words, 81.4 s raw -> 67.0 s. Composition `Mosquito`, cover `MosquitoCover` ("THE DEADLIEST ANIMAL / IS THIS?!",
  shocked pose, circled mosquito), code `video/src/mosquito/` (Mosquito character with tints: deadly red, gene-drive
  blue, harmless green; SprayCan, Fish, Larva, Bird, Cage, Helix).
- Facts (search snippets): WHO WMR 2024 - 597,000 malaria deaths, 263 M cases in 2023; CDC "world's deadliest animal";
  CDC ~3,500 species, ~430 Anopheles of which 30-40 transmit malaria; only females bite; Nature 2010 (Fang) Arctic birds
  could drop >50% per one entomologist, others disagree; Imperial 2018 (Kyrou, Nature Biotech) doublesex gene drive ->
  no females, cage collapse in 7-11 generations; large-cage study collapse within a year; no wild release yet.
- Costs: 1,207 ElevenLabs credits voice + 85 sfx.
