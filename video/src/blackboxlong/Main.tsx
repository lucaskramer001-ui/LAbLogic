import React, {useRef} from 'react';
import {AbsoluteFill, Audio, Sequence, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, ph} from './timing';
import {CHAPTERS, S} from './scenes';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, Drop, FONT_DISPLAY, Face, INK_W, Puffs, Sea, Sky, Thermo} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, wobble} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {Burst, Check, Cross, EndCard, Layer, LayoutProbe, Pill, Stage, Txt, blink, punch, span, until, useFonts} from '../iceberglong/kit';
import {BlackBox, Debris, Flames, INSUL, ORANGE, Plane, STEEL, CHIP, Weight} from '../blackbox/Main';
import {ChapterCard, Clouds, Shadow, Wipe, bob, countUp, drift} from '../pro/kit';

export const DURATION_FRAMES = Math.ceil(END * FPS);

const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.3, 1, st) : 1;
};
const NEXT = (k: keyof typeof S) => {
  const vals = Object.values(S).sort((a, b) => a - b);
  const i = vals.indexOf(S[k]);
  return vals[i + 1] ?? END;
};
// Camera for a scene: punch on the cut + slow drift to the next cut.
const cam = (t: number, k: keyof typeof S, o: Parameters<typeof drift>[3] = {}) => {
  const d = drift(t, S[k], NEXT(k), o);
  return {...d, s: d.s * punch(t, S[k])};
};
const Paper: React.FC = () => <rect x={-800} y={-800} width={3600} height={2800} fill={C.paper} />;
const SkyBg: React.FC<{t: number; color?: string}> = ({t, color = C.sky}) => (
  <g>
    <rect x={-800} y={-800} width={3600} height={2800} fill={color} />
    <Clouds t={t} y={120} speed={12} s={0.8} n={4} color="#CFE8FB" seed={2} />
    <Clouds t={t} y={260} speed={26} s={1.1} n={4} seed={5} />
  </g>
);
const Floor: React.FC<{y: number; color?: string}> = ({y, color = '#8CCB6B'}) => (
  <g>
    <rect x={-800} y={y} width={3600} height={1600} fill={color} />
    <line x1={-800} x2={2800} y1={y} y2={y} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);
// Speech bubble / sound wave rings from a point.
const Waves: React.FC<{x: number; y: number; t: number; color?: string}> = ({x, y, t, color = C.teal}) => (
  <g>
    {[0, 1, 2].map((i) => {
      const u = (t * 0.9 + i / 3) % 1;
      return <path key={i} d={`M ${x + 30 + u * 140} ${y - 50 - u * 40} Q ${x + 60 + u * 170} ${y} ${x + 30 + u * 140} ${y + 50 + u * 40}`} stroke={color} strokeWidth={12 * (1 - u) + 2} fill="none" strokeLinecap="round" opacity={1 - u * 0.7} />;
    })}
  </g>
);
// Mountain range.
const Mountains: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -500 0 L -260 -320 L -120 -170 L 40 -420 L 260 -150 L 380 -260 L 560 0 Z" fill="#7FA88A" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M 40 -420 L 100 -330 L 60 -340 L 20 -310 L -10 -350 Z M -260 -320 L -220 -260 L -250 -270 L -290 -262 Z" fill="#fff" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
  </g>
);
// Small cartoon submarine / ROV.
const Rov: React.FC<{x: number; y: number; s?: number; t: number; light?: boolean}> = ({x, y, s = 1, t, light}) => (
  <g transform={`translate(${x} ${y + bob(t, 6, 2)}) scale(${s})`}>
    {light && <path d="M 110 0 L 520 -140 L 520 140 Z" fill={C.yellow} opacity={0.35} />}
    <rect x={-120} y={-60} width={240} height={120} rx={40} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
    <circle cx={70} cy={0} r={34} fill={C.sky} stroke={C.ink} strokeWidth={6} />
    <rect x={-150} y={-20} width={40} height={40} rx={8} fill={C.chromeShade} stroke={C.ink} strokeWidth={5} />
    <path d={`M -150 0 L -175 ${-25 + 12 * Math.sin(t * 20)} M -150 0 L -175 ${25 - 12 * Math.sin(t * 20)}`} stroke={C.ink} strokeWidth={6} />
  </g>
);
// Little satellite.
const Satellite: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-20)`}>
    <rect x={-150} y={-30} width={100} height={60} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    <rect x={50} y={-30} width={100} height={60} fill={C.teal} stroke={C.ink} strokeWidth={5} />
    <rect x={-50} y={-45} width={100} height={90} rx={12} fill={C.chrome} stroke={C.ink} strokeWidth={6} />
    <path d="M 0 45 L 0 80 M -25 95 Q 0 70 25 95" stroke={C.ink} strokeWidth={6} fill="none" />
  </g>
);
// Airliner seat (side view).
const Seat: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = C.teal}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -60 0 L -60 -60 L 60 -60 L 70 0 Z" fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -70 -60 L -90 -260 L -30 -260 L -10 -60 Z" fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-40} y={0} width={14} height={50} fill={C.chromeShade} stroke={C.ink} strokeWidth={4} />
    <rect x={30} y={0} width={14} height={50} fill={C.chromeShade} stroke={C.ink} strokeWidth={4} />
  </g>
);

// ================================================================== scenes

// 1. Wreckage: a field, a mountainside, the ocean floor. Investigators look for the black box.
const IntroScene: React.FC<{t: number}> = ({t}) => {
  const pan = prog(t, ph('across a field') - 0.3, ph('bottom of the ocean') + 0.6);
  const boxT = ph('the black box');
  const camX = lerp(700, 2650, pan);
  const icons: Array<[string, string]> = [
    ['FIRE', 'fire impact'],
    ['IMPACT', 'impact deep'],
    ['DEEP WATER', 'deep water'],
  ];
  return (
    <AbsoluteFill>
    <Stage cam={{x: camX, y: 540, s: punch(t, 0)}}>
      <Layer>
        <SkyBg t={t} />
        <Floor y={820} color="#B9A27A" />
        {/* field */}
        <Debris x={420} y={830} s={1.1} rot={-8} kind={0} />
        <Debris x={760} y={840} s={1.0} rot={10} kind={1} />
        <Puffs x={430} y={760} t={t} color="#8E8E96" n={6} rise={420} />
        {/* mountainside */}
        <Mountains x={1500} y={820} s={1.1} />
        <Debris x={1450} y={700} s={0.8} rot={-28} kind={2} />
        {/* ocean */}
        <rect x={2100} y={420} width={1400} height={1200} fill={C.sea} />
        <rect x={2100} y={760} width={1400} height={900} fill={C.seaDeep} />
        <line x1={2100} x2={3500} y1={420} y2={420} stroke={C.ink} strokeWidth={INK_W} />
        <path d="M 2100 980 Q 2400 940 2700 990 T 3500 980 L 3500 1700 L 2100 1700 Z" fill="#C9B27C" stroke={C.ink} strokeWidth={INK_W} />
        <Debris x={2450} y={985} s={0.9} rot={6} kind={0} />
        {t > boxT - 0.3 && (
          <g>
            <circle cx={2700} cy={900} r={190 * pop(t, boxT - 0.3)} fill={C.yellow} opacity={0.3} />
            <BlackBox x={2700} y={900} s={0.7 * pop(t, boxT - 0.3)} t={t} mood="smug" />
          </g>
        )}
      </Layer>
    </Stage>
      <AbsoluteFill>
        <Layer>
          <Pill x={960} y={120} text="A FIELD" s={span(t, ph('a field'), ph('a mountainside'))} bg={C.paper} size={50} />
          <Pill x={960} y={120} text="A MOUNTAINSIDE" s={span(t, ph('a mountainside'), ph('bottom of the ocean'))} bg={C.paper} size={50} />
          <Pill x={960} y={120} text="THE OCEAN FLOOR" s={span(t, ph('bottom of the ocean'), boxT)} bg={C.paper} size={50} />
          <Pill x={960} y={120} text="THE BLACK BOX" s={span(t, boxT, ph('fire impact'))} size={60} />
          {icons.map(([txt, w], i) => (
            <Pill key={txt} x={480 + i * 480} y={120} text={txt} s={pop(t, ph(w) - 0.05)} bg={[C.red, C.yellow, C.sea][i]} fg={i === 1 ? C.ink : C.paper} size={46} />
          ))}
        </Layer>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 2. The obvious fix: build the whole plane out of it.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const build = prog(t, ph('build the whole') - 0.3, ph('out of it') + 0.5, (u) => u);
  const tiles = Array.from({length: 24}).map((_, i) => ({x: 640 + (i % 8) * 110, y: 470 + Math.floor(i / 8) * 80}));
  return (
    <Stage cam={cam(t, 'fix', {dx: 20})}>
      <Layer>
        <Burst t={t} cx={1100} cy={540} />
        <Shadow x={1080} y={760} w={760} />
        <g transform={`translate(0 ${bob(t, 10, 1.6)})`}>
          <Plane x={1080} y={540} s={1.25} t={t} mood={build > 0.6 ? 'surprised' : 'happy'} color={build > 0.98 ? ORANGE : undefined} />
          {tiles.map((p, i) => {
            const s = clamp(build * 24 - i);
            return s > 0 && build < 0.98 ? <rect key={i} x={p.x - 50 * s} y={p.y - 34 * s} width={100 * s} height={68 * s} rx={10} fill={ORANGE} stroke={C.ink} strokeWidth={5} /> : null;
          })}
        </g>
        <BlackBox x={330} y={330} s={0.6} t={t} mood="smug" rot={bob(t, 4, 2)} />
        <Arrow x1={450} y1={360} x2={620} y2={460} color={C.red} w={20} head={44} />
        <Pill x={1080} y={110} text="THE OBVIOUS FIX" s={span(t, ph('obvious fix'), ph('build the whole'))} size={58} />
        <Pill x={1080} y={110} text="BUILD THE PLANE FROM IT?" s={pop(t, ph('build the whole'))} bg={C.paper} size={54} />
      </Layer>
      <Sci t={t} x={1720} y={1000} headR={50} poses={[[0, 'think'], [ph('out of it') - 0.1, 'point']]} flip />
    </Stage>
  );
};

// 3. What the answer says: three cards.
const PromiseScene: React.FC<{t: number}> = ({t}) => {
  const cards: Array<[string, string, string]> = [
    ['HOW PLANES ARE BUILT', 'how planes', C.sky],
    ['WHAT THE BOX REALLY IS', 'what the black box', ORANGE],
    ['WHAT KEEPS PEOPLE ALIVE', 'what actually keeps', C.green],
  ];
  return (
    <Stage cam={cam(t, 'promise', {dx: 0, s1: 1.03})}>
      <Layer>
        <Paper />
        {cards.map(([txt, w, col], i) => {
          const s = pop(t, ph(w) - 0.1, 0.5);
          const x = 360 + i * 600;
          return s > 0 ? (
            <g key={i} transform={`translate(${x} ${560 + bob(t, 6, 1.8, i)}) scale(${s}) rotate(${(i - 1) * 3})`}>
              <rect x={-250 + 10} y={-260 + 10} width={500} height={480} rx={30} fill={C.ink} />
              <rect x={-250} y={-260} width={500} height={480} rx={30} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
              <rect x={-250} y={-260} width={500} height={130} rx={30} fill={col} stroke={C.ink} strokeWidth={INK_W} />
              <Txt x={0} y={-180} text={`${i + 1}`} size={70} anchor="middle" />
              {i === 0 && <Plane x={0} y={40} s={0.5} t={t} />}
              {i === 1 && <BlackBox x={0} y={40} s={0.6} t={t} mood="happy" />}
              {i === 2 && <Seat x={0} y={130} s={0.8} color={C.green} />}
              <text x={0} y={190} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={30} fill={C.ink}>
                {txt}
              </text>
            </g>
          ) : null;
        })}
      </Layer>
    </Stage>
  );
};

// 4. Not black: bright orange with reflective stripes; a searchlight finds it.
const OrangeScene: React.FC<{t: number}> = ({t}) => {
  const flipT = ph('bright orange') - 0.1;
  const sq = t > flipT && t < flipT + 0.2 ? 1 - Math.sin(((t - flipT) / 0.2) * Math.PI) * 0.4 : 1;
  const searchT = ph('searchers can spot');
  const beam = t > searchT - 0.3 ? 900 + 600 * Math.sin((t - searchT) * 1.6) : -999;
  const found = t > searchT + 1.2;
  return (
    <Stage cam={cam(t, 'orange', {dx: -16})}>
      <Layer>
        <rect x={-800} y={-800} width={3600} height={2800} fill={t > searchT - 0.3 ? '#2A3550' : C.sky} />
        {t <= searchT - 0.3 && <Burst t={t} cx={960} cy={540} />}
        <Floor y={820} color={t > searchT - 0.3 ? '#5A5146' : '#8CCB6B'} />
        {t > searchT - 0.3 && <path d={`M 960 -60 L ${(found ? 960 : beam) - 220} 900 L ${(found ? 960 : beam) + 220} 900 Z`} fill={C.yellow} opacity={0.3} />}
        {t > searchT - 0.3 && [300, 1600].map((x, i) => <Debris key={i} x={x} y={830} s={0.9} rot={i ? 8 : -6} kind={i} />)}
        <g transform={`translate(960 600) scale(${sq} 1) translate(-960 -600)`}>
          <Shadow x={960} y={820} w={520} />
          <BlackBox x={960} y={600 + bob(t, 6, 2)} s={1.6} t={t} mood={t > flipT + 0.1 ? 'happy' : 'neutral'} black={t < flipT + 0.1 ? 1 : 0} />
        </g>
        {t > ph("isn't black") && t < flipT && <Stamp x={960} y={190} text="NOT BLACK" s={slam(t, ph("isn't black"))} />}
        <Pill x={960} y={170} text="BRIGHT ORANGE" s={span(t, flipT + 0.1, ph('reflective stripes'))} bg={ORANGE} size={62} />
        <Pill x={960} y={170} text="+ REFLECTIVE STRIPES" s={span(t, ph('reflective stripes'), searchT)} bg={C.paper} size={56} />
        <Pill x={960} y={170} text="EASY TO SPOT" s={pop(t, found ? searchT + 1.2 : 1e9)} bg={C.green} size={60} />
      </Layer>
    </Stage>
  );
};

// 5. David Warren and the Comet.
const WarrenScene: React.FC<{t: number}> = ({t}) => {
  const cometT = ph('the comet');
  const qT = ph('nobody knew');
  const ideaT = ph('so he imagined');
  return (
    <Stage cam={cam(t, 'warren', {dx: 20})}>
      <Layer>
        <SkyBg t={t} color="#7DB9E8" />
        <Floor y={880} />
        <Pill x={640} y={120} text="DAVID WARREN, AUSTRALIA" s={pop(t, ph('david warren'))} size={52} />
        <Pill x={640} y={230} text="1950s" s={pop(t, ph('in the 1950s'))} bg={C.paper} size={48} />
        {t > cometT - 0.2 && (
          <g transform={`translate(0 ${bob(t, 8, 1.4)})`}>
            <Plane x={1300} y={420} s={pop(t, cometT - 0.2) * 0.95} t={t} mood={t > qT ? 'worried' : 'happy'} color="#E7E2D6" />
          </g>
        )}
        <Pill x={1150} y={640} text="THE COMET: FIRST JET AIRLINER" s={pop(t, ph("world's first jet"))} bg={C.paper} size={38} />
        {t > qT &&
          [0, 1, 2].map((i) => (
            <Txt key={i} x={1560 + i * 50} y={300 - i * 40 + bob(t, 10, 3, i)} text="?" size={90 * pop(t, qT + i * 0.15)} fill={C.yellow} anchor="middle" />
          ))}
        {t > ideaT && (
          <g transform={`translate(560 520) scale(${pop(t, ideaT)})`}>
            <circle r={90} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
            <rect x={-40} y={80} width={80} height={50} rx={10} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const a = (k / 6) * Math.PI * 2 + t;
              return <line key={k} x1={Math.cos(a) * 120} y1={Math.sin(a) * 120} x2={Math.cos(a) * 160} y2={Math.sin(a) * 160} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />;
            })}
          </g>
        )}
        <Pill x={780} y={760} text="RECORD THE LAST MOMENTS" s={pop(t, ph('last moments'))} bg={C.green} size={44} />
      </Layer>
      <Sci t={t} x={1760} y={1000} headR={46} poses={[[0, 'present'], [qT, 'think'], [ideaT, 'point']]} flip />
    </Stage>
  );
};

// 6. Prototype 1956; years; required worldwide.
const PrototypeScene: React.FC<{t: number}> = ({t}) => {
  const yearsT = ph('it took years');
  const todayT = ph('today flight recorders');
  const fu = clamp((t - yearsT) / 1.8);
  const yrs = ['1956', '1957', '1958', '1959', '1960'];
  const k = Math.min(4, Math.floor(fu * 4));
  const local = fu >= 1 ? 0 : (fu * 4) % 1;
  return (
    <Stage cam={cam(t, 'prototype', {dx: -16})}>
      <Layer>
        <Paper />
        <Calendar x={420} y={520} s={1} label={t < yearsT ? '1956' : fu >= 1 ? '1960' : local > 0.55 ? yrs[k + 1] : yrs[k]} prev={yrs[k]} flip={fu >= 1 ? 0 : clamp((local - 0.55) / 0.45)} />
        <Pill x={420} y={130} text="FIRST PROTOTYPE" s={span(t, ph('first prototype'), todayT)} size={52} />
        <Pill x={420} y={850} text="YEARS OF DOUBT" s={span(t, yearsT + 0.3, todayT)} bg={C.paper} size={46} />
        {t > todayT - 0.2 && (
          <g transform={`translate(1350 540) scale(${pop(t, todayT - 0.2, 0.5)}) rotate(${t * 12})`}>
            <circle r={280} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
            <path d="M -200 -80 Q -120 -200 -20 -150 Q 40 -60 -40 20 Q -140 40 -200 -80 Z M 40 60 Q 140 0 200 80 Q 160 200 60 180 Q 10 120 40 60 Z M 80 -220 Q 160 -200 180 -120 Q 120 -100 80 -220 Z" fill={C.green} stroke={C.ink} strokeWidth={6} />
          </g>
        )}
        {t > todayT &&
          Array.from({length: 6}).map((_, i) => {
            const a = (i / 6) * Math.PI * 2 + 0.4;
            return <Check key={i} x={1350 + Math.cos(a) * 340} y={540 + Math.sin(a) * 340} s={0.35 * pop(t, todayT + 0.3 + i * 0.12)} />;
          })}
        <Pill x={1240} y={120} text="REQUIRED ON AIRLINERS WORLDWIDE" s={pop(t, ph('required on airliners'))} bg={C.green} size={38} />
      </Layer>
    </Stage>
  );
};

// 7. Two boxes.
const TwoScene: React.FC<{t: number}> = ({t}) => {
  const twoT = ph('there are two');
  return (
    <Stage cam={cam(t, 'two', {s1: 1.03, dx: 0})}>
      <Layer>
        <Burst t={t} cx={960} cy={560} />
        <Shadow x={600} y={780} w={420} />
        <Shadow x={1320} y={780} w={420} />
        <BlackBox x={t > twoT ? 600 : 960} y={600 + bob(t, 6, 2)} s={1.3} t={t} mood="happy" />
        {t > twoT && <BlackBox x={1320} y={600 + bob(t, 6, 2, 1)} s={1.3 * pop(t, twoT)} t={t} mood="smug" />}
        <BigText x={960} y={200} text={t > twoT ? 'TWO BOXES' : 'ONE BOX?'} size={110} fill={C.yellow} s={pop(t, S.two + 0.2)} />
      </Layer>
    </Stage>
  );
};

// 8. Flight data recorder: numbers, many times a second.
const FdrScene: React.FC<{t: number}> = ({t}) => {
  const rows: Array<[string, string, number, number]> = [
    ['SPEED', 'speed', 450, 905],
    ['ALTITUDE', 'altitude', 9000, 10973],
    ['ENGINE POWER', 'engine power', 80, 92],
    ['CONTROLS', 'position of the controls', -5, 5],
  ];
  const rateT = ph('many times every');
  return (
    <Stage cam={cam(t, 'fdr', {dx: 16})}>
      <Layer>
        <Paper />
        <BlackBox x={380} y={600 + bob(t, 6, 2)} s={1.3} t={t} mood="happy" />
        <Pill x={440} y={260} text="FLIGHT DATA RECORDER" s={pop(t, ph('flight data recorder'))} size={40} />
        <Pill x={380} y={900} text="STORES NUMBERS" s={pop(t, ph('stores numbers'))} bg={C.paper} size={46} />
        {rows.map(([lab, w, a, b], i) => {
          const s = pop(t, ph(w) - 0.05);
          const y = 260 + i * 170;
          if (s <= 0) return null;
          // a scrolling trace
          const pts = Array.from({length: 36}).map((_, k) => `${1190 + k * 17} ${y + 20 * Math.sin(t * 4 + k * 0.5 + i)}`);
          return (
            <g key={lab} transform={`translate(${lerp(400, 0, s)} 0)`} opacity={Math.min(1, s)}>
              <rect x={880} y={y - 60} width={960} height={120} rx={20} fill="#fff" stroke={C.ink} strokeWidth={6} />
              <text x={910} y={y + 16} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={36} fill={C.ink}>
                {lab}
              </text>
              <path d={'M ' + pts.join(' L ')} stroke={[C.sea, C.teal, C.red, ORANGE][i]} strokeWidth={8} fill="none" strokeLinecap="round" />
              {t > rateT && <circle cx={1820 - 30} cy={y} r={10 + 4 * Math.sin(t * 20)} fill={C.red} />}

            </g>
          );
        })}
        <Pill x={1280} y={970} text="MANY TIMES EVERY SECOND" s={pop(t, rateT)} bg={C.yellow} size={44} />
      </Layer>
    </Stage>
  );
};

// 9. Cockpit voice recorder: sound; 2 hours -> 25 hours.
const CvrScene: React.FC<{t: number}> = ({t}) => {
  const twoT = ph('last two hours');
  const usT = ph('a new us rule');
  const euT = ph('europe already');
  const hours = t < usT ? 2 : Number(countUp(t, usT + 0.3, usT + 2, 2, 25));
  const barW = 1000 * (hours / 25);
  const sounds: Array<[string, string]> = [
    ['VOICES', "pilots' voices"],
    ['ALARMS', 'alarms'],
    ['SWITCHES', 'switches'],
    ['ENGINES', 'noise of the engines'],
  ];
  return (
    <Stage cam={cam(t, 'cvr', {dx: -16})}>
      <Layer>
        <Burst t={t} cx={380} cy={560} />
        <BlackBox x={380} y={560 + bob(t, 6, 2)} s={1.3} t={t} mood="smug" />
        <Waves x={540} y={540} t={t} />
        <Pill x={440} y={250} text="COCKPIT VOICE RECORDER" s={pop(t, ph('cockpit voice recorder'))} size={38} />
        {sounds.map(([txt, w], i) => (
          <Pill key={txt} x={980 + (i % 2) * 380} y={220 + Math.floor(i / 2) * 120} text={txt} s={pop(t, ph(w) - 0.05)} bg={C.paper} size={44} />
        ))}
        {t > twoT - 0.2 && (
          <g>
            <rect x={760} y={560} width={1000} height={90} rx={20} fill="#fff" stroke={C.ink} strokeWidth={6} />
            <rect x={760} y={560} width={Math.max(40, barW)} height={90} rx={20} fill={hours > 2 ? C.green : C.red} stroke={C.ink} strokeWidth={6} />
            <Txt x={1260} y={760} text={`${Math.round(hours)} HOURS OF AUDIO`} size={60} anchor="middle" />
          </g>
        )}
        <Pill x={1260} y={880} text="US: NEW AIRLINERS" s={span(t, usT, euT)} bg={C.paper} size={44} />
        <Pill x={1260} y={880} text="EUROPE: LARGE PLANES TOO" s={pop(t, euT)} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// 10. Both sit in the tail.
const TailScene: React.FC<{t: number}> = ({t}) => {
  const tailT = ph('in the tail');
  const z = prog(t, tailT - 0.3, tailT + 1);
  return (
    <AbsoluteFill>
    <Stage cam={{x: lerp(960, 760, z), y: lerp(540, 470, z), s: lerp(1, 1.5, z) * punch(t, S.tail)}}>
      <Layer>
        <SkyBg t={t} />
        <Plane x={1000} y={520} s={1.6} t={t} />
        {t > tailT - 0.2 &&
          [0, 1].map((i) => <rect key={i} x={430 + i * 70} y={430} width={56} height={44} rx={8} fill={ORANGE} stroke={C.ink} strokeWidth={5} transform={`scale(1)`} opacity={pop(t, tailT - 0.2 + i * 0.1) > 0 ? 1 : 0} />)}
        {t > tailT && <circle cx={492} cy={452} r={90 + 8 * Math.sin(t * 5)} fill="none" stroke={C.red} strokeWidth={10} />}
      </Layer>
    </Stage>
      <AbsoluteFill>
        <Layer>
          <Pill x={960} y={120} text="BOTH IN THE TAIL" s={pop(t, tailT)} size={58} />
          <Pill x={960} y={960} text="OFTEN THE LEAST DAMAGED PART" s={pop(t, ph('least damage'))} bg={C.paper} size={48} />
        </Layer>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 11. Exploded view: electronics + the armored memory unit: chips, insulation, shell, ~2 kg.
const InsideScene: React.FC<{t: number}> = ({t}) => {
  const openT = ph('most of the box');
  const chipsT = ph('memory chips');
  const insT = ph('insulation');
  const shellT = ph('titanium');
  const kgT = ph('two kilograms');
  const open = prog(t, openT - 0.2, openT + 0.8);
  const cx = 1180;
  const cy = 560;
  const layer = (w: number, h: number, fill: string, s: number) =>
    s > 0 ? <rect x={cx - (w / 2) * s} y={cy - (h / 2) * s} width={w * s} height={h * s} rx={30 * s} fill={fill} stroke={C.ink} strokeWidth={INK_W} /> : null;
  return (
    <Stage cam={cam(t, 'inside', {dx: 16})}>
      <Layer>
        <Paper />
        {t < openT && <Stamp x={960} y={540} text="NO MAGIC MATERIAL" s={slam(t, ph('magic material'))} />}
        {t > openT - 0.2 && (
          <g>
            {/* ordinary electronics slide out to the left */}
            <g transform={`translate(${lerp(560, 400, open)} 560)`}>
              <rect x={-220} y={-160} width={440} height={320} rx={24} fill="#3E6E4E" stroke={C.ink} strokeWidth={INK_W} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={-180 + (i % 3) * 130} y={-110 + Math.floor(i / 3) * 130} width={90} height={70} rx={8} fill={i % 2 ? '#2B2B2E' : C.chrome} stroke={C.ink} strokeWidth={5} />
              ))}
              <path d="M -200 100 L 200 100 M -200 -140 L 200 -140" stroke={C.yellow} strokeWidth={5} />
            </g>
            <Pill x={460} y={850} text="ORDINARY ELECTRONICS" s={pop(t, ph('ordinary electronics'))} bg={C.paper} size={42} />
          </g>
        )}
        {layer(640, 560, STEEL, pop(t, shellT - 0.2))}
        {layer(500, 420, INSUL, pop(t, insT - 0.2))}
        {t > chipsT - 0.2 &&
          [-1, 0, 1].map((i) => {
            const s = pop(t, chipsT - 0.2 + (i + 1) * 0.12);
            return s > 0 ? (
              <g key={i} transform={`translate(${cx + i * 120} ${cy}) scale(${s})`}>
                <rect x={-45} y={-60} width={90} height={120} rx={10} fill={CHIP} stroke={C.ink} strokeWidth={6} />
                {[-36, -12, 12, 36].map((py) => (
                  <g key={py}>
                    <line x1={-58} x2={-45} y1={py} y2={py} stroke={C.ink} strokeWidth={6} />
                    <line x1={45} x2={58} y1={py} y2={py} stroke={C.ink} strokeWidth={6} />
                  </g>
                ))}
              </g>
            ) : null;
          })}
        <Pill x={1180} y={130} text="A FEW MEMORY CHIPS" s={span(t, chipsT, insT)} bg={CHIP} fg={C.paper} size={48} />
        <Pill x={1180} y={130} text="THICK INSULATION" s={span(t, insT, shellT)} bg={INSUL} size={48} />
        <Pill x={1180} y={130} text="TITANIUM OR STEEL SHELL" s={span(t, shellT, kgT)} bg={STEEL} size={48} />
        <Pill x={1180} y={130} text="ABOUT 2 KG OF ARMOR" s={pop(t, kgT)} size={52} />
        <Pill x={1180} y={940} text="FOR A HANDFUL OF CHIPS" s={pop(t, ph('handful'))} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// 12. Tests: impact 3,400 g, spike drop, crush.
const TestsScene: React.FC<{t: number}> = ({t}) => {
  const impT = ph('an impact of');
  const spikeT = ph('a heavy weight');
  const crushT = ph("it's crushed");
  const phase = t < spikeT - 0.1 ? 0 : t < crushT - 0.1 ? 1 : 2;
  const hit = impT + 0.9;
  const fall = clamp((t - impT) / 0.9);
  const sh = t > hit && t < hit + 0.4 ? shake(t, 14 * (1 - (t - hit) / 0.4)) : {x: 0, y: 0};
  const spikeU = clamp((t - spikeT - 0.4) / 0.6);
  const press = phase === 2 ? clamp((t - crushT) / 0.6) : 0;
  return (
    <Stage cam={{...cam(t, 'tests', {dx: 0, s1: 1.025}), x: 960 - sh.x, y: 540 - sh.y}}>
      <Layer>
        <Paper />
        <rect x={-800} y={860} width={3600} height={1200} fill="#C9CED3" />
        <line x1={-800} x2={2800} y1={860} y2={860} stroke={C.ink} strokeWidth={INK_W} />
        {phase === 0 && <BlackBox x={960} y={lerp(-200, 750, fall * fall)} s={1.2} t={t} mood={t > hit ? 'smug' : 'surprised'} rot={t > hit ? wobble(t, hit, 6, 3, 4) : 0} />}
        {phase === 0 && t > hit && t < hit + 1.2 && <Puffs x={960} y={860} t={(t - hit) * 2} color="#E9EEF2" n={6} rise={140} />}
        {phase === 0 && t > impT && <Txt x={1500} y={500} text={`${countUp(t, impT + 0.2, hit, 0, 3400)} G`} size={110} fill={C.red} anchor="middle" />}
        {phase === 1 && (
          <g>
            <BlackBox x={960} y={750} s={1.2} t={t} mood="smug" />
            <g transform={`translate(960 ${lerp(-200, 530, spikeU * spikeU)})`}>
              <path d="M -110 -200 L 110 -200 L 110 -20 L 0 60 L -110 -20 Z" fill="#5B6670" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
              <path d="M -10 50 L 0 110 L 10 50 Z" fill={C.chrome} stroke={C.ink} strokeWidth={5} />
            </g>
            <DimLine x={1400} y1={160} y2={640} label="3 M" s={pop(t, ph('three meters'))} />
          </g>
        )}
        {phase === 2 && (
          <g>
            <BlackBox x={960} y={760 + 10 * press} s={1.2} t={t} mood="smug" />
            <Weight x={960} y={lerp(520, 640 + 6 * press, easeOutCubic(press))} s={1.2} />
          </g>
        )}
        <Pill x={960} y={110} text="IMPACT" s={span(t, impT, spikeT - 0.1)} bg={C.red} fg={C.paper} size={56} />
        <Pill x={960} y={110} text="STEEL SPIKE DROP" s={span(t, spikeT, crushT - 0.1)} bg={C.paper} size={54} />
        <Pill x={960} y={110} text="CRUSHED: 2+ TONNES" s={span(t, crushT)} bg={STEEL} size={54} />
      </Layer>
    </Stage>
  );
};
const DimLine: React.FC<{x: number; y1: number; y2: number; label: string; s: number}> = ({x, y1, y2, label, s}) =>
  s > 0 ? (
    <g>
      <path d={`M ${x} ${y1} L ${x} ${y2} M ${x - 24} ${y1 + 30} L ${x} ${y1} L ${x + 24} ${y1 + 30} M ${x - 24} ${y2 - 30} L ${x} ${y2} L ${x + 24} ${y2 - 30}`} stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
      <Pill x={x + 150} y={(y1 + y2) / 2} text={label} s={s} size={50} />
    </g>
  ) : null;

// 13. Fire 1,100 C for an hour, then 260 C for ten hours.
const FireScene: React.FC<{t: number}> = ({t}) => {
  const ovenT = ph('then bakes');
  const hot = t < ovenT;
  const temp = hot ? countUp(t, S.fire + 0.3, ph('degrees celsius', S.fire) + 0.3, 20, 1100) : '260';
  return (
    <Stage cam={cam(t, 'fire', {dx: 20})}>
      <Layer>
        <rect x={-800} y={-800} width={3600} height={2800} fill={hot ? '#3A2A2A' : '#5A3E2E'} />
        <rect x={-800} y={860} width={3600} height={1200} fill="#2B2B2E" />
        <BlackBox x={860} y={740} s={1.3} t={t} mood={hot ? 'smug' : 'squeeze'} />
        {hot && <Flames x={660} y={880} t={t} s={1.4} />}
        {hot && <Flames x={1060} y={880} t={t + 0.5} s={1.4} />}
        {!hot && [0, 1, 2].map((i) => <path key={i} d={`M ${720 + i * 140} 560 q 20 -40 0 -80 q -20 -40 0 -80`} stroke="#E8A05C" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
        <Thermo x={1500} y={700} level={hot ? Math.min(1, Number(temp.replace(/,/g, '')) / 1100) : 0.35} s={1} />
        <Txt x={1500} y={190} text={`${temp}°C`} size={100} fill={hot ? C.red : C.gold} anchor="middle" />
        <Pill x={860} y={120} text={hot ? 'FOR A FULL HOUR' : 'THEN 10 MORE HOURS'} s={hot ? pop(t, ph('for an hour', S.fire)) : pop(t, ovenT)} bg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// 14. Deep sea: 6 km of water pressure; beacon pings 30 days.
const SeaScene: React.FC<{t: number}> = ({t}) => {
  const down = prog(t, S.sea + 0.2, ph('six kilometers') + 0.8);
  const beaconT = ph('a beacon');
  const depth = countUp(t, S.sea + 0.2, ph('six kilometers') + 0.8, 0, 6000);
  return (
    <Stage cam={cam(t, 'sea', {dx: 0, s1: 1.03})}>
      <Layer>
        <rect x={-800} y={-800} width={3600} height={2800} fill={`rgb(${Math.round(lerp(45, 14, down))},${Math.round(lerp(120, 40, down))},${Math.round(lerp(196, 80, down))})`} />
        {Array.from({length: 14}).map((_, i) => {
          const u = (t * 0.25 + rnd(i)) % 1;
          return <circle key={i} cx={200 + rnd(i + 5) * 1500} cy={1100 - u * 1200} r={8 + rnd(i + 2) * 12} fill="none" stroke="#9FD3F5" strokeWidth={4} opacity={0.6} />;
        })}
        <BlackBox x={860} y={600 + bob(t, 8, 1.5)} s={1.3} t={t} mood={down > 0.5 ? 'squeeze' : 'smug'} />
        {t > beaconT &&
          [0, 1, 2].map((i) => {
            const u = ((t - beaconT) * 0.8 + i / 3) % 1;
            return <circle key={i} cx={1060} cy={560} r={40 + u * 340} fill="none" stroke={C.yellow} strokeWidth={10 * (1 - u)} opacity={1 - u} />;
          })}
        {t > beaconT && <rect x={1030} y={530} width={60} height={60} rx={12} fill={C.yellow} stroke={C.ink} strokeWidth={6} />}
        <Txt x={1500} y={250} text={`${depth} M DEEP`} size={84} anchor="middle" />
        <Pill x={1380} y={900} text="PINGS FOR 30+ DAYS" s={pop(t, ph('thirty days'))} size={46} />
      </Layer>
    </Stage>
  );
};

// 15. Air France 447: 2009 crash, 3,900 m, found 2011, data readable.
const Af447Scene: React.FC<{t: number}> = ({t}) => {
  const downT = ph('lay on the sea floor');
  const foundT = ph('finally found');
  const dive = prog(t, downT - 0.3, ph('meters down', S.af447) + 0.5);
  const rovX = lerp(-300, 760, prog(t, foundT - 1.2, foundT + 0.3, easeOutCubic));
  const year = t < ph('in 2011') ? (t < downT ? '2009' : '2010') : '2011';
  return (
    <AbsoluteFill>
    <Stage cam={{x: 960, y: lerp(540, 1500, dive), s: punch(t, S.af447)}}>
      <Layer>
        <rect x={-800} y={-800} width={3600} height={800 + 420} fill={C.sky} />
        <Sea y={420} t={t} x0={-800} x1={2800} depth={600} />
        <rect x={-800} y={1000} width={3600} height={600} fill={C.seaDeep} />
        <rect x={-800} y={1600} width={3600} height={800} fill="#0E2846" />
        <path d="M -800 1880 Q 0 1840 900 1890 T 2800 1880 L 2800 2600 L -800 2600 Z" fill="#6B5E4A" stroke={C.ink} strokeWidth={INK_W} />
        <BlackBox x={1100} y={1840} s={0.8} t={t} mood={t > foundT ? 'happy' : 'neutral'} rot={-12} />
        {t > foundT - 1.2 && <Rov x={rovX} y={1800} s={1} t={t} light />}
      </Layer>
    </Stage>
      <AbsoluteFill>
        <Layer>
          <Pill x={960} y={110} text="AIR FRANCE 447, 2009" s={pop(t, ph('air france'))} size={54} />
          <Calendar x={1700} y={300} s={0.55} label={year} prev={year} flip={0} />
          {dive > 0.05 && <Txt x={300} y={300} text={`${countUp(t, downT - 0.3, ph('meters down', S.af447) + 0.5, 0, 3900)} M`} size={90} anchor="middle" />}
          <Pill x={960} y={960} text="ALMOST 2 YEARS UNDERWATER" s={span(t, ph('almost two years'), foundT)} bg={C.paper} size={48} />
          <Pill x={960} y={960} text="THE DATA WAS STILL READABLE" s={pop(t, ph('still read'))} bg={C.green} size={48} />
        </Layer>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 16. The lab: open, take out, clean, copy, rebuild second by second.
const LabScene: React.FC<{t: number}> = ({t}) => {
  const steps: Array<[string, string]> = [
    ['OPEN THE ARMOR', 'open the armor'],
    ['TAKE OUT THE MEMORY', 'take out the memory'],
    ['CLEAN IT', 'clean it'],
    ['COPY EVERYTHING', 'copy everything'],
  ];
  const rebuildT = ph('then they rebuild');
  const g = prog(t, rebuildT, rebuildT + 3, (u) => u);
  return (
    <Stage cam={cam(t, 'lab', {dx: 16})}>
      <Layer>
        <Paper />
        {t < rebuildT &&
          steps.map(([txt, w], i) => {
            const s = pop(t, ph(w) - 0.05);
            const x = 300 + i * 440;
            return s > 0 ? (
              <g key={i} transform={`translate(${x} 520) scale(${s})`}>
                <circle r={150} fill={[STEEL, CHIP, C.sky, C.yellow][i]} stroke={C.ink} strokeWidth={INK_W} />
                <Txt x={0} y={30} text={`${i + 1}`} size={110} anchor="middle" />
                <text x={0} y={230} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={34} fill={C.ink}>
                  {txt}
                </text>
                {i < 3 && <path d="M 175 0 L 250 0" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />}
              </g>
            ) : null;
          })}
        {t > rebuildT - 0.1 && (
          <g>
            <rect x={160} y={180} width={1600} height={640} rx={30} fill="#123A5E" stroke={C.ink} strokeWidth={INK_W} />
            {[0, 1, 2].map((k) => {
              const pts = Array.from({length: 60}).map((_, i) => `${200 + i * 26 * g} ${330 + k * 150 + 50 * Math.sin(i * 0.3 + k * 2) * (k === 2 ? 0.4 : 1)}`);
              return <path key={k} d={'M ' + pts.join(' L ')} stroke={[C.green, C.yellow, C.sky][k]} strokeWidth={8} fill="none" strokeLinecap="round" />;
            })}
            <line x1={200 + 1540 * g} x2={200 + 1540 * g} y1={200} y2={800} stroke={C.red} strokeWidth={6} />
            {t > ph('match the numbers') &&
              [0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${380 + i * 480} 940) scale(${pop(t, ph('match the numbers') + i * 0.2)})`}>
                  <rect x={-180} y={-45} width={360} height={90} rx={45} fill="#fff" stroke={C.ink} strokeWidth={6} />
                  <path d={`M -120 0 ${Array.from({length: 12}).map((_, k) => `L ${-120 + k * 22} ${(k % 2 ? -1 : 1) * (10 + 18 * Math.abs(Math.sin(t * 6 + k + i)))}`).join(' ')}`} stroke={C.teal} strokeWidth={6} fill="none" />
                </g>
              ))}
          </g>
        )}
        <Pill x={960} y={100} text="IN THE LAB" s={span(t, ph('in the lab'), rebuildT)} size={54} />
        <Pill x={960} y={100} text="THE LAST MINUTES, SECOND BY SECOND" s={pop(t, rebuildT)} bg={C.paper} size={46} />
      </Layer>
    </Stage>
  );
};

// 17. MH370: never found; break-away recorders and streaming data.
const Mh370Scene: React.FC<{t: number}> = ({t}) => {
  const lostT = ph('never been found');
  const floatT = ph('break away');
  const streamT = ph('sending more flight');
  const floatU = prog(t, floatT, floatT + 1.6);
  return (
    <Stage cam={cam(t, 'mh370', {dx: -16})}>
      <Layer>
        <rect x={-800} y={-800} width={3600} height={1400 + 120} fill={t > floatT - 0.2 ? C.sky : '#6E8CA8'} />
        <Sea y={720} t={t} x0={-800} x1={2800} color={t > floatT - 0.2 ? C.sea : '#2A5B86'} />
        {t < floatT - 0.2 && (
          <g>
            <Txt x={960} y={680} text="?" size={240 * pop(t, ph('disappeared'))} fill={C.yellow} anchor="middle" />
            {t > lostT && <Stamp x={960} y={300} text="NEVER FOUND" s={slam(t, lostT)} />}
          </g>
        )}
        {t > floatT - 0.2 && (
          <g>
            <Plane x={lerp(600, 300, floatU)} y={300} s={0.9} rot={-6} t={t} />
            <g transform={`translate(${lerp(480, 820, floatU)} ${lerp(320, 700 + bob(t, 10, 2), easeInOutCubic(floatU))})`}>
              <BlackBox x={0} y={0} s={0.55} t={t} mood="happy" rot={floatU * 360 * (1 - floatU)} />
            </g>
            <Pill x={820} y={880} text="BREAKS AWAY AND FLOATS" s={pop(t, floatT + 0.6)} bg={C.paper} size={44} />
          </g>
        )}
        {t > streamT - 0.2 && (
          <g>
            <Satellite x={1550} y={180} s={pop(t, streamT - 0.2)} />
            {[0, 1, 2].map((i) => {
              const u = ((t - streamT) * 1.2 + i / 3) % 1;
              return <circle key={i} cx={lerp(400, 1500, u)} cy={lerp(280, 200, u)} r={14} fill={C.yellow} stroke={C.ink} strokeWidth={4} />;
            })}
            <Pill x={1450} y={420} text="DATA SENT IN FLIGHT" s={pop(t, streamT + 0.3)} bg={C.green} size={44} />
          </g>
        )}
        <Pill x={960} y={110} text="MALAYSIA AIRLINES 370, 2014" s={span(t, ph('malaysia'), floatT - 0.2)} size={50} />
      </Layer>
    </Stage>
  );
};

// 18. Why not the whole plane: tiny thing inside vs a huge empty tube.
const WholeScene: React.FC<{t: number}> = ({t}) => {
  const tinyT = ph('the thing inside is tiny');
  const tubeT = ph('a plane is the opposite');
  const lightT = ph('as light as possible');
  return (
    <Stage cam={cam(t, 'whole', {dx: 20})}>
      <Layer>
        <Burst t={t} cx={960} cy={540} />
        <g transform={`translate(420 560) scale(${pop(t, tinyT - 0.2)})`}>
          <rect x={-150} y={-120} width={300} height={240} rx={30} fill={STEEL} stroke={C.ink} strokeWidth={INK_W} />
          <rect x={-90} y={-70} width={180} height={140} rx={16} fill={INSUL} stroke={C.ink} strokeWidth={6} />
          <rect x={-30} y={-40} width={60} height={80} rx={8} fill={CHIP} stroke={C.ink} strokeWidth={5} />
        </g>
        <Pill x={480} y={820} text="TINY INSIDE: ARMOR WORKS" s={pop(t, tinyT)} bg={C.green} size={36} />
        {t > tubeT - 0.2 && (
          <g transform={`translate(0 ${bob(t, 8, 1.6)})`}>
            <Plane x={1330} y={520} s={0.85 * pop(t, tubeT - 0.2, 0.5)} t={t} />
            {[ph('people', tubeT), ph('bags', tubeT), ph('fuel', tubeT)].map((at, i) => (
              <circle key={i} cx={1200 + i * 110} cy={510} r={30 * pop(t, at)} fill={[C.yellow, C.teal, C.red][i]} stroke={C.ink} strokeWidth={5} />
            ))}
          </g>
        )}
        <Pill x={1330} y={820} text="HUGE, MOSTLY EMPTY TUBE" s={pop(t, ph('mostly empty tube'))} bg={C.paper} size={40} />
        <Pill x={960} y={110} text="EVERY KILOGRAM HAS TO FLY" s={pop(t, lightT)} size={50} />
      </Layer>
    </Stage>
  );
};

// 19. Armor it all: too heavy to take off.
const HeavyScene: React.FC<{t: number}> = ({t}) => {
  const wrapT = S.heavy;
  const heavyT = ph('too heavy', S.heavy);
  const armor = prog(t, wrapT + 0.2, heavyT + 0.2);
  const tryT = heavyT - 0.3;
  const jump = t > tryT ? Math.max(0, Math.sin((t - tryT) * 8)) * 24 * Math.exp(-(t - tryT) * 2) : 0;
  const sink = 26 * prog(t, heavyT, heavyT + 0.8);
  return (
    <Stage cam={cam(t, 'heavy', {dx: -20})}>
      <Layer>
        <SkyBg t={t} />
        <rect x={-800} y={760} width={3600} height={1200} fill="#6E7378" />
        <line x1={-800} x2={2800} y1={760} y2={760} stroke={C.ink} strokeWidth={INK_W} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={-100 + i * 320 - ((t * 120) % 320) * (1 - armor)} y={830} width={160} height={20} fill={C.paper} />
        ))}
        <Plane x={960} y={600 - jump + sink} s={1.4} t={t} armor={armor} mood={armor > 0.5 ? 'squeeze' : 'happy'} />
        {t > heavyT && <Stamp x={960} y={190} text="TOO HEAVY TO FLY" s={slam(t, heavyT)} />}
        <Pill x={960} y={120} text="ARMOR EVERYTHING" s={span(t, wrapT + 0.2, heavyT)} bg={STEEL} size={54} />
      </Layer>
    </Stage>
  );
};

// 20. People: Stapp's 46 g vs 3,400 g.
const HumanScene: React.FC<{t: number}> = ({t}) => {
  const sledT = ph('rode a rocket sled');
  const g46T = ph('forty-six');
  const bigT = ph('three thousand four hundred g', g46T);
  const sledX = lerp(-300, 1400, prog(t, sledT, sledT + 1.6, (u) => (u < 0.7 ? u / 0.7 : 1)));
  const g2 = prog(t, bigT, bigT + 1.0, easeOutBack);
  const base = 900;
  const full = 700;
  return (
    <Stage cam={cam(t, 'human', {dx: 0, s1: 1.03})}>
      <Layer>
        <Paper />
        {t < g46T - 0.2 && (
          <g>
            <rect x={-800} y={760} width={3600} height={1200} fill="#E7D3A0" />
            <line x1={-800} x2={2800} y1={760} y2={760} stroke={C.ink} strokeWidth={INK_W} />
            <line x1={-800} x2={2800} y1={740} y2={740} stroke="#8A5A34" strokeWidth={10} />
            {t > sledT && (
              <g transform={`translate(${sledX} 700)`}>
                <rect x={-160} y={-60} width={260} height={70} rx={20} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
                <rect x={-220} y={-50} width={70} height={50} rx={10} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
                {sledX < 1200 && <path d={`M -220 -25 L ${-360 - 40 * Math.sin(t * 30)} -25`} stroke={C.gold} strokeWidth={30} strokeLinecap="round" />}
              </g>
            )}
            <Pill x={960} y={110} text="1954: JOHN PAUL STAPP" s={pop(t, ph('john paul stapp'))} size={52} />
            <Pill x={960} y={230} text="AIR FORCE DOCTOR" s={pop(t, ph('air force doctor'))} bg={C.paper} size={44} />
          </g>
        )}
        {t > g46T - 0.2 && (
          <g>
            <line x1={300} x2={1620} y1={base} y2={base} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
            <rect x={500} y={base - Math.max(10, full * (46 / 3400))} width={300} height={Math.max(10, full * (46 / 3400))} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={6} />
            {g2 > 0 && <rect x={1120} y={base - full * g2} width={300} height={full * g2} rx={12} fill={C.red} stroke={C.ink} strokeWidth={6} />}
            <Pill x={650} y={560} text="HUMAN RECORD: ~46 G" s={pop(t, g46T)} bg={C.teal} fg={C.paper} size={40} />
            <Pill x={1270} y={110} text="BLACK BOX: 3,400 G" s={pop(t, bigT)} bg={C.red} fg={C.paper} size={40} />
            <Pill x={650} y={980} text="ON PURPOSE, FOR A MOMENT" s={pop(t, ph('on purpose'))} bg={C.paper} size={36} />
          </g>
        )}
      </Layer>
      {t > g46T - 0.2 && <Sci t={t} x={650} y={base - full * (46 / 3400)} headR={26} poses={[[0, 'dizzy']]} tremble={1} />}
    </Stage>
  );
};

// 21. What keeps people alive: 16 g seats, 90-second evacuation.
const AliveScene: React.FC<{t: number}> = ({t}) => {
  const seatT = ph('sixteen g');
  const evacT = ph('ninety seconds');
  const sledU = clamp((t - seatT + 0.3) / 1.2);
  const secs = t > evacT - 1.5 ? Math.max(0, 90 - Math.floor((t - (evacT - 1.5)) * 18)) : 90;
  return (
    <Stage cam={cam(t, 'alive', {dx: 16})}>
      <Layer>
        <Burst t={t} cx={960} cy={540} />
        {t < ph('planning for') && <Stamp x={960} y={540} text="NOT ARMOR" s={slam(t, ph('not armor'))} />}
        {t > ph('planning for') - 0.1 && (
          <g>
            <g transform={`translate(${lerp(420, 520, easeOutCubic(sledU)) + (sledU > 0.9 ? wobble(t, seatT + 0.9, 8, 4, 4) : 0)} 0)`}>
              <rect x={-200} y={760} width={400} height={40} rx={10} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
              <Seat x={0} y={710} s={1.4} />
            </g>
            <Pill x={560} y={230} text="SEATS TESTED AT 16 G" s={pop(t, seatT)} size={48} />
            <Pill x={560} y={340} text="NEW DESIGNS SINCE THE LATE 1980s" s={pop(t, ph('late 1980s'))} bg={C.paper} size={32} />
          </g>
        )}
        {t > evacT - 1.6 && (
          <g transform={`translate(1450 560) scale(${pop(t, evacT - 1.6)})`}>
            <circle r={230} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
            <path d={`M 0 0 L 0 -200 A 200 200 0 ${secs < 45 ? 1 : 0} 1 ${200 * Math.sin(((90 - secs) / 90) * Math.PI * 2)} ${-200 * Math.cos(((90 - secs) / 90) * Math.PI * 2)} Z`} fill={C.green} opacity={0.8} />
            <Txt x={0} y={30} text={`${secs}`} size={130} anchor="middle" />
          </g>
        )}
        <Pill x={1340} y={880} text="FULL PLANE OUT IN 90 SECONDS" s={pop(t, evacT)} bg={C.paper} size={36} />
      </Layer>
    </Stage>
  );
};

// 22. The black box as a witness feeding the rules.
const WitnessScene: React.FC<{t: number}> = ({t}) => {
  const witT = ph('best witnesses');
  return (
    <Stage cam={cam(t, 'witness', {dx: -16})}>
      <Layer>
        <Paper />
        <BlackBox x={520} y={600 + bob(t, 6, 2)} s={1.3} t={t} mood="happy" />
        <Arrow x1={760} y1={600} x2={1130} y2={600} color={C.red} w={24} head={52} />
        <g transform={`translate(1400 600) scale(${pop(t, S.witness + 0.3)})`}>
          <rect x={-220} y={-280} width={440} height={560} rx={20} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <Check x={-150} y={-190 + i * 100} s={0.22 * pop(t, S.witness + 0.6 + i * 0.25)} />
              <rect x={-110} y={-205 + i * 100} width={280} height={26} rx={13} fill={C.chrome} />
            </g>
          ))}
        </g>
        <Pill x={1400} y={110} text="SAFETY RULES" s={pop(t, ph('rules like these'))} bg={C.paper} size={50} />
        <Pill x={640} y={950} text="ONE OF THE BEST WITNESSES" s={pop(t, witT)} size={40} />
      </Layer>
    </Stage>
  );
};

// 23. Recap.
const RecapScene: React.FC<{t: number}> = ({t}) => {
  const items: Array<[string, string]> = [
    ['NOT A MATERIAL', "isn't a material"],
    ['A TINY ARMORED MEMORY', 'tiny heavily armored'],
    ['ITS JOB: NOT TO SAVE US', "its job isn't"],
  ];
  return (
    <Stage cam={cam(t, 'recap', {dx: 16})}>
      <Layer>
        <Burst t={t} cx={1550} cy={600} />
        <BigText x={620} y={200} text="WHY NOT?" size={110} fill={C.yellow} s={pop(t, S.recap + 0.2)} />
        {items.map(([txt, w], i) => {
          const s = pop(t, ph(w, S.recap) - 0.05);
          return (
            <g key={i} transform={`translate(${160 + lerp(-200, 0, Math.min(1, s))} ${380 + i * 170}) scale(${s})`}>
              <Cross x={0} y={0} s={0.4} />
              <Txt x={60} y={18} text={txt} size={52} />
            </g>
          );
        })}
        <BlackBox x={1560} y={620 + bob(t, 8, 2)} s={1.3} t={t} mood="smug" />
      </Layer>
    </Stage>
  );
};

// 24. Final line.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const undT = ph('understandable');
  const safeT = ph('next flight');
  const fly = prog(t, safeT - 0.2, safeT + 2, (u) => u);
  return (
    <Stage cam={cam(t, 'final', {dx: 0, s1: 1.025})}>
      <Layer>
        <SkyBg t={t} />
        {t < safeT - 0.2 && <BlackBox x={960} y={560 + bob(t, 6, 2)} s={1.4} t={t} mood="happy" />}
        {t > safeT - 0.2 && <Plane x={lerp(-300, 2200, fly)} y={lerp(800, 250, fly)} s={0.9} rot={-12} t={t} mood="happy" />}
        <Pill x={960} y={120} text="NOT SURVIVABLE" s={span(t, ph('survivable') - 0.1, undT)} bg={C.paper} size={56} />
        <Pill x={960} y={120} text="UNDERSTANDABLE" s={span(t, undT, safeT)} bg={C.green} size={60} />
        <Pill x={960} y={120} text="THE NEXT FLIGHT: SAFER" s={pop(t, safeT)} size={60} />
      </Layer>
      {t < safeT - 0.2 && <Sci t={t} x={420} y={1010} headR={50} poses={[[0, 'point'], [undT, 'thumbs']]} />}
    </Stage>
  );
};

const EndScene: React.FC<{t: number}> = ({t}) => <EndCard t={t} t0={S.endcard} />;

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.intro, IntroScene],
  [S.fix, FixScene],
  [S.promise, PromiseScene],
  [S.orange, OrangeScene],
  [S.warren, WarrenScene],
  [S.prototype, PrototypeScene],
  [S.two, TwoScene],
  [S.fdr, FdrScene],
  [S.cvr, CvrScene],
  [S.tail, TailScene],
  [S.inside, InsideScene],
  [S.tests, TestsScene],
  [S.fire, FireScene],
  [S.sea, SeaScene],
  [S.af447, Af447Scene],
  [S.lab, LabScene],
  [S.mh370, Mh370Scene],
  [S.whole, WholeScene],
  [S.heavy, HeavyScene],
  [S.human, HumanScene],
  [S.alive, AliveScene],
  [S.witness, WitnessScene],
  [S.recap, RecapScene],
  [S.final, FinalScene],
  [S.endcard, EndScene],
];

type Cue = {f: string; at: number; db: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const CHAPTER_TIMES = CHAPTERS.map(([k]) => S[k]);
const SFX: Cue[] = [
  ...Object.entries(S)
    .filter(([k]) => k !== 'intro' && !CHAPTERS.some(([c]) => c === k))
    .map(([, v]) => ({f: I('whoosh'), at: v - 0.05, db: -27})),
  ...CHAPTER_TIMES.map((v) => ({f: I('whoosh'), at: v - 0.3, db: -20})),
  ...CHAPTER_TIMES.map((v) => ({f: I('pop'), at: v + 0.1, db: -20})),
  {f: U('fire'), at: 0, db: -32},
  // waves are added in images/blackbox-long/scripts/mix.py, only while the sea surface is on screen
  ...[ph('the black box'), ph('obvious fix'), ph('bright orange'), ph('david warren'), ph('the comet'), ph('first prototype'), ph('required on airliners'), ph('there are two'),
    ph('speed'), ph('altitude'), ph('engine power'), ph("pilots' voices"), ph('alarms'), ph('switches'), ph('in the tail'), ph('memory chips'), ph('insulation'), ph('titanium'),
    ph('two kilograms'), ph('thirty days'), ph('air france'), ph('finally found'), ph('open the armor'), ph('take out the memory'), ph('clean it'), ph('copy everything'),
    ph('break away'), ph('sending more flight'), ph('mostly empty tube'), ph('as light as possible'), ph('john paul stapp'), ph('forty-six'), ph('sixteen g'),
    ph('best witnesses'), ph('understandable')].map((at) => ({f: I('pop'), at: at - 0.03, db: -22})),
  ...[ph("isn't black"), ph('magic material'), ph('never been found'), ph('too heavy', S.heavy), ph('not armor')].map((at) => ({f: I('stamp'), at, db: -12})),
  {f: U('boom'), at: ph('an impact of') + 0.9, db: -13},
  {f: I('bonk'), at: ph('a heavy weight') + 1.0, db: -12},
  {f: I('bonk'), at: ph("it's crushed") + 0.55, db: -12},
  {f: U('fire'), at: ph('it sits in a fire'), db: -18},
  {f: I('splash'), at: ph('and it has to survive the water'), db: -16},
  ...[0, 1, 2, 3].map((i) => ({f: I('drip'), at: ph('a beacon') + i * 1.25, db: -18})),
  {f: U('rocket'), at: ph('rode a rocket sled'), db: -14},
  {f: U('fail'), at: ph('too heavy', S.heavy) + 0.1, db: -18},
  {f: U('rocket'), at: ph('next flight') - 0.2, db: -18},
  {f: I('pop'), at: S.endcard + 0.05, db: -18},
];

export const BlackBoxLong: React.FC = () => {
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
      {CHAPTERS.map(([k, title], i) => (
        <ChapterCard key={k} t={t} at={S[k] + 0.35} n={i + 1} title={title} />
      ))}
      {CHAPTER_TIMES.map((at, i) => (
        <Wipe key={i} t={t} at={at} />
      ))}
      {probe && <LayoutProbe root={root} frame={frame} />}
      <Sequence from={Math.round(0.4 * FPS)} layout="none">
        <Audio src={staticFile('blackboxlong/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
