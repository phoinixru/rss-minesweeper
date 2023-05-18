import {
  elt, assign, values, entries, keys,
} from './utils.js';
import { Cell, CellClasses } from './cell.js';
import Counter from './cntr.js';
import Storage from './storage.js';
import Results from './results.js';
import Panes from './panes.js';
import Config from './config.js';

const CssClasses = {
  COMPONENT: 'minesweeper',
  GAME_OVER: 'minesweeper--over',
  GAME_LOST: 'minesweeper--lost',
  GAME_WON: 'minesweeper--won',
  MENU: 'menu',
  MENU_ITEM: 'menu__item',
  CONTROLS: 'controls',
  FIELD: 'field',
  FIELD_POINTED: 'field--pointed',
  BUTTON: 'button',
};

const TITLE = {
  game: 'Minesweeper',
  results: 'Last results',
  config: 'Preferences',
};

const MENU = {
  config: 'Settings',
  results: 'Results',
};

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
    parentContainer.append(this.container);

    this.mines = null;
    this.isOver = false;

    const panes = new Panes({ container: this.container });
    this.panes = panes;

    this.gameContainer = panes.add({ id: 'game', title: TITLE.game, hidden: false });

    const configContainer = panes.add({ id: 'config', title: TITLE.config });
    this.config = new Config({ container: configContainer });
    this.config.render();

    const resultsContainer = panes.add({ id: 'results', title: TITLE.results });
    this.results = new Results({ container: resultsContainer });
    this.results.render();

    this.counters = {
      moves: new Counter({ modifierClass: 'moves' }),
      time: new Counter({
        modifierClass: 'time',
        auto: { source: Date.now, interval: 1000 },
        format: (value) => Math.floor(value / 1000),
      }),
      flags: new Counter({ modifierClass: 'flags' }),
    };

    this.storage = new Storage();

    this.prepareField();
    this.addEventListeners();
    this.loadState();
  }

  addEventListeners() {
    // const prevent = (event) => event.preventDefault();
    const clickHandler = (event) => this.handleClicks(event);
    const pointerHandler = (event) => this.handlePointer(event);

    this.gameContainer.addEventListener('click', clickHandler);
    this.gameContainer.addEventListener('contextmenu', clickHandler);

    document.addEventListener('pointerdown', pointerHandler);
    document.addEventListener('pointerup', pointerHandler);

    const saveState = (event) => this.saveState(event);
    window.addEventListener('beforeunload', saveState);
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

  generateMines(clickedCellId) {
    const { cells, config } = this;
    const { mines } = config;
    const excluded = +clickedCellId;

    const cellsToPlant = keys(cells)
      .map((idx) => +idx)
      .filter((id) => id !== excluded)
      .sort(shuffle)
      .slice(0, mines);

    this.mines = cellsToPlant;

    return cellsToPlant;
  }

  plantMines() {
    const { mines, cells } = this;

    cells.forEach((cell, id) => {
      if (mines.includes(id)) {
        cell.plantMine();
      } else {
        cell.setMinesAround(mines);
      }
    });
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

    const menuContainer = elt('nav', { className: CssClasses.MENU });
    const link = ([pane, label]) => {
      const item = elt('a', { href: '#', className: CssClasses.MENU_ITEM }, label);
      item.dataset.pane = pane;
      return item;
    };
    const menuLinks = entries(MENU).map(link);
    menuContainer.append(...menuLinks);

    const controlsContainer = elt('div', { className: CssClasses.CONTROLS });

    const timeCounter = this.counters.time.render();
    // const movesCounter = this.counters.moves.render();
    const flagsCounter = this.counters.flags.render();
    const btnReset = elt('button', { className: CssClasses.BUTTON }, 'Reset');
    btnReset.addEventListener('click', () => this.reset());

    controlsContainer.append(
      // movesCounter,
      timeCounter,
      btnReset,
      flagsCounter,
    );

    this.gameContainer.append(
      menuContainer,
      controlsContainer,
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

      this.makeFirstMove(id);
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

    const isMined = this.filter('isMined');
    const bombCell = cellsToOpen.filter(isMined).slice(0, 1);
    if (bombCell.length) {
      cellsToOpen = bombCell;
    }

    cellsToOpen.forEach((openId) => {
      this.cells[openId].open();
    });

    if (cellsToOpen.length) {
      this.updateCounter('moves', '+1');
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

    this.updateCounter('flags', flagsLeft);
  }

  makeFirstMove(clickedCellId) {
    this.generateMines(clickedCellId);
    this.plantMines();
    this.start();
  }

  start() {
    this.started = true;
    this.counters.time.start();
    this.updateFlagsCounter();
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
    const notMined = cells.length - mines.length;

    const isLost = !!cells.find(({ isOpen, isMined }) => isOpen && isMined);
    const isWon = cells.filter(({ isOpen, isMined }) => isOpen && !isMined).length === notMined;
    const isOver = isLost || isWon;

    assign(this, { isLost, isWon, isOver });

    if (isOver) {
      this.gameOver();
    }

    if (isLost) {
      this.gameLost();
    }

    if (isWon) {
      this.gameWon();
    }
  }

  gameOver() {
    this.setGameState();
    this.counters.time.stop();
    this.results.save(this);
  }

  gameLost() {
    this.revealMines();
  }

  revealMines() {
    this.cells
      .filter((cell) => cell.isMined)
      .forEach((cell) => cell.render());
  }

  gameWon() {
    let { moves, time } = this.counters;
    time = +time;
    moves = +moves;
    const plural = (value, measure) => `${value} ${measure}${value > 1 ? 's' : ''}`;

    alert(`Hooray! You found all mines in ${plural(time, 'second')} and ${plural(moves, 'move')}!`);
  }

  setGameState() {
    const { classList } = this.container;
    const { isLost, isWon, isOver } = this;

    classList.toggle(CssClasses.GAME_OVER, isOver);
    classList.toggle(CssClasses.GAME_LOST, isLost);
    classList.toggle(CssClasses.GAME_WON, isWon);
  }

  saveState() {
    let state = null;
    if (this.started && !this.isOver) {
      const { mines, cells, counters: { time, moves } } = this;

      state = {
        cells,
        mines,
        counters: { time, moves },
      };
    }

    this.storage.set('state', state);
  }

  loadState() {
    const savedState = this.storage.get('state');

    if (savedState === null) {
      return;
    }

    const { mines, cells, counters } = savedState;

    this.mines = mines;
    this.plantMines();

    entries(counters).forEach(([name, value]) => {
      this.restoreCounter(name, value);
    });

    cells.forEach((state, id) => {
      this.cells[id].state = state;
    });

    this.start();
  }

  restoreCounter(name, value) {
    const counter = this.counters[name];
    counter.restore(value);
  }

  updateCounter(name, value) {
    const counter = this.counters[name];
    counter.update(value);
  }
}
