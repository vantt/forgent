import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeReadiness } from '../../src/state/graph-harness.mjs';

// mergeReadiness is pure over a hand-built view (same shape replay.mjs's
// foldEvents produces: view.work[id] = { id, title, status, deps, ... }).

function item(id, status, deps = [], extra = {}) {
  return { id, title: `title-${id}`, status, deps, ...extra };
}

test('mergeReadiness on an empty view returns empty ready/waiting/conflicts/mergeSets/blockedOnSync/mergeTier/supersededOut', () => {
  assert.deepEqual(mergeReadiness({ work: {} }), { ready: [], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: {}, supersededOut: [] });
});

test('mergeReadiness: a proposed item with no deps is ready', () => {
  const view = { work: { a: item('a', 'awaiting-approval') } };
  assert.deepEqual(mergeReadiness(view), { ready: ['a'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { a: 'root-to-main' }, supersededOut: [] });
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
  assert.deepEqual(mergeReadiness(view), { ready: ['leaf'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [] });
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
  assert.deepEqual(mergeReadiness(view), { ready: ['e'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { e: 'root-to-main' }, supersededOut: [] });
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

// --- mergeAfter / waits-for (D4/D5, tsk-2u0) --------------------------------

test('mergeReadiness: a proposed item whose mergeAfter target is NOT resolved waits, never ready', () => {
  const view = {
    work: {
      first: item('first', 'awaiting-approval'),
      second: item('second', 'awaiting-approval', [], { mergeAfter: ['first'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.waiting, ['second']);
  assert.ok(!result.ready.includes('second'));
});

test('mergeReadiness: a proposed item whose mergeAfter target IS resolved is ready, not waiting', () => {
  const view = {
    work: {
      first: item('first', 'delivered'),
      second: item('second', 'awaiting-approval', [], { mergeAfter: ['first'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, ['second']);
  assert.deepEqual(result.waiting, []);
});

test('mergeReadiness: mergeAfter has zero effect on start-eligibility — this function never gates dispatch, only merge order (frontier.mjs is a separate module entirely)', () => {
  // mergeReadiness only ever looks at `awaiting-approval` items in the
  // first place, so a `todo`/`doing` item with an unmet mergeAfter simply
  // never appears here at all — proving the point structurally, not just
  // by assertion.
  const view = {
    work: {
      first: item('first', 'todo'),
      second: item('second', 'todo', [], { mergeAfter: ['first'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, []);
  assert.deepEqual(result.waiting, []);
});

test('mergeReadiness: an item with BOTH an unmet dep and a resolved mergeAfter still waits (both gates must clear)', () => {
  const view = {
    work: {
      dep: item('dep', 'awaiting-approval'),
      mergeAfterTarget: item('mergeAfterTarget', 'delivered'),
      leaf: item('leaf', 'awaiting-approval', ['dep'], { mergeAfter: ['mergeAfterTarget'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.waiting, ['leaf']);
});

// --- blockedOnSync (opts.drift, D1) -----------------------------------------

test('mergeReadiness: blockedOnSync is always empty when opts.drift is omitted (pure, zero behavior change for existing callers)', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.blockedOnSync, []);
  assert.deepEqual(result.ready, ['leaf']);
});

test('mergeReadiness: a candidate whose resolved root needsSync (opts.drift) is blockedOnSync, excluded from ready', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view, { drift: { root: { needsSync: true } } });
  assert.deepEqual(result.blockedOnSync, ['leaf']);
  assert.deepEqual(result.ready, []);
  assert.deepEqual(result.waiting, []);
});

test('mergeReadiness: a candidate whose resolved root drift says needsSync: false is unaffected, stays ready', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view, { drift: { root: { needsSync: false } } });
  assert.deepEqual(result.blockedOnSync, []);
  assert.deepEqual(result.ready, ['leaf']);
});

test('mergeReadiness: blockedOnSync resolves through a nested root chain (grandparent) via resolveRoot, not immediate parent', () => {
  const view = {
    work: {
      grandroot: item('grandroot', 'doing'),
      root: item('root', 'doing', [], { parent: 'grandroot' }),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view, { drift: { grandroot: { needsSync: true } } });
  assert.deepEqual(result.blockedOnSync, ['leaf']);
});

// --- mergeSets: footprint-overlap (D2) --------------------------------------

test('mergeReadiness: a footprint-overlap pair now surfaces as a mergeSets entry instead of vanishing silently, still excluded from ready', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
      b: item('b', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, []);
  assert.equal(result.mergeSets.length, 1);
  assert.equal(result.mergeSets[0].reason, 'footprint-overlap');
  assert.deepEqual(new Set(result.mergeSets[0].items), new Set(['a', 'b']));
  assert.deepEqual(result.mergeSets[0].order, result.mergeSets[0].items);
});

test('mergeReadiness: a THREE-way footprint-overlap chain (a-b, b-c) becomes ONE mergeSet, not two', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
      b: item('b', 'awaiting-approval', [], { footprint: ['src/x.mjs', 'src/y.mjs'] }),
      c: item('c', 'awaiting-approval', [], { footprint: ['src/y.mjs'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.equal(result.mergeSets.length, 1, 'a chain of overlapping pairs must group into one connected mergeSet');
  assert.deepEqual(new Set(result.mergeSets[0].items), new Set(['a', 'b', 'c']));
});

test('mergeReadiness: two INDEPENDENT footprint-overlap pairs become TWO separate mergeSets', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
      b: item('b', 'awaiting-approval', [], { footprint: ['src/x.mjs'] }),
      c: item('c', 'awaiting-approval', [], { footprint: ['src/z.mjs'] }),
      d: item('d', 'awaiting-approval', [], { footprint: ['src/z.mjs'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.equal(result.mergeSets.length, 2);
  const groups = result.mergeSets.map((s) => new Set(s.items));
  assert.ok(groups.some((g) => g.has('a') && g.has('b') && !g.has('c')));
  assert.ok(groups.some((g) => g.has('c') && g.has('d') && !g.has('a')));
});

// --- mergeSets: shared-root (D2) --------------------------------------------

test('mergeReadiness: 2+ ready siblings of the same resolved root become a shared-root mergeSet, and STAY in ready (additive, not a second exclusion)', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      leafA: item('leafA', 'awaiting-approval', [], { parent: 'root' }),
      leafB: item('leafB', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(new Set(result.ready), new Set(['leafA', 'leafB']));
  assert.equal(result.mergeSets.length, 1);
  assert.equal(result.mergeSets[0].reason, 'shared-root');
  assert.deepEqual(new Set(result.mergeSets[0].items), new Set(['leafA', 'leafB']));
});

test('mergeReadiness: a SINGLE ready item under a root is not grouped into a shared-root mergeSet (needs 2+)', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      onlyLeaf: item('onlyLeaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.mergeSets, []);
  assert.deepEqual(result.ready, ['onlyLeaf']);
});

test('mergeReadiness: two root items (no parent) never form a shared-root mergeSet with each other (each resolves to itself)', () => {
  const view = {
    work: {
      rootA: item('rootA', 'awaiting-approval'),
      rootB: item('rootB', 'awaiting-approval'),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.mergeSets, []);
  assert.deepEqual(new Set(result.ready), new Set(['rootA', 'rootB']));
});

// --- mergeTier (D7) ----------------------------------------------------------

test('mergeReadiness: mergeTier is leaf-to-root for any proposed item with a parent, root-to-main for one without, regardless of ready/waiting/blocked status', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
      standaloneRoot: item('standaloneRoot', 'awaiting-approval'),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.mergeTier, { leaf: 'leaf-to-root', standaloneRoot: 'root-to-main' });
});

// --- supersededOut / duplicates (tsk-2ie D1-D4) -----------------------------

test('mergeReadiness: an item supersededBy a RESOLVED target is excluded from ready, lands in supersededOut', () => {
  const view = {
    work: {
      winner: item('winner', 'done'),
      loser: item('loser', 'awaiting-approval', [], { supersededBy: 'winner' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, []);
  assert.deepEqual(result.waiting, []);
  assert.deepEqual(result.supersededOut, ['loser']);
});

test('mergeReadiness: an item supersededBy a target that is itself in THIS SAME call\'s ready-set is excluded too (the concurrent-race case)', () => {
  const view = {
    work: {
      winner: item('winner', 'awaiting-approval'),
      loser: item('loser', 'awaiting-approval', [], { supersededBy: 'winner' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, ['winner']);
  assert.deepEqual(result.supersededOut, ['loser']);
});

test('mergeReadiness: an item supersededBy a target that is neither resolved nor in this round\'s ready-set is NOT excluded, stays ready', () => {
  const view = {
    work: {
      winner: item('winner', 'todo'),
      candidate: item('candidate', 'awaiting-approval', [], { supersededBy: 'winner' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, ['candidate']);
  assert.deepEqual(result.supersededOut, []);
});

test('mergeReadiness: a MUTUAL supersededBy pair (A->B, B->A), both still awaiting-approval, excludes BOTH sides deterministically (stall, not a crash)', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { supersededBy: 'b' }),
      b: item('b', 'awaiting-approval', [], { supersededBy: 'a' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.ready, []);
  assert.deepEqual(new Set(result.supersededOut), new Set(['a', 'b']));
});

test('mergeReadiness: duplicates is informational only -- zero effect on ready/waiting/mergeSets/supersededOut (D4)', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { duplicates: ['b'] }),
      b: item('b', 'awaiting-approval', [], { duplicates: ['a'] }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(new Set(result.ready), new Set(['a', 'b']));
  assert.deepEqual(result.waiting, []);
  assert.deepEqual(result.mergeSets, []);
  assert.deepEqual(result.supersededOut, []);
});

test('mergeReadiness: supersededOut is always empty for every item that never sets supersededBy (regression floor)', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval'),
      b: item('b', 'awaiting-approval', ['a']),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.supersededOut, []);
});
