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

## Rigged characters (cut-out rig, added 2026-11-18)
- Workflow: 1) master character with the scientist hero as style reference, 2) edit of the master with the face and
  tail removed ("keep the body EXACTLY identical, remove…"), 3) trim (alpha > 60) to 1400 px wide, measure the capsule,
  4) draw face (eyes with pupils + eyelids, brows, mouth shapes) and wobbly parts (tail) in code on top.
  Result: illustrated look + full animation control (blink, look, chomp, moods, lip-sync later).
- Bacterium: master job `69d59bf1-082b-417f-8d62-a6f6c21dd424`, blank body job `9ff69b6a-1594-45a0-afa7-41d5f1a73489`,
  sprite `video/public/bug/body.png`, rig `video/src/kit/BugRig.tsx` (moods happy/chomp/scared/yuck/smug/determined,
  sheet = Still `BugRigSheet`). Used in composition `PlasticHookRig`.
- Model now `gpt_image_2_6` (also does native SVG output, but without references). Prices per image: 4k high 4.25,
  2k high 2.75, 2k medium 1.0, 1k medium 0.5. Explore at 1k/2k medium, final sprites at 2k high (4k only for covers or
  hero art). Pay attention to the cost: the user finds 4.25 per picture expensive.
- SVG.new plugin is installed but its server is blocked by the cloud network proxy (needs its host allowed).

## Main characters per episode (cheap tiered workflow, user rule 2026-11-18)
- Drafts at 1k medium (0.5) or 2k medium (1.0); final figures at 2k high (2.75) - BUT check the final: the 2k-high
  redraw of the tree (job `6a343016-...`) came back with a transparent hole where the face area was, so the 2k-medium
  draft was used. If a draft already looks clean at the size it is shown (~400-600 px), keep it and say so.
- Ask for "a large plain smooth area where a face will be added later - NO face" so the code face (art.tsx `Face`,
  blinks + moods) sits on the sprite. No second "blank" edit needed then.
- Trees episode: tree job `a07e289a-c7ac-4fa3-9966-ab4706daec58` (`video/public/tree/tree.png`, 671x1000, base
  (330, 995), face at (325, 340) s 1.55), Earth job `99706b77-4b4b-4c38-9eac-a18425ffed44` (`video/public/earth/earth.png`,
  800x809, centre (400, 404), r ~398). Both reusable in later episodes.
- Ground check: every object that stands must stand on the ground line (the user caught floating back rows of trees).
- Zebra (trees episode): happy job `967dafa9-870d-4c79-82ff-319ab5231395`, worried edit `42b11e71-8ac0-4cd9-9997-b1637743c5e2`
  (1k medium, 0.5 each), sprites `video/public/zebra/{happy,worried}.png` (800x510, same crop, feet y 503). Expression
  swaps = cheap edit of the same image ("keep EXACTLY identical, change ONLY the face"). Code-drawn animals look bad -
  the user wants animals from Higgsfield.

## Scientist outfit variants ("skins", added 2026-11-19)
- `Sci` and `BigSci` take `skin="hawaii"` (Hawaiian shirt + gold aviator sunglasses, used in the Vice City Short).
  Sprites `video/public/sci_hawaii/<pose>.png`, metrics `video/src/iceberg/sprites_hawaii.ts`, made with
  `video/images/vicecity/scripts/prep_hawaii.py` (a copy of prep.py that writes to its own folder - never run the
  original prep.py for a skin, it overwrites `public/iceberg/sci/` and `sprites.ts`).
- Poses so far: present, thumbs, think, point, shocked (2k medium edits, 1.0 credit each). Jobs: present
  `e98d65d6-…`, thumbs `9a4fdb28-…`, think `49d9ef11-…`, point `e665280d-…`, shocked `1b625bab-…`. A pose without a
  skin sprite falls back to the default outfit.
- Recipe: upload the default pose PNG (media_upload + PUT with `If-None-Match: *` + media_confirm), then an edit
  prompt "keep the scientist EXACTLY identical … change ONLY …". New skins: same pattern, new folder + metrics file.

## Parts-sheet rigs - checklist (user feedback on the mammoth Short, 2026-11-24)
- Tails: check which way the part curves; a tail must curve AWAY from the body (mirror with sx: -1 around its base)
  and its base must sit inside the fur/skin outline (draw it behind the body).
- Legs: draw all legs that join the underside BEHIND the body so their tops disappear; a leg drawn in front shows a
  hard top edge and looks unattached.
- Faces: check species details before animating (elephants get tusks; no stray smiling mouths on animal faces) -
  fix one part with a cheap edit of the parts sheet ("redraw ONLY the head piece … REMOVE … ADD …", 1k medium 0.5)
  and match its scale to the old part by the size of its main colour area.
- Always render the rig test Still (`MammothRigTest`) and zoom into every joint before the full render.
