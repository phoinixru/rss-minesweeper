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

  update(value) {
    const int = parseInt(value, 10);
    const sign = String(value).at(0);
    const method = {
      '-': 'decrease',
      '+': 'increase',
    }[sign];

    if (method) {
      this[method](Math.abs(int));
    } else {
      this.value = int;
    }
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

  increase(increment = 1) {
    this.value += increment;
  }

  decrease(decrement = 1) {
    this.value -= decrement;
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

  toJSON() {
    return this.value;
  }
}
