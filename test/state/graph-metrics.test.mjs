import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectedComponents, criticalPath, staleBlocked, greedyTopUnblock, whatIf, metricsFrame, graphMetrics } from '../../src/state/graph-metrics.mjs';

// Pure lib — every view here is a literal (foldEvents style), no fs, no
// `.fgos/` writes. connectedComponents groups work items linked by ANY unified
// edge (blocks via deps, or parent-child via parent) into independent parallel
// tracks.
function item(id, extra = {}) {
  return { id, title: id, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', ...extra };
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
  assert.equal(metrics.order_version, 1); // FRONTIER_ORDER_VERSION (S4)
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

test('greedyTopUnblock respects k', () => {
  const view = { work: { a: item('a'), b: item('b'), c: item('c') } };
  assert.equal(greedyTopUnblock(view, 2).length, 2);
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
  assert.deepEqual(Object.keys(m1), ['order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock']);
  assert.deepEqual(m1.criticalPath, { depth: 2, path: ['b', 'a'] });
  assert.deepEqual(m1.staleBlocked, [{ id: 'b', status: 'todo', blockedBy: ['a'] }]);
  assert.deepEqual(m1.topUnblock[0], { id: 'a', unblocks: 1, newlyUnblocks: 2 });
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
  assert.deepEqual(whatIf(view, 'a'), { id: 'a', exists: true, unblocksTransitive: 2, newlyReady: ['b'] });
});

test('whatIf: an unknown id is exists:false with zero impact', () => {
  assert.deepEqual(whatIf({ work: { a: item('a') } }, 'nope'), { id: 'nope', exists: false, unblocksTransitive: 0, newlyReady: [] });
});

test('whatIf: a done dependent is never counted as newly-unblocked', () => {
  const view = { work: { root: item('root'), done: item('done', { status: 'done', deps: ['root'] }) } };
  assert.deepEqual(whatIf(view, 'root'), { id: 'root', exists: true, unblocksTransitive: 0, newlyReady: [] });
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
