import { elt } from './utils.js';
import { CellClasses } from './cell.js';
import Button from './button.js';

const CssClasses = {
  COMPONENT: 'help',
  FIELD: 'field',
};

const cell = ({
  flagged = false, open = false, mined = false, mines = 0,
} = {}) => {
  const el = elt('span', { className: CellClasses.CELL });
  const { classList } = el;

  classList.toggle(CellClasses.CELL_FLAGGED, flagged);
  classList.toggle(CellClasses.CELL_OPEN, open);
  classList.toggle(CellClasses.CELL_MINED, mined || flagged);

  if (mines) {
    el.dataset.mines = mines;
  }

  return el.outerHTML;
};

const field = (cells) => {
  const size = Math.sqrt(cells.length);
  const el = elt('div', { className: CssClasses.FIELD });
  el.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  el.innerHTML = cells.map(cell).join`\n`;


  return el.outerHTML;
}

const open = true;
const flagged = true;
const FIELD_EIGHT = field([
  {}, {}, {},
  {}, { mines: 8, open }, {},
  {}, {}, {},
]);
const FIELD_EIGHT_CLICKED = field([
  { flagged }, { flagged }, { flagged },
  { flagged }, { mines: 8, open }, { flagged },
  { flagged }, { flagged }, { flagged },
]);

const FIELD_FOUR = field([
  { flagged }, {  }, { flagged },
  {  }, { mines: 4, open }, {  },
  { flagged }, {  }, { flagged },
]);
const FIELD_FOUR_CLICKED = field([
  { flagged }, { mines: 2, open }, { flagged },
  { mines: 2, open }, { mines: 4, open }, { mines: 2, open },
  { flagged }, { mines: 2, open }, { flagged },
]);

const HELP_HTML = `
<p>Morning/afternoon/eve.<br>
Your mission, should you choose to accept it, is to open all the empty cells while avoiding cells with mines.</p>

<p>${cell()} Click on a cell to reveal its content.</p>
<p>${cell({ mined: true, open: true })} If it is a mine  - game over, start again and try to be more careful next time.</p>
<p>${cell({ open: true, mines: 5 })} Number in an empty cell  indicates the number of mined cell around.</p>
<p>${cell({ flagged: true, mined: true })} Use right mouse button to mark cell with a flag. Flagged cells can't be open with a click.</p>

<p>To win you have to open all empty cells.</p>

<h2>Advanced moves:</h2>
<p>If you have marked all the bombs around open cell, you can click it to reveal contents of the rest of the cells, but be wary:<br>
<div class="example">${FIELD_FOUR} -> ${FIELD_FOUR_CLICKED}</div>
</p>
<p>if the number of closed cells around open cell matches the number inside the cell, you can click it to mark these cells with a flag:<br>
<div class="example">${FIELD_EIGHT} -> ${FIELD_EIGHT_CLICKED}</div>
</p>

<p>Struggle with hard level? - try to use The <strong>Konami</strong> Code:<br>
↑↑↓↓←→←→BA + Enter</p>`;

export default class Help {
  constructor({ container }) {
    this.container = container;
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const buttons = Button.container();
    const btnOk = Button.button({ id: 'ok', pane: 'game' });
    buttons.append(btnOk);

    const element = elt('div', {
      className: CssClasses.COMPONENT,
      innerHTML: HELP_HTML,
    });

    this.container.append(element, buttons);
  }
}
