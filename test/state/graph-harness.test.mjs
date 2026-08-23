import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeReadiness, mergeTree, openLeavesSharingTarget, classifyPostLandDrift } from '../../src/state/graph-harness.mjs';

// mergeReadiness is pure over a hand-built view (same shape replay.mjs's
// foldEvents produces: view.work[id] = { id, title, status, deps, ... }).

function item(id, status, deps = [], extra = {}) {
  return { id, title: `title-${id}`, status, deps, ...extra };
}

test('mergeReadiness on an empty view returns empty ready/waiting/conflicts/mergeSets/blockedOnSync/strandedByResolvedRoot/mergeTier/supersededOut', () => {
  assert.deepEqual(mergeReadiness({ work: {} }), { ready: [], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: {}, supersededOut: [], stageByItem: {} });
});

test('mergeReadiness: a proposed item with no deps is ready', () => {
  const view = { work: { a: item('a', 'awaiting-approval') } };
  assert.deepEqual(mergeReadiness(view), { ready: ['a'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: { a: 'root-to-main' }, supersededOut: [], stageByItem: { a: 'executing' } });
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
  assert.deepEqual(mergeReadiness(view), { ready: ['leaf'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [], stageByItem: { dep: 'executing', leaf: 'executing' } });
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
  assert.deepEqual(mergeReadiness(view), { ready: ['e'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: { e: 'root-to-main' }, supersededOut: [], stageByItem: { a: 'executing', b: 'executing', c: 'executing', d: 'executing', e: 'executing' } });
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

test('mergeReadiness: blockedOnSync is rank-ordered same as ready (tsk-173), not raw candidate-iteration order', () => {
  const view = {
    work: {
      plainRoot: item('plainRoot', 'doing'),
      plainLeaf: item('plainLeaf', 'awaiting-approval', [], { parent: 'plainRoot' }),
      mvpRoot: item('mvpRoot', 'doing'),
      mvpLeaf: item('mvpLeaf', 'awaiting-approval', [], { parent: 'mvpRoot', goalTier: 'mvp' }),
    },
  };
  // object insertion order alone would put plainLeaf before mvpLeaf; rank
  // order (goalTier mvp beats ungrouped, same tie-break `ready` already
  // uses) must put mvpLeaf first instead.
  const result = mergeReadiness(view, {
    drift: { plainRoot: { needsSync: true }, mvpRoot: { needsSync: true } },
  });
  assert.deepEqual(result.blockedOnSync, ['mvpLeaf', 'plainLeaf']);
});

// --- strandedByResolvedRoot (tsk-4s0, piece 2 of tsk-4qu's leaf-merge-into-
// resolved-root fix; CONTEXT.md D2) -----------------------------------------

test('mergeReadiness: a candidate whose resolved root is delivered is strandedByResolvedRoot, excluded from ready', () => {
  const view = {
    work: {
      root: item('root', 'delivered'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.strandedByResolvedRoot, ['leaf']);
  assert.deepEqual(result.ready, []);
  assert.deepEqual(result.blockedOnSync, []);
  assert.deepEqual(result.waiting, []);
});

test('mergeReadiness: a candidate whose resolved root is wontfix is ALSO strandedByResolvedRoot (D2 — wontfix blocks too)', () => {
  const view = {
    work: {
      root: item('root', 'wontfix'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.strandedByResolvedRoot, ['leaf']);
  assert.deepEqual(result.ready, []);
});

test('mergeReadiness: a candidate whose root is open (not resolved) is unaffected, stays ready — strandedByResolvedRoot stays empty', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.strandedByResolvedRoot, []);
  assert.deepEqual(result.ready, ['leaf']);
});

test('mergeReadiness: a root-to-main item (no parent) is never strandedByResolvedRoot even when its own status is resolved', () => {
  // A resolved item with no parent has resolveRoot(view, id) === id, so the
  // `root !== item.id` guard must exclude it — a root can't strand itself.
  const view = { work: { solo: item('solo', 'awaiting-approval') } };
  const result = mergeReadiness(view);
  assert.deepEqual(result.strandedByResolvedRoot, []);
  assert.deepEqual(result.ready, ['solo']);
});

test('mergeReadiness: strandedByResolvedRoot resolves through a nested root chain (grandparent) via resolveRoot, not immediate parent', () => {
  const view = {
    work: {
      grandroot: item('grandroot', 'cleanup'),
      root: item('root', 'doing', [], { parent: 'grandroot' }),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.strandedByResolvedRoot, ['leaf']);
  assert.deepEqual(result.ready, []);
});

test('mergeReadiness: strandedByResolvedRoot is rank-ordered same as ready/blockedOnSync, not raw candidate-iteration order', () => {
  const view = {
    work: {
      plainRoot: item('plainRoot', 'delivered'),
      plainLeaf: item('plainLeaf', 'awaiting-approval', [], { parent: 'plainRoot' }),
      mvpRoot: item('mvpRoot', 'delivered'),
      mvpLeaf: item('mvpLeaf', 'awaiting-approval', [], { parent: 'mvpRoot', goalTier: 'mvp' }),
    },
  };
  const result = mergeReadiness(view);
  assert.deepEqual(result.strandedByResolvedRoot, ['mvpLeaf', 'plainLeaf']);
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

// mergeTree (tsk-2x9k, docs/history/merge-list-tree-bottleneck-priority/)

test('mergeTree on an empty view returns an empty tree', () => {
  const view = { work: {} };
  assert.deepEqual(mergeTree(view, mergeReadiness(view)), []);
});

test('mergeTree: a single ready root-to-main item is one top-level node with no children', () => {
  const view = { work: { a: item('a', 'awaiting-approval') } };
  assert.deepEqual(mergeTree(view, mergeReadiness(view)), [
    { id: 'a', title: 'title-a', status: 'ready', children: [] },
  ]);
});

test('mergeTree: a ready leaf nests under its real parent even though the parent itself is not a merge candidate (decomposed root never merges itself)', () => {
  const view = {
    work: {
      root: item('root', 'doing'), // decomposed, not itself awaiting-approval -- never appears in mergeReadiness's own buckets
      child: item('child', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const readiness = mergeReadiness(view);
  assert.deepEqual(readiness.ready, ['child']); // sanity: mergeReadiness itself never mentions 'root'
  assert.deepEqual(mergeTree(view, readiness), [
    {
      id: 'root',
      title: 'title-root',
      status: 'container',
      children: [{ id: 'child', title: 'title-child', status: 'ready', children: [] }],
    },
  ]);
});

test('mergeTree: three-level chain (root -> child -> grandchild) nests correctly at every level', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      child: item('child', 'doing', [], { parent: 'root' }),
      grandchild: item('grandchild', 'awaiting-approval', [], { parent: 'child' }),
    },
  };
  const readiness = mergeReadiness(view);
  assert.deepEqual(mergeTree(view, readiness), [
    {
      id: 'root',
      title: 'title-root',
      status: 'container',
      children: [
        {
          id: 'child',
          title: 'title-child',
          status: 'container',
          children: [{ id: 'grandchild', title: 'title-grandchild', status: 'ready', children: [] }],
        },
      ],
    },
  ]);
});

test('mergeTree: sibling children under the same parent sort by blocks descending (D3/D6), recursively -- not just at top level', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      // 'busy' blocks one other open item (its own dep target), 'quiet' blocks none
      quiet: item('quiet', 'awaiting-approval', [], { parent: 'root' }),
      busy: item('busy', 'awaiting-approval', [], { parent: 'root' }),
      downstream: item('downstream', 'todo', ['busy']),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, 'root');
  assert.deepEqual(tree[0].children.map((n) => n.id), ['busy', 'quiet']);
});

test('mergeTree: a waiting item shows status "waiting"', () => {
  const view = {
    work: {
      dep: item('dep', 'awaiting-approval'),
      leaf: item('leaf', 'awaiting-approval', ['dep']),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  const leafNode = tree.find((n) => n.id === 'leaf');
  assert.equal(leafNode.status, 'waiting');
  assert.equal(leafNode.reason, undefined);
});

test('mergeTree: a blockedOnSync item shows status "blocked-sync" with a reason citing the real drift detail (D7)', () => {
  const view = { work: { a: item('a', 'awaiting-approval') } };
  const drift = { a: { branch: 'fgw/a', target: 'main', aheadOfTarget: 3, behindTarget: 2, needsSync: true } };
  const readiness = mergeReadiness(view, { drift });
  const tree = mergeTree(view, readiness, { drift });
  assert.equal(tree[0].status, 'blocked-sync');
  assert.match(tree[0].reason, /fgw\/a/);
  assert.match(tree[0].reason, /3/);
  assert.match(tree[0].reason, /2/);
  assert.match(tree[0].reason, /main/);
});

test('mergeTree: a strandedByResolvedRoot item shows status "stranded-resolved-root" with a reason citing the real root and its status (tsk-4s0)', () => {
  const view = {
    work: {
      root: item('root', 'delivered'),
      leaf: item('leaf', 'awaiting-approval', [], { parent: 'root' }),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  const flatIds = new Set();
  const walk = (nodes) => nodes.forEach((n) => { flatIds.add(n.id); walk(n.children); });
  walk(tree);
  assert.ok(flatIds.has('leaf'), 'a strandedByResolvedRoot id must still get a node (D2 never-hide invariant)');
  const findNode = (nodes, id) => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findNode(n.children, id);
      if (found) return found;
    }
    return null;
  };
  const leafNode = findNode(tree, 'leaf');
  assert.equal(leafNode.status, 'stranded-resolved-root');
  assert.match(leafNode.reason, /root/);
  assert.match(leafNode.reason, /delivered/);
});

test('mergeTree: a footprint-conflicted item shows status "conflicted" with a reason citing the counterpart item (D7)', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { footprint: ['src/shared.mjs'] }),
      b: item('b', 'awaiting-approval', [], { footprint: ['src/shared.mjs'] }),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  const nodeA = tree.find((n) => n.id === 'a');
  assert.equal(nodeA.status, 'conflicted');
  assert.match(nodeA.reason, /\bb\b/);
  assert.match(nodeA.reason, /shared\.mjs/);
});

test('mergeTree: a superseded item shows status "superseded" with a reason citing the target item (D7)', () => {
  const view = {
    work: {
      a: item('a', 'awaiting-approval', [], { supersededBy: 'b' }),
      b: item('b', 'awaiting-approval', [], { supersededBy: 'a' }),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  const nodeA = tree.find((n) => n.id === 'a');
  assert.equal(nodeA.status, 'superseded');
  assert.match(nodeA.reason, /\bb\b/);
});

test('mergeTree: a dangling/stale parent reference (parent id absent from view.work) surfaces the child at top level instead of dropping it', () => {
  const view = {
    work: {
      orphan: item('orphan', 'awaiting-approval', [], { parent: 'ghost-parent-id-not-in-work' }),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  assert.deepEqual(tree, [{ id: 'orphan', title: 'title-orphan', status: 'ready', children: [] }]);
});

test('mergeTree: every id mergeReadiness surfaces in any bucket appears somewhere in the tree (D2 -- never just ready)', () => {
  const view = {
    work: {
      dep: item('dep', 'awaiting-approval'),
      waitingLeaf: item('waitingLeaf', 'awaiting-approval', ['dep']),
      a: item('a', 'awaiting-approval', [], { footprint: ['x.mjs'] }),
      b: item('b', 'awaiting-approval', [], { footprint: ['x.mjs'] }),
      superseded: item('superseded', 'awaiting-approval', [], { supersededBy: 'dep' }),
    },
  };
  const readiness = mergeReadiness(view);
  const tree = mergeTree(view, readiness);
  const flatIds = new Set();
  const walk = (nodes) => nodes.forEach((n) => { flatIds.add(n.id); walk(n.children); });
  walk(tree);
  for (const id of [...readiness.ready, ...readiness.waiting, ...readiness.supersededOut, 'a', 'b']) {
    assert.ok(flatIds.has(id), `expected ${id} to appear in the tree`);
  }
});

// --- post-land drift detection (D4) --------------------------------------
//
// The pure half of "after a land, which still-open branches did it actually
// put behind?". Both functions are hand-fed here: the real changed-file sets
// come from git at the caller (merge.mjs), never from declared footprint.

test('openLeavesSharingTarget: only items merging into the same target ref, never the landed item itself', () => {
  const view = {
    work: {
      root: item('root', 'doing'),
      landed: item('landed', 'awaiting-approval', [], { parent: 'root' }),
      sibling: item('sibling', 'doing', [], { parent: 'root' }),
      otherRoot: item('otherRoot', 'doing', [], { parent: 'somewhere-else' }),
      rootless: item('rootless', 'doing'),
    },
  };
  assert.deepEqual(openLeavesSharingTarget(view, 'landed'), ['sibling']);
});

test('openLeavesSharingTarget: two parentless items share the trunk as their target', () => {
  const view = {
    work: {
      landed: item('landed', 'awaiting-approval'),
      other: item('other', 'doing'),
      child: item('child', 'doing', [], { parent: 'landed' }),
    },
  };
  assert.deepEqual(openLeavesSharingTarget(view, 'landed'), ['other']);
});

test('openLeavesSharingTarget: excludes resolved siblings and pre-claim siblings', () => {
  // A pre-claim sibling's fgw/<id> branch is created at decompose and carries
  // no commit of its own, so its changed-file set is empty and can never
  // intersect anything -- diffing it is paid work for a guaranteed empty set.
  const view = {
    work: {
      landed: item('landed', 'awaiting-approval', [], { parent: 'root' }),
      live: item('live', 'doing', [], { parent: 'root' }),
      parked: item('parked', 'awaiting-human', [], { parent: 'root' }),
      preClaim: item('preClaim', 'todo', [], { parent: 'root' }),
      merged: item('merged', 'delivered', [], { parent: 'root' }),
      finished: item('finished', 'done', [], { parent: 'root' }),
      dropped: item('dropped', 'wontfix', [], { parent: 'root' }),
    },
  };
  assert.deepEqual(openLeavesSharingTarget(view, 'landed'), ['live', 'parked']);
});

test('openLeavesSharingTarget: an unknown landed id yields nothing rather than throwing', () => {
  assert.deepEqual(openLeavesSharingTarget({ work: {} }, 'nope'), []);
});

test('classifyPostLandDrift: a leaf sharing no path produces nothing at all -- no notification, no mark', () => {
  const result = classifyPostLandDrift({
    landedFiles: ['src/a.mjs'],
    leaves: [{ id: 'leaf', files: ['src/b.mjs'], sessionIds: ['sess-1'] }],
  });
  assert.deepEqual(result, { notify: [], stale: [] });
});

test('classifyPostLandDrift: a shared path with a live session notifies that exact session', () => {
  const result = classifyPostLandDrift({
    landedFiles: ['src/a.mjs', 'src/shared.mjs'],
    leaves: [{ id: 'leaf', files: ['src/shared.mjs', 'src/c.mjs'], sessionIds: ['sess-1'] }],
  });
  assert.deepEqual(result, {
    notify: [{ id: 'leaf', shared: ['src/shared.mjs'], sessionIds: ['sess-1'] }],
    stale: [],
  });
});

test('classifyPostLandDrift: a shared path reaches every session of that leaf, not just the first', () => {
  const result = classifyPostLandDrift({
    landedFiles: ['src/shared.mjs'],
    leaves: [{ id: 'leaf', files: ['src/shared.mjs'], sessionIds: ['sess-1', 'sess-2'] }],
  });
  assert.deepEqual(result.notify, [{ id: 'leaf', shared: ['src/shared.mjs'], sessionIds: ['sess-1', 'sess-2'] }]);
});

test('classifyPostLandDrift: a shared path with no session is marked stale only', () => {
  const result = classifyPostLandDrift({
    landedFiles: ['src/shared.mjs'],
    leaves: [{ id: 'leaf', files: ['src/shared.mjs'], sessionIds: [] }],
  });
  assert.deepEqual(result, { notify: [], stale: [{ id: 'leaf', shared: ['src/shared.mjs'] }] });
});

test('classifyPostLandDrift: each leaf is bucketed independently', () => {
  const result = classifyPostLandDrift({
    landedFiles: ['src/shared.mjs'],
    leaves: [
      { id: 'untouched', files: ['src/other.mjs'], sessionIds: ['sess-1'] },
      { id: 'owned', files: ['src/shared.mjs'], sessionIds: ['sess-2'] },
      { id: 'orphan', files: ['src/shared.mjs'], sessionIds: [] },
    ],
  });
  assert.deepEqual(result.notify, [{ id: 'owned', shared: ['src/shared.mjs'], sessionIds: ['sess-2'] }]);
  assert.deepEqual(result.stale, [{ id: 'orphan', shared: ['src/shared.mjs'] }]);
});

test('classifyPostLandDrift: no leaves and no landed files produce empty buckets', () => {
  assert.deepEqual(classifyPostLandDrift({}), { notify: [], stale: [] });
});
