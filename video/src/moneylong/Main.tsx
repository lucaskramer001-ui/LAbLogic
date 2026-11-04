import React, {useRef} from 'react';
import {AbsoluteFill, Audio, Sequence, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, ph} from './timing';
import {S} from './scenes';
import {Sci} from '../iceberg/Sci';
import {BigText, C, Calendar, Drop, FONT_DISPLAY, Face, INK_W, Sky} from '../iceberg/art';
import {clamp, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, wobble} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {Burst, Cross, EndCard, Layer, LayoutProbe, Pill, Stage, Txt, blink, punch, span, until, useFonts} from '../iceberglong/kit';
import {Bill, BillStream, CASH, CRUST, FuelCan, Loaf, PAPER_BG, Printer, Shelf, Shoe, Stack, Tag} from '../money/Main';

export const DURATION_FRAMES = Math.ceil(END * FPS);

const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.3, 1, st) : 1;
};
const Paper: React.FC = () => <rect x={-500} y={-500} width={3000} height={2200} fill={PAPER_BG} />;
const Floor: React.FC<{y: number; color?: string}> = ({y, color = C.yellow}) => (
  <g>
    <rect x={-500} y={y} width={3000} height={1200} fill={color} />
    <line x1={-500} x2={2500} y1={y} y2={y} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// Government building with columns (bottom centre x, y).
const GovHall: React.FC<{x: number; y: number; s?: number; t: number; mood?: React.ComponentProps<typeof Face>['mood']}> = ({x, y, s = 1, t, mood = 'worried'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-260} y={-40} width={520} height={40} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={-230} y={-280} width={460} height={240} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
    {[-180, -90, 0, 90, 180].map((cx) => (
      <rect key={cx} x={cx - 18} y={-270} width={36} height={230} fill="#fff" stroke={C.ink} strokeWidth={5} />
    ))}
    <path d="M -280 -280 L 0 -400 L 280 -280 Z" fill={C.teal} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <Face x={0} y={-325} s={0.55} mood={mood} open={blink(t, 3.4)} gap={44} />
  </g>
);

// Piggy bank with face (centre x, bottom y); `shrink` 0..1 deflates it.
const Piggy: React.FC<{x: number; y: number; s?: number; t: number; shrink?: number; crack?: boolean}> = ({x, y, s = 1, t, shrink = 0, crack}) => {
  const k = 1 - 0.35 * shrink;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k} ${s * k})`}>
      <rect x={-90} y={-40} width={36} height={44} rx={10} fill="#F29CB5" stroke={C.ink} strokeWidth={6} />
      <rect x={50} y={-40} width={36} height={44} rx={10} fill="#F29CB5" stroke={C.ink} strokeWidth={6} />
      <ellipse cx={0} cy={-130} rx={170} ry={120} fill="#F7B6C8" stroke={C.ink} strokeWidth={INK_W} />
      <ellipse cx={170} cy={-130} rx={34} ry={40} fill="#F29CB5" stroke={C.ink} strokeWidth={6} />
      <circle cx={162} cy={-138} r={6} fill={C.ink} />
      <circle cx={180} cy={-122} r={6} fill={C.ink} />
      <path d="M -60 -240 L -20 -290 L 10 -235" fill="#F29CB5" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-40} y={-252} width={90} height={14} rx={7} fill={C.ink} />
      <Face x={80} y={-160} s={0.5} mood={shrink > 0.3 ? 'scared' : 'happy'} open={blink(t, 3.1)} gap={40} />
      {crack && <path d="M -60 -230 L -30 -170 L -70 -120 L -40 -60" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />}
    </g>
  );
};

// Wallet character (centre x, bottom y).
const Wallet: React.FC<{x: number; y: number; s?: number; t: number; color: string; mood?: React.ComponentProps<typeof Face>['mood']; cash?: number}> = ({x, y, s = 1, t, color, mood = 'happy', cash = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {cash > 0 && <Bill x={0} y={-190} s={0.55} rot={-8} />}
    <rect x={-120} y={-170} width={240} height={170} rx={24} fill={color} stroke={C.ink} strokeWidth={INK_W} />
    <rect x={40} y={-120} width={90} height={70} rx={16} fill={color} stroke={C.ink} strokeWidth={6} />
    <circle cx={100} cy={-85} r={10} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
    <Face x={-30} y={-90} s={0.5} mood={mood} open={blink(t, 3.6, x * 0.01)} gap={40} />
  </g>
);

// Factory with smokestacks; `on` toggles smoke.
const Factory: React.FC<{x: number; y: number; s?: number; t: number; on: boolean}> = ({x, y, s = 1, t, on}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-120, -20].map((cx, i) => (
      <g key={i}>
        <rect x={cx} y={-360} width={60} height={200} fill="#B85C4A" stroke={C.ink} strokeWidth={6} />
        {on &&
          [0, 1, 2].map((k) => {
            const u = (t * 0.6 + k / 3 + i * 0.2) % 1;
            return <circle key={k} cx={cx + 30 + u * 50} cy={-380 - u * 160} r={20 + 30 * u} fill="#BFC5CC" stroke={C.ink} strokeWidth={4} opacity={1 - u * 0.6} />;
          })}
      </g>
    ))}
    <path d="M -220 0 L -220 -170 L -140 -230 L -140 -170 L -60 -230 L -60 -170 L 20 -230 L 20 -170 L 200 -170 L 200 0 Z" fill="#D9D1C3" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    {[-180, -100, -20, 60, 140].map((wx) => (
      <rect key={wx} x={wx} y={-120} width={50} height={50} rx={6} fill={on ? C.yellow : '#7A7F86'} stroke={C.ink} strokeWidth={5} />
    ))}
  </g>
);

// Wheat sheaf, `wilt` 0..1 droops and browns it.
const Wheat: React.FC<{x: number; y: number; s?: number; wilt: number}> = ({x, y, s = 1, wilt}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-40, -15, 10, 35].map((dx, i) => {
      const bend = wilt * (i % 2 ? 50 : -40);
      const col = wilt > 0.5 ? '#A0825A' : C.gold;
      return (
        <g key={i}>
          <path d={`M ${dx * 0.3} 0 Q ${dx} -120 ${dx + bend} -220`} stroke={col} strokeWidth={10} fill="none" />
          <ellipse cx={dx + bend} cy={-240} rx={16} ry={40} fill={col} stroke={C.ink} strokeWidth={5} transform={`rotate(${bend * 0.6} ${dx + bend} -240)`} />
        </g>
      );
    })}
  </g>
);

// Oil barrel (bottom centre x, y).
const OilBarrel: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-220} width={160} height={220} rx={18} fill="#2F4A6B" stroke={C.ink} strokeWidth={INK_W} />
    <line x1={-80} x2={80} y1={-150} y2={-150} stroke={C.ink} strokeWidth={6} />
    <line x1={-80} x2={80} y1={-70} y2={-70} stroke={C.ink} strokeWidth={6} />
    <path d="M 0 -138 C -26 -100 -30 -86 -30 -78 A 30 30 0 0 0 30 -78 C 30 -86 26 -100 0 -138 Z" fill={C.ink} stroke={C.paper} strokeWidth={4} />
  </g>
);

// Clock face with hands spinning at `speed`.
const Clock: React.FC<{x: number; y: number; s?: number; t: number; speed?: number}> = ({x, y, s = 1, t, speed = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={120} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * 96} y1={Math.sin(a) * 96} x2={Math.cos(a) * 110} y2={Math.sin(a) * 110} stroke={C.ink} strokeWidth={6} />;
    })}
    <line x1={0} y1={0} x2={Math.sin(t * speed) * 60} y2={-Math.cos(t * speed) * 60} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(t * speed * 12) * 90} y2={-Math.cos(t * speed * 12) * 90} stroke={C.red} strokeWidth={7} strokeLinecap="round" />
    <circle r={10} fill={C.ink} />
  </g>
);

// Line chart (prices over time) with exponential rise; `k` shape, `g` drawn fraction.
const Chart: React.FC<{x: number; y: number; w: number; h: number; g: number; k: number; color?: string; label?: string}> = ({x, y, w, h, g, k, color = C.red, label = 'TIME'}) => {
  const pts: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const u = (i / 50) * g;
    const val = k < 0.01 ? u : (Math.exp(k * u) - 1) / (Math.exp(k) - 1);
    pts.push(`${x + u * w} ${y - h * val}`);
  }
  return (
    <g>
      <line x1={x} x2={x + w + 20} y1={y} y2={y} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
      <line x1={x} x2={x} y1={y} y2={y - h - 20} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
      <path d={'M ' + pts.join(' L ')} stroke={C.ink} strokeWidth={28} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={'M ' + pts.join(' L ')} stroke={color} strokeWidth={15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Txt x={x + w - 10} y={y + 56} text={label} size={38} anchor="end" />
    </g>
  );
};

// ================================================================== scenes

// 1. Governments run short of money... a printing press.
const IntroScene: React.FC<{t: number}> = ({t}) => {
  const pressT = ph('a printing press');
  const items: Array<[string, string]> = [
    ['BILLS', 'bills to pay'],
    ['WAGES', 'workers to pay'],
    ['DEBTS', 'debts to pay'],
  ];
  return (
    <Stage cam={{s: punch(t, 0)}}>
      <Layer>
        <Sky />
        <Floor y={900} color="#8CCB6B" />
        <GovHall x={560} y={900} s={1.25} t={t} mood={t > pressT ? 'smug' : 'worried'} />
        {items.map(([txt, w], i) => (
          <Pill key={txt} x={1180 + i * 0} y={250 + i * 130} text={txt} s={span(t, ph(w), pressT)} bg={i === 2 ? C.red : C.paper} fg={i === 2 ? C.paper : C.ink} size={54} />
        ))}
        {t > pressT - 0.1 && (
          <g transform={`translate(1350 900) scale(${pop(t, pressT - 0.1, 0.5)}) translate(-1350 -900)`}>
            <Printer x={1350} y={900} s={1.1} t={t} />
          </g>
        )}
        <Pill x={1350} y={300} text="A PRINTING PRESS" s={pop(t, pressT)} size={58} />
      </Layer>
    </Stage>
  );
};

// 2. The obvious fix: print more, hand out cash. Too good to be true; not about paper or ink.
const FixScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fix;
  const inkT = ph('paper or ink');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={1200} cy={700} />
        <Floor y={930} />
        <Printer x={1250} y={930} s={1.2} t={t} mood={t > ph('too good') ? 'smug' : 'happy'} />
        {t > ph('print more money') - 0.2 && <BillStream x0={1250 + 205 * 1.2} y0={930 - 70} t={t} t0={ph('print more money') - 0.2} n={40} gap={0.15} />}
        <Pill x={760} y={140} text="THE OBVIOUS FIX" s={span(t, ph('obvious fix'), ph('too good'))} size={60} />
        <Pill x={760} y={140} text="TOO GOOD TO BE TRUE?" s={span(t, ph('too good'), inkT)} bg={C.paper} size={56} />
        {t > inkT && <Stamp x={760} y={170} text="NOT THE INK" s={slam(t, inkT)} />}
      </Layer>
      <Sci t={t} x={520} y={930} headR={54} poses={[[0, 'think'], [ph('hand everyone'), 'cash'], [ph('too good'), 'think']]} />
    </Stage>
  );
};

// 3. Money is a ticket for real things; printing tickets bakes no bread.
const TicketScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.ticket;
  const notT = ph("money isn't wealth");
  const ticketT = ph('money is a ticket');
  const stuffT = ph('the real wealth');
  const printT = ph('printing more tickets');
  const cant = [ph("can't eat"), ph('live in it'), ph('drive it')];
  const things: Array<[string, number]> = [
    ['bread', ph('bread', ticketT)],
    ['shoes', ph('shoes')],
    ['fuel', ph('fuel')],
    ['time', ph("somebody's time")],
  ];
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Paper />
        <g transform={`translate(960 330) scale(${pop(t, t0 + 0.1)})`}>
          <Bill x={0} y={0} s={2} label={t > ticketT ? 'TICKET' : '$'} />
        </g>
        {t > notT && t < stuffT && <Stamp x={960} y={140} text="NOT WEALTH" s={slam(t, notT) * until(t, stuffT)} />}
        {/* can't eat / live in / drive a banknote */}
        {t < ticketT &&
          ['EAT IT', 'LIVE IN IT', 'DRIVE IT'].map((txt, i) => {
            const s = pop(t, cant[i] - 0.05);
            return s > 0 ? (
              <g key={txt} transform={`translate(${520 + i * 440} 760) scale(${s})`}>
                <Cross x={0} y={-90} s={0.6} />
                <Txt x={0} y={30} text={txt} size={48} anchor="middle" />
              </g>
            ) : null;
          })}
        {t > ticketT &&
          things.map(([k, at], i) => {
            const s = pop(t, at - 0.05);
            const x = 420 + i * 360;
            if (s <= 0) return null;
            return (
              <g key={k}>
                <path d={`M 960 470 Q ${(960 + x) / 2} 560 ${x} 640`} stroke={C.ink} strokeWidth={8} fill="none" strokeDasharray="18 14" opacity={t < printT ? 1 : 0} />
                <g transform={`translate(${x} 860) scale(${s}) translate(${-x} -860)`}>
                  {k === 'bread' && <Loaf x={x} y={860} s={0.95} t={t} />}
                  {k === 'shoes' && <Shoe x={x} y={860} s={0.95} />}
                  {k === 'fuel' && <FuelCan x={x} y={860} s={0.95} />}
                  {k === 'time' && <Clock x={x} y={760} s={0.8} t={t} />}
                </g>
              </g>
            );
          })}
        {t > stuffT && <Pill x={960} y={960} text="THE REAL WEALTH: STUFF" s={span(t, stuffT, printT)} bg={C.green} size={54} />}
        {t > printT && <Stack x={1700} y={1000} n={3 + 10 * prog(t, printT, printT + 1.5, (u) => u)} s={0.7} />}
        {t > printT && <Pill x={960} y={960} text="+0 LOAVES" s={pop(t, ph('single extra loaf'))} bg={C.red} fg={C.paper} size={60} />}
      </Layer>
    </Stage>
  );
};

// 4. The tiny town: 10 loaves, $100; print $100 more; the price heads to $20.
const TownScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.town;
  const loavesT = ph('ten loaves');
  const doubleT = ph('prints another hundred');
  const priceT = ph('the price climbs');
  const cash = 4 + (t > doubleT ? 4 * prog(t, doubleT, doubleT + 1.2, (u) => u) : 0);
  const up = t > ph('twenty dollars') - 0.1;
  const bounce = t > ph('still only') ? wobble(t, ph('still only'), 10, 3, 3) : 0;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Floor y={930} color="#D9B98C" />
        <Shelf x0={150} x1={1050} y={520} />
        <Shelf x0={150} x1={1050} y={760} />
        {Array.from({length: 10}).map((_, i) => {
          const s = pop(t, loavesT + i * 0.06, 0.4);
          const row = i < 5 ? 0 : 1;
          const x = 245 + (i % 5) * 178;
          const y = row ? 760 : 520;
          return s > 0 ? <Loaf key={i} x={x} y={y + (i % 2 ? bounce : -bounce)} s={0.6 * s} t={t} mood={up ? 'surprised' : 'happy'} face={i % 3 === 0} /> : null;
        })}
        <Stack x={1500} y={910} n={cash} s={0.85} />
        <Pill x={1500} y={1010} text={t > doubleT + 0.6 ? '$200 IN TOWN' : '$100 IN TOWN'} s={pop(t, ph('a hundred dollars'))} bg={CASH} size={48} />
        {t > ph('each loaf') - 0.1 && (
          <Tag x={600} y={300} text={up ? '$20 A LOAF' : '$10 A LOAF'} s={pop(t, ph('each loaf') - 0.1) * (up ? 1 + 0.12 * Math.exp(-4 * (t - ph('twenty dollars'))) : 1)} rot={-4} bg={up ? C.red : C.yellow} size={62} />
        )}
        <Pill x={1380} y={140} text="EVERYONE FEELS RICHER" s={span(t, ph('feels richer'), ph('still only'))} bg={C.green} size={44} />
        <Pill x={1380} y={140} text="STILL ONLY 10 LOAVES" s={span(t, ph('still only'), priceT)} bg={C.paper} size={44} />
        <Pill x={1380} y={140} text="NOBODY GETS MORE BREAD" s={span(t, ph('nobody can buy'))} bg={C.paper} size={44} />
      </Layer>
      <Sci t={t} x={1180} y={930} headR={46} poses={[[0, 'present'], [doubleT, 'cash'], [priceT, 'shocked'], [ph('nobody can buy'), 'facepalm']]} />
    </Stage>
  );
};

// 5. Inflation: more money, same stuff. Harvests and oil push prices too; money is the lever a government holds.
const InflationScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.inflation;
  const otherT = ph("printing isn't the only");
  const leverT = ph('the amount of money is');
  const tilt = 12 * prog(t, ph('more money chasing'), ph('more money chasing') + 0.8, easeOutBack);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Paper />
        <BigText x={960} y={170} text="INFLATION" size={120} fill={C.yellow} s={span(t, t0 + 0.1, otherT)} />
        {t < otherT && (
          <g transform={`translate(960 600) rotate(${tilt})`}>
            <line x1={-420} x2={420} y1={0} y2={0} stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
            <Stack x={-330} y={-6} n={10} s={0.8} />
            <Loaf x={330} y={-6} s={0.9} t={t} mood="worried" />
          </g>
        )}
        {t < otherT && <path d="M 900 1000 L 960 610 L 1020 1000 Z" fill={C.chromeShade} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
        {t < otherT && <Pill x={960} y={1000} text="MORE MONEY, SAME STUFF" s={pop(t, ph('more money chasing'))} bg={C.paper} size={50} />}
        {t > otherT && (
          <g>
            <g transform={`translate(420 760) scale(${pop(t, ph('bad harvest'))})`}>
              <Wheat x={0} y={0} s={1.3} wilt={prog(t, ph('bad harvest') + 0.3, ph('bad harvest') + 1.2)} />
            </g>
            <g transform={`translate(860 760) scale(${pop(t, ph('expensive oil'))})`}>
              <OilBarrel x={0} y={0} s={1.2} />
            </g>
            <Pill x={640} y={930} text="LESS STUFF" s={pop(t, ph('less stuff'))} bg={C.paper} size={50} />
            <Pill x={540} y={160} text="OTHER CAUSES" s={pop(t, otherT + 0.2)} bg={C.paper} size={50} />
            {t > leverT - 0.1 && (
              <g transform={`translate(1460 800) scale(${pop(t, leverT - 0.1)}) translate(-1460 -800)`}>
                <Printer x={1460} y={800} s={1} t={t} mood="smug" />
              </g>
            )}
            <Pill x={1360} y={160} text="MONEY: A DIRECT LEVER" s={pop(t, ph('control directly'))} size={46} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// 6. Not fair: first spender wins, wages lag, savers lose.
const FairScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fair;
  const firstT = ph('whoever gets the new money first');
  const wagesT = ph('wages often');
  const saveT = ph('anyone with savings');
  const priceU = prog(t, ph('before prices rise'), saveT + 2, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Floor y={900} color="#8CCB6B" />
        <Tag x={960} y={210} text={`BREAD: $${Math.round(10 + 10 * priceU)}`} s={pop(t, t0 + 0.2)} rot={-3} bg={priceU > 0.5 ? C.red : C.yellow} size={60} />
        {t > firstT - 0.1 && <Wallet x={360} y={900} s={1.1} t={t} color={C.teal} mood="smug" cash={1} />}
        <Pill x={360} y={980} text="GETS IT FIRST" s={pop(t, firstT)} bg={C.green} size={40} />
        {t > wagesT - 0.1 && <Wallet x={960} y={900} s={1.1} t={t} color="#8E7CC3" mood="worried" />}
        <Pill x={960} y={980} text="WAGES: LATER" s={pop(t, wagesT)} bg={C.paper} size={40} />
        {t > saveT - 0.1 && <Piggy x={1560} y={900} s={1.1} t={t} shrink={prog(t, ph('worth less') - 0.3, ph('worth less') + 0.6)} />}
        <Pill x={1560} y={980} text="SAVINGS SHRINK" s={pop(t, ph('worth less'))} bg={C.red} fg={C.paper} size={40} />
        <Pill x={960} y={360} text="NOT EVEN FAIR" s={pop(t, ph('even fair'))} bg={C.paper} size={50} />
      </Layer>
    </Stage>
  );
};

// 7. Hyperinflation: more than 50% a month.
const HyperScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hyper;
  const g = prog(t, t0 + 0.2, ph('single month') + 0.6, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={1000} />
        <Chart x={420} y={930} w={1080} h={640} g={g} k={5.2} />
        <BigText x={960} y={190} text="HYPERINFLATION" size={110} fill={C.yellow} s={pop(t, ph('hyperinflation'))} />
        <Pill x={760} y={420} text="PRICES UP 50%+ IN ONE MONTH" s={pop(t, ph('fifty percent'))} bg={C.paper} size={48} />
        <Pill x={1300} y={620} text="IT HAS HAPPENED" s={pop(t, ph('more than once'))} bg={C.red} fg={C.paper} size={48} />
      </Layer>
    </Stage>
  );
};

// 8. Germany 1923: reparations, the Ruhr occupied, passive resistance paid with printed money.
const RuhrScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.ruhr;
  const stopT = ph('stopped working');
  const printT = ph('by printing money', t0);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#9DC8E6" />
        <Floor y={880} color="#9BAF7C" />
        <Calendar x={260} y={330} s={0.7} label="1923" flip={0} />
        <Factory x={820} y={880} s={1.2} t={t} on={t < stopT} />
        <Pill x={960} y={140} text="GERMANY" s={pop(t, ph('germany 1923'))} size={58} />
        <Pill x={1360} y={300} text="WAR REPARATIONS" s={span(t, ph('reparation'), ph('in early 1923'))} bg={C.paper} size={48} />
        <Pill x={1360} y={300} text="THE RUHR OCCUPIED" s={span(t, ph('occupied the ruhr'), stopT)} bg={C.red} fg={C.paper} size={48} />
        <Pill x={820} y={980} text="INDUSTRIAL HEART" s={span(t, ph('industrial heart'), stopT)} bg={C.paper} size={44} />
        <Pill x={1360} y={300} text="WORKERS STOP IN PROTEST" s={span(t, stopT, printT)} bg={C.paper} size={44} />
        {t > printT - 0.2 && (
          <g>
            <Printer x={1500} y={880} s={0.9} t={t} />
            <BillStream x0={1500 + 205 * 0.9} y0={880 - 60} t={t} t0={printT - 0.2} n={20} gap={0.15} dir={-1} />
          </g>
        )}
        <Pill x={1360} y={300} text="PAID FOR BY PRINTING" s={pop(t, printT)} size={48} />
      </Layer>
    </Stage>
  );
};

// 9. Berlin bread: 160 marks -> about 200 billion; savings worthless.
const BreadScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.bread;
  const lateT = ph('by late 1923');
  const bigT = ph('two hundred billion', t0);
  const saveT = ph("people's savings");
  const flip = t > lateT && t < lateT + 0.25 ? (t - lateT) / 0.25 : 0;
  const big = t > bigT - 0.05;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Paper />
        <Calendar x={330} y={430} s={0.85} label={t >= lateT ? '1923' : '1922'} prev="1922" flip={flip} />
        <Pill x={330} y={150} text="BERLIN" s={pop(t, ph('berlin'))} bg={C.paper} size={54} />
        <Loaf x={1000} y={760} s={1.8} t={t} mood={big ? 'scared' : 'happy'} />
        {!big && t > ph('a hundred and sixty') - 0.1 && <Tag x={1000} y={900} text="160 MARKS" s={pop(t, ph('a hundred and sixty') - 0.1)} size={64} />}
        {big && t < saveT && <Tag x={1000} y={900} text="200,000,000,000 MARKS" s={pop(t, bigT - 0.05) * (1 + 0.12 * Math.exp(-3 * (t - bigT)))} bg={C.red} size={60} />}
        {t > saveT - 0.1 && (
          <g>
            <Piggy x={1600} y={1000} s={1.0} t={t} shrink={prog(t, saveT, saveT + 1.5)} crack={t > ph('worthless') - 0.1} />
            <Pill x={1000} y={960} text="SAVINGS: WORTHLESS" s={pop(t, ph('worthless'))} bg={C.red} fg={C.paper} size={54} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// 10. November 1923: the Rentenmark, 1 = 1,000,000,000,000 old marks.
const RentenScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.renten;
  const eqT = ph('one new rentenmark');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={560} />
        <Calendar x={300} y={360} s={0.7} label="NOV" flip={0} />
        <Pill x={960} y={140} text="NEW CURRENCY: THE RENTENMARK" s={pop(t, ph('new currency'))} size={52} />
        <g transform={`translate(560 620) scale(${pop(t, eqT)})`}>
          <Bill x={0} y={0} s={1.5} label="1" />
        </g>
        <Txt x={960} y={650} text="=" size={150} anchor="middle" />
        {t > eqT + 0.4 &&
          Array.from({length: 9}).map((_, i) => {
            const s = pop(t, eqT + 0.5 + i * 0.07, 0.35);
            return s > 0 ? <Bill key={i} x={1320 + (i % 3) * 120} y={500 + Math.floor(i / 3) * 110} s={0.55 * s} rot={(i % 2 ? 6 : -6)} /> : null;
          })}
        <Pill x={1290} y={880} text="1,000,000,000,000 OLD MARKS" s={pop(t, ph('one trillion old'))} bg={C.paper} size={42} />
      </Layer>
    </Stage>
  );
};

// 11. Zimbabwe: farms seized, output collapsed, printing to pay the bills.
const FarmsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.farms;
  const seizeT = ph('seized large');
  const collapseT = ph('farm output collapsed');
  const wilt = prog(t, collapseT - 0.3, collapseT + 1.2);
  const printT = ph('kept printing');
  const fewT = ph('fewer goods');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Floor y={860} color={wilt > 0.5 ? '#C9B27C' : '#8CCB6B'} />
        {Array.from({length: 7}).map((_, i) => (
          <Wheat key={i} x={180 + i * 150} y={880} s={0.9} wilt={wilt} />
        ))}
        <Pill x={960} y={140} text={t > ph('zimbabwe') ? 'ZIMBABWE' : 'LESSON LEARNED?'} s={pop(t, t0 + 0.2)} size={58} />
        <Pill x={620} y={300} text="FARMS SEIZED FROM 2000" s={span(t, seizeT, printT)} bg={C.paper} size={48} />
        <Pill x={620} y={420} text="OUTPUT COLLAPSED" s={span(t, collapseT, printT)} bg={C.red} fg={C.paper} size={48} />
        {t > printT - 0.2 && <Printer x={1500} y={860} s={1} t={t} />}
        {t > printT - 0.2 && <BillStream x0={1500 + 205} y0={800} t={t} t0={printT - 0.2} n={30} gap={0.15} dir={-1} />}
        <Pill x={620} y={300} text="FEWER GOODS" s={pop(t, fewT)} bg={C.paper} size={52} />
        <Pill x={620} y={420} text="MORE MONEY" s={pop(t, ph('more money', fewT))} bg={CASH} size={52} />
      </Layer>
    </Stage>
  );
};

// 12. June 2007: prices ordered cut in half; arrests; empty shelves.
const FreezeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.freeze;
  const cutT = ph('cut their prices');
  const arrestT = ph('police arrested');
  const emptyT = ph('within days');
  const gone = prog(t, emptyT, emptyT + 2.5, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Floor y={930} color="#D9B98C" />
        <Shelf x0={150} x1={1150} y={520} />
        <Shelf x0={150} x1={1150} y={780} />
        {Array.from({length: 10}).map((_, i) => {
          const order = (i * 7) % 10;
          if (gone * 10 > order + 0.5) return null;
          const x = 250 + (i % 5) * 200;
          const y = i < 5 ? 520 : 780;
          return <Loaf key={i} x={x} y={y} s={0.6} t={t} face={i % 4 === 0} mood="worried" />;
        })}
        <Pill x={960} y={140} text="JUNE 2007: THE NEXT OBVIOUS FIX" s={span(t, ph('june 2007'), emptyT)} size={50} />
        {t > cutT - 0.1 && t < emptyT + 4 && <Tag x={1550} y={330} text="PRICES -50%" s={pop(t, cutT - 0.1)} rot={-5} bg={C.red} size={60} />}
        <Pill x={1450} y={560} text="THOUSANDS ARRESTED" s={span(t, arrestT, ph('selling at those'))} bg={C.paper} size={42} />
        <Pill x={960} y={140} text="EMPTY SHELVES" s={span(t, emptyT + 0.5)} bg={C.red} fg={C.paper} size={56} />
        <Pill x={1450} y={560} text="SELLING AT A LOSS" s={span(t, ph('selling at those'), ph('a low price'))} bg={C.paper} size={42} />
        {t > ph('a low price') - 0.1 && <Stamp x={1550} y={330} text="NOBODY FED" s={slam(t, ph('a low price') - 0.1)} size={60} />}
      </Layer>
      <Sci t={t} x={1450} y={930} headR={44} poses={[[0, 'think'], [emptyT, 'shocked'], [ph('a low price'), 'facepalm']]} />
    </Stage>
  );
};

// 13. November 2008: prices doubling about every 25 hours.
const DoublingScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.doubling;
  const dblT = ph('doubling about');
  const k = t > dblT ? Math.min(7, Math.floor((t - dblT) / 0.55) + 1) : 0;
  const val = Math.pow(2, k);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={700} />
        <Printer x={360} y={900} s={0.9} t={t} />
        <Pill x={960} y={140} text="ZIMBABWE, NOVEMBER 2008" s={pop(t, ph('in november 2008'))} size={54} />
        <Loaf x={1000} y={780} s={1.5} t={t} mood={k > 2 ? 'scared' : 'worried'} />
        {t > dblT - 0.1 && <Tag x={1000} y={870} text={`$${val}`} s={pop(t, dblT - 0.1) * (1 + 0.12 * Math.exp(-6 * ((t - dblT) % 0.55)))} bg={C.red} size={70} />}
        <Clock x={1560} y={560} s={1.1} t={t} speed={t > dblT ? 6 : 1} />
        <Pill x={960} y={1020} text="x2 ABOUT EVERY 25 HOURS" s={pop(t, ph('twenty-five hours'))} bg={C.paper} size={44} />
        <Pill x={960} y={300} text="ECONOMISTS' ESTIMATE" s={pop(t, ph('economists estimate'))} bg={C.paper} size={40} />
      </Layer>
    </Stage>
  );
};

// 14. January 2009: the 100 trillion dollar note; months later the currency is dropped.
const NoteScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.note;
  const dropT = ph('gave up');
  const away = 1 - prog(t, dropT, dropT + 0.8);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={560} />
        <Pill x={960} y={140} text="JANUARY 2009" s={pop(t, t0 + 0.2)} size={56} />
        <g transform={`translate(${lerp(960, 600, 1 - away)} 560) scale(${pop(t, ph('one hundred trillion') - 0.2, 0.5) * lerp(1, 0.6, 1 - away)}) rotate(-5)`} opacity={lerp(1, 0.5, 1 - away)}>
          <Bill x={0} y={0} s={3.4} label="" />
          <text x={0} y={-40} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={74} fill={C.paper} stroke={C.ink} strokeWidth={14} paintOrder="stroke fill">100 TRILLION</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={60} fill={C.paper} stroke={C.ink} strokeWidth={12} paintOrder="stroke fill">DOLLARS</text>
        </g>
        {t > dropT && <Stamp x={600} y={560} text="GIVEN UP" s={slam(t, dropT + 0.6)} />}
        {t > ph('us dollars') - 0.1 && (
          <g>
            <Bill x={1350} y={520} s={1.1 * pop(t, ph('us dollars') - 0.1)} rot={-6} label="US$" />
            <Bill x={1500} y={680} s={1.0 * pop(t, ph('other foreign') - 0.1)} rot={8} label="$" />
            <Pill x={1260} y={880} text="US DOLLARS + OTHER FOREIGN MONEY" s={pop(t, ph('other foreign'))} bg={C.paper} size={38} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// 15. The record: Hungary 1946, prices doubling about every 15 hours.
const HungaryScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.hungary;
  const recT = ph('that belongs to');
  const hrsT = ph('fifteen hours');
  const bar = (x: number, h: number, color: string, label: string, val: string, at: number) => {
    const g = prog(t, at, at + 0.8, easeOutCubic);
    return (
      <g key={label}>
        <rect x={x - 130} y={900 - h * g} width={260} height={h * g} rx={14} fill={color} stroke={C.ink} strokeWidth={INK_W} />
        <Pill x={x} y={970} text={label} s={pop(t, at)} bg={C.paper} size={42} />
        {g > 0.95 && <Txt x={x} y={900 - h - 30} text={val} size={52} anchor="middle" />}
      </g>
    );
  };
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Paper />
        <line x1={300} x2={1620} y1={900} y2={900} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        {bar(620, 330, CASH, 'ZIMBABWE 2008', '~25 H', t0 + 0.3)}
        {bar(1300, 500, C.red, 'HUNGARY 1946', '~15 H', recT)}
        <Pill x={960} y={140} text="WORLD RECORD: FASTEST DOUBLING" s={pop(t, recT)} size={52} />
        <Pill x={960} y={260} text="PRICES DOUBLED ABOUT EVERY 15 HOURS" s={pop(t, hrsT)} bg={C.paper} size={44} />
        <Clock x={1680} y={480} s={0.7} t={t} speed={8} />
      </Layer>
    </Stage>
  );
};

// 16. The pattern: stuff shrank or stalled, money exploded.
const PatternScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.pattern;
  const stuff = 0.45 - 0.15 * prog(t, ph('shrank'), ph('shrank') + 0.8);
  const money = 0.3 + 0.55 * prog(t, ph('money exploded') - 0.2, ph('money exploded') + 0.6, easeOutBack);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Paper />
        <line x1={420} x2={1500} y1={900} y2={900} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <rect x={560} y={900 - 700 * stuff} width={260} height={700 * stuff} rx={14} fill={CRUST} stroke={C.ink} strokeWidth={INK_W} />
        <rect x={1100} y={900 - 700 * money} width={260} height={700 * money} rx={14} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
        <Pill x={690} y={970} text="REAL STUFF" s={pop(t, ph('real stuff'))} bg={CRUST} size={44} />
        <Pill x={1230} y={970} text="MONEY" s={pop(t, ph('amount of money', t0))} bg={CASH} size={44} />
        <Pill x={960} y={120} text="THE SAME PATTERN" s={pop(t, ph('same pattern'))} size={56} />
      </Layer>
    </Stage>
  );
};

// 17. Printing has a job: money grows with the economy; falling prices have costs too.
const JobScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.job;
  const growT = ph('when an economy grows');
  const fallT = ph('prices would slowly fall');
  const g = prog(t, growT, growT + 2.5);
  const neverT = ph('if the amount of money never');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Floor y={900} color="#8CCB6B" />
        <Pill x={960} y={120} text="NOT QUITE" s={span(t, ph('not quite'), growT)} bg={C.paper} size={56} />
        <Pill x={960} y={120} text="THE ECONOMY GROWS" s={span(t, growT, fallT)} bg={C.green} size={54} />
        {Array.from({length: 6}).map((_, i) => {
          const s = clamp(g * 6 - i);
          return s > 0 ? <Loaf key={i} x={260 + i * 150} y={900} s={0.55 * pop(t, growT + i * 0.4)} t={t} face={i === 0} /> : null;
        })}
        <Stack x={1500} y={890} n={t > neverT ? 4 : 2 + 4 * g} s={0.8} />
        {t > fallT - 0.2 && (
          <g>
            <Arrow x1={1220} y1={300} x2={1220} y2={520} color={C.sea} w={26} head={56} />
            <Pill x={1220} y={220} text="PRICES WOULD FALL" s={pop(t, fallT)} bg={C.paper} size={44} />
          </g>
        )}
        <Pill x={620} y={380} text="PEOPLE WAIT TO BUY" s={pop(t, ph('delay spending'))} bg={C.paper} size={44} />
        <Pill x={620} y={500} text="DEBTS GET HEAVIER" s={pop(t, ph('debts harder'))} bg={C.red} fg={C.paper} size={44} />
      </Layer>
      <Sci t={t} x={1180} y={900} headR={44} poses={[[0, 'think'], [growT, 'present'], [fallT, 'point']]} />
    </Stage>
  );
};

// 18. Central banks aim for about 2% a year; trouble when money outgrows stuff.
const TargetScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.target;
  const fedT = ph('federal reserve');
  const troubleT = ph('the trouble starts');
  const g = prog(t, ph('two percent') - 0.2, ph('predictably') + 0.4, (u) => u);
  const g2 = prog(t, troubleT, troubleT + 2, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={1100} />
        <Chart x={360} y={900} w={1200} h={560} g={Math.max(g, 0.001)} k={0.0001} color={C.green} label="YEARS" />
        {t > troubleT && <Chart x={360} y={900} w={1200} h={560} g={g2} k={5} color={C.red} label="" />}
        <Pill x={960} y={120} text="ADD MONEY CAREFULLY" s={span(t, t0 + 0.2, fedT)} bg={C.paper} size={54} />
        <Pill x={960} y={120} text="US FED TARGET: ABOUT 2% A YEAR" s={span(t, fedT, troubleT)} bg={C.green} size={50} />
        <Pill x={960} y={120} text="TROUBLE: MONEY OUTRUNS STUFF" s={span(t, troubleT)} bg={C.red} fg={C.paper} size={50} />
        {t < troubleT && <Pill x={1300} y={560} text="SLOW AND PREDICTABLE" s={pop(t, ph('slowly and predictably'))} bg={C.paper} size={44} />}
      </Layer>
    </Stage>
  );
};

// 19. Recap.
const RecapScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.recap;
  const items: Array<[string, string]> = [
    ['MONEY IS A TICKET, NOT TREASURE', 'a ticket not'],
    ['MORE TICKETS, EACH BUYS LESS', 'each ticket buys'],
    ['TOO FAR: 200 BILLION FOR BREAD', 'push it too far'],
  ];
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={1550} cy={700} />
        <BigText x={620} y={200} text="WHY NOT?" size={110} fill={C.yellow} s={pop(t, t0 + 0.2)} />
        {items.map(([txt, w], i) => {
          const s = pop(t, ph(w, t0) - 0.05);
          return (
            <g key={i} transform={`translate(160 ${380 + i * 170}) scale(${s})`}>
              <Cross x={0} y={0} s={0.4} />
              <Txt x={60} y={18} text={txt} size={50} />
            </g>
          );
        })}
        <Loaf x={1620} y={820} s={1.3} t={t} mood="smug" />
      </Layer>
    </Stage>
  );
};

// 20. Final line.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const costT = ph('makes bread cost');
  const tagS = t > costT ? 1 + 0.6 * prog(t, costT, costT + 0.9, easeOutBack) : 1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Burst t={t} cx={960} cy={700} />
        <Stack x={960} y={980} n={9} s={1.1} />
        <Loaf x={960} y={980 - 30 - 9 * 22 * 1.1} s={1.2} t={t} mood={t > costT ? 'smug' : 'happy'} />
        {t > ph('more bread', t0) && <Tag x={960} y={230} text="$$$$" s={pop(t, ph('more bread', t0)) * tagS} rot={-6} bg={C.red} size={80} />}
      </Layer>
      <Sci t={t} x={460} y={1000} headR={50} poses={[[0, 'point'], [costT - 0.05, 'facepalm']]} />
    </Stage>
  );
};

const EndScene: React.FC<{t: number}> = ({t}) => <EndCard t={t} t0={S.endcard} />;

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.intro, IntroScene],
  [S.fix, FixScene],
  [S.ticket, TicketScene],
  [S.town, TownScene],
  [S.inflation, InflationScene],
  [S.fair, FairScene],
  [S.hyper, HyperScene],
  [S.ruhr, RuhrScene],
  [S.bread, BreadScene],
  [S.renten, RentenScene],
  [S.farms, FarmsScene],
  [S.freeze, FreezeScene],
  [S.doubling, DoublingScene],
  [S.note, NoteScene],
  [S.hungary, HungaryScene],
  [S.pattern, PatternScene],
  [S.job, JobScene],
  [S.target, TargetScene],
  [S.recap, RecapScene],
  [S.final, FinalScene],
  [S.endcard, EndScene],
];

type Cue = {f: string; at: number; db: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const SFX: Cue[] = [
  ...Object.entries(S).filter(([k]) => k !== 'intro').map(([, v]) => ({f: I('whoosh'), at: v - 0.05, db: -26})),
  ...[ph('bills to pay'), ph('workers to pay'), ph('debts to pay'), ph('a printing press'), ph('obvious fix'), ph('bread', ph('money is a ticket')), ph('shoes'), ph('fuel'), ph("somebody's time"),
    ph('single extra loaf'), ph('ten loaves'), ph('feels richer'), ph('still only'), ph('nobody can buy'), ph('more money chasing'), ph('bad harvest'), ph('expensive oil'), ph('control directly'),
    ph('whoever gets the new money first'), ph('wages often'), ph('worth less'), ph('fifty percent'), ph('germany 1923'), ph('reparation'), ph('occupied the ruhr'), ph('berlin'),
    ph('a hundred and sixty'), ph('new currency'), ph('one trillion old'), ph('zimbabwe'), ph('seized large'), ph('fewer goods'), ph('june 2007'), ph('police arrested'),
    ph('in november 2008'), ph('twenty-five hours'), ph('us dollars'), ph('that belongs to'), ph('fifteen hours'), ph('same pattern'), ph('not quite'), ph('when an economy grows'),
    ph('delay spending'), ph('debts harder'), ph('federal reserve'), ph('a ticket not'), ph('each ticket buys'), ph('push it too far')].map((at) => ({f: I('pop'), at: at - 0.03, db: -22})),
  ...[ph('paper or ink'), ph("money isn't wealth"), ph('twenty dollars'), ph('two hundred billion'), ph('worthless'), ph('farm output collapsed'), ph('a low price'), ph('gave up'), ph('money exploded'), ph('the trouble starts')].map((at) => ({f: I('stamp'), at, db: -12})),
  {f: U('printer'), at: ph('a printing press') - 0.1, db: -22},
  {f: U('printer'), at: ph('print more money') - 0.2, db: -20},
  {f: U('printer'), at: ph('by printing money') - 0.2, db: -22},
  {f: U('printer'), at: ph('kept printing') - 0.2, db: -22},
  {f: U('rocket'), at: S.hyper + 0.3, db: -20},
  {f: I('pages'), at: ph('by late 1923'), db: -18},
  {f: I('crack'), at: ph('worthless') - 0.1, db: -16},
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({f: I('pop'), at: ph('doubling about') + i * 0.55, db: -21})),
  {f: U('fail'), at: ph('makes bread cost'), db: -18},
  {f: I('pop'), at: S.endcard + 0.05, db: -18},
];

export const MoneyLong: React.FC = () => {
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
        <Audio src={staticFile('moneylong/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
