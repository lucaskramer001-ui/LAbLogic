import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BigText, C, Face} from '../iceberg/art';
import {Arrow} from '../sun/space';
import {BigSci, useFonts} from './SunThumbs';
import {Bill, Loaf, Tag} from '../money/Main';

// YouTube thumbnails (1280x720) for the money long-form, MrBeast style in the Lab Logic look.

const Rays: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <g>
    <rect width={1280} height={720} fill={C.sky} />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      const R = 2500;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={C.skyL} />;
    })}
  </g>
);

const Ring: React.FC<{cx: number; cy: number; rx: number; ry: number; rot?: number}> = ({cx, cy, rx, ry, rot = 0}) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={C.ink} strokeWidth={22} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={C.red} strokeWidth={12} />
  </g>
);

// A: "FOR ONE LOAF?!" - a scared loaf with a 200,000,000,000 price tag (Berlin, late 1923).
export const MoneyThumbA: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={930} cy={520} />
        <Loaf x={930} y={735} s={1.75} t={0.4} mood="scared" />
        <Tag x={905} y={390} text="200,000,000,000" size={50} bg={C.red} rot={-3} />
        <Ring cx={900} cy={390} rx={350} ry={86} rot={-3} />
      </svg>
      <BigSci pose="shocked" x={215} y={400} headR={128} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 160)">
          <BigText x={700} y={125} text="FOR ONE" size={96} />
          <BigText x={700} y={262} text="LOAF?!" size={150} fill={C.yellow} />
        </g>
        <Arrow x1={1110} y1={230} x2={1050} y2={315} color={C.red} w={24} head={52} />
      </svg>
    </AbsoluteFill>
  );
};

// B: "100 TRILLION DOLLAR NOTE?!" - the giant Zimbabwe note with a smug face.
export const MoneyThumbB: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={900} cy={480} />
        <g transform="translate(900 500) rotate(-8)">
          <Bill x={0} y={0} s={2.6} label="" />
          <Face x={0} y={0} s={0.9} mood="smug" open={1} gap={50} />
        </g>
        <Ring cx={890} cy={500} rx={335} ry={205} rot={-8} />
      </svg>
      <BigSci pose="shocked" x={215} y={400} headR={128} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 640 140)">
          <BigText x={720} y={135} text="100 TRILLION" size={108} fill={C.yellow} />
          <BigText x={720} y={245} text="DOLLAR NOTE?!" size={84} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
