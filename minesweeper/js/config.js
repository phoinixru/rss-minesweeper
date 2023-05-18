import {
  elt, assign, entries, keys, fromEntries,
} from './utils.js';
import Storage from './storage.js';
import Button from './button.js';
import { dispatch, EVENTS } from './events.js';

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES = 10;
const DEFAULT_THEME = 'light';

const DEFAULT_SOUND = true;
const DEFAULT_SOUND_VOLUME = 100;

const DEFAULT_MUSIC = false;
const DEFAULT_MUSIC_VOLUME = 10;

const HANDLE_EMPTY_CELLS = true;
const HANDLE_OPEN_CELLS = true;

const DEFAULTS = {
  handleEmptyCells: HANDLE_EMPTY_CELLS,
  handleOpenCells: HANDLE_OPEN_CELLS,
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  mines: DEFAULT_MINES,
  theme: DEFAULT_THEME,
  sound: DEFAULT_SOUND,
  soundVolume: DEFAULT_SOUND_VOLUME,
  music: DEFAULT_MUSIC,
  musicVolume: DEFAULT_MUSIC_VOLUME,
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
  sound: {
    type: 'checkbox',
    label: 'Sound',
    fields: ['sound'],
  },
  soundVolume: {
    type: 'range',
    min: 0,
    max: 100,
    fields: ['soundVolume'],
  },
  music: {
    type: 'checkbox',
    label: 'Music',
    fields: ['music'],
  },
  musicVolume: {
    type: 'range',
    min: 0,
    max: 100,
    fields: ['musicVolume'],
  },
};

const CssClasses = {
  COMPONENT: 'config',
  FIELD: 'config__field',
  LIST: 'config__list',
  LIST_ITEM: 'config__list-item',
  LIST_LABEL: 'config__list-label',
  CHECKBOX: 'config__checkbox',
  CHECKBOX_LABEL: 'config__checkbox-label',
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
    const { name, value, checked } = target;
    const config = CONFIG[name];
    console.log(name, value);

    if (!config) {
      return;
    }

    const { fields, type } = config;
    fields.forEach((field) => {
      const newValue = type === 'checkbox' ? checked : (+value || value);
      this[field] = newValue;

      dispatch(EVENTS.config, { detail: { field, value: newValue } });
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

    const checkbox = ({ name, currentValue, label }) => {
      const id = name;
      const checked = currentValue ? 'checked' : '';

      return elt('div', {
        className: CssClasses.CHECKBOX,
        innerHTML:
          `<input type="checkbox" name="${name}" id="${id}" ${checked}>`
          + `<label for="${id}" class="${CssClasses.CHECKBOX_LABEL}">${label}</label>`,
      });
    };

    const range = ({
      name, min, max, currentValue,
    }) => elt('input', {
      type: 'range', min, max, value: currentValue, name,
    });

    entries(CONFIG).forEach(([id, pref]) => {
      const {
        type, label, options, fields,
      } = pref;
      const currentValue = fields.reduce((acc, f) => this[f] || acc, false);

      const fieldset = elt('fieldset', { className: CssClasses.FIELD });

      if (type === 'radio') {
        fieldset.append(
          elt('legend', null, label),
          radios({ name: id, options, currentValue }),
        );
      }

      if (type === 'checkbox') {
        fieldset.append(
          checkbox({ name: id, currentValue, label }),
        );
      }

      if (type === 'range') {
        const { min, max } = pref;
        fieldset.append(
          range({
            name: id, currentValue, label, min, max,
          }),
        );
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
