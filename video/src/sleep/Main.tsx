import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Sunburst} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Stamp, TrashBag} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just stop sleeping?" - Short, 1080x1920 (rendered 4K with --scale=2).
// Hook in the first 2 s: a smug clock spins through "8 HOURS" while a bed snores (~0.9 s).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const NIGHT = '#232B4A';
const RAY_N = '#33406B';
const BRAIN = '#F4A3B4';
const BRAIN_D = '#D97F95';
const FLUID = '#6EC6F5';
const WASTE = '#8A6A3A';

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
const Bg: React.FC<{color: string}> = ({color}) => <rect x={-400} y={-400} width={1880} height={2800} fill={color} />;

// ------------------------------------------------------------------ props

type Mood = React.ComponentProps<typeof Face>['mood'];

// Alarm clock with a face (centre x, y, radius r). hours 0..12 sets the hour hand; minutes hand spins with spin.
const Clock: React.FC<{x: number; y: number; r: number; hours?: number; spin?: number; mood?: Mood; ring?: boolean; t: number}> = ({x, y, r, hours = 0, spin = 0, mood = 'smug', ring, t}) => {
  const j = ring ? Math.sin(t * 70) * 6 : 0;
  const ha = -Math.PI / 2 + (hours / 12) * Math.PI * 2;
  const ma = -Math.PI / 2 + spin * Math.PI * 2;
  return (
    <g transform={`translate(${x + j} ${y}) rotate(${j})`}>
      {[-1, 1].map((sd) => (
        <circle key={sd} cx={sd * r * 0.62} cy={-r * 0.92} r={r * 0.28} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
      ))}
      <line x1={-r * 0.6} x2={-r * 0.75} y1={r * 0.8} y2={r * 1.08} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <line x1={r * 0.6} x2={r * 0.75} y1={r * 0.8} y2={r * 1.08} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <circle cx={10} cy={10} r={r} fill={C.ink} />
      <circle r={r} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
      <circle r={r * 0.84} fill="#fff" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * r * 0.7} y1={Math.sin(a) * r * 0.7} x2={Math.cos(a) * r * 0.78} y2={Math.sin(a) * r * 0.78} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />;
      })}
      <line x1={0} y1={0} x2={Math.cos(ha) * r * 0.42} y2={Math.sin(ha) * r * 0.42} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.cos(ma) * r * 0.62} y2={Math.sin(ma) * r * 0.62} stroke={C.red} strokeWidth={8} strokeLinecap="round" />
      <Face x={0} y={r * 0.32} s={r / 330} mood={mood} />
    </g>
  );
};

// Bed (bottom centre x, y) with a sleeping lump and Zs.
const Bed: React.FC<{x: number; y: number; s?: number; t: number; z?: boolean}> = ({x, y, s = 1, t, z = true}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-230} y={-210} width={40} height={210} rx={10} fill="#8A5A34" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={190} y={-150} width={40} height={150} rx={10} fill="#8A5A34" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-200} y={-110} width={410} height={60} rx={14} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    <ellipse cx={-120} cy={-125} rx={60} ry={30} fill="#fff" stroke={C.ink} strokeWidth={6} />
    <path d={`M -80 -110 Q 0 ${-190 + Math.sin(t * 2) * 8} 180 -110 Z`} fill={C.sky} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {z &&
      [0, 1, 2].map((i) => {
        const u = ((t * 0.5 + i / 3) % 1);
        return (
          <text key={i} x={-120 + u * 120} y={-180 - u * 200} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={50 + i * 14} fill="#fff" stroke={C.ink} strokeWidth={10} paintOrder="stroke fill" opacity={1 - u}>
            Z
          </text>
        );
      })}
  </g>
);

// Giant eyeball (centre x, y, radius r). red 0..1 adds bloodshot veins, wobble when tired.
const Eye: React.FC<{x: number; y: number; r: number; red?: number; t: number; dizzy?: boolean}> = ({x, y, r, red = 0, t, dizzy}) => {
  const lx = dizzy ? Math.cos(t * 6) * r * 0.18 : 0;
  const ly = dizzy ? Math.sin(t * 6) * r * 0.18 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={10} cy={10} r={r} fill={C.ink} />
      <circle r={r} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
      {red > 0 &&
        Array.from({length: 8}).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.3;
          const r0 = r * 0.96;
          const r1 = r * (0.96 - 0.45 * red);
          return (
            <path
              key={i}
              d={`M ${Math.cos(a) * r0} ${Math.sin(a) * r0} Q ${Math.cos(a + 0.15) * (r0 + r1) / 2} ${Math.sin(a + 0.15) * (r0 + r1) / 2} ${Math.cos(a - 0.05) * r1} ${Math.sin(a - 0.05) * r1}`}
              stroke={C.red}
              strokeWidth={6}
              fill="none"
              opacity={red}
            />
          );
        })}
      <circle cx={lx} cy={ly} r={r * 0.42} fill="#4FA8F0" stroke={C.ink} strokeWidth={6} />
      <circle cx={lx} cy={ly} r={r * 0.2} fill={C.ink} />
      <circle cx={lx - r * 0.12} cy={ly - r * 0.12} r={r * 0.07} fill="#fff" />
    </g>
  );
};

// Cartoon brain with a face (centre x, y).
const Brain: React.FC<{x: number; y: number; s?: number; mood?: Mood}> = ({x, y, s = 1, mood = 'happy'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -190 20 Q -230 -80 -140 -130 Q -110 -200 -20 -180 Q 40 -220 110 -170 Q 200 -170 200 -70 Q 250 10 180 70 Q 160 140 60 130 Q 0 170 -70 130 Q -170 130 -190 20 Z" fill={C.ink} transform="translate(10 10)" />
    <path d="M -190 20 Q -230 -80 -140 -130 Q -110 -200 -20 -180 Q 40 -220 110 -170 Q 200 -170 200 -70 Q 250 10 180 70 Q 160 140 60 130 Q 0 170 -70 130 Q -170 130 -190 20 Z" fill={BRAIN} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {[
      'M -140 -60 Q -100 -90 -60 -60',
      'M 40 -120 Q 80 -90 130 -110',
      'M -150 50 Q -110 30 -80 60',
      'M 90 60 Q 130 30 170 50',
      'M 0 -170 Q 10 -130 -10 -100',
    ].map((d, i) => (
      <path key={i} d={d} stroke={BRAIN_D} strokeWidth={9} fill="none" strokeLinecap="round" />
    ))}
    <Face x={0} y={10} s={0.75} mood={mood} />
  </g>
);

// Simple rat (facing left).
const Rat: React.FC<{x: number; y: number; s?: number; mood?: Mood; rot?: number}> = ({x, y, s = 1, mood = 'worried', rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 120 20 Q 220 0 260 -60" stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M 120 20 Q 220 0 260 -60" stroke="#E8A0A8" strokeWidth={5} fill="none" strokeLinecap="round" />
    <ellipse cx={30} cy={0} rx={120} ry={70} fill="#B9BCC4" stroke={C.ink} strokeWidth={INK_W} />
    <path d="M -80 -30 L -170 10 L -80 40 Z" fill="#B9BCC4" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <circle cx={-170} cy={10} r={12} fill="#E8A0A8" stroke={C.ink} strokeWidth={4} />
    <circle cx={-40} cy={-70} r={34} fill="#E8A0A8" stroke={C.ink} strokeWidth={6} />
    <Face x={-60} y={-10} s={0.42} mood={mood} />
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  hook: 0.3,
  gain: ph('think about') - 0.05,
  gardner: ph('in 1964') - 0.05,
  drunk: ph("and you don't") - 0.05,
  wash: ph("and sleep isn't") - 0.05,
  rats: ph('and when rats') - 0.05,
  final: ph("so sleep isn't") - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover: "11 DAYS / NO SLEEP?!" Also the Still "SleepCover".
export const SleepCover: React.FC<{t?: number}> = ({t = 0.4}) => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={NIGHT} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3200;
        const cx = 720;
        const cy = 1220;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY_N} />;
      })}
      <Eye x={730} y={1220} r={260} red={1} t={t} />
      <RedCircle x={730} y={1220} r={300} />
    </svg>
    <BigSci pose="dizzy" x={185} y={1270} headR={130} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={510} text="AWAKE FOR" size={92} />
        <BigText x={540} y={760} text="11 DAYS?!" size={210} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <SleepCover t={t} />;

// HOOK: you waste about 8 hours a day asleep. One teenager stayed awake 11 days straight. So why don't we just stop?
const HookScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hook;
  const hrsT = ph('eight hours');
  const teenT = ph('one teenager');
  const daysT = ph('eleven days');
  const whyT = ph('so why');
  const spin = prog(t, t0, hrsT + 0.8, easeOutCubic) * 8;
  const day = Math.max(1, Math.round(lerp(1, 11, prog(t, teenT, daysT + 0.6, (u) => u))));
  const phase2 = t > teenT - 0.1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Bg color={NIGHT} />
        {!phase2 ? (
          <g>
            <Bed x={540} y={1250} s={1.2} t={t} z={t < hrsT - 0.1} />
            <Clock x={540} y={640} r={230} hours={spin} spin={spin} t={t} mood="smug" ring={t > hrsT && t < hrsT + 0.8} />
            {t > hrsT && <BigText x={540} y={1000} text="8 HOURS" size={130 * slam(t, hrsT)} fill={C.yellow} />}
          </g>
        ) : (
          <g>
            <Eye x={540} y={760} r={260 * pop(t, teenT - 0.1)} red={prog(t, teenT, daysT + 0.6)} t={t} />
            <Calendar x={860} y={1180} s={0.75 * pop(t, teenT)} label={String(day)} prev={String(Math.max(1, day - 1))} flip={0} />
            {t > whyT && <BigText x={540} y={380} text="SO WHY NOT STOP?" size={74 * pop(t, whyT)} fill={C.yellow} />}
          </g>
        )}
        <Pill x={540} y={240} text="EVERY SINGLE DAY" s={span(t, hrsT + 0.3, teenT - 0.1)} bg={C.paper} size={48} />
        <Pill x={300} y={1180} text="11 DAYS AWAKE" s={pop(t, daysT)} bg={C.red} fg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// The gain: 8 extra hours every day, a whole second shift of life.
const GainScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.gain;
  const xtraT = ph('eight extra');
  const shiftT = ph('second shift');
  const flip = prog(t, xtraT, xtraT + 0.6, easeOutCubic);
  const cx = 540;
  const cy = 820;
  const r = 300;
  const wedge = (a0: number, a1: number, fill: string) => {
    const p = (a: number) => `${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
    return <path d={`M ${cx} ${cy} L ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`} fill={fill} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />;
  };
  const a8 = -Math.PI / 2 + (8 / 24) * Math.PI * 2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={820} />
        <circle cx={cx + 10} cy={cy + 10} r={r} fill={C.ink} />
        {wedge(a8, -Math.PI / 2 + Math.PI * 2, '#fff')}
        {wedge(-Math.PI / 2, a8, flip > 0.5 ? C.yellow : NIGHT)}
        <text x={cx + 120} y={cy - 110} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={70} fill={flip > 0.5 ? C.ink : '#fff'}>
          {flip > 0.5 ? '+8 H' : 'ZZZ'}
        </text>
        <text x={cx - 60} y={cy + 140} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={60} fill={C.ink}>
          16 H
        </text>
        <Pill x={540} y={300} text="8 EXTRA HOURS A DAY" s={span(t, xtraT, shiftT)} bg={C.yellow} size={58} />
        <Pill x={540} y={300} text="A SECOND SHIFT OF LIFE" s={pop(t, shiftT)} bg={C.green} size={54} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'think'], [xtraT, 'cash']]} />
    </Stage>
  );
};

// Randy Gardner, 1964: 264 hours awake. Body OK, mind not: memory, irritability, hallucinations. Guinness won't accept attempts.
const GardnerScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.gardner;
  const nameT = ph('randy gardner');
  const hrsT = ph('two hundred');
  const bodyT = ph('his body');
  const memT = ph('his memory');
  const obsT = ph('one observer');
  const gT = ph('today guinness');
  const hours = Math.round(264 * prog(t, hrsT - 0.2, hrsT + 1.4, easeOutCubic));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Bg color={NIGHT} />
        <Eye x={540} y={780} r={230} red={prog(t, hrsT, memT)} t={t} dizzy={t > obsT} />
        {t > hrsT - 0.2 && t < bodyT && <BigText x={540} y={1180} text={`${hours} HOURS`} size={110} fill={C.yellow} />}
        {t > obsT &&
          t < gT + 0.3 &&
          [0, 1, 2].map((i) => {
            const a = t * 1.5 + i * 2.1;
            return (
              <text key={i} x={540 + Math.cos(a) * 330} y={780 + Math.sin(a) * 300} textAnchor="middle" fontSize={70} fontFamily={FONT_DISPLAY} fontWeight={900} fill={[C.green, C.yellow, '#C08CFF'][i]} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
                ?
              </text>
            );
          })}
        <Pill x={540} y={300} text="1964: RANDY GARDNER, 17" s={span(t, nameT - 0.2, hrsT)} bg={C.paper} size={48} />
        <Pill x={540} y={300} text="264 HOURS AWAKE" s={span(t, hrsT, bodyT)} bg={C.yellow} size={60} />
        <Pill x={540} y={300} text="BODY OK. MIND NOT." s={span(t, bodyT, memT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="MEMORY SLIPS, IRRITABLE" s={span(t, memT, obsT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="REPORTED HALLUCINATIONS" s={span(t, obsT, gT)} bg={C.red} fg={C.paper} size={48} />
        {t > gT && <Stamp x={540} y={330} text="TOO DANGEROUS FOR GUINNESS" s={slam(t, gT + 0.3)} size={38} />}
      </Layer>
    </Stage>
  );
};

// 17 h awake ~ 0.05% BAC; 24 h ~ 0.10%, above the US legal driving limit (0.08%).
const DrunkScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.drunk;
  const h17T = ph('after seventeen');
  const bacT = ph('blood alcohol');
  const h24T = ph('after twenty-four');
  const limT = ph('above the legal');
  const lvl = t < h24T ? 0.05 * prog(t, bacT - 0.2, bacT + 0.8, easeOutCubic) : 0.05 + 0.05 * prog(t, h24T + 0.4, h24T + 1.4, easeOutCubic);
  const base = 1250;
  const full = 760;
  const toY = (v: number) => base - (v / 0.12) * full;
  const sh = t > limT && t < limT + 0.4 ? shake(t, 10 * (1 - (t - limT) / 0.4)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Bg color={C.paper} />
        <Clock x={260} y={720} r={150} hours={t < h24T ? 5 : 12} spin={t * 0.3} t={t} mood={t > h24T ? 'dizzy' : 'worried'} />
        <rect x={640} y={toY(0.12)} width={180} height={full} rx={20} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
        <rect x={652} y={toY(lvl)} width={156} height={base - toY(lvl)} rx={12} fill={lvl > 0.08 ? C.red : C.gold} />
        <line x1={610} x2={850} y1={toY(0.08)} y2={toY(0.08)} stroke={C.red} strokeWidth={8} strokeDasharray="16 10" />
        <text x={870} y={toY(0.08) + 14} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={36} fill={C.red}>
          US LIMIT
        </text>
        {t > bacT - 0.2 && (
          <text x={730} y={toY(0.12) - 30} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={64} fill={C.ink}>
            {`${lvl.toFixed(2)}%`}
          </text>
        )}
        <BigText x={260} y={1000} text={t < h24T ? '17 H' : '24 H'} size={110} fill={C.yellow} s={pop(t, h17T)} />
        <Pill x={540} y={300} text="17 H AWAKE = 0.05% ALCOHOL" s={span(t, bacT - 0.2, h24T)} bg={C.gold} size={42} />
        <Pill x={540} y={300} text="24 H AWAKE = 0.10%" s={span(t, h24T, limT)} bg={C.red} fg={C.paper} size={54} />
        <Pill x={540} y={300} text="OVER THE US DRIVING LIMIT" s={pop(t, limT)} bg={C.red} fg={C.paper} size={46} />
      </Layer>
    </Stage>
  );
};

// In mice, spaces between brain cells grow ~60% during sleep; fluid washes out waste incl. an Alzheimer's-linked protein.
const WashScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.wash;
  const miceT = ph('in mice');
  const growT = ph('grow by');
  const fluidT = ph('fluid rushes');
  const protT = ph('including a protein');
  const gap = prog(t, growT - 0.2, growT + 1.2, easeInOutCubic);
  const cols = 4;
  const rows = 4;
  const sp = lerp(150, 200, gap);
  const ox = 540 - (sp * (cols - 1)) / 2;
  const oy = 800 - (sp * (rows - 1)) / 2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Bg color={NIGHT} />
        {t < miceT ? (
          <Brain x={540} y={800} s={1.5 * pop(t, t0 + 0.05)} mood="happy" />
        ) : (
          <g>
            <circle cx={540} cy={800} r={420} fill={BRAIN} stroke={C.ink} strokeWidth={INK_W} />
            {Array.from({length: cols * rows}).map((_, i) => (
              <circle key={i} cx={ox + (i % cols) * sp} cy={oy + Math.floor(i / cols) * sp} r={62} fill={BRAIN_D} stroke={C.ink} strokeWidth={6} />
            ))}
            {t > fluidT &&
              Array.from({length: 14}).map((_, i) => {
                const u = ((t - fluidT) * 0.6 + i / 14) % 1;
                const row = i % 3;
                return <circle key={i} cx={lerp(140, 940, u)} cy={oy + sp * (row + 0.5)} r={20} fill={FLUID} stroke={C.ink} strokeWidth={4} />;
              })}
            {Array.from({length: 6}).map((_, i) => {
              const out = prog(t, fluidT + 0.3 + i * 0.25, fluidT + 1.3 + i * 0.25, (u) => u);
              return out < 1 ? <circle key={i} cx={ox + sp * ((i % 3) + 0.5) + out * 600} cy={oy + sp * (Math.floor(i / 3) + 0.5)} r={28 * (1 - out)} fill={WASTE} stroke={C.ink} strokeWidth={4} /> : null;
            })}
          </g>
        )}
        <Pill x={540} y={300} text="SLEEP ISN'T JUST REST" s={span(t, t0 + 0.1, miceT)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="IN MICE, DURING SLEEP:" s={span(t, miceT, growT - 0.2)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="+60% SPACE BETWEEN CELLS" s={span(t, growT - 0.2, fluidT)} bg={C.yellow} size={46} />
        <Pill x={540} y={300} text="FLUID WASHES OUT WASTE" s={span(t, fluidT, protT)} bg={FLUID} size={50} />
        <Pill x={540} y={300} text="INCL. AN ALZHEIMER'S PROTEIN" s={pop(t, protT)} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// Rats kept fully awake were all dying within ~2-5 weeks.
const RatsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.rats;
  const dyT = ph('dying within');
  const tip = prog(t, dyT, dyT + 1.2, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Bg color={C.paper} />
        <Rat x={480} y={900} s={1.4 * pop(t, t0 + 0.05)} mood={t > dyT ? 'dizzy' : 'worried'} rot={tip * -20} />
        <Calendar x={860} y={560} s={0.6 * pop(t, dyT)} label="2-5" flip={0} />
        <Pill x={540} y={300} text="RATS KEPT AWAKE" s={span(t, t0 + 0.1, dyT)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="DYING WITHIN 2-5 WEEKS" s={pop(t, dyT)} bg={C.red} fg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// Payoff: sleep isn't wasted time - it's when your brain takes out the trash.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const trashT = ph('takes out the trash');
  const walk = prog(t, trashT - 0.6, trashT + 1.2, easeInOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={860} />
        <Brain x={lerp(500, 600, walk)} y={780} s={1.15} mood={t > trashT ? 'smug' : 'happy'} />
        <TrashBag x={lerp(820, 900, walk)} y={1090} s={1.8 * pop(t, t0 + 0.3)} face={{mood: 'surprised'}} />
        <Pill x={540} y={300} text="SLEEP ISN'T WASTED TIME" s={span(t, t0 + 0.1, trashT - 0.5)} bg={C.paper} size={52} />
        <Pill x={540} y={300} text="IT'S BRAIN CLEANUP" s={pop(t, trashT - 0.5)} bg={C.green} size={58} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={42} poses={[[0, 'present'], [trashT, 'thumbs']]} />
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
  [S.gain, GainScene],
  [S.gardner, GardnerScene],
  [S.drunk, DrunkScene],
  [S.wash, WashScene],
  [S.rats, RatsScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

type Cue = {f: string; at: number; db: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const Z = (n: string) => `sleep/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.gain, S.gardner, S.drunk, S.wash, S.rats, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: Z('snore'), at: S.hook, db: -14},
  {f: Z('alarm'), at: ph('eight hours'), db: -12},
  {f: Z('dizzy'), at: ph('eleven days'), db: -16},
  {f: Z('slurp'), at: ph('eight extra'), db: -14},
  {f: Z('dizzy'), at: ph('one observer'), db: -14},
  {f: I('stamp'), at: ph('today guinness') + 0.3, db: -12},
  {f: Z('dizzy'), at: ph('after twenty-four') + 0.4, db: -16},
  {f: Z('wash'), at: ph('fluid rushes'), db: -14},
  {f: Z('wash'), at: ph('fluid rushes') + 1.9, db: -18},
  {f: I('bonk'), at: ph('takes out the trash') + 0.4, db: -16},
  ...[ph('one teenager'), ph('so why'), ph('second shift'), ph('randy gardner') - 0.2, ph('two hundred'), ph('his body'), ph('his memory'), ph('blood alcohol') - 0.2, ph('above the legal'), ph('in mice'), ph('grow by') - 0.2, ph('including a protein'), ph('dying within'), ph('takes out the trash') - 0.5].map((at) => ({
    f: I('pop'),
    at: at - 0.03,
    db: -21,
  })),
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const SleepShort: React.FC = () => {
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
        <Audio src={staticFile('sleep/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
