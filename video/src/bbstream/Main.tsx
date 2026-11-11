import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, FONT_DISPLAY, Face, INK_W, Pill, PriceTag, Sea, Sky, Sunburst, textWidth} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {BigSci} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';
import {BlackBox, Plane} from '../blackbox/Main';

// "Why don't we just stream the black box live?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Cross-promotes the black box long-form (link it as the Short's "Related video").

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const NIGHT = '#24324F';
const RAY_N = '#3A5285';
const DATA = '#7CFF5B';

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

const Satellite: React.FC<{x: number; y: number; s?: number; mood?: React.ComponentProps<typeof Face>['mood']}> = ({x, y, s = 1, mood = 'happy'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g transform="rotate(-12)">
      <rect x={-200} y={-40} width={130} height={80} fill={C.teal} stroke={C.ink} strokeWidth={INK_W} />
      <rect x={70} y={-40} width={130} height={80} fill={C.teal} stroke={C.ink} strokeWidth={INK_W} />
      {[-170, -135, -100, 100, 135, 170].map((lx) => (
        <line key={lx} x1={lx} x2={lx} y1={-40} y2={40} stroke={C.ink} strokeWidth={3} opacity={0.5} />
      ))}
      <rect x={-80} y={-70} width={160} height={140} rx={20} fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} />
      <path d="M 0 70 L 0 105 M -35 125 Q 0 85 35 125" stroke={C.ink} strokeWidth={7} fill="none" />
    </g>
    <Face x={0} y={-6} s={0.62} mood={mood} />
  </g>
);

// Ground station: dish + screen (bottom centre x, y).
const Station: React.FC<{x: number; y: number; s?: number; live?: boolean; t: number}> = ({x, y, s = 1, live, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-120} y={-170} width={240} height={170} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-95} y={-145} width={190} height={110} rx={8} fill="#1E2A3F" stroke={C.ink} strokeWidth={5} />
    {live && (
      <g>
        <circle cx={-62} cy={-118} r={10} fill={C.red} opacity={Math.sin(t * 8) > 0 ? 1 : 0.35} />
        <text x={-44} y={-108} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={28} fill="#fff">
          LIVE
        </text>
        <path d={`M -80 -55 ${Array.from({length: 9}).map((_, i) => `L ${-80 + i * 20} ${-70 - 14 * Math.sin(i * 1.3 + t * 6)}`).join(' ')}`} stroke={DATA} strokeWidth={5} fill="none" />
      </g>
    )}
    <path d="M 60 -170 L 90 -250" stroke={C.ink} strokeWidth={8} />
    <path d="M 40 -240 Q 90 -330 160 -260 Z" fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
  </g>
);

// Green data dots flowing along a path of points (looping).
const DataFlow: React.FC<{pts: Array<[number, number]>; t: number; n?: number; speed?: number; color?: string}> = ({pts, t, n = 8, speed = 0.8, color = DATA}) => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const at = (u: number) => {
    let d = u * total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i]) {
        const k = d / seg[i];
        return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
      }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  };
  return (
    <g>
      <path d={'M ' + pts.map((p) => p.join(' ')).join(' L ')} stroke={C.ink} strokeWidth={4} strokeDasharray="14 14" fill="none" opacity={0.35} />
      {Array.from({length: n}).map((_, i) => {
        const [x, y] = at((((t * speed + i / n) % 1) + 1) % 1);
        return <rect key={i} x={x - 13} y={y - 13} width={26} height={26} rx={6} fill={color} stroke={C.ink} strokeWidth={4} />;
      })}
    </g>
  );
};

// Expanding ping rings.
const Ping: React.FC<{x: number; y: number; t: number; t0: number; color?: string}> = ({x, y, t, t0, color = DATA}) => {
  const d = t - t0;
  if (d < 0 || d > 0.9) return null;
  const u = d / 0.9;
  return (
    <g opacity={1 - u}>
      <circle cx={x} cy={y} r={30 + 170 * u} fill="none" stroke={C.ink} strokeWidth={12} />
      <circle cx={x} cy={y} r={30 + 170 * u} fill="none" stroke={color} strokeWidth={6} />
    </g>
  );
};

// Phone with a chat bubble (centre x, y).
const Phone: React.FC<{x: number; y: number; s?: number; text?: string}> = ({x, y, s = 1, text = 'LANDING SOON!'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70 + 8} y={-130 + 8} width={140} height={260} rx={24} fill={C.ink} />
    <rect x={-70} y={-130} width={140} height={260} rx={24} fill="#2B2B2E" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-56} y={-110} width={112} height={210} rx={10} fill="#EAF6FF" />
    <rect x={-46} y={-80} width={92} height={50} rx={14} fill={C.green} stroke={C.ink} strokeWidth={4} />
    <text x={0} y={-48} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={14} fill={C.ink}>
      {text}
    </text>
    <rect x={-46} y={-16} width={70} height={36} rx={12} fill="#fff" stroke={C.ink} strokeWidth={4} />
  </g>
);

// Cartoon car with a face, facing right (centre x, y).
const Car: React.FC<{x: number; y: number; s?: number; rot?: number; mood?: React.ComponentProps<typeof Face>['mood']; rec?: boolean; t: number}> = ({x, y, s = 1, rot = 0, mood = 'happy', rec, t}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -230 40 L -230 -40 Q -220 -70 -180 -75 L -110 -80 L -50 -150 L 90 -150 L 150 -80 L 220 -70 Q 240 -60 240 -20 L 240 40 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -30 -132 L 80 -132 L 125 -82 L -75 -82 Z" fill="#BFE4FF" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <Face x={150} y={-20} s={0.55} mood={mood} />
    {[-140, 150].map((wx) => (
      <g key={wx} transform={`translate(${wx} 45) rotate(${t * 400})`}>
        <circle r={52} fill="#2B2B2E" stroke={C.ink} strokeWidth={INK_W} />
        <circle r={20} fill={C.chrome} />
        <line x1={-20} x2={20} y1={0} y2={0} stroke={C.ink} strokeWidth={4} />
      </g>
    ))}
    {/* dash cam on the roof */}
    <rect x={-10} y={-200} width={80} height={50} rx={10} fill="#2B2B2E" stroke={C.ink} strokeWidth={5} />
    <circle cx={30} cy={-175} r={14} fill={C.chrome} stroke={C.ink} strokeWidth={4} />
    <circle cx={60} cy={-192} r={7} fill={rec ? C.red : '#555'} />
  </g>
);

// Speech bubble with dots (pilots talking) - tail at bottom left.
const Bubble: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -150 -70 Q -150 -110 -110 -110 L 110 -110 Q 150 -110 150 -70 L 150 30 Q 150 70 110 70 L -60 70 L -110 120 L -95 70 L -110 70 Q -150 70 -150 30 Z" fill="#fff" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {[-60, 0, 60].map((dx) => (
      <circle key={dx} cx={dx} cy={-20} r={16} fill={C.ink} />
    ))}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: ph('text from') - 0.05,
  fix: ph('every airliner already') - 0.05,
  money: ph('the first problem') - 0.05,
  boring: ph('the second problem') - 0.05,
  pilots: ph('and pilots') - 0.05,
  middle: ph('so aviation') - 0.05,
  box: ph('the black box stays') - 0.05,
  car: ph('streaming every') - 0.05,
  end: VO_END + 0.3,
};

const Headline: React.FC<{l1: string; l2: string; max1?: number; max2?: number}> = ({l1, l2, max1 = 120, max2 = 230}) => {
  const fit = (s: string, max: number, room: number) => Math.min(max, room / (textWidth(s, 1, 900) + 0.2));
  const s1 = fit(l1, max1, 950);
  const s2 = fit(l2, max2, 1000);
  return (
    <g transform="rotate(-4 540 640)">
      <BigText x={540} y={540} text={l1} size={s1} />
      <BigText x={540} y={560 + s2 * 0.95} text={l2} size={s2} fill={C.yellow} />
    </g>
  );
};

// Frame 0 = MrBeast-style cover: "STREAM THE BLACK BOX? / $300M A YEAR?!" Also the Still "BBStreamCover".
export const BBStreamCover: React.FC<{t?: number}> = ({t = 0}) => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={NIGHT} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3200;
        const cx = 660;
        const cy = 1250;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY_N} />;
      })}
      <circle cx={660} cy={1250} r={400} fill={C.yellow} opacity={0.15} />
      <DataFlow pts={[[640, 1330], [930, 1070]]} t={0.3} n={3} />
      <Satellite x={940} y={1050} s={0.55} mood="worried" />
      <BlackBox x={640} y={1360} s={1.35} t={t} mood="smug" rot={-6} />
    </svg>
    <BigSci pose="nervous" x={185} y={1240} headR={135} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      {/* stacked cover headline: the layout probe's font boxes overlap by design, checked by eye */}
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={505} text="STREAM THE BLACK BOX?" size={74} />
        <BigText x={540} y={790} text="$300M" size={260} fill={C.yellow} />
        <BigText x={540} y={945} text="A YEAR?!" size={150} />
      </g>
      <Arrow x1={950} y1={930} x2={820} y2={1190} color={C.red} w={26} head={58} />
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <BBStreamCover t={t} />;

// You can text from 35,000 ft, but in 2014 a whole airliner vanished and its black boxes were never found.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const goneT = ph('vanished');
  const lostT = ph('never found');
  const whyT = ph('so why');
  const fade = 1 - prog(t, goneT, goneT + 0.7, easeInOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={1180} t={t} />
        {fade > 0.02 && (
          <g transform={`translate(560 640) scale(${fade}) translate(-560 -640)`}>
            <Plane x={560} y={640} s={0.95} t={t} mood={t > goneT ? 'scared' : 'happy'} />
          </g>
        )}
        {t < goneT && <Phone x={850} y={930} s={1.1 * pop(t, t0 + 0.1)} />}
        {t > goneT + 0.5 && <BigText x={560} y={760} text="?" size={260 * pop(t, goneT + 0.5)} fill={C.yellow} />}
        <Pill x={540} y={300} text="TEXTING AT 35,000 FT" s={span(t, t0 + 0.15, ph('2014'))} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="2014: A WHOLE PLANE VANISHED" s={span(t, ph('2014'), lostT)} bg={C.paper} size={44} />
        {t > lostT && t < whyT && <Stamp x={540} y={330} text="BOXES NEVER FOUND" s={slam(t, lostT)} size={60} />}
        {t > whyT && <BigText x={540} y={360} text="WHY NOT STREAM IT?" size={74 * pop(t, whyT)} fill={C.yellow} />}
      </Layer>
    </Stage>
  );
};

// The obvious fix: send all the flight data to the ground, live.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const numT = ph('hundreds of numbers');
  const fixT = ph("so here's the obvious");
  const sendT = ph('send all');
  const safeT = ph('already safe');
  const nums = ['35,000 FT', '480 KT', '-56°C', 'FLAPS 0', 'N1 92%', 'HDG 270'];
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <rect x={-400} y={1250} width={1880} height={900} fill="#8CCB6B" />
        <line x1={-400} x2={1480} y1={1250} y2={1250} stroke={C.ink} strokeWidth={INK_W} />
        <Plane x={430} y={560} s={0.8} t={t} mood="happy" />
        {t > numT - 0.2 &&
          t < sendT &&
          nums.map((n, i) => {
            const s = pop(t, numT - 0.2 + i * 0.12);
            const x = 220 + (i % 3) * 300;
            const y = 800 + Math.floor(i / 3) * 110 - (t - numT) * 18;
            return s > 0 ? (
              <g key={n} transform={`translate(${x} ${y}) scale(${s})`}>
                <rect x={-120} y={-36} width={240} height={72} rx={18} fill={C.ink} />
                <text x={0} y={14} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={36} fill={DATA}>
                  {n}
                </text>
              </g>
            ) : null;
          })}
        {t > sendT - 0.1 && <DataFlow pts={[[560, 600], [800, 1000]]} t={t} n={6} />}
        <Station x={830} y={1250} s={pop(t, sendT - 0.1)} live={t > sendT} t={t} />
        {t > safeT - 0.1 && <BlackBox x={300} y={1100} s={0.8 * pop(t, safeT - 0.1)} t={t} mood="happy" />}
        <Pill x={540} y={300} text="HUNDREDS OF NUMBERS" s={span(t, numT, fixT)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="THE OBVIOUS FIX" s={span(t, fixT, sendT)} size={62} />
        <Pill x={540} y={300} text="SEND IT ALL, LIVE" s={span(t, sendT, safeT)} bg={DATA} size={60} />
        <Pill x={540} y={300} text="DATA ALREADY SAFE" s={pop(t, safeT)} bg={C.green} size={58} />
      </Layer>
    </Stage>
  );
};

// Problem 1: money. Over oceans only satellites; 2002 estimate ~$300M a year for one big US airline.
const MoneyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.money;
  const oceanT = ph('over oceans');
  const expT = ph('satellite time');
  const estT = ph('in 2002');
  const bigT = ph('three hundred million');
  const sh = t > bigT && t < bigT + 0.4 ? shake(t, 12 * (1 - (t - bigT) / 0.4)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={1150} t={t} />
        <Plane x={260} y={900} s={0.55} t={t} mood="happy" />
        <DataFlow pts={[[300, 860], [560, 560], [930, 1040]]} t={t} n={7} speed={0.6} />
        <Satellite x={560} y={540} s={pop(t, oceanT - 0.1)} mood={t > bigT ? 'scared' : 'happy'} />
        <Station x={930} y={1150} s={0.6} live t={t} />
        {t > bigT && <PriceTag x={760} y={720} s={1.0 * pop(t, bigT)} rot={8} text="$300M" />}
        <Pill x={540} y={300} text="PROBLEM 1: MONEY" s={span(t, t0 + 0.1, oceanT)} bg={C.red} fg={C.paper} size={60} />
        <Pill x={540} y={300} text="OVER OCEANS: SATELLITES ONLY" s={span(t, oceanT, expT)} bg={C.paper} size={42} />
        <Pill x={540} y={300} text="SATELLITE TIME IS PRICEY" s={span(t, expT, estT)} bg={C.gold} size={48} />
        <Pill x={540} y={300} text="2002 INDUSTRY ESTIMATE" s={span(t, estT, bigT - 0.1)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="ONE AIRLINE: ~$300M A YEAR" s={pop(t, bigT - 0.1)} bg={C.yellow} size={46} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'think'], [bigT, 'nervous']]} tremble={t > bigT ? 1 : 0} />
    </Stage>
  );
};

// Problem 2: almost no data is ever needed. 2024: ~1 accident per 880,000 flights.
const BoringScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.boring;
  const yrT = ph('in 2024');
  const accT = ph('one accident');
  const borT = ph('millions of boring');
  const cols = 4;
  const rows = 4;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={C.paper} />
        {Array.from({length: cols * rows}).map((_, i) => {
          const s = pop(t, t0 + 0.2 + i * 0.05);
          if (s <= 0) return null;
          const x = 170 + (i % cols) * 250;
          const y = 520 + Math.floor(i / cols) * 190;
          return (
            <g key={i}>
              <Plane x={x} y={y} s={0.26 * s} t={t + i} mood={t > borT ? 'neutral' : 'happy'} />
              {t > borT + 0.2 + (i % 5) * 0.08 && (
                <text x={x + 70} y={y - 50 - ((t - borT) * 30) % 30} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill={C.teal} stroke={C.ink} strokeWidth={6} paintOrder="stroke fill">
                  z
                </text>
              )}
            </g>
          );
        })}
        <Pill x={540} y={300} text="PROBLEM 2: NOBODY NEEDS IT" s={span(t, t0 + 0.1, yrT)} bg={C.red} fg={C.paper} size={48} />
        <Pill x={540} y={300} text="2024: 1 ACCIDENT" s={span(t, accT - 0.2, borT)} bg={C.paper} size={58} />
        <Pill x={540} y={410} text="PER 880,000 FLIGHTS" s={span(t, ph('eight hundred eighty') - 0.1, borT)} bg={C.yellow} size={54} />
        <Pill x={540} y={300} text="MILLIONS OF BORING FLIGHTS" s={pop(t, borT)} bg={C.paper} size={46} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'point'], [borT, 'facepalm']]} />
    </Stage>
  );
};

// Pilots don't want cockpit talk broadcast all the time.
const PilotsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.pilots;
  const convT = ph('cockpit conversations');
  const bcT = ph('broadcast');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={880} />
        <Plane x={480} y={950} s={1.1} t={t} mood={t > bcT ? 'worried' : 'happy'} />
        {t > convT - 0.1 && <Bubble x={760} y={620} s={pop(t, convT - 0.1)} />}
        {t > bcT && <Stamp x={760} y={600} text="PRIVATE" s={slam(t, bcT)} size={64} />}
        <Pill x={540} y={300} text="PILOTS: NO THANKS" s={pop(t, t0 + 0.15)} bg={C.paper} size={60} />
      </Layer>
    </Stage>
  );
};

// The middle ground: position at least every 15 minutes; newer big jets every minute when in trouble.
const MiddleScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.middle;
  const q15T = ph('every fifteen');
  const newT = ph('and newer');
  const minT = ph('every minute');
  const fly = prog(t, t0, S.box, (u) => u);
  const px = lerp(150, 950, fly);
  const py = 760 + Math.sin(fly * 6) * 20;
  const trouble = t > minT - 0.3;
  const pings = [...[0.5, 2.6, 4.7].map((d) => ph('since 2018') + d), ...Array.from({length: 8}).map((_, i) => minT - 0.2 + i * 0.4)];
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={trouble ? '#3A2A3A' : NIGHT} />
        <Sea y={1150} t={t} color="#1F4E86" />
        {pings.map((p, i) => (
          <Ping key={i} x={px} y={py} t={t} t0={p} color={p >= minT - 0.3 ? C.red : DATA} />
        ))}
        <Plane x={px} y={py} s={0.45} t={t} mood={trouble ? 'scared' : 'happy'} rot={trouble ? Math.sin(t * 9) * 4 : 0} />
        <Pill x={540} y={300} text="THE MIDDLE GROUND" s={span(t, t0 + 0.1, q15T - 0.2)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="SINCE 2018: EVERY 15 MIN" s={span(t, q15T - 0.2, newT)} bg={DATA} size={50} />
        <Pill x={540} y={300} text="IN TROUBLE: EVERY MINUTE" s={pop(t, minT - 0.2)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={540} y={410} text="NEWER BIG JETS" s={pop(t, newT)} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// The black box stays: it still works when every signal is gone.
const BoxScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.box;
  const sigT = ph('every signal');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={880} />
        <BlackBox x={540} y={900} s={1.7 * pop(t, t0 + 0.05)} t={t} mood="smug" />
        {t > sigT - 0.1 && (
          <g transform={`translate(860 600) scale(${pop(t, sigT - 0.1)})`}>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={-70 + i * 38} y={-20 - i * 28} width={26} height={40 + i * 28} rx={5} fill="#C9CED3" stroke={C.ink} strokeWidth={5} />
            ))}
            <path d="M -80 -110 L 80 40 M 80 -110 L -80 40" stroke={C.red} strokeWidth={16} strokeLinecap="round" />
          </g>
        )}
        <Pill x={540} y={300} text="THE BLACK BOX STAYS" s={span(t, t0 + 0.1, sigT)} bg={C.yellow} size={58} />
        <Pill x={540} y={300} text="WORKS WITH NO SIGNAL" s={pop(t, sigT)} bg={C.green} size={56} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'thumbs']]} />
    </Stage>
  );
};

// Payoff: filming every car trip vs starting to record when the car skids.
const CarScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.car;
  const filmT = ph('filming every');
  const startT = ph('cheaper to start');
  const skidT = ph('starts to skid');
  const skid = prog(t, skidT - 0.2, skidT + 0.5, easeOutCubic);
  const rec = t > skidT;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <rect x={-400} y={1100} width={1880} height={1000} fill="#6E7378" />
        <line x1={-400} x2={1480} y1={1100} y2={1100} stroke={C.ink} strokeWidth={INK_W} />
        {Array.from({length: 6}).map((_, i) => (
          <rect key={i} x={((i * 260 - t * 500) % 1560) + 1560 * (((i * 260 - t * 500) % 1560) < -300 ? 1 : 0) - 300} y={1150} width={140} height={16} fill={C.paper} />
        ))}
        {skid > 0 && [0, 1].map((i) => <path key={i} d={`M ${330 - 300 * skid} ${1100 + i * 14} L 330 ${1100 + i * 14}`} stroke={C.ink} strokeWidth={8} opacity={0.6} />)}
        <Car x={540} y={1010} s={1.1} rot={-12 * skid} mood={t > skidT ? 'scared' : 'happy'} rec={(t > filmT && t < startT) || rec} t={t} />
        {rec && (
          <g transform={`translate(540 640) scale(${pop(t, skidT)})`}>
            <rect x={-110} y={-44} width={220} height={88} rx={44} fill={C.ink} />
            <circle cx={-56} cy={0} r={18} fill={C.red} opacity={Math.sin(t * 10) > 0 ? 1 : 0.4} />
            <text x={18} y={18} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={52} fill="#fff">
              REC
            </text>
          </g>
        )}
        <Pill x={540} y={300} text="FILM EVERY TRIP?" s={span(t, filmT - 0.1, startT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="RECORD WHEN IT SKIDS" s={pop(t, skidT - 0.2)} bg={C.yellow} size={54} />
      </Layer>
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
  [S.money, MoneyScene],
  [S.boring, BoringScene],
  [S.pilots, PilotsScene],
  [S.middle, MiddleScene],
  [S.box, BoxScene],
  [S.car, CarScene],
  [S.end, EndScene],
];

// len (s) cuts a long bed off (with a 0.5 s fade) so it only plays while its place is on screen.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const B = (n: string) => `bbstream/sfx/${n}`;
const minT = ph('every minute');
const SFX: Cue[] = [
  ...[S.hook, S.fix, S.money, S.boring, S.pilots, S.middle, S.box, S.car, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: I('ocean'), at: S.hook, db: -36, len: S.fix - S.hook},
  {f: U('fail'), at: ph('vanished') + 0.1, db: -18},
  {f: I('stamp'), at: ph('never found'), db: -12},
  {f: B('data'), at: ph('hundreds of numbers') - 0.2, db: -20},
  {f: B('data'), at: ph('send all'), db: -18},
  {f: B('data'), at: ph('over oceans'), db: -22},
  {f: B('cash'), at: ph('three hundred million'), db: -12},
  {f: I('stamp'), at: ph('broadcast'), db: -12},
  ...[0.5, 2.6, 4.7].map((d) => ({f: B('ping'), at: ph('since 2018') + d, db: -18})),
  ...Array.from({length: 8}).map((_, i) => ({f: B('ping'), at: minT - 0.2 + i * 0.4, db: -20})),
  {f: B('rec'), at: ph('filming every'), db: -16},
  {f: B('skid'), at: ph('starts to skid') - 0.2, db: -12},
  {f: B('rec'), at: ph('starts to skid'), db: -14},
  ...[ph('2014'), ph('hundreds of numbers'), ph("so here's the obvious"), ph('already safe'), ph('in 2002'), ph('one accident') - 0.2, ph('eight hundred eighty') - 0.1, ph('millions of boring'), ph('and pilots'), ph('every fifteen') - 0.2, ph('and newer'), ph('every signal')].map((at) => ({
    f: I('pop'),
    at: at - 0.03,
    db: -21,
  })),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const BBStreamShort: React.FC = () => {
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
        <Audio src={staticFile('bbstream/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={c.len ? Math.round(c.len * FPS) : undefined} layout="none">
          <Audio
            src={staticFile(`${c.f}.wav`)}
            volume={(f) => Math.pow(10, c.db / 20) * (c.len ? clamp((c.len * FPS - f) / (0.5 * FPS)) * clamp(f / (0.3 * FPS)) : 1)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
