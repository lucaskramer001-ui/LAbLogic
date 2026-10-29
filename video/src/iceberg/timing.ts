import rawWords from './words.json';

export const FPS = 60;
export const VO_OFFSET = 0.1;

export type Word = {w: string; s: number; e: number};
export const WORDS: Word[] = (rawWords as Word[]).map((x) => ({w: x.w, s: x.s + VO_OFFSET, e: x.e + VO_OFFSET}));

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

// Start time of the nth (0-based) occurrence of a word in the voice-over.
export const at = (word: string, nth = 0): number => {
  let n = 0;
  for (const x of WORDS) {
    if (clean(x.w) === word) {
      if (n === nth) return x.s;
      n++;
    }
  }
  throw new Error(`word not found: ${word} #${nth}`);
};
export const endOf = (word: string, nth = 0): number => {
  let n = 0;
  for (const x of WORDS) {
    if (clean(x.w) === word) {
      if (n === nth) return x.e;
      n++;
    }
  }
  throw new Error(`word not found: ${word} #${nth}`);
};

export const VO_END = WORDS[WORDS.length - 1].e;
export const END = VO_END + 1.0;

// Scene starts: each scene begins a beat before its first word.
export const S = {
  cover: 0,
  capeTown: at('cape') - 0.06,
  antarctica: at('meanwhile') - 0.04,
  tow: at('so') - 0.04,
  history: at('people') - 0.04,
  ships: at('it') - 0.04,
  hidden: at('the', 2) - 0.04,
  deep: at('for') - 0.04,
  harbor: at('so', 1) - 0.04,
  journey: at('then') - 0.04,
  months: at('reaching') - 0.04,
  size: at('survive') - 0.2,
  arriving: at('arriving') - 0.04,
  melt: at('in', 1) - 0.04,
  huge: at('without') - 0.04,
  capture: at('and', 2) - 0.04,
  tap: at('ice', 1) - 0.2,
  end: END,
};
