"""Synthesises the subtle sound design for the MSKSubscribe overlay.

Every cue is timed to the animation frames in src/subscribe/SubscribeLike.tsx (60 fps).
Output: public/subscribe/sfx.wav (48 kHz, stereo, 16 bit, 6 s). Only needs numpy.
Run: python3 scripts/subscribe_sfx.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
FPS = 60
DUR = 6.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
out = np.zeros((N, 2))


def t_of(frame):
    return frame / FPS


def env(n, attack=0.002, decay=0.1):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.clip((f - lo * 0.7) / (lo * 0.3 + 1), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    return np.fft.irfft(X * m, len(x))


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    sig = sig[: max(0, N - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i : i + len(sig), 0] += sig * gain * l * 1.414
    out[i : i + len(sig), 1] += sig * gain * r * 1.414


def sweep(f0, f1, dur, decay, shape=np.sin):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return shape(ph) * env(n, 0.003, decay)


def pop(f0=520, f1=180, dur=0.12):
    return sweep(f0, f1, dur, 0.035)


def bloop(f0=380, f1=980, dur=0.14):
    return sweep(f0, f1, dur, 0.05)


def click():
    n = int(SR * 0.03)
    nz = bandpass(rng.standard_normal(n), 2500, 9000) * env(n, 0.0003, 0.004)
    tone = np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * env(n, 0.0003, 0.003)
    return nz * 0.8 + tone * 0.4


def tick():
    n = int(SR * 0.04)
    return np.sin(2 * np.pi * 1900 * np.arange(n) / SR) * env(n, 0.0005, 0.008)


def whoosh(dur, rising=True):
    n = int(SR * dur)
    nz = rng.standard_normal(n)
    # crossfade between a low and a high band to fake a filter sweep
    lo, hi = bandpass(nz, 300, 1500), bandpass(nz, 1500, 7000)
    k = np.linspace(0, 1, n) if rising else np.linspace(1, 0, n)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return (lo * (1 - k) + hi * k) * shape


def chime(freq, decay=0.6, partials=((1, 1.0), (2.0, 0.35), (3.01, 0.12))):
    n = int(SR * (decay * 5))
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * p * t) * np.exp(-t * p / decay) for p, a in partials)
    return s * np.clip(t / 0.002, 0, 1)


def bell(freq):
    # small notification bell: inharmonic partials
    parts = ((1, 1.0), (2.76, 0.45), (5.4, 0.25), (8.93, 0.12))
    n = int(SR * 2.2)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * p * t) * np.exp(-t * (1 + p) / 1.6) for p, a in parts)
    trem = 1 + 0.15 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 2)  # follows the bell wobble
    return s * trem * np.clip(t / 0.001, 0, 1)


def sparkle(start_f=2600, count=5, spacing=0.035):
    n = int(SR * (count * spacing + 0.5))
    s = np.zeros(n)
    for k in range(count):
        c = chime(start_f * 2 ** (k * 3 / 12), decay=0.12, partials=((1, 1.0), (2.0, 0.2)))
        i = int(k * spacing * SR)
        seg = c[: n - i] * (0.9 ** k)
        s[i : i + len(seg)] += seg
    return s


# Positions on screen -> stereo pan (logo is left of centre, buttons right of centre)
P_LOGO, P_PILL, P_LIKE, P_SUB = -0.45, -0.1, 0.1, 0.3

# Logo pops in
place(pop(560, 190, 0.14), t_of(1), 0.55, P_LOGO)
place(bandpass(rng.standard_normal(int(SR * 0.15)), 60, 200) * env(int(SR * 0.15), 0.002, 0.05), t_of(1), 0.6, P_LOGO)
# Pill slides open
place(whoosh(0.38, True), t_of(10), 0.16, P_PILL)
# Content staggers in
for i in range(3):
    place(tick(), t_of(28 + i * 6), 0.10, -0.1 + i * 0.2)
# Shimmer sweep
place(sparkle(3000, 4, 0.05), t_of(52), 0.07, 0.0)
# Like
place(click(), t_of(98), 0.35, P_LIKE)
place(bloop(420, 1050, 0.13), t_of(100), 0.32, P_LIKE)
place(sparkle(2200, 3, 0.03), t_of(103), 0.08, P_LIKE)
# Subscribe
place(click(), t_of(158), 0.35, P_SUB)
place(chime(1318.5, 0.35), t_of(160), 0.16, P_SUB)  # E6
place(chime(1975.5, 0.45), t_of(166), 0.14, P_SUB)  # B6
place(bell(1568), t_of(166), 0.11, P_SUB)  # notification bell, rings with the icon wobble
# Collapse
place(whoosh(0.4, False), t_of(304), 0.14, P_PILL)
place(pop(240, 620, 0.12)[::-1] * 0.8, t_of(330), 0.35, P_LOGO)

# Light room reverb for polish
ir_n = int(SR * 0.6)
ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.12)
ir /= np.sqrt(np.sum(ir ** 2))
L = 1 << int(np.ceil(np.log2(N + ir_n)))
for ch in range(2):
    wet = np.fft.irfft(np.fft.rfft(out[:, ch], L) * np.fft.rfft(ir, L), L)[:N]
    out[:, ch] = out[:, ch] + wet * 0.12

# Normalise to -6 dBFS peak and fade the tail
out *= 10 ** (-6 / 20) / np.max(np.abs(out))
out[-int(SR * 0.05) :] *= np.linspace(1, 0, int(SR * 0.05))[:, None]

dst = Path(__file__).resolve().parent.parent / 'public' / 'subscribe' / 'sfx.wav'
with wave.open(str(dst), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote', dst)
