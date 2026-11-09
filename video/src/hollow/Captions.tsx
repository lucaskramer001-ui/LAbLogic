import React from 'react';
import {clamp} from '../iceberg/anim';
import {HC, SERIF} from './kit';

// Hollow Hour captions (horror / mystery style): 2-3 words, Cinzel Bold 84 px with wide tracking, bone on a soft
// black halo (no cartoon outline). Each word rises out of a blur as it is spoken; the word being spoken burns
// blood-red with a glow and a faint flicker; keywords stay ember once said. Numbers as digits.

export type Word = {w: string; s: number; e: number};
type Tok = {text: string; s: number; e: number; brk: boolean};
export type Group = {toks: Tok[]; s: number; e: number};

const norm = (w: string) => w.toLowerCase().replace(/[^a-z'-]/g, '');

// merges: spoken word sequences -> one caption token, e.g. ['fifteen eighteen', '1518']
export const buildGroups = (words: Word[], merges: Array<[string, string]>, maxWords = 3, maxChars = 14): Group[] => {
  const toks: Tok[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    let done = false;
    for (const [seq, out] of merges) {
      const p = seq.split(' ');
      if (i + p.length <= words.length && p.every((x, k) => norm(words[i + k].w) === x)) {
        const last = words[i + p.length - 1];
        toks.push({text: out, s: w.s, e: last.e, brk: /[.,?]$/.test(last.w)});
        i += p.length - 1;
        done = true;
        break;
      }
    }
    if (done) continue;
    toks.push({text: w.w.replace(/[.,!:;"]/g, '').toUpperCase(), s: w.s, e: w.e, brk: /[.,?]$/.test(w.w)});
  }
  const groups: Group[] = [];
  let cur: Tok[] = [];
  const flush = () => {
    if (cur.length) groups.push({toks: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  for (const tk of toks) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + tk.text.length;
    if (cur.length >= maxWords || (cur.length && len > maxChars)) flush();
    cur.push(tk);
    if (tk.brk) flush();
  }
  flush();
  return groups;
};

export const HollowCaptions: React.FC<{t: number; groups: Group[]; keys: Set<string>; hide?: boolean; y?: number}> = ({t, groups, keys, hide, y = 1500}) => {
  if (hide) return null;
  let gi = -1;
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const until = i + 1 < groups.length ? Math.min(groups[i + 1].s, g.e + 0.7) : g.e + 0.9;
    if (t >= g.s - 0.06 && t < until) gi = i;
  }
  if (gi < 0) return null;
  const g = groups[gi];
  const next = gi + 1 < groups.length ? groups[gi + 1].s : g.e + 0.9;
  const out = clamp((t - (Math.min(next, g.e + 0.7) - 0.12)) / 0.12); // quick fade before the next group
  const est = g.toks.reduce((n, x) => n + x.text.length * 66, 0) + (g.toks.length - 1) * 34 + 60;
  const fit = Math.min(1, 960 / est);
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: y, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 1 - out}}>
      <div style={{display: 'flex', gap: 34, transform: `translateY(-50%) scale(${fit})`, whiteSpace: 'nowrap'}} data-caption="1">
        {g.toks.map((tk, i) => {
          const r = clamp((t - (tk.s - 0.06)) / 0.22); // reveal of this word
          const e = 1 - Math.pow(1 - r, 3);
          const active = t >= tk.s - 0.02 && t < (g.toks[i + 1]?.s ?? g.e + 0.5);
          const fl = active ? 0.85 + 0.15 * Math.sin(t * 37 + i) * Math.sin(t * 11) : 1;
          const color = active ? '#FF4F3F' : keys.has(tk.text) ? HC.ember : HC.bone;
          const glow = active ? `0 0 18px rgba(228,57,43,${0.75 * fl}), 0 0 42px rgba(179,38,30,0.55)` : '0 0 0 rgba(0,0,0,0)';
          return (
            <span
              key={i}
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 84,
                lineHeight: 1.1,
                letterSpacing: 6,
                color,
                opacity: e * (active ? fl : 1),
                WebkitTextStroke: '2px rgba(5,4,5,0.9)',
                paintOrder: 'stroke fill',
                textShadow: `0 0 10px rgba(0,0,0,1), 0 0 22px rgba(0,0,0,0.95), 0 3px 4px rgba(0,0,0,0.9), ${glow}`,
                filter: e < 0.98 ? `blur(${(1 - e) * 8}px)` : undefined,
                display: 'inline-block',
                transform: `translateY(${(1 - e) * 16}px)`,
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
