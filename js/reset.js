import { elt, entries } from './utils.js';
import { EVENTS, action } from './events.js';

const CssClasses = {
  COMPONENT: 'reset',
  GOD: 'reset--god',
  LOOK: 'reset--look',
  SHOCK: 'reset--shock',
  WIN: 'reset--win',
  LOOSE: 'reset--loose',
};

const TEXT = 'Reset';

const ONE_THIRD = 1 / 3;
const TWO_THIRDS = 2 / 3;

export default class Reset {
  constructor() {
    const button = elt(
      'button',
      { className: CssClasses.COMPONENT },
      elt('span', null, TEXT),
    );
    button.addEventListener('click', () => action('reset'));

    this.button = button;

    this.addEventListeners();
  }

  addEventListeners() {
    document.addEventListener(EVENTS.action, (event) => this.handleActions(event));
  }

  handleActions(event) {
    const { button } = this;
    const { classList } = button;
    const { detail } = event;
    const { action: actionId } = detail;

    button.dataset.action = actionId;

    if (actionId === 'win') {
      classList.add(CssClasses.WIN);
    }

    if (actionId === 'loose') {
      classList.add(CssClasses.LOOSE);
    }

    if (actionId === 'kode') {
      classList.add(CssClasses.GOD);
    }

    if (actionId === 'reset') {
      classList.remove(CssClasses.GOD);
      classList.remove(CssClasses.WIN);
      classList.remove(CssClasses.LOOSE);
    }

    if (actionId === 'move') {
      const { cell, buttons, cols } = detail;
      let shock = false;

      if (cell) {
        const { isOpen, isFlagged, x } = cell;
        const part = x / cols;
        const look = {
          left: part < ONE_THIRD,
          center: part >= ONE_THIRD && part < TWO_THIRDS,
          right: part >= TWO_THIRDS,
        };

        entries(look).forEach(([direction, toggle]) => {
          classList.toggle(`${CssClasses.LOOK}-${direction}`, toggle);
        });

        shock = !isOpen && !isFlagged && buttons > 0;
      }

      classList.toggle(CssClasses.SHOCK, shock);
    }
  }

  render() {
    return this.button;
  }
}
