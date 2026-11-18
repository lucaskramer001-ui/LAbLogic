import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {FPS, ph} from './timing';
import {Captions} from './Captions';
import {BigText, C, Pill, textWidth} from '../iceberg/art';
import {TrashHeap} from '../sun/space';
import {clamp, lerp, rnd} from '../iceberg/anim';
import {Bottle, Bug, PlasticCover, Rays, S, useFonts} from './Main';
import {BugRig} from '../kit/BugRig';
import {anticipate, blink, breathe, camShake, drift, ease, impact, jiggle, springIn, squash} from '../kit/motion';

// "Nachher" version of the plastic hook (0-7.3 s) built with the motion kit:
// parallax layers, camera push/shake, anticipation + squash & stretch, overshoot springs, blinking/breathing
// characters, per-bite reactions, motion blur on the fast bug and a directional-blur whip into the next scene.

const W = 1080;
const H = 1920;
export const HOOK_V2_FRAMES = Math.round(S.disc * FPS) + 12;

const PCT = ph('ninetyone percent');
const REC = ph('recycled');
const BUG = ph('one bacterium');
const LAND = BUG + 0.42;
const EAT = ph('can eat it');
const BITES = [EAT, EAT + 0.9, ph('eat all of it') - 0.25];
const ALL = ph('eat all of it');
const WHIP = S.disc - 0.2;

// Camera for a given time: push-in, punch on hits, shake, drift, whip out at the end.
const camAt = (t: number) => {
  const push = lerp(1.2, 1, ease(t, S.hook, S.hook + 1.6));
  const punch = 1 + jiggle(t, PCT, 0.05, 5, 6) + jiggle(t, LAND, 0.025, 5, 7);
  const sh = camShake(t, [[PCT, 22], [LAND, 12], ...BITES.map((b) => [b, 7] as [number, number])]);
  const dr = drift(t, 8);
  const follow = lerp(0, 60, ease(t, BUG, LAND + 0.4)); // drift toward the action once the bug lands
  const whip = lerp(0, -1300, ease(t, WHIP, S.disc + 0.2, (u) => u * u * u));
  return {s: push * punch, x: sh.x + dr.x + follow + whip, y: sh.y + dr.y};
};

// One parallax plane: depth 1 = moves with the camera, < 1 = background, > 1 = foreground.
const Plane: React.FC<{t: number; depth: number; children: React.ReactNode}> = ({t, depth, children}) => {
  const c = camAt(t);
  const s = 1 + (c.s - 1) * depth;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${540 - c.x * depth} ${1000 - c.y * depth}) scale(${s}) translate(-540 -1000)`}>{children}</g>
    </svg>
  );
};

// Bug path: peek in from the right, pull back (anticipation), leap in an arc, land with squash, lunge per bite.
const bugState = (t: number) => {
  const peek = ease(t, BUG - 0.4, BUG - 0.15);
  const leap = anticipate(t, BUG, LAND, 0.15);
  const x0 = lerp(1300, 1140, peek);
  let x = lerp(x0, 560, clamp(leap, -0.2, 1));
  let y = lerp(900, 930, clamp(leap, 0, 1)) - Math.sin(clamp(leap, 0, 1) * Math.PI) * 300;
  // velocity for stretch + tilt
  const dt = 1 / FPS;
  const l2 = anticipate(t + dt, BUG, LAND, 0.15);
  const vx = (lerp(x0, 560, clamp(l2, -0.2, 1)) - x) / dt;
  const flying = t > BUG && t < LAND;
  let k = flying ? clamp(Math.abs(vx) / 9000, 0, 0.35) : 0;
  let rot = flying ? -vx / 350 : -12;
  let mouth = 0.3;
  for (const b of BITES) {
    const wind = ease(t, b - 0.22, b - 0.04); // lean back, mouth opens wide
    const snap = t >= b - 0.04 ? Math.exp(-14 * (t - b + 0.04)) : 0;
    const lunge = t < b - 0.04 ? -30 * wind : 70 * snap * (t < b + 0.3 ? 1 : 0);
    if (t > b - 0.3 && t < b + 0.35) {
      x += lunge;
      rot += t < b - 0.04 ? 8 * wind : -6 * snap;
      mouth = t < b - 0.04 ? 0.3 + 0.9 * wind : 0.1 + 0.2 * (1 - snap);
      k += t < b - 0.04 ? -0.1 * wind : 0.2 * snap;
    }
  }
  const imp = impact(t, LAND, 0.3);
  const br = breathe(t, 1, 0.03);
  return {x, y, rot, mouth, sx: (1 / (1 + k)) * imp.sx * br.sx, sy: (1 + k) * imp.sy * br.sy, visible: t > BUG - 0.4};
};

// The bug lives in its own component so CameraMotionBlur can re-render it at sub-frame times.
const BugPlane: React.FC<{V: number}> = ({V}) => {
  const t = useCurrentFrame() / FPS;
  const b = bugState(t);
  if (!b.visible) return null;
  return (
    <Plane t={t} depth={1.1}>
      {V === 2 ? (
        <BugRig x={b.x - 30} y={b.y + 10} s={2.5} t={t} rot={-b.rot} sx={-b.sx} sy={b.sy} mouth={b.mouth} open={blink(t, 3)} mood={b.mouth > 0.55 ? 'chomp' : t < LAND ? 'determined' : 'happy'} look={t < LAND ? {x: -0.7, y: 0.1} : {x: -0.8, y: 0.4}} tailAmp={t > BUG - 0.4 && t < LAND ? 1.6 : 1} />
      ) : (
        <Bug x={b.x} y={b.y} s={2.1} t={t} rot={b.rot} sx={b.sx} sy={b.sy} mouth={b.mouth} open={blink(t, 3)} />
      )}
    </Plane>
  );
};

// Crumb burst from one bite (physics: launch + gravity), pure function of time.
const Burst: React.FC<{t: number; t0: number; x: number; y: number}> = ({t, t0, x, y}) => {
  if (t < t0 || t > t0 + 1.2) return null;
  const d = t - t0;
  return (
    <g>
      {Array.from({length: 9}).map((_, i) => {
        const a = -Math.PI * (0.15 + 0.7 * rnd(i + t0 * 10));
        const v = 500 + rnd(i + 3) * 500;
        const px = x + Math.cos(a) * v * d;
        const py = y + Math.sin(a) * v * d + 1400 * d * d;
        return <rect key={i} x={px} y={py} width={26} height={16} rx={4} fill="#BFE6F5" stroke={C.ink} strokeWidth={4} opacity={clamp(1.4 - d)} transform={`rotate(${d * 600 * (rnd(i + 7) - 0.5)} ${px} ${py})`} />;
      })}
    </g>
  );
};

// Words that pop in one after another with overshoot.
const StaggerText: React.FC<{t: number; t0: number; y: number; words: Array<[string, string]>; size: number}> = ({t, t0, y, words, size}) => {
  const gap = size * 0.3;
  const ws = words.map(([w]) => textWidth(w, size, 900) + size * 0.2);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = 540 - total / 2;
  return (
    <g>
      {words.map(([w, fill], i) => {
        const cx = x + ws[i] / 2;
        x += ws[i] + gap;
        const s = springIn(t, t0 + i * 0.09, 0.55, 9);
        return s > 0.001 ? <BigText key={i} x={cx} y={y} text={w} size={size} fill={fill} s={s} /> : null;
      })}
    </g>
  );
};

const HookAfterScene: React.FC<{t: number; V: number}> = ({t, V}) => {
  const heapJ = jiggle(t, PCT, 0.05, 6, 6) + BITES.reduce((n, b) => n + jiggle(t, b, 0.015, 7, 9), 0);
  const eaten = BITES.reduce((n, b) => n + 0.25 * ease(t, b - 0.03, b + 0.08), 0);
  const scared = t > BUG - 0.2;
  // 91% slam: comes from huge + transparent, hits, squashes, settles with a tilt.
  const slamU = ease(t, PCT - 0.14, PCT, (u) => u * u);
  const slamS = t < PCT ? lerp(2.6, 1, slamU) : 1;
  const slamSq = impact(t, PCT, 0.35);
  const recPill = springIn(t, REC - 0.12, 0.6, 10) * (1 - ease(t, BUG - 0.15, BUG + 0.1));
  const bugPill = springIn(t, LAND + 0.05, 0.6, 10);
  const lookToBug = scared ? {x: 18, y: -6} : {x: 0, y: 0};
  const b1 = breathe(t, 0);
  const b2 = breathe(t, 2);
  const flinch1 = jiggle(t, LAND, 10, 6, 5);
  const shiver2 = scared ? Math.sin(t * 40) * 1.5 : 0;
  const b2sq = BITES.reduce((n, b) => n + jiggle(t, b, 0.12, 8, 9), 0);
  return (
    <AbsoluteFill style={{backgroundColor: '#163A3F'}}>
      <Plane t={t} depth={0.35}>
        <g transform={`rotate(${t * 2} 540 1100)`}>
          <Rays t={t} cx={540} cy={1100} />
        </g>
      </Plane>
      <Plane t={t} depth={1}>
        <g transform={`translate(540 1360) scale(${1 / (1 + heapJ)} ${1 + heapJ}) translate(-540 -1360)`}>
          <TrashHeap x={540} y={1360} s={1.6} t={t} />
        </g>
        <Bottle id="v1" x={300} y={1180} s={0.9} rot={-14 + flinch1} mood={scared ? 'scared' : 'worried'} sx={b1.sx} sy={b1.sy} open={blink(t, 0)} look={lookToBug} />
      </Plane>
      <CameraMotionBlur samples={6} shutterAngle={200}>
        <BugPlane V={V} />
      </CameraMotionBlur>
      <Plane t={t} depth={1.15}>
        <Bottle
          id="v2"
          x={760}
          y={1270}
          s={1.6}
          rot={10 + shiver2}
          mood={scared ? 'scared' : 'worried'}
          eaten={eaten}
          sx={b2.sx * squash(-b2sq).sx}
          sy={b2.sy * squash(-b2sq).sy}
          open={blink(t, 1.3)}
          look={scared ? {x: -18, y: -10} : {x: 0, y: 0}}
        />
        {BITES.map((b, i) => (
          <Burst key={i} t={t} t0={b} x={720} y={900 + i * 120} />
        ))}
      </Plane>
      <Plane t={t} depth={0.8}>
        {t > PCT - 0.14 && (
          <g transform={`translate(540 600) rotate(${-6 + jiggle(t, PCT, 6, 4, 5)}) scale(${slamS * slamSq.sx * (1 - ease(t, ALL - 0.25, ALL - 0.05))} ${slamS * slamSq.sy * (1 - ease(t, ALL - 0.25, ALL - 0.05))})`} opacity={clamp(slamU * 1.5)}>
            <BigText x={0} y={0} text="91%" size={210} fill={C.yellow} />
          </g>
        )}
        {t > ALL - 0.1 && <StaggerText t={t} t0={ALL - 0.1} y={640} size={120} words={[['EAT', C.paper], ['IT', C.paper], ['ALL?', C.yellow]]} />}
        <g transform={`rotate(${lerp(-10, -3, recPill)} 540 330)`}>
          <Pill x={540} y={330} text="NEVER RECYCLED" s={recPill} bg={C.red} fg={C.paper} size={60} />
        </g>
        <g transform={`rotate(${lerp(8, 2, bugPill)} 540 330)`}>
          <Pill x={540} y={330} text="THIS BUG EATS PLASTIC" s={bugPill} bg="#7CC46A" size={54} />
        </g>
      </Plane>
    </AbsoluteFill>
  );
};

type Cue = {f: string; at: number; db: number};
const SFX: Cue[] = [
  {f: 'plastic/sfx/pile', at: S.hook, db: -14},
  {f: 'iceberg/sfx/whoosh', at: PCT - 0.18, db: -20},
  {f: 'iceberg/sfx/stamp', at: PCT - 0.02, db: -12},
  {f: 'iceberg/sfx/pop', at: REC - 0.15, db: -21},
  {f: 'iceberg/sfx/whoosh', at: BUG - 0.05, db: -18},
  {f: 'iceberg/sfx/bonk', at: LAND, db: -20},
  {f: 'iceberg/sfx/pop', at: LAND + 0.05, db: -21},
  ...BITES.map((b) => ({f: 'plastic/sfx/chomp', at: b - 0.03, db: -12})),
  ...[0, 1, 2].map((i) => ({f: 'iceberg/sfx/pop', at: ALL - 0.13 + i * 0.09, db: -23})),
  {f: 'iceberg/sfx/whoosh', at: WHIP - 0.05, db: -18},
];

// Directional blur that only kicks in during the whip at the end.
const whipBlur = (t: number) => {
  const c0 = camAt(t).x;
  const c1 = camAt(t + 1 / FPS).x;
  return Math.min(60, Math.abs(c1 - c0) * 0.6);
};

export const PlasticHookAfter: React.FC<{V?: number}> = ({V = 1}) => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const blur = whipBlur(t);
  return (
    <AbsoluteFill style={{backgroundColor: '#163A3F'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="whip" x="-20%" y="0" width="140%" height="100%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: blur > 0.5 ? 'url(#whip)' : undefined}}>
        {t < S.hook ? <PlasticCover t={t} /> : <HookAfterScene t={t} V={V} />}
      </AbsoluteFill>
      <Captions t={t} hide={t < S.hook} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('plastic/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={Math.pow(10, c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
