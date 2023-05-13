import { elt, assign } from './utils.js';
import { Cell, CellClasses } from './cell.js';

const CssClasses = {
  COMPONENT: 'minesweeper',
  GAME_OVER: 'minesweeper--over',
  GAME_LOST: 'minesweeper--lost',
  GAME_WON: 'minesweeper--won',
  CONTROLS: 'controls',
  FIELD: 'field',
  FIELD_ROW: 'field__row',
  BUTTON: 'button',
};

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES = 15;

const HANDLE_EMPTY_CELLS = true;
const HANDLE_OPEN_CELLS = true;

const shuffle = () => Math.random() - 0.5;

const BUTTON = {
  PRIMARY: 0,
  SECONDARY: 2,
  TOUCH: -1,
};

export default class Minesweeper {
  constructor({ parentContainer }) {
    this.parentContainer = parentContainer;
    this.container = elt('div', { className: CssClasses.COMPONENT });
    this.config = {
      handleEmptyCells: HANDLE_EMPTY_CELLS,
      handleOpenCells: HANDLE_OPEN_CELLS,
      rows: DEFAULT_ROWS,
      cols: DEFAULT_COLS,
      mines: DEFAULT_MINES,
    };
    this.mines = null;
    this.isOver = false;

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

    if (target.matches(`.${CellClasses.CELL}`)) {
      const { id } = target.dataset;
      const { button } = event;

      this.clickCell({ id, button });
    }
  }

  plantMines(clickedCellId) {
    const { rows, cols, mines } = this.config;
    const excluded = +clickedCellId;

    const totalCells = rows * cols;
    const allCells = Array(totalCells)
      .fill(0)
      .map((e, i) => e + i);

    const cellsToPlant = allCells
      .filter((id) => id !== excluded)
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
    const { rows, cols } = this.config;
    const totalCells = rows * cols;

    this.cells = Array(totalCells)
      .fill(0)
      .map((e, i) => {
        const y = Math.floor(i / cols);
        const x = i % cols;
        return new Cell({
          y, x, id: i, rows, cols, game: this,
        });
      });
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
    const { cells, config } = this;
    const { cols, rows } = config;

    const fieldRows = Array(rows)
      .fill(cols)
      .map((num, i) => cells.slice(i * num, (i + 1) * num));

    const renderCell = (cell) => cell.render();
    const renderRow = (row) => elt(
      'div',
      { className: CssClasses.FIELD_ROW },
      ...row.map(renderCell),
    );

    this.fieldContainer.innerHTML = '';
    this.fieldContainer.append(
      ...fieldRows.map(renderRow),
    );
  }

  clickCell({ button, id }) {
    const { isOver } = this;
    if (isOver) {
      return;
    }

    if (!this.started) {
      if (button !== BUTTON.PRIMARY) {
        return;
      }

      this.start(id);
    }

    if (button === BUTTON.PRIMARY) {
      this.openCell(id);
    }

    if ([BUTTON.SECONDARY, BUTTON.TOUCH].includes(button)) {
      this.flagCell(id);
    }

    this.checkGameOver();
  }

  openCell(id) {
    const cell = this.cells[id];
    const {
      isOpen, adjacent, minesAround,
    } = cell;

    const {
      handleEmptyCells,
      handleOpenCells,
    } = this.config;

    const cellsToOpen = new Set([id]);
    const addToOpen = ({ id, adjacent }) => {
      cellsToOpen.add(id);
      adjacent.forEach((adjacentId) => {
        const adjacentCell = this.cells[adjacentId];
        if (adjacentCell.isEmpty && !cellsToOpen.has(adjacentId)) {
          addToOpen(adjacentCell);
        }
        cellsToOpen.add(adjacentId);
      });
    };

    if (handleEmptyCells && cell.isEmpty) {
      addToOpen(cell);
    }

    if (handleOpenCells && isOpen) {
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

  flagCell(id) {
    this.cells[id].flag();
  }

  start(clickedCellId) {
    this.plantMines(clickedCellId);
    this.started = true;
  }

  reset() {
    assign(this, {
      started: false,
      isOver: false,
      isWon: false,
      isLost: false,
    });

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
