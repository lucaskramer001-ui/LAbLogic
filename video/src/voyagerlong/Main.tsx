import React, {useRef} from 'react';
import {AbsoluteFill, Audio, Sequence, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, VO_OFFSET, ph} from './timing';
import {Sci} from '../iceberg/Sci';
import {BigText, C, FONT_DISPLAY, Face, INK_W, Sun} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd} from '../iceberg/anim';
import {Arrow, Rocket, Stamp} from '../sun/space';
import {EndCard, H, Layer, LayoutProbe, Pill, Stage, Txt, W, span, until, useFonts} from '../iceberglong/kit';
import {blink, camShake, ease, jiggle, springIn} from '../kit/motion';

// "Why Don't We Just Turn Voyager 1 Off?" - long-form story video, 1920x1080, 60 fps (~8:50).
// Lab Logic cartoon (scientist, objects with code faces) mixed with real NASA photos on Polaroid cards.
// Retention devices: a reply countdown (the scientist's "hello" needs a day to arrive and is answered at the end),
// a "close calls" heart HUD (each near-death cracks a heart, each repair heals it), chapter cards.

export const DURATION_FRAMES = Math.ceil(END * FPS);
const SPACE = '#141634';
const RAY_A = '#1D2350';
const RAY_B = '#262E63';
const BEAM = '#8FE3FF';
const PAPER = '#FFF8E7';
const GOLD = '#E8B53A';

type Mood = React.ComponentProps<typeof Face>['mood'];

// ------------------------------------------------------------------ backgrounds

// Dark-space sunburst + two drifting star layers (parallax). (cx, cy) = centre of the rays.
const Space: React.FC<{t: number; cx?: number; cy?: number; drift?: number; rays?: boolean}> = ({t, cx = 960, cy = 540, drift = 1, rays = true}) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={SPACE} />
    {rays &&
      Array.from({length: 16}).map((_, i) => {
        const a0 = (i / 16) * Math.PI * 2 + t * 0.03;
        const a1 = a0 + Math.PI / 16;
        const R = 2600;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} L ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`} fill={i % 2 ? RAY_A : RAY_B} />;
      })}
    {[0, 1].map((L) =>
      Array.from({length: 46}).map((_, i) => {
        const sp = (L ? 46 : 16) * drift;
        const x = (((rnd(i + L * 70) * 2300 - t * sp) % 2300) + 2300) % 2300 - 190;
        const y = rnd(i + 130 + L * 70) * 1080;
        const r = L ? 3 + rnd(i) * 2.5 : 1.6 + rnd(i) * 1.4;
        const tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
        return <circle key={`${L}-${i}`} cx={x} cy={y} r={r} fill="#fff" opacity={tw * (L ? 0.85 : 0.55)} />;
      }),
    )}
  </g>
);

// Warm 1970s backdrop (orange sunburst) for the Earth-side chapters.
const Retro: React.FC<{t: number; cx?: number; cy?: number}> = ({t, cx = 960, cy = 620}) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#F2A65A" />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2 + t * 0.03;
      const a1 = a0 + Math.PI / 16;
      const R = 2600;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} L ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`} fill={i % 2 ? '#F2A65A' : '#E8964A'} />;
    })}
  </g>
);

// ------------------------------------------------------------------ props

// Real photo as a Polaroid card: white frame, ink outline, hard shadow, slight tilt, slow zoom,
// credit line under the picture and an optional yellow label inside the picture (top-left).
export const Photo: React.FC<{src: string; iw: number; ih: number; x: number; y: number; w: number; t: number; t0: number; t1?: number; rot?: number; credit?: string; label?: string}> = ({
  src,
  iw,
  ih,
  x,
  y,
  w,
  t,
  t0,
  t1 = 1e9,
  rot = -3,
  credit,
  label,
}) => {
  const s = springIn(t, t0, 0.6, 10) * until(t, t1);
  if (s <= 0.001) return null;
  const h = (w * ih) / iw;
  const pad = 20;
  const bottom = credit ? 58 : pad;
  const zoom = 1 + 0.06 * clamp((t - t0) / 7);
  const id = `ph-${src}-${Math.round(x)}-${Math.round(y)}`;
  const W2 = w + pad * 2;
  const H2 = h + pad + bottom;
  const lw = label ? (label.length * 30 * 0.62 + 40) : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + jiggle(t, t0, 4, 4, 5)}) scale(${s})`}>
      <rect x={-W2 / 2 + 12} y={-H2 / 2 + 14} width={W2} height={H2} rx={10} fill={C.ink} />
      <rect x={-W2 / 2} y={-H2 / 2} width={W2} height={H2} rx={10} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
      <clipPath id={id}>
        <rect x={-w / 2} y={-H2 / 2 + pad} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <image href={staticFile(`voyagerlong/photos/${src}.jpg`)} x={-(w * zoom) / 2} y={-H2 / 2 + pad + (h - h * zoom) / 2} width={w * zoom} height={h * zoom} preserveAspectRatio="xMidYMid slice" />
      </g>
      <rect x={-w / 2} y={-H2 / 2 + pad} width={w} height={h} fill="none" stroke={C.ink} strokeWidth={4} />
      {credit && (
        <text x={0} y={H2 / 2 - 20} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={22} fill="#555">
          {credit}
        </text>
      )}
      {label && (
        <g transform={`translate(${-w / 2 + 16 + lw / 2} ${-H2 / 2 + pad + 36})`} data-label={label}>
          <rect x={-lw / 2 + 5} y={-22 + 5} width={lw} height={44} rx={22} fill={C.ink} />
          <rect x={-lw / 2} y={-22} width={lw} height={44} rx={22} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
          <text x={0} y={10} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={27} fill={C.ink}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

// Voyager (Higgsfield sprite 800x762, dish centre (425, 250)) with a code face on the dish. ~380 px wide at s=1.
export const Voyager: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood; rot?: number; power?: number; look?: {x: number; y: number}; tag?: string}> = ({x, y, s = 1, t, mood = 'happy', rot = 0, power = 1, look, tag}) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.3) * 6 * s}) rotate(${rot + Math.sin(t * 0.9) * 2})`}>
    <g transform={`scale(${s * 0.48}) translate(-425 -380)`} data-obj="voyager">
      <image href={staticFile('voyager/voyager.png')} x={0} y={0} width={800} height={762} />
      <Face x={425} y={250} s={1.25} mood={mood} open={Math.min(blink(t, 1), 0.25 + 0.75 * power)} look={look} gap={56} />
    </g>
    {tag && (
      <g transform={`translate(0 ${190 * s + 44})`}>
        <Pill x={0} y={0} text={tag} size={26} bg={PAPER} />
      </g>
    )}
  </g>
);

// Sprite with an optional code face. (x, y) = sprite centre point cx/cy (in sprite pixels) placed at x, y.
type SpriteDef = {src: string; w: number; h: number; cx: number; cy: number; r: number};
const SP: Record<string, SpriteDef> = {
  jupiter: {src: 'voyager/jupiter.png', w: 379, h: 385, cx: 190, cy: 193, r: 185},
  saturn: {src: 'voyager/saturn.png', w: 570, h: 337, cx: 285, cy: 170, r: 140},
  uranus: {src: 'voyagerlong/sprites/uranus.png', w: 557, h: 725, cx: 279, cy: 360, r: 258},
  neptune: {src: 'voyagerlong/sprites/neptune.png', w: 615, h: 620, cx: 309, cy: 307, r: 284},
  io: {src: 'voyagerlong/sprites/io.png', w: 503, h: 610, cx: 251, cy: 359, r: 228},
  titan: {src: 'voyagerlong/sprites/titan.png', w: 672, h: 667, cx: 339, cy: 336, r: 230},
  earth: {src: 'earth/earth.png', w: 800, h: 809, cx: 400, cy: 404, r: 398},
  dish: {src: 'voyagerlong/sprites/dish.png', w: 759, h: 981, cx: 385, cy: 340, r: 273},
};
// Draw a body so that its main disc has radius `r` on screen.
export const Body: React.FC<{k: keyof typeof SP; x: number; y: number; r: number; t: number; mood?: Mood; face?: boolean; rot?: number; look?: {x: number; y: number}; seed?: number}> = ({k, x, y, r, t, mood = 'happy', face = true, rot = 0, look, seed = 0}) => {
  const d = SP[k];
  const sc = r / d.r;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + Math.sin(t * 0.8 + seed) * 2})`} data-obj={k}>
      <g transform={`scale(${sc}) translate(${-d.cx} ${-d.cy})`}>
        <image href={staticFile(d.src)} x={0} y={0} width={d.w} height={d.h} />
      </g>
      {face && <Face x={k === 'saturn' ? -6 * sc : 0} y={r * 0.08} s={r / 175} mood={mood} open={blink(t, seed + 1)} look={look} gap={46} />}
    </g>
  );
};

// Chunky cartoon phone (screen text = message).
export const Phone: React.FC<{x: number; y: number; s?: number; rot?: number; text?: string; buzz?: number; t: number}> = ({x, y, s = 1, rot = 0, text = '', buzz = 0, t}) => (
  <g transform={`translate(${x + buzz * Math.sin(t * 90) * 6} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-95 + 10} y={-170 + 10} width={190} height={340} rx={32} fill={C.ink} />
    <rect x={-95} y={-170} width={190} height={340} rx={32} fill="#2B2F45" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-76} y={-140} width={152} height={262} rx={14} fill={PAPER} />
    <circle cx={0} cy={146} r={13} fill="#555B7A" />
    {text && (
      <g>
        <rect x={-66} y={-110} width={132} height={64} rx={20} fill={C.sky} stroke={C.ink} strokeWidth={4} />
        <text x={0} y={-68} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={30} fill={C.ink}>
          {text}
        </text>
      </g>
    )}
  </g>
);

// Light/radio pulse along a line; u 0..1 = progress.
const Pulse: React.FC<{x1: number; y1: number; x2: number; y2: number; u: number; color?: string; big?: number}> = ({x1, y1, x2, y2, u, color = BEAM, big = 1}) => {
  const x = lerp(x1, x2, u);
  const y = lerp(y1, y2, u);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={4} strokeDasharray="14 18" opacity={0.55} />
      {u > 0 && u < 1 && (
        <g>
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={x} cy={y} r={(18 + k * 15) * big} fill="none" stroke={color} strokeWidth={(6 - k * 1.5) * big} opacity={0.9 - k * 0.25} />
          ))}
          <circle cx={x} cy={y} r={12 * big} fill={color} stroke={C.ink} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

// Battery with a level 0..1. (x, y) = bottom centre.
const Battery: React.FC<{x: number; y: number; s?: number; level: number}> = ({x, y, s = 1, level}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} data-obj="battery">
    <rect x={-60 + 8} y={-260 + 8} width={120} height={260} rx={20} fill={C.ink} />
    <rect x={-60} y={-260} width={120} height={260} rx={20} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-25} y={-285} width={50} height={25} rx={6} fill={C.ink} />
    <rect x={-44} y={-16 - 228 * level} width={88} height={228 * level} rx={10} fill={level > 0.35 ? C.green : C.red} />
  </g>
);

// Row of instrument lights (on of total).
const Lights: React.FC<{x: number; y: number; on: number; total?: number; gap?: number}> = ({x, y, on, total = 10, gap = 62}) => (
  <g data-obj="lights">
    {Array.from({length: total}).map((_, i) => (
      <circle key={i} cx={x + (i - (total - 1) / 2) * gap} cy={y} r={22} fill={i < on ? C.yellow : '#3A3F55'} stroke={C.ink} strokeWidth={5} />
    ))}
  </g>
);

// Heart icon (ok | cracked | patched).
export const Heart: React.FC<{x: number; y: number; s?: number; state: 'ok' | 'cracked' | 'patched'; flash?: number}> = ({x, y, s = 1, state, flash = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 30 C -50 0 -46 -38 -22 -38 C -8 -38 0 -28 0 -20 C 0 -28 8 -38 22 -38 C 46 -38 50 0 0 30 Z" fill={C.ink} transform="translate(4 4)" />
    <path d="M 0 30 C -50 0 -46 -38 -22 -38 C -8 -38 0 -28 0 -20 C 0 -28 8 -38 22 -38 C 46 -38 50 0 0 30 Z" fill={state === 'cracked' ? '#7A2A2A' : C.red} stroke={C.ink} strokeWidth={5} />
    {state === 'cracked' && <path d="M -2 -22 L 6 -8 L -6 2 L 4 16" stroke={C.ink} strokeWidth={5} fill="none" strokeLinejoin="round" />}
    {state === 'patched' && (
      <g transform="rotate(-25)">
        <rect x={-24} y={-9} width={48} height={18} rx={5} fill="#F6D7A7" stroke={C.ink} strokeWidth={4} />
        <circle cx={-8} cy={0} r={2.5} fill={C.ink} />
        <circle cx={8} cy={0} r={2.5} fill={C.ink} />
      </g>
    )}
    {flash > 0 && <circle cx={0} cy={-4} r={50 + 40 * (1 - flash)} fill="none" stroke={C.yellow} strokeWidth={8 * flash} />}
  </g>
);

// Simple cartoon golden record with a face.
const Record: React.FC<{x: number; y: number; r: number; t: number; mood?: Mood; spin?: number}> = ({x, y, r, t, mood = 'happy', spin = 1}) => (
  <g transform={`translate(${x} ${y})`} data-obj="record">
    <circle cx={10} cy={12} r={r} fill={C.ink} />
    <circle cx={0} cy={0} r={r} fill={GOLD} stroke={C.ink} strokeWidth={INK_W} />
    <g transform={`rotate(${t * 40 * spin})`}>
      {[0.82, 0.68, 0.54].map((k) => (
        <circle key={k} cx={0} cy={0} r={r * k} fill="none" stroke="#C8932A" strokeWidth={5} />
      ))}
      <path d={`M ${-r * 0.7} ${-r * 0.2} A ${r * 0.75} ${r * 0.75} 0 0 1 ${-r * 0.2} ${-r * 0.7}`} stroke="#FFF2C2" strokeWidth={10} fill="none" strokeLinecap="round" />
    </g>
    <circle cx={0} cy={0} r={r * 0.3} fill="#FFE08A" stroke={C.ink} strokeWidth={5} />
    <Face x={0} y={r * 0.02} s={r / 330} mood={mood} open={blink(t, 3)} gap={40} />
  </g>
);

// Speech bubble with text (anchored at the tail tip (x, y), bubble up-left or up-right).
const Bubble: React.FC<{x: number; y: number; text: string; s?: number; size?: number; dir?: 1 | -1}> = ({x, y, text, s = 1, size = 44, dir = 1}) => {
  const w = text.length * size * 0.66 + 60;
  const h = size * 1.9;
  const bx = dir * 30;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} data-label={text}>
      <path d={`M 0 0 L ${bx} ${-40} L ${bx + dir * 60} ${-40} Z`} fill="#fff" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={dir > 0 ? bx - 20 : bx - w + 20} y={-40 - h} width={w} height={h} rx={h / 2} fill="#fff" stroke={C.ink} strokeWidth={6} />
      <text x={dir > 0 ? bx - 20 + w / 2 : bx + 20 - w / 2} y={-40 - h / 2 + size * 0.36} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

// Big on/off switch (on 0..1).
const Switch: React.FC<{x: number; y: number; s?: number; on: number}> = ({x, y, s = 1, on}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-90 + 10} y={-150 + 10} width={180} height={300} rx={26} fill={C.ink} />
    <rect x={-90} y={-150} width={180} height={300} rx={26} fill={PAPER} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-44} y={-100} width={88} height={200} rx={20} fill="#3A3F55" stroke={C.ink} strokeWidth={5} />
    <rect x={-40} y={lerp(4, -96, on)} width={80} height={92} rx={16} fill={on > 0.5 ? C.green : C.red} stroke={C.ink} strokeWidth={5} />
    <text x={0} y={-118} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={26} fill={C.ink}>
      ON
    </text>
    <text x={0} y={138} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={26} fill={C.ink}>
      OFF
    </text>
  </g>
);

const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.12, 1, st) : 1;
};

// ------------------------------------------------------------------ timeline

const T = {
  fullDay: ph('a full day'),
  in1977: ph('and in nineteen seventyseven'),
  fortynine: ph("today it's"),
  power: ph("it's running"),
  instr: ph('two working'),
  switchQ: ph("so why don't we just switch"),
  answer: ph('to answer that'),
  lining: ph('and it starts'),
  flandro: ph('in the mid'),
  rare: ph('he noticed'),
  late70s: ph('in the late'),
  stones: ph('lined up like'),
  every175: ph('that only happens'),
  why: ph('why does that'),
  throwT: ph('because a planet'),
  fly: ph('fly close behind'),
  skate: ph('like a skateboarder'),
  chain: ph('planet after planet'),
  without: ph('without that trick'),
  withIt: ph('with it less'),
  miss: ph('miss the window'),
  didnt: ph("nasa didn't miss"),
  built: ph('nasa built two'),
  car: ph('each one is about'),
  plan: ph('the official mission'),
  memory: ph('their computers'),
  photoBig: ph('a single photo'),
  solar: ph('there are no solar'),
  nuclear: ph('instead each voyager'),
  plut: ph('plutonium gives'),
  fades: ph('it never runs'),
  record: ph('and bolted'),
  sagan: ph('a committee led'),
  whale: ph("there's whale"),
  bach: ph("there's bach"),
  adol: ph('some people on'),
  answerS: ph("sagan's answer"),
  wentOn: ph('it went on'),
  someday: ph('just in case'),
  v2launch: ph('voyager 2 launched first'),
  v1launch: ph('voyager 1 followed'),
  number1: ph('it got the'),
  wrong: ph('that launch almost'),
  titan: ph('one stage of'),
  centaur: ph('so the centaur'),
  done: ph('when it was done'),
  threeHalf: ph('three and a half seconds that'),
  notLast: ph("it wasn't the last"),
  receiver: ph('in april nineteen'),
  backup: ph('the backup had'),
  narrow: ph('it could still'),
  drifts: ph('and that frequency'),
  aim: ph('so engineers learned'),
  every: ph('for every command'),
  fortyEight: ph('for fortyeight years'),
  jupiter: ph('in march nineteen'),
  storms: ph('storms bigger'),
  rings: ph('it even found'),
  surprise: ph('but the biggest'),
  morabito: ph('linda morabito'),
  checking: ph('she was checking'),
  plume: ph('it was a plume'),
  volcano: ph('a volcano erupting'),
  first: ph('the first active'),
  expected: ph('scientists had expected'),
  instead: ph('instead it was'),
  saturn: ph('next came saturn'),
  choice: ph('voyager 1 faced'),
  titanMoon: ph("saturn's biggest moon"),
  bend: ph('but flying past'),
  noUranus: ph('no uranus'),
  chose: ph('they chose titan'),
  tourEnd: ph("voyager 1's tour"),
  grand: ph('so the grand'),
  uranus: ph('it reached uranus'),
  neptune: ph('and neptune in'),
  winds: ph('at neptune it'),
  triton: ph('on its moon'),
  only: ph('it is still the only'),
  closeup: ph('every closeup'),
  y1990: ph('by nineteen ninety'),
  oneLast: ph('carl sagan pushed'),
  turnCam: ph('turn the camera'),
  feb14: ph('on february fourteenth'),
  pixel: ph('in that picture'),
  dot: ph('a pale blue dot'),
  min34: ph('thirtyfour minutes'),
  wind: ph('the sun blows'),
  bubble: ph('that wind carves'),
  edge: ph('where the bubble'),
  cross12: ph('in august twentytwelve'),
  unsure: ph('but nobody could'),
  instrDead: ph('the instrument built'),
  year: ph('it took more'),
  bell: ph('ring like a bell'),
  inIS: ph('voyager 1 was in'),
  v2_2018: ph('voyager 2 followed'),
  onlyIS: ph('they are the only working'),
  noMap: ph('out there there'),
  drawing: ph('voyager is drawing'),
  fixing: ph('fixing a spacecraft'),
  lightDay: ph('fixing one that'),
  july23: ph('in july twenty'),
  twoDeg: ph('two degrees and'),
  canberra: ph('the giant dish'),
  shout: ph('an interstellar shout'),
  took185: ph('the message took'),
  turnedHome: ph('voyager 2 turned home'),
  gibberish: ph('a few months'),
  chip: ph('one memory chip'),
  noReplace: ph('nobody can replace'),
  moved: ph('so the team moved'),
  sense: ph('in april twenty'),
  thrust: ph('and in twenty twentyfive'),
  deadSince: ph('considered dead'),
  gambled: ph('they gambled'),
  worked: ph('and it worked'),
  sameWay: ph('every one of'),
  wait2: ph('send a command'),
  switchQ2: ph("so why don't we just switch", 400),
  watts: ph('each voyager loses'),
  oneByOne: ph('to keep them'),
  lecp: ph('on voyager 1 an'),
  stillOnly: ph('but the two voyagers'),
  decades: ph('and a new probe'),
  nobodySw: ph('so nobody is'),
  keepsAlive: ph('the team keeps'),
  oneDay: ph('one day the'),
  wontStop: ph("but it won't"),
  gliese: ph('in about forty'),
  nobody: ph('nobody will be'),
  carrying: ph('but it will still'),
  hello: ph('and our hello'),
};

// Chapters (also the YouTube chapters).
export const CHAPTERS: Array<[number, string, string]> = [
  [0, 'Hello, Voyager', ''],
  [T.flandro, 'A once-in-175-years shortcut', '1965'],
  [T.built, 'Built for 5 years, with 69 KB', '1977'],
  [T.v2launch, '3.5 seconds of fuel', '1977'],
  [T.receiver, 'The radio that went deaf', '1978'],
  [T.jupiter, 'Volcanoes on Io', '1979'],
  [T.saturn, 'The Titan choice', '1980-1989'],
  [T.y1990, 'The Pale Blue Dot', '1990'],
  [T.wind, 'Leaving the bubble', '2012'],
  [T.fixing, 'Repairs from a day away', '2023-2025'],
  [T.switchQ2, 'So why not switch it off?', '2026'],
];

// Close calls: [crack time, heal time]
const CALLS: Array<[number, number]> = [
  [T.wrong + 0.3, T.threeHalf],
  [ph("voyager 2's main") + 0.2, T.aim],
  [T.july23 + 2.2, T.turnedHome],
  [T.gibberish + 1.2, T.sense + 1.5],
  [T.deadSince, T.worked],
];
const HUD_ON = T.wrong - 0.6;
const HUD_OFF = T.watts;
const REPLY_AT = T.hello + 0.9;

// ------------------------------------------------------------------ scenes

// 0:00 HOOK - scientist sends "HELLO?" to a far-away Voyager; a full day; 1977 photo; 49 years, power, instruments, switch.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const sendT = 0.6;
  const u = clamp((t - sendT) / 14) * 0.38;
  const sh = camShake(t, [[T.switchQ + 1.4, 10]]);
  const phase2 = t > T.in1977 - 0.2;
  return (
    <Stage cam={{s: lerp(1.06, 1, ease(t, 0, 1.6)), x: 960 + sh.x, y: 540 + sh.y}}>
      <Layer>
        <Space t={t} cx={1500} cy={420} />
        <Pulse x1={560} y1={420} x2={1640} y2={300} u={u} />
        {!phase2 && <Voyager x={1640} y={300} s={0.55} t={t} mood={t > T.fullDay ? 'surprised' : 'happy'} />}
        {!phase2 && t > T.fullDay - 0.1 && (
          <g>
            <BigText x={1150} y={720} text="1 FULL DAY" size={118 * slam(t, T.fullDay - 0.1)} fill={C.yellow} />
            <g transform={`translate(1150 830) scale(${pop(t, T.fullDay + 0.4)})`}>
              <Pill x={0} y={0} text="JUST FOR YOUR HELLO TO ARRIVE" size={34} bg={PAPER} />
            </g>
          </g>
        )}
        {phase2 && (
          <g>
            <Photo src="v1ksc" iw={1100} ih={1309} x={1080} y={540} w={390} t={t} t0={T.in1977 - 0.2} t1={T.fortynine} rot={4} credit="NASA / KSC, AUG 1977" label="THE REAL VOYAGER 1" />
            {t < T.fortynine && <BigText x={1560} y={300} text="1977" size={150 * slam(t, T.in1977 + 0.6)} fill={C.yellow} />}
            {t < T.fortynine && t > T.in1977 + 1.4 && <Stamp x={1560} y={720} text="ALMOST NEVER LEFT" size={44} s={springIn(t, T.in1977 + 1.4, 0.5, 10)} />}
          </g>
        )}
        {t > T.fortynine && (
          <g>
            <Voyager x={1180} y={420} s={0.95} t={t} mood={t > T.switchQ ? 'scared' : 'neutral'} power={t > T.power ? 0.6 : 1} />
            <g transform={`translate(1180 140) scale(${springIn(t, T.fortynine + 0.25, 0.5, 10) * until(t, T.switchQ + 0.3)})`}>
              <Pill x={0} y={0} text="49 YEARS OLD" size={46} />
            </g>
            {t > T.power && <Battery x={1560} y={760} s={0.85 * pop(t, T.power + 0.4)} level={lerp(1, 0.45, prog(t, T.power + 0.5, T.power + 2.2))} />}
            {t > T.power + 1.4 && (
              <g transform={`translate(1560 820) scale(${pop(t, T.power + 1.4)})`}>
                <Pill x={0} y={0} text="UNDER HALF POWER" size={28} bg={PAPER} />
              </g>
            )}
            {t > T.instr && <Lights x={1080} y={880} on={t > T.instr + 0.6 ? 2 : 10} total={10} gap={58} />}
            {t > T.instr + 0.6 && (
              <g transform={`translate(1080 960) scale(${pop(t, T.instr + 0.6)})`}>
                <Pill x={0} y={0} text="2 OF 10 INSTRUMENTS LEFT" size={30} bg={PAPER} />
              </g>
            )}
          </g>
        )}
      </Layer>
      <Sci t={t} x={330} y={1010} headR={70} poses={[[0, 'phone'], [T.fortynine, 'think'], [T.switchQ, 'shrug']]} />
      <Layer>
        {t > sendT && t < T.in1977 && <Bubble x={420} y={330} text="HELLO?" s={pop(t, sendT)} />}
        {t > T.switchQ && t < T.answer && <Switch x={700} y={600} s={0.8 * pop(t, T.switchQ)} on={1 - prog(t, T.switchQ + 1.2, T.switchQ + 1.5) * 0.5} />}
        {t > T.switchQ + 0.4 && t < T.answer && <BigText x={960} y={170} text="SWITCH IT OFF?" size={96 * slam(t, T.switchQ + 0.4)} />}
      </Layer>
    </Stage>
  );
};

// "To answer that, you need the whole story" - timeline strip 1965 -> 2026.
const StoryScene: React.FC<{t: number}> = ({t}) => {
  const ticks: Array<[string, number]> = [['1965', 240], ['1977', 560], ['1979', 800], ['1989', 1060], ['1990', 1250], ['2012', 1480], ['2026', 1700]];
  return (
    <Stage cam={{s: punchIn(t, T.answer)}}>
      <Layer>
        <Space t={t} cy={560} />
        <BigText x={960} y={300} text="THE WHOLE STORY" size={120 * slam(t, T.answer + 0.1)} fill={C.yellow} />
        <line x1={200} y1={640} x2={200 + 1520 * prog(t, T.answer + 0.4, T.lining)} y2={640} stroke={PAPER} strokeWidth={12} strokeLinecap="round" />
        {ticks.map(([lab, x], i) => (
          <g key={lab} transform={`translate(${x} 640) scale(${pop(t, T.answer + 0.5 + i * 0.35)})`}>
            <circle r={20} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
            <Txt x={0} y={80} text={lab} size={44} anchor="middle" />
          </g>
        ))}
        <Voyager x={lerp(200, 1700, prog(t, T.answer + 0.4, T.lining + 0.6))} y={500} s={0.4} t={t} />
      </Layer>
    </Stage>
  );
};
const punchIn = (t: number, t0: number) => 1 + 0.05 * (1 - easeOutCubic(clamp((t - t0) / 0.5)));

// Planet alignment: Flandro photo + orbits spinning into a line.
const AlignScene: React.FC<{t: number}> = ({t}) => {
  const cx = 1240;
  const cy = 560;
  const radii = [120, 200, 280, 350];
  const keys: Array<keyof typeof SP> = ['jupiter', 'saturn', 'uranus', 'neptune'];
  const rs = [44, 40, 32, 32];
  const align = prog(t, T.late70s, T.stones + 0.3);
  const speeds = [1.4, 0.9, 0.6, 0.45];
  const starts = [2.1, 4.0, 0.9, 5.2];
  return (
    <Stage cam={{s: punchIn(t, T.flandro)}}>
      <Layer>
        <Space t={t} cx={cx} cy={cy} />
        <Photo src="flandro" iw={1100} ih={1308} x={400} y={520} w={380} t={t} t0={T.flandro + 0.3} rot={-4} credit="NASA / JOEL KOWSKY, 2017" label="GARY FLANDRO" />
        {t > T.flandro + 1.2 && t < T.rare && (
          <g transform={`translate(400 860) scale(${pop(t, T.flandro + 1.2)})`}>
            <Pill x={0} y={0} text="JPL, MID-1960s" size={32} bg={PAPER} />
          </g>
        )}
        {radii.map((r, i) => (
          <ellipse key={r} cx={cx} cy={cy} rx={r * 1.25} ry={r * 0.78} fill="none" stroke="#5B6AA8" strokeWidth={4} strokeDasharray="10 12" />
        ))}
        <Sun x={cx} y={cy} r={52} t={t} />
        {keys.map((k, i) => {
          const free = starts[i] + t * speeds[i];
          const target = -0.35;
          const a = lerp(free, target + Math.round((free - target) / (2 * Math.PI)) * 2 * Math.PI, align);
          const x = cx + Math.cos(a) * radii[i] * 1.25;
          const y = cy + Math.sin(a) * radii[i] * 0.78;
          return <Body key={k} k={k} x={x} y={y} r={rs[i]} t={t} seed={i} face={rs[i] > 30} mood={align > 0.9 ? 'smug' : 'happy'} />;
        })}
        {t > T.stones && <Pill x={cx} y={130} text="LINED UP LIKE STEPPING STONES" size={36} s={span(t, T.stones, T.every175)} />}
        {t > T.every175 && <BigText x={cx} y={170} text="ONCE EVERY ~175 YEARS" size={78 * slam(t, T.every175)} fill={C.yellow} />}
      </Layer>
    </Stage>
  );
};

// Gravity assist: skateboard grab. Then 40 years vs under 10, miss the window.
const AssistScene: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, T.fly, T.skate + 1.6, (x) => x);
  // Jupiter moves left->right, Voyager comes from below-left, swings behind and shoots off faster.
  const jx = lerp(560, 1360, u);
  const jy = 560;
  const a = lerp(Math.PI * 0.9, Math.PI * 2.2, easeInOutCubic(u));
  const rr = 260;
  const vx = u < 1 ? jx + Math.cos(a) * rr : 1360 + (t - (T.skate + 1.6)) * 700;
  const vy = u < 1 ? jy + Math.sin(a) * rr : jy + Math.sin(Math.PI * 2.2) * rr - (t - (T.skate + 1.6)) * 220;
  const bars = t > T.without - 0.2;
  return (
    <Stage cam={{s: punchIn(t, T.why)}}>
      <Layer>
        <Space t={t} drift={2} cx={960} cy={560} />
        {!bars && (
          <g>
            {t < T.fly && <BigText x={960} y={180} text="A PLANET CAN THROW YOU" size={84 * slam(t, T.throwT)} />}
            <Body k="jupiter" x={jx} y={jy} r={170} t={t} mood={t > T.skate ? 'smug' : 'happy'} />
            {u > 0 && u < 1 && <path d={`M ${jx - 400} ${jy + 120} l -140 0 M ${jx - 380} ${jy - 60} l -180 0`} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.5} />}
            <Voyager x={vx} y={vy} s={0.42} t={t} mood={u > 0.6 ? 'surprised' : 'happy'} />
            {t > T.skate && <Pill x={960} y={960} text="LIKE GRABBING A PASSING BUS ON A SKATEBOARD" size={32} s={span(t, T.skate, T.chain)} bg={PAPER} />}
            {t > T.chain && (
              <g>
                {(['jupiter', 'saturn', 'uranus', 'neptune'] as const).map((k, i) => (
                  <Body key={k} k={k} x={300 + i * 440} y={600 + Math.sin(i) * 40} r={70} t={t} seed={i} face={false} />
                ))}
                <path d={`M 120 760 Q 300 520 520 640 Q 740 760 960 560 Q 1180 380 1400 600 Q 1620 800 1820 520`} stroke={C.yellow} strokeWidth={10} fill="none" strokeDasharray={`${2600 * prog(t, T.chain, T.chain + 2.4)} 4000`} strokeLinecap="round" />
                <BigText x={960} y={190} text="PLANET AFTER PLANET" size={80 * slam(t, T.chain + 0.2)} fill={C.yellow} />
              </g>
            )}
          </g>
        )}
        {bars && (
          <g>
            <BigText x={960} y={190} text="TRIP TO NEPTUNE" size={84 * slam(t, T.without - 0.1)} />
            <Txt x={260} y={430} text="NO SLINGSHOT" size={44} />
            <rect x={760} y={385} width={Math.max(4, 700 * prog(t, T.without + 0.4, T.without + 1.4))} height={70} rx={12} fill={C.red} stroke={C.ink} strokeWidth={6} />
            {t > T.without + 1.4 && <Txt x={760 + 700 + 24} y={437} text="~40 YRS" size={44} />}
            {t > T.withIt && (
              <g>
                <Txt x={260} y={590} text="WITH SLINGSHOTS" size={44} />
                <rect x={760} y={545} width={Math.max(4, 175 * prog(t, T.withIt + 0.2, T.withIt + 0.9))} height={70} rx={12} fill={C.green} stroke={C.ink} strokeWidth={6} />
                {t > T.withIt + 0.9 && <Txt x={760 + 175 + 24} y={597} text="< 10 YRS" size={44} />}
              </g>
            )}
            {t > T.miss && <Stamp x={960} y={810} text="MISS IT = WAIT 175 YEARS" size={50} s={springIn(t, T.miss + 0.3, 0.5, 10)} />}
            {t > T.didnt && <Stamp x={1500} y={985} text="NASA DIDN'T" size={44} rot={6} color="#1E8F4E" s={springIn(t, T.didnt, 0.5, 10)} />}
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// Built: team photo, two Voyagers, small car, plan 5 years. Then 69 KB vs a phone photo. Then power.
const BuiltScene: React.FC<{t: number}> = ({t}) => {
  const mem = t > T.memory - 0.1;
  const pw = t > T.solar - 0.1;
  return (
    <Stage cam={{s: punchIn(t, mem ? (pw ? T.solar : T.memory) : T.built)}}>
      <Layer>
        <Retro t={t} cx={1300} />
        {!mem && (
          <g>
            <Photo src="team1972" iw={1100} ih={865} x={430} y={500} w={560} t={t} t0={T.built} rot={-3} credit="NASA/JPL, 1972" label="FIRST VOYAGER SCIENCE TEAM" />
            <Voyager x={1130} y={470} s={0.85} t={t} tag="VOYAGER 1" />
            <Voyager x={1600} y={470} s={0.85} t={t + 1.3} tag="VOYAGER 2" mood="smug" />
            {t > T.car && <Pill x={1365} y={130} text="EACH ≈ THE SIZE OF A SMALL CAR" size={34} s={span(t, T.car + 0.3, T.plan)} bg={PAPER} />}
            {t > T.plan && (
              <g transform={`translate(1365 860) scale(${springIn(t, T.plan + 0.2, 0.5, 10)})`}>
                <Pill x={0} y={0} text="THE PLAN: JUPITER + SATURN" size={36} />
                <Pill x={0} y={90} text="ABOUT 5 YEARS" size={36} bg={PAPER} />
              </g>
            )}
          </g>
        )}
        {mem && !pw && (
          <g>
            <BigText x={960} y={215} text="69 KB OF MEMORY" size={110 * slam(t, T.memory + 0.3)} fill={C.yellow} />
            <Txt x={330} y={480} text="VOYAGER" size={50} />
            <rect x={680} y={430} width={Math.max(6, 30 * prog(t, T.memory + 0.6, T.memory + 1.2))} height={80} rx={10} fill={C.green} stroke={C.ink} strokeWidth={6} />
            {t > T.photoBig && (
              <g>
                <Txt x={330} y={660} text="1 PHONE PHOTO" size={50} />
                <rect x={680} y={610} width={Math.max(6, 1100 * prog(t, T.photoBig + 0.3, T.photoBig + 1.6))} height={80} rx={10} fill={C.red} stroke={C.ink} strokeWidth={6} />
                {t > T.photoBig + 1.7 && <Txt x={1300} y={820} text="BIGGER" size={60} fill={C.yellow} anchor="middle" />}
              </g>
            )}
          </g>
        )}
        {pw && (
          <g>
            <Sun x={240} y={220} r={34} t={t} />
            <g transform={`translate(520 420) scale(${pop(t, T.solar + 0.2)})`}>
              <rect x={-150} y={-90} width={300} height={180} rx={12} fill="#3B5BA8" stroke={C.ink} strokeWidth={INK_W} />
              {[0, 1, 2].map((i) => (
                <line key={i} x1={-150 + (i + 1) * 75} y1={-90} x2={-150 + (i + 1) * 75} y2={90} stroke="#9FB6F0" strokeWidth={5} />
              ))}
              <line x1={-150} y1={0} x2={150} y2={0} stroke="#9FB6F0" strokeWidth={5} />
              {t > T.solar + 1.6 && <path d="M -170 -110 L 170 110 M 170 -110 L -170 110" stroke={C.red} strokeWidth={22} strokeLinecap="round" />}
            </g>
            {t > T.solar + 1.2 && <Pill x={520} y={640} text="SUNLIGHT TOO WEAK OUT THERE" size={30} bg={PAPER} s={pop(t, T.solar + 1.2)} />}
            {t > T.nuclear && (
              <g transform={`translate(1230 560) scale(${springIn(t, T.nuclear, 0.6, 10)})`}>
                {[0, 1, 2].map((k) => {
                  const w = (t * 0.6 + k / 3) % 1;
                  return <path key={k} d={`M ${-60 + k * 60} ${-150 - w * 120} q 20 -30 0 -60`} stroke="#FF9A5A" strokeWidth={10} fill="none" opacity={(1 - w) * (t > T.plut ? 1 : 0)} strokeLinecap="round" />;
                })}
                <rect x={-90 + 10} y={-140 + 10} width={180} height={280} rx={30} fill={C.ink} />
                <rect x={-90} y={-140} width={180} height={280} rx={30} fill="#8E9BA5" stroke={C.ink} strokeWidth={INK_W} />
                {[-100, -60, -20, 20, 60, 100].map((yy) => (
                  <rect key={yy} x={-110} y={yy - 8} width={220} height={16} rx={8} fill="#6E7A84" stroke={C.ink} strokeWidth={4} />
                ))}
                <circle cx={0} cy={0} r={46} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
                <path d="M 0 0 L -20 -38 L 20 -38 Z M 0 0 L 43 4 L 22 38 Z M 0 0 L -22 38 L -43 4 Z" fill={C.ink} />
                <Pill x={0} y={200} text="NUCLEAR BATTERY" size={30} />
              </g>
            )}
            {t > T.plut + 1.2 && <Arrow x1={1360} y1={560} x2={1520} y2={560} w={18} head={40} />}
            {t > T.plut + 1.6 && <path d="M 1640 420 L 1580 580 L 1640 580 L 1600 720 L 1720 520 L 1660 520 L 1700 420 Z" fill={C.yellow} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" transform={`translate(0 0) scale(1)`} />}
            {t > T.fades && <Battery x={1650} y={1000} s={0.5 * pop(t, T.fades)} level={lerp(1, 0.4, prog(t, T.fades + 0.5, T.record))} />}
            {t > T.fades + 0.8 && <Pill x={1330} y={960} text="SLOWLY FADES" size={32} s={pop(t, T.fades + 0.8)} bg={PAPER} />}
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// Golden Record: photo, cartoon record, sounds, music, Sagan, adolescent joke.
const RecordScene: React.FC<{t: number}> = ({t}) => {
  const icons: Array<[string, number, number]> = [
    ['WHALE SONG', 1240, 230],
    ['THUNDER', 1730, 300],
    ['HEARTBEAT', 1735, 560],
  ];
  const music: Array<[string, number]> = [
    ['BACH', T.bach + 0.3],
    ['BEETHOVEN', T.bach + 0.8],
    ['JOHNNY B. GOODE', T.bach + 1.6],
  ];
  const sg = t > T.sagan - 0.1 && t < T.whale;
  return (
    <Stage cam={{s: punchIn(t, T.record)}}>
      <Layer>
        <Retro t={t} cx={1300} cy={540} />
        {t < T.sagan - 0.1 && <Photo src="record" iw={1100} ih={937} x={470} y={520} w={600} t={t} t0={T.record + 0.2} rot={-3} credit="NASA/JPL, 1977" label="THE GOLDEN RECORD" />}
        {sg && <Photo src="sagan" iw={820} ih={1100} x={420} y={520} w={380} t={t} t0={T.sagan - 0.1} rot={-4} credit="NASA AMES, 1994" label="CARL SAGAN" />}
        {t > T.whale - 0.1 && t < T.adol && <Photo src="record" iw={1100} ih={937} x={420} y={520} w={480} t={t} t0={T.whale - 0.1} rot={-3} credit="NASA/JPL, 1977" />}
        {t > T.adol - 0.1 && <Photo src="sagan" iw={820} ih={1100} x={380} y={520} w={360} t={t} t0={T.adol - 0.1} rot={-4} credit="NASA AMES, 1994" label="CARL SAGAN" />}
        <Record x={1300} y={560} r={210} t={t} mood={t > T.adol && t < T.wentOn ? 'worried' : t > T.wentOn ? 'smug' : 'happy'} />
        {sg && <Pill x={1300} y={880} text="55 LANGUAGES" size={38} s={pop(t, T.sagan + 3.2)} />}
        {t > T.whale &&
          t < T.adol &&
          icons.map(([lab, x, y], i) => (
            <g key={lab} transform={`translate(${x} ${y}) scale(${pop(t, T.whale + i * 0.7)})`}>
              <Pill x={0} y={0} text={lab} size={30} bg={PAPER} />
            </g>
          ))}
        {t > T.bach &&
          t < T.adol &&
          music.map(([lab, t0], i) => (
            <g key={lab} transform={`translate(${1300 + (i - 1) * 300} ${870 + (i % 2) * 110}) scale(${pop(t, t0)})`}>
              <Pill x={0} y={0} text={lab} size={i === 2 ? 38 : 32} bg={i === 2 ? C.yellow : PAPER} />
            </g>
          ))}
        {t > T.adol && t < T.answerS && <Stamp x={1300} y={200} text="TOO ADOLESCENT?" size={58} s={springIn(t, T.adol + 1.2, 0.5, 10)} />}
        {t > T.answerS && t < T.wentOn && <Bubble x={620} y={215} text="LOTS OF ADOLESCENTS HERE!" size={34} s={pop(t, T.answerS + 0.3)} />}
        {t > T.wentOn && <Stamp x={1300} y={200} text="ON THE RECORD" color="#1E8F4E" size={58} s={springIn(t, T.wentOn, 0.5, 10)} />}
        {t > T.someday && <Pill x={1300} y={900} text="JUST IN CASE SOMEONE FINDS IT" size={34} s={pop(t, T.someday)} />}
      </Layer>
    </Stage>
  );
};

// Launches: two real launch photos, race graphic.
const LaunchScene: React.FC<{t: number}> = ({t}) => (
  <Stage cam={{s: punchIn(t, T.v2launch)}}>
    <Layer>
      <Retro t={t} cx={960} cy={1100} />
      <Photo src="launch2" iw={1006} ih={1280} x={380} y={520} w={420} t={t} t0={T.v2launch + 0.2} rot={-4} credit="NASA, AUG 20, 1977" label="VOYAGER 2 · FIRST" />
      <Photo src="launch1" iw={889} ih={900} x={1000} y={540} w={480} t={t} t0={T.v1launch} rot={3} credit="NASA, SEPT 5, 1977" label="VOYAGER 1 · 16 DAYS LATER" />
      {t > T.number1 && (
        <g>
          <rect x={1460} y={180} width={400} height={720} rx={20} fill={SPACE} stroke={C.ink} strokeWidth={6} />
          <Txt x={1660} y={250} text="RACE TO JUPITER" size={34} anchor="middle" />
          <Voyager x={lerp(1540, 1780, prog(t, T.number1 + 0.5, T.wrong - 0.3))} y={420} s={0.24} t={t} />
          <Txt x={1480} y={500} text="V1" size={30} />
          <Voyager x={lerp(1580, 1680, prog(t, T.number1 + 0.5, T.wrong - 0.3))} y={640} s={0.24} t={t + 1} mood="worried" />
          <Txt x={1480} y={720} text="V2" size={30} />
          <Pill x={1660} y={840} text="FASTER PATH = NO. 1" size={26} s={pop(t, T.number1 + 1.2)} />
        </g>
      )}
    </Layer>
  </Stage>
);

// Launch scare: rocket, Titan stage weak, Centaur burns longer, fuel gauge -> 3.5 s.
const FuelScene: React.FC<{t: number}> = ({t}) => {
  const fuel = 1 - prog(t, T.centaur, T.done + 0.6, (u) => u) * 0.985;
  const secs = Math.max(3.5, 240 * fuel);
  const sh = camShake(t, [[T.done + 1.6, 14]]);
  return (
    <Stage cam={{s: punchIn(t, T.wrong), x: 960 + sh.x, y: 540 + sh.y}}>
      <Layer>
        <Space t={t} drift={3} cx={700} cy={900} />
        <Rocket x={700} y={560} s={2.1} rot={8} flame={t > T.titan + 1 && t < T.titan + 2 ? 0.3 : 1} t={t} />
        <Face x={700 + 10} y={430} s={0.7} mood={t > T.titan ? 'scared' : 'happy'} open={blink(t, 2)} gap={34} />
        {t > T.titan && t < T.centaur && <Pill x={700} y={150} text="TITAN STAGE UNDERPERFORMS" size={36} bg={PAPER} s={pop(t, T.titan + 0.6)} />}
        {t > T.centaur && t < T.threeHalf && <Pill x={700} y={150} text="CENTAUR BURNS LONGER" size={36} s={pop(t, T.centaur + 0.3)} />}
        <g transform={`translate(1380 560) scale(${pop(t, T.wrong + 0.4)})`}>
          <rect x={-240 + 10} y={-300 + 10} width={480} height={600} rx={30} fill={C.ink} />
          <rect x={-240} y={-300} width={480} height={600} rx={30} fill={PAPER} stroke={C.ink} strokeWidth={INK_W} />
          <text x={0} y={-220} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={44} fill={C.ink}>
            FUEL LEFT
          </text>
          <rect x={-160} y={-170} width={320} height={300} rx={20} fill="#3A3F55" stroke={C.ink} strokeWidth={5} />
          <rect x={-150} y={120 - 280 * fuel} width={300} height={280 * fuel} rx={14} fill={fuel > 0.25 ? C.green : C.red} />
          <text x={0} y={240} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={64} fill={fuel > 0.25 ? C.ink : C.red}>
            {`${secs.toFixed(1)} s`}
          </text>
        </g>
        {t > T.done + 1.6 && <BigText x={1380} y={1010} text="3.5 SECONDS!" size={84 * slam(t, T.done + 1.6)} fill={C.yellow} />}
      </Layer>
    </Stage>
  );
};

// Voyager 2 radio: deaf receiver, narrow drifting frequency slot, engineers aim.
const RadioScene: React.FC<{t: number}> = ({t}) => {
  const slot = 960 + Math.sin(t * 0.9) * 260 + Math.sin(t * 2.3) * 60;
  return (
    <Stage cam={{s: punchIn(t, T.receiver)}}>
      <Layer>
        <Space t={t} cx={960} cy={200} />
        <Photo src="v2ksc" iw={616} ih={607} x={330} y={330} w={340} t={t} t0={T.receiver} t1={T.narrow} rot={-4} credit="NASA, 1977" label="VOYAGER 2" />
        <g transform={`translate(${t < T.narrow ? 1100 : 960} ${t < T.narrow ? 420 : 360}) scale(${t < T.narrow ? 1 : 0.8})`}>
          <rect x={-260 + 10} y={-150 + 10} width={520} height={300} rx={30} fill={C.ink} />
          <rect x={-260} y={-150} width={520} height={300} rx={30} fill="#C3CED6" stroke={C.ink} strokeWidth={INK_W} />
          <Face x={-90} y={-10} s={0.75} mood={t > T.receiver + 2 ? 'dizzy' : 'happy'} open={blink(t, 4)} gap={38} />
          <circle cx={150} cy={0} r={70} fill="#8E9BA5" stroke={C.ink} strokeWidth={6} />
          <line x1={150} y1={0} x2={150 + Math.cos(t * 3) * 56} y2={Math.sin(t * 3) * 56} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          <Pill x={0} y={-200} text={t > T.backup ? 'BACKUP RECEIVER: BROKEN PART' : 'MAIN RECEIVER: FAILED'} size={30} bg={t > T.backup ? C.yellow : C.red} fg={C.ink} />
        </g>
        {t > T.narrow && (
          <g>
            <rect x={200} y={690} width={1520} height={120} rx={20} fill="#2B2F45" stroke={C.ink} strokeWidth={6} />
            {Array.from({length: 31}).map((_, i) => (
              <line key={i} x1={220 + i * 49} y1={700} x2={220 + i * 49} y2={i % 5 ? 730 : 750} stroke="#8E9BA5" strokeWidth={4} />
            ))}
            <rect x={slot - 18} y={690} width={36} height={120} fill={C.green} stroke={C.ink} strokeWidth={4} opacity={0.9} />
            <Txt x={960} y={900} text={t > T.drifts ? 'THE "EAR" DRIFTS WITH HEAT AND MOTION' : 'ONLY ONE NARROW FREQUENCY'} size={40} anchor="middle" />
            {t > T.aim && <Arrow x1={slot} y1={560} x2={slot} y2={680} w={16} head={34} color={C.yellow} />}
            {t > T.aim && <Pill x={slot} y={520} text="AIM HERE" size={28} s={pop(t, T.aim + 0.2)} />}
          </g>
        )}
        {t > T.fortyEight && <BigText x={960} y={1020} text="48 YEARS ON THE BACKUP" size={70 * slam(t, T.fortyEight)} fill={C.yellow} />}
      </Layer>
    </Stage>
  );
};

// Jupiter: real photos, storms bigger than Earth, rings.
const JupiterScene: React.FC<{t: number}> = ({t}) => (
  <Stage cam={{s: punchIn(t, T.jupiter)}}>
    <Layer>
      <Space t={t} cx={960} cy={540} />
      <Photo src="jupiter" iw={1000} ih={1000} x={480} y={520} w={540} t={t} t0={T.jupiter + 0.2} rot={-3} credit="NASA/JPL, VOYAGER 1, 1979" label="JUPITER" />
      <Photo src="grs" iw={895} ih={848} x={1340} y={480} w={560} t={t} t0={T.storms - 0.2} rot={3} credit="NASA/JPL, VOYAGER 1, 1979" label="THE GREAT RED SPOT" />
      {t > T.storms + 1 && (
        <g transform={`translate(1520 880) scale(${pop(t, T.storms + 1)})`}>
          <Body k="earth" x={0} y={0} r={46} t={t} />
          <Pill x={0} y={90} text="EARTH FITS INSIDE THE STORM" size={24} bg={PAPER} />
        </g>
      )}
      {t > T.rings && <Stamp x={900} y={960} text="RINGS TOO!" size={52} s={springIn(t, T.rings + 0.6, 0.5, 10)} />}
    </Layer>
  </Stage>
);

// Io: Morabito, nav image, plume, volcano, cartoon Io erupting.
const IoScene: React.FC<{t: number}> = ({t}) => {
  const erupt = t > T.volcano;
  return (
    <Stage cam={{s: punchIn(t, T.surprise)}}>
      <Layer>
        <Space t={t} cx={1300} cy={520} />
        <Photo src="ioplume" iw={140} ih={140} x={460} y={500} w={460} t={t} t0={T.checking} rot={-3} credit="NASA/JPL, VOYAGER 1, MARCH 8, 1979" label="NAVIGATION IMAGE" />
        {t > T.plume && t < T.expected && (
          <g>
            <ellipse cx={330} cy={430} rx={70} ry={90} fill="none" stroke={C.ink} strokeWidth={16} />
            <ellipse cx={330} cy={430} rx={70} ry={90} fill="none" stroke={C.red} strokeWidth={8} />
          </g>
        )}
        {t < T.checking && (
          <g transform={`translate(560 520) scale(${pop(t, T.morabito)})`}>
            <Pill x={0} y={-50} text="LINDA MORABITO" size={52} />
            <Pill x={0} y={60} text="NAVIGATION ENGINEER, JPL" size={34} bg={PAPER} />
          </g>
        )}
        <Body k="io" x={1350} y={600} r={200} t={t} mood={erupt ? 'surprised' : 'happy'} />
        {erupt &&
          Array.from({length: 12}).map((_, i) => {
            const w = ((t - T.volcano) * 0.8 + i / 12) % 1;
            return <circle key={i} cx={1350 - 30 + Math.sin(i * 3) * 40 * w} cy={380 - w * 300} r={14 + w * 36} fill={i % 3 ? '#F28C28' : '#FFD23F'} stroke={C.ink} strokeWidth={4} opacity={1 - w} />;
          })}
        {t > T.plume && t < T.first && <Pill x={1350} y={150} text="PLUME ~300 KM HIGH" size={38} s={pop(t, T.plume + 0.4)} />}
        {t > T.first && t < T.expected && <Stamp x={1250} y={175} text="1ST VOLCANO BEYOND EARTH" size={48} s={springIn(t, T.first + 0.2, 0.5, 10)} />}
        {t > T.expected && t < T.instead && <Pill x={1350} y={150} text="EXPECTED: DEAD, CRATERED MOON" size={36} bg={PAPER} s={pop(t, T.expected + 0.3)} />}
        {t > T.instead && <BigText x={1150} y={210} text="MOST ACTIVE WORLD" size={80 * slam(t, T.instead + 0.5)} fill={C.yellow} />}
      </Layer>
    </Stage>
  );
};

// Saturn + Titan choice: fork diagram.
const TitanScene: React.FC<{t: number}> = ({t}) => {
  const path = prog(t, T.bend, T.noUranus);
  return (
    <Stage cam={{s: punchIn(t, T.saturn)}}>
      <Layer>
        <Space t={t} cx={700} cy={600} />
        <Photo src="saturn" iw={971} ih={855} x={380} y={300} w={400} t={t} t0={T.saturn + 0.2} rot={-3} credit="NASA/JPL, VOYAGER 1, 1980" label="SATURN" />
        <Body k="saturn" x={760} y={700} r={110} t={t} />
        <Body k="titan" x={1040} y={620} r={70} t={t} seed={2} mood={t > T.chose ? 'smug' : 'happy'} />
        {t > T.titanMoon && t < T.bend && <Pill x={1040} y={430} text="TITAN: THICK ATMOSPHERE" size={30} s={pop(t, T.titanMoon + 0.3)} />}
        {/* plane of the planets */}
        <line x1={300} y1={800} x2={1860} y2={800} stroke="#5B6AA8" strokeWidth={6} strokeDasharray="16 14" />
        <Txt x={1850} y={920} text="PLANE OF THE PLANETS" size={30} anchor="end" />
        {t > T.choice && (
          <g>
            <path d="M 1040 620 Q 1300 760 1500 800 Q 1650 820 1800 800" stroke={C.green} strokeWidth={10} fill="none" strokeDasharray="20 16" opacity={t > T.chose ? 0.35 : 1} />
            <path d="M 1040 620 Q 1300 420 1560 150" stroke={C.yellow} strokeWidth={12} fill="none" strokeDasharray={`${900 * path} 2000`} strokeLinecap="round" />
            {t > T.bend + 1.5 && <Voyager x={lerp(1040, 1540, path)} y={lerp(620, 170, path)} s={0.3} t={t} mood="surprised" />}
            <Body k="uranus" x={1520} y={800} r={46} t={t} seed={3} face={false} />
            <Body k="neptune" x={1760} y={800} r={46} t={t} seed={4} face={false} />
            {t > T.noUranus && <path d="M 1470 750 L 1570 850 M 1570 750 L 1470 850" stroke={C.red} strokeWidth={16} strokeLinecap="round" />}
            {t > T.noUranus + 0.7 && <path d="M 1710 750 L 1810 850 M 1810 750 L 1710 850" stroke={C.red} strokeWidth={16} strokeLinecap="round" />}
          </g>
        )}
        {t > T.chose && <BigText x={960} y={1030} text="THEY CHOSE TITAN" size={80 * slam(t, T.chose)} fill={C.yellow} />}
        {t > T.tourEnd && <Stamp x={900} y={180} text="V1 PLANET TOUR: OVER" size={44} s={springIn(t, T.tourEnd + 0.4, 0.5, 10)} />}
      </Layer>
    </Stage>
  );
};

// Voyager 2's grand tour: Uranus, Neptune, Triton. Only visitor.
const TourScene: React.FC<{t: number}> = ({t}) => {
  const nep = t > T.neptune - 0.2;
  return (
    <Stage cam={{s: punchIn(t, T.grand)}}>
      <Layer>
        <Space t={t} cx={960} cy={540} />
        {t < T.uranus && (
          <g>
            <Voyager x={960} y={500} s={1} t={t} tag="VOYAGER 2" mood="smug" />
            <BigText x={960} y={170} text="THE GRAND TOUR: VOYAGER 2" size={74 * slam(t, T.grand + 0.2)} fill={C.yellow} />
          </g>
        )}
        {t > T.uranus && !nep && (
          <g>
            <Photo src="uranus" iw={1100} ih={1100} x={560} y={520} w={480} t={t} t0={T.uranus} rot={-3} credit="NASA/JPL, VOYAGER 2, 1986" label="URANUS · JAN 1986" />
            <Body k="uranus" x={1380} y={540} r={180} t={t} mood="surprised" />
          </g>
        )}
        {nep && t < T.only && (
          <g>
            <Photo src="neptune" iw={1100} ih={1100} x={460} y={480} w={440} t={t} t0={T.neptune - 0.2} rot={-3} credit="NASA/JPL, VOYAGER 2, 1989" label="NEPTUNE · AUG 1989" />
            {t > T.winds && (
              <g>
                <Body k="neptune" x={1150} y={460} r={140} t={t} mood="squeeze" />
                {Array.from({length: 6}).map((_, i) => {
                  const w = (t * 1.4 + i / 6) % 1;
                  return <path key={i} d={`M ${950 - w * 120} ${360 + i * 40} q 60 -14 120 0`} stroke="#fff" strokeWidth={7} fill="none" opacity={1 - w} strokeLinecap="round" />;
                })}
                <Pill x={1150} y={680} text="STRONGEST WINDS IN THE SOLAR SYSTEM" size={30} s={pop(t, T.winds + 0.8)} bg={PAPER} />
              </g>
            )}
            {t > T.triton && <Photo src="triton" iw={1100} ih={855} x={1570} y={720} w={420} t={t} t0={T.triton} rot={4} credit="NASA/JPL, VOYAGER 2, 1989" label="TRITON: ICE GEYSERS" />}
          </g>
        )}
        {t > T.only && (
          <g>
            <Body k="uranus" x={620} y={520} r={170} t={t} seed={1} mood="happy" />
            <Body k="neptune" x={1300} y={520} r={180} t={t} seed={2} mood="happy" />
            <Stamp x={620} y={865} text="1 VISIT EVER" size={46} s={springIn(t, T.only + 0.4, 0.5, 10)} />
            <Stamp x={1300} y={865} text="1 VISIT EVER" size={46} rot={6} s={springIn(t, T.only + 0.8, 0.5, 10)} />
            <Voyager x={960 + Math.sin(t) * 20} y={210} s={0.45} t={t} mood="smug" />
            {t > T.closeup && <Pill x={960} y={980} text="EVERY CLOSE-UP: A FEW DAYS OF FLYBY" size={32} s={pop(t, T.closeup + 0.4)} />}
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// Pale Blue Dot: Sagan's idea, Voyager turns around, the real photo, zoom to the dot, cameras off.
const DotScene: React.FC<{t: number}> = ({t}) => {
  const photo = t > T.pixel - 0.3 && t < T.min34;
  const z = prog(t, T.pixel + 0.5, T.dot + 0.3);
  const Z = lerp(1, 2.4, z);
  const DX = 181;
  const DY = 36;
  const dotX = 960 + Z * DX * (1 - z);
  const dotY = 540 + Z * DY * (1 - z);
  return (
    <Stage cam={{s: punchIn(t, T.y1990)}}>
      <Layer>
        <Space t={t} cx={300} cy={540} drift={0.4} />
        {t < T.pixel - 0.3 && (
          <g>
            <Photo src="sagan" iw={820} ih={1100} x={380} y={520} w={360} t={t} t0={T.oneLast - 0.2} rot={-4} credit="NASA AMES, 1994" label="CARL SAGAN" />
            <Voyager x={1300} y={570} s={0.9} t={t} rot={lerp(0, 180, prog(t, T.turnCam, T.turnCam + 1.4))} mood="happy" />
            {t < T.oneLast && <Pill x={1300} y={150} text="~6 BILLION KM FROM THE SUN" size={40} s={pop(t, T.y1990 + 0.6)} />}
            {t > T.turnCam && <BigText x={1150} y={205} text="PHOTOGRAPH HOME" size={84 * slam(t, T.turnCam)} fill={C.yellow} />}
            {t > T.feb14 && <Pill x={1300} y={900} text="FEB 14, 1990" size={44} s={pop(t, T.feb14 + 0.3)} />}
          </g>
        )}
        {photo && (
          <g>
            <g transform={`translate(960 540) scale(${Z}) translate(${-DX * z} ${-DY * z})`}>
              <image href={staticFile('voyagerlong/photos/palebluedot.jpg')} x={-960} y={-948} width={1920} height={1897} />
            </g>
            {t > T.dot + 0.4 && (
              <g>
                <ellipse cx={dotX} cy={dotY} rx={70} ry={64} fill="none" stroke={C.ink} strokeWidth={18} />
                <ellipse cx={dotX} cy={dotY} rx={70} ry={64} fill="none" stroke={C.red} strokeWidth={9} />
                <Arrow x1={dotX + 300} y1={dotY - 220} x2={dotX + 90} y2={dotY - 60} color={C.red} w={16} head={38} />
                <Pill x={dotX + 420} y={dotY - 260} text="THAT'S US" size={44} s={pop(t, T.dot + 0.6)} />
              </g>
            )}
            <Txt x={40} y={1040} text="NASA/JPL-CALTECH, PALE BLUE DOT (2020 REPROCESSING)" size={24} />
            {t < T.dot && <Pill x={960} y={150} text="EARTH: SMALLER THAN 1 PIXEL" size={40} s={pop(t, T.pixel + 0.2)} />}
          </g>
        )}
        {t > T.min34 && (
          <g>
            <Voyager x={960} y={520} s={1.1} t={t} mood="happy" power={1 - prog(t, T.min34 + 2.2, T.min34 + 3.2)} />
            <BigText x={960} y={170} text="34 MINUTES LATER..." size={80 * slam(t, T.min34)} fill={C.yellow} />
            {t > T.min34 + 2.2 && <Stamp x={960} y={900} text="CAMERAS OFF. FOREVER." size={54} s={springIn(t, T.min34 + 2.4, 0.5, 10)} />}
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// Heliosphere bubble: solar wind, edge, Voyager crosses, uncertainty, bell ring, confirmed, V2, drawing the map.
const BubbleScene: React.FC<{t: number}> = ({t}) => {
  const cx = 760;
  const cy = 560;
  const Rx = 560;
  const Ry = 400;
  const cross = prog(t, T.cross12 - 0.2, T.cross12 + 2.4);
  const vx = lerp(cx + Rx - 220, cx + Rx + 230, cross);
  const vy = cy - 130;
  const ring = t > T.bell - 0.3 ? (t - (T.bell - 0.3)) : -1;
  return (
    <Stage cam={{s: punchIn(t, T.wind)}}>
      <Layer>
        <Space t={t} cx={cx} cy={cy} drift={0.5} />
        <ellipse cx={cx} cy={cy} rx={Rx * pop(t, T.bubble)} ry={Ry * pop(t, T.bubble)} fill="#2A3C7A" fillOpacity={0.55} stroke={BEAM} strokeWidth={8} />
        {Array.from({length: 18}).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const w = (t * 0.35 + rnd(i)) % 1;
          return <circle key={i} cx={cx + Math.cos(a) * (60 + w * (Rx - 80))} cy={cy + Math.sin(a) * (40 + w * (Ry - 60))} r={7} fill={C.yellow} opacity={1 - w} />;
        })}
        <Sun x={cx} y={cy} r={60} t={t} />
        {t > T.bubble + 1 && <Pill x={cx} y={cy + Ry + 60} text="THE HELIOSPHERE" size={36} s={pop(t, T.bubble + 1)} />}
        {t > T.edge && <Pill x={1560} y={150} text="INTERSTELLAR SPACE →" size={34} s={pop(t, T.edge + 0.6)} bg={PAPER} />}
        {t > T.cross12 - 0.4 && <Voyager x={vx} y={vy} s={0.45} t={t} mood={t > T.unsure && t < T.inIS ? 'worried' : 'happy'} tag="V1 · AUG 2012" />}
        {t > T.unsure && t < T.inIS && <BigText x={vx - 170} y={vy - 10} text="?" size={110 * slam(t, T.unsure + 0.2)} fill={C.yellow} />}
        {t > T.instrDead && t < T.bell - 0.3 && <Pill x={1380} y={880} text="SOLAR-WIND SENSOR: DEAD SINCE 1980" size={30} s={pop(t, T.instrDead + 0.5)} bg={C.red} />}
        {ring > 0 &&
          ring < 3 &&
          [0, 1, 2].map((k) => (
            <circle key={k} cx={vx} cy={vy} r={60 + ((ring * 140 + k * 60) % 220)} fill="none" stroke={C.yellow} strokeWidth={8} opacity={Math.max(0, 1 - ((ring * 140 + k * 60) % 220) / 220)} />
          ))}
        {t > T.bell && t < T.v2_2018 && <Pill x={1500} y={880} text="THE GAS RANG LIKE A BELL" size={34} s={pop(t, T.bell + 0.3)} />}
        {t > T.inIS && t < T.v2_2018 && <Stamp x={1500} y={760} text="CONFIRMED" size={52} color="#1E8F4E" s={springIn(t, T.inIS, 0.5, 10)} />}
        {t > T.v2_2018 && <Voyager x={lerp(cx + Rx - 120, cx + Rx + 160, prog(t, T.v2_2018, T.v2_2018 + 2))} y={cy + 120} s={0.4} t={t + 1} tag="V2 · NOV 2018" mood="smug" />}
        {t > T.onlyIS && t < T.noMap && <Pill x={1450} y={900} text="ONLY WORKING PROBES OUT THERE" size={32} s={pop(t, T.onlyIS + 0.4)} />}
        {t > T.noMap && (
          <g>
            <path d={`M ${vx} ${vy} q 120 -80 240 -20 t 220 -60`} stroke={C.yellow} strokeWidth={8} fill="none" strokeDasharray={`${600 * prog(t, T.drawing, T.drawing + 2)} 1000`} strokeLinecap="round" />
            <BigText x={1460} y={985} text="NO MAP. YET." size={70 * slam(t, T.noMap + 0.2)} fill={C.yellow} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// Repairs intro + antenna 2 degrees + Canberra shout.
const AntennaScene: React.FC<{t: number}> = ({t}) => {
  const tilt = t > T.july23 + 1.6 && t < T.turnedHome ? 14 : 0;
  const tiltNow = lerp(0, tilt, prog(t, T.july23 + 1.4, T.july23 + 2.2));
  const shoutU = clamp((t - T.shout) / Math.max(1, T.turnedHome - T.shout - 0.3));
  return (
    <Stage cam={{s: punchIn(t, T.fixing)}}>
      <Layer>
        <Space t={t} cx={260} cy={560} />
        <Body k="earth" x={260} y={560} r={150} t={t} mood={t > T.twoDeg && t < T.turnedHome ? 'worried' : 'happy'} />
        <Voyager x={1640} y={480} s={0.6} t={t} rot={tiltNow} mood={t > T.twoDeg && t < T.turnedHome ? 'scared' : 'happy'} />
        <line x1={1560} y1={480} x2={430} y2={560 + tiltNow * 48} stroke={BEAM} strokeWidth={6} strokeDasharray="16 14" opacity={0.75} />
        {t < T.july23 && <Pill x={960} y={180} text="~1 LIGHT-DAY OF DISTANCE" size={44} s={pop(t, T.lightDay + 0.5)} />}
        {t > T.july23 && t < T.canberra && <Pill x={960} y={180} text="JULY 2023: A WRONG COMMAND" size={42} bg={C.red} s={pop(t, T.july23 + 0.2)} />}
        {t > T.twoDeg && t < T.canberra && <BigText x={1280} y={880} text="2° OFF = SILENCE" size={70 * slam(t, T.twoDeg)} fill={C.yellow} />}
        {t > T.canberra && t < T.took185 + 2.6 && <Photo src="dss43" iw={1100} ih={733} x={720} y={850} w={420} t={t} t0={T.canberra} rot={-3} credit="NASA/CANBERRA DSCC" label="70 M DISH, CANBERRA" />}
        {t > T.shout && <Pulse x1={430} y1={560} x2={1560} y2={480} u={shoutU} big={2} />}
        {t > T.shout && t < T.took185 && <Pill x={960} y={180} text="AN INTERSTELLAR SHOUT" size={46} s={pop(t, T.shout + 0.2)} />}
        {t > T.took185 && t < T.turnedHome && <Pill x={960} y={180} text="~18.5 HOURS TO ARRIVE" size={46} s={pop(t, T.took185 + 0.3)} />}
        {t > T.turnedHome && <Stamp x={1300} y={880} text="VOYAGER 2 TURNED HOME" color="#1E8F4E" size={48} s={springIn(t, T.turnedHome + 0.3, 0.5, 10)} />}
      </Layer>
    </Stage>
  );
};

// Memory chip repair: grid with a dead chip, code blocks hop around it.
const ChipScene: React.FC<{t: number}> = ({t}) => {
  const cols = 8;
  const rows = 4;
  const gx = 520;
  const gy = 330;
  const cw = 120;
  const dead = {c: 3, r: 1};
  const blocks = [
    {from: [3, 1], to: [6, 0]},
    {from: [3, 1], to: [1, 3]},
    {from: [3, 1], to: [7, 2]},
  ];
  const garble = 'X7#q@%!vR0&~zJ*';
  return (
    <Stage cam={{s: punchIn(t, T.gibberish)}}>
      <Layer>
        <Space t={t} cx={960} cy={540} />
        {t < T.chip && (
          <g>
            <Voyager x={560} y={520} s={1} t={t} mood="dizzy" />
            <g transform={`translate(1300 520) scale(${pop(t, T.gibberish + 0.6)})`}>
              <rect x={-330} y={-120} width={660} height={240} rx={24} fill="#2B2F45" stroke={C.ink} strokeWidth={6} />
              <text x={0} y={22} textAnchor="middle" fontFamily="monospace" fontWeight={700} fontSize={64} fill={C.green}>
                {garble.split('').map((c, i) => garble[(i + Math.floor(t * 12)) % garble.length]).join('')}
              </text>
            </g>
            <Pill x={1300} y={780} text="NOV 2023: GIBBERISH" size={40} bg={C.red} s={pop(t, T.gibberish + 1.2)} />
          </g>
        )}
        {t > T.chip && (
          <g>
            <BigText x={960} y={190} text={t > T.sense ? 'APRIL 2024: IT MAKES SENSE AGAIN' : 'ONE MEMORY CHIP DIED'} size={t > T.sense ? 64 : 78} fill={C.yellow} s={slam(t, t > T.sense ? T.sense : T.chip)} />
            {Array.from({length: cols * rows}).map((_, i) => {
              const c = i % cols;
              const r = Math.floor(i / cols);
              const isDead = c === dead.c && r === dead.r;
              return (
                <g key={i}>
                  <rect x={gx + c * cw} y={gy + r * cw} width={cw - 14} height={cw - 14} rx={12} fill={isDead ? '#5A2A2A' : '#3A4A7A'} stroke={C.ink} strokeWidth={5} />
                  {isDead && <path d={`M ${gx + c * cw + 20} ${gy + r * cw + 20} l 66 66 m 0 -66 l -66 66`} stroke={C.red} strokeWidth={10} strokeLinecap="round" />}
                </g>
              );
            })}
            {t > T.moved &&
              blocks.map((b, i) => {
                const u = prog(t, T.moved + 0.6 + i * 1.3, T.moved + 1.6 + i * 1.3);
                const x = lerp(gx + b.from[0] * cw, gx + b.to[0] * cw, u);
                const y = lerp(gy + b.from[1] * cw, gy + b.to[1] * cw, u) - Math.sin(u * Math.PI) * 140;
                return <rect key={i} x={x + 10} y={y + 10} width={cw - 34} height={cw - 34} rx={10} fill={C.green} stroke={C.ink} strokeWidth={5} />;
              })}
            {t > T.noReplace && t < T.moved && <Pill x={960} y={900} text="NO ONE CAN SWAP IT: 24 BILLION KM AWAY" size={34} s={pop(t, T.noReplace + 0.3)} bg={PAPER} />}
            {t > T.moved && t < T.sense && <Pill x={960} y={900} text="MOVE THE CODE AROUND IT, PIECE BY PIECE" size={34} s={pop(t, T.moved + 0.3)} />}
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// Thrusters dead since 2004, revived 2025; then the 2-day wait for every repair.
const ThrusterScene: React.FC<{t: number}> = ({t}) => {
  const alive = t > T.worked;
  const wait = t > T.sameWay - 0.1;
  return (
    <Stage cam={{s: punchIn(t, wait ? T.sameWay : T.thrust)}}>
      <Layer>
        <Space t={t} cx={960} cy={540} />
        {!wait && (
          <g>
            <Voyager x={960} y={500} s={1.1} t={t} mood={alive ? 'happy' : 'worried'} />
            {[-1, 1].map((d) => (
              <g key={d}>
                {(alive || (t > T.gambled + 0.8 && Math.sin(t * 30) > 0.3)) &&
                  [0, 1, 2].map((k) => {
                    const w = (t * 2 + k / 3) % 1;
                    return <circle key={k} cx={960 + d * (260 + w * 160)} cy={560 + k * 6} r={18 + w * 22} fill="#E8ECF5" stroke={C.ink} strokeWidth={4} opacity={1 - w} />;
                  })}
              </g>
            ))}
            {t > T.deadSince && !alive && <Stamp x={960} y={900} text="DEAD SINCE 2004" size={54} s={springIn(t, T.deadSince + 0.2, 0.5, 10)} />}
            {t > T.gambled && !alive && <Pill x={960} y={180} text="2025: THEY GAMBLED" size={44} s={pop(t, T.gambled)} />}
            {alive && <Stamp x={960} y={900} text="IT WORKED" color="#1E8F4E" size={60} s={springIn(t, T.worked + 0.2, 0.5, 10)} />}
          </g>
        )}
        {wait && (
          <g>
            <Body k="earth" x={260} y={560} r={130} t={t} />
            <Voyager x={1660} y={500} s={0.5} t={t} />
            <Pulse x1={400} y1={560} x2={1580} y2={500} u={(t - T.wait2) / 2.2 % 1} />
            <Pulse x1={1580} y1={500} x2={400} y2={560} u={clamp((t - T.wait2 - 2.2) / 2.2)} color={C.green} />
            <BigText x={960} y={210} text="SEND. WAIT ~2 DAYS." size={84 * slam(t, T.wait2)} fill={C.yellow} />
            <Pill x={960} y={900} text="...DID IT WORK?" size={44} s={pop(t, T.wait2 + 2.4)} bg={PAPER} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// The answer: power fades, instruments off, LECP off April 2026; still the only ones; nobody switches it off.
const AnswerScene: React.FC<{t: number}> = ({t}) => {
  const level = lerp(0.9, 0.42, prog(t, T.watts, T.oneByOne + 3));
  const on = t < T.oneByOne + 1 ? 4 : t < T.lecp + 3 ? 3 : 2;
  const keep = t > T.stillOnly - 0.1;
  return (
    <Stage cam={{s: punchIn(t, keep ? T.stillOnly : T.switchQ2)}}>
      <Layer>
        <Space t={t} cx={960} cy={540} />
        {!keep && (
          <g>
            <BigText x={960} y={205} text="SO WHY NOT SWITCH IT OFF?" size={80 * slam(t, T.switchQ2)} fill={C.yellow} />
            <Voyager x={700} y={520} s={1} t={t} mood="worried" power={level + 0.2} />
            {t > T.watts && <Battery x={1190} y={820} s={0.9} level={level} />}
            {t > T.watts + 0.6 && <Pill x={1190} y={900} text="-4 WATTS PER YEAR" size={34} s={pop(t, T.watts + 0.6)} />}
            {t > T.oneByOne && (
              <g>
                {Array.from({length: 10}).map((_, i) => (
                  <circle key={i} cx={1480 + (i % 2) * 120} cy={260 + Math.floor(i / 2) * 110} r={34} fill={i < on ? C.yellow : '#3A3F55'} stroke={C.ink} strokeWidth={5} />
                ))}
                <Txt x={1540} y={800} text="INSTRUMENTS" size={30} anchor="middle" />
              </g>
            )}
            {t > T.lecp && <Pill x={470} y={900} text="APRIL 2026: ANOTHER ONE OFF" size={34} bg={C.red} s={pop(t, T.lecp + 0.6)} />}
          </g>
        )}
        {keep && t < T.oneDay && (
          <g>
            <Voyager x={620} y={480} s={0.9} t={t} mood="smug" tag="V1" />
            <Voyager x={1000} y={600} s={0.7} t={t + 2} mood="happy" tag="V2" />
            <Pill x={800} y={170} text="STILL THE ONLY ONES IN INTERSTELLAR SPACE" size={36} s={pop(t, T.stillOnly + 0.3)} />
            {t > T.decades && <Pill x={1420} y={330} text="NEW PROBE: DECADES TO GET THERE" size={30} s={pop(t, T.decades + 0.4)} bg={PAPER} />}
            <Switch x={1500} y={640} s={0.85} on={1} />
            {t > T.nobodySw && <Stamp x={1500} y={930} text="STAYS ON" color="#1E8F4E" size={56} s={springIn(t, T.nobodySw + 0.3, 0.5, 10)} />}
          </g>
        )}
      </Layer>
      {keep && t < T.oneDay && <Sci t={t} x={1780} y={1060} headR={58} poses={[[0, 'thumbs']]} />}
    </Stage>
  );
};

// Ending: zoom out, Gliese 445 in 40,000 years, the reply arrives.
const EndingScene: React.FC<{t: number}> = ({t}) => {
  const z = prog(t, T.oneDay, T.gliese + 4);
  const replied = t > REPLY_AT;
  return (
    <Stage cam={{s: lerp(1.15, 1, z)}}>
      <Layer>
        <Space t={t} cx={1500} cy={360} drift={0.3} />
        <g transform={`translate(1560 300)`}>
          {t > T.gliese && (
            <g transform={`scale(${pop(t, T.gliese + 0.4)})`}>
              <circle r={70} fill="#FF9A5A" opacity={0.3} />
              <circle r={44} fill="#FF8A4A" stroke={C.ink} strokeWidth={6} />
              <Face x={0} y={4} s={0.36} mood="happy" open={blink(t, 5)} gap={30} />
            </g>
          )}
        </g>
        {t > T.gliese + 1 && <Pill x={1400} y={190} text="GLIESE 445 · IN ~40,000 YEARS" size={32} s={pop(t, T.gliese + 1)} />}
        <Voyager x={lerp(700, 1180, z)} y={lerp(560, 420, z)} s={lerp(1, 0.5, z)} t={t} mood={t > T.oneDay && t < T.wontStop ? 'neutral' : 'happy'} power={t > T.oneDay + 1 && t < T.wontStop ? 0.3 : 1} />
        <path d={`M 200 900 Q 600 700 ${lerp(700, 1180, z)} ${lerp(560, 420, z) + 40}`} stroke={C.yellow} strokeWidth={6} fill="none" strokeDasharray="12 14" opacity={0.6} />
        {t > T.oneDay && t < T.wontStop && <Pill x={960} y={150} text="ONE DAY: QUIET" size={40} s={pop(t, T.oneDay + 0.5)} bg={PAPER} />}
        {t > T.wontStop && t < T.gliese && <BigText x={960} y={170} text="BUT IT WON'T STOP" size={80 * slam(t, T.wontStop + 0.3)} fill={C.yellow} />}
        {t > T.carrying && <Record x={lerp(700, 1180, z) + 120} y={lerp(560, 420, z) + 110} r={50} t={t} />}
      </Layer>
      <Sci t={t} x={300} y={1060} headR={64} poses={[[0, 'phone'], [REPLY_AT + 0.6, 'thumbs']]} />
      <Layer>
        {replied && <Bubble x={380} y={460} text="...HELLO!" size={48} s={pop(t, REPLY_AT)} />}
        {replied && <Phone x={560} y={700} s={0.5 * pop(t, REPLY_AT - 0.2)} t={t} text="HELLO!" buzz={1 - clamp((t - REPLY_AT) / 1.2)} />}
      </Layer>
    </Stage>
  );
};

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [0, HookScene],
  [T.answer - 0.05, StoryScene],
  [T.flandro - 0.05, AlignScene],
  [T.why - 0.05, AssistScene],
  [T.built - 0.05, BuiltScene],
  [T.record - 0.05, RecordScene],
  [T.v2launch - 0.05, LaunchScene],
  [T.wrong - 0.05, FuelScene],
  [T.receiver - 0.05, RadioScene],
  [T.jupiter - 0.05, JupiterScene],
  [T.surprise - 0.05, IoScene],
  [T.saturn - 0.05, TitanScene],
  [T.grand - 0.05, TourScene],
  [T.y1990 - 0.05, DotScene],
  [T.wind - 0.05, BubbleScene],
  [T.fixing - 0.05, AntennaScene],
  [T.gibberish - 0.05, ChipScene],
  [T.thrust - 0.05, ThrusterScene],
  [T.switchQ2 - 0.05, AnswerScene],
  [T.oneDay - 0.05, EndingScene],
];

// ------------------------------------------------------------------ overlays

// Reply countdown (24 h -> 0 at REPLY_AT), big under the hook, then a small chip top-left.
const ReplyTimer: React.FC<{t: number}> = ({t}) => {
  if (t < 0.9 || t > REPLY_AT + 2.5 || t > VO_END + 0.3) return null;
  const left = Math.max(0, 1 - (t - 0.9) / (REPLY_AT - 0.9)) * 24 * 3600;
  const hh = Math.floor(left / 3600);
  const mm = Math.floor((left % 3600) / 60);
  const ss = Math.floor(left % 60);
  const txt = left <= 0 ? 'REPLY RECEIVED' : `REPLY IN ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const big = t < T.in1977 - 0.3;
  return (
    <Layer>
      <g transform={big ? `translate(560 160) scale(${pop(t, 0.9)})` : 'translate(250 62) scale(0.62)'}>
        <rect x={-260 + 8} y={-40 + 8} width={520} height={80} rx={40} fill={C.ink} />
        <rect x={-260} y={-40} width={520} height={80} rx={40} fill={left <= 0 ? C.green : '#2B2F45'} stroke={C.ink} strokeWidth={6} />
        <text x={0} y={14} textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight={700} fontSize={36} fill={left <= 0 ? C.ink : C.green}>
          {txt}
        </text>
      </g>
    </Layer>
  );
};

// Close-calls HUD (top right): 5 hearts; crack at a near-death, patched after the repair.
const CallsHud: React.FC<{t: number}> = ({t}) => {
  if (t < HUD_ON || t > HUD_OFF) return null;
  const s = pop(t, HUD_ON) * until(t, HUD_OFF);
  const survived = CALLS.filter(([, h]) => t > h).length;
  return (
    <Layer>
      <g transform={`translate(1650 64) scale(${s})`}>
        <rect x={-250 + 8} y={-46 + 8} width={500} height={92} rx={46} fill={C.ink} />
        <rect x={-250} y={-46} width={500} height={92} rx={46} fill="#2B2F45" stroke={C.ink} strokeWidth={6} />
        {CALLS.map(([c, h], i) => {
          const state = t > h ? 'patched' : t > c ? 'cracked' : 'ok';
          const f = t > c && t < c + 0.6 ? 1 - (t - c) / 0.6 : t > h && t < h + 0.6 ? 1 - (t - h) / 0.6 : 0;
          return <Heart key={i} x={-170 + i * 64} y={4} s={0.62 * (1 + 0.25 * f)} state={state} flash={f} />;
        })}
        <text x={170} y={16} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill={C.yellow}>
          {`${survived}/5`}
        </text>
      </g>
      {CALLS.map(([c], i) =>
        t > c && t < c + 2.4 ? (
          <g key={i} transform={`translate(1650 150) scale(${span(t, c, c + 2.4)})`} data-label={`CLOSE CALL #${i + 1}`}>
            <rect x={-170 + 6} y={-30 + 6} width={340} height={60} rx={30} fill={C.ink} />
            <rect x={-170} y={-30} width={340} height={60} rx={30} fill={C.red} stroke={C.ink} strokeWidth={5} />
            <text x={0} y={12} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={32} fill={PAPER}>
              {`CLOSE CALL #${i + 1}`}
            </text>
          </g>
        ) : null,
      )}
    </Layer>
  );
};

// Chapter card (bottom-left slide-in) at every chapter start except the first.
const ChapterCard: React.FC<{t: number}> = ({t}) => {
  let idx = -1;
  CHAPTERS.forEach(([s], i) => {
    if (t >= s + 0.2) idx = i;
  });
  if (idx <= 0) return null;
  const [s, title, year] = CHAPTERS[idx];
  const d = t - (s + 0.2);
  if (d > 3.2) return null;
  const x = lerp(-700, 0, easeOutCubic(clamp(d / 0.45))) - lerp(0, 760, clamp((d - 2.8) / 0.4));
  const label = `${String(idx).padStart(2, '0')}  ${title.toUpperCase()}`;
  const w = label.length * 26 + 120;
  return (
    <Layer>
      <g transform={`translate(${x + 70} 990)`} data-skip={d < 0.5 || d > 2.75 ? 'moving' : undefined}>
        <rect x={-40 + 8} y={-44 + 8} width={w + 40} height={88} rx={20} fill={C.ink} />
        <rect x={-40} y={-44} width={w + 40} height={88} rx={20} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
        <text x={30} y={14} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={40} fill={C.ink}>
          {label}
        </text>
        {year && (
          <g transform={`translate(${w + 80} 0)`}>
            <rect x={0} y={-30} width={year.length * 26 + 50} height={60} rx={30} fill={PAPER} stroke={C.ink} strokeWidth={5} />
            <text x={(year.length * 26 + 50) / 2} y={13} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill={C.ink}>
              {year}
            </text>
          </g>
        )}
      </g>
    </Layer>
  );
};

// ------------------------------------------------------------------ sound

type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...SCENES.slice(1).map(([at]) => ({f: I('whoosh'), at: at - 0.05, db: -26})),
  {f: 'bbstream/sfx/ping', at: 0.6, db: -16},
  {f: I('stamp'), at: T.fullDay - 0.1, db: -14},
  {f: I('stamp'), at: T.in1977 + 0.6, db: -14},
  {f: I('pop'), at: T.fortynine + 0.25, db: -20},
  {f: 'sleep/sfx/dizzy', at: T.power + 0.5, db: -22, len: 1.5},
  {f: 'lightning/sfx/spark', at: T.instr + 0.6, db: -20},
  {f: I('stamp'), at: T.switchQ + 0.4, db: -13},
  {f: 'lightning/sfx/ding', at: T.every175, db: -18},
  {f: I('whoosh'), at: T.fly + 0.5, db: -16},
  {f: I('whoosh'), at: T.skate + 1.2, db: -14},
  {f: I('stamp'), at: T.miss + 0.3, db: -13},
  {f: I('pop'), at: T.memory + 0.3, db: -18},
  {f: 'bbstream/sfx/data', at: T.photoBig + 0.3, db: -20},
  {f: I('crack'), at: T.solar + 1.6, db: -18},
  {f: 'core/sfx/steam', at: T.plut, db: -26, len: 2.5},
  {f: I('pop'), at: T.whale, db: -20},
  {f: I('pop'), at: T.bach + 0.3, db: -20},
  {f: I('stamp'), at: T.adol + 1.2, db: -14},
  {f: I('stamp'), at: T.wentOn, db: -14},
  {f: 'sun/sfx/rocket', at: T.v2launch + 0.2, db: -22, len: 3},
  {f: 'sun/sfx/rocket', at: T.wrong, db: -20, len: 6},
  {f: 'asteroid/sfx/alarm', at: T.done + 0.4, db: -26, len: 1.4},
  {f: I('stamp'), at: T.done + 1.6, db: -12},
  {f: 'titanic/sfx/sonar', at: T.narrow, db: -22},
  {f: 'lightning/sfx/ding', at: T.aim + 0.2, db: -18},
  {f: I('pop'), at: T.storms - 0.2, db: -20},
  {f: I('stamp'), at: T.rings + 0.6, db: -14},
  {f: 'core/sfx/lava', at: T.volcano, db: -20, len: 3},
  {f: I('stamp'), at: T.first + 0.2, db: -13},
  {f: I('stamp'), at: T.chose, db: -14},
  {f: 'lightning/sfx/zap', at: T.noUranus, db: -20},
  {f: I('stamp'), at: T.only + 0.4, db: -14},
  {f: 'bbstream/sfx/rec', at: T.feb14 + 0.3, db: -18},
  {f: 'lightning/sfx/ding', at: T.dot + 0.6, db: -16},
  {f: 'sleep/sfx/snore', at: T.min34 + 2.3, db: -26, len: 1.4},
  {f: I('stamp'), at: T.min34 + 2.4, db: -14},
  {f: 'lightning/sfx/ding', at: T.bell, db: -16},
  {f: I('stamp'), at: T.inIS, db: -14},
  {f: 'asteroid/sfx/alarm', at: T.twoDeg, db: -26, len: 1.2},
  {f: 'titanic/sfx/sonar', at: T.shout, db: -16},
  {f: I('stamp'), at: T.turnedHome + 0.3, db: -14},
  {f: 'bbstream/sfx/data', at: T.gibberish + 0.6, db: -20},
  {f: I('crack'), at: T.chip + 0.2, db: -18},
  {f: I('pop'), at: T.moved + 0.6, db: -20},
  {f: I('pop'), at: T.moved + 1.9, db: -20},
  {f: I('pop'), at: T.moved + 3.2, db: -20},
  {f: 'lightning/sfx/ding', at: T.sense, db: -16},
  {f: I('stamp'), at: T.deadSince + 0.2, db: -14},
  {f: 'core/sfx/steam', at: T.worked, db: -22, len: 1.6},
  {f: I('stamp'), at: T.worked + 0.2, db: -13},
  {f: 'plastic/sfx/clock', at: T.wait2, db: -22, len: 3},
  {f: 'lightning/sfx/spark', at: T.lecp + 0.6, db: -20},
  {f: I('stamp'), at: T.nobodySw + 0.3, db: -13},
  {f: 'lightning/sfx/ding', at: T.gliese + 0.4, db: -18},
  {f: 'bbstream/sfx/ping', at: REPLY_AT, db: -12},
  ...CALLS.flatMap(([c, h]) => [
    {f: I('crack'), at: c, db: -16},
    {f: 'lightning/sfx/ding', at: h, db: -20},
  ]),
  {f: I('pop'), at: VO_END + 0.35, db: -16},
];

export const VoyagerLong: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  const endT = VO_END + 0.3;
  return (
    <AbsoluteFill style={{backgroundColor: SPACE}} ref={root}>
      {t < endT ? <Scene t={t} /> : <EndCard t={t} t0={endT} />}
      {t < endT && <ReplyTimer t={t} />}
      {t < endT && <CallsHud t={t} />}
      {t < endT && <ChapterCard t={t} />}
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Sequence from={Math.round(VO_OFFSET * FPS)} layout="none">
        <Audio src={staticFile('voyagerlong/vo/vo.wav')} />
      </Sequence>
      <Sequence from={Math.round(VO_OFFSET * FPS)} layout="none">
        <Audio src={staticFile('voyagerlong/music/music.wav')} />
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

// Contact-sheet helper for QA (not used in the render).
export const VL_H = H;
