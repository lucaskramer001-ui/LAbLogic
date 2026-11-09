# Add a ducked music bed (two tracks, crossfaded by chapter) and extra sound effects to the finished
# black box long-form, then loudness-normalise and mux with the existing video (no re-render).
import json, re, subprocess, numpy as np
ROOT = '/home/user/LAbLogic/video/'
RAW = ROOT + 'images/blackbox-long/sfx_raw/'
OUT = ROOT + 'out/blackboxlong/'
SR = 48000
OFF = 0.4  # voice-over offset in the composition

def load(p, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
def db(x): return 10 ** (x / 20)
def rms_db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)

W = json.load(open(ROOT + 'src/blackboxlong/words.json'))
ws = [re.sub(r"[^a-z0-9']", '', w['w'].lower()) for w in W]
def ph(p, after=0):
    q = [re.sub(r"[^a-z0-9']", '', x.lower()) for x in p.split()]
    for i in range(len(ws)):
        if W[i]['s'] + OFF < after: continue
        if ws[i:i + len(q)] == q: return W[i]['s'] + OFF
    raise SystemExit('missing ' + p)
VO_END = W[-1]['e'] + OFF

base = load(OUT + 'blackbox-long-1080p.mp4')  # current mix (voice + sfx), already -14 LUFS
N = len(base)
T = N / SR

# ---------------------------------------------------------------- music bed
cur = load(RAW + 'music_curious.mp3'); ten = load(RAW + 'music_tense.mp3')
for m in (cur, ten): m *= db(-20 - rms_db(m))  # both to about -20 dB RMS
def seg(m, start, length):
    n = int(length * SR); s0 = int(start * SR)
    out = np.zeros((n, 2), np.float32); i = 0
    while i < n:
        take = min(n - i, len(m) - s0); out[i:i + take] = m[s0:s0 + take]; i += take; s0 = int(8 * SR)
    return out
t_tense = ph('and that armor is tested') - 0.6
t_back = ph("so why don't we just build the whole plane that way") - 0.6
XF = 2.0
music = np.zeros((N, 2), np.float32)
parts = [(cur, 0.0, 0.0, t_tense + XF), (ten, t_tense, 4.0, t_back - t_tense + XF), (cur, t_back, 70.0, T - t_back)]
for m, at, src, ln in parts:
    s = seg(m, src, ln); n = len(s)
    fi = np.ones(n, np.float32); xf = int(XF * SR)
    if at > 0: fi[:xf] = np.linspace(0, 1, xf)
    if at + ln < T - 0.1: fi[-xf:] = np.linspace(1, 0, xf)
    a = int(at * SR); b = min(N, a + n)
    music[a:b] += s[:b - a] * fi[:b - a, None]
# ducking: -14 dB while the voice talks, -7 dB in pauses longer than 0.7 s, -4 dB on the end card
act = np.zeros(N, bool)
for w in W:
    a = int((w['s'] + OFF - 0.15) * SR); b = int((w['e'] + OFF + 0.3) * SR); act[max(0, a):min(N, b)] = True
# close short gaps
gap = int(0.7 * SR); i = 0
idx = np.flatnonzero(np.diff(act.astype(np.int8)) != 0)
for k in range(len(idx) - 1):
    if not act[idx[k] + 1] and idx[k + 1] - idx[k] < gap: act[idx[k] + 1:idx[k + 1] + 1] = True
g = np.where(act, -12.0, -6.0).astype(np.float32)
g[int((VO_END + 0.3) * SR):] = -4.0
# smooth gain changes (0.35 s)
k = int(0.35 * SR); ker = np.ones(k, np.float32) / k
g = np.convolve(g, ker, 'same')
fade_out = int(2.5 * SR); env = db(g); env[-fade_out:] *= np.linspace(1, 0, fade_out)
env[:int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))
music *= env[:, None]

# ---------------------------------------------------------------- sound effects
def sfx(name, peak=-1.0, loop_to=None):
    x = load(RAW + name + '.mp3')
    e = np.abs(x).max(axis=1); on = np.argmax(e > e.max() * 0.15)
    x = x[max(0, on - int(0.01 * SR)):]
    if loop_to:
        L = int(loop_to * SR); xf = int(0.15 * SR); y = x.copy()
        while len(y) < L:
            y = np.concatenate([y[:-xf], y[-xf:] * np.linspace(1, 0, xf)[:, None] + x[:xf] * np.linspace(0, 1, xf)[:, None], x[xf:]])
        x = y[:L]
    f = int(0.03 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    return x * db(peak) / (np.abs(x).max() + 1e-9)
S = dict(
    fix=ph("so here's the obvious") - 0.1, orange=ph("let's start with the name") - 0.1, warren=ph('the idea came from') - 0.1,
    two=ph("and there isn't just one") - 0.1, inside=ph("now what's inside") - 0.1, tests=ph('and that armor is tested') - 0.1,
    af447=ph('that toughness has paid') - 0.1, whole=ph("so why don't we just build the whole plane that way") - 0.1,
    human=ph('and even if it could fly') - 0.1, sea=ph('and it has to survive the water') - 0.1)
cues = []
for k in ('fix', 'orange', 'warren', 'two', 'inside', 'tests', 'af447', 'whole', 'human'):
    cues.append(('swoosh', S[k] - 0.3, -15))
cues += [
    ('flyby', S['fix'] + 0.2, -17), ('flyby', ph('the comet'), -19), ('flyby', ph('next flight') - 0.4, -15),
    ('spotlight', ph('searchers can spot') - 0.35, -15),
    ('ding', ph('so he imagined'), -14), ('ding', ph('required on airliners'), -18),
    ('data', ph('stores numbers'), -18), ('data', ph('many times every'), -18),
    ('alarm', ph('alarms'), -18), ('switch', ph('switches'), -12),
    ('clang', ph('an impact of') + 0.9, -9), ('clang', ph('a heavy weight') + 1.0, -11), ('press', ph("it's crushed") + 0.3, -10),
    ('plop', S['sea'] + 0.1, -14),
    ('sonar', ph('a beacon'), -14), ('sonar', ph('a beacon') + 1.25, -17), ('sonar', ph('finally found') - 0.6, -15),
    ('satellite', ph('sending more flight'), -20),
    ('enginefail', ph('too heavy', S['whole']) - 0.6, -13),
    ('sled', ph('rode a rocket sled') + 0.2, -12),
    ('switch', ph('sixteen g'), -14),
]
beds = [('underwater', S['sea'], 9.0, -20), ('underwater', ph('lay on the sea floor') - 0.4, 12.0, -20), ('tick', ph('ninety seconds') - 1.5, 4.0, -18)]
fx = np.zeros((N, 2), np.float32)
for name, at, lvl in cues:
    x = sfx(name) * db(lvl + 1); a = int(at * SR); b = min(N, a + len(x)); fx[a:b] += x[:b - a]
for name, at, ln, lvl in beds:
    x = sfx(name, loop_to=ln) * db(lvl + 1)
    f = int(0.5 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    a = int(at * SR); b = min(N, a + len(x)); fx[a:b] += x[:b - a]

mix = base + music + fx
print('rms base %.1f music %.1f fx %.1f' % (rms_db(base), rms_db(music), rms_db(fx)))
pk = np.abs(mix).max()
if pk > 0.98: mix *= 0.98 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', OUT + 'mix_new.wav'], input=mix.astype(np.float32).tobytes(), check=True)
print('wrote', OUT + 'mix_new.wav', round(T, 2), 's')
