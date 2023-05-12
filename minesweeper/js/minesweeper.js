import { elt, assign } from './utils.js';
import Cell from './cell.js';

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
const DEFAULT_BOMBS = 15;

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

    const { target } = event;

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
      excluded = y * rows + x * 1;
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
      const cell = new Cell({
        y, x, rows, cols,
      });

      if (bombs.length) {
        cell.plantBomb(bombs.includes(i));
        cell.setBombsAround(bombs);
      }

      this.field[y][x] = cell;
    }

    this.cells = this.field.flat();
  }

  render() {
    this.renderUI();
    this.renderField();
  }

  renderUI() {
    this.fieldContainer = elt('div', { className: CssClasses.FIELD });
    this.controlsContainer = elt('div', { className: CssClasses.CONTROLS });

    const btnReset = elt('button', {}, 'Reset');
    btnReset.addEventListener('click', () => this.reset());
    this.controlsContainer.append(btnReset);

    this.container.append(
      this.controlsContainer,
      this.fieldContainer,
    );
  }

  renderField() {
    const { field } = this;

    const renderCell = (cell) => {
      const {
        isFlagged = false,
        isOpen = false,
        bombsAround = 0,
        hasBomb = false,
        x, y,
      } = cell;

      const elCell = elt('span', { className: CssClasses.CELL });
      assign(elCell.dataset, { y, x });

      if (isOpen) {
        elCell.classList.add(CssClasses.CELL_OPEN);

        if (bombsAround) {
          elCell.dataset.bombs = bombsAround;
        }
      }

      elCell.classList.toggle(CssClasses.CELL_BOMB, hasBomb);
      elCell.classList.toggle(CssClasses.CELL_FLAGGED, isFlagged);

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
    if (!button && !this.started) {
      this.start({ x, y });
    }

    const cell = this.field[y][x];

    if (button === 0 && !cell.isOpen) {
      cell.open();
    }

    if (button === 2) {
      cell.flag();
    }

    this.renderField();
  }

  start(firstCell) {
    const bombs = this.plantBombs({ exclude: firstCell });
    this.prepareField(bombs);
    this.started = true;
  }

  reset() {
    this.started = false;
    this.prepareField();
    this.renderField();
  }
}
