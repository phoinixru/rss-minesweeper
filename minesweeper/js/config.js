import {
  elt, assign, entries, keys, fromEntries,
} from './utils.js';
import Storage from './storage.js';
import Button from './button.js';

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES = 10;
const DEFAULT_THEME = 'light';

const HANDLE_EMPTY_CELLS = true;
const HANDLE_OPEN_CELLS = true;

const DEFAULTS = {
  handleEmptyCells: HANDLE_EMPTY_CELLS,
  handleOpenCells: HANDLE_OPEN_CELLS,
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  mines: DEFAULT_MINES,
  theme: DEFAULT_THEME,
};

const CONFIG = {
  board: {
    type: 'radio',
    label: 'Board size',
    options: [
      [10, 'Small'],
      [15, 'Medium'],
      [25, 'Large'],
    ],
    fields: ['rows', 'cols'],
  },
  difficulty: {
    type: 'radio',
    label: 'Difficulty',
    options: [
      [10, 'Easy'],
      [50, 'Medium'],
      [99, 'Hard'],
    ],
    fields: ['mines'],
  },
  theme: {
    type: 'radio',
    label: 'Theme',
    options: [
      ['light', 'Light'],
      ['dark', 'Dark'],
    ],
    fields: ['theme'],
  },
};

const CssClasses = {
  COMPONENT: 'config',
  FIELD: 'config__field',
  LIST: 'config__list',
  LIST_ITEM: 'config__list-item',
  LIST_LABEL: 'config__list-label',
  BUTTONS: 'buttons',
  BUTTON: 'button',
};

export default class Config {
  constructor({ container }) {
    this.container = container;
    this.storage = new Storage();

    this.loadStored();
    this.addEventListeners();
  }

  addEventListeners() {
    const updateConfig = (event) => this.updateConfig(event);
    this.container.addEventListener('change', updateConfig);

    const saveConfig = (event) => this.saveConfig(event);
    window.addEventListener('beforeunload', saveConfig);
  }

  updateConfig(event) {
    const { target } = event;
    const { name, value } = target;
    const config = CONFIG[name];

    if (!config) {
      return;
    }

    const { fields } = config;
    fields.forEach((field) => {
      this[field] = +value || value;
    });
  }

  loadStored() {
    const storedConfig = this.storage.get('config') || {};

    assign(this, DEFAULTS, storedConfig);
  }

  saveConfig() {
    const toStore = fromEntries(
      keys(DEFAULTS).map((key) => [key, this[key]]),
    );

    this.storage.set('config', toStore);
  }

  render() {
    this.container.innerHTML = '';
    const element = elt('div', { className: CssClasses.COMPONENT });

    const radios = ({ name, options, currentValue }) => {
      const list = elt('ul', { className: CssClasses.LIST });

      options.forEach(([value, label], idx) => {
        const checked = value === currentValue ? 'checked' : '';
        const id = [name, idx].join`_`;

        const item = elt('li', {
          className: CssClasses.LIST_ITEM,
          innerHTML:
            `<input type="radio" name="${name}" id="${id}" value="${value}" ${checked}>`
            + `<label for="${id}" class="${CssClasses.LIST_LABEL}">${label}</label>`,
        });

        list.append(item);
      });

      return list;
    };

    entries(CONFIG).forEach(([id, pref]) => {
      const {
        type, label, options, fields,
      } = pref;
      const currentValue = fields.reduce((acc, f) => this[f] || acc, false);

      const fieldset = elt('fieldset', { className: CssClasses.FIELD }, elt('legend', null, label));

      if (type === 'radio') {
        fieldset.append(radios({
          name: id, options, currentValue,
        }));
      }

      element.append(fieldset);
    });

    const buttons = Button.container();
    const btnSave = Button.button({ id: 'save', pane: 'game' });
    const btnCancel = Button.button({ id: 'cancel', pane: 'game' });

    buttons.append(btnSave, btnCancel);

    this.container.append(
      element,
      buttons,
    );
  }
}
