# Trim to onset, short fade-out, normalise to -1 dBFS -> public/plastic/sfx/*.wav
import subprocess, numpy as np
RAW = '/home/user/LAbLogic/video/images/plastic/sfx_raw/'; OUT = '/home/user/LAbLogic/video/public/plastic/sfx/'; SR = 48000
def load(p):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).reshape(-1, 2).copy()
def save(x, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', OUT + name + '.wav'], input=x.astype(np.float32).tobytes(), check=True)
for name in ('chomp', 'pile', 'clock', 'bleh', 'factory'):
    x = load(RAW + name + '.mp3')
    e = np.abs(x).max(axis=1); on = np.argmax(e > e.max() * 0.15); x = x[max(0, on - int(0.005 * SR)):]
    f = int(0.05 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    x *= 10 ** (-1 / 20) / (np.abs(x).max() + 1e-9)
    save(x, name); print(name, round(len(x) / SR, 2), 's')
