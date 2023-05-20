import { elt } from './utils.js';
import { EVENTS, action } from './events.js';

const CssClasses = {
  COMPONENT: 'reset',
  GOD: 'reset--god',
};

const TEXT = 'Reset';

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

    const { detail: { action: actionId } } = event;
    button.dataset.action = actionId;

    if (actionId === 'kode') {
      button.classList.add(CssClasses.GOD);
    }

    if (actionId === 'reset') {
      button.classList.remove(CssClasses.GOD);
    }
  }

  render() {
    return this.button;
  }
}
