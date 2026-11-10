import React from 'react';
import {WORDS} from './timing';
import {C, FONT_DISPLAY} from '../iceberg/art';
import {pop} from '../iceberg/anim';

// Brand caption style: 2-3 words, all caps, Montserrat Black 104 px, centred at y = 1480.
// White + thick ink outline + hard shadow; the spoken word turns Lab Yellow and grows;
// keywords stay Spark Green once said. No punctuation except "?", numbers as digits.

type Tok = {text: string; s: number; e: number; brk: boolean};

// Spoken number phrases shown as digits (longest first).
const PHRASES: Array<[string, string]> = [
  ['three hundred million', '300 MILLION'],
  ['thirty thousand', '30,000'],
  ['fifty thousand', '50,000'],
  ['fourteen hundred', '1,400'],
  ['five billion', '5 BILLION'],
  ['twenty-three', '23'],
  ['kilowatt-hours', 'KWH'],
  ['three', '3'],
  ['two', '2'],
];

const buildTokens = (): Tok[] => {
  const toks: Tok[] = [];
  const clean = (x: string) => x.toLowerCase().replace(/[^a-z-]/g, '');
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    let hit: [string, string] | undefined;
    for (const p of PHRASES) {
      const parts = p[0].split(' ');
      if (parts.every((x, k) => WORDS[i + k] && clean(WORDS[i + k].w) === x)) {
        hit = p;
        break;
      }
    }
    if (hit) {
      const n = hit[0].split(' ').length;
      const last = WORDS[i + n - 1];
      toks.push({text: hit[1], s: w.s, e: last.e, brk: /[.,?]$/.test(last.w)});
      i += n - 1;
      continue;
    }
    const brk = /[.,?]$/.test(w.w);
    const text = w.w.replace(/[.,!:;"]/g, '').toUpperCase();
    toks.push({text, s: w.s, e: w.e, brk});
  }
  return toks;
};

const KEY = new Set(['LIGHTNING', 'BOLT', '300 MILLION', 'VOLTS', '30,000', 'AMPS', 'POWER', 'TIME', 'SECOND', 'BATTERIES', 'ENERGY', '50,000', 'THUNDER', 'LIGHT', '5 BILLION', '1,400', 'KWH', '23', '3', 'HOMES', 'SPARK']);

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
