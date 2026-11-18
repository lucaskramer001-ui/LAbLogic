import React from 'react';
import {staticFile} from 'remotion';

// Rigged bacterium: illustrated body (Higgsfield, public/bug/body.png, face- and tail-free) + code-drawn face and tail.
// Drop-in for the old code Bug: same x/y/s/rot/sx/sy/open/mouth props, s=1 is about the old size (160 px long).
// Coordinates below are in body.png pixels (1400 x 721); capsule spans x 78-1329, y 89-652, centre (703, 370).

export type BugMood = 'happy' | 'chomp' | 'scared' | 'yuck' | 'smug' | 'determined';

const INK = '#141414';
const GREEN = '#7CC46A';
const MOUTH = '#B83A3A';
const TONGUE = '#F08A8A';
const BASE = 0.135; // body.png px -> stage px at s=1
const CX = 703;
const CY = 370;
const EYES = [
  {x: 215, y: 312, rx: 96, ry: 104},
  {x: 432, y: 308, rx: 110, ry: 118},
];
const MOUTH_C = {x: 360, y: 520};

export type BugRigProps = {
  x: number;
  y: number;
  t: number;
  s?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  open?: number; // eyelids 0 closed .. 1 open
  mouth?: number; // 0 closed .. 1 wide open
  mood?: BugMood;
  look?: {x: number; y: number}; // pupils, -1..1
  tailAmp?: number;
};

const Brow: React.FC<{x: number; y: number; w: number; tilt: number; lift: number}> = ({x, y, w, tilt, lift}) => (
  <path
    d={`M ${x - w / 2} ${y - lift + tilt} Q ${x} ${y - lift - 26} ${x + w / 2} ${y - lift - tilt}`}
    stroke={INK}
    strokeWidth={16}
    fill="none"
    strokeLinecap="round"
  />
);

const Eye: React.FC<{e: (typeof EYES)[number]; open: number; look: {x: number; y: number}; id: string; small?: boolean}> = ({e, open, look, id, small}) => {
  const pr = small ? 26 : 40;
  const px = e.x + look.x * (e.rx - pr - 10);
  const py = e.y + look.y * (e.ry - pr - 10);
  const lid = (1 - open) * e.ry * 2;
  return (
    <g>
      <clipPath id={id}>
        <ellipse cx={e.x} cy={e.y} rx={e.rx} ry={e.ry} />
      </clipPath>
      <ellipse cx={e.x} cy={e.y} rx={e.rx} ry={e.ry} fill="#fff" />
      <g clipPath={`url(#${id})`}>
        <circle cx={px} cy={py} r={pr} fill={INK} />
        <circle cx={px + pr * 0.35} cy={py - pr * 0.35} r={pr * 0.32} fill="#fff" />
        {lid > 0.5 && <rect x={e.x - e.rx - 4} y={e.y - e.ry - 4} width={e.rx * 2 + 8} height={lid + 4} fill={GREEN} />}
        {lid > 0.5 && <line x1={e.x - e.rx} x2={e.x + e.rx} y1={e.y - e.ry + lid} y2={e.y - e.ry + lid} stroke={INK} strokeWidth={12} />}
      </g>
      <ellipse cx={e.x} cy={e.y} rx={e.rx} ry={e.ry} fill="none" stroke={INK} strokeWidth={14} />
    </g>
  );
};

const Mouth: React.FC<{mood: BugMood; open: number; id: string}> = ({mood, open, id}) => {
  const {x, y} = MOUTH_C;
  if (mood === 'scared') {
    const h = 30 + 50 * open;
    return (
      <g>
        <ellipse cx={x} cy={y + 10} rx={42} ry={h} fill={MOUTH} stroke={INK} strokeWidth={14} />
        <path d={`M ${x - 30} ${y + 10 + h * 0.5} Q ${x} ${y - 4 + h * 0.5} ${x + 30} ${y + 10 + h * 0.5}`} fill={TONGUE} />
      </g>
    );
  }
  if (mood === 'yuck') {
    return (
      <g>
        <path d={`M ${x - 90} ${y} Q ${x - 45} ${y - 30} ${x} ${y} Q ${x + 45} ${y + 30} ${x + 90} ${y}`} stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={`M ${x - 30} ${y + 2} Q ${x - 30} ${y + 90} ${x + 5} ${y + 90} Q ${x + 40} ${y + 90} ${x + 30} ${y + 10}`} fill={TONGUE} stroke={INK} strokeWidth={12} />
      </g>
    );
  }
  if (mood === 'smug' && open < 0.15) {
    return <path d={`M ${x - 95} ${y - 10} Q ${x} ${y + 40} ${x + 95} ${y - 30}`} stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" />;
  }
  // happy / chomp / determined: D-shaped mouth whose jaw drops with `open`
  const w = mood === 'chomp' ? 125 : 110;
  const drop = 40 + 130 * open;
  const top = y - 30 - 25 * open;
  const d = `M ${x - w} ${top} Q ${x} ${top + 18} ${x + w} ${top - 8} Q ${x + w * 0.8} ${top + drop} ${x} ${top + drop + 6} Q ${x - w * 0.85} ${top + drop} ${x - w} ${top} Z`;
  return (
    <g>
      <clipPath id={`${id}-m`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={MOUTH} />
      <g clipPath={`url(#${id}-m)`}>
        <ellipse cx={x + 10} cy={top + drop + 10} rx={w * 0.6} ry={22 + 30 * open} fill={TONGUE} />
        {/* top teeth: fang, plus a full row when chomping */}
        <path d={`M ${x + w * 0.35} ${top - 4} L ${x + w * 0.5} ${top + 40} L ${x + w * 0.65} ${top - 6} Z`} fill="#fff" stroke={INK} strokeWidth={6} />
        {mood === 'chomp' &&
          [-0.7, -0.35, 0, 0.35].map((k) => <path key={k} d={`M ${x + k * w - 18} ${top + 2} L ${x + k * w} ${top + 36} L ${x + k * w + 18} ${top + 2} Z`} fill="#fff" stroke={INK} strokeWidth={6} />)}
        {mood === 'chomp' &&
          open > 0.3 &&
          [-0.5, -0.15, 0.2, 0.55].map((k) => <path key={k} d={`M ${x + k * w - 16} ${top + drop + 4} L ${x + k * w} ${top + drop - 28} L ${x + k * w + 16} ${top + drop + 4} Z`} fill="#fff" stroke={INK} strokeWidth={6} />)}
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={14} strokeLinejoin="round" />
    </g>
  );
};

// Flagellum: travelling wave, drawn behind the body from the right end.
const Tail: React.FC<{t: number; amp: number}> = ({t, amp}) => {
  const pts = Array.from({length: 22}).map((_, i) => {
    const u = i / 21;
    const x = 1270 + u * 760;
    const y = CY + Math.sin(u * 9 - t * 12) * 60 * amp * Math.min(1, u * 3);
    return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const d = pts.join(' ');
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth={74} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={GREEN} strokeWidth={44} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

let uid = 0;
export const BugRig: React.FC<BugRigProps> = ({x, y, t, s = 1, rot = 0, sx = 1, sy = 1, open = 1, mouth = 0.3, mood = 'happy', look = {x: -0.2, y: 0}, tailAmp = 1}) => {
  const id = React.useMemo(() => `bugeye${uid++}`, []);
  const brow =
    mood === 'scared'
      ? {tilt: -22, lift: 120}
      : mood === 'determined' || mood === 'chomp'
        ? {tilt: 26, lift: 98}
        : mood === 'smug'
          ? {tilt: 12, lift: 100}
          : {tilt: -6, lift: 112};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * BASE * sx} ${s * BASE * sy}) translate(${-CX} ${-CY})`}>
      <Tail t={t} amp={tailAmp} />
      <image href={staticFile('bug/body.png')} x={0} y={0} width={1400} height={721} />
      {EYES.map((e, i) => (
        <Brow key={i} x={e.x + (i ? 6 : -4)} y={e.y} w={e.rx * 1.4} tilt={i ? brow.tilt : -brow.tilt} lift={brow.lift} />
      ))}
      {EYES.map((e, i) => (
        <Eye key={i} e={e} open={open} look={look} id={`${id}-${i}`} small={mood === 'scared'} />
      ))}
      <Mouth mood={mood} open={mouth} id={id} />
    </g>
  );
};

// Expression sheet for QA (Still "BugRigSheet").
export const BugRigSheet: React.FC = () => {
  const rows: Array<[BugMood, number, number, {x: number; y: number}]> = [
    ['happy', 0.3, 1, {x: -0.2, y: 0}],
    ['chomp', 1, 1, {x: -0.6, y: 0.2}],
    ['chomp', 0.05, 1, {x: -0.6, y: 0.2}],
    ['scared', 0.6, 1, {x: 0.5, y: -0.3}],
    ['yuck', 0, 0.35, {x: 0, y: 0}],
    ['smug', 0, 0.55, {x: -0.4, y: 0}],
  ];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{background: '#163A3F'}}>
      {rows.map(([m, mo, op, lk], i) => (
        <BugRig key={i} x={i % 2 ? 760 : 300} y={260 + Math.floor(i / 2) * 520} s={2.6} t={i * 0.3} mood={m} mouth={mo} open={op} look={lk} />
      ))}
    </svg>
  );
};
