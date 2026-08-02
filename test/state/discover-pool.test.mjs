import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNextDiscoverItem } from '../../src/state/discover-pool.mjs';

// Pure lib — every view here is a literal; no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file (same convention as frontier.test.mjs).
function item(id, stage, status, extra = {}) {
  return { id, title: id, kind: 'task', stage, status, deps: [], risk: 'low', refs: [], verify: 'true', ...extra };
}

test('pickNextDiscoverItem on an empty view returns null', () => {
  assert.equal(pickNextDiscoverItem({ work: {} }), null);
});

test('pickNextDiscoverItem on a view with no work key returns null', () => {
  assert.equal(pickNextDiscoverItem({}), null);
});

test('a stage:executing item is never picked, even if status:todo', () => {
  const view = { work: { a: item('a', 'executing', 'todo') } };
  assert.equal(pickNextDiscoverItem(view), null);
});

test('a stage:clarify item with status:doing (already claimed) is never picked', () => {
  const view = { work: { a: item('a', 'clarify', 'doing') } };
  assert.equal(pickNextDiscoverItem(view), null);
});

test('a single stage:clarify candidate is picked over stage:decompose ones', () => {
  const view = {
    work: {
      a: item('a', 'decompose', 'todo', { priority: 1 }),
      b: item('b', 'clarify', 'todo'),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'b', stage: 'clarify' });
});

test('clarify pool orders by blocks DESCENDING (item blocking more open work wins)', () => {
  const view = {
    work: {
      base: item('base', 'clarify', 'todo'),
      blocker: item('blocker', 'clarify', 'todo', { deps: [] }),
      dependent: item('dependent', 'executing', 'todo', { deps: ['blocker'] }),
    },
  };
  // `dependent` (status:todo, stage:executing) is not itself a candidate,
  // but it makes `blocker` block 1 open item via rankImpact -- `base`
  // blocks nothing.
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'blocker', stage: 'clarify' });
});

test('clarify pool ties on blocks: urgent item wins', () => {
  const view = {
    work: {
      a: item('a', 'clarify', 'todo'),
      b: item('b', 'clarify', 'todo', { urgent: true }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'b', stage: 'clarify' });
});

test('clarify pool ties on blocks and urgent: FIFO (declaration order) wins', () => {
  const view = {
    work: {
      first: item('first', 'clarify', 'todo'),
      second: item('second', 'clarify', 'todo'),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'first', stage: 'clarify' });
});

test('decompose pool orders by priority ASCENDING (lower value = higher priority)', () => {
  const view = {
    work: {
      a: item('a', 'decompose', 'todo', { priority: 5 }),
      b: item('b', 'decompose', 'todo', { priority: 1 }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'b', stage: 'decompose' });
});

test('decompose pool: an item WITH a priority sorts before one with no priority at all', () => {
  const view = {
    work: {
      a: item('a', 'decompose', 'todo'),
      b: item('b', 'decompose', 'todo', { priority: 99 }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'b', stage: 'decompose' });
});

test('decompose pool ties (both absent priority): FIFO (declaration order) wins', () => {
  const view = {
    work: {
      first: item('first', 'decompose', 'todo'),
      second: item('second', 'decompose', 'todo'),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'first', stage: 'decompose' });
});
