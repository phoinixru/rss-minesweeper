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

const FIELD_SIZES = [
  [10, 'Small'],
  [15, 'Medium'],
  [25, 'Large'],
];
const THEMES = entries({
  default: 'Light',
  doom: 'Dark',
});

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
    options: FIELD_SIZES,
    fields: ['rows', 'cols'],
  },
  difficulty: {
    type: 'range',
    label: 'Mines',
    min: 10,
    max: 99,
    fields: ['mines'],
  },
  theme: {
    type: 'radio',
    label: 'Theme',
    options: THEMES,
    fields: ['theme'],
  },
  sound: {
    type: 'checkbox',
    label: 'Sound',
    fields: ['sound'],
    slider: {
      min: 0,
      max: 100,
      fields: ['soundVolume'],
    },
  },
  music: {
    type: 'checkbox',
    label: 'Music',
    fields: ['music'],
    slider: {
      min: 0,
      max: 100,
      fields: ['musicVolume'],
    },
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
  RANGE: 'config__range',
  BUTTONS: 'buttons',
  BUTTON: 'button',
};

export default class Config {
  constructor({ container }) {
    this.container = container;
    this.storage = new Storage();

    this.loadStored();
    this.addEventListeners();

    this.render();
  }

  addEventListeners() {
    const updateConfig = (event) => this.updateConfig(event);
    this.container.addEventListener('change', updateConfig);

    const saveConfig = (event) => this.saveConfig(event);
    window.addEventListener('beforeunload', saveConfig);
  }

  updateConfig(event) {
    const { target } = event;
    const {
      name, value, checked, type,
    } = target;

    const fields = name.split`,`;
    fields.forEach((field) => {
      if (!(field in DEFAULTS)) {
        return;
      }

      let newValue = (+value || value);
      if (type === 'checkbox') {
        newValue = checked;
      }

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
    const currentValue = (fields) => fields.reduce((acc, f) => this[f] || acc, false);

    const radios = ({ name, options, current }) => {
      const list = elt('ul', { className: CssClasses.LIST });

      options.forEach(([value, label], idx) => {
        const checked = value === current ? 'checked' : '';
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

    const checkbox = ({ name, current, label }) => {
      const id = name;
      const checked = current ? 'checked' : '';
      const labelHtml = (label ? `<label for="${id}" class="${CssClasses.CHECKBOX_LABEL}">${label}</label>` : '');

      return elt('div', {
        className: CssClasses.CHECKBOX,
        innerHTML:
          `<input type="checkbox" name="${name}" id="${id}" ${checked}> ${labelHtml}`,
      });
    };

    const range = (slider) => {
      const { fields, min, max } = slider;
      const name = fields.join`,`;
      const current = currentValue(fields);

      const el = elt('input', {
        type: 'range', min, max, value: current, name,
      });
      const updateValue = () => {
        el.dataset.value = el.value;
      };
      el.addEventListener('input', updateValue);
      updateValue();

      return elt('div', { className: CssClasses.RANGE }, el);
    };

    entries(CONFIG).forEach(([id, pref]) => {
      const {
        type, label, options, fields, slider,
      } = pref;
      const name = fields.join`,`;

      const current = currentValue(fields);
      const fieldset = elt('fieldset', { className: CssClasses.FIELD });
      fieldset.classList.add(`${CssClasses.FIELD}-${id}`);

      if (label) {
        fieldset.append(
          elt('legend', null, label),
        );
      }

      if (type === 'radio') {
        fieldset.append(
          radios({ name, options, current }),
        );
      }

      if (type === 'checkbox') {
        fieldset.append(
          checkbox({ name, current }),
        );
      }

      if (type === 'range') {
        fieldset.append(
          range(pref),
        );
      }

      if (slider) {
        fieldset.append(
          range(slider),
        );
      }

      element.append(fieldset);
    });

    const btnOk = Button.button({ id: 'ok', pane: 'game' });
    const buttons = Button.container(btnOk);

    this.container.append(
      element,
      buttons,
    );
  }
}
