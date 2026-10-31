import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile} from 'remotion';
import {BigText, C} from '../iceberg/art';
import {SPRITES} from '../iceberg/sprites';
import {Arrow, Rocket, SPACE, SPACE_L, Sun, TrashBag} from '../sun/space';

// YouTube thumbnails (1280x720) for the trash-into-the-Sun video: MrBeast-style composition
// (huge shocked face, one big object, 2-3 words, red arrow/circle) in the Lab Logic look.

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const f = new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-900-normal.woff2')})`, {weight: '900'});
    f.load().then((l) => {
      document.fonts.add(l);
      continueRender(handle);
    });
  }, [handle]);
};

// Dark sunburst radiating from the Sun (flat colours, no gradients).
const Rays: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <g>
    <rect x={0} y={0} width={1280} height={720} fill={SPACE} />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      const R = 2500;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={SPACE_L} />;
    })}
  </g>
);

// The scientist, big and close (feet far below the frame), with a thick yellow rim like a sticker.
const BigSci: React.FC<{pose: string; x: number; y: number; headR: number; flip?: boolean}> = ({pose, x, y, headR, flip}) => {
  const sp = SPRITES[pose];
  const k = headR / sp.headR;
  const w = sp.w * k;
  const h = sp.h * k;
  const left = x - sp.headX * k;
  const top = y - sp.headY * k;
  const style: React.CSSProperties = {position: 'absolute', left, top, width: w, height: h, transform: flip ? 'scaleX(-1)' : undefined};
  // sticker outline: stacked hard drop-shadows in Lab Yellow, then an ink edge
  const o = 7;
  const y1 = '#FFD23F';
  const filter = [`${o}px 0`, `-${o}px 0`, `0 ${o}px`, `0 -${o}px`].map((d) => `drop-shadow(${d} 0 ${y1})`).join(' ') + ' drop-shadow(0 0 2px #141414)';
  return <Img src={staticFile(`iceberg/sci/${pose}.png`)} style={{...style, filter}} />;
};

const RedCircle: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g>
    <ellipse cx={x} cy={y} rx={r * 1.08} ry={r} fill="none" stroke={C.ink} strokeWidth={22} />
    <ellipse cx={x} cy={y} rx={r * 1.08} ry={r} fill="none" stroke={C.red} strokeWidth={12} />
  </g>
);

// A: "55× HARDER" — the trash rocket swings around the Sun and misses.
export const SunThumbA: React.FC = () => {
  useFonts();
  const sun = {x: 1010, y: 360, r: 235};
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={sun.x} cy={sun.y} />
        <Sun x={sun.x} y={sun.y} r={sun.r} t={0.6} face={{mood: 'smug', look: {x: -1, y: 0.2}}} />
        {/* the miss: dashed path curving around the Sun */}
        <path d={`M 520 640 Q 700 250 ${sun.x - 60} 70 Q ${sun.x + 220} 0 1240 120`} stroke={C.ink} strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={`M 520 640 Q 700 250 ${sun.x - 60} 70 Q ${sun.x + 220} 0 1240 120`} stroke={C.paper} strokeWidth={7} fill="none" strokeDasharray="22 18" strokeLinecap="round" />
        <Rocket x={1180} y={110} s={0.42} rot={78} flame={1} t={0.3} bag />
        <TrashBag x={690} y={350} s={1.5} rot={-14} face={{mood: 'scared', look: {x: 1, y: -0.3}}} />
        <RedCircle x={690} y={350} r={128} />
      </svg>
      <BigSci pose="shocked" x={250} y={330} headR={150} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 110)">
          <BigText x={560} y={140} text="55× HARDER" size={128} fill={C.yellow} />
        </g>
        <Arrow x1={540} y1={190} x2={600} y2={245} color={C.red} w={26} head={56} />
      </svg>
    </AbsoluteFill>
  );
};

// B: "IT MISSES?!" — trash bag flying straight at the Sun's face, Sun dodges smugly.
export const SunThumbB: React.FC = () => {
  useFonts();
  const sun = {x: 1000, y: 380, r: 250};
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={sun.x} cy={sun.y} />
        <Sun x={sun.x} y={sun.y} r={sun.r} t={1.1} face={{mood: 'smug', look: {x: -1, y: -0.4}}} />
        <path d={`M 600 430 Q 760 120 ${sun.x} 90 Q 1180 80 1270 260`} stroke={C.ink} strokeWidth={20} fill="none" strokeLinecap="round" />
        <path d={`M 600 430 Q 760 120 ${sun.x} 90 Q 1180 80 1270 260`} stroke={C.yellow} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray="24 16" />
        <TrashBag x={600} y={440} s={1.4} rot={12} face={{mood: 'smug', look: {x: 1, y: -0.4}}} />
        <RedCircle x={600} y={440} r={120} />
      </svg>
      <BigSci pose="shocked" x={230} y={320} headR={150} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 110)">
          <BigText x={720} y={150} text="IT MISSES?!" size={130} fill={C.yellow} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
