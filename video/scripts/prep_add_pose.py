# Add (or replace) ONE scientist pose without touching the others.
# usage: python3 scripts/prep_add_pose.py <pose> <raw.png>
# Trims, scales to 1600 px tall, measures head/feet/hand like prep.py, saves public/iceberg/sci/<pose>.png and MERGES
# the metrics into src/iceberg/sprites.ts (prep.py rewrites the whole file - never use it for a single new pose).
import sys, json, re, numpy as np, cv2
from PIL import Image
ROOT = '/home/user/LAbLogic/video/'
name, path = sys.argv[1], sys.argv[2]
im = Image.open(path).convert('RGBA')
a = np.array(im)[..., 3]
ys, xs = np.where(a > 20)
im = im.crop((max(xs.min() - 12, 0), max(ys.min() - 12, 0), min(xs.max() + 13, a.shape[1]), min(ys.max() + 13, a.shape[0])))
if im.height > 1600:
    im = im.resize((round(im.width * 1600 / im.height), 1600), Image.LANCZOS)
a = np.array(im)[..., 3]
h, w = a.shape
a8 = (a > 128).astype(np.uint8)
ff = a8.copy()
cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
solid = np.where(ff == 2, 0, 1).astype(np.uint8)
top = solid.copy(); top[int(h * 0.45):] = 0
dt = cv2.distanceTransform(top, cv2.DIST_L2, 5)
hy, hx = np.unravel_index(dt.argmax(), dt.shape)
fy, fx = np.where(a8[int(h * 0.965):] > 0)
ys2, xs2 = np.where(a > 128)
i = xs2.argmax()
m = {'handX': int(xs2[i]), 'handY': int(ys2[i]), 'w': w, 'h': h, 'headX': int(hx), 'headY': int(hy), 'headR': float(dt[hy, hx]),
     'footX': round(float(fx.mean()) if len(fx) else w / 2, 1), 'footY': round(float(h - 12), 1)}
im.save(ROOT + f'public/iceberg/sci/{name}.png')
ts_path = ROOT + 'src/iceberg/sprites.ts'
ts = open(ts_path).read()
head, body = ts.split('export const SPRITES: Record<string, Sprite> = ', 1)
data = json.loads(body.rstrip().rstrip(';'))
data[name] = m
open(ts_path, 'w').write(head + 'export const SPRITES: Record<string, Sprite> = ' + json.dumps(data, indent=2) + ';\n')
print(name, m, 'poses now:', len(data))
