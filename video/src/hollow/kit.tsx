import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile} from 'remotion';
import {clamp, lerp, pop, rnd} from '../iceberg/anim';

// Hollow Hour - shared look for the creepy / mystery channel.
// Papercut shadow-puppet theatre: pure ink silhouettes in front of glowing backdrops (candle amber, blood red,
// moon fog), slow hypnotic camera, film grain, vignette and candle flicker. Type: Cinzel (titles, captions, stamps),
// IM Fell English (italic dates and source notes).

export const W = 1080;
export const H = 1920;

export const HC = {
  void: '#0A0809', // background, silhouettes
  ink: '#050405', // outlines, text stroke
  bone: '#EDE3CF', // main text, moon
  ember: '#F2A93B', // candle glow, active caption word
  emberHi: '#FFD27A',
  blood: '#B3261E', // warnings, stamps
  bloodHi: '#FF5A47', // caption keywords
  dusk: '#2B1D33', // night sky
  duskHi: '#4A3157',
  fog: '#8C93A3', // moonlight
  rot: '#9DB36B', // sickness, poison (sparingly)
};
export const SERIF = 'Cinzel';
export const FELL = 'IM Fell English';

export const useHollowFonts = () => {
  const [handle] = useState(() => delayRender('hollow-fonts'));
  useEffect(() => {
    const faces = [
      new FontFace(SERIF, `url(${staticFile('fonts/cinzel-latin-900-normal.woff2')})`, {weight: '900'}),
      new FontFace(SERIF, `url(${staticFile('fonts/cinzel-latin-700-normal.woff2')})`, {weight: '700'}),
      new FontFace(FELL, `url(${staticFile('fonts/im-fell-english-latin-400-normal.woff2')})`, {weight: '400'}),
      new FontFace(FELL, `url(${staticFile('fonts/im-fell-english-latin-400-italic.woff2')})`, {weight: '400', style: 'italic'}),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
};

// ------------------------------------------------------------------ stage

export const Stage: React.FC<{cam?: {x?: number; y?: number; s?: number; r?: number}; children: React.ReactNode}> = ({cam = {}, children}) => {
  const {x = 540, y = 960, s = 1, r = 0} = cam;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: '0 0',
          transform: `translate(540px, 960px) rotate(${r}deg) scale(${s}) translate(${-x}px, ${-y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
export const Layer: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

// Slow, steady push-in from the start of a scene: the "hypnotic" camera. Never stops moving.
export const drift = (t: number, t0: number, from = 1.0, rate = 0.012) => from + rate * (t - t0);

// Candle flicker 0.9..1.05, smooth (sum of sines).
export const flicker = (t: number, k = 1) =>
  1 + k * (0.035 * Math.sin(t * 2 * Math.PI * 1.7) + 0.025 * Math.sin(t * 2 * Math.PI * 4.3 + 1.1) + 0.015 * Math.sin(t * 2 * Math.PI * 9.1 + 2.3));

// ------------------------------------------------------------------ backdrops

// Radial glow backdrop: a light source (candle, lantern, moon) behind the silhouettes.
export const Glow: React.FC<{id: string; cx?: number; cy?: number; r?: number; inner: string; outer?: string; t: number; k?: number}> = ({
  id,
  cx = 540,
  cy = 900,
  r = 1100,
  inner,
  outer = HC.void,
  t,
  k = 1,
}) => {
  const f = flicker(t, k);
  return (
    <g>
      <defs>
        <radialGradient id={id} cx={cx} cy={cy} r={r * f} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={inner} />
          <stop offset="0.45" stopColor={inner} stopOpacity={0.55} />
          <stop offset="1" stopColor={outer} />
        </radialGradient>
      </defs>
      <rect x={-3000} y={-3000} width={9000} height={9000} fill={outer} />
      <rect x={-3000} y={-3000} width={9000} height={9000} fill={`url(#${id})`} />
    </g>
  );
};

// Hypnotic spiral: alternating rotating wedges, very low contrast, behind everything.
export const Spiral: React.FC<{cx: number; cy: number; t: number; color?: string; n?: number; speed?: number; opacity?: number; twist?: number}> = ({
  cx,
  cy,
  t,
  color = HC.void,
  n = 18,
  speed = 9,
  opacity = 0.32,
  twist = 0.9,
}) => {
  const R = 2400;
  const rot = t * speed;
  const paths = Array.from({length: n}).map((_, i) => {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = a0 + Math.PI / n;
    const pts: string[] = [];
    // curved wedge: angle grows with radius (twist) -> spiral arms
    const steps = 14;
    for (let k = 0; k <= steps; k++) {
      const rr = (k / steps) * R;
      const a = a0 + twist * (rr / 1000);
      pts.push(`${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`);
    }
    for (let k = steps; k >= 0; k--) {
      const rr = (k / steps) * R;
      const a = a1 + twist * (rr / 1000);
      pts.push(`${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`);
    }
    return `M ${pts.join(' L ')} Z`;
  });
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={opacity}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </g>
  );
};

export const Moon: React.FC<{x: number; y: number; r?: number; t: number; color?: string}> = ({x, y, r = 120, t, color = HC.bone}) => (
  <g>
    <circle cx={x} cy={y} r={r * 2.4} fill={color} opacity={0.06 * flicker(t, 0.5)} />
    <circle cx={x} cy={y} r={r * 1.5} fill={color} opacity={0.08} />
    <circle cx={x} cy={y} r={r} fill={color} />
    <circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.18} fill={HC.fog} opacity={0.35} />
    <circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.12} fill={HC.fog} opacity={0.3} />
  </g>
);

// A row of gabled half-timbered houses (Strasbourg) plus the cathedral's single spire. Ground at y = base.
export const Town: React.FC<{base: number; t: number; seed?: number; spireX?: number | null; lit?: number; color?: string; windowColor?: string; x0?: number; x1?: number; scale?: number}> = ({
  base,
  t,
  seed = 1,
  spireX = 820,
  lit = 1,
  color = HC.void,
  windowColor = HC.ember,
  x0 = -300,
  x1 = 1380,
  scale = 1,
}) => {
  const houses: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = (130 + rnd(seed * 31 + i) * 90) * scale;
    const h = (260 + rnd(seed * 17 + i) * 220) * scale;
    if (i > 0 && x + w > x1 + 30) break;
    const roof = w * (0.75 + rnd(seed * 7 + i) * 0.35);
    const top = base - h;
    houses.push(
      <g key={i}>
        <path d={`M ${x} ${base} L ${x} ${top} L ${x + w / 2} ${top - roof} L ${x + w} ${top} L ${x + w} ${base} Z`} fill={color} />
        {/* chimney */}
        {rnd(seed * 3 + i) > 0.5 && <rect x={x + w * 0.7} y={top - roof * 0.75} width={18 * scale} height={roof * 0.5} fill={color} />}
        {/* windows: some lit, flickering */}
        {[0, 1].map((r) =>
          [0, 1].map((c) => {
            const on = rnd(seed * 101 + i * 7 + r * 3 + c) < 0.45 * lit;
            if (!on) return null;
            const wx = x + w * (0.22 + c * 0.38);
            const wy = top + h * (0.18 + r * 0.3);
            const fl = 0.75 + 0.25 * Math.sin(t * (3 + rnd(i + r + c) * 4) + i);
            return <rect key={`${r}${c}`} x={wx} y={wy} width={w * 0.2} height={h * 0.13} fill={windowColor} opacity={fl} />;
          }),
        )}
      </g>,
    );
    x += w - 4;
    i++;
  }
  return (
    <g>
      {houses}
      {spireX !== null && (
        <g>
          {/* cathedral body + one tall spire (Strasbourg's cathedral has a single north spire) */}
          <rect x={spireX - 150 * scale} y={base - 560 * scale} width={300 * scale} height={560 * scale} fill={color} />
          <rect x={spireX - 60 * scale} y={base - 860 * scale} width={120 * scale} height={320 * scale} fill={color} />
          <path d={`M ${spireX - 60 * scale} ${base - 860 * scale} L ${spireX} ${base - 1180 * scale} L ${spireX + 60 * scale} ${base - 860 * scale} Z`} fill={color} />
          <circle cx={spireX} cy={base - 430 * scale} r={46 * scale} fill={windowColor} opacity={0.5 * lit} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ the puppet

export type Kind = 'woman' | 'man' | 'doctor' | 'fiddler' | 'drummer' | 'saint' | 'official';
export type Pose = 'stand' | 'dance' | 'collapse' | 'play' | 'point' | 'cower' | 'walk';

const limb = (x: number, y: number, a: number, L: number) => [x + Math.sin(a) * L, y + Math.cos(a) * L] as const;
const deg = (d: number) => (d * Math.PI) / 180;

// Shadow puppet, feet at (x, y), ~300 px tall at s = 1. `ph` desyncs crowds. `fall` 0..1 lays it down (collapse).
export const Puppet: React.FC<{
  x: number;
  y: number;
  s?: number;
  t: number;
  kind?: Kind;
  pose?: Pose;
  ph?: number;
  speed?: number;
  fall?: number;
  flip?: boolean;
  spin?: boolean;
  color?: string;
  rim?: string;
}> = ({x, y, s = 1, t, kind = 'man', pose = 'stand', ph = 0, speed = 1, fall = 0, flip = false, spin = false, color = HC.void, rim}) => {
  const w = t * speed * 2 * Math.PI * 1.1 + ph * 7.3;
  const dancing = pose === 'dance';
  const bob = dancing ? -Math.abs(Math.sin(w)) * 16 : pose === 'walk' ? -Math.abs(Math.sin(w)) * 6 : Math.sin(t * 1.6 + ph) * 1.5;
  const lean = dancing ? Math.sin(w * 0.5) * 10 : pose === 'cower' ? 14 : pose === 'collapse' ? 0 : 0;
  // joints
  const hip: [number, number] = [0, -150 + bob];
  const neck: [number, number] = [Math.sin(deg(lean)) * 88, hip[1] - Math.cos(deg(lean)) * 88];
  const head: [number, number] = [neck[0] + Math.sin(deg(lean)) * 26, neck[1] - 24];
  // arm angles (0 = hanging down, 180 = straight up); right arm positive x
  let aR = 12;
  let fR = 8;
  let aL = -12;
  let fL = -8;
  let lR = 6;
  let kR = 0;
  let lL = -6;
  let kL = 0;
  if (dancing) {
    aR = 150 + 25 * Math.sin(w);
    fR = 170 + 40 * Math.sin(w + 1);
    aL = -150 - 25 * Math.sin(w + Math.PI * 0.8);
    fL = -170 - 40 * Math.sin(w + 2);
    const kick = Math.sin(w);
    lR = 10 + Math.max(0, kick) * 45;
    kR = -Math.max(0, kick) * 70;
    lL = -10 - Math.max(0, -kick) * 45;
    kL = Math.max(0, -kick) * 70;
  } else if (pose === 'walk') {
    const k = Math.sin(w);
    lR = 18 * k;
    lL = -18 * k;
    kR = -10 * Math.max(0, -k);
    kL = 10 * Math.max(0, k);
    aR = -14 * k;
    aL = 14 * k;
    fR = aR - 10;
    fL = aL + 10;
  } else if (pose === 'play') {
    aR = 70 + 8 * Math.sin(w * 2);
    fR = 160 + 20 * Math.sin(w * 4);
    aL = -40;
    fL = -120;
  } else if (pose === 'point') {
    aR = 100;
    fR = 110;
  } else if (pose === 'cower') {
    aR = 150;
    fR = 230;
    aL = -150;
    fL = -230;
    lR = 20;
    kR = -40;
    lL = -20;
    kL = 40;
  }
  const sh: [number, number] = [neck[0], neck[1] + 12];
  const UA = 62;
  const FA = 56;
  const TH = 76;
  const SH = 72;
  const elR = limb(sh[0] + 14, sh[1], deg(aR), UA);
  const haR = limb(elR[0], elR[1], deg(fR), FA);
  const elL = limb(sh[0] - 14, sh[1], deg(aL), UA);
  const haL = limb(elL[0], elL[1], deg(fL), FA);
  const knR = limb(hip[0] + 12, hip[1], deg(lR), TH);
  const ftR = limb(knR[0], knR[1], deg(lR + kR), SH);
  const knL = limb(hip[0] - 12, hip[1], deg(lL), TH);
  const ftL = limb(knL[0], knL[1], deg(lL + kL), SH);
  const P = (pts: ReadonlyArray<readonly [number, number] | [number, number]>) => pts.map((p) => `${p[0]} ${p[1]}`).join(' L ');
  const skirt = kind === 'woman' || kind === 'saint' || kind === 'doctor';
  const sway = dancing ? Math.sin(w * 0.5 + 0.6) * 26 : 0;
  const hemY = kind === 'woman' ? -18 : -4;
  const spinX = spin ? Math.cos(t * 2 * Math.PI * 0.45 + ph) : 1;
  const sx = (flip ? -1 : 1) * (Math.sign(spinX || 1) * (0.4 + 0.6 * Math.abs(spinX)));
  const rot = fall * 88;
  const body = (fill: string) => (
    <g>
      {/* legs */}
      {(!skirt || dancing || kind === 'woman') && (
        <>
          <path d={`M ${P([[hip[0] + 12, hip[1]], knR, ftR])}`} stroke={fill} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${P([[hip[0] - 12, hip[1]], knL, ftL])}`} stroke={fill} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={ftR[0] + 10} cy={ftR[1] - 2} rx={20} ry={9} fill={fill} />
          <ellipse cx={ftL[0] - 10} cy={ftL[1] - 2} rx={20} ry={9} fill={fill} />
        </>
      )}
      {/* torso */}
      <path
        d={`M ${neck[0] - 26} ${neck[1] + 6} Q ${neck[0]} ${neck[1] - 8} ${neck[0] + 26} ${neck[1] + 6} L ${hip[0] + 30} ${hip[1] + 4} L ${hip[0] - 30} ${hip[1] + 4} Z`}
        fill={fill}
        stroke={fill}
        strokeWidth={10}
        strokeLinejoin="round"
      />
      {skirt && (
        <path
          d={
            kind === 'woman'
              ? `M ${hip[0] - 34} ${hip[1] - 14} L ${hip[0] + 34} ${hip[1] - 14} Q ${70 + sway} ${hemY - 30} ${78 + sway} ${hemY} Q ${sway} ${hemY + 14} ${-78 + sway} ${hemY} Q ${-70 + sway} ${hemY - 30} ${hip[0] - 34} ${hip[1] - 14} Z`
              : `M ${hip[0] - 34} ${hip[1] - 40} L ${hip[0] + 34} ${hip[1] - 40} L 58 0 L -58 0 Z`
          }
          fill={fill}
        />
      )}
      {/* arms */}
      {kind !== 'saint' && (
        <>
          <path d={`M ${P([[sh[0] + 14, sh[1]], elR, haR])}`} stroke={fill} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${P([[sh[0] - 14, sh[1]], elL, haL])}`} stroke={fill} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={haR[0]} cy={haR[1]} r={11} fill={fill} />
          <circle cx={haL[0]} cy={haL[1]} r={11} fill={fill} />
        </>
      )}
      {kind === 'saint' && (
        <path d={`M ${neck[0] - 30} ${neck[1] + 10} L ${neck[0] + 30} ${neck[1] + 10} L 48 -40 L -48 -40 Z`} fill={fill} />
      )}
      {/* head + headwear */}
      <circle cx={head[0]} cy={head[1]} r={25} fill={fill} />
      <rect x={neck[0] - 8} y={neck[1] - 12} width={16} height={20} fill={fill} />
      {kind === 'woman' && (
        <path
          d={`M ${head[0] - 28} ${head[1] + 4} Q ${head[0]} ${head[1] - 44} ${head[0] + 28} ${head[1] + 4} L ${head[0] + 22 + 30 + sway * 0.6} ${head[1] + 46} L ${head[0] + 14} ${head[1] + 22} Z`}
          fill={fill}
        />
      )}
      {(kind === 'man' || kind === 'fiddler' || kind === 'drummer') && (
        <g>
          <ellipse cx={head[0]} cy={head[1] - 18} rx={40} ry={8} fill={fill} />
          <path d={`M ${head[0] - 22} ${head[1] - 18} Q ${head[0]} ${head[1] - 58} ${head[0] + 22} ${head[1] - 18} Z`} fill={fill} />
        </g>
      )}
      {kind === 'official' && <rect x={head[0] - 22} y={head[1] - 56} width={44} height={40} rx={6} fill={fill} />}
      {kind === 'doctor' && (
        <path d={`M ${head[0] - 26} ${head[1] - 10} L ${head[0] - 14} ${head[1] - 70} L ${head[0] + 18} ${head[1] - 66} L ${head[0] + 26} ${head[1] - 10} Z`} fill={fill} />
      )}
      {kind === 'fiddler' && (
        <g>
          <ellipse cx={neck[0] - 40} cy={neck[1] + 34} rx={34} ry={20} transform={`rotate(-30 ${neck[0] - 40} ${neck[1] + 34})`} fill={fill} />
          <line x1={neck[0] - 40} y1={neck[1] + 34} x2={neck[0] - 120} y2={neck[1] - 10} stroke={fill} strokeWidth={10} strokeLinecap="round" />
          <line x1={haR[0] - 70} y1={haR[1] + 40} x2={haR[0] + 40} y2={haR[1] - 30} stroke={fill} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {kind === 'drummer' && <ellipse cx={hip[0] - 20} cy={hip[1] - 10} rx={46} ry={40} fill={fill} />}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot} ${fall > 0 ? 0 : 0} 0) scale(${sx} 1)`}>
      {rim && <g transform="translate(-4 -3)" opacity={0.85}>{body(rim)}</g>}
      {body(color)}
      {kind === 'saint' && <circle cx={head[0]} cy={head[1]} r={44} fill="none" stroke={HC.emberHi} strokeWidth={6} opacity={0.9} />}
    </g>
  );
};

// ------------------------------------------------------------------ text

// Title text, cinematic: Cinzel Bold with wide tracking, bone, a thin dark edge for readability and a soft dark
// shadow plus a faint coloured glow. `s` is a 0..1 reveal (fade, small rise, tracking closes in, blur clears).
export const Title: React.FC<{x: number; y: number; text: string; size?: number; color?: string; s?: number; rot?: number; glow?: string; anchor?: 'middle' | 'start' | 'end'; label?: string; maxW?: number}> = ({
  x,
  y,
  text,
  size = 120,
  color = HC.bone,
  s = 1,
  rot = 0,
  glow = HC.ember,
  anchor = 'middle',
  label,
  maxW = 940,
}) => {
  const v = clamp(s);
  if (v <= 0.001) return null;
  const fit = Math.min(1, maxW / (text.length * size * 0.86));
  const track = size * lerp(0.16, 0.08, v);
  const blur = (1 - v) * 10;
  const id = `tg${Math.round(x)}${Math.round(y)}${text.length}`;
  return (
    <g transform={`translate(${x} ${y + (1 - v) * 18}) rotate(${rot * 0.5}) scale(${fit * lerp(0.97, 1, v)})`} opacity={v} data-label={label ?? text}>
      <defs>
        <filter id={id} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={size * 0.09} result="b" />
          <feFlood floodColor="#000" floodOpacity="0.95" />
          <feComposite in2="b" operator="in" result="sh" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={size * 0.18} result="g" />
          <feMerge>
            <feMergeNode in="sh" />
            <feMergeNode in="sh" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text textAnchor={anchor} fontFamily={SERIF} fontWeight={700} fontSize={size} fill={glow} opacity={0.22} letterSpacing={track} style={{filter: `blur(${size * 0.22}px)`}}>
        {text}
      </text>
      <g filter={`url(#${id})`} style={blur > 0.3 ? {filter: `blur(${blur}px)`} : undefined}>
        <text textAnchor={anchor} fontFamily={SERIF} fontWeight={700} fontSize={size} fill={color} stroke="rgba(5,4,5,0.85)" strokeWidth={size * 0.035} paintOrder="stroke fill" letterSpacing={track}>
          {text}
        </text>
      </g>
    </g>
  );
};

// Italic old-print note ("Strasbourg, July 1518", "later accounts").
export const Note: React.FC<{x: number; y: number; text: string; size?: number; color?: string; o?: number; anchor?: 'middle' | 'start' | 'end'}> = ({x, y, text, size = 56, color = HC.bone, o = 1, anchor = 'middle'}) =>
  o <= 0.001 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FELL} fontStyle="italic" fontSize={size} fill={color} opacity={o} stroke="rgba(5,4,5,0.8)" strokeWidth={size * 0.06} paintOrder="stroke fill" style={{filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.9))'}} data-label={text}>
      {text}
    </text>
  );

// Blood-red rubber stamp in Cinzel. Slams from 1.3x.
export const Seal: React.FC<{x: number; y: number; text: string; s?: number; size?: number; rot?: number; color?: string}> = ({x, y, text, s = 1, size = 76, rot = -8, color = HC.blood}) => {
  if (s <= 0.001) return null;
  const w = text.length * size * 0.82 + size * 1.1;
  const h = size * 1.6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} data-label={text}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={HC.void} opacity={0.55} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={color} strokeWidth={10} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={6} fill="none" stroke={color} strokeWidth={3} />
      <text y={size * 0.36} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={color} letterSpacing={size * 0.06}>
        {text}
      </text>
    </g>
  );
};
export const slam = (t: number, t0: number) => {
  const st = clamp((t - t0) / 0.16);
  return t < t0 ? 0 : st < 1 ? lerp(1.3, 1, st) : 1;
};
export const until = (t: number, t1: number, d = 0.3) => 1 - clamp((t - (t1 - d)) / d);
export const fadeIn = (t: number, t0: number, d = 0.4) => clamp((t - t0) / d);
// Smooth reveal 0..1 (ease-out), used instead of the springy pop for a calmer, more cinematic feel.
export const reveal = (t: number, t0: number, d = 0.55) => {
  const u = clamp((t - t0) / d);
  return 1 - Math.pow(1 - u, 3);
};
export const span = (t: number, t0: number, t1 = 1e9) => reveal(t, t0) * until(t, t1, 0.4);

// Wordmark: HOLLOW HOUR in Cinzel, the second O of HOLLOW a crescent moon.
export const Wordmark: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} data-label="wordmark">
      <text textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={64} letterSpacing={12} fill={HC.bone} stroke={HC.ink} strokeWidth={10} paintOrder="stroke fill">
        HOLLOW HOUR
      </text>
      <line x1={-260} x2={-60} y1={28} y2={28} stroke={HC.ember} strokeWidth={3} />
      <line x1={60} x2={260} y1={28} y2={28} stroke={HC.ember} strokeWidth={3} />
      <g transform="translate(0 30)">
        <circle r={13} fill={HC.ember} />
        <circle cx={6} cy={-4} r={11} fill={HC.void} />
      </g>
    </g>
  );

// ------------------------------------------------------------------ overlays

// Film grain (moving), drifting fog, floating dust, vignette and an optional colour wash on top of everything.
export const Overlay: React.FC<{t: number; wash?: string; washO?: number; dark?: number; fog?: number}> = ({t, wash, washO = 0, dark = 0, fog = 1}) => {
  const f = Math.floor(t * 24);
  const ox = Math.floor(rnd(f) * 120);
  const oy = Math.floor(rnd(f + 99) * 120);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {wash && washO > 0 && <AbsoluteFill style={{backgroundColor: wash, opacity: washO, mixBlendMode: 'multiply'}} />}
      {fog > 0 && (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <radialGradient id="fogb">
              <stop offset="0" stopColor="#CFC6D8" stopOpacity="0.16" />
              <stop offset="1" stopColor="#CFC6D8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => {
            const x = ((i * 420 + t * (18 + i * 6)) % 1900) - 400;
            return <ellipse key={i} cx={x} cy={1180 + i * 110 + 20 * Math.sin(t * 0.4 + i)} rx={620} ry={150} fill="url(#fogb)" opacity={fog} />;
          })}
          {Array.from({length: 26}).map((_, i) => {
            const sp = 14 + rnd(i) * 22;
            const y = H - ((t * sp + rnd(i + 40) * H) % (H + 40));
            const x = rnd(i + 7) * W + 30 * Math.sin(t * 0.5 + i);
            const tw = 0.35 + 0.35 * Math.sin(t * 1.3 + i * 2.1);
            return <circle key={i} cx={x} cy={y} r={1.4 + rnd(i + 3) * 2.2} fill={HC.bone} opacity={0.35 * tw * fog} />;
          })}
        </svg>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.82) 100%)'}} />
      <Img src={staticFile('hollow/grain.png')} style={{position: 'absolute', left: -ox, top: -oy, width: 1200 * 1.8, height: 1200 * 1.8, opacity: 0.12, imageRendering: 'pixelated'}} />
      {dark > 0 && <AbsoluteFill style={{backgroundColor: '#000', opacity: dark}} />}
    </AbsoluteFill>
  );
};

// Small persistent channel mark on every frame (so reposts and stitches carry the brand).
export const Watermark: React.FC<{y?: number; o?: number}> = ({y = 1668, o = 0.62}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}} opacity={o}>
    <g transform={`translate(540 ${y})`} data-label="watermark">
      <line x1={-215} x2={-168} y1={-9} y2={-9} stroke={HC.ember} strokeWidth={1.5} opacity={0.8} />
      <line x1={150} x2={197} y1={-9} y2={-9} stroke={HC.ember} strokeWidth={1.5} opacity={0.8} />
      <circle cx={-150} cy={-9} r={7} fill={HC.bone} />
      <circle cx={-147} cy={-11} r={6} fill={HC.void} />
      <text x={0} y={0} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={27} letterSpacing={6} fill={HC.bone} style={{filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.95))'}}>
        HOLLOW HOUR
      </text>
    </g>
  </svg>
);
