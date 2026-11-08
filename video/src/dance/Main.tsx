import React, {useRef} from 'react';
import {AbsoluteFill, Audio, Sequence, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {FPS, END, WORDS, ph} from './timing';
import {clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, wobble} from '../iceberg/anim';
import {LayoutProbe} from '../iceberglong/kit';
import {HollowCaptions, buildGroups} from '../hollow/Captions';
import {
  Glow,
  H,
  HC,
  Layer,
  Moon,
  Note,
  Overlay,
  Puppet,
  SERIF,
  Seal,
  Spiral,
  Stage,
  Title,
  Town,
  W,
  Wordmark,
  drift,
  fadeIn,
  flicker,
  slam,
  span,
  until,
  useHollowFonts,
} from '../hollow/kit';

// Hollow Hour #1 - "The Town That Couldn't Stop Dancing" (Strasbourg, 1518). Short, 1080x1920, rendered 4K.
// Loop structure: the last line repeats the first, and the last shot matches the first, so the Short loops.

export const DURATION_FRAMES = Math.ceil(END * FPS);

const S = {
  open: 0,
  days: ph('she kept going') - 0.08,
  joined: ph('then someone') - 0.08,
  crowd: ph('by august') - 0.08,
  doctors: ph("the city's doctors") - 0.08,
  halls: ph('so the council') - 0.08,
  stage: ph('they built a wooden') - 0.08,
  worse: ph('it made things') - 0.08,
  ban: ph('finally') - 0.08,
  shrine: ph('the dancers were taken') - 0.08,
  theory: ph('so what was it') - 0.08,
  fear: ph('years of famine') - 0.08,
  loop: ph('it all began') - 0.08,
};
const COVER_END = 1.15;

const GROUPS = buildGroups(WORDS, [
  ['fifteen eighteen', '1518'],
  ['four hundred', '400'],
  ['fifty', '50'],
  ['four', '4'],
  ['six', '6'],
  ['fifteen', '15'],
  ['two', '2'],
]);
const KEYS = new Set(['1518', 'DANCE', 'STOP', '4', '6', '50', '400', 'HOT', 'BLOOD', 'MORE', 'DANCING', 'WORSE', 'COLLAPSED', '15', 'DIED', 'BANNED', 'VITUS', 'CURSE', 'FAMINE', 'DISEASE', 'FEAR', 'ANGRY']);

// ------------------------------------------------------------------ shared pieces

// A street seen down its length: houses on both sides, an open gap in the middle so the dancers stand against
// the sky and the moonlit road (silhouettes must never stand in front of other silhouettes).
const Street: React.FC<{t: number; base?: number; lit?: number; color?: string}> = ({t, base = 1290, lit = 1, color = HC.void}) => (
  <g>
    <Town base={base - 10} t={t} lit={lit} color={color} seed={3} spireX={null} x0={-320} x1={250} />
    <Town base={base - 10} t={t} lit={lit} color={color} seed={11} spireX={1010} x0={830} x1={1400} />
    <rect x={-600} y={base - 14} width={W + 1200} height={H} fill={color} />
    <ellipse cx={540} cy={base + 10} rx={420} ry={60} fill={HC.fog} opacity={0.22} />
    {/* cobbles catching a little light */}
    {Array.from({length: 26}).map((_, i) => (
      <ellipse key={i} cx={-60 + (i % 13) * 100 + (Math.floor(i / 13) % 2) * 50} cy={base + 30 + Math.floor(i / 13) * 46} rx={38} ry={10} fill={HC.duskHi} opacity={0.35} />
    ))}
  </g>
);

// Night sky with the moon as a halo behind the dancer's head. Same in the first and last shot (loop).
const NightSky: React.FC<{t: number; spin?: number; moonY?: number}> = ({t, spin = 0, moonY = 860}) => (
  <g>
    <Glow id="night" cx={540} cy={moonY} r={1200} inner={HC.duskHi} outer={HC.void} t={t} k={0.3} />
    {spin > 0 && <Spiral cx={540} cy={moonY} t={t} opacity={0.28 * spin} speed={10} color={HC.void} />}
    <Moon x={540} y={moonY} r={190} t={t} />
  </g>
);

// The first/last shot: one woman, the moon behind her head, the street.
const OneWoman: React.FC<{t: number; danceFrom: number; walkFrom?: number; spin?: number}> = ({t, danceFrom, walkFrom = -1, spin = 0}) => {
  const walking = walkFrom >= 0 && t < danceFrom;
  const x = walking ? lerp(250, 540, prog(t, walkFrom, danceFrom, easeOutCubic)) : 540;
  return (
    <>
      <NightSky t={t} spin={spin} />
      <Street t={t} />
      <Puppet x={x} y={1300} s={1.62} t={t} kind="woman" pose={t >= danceFrom ? 'dance' : walking ? 'walk' : 'stand'} spin={t >= danceFrom + 0.6} ph={0.2} />
    </>
  );
};

// ------------------------------------------------------------------ scenes

const CoverText: React.FC<{t: number}> = ({t}) => {
  const o = 1 - clamp((t - (COVER_END - 0.3)) / 0.3);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <Wordmark x={540} y={320} s={0.95} />
      <Title x={540} y={500} text="THEY COULDN'T" size={104} rot={-3} />
      <Title x={540} y={660} text="STOP DANCING" size={128} rot={-3} color={HC.ember} label="STOP DANCING" />
      <Note x={540} y={1140} text="Strasbourg, 1518" size={64} />
    </g>
  );
};

// 0 - 8 s: "In July 1518, a woman stepped into a street in Strasbourg and started to dance. Nobody knew why. And she didn't stop."
const OpenScene: React.FC<{t: number}> = ({t}) => {
  const danceT = ph('dance') - 0.1;
  const whyT = ph('nobody knew');
  const stopT = ph("didn't stop");
  const spin = prog(t, danceT, danceT + 2.0);
  // continuous push-in toward her
  const s = drift(t, 0, 1.0, 0.03);
  return (
    <Stage cam={{s, y: lerp(960, 900, prog(t, 0, 8, (u) => u))}}>
      <Layer>
        <OneWoman t={t} danceFrom={danceT} spin={spin} />
        {/* faces in the windows: townspeople watching */}
        {t > whyT &&
          [
            [150, 820],
            [345, 900],
            [700, 860],
            [960, 920],
          ].map(([x, y], i) => {
            const o = fadeIn(t, whyT + i * 0.18, 0.4);
            return (
              <g key={i} opacity={o}>
                <rect x={x - 46} y={y - 60} width={92} height={110} fill={HC.ember} opacity={0.9 * flicker(t + i)} />
                <circle cx={x} cy={y - 8} r={24} fill={HC.void} />
                <rect x={x - 32} y={y + 14} width={64} height={40} rx={16} fill={HC.void} />
              </g>
            );
          })}
        <CoverText t={t} />
        <Note x={540} y={380} text="Strasbourg, July 1518" size={60} o={fadeIn(t, COVER_END, 0.5) * until(t, whyT)} />
        <Title x={540} y={420} text="SHE DIDN'T STOP" size={92} s={pop(t, stopT - 0.05)} color={HC.bone} />
      </Layer>
    </Stage>
  );
};

// "She kept going for four days. Maybe six." - days and nights flip past, tally marks on the wall.
const DaysScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.days;
  const fourT = ph('four days');
  const sixT = ph('six');
  // day count runs 0 -> 4 by "days", then -> 6 on "six"
  const n = t < fourT ? 0 : t < sixT ? lerp(0, 4, prog(t, fourT - 0.6, fourT + 0.5, (u) => u)) : lerp(4, 6, prog(t, sixT - 0.1, sixT + 0.5, (u) => u));
  const phase = n % 1; // 0..1 across one day
  const sunA = Math.PI * (1 - phase);
  const day = Math.sin(Math.PI * phase);
  const sky = `rgb(${Math.round(lerp(43, 190, day))},${Math.round(lerp(29, 112, day))},${Math.round(lerp(51, 60, day))})`;
  return (
    <Stage cam={{s: drift(t, t0, 1.05, 0.02)}}>
      <Layer>
        <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill={sky} />
        <Glow id="days" cx={540} cy={1000} r={900} inner={day > 0.3 ? HC.ember : HC.duskHi} outer="rgba(10,8,9,0)" t={t} k={0.2} />
        {/* sun / moon arc */}
        <circle cx={540 + 520 * Math.cos(sunA)} cy={1150 - 620 * Math.sin(sunA)} r={90} fill={day > 0.15 ? HC.emberHi : HC.bone} />
        <Street t={t} lit={1 - day} />
        {/* wall with tally marks (scratched): 4 white, then 2 red with a question */}
        <g transform="translate(140 1120)">
          {Array.from({length: Math.floor(n + 0.001)}).map((_, i) => (
            <line key={i} x1={i * 34} y1={0} x2={i * 34 + (i === 4 ? -150 : 10)} y2={-120 + (i === 4 ? 40 : 0)} stroke={i >= 4 ? HC.bloodHi : HC.bone} strokeWidth={12} strokeLinecap="round" opacity={0.9} />
          ))}
        </g>
        <Puppet x={620} y={1300} s={1.35} t={t} kind="woman" pose="dance" spin ph={0.2} />
        <Title x={540} y={430} text="4 DAYS" size={130} s={span(t, fourT - 0.05, sixT)} />
        <Title x={540} y={430} text="MAYBE 6" size={130} s={pop(t, sixT - 0.05)} color={HC.ember} />
      </Layer>
    </Stage>
  );
};

// "Then someone joined her. Then another." + "By August, 50 to 400 people... could not stop."
const crowdSpots = Array.from({length: 46}).map((_, i) => {
  const row = i < 6 ? 0 : i < 18 ? 1 : i < 32 ? 2 : 3;
  const depth = [1, 0.78, 0.6, 0.46][row];
  return {
    x: 540 + (rnd(i * 3.1) - 0.5) * (row === 0 ? 900 : 1150),
    y: 1330 - row * 95,
    s: 1.2 * depth,
    ph: rnd(i * 7.7),
    tone: row,
    order: i,
  };
});
const tones = [HC.void, '#1A1218', '#2A1D27', '#3A2834'];

const JoinedScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.joined;
  const oneT = ph('someone');
  const twoT = ph('another');
  const emerge = (at: number) => prog(t, at - 0.1, at + 0.7, easeOutCubic);
  return (
    <Stage cam={{s: drift(t, t0, 1.18, -0.06)}}>
      <Layer>
        <NightSky t={t} spin={0.6} />
        <Street t={t} />
        <Puppet x={540} y={1300} s={1.45} t={t} kind="woman" pose="dance" spin ph={0.2} />
        {/* they step out of the dark: rise from the ground shadow */}
        <g opacity={emerge(oneT)}>
          <Puppet x={330} y={1300 + 80 * (1 - emerge(oneT))} s={1.35} t={t} kind="man" pose="dance" ph={1.7} />
        </g>
        <g opacity={emerge(twoT)}>
          <Puppet x={760} y={1300 + 80 * (1 - emerge(twoT))} s={1.35} t={t} kind="woman" pose="dance" ph={3.1} flip />
        </g>
      </Layer>
    </Stage>
  );
};

const CrowdScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.crowd;
  const numT = ph('fifty');
  const stopT = ph('could not stop');
  // the crowd fills up from the front between "By August" and "people"
  const count = Math.round(lerp(3, crowdSpots.length, prog(t, t0 + 0.4, ph('people') + 0.3, (u) => u)));
  const spots = crowdSpots.slice(0, count).sort((a, b) => b.tone - a.tone);
  const shake = t > stopT ? wobble(t, stopT, 6, 7, 3) : 0;
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.025), y: 960 + shake}}>
      <Layer>
        <Glow id="crowd" cx={540} cy={900} r={1200} inner="#7A3A2A" outer={HC.void} t={t} k={1} />
        <Spiral cx={540} cy={900} t={t} opacity={0.25} speed={-12} color={HC.void} />
        <Town base={1100} t={t} seed={8} spireX={540} lit={0.6} color="#1A1218" />
        <rect x={-600} y={1090} width={W + 1200} height={H} fill="#140E12" />
        {spots.map((p) => (
          <Puppet key={p.order} x={p.x} y={p.y} s={p.s} t={t} kind={p.order % 3 === 1 ? 'woman' : 'man'} pose="dance" ph={p.ph * 6} speed={0.9 + p.ph * 0.4} color={tones[p.tone]} flip={p.ph > 0.5} />
        ))}
        <rect x={-600} y={1335} width={W + 1200} height={H} fill={HC.void} />
        <Title x={540} y={420} text="50 TO 400" size={140} s={pop(t, numT - 0.05)} color={HC.ember} />
        <Note x={540} y={540} text="dancers, by August" size={62} o={fadeIn(t, numT + 0.4)} />
        <Title x={540} y={1170} text="THEY COULD NOT STOP" size={66} s={pop(t, stopT - 0.05)} color={HC.bone} />
      </Layer>
    </Stage>
  );
};

// "The city's doctors had a diagnosis. Hot blood. And the cure for hot blood, they decided, was more dancing."
const Scroll: React.FC<{x: number; y: number; open: number; lines: string[]; w?: number; size?: number; label?: string}> = ({x, y, open, lines, w = 640, size = 64, label}) => {
  if (open <= 0.001) return null;
  const h = (lines.length * size * 1.35 + 90) * open;
  return (
    <g transform={`translate(${x} ${y})`} data-label={label ?? lines.join(' ')}>
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w} height={h} fill={HC.ink} opacity={0.6} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={HC.bone} stroke={HC.ink} strokeWidth={6} />
      <rect x={-w / 2 - 20} y={-h / 2 - 22} width={w + 40} height={34} rx={17} fill="#C9B994" stroke={HC.ink} strokeWidth={6} />
      <rect x={-w / 2 - 20} y={h / 2 - 12} width={w + 40} height={34} rx={17} fill="#C9B994" stroke={HC.ink} strokeWidth={6} />
      <g opacity={clamp((open - 0.7) / 0.3)}>
        {lines.map((l, i) => (
          <text key={i} y={-((lines.length - 1) * size * 1.35) / 2 + i * size * 1.35 + size * 0.35} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={i === lines.length - 1 ? HC.blood : HC.ink}>
            {l}
          </text>
        ))}
      </g>
    </g>
  );
};

const DoctorsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.doctors;
  const hotT = ph('hot blood');
  const cureT = ph('the cure');
  const moreT = ph('more dancing');
  const red = prog(t, hotT - 0.1, hotT + 0.5);
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.02)}}>
      <Layer>
        <Glow id="doc" cx={760} cy={900} r={1000} inner={red > 0.5 ? '#8E2A20' : '#7A5A2A'} outer={HC.void} t={t} k={1.2} />
        {/* candle on a desk */}
        <rect x={-100} y={1250} width={1300} height={700} fill={HC.void} />
        <rect x={720} y={1150} width={40} height={100} fill={HC.bone} />
        <path d={`M 740 ${1150 - 60 * flicker(t, 2)} Q 760 1120 740 1150 Q 720 1120 740 ${1150 - 60 * flicker(t, 2)} Z`} fill={HC.emberHi} />
        <circle cx={740} cy={1110} r={120} fill={HC.ember} opacity={0.18 * flicker(t, 2)} />
        {/* the physician, holding up a glass flask */}
        <Puppet x={330} y={1260} s={1.7} t={t} kind="doctor" pose="point" ph={0.5} />
        <g transform="translate(560 790)">
          <circle r={46} fill="none" stroke={HC.void} strokeWidth={12} />
          <rect x={-14} y={-90} width={28} height={50} fill={HC.void} />
          <circle r={36} fill={red > 0.3 ? HC.blood : HC.rot} opacity={0.85} />
        </g>
        <Note x={540} y={360} text="the city's doctors said:" size={60} o={fadeIn(t, t0 + 0.2) * until(t, cureT)} />
        <Title x={540} y={500} text="HOT BLOOD" size={150} s={span(t, hotT - 0.05, cureT)} color={HC.bloodHi} glow={HC.blood} />
        <Note x={540} y={360} text="the cure:" size={64} o={fadeIn(t, cureT) } />
        <Scroll x={540} y={560} open={prog(t, moreT - 0.35, moreT + 0.2, easeOutCubic)} lines={['PRESCRIBED:', 'MORE DANCING']} size={62} w={700} />
      </Layer>
      </Stage>
  );
};

// "So the council cleared out two guild halls and a grain market."
const HallsScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.halls;
  const hallT = ph('two guild halls');
  const grainT = ph('grain market');
  const doors = [
    {x: 220, at: hallT, label: 'guild hall'},
    {x: 540, at: hallT + 0.35, label: 'guild hall'},
    {x: 860, at: grainT, label: 'grain market'},
  ];
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.025)}}>
      <Layer>
        <Glow id="halls" cx={540} cy={800} r={1100} inner={HC.duskHi} outer={HC.void} t={t} k={0.3} />
        <rect x={-600} y={1250} width={W + 1200} height={H} fill={HC.void} />
        {doors.map((d, i) => {
          const open = prog(t, d.at - 0.05, d.at + 0.5, easeOutCubic);
          return (
            <g key={i}>
              <path d={`M ${d.x - 150} 1260 L ${d.x - 150} 820 L ${d.x} 640 L ${d.x + 150} 820 L ${d.x + 150} 1260 Z`} fill={HC.void} />
              {/* light spilling from the open door onto the street */}
              <path d={`M ${d.x - 60} 1260 L ${d.x + 60} 1260 L ${d.x + 160} ${1260 + 400 * open} L ${d.x - 160} ${1260 + 400 * open} Z`} fill={HC.ember} opacity={0.35 * open} />
              <rect x={d.x - 60} y={1260 - 220 * open} width={120} height={220 * open} fill={HC.ember} opacity={flicker(t + i)} />
              {open > 0.5 && <Puppet x={d.x} y={1258} s={0.55} t={t} kind={i === 1 ? 'woman' : 'man'} pose="dance" ph={i * 2} />}
              <Note x={d.x} y={590} text={d.label} size={44} o={fadeIn(t, d.at)} />
            </g>
          );
        })}
        <Title x={540} y={420} text="THE COUNCIL" size={110} s={span(t, t0 + 0.15, hallT)} />
      </Layer>
    </Stage>
  );
};

// "They built a wooden stage. They hired musicians to keep the dancers moving." / "It made things worse..."
const StageSet: React.FC<{t: number; planks: number; fallFrom?: number; musicians: number; red?: number}> = ({t, planks, fallFrom = 1e9, musicians, red = 0}) => {
  const dancers = [
    {x: 250, k: 'woman', ph: 0.1},
    {x: 430, k: 'man', ph: 1.3},
    {x: 610, k: 'woman', ph: 2.2},
    {x: 790, k: 'man', ph: 3.5},
  ] as const;
  return (
    <g>
      {/* the stage: planks slam down one by one */}
      {Array.from({length: 7}).map((_, i) => {
        const u = clamp(planks * 7 - i);
        if (u <= 0) return null;
        return <rect key={i} x={90 + i * 130} y={1150 - 40 * (1 - easeOutCubic(u))} width={124} height={44} fill="#3B2A1E" stroke={HC.ink} strokeWidth={6} opacity={u} />;
      })}
      {planks > 0.99 && (
        <>
          <rect x={120} y={1190} width={30} height={160} fill={HC.void} />
          <rect x={930} y={1190} width={30} height={160} fill={HC.void} />
        </>
      )}
      {planks > 0.99 &&
        dancers.map((d, i) => {
          const at = fallFrom + i * 0.45;
          const f = prog(t, at, at + 0.5, (u) => u * u);
          return <Puppet key={i} x={d.x} y={1152} s={1.0} t={t} kind={d.k} pose={f > 0 ? 'stand' : 'dance'} ph={d.ph} fall={i % 2 === 0 ? f : -f} color={HC.void} />;
        })}
      {musicians > 0 && (
        <g opacity={musicians}>
          <Puppet x={80} y={1420} s={1.1} t={t} kind="fiddler" pose="play" ph={0.4} flip />
          <Puppet x={1000} y={1420} s={1.1} t={t} kind="drummer" pose="play" ph={1.4} />
        </g>
      )}
      {red > 0 && <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill={HC.blood} opacity={0.0} />}
    </g>
  );
};

const StageScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.stage;
  const stageT = ph('wooden stage');
  const musT = ph('musicians');
  const planks = prog(t, stageT - 0.25, stageT + 0.6, (u) => u);
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.02)}}>
      <Layer>
        <Glow id="stage" cx={540} cy={1000} r={1100} inner="#8A5A22" outer={HC.void} t={t} k={1.2} />
        <Spiral cx={540} cy={1000} t={t} opacity={0.2 * fadeIn(t, musT)} speed={14} />
        <rect x={-600} y={1350} width={W + 1200} height={H} fill={HC.void} />
        <StageSet t={t} planks={planks} musicians={fadeIn(t, musT - 0.1, 0.3)} />
        <Title x={540} y={420} text="A WOODEN STAGE" size={96} s={span(t, stageT - 0.05, musT)} />
        <Title x={540} y={420} text="KEEP THEM MOVING" size={92} s={pop(t, musT - 0.05)} color={HC.ember} />
      </Layer>
    </Stage>
  );
};

const WorseScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.worse;
  const colT = ph('collapsed');
  const numT = ph('fifteen a day');
  const argT = ph('historians still');
  const red = prog(t, t0, t0 + 0.8);
  return (
    <Stage cam={{s: drift(t, t0, 1.04, 0.025), x: 540 + wobble(t, colT, 8, 6, 2)}}>
      <Layer>
        <Glow id="worse" cx={540} cy={1000} r={1100} inner={`rgb(${Math.round(lerp(138, 150, red))},${Math.round(lerp(90, 30, red))},${Math.round(lerp(34, 26, red))})`} outer={HC.void} t={t} k={1.5} />
        <rect x={-600} y={1350} width={W + 1200} height={H} fill={HC.void} />
        <StageSet t={t} planks={1} fallFrom={colT - 0.3} musicians={1 - fadeIn(t, colT, 0.6)} />
        <Title x={540} y={420} text="IT MADE THINGS WORSE" size={76} s={span(t, t0 + 0.1, numT)} />
        <Title x={540} y={460} text="15 A DAY?" size={150} s={pop(t, numT - 0.05)} color={HC.bloodHi} glow={HC.blood} />
        <Note x={540} y={590} text="later accounts" size={58} o={fadeIn(t, numT + 0.3)} />
        {t > argT && <Seal x={540} y={790} text="DISPUTED" s={slam(t, argT)} size={78} />}
      </Layer>
    </Stage>
  );
};

// "Finally, the council banned public music and dancing."
const BanScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.ban;
  const banT = ph('banned');
  const nail = prog(t, t0 + 0.1, t0 + 0.4, easeOutCubic);
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.03)}}>
      <Layer>
        <Glow id="ban" cx={540} cy={900} r={900} inner="#5C4A36" outer={HC.void} t={t} k={0.6} />
        {/* a door with planks */}
        <rect x={160} y={260} width={760} height={1400} fill="#1C1410" stroke={HC.ink} strokeWidth={10} />
        {Array.from({length: 6}).map((_, i) => (
          <line key={i} x1={160 + i * 127} y1={260} x2={160 + i * 127} y2={1660} stroke={HC.ink} strokeWidth={6} />
        ))}
        <g transform={`translate(0 ${-60 * (1 - nail)})`} opacity={nail}>
          <Scroll x={540} y={840} open={1} lines={['BY ORDER OF', 'THE COUNCIL', 'NO MUSIC', 'NO DANCING']} size={60} w={640} label="council order" />
          <circle cx={540} cy={530} r={14} fill={HC.fog} stroke={HC.ink} strokeWidth={4} />
        </g>
        {t > banT && <Seal x={540} y={1230} text="BANNED" s={slam(t, banT)} size={96} rot={-10} />}
      </Layer>
    </Stage>
  );
};

// "The dancers were taken to a shrine of Saint Vitus, the saint people believed could curse you with dancing.
//  Many were said to recover there."
const ShrineScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.shrine;
  const vitusT = ph('saint vitus');
  const curseT = ph('curse you');
  const recT = ph('recover there');
  const looming = prog(t, curseT - 0.3, curseT + 0.8);
  const calm = prog(t, recT - 0.1, recT + 0.6);
  const walkers = [0, 1, 2, 3, 4];
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.02), y: lerp(1000, 900, prog(t, t0, recT + 1, (u) => u))}}>
      <Layer>
        <Glow id="shrine" cx={760} cy={720} r={1100} inner={calm > 0.5 ? '#7A6234' : HC.duskHi} outer={HC.void} t={t} k={0.5} />
        <Moon x={240} y={420} r={80} t={t} />
        {/* the looming saint: a huge shadow over the sky */}
        {looming > 0 && (
          <g opacity={0.55 * looming * (1 - calm * 0.7)}>
            <Puppet x={760} y={1200} s={lerp(2.2, 3.6, looming)} t={t} kind="saint" pose="stand" color="#3A2340" />
          </g>
        )}
        {/* hill and the small chapel */}
        <path d="M -200 1500 Q 300 1350 640 980 Q 760 900 1300 860 L 1300 2200 L -200 2200 Z" fill={HC.void} />
        <g transform="translate(800 900)">
          <path d="M -110 0 L -110 -170 L 0 -260 L 110 -170 L 110 0 Z" fill={HC.void} />
          <rect x={-12} y={-330} width={24} height={80} fill={HC.void} />
          <rect x={-40} y={-305} width={80} height={20} fill={HC.void} />
          <path d="M -40 0 L -40 -90 Q 0 -130 40 -90 L 40 0 Z" fill={HC.ember} opacity={flicker(t, 1.5)} />
        </g>
        {/* the dancers led up the path */}
        {walkers.map((i) => {
          const u = clamp(prog(t, t0 + i * 0.25, recT + 0.2, (v) => v) * 0.8 + 0.1);
          const x = lerp(-80, 690, u) - i * 70;
          const y = 1500 - (x + 200) * 0.38 + (x > 640 ? (x - 640) * 0.1 : 0);
          return <Puppet key={i} x={x} y={Math.max(y, 960)} s={0.62 - u * 0.15} t={t} kind={i % 2 ? 'man' : 'woman'} pose={t < recT ? (i % 2 ? 'dance' : 'walk') : 'stand'} ph={i * 1.3} />;
        })}
        <Note x={540} y={380} text="the shrine of" size={58} o={fadeIn(t, vitusT - 0.2) * until(t, curseT)} />
        <Title x={540} y={500} text="SAINT VITUS" size={124} s={span(t, vitusT - 0.05, curseT)} color={HC.ember} />
        <Title x={540} y={460} text="CURSED TO DANCE" size={96} s={span(t, curseT - 0.05, recT)} color={HC.bloodHi} glow={HC.blood} />
        <Note x={540} y={460} text="many were said to recover" size={60} o={fadeIn(t, recT)} />
      </Layer>
    </Stage>
  );
};

// "So what was it? Poisoned bread is one theory. Historian John Waller has another."
const TheoryScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.theory;
  const breadT = ph('poisoned bread');
  const wallerT = ph('historian john waller');
  const loaf = span(t, breadT - 0.05, wallerT);
  const book = pop(t, wallerT - 0.05);
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.02)}}>
      <Layer>
        <Glow id="theory" cx={540} cy={950} r={900} inner="#4A3A2A" outer={HC.void} t={t} k={1} />
        <Title x={540} y={600} text="?" size={420} s={span(t, t0 + 0.05, breadT)} color={HC.ember} label="question" />
        {loaf > 0 && (
          <g transform={`translate(540 980) scale(${loaf})`} data-obj="loaf">
            <ellipse cx={8} cy={14} rx={300} ry={150} fill={HC.ink} />
            <ellipse rx={300} ry={150} fill="#B07A3E" stroke={HC.ink} strokeWidth={10} />
            {[-160, -60, 40, 140].map((x) => (
              <path key={x} d={`M ${x - 30} -110 Q ${x} -60 ${x + 30} -110`} stroke={HC.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
            ))}
            {/* dark ergot spurs + green rot */}
            {Array.from({length: 9}).map((_, i) => (
              <ellipse key={i} cx={-220 + rnd(i) * 440} cy={-70 + rnd(i + 9) * 140} rx={18 + rnd(i + 3) * 14} ry={8} fill={i % 3 ? HC.void : HC.rot} transform={`rotate(${rnd(i + 5) * 90})`} />
            ))}
          </g>
        )}
        <Title x={540} y={420} text="POISONED BREAD?" size={96} s={loaf} color={HC.rot} glow={HC.rot} />
        <Note x={540} y={1260} text="one theory: ergot, a grain fungus" size={50} o={fadeIn(t, breadT + 0.3) * until(t, wallerT)} />
        {book > 0 && (
          <g transform={`translate(540 980) scale(${book})`} data-obj="book">
            <path d="M -320 -180 Q -160 -230 0 -180 L 0 200 Q -160 150 -320 200 Z" fill={HC.bone} stroke={HC.ink} strokeWidth={10} strokeLinejoin="round" />
            <path d="M 320 -180 Q 160 -230 0 -180 L 0 200 Q 160 150 320 200 Z" fill={HC.bone} stroke={HC.ink} strokeWidth={10} strokeLinejoin="round" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i}>
                <line x1={-280} x2={-40} y1={-120 + i * 50} y2={-120 + i * 50} stroke="#8C7B5C" strokeWidth={8} />
                <line x1={40} x2={280} y1={-120 + i * 50} y2={-120 + i * 50} stroke="#8C7B5C" strokeWidth={8} />
              </g>
            ))}
          </g>
        )}
        <Title x={540} y={420} text="JOHN WALLER" size={104} s={book} />
        <Note x={540} y={530} text="historian" size={60} o={fadeIn(t, wallerT + 0.2)} />
      </Layer>
    </Stage>
  );
};

// "Years of famine and disease. And a city that truly believed an angry saint could make you dance.
//  Fear spread. And so did the dance."
const FearScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.fear;
  const cityT = ph('and a city');
  const saintT = ph('angry saint');
  const fearT = ph('fear spread');
  const danceT = ph('so did the dance');
  const ink = prog(t, fearT - 0.1, danceT, easeInOutCubic);
  const crowd = prog(t, danceT - 0.2, danceT + 0.6);
  return (
    <Stage cam={{s: drift(t, t0, 1.0, 0.03)}}>
      <Layer>
        <Glow id="fear" cx={540} cy={900} r={1200} inner={t < cityT ? '#4E4A30' : '#5A2430'} outer={HC.void} t={t} k={0.8} />
        {t >= saintT && <Spiral cx={540} cy={760} t={t} opacity={0.3} speed={16} color={HC.void} />}
        {t < cityT ? (
          <g>
            {/* withered wheat and an empty bowl */}
            {Array.from({length: 9}).map((_, i) => (
              <path key={i} d={`M ${130 + i * 100} 1350 Q ${140 + i * 100 + 30} 1150 ${110 + i * 100 + 70 + rnd(i) * 40} ${1050 + rnd(i) * 80}`} stroke={HC.void} strokeWidth={14} fill="none" strokeLinecap="round" />
            ))}
            <rect x={-600} y={1340} width={W + 1200} height={H} fill={HC.void} />
            <path d="M 360 1180 Q 540 1340 720 1180 Z" fill={HC.void} />
            <Title x={540} y={460} text="FAMINE" size={140} s={pop(t, ph('famine') - 0.05)} color={HC.bone} />
            <Title x={540} y={620} text="DISEASE" size={140} s={pop(t, ph('disease') - 0.05)} color={HC.rot} glow={HC.rot} />
          </g>
        ) : (
          <g>
            <Town base={1250} t={t} seed={5} spireX={760} lit={1 - ink} />
            <rect x={-600} y={1240} width={W + 1200} height={H} fill={HC.void} />
            {/* the angry saint's shadow over the town */}
            <g opacity={0.7 * fadeIn(t, saintT - 0.3, 0.6)}>
              <Puppet x={540} y={1250} s={2.8 + 0.2 * prog(t, saintT, danceT, (u) => u)} t={t} kind="saint" pose="stand" color="#3A1C2A" />
            </g>
            {/* fear spreading like ink through the streets */}
            {ink > 0 &&
              Array.from({length: 12}).map((_, i) => (
                <circle key={i} cx={540 + (rnd(i * 4) - 0.5) * 1100} cy={1250 + (rnd(i * 9) - 0.5) * 300} r={ink * (160 + rnd(i) * 200)} fill={HC.void} />
              ))}
            {crowd > 0 &&
              crowdSpots.slice(0, 18).map((p) => (
                <g key={p.order} opacity={crowd}>
                  <Puppet x={p.x} y={1250 + p.tone * 30} s={p.s * 0.8} t={t} kind={p.order % 3 === 1 ? 'woman' : 'man'} pose="dance" ph={p.ph * 6} rim={HC.blood} flip={p.ph > 0.5} />
                </g>
              ))}
            <Title x={540} y={460} text="AN ANGRY SAINT" size={100} s={span(t, saintT - 0.05, fearT)} color={HC.bloodHi} glow={HC.blood} />
            <Title x={540} y={460} text="FEAR SPREAD" size={124} s={span(t, fearT - 0.05, danceT)} />
            <Title x={540} y={460} text="SO DID THE DANCE" size={98} s={pop(t, danceT - 0.05)} color={HC.ember} />
          </g>
        )}
      </Layer>
    </Stage>
  );
};

// "It all began with one woman, in a street in Strasbourg, in July 1518." - back to the first shot (loop).
const LoopScene: React.FC<{t: number}> = ({t}) => {
  const t0 = S.loop;
  // the camera eases back to exactly the opening framing by the last frame
  const u = prog(t, t0, END - 0.2, easeInOutCubic);
  const s = lerp(1.25, 1.0, u);
  return (
    <Stage cam={{s, y: 960}}>
      <Layer>
        <OneWoman t={t} danceFrom={-1} spin={1 - u} />
        <Note x={540} y={380} text="Strasbourg, July 1518" size={60} o={fadeIn(t, ph('strasbourg', t0)) * until(t, END - 0.1, 0.4)} />
      </Layer>
    </Stage>
  );
};

const SCENES: Array<[number, React.FC<{t: number}>]> = [
  [S.open, OpenScene],
  [S.days, DaysScene],
  [S.joined, JoinedScene],
  [S.crowd, CrowdScene],
  [S.doctors, DoctorsScene],
  [S.halls, HallsScene],
  [S.stage, StageScene],
  [S.worse, WorseScene],
  [S.ban, BanScene],
  [S.shrine, ShrineScene],
  [S.theory, TheoryScene],
  [S.fear, FearScene],
  [S.loop, LoopScene],
];
const CUTS = SCENES.slice(1).map(([at]) => at);

// ------------------------------------------------------------------ sound

type Cue = {f: string; at: number; db: number; dur?: number};
const D = (n: string) => `dance/sfx/${n}`;
const SFX: Cue[] = [
  {f: D('heart'), at: ph('dance') - 0.05, db: -10},
  {f: D('heart'), at: ph("didn't stop") + 0.2, db: -8},
  ...CUTS.map((at) => ({f: D('whoosh'), at: at - 0.45, db: -26})),
  {f: D('stomp'), at: ph('then someone') + 0.3, db: -24, dur: S.doctors - ph('then someone') - 0.2},
  {f: D('heart'), at: ph('could not stop') + 0.3, db: -9},
  {f: D('bell'), at: ph('hot blood'), db: -14},
  {f: D('fiddle'), at: ph('musicians') - 0.1, db: -22, dur: ph('collapsed') - ph('musicians') + 0.8},
  {f: D('stomp'), at: ph('wooden stage') - 0.1, db: -26, dur: ph('collapsed') - ph('wooden stage') + 0.4},
  {f: D('bell'), at: ph('died'), db: -10},
  {f: D('heart'), at: ph('historians still'), db: -10},
  {f: D('bell'), at: ph('banned'), db: -9},
  {f: D('heart'), at: ph('curse you'), db: -9},
  {f: D('bell'), at: ph('angry saint'), db: -12},
  {f: D('stomp'), at: ph('so did the dance') - 0.1, db: -22, dur: 1.4},
  {f: D('heart'), at: ph('one woman'), db: -10},
];

export const DanceShort: React.FC = () => {
  useHollowFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const root = useRef<HTMLDivElement>(null);
  const probe = Boolean((getInputProps() as {probe?: boolean}).probe);
  let Scene = SCENES[0][1];
  for (const [st, Sc] of SCENES) if (t >= st) Scene = Sc;
  // a quick blink to black on every cut (eyes closing), instead of a punch-in
  const blink = Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.09)) * 0.85;
  const red = t >= S.worse && t < S.ban ? 0.25 * fadeIn(t, S.worse, 0.8) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}} ref={root}>
      <Scene t={t} />
      <Overlay t={t} wash={HC.blood} washO={red} dark={blink} />
      {probe && <LayoutProbe root={root} frame={frame} width={W} />}
      <HollowCaptions t={t} groups={GROUPS} keys={KEYS} hide={t < COVER_END} />
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('dance/vo/vo.wav')} />
      </Sequence>
      <Audio src={staticFile('dance/sfx/drone.wav')} volume={(f) => Math.pow(10, -20 / 20) * Math.min(1, f / 30) * Math.min(1, (DURATION_FRAMES - f) / 20)} />
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
          <Audio
            src={staticFile(`${c.f}.wav`)}
            volume={(f) => {
              const v = Math.pow(10, c.db / 20);
              if (!c.dur) return v;
              const n = c.dur * FPS;
              return v * Math.min(1, f / 12) * Math.min(1, (n - f) / 18);
            }}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Cover = frame 0 (YouTube Shorts / Reels / TikTok pick a frame).
export const DanceCover: React.FC = () => {
  useHollowFonts();
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}}>
      <OpenScene t={0} />
      <Overlay t={0} />
    </AbsoluteFill>
  );
};
