import { elt, assign } from './utils.js';

const CssClasses = {
  CELL: 'cell',
  CELL_BOMB: 'cell--bomb',
  CELL_FLAGGED: 'cell--flagged',
  CELL_OPEN: 'cell--open',
};

const ADJACENT_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export default class Cell {
  constructor({
    x, y, rows, cols, game,
  }) {
    this.hasBomb = false;
    this.isOpen = false;
    this.isFlagged = false;
    this.id = y * cols + x;

    Object.assign(this, { x, y, game });

    this.element = elt('span', { className: CssClasses.CELL });
    assign(this.element.dataset, { y, x });

    this.setAdjacent({ rows, cols });
  }

  plantBomb() {
    this.hasBomb = true;
  }

  setAdjacent({ rows, cols }) {
    const { x, y } = this;

    const adjacent = ADJACENT_OFFSETS
      .map(([offsetY, offsetX]) => [y + offsetY, offsetX + x])
      .filter(([aY, aX]) => aX >= 0 && aY >= 0 && aX < cols && aY < rows)
      .map(([aY, aX]) => aY * cols + aX);

    this.adjacent = adjacent;
  }

  setBombsAround(bombs) {
    if (this.hasBomb) {
      return;
    }

    const hasBomb = (cell) => bombs.includes(cell);

    this.bombsAround = this.adjacent.filter(hasBomb).length;
  }

  open() {
    console.log('Opening');
    if (this.isFlagged) {
      return;
    }

    this.isOpen = true;
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

  isEmpty() {
    return this.bombsAround === 0;
  }

  render() {
    const {
      isFlagged,
      isOpen,
      bombsAround,
      hasBomb,
      game,
      element,
    } = this;
    const { classList } = element;
    const { isOver } = game;

    if (isOpen) {
      classList.add(CssClasses.CELL_OPEN);

      if (bombsAround) {
        element.dataset.bombs = bombsAround;
      }
    }

    classList.toggle(CssClasses.CELL_BOMB, isOver && hasBomb);
    classList.toggle(CssClasses.CELL_FLAGGED, isFlagged);

    return element;
  }
}
