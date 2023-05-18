import { elt } from './utils.js';

const CssClasses = {
  COMPONENT: 'pane',
  HIDDEN: 'pane--hidden',
  HEADER: 'pane__header',
  CONTENT: 'pane__content',
};

export default class Panes {
  #container;

  #panes = [];

  constructor({ container }) {
    this.#container = container;

    this.addEventListeners();
  }

  addEventListeners() {
    document.addEventListener('click', (event) => this.handleClicks(event));
  }

  handleClicks(event) {
    const { target } = event;
    if (!target.matches('[data-pane]')) {
      return;
    }

    event.preventDefault();

    const paneId = target.dataset.pane;

    this.show(paneId);
  }

  add({ id, title = '', hidden = true }) {
    const pane = elt('div', { className: CssClasses.COMPONENT });
    const header = elt('div', { className: CssClasses.HEADER }, title);
    const container = elt('div', { className: CssClasses.CONTENT });

    pane.append(header, container);
    pane.classList.add(`${CssClasses.COMPONENT}--${id}`);
    pane.classList.toggle(CssClasses.HIDDEN, hidden);

    this.#panes.push({
      id, title, container, pane,
    });
    this.#container.append(pane);

    return container;
  }

  show(showId) {
    this.#panes.forEach(({ id, pane }) => {
      pane.classList.toggle(CssClasses.HIDDEN, id !== showId);
    });
  }
}
