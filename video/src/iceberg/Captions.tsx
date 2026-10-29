import React from 'react';
import {WORDS} from './timing';
import {C, FONT_DISPLAY} from './art';
import {pop} from './anim';

// Brand caption style: 2-3 words, all caps, Montserrat Black 104 px, centred at y = 1480.
// White + thick ink outline + hard shadow; the spoken word turns Lab Yellow and grows;
// keywords stay Spark Green once said. No punctuation except "?", numbers as digits.

type Tok = {text: string; s: number; e: number; brk: boolean};

const NUM: Record<string, string> = {
  ninety: '90',
  fifteen: '15',
  twenty: '20',
  two: '2',
  three: '3',
};

const buildTokens = (): Tok[] => {
  const toks: Tok[] = [];
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    const raw = w.w;
    const brk = /[.,?]$/.test(raw);
    let text = raw.replace(/[.,!:;"]/g, '');
    const low = text.toLowerCase();
    const nextLow = WORDS[i + 1]?.w.toLowerCase().replace(/[^a-z]/g, '');
    if ((low === 'two' || low === 'three') && nextLow === 'hundred') {
      const n = WORDS[i + 1];
      toks.push({text: low === 'two' ? '200' : '300', s: w.s, e: n.e, brk: /[.,?]$/.test(n.w)});
      i++;
      continue;
    }
    if (NUM[low]) text = NUM[low];
    text = /^\d{4}s$/.test(text) ? text : text.toUpperCase();
    toks.push({text, s: w.s, e: w.e, brk});
  }
  return toks;
};

const KEY = new Set([
  'WATER', 'ICEBERGS', 'ICEBERG', 'TOW', 'NORTH?', '1970s', 'ARABIA', 'SHIPS', 'UNDERWATER', '90', 'PERCENT', '200', 'METERS', 'DEEP',
  'HARBOR', 'SEA', '2023', 'MONTHS', '2', '300', 'LONG', 'THICK', '15', '20', 'CELSIUS', 'MELT', 'DAYS', '3', 'KILOMETERS', 'MELTWATER',
  'OCEAN', 'FREE', 'TAP', '2018', 'FRESH',
]);

type Group = {toks: Tok[]; s: number; e: number};
const buildGroups = (): Group[] => {
  const toks = buildTokens();
  const groups: Group[] = [];
  let cur: Tok[] = [];
  const flush = () => {
    if (cur.length) groups.push({toks: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  for (const tk of toks) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + tk.text.length;
    if (cur.length >= 3 || (cur.length && len > 13)) flush();
    cur.push(tk);
    if (tk.brk) flush();
  }
  flush();
  return groups;
};

export const GROUPS = buildGroups();

export const Captions: React.FC<{t: number; hide?: boolean}> = ({t, hide}) => {
  if (hide) return null;
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) {
    const g = GROUPS[i];
    const until = i + 1 < GROUPS.length ? Math.min(GROUPS[i + 1].s, g.e + 0.6) : g.e + 0.8;
    if (t >= g.s - 0.02 && t < until) gi = i;
  }
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const est = g.toks.reduce((n, x) => n + x.text.length * 80, 0) + (g.toks.length - 1) * 58 + 80;
  const fit = Math.min(1, 1000 / est);
  const sc = (0.82 + 0.18 * pop(t, g.s - 0.02, 0.3)) * fit;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: 1080,
        top: 1480,
        height: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{display: 'flex', gap: 58, transform: `translateY(-50%) scale(${sc})`, whiteSpace: 'nowrap'}}>
        {g.toks.map((tk, i) => {
          const active = t >= tk.s && t < (g.toks[i + 1]?.s ?? g.e + 0.6);
          const said = t >= tk.s;
          const color = active ? C.yellow : said && KEY.has(tk.text) ? C.green : '#FFFFFF';
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 900,
                fontSize: 104,
                lineHeight: 1.1,
                color,
                WebkitTextStroke: `20px ${C.ink}`,
                paintOrder: 'stroke fill',
                textShadow: '0 8px 0 rgba(0,0,0,0.45)',
                display: 'inline-block',
                transform: active ? 'scale(1.12) rotate(-2deg)' : 'none',
              }}
            >
              {tk.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
