import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Sky, Sun, Sunburst, Thermo, textWidth} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

import {blink, camShake, ease, impact, jiggle, springIn} from '../kit/motion';

// "What was normal in 1977?" - companion Short to the Voyager one-light-day episode. 1080x1920, 1080p, cover = Still
// Y1977Cover. First episode mixing REAL photos (NASA public domain + Wikimedia Commons, credited on the card and in
// the description) as Polaroid cards with the usual cartoon style (Voyager, rotary phone, retro TV, scientist).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const RETRO = '#F2A65A';
const RETRO_D = '#D9822B';
const PAPER = '#FFF8E7';

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

// Warm retro background: sunburst in 70s orange with a halftone dot pattern.
const Retro: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill={RETRO} />
    {Array.from({length: 14}).map((_, i) => {
      const a0 = (i / 14) * Math.PI * 2 + t * 0.04;
      const a1 = a0 + Math.PI / 14;
      const R = 2600;
      return <path key={i} d={`M 540 960 L ${540 + R * Math.cos(a0)} ${960 + R * Math.sin(a0)} L ${540 + R * Math.cos(a1)} ${960 + R * Math.sin(a1)} Z`} fill={RETRO_D} opacity={0.55} />;
    })}
    {Array.from({length: 16}).map((_, r) =>
      Array.from({length: 10}).map((_, c) => <circle key={`${r}-${c}`} cx={60 + c * 110 + (r % 2) * 55} cy={60 + r * 120} r={5} fill="#fff" opacity={0.12} />),
    )}
  </g>
);

// Real photo as a Polaroid card: white frame, ink outline, hard shadow, slight tilt, slow zoom inside the frame,
// a small credit line under the picture. (x, y) = centre, w = picture width (height follows the photo's aspect).
const Photo: React.FC<{src: string; iw: number; ih: number; x: number; y: number; w: number; t: number; t0: number; rot?: number; credit?: string; label?: string; round?: boolean}> = ({src, iw, ih, x, y, w, t, t0, rot = -3, credit, label, round}) => {
  const s = springIn(t, t0, 0.6, 10);
  if (s <= 0.001) return null;
  const h = (w * ih) / iw;
  const pad = 22;
  const bottom = credit ? 64 : pad;
  const zoom = 1 + 0.06 * clamp((t - t0) / 6);
  const id = `ph-${src.replace(/[^a-z0-9]/gi, '')}-${Math.round(x)}`;
  const W2 = w + pad * 2;
  const H2 = h + pad + bottom;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + jiggle(t, t0, 4, 4, 5)}) scale(${s})`}>
      <rect x={-W2 / 2 + 12} y={-H2 / 2 + 14} width={W2} height={H2} rx={10} fill={C.ink} />
      <rect x={-W2 / 2} y={-H2 / 2} width={W2} height={H2} rx={10} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
      <clipPath id={id}>
        {round ? <circle cx={0} cy={-H2 / 2 + pad + h / 2} r={Math.min(w, h) / 2} /> : <rect x={-w / 2} y={-H2 / 2 + pad} width={w} height={h} />}
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <image href={staticFile(`y1977/photos/${src}.jpg`)} x={-(w * zoom) / 2} y={-H2 / 2 + pad + (h - h * zoom) / 2} width={w * zoom} height={h * zoom} preserveAspectRatio="xMidYMid slice" />
      </g>
      <rect x={-w / 2} y={-H2 / 2 + pad} width={w} height={h} fill="none" stroke={C.ink} strokeWidth={4} />
      {credit && (
        <text x={0} y={H2 / 2 - 22} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={22} fill="#555">
          {credit}
        </text>
      )}
      {label && (
        <Pill x={-w / 2 + 18 + (textWidth(label, 32, 800, 32 * 0.04) + 32 * 1.4) / 2} y={-H2 / 2 + pad + 40} text={label} bg={C.yellow} size={32} />
      )}
    </g>
  );
};

// Cartoon sprites (Higgsfield): rotary wall phone (404x544), retro TV (553x517, screen at 44,83 309x269).
const WallPhone: React.FC<{x: number; y: number; s?: number; t: number; ring?: number}> = ({x, y, s = 1, t, ring = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${ring * Math.sin(t * 50) * 4}) scale(${s}) translate(-202 -272)`}>
    <image href={staticFile('y1977/phone.png')} x={0} y={0} width={404} height={544} />
  </g>
);
const RetroTV: React.FC<{x: number; y: number; s?: number; t: number; children?: React.ReactNode}> = ({x, y, s = 1, t, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-276 -258)`}>
    <image href={staticFile('y1977/tv.png')} x={0} y={0} width={553} height={517} />
    <clipPath id="tvscreen">
      <rect x={52} y={90} width={293} height={255} rx={30} />
    </clipPath>
    <g clipPath="url(#tvscreen)">
      {children}
      {Array.from({length: 26}).map((_, i) => <rect key={i} x={52} y={90 + i * 10 + ((t * 40) % 10)} width={293} height={3} fill="#000" opacity={0.12} />)}
    </g>
  </g>
);

// Voyager sprite (from the Voyager episode) with a code face.
const Voyager: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood; rot?: number}> = ({x, y, s = 1, t, mood = 'happy', rot = 0}) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.3) * 8}) rotate(${rot + Math.sin(t * 0.9) * 2}) scale(${s * 0.48}) translate(-425 -380)`}>
    <image href={staticFile('voyager/voyager.png')} x={0} y={0} width={800} height={762} />
    <Face x={425} y={250} s={1.25} mood={mood} open={blink(t, 1)} gap={56} />
  </g>
);

// Memory bars: Voyager's ~69 KB vs one phone photo (several MB) - drawn to scale (bar for 3 MB).
const MemoryBars: React.FC<{x: number; y: number; t: number; t0: number}> = ({x, y, t, t0}) => {
  const g = ease(t, t0, t0 + 1.2);
  const full = 760;
  const kb69 = Math.max(8, full * (69 / 3000));
  return (
    <g transform={`translate(${x} ${y})`}>
      <text x={0} y={-20} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={42} fill={PAPER} stroke={C.ink} strokeWidth={9} paintOrder="stroke fill">VOYAGER: 69 KB</text>
      <rect x={0} y={0} width={kb69} height={60} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={150} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={42} fill={PAPER} stroke={C.ink} strokeWidth={9} paintOrder="stroke fill">ONE PHONE PHOTO (~3 MB)</text>
      <rect x={0} y={170} width={full * g} height={60} fill={C.green} stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

// Cartoon virus (smallpox) with a sad face, crossed out when eradicated.
const Virus: React.FC<{x: number; y: number; s?: number; t: number; gone?: number}> = ({x, y, s = 1, t, gone = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${t * 10}) scale(${s})`}>
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <g key={i}>
          <line x1={Math.cos(a) * 110} y1={Math.sin(a) * 110} x2={Math.cos(a) * 160} y2={Math.sin(a) * 160} stroke={C.ink} strokeWidth={12} />
          <circle cx={Math.cos(a) * 165} cy={Math.sin(a) * 165} r={18} fill="#C77DDB" stroke={C.ink} strokeWidth={6} />
        </g>
      );
    })}
    <circle r={120} fill="#B565CC" stroke={C.ink} strokeWidth={INK_W} />
    <g transform={`rotate(${-t * 10})`}>
      <Face x={0} y={0} s={0.75} mood={gone > 0.5 ? 'dizzy' : 'smug'} open={blink(t, 5)} gap={44} />
    </g>
    {gone > 0 && (
      <g transform={`rotate(${-t * 10}) scale(${gone})`}>
        <path d="M -170 -170 L 170 170 M 170 -170 L -170 170" stroke={C.ink} strokeWidth={60} strokeLinecap="round" />
        <path d="M -170 -170 L 170 170 M 170 -170 L -170 170" stroke={C.red} strokeWidth={36} strokeLinecap="round" />
      </g>
    )}
  </g>
);

// Star with a question-mark planet (no known exoplanets in 1977).
const LonelyStar: React.FC<{x: number; y: number; s?: number; t: number; seed: number}> = ({x, y, s = 1, t, seed}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={50} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
    <circle r={110} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="10 12" opacity={0.6} />
    <g transform={`rotate(${t * 40 + seed * 70})`}>
      <text x={110} y={14} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={44} fill={PAPER} stroke={C.ink} strokeWidth={8} paintOrder="stroke fill">?</text>
    </g>
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  hook: 0,
  normal: ph('so what') - 0.05,
  comp: ph('computers') - 0.05,
  phone: ph('phones') - 0.05,
  music: ph('music came') - 0.05,
  games: ph('games') - 0.05,
  shuttle: ph('the space shuttle') - 0.05,
  people: ph('about four') - 0.05,
  pox: ph('smallpox') - 0.05,
  planets: ph('and nobody knew') - 0.05,
  record: ph('so voyager carries') - 0.05,
  end: VO_END + 0.3,
};

// Separate cover (Still "Y1977Cover"): built around the Voyager launch - launch photo as the hero, cartoon Voyager
// flying out of it, "WHEN VOYAGER LAUNCHED / IT WAS 1977" + small 1977 items (cassette, rotary phone).
export const Y1977Cover: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: RETRO}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Retro t={0} />
      <Photo src="launch" iw={889} ih={900} x={590} y={1300} w={680} t={10} t0={0} rot={-4} label="SEPT 5, 1977" />
      <Photo src="cassette" iw={1000} ih={688} x={850} y={1720} w={300} t={10} t0={0} rot={9} />
      <Voyager x={850} y={1000} s={0.9} t={0.4} mood="happy" rot={12} />
      <RedCircle x={850} y={990} r={185} />
    </svg>
    <BigSci pose="shocked" x={160} y={1420} headR={90} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)" data-skip="cover headline">
        <BigText x={470} y={500} text="WHEN VOYAGER" size={92} />
        <BigText x={470} y={610} text="LAUNCHED..." size={92} />
        <BigText x={500} y={760} text="NO WEB! NO MOBILES!" size={70} fill={C.yellow} />
      </g>
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 270, width: 420}} />
  </AbsoluteFill>
);

// HOOK (frame 0): Voyager launch photo already on screen, "NO WEB" stamp, "1977" slams.
const HookScene: React.FC<{t: number}> = ({t}) => {
  const webT = ph('without the web');
  const yrT = ph('nineteen seventyseven');
  const sh = camShake(t, [[yrT, 12]]);
  return (
    <Stage cam={{s: lerp(1.08, 1, ease(t, 0, 1.6)), x: 540 + sh.x, y: 960 + sh.y}}>
      <Layer>
        <Retro t={t} />
        <Photo src="launch" iw={889} ih={900} x={560} y={990} w={590} t={t} t0={-0.6} rot={-4} credit="NASA" label="VOYAGER 1 LAUNCH" />
        {t > webT - 0.05 && t < yrT - 0.2 && <Stamp x={540} y={500} text="NO WEB" s={springIn(t, webT - 0.05, 0.5, 10)} size={90} />}
        {t > yrT - 0.1 && <BigText x={540} y={520} text="1977" size={210 * slam(t, yrT - 0.1)} fill={C.yellow} />}
        <Pill x={540} y={300} text="SEPTEMBER 5, 1977" s={span(t, 0.1, yrT - 0.1)} bg={PAPER} size={54} />
      </Layer>
    </Stage>
  );
};

// "So what was normal back then?" - retro TV switches on.
const NormalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.normal;
  const on = ease(t, t0 + 0.2, t0 + 0.6);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        <RetroTV x={620} y={1060} s={1.45 * springIn(t, t0, 0.5)} t={t}>
          <rect x={52} y={90} width={293} height={255} fill={on > 0.5 ? '#3A6EA5' : '#222'} />
          {on > 0.5 && (
            <text x={198} y={240} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={74} fill={C.yellow} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
              1977
            </text>
          )}
        </RetroTV>
        <BigText x={540} y={560} text="WHAT WAS NORMAL?" size={68 * springIn(t, t0 + 0.1, 0.5, 9)} fill={PAPER} />
      </Layer>
      <Sci t={t} x={170} y={1330} headR={40} poses={[[0, 'shrug']]} />
    </Stage>
  );
};

// Computers: Apple II just on sale; Voyager flies on ~69 KB - less than one phone photo.
const CompScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.comp;
  const vT = ph('voyager itself');
  const kbT = ph('sixtynine');
  const lessT = ph('less than one');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        {t < vT - 0.1 ? (
          <Photo src="apple2" iw={1000} ih={512} x={540} y={1000} w={820} t={t} t0={t0 + 0.4} rot={-3} credit="Photo: The wub, CC BY-SA 4.0" label="APPLE II, 1977" />
        ) : (
          <g>
            <Voyager x={540} y={820} s={1.1 * springIn(t, vT - 0.1, 0.5)} t={t} mood="smug" />
            {t > kbT - 0.1 && t < lessT - 0.1 && <BigText x={540} y={1240} text="~69 KB" size={150 * slam(t, kbT - 0.1)} fill={C.yellow} />}
            {t > lessT - 0.1 && <MemoryBars x={150} y={1130} t={t} t0={lessT} />}
          </g>
        )}
        <Pill x={540} y={300} text="COMPUTERS" s={span(t, t0 + 0.1, vT - 0.1)} bg={PAPER} size={60} />
        <Pill x={540} y={300} text="VOYAGER'S MEMORY" s={pop(t, vT - 0.1)} bg={C.yellow} size={56} />
      </Layer>
    </Stage>
  );
};

// Phones: cords, on the wall. First handheld call 1973, but nobody you knew owned a mobile.
const PhoneScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.phone;
  const cordT = ph('they had cords');
  const hhT = ph('the first handheld');
  const nobT = ph('but nobody');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        <rect x={-100} y={500} width={1280} height={1100} fill="#E8D7B0" stroke={C.ink} strokeWidth={INK_W} />
        {Array.from({length: 9}).map((_, i) => <line key={i} x1={i * 140} x2={i * 140} y1={500} y2={1600} stroke="#D8C496" strokeWidth={30} />)}
        {t < hhT ? (
          <WallPhone x={540} y={1000} s={1.35 * springIn(t, t0 + 0.1, 0.5)} t={t} ring={t > cordT ? 1 - ease(t, cordT, cordT + 1.2) : 0} />
        ) : (
          <g>
            <WallPhone x={290} y={1000} s={0.95} t={t} />
            <Photo src="dynatac" iw={258} ih={900} x={740} y={1060} w={230} t={t} t0={hhT} rot={5} credit="Redrum0486, CC BY-SA 3.0" />
            {t > nobT - 0.05 && <Stamp x={540} y={700} text="NOT FOR YOU" s={springIn(t, nobT - 0.05, 0.5, 10)} />}
          </g>
        )}
        <Pill x={540} y={300} text="PHONES: CORDS + WALLS" s={span(t, t0 + 0.1, hhT)} bg={PAPER} size={52} />
        <Pill x={540} y={300} text="1973: FIRST HANDHELD CALL" s={pop(t, hhT)} bg={C.yellow} size={46} />
      </Layer>
    </Stage>
  );
};

// Music on cassettes; Walkman two more years away (1979).
const MusicScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.music;
  const wT = ph('the walkman');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        <Photo src="cassette" iw={1000} ih={688} x={540} y={1000} w={780} t={t} t0={t0 + 0.1} rot={4} credit="Jacek Halicki, CC BY-SA 4.0" />
        {t > wT - 0.1 && <Calendar x={820} y={640} s={0.55 * springIn(t, wT - 0.1, 0.5)} label="1979" flip={0} />}
        {t > wT - 0.1 && <BigText x={360} y={600} text="WALKMAN?" size={80 * springIn(t, wT, 0.5, 9)} fill={C.yellow} />}
        <Pill x={540} y={300} text="MUSIC: CASSETTES" s={span(t, t0 + 0.1, wT - 0.1)} bg={PAPER} size={56} />
        <Pill x={540} y={300} text="WALKMAN: NOT UNTIL 1979" s={pop(t, wT - 0.1)} bg={C.yellow} size={50} />
      </Layer>
    </Stage>
  );
};

// Games: Atari 2600. Star Wars had just hit cinemas (no film imagery - just a starfield on the retro TV).
const GamesScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.games;
  const swT = ph('and star wars');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        {t < swT - 0.1 ? (
          <Photo src="atari" iw={1000} ih={584} x={540} y={1000} w={820} t={t} t0={t0 + 0.3} rot={-4} credit="Evan-Amos, public domain" label="ATARI 2600" />
        ) : (
          <g>
            <RetroTV x={560} y={1050} s={1.5} t={t}>
              <rect x={52} y={90} width={293} height={255} fill="#05050F" />
              {Array.from({length: 40}).map((_, i) => {
                const u = ((t * 0.6 + rnd(i)) % 1);
                const a = rnd(i + 30) * Math.PI * 2;
                return <circle key={i} cx={198 + Math.cos(a) * u * 220} cy={218 + Math.sin(a) * u * 180} r={1 + u * 4} fill="#fff" opacity={u} />;
              })}
            </RetroTV>
            <BigText x={540} y={600} text="IN CINEMAS: MAY '77" size={76 * springIn(t, swT, 0.5, 9)} fill={C.yellow} />
          </g>
        )}
        <Pill x={540} y={300} text="GAMES" s={span(t, t0 + 0.1, swT - 0.1)} bg={PAPER} size={60} />
        <Pill x={540} y={300} text="STAR WARS, BRAND NEW" s={pop(t, swT - 0.1)} bg={C.yellow} size={52} />
      </Layer>
    </Stage>
  );
};

// The Space Shuttle had never been to space - in 1977 Enterprise was gliding off a 747.
const ShuttleScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.shuttle;
  const glT = ph('gliding off');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        <Photo src="enterprise" iw={1000} ih={699} x={540} y={1040} w={820} t={t} t0={t0 + 0.2} rot={3} credit="NASA, 1977" label="SHUTTLE ENTERPRISE" />
        {t < glT ? (
          <Stamp x={540} y={560} text="NEVER BEEN TO SPACE" s={springIn(t, t0 + 1.2, 0.5, 10)} size={58} />
        ) : (
          <BigText x={540} y={620} text="GLIDING OFF A 747" size={84 * springIn(t, glT, 0.5, 9)} fill={C.yellow} />
        )}
        <Pill x={540} y={300} text="FIRST SPACE FLIGHT: 1981" s={pop(t, t0 + 0.1)} bg={PAPER} size={50} />
      </Layer>
    </Stage>
  );
};

// Population: ~4.2 billion then, more than 8 billion today (Earth photo: Apollo 17, 1972).
const PeopleScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.people;
  const todayT = ph('today');
  const n = t < todayT ? 4.2 : lerp(4.2, 8.2, ease(t, todayT, todayT + 1.2));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        <Photo src="earth" iw={900} ih={910} x={540} y={1060} w={640} t={t} t0={t0 + 0.1} rot={-2} credit="NASA, Apollo 17 (1972)" round />
        <BigText x={540} y={600} text={t < todayT ? '4.2 BILLION' : n > 8 ? '8+ BILLION' : `${n.toFixed(1)} BILLION`} size={104 * springIn(t, t0 + 0.2, 0.5, 9)} fill={t < todayT ? PAPER : C.yellow} />
        <Pill x={540} y={300} text="PEOPLE ON EARTH, 1977" s={span(t, t0 + 0.1, todayT)} bg={PAPER} size={52} />
        <Pill x={540} y={300} text="TODAY" s={pop(t, todayT)} bg={C.yellow} size={60} />
      </Layer>
    </Stage>
  );
};

// Smallpox still infected people; last natural case 1977 (declared eradicated 1980).
const PoxScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.pox;
  const lastT = ph('the last natural');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Retro t={t} />
        <Virus x={540} y={1050} s={1.3 * springIn(t, t0 + 0.1, 0.5)} t={t} gone={ease(t, lastT + 0.6, lastT + 1.2)} />
        {t > lastT && <Calendar x={840} y={650} s={0.5 * springIn(t, lastT, 0.5)} label="1977" flip={0} />}
        <Pill x={540} y={300} text="SMALLPOX STILL EXISTED" s={span(t, t0 + 0.1, lastT)} bg={PAPER} size={50} />
        <Pill x={540} y={300} text="LAST NATURAL CASE: 1977" s={pop(t, lastT)} bg={C.green} size={48} />
      </Layer>
    </Stage>
  );
};

// No known planet around another star (first confirmed: 1992).
const PlanetsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.planets;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill="#141634" />
        {Array.from({length: 60}).map((_, i) => <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 9) * 1920} r={1.5 + rnd(i + 4) * 3} fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
        {[[270, 800, 0], [800, 950, 1], [480, 1300, 2]].map(([x, y, sd]) => (
          <LonelyStar key={sd} x={x} y={y} s={1.1 * springIn(t, t0 + 0.2 + sd * 0.15, 0.5)} t={t} seed={sd} />
        ))}
        <BigText x={540} y={560} text="KNOWN EXOPLANETS: 0" size={64 * springIn(t, t0 + 0.4, 0.5, 9)} fill={C.yellow} />
        <Pill x={540} y={300} text="FIRST ONE FOUND: 1992" s={pop(t, t0 + 1.2)} bg={PAPER} size={52} />
      </Layer>
    </Stage>
  );
};

// Payoff: the golden record, greetings in 55 languages - a message from that world.
const RecordScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.record;
  const grT = ph('greetings');
  const msgT = ph('a message from');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill="#141634" />
        {Array.from({length: 60}).map((_, i) => <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 9) * 1920} r={1.5 + rnd(i + 4) * 3} fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
        {t < msgT ? (
          <Photo src="record" iw={800} ih={713} x={540} y={1010} w={640} t={t} t0={t0 + 0.1} rot={-3} credit="NASA/JPL" label="THE GOLDEN RECORD" />
        ) : (
          <Voyager x={lerp(540, 800, ease(t, msgT, S.end))} y={lerp(1000, 760, ease(t, msgT, S.end))} s={lerp(1.3, 0.6, ease(t, msgT, S.end))} t={t} mood="happy" rot={10} />
        )}
        {t > grT - 0.1 && t < msgT && <BigText x={540} y={560} text="55 LANGUAGES" size={96 * springIn(t, grT - 0.1, 0.5, 9)} fill={C.yellow} />}
        {t > msgT && <BigText x={540} y={560} text="TO WHOEVER FINDS IT" size={66 * springIn(t, msgT, 0.5, 9)} fill={C.yellow} />}
        <Pill x={540} y={300} text="ON BOARD VOYAGER" s={pop(t, t0 + 0.1)} bg={PAPER} size={56} />
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
  [S.normal, NormalScene],
  [S.comp, CompScene],
  [S.phone, PhoneScene],
  [S.music, MusicScene],
  [S.games, GamesScene],
  [S.shuttle, ShuttleScene],
  [S.people, PeopleScene],
  [S.pox, PoxScene],
  [S.planets, PlanetsScene],
  [S.record, RecordScene],
  [S.end, EndScene],
];

// All sounds reused from earlier episodes (0 new SFX credits).
type Cue = {f: string; at: number; db: number; len?: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.normal, S.comp, S.phone, S.music, S.games, S.shuttle, S.people, S.pox, S.planets, S.record, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: 'sun/sfx/rocket', at: 0, db: -20, len: 2.5},
  {f: I('stamp'), at: ph('without the web') - 0.05, db: -13},
  {f: I('stamp'), at: ph('nineteen seventyseven') - 0.1, db: -12},
  {f: 'bbstream/sfx/ping', at: S.normal + 0.2, db: -18},
  {f: 'sun/sfx/printer', at: S.comp + 0.4, db: -20, len: 1.5},
  {f: I('pop'), at: ph('voyager itself') - 0.1, db: -20},
  {f: I('stamp'), at: ph('sixtynine') - 0.1, db: -13},
  {f: 'bbstream/sfx/data', at: ph('less than one'), db: -18},
  {f: 'asteroid/sfx/alarm', at: ph('they had cords'), db: -26, len: 1.2},
  {f: I('pop'), at: ph('the first handheld'), db: -20},
  {f: I('stamp'), at: ph('but nobody') - 0.05, db: -13},
  {f: I('pop'), at: S.music + 0.1, db: -20},
  {f: I('pages'), at: ph('the walkman') - 0.1, db: -18},
  {f: I('pop'), at: S.games + 0.3, db: -20},
  {f: 'lightning/sfx/zap', at: ph('and star wars') - 0.1, db: -18},
  {f: I('pop'), at: S.shuttle + 0.2, db: -20},
  {f: I('stamp'), at: S.shuttle + 1.2, db: -14},
  {f: I('whoosh'), at: ph('gliding off'), db: -16},
  {f: I('pop'), at: S.people + 0.1, db: -20},
  {f: 'bbstream/sfx/data', at: ph('today'), db: -18},
  {f: I('pop'), at: S.pox + 0.1, db: -20},
  {f: I('stamp'), at: ph('the last natural') + 0.6, db: -13},
  {f: 'lightning/sfx/ding', at: S.planets + 0.4, db: -18},
  {f: I('pop'), at: S.record + 0.1, db: -20},
  {f: I('pop'), at: ph('greetings') - 0.1, db: -20},
  {f: I('whoosh'), at: ph('a message from'), db: -18},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const Y1977Short: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: RETRO}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t >= S.end} />
      <Sequence from={Math.round(0.05 * FPS)} layout="none">
        <Audio src={staticFile('y1977/vo/vo.wav')} />
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
