import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, ph} from './timing';
import {S} from './scenes';
import {Sci} from '../iceberg/Sci';
import {SFX, dbAt} from './sfx';
import {BigText, C, Calendar, DimArrow, FONT_DISPLAY, INK_W, Pill as BasePill, Puffs, Sunburst} from '../iceberg/art';
import {clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake} from '../iceberg/anim';
import {
  Arrow,
  Bar,
  Barrel,
  Bin,
  Earth,
  HeavyRocket,
  House,
  MARS,
  Orbit,
  Planet,
  Probe,
  Rocket,
  Shuttle,
  SpaceBg,
  Stamp,
  Sun,
  TrashBag,
  TrashHeap,
  VENUS,
} from './space';

export const DURATION_FRAMES = Math.ceil(END * FPS);

// Labels a bit larger than in the Shorts so they read on a phone in landscape.
const Pill: React.FC<React.ComponentProps<typeof BasePill>> = (p) => <BasePill {...p} size={(p.size ?? 54) * 1.18} />;

const W = 1920;
const H = 1080;

// ------------------------------------------------------------------ fonts
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

// ------------------------------------------------------------------ stage helpers
const Stage: React.FC<{cam?: {x?: number; y?: number; s?: number}; children: React.ReactNode}> = ({cam = {}, children}) => {
  const {x = W / 2, y = H / 2, s = 1} = cam;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px) scale(${s}) translate(${-x}px, ${-y}px)`}}>
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
const punch = (t: number, t0: number) => 1 + 0.04 * (1 - easeOutCubic(clamp((t - t0) / 0.35)));
const blink = (t: number, period = 3.7, off = 0) => {
  const d = (((t + off) % period) + period) % period;
  return d < 0.12 ? Math.abs(d - 0.06) / 0.06 : 1;
};

// Ground strip for the Earth-side scenes.
const Ground: React.FC<{y: number; color?: string}> = ({y, color = '#8CCB6B'}) => (
  <g>
    <rect x={-3000} y={y} width={9000} height={2000} fill={color} />
    <line x1={-3000} x2={6000} y1={y} y2={y} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// Smoke from an open fire on the heap.
const Fire: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Puffs x={-10} y={-60} t={t} color="#8E8E96" n={6} rise={320} />
    {[0, 1, 2].map((i) => {
      const h = 90 + 26 * Math.sin(t * 9 + i * 2);
      return <path key={i} d={`M ${-50 + i * 50} 0 Q ${-70 + i * 50} ${-h * 0.6} ${-30 + i * 50 + 10 * Math.sin(t * 7 + i)} ${-h} Q ${-10 + i * 50} ${-h * 0.5} ${-10 + i * 50} 0 Z`} fill={i === 1 ? C.gold : C.red} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />;
    })}
  </g>
);

// ================================================================== scenes


// 1. Two billion tonnes of trash ------------------------------------------------
const IntroScene: React.FC<{t: number}> = ({t}) => {
  const grow = lerp(0.25, 1, prog(t, 0.2, ph('trash') + 0.6, easeOutCubic));
  const bigger = 1 + 0.32 * prog(t, ph('three point four'), ph('2050') + 0.5, easeOutBack);
  const pan = prog(t, ph('some of it ends up') - 0.4, ph('rivers') + 0.6);
  const fire = t > ph('burned') - 0.1;
  const panStart = ph('some of it ends up') - 0.4;
  const away = 1 - prog(t, panStart - 0.35, panStart, (u) => u);
  return (
    <Stage cam={{x: lerp(960, 1900, pan), s: punch(t, 0)}}>
      <Layer>
        <rect x={-500} y={-500} width={4000} height={2200} fill={C.sky} />
        <Ground y={860} />
        {/* river / sea on the right */}
        <path d={`M 2100 860 Q 2200 900 2300 860 L 3600 860 L 3600 1400 L 2050 1400 Z`} fill="#3E8EDE" />
        <path d={`M 2100 860 Q 2200 900 2300 860 L 3600 860`} stroke={C.ink} strokeWidth={INK_W} fill="none" />
        {[0, 1, 2, 3, 4].map((i) => (
          <TrashBag key={i} x={2300 + i * 150 + Math.sin(t * 1.3 + i) * 20} y={900 + (i % 2) * 70 + Math.sin(t * 2 + i) * 6} s={0.7} rot={Math.sin(t + i) * 12} />
        ))}
        <g transform={`translate(1060 860) scale(${bigger}) translate(-1060 -860)`}>
          <TrashHeap x={1060} y={860} s={1.05} grow={grow} t={t} />
          {fire && <Fire x={1120} y={500} t={t} s={pop(t, ph('burned') - 0.1, 0.4)} />}
        </g>
        <Pill x={1060} y={150} text="2 BILLION TONNES A YEAR" s={pop(t, ph('two billion')) * away} size={56} />
        <Pill x={1060} y={260} text="WORLD BANK" s={pop(t, ph("world bank's")) * 0.8 * away} bg={C.paper} size={44} />
        <Pill x={1400} y={400} text="3.4 BILLION BY 2050" s={pop(t, ph('three point four')) * away} bg={C.red} fg={C.paper} size={50} />
        <Pill x={2250} y={260} text="RIVERS AND OCEANS" s={pop(t, ph('rivers') + 0.6)} bg={C.paper} size={50} />
      </Layer>
      <Sci t={t} x={330} y={1010} headR={58} poses={[[0, 'present'], [ph('landfills'), 'nervous']]} />
    </Stage>
  );
};

// 2. The Sun and the obvious fix (one continuous space shot) ---------------------
const SunScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.sun;
  const open = pop(t, ph('star') - 0.2, 0.5);
  const rockets = [0, 1, 2].map((i) => {
    const st = ph('load the trash') + 0.25 + i * 0.75;
    return {st, u: clamp((t - st) / 2.6)};
  });
  const missT = ph('it sounds simple');
  const miss = clamp((t - missT) / 4.2);
  const earth = {x: 330, y: 560};
  const sun = {x: 1500, y: 520, r: 250};
  const mood = t > ph('heat') ? 'smug' : t > missT ? 'happy' : t > ph('burn') ? 'surprised' : 'happy';
  // missing rocket: heads for the Sun but its sideways speed carries it around (curved path)
  const ang = lerp(Math.PI, Math.PI * 2.3, easeInOutCubic(miss));
  const missX = sun.x + Math.cos(ang) * lerp(1170, 430, Math.min(1, miss * 1.4));
  const missY = sun.y + Math.sin(ang) * lerp(40, 430, Math.min(1, miss * 1.4));
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Sun x={sun.x} y={sun.y} r={sun.r} t={t} face={{mood, open: Math.min(1, open) * blink(t), look: {x: -1, y: 0}}} />
        <Earth x={earth.x} y={earth.y} r={70} rot={t * 0.05} />
        <DimArrow x1={430} y1={860} x2={1230} y2={860} label="150 MILLION KM" grow={prog(t, ph('hundred and fifty'), ph('kilometers') + 0.2)} labelS={pop(t, ph('kilometers'))} />
        {t < missT &&
          rockets.map((r, i) =>
            r.u > 0 && r.u < 1 ? (
              <Rocket key={i} x={lerp(earth.x + 60, sun.x - sun.r, r.u)} y={lerp(earth.y - 20, sun.y - 60 + i * 60, r.u)} s={0.42} rot={90} flame={1} t={t} bag />
            ) : null,
          )}
        {t > missT && miss < 1 && (
          <g>
            <Rocket x={missX} y={missY} s={0.42} rot={(ang * 180) / Math.PI + 180} flame={0.8} t={t} bag />
          </g>
        )}
        <Pill x={960} y={120} text="THE OBVIOUS FIX" s={pop(t, ph('obvious fix')) * (t < missT ? 1 : 0)} size={56} />
        <Pill x={960} y={120} text="ONE OF THE HARDEST PLACES TO REACH" s={pop(t, ph('hardest')) * (t < ph('heat') ? 1 : 0)} bg={C.paper} size={50} />
        {t > ph('heat') && <Stamp x={1500} y={150} text="NOT THE HEAT" s={pop(t, ph('heat'), 0.35) * 0.9} />}
      </Layer>
      <Sci t={t} x={170} y={1040} headR={52} poses={[[0, 'present'], [ph('obvious fix') - 0.1, 'throw'], [ph('it sounds simple'), 'think']]} />
    </Stage>
  );
};

// Top-down solar system helpers (Sun at centre).
const SUN_C = {x: 960, y: 540};
const ORBIT_R = 400;
const earthAt = (a: number) => ({x: SUN_C.x + Math.cos(a) * ORBIT_R, y: SUN_C.y + Math.sin(a) * ORBIT_R});

// 3. Earth races around the Sun; everything rides along; orbits -------------------
const OrbitScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.orbit;
  const a = -Math.PI / 2 - 0.25 + (t - t0) * 0.09;
  const e = earthAt(a);
  const tang = {x: -Math.sin(a), y: Math.cos(a)};
  const zoomIn = prog(t, ph('everything on earth') - 0.3, ph('everything on earth') + 0.8);
  const zoomOut = prog(t, ph('so when a rocket') - 0.2, ph('so when a rocket') + 1.2);
  const z = zoomIn * (1 - zoomOut);
  const camS = lerp(1, 3.2, z) * punch(t, t0);
  const cam = {x: lerp(SUN_C.x, e.x, z), y: lerp(SUN_C.y, e.y, z)};
  const er = 60;
  // rocket leaving Earth: moves outward a little, then rides alongside
  const lt = ph('leaves earth');
  const ru = clamp((t - lt) / 1.6);
  const rocketA = a + 0.02 * ru;
  const rocketR = ORBIT_R + lerp(0, 110, easeOutCubic(ru));
  const rocket = {x: SUN_C.x + Math.cos(rocketA) * rocketR, y: SUN_C.y + Math.sin(rocketA) * rocketR};
  const showRocket = t > lt - 0.05 && t < ph("that's also why earth");
  const gravity = t > ph('fall into the sun');
  const trailOn = t > ph('keeps missing') - 0.3;
  const icons = [
    {w: 'you', k: -0.9},
    {w: 'house', k: -0.3},
    {w: 'trash', k: 0.3},
    {w: 'rocket', k: 0.9},
  ];
  return (
    <Stage cam={{x: cam.x, y: cam.y, s: camS}}>
      <Layer>
        <SpaceBg t={t} />
        <Orbit cx={SUN_C.x} cy={SUN_C.y} rx={ORBIT_R} ry={ORBIT_R} />
        {trailOn && (
          <path
            d={`M ${earthAt(a - 1.4).x} ${earthAt(a - 1.4).y} A ${ORBIT_R} ${ORBIT_R} 0 0 1 ${e.x} ${e.y}`}
            stroke={C.yellow}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            opacity={prog(t, ph('keeps missing') - 0.3, ph('keeps missing') + 0.4)}
          />
        )}
        <Sun x={SUN_C.x} y={SUN_C.y} r={110} t={t} face={{mood: 'happy', open: blink(t), look: {x: (e.x - SUN_C.x) / ORBIT_R, y: (e.y - SUN_C.y) / ORBIT_R}}} />
        {gravity && <Arrow x1={e.x + (SUN_C.x - e.x) * 0.15} y1={e.y + (SUN_C.y - e.y) * 0.15} x2={e.x + (SUN_C.x - e.x) * 0.15 + (SUN_C.x - e.x) * 0.35 * pop(t, ph('fall into the sun'))} y2={e.y + (SUN_C.y - e.y) * 0.15 + (SUN_C.y - e.y) * 0.35 * pop(t, ph('fall into the sun'))} color={C.red} />}
        {z < 0.9 && <Arrow x1={e.x + tang.x * 80} y1={e.y + tang.y * 80} x2={e.x + tang.x * (80 + 230 * pop(t, ph('racing') - 0.1))} y2={e.y + tang.y * (80 + 230 * pop(t, ph('racing') - 0.1))} />}
        <Earth x={e.x} y={e.y} r={er} rot={(t - t0) * 0.3} face={{mood: 'happy', open: blink(t, 4.1, 1)}} />
        {icons.map((ic, i) => {
          const s = pop(t, ph(ic.w, ph('everything on earth')) - 0.05) * (1 - zoomOut);
          if (s <= 0) return null;
          const ang = a - Math.PI + ic.k * 0.9; // on the far side from the Sun (outward)
          const nx = Math.cos(a + ic.k * 0.7);
          const ny = Math.sin(a + ic.k * 0.7);
          const px = e.x + nx * (er + 14);
          const py = e.y + ny * (er + 14);
          const rot = (Math.atan2(ny, nx) * 180) / Math.PI + 90;
          void ang;
          return (
            <g key={i} transform={`translate(${px} ${py}) rotate(${rot}) scale(${0.22 * s})`}>
              {ic.w === 'you' && <circle cx={0} cy={-40} r={40} fill={C.paper} stroke={C.ink} strokeWidth={12} />}
              {ic.w === 'house' && <House x={0} y={0} s={1} />}
              {ic.w === 'trash' && <TrashBag x={0} y={-60} s={1} />}
              {ic.w === 'rocket' && <Rocket x={0} y={-90} s={0.6} />}
            </g>
          );
        })}
        {showRocket && <Rocket x={rocket.x} y={rocket.y} s={0.34} rot={(Math.atan2(tang.y, tang.x) * 180) / Math.PI + 90} bag />}
        {showRocket && ru > 0.6 && <Arrow x1={rocket.x + tang.x * 40} y1={rocket.y + tang.y * 40} x2={rocket.x + tang.x * 210} y2={rocket.y + tang.y * 210} w={16} head={36} />}
        {z < 0.2 && (
          <g>
            <Pill x={1500} y={150} text="30 KM/S" s={pop(t, ph('thirty kilometers')) * (t < ph('sixty-seven') ? 1 : 0)} size={50} />
            <Pill x={1500} y={150} text="67,000 MPH" s={pop(t, ph('sixty-seven')) * (t < ph("and here's") ? 1 : 0)} size={50} />
          </g>
        )}
        {showRocket && ru > 0.6 && <Pill x={rocket.x + tang.x * 120 + 150} y={rocket.y + tang.y * 120 - 60} text="ALREADY 30 KM/S" s={pop(t, ph('already flying'))} size={44} />}
        {gravity && <Pill x={e.x + (SUN_C.x - e.x) * 0.55 + 110} y={e.y + (SUN_C.y - e.y) * 0.55} text="GRAVITY" s={pop(t, ph('fall into the sun')) * 0.8} bg={C.red} fg={C.paper} size={44} />}
        <Pill x={1400} y={110} text="THAT'S AN ORBIT" s={pop(t, ph('orbit is'))} size={56} />
        <Pill x={1400} y={110} text="FALLING... AND MISSING" s={pop(t, ph('it is falling')) * (t < ph('orbit is') ? 1 : 0)} bg={C.paper} size={48} />
      </Layer>
    </Stage>
  );
};

// 4. The train analogy -----------------------------------------------------------
const TrainScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.train;
  const speed = 900; // ground scroll px/s
  const scroll = (t - t0) * speed;
  const dropT = ph('drop a ball') + 0.15;
  const d = t - dropT;
  const carX = 760;
  const winY = 560;
  const ballY = d > 0 ? Math.min(winY + 0.5 * 2600 * d * d, 880) : winY;
  const landed = ballY >= 880;
  // after landing the ball stays on the ground, which scrolls away to the left
  const landT = dropT + Math.sqrt((880 - winY) / 1300);
  const ballX = landed ? carX + 40 - (t - landT) * speed : carX + 40;
  const ghostX = carX + 40 - Math.max(0, d) * speed; // where "straight down next to you" would be on the ground
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-500} y={-500} width={3000} height={2200} fill={C.sky} />
        {/* far hills */}
        {Array.from({length: 6}).map((_, i) => {
          const x = ((i * 520 - scroll * 0.2) % 3120 + 3120) % 3120 - 600;
          return <ellipse key={i} cx={x} cy={760} rx={340} ry={170} fill="#7CC07A" stroke={C.ink} strokeWidth={INK_W} />;
        })}
        <Ground y={880} color="#B9DB8A" />
        {/* posts along the track show the speed */}
        {Array.from({length: 12}).map((_, i) => {
          const x = ((i * 260 - scroll) % 3120 + 3120) % 3120 - 600;
          return <rect key={i} x={x} y={820} width={18} height={70} fill="#8A5A34" stroke={C.ink} strokeWidth={5} />;
        })}
        <rect x={-500} y={890} width={3000} height={16} fill="#6B6B73" />
        {/* train car */}
        <g transform={`translate(0 ${Math.sin(t * 22) * 2})`}>
          <rect x={carX - 520} y={470} width={1040} height={380} rx={40} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
          <rect x={carX - 520} y={760} width={1040} height={40} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          {[-360, -120, 120, 360].map((wx) => (
            <rect key={wx} x={carX + wx - 80} y={510} width={160} height={130} rx={18} fill={C.sky} stroke={C.ink} strokeWidth={6} />
          ))}
          {[-380, -260, 260, 380].map((wx) => (
            <circle key={wx} cx={carX + wx} cy={870} r={40} fill={C.ink} />
          ))}
        </g>
        {/* the ball */}
        {t > dropT - 0.6 && <circle cx={ballX} cy={ballY} r={26} fill={C.yellow} stroke={C.ink} strokeWidth={6} />}
        {/* what people expect: straight down beside you */}
        {t > ph("doesn't fall straight") - 0.1 && t < ph("it keeps the train's") + 0.3 && (
          <g opacity={0.9}>
            <line x1={ghostX} y1={winY} x2={ghostX} y2={880} stroke={C.paper} strokeWidth={8} strokeDasharray="16 14" />
            <path d={`M ${ghostX - 26} 830 L ${ghostX + 26} 880 M ${ghostX + 26} 830 L ${ghostX - 26} 880`} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
          </g>
        )}
        <Pill x={1300} y={180} text="KEEPS THE TRAIN'S SPEED" s={pop(t, ph("keeps the train's"))} size={50} />
        <Arrow x1={1180} y1={360} x2={1180 + 340 * pop(t, ph('fast train'))} y2={360} />
      </Layer>
    </Stage>
  );
};

// 5. Trash just circles the Sun with us --------------------------------------------
const CircleScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.circle;
  const a = -Math.PI / 2 - 0.6 + (t - t0) * 0.12;
  const e = earthAt(a);
  const bagA = a - 0.42 * clamp((t - t0) / 1.2);
  const b = {x: SUN_C.x + Math.cos(bagA) * ORBIT_R, y: SUN_C.y + Math.sin(bagA) * ORBIT_R};
  const noDrop = t > ph("doesn't drop toward") - 0.1 && t < ph('it just keeps circling');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Orbit cx={SUN_C.x} cy={SUN_C.y} rx={ORBIT_R} ry={ORBIT_R} />
        <Sun x={SUN_C.x} y={SUN_C.y} r={110} t={t} face={{mood: 'smug', open: blink(t)}} />
        <Earth x={e.x} y={e.y} r={60} rot={t * 0.3} face={{mood: 'happy'}} />
        {noDrop && (
          <g>
            <line x1={b.x} y1={b.y} x2={b.x + (SUN_C.x - b.x) * 0.65} y2={b.y + (SUN_C.y - b.y) * 0.65} stroke={C.paper} strokeWidth={8} strokeDasharray="18 14" />
            <g transform={`translate(${b.x + (SUN_C.x - b.x) * 0.45} ${b.y + (SUN_C.y - b.y) * 0.45}) scale(${pop(t, ph("doesn't drop toward"))})`}>
              <path d="M -34 -34 L 34 34 M 34 -34 L -34 34" stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
              <path d="M -34 -34 L 34 34 M 34 -34 L -34 34" stroke={C.red} strokeWidth={14} strokeLinecap="round" />
            </g>
          </g>
        )}
        {t > ph('it just keeps circling') && (
          <path d={`M ${SUN_C.x + Math.cos(bagA - 1.2) * ORBIT_R} ${SUN_C.y + Math.sin(bagA - 1.2) * ORBIT_R} A ${ORBIT_R} ${ORBIT_R} 0 0 1 ${b.x} ${b.y}`} stroke={C.yellow} strokeWidth={8} fill="none" strokeLinecap="round" />
        )}
        <TrashBag x={b.x} y={b.y} s={0.75} rot={Math.sin(t * 2) * 14} face={{mood: 'happy', look: {x: -0.5, y: 0}}} />
        <Pill x={1420} y={120} text="RIGHT ALONGSIDE US" s={pop(t, ph('alongside'))} size={52} />
      </Layer>
    </Stage>
  );
};

// 6. Cancel the sideways speed -----------------------------------------------------
const CancelScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.cancel;
  const slowT = ph('slow down');
  const lotT = ph('by a lot');
  const vel = 1 - 0.55 * prog(t, slowT, lotT) - 0.42 * prog(t, lotT, lotT + 1.4);
  // path: once slowed it falls in towards the Sun
  const fall = prog(t, lotT + 0.2, S.parker, (u) => u * u);
  const a = -Math.PI / 2 + 0.3 + (t - t0) * 0.07 * Math.max(0.2, vel);
  const r = lerp(ORBIT_R, 120, fall);
  const p = {x: SUN_C.x + Math.cos(a) * r, y: SUN_C.y + Math.sin(a) * r};
  const tang = {x: -Math.sin(a), y: Math.cos(a)};
  const retro = t > slowT - 0.1;
  const rot = (Math.atan2(tang.y, tang.x) * 180) / Math.PI + 90;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Orbit cx={SUN_C.x} cy={SUN_C.y} rx={ORBIT_R} ry={ORBIT_R} />
        <Sun x={SUN_C.x} y={SUN_C.y} r={110} t={t} face={{mood: fall > 0.5 ? 'surprised' : 'happy', open: blink(t)}} />
        <Arrow x1={p.x + tang.x * 50} y1={p.y + tang.y * 50} x2={p.x + tang.x * (50 + 260 * vel)} y2={p.y + tang.y * (50 + 260 * vel)} />
        {/* engine fired forwards to brake */}
        <g transform={`translate(${p.x} ${p.y}) rotate(${retro ? rot + 180 : rot})`}>
          <Rocket x={0} y={0} s={0.46} flame={retro && vel > 0.08 ? 1 : 0} t={t} bag />
        </g>
        <g transform="translate(1560 300)">
          <g transform={`scale(${pop(t, ph('not speed up'))})`}>
            <Pill x={0} y={0} text="SPEED UP" bg={C.paper} size={52} />
            <path d="M -170 -10 L 170 10" stroke={C.red} strokeWidth={14} strokeLinecap="round" />
          </g>
          <Pill x={0} y={150} text="SLOW DOWN" s={pop(t, slowT)} bg={C.green} size={58} />
          <Pill x={0} y={290} text="BY A LOT" s={pop(t, lotT)} size={52} />
        </g>
        <Pill x={640} y={120} text="CANCEL THE SIDEWAYS SPEED" s={pop(t, ph('cancel'))} size={46} />
      </Layer>
    </Stage>
  );
};

// 7. Parker Solar Probe -----------------------------------------------------------
const ParkerScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.parker;
  const fly = (t - t0) / (S.energy - t0);
  const px = lerp(260, 1050, easeInOutCubic(clamp(fly)));
  const py = 560 + Math.sin(t * 1.5) * 10;
  const shed = prog(t, ph('get rid of'), ph('sideways speed', ph('get rid of')) + 0.3);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Sun x={1720} y={560} r={330} t={t} face={{mood: 'surprised', open: blink(t), look: {x: -1, y: 0}}} />
        <Probe x={px} y={py} s={1.6} rot={180} glow={fly} />
        <Arrow x1={px - 170} y1={py + 220} x2={px - 170 + 420 * (1 - 0.82 * shed)} y2={py + 220} color={C.yellow} />
        <Pill x={px} y={py + 320} text="−53,000 MPH" s={pop(t, ph('fifty-three thousand'))} bg={C.red} fg={C.paper} size={50} />
        <Pill x={620} y={130} text="NASA PARKER SOLAR PROBE" s={pop(t, ph('parker solar probe'))} size={50} />
        <Pill x={620} y={240} text="LAUNCHED 2018" s={pop(t, ph('2018'))} bg={C.paper} size={44} />
        <Pill x={620} y={350} text="DIDN'T EVEN NEED TO HIT IT" s={pop(t, ph("didn't even need"))} bg={C.paper} size={44} />
      </Layer>
    </Stage>
  );
};

// 8. 55 times the energy of a Mars trip ------------------------------------------
const EnergyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.energy;
  const mars = prog(t, ph('reaching mars') - 0.2, ph('reaching mars') + 0.3);
  const sun = prog(t, ph('reaching the sun'), ph('fifty-five') + 1.2, easeOutCubic);
  const unit = 26;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <BigText x={960} y={190} text="ENERGY NEEDED" size={90} />
        <Planet x={190} y={430} r={46} color={MARS} />
        <Bar x={330} y={395} w={unit} color={MARS} label="" value="MARS" grow={mars} h={74} />
        <Sun x={190} y={680} r={56} t={t} face={{mood: 'smug'}} />
        <Bar x={330} y={645} w={unit * 55} color={'#FFC93C'} label="" value="" grow={sun} h={74} />
        {sun > 0.98 && <Pill x={1450} y={800} text="55× MORE" s={pop(t, ph('fifty-five') + 1.2)} bg={C.red} fg={C.paper} size={60} />}
        <text x={960} y={1000} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={34} fill={C.paper} opacity={0.85}>
          SOURCE: NASA
        </text>
      </Layer>
    </Stage>
  );
};

// 9. Seven Venus flybys, six years, closest approach -------------------------------
const VenusScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.venus;
  const loopsStart = ph('swung past venus');
  const loopsEnd = ph('it took six years') - 0.2;
  const prg = clamp((t - loopsStart) / (loopsEnd - loopsStart));
  const n = Math.min(7, Math.floor(prg * 7 + (prg > 0 ? 1 : 0)));
  const vr = 250;
  const va = (t - t0) * 0.6;
  // probe orbit: ellipse whose closest point shrinks with every flyby
  const peri = lerp(230, 70, prg);
  const apo = vr + 10;
  const ea = (t - t0) * 2.2;
  const rx = (peri + apo) / 2;
  const cxo = SUN_C.x + (apo - peri) / 2;
  const ry = Math.sqrt(peri * apo);
  const pxy = {x: cxo + Math.cos(ea) * rx, y: SUN_C.y + Math.sin(ea) * ry};
  const zoom = prog(t, ph('christmas eve') - 0.2, ph('christmas eve') + 1.6);
  const calS = pop(t, ph('it took six years') - 0.05);
  const calLabel = t > ph('six years') + 0.3 ? '2024' : '2018';
  return (
    <AbsoluteFill>
    <Stage cam={{x: 960, y: 540, s: lerp(1.2, 1.55, zoom) * punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Orbit cx={SUN_C.x} cy={SUN_C.y} rx={ORBIT_R + 40} ry={ORBIT_R + 40} opacity={0.5} />
        <Orbit cx={SUN_C.x} cy={SUN_C.y} rx={vr} ry={vr} color={VENUS} />
        <ellipse cx={cxo} cy={SUN_C.y} rx={rx} ry={ry} fill="none" stroke={C.yellow} strokeWidth={4} opacity={0.8} />
        <Sun x={SUN_C.x} y={SUN_C.y} r={62} t={t} face={{mood: zoom > 0.5 ? 'surprised' : 'happy', open: blink(t)}} />
        <Planet x={SUN_C.x + Math.cos(va) * vr} y={SUN_C.y + Math.sin(va) * vr} r={30} color={VENUS} face={{mood: 'happy'}} />
        <Probe x={pxy.x} y={pxy.y} s={0.32} rot={(Math.atan2(SUN_C.y - pxy.y, SUN_C.x - pxy.x) * 180) / Math.PI + 180} glow={prg} />
        <Pill x={640} y={190} text={`VENUS FLYBYS: ${n}/7`} s={pop(t, ph('borrowed help')) * (zoom < 0.3 ? 1 : 0)} size={50} />
        {calS > 0 && zoom < 0.4 && <Calendar x={1500} y={320} s={calS * 0.7} label={calLabel} flip={t > ph('six years') && t < ph('six years') + 0.3 ? (t - ph('six years')) / 0.3 : 0} prev="2018" />}
      </Layer>
    </Stage>
      {zoom > 0.3 && (
        <Layer>
          <Pill x={960} y={110} text="DEC 24, 2024" s={pop(t, ph('christmas eve') + 0.3)} size={56} />
          <Pill x={620} y={980} text="3.8 MILLION MILES FROM THE SURFACE" s={pop(t, ph('three point eight')) * 0.8} bg={C.paper} size={44} />
          <Pill x={1500} y={980} text="430,000 MPH" s={pop(t, ph('four hundred and thirty'))} bg={C.red} fg={C.paper} size={50} />
          {t > ph('no spacecraft') && <Stamp x={1500} y={330} text="CLOSEST EVER" s={pop(t, ph('no spacecraft'), 0.35) * 0.7} color={C.green} />}
        </Layer>
      )}
    </AbsoluteFill>
  );
};

// 10. Easier to leave the solar system than to hit the Sun --------------------------
const EscapeScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.escape;
  const esc = prog(t, ph('twelve extra') - 0.2, ph('twelve extra') + 0.8);
  const hit = prog(t, ph('falling straight into'), ph("earth's thirty") + 0.4);
  const unit = 40;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <BigText x={960} y={170} text="EASIER TO LEAVE THAN TO HIT" size={78} fill={C.yellow} />
        <Bar x={720} y={380} w={unit * 12} color={C.green} label="LEAVE THE SOLAR SYSTEM" value="+12 KM/S" grow={esc} h={84} />
        <Bar x={720} y={600} w={unit * 28.5} color={C.red} label="HIT THE SUN" value="" grow={hit} h={84} />
        {hit > 0.98 && <Pill x={1300} y={770} text="ALMOST ALL OF 30 KM/S" s={pop(t, ph("earth's thirty"))} size={46} />}
        <text x={960} y={1010} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={30} fill={C.paper} opacity={0.8}>
          SPEED CHANGE NEEDED, STARTING FROM EARTH'S ORBIT (ROUGH FIGURES)
        </text>
      </Layer>
      <Sci t={t} x={180} y={1060} headR={46} poses={[[0, 'think'], [ph("it's actually easier"), 'shocked']]} />
    </Stage>
  );
};

// 11. The trash math ---------------------------------------------------------------
const MathScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.math;
  const heavyS = pop(t, ph('falcon heavy') - 0.1, 0.5);
  const calcT = ph('two billion tonnes', S.math);
  const showEq = t > calcT - 0.1;
  const perDay = ph('eighty-six thousand');
  const stream = t > perDay - 0.2;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={960} cy={1300} />
        <rect x={-200} y={930} width={2400} height={400} fill={C.yellow} />
        <line x1={-200} x2={2200} y1={930} y2={930} stroke={C.ink} strokeWidth={INK_W} />
        {!showEq && (
          <g>
            <Earth x={1520} y={500} r={170} rot={t * 0.05} />
            <Orbit cx={1520} cy={500} rx={235} ry={235} color={C.paper} />
            {[0, 1, 2, 3].map((i) => {
              const a = t * 0.8 + (i * Math.PI) / 2;
              return <TrashBag key={i} x={1520 + Math.cos(a) * 235} y={500 + Math.sin(a) * 235} s={0.35 * pop(t, ph('low earth orbit') + i * 0.1)} />;
            })}
            <Pill x={1500} y={160} text="LOW EARTH ORBIT" s={pop(t, ph('low earth orbit'))} size={46} />
            <Pill x={1440} y={830} text="A FEW HUNDRED KM UP" s={pop(t, ph('a few hundred'))} bg={C.paper} size={42} />
            {heavyS > 0 && (
              <g>
                <HeavyRocket x={880} y={760} s={1.25 * heavyS} />
                <Pill x={760} y={120} text="FALCON HEAVY" s={heavyS} size={50} />
                <Pill x={760} y={225} text="~64 TONNES TO ORBIT" s={pop(t, ph('sixty-four tonnes'))} bg={C.paper} size={42} />
              </g>
            )}
          </g>
        )}
        {showEq && (
          <g>
            <BigText x={1150} y={250} text="2,000,000,000 T ÷ 64 T" size={78} s={pop(t, calcT)} />
            <BigText x={1150} y={420} text="ABOUT 31 MILLION LAUNCHES" size={72} fill={C.yellow} s={pop(t, ph('thirty-one million'))} />
            <Pill x={1150} y={545} text="FOR ONE YEAR OF TRASH" s={pop(t, ph('for one year'))} bg={C.paper} size={44} />
            <Pill x={1150} y={670} text="ABOUT 86,000 LAUNCHES A DAY" s={pop(t, perDay)} bg={C.red} fg={C.paper} size={52} />
            {stream &&
              Array.from({length: 14}).map((_, i) => {
                const u = ((t - perDay) * 0.8 + i / 14) % 1;
                const x = 640 + i * 90 + Math.sin(i * 3) * 20;
                return <Rocket key={i} x={x} y={930 - u * 1200} s={0.25} flame={1} t={t + i} bag />;
              })}
          </g>
        )}
      </Layer>
      <Sci t={t} x={220} y={1050} headR={50} poses={[[0, 'present'], [calcT - 0.15, 'calc'], [perDay, 'shocked']]} />
    </Stage>
  );
};

// 12. Compared with a record year ---------------------------------------------------
const CompareScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.compare;
  const a = prog(t, ph('two hundred and sixty') - 0.2, ph('orbital launches') + 0.2);
  const b = prog(t, ph('two hundred and sixty') + 0.6, ph('record') + 0.6, (u) => u);
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={960} cy={1300} />
        <BigText x={960} y={180} text="LAUNCHES PER YEAR" size={86} />
        <Bar x={640} y={360} w={6} color={C.teal} label="2024 (A RECORD)" value="ABOUT 260" grow={a} h={84} />
        <Bar x={640} y={560} w={2000} color={C.red} label="TRASH PLAN" value="" grow={b} h={84} />
        {b > 0.3 && <Pill x={1380} y={720} text="ABOUT 31,000,000" s={pop(t, ph('two hundred and sixty') + 1.0)} bg={C.red} fg={C.paper} size={56} />}
      </Layer>
    </Stage>
  );
};

// 13. Only to orbit; a Sun rocket carries far less ---------------------------------
const OnlyOrbitScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.onlyOrbit;
  const sunPart = t > ph('a rocket heading for the sun') - 0.1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Earth x={560} y={560} r={210} rot={t * 0.05} face={{mood: 'happy', open: blink(t)}} />
        <Orbit cx={560} cy={560} rx={280} ry={280} color={C.paper} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = t * 0.6 + (i * Math.PI) / 3;
          return <TrashBag key={i} x={560 + Math.cos(a) * 280} y={560 + Math.sin(a) * 280} s={0.3} />;
        })}
        <Pill x={560} y={950} text="ONLY TO ORBIT" s={pop(t, ph('only to orbit'))} size={52} />
        {sunPart && (
          <g>
            <Rocket x={1380} y={640} s={1.25 * pop(t, ph('a rocket heading for the sun') - 0.1)} bag />
            <Pill x={1330} y={170} text="TO THE SUN: MUCH LESS CARGO" s={pop(t, ph('small part'))} bg={C.paper} size={40} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// 14. Launch failure ------------------------------------------------------------------
const FailScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fail;
  const launch = ph('a rocket full of trash') - 0.6;
  const boomT = ph('breaks apart');
  const up = clamp((t - launch) / (boomT - launch));
  const ry = lerp(880, 300, up * up);
  const boom = t > boomT;
  const d = t - boomT;
  const sh = boom && d < 0.6 ? shake(t, 14 * (1 - d / 0.6)) : {x: 0, y: 0};
  return (
    <Stage cam={{x: 960 - sh.x, y: 540 - sh.y, s: punch(t, t0)}}>
      <Layer>
        <rect x={-500} y={-500} width={3000} height={2200} fill={C.sky} />
        <path d="M -200 880 L 1100 880 L 1100 1400 L -200 1400 Z" fill="#8CCB6B" />
        <path d="M 1100 880 L 2200 880 L 2200 1400 L 1100 1400 Z" fill="#3E8EDE" />
        <line x1={-200} x2={2200} y1={880} y2={880} stroke={C.ink} strokeWidth={INK_W} />
        {/* launch pad */}
        <rect x={900} y={860} width={160} height={24} fill={C.chromeShade} stroke={C.ink} strokeWidth={5} />
        {!boom && <Rocket x={980} y={ry} s={0.9} flame={t > launch ? 1 : 0} t={t} bag />}
        {boom && d < 1.2 && (
          <g transform={`translate(980 300) scale(${Math.min(1.4, d * 5)})`} opacity={1}>
            {Array.from({length: 9}).map((_, i) => {
              const a = (i / 9) * Math.PI * 2;
              return <circle key={i} cx={Math.cos(a) * 70} cy={Math.sin(a) * 70} r={70} fill={i % 2 ? C.gold : C.red} stroke={C.ink} strokeWidth={6} />;
            })}
            <circle r={80} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
          </g>
        )}
        {boom &&
          Array.from({length: 12}).map((_, i) => {
            const vx = (rnd(i) - 0.5) * 900;
            const vy = -300 - rnd(i + 5) * 500;
            const x = 980 + vx * d;
            const y = Math.min(300 + vy * d + 0.5 * 900 * d * d, 900 + (i % 3) * 20);
            return <TrashBag key={i} x={x} y={y} s={0.5} rot={d * 200 * (i % 2 ? 1 : -1)} />;
          })}
        <Pill x={640} y={160} text="MORE RELIABLE THAN EVER" s={pop(t, ph('far more reliable'))} bg={C.paper} size={46} />
        <Pill x={640} y={270} text="...BUT LAUNCHES STILL FAIL" s={pop(t, ph('still fail'))} bg={C.red} fg={C.paper} size={46} />
        <Pill x={1500} y={160} text="SKY, SEA OR LAND" s={pop(t, ph('across the sky'))} size={48} />
      </Layer>
      <Sci t={t} x={300} y={1040} headR={52} poses={[[0, 'think'], [boomT, 'nervous']]} tremble={boom ? 1 : 0} />
    </Stage>
  );
};

// 15. NASA's nuclear waste studies ------------------------------------------------------
const HistoryScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.history;
  const studyT = ph('1973 study');
  const reportT = ph('1981 report');
  const neverT = ph('nuclear waste never');
  const phase2 = t > studyT - 0.1;
  const phase3 = t > ph('safety and cost') - 0.6;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <Sunburst t={t} cx={960} cy={1300} />
        <rect x={-200} y={930} width={2400} height={400} fill={C.yellow} />
        <line x1={-200} x2={2200} y1={930} y2={930} stroke={C.ink} strokeWidth={INK_W} />
        <Pill x={960} y={110} text="NASA STUDIES, 1970s–EARLY 1980s" s={pop(t, ph('in the 1970s'))} size={50} />
        {!phase2 && (
          <g>
            <Barrel x={1020} y={930} s={1.6 * pop(t, ph('nuclear waste') - 0.1, 0.5)} />
            <Pill x={1300} y={400} text="NUCLEAR WASTE" s={pop(t, ph('nuclear waste'))} bg={C.paper} size={48} />
            <Pill x={1300} y={520} text="SMALL • DANGEROUS FOR A LONG TIME" s={pop(t, ph('small in volume')) * 0.8} size={40} />
          </g>
        )}
        {phase2 && !phase3 && (
          <g>
            <Stamp x={960} y={420} text="1973: INTO THE SUN? TOO MUCH ENERGY" s={pop(t, studyT, 0.35) * 0.7} size={64} />
            <g opacity={t > ph('pushing it out') ? 1 : 0}>
              <Barrel x={760} y={850} s={0.7} />
              <Arrow x1={880} y1={720} x2={880 + 700 * pop(t, ph('pushing it out'))} y2={720} color={C.green} />
              <Pill x={1300} y={820} text="OUT OF THE SOLAR SYSTEM?" s={pop(t, ph('pushing it out'))} bg={C.paper} size={44} />
            </g>
          </g>
        )}
        {phase3 && (
          <g>
            <Pill x={620} y={260} text="SAFETY" s={pop(t, ph('safety'))} bg={C.red} fg={C.paper} size={60} />
            <Pill x={1300} y={260} text="COST" s={pop(t, ph('cost'))} bg={C.red} fg={C.paper} size={60} />
            {t > reportT - 0.1 && (
              <g>
                <BigText x={960} y={470} text="1981: 8 TONNES A YEAR = 3 SHUTTLE LAUNCHES" size={56} s={pop(t, reportT)} />
                {[0, 1, 2].map((i) => (
                  <Shuttle key={i} x={760 + i * 200} y={790} s={0.9 * pop(t, ph('three space shuttle') + i * 0.15)} />
                ))}
              </g>
            )}
            {t > neverT && <Stamp x={1480} y={700} text="NEVER LAUNCHED" s={pop(t, neverT, 0.35) * 0.8} />}
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// 16. Recap ---------------------------------------------------------------------------
const RecapScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.recap;
  const items: Array<[string, string]> = [
    ['ALREADY MOVING AT 30 KM/S', 'already flying'],
    ['ENORMOUS ENERGY', 'enormous'],
    ['YEARS OF CAREFUL FLYING', 'years of careful'],
    ['A LAUNCH ABOUT EVERY SECOND', 'a launch about'],
  ];
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <SpaceBg t={t} />
        <Sun x={1500} y={560} r={260} t={t} face={{mood: 'smug', open: blink(t), look: {x: -1, y: 0}}} />
        <BigText x={620} y={190} text="WHY NOT?" size={110} fill={C.yellow} s={pop(t, t0 + 0.2)} />
        {items.map(([txt, w], i) => {
          const s = pop(t, ph(w, t0) - 0.05);
          return (
            <g key={i} transform={`translate(160 ${330 + i * 150}) scale(${s})`}>
              <circle cx={0} cy={0} r={34} fill={C.green} stroke={C.ink} strokeWidth={6} />
              <path d="M -16 2 L -4 14 L 18 -12" stroke={C.ink} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x={60} y={18} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={50} fill={C.paper} stroke={C.ink} strokeWidth={10} paintOrder="stroke fill">
                {txt}
              </text>
            </g>
          );
        })}
      </Layer>
    </Stage>
  );
};

// 17. The real problem is down here -----------------------------------------------------
const RealScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.real;
  const pie = prog(t, ph('a third or more') - 0.2, ph('a third or more') + 0.8);
  const ang = (pie * Math.PI * 2) / 3;
  const binsT = ph('collecting it');
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-500} y={-500} width={3000} height={2200} fill={C.sky} />
        <Ground y={880} />
        <TrashHeap x={1500} y={880} s={0.8} grow={1} t={t} />
        {t > ph('burned in the open') - 0.1 && <Fire x={1550} y={600} t={t} s={pop(t, ph('burned in the open') - 0.1, 0.4) * 0.8} />}
        {t < binsT && (
          <g transform="translate(1000 400)">
            <circle r={210} fill={C.paper} stroke={C.ink} strokeWidth={INK_W} />
            {pie > 0 && <path d={`M 0 0 L 0 -210 A 210 210 0 ${ang > Math.PI ? 1 : 0} 1 ${210 * Math.sin(ang)} ${-210 * Math.cos(ang)} Z`} fill={C.red} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />}
            <Pill x={0} y={300} text="1/3 OR MORE: NOT MANAGED PROPERLY" s={pop(t, ph('managed properly')) * 0.9} bg={C.paper} size={42} />
          </g>
        )}
        {t > binsT - 0.1 && (
          <g>
            <Bin x={620} y={880} s={1.2 * pop(t, binsT - 0.1)} color={C.teal} />
            <Bin x={860} y={880} s={1.2 * pop(t, ph('recycling it') - 0.1)} color={C.green} />
            <Bin x={1100} y={880} s={1.2 * pop(t, ph('burying it') - 0.1)} color={C.yellow} />
            <Pill x={860} y={300} text="COLLECT • RECYCLE • BURY SAFELY" s={pop(t, binsT)} size={48} />
          </g>
        )}
        {t > ph('actually works') - 0.1 && (
          <g transform={`translate(860 480) scale(${pop(t, ph('actually works') - 0.1)})`}>
            <circle r={90} fill={C.green} stroke={C.ink} strokeWidth={INK_W} />
            <path d="M -42 4 L -10 36 L 46 -30" stroke={C.ink} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </Layer>
      <Sci t={t} x={250} y={1010} headR={56} poses={[[0, 'point'], [ph('a lot less exciting'), 'think'], [ph('actually works') - 0.1, 'thumbs']]} />
    </Stage>
  );
};

// 18. Final gag: he throws a bag at the Sun; it comes back down into the bin ---------------
const FinalScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.final;
  const throwT = ph('aim at') + 0.1;
  const flight = 3.0;
  const u = clamp((t - throwT) / flight);
  // ballistic arc from the hand to the recycling bin
  const x0 = 470;
  const y0 = 560;
  const x1 = 1420;
  const y1 = 780;
  const ta = 0.42;
  const g = (2 * (y0 - y1)) / (ta * ta - (1 - ta) * (1 - ta));
  const ya = y0 - 0.5 * g * ta * ta;
  const bx = lerp(x0, x1, u);
  const by = ya + 0.5 * g * (u - ta) * (u - ta);
  const inBin = u >= 1;
  return (
    <Stage cam={{s: punch(t, t0)}}>
      <Layer>
        <rect x={-500} y={-500} width={3000} height={2200} fill={C.sky} />
        <Sun x={1560} y={210} r={120} t={t} face={{mood: inBin ? 'smug' : u > 0 ? 'surprised' : 'happy', open: blink(t), look: {x: -1, y: 0.5}}} />
        <Ground y={880} />
        <Bin x={1420} y={880} s={1.1} color={C.green} />
        {t > throwT && !inBin && <TrashBag x={bx} y={by} s={0.6} rot={u * 540} face={{mood: u > 0.45 ? 'scared' : 'happy'}} />}
        {inBin && t - (throwT + flight) < 0.5 && <Puffs x={1400} y={690} t={(t - throwT - flight) * 3} color="#E9EEF2" n={4} rise={90} />}
        <Pill x={820} y={120} text="HARDER TO HIT THAN IT LOOKS" s={pop(t, ph('harder to hit'))} size={56} />
      </Layer>
      <Sci t={t} x={360} y={1010} headR={58} poses={[[0, 'throw'], [throwT, 'present'], [throwT + flight + 0.1, 'facepalm']]} />
    </Stage>
  );
};

// 19. End card ---------------------------------------------------------------------------
const EndCard: React.FC<{t: number}> = ({t}) => {
  const t0 = S.endcard;
  const s = pop(t, t0 + 0.05, 0.5);
  return (
    <Stage>
      <Layer>
        <Sunburst t={t} cx={960} cy={540} />
        <g transform={`translate(960 760) scale(${pop(t, t0 + 0.5)})`}>
          <rect x={-560 + 8} y={-50 + 8} width={1120} height={100} rx={50} fill={C.ink} />
          <rect x={-560} y={-50} width={1120} height={100} rx={50} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={17} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={46} letterSpacing={2} fill={C.ink}>
            OBVIOUS FIXES. SURPRISING ANSWERS.
          </text>
        </g>
      </Layer>
      <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 960 - 550 * s, top: 420 - 100 * s, width: 1100 * s}} />
    </Stage>
  );
};


// QA only (input prop {probe: true}): log the on-screen box of every label, text and character cut-out.
const LayoutProbe: React.FC<{root: React.RefObject<HTMLDivElement | null>; frame: number}> = ({root, frame}) => {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    const sx = base.width / W;
    const visible = (n: Element) => {
      for (let e: Element | null = n; e && e !== el; e = e.parentElement) {
        const o = e.getAttribute('opacity');
        if (o !== null && parseFloat(o) < 0.05) return false;
        const st = (e as HTMLElement).style;
        if (st && st.opacity !== '' && parseFloat(st.opacity) < 0.05) return false;
      }
      return true;
    };
    const box = (n: Element) => {
      const r = n.getBoundingClientRect();
      return [(r.left - base.left) / sx, (r.top - base.top) / sx, r.width / sx, r.height / sx].map((v) => Math.round(v));
    };
    const items: Array<{k: string; t: string; b: number[]; inner?: number[]}> = [];
    el.querySelectorAll('[data-label]').forEach((g) => {
      if (!visible(g)) return;
      const b = box(g);
      if (b[2] < 4 || b[3] < 4) return;
      const txt = g.querySelector('text');
      const rect = g.querySelector('rect');
      items.push({k: 'label', t: g.getAttribute('data-label') || '', b, inner: txt && rect ? [...box(txt), ...box(rect)] : undefined});
    });
    el.querySelectorAll('text').forEach((tx) => {
      if (tx.closest('[data-label]') || !visible(tx)) return;
      const b = box(tx);
      if (b[2] < 4 || !tx.textContent) return;
      items.push({k: 'text', t: tx.textContent, b});
    });
    el.querySelectorAll('img').forEach((im) => {
      const src = im.getAttribute('src') || '';
      if (!src.includes('/sci/')) return;
      items.push({k: 'sci', t: src.split('/').pop() || '', b: box(im)});
    });
    console.log('LAYOUT ' + JSON.stringify({f: frame, items}));
  });
  return null;
};

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.intro, IntroScene],
  [S.sun, SunScene],
  [S.orbit, OrbitScene],
  [S.train, TrainScene],
  [S.circle, CircleScene],
  [S.cancel, CancelScene],
  [S.parker, ParkerScene],
  [S.energy, EnergyScene],
  [S.venus, VenusScene],
  [S.escape, EscapeScene],
  [S.math, MathScene],
  [S.compare, CompareScene],
  [S.onlyOrbit, OnlyOrbitScene],
  [S.fail, FailScene],
  [S.history, HistoryScene],
  [S.recap, RecapScene],
  [S.real, RealScene],
  [S.final, FinalScene],
  [S.endcard, EndCard],
];
export const SCENE_STARTS = SCENES.map(([st]) => st);

export const TrashSun: React.FC = () => {
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
        <Audio src={staticFile('sun/vo/vo.wav')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
          <Audio src={staticFile(`${c.f}.wav`)} volume={(f) => Math.pow(10, dbAt(c, c.at + f / FPS) / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

