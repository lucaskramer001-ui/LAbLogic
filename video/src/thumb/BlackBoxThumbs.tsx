import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BigText, C} from '../iceberg/art';
import {Arrow} from '../sun/space';
import {BigSci, useFonts} from './SunThumbs';
import {BlackBox, Plane} from '../blackbox/Main';

// YouTube thumbnails (1280x720) for the black box long-form, MrBeast style in the Lab Logic look.

const Rays: React.FC<{cx: number; cy: number; bg?: string; ray?: string}> = ({cx, cy, bg = C.sky, ray = C.skyL}) => (
  <g>
    <rect width={1280} height={720} fill={bg} />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      const R = 2500;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={ray} />;
    })}
  </g>
);
const Ring: React.FC<{cx: number; cy: number; rx: number; ry: number; rot?: number}> = ({cx, cy, rx, ry, rot = 0}) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={C.ink} strokeWidth={22} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={C.red} strokeWidth={12} />
  </g>
);

// A: "SURVIVES 3,400 G" - the smug box, circled; the scientist thinking it over.
export const BlackBoxThumbA: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={930} cy={480} />
        <BlackBox x={930} y={500} s={1.35} t={0.3} mood="smug" rot={-6} />
        <Ring cx={930} cy={490} rx={290} ry={215} rot={-6} />
      </svg>
      <BigSci pose="think" x={215} y={400} headR={128} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 120)">
          <BigText x={700} y={115} text="SURVIVES" size={92} />
          <BigText x={700} y={245} text="3,400 G" size={150} fill={C.yellow} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// B: "FOUND 3,900 M DOWN" - a submarine light finds the box on the dark sea floor.
export const BlackBoxThumbB: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={960} cy={560} bg="#10304F" ray="#163E63" />
        <path d="M 0 640 Q 400 610 800 650 T 1280 640 L 1280 720 L 0 720 Z" fill="#6B5E4A" stroke={C.ink} strokeWidth={7} />
        <path d="M 520 420 L 1100 300 L 1100 720 Z" fill={C.yellow} opacity={0.35} />
        <g transform="translate(470 420)">
          <rect x={-120} y={-60} width={240} height={120} rx={40} fill={C.yellow} stroke={C.ink} strokeWidth={7} />
          <circle cx={70} cy={0} r={34} fill={C.sky} stroke={C.ink} strokeWidth={6} />
        </g>
        <BlackBox x={980} y={560} s={1.0} t={0.3} mood="happy" rot={-10} />
        <Ring cx={980} cy={550} rx={220} ry={165} rot={-10} />
      </svg>
      <BigSci pose="point" x={190} y={400} headR={118} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 120)">
          <BigText x={720} y={120} text="FOUND" size={100} fill={C.paper} />
          <BigText x={720} y={240} text="3,900 M DOWN" size={110} fill={C.yellow} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// C: "TOO HEAVY TO FLY?!" - an armored airliner squashed on the runway, the box smug beside it.
export const BlackBoxThumbC: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={860} cy={430} />
        <rect x={0} y={560} width={1280} height={160} fill="#6E7378" />
        <line x1={0} x2={1280} y1={560} y2={560} stroke={C.ink} strokeWidth={7} />
        <Plane x={850} y={470} s={1.0} t={0.3} armor={1} mood="squeeze" />
        <BlackBox x={1150} y={600} s={0.55} t={0.3} mood="smug" />
        <Arrow x1={1150} y1={210} x2={1000} y2={370} color={C.red} w={24} head={52} />
      </svg>
      <BigSci pose="facepalm" x={200} y={400} headR={122} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 120)">
          <BigText x={700} y={120} text="TOO HEAVY" size={112} fill={C.yellow} />
          <BigText x={700} y={230} text="TO FLY?!" size={92} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
