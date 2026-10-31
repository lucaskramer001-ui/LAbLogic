# Lab Logic brand kit

Source: the user's brand kit (artifact https://claude.ai/artifact/3838WY4vnE78HBhnyU6GCy and the PDF in
`assets/brand/LabLogic_Brand_Kit.pdf`, v1, October 2026). Wordmark, stacked logo, avatar, cover example and
cover template are in `assets/brand/`.

## Identity
- **Name:** LAB LOGIC. **Tagline:** OBVIOUS FIXES. SURPRISING ANSWERS.
- **Concept:** cartoon science channel on YouTube Shorts, Instagram Reels and TikTok. Every video asks
  "why don't we just…?" and the scientist finds out why not.
- **Handle ideas** (availability not checked): @lablogic, @lablogic.shorts, @thelablogic, @lablogicscience.

## Mascot: the scientist
- Messy spiky brown hair, big round black glasses (white lenses, small black pupils), peach skin, open white lab
  coat with a pen in the breast pocket, teal t-shirt, dark grey trousers, brown shoes.
- He stars in every Short and is the **only human**. Objects and planets get simple code-drawn faces.
- Draw every new pose **from his hero picture**, never from a text prompt alone
  (`assets/characters/scientist_hero.png`, Higgsfield job `2946ef99-93c7-4ef7-8dd4-81f72a5499cb`).
- He reacts to the science: proud before the idea, nervous when it fails, gas mask or facepalm at the end.
- The pointing-up bust is the profile picture on all three platforms (`assets/brand/avatar.png`).

## Logo
- Montserrat Black, all caps. LAB in Lab Yellow, LOGIC in Paper, the O replaced by a bubbling flask.
- Thick ink outline plus a hard ink shadow down-right. No soft shadows, no gradients.
- On Sky Blue or a busy picture. On yellow use the stacked version on a sky-blue badge.
- Horizontal for banners and cover badges; stacked for square spaces.

## Palette
| Name | Hex | Use |
|---|---|---|
| Lab Yellow | `#FFD23F` | LAB, pills, avatar ground, payoff words, active caption word |
| Flask Gold | `#FFBA1A` | sunburst rays |
| Sky Blue | `#5DB7F5` | banner, covers, default sky (lighter ray `#80C7F8`) |
| Coat Teal | `#2A8C93` | small labels, links |
| Ink | `#141414` | every outline and shadow |
| Paper | `#FFF8E7` | LOGIC, light text, setup words |
| Spark Green | `#7CFF5B` | caption keywords |
| Alarm Red | `#E8352B` | warnings, red circles/arrows, stamps |

Scene colours added in production (same flat style): sea `#2D78C4`, deep sea `#1F5E9E`, ice `#FFFFFF`/shade
`#CDEBF8`, underwater ice `#9AD3F2`, space `#1B2A4A`/ray `#26385F`, Sun `#FFC93C`/flame `#FF9F1C`,
Earth sea `#3E8EDE`/land `#5CBF6B`, Mars `#E0663F`, Venus `#E8C27A`. All in `video/src/iceberg/art.tsx` (`C`)
and `video/src/sun/space.tsx`.

## Type
- **Montserrat Black 900:** titles, captions, logo. **Montserrat ExtraBold 800:** taglines, pills, labels.
  **Nunito 600:** bios, descriptions.
- Font files: `video/public/fonts/montserrat-latin-{800,900}-normal.woff2` (from @fontsource; Montserrat is OFL).
- The latin subset has **no `≈` or `→`** - write "ABOUT" and leave arrows to drawn shapes.

## Captions in Shorts
- 2-3 words at a time, all caps, Montserrat Black 104 px on the 1080×1920 frame, centred at y = 1480.
- White with a thick ink outline and a hard shadow. The spoken word turns Lab Yellow and grows (scale 1.12,
  rotate −2°); keywords stay Spark Green once said.
- No punctuation except question marks (contractions keep their apostrophe). Numbers as digits ("20 MINUTES").
- Implementation: `video/src/iceberg/Captions.tsx`.

## Covers (Shorts / Reels / TikTok)
- The question is the title: setup words in Paper, payoff words big in Lab Yellow. Wordmark small at the top.
- Keep text between 330 and 1100 px from the top (Instagram 3:4 grid crop and TikTok UI).
- **Frame 0 of every Short matches its cover**, because YouTube Shorts covers are picked from a frame.
- Look: Sky Blue sunburst, scientist on one side, one big object (with a face) on the other.

## Long-form YouTube thumbnails
Different from the Short covers: MrBeast-style composition in the brand look. See `thumbnails.md`.

## Platform specs
| Platform | Profile picture | Header / cover | Bio limit |
|---|---|---|---|
| YouTube | avatar-1080.png (round, ≥98×98) | banner 2560×1440 (safe area 1546×423); Shorts cover = a video frame | 1,000 chars |
| Instagram | same file (≈110×110) | Reels cover 1080×1920, grid crop 3:4 | 150 chars |
| TikTok | same file (≥200×200) | cover picked or uploaded, 1080×1920 | 80 chars |

## Bios
- **YouTube:** "Why don't we just nuke a hurricane? Fire our trash into the Sun? Lab Logic takes the obvious fix, tests it
  against real science, and shows you why it doesn't work. Cartoon Shorts with a curious scientist and sources you can check."
- **Instagram:** "Why don't we just…? 🧪 / Obvious fixes, surprising answers. / Cartoon science Shorts, real sources."
- **TikTok:** "Why don't we just…? 🧪 Obvious fixes, surprising answers."

## Voice
- ElevenLabs **Tim Riley - Natural. Conversational** (`1gZSmkYVRMS8w1i4plmP`), chosen by the user.
  Warm, clear, everyday American male; plain spoken lines, not a narrator voice.
- Brand voice in writing: plain, curious, short connected sentences, no hype words, no calls to action,
  honest about uncertainty, sources you can check.
