import { elt } from './utils.js';
import Storage from './storage.js';

const CssClasses = {
  COMPONENT: 'results',
  HEADER: 'results__header',
  BODY: 'results__body',
  EMPTY: 'results__empty',
};

export default class Results {
  constructor(container) {
    this.container = container;
    this.storage = new Storage();
  }

  save(game) {
    const results = this.storage.get('results') || [];

    const { config, counters, isWon } = game;
    const ts = Date.now();
    const time = +counters.time;
    const moves = +counters.moves;
    const { rows, cols, mines } = config;

    const result = {
      ts, isWon, time, moves, rows, cols, mines,
    };

    results.unshift(result);
    this.storage.set('results', results);
  }

  render() {
    this.container.innerHTML = 'results';
    const element = elt('table', { className: CssClasses.COMPONENT });
    this.container.append(element);
  }
}
