import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNextPlanItem } from '../../src/state/plan-pool.mjs';

// Pure lib — every view here is a literal; no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file (same convention as discover-pool.test.mjs).
function item(id, stage, status, extra = {}) {
  return { id, title: id, kind: 'task', stage, status, deps: [], risk: 'light', refs: [], verify: 'true', ...extra };
}

test('pickNextPlanItem on an empty view returns null', () => {
  assert.equal(pickNextPlanItem({ work: {} }), null);
});

test('pickNextPlanItem on a view with no work key returns null', () => {
  assert.equal(pickNextPlanItem({}), null);
});

test('a stage:clarify item is never picked here, even as the only candidate', () => {
  const view = { work: { a: item('a', 'clarify', 'todo') } };
  assert.equal(pickNextPlanItem(view), null);
});

test('planning pool orders by priority ASCENDING (lower value = higher priority)', () => {
  const view = {
    work: {
      a: item('a', 'planning', 'todo', { priority: 5 }),
      b: item('b', 'planning', 'todo', { priority: 1 }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'b', stage: 'planning' });
});

test('planning pool: an item WITH a priority sorts before one with no priority at all', () => {
  const view = {
    work: {
      a: item('a', 'planning', 'todo'),
      b: item('b', 'planning', 'todo', { priority: 99 }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'b', stage: 'planning' });
});

test('planning pool ties (both absent priority): FIFO (declaration order) wins', () => {
  const view = {
    work: {
      first: item('first', 'planning', 'todo'),
      second: item('second', 'planning', 'todo'),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'first', stage: 'planning' });
});

// tsk-403 D18: `decompose` survives as a legacy, drain-only alias for
// items that reached it before the plan-family rename — this pool must
// stay blind neither to those nor to new `planning`-stage items.
test('a stage:decompose item (legacy alias) is picked with its own real stage returned', () => {
  const view = { work: { a: item('a', 'decompose', 'todo') } };
  assert.deepEqual(pickNextPlanItem(view), { id: 'a', stage: 'decompose' });
});

test('decompose (legacy) and planning (current) items share ONE pool, ordered by priority together', () => {
  const view = {
    work: {
      legacyItem: item('legacyItem', 'decompose', 'todo', { priority: 5 }),
      currentItem: item('currentItem', 'planning', 'todo', { priority: 1 }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'currentItem', stage: 'planning' });
});

test('an item with an unmet dep is never picked, even as the only candidate', () => {
  const view = {
    work: {
      blocker: item('blocker', 'planning', 'todo'),
      dependent: item('dependent', 'planning', 'todo', { deps: ['blocker'] }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'blocker', stage: 'planning' });
});

test('an item anchored by an open decomposed child is never picked, even with status:todo and no unmet deps', () => {
  const view = {
    work: {
      // child is stage:executing (not itself a candidate-stage item) so
      // the only thing this test proves is the anchor exclusion on
      // `parent`.
      parent: item('parent', 'planning', 'todo'),
      child: item('child', 'executing', 'todo', { parent: 'parent' }),
    },
  };
  assert.equal(pickNextPlanItem(view), null);
});
