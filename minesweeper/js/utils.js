const qs = (selector, element = document) => element.querySelector(selector);
const qsa = (selector, element = document) => [...element.querySelectorAll(selector)];

function elt(type, props, ...children) {
  const dom = document.createElement(type);
  if (props) {
    Object.assign(dom, props);
  }

  children.forEach((child) => {
    if (typeof child !== 'string') dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  });

  return dom;
}

const { key, values, assign } = Object;

export {
  qs, qsa, elt, key, values, assign,
};
