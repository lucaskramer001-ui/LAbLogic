import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BigText, C, FONT_DISPLAY, INK_W} from '../iceberg/art';
import {Arrow} from '../sun/space';
import {BigSci, RedCircle, useFonts} from '../thumb/SunThumbs';
import {Body, Heart, Photo, Voyager} from './Main';

// 16:9 thumbnails (1280x720) for "Why Don't We Just Turn Voyager 1 Off?". Three variants for Test & Compare.
// Scientist poses: A point, B shocked, C phone (the last covers used shocked/shrug/think).

const SPACE = '#141634';
const RAY = '#262E63';

const Rays: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <g>
    <rect x={0} y={0} width={1280} height={720} fill={SPACE} />
    {Array.from({length: 16}).map((_, i) => {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      const R = 2500;
      return <path key={i} d={`M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`} fill={RAY} />;
    })}
    {Array.from({length: 40}).map((_, i) => (
      <circle key={i} cx={(i * 337) % 1280} cy={(i * 191) % 720} r={2 + (i % 3)} fill="#fff" opacity={0.7} />
    ))}
  </g>
);

// A: "STILL ALIVE?!" - a worn-out Voyager with a bandaged dish, four patched hearts and one last one.
export const VoyagerThumbA: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={900} cy={360} />
        <circle cx={900} cy={360} r={300} fill="#3A4790" />
        {/* heart-monitor line from a tiny Earth */}
        <path d="M 640 660 L 760 660 L 790 610 L 820 700 L 850 640 L 880 660 L 1280 660" stroke={C.green} strokeWidth={8} fill="none" strokeLinejoin="round" />
        <Body k="earth" x={600} y={655} r={42} t={0.3} face={false} />
        <Voyager x={930} y={330} s={1.55} t={0.2} mood="worried" />
        <g transform="translate(930 210) rotate(-18)">
          <rect x={-70} y={-20} width={140} height={40} rx={10} fill="#F6D7A7" stroke={C.ink} strokeWidth={5} />
          <circle cx={-20} cy={0} r={4} fill={C.ink} />
          <circle cx={20} cy={0} r={4} fill={C.ink} />
        </g>
        {[0, 1, 2, 3].map((i) => (
          <Heart key={i} x={760 + i * 70} y={560} s={0.75} state="patched" />
        ))}
        <Heart x={760 + 4 * 70 + 10} y={555} s={1.05} state="ok" />
        <RedCircle x={1050} y={552} r={58} />
      </svg>
      <BigSci pose="point" x={230} y={470} headR={122} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 300 120)">
          <BigText x={40} y={165} text="STILL" size={150} fill={C.paper} anchor="start" />
          <BigText x={46} y={290} text="ALIVE?!" size={150} fill={C.yellow} anchor="start" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// B: "1977 TECH" - the real 1977 photo of Voyager 1 next to a phone; 69 KB circled.
export const VoyagerThumbB: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={850} cy={380} />
        <Photo src="v1ksc" iw={1100} ih={1309} x={800} y={380} w={400} t={10} t0={0} rot={5} label="VOYAGER 1, 1977" />
        <g transform="translate(1110 470) rotate(10)">
          <circle cx={8} cy={10} r={105} fill={C.ink} />
          <circle cx={0} cy={0} r={105} fill={C.yellow} stroke={C.ink} strokeWidth={INK_W} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={58} fill={C.ink}>
            69 KB
          </text>
          <text x={0} y={46} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={30} fill={C.ink}>
            MEMORY
          </text>
        </g>
        <RedCircle x={1110} y={470} r={150} />
        <Arrow x1={1010} y1={110} x2={1070} y2={290} color={C.red} w={22} head={50} />
      </svg>
      <BigSci pose="shocked" x={210} y={470} headR={122} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 300 120)">
          <BigText x={40} y={170} text="1977" size={170} fill={C.yellow} anchor="start" />
          <BigText x={46} y={270} text="TECH" size={100} fill={C.paper} anchor="start" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// C: "1 DAY DELAY" - the scientist with his phone, a long dotted line to a tiny Voyager, the timer.
export const VoyagerThumbC: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <Rays cx={1150} cy={220} />
        <line x1={420} y1={420} x2={1150} y2={230} stroke="#fff" strokeWidth={6} strokeDasharray="16 16" />
        <Voyager x={1160} y={215} s={0.42} t={0.4} mood="surprised" />
        <g transform="translate(840 520) rotate(-3)">
          <rect x={-300 + 10} y={-70 + 10} width={600} height={140} rx={70} fill={C.ink} />
          <rect x={-300} y={-70} width={600} height={140} rx={70} fill="#2B2F45" stroke={C.ink} strokeWidth={INK_W} />
          <text x={0} y={28} textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight={700} fontSize={86} fill={C.green}>
            23:59:59
          </text>
        </g>
        <RedCircle x={1160} y={215} r={110} />
      </svg>
      <BigSci pose="phone" x={230} y={460} headR={122} />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g transform="rotate(-4 300 120)">
          <BigText x={40} y={165} text="1 DAY" size={160} fill={C.yellow} anchor="start" />
          <BigText x={46} y={270} text="DELAY" size={100} fill={C.paper} anchor="start" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
