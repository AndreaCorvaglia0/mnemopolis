// Two ways to play (engine/src/systems/mode.js): which one runs, and when the choice is offered.
import test from 'node:test';
import assert from 'node:assert/strict';
import { modeOf, setMode } from '../src/systems/mode.js';

test('the story runs by default and the choice is offered until one is saved', () => {
  assert.deepEqual(modeOf({ world: {} }), { mode: 'story', chosen: false, offered: true });
  assert.deepEqual(modeOf({ world: {}, saved: 'free' }), { mode: 'free', chosen: true, offered: true });
  assert.deepEqual(modeOf({ world: {}, saved: 'story' }), { mode: 'story', chosen: true, offered: true });
  assert.equal(modeOf({ world: {}, saved: 'nonsense' }).chosen, false);
});
test('the address wins over the saved choice', () => {
  assert.equal(modeOf({ world: {}, saved: 'story', query: '?mode=free' }).mode, 'free');
  assert.equal(modeOf({ world: {}, saved: 'free', query: '?mode=story&x=1' }).mode, 'story');
});
test('a course can fix the way: no choice is offered and a saved choice is ignored', () => {
  assert.deepEqual(modeOf({ world: { mode: 'free' }, saved: 'story' }), { mode: 'free', chosen: true, offered: false });
});
test('a course with no story keeps its plain game, with nothing to choose, unless it asks for free study', () => {
  assert.deepEqual(modeOf({ world: { story: false }, saved: 'free' }), { mode: 'story', chosen: true, offered: false });
  assert.equal(modeOf({ world: { story: false, mode: 'free' } }).mode, 'free');
});
test('choosing the way already running saves it and does not reload', () => {
  let saved = null, reloads = 0;
  assert.equal(setMode('story', { current: 'story', save: (m) => { saved = m; return true; }, reload: () => reloads++ }), false);
  assert.equal(saved, 'story'); assert.equal(reloads, 0);
  assert.equal(setMode('free', { current: 'story', save: (m) => { saved = m; return true; }, reload: () => reloads++ }), true);
  assert.equal(saved, 'free'); assert.equal(reloads, 1);
  assert.equal(setMode('other', { current: 'story', save: () => true, reload: () => reloads++ }), false);
});
