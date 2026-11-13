# Trim to onset, normalise to -1 dBFS, loop the rain bed to 9 s with fades -> public/mosquito/sfx/*.wav
import subprocess, numpy as np
RAW = '/home/user/LAbLogic/video/images/mosquito/sfx_raw/'; OUT = '/home/user/LAbLogic/video/public/mosquito/sfx/'; SR = 48000
def load(p):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).reshape(-1, 2).copy()
def save(x, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', OUT + name + '.wav'], input=x.astype(np.float32).tobytes(), check=True)
for name in ('buzz', 'swarm', 'spray', 'slap', 'gulp'):
    x = load(RAW + name + '.mp3')
    if name != 'swarm':
        e = np.abs(x).max(axis=1); on = np.argmax(e > e.max() * 0.15); x = x[max(0, on - int(0.005 * SR)):]
    else:
        L = int(6 * SR); xf = int(0.25 * SR); y = x.copy()
        while len(y) < L:
            y = np.concatenate([y[:-xf], y[-xf:] * np.linspace(1, 0, xf)[:, None] + x[:xf] * np.linspace(0, 1, xf)[:, None], x[xf:]])
        x = y[:L]; f = int(0.6 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]
        f = int(1.0 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    if name == 'slap': x = x[:int(0.5 * SR)]; g = int(0.25 * SR); x[-g:] *= np.linspace(1, 0, g)[:, None]
    f = int(0.02 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    x *= 10 ** (-1 / 20) / (np.abs(x).max() + 1e-9)
    save(x, name); print(name, round(len(x) / SR, 2), 's')
