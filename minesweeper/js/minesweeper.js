import { elt, assign } from './utils.js';

const CssClasses = {
  COMPONENT: 'minesweeper',
  CONTROLS: 'controls',
  FIELD: 'field',
  FIELD_ROW: 'field__row',
  CELL: 'cell',
  CELL_BOMB: 'cell--bomb',
  CELL_FLAGGED: 'cell--flagged',
  CELL_OPEN: 'cell--open',
};

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_BOMBS = 10;

const shuffle = () => Math.random() - 0.5;

export default class Minesweeper {
  constructor({ parentContainer }) {
    this.parentContainer = parentContainer;
    this.container = elt('div', { className: CssClasses.COMPONENT });
    this.config = {};
    this.bombs = null;

    parentContainer.append(this.container);

    this.prepareField();
    this.addEventListeners();
  }

  addEventListeners() {
    // const prevent = (event) => event.preventDefault();
    const clickHandler = (event) => this.handleClicks(event);

    this.container.addEventListener('click', clickHandler);
    this.container.addEventListener('contextmenu', clickHandler);
  }

  handleClicks(event) {
    event.preventDefault();

    const {
      target,
    } = event;

    if (target.matches(`.${CssClasses.CELL}`)) {
      const { x, y } = target.dataset;
      const { button } = event;

      this.clickCell({ x, y, button });
    }
  }

  plantBombs({ exclude = null } = {}) {
    const {
      rows = DEFAULT_ROWS,
      cols = DEFAULT_COLS,
      bombs = DEFAULT_BOMBS,
    } = this.config;
    let excluded = -1;

    if (exclude) {
      const { x, y } = exclude;
      excluded = y * rows + x;
    }

    const cells = rows * cols;
    const planted = Array(cells)
      .fill(0)
      .map((e, i) => e + i)
      .filter((e) => e !== excluded)
      .sort(shuffle)
      .slice(0, bombs);

    this.bombs = planted;

    return planted;
  }

  prepareField(bombs = []) {
    const {
      rows = DEFAULT_ROWS,
      cols = DEFAULT_COLS,
    } = this.config;

    this.field = Array(rows).fill(0).map(() => Array(cols));

    for (let i = 0; i < rows * cols; i += 1) {
      const y = Math.floor(i / cols);
      const x = i % rows;

      this.field[y][x] = { y, x };

      if (bombs.length) {
        this.field[y][x].hasBomb = bombs.includes(i);
      }
    }
  }

  render() {
    this.renderUI();
    this.renderField();
  }

  renderUI() {
    this.fieldContainer = elt('div', { className: CssClasses.FIELD });

    this.container.append(
      this.fieldContainer,
    );
  }

  renderField() {
    const { field } = this;

    const renderCell = (cell) => {
      const {
        flagged = false,
        open = false,
        bombsAround = 0,
        hasBomb = false,
        x, y,
      } = cell;

      const elCell = elt('span', { className: CssClasses.CELL });
      assign(elCell.dataset, { y, x });

      if (!open) {
        elCell.classList.add(CssClasses.CELL_OPEN);
      }

      elCell.classList.toggle(CssClasses.CELL_BOMB, hasBomb);
      elCell.classList.toggle(CssClasses.CELL_FLAGGED, flagged);

      elCell.innerHTML = bombsAround || '';

      return elCell;
    };

    const renderRow = (row) => {
      const elRow = elt('div', { className: CssClasses.FIELD_ROW });
      elRow.append(...row.map(renderCell));

      return elRow;
    };

    this.fieldContainer.innerHTML = '';
    this.fieldContainer.append(
      ...field.map(renderRow),
    );
  }

  clickCell({ x, y, button }) {
    console.log(x, y, button);

    if (!this.bombs) {
      const bombs = this.plantBombs({ exclude: { x, y } });
      this.prepareField(bombs);
      this.renderField();
    }
  }
}
