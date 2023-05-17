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
  }

  add({ id, title = '', hidden = true }) {
    const pane = elt('div', { className: CssClasses.COMPONENT });
    const header = elt('div', { className: CssClasses.HEADER }, title);
    const container = elt('div', { className: CssClasses.CONTENT });

    pane.append(header, container);
    pane.classList.add(`${CssClasses.COMPONENT}--${id}`);
    pane.classList.toggle(CssClasses.HIDDEN, hidden);

    this.#panes.push({ id, title, container });
    this.#container.append(pane);

    return container;
  }
}
