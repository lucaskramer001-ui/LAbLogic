import React from 'react';
import {Img, staticFile} from 'remotion';
import {SPRITES} from './sprites';
import {clamp} from './anim';

export type Pose = 'rope' | 'point' | 'think' | 'thumbs' | 'shocked' | 'nervous' | 'bucket' | 'facepalm';

// The scientist: a cut-out picture per pose. Swaps happen on the narrowest frame of a quick squash
// (never a cross-fade). x/y = feet in scene coordinates; headR = on-screen head radius.
export const Sci: React.FC<{
  t: number;
  x: number;
  y: number;
  headR?: number;
  poses: Array<[number, Pose]>;
  flip?: boolean;
  tremble?: number;
  hop?: number; // extra vertical offset (jumps)
  rot?: number;
}> = ({t, x, y, headR = 44, poses, flip = false, tremble = 0, hop = 0, rot = 0}) => {
  let pose = poses[0][1];
  let swapT = -99;
  for (const [ts, p] of poses) {
    if (t >= ts) {
      pose = p;
      swapT = ts;
    }
  }
  // the next swap (to squash in before it)
  const next = poses.find(([ts]) => ts > t);
  const dPrev = t - swapT;
  const dNext = next ? next[0] - t : 99;
  const W = 0.09;
  let sx = 1;
  let sy = 1;
  if (dNext < W) {
    const u = 1 - dNext / W;
    sx = 1 - 0.2 * u;
    sy = 1 + 0.03 * u;
  } else if (dPrev < 0.5 && swapT > 0) {
    const u = dPrev;
    if (u < W) {
      sx = 0.8 + 0.2 * (u / W);
      sy = 1.03 - 0.03 * (u / W);
    } else {
      // settle with a small damped stretch
      const k = Math.exp(-9 * (u - W)) * Math.cos(16 * (u - W));
      sy = 1 + 0.035 * k;
      sx = 1 - 0.02 * k;
    }
  }
  // breathing on holds
  sy *= 1 + 0.009 * Math.sin(t * 2 * Math.PI * 0.6);
  const sp = SPRITES[pose];
  const k = headR / sp.headR;
  const tx = tremble * (Math.sin(t * 71) * 1.5 + Math.sin(t * 43) * 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: x + tx,
        top: y + hop,
        width: 0,
        height: 0,
        transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * sx}, ${sy})`,
        transformOrigin: '0 0',
      }}
    >
      {/* contact shadow */}
      <div
        style={{
          position: 'absolute',
          left: -sp.w * k * 0.32,
          top: -10 - hop,
          width: sp.w * k * 0.64,
          height: 22,
          borderRadius: '50%',
          background: 'rgba(20,20,20,0.22)',
          filter: 'blur(3px)',
          opacity: clamp(1 - Math.abs(hop) / 200),
        }}
      />
      <Img
        src={staticFile(`iceberg/sci/${pose}.png`)}
        style={{position: 'absolute', left: -sp.footX * k, top: -sp.footY * k, width: sp.w * k, height: sp.h * k}}
      />
    </div>
  );
};
