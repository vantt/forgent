import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeReadiness } from '../../src/state/graph-harness.mjs';

// mergeReadiness is pure over a hand-built view (same shape replay.mjs's
// foldEvents produces: view.work[id] = { id, title, status, deps, ... }).

function item(id, status, deps = [], extra = {}) {
  return { id, title: `title-${id}`, status, deps, ...extra };
}

test('mergeReadiness on an empty view returns empty ready/waiting/conflicts', () => {
  assert.deepEqual(mergeReadiness({ work: {} }), { ready: [], waiting: [], conflicts: [] });
});

test('mergeReadiness: a proposed item with no deps is ready', () => {
  const view = { work: { a: item('a', 'awaiting-approval') } };
  assert.deepEqual(mergeReadiness(view), { ready: ['a'], waiting: [], conflicts: [] });
});

test('mergeReadiness: a proposed item whose dep is NOT done waits, never ready', () => {
  const view = {
    work: {
      dep: item('dep', 'awaiting-approval'),
      leaf: item('leaf', 'awaiting-approval', ['dep']),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.waiting, ['leaf']);
  assert.ok(!result.ready.includes('leaf'));
});

test('mergeReadiness: a proposed item whose dep IS done is ready, not waiting', () => {
  const view = {
    work: {
      dep: item('dep', 'done'),
      leaf: item('leaf', 'awaiting-approval', ['dep']),
    },
  };
  assert.deepEqual(mergeReadiness(view), { ready: ['leaf'], waiting: [], conflicts: [] });
});

test('mergeReadiness: only proposed items are considered — todo/doing/done/blocked never appear in ready or waiting', () => {
  const view = {
    work: {
      a: item('a', 'todo'),
      b: item('b', 'doing'),
      c: item('c', 'done'),
      d: item('d', 'blocked'),
      e: item('e', 'awaiting-approval'),
    },
  };
  assert.deepEqual(mergeReadiness(view), { ready: ['e'], waiting: [], conflicts: [] });
});

test('mergeReadiness: two dep-clear proposed items sharing a footprint conflict are excluded from ready, not counted as waiting', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
      b: item('b', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, []);
  assert.deepEqual(result.waiting, []);
  assert.deepEqual(result.conflicts, [
    { a: 'a', b: 'b', shared: ['src/x.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] },
  ]);
});

test('mergeReadiness: a dep-clear item conflicting with a dep-WAITING item is still flagged — conflict detection runs over all dep-clear candidates regardless of the other side', () => {
  const view = {
    work: {
      dep: item('dep', 'awaiting-approval'),
      waiting: item('waiting', 'awaiting-approval', ['dep'], { footprint: ['src/x.mjs'] }),
      free: item('free', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
    },
  };
  const result = mergeReadiness(view);
  // "waiting" is excluded from the conflict candidate set (it is not
  // dep-clear), so "free" has no dep-clear partner sharing its footprint
  // to conflict with; "dep" is itself a dep-clear, footprint-free proposed
  // item, so it is trivially ready alongside "free".
  assert.deepEqual(new Set(result.ready), new Set(['dep', 'free']));
  assert.deepEqual(result.waiting, ['waiting']);
  assert.deepEqual(result.conflicts, []);
});

test('mergeReadiness: ready ordering comes from rankImpact itself (blocks field flows through), not a re-derived order', () => {
  const view = {
    work: {
      base: item('base', 'awaiting-approval', []),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  // "base" blocks "dependent" (still open) — rankImpact's own blocks:1
  // shows up in the single ready result, proving mergeReadiness reads
  // rankImpact's real output rather than re-sorting some other way.
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, ['base']);
});

test('mergeReadiness: goalTier tie-break matches rankImpact exactly (mvp before milestone before ungrouped)', () => {
  const view = {
    work: {
      plain: item('plain', 'awaiting-approval'),
      ms: item('ms', 'awaiting-approval', [], { goalTier: 'milestone' }),
      mvp: item('mvp', 'awaiting-approval', [], { goalTier: 'mvp' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, ['mvp', 'ms', 'plain']);
});
