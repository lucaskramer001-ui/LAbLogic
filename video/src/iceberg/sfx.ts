// Sound-effect cue list: file (public/iceberg/sfx/<f>.wav), start time (s), level (dB),
// optional dB keys over time [[t, dB], ...] for fades.
export type Cue = {f: string; at: number; db: number; keys?: Array<[number, number]>};

import {S, END, at} from './timing';

const POPS = [
  at('2018'), at('cape'), at('antarctica'), at('fresh'), at('north'), at('1970s'), at('plan'), at('arabia'), at('ninety'),
  at('iceberg', 0) + 0.15, at('meters', 0), at('harbor'), at('far'), at('2023'), at('woods'), at('two', 1), at('least'),
  at('long', 0), at('thick'), at('fifteen'), at('weeks'), at('year'), at('kilometers'), at('proven'), at('meltwater'),
  at('free'), at('getting'),
];
const CUTS = [S.capeTown, S.antarctica, S.tow, S.history, S.ships, S.hidden, S.harbor, S.journey, S.months, S.size, S.arriving, S.huge, S.capture, S.tap];

export const SFX: Cue[] = [
  {f: 'ocean', at: 0, db: -31, keys: [[0, -40], [1, -31], [END - 1.2, -31], [END, -60]]},
  ...CUTS.map((t) => ({f: 'whoosh', at: t - 0.05, db: -27})),
  ...POPS.map((t) => ({f: 'pop', at: t - 0.03, db: -21})),
  {f: 'drip', at: at('water') + 0.62, db: -17},
  {f: 'crack', at: at('keeps'), db: -15},
  {f: 'splash', at: at('shedding') + 0.55, db: -11},
  {f: 'horn', at: at('tow') - 0.05, db: -19},
  {f: 'stamp', at: at('never') + 0.05, db: -9},
  {f: 'horn', at: at('ships') - 0.1, db: -21},
  {f: 'bonk', at: at('harbor') + 0.08, db: -10},
  {f: 'pages', at: S.months + 0.05, db: -19},
  {f: 'pages', at: S.months + 1.0, db: -21},
  {f: 'crack', at: at('apart'), db: -16},
  {f: 'melt', at: at('melt') - 0.1, db: -19, keys: [[0, -30], [0.4, -19], [4.2, -19], [5, -40]]},
  {f: 'melt', at: S.capture + 0.2, db: -22, keys: [[0, -32], [0.4, -22], [4, -24], [4.9, -40]]},
  {f: 'drip', at: at('tap', 0) + 0.7, db: -14},
];

export const dbAt = (c: Cue, tAbs: number) => {
  if (!c.keys || !c.keys.length) return c.db;
  const k = c.keys;
  const t = tAbs - c.at;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u;
    }
  }
  return k[k.length - 1][1];
};
