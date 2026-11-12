import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, FONT_DISPLAY, Face, INK_W, Pill, PriceTag, Puffs, Sky, Sunburst, Thermo} from '../iceberg/art';
import {clamp, easeOutBack, easeOutCubic, lerp, pop, prog, shake} from '../iceberg/anim';
import {Arrow, Stamp, Sun} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';
import {PowerPlant} from '../lightning/Main';

// "Why don't we just drill to Earth's core for energy?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Hook lands in the first 2 s: cut to the glowing core, "5,000°C" slams on the word "furnace" (~2.0 s).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const CRUST = '#8B5E3C';
const MANTLE = '#E8763A';
const OUTER = '#FF9E2C';
const INNER = '#FFE14D';
const LAVA = '#FF6A1A';
const NIGHT = '#2A1E2E';
const RAY_N = '#45304A';

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

// Earth cut in half (cross-section), centre x, y, radius r. The inner core has a face.
export const EarthCut: React.FC<{x: number; y: number; r: number; t: number; mood?: React.ComponentProps<typeof Face>['mood']; glow?: number}> = ({x, y, r, t, mood = 'smug', glow = 1}) => {
  const pulse = 1 + 0.04 * Math.sin(t * 4);
  return (
    <g>
      {glow > 0 && <circle cx={x} cy={y} r={r * 1.18 * pulse} fill={INNER} opacity={0.18 * glow} />}
      <circle cx={x + 10} cy={y + 10} r={r} fill={C.ink} />
      <circle cx={x} cy={y} r={r} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
      <path d={`M ${x - r * 0.5} ${y - r * 0.82} q ${r * 0.2} ${-r * 0.1} ${r * 0.35} ${r * 0.05} q ${-r * 0.1} ${r * 0.1} ${-r * 0.35} -${r * 0.05} Z`} fill="#8CCB6B" />
      <circle cx={x} cy={y} r={r * 0.95} fill={CRUST} stroke={C.ink} strokeWidth={5} />
      <circle cx={x} cy={y} r={r * 0.9} fill={MANTLE} stroke={C.ink} strokeWidth={5} />
      <circle cx={x} cy={y} r={r * 0.55} fill={OUTER} stroke={C.ink} strokeWidth={5} />
      <circle cx={x} cy={y} r={r * 0.3 * pulse} fill={INNER} stroke={C.ink} strokeWidth={INK_W} />
      <Face x={x} y={y + r * 0.02} s={(r / 520) * 1.3} mood={mood} />
    </g>
  );
};

// Drilling rig (bottom centre x, y).
const Rig: React.FC<{x: number; y: number; s?: number; t: number; on?: boolean}> = ({x, y, s = 1, t, on}) => {
  const j = on ? Math.sin(t * 60) * 2 : 0;
  return (
    <g transform={`translate(${x + j} ${y}) scale(${s})`}>
      <path d="M -70 0 L -20 -260 L 20 -260 L 70 0" fill="none" stroke={C.ink} strokeWidth={14} strokeLinejoin="round" />
      <path d="M -70 0 L -20 -260 L 20 -260 L 70 0" fill="none" stroke={C.red} strokeWidth={7} strokeLinejoin="round" />
      {[-180, -110, -50].map((yy) => (
        <line key={yy} x1={-58 + (yy + 180) * 0.12} x2={58 - (yy + 180) * 0.12} y1={yy + 140} y2={yy + 140} stroke={C.ink} strokeWidth={6} />
      ))}
      <rect x={-50} y={-300} width={100} height={46} rx={10} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-110} y={-40} width={220} height={40} rx={8} fill="#6E7378" stroke={C.ink} strokeWidth={INK_W} />
    </g>
  );
};

// Drill bit with a face (tip at x, y pointing down).
const Bit: React.FC<{x: number; y: number; s?: number; mood?: React.ComponentProps<typeof Face>['mood']; hot?: number; broken?: boolean}> = ({x, y, s = 1, mood = 'happy', hot = 0, broken}) => {
  const col = hot > 0.5 ? '#FF8A5C' : '#C3CED6';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-22} y={-420} width={44} height={180} fill="#8E9BA5" stroke={C.ink} strokeWidth={6} />
      <g transform={broken ? 'translate(40 20) rotate(35)' : ''}>
        <path d="M -80 -240 L 80 -240 L 80 -120 L 0 0 L -80 -120 Z" fill={col} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        {[-150, -100].map((yy) => (
          <path key={yy} d={`M -80 ${yy} L 80 ${yy - 40}`} stroke={C.ink} strokeWidth={5} />
        ))}
        <Face x={0} y={-170} s={0.6} mood={mood} />
      </g>
    </g>
  );
};

// Ground cross-section from y0 down, with a hole of depth d (px) at x.
const Ground: React.FC<{y0: number; holeX?: number; depth?: number; hot?: number}> = ({y0, holeX, depth = 0, hot = 0}) => (
  <g>
    <rect x={-400} y={y0} width={1880} height={2400} fill={CRUST} />
    <rect x={-400} y={y0 + 500} width={1880} height={2400} fill="#7A4E30" />
    <rect x={-400} y={y0 + 1000} width={1880} height={2400} fill={hot > 0 ? '#A14A2A' : '#6A422A'} />
    <rect x={-400} y={y0 - 40} width={1880} height={40} fill="#8CCB6B" />
    <line x1={-400} x2={1480} y1={y0 - 40} y2={y0 - 40} stroke={C.ink} strokeWidth={INK_W} />
    {holeX !== undefined && depth > 0 && <rect x={holeX - 18} y={y0} width={36} height={depth} fill="#1A1210" />}
  </g>
);

// Spinning turbine (centre x, y).
const Turbine: React.FC<{x: number; y: number; s?: number; t: number; spin?: number}> = ({x, y, s = 1, t, spin = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={110} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    <g transform={`rotate(${t * 360 * spin})`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} transform={`rotate(${i * 60})`} d="M 0 0 Q 30 -40 10 -95 Q -20 -60 0 0 Z" fill={C.teal} stroke={C.ink} strokeWidth={5} />
      ))}
    </g>
    <circle r={18} fill={C.ink} />
  </g>
);

// Magma blob with a face.
const Magma: React.FC<{x: number; y: number; s?: number; t: number; mood?: React.ComponentProps<typeof Face>['mood']}> = ({x, y, s = 1, t, mood = 'surprised'}) => {
  const w = 1 + 0.03 * Math.sin(t * 5);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * w} ${s / w})`}>
      <path d="M -220 0 Q -230 -90 -120 -110 Q -60 -170 30 -130 Q 130 -160 190 -80 Q 250 0 170 60 Q 60 110 -60 80 Q -200 80 -220 0 Z" fill={LAVA} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <path d="M -150 -30 Q -100 -80 -40 -70" stroke={INNER} strokeWidth={14} fill="none" strokeLinecap="round" />
      <Face x={20} y={-20} s={0.75} mood={mood} />
    </g>
  );
};

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: ph('standing on') - 0.05,
  core: ph("earth's inner core") - 0.05,
  fix: ph("so here's the obvious") - 0.05,
  kola: ph('the problem is') - 0.05,
  heat: ph('at the bottom') - 0.05,
  deep: ph('the core starts') - 0.05,
  twist: ph("but here's the twist") - 0.05,
  tap: ph('so we already') - 0.05,
  final: ph('the heat is free') - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover: "DEEPEST HOLE EVER: / 0.2%?!" Also the Still "CoreCover".
export const CoreCover: React.FC<{t?: number}> = ({t = 0}) => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={NIGHT} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3200;
        const cx = 640;
        const cy = 1400;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY_N} />;
      })}
      <EarthCut x={660} y={1420} r={420} t={0.4} mood="smug" />
      <line x1={660} x2={660} y1={1000} y2={1012} stroke="#1A1210" strokeWidth={10} />
      <Rig x={660} y={1004} s={0.42} t={0} />
      <RedCircle x={660} y={960} r={95} />
    </svg>
    <BigSci pose="hot" x={185} y={1240} headR={135} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={500} text="DEEPEST HOLE EVER:" size={86} />
        <BigText x={540} y={790} text="0.2%?!" size={290} fill={C.yellow} />
      </g>
      <Arrow x1={930} y1={820} x2={760} y2={930} color={C.red} w={26} head={58} />
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <CoreCover t={t} />;

// HOOK (0.3 - 6.9 s): you're standing on a 5,000-degree furnace; drill down, never pay for power. So why don't we?
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const degT = ph('five-thousand-degree');
  const furT = ph('furnace');
  const drillT = ph('drill down');
  const payT = ph('never pay');
  const whyT = ph('so why');
  const sh = t > furT && t < furT + 0.4 ? shake(t, 16 * (1 - (t - furT) / 0.4)) : {x: 0, y: 0};
  const bore = prog(t, drillT, drillT + 1.0, easeOutCubic);
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} />
        <Sunburst t={t} cx={540} cy={1120} />
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} opacity={0.55} />
        <EarthCut x={540} y={1120} r={540} t={t} mood={t > whyT ? 'happy' : 'smug'} glow={1 + pop(t, furT)} />
        {bore > 0 && <line x1={760} x2={760} y1={630} y2={630 + 260 * bore} stroke="#1A1210" strokeWidth={16} />}
        {t > drillT - 0.2 && <Rig x={760} y={640} s={0.5 * pop(t, drillT - 0.2)} t={t} on={bore < 1} />}
        {t > degT - 0.05 && <BigText x={540} y={1180} text="5,000°C" size={160 * slam(t, degT - 0.05)} fill={INNER} />}
        {t > payT && <PriceTag x={890} y={430} s={0.85 * pop(t, payT)} rot={10} text="$0" />}
        {t > whyT && <BigText x={540} y={280} text="SO WHY NOT?" size={100 * pop(t, whyT)} fill={C.yellow} />}
        <Pill x={540} y={240} text="YOU'RE STANDING ON A FURNACE" s={span(t, furT, payT)} bg={C.paper} size={44} />
      </Layer>
      <Sci t={t} x={360} y={600} headR={34} poses={[[0, 'hot'], [whyT, 'think']]} tremble={t > furT && t < furT + 0.5 ? 1 : 0} />
    </Stage>
  );
};

// The core: ~5,200 °C, about as hot as the Sun's surface, and it isn't running out.
const CoreScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.core;
  const numT = ph('five thousand two');
  const sunT = ph('surface of the sun');
  const goT = ph("isn't going");
  const cnt = prog(t, numT - 0.2, numT + 1.2, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} />
        <circle cx={300} cy={860} r={250 * (1 + 0.04 * Math.sin(t * 4))} fill={INNER} opacity={0.2} />
        <circle cx={310} cy={870} r={200} fill={C.ink} />
        <circle cx={300} cy={860} r={200} fill={INNER} stroke={C.ink} strokeWidth={INK_W} />
        <Face x={300} y={860} s={1.2} mood="smug" />
        {t > sunT - 0.2 && <Sun x={870} y={900} r={145 * pop(t, sunT - 0.2)} t={t} face={{mood: 'surprised'}} />}
        {t > sunT && <BigText x={555} y={895} text="=" size={130 * pop(t, sunT)} fill={C.paper} />}
        <Pill x={300} y={1210} text="INNER CORE" s={pop(t, t0 + 0.2)} bg={C.paper} size={44} />
        <Pill x={800} y={1210} text="SUN'S SURFACE" s={pop(t, sunT)} bg={C.paper} size={40} />
        <BigText x={540} y={560} text={`${fmt(5200 * cnt)}°C`} size={140} fill={INNER} s={pop(t, numT - 0.2)} />
        <Pill x={540} y={300} text="EARTH'S INNER CORE" s={span(t, t0 + 0.1, goT)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="AND IT'S NOT RUNNING OUT" s={pop(t, goT)} bg={C.green} size={50} />
      </Layer>
    </Stage>
  );
};

// The obvious fix: drill deep, pump water down, steam up, spin turbines.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const drillT = ph('drill a deep');
  const pumpT = ph('pump water');
  const steamT = ph('bring up steam');
  const turbT = ph('spin turbines');
  const depth = 700 * prog(t, drillT, pumpT, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Ground y0={980} holeX={330} depth={depth} hot={1} />
        <ellipse cx={330} cy={1760} rx={260} ry={120} fill={LAVA} opacity={0.85} />
        <Rig x={330} y={940} s={0.7} t={t} on={t > drillT && t < pumpT} />
        {t > pumpT &&
          Array.from({length: 5}).map((_, i) => {
            const u = ((t - pumpT) * 0.8 + i / 5) % 1;
            return <circle key={i} cx={318} cy={980 + u * 700} r={14} fill="#4FA8F0" stroke={C.ink} strokeWidth={4} />;
          })}
        {t > steamT && <Puffs x={360} y={900} t={(t - steamT) * 1.5} color="#F2F4F6" n={6} rise={240} />}
        {t > steamT && <path d="M 400 760 Q 560 640 700 760" stroke={C.ink} strokeWidth={22} fill="none" />}
        {t > steamT && <path d="M 400 760 Q 560 640 700 760" stroke="#C9CED3" strokeWidth={12} fill="none" />}
        <Turbine x={790} y={800} s={pop(t, steamT)} t={t} spin={t > turbT ? 2 : 0.3} />
        <Pill x={540} y={300} text="THE OBVIOUS FIX" s={span(t, t0 + 0.1, drillT)} size={62} />
        <Pill x={540} y={300} text="DRILL A DEEP HOLE" s={span(t, drillT, pumpT)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="PUMP WATER DOWN" s={span(t, pumpT, steamT)} bg="#9FE0FF" size={56} />
        <Pill x={540} y={300} text="STEAM SPINS TURBINES" s={pop(t, steamT)} bg={C.green} size={52} />
      </Layer>
    </Stage>
  );
};

// Kola: ~20 years, just over 12 km, about 0.2% of the way to the centre.
const KolaScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.kola;
  const kolaT = ph('kola superdeep');
  const yrsT = ph('twenty years');
  const kmT = ph('twelve kilometers');
  const pctT = ph("that's about");
  const zoom = prog(t, pctT - 0.1, pctT + 0.9, easeOutCubic);
  const depthM = 12262 * prog(t, yrsT - 0.5, kmT + 0.6, easeOutCubic);
  // bar = Earth's radius (6,371 km) from y 520 to 1420
  const top = 520;
  const len = 900;
  const kolaPx = Math.max(4, (12.262 / 6371) * len);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={NIGHT} />
        {zoom < 0.02 ? (
          <g>
            <Ground y0={760} holeX={540} depth={Math.min(560, depthM / 22)} />
            <Rig x={540} y={720} s={0.75} t={t} on={t > yrsT - 0.5 && t < kmT + 0.6} />
            {t > yrsT - 0.5 && <text x={820} y={1080} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={84} fill={C.paper} stroke={C.ink} strokeWidth={16} paintOrder="stroke fill">
              {`${fmt(depthM)} M`}
            </text>}
          </g>
        ) : (
          <g opacity={zoom}>
            <rect x={470} y={top} width={140} height={len} rx={10} fill={MANTLE} stroke={C.ink} strokeWidth={INK_W} />
            <rect x={470} y={top + len * 0.45} width={140} height={len * 0.55} rx={10} fill={OUTER} stroke={C.ink} strokeWidth={INK_W} />
            <rect x={470} y={top} width={140} height={kolaPx} fill={C.red} />
            <text x={640} y={1180} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={44} fill={INNER} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
              6,371 KM
            </text>
            <text x={640} y={1230} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill={C.paper} stroke={C.ink} strokeWidth={9} paintOrder="stroke fill">
              TO THE CENTER
            </text>
            {/* magnifier on the top of the bar: Kola's 12 km shown 40x bigger */}
            <line x1={612} y1={top + 2} x2={735} y2={610} stroke={C.ink} strokeWidth={8} />
            <g transform={`translate(840 690) scale(${pop(t, pctT + 0.2)})`}>
              <circle r={150} fill={NIGHT} stroke={C.ink} strokeWidth={12} />
              <clipPath id="mag">
                <circle r={140} />
              </clipPath>
              <g clipPath="url(#mag)">
                <rect x={-90} y={-60} width={180} height={300} fill={MANTLE} stroke={C.ink} strokeWidth={6} />
                <rect x={-90} y={-60} width={180} height={70} fill={C.red} stroke={C.ink} strokeWidth={6} />
              </g>
              <circle r={150} fill="none" stroke={C.ink} strokeWidth={14} />
              <circle r={150} fill="none" stroke={C.chrome} strokeWidth={6} />
              <line x1={106} y1={106} x2={180} y2={180} stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
            </g>
          </g>
        )}
        <Pill x={540} y={300} text="KOLA SUPERDEEP BOREHOLE" s={span(t, kolaT - 0.1, yrsT)} bg={C.paper} size={46} />
        <Pill x={540} y={300} text="RUSSIA: ~20 YEARS OF DRILLING" s={span(t, yrsT, pctT - 0.1)} bg={C.paper} size={42} />
        <Pill x={540} y={300} text="ONLY 0.2% OF THE WAY" s={pop(t, pctT)} bg={C.red} fg={C.paper} size={56} />
        <Pill x={840} y={480} text="KOLA: 12 KM" s={pop(t, pctT + 0.3)} bg={C.yellow} size={40} />
      </Layer>
      {zoom < 0.02 && <Sci t={t} x={170} y={720} headR={36} poses={[[0, 'point'], [kmT, 'thumbs']]} />}
    </Stage>
  );
};

// At the bottom: ~180 °C, almost twice the expected; heat wrecked the equipment, money ran out, project stopped.
const HeatScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.heat;
  const degT = ph('a hundred and eighty');
  const twiceT = ph('twice as hot');
  const wreckT = ph('the heat was');
  const moneyT = ph('money ran out');
  const stopT = ph('project stopped');
  const lvl = prog(t, degT - 0.2, degT + 1.0, easeOutCubic);
  const temp = 180 * lvl;
  const brokenT = wreckT + 0.6;
  const sh = t > brokenT && t < brokenT + 0.4 ? shake(t, 12 * (1 - (t - brokenT) / 0.4)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill="#5A2A1E" />
        <rect x={420} y={-400} width={160} height={1650} fill="#1A1210" />
        <Bit x={500} y={1240} s={1.15} mood={t > brokenT ? 'dizzy' : t > degT ? 'worried' : 'happy'} hot={lvl} broken={t > brokenT} />
        <Thermo x={860} y={1180} s={1.0} level={lvl} />
        {t > degT - 0.2 && <text x={860} y={620} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={84} fill={INNER} stroke={C.ink} strokeWidth={16} paintOrder="stroke fill">
          {`${Math.round(temp)}°C`}
        </text>}
        {t > brokenT && t < brokenT + 1.2 && <Puffs x={500} y={1180} t={(t - brokenT) * 2} color="#9AA3AB" n={6} rise={180} />}
        <Pill x={540} y={300} text="AT 12 KM: ~180°C" s={span(t, degT - 0.2, twiceT)} bg={C.gold} size={58} />
        <Pill x={540} y={300} text="ALMOST 2X THE FORECAST" s={span(t, twiceT, wreckT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="EQUIPMENT WRECKED" s={span(t, wreckT, moneyT)} bg={C.red} fg={C.paper} size={54} />
        <Pill x={540} y={300} text="MONEY RAN OUT" s={span(t, moneyT, stopT)} bg={C.paper} size={58} />
        {t > stopT && <Stamp x={540} y={330} text="PROJECT STOPPED" s={slam(t, stopT)} size={66} />}
      </Layer>
      <Sci t={t} x={180} y={1330} headR={40} poses={[[0, 'think'], [wreckT, 'nervous']]} tremble={t > brokenT ? 1 : 0} />
    </Stage>
  );
};

// The core starts ~2,900 km down: more than 200 times deeper than Kola.
const DeepScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.deep;
  const kmT = ph('two thousand nine');
  const moreT = ph('more than two');
  const grow = prog(t, kmT - 0.2, kmT + 1.2, easeOutCubic);
  const base = 1300;
  const full = 820;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-400} y={-400} width={1880} height={2800} fill={C.paper} />
        <line x1={120} x2={960} y1={base} y2={base} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <rect x={250} y={base - Math.max(4, full * (12.262 / 2900))} width={200} height={Math.max(4, full * (12.262 / 2900))} fill={C.red} stroke={C.ink} strokeWidth={4} />
        {grow > 0 && <rect x={630} y={base - full * grow} width={200} height={full * grow} rx={12} fill={OUTER} stroke={C.ink} strokeWidth={6} />}
        <Pill x={370} y={1220} text="KOLA: 12 KM" s={pop(t, t0 + 0.2)} bg={C.red} fg={C.paper} size={40} />
        <Pill x={730} y={base - full * grow - 60} text="CORE: ~2,900 KM" s={pop(t, kmT)} bg={OUTER} size={40} />
        <Pill x={540} y={300} text="200+ TIMES DEEPER" s={pop(t, moreT)} bg={C.yellow} size={60} />
      </Layer>
      <Sci t={t} x={95} y={base - 4} headR={30} poses={[[0, 'dizzy']]} />
    </Stage>
  );
};

// The twist: Iceland 2009 hit magma by accident ~2 km down; steam over 450 °C.
const TwistScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.twist;
  const needT = ph("you don't need");
  const yrT = ph('in 2009');
  const hitT = ph('hit magma');
  const kmT = ph('two kilometers down');
  const steamT = ph('steam came up');
  const degT = ph('four hundred fifty');
  const depth = 540 * prog(t, yrT, hitT + 0.3, easeOutCubic);
  const hit = t > hitT + 0.2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#7FC3F0" />
        <Ground y0={720} holeX={400} depth={depth} hot={1} />
        <Magma x={460} y={1340} s={1.0} t={t} mood={hit ? 'surprised' : 'smug'} />
        <Rig x={400} y={680} s={0.6} t={t} on={t > yrT && !hit} />
        {t > kmT && (
          <g>
            <line x1={160} x2={160} y1={720} y2={1260} stroke={C.ink} strokeWidth={8} />
            <line x1={130} x2={190} y1={720} y2={720} stroke={C.ink} strokeWidth={8} />
            <line x1={130} x2={190} y1={1260} y2={1260} stroke={C.ink} strokeWidth={8} />
            <BigText x={160} y={1020} text="2 KM" size={70 * pop(t, kmT)} fill={C.yellow} />
          </g>
        )}
        {t > steamT && <Puffs x={430} y={640} t={(t - steamT) * 1.6} color="#F2F4F6" n={7} rise={360} />}
        <Pill x={540} y={300} text="THE TWIST" s={span(t, t0 + 0.1, needT)} bg={C.yellow} size={64} />
        <Pill x={540} y={300} text="YOU DON'T NEED THE CORE" s={span(t, needT, yrT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="ICELAND, 2009" s={span(t, yrT, hitT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="HIT MAGMA BY ACCIDENT" s={span(t, hitT, degT - 0.1)} bg={LAVA} size={52} />
        <Pill x={760} y={480} text="450°C+ STEAM" s={pop(t, degT - 0.1)} bg={C.paper} size={54} />
      </Layer>
    </Stage>
  );
};

// We already tap Earth's heat where it comes close to the surface (geothermal plant).
const TapScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.tap;
  const closeT = ph('close to the surface');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Ground y0={1100} />
        <ellipse cx={600} cy={1420} rx={300} ry={110} fill={LAVA} opacity={0.9} />
        <PowerPlant x={600} y={1060} s={1.0 * pop(t, t0 + 0.05)} t={t} />
        <path d="M 520 1060 L 520 1360 M 680 1060 L 680 1360" stroke={C.ink} strokeWidth={14} />
        <Pill x={540} y={300} text="WE ALREADY DO THIS" s={span(t, t0 + 0.1, closeT)} bg={C.green} size={58} />
        <Pill x={540} y={300} text="WHERE HEAT IS CLOSE" s={pop(t, closeT)} bg={C.yellow} size={56} />
      </Layer>
      <Sci t={t} x={180} y={1060} headR={36} poses={[[0, 'present']]} />
    </Stage>
  );
};

// Payoff: the heat is free; the hard part is a drill that survives it.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const hardT = ph('the hard part');
  const survT = ph('survives it');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={900} />
        {t < hardT ? (
          <g>
            <EarthCut x={540} y={950} r={360 * pop(t, t0 + 0.05)} t={t} mood="happy" />
            <PriceTag x={800} y={620} s={0.9 * pop(t, t0 + 0.3)} rot={10} text="FREE" />
          </g>
        ) : (
          <Bit x={540} y={1200} s={1.5 * pop(t, hardT)} mood={t > survT ? 'dizzy' : 'worried'} hot={1} />
        )}
        <Pill x={540} y={300} text="THE HEAT IS FREE" s={span(t, t0 + 0.1, hardT)} bg={C.green} size={60} />
        <Pill x={540} y={300} text="THE DRILL IS THE HARD PART" s={pop(t, hardT)} bg={C.yellow} size={46} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'thumbs'], [hardT + 0.2, 'facepalm']]} />
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
  [S.core, CoreScene],
  [S.fix, FixScene],
  [S.kola, KolaScene],
  [S.heat, HeatScene],
  [S.deep, DeepScene],
  [S.twist, TwistScene],
  [S.tap, TapScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// len (s) cuts a bed off with a fade so it only plays while its scene is on screen.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const K = (n: string) => `core/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.core, S.fix, S.kola, S.heat, S.deep, S.twist, S.tap, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: K('boom'), at: S.hook, db: -10},
  {f: K('lava'), at: S.hook, db: -24, len: S.core - S.hook},
  {f: K('boom'), at: ph('furnace'), db: -9},
  {f: K('drill'), at: ph('drill down'), db: -20, len: 1.2},
  {f: K('drill'), at: ph('drill a deep'), db: -20, len: ph('pump water') - ph('drill a deep')},
  {f: K('steam'), at: ph('bring up steam'), db: -14},
  {f: K('drill'), at: ph('twenty years') - 0.5, db: -20, len: ph('twelve kilometers') + 0.6 - (ph('twenty years') - 0.5)},
  {f: I('stamp'), at: ph("that's about"), db: -14},
  {f: K('snap'), at: ph('the heat was') + 0.6, db: -10},
  {f: I('stamp'), at: ph('project stopped'), db: -12},
  {f: U('fail'), at: ph('more than two'), db: -18},
  {f: K('drill'), at: ph('in 2009'), db: -20, len: ph('hit magma') + 0.3 - ph('in 2009')},
  {f: K('lava'), at: ph('hit magma'), db: -18, len: S.tap - ph('hit magma')},
  {f: K('steam'), at: ph('steam came up'), db: -10},
  {f: K('lava'), at: S.tap, db: -26, len: S.final - S.tap},
  {f: U('fail'), at: ph('survives it'), db: -18},
  ...[ph('never pay'), ph('so why'), ph('five thousand two') - 0.2, ph('surface of the sun') - 0.2, ph("isn't going"), ph("so here's the obvious"), ph('pump water'), ph('kola superdeep') - 0.1, ph('twenty years'), ph('a hundred and eighty') - 0.2, ph('twice as hot'), ph('money ran out'), ph('two thousand nine'), ph("but here's the twist"), ph('in 2009'), ph('two kilometers down'), ph('four hundred fifty') - 0.1, ph('so we already'), ph('the heat is free'), ph('the hard part')].map((at) => ({
    f: I('pop'),
    at: at - 0.03,
    db: -21,
  })),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const CoreShort: React.FC = () => {
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
        <Audio src={staticFile('core/vo/vo.wav')} />
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
