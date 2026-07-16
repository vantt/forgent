import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frontier } from '../../src/state/frontier.mjs';

// Pure lib — every view here is a literal or built via foldEvents in
// replay.test.mjs's style; no fs, no mkdtemp, no `.fgos/` writes anywhere in
// this file.
function item(id, status, deps = []) {
  return { id, title: id, kind: 'task', status, deps, risk: 'low', refs: [], verify: 'true' };
}

test('frontier on an empty view is empty', () => {
  assert.deepEqual(frontier({ work: {} }), []);
});

test('frontier on an empty view (missing work key) is empty', () => {
  assert.deepEqual(frontier({}), []);
});

test('an item with no deps is always in the frontier when todo', () => {
  const view = { work: { a: item('a', 'todo') } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('an item is excluded from the frontier when its dep is only "proposed" (per D5)', () => {
  const view = {
    work: {
      base: item('base', 'proposed'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view), []);
});

test('an item is included once its dep reaches "done"', () => {
  const view = {
    work: {
      base: item('base', 'done'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['dependent']);
});

test('multi-tier deps (A depends on B depends on C): only fully-done chains open', () => {
  // A <- B <- C : A is ready only once both B and C are done.
  const view = {
    work: {
      c: item('c', 'done'),
      b: item('b', 'done', ['c']),
      a: item('a', 'todo', ['b']),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('multi-tier deps: a mid-chain dep stuck at doing blocks the whole chain', () => {
  const view = {
    work: {
      c: item('c', 'done'),
      b: item('b', 'doing', ['c']),
      a: item('a', 'todo', ['b']),
    },
  };
  assert.deepEqual(frontier(view), []);
});

for (const status of ['blocked', 'doing', 'proposed', 'done']) {
  test(`an item itself at status "${status}" (not todo) is excluded from the frontier`, () => {
    const view = { work: { a: item('a', status) } };
    assert.deepEqual(frontier(view), []);
  });
}

test('frontier follows FIFO seq/declaration order, not lexical id order (add-order test uses zeta before alpha)', () => {
  // Declaration order is deliberately non-lexical: "zeta" is added before
  // "alpha". If frontier ever sorted by id (alpha < zeta), this would flip
  // and the test would catch it — a plain lexical add order could not tell
  // insertion-order iteration apart from an accidental id sort.
  const view = {
    work: {
      zeta: item('zeta', 'todo'),
      alpha: item('alpha', 'todo'),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'alpha']);
});

test('FIFO order survives status moves on unrelated items (moving does not reorder view.work keys)', () => {
  const view = {
    work: {
      zeta: item('zeta', 'todo'),
      middle: item('middle', 'doing'), // moved away from todo, still occupies its original slot
      alpha: item('alpha', 'todo'),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'alpha']);
  // Now "middle" becomes ready too (per D5, done unblocks) without changing
  // the relative order of the other two.
  view.work.middle.status = 'todo';
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'middle', 'alpha']);
});

test('an item with an empty deps array is ready when todo', () => {
  const view = { work: { a: item('a', 'todo', []) } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('a dangling dep id (defensive guard: dep not present in view) never crashes and never unlocks', () => {
  const view = { work: { a: item('a', 'todo', ['ghost']) } };
  assert.doesNotThrow(() => frontier(view));
  assert.deepEqual(frontier(view), []);
});

test('frontier does not mutate the view it is given', () => {
  const view = { work: { a: item('a', 'todo'), b: item('b', 'done') } };
  const before = JSON.parse(JSON.stringify(view));
  frontier(view);
  assert.deepEqual(view, before);
});

// --- D6 lock: `awaiting-human` never opens into the ready set (async-human-gate-3) ---

test('LOCK (per D6): an item at status "awaiting-human" is never in the frontier', () => {
  const view = { work: { a: item('a', 'awaiting-human') } };
  assert.deepEqual(frontier(view), []);
});

test('LOCK (per D6): a todo item whose dep is "awaiting-human" is NOT ready (an awaiting dep does not unblock, mirrors the proposed-dep case)', () => {
  const view = {
    work: {
      base: item('base', 'awaiting-human'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view), []);
});

// --- stage-clarify D1: an item at stage "clarify" is never in the frontier ---

test('LOCK (per stage-clarify D1): a todo item with no dep-blockers but stage "clarify" is excluded from the frontier', () => {
  const view = { work: { a: { ...item('a', 'todo'), stage: 'clarify' } } };
  assert.deepEqual(frontier(view), []);
});

test('an item with stage "executing" (explicit) and status todo is ready, same as no stage at all', () => {
  const view = { work: { a: { ...item('a', 'todo'), stage: 'executing' } } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('an item with no stage field at all defaults to "executing" (per D8 lazy default) and is ready', () => {
  const view = { work: { a: item('a', 'todo') } };
  assert.equal('stage' in view.work.a, false);
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('a todo item at stage "clarify" whose deps are all done is still excluded (stage gates independently of deps)', () => {
  const view = {
    work: {
      base: item('base', 'done'),
      dependent: { ...item('dependent', 'todo', ['base']), stage: 'clarify' },
    },
  };
  assert.deepEqual(frontier(view), []);
});

// --- stage-decompose D4/D5: lineage-derived frontier filter (root blocked
// by open descendants, never by `deps`) ---

test('LOCK (per stage-decompose D4): a root item with an open (not-done) child is excluded from the frontier even though it has no deps of its own — the child itself is still dispatchable', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: { ...item('child', 'todo'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['child']);
});

test('a root item is included once every child reaches "done" (per stage-decompose D4)', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: { ...item('child', 'done'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['root']);
});

test('a root with two children is blocked while either one is still open, then released once both are done', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      childA: { ...item('childA', 'done'), parent: 'root' },
      childB: { ...item('childB', 'doing'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view), []);
  view.work.childB.status = 'done';
  assert.deepEqual(frontier(view).map((i) => i.id), ['root']);
});

test('the lineage filter walks multiple generations: an open grandchild still blocks the root even though the direct child is already done', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: { ...item('child', 'done'), parent: 'root' },
      grandchild: { ...item('grandchild', 'todo'), parent: 'child' },
    },
  };
  // root: blocked by the still-open grandchild; child: done, excluded by
  // status; grandchild: itself dispatchable.
  assert.deepEqual(frontier(view).map((i) => i.id), ['grandchild']);
});

test('the lineage filter never touches deps: a root blocked by an open child is still excluded even if its own deps are all done, and children are never required in deps', () => {
  const view = {
    work: {
      unrelated: item('unrelated', 'done'),
      root: item('root', 'todo', ['unrelated']),
      child: { ...item('child', 'todo'), parent: 'root' },
    },
  };
  assert.equal(view.work.root.deps.includes('child'), false);
  // root is blocked purely by lineage (its own deps are satisfied); child
  // remains independently dispatchable.
  assert.deepEqual(frontier(view).map((i) => i.id), ['child']);
});

test('EXPLICIT (must_have): frontier on a view with no "parent" field anywhere is deep-equal to the same view evaluated before the lineage filter existed', () => {
  const view = {
    work: {
      base: item('base', 'done'),
      dependent: item('dependent', 'todo', ['base']),
      standalone: item('standalone', 'todo'),
    },
  };
  // No item carries `parent` — the lineage filter must be a complete no-op,
  // producing exactly the pre-existing deps+status+stage result.
  assert.deepEqual(frontier(view).map((i) => i.id), ['dependent', 'standalone']);
});

test('a dangling parent id (child points at a parent not present in the view) never crashes and never blocks anything', () => {
  const view = {
    work: {
      child: { ...item('child', 'todo'), parent: 'ghost-root' },
    },
  };
  assert.doesNotThrow(() => frontier(view));
  assert.deepEqual(frontier(view).map((i) => i.id), ['child']);
});
