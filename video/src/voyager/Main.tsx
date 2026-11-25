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

// "Why don't we just catch up with Voyager 1?" - Short (Voyager 1 reached one light-day on 2026-11-18), 1080x1920,
// 1080p, cover = separate Still VoyagerCover. Higgsfield drafts (Voyager with a code face on its dish, deep-space
// backdrop, Jupiter/Saturn/New Horizons from one sprite sheet) animated in code: parallax star layers, light pulse,
// slingshot orbits, fading power. 0 video credits.

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const SPACE_BG = '#141634';
const BEAM = '#8FE3FF';

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






import {Rocket} from '../sun/space';
import {Clock} from '../plastic/Main';

// ------------------------------------------------------------------ props

type Mood = React.ComponentProps<typeof Face>['mood'];

// Deep space: Higgsfield backdrop + two code star layers drifting at different speeds (parallax).
const Space: React.FC<{t: number; drift?: number}> = ({t, drift = 1}) => (
  <g>
    <image href={staticFile('voyager/space.jpg')} x={0} y={0} width={1080} height={1920} />
    {[0, 1].map((L) =>
      Array.from({length: 26}).map((_, i) => {
        const sp = (L ? 60 : 22) * drift;
        const x = (((rnd(i + L * 50) * 1300 - t * sp) % 1300) + 1300) % 1300 - 110;
        const y = rnd(i + 90 + L * 50) * 1920;
        const r = L ? 3.5 + rnd(i) * 2.5 : 2 + rnd(i) * 1.5;
        const tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
        return <circle key={`${L}-${i}`} cx={x} cy={y} r={r} fill="#fff" opacity={tw * (L ? 0.9 : 0.6)} />;
      }),
    )}
  </g>
);

// Main character: Voyager (Higgsfield sprite 800x762, dish centre (425, 237)) with a code face on the dish.
// power 0..1 dims the face (eyelids) when the battery runs low. Centre (x, y), ~380 px wide at s=1.
const Voyager: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood; rot?: number; power?: number; look?: {x: number; y: number}}> = ({x, y, s = 1, t, mood = 'happy', rot = 0, power = 1, look}) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.3) * 8}) rotate(${rot + Math.sin(t * 0.9) * 2}) scale(${s * 0.48}) translate(-425 -380)`}>
    <image href={staticFile('voyager/voyager.png')} x={0} y={0} width={800} height={762} />
    <Face x={425} y={250} s={1.25} mood={mood} open={Math.min(blink(t, 1), 0.25 + 0.75 * power)} look={look} gap={56} />
  </g>
);

// Sprite helpers for Jupiter (379x385), Saturn (570x337) and New Horizons (335x280).
const Sprite: React.FC<{src: string; w: number; h: number; x: number; y: number; s?: number; rot?: number}> = ({src, w, h, x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
    <image href={staticFile(`voyager/${src}.png`)} x={0} y={0} width={w} height={h} />
  </g>
);
const Planet: React.FC<{which: 'jupiter' | 'saturn'; x: number; y: number; s?: number; t: number; mood?: Mood}> = ({which, x, y, s = 1, t, mood = 'happy'}) => (
  <g>
    {which === 'jupiter' ? <Sprite src="jupiter" w={379} h={385} x={x} y={y} s={s} rot={Math.sin(t) * 2} /> : <Sprite src="saturn" w={570} h={337} x={x} y={y} s={s} rot={-8 + Math.sin(t) * 2} />}
    <Face x={x + (which === 'saturn' ? -10 * s : 0)} y={y + 10 * s} s={0.9 * s} mood={mood} open={blink(t, which === 'saturn' ? 2 : 4)} gap={50} />
  </g>
);

// Earth (illustrated sprite from the trees episode) with a code face.
const Globe: React.FC<{x: number; y: number; r: number; t: number; mood?: Mood}> = ({x, y, r, t, mood = 'happy'}) => (
  <g>
    <g transform={`translate(${x} ${y}) rotate(${Math.sin(t * 0.7) * 3}) scale(${r / 398}) translate(-400 -404)`}>
      <image href={staticFile('earth/earth.png')} x={0} y={0} width={800} height={809} />
    </g>
    <Face x={x} y={y - r * 0.05} s={r / 150} mood={mood} open={blink(t, 2)} gap={44} />
  </g>
);

// Light/radio pulse travelling along a line from (x1,y1) to (x2,y2); u 0..1 = progress.
const Pulse: React.FC<{x1: number; y1: number; x2: number; y2: number; u: number; color?: string; label?: string}> = ({x1, y1, x2, y2, u, color = BEAM, label}) => {
  const x = lerp(x1, x2, u);
  const y = lerp(y1, y2, u);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={4} strokeDasharray="14 18" opacity={0.6} />
      {u > 0 && u < 1 && (
        <g>
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={x} cy={y} r={20 + k * 16} fill="none" stroke={color} strokeWidth={6 - k * 1.5} opacity={0.9 - k * 0.25} />
          ))}
          <circle cx={x} cy={y} r={14} fill={color} stroke={C.ink} strokeWidth={4} />
          {label && (
            <text x={x} y={y - 56} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={40} fill={C.paper} stroke={C.ink} strokeWidth={9} paintOrder="stroke fill">
              {label}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

// Battery with a level 0..1 (bottom centre).
const Battery: React.FC<{x: number; y: number; s?: number; level: number}> = ({x, y, s = 1, level}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-260} width={120} height={260} rx={20} fill={C.ink} transform="translate(8 8)" />
    <rect x={-60} y={-260} width={120} height={260} rx={20} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-25} y={-285} width={50} height={25} rx={6} fill={C.ink} />
    <rect x={-44} y={-16 - 228 * level} width={88} height={228 * level} rx={10} fill={level > 0.35 ? C.green : C.red} />
  </g>
);

// Small instrument lights that switch off one by one (on = how many still on, of total).
const Lights: React.FC<{x: number; y: number; on: number; total?: number}> = ({x, y, on, total = 10}) => (
  <g>
    {Array.from({length: total}).map((_, i) => (
      <circle key={i} cx={x + (i - (total - 1) / 2) * 62} cy={y} r={22} fill={i < on ? C.yellow : '#3A3F55'} stroke={C.ink} strokeWidth={5} />
    ))}
  </g>
);

// Radio dish on Earth (bottom centre) listening, with incoming waves.
const Dish: React.FC<{x: number; y: number; s?: number; t: number; waves?: number}> = ({x, y, s = 1, t, waves = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {waves > 0 &&
      [0, 1, 2].map((k) => {
        const u = (t * 0.7 + k / 3) % 1;
        return <path key={k} d={`M ${120 - u * 0} ${-330 - (1 - u) * 260} q 60 40 0 80`} stroke={BEAM} strokeWidth={8} fill="none" opacity={(1 - u) * waves} transform={`rotate(-35 0 -300)`} />;
      })}
    <path d="M -30 0 L 0 -150 L 30 0 Z" fill="#9AA5AD" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -150 -260 Q 0 -60 150 -260 Z" fill="#fff" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" transform="rotate(-25 0 -170)" />
    <line x1={0} y1={-170} x2={60} y2={-300} stroke={C.ink} strokeWidth={8} />
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  hook: 0,
  mile: ph('on november') - 0.05,
  fix: ph('it launched') - 0.05,
  cheat: ph('the first problem') - 0.05,
  head: ph('the second problem') - 0.05,
  time: ph('the third problem') - 0.05,
  final: ph('so we') - 0.05,
  end: VO_END + 0.3,
};

// Separate cover (Still "VoyagerCover"): "1 FULL DAY / TO SAY HELLO?!" - scientist in the "think" pose (last cover used shrug).
export const VoyagerCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: SPACE_BG}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Space t={0.5} />
      <Globe x={850} y={1620} r={180} t={0.3} mood="worried" />
      <Pulse x1={800} y1={1460} x2={660} y2={1150} u={0.5} label="HELLO?" />
      <Voyager x={620} y={1000} s={1.3} t={0.4} mood="happy" look={{x: 0.4, y: 0.6}} />
      <RedCircle x={620} y={985} r={240} />
    </svg>
    <BigSci pose="think" x={140} y={1300} headR={95} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={530} text="1 FULL DAY" size={120} />
        <BigText x={540} y={730} text="TO SAY HELLO?!" size={124} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);

// HOOK (frame 0): a "HELLO" pulse crawls from Earth to Voyager; "2 DAYS" to get an answer; "1 LIGHT-DAY"; "CATCH UP?"
const HookScene: React.FC<{t: number}> = ({t}) => {
  const dT = ph('two days');
  const helloT = ph('hello');
  const ldT = ph('lightday away');
  const whyT = ph('catch up');
  const u = clamp((t - 0.2) / 6.5);
  const sh = camShake(t, [[dT, 10], [ldT, 8]]);
  return (
    <Stage cam={{s: lerp(1.1, 1, ease(t, 0, 1.8)), x: 540 + sh.x, y: 960 + sh.y}}>
      <Layer>
        <Space t={t} />
        <Globe x={230} y={1560} r={150} t={t} mood="happy" />
        <Pulse x1={300} y1={1440} x2={790} y2={880} u={u} label="HELLO!" />
        <Voyager x={800} y={830} s={0.95} t={t} mood="happy" look={{x: -0.5, y: 0.5}} />
        {t > dT - 0.1 && t < ldT - 0.1 && <BigText x={540} y={560} text="2 DAYS" size={150 * slam(t, dT - 0.1)} fill={C.yellow} />}
        {t > ldT - 0.1 && t < whyT - 0.1 && <BigText x={540} y={560} text="1 LIGHT-DAY" size={120 * slam(t, ldT - 0.1)} fill={BEAM} />}
        {t > whyT - 0.1 && <BigText x={540} y={560} text="CATCH UP?" size={130 * springIn(t, whyT - 0.1, 0.55, 9)} fill={C.yellow} />}
        <Pill x={540} y={300} text="TO GET AN ANSWER" s={span(t, helloT - 0.3, ldT - 0.1)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="VOYAGER 1" s={span(t, 0.1, helloT - 0.3)} bg={C.yellow} size={60} />
      </Layer>
    </Stage>
  );
};

// Nov 18: first human-made object one light-day from Earth, ~26 billion km; even light needs a full day.
const MileScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.mile;
  const firstT = ph('first humanmade');
  const kmT = ph('twentysix billion');
  const lightT = ph('even light');
  return (
    <Stage cam={{s: punch(t, t0) * lerp(1.05, 1, ease(t, t0, t0 + 2))}}>
      <Layer>
        <Space t={t} drift={0.5} />
        {t < lightT ? (
          <g>
            <Voyager x={540} y={1120} s={1.8} t={t} mood="smug" />
            {t > firstT && <Stamp x={540} y={700} text="FIRST EVER" s={springIn(t, firstT, 0.5, 10)} />}
            {t > kmT - 0.1 && <BigText x={540} y={560} text="26 BILLION KM" size={98 * slam(t, kmT - 0.1)} fill={C.yellow} />}
          </g>
        ) : (
          <g>
            <Globe x={200} y={1300} r={110} t={t} />
            <Voyager x={880} y={1220} s={0.75} t={t} mood="happy" look={{x: -0.6, y: 0}} />
            <Pulse x1={300} y1={1290} x2={800} y2={1230} u={ease(t, lightT, S.fix, (v) => v)} color={C.yellow} label="LIGHT" />
            <Clock x={540} y={760} s={1.1 * springIn(t, lightT, 0.5)} spin={(t - lightT) * 6} />
            <BigText x={540} y={600} text="24 HOURS" size={96 * springIn(t, lightT + 0.3, 0.5, 9)} fill={C.yellow} />
          </g>
        )}
        <Pill x={540} y={300} text="NOV 18, 2026" s={span(t, t0 + 0.1, kmT - 0.1)} bg={C.paper} size={58} />
        <Pill x={540} y={300} text="ONE LIGHT-DAY FROM EARTH" s={pop(t, kmT - 0.1)} bg={BEAM} size={46} />
      </Layer>
    </Stage>
  );
};

// Launched in 1977, our rockets are better now. Just build a faster probe. Right?
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const rockT = ph('our rockets');
  const buildT = ph('just build');
  const rightT = ph('right');
  const lift = ease(t, buildT, rightT + 0.6, (u) => u * u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} />
        {t < rockT ? (
          <Calendar x={540} y={900} s={0.9 * springIn(t, t0 + 0.1, 0.5)} label="1977" flip={0} />
        ) : (
          <g>
            <Rocket x={540} y={lerp(1500, 700, lift)} s={1.6 * springIn(t, rockT, 0.5)} flame={t > buildT ? 1 : 0.3} t={t} />
          </g>
        )}
        {t > rightT - 0.05 && <BigText x={540} y={560} text="RIGHT?" size={150 * springIn(t, rightT - 0.05, 0.5, 9)} fill={C.paper} />}
        <Pill x={540} y={300} text="LAUNCHED IN 1977" s={span(t, t0 + 0.1, rockT)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="BUILD A FASTER PROBE!" s={pop(t, rockT)} bg={C.green} size={52} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'present'], [buildT, 'thumbs'], [rightT, 'think']]} />
    </Stage>
  );
};

// Problem 1: Voyager cheated - slingshots at Jupiter and Saturn. New Horizons launched faster but is slower today.
const CheatScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.cheat;
  const jT = ph('jupiter');
  const sT = ph('saturn');
  const stoleT = ph('stole speed');
  const nhT = ph('new horizons');
  const slowT = ph('slower than');
  const pathU = ease(t, jT - 0.6, stoleT + 0.8, (u) => u);
  // path: from bottom-left, swing around Jupiter (lower) and Saturn (upper), exit top-right
  const pts = [[40, 1300], [250, 1000], [480, 1060], [560, 820], [560, 620], [800, 520], [1060, 380]];
  const idx = pathU * (pts.length - 1);
  const i0 = Math.min(pts.length - 2, Math.floor(idx));
  const f = idx - i0;
  const vx = lerp(pts[i0][0], pts[i0 + 1][0], f);
  const vy = lerp(pts[i0][1], pts[i0 + 1][1], f);
  const race = t > nhT - 0.1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} drift={race ? 2 : 1} />
        {!race ? (
          <g>
            <Planet which="jupiter" x={330} y={1150} s={0.85 * springIn(t, jT - 0.3, 0.5)} t={t} mood={t > stoleT ? 'surprised' : 'happy'} />
            <Planet which="saturn" x={760} y={730} s={0.7 * springIn(t, sT - 0.3, 0.5)} t={t} mood={t > stoleT ? 'surprised' : 'happy'} />
            <path d={`M ${pts.map((p) => p.join(' ')).join(' L ')}`} stroke="#fff" strokeWidth={6} strokeDasharray="16 16" fill="none" opacity={0.5} />
            <Voyager x={vx} y={vy} s={0.6} t={t} mood="smug" />
            {t > stoleT && <BigText x={540} y={540} text="+SPEED!" size={120 * slam(t, stoleT)} fill={C.yellow} />}
          </g>
        ) : (
          <g>
            <Voyager x={lerp(540, 760, ease(t, nhT, slowT + 0.5))} y={900} s={0.9} t={t} mood="smug" rot={8} />
            <Sprite src="newhorizons" w={335} h={280} x={lerp(700, 300, ease(t, nhT + 0.6, slowT + 0.5))} y={1200} s={0.85} rot={8} />
            {[0, 1, 2].map((k) => (
              <line key={k} x1={380 - k * 30} y1={860 + k * 40} x2={200 - k * 40} y2={860 + k * 40} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
            ))}
            {t > slowT - 0.1 && <Stamp x={540} y={560} text="SLOWER TODAY" s={springIn(t, slowT - 0.1, 0.5, 10)} />}
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 1: VOYAGER CHEATED" s={span(t, t0 + 0.1, nhT - 0.1)} bg={C.red} fg={C.paper} size={44} />
        <Pill x={540} y={300} text="NEW HORIZONS: FASTER LAUNCH" s={span(t, nhT - 0.1, slowT - 0.1)} bg={C.paper} size={44} />
        <Pill x={540} y={300} text="...BUT SLOWER NOW" s={pop(t, slowT - 0.1)} bg={C.yellow} size={52} />
      </Layer>
    </Stage>
  );
};

// Problem 2: the head start. ~17 km/s, never stops. Catch it within 20 years -> more than 3x faster.
const HeadScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.head;
  const kmT = ph('seventeen');
  const catchT = ph('to catch it');
  const x3T = ph('three times');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} drift={3} />
        <Voyager x={760} y={900} s={0.9} t={t} mood="smug" rot={6} />
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1={560 - k * 20} y1={840 + k * 40} x2={320 - k * 60} y2={840 + k * 40} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
        ))}
        {t > catchT && <Rocket x={240} y={1220} s={1.0 * springIn(t, catchT, 0.5)} rot={60} flame={1} t={t} />}
        {t > kmT - 0.1 && t < x3T - 0.1 && <BigText x={540} y={560} text="17 KM EVERY SECOND" size={66 * slam(t, kmT - 0.1)} fill={C.yellow} />}
        {t > x3T - 0.1 && <BigText x={540} y={560} text="3X FASTER" size={140 * slam(t, x3T - 0.1)} fill={C.yellow} />}
        {t > catchT && <Calendar x={660} y={1200} s={0.45 * springIn(t, catchT + 0.2, 0.5)} label="20 YRS" flip={0} />}
        <Pill x={540} y={300} text="PROBLEM 2: THE HEAD START" s={span(t, t0 + 0.1, catchT)} bg={C.red} fg={C.paper} size={46} />
        <Pill x={540} y={300} text="TO CATCH IT IN 20 YEARS" s={pop(t, catchT)} bg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// Problem 3: time. Nuclear battery loses ~4 W a year; most instruments already off; it will be silent.
const TimeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.time;
  const batT = ph('nuclear battery');
  const wT = ph('four watts');
  const offT = ph('most of its');
  const silT = ph('be silent');
  const level = lerp(0.8, 0.12, ease(t, wT, silT + 0.3, (u) => u));
  const on = Math.round(lerp(10, 2, ease(t, offT - 0.2, offT + 1.6, (u) => u)));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} drift={0.4} />
        <Voyager x={620} y={1080} s={1.4} t={t} mood={t > silT ? 'dizzy' : t > wT ? 'worried' : 'happy'} power={t > silT ? 0 : level} />
        {t > batT - 0.1 && <Battery x={170} y={1380} s={0.9 * springIn(t, batT - 0.1, 0.5)} level={level} />}
        {t > wT - 0.1 && t < offT - 0.25 && <BigText x={540} y={600} text="-4 WATTS A YEAR" size={86 * slam(t, wT - 0.1)} fill={C.red} />}
        {t > offT - 0.2 && <Lights x={540} y={600} on={t > silT ? 0 : on} />}
        {t > silT - 0.1 && <Stamp x={540} y={760} text="SILENT" s={springIn(t, silT - 0.1, 0.5, 10)} />}
        <Pill x={540} y={300} text="PROBLEM 3: TIME" s={span(t, t0 + 0.1, offT - 0.2)} bg={C.red} fg={C.paper} size={56} />
        <Pill x={540} y={300} text="INSTRUMENTS SWITCHING OFF" s={pop(t, offT - 0.2)} bg={C.paper} size={46} />
      </Layer>
    </Stage>
  );
};

// Payoff: we don't chase Voyager, we listen while we still can. One day away, farther every second.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const lisT = ph('we listen');
  const dayT = ph('one day away');
  const farT = ph('a little farther');
  const km = 25.9e9 + Math.max(0, t - farT) * 17;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Space t={t} drift={0.3} />
        <Globe x={290} y={1240} r={160} t={t} mood="happy" />
        <Dish x={520} y={1180} s={0.9 * springIn(t, lisT - 0.2, 0.6)} t={t} waves={t > lisT ? 1 : 0} />
        <Voyager x={lerp(820, 900, ease(t, farT, S.end))} y={lerp(640, 560, ease(t, farT, S.end))} s={lerp(0.7, 0.45, ease(t, farT, S.end))} t={t} mood="happy" look={{x: -0.6, y: 0.6}} />
        {t > dayT - 0.1 && <BigText x={500} y={820} text="1 DAY AWAY" size={110 * springIn(t, dayT - 0.1, 0.5, 9)} fill={BEAM} />}
        {t > farT - 0.1 && (
          <text x={500} y={930} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={48} fill={C.paper} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
            {`${Math.round(km).toLocaleString('en-US')} KM`}
          </text>
        )}
        <Pill x={540} y={300} text="DON'T CHASE IT" s={span(t, t0 + 0.1, lisT - 0.2)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="LISTEN WHILE WE CAN" s={pop(t, lisT - 0.2)} bg={BEAM} size={52} />
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
  [S.hook, HookScene],
  [S.mile, MileScene],
  [S.fix, FixScene],
  [S.cheat, CheatScene],
  [S.head, HeadScene],
  [S.time, TimeScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// All sounds reused from earlier episodes (0 new SFX credits). len cuts a bed off with a fade.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.mile, S.fix, S.cheat, S.head, S.time, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: 'asteroid/sfx/scan', at: 0.2, db: -20},
  {f: I('stamp'), at: ph('two days') - 0.1, db: -12},
  {f: 'bbstream/sfx/ping', at: ph('hello') - 0.1, db: -16},
  {f: I('stamp'), at: ph('lightday away') - 0.1, db: -14},
  {f: I('pop'), at: ph('catch up') - 0.13, db: -20},
  {f: I('stamp'), at: ph('first humanmade'), db: -14},
  {f: I('stamp'), at: ph('twentysix billion') - 0.1, db: -13},
  {f: 'plastic/sfx/clock', at: ph('even light'), db: -16},
  {f: I('pages'), at: S.fix + 0.1, db: -18},
  {f: 'sun/sfx/rocket', at: ph('just build'), db: -14, len: 2.2},
  {f: 'sleep/sfx/dizzy', at: ph('right') - 0.05, db: -20},
  {f: I('whoosh'), at: ph('jupiter'), db: -16},
  {f: I('whoosh'), at: ph('saturn') + 0.3, db: -16},
  {f: I('stamp'), at: ph('stole speed'), db: -12},
  {f: I('pop'), at: ph('new horizons') - 0.1, db: -20},
  {f: I('stamp'), at: ph('slower than') - 0.1, db: -13},
  {f: I('stamp'), at: ph('seventeen') - 0.1, db: -14},
  {f: 'sun/sfx/rocket', at: ph('to catch it'), db: -18, len: 2},
  {f: I('stamp'), at: ph('three times') - 0.1, db: -12},
  {f: I('pop'), at: ph('nuclear battery') - 0.1, db: -20},
  {f: 'sun/sfx/fail', at: ph('four watts') - 0.1, db: -18},
  {f: 'lightning/sfx/zap', at: ph('most of its'), db: -20},
  {f: I('stamp'), at: ph('be silent') - 0.1, db: -12},
  {f: 'bbstream/sfx/ping', at: ph('we listen'), db: -16},
  {f: 'bbstream/sfx/ping', at: ph('we listen') + 1.2, db: -20},
  {f: I('pop'), at: ph('one day away') - 0.1, db: -18},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const VoyagerShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: SPACE_BG}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t >= S.end} />
      <Sequence from={Math.round(0.05 * FPS)} layout="none">
        <Audio src={staticFile('voyager/vo/vo.wav')} />
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
