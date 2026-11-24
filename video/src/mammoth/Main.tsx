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

// "Why don't we just bring back the woolly mammoth?" - Short, 1080x1920, 1080p, cover = separate Still MammothCover.
// New method: Higgsfield "parts sheets" (mammoth, elephant) assembled into cut-out rigs and animated in code
// (walk cycle, trunk swing, ear flap, tail wag, head nod); backgrounds as 3 parallax layers (sky/mid/ground) with an
// animated aurora (SVG displacement) and drifting snow. 0 video credits.

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const ICE = '#BFE6F5';
const DNA_A = '#FF6B8A';
const DNA_B = '#5DB7F5';

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






// ------------------------------------------------------------------ cut-out rigs (parts from Higgsfield parts sheets)

type Part = {src: string; w: number; h: number; x: number; y: number; px: number; py: number; rot?: number; sx?: number; sy?: number};
const PartImg: React.FC<{p: Part}> = ({p}) => (
  <g transform={`translate(${p.x + p.px} ${p.y + p.py}) rotate(${p.rot ?? 0}) scale(${p.sx ?? 1} ${p.sy ?? 1}) translate(${-p.px} ${-p.py})`}>
    <image href={staticFile(`mammoth/parts/${p.src}.png`)} x={0} y={0} width={p.w} height={p.h} />
  </g>
);

// Woolly mammoth (faces left). Rig units = parts-sheet pixels; feet at y ~ 560. walk 0..1 = walking amount.
// mood: 'happy' | 'sad' (head droops). Bottom centre at (x, y), ~300 px tall at s=1.
export const Mammoth: React.FC<{x: number; y: number; s?: number; t: number; walk?: number; nod?: number; trunkUp?: number; flip?: boolean; sx?: number; sy?: number}> = ({x, y, s = 1, t, walk = 0, nod = 0, trunkUp = 0, flip = false, sx = 1, sy = 1}) => {
  const ph = t * 7;
  const legA = Math.sin(ph) * 14 * walk;
  const bob = Math.abs(Math.sin(ph)) * 8 * walk + Math.sin(t * 2.2) * 3;
  const head = Math.sin(t * 1.7) * 3 + Math.sin(ph) * 3 * walk + nod;
  const trunk = Math.sin(t * 2.3 + 0.6) * 9 - trunkUp * 55 + Math.sin(ph + 1) * 6 * walk;
  const tail = Math.sin(t * 5) * 14;
  const parts: Part[] = [
    {src: 'm6', w: 144, h: 256, x: 330, y: 250, px: 72, py: 30, rot: -legA},
    {src: 'm4', w: 147, h: 258, x: 60, y: 252, px: 73, py: 30, rot: legA},
    {src: 'm7', w: 131, h: 215, x: 430, y: 120 - bob, px: 14, py: 14, rot: tail},
    {src: 'm2', w: 470, h: 372, x: 0, y: -bob, px: 235, py: 186},
    {src: 'm5', w: 140, h: 258, x: 270, y: 262, px: 70, py: 30, rot: legA * 0.9},
    {src: 'm3', w: 152, h: 260, x: 0, y: 264, px: 76, py: 30, rot: -legA * 0.9},
    {src: 'm1', w: 189, h: 321, x: -215, y: 175 - bob, px: 120, py: 18, rot: trunk + head * 0.6},
    {src: 'm0', w: 332, h: 322, x: -230, y: -30 - bob, px: 250, py: 230, rot: head},
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s * 0.55 * sx} ${s * 0.55 * sy}) translate(-200 -560)`}>
      {parts.map((p, i) => (
        <PartImg key={i} p={p} />
      ))}
    </g>
  );
};

// Asian elephant (faces right). Feet at y ~ 540. ear flaps, trunk swings, tail wags.
export const Elephant: React.FC<{x: number; y: number; s?: number; t: number; walk?: number; sad?: number; sx?: number; sy?: number}> = ({x, y, s = 1, t, walk = 0, sad = 0, sx = 1, sy = 1}) => {
  const ph = t * 6;
  const legA = Math.sin(ph) * 12 * walk;
  const bob = Math.abs(Math.sin(ph)) * 6 * walk + Math.sin(t * 2) * 2;
  const ear = 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(t * 3.2));
  const head = Math.sin(t * 1.5) * 2 + sad * 10;
  const trunk = Math.sin(t * 2.1) * 8 + sad * 12;
  const tail = Math.sin(t * 4.5 + 1) * 14;
  const parts: Part[] = [
    {src: 'e5', w: 142, h: 247, x: 30, y: 200, px: 71, py: 30, rot: legA},
    {src: 'e7', w: 124, h: 247, x: 215, y: 200, px: 62, py: 30, rot: -legA},
    {src: 'e6', w: 135, h: 246, x: 95, y: 210, px: 67, py: 30, rot: -legA * 0.9},
    {src: 'e8', w: 132, h: 250, x: 265, y: 207, px: 66, py: 30, rot: legA * 0.9},
    {src: 'e4', w: 100, h: 236, x: 4, y: 105 - bob, px: 14, py: 12, rot: -tail, sx: -1},
    {src: 'e0', w: 379, h: 309, x: 0, y: -bob, px: 190, py: 155},
    {src: 'e3', w: 169, h: 235, x: 470, y: 150 - bob, px: 30, py: 15, rot: trunk + head},
    {src: 'e1t', w: 250, h: 260, x: 293, y: -47 - bob, px: 57, py: 197, rot: head},
    {src: 'e2', w: 158, h: 202, x: 262, y: 20 - bob, px: 150, py: 60, rot: head, sx: ear},
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * 0.55 * sx} ${s * 0.55 * sy}) translate(-250 -540)`}>
      {parts.map((p, i) => (
        <PartImg key={i} p={p} />
      ))}
    </g>
  );
};

// Rig test sheet (Still "MammothRigTest").
export const MammothRigTest: React.FC = () => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{background: '#9BD3F7'}}>
    <Mammoth x={540} y={520} s={1.6} t={0} />
    <Mammoth x={540} y={1020} s={1.6} t={0.25} walk={1} />
    <Elephant x={540} y={1520} s={1.6} t={0.1} />
    <Elephant x={540} y={1880} s={1.0} t={0.4} walk={1} />
  </svg>
);

// ------------------------------------------------------------------ backgrounds (3 parallax layers)

// Sky (Higgsfield) with a wavy aurora: the top half is drawn in 24 strips that sway sideways.
const ArcticSky: React.FC<{t: number}> = ({t}) => (
  <g>
    <image href={staticFile('mammoth/sky.jpg')} x={0} y={0} width={1080} height={1920} />
    {Array.from({length: 24}).map((_, i) => {
      const y0 = 60 + i * 40;
      const dx = Math.sin(t * 0.9 + i * 0.35) * 14;
      return (
        <g key={i}>
          <clipPath id={`aur${i}`}>
            <rect x={-40} y={y0} width={1160} height={41} />
          </clipPath>
          <g clipPath={`url(#aur${i})`} transform={`translate(${dx} 0)`}>
            <image href={staticFile('mammoth/sky.jpg')} x={0} y={0} width={1080} height={1920} />
          </g>
        </g>
      );
    })}
  </g>
);

// Full Arctic backdrop: sky + mountains (parallax 0.35) + ground (parallax 1). camX shifts the view sideways.
const Arctic: React.FC<{t: number; camX?: number; ground?: number}> = ({t, camX = 0, ground = 1380}) => (
  <g>
    <ArcticSky t={t} />
    {[0, 1].map((k) => (
      <image key={k} href={staticFile('mammoth/mid.png')} x={-160 - ((camX * 0.35) % 1380) + k * 1380} y={ground - 470} width={1400} height={566} />
    ))}
    <rect x={-200} y={ground + 380} width={1480} height={400} fill="#EEF5FB" />
    {[0, 1].map((k) => (
      <image key={k} href={staticFile('mammoth/ground.png')} x={-160 - (camX % 1590) + k * 1590} y={ground - 40} width={1400 * 1.15} height={396 * 1.15} />
    ))}
  </g>
);

// Drifting snow in front of everything.
const Snow: React.FC<{t: number; n?: number}> = ({t, n = 40}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const sp = 60 + rnd(i) * 80;
      const y = ((rnd(i + 7) * 2000 + t * sp) % 2000) - 40;
      const x = rnd(i + 3) * 1080 + Math.sin(t * 0.8 + i) * 30;
      return <circle key={i} cx={x} cy={y} r={3 + rnd(i + 11) * 5} fill="#fff" opacity={0.85} />;
    })}
  </g>
);

// Wolf (Higgsfield sprite 700x657, facing left, feet at y 652).
const Wolf: React.FC<{x: number; y: number; s?: number; t: number; tilt?: number}> = ({x, y, s = 1, t, tilt = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt + Math.sin(t * 1.5) * 1.5}) scale(${s * 0.5} ${s * 0.5 * (1 + 0.012 * Math.sin(t * 2.4))}) translate(-350 -652)`}>
    <image href={staticFile('mammoth/wolf.png')} x={0} y={0} width={700} height={657} />
  </g>
);

// DNA double helix (code), centre (x, y), height h; marks = how many edit markers glow (0..1 of the rungs).
const Helix: React.FC<{x: number; y: number; h?: number; t: number; marks?: number; s?: number}> = ({x, y, h = 520, t, marks = 0, s = 1}) => {
  const n = 16;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({length: n}).map((_, i) => {
        const yy = -h / 2 + (i / (n - 1)) * h;
        const a = t * 2 + i * 0.55;
        const x1 = Math.sin(a) * 90;
        const x2 = -x1;
        const lit = i / n < marks;
        return (
          <g key={i}>
            <line x1={x1} y1={yy} x2={x2} y2={yy} stroke={lit ? C.yellow : '#fff'} strokeWidth={lit ? 12 : 8} />
            <circle cx={x1} cy={yy} r={16} fill={DNA_A} stroke={C.ink} strokeWidth={5} opacity={0.5 + 0.5 * Math.cos(a) ** 2} />
            <circle cx={x2} cy={yy} r={16} fill={DNA_B} stroke={C.ink} strokeWidth={5} opacity={0.5 + 0.5 * Math.cos(a) ** 2} />
          </g>
        );
      })}
    </g>
  );
};

// Ice block over something (centre x, y, w, h), opacity melt.
const IceBlock: React.FC<{x: number; y: number; w: number; h: number; o?: number}> = ({x, y, w, h, o = 1}) => (
  <g opacity={o}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={30} fill={ICE} opacity={0.55} stroke={C.ink} strokeWidth={INK_W} />
    <path d={`M ${x - w / 2 + 40} ${y - h / 2 + 50} L ${x - w / 2 + 140} ${y - h / 2 + 30}`} stroke="#fff" strokeWidth={16} strokeLinecap="round" opacity={0.8} />
  </g>
);

const Poof: React.FC<{x: number; y: number; t: number; t0: number}> = ({x, y, t, t0}) => {
  if (t < t0 || t > t0 + 0.8) return null;
  const u = (t - t0) / 0.8;
  return (
    <g opacity={1 - u}>
      {Array.from({length: 9}).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <circle key={i} cx={x + Math.cos(a) * 180 * u} cy={y + Math.sin(a) * 120 * u} r={60 * (1 - u * 0.5)} fill="#fff" stroke={C.ink} strokeWidth={5} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ scenes

const S = {
  hook: 0,
  dna: ph('the last mammoths') - 0.05,
  gap: ph('the first problem') - 0.05,
  mother: ph('the second problem') - 0.05,
  wolf: ph('and even then') - 0.05,
  soil: ph('some hope') - 0.05,
  final: ph('so the mammoth') - 0.05,
  end: VO_END + 0.3,
};

// Separate cover (Still "MammothCover").
export const MammothCover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#1D3B5A'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Arctic t={0.5} />
      <Mammoth x={620} y={1600} s={2.3} t={0.3} />
      <Calendar x={840} y={950} s={0.6} label="2028?" flip={0} />
      <RedCircle x={840} y={960} r={150} />
      <Snow t={1.2} n={30} />
    </svg>
    <BigSci pose="shrug" x={210} y={1380} headR={100} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={540} y={530} text="WHERE'S MY" size={120} />
        <BigText x={540} y={730} text="MAMMOTH?!" size={160} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />
  </AbsoluteFill>
);

// HOOK (frame 0): a mammoth walks across the aurora-lit tundra, "2028" slams, "PROMISED", "BRING IT BACK?"
const HookScene: React.FC<{t: number}> = ({t}) => {
  const yrT = ph('twenty twentyeight');
  const alT = ph('already');
  const walkIn = ease(t, 0, 2.2, (u) => 1 - Math.pow(1 - u, 2));
  const sh = camShake(t, [[yrT, 12]]);
  return (
    <Stage cam={{s: lerp(1.1, 1, ease(t, 0, 1.8)), x: 540 + sh.x, y: 960 + sh.y}}>
      <Layer>
        <Arctic t={t} camX={walkIn * 120} />
        <Mammoth x={lerp(900, 560, walkIn)} y={1560} s={2} t={t} walk={1 - ease(t, 2.0, 2.4)} nod={t > alT ? -6 : 0} />
        <Snow t={t} />
        {t > yrT - 0.1 && t < alT - 0.1 && <Calendar x={540} y={620} s={0.7 * slam(t, yrT - 0.1)} label="2028" flip={0} />}
        {t > yrT + 0.3 && t < alT - 0.1 && <Stamp x={540} y={860} text="PROMISED" s={springIn(t, yrT + 0.3, 0.5, 10)} />}
        {t > alT - 0.1 && <BigText x={540} y={640} text="BRING IT BACK?" size={98 * springIn(t, alT - 0.1, 0.55, 9)} fill={C.yellow} />}
        <Pill x={540} y={300} text="THE WOOLLY MAMMOTH" s={span(t, 0.1, alT - 0.1)} bg={C.paper} size={54} />
      </Layer>
    </Stage>
  );
};

// Died out ~4,000 years ago; DNA survived in the ice; edit an elephant and you get a mammoth. Simple, right?
const DnaScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.dna;
  const yrsT = ph('four thousand');
  const dnaT = ph('their dna');
  const editT = ph('edit an elephant');
  const getT = ph('you get a');
  const simpleT = ph('simple right');
  const frozen = t < editT;
  const fly = ease(t, editT + 0.3, getT - 0.1);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Arctic t={t} camX={120} />
        {frozen ? (
          <g>
            <Mammoth x={560} y={1560} s={1.8} t={t * 0.15} nod={10} />
            {t > yrsT - 0.3 && <IceBlock x={560} y={1300} w={760} h={600} o={springIn(t, yrsT - 0.3, 0.5)} />}
            {t > dnaT - 0.1 && <Helix x={560} y={700} h={420} t={t} s={springIn(t, dnaT - 0.1, 0.6)} />}
            {t > yrsT - 0.1 && t < dnaT - 0.1 && <BigText x={540} y={640} text="4,000 YEARS AGO" size={84 * slam(t, yrsT - 0.1)} fill={C.paper} />}
          </g>
        ) : t < getT ? (
          <g>
            <Elephant x={lerp(-200, 560, ease(t, editT - 0.1, editT + 0.7))} y={1560} s={1.8} t={t} walk={1 - ease(t, editT + 0.5, editT + 0.8)} />
            <Helix x={lerp(560, 640, fly)} y={lerp(700, 1250, fly)} h={420} t={t} s={1 - fly * 0.8} />
          </g>
        ) : (
          <g>
            <Mammoth x={560} y={1560} s={1.9 * springIn(t, getT, 0.5, 9)} t={t} />
            <Poof x={560} y={1300} t={t} t0={getT - 0.05} />
          </g>
        )}
        {t > simpleT - 0.05 && <BigText x={540} y={640} text="SIMPLE, RIGHT?" size={104 * springIn(t, simpleT - 0.05, 0.5, 9)} fill={C.paper} />}
        <Snow t={t} n={25} />
        <Pill x={540} y={300} text="DNA SURVIVED IN THE ICE" s={span(t, dnaT - 0.1, editT)} bg={ICE} size={50} />
        <Pill x={540} y={300} text="EDIT AN ELEPHANT..." s={span(t, editT, getT)} bg={C.paper} size={54} />
        <Pill x={540} y={300} text="...GET A MAMMOTH!" s={pop(t, getT)} bg={C.green} size={54} />
      </Layer>
      {t > getT && <Sci t={t} x={180} y={1330} headR={40} poses={[[0, 'thumbs'], [simpleT, 'think']]} />}
    </Stage>
  );
};

// Problem 1: the gap. ~65 edits planned -> now >150. First calf moved from 2028 to the early 2030s.
const GapScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.gap;
  const oneT = ph('one gene');
  const n65 = ph('sixtyfive');
  const n150 = ph('hundred and fifty');
  const calfT = ph('so the first calf');
  const lateT = ph('early twentythirties');
  const count = t < n65 ? 0 : t < n150 ? 65 : Math.round(lerp(65, 150, ease(t, n150 - 0.3, n150 + 0.6)));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect width={1080} height={1920} fill="#1D3B5A" />
        <Sunburst t={t} cx={540} cy={1000} />
        {t < calfT ? (
          <g>
            <Elephant x={260} y={1380} s={0.95} t={t} />
            <Mammoth x={830} y={1380} s={0.95} t={t} />
            <Arrow x1={420} y1={1000} x2={660} y2={1000} color={C.yellow} w={16} head={38} />
            {t > oneT - 0.1 && t < n65 - 0.1 && <Stamp x={540} y={820} text="NOT 1 GENE" s={springIn(t, oneT - 0.1, 0.5, 10)} />}
            {t > n65 - 0.1 && (
              <g>
                <Helix x={540} y={720} h={360} t={t} s={0.8} marks={count / 160} />
                <BigText x={540} y={540} text={count >= 150 ? '150+ EDITS' : `${count} EDITS`} size={100 * springIn(t, n65 - 0.1, 0.5, 9)} fill={C.yellow} />
              </g>
            )}
          </g>
        ) : (
          <g>
            <Calendar x={540} y={760} s={0.9} label={t > lateT - 0.1 ? '2030s' : '2028'} prev="2028" flip={ease(t, lateT - 0.4, lateT - 0.05)} />
            {t > lateT && <Stamp x={540} y={1100} text="DELAYED" s={springIn(t, lateT, 0.5, 10)} />}
            <Mammoth x={820} y={1420} s={0.8} t={t} nod={14} />
          </g>
        )}
        <Pill x={540} y={300} text="PROBLEM 1: THE GAP" s={span(t, t0 + 0.1, n65 - 0.1)} bg={C.red} fg={C.paper} size={56} />
        <Pill x={540} y={300} text="COLOSSAL'S GENE EDITS" s={span(t, n65 - 0.1, calfT)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text="FIRST CALF: LATER" s={pop(t, calfT)} bg={C.yellow} size={54} />
      </Layer>
    </Stage>
  );
};

// Problem 2: the mother. 22-month pregnancy; Asian elephants are endangered; a big ask.
const MotherScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.mother;
  const moT = ph('twentytwo months');
  const endT = ph('endangered');
  const askT = ph('big ask');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Arctic t={t} camX={60} />
        <Elephant x={560} y={1560} s={1.9} t={t} sad={ease(t, endT, endT + 0.6)} sx={1 + 0.04 * Math.sin(t * 2)} />
        {t > moT - 0.1 && (
          <g>
            <Calendar x={200} y={780} s={0.55 * springIn(t, moT - 0.1, 0.5)} label={`${Math.min(22, Math.max(1, Math.round(lerp(1, 22, ease(t, moT - 0.1, moT + 1.3)))))} MO`} flip={0} />
          </g>
        )}
        {t > endT - 0.05 && t < askT - 0.1 && <Stamp x={660} y={640} text="ENDANGERED" s={springIn(t, endT - 0.05, 0.5, 10)} />}
        {t > askT - 0.1 && <BigText x={540} y={560} text="A BIG ASK" size={110 * springIn(t, askT - 0.1, 0.5, 9)} fill={C.yellow} />}
        <Snow t={t} n={25} />
        <Pill x={540} y={300} text="PROBLEM 2: THE MOTHER" s={span(t, t0 + 0.1, endT - 0.05)} bg={C.red} fg={C.paper} size={52} />
        <Pill x={540} y={300} text="ASIAN ELEPHANTS" s={pop(t, endT - 0.05)} bg={C.paper} size={56} />
      </Layer>
    </Stage>
  );
};

// Is it even a mammoth? 2025 "dire wolves" = gray wolves with 20 edits, many scientists said.
const WolfScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.wolf;
  const isT = ph('is it a mammoth');
  const dwT = ph('dire');
  const grT = ph('gray wolves');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Arctic t={t} camX={200} />
        {t < dwT - 0.1 ? (
          <g>
            <Mammoth x={560} y={1560} s={1.8} t={t} />
            {t > isT - 0.1 && <BigText x={540} y={640} text="A REAL MAMMOTH?" size={82 * springIn(t, isT - 0.1, 0.5, 9)} fill={C.paper} />}
          </g>
        ) : (
          <g>
            <Wolf x={560} y={1560} s={1.6 * springIn(t, dwT - 0.1, 0.6, 10)} t={t} tilt={t > grT ? -6 : 0} />
            {t > grT - 0.05 && <Stamp x={540} y={700} text="GRAY WOLF + 20 EDITS" s={springIn(t, grT - 0.05, 0.5, 10)} size={56} />}
          </g>
        )}
        <Snow t={t} n={25} />
        <Pill x={540} y={300} text="IS IT EVEN A MAMMOTH?" s={span(t, t0 + 0.1, dwT - 0.1)} bg={C.paper} size={50} />
        <Pill x={540} y={300} text='2025: "DIRE WOLVES"' s={pop(t, dwT - 0.1)} bg={C.yellow} size={54} />
      </Layer>
    </Stage>
  );
};

// Some hope mammoth herds could protect frozen soil by trampling snow; a small study found hints; no proof at scale.
const SoilScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.soil;
  const trT = ph('trampling');
  const stT = ph('a small study');
  const npT = ph('but no proof');
  const pan = (t - t0) * 70;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Arctic t={t} camX={pan} />
        {[0, 1, 2].map((i) => (
          <Mammoth key={i} x={300 + i * 300 - ((t - t0) * 40) % 60} y={1520 + (i % 2) * 40} s={0.95} t={t + i * 0.4} walk={1} />
        ))}
        {t > trT &&
          Array.from({length: 8}).map((_, i) => {
            const u = ((t - trT) * 1.2 + i / 8) % 1;
            return <circle key={i} cx={200 + i * 100} cy={1560 - u * 60} r={20 + u * 30} fill="#fff" opacity={1 - u} stroke={C.ink} strokeWidth={3} />;
          })}
        {t > stT - 0.1 && t < npT - 0.05 && <Pill x={540} y={700} text="A SMALL STUDY: HINTS" s={springIn(t, stT - 0.1, 0.5)} bg={C.green} size={52} />}
        {t > npT - 0.05 && <Stamp x={540} y={700} text="NO PROOF AT SCALE" s={springIn(t, npT - 0.05, 0.5, 10)} size={60} />}
        <Snow t={t} n={30} />
        <Pill x={540} y={300} text="HERDS PROTECTING FROZEN SOIL?" s={pop(t, t0 + 0.1)} bg={ICE} size={42} />
      </Layer>
    </Stage>
  );
};

// Payoff: might come back one day, slower and less real; before we bring back the mammoth, save the elephant.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const slowT = ph('just slower');
  const befT = ph('before we bring');
  const saveT = ph('save the elephant');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Arctic t={t} camX={80} />
        {t < befT ? (
          <g>
            <Mammoth x={lerp(820, 600, ease(t, t0, befT, (u) => u))} y={1560} s={1.6} t={t * 0.5} walk={0.6} />
            {t > slowT - 0.1 && <BigText x={540} y={640} text="SLOWER. LESS REAL." size={76 * springIn(t, slowT - 0.1, 0.5, 9)} fill={C.paper} />}
          </g>
        ) : (
          <g>
            <Elephant x={600} y={1560} s={1.6} t={t} />
            <Elephant x={880} y={1580} s={0.7 * springIn(t, befT + 0.4, 0.6, 10)} t={t + 1} />
            {t > saveT - 0.1 && <Stamp x={540} y={680} text="SAVE THE ELEPHANT" s={springIn(t, saveT - 0.1, 0.5, 10)} size={62} />}
          </g>
        )}
        <Snow t={t} n={25} />
        <Pill x={540} y={300} text="ONE DAY, MAYBE" s={span(t, t0 + 0.1, befT)} bg={C.paper} size={56} />
        <Pill x={540} y={300} text="FIRST THINGS FIRST" s={pop(t, befT)} bg={C.yellow} size={56} />
      </Layer>
      {t > befT && <Sci t={t} x={180} y={1330} headR={40} poses={[[0, 'present'], [saveT, 'point']]} />}
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
  [S.dna, DnaScene],
  [S.gap, GapScene],
  [S.mother, MotherScene],
  [S.wolf, WolfScene],
  [S.soil, SoilScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

// All sounds reused from earlier episodes (0 new SFX credits). len cuts a bed off with a fade.
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.dna, S.gap, S.mother, S.wolf, S.soil, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: 'titanic/sfx/deep', at: 0, db: -28, len: S.gap},
  {f: 'titanic/sfx/groan', at: 0.3, db: -20},
  {f: I('stamp'), at: ph('twenty twentyeight') - 0.1, db: -12},
  {f: I('stamp'), at: ph('twenty twentyeight') + 0.3, db: -16},
  {f: I('pop'), at: ph('already') - 0.13, db: -20},
  {f: I('crack'), at: ph('four thousand') - 0.3, db: -16},
  {f: 'bbstream/sfx/data', at: ph('their dna') - 0.1, db: -18},
  {f: I('whoosh'), at: ph('edit an elephant') + 0.3, db: -18},
  {f: 'lightning/sfx/zap', at: ph('you get a') - 0.05, db: -16},
  {f: I('pop'), at: ph('you get a'), db: -18},
  {f: 'sleep/sfx/dizzy', at: ph('simple right') - 0.05, db: -20},
  {f: I('stamp'), at: ph('one gene') - 0.1, db: -14},
  {f: 'bbstream/sfx/data', at: ph('sixtyfive') - 0.1, db: -18},
  {f: 'bbstream/sfx/data', at: ph('hundred and fifty') - 0.3, db: -16},
  {f: I('pages'), at: ph('early twentythirties') - 0.4, db: -16},
  {f: I('stamp'), at: ph('early twentythirties'), db: -12},
  {f: I('pages'), at: ph('twentytwo months') - 0.1, db: -18},
  {f: I('stamp'), at: ph('endangered') - 0.05, db: -12},
  {f: I('pop'), at: ph('big ask') - 0.13, db: -20},
  {f: I('pop'), at: ph('is it a mammoth') - 0.13, db: -20},
  {f: I('pop'), at: ph('dire') - 0.1, db: -18},
  {f: I('stamp'), at: ph('gray wolves') - 0.05, db: -12},
  {f: 'titanic/sfx/groan', at: S.soil + 0.2, db: -22},
  {f: I('bonk'), at: ph('trampling'), db: -18},
  {f: I('bonk'), at: ph('trampling') + 0.45, db: -20},
  {f: I('pop'), at: ph('a small study') - 0.1, db: -20},
  {f: I('stamp'), at: ph('but no proof') - 0.05, db: -12},
  {f: I('pop'), at: ph('just slower') - 0.1, db: -20},
  {f: I('pop'), at: ph('before we bring') + 0.4, db: -20},
  {f: I('stamp'), at: ph('save the elephant') - 0.1, db: -12},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const MammothShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: '#1D3B5A'}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t >= S.end} />
      <Sequence from={Math.round(0.05 * FPS)} layout="none">
        <Audio src={staticFile('mammoth/vo/vo.wav')} />
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
