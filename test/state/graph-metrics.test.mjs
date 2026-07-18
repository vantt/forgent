import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectedComponents, graphMetrics } from '../../src/state/graph-metrics.mjs';

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
