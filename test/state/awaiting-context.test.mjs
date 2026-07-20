// test/state/awaiting-context.test.mjs — computeAwaitingContext (str61
// D1/D2/D3): a pure function of a folded `view`, so every branch is tested
// against a literal view object — no fs, no store round-trip needed (same
// style as frontier.mjs's own test file, which this module mirrors).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAwaitingContext } from '../../src/state/awaiting-context.mjs';

function baseView(overrides = {}) {
  return {
    work: {
      'goal-x': { id: 'goal-x', title: 'Ship the launch', status: 'doing' },
      'item-x': { id: 'item-x', title: 'Write the copy', status: 'awaiting-human', parent: 'goal-x' },
    },
    gates: {},
    ...overrides,
  };
}

test('no item -> null', () => {
  const view = baseView();
  assert.equal(computeAwaitingContext(view, 'missing-id'), null);
});

test('item not awaiting-human -> null', () => {
  const view = baseView({
    work: {
      'goal-x': { id: 'goal-x', title: 'Ship the launch', status: 'doing' },
      'item-x': { id: 'item-x', title: 'Write the copy', status: 'todo', parent: 'goal-x' },
    },
  });
  assert.equal(computeAwaitingContext(view, 'item-x'), null);
});

test('awaiting-human item with no parent -> null', () => {
  const view = baseView({
    work: {
      'item-x': { id: 'item-x', title: 'Write the copy', status: 'awaiting-human' },
    },
  });
  assert.equal(computeAwaitingContext(view, 'item-x'), null);
});

test('awaiting-human item whose parent id is dangling -> null (degrades like other dangling refs)', () => {
  const view = baseView({
    work: {
      'item-x': { id: 'item-x', title: 'Write the copy', status: 'awaiting-human', parent: 'ghost-parent' },
    },
  });
  assert.equal(computeAwaitingContext(view, 'item-x'), null);
});

test('parent resolves, no snapshot recorded -> parent only, no changedSinceAsk key', () => {
  const view = baseView();
  const ctx = computeAwaitingContext(view, 'item-x');
  assert.deepEqual(ctx, { parent: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } });
  assert.ok(!('changedSinceAsk' in ctx));
});

test('snapshot recorded, parent unchanged -> parent only, no changedSinceAsk key', () => {
  const view = baseView({
    gates: { 'item-x': { parentSnapshotAtAsk: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } } },
  });
  const ctx = computeAwaitingContext(view, 'item-x');
  assert.deepEqual(ctx, { parent: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } });
  assert.ok(!('changedSinceAsk' in ctx));
});

test('snapshot recorded, parent title changed -> changedSinceAsk has one title entry', () => {
  const view = baseView({
    gates: { 'item-x': { parentSnapshotAtAsk: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } } },
  });
  view.work['goal-x'].title = 'Ship the relaunch';
  const ctx = computeAwaitingContext(view, 'item-x');
  assert.deepEqual(ctx, {
    parent: { id: 'goal-x', title: 'Ship the relaunch', status: 'doing' },
    changedSinceAsk: [{ field: 'title', from: 'Ship the launch', to: 'Ship the relaunch' }],
  });
});

test('snapshot recorded, parent status changed -> changedSinceAsk has one status entry', () => {
  const view = baseView({
    gates: { 'item-x': { parentSnapshotAtAsk: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } } },
  });
  view.work['goal-x'].status = 'blocked';
  const ctx = computeAwaitingContext(view, 'item-x');
  assert.deepEqual(ctx, {
    parent: { id: 'goal-x', title: 'Ship the launch', status: 'blocked' },
    changedSinceAsk: [{ field: 'status', from: 'doing', to: 'blocked' }],
  });
});

test('snapshot recorded, both title and status changed -> changedSinceAsk has both entries', () => {
  const view = baseView({
    gates: { 'item-x': { parentSnapshotAtAsk: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } } },
  });
  view.work['goal-x'].title = 'Ship the relaunch';
  view.work['goal-x'].status = 'blocked';
  const ctx = computeAwaitingContext(view, 'item-x');
  assert.deepEqual(ctx.changedSinceAsk, [
    { field: 'title', from: 'Ship the launch', to: 'Ship the relaunch' },
    { field: 'status', from: 'doing', to: 'blocked' },
  ]);
});

test('exact string inequality, no trim/normalize — a whitespace-only edit counts as changed', () => {
  const view = baseView({
    gates: { 'item-x': { parentSnapshotAtAsk: { id: 'goal-x', title: 'Ship the launch', status: 'doing' } } },
  });
  view.work['goal-x'].title = 'Ship the launch '; // trailing space only
  const ctx = computeAwaitingContext(view, 'item-x');
  assert.deepEqual(ctx.changedSinceAsk, [{ field: 'title', from: 'Ship the launch', to: 'Ship the launch ' }]);
});

test('multiple awaiting-human items with parents -> each computes independently (O(n) map, no cross-talk)', () => {
  const view = {
    work: {
      'goal-x': { id: 'goal-x', title: 'Ship the launch', status: 'doing' },
      'goal-y': { id: 'goal-y', title: 'Cut the release', status: 'todo' },
      'item-x': { id: 'item-x', title: 'Write the copy', status: 'awaiting-human', parent: 'goal-x' },
      'item-y': { id: 'item-y', title: 'Pick the version', status: 'awaiting-human', parent: 'goal-y' },
    },
    gates: {
      'item-x': { parentSnapshotAtAsk: { id: 'goal-x', title: 'Ship the launch', status: 'todo' } },
    },
  };
  assert.deepEqual(computeAwaitingContext(view, 'item-x'), {
    parent: { id: 'goal-x', title: 'Ship the launch', status: 'doing' },
    changedSinceAsk: [{ field: 'status', from: 'todo', to: 'doing' }],
  });
  assert.deepEqual(computeAwaitingContext(view, 'item-y'), {
    parent: { id: 'goal-y', title: 'Cut the release', status: 'todo' },
  });
});
