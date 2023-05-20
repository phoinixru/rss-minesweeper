const EVENTS = {
  action: 'ms-action',
  config: 'ms-config',
  reset: 'ms-reset',
};

function dispatch(type, options = {}) {
  const event = new CustomEvent(`${type}`, options);
  document.dispatchEvent(event);
}

function action(id, detail = {}) {
  Object.assign(detail, { action: id });
  dispatch(EVENTS.action, { detail });
}

export { dispatch, action, EVENTS };
