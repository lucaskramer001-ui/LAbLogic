import {VO_END, ph} from './timing';

// Scene start times, a beat before each scene's first word.
export const S = {
  intro: 0,
  sun: ph('meanwhile') - 0.1,
  orbit: ph("let's start with") - 0.1,
  train: ph('picture yourself') - 0.1,
  circle: ph('trash launched from earth') - 0.1,
  cancel: ph('to actually hit the sun') - 0.1,
  parker: ph('so how hard is that') - 0.1,
  energy: ph('nasa puts it this way') - 0.1,
  venus: ph('a powerful rocket') - 0.1,
  escape: ph('and that leads to') - 0.1,
  math: ph("now let's add the trash") - 0.1,
  compare: ph('for comparison') - 0.1,
  onlyOrbit: ph('and remember') - 0.1,
  fail: ph("then there's the rockets") - 0.1,
  history: ph("this isn't a new idea") - 0.1,
  recap: ph("so why don't we just fire") - 0.1,
  real: ph('the real trash problem') - 0.1,
  final: ph('the sun looks close') - 0.1,
  endcard: VO_END + 0.5,
};
