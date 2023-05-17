import { elt, keys, values } from './utils.js';
import Storage from './storage.js';

const CssClasses = {
  COMPONENT: 'results',
  HEADER: 'results__header',
  BODY: 'results__body',
  EMPTY: 'results__empty',
  CELL: 'td',
};

const FIELDS = {
  date: 'Date',
  status: '',
  field: 'Field',
  mines: 'Mines',
  time: 'Time',
  moves: 'Moves',
};

const RECORDS_TO_KEEP = 10;

const NO_RESULTS = 'Nothing to display. Play some games and return later...';
const timeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});
const formatTime = (ts) => timeFormat.format(new Date(ts)).replace(',', '');

export default class Results {
  constructor({ container }) {
    this.container = container;
    this.storage = new Storage();
    this.results = this.storage.get('results') || [];
  }

  save(game) {
    const { results } = this;

    const { config, counters, isWon } = game;
    const ts = Date.now();
    const time = +counters.time;
    const moves = +counters.moves;
    const { rows, cols, mines } = config;

    const result = {
      ts, isWon, time, moves, rows, cols, mines,
    };

    results.unshift(result);
    this.results = results.slice(0, RECORDS_TO_KEEP);
    this.storage.set('results', this.results);
    this.render();
  }

  render() {
    const { results } = this;
    this.container.innerHTML = '';

    if (!results.length) {
      this.container.append(
        elt('div', { className: CssClasses.EMPTY }, NO_RESULTS),
      );

      return;
    }

    const tr = (cells) => elt('tr', {}, ...cells);
    const th = (node) => elt('th', {}, node);
    const td = (id, node) => elt('td', { className: `${CssClasses.CELL} ${CssClasses.CELL}-${id}` }, node);

    const table = elt('table', { className: CssClasses.COMPONENT });

    const ths = values(FIELDS).map(th);
    const thead = elt('thead', null, tr(ths));

    const fields = keys(FIELDS);
    const row = (result) => {
      const {
        ts, isWon, time, moves, rows, cols, mines,
      } = result;

      const data = {
        date: formatTime(ts),
        status: isWon ? 'won' : 'lost',
        field: `${rows}x${cols}`,
        mines,
        time,
        moves,
      };

      const tds = fields.map((id) => td(id, String(data[id]) || ''));

      return tr(tds);
    };

    const tbody = elt('tbody', null, ...results.map(row));

    table.append(thead, tbody);

    this.container.append(table);
  }
}
