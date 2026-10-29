export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeOutBack = (u: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

// 0..1 progress of t between a and b, eased.
export const prog = (t: number, a: number, b: number, ease: (u: number) => number = easeInOutCubic) =>
  ease(clamp((t - a) / (b - a)));

// Pop-in scale: 0 before t0, overshoots to ~1.12 and settles to 1 with a damped spring.
export const pop = (t: number, t0: number, dur = 0.45) => {
  if (t < t0) return 0;
  const u = (t - t0) / dur;
  if (u >= 3) return 1;
  return 1 - Math.exp(-5 * u) * Math.cos(7.5 * u);
};

// Damped wobble after an impulse at t0 (returns 0 when settled).
export const wobble = (t: number, t0: number, amp = 1, freq = 9, decay = 6) => {
  if (t < t0) return 0;
  const d = t - t0;
  return amp * Math.exp(-decay * d) * Math.sin(2 * Math.PI * freq * d);
};

// Smooth pseudo-random shake made of sines (never random per-frame jumps).
export const shake = (t: number, amp: number) => ({
  x: amp * (Math.sin(t * 2 * Math.PI * 13.3) * 0.6 + Math.sin(t * 2 * Math.PI * 7.1 + 1.3) * 0.4),
  y: amp * (Math.sin(t * 2 * Math.PI * 11.7 + 0.7) * 0.6 + Math.sin(t * 2 * Math.PI * 5.3 + 2.1) * 0.4),
});

// Deterministic random from an integer seed.
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
