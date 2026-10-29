# Convert raw sfx to normalised wavs, report onset/peak, build looped beds.
import subprocess, numpy as np, glob, os
SR = 48000
OUT = '/home/user/LAbLogic/video/public/iceberg/sfx/'
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def save(x, p):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', p], input=x.astype(np.float32).tobytes(), check=True)
def norm(x, db=-1):
    return x * (10 ** (db / 20) / (np.abs(x).max() + 1e-9))
for p in sorted(glob.glob('sfx_raw/*.mp3')):
    n = os.path.basename(p)[:-4]
    x = load(p)
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    pk = env.max()
    on = np.argmax(env > pk * 0.2) / SR
    peak = env.argmax() / SR
    if n in ('ocean', 'melt'):
        L = int((70 if n == 'ocean' else 5) * SR)
        seg = x[int(0.1 * SR):-int(0.1 * SR)]
        xf = int(0.3 * SR)
        y = seg.copy()
        while len(y) < L:
            a = y[-xf:] * np.linspace(1, 0, xf) + seg[:xf] * np.linspace(0, 1, xf)
            y = np.concatenate([y[:-xf], a, seg[xf:]])
        x = y[:L]
    else:
        # trim leading silence to 10 ms before onset, fade tail
        s0 = max(0, int((on - 0.01) * SR))
        x = x[s0:]
        f = int(0.05 * SR)
        x[-f:] *= np.linspace(1, 0, f)
        peak -= s0 / SR
    save(norm(x), OUT + n + '.wav')
    print(f'{n:8s} onset {on:.3f}  peak(after trim) {peak:.3f}  dur {len(x)/SR:.2f}')
