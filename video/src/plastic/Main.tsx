import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Sky, Sunburst, Thermo} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Bin, Stamp, TrashBag, TrashHeap} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just let bacteria eat all our plastic?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Hook in the first 2 s: "91%" slams onto a mountain of trash, then a bacterium pops in and bites a bottle.

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const BG = '#163A3F';
const RAY = '#1E4A50';
const BUG = '#7CC46A';
const BUG_D = '#4E9A3F';
const PETC = '#BFE6F5';
const DIRT = '#8A6A4A';
const CO2C = '#C9D3DB';
const ORANGE = '#FF9F1C';
const BLUE = '#3E7CC9';

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-900-normal.woff2')})`, {weight: '900'}),
      new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-800-normal.woff2')})`, {weight: '800'}),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
};

const Stage: React.FC<{cam?: {x?: number; y?: number; s?: number}; children: React.ReactNode}> = ({cam = {}, children}) => {
  const {x = 540, y = 960, s = 1} = cam;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(540px, 960px) scale(${s}) translate(${-x}px, ${-y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
const Layer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);
const punch = (t: number, t0: number) => 1 + 0.05 * (1 - easeOutCubic(clamp((t - t0) / 0.35)));
const until = (t: number, t1: number) => 1 - prog(t, t1 - 0.25, t1, (u) => u);
const span = (t: number, t0: number, t1 = 1e9) => pop(t, t0) * until(t, t1);
const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.3, 1, st) : 1;
};


// ------------------------------------------------------------------ props

type Mood = React.ComponentProps<typeof Face>['mood'];

// Teal background with slow rays.
const Rays: React.FC<{t: number; cx?: number; cy?: number}> = ({t, cx = 540, cy = 900}) => (
  <g>
    <rect x={-400} y={-400} width={1880} height={2800} fill={BG} />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2 + t * 0.05;
      const a1 = a0 + Math.PI / 16;
      const R = 3000;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY} />;
    })}
  </g>
);

// Ideonella sakaiensis: a rod-shaped bacterium with a whip tail and a munching mouth (centre x, y).
const Bug: React.FC<{x: number; y: number; s?: number; t: number; chomp?: boolean; mood?: 'happy' | 'yuck'; rot?: number}> = ({x, y, s = 1, t, chomp = true, mood = 'happy', rot = 0}) => {
  const m = chomp ? Math.abs(Math.sin(t * 11 + x * 0.01)) : 0.3;
  const tail = Array.from({length: 7}).map((_, i) => `${i ? 'L' : 'M'} ${70 + i * 16} ${Math.sin(t * 9 + i * 1.1) * 10}`).join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={tail} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={-80} y={-40} width={160} height={80} rx={40} fill={BUG} stroke={C.ink} strokeWidth={6} />
      <ellipse cx={20} cy={-22} rx={40} ry={8} fill="#A9DE98" />
      <circle cx={-34} cy={-8} r={9} fill={C.ink} />
      <circle cx={-6} cy={-8} r={9} fill={C.ink} />
      <circle cx={-31} cy={-11} r={3} fill="#fff" />
      <circle cx={-3} cy={-11} r={3} fill="#fff" />
      {mood === 'yuck' ? (
        <g>
          <path d="M -36 18 Q -22 8 -6 18" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
          <ellipse cx={-20} cy={26} rx={8} ry={10} fill={C.red} stroke={C.ink} strokeWidth={4} />
        </g>
      ) : (
        <ellipse cx={-20} cy={16} rx={14} ry={3 + 10 * m} fill={C.ink} />
      )}
    </g>
  );
};

// PET drink bottle, bottom centre (x, y), ~280 px tall at s=1. eaten 0..1 bites it away from the top.
const Bottle: React.FC<{x: number; y: number; s?: number; mood?: Mood; eaten?: number; rot?: number; label?: string; id?: string}> = ({x, y, s = 1, mood, eaten = 0, rot = 0, label, id = 'b'}) => {
  const top = -280 + 280 * eaten;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <clipPath id={`clip-${id}`}>
        <path d={`M -80 ${top} ${Array.from({length: 6}).map((_, i) => `Q ${-80 + i * 32 + 16} ${top + (eaten > 0 ? 26 : 0)} ${-80 + (i + 1) * 32} ${top}`).join(' ')} L 80 20 L -80 20 Z`} />
      </clipPath>
      <g clipPath={`url(#clip-${id})`}>
        <rect x={-22} y={-280} width={44} height={30} rx={6} fill={BLUE} stroke={C.ink} strokeWidth={6} />
        <path d="M -24 -250 L 24 -250 Q 24 -215 58 -185 L 58 -12 Q 58 0 46 0 L -46 0 Q -58 0 -58 -12 L -58 -185 Q -24 -215 -24 -250 Z" fill={PETC} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-58} y={-150} width={116} height={64} fill={C.teal} stroke={C.ink} strokeWidth={5} />
        {label && (
          <text x={0} y={-104} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill="#fff">
            {label}
          </text>
        )}
        <path d="M -38 -175 L -38 -20" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        {mood && <Face x={0} y={-50} s={0.36} mood={mood} gap={36} />}
      </g>
    </g>
  );
};

// Plastic shopping bag (bottom centre x, y).
const Bag: React.FC<{x: number; y: number; s?: number; rot?: number; mood?: Mood}> = ({x, y, s = 1, rot = 0, mood = 'smug'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -50 -230 Q -50 -290 -10 -290 L -10 -270 Q -30 -270 -30 -230 M 50 -230 Q 50 -290 10 -290 L 10 -270 Q 30 -270 30 -230" fill="none" stroke={C.ink} strokeWidth={8} />
    <path d="M -90 -230 L 90 -230 L 110 0 L -110 0 Z" fill="#F4F4F4" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -60 -200 L -70 -40 M 40 -190 L 50 -60" stroke="#D5D5D5" strokeWidth={8} strokeLinecap="round" />
    <Face x={0} y={-110} s={0.4} mood={mood} gap={40} />
  </g>
);

// Crinkly snack wrapper (centre x, y).
const Wrapper: React.FC<{x: number; y: number; s?: number; rot?: number; mood?: Mood}> = ({x, y, s = 1, rot = 0, mood = 'smug'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -130 -50 L -100 -40 L -100 40 L -130 50 L -120 0 Z M 130 -50 L 100 -40 L 100 40 L 130 50 L 120 0 Z" fill={C.red} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-100} y={-55} width={200} height={110} rx={20} fill={C.red} stroke={C.ink} strokeWidth={6} />
    <path d="M -60 -30 L -40 30 M 50 -35 L 70 25" stroke="#FF8A80" strokeWidth={8} strokeLinecap="round" />
    <Face x={0} y={2} s={0.38} mood={mood} gap={36} />
  </g>
);

// Thin square of plastic film (centre x, y); left = 0..1 of it remaining.
const Film: React.FC<{x: number; y: number; s?: number; left?: number}> = ({x, y, s = 1, left = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <clipPath id="film-clip">
      <rect x={-200} y={-100} width={400 * left} height={200} />
    </clipPath>
    <g clipPath="url(#film-clip)">
      <path d={`M -150 -40 L 150 -60 L 170 40 L -130 60 Z`} fill="#2B1F1A" opacity={0.25} transform="translate(10 14)" />
      <path d={`M -150 -40 L 150 -60 L 170 40 L -130 60 Z`} fill={PETC} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -100 -20 L 100 -34" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
    </g>
  </g>
);

// Enzyme as a tiny pac-man "scissor" with its name tag.
const Enzyme: React.FC<{x: number; y: number; s?: number; t: number; color?: string; name?: string; flip?: boolean}> = ({x, y, s = 1, t, color = ORANGE, name, flip}) => {
  const m = 0.15 + 0.3 * Math.abs(Math.sin(t * 12 + x));
  const a = m * Math.PI;
  const r = 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d={`M 0 0 L ${r * Math.cos(a)} ${-r * Math.sin(a)} A ${r} ${r} 0 1 0 ${r * Math.cos(a)} ${r * Math.sin(a)} Z`} fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={-6} cy={-30} r={7} fill={C.ink} />
      {name && (
        <g transform={`scale(${flip ? -1 : 1} 1)`}>
          <text x={0} y={100} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill="#fff" stroke={C.ink} strokeWidth={8} paintOrder="stroke fill">
            {name}
          </text>
        </g>
      )}
    </g>
  );
};

// Cartoon clock (centre x, y); spin = hand angle in turns.
const Clock: React.FC<{x: number; y: number; s?: number; spin: number}> = ({x, y, s = 1, spin}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={110} fill={C.ink} transform="translate(8 10)" />
    <circle r={110} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * 82} y1={Math.sin(a) * 82} x2={Math.cos(a) * 96} y2={Math.sin(a) * 96} stroke={C.ink} strokeWidth={6} />;
    })}
    <line x1={0} y1={0} x2={Math.sin(spin * Math.PI * 2) * 70} y2={-Math.cos(spin * Math.PI * 2) * 70} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(spin * Math.PI * 2 / 12) * 46} y2={-Math.cos(spin * Math.PI * 2 / 12) * 46} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
    <circle r={10} fill={C.ink} />
  </g>
);

// Landfill hill with bottles poking out; gone 0..1 makes the bottles vanish.
const Landfill: React.FC<{y: number; t: number; gone?: number}> = ({y, t, gone = 0}) => (
  <g>
    <path d={`M -400 ${y + 200} Q 120 ${y - 220} 540 ${y - 230} Q 960 ${y - 220} 1480 ${y + 200} L 1480 2400 L -400 2400 Z`} fill={DIRT} stroke={C.ink} strokeWidth={INK_W} />
    {Array.from({length: 9}).map((_, i) => {
      const bx = 140 + i * 100;
      const by = y - 150 + Math.abs(i - 4) * 28;
      const sc = 0.5 * (1 - clamp(gone * 1.4 - rnd(i) * 0.4));
      return sc > 0.01 ? <Bottle key={i} id={`lf${i}`} x={bx} y={by + 40} s={sc} rot={(rnd(i + 3) - 0.5) * 60} mood={i === 4 ? 'worried' : undefined} /> : null;
    })}
    {Array.from({length: 5}).map((_, i) => (gone < 0.5 ? <TrashBag key={i} x={200 + i * 170} y={y - 40 + (i % 2) * 40 + Math.sin(t + i) * 2} s={0.7 * (1 - clamp(gone * 2))} rot={(rnd(i + 9) - 0.5) * 30} /> : null))}
  </g>
);

// CO2 bubble.
const Co2: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={52} fill={CO2C} stroke={C.ink} strokeWidth={6} />
    <text x={0} y={14} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={38} fill={C.ink}>
      CO2
    </text>
  </g>
);

// Factory with a big round reactor tank (bottom centre x, y).
const Factory: React.FC<{x: number; y: number; s?: number; t: number; on?: number}> = ({x, y, s = 1, t, on = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-360} y={-560} width={60} height={240} fill="#9AA5AD" stroke={C.ink} strokeWidth={6} />
    {on > 0 && [0, 1, 2].map((i) => {
      const u = ((t * 0.6 + i / 3) % 1);
      return <circle key={i} cx={-330 + u * 40} cy={-580 - u * 200} r={30 + u * 30} fill="#E9EEF2" stroke={C.ink} strokeWidth={4} opacity={(1 - u) * on} />;
    })}
    <path d="M -420 0 L -420 -330 L -300 -400 L -300 -330 L -180 -400 L -180 -330 L -60 -400 L -60 0 Z" fill={BLUE} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {[-380, -290, -200, -110].map((wx) => <rect key={wx} x={wx} y={-260} width={50} height={50} rx={6} fill={C.yellow} stroke={C.ink} strokeWidth={5} />)}
    <rect x={-330} y={-130} width={110} height={130} fill={C.ink} />
    <rect x={20} y={-470} width={300} height={470} rx={70} fill="#DDE4E8" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={60} y={-300} width={220} height={130} rx={20} fill={BUG} stroke={C.ink} strokeWidth={5} opacity={0.9} />
    {on > 0 && Array.from({length: 6}).map((_, i) => <circle key={i} cx={90 + rnd(i) * 160} cy={-190 - ((t * 80 + i * 30) % 100)} r={8} fill="#fff" opacity={0.8} />)}
    <rect x={-60} y={-90} width={80} height={30} fill="#9AA5AD" stroke={C.ink} strokeWidth={5} />
    <Face x={170} y={-380} s={0.5} mood="happy" />
  </g>
);

const Flag: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={0} width={12} height={240} fill={C.ink} />
    <rect x={6} y={0} width={60} height={110} fill="#2B4FA0" stroke={C.ink} strokeWidth={5} />
    <rect x={66} y={0} width={60} height={110} fill="#fff" stroke={C.ink} strokeWidth={5} />
    <rect x={126} y={0} width={60} height={110} fill="#D63B3B" stroke={C.ink} strokeWidth={5} />
  </g>
);

// Pie showing a share (0..1) in a colour, rest paper.
const Pie: React.FC<{x: number; y: number; r: number; share: number; color: string}> = ({x, y, r, share, color}) => {
  const a = share * Math.PI * 2 - Math.PI / 2;
  const large = share > 0.5 ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={C.ink} transform="translate(8 10)" />
      <circle r={r} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
      {share > 0.001 && <path d={`M 0 0 L 0 ${-r} A ${r} ${r} 0 ${large} 1 ${r * Math.cos(a)} ${r * Math.sin(a)} Z`} fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />}
    </g>
  );
};

const Crumbs: React.FC<{x: number; y: number; t: number; n?: number; color?: string}> = ({x, y, t, n = 8, color = PETC}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const u = (t * 1.4 + rnd(i)) % 1;
      const dx = (rnd(i + 4) - 0.5) * 260 * u;
      const dy = -80 * Math.sin(u * Math.PI) + 120 * u * u;
      return <rect key={i} x={x + dx} y={y + dy} width={18} height={12} rx={3} fill={color} stroke={C.ink} strokeWidth={3} opacity={1 - u} transform={`rotate(${u * 300 * (rnd(i + 8) - 0.5)} ${x + dx} ${y + dy})`} />;
    })}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: 0.3,
  disc: ph('in twenty sixteen') - 0.05,
  fix: ph('so spread') - 0.05,
  speed: ph('the first problem') - 0.05,
  kind: ph('the second problem') - 0.05,
  pile: ph('and the pile') - 0.05,
  co2: ph('bacteria also') - 0.05,
  fac: ph('so scientists took') - 0.05,
  final: ph("we don't need bugs") - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover: "THIS BUG EATS / PLASTIC!" Also the Still "PlasticCover".
export const PlasticCover: React.FC<{t?: number}> = ({t = 0.4}) => (
  <AbsoluteFill style={{backgroundColor: BG}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Rays t={0} cx={700} cy={1250} />
      <TrashHeap x={600} y={1800} s={1.45} />
      <Bottle id="cv" x={790} y={1640} s={2.6} mood="scared" eaten={0.3} rot={8} />
      <Crumbs x={760} y={1060} t={0.35} n={12} />
      <Bug x={560} y={1120} s={3} t={t} rot={-12} />
      <RedCircle x={700} y={1080} r={250} />
    </svg>
    <BigSci pose="shocked" x={160} y={1380} headR={115} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={510} text="THIS BUG EATS" size={104} />
        <BigText x={540} y={730} text="PLASTIC!" size={180} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <PlasticCover t={t} />;

// HOOK: you will never see 91% of your plastic recycled. But one bacterium can eat it. So why don't we let it eat all of it?
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const pctT = ph('ninetyone percent');
  const recT = ph('recycled');
  const bugT = ph('one bacterium');
  const eatT = ph('can eat it');
  const allT = ph('eat all of it');
  const bite = prog(t, eatT, allT, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0) * lerp(1.12, 1, prog(t, t0, t0 + 1.2, easeOutCubic)), y: 1000}}>
      <Layer>
        <Rays t={t} cx={540} cy={1100} />
        <TrashHeap x={540} y={1360} s={1.6} t={t} />
        <Bottle id="h1" x={300} y={1180} s={0.9} rot={-14} mood={t > bugT ? 'scared' : 'worried'} />
        <Bottle id="h2" x={760} y={1270} s={1.6} rot={10} mood={t > bugT ? 'scared' : 'worried'} eaten={bite * 0.75} />
        {t > eatT && t < allT + 1 && <Crumbs x={740} y={880 + bite * 280} t={t - eatT} />}
        {t > bugT - 0.05 && <Bug x={lerp(1250, 640, prog(t, bugT - 0.05, bugT + 0.4, easeOutCubic))} y={lerp(800, 1020, bite * 0.6)} s={2.1} t={t} rot={-12} />}
        {t > pctT - 0.05 && <BigText x={540} y={620} text="91%" size={210 * slam(t, pctT - 0.05)} fill={C.yellow} />}
        {t > allT - 0.05 && <BigText x={540} y={820} text="EAT IT ALL?" size={104 * pop(t, allT - 0.05)} fill={C.paper} />}
        <Pill x={540} y={330} text="NEVER RECYCLED" s={span(t, recT - 0.1, bugT)} bg={C.red} fg={C.paper} size={60} />
        <Pill x={540} y={330} text="THIS BUG EATS PLASTIC" s={pop(t, bugT)} bg={BUG} size={54} />
      </Layer>
    </Stage>
  );
};

// 2016: found at a bottle recycling site in Japan. Ideonella sakaiensis. Two enzymes cut plastic into small pieces.
const DiscScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.disc;
  const sitT = ph('a bottle recycling');
  const nameT = ph('ideonella');
  const enzT = ph('two enzymes');
  const cutT = ph('cut plastic');
  const cut = t > cutT;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Rays t={t} cx={540} cy={1000} />
        {t < enzT ? (
          <g>
            {t < nameT - 0.1 && <Calendar x={250} y={520} s={0.75 * pop(t, t0 + 0.1)} label="2016" flip={0} />}
            {t < nameT - 0.1 && <Bug x={360} y={1080} s={1.8 * pop(t, t0 + 0.4)} t={t} chomp={false} />}
            {t > sitT - 0.1 && (
              <g transform={`translate(0 0) scale(1)`}>
                <Bin x={790} y={1240} s={1.6 * pop(t, sitT - 0.1)} color={C.teal} />
                {[0, 1, 2].map((i) => <Bottle key={i} id={`d${i}`} x={705 + i * 85} y={990 - (i % 2) * 20} s={0.55 * pop(t, sitT + i * 0.08)} rot={(i - 1) * 18} />)}
              </g>
            )}
            {t > nameT - 0.1 && (
              <g>
                <Bug x={360} y={1080} s={1.8} t={t} chomp={false} rot={Math.sin(t * 3) * 4} />
                <BigText x={540} y={620} text="IDEONELLA" size={92} fill={BUG} s={pop(t, nameT)} />
                <BigText x={540} y={760} text="SAKAIENSIS" size={92} fill={BUG} s={pop(t, nameT + 0.35)} />
              </g>
            )}
          </g>
        ) : (
          <g>
            <Bug x={540} y={560} s={1.7} t={t} chomp={false} />
            {!cut ? (
              <Bottle id="dc" x={540} y={1290} s={2} mood="worried" />
            ) : (
              <g>
                {Array.from({length: 10}).map((_, i) => {
                  const u = prog(t, cutT, cutT + 0.8, easeOutCubic);
                  const a = (i / 10) * Math.PI * 2;
                  return <rect key={i} x={540 + Math.cos(a) * 220 * u - 20} y={1080 + Math.sin(a) * 140 * u} width={60} height={38} rx={8} fill={PETC} stroke={C.ink} strokeWidth={4} transform={`rotate(${i * 37} ${540 + Math.cos(a) * 220 * u} ${1090 + Math.sin(a) * 140 * u})`} />;
                })}
              </g>
            )}
            <Enzyme x={230} y={1000} s={1.9 * pop(t, enzT)} t={t} name="PETase" />
            <Enzyme x={850} y={1000} s={1.9 * pop(t, enzT + 0.15)} t={t} name="MHETase" color={C.yellow} flip />
          </g>
        )}
        <Pill x={540} y={300} text="FOUND IN JAPAN, 2016" s={span(t, t0 + 0.1, nameT - 0.1)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="MEET THE PLASTIC EATER" s={span(t, nameT - 0.1, enzT)} bg={BUG} size={50} />
        <Pill x={540} y={300} text="2 ENZYMES CUT THE PLASTIC" s={pop(t, enzT)} bg={C.yellow} size={48} />
      </Layer>
    </Stage>
  );
};

// The obvious fix: spread it on every landfill and the plastic is gone. Right?
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const sprT = ph('spread it');
  const goneT = ph('plastic is gone');
  const rightT = ph('right');
  const gone = prog(t, goneT - 0.3, goneT + 0.6, easeInOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Landfill y={1200} t={t} gone={gone} />
        {t > sprT &&
          Array.from({length: 9}).map((_, i) => {
            const st = sprT + i * 0.07;
            const fall = prog(t, st, st + 0.6, easeOutCubic);
            return t > st ? <Bug key={i} x={160 + i * 95} y={lerp(-100, 960 + (i % 3) * 50, fall)} s={0.6} t={t + i} rot={(rnd(i) - 0.5) * 40} /> : null;
          })}
        {t > goneT - 0.05 && t < rightT - 0.05 && <BigText x={540} y={640} text="ALL GONE!" size={120 * pop(t, goneT - 0.05)} fill={C.yellow} />}
        {t > rightT - 0.05 && <BigText x={540} y={640} text="RIGHT?" size={150 * pop(t, rightT - 0.05)} fill={C.paper} />}
        <Pill x={540} y={300} text="SPREAD IT ON EVERY LANDFILL" s={span(t, t0 + 0.1, goneT - 0.05)} bg={C.yellow} size={44} />
        <Pill x={540} y={300} text="THE OBVIOUS FIX" s={pop(t, goneT - 0.05)} bg={C.green} size={56} />
      </Layer>
      <Sci t={t} x={950} y={1330} headR={40} flip poses={[[0, 'present'], [goneT, 'thumbs'], [rightT, 'think']]} />
    </Stage>
  );
};

// Problem 1: speed. Six weeks to eat a thin film. Just one. Only in the warm, at 30 C.
const SpeedScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.speed;
  const wkT = ph('six weeks');
  const oneT = ph('just one thin');
  const warmT = ph('only worked in');
  const degT = ph('thirty degrees');
  const left = 1 - 0.85 * prog(t, wkT, oneT + 0.4, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Rays t={t} cx={540} cy={900} />
        <Clock x={260} y={720} s={0.95} spin={(t - t0) * (t > wkT ? 3 : 0.4)} />
        {t > wkT - 0.1 && <BigText x={700} y={760} text="6 WEEKS" size={104 * pop(t, wkT - 0.1)} fill={C.yellow} />}
        <Film x={470} y={1150} s={1.6} left={left} />
        <Bug x={260 + 480 * left} y={1040} s={1.3} t={t} rot={-6} />
        {t > oneT - 0.1 && t < warmT && <BigText x={540} y={960} text="FOR ONE FILM" size={80 * pop(t, oneT - 0.1)} fill={C.paper} />}
        {t > warmT - 0.1 && <Thermo x={880} y={1080} level={0.55} s={0.75 * pop(t, warmT - 0.1)} />}
        {t > degT - 0.05 && <BigText x={640} y={1000} text="30°C" size={110 * pop(t, degT - 0.05)} fill={C.red} />}
        <Pill x={540} y={300} text="PROBLEM 1: SPEED" s={span(t, t0 + 0.1, wkT - 0.1)} bg={C.red} fg={C.paper} size={60} />
        <Pill x={540} y={300} text="6 WEEKS FOR A THIN FILM" s={span(t, wkT - 0.1, warmT - 0.1)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="AND ONLY WHEN IT'S WARM" s={pop(t, warmT - 0.1)} bg={C.yellow} size={50} />
      </Layer>
    </Stage>
  );
};

// Problem 2: eats only one kind. PET = drink bottles. Bags and wrappers: no enzyme that eats them well yet.
const KindScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.kind;
  const petT = ph('pet the plastic');
  const bagT = ph('bags and wrappers');
  const noT = ph('no enzyme');
  const bite = prog(t, petT, bagT - 0.2, (u) => u);
  const yuck = t > noT - 0.2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Rays t={t} cx={540} cy={900} />
        {t < bagT ? (
          <g>
            <Bottle id="k1" x={720} y={1290} s={2.1} label="PET" mood={t > petT ? 'scared' : 'worried'} eaten={bite * 0.6} />
            {t > petT && <Crumbs x={720} y={720 + bite * 330} t={t - petT} />}
            <Bug x={380} y={lerp(800, 960, bite)} s={1.8} t={t} rot={-8} />
          </g>
        ) : (
          <g>
            <Bag x={lerp(1300, 810, prog(t, bagT, bagT + 0.4, easeOutCubic))} y={1300} s={1.35} rot={6} mood="smug" />
            <Wrapper x={lerp(-300, 250, prog(t, bagT + 0.15, bagT + 0.55, easeOutCubic))} y={1200} s={1.35} rot={-10} mood="smug" />
            <Bug x={540} y={880} s={1.9} t={t} chomp={!yuck} mood={yuck ? 'yuck' : 'happy'} rot={yuck ? Math.sin(t * 20) * 4 : 0} />
            {yuck && <Stamp x={540} y={600} text="NO ENZYME YET" s={pop(t, noT - 0.2)} />}
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 2: ONLY ONE KIND" s={span(t, t0 + 0.1, petT)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={540} y={300} text="PET: DRINK BOTTLES" s={span(t, petT, bagT)} bg={PETC} size={56} />
        <Pill x={540} y={300} text="BAGS? WRAPPERS? NOPE" s={pop(t, bagT)} bg={C.paper} size={52} />
      </Layer>
    </Stage>
  );
};

// And the pile is huge: 460 million tonnes of plastic made in 2019.
const PileScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.pile;
  const yrT = ph('in twenty nineteen');
  const numT = ph('four hundred sixty');
  const grow = prog(t, t0 + 0.2, numT + 0.8, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0) * lerp(1, 0.92, prog(t, numT, numT + 1.5, easeOutCubic)), y: 1000}}>
      <Layer>
        <Sky />
        <path d="M -400 1400 L 1480 1400 L 1480 2400 L -400 2400 Z" fill={DIRT} stroke={C.ink} strokeWidth={INK_W} />
        <TrashHeap x={540} y={1420} s={lerp(1, 1.5, grow)} grow={lerp(0.4, 1, grow)} t={t} />
        <Bug x={940} y={1300} s={0.35} t={t} />
        {t > yrT && <Calendar x={540} y={1080} s={0.5 * pop(t, yrT)} label="2019" flip={0} />}
        {t > numT - 0.1 && <BigText x={540} y={480} text="460 MILLION" size={96 * slam(t, numT - 0.1)} fill={C.yellow} />}
        {t > numT + 0.4 && <BigText x={540} y={630} text="TONNES" size={80 * pop(t, numT + 0.4)} fill={C.paper} />}
        <Pill x={540} y={300} text="THE PILE IS HUGE" s={span(t, t0 + 0.1, yrT)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="PLASTIC MADE IN ONE YEAR" s={pop(t, yrT)} bg={C.yellow} size={50} />
      </Layer>
    </Stage>
  );
};

// Bacteria breathe out what they eat: about 3/4 of the plastic's carbon became CO2.
const Co2Scene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.co2;
  const brT = ph('breathe out');
  const qT = ph('three quarters');
  const share = prog(t, qT, qT + 1.0, easeOutCubic) * 0.75;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Rays t={t} cx={540} cy={1000} />
        <Bug x={qT < t ? 300 : 540} y={1150} s={qT < t ? 1.6 : 2.3} t={t} />
        {t > brT &&
          Array.from({length: 6}).map((_, i) => {
            const u = ((t - brT) * 0.5 + i / 6) % 1;
            const bx = (qT < t ? 200 : 420) + Math.sin(u * 8 + i) * 40;
            return <Co2 key={i} x={bx} y={1040 - u * 560} s={0.8 + 0.6 * u} />;
          })}
        {t > qT - 0.1 && (
          <g transform={`translate(760 820) scale(${pop(t, qT - 0.1)})`}>
            <Pie x={0} y={0} r={180} share={share} color={CO2C} />
            <BigText x={0} y={280} text="3/4" size={110} fill={C.yellow} />
          </g>
        )}
        <Pill x={540} y={300} text="BACTERIA BREATHE IT OUT" s={span(t, t0 + 0.1, qT - 0.1)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="~3/4 OF THE CARBON: CO2" s={pop(t, qT - 0.1)} bg={CO2C} size={50} />
      </Layer>
    </Stage>
  );
};

// So scientists took it into a factory. Carbios (France) built a faster enzyme: 90% in ~10 hours, pieces become new bottles.
const FacScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fac;
  const frT = ph('a french company');
  const enzT = ph('a faster enzyme');
  const pctT = ph('ninety percent');
  const newT = ph('become new bottles');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <path d="M -400 1300 L 1480 1300 L 1480 2400 L -400 2400 Z" fill="#9AA5AD" stroke={C.ink} strokeWidth={INK_W} />
        <Factory x={560} y={1300} s={1.05} t={t} on={prog(t, enzT, enzT + 0.5)} />
        {t > frT - 0.1 && t < pctT && <Flag x={120} y={560} s={0.9 * pop(t, frT - 0.1)} />}
        {t > enzT - 0.05 && t < pctT && <Enzyme x={760} y={600} s={1.6 * pop(t, enzT - 0.05)} t={t} name="FASTER ENZYME" />}
        {t > pctT - 0.05 && <BigText x={540} y={600} text="90% IN ~10 H" size={110 * slam(t, pctT - 0.05)} fill={C.yellow} />}
        {t > newT - 0.1 &&
          [0, 1, 2].map((i) => <Bottle key={i} id={`n${i}`} x={720 + i * 120} y={1290} s={0.6 * pop(t, newT - 0.1 + i * 0.1)} mood="happy" />)}
        <Pill x={540} y={300} text="TAKE IT TO A FACTORY" s={span(t, t0 + 0.1, frT - 0.1)} bg={C.yellow} size={54} />
        <Pill x={540} y={300} text="CARBIOS, FRANCE" s={span(t, frT - 0.1, pctT - 0.05)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="BOTTLES INTO NEW BOTTLES" s={pop(t, pctT - 0.05)} bg={C.green} size={48} />
      </Layer>
    </Stage>
  );
};

// Payoff: we don't need bugs in the trash. We need their tools in a factory.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const toolT = ph('we need their');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={560} cy={860} />
        {t < toolT ? (
          <g>
            <TrashHeap x={560} y={1200} s={1.1} t={t} />
            <Bug x={560} y={760} s={1.9} t={t} />
            <g transform={`translate(560 900) scale(${pop(t, t0 + 0.4)})`}>
              <path d="M -220 -220 L 220 220 M 220 -220 L -220 220" stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
              <path d="M -220 -220 L 220 220 M 220 -220 L -220 220" stroke={C.red} strokeWidth={46} strokeLinecap="round" />
            </g>
          </g>
        ) : (
          <g>
            <Factory x={640} y={1240} s={0.9 * pop(t, toolT)} t={t} on={1} />
            <Enzyme x={850} y={600} s={1.6 * pop(t, toolT + 0.2)} t={t} />
          </g>
        )}
        <Pill x={540} y={300} text="NOT BUGS IN THE TRASH" s={span(t, t0 + 0.1, toolT)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="THEIR TOOLS IN A FACTORY" s={pop(t, toolT)} bg={C.yellow} size={48} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'think'], [toolT, 'present']]} />
    </Stage>
  );
};

const EndScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.end;
  const s = pop(t, t0 + 0.05, 0.5);
  return (
    <Stage>
      <Layer>
        <Sunburst t={t} cx={540} cy={960} />
        <g transform={`translate(540 1130) scale(${pop(t, t0 + 0.35)})`}>
          <rect x={-470 + 8} y={-46 + 8} width={940} height={92} rx={46} fill={C.ink} />
          <rect x={-470} y={-46} width={940} height={92} rx={46} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={15} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={38} letterSpacing={2} fill={C.ink}>
            OBVIOUS FIXES. SURPRISING ANSWERS.
          </text>
        </g>
      </Layer>
      <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 450 * s, top: 830 - 80 * s, width: 900 * s}} />
    </Stage>
  );
};

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.cover, CoverScene],
  [S.hook, HookScene],
  [S.disc, DiscScene],
  [S.fix, FixScene],
  [S.speed, SpeedScene],
  [S.kind, KindScene],
  [S.pile, PileScene],
  [S.co2, Co2Scene],
  [S.fac, FacScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// len (s) cuts a sound off with a fade so it only plays while its scene is on screen.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const P = (n: string) => `plastic/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.disc, S.fix, S.speed, S.kind, S.pile, S.co2, S.fac, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: P('pile'), at: S.hook, db: -14},
  {f: I('stamp'), at: ph('ninetyone percent') - 0.05, db: -12},
  {f: P('chomp'), at: ph('can eat it'), db: -12},
  {f: P('chomp'), at: ph('can eat it') + 0.9, db: -14},
  {f: P('chomp'), at: ph('cut plastic'), db: -12},
  {f: P('pile'), at: ph('spread it'), db: -16},
  {f: P('clock'), at: ph('six weeks') - 0.1, db: -14},
  {f: P('clock'), at: ph('six weeks') + 0.9, db: -16},
  {f: P('chomp'), at: ph('pet the plastic'), db: -13},
  {f: P('bleh'), at: ph('no enzyme') - 0.2, db: -10},
  {f: I('stamp'), at: ph('no enzyme') - 0.2, db: -16},
  {f: P('pile'), at: S.pile + 0.2, db: -14},
  {f: I('stamp'), at: ph('four hundred sixty') - 0.1, db: -12},
  {f: P('factory'), at: ph('a faster enzyme'), db: -12},
  {f: I('stamp'), at: ph('ninety percent') - 0.05, db: -13},
  {f: P('factory'), at: ph('we need their'), db: -16},
  ...[ph('recycled') - 0.1, ph('one bacterium'), ph('eat all of it') - 0.05, ph('a bottle recycling') - 0.1, ph('ideonella') - 0.1, ph('two enzymes'), ph('plastic is gone') - 0.05, ph('right') - 0.05, ph('thirty degrees') - 0.05, ph('bags and wrappers'), ph('in twenty nineteen'), ph('three quarters') - 0.1, ph('a french company') - 0.1, ph('become new bottles') - 0.1].map((at) => ({f: I('pop'), at: at - 0.03, db: -21})),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const PlasticShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: BG}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.hook || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('plastic/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={c.len ? Math.max(1, Math.round(c.len * FPS)) : undefined} layout="none">
          <Audio
            src={staticFile(`${c.f}.wav`)}
            volume={(f) => Math.pow(10, c.db / 20) * (c.len ? clamp((c.len * FPS - f) / (0.5 * FPS)) * clamp(f / (0.3 * FPS)) : 1)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
