import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, FONT_DISPLAY, Face, INK_W, Pill, Puffs, Sea, Sky, Sunburst} from '../iceberg/art';
import {clamp, easeOutBack, easeOutCubic, lerp, pop, prog, rnd} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just kill all the mosquitoes?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Hook in the first 2 s: a giant smug mosquito lands, "DEADLIEST ANIMAL ON EARTH" slams on "deadliest" (~1.3 s).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const BODY = '#4E525E';
const STRIPE = '#E8E2D0';
const DEADLY = '#E8352B';
const GENE = '#4FA8F0';
const NIGHT = '#2B2233';
const RAY_N = '#4A3550';

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
const fmt = (v: number) => Math.round(v).toLocaleString('en-US');

// ------------------------------------------------------------------ props

type Mood = React.ComponentProps<typeof Face>['mood'];
// Mosquito facing left (centre x, y), ~420 x 300 at s = 1. tint colours the body (deadly red, gene-drive blue, harmless green).
export const Mosquito: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood; tint?: string; rot?: number; faceOn?: boolean}> = ({x, y, s = 1, t, mood = 'smug', tint, rot = 0, faceOn = true}) => {
  const flap = Math.sin(t * 60) * 18;
  const body = tint ?? BODY;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {/* legs */}
      {[-40, 0, 40].map((lx, i) => (
        <g key={i}>
          <path d={`M ${lx} 30 L ${lx - 50 + i * 20} 110 L ${lx - 70 + i * 30} 170`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* wings */}
      <g opacity={0.75}>
        <ellipse cx={40} cy={-70} rx={110} ry={42} transform={`rotate(${-25 + flap} 0 -10)`} fill="#E6F4FF" stroke={C.ink} strokeWidth={5} />
        <ellipse cx={70} cy={-60} rx={100} ry={36} transform={`rotate(${-10 - flap} 0 -10)`} fill="#E6F4FF" stroke={C.ink} strokeWidth={5} />
      </g>
      {/* abdomen with stripes */}
      <g transform="rotate(-12 60 10)">
        <ellipse cx={130} cy={10} rx={120} ry={42} fill={body} stroke={C.ink} strokeWidth={INK_W} />
        {[70, 120, 170].map((sx) => (
          <path key={sx} d={`M ${sx} -28 Q ${sx + 8} 10 ${sx} 48`} stroke={STRIPE} strokeWidth={12} fill="none" />
        ))}
        <ellipse cx={130} cy={10} rx={120} ry={42} fill="none" stroke={C.ink} strokeWidth={INK_W} />
      </g>
      {/* thorax + head */}
      <circle cx={0} cy={0} r={52} fill={body} stroke={C.ink} strokeWidth={INK_W} />
      <circle cx={-80} cy={-10} r={50} fill={body} stroke={C.ink} strokeWidth={INK_W} />
      {/* proboscis */}
      <path d="M -125 5 L -250 50" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      {faceOn && <Face x={-86} y={-16} s={0.46} mood={mood} />}
    </g>
  );
};

// Bug spray can (bottom centre x, y) with a cloud when spraying.
const SprayCan: React.FC<{x: number; y: number; s?: number; t: number; spray?: number}> = ({x, y, s = 1, t, spray = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70 + 8} y={-300 + 8} width={140} height={300} rx={22} fill={C.ink} />
    <rect x={-70} y={-300} width={140} height={300} rx={22} fill={C.green} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-70} y={-220} width={140} height={90} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <text x={0} y={-160} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={36} fill={C.ink}>
      BUG
    </text>
    <rect x={-30} y={-340} width={60} height={44} rx={8} fill="#C3CED6" stroke={C.ink} strokeWidth={5} />
    {spray > 0 && <Puffs x={-130} y={-330} t={t * 2} color="#DFF7D6" n={6} rise={120} />}
  </g>
);

// Small fish (facing left).
const Fish: React.FC<{x: number; y: number; s?: number; mouth?: number}> = ({x, y, s = 1, mouth = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 60 0 L 120 -45 L 120 45 Z" fill={C.gold} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={0} cy={0} rx={80} ry={50} fill={C.gold} stroke={C.ink} strokeWidth={6} />
    <circle cx={-40} cy={-12} r={10} fill={C.ink} />
    <path d={`M -80 ${8 - 14 * mouth} L -50 10 L -80 ${12 + 14 * mouth}`} stroke={C.ink} strokeWidth={6} fill={mouth > 0.3 ? C.ink : 'none'} strokeLinejoin="round" />
  </g>
);

// Larva (tiny wriggle).
const Larva: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 6 + x) * 20})`}>
    <path d="M 0 -30 Q 12 -10 0 10 Q -12 25 0 40" stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M 0 -30 Q 12 -10 0 10 Q -12 25 0 40" stroke="#B9A27A" strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

// Simple bird (facing left).
const Bird: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood}> = ({x, y, s = 1, t, mood = 'happy'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={90} ry={70} fill="#8FB8DE" stroke={C.ink} strokeWidth={INK_W} />
    <path d={`M 10 -10 Q 70 ${-60 + Math.sin(t * 12) * 20} 120 -10 Z`} fill="#6E9CC8" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -90 -10 L -135 5 L -90 15 Z" fill={C.gold} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <Face x={-35} y={-20} s={0.45} mood={mood} />
    <line x1={-10} x2={-10} y1={68} y2={100} stroke={C.ink} strokeWidth={6} />
    <line x1={20} x2={20} y1={68} y2={100} stroke={C.ink} strokeWidth={6} />
  </g>
);

// Lab cage (wire box) centre x, y, size w x h.
const Cage: React.FC<{x: number; y: number; w: number; h: number; plants?: boolean}> = ({x, y, w, h, plants}) => (
  <g>
    <rect x={x - w / 2 + 10} y={y - h / 2 + 10} width={w} height={h} rx={14} fill={C.ink} />
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={14} fill="#F4FAFF" stroke={C.ink} strokeWidth={INK_W} />
    {plants &&
      [0, 1, 2, 3].map((i) => (
        <path key={i} d={`M ${x - w / 2 + 60 + i * (w / 4)} ${y + h / 2} q -20 -90 10 -150 q 20 50 -10 150`} fill="#8CCB6B" stroke={C.ink} strokeWidth={4} />
      ))}
    {Array.from({length: Math.floor(w / 50)}).map((_, i) => (
      <line key={`v${i}`} x1={x - w / 2 + 25 + i * 50} x2={x - w / 2 + 25 + i * 50} y1={y - h / 2} y2={y + h / 2} stroke={C.ink} strokeWidth={2} opacity={0.25} />
    ))}
    {Array.from({length: Math.floor(h / 50)}).map((_, i) => (
      <line key={`h${i}`} x1={x - w / 2} x2={x + w / 2} y1={y - h / 2 + 25 + i * 50} y2={y - h / 2 + 25 + i * 50} stroke={C.ink} strokeWidth={2} opacity={0.25} />
    ))}
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={14} fill="none" stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// DNA helix icon.
const Helix: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: 9}).map((_, i) => {
      const yy = -160 + i * 40;
      const a = Math.sin(i * 0.8 + t * 3) * 60;
      return (
        <g key={i}>
          <line x1={-a} x2={a} y1={yy} y2={yy} stroke={C.ink} strokeWidth={6} />
          <circle cx={-a} cy={yy} r={14} fill={GENE} stroke={C.ink} strokeWidth={4} />
          <circle cx={a} cy={yy} r={14} fill={C.red} stroke={C.ink} strokeWidth={4} />
        </g>
      );
    })}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: ph('bitten by') - 0.05,
  malaria: ph('malaria alone') - 0.05,
  why: ph('so why') - 0.05,
  fix: ph('it sounds simple') - 0.05,
  species: ph('the first catch') - 0.05,
  food: ph('the second catch') - 0.05,
  gene: ph('so scientists') - 0.05,
  wild: ph("hasn't been tested") - 0.05,
  final: ph('but the plan') - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover: "THE DEADLIEST ANIMAL / IS THIS?!" Also the Still "MosquitoCover".
export const MosquitoCover: React.FC<{t?: number}> = ({t = 0.1}) => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={NIGHT} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3200;
        const cx = 700;
        const cy = 1250;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY_N} />;
      })}
      <circle cx={720} cy={1250} r={330} fill={DEADLY} opacity={0.18} />
      <Mosquito x={700} y={1230} s={1.15} t={t} mood="smug" rot={-8} />
      <RedCircle x={700} y={1240} r={290} />
    </svg>
    <BigSci pose="shocked" x={185} y={1300} headR={130} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={520} text="THE DEADLIEST ANIMAL" size={70} />
        <BigText x={540} y={750} text="IS THIS?!" size={196} fill={C.yellow} />
      </g>
      <Arrow x1={980} y1={820} x2={860} y2={990} color={C.red} w={26} head={58} />
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <MosquitoCover t={t} />;

// HOOK: you've been bitten by the deadliest animal on Earth.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const deadT = ph('deadliest animal');
  const earthT = ph('on earth');
  const fly = prog(t, t0, t0 + 0.6, easeOutCubic);
  const mx = lerp(1300, 640, fly);
  const my = lerp(600, 1000, fly) + Math.sin(t * 9) * 12;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} />
        <Sunburst t={t} cx={640} cy={1000} />
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} opacity={0.5} />
        <circle cx={640} cy={1000} r={340 * pop(t, deadT)} fill={DEADLY} opacity={0.22} />
        <Mosquito x={mx} y={my} s={1.35} t={t} mood={t > earthT ? 'smug' : 'happy'} rot={-6} />
        {t > deadT && <BigText x={540} y={420} text="DEADLIEST" size={124 * slam(t, deadT)} fill={C.yellow} />}
        {t > deadT && <BigText x={540} y={590} text="ANIMAL ON EARTH" size={70 * slam(t, deadT + 0.15)} fill={C.paper} />}
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'shocked']]} tremble={t > deadT ? 1 : 0} />
    </Stage>
  );
};

// Malaria alone left about 597,000 people dead in 2023.
const MalariaScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.malaria;
  const numT = ph('five hundred');
  const yrT = ph('in 2023');
  const cnt = prog(t, numT - 0.2, numT + 1.6, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} />
        <Mosquito x={650} y={1040} s={0.9} t={t} mood="smug" tint={DEADLY} />
        <BigText x={540} y={620} text={fmt(597000 * cnt)} size={170} fill={DEADLY} s={pop(t, numT - 0.2)} />
        <Pill x={540} y={300} text="MALARIA ALONE" s={span(t, t0 + 0.1, yrT)} bg={C.paper} size={60} />
        <Pill x={540} y={300} text="DEATHS IN 2023 (WHO)" s={pop(t, yrT)} bg={C.paper} size={54} />
      </Layer>
    </Stage>
  );
};

// So why don't we just wipe out every mosquito?
const WhyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.why;
  const wipeT = ph('wipe out');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={900} />
        {Array.from({length: 7}).map((_, i) => (
          <Mosquito key={i} x={220 + (i % 4) * 220 + (i > 3 ? 110 : 0)} y={760 + Math.floor(i / 4) * 230 + Math.sin(t * 5 + i) * 15} s={0.45} t={t + i} mood={t > wipeT ? 'scared' : 'happy'} />
        ))}
        {t > wipeT && <BigText x={540} y={420} text="WIPE THEM ALL OUT?" size={72 * pop(t, wipeT)} fill={C.yellow} />}
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'think']]} />
    </Stage>
  );
};

// The obvious fix: spray everything, drain every puddle.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const sprayT = ph('spray everything');
  const drainT = ph('drain every');
  const goneT = ph('gone for good');
  const drain = prog(t, drainT, drainT + 1.0, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <rect x={-400} y={1150} width={1880} height={900} fill="#8CCB6B" />
        <line x1={-400} x2={1480} y1={1150} y2={1150} stroke={C.ink} strokeWidth={INK_W} />
        <ellipse cx={760} cy={1210} rx={220 * (1 - drain) + 4} ry={40 * (1 - drain) + 2} fill="#4FA8F0" stroke={C.ink} strokeWidth={5} />
        <SprayCan x={300} y={1120} s={pop(t, sprayT - 0.1)} t={t} spray={t > sprayT && t < drainT + 0.5 ? 1 : 0} />
        {[0, 1, 2].map((i) => {
          const fall = prog(t, sprayT + 0.3 + i * 0.25, sprayT + 1.0 + i * 0.25, (u) => u * u);
          return <Mosquito key={i} x={560 + i * 170} y={lerp(520 + i * 60, 1120, fall)} s={0.4} t={t + i} mood={fall > 0 ? 'dizzy' : 'happy'} rot={fall * 160} />;
        })}
        <Pill x={540} y={300} text="SPRAY EVERYTHING" s={span(t, sprayT, drainT)} bg={C.green} size={58} />
        <Pill x={540} y={300} text="DRAIN EVERY PUDDLE" s={span(t, drainT, goneT)} bg="#9FE0FF" size={56} />
        <Pill x={540} y={300} text="PROBLEM SOLVED?" s={pop(t, goneT)} bg={C.yellow} size={62} />
      </Layer>
    </Stage>
  );
};

// Catch 1: ~3,500 species; only females bite; most never spread disease; of ~430 Anopheles only 30-40 spread malaria.
const SpeciesScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.species;
  const numT = ph('three thousand five');
  const femT = ph('only the females');
  const mostT = ph('most species never');
  const anoT = ph('of roughly');
  const fewT = ph('thirty to forty');
  const cols = 6;
  const rows = 5;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={C.paper} />
        {Array.from({length: cols * rows}).map((_, i) => {
          const s = pop(t, numT - 0.2 + i * 0.03);
          if (s <= 0) return null;
          const x = 130 + (i % cols) * 165;
          const y = 520 + Math.floor(i / cols) * 150 + Math.sin(t * 4 + i) * 6;
          const male = i % 2 === 1;
          const deadly = i === 7 || i === 20;
          let tint: string | undefined;
          let mood: Mood = 'happy';
          if (t > fewT && deadly) {
            tint = DEADLY;
            mood = 'smug';
          } else if (t > mostT && !deadly) {
            tint = '#7CC46A';
          } else if (t > femT && male) {
            tint = '#B9BCC4';
            mood = 'neutral';
          }
          return <Mosquito key={i} x={x} y={y} s={0.28 * s} t={t + i} tint={tint} mood={mood} />;
        })}
        <Pill x={540} y={300} text="~3,500 KINDS OF MOSQUITO" s={span(t, numT - 0.2, femT)} bg={C.paper} size={48} />
        <Pill x={540} y={300} text="ONLY FEMALES BITE" s={span(t, femT, mostT)} bg={C.yellow} size={58} />
        <Pill x={540} y={300} text="MOST: HARMLESS TO US" s={span(t, mostT, anoT)} bg={C.green} size={54} />
        <Pill x={540} y={300} text="~430 ANOPHELES SPECIES" s={span(t, anoT, fewT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="ONLY 30-40 SPREAD MALARIA" s={pop(t, fewT)} bg={DEADLY} fg={C.paper} size={48} />
      </Layer>
    </Stage>
  );
};

// Catch 2: mosquitoes are food - larvae feed fish; Arctic birds could drop by half (one estimate; others disagree).
const FoodScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.food;
  const larT = ph('their larvae');
  const birdT = ph('one entomologist');
  const halfT = ph('drop by half');
  const disT = ph('others disagree');
  const gulp = t > larT + 0.4 && t < larT + 0.8 ? 1 : 0;
  const pond = t < birdT - 0.1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        {pond ? (
          <g>
            <Sky />
            <Sea y={700} t={t} color="#3C8FD6" />
            {Array.from({length: 6}).map((_, i) => (
              <Larva key={i} x={300 + i * 110} y={900 + (i % 2) * 120} t={t} s={1.2} />
            ))}
            <Fish x={lerp(1100, 380, prog(t, larT, larT + 0.6, easeOutCubic))} y={960} s={1.5} mouth={gulp} />
            <Mosquito x={760} y={520} s={0.5} t={t} mood="happy" />
          </g>
        ) : (
          <g>
            <rect x={-400} y={-400} width={1880} height={2800} fill="#CDEBF8" />
            <rect x={-400} y={1100} width={1880} height={900} fill="#fff" />
            <line x1={-400} x2={1480} y1={1100} y2={1100} stroke={C.ink} strokeWidth={INK_W} />
            {[0, 1, 2, 3].map((i) => {
              const gone = t > halfT && i >= 2;
              const s = gone ? 1 - prog(t, halfT, halfT + 0.5) : pop(t, birdT + i * 0.1);
              return s > 0 ? <Bird key={i} x={220 + i * 210} y={990} s={0.9 * s} t={t + i} mood={t > halfT ? 'worried' : 'happy'} /> : null;
            })}
            {t > disT && <BigText x={540} y={760} text="?" size={240 * pop(t, disT)} fill={C.yellow} />}
          </g>
        )}
        <Pill x={540} y={300} text="MOSQUITOES ARE FOOD" s={span(t, t0 + 0.1, larT)} bg={C.yellow} size={56} />
        <Pill x={540} y={300} text="LARVAE FEED FISH" s={span(t, larT, birdT - 0.1)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="ARCTIC BIRDS: UP TO HALF?" s={span(t, birdT, disT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="ONE ESTIMATE. OTHERS DISAGREE" s={pop(t, disT)} bg={C.paper} size={42} />
      </Layer>
    </Stage>
  );
};

// The smarter fix: gene drive (Imperial College London). Small cages 2018: no females, died out. Big cages: collapsed in a year.
const GeneScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.gene;
  const targetT = ph('target only');
  const yrT = ph('in 2018');
  const driveT = ph('gene drive');
  const noFemT = ph('no females');
  const outT = ph('died out');
  const bigT = ph('bigger cages');
  const colT = ph('collapsed within');
  const big = t > bigT - 0.1;
  const spread = prog(t, driveT, noFemT, (u) => u);
  const n = 10;
  const alive = big ? Math.round(n * (1 - prog(t, colT - 0.3, colT + 1.0))) : Math.round(n * (1 - prog(t, noFemT, outT + 0.3)));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={C.paper} />
        {t < yrT && (
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <Mosquito key={i} x={180 + i * 190} y={820} s={0.42} t={t + i} tint={i === 2 ? DEADLY : '#7CC46A'} mood={i === 2 ? 'scared' : 'happy'} />
            ))}
            {t > targetT && <RedCircle x={560} y={820} r={110} />}
          </g>
        )}
        {t >= yrT && (
          <g>
            <Cage x={big ? 600 : 540} y={860} w={big ? 800 : 620} h={big ? 620 : 480} plants={big} />
            {Array.from({length: n}).map((_, i) =>
              i < alive ? (
                <Mosquito
                  key={i}
                  x={(big ? 600 : 540) + (rnd(i + 3) - 0.5) * (big ? 620 : 440) + Math.sin(t * 2 + i) * 20}
                  y={860 + (rnd(i + 9) - 0.5) * (big ? 420 : 300) + Math.cos(t * 3 + i) * 14}
                  s={0.26}
                  t={t + i}
                  tint={!big && i / n < spread ? GENE : DEADLY}
                  mood="neutral"
                />
              ) : null,
            )}
            {t > driveT - 0.1 && !big && <Helix x={930} y={480} s={0.6 * pop(t, driveT - 0.1)} t={t} />}
          </g>
        )}
        <Pill x={540} y={300} text="TARGET ONLY THE DEADLY FEW" s={span(t, targetT, yrT)} bg={C.yellow} size={46} />
        <Pill x={540} y={300} text="IMPERIAL COLLEGE, 2018" s={span(t, yrT, driveT)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="A GENE DRIVE SPREADS" s={span(t, driveT, noFemT)} bg={GENE} size={54} />
        <Pill x={540} y={300} text="NO FEMALES BORN" s={span(t, noFemT, outT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="THE CAGES DIED OUT" s={span(t, outT, bigT - 0.1)} bg={DEADLY} fg={C.paper} size={56} />
        <Pill x={540} y={300} text="BIGGER, NATURE-LIKE CAGES" s={span(t, bigT, colT - 0.1)} bg={C.paper} size={48} />
        <Pill x={540} y={300} text="COLLAPSED WITHIN A YEAR" s={pop(t, colT - 0.1)} bg={C.green} size={50} />
      </Layer>
      <Sci t={t} x={110} y={1330} headR={34} poses={[[0, 'point'], [outT, 'thumbs']]} />
    </Stage>
  );
};

// Not tested in the wild yet.
const WildScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.wild;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <rect x={-400} y={1100} width={1880} height={900} fill="#8CCB6B" />
        <line x1={-400} x2={1480} y1={1100} y2={1100} stroke={C.ink} strokeWidth={INK_W} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M ${110 + i * 330} 1100 L ${200 + i * 330} 840 L ${290 + i * 330} 1100 Z`} fill="#5FA35A" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        ))}
        <Mosquito x={560} y={700} s={0.7} t={t} mood="smug" />
        <Stamp x={540} y={400} text="NOT IN THE WILD YET" s={slam(t, t0 + 0.1)} size={60} />
      </Layer>
    </Stage>
  );
};

// Payoff: we don't need to kill every mosquito - just the few that kill us.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const needT = ph("we don't need");
  const fewT = ph('just the few');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={880} />
        {Array.from({length: 9}).map((_, i) => {
          const deadly = i === 4;
          const s = pop(t, t0 + 0.1 + i * 0.05);
          const x = 220 + (i % 3) * 320;
          const y = 600 + Math.floor(i / 3) * 230 + Math.sin(t * 5 + i) * 10;
          return (
            <g key={i}>
              <Mosquito x={x} y={y} s={0.42 * s} t={t + i} tint={deadly ? DEADLY : '#7CC46A'} mood={deadly ? (t > fewT ? 'scared' : 'smug') : 'happy'} />
              {deadly && t > fewT && <RedCircle x={x} y={y} r={120} />}
            </g>
          );
        })}
        <Pill x={540} y={300} text="NOT EVERY MOSQUITO" s={span(t, needT, fewT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="JUST THE DEADLY FEW" s={pop(t, fewT)} bg={DEADLY} fg={C.paper} size={56} />
      </Layer>
      <Sci t={t} x={140} y={1330} headR={40} poses={[[0, 'present'], [fewT, 'thumbs']]} />
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
  [S.malaria, MalariaScene],
  [S.why, WhyScene],
  [S.fix, FixScene],
  [S.species, SpeciesScene],
  [S.food, FoodScene],
  [S.gene, GeneScene],
  [S.wild, WildScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// len (s) cuts a bed off with a fade so it only plays while its scene is on screen.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const M = (n: string) => `mosquito/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.malaria, S.why, S.fix, S.species, S.food, S.gene, S.wild, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: M('buzz'), at: S.hook, db: -12},
  {f: U('boom'), at: ph('deadliest animal'), db: -12},
  {f: M('slap'), at: ph('on earth'), db: -10},
  {f: M('swarm'), at: S.why, db: -24, len: S.fix - S.why},
  {f: M('spray'), at: ph('spray everything'), db: -14},
  {f: I('splash'), at: ph('drain every'), db: -20},
  {f: M('swarm'), at: ph('three thousand five') - 0.2, db: -28, len: S.food - ph('three thousand five')},
  {f: M('gulp'), at: ph('their larvae') + 0.4, db: -12},
  {f: M('buzz'), at: ph('caged malaria'), db: -22},
  {f: U('fail'), at: ph('died out'), db: -18},
  {f: U('fail'), at: ph('collapsed within'), db: -18},
  {f: I('stamp'), at: S.wild + 0.1, db: -12},
  {f: M('slap'), at: ph('just the few') + 0.1, db: -12},
  ...[ph('five hundred') - 0.2, ph('in 2023'), ph('wipe out'), ph('gone for good'), ph('only the females'), ph('most species never'), ph('of roughly'), ph('thirty to forty'), ph('their larvae'), ph('one entomologist'), ph('others disagree'), ph('target only'), ph('in 2018'), ph('gene drive'), ph('no females'), ph('bigger cages'), ph("we don't need")].map((at) => ({
    f: I('pop'),
    at: at - 0.03,
    db: -21,
  })),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const MosquitoShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.hook || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('mosquito/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={c.len ? Math.max(1, Math.round(c.len * FPS)) : undefined} layout="none">
          <Audio
            src={staticFile(`${c.f}.wav`)}
            volume={(f) => Math.pow(10, c.db / 20) * (c.len ? clamp((c.len * FPS - f) / (0.4 * FPS)) * clamp(f / (0.2 * FPS)) : 1)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
