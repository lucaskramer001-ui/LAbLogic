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
| Why don't we just print more money? | Short + long-form | Short scheduled 2026-11-04 18:00 ET; long-form made |

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
