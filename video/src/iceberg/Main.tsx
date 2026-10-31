import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {FPS, S, END, at, endOf} from './timing';
import {Captions} from './Captions';
import {Sci, handAt} from './Sci';
import {SFX, dbAt} from './sfx';
import {
  BigText,
  Berg,
  C,
  Calendar,
  CapeTown,
  Desert,
  DimArrow,
  Drop,
  Face,
  FONT_DISPLAY,
  IceShelf,
  INK_W,
  Monitor,
  Pill,
  PriceTag,
  Puffs,
  Rope,
  Sea,
  Sky,
  Sun,
  Sunburst,
  TabBerg,
  Tap,
  Thermo,
  Tug,
} from './art';
import {clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, wobble} from './anim';

export const DURATION_FRAMES = Math.ceil(END * FPS);

// ------------------------------------------------------------------ fonts
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

// ------------------------------------------------------------------ stage helpers
const W = 1080;
const H = 1920;
const WL = 1240; // standard waterline

// Camera: (cx, cy) in scene coords is shown at the screen centre, zoomed by s.
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

// A short punch-in after every cut, so cuts feel intentional.
const punch = (t: number, t0: number) => 1 + 0.05 * (1 - easeOutCubic(clamp((t - t0) / 0.35)));

// Wooden pier (deck top at y).
const Pier: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    {Array.from({length: Math.ceil((x1 - x0) / 120)}).map((_, i) => (
      <rect key={i} x={x0 + 30 + i * 120} y={y + 20} width={26} height={260} fill="#8A5A34" stroke={C.ink} strokeWidth={6} />
    ))}
    <rect x={x0} y={y} width={x1 - x0} height={34} fill="#B07A47" stroke={C.ink} strokeWidth={INK_W} />
    <line x1={x0} x2={x1} y1={y + 12} y2={y + 12} stroke="#8A5A34" strokeWidth={4} />
  </g>
);

// Small flat ice floe for the scientist to stand on (top at y).
const Floe: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <g>
    <path d={`M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2 - 14} ${y + 46} L ${x - w / 2 + 18} ${y + 50} Z`} fill={C.ice} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d={`M ${x - w / 2 + 6} ${y + 24} L ${x + w / 2 - 8} ${y + 24} L ${x + w / 2 - 14} ${y + 46} L ${x - w / 2 + 18} ${y + 50} Z`} fill={C.iceUnder} />
    <path d={`M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2 - 14} ${y + 46} L ${x - w / 2 + 18} ${y + 50} Z`} fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
  </g>
);

const Splash: React.FC<{x: number; y: number; t: number; t0: number; n?: number; size?: number}> = ({x, y, t, t0, n = 9, size = 1}) => {
  const d = t - t0;
  if (d < 0 || d > 1.1) return null;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const a = -Math.PI / 2 + (rnd(i + 3) - 0.5) * 2.2;
        const v = (420 + rnd(i + 11) * 380) * size;
        const px = x + Math.cos(a) * v * d;
        const py = y + Math.sin(a) * v * d + 0.5 * 1800 * d * d;
        if (py > y + 20) return null;
        const sc = Math.max(0, 1 - d * 0.9) * (0.7 + rnd(i) * 0.6) * size;
        return <Drop key={i} x={px} y={py} s={sc} color={C.seaL} />;
      })}
    </g>
  );
};

const Stars: React.FC<{x: number; y: number; t: number; t0: number}> = ({x, y, t, t0}) => {
  const d = t - t0;
  if (d < 0 || d > 1.4) return null;
  const sc = Math.min(1, d * 6) * (d > 1.1 ? (1.4 - d) / 0.3 : 1);
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const a = d * 5 + (i * Math.PI * 2) / 3;
        const px = x + Math.cos(a) * 110;
        const py = y + Math.sin(a) * 34;
        return (
          <path
            key={i}
            transform={`translate(${px} ${py}) scale(${sc})`}
            d="M 0 -26 L 8 -8 L 27 -8 L 12 4 L 18 24 L 0 12 L -18 24 L -12 4 L -27 -8 L -8 -8 Z"
            fill={C.yellow}
            stroke={C.ink}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

// Blink helper: eyes close briefly at the given times.
const blink = (t: number, times: number[]) => {
  for (const b of times) {
    const d = Math.abs(t - b);
    if (d < 0.08) return d / 0.08;
  }
  return 1;
};

// ------------------------------------------------------------------ scenes
// Each scene gets the absolute time t (seconds).

const CoverScene: React.FC<{t: number}> = ({t}) => {
  const bob = Math.sin(t * 3) * 6;
  // Everything sits inside the 3:4 profile-grid crop (rows 240-1680) used by Instagram and TikTok.
  const coverHand = handAt('rope', 210, 1625, 46);
  return (
    <Stage>
      <Layer>
        <Sunburst t={t} cx={540} cy={1250} />
        <BigText x={540} y={530} text="WHY DON'T WE" size={106} />
        <BigText x={540} y={652} text="JUST" size={106} />
        <BigText x={540} y={812} text="TOW AN" size={142} fill={C.yellow} />
        <BigText x={540} y={964} text="ICEBERG?" size={142} fill={C.yellow} />
        {/* the berg floats on a little round patch of sea, like the cover objects */}
        <g transform={`translate(0 ${bob})`}>
          <ellipse cx={770} cy={1505} rx={290} ry={60} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
          <Berg x={770} y={1505} s={0.95} face={{mood: 'smug', look: {x: -0.6, y: 0}, open: blink(t, [0.9])}} />
        </g>
        <Rope x1={coverHand.x - 6} y1={coverHand.y} x2={600} y2={1470 + bob} sag={36} />
      </Layer>
      <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 250, top: 300, width: 500}} />
      <Sci t={t} x={210} y={1625} headR={46} poses={[[0, 'rope']]} />
    </Stage>
  );
};

const CapeTownScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.capeTown;
  const dropForm = prog(t, at('running') - 0.3, at('water') + 0.1);
  const dropFall = clamp((t - (at('water') + 0.15)) / 0.5);
  const tapShake = t > at('running') && t < at('water') + 0.3 ? shake(t, 4) : {x: 0, y: 0};
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sun x={880} y={300} r={80} t={t} hot={1} />
        <CapeTown x={540} y={1180} s={0.95} />
        <rect x={-200} y={1180} width={1480} height={900} fill="#E7D3A0" />
        <line x1={-200} x2={1280} y1={1180} y2={1180} stroke={C.ink} strokeWidth={INK_W} />
        {/* dry cracks in the ground */}
        <path d="M 520 1300 L 570 1330 L 560 1370 L 610 1400 M 570 1330 L 630 1320" stroke="#B89A5E" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M 820 1260 L 860 1290 L 900 1280 M 860 1290 L 850 1330" stroke="#B89A5E" strokeWidth={6} fill="none" strokeLinecap="round" />
        <g transform={`translate(${tapShake.x} ${tapShake.y})`}>
          <Tap x={700} y={720} s={1.1} pipe={420} face={{mood: t > at('water') ? 'worried' : t > at('running') ? 'squeeze' : 'neutral', open: blink(t, [2.1])}} />
          {dropFall <= 0 && dropForm > 0 && <Drop x={854} y={900 + 16 * dropForm} s={0.4 + 0.6 * dropForm} />}
        </g>
        {dropFall > 0 && dropFall < 1 && <Drop x={854} y={916 + 480 * dropFall * dropFall} s={1} />}
        {/* empty glass under the tap */}
        <path d="M 790 1300 L 920 1300 L 905 1440 L 805 1440 Z" fill="#EAF7FF" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        <path d="M 806 1424 L 904 1424 L 905 1440 L 805 1440 Z" fill={C.sweat} />
        <Pill x={540} y={250} text="2018" s={pop(t, at('2018'))} size={64} />
        <Pill x={540} y={380} text="CAPE TOWN" s={pop(t, at('cape'))} bg={C.paper} />
      </Layer>
      <Sci t={t} x={250} y={1430} headR={42} poses={[[0, 'point'], [at('running'), 'nervous']]} />
    </Stage>
  );
};

const AntarcticaScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.antarctica;
  const crack = at('keeps');
  const fall = at('shedding') + 0.1;
  const fallU = clamp((t - fall) / 0.45);
  const impact = fall + 0.45;
  let by = -70;
  let rot = 0;
  let bx = 600;
  if (t >= fall) {
    by = lerp(-70, 40, fallU * fallU);
    rot = 12 * fallU;
  }
  if (t >= impact) {
    const d = t - impact;
    by = 40 * Math.exp(-4 * d) * Math.cos(9 * d);
    rot = 12 * Math.exp(-3 * d) * Math.cos(6 * d);
    bx = 600 + 230 * easeInOutCubic(clamp((t - impact - 0.3) / 1.4));
  }
  const faceOpen = pop(t, at('icebergs'), 0.4);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#8ED0F8" />
        <Sea y={WL} t={t} />
        {/* the chunk sits against the shelf edge before it breaks off */}
        <Berg x={bx} y={WL + by} s={0.95} rot={rot} noFace={faceOpen <= 0} face={{open: Math.min(1, faceOpen) * blink(t, [7.0]), mood: 'happy', look: {x: -0.4, y: 0}}} />
        <IceShelf x={360} y={WL} s={1.15} />
        {t > crack && t < fall + 0.2 && (
          <path d="M 440 1000 L 470 1060 L 452 1110 L 486 1170 L 470 1230" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={400} strokeDashoffset={400 * (1 - clamp((t - crack) / 0.3))} />
        )}
        <Splash x={620} y={WL} t={t} t0={impact} n={12} size={1.2} />
        <Pill x={540} y={300} text="ANTARCTICA" s={pop(t, at('antarctica'))} bg={C.paper} />
        <g transform={`translate(${bx} ${WL - 360})`}>
          <Pill x={0} y={0} text="FRESH WATER" s={pop(t, at('fresh'))} bg={C.sweat} />
        </g>
      </Layer>
    </Stage>
  );
};

const TowScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.tow;
  const pull = prog(t, at('tow'), S.history, (u) => u * u);
  const dx = 260 * pull;
  const rock = Math.sin(t * 3.1) * 2;
  const tugX = 760 + dx;
  const bergX = 300 + dx * 0.9;
  return (
    <Stage cam={{x: 540 + dx * 0.8, y: 1090, s: 1.22 * punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={WL} t={t} x0={-400} x1={2000} />
        <Puffs x={tugX + 40 * 0.85} y={WL - 250 * 0.85} t={t} />
        <Rope x1={tugX - 211 * 0.85} y1={WL - 75 * 0.85} x2={bergX + 150 * 0.72} y2={WL - 60} sag={30 - 25 * pull} />
        <Berg x={bergX} y={WL} s={0.72} face={{mood: t > at('tow') ? 'surprised' : 'happy', look: {x: 1, y: 0}, open: blink(t, [8.6])}} />
        <Tug x={tugX} y={WL} s={0.85} rock={rock} />
        <g transform={`translate(${540 + dx * 0.8} 560)`}>
          <Pill x={0} y={0} text="NORTH" s={pop(t, at('north'))} size={60} />
          {t > at('north') && <path d="M 0 -140 L -50 -80 L 50 -80 Z" fill={C.yellow} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" transform={`scale(${pop(t, at('north') + 0.1)})`} />}
        </g>
      </Layer>
      <Sci t={t} x={tugX - 120} y={WL - 52 + rock * 2} headR={30} poses={[[0, 'point']]} />
    </Stage>
  );
};

const HistoryScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.history;
  const u = prog(t, at('drag') - 0.5, S.ships + 0.2, (x) => x);
  const tugX = lerp(300, 560, u);
  const bergX = tugX - 360;
  const rock = Math.sin(t * 3.1) * 2;
  return (
    <Stage cam={{y: 1060, s: 1.15 * punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sun x={870} y={500} r={85} t={t} hot={1} />
        <Sea y={WL} t={t} />
        <Desert x={1060} y={WL - 20} s={0.85} />
        <Sea y={WL} t={t} x0={-400} x1={1480} />
        <Puffs x={tugX + 34} y={WL - 210} t={t} />
        <Rope x1={tugX - 211 * 0.75} y1={WL - 66} x2={bergX + 140 * 0.6} y2={WL - 50} sag={14} />
        <Berg x={bergX} y={WL} s={0.6} face={{mood: 'worried', look: {x: 1, y: -0.2}, open: blink(t, [13.2])}} />
        <Tug x={tugX} y={WL} s={0.75} rock={rock} />
        <Pill x={540} y={430} text="1970s" s={pop(t, at('1970s'))} size={66} />
        <Pill x={770} y={640} text="ARABIA" s={pop(t, at('arabia'))} bg={C.paper} />
        <Pill x={330} y={590} text="THE PLAN" s={pop(t, at('plan'))} bg={C.paper} size={46} />
      </Layer>
      <Sci t={t} x={940} y={WL - 60} headR={26} poses={[[0, 'think']]} />
    </Stage>
  );
};

const ShipsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.ships;
  const stampT = at('never') + 0.05;
  const st = clamp((t - stampT) / 0.16);
  const stampS = st < 1 ? lerp(2.4, 1, st) : 1;
  const sh = t > stampT + 0.16 && t < stampT + 0.6 ? shake(t, 10 * (1 - (t - stampT - 0.16) / 0.44)) : {x: 0, y: 0};
  const check = pop(t, at('problem'), 0.45);
  const rock = Math.sin(t * 3.1) * 2;
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={WL} t={t} />
        <Puffs x={660 + 40 * 1.2} y={WL - 250 * 1.2} t={t} />
        <Tug x={660} y={WL} s={1.2} rock={rock} face={{mood: t > at('ships') ? 'smug' : 'happy'}} />
        {check > 0 && (
          <g transform={`translate(880 640) scale(${check})`}>
            <circle r={90} fill={C.green} stroke={C.ink} strokeWidth={INK_W} />
            <path d="M -42 4 L -10 36 L 46 -30" stroke={C.ink} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {t > stampT && (
          <g transform={`translate(540 340) rotate(-7) scale(${stampS})`} opacity={st > 0 ? 1 : 0}>
            <rect x={-430} y={-80} width={860} height={160} rx={20} fill={C.paper} stroke={C.red} strokeWidth={14} />
            <text x={0} y={27} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={74} fill={C.red}>
              NEVER HAPPENED
            </text>
          </g>
        )}
      </Layer>
      <Sci t={t} x={220} y={1440} headR={40} poses={[[0, 'think'], [at('ships') - 0.05, 'thumbs']]} />
    </Stage>
  );
};

// One continuous shot: surface view, then the camera tilts down through the waterline.
const HiddenScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hidden;
  const tilt = prog(t, at('about') - 0.1, at('underwater') - 0.1);
  const reveal = prog(t, at('about'), at('underwater') + 0.2, (u) => u);
  const big = 1 + 0.18 * prog(t, at('big'), at('big') + 0.6, easeOutBack);
  const bergS = 0.9 * big;
  const camY = lerp(960, 1560, tilt);
  const camS = lerp(1, 0.86, tilt) * punch(t, t0);
  const depthGrow = prog(t, at('two', 0), at('meters', 0) + 0.2);
  const depthLabel = pop(t, at('meters', 0));
  const bergX = 620;
  const bottom = WL + 748 * bergS;
  return (
    <Stage cam={{y: camY, s: camS}}>
      <Layer>
        <Sky />
        <Sea y={WL} t={t} x0={-800} x1={1900} depth={2400} />
        {/* deep-water bands */}
        <rect x={-800} y={WL + 900} width={2700} height={2000} fill={C.seaDeep} />
        <clipPath id="reveal">
          <rect x={-800} y={WL} width={2700} height={1300 * reveal} />
        </clipPath>
        <g clipPath="url(#reveal)">
          <Berg x={bergX} y={WL} s={bergS} under={1} noFace />
        </g>
        <Berg
          x={bergX}
          y={WL}
          s={bergS}
          face={{mood: t > at('underwater') ? 'surprised' : t > at("can't") ? 'worried' : 'happy', look: {x: 0, y: tilt}, open: blink(t, [20.0])}}
        />
        <Sea y={WL} t={t} x0={-800} x1={1900} depth={0} />
        <Floe x={190} y={WL - 24} w={230} />
        {/* 90 % / 10 % labels */}
        <Pill x={bergX} y={WL + 330 * bergS} text="90%" s={pop(t, at('ninety')) * 1.25} size={70} />
        <Pill x={bergX + 330} y={WL - 150} text="10%" s={pop(t, at('iceberg', 0) + 0.15) * 0.9} bg={C.paper} size={50} />
        {/* depth arrow */}
        <DimArrow x1={bergX + 330} y1={WL + 6} x2={bergX + 330} y2={bottom} label="200 M" grow={depthGrow} labelS={depthLabel * 1.15} />
      </Layer>
      <Sci t={t} x={190} y={WL - 24} headR={28} poses={[[0, 'point'], [at('underwater'), 'shocked']]} tremble={t > at('deep') ? 1 : 0} />
    </Stage>
  );
};

const HarborScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.harbor;
  const wl = 760;
  const s = 0.72;
  const hit = at('harbor') + 0.1;
  let bx = lerp(-60, 470, prog(t, t0, hit, (u) => u * (2 - u) * 0.5 + u * u * 0.5));
  let rot = 0;
  if (t > hit) {
    const d = t - hit;
    bx = 470 - 60 * (1 - Math.exp(-6 * d));
    rot = -9 * Math.exp(-3 * d) * Math.sin(10 * d);
  }
  const back = prog(t, at('parked'), at('sea', 0), easeInOutCubic);
  bx = lerp(bx, -40, back);
  const camS = lerp(0.9, 0.62, back) * punch(t, t0);
  const camX = lerp(560, 420, back);
  const mood = t > at('parked') ? 'worried' : t > hit ? 'dizzy' : 'happy';
  // seabed: deep flat, then a slope up to the harbour on the right
  const bed = `M -1400 1500 L 350 1500 L 1000 760 L 1700 700 L 1700 2400 L -1400 2400 Z`;
  return (
    <Stage cam={{x: camX, y: lerp(980, 1040, back), s: camS}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-1400} x1={1700} depth={2000} />
        <rect x={-1400} y={wl + 600} width={3100} height={1400} fill={C.seaDeep} />
        <path d={bed} fill="#E2C27C" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        {/* harbour land + buildings */}
        <path d="M 980 680 L 1700 680 L 1700 900 L 1000 760 Z" fill="#E2C27C" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        {[1010, 1090, 1170].map((x, i) => (
          <rect key={i} x={x} y={560 - i * 30} width={70} height={130 + i * 30} fill={[C.paper, C.yellow, C.teal][i]} stroke={C.ink} strokeWidth={6} />
        ))}
        <Berg x={bx} y={wl} s={s} under={1} rot={rot} face={{mood, look: {x: t > at('parked') ? 1 : 0.6, y: 0.3}, open: blink(t, [28.9])}} />
        <Sea y={wl} t={t} x0={-1400} x1={980} depth={0} />
        <Stars x={bx} y={wl - 240} t={t} t0={hit} />
        <Pill x={980} y={430} text="HARBOR" s={pop(t, at('harbor'))} bg={C.paper} />
        <Pill x={260} y={260} text="FAR OUT AT SEA" s={pop(t, at('far')) * 1.4} />
      </Layer>
    </Stage>
  );
};

const JourneyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.journey;
  const path = prog(t, at('simulated'), S.months - 0.1, (u) => u);
  // on-screen map coordinates (inside the monitor, centred at 0,0)
  const P0 = {x: 60, y: 200};
  const P1 = {x: -60, y: -150};
  const px = lerp(P0.x, P1.x, path) + Math.sin(path * Math.PI) * 120;
  const py = lerp(P0.y, P1.y, path);
  const dots = 18;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={1100} />
        <rect x={-200} y={1400} width={1480} height={600} fill={C.yellow} />
        <line x1={-200} x2={1280} y1={1400} y2={1400} stroke={C.ink} strokeWidth={INK_W} />
        <Monitor x={600} y={760} s={0.95}>
          {/* southern tip of Africa (top) and Antarctica's coast (bottom) */}
          <path d="M -360 -262 L 40 -262 L 10 -200 L -40 -160 L -110 -150 L -170 -200 L -230 -262 Z" fill={C.mountain} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M -360 200 Q -200 170 -60 210 Q 120 180 360 205 L 360 268 L -360 268 Z" fill="#fff" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={-60} cy={-150} r={14} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          <text x={-60} y={-185} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={30} fill={C.paper}>CAPE TOWN</text>
          <text x={0} y={250} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={30} fill={C.ink}>ANTARCTICA</text>
          {Array.from({length: dots}).map((_, i) => {
            const u = i / (dots - 1);
            if (u > path) return null;
            const x = lerp(P0.x, P1.x, u) + Math.sin(u * Math.PI) * 120;
            const y = lerp(P0.y, P1.y, u);
            return <circle key={i} cx={x} cy={y} r={6} fill={C.yellow} />;
          })}
          {path > 0 && <Berg x={px} y={py} s={0.16} noFace />}
          <text x={330} y={-215} textAnchor="end" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={30} fill={C.green}>{t > at('simulated') ? 'SIMULATION' : ''}</text>
        </Monitor>
        <Pill x={600} y={270} text="2023 STUDY" s={pop(t, at('2023'))} size={58} />
        <Pill x={600} y={1300} text="WOODS HOLE" s={pop(t, at('woods'))} bg={C.paper} size={46} />
      </Layer>
      <Sci t={t} x={180} y={1420} headR={36} poses={[[0, 'think'], [at('study'), 'point']]} />
    </Stage>
  );
};

const MonthsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.months;
  const rock = Math.sin(t * 3.1) * 2;
  const flips = 8;
  const fu = clamp((t - t0) / (at('months') - t0));
  const k = Math.min(flips, Math.floor(fu * flips));
  const flipLocal = fu >= 1 ? 0 : clamp(((fu * flips) % 1 - 0.55) / 0.45);
  const dayAt = (n: number) => String(1 + Math.round((Math.min(n, flips) / flips) * 58));
  const dayLabel = fu >= 1 ? '59' : flipLocal > 0 ? dayAt(k + 1) : dayAt(k);
  const prevLabel = dayAt(k);
  const flip = flipLocal;
  const drift = (t - t0) * 60;
  const rockY = Math.sin(t * 3.1) * 4;
  const monthsHand = handAt('rope', 780 + drift - 120, WL - 46 + rockY, 26, true);
  return (
    <Stage cam={{x: 540 + drift * 0.3, y: 1020, s: 1.15 * punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={WL} t={t} x0={-400} x1={2000} />
        <Puffs x={780 + drift + 34} y={WL - 210} t={t} />
        <Rope x1={monthsHand.x + 4} y1={monthsHand.y} x2={300 + drift + 140 * 0.62} y2={WL - 50} sag={10} />
        <Berg x={300 + drift} y={WL} s={0.62} sweat={t * 0.8} face={{mood: 'worried', look: {x: 1, y: 0}, open: blink(t, [38.3])}} />
        <Tug x={780 + drift} y={WL} s={0.75} rock={rock} />
        <g transform={`translate(${drift * 0.3} 0)`}>
          <Calendar x={540} y={500} s={0.9} label={dayLabel} prev={prevLabel} flip={flip} />
          <Pill x={540} y={760} text="2 MONTHS" s={pop(t, at('two', 1))} size={58} />
        </g>
      </Layer>
      <Sci t={t} x={780 + drift - 120} y={WL - 46 + rockY} headR={26} poses={[[0, 'rope']]} flip />
    </Stage>
  );
};

const SizeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.size;
  const wl = 820;
  const small = 1 - prog(t, at('survive') + 0.1, at('all') + 0.4, (u) => u);
  const bigPop = pop(t, at('iceberg', 1) - 0.05, 0.5);
  const longGrow = prog(t, at('three', 0), at('long', 0));
  const thickGrow = prog(t, at('two', 2), at('thick'));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} depth={2000} />
        <rect x={-400} y={wl + 600} width={1900} height={1400} fill={C.seaDeep} />
        {small > 0.02 && bigPop <= 0 && (
          <g transform={`translate(540 ${wl}) scale(${small})`}>
            <TabBerg x={0} y={0} w={220} h={150} above={18} face={{mood: 'squeeze'}} />
          </g>
        )}
        {bigPop > 0 && (
          <g transform={`translate(540 ${wl}) scale(${bigPop})`}>
            <TabBerg x={0} y={0} w={640} h={430} above={46} face={{mood: 'smug', open: blink(t, [43.0])}} />
          </g>
        )}
        <Sea y={wl} t={t} depth={0} />
        <DimArrow x1={220} y1={wl + 470} x2={860} y2={wl + 470} label="300 M" grow={longGrow} labelS={pop(t, at('long', 0)) * 1.1} />
        <DimArrow x1={940} y1={wl - 46} x2={940} y2={wl + 384} label="200 M" grow={thickGrow} labelS={pop(t, at('thick')) * 1.0} />
        <Pill x={540} y={330} text="MINIMUM SIZE" s={pop(t, at('least'))} bg={C.paper} />
      </Layer>
    </Stage>
  );
};

// Arrival off Cape Town: the berg parks, the sea is warm, and it melts. One continuous shot.
const ArriveScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.arriving;
  const arrive = prog(t, t0, at('falls'), easeOutCubic);
  const melt = prog(t, at('melt'), at('days') + 0.3, (u) => u);
  const bx = lerp(-200, 560, arrive);
  const crackT = at('apart');
  const bs = 0.85 * lerp(1, 0.38, melt) * (1 - 0.04 * prog(t, crackT, crackT + 0.2));
  const thermoS = pop(t, at('sea', 1) - 0.05);
  const level = 0.15 + 0.55 * prog(t, at('fifteen'), at('celsius'));
  const calS = pop(t, at('weeks'));
  const calFlip = t > at('days') - 0.25 && t < at('days') ? (t - (at('days') - 0.25)) / 0.25 : 0;
  const calLabel = t >= at('days') ? 'DAYS' : 'WEEKS';
  const puddle = melt;
  const mood = t > at('melt') ? 'scared' : t > crackT ? 'worried' : 'happy';
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sun x={160} y={300} r={80} t={t} hot={1} />
        <CapeTown x={830} y={WL} s={0.45} />
        <Sea y={WL} t={t} />
        {/* meltwater rings around the berg */}
        {puddle > 0 && [0, 1, 2].map((i) => {
          const u = ((t * 0.7 + i / 3) % 1);
          return <ellipse key={i} cx={bx} cy={WL + 18} rx={(200 + 260 * u) * bs} ry={(26 + 30 * u) * bs} fill="none" stroke={C.paper} strokeWidth={6 * (1 - u)} opacity={1} />;
        })}
        <Berg x={bx} y={WL} s={bs} face={{mood, look: {x: t > at('sea', 1) ? 1 : 0.2, y: -0.2}, open: blink(t, [47.0, 52.2])}} sweat={t > at('fifteen') ? t * 1.1 : undefined} />
        {t > crackT && t < crackT + 2 && (
          <path d={`M ${bx + 112 * bs} ${WL - 150 * bs} L ${bx + 90 * bs} ${WL - 105 * bs} L ${bx + 128 * bs} ${WL - 70 * bs} L ${bx + 108 * bs} ${WL - 20 * bs}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        )}
        <Thermo x={920} y={760} level={level} s={thermoS * 0.9} />
        <Pill x={880} y={300} text="15-20°C" s={pop(t, at('fifteen')) * 1.05} bg={C.red} fg={C.paper} size={56} />
        {calS > 0 && <Calendar x={560} y={420} s={calS * 0.75} label={calLabel} prev="WEEKS" flip={calFlip} />}
      </Layer>
      <Sci t={t} x={170} y={1440} headR={38} poses={[[0, 'thumbs'], [crackT, 'nervous']]} tremble={t > at('melt') ? 1 : 0} />
    </Stage>
  );
};

const HugeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.huge;
  const slide = prog(t, at('iceberg', 3) - 0.6, at('about', 2) + 0.2, easeOutCubic);
  const zoom = prog(t, at('iceberg', 3) - 0.6, at('three', 1));
  const camS = lerp(1, 0.3, zoom) * punch(t, t0);
  const camY = lerp(960, 820, zoom);
  const bigS = 4.6;
  const bx = lerp(-3400, -1150, slide);
  const kmGrow = prog(t, at('three', 1), at('kilometers') + 0.3);
  return (
    <Stage cam={{x: lerp(540, -250, zoom), y: camY, s: camS}}>
      <Layer>
        <Sky />
        <CapeTown x={700} y={WL} s={0.6} />
        <Sea y={WL} t={t} x0={-4000} x1={3000} />
        <Pier x0={-40} x1={330} y={WL - 30} />
        <Berg x={bx} y={WL} s={bigS} face={{mood: 'smug', look: {x: 1, y: 0}, open: blink(t, [60.6])}} />
        <DimArrow x1={bx - 205 * bigS} y1={WL + 160} x2={bx + 205 * bigS} y2={WL + 160} label="3 KM" grow={kmGrow} labelS={pop(t, at('kilometers')) * 2.2} />
        <g transform={`translate(${lerp(540, -250, zoom)} ${lerp(330, -1100, zoom)}) scale(${(1 / camS) * punch(t, t0)})`}>
          <Pill x={0} y={0} text="1 YEAR OF WATER" s={pop(t, at('year'))} bg={C.sweat} size={52} />
        </g>
      </Layer>
      <Sci t={t} x={170} y={WL - 30} headR={32} poses={[[0, 'think'], [at('iceberg', 3), 'shocked']]} tremble={t > at('three', 1) ? 1 : 0} />
    </Stage>
  );
};

const CaptureScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.capture;
  const wl = 1180;
  const mixes = at('mixes');
  // meltwater blobs: run off the berg, spread into the sea, then shrink away (they mix in)
  const blobs = Array.from({length: 10}).map((_, i) => {
    const born = t0 + 0.2 + i * 0.32;
    const d = t - born;
    if (d < 0) return null;
    const life = 2.4;
    if (d > life) return null;
    const u = d / life;
    const x = 760 - 520 * u + Math.sin(i * 2.3) * 40;
    const y = wl + 40 + 90 * u + Math.sin(i) * 30;
    const r = (34 + 40 * Math.sin(Math.PI * Math.min(1, u * 1.3))) * (u > 0.75 ? (1 - u) / 0.25 : 1);
    return <ellipse key={i} cx={x} cy={y} rx={r * 1.5} ry={r * 0.55} fill="#BFE7FF" />;
  });
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} />
        {blobs}
        <Berg x={980} y={wl} s={1.3} sweat={t * 1.2} face={{mood: 'worried', look: {x: -1, y: 0.3}, open: blink(t, [63.0])}} />
        {/* streams running off the berg */}
        {[0, 1].map((i) => {
          const u = (t * 1.4 + i * 0.5) % 1;
          return <Drop key={i} x={760 + i * 30} y={wl - 160 + 160 * u} s={0.9} color="#BFE7FF" />;
        })}
        <Pier x0={-60} x1={330} y={wl - 36} />
        <Pill x={620} y={520} text="MELTWATER" s={pop(t, at('meltwater'))} bg="#BFE7FF" />
        <Pill x={360} y={380} text="NO PROVEN WAY" s={pop(t, at('proven'))} bg={C.paper} size={50} />
      </Layer>
      <Sci t={t} x={200} y={wl - 36} headR={36} poses={[[0, 'bucket'], [mixes + 0.3, 'nervous']]} />
    </Stage>
  );
};

const TapScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.tap;
  const tagS = pop(t, at('free') - 0.05, 0.5);
  const tagSwing = wobble(t, at('free'), 10, 1.4, 1.6);
  const tapS = pop(t, at('getting'), 0.45);
  const dropT = at('tap', 0) + 0.15;
  const dU = clamp((t - dropT) / 0.55);
  const bob = Math.sin(t * 3) * 6;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={1250} />
        <g transform={`translate(0 ${bob})`}>
          <ellipse cx={330} cy={1230} rx={270} ry={58} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
          <Berg x={330} y={1230} s={0.92} face={{mood: t > at('hard') ? 'worried' : 'smug', look: {x: 1, y: -0.5}, open: blink(t, [66.2])}} />
          {tagS > 0 && <PriceTag x={150} y={1080} s={tagS * 0.85} rot={tagSwing - 8} text="FREE" />}
        </g>
        {tapS > 0 && (
          <g transform={`translate(760 520) scale(${tapS}) translate(-760 -520)`}>
            <Tap x={700} y={520} s={0.95} face={{mood: t > at('hard') ? 'smug' : 'neutral'}} />
          </g>
        )}
        {t > dropT && dU < 1 && <Drop x={834} y={680 + 520 * dU * dU} s={0.9} />}
        {t < dropT && tapS > 0.9 && <Drop x={834} y={675} s={clamp((t - at('getting') - 0.3) / 0.6)} />}
      </Layer>
      <Sci t={t} x={790} y={1440} headR={40} poses={[[0, 'point'], [at('hard') - 0.05, 'facepalm']]} />
    </Stage>
  );
};

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.cover, CoverScene],
  [S.capeTown, CapeTownScene],
  [S.antarctica, AntarcticaScene],
  [S.tow, TowScene],
  [S.history, HistoryScene],
  [S.ships, ShipsScene],
  [S.hidden, HiddenScene],
  [S.harbor, HarborScene],
  [S.journey, JourneyScene],
  [S.months, MonthsScene],
  [S.size, SizeScene],
  [S.arriving, ArriveScene],
  [S.huge, HugeScene],
  [S.capture, CaptureScene],
  [S.tap, TapScene],
];

export const IcebergShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: C.sky}}>
      <Scene t={t} />
      <Captions t={t} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('iceberg/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
          <Audio src={staticFile(`iceberg/sfx/${c.f}.wav`)} volume={(f) => Math.pow(10, dbAt(c, c.at + f / FPS) / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// re-exported for stills scripts
export {endOf};
export {Face};
