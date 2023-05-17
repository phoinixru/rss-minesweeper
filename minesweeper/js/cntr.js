import { elt } from './utils.js';

const CssClasses = {
  COMPONENT: 'counter',
};

const DIGITS = 3;

export default class Counter {
  #restored = 0;

  #start = 0;

  #value = 0;

  #defaultValue;

  #format;

  #auto;

  #interval;

  constructor({
    defaultValue = 0, modifierClass = '',
    format = null, auto = null,
  }) {
    this.#defaultValue = defaultValue;
    this.#format = format;
    this.#auto = auto;

    this.element = elt('div', { className: CssClasses.COMPONENT });
    if (modifierClass) {
      this.element.classList.add(`${CssClasses.COMPONENT}--${modifierClass}`);
    }
  }

  start() {
    const { source, interval } = this.#auto;
    const update = () => { this.value = source(); };

    this.#defaultValue = source();
    this.#start = source();
    this.#interval = setInterval(update, interval);

    update();
  }

  stop() {
    clearInterval(this.#interval);
  }

  restore(value) {
    this.#restored = value;
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
    this.stop();

    this.#start = this.#defaultValue;
    this.value = this.#start;
  }

  render() {
    const displayValue = this.formatted();
    const displayString = String(displayValue).padStart(DIGITS, '0');

    this.element.innerHTML = displayString;

    return this.element;
  }

  formatted() {
    let value = this.#value - this.#start;
    if (this.#format) {
      value = this.#format(value);
    }
    value += this.#restored;

    return value;
  }

  valueOf() {
    return this.formatted();
  }

  toJSON() {
    return this.formatted();
  }
}
