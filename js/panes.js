import { elt, qs } from './utils.js';

const CssClasses = {
  COMPONENT: 'panes',
  HAS_MODAL: 'panes--modal',
  PANE: 'pane',
  HIDDEN: 'pane--hidden',
  MODAL: 'pane--modal',
  HEADER: 'pane__header',
  CONTENT: 'pane__content',
};

export default class Panes {
  #container;

  #panes = [];

  constructor({ container }) {
    this.#container = elt('div', { className: CssClasses.COMPONENT });
    container.append(this.#container);

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

    const targetId = target.dataset.pane;
    this.show(targetId);
  }

  add({
    id, title = '', hidden = true, modal = false,
  }) {
    const pane = elt('div', { className: CssClasses.PANE });
    const header = elt('div', { className: CssClasses.HEADER }, title);
    const container = elt('div', { className: CssClasses.CONTENT });

    pane.append(header, container);
    pane.classList.add(`${CssClasses.PANE}--${id}`);
    pane.classList.toggle(CssClasses.HIDDEN, hidden);
    pane.classList.toggle(CssClasses.MODAL, modal);

    this.#panes.push({
      id, title, container, pane,
    });
    this.#container.append(pane);

    return container;
  }

  show(targetId) {
    const target = this.#panes.find(({ id }) => id === targetId);
    if (!target) {
      return;
    }

    const targetPane = target.pane;
    targetPane.classList.toggle(CssClasses.HIDDEN, false);
    const isTargetModal = targetPane.matches(`.${CssClasses.MODAL}`);

    this.#container.classList.toggle(CssClasses.HAS_MODAL, isTargetModal);

    if (isTargetModal) {
      qs('button', targetPane).focus();
      return;
    }

    const current = this.#panes
      .find(({ id, pane }) => id !== targetId && !pane.matches(`.${CssClasses.HIDDEN}`));
    if (current) {
      current.pane.classList.toggle(CssClasses.HIDDEN, true);
    }
  }
}
