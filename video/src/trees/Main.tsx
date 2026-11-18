import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Sky, Sun, Sunburst, Thermo} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Bar, Stamp} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';
import {Flames} from '../blackbox/Main';
import {Clock, Co2, Factory} from '../plastic/Main';
import {blink, camShake, ease, impact, jiggle, springIn} from '../kit/motion';

// "Why don't we just plant a trillion trees?" - Short, 1080x1920, rendered at 1080p (no cover in the video; the
// cover is the separate Still TreesCover). Hook at frame 0: trees sprout all over a worried Earth, "1 TRILLION" slams.

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const LEAF = '#5DBB63';
const LEAF_D = '#3E8E47';
const PINE = '#1F5E3A';
const BARK = '#8A5A3B';
const GRASS = '#E2C46A';
const SNOW = '#F4FAFF';
const SNOW_D = '#C9DFF0';

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

// Main character: illustrated tree (Higgsfield sprite public/tree/tree.png, 671x1000, face-free crown) with a
// code-drawn face (blinks, moods), sway from the base and a little breathing. Bottom centre (x, y), ~380 px tall at s=1.
const TREE_K = 0.38;
const Tree: React.FC<{x: number; y: number; s?: number; grow?: number; mood?: Mood; t?: number; seed?: number; face?: boolean; rot?: number}> = ({x, y, s = 1, grow = 1, mood = 'happy', t = 0, seed = 0, face = true, rot = 0}) => {
  if (grow <= 0.001) return null;
  const sway = Math.sin(t * 1.6 + seed) * 2.5;
  const br = 1 + 0.015 * Math.sin(t * 2.2 + seed);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * grow * TREE_K} ${s * grow * TREE_K * br}) rotate(${sway}) translate(-330 -995)`}>
      <image href={staticFile('tree/tree.png')} x={0} y={0} width={671} height={1000} />
      {face && <Face x={325} y={340} s={1.55} mood={mood} open={blink(t, seed)} gap={44} />}
    </g>
  );
};

// Dark conifer for the far north (bottom centre).
const Pine: React.FC<{x: number; y: number; s?: number; grow?: number}> = ({x, y, s = 1, grow = 1}) =>
  grow <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s * grow})`}>
      <rect x={-14} y={-50} width={28} height={50} fill={BARK} stroke={C.ink} strokeWidth={5} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M 0 ${-300 + i * 80} L ${90 - i * 0 + i * 18} ${-150 + i * 60} L ${-90 - i * 18} ${-150 + i * 60} Z`} fill={PINE} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      ))}
    </g>
  );

// Seedling (bottom centre).
const Seedling: React.FC<{x: number; y: number; s?: number; t?: number}> = ({x, y, s = 1, t = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 2) * 3})`}>
    <path d="M 0 0 Q -4 -50 0 -90" stroke={C.ink} strokeWidth={14} fill="none" strokeLinecap="round" />
    <path d="M 0 0 Q -4 -50 0 -90" stroke="#6BAF4A" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M 0 -80 Q -50 -120 -70 -80 Q -40 -60 0 -80 Z" fill={LEAF} stroke={C.ink} strokeWidth={5} />
    <path d="M 0 -88 Q 50 -130 72 -90 Q 40 -66 0 -88 Z" fill={LEAF_D} stroke={C.ink} strokeWidth={5} />
  </g>
);

// Main character Earth (Higgsfield sprite public/earth/earth.png + code face) with little trees sprouting around its edge; n = how many trees are up.
const TreeEarth: React.FC<{x: number; y: number; r: number; n: number; t: number; mood?: Mood; sweat?: number}> = ({x, y, r, n, t, mood = 'worried', sweat = 0}) => (
  <g>
    {Array.from({length: 26}).map((_, i) => {
      const a = (i / 26) * Math.PI * 2 + 0.1;
      const g = clamp(n - i);
      return g > 0 ? <Tree key={i} x={x + Math.cos(a) * (r - 6)} y={y + Math.sin(a) * (r - 6)} s={0.32} grow={springIn(g, 0, 1, 10)} rot={(a * 180) / Math.PI + 90} face={false} t={t} seed={i} /> : null;
    })}
    <g transform={`translate(${x} ${y}) rotate(${Math.sin(t * 0.8) * 2}) scale(${r / 398}) translate(-400 -404)`}>
      <image href={staticFile('earth/earth.png')} x={0} y={0} width={800} height={809} />
    </g>
    <Face x={x} y={y - r * 0.05} s={r / 150} mood={mood} open={blink(t, 2)} gap={44} />
    {sweat > 0 &&
      [0, 1].map((i) => {
        const u = (t * 0.9 + i * 0.5) % 1;
        return <path key={i} d="M 0 -30 Q 22 0 0 18 Q -22 0 0 -30 Z" transform={`translate(${x + r * (0.55 + i * 0.12)} ${y - r * 0.35 + u * 120}) scale(${1.4 * sweat})`} fill={C.sweat} stroke={C.ink} strokeWidth={4} opacity={1 - u} />;
      })}
  </g>
);

// Simple striped grazer (zebra-ish), bottom centre, facing left.
const Grazer: React.FC<{x: number; y: number; s?: number; mood?: Mood; t?: number; seed?: number}> = ({x, y, s = 1, mood = 'happy', t = 0, seed = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-55, -20, 25, 60].map((lx, i) => (
      <rect key={i} x={lx - 10} y={-80} width={20} height={80} rx={6} fill="#fff" stroke={C.ink} strokeWidth={5} />
    ))}
    <ellipse cx={0} cy={-110} rx={95} ry={55} fill="#fff" stroke={C.ink} strokeWidth={6} />
    {[-40, -5, 30].map((sx) => <path key={sx} d={`M ${sx} -160 Q ${sx + 12} -110 ${sx} -60`} stroke={C.ink} strokeWidth={10} fill="none" />)}
    <g transform={`rotate(${Math.sin(t * 2 + seed) * 4} -80 -140)`}>
      <ellipse cx={-120} cy={-170} rx={42} ry={50} fill="#fff" stroke={C.ink} strokeWidth={6} />
      <path d="M -110 -220 L -96 -250 L -88 -214 Z" fill="#fff" stroke={C.ink} strokeWidth={5} />
      <Face x={-124} y={-170} s={0.3} mood={mood} open={blink(t, seed + 1)} gap={30} />
    </g>
  </g>
);

// Shield (protect).
const Shield: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -150 L 130 -100 Q 130 60 0 150 Q -130 60 -130 -100 Z" fill={C.ink} transform="translate(10 10)" />
    <path d="M 0 -150 L 130 -100 Q 130 60 0 150 Q -130 60 -130 -100 Z" fill={C.teal} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -55 0 L -15 40 L 60 -45" stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Ground: React.FC<{y: number; color: string; shade?: string}> = ({y, color, shade}) => (
  <g>
    <path d={`M -400 ${y} Q 540 ${y - 40} 1480 ${y} L 1480 2400 L -400 2400 Z`} fill={color} stroke={C.ink} strokeWidth={INK_W} />
    {shade && <path d={`M -400 ${y + 120} Q 540 ${y + 80} 1480 ${y + 120} L 1480 2400 L -400 2400 Z`} fill={shade} />}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  hook: 0,
  how: ph('trees pull') - 0.05,
  solved: ph('problem solved') - 0.05,
  math: ph('the first problem') - 0.05,
  time: ph('the second problem') - 0.05,
  place: ph('the third problem') - 0.05,
  north: ph('and in the far north') - 0.05,
  fire: ph('and forests burn') - 0.05,
  fix: ph('so protect') - 0.05,
  final: ph('trees are a bonus') - 0.05,
  end: VO_END + 0.3,
};

// Separate cover (Still "TreesCover", exported as cover.jpg - not part of the video).
export const TreesCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.sky}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Sunburst t={0} cx={620} cy={1200} />
      <TreeEarth x={640} y={1230} r={300} n={26} t={0.3} mood="scared" sweat={1} />
      <Thermo x={950} y={1100} level={0.95} s={0.8} />
      <RedCircle x={640} y={1230} r={360} />
    </svg>
    <BigSci pose="shocked" x={150} y={1420} headR={110} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={530} text="1 TRILLION TREES" size={98} />
        <BigText x={540} y={730} text="WON'T SAVE US?!" size={118} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);

// HOOK (frame 0): trees sprout all over a worried Earth, "1 TRILLION" slams, it sweats, "PLANT THEM ANYWAY?"
const HookScene: React.FC<{t: number}> = ({t}) => {
  const trT = ph('trillion');
  const loseT = ph('still lose');
  const anyT = ph('plant them anyway');
  const sh = camShake(t, [[trT, 16]]);
  const n = lerp(2, 26, ease(t, 0, loseT));
  const hot = ease(t, loseT, loseT + 1.2);
  return (
    <Stage cam={{s: lerp(1.15, 1, ease(t, 0, 1.4)) * (1 + jiggle(t, trT, 0.04, 5, 6)), x: 540 + sh.x, y: 1000 + sh.y}}>
      <Layer>
        <Sky color={hot > 0.5 ? '#F2A65A' : C.sky} />
        <Sunburst t={t} cx={540} cy={1050} />
        <TreeEarth x={540} y={1060} r={280} n={n} t={t} mood={t > loseT ? 'scared' : 'worried'} sweat={hot} />
        {t > loseT && <Thermo x={920} y={1080} level={lerp(0.3, 0.95, hot)} s={0.75 * springIn(t, loseT, 0.6)} />}
        {t > trT - 0.12 && t < anyT - 0.1 && (
          <g transform={`translate(540 560) scale(${slam(t, trT - 0.12) * impact(t, trT, 0.3).sx} ${slam(t, trT - 0.12) * impact(t, trT, 0.3).sy})`}>
            <BigText x={0} y={0} text="1 TRILLION" size={130} fill={C.yellow} />
          </g>
        )}
        {t > anyT - 0.1 && <BigText x={540} y={560} text="PLANT ANYWAY?" size={92 * springIn(t, anyT - 0.1, 0.55, 9)} fill={C.yellow} />}
        <Pill x={540} y={300} text="TREES VS. CLIMATE" s={span(t, 0.15, anyT)} bg={C.green} size={56} />
      </Layer>
    </Stage>
  );
};

// Trees pull CO2 and lock it in wood. 2019 study: room for 900 million hectares (about the USA), 205 billion t carbon.
const HowScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.how;
  const lockT = ph('lock it');
  const yrT = ph('in twenty nineteen');
  const haT = ph('nine hundred million');
  const usT = ph('united states');
  const cT = ph('two hundred five');
  const forest = t > haT - 0.1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Ground y={forest ? 1010 : 1300} color="#8BC86A" shade="#76B257" />
        {!forest ? (
          <g>
            <Tree x={540} y={1310} s={2} mood="happy" t={t} seed={1} />
            {t < lockT + 0.6 &&
              Array.from({length: 7}).map((_, i) => {
                const u = clamp((t - t0 - i * 0.25) / 1.6);
                if (u <= 0) return null;
                const sx = i % 2 ? 1000 : 80;
                const sy = 420 + rnd(i) * 300;
                return <Co2 key={i} x={lerp(sx, 540, u)} y={lerp(sy, 760, u)} s={1.2 * (1 - u * 0.6)} />;
              })}
            {t > lockT && <Pill x={540} y={1180} text="CO2 LOCKED IN WOOD" s={springIn(t, lockT, 0.6)} bg={C.paper} size={44} />}
            {t > yrT - 0.1 && <Calendar x={860} y={520} s={0.55 * springIn(t, yrT - 0.1, 0.6)} label="2019" flip={0} />}
          </g>
        ) : (
          <g>
            {Array.from({length: 15}).map((_, i) => {
              const row = Math.floor(i / 5);
              const tx = 140 + (i % 5) * 200 + (row % 2) * 90 - 40;
              const ty = 1060 + row * 110;
              return <Tree key={i} x={tx} y={ty} s={0.42 + row * 0.1} grow={springIn(t, haT - 0.1 + i * 0.05, 0.6, 11)} t={t} seed={i} face={i === 7} mood="happy" />;
            })}
            {t > haT && <BigText x={540} y={560} text="900 MILLION HA" size={96 * slam(t, haT)} fill={C.yellow} />}
            {t > cT - 0.1 && <BigText x={540} y={720} text="205 BILLION T CARBON" size={64 * slam(t, cT - 0.1)} fill={C.paper} />}
          </g>
        )}
        <Pill x={540} y={300} text="TREES EAT CO2" s={span(t, t0 + 0.1, yrT - 0.1)} bg={C.green} size={58} />
        <Pill x={540} y={300} text="A 2019 STUDY SAYS..." s={span(t, yrT - 0.1, usT - 0.1)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="ABOUT THE SIZE OF THE USA" s={pop(t, usT - 0.1)} bg={C.yellow} size={46} />
      </Layer>
    </Stage>
  );
};

// Problem solved?
const SolvedScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.solved;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sunburst t={t} cx={540} cy={900} />
        <BigText x={540} y={600} text="PROBLEM" size={124 * springIn(t, t0, 0.5, 9)} fill={C.paper} />
        <BigText x={540} y={830} text="SOLVED?" size={150 * springIn(t, t0 + 0.12, 0.5, 9)} fill={C.yellow} />
      </Layer>
      <Sci t={t} x={540} y={1360} headR={46} poses={[[0, 'thumbs']]} />
    </Stage>
  );
};

// Problem 1: math. The number may be ~5x too high; we emit ~37 billion t CO2 a year; even the big number covers ~20 years.
const MathScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.math;
  const hiT = ph('too high');
  const fiveT = ph('five times');
  const burnT = ph('and we burn');
  const n37 = ph('thirtyseven billion');
  const yrsT = ph('about twenty years');
  const shrink = ease(t, fiveT, fiveT + 0.7);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        {t < burnT ? (
          <g>
            <Bar x={140} y={700} w={lerp(800, 160, shrink)} h={110} color={LEAF} label="" value="" grow={springIn(t, t0 + 0.2, 0.6)} />
            <BigText x={540} y={640} text={t < fiveT ? '205 BILLION T' : '5X LESS?'} size={84} fill={t < fiveT ? C.paper : C.yellow} s={t < fiveT ? 1 : springIn(t, fiveT, 0.5, 9)} />
            {t > hiT - 0.1 && <Stamp x={560} y={1000} text="TOO HIGH?" s={springIn(t, hiT - 0.1, 0.5, 10)} />}
          </g>
        ) : (
          <g>
            <Ground y={1300} color="#9AA5AD" />
            <Factory x={560} y={1300} s={1.0} t={t} on={1} />
            {Array.from({length: 6}).map((_, i) => {
              const u = ((t - burnT) * 0.45 + i / 6) % 1;
              return <Co2 key={i} x={230 + Math.sin(u * 7 + i) * 40} y={720 - u * 330} s={(0.6 + u * 0.6) * (1 - u * 0.2)} />;
            })}
            {t > n37 - 0.1 && t < yrsT - 0.1 && <BigText x={680} y={540} text="37 BILLION T" size={70 * slam(t, n37 - 0.1)} fill={C.yellow} />}
            {t > n37 + 0.6 && t < yrsT - 0.1 && <BigText x={680} y={640} text="CO2 A YEAR" size={62 * springIn(t, n37 + 0.6, 0.5)} fill={C.paper} />}
            {t > yrsT - 0.1 && <Calendar x={790} y={620} s={0.6 * springIn(t, yrsT - 0.1, 0.6)} label="20 YRS" flip={0} />}
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 1: THE MATH" s={span(t, t0 + 0.1, burnT)} bg={C.red} fg={C.paper} size={56} />
        <Pill x={540} y={300} text="WE BURN FUEL FAST" s={span(t, burnT, yrsT - 0.1)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="BIG NUMBER = ~20 YEARS" s={pop(t, yrsT - 0.1)} bg={C.yellow} size={48} />
      </Layer>
    </Stage>
  );
};

// Problem 2: time. A seedling takes decades to become a big tree.
const TimeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.time;
  const decT = ph('decades');
  const g = ease(t, decT, S.place, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Ground y={1300} color="#8BC86A" shade="#76B257" />
        <Clock x={250} y={600} s={1} spin={(t - t0) * (t > decT ? 4 : 0.5)} />
        {g < 0.35 ? <Seedling x={600} y={1310} s={1.4 + g * 3} t={t} /> : <Tree x={600} y={1310} s={1.2} grow={lerp(0.3, 1, (g - 0.35) / 0.65)} t={t} mood="squeeze" seed={3} />}
        {t > decT - 0.1 && <BigText x={700} y={640} text="DECADES" size={110 * slam(t, decT - 0.1)} fill={C.yellow} />}
        <Pill x={540} y={300} text="PROBLEM 2: TIME" s={span(t, t0 + 0.1, decT - 0.1)} bg={C.red} fg={C.paper} size={58} />
        <Pill x={540} y={300} text="SEEDLING TO BIG TREE" s={pop(t, decT - 0.1)} bg={C.paper} size={54} />
      </Layer>
    </Stage>
  );
};

// Problem 3: place. "Empty" land is grassland and savanna full of wildlife.
const PlaceScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.place;
  const emT = ph('empty');
  const grT = ph('grassland and savanna');
  const wlT = ph('wildlife');
  const sad = t > wlT + 0.3;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sun x={880} y={520} r={80} t={t} />
        <Ground y={1250} color={GRASS} shade="#D2AE52" />
        {[[260, 1300, 0], [700, 1340, 2]].map(([gx, gy, sd]) =>
          t > grT - 0.2 ? <Grazer key={sd} x={gx} y={gy} s={1.1 * springIn(t, grT - 0.2 + sd * 0.05, 0.6)} mood={sad ? 'worried' : 'happy'} t={t} seed={sd} /> : null,
        )}
        {t > wlT + 0.3 && <Tree x={480} y={1200} s={1.0} grow={springIn(t, wlT + 0.3, 0.6, 10)} t={t} mood="smug" seed={5} />}
        {t > emT - 0.1 && t < grT - 0.2 && <BigText x={540} y={760} text='"EMPTY"?' size={130 * springIn(t, emT - 0.1, 0.5, 9)} fill={C.paper} />}
        <Pill x={540} y={300} text="PROBLEM 3: THE PLACE" s={span(t, t0 + 0.1, grT - 0.2)} bg={C.red} fg={C.paper} size={54} />
        <Pill x={540} y={300} text="GRASSLAND + SAVANNA" s={span(t, grT - 0.2, wlT)} bg={GRASS} size={54} />
        <Pill x={540} y={300} text="FULL OF WILDLIFE" s={pop(t, wlT)} bg={C.green} size={56} />
      </Layer>
    </Stage>
  );
};

// Far north: dark trees cover bright snow, the ground soaks up more sunlight, more trees can warm the planet.
const NorthScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.north;
  const darkT = ph('dark trees');
  const soakT = ph('soaks up');
  const warmT = ph('warm the planet');
  const cover = ease(t, darkT, darkT + 1.4);
  const hot = ease(t, soakT, warmT + 0.5);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#BFE3F7" />
        <Sun x={200} y={480} r={80} t={t} hot={hot} />
        <Ground y={1180} color={SNOW} shade={SNOW_D} />
        {[0, 1, 2].map((i) => {
          const hx = 420 + i * 200;
          const reflect = cover < 0.5 + i * 0.15;
          return (
            <g key={i}>
              <Arrow x1={270 + i * 30} y1={560 + i * 20} x2={hx} y2={1150} color={C.yellow} w={14} head={34} />
              {reflect && <Arrow x1={hx + 10} y1={1150} x2={hx + 220} y2={760} color="#FFF3A0" w={12} head={30} />}
            </g>
          );
        })}
        {Array.from({length: 9}).map((_, i) => (
          <Pine key={i} x={100 + i * 110} y={1240 + (i % 2) * 40} s={0.75} grow={springIn(t, darkT + i * 0.12, 0.5, 11)} />
        ))}
        {t > soakT && <Thermo x={930} y={880} level={lerp(0.25, 0.95, hot)} s={0.7 * springIn(t, soakT, 0.5)} />}
        {t > warmT - 0.1 && <Stamp x={520} y={640} text="WARMER!" s={springIn(t, warmT - 0.1, 0.5, 10)} />}
        <Pill x={540} y={300} text="SNOW REFLECTS SUNLIGHT" s={span(t, t0 + 0.1, darkT + 0.6)} bg={C.paper} size={48} />
        <Pill x={540} y={300} text="DARK TREES SOAK IT UP" s={span(t, darkT + 0.6, warmT - 0.1)} bg={PINE} fg={C.paper} size={48} />
        <Pill x={540} y={300} text="MORE TREES, MORE HEAT" s={pop(t, warmT - 0.1)} bg={C.red} fg={C.paper} size={48} />
      </Layer>
    </Stage>
  );
};

// Forests burn: one big fire sends the carbon back into the air.
const FireScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fire;
  const fireT = ph('one big fire');
  const backT = ph('right back into');
  const burn = ease(t, t0 + 0.4, fireT + 0.8);
  const sh = camShake(t, [[fireT, 10]]);
  return (
    <Stage cam={{s: punch(t, t0), x: 540 + sh.x, y: 960 + sh.y}}>
      <Layer>
        <Sky color={burn > 0.4 ? '#F2A65A' : C.sky} />
        <Ground y={1300} color="#6E8B4E" />
        {Array.from({length: 5}).map((_, i) => (
          <g key={i}>
            <Tree x={140 + i * 200} y={1300} s={0.8} t={t} seed={i} face={i === 2} mood={burn > 0.3 ? 'scared' : 'happy'} />
            {burn > i * 0.18 && <Flames x={140 + i * 200} y={1250} t={t + i} s={0.9 * springIn(t, t0 + 0.4 + i * 0.25, 0.5)} />}
          </g>
        ))}
        {t > backT - 0.3 &&
          Array.from({length: 7}).map((_, i) => {
            const u = ((t - backT + 0.3) * 0.5 + i / 7) % 1;
            return <Co2 key={i} x={140 + i * 135 + Math.sin(u * 6 + i) * 30} y={950 - u * 520} s={0.6 + u * 0.8} />;
          })}
        <Pill x={540} y={300} text="FORESTS BURN" s={span(t, t0 + 0.1, backT - 0.3)} bg={C.red} fg={C.paper} size={60} />
        <Pill x={540} y={300} text="CARBON BACK IN THE AIR" s={pop(t, backT - 0.3)} bg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// The real fix: protect forests, right trees in right places, and burn less.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const rightT = ph('plant the right');
  const realT = ph('but the real');
  const lessT = ph('burning less');
  const off = ease(t, lessT, lessT + 0.6);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Ground y={1300} color="#8BC86A" shade="#76B257" />
        {t < realT ? (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <Tree key={i} x={170 + i * 240} y={1300} s={0.85} t={t} seed={i} face={i === 1} mood="happy" />
            ))}
            {t < rightT && <Shield x={540} y={700} s={springIn(t, t0 + 0.2, 0.6)} />}
            {t > rightT - 0.1 && [300, 780].map((sx, i) => <Seedling key={sx} x={sx} y={1360} s={1.2 * springIn(t, rightT + i * 0.15, 0.5)} t={t} />)}
          </g>
        ) : (
          <g>
            <Factory x={560} y={1300} s={1.0} t={t} on={1 - off} />
            {t > lessT - 0.05 && <BigText x={540} y={620} text="BURN LESS" size={130 * slam(t, lessT - 0.05)} fill={C.yellow} />}
          </g>
        )}
        <Pill x={540} y={300} text="PROTECT THE FORESTS WE HAVE" s={span(t, t0 + 0.1, rightT - 0.1)} bg={C.teal} fg={C.paper} size={42} />
        <Pill x={540} y={300} text="RIGHT TREE, RIGHT PLACE" s={span(t, rightT - 0.1, realT)} bg={C.green} size={50} />
        <Pill x={540} y={300} text="THE REAL FIX" s={pop(t, realT)} bg={C.yellow} size={58} />
      </Layer>
    </Stage>
  );
};

// Payoff: Trees are a bonus. Not an excuse.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const notT = ph('not an excuse');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={600} cy={860} />
        <Tree x={640} y={1260} s={1.6} t={t} mood="happy" seed={2} />
        <g transform={`translate(760 820) scale(${springIn(t, t0 + 0.3, 0.6)})`}>
          <path d="M -30 0 L -50 110 L 0 80 L 50 110 L 30 0 Z" fill={C.red} stroke={C.ink} strokeWidth={6} />
          <circle r={70} fill={C.gold} stroke={C.ink} strokeWidth={INK_W} />
          <text y={14} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill={C.ink}>
            BONUS
          </text>
        </g>
        {t > notT - 0.1 && <Stamp x={540} y={560} text="NOT AN EXCUSE" s={springIn(t, notT - 0.1, 0.5, 10)} />}
        <Pill x={540} y={300} text="TREES ARE A BONUS" s={span(t, t0 + 0.1, notT - 0.1)} bg={C.yellow} size={54} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'present'], [notT, 'point']]} />
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
  [S.how, HowScene],
  [S.solved, SolvedScene],
  [S.math, MathScene],
  [S.time, TimeScene],
  [S.place, PlaceScene],
  [S.north, NorthScene],
  [S.fire, FireScene],
  [S.fix, FixScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// All sounds reused from earlier episodes (0 new SFX credits). len cuts a bed off with a fade.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.how, S.solved, S.math, S.time, S.place, S.north, S.fire, S.fix, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: I('stamp'), at: ph('trillion') - 0.02, db: -12},
  {f: 'sun/sfx/fire', at: ph('still lose'), db: -22, len: 2.2},
  {f: I('pop'), at: ph('plant them anyway') - 0.13, db: -20},
  {f: 'plastic/sfx/chomp', at: ph('trees pull') + 0.6, db: -18},
  {f: I('pop'), at: ph('in twenty nineteen') - 0.13, db: -20},
  {f: I('stamp'), at: ph('nine hundred million'), db: -14},
  {f: I('stamp'), at: ph('two hundred five') - 0.1, db: -14},
  {f: 'lightning/sfx/ding', at: S.solved, db: -16},
  {f: I('stamp'), at: ph('too high') - 0.1, db: -13},
  {f: 'sleep/sfx/dizzy', at: ph('five times'), db: -18},
  {f: 'plastic/sfx/factory', at: ph('and we burn'), db: -14},
  {f: I('stamp'), at: ph('thirtyseven billion') - 0.1, db: -14},
  {f: 'iceberg/sfx/pages', at: ph('about twenty years') - 0.1, db: -16},
  {f: 'plastic/sfx/clock', at: ph('decades') - 0.2, db: -14},
  {f: 'plastic/sfx/clock', at: ph('decades') + 0.8, db: -16},
  {f: I('pop'), at: ph('grassland and savanna') - 0.2, db: -18},
  {f: I('bonk'), at: ph('wildlife') + 0.3, db: -18},
  {f: 'core/sfx/steam', at: ph('soaks up'), db: -20, len: 2.5},
  {f: I('stamp'), at: ph('warm the planet') - 0.1, db: -12},
  {f: 'sun/sfx/fire', at: S.fire + 0.4, db: -16, len: S.fix - S.fire - 0.4},
  {f: 'core/sfx/boom', at: ph('one big fire'), db: -18},
  {f: I('pop'), at: ph('plant the right'), db: -20},
  {f: I('stamp'), at: ph('burning less') - 0.05, db: -12},
  {f: 'lightning/sfx/ding', at: S.final + 0.3, db: -18},
  {f: I('stamp'), at: ph('not an excuse') - 0.1, db: -12},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const TreesShort: React.FC = () => {
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
      <Captions t={t} hide={t >= S.end} />
      <Sequence from={Math.round(0.05 * FPS)} layout="none">
        <Audio src={staticFile('trees/vo/vo.wav')} />
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
