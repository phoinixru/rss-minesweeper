import { elt } from './js/utils.js';
import Minesweeper from './js/minesweeper.js';

const CssClasses = {
  WRAPPER: 'wrapper',
};

function init() {
  const wrapper = elt('div', { className: CssClasses.WRAPPER });
  const minesweeper = new Minesweeper({ parentContainer: wrapper });

  document.body.append(wrapper);

  minesweeper.render();
}

window.addEventListener('load', init);
