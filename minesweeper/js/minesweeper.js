import { elt, assign } from './utils.js';
import Cell from './cell.js';

const CssClasses = {
  COMPONENT: 'minesweeper',
  GAME_OVER: 'minesweeper--over',
  GAME_LOST: 'minesweeper--lost',
  GAME_WON: 'minesweeper--won',
  CONTROLS: 'controls',
  FIELD: 'field',
  FIELD_ROW: 'field__row',
  CELL: 'cell',
  CELL_BOMB: 'cell--bomb',
  CELL_FLAGGED: 'cell--flagged',
  CELL_OPEN: 'cell--open',
  BUTTON: 'button',
};

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_BOMBS = 15;

const HANDLE_EMPTY_CELLS = true;
const HANDLE_NUMBERED_CELLS = true;

const shuffle = () => Math.random() - 0.5;

export default class Minesweeper {
  constructor({ parentContainer }) {
    this.parentContainer = parentContainer;
    this.container = elt('div', { className: CssClasses.COMPONENT });
    this.config = {
      handleEmptyCells: HANDLE_EMPTY_CELLS,
      handleNumberedCells: HANDLE_NUMBERED_CELLS,
    };
    this.bombs = null;

    parentContainer.append(this.container);

    this.prepareField();
    this.addEventListeners();
  }

  addEventListeners() {
    const prevent = (event) => event.preventDefault();
    const clickHandler = (event) => this.handleClicks(event);

    this.container.addEventListener('mouseup', clickHandler);
    this.container.addEventListener('contextmenu', prevent);
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
      excluded = y * cols + x * 1;
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
      const x = i % cols;
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

    const btnReset = elt('button', { className: CssClasses.BUTTON }, 'Reset');
    btnReset.addEventListener('click', () => this.reset());
    this.controlsContainer.append(btnReset);

    this.container.append(
      this.controlsContainer,
      this.fieldContainer,
    );
  }

  renderField() {
    const { field, isOver } = this;

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

      if (isOver) {
        elCell.classList.toggle(CssClasses.CELL_BOMB, hasBomb);
      }

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

  clickCell({ button, ...clickedCell }) {
    const { isOver } = this;
    if (isOver) {
      return;
    }

    if (!this.started) {
      if (button !== 0) {
        return;
      }

      this.start(clickedCell);
    }

    if (button === 0) {
      this.openCells(clickedCell);
    }

    if (button === 2) {
      this.flagCell(clickedCell);
    }

    this.checkGameOver();
    this.renderField();
  }

  openCells({ x, y }) {
    const cell = this.field[y][x];
    const {
      id, isOpen, neighbors, bombsAround,
    } = cell;

    const {
      handleEmptyCells,
      handleNumberedCells,
    } = this.config;

    const cellsToOpen = new Set([id]);
    const addToOpen = ({ id, neighbors }) => {
      cellsToOpen.add(id);
      neighbors.forEach((neighborId) => {
        const neighborCell = this.cells[neighborId];
        if (neighborCell.isEmpty() && !cellsToOpen.has(neighborId)) {
          addToOpen(neighborCell);
        }
        cellsToOpen.add(neighborId);
      });
    };

    if (handleEmptyCells && cell.isEmpty()) {
      addToOpen(cell);
    }

    if (handleNumberedCells && isOpen) {
      let flagged = 0;
      const toAdd = [];

      neighbors.forEach((cellId) => {
        const { isFlagged, isOpen } = this.cells[cellId];
        flagged += isFlagged ? 1 : 0;
        if (!isOpen) {
          toAdd.push(cellId);
        }
      });

      if (bombsAround && flagged === bombsAround) {
        toAdd.forEach((id) => cellsToOpen.add(id));
      }
    }

    cellsToOpen.forEach((id) => {
      this.cells[id].open();
    });
  }

  flagCell({ x, y }) {
    const cell = this.field[y][x];

    cell.flag();
  }

  start(firstCell) {
    const bombs = this.plantBombs({ exclude: firstCell });
    this.prepareField(bombs);
    this.started = true;
  }

  reset() {
    this.started = false;
    this.isOver = false;
    this.isWon = false;
    this.isLost = false;

    this.setGameState();
    this.prepareField();
    this.renderField();
  }

  checkGameOver() {
    const { cells, bombs } = this;
    const emptyCells = cells.length - bombs.length;

    const isLost = !!cells.find(({ isOpen, hasBomb }) => isOpen && hasBomb);
    const isWon = cells.filter(({ isOpen }) => isOpen).length === emptyCells;
    const isOver = isLost || isWon;

    assign(this, { isLost, isWon, isOver });

    if (isLost) {
      this.gameLost();
    }

    if (isWon) {
      this.gameWon();
    }
  }

  gameLost() {
    this.setGameState();
  }

  gameWon() {
    this.setGameState();
  }

  setGameState() {
    const { classList } = this.container;
    const { isLost, isWon, isOver } = this;

    classList.toggle(CssClasses.GAME_OVER, isOver);
    classList.toggle(CssClasses.GAME_LOST, isLost);
    classList.toggle(CssClasses.GAME_WON, isWon);
  }
}
