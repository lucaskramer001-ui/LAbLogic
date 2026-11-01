// Sound-effect cue list: file (public/<f>.wav), start time (s), level (dB),
// optional dB keys relative to the cue start [[t, dB], ...] for fades.
import {ph} from './timing';
import {S} from './scenes';

export type Cue = {f: string; at: number; db: number; keys?: Array<[number, number]>};

const I = (n: string) => `iceberg/sfx/${n}`;
const U = (n: string) => `sun/sfx/${n}`;

const POPS = [
  ph('cape town'), ph('four million'), ph('four thousand'), ph('antarctica'), ph('fresh water'), ph('pressed into ice'),
  ph('obvious fix'), ph('fifty years'), ph('saudi prince'), ph('arabian peninsula'), ph('international conference'), ph('alaska'),
  ph('iowa state'), ph('hundred million tonnes'), ph('to arabia'), ph('within three years'), ph('ninety percent'),
  ph('below the waterline'), ph('the bit you see'), ph('only the tip'), ph('woods hole'), ph('computer simulations'),
  ph('big enough'), ph('meters long'), ph('thick'), ph('fifty-story'), ph('under the surface'), ph('harbor'),
  ph('parked far out'), ph('newfoundland'), ph('not to drink'), ph('offshore oil'), ph('smooth and slippery'),
  ph('most of the weight'), ph('roll over'), ph('for weeks'), ph('half a meter'), ph('slower than'), ph('two months'),
  ph('is melting'), ph('close to freezing'), ph('fifteen to twenty'), ph('sixty to sixty-eight'), ph('from below'),
  ph('waves wear'), ph('smaller icebergs'), ph('trip ends'), ph('parked off'), ph('in weeks'), ph('a full year'),
  ph('three kilometers'), ph('start much bigger'), ph('of fabric'), ph('could help'), ph('hardest problem'),
  ph('it mixes into'), ph('back to salty'), ph('carve off blocks'), ph('pump the meltwater'), ph('nick sloane'),
  ph('salvage expert'), ph('a fifth'), ph('for a year', ph('a fifth')), ph('he estimated'), ph('hundred million dollars'),
  ph('tens of millions'), ph('groundwater'), ph('desalination'), ph('less risky'), ph('people saved'), ph('short showers'),
  ph('no watering'), ph('a limit of'), ph('in half'), ph('most of it hides'), ph('slippery', S.recap),
  ph('melts the whole way'), ph('nobody knows how'), ph('is free'), ph('getting it'),
];
const STAMPS = [ph('day zero'), ph('nothing to do'), ph('it never happened'), ph('nobody has tested'), ph('proven way'), ph('said no'), ph('never arrived')];
const CUTS = Object.entries(S).filter(([k]) => k !== 'intro').map(([, v]) => v);
const calving = ph('icebergs', S.antarctica) + 0.1;

export const SFX: Cue[] = [
  ...CUTS.map((t) => ({f: I('whoosh'), at: t - 0.05, db: -26})),
  ...POPS.map((t) => ({f: I('pop'), at: t - 0.03, db: -22})),
  ...STAMPS.map((t) => ({f: I('stamp'), at: t, db: -11})),
  // ambience under the sea scenes
  {f: I('ocean'), at: S.antarctica, db: -30, keys: [[0, -50], [1, -30], [24, -30], [26, -50]]},
  {f: I('ocean'), at: S.under, db: -32, keys: [[0, -50], [1, -32], [68, -32], [70, -50]]},
  {f: I('ocean'), at: S.melt, db: -32, keys: [[0, -50], [1, -32], [56, -32], [58, -50]]},
  {f: I('drip'), at: ph('taps') + 0.1, db: -16},
  {f: I('crack'), at: ph('breaking off'), db: -14},
  {f: I('splash'), at: calving + 0.45, db: -12},
  {f: I('horn'), at: ph('tow it') - 0.2, db: -16},
  {f: I('pages'), at: ph('within three years'), db: -18},
  {f: I('bonk'), at: ph('hit the sea floor') + 0.15, db: -12},
  {f: I('horn'), at: ph('to push them away') - 0.3, db: -18},
  {f: U('fail'), at: ph('slide right off') + 0.3, db: -18},
  {f: I('splash'), at: ph('roll over') + 0.2, db: -14},
  {f: I('pages'), at: ph('reaching cape town'), db: -18},
  {f: I('pages'), at: ph('reaching cape town') + 1.0, db: -20},
  {f: I('melt'), at: ph('is melting') - 0.2, db: -20},
  {f: I('crack'), at: ph('pieces crack'), db: -15},
  {f: I('melt'), at: ph('could melt'), db: -18},
  {f: I('pages'), at: ph('even days') - 0.3, db: -18},
  {f: I('whoosh'), at: ph('the iceberg would have') - 0.6, db: -18},
  {f: I('drip'), at: ph('when ice melts'), db: -20},
  {f: I('ocean'), at: ph('the rain') - 0.1, db: -24, keys: [[0, -50], [0.5, -24], [5, -26], [6.5, -50]]},
  {f: I('drip'), at: ph('a tap') + 0.15, db: -14},
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
