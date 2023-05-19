import { entries, keys } from './utils.js';
import { EVENTS } from './events.js';

const SOUNDS = {
  open: 'open.wav',
  'flag-on': 'flag.wav',
  'flag-off': 'flag.wav',
  loose: 'loose.wav',
  win: 'win.wav',
  kode: 'win.wav',
};

const MUSIC = 'music.wav';

export default class Sounds {
  #path = './assets/sounds/{theme}/';

  #effects = {};

  #music = null;

  #config;

  constructor({ config }) {
    this.#config = config;

    this.addEventListeners();
    this.loadAssets();
  }

  addEventListeners() {
    const updateConfig = (event) => this.updateConfig(event);
    document.addEventListener(EVENTS.config, updateConfig);

    const playSound = (event) => {
      const { detail: { action } } = event;
      if (action in this.#effects) {
        this.play(action);
      }
    };
    document.addEventListener(EVENTS.action, playSound);
  }

  updateConfig(event) {
    const { detail: { field, value } } = event;

    if (field === 'sound' && value === true) {
      this.loadSounds();
    }

    if (field === 'music') {
      if (value) {
        this.loadMusic();
      } else {
        this.#music.pause();
      }
    }

    if (field.match('Volume')) {
      this.setVolume();
    }

    if (field === 'soundVolume') {
      this.play('open');
    }
  }

  loadAssets() {
    const { sound, music } = this.#config;

    if (sound) {
      this.loadSounds();
    }

    if (music) {
      this.loadMusic();
    }
  }

  loadSounds() {
    const sounds = entries(SOUNDS);

    if (this.#config.sound) {
      sounds.forEach(([id, filename]) => {
        this.#effects[id] = this.loadAudio({ filename });
      });
    }
    this.setVolume();
  }

  loadMusic() {
    this.#music = this.loadAudio({ filename: MUSIC, loop: true, autoplay: true });
    this.setVolume();
  }

  loadAudio({ filename, autoplay = false, loop = false }) {
    const url = this.getFileUrl(filename);
    const audio = new Audio();
    audio.preload = 'auto';
    audio.autoplay = autoplay;
    audio.loop = loop;

    audio.addEventListener('error', () => {
      if (audio.src.match('default')) {
        return;
      }

      const defaultUrl = this.getFileUrl(filename, 'default');
      audio.src = defaultUrl;
    });

    audio.src = url;

    return audio;
  }

  play(id) {
    const { sound } = this.#config;
    if (!sound) {
      return;
    }

    const audio = this.#effects[id];
    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.play();
    } else {
      audio.currentTime = 0;
    }
  }

  getFileUrl(filename, theme) {
    const { theme: configTheme } = this.#config;

    return this.#path.replace('{theme}', theme || configTheme) + filename;
  }

  setVolume() {
    const { musicVolume, soundVolume } = this.#config;
    const effects = keys(this.#effects);

    if (effects.length) {
      effects.forEach((id) => {
        this.#effects[id].volume = soundVolume / 100;
      });
    }

    if (this.#music) {
      this.#music.volume = musicVolume / 100;
    }
  }
}
