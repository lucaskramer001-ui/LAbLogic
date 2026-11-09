// "Pro" motion layer for 1920x1080 long-form videos: wipes between scenes, chapter cards, camera drift,
// parallax clouds, count-up numbers and soft shadows. Built for the black box long-form (2026-11-09).
import React from 'react';
import {C, FONT_DISPLAY, INK_W} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, prog} from '../iceberg/anim';
import {W, H} from '../iceberglong/kit';

// Slow camera push-in + sideways drift over a scene (keeps every shot alive).
export const drift = (t: number, t0: number, t1: number, opts: {x?: number; y?: number; s0?: number; s1?: number; dx?: number; dy?: number} = {}) => {
  const {x = W / 2, y = H / 2, s0 = 1.0, s1 = 1.025, dx = 16, dy = 0} = opts;
  const u = clamp((t - t0) / Math.max(0.1, t1 - t0));
  const e = easeInOutCubic(u);
  return {x: x + dx * (e - 0.5), y: y + dy * (e - 0.5), s: lerp(s0, s1, e)};
};

// Diagonal two-band wipe (Lab Yellow + Sky) centred on a cut at `at` (screen covered at `at`).
export const Wipe: React.FC<{t: number; at: number; dur?: number}> = ({t, at, dur = 0.5}) => {
  const u = (t - (at - dur / 2)) / dur;
  if (u <= 0 || u >= 1) return null;
  // band position: sweeps from off-left to off-right; covers the frame at u = 0.5
  const span = W + 2 * H + 800;
  const p = lerp(-span / 2 - 600, span / 2 + 600, easeInOutCubic(u));
  const band = (offset: number, width: number, color: string) => {
    const x0 = W / 2 + p + offset - width / 2;
    return (
      <path
        d={`M ${x0} ${-100} L ${x0 + width} ${-100} L ${x0 + width - 700} ${H + 100} L ${x0 - 700} ${H + 100} Z`}
        fill={color}
        stroke={C.ink}
        strokeWidth={INK_W * 2}
        strokeLinejoin="round"
      />
    );
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {band(-700, 1200, C.sky)}
      {band(300, 2600, C.yellow)}
    </svg>
  );
};

// Chapter card: slides in at the bottom left, holds, slides out.
export const ChapterCard: React.FC<{t: number; at: number; n: number; title: string; hold?: number}> = ({t, at, n, title, hold = 2.6}) => {
  const d = t - at;
  if (d < 0 || d > hold + 0.6) return null;
  const inU = easeOutBack(clamp(d / 0.45));
  const outU = easeInOutCubic(clamp((d - hold) / 0.45));
  const x = lerp(-900, 90, inU) - 1100 * outU;
  const size = 58;
  const wTitle = title.length * size * 0.72 + 80;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(${x} 900)`} {...(d > 0.5 && d < hold ? {'data-label': title} : {'data-skip': 'sliding'})}>
        <rect x={10} y={-30 + 10} width={wTitle} height={110} rx={20} fill={C.ink} />
        <rect x={0} y={-30} width={wTitle} height={110} rx={20} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
        <rect x={0} y={-30} width={22} height={110} rx={6} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
        <text x={50} y={46} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={C.ink}>
          {title}
        </text>
        <rect x={0} y={-92} width={220} height={52} rx={26} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
        <text x={110} y={-56} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={30} letterSpacing={2} fill={C.ink}>
          {`CHAPTER ${n}`}
        </text>
      </g>
    </svg>
  );
};

// Drifting flat clouds (parallax: pass a smaller speed for far layers).
export const Clouds: React.FC<{t: number; y: number; speed?: number; s?: number; n?: number; color?: string; seed?: number}> = ({t, y, speed = 20, s = 1, n = 5, color = '#E9F4FD', seed = 1}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const span = W + 600;
      const x = ((((i * 397 + seed * 131) % span) + t * speed) % span) - 300;
      const yy = y + ((i * 53 + seed * 17) % 120);
      const k = s * (0.7 + ((i * 7) % 5) * 0.1);
      return (
        <g key={i} transform={`translate(${x} ${yy}) scale(${k})`}>
          <path d="M -120 0 Q -120 -50 -70 -50 Q -50 -100 0 -90 Q 50 -110 80 -60 Q 130 -60 130 0 Z" fill={color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

// Soft flat contact shadow.
export const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 0.18}) => <ellipse cx={x} cy={y} rx={w / 2} ry={w * 0.08} fill={C.ink} opacity={o} />;

// Number that counts up from `from` to `to` between t0 and t1 (formatted with thousands separators).
export const countUp = (t: number, t0: number, t1: number, from: number, to: number, decimals = 0) => {
  const v = lerp(from, to, prog(t, t0, t1, easeOutCubic));
  return v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
};

// Gentle idle bob for characters/objects.
export const bob = (t: number, amp = 8, speed = 2.2, phase = 0) => Math.sin(t * speed + phase) * amp;
