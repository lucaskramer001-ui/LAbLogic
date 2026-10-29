# Tighten pauses in the raw take, speed it up slightly, and remap word times.
import json, subprocess, numpy as np, sys
VO = '/home/user/LAbLogic/video/public/iceberg/vo/'
SR = 48000; KEEP = 0.26; TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.1
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VO + 'take1.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32).copy()
hop = int(0.02 * SR)
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop] + 1e-12)
db = 20 * np.log10(rms)
sil = db < -42
segs = []; i = 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]: j += 1
        if (j - i) * 0.02 >= 0.18: segs.append((i * 0.02, j * 0.02))
        i = j
    else: i += 1
# cut the excess from the middle of every long pause (not the leading/trailing silence of the file)
cuts = []
for a, b in segs:
    if a < 0.05 or b > len(x) / SR - 0.05: continue
    d = b - a
    if d > KEEP:
        m = (a + b) / 2; cuts.append((m - (d - KEEP) / 2, m + (d - KEEP) / 2))
keep = []; t = 0.0
for a, b in cuts: keep.append((t, a)); t = b
keep.append((t, len(x) / SR))
fade = int(0.008 * SR); out = []
for a, b in keep:
    s = x[int(a * SR):int(b * SR)].copy()
    if len(s) > 2 * fade:
        s[:fade] *= np.linspace(0, 1, fade); s[-fade:] *= np.linspace(1, 0, fade)
    out.append(s)
y = np.concatenate(out)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                '-af', f'atempo={TEMPO}', '-ar', str(SR), '-c:a', 'pcm_s16le', VO + 'vo.wav'],
               input=y.astype(np.float32).tobytes(), check=True)
def remap(t):
    removed = sum(min(b, t) - a for a, b in cuts if t > a)
    return (t - removed) / TEMPO
words = json.load(open(VO + 'words_raw.json'))['words']
w2 = [{'w': w['text'], 's': round(remap(w['start']), 3), 'e': round(remap(w['end']), 3)} for w in words if w['type'] == 'word']
json.dump(w2, open(VO + 'words.json', 'w'), indent=0)
print('cuts', len(cuts), 'removed %.2f s' % sum(b - a for a, b in cuts), 'final %.2f s' % (len(y) / SR / TEMPO))
