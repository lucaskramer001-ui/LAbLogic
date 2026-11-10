import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BigText, C, PriceTag, textWidth} from '../iceberg/art';
import {Arrow} from '../sun/space';
import {BigSci, RedCircle} from '../thumb/SunThumbs';
import {BOLT, Bolt, LitHouse, NIGHT, NIGHT_L, Tower} from './Main';

// MrBeast-style 9:16 covers for the lightning Short (frame 0 + Stills). Grid-safe: everything in rows 240-1680.
const W = 1080;
const H = 1920;

const Rays: React.FC<{cx: number; cy: number; bg: string; ray: string}> = ({cx, cy, bg, ray}) => (
  <g>
    <rect width={W} height={H} fill={bg} />
    {Array.from({length: 18}).map((_, i) => {
      const a0 = (i / 18) * Math.PI * 2;
      const a1 = a0 + Math.PI / 18;
      const R = 3200;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={ray} />;
    })}
  </g>
);

// Two text lines, auto-sized to fit the width, rotated -4 deg.
const Headline: React.FC<{l1: string; l2: string; max1?: number; max2?: number; c2?: string}> = ({l1, l2, max1 = 120, max2 = 210, c2 = C.yellow}) => {
  const fit = (s: string, max: number, room: number) => Math.min(max, room / (textWidth(s, 1, 900) + 0.2));
  const s1 = fit(l1, max1, 950);
  const s2 = fit(l2, max2, 1000);
  return (
    <g transform="rotate(-4 540 640)">
      <BigText x={540} y={540} text={l1} size={s1} />
      <BigText x={540} y={560 + s2 * 0.95} text={l2} size={s2} fill={c2} />
    </g>
  );
};
const Burst: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  const pts = Array.from({length: 24}).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.55 : r;
    return `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr * 0.6}`;
  });
  return (
    <g>
      <path d={'M ' + pts.join(' L ') + ' Z'} fill={C.ink} transform="translate(8 8)" />
      <path d={'M ' + pts.join(' L ') + ' Z'} fill={BOLT} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    </g>
  );
};
const RAY_N = '#3A5285';
const Mark: React.FC = () => <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 540 - 210, top: 280, width: 420}} />;

// A: "300 MILLION VOLTS / WASTED?!" - a giant smug bolt slams the ground next to a dark little house.
export const LightningCoverA: React.FC<{t?: number}> = () => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Rays cx={600} cy={1300} bg={NIGHT} ray={RAY_N} />
      <rect x={0} y={1600} width={W} height={320} fill="#3E4A5E" />
      <line x1={0} x2={W} y1={1600} y2={1600} stroke={C.ink} strokeWidth={7} />
      <circle cx={700} cy={1150} r={420} fill={BOLT} opacity={0.18} />
      <Burst x={560} y={1600} r={170} />
      <Bolt x={650} y={700} s={1.42} rot={3} mood="smug" />
      <LitHouse x={915} y={1600} s={1.6} lit={0} />
      <RedCircle x={915} y={1515} r={140} />
    </svg>
    <BigSci pose="shocked" x={185} y={1240} headR={135} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Headline l1="300 MILLION VOLTS" l2="WASTED?!" max2={260} />
      <Arrow x1={1010} y1={880} x2={985} y2={1340} color={C.red} w={28} head={62} />
    </svg>
    <Mark />
  </AbsoluteFill>
);

// B: "FREE POWER / NOBODY USES?!" - the bolt wears a FREE price tag.
export const LightningCoverB: React.FC<{t?: number}> = () => (
  <AbsoluteFill style={{backgroundColor: C.sky}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Rays cx={680} cy={1200} bg={C.sky} ray={C.skyL} />
      <circle cx={680} cy={1150} r={420} fill="#fff" opacity={0.25} />
      <Bolt x={640} y={720} s={1.42} rot={5} mood="smug" />
      <PriceTag x={880} y={1210} s={1.25} rot={10} text="FREE" />
      <RedCircle x={880} y={1340} r={185} />
    </svg>
    <BigSci pose="present" x={190} y={1240} headR={135} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Headline l1="FREE POWER" l2="NOBODY USES?!" max1={150} />
    </svg>
    <Mark />
  </AbsoluteFill>
);

// C: "1 YEAR OF LIGHTNING / = 3 HOMES?!" - the skyscraper gets hit, three tiny houses circled.
export const LightningCoverC: React.FC<{t?: number}> = () => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Rays cx={640} cy={1200} bg={NIGHT} ray={RAY_N} />
      <rect x={0} y={1640} width={W} height={280} fill="#3E4A5E" />
      <line x1={0} x2={W} y1={1640} y2={1640} stroke={C.ink} strokeWidth={7} />
      <Tower x={640} y={1640} s={0.85} mood="smug" />
      {[0, 1, 2].map((i) => (
        <LitHouse key={i} x={845 + i * 80} y={1640} s={0.72} lit={1} />
      ))}
      <RedCircle x={925} y={1590} r={105} />
    </svg>
    <BigSci pose="calc" x={185} y={1240} headR={135} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <Headline l1="1 YEAR OF LIGHTNING" l2="= 3 HOMES?!" max2={240} />
      <Arrow x1={1010} y1={900} x2={985} y2={1450} color={C.red} w={28} head={62} />
    </svg>
    <Mark />
  </AbsoluteFill>
);
