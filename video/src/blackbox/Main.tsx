import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci} from '../iceberg/Sci';
import {BigText, C, FONT_DISPLAY, Face, INK_W, Pill, Puffs, Sky, Sunburst} from '../iceberg/art';
import {clamp, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, wobble} from '../iceberg/anim';
import {Arrow, Stamp} from '../sun/space';
import {BigSci} from '../thumb/SunThumbs';
import {LayoutProbe} from '../iceberglong/kit';

// "Why don't we just build the whole plane out of the black box?" - Short, 1080x1920 (rendered 4K with --scale=2).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const ORANGE = '#FF7A1A';
const ORANGE_D = '#D85E0C';
const STEEL = '#AEB8C1';
const INSUL = '#F4E8C1';
const CHIP = '#3FA35B';

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

// The flight recorder (centre x, y), ~300 x 220 at s = 1. `black` paints it the "expected" black.
export const BlackBox: React.FC<{x: number; y: number; s?: number; t: number; mood?: React.ComponentProps<typeof Face>['mood']; black?: number; rot?: number; face?: boolean}> = ({
  x,
  y,
  s = 1,
  t,
  mood = 'smug',
  black = 0,
  rot = 0,
  face = true,
}) => {
  const body = black > 0.5 ? '#2B2B2E' : ORANGE;
  const dark = black > 0.5 ? '#141414' : ORANGE_D;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M -70 -110 L -70 -150 L 70 -150 L 70 -110" fill="none" stroke={C.ink} strokeWidth={16} strokeLinejoin="round" />
      <path d="M -70 -110 L -70 -150 L 70 -150 L 70 -110" fill="none" stroke={STEEL} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-150 + 10} y={-110 + 10} width={300} height={220} rx={26} fill={C.ink} />
      <rect x={-150} y={-110} width={300} height={220} rx={26} fill={body} stroke={C.ink} strokeWidth={INK_W} />
      <rect x={-150} y={60} width={300} height={50} rx={20} fill={dark} />
      <rect x={-150} y={-110} width={300} height={220} rx={26} fill="none" stroke={C.ink} strokeWidth={INK_W} />
      {/* reflective tape stripes */}
      {[-110, -60].map((sx) => (
        <path key={sx} d={`M ${sx} -110 L ${sx + 30} -110 L ${sx - 10} 60 L ${sx - 40} 60 Z`} fill={C.paper} opacity={black > 0.5 ? 0.25 : 0.85} />
      ))}
      {face && <Face x={40} y={-10} s={0.62} mood={mood} open={blink(t, 3.2)} gap={44} />}
    </g>
  );
};

// Airliner, side view, nose to the right (centre x, y), ~760 wide at s = 1. `armor` 0..1 thickens and darkens it.
const Plane: React.FC<{x: number; y: number; s?: number; t: number; armor?: number; rot?: number; mood?: React.ComponentProps<typeof Face>['mood']; color?: string}> = ({
  x,
  y,
  s = 1,
  t,
  armor = 0,
  rot = 0,
  mood = 'happy',
  color,
}) => {
  const skin = color ?? (armor > 0.05 ? `rgb(${Math.round(lerp(255, 120, armor))},${Math.round(lerp(248, 130, armor))},${Math.round(lerp(231, 140, armor))})` : C.paper);
  const k = 1 + 0.25 * armor;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s} ${s * k})`}>
      <path d="M -330 -10 L -380 -170 L -300 -170 L -230 -50 Z" fill={C.teal} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <path d="M -360 -10 C -360 -60 -300 -80 -220 -80 L 260 -80 C 340 -80 390 -40 390 0 C 390 40 340 70 260 70 L -220 70 C -300 70 -360 40 -360 -10 Z" fill={skin} stroke={C.ink} strokeWidth={INK_W + 6 * armor} strokeLinejoin="round" />
      {Array.from({length: 9}).map((_, i) => (
        <circle key={i} cx={-200 + i * 50} cy={-30} r={12} fill={C.sky} stroke={C.ink} strokeWidth={4} />
      ))}
      <path d="M 300 -60 Q 340 -60 360 -30 L 300 -30 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} />
      <path d="M -40 20 L -170 140 L -100 140 L 80 20 Z" fill={skin} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <rect x={-90} y={70} width={100} height={46} rx={23} fill={C.chromeShade} stroke={C.ink} strokeWidth={6} />
      <Face x={250} y={10} s={0.5} mood={mood} open={blink(t, 3.6)} gap={40} />
    </g>
  );
};

const Flames: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-1, 0, 1].map((i) => {
      const h = 170 + 40 * Math.sin(t * 9 + i * 2);
      return (
        <path
          key={i}
          d={`M ${-70 + i * 70} 0 Q ${-100 + i * 70} ${-h * 0.6} ${-40 + i * 70 + 14 * Math.sin(t * 7 + i)} ${-h} Q ${-10 + i * 70} ${-h * 0.5} ${-10 + i * 70} 0 Z`}
          fill={i === 0 ? C.gold : C.red}
          stroke={C.ink}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      );
    })}
  </g>
);

// Heavy weight block (bottom centre x, y).
const Weight: React.FC<{x: number; y: number; s?: number; label?: string}> = ({x, y, s = 1, label = '2+ T'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -150 0 L -120 -200 L 120 -200 L 150 0 Z" fill="#5B6670" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <rect x={-40} y={-250} width={80} height={56} rx={14} fill="none" stroke={C.ink} strokeWidth={14} />
    <text x={0} y={-70} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={70} fill={C.paper}>
      {label}
    </text>
  </g>
);

// Plane debris piece.
const Debris: React.FC<{x: number; y: number; s?: number; rot?: number; kind: number}> = ({x, y, s = 1, rot = 0, kind}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {kind === 0 && <path d="M -120 0 L -100 -70 L 60 -90 L 110 -20 L 80 10 Z" fill={C.paper} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
    {kind === 1 && <path d="M -60 0 L -90 -140 L -20 -140 L 40 0 Z" fill={C.teal} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
    {kind === 2 && <path d="M -140 0 L -40 -60 L 140 -40 L 120 0 Z" fill={C.chrome} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  crash: ph('investigators') - 0.05,
  whole: ph('so why') - 0.05,
  orange: ph('first the black') - 0.05,
  inside: ph("and it isn't made") - 0.05,
  tests: ph('that armor is') - 0.05,
  heavy: ph('now scale') - 0.05,
  human: ph('and even if') - 0.05,
  final: ph("the black box doesn't") - 0.05,
  end: VO_END + 0.3,
};

// Frame 0 = MrBeast-style cover (grid-safe: key content inside rows 240-1680). Also the Still "BlackBoxCover".
export const BlackBoxCover: React.FC<{t?: number}> = ({t = 0}) => (
  <AbsoluteFill style={{backgroundColor: C.sky}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <rect width={W} height={H} fill={C.sky} />
      {Array.from({length: 18}).map((_, i) => {
        const a0 = (i / 18) * Math.PI * 2;
        const a1 = a0 + Math.PI / 18;
        const R = 3000;
        const cx = 690;
        const cy = 1200;
        return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={C.skyL} />;
      })}
      <BlackBox x={720} y={1260} s={1.35} t={t} mood="smug" rot={-6} />
      <g transform="rotate(-6 720 1260)">
        <ellipse cx={720} cy={1250} rx={300} ry={230} fill="none" stroke={C.ink} strokeWidth={22} />
        <ellipse cx={720} cy={1250} rx={300} ry={230} fill="none" stroke={C.red} strokeWidth={12} />
      </g>
    </svg>
    <BigSci pose="dizzy" x={215} y={1215} headR={108} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <g transform="rotate(-4 540 640)">
        <BigText x={540} y={560} text="SURVIVES" size={124} />
        <BigText x={540} y={770} text="3,400 G?!" size={180} fill={C.yellow} />
      </g>
      <Arrow x1={900} y1={830} x2={850} y2={960} color={C.red} w={26} head={56} />
    </svg>
    <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 290, width: 420}} />
  </AbsoluteFill>
);
const CoverScene: React.FC<{t: number}> = ({t}) => <BlackBoxCover t={t} />;

// After a crash, investigators search the wreckage for the black box.
const CrashScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.crash;
  const found = ph('the black box', t0);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky color="#9DB7C9" />
        <rect x={-200} y={1150} width={1480} height={900} fill="#B9A27A" />
        <line x1={-200} x2={1280} y1={1150} y2={1150} stroke={C.ink} strokeWidth={INK_W} />
        <Debris x={220} y={1160} s={1.1} rot={-8} kind={0} />
        <Debris x={760} y={1160} s={1.0} rot={10} kind={1} />
        <Debris x={940} y={1180} s={0.9} rot={-4} kind={2} />
        <Puffs x={200} y={1050} t={t} color="#8E8E96" n={6} rise={420} />
        <Puffs x={760} y={1020} t={t + 0.4} color="#8E8E96" n={5} rise={360} />
        {t > found - 0.3 && (
          <g>
            <circle cx={540} cy={1060} r={210 * pop(t, found - 0.3)} fill={C.yellow} opacity={0.35} />
            <BlackBox x={540} y={1060} s={0.8 * pop(t, found - 0.3)} t={t} mood="smug" black={1} />
          </g>
        )}
        <Pill x={540} y={330} text="THE BLACK BOX" s={span(t, found, ph('survive almost'))} size={64} />
        <Pill x={540} y={330} text="SURVIVES ALMOST ANYTHING" s={span(t, ph('survive almost'))} bg={C.paper} size={46} />
      </Layer>
    </Stage>
  );
};

// So why not build the whole plane out of it? (a plane made of black boxes)
const WholeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.whole;
  const build = prog(t, ph('build the whole') - 0.2, ph('out of it') + 0.4, (u) => u);
  const tiles = Array.from({length: 18}).map((_, i) => ({x: 180 + (i % 6) * 145, y: 700 + Math.floor(i / 6) * 105}));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={820} />
        <Plane x={540} y={820} s={1.15} t={t} mood={build > 0.6 ? 'surprised' : 'happy'} color={build > 0.95 ? ORANGE : undefined} />
        {tiles.map((p, i) => {
          const s = clamp(build * 18 - i);
          return s > 0 && build < 0.95 ? <rect key={i} x={p.x - 60 * s} y={p.y - 42 * s} width={120 * s} height={84 * s} rx={10} fill={ORANGE} stroke={C.ink} strokeWidth={5} /> : null;
        })}
        <Pill x={540} y={330} text="BUILD IT ALL FROM THAT?" s={pop(t, ph('build the whole'))} size={56} />
      </Layer>
      <Sci t={t} x={230} y={1330} headR={46} poses={[[0, 'think'], [ph('out of it') - 0.1, 'point']]} />
    </Stage>
  );
};

// It isn't black: bright orange, easy to spot.
const OrangeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.orange;
  const flipT = ph('bright orange') - 0.1;
  const sq = t > flipT && t < flipT + 0.2 ? 1 - Math.sin(((t - flipT) / 0.2) * Math.PI) * 0.4 : 1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={860} />
        <g transform={`translate(540 860) scale(${sq} 1) translate(-540 -860)`}>
          <BlackBox x={540} y={860} s={1.9} t={t} mood={t > flipT + 0.1 ? 'happy' : 'neutral'} black={t < flipT + 0.1 ? 1 : 0} />
        </g>
        {t > ph("isn't black") && t < flipT && <Stamp x={540} y={420} text="NOT BLACK" s={slam(t, ph("isn't black"))} />}
        <Pill x={540} y={420} text="BRIGHT ORANGE" s={pop(t, flipT + 0.1)} bg={ORANGE} size={64} />
        <Pill x={540} y={1300} text="EASY TO SPOT" s={pop(t, ph('spot it'))} bg={C.paper} size={54} />
      </Layer>
    </Stage>
  );
};

// No magic material: a few chips, insulation, a titanium or steel shell, about 2 kg.
const InsideScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.inside;
  const chipsT = ph('memory chips');
  const insT = ph('insulation');
  const shellT = ph('titanium');
  const kgT = ph('two kilograms');
  const cx = 540;
  const cy = 820;
  const layer = (w: number, h: number, fill: string, s: number) =>
    s > 0 ? <rect x={cx - (w / 2) * s} y={cy - (h / 2) * s} width={w * s} height={h * s} rx={30 * s} fill={fill} stroke={C.ink} strokeWidth={INK_W} /> : null;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={C.paper} />
        {t < chipsT - 0.3 && <Stamp x={540} y={820} text="NO MAGIC MATERIAL" s={slam(t, ph('magic material'))} size={60} />}
        {layer(760, 620, STEEL, pop(t, shellT - 0.2))}
        {layer(600, 470, INSUL, pop(t, insT - 0.2))}
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
        <Pill x={540} y={330} text="A FEW MEMORY CHIPS" s={span(t, chipsT, insT)} bg={CHIP} fg={C.paper} size={52} />
        <Pill x={540} y={330} text="THICK INSULATION" s={span(t, insT, shellT)} bg={INSUL} size={52} />
        <Pill x={540} y={330} text="TITANIUM OR STEEL SHELL" s={span(t, shellT, kgT)} bg={STEEL} size={50} />
        <Pill x={540} y={330} text="ABOUT 2 KG OF ARMOR" s={span(t, kgT)} bg={C.yellow} size={54} />
        <Pill x={540} y={1250} text="FOR A HANDFUL OF CHIPS" s={pop(t, ph('handful'))} bg={C.paper} size={48} />
      </Layer>
    </Stage>
  );
};

// The tests: 3,400 g impact, 1,100 °C fire for an hour, crushed under 2+ tonnes.
const TestsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.tests;
  const impT = ph('an impact');
  const fireT = ph('a fire');
  const crushT = ph('crushed');
  const phase = t < fireT - 0.1 ? 0 : t < crushT - 0.1 ? 1 : 2;
  const hit = impT + 0.9;
  const slamY = phase === 0 ? lerp(-300, 760, clamp((t - impT) / 0.9) ** 2) : 760;
  const sh = t > hit && t < hit + 0.4 ? shake(t, 14 * (1 - (t - hit) / 0.4)) : {x: 0, y: 0};
  const press = phase === 2 ? clamp((t - crushT) / 0.6) : 0;
  return (
    <Stage cam={{x: 540 - sh.x, y: 960 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={phase === 1 ? '#3A2A2A' : C.paper} />
        <rect x={-200} y={1150} width={1480} height={900} fill="#C9CED3" />
        <line x1={-200} x2={1280} y1={1150} y2={1150} stroke={C.ink} strokeWidth={INK_W} />
        {phase === 0 && <BlackBox x={540} y={Math.min(slamY + 250, 1040)} s={1.2} t={t} mood={t > hit ? 'smug' : 'surprised'} rot={t > hit ? wobble(t, hit, 6, 3, 4) : 0} />}
        {phase === 0 && t > hit && t < hit + 1.2 && <Puffs x={540} y={1150} t={(t - hit) * 2} color="#E9EEF2" n={6} rise={140} />}
        {phase === 1 && (
          <g>
            <BlackBox x={540} y={1010} s={1.2} t={t} mood="smug" />
            <Flames x={360} y={1150} t={t} s={1.3} />
            <Flames x={720} y={1150} t={t + 0.5} s={1.3} />
          </g>
        )}
        {phase === 2 && (
          <g>
            <BlackBox x={540} y={1040 + 10 * press} s={1.2} t={t} mood="smug" />
            <Weight x={540} y={lerp(760, 890 + 6 * press, easeOutCubic(press))} s={1.3} />
          </g>
        )}
        <Pill x={540} y={300} text="3,400 G IMPACT" s={span(t, impT, fireT - 0.1)} bg={C.red} fg={C.paper} size={60} />
        <Pill x={540} y={300} text="1,100°C FOR AN HOUR" s={span(t, fireT, crushT - 0.1)} bg={C.gold} size={58} />
        <Pill x={540} y={300} text="CRUSHED: 2+ TONNES" s={span(t, crushT)} bg={STEEL} size={58} />
        <Pill x={540} y={190} text="TESTED BRUTALLY" s={pop(t, ph('brutally'))} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// Scale it up: a plane is mostly empty space; armor it and it can't take off.
const HeavyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.heavy;
  const emptyT = ph('empty space');
  const wrapT = ph('wrap all of it');
  const heavyT = ph('too heavy');
  const armor = prog(t, wrapT, heavyT + 0.2);
  const tryT = heavyT - 0.3;
  const jump = t > tryT ? Math.max(0, Math.sin((t - tryT) * 8)) * 20 * Math.exp(-(t - tryT) * 2) : 0;
  const sink = 24 * prog(t, heavyT, heavyT + 0.8);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <rect x={-200} y={1060} width={1480} height={900} fill="#6E7378" />
        <line x1={-200} x2={1280} y1={1060} y2={1060} stroke={C.ink} strokeWidth={INK_W} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={40 + i * 230} y={1120} width={120} height={18} fill={C.paper} />
        ))}
        <Plane x={560} y={900 - jump + sink} s={1.15} t={t} armor={armor} mood={armor > 0.5 ? 'squeeze' : 'happy'} />
        {/* people, bags and fuel icons inside the empty space */}
        {t > emptyT && t < wrapT &&
          [ph('people', t0), ph('bags'), ph('fuel')].map((at, i) => {
            const s = pop(t, at);
            return s > 0 ? <circle key={i} cx={360 + i * 170} cy={880} r={34 * s} fill={[C.yellow, C.teal, C.red][i]} stroke={C.ink} strokeWidth={5} /> : null;
          })}
        <Pill x={540} y={330} text="SCALE IT UP" s={span(t, t0 + 0.2, emptyT)} size={58} />
        <Pill x={540} y={330} text="MOSTLY EMPTY SPACE" s={span(t, emptyT, wrapT)} bg={C.paper} size={54} />
        <Pill x={540} y={330} text="ARMOR EVERYTHING" s={span(t, wrapT, heavyT)} bg={STEEL} size={54} />
        {t > heavyT && <Stamp x={540} y={360} text="TOO HEAVY TO FLY" s={slam(t, heavyT)} size={64} />}
      </Layer>
    </Stage>
  );
};

// People can't survive it anyway: about 46 g briefly vs 3,400 g.
const HumanScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.human;
  const pilotT = ph('an air force doctor');
  const bigT = ph('three thousand four hundred g', pilotT);
  const g1 = prog(t, ph('forty-six'), ph('forty-six') + 0.6, easeOutCubic);
  const g2 = prog(t, bigT, bigT + 1.0, easeOutBack);
  const base = 1240;
  const full = 880;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={C.paper} />
        <line x1={120} x2={960} y1={base} y2={base} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <rect x={250} y={base - full * (46 / 3400) * g1} width={200} height={full * (46 / 3400) * g1} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={6} />
        {g2 > 0 && <rect x={630} y={base - full * g2} width={200} height={full * g2} rx={12} fill={C.red} stroke={C.ink} strokeWidth={6} />}
        <Pill x={350} y={930} text="HUMAN: ~46 G" s={pop(t, ph('forty-six'))} bg={C.teal} fg={C.paper} size={44} />
        <Pill x={730} y={300} text="BOX: 3,400 G" s={pop(t, bigT)} bg={C.red} fg={C.paper} size={44} />
        <Pill x={540} y={240} text="NOBODY INSIDE SURVIVES" s={span(t, ph("wouldn't save"), pilotT)} bg={C.paper} size={50} />
        <Pill x={350} y={1310} text="FOR A SPLIT SECOND" s={span(t, ph('split second'), bigT)} bg={C.paper} size={36} />
      </Layer>
      <Sci t={t} x={350} y={base - full * (46 / 3400) * g1 - 4} headR={30} poses={[[0, 'dizzy']]} tremble={1} />
    </Stage>
  );
};

// It makes crashes understandable, so the next flight is safer.
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const safeT = ph('next flight');
  const fly = prog(t, safeT - 0.2, safeT + 1.6, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={900} />
        {t < safeT - 0.2 && <BlackBox x={600} y={980} s={1.5} t={t} mood="happy" />}
        {t > ph('understandable') - 0.1 && t < safeT - 0.2 && (
          <g transform={`translate(600 650) scale(${pop(t, ph('understandable') - 0.1)})`}>
            <rect x={-150} y={-90} width={300} height={140} rx={16} fill="#fff" stroke={C.ink} strokeWidth={6} />
            <path d="M -120 20 L -60 -20 L 0 0 L 60 -60 L 120 -40" stroke={C.red} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {t > safeT - 0.2 && <Plane x={lerp(-300, 1500, fly)} y={lerp(1050, 500, fly)} s={0.8} rot={-14} t={t} mood="happy" />}
        <Pill x={540} y={330} text="NOT SURVIVABLE" s={span(t, ph('survivable') - 0.1, ph('understandable'))} bg={C.paper} size={54} />
        <Pill x={540} y={330} text="UNDERSTANDABLE" s={span(t, ph('understandable'), safeT)} bg={C.green} size={58} />
        <Pill x={540} y={330} text="THE NEXT FLIGHT: SAFER" s={pop(t, safeT)} size={56} />
      </Layer>
      {t < safeT - 0.2 && <Sci t={t} x={230} y={1300} headR={46} poses={[[0, 'point'], [ph('understandable'), 'thumbs']]} />}
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
  [S.crash, CrashScene],
  [S.whole, WholeScene],
  [S.orange, OrangeScene],
  [S.inside, InsideScene],
  [S.tests, TestsScene],
  [S.heavy, HeavyScene],
  [S.human, HumanScene],
  [S.final, FinalScene],
  [S.end, EndScene],
];

type Cue = {f: string; at: number; db: number};
const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;
const SFX: Cue[] = [
  ...[S.crash, S.whole, S.orange, S.inside, S.tests, S.heavy, S.human, S.final, S.end].map((at) => ({f: I('whoosh'), at: at - 0.05, db: -24})),
  {f: U('fire'), at: S.crash, db: -30},
  ...[ph('the black box', S.crash), ph('survive almost'), ph('build the whole'), ph('bright orange'), ph('spot it'), ph('memory chips'), ph('insulation'), ph('titanium'), ph('two kilograms'), ph('handful'), ph('brutally'), ph('empty space'), ph('people', S.heavy), ph('bags'), ph('fuel'), ph('forty-six'), ph('understandable')].map((at) => ({f: I('pop'), at: at - 0.03, db: -21})),
  ...[ph("isn't black"), ph('magic material'), ph('too heavy')].map((at) => ({f: I('stamp'), at, db: -12})),
  {f: U('boom'), at: ph('an impact') + 0.9, db: -12},
  {f: U('fire'), at: ph('a fire'), db: -18},
  {f: I('bonk'), at: ph('crushed') + 0.55, db: -12},
  {f: U('fail'), at: ph('too heavy') + 0.1, db: -18},
  {f: U('rocket'), at: ph('three thousand four hundred g', ph('an air force doctor')), db: -18},
  {f: U('rocket'), at: ph('next flight') - 0.2, db: -20},
  {f: I('pop'), at: S.end + 0.05, db: -18},
];

export const BlackBoxShort: React.FC = () => {
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
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <Captions t={t} hide={t < S.crash || t >= S.end} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('blackbox/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
