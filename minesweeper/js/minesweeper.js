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
  BUTTON: 'button',
};

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES = 15;

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
    this.mines = null;
    this.isOver = false;

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

  plantMines({ exclude = null } = {}) {
    const {
      rows = DEFAULT_ROWS,
      cols = DEFAULT_COLS,
      mines = DEFAULT_MINES,
    } = this.config;
    let excluded = -1;

    if (exclude) {
      const { x, y } = exclude;
      excluded = y * cols + x * 1;
    }

    const cellsCount = rows * cols;
    const allCells = Array(cellsCount)
      .fill(0)
      .map((e, i) => e + i);

    const cellsToPlant = allCells
      .filter((e) => e !== excluded)
      .sort(shuffle)
      .slice(0, mines);

    allCells.forEach((id) => {
      const cell = this.cells[id];

      if (cellsToPlant.includes(id)) {
        cell.plantMine();
      } else {
        cell.setMinesAround(cellsToPlant);
      }
    });

    this.mines = cellsToPlant;
  }

  prepareField() {
    const {
      rows = DEFAULT_ROWS,
      cols = DEFAULT_COLS,
    } = this.config;

    this.field = Array(rows).fill(0).map(() => Array(cols));

    for (let i = 0; i < rows * cols; i += 1) {
      const y = Math.floor(i / cols);
      const x = i % cols;
      const cell = new Cell({
        y, x, rows, cols, game: this,
      });

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
    const { field } = this;

    const renderCell = (cell) => cell.render();
    const renderRow = (row) => elt(
      'div',
      { className: CssClasses.FIELD_ROW },
      ...row.map(renderCell),
    );

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
  }

  openCells({ x, y }) {
    const cell = this.field[y][x];
    const {
      id, isOpen, adjacent, minesAround,
    } = cell;

    const {
      handleEmptyCells,
      handleNumberedCells,
    } = this.config;

    const cellsToOpen = new Set([id]);
    const addToOpen = ({ id, adjacent }) => {
      cellsToOpen.add(id);
      adjacent.forEach((adjacentId) => {
        const adjacentCell = this.cells[adjacentId];
        if (adjacentCell.isEmpty() && !cellsToOpen.has(adjacentId)) {
          addToOpen(adjacentCell);
        }
        cellsToOpen.add(adjacentId);
      });
    };

    if (handleEmptyCells && cell.isEmpty()) {
      addToOpen(cell);
    }

    if (handleNumberedCells && isOpen) {
      let flagged = 0;
      const toAdd = [];

      adjacent.forEach((cellId) => {
        const { isFlagged, isOpen } = this.cells[cellId];
        flagged += isFlagged ? 1 : 0;
        if (!isOpen) {
          toAdd.push(cellId);
        }
      });

      if (minesAround && flagged === minesAround) {
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
    this.plantMines({ exclude: firstCell });
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
    const { cells, mines } = this;
    const emptyCells = cells.length - mines.length;

    const isLost = !!cells.find(({ isOpen, isMined }) => isOpen && isMined);
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
    this.revealMines();
  }

  revealMines() {
    this.cells
      .filter((cell) => cell.isMined)
      .forEach((cell) => cell.render());
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
