/**
 * Frontend entry point.
 */

import './styles/main.css';

import { App } from './app';

const root = document.querySelector<HTMLElement>('#app');

if (root === null) {
  throw new Error('Missing #app mount point');
}

// Respect the OS high contrast preference, per the accessibility notes in
// docs/UI_Design_System.md.
if (window.matchMedia('(prefers-contrast: more)').matches) {
  document.body.classList.add('high-contrast');
}

new App(root).start();
