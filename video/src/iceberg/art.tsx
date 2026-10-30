import React from 'react';
import fontWidths from './fontWidths.json';

// Lab Logic palette (brand kit) + a few scene colours in the same flat style.
export const C = {
  yellow: '#FFD23F',
  gold: '#FFBA1A',
  sky: '#5DB7F5',
  skyL: '#80C7F8',
  teal: '#2A8C93',
  ink: '#141414',
  paper: '#FFF8E7',
  green: '#7CFF5B',
  red: '#E8352B',
  sea: '#2D78C4',
  seaDeep: '#1F5E9E',
  seaL: '#4A92D6',
  ice: '#FFFFFF',
  iceShade: '#CDEBF8',
  iceUnder: '#9AD3F2',
  iceUnderShade: '#7EC2EA',
  chrome: '#C3CED6',
  chromeShade: '#8E9BA5',
  sand: '#F4C95D',
  sandShade: '#E0A93B',
  mountain: '#7FA88A',
  mountainShade: '#668F72',
  sweat: '#9FE0FF',
};
export const INK_W = 7;
export const FONT_DISPLAY = 'Montserrat, "Arial Black", Arial, sans-serif';

// Advance width of a string in Montserrat (from the font file), in px.
export const textWidth = (text: string, size: number, weight: 800 | 900 = 800, letterSpacing = 0) => {
  const tbl = (fontWidths as Record<string, Record<string, number>>)[String(weight)];
  let w = 0;
  for (const ch of text) w += (tbl[ch] ?? 0.7) * size;
  return w + letterSpacing * Math.max(0, [...text].length - 1);
};

// ---------------------------------------------------------------- faces on objects
export type Mood = 'happy' | 'surprised' | 'worried' | 'scared' | 'smug' | 'squeeze' | 'neutral' | 'dizzy';
export const Face: React.FC<{
  x: number;
  y: number;
  s?: number;
  open?: number; // 0..1 eyelid opening (pops / blinks)
  look?: {x: number; y: number};
  mood?: Mood;
  gap?: number;
}> = ({x, y, s = 1, open = 1, look = {x: 0, y: 0}, mood = 'happy', gap = 46}) => {
  const ex = gap;
  const eyeRy = mood === 'surprised' || mood === 'scared' ? 34 : 30;
  const browLift = mood === 'surprised' || mood === 'scared' ? -14 : 0;
  const brow = (side: -1 | 1) => {
    // inner end up for worried/scared, inner down for smug
    const inner = mood === 'worried' || mood === 'scared' ? -12 : mood === 'smug' ? 8 : 0;
    const x0 = side * (ex - 26);
    const x1 = side * (ex + 24);
    const yb = -eyeRy - 18 + browLift;
    return <path d={`M ${x0} ${yb + inner} Q ${side * ex} ${yb - 10} ${x1} ${yb - inner * 0.3}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />;
  };
  const eye = (side: -1 | 1) => {
    const cx = side * ex;
    if (mood === 'squeeze') {
      return <path d={`M ${cx - side * 18} ${-14} L ${cx + side * 14} 0 L ${cx - side * 18} ${14}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    }
    if (mood === 'dizzy') {
      return (
        <g stroke={C.ink} strokeWidth={8} strokeLinecap="round">
          <line x1={cx - 15} y1={-15} x2={cx + 15} y2={15} />
          <line x1={cx - 15} y1={15} x2={cx + 15} y2={-15} />
        </g>
      );
    }
    const ry = Math.max(2, eyeRy * open);
    const half = mood === 'smug' ? 0.45 : 1;
    return (
      <g>
        <ellipse cx={cx} cy={0} rx={26} ry={ry} fill="#fff" stroke={C.ink} strokeWidth={6} />
        {open > 0.25 && (
          <g>
            <circle cx={cx + look.x * 9} cy={look.y * 10 + (mood === 'smug' ? 8 : 2)} r={12} fill={C.ink} />
            <circle cx={cx + look.x * 9 + 4} cy={look.y * 10 - 3 + (mood === 'smug' ? 8 : 2)} r={4} fill="#fff" />
          </g>
        )}
        {half < 1 && <path d={`M ${cx - 27} ${-ry} H ${cx + 27} V ${-ry * 0.1} H ${cx - 27} Z`} fill={C.iceShade} stroke={C.ink} strokeWidth={6} />}
      </g>
    );
  };
  const mouth = () => {
    switch (mood) {
      case 'surprised':
      case 'scared':
        return (
          <g>
            <ellipse cx={0} cy={62} rx={mood === 'scared' ? 26 : 18} ry={mood === 'scared' ? 24 : 20} fill="#5A1A1A" stroke={C.ink} strokeWidth={6} />
            <ellipse cx={0} cy={74} rx={12} ry={7} fill="#F28B9B" />
          </g>
        );
      case 'worried':
        return <path d="M -26 66 Q -13 54 0 64 Q 13 74 26 62" stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />;
      case 'smug':
        return <path d="M -24 58 Q 4 76 28 52" stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />;
      case 'squeeze':
      case 'dizzy':
        return <path d="M -24 70 Q 0 54 24 70" stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />;
      case 'neutral':
        return <path d="M -18 62 H 18" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />;
      default:
        return <path d="M -28 54 Q 0 82 28 54" stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />;
    }
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {brow(-1)}
      {brow(1)}
      {eye(-1)}
      {eye(1)}
      {mouth()}
    </g>
  );
};

// ---------------------------------------------------------------- the iceberg character
// Local coords: waterline at y = 0, centred on x = 0. Peak ~250 above, bulk ~760 below.
const BERG_TOP = 'M -205 0 L -170 -96 L -118 -128 L -78 -206 L -30 -258 L 18 -214 L 58 -238 L 112 -150 L 160 -118 L 205 0 Z';
const BERG_TOP_SHADE = 'M 18 -214 L 58 -238 L 112 -150 L 160 -118 L 205 0 L 70 0 L 96 -110 Z';
const BERG_BELOW =
  'M -205 0 L 205 0 L 300 70 L 352 210 L 338 380 L 290 540 L 196 672 L 46 748 L -116 730 L -246 628 L -330 470 L -360 290 L -320 120 Z';
const BERG_BELOW_SHADE = 'M 205 0 L 300 70 L 352 210 L 338 380 L 290 540 L 196 672 L 46 748 L 120 600 L 200 420 L 230 220 Z';

export type BergProps = {
  x: number;
  y: number; // waterline in screen coords
  s?: number;
  under?: number; // 0..1 how visible the underwater part is
  face?: {open?: number; look?: {x: number; y: number}; mood?: Mood};
  sweat?: number; // time-ish phase for sweat drops; undefined = none
  squash?: number; // vertical squash (1 = none)
  rot?: number;
  noFace?: boolean;
};
export const Berg: React.FC<BergProps> = ({x, y, s = 1, under = 0, face, sweat, squash = 1, rot = 0, noFace}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (2 - squash)} ${s * squash})`}>
    {under > 0.001 && (
      <g opacity={under}>
        <path d={BERG_BELOW} fill={C.iceUnder} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        <path d={BERG_BELOW_SHADE} fill={C.iceUnderShade} />
        <path d={BERG_BELOW} fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      </g>
    )}
    <path d={BERG_TOP} fill={C.ice} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d={BERG_TOP_SHADE} fill={C.iceShade} />
    <path d={BERG_TOP} fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {!noFace && <Face x={-8} y={-128} s={0.82} open={face?.open ?? 1} look={face?.look} mood={face?.mood ?? 'happy'} gap={42} />}
    {sweat !== undefined && <SweatDrops phase={sweat} />}
  </g>
);

// Sweat drops sliding down the peak, looping.
const SweatDrops: React.FC<{phase: number}> = ({phase}) => {
  const drops = [
    {x: -120, y0: -150, d: 0},
    {x: 128, y0: -140, d: 0.45},
    {x: -60, y0: -230, d: 0.8},
  ];
  return (
    <g>
      {drops.map((dr, i) => {
        const u = (((phase + dr.d) % 1.2) + 1.2) % 1.2;
        if (u > 1) return null;
        const yy = dr.y0 + u * 120;
        const sc = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
        return <Drop key={i} x={dr.x + (dr.x < 0 ? -u * 20 : u * 20)} y={yy} s={0.9 * sc} />;
      })}
    </g>
  );
};

export const Drop: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = C.sweat}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -26 C 10 -10 18 2 18 12 A 18 18 0 0 1 -18 12 C -18 2 -10 -10 0 -26 Z" fill={color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={-6} cy={8} rx={4} ry={6} fill="#fff" />
  </g>
);

// Flat-topped (tabular) iceberg drawn as a cross-section block, centred, waterline at y = 0.
export const TabBerg: React.FC<{x: number; y: number; w: number; h: number; above: number; face?: {open?: number; mood?: Mood; look?: {x: number; y: number}}}> = ({
  x,
  y,
  w,
  h,
  above,
  face,
}) => {
  const top = -above;
  const bot = h - above;
  const j = (i: number) => (i % 2 ? 10 : -8);
  const right = [0, 1, 2, 3, 4].map((i) => `L ${w / 2 + j(i)} ${top + ((bot - top) * (i + 1)) / 6}`).join(' ');
  const left = [4, 3, 2, 1, 0].map((i) => `L ${-w / 2 - j(i)} ${top + ((bot - top) * (i + 1)) / 6}`).join(' ');
  const d = `M ${-w / 2} ${top} L ${w / 2} ${top} ${right} L ${w / 2 - 20} ${bot} L ${-w / 2 + 20} ${bot} ${left} Z`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id="tabUnder">
        <rect x={-w} y={0} width={w * 2} height={h * 2} />
      </clipPath>
      <path d={d} fill={C.ice} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <path d={d} fill={C.iceUnder} clipPath="url(#tabUnder)" />
      <path d={d} fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      {face && <Face x={0} y={(bot + top) / 2 - 10} s={1} open={face.open} mood={face.mood} look={face.look} />}
    </g>
  );
};

// ---------------------------------------------------------------- sea, sky, sunburst
export const Sky: React.FC<{color?: string}> = ({color = C.sky}) => <rect x={-2000} y={-4000} width={6000} height={9000} fill={color} />;

export const Sunburst: React.FC<{t: number; cx?: number; cy?: number}> = ({t, cx = 540, cy = 1300}) => {
  const n = 18;
  const rot = t * 4;
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2320} fill={C.sky} />
      <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
        {Array.from({length: n}).map((_, i) => {
          const a0 = ((i * 2) / (n * 2)) * Math.PI * 2;
          const a1 = ((i * 2 + 1) / (n * 2)) * Math.PI * 2;
          const R = 3000;
          return <path key={i} d={`M 0 0 L ${R * Math.cos(a0)} ${R * Math.sin(a0)} L ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`} fill={C.skyL} />;
        })}
      </g>
    </g>
  );
};

export const Sea: React.FC<{y: number; t: number; color?: string; x0?: number; x1?: number; depth?: number; amp?: number}> = ({
  y,
  t,
  color = C.sea,
  x0 = -400,
  x1 = 1480,
  depth = 3000,
  amp = 9,
}) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 30) pts.push(`${x} ${y + amp * Math.sin(x * 0.018 + t * 2.4) + amp * 0.4 * Math.sin(x * 0.041 - t * 1.7)}`);
  const top = 'M ' + pts.join(' L ');
  return (
    <g>
      <path d={`${top} L ${x1} ${y + depth} L ${x0} ${y + depth} Z`} fill={color} />
      <path d={top} fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- tugboat (faces right)
export const Tug: React.FC<{x: number; y: number; s?: number; rock?: number; face?: {mood?: Mood; open?: number}; flex?: number}> = ({x, y, s = 1, rock = 0, face, flex = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rock}) scale(${s})`}>
    {/* funnel */}
    <path d="M 10 -230 L 70 -230 L 64 -150 L 16 -150 Z" fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={6} y={-246} width={68} height={22} rx={4} fill={C.ink} />
    {/* cabin */}
    <rect x={-70} y={-160} width={170} height={110} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-48} y={-138} width={46} height={40} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    <rect x={20} y={-138} width={46} height={40} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    {/* flexing arm on the cabin roof (gag) */}
    {flex > 0.01 && (
      <g transform={`translate(-30 -160) scale(${flex})`}>
        <path d="M 0 0 C -10 -40 -60 -50 -70 -90 C -74 -110 -40 -120 -30 -100 C -20 -80 10 -70 20 -40 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      </g>
    )}
    {/* hull */}
    <path d="M -230 -60 L 250 -60 Q 236 10 180 40 L -170 40 Q -220 10 -230 -60 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -224 -38 L 246 -38" stroke={C.paper} strokeWidth={10} />
    {/* tyre fenders */}
    <circle cx={-120} cy={-10} r={20} fill={C.ink} />
    <circle cx={30} cy={-10} r={20} fill={C.ink} />
    <circle cx={160} cy={-10} r={20} fill={C.ink} />
    {/* tow bitt at the stern */}
    <rect x={-222} y={-92} width={22} height={34} rx={4} fill={C.ink} />
    {face && <Face x={22} y={-104} s={0.55} gap={44} mood={face.mood ?? 'happy'} open={face.open ?? 1} />}
  </g>
);

// Smoke puffs: circles with one merged outline (ink circles first, then fills).
export const Puffs: React.FC<{x: number; y: number; t: number; color?: string; n?: number; rise?: number}> = ({x, y, t, color = '#E9EEF2', n = 5, rise = 260}) => {
  const items = Array.from({length: n}).map((_, i) => {
    const u = (t * 0.55 + i / n) % 1;
    const r = 14 + 34 * Math.sin(Math.PI * u) * (0.6 + 0.4 * u);
    return {cx: x + u * 80 + Math.sin(u * 6 + i) * 10, cy: y - u * rise, r};
  });
  return (
    <g>
      {items.map((p, i) => (
        <circle key={'o' + i} cx={p.cx} cy={p.cy} r={p.r + 6} fill={C.ink} />
      ))}
      {items.map((p, i) => (
        <circle key={'f' + i} cx={p.cx} cy={p.cy} r={p.r} fill={color} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- tap (spout points down, mounted on a wall at the left)
export const Tap: React.FC<{x: number; y: number; s?: number; pipe?: number; face?: {mood?: Mood; open?: number}}> = ({x, y, s = 1, pipe = 0, face}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {pipe > 0 && <rect x={-250} y={0} width={50} height={pipe} fill={C.chromeShade} stroke={C.ink} strokeWidth={INK_W} />}
    <rect x={-260} y={-60} width={70} height={120} rx={12} fill={C.chromeShade} stroke={C.ink} strokeWidth={INK_W} />
    <path d="M -195 -40 H 60 Q 130 -40 130 30 V 120 H 70 V 40 Q 70 25 55 25 H -195 Z" fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -180 -24 H 40" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
    <rect x={58} y={112} width={84} height={30} rx={8} fill={C.chromeShade} stroke={C.ink} strokeWidth={INK_W} />
    {/* handle */}
    <rect x={-40} y={-100} width={26} height={62} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
    <rect x={-100} y={-128} width={146} height={34} rx={17} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
    {face && <Face x={-60} y={-2} s={0.5} gap={44} mood={face.mood ?? 'neutral'} open={face.open ?? 1} />}
  </g>
);

// ---------------------------------------------------------------- Cape Town: flat-topped mountain + small city
export const CapeTown: React.FC<{x: number; y: number; s?: number; dry?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* Table Mountain */}
    <path d="M -560 0 L -420 -150 L -330 -205 L -250 -330 L 230 -336 L 300 -230 L 380 -200 L 470 -120 L 600 0 Z" fill={C.mountain} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M 230 -336 L 300 -230 L 380 -200 L 470 -120 L 600 0 L 330 0 L 240 -210 Z" fill={C.mountainShade} />
    <path d="M -560 0 L -420 -150 L -330 -205 L -250 -330 L 230 -336 L 300 -230 L 380 -200 L 470 -120 L 600 0" fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {/* buildings */}
    {[
      [-470, 90, 120, C.paper],
      [-370, 70, 180, C.yellow],
      [-290, 90, 130, C.paper],
      [-190, 60, 230, C.teal],
      [-120, 100, 150, C.paper],
      [-10, 70, 200, C.yellow],
      [70, 90, 120, C.paper],
      [170, 60, 170, C.teal],
      [240, 100, 110, C.paper],
      [350, 80, 150, C.yellow],
      [440, 90, 100, C.paper],
    ].map(([bx, w, h, col], i) => (
      <g key={i}>
        <rect x={bx as number} y={-(h as number)} width={w as number} height={(h as number) + 40} fill={col as string} stroke={C.ink} strokeWidth={6} />
        {Array.from({length: Math.floor((h as number) / 46)}).map((_, k) => (
          <rect key={k} x={(bx as number) + 16} y={-(h as number) + 18 + k * 46} width={(w as number) - 32} height={18} fill={C.ink} opacity={0.75} />
        ))}
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- desert with dunes and a palm
export const Desert: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -700 0 Q -450 -170 -200 -40 Q 0 -200 260 -60 Q 450 -160 700 -30 L 700 1500 L -700 1500 Z" fill={C.sandShade} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -700 80 Q -380 -60 -40 60 Q 300 -50 700 80 L 700 1500 L -700 1500 Z" fill={C.sand} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {/* palm */}
    <g transform="translate(330 30)">
      <path d="M -12 0 Q -30 -120 10 -250 L 30 -246 Q -6 -120 14 0 Z" fill="#9C6B3F" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {[-150, -100, -40, 20, 80].map((a, i) => (
        <path key={i} transform={`translate(20 -250) rotate(${a})`} d="M 0 0 Q 70 -40 140 10 Q 70 -10 0 0 Z" fill="#4FA45B" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      ))}
    </g>
  </g>
);

export const Sun: React.FC<{x: number; y: number; r?: number; t: number; hot?: number}> = ({x, y, r = 90, t, hot = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2 + t * 0.4;
      const r0 = r + 18;
      const r1 = r + 50 + 10 * Math.sin(t * 6 + i);
      return <line key={i} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={r1 * Math.cos(a)} y2={r1 * Math.sin(a)} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />;
    })}
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2 + t * 0.4;
      const r0 = r + 18;
      const r1 = r + 50 + 10 * Math.sin(t * 6 + i);
      return <line key={'f' + i} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={r1 * Math.cos(a)} y2={r1 * Math.sin(a)} stroke={hot > 0.5 ? C.gold : C.yellow} strokeWidth={6} strokeLinecap="round" />;
    })}
    <circle r={r} fill={hot > 0.5 ? C.gold : C.yellow} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// ---------------------------------------------------------------- Antarctic ice shelf (cliff edge on the right)
export const IceShelf: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -900 -230 L 40 -230 L 60 -170 L 30 -110 L 66 -50 L 40 0 L -900 0 Z" fill={C.ice} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M 40 -230 L 60 -170 L 30 -110 L 66 -50 L 40 0 L -40 0 L -20 -120 Z" fill={C.iceShade} />
    <path d="M -900 -230 L 40 -230 L 60 -170 L 30 -110 L 66 -50 L 40 0" fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -300 -230 L -280 -170 M -560 -230 L -548 -190" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
  </g>
);

// ---------------------------------------------------------------- labels
export const Pill: React.FC<{x: number; y: number; text: string; s?: number; bg?: string; fg?: string; size?: number}> = ({x, y, text, s = 1, bg = C.yellow, fg = C.ink, size = 54}) => {
  const w = textWidth(text, size, 800, size * 0.04) + size * 1.4;
  const h = size * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} data-label={text}>
      <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w} height={h} rx={h / 2} fill={C.ink} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={size} fill={fg} letterSpacing={size * 0.04}>
        {text}
      </text>
    </g>
  );
};

// Big outlined title text like the covers (Paper or Lab Yellow fill, thick ink outline + hard shadow).
export const BigText: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; s?: number; anchor?: 'middle' | 'start' | 'end'}> = ({
  x,
  y,
  text,
  size = 110,
  fill = C.paper,
  s = 1,
  anchor = 'middle',
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} data-label={text}>
    <text x={7} y={9} textAnchor={anchor} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={C.ink} stroke={C.ink} strokeWidth={size * 0.2} strokeLinejoin="round">
      {text}
    </text>
    <text x={0} y={0} textAnchor={anchor} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={fill} stroke={C.ink} strokeWidth={size * 0.2} strokeLinejoin="round" paintOrder="stroke fill">
      {text}
    </text>
  </g>
);

// Dimension arrow between two points with a label pill in the middle.
export const DimArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; label: string; grow: number; labelS: number; vertical?: boolean}> = ({
  x1,
  y1,
  x2,
  y2,
  label,
  grow,
  labelS,
}) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const ax = mx + ((x1 - mx) * grow);
  const ay = my + ((y1 - my) * grow);
  const bx = mx + ((x2 - mx) * grow);
  const by = my + ((y2 - my) * grow);
  const ang = Math.atan2(by - ay, bx - ax);
  const head = (px: number, py: number, dir: number) => {
    const a = ang + dir;
    const L = 34;
    return `M ${px} ${py} L ${px - L * Math.cos(a - 0.5)} ${py - L * Math.sin(a - 0.5)} M ${px} ${py} L ${px - L * Math.cos(a + 0.5)} ${py - L * Math.sin(a + 0.5)}`;
  };
  if (grow <= 0.01) return null;
  const d = `M ${ax} ${ay} L ${bx} ${by} ${head(bx, by, 0)} ${head(ax, ay, Math.PI)}`;
  return (
    <g>
      <path d={d} stroke={C.ink} strokeWidth={18} strokeLinecap="round" fill="none" />
      <path d={d} stroke={C.paper} strokeWidth={7} strokeLinecap="round" fill="none" />
      {labelS > 0.01 && <Pill x={mx} y={my} text={label} s={labelS} />}
    </g>
  );
};

// ---------------------------------------------------------------- thermometer
export const Thermo: React.FC<{x: number; y: number; level: number; s?: number}> = ({x, y, level, s = 1}) => {
  const tubeH = 420;
  const fillH = 40 + (tubeH - 60) * level;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-34} y={-tubeH} width={68} height={tubeH + 20} rx={34} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-16} y={-fillH} width={32} height={fillH + 20} rx={16} fill={C.red} />
      <circle cx={0} cy={50} r={62} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-34} y={-tubeH} width={68} height={tubeH + 20} rx={34} fill="none" stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-22} y={-14} width={44} height={40} fill={C.red} />
      {[0.2, 0.4, 0.6, 0.8].map((k) => (
        <line key={k} x1={34} x2={60} y1={-tubeH * k - 10} y2={-tubeH * k - 10} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      ))}
      <circle cx={-18} cy={34} r={12} fill="#fff" opacity={0.7} />
    </g>
  );
};

// ---------------------------------------------------------------- calendar with flipping pages
export const Calendar: React.FC<{x: number; y: number; s?: number; label: string; prev?: string; flip: number}> = ({x, y, s = 1, label, prev = '', flip}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150 + 8} y={-170 + 8} width={300} height={330} rx={22} fill={C.ink} />
    <rect x={-150} y={-170} width={300} height={330} rx={22} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    <text x={0} y={60} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={label.length > 3 ? 92 : 150} fill={C.ink}>
      {label}
    </text>
    {/* the page being torn off: squashes upwards (no cross-fade) */}
    {flip > 0 && flip < 1 && (
      <g transform={`translate(0 -100) scale(1 ${1 - flip}) translate(0 100)`}>
        <rect x={-150} y={-100} width={300} height={260} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
        <text x={0} y={60} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={prev.length > 3 ? 92 : 150} fill={C.ink}>
          {prev}
        </text>
      </g>
    )}
    <rect x={-150} y={-170} width={300} height={78} rx={22} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-150} y={-120} width={300} height={28} fill={C.red} />
    <line x1={-150} x2={150} y1={-92} y2={-92} stroke={C.ink} strokeWidth={INK_W} />
    {[-80, 80].map((rx) => (
      <rect key={rx} x={rx - 10} y={-196} width={20} height={56} rx={10} fill={C.chromeShade} stroke={C.ink} strokeWidth={5} />
    ))}
  </g>
);

// ---------------------------------------------------------------- computer monitor (simulation)
export const Monitor: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode}> = ({x, y, s = 1, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={300} width={120} height={70} fill={C.chromeShade} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-170} y={360} width={340} height={36} rx={14} fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-400 + 10} y={-300 + 10} width={800} height={610} rx={34} fill={C.ink} />
    <rect x={-400} y={-300} width={800} height={610} rx={34} fill="#3A4652" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-360} y={-262} width={720} height={530} rx={14} fill="#123A5E" stroke={C.ink} strokeWidth={5} />
    {children}
  </g>
);

// ---------------------------------------------------------------- price tag
export const PriceTag: React.FC<{x: number; y: number; s?: number; rot?: number; text: string}> = ({x, y, s = 1, rot = 0, text}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 0 C -30 -60 -10 -110 30 -140" stroke={C.ink} strokeWidth={6} fill="none" />
    <g transform="translate(0 0)">
      <path d="M -40 10 L 40 10 L 150 60 L 150 190 L -150 190 L -150 60 Z" transform="translate(0 -10) scale(0.9)" fill={C.ink} />
      <path d="M -50 0 L 50 0 L 160 50 L 160 180 L -160 180 L -160 50 Z" fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <circle cx={0} cy={36} r={14} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={0} y={140} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={78} fill={C.ink}>
        {text}
      </text>
    </g>
  </g>
);

// ---------------------------------------------------------------- rope (sagging line between two points)
export const Rope: React.FC<{x1: number; y1: number; x2: number; y2: number; sag?: number}> = ({x1, y1, x2, y2, sag = 40}) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  return (
    <g>
      <path d={d} stroke={C.ink} strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#C99A5B" strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="14 10" />
    </g>
  );
};
