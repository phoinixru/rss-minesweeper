import { elt, assign, values } from './utils.js';
import { Cell, CellClasses } from './cell.js';
import Counter from './cntr.js';

const CssClasses = {
  COMPONENT: 'minesweeper',
  GAME_OVER: 'minesweeper--over',
  GAME_LOST: 'minesweeper--lost',
  GAME_WON: 'minesweeper--won',
  CONTROLS: 'controls',
  FIELD: 'field',
  FIELD_POINTED: 'field--pointed',
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

const is = (e) => e;
const isNot = (e) => !e;

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

    this.counters = {
      moves: new Counter({ modifierClass: 'moves' }),
      time: new Counter({ modifierClass: 'time' }),
      flags: new Counter({ modifierClass: 'flags' }),
    };

    parentContainer.append(this.container);

    this.prepareField();
    this.addEventListeners();
  }

  addEventListeners() {
    // const prevent = (event) => event.preventDefault();
    const clickHandler = (event) => this.handleClicks(event);
    const pointerHandler = (event) => this.handlePointer(event);

    this.container.addEventListener('click', clickHandler);
    this.container.addEventListener('contextmenu', clickHandler);

    document.addEventListener('pointerdown', pointerHandler);
    document.addEventListener('pointerup', pointerHandler);
  }

  handlePointer(event) {
    const { type, button } = event;
    const isPointerDown = type === 'pointerdown' && button === BUTTON.PRIMARY;

    this.container.classList.toggle(CssClasses.FIELD_POINTED, isPointerDown);
  }

  handleClicks(event) {
    event.preventDefault();

    const { target, button } = event;

    if (!target.matches(`.${CellClasses.CELL}`)) {
      return;
    }
    const { id } = target.dataset;

    this.clickCell({ id, button });
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

    // const timeCounter = this.counters.time.render();
    const movesCounter = this.counters.moves.render();
    const flagsCounter = this.counters.flags.render();
    const btnReset = elt('button', { className: CssClasses.BUTTON }, 'Reset');
    btnReset.addEventListener('click', () => this.reset());

    this.controlsContainer.append(
      movesCounter,
      // timeCounter,
      btnReset,
      flagsCounter,
    );

    this.container.append(
      this.controlsContainer,
      this.fieldContainer,
    );
  }

  renderField() {
    const { cells, config: { cols }, fieldContainer } = this;
    const renderCell = (cell) => cell.render();

    fieldContainer.innerHTML = '';
    fieldContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    fieldContainer.append(
      ...cells.map(renderCell),
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

  openCell(cellId) {
    const cell = this.cells[cellId];
    const {
      isOpen, isFlagged, isEmpty, id,
    } = cell;

    if (isFlagged) {
      return;
    }

    const {
      handleEmptyCells,
      handleOpenCells,
    } = this.config;

    let cellsToOpen = [id];
    let emptyCells = new Set();
    const isNotOpenCell = this.filter('isOpen', isNot);

    if (handleOpenCells && isOpen && !isEmpty) {
      const isNotFlaggedCell = this.filter('isFlagged', isNot);
      const isEmptyCell = this.filter('isEmpty');

      const { minesAround, adjacent } = cell;
      const adjacentFlagged = adjacent.filter(this.filter('isFlagged')).length;

      if (minesAround !== adjacentFlagged) {
        return;
      }

      const notFlagged = adjacent.filter(isNotFlaggedCell);
      const notOpen = notFlagged.filter(isNotOpenCell);
      const adjacentEmpty = notOpen.filter(isEmptyCell);

      cellsToOpen.push(...notOpen);
      emptyCells = new Set(adjacentEmpty);
    }

    if (handleEmptyCells) {
      if (cell.isEmpty) {
        emptyCells.add(id);
      }

      const selectedCells = this.selectCellsToOpen([...emptyCells]);
      cellsToOpen.push(...selectedCells);
    }

    cellsToOpen = cellsToOpen.filter(isNotOpenCell);
    cellsToOpen.forEach((openId) => {
      this.cells[openId].open();
    });

    if (cellsToOpen.length) {
      this.counters.moves.value += 1;
    }
  }

  selectCellsToOpen(ids) {
    const toCheck = [...ids];
    let toOpen = [...ids];
    let i = 0;
    let checkId = toCheck[i];

    const isNotYetChecked = (cellId) => !toCheck.includes(cellId);
    const isEmpty = this.filter('isEmpty');
    const isNotOpen = this.filter('isOpen', isNot);

    while (checkId !== undefined) {
      const { adjacent } = this.cells[checkId];
      const notOpen = adjacent.filter(isNotOpen);
      const notChecked = notOpen.filter(isEmpty).filter(isNotYetChecked);

      toOpen.push(...notOpen);
      toCheck.push(...notChecked);

      checkId = toCheck[i += 1];
    }

    toOpen = [...new Set(toOpen)];

    return toOpen;
  }

  filter(flag, func = is) {
    return (id) => func(this.cells[id][flag]);
  }

  flagCell(id) {
    this.cells[id].flag();
    this.updateFlagsCounter();
  }

  updateFlagsCounter() {
    const { mines } = this.config;
    const flaggedCells = this.cells.filter(({ isFlagged }) => isFlagged).length;
    const flagsLeft = mines - flaggedCells;

    this.counters.flags.update(flagsLeft);
  }

  start(clickedCellId) {
    this.plantMines(clickedCellId);
    this.started = true;

    this.counters.time.update(Date.now());
    this.counters.flags.update(this.mines.length);
  }

  reset() {
    assign(this, {
      started: false,
      isOver: false,
      isWon: false,
      isLost: false,
    });

    this.resetCounters();
    this.setGameState();
    this.prepareField();
    this.renderField();
  }

  resetCounters() {
    values(this.counters)
      .forEach((counter) => counter.reset());
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
