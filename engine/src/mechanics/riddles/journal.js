// Opened locks on the discoveries page (secrets/journal.js calls lockSection once). Only what was
// opened is listed: a lock never found is not named anywhere (DESIGN.md: extras are never listed).
//   openedLocks(st)    the entries, as data (also for the "Mysteries" tab of the menu)
//   lockSection()      a heading and one card per opened lock, or nothing
import { h } from '../../lab/shell.js';
import { state } from '../../systems/state.js';
import { tr } from '../config.js';
import { LOCK_WORDS as W } from './kinds.js';
import { openedLocks as opened, RIDDLES, LANG } from './data.js';

export const openedLocks = (st = state) => opened(st);

export function lockSection() {
  if (!RIDDLES.length) return null;
  const list = openedLocks();
  if (!list.length) return null;
  return h('div', { class: 'jr-locks' },
    h('h2', { style: 'font-size:18px;color:#ffcf5a;margin:22px 0 10px' }, tr(W.journal, LANG)),
    h('div', { class: 'jr-grid' }, list.map((e) => h('div', { class: 'jr-c' }, h('div', {},
      h('h3', {}, `${tr(e.title, LANG)} · ${e.house}`),
      e.note ? h('p', { style: 'color:#e6dcc0' }, e.note) : null,
      ...e.stations.map((s) => h('p', {}, `★ ${s.tab}`)),
      ...e.links.map((f) => h('p', {}, h('a', { href: f.url, target: '_blank', rel: 'noopener', style: 'color:#4fd1c5' }, `${f.title} ↗`))))))));
}
