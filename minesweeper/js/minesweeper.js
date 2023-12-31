import {
  elt, assign, values, entries, keys,
} from './utils.js';
import { Cell, CellClasses } from './cell.js';
import Counter from './cntr.js';
import Storage from './storage.js';
import Results from './results.js';
import Panes from './panes.js';
import { Config, FIELD_SETTINGS } from './config.js';
import Sounds from './sounds.js';
import { EVENTS, action } from './events.js';
import Button from './button.js';
import Reset from './reset.js';
import Help from './help.js';

const CssClasses = {
  COMPONENT: 'minesweeper',
  GAME_OVER: 'minesweeper--over',
  GAME_LOST: 'minesweeper--lost',
  GAME_WON: 'minesweeper--won',
  THEME: 'theme',
  MENU: 'menu',
  MENU_ITEM: 'menu__item',
  CONTROLS: 'controls',
  CONTROLS_PANE: 'controls__pane',
  FIELD: 'field',
  FIELD_POINTED: 'field--pointed',
  BUTTON: 'button',
  MESSAGE: 'message',
};

const TITLE = {
  game: 'Minesweeper',
  results: 'Last results',
  config: 'Preferences',
  win: 'Congratulations!',
  loose: 'Try again',
  help: 'Help',
  restored: 'Game restored',
};

const MENU = {
  config: 'Settings',
  results: 'Results',
  help: 'Help',
};

const MESSAGE_WIN = 'Hooray! You found all mines in %time% and %moves%!';
const MESSAGE_LOOSE = 'Game over. Try again...';
const MESSAGE_RESTORED = 'Game restored from the previous state';

const seededRandom = (seed = Date.now()) => {
  return () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
};
const random = seededRandom();

const BUTTON = {
  PRIMARY: 0,
  SECONDARY: 2,
  TOUCH: -1,
};

const KEYS = {
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
  B: 'B',
  A: 'A',
};
const KODE = '↑↑↓↓←→←→BA';

const is = (e) => e;
const isNot = (e) => !e;

export default class Minesweeper {
  mines = null;

  isOver = false;

  rows;

  cols;

  constructor({ parentContainer }) {
    this.container = elt('div', { className: CssClasses.COMPONENT });
    parentContainer.append(this.container);

    this.fieldContainer = elt('div', { className: CssClasses.FIELD });

    const panes = new Panes({ container: this.container });
    this.panes = panes;

    this.gameContainer = panes.add({ id: 'game', title: TITLE.game, hidden: false });

    const modal = true;
    const configContainer = panes.add({ id: 'config', title: TITLE.config, modal });
    this.config = new Config({ container: configContainer });

    const resultsContainer = panes.add({ id: 'results', title: TITLE.results, modal });
    this.results = new Results({ container: resultsContainer });

    const helpContainer = panes.add({ id: 'help', title: TITLE.help, modal });
    this.help = new Help({ container: helpContainer });

    this.winModal = panes.add({ id: 'win', title: TITLE.win, modal });
    this.looseModal = panes.add({ id: 'loose', title: TITLE.loose, modal });
    this.restoredModal = panes.add({ id: 'restored', title: TITLE.restored, modal });

    this.counters = {
      moves: new Counter({ id: 'moves' }),
      time: new Counter({
        id: 'time',
        auto: { source: Date.now, interval: 1000 },
        format: (value) => Math.floor(value / 1000),
      }),
      flags: new Counter({ id: 'flags' }),
    };

    this.storage = new Storage();
    this.sounds = new Sounds({ config: this.config });

    this.btnReset = new Reset();

    this.prepareField();
    this.addEventListeners();
    this.loadState();
    this.setTheme();
  }

  addEventListeners() {
    const {
      handleClicks,
      handleMouse,
      handlePointer,
      handleConfig,
      handleAction,
      saveState,
      enterKode,

      gameContainer,
      fieldContainer,
    } = this;

    gameContainer.addEventListener('click', handleClicks);
    gameContainer.addEventListener('contextmenu', handleClicks);
    fieldContainer.addEventListener('mouseover', handleMouse);
    fieldContainer.addEventListener('mouseleave', handleMouse);

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('pointerup', handlePointer);

    window.addEventListener('beforeunload', saveState);

    document.addEventListener('keydown', enterKode);

    document.addEventListener(EVENTS.config, handleConfig);
    document.addEventListener(EVENTS.action, handleAction);
  }

  handleAction = (event) => {
    const { detail: { action } } = event;
    if (action === 'reset') {
      this.reset();
    }
  }

  handleConfig = (event) => {
    const { detail } = event;
    const { field } = detail;

    if (field === 'theme') {
      this.setTheme();
    }

    if (FIELD_SETTINGS.includes(field)) {
      this.reset();
    }
  }

  #keys = [];

  #godMode = false;

  enterKode = (event) => {
    const { code } = event;
    const key = KEYS[code.replace(/Key|Arrow/, '')] || code;

    if (code !== 'Enter') {
      this.#keys = [...this.#keys, key].slice(-10);
      return;
    }

    const kode = this.#keys.join``;
    if (kode === KODE) {
      this.setGodMode();
      event.preventDefault();
    }
  }

  setGodMode() {
    this.#godMode = true;
    this.#keys = [];

    action('kode');
    this.cells
      .filter(({ isFlagged, isMined }) => isFlagged && !isMined)
      .forEach((cell) => cell.flag());

    this.updateFlagsCounter();
  }

  handleMouse = (event) => {
    const { type } = event;

    if (type === 'mouseover') {
      this.checkShock(event);
    } else {
      action('move', { type });
    }
  }

  handlePointer = (event) => {
    const { type, button } = event;
    const isPointerDown = type === 'pointerdown' && button === BUTTON.PRIMARY;
    this.container.classList.toggle(CssClasses.FIELD_POINTED, isPointerDown);

    if (button === BUTTON.PRIMARY) {
      this.checkShock(event);
    }
  }

  checkShock(event) {
    const { target, buttons } = event;

    const cellElement = target.closest(`.${CellClasses.CELL}`);
    if (cellElement) {
      const cellId = cellElement.dataset.id;
      const { cells, cols } = this;
      const cell = cells[cellId];
      action('move', { cell, buttons, cols });
    }
  }

  handleClicks = (event) => {
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
    const { mines, rows, cols } = config;
    const minesCount = Math.min(rows * cols - 1, mines);
    const excluded = +clickedCellId;

    const allCells = keys(cells)
      .map((idx) => +idx)
      .filter((id) => id !== excluded);

    const cellsToPlant = Array(minesCount)
      .fill(0)
      .map(() => allCells.splice(
        random() * allCells.length, 1
      ).pop())

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
    this.rows = rows;
    this.cols = cols;
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
    const menuContainer = elt('nav', { className: CssClasses.MENU });
    const link = ([pane, label]) => {
      const item = elt('a', { href: '#', className: CssClasses.MENU_ITEM }, label);
      item.dataset.pane = pane;
      return item;
    };
    const menuLinks = entries(MENU).map(link);
    menuContainer.append(...menuLinks);

    const controlsContainer = elt('div', { className: CssClasses.CONTROLS });
    const controlPanes = ['left', 'center', 'right'].reduce((acc, id) => assign(
      acc,
      {
        [id]: elt('div', {
          className: `${CssClasses.CONTROLS_PANE} ${CssClasses.CONTROLS_PANE}-${id}`,
        }),
      },
    ), {});

    const timeCounter = this.counters.time.render();
    const movesCounter = this.counters.moves.render();
    const flagsCounter = this.counters.flags.render();
    const btnReset = this.btnReset.render();

    controlPanes.left.append(movesCounter, flagsCounter);
    controlPanes.center.append(btnReset);
    controlPanes.right.append(timeCounter);

    controlsContainer.append(
      ...values(controlPanes),
    );

    this.gameContainer.append(
      menuContainer,
      controlsContainer,
      this.fieldContainer,
    );
  }

  renderField() {
    const { cells, fieldContainer, cols } = this;
    const renderCell = (cell) => cell.render();

    fieldContainer.innerHTML = '';
    fieldContainer.dataset.cols = cols;
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

    this.updateFlagsCounter();
    this.checkGameOver();
  }

  openCell(cellId) {
    const cell = this.cells[cellId];
    const {
      isOpen, isFlagged, isEmpty, id,
      isMined,
    } = cell;

    if (isFlagged) {
      return;
    }

    if (this.#godMode && isMined) {
      this.flagCell(cellId);
      return;
    }

    const {
      handleEmptyCells,
      handleOpenCells,
    } = this.config;

    let cellsToOpen = [];
    let layersToOpen = [];
    const isNotOpenCell = this.filter('isOpen', isNot);

    if (isOpen) {
      if (!handleOpenCells || isEmpty) {
        return;
      }

      const isNotFlaggedCell = this.filter('isFlagged', isNot);
      const isFlaggedCell = this.filter('isFlagged');

      const { minesAround, adjacent } = cell;
      const adjacentFlagged = adjacent.filter(isFlaggedCell).length;
      const notOpen = adjacent.filter(isNotOpenCell);

      if (minesAround === notOpen.length) {
        notOpen.filter(isNotFlaggedCell)
          .forEach((cellId) => this.flagCell(cellId));
        return;
      }

      if (minesAround !== adjacentFlagged) {
        return;
      } else {
        cellsToOpen.push(...notOpen.filter(isNotFlaggedCell));
      }

    } else {
      cellsToOpen.push(id);
    }

    if (handleEmptyCells) {
      layersToOpen = this.selectCellsToOpen(cellsToOpen);
    } else {
      layersToOpen = [cellsToOpen];
    }

    const isCellMined = this.filter('isMined');

    cellsToOpen = layersToOpen.flat();
    const bombCell = cellsToOpen.filter(isCellMined).slice(0, 1);
    if (bombCell.length) {
      layersToOpen = [bombCell];
    }

    layersToOpen.forEach((layer, order) => {
      layer.forEach((openId) => this.cells[openId].open(order));
    });

    if (cellsToOpen.length) {
      this.updateCounter('moves', '+1');
      action('open');
    }
  }

  selectCellsToOpen(ids) {
    const layers = [];
    const checked = [];
    let layer = ids;

    const isNotYetChecked = (cellId) => !checked.includes(cellId);
    const isEmpty = this.filter('isEmpty');
    const isNotOpen = this.filter('isOpen', isNot);

    do {
      layers.push([...layer]);
      checked.push(...layer);
      const emptyCells = layer.filter(isEmpty);
      if (emptyCells.length) {
        layer = [
          ...new Set(emptyCells
            .flatMap((id) => this.cells[id].adjacent)
            .filter(isNotOpen)
            .filter(isNotYetChecked))
        ];
      } else {
        layer = [];
      }
    } while (layer.length);

    return layers;
  }

  filter(flag, func = is) {
    return (id) => func(this.cells[id][flag]);
  }

  flagCell(id) {
    const flagged = this.cells[id].flag();

    if (flagged !== undefined) {
      const actionId = flagged ? 'flag-on' : 'flag-off';
      action(actionId);
    }
  }

  updateFlagsCounter() {
    const { mines } = this;
    const flaggedCells = this.cells.filter(({ isFlagged }) => isFlagged).length;
    const flagsLeft = mines.length - flaggedCells;

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
    this.sounds.playMusic();
  }

  reset() {
    assign(this, {
      started: false,
      isOver: false,
      isWon: false,
      isLost: false,
    });
    this.#godMode = false;

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

    if (this.looseModal.innerHTML === '') {
      const message = elt('div', { className: CssClasses.MESSAGE }, MESSAGE_LOOSE);
      const btnAgain = Button.button({ id: 'again', pane: 'game' });
      const buttons = Button.container(btnAgain);
      this.looseModal.append(message, buttons);
    }

    this.panes.show('loose');

    action('loose');
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
    const plural = (value, measure) => `${value} ${measure}${value !== 1 ? 's' : ''}`;

    this.winModal.innerHTML = '';

    const text = MESSAGE_WIN
      .replace('%time%', plural(time, 'second'))
      .replace('%moves%', plural(moves, 'move'));

    const message = elt('div', { className: CssClasses.MESSAGE }, text);

    const btnOk = Button.button({ id: 'nice', pane: 'game' });
    const buttons = Button.container(btnOk);

    this.winModal.append(message, buttons);

    this.panes.show('win');

    action('win');
  }

  setGameState() {
    const { classList } = this.container;
    const { isLost, isWon, isOver } = this;

    classList.toggle(CssClasses.GAME_OVER, isOver);
    classList.toggle(CssClasses.GAME_LOST, isLost);
    classList.toggle(CssClasses.GAME_WON, isWon);
  }

  saveState = () => {
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

    const message = elt('div', { className: CssClasses.MESSAGE }, MESSAGE_RESTORED);
    const btnOk = Button.button({ id: 'ok', pane: 'game' });
    const buttons = Button.container(btnOk);
    this.restoredModal.append(message, buttons);

    this.panes.show('restored');

    btnOk.addEventListener('click', () => this.start());
  }

  restoreCounter(name, value) {
    const counter = this.counters[name];
    counter.restore(value);
  }

  updateCounter(name, value) {
    const counter = this.counters[name];
    counter.update(value);
  }

  setTheme() {
    const { theme } = this.config;
    const { classList } = document.body;

    classList.forEach((className) => {
      if (className.match(CssClasses.THEME)) {
        classList.remove(className);
      }
    });

    classList.add(`${CssClasses.THEME}-${theme}`);
  }
}
