import PETS from './pets_data.js';

const qs = (selector, element = document) => element.querySelector(selector);
const qsa = (selector, element = document) => [...element.querySelectorAll(selector)];
const { entries, keys } = Object;

function elt(type, props, ...children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}

window.addEventListener('load', initialize);

function initialize() {
  // Burger menu
  Burger.init();

  // Pet cards slider
  PetsSlider.init();

  // Our pets page
  Pets.init();

  // Pet modals
  PetModal.init();
}


// Burger menu
const Burger = {
  init() {
    this.addBurgerMenuHandlers();
    this.addMediaQueryHandlers();
  },

  addBurgerMenuHandlers() {
    qs('#burger-button').addEventListener('click', e => this.toggleBurgerMenu(e));
    qs('.burger-navigation').addEventListener('click', e => this.handleBurgerClicks(e));
  },

  addMediaQueryHandlers() {
    // Switch off burger menu on media query
    const mediaQueryList = window.matchMedia("(max-width: 768px)");

    this.handleWidthChange(mediaQueryList);
    mediaQueryList.addEventListener("change", e => this.handleWidthChange(e));
  },

  handleWidthChange(mql) {
    const { matches } = mql;
    if (!matches) {
      qs('body').classList.toggle('burger-open', false);
    }
  },

  toggleBurgerMenu(event) {
    qs('body').classList.toggle('burger-open');
    event && event.preventDefault();
  },

  handleBurgerClicks({ target }) {
    const isOverlay = target.matches('.burger-navigation');
    const isClickableLink = target.matches('.navigation__link');

    if (isOverlay || isClickableLink) {
      this.toggleBurgerMenu();
    }
  }
}


// Slider
const petIds = keys(PETS);
const shuffle = () => Math.random() - 0.5;
const pickCards = (exclude = [], number = 3) => {
  return petIds
    .filter(id => !exclude.includes(id))
    .sort(shuffle)
    .slice(0, number);
};

const generatePetCard = (id) => {
  const { name, img } = PETS[id];

  return `<a class="pet__link" href="#">
    <div class="pet__photo">
      <img src="${img}" alt="${name}'s photo" width="270" height="270">
    </div>
    <strong class="pet__name">${name}</strong>
    <span class="button button-secondary">Learn more</span>
  </a>`;
};


const PetsSlider = {
  isInTransition: false,

  init() {
    const container = qs('.slider');
    if (!container) {
      return;
    }

    this.container = container;

    this.populateSlider();
    this.addPaginationHandlers();
  },

  populateSlider() {
    qs('.slider__slides', this.container).innerHTML = '';

    let cardIds = [];
    for (let i = 0; i < 3; i++) {
      cardIds = pickCards(cardIds);
      this.renderSlide(i, cardIds);
    }
  },

  renderSlide(slideId, cardIds) {
    let slide = qs(`.slider__slide[data-id="${slideId}"]`, this.container);

    if (!slide) {
      slide = elt('div', { className: 'slider__slide' });
      slide.dataset.id = slideId;
      qs('.slider__slides', this.container).append(slide);
    }

    const sliderCard = (id) => `<li class="pet__card slider__card" data-id="${id}">${generatePetCard(id)}</li>`;

    slide.innerHTML = `<ul class="pets__cards slider__cards">${cardIds.map(sliderCard).join`\n`}</ul>`;
  },

  addPaginationHandlers() {
    const sliderPagination = qs('.slider__pagination', this.container);
    if (!sliderPagination) {
      return;
    }

    sliderPagination.addEventListener('click', e => this.changeSlide(e));

    const transitionend = e => this.updateSlidesAfterTransition(e)
    qs(".slider__slides", this.container).addEventListener("transitionend", transitionend);
  },

  changeSlide(event) {
    event.preventDefault();

    const button = event.target.closest('.slider__nav');
    if (!button || this.isInTransition) {
      return;
    }

    this.isInTransition = true;

    const direction = button.matches('.slider__prev') ? 'prev' : 'next';

    this.container.classList.toggle('show_next', direction === 'next');
    this.container.classList.toggle('show_prev', direction === 'prev');
  },

  updateSlidesAfterTransition(event) {
    const { target } = event;

    if (!target.matches('.slider__slide')) {
      return;
    }

    if (target.dataset.id === '1') {
      // finish transition
      this.container.classList.remove('show_next', 'show_prev');
      this.isInTransition = false;
    } else {
      // update slides
      this.updateSlides(target);
    }
  },

  updateSlides(fromSlide) {
    const fromSlideId = +fromSlide.dataset.id;
    const otherSlideId = fromSlideId == 2 ? 0 : 2;

    const centerSlide = qs(`.slider__slide[data-id="1"]`, this.container);
    const otherSlide = qs(`.slider__slide[data-id="${otherSlideId}"]`, this.container);

    // move cards from center slide
    otherSlide.innerHTML = '';
    otherSlide.append(...centerSlide.children);

    // put cards from new slide in center
    centerSlide.innerHTML = '';
    centerSlide.append(...fromSlide.children);

    const excludeIds = qsa('.slider__card', centerSlide).map(card => card.dataset.id);
    this.renderSlide(fromSlideId, pickCards(excludeIds));
  }
};


// Pets page
const Pets = {
  SIX_CARDS_BP: 628,
  EIGHT_CARDS_BP: 1280,

  ON_DESKTOP: 8,
  ON_TABLET: 6,
  ON_MOBILE: 3,
  TOTAL_CARDS: 48,

  currentPage: 1,
  firstCardIdx: 0,

  init() {
    const container = qs('#pets-container');
    if (!container) {
      return;
    }

    this.container = container;
    this.perPage = this.ON_MOBILE;
    this.pickCards();

    this.addMediaQueryHandlers();
    this.addPaginationHandlers();
    this.renderCards();

    this.updateTotalPages();
    this.updatePagination();
  },

  pickCards(numberOfCards = this.TOTAL_CARDS) {
    const cards = [];
    const pick = [6, 2, 4, 4, 2, 6];
    let exclude = [], i = 0;

    while (cards.length < numberOfCards) {
      const count = pick[i++ % pick.length];
      exclude = pickCards(exclude, count);
      cards.push(...exclude);

      if (cards.length % 24 === 0) {
        exclude = [];
      }
    }

    this.cards = cards;
  },

  addMediaQueryHandlers() {
    // Change number of cards
    const mqTablet = window.matchMedia(`(min-width: ${this.SIX_CARDS_BP}px)`);
    const mqDesktop = window.matchMedia(`(min-width: ${this.EIGHT_CARDS_BP}px)`);

    mqTablet.addEventListener("change", e => this.handleWidthChange(e));
    mqDesktop.addEventListener("change", e => this.handleWidthChange(e));

    if (mqTablet.matches) {
      this.perPage = this.ON_TABLET;
    }

    if (mqDesktop.matches) {
      this.perPage = this.ON_DESKTOP;
    }
  },

  handleWidthChange(mqlEvent) {
    const { media, matches } = mqlEvent;

    this.perPage = media.match(`${this.EIGHT_CARDS_BP}`)
      ? (matches ? this.ON_DESKTOP : this.ON_TABLET)
      : (matches ? this.ON_TABLET : this.ON_MOBILE);

    this.updateTotalPages();
    this.putCardInView(this.firstCardIdx);
    this.updatePagination();
  },

  updateTotalPages() {
    this.totalPages = Math.ceil(this.cards.length / this.perPage);
  },

  renderCards() {
    const { cards, currentPage, perPage, container } = this;

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const ids = cards.slice(start, end);

    qsa('.pet__card', container).forEach((card, id) => {
      const petId = ids[id];

      card.innerHTML = petId ? generatePetCard(petId) : '';
      card.classList.toggle('pet__card--empty', petId === undefined);
      card.dataset.id = petId || -1;

    });

    // Save first visible card for num cards change
    this.firstCardIdx = start;
  },

  putCardInView(cardIdx) {
    const pageWithCard = Math.ceil((cardIdx + 1) / this.perPage);

    this.currentPage = pageWithCard;
    this.renderCards();
  },

  addPaginationHandlers() {
    qs('.pagination', this.container).addEventListener('click', e => this.handlePaginationClick(e))
  },

  handlePaginationClick(event) {
    event.preventDefault();

    const { target: link } = event;
    if (!link.matches('.pagination__link') || link.matches('.pagination__link--disabled')) {
      return;
    }

    this.currentPage = +link.dataset.page;
    this.renderCards();
    this.updatePagination();
  },

  updatePagination() {
    const { currentPage, totalPages, container } = this;

    const relations = {
      first: 1,
      prev: Math.max(1, currentPage - 1),
      current: currentPage,
      next: Math.min(currentPage + 1, totalPages),
      last: totalPages
    };

    const disabled = {
      first: currentPage === 1,
      prev: currentPage === 1,
      next: currentPage >= totalPages,
      last: currentPage >= totalPages
    }

    qsa('.pagination__link', container).forEach(link => {
      const rel = link.dataset.rel;
      const isDisabled = disabled[rel];

      link.dataset.page = relations[rel];
      link.classList.toggle('pagination__link--disabled', isDisabled);
    });

    qs('.pagination__page', container).innerText = currentPage;
  }
}

const petInfo = (id) => {
  const { name, img, type, breed, description, age, inoculations, diseases, parasites } = PETS[id];
  const list = (arr) => arr ? arr.join`, ` : false;
  const field = ([field, value]) => `<li><strong>${field}:</strong> ${value}</li>`;

  const fields = entries({
    'Age': age,
    'Inoculations': list(inoculations),
    'Diseases': list(diseases),
    'Parasites': list(parasites)
  }).filter(([, v]) => v);

  const listInfo = fields.length ? `<ul class="pet-info__list">${fields.map(field).join``}</ul>` : '';

  return `<div class="pet-info">
    <div class="pet-info__photo"><img src="${img}" alt="${name}'s photo"></div>
    <div class="pet-info__text">
      <h3 class="pet-info__name">${name}</h3>
      <h4 class="pet-info__breed">${type} - ${breed}</h4>
      <p class="pet-info__description">${description}</p>
      ${listInfo}
    </div>
  </div>`;
};


// Modal window
const PetModal = {
  init() {
    this.addCardClickHandlers();
  },

  addCardClickHandlers() {
    qs('.pets').addEventListener('click', e => this.handleCardClick(e));
  },

  handleCardClick(event) {
    event.preventDefault();

    const { target } = event;
    const petCard = target.closest('.pet__card');

    if (!petCard) {
      return;
    }

    const petId = +petCard.dataset.id;
    this.show(petId);
  },

  show(petId) {
    if (qs('#modal')) {
      return;
    }

    const content = petInfo(petId);
    this.buildModal(content);
  },

  buildModal(content) {
    const overlay = elt('div', { id: 'modal', className: 'modal' });
    const btnClose = elt('button', {
      className: 'button button-secondary modal__close-button',
      innerHTML: '<i class="icon icon-cross"></i>'
    });

    const popup = elt('div', { className: 'modal__popup' },
      elt('div', { className: 'modal__content', innerHTML: content }),
      btnClose
    );

    overlay.addEventListener('click', e => this.handleClicks(e));

    overlay.append(popup);
    document.body.append(overlay);

    document.body.classList.add('has-modal');
  },

  handleClicks(event) {
    const { target } = event;
    const btnClose = target.closest('.modal__close-button');
    const overlay = target.closest('.modal');

    if (!(target === overlay || btnClose)) {
      return;
    }

    overlay.remove();
    document.body.classList.remove('has-modal');
  }
};