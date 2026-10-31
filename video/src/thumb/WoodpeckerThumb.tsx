import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile} from 'remotion';
import {BigText, C, INK_W} from '../iceberg/art';
import {SPRITES} from '../iceberg/sprites';
import {Arrow} from '../sun/space';

// Woodpecker thumbnail rebuilt in the channel's thumbnail style: huge dizzy scientist,
// one big main object (the woodpecker mid-peck), two lines of text, red circle + arrow.

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

const Burst: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
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

// Comic impact star where the beak hits the bark.
const Impact: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.5 : r * (0.9 + 0.15 * Math.sin(i * 3));
    pts.push(`${x + rr * Math.cos(a)} ${y + rr * Math.sin(a)}`);
  }
  return (
    <g>
      <path d={'M ' + pts.join(' L ') + ' Z'} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={r * 0.28} fill={C.paper} />
    </g>
  );
};

const Chip: React.FC<{x: number; y: number; rot: number; s: number}> = ({x, y, rot, s}) => (
  <rect x={x - 14 * s} y={y - 7 * s} width={28 * s} height={14 * s} rx={3} fill="#A86A36" stroke={C.ink} strokeWidth={4} transform={`rotate(${rot} ${x} ${y})`} />
);

const Dizzy: React.FC<{x: number; y: number; headR: number}> = ({x, y, headR}) => {
  const sp = SPRITES.dizzy;
  const k = headR / sp.headR;
  const o = 7;
  const filter = [`${o}px 0`, `-${o}px 0`, `0 ${o}px`, `0 -${o}px`].map((d) => `drop-shadow(${d} 0 #FFD23F)`).join(' ') + ' drop-shadow(0 0 2px #141414)';
  return (
    <Img
      src={staticFile('iceberg/sci/dizzy.png')}
      style={{position: 'absolute', left: x - sp.headX * k, top: y - sp.headY * k, width: sp.w * k, height: sp.h * k, filter}}
    />
  );
};

const Stars: React.FC<{x: number; y: number; rx: number}> = ({x, y, rx}) => (
  <g>
    <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.28} fill="none" stroke={C.paper} strokeWidth={5} strokeDasharray="12 10" />
    {[0.3, 2.2, 4.1].map((a, i) => (
      <path
        key={i}
        transform={`translate(${x + Math.cos(a) * rx} ${y + Math.sin(a) * rx * 0.28}) scale(1.3)`}
        d="M 0 -26 L 8 -8 L 27 -8 L 12 4 L 18 24 L 0 12 L -18 24 L -12 4 L -27 -8 L -8 -8 Z"
        fill={C.yellow}
        stroke={C.ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
    ))}
  </g>
);

export const WoodpeckerThumb: React.FC = () => {
  useFonts();
  // Woodpecker cut-out: 805x1500, beak tip at (6, 152), claw tips at about (250, 700), head at (300, 205).
  // It is tilted into a downward peck around the beak tip so the claws (and tail) rest on the trunk edge.
  const s = 0.56;
  const tilt = 15;
  const rad = (tilt * Math.PI) / 180;
  const tip = {x: 812, y: 225};
  const rel = (px: number, py: number) => {
    const dx = (px - 6) * s;
    const dy = (py - 152) * s;
    return {x: tip.x + dx * Math.cos(rad) - dy * Math.sin(rad), y: tip.y + dx * Math.sin(rad) + dy * Math.cos(rad)};
  };
  const claws = rel(250, 700);
  const trunk = {x0: claws.x - 150, x1: claws.x + 4};
  const head = rel(300, 205);
  const bird = {left: tip.x - 6 * s, top: tip.y - 152 * s};
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Burst cx={tip.x} cy={tip.y} />
        {/* tree trunk */}
        <rect x={trunk.x0} y={-20} width={trunk.x1 - trunk.x0} height={760} fill="#9C5B2E" stroke={C.ink} strokeWidth={INK_W} />
        <rect x={trunk.x1 - 40} y={-20} width={40} height={760} fill="#82491F" />
        <rect x={trunk.x0} y={-20} width={trunk.x1 - trunk.x0} height={760} fill="none" stroke={C.ink} strokeWidth={INK_W} />
        {[[720, 420, 120], [760, 560, 140], [735, 40, 90]].map(([x, y, h], i) => (
          <path key={i} d={`M ${x} ${y} q 6 ${h / 2} 0 ${h}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
        ))}
      </svg>
      <Img
        src={staticFile('woodpecker/woodpecker.png')}
        style={{
          position: 'absolute',
          left: bird.left,
          top: bird.top,
          width: 805 * s,
          height: 1500 * s,
          transformOrigin: `${6 * s}px ${152 * s}px`,
          transform: `rotate(${tilt}deg)`,
        }}
      />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Impact x={tip.x + 6} y={tip.y + 2} r={58} />
        <Chip x={trunk.x0 + 60} y={tip.y - 80} rot={-30} s={1.2} />
        <Chip x={trunk.x0 + 30} y={tip.y + 90} rot={40} s={1} />
        <Chip x={trunk.x0 - 50} y={tip.y + 10} rot={15} s={1.1} />
      </svg>
      <Dizzy x={250} y={470} headR={128} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Stars x={255} y={362} rx={138} />
        <ellipse cx={head.x} cy={head.y} rx={150} ry={130} fill="none" stroke={C.ink} strokeWidth={22} />
        <ellipse cx={head.x} cy={head.y} rx={150} ry={130} fill="none" stroke={C.red} strokeWidth={12} />
        <g transform="rotate(-4 300 120)">
          <BigText x={40} y={175} text="400 G" size={175} fill={C.yellow} anchor="start" />
          <BigText x={48} y={265} text="NO HEADACHE?" size={74} fill={C.paper} anchor="start" />
        </g>
        <Arrow x1={640} y1={95} x2={head.x - 150} y2={head.y - 95} color={C.red} w={26} head={56} />
      </svg>
    </AbsoluteFill>
  );
};
