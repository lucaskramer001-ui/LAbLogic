import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FELL, Glow, HC, Moon, Puppet, SERIF, Spiral, Town, Title, useHollowFonts} from './kit';

// Hollow Hour brand assets (Stills): logo (horizontal + stacked, transparent), avatar, YouTube banner,
// Shorts cover template, long-form thumbnail template, end card. The mascot is the Keeper: a hooded figure with a
// lantern who "keeps the records" - he stands inside the moon, the channel's signature halo.

// ------------------------------------------------------------------ the Keeper

// Hooded keeper, feet at (x, y), ~420 px tall at s = 1, lantern held out to the right (flip for left).
export const Keeper: React.FC<{x: number; y: number; s?: number; flip?: boolean; color?: string; light?: number}> = ({x, y, s = 1, flip = false, color = HC.void, light = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    {/* lantern glow */}
    <circle cx={150} cy={-250} r={120} fill={HC.ember} opacity={0.18 * light} />
    <circle cx={150} cy={-250} r={70} fill={HC.ember} opacity={0.25 * light} />
    {/* cloak: wide hem, narrow shoulders, pointed hood */}
    <path
      d="M -120 0 Q -110 -120 -70 -230 Q -60 -300 -58 -330 Q -50 -390 -10 -420 Q 10 -440 30 -436 Q 22 -410 40 -380 Q 62 -340 60 -300 Q 70 -220 100 -120 Q 115 -50 120 0 Z"
      fill={color}
    />
    {/* dark face inside the hood */}
    <path d="M -24 -392 Q -4 -414 22 -398 Q 30 -360 6 -346 Q -18 -350 -24 -392 Z" fill={HC.ink} />
    {/* arm reaching out with the lantern */}
    <path d="M 40 -300 Q 90 -290 128 -296 L 132 -278 Q 90 -268 44 -270 Z" fill={color} />
    <line x1={136} y1={-288} x2={150} y2={-276} stroke={color} strokeWidth={6} strokeLinecap="round" />
    {/* lantern */}
    <path d="M 132 -276 L 168 -276 L 172 -226 L 128 -226 Z" fill={HC.emberHi} opacity={0.6 + 0.4 * light} stroke={color} strokeWidth={6} strokeLinejoin="round" />
    <rect x={124} y={-232} width={52} height={10} fill={color} />
    <path d="M 132 -276 L 150 -294 L 168 -276 Z" fill={color} />
    <line x1={150} y1={-276} x2={150} y2={-226} stroke={color} strokeWidth={4} />
  </g>
);

// The moon halo with the Keeper inside: the channel's mark.
export const Mark: React.FC<{cx: number; cy: number; r: number; ring?: boolean}> = ({cx, cy, r, ring = true}) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.35} fill={HC.bone} opacity={0.06} />
    <circle cx={cx} cy={cy} r={r * 1.12} fill={HC.bone} opacity={0.1} />
    <circle cx={cx} cy={cy} r={r} fill={HC.bone} />
    <circle cx={cx - r * 0.42} cy={cy - r * 0.38} r={r * 0.13} fill={HC.fog} opacity={0.3} />
    <circle cx={cx + r * 0.5} cy={cy - r * 0.05} r={r * 0.09} fill={HC.fog} opacity={0.28} />
    <clipPath id={`mk${Math.round(cx)}${Math.round(cy)}`}>
      <circle cx={cx} cy={cy} r={r} />
    </clipPath>
    <g clipPath={`url(#mk${Math.round(cx)}${Math.round(cy)})`}>
      {/* ground line inside the moon */}
      <path d={`M ${cx - r} ${cy + r * 0.62} Q ${cx} ${cy + r * 0.52} ${cx + r} ${cy + r * 0.62} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`} fill={HC.void} />
      <Keeper x={cx - r * 0.12} y={cy + r * 0.62} s={(r * 1.25) / 420} />
    </g>
    {ring && <circle cx={cx} cy={cy} r={r * 1.06} fill="none" stroke={HC.ember} strokeWidth={Math.max(3, r * 0.025)} />}
  </g>
);

// Logo text. Line "HOLLOW" and "H(moon)UR": the O of HOUR is the Mark.
const word = (x: number, y: number, text: string, size: number, anchor: 'start' | 'end' | 'middle', color = HC.bone) => (
  <g>
    <text x={x} y={y + size * 0.07} textAnchor={anchor} fontFamily={SERIF} fontWeight={900} fontSize={size} letterSpacing={size * 0.06} fill={HC.ink} stroke={HC.ink} strokeWidth={size * 0.16} strokeLinejoin="round">
      {text}
    </text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={SERIF} fontWeight={900} fontSize={size} letterSpacing={size * 0.06} fill={color} stroke={HC.ink} strokeWidth={size * 0.12} paintOrder="stroke fill" strokeLinejoin="round">
      {text}
    </text>
  </g>
);

// Horizontal logo, centred at (cx, cy), ~1600 px wide at size 200.
export const LogoH: React.FC<{cx: number; cy: number; size?: number; tagline?: boolean}> = ({cx, cy, size = 200, tagline = true}) => {
  const r = size * 0.42;
  // measured Cinzel Black widths (with 0.06 em spacing): HOLLOW ~5.1 em, H ~0.9 em, UR ~1.6 em
  const x0 = cx - (size * 9.1) / 2;
  const mx = x0 + size * 6.95;
  return (
    <g>
      {word(x0, cy, 'HOLLOW', size, 'start')}
      {word(mx - r - size * 0.1, cy, 'H', size, 'end')}
      <Mark cx={mx} cy={cy - size * 0.35} r={r} />
      {word(mx + r + size * 0.12, cy, 'UR', size, 'start')}
      {tagline && (
        <g>
          <line x1={cx - size * 3.2} x2={cx - size * 1.45} y1={cy + size * 0.52} y2={cy + size * 0.52} stroke={HC.ember} strokeWidth={size * 0.02} />
          <line x1={cx + size * 1.45} x2={cx + size * 3.2} y1={cy + size * 0.52} y2={cy + size * 0.52} stroke={HC.ember} strokeWidth={size * 0.02} />
          <text x={cx} y={cy + size * 0.6} textAnchor="middle" fontFamily={FELL} fontStyle="italic" fontSize={size * 0.26} fill={HC.bone}>
            real records, unreal stories
          </text>
        </g>
      )}
    </g>
  );
};

// Stacked logo, centred at (cx, cy).
export const LogoStack: React.FC<{cx: number; cy: number; size?: number; tagline?: boolean}> = ({cx, cy, size = 170, tagline = true}) => {
  const r = size * 0.42;
  const mx = cx - size * 0.3;
  return (
    <g>
      {word(cx, cy - size * 0.55, 'HOLLOW', size, 'middle')}
      {word(mx - r - size * 0.1, cy + size * 0.62, 'H', size, 'end')}
      <Mark cx={mx} cy={cy + size * 0.27} r={r} />
      {word(mx + r + size * 0.12, cy + size * 0.62, 'UR', size, 'start')}
      {tagline && (
        <text x={cx} y={cy + size * 1.25} textAnchor="middle" fontFamily={FELL} fontStyle="italic" fontSize={size * 0.3} fill={HC.bone}>
          real records, unreal stories
        </text>
      )}
    </g>
  );
};

const Svg: React.FC<{w: number; h: number; children: React.ReactNode}> = ({w, h, children}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
    {children}
  </svg>
);
const Grain: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
);

// ------------------------------------------------------------------ stills

// Transparent logos (render with --image-format=png).
export const HollowLogo: React.FC = () => {
  useHollowFonts();
  return (
    <Svg w={2000} h={520}>
      <LogoH cx={1000} cy={300} size={200} />
    </Svg>
  );
};
export const HollowLogoStacked: React.FC = () => {
  useHollowFonts();
  return (
    <Svg w={1200} h={900}>
      <LogoStack cx={600} cy={380} size={190} />
    </Svg>
  );
};

// Profile picture 1080x1080 (shown round on all platforms).
export const HollowAvatar: React.FC = () => {
  useHollowFonts();
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}}>
      <Svg w={1080} h={1080}>
        <Glow id="av" cx={540} cy={540} r={760} inner={HC.duskHi} t={0} k={0} />
        <Spiral cx={540} cy={540} t={0} opacity={0.35} />
        <Mark cx={540} cy={540} r={330} />
      </Svg>
      <Grain />
    </AbsoluteFill>
  );
};

// YouTube banner 2560x1440; everything important inside the 1546x423 safe area (x 507-2053, y 508-931).
export const HollowBanner: React.FC = () => {
  useHollowFonts();
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}}>
      <Svg w={2560} h={1440}>
        <Glow id="bn" cx={1280} cy={700} r={1500} inner={HC.duskHi} t={0} k={0} />
        <Spiral cx={1280} cy={700} t={0} opacity={0.22} n={24} />
        <Town base={1000} t={3} seed={21} spireX={null} x0={-100} x1={360} lit={0.8} />
        <Town base={1000} t={3} seed={22} spireX={2300} x0={2050} x1={2700} lit={0.8} />
        <rect x={0} y={990} width={2560} height={450} fill={HC.void} />
        <LogoH cx={1280} cy={760} size={150} />
        {/* the Keeper walks the street on the left */}
        <Keeper x={470} y={1000} s={0.72} />
      </Svg>
      <Grain />
    </AbsoluteFill>
  );
};

// Shorts / Reels / TikTok cover template (= frame 0). Swap the title lines, the scene and the record number.
export const HollowCoverTemplate: React.FC = () => {
  useHollowFonts();
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}}>
      <Svg w={1080} h={1920}>
        <Glow id="cv" cx={540} cy={860} r={1200} inner={HC.duskHi} t={0} k={0} />
        <Spiral cx={540} cy={860} t={0} opacity={0.28} />
        <Moon x={540} y={860} r={190} t={0} />
        <Town base={1280} t={0} seed={3} spireX={null} x0={-320} x1={250} />
        <Town base={1280} t={0} seed={11} spireX={1010} x0={830} x1={1400} />
        <rect x={-10} y={1276} width={1100} height={700} fill={HC.void} />
        <Puppet x={540} y={1300} s={1.62} t={0} kind="woman" pose="stand" />
        <g transform="translate(540 300) scale(0.42)">
          <LogoH cx={0} cy={0} size={150} tagline={false} />
        </g>
        <Title x={540} y={500} text="THEY COULDN'T" size={104} rot={-3} />
        <Title x={540} y={660} text="STOP DANCING" size={128} rot={-3} color={HC.ember} />
        <text x={540} y={1140} textAnchor="middle" fontFamily={FELL} fontStyle="italic" fontSize={64} fill={HC.bone} stroke={HC.ink} strokeWidth={9} paintOrder="stroke fill">
          Strasbourg, 1518
        </text>
        {/* record number tab: builds the "archive" binge habit */}
        <g transform="translate(860 1420) rotate(-6)">
          <rect x={-150} y={-46} width={300} height={92} fill="none" stroke={HC.blood} strokeWidth={8} />
          <text y={18} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={50} letterSpacing={4} fill={HC.bloodHi}>
            RECORD 001
          </text>
        </g>
      </Svg>
      <Grain />
    </AbsoluteFill>
  );
};

// Long-form thumbnail template 1280x720: one lit figure, 2-3 words, one red accent.
export const HollowThumbTemplate: React.FC = () => {
  useHollowFonts();
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}}>
      <Svg w={1280} h={720}>
        <Glow id="th" cx={900} cy={360} r={760} inner="#7A3A2A" t={0} k={0} />
        <Spiral cx={900} cy={360} t={0} opacity={0.3} />
        <Moon x={900} y={330} r={200} t={0} />
        <rect x={0} y={600} width={1280} height={120} fill={HC.void} />
        <Puppet x={900} y={640} s={1.25} t={0.35} kind="woman" pose="dance" ph={0.2} />
        <Puppet x={700} y={650} s={0.9} t={0.1} kind="man" pose="dance" ph={1.7} color="#1A1218" />
        <Puppet x={1110} y={650} s={0.9} t={0.6} kind="man" pose="dance" ph={3.1} color="#1A1218" flip />
        <g transform="translate(330 330) rotate(-4)">
          <Title x={0} y={-40} text="400 PEOPLE" size={96} maxW={600} />
          <Title x={0} y={90} text="DANCED?" size={130} color={HC.bloodHi} glow={HC.blood} maxW={600} />
        </g>
      </Svg>
      <Grain />
    </AbsoluteFill>
  );
};

// End card / outro frame 1080x1920.
export const HollowEndCard: React.FC = () => {
  useHollowFonts();
  return (
    <AbsoluteFill style={{backgroundColor: HC.void}}>
      <Svg w={1080} h={1920}>
        <Glow id="ec" cx={540} cy={900} r={1100} inner={HC.duskHi} t={0} k={0} />
        <Spiral cx={540} cy={900} t={0} opacity={0.25} />
        <LogoStack cx={540} cy={860} size={170} />
      </Svg>
      <Grain />
    </AbsoluteFill>
  );
};
