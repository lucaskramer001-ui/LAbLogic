import React, {useRef} from 'react';
import {AbsoluteFill, Audio, Sequence, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, ph} from './timing';
import {S} from './scenes';
import {SFX, dbAt} from './sfx';
import {Sci} from '../iceberg/Sci';
import {Berg, C, Calendar, CapeTown, Desert, DimArrow, Drop, FONT_DISPLAY, INK_W, IceShelf, Monitor, PriceTag, Puffs, Rope, Sea, Sky, Sun, TabBerg, Tap, Thermo, Tug, BigText} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, wobble} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {Burst, Check, Cross, EndCard, Floe, Ground, H, Layer, LayoutProbe, Pier, Pill, Splash, Stage, Stars, Txt, W, blink, punch, span, until, useFonts} from './kit';

export const DURATION_FRAMES = Math.ceil(END * FPS);

const DRY = '#E7D3A0';
const NIGHT = '#1B2A4A';

// Stamp that slams in (big -> 1) with a short screen shake.
const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.3, 1, st) : 1;
};
const slamShake = (t: number, t0: number) => (t > t0 + 0.16 && t < t0 + 0.6 ? shake(t, 9 * (1 - (t - t0 - 0.16) / 0.44)) : {x: 0, y: 0});

// Plastic water container for the queue at the collection point.
const Jerry: React.FC<{x: number; y: number; s?: number; color: string}> = ({x, y, s = 1, color}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-42} y={-120} width={84} height={120} rx={14} fill={color} stroke={C.ink} strokeWidth={6} />
    <path d="M -24 -120 L -24 -146 L 18 -146 L 18 -120" fill="none" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <rect x={22} y={-140} width={18} height={22} rx={4} fill={C.ink} />
    <path d="M -26 -86 L 26 -86" stroke={C.ink} strokeWidth={5} opacity={0.5} />
  </g>
);

// Offshore oil platform standing in the sea (deck top at y).
const Platform: React.FC<{x: number; y: number; wl: number}> = ({x, y, wl}) => (
  <g transform={`translate(${x} 0)`}>
    {[-120, -40, 40, 120].map((lx) => (
      <rect key={lx} x={lx - 14} y={y + 60} width={28} height={wl - y + 400} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
    ))}
    <path d={`M -120 ${y + 160} L 120 ${y + 300} M 120 ${y + 160} L -120 ${y + 300}`} stroke={C.ink} strokeWidth={6} />
    <rect x={-190} y={y} width={380} height={70} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-160} y={y - 90} width={150} height={90} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-138} y={y - 70} width={40} height={30} fill={C.teal} stroke={C.ink} strokeWidth={4} />
    {/* derrick */}
    <path d={`M 40 ${y} L 90 ${y - 260} L 140 ${y} M 52 ${y - 70} L 128 ${y - 70} M 64 ${y - 140} L 116 ${y - 140} M 76 ${y - 200} L 104 ${y - 200}`} stroke={C.ink} strokeWidth={8} fill="none" strokeLinejoin="round" />
    <path d={`M 40 ${y} L 90 ${y - 260} L 140 ${y}`} stroke={C.red} strokeWidth={4} fill="none" />
  </g>
);

// Skyscraper of n floors standing at (x, bottom) with height h.
const Tower: React.FC<{x: number; y: number; w: number; h: number; floors: number}> = ({x, y, w, h, floors}) => (
  <g>
    <rect x={x - w / 2} y={y - h} width={w} height={h} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    {Array.from({length: floors - 1}).map((_, i) => (
      <line key={i} x1={x - w / 2} x2={x + w / 2} y1={y - h + ((i + 1) * h) / floors} y2={y - h + ((i + 1) * h) / floors} stroke={C.ink} strokeWidth={2} opacity={0.45} />
    ))}
    <rect x={x - w / 2 + 14} y={y - h + 6} width={w - 28} height={h - 12} fill="none" stroke={C.teal} strokeWidth={10} opacity={0.5} />
    <rect x={x - 6} y={y - h - 50} width={12} height={50} fill={C.ink} />
  </g>
);

// Rain cloud.
const Cloud: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = '#E9EEF2'}) => {
  const c = [
    [-110, 10, 60],
    [-40, -30, 80],
    [50, -20, 70],
    [120, 15, 55],
    [0, 20, 70],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {c.map(([cx, cy, r], i) => (
        <circle key={'o' + i} cx={cx} cy={cy} r={r + 7} fill={C.ink} />
      ))}
      {c.map(([cx, cy, r], i) => (
        <circle key={'f' + i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </g>
  );
};

// Hand pump / well for groundwater.
const Well: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-110} y={-110} width={220} height={110} fill="#B9B2A6" stroke={C.ink} strokeWidth={INK_W} />
    {[-70, 0, 70].map((bx) => (
      <rect key={bx} x={bx - 34} y={-110} width={68} height={36} fill="none" stroke={C.ink} strokeWidth={4} />
    ))}
    <rect x={-100} y={-270} width={18} height={160} fill="#8A5A34" stroke={C.ink} strokeWidth={5} />
    <rect x={82} y={-270} width={18} height={160} fill="#8A5A34" stroke={C.ink} strokeWidth={5} />
    <path d="M -140 -260 L 0 -340 L 140 -260 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-20} y={-220} width={40} height={40} rx={6} fill={C.sea} stroke={C.ink} strokeWidth={5} />
  </g>
);

// Desalination plant: building, two tanks and a pipe to the sea.
const Desal: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-170} y={-170} width={200} height={170} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    {[-140, -80, -20].map((wx) => (
      <rect key={wx} x={wx} y={-140} width={40} height={36} fill={C.teal} stroke={C.ink} strokeWidth={4} />
    ))}
    {[80, 160].map((tx) => (
      <g key={tx}>
        <rect x={tx - 34} y={-230} width={68} height={230} rx={30} fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} />
        <path d={`M ${tx - 18} -200 L ${tx - 18} -30`} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
      </g>
    ))}
    <rect x={-60} y={-60} width={30} height={60} fill={C.sea} stroke={C.ink} strokeWidth={4} />
  </g>
);

// Shower head with drops (a few seconds of water only).
const Shower: React.FC<{x: number; y: number; t: number; on: number}> = ({x, y, t, on}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -80 -120 L 30 -120 Q 60 -120 60 -90 L 60 -40" stroke={C.chromeShade} strokeWidth={22} fill="none" strokeLinecap="round" />
    <path d="M -80 -120 L 30 -120 Q 60 -120 60 -90 L 60 -40" stroke={C.ink} strokeWidth={4} fill="none" opacity={0.6} />
    <path d="M 10 -40 L 110 -40 L 90 -10 L 30 -10 Z" fill={C.chrome} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {on > 0 &&
      [0, 1, 2, 3].map((i) => {
        const u = (t * 1.6 + i / 4) % 1;
        return <Drop key={i} x={36 + i * 16} y={10 + u * 150} s={0.45 * on} />;
      })}
  </g>
);

// Watering can with a red "no" sign.
const NoCan: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -60 -60 L 50 -60 L 40 40 L -50 40 Z" fill={C.green} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 46 -30 L 120 -90 L 134 -78" stroke={C.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d="M -60 -50 Q -110 -40 -60 20" stroke={C.ink} strokeWidth={10} fill="none" />
    <circle r={110} fill="none" stroke={C.red} strokeWidth={18} />
    <path d="M -78 -78 L 78 78" stroke={C.red} strokeWidth={18} strokeLinecap="round" />
  </g>
);

// ================================================================== scenes

// 1. Cape Town, 2018: Day Zero -------------------------------------------------------
const IntroScene: React.FC<{t: number}> = ({t}) => {
  const dropForm = prog(t, ph('turning off') - 0.2, ph('taps') + 0.1);
  const dropFall = clamp((t - (ph('taps') + 0.15)) / 0.5);
  const queueT = ph('line up');
  const cans = [C.yellow, C.teal, C.red, C.paper, C.yellow, C.teal, C.red, C.paper];
  return (
    <Stage cam={{s: punch(t, 0)}}>
      <Layer>
        <Sky />
        <Sun x={1770} y={150} r={70} t={t} hot={1} />
        <CapeTown x={1260} y={760} s={0.8} />
        <rect x={-200} y={760} width={2400} height={600} fill={DRY} />
        <line x1={-200} x2={2200} y1={760} y2={760} stroke={C.ink} strokeWidth={INK_W} />
        <path d="M 720 820 L 770 850 L 760 890 L 810 920 M 770 850 L 830 840" stroke="#B89A5E" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M 1500 800 L 1540 830 L 1580 820 M 1540 830 L 1530 870" stroke="#B89A5E" strokeWidth={6} fill="none" strokeLinecap="round" />
        <Tap x={520} y={330} s={0.9} pipe={470} face={{mood: t > ph('taps') ? 'worried' : 'neutral', open: blink(t)}} />
        {dropFall <= 0 && dropForm > 0 && <Drop x={646} y={482 + 14 * dropForm} s={0.4 + 0.6 * dropForm} />}
        {dropFall > 0 && dropFall < 1 && <Drop x={646} y={496 + 430 * dropFall * dropFall} s={1} />}
        {cans.map((c, i) => {
          const s = pop(t, queueT + i * 0.12, 0.4);
          return s > 0 ? <Jerry key={i} x={780 + i * 120} y={960} s={s * 0.9} color={c} /> : null;
        })}
        <Pill x={960} y={110} text="CAPE TOWN, 2018" s={span(t, ph('cape town'), ph('day zero') - 0.1)} size={56} />
        <g transform={`translate(${slamShake(t, ph('day zero')).x} ${slamShake(t, ph('day zero')).y})`}>
          {t > ph('day zero') && <Stamp x={1150} y={190} text="DAY ZERO" s={slam(t, ph('day zero'))} />}
        </g>
        <Pill x={1150} y={360} text="4 MILLION PEOPLE" s={pop(t, ph('four million'))} bg={C.paper} size={50} />
      </Layer>
      <Sci t={t} x={230} y={1010} headR={50} poses={[[0, 'point'], [ph('turning off'), 'nervous']]} />
    </Stage>
  );
};

// 2. Antarctica sheds icebergs made of fresh water ---------------------------------------
const AntarcticaScene: React.FC<{t: number}> = ({t}) => {
  const wl = 660;
  const crack = ph('breaking off');
  const fall = ph('icebergs', S.antarctica) + 0.1;
  const fallU = clamp((t - fall) / 0.45);
  const impact = fall + 0.45;
  let by = -70;
  let rot = 0;
  let bx = 930;
  if (t >= fall) {
    by = lerp(-70, 40, fallU * fallU);
    rot = 12 * fallU;
  }
  if (t >= impact) {
    const d = t - impact;
    by = 40 * Math.exp(-4 * d) * Math.cos(9 * d);
    rot = 12 * Math.exp(-3 * d) * Math.cos(6 * d);
    bx = 930 + 420 * easeInOutCubic(clamp((t - impact - 0.3) / 1.8));
  }
  const faceOpen = pop(t, ph('giant ones'), 0.4);
  const snowT = ph('made from snow');
  const top = wl - 230 * 1.3;
  return (
    <Stage cam={{s: punch(t, S.antarctica)}}>
      <Layer>
        <Sky color="#8ED0F8" />
        <Sea y={wl} t={t} x0={-400} x1={2400} />
        <Berg x={bx} y={wl + by} s={0.9} rot={rot} noFace={faceOpen <= 0} face={{open: Math.min(1, faceOpen) * blink(t), mood: 'happy', look: {x: -0.4, y: 0}}} />
        <IceShelf x={700} y={wl} s={1.3} />
        {t > crack && t < fall + 0.2 && (
          <path d={`M 790 ${wl - 290} L 820 ${wl - 230} L 802 ${wl - 180} L 836 ${wl - 120} L 820 ${wl - 40}`} stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={400} strokeDashoffset={400 * (1 - clamp((t - crack) / 0.3))} />
        )}
        <Splash x={950} y={wl} t={t} t0={impact} n={12} size={1.2} />
        {/* snow falling onto the shelf, pressed into layers */}
        {t > snowT &&
          Array.from({length: 26}).map((_, i) => {
            const u = ((t - snowT) * 0.35 + rnd(i)) % 1;
            const x = -100 + rnd(i + 40) * 820;
            const y = lerp(-40, top, u);
            return <circle key={i} cx={x + Math.sin(t * 2 + i) * 12} cy={y} r={7 + rnd(i + 9) * 5} fill="#fff" stroke={C.ink} strokeWidth={3} />;
          })}
        {t > ph('pressed into ice') &&
          [0, 1, 2, 3].map((i) => (
            <line key={i} x1={-200} x2={700 + (i % 2) * 20} y1={top + 50 + i * 55} y2={top + 50 + i * 55} stroke={C.iceUnderShade} strokeWidth={6} opacity={prog(t, ph('pressed into ice') + i * 0.25, ph('pressed into ice') + i * 0.25 + 0.4)} />
          ))}
        <Pill x={960} y={110} text="ABOUT 4,000 KM SOUTH" s={span(t, ph('four thousand'), Math.min(snowT, ph('fresh water')))} bg={C.paper} size={50} />
        <Pill x={960} y={225} text="ANTARCTICA" s={span(t, ph('antarctica'), ph('fresh water'))} size={56} />
        <g transform={`translate(${bx} ${wl - 330})`}>
          <Pill x={0} y={0} text="FRESH WATER" s={pop(t, ph('fresh water'))} bg={C.sweat} />
        </g>
        <Pill x={1100} y={110} text="SNOW, PRESSED INTO ICE" s={pop(t, ph('pressed into ice'))} bg={C.paper} size={48} />
      </Layer>
      <Sci t={t} x={230} y={top} headR={40} poses={[[0, 'point'], [ph('made from snow'), 'think']]} />
    </Stage>
  );
};

// 3. The obvious fix: tow one ------------------------------------------------------------
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const wl = 720;
  const pull = prog(t, ph('tow it'), S.history, (u) => u * u);
  const dx = 380 * pull;
  const rock = Math.sin(t * 3.1) * 2;
  const tugX = 1100 + dx;
  const bergX = 520 + dx * 0.9;
  const ts = 1.0;
  const bs = 0.8;
  const stampT = ph('nothing to do');
  const sh = slamShake(t, stampT);
  return (
    <Stage cam={{x: 960 - sh.x + dx * 0.6, y: 540 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <CapeTown x={2550} y={wl} s={0.5} />
        <Sea y={wl} t={t} x0={-600} x1={3200} />
        <Puffs x={tugX + 40 * ts} y={wl - 250 * ts} t={t} />
        {t > ph('tie a rope') && <Rope x1={tugX - 211 * ts} y1={wl - 75 * ts} x2={bergX + 160 * bs} y2={wl - 70} sag={30 - 25 * pull} />}
        <Berg x={bergX} y={wl} s={bs} face={{mood: t > ph('crazy') ? 'surprised' : 'happy', look: {x: 1, y: 0}, open: blink(t)}} />
        <Tug x={tugX} y={wl} s={ts} rock={rock} face={{mood: t > ph('nothing to do') ? 'smug' : 'happy'}} />
        <g transform={`translate(${dx * 0.6} 0)`}>
          <Pill x={960} y={110} text="THE OBVIOUS FIX" s={span(t, ph('obvious fix'), ph('fifty years'))} size={58} />
          <Pill x={960} y={110} text="TAKEN SERIOUSLY FOR 50 YEARS" s={span(t, ph('fifty years'), stampT)} bg={C.paper} size={50} />
          {t > stampT && <Stamp x={960} y={180} text="NOT THE SHIPS" s={slam(t, stampT)} />}
        </g>
      </Layer>
      <Sci t={t} x={tugX - 150} y={wl - 60 + rock * 2} headR={36} poses={[[0, 'point'], [ph('crazy'), 'think'], [stampT, 'thumbs']]} />
    </Stage>
  );
};

// 4. 1977: the prince, the conference and the ice flown to Iowa ----------------------------
const HistoryScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.history;
  const iowaT = ph('he helped pay');
  if (t < iowaT) {
    return (
      <Stage cam={{s: punch(t, t0)}}>
        <Layer>
          <Sky />
          <Sun x={1760} y={150} r={70} t={t} hot={1} />
          <Desert x={1380} y={780} s={1.15} />
          <Calendar x={1380} y={430} s={0.75} label="1977" flip={0} />
          <Pill x={960} y={110} text="PRINCE MOHAMMED AL-FAISAL" s={pop(t, ph('saudi prince'))} size={48} />
          <Pill x={760} y={260} text="FRESH WATER FOR ARABIA" s={pop(t, ph('arabian peninsula'))} bg={C.sweat} size={46} />
        </Layer>
        <Sci t={t} x={300} y={1010} headR={52} poses={[[0, 'present'], [ph('wanted fresh water'), 'think']]} />
      </Stage>
    );
  }
  // ice chunk travels on a dashed arc from Alaska to Iowa
  const fly = prog(t, ph('shipped from alaska') - 0.2, ph('to iowa') + 0.3);
  const A = {x: 320, y: 640};
  const B = {x: 1420, y: 640};
  const arcY = (u: number) => lerp(A.y, B.y, u) - Math.sin(u * Math.PI) * 330;
  const ix = lerp(A.x, B.x, fly);
  const iy = arcY(fly) - 70;
  return (
    <Stage cam={{s: punch(t, iowaT)}}>
      <Layer>
        <Sky />
        <Ground y={760} />
        {/* Alaska: snowy mountains on the left */}
        <path d="M 40 760 L 240 470 L 330 560 L 430 420 L 620 760 Z" fill={C.mountain} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        <path d="M 240 470 L 280 528 L 250 520 L 216 506 Z M 430 420 L 476 486 L 440 480 L 404 466 Z" fill="#fff" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        {/* Iowa State: a hall with columns on the right */}
        <g transform="translate(1520 760)">
          <rect x={-200} y={-200} width={400} height={200} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
          <path d="M -230 -200 L 0 -300 L 230 -200 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
          {[-150, -75, 0, 75, 150].map((cx) => (
            <rect key={cx} x={cx - 14} y={-190} width={28} height={190} fill="#fff" stroke={C.ink} strokeWidth={4} />
          ))}
        </g>
        {Array.from({length: 22}).map((_, i) => {
          const u = i / 21;
          if (u > fly) return null;
          return <circle key={i} cx={lerp(A.x, B.x, u)} cy={arcY(u)} r={7} fill={C.yellow} stroke={C.ink} strokeWidth={3} />;
        })}
        {fly > 0 && fly < 1.01 && (
          <g transform={`translate(${ix} ${iy}) rotate(${Math.sin(t * 4) * 6})`}>
            <rect x={-60} y={-50} width={120} height={100} rx={10} fill={C.iceShade} stroke={C.ink} strokeWidth={6} />
            <rect x={-60} y={-50} width={70} height={100} rx={10} fill="#fff" />
            <rect x={-60} y={-50} width={120} height={100} rx={10} fill="none" stroke={C.ink} strokeWidth={6} />
          </g>
        )}
        <Pill x={960} y={110} text="ICEBERG CONFERENCE, IOWA" s={pop(t, ph('international conference'))} size={52} />
        <Pill x={330} y={300} text="ALASKA" s={pop(t, ph('alaska'))} bg={C.paper} size={46} />
        <Pill x={1520} y={360} text="IOWA STATE" s={pop(t, ph('iowa state'))} bg={C.paper} size={46} />
      </Layer>
      <Sci t={t} x={900} y={1000} headR={46} poses={[[0, 'present'], [ph('to iowa') + 0.3, 'thumbs']]} />
    </Stage>
  );
};

// 5. The plan: a 100-million-tonne iceberg to Arabia within three years ------------------
const PlanScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.plan;
  const wl = 720;
  const neverT = ph('it never happened');
  const rock = Math.sin(t * 3.1) * 2;
  const drift = 120 * prog(t, t0, neverT, (u) => u);
  const yearsT = ph('within three years');
  const fu = clamp((t - yearsT) / 1.5);
  const years = ['1977', '1978', '1979', '1980'];
  const k = Math.min(3, Math.floor(fu * 3));
  const local = fu >= 1 ? 0 : (fu * 3) % 1;
  const label = fu >= 1 ? '1980' : local > 0.55 ? years[k + 1] : years[k];
  const flip = fu >= 1 ? 0 : clamp((local - 0.55) / 0.45);
  const sh = slamShake(t, neverT);
  const calS = pop(t, ph('in 1977', t0)) * until(t, neverT);
  return (
    <Stage cam={{x: 960 - sh.x, y: 540 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Puffs x={1260 + drift + 40 * 0.8} y={wl - 200} t={t} />
        <Rope x1={1260 + drift - 211 * 0.8} y1={wl - 60} x2={360 + drift + 160 * 0.95} y2={wl - 70} sag={14} />
        <Berg x={360 + drift} y={wl} s={0.95} face={{mood: t > ph("can't see") ? 'worried' : 'happy', open: blink(t), look: {x: 1, y: 0}}} />
        <Sea y={wl} t={t} x0={-400} x1={2400} />
        <Tug x={1260 + drift} y={wl} s={0.8} rock={rock} />
        <Pill x={580} y={380} text="100 MILLION TONNES" s={span(t, ph('hundred million tonnes'), neverT)} size={50} />
        <Pill x={1420} y={110} text="TO ARABIA" s={span(t, ph('to arabia'), yearsT)} bg={C.paper} size={50} />
        <Pill x={1420} y={110} text="WITHIN 3 YEARS" s={span(t, yearsT, neverT)} size={52} />
        {calS > 0 && <Calendar x={1420} y={390} s={calS * 0.7} label={label} prev={years[k]} flip={flip} />}
        {t > neverT && <Stamp x={1180} y={300} text="NEVER HAPPENED" s={slam(t, neverT)} />}
      </Layer>
    </Stage>
  );
};

// 6. 90 % underwater ----------------------------------------------------------------------
const UnderScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.under;
  const wl = 470;
  const bs = 0.78;
  const reveal = prog(t, ph('about ninety') - 0.1, ph('waterline') + 0.2, (u) => u);
  const bx = 980;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={2400} />
        <rect x={-400} y={wl + 420} width={2800} height={2000} fill={C.seaDeep} />
        <clipPath id="ureveal">
          <rect x={-400} y={wl} width={2800} height={800 * reveal} />
        </clipPath>
        <g clipPath="url(#ureveal)">
          <Berg x={bx} y={wl} s={bs} under={1} noFace />
        </g>
        <Berg x={bx} y={wl} s={bs} face={{mood: t > ph('waterline') ? 'surprised' : 'happy', look: {x: 0, y: reveal}, open: blink(t)}} />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={0} />
        <Floe x={380} y={wl - 24} w={240} />
        <Pill x={bx} y={wl + 300} text="90%" s={pop(t, ph('ninety percent')) * 1.25} size={70} />
        <Pill x={1560} y={760} text="UNDERWATER" s={pop(t, ph('below the waterline'))} bg={C.paper} size={46} />
        <Pill x={1450} y={300} text="10%" s={pop(t, ph('the bit you see'))} bg={C.paper} size={50} />
        <Pill x={960} y={110} text="ONLY THE TIP" s={pop(t, ph('only the tip'))} size={56} />
      </Layer>
      <Sci t={t} x={380} y={wl - 24} headR={38} poses={[[0, 'point'], [ph('waterline'), 'shocked']]} />
    </Stage>
  );
};

// 7. Woods Hole simulations and the minimum size -------------------------------------------
const WoodsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.woods;
  const sizeT = ph('they found that');
  const slide = prog(t, sizeT - 0.3, sizeT + 0.5);
  const mx = lerp(960, 560, slide);
  const ms = lerp(0.95, 0.8, slide);
  const path = prog(t, ph('computer simulations'), sizeT, (u) => u);
  const P0 = {x: 60, y: 200};
  const P1 = {x: -60, y: -150};
  const pt = (u: number) => ({x: lerp(P0.x, P1.x, u) + Math.sin(u * Math.PI) * 120, y: lerp(P0.y, P1.y, u)});
  const bergS = pop(t, sizeT + 0.4, 0.5);
  const wl = 520;
  const bx = 1330;
  const longGrow = prog(t, ph('three hundred meters'), ph('meters long') + 0.2);
  const thickGrow = prog(t, ph('two hundred meters thick'), ph('thick') + 0.2);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={1200} />
        <Monitor x={mx} y={520} s={ms}>
          <path d="M -360 -262 L 40 -262 L 10 -200 L -40 -160 L -110 -150 L -170 -200 L -230 -262 Z" fill={C.mountain} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M -360 200 Q -200 170 -60 210 Q 120 180 360 205 L 360 268 L -360 268 Z" fill="#fff" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={-60} cy={-150} r={14} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 18}).map((_, i) => {
            const u = i / 17;
            if (u > path) return null;
            const p = pt(u);
            return <circle key={i} cx={p.x} cy={p.y} r={6} fill={C.yellow} />;
          })}
          {path > 0 && <Berg x={pt(path).x} y={pt(path).y} s={0.16} noFace />}
        </Monitor>
        {bergS > 0 && (
          <g transform={`translate(${bx} ${wl}) scale(${bergS}) translate(${-bx} ${-wl})`}>
            <rect x={1040} y={wl} width={620} height={420} rx={16} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
            <TabBerg x={bx} y={wl} w={480} h={320} above={34} face={{mood: 'smug', open: blink(t)}} />
            <line x1={1040} x2={1660} y1={wl} y2={wl} stroke={C.ink} strokeWidth={INK_W} />
          </g>
        )}
        <DimArrow x1={bx - 240} y1={wl + 345} x2={bx + 240} y2={wl + 345} label="300 M LONG" grow={longGrow} labelS={pop(t, ph('meters long'))} />
        <DimArrow x1={bx + 300} y1={wl - 34} x2={bx + 300} y2={wl + 286} label="200 M" grow={thickGrow} labelS={pop(t, ph('thick'))} />
        <Pill x={960} y={110} text="WOODS HOLE OCEANOGRAPHIC" s={span(t, ph('woods hole'), sizeT)} size={50} />
        <Pill x={960} y={110} text="BIG ENOUGH TO SURVIVE" s={span(t, ph('big enough'))} bg={C.paper} size={50} />
        <Pill x={mx} y={980} text="COMPUTER SIMULATIONS" s={span(t, ph('computer simulations'), sizeT)} bg={C.paper} size={46} />
      </Layer>
    </Stage>
  );
};

// 8. 200 m: as tall as a 50-story building --------------------------------------------------
const BuildingScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.building;
  const wl = 330;
  const above = 64;
  const h = 640;
  const towerGrow = prog(t, ph('as tall as') - 0.2, ph('building') + 0.2, easeOutCubic);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={2400} />
        <rect x={-400} y={wl + h - above} width={2800} height={800} fill="#E2C27C" />
        <line x1={-400} x2={2400} y1={wl + h - above} y2={wl + h - above} stroke={C.ink} strokeWidth={INK_W} />
        {towerGrow > 0 && <Tower x={1350} y={wl + h - above} w={190} h={h * towerGrow} floors={Math.max(1, Math.round(50 * towerGrow))} />}
        <TabBerg x={650} y={wl} w={680} h={h - 30} above={above} face={{mood: 'surprised', open: blink(t)}} />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={0} />
        <DimArrow x1={1570} y1={wl - above} x2={1570} y2={wl + h - above} label="200 M" grow={prog(t, t0 + 0.1, ph('meters', t0) + 0.3)} labelS={pop(t, ph('meters', t0))} />
        <Pill x={1350} y={170} text="50 STORIES" s={pop(t, ph('fifty-story'))} size={50} />
        <Pill x={650} y={820} text="MOSTLY UNDER THE SURFACE" s={pop(t, ph('under the surface'))} bg={C.paper} size={44} />
      </Layer>
      <Sci t={t} x={480} y={wl - above} headR={30} poses={[[0, 'shocked']]} tremble={1} />
    </Stage>
  );
};

// 9. It can't enter a harbor: it grounds, then parks far out --------------------------------
const HarborScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.harbor;
  const wl = 560;
  const s = 0.62;
  const hit = ph('hit the sea floor') + 0.15;
  let bx = lerp(-250, 775, prog(t, t0, hit, (u) => u * (2 - u) * 0.5 + u * u * 0.5));
  let rot = 0;
  if (t > hit) {
    const d = t - hit;
    bx = 775 - 50 * (1 - Math.exp(-6 * d));
    rot = -9 * Math.exp(-3 * d) * Math.sin(10 * d);
  }
  const back = prog(t, ph('parked far out') - 0.3, ph('at sea', ph('parked far out')) + 0.2);
  bx = lerp(bx, 330, back);
  const mood = t > ph('parked far out') ? 'worried' : t > hit ? 'dizzy' : 'happy';
  const bed = `M -400 1060 L 800 1060 L 1450 540 L 2400 540 L 2400 1500 L -400 1500 Z`;
  const pipe = prog(t, ph('travel the rest') - 0.2, ph('of the way') + 0.4);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={1500} depth={1200} />
        <path d={bed} fill="#E2C27C" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        <path d={`M 1440 ${wl - 20} L 2400 ${wl - 20} L 2400 900 L 1450 540 Z`} fill="#E2C27C" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
        {[1560, 1660, 1760].map((x, i) => (
          <rect key={i} x={x} y={wl - 150 - i * 40} width={80} height={130 + i * 40} fill={[C.paper, C.yellow, C.teal][i]} stroke={C.ink} strokeWidth={6} />
        ))}
        <Berg x={bx} y={wl} s={s} under={1} rot={rot} face={{mood, look: {x: 1, y: 0.3}, open: blink(t)}} />
        <Sea y={wl} t={t} x0={-400} x1={1440} depth={0} />
        <Stars x={bx} y={wl - 230} t={t} t0={hit} />
        {pipe > 0 && <Arrow x1={560} y1={wl - 60} x2={lerp(560, 1500, pipe)} y2={wl - 60} color={C.sweat} w={20} head={44} />}
        <Pill x={1700} y={250} text="HARBOR" s={pop(t, ph('harbor'))} bg={C.paper} size={50} />
        <Pill x={1000} y={110} text="HITS THE SEA FLOOR" s={span(t, ph('hit the sea floor'), ph('parked far out'))} bg={C.red} fg={C.paper} size={50} />
        <Pill x={1000} y={110} text="PARKED FAR OUT AT SEA" s={span(t, ph('parked far out'))} size={54} />
      </Layer>
    </Stage>
  );
};

// 10. Newfoundland: tugs already tow icebergs away from oil platforms ---------------------------
const CanadaScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.canada;
  const wl = 700;
  const pushT = ph('to push them away');
  const pull = prog(t, pushT - 0.2, S.tricky, (u) => u);
  const bx = lerp(1000, 1180, prog(t, t0, pushT, (u) => u)) - 420 * pull;
  const tugX = 470 - 420 * pull;
  const ts = 0.85;
  const rock = Math.sin(t * 3.1) * 2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#A9D8F7" />
        <Platform x={1620} y={430} wl={wl} />
        <Sea y={wl} t={t} x0={-400} x1={2400} />
        {/* the tug faces left, so its stern (and the rope) is on the right */}
        <Puffs x={tugX - 40 * ts} y={wl - 250 * ts} t={t} />
        <Rope x1={tugX + 211 * ts} y1={wl - 75 * ts} x2={bx - 150 * 0.7} y2={wl - 60} sag={20 - 15 * pull} />
        <Berg x={bx} y={wl} s={0.7} face={{mood: t > pushT ? 'surprised' : 'smug', look: {x: t > pushT ? -1 : 1, y: 0}, open: blink(t)}} />
        <g transform={`translate(${tugX} ${wl}) scale(-1 1) translate(${-tugX} ${-wl})`}>
          <Tug x={tugX} y={wl} s={ts} rock={rock} />
        </g>
        <Pill x={960} y={110} text="NEWFOUNDLAND, CANADA" s={pop(t, ph('newfoundland'))} size={54} />
        <Pill x={960} y={225} text="NOT FOR DRINKING" s={span(t, ph('not to drink'), ph('offshore oil'))} bg={C.paper} size={46} />
        <Pill x={960} y={225} text="PROTECTING OIL PLATFORMS" s={span(t, ph('offshore oil'))} bg={C.paper} size={46} />
      </Layer>
      <Sci t={t} x={tugX + 150} y={wl - 52 + rock * 2} headR={32} poses={[[0, 'point'], [pushT, 'rope']]} flip />
    </Stage>
  );
};

// 11. Slippery and top-heavy: the rope slides off, the berg rolls ------------------------------
const TrickyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.tricky;
  const wl = 560;
  const bs = 0.78;
  const bx = 1200;
  const tugX = 380;
  const ts = 0.8;
  const slipT = ph('slide right off');
  const slip = clamp((t - slipT) / 0.5);
  const reattach = ph('pulling on the top') - 0.2;
  const underT = ph('most of the weight');
  const under = prog(t, underT, underT + 0.6);
  const rollT = ph('roll over');
  const roll = t < rollT - 0.3 ? 0 : 72 * easeOutBack(clamp((t - rollT + 0.3) / 1.2)) + wobble(t, rollT + 0.9, 4, 1.2, 2);
  const pivot = {x: bx, y: wl + 300 * bs};
  // rope end: the peak, sliding over the right side and dropping, then retied for the roll
  const peak = {x: bx - 30 * bs, y: wl - 250 * bs};
  const rr = (roll * Math.PI) / 180;
  let end = {x: pivot.x + (peak.x - pivot.x) * Math.cos(rr) - (peak.y - pivot.y) * Math.sin(rr), y: pivot.y + (peak.x - pivot.x) * Math.sin(rr) + (peak.y - pivot.y) * Math.cos(rr)};
  if (t > slipT && t < reattach) end = {x: lerp(peak.x, bx + 260 * bs, slip), y: lerp(peak.y, wl + 40, slip * slip)};
  const rock = Math.sin(t * 3.1) * 2;
  const bergMood = t > rollT ? 'dizzy' : t > slipT ? 'smug' : 'happy';
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={2000} />
        <g transform={`rotate(${roll} ${pivot.x} ${pivot.y})`}>
          <Berg x={bx} y={wl} s={bs} under={under} face={{mood: bergMood, look: {x: -1, y: 0}, open: blink(t)}} />
        </g>
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={0} />
        {under > 0.5 && <circle cx={pivot.x} cy={pivot.y + 90} r={22 * pop(t, underT + 0.4)} fill={C.red} stroke={C.ink} strokeWidth={6} />}
        <Puffs x={tugX - 40 * ts} y={wl - 250 * ts} t={t} />
        <Rope x1={tugX + 211 * ts} y1={wl - 75 * ts} x2={end.x} y2={end.y} sag={t > slipT && t < reattach ? 60 : 10} />
        <g transform={`translate(${tugX} ${wl}) scale(-1 1) translate(${-tugX} ${-wl})`}>
          <Tug x={tugX} y={wl} s={ts} rock={rock} face={{mood: t > slipT && t < reattach ? 'surprised' : 'happy'}} />
        </g>
        <Pill x={960} y={110} text="SMOOTH AND SLIPPERY" s={span(t, ph('smooth and slippery'), slipT)} bg={C.paper} size={50} />
        <Pill x={960} y={110} text="THE ROPE SLIDES OFF" s={span(t, slipT, underT)} bg={C.red} fg={C.paper} size={50} />
        <Pill x={960} y={110} text="THE WEIGHT IS DEEP DOWN" s={span(t, underT, rollT)} bg={C.paper} size={50} />
        <Pill x={960} y={110} text="IT CAN ROLL OVER" s={span(t, rollT)} size={56} />
      </Layer>
    </Stage>
  );
};

// 12. Half a meter per second: slower than a slow walk; two months ------------------------------
const SpeedScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.speed;
  const wl = 600;
  const rock = Math.sin(t * 3.1) * 2;
  const crawl = (t - t0) * 9;
  const tugX = 760 + crawl;
  const bergX = 300 + crawl;
  const walkT = ph('slower than');
  const walk = prog(t, walkT, walkT + 2.6, (u) => u);
  const sciX = lerp(160, 1180, walk);
  const hop = walk > 0 && walk < 1 ? -Math.abs(Math.sin(t * 9)) * 14 : 0;
  const calT = ph('reaching cape town');
  const flips = 8;
  const fu = clamp((t - calT) / (ph('two months') + 0.3 - calT));
  const k = Math.min(flips, Math.floor(fu * flips));
  const local = fu >= 1 ? 0 : clamp(((fu * flips) % 1 - 0.55) / 0.45);
  const dayAt = (n: number) => String(1 + Math.round((Math.min(n, flips) / flips) * 58));
  const dayLabel = fu >= 1 ? '59' : local > 0 ? dayAt(k + 1) : dayAt(k);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={500} />
        <Puffs x={tugX + 34} y={wl - 210} t={t} />
        <Rope x1={tugX - 211 * 0.75} y1={wl - 56} x2={bergX + 140 * 0.62} y2={wl - 50} sag={10} />
        <Berg x={bergX} y={wl} s={0.62} sweat={t * 0.8} face={{mood: 'worried', look: {x: 1, y: 0}, open: blink(t)}} />
        <Tug x={tugX} y={wl} s={0.75} rock={rock} />
        <rect x={-400} y={940} width={2800} height={400} fill={C.sand} />
        <line x1={-400} x2={2400} y1={940} y2={940} stroke={C.ink} strokeWidth={INK_W} />
        <Pill x={620} y={110} text="0.5 M/S" s={span(t, ph('half a meter'), calT)} size={60} />
        <Pill x={620} y={235} text="SLOWER THAN A SLOW WALK" s={span(t, walkT, calT)} bg={C.paper} size={46} />
        <Pill x={960} y={110} text="WEEKS AT SEA" s={span(t, ph('for weeks'), ph('half a meter'))} bg={C.paper} size={50} />
        {t > calT && <Calendar x={1480} y={360} s={0.72 * pop(t, calT)} label={dayLabel} prev={dayAt(k)} flip={local} />}
        <Pill x={1480} y={110} text="ABOUT 2 MONTHS" s={pop(t, ph('two months'))} size={52} />
      </Layer>
      <Sci t={t} x={sciX} y={940} headR={46} hop={hop} poses={[[0, 'think'], [walkT, 'point'], [walkT + 2.7, 'thumbs']]} />
    </Stage>
  );
};

// 13. It melts the whole way: cold near Antarctica, 15-20 °C off Cape Town ------------------------
const MeltScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.melt;
  const wl = 680;
  const u = prog(t, t0 + 0.3, S.erosion - 0.3, (x) => x);
  const bx = lerp(520, 1180, u);
  const bs = lerp(0.6, 0.4, u);
  const warm = prog(t, ph('the closer you get'), ph('fifteen to twenty') + 0.4);
  const seaCol = warm > 0.5 ? '#3A86C8' : C.sea;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sun x={1760} y={140} r={60} t={t} hot={warm} />
        <CapeTown x={1700} y={wl} s={0.38} />
        <Sea y={wl} t={t} x0={-400} x1={2400} color={seaCol} />
        <IceShelf x={170} y={wl} s={0.8} />
        <Berg x={bx} y={wl} s={bs} sweat={t * (0.6 + warm)} face={{mood: warm > 0.5 ? 'scared' : 'worried', look: {x: 1, y: 0}, open: blink(t)}} />
        {[0, 1, 2].map((i) => {
          const r = (t * 0.7 + i / 3) % 1;
          return <ellipse key={i} cx={bx} cy={wl + 16} rx={(220 + 240 * r) * bs} ry={(26 + 28 * r) * bs} fill="none" stroke={C.paper} strokeWidth={6 * (1 - r)} />;
        })}
        <Thermo x={960} y={430} level={0.08 + 0.6 * warm} s={0.62 * pop(t, ph('near antarctica'))} />
        <Pill x={470} y={180} text="NEAR FREEZING" s={pop(t, ph('close to freezing'))} bg={C.paper} size={48} />
        <Pill x={1460} y={330} text="15-20°C" s={pop(t, ph('fifteen to twenty'))} bg={C.red} fg={C.paper} size={56} />
        <Pill x={1460} y={450} text="ABOUT 60-68°F" s={pop(t, ph('sixty to sixty-eight'))} bg={C.paper} size={44} />
        <Pill x={960} y={110} text="MELTING THE WHOLE TRIP" s={span(t, ph('is melting'), ph('near antarctica') + 0.6)} size={52} />
      </Layer>
    </Stage>
  );
};

// 14. Warm water from below, waves, pieces breaking off; small bergs don't make it -------------------
const ErosionScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.erosion;
  const wl = 420;
  const bx = 820;
  const bs = 0.68 - 0.06 * prog(t, t0, ph('smaller icebergs'));
  const below = ph('from below');
  const wavesT = ph('waves wear');
  const crackT = ph('pieces crack');
  const smallT = ph('smaller icebergs');
  const chunkU = clamp((t - crackT - 0.3) / 3);
  const smallS = 0.32 * (1 - prog(t, ph('they melted'), ph('they melted') + 1.6, (u) => u));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={2400} amp={t > wavesT ? 16 : 9} />
        <rect x={-400} y={wl + 480} width={2800} height={1400} fill={C.seaDeep} />
        <Berg x={bx} y={wl} s={bs} under={1} sweat={t} face={{mood: t > crackT ? 'scared' : 'worried', look: {x: 0, y: 0.5}, open: blink(t)}} />
        {/* warm water arrows from below */}
        {t > below &&
          [-180, 0, 180].map((dx, i) => {
            const k = pop(t, below + i * 0.15);
            const y0 = wl + 760 * bs + 200;
            return <Arrow key={i} x1={bx + dx} y1={y0} x2={bx + dx * 0.8} y2={y0 - 140 * k} color={C.red} w={18} head={40} />;
          })}
        {t > crackT && (
          <g transform={`translate(${lerp(0, 380, chunkU)} ${Math.sin(t * 2) * 6}) rotate(${chunkU * 20} ${bx + 150} ${wl})`}>
            <Berg x={bx + 150 * bs + 40} y={wl} s={0.14} noFace />
          </g>
        )}
        {t > crackT && t < crackT + 0.6 && <path d={`M ${bx + 110 * bs} ${wl - 150 * bs} L ${bx + 90 * bs} ${wl - 100 * bs} L ${bx + 128 * bs} ${wl - 60 * bs}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />}
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={0} amp={t > wavesT ? 16 : 9} />
        {t > smallT - 0.2 && smallS > 0.01 && <Berg x={1580} y={wl} s={smallS * pop(t, smallT - 0.2)} under={1} sweat={t * 2} face={{mood: 'scared', open: blink(t)}} />}
        <Pill x={960} y={110} text="WARM WATER MELTS IT FROM BELOW" s={span(t, below, wavesT)} bg={C.red} fg={C.paper} size={46} />
        <Pill x={960} y={110} text="WAVES WEAR DOWN THE SIDES" s={span(t, wavesT, crackT)} bg={C.paper} size={48} />
        <Pill x={960} y={110} text="PIECES BREAK OFF" s={span(t, crackT, smallT)} size={54} />
        <Pill x={960} y={110} text="SMALLER ONES DON'T MAKE IT" s={span(t, smallT)} bg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// 15. Parked off the coast, day and night: weeks or even days ---------------------------------------
const ParkedScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.parked;
  const wl = 660;
  const arrive = prog(t, t0, ph('parked off') + 0.6, easeOutCubic);
  const bx = lerp(-200, 640, arrive);
  const dnT = ph('day and night');
  const dn = t > dnT && t < dnT + 3 ? 0.5 - 0.5 * Math.cos(((t - dnT) / 1.5) * Math.PI * 2) : 0;
  const melt = prog(t, ph('could melt'), ph('even days') + 0.4, (u) => u);
  const bs = 0.72 * lerp(1, 0.4, melt);
  const calS = pop(t, ph('in weeks'));
  const calFlip = t > ph('even days') - 0.25 && t < ph('even days') ? (t - (ph('even days') - 0.25)) / 0.25 : 0;
  const calLabel = t >= ph('even days') ? 'DAYS' : 'WEEKS';
  const sky = dn > 0.5 ? NIGHT : C.sky;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color={sky} />
        {dn <= 0.5 ? <Sun x={1500} y={170} r={70} t={t} hot={1} /> : <circle cx={1500} cy={170} r={60} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />}
        <CapeTown x={1520} y={wl} s={0.6} />
        <Sea y={wl} t={t} x0={-400} x1={2400} />
        {melt > 0 &&
          [0, 1, 2].map((i) => {
            const r = (t * 0.7 + i / 3) % 1;
            return <ellipse key={i} cx={bx} cy={wl + 18} rx={(200 + 260 * r) * bs} ry={(26 + 30 * r) * bs} fill="none" stroke={C.paper} strokeWidth={6 * (1 - r)} />;
          })}
        <Berg x={bx} y={wl} s={bs} sweat={t * 1.2} face={{mood: melt > 0 ? 'scared' : 'worried', look: {x: 1, y: -0.2}, open: blink(t)}} />
        <Pill x={640} y={110} text="THE TRIP IS OVER" s={span(t, ph('trip ends'), ph('parked off'))} bg={C.paper} size={50} />
        <Pill x={640} y={110} text="PARKED OFF THE COAST" s={span(t, ph('parked off'), ph('in weeks'))} size={52} />
        {calS > 0 && <Calendar x={1000} y={330} s={calS * 0.7} label={calLabel} prev="WEEKS" flip={calFlip} />}
      </Layer>
    </Stage>
  );
};

// 16. A year of water: 3 km long on arrival, and bigger at the start ---------------------------------
const HugeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.huge;
  const wl = 700;
  const slide = prog(t, t0 + 0.3, ph('three kilometers') + 0.2, easeOutCubic);
  const zoom = prog(t, t0 + 0.3, ph('three kilometers'));
  const camS = lerp(1, 0.42, zoom) * punch(t, t0);
  const cam = {x: lerp(960, 420, zoom), y: lerp(540, 300, zoom)};
  const bigS = 4;
  const bx = lerp(-2600, 300, slide);
  const kmGrow = prog(t, ph('three kilometers'), ph('when it arrives') + 0.3);
  const ghost = pop(t, ph('start much bigger'), 0.6);
  // DimArrow drawn in screen space (so the label keeps its size)
  const scr = (x: number, y: number) => ({x: (x - cam.x) * camS + W / 2, y: (y - cam.y) * camS + H / 2});
  const a1 = scr(bx - 205 * bigS, wl + 120);
  const a2 = scr(bx + 205 * bigS, wl + 120);
  return (
    <AbsoluteFill>
      <Stage cam={{...cam, s: camS}}>
        <Layer>
          <Sky />
          <CapeTown x={1450} y={wl} s={0.5} />
          <Sea y={wl} t={t} x0={-5000} x1={4000} />
          {ghost > 0 && (
            <g opacity={0.35}>
              <Berg x={bx} y={wl} s={bigS * (1 + 0.35 * ghost)} noFace />
            </g>
          )}
          <Berg x={bx} y={wl} s={bigS} face={{mood: 'smug', look: {x: 1, y: 0}, open: blink(t)}} />
          <Sea y={wl} t={t} x0={-5000} x1={4000} depth={0} />
        </Layer>
      </Stage>
      <Layer>
        <DimArrow x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} label="3 KM ON ARRIVAL" grow={kmGrow} labelS={pop(t, ph('three kilometers'))} />
        <Pill x={960} y={110} text="HOW BIG?" s={span(t, t0 + 0.2, ph('a full year'))} bg={C.paper} size={56} />
        <Pill x={960} y={110} text="ONE YEAR OF WATER" s={span(t, ph('a full year'), ph('start much bigger'))} bg={C.sweat} size={54} />
        <Pill x={960} y={110} text="AND EVEN BIGGER AT THE START" s={span(t, ph('start much bigger'))} bg={C.paper} size={50} />
      </Layer>
    </AbsoluteFill>
  );
};

// 17. A fabric skirt against the warm water: untested ------------------------------------------------
const SkirtScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.skirt;
  const wl = 400;
  const bx = 980;
  const bs = 0.7;
  const grow = prog(t, ph('giant skirt') - 0.2, ph('of fabric') + 0.4);
  const testT = ph('nobody has tested');
  const sh = slamShake(t, testT);
  // skirt hangs from the waterline around the underwater part
  const sk = 820 * bs * grow;
  const wave = (i: number) => Math.sin(t * 2 + i) * 10;
  const skirt = `M ${bx - 380 * bs} ${wl} L ${bx + 380 * bs} ${wl} L ${bx + 400 * bs + wave(1)} ${wl + sk} ${Array.from({length: 8})
    .map((_, i) => `L ${bx + 400 * bs - ((i + 1) * 800 * bs) / 8} ${wl + sk + (i % 2 ? 0 : 26) + wave(i)}`)
    .join(' ')} Z`;
  return (
    <Stage cam={{x: 960 - sh.x, y: 540 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={2400} />
        <Berg x={bx} y={wl} s={bs} under={1} face={{mood: grow > 0.5 ? 'smug' : 'worried', open: blink(t)}} />
        {grow > 0 && <path d={skirt} fill={C.yellow} fillOpacity={0.82} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
        {grow > 0.9 &&
          [0, 1, 2, 3, 4].map((i) => <line key={i} x1={bx - 300 * bs + i * 150 * bs} x2={bx - 300 * bs + i * 150 * bs + 10} y1={wl + 20} y2={wl + sk - 10} stroke={C.gold} strokeWidth={6} />)}
        <Sea y={wl} t={t} x0={-400} x1={2400} depth={0} />
        {/* warm water bouncing off */}
        {t > ph('shield it') &&
          [0, 1].map((i) => {
            const k = pop(t, ph('shield it') + i * 0.2);
            const x = i ? bx + 520 : bx - 520;
            return <Arrow key={i} x1={i ? x + 200 : x - 200} y1={wl + 360} x2={lerp(i ? x + 200 : x - 200, x, k)} y2={wl + 360} color={C.red} w={18} head={40} />;
          })}
        <Floe x={300} y={wl - 24} w={240} />
        <Pill x={1560} y={640} text="FABRIC SKIRT" s={pop(t, ph('of fabric'))} size={44} />
        {t > ph('could help') && <Check x={1560} y={250} s={pop(t, ph('could help')) * 0.8} />}
        {t > testT && <Stamp x={960} y={180} text="UNTESTED" s={slam(t, testT)} />}
      </Layer>
      <Sci t={t} x={300} y={wl - 24} headR={38} poses={[[0, 'present'], [testT, 'nervous']]} />
    </Stage>
  );
};

// 18. Getting the water out: meltwater mixes into the sea ------------------------------------------------
const MixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.mix;
  const wl = 560;
  const blobsT = ph('when ice melts');
  const blobs = Array.from({length: 12}).map((_, i) => {
    const born = blobsT + i * 0.45;
    const d = t - born;
    if (d < 0 || d > 2.6) return null;
    const u = d / 2.6;
    const x = 1050 - 560 * u + Math.sin(i * 2.3) * 40;
    const y = wl + 50 + 110 * u + Math.sin(i) * 30;
    const r = (36 + 42 * Math.sin(Math.PI * Math.min(1, u * 1.3))) * (u > 0.75 ? (1 - u) / 0.25 : 1);
    return <ellipse key={i} cx={x} cy={y} rx={r * 1.5} ry={r * 0.55} fill="#BFE7FF" />;
  });
  const hoseT = ph('pump the meltwater');
  const blockT = ph('carve off blocks');
  const blockU = clamp((t - blockT) / 1.2);
  const provenT = ph('proven way');
  const sh = slamShake(t, provenT);
  return (
    <Stage cam={{x: 960 - sh.x, y: 540 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} />
        {blobs}
        <Berg x={1350} y={wl} s={1.0} sweat={t * 1.2} face={{mood: 'worried', look: {x: -1, y: 0.3}, open: blink(t)}} />
        {t > blockT && <rect x={lerp(1150, 900, blockU) - 60} y={wl - 90 + Math.sin(t * 2) * 5} width={120} height={100} rx={10} fill="#fff" stroke={C.ink} strokeWidth={6} transform={`rotate(${blockU * -12} ${lerp(1150, 900, blockU)} ${wl})`} />}
        {t > hoseT && <path d={`M 360 ${wl - 70} Q 520 ${wl - 10} 640 ${wl + 60}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />}
        {t > hoseT && <path d={`M 360 ${wl - 70} Q 520 ${wl - 10} 640 ${wl + 60}`} stroke={C.green} strokeWidth={12} fill="none" strokeLinecap="round" />}
        <Pier x0={-60} x1={380} y={wl - 40} />
        <Pill x={960} y={110} text="THE HARDEST PROBLEM" s={span(t, ph('hardest problem'), ph('it mixes into'))} size={56} />
        <Pill x={960} y={110} text="IT MIXES INTO THE SEA" s={span(t, ph('it mixes into'), ph("back to salty"))} bg={C.sweat} size={52} />
        <Pill x={960} y={110} text="BACK TO SALTY WATER" s={span(t, ph('back to salty'), blockT)} bg={C.paper} size={52} />
        <Pill x={760} y={250} text="CARVE BLOCKS?" s={span(t, blockT, provenT)} bg={C.paper} size={46} />
        <Pill x={760} y={370} text="PUMP IT UP?" s={span(t, hoseT, provenT)} bg={C.paper} size={46} />
        {t > provenT && <Stamp x={960} y={200} text="NO PROVEN WAY" s={slam(t, provenT)} />}
      </Layer>
      <Sci t={t} x={200} y={wl - 40} headR={40} poses={[[0, 'bucket'], [ph('it mixes into') + 0.4, 'nervous'], [hoseT, 'think'], [provenT, 'facepalm']]} />
    </Stage>
  );
};

// 19. 2018: Nick Sloane's plan for Cape Town: a fifth to a third of a year's water ---------------------
const SloaneScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.sloane;
  const pieT = ph('a fifth');
  const g1 = prog(t, pieT, pieT + 0.6);
  const g2 = prog(t, ph('a third'), ph('a third') + 0.6);
  const R = 230;
  const wedge = (f: number) => {
    const a = f * Math.PI * 2;
    return `M 0 0 L 0 ${-R} A ${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${R * Math.sin(a)} ${-R * Math.cos(a)} Z`;
  };
  const f1 = 0.2 * g1;
  const f2 = 0.2 + (1 / 3 - 0.2) * g2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={1340} cy={560} />
        <g transform="translate(1340 560)">
          <circle r={R} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
          {g2 > 0 && <path d={wedge(f2)} fill={C.sweat} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" strokeDasharray="18 12" />}
          {g1 > 0 && <path d={wedge(f1)} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
        </g>
        <Pill x={960} y={110} text="2018: NICK SLOANE" s={pop(t, ph('nick sloane'))} size={54} />
        <Pill x={600} y={300} text="SALVAGE EXPERT" s={pop(t, ph('salvage expert'))} bg={C.paper} size={44} />
        <Pill x={600} y={560} text="A FIFTH TO A THIRD" s={pop(t, pieT)} size={50} />
        <Pill x={600} y={680} text="OF A YEAR'S WATER" s={pop(t, ph('for a year', pieT))} bg={C.paper} size={46} />
        <Pill x={1340} y={890} text="HIS ESTIMATE" s={pop(t, ph('he estimated'))} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// 20. The price: about $100 million to tow, plus tens of millions to collect ----------------------------
const PriceScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.price;
  const wl = 720;
  const tagT = ph('hundred million dollars');
  const tagS = pop(t, tagT - 0.1, 0.5);
  const swing = wobble(t, tagT, 10, 1.4, 1.6);
  const plusT = ph('tens of millions');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sea y={wl} t={t} x0={-400} x1={2400} />
        <Berg x={760} y={wl} s={0.85} face={{mood: t > plusT ? 'smug' : 'happy', look: {x: 1, y: -0.3}, open: blink(t)}} />
        {tagS > 0 && <PriceTag x={1000} y={520} s={tagS * 0.95} rot={swing - 8} text="$100M" />}
        {t > plusT && <PriceTag x={1340} y={560} s={pop(t, plusT, 0.5) * 0.8} rot={wobble(t, plusT, 10, 1.4, 1.6) + 6} text="+$$$" />}
        <Pill x={960} y={110} text="TO TOW IT: ABOUT $100 MILLION" s={pop(t, tagT)} size={50} />
        <Pill x={960} y={225} text="+ TENS OF MILLIONS TO COLLECT IT" s={pop(t, plusT)} bg={C.paper} size={44} />
      </Layer>
      <Sci t={t} x={1700} y={1010} headR={50} poses={[[0, 'calc'], [plusT + 0.4, 'shocked']]} />
    </Stage>
  );
};

// 21. The city said no: groundwater and desalination ----------------------------------------------------
const CityNoScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.cityNo;
  const noT = ph('said no');
  const sh = slamShake(t, noT);
  return (
    <Stage cam={{x: 960 - sh.x, y: 540 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Ground y={820} />
        {t > ph('groundwater') && (
          <g transform={`translate(500 820) scale(${pop(t, ph('groundwater'))}) translate(-500 -820)`}>
            <Well x={500} y={820} />
          </g>
        )}
        {t > ph('desalination') && (
          <g transform={`translate(1420 820) scale(${pop(t, ph('desalination'))}) translate(-1420 -820)`}>
            <Desal x={1420} y={820} />
          </g>
        )}
        {t > noT && <Stamp x={960} y={160} text="THE CITY SAID NO" s={slam(t, noT)} size={64} />}
        <Pill x={500} y={448} text="GROUNDWATER" s={pop(t, ph('groundwater'))} bg={C.paper} size={46} />
        <Pill x={1420} y={448} text="DESALINATION" s={pop(t, ph('desalination'))} bg={C.paper} size={46} />
        <Pill x={960} y={335} text="CHEAPER, LESS RISKY" s={pop(t, ph('less risky'))} bg={C.green} size={48} />
      </Layer>
      <Sci t={t} x={960} y={1000} headR={46} poses={[[0, 'think'], [ph('less risky'), 'thumbs']]} />
    </Stage>
  );
};

// 22. What Cape Town did: saved water, use cut in half ------------------------------------------------------
const SavedScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.saved;
  const items: Array<[string, string]> = [
    ['SHORT SHOWERS', 'short showers'],
    ['NO WATERING GARDENS', 'no watering'],
    ['50 LITERS PER PERSON A DAY', 'a limit of'],
  ];
  const halfT = ph('cut its water use');
  const bar2 = 1 - 0.5 * prog(t, halfT, ph('in half') + 0.4);
  const barsS = pop(t, halfT - 0.3);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={1560} cy={900} />
        <Pill x={620} y={110} text="WHAT DID CAPE TOWN DO?" s={span(t, t0 + 0.3, ph('people saved'))} bg={C.paper} size={50} />
        <Pill x={620} y={110} text="PEOPLE SAVED WATER" s={pop(t, ph('people saved'))} size={54} />
        {items.map(([txt, w], i) => {
          const s = pop(t, ph(w, t0) - 0.05);
          return (
            <g key={i} transform={`translate(150 ${300 + i * 150}) scale(${s})`}>
              <Check x={0} y={0} s={0.4} />
              <Txt x={60} y={18} text={txt} size={48} />
            </g>
          );
        })}
        {t > ph('short showers') - 0.05 && <Shower x={1060} y={830} t={t} on={1 - prog(t, ph('short showers') + 1.2, ph('short showers') + 1.5)} />}
        {t > ph('no watering') - 0.05 && (
          <g transform={`translate(560 830) scale(${0.6 * pop(t, ph('no watering') - 0.05)})`}>
            <NoCan x={0} y={0} />
          </g>
        )}
        {barsS > 0 && (
          <g transform={`translate(1580 900) scale(${barsS}) translate(-1580 -900)`}>
            <rect x={1400} y={900 - 520} width={140} height={520} rx={12} fill={C.sea} stroke={C.ink} strokeWidth={6} />
            <rect x={1620} y={900 - 520 * bar2} width={140} height={520 * bar2} rx={12} fill={C.sweat} stroke={C.ink} strokeWidth={6} />
            <line x1={1360} x2={1800} y1={900} y2={900} stroke={C.ink} strokeWidth={INK_W} />
            <Txt x={1470} y={960} text="BEFORE" size={36} anchor="middle" />
            <Txt x={1690} y={960} text="2018" size={36} anchor="middle" />
          </g>
        )}
        <Pill x={1480} y={250} text="USE CUT IN HALF" s={pop(t, ph('in half'))} size={50} />
      </Layer>
      <Sci t={t} x={1150} y={1030} headR={44} poses={[[0, 'think'], [ph('people saved'), 'thumbs']]} />
    </Stage>
  );
};

// 23. The rain came back: no Day Zero --------------------------------------------------------------------------
const RainScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.rain;
  const cloudS = pop(t, ph('the rain') - 0.05, 0.5);
  const stampT = ph('never arrived');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#7FB2D9" />
        <CapeTown x={960} y={900} s={0.9} />
        <rect x={-400} y={900} width={2800} height={400} fill="#8CCB6B" />
        <line x1={-400} x2={2400} y1={900} y2={900} stroke={C.ink} strokeWidth={INK_W} />
        {cloudS > 0 &&
          Array.from({length: 30}).map((_, i) => {
            const u = (t * 0.9 + rnd(i)) % 1;
            const x = 520 + rnd(i + 30) * 880;
            return <Drop key={i} x={x} y={lerp(470, 880, u)} s={0.45} color={C.sweat} />;
          })}
        {cloudS > 0 && (
          <g>
            <Cloud x={650} y={420} s={cloudS * 1.1} color="#D8E0E8" />
            <Cloud x={1000} y={390} s={cloudS * 1.3} color="#D8E0E8" />
            <Cloud x={1300} y={430} s={cloudS * 1.0} color="#D8E0E8" />
          </g>
        )}
        {t > stampT && <Stamp x={960} y={170} text="NO DAY ZERO" s={slam(t, stampT)} color={C.teal} />}
      </Layer>
    </Stage>
  );
};

// 24. Recap -------------------------------------------------------------------------------------------------------
const RecapScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.recap;
  const items: Array<[string, string]> = [
    ['HIDES UNDERWATER', 'most of it hides'],
    ['SLIPPERY, TOP-HEAVY, SLOW', 'slippery'],
    ['MELTS ALL THE WAY THERE', 'melts the whole way'],
    ['NO WAY TO CATCH THE WATER', 'nobody knows how'],
  ];
  const bob = Math.sin(t * 3) * 6;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={1500} cy={700} />
        <BigText x={620} y={170} text="WHY NOT?" size={110} fill={C.yellow} s={pop(t, t0 + 0.2)} />
        {items.map(([txt, w], i) => {
          const s = pop(t, ph(w, t0) - 0.05);
          return (
            <g key={i} transform={`translate(170 ${330 + i * 150}) scale(${s})`}>
              <Cross x={0} y={0} s={0.4} />
              <Txt x={60} y={18} text={txt} size={50} />
            </g>
          );
        })}
        <g transform={`translate(0 ${bob})`}>
          <ellipse cx={1520} cy={760} rx={290} ry={60} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
          <Berg x={1520} y={760} s={0.95} face={{mood: 'smug', look: {x: -1, y: -0.3}, open: blink(t)}} />
        </g>
      </Layer>
    </Stage>
  );
};

// 25. Final line: the ice is free, getting it into a tap is the hard part ------------------------------------
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const tagS = pop(t, ph('is free') - 0.05, 0.5);
  const tagSwing = wobble(t, ph('is free'), 10, 1.4, 1.6);
  const tapS = pop(t, ph('getting it'), 0.45);
  const dropT = ph('a tap') + 0.15;
  const dU = clamp((t - dropT) / 0.55);
  const bob = Math.sin(t * 3) * 6;
  const hardT = ph('hard part');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={900} />
        <g transform={`translate(0 ${bob})`}>
          <ellipse cx={560} cy={800} rx={300} ry={62} fill={C.sea} stroke={C.ink} strokeWidth={INK_W} />
          <Berg x={560} y={800} s={1.0} face={{mood: t > hardT ? 'worried' : 'smug', look: {x: 1, y: -0.5}, open: blink(t)}} />
          {tagS > 0 && <PriceTag x={360} y={640} s={tagS * 0.85} rot={tagSwing - 8} text="FREE" />}
        </g>
        {tapS > 0 && (
          <g transform={`translate(1300 360) scale(${tapS}) translate(-1300 -360)`}>
            <Tap x={1240} y={360} s={0.95} face={{mood: t > hardT ? 'smug' : 'neutral'}} />
          </g>
        )}
        {t > dropT && dU < 1 && <Drop x={1373} y={520 + 480 * dU * dU} s={0.9} />}
        {t < dropT && tapS > 0.9 && <Drop x={1373} y={515} s={clamp((t - ph('getting it') - 0.3) / 0.6)} />}
      </Layer>
      <Sci t={t} x={1650} y={1020} headR={48} poses={[[0, 'point'], [hardT - 0.05, 'facepalm']]} />
    </Stage>
  );
};

const EndScene: React.FC<{t: number}> = ({t}) => <EndCard t={t} t0={S.endcard} />;

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.intro, IntroScene],
  [S.antarctica, AntarcticaScene],
  [S.fix, FixScene],
  [S.history, HistoryScene],
  [S.plan, PlanScene],
  [S.under, UnderScene],
  [S.woods, WoodsScene],
  [S.building, BuildingScene],
  [S.harbor, HarborScene],
  [S.canada, CanadaScene],
  [S.tricky, TrickyScene],
  [S.speed, SpeedScene],
  [S.melt, MeltScene],
  [S.erosion, ErosionScene],
  [S.parked, ParkedScene],
  [S.huge, HugeScene],
  [S.skirt, SkirtScene],
  [S.mix, MixScene],
  [S.sloane, SloaneScene],
  [S.price, PriceScene],
  [S.cityNo, CityNoScene],
  [S.saved, SavedScene],
  [S.rain, RainScene],
  [S.recap, RecapScene],
  [S.final, FinalScene],
  [S.endcard, EndScene],
];

export const IcebergLong: React.FC = () => {
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
      {probe && <LayoutProbe root={root} frame={frame} />}
      <Sequence from={Math.round(0.4 * FPS)} layout="none">
        <Audio src={staticFile('iceberglong/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={(f) => Math.pow(10, dbAt(c, c.at + f / FPS) / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
