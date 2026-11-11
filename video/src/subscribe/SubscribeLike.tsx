import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Music Store - "Abonnieren & Like" overlay for YouTube videos.
// 1920x1080 @ 60 fps, 6 s. Rendered with transparent background (ProRes 4444 / WebM alpha),
// on green screen, or on a dark preview background.

export const SUB_FPS = 60;
export const SUB_FRAMES = 360;

const RED = '#D0181B';
const RED_DARK = '#A51215';
const INK = '#141414';
const GREY = '#F1F1F1';
const FONT = 'Montserrat, "Arial Black", Arial, sans-serif';

// Layout (px, 1920x1080 frame)
const LX = 538; // logo centre x == pill left edge
const CY = 900; // vertical centre of the whole bar
const LOGO = 150;
const PH = 124;
const PW = 920;
const LIKE = {x: 450, w: 150};
const SUB = {x: 616, w: 274};
const BTN_H = 64;

// Timeline (frames)
const T = {
  logoIn: 0,
  pillOpen: 12,
  content: 26,
  shimmer: 44,
  cursorIn: 52,
  likeClick: 100,
  subClick: 160,
  cursorOut: 205,
  contentOut: 296,
  pillClose: 306,
  logoOut: 326,
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [600, 700, 800].map(
      (w) => new FontFace('Montserrat', `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, {weight: String(w)}),
    );
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
};

const ease = Easing.bezier(0.22, 1, 0.36, 1); // easeOutQuint-ish
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ThumbIcon: React.FC<{fill: string; size: number}> = ({fill, size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={fill}
      d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
    />
  </svg>
);

const BellIcon: React.FC<{fill: string; size: number}> = ({fill, size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={fill}
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
    />
  </svg>
);

const Cursor: React.FC = () => (
  <svg width={46} height={46} viewBox="0 0 24 24" style={{overflow: 'visible'}}>
    <path
      d="M3 2 L3 19.5 L7.6 15.4 L10.6 22 L13.6 20.7 L10.7 14.2 L17 14.2 Z"
      fill="#fff"
      stroke={INK}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);

// Ripple + particle burst at a click
const Burst: React.FC<{frame: number; at: number; color: string}> = ({frame, at, color}) => {
  const t = frame - at;
  if (t < 0 || t > 40) return null;
  const p = interpolate(t, [0, 34], [0, 1], {...clamp, easing: ease});
  const fade = interpolate(t, [10, 40], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0}}>
      {Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const r = 30 + p * (i % 2 ? 70 : 95);
        const s = (i % 2 ? 9 : 12) * (1 - p * 0.6);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: Math.cos(a) * r - s / 2,
              top: Math.sin(a) * r - s / 2,
              width: s,
              height: s,
              borderRadius: s,
              background: i % 3 === 0 ? '#fff' : color,
              opacity: fade,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }}
          />
        );
      })}
    </div>
  );
};

// Placement of the 1920x1080 bar inside the output frame. Portrait versions shrink the bar and keep it
// inside each platform's safe zone (clear of the right-hand action buttons and the caption area at the bottom).
type Layout = 'landscape' | 'shorts' | 'reels';
const GROUP_CX = 958; // horizontal centre of logo + pill in bar coordinates
const PLACEMENT: Record<Layout, {s: number; cx: number; cy: number}> = {
  landscape: {s: 1, cx: GROUP_CX, cy: CY},
  // YouTube Shorts: action column on the right from ~y 1000, title/channel block below ~y 1500
  shorts: {s: 0.82, cx: 470, cy: 1300},
  // Instagram Reels: icons on the right from ~y 1100, caption below ~y 1560, profile grid shows y 285-1635 only
  reels: {s: 0.82, cx: 470, cy: 1240},
};

export const SubscribeLike: React.FC<{bg?: 'transparent' | 'green' | 'preview'; layout?: Layout}> = ({
  bg = 'transparent',
  layout = 'landscape',
}) => {
  const place = PLACEMENT[layout];
  const portrait = layout !== 'landscape';
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- logo ----
  const logoIn = spring({frame: frame - T.logoIn, fps, config: {damping: 13, stiffness: 140, mass: 0.9}});
  const logoOut = interpolate(frame, [T.logoOut, T.logoOut + 22], [0, 1], {...clamp, easing: Easing.bezier(0.55, 0, 0.75, 0.2)});
  const subBump = spring({frame: frame - T.subClick - 4, fps, config: {damping: 8, stiffness: 220}});
  const bump = frame > T.subClick ? Math.sin(Math.min(subBump, 1) * Math.PI) * 0.08 : 0;
  const logoScale = logoIn * (1 - logoOut) * (1 + bump);
  const logoRot = interpolate(logoIn, [0, 1], [-160, 0]) + logoOut * 120;

  // ring pulse on intro and on subscribe
  const ring = (start: number) => {
    const t = frame - start;
    if (t < 0 || t > 36) return null;
    const p = interpolate(t, [0, 36], [0, 1], {...clamp, easing: ease});
    return (
      <div
        style={{
          position: 'absolute',
          left: LX - LOGO / 2,
          top: CY - LOGO / 2,
          width: LOGO,
          height: LOGO,
          borderRadius: '50%',
          border: `${6 * (1 - p) + 1}px solid ${RED}`,
          transform: `scale(${1 + p * 0.9})`,
          opacity: 1 - p,
        }}
      />
    );
  };

  // ---- pill ----
  const open = spring({frame: frame - T.pillOpen, fps, config: {damping: 18, stiffness: 120, mass: 1}});
  const close = interpolate(frame, [T.pillClose, T.pillClose + 24], [0, 1], {...clamp, easing: easeInOut});
  const pillW = PH + (PW - PH) * open * (1 - close);
  const pillOpacity = interpolate(frame, [T.pillOpen, T.pillOpen + 6], [0, 1], clamp) * (1 - interpolate(close, [0.75, 1], [0, 1], clamp));

  // content stagger in / out
  const item = (i: number) => {
    const s = spring({frame: frame - T.content - i * 6, fps, config: {damping: 16, stiffness: 150}});
    const out = interpolate(frame, [T.contentOut + i * 2, T.contentOut + 10 + i * 2], [0, 1], {...clamp, easing: easeInOut});
    return {opacity: Math.min(1, s * 1.4) * (1 - out), transform: `translateX(${(1 - s) * 40 - out * 20}px)`};
  };

  // shimmer
  const sh = interpolate(frame, [T.shimmer, T.shimmer + 40], [-0.3, 1.3], {...clamp, easing: easeInOut});

  // ---- cursor path ----
  const likeC = {x: LX + LIKE.x + LIKE.w / 2 + 8, y: CY + 14};
  const subC = {x: LX + SUB.x + SUB.w / 2 + 14, y: CY + 14};
  // cursor enters from / leaves to below the frame edge
  const start = portrait ? {x: 1250, y: 1720} : {x: 1560, y: 1180};
  const endP = portrait ? {x: 1360, y: 1760} : {x: 1640, y: 1200};
  const seg = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...clamp, easing: easeInOut});
  const m1 = seg(T.cursorIn, T.likeClick - 6);
  const m2 = seg(T.likeClick + 14, T.subClick - 6);
  const m3 = seg(T.cursorOut, T.cursorOut + 34);
  let cx = start.x + (likeC.x - start.x) * m1;
  let cy = start.y + (likeC.y - start.y) * m1 - Math.sin(m1 * Math.PI) * 60;
  cx += (subC.x - likeC.x) * m2;
  cy += -Math.sin(m2 * Math.PI) * 28;
  cx += (endP.x - subC.x) * m3;
  cy += (endP.y - subC.y) * m3;
  const press = (at: number) => {
    const t = frame - at;
    return t >= -3 && t <= 8 ? Math.sin(((t + 3) / 11) * Math.PI) : 0;
  };
  const cursorScale = 1 - 0.18 * (press(T.likeClick) + press(T.subClick));
  const cursorOpacity = interpolate(frame, [T.cursorIn, T.cursorIn + 8, T.cursorOut + 24, T.cursorOut + 34], [0, 1, 1, 0], clamp);

  // ---- like state ----
  const liked = spring({frame: frame - T.likeClick, fps, config: {damping: 9, stiffness: 200}});
  const likedOn = frame >= T.likeClick ? 1 : 0;
  const likePress = 1 - 0.08 * press(T.likeClick);
  const thumbPop = likedOn ? 1 + Math.sin(Math.min(liked, 1) * Math.PI) * 0.45 : 1;
  const thumbRot = likedOn ? -Math.sin(Math.min(liked, 1) * Math.PI) * 18 : 0;
  const likeBg = interpolateColors(likedOn * Math.min(liked, 1), [0, 1], [GREY, '#FDE7E7']);

  // ---- subscribe state ----
  const subP = interpolate(frame, [T.subClick, T.subClick + 12], [0, 1], {...clamp, easing: ease});
  const subPress = 1 - 0.08 * press(T.subClick);
  const subBg = interpolateColors(subP, [0, 1], [RED, '#E9E9E9']);
  const subFg = interpolateColors(subP, [0, 1], ['#ffffff', INK]);
  const bellT = frame - T.subClick - 6;
  const bellRot = bellT > 0 && bellT < 50 ? Math.sin(bellT * 0.55) * 26 * Math.exp(-bellT / 16) : 0;

  const background =
    bg === 'green'
      ? '#00FF00'
      : bg === 'preview'
        ? 'radial-gradient(ellipse at 30% 30%, #4a5568 0%, #1f2530 55%, #0d1015 100%)'
        : 'transparent';

  const btnBase: React.CSSProperties = {
    position: 'absolute',
    top: (PH - BTN_H) / 2,
    height: BTN_H,
    borderRadius: BTN_H / 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: 25,
    overflow: 'hidden',
  };

  return (
    <AbsoluteFill style={{background}}>
      <Audio src={staticFile('subscribe/sfx.wav')} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: '0 0',
          transform: `translate(${place.cx - GROUP_CX * place.s}px, ${place.cy - CY * place.s}px) scale(${place.s})`,
        }}
      >
      {/* pill */}
      <div
        style={{
          position: 'absolute',
          left: LX,
          top: CY - PH / 2,
          width: pillW,
          height: PH,
          borderRadius: PH / 2,
          background: '#ffffff',
          opacity: pillOpacity,
          overflow: 'hidden',
          boxShadow: '0 18px 50px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.18)',
        }}
      >
        {/* shimmer sweep */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sh * 100}%`,
            width: 160,
            transform: 'translateX(-50%) skewX(-20deg)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(208,24,27,0.10) 50%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* channel text */}
        <div style={{position: 'absolute', left: 100, top: 26, width: 340, ...item(0)}}>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 32, color: INK, letterSpacing: -0.5, lineHeight: 1.1}}>
            Music Store
          </div>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 19, color: '#6B6B6B', marginTop: 6}}>
            Abonnieren &amp; Like da lassen!
          </div>
        </div>

        {/* like button */}
        <div style={{...btnBase, left: LIKE.x, width: LIKE.w, ...item(1)}}>
          <div style={{...btnBase, position: 'absolute', inset: 0, top: 0, background: likeBg, transform: `scale(${likePress})`, color: INK}}>
            <div style={{transform: `scale(${thumbPop}) rotate(${thumbRot}deg)`, display: 'flex', transformOrigin: '30% 70%'}}>
              <ThumbIcon size={28} fill={likedOn ? RED : INK} />
            </div>
            <span>Like</span>
          </div>
        </div>

        {/* subscribe button */}
        <div style={{...btnBase, left: SUB.x, width: SUB.w, ...item(2)}}>
          <div
            style={{
              ...btnBase,
              position: 'absolute',
              inset: 0,
              top: 0,
              background: subBg,
              color: subFg,
              transform: `scale(${subPress})`,
            }}
          >
            <div style={{transform: `rotate(${bellRot}deg)`, transformOrigin: '50% 10%', display: 'flex'}}>
              <BellIcon size={28} fill={subFg} />
            </div>
            <div style={{position: 'relative', height: 34, width: 166, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', top: -subP * 34, lineHeight: '34px'}}>Abonnieren</div>
              <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', top: 34 - subP * 34, lineHeight: '34px'}}>Abonniert</div>
            </div>
          </div>
        </div>
      </div>

      {/* bursts (outside the pill so they can fly free) */}
      <div style={{position: 'absolute', left: LX + LIKE.x + 40, top: CY}}>
        <Burst frame={frame} at={T.likeClick} color={RED} />
      </div>
      <div style={{position: 'absolute', left: LX + SUB.x + SUB.w / 2, top: CY}}>
        <Burst frame={frame} at={T.subClick} color={RED} />
      </div>

      {/* logo + rings */}
      {ring(T.logoIn + 4)}
      {ring(T.subClick + 2)}
      <div
        style={{
          position: 'absolute',
          left: LX - LOGO / 2,
          top: CY - LOGO / 2,
          width: LOGO,
          height: LOGO,
          transform: `scale(${logoScale}) rotate(${logoRot}deg)`,
          borderRadius: '50%',
          boxShadow: `0 10px 30px rgba(0,0,0,${0.35 * logoScale})`,
          border: '5px solid #ffffff',
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: RED_DARK,
        }}
      >
        <Img src={staticFile('subscribe/msk-logo.png')} style={{width: '100%', height: '100%', display: 'block'}} />
      </div>

      {/* cursor */}
      <div
        style={{
          position: 'absolute',
          left: cx - 6,
          top: cy - 4,
          opacity: cursorOpacity,
          transform: `scale(${cursorScale})`,
          transformOrigin: '6px 4px',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))',
        }}
      >
        <Cursor />
      </div>
      </div>
    </AbsoluteFill>
  );
};
