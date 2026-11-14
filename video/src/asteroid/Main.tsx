import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, FONT_DISPLAY, Face, INK_W, Pill, Puffs, Sunburst} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Earth, Rocket, SpaceBg, Stamp} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just nuke a killer asteroid?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Hook in the first 2 s: a fiery smug asteroid dives at a city skyline, red alarm flash on "wiped out" (~1.0 s).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const ROCK = '#8A7F74';
const ROCK_D = '#6B6158';
const FIRE = '#FF8A2A';
const SPACE = '#1B2A4A';
const RAY_N = '#2A3D66';

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
const Space: React.FC<{t: number}> = ({t}) => <SpaceBg t={t} w={W} h={H} />;

// ------------------------------------------------------------------ props

type Mood = React.ComponentProps<typeof Face>['mood'];
// Lumpy asteroid with craters and a face (centre x, y, radius r). fire 0..1 adds an entry trail to the upper right.
export const Asteroid: React.FC<{x: number; y: number; r: number; t?: number; mood?: Mood; fire?: number; rot?: number; seed?: number; face?: boolean}> = ({x, y, r, t = 0, mood = 'smug', fire = 0, rot = 0, seed = 1, face = true}) => {
  const n = 14;
  const pts = Array.from({length: n}).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.86 + rnd(seed * 17 + i) * 0.22);
    return `${rr * Math.cos(a)} ${rr * Math.sin(a)}`;
  });
  const d = 'M ' + pts.join(' L ') + ' Z';
  return (
    <g transform={`translate(${x} ${y})`}>
      {fire > 0 && (
        <g opacity={fire}>
          <path d={`M ${-r * 0.7} ${-r * 0.5} L ${r * 2.6} ${-r * 2.6 + Math.sin(t * 20) * 10} L ${r * 0.6} ${r * 0.7} Z`} fill={FIRE} opacity={0.85} />
          <path d={`M ${-r * 0.4} ${-r * 0.3} L ${r * 1.8} ${-r * 1.9} L ${r * 0.4} ${r * 0.4} Z`} fill={C.yellow} opacity={0.9} />
        </g>
      )}
      <g transform={`rotate(${rot})`}>
        <path d={d} fill={C.ink} transform="translate(8 8)" />
        <path d={d} fill={ROCK} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        {[
          [-0.45, -0.35, 0.16],
          [0.42, 0.3, 0.2],
          [-0.2, 0.5, 0.12],
          [0.5, -0.45, 0.1],
        ].map(([cx, cy, cr], i) => (
          <circle key={i} cx={cx * r} cy={cy * r} r={cr * r} fill={ROCK_D} stroke={C.ink} strokeWidth={4} />
        ))}
      </g>
      {face && <Face x={-r * 0.05} y={-r * 0.05} s={r / 170} mood={mood} />}
    </g>
  );
};

// City skyline with faces in a few windows (bottom y, from x0 to x1).
const City: React.FC<{y: number; x0?: number; x1?: number; mood?: Mood; s?: number}> = ({y, x0 = -100, x1 = 1180, mood = 'happy', s = 1}) => {
  const bs = [
    [0, 220, 330],
    [180, 170, 470],
    [310, 200, 280],
    [470, 190, 560],
    [620, 170, 360],
    [760, 210, 440],
    [930, 180, 300],
    [1060, 200, 400],
  ];
  return (
    <g>
      {bs.map(([bx, bw, bh], i) => {
        const x = x0 + bx * ((x1 - x0) / 1280);
        const w = bw * ((x1 - x0) / 1280);
        const h = bh * s;
        return (
          <g key={i}>
            <rect x={x} y={y - h} width={w} height={h} fill={i % 2 ? '#5D6B8A' : '#47557A'} stroke={C.ink} strokeWidth={6} />
            {Array.from({length: Math.floor(h / 70)}).map((_, k) => (
              <rect key={k} x={x + w * 0.2} y={y - h + 30 + k * 70} width={w * 0.6} height={26} fill={(i + k) % 3 ? '#FFE27A' : '#2E3A55'} />
            ))}
            {i % 3 === 1 && <Face x={x + w / 2} y={y - h + 70} s={0.4} mood={mood} />}
          </g>
        );
      })}
      <rect x={-400} y={y} width={1880} height={900} fill="#3E4A5E" />
      <line x1={-400} x2={1480} y1={y} y2={y} stroke={C.ink} strokeWidth={INK_W} />
    </g>
  );
};

// DART-like spacecraft: box + two long solar panels (centre x, y), flying left->right.
const Dart: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-160} y={-70} width={110} height={30} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    <rect x={-160} y={40} width={110} height={30} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    <line x1={-105} x2={-105} y1={-40} y2={40} stroke={C.ink} strokeWidth={6} />
    <rect x={-50} y={-40} width={100} height={80} rx={10} fill={C.gold} stroke={C.ink} strokeWidth={INK_W} />
    <circle cx={60} cy={0} r={18} fill={C.chrome} stroke={C.ink} strokeWidth={5} />
  </g>
);

// Space telescope (centre x, y) with an optional scan beam to the right.
const Telescope: React.FC<{x: number; y: number; s?: number; beam?: number; t: number}> = ({x, y, s = 1, beam = 0, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {beam > 0 && <path d={`M 120 -30 L 900 ${-260 + Math.sin(t * 2) * 80} L 900 ${260 + Math.sin(t * 2) * 80} L 120 30 Z`} fill={C.yellow} opacity={0.18 * beam} />}
    <rect x={-160} y={-120} width={70} height={240} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    <rect x={-90} y={-60} width={210} height={120} rx={14} fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} />
    <ellipse cx={120} cy={0} rx={18} ry={60} fill="#2E3A55" stroke={C.ink} strokeWidth={5} />
    <Face x={10} y={0} s={0.45} mood="happy" />
  </g>
);

// Explosion flash (cartoon star burst).
const Boom: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  const pts = Array.from({length: 24}).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.55 : r;
    return `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
  });
  return (
    <g>
      <path d={'M ' + pts.join(' L ') + ' Z'} fill={FIRE} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={r * 0.42} fill={C.yellow} />
    </g>
  );
};

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: 0.3,
  why: ph('so why') - 0.05,
  movie: ph("that's how") - 0.05,
  pieces: ph('the problem is') - 0.05,
  dart: ph('so scientists') - 0.05,
  nudge: ph('a tiny push') - 0.05,
  search: ph('and time') - 0.05,
  final: ph('the hard part') - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover: "15,000 CITY KILLERS / STILL LOST?!" Also the Still "AsteroidCover".
export const AsteroidCover: React.FC<{t?: number}> = ({t = 0.3}) => (
  <AbsoluteFill style={{backgroundColor: SPACE}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={SPACE} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3200;
        const cx = 700;
        const cy = 1100;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY_N} />;
      })}
      <City y={1640} x0={420} x1={1100} mood="scared" s={0.75} />
      <Asteroid x={720} y={1100} r={230} t={t} mood="smug" fire={1} rot={10} />
      <RedCircle x={760} y={1520} r={150} />
    </svg>
    <BigSci pose="point" x={190} y={1260} headR={130} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={510} text="15,000 CITY KILLERS" size={80} />
        <BigText x={540} y={735} text="STILL LOST?!" size={134} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <AsteroidCover t={t} />;

// HOOK: your city could be wiped out by one of 15,000 asteroids nobody has found yet.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const wipeT = ph('wiped out');
  const numT = ph('fifteen thousand');
  const hidT = ph('nobody has found');
  const fall = prog(t, t0, wipeT + 0.6, easeInOutCubic);
  const ax = lerp(1150, 640, fall);
  const ay = lerp(-150, 620, fall);
  const flash = t > wipeT && t < wipeT + 0.5 ? Math.sin(((t - wipeT) / 0.5) * Math.PI * 3) > 0 : false;
  const sh = t > wipeT && t < wipeT + 0.5 ? shake(t, 14 * (1 - (t - wipeT) / 0.5)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        {t > hidT &&
          Array.from({length: 9}).map((_, i) => {
            const s = pop(t, hidT + i * 0.06);
            return s > 0 ? <Asteroid key={i} x={120 + (i % 3) * 400 + (i > 5 ? 120 : 0)} y={300 + Math.floor(i / 3) * 160} r={34 * s} seed={i + 4} face={false} /> : null;
          })}
        <City y={1300} mood={t > wipeT ? 'scared' : 'happy'} />
        <Asteroid x={ax} y={ay} r={200} t={t} mood={t > wipeT ? 'smug' : 'happy'} fire={1} rot={t * 30} />
        {flash && <rect x={-400} y={-400} width={1880} height={2800} fill={C.red} opacity={0.25} />}
        {t > numT && <BigText x={540} y={460} text="15,000" size={190 * slam(t, numT)} fill={C.yellow} />}
        <Pill x={540} y={230} text="CITY KILLERS NOBODY HAS FOUND" s={pop(t, hidT)} bg={C.paper} size={40} />
      </Layer>
    </Stage>
  );
};

// So why don't we just nuke them?
const WhyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.why;
  const nukeT = ph('nuke them');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={900} />
        <Asteroid x={700} y={820} r={210} t={t} mood={t > nukeT ? 'scared' : 'smug'} />
        {t > nukeT && <BigText x={540} y={420} text="NUKE THEM?!" size={112 * pop(t, nukeT)} fill={C.yellow} />}
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'think'], [nukeT, 'point']]} />
    </Stage>
  );
};

// The movie plan: fly up, plant a bomb, blow it to pieces.
const MovieScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.movie;
  const flyT = ph('fly up');
  const bombT = ph('plant a bomb');
  const blowT = ph('blow the rock');
  const fly = prog(t, flyT - 0.2, bombT, easeOutCubic);
  const blown = t > blowT + 0.2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        {!blown && <Asteroid x={640} y={700} r={220} t={t} mood={t > bombT ? 'worried' : 'smug'} />}
        {!blown && t > flyT - 0.2 && t < bombT + 0.6 && <Rocket x={lerp(200, 520, fly)} y={lerp(1400, 900, fly)} s={0.9} rot={30} flame={1} t={t} />}
        {!blown && t > bombT && (
          <g transform={`translate(560 860) scale(${pop(t, bombT)})`}>
            <rect x={-50} y={-40} width={100} height={70} rx={14} fill={C.red} stroke={C.ink} strokeWidth={6} />
            <text x={0} y={8} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={30} fill={C.paper}>
              TNT
            </text>
          </g>
        )}
        {t > blowT + 0.2 && t < blowT + 0.8 && <Boom x={640} y={700} r={300 * pop(t, blowT + 0.2)} />}
        {blown &&
          Array.from({length: 9}).map((_, i) => {
            const d = t - blowT - 0.2;
            const a = (i / 9) * Math.PI * 2;
            return <Asteroid key={i} x={640 + Math.cos(a) * d * 260} y={700 + Math.sin(a) * d * 260} r={60} seed={i + 9} face={i % 3 === 0} mood="happy" />;
          })}
        <Pill x={540} y={300} text="THE MOVIE PLAN" s={span(t, t0 + 0.1, blowT)} bg={C.yellow} size={62} />
        <Pill x={540} y={300} text="BOOM. PROBLEM SOLVED?" s={pop(t, blowT + 0.2)} bg={C.paper} size={52} />
      </Layer>
    </Stage>
  );
};

// The problem is the pieces: rubble piles shatter into a cloud that keeps heading for Earth.
const PiecesScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.pieces;
  const rubT = ph('many asteroids');
  const shatT = ph('shatter one');
  const cloudT = ph('you get a cloud');
  const headT = ph('keep heading');
  const split = prog(t, shatT, shatT + 0.8, easeOutCubic);
  const travel = prog(t, cloudT, cloudT + 4, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        <Earth x={220} y={1250} r={230} face={{mood: t > headT ? 'scared' : 'worried'}} rot={t * 0.05} />
        {split < 0.02 ? (
          <Asteroid x={760} y={620} r={200} t={t} mood="smug" />
        ) : (
          Array.from({length: 12}).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const ox = Math.cos(a) * 170 * split;
            const oy = Math.sin(a) * 170 * split;
            return <Asteroid key={i} x={760 + ox - travel * 380} y={620 + oy + travel * 440} r={48} seed={i + 2} face={i % 4 === 0} mood="smug" />;
          })
        )}
        <Pill x={540} y={300} text="THE PROBLEM: THE PIECES" s={span(t, t0 + 0.1, rubT)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={540} y={300} text="MANY ARE LOOSE RUBBLE" s={span(t, rubT, cloudT)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="A CLOUD OF ROCKS" s={span(t, cloudT, headT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="STILL HEADING FOR EARTH" s={pop(t, headT)} bg={C.yellow} size={52} />
      </Layer>
    </Stage>
  );
};

// DART 2022: crashed into Dimorphos at 14,000+ mph; orbit 32 minutes shorter; success needed only 73 seconds.
const DartScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.dart;
  const yrT = ph('in 2022');
  const dimT = ph('called dimorphos');
  const mphT = ph('fourteen thousand');
  const orbT = ph('its orbit');
  const minT = ph('thirty-two minutes');
  const needT = ph('nasa only');
  const secT = ph('seventy-three seconds');
  const hitT = mphT + 0.6;
  const fly = prog(t, yrT, hitT, (u) => u * u);
  const shrink = prog(t, orbT, minT + 1.0, easeOutCubic);
  const rx = lerp(330, 290, shrink);
  const ry = lerp(150, 132, shrink);
  const ang = t * 0.9;
  const mx = 540 + Math.cos(ang) * rx;
  const my = 860 + Math.sin(ang) * ry;
  const minutes = Math.round(32 * prog(t, minT - 0.2, minT + 0.8, easeOutCubic));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        <ellipse cx={540} cy={860} rx={330} ry={150} fill="none" stroke="#7F8FB3" strokeWidth={5} strokeDasharray="16 14" opacity={t > orbT ? 0.5 : 1} />
        {t > orbT && <ellipse cx={540} cy={860} rx={rx} ry={ry} fill="none" stroke={C.green} strokeWidth={6} strokeDasharray="16 14" />}
        <Asteroid x={540} y={860} r={150} seed={21} t={t} mood="neutral" />
        <Asteroid x={t < hitT ? 540 + 330 : mx} y={t < hitT ? 860 : my} r={60} seed={33} t={t} mood={t > hitT ? 'dizzy' : 'happy'} />
        {t < hitT && <Dart x={lerp(-200, 790, fly)} y={lerp(600, 860, fly)} s={0.7} rot={14} />}
        {t > hitT && t < hitT + 1.0 && <Puffs x={870} y={860} t={(t - hitT) * 2} color="#C9CED3" n={6} rise={160} />}
        {t > minT - 0.2 && <BigText x={540} y={1180} text={`-${minutes} MIN`} size={110} fill={C.green} s={pop(t, minT - 0.2)} />}
        <Pill x={540} y={300} text="SCIENTISTS PREFER A NUDGE" s={span(t, t0 + 0.1, yrT)} bg={C.yellow} size={48} />
        <Pill x={540} y={300} text="NASA DART, 2022" s={span(t, yrT, dimT)} bg={C.paper} size={60} />
        <Pill x={540} y={300} text="TARGET: DIMORPHOS" s={span(t, dimT, mphT - 0.1)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="14,000+ MPH" s={span(t, mphT - 0.1, orbT)} bg={C.red} fg={C.paper} size={64} />
        <Pill x={540} y={300} text="ORBIT: 32 MIN SHORTER" s={span(t, orbT, needT)} bg={C.green} size={54} />
        <Pill x={540} y={300} text="GOAL WAS JUST 73 SECONDS" s={pop(t, needT)} bg={C.paper} size={48} />
        {t > secT && <Stamp x={540} y={500} text="SUCCESS" s={slam(t, secT + 0.6)} size={60} color={C.green} />}
      </Layer>
    </Stage>
  );
};

// A tiny push early turns a hit into a miss. A nuclear blast is the last resort.
const NudgeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.nudge;
  const earlyT = ph('years before');
  const missT = ph('turn a hit');
  const nukeT = ph('a nuclear blast');
  const lastT = ph('last resort');
  const bend = prog(t, earlyT, missT + 0.8, easeInOutCubic);
  const go = prog(t, earlyT, missT + 1.6, (u) => u);
  // path from top right toward Earth; after the nudge it bends away
  const P = (u: number, b: number) => ({x: lerp(1000, 300, u) + b * u * u * 520, y: lerp(260, 1150, u) - b * u * u * 120});
  const now = P(go, bend);
  const path = Array.from({length: 21}).map((_, i) => P(i / 20, bend));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        <Earth x={300} y={1150} r={150} face={{mood: bend > 0.5 ? 'happy' : 'worried'}} rot={t * 0.05} />
        <path d={'M ' + path.map((p) => `${p.x} ${p.y}`).join(' L ')} stroke={bend > 0.5 ? C.green : C.red} strokeWidth={8} strokeDasharray="20 16" fill="none" />
        <Asteroid x={now.x} y={now.y} r={70} seed={5} t={t} mood={bend > 0.5 ? 'worried' : 'smug'} />
        {t > earlyT && t < earlyT + 0.6 && <Arrow x1={now.x - 160} y1={now.y + 40} x2={now.x - 70} y2={now.y + 10} color={C.yellow} w={18} head={40} />}
        <Pill x={540} y={300} text="A TINY PUSH, EARLY" s={span(t, t0 + 0.1, missT)} bg={C.yellow} size={58} />
        <Pill x={540} y={300} text="A HIT BECOMES A MISS" s={span(t, missT, nukeT)} bg={C.green} size={56} />
        {t > lastT && <Stamp x={540} y={330} text="NUKE: LAST RESORT" s={slam(t, lastT)} size={62} />}
      </Layer>
    </Stage>
  );
};

// Time is the real problem: only ~40% of 140 m+ near-Earth asteroids found; NEO Surveyor will hunt the rest.
const SearchScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.search;
  const sizeT = ph('a hundred and forty');
  const pctT = ph('about forty');
  const nasaT = ph('nasa is building');
  const neoT = ph('neo surveyor');
  const n = 10;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        {Array.from({length: n}).map((_, i) => {
          const s = pop(t, sizeT - 0.2 + i * 0.06);
          if (s <= 0) return null;
          const x = 170 + (i % 5) * 185;
          const y = 560 + Math.floor(i / 5) * 230;
          const found = i % 5 < 2;
          const lit = t > pctT;
          return (
            <g key={i}>
              <Asteroid x={x} y={y} r={60 * s} seed={i + 11} face={false} />
              {lit && !found && <circle cx={x} cy={y} r={72} fill={SPACE} opacity={0.75} />}
              {lit && !found && (
                <text x={x} y={y + 26} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={76} fill="#7F8FB3">
                  ?
                </text>
              )}
              {lit && found && <circle cx={x} cy={y} r={72} fill="none" stroke={C.green} strokeWidth={8} />}
            </g>
          );
        })}
        {t > nasaT - 0.1 && <Telescope x={260} y={1180} s={pop(t, nasaT - 0.1)} beam={t > neoT ? 1 : 0} t={t} />}
        <Pill x={540} y={300} text="TIME IS THE REAL PROBLEM" s={span(t, t0 + 0.1, sizeT - 0.2)} bg={C.red} fg={C.paper} size={48} />
        <Pill x={540} y={300} text="ASTEROIDS BIGGER THAN 140 M" s={span(t, sizeT - 0.2, pctT)} bg={C.paper} size={44} />
        <Pill x={540} y={300} text="ONLY ~40% FOUND" s={span(t, pctT, neoT)} bg={C.green} size={60} />
        <Pill x={540} y={300} text="NEO SURVEYOR: COMING" s={pop(t, neoT)} bg={C.yellow} size={54} />
      </Layer>
    </Stage>
  );
};

// Payoff: the hard part isn't hitting an asteroid - it's seeing it coming.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const seeT = ph("it's seeing");
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={560} cy={860} />
        <Asteroid x={620} y={860} r={220} t={t} mood={t > seeT ? 'scared' : 'smug'} fire={0.6} />
        {t > seeT && <circle cx={620} cy={860} r={280 * pop(t, seeT)} fill="none" stroke={C.green} strokeWidth={14} />}
        <Pill x={540} y={300} text="HITTING IT ISN'T THE HARD PART" s={span(t, t0 + 0.1, seeT)} bg={C.paper} size={42} />
        <Pill x={540} y={300} text="SEEING IT COMING IS" s={pop(t, seeT)} bg={C.yellow} size={56} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'think'], [seeT, 'point']]} />
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
  [S.why, WhyScene],
  [S.movie, MovieScene],
  [S.pieces, PiecesScene],
  [S.dart, DartScene],
  [S.nudge, NudgeScene],
  [S.search, SearchScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const A = (n: string) => `asteroid/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.why, S.movie, S.pieces, S.dart, S.nudge, S.search, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: A('roar'), at: S.hook + 0.1, db: -10},
  {f: A('alarm'), at: ph('wiped out'), db: -14},
  {f: U('boom'), at: ph('fifteen thousand'), db: -14},
  {f: U('rocket'), at: ph('fly up') - 0.2, db: -18},
  {f: A('blast'), at: ph('blow the rock') + 0.2, db: -8},
  {f: A('blast'), at: ph('shatter one'), db: -16},
  {f: U('rocket'), at: ph('in 2022'), db: -22},
  {f: A('hit'), at: ph('fourteen thousand') + 0.6, db: -9},
  {f: I('stamp'), at: ph('seventy-three seconds') + 0.6, db: -13},
  {f: I('stamp'), at: ph('last resort'), db: -12},
  {f: A('scan'), at: ph('neo surveyor'), db: -16},
  {f: A('roar'), at: S.final + 0.1, db: -16},
  ...[ph('nobody has found'), ph('nuke them'), ph('many asteroids'), ph('you get a cloud'), ph('keep heading'), ph('called dimorphos'), ph('its orbit'), ph('thirty-two minutes') - 0.2, ph('nasa only'), ph('turn a hit'), ph('a hundred and forty') - 0.2, ph('about forty'), ph("it's seeing")].map((at) => ({
    f: I('pop'),
    at: at - 0.03,
    db: -21,
  })),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const AsteroidShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: SPACE}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.hook || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('asteroid/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={c.len ? Math.max(1, Math.round(c.len * FPS)) : undefined} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
