const { stringify, parse } = JSON;
const STORAGE_NAME = 'phoinixru';

export default class Storage {
  #name;

  #data;

  constructor(name = STORAGE_NAME) {
    this.#name = name;

    this.load();
  }

  set(prop, value) {
    this.load();
    this.#data[prop] = value;
    this.save();
  }

  get(prop) {
    return this.#data[prop] || null;
  }

  load() {
    let storedData;
    try {
      storedData = parse(localStorage.getItem(this.#name) || '{}');
    } catch (e) {
      storedData = {};
    }
    this.#data = storedData;
  }

  save() {
    localStorage.setItem(this.#name, stringify(this.#data));
  }
}
