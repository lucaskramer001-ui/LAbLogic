import {VO_END, ph} from './timing';

// Scene start times, a beat before each scene's first word.
export const S = {
  intro: 0,
  fix: ph("so here's the obvious") - 0.1,
  promise: ph('it sounds like common') - 0.1,
  orange: ph("let's start with the name") - 0.1,
  warren: ph('the idea came from') - 0.1,
  prototype: ph('he built his first') - 0.1,
  two: ph("and there isn't just one") - 0.1,
  fdr: ph('the flight data recorder') - 0.1,
  cvr: ph('the cockpit voice recorder') - 0.1,
  tail: ph('both sit near') - 0.1,
  inside: ph("now what's inside") - 0.1,
  tests: ph('and that armor is tested') - 0.1,
  fire: ph('it sits in a fire') - 0.1,
  sea: ph('and it has to survive the water') - 0.1,
  af447: ph('that toughness has paid') - 0.1,
  lab: ph('reading a recorder') - 0.1,
  mh370: ph("but black boxes aren't") - 0.1,
  whole: ph("so why don't we just build the whole plane that way") - 0.1,
  heavy: ph('wrap all of it') - 0.1,
  human: ph('and even if it could fly') - 0.1,
  alive: ph('so what does keep') - 0.1,
  witness: ph('rules like these') - 0.1,
  recap: ph("so why don't we just build", ph('rules like these')) - 0.1,
  final: ph("the black box doesn't make") - 0.1,
  endcard: VO_END + 0.5,
};

// Chapter cards (shown with a wipe at the chapter's first scene).
export const CHAPTERS: Array<[keyof typeof S, string]> = [
  ['fix', 'THE OBVIOUS FIX'],
  ['orange', "IT'S NOT BLACK"],
  ['warren', 'WHERE IT CAME FROM'],
  ['two', 'TWO RECORDERS'],
  ['inside', "WHAT'S INSIDE"],
  ['tests', 'THE TORTURE TESTS'],
  ['af447', 'FOUND 3,900 M DOWN'],
  ['whole', 'WHY NOT THE WHOLE PLANE?'],
  ['human', 'WHAT KEEPS YOU ALIVE'],
];
