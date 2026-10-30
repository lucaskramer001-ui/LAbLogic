import rawWords from './words.json';

export const FPS = 60;
export const VO_OFFSET = 0.4;

export type Word = {w: string; s: number; e: number};
export const WORDS: Word[] = (rawWords as Word[]).map((x) => ({w: x.w, s: x.s + VO_OFFSET, e: x.e + VO_OFFSET}));

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

// Start time of the first occurrence of a phrase (consecutive words) starting at or after `after`.
const find = (phrase: string, after: number) => {
  const p = phrase.toLowerCase().split(/\s+/).map(clean);
  for (let i = 0; i + p.length <= WORDS.length; i++) {
    if (WORDS[i].s < after) continue;
    if (p.every((x, k) => clean(WORDS[i + k].w) === x)) return i;
  }
  throw new Error(`phrase not found: "${phrase}" after ${after}`);
};
export const ph = (phrase: string, after = 0) => WORDS[find(phrase, after)].s;
export const phEnd = (phrase: string, after = 0) => {
  const i = find(phrase, after);
  return WORDS[i + phrase.split(/\s+/).length - 1].e;
};

export const VO_END = WORDS[WORDS.length - 1].e;
export const END_CARD = 3.2;
export const END = VO_END + END_CARD + 0.6;
