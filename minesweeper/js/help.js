import { elt } from './utils.js';
import { CellClasses } from './cell.js';
import Button from './button.js';

const CssClasses = {
  COMPONENT: 'help',
};

const cell = ({
  flagged = false, open = false, mined = false, mines = 0,
} = {}) => {
  const el = elt('span', { className: CellClasses.CELL });
  const { classList } = el;

  classList.toggle(CellClasses.CELL_FLAGGED, flagged);
  classList.toggle(CellClasses.CELL_OPEN, open);
  classList.toggle(CellClasses.CELL_MINED, mined);

  if (mines) {
    el.dataset.mines = mines;
  }

  return el.outerHTML;
};

const HELP_HTML = `
<p>Morning/afternoon/eve.<br>
Your mission, should you choose to accept it, is to open all the empty cells while avoiding cells with mines.</p>

<p>${cell()} Click on a cell to reveal its content.</p>
<p>${cell({ mined: true, open: true })} If it is a mine  - game over, start again and try to be more careful next time.</p>
<p>${cell({ open: true, mines: 5 })} Number in an empty cell  indicates the number of mined cell around.</p>
<p>${cell({ flagged: true, mined: true })} Use right mouse button to mark cell with a flag. Flagged cells can't be open with a click.</p>

<p>To win you have to open all empty cells.</p>

<p>Hints:<br>
- if the number of flagged cells around open cell matches the number inside the cell, you can click it to reveal content cells around<br>
- struggle with hard level - try to use The <strong>K</strong>code.</p>`;

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
