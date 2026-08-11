import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNextDiscoverItem } from '../../src/state/discover-pool.mjs';

// Pure lib — every view here is a literal; no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file (same convention as frontier.test.mjs).
function item(id, stage, status, extra = {}) {
  return { id, title: id, kind: 'task', stage, status, deps: [], risk: 'light', refs: [], verify: 'true', ...extra };
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

// --- tsk-1w7 D10: 'discovery'/'exploring' join the clarify-shaped pool ----

test('a stage:discovery item is picked into the clarify-shaped pool, with its own real stage returned', () => {
  const view = { work: { a: item('a', 'discovery', 'todo') } };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'a', stage: 'discovery' });
});

test('a stage:exploring item is picked into the clarify-shaped pool, with its own real stage returned', () => {
  const view = { work: { a: item('a', 'exploring', 'todo') } };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'a', stage: 'exploring' });
});

test('clarify/discovery/exploring items share ONE pool, ordered by blocks like any other clarify-shaped candidate — never three separate buckets', () => {
  const view = {
    work: {
      clarifyItem: item('clarifyItem', 'clarify', 'todo'),
      discoveryItem: item('discoveryItem', 'discovery', 'todo', { deps: [] }),
      exploringItem: item('exploringItem', 'exploring', 'todo'),
      dependent: item('dependent', 'executing', 'todo', { deps: ['discoveryItem'] }),
    },
  };
  // discoveryItem blocks 1 open item (dependent) via rankImpact; the other
  // two block nothing — same "picked into the pool, ordered by blocks"
  // discipline the pre-existing clarify-only tests above already prove,
  // now covering all three clarify-shaped stages at once.
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'discoveryItem', stage: 'discovery' });
});

test('the clarify-shaped pool (clarify/discovery/exploring) still wins over the decompose pool regardless of which of the three stages the candidate is at', () => {
  const view = {
    work: {
      decomposeItem: item('decomposeItem', 'decompose', 'todo', { priority: 1 }),
      exploringItem: item('exploringItem', 'exploring', 'todo'),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'exploringItem', stage: 'exploring' });
});

// --- tsk-2v3: isCandidate() now checks isDepsAndLineageReady -------------

test('an item with an unmet dep is never picked, even as the only candidate', () => {
  const view = {
    work: {
      blocker: item('blocker', 'clarify', 'todo'),
      dependent: item('dependent', 'clarify', 'todo', { deps: ['blocker'] }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'blocker', stage: 'clarify' });
});

test('an item becomes pickable once its dep resolves', () => {
  const view = {
    work: {
      blocker: item('blocker', 'clarify', 'done'),
      dependent: item('dependent', 'clarify', 'todo', { deps: ['blocker'] }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'dependent', stage: 'clarify' });
});

test('an item anchored by an open decomposed child is never picked, even with status:todo and no unmet deps', () => {
  const view = {
    work: {
      // child is stage:executing (not itself a candidate-stage item) so the
      // only thing this test proves is the anchor exclusion on `parent`.
      parent: item('parent', 'decompose', 'todo'),
      child: item('child', 'executing', 'todo', { parent: 'parent' }),
    },
  };
  assert.equal(pickNextDiscoverItem(view), null);
});
