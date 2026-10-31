# Thumbnails

## Long-form YouTube thumbnail system ("MrBeast style in the Lab Logic look")
Established on the trash-into-the-Sun video and the woodpecker redesign; the user approved this style.
- 1280×720, built as a Remotion `<Still>` in `video/src/thumb/` and rendered with
  `npx remotion still src/index.ts <Id> out/thumbs/<Id>.png --browser-executable=<chromium>`.
- **Left:** the scientist huge and close (head radius ~130-150 px, body running off the bottom), with a yellow
  sticker outline (stacked hard `drop-shadow`s in `#FFD23F` + a thin ink edge). Best poses: shocked, dizzy.
- **Right/centre:** one big main object with a face (smug Sun, scared trash bag, smug woodpecker).
- **Background:** flat sunburst radiating from the action point - Sky Blue on Earth topics, dark space
  (`#1B2A4A` / `#26385F`) for space topics. No gradients.
- **Text:** 2 lines max, Montserrat Black, Lab Yellow headline + Paper second line, thick ink stroke + hard
  shadow, rotated about −4°. Text must not be covered by arrows (an arrow over the "G" once made "400 G" read "400 C").
- **Focus marks:** red circle (ink + Alarm Red ellipse) around the key detail, red brand arrow pointing at it.
- **Physical sense:** things must touch what they stand on (the woodpecker's claws had to grip the trunk: tilt the
  bird ~15° into a downward peck around its beak tip and move the trunk edge to the claws).
- No wordmark on long-form thumbnails (kept off to match the big-channel look) unless the user asks.
- Make 2-3 variants so the user can pick; YouTube Studio "Test & Compare" can A/B them.

### Thumbnail text that works
- Must add something the title doesn't say, be true, and create a contradiction or a shocking number.
- Approved: "31 MILLION ROCKETS" (trash-into-the-Sun; launches needed to lift one year of trash to orbit),
  "400 G / NO HEADACHE?" (woodpecker - figure came from the user's original thumbnail; verify against the video).
- Rejected by the user as weak: "55× HARDER" (harder than what?), "IT MISSES?!" (gives the answer away).
- Avoid untrue clickbait ("IMPOSSIBLE", "IT COMES BACK").

## Every episode gets two thumbnails
1. **9:16 cover (YouTube Shorts, Instagram Reels, TikTok):** frame 0 of the Short, exported as
   `publish/episodes/<slug>/cover.jpg`. TikTok's API can only use a frame of the video as cover, and Instagram's API
   only a frame unless the image is at a public URL, so the cover must *be* frame 0.
   **Grid-safe layout:** Instagram and TikTok profile grids crop covers to the centre 3:4 (rows 240-1680 of 1920).
   Keep the wordmark, all text, the scientist (feet included) and the object inside that band; text inside 330-1100.
   Iceberg cover layout: wordmark top 300 (500 px wide), title lines at y 530/652/812/964 (sizes 106/106/142/142),
   object waterline 1505, scientist feet 1625 (headR 46). Check with a crop overlay before rendering.
2. **16:9 thumbnail (YouTube long-form):** the MrBeast-style composition below, 1280x720.
   Iceberg options: `IcebergThumbA` "90% HIDDEN" (sea cut open, giant underwater part) and
   `IcebergThumbB` "3 KM ICEBERG?!" (giant berg over a tiny Cape Town).

## Shorts covers
Frame 0 of the Short = the cover (see brand.md): wordmark, "WHY DON'T WE JUST" in Paper, payoff words in Lab Yellow,
scientist + object with a face on the Sky Blue sunburst.

## Existing files
- `video/out/thumbs/SunThumbC.png` (chosen), `SunThumbA.png`, `SunThumbB.png`, `WoodpeckerThumb.png`,
  `IcebergThumbA.png`, `IcebergThumbB.png`.
- Sources: `video/src/thumb/SunThumbs.tsx` (exports Rays, BigSci, RedCircle, useFonts), `WoodpeckerThumb.tsx`,
  `IcebergThumbs.tsx`.
