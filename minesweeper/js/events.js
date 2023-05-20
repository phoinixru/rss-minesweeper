const EVENTS = {
  action: 'ms-action',
  config: 'ms-config',
  reset: 'ms-reset',
};

function dispatch(type, options = {}) {
  const event = new CustomEvent(`${type}`, options);
  document.dispatchEvent(event);
}

function action(id) {
  dispatch(EVENTS.action, { detail: { action: id } });
}

export { dispatch, action, EVENTS };
