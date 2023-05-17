/* eslint-disable no-bitwise */
import { elt, assign } from './utils.js';

const CssClasses = {
  CELL: 'cell',
  CELL_MINED: 'cell--mined',
  CELL_FLAGGED: 'cell--flagged',
  CELL_OPEN: 'cell--open',
};

const ADJACENT_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const STATE = {
  MINED: 1,
  OPEN: 2,
  FLAGGED: 4,
};

class Cell {
  constructor({
    x, y, id, rows, cols, game,
  }) {
    Object.assign(this, {
      x,
      y,
      id,
      game,
      isMined: false,
      isOpen: false,
      isFlagged: false,
      isEmpty: true,
    });

    this.element = elt('span', { className: CssClasses.CELL });
    assign(this.element.dataset, { id });

    this.setAdjacent({ rows, cols });
  }

  plantMine() {
    this.isMined = true;
    this.isEmpty = false;
  }

  setAdjacent({ rows, cols }) {
    const { x, y } = this;

    const adjacent = ADJACENT_OFFSETS
      .map(([offsetY, offsetX]) => [y + offsetY, offsetX + x])
      .filter(([aY, aX]) => aX >= 0 && aY >= 0 && aX < cols && aY < rows)
      .map(([aY, aX]) => aY * cols + aX);

    this.adjacent = adjacent;
  }

  setMinesAround(mines) {
    if (this.isMined) {
      return;
    }

    const isMined = (cellId) => mines.includes(cellId);

    this.minesAround = this.adjacent.filter(isMined).length;
    this.isEmpty = !this.minesAround;
  }

  open() {
    console.log('Opening');
    this.isOpen = true;
    this.isFlagged = false;
    this.render();
  }

  flag() {
    console.log('Flagging');
    if (this.isOpen) {
      return;
    }
    this.isFlagged = !this.isFlagged;
    this.render();
  }

  render() {
    const {
      isFlagged,
      isOpen,
      isMined,
      minesAround,
      game,
      element,
    } = this;
    const { classList } = element;
    const { isOver } = game;

    if (isOpen) {
      classList.add(CssClasses.CELL_OPEN);

      if (minesAround) {
        element.dataset.mines = minesAround;
      }
    }

    classList.toggle(CssClasses.CELL_MINED, isOver && isMined);
    classList.toggle(CssClasses.CELL_FLAGGED, isFlagged);

    return element;
  }

  get state() {
    const { isMined, isFlagged, isOpen } = this;

    return (isMined && STATE.MINED)
      + (isFlagged && STATE.FLAGGED)
      + (isOpen && STATE.OPEN);
  }

  set state(state) {
    this.isMined = state & STATE.MINED;
    this.isFlagged = state & STATE.FLAGGED;
    this.isOpen = state & STATE.OPEN;

    this.render();
  }

  toJSON() {
    return this.state;
  }
}

export { Cell, CssClasses as CellClasses };
