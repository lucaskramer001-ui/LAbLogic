import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {LayoutProbe} from '../iceberglong/kit';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, FONT_DISPLAY, Face, INK_W, Pill, Sky, Sunburst, textWidth} from '../iceberg/art';
import {clamp, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, wobble} from '../iceberg/anim';
import {Stamp} from '../sun/space';

// "Why don't we just print more money?" - Short, 1080x1920 (rendered 4K with --scale=2).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const CASH = '#7BC67E';
const CASH_D = '#4E9A55';
const CRUST = '#E3A35A';
const CRUST_D = '#C47F36';
const PAPER_BG = '#FFF8E7';

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
const blink = (t: number, period = 3.3, off = 0) => {
  const d = (((t + off) % period) + period) % period;
  return d < 0.12 ? Math.abs(d - 0.06) / 0.06 : 1;
};
const until = (t: number, t1: number) => 1 - prog(t, t1 - 0.25, t1, (u) => u);
const span = (t: number, t0: number, t1 = 1e9) => pop(t, t0) * until(t, t1);
const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.3, 1, st) : 1;
};

// ------------------------------------------------------------------ props

// Banknote (centre x, y), 240 x 120 at s = 1. No real currency design, just "$".
const Bill: React.FC<{x: number; y: number; s?: number; rot?: number; label?: string}> = ({x, y, s = 1, rot = 0, label = '$'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-120} y={-60} width={240} height={120} rx={12} fill={CASH} stroke={C.ink} strokeWidth={6} />
    <rect x={-104} y={-46} width={208} height={92} rx={8} fill="none" stroke={CASH_D} strokeWidth={5} />
    <circle r={34} fill="#A8DDA9" stroke={CASH_D} strokeWidth={5} />
    <text x={0} y={label.length > 1 ? 10 : 16} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={label.length > 1 ? 36 : 46} fill={CASH_D}>
      {label}
    </text>
  </g>
);

// Stack of n bills (bottom at y).
const Stack: React.FC<{x: number; y: number; n: number; s?: number}> = ({x, y, n, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: Math.max(0, Math.round(n))}).map((_, i) => (
      <g key={i} transform={`translate(${(i % 2 ? 6 : -6) + Math.sin(i * 1.7) * 4} ${-30 - i * 22})`}>
        <rect x={-120} y={-20} width={240} height={40} rx={8} fill={i % 2 ? CASH : '#8ED291'} stroke={C.ink} strokeWidth={5} />
        <rect x={-30} y={-20} width={60} height={40} fill="#F4E8C1" stroke={C.ink} strokeWidth={4} />
      </g>
    ))}
  </g>
);

// Loaf of bread with an optional face (centre x, bottom y), ~220 wide at s = 1.
const Loaf: React.FC<{x: number; y: number; s?: number; t: number; mood?: React.ComponentProps<typeof Face>['mood']; face?: boolean; rot?: number}> = ({x, y, s = 1, t, mood = 'happy', face = true, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -110 0 L -110 -70 C -130 -150 -40 -170 0 -150 C 40 -170 130 -150 110 -70 L 110 0 Z" fill={CRUST} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d="M -60 -140 L -40 -112 M -6 -148 L 14 -118 M 48 -140 L 66 -112" stroke={CRUST_D} strokeWidth={9} strokeLinecap="round" />
    <path d="M 70 -100 C 90 -60 92 -30 88 -6 L 106 -6 L 106 -70 Z" fill={CRUST_D} opacity={0.6} />
    {face && <Face x={-6} y={-58} s={0.55} mood={mood} open={blink(t, 3.1, x * 0.01)} gap={42} />}
  </g>
);

// Price tag that grows with its text (hole on the left), centre x, y.
const Tag: React.FC<{x: number; y: number; text: string; s?: number; rot?: number; size?: number; bg?: string}> = ({x, y, text, s = 1, rot = 0, size = 70, bg = C.yellow}) => {
  const w = textWidth(text, size, 900) + size * 1.6;
  const h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} data-label={text}>
      <path d={`M ${-w / 2} 0 L ${-w / 2 + h / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2} ${h / 2} L ${-w / 2 + h / 2} ${h / 2} Z`} transform="translate(8 8)" fill={C.ink} />
      <path d={`M ${-w / 2} 0 L ${-w / 2 + h / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2} ${h / 2} L ${-w / 2 + h / 2} ${h / 2} Z`} fill={bg} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <circle cx={-w / 2 + h * 0.42} cy={0} r={size * 0.16} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={h * 0.2} y={size * 0.36} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

// Money printer with a face; bills come out of the slot on the right.
const Printer: React.FC<{x: number; y: number; s?: number; t: number; on?: boolean; mood?: React.ComponentProps<typeof Face>['mood']}> = ({x, y, s = 1, t, on = true, mood = 'happy'}) => {
  const shakeX = on ? Math.sin(t * 40) * 2 : 0;
  return (
    <g transform={`translate(${x + shakeX} ${y}) scale(${s})`}>
      <rect x={-190 + 10} y={-300 + 10} width={380} height={300} rx={30} fill={C.ink} />
      <rect x={-190} y={-300} width={380} height={300} rx={30} fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-160} y={-270} width={320} height={60} rx={14} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
      <rect x={-140} y={-252} width={180} height={24} rx={6} fill={CASH} stroke={C.ink} strokeWidth={4} />
      <circle cx={110} cy={-240} r={14} fill={on ? C.green : C.red} stroke={C.ink} strokeWidth={5} />
      <Face x={-10} y={-120} s={0.7} mood={mood} open={blink(t, 2.9)} gap={46} />
      <rect x={150} y={-90} width={60} height={70} rx={10} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
      <rect x={-170} y={0} width={60} height={26} rx={6} fill={C.ink} />
      <rect x={110} y={0} width={60} height={26} rx={6} fill={C.ink} />
    </g>
  );
};

// Bills flying out of the printer slot (x0, y0) in an arc, one every `gap` seconds.
const BillStream: React.FC<{x0: number; y0: number; t: number; t0: number; gap?: number; dir?: number; n?: number}> = ({x0, y0, t, t0, gap = 0.22, dir = 1, n = 14}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const d = t - t0 - i * gap;
      if (d < 0 || d > 2.2) return null;
      const vx = (260 + rnd(i) * 220) * dir;
      const vy = -(520 + rnd(i + 9) * 260);
      const x = x0 + vx * d;
      const y = y0 + vy * d + 0.5 * 900 * d * d;
      return <Bill key={i} x={x} y={y} s={0.42} rot={d * 300 * (rnd(i + 3) - 0.5)} />;
    })}
  </g>
);

const Shoe: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -110 0 L -110 -90 L -50 -90 C -30 -50 30 -50 80 -40 C 120 -32 120 0 110 0 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-116} y={-6} width={232} height={22} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <path d="M -60 -70 L -30 -60 M -64 -50 L -30 -44" stroke={C.paper} strokeWidth={8} strokeLinecap="round" />
  </g>
);
const FuelCan: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -80 0 L -80 -150 L 30 -150 L 80 -100 L 80 0 Z" fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-50} y={-180} width={60} height={30} rx={6} fill={C.ink} />
    <path d="M -50 -110 L 40 -30 M 40 -110 L -50 -30" stroke="#B42820" strokeWidth={10} />
  </g>
);

// Shop shelf (top at y) spanning x0..x1.
const Shelf: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={34} rx={8} fill="#B07A47" stroke={C.ink} strokeWidth={INK_W} />
    <rect x={x0 + 30} y={y + 34} width={22} height={60} fill="#8A5A34" stroke={C.ink} strokeWidth={5} />
    <rect x={x1 - 52} y={y + 34} width={22} height={60} fill="#8A5A34" stroke={C.ink} strokeWidth={5} />
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  printer: ph('why') - 0.05,
  catch: ph("here's the catch") - 0.05,
  town: ph('picture a town') - 0.05,
  hyper: ph('push that far') - 0.05,
  germany: ph('in germany') - 0.05,
  zimbabwe: ph('zimbabwe tried') - 0.05,
  job: ph('printing money does') - 0.05,
  final: ph("more money doesn't") - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = cover (grid-safe: everything inside rows 240-1680).
const CoverScene: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <Layer>
      <Sunburst t={t} cx={540} cy={1250} />
      <BigText x={540} y={530} text="WHY DON'T WE" size={106} />
      <BigText x={540} y={652} text="JUST PRINT" size={106} />
      <BigText x={540} y={812} text="MORE" size={142} fill={C.yellow} />
      <BigText x={540} y={964} text="MONEY?" size={142} fill={C.yellow} />
      <Printer x={790} y={1620} s={0.8} t={t} />
      <Bill x={640} y={1180} s={0.55} rot={-18} />
      <Bill x={930} y={1120} s={0.5} rot={22} />
    </Layer>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 250, top: 300, width: 500}} />
    <Sci t={t} x={300} y={1630} headR={48} poses={[[0, 'cash']]} />
  </Stage>
);

// Why not just print more? Hand everyone a stack of cash.
const PrinterScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.printer;
  const solvedT = ph('poverty is solved');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={1000} />
        <rect x={-200} y={1300} width={1480} height={800} fill={C.yellow} />
        <line x1={-200} x2={1280} y1={1300} y2={1300} stroke={C.ink} strokeWidth={INK_W} />
        <Printer x={640} y={1300} s={1.15} t={t} mood={t > ph('print more') ? 'smug' : 'happy'} />
        {t > ph('print more') - 0.2 && <BillStream x0={640 + 205 * 1.15} y0={1300 - 60 * 1.15} t={t} t0={ph('print more') - 0.2} dir={1} n={30} gap={0.16} />}
        <Pill x={540} y={300} text="PRINT MORE?" s={span(t, ph('print more'), solvedT)} size={66} />
        <Pill x={540} y={300} text="POVERTY SOLVED?" s={span(t, solvedT)} bg={C.green} size={62} />
      </Layer>
      <Sci t={t} x={230} y={1300} headR={50} poses={[[0, 'think'], [ph('hand everyone'), 'cash']]} />
    </Stage>
  );
};

// Money isn't wealth: it's a ticket for real things. More tickets, no extra loaf.
const CatchScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.catch;
  const notT = ph("money isn't wealth");
  const ticketT = ph("it's a ticket");
  const printT = ph('printing more tickets');
  const items: Array<[number, string]> = [
    [ph('bread,'), 'bread'],
    [ph('shoes'), 'shoes'],
    [ph('and fuel'), 'fuel'],
  ];
  const stackN = printT < t ? 3 + 9 * prog(t, printT, printT + 1.6, (u) => u) : 3;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={PAPER_BG} />
        <g transform={`translate(540 520) scale(${pop(t, t0 + 0.1)})`}>
          <Bill x={0} y={0} s={1.7} label="TICKET" />
        </g>
        {t > notT && <Stamp x={540} y={330} text="NOT WEALTH" s={slam(t, notT)} />}
        {items.map(([at, k], i) => {
          const s = pop(t, at - 0.05);
          const x = 220 + i * 320;
          if (s <= 0) return null;
          return (
            <g key={k} transform={`translate(${x} 1060) scale(${s}) translate(${-x} -1060)`}>
              {k === 'bread' && <Loaf x={x} y={1060} s={0.9} t={t} />}
              {k === 'shoes' && <Shoe x={x} y={1060} s={0.9} />}
              {k === 'fuel' && <FuelCan x={x} y={1060} s={0.9} />}
            </g>
          );
        })}
        {t > ticketT && t < printT && (
          <g opacity={pop(t, ticketT)}>
            {[220, 540, 860].map((x, i) => (
              <path key={i} d={`M 540 650 Q ${(540 + x) / 2} 760 ${x} 860`} stroke={C.ink} strokeWidth={8} fill="none" strokeDasharray="18 14" />
            ))}
          </g>
        )}
        {t > printT && <Stack x={860} y={1300} n={stackN} s={0.8} />}
        {t > printT && <Pill x={300} y={1240} text="+0 LOAVES" s={pop(t, ph('single extra loaf'))} bg={C.red} fg={C.paper} size={56} />}
      </Layer>
    </Stage>
  );
};

// Ten loaves, $100 -> $10 each. Print $100 more: still ten loaves, price heads to $20.
const TownScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.town;
  const loavesT = ph('ten loaves');
  const doubleT = ph('print another hundred');
  const priceT = ph('price climbs');
  const cash = 4 + (t > doubleT ? 4 * prog(t, doubleT, doubleT + 1.2, (u) => u) : 0);
  const priceUp = t > ph('twenty dollars') - 0.1;
  const bounce = t > ph('still only') ? wobble(t, ph('still only'), 10, 3, 3) : 0;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <rect x={-200} y={1150} width={1480} height={900} fill="#D9B98C" />
        <line x1={-200} x2={1280} y1={1150} y2={1150} stroke={C.ink} strokeWidth={INK_W} />
        {/* shop shelf with ten loaves */}
        <Shelf x0={60} x1={1020} y={720} />
        {Array.from({length: 10}).map((_, i) => {
          const s = pop(t, loavesT + i * 0.06, 0.4);
          const row = i < 5 ? 0 : 1;
          const x = 160 + (i % 5) * 190 + row * 0;
          const y = row ? 720 : 520;
          return s > 0 ? <Loaf key={i} x={x} y={y - (row ? 0 : 0) + (i % 2 ? bounce : -bounce)} s={0.62 * s} t={t} mood={priceUp ? 'surprised' : 'happy'} face={i % 3 === 0} /> : null;
        })}
        {t > loavesT && <Shelf x0={60} x1={1020} y={520} />}
        {/* cash pile */}
        <Stack x={760} y={1130} n={cash} s={0.85} />
        <Pill x={760} y={1260} text={t > doubleT + 0.6 ? '$200' : '$100'} s={pop(t, ph('a hundred dollars'))} bg={CASH} size={60} />
        {/* price tag */}
        {t > ph('each loaf') - 0.1 && (
          <Tag x={540} y={300} text={priceUp ? '$20 A LOAF' : '$10 A LOAF'} s={pop(t, ph('each loaf') - 0.1) * (priceUp ? 1 + 0.12 * Math.exp(-4 * (t - ph('twenty dollars'))) : 1)} rot={-4} bg={priceUp ? C.red : C.yellow} size={66} />
        )}
        {priceUp && <Pill x={540} y={455} text={t > ph('nobody can') ? 'NOBODY GOT RICHER' : 'SAME 10 LOAVES'} s={pop(t, priceT)} bg={C.paper} size={50} />}
      </Layer>
      <Sci t={t} x={230} y={1150} headR={48} poses={[[0, 'present'], [doubleT, 'cash'], [priceT, 'shocked'], [ph('nobody can'), 'facepalm']]} />
    </Stage>
  );
};

// Hyperinflation: the price line takes off.
const HyperScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hyper;
  const g = prog(t, t0 + 0.2, ph('hyperinflation') + 0.8, (u) => u);
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = (i / 40) * g;
    const x = 140 + u * 800;
    const y = 1250 - 900 * (Math.exp(5.2 * u) - 1) / (Math.exp(5.2) - 1);
    pts.push(`${x} ${y}`);
  }
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={1250} />
        <line x1={140} x2={960} y1={1250} y2={1250} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <line x1={140} x2={140} y1={1250} y2={330} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <path d={'M ' + pts.join(' L ')} stroke={C.ink} strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={'M ' + pts.join(' L ')} stroke={C.red} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={160} y={1310} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={40} fill={C.paper} stroke={C.ink} strokeWidth={8} paintOrder="stroke fill">TIME</text>
        <Pill x={560} y={330} text="PRICES" s={pop(t, t0 + 0.3)} bg={C.paper} size={50} />
        <BigText x={540} y={240} text="HYPERINFLATION" size={96} fill={C.yellow} s={pop(t, ph('hyperinflation'))} />
      </Layer>
    </Stage>
  );
};

// Germany: a Berlin loaf, 160 marks (end of 1922) -> about 200 billion marks (late 1923).
const GermanyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.germany;
  const lateT = ph('by late 1923');
  const flip = t > lateT && t < lateT + 0.25 ? (t - lateT) / 0.25 : 0;
  const big = t > ph('two hundred billion') - 0.05;
  const grow = big ? 1 + 0.15 * Math.exp(-3 * (t - ph('two hundred billion'))) : 1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={PAPER_BG} />
        <Pill x={540} y={170} text="GERMANY: BERLIN" s={pop(t, ph('germany'))} bg={C.paper} size={56} />
        <Calendar x={540} y={500} s={0.85} label={t >= lateT ? '1923' : '1922'} prev="1922" flip={flip} />
        <Loaf x={540} y={1060} s={1.6} t={t} mood={big ? 'scared' : 'happy'} />
        {!big && t > ph('a hundred and sixty') - 0.1 && <Tag x={540} y={1200} text="160 MARKS" s={pop(t, ph('a hundred and sixty') - 0.1)} size={64} />}
        {big && <Tag x={540} y={1200} text="200,000,000,000 MARKS" s={pop(t, ph('two hundred billion') - 0.05) * grow * 0.78} bg={C.red} size={60} />}
      </Layer>
    </Stage>
  );
};

// Zimbabwe: prices doubling about every 25 hours; a 100 trillion dollar note.
const ZimbabweScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.zimbabwe;
  const dblT = ph('doubling');
  const noteT = ph('one hundred trillion');
  const k = t > dblT ? Math.min(4, Math.floor((t - dblT) / 0.5) + 1) : 0;
  const prices = ['$1', '$2', '$4', '$8', '$16'];
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={900} />
        <Pill x={540} y={170} text="ZIMBABWE, NOV 2008" s={pop(t, ph('zimbabwe'))} size={56} />
        {t < noteT - 0.2 && (
          <g>
            <Loaf x={540} y={900} s={1.4} t={t} mood={k > 1 ? 'scared' : 'worried'} />
            {t > dblT - 0.1 && <Tag x={540} y={1040} text={prices[k]} s={pop(t, dblT - 0.1) * (1 + 0.1 * Math.exp(-6 * (((t - dblT) % 0.5))))} bg={C.red} size={70} />}
            <Pill x={540} y={1240} text="x2 ABOUT EVERY 25 HOURS" s={pop(t, ph('twenty-five hours'))} bg={C.paper} size={48} />
            <Pill x={540} y={380} text="ECONOMISTS' ESTIMATE" s={pop(t, ph('economists estimate'))} bg={C.paper} size={40} />
          </g>
        )}
        {t > noteT - 0.2 && (
          <g transform={`translate(540 800) scale(${pop(t, noteT - 0.2, 0.5)}) rotate(-6)`}>
            <Bill x={0} y={0} s={3.6} label="" />
            <text x={0} y={-40} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={78} fill={C.paper} stroke={C.ink} strokeWidth={14} paintOrder="stroke fill">100 TRILLION</text>
            <text x={0} y={70} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={64} fill={C.paper} stroke={C.ink} strokeWidth={12} paintOrder="stroke fill">DOLLARS</text>
          </g>
        )}
      </Layer>
      {t > noteT - 0.2 && <Sci t={t} x={540} y={1380} headR={44} poses={[[0, 'shocked']]} />}
    </Stage>
  );
};

// Printing has a job: money growing with the economy is fine; much faster is the trouble.
const JobScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.job;
  const growT = ph('as an economy grows');
  const fastT = ph('much faster');
  const stuff = 0.3 + 0.25 * prog(t, growT, ph('more stuff') + 0.4);
  const money = stuff + (t > fastT ? 0.42 * prog(t, fastT, fastT + 0.9, easeOutBack) : 0);
  const bar = (x: number, h: number, color: string) => <rect x={x} y={1250 - 860 * h} width={260} height={860 * h} rx={16} fill={color} stroke={C.ink} strokeWidth={INK_W} />;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={PAPER_BG} />
        {bar(170, stuff, CRUST)}
        {bar(650, money, t > fastT ? C.red : CASH)}
        <line x1={100} x2={980} y1={1250} y2={1250} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <Loaf x={300} y={1250 - 860 * stuff - 10} s={0.7} t={t} face={false} />
        <Bill x={780} y={1250 - 860 * money - 70} s={0.6} />
        <Pill x={300} y={1320} text="STUFF" s={pop(t, growT)} bg={CRUST} size={50} />
        <Pill x={780} y={1320} text="MONEY" s={pop(t, growT)} bg={CASH} size={50} />
        <Pill x={540} y={170} text="GROWING TOGETHER: OK" s={span(t, ph('more stuff'), fastT)} bg={C.green} size={50} />
        <Pill x={540} y={170} text="MUCH FASTER: TROUBLE" s={span(t, fastT)} bg={C.red} fg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// More money doesn't make more bread. It just makes bread cost more.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const costT = ph('makes bread cost');
  const tagS = t > costT ? 1 + 0.6 * prog(t, costT, costT + 0.9, easeOutBack) : 1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={1000} />
        <Stack x={540} y={1250} n={10} s={1.2} />
        <Loaf x={540} y={1250 - 30 - 10 * 22 * 1.2} s={1.3} t={t} mood={t > costT ? 'smug' : 'happy'} />
        {t > ph('bread', S.final) && <Tag x={540} y={430} text="$$$$" s={pop(t, ph('bread', S.final)) * tagS} rot={-6} bg={C.red} size={80} />}
      </Layer>
      <Sci t={t} x={180} y={1330} headR={46} poses={[[0, 'point'], [costT - 0.05, 'facepalm']]} />
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
  [S.printer, PrinterScene],
  [S.catch, CatchScene],
  [S.town, TownScene],
  [S.hyper, HyperScene],
  [S.germany, GermanyScene],
  [S.zimbabwe, ZimbabweScene],
  [S.job, JobScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

type Cue = {f: string; at: number; db: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
export const SFX: Cue[] = [
  ...[S.printer, S.catch, S.town, S.hyper, S.germany, S.zimbabwe, S.job, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: U('printer'), at: ph('print more') - 0.25, db: -20},
  ...[ph('poverty is solved'), ph('bread,'), ph('shoes'), ph('and fuel'), ph('single extra loaf'), ph('ten loaves'), ph('a hundred dollars'), ph('each loaf'), ph('germany'), ph('a hundred and sixty'), ph('zimbabwe'), ph('twenty-five hours'), ph('more stuff'), ph('bread', S.final)].map((at) => ({f: I('pop'), at: at - 0.03, db: -21})),
  ...[ph("money isn't wealth"), ph('twenty dollars'), ph('two hundred billion'), ph('one hundred trillion'), ph('much faster')].map((at) => ({f: I('stamp'), at, db: -12})),
  {f: U('printer'), at: ph('print another hundred'), db: -22},
  {f: U('rocket'), at: S.hyper + 0.3, db: -20},
  {f: I('pages'), at: ph('by late 1923'), db: -18},
  ...[0, 1, 2, 3].map((i) => ({f: I('pop'), at: ph('doubling') + i * 0.5, db: -20})),
  {f: U('fail'), at: ph('makes bread cost'), db: -18},
];

export const MoneyShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  return (
    <AbsoluteFill style={{backgroundColor: C.sky}} ref={root}>
      <Scene t={t} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.printer || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('money/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
