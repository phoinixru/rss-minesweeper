export default class Cell {
  constructor({
    x, y, rows, cols,
  }) {
    this.hasBomb = false;
    this.isOpen = false;
    this.isFlagged = false;
    this.id = y * cols + x;

    Object.assign(this, { x, y });

    this.setNeighbors({ rows, cols });
  }

  plantBomb(hasBomb) {
    this.hasBomb = hasBomb;
  }

  setNeighbors({ rows, cols }) {
    const { x, y } = this;

    const neighbors = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ]
      .map(([offsetY, offsetX]) => [y + offsetY, offsetX + x])
      .filter(([ny, nx]) => nx >= 0 && ny >= 0 && nx < cols && ny < rows)
      .map(([ny, nx]) => ny * cols + nx);

    this.neighbors = neighbors;
  }

  setBombsAround(bombs) {
    if (this.hasBomb) {
      return;
    }

    this.bombsAround = this.neighbors
      .filter((cell) => bombs.includes(cell)).length;
  }

  open() {
    console.log('Opening', this);
    if (this.isFlagged) {
      return;
    }

    this.isOpen = true;
  }

  flag() {
    console.log('Flagging', this);
    this.isFlagged = !this.isFlagged;
  }

  isEmpty() {
    return this.bombsAround === 0;
  }
}
