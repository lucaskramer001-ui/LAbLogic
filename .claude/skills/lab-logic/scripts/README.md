# Helper scripts (copies of the working originals in video/)

| Script | Use | Edit before reuse |
|---|---|---|
| voice.py | join voice takes, cap pauses, optional tempo, remap word times → vo.wav + words.json | `VO` folder path; number of parts |
| prep.py | trim/scale cut-outs, measure head/feet/hand → src/iceberg/sprites.ts | pass ALL poses every run |
| sfx.py | trim + normalise sound effects, build loops | `OUT` folder, which files loop |
| stills.mjs | contact sheet of stills: `COMP=<id> REBUNDLE=1 node scripts/stills.mjs out/qa/x.png t1 t2 …` | - |
| layout-qa.mjs | low-res sampled render with the LayoutProbe → label boxes per frame | composition needs LayoutProbe |
| layout_report.py | report cut-off / overlapping / overflowing labels: `python3 layout_report.py layout.jsonl W H` | - |

Run the .mjs scripts from `video/` (they import @remotion/*). Python needs opencv-python-headless, numpy, pillow.
