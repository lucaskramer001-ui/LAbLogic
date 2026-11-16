import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Puffs, Sea, Sky, Sunburst} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just raise the Titanic?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Hook in the first 2 s: cut to the sad wreck on the dark seabed with little bacteria chomping on it (~0.3 s).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const DEEP = '#0F2440';
const DEEP_L = '#173356';
const SEABED = '#5E5242';
const RUST = '#B5562A';
const RUST_L = '#D9773F';
const BUG = '#7CC46A';
const RAY_N = '#1F3C63';

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

// Deep-sea background with light rays fading down and a seabed at y.
const DeepSea: React.FC<{t: number; bed?: number}> = ({t, bed = 1300}) => (
  <g>
    <rect x={-400} y={-400} width={1880} height={2800} fill={DEEP} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${200 + i * 300 + Math.sin(t + i) * 20} -100 L ${330 + i * 300} -100 L ${430 + i * 300} ${bed} L ${260 + i * 300} ${bed} Z`} fill={DEEP_L} opacity={0.5} />
    ))}
    {Array.from({length: 10}).map((_, i) => {
      const y = ((rnd(i) * 1600 - t * 40 * (0.5 + rnd(i + 3))) % 1600 + 1600) % 1600;
      return <circle key={i} cx={rnd(i + 7) * 1080} cy={y} r={4 + rnd(i + 9) * 6} fill="#fff" opacity={0.25} />;
    })}
    <path d={`M -400 ${bed} Q 200 ${bed - 30} 540 ${bed + 10} T 1480 ${bed} L 1480 2400 L -400 2400 Z`} fill={SEABED} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// The Titanic, side view, bow to the left (centre x, waterline/keel y). rust 0..1, part: 'whole' | 'bow' | 'stern'.
export const Ship: React.FC<{x: number; y: number; s?: number; rust?: number; mood?: Mood; part?: 'whole' | 'bow' | 'stern'; rot?: number; face?: boolean}> = ({x, y, s = 1, rust = 0, mood = 'happy', part = 'whole', rot = 0, face = true}) => {
  const hull = rust > 0.5 ? '#3A2A22' : '#1F1F24';
  const upper = rust > 0.5 ? '#C9B79A' : '#FFF8E7';
  const clipX0 = part === 'stern' ? 20 : -460;
  const clipX1 = part === 'bow' ? 20 : 460;
  const id = `ship-${part}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <clipPath id={id}>
        <rect x={clipX0} y={-400} width={clipX1 - clipX0} height={520} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {/* funnels */}
        {[-170, -60, 50, 160].map((fx, i) => (
          <g key={i} opacity={part === 'stern' && fx < 20 ? 0 : 1}>
            <rect x={fx - 26} y={-300} width={52} height={130} fill={rust > 0.5 ? RUST : C.gold} stroke={C.ink} strokeWidth={6} />
            <rect x={fx - 26} y={-300} width={52} height={30} fill={C.ink} />
          </g>
        ))}
        <rect x={-330} y={-180} width={620} height={70} fill={upper} stroke={C.ink} strokeWidth={6} />
        {Array.from({length: 14}).map((_, i) => (
          <rect key={i} x={-310 + i * 42} y={-160} width={20} height={20} rx={4} fill={rust > 0.5 ? '#2A1E18' : '#5DB7F5'} />
        ))}
        <path d="M -440 -110 L 430 -110 L 400 0 L -380 0 Z" fill={hull} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        <path d="M -430 -80 L 425 -80" stroke={upper} strokeWidth={8} />
        {rust > 0 &&
          Array.from({length: 18}).map((_, i) => {
            const rx = -400 + i * 46 + rnd(i) * 10;
            const len = 20 + rnd(i + 5) * 60 * rust;
            return <path key={i} d={`M ${rx - 8} -110 L ${rx + 8} -110 L ${rx} ${-110 + len} Z`} fill={RUST_L} stroke={C.ink} strokeWidth={3} opacity={rust} />;
          })}
        {part !== 'stern' && face && <Face x={-300} y={-55} s={0.5} mood={mood} />}
      </g>
      {part === 'stern' &&
        [0, 1, 2, 3].map((i) => <path key={i} d={`M ${20 + i * 20} ${-120 + i * 30} l -40 20 l 30 20 Z`} fill={hull} stroke={C.ink} strokeWidth={5} />)}
      {part === 'bow' && <path d="M 20 -300 L 0 -200 L 30 -120 L 5 -40 L 25 0" stroke={C.ink} strokeWidth={6} fill="none" />}
    </g>
  );
};

// Little bacterium with a munching mouth.
const Bug: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => {
  const m = Math.abs(Math.sin(t * 10 + x));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse rx={34} ry={24} fill={BUG} stroke={C.ink} strokeWidth={5} />
      <circle cx={-10} cy={-6} r={5} fill={C.ink} />
      <circle cx={8} cy={-6} r={5} fill={C.ink} />
      <ellipse cx={0} cy={9} rx={10} ry={3 + 6 * m} fill={C.ink} />
    </g>
  );
};

// Crane ship on the surface with a cable hook ending at (x, hookY).
const Crane: React.FC<{x: number; y: number; hookY: number; s?: number}> = ({x, y, hookY, s = 1}) => (
  <g>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -180 0 L 180 0 L 150 70 L -150 70 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <rect x={-40} y={-260} width={30} height={260} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
      <path d="M -25 -250 L 200 -320" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      <path d="M -25 -250 L 200 -320" stroke={C.yellow} strokeWidth={12} strokeLinecap="round" />
    </g>
    <line x1={x + 200 * s} y1={y - 320 * s} x2={x + 200 * s} y2={hookY} stroke={C.ink} strokeWidth={5} />
    <path d={`M ${x + 200 * s} ${hookY} q 0 30 -20 30 q -20 0 -20 -20`} stroke={C.ink} strokeWidth={8} fill="none" />
  </g>
);

// Museum building (bottom centre x, y).
const Museum: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -220 -260 L 0 -360 L 220 -260 Z" fill={C.paper} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-220} y={-260} width={440} height={30} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    {[-160, -80, 0, 80, 160].map((cx) => (
      <rect key={cx} x={cx - 18} y={-230} width={36} height={200} fill="#fff" stroke={C.ink} strokeWidth={5} />
    ))}
    <rect x={-240} y={-30} width={480} height={30} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <text x={0} y={-275} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={32} fill={C.ink}>
      MUSEUM
    </text>
  </g>
);

// Shield badge.
const Shield: React.FC<{x: number; y: number; s?: number; text: string}> = ({x, y, s = 1, text}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -150 L 130 -100 Q 130 60 0 150 Q -130 60 -130 -100 Z" fill={C.ink} transform="translate(10 10)" />
    <path d="M 0 -150 L 130 -100 Q 130 60 0 150 Q -130 60 -130 -100 Z" fill={C.teal} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -55 0 L -15 40 L 60 -45" stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <text x={0} y={110} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={30} fill="#fff">
      {text}
    </text>
  </g>
);

// Book with the ship on its cover (centre x, y).
const Book: React.FC<{x: number; y: number; s?: number; mood?: Mood}> = ({x, y, s = 1, mood = 'happy'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-200 + 12} y={-260 + 12} width={400} height={520} rx={18} fill={C.ink} />
    <rect x={-200} y={-260} width={400} height={520} rx={18} fill={C.teal} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-200} y={-260} width={40} height={520} fill="#1E6B70" stroke={C.ink} strokeWidth={6} />
    <text x={20} y={-170} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={54} fill={C.yellow} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
      TITANIC
    </text>
    <Ship x={30} y={60} s={0.36} face={false} />
    <Face x={20} y={170} s={0.6} mood={mood} />
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: 0.3,
  fix: ph("it's the most") - 0.05,
  depth: ph('the first problem') - 0.05,
  two: ph('the second problem') - 0.05,
  rust: ph('and the steel') - 0.05,
  prot: ph('the wreck is also') - 0.05,
  mem: ph('more than fifteen') - 0.05,
  final: ph("we can't save") - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover: "BEING EATEN / RIGHT NOW?!" Also the Still "TitanicCover".
export const TitanicCover: React.FC<{t?: number}> = ({t = 0.4}) => (
  <AbsoluteFill style={{backgroundColor: DEEP}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={DEEP} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3200;
        const cx = 700;
        const cy = 1300;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY_N} />;
      })}
      <path d="M -100 1560 Q 400 1530 1180 1570 L 1180 2000 L -100 2000 Z" fill={SEABED} stroke={C.ink} strokeWidth={INK_W} />
      <Ship x={700} y={1520} s={0.95} rust={1} mood="scared" rot={-4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Bug key={i} x={420 + i * 120} y={1500 - (i % 2) * 70} s={1.4} t={t + i} />
      ))}
      <RedCircle x={690} y={1430} r={150} />
    </svg>
    <BigSci pose="nervous" x={180} y={1270} headR={130} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={510} text="THE TITANIC IS" size={92} />
        <BigText x={540} y={725} text="BEING EATEN?!" size={128} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <TitanicCover t={t} />;

// HOOK: your grandkids may never see the Titanic. Bacteria are eating it 3,800 m down. So why don't we just pull it up?
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const titT = ph('the titanic');
  const bugT = ph('bacteria are');
  const mT = ph('three thousand eight');
  const whyT = ph('so why');
  const upT = ph('pull it up');
  return (
    <Stage cam={{s: punch(t, t0) * lerp(1.15, 1, prog(t, t0, t0 + 1.2, easeOutCubic)), y: 1050}}>
      <Layer>
        <DeepSea t={t} bed={1300} />
        <Ship x={560} y={1290} s={1.05} rust={1} mood={t > bugT ? 'scared' : 'worried'} rot={-3} />
        {t > t0 + 0.2 &&
          Array.from({length: 7}).map((_, i) => {
            const s = pop(t, Math.max(t0 + 0.2, bugT - 0.6) + i * 0.08);
            return s > 0 ? <Bug key={i} x={250 + i * 95} y={1160 + (i % 2) * 70 + Math.sin(t * 3 + i) * 6} s={1.1 * s} t={t + i} /> : null;
          })}
        {t > bugT && t < bugT + 1.5 && <Puffs x={560} y={1190} t={(t - bugT) * 2} color={RUST_L} n={6} rise={120} />}
        {t > mT - 0.1 && <BigText x={540} y={610} text="3,800 M DOWN" size={90 * slam(t, mT - 0.1)} fill={C.yellow} />}
        {t > upT && <BigText x={540} y={800} text="PULL IT UP?" size={110 * pop(t, upT)} fill={C.paper} />}
        <Pill x={540} y={400} text="BEING EATEN RIGHT NOW" s={span(t, titT, whyT)} bg={BUG} size={52} />
      </Layer>
    </Stage>
  );
};

// The obvious fix: lift it, clean it, put it in a museum.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const liftT = ph('lift it');
  const musT = ph('museum');
  const lift = prog(t, liftT - 0.2, musT - 0.2, easeInOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={900} t={t} />
        <Crane x={260} y={880} hookY={lerp(1350, 700, lift)} s={0.9} />
        {t < musT - 0.1 ? (
          <Ship x={440} y={lerp(1500, 860, lift)} s={0.5} rust={0} mood="happy" />
        ) : (
          <g>
            <Museum x={720} y={860} s={0.9 * pop(t, musT - 0.1)} />
            <Ship x={720} y={880} s={0.3 * pop(t, musT)} mood="happy" />
          </g>
        )}
        <Pill x={540} y={300} text="THE MOST FAMOUS WRECK" s={span(t, t0 + 0.1, liftT)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="LIFT IT, CLEAN IT" s={span(t, liftT, musT - 0.1)} bg={C.yellow} size={58} />
        <Pill x={540} y={300} text="PUT IT IN A MUSEUM!" s={pop(t, musT - 0.1)} bg={C.green} size={56} />
      </Layer>
      <Sci t={t} x={950} y={1330} headR={40} flip poses={[[0, 'present'], [musT, 'thumbs']]} />
    </Stage>
  );
};

// Problem 1: depth - about 2.5 miles under the North Atlantic; not found until 1985.
const DepthScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.depth;
  const milT = ph('two and a half');
  const yrT = ph('until 1985');
  const grow = prog(t, milT - 0.3, milT + 1.2, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={DEEP} />
        <rect x={-400} y={-400} width={1880} height={720} fill={C.sky} />
        <Sea y={320} t={t} color={C.sea} depth={300} />
        <rect x={-400} y={620} width={1880} height={700} fill={DEEP_L} />
        <path d="M -400 1330 Q 540 1300 1480 1330 L 1480 2400 L -400 2400 Z" fill={SEABED} stroke={C.ink} strokeWidth={INK_W} />
        <Ship x={600} y={1320} s={0.4} rust={1} mood="worried" />
        <line x1={190} x2={190} y1={320} y2={320 + 1000 * grow} stroke={C.yellow} strokeWidth={10} />
        <line x1={150} x2={230} y1={320} y2={320} stroke={C.yellow} strokeWidth={10} />
        {grow > 0.98 && <line x1={150} x2={230} y1={1320} y2={1320} stroke={C.yellow} strokeWidth={10} />}
        {t > milT && <BigText x={420} y={820} text="2.5 MILES" size={96 * pop(t, milT)} fill={C.yellow} />}
        {t > yrT - 0.1 && <Calendar x={850} y={750} s={0.6 * pop(t, yrT - 0.1)} label="1985" flip={0} />}
        <Pill x={540} y={230} text="PROBLEM 1: DEPTH" s={span(t, t0 + 0.1, milT)} bg={C.red} fg={C.paper} size={60} />
        <Pill x={540} y={230} text="ABOUT 3,800 M DOWN" s={span(t, milT, yrT - 0.1)} bg={C.paper} size={56} />
        <Pill x={540} y={230} text="NOT FOUND UNTIL 1985" s={pop(t, yrT - 0.1)} bg={C.yellow} size={54} />
      </Layer>
    </Stage>
  );
};

// Problem 2: it broke in two; bow and stern ~600 m apart; the stern was smashed.
const TwoScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.two;
  const brokeT = ph('broke in two');
  const apartT = ph('six hundred');
  const smashT = ph('the stern was');
  const sep = prog(t, brokeT, brokeT + 1.0, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <DeepSea t={t} bed={1150} />
        {t < brokeT ? (
          <Ship x={540} y={1140} s={0.8} rust={1} mood="worried" />
        ) : (
          <g>
            <Ship x={lerp(540, 380, sep)} y={1140} s={0.8} rust={1} part="bow" mood="dizzy" rot={-sep * 4} />
            <Ship x={lerp(540, 760, sep)} y={1150} s={0.8} rust={1} part="stern" rot={sep * 10} />
          </g>
        )}
        {t > smashT && Array.from({length: 6}).map((_, i) => <rect key={i} x={820 + (rnd(i) - 0.5) * 300} y={1110 + rnd(i + 4) * 50} width={30} height={16} fill="#3A2A22" stroke={C.ink} strokeWidth={4} transform={`rotate(${rnd(i + 8) * 90} ${820 + (rnd(i) - 0.5) * 300} ${1120})`} />)}
        {t > apartT - 0.1 && (
          <g>
            <Arrow x1={540} y1={760} x2={240} y2={760} color={C.yellow} w={14} head={34} />
            <Arrow x1={540} y1={760} x2={940} y2={760} color={C.yellow} w={14} head={34} />
            <BigText x={540} y={720} text="~600 M" size={80} fill={C.yellow} s={pop(t, apartT - 0.1)} />
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 2: TWO PIECES" s={span(t, t0 + 0.1, apartT - 0.1)} bg={C.red} fg={C.paper} size={54} />
        <Pill x={540} y={300} text="BOW AND STERN, ~600 M APART" s={span(t, apartT - 0.1, smashT)} bg={C.paper} size={44} />
        <Pill x={540} y={300} text="THE STERN: SMASHED" s={pop(t, smashT)} bg={C.paper} size={56} />
      </Layer>
    </Stage>
  );
};

// The steel is falling apart: rusticles; 2010 new bacterium named after the ship; lift it and it could crumble.
const RustScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.rust;
  const rusT = ph('rusticles');
  const yrT = ph('in 2010');
  const nameT = ph('named it after');
  const liftT = ph('try to lift');
  const crT = ph('could crumble');
  const lift = prog(t, liftT, crT, easeOutCubic);
  const crumbled = t > crT;
  const sh = t > crT && t < crT + 0.4 ? shake(t, 12 * (1 - (t - crT) / 0.4)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={DEEP} />
        {t < liftT ? (
          <g>
            <rect x={-100} y={420} width={1280} height={300} fill="#3A2A22" stroke={C.ink} strokeWidth={INK_W} />
            {Array.from({length: 9}).map((_, i) => {
              const len = (140 + rnd(i) * 220) * pop(t, rusT - 0.3 + i * 0.05);
              const x = 80 + i * 115;
              return <path key={i} d={`M ${x - 34} 720 L ${x + 34} 720 L ${x + 6} ${720 + len} L ${x - 6} ${720 + len} Z`} fill={RUST_L} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />;
            })}
            {t > yrT &&
              [0, 1, 2].map((i) => <Bug key={i} x={250 + i * 290} y={1050 + (i % 2) * 60} s={1.6 * pop(t, yrT + i * 0.1)} t={t + i} />)}
            {t > nameT && <BigText x={540} y={1220} text="HALOMONAS TITANICAE" size={56} fill={BUG} s={pop(t, nameT)} />}
          </g>
        ) : (
          <g>
            <line x1={540} x2={540} y1={-100} y2={lerp(760, 560, lift)} stroke={C.ink} strokeWidth={6} />
            {!crumbled ? (
              <Ship x={540} y={lerp(1000, 800, lift)} s={0.8} rust={1} mood="scared" rot={Math.sin(t * 6) * 3} />
            ) : (
              Array.from({length: 16}).map((_, i) => {
                const d = t - crT;
                return <rect key={i} x={300 + (i % 8) * 60} y={720 + Math.floor(i / 8) * 60 + d * d * 500 * (0.6 + rnd(i))} width={44} height={30} fill={i % 3 ? '#3A2A22' : RUST_L} stroke={C.ink} strokeWidth={4} transform={`rotate(${d * 200 * (rnd(i + 2) - 0.5)} ${330 + (i % 8) * 60} 740)`} />;
              })
            )}
          </g>
        )}
        <Pill x={540} y={300} text="THE STEEL IS FALLING APART" s={span(t, t0 + 0.1, rusT)} bg={C.paper} size={46} />
        <Pill x={540} y={300} text="RUSTICLES: ICICLES OF RUST" s={span(t, rusT, yrT)} bg={RUST_L} size={46} />
        <Pill x={540} y={300} text="2010: A NEW BACTERIUM" s={span(t, yrT, liftT)} bg={BUG} size={52} />
        <Pill x={540} y={300} text="LIFT IT AND IT COULD CRUMBLE" s={pop(t, liftT)} bg={C.red} fg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// Protected: UNESCO convention + a US-UK treaty controlling entry.
const ProtScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.prot;
  const unT = ph('unesco convention');
  const trT = ph('a treaty');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <DeepSea t={t} bed={1250} />
        <Ship x={540} y={1240} s={0.85} rust={1} mood="smug" />
        {t > unT - 0.1 && <Shield x={330} y={640} s={pop(t, unT - 0.1)} text="UNESCO" />}
        {t > trT && <Shield x={750} y={640} s={pop(t, trT)} text="US + UK" />}
        <Pill x={540} y={300} text="THE WRECK IS PROTECTED" s={span(t, t0 + 0.1, unT - 0.1)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="UNESCO CONVENTION" s={span(t, unT - 0.1, trT)} bg={C.teal} fg={C.paper} size={56} />
        <Pill x={540} y={300} text="US-UK TREATY: WHO GOES IN" s={pop(t, trT)} bg={C.teal} fg={C.paper} size={46} />
      </Layer>
    </Stage>
  );
};

// More than 1,500 people died there, so the plan is to leave it where it is.
const MemScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.mem;
  const leaveT = ph('leave it where');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <DeepSea t={t} bed={1250} />
        <Ship x={540} y={1240} s={0.85} rust={1} face={false} />
        <g transform={`translate(540 520) scale(${pop(t, t0 + 0.2)})`}>
          <circle r={110} fill="none" stroke="#4E8A3A" strokeWidth={34} />
          {Array.from({length: 8}).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * 110} cy={Math.sin(a) * 110} r={22} fill={i % 2 ? '#fff' : C.red} stroke={C.ink} strokeWidth={4} />;
          })}
        </g>
        <Pill x={540} y={300} text="MORE THAN 1,500 LIVES LOST" s={span(t, t0 + 0.1, leaveT)} bg={C.paper} size={46} />
        <Pill x={540} y={300} text="SO IT STAYS WHERE IT IS" s={pop(t, leaveT)} bg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// Payoff: we can't save the ship, but we can save its story.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const storyT = ph('but we can');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={560} cy={860} />
        {t < storyT ? <Ship x={600} y={980} s={0.75} rust={1} mood="worried" /> : <Book x={600} y={860} s={1.1 * pop(t, storyT)} mood="happy" />}
        <Pill x={540} y={300} text="WE CAN'T SAVE THE SHIP" s={span(t, t0 + 0.1, storyT)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="BUT WE CAN SAVE ITS STORY" s={pop(t, storyT)} bg={C.yellow} size={48} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'think'], [storyT, 'present']]} />
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
  [S.fix, FixScene],
  [S.depth, DepthScene],
  [S.two, TwoScene],
  [S.rust, RustScene],
  [S.prot, ProtScene],
  [S.mem, MemScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// len (s) cuts a bed off with a fade so it only plays while its scene is on screen.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const T = (n: string) => `titanic/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.fix, S.depth, S.two, S.rust, S.prot, S.mem, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: T('deep'), at: S.hook, db: -20, len: S.fix - S.hook},
  {f: T('groan'), at: S.hook + 0.1, db: -12},
  {f: T('crumble'), at: ph('bacteria are'), db: -14},
  {f: T('winch'), at: ph('lift it') - 0.2, db: -14},
  {f: T('deep'), at: S.depth + 0.6, db: -24, len: S.two - S.depth - 0.6},
  {f: T('sonar'), at: ph('until 1985'), db: -14},
  {f: T('groan'), at: ph('broke in two'), db: -10},
  {f: T('crumble'), at: ph('the stern was'), db: -14},
  {f: T('winch'), at: ph('try to lift'), db: -14},
  {f: T('crumble'), at: ph('could crumble'), db: -8},
  {f: I('stamp'), at: ph('unesco convention') - 0.1, db: -14},
  {f: I('stamp'), at: ph('a treaty'), db: -14},
  {f: T('deep'), at: S.mem, db: -24, len: S.final - S.mem},
  ...[ph('three thousand eight') - 0.1, ph('pull it up'), ph('museum') - 0.1, ph('two and a half'), ph('six hundred') - 0.1, ph('rusticles'), ph('in 2010'), ph('named it after'), ph('more than fifteen'), ph('but we can')].map((at) => ({f: I('pop'), at: at - 0.03, db: -21})),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const TitanicShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: DEEP}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.hook || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('titanic/vo/vo.wav')} />
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
