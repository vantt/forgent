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

test('a discoverable-stage item with status:doing (already claimed) is never picked', () => {
  const view = { work: { a: item('a', 'discovery', 'doing') } };
  assert.equal(pickNextDiscoverItem(view), null);
});

// tsk-lya D10/D11: `decompose`/`planning` items are no longer candidates
// for this pool at all — `plan-pool.mjs`'s `pickNextPlanItem` covers that
// pool now (see plan-pool.test.mjs). This pool ignores them entirely.
test('a stage:decompose item is never picked here, even as the only candidate', () => {
  const view = { work: { a: item('a', 'decompose', 'todo', { priority: 1 }) } };
  assert.equal(pickNextDiscoverItem(view), null);
});

test('a single discoverable-stage candidate is picked regardless of a stage:decompose item present', () => {
  const view = {
    work: {
      a: item('a', 'decompose', 'todo', { priority: 1 }),
      b: item('b', 'discovery', 'todo'),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'b', stage: 'discovery' });
});

test('clarify pool orders by blocks DESCENDING (item blocking more open work wins)', () => {
  const view = {
    work: {
      base: item('base', 'discovery', 'todo'),
      blocker: item('blocker', 'discovery', 'todo', { deps: [] }),
      dependent: item('dependent', 'executing', 'todo', { deps: ['blocker'] }),
    },
  };
  // `dependent` (status:todo, stage:executing) is not itself a candidate,
  // but it makes `blocker` block 1 open item via rankImpact -- `base`
  // blocks nothing.
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'blocker', stage: 'discovery' });
});

test('clarify pool ties on blocks: urgent item wins', () => {
  const view = {
    work: {
      a: item('a', 'discovery', 'todo'),
      b: item('b', 'discovery', 'todo', { urgent: true }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'b', stage: 'discovery' });
});

test('clarify pool ties on blocks and urgent: FIFO (declaration order) wins', () => {
  const view = {
    work: {
      first: item('first', 'discovery', 'todo'),
      second: item('second', 'discovery', 'todo'),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'first', stage: 'discovery' });
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

test('a stage:exploring candidate is picked regardless of a stage:decompose item present', () => {
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
      blocker: item('blocker', 'discovery', 'todo'),
      dependent: item('dependent', 'discovery', 'todo', { deps: ['blocker'] }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'blocker', stage: 'discovery' });
});

test('an item becomes pickable once its dep resolves', () => {
  const view = {
    work: {
      blocker: item('blocker', 'discovery', 'done'),
      dependent: item('dependent', 'discovery', 'todo', { deps: ['blocker'] }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'dependent', stage: 'discovery' });
});

// --- tsk-64h: candidate stages derive from the domain, not a literal copy -

test('a stage:clarify item is never picked — the coding domain retired that stage entirely, so the discover verb would refuse it', () => {
  const view = { work: { a: item('a', 'clarify', 'todo') } };
  assert.equal(pickNextDiscoverItem(view), null);
});

test("a triage-domain item at that domain's OWN Clarify-mapped stage is picked, even though no coding stage carries that name", () => {
  const view = { work: { a: item('a', 'triage', 'todo', { domain: 'triage' }) } };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'a', stage: 'triage' });
});

test("a coding-domain item parked at another domain's stage name is never picked", () => {
  const view = { work: { a: item('a', 'triage', 'todo') } };
  assert.equal(pickNextDiscoverItem(view), null);
});

test('two domains in one view resolve their candidate stages independently, per item', () => {
  const view = {
    work: {
      codingItem: item('codingItem', 'triage', 'todo'),
      triageItem: item('triageItem', 'triage', 'todo', { domain: 'triage' }),
    },
  };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'triageItem', stage: 'triage' });
});

// work-item-backlog-status Piece 3 (tsk-1av): `backlog` means "an idea,
// not yet committed to work" — clarifying such an idea is exactly what
// should still be allowed, so this pool accepts it alongside `todo`.
test('a stage:exploring item with status:backlog IS a candidate', () => {
  const view = { work: { a: item('a', 'exploring', 'backlog') } };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'a', stage: 'exploring' });
});

test('a stage:discovery item with status:backlog IS a candidate', () => {
  const view = { work: { a: item('a', 'discovery', 'backlog') } };
  assert.deepEqual(pickNextDiscoverItem(view), { id: 'a', stage: 'discovery' });
});

// The widening is scoped to clarify-shaped stages only. `planning` (and
// its legacy `decompose` alias) belong to plan-pool.mjs, which keeps the
// strict todo-only check — a backlog item must never leak into the pool
// that feeds real dispatch, whichever side of the split it is read from.
test('a stage:planning item with status:backlog is NOT a candidate here', () => {
  const view = { work: { a: item('a', 'planning', 'backlog', { priority: 1 }) } };
  assert.equal(pickNextDiscoverItem(view), null);
});

test('a stage:decompose item with status:backlog is NOT a candidate here', () => {
  const view = { work: { a: item('a', 'decompose', 'backlog', { priority: 1 }) } };
  assert.equal(pickNextDiscoverItem(view), null);
});

// Regression guard for the widening: only `todo`/`backlog` were opened up,
// every other status stays excluded exactly as before.
test('a discoverable-stage item at a status other than todo/backlog is still never picked', () => {
  for (const status of ['doing', 'blocked', 'awaiting-human', 'awaiting-approval', 'delivered', 'done', 'wontfix']) {
    const view = { work: { a: item('a', 'exploring', status) } };
    assert.equal(pickNextDiscoverItem(view), null, `status:${status} must not be a candidate`);
  }
});

test('an item anchored by an open decomposed child is never picked, even with status:todo and no unmet deps', () => {
  const view = {
    work: {
      // child is stage:executing (not itself a candidate-stage item) so the
      // only thing this test proves is the anchor exclusion on `parent`.
      // `parent` is stage:discovery (a real clarify-shaped candidate stage
      // in THIS pool, tsk-lya D10/D11 narrowing) so the anchor exclusion is
      // genuinely what stops it from being picked, not stage filtering.
      parent: item('parent', 'discovery', 'todo'),
      child: item('child', 'executing', 'todo', { parent: 'parent' }),
    },
  };
  assert.equal(pickNextDiscoverItem(view), null);
});
