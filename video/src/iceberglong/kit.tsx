// Shared building blocks for 1920x1080 long-form videos (stage, labels, probe, end card).
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile} from 'remotion';
import {C, Drop, FONT_DISPLAY, INK_W, Pill as BasePill, Sunburst} from '../iceberg/art';
import {clamp, easeOutCubic, pop, prog, rnd} from '../iceberg/anim';

export const W = 1920;
export const H = 1080;

// Labels a bit larger than in the Shorts so they read on a phone in landscape.
export const Pill: React.FC<React.ComponentProps<typeof BasePill>> = (p) => <BasePill {...p} size={(p.size ?? 54) * 1.18} />;

export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-900-normal.woff2')})`, {weight: '900'}),
      new FontFace('Montserrat', `url(${staticFile('fonts/montserrat-latin-800-normal.woff2')})`, {weight: '800'}),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
};

export const Stage: React.FC<{cam?: {x?: number; y?: number; s?: number}; children: React.ReactNode}> = ({cam = {}, children}) => {
  const {x = W / 2, y = H / 2, s = 1} = cam;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px) scale(${s}) translate(${-x}px, ${-y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
export const Layer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);
export const punch = (t: number, t0: number) => 1 + 0.04 * (1 - easeOutCubic(clamp((t - t0) / 0.35)));
export const blink = (t: number, period = 3.7, off = 0) => {
  const d = (((t + off) % period) + period) % period;
  return d < 0.12 ? Math.abs(d - 0.06) / 0.06 : 1;
};
// 1 until t1, then shrinks to 0 over 0.25 s (labels leave before the next one takes their place).
export const until = (t: number, t1: number) => 1 - prog(t, t1 - 0.25, t1, (u) => u);
// pop in at t0, shrink away before t1
export const span = (t: number, t0: number, t1 = 1e9, dur = 0.45) => pop(t, t0, dur) * until(t, t1);

// Sky-blue sunburst covering the whole 1920x1080 frame.
export const Burst: React.FC<{t: number; cx: number; cy: number}> = ({t, cx, cy}) => (
  <g>
    <rect x={-1000} y={-1000} width={4000} height={3000} fill={C.sky} />
    <Sunburst t={t} cx={cx} cy={cy} />
  </g>
);

export const Ground: React.FC<{y: number; color?: string}> = ({y, color = '#8CCB6B'}) => (
  <g>
    <rect x={-3000} y={y} width={9000} height={2000} fill={color} />
    <line x1={-3000} x2={6000} y1={y} y2={y} stroke={C.ink} strokeWidth={INK_W} />
  </g>
);

// Wooden pier (deck top at y).
export const Pier: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    {Array.from({length: Math.ceil((x1 - x0) / 120)}).map((_, i) => (
      <rect key={i} x={x0 + 30 + i * 120} y={y + 20} width={26} height={260} fill="#8A5A34" stroke={C.ink} strokeWidth={6} />
    ))}
    <rect x={x0} y={y} width={x1 - x0} height={34} fill="#B07A47" stroke={C.ink} strokeWidth={INK_W} />
    <line x1={x0} x2={x1} y1={y + 12} y2={y + 12} stroke="#8A5A34" strokeWidth={4} />
  </g>
);

// Small flat ice floe (top at y).
export const Floe: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <g>
    <path d={`M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2 - 14} ${y + 46} L ${x - w / 2 + 18} ${y + 50} Z`} fill={C.ice} stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
    <path d={`M ${x - w / 2 + 6} ${y + 24} L ${x + w / 2 - 8} ${y + 24} L ${x + w / 2 - 14} ${y + 46} L ${x - w / 2 + 18} ${y + 50} Z`} fill={C.iceUnder} />
    <path d={`M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2 - 14} ${y + 46} L ${x - w / 2 + 18} ${y + 50} Z`} fill="none" stroke={C.ink} strokeWidth={INK_W} strokeLinejoin="round" />
  </g>
);

export const Splash: React.FC<{x: number; y: number; t: number; t0: number; n?: number; size?: number}> = ({x, y, t, t0, n = 9, size = 1}) => {
  const d = t - t0;
  if (d < 0 || d > 1.1) return null;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const a = -Math.PI / 2 + (rnd(i + 3) - 0.5) * 2.2;
        const v = (420 + rnd(i + 11) * 380) * size;
        const px = x + Math.cos(a) * v * d;
        const py = y + Math.sin(a) * v * d + 0.5 * 1800 * d * d;
        if (py > y + 20) return null;
        const sc = Math.max(0, 1 - d * 0.9) * (0.7 + rnd(i) * 0.6) * size;
        return <Drop key={i} x={px} y={py} s={sc} color={C.seaL} />;
      })}
    </g>
  );
};

export const Stars: React.FC<{x: number; y: number; t: number; t0: number}> = ({x, y, t, t0}) => {
  const d = t - t0;
  if (d < 0 || d > 1.4) return null;
  const sc = Math.min(1, d * 6) * (d > 1.1 ? (1.4 - d) / 0.3 : 1);
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const a = d * 5 + (i * Math.PI * 2) / 3;
        return (
          <path
            key={i}
            transform={`translate(${x + Math.cos(a) * 110} ${y + Math.sin(a) * 34}) scale(${sc})`}
            d="M 0 -26 L 8 -8 L 27 -8 L 12 4 L 18 24 L 0 12 L -18 24 L -12 4 L -27 -8 L -8 -8 Z"
            fill={C.yellow}
            stroke={C.ink}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

export const Check: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={90} fill={C.green} stroke={C.ink} strokeWidth={INK_W} />
    <path d="M -42 4 L -10 36 L 46 -30" stroke={C.ink} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
export const Cross: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={90} fill={C.red} stroke={C.ink} strokeWidth={INK_W} />
    <path d="M -36 -36 L 36 36 M 36 -36 L -36 36" stroke={C.paper} strokeWidth={20} fill="none" strokeLinecap="round" />
  </g>
);

// Plain outlined text (for list items and small captions).
export const Txt: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, size = 50, fill = C.paper, anchor = 'start'}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT_DISPLAY} fontWeight={900} fontSize={size} fill={fill} stroke={C.ink} strokeWidth={size * 0.2} paintOrder="stroke fill" strokeLinejoin="round">
    {text}
  </text>
);

export const EndCard: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const s = pop(t, t0 + 0.05, 0.5);
  return (
    <Stage>
      <Layer>
        <Burst t={t} cx={960} cy={540} />
        <g transform={`translate(960 760) scale(${pop(t, t0 + 0.5)})`}>
          <rect x={-560 + 8} y={-50 + 8} width={1120} height={100} rx={50} fill={C.ink} />
          <rect x={-560} y={-50} width={1120} height={100} rx={50} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={17} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={46} letterSpacing={2} fill={C.ink}>
            OBVIOUS FIXES. SURPRISING ANSWERS.
          </text>
        </g>
      </Layer>
      <Img src={staticFile('iceberg/wordmark.png')} style={{position: 'absolute', left: 960 - 550 * s, top: 420 - 100 * s, width: 1100 * s}} />
    </Stage>
  );
};

// QA only (input prop {probe: true}): log the on-screen box of every label, text and character cut-out.
export const LayoutProbe: React.FC<{root: React.RefObject<HTMLDivElement | null>; frame: number}> = ({root, frame}) => {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    const sx = base.width / W;
    const visible = (n: Element) => {
      for (let e: Element | null = n; e && e !== el; e = e.parentElement) {
        const o = e.getAttribute('opacity');
        if (o !== null && parseFloat(o) < 0.05) return false;
        const st = (e as HTMLElement).style;
        if (st && st.opacity !== '' && parseFloat(st.opacity) < 0.05) return false;
      }
      return true;
    };
    const box = (n: Element) => {
      const r = n.getBoundingClientRect();
      return [(r.left - base.left) / sx, (r.top - base.top) / sx, r.width / sx, r.height / sx].map((v) => Math.round(v));
    };
    const items: Array<{k: string; t: string; b: number[]; inner?: number[]}> = [];
    el.querySelectorAll('[data-label]').forEach((g) => {
      if (!visible(g)) return;
      const b = box(g);
      if (b[2] < 4 || b[3] < 4) return;
      const txt = g.querySelector('text');
      const rect = g.querySelector('rect');
      items.push({k: 'label', t: g.getAttribute('data-label') || '', b, inner: txt && rect ? [...box(txt), ...box(rect)] : undefined});
    });
    el.querySelectorAll('text').forEach((tx) => {
      if (tx.closest('[data-label]') || !visible(tx)) return;
      const b = box(tx);
      if (b[2] < 4 || !tx.textContent) return;
      items.push({k: 'text', t: tx.textContent, b});
    });
    el.querySelectorAll('[data-obj]').forEach((g) => {
      if (!visible(g)) return;
      items.push({k: 'obj', t: g.getAttribute('data-obj') || '', b: box(g)});
    });
    el.querySelectorAll('img').forEach((im) => {
      const src = im.getAttribute('src') || '';
      if (!src.includes('/sci/')) return;
      items.push({k: 'sci', t: src.split('/').pop() || '', b: box(im)});
    });
    console.log('LAYOUT ' + JSON.stringify({f: frame, items}));
  });
  return null;
};
