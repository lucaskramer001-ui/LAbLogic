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

// "Why don't we just wall off the real Vice City?" (GTA 6 launch-day tie-in) - Short, 1080x1920, 1080p, cover is the
// separate Still ViceCover. No game logos or game art: only the names, used factually. Main characters: the Wave
// (Higgsfield sprite + code face) and the pastel Miami backdrop (Higgsfield).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const SEA = '#2D9CDB';
const SEA_D = '#1F6FA8';
const LIME = '#E9D9A6';
const LIME_D = '#C9B57A';
const ROAD = '#5A5F66';

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

// Main character: the Wave (Higgsfield sprite public/vicecity/wave.png 954x952, curls to the left, base at y 944)
// with a code face. Bottom centre (x, y), ~400 px tall at s=1.
const Wave: React.FC<{x: number; y: number; s?: number; t?: number; mood?: Mood; sx?: number; sy?: number; seed?: number; look?: {x: number; y: number}}> = ({x, y, s = 1, t = 0, mood = 'smug', sx = 1, sy = 1, seed = 0, look}) => {
  const surge = 1 + 0.03 * Math.sin(t * 2.6 + seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * 0.42 * sx} ${s * 0.42 * sy * surge}) rotate(${Math.sin(t * 1.8 + seed) * 2}) translate(-500 -944)`}>
      <image href={staticFile('vicecity/wave.png')} x={0} y={0} width={954} height={952} />
      <Face x={640} y={560} s={1.45} mood={mood} open={blink(t, seed)} look={look} gap={44} />
    </g>
  );
};

// Pastel Miami backdrop (Higgsfield, 1080x1920; sea starts around y 1290).
const Miami: React.FC<{dim?: number}> = ({dim = 0}) => (
  <g>
    <image href={staticFile('vicecity/miami.jpg')} x={0} y={0} width={1080} height={1920} />
    {dim > 0 && <rect x={0} y={0} width={1080} height={1920} fill="#000" opacity={dim} />}
  </g>
);

// Flood water rising over the street: level 0..1 (0 = none).
const Flood: React.FC<{y: number; level: number; t: number}> = ({y, level, t}) =>
  level <= 0.01 ? null : (
    <g>
      <path
        d={`M -100 ${y - level * 120 + Math.sin(t * 3) * 6} ${Array.from({length: 12}).map((_, i) => `Q ${-10 + i * 110} ${y - level * 120 - 16 + Math.sin(t * 3 + i) * 6} ${40 + i * 110} ${y - level * 120 + Math.sin(t * 3 + i) * 6}`).join(' ')} L 1200 2100 L -100 2100 Z`}
        fill={SEA}
        opacity={0.85}
        stroke={C.ink}
        strokeWidth={6}
      />
    </g>
  );

// Concrete seawall (bottom centre), h = visible height.
const SeaWall: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) =>
  h <= 1 ? null : (
    <g>
      <rect x={x - w / 2 + 10} y={y - h + 10} width={w} height={h} fill={C.ink} />
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill="#B9BEC4" stroke={C.ink} strokeWidth={INK_W} />
      {Array.from({length: Math.floor(w / 120)}).map((_, i) => (
        <line key={i} x1={x - w / 2 + (i + 1) * 120} x2={x - w / 2 + (i + 1) * 120} y1={y - h} y2={y} stroke="#8E959C" strokeWidth={6} />
      ))}
      <rect x={x - w / 2} y={y - h} width={w} height={22} fill="#D5D9DD" stroke={C.ink} strokeWidth={5} />
    </g>
  );

// Dutch windmill (bottom centre).
const Windmill: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 0 L -50 -260 L 50 -260 L 70 0 Z" fill="#C0533A" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -60 -260 L 0 -320 L 60 -260 Z" fill="#6B3E2E" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-22} y={-70} width={44} height={70} rx={20} fill={C.ink} />
    <g transform={`translate(0 -250) rotate(${t * 60})`}>
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <rect x={-10} y={-200} width={20} height={200} fill="#8A5A3B" stroke={C.ink} strokeWidth={5} />
          <rect x={10} y={-190} width={44} height={150} fill="#FFF8E7" stroke={C.ink} strokeWidth={5} />
        </g>
      ))}
      <circle r={16} fill={C.ink} />
    </g>
  </g>
);

// Cross-section of porous limestone (Swiss cheese) between y0 and y1.
const Limestone: React.FC<{y0: number; y1: number; wet?: number; t?: number}> = ({y0, y1, wet = 0, t = 0}) => (
  <g>
    <rect x={-200} y={y0} width={1480} height={y1 - y0} fill={LIME} stroke={C.ink} strokeWidth={INK_W} />
    {Array.from({length: 34}).map((_, i) => {
      const cx = (rnd(i) * 1180) - 50;
      const cy = y0 + 30 + rnd(i + 40) * (y1 - y0 - 60);
      const r = 18 + rnd(i + 80) * 26;
      const fill = wet > 0 && cx > 1180 - wet * 1300 ? SEA : LIME_D;
      return <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.75} fill={fill} stroke={C.ink} strokeWidth={4} opacity={fill === SEA ? 0.9 + 0.1 * Math.sin(t * 4 + i) : 1} />;
    })}
  </g>
);

// Street with a palm and a car on top of a cross-section (ground line y).
const Street: React.FC<{y: number}> = ({y}) => (
  <g>
    <rect x={-200} y={y - 40} width={1480} height={40} fill={ROAD} stroke={C.ink} strokeWidth={6} />
    {Array.from({length: 8}).map((_, i) => <rect key={i} x={i * 160} y={y - 23} width={70} height={8} fill="#F4D35E" />)}
  </g>
);

// Water pump (bottom centre) blasting water to the right when on.
const Pump: React.FC<{x: number; y: number; s?: number; t: number; on: number}> = ({x, y, s = 1, t, on}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-150} width={160} height={150} rx={18} fill="#4FA3D1" stroke={C.ink} strokeWidth={INK_W} />
    <circle cx={0} cy={-80} r={42} fill="#DDE4E8" stroke={C.ink} strokeWidth={6} />
    <g transform={`translate(0 -80) rotate(${t * 720 * on})`}>
      {[0, 120, 240].map((a) => <rect key={a} x={-6} y={-36} width={12} height={36} rx={4} fill={C.ink} transform={`rotate(${a})`} />)}
    </g>
    <rect x={80} y={-130} width={110} height={36} fill="#9AA5AD" stroke={C.ink} strokeWidth={6} />
    {on > 0.05 &&
      Array.from({length: 6}).map((_, i) => {
        const u = (t * 1.5 + i / 6) % 1;
        return <circle key={i} cx={200 + u * 260} cy={-112 + u * u * 160 - Math.sin(u * Math.PI) * 60} r={14 * on} fill={SEA} stroke={C.ink} strokeWidth={3} />;
      })}
    <Face x={0} y={-30} s={0.32} mood="squeeze" open={blink(t, 4)} gap={30} />
  </g>
);

// Simple car (bottom centre), splash when moving through water.
const Car: React.FC<{x: number; y: number; s?: number; color?: string; splash?: number; t?: number}> = ({x, y, s = 1, color = '#F07AA8', splash = 0, t = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -150 -40 L -120 -100 L 60 -100 L 110 -40 L 150 -36 L 150 -10 L -150 -10 Z" fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -100 -90 L -80 -55 L 0 -55 L 0 -90 Z M 15 -90 L 15 -55 L 85 -55 L 55 -90 Z" fill="#BFE6F5" stroke={C.ink} strokeWidth={5} />
    {[-90, 90].map((wx) => <circle key={wx} cx={wx} cy={-10} r={30} fill={C.ink} stroke="#555" strokeWidth={8} />)}
    {splash > 0 &&
      [0, 1, 2, 3].map((i) => {
        const u = (t * 2 + i / 4) % 1;
        return <path key={i} d="M 0 0 Q 10 -20 0 -40 Q -10 -20 0 0 Z" transform={`translate(${-170 - u * 120} ${-20 - Math.sin(u * Math.PI) * 90}) rotate(${-40 - u * 30}) scale(${1.4 * splash})`} fill={SEA} stroke={C.ink} strokeWidth={3} />;
      })}
  </g>
);

// Water glass with salt crystals when salty.
const Glass: React.FC<{x: number; y: number; s?: number; salt: number}> = ({x, y, s = 1, salt}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 -220 L 70 -220 L 55 0 L -55 0 Z" fill="#EAF6FC" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -64 -160 L 64 -160 L 55 -6 L -55 -6 Z" fill={salt > 0.5 ? '#9BC7A8' : '#8FD3F2'} />
    {salt > 0.05 && Array.from({length: 7}).map((_, i) => <rect key={i} x={-45 + rnd(i) * 80} y={-140 + rnd(i + 9) * 120} width={14} height={14} fill="#fff" stroke={C.ink} strokeWidth={3} transform={`rotate(45 ${-38 + rnd(i) * 80} ${-133 + rnd(i + 9) * 120})`} opacity={salt} />)}
    <Face x={0} y={-80} s={0.34} mood={salt > 0.5 ? 'scared' : 'happy'} gap={30} />
  </g>
);

// Tide gauge ruler on the right, level 0..1.
const Gauge: React.FC<{x: number; y: number; h: number; level: number}> = ({x, y, h, level}) => (
  <g>
    <rect x={x - 30} y={y - h} width={60} height={h} fill="#fff" stroke={C.ink} strokeWidth={6} />
    {Array.from({length: 10}).map((_, i) => <line key={i} x1={x - 30} x2={x + (i % 2 ? 0 : 14)} y1={y - (i + 1) * (h / 11)} y2={y - (i + 1) * (h / 11)} stroke={C.ink} strokeWidth={5} />)}
    <rect x={x - 26} y={y - h * level} width={52} height={h * level} fill={SEA} opacity={0.8} />
  </g>
);

// Game controller (generic, no brand) for the payoff.
const Pad: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -160 -40 Q -170 -90 -110 -90 L 110 -90 Q 170 -90 160 -40 L 190 70 Q 200 120 150 110 L 90 40 L -90 40 L -150 110 Q -200 120 -190 70 Z" fill="#3B3F46" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -120 -40 h 22 v -22 h 22 v 22 h 22 v 22 h -22 v 22 h -22 v -22 h -22 Z" fill="#D5D9DD" />
    {[[100, -55, C.yellow], [130, -25, C.red], [70, -25, C.green], [100, 5, '#5DB7F5']].map(([bx, by, c], i) => <circle key={i} cx={bx as number} cy={by as number} r={14} fill={c as string} stroke={C.ink} strokeWidth={4} />)}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  hook: 0,
  fix: ph('the netherlands') - 0.05,
  ground: ph('the first problem') - 0.05,
  sunny: ph("that's why") - 0.05,
  water: ph('the second problem') - 0.05,
  worse: ph("and it's getting worse") - 0.05,
  beach: ph('so miami beach') - 0.05,
  final: ph('in the game') - 0.05,
  end: VO_END + 0.3,
};

// Separate cover (Still "ViceCover"): "REAL VICE CITY / IS FLOODING?!" over the pastel beachfront.
export const ViceCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#F2A65A'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Miami />
      <Flood y={1560} level={1.2} t={0.4} />
      <Car x={560} y={1560} s={1.15} splash={1} t={0.3} />
      <Wave x={900} y={1700} s={1.2} t={0.4} mood="smug" look={{x: -0.8, y: 0.2}} />
      <RedCircle x={560} y={1450} r={210} />
    </svg>
    <BigSci pose="shocked" x={150} y={1420} headR={105} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={530} text="REAL VICE CITY" size={104} />
        <BigText x={540} y={730} text="IS FLOODING?!" size={128} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);

// HOOK (frame 0): pastel Miami at sunset, sunny-day flood creeps over the street, the Wave pops up smug.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const gtaT = ph('gta 6');
  const miT = ph('miami');
  const flT = ph('floods on sunny');
  const wallT = ph('wall it off');
  const flood = lerp(0.15, 0.35, ease(t, 0, flT - 0.3, (u) => u)) + 0.75 * ease(t, flT - 0.3, flT + 1.4);
  const sh = camShake(t, [[gtaT, 10], [wallT, 8]]);
  return (
    <Stage cam={{s: lerp(1.12, 1, ease(t, 0, 1.6)), x: 540 + sh.x, y: 960 + sh.y}}>
      <Layer>
        <Miami />
        <Flood y={1340} level={flood * 1.1} t={t} />
        {t > flT - 0.4 && <Wave x={700} y={1500} s={1.25 * springIn(t, flT - 0.4, 0.6, 10)} t={t} mood="smug" look={{x: -0.6, y: 0}} />}
        {t > gtaT - 0.1 && t < miT - 0.1 && <BigText x={540} y={560} text="GTA 6" size={150 * slam(t, gtaT - 0.1)} fill={C.yellow} />}
        {t > miT - 0.1 && t < wallT - 0.1 && <BigText x={540} y={560} text="REAL VICE CITY" size={88 * springIn(t, miT - 0.1, 0.5, 9)} fill={C.paper} />}
        {t > wallT - 0.1 && <BigText x={540} y={560} text="WALL IT OFF?" size={110 * slam(t, wallT - 0.1)} fill={C.yellow} />}
        <Pill x={540} y={300} text="VICE CITY = MIAMI" s={span(t, 0.1, flT - 0.3)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="FLOODING ON SUNNY DAYS" s={pop(t, flT - 0.3)} bg="#F07AA8" fg={C.ink} size={48} />
      </Layer>
    </Stage>
  );
};

// Obvious fix: the Netherlands holds back the sea with walls -> build one around Miami. Problem gone. Right?
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const buildT = ph('build one');
  const goneT = ph('problem is gone');
  const rightT = ph('right');
  const nl = t < buildT;
  const wallH = lerp(0, 330, ease(t, buildT, buildT + 0.8, (u) => 1 - Math.pow(1 - u, 3)));
  const bonk = [t0 + 1.2, t0 + 2.6, buildT + 1.2];
  const recoil = bonk.reduce((n, b) => n + jiggle(t, b, 30, 5, 6), 0);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        {nl ? (
          <g>
            <Sky />
            <rect x={-200} y={1150} width={1480} height={900} fill="#8BC86A" stroke={C.ink} strokeWidth={INK_W} />
            <Windmill x={250} y={1150} s={1.1} t={t} />
            <SeaWall x={600} y={1340} w={140} h={420} />
            <rect x={670} y={1000} width={600} height={1000} fill={SEA} stroke={C.ink} strokeWidth={INK_W} />
            <Wave x={860 + recoil} y={1260} s={0.85} t={t} mood="worried" look={{x: -0.7, y: 0}} />
          </g>
        ) : (
          <g>
            <Miami />
            <SeaWall x={540} y={1560} w={1300} h={wallH} />
            <Wave x={820 + recoil} y={1650} s={1.0} t={t} mood={t > rightT ? 'smug' : 'worried'} look={{x: -0.6, y: -0.2}} />
          </g>
        )}
        {t > goneT - 0.05 && t < rightT - 0.05 && <BigText x={540} y={600} text="PROBLEM GONE!" size={88 * springIn(t, goneT - 0.05, 0.5, 9)} fill={C.yellow} />}
        {t > rightT - 0.05 && <BigText x={540} y={600} text="RIGHT?" size={150 * springIn(t, rightT - 0.05, 0.5, 9)} fill={C.paper} />}
        <Pill x={540} y={300} text="THE NETHERLANDS: WALLS" s={span(t, t0 + 0.1, buildT)} bg="#FF9F1C" size={50} />
        <Pill x={540} y={300} text="BUILD ONE AROUND MIAMI" s={pop(t, buildT)} bg={C.green} size={50} />
      </Layer>
      {!nl && <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'present'], [goneT, 'thumbs'], [rightT, 'think']]} />}
    </Stage>
  );
};

// Problem 1: the ground. Limestone full of holes; at high tide seawater pushes up from underneath; goes under the wall.
const GroundScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.ground;
  const limeT = ph('limestone');
  const tideT = ph('at high tide');
  const upT = ph('pushes up');
  const stopT = ph('a wall stops');
  const underT = ph('goes under');
  const wet = ease(t, tideT, underT + 0.6, (u) => u);
  const puddle = ease(t, upT + 0.4, underT + 0.8);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#F6B783" />
        <Sun x={180} y={520} r={70} t={t} />
        <Limestone y0={900} y1={1700} wet={wet} t={t} />
        <Street y={900} />
        {/* city on the left, sea on the right */}
        {[100, 280].map((bx, i) => (
          <rect key={bx} x={bx} y={900 - 40 - 260 - i * 60} width={150} height={260 + i * 60} fill={i ? '#B9E4C9' : '#F7B2C8'} stroke={C.ink} strokeWidth={6} />
        ))}
        <rect x={860} y={760} width={400} height={1000} fill={SEA} stroke={C.ink} strokeWidth={INK_W} opacity={0.95} />
        <SeaWall x={820} y={1080} w={70} h={380} />
        <Wave x={915} y={770} s={0.55} t={t} mood={t > stopT ? 'smug' : 'happy'} />
        {t > tideT &&
          Array.from({length: 5}).map((_, i) => {
            const u = clamp((t - tideT - i * 0.3) / 2.2);
            if (u <= 0) return null;
            const x = lerp(840, 200 + i * 120, u);
            const y = lerp(1300, 940, Math.max(0, u * 1.4 - 0.4)) + Math.sin(u * Math.PI) * 120;
            return <Arrow key={i} x1={x + 40} y1={y + 60} x2={x} y2={y} color="#8FD3F2" w={12} head={30} />;
          })}
        {puddle > 0 && [220, 420, 600].map((px, i) => <ellipse key={px} cx={px} cy={872} rx={80 * puddle} ry={14 * puddle} fill={SEA} stroke={C.ink} strokeWidth={4} opacity={0.9} />)}
        {t > limeT - 0.1 && t < tideT && <Stamp x={540} y={1280} text="SWISS CHEESE" s={springIn(t, limeT + 1.6, 0.5, 10)} rot={-5} color={C.ink} />}
        <Pill x={540} y={300} text="PROBLEM 1: THE GROUND" s={span(t, t0 + 0.1, limeT - 0.1)} bg={C.red} fg={C.paper} size={52} />
        <Pill x={540} y={300} text="LIMESTONE FULL OF HOLES" s={span(t, limeT - 0.1, tideT)} bg={LIME} size={48} />
        <Pill x={540} y={300} text="SEAWATER COMES FROM BELOW" s={span(t, tideT, underT - 0.1)} bg="#8FD3F2" size={44} />
        <Pill x={540} y={300} text="IT GOES UNDER THE WALL" s={pop(t, underT - 0.1)} bg={C.yellow} size={48} />
      </Layer>
    </Stage>
  );
};

// Some streets flood with no storm at all.
const SunnyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.sunny;
  const nsT = ph('no storm');
  return (
    <Stage cam={{s: punch(t, t0) * lerp(1, 1.06, ease(t, t0, S.water))}}>
      <Layer>
        <Miami />
        <Flood y={1360} level={lerp(0.6, 1.2, ease(t, t0, S.water, (u) => u))} t={t} />
        <Car x={lerp(-150, 520, ease(t, t0, t0 + 1.4))} y={1400} s={1.2} splash={1} t={t} color="#7DD3C0" />
        {t > nsT - 0.1 && <Stamp x={540} y={600} text="NO STORM!" s={springIn(t, nsT - 0.1, 0.5, 10)} />}
        <Pill x={540} y={300} text="SUNNY DAY FLOODING" s={pop(t, t0 + 0.1)} bg={C.yellow} size={54} />
      </Layer>
    </Stage>
  );
};

// Problem 2: drinking water. Aquifer under the city; as the sea rises, salt water creeps in.
const WaterScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.water;
  const aqT = ph('aquifer');
  const saltT = ph('salt water');
  const creep = ease(t, saltT - 0.4, S.worse, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#F6B783" />
        <rect x={-200} y={900} width={1480} height={1100} fill={LIME} stroke={C.ink} strokeWidth={INK_W} />
        <Street y={900} />
        {t > aqT - 0.1 && (
          <g opacity={springIn(t, aqT - 0.1, 0.6)}>
            <rect x={-200} y={1080} width={1480} height={300} fill="#8FD3F2" stroke={C.ink} strokeWidth={6} />
            <text x={300} y={1250} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={54} fill={C.paper} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
              FRESH WATER
            </text>
          </g>
        )}
        {t > saltT - 0.4 && (
          <g>
            <path d={`M 1280 1080 L ${lerp(1180, 520, creep)} 1380 L 1280 1380 Z`} fill="#3B7A57" stroke={C.ink} strokeWidth={6} />
            <text x={1010} y={1340} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={50} fill={C.paper} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill" opacity={creep > 0.3 ? 1 : 0}>
              SALT
            </text>
          </g>
        )}
        <Glass x={420} y={850} s={1.5 * springIn(t, t0 + 0.3, 0.6)} salt={creep} />
        <path d="M 430 860 L 430 1080" stroke="#9AA5AD" strokeWidth={22} />
        <path d="M 430 860 L 430 1080" stroke={C.ink} strokeWidth={4} fill="none" strokeDasharray="8 10" />
        <Wave x={840} y={880} s={0.95} t={t} mood="smug" look={{x: -0.7, y: 0.4}} />
        <Pill x={540} y={300} text="PROBLEM 2: DRINKING WATER" s={span(t, t0 + 0.1, saltT - 0.4)} bg={C.red} fg={C.paper} size={46} />
        <Pill x={540} y={300} text="SALT CREEPS INTO IT" s={pop(t, saltT - 0.4)} bg="#3B7A57" fg={C.paper} size={52} />
      </Layer>
    </Stage>
  );
};

// It's getting worse: 10-17 inches higher by 2040 than in 2000.
const WorseScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.worse;
  const inT = ph('ten to seventeen');
  const yrT = ph('twenty forty');
  const lvl = lerp(0.25, 0.75, ease(t, inT, yrT + 1.0));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Miami dim={0.1} />
        <Flood y={1700} level={lvl * 3} t={t} />
        <Gauge x={900} y={1500} h={700} level={lvl} />
        <Wave x={560} y={1640 - lvl * 300} s={1.2} t={t} mood="smug" />
        {t > inT - 0.1 && <BigText x={420} y={560} text="+10-17 IN" size={110 * slam(t, inT - 0.1)} fill={C.yellow} />}
        {t > yrT - 0.1 && <Calendar x={820} y={560} s={0.5 * springIn(t, yrT - 0.1, 0.5)} label="2040" flip={0} />}
        <Pill x={540} y={300} text="AND IT'S GETTING WORSE" s={span(t, t0 + 0.1, inT - 0.1)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={540} y={300} text="BY 2040 (VS. 2000)" s={pop(t, inT - 0.1)} bg={C.paper} size={54} />
      </Layer>
    </Stage>
  );
};

// Miami Beach: ~$400 million for pumps, valves and raised roads; some streets up by more than 2 feet.
const BeachScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.beach;
  const moneyT = ph('four hundred');
  const pumpT = ph('pumps');
  const roadT = ph('raised roads');
  const feetT = ph('some streets went');
  const on = ease(t, pumpT - 0.2, pumpT + 0.4);
  const rise = ease(t, roadT, feetT + 1.2);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Miami />
        <Flood y={1400} level={lerp(1, 0.2, on)} t={t} />
        <g transform={`translate(0 ${-rise * 140})`}>
          <rect x={-200} y={1300} width={1480} height={60} fill={ROAD} stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 8}).map((_, i) => <rect key={i} x={i * 160} y={1324} width={70} height={10} fill="#F4D35E" />)}
          <rect x={-200} y={1360} width={1480} height={rise * 140 + 4} fill="#9AA5AD" stroke={C.ink} strokeWidth={6} />
        </g>
        {t > pumpT - 0.2 && <Pump x={250} y={1300 - rise * 140} s={1.5 * springIn(t, pumpT - 0.2, 0.6)} t={t} on={on} />}
        {t > feetT && (
          <g>
            <Arrow x1={900} y1={1300} x2={900} y2={1300 - rise * 140 - 10} color={C.yellow} w={16} head={36} />
            <BigText x={780} y={1080} text="+2 FT" size={90 * springIn(t, feetT + 0.4, 0.5, 9)} fill={C.yellow} />
          </g>
        )}
        {t > moneyT - 0.1 && t < feetT && <BigText x={540} y={600} text="$400 MILLION" size={110 * slam(t, moneyT - 0.1)} fill={C.green} />}
        <Pill x={540} y={300} text="MIAMI BEACH'S PLAN" s={span(t, t0 + 0.1, pumpT - 0.2)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="PUMPS + RAISED ROADS" s={pop(t, pumpT - 0.2)} bg={C.yellow} size={52} />
      </Layer>
    </Stage>
  );
};

// Payoff: in the game you drive through the flood; in real life Vice City has to rise with the sea.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const realT = ph('in real life');
  const riseT = ph('rise with');
  const up = ease(t, riseT - 0.2, riseT + 1.2);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        {t < realT ? (
          <g>
            <Sunburst t={t} cx={540} cy={900} />
            <Flood y={1000} level={0.4} t={t} />
            <Car x={lerp(1250, -250, ease(t, t0 + 0.4, realT, (u) => u))} y={960} s={1.1} splash={1} t={t} color="#F07AA8" />
            <Pad x={540} y={1250} s={1.6 * springIn(t, t0 + 0.1, 0.6)} />
          </g>
        ) : (
          <g>
            <g transform={`translate(0 ${-up * 160})`}>
              <Miami />
            </g>
            <Flood y={1500} level={1} t={t} />
            <Wave x={820} y={1600} s={1.0} t={t} mood={up > 0.5 ? 'surprised' : 'smug'} />
            {t > riseT - 0.1 && <BigText x={540} y={560} text="RISE WITH THE SEA" size={74 * springIn(t, riseT - 0.1, 0.5, 9)} fill={C.yellow} />}
          </g>
        )}
        <Pill x={540} y={300} text="IN THE GAME: JUST DRIVE" s={span(t, t0 + 0.1, realT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="IN REAL LIFE..." s={pop(t, realT)} bg={C.yellow} size={56} />
      </Layer>
      {t > realT && <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'point']]} />}
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
  [S.ground, GroundScene],
  [S.sunny, SunnyScene],
  [S.water, WaterScene],
  [S.worse, WorseScene],
  [S.beach, BeachScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// All sounds reused from earlier episodes (0 new SFX credits). len cuts a bed off with a fade.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.fix, S.ground, S.sunny, S.water, S.worse, S.beach, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: I('ocean'), at: 0, db: -26, len: S.fix},
  {f: I('stamp'), at: ph('gta 6') - 0.1, db: -12},
  {f: I('splash'), at: ph('floods on sunny') - 0.4, db: -16},
  {f: I('stamp'), at: ph('wall it off') - 0.1, db: -13},
  {f: I('bonk'), at: S.fix + 1.2, db: -18},
  {f: I('bonk'), at: S.fix + 2.6, db: -18},
  {f: 'core/sfx/snap', at: ph('build one'), db: -16},
  {f: I('bonk'), at: ph('build one') + 1.2, db: -16},
  {f: I('pop'), at: ph('problem is gone') - 0.08, db: -20},
  {f: 'sleep/sfx/dizzy', at: ph('right') - 0.05, db: -20},
  {f: I('stamp'), at: ph('limestone') + 1.6, db: -16},
  {f: I('drip'), at: ph('pushes up'), db: -16},
  {f: I('drip'), at: ph('pushes up') + 0.7, db: -18},
  {f: I('splash'), at: ph('goes under'), db: -16},
  {f: I('splash'), at: S.sunny + 0.4, db: -14},
  {f: I('stamp'), at: ph('no storm') - 0.1, db: -12},
  {f: I('pop'), at: ph('aquifer') - 0.13, db: -20},
  {f: 'mosquito/sfx/gulp', at: ph('salt water'), db: -16},
  {f: 'titanic/sfx/deep', at: S.worse, db: -26, len: S.beach - S.worse},
  {f: I('stamp'), at: ph('ten to seventeen') - 0.1, db: -13},
  {f: I('pages'), at: ph('twenty forty') - 0.1, db: -18},
  {f: 'bbstream/sfx/cash', at: ph('four hundred') - 0.1, db: -14},
  {f: 'plastic/sfx/factory', at: ph('pumps') - 0.2, db: -14},
  {f: 'titanic/sfx/winch', at: ph('raised roads'), db: -16},
  {f: 'lightning/sfx/ding', at: ph('some streets went') + 0.4, db: -18},
  {f: I('splash'), at: S.final + 0.6, db: -16},
  {f: 'titanic/sfx/winch', at: ph('rise with') - 0.2, db: -16},
  {f: I('pop'), at: ph('rise with') - 0.13, db: -18},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const ViceShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: '#F2A65A'}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t >= S.end} />
      <Sequence from={Math.round(0.05 * FPS)} layout="none">
        <Audio src={staticFile('vicecity/vo/vo.wav')} />
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
