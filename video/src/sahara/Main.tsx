import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Sky, Sun, Sunburst, Thermo} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

import {blink, camShake, ease, impact, jiggle, springIn} from '../kit/motion';

// "Why don't we just cover the Sahara in solar panels?" - Short, 1080x1920, 1080p, cover = separate Still SaharaCover.
// Main characters (Higgsfield 1k-medium drafts + code faces): solar Panel, Camel, desert backdrop; reuses the tree and
// Earth sprites from the trees episode.

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const SAND = '#F2B84B';
const SAND_D = '#D99A2B';
const DUST = '#D9B26A';
const RAIN = '#8FD3F2';

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

// Main character: solar Panel (Higgsfield sprite 700x782, legs at y 776, plain face band around y 290) + code face.
// dust 0..1 coats it in sand. Bottom centre (x, y), ~280 px tall at s=1.
const Panel: React.FC<{x: number; y: number; s?: number; t?: number; mood?: Mood; dust?: number; seed?: number; face?: boolean; look?: {x: number; y: number}}> = ({x, y, s = 1, t = 0, mood = 'happy', dust = 0, seed = 0, face = true, look}) => (
  <g transform={`translate(${x} ${y}) scale(${s * 0.36} ${s * 0.36 * (1 + 0.012 * Math.sin(t * 2.4 + seed))}) translate(-350 -776)`}>
    <image href={staticFile('sahara/panel.png')} x={0} y={0} width={700} height={782} />
    {dust > 0.01 && (
      <g opacity={Math.min(0.92, dust)}>
        <path d="M 50 60 L 650 60 L 652 610 L 48 610 Z" fill={DUST} />
        {Array.from({length: 14}).map((_, i) => <circle key={i} cx={80 + rnd(i + seed) * 540} cy={90 + rnd(i + 30) * 500} r={14 + rnd(i + 60) * 22} fill={SAND_D} />)}
      </g>
    )}
    {face && <Face x={350} y={300} s={1.5} mood={mood} open={blink(t, seed)} look={look} gap={46} />}
  </g>
);

// Camel (Higgsfield sprite 700x669, facing left, feet at y 663), bottom centre, ~270 px tall at s=1.
const Camel: React.FC<{x: number; y: number; s?: number; t?: number}> = ({x, y, s = 1, t = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s * 0.4} ${s * 0.4 * (1 + 0.01 * Math.sin(t * 2))}) translate(-350 -663)`}>
    <image href={staticFile('sahara/camel.png')} x={0} y={0} width={700} height={669} />
  </g>
);

// Tree (illustrated sprite from the trees episode) with a code face, bottom centre, ~380 px tall at s=1.
const Tree: React.FC<{x: number; y: number; s?: number; t?: number; mood?: Mood; dry?: number}> = ({x, y, s = 1, t = 0, mood = 'happy', dry = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s * 0.38}) rotate(${Math.sin(t * 1.6) * 2}) translate(-330 -995)`}>
    <image href={staticFile('tree/tree.png')} x={0} y={0} width={671} height={1000} style={{filter: dry > 0 ? `sepia(${dry * 0.8}) saturate(${1 - dry * 0.4})` : undefined}} />
    <Face x={325} y={340} s={1.55} mood={mood} open={blink(t, 3)} gap={44} />
  </g>
);

// Earth (illustrated sprite from the trees episode) with a code face.
const Globe: React.FC<{x: number; y: number; r: number; t: number; mood?: Mood}> = ({x, y, r, t, mood = 'worried'}) => (
  <g>
    <g transform={`translate(${x} ${y}) scale(${r / 398}) translate(-400 -404)`}>
      <image href={staticFile('earth/earth.png')} x={0} y={0} width={800} height={809} />
    </g>
    <Face x={x} y={y - r * 0.05} s={r / 150} mood={mood} open={blink(t, 2)} gap={44} />
  </g>
);

const Desert: React.FC<{dim?: number}> = ({dim = 0}) => (
  <g>
    <image href={staticFile('sahara/desert.jpg')} x={0} y={0} width={1080} height={1920} />
    {dim > 0 && <rect width={1080} height={1920} fill="#000" opacity={dim} />}
  </g>
);

// Rain cloud with drops.
const Cloud: React.FC<{x: number; y: number; s?: number; t: number; rain?: number}> = ({x, y, s = 1, t, rain = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {rain > 0 &&
      Array.from({length: 6}).map((_, i) => {
        const u = (t * 1.6 + i / 6) % 1;
        return <path key={i} d="M 0 -14 Q 9 0 0 9 Q -9 0 0 -14 Z" transform={`translate(${-80 + i * 32} ${60 + u * 120})`} fill={RAIN} stroke={C.ink} strokeWidth={3} opacity={rain * (1 - u)} />;
      })}
    <path d="M -110 40 Q -140 40 -140 10 Q -140 -25 -100 -25 Q -90 -70 -40 -65 Q -10 -100 40 -80 Q 90 -90 100 -40 Q 140 -40 140 0 Q 140 40 105 40 Z" fill="#EEF3F7" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
  </g>
);

// House with a small rooftop panel (bottom centre).
const House: React.FC<{x: number; y: number; s?: number; color?: string; panel?: number}> = ({x, y, s = 1, color = '#F7B2C8', panel = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-90} y={-150} width={180} height={150} fill={color} stroke={C.ink} strokeWidth={6} />
    <rect x={-25} y={-80} width={50} height={80} fill="#8A5A3B" stroke={C.ink} strokeWidth={5} />
    <rect x={-70} y={-125} width={34} height={34} fill="#BFE6F5" stroke={C.ink} strokeWidth={4} />
    <path d="M -110 -150 L 0 -240 L 110 -150 Z" fill="#C0533A" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {panel > 0.01 && (
      <g transform={`translate(30 -195) rotate(39) scale(${panel})`}>
        <rect x={-45} y={-18} width={90} height={36} fill="#1E4FA8" stroke={C.ink} strokeWidth={4} />
        <line x1={-15} x2={-15} y1={-18} y2={18} stroke="#9FB8E0" strokeWidth={3} />
        <line x1={15} x2={15} y1={-18} y2={18} stroke="#9FB8E0" strokeWidth={3} />
      </g>
    )}
  </g>
);

// Dust storm: drifting puffs from the left; amount 0..1.
const DustStorm: React.FC<{t: number; amount: number}> = ({t, amount}) =>
  amount <= 0.01 ? null : (
    <g opacity={amount}>
      {Array.from({length: 14}).map((_, i) => {
        const u = (t * 0.35 + rnd(i)) % 1;
        const y = 500 + rnd(i + 20) * 900;
        const r = 70 + rnd(i + 40) * 90;
        return <circle key={i} cx={-200 + u * 1500} cy={y + Math.sin(t * 2 + i) * 20} r={r} fill={DUST} stroke={C.ink} strokeWidth={5} opacity={0.85} />;
      })}
    </g>
  );

// Panel field on the desert floor: rows of small panels popping in from t0 (fill 0..1 of the rows).
const PanelField: React.FC<{t: number; t0: number; y0?: number; rows?: number; faces?: boolean}> = ({t, t0, y0 = 1180, rows = 3, faces = false}) => (
  <g>
    {Array.from({length: rows}).map((_, r) =>
      Array.from({length: 5 + r}).map((_, i) => {
        const n = 5 + r;
        const s = 0.45 + r * 0.17;
        const x = 540 + (i - (n - 1) / 2) * (1080 / n) * 0.98;
        const k = springIn(t, t0 + (r * 5 + i) * 0.05, 0.5, 11);
        return k > 0.001 ? <Panel key={`${r}-${i}`} x={x} y={y0 + r * 150} s={s * k} t={t} seed={r * 7 + i} face={faces && r === rows - 1 && i === Math.floor(n / 2)} /> : null;
      }),
    )}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  hook: 0,
  fix: ph('the sahara is huge') - 0.05,
  cable: ph('the first problem') - 0.05,
  sand: ph('the second problem') - 0.05,
  dark: ph('the third problem') - 0.05,
  rain: ph('the rain belt') - 0.05,
  small: ph('so the answer') - 0.05,
  final: ph('the sun is free') - 0.05,
  end: VO_END + 0.3,
};

// Separate cover (Still "SaharaCover").
export const SaharaCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: SAND}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Desert />
      <PanelField t={0.3} t0={-5} y0={1250} rows={2} />
      <Panel x={640} y={1660} s={1.9} t={0.4} mood="smug" />
      <g transform="translate(900 1000)">
        <circle r={150} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
        <Tree x={0} y={140} s={0.78} t={0.3} mood="scared" dry={0.8} />
      </g>
      <RedCircle x={900} y={1000} r={175} />
    </svg>
    <BigSci pose="shocked" x={150} y={1400} headR={105} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={530} text="SAHARA SOLAR" size={110} />
        <BigText x={540} y={730} text="DRIES THE AMAZON?!" size={92} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);

// HOOK (frame 0): panels pop across the dunes, "20%" slams, the Amazon tree in an inset loses its rain cloud.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const pctT = ph('twenty percent');
  const amT = ph('amazon');
  const anyT = ph('anyway');
  const sh = camShake(t, [[pctT, 12]]);
  const away = ease(t, amT + 0.2, amT + 1.4);
  return (
    <Stage cam={{s: lerp(1.12, 1, ease(t, 0, 1.6)), x: 540 + sh.x, y: 960 + sh.y}}>
      <Layer>
        <Desert />
        <PanelField t={t} t0={-0.45} y0={1180} rows={3} faces />
        {t > pctT - 0.1 && t < anyT - 0.1 && <BigText x={540} y={560} text="20% OF THE SAHARA" size={74 * slam(t, pctT - 0.1)} fill={C.yellow} />}
        {t > amT - 0.2 && (
          <g transform={`translate(790 900) scale(${springIn(t, amT - 0.2, 0.6, 10)})`}>
            <circle r={170} fill="#BFE8C5" stroke={C.ink} strokeWidth={INK_W} />
            <Tree x={0} y={150} s={0.8} t={t} mood={away > 0.5 ? 'scared' : 'happy'} dry={away} />
            <Cloud x={lerp(-20, -330, away)} y={lerp(-150, -60, away)} s={0.55} t={t} rain={1 - away} />
            <text y={215} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={40} fill={C.paper} stroke={C.ink} strokeWidth={9} paintOrder="stroke fill">
              AMAZON
            </text>
          </g>
        )}
        {t > anyT - 0.1 && <BigText x={540} y={560} text="DO IT ANYWAY?" size={92 * springIn(t, anyT - 0.1, 0.55, 9)} fill={C.yellow} />}
        <Pill x={540} y={300} text="SOLAR PANELS IN THE SAHARA" s={span(t, 0.1, anyT)} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// The obvious fix: huge, sunniest place on Earth, almost nobody lives there. Fill it with panels. Easy, right?
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const sunT = ph('sunniest');
  const nobT = ph('almost nobody');
  const fillT = ph('fill it');
  const easyT = ph('easy right');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Desert />
        {t < fillT ? <Camel x={560} y={1360} s={1.5 * springIn(t, nobT - 0.1, 0.6, 10)} t={t} /> : <PanelField t={t} t0={fillT} y0={1180} rows={3} faces />}
        {t > easyT - 0.05 && <BigText x={540} y={600} text="EASY, RIGHT?" size={120 * springIn(t, easyT - 0.05, 0.5, 9)} fill={C.paper} />}
        <Pill x={540} y={300} text="IT'S HUGE" s={span(t, t0 + 0.1, sunT - 0.1)} bg={SAND} size={58} />
        <Pill x={540} y={300} text="THE SUNNIEST PLACE ON EARTH" s={span(t, sunT - 0.1, nobT - 0.1)} bg={C.yellow} size={44} />
        <Pill x={540} y={300} text="ALMOST NOBODY LIVES THERE" s={span(t, nobT - 0.1, fillT)} bg={C.paper} size={46} />
        <Pill x={540} y={300} text="FILL IT WITH PANELS!" s={pop(t, fillT)} bg={C.green} size={54} />
      </Layer>
      {t > fillT && <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'thumbs'], [easyT, 'think']]} />}
    </Stage>
  );
};

// Problem 1: the cable. Desertec fell apart in 2013; in 2025 Britain turned down a 4,000 km cable from Morocco.
const CableScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.cable;
  const citT = ph('reach the cities');
  const desT = ph('desertec');
  const apartT = ph('fell apart');
  const xlT = ph('and in twenty');
  const ukT = ph('britain');
  const kmT = ph('four thousand');
  const grow = ease(t, citT - 0.2, citT + 1.0);
  const grow2 = ease(t, xlT, ukT + 0.4);
  const snap = t > apartT;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect width={1080} height={1920} fill="#5DB7F5" />
        <path d="M -100 520 Q 300 440 600 520 Q 900 600 1180 500 L 1180 -100 L -100 -100 Z" fill="#8BC86A" stroke={C.ink} strokeWidth={INK_W} />
        <path d="M -100 1200 Q 300 1120 600 1180 Q 900 1240 1180 1160 L 1180 2100 L -100 2100 Z" fill={SAND} stroke={C.ink} strokeWidth={INK_W} />
        {/* city skyline (Europe / UK) */}
        {[[700, 150, '#F7B2C8'], [800, 230, '#B9E4C9'], [900, 180, '#FFD23F']].map(([bx, bh, c], i) => (
          <rect key={i} x={bx as number} y={500 - (bh as number)} width={90} height={bh as number} fill={c as string} stroke={C.ink} strokeWidth={6} />
        ))}
        <Panel x={260} y={1330} s={1.1} t={t} mood={snap && t < xlT ? 'worried' : 'happy'} look={{x: 0.6, y: -0.6}} />
        {/* Desertec cable */}
        {t < xlT && (
          <g>
            <path d={`M 300 1100 Q 500 ${800} ${lerp(300, 820, grow)} ${lerp(1100, 480, grow)}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={snap ? '300 120 2000' : undefined} />
            <path d={`M 300 1100 Q 500 ${800} ${lerp(300, 820, grow)} ${lerp(1100, 480, grow)}`} stroke={C.yellow} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={snap ? '300 120 2000' : undefined} />
            {t > desT - 0.1 && <Calendar x={820} y={980} s={0.45 * springIn(t, desT - 0.1, 0.5)} label="2013" flip={0} />}
            {snap && <Stamp x={540} y={760} text="FELL APART" s={springIn(t, apartT, 0.5, 10)} />}
          </g>
        )}
        {/* Xlinks cable Morocco -> UK */}
        {t >= xlT && (
          <g>
            <path d={`M 300 1100 C 120 900 120 700 ${lerp(300, 880, grow2)} ${lerp(1100, 360, grow2)}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
            <path d={`M 300 1100 C 120 900 120 700 ${lerp(300, 880, grow2)} ${lerp(1100, 360, grow2)}`} stroke="#FF9F1C" strokeWidth={10} fill="none" strokeLinecap="round" />
            {t > kmT - 0.1 && <BigText x={600} y={900} text="4,000 KM" size={110 * slam(t, kmT - 0.1)} fill={C.yellow} />}
            {t > ukT + 0.5 && <Stamp x={680} y={660} text="UK SAID NO" s={springIn(t, ukT + 0.5, 0.5, 10)} rot={6} />}
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 1: THE CABLE" s={span(t, t0 + 0.1, desT - 0.1)} bg={C.red} fg={C.paper} size={54} />
        <Pill x={540} y={300} text="DESERTEC: SAHARA TO EUROPE" s={span(t, desT - 0.1, xlT)} bg={C.paper} size={44} />
        <Pill x={540} y={300} text="2025: MOROCCO TO THE UK" s={pop(t, xlT)} bg="#FF9F1C" size={48} />
      </Layer>
    </Stage>
  );
};

// Problem 2: sand. Dust storms coat the panels; up to 30% less power in a month; cleaning takes water, in a desert.
const SandScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.sand;
  const stormT = ph('dust storms');
  const pctT = ph('thirty percent');
  const cleanT = ph('cleaning them');
  const desT = ph('in a desert');
  const dust = ease(t, stormT, pctT, (u) => u) * (1 - ease(t, cleanT + 0.3, cleanT + 1.2) * 0.9);
  const storm = ease(t, stormT - 0.3, stormT + 0.4) * (1 - ease(t, pctT, pctT + 0.8));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Desert dim={storm * 0.2} />
        <Panel x={540} y={1360} s={2.3} t={t} dust={dust} mood={dust > 0.4 ? 'squeeze' : 'happy'} />
        <DustStorm t={t} amount={storm} />
        {t > pctT - 0.1 && t < cleanT && <BigText x={540} y={600} text="-30% POWER" size={104 * slam(t, pctT - 0.1)} fill={C.yellow} />}
        {t > cleanT && (
          <g>
            {Array.from({length: 8}).map((_, i) => {
              const u = ((t - cleanT) * 1.6 + i / 8) % 1;
              return <path key={i} d="M 0 -18 Q 12 0 0 12 Q -12 0 0 -18 Z" transform={`translate(${320 + i * 60} ${560 + u * 300})`} fill={RAIN} stroke={C.ink} strokeWidth={3} opacity={1 - u} />;
            })}
          </g>
        )}
        {t > desT - 0.1 && <Stamp x={540} y={560} text="IN A DESERT?!" s={springIn(t, desT - 0.1, 0.5, 10)} />}
        <Pill x={540} y={300} text="PROBLEM 2: SAND" s={span(t, t0 + 0.1, pctT - 0.1)} bg={C.red} fg={C.paper} size={58} />
        <Pill x={540} y={300} text="IN JUST ONE MONTH" s={span(t, pctT - 0.1, cleanT)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="CLEANING TAKES WATER" s={pop(t, cleanT)} bg={RAIN} size={52} />
      </Layer>
    </Stage>
  );
};

// Problem 3: dark panels on bright sand. 2021 model: 20% coverage -> desert ~1.5 C hotter.
const DarkScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.dark;
  const darkT = ph('panels are dark');
  const brightT = ph('sand is bright');
  const modT = ph('in a twenty');
  const hotT = ph('one and a half');
  const heat = ease(t, ph('made the desert'), hotT + 0.8);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Desert />
        {/* sunlight: bounces off the bright sand (left), soaked up by the dark panels (right) */}
        {t > darkT - 0.2 &&
          [0, 1].map((i) => (
            <g key={i}>
              <Arrow x1={880 - i * 50} y1={300 + i * 30} x2={300 + i * 90} y2={1160} color={C.yellow} w={14} head={32} />
              <Arrow x1={300 + i * 90} y1={1150} x2={180 + i * 90} y2={800} color="#FFF3A0" w={12} head={30} />
            </g>
          ))}
        {t > darkT - 0.2 &&
          [0, 1].map((i) => <Arrow key={i} x1={900 + i * 30} y1={320} x2={700 + i * 140} y2={1080} color={C.yellow} w={14} head={32} />)}
        {[0, 1, 2].map((i) => (
          <Panel key={i} x={640 + i * 160} y={1260} s={0.85} t={t} seed={i} face={i === 1} mood={heat > 0.5 ? 'squeeze' : 'happy'} />
        ))}
        {t > hotT - 0.3 && <Thermo x={170} y={1250} level={lerp(0.35, 0.85, heat)} s={0.7 * springIn(t, hotT - 0.3, 0.5)} />}
        {t > hotT - 0.1 && <BigText x={560} y={660} text="+1.5°C" size={130 * slam(t, hotT - 0.1)} fill={C.red} />}
        {t > modT - 0.1 && t < hotT - 0.1 && <Calendar x={820} y={640} s={0.45 * springIn(t, modT - 0.1, 0.5)} label="2021" flip={0} />}
        <Pill x={540} y={300} text="PROBLEM 3: THE WEIRDEST" s={span(t, t0 + 0.1, darkT - 0.2)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={540} y={300} text="DARK PANELS, BRIGHT SAND" s={span(t, darkT - 0.2, modT - 0.1)} bg={C.paper} size={46} />
        <Pill x={540} y={300} text="A 2021 CLIMATE MODEL" s={pop(t, modT - 0.1)} bg={C.yellow} size={50} />
      </Layer>
    </Stage>
  );
};

// The rain belt shifts north, the Amazon gets drier, and the whole planet warms by ~0.16 C.
const RainScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.rain;
  const amT = ph('amazon got');
  const wholeT = ph('even the whole');
  const zT = ph('zero point');
  const move = ease(t, t0 + 0.2, amT + 0.4);
  const globe = t > wholeT - 0.1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect width={1080} height={1920} fill="#9BD3F7" />
        {!globe ? (
          <g>
            <path d="M -100 1150 L 1180 1150 L 1180 2100 L -100 2100 Z" fill="#6BAF4A" stroke={C.ink} strokeWidth={INK_W} />
            {[200, 540, 880].map((tx, i) => (
              <Tree key={tx} x={tx} y={1220 + (i % 2) * 40} s={0.8} t={t + i} mood={t > amT ? 'worried' : 'happy'} dry={ease(t, amT, amT + 1.2) * 0.8} />
            ))}
            <Cloud x={540} y={lerp(720, 470, move)} s={1.2} t={t} rain={1 - move} />
            <Arrow x1={900} y1={760} x2={900} y2={lerp(760, 420, move)} color={C.yellow} w={18} head={40} />
            {t > amT - 0.05 && <Stamp x={540} y={760} text="AMAZON DRIER" s={springIn(t, amT - 0.05, 0.5, 10)} />}
          </g>
        ) : (
          <g>
            <Globe x={540} y={1050} r={300} t={t} mood={t > zT ? 'scared' : 'worried'} />
            {t > zT - 0.1 && <BigText x={540} y={620} text="+0.16°C" size={130 * slam(t, zT - 0.1)} fill={C.red} />}
          </g>
        )}
        <Pill x={540} y={300} text="THE RAIN BELT MOVES NORTH" s={span(t, t0 + 0.1, wholeT - 0.1)} bg={RAIN} size={46} />
        <Pill x={540} y={300} text="THE WHOLE PLANET WARMS" s={pop(t, wholeT - 0.1)} bg={C.red} fg={C.paper} size={48} />
      </Layer>
    </Stage>
  );
};

// The answer: lots of smaller solar farms, close to the people who use them.
const SmallScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.small;
  const lotsT = ph('lots of smaller');
  const closeT = ph('close to the');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <path d="M -100 1300 L 1180 1300 L 1180 2100 L -100 2100 Z" fill="#8BC86A" stroke={C.ink} strokeWidth={INK_W} />
        {t < lotsT ? (
          <g>
            <Panel x={540} y={1300} s={2.6 * (1 - ease(t, lotsT - 0.4, lotsT))} t={t} mood="worried" />
            <path d="M 300 760 L 780 1240 M 780 760 L 300 1240" stroke={C.red} strokeWidth={40 * springIn(t, t0 + 0.6, 0.5)} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            {[[180, '#F7B2C8'], [420, '#B9E4C9'], [660, '#FFD23F'], [900, '#C7B8F5']].map(([hx, c], i) => (
              <House key={i} x={hx as number} y={1310} s={1.05 * springIn(t, lotsT + i * 0.1, 0.5)} color={c as string} panel={springIn(t, lotsT + 0.4 + i * 0.1, 0.5)} />
            ))}
            {[300, 780].map((px, i) => <Panel key={px} x={px} y={1420} s={0.75 * springIn(t, closeT + i * 0.15, 0.5)} t={t} seed={i} face={i === 0} />)}
          </g>
        )}
        <Pill x={540} y={300} text="NOT ONE GIANT FARM" s={span(t, t0 + 0.1, lotsT)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="LOTS OF SMALL ONES, CLOSE BY" s={pop(t, lotsT)} bg={C.green} size={44} />
      </Layer>
    </Stage>
  );
};

// Payoff: the sun is free. Moving it isn't.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const movT = ph('moving it');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={860} />
        <Sun x={540} y={760} r={150 * springIn(t, t0 + 0.1, 0.6)} t={t} />
        <Panel x={760} y={1300} s={1.4} t={t} mood={t > movT ? 'smug' : 'happy'} />
        {t > movT - 0.1 && <Stamp x={540} y={560} text="MOVING IT ISN'T" s={springIn(t, movT - 0.1, 0.5, 10)} />}
        <Pill x={540} y={300} text="THE SUN IS FREE" s={span(t, t0 + 0.1, movT - 0.1)} bg={C.yellow} size={56} />
      </Layer>
      <Sci t={t} x={220} y={1330} headR={42} poses={[[0, 'present'], [movT, 'point']]} />
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
  [S.hook, HookScene],
  [S.fix, FixScene],
  [S.cable, CableScene],
  [S.sand, SandScene],
  [S.dark, DarkScene],
  [S.rain, RainScene],
  [S.small, SmallScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// All sounds reused from earlier episodes (0 new SFX credits). len cuts a bed off with a fade.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.fix, S.cable, S.sand, S.dark, S.rain, S.small, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  ...[0, 1, 2].map((i) => ({f: I('pop'), at: 0.15 + i * 0.35, db: -22})),
  {f: I('stamp'), at: ph('twenty percent') - 0.1, db: -12},
  {f: I('pop'), at: ph('amazon') - 0.2, db: -20},
  {f: 'lightning/sfx/rain', at: ph('amazon'), db: -22, len: ph('anyway') - ph('amazon')},
  {f: I('stamp'), at: ph('anyway') - 0.1, db: -14},
  {f: I('pop'), at: ph('almost nobody') - 0.1, db: -20},
  ...[0, 1, 2].map((i) => ({f: I('pop'), at: ph('fill it') + i * 0.3, db: -22})),
  {f: 'sleep/sfx/dizzy', at: ph('easy right') - 0.05, db: -20},
  {f: 'lightning/sfx/zap', at: ph('reach the cities') - 0.2, db: -16},
  {f: I('pages'), at: ph('desertec') - 0.1, db: -18},
  {f: 'core/sfx/snap', at: ph('fell apart'), db: -14},
  {f: I('stamp'), at: ph('fell apart') + 0.05, db: -14},
  {f: 'lightning/sfx/zap', at: ph('and in twenty'), db: -18},
  {f: I('stamp'), at: ph('four thousand') - 0.1, db: -13},
  {f: I('stamp'), at: ph('britain') + 0.5, db: -12},
  {f: I('ocean'), at: ph('dust storms') - 0.3, db: -18, len: ph('thirty percent') + 0.8 - ph('dust storms') + 0.3},
  {f: I('stamp'), at: ph('thirty percent') - 0.1, db: -12},
  {f: I('drip'), at: ph('cleaning them'), db: -16},
  {f: I('drip'), at: ph('cleaning them') + 0.5, db: -18},
  {f: I('stamp'), at: ph('in a desert') - 0.1, db: -12},
  {f: 'core/sfx/steam', at: ph('made the desert'), db: -20, len: 2.4},
  {f: I('stamp'), at: ph('one and a half') - 0.1, db: -12},
  {f: 'lightning/sfx/rain', at: S.rain, db: -22, len: ph('amazon got') - S.rain},
  {f: I('stamp'), at: ph('amazon got') - 0.05, db: -14},
  {f: I('stamp'), at: ph('zero point') - 0.1, db: -12},
  ...[0, 1, 2, 3].map((i) => ({f: I('pop'), at: ph('lots of smaller') + i * 0.1, db: -22})),
  {f: 'lightning/sfx/ding', at: ph('close to the'), db: -18},
  {f: I('stamp'), at: ph('moving it') - 0.1, db: -12},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const SaharaShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: SAND}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t >= S.end} />
      <Sequence from={Math.round(0.05 * FPS)} layout="none">
        <Audio src={staticFile('sahara/vo/vo.wav')} />
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
