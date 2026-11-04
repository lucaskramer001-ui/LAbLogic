import {VO_END, ph} from './timing';

// Scene start times, a beat before each scene's first word.
export const S = {
  intro: 0,
  fix: ph("so here's the obvious") - 0.1,
  ticket: ph("let's start with") - 0.1,
  town: ph('picture a tiny town') - 0.1,
  inflation: ph("that's inflation") - 0.1,
  fair: ph("and printing isn't even fair") - 0.1,
  hyper: ph('now push that idea') - 0.1,
  ruhr: ph('germany 1923') - 0.1,
  bread: ph('at the end of 1922') - 0.1,
  renten: ph('the crisis ended') - 0.1,
  farms: ph('you might think') - 0.1,
  freeze: ph('by 2007') - 0.1,
  doubling: ph('so the printing went on') - 0.1,
  note: ph('in january 2009') - 0.1,
  hungary: ph('and it still') - 0.1,
  pattern: ph('look at these stories') - 0.1,
  job: ph('so should we never') - 0.1,
  target: ph("that's why central banks") - 0.1,
  recap: ph("so why don't we just print") - 0.1,
  final: ph("more money doesn't make") - 0.1,
  endcard: VO_END + 0.5,
};
