import { elt } from './utils.js';

const CssClasses = {
  COMPONENT: 'counter',
};

const DIGITS = 3;

export default class Counter {
  #start = 0;

  #value = 0;

  #defaultValue;

  constructor({ start = 0, defaultValue = 0, modifierClass = '' }) {
    this.#start = start;
    this.#defaultValue = defaultValue;

    this.element = elt('div', { className: CssClasses.COMPONENT });
    if (modifierClass) {
      this.element.classList.add(`${CssClasses.COMPONENT}--${modifierClass}`);
    }
  }

  update(newValue) {
    this.value = newValue;
  }

  set value(newValue) {
    const oldValue = this.#value;

    this.#value = newValue;

    if (newValue !== oldValue) {
      this.render();
    }
  }

  get value() {
    return this.#value;
  }

  reset() {
    this.value = this.#defaultValue;
  }

  render() {
    const displayValue = this.value - this.#start;
    const displayString = String(displayValue).padStart(DIGITS, '0');

    this.element.innerHTML = displayString;

    return this.element;
  }
}
