import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectNewAwaitingHuman, formatStatusLine } from '../../scripts/herdr-cockpit-notify.mjs';

function item(id, status, overrides = {}) {
  return { id, status, title: `Title ${id}`, ...overrides };
}

// --- detectNewAwaitingHuman: dedup, re-entry, multi-item -----------------

test('an item newly at awaiting-human with an empty previously-seen set is returned in newlyAwaiting', () => {
  const items = [item('a', 'awaiting-human')];
  const { newlyAwaiting, currentAwaitingHumanIds } = detectNewAwaitingHuman(new Set(), items);
  assert.deepEqual(newlyAwaiting, ['a']);
  assert.deepEqual([...currentAwaitingHumanIds], ['a']);
});

test('an item already in previously-seen and still awaiting-human is not re-fired, but stays in currentAwaitingHumanIds', () => {
  const items = [item('a', 'awaiting-human')];
  const { newlyAwaiting, currentAwaitingHumanIds } = detectNewAwaitingHuman(new Set(['a']), items);
  assert.deepEqual(newlyAwaiting, []);
  assert.deepEqual([...currentAwaitingHumanIds], ['a']);
});

test('an item that leaves awaiting-human and later re-enters notifies again (seen-set is "currently awaiting", not "ever seen")', () => {
  // Cycle 1: item enters awaiting-human.
  const cycle1 = detectNewAwaitingHuman(new Set(), [item('a', 'awaiting-human')]);
  assert.deepEqual(cycle1.newlyAwaiting, ['a']);

  // Cycle 2: item resumed to todo — seen-set becomes empty.
  const cycle2 = detectNewAwaitingHuman(cycle1.currentAwaitingHumanIds, [item('a', 'todo')]);
  assert.deepEqual(cycle2.newlyAwaiting, []);
  assert.deepEqual([...cycle2.currentAwaitingHumanIds], []);

  // Cycle 3: item re-enters awaiting-human — must notify again.
  const cycle3 = detectNewAwaitingHuman(cycle2.currentAwaitingHumanIds, [item('a', 'awaiting-human')]);
  assert.deepEqual(cycle3.newlyAwaiting, ['a']);
});

test('multiple simultaneous new awaiting-human items are all returned', () => {
  const items = [item('a', 'awaiting-human'), item('b', 'awaiting-human'), item('c', 'doing')];
  const { newlyAwaiting } = detectNewAwaitingHuman(new Set(), items);
  assert.deepEqual(newlyAwaiting.sort(), ['a', 'b']);
});

test('zero awaiting-human items returns empty newlyAwaiting and empty currentAwaitingHumanIds', () => {
  const items = [item('a', 'todo'), item('b', 'done')];
  const { newlyAwaiting, currentAwaitingHumanIds } = detectNewAwaitingHuman(new Set(), items);
  assert.deepEqual(newlyAwaiting, []);
  assert.equal(currentAwaitingHumanIds.size, 0);
});

test('detectNewAwaitingHuman accepts a plain array for previouslySeenIds, not only a Set', () => {
  const items = [item('a', 'awaiting-human')];
  const { newlyAwaiting } = detectNewAwaitingHuman(['a'], items);
  assert.deepEqual(newlyAwaiting, []);
});

// --- formatStatusLine: compact per-status counts --------------------------

test('formatStatusLine counts each status correctly from a mixed array', () => {
  const items = [item('a', 'ready'), item('b', 'ready'), item('c', 'doing'), item('d', 'awaiting-human')];
  const line = formatStatusLine(items);
  assert.match(line, /ready=2/);
  assert.match(line, /doing=1/);
  assert.match(line, /awaiting-human=1/);
});

test('formatStatusLine omits a status with zero items', () => {
  const items = [item('a', 'ready')];
  const line = formatStatusLine(items);
  assert.doesNotMatch(line, /done=/);
  assert.doesNotMatch(line, /awaiting-human=/);
});

test('formatStatusLine on an empty items array does not throw and still includes a timestamp prefix', () => {
  const line = formatStatusLine([]);
  assert.match(line, /^\[.+\]/);
  assert.match(line, /no items/);
});
