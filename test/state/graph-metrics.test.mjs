import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectedComponents, criticalPath, staleBlocked, greedyTopUnblock, goalScopedSet, goalScopedCriticalPath, goalScopedGreedyTopUnblock, whatIf, metricsFrame, graphMetrics, classifyStaleDoing, STALE_DOING_DEFAULTS, classifyStalePostDelivery, STALE_POST_DELIVERY_DEFAULTS, footprintOverlap, detectCycles, computeSchedule } from '../../src/state/graph-metrics.mjs';

// Pure lib — every view here is a literal (foldEvents style), no fs, no
// `.fgos/` writes. connectedComponents groups work items linked by ANY unified
// edge (blocks via deps, or parent-child via parent) into independent parallel
// tracks.
function item(id, extra = {}) {
  return { id, title: id, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', ...extra };
}

test('connectedComponents: an empty view has zero components', () => {
  assert.deepEqual(connectedComponents({ work: {} }), { componentCount: 0, components: [] });
});

test('connectedComponents: a view with no edges yields one singleton component per item', () => {
  const view = { work: { a: item('a'), b: item('b'), c: item('c') } };
  const { componentCount, components } = connectedComponents(view);
  assert.equal(componentCount, 3);
  assert.deepEqual(components.map((c) => c.items), [['a'], ['b'], ['c']]);
  assert.ok(components.every((c) => c.size === 1));
});

test('connectedComponents: a blocks edge (deps) links two items into one component', () => {
  const view = { work: { a: item('a'), b: item('b', { deps: ['a'] }) } };
  const { componentCount, components } = connectedComponents(view);
  assert.equal(componentCount, 1);
  assert.deepEqual(components[0].items, ['a', 'b']);
});

test('connectedComponents: a parent-child edge links parent and child into one component', () => {
  const view = { work: { a: item('a'), d: item('d', { parent: 'a' }) } };
  const { components } = connectedComponents(view);
  assert.equal(components.length, 1);
  assert.deepEqual(components[0].items, ['a', 'd']);
});

test('connectedComponents: independent tracks stay separate; blocks + parent-child both link', () => {
  // a<-b (blocks) and a<-d (parent) form one track {a,b,d}; c is alone; e/f a
  // second linked track.
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }),
      c: item('c'),
      d: item('d', { parent: 'a' }),
      e: item('e'),
      f: item('f', { deps: ['e'] }),
    },
  };
  const { componentCount, components } = connectedComponents(view);
  assert.equal(componentCount, 3);
  assert.deepEqual(components.map((c) => c.items), [['a', 'b', 'd'], ['c'], ['e', 'f']]);
});

test('connectedComponents: an edge to an UNKNOWN id (dangling dep/parent) never materializes a phantom node', () => {
  const view = {
    work: {
      lonely: item('lonely', { deps: ['does-not-exist'] }),
      orphan: item('orphan', { parent: 'also-missing' }),
    },
  };
  const { componentCount, components } = connectedComponents(view);
  // Both are singletons — the dangling endpoints are not real work items.
  assert.equal(componentCount, 2);
  assert.deepEqual(components.map((c) => c.items), [['lonely'], ['orphan']]);
});

test('connectedComponents is deterministic: items in declaration order, components by first-member declaration index', () => {
  // zeta declared before alpha; the component that contains the earlier-
  // declared member comes first, and members are in declaration order — never
  // id-lexical, never BFS-visitation order.
  const view = {
    work: {
      zeta: item('zeta'),
      alpha: item('alpha', { deps: ['zeta'] }),
      mid: item('mid'),
    },
  };
  const a = connectedComponents(view);
  const b = connectedComponents(view);
  assert.deepEqual(a, b);
  assert.deepEqual(a.components.map((c) => c.items), [['zeta', 'alpha'], ['mid']]);
});

test('graphMetrics umbrella carries order_version alongside the component facts', () => {
  const view = { work: { a: item('a'), b: item('b', { deps: ['a'] }) } };
  const metrics = graphMetrics(view);
  assert.equal(metrics.order_version, 2); // FRONTIER_ORDER_VERSION (S4, bumped to v2 by str7-str8-priority-intent D2)
  assert.equal(metrics.componentCount, 1);
  assert.deepEqual(metrics.components[0].items, ['a', 'b']);
});

// --- S6: critical path, stale-blocked, greedy top-k-unblock ----------------

test('criticalPath: the longest deps chain, deepest item down through its deps', () => {
  // c deps b deps a; d deps a (a shorter branch). Longest chain is c->b->a.
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }),
      c: item('c', { deps: ['b'] }),
      d: item('d', { deps: ['a'] }),
    },
  };
  assert.deepEqual(criticalPath(view), { depth: 3, path: ['c', 'b', 'a'] });
});

test('criticalPath: empty view is depth 0 with an empty path; a single item is depth 1', () => {
  assert.deepEqual(criticalPath({ work: {} }), { depth: 0, path: [] });
  assert.deepEqual(criticalPath({ work: { solo: item('solo') } }), { depth: 1, path: ['solo'] });
});

test('criticalPath counts an open child the same as a deps entry: a root only blocked by an unfinished child still shows the real chain depth', () => {
  // root has no `deps` at all — its only relation is `child.parent === 'root'`.
  // A root stays gated until every child is done (frontier.mjs's
  // hasOpenDescendant), so this chain is exactly as real as a deps chain.
  const view = {
    work: {
      root: item('root'),
      child: item('child', { parent: 'root' }),
    },
  };
  assert.deepEqual(criticalPath(view), { depth: 2, path: ['root', 'child'] });
});

test('staleBlocked: lists todo/blocked items with an unmet dep (missing dep included); ready items are omitted', () => {
  const view = {
    work: {
      a: item('a'), // no deps -> ready, not stale
      b: item('b', { deps: ['a'] }), // a is todo (not done) -> stale
      done: item('done', { status: 'done' }),
      c: item('c', { deps: ['done'] }), // dep done -> ready, not stale
      parked: item('parked', { status: 'blocked', deps: ['gone'] }), // missing dep -> stale
    },
  };
  assert.deepEqual(staleBlocked(view), [
    { id: 'b', status: 'todo', blockedBy: ['a'] },
    { id: 'parked', status: 'blocked', blockedBy: ['gone'] },
  ]);
});

// wontfix-terminal-status-filter-consistency D2: a wontfix dep is RESOLVED
// the same as done -- an item whose only unmet dep is wontfix is ready, not
// stale-blocked.
test('staleBlocked: a dep at wontfix is RESOLVED, same as done -- never names a wontfix id as a blocker', () => {
  const view = {
    work: {
      closed: item('closed', { status: 'wontfix' }),
      ready: item('ready', { deps: ['closed'] }), // dep wontfix -> resolved, not stale
    },
  };
  assert.deepEqual(staleBlocked(view), []);
});

test('greedyTopUnblock: ranks by marginal not-done coverage — the chain root wins, then leftovers', () => {
  // a unblocks b,c,d (transitively); e/f a separate pair; g isolated.
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }),
      c: item('c', { deps: ['b'] }),
      d: item('d', { deps: ['a'] }),
      e: item('e'),
      f: item('f', { deps: ['e'] }),
      g: item('g'),
    },
  };
  const picks = greedyTopUnblock(view);
  // First pick a: downstream {b,c,d} (size 3), marginal 4 (a+b+c+d).
  assert.deepEqual(picks[0], { id: 'a', unblocks: 3, newlyUnblocks: 4 });
  // Next best marginal is e: downstream {f} (size 1), marginal 2 (e+f).
  assert.deepEqual(picks[1], { id: 'e', unblocks: 1, newlyUnblocks: 2 });
  // Then g alone: marginal 1.
  assert.deepEqual(picks[2], { id: 'g', unblocks: 0, newlyUnblocks: 1 });
  // Everything is covered after that — no further picks.
  assert.equal(picks.length, 3);
});

test('greedyTopUnblock: a done item is never a candidate and never counts as downstream', () => {
  const view = {
    work: {
      root: item('root'),
      finished: item('finished', { status: 'done', deps: ['root'] }), // done -> not counted
      pending: item('pending', { deps: ['root'] }),
    },
  };
  const picks = greedyTopUnblock(view);
  // root's downstream among NOT-done is just {pending}; finished is ignored.
  assert.deepEqual(picks[0], { id: 'root', unblocks: 1, newlyUnblocks: 2 });
  assert.ok(!picks.some((p) => p.id === 'finished'));
});

// wontfix-terminal-status-filter-consistency D2: a wontfix item is RESOLVED
// the same as done -- never a candidate, never counted as downstream.
test('greedyTopUnblock: a wontfix item is never a candidate and never counts as downstream, same as done', () => {
  const view = {
    work: {
      root: item('root'),
      closed: item('closed', { status: 'wontfix', deps: ['root'] }), // wontfix -> not counted
      pending: item('pending', { deps: ['root'] }),
    },
  };
  const picks = greedyTopUnblock(view);
  assert.deepEqual(picks[0], { id: 'root', unblocks: 1, newlyUnblocks: 2 });
  assert.ok(!picks.some((p) => p.id === 'closed'));
});

test('greedyTopUnblock: completing an open child counts toward unblocking its parent, the same way a deps entry would', () => {
  // `root` has no `deps` naming it — it is only reachable via `child.parent`.
  // Before the unified-graph fix, root's downstream (and therefore its rank)
  // was invisible to this metric entirely.
  const view = {
    work: {
      root: item('root'),
      child: item('child', { parent: 'root' }),
    },
  };
  const picks = greedyTopUnblock(view);
  assert.deepEqual(picks[0], { id: 'child', unblocks: 1, newlyUnblocks: 2 });
});

test('greedyTopUnblock respects k', () => {
  const view = { work: { a: item('a'), b: item('b'), c: item('c') } };
  assert.equal(greedyTopUnblock(view, 2).length, 2);
});

// --- STR67 D5: goal-scoped ranking (goalScopedSet/criticalPath/greedyTopUnblock) ---

// Nested MVP > milestone > work fixture, plus a deeper whole-graph chain
// (outside*) that would win an UNSCOPED criticalPath — proving the scoped
// variants exclude it even though it is deeper than anything in scope.
function nestedGoalView() {
  return {
    work: {
      outside: item('outside'),
      outsideMid: item('outsideMid', { deps: ['outside'] }),
      outsideDeep: item('outsideDeep', { deps: ['outsideMid'] }), // whole-graph depth 3
      mvp: item('mvp', { goalTier: 'mvp', targets: ['ms1', 'ms2'] }),
      ms1: item('ms1', { goalTier: 'milestone', targets: ['w1'] }),
      ms2: item('ms2', { goalTier: 'milestone', targets: ['w2'] }),
      w1: item('w1'),
      w2: item('w2', { deps: ['w1'] }), // scoped depth 2 (w2 -> w1)
    },
  };
}

test('goalScopedSet: focus + transitive targets closure (nested MVP > milestone > work), excludes unrelated whole-graph items', () => {
  const scope = goalScopedSet(nestedGoalView(), 'mvp');
  assert.deepEqual([...scope].sort(), ['ms1', 'ms2', 'mvp', 'w1', 'w2']);
  assert.ok(!scope.has('outside') && !scope.has('outsideMid') && !scope.has('outsideDeep'));
});

test('goalScopedCriticalPath: restricted to the goal-scoped set even when a deeper chain exists outside it', () => {
  const result = goalScopedCriticalPath(nestedGoalView(), 'mvp');
  assert.deepEqual(result, { depth: 2, path: ['w2', 'w1'] });
  // the unscoped chain is strictly deeper (3) — proves this is a real restriction, not a coincidence
  assert.equal(criticalPath(nestedGoalView()).depth, 3);
});

test('goalScopedGreedyTopUnblock: candidates and downstream coverage both restricted to the goal-scoped set', () => {
  const picks = goalScopedGreedyTopUnblock(nestedGoalView(), 'mvp');
  assert.deepEqual(picks, [
    { id: 'w1', unblocks: 1, newlyUnblocks: 2 },
    { id: 'mvp', unblocks: 0, newlyUnblocks: 1 },
    { id: 'ms1', unblocks: 0, newlyUnblocks: 1 },
    { id: 'ms2', unblocks: 0, newlyUnblocks: 1 },
  ]);
  assert.ok(!picks.some((p) => ['outside', 'outsideMid', 'outsideDeep'].includes(p.id)));
});

// A milestone's own `deps` entry points OUTSIDE its immediate `targets` list —
// the exact gap D5 was revised to fix: the deps-ancestor closure must still
// catch it.
function depsAncestorOutsideTargetsView() {
  return {
    work: {
      mvp: item('mvp', { goalTier: 'mvp', targets: ['ms'] }),
      ms: item('ms', { goalTier: 'milestone', targets: ['w1'], deps: ['blocker'] }),
      blocker: item('blocker'),
      w1: item('w1'),
      unrelated: item('unrelated'),
    },
  };
}

test('goalScopedSet: catches a scoped item deps-ancestor outside its immediate targets list', () => {
  const scope = goalScopedSet(depsAncestorOutsideTargetsView(), 'mvp');
  assert.deepEqual([...scope].sort(), ['blocker', 'mvp', 'ms', 'w1'].sort());
  assert.ok(!scope.has('unrelated'));
});

test('goalScopedCriticalPath: a milestone real blocker (outside targets) shows up in the scoped path/depth', () => {
  const result = goalScopedCriticalPath(depsAncestorOutsideTargetsView(), 'mvp');
  assert.deepEqual(result, { depth: 2, path: ['ms', 'blocker'] });
});

test('goalScopedGreedyTopUnblock: a milestone real blocker (outside targets) is ranked and contributes to the milestone pick', () => {
  const picks = goalScopedGreedyTopUnblock(depsAncestorOutsideTargetsView(), 'mvp');
  assert.deepEqual(picks, [
    { id: 'blocker', unblocks: 1, newlyUnblocks: 2 },
    { id: 'mvp', unblocks: 0, newlyUnblocks: 1 },
    { id: 'w1', unblocks: 0, newlyUnblocks: 1 },
  ]);
  assert.ok(!picks.some((p) => p.id === 'unrelated'));
});

test('goalScopedSet: a targets CYCLE (A targets B targets A) terminates without duplicating members', () => {
  const view = {
    work: {
      a: item('a', { goalTier: 'mvp', targets: ['b'] }),
      b: item('b', { goalTier: 'milestone', targets: ['a'] }),
    },
  };
  const scope = goalScopedSet(view, 'a');
  assert.deepEqual([...scope].sort(), ['a', 'b']);
});

test('goalScopedSet/goalScopedCriticalPath/goalScopedGreedyTopUnblock: an unknown focusId yields the empty-input shape', () => {
  const view = { work: { a: item('a') } };
  assert.deepEqual(goalScopedSet(view, 'nope'), new Set());
  assert.deepEqual(goalScopedCriticalPath(view, 'nope'), { depth: 0, path: [] });
  assert.deepEqual(goalScopedGreedyTopUnblock(view, 'nope'), []);
});

test('goalScopedCriticalPath/goalScopedGreedyTopUnblock are deterministic (same declaration-order tie-breaks as the whole-graph functions)', () => {
  const view = nestedGoalView();
  assert.deepEqual(goalScopedCriticalPath(view, 'mvp'), goalScopedCriticalPath(view, 'mvp'));
  assert.deepEqual(goalScopedGreedyTopUnblock(view, 'mvp'), goalScopedGreedyTopUnblock(view, 'mvp'));
});

test('graphMetrics umbrella completes P43: components + criticalPath + staleBlocked + topUnblock, all deterministic', () => {
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }),
    },
  };
  const m1 = graphMetrics(view);
  const m2 = graphMetrics(view);
  assert.deepEqual(m1, m2); // deterministic -> stable data_hash
  assert.deepEqual(Object.keys(m1), ['order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock', 'stageByItem']);
  assert.deepEqual(m1.criticalPath, { depth: 2, path: ['b', 'a'] });
  assert.deepEqual(m1.staleBlocked, [{ id: 'b', status: 'todo', blockedBy: ['a'] }]);
  assert.deepEqual(m1.topUnblock[0], { id: 'a', unblocks: 1, newlyUnblocks: 2 });
  // tsk-4zj D6: stageByItem covers every id in the work map, regardless of
  // whether that id appears in components/criticalPath/staleBlocked/
  // topUnblock above — a's own stage is absent (never explicitly set), so
  // it defaults to coding's Execute-mapped stage, same as b.
  assert.deepEqual(m1.stageByItem, { a: 'executing', b: 'executing' });
});

// --- S7: what-if + architecture frame --------------------------------------

test('whatIf: completing a chain root unblocks its transitive downstream; newlyReady = dependents whose other deps are already done', () => {
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }), // only dep is a -> newly ready when a done
      c: item('c', { deps: ['a', 'b'] }), // also waits on b -> NOT newly ready
    },
  };
  assert.deepEqual(whatIf(view, 'a'), { id: 'a', exists: true, unblocksTransitive: 2, newlyReady: ['b'], stageByItem: { a: 'executing', b: 'executing' } });
});

test('whatIf: completing a child unblocks its open parent, the same way completing a deps target would', () => {
  const view = {
    work: {
      root: item('root'),
      child: item('child', { parent: 'root' }),
    },
  };
  // unblocksTransitive now sees root through the unified graph. newlyReady
  // stays deps-only by design (per this function's own docstring — a "graph
  // fact about dependencies only", not full frontier eligibility): root's
  // `deps` array is empty, so it reads as vacuously deps-satisfied — the same
  // pre-existing, unrelated-to-this-fix behavior any item with no `deps`
  // would show for any `id` queried, not something this change introduces.
  assert.deepEqual(whatIf(view, 'child'), { id: 'child', exists: true, unblocksTransitive: 1, newlyReady: ['root'], stageByItem: { child: 'executing', root: 'executing' } });
});

test('whatIf: an unknown id is exists:false with zero impact', () => {
  assert.deepEqual(whatIf({ work: { a: item('a') } }, 'nope'), { id: 'nope', exists: false, unblocksTransitive: 0, newlyReady: [] });
});

test('whatIf: a done dependent is never counted as newly-unblocked', () => {
  const view = { work: { root: item('root'), done: item('done', { status: 'done', deps: ['root'] }) } };
  assert.deepEqual(whatIf(view, 'root'), { id: 'root', exists: true, unblocksTransitive: 0, newlyReady: [], stageByItem: { root: 'executing' } });
});

// wontfix-terminal-status-filter-consistency D2: a wontfix item is RESOLVED
// the same as done -- never counted in unblocksTransitive, and a dependent
// whose OTHER dep is wontfix (not the completed `id`) still counts as
// newly-ready.
test('whatIf: a wontfix dependent is never counted as newly-unblocked, same as done', () => {
  const view = { work: { root: item('root'), closed: item('closed', { status: 'wontfix', deps: ['root'] }) } };
  assert.deepEqual(whatIf(view, 'root'), { id: 'root', exists: true, unblocksTransitive: 0, newlyReady: [], stageByItem: { root: 'executing' } });
});

test('whatIf: newlyReady still includes a dependent whose OTHER dep is already wontfix, same as done', () => {
  const view = {
    work: {
      closed: item('closed', { status: 'wontfix' }),
      root: item('root'),
      dependent: item('dependent', { deps: ['root', 'closed'] }),
    },
  };
  assert.deepEqual(whatIf(view, 'root').newlyReady, ['dependent']);
});

test('metricsFrame: carries the deterministic revision + node count, all cheap metrics computed', () => {
  const view = { work: { a: item('a'), b: item('b', { deps: ['a'] }) } };
  const frame = metricsFrame(view);
  assert.match(frame.revision, /^[0-9a-f]{64}$/);
  assert.equal(frame.nodeCount, 2);
  assert.deepEqual(frame.computed, ['componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock']);
  assert.deepEqual(frame.skipped, []);
});

test('metricsFrame: the greedy topUnblock is the only skippable metric — skipped above the node ceiling, and the umbrella returns [] for it', () => {
  const view = { work: { a: item('a'), b: item('b', { deps: ['a'] }), c: item('c') } };
  const frame = metricsFrame(view, { maxNodesForGreedy: 1 });
  assert.deepEqual(frame.skipped, ['topUnblock']);
  assert.ok(!frame.computed.includes('topUnblock'));
  const metrics = graphMetrics(view, { maxNodesForGreedy: 1 });
  assert.deepEqual(metrics.topUnblock, [], 'skipped greedy yields an empty topUnblock');
  // cheap metrics still ran
  assert.equal(metrics.componentCount, 2);
  assert.deepEqual(metrics.frame.skipped, ['topUnblock']);
});

// --- S8: evidence-classifier advisory for stale doing items ----------------

const NOW = 1_000_000_000_000;

test('classifyStaleDoing: human >> agent — the same age is stale for an agent claim but fresh for a human claim', () => {
  const twentyMin = 20 * 60 * 1000;
  const entries = [
    { id: 'by-agent', claimRole: 'runner', claimedAt: NOW - twentyMin },
    { id: 'by-human', claimRole: 'human', claimedAt: NOW - twentyMin },
  ];
  const { stale } = classifyStaleDoing(entries, { now: NOW });
  assert.deepEqual(stale.map((s) => s.id), ['by-agent']); // 20m > 15m agent grace, but 20m << 24h human grace
  assert.equal(stale[0].ownerClass, 'agent');
});

test('classifyStaleDoing: a session claim gets the human (long) grace, never the agent one', () => {
  const twentyMin = 20 * 60 * 1000;
  const { stale } = classifyStaleDoing([{ id: 's', claimRole: 'session', claimedAt: NOW - twentyMin }], { now: NOW });
  assert.deepEqual(stale, []); // session is person-held -> long grace -> not stale at 20m
});

test('classifyStaleDoing: an entry with no locatable claim time is skipped (never a NaN age)', () => {
  const { stale } = classifyStaleDoing([{ id: 'x', claimRole: 'runner', claimedAt: undefined }], { now: NOW });
  assert.deepEqual(stale, []);
});

test('classifyStaleDoing: suggestions are advisory and NEVER describe an automatic reclaim', () => {
  const entries = [
    { id: 'agent', claimRole: 'runner', claimedAt: NOW - 60 * 60 * 1000 }, // 1h > 15m
    { id: 'human', claimRole: 'human', claimedAt: NOW - 30 * 60 * 60 * 1000 }, // 30h > 24h
  ];
  const { stale } = classifyStaleDoing(entries, { now: NOW });
  assert.equal(stale.length, 2);
  assert.match(stale.find((s) => s.id === 'agent').suggestion, /never reclaims/);
  assert.match(stale.find((s) => s.id === 'human').suggestion, /never auto-reclaimed/);
  // every entry carries the mechanical evidence, not just a verdict
  for (const s of stale) {
    assert.ok(Number.isFinite(s.ageMs) && Number.isFinite(s.thresholdMs));
  }
});

test('classifyStaleDoing: defaults are agent 15m / human 24h and are overridable', () => {
  assert.equal(STALE_DOING_DEFAULTS.agentMs, 15 * 60 * 1000);
  assert.equal(STALE_DOING_DEFAULTS.humanMs, 24 * 60 * 60 * 1000);
  const { stale } = classifyStaleDoing(
    [{ id: 'x', claimRole: 'runner', claimedAt: NOW - 5000 }],
    { now: NOW, thresholds: { agentMs: 1000, humanMs: 1000 } }, // 5s > 1s -> stale
  );
  assert.deepEqual(stale.map((s) => s.id), ['x']);
});

// --- S10: evidence-classifier advisory for stale post-delivery items -------

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TTL_DAYS = 7;

function moveEntry(id, to, ts) {
  return { type: 'work.move', payload: { id, to }, ts };
}

test('classifyStalePostDelivery: an item just past 3d in delivered is stale; at/under 3d is fresh', () => {
  const view = {
    work: {
      stale: item('stale', { status: 'delivered' }),
      fresh: item('fresh', { status: 'delivered' }),
    },
  };
  const rawEvents = [
    moveEntry('stale', 'delivered', new Date(NOW - THREE_DAYS_MS - 1000).toISOString()),
    moveEntry('fresh', 'delivered', new Date(NOW - THREE_DAYS_MS).toISOString()),
  ];
  const { stale } = classifyStalePostDelivery(view, rawEvents, { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(stale.map((s) => s.id), ['stale']);
  assert.equal(stale[0].status, 'delivered');
});

test('classifyStalePostDelivery: retrospective uses the same flat 3d threshold as delivered (D7)', () => {
  const view = { work: { r: item('r', { status: 'retrospective' }) } };
  const rawEvents = [moveEntry('r', 'retrospective', new Date(NOW - THREE_DAYS_MS - 1000).toISOString())];
  const { stale } = classifyStalePostDelivery(view, rawEvents, { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(stale.map((s) => s.id), ['r']);
  assert.equal(STALE_POST_DELIVERY_DEFAULTS.retrospectiveMs, STALE_POST_DELIVERY_DEFAULTS.deliveredMs);
});

test('classifyStalePostDelivery: cleanup is stale only past ttlDays+grace, never from cleanup-entry alone (D4)', () => {
  const view = { work: { c: item('c', { status: 'cleanup' }) } };
  const withinTtl = [moveEntry('c', 'cleanup', new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString())]; // 2d < 7d TTL
  assert.deepEqual(classifyStalePostDelivery(view, withinTtl, { now: NOW, ttlDays: TTL_DAYS }).stale, []);

  const pastTtlWithinGrace = [moveEntry('c', 'cleanup', new Date(NOW - (TTL_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString())]; // 8d > 7d TTL but < 7+3 grace
  assert.deepEqual(classifyStalePostDelivery(view, pastTtlWithinGrace, { now: NOW, ttlDays: TTL_DAYS }).stale, []);

  const pastTtlAndGrace = [moveEntry('c', 'cleanup', new Date(NOW - (TTL_DAYS * 24 * 60 * 60 * 1000) - THREE_DAYS_MS - 1000).toISOString())]; // past 7d TTL + 3d grace
  const { stale } = classifyStalePostDelivery(view, pastTtlAndGrace, { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(stale.map((s) => s.id), ['c']);
});

test('classifyStalePostDelivery: an item with no locatable entry event is skipped (never a NaN age)', () => {
  const view = { work: { x: item('x', { status: 'delivered' }) } };
  const { stale } = classifyStalePostDelivery(view, [], { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(stale, []);
});

test('classifyStalePostDelivery: only delivered/retrospective/cleanup are ever classified — other statuses are ignored', () => {
  const view = {
    work: {
      doing: item('doing', { status: 'doing' }),
      todo: item('todo', { status: 'todo' }),
      done: item('done', { status: 'done' }),
    },
  };
  const rawEvents = [
    moveEntry('doing', 'doing', new Date(NOW - 100 * THREE_DAYS_MS).toISOString()),
    moveEntry('done', 'done', new Date(NOW - 100 * THREE_DAYS_MS).toISOString()),
  ];
  const { stale } = classifyStalePostDelivery(view, rawEvents, { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(stale, []);
});

test('classifyStalePostDelivery: pure — same inputs, same output regardless of call order', () => {
  const view = { work: { a: item('a', { status: 'delivered' }) } };
  const rawEvents = [moveEntry('a', 'delivered', new Date(NOW - THREE_DAYS_MS - 1000).toISOString())];
  const first = classifyStalePostDelivery(view, rawEvents, { now: NOW, ttlDays: TTL_DAYS });
  const second = classifyStalePostDelivery(view, rawEvents, { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(first, second);
});

test('classifyStalePostDelivery: age is anchored on the SPECIFIC entry-into-status event, not the latest event of any kind', () => {
  const view = { work: { a: item('a', { status: 'delivered' }) } };
  // an OLDER unrelated event (e.g. a much earlier awaiting-approval->delivered
  // that got reverted then re-entered) must never be picked over the latest
  // real entry into `delivered` -- .at(-1) picks the latest matching entry.
  const rawEvents = [
    moveEntry('a', 'delivered', new Date(NOW - 100 * THREE_DAYS_MS).toISOString()),
    moveEntry('a', 'delivered', new Date(NOW - 1000).toISOString()), // most recent real entry: fresh
  ];
  const { stale } = classifyStalePostDelivery(view, rawEvents, { now: NOW, ttlDays: TTL_DAYS });
  assert.deepEqual(stale, []);
});

// --- S9: footprint-intersection advisory -----------------------------------

test('footprintOverlap: two READY items sharing a file path are flagged with the shared paths + resolution options', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs', 'src/y.mjs'] }),
      b: item('b', { footprint: ['src/y.mjs', 'src/z.mjs'] }),
    },
  };
  assert.deepEqual(footprintOverlap(view), [
    { a: 'a', b: 'b', shared: ['src/y.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] },
  ]);
});

test('tsk-2jn: footprintOverlap flags a conflict even when the two items spelled the SAME path differently ("./" prefix, backslash) — normalized through normalizePath like every other footprint consumer', () => {
  // Finding 6's exact failure scenario: item A declares "./src/runner/merge.mjs",
  // item B declares "src/runner/merge.mjs" -- hand-filled at different times,
  // the exact weak-signal case footprint's own doc already acknowledges.
  // Before this fix, raw Set membership missed this pair entirely.
  const view = {
    work: {
      a: item('a', { footprint: ['./src/runner/merge.mjs'] }),
      b: item('b', { footprint: ['src/runner/merge.mjs'] }),
    },
  };
  const out = footprintOverlap(view);
  assert.deepEqual(out, [
    { a: 'a', b: 'b', shared: ['./src/runner/merge.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] },
  ]);
  // The reported path is A's own AS-DECLARED spelling, never silently
  // rewritten to the normalized form -- this is a detector, not a rewriter.
  assert.equal(out[0].shared[0], './src/runner/merge.mjs');
});

test('tsk-2jn: footprintOverlap also normalizes a backslash-spelled path (a different OS/session\'s hand-filled footprint)', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src\\runner\\worktree.mjs'] }),
      b: item('b', { footprint: ['src/runner/worktree.mjs'] }),
    },
  };
  const out = footprintOverlap(view);
  assert.deepEqual(out.map((c) => [c.a, c.b]), [['a', 'b']]);
  assert.deepEqual(out[0].shared, ['src\\runner\\worktree.mjs']);
});

test('footprintOverlap: disjoint footprints (or no footprint) never conflict', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs'] }),
      b: item('b', { footprint: ['src/z.mjs'] }),
      c: item('c'), // no footprint
    },
  };
  assert.deepEqual(footprintOverlap(view), []);
});

test('footprintOverlap: a NON-ready item (unmet dep) is never in a conflict pair even if its footprint overlaps', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs'] }), // ready (no deps)
      b: item('b', { deps: ['a'], footprint: ['src/x.mjs'] }), // blocked on a -> not ready
    },
  };
  // b is not dispatchable now, so there is no parallel-dispatch conflict yet.
  assert.deepEqual(footprintOverlap(view), []);
});

test('footprintOverlap is deterministic across ready items: pairs follow FIFO order, shared keeps the first item order', () => {
  const view = {
    work: {
      first: item('first', { footprint: ['b.mjs', 'a.mjs'] }),
      second: item('second', { footprint: ['a.mjs', 'b.mjs'] }),
      third: item('third', { footprint: ['a.mjs'] }),
    },
  };
  const out = footprintOverlap(view);
  assert.deepEqual(out.map((c) => [c.a, c.b]), [['first', 'second'], ['first', 'third'], ['second', 'third']]);
  assert.deepEqual(out[0].shared, ['b.mjs', 'a.mjs']); // first item's footprint order
});

// --- tsk-3c7: dep-graph cycle detection -------------------------------------

test('detectCycles: an acyclic deps graph has zero cycles', () => {
  const view = { work: { a: item('a'), b: item('b', { deps: ['a'] }), c: item('c', { deps: ['b'] }) } };
  assert.deepEqual(detectCycles(view), []);
});

test('detectCycles: a self-dep is reported as its own one-element cycle', () => {
  const view = { work: { a: item('a', { deps: ['a'] }) } };
  assert.deepEqual(detectCycles(view), [['a']]);
});

test('detectCycles: a real 2-item cycle (a depends on b, b depends on a) is found regardless of status', () => {
  const view = {
    work: {
      a: item('a', { status: 'done', deps: ['b'] }),
      b: item('b', { status: 'blocked', deps: ['a'] }),
    },
  };
  const cycles = detectCycles(view);
  assert.equal(cycles.length, 1);
  assert.deepEqual(new Set(cycles[0]), new Set(['a', 'b']));
});

test('detectCycles: a dep pointing at an id with no matching work item is skipped, not a cycle', () => {
  const view = { work: { a: item('a', { deps: ['missing'] }) } };
  assert.deepEqual(detectCycles(view), []);
});

// --- tsk-3u2 (post-tsk-3c7 independent review): detectCycles widened from
// deps-only to the UNIFIED graph (deps + parent + mergeAfter) -- it used
// to be blind to exactly the kind of deadlock findUnifiedCycle already
// caught: a parent anchored by its own open child (frontier.mjs's
// hasOpenDescendant) whose deps/mergeAfter loops back to that same parent,
// a permanent stall no amount of waiting resolves. -------------------------

test('detectCycles: a parent anchored by a child whose OWN deps points back at the parent is now caught (mixed parent-child + blocks cycle)', () => {
  const view = {
    work: {
      p: item('p'),
      c: item('c', { parent: 'p', deps: ['p'] }),
    },
  };
  const cycles = detectCycles(view);
  assert.equal(cycles.length, 1);
  assert.deepEqual(new Set(cycles[0]), new Set(['p', 'c']));
});

test('detectCycles: a mergeAfter cycle (a deps on b, b mergeAfter a) is now caught (mixed blocks + waits-for cycle)', () => {
  const view = {
    work: {
      a: item('a', { deps: ['b'] }),
      b: item('b', { mergeAfter: ['a'] }),
    },
  };
  const cycles = detectCycles(view);
  assert.equal(cycles.length, 1);
  assert.deepEqual(new Set(cycles[0]), new Set(['a', 'b']));
});

test('detectCycles: a pure parent-child cycle (A parent B, B parent A -- never reachable via real fgos add, still checked) is caught', () => {
  const view = {
    work: {
      a: item('a', { parent: 'b' }),
      b: item('b', { parent: 'a' }),
    },
  };
  const cycles = detectCycles(view);
  assert.equal(cycles.length, 1);
  assert.deepEqual(new Set(cycles[0]), new Set(['a', 'b']));
});

test('detectCycles: a parent id with no matching work item is dropped (dangling parent), same as a dangling dep, never a phantom node', () => {
  const view = { work: { c: item('c', { parent: 'missing-parent' }) } };
  assert.deepEqual(detectCycles(view), []);
});

// --- tsk-3c7: computed-parallel-wave-schedule -------------------------------

test('computeSchedule: two ready items with disjoint footprints land in the same wave', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs'] }),
      b: item('b', { footprint: ['src/y.mjs'] }),
    },
  };
  assert.deepEqual(computeSchedule(view), { waves: [['a', 'b']] });
});

test('computeSchedule: two ready items sharing a footprint path are DEFERRED to separate waves, never refused', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs'] }),
      b: item('b', { footprint: ['src/x.mjs'] }),
    },
  };
  assert.deepEqual(computeSchedule(view), { waves: [['a'], ['b']] });
});

test('computeSchedule: an item with no declared footprint never conflicts, packs into the earliest wave', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs'] }),
      b: item('b', { footprint: ['src/x.mjs'] }),
      c: item('c'), // no footprint
    },
  };
  assert.deepEqual(computeSchedule(view), { waves: [['a', 'c'], ['b']] });
});

test('computeSchedule: a non-ready item (unmet dep) never appears in any wave', () => {
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }), // blocked on a -> not in frontier
    },
  };
  assert.deepEqual(computeSchedule(view), { waves: [['a']] });
});

// --- tsk-ik3: computeSchedule scoped to a given candidate set ---------------

test('computeSchedule: omitting candidateIds preserves default behavior (whole frontier)', () => {
  const view = {
    work: {
      a: item('a', { footprint: ['src/x.mjs'] }),
      b: item('b', { footprint: ['src/y.mjs'] }),
    },
  };
  assert.deepEqual(computeSchedule(view), computeSchedule(view, undefined));
});

test('computeSchedule: candidateIds scopes packing so a foreign item outside the set cannot steal a wave slot from an item inside it', () => {
  const view = {
    work: {
      x: item('x', { footprint: ['src/shared.mjs'] }), // outside the candidate set
      y: item('y', { footprint: ['src/shared.mjs'] }), // inside the candidate set
    },
  };
  // Unscoped: x lands in wave 0 first (frontier order), pushing y to wave 1.
  assert.deepEqual(computeSchedule(view), { waves: [['x'], ['y']] });
  // Scoped to just y: x is never a candidate at all, so it cannot occupy
  // wave 0 and defer y -- y packs into wave 0 on its own.
  assert.deepEqual(computeSchedule(view, ['y']), { waves: [['y']] });
});

test('computeSchedule: an empty candidateIds array yields no waves', () => {
  const view = {
    work: {
      a: item('a'),
      b: item('b'),
    },
  };
  assert.deepEqual(computeSchedule(view, []), { waves: [] });
});

test('computeSchedule: a candidateId naming an item that is not itself ready (unmet dep) is simply excluded, never phantomed in', () => {
  const view = {
    work: {
      a: item('a'),
      b: item('b', { deps: ['a'] }), // blocked on a -> not in frontier
    },
  };
  assert.deepEqual(computeSchedule(view, ['a', 'b']), { waves: [['a']] });
});

test('computeSchedule: candidateIds naming an unknown id is simply excluded, never phantomed in', () => {
  const view = {
    work: {
      a: item('a'),
    },
  };
  assert.deepEqual(computeSchedule(view, ['a', 'does-not-exist']), { waves: [['a']] });
});
