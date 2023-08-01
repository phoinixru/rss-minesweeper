import { elt } from './utils.js';

const CssClasses = {
  COMPONENT: 'counter',
};

const COUNTERS = {
  moves: 'Moves',
  time: 'Time',
  flags: 'Flags',
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
    id,
    defaultValue = 0,
    format = null, auto = null,
  }) {
    this.#defaultValue = defaultValue;
    this.#format = format;
    this.#auto = auto;

    const element = elt('div', { className: CssClasses.COMPONENT });
    element.classList.add(`${CssClasses.COMPONENT}--${id}`);
    element.dataset.title = COUNTERS[id];

    this.element = element;
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
    let method;

    if (typeof value === 'string') {
      const sign = String(value).at(0);
      method = { '-': 'decrease', '+': 'increase' }[sign];
    }

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

    this.#restored = 0;
    this.#start = this.#defaultValue;
    this.value = this.#start;
  }

  render() {
    const value = this.formatted();
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);

    const displayString = (sign + String(absValue).padStart(DIGITS - sign.length, '0'))
      .split``.map((char) => `<span data-char="${char}">${char}</span>`)
      .join``;

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
