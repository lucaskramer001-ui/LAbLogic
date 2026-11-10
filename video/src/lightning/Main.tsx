import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Puffs, Sunburst, Thermo} from '../iceberg/art';
import {clamp, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {House, Stamp} from '../sun/space';
import {BigSci} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just catch lightning for electricity?" - Short, 1080x1920 (rendered 4K with --scale=2).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
export const NIGHT = '#24324F';
export const NIGHT_L = '#33466B';
export const BOLT = '#FFE14D';
const STONE = '#C9CED3';
const STONE_D = '#9AA3AB';
const BATT = '#7CD957';

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
// lightning flicker: on, short off, on again, gone after 0.3 s
const flick = (t: number, t0: number) => {
  const d = t - t0;
  return d >= 0 && d < 0.3 && !(d > 0.08 && d < 0.13);
};

// ------------------------------------------------------------------ props

// Storm sky with dark clouds along the top.
export const StormSky: React.FC<{t: number; flash?: number}> = ({t, flash = 0}) => (
  <g>
    <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const x = -120 + i * 230 + Math.sin(t * 0.4 + i) * 14;
      const y = 120 + (i % 2) * 70;
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${1.5 + (i % 3) * 0.2})`}>
          <path d="M -120 0 Q -120 -50 -70 -50 Q -50 -100 0 -90 Q 50 -110 80 -60 Q 130 -60 130 0 Z" fill={NIGHT_L} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        </g>
      );
    })}
    {flash > 0 && <rect x={-400} y={-400} width={1880} height={2800} fill="#fff" opacity={flash * 0.55} />}
  </g>
);

// Jagged strike from (x0, y0) to (x1, y1); call only while flick() is true.
export const Strike: React.FC<{x0: number; y0: number; x1: number; y1: number; seed?: number; w?: number}> = ({x0, y0, x1, y1, seed = 1, w = 1}) => {
  const n = 7;
  const pts = Array.from({length: n + 1}).map((_, i) => {
    const u = i / n;
    const off = i === 0 || i === n ? 0 : (rnd(seed * 13 + i) - 0.5) * 120 * w;
    return `${lerp(x0, x1, u) + off} ${lerp(y0, y1, u)}`;
  });
  const d = 'M ' + pts.join(' L ');
  return (
    <g>
      <path d={d} stroke={C.ink} strokeWidth={30 * w} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} stroke={BOLT} strokeWidth={18 * w} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} stroke="#fff" strokeWidth={6 * w} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

// Lightning bolt character (top centre x, y), ~260 x 640 at s = 1.
export const Bolt: React.FC<{x: number; y: number; s?: number; rot?: number; mood?: React.ComponentProps<typeof Face>['mood']; shades?: boolean}> = ({x, y, s = 1, rot = 0, mood = 'smug', shades}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -40 8 L 110 8 L 50 250 L 140 250 L -60 640 L 0 330 L -100 330 Z" fill={C.ink} transform="translate(10 10)" />
    <path d="M -40 0 L 110 0 L 50 250 L 140 250 L -60 640 L 0 330 L -100 330 Z" fill={BOLT} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <Face x={20} y={160} s={0.8} mood={mood} />
    {shades && (
      <g transform="translate(20 150)">
        <rect x={-62} y={-20} width={52} height={34} rx={10} fill={C.ink} />
        <rect x={10} y={-20} width={52} height={34} rx={10} fill={C.ink} />
        <line x1={-12} x2={12} y1={-10} y2={-10} stroke={C.ink} strokeWidth={6} />
      </g>
    )}
  </g>
);

// Empire State-style skyscraper (bottom centre x, y), ~300 wide, ~980 tall at s = 1. Spire tip at (x, y - 980 s).
export const Tower: React.FC<{x: number; y: number; s?: number; mood?: React.ComponentProps<typeof Face>['mood']}> = ({x, y, s = 1, mood = 'smug'}) => {
  const tiers: Array<[number, number, number]> = [
    [300, 0, 380],
    [220, 380, 300],
    [150, 680, 150],
    [90, 830, 70],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {tiers.map(([w, y0, h], i) => (
        <g key={i}>
          <rect x={-w / 2} y={-y0 - h} width={w} height={h} fill={i % 2 ? STONE : STONE_D} stroke={C.ink} strokeWidth={INK_W} />
          {Array.from({length: Math.floor(w / 40)}).map((_, k) => (
            <line key={k} x1={-w / 2 + 24 + k * 40} x2={-w / 2 + 24 + k * 40} y1={-y0 - h + 18} y2={-y0 - 14} stroke={C.ink} strokeWidth={3} opacity={0.35} />
          ))}
        </g>
      ))}
      <line x1={0} x2={0} y1={-900} y2={-980} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <line x1={0} x2={0} y1={-900} y2={-980} stroke={STONE} strokeWidth={5} strokeLinecap="round" />
      <rect x={-70} y={-560} width={140} height={110} rx={20} fill={STONE} />
      <Face x={0} y={-505} s={0.8} mood={mood} />
    </g>
  );
};

// Battery with a face (centre x, y), 200 x 300 at s = 1. level 0..1 fills it.
export const Battery: React.FC<{x: number; y: number; s?: number; level?: number; mood?: React.ComponentProps<typeof Face>['mood']; rot?: number}> = ({x, y, s = 1, level = 0.2, mood = 'happy', rot = 0}) => {
  const fh = 260 * clamp(level);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-100 + 10} y={-150 + 10} width={200} height={300} rx={28} fill={C.ink} />
      <rect x={-40} y={-178} width={80} height={36} rx={10} fill={STONE_D} stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-100} y={-150} width={200} height={300} rx={28} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
      {fh > 4 && <rect x={-82} y={130 - fh} width={164} height={fh} rx={16} fill={level > 0.95 ? C.green : BATT} />}
      <rect x={-100} y={-150} width={200} height={300} rx={28} fill="none" stroke={C.ink} strokeWidth={INK_W} />
      <Face x={0} y={-30} s={0.75} mood={mood} />
    </g>
  );
};

// Stopwatch (centre x, y), radius 190 at s = 1. hand 0..1 = one sweep.
export const Stopwatch: React.FC<{x: number; y: number; s?: number; hand: number; label: string}> = ({x, y, s = 1, hand, label}) => {
  const a = -Math.PI / 2 + hand * Math.PI * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-34} y={-262} width={68} height={60} rx={12} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
      <circle cx={10} cy={10} r={190} fill={C.ink} />
      <circle r={190} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
      {Array.from({length: 12}).map((_, i) => {
        const b = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(b) * 150} y1={Math.sin(b) * 150} x2={Math.cos(b) * 170} y2={Math.sin(b) * 170} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />;
      })}
      <line x1={0} y1={0} x2={Math.cos(a) * 140} y2={Math.sin(a) * 140} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
      <circle r={16} fill={C.ink} />
      <text x={0} y={95} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={64} fill={C.ink}>
        {label}
      </text>
    </g>
  );
};

// Power plant: block building + cooling tower with steam (bottom centre x, y), ~520 wide at s = 1.
export const PowerPlant: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Puffs x={130} y={-380} t={t} color="#EEF2F5" n={5} rise={260} />
    <path d="M 40 0 Q 70 -180 60 -360 L 200 -360 Q 190 -180 220 0 Z" fill={STONE} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-260} y={-230} width={300} height={230} fill={C.teal} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-220} y={-330} width={50} height={100} fill={STONE_D} stroke={C.ink} strokeWidth={INK_W} />
    {[-220, -140, -60].map((wx) => (
      <rect key={wx} x={wx} y={-170} width={50} height={60} fill={BOLT} stroke={C.ink} strokeWidth={5} />
    ))}
    <path d="M -110 -60 L -90 -100 L -100 -100 L -80 -140" stroke={C.ink} strokeWidth={6} fill="none" />
  </g>
);

// A house that lights up (bottom centre x, y).
export const LitHouse: React.FC<{x: number; y: number; s?: number; lit: number}> = ({x, y, s = 1, lit}) => (
  <g>
    {lit > 0 && <circle cx={x} cy={y - 55 * s} r={110 * s * lit} fill={BOLT} opacity={0.45} />}
    <House x={x} y={y} s={s} />
    <rect x={x - 42 * s} y={y - 52 * s} width={22 * s} height={20 * s} fill={lit > 0.5 ? BOLT : '#5F6B7A'} stroke={C.ink} strokeWidth={3} />
    <rect x={x + 20 * s} y={y - 52 * s} width={22 * s} height={20 * s} fill={lit > 0.5 ? BOLT : '#5F6B7A'} stroke={C.ink} strokeWidth={3} />
  </g>
);

const Ground: React.FC<{y: number; color?: string}> = ({y, color = '#3E4A5E'}) => (
  <g>
    <rect x={-400} y={y} width={1880} height={1400} fill={color} />
    <line x1={-400} x2={1480} y1={y} y2={y} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: ph('catch every') - 0.05,
  volts: ph('a single bolt') - 0.05,
  fix: ph("so here's the obvious") - 0.05,
  time: ph('the first problem') - 0.05,
  energy: ph('the second problem') - 0.05,
  math: ph('and even generous') - 0.05,
  final: ph('lightning looks like') - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover (key content inside rows 240-1680). Also the Still "LightningCover".
export const LightningCover: React.FC<{t?: number}> = ({t = 0}) => (
  <AbsoluteFill style={{backgroundColor: C.sky}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={C.sky} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3000;
        const cx = 700;
        const cy = 1250;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={C.skyL} />;
      })}
      <Tower x={760} y={1660} s={0.7} mood="smug" />
      <Bolt x={930} y={830} s={0.42} rot={14} mood="smug" />
      {[0, 1, 2].map((i) => (
        <LitHouse key={i} x={560 + i * 130} y={1660} s={1.0} lit={1} />
      ))}
      <ellipse cx={690} cy={1590} rx={250} ry={120} fill="none" stroke={C.ink} strokeWidth={22} />
      <ellipse cx={690} cy={1590} rx={250} ry={120} fill="none" stroke={C.red} strokeWidth={12} />
    </svg>
    <BigSci pose="calc" x={215} y={1260} headR={108} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)">
        <BigText x={540} y={560} text="A YEAR OF LIGHTNING" size={84} />
        <BigText x={540} y={800} text="= 3 HOMES?!" size={138} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 290, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <LightningCover t={t} />;

// A whole year of strikes on the Empire State Building -> only about three homes. But why?
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const strikes = [t0 + 0.25, ph('empire state') - 0.1, ph('whole year'), ph('whole year') + 0.55];
  const homesT = ph('three homes');
  const why = ph('but why');
  const tip = {x: 330, y: 1300 - 980 * 0.95};
  const flash = strikes.some((s) => flick(t, s)) ? 1 : 0;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <StormSky t={t} flash={flash} />
        <Ground y={1300} />
        <Tower x={330} y={1300} s={0.95} mood={t > homesT ? 'squeeze' : 'smug'} />
        {strikes.map((s, i) => (flick(t, s) ? <Strike key={i} x0={tip.x - 60 + i * 40} y0={-40} x1={tip.x} y1={tip.y} seed={i + 1} /> : null))}
        <path d={`M 480 1290 Q 600 1330 700 1295`} stroke={C.ink} strokeWidth={8} fill="none" />
        {[0, 1, 2].map((i) => (
          <LitHouse key={i} x={720 + i * 125} y={1300} s={1.0} lit={pop(t, homesT + i * 0.18)} />
        ))}
        <Pill x={540} y={300} text="A WHOLE YEAR OF STRIKES" s={span(t, ph('whole year'), homesT)} size={52} />
        <Pill x={540} y={300} text="ONLY ABOUT 3 HOMES" s={span(t, homesT, why)} bg={C.paper} size={56} />
        {t > why && <BigText x={540} y={360} text="BUT WHY?" size={130 * pop(t, why)} fill={C.yellow} />}
      </Layer>
    </Stage>
  );
};

// 300 million volts, 30,000 amps: sounds like a power plant falling out of the sky.
const VoltsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.volts;
  const voltsT = ph('million volts');
  const ampsT = ph('thousand amps');
  const plantT = ph('falling out');
  const fall = prog(t, plantT - 0.3, plantT + 0.6, (u) => u * u);
  const land = plantT + 0.6;
  const sh = t > land && t < land + 0.35 ? shake(t, 12 * (1 - (t - land) / 0.35)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <StormSky t={t} flash={flick(t, t0 + 0.05) ? 1 : 0} />
        <Ground y={1300} />
        <g transform={`translate(560 ${420}) scale(${pop(t, t0 + 0.05)}) translate(-560 -420)`}>
          <Bolt x={560} y={420} s={1.15} mood={t > ampsT ? 'smug' : 'happy'} />
        </g>
        {t > plantT - 0.3 && <PowerPlant x={830} y={lerp(-300, 1300, fall)} s={0.62} t={t} />}
        {t > land && t < land + 1.0 && <Puffs x={830} y={1290} t={(t - land) * 2} color="#9AA3AB" n={6} rise={140} />}
        <Pill x={540} y={300} text="300,000,000 VOLTS" s={span(t, voltsT - 0.3, ampsT - 0.2)} bg={BOLT} size={64} />
        <Pill x={540} y={300} text="30,000 AMPS" s={span(t, ampsT - 0.2, plantT - 0.3)} bg={BOLT} size={70} />
        <Pill x={540} y={300} text="A POWER PLANT FROM THE SKY?" s={pop(t, plantT - 0.3)} bg={C.paper} size={41} />
      </Layer>
      <Sci t={t} x={210} y={1330} headR={44} poses={[[0, 'shocked'], [plantT, 'point']]} />
    </Stage>
  );
};

// The obvious fix: tall towers catch strikes and store the electricity.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const buildT = ph('build tall');
  const catchT = ph('catch the strikes');
  const storeT = ph('store the');
  const grow = prog(t, buildT - 0.1, buildT + 0.6, easeOutBack);
  const fill = prog(t, storeT, storeT + 1.0, easeOutCubic);
  const hit = catchT + 0.15;
  const tipY = 1300 - 980 * 0.62 * grow;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={900} />
        <Ground y={1300} color="#8CCB6B" />
        {grow > 0.02 && (
          <g transform={`translate(260 1300) scale(1 ${grow}) translate(-260 -1300)`}>
            <Tower x={260} y={1300} s={0.62} mood="happy" />
          </g>
        )}
        {flick(t, hit) && <Strike x0={200} y0={-40} x1={260} y1={tipY} seed={7} />}
        {flick(t, hit + 0.45) && <Strike x0={330} y0={-40} x1={260} y1={tipY} seed={9} />}
        <path d="M 360 1290 Q 480 1330 560 1240" stroke={C.ink} strokeWidth={10} fill="none" />
        <Battery x={640} y={1100} s={pop(t, buildT + 0.2)} level={0.12 + 0.88 * fill} mood={fill > 0.5 ? 'happy' : 'neutral'} />
        <Pill x={540} y={300} text="THE OBVIOUS FIX" s={span(t, ph('obvious fix') - 0.2, buildT)} size={62} />
        <Pill x={540} y={300} text="BUILD TALL TOWERS" s={span(t, buildT, catchT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="CATCH THE STRIKES" s={span(t, catchT, storeT)} bg={BOLT} size={58} />
        <Pill x={540} y={300} text="STORE THE ELECTRICITY" s={pop(t, storeT)} bg={C.green} size={54} />
      </Layer>
      <Sci t={t} x={900} y={1330} headR={42} flip poses={[[0, 'present'], [storeT + 0.3, 'thumbs']]} />
    </Stage>
  );
};

// Problem 1: time. A flash is over in ~0.2 s, strokes last milliseconds; batteries can't take it in that fast.
const TimeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.time;
  const flashT = ph('a lightning flash', t0);
  const fifthT = ph('a fifth');
  const strokeT = ph('each stroke');
  const keepT = ph('to keep that');
  const instT = ph('almost instantly');
  const battT = ph("batteries can't");
  const hitT = ph('survive the hit');
  const sweep = prog(t, flashT, fifthT + 0.4, (u) => u);
  const phase = t < keepT - 0.1 ? 0 : 1;
  const zap = instT + 0.1;
  const fill = t > zap ? 0.15 + 0.4 * prog(t, zap, zap + 0.15) : 0.15;
  const sh = t > hitT && t < hitT + 0.4 ? shake(t, 12 * (1 - (t - hitT) / 0.4)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={C.paper} />
        {phase === 0 && <Stopwatch x={560} y={800} s={pop(t, t0 + 0.05)} hand={sweep} label={t > fifthT ? '0.2 S' : ''} />}
        {phase === 0 && t > strokeT && (
          <g>
            {[0, 1, 2].map((i) => {
              const s = pop(t, strokeT + 0.15 * i);
              return s > 0 ? <rect key={i} x={380 + i * 130} y={1110 - 60 * s} width={70} height={60 * s} rx={8} fill={BOLT} stroke={C.ink} strokeWidth={5} /> : null;
            })}
          </g>
        )}
        {phase === 1 && (
          <g>
            {flick(t, zap) && <Strike x0={560} y0={-40} x1={560} y1={760} seed={4} w={1.2} />}
            {flick(t, hitT - 0.1) && <Strike x0={520} y0={-40} x1={560} y1={760} seed={6} w={1.2} />}
            <Battery x={560} y={920} s={1.3 * pop(t, keepT - 0.1)} level={fill} mood={t > hitT ? 'dizzy' : t > zap ? 'scared' : 'worried'} rot={t > hitT ? -8 : 0} />
            {t > hitT && t < hitT + 1.2 && <Puffs x={560} y={720} t={(t - hitT) * 2} color="#9AA3AB" n={6} rise={180} />}
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 1: TIME" s={span(t, t0 + 0.1, fifthT)} bg={C.red} fg={C.paper} size={62} />
        <Pill x={540} y={300} text="ONE FLASH: ABOUT 0.2 S" s={span(t, fifthT, strokeT)} bg={BOLT} size={52} />
        <Pill x={540} y={300} text="EACH STROKE: A FEW MS" s={span(t, strokeT, keepT - 0.1)} bg={BOLT} size={52} />
        <Pill x={540} y={300} text="SOAK IT UP INSTANTLY" s={span(t, ph('soak it'), battT)} bg={C.paper} size={54} />
        {t > battT && <Stamp x={540} y={330} text="TOO FAST" s={slam(t, battT)} size={78} />}
        <Pill x={620} y={1250} text="AND SURVIVE THE HIT" s={pop(t, hitT - 0.1)} bg={C.paper} size={48} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'think'], [keepT, 'nervous']]} tremble={t > hitT ? 1 : 0} />
    </Stage>
  );
};

// Problem 2: where the energy goes - heat (about 50,000 F), light and thunder.
const EnergyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.energy;
  const heatT = ph('heats the air');
  const degT = ph('fifty thousand');
  const lightT = ph('flash of light');
  const thunderT = ph('crack of thunder');
  const lvl = prog(t, heatT, degT + 0.8, easeOutCubic);
  const boom = thunderT + 0.15;
  const sh = t > boom && t < boom + 0.5 ? shake(t, 18 * (1 - (t - boom) / 0.5)) : {x: 0, y: 0};
  const flash = flick(t, lightT) ? 1 : 0;
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <StormSky t={t} flash={flash} />
        <Ground y={1300} />
        <g transform={`translate(470 400) scale(${pop(t, t0 + 0.05)}) translate(-470 -400)`}>
          <Bolt x={470} y={400} s={1.05} mood={t > boom ? 'surprised' : 'smug'} />
        </g>
        {t > heatT - 0.1 && <Thermo x={880} y={1180} s={pop(t, heatT - 0.1)} level={lvl} />}
        {t > heatT && t < lightT && <Puffs x={420} y={1250} t={t - heatT} color="#F7B267" n={5} rise={200} />}
        {t > boom && <BigText x={530} y={1230} text="BOOM!" size={140 * pop(t, boom)} fill={C.yellow} />}
        <Pill x={540} y={300} text="PROBLEM 2: WHERE IT GOES" s={span(t, t0 + 0.1, heatT)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={540} y={300} text="HEAT: ABOUT 50,000°F" s={span(t, degT - 0.2, lightT)} bg={C.gold} size={56} />
        <Pill x={540} y={300} text="LIGHT" s={span(t, lightT, thunderT)} bg={BOLT} size={70} />
        <Pill x={540} y={300} text="THUNDER" s={pop(t, thunderT)} bg={C.paper} size={70} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'hot']]} tremble={t > boom && t < boom + 0.8 ? 1 : 0} />
    </Stage>
  );
};

// The math: ~5 billion J = ~1,400 kWh = under 2 months for one home; x 23 strikes a year = about 3 homes.
const MathScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.math;
  const jT = ph('five billion');
  const kwhT = ph('fourteen hundred');
  const monthsT = ph("that's under");
  const esbT = ph('the empire state', t0);
  const n23T = ph('twenty-three');
  const addT = ph('add it all');
  const homesT = ph('three homes', t0);
  const phase = t < esbT - 0.1 ? 0 : 1;
  const strikes = Array.from({length: 23}).map((_, i) => n23T - 0.2 + i * 0.075);
  const count = strikes.filter((s) => t > s).length;
  const lastStrike = strikes.find((s) => flick(t, s));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={C.paper} />
        {phase === 0 && t < monthsT - 0.1 && (
          <g transform={`translate(560 700) scale(${pop(t, t0 + 0.05)}) translate(-560 -700)`}>
            <Bolt x={560} y={440} s={0.85} mood="smug" />
          </g>
        )}
        {phase === 0 && t > monthsT - 0.1 && (
          <g>
            <LitHouse x={330} y={1060} s={2.2 * pop(t, monthsT - 0.1)} lit={1} />
            <Calendar x={790} y={830} s={0.8 * pop(t, monthsT + 0.2)} label="2" flip={0} />
          </g>
        )}
        {phase === 1 && (
          <g>
            <rect x={-400} y={-400} width={1880} height={1700} fill={NIGHT} />
            <Ground y={1300} />
            <Tower x={250} y={1300} s={0.8 * pop(t, esbT - 0.1)} mood={t > homesT ? 'squeeze' : 'smug'} />
            {lastStrike !== undefined && <Strike x0={200 + (count % 3) * 40} y0={-40} x1={250} y1={1300 - 980 * 0.8} seed={count + 2} />}
            {t > n23T - 0.2 && (
              <text x={740} y={700} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={200} fill={BOLT} stroke={C.ink} strokeWidth={36} paintOrder="stroke fill" strokeLinejoin="round">
                {count}
              </text>
            )}
            {[0, 1, 2].map((i) => (t > addT ? <LitHouse key={i} x={620 + i * 140} y={1300} s={1.05 * pop(t, addT + i * 0.15)} lit={pop(t, homesT + i * 0.15)} /> : null))}
          </g>
        )}
        <Pill x={540} y={300} text="EVEN GENEROUS ESTIMATES" s={span(t, t0 + 0.1, jT - 0.1)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="ABOUT 5 BILLION JOULES" s={span(t, jT - 0.1, kwhT - 0.1)} bg={BOLT} size={52} />
        <Pill x={540} y={300} text="ABOUT 1,400 KWH" s={span(t, kwhT - 0.1, monthsT)} bg={BOLT} size={62} />
        <Pill x={540} y={300} text="UNDER 2 MONTHS, 1 HOME" s={span(t, monthsT, esbT - 0.1)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="23 STRIKES A YEAR" s={span(t, n23T - 0.2, homesT)} bg={BOLT} size={58} />
        <Pill x={540} y={300} text="ABOUT 3 HOMES" s={pop(t, homesT)} bg={C.green} size={66} />
      </Layer>
      {phase === 0 && <Sci t={t} x={900} y={1330} headR={42} flip poses={[[0, 'calc']]} />}
    </Stage>
  );
};

// Payoff: looks like a power plant, it's really a very loud, very short spark.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const swapT = ph("it's really");
  const sq = t > swapT - 0.1 && t < swapT + 0.1 ? 1 - Math.sin(((t - swapT + 0.1) / 0.2) * Math.PI) * 0.5 : 1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={560} cy={900} />
        <g transform={`translate(560 1000) scale(${sq} ${2 - sq}) translate(-560 -1000)`}>
          {t < swapT ? <PowerPlant x={600} y={1150} s={1.0 * pop(t, t0 + 0.05)} t={t} /> : <Bolt x={560} y={640} s={0.75} mood="smug" shades />}
        </g>
        <Pill x={540} y={300} text="LOOKS LIKE: A POWER PLANT" s={span(t, t0 + 0.1, swapT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="REALLY: A LOUD, SHORT SPARK" s={pop(t, swapT)} bg={BOLT} size={42} />
      </Layer>
      <Sci t={t} x={190} y={1330} headR={44} poses={[[0, 'think'], [swapT + 0.2, 'facepalm']]} />
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
  [S.volts, VoltsScene],
  [S.fix, FixScene],
  [S.time, TimeScene],
  [S.energy, EnergyScene],
  [S.math, MathScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

type Cue = {f: string; at: number; db: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const L = (n: string) => `lightning/sfx/${n}`;
const n23 = ph('twenty-three');
const SFX: Cue[] = [
  ...[S.hook, S.volts, S.fix, S.time, S.energy, S.math, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: L('rain'), at: S.hook, db: -26},
  // strikes
  ...[S.hook + 0.25, ph('empire state') - 0.1, ph('whole year'), ph('whole year') + 0.55, S.volts + 0.05, ph('catch the strikes') + 0.15, ph('catch the strikes') + 0.6, ph('almost instantly') + 0.1, ph('survive the hit') - 0.1, ph('flash of light')].map((at) => ({
    f: L('zap'),
    at,
    db: -13,
  })),
  {f: L('rain'), at: S.energy, db: -26},
  {f: L('thunder'), at: ph('crack of thunder') + 0.1, db: -8},
  {f: L('rain'), at: ph('the empire state', S.math) - 0.1, db: -27},
  ...[0, 3, 6, 9, 12, 15, 18, 22].map((i) => ({f: L('zap'), at: n23 - 0.2 + i * 0.075, db: -19})),
  ...[ph('three homes'), ph('three homes') + 0.18, ph('three homes') + 0.36, ph('three homes', S.math), ph('three homes', S.math) + 0.15, ph('three homes', S.math) + 0.3].map((at) => ({f: L('ding'), at, db: -20})),
  ...[ph('whole year'), ph('million volts') - 0.3, ph('thousand amps') - 0.2, ph('falling out') - 0.3, ph('obvious fix') - 0.2, ph('build tall'), ph('catch the strikes'), ph('store the'), ph('a fifth'), ph('each stroke'), ph('soak it'), ph('survive the hit') - 0.1, ph('fifty thousand') - 0.2, ph('flash of light'), ph('five billion') - 0.1, ph('fourteen hundred') - 0.1, ph("that's under"), ph("it's really")].map((at) => ({f: I('pop'), at: at - 0.03, db: -21})),
  {f: I('stamp'), at: ph("batteries can't"), db: -12},
  {f: U('boom'), at: ph('falling out') + 0.6, db: -14},
  {f: I('bonk'), at: ph('survive the hit') + 0.05, db: -13},
  {f: U('fail'), at: ph('three homes', S.math) + 0.6, db: -20},
  {f: L('spark'), at: ph("it's really"), db: -14},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const LightningShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: C.sky}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.hook || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('lightning/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
