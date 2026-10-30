import React from 'react';
import {C, Face, FONT_DISPLAY, INK_W, Mood} from '../iceberg/art';
import {rnd} from '../iceberg/anim';

export const SPACE = '#1B2A4A';
export const SPACE_L = '#26385F';
export const SUN = '#FFC93C';
export const SUN_D = '#FF9F1C';
export const SUN_HOT = '#FFE680';
export const EARTH_SEA = '#3E8EDE';
export const EARTH_LAND = '#5CBF6B';
export const MARS = '#E0663F';
export const VENUS = '#E8C27A';

// Dark space background with twinkling stars (screen-sized, 1920x1080).
export const SpaceBg: React.FC<{t: number; w?: number; h?: number; x0?: number; y0?: number}> = ({t, w = 1920, h = 1080, x0 = 0, y0 = 0}) => (
  <g>
    <rect x={x0 - 2000} y={y0 - 2000} width={w + 4000} height={h + 4000} fill={SPACE} />
    {Array.from({length: 140}).map((_, i) => {
      const x = x0 - 600 + rnd(i * 3 + 1) * (w + 1200);
      const y = y0 - 400 + rnd(i * 7 + 2) * (h + 800);
      const r = 1.5 + rnd(i * 11) * 2.8;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + rnd(i) * 2) + i);
      return <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={tw} />;
    })}
  </g>
);

// The Sun with a cartoon face and wobbling flame rim.
export const Sun: React.FC<{x: number; y: number; r: number; t: number; face?: {mood?: Mood; open?: number; look?: {x: number; y: number}}; noFace?: boolean}> = ({
  x,
  y,
  r,
  t,
  face,
  noFace,
}) => {
  const n = 28;
  const pts: string[] = [];
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = r * (i % 2 ? 1.1 + 0.035 * Math.sin(t * 5 + i) : 1.2 + 0.05 * Math.sin(t * 3.3 + i * 1.7));
    pts.push(`${x + rr * Math.cos(a)} ${y + rr * Math.sin(a)}`);
  }
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.55} fill={SUN} opacity={0.12} />
      <circle cx={x} cy={y} r={r * 1.33} fill={SUN} opacity={0.15} />
      <path d={'M ' + pts.join(' L ') + ' Z'} fill={SUN_D} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={r} fill={SUN} stroke={C.ink} strokeWidth={INK_W} />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.28} fill={SUN_HOT} opacity={0.8} />
      {!noFace && <Face x={x} y={y - r * 0.12} s={r / 150} mood={face?.mood ?? 'happy'} open={face?.open ?? 1} look={face?.look} gap={48} />}
    </g>
  );
};

// Earth: ocean disc with simple flat continents, optional face.
export const Earth: React.FC<{x: number; y: number; r: number; rot?: number; face?: {mood?: Mood; open?: number; look?: {x: number; y: number}}}> = ({x, y, r, rot = 0, face}) => (
  <g transform={`translate(${x} ${y})`}>
    <clipPath id={`earthclip${Math.round(r)}`}>
      <circle r={r} />
    </clipPath>
    <circle r={r} fill={EARTH_SEA} />
    <g clipPath={`url(#earthclip${Math.round(r)})`}>
      <g transform={`translate(${((rot % 1) * 2 - 1) * r} 0)`}>
        {[-2, 0, 2].map((k) => (
          <g key={k} transform={`translate(${k * r} 0) scale(${r / 100})`}>
            <path d="M -70 -60 Q -40 -80 -10 -62 Q 5 -40 -20 -25 Q -40 -10 -30 15 Q -50 20 -62 0 Q -80 -30 -70 -60 Z" fill={EARTH_LAND} stroke={C.ink} strokeWidth={4} />
            <path d="M 20 -20 Q 50 -35 70 -10 Q 75 25 50 50 Q 30 70 22 40 Q 30 15 20 -20 Z" fill={EARTH_LAND} stroke={C.ink} strokeWidth={4} />
            <path d="M -40 55 Q -20 45 -5 60 Q -15 80 -40 70 Z" fill={EARTH_LAND} stroke={C.ink} strokeWidth={4} />
          </g>
        ))}
      </g>
      <circle cx={r * 0.35} cy={r * 0.1} r={r} fill="#000" opacity={0.12} transform={`translate(${r * 0.75} 0)`} />
    </g>
    <circle r={r} fill="none" stroke={C.ink} strokeWidth={INK_W} />
    {face && <Face x={0} y={-r * 0.1} s={r / 160} mood={face.mood ?? 'happy'} open={face.open ?? 1} look={face.look} gap={44} />}
  </g>
);

export const Planet: React.FC<{x: number; y: number; r: number; color: string; label?: string; face?: {mood?: Mood}}> = ({x, y, r, color, label, face}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} stroke={C.ink} strokeWidth={INK_W * 0.8} />
    <circle cx={x + r * 0.3} cy={y + r * 0.1} r={r * 0.9} fill="#000" opacity={0.1} clipPath="none" />
    {face && <Face x={x} y={y - r * 0.1} s={r / 160} mood={face.mood ?? 'happy'} gap={44} />}
    {label && (
      <text x={x} y={y + r + 46} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={34} fill={C.paper} stroke={C.ink} strokeWidth={8} paintOrder="stroke fill">
        {label}
      </text>
    )}
  </g>
);

// Black tied trash bag (centre at x,y, ~120 wide at s=1).
export const TrashBag: React.FC<{x: number; y: number; s?: number; rot?: number; face?: {mood?: Mood; open?: number; look?: {x: number; y: number}}}> = ({x, y, s = 1, rot = 0, face}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -58 10 Q -66 -40 -20 -52 L -10 -66 Q 0 -78 10 -66 L 20 -52 Q 66 -40 58 10 Q 56 60 0 62 Q -56 60 -58 10 Z" fill="#2B2B2E" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -14 -64 Q -26 -86 -8 -84 M 14 -64 Q 26 -86 8 -84" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M -30 -20 Q -36 10 -26 36" stroke="#55555C" strokeWidth={7} fill="none" strokeLinecap="round" />
    {face && <Face x={0} y={4} s={0.42} mood={face.mood ?? 'happy'} open={face.open ?? 1} look={face.look} gap={40} />}
  </g>
);

// Generic cartoon rocket pointing up (nose at y - 160*s), optional flame and cargo bag window.
export const Rocket: React.FC<{x: number; y: number; s?: number; rot?: number; flame?: number; t?: number; bag?: boolean; color?: string}> = ({
  x,
  y,
  s = 1,
  rot = 0,
  flame = 0,
  t = 0,
  bag,
  color = C.paper,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {flame > 0 && (
      <g>
        <path d={`M -26 70 Q 0 ${70 + 140 * flame + 20 * Math.sin(t * 40)} 26 70 Z`} fill={C.gold} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M -13 70 Q 0 ${70 + 80 * flame + 12 * Math.sin(t * 47)} 13 70 Z`} fill={SUN_HOT} />
      </g>
    )}
    <path d="M -40 40 L -70 90 L -36 80 Z" fill={C.red} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 40 40 L 70 90 L 36 80 Z" fill={C.red} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -40 80 L -40 -60 Q -40 -130 0 -165 Q 40 -130 40 -60 L 40 80 Z" fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -34 -95 Q 0 -110 34 -95 Q 22 -140 0 -158 Q -22 -140 -34 -95 Z" fill={C.red} />
    <path d="M -40 80 L -40 -60 Q -40 -130 0 -165 Q 40 -130 40 -60 L 40 80 Z" fill="none" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={0} cy={-30} r={22} fill={C.sky} stroke={C.ink} strokeWidth={5} />
    {bag && <TrashBag x={0} y={-28} s={0.26} />}
    <rect x={-40} y={60} width={80} height={20} fill={C.teal} stroke={C.ink} strokeWidth={5} />
  </g>
);

// Falcon Heavy style: three cores side by side, the middle one with a fairing (nose at y - 330*s).
export const HeavyRocket: React.FC<{x: number; y: number; s?: number; flame?: number; t?: number}> = ({x, y, s = 1, flame = 0, t = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {flame > 0 &&
      [-62, 0, 62].map((cx) => (
        <path key={cx} d={`M ${cx - 22} 150 Q ${cx} ${150 + 160 * flame + 20 * Math.sin(t * 40 + cx)} ${cx + 22} 150 Z`} fill={C.gold} stroke={C.ink} strokeWidth={5} />
      ))}
    {[-62, 62].map((cx) => (
      <g key={cx}>
        <path d={`M ${cx - 28} 150 L ${cx - 28} -120 Q ${cx} -170 ${cx + 28} -120 L ${cx + 28} 150 Z`} fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={cx - 28} y={110} width={56} height={40} fill={C.ink} />
      </g>
    ))}
    <path d="M -30 150 L -30 -180 L -40 -200 L -40 -260 Q 0 -340 40 -260 L 40 -200 L 30 -180 L 30 150 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-30} y={110} width={60} height={40} fill={C.ink} />
    <path d="M -40 -200 L 40 -200" stroke={C.ink} strokeWidth={5} />
  </g>
);

// Parker-style probe: heat shield disc in front (facing left), body and two small panels.
export const Probe: React.FC<{x: number; y: number; s?: number; rot?: number; glow?: number}> = ({x, y, s = 1, rot = 0, glow = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {glow > 0 && <ellipse cx={-40} cy={0} rx={30} ry={80} fill={C.gold} opacity={0.5 * glow} />}
    <rect x={-10} y={-36} width={70} height={72} rx={8} fill={C.chrome} stroke={C.ink} strokeWidth={5} />
    <rect x={20} y={-80} width={18} height={50} fill={C.teal} stroke={C.ink} strokeWidth={4} />
    <rect x={20} y={30} width={18} height={50} fill={C.teal} stroke={C.ink} strokeWidth={4} />
    <line x1={60} y1={0} x2={86} y2={0} stroke={C.ink} strokeWidth={5} />
    <circle cx={90} cy={0} r={7} fill={C.ink} />
    <ellipse cx={-22} cy={0} rx={16} ry={66} fill={C.paper} stroke={C.ink} strokeWidth={5} />
  </g>
);

// Dashed orbit ellipse.
export const Orbit: React.FC<{cx: number; cy: number; rx: number; ry: number; color?: string; dash?: string; w?: number; opacity?: number}> = ({
  cx,
  cy,
  rx,
  ry,
  color = '#9FB3D9',
  dash = '14 14',
  w = 5,
  opacity = 0.8,
}) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={w} strokeDasharray={dash} opacity={opacity} />;

// Thick arrow from (x1,y1) to (x2,y2) in the brand style (ink outline + coloured core).
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color?: string; w?: number; head?: number}> = ({x1, y1, x2, y2, color = C.yellow, w = 22, head = 46}) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 4) return null;
  const hx = x2 - Math.cos(a) * head * 0.8;
  const hy = y2 - Math.sin(a) * head * 0.8;
  const p = (ang: number, d: number) => `${x2 - Math.cos(a + ang) * d} ${y2 - Math.sin(a + ang) * d}`;
  const tri = `M ${x2} ${y2} L ${p(0.5, head)} L ${p(-0.5, head)} Z`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={C.ink} strokeWidth={w + 12} strokeLinecap="round" />
      <path d={tri} fill={C.ink} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={tri} fill={color} />
    </g>
  );
};

// Pile of trash bags (a heap) centred at x, ground at y; `grow` 0..1 adds bags.
export const TrashHeap: React.FC<{x: number; y: number; s?: number; grow?: number; t?: number}> = ({x, y, s = 1, grow = 1, t = 0}) => {
  const bags: Array<[number, number, number, number]> = [];
  let k = 0;
  for (let row = 0; row < 6; row++) {
    const n = 7 - row;
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * 92 + (rnd(k) - 0.5) * 20;
      const by = -40 - row * 70 + (rnd(k + 50) - 0.5) * 10;
      bags.push([bx, by, (rnd(k + 9) - 0.5) * 40, 0.85 + rnd(k + 3) * 0.3]);
      k++;
    }
  }
  const shown = Math.round(bags.length * grow);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {bags.slice(0, shown).map(([bx, by, r, sc], i) => (
        <TrashBag key={i} x={bx} y={by + Math.sin(t * 2 + i) * 1.5} s={sc} rot={r} />
      ))}
    </g>
  );
};

// Simple house icon.
export const House: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-50} y={-60} width={100} height={60} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <path d="M -64 -56 L 0 -110 L 64 -56 Z" fill={C.red} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-12} y={-34} width={24} height={34} fill={C.teal} stroke={C.ink} strokeWidth={4} />
  </g>
);

// Yellow nuclear-waste barrel.
export const Barrel: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-190} width={140} height={190} rx={14} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
    <line x1={-70} x2={70} y1={-140} y2={-140} stroke={C.ink} strokeWidth={5} />
    <line x1={-70} x2={70} y1={-50} y2={-50} stroke={C.ink} strokeWidth={5} />
    <circle cx={0} cy={-95} r={32} fill={C.ink} />
    {[0, 1, 2].map((i) => {
      const a0 = (i * 120 - 90 - 30) * (Math.PI / 180);
      const a1 = (i * 120 - 90 + 30) * (Math.PI / 180);
      return <path key={i} d={`M ${7 * Math.cos(a0)} ${-95 + 7 * Math.sin(a0)} L ${28 * Math.cos(a0)} ${-95 + 28 * Math.sin(a0)} A 28 28 0 0 1 ${28 * Math.cos(a1)} ${-95 + 28 * Math.sin(a1)} L ${7 * Math.cos(a1)} ${-95 + 7 * Math.sin(a1)} Z`} fill={C.yellow} />;
    })}
    <circle cx={0} cy={-95} r={7} fill={C.yellow} />
  </g>
);

// Space Shuttle icon (side view, nose up).
export const Shuttle: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -22 120 L -22 -150 Q 0 -200 22 -150 L 22 120 Z" fill={C.gold} stroke={C.ink} strokeWidth={5} />
    <path d="M 22 120 L 22 -40 Q 40 -100 58 -40 L 58 120 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <path d="M 22 60 L 90 120 L 22 120 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -22 120 L -22 -80 Q -36 -110 -50 -80 L -50 120 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} />
  </g>
);

// Recycling bin.
export const Bin: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = C.teal}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -60 -150 L 60 -150 L 50 0 L -50 0 Z" fill={color} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-70} y={-176} width={140} height={28} rx={8} fill={color} stroke={C.ink} strokeWidth={INK_W} />
    <g transform="translate(0 -78) scale(0.9)" stroke={C.paper} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M -26 14 L -8 -18 L 2 -2" />
      <path d="M 12 -20 L 30 12 L 14 12" />
      <path d="M 22 26 L -16 26 L -6 12" />
    </g>
  </g>
);

// Red rubber-stamp label, rotated.
export const Stamp: React.FC<{x: number; y: number; text: string; s?: number; rot?: number; color?: string; size?: number}> = ({x, y, text, s = 1, rot = -7, color = C.red, size = 72}) => {
  const w = text.length * size * 0.82 + 90;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={18} fill={C.paper} stroke={color} strokeWidth={13} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

// Horizontal bar with label (for comparisons).
export const Bar: React.FC<{x: number; y: number; w: number; h?: number; color: string; label: string; value: string; grow: number}> = ({x, y, w, h = 70, color, label, value, grow}) => (
  <g>
    <text x={x - 24} y={y + h * 0.66} textAnchor="end" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={40} fill={C.paper} stroke={C.ink} strokeWidth={9} paintOrder="stroke fill">
      {label}
    </text>
    {grow > 0 && <rect x={x} y={y} width={Math.max(4, w * grow)} height={h} rx={12} fill={color} stroke={C.ink} strokeWidth={6} />}
    {grow > 0.98 && (
      <text x={x + w * grow + 22} y={y + h * 0.68} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={46} fill={C.paper} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
        {value}
      </text>
    )}
  </g>
);
