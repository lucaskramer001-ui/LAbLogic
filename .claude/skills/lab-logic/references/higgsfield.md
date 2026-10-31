# Higgsfield pictures (GPT Image 2.5)

## Settings
- Model `gpt_image_2_5`, `resolution: 4k`, `quality: high`, `background: transparent`, aspect `2:3` for full
  body, `1:1` props, `3:2` wide pieces. Cost 4.25 credits each (2k = 2.75). Plan "plus".
- Use `generate_image_batch` for several pictures, `jobs_wait` (15 s polls) until done, download `result_url`
  with curl (needs `*.cloudfront.net` allowed in the environment's network settings).
- Upload a local reference: `media_upload` → curl PUT to `upload_url` with headers `Content-Type: image/png` and
  `If-None-Match: *` → `media_confirm`. A previous job ID can be used directly as a reference.

## Reference IDs (reuse; job IDs stay valid as references)
| What | ID |
|---|---|
| Scientist hero (full body, neutral, transparent) - main reference for every pose | job `2946ef99-93c7-4ef7-8dd4-81f72a5499cb` (file `assets/characters/scientist_hero.png`) |
| Brand-kit avatar (pointing-up bust) | media `657ba836-80a7-4612-ab72-466befee4c18` |
| Brand-kit cover crop (scientist with bomb) | media `0c9ad6d2-964c-47d2-a747-7566fa2036f6` |
| Woodpecker (smug, mid-peck, facing left) | job `06ef29d3-d8d5-45c3-81fe-9cb953796c8d` (file `assets/characters/woodpecker.png`) |
| Old woodpecker thumbnail crop | media `accff371-9431-4578-9d4f-d090450032e8` |
If a media ID has expired, re-upload the file from `assets/`.

## Style block (append to every scientist prompt)
"Flat 2D cartoon in exactly the same drawing style as the reference images: the same young scientist with messy
spiky brown hair, big round black glasses with white lenses and small black pupils, peach skin, an open white lab
coat with a pen in the breast pocket, a teal t-shirt, dark grey trousers and brown shoes. Thick smooth black
outlines of even weight, flat colours with one soft shade, clean vector-like linework, no texture, no text, no
border. Isolated on a fully transparent background: no sky, no ground, no floor shadow."

References for poses: the hero job + the avatar media. Prompt = framing + expression + exact hands
("the hand on the RIGHT side of the image…" - never "his left") + "Whole body in frame with a margin." + style block.

## Pose library (in `video/public/iceberg/sci/`, measured in `video/src/iceberg/sprites.ts`)
| Pose | Description |
|---|---|
| rope | ¾ view right, leaning back pulling a rope that exits right at chest height, proud grin |
| point | facing viewer, right-side hand points up, friendly open smile |
| think | ¾ right, hand on chin, eyes up |
| thumbs | facing viewer, big thumbs-up, wide grin |
| shocked | facing viewer, jaw dropped, hands on cheeks (best thumbnail face) |
| nervous | worried brows, clenched grimace, sweat drop, hands near chest |
| bucket | ¾ right, holding out an empty grey bucket |
| facepalm | hand over eyes, slumped |
| throw | ¾ right, black trash bag raised behind head, winding up |
| present | ¾ right, open palm presenting to the right |
| calc | holding a calculator, long receipt piling up at his feet |
| hot | red cheeks, sweat, fanning himself |
| dizzy | spiral glasses, bump on head, tongue out, hand on bump (from old woodpecker thumbnail) |

## Objects
Most objects are drawn in code (better control and a perfect match with the ink-outline style). Use Higgsfield
for animals and detailed props: e.g. the woodpecker prompt "The same cartoon woodpecker as the reference image…
side view facing LEFT, body vertical as if clinging to a tree trunk on the left (trunk NOT drawn), beak pointing
straight left, eyes squeezed shut in a happy, totally unbothered smug grin. Whole bird in frame with a margin.
Flat 2D cartoon, thick smooth black outlines… Isolated on a fully transparent background."

## Prep
`scripts/prep.py` trims to alpha + 12 px, scales to 1600 px tall, finds the head (largest inscribed disc in the
top 45%), the feet (bottom 3.5% of rows) and the rightmost point (hand / rope end), and writes `sprites.ts`.
Non-character cut-outs: trim + resize by hand and measure anchor points (e.g. beak tip = leftmost opaque pixel).
