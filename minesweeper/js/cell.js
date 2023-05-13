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

class Cell {
  constructor({
    x, y, rows, cols, game,
  }) {
    this.isMined = false;
    this.isOpen = false;
    this.isFlagged = false;
    this.isEmpty = true;
    this.id = y * cols + x;

    Object.assign(this, { x, y, game });

    this.element = elt('span', { className: CssClasses.CELL });
    assign(this.element.dataset, { y, x });

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
}

export { Cell, CssClasses as CellClasses };
