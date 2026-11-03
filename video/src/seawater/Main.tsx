import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, VO_END, ph} from './timing';
import {Captions} from './Captions';
import {Sci, handAt} from '../iceberg/Sci';
import {BigText, C, Drop, FONT_DISPLAY, INK_W, Pill, Sea, Sky, Sun, Sunburst, Face} from '../iceberg/art';
import {clamp, easeOutCubic, lerp, pop, prog, rnd, wobble} from '../iceberg/anim';

// "Why don't we just drink the ocean?" - Short, 1080x1920 (rendered 4K with --scale=2).

export const DURATION_FRAMES = Math.ceil(END * FPS);
const W = 1080;
const H = 1920;
const PINK = '#F7D3C9';
const PINK_L = '#FBE3DC';
const URINE = '#F6D55C';
const SEAWATER = '#7EC8F2';

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

// ------------------------------------------------------------------ props

// Log raft with a torn sail; deck top at (x, y), ~560 wide at s = 1.
const Raft: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(t * 1.6) * 1.5}) scale(${s})`}>
    {/* mast + sail */}
    <rect x={130} y={-330} width={22} height={340} fill="#8A5A34" stroke={C.ink} strokeWidth={6} />
    <rect x={40} y={-282} width={250} height={18} rx={8} fill="#8A5A34" stroke={C.ink} strokeWidth={6} />
    <path d="M 52 -264 L 278 -264 Q 262 -170 300 -70 L 270 -82 L 262 -60 L 236 -74 L 220 -50 L 196 -66 Q 150 -64 70 -70 Q 92 -170 52 -264 Z" fill="#EFE6D3" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 120 -250 Q 140 -170 120 -80" stroke="#D9CDB3" strokeWidth={10} fill="none" />
    {/* deck planks */}
    <rect x={-290} y={0} width={580} height={40} rx={10} fill="#A86F3E" stroke={C.ink} strokeWidth={INK_W} />
    <line x1={-280} x2={280} y1={16} y2={16} stroke="#8A5A34" strokeWidth={4} />
    {/* logs */}
    {[-230, -115, 0, 115, 230].map((lx) => (
      <g key={lx}>
        <ellipse cx={lx} cy={62} rx={62} ry={32} fill="#8A5A34" stroke={C.ink} strokeWidth={6} />
        <path d={`M ${lx - 18} 34 L ${lx - 18} 92 M ${lx + 12} 34 L ${lx + 12} 92`} stroke="#C99A5B" strokeWidth={8} />
      </g>
    ))}
  </g>
);

// Clear cup (bottom centre at x, y) filled to `fill` (0..1) with `color`.
const Cup: React.FC<{x: number; y: number; s?: number; fill: number; color?: string; salt?: number; t?: number}> = ({x, y, s = 1, fill, color = SEAWATER, salt = 0, t = 0}) => {
  const top = -260;
  const lvl = top + 20 + (1 - fill) * 230;
  const inner = `M -96 ${top + 8} L 96 ${top + 8} L 78 -8 L -78 -8 Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <clipPath id={`cup${x}${y}`}>
        <path d={inner} />
      </clipPath>
      <path d={`M -110 ${top} L 110 ${top} L 88 0 L -88 0 Z`} fill="#EAF7FF" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      {fill > 0 && (
        <g clipPath={`url(#cup${x}${y})`}>
          <rect x={-120} y={lvl} width={240} height={300} fill={color} />
          <path d={`M -120 ${lvl} Q -60 ${lvl - 8 * Math.sin(t * 4)} 0 ${lvl} T 120 ${lvl}`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.7} />
          {Array.from({length: Math.round(salt)}).map((_, i) => (
            <Salt key={i} x={-60 + rnd(i + 3) * 120} y={lvl + 30 + rnd(i + 17) * Math.max(10, -lvl - 60)} s={0.8} rot={rnd(i) * 40} />
          ))}
        </g>
      )}
      <path d="M -80 -230 L -66 -40" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

// Salt crystal: little white cube with an ink outline.
const Salt: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-13} y={-13} width={26} height={26} rx={4} fill="#fff" stroke={C.ink} strokeWidth={4} />
    <path d="M -7 -6 L 4 -6" stroke={C.iceShade} strokeWidth={4} strokeLinecap="round" />
  </g>
);

// Lab beaker (bottom centre at x, y), w x h, liquid level 0..1.
const Beaker: React.FC<{x: number; y: number; w: number; h: number; level: number; color: string; salt?: number; line?: number; t?: number; id: string}> = ({
  x,
  y,
  w,
  h,
  level,
  color,
  salt = 0,
  line,
  t = 0,
  id,
}) => {
  const lvl = -h * clamp(level, 0, 1.0);
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={`bk${id}`}>
        <rect x={-w / 2 + 6} y={-h} width={w - 12} height={h - 6} rx={18} />
      </clipPath>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={22} fill="#F5FBFF" stroke={C.ink} strokeWidth={INK_W} />
      {level > 0 && (
        <g clipPath={`url(#bk${id})`}>
          <rect x={-w / 2} y={lvl} width={w} height={h} fill={color} />
          <path d={`M ${-w / 2} ${lvl} Q ${-w / 4} ${lvl - 6 * Math.sin(t * 4)} 0 ${lvl} T ${w / 2} ${lvl}`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.6} />
          {Array.from({length: Math.round(salt)}).map((_, i) => (
            <Salt key={i} x={-w / 2 + 34 + rnd(i + 5) * (w - 68)} y={lvl + 30 + rnd(i + 23) * Math.max(10, -lvl - 50)} s={0.85} rot={rnd(i) * 40} />
          ))}
        </g>
      )}
      <rect x={-w / 2 - 14} y={-h - 10} width={w + 28} height={22} rx={10} fill="#F5FBFF" stroke={C.ink} strokeWidth={INK_W} />
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={-w / 2 + 6} x2={-w / 2 + 40} y1={-h * k} y2={-h * k} stroke={C.ink} strokeWidth={4} opacity={0.6} />
      ))}
      {line !== undefined && <line x1={-w / 2 - 30} x2={w / 2 + 30} y1={-h * line} y2={-h * line} stroke={C.red} strokeWidth={8} strokeDasharray="22 14" />}
    </g>
  );
};

// Kidney character (bean with a face), centre at x, y. `strain` 0..1 squeezes it.
const KIDNEY = 'M -40 -190 C 90 -230 200 -130 170 -20 C 160 30 110 20 90 60 C 70 100 120 150 70 200 C 10 260 -150 230 -190 90 C -230 -40 -160 -160 -40 -190 Z';
const Kidney: React.FC<{x: number; y: number; s?: number; t: number; mood?: 'happy' | 'squeeze' | 'worried' | 'surprised'; strain?: number}> = ({x, y, s = 1, t, mood = 'happy', strain = 0}) => {
  const sq = 1 - 0.06 * strain * (0.5 + 0.5 * Math.sin(t * 18));
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (2 - sq)} ${s * sq})`}>
      <path d={KIDNEY} fill="#E8604C" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <path d="M -150 60 C -170 -40 -110 -140 -20 -160" stroke="#F4917F" strokeWidth={22} fill="none" strokeLinecap="round" />
      <Face x={-30} y={20} s={0.75} mood={mood} open={blink(t)} gap={46} />
      {strain > 0.3 && <Drop x={150} y={-150} s={0.7} />}
    </g>
  );
};

// Vertical body-water gauge with a label above it.
const Gauge: React.FC<{x: number; y: number; level: number}> = ({x, y, level}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-40} y={-480} width={80} height={480} rx={40} fill="#fff" stroke={C.ink} strokeWidth={INK_W} />
    <clipPath id="gauge">
      <rect x={-34} y={-474} width={68} height={468} rx={34} />
    </clipPath>
    <rect x={-40} y={-480 * level} width={80} height={480} fill={level < 0.3 ? C.red : C.sea} clipPath="url(#gauge)" />
    <rect x={-40} y={-480} width={80} height={480} rx={40} fill="none" stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// ------------------------------------------------------------------ scenes

const S = {
  cover: 0,
  raft: ph('surrounded') - 0.05,
  salt: ph('the problem') - 0.05,
  kidney: ph('your kidneys') - 0.05,
  salty: ph('but they') - 0.05,
  cup: ph('so to get') - 0.05,
  dry: ph('every sip') - 0.05,
  end: VO_END + 0.25,
};

// Frame 0 = cover (grid-safe: everything inside rows 240-1680).
const CoverScene: React.FC<{t: number}> = ({t}) => {
  const wl = 1450;
  return (
    <Stage>
      <Layer>
        <Sunburst t={t} cx={540} cy={1200} />
        <Sun x={905} y={1185} r={62} t={t} />
        <BigText x={540} y={530} text="WHY DON'T WE" size={106} />
        <BigText x={540} y={652} text="JUST DRINK" size={106} />
        <BigText x={540} y={812} text="THE" size={142} fill={C.yellow} />
        <BigText x={540} y={964} text="OCEAN?" size={142} fill={C.yellow} />
        <Sea y={wl} t={t} x0={-200} x1={1300} />
        <Raft x={560} y={wl - 30} s={0.95} t={t} />
      </Layer>
      <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 250, top: 300, width: 500}} />
      <Sci t={t} x={390} y={wl - 32} headR={46} poses={[[0, 'glass']]} />
    </Stage>
  );
};

// Stuck on a raft, surrounded by ocean... why not drink it?
const RaftScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.raft;
  const wl = 1120;
  const zoom = prog(t, ph('why not'), ph('drink it') + 0.3);
  const camS = lerp(0.8, 1.15, zoom) * punch(t, t0);
  const sciX = 430;
  const hand = handAt('glass', sciX, wl - 30, 56);
  return (
    <Stage cam={{x: lerp(540, sciX + 60, zoom), y: lerp(960, 820, zoom), s: camS}}>
      <Layer>
        <Sky />
        <Sun x={900} y={420} r={80} t={t} hot={1} />
        <Sea y={wl} t={t} x0={-1200} x1={2300} depth={2000} />
        {/* ocean all around: wave flecks */}
        {Array.from({length: 14}).map((_, i) => {
          const x = -500 + rnd(i) * 2100 + Math.sin(t + i) * 20;
          const y = wl + 80 + rnd(i + 9) * 700;
          return <path key={i} d={`M ${x} ${y} q 30 -16 60 0 t 60 0`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.6} strokeLinecap="round" />;
        })}
        <Raft x={560} y={wl - 30} s={1.1} t={t} />
        {t > ph('drink it') && <Drop x={hand.x - 20} y={hand.y - 120 - 30 * clamp((t - ph('drink it')) * 2)} s={0.6 * pop(t, ph('drink it'))} color={SEAWATER} />}
      </Layer>
      <Sci t={t} x={sciX} y={wl - 30} headR={56} poses={[[0, 'think'], [ph('why not'), 'glass']]} />
    </Stage>
  );
};

// The problem is the salt: close-up of the cup, salt crystals appear.
const SaltScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.salt;
  const salt = 22 * prog(t, ph('the salt') - 0.1, ph('the salt') + 0.5, (u) => u);
  const shake = wobble(t, ph('the salt'), 4, 6, 4);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={540} cy={800} />
        <g transform={`rotate(${shake} 540 1150)`}>
          <Cup x={540} y={1180} s={2.3} fill={0.85} salt={salt} t={t} />
        </g>
        <Pill x={540} y={300} text="SEAWATER" s={pop(t, t0 + 0.15)} bg={C.paper} size={64} />
        <Pill x={540} y={1300} text="ABOUT 3.5% SALT" s={pop(t, ph('the salt'))} size={58} />
      </Layer>
    </Stage>
  );
};

// Kidneys flush the salt out in urine.
const KidneyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.kidney;
  const flush = prog(t, ph('flush'), ph('urine') + 0.4, (u) => u);
  const crystals = Array.from({length: 7}).map((_, i) => {
    const u = clamp((t - ph('flush') - i * 0.28) / 0.9);
    return {u, x: 590, y: lerp(640, 1150, u)};
  });
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={PINK} />
        {Array.from({length: 9}).map((_, i) => (
          <circle key={i} cx={rnd(i) * 1080} cy={200 + rnd(i + 4) * 1300} r={40 + rnd(i + 8) * 70} fill={PINK_L} />
        ))}
        {/* ureter tube from the kidney down to the beaker */}
        <path d="M 590 600 C 600 760 580 900 590 1060" stroke={C.ink} strokeWidth={46} fill="none" strokeLinecap="round" />
        <path d="M 590 600 C 600 760 580 900 590 1060" stroke={URINE} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Beaker x={590} y={1330} w={300} h={300} level={0.1 + 0.4 * flush} color={URINE} salt={flush * 6} t={t} id="k" />
        {crystals.map((c, i) => (c.u > 0 && c.u < 1 ? <Salt key={i} x={c.x} y={c.y} s={0.9} /> : null))}
        <Kidney x={520} y={480} s={1.05} t={t} mood={t > ph('flush') ? 'squeeze' : 'happy'} strain={flush > 0 && flush < 1 ? 0.6 : 0} />
        <Pill x={250} y={1200} text="URINE" s={pop(t, ph('urine'))} bg={URINE} size={54} />
        <Pill x={540} y={160} text="KIDNEYS" s={pop(t, ph('kidneys'))} bg={C.paper} size={60} />
      </Layer>
    </Stage>
  );
};

// But urine can't get as salty as seawater.
const SaltyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.salty;
  const cmp = pop(t, ph('as salty'));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={PINK} />
        <Kidney x={540} y={420} s={0.8} t={t} mood={t > ph("can't") ? 'worried' : 'squeeze'} strain={1} />
        <Beaker x={300} y={1180} w={300} h={420} level={0.6} color={URINE} salt={6} t={t} id="u" />
        {t > ph('seawater') - 0.2 && (
          <g transform={`translate(780 1180) scale(${pop(t, ph('seawater') - 0.2)}) translate(-780 -1180)`}>
            <Beaker x={780} y={1180} w={300} h={420} level={0.6} color={SEAWATER} salt={22} t={t} id="s" />
          </g>
        )}
        <Pill x={300} y={1265} text="URINE" s={pop(t, ph('make urine'))} bg={URINE} size={50} />
        <Pill x={780} y={1265} text="SEAWATER" s={pop(t, ph('seawater'))} bg={SEAWATER} size={50} />
        {cmp > 0 && (
          <g transform={`translate(540 640) scale(${cmp})`}>
            <rect x={-300 + 8} y={-60 + 8} width={600} height={120} rx={20} fill={C.ink} />
            <rect x={-300} y={-60} width={600} height={120} rx={20} fill={C.paper} stroke={C.red} strokeWidth={12} />
            <text x={0} y={24} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={64} fill={C.red}>
              LESS SALTY
            </text>
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// One cup in, more than one cup out.
const CupScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.cup;
  const drink = prog(t, ph('one cup'), ph('you have to'), (u) => u);
  const pee = prog(t, ph('pee out'), ph('gave you') + 0.3, (u) => u);
  const LINE = 0.42;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-200} y={-200} width={1480} height={2400} fill={C.paper} />
        {Array.from({length: 16}).map((_, i) => (
          <circle key={i} cx={rnd(i) * 1080} cy={150 + rnd(i + 3) * 1200} r={10 + rnd(i + 7) * 14} fill="none" stroke="#E9DFC6" strokeWidth={4} />
        ))}
        <Cup x={290} y={1150} s={1.25} fill={0.85 * (1 - drink)} salt={12 * (1 - drink)} t={t} />
        <Pill x={290} y={1260} text="1 CUP IN" s={pop(t, ph('one cup'))} bg={SEAWATER} size={50} />
        <Kidney x={770} y={380} s={0.45} t={t} mood={pee > 0 ? 'squeeze' : 'happy'} strain={pee > 0 && pee < 1 ? 1 : 0} />
        <path d="M 790 470 C 790 560 780 620 780 690" stroke={C.ink} strokeWidth={30} fill="none" strokeLinecap="round" />
        <path d="M 790 470 C 790 560 780 620 780 690" stroke={URINE} strokeWidth={18} fill="none" strokeLinecap="round" />
        <Beaker x={780} y={1180} w={280} h={480} level={(LINE + 0.25) * pee} color={URINE} salt={12 * pee} line={LINE} t={t} id="o" />
        <Pill x={780} y={1260} text="OUT" s={pop(t, ph('pee out'))} bg={URINE} size={50} />
        <Pill x={780} y={620 + 480 * (1 - LINE - 0.25) - 40} text="EXTRA" s={pop(t, ph('more water'))} bg={C.red} fg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// Every sip leaves you thirstier until you dehydrate.
const DryScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.dry;
  const wl = 1120;
  const level = lerp(0.75, 0.12, prog(t, ph('every sip'), ph('dehydrate') + 0.6));
  const sciX = 420;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sky />
        <Sun x={230} y={330} r={95} t={t} hot={1} />
        <Sea y={wl} t={t} x0={-400} x1={1500} depth={2000} />
        <Raft x={500} y={wl - 30} s={1.0} t={t} />
        <g transform={`translate(${940} ${980})`}>
          <Gauge x={0} y={0} level={level} />
          <Drop x={0} y={40 + ((t * 1.3) % 1) * 90} s={0.7} color={level < 0.3 ? C.red : C.sea} />
        </g>
        <Pill x={840} y={420} text="BODY WATER" s={pop(t, t0 + 0.2)} bg={C.paper} size={40} />
      </Layer>
      <Sci t={t} x={sciX} y={wl - 30} headR={54} poses={[[0, 'glass'], [ph('thirstier'), 'thirsty']]} tremble={t > ph('dehydrate') ? 1 : 0} />
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
  [S.raft, RaftScene],
  [S.salt, SaltScene],
  [S.kidney, KidneyScene],
  [S.salty, SaltyScene],
  [S.cup, CupScene],
  [S.dry, DryScene],
  [S.end, EndScene],
];

type Cue = {f: string; at: number; db: number};
const SFX: Cue[] = [
  ...[S.raft, S.salt, S.kidney, S.salty, S.cup, S.dry, S.end].map((at) => ({f: 'iceberg/sfx/whoosh', at: at - 0.05, db: -24})),
  {f: 'iceberg/sfx/ocean', at: 0, db: -30},
  {f: 'iceberg/sfx/pop', at: ph('the salt') - 0.03, db: -18},
  {f: 'iceberg/sfx/pop', at: ph('kidneys') - 0.03, db: -20},
  {f: 'iceberg/sfx/drip', at: ph('flush'), db: -16},
  {f: 'iceberg/sfx/pop', at: ph('urine') - 0.03, db: -20},
  {f: 'iceberg/sfx/stamp', at: ph('as salty'), db: -12},
  {f: 'iceberg/sfx/pop', at: ph('one cup') - 0.03, db: -20},
  {f: 'iceberg/sfx/drip', at: ph('pee out'), db: -14},
  {f: 'iceberg/sfx/pop', at: ph('more water') - 0.03, db: -18},
  {f: 'iceberg/sfx/melt', at: ph('every sip'), db: -20},
  {f: 'iceberg/sfx/pop', at: S.end + 0.05, db: -18},
];

export const SeawaterShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  return (
    <AbsoluteFill style={{backgroundColor: C.sky}}>
      <Scene t={t} />
      <Captions t={t} hide={t < S.raft || t >= S.end} />
      <Sequence from={Math.round(0.15 * FPS)} layout="none">
        <Audio src={staticFile('seawater/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={c.f.endsWith('ocean') ? (f) => Math.pow(10, (c.db - (f / FPS > END - 1.5 ? 20 * (f / FPS - (END - 1.5)) : 0)) / 20) : Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
