import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BigText, Berg, C, CapeTown, Sea, Tug, Rope} from '../iceberg/art';
import {Arrow} from '../sun/space';
import {BigSci, RedCircle, useFonts} from './SunThumbs';

// 16:9 YouTube thumbnails for the iceberg episode, in the channel's thumbnail style.

const SkyRays: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <g>
    <rect x={0} y={0} width={1280} height={720} fill={C.sky} />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      const R = 2500;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={C.skyL} />;
    })}
  </g>
);

// A: "90% HIDDEN" - the sea is cut open to show the giant underwater part of the berg.
export const IcebergThumbA: React.FC = () => {
  useFonts();
  const wl = 330;
  const berg = {x: 900, s: 0.78};
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <SkyRays cx={berg.x} cy={wl - 120} />
        <Sea y={wl} t={0.4} x0={-20} x1={1300} depth={600} />
        <rect x={-20} y={wl + 260} width={1320} height={400} fill={C.seaDeep} />
        <Berg x={berg.x} y={wl} s={berg.s} under={1} face={{mood: 'smug', look: {x: -0.8, y: 0.2}}} />
        <Sea y={wl} t={0.4} x0={-20} x1={1300} depth={0} />
        <Tug x={1180} y={wl} s={0.32} />
        <Rope x1={1180 - 211 * 0.32} y1={wl - 24} x2={berg.x + 190 * berg.s} y2={wl - 30} sag={10} />
      </svg>
      <BigSci pose="shocked" x={230} y={470} headR={122} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 300 120)">
          <BigText x={40} y={175} text="90%" size={190} fill={C.yellow} anchor="start" />
          <BigText x={46} y={275} text="HIDDEN" size={100} fill={C.paper} anchor="start" />
        </g>
        <Arrow x1={575} y1={215} x2={665} y2={410} color={C.red} w={26} head={56} />
      </svg>
    </AbsoluteFill>
  );
};

// B: "3 KM ICEBERG?!" - a giant iceberg towering over Cape Town.
export const IcebergThumbB: React.FC = () => {
  useFonts();
  const wl = 560;
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <SkyRays cx={860} cy={300} />
        <CapeTown x={520} y={wl} s={0.26} />
        <Sea y={wl} t={0.4} x0={-20} x1={1300} depth={300} />
        <Berg x={1010} y={wl} s={1.6} face={{mood: 'smug', look: {x: -1, y: 0.4}}} />
        <RedCircle x={520} y={wl - 45} r={100} />
      </svg>
      <BigSci pose="shocked" x={215} y={470} headR={122} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 300 120)">
          <BigText x={40} y={165} text="3 KM" size={180} fill={C.yellow} anchor="start" />
          <BigText x={46} y={265} text="ICEBERG?!" size={96} fill={C.paper} anchor="start" />
        </g>
        <Arrow x1={650} y1={250} x2={590} y2={395} color={C.red} w={24} head={52} />
      </svg>
    </AbsoluteFill>
  );
};
