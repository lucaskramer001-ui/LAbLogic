import React from 'react';
import {pop} from '../iceberg/anim';
import {HC, SERIF} from './kit';

// Hollow Hour captions: 2-3 words, Cinzel Black 92 px, bone with a thick ink outline and hard shadow, centred at
// y = 1500. The spoken word turns ember and grows slightly; keywords stay blood-red once said. Numbers as digits.

export type Word = {w: string; s: number; e: number};
type Tok = {text: string; s: number; e: number; brk: boolean};
export type Group = {toks: Tok[]; s: number; e: number};

const norm = (w: string) => w.toLowerCase().replace(/[^a-z'-]/g, '');

// merges: spoken word sequences -> one caption token, e.g. ['fifteen eighteen', '1518']
export const buildGroups = (words: Word[], merges: Array<[string, string]>, maxWords = 3, maxChars = 13): Group[] => {
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
    const until = i + 1 < groups.length ? Math.min(groups[i + 1].s, g.e + 0.6) : g.e + 0.8;
    if (t >= g.s - 0.02 && t < until) gi = i;
  }
  if (gi < 0) return null;
  const g = groups[gi];
  const est = g.toks.reduce((n, x) => n + x.text.length * 78, 0) + (g.toks.length - 1) * 40 + 80;
  const fit = Math.min(1, 980 / est);
  const sc = (0.86 + 0.14 * pop(t, g.s - 0.02, 0.35)) * fit;
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: y, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', gap: 40, transform: `translateY(-50%) scale(${sc})`, whiteSpace: 'nowrap'}} data-caption="1">
        {g.toks.map((tk, i) => {
          const active = t >= tk.s && t < (g.toks[i + 1]?.s ?? g.e + 0.6);
          const said = t >= tk.s;
          const color = active ? HC.ember : said && keys.has(tk.text) ? HC.bloodHi : HC.bone;
          return (
            <span
              key={i}
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 92,
                lineHeight: 1.1,
                letterSpacing: 2,
                color,
                WebkitTextStroke: `18px ${HC.ink}`,
                paintOrder: 'stroke fill',
                textShadow: `0 7px 0 rgba(0,0,0,0.6), 0 0 30px ${active ? 'rgba(242,169,59,0.45)' : 'rgba(0,0,0,0)'}`,
                display: 'inline-block',
                transform: active ? 'scale(1.1)' : 'none',
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
