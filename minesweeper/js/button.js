import { elt, assign } from './utils.js';

const CssClasses = {
  BUTTONS: 'buttons',
  BUTTON: 'button',
};

const BUTTONS = {
  save: 'Save',
  cancel: 'Cancel',
  ok: 'Ok',
};

export default class Button {
  static button({ id, pane }) {
    const btn = elt('button', { className: CssClasses.BUTTON }, BUTTONS[id]);
    if (pane) {
      assign(btn.dataset, { pane });
    }

    return btn;
  }

  static container() {
    return elt('div', { className: CssClasses.BUTTONS });
  }
}
