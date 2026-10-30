// Sound-effect cue list: file (public/<f>.wav), start time (s), level (dB),
// optional dB keys relative to the cue start [[t, dB], ...] for fades.
import {ph} from './timing';
import {S} from './scenes';

export type Cue = {f: string; at: number; db: number; keys?: Array<[number, number]>};

const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;

const POPS = [
  ph('two billion'), ph("world bank's"), ph('three point four'), ph('rivers'), ph('kilometers'), ph('obvious fix'), ph('hardest'),
  ph('thirty kilometers'), ph('sixty-seven'), ph('already flying'), ph('fall into the sun'), ph('it is falling'), ph('orbit is'),
  ph("keeps the train's"), ph('alongside'), ph('cancel'), ph('not speed up'), ph('slow down'), ph('by a lot'),
  ph('parker solar probe'), ph('2018'), ph("didn't even need"), ph('fifty-three thousand'), ph('borrowed help'),
  ph('christmas eve') + 0.3, ph('three point eight'), ph('four hundred and thirty'), ph('twelve extra'),
  ph('low earth orbit'), ph('a few hundred'), ph('falcon heavy'), ph('sixty-four tonnes'), ph('for one year'),
  ph('eighty-six thousand'), ph('only to orbit'), ph('small part'), ph('far more reliable'), ph('still fail'),
  ph('in the 1970s'), ph('nuclear waste'), ph('safety'), ph('cost'), ph('managed properly'), ph('collecting it'),
  ph('recycling it'), ph('burying it'), ph('harder to hit'),
];
const STAMPS = [ph('heat'), ph('no spacecraft'), ph('1973 study'), ph('nuclear waste never')];
const CUTS = Object.entries(S).filter(([k]) => k !== 'intro').map(([, v]) => v);

const trainStart = S.train;
const throwT = ph('aim at') + 0.1;

export const SFX: Cue[] = [
  ...CUTS.map((t) => ({f: I('whoosh'), at: t - 0.05, db: -26})),
  ...POPS.map((t) => ({f: I('pop'), at: t - 0.03, db: -22})),
  ...STAMPS.map((t) => ({f: I('stamp'), at: t, db: -11})),
  {f: U('fire'), at: ph('burned') - 0.1, db: -24, keys: [[0, -36], [0.4, -24], [4.5, -26], [6, -50]]},
  ...[0, 1, 2].map((i) => ({f: U('rocket'), at: ph('load the trash') + 0.25 + i * 0.75, db: -19})),
  {f: U('fail'), at: ph('hardest') - 0.2, db: -19},
  ...[0, 1, 2, 3, 4].map((i) => ({f: U('train'), at: trainStart + i * 1.95, db: -24})),
  {f: U('printer'), at: ph('two billion tonnes', S.math) - 0.1, db: -21, keys: [[0, -30], [0.3, -21], [3.4, -21], [4, -50]]},
  ...[0, 1, 2].map((i) => ({f: U('rocket'), at: ph('eighty-six thousand') + i * 0.6, db: -24})),
  {f: U('rocket'), at: ph('a rocket full of trash') - 0.6, db: -16},
  {f: U('boom'), at: ph('breaks apart'), db: -9},
  {f: U('fire'), at: ph('burned in the open') - 0.1, db: -27, keys: [[0, -40], [0.4, -27], [4, -30], [6, -50]]},
  {f: I('whoosh'), at: throwT, db: -22},
  {f: I('bonk'), at: throwT + 3.0, db: -14},
  {f: U('fail'), at: throwT + 3.2, db: -18},
  {f: I('pop'), at: S.endcard + 0.05, db: -18},
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
