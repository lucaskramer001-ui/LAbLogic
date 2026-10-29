# Trim sprites, measure head disc + feet, write src/iceberg/sprites.ts.
# usage: python3 prep.py pose=raw/file.png [pose=raw/file.png ...]
import sys, json, numpy as np, cv2
from PIL import Image
ROOT = '/home/user/LAbLogic/video/'
out = {}
for arg in sys.argv[1:]:
    name, path = arg.split('=')
    im = Image.open(path).convert('RGBA')
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 20)
    x0, x1, y0, y1 = max(xs.min() - 12, 0), min(xs.max() + 13, a.shape[1]), max(ys.min() - 12, 0), min(ys.max() + 13, a.shape[0])
    im = im.crop((x0, y0, x1, y1))
    a = np.array(im)[..., 3]
    h, w = a.shape
    a8 = (a > 128).astype(np.uint8)
    ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    # head = largest inscribed disc in the top 45 % (the coat is wide too)
    top = solid.copy(); top[int(h * 0.45):] = 0
    dt = cv2.distanceTransform(top, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    band = a8[int(h * 0.965):]
    fy, fx = np.where(band > 0)
    foot = (float(fx.mean()) if len(fx) else w / 2, float(h - 12))
    im.save(ROOT + f'public/iceberg/sci/{name}.png')
    out[name] = {'w': w, 'h': h, 'headX': int(hx), 'headY': int(hy), 'headR': float(dt[hy, hx]), 'footX': round(foot[0], 1), 'footY': round(foot[1], 1)}
    print(name, out[name])
ts = 'export type Sprite = {w: number; h: number; headX: number; headY: number; headR: number; footX: number; footY: number};\n'
ts += 'export const SPRITES: Record<string, Sprite> = ' + json.dumps(out, indent=2) + ';\n'
open(ROOT + 'src/iceberg/sprites.ts', 'w').write(ts)
