# Join the voice-over parts, cap long pauses, optional tempo, and remap word times.
# usage: python3 voice.py KEEP TEMPO
import json, subprocess, numpy as np, sys
VO = '/home/user/LAbLogic/video/public/sun/vo/'
SR = 48000
KEEP = float(sys.argv[1]) if len(sys.argv) > 1 else 0.5
TEMPO = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
GAP = 0.7  # pause between the two takes
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
parts, words = [], []
off = 0.0
for i in (1, 2):
    x = load(VO + f'part{i}.mp3')
    w = [dict(w, start=w['start'] + off, end=w['end'] + off) for w in json.load(open(VO + f'words{i}_raw.json'))['words'] if w['type'] == 'word']
    words += w
    parts.append(x)
    off += len(x) / SR
    if i == 1:
        parts.append(np.zeros(int(GAP * SR), np.float32)); off += GAP
x = np.concatenate(parts)
hop = int(0.02 * SR)
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop] + 1e-12)
sil = 20 * np.log10(rms) < -42
segs = []; i = 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]: j += 1
        if (j - i) * 0.02 >= 0.18: segs.append((i * 0.02, j * 0.02))
        i = j
    else: i += 1
cuts = []
for a, b in segs:
    if a < 0.05 or b > len(x) / SR - 0.05: continue
    if b - a > KEEP:
        m = (a + b) / 2; d = b - a; cuts.append((m - (d - KEEP) / 2, m + (d - KEEP) / 2))
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
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={TEMPO}', '-ar', str(SR), '-c:a', 'pcm_s16le', VO + 'vo.wav'],
               input=y.astype(np.float32).tobytes(), check=True)
def remap(t):
    return (t - sum(min(b, t) - a for a, b in cuts if t > a)) / TEMPO
json.dump([{'w': w['text'], 's': round(remap(w['start']), 3), 'e': round(remap(w['end']), 3)} for w in words], open(VO + 'words.json', 'w'), indent=0)
print('cuts', len(cuts), 'removed %.1f s' % sum(b - a for a, b in cuts), 'final %.1f s' % (len(y) / SR / TEMPO))
