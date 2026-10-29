# Temporary placeholder: cut the scientist out of the brand-kit cover (blue sunburst keyed out).
import numpy as np, cv2
from PIL import Image
im = np.array(Image.open('ref/cover.jpg').convert('RGB')).astype(np.float32)
crop = im[438:745, 40:205]
r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
blue = (b > 180) & (b - r > 50) & (g > 120)
mask = blue.astype(np.uint8)
h, w = mask.shape
ff = mask.copy()
seed = np.zeros((h + 2, w + 2), np.uint8)
for x in range(w):
    for y in (0, h - 1):
        if ff[y, x] == 1: cv2.floodFill(ff, seed, (x, y), 2)
for y in range(h):
    for x in (0, w - 1):
        if ff[y, x] == 1: cv2.floodFill(ff, seed, (x, y), 2)
bg = (ff == 2)
alpha = np.where(bg, 0, 255).astype(np.uint8)
alpha = cv2.erode(alpha, np.ones((2, 2), np.uint8))
big = cv2.resize(np.dstack([crop.astype(np.uint8), alpha]), (w * 4, h * 4), interpolation=cv2.INTER_CUBIC)
Image.fromarray(big, 'RGBA').save('raw/placeholder.png')
print(big.shape)
