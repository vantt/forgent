import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOwnershipStore,
  resolveRoot,
  claimRoot,
  steerFrontier,
} from '../../src/runner/root-affinity.mjs';

// Pure lib — every view/store here is built in-memory; no fs, no mkdtemp, no
// `.fgos/` writes anywhere in this file.

function view(items) {
  const work = {};
  for (const item of items) work[item.id] = item;
  return { work };
}

// -- resolveRoot -------------------------------------------------------------

test('resolveRoot returns an item\'s own id when it has no parent', () => {
  const v = view([{ id: 'a' }]);
  assert.equal(resolveRoot(v, 'a'), 'a');
});

test('resolveRoot walks a multi-level chain (grandchild -> child -> root) to the top', () => {
  const v = view([
    { id: 'root' },
    { id: 'child', parent: 'root' },
    { id: 'grandchild', parent: 'child' },
  ]);
  assert.equal(resolveRoot(v, 'grandchild'), 'root');
  assert.equal(resolveRoot(v, 'child'), 'root');
  assert.equal(resolveRoot(v, 'root'), 'root');
});

test('resolveRoot stops at a parent id not present in the view (dangling reference)', () => {
  const v = view([{ id: 'child', parent: 'missing-parent' }]);
  assert.equal(resolveRoot(v, 'child'), 'child');
});

test('resolveRoot guards against a cyclic parent chain (defensive backstop)', () => {
  const v = view([
    { id: 'a', parent: 'b' },
    { id: 'b', parent: 'a' },
  ]);
  assert.doesNotThrow(() => resolveRoot(v, 'a'));
});

// -- claimRoot ----------------------------------------------------------------

test('claimRoot on an unowned root (fresh store) returns action claim and does not mutate the store', () => {
  const v = view([{ id: 'root' }]);
  const store = createOwnershipStore();
  const decision = claimRoot(store, v, 'root', 'actor-A');
  assert.deepEqual(decision, { accepted: true, root: 'root', action: 'claim' });
  // Pure decision function: the caller applies the write, not claimRoot itself.
  assert.equal(store.getOwner('root'), null);
});

test('claimRoot on a root already owned by the SAME identity returns noop/accepted', () => {
  const v = view([{ id: 'root' }]);
  const store = createOwnershipStore();
  store.setOwner('root', 'actor-A');
  const decision = claimRoot(store, v, 'root', 'actor-A');
  assert.deepEqual(decision, { accepted: true, root: 'root', action: 'noop' });
});

test('claimRoot on a root owned by a DIFFERENT identity rejects with the real owner (D13 core claim)', () => {
  const v = view([{ id: 'root' }]);
  const store = createOwnershipStore();
  store.setOwner('root', 'actor-A');
  const decision = claimRoot(store, v, 'root', 'actor-B');
  assert.deepEqual(decision, {
    accepted: false,
    root: 'root',
    action: 'reject',
    currentOwner: 'actor-A',
  });
});

test('claimRoot resolves ownership through the parent chain (leaf claim affects the whole tree)', () => {
  const v = view([{ id: 'root' }, { id: 'leaf', parent: 'root' }]);
  const store = createOwnershipStore();
  store.setOwner('root', 'actor-A');
  const decision = claimRoot(store, v, 'leaf', 'actor-B');
  assert.equal(decision.accepted, false);
  assert.equal(decision.root, 'root');
  assert.equal(decision.currentOwner, 'actor-A');
});

// -- steerFrontier --------------------------------------------------------------

test('steerFrontier keeps items whose root is unowned or owned-by-me, drops others', () => {
  const v = view([
    { id: 'root-a' },
    { id: 'leaf-a', parent: 'root-a' },
    { id: 'root-b' },
    { id: 'leaf-b', parent: 'root-b' },
    { id: 'root-c' },
    { id: 'leaf-c', parent: 'root-c' },
  ]);
  const store = createOwnershipStore();
  store.setOwner('root-a', 'actor-me');
  store.setOwner('root-b', 'actor-other');
  // root-c stays unowned.

  const ready = [{ id: 'leaf-a' }, { id: 'leaf-b' }, { id: 'leaf-c' }, { id: 'root-c' }];
  const steered = steerFrontier(ready, v, store, 'actor-me');

  assert.deepEqual(
    steered.map((item) => item.id),
    ['leaf-a', 'leaf-c', 'root-c'],
  );
});

test('steerFrontier never mutates the store', () => {
  const v = view([{ id: 'root' }]);
  const store = createOwnershipStore();
  steerFrontier([{ id: 'root' }], v, store, 'actor-me');
  assert.equal(store.getOwner('root'), null);
});

test('steerFrontier is a full no-op on parent-less data with an empty store (backward-compat)', () => {
  const v = view([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  const store = createOwnershipStore();
  const ready = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const steered = steerFrontier(ready, v, store, 'actor-me');
  assert.deepEqual(
    steered.map((item) => item.id),
    ['a', 'b', 'c'],
  );
});
