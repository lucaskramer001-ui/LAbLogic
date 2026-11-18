// Lab Logic motion kit: the "professional" layer on top of pop()/prog().
// Everything is a pure function of t (seconds), so it renders frame-exact and works inside CameraMotionBlur.
import {Easing, interpolate} from 'remotion';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Eased 0..1 between t0 and t1. Default ease = expo-out (fast start, soft landing).
export const ease = (t: number, t0: number, t1: number, e: (u: number) => number = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(t, [t0, t1], [0, 1], {...CL, easing: e});

// Spring 0..1 with overshoot (bouncy = lower damping). Use for pop-ins of text and props.
export const springIn = (t: number, t0: number, dur = 0.6, damping = 12) =>
  t < t0 ? 0 : interpolate(t, [t0, t0 + dur], [0, 1], {...CL, easing: Easing.spring({damping, mass: 0.6, stiffness: 180})});

// Damped oscillation after an impulse at t0 (0 before t0, decays to 0). Drives jiggle, wobble, recoil.
export const jiggle = (t: number, t0: number, amp = 1, freq = 11, decay = 7) =>
  t < t0 ? 0 : amp * Math.exp(-decay * (t - t0)) * Math.sin(freq * (t - t0) * Math.PI * 2 * 0.25);

// Volume-preserving squash & stretch: k > 0 stretches tall, k < 0 squashes wide.
export const squash = (k: number) => ({sx: 1 / (1 + k), sy: 1 + k});

// Landing impact: quick squash then springy settle.
export const impact = (t: number, t0: number, amt = 0.25) => squash(-jiggle(t, t0, amt, 9, 8));

// Anticipation: pull back a little (negative) before the main move, then go. Returns 0..1 with a dip below 0.
export const anticipate = (t: number, t0: number, t1: number, back = 0.12) => {
  const wind = t0 - (t1 - t0) * 0.35;
  if (t < wind) return 0;
  if (t < t0) return -back * Math.sin(((t - wind) / (t0 - wind)) * Math.PI * 0.5);
  return interpolate(t, [t0, t1], [-back, 1], {...CL, easing: Easing.bezier(0.3, 1.4, 0.5, 1)});
};

// Blink: eyelid 0..1 (1 = open). Blinks every `every` seconds with a per-character offset.
export const blink = (t: number, seed = 0, every = 2.6) => {
  const u = (t + seed * 0.73) % every;
  return u < 0.07 ? 1 - u / 0.07 : u < 0.14 ? (u - 0.07) / 0.07 : 1;
};

// Idle breathing for characters: small sine on scale, phase per character.
export const breathe = (t: number, seed = 0, amt = 0.025) => squash(amt * Math.sin(t * 2.4 + seed));

// Camera shake from one or more impulses (deterministic, decays fast).
export const camShake = (t: number, hits: Array<[number, number]>) => {
  let x = 0;
  let y = 0;
  for (const [t0, amp] of hits) {
    if (t < t0) continue;
    const d = Math.exp(-9 * (t - t0)) * amp;
    x += d * Math.sin((t - t0) * 61);
    y += d * Math.cos((t - t0) * 47);
  }
  return {x, y};
};

// Slow drift so the frame is never fully static.
export const drift = (t: number, amt = 6) => ({x: Math.sin(t * 0.7) * amt, y: Math.cos(t * 0.53) * amt * 0.6});
