import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findDepCycle,
  assertNoCycle,
  buildUnifiedEdges,
  findUnifiedCycle,
  assertNoUnifiedCycle,
} from '../../src/state/dep-graph.mjs';
import { WorkValidationError } from '../../src/state/work.mjs';

// Pure lib — every workMap here is a literal object keyed by id, same shape
// as view.work (frontier.test.mjs's style); no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file.
function item(id, deps = [], parent = undefined) {
  const built = { id, title: id, kind: 'task', status: 'todo', deps, risk: 'low', refs: [], verify: 'true' };
  if (parent !== undefined) built.parent = parent;
  return built;
}

test('findDepCycle on an empty map is null', () => {
  assert.equal(findDepCycle({}), null);
});

test('findDepCycle detects a self-loop', () => {
  const workMap = { a: item('a', ['a']) };
  assert.deepEqual(findDepCycle(workMap), ['a', 'a']);
});

test('findDepCycle detects a 2-node A<->B cycle', () => {
  const workMap = { a: item('a', ['b']), b: item('b', ['a']) };
  const cycle = findDepCycle(workMap);
  assert.ok(cycle, 'expected a cycle to be found');
  // Entry point depends on iteration order (a or b first); either rotation
  // of the same 2-cycle is a correct result.
  const rotations = [
    ['a', 'b', 'a'],
    ['b', 'a', 'b'],
  ];
  assert.ok(
    rotations.some((r) => JSON.stringify(r) === JSON.stringify(cycle)),
    `cycle ${JSON.stringify(cycle)} is not a rotation of the expected A<->B cycle`,
  );
});

test('findDepCycle detects a 3-node cycle (A->B->C->A)', () => {
  const workMap = { a: item('a', ['b']), b: item('b', ['c']), c: item('c', ['a']) };
  const cycle = findDepCycle(workMap);
  assert.ok(cycle, 'expected a cycle to be found');
  assert.equal(cycle[0], cycle[cycle.length - 1], 'cycle path must start and end on the same id');
  assert.equal(cycle.length, 4);
});

test('findDepCycle accepts a diamond (two paths converge on a shared dep, no cycle)', () => {
  // a -> b -> d, a -> c -> d : two paths to d, never a cycle.
  const workMap = {
    d: item('d'),
    b: item('b', ['d']),
    c: item('c', ['d']),
    a: item('a', ['b', 'c']),
  };
  assert.equal(findDepCycle(workMap), null);
});

test('findDepCycle accepts a forward-only DAG', () => {
  const workMap = {
    c: item('c'),
    b: item('b', ['c']),
    a: item('a', ['b']),
  };
  assert.equal(findDepCycle(workMap), null);
});

test('assertNoCycle accepts a candidate whose deps stay acyclic against the workMap', () => {
  const workMap = { base: item('base') };
  assert.doesNotThrow(() => assertNoCycle(item('dependent', ['base']), workMap));
});

test('assertNoCycle rejects a candidate self-loop', () => {
  const workMap = {};
  assert.throws(() => assertNoCycle(item('a', ['a']), workMap), WorkValidationError);
});

test('assertNoCycle rejects a candidate that would close a 2-node A<->B cycle', () => {
  // b already depends on a (stored); admitting a candidate "a" that depends
  // on b would close the cycle a -> b -> a.
  const workMap = { b: item('b', ['a']) };
  assert.throws(() => assertNoCycle(item('a', ['b']), workMap), WorkValidationError);
});

test('assertNoCycle rejects a candidate that would close a 3-node cycle', () => {
  // b -> c already stored; admitting candidate "a" depending on b, where c
  // already (transitively) closes back to a, would create a -> b -> c -> a.
  const workMap = { b: item('b', ['c']), c: item('c', ['a']) };
  assert.throws(() => assertNoCycle(item('a', ['b']), workMap), WorkValidationError);
});

test('assertNoCycle checks the CANDIDATE deps, overriding any stale stored entry for its own id', () => {
  // workMap has a stale/stored "a" with different (acyclic) deps; the
  // candidate's own deps are what must be evaluated for admission.
  const workMap = { a: item('a', []), b: item('b', ['a']) };
  // Candidate edits a's deps to point at b — a -> b -> a would close a cycle.
  assert.throws(() => assertNoCycle(item('a', ['b']), workMap), WorkValidationError);
});

test('assertNoCycle accepts a candidate that fits into a diamond', () => {
  const workMap = {
    d: item('d'),
    b: item('b', ['d']),
    c: item('c', ['d']),
  };
  assert.doesNotThrow(() => assertNoCycle(item('a', ['b', 'c']), workMap));
});

test('assertNoCycle error message composes the cycle path (single-arg WorkValidationError)', () => {
  const workMap = { b: item('b', ['a']) };
  try {
    assertNoCycle(item('a', ['b']), workMap);
    assert.fail('expected assertNoCycle to throw');
  } catch (err) {
    assert.ok(err instanceof WorkValidationError);
    assert.match(err.message, /dependency cycle/);
    assert.match(err.message, /a -> b -> a/);
  }
});

// --- S2a: unified typed-edge graph (blocks + parent-child) -----------------

test('buildUnifiedEdges projects a deps entry to a "blocks" edge (I -> d)', () => {
  const workMap = { a: item('a', ['b']), b: item('b') };
  assert.deepEqual(buildUnifiedEdges(workMap), [{ from: 'a', to: 'b', kind: 'blocks' }]);
});

test('buildUnifiedEdges projects parent to a "parent-child" edge pointing FROM the parent', () => {
  // child c has parent p -> edge is p -> c (parent waits for child), never c -> p.
  const workMap = { p: item('p'), c: item('c', [], 'p') };
  assert.deepEqual(buildUnifiedEdges(workMap), [{ from: 'p', to: 'c', kind: 'parent-child' }]);
});

test('buildUnifiedEdges combines blocks + parent-child edges for a mixed item, in id order', () => {
  const workMap = { a: item('a', ['b'], 'p'), b: item('b'), p: item('p') };
  assert.deepEqual(buildUnifiedEdges(workMap), [
    { from: 'a', to: 'b', kind: 'blocks' },
    { from: 'p', to: 'a', kind: 'parent-child' },
  ]);
});

test('buildUnifiedEdges yields no edges for an item with empty deps and no parent', () => {
  assert.deepEqual(buildUnifiedEdges({ a: item('a') }), []);
});

test('findUnifiedCycle on an empty map is null', () => {
  assert.equal(findUnifiedCycle({}), null);
});

test('findUnifiedCycle still catches a deps self-loop (upstream S1 case preserved)', () => {
  const workMap = { a: item('a', ['a']) };
  assert.deepEqual(findUnifiedCycle(workMap), ['a', 'a']);
});

test('findUnifiedCycle still catches a 2-node deps A<->B cycle (upstream S1 case preserved)', () => {
  const workMap = { a: item('a', ['b']), b: item('b', ['a']) };
  const cycle = findUnifiedCycle(workMap);
  assert.ok(cycle, 'expected a cycle to be found');
  const rotations = [
    ['a', 'b', 'a'],
    ['b', 'a', 'b'],
  ];
  assert.ok(rotations.some((r) => JSON.stringify(r) === JSON.stringify(cycle)));
});

test('findUnifiedCycle still catches a 3-node deps cycle (A->B->C->A)', () => {
  const workMap = { a: item('a', ['b']), b: item('b', ['c']), c: item('c', ['a']) };
  const cycle = findUnifiedCycle(workMap);
  assert.ok(cycle, 'expected a cycle to be found');
  assert.equal(cycle[0], cycle[cycle.length - 1]);
  assert.equal(cycle.length, 4);
});

test('findUnifiedCycle catches a pure parent-child chain cycle (A parent B, B parent A)', () => {
  // a's parent is b (edge b -> a), b's parent is a (edge a -> b): a <-> b.
  const workMap = { a: item('a', [], 'b'), b: item('b', [], 'a') };
  const cycle = findUnifiedCycle(workMap);
  assert.ok(cycle, 'expected a parent-child cycle to be found');
  assert.equal(cycle[0], cycle[cycle.length - 1]);
});

test('findUnifiedCycle catches a MIXED cycle: A is parent of B (edge A->B), B.deps=[A] (edge B->A)', () => {
  // The deps-only graph misses this entirely (deps alone: b -> a, no cycle).
  const workMap = { a: item('a'), b: item('b', ['a'], 'a') };
  assert.equal(findDepCycle(workMap), null, 'sanity: deps-only graph sees no cycle here');
  const cycle = findUnifiedCycle(workMap);
  assert.ok(cycle, 'expected the unified graph to catch the mixed cycle');
  assert.equal(cycle[0], cycle[cycle.length - 1]);
});

test('findUnifiedCycle accepts a diamond (shared dep, no cycle)', () => {
  const workMap = {
    d: item('d'),
    b: item('b', ['d']),
    c: item('c', ['d']),
    a: item('a', ['b', 'c']),
  };
  assert.equal(findUnifiedCycle(workMap), null);
});

test('findUnifiedCycle accepts a forward-only DAG', () => {
  const workMap = {
    c: item('c'),
    b: item('b', ['c']),
    a: item('a', ['b']),
  };
  assert.equal(findUnifiedCycle(workMap), null);
});

test('findUnifiedCycle accepts a parent-child lineage tree with no cycle (grandparent -> parent -> child)', () => {
  const workMap = {
    gp: item('gp'),
    p: item('p', [], 'gp'),
    c: item('c', [], 'p'),
  };
  assert.equal(findUnifiedCycle(workMap), null);
});

test('assertNoUnifiedCycle accepts a candidate whose deps+parent stay acyclic', () => {
  const workMap = { base: item('base'), p: item('p') };
  assert.doesNotThrow(() => assertNoUnifiedCycle(item('dependent', ['base'], 'p'), workMap));
});

test('assertNoUnifiedCycle rejects a candidate self-loop', () => {
  assert.throws(() => assertNoUnifiedCycle(item('a', ['a']), {}), WorkValidationError);
});

test('assertNoUnifiedCycle rejects a candidate that would close a parent-child cycle', () => {
  // b already declares parent a (edge a -> b); admitting candidate "a" with
  // parent "b" would close the cycle a -> b -> a.
  const workMap = { b: item('b', [], 'a') };
  assert.throws(() => assertNoUnifiedCycle(item('a', [], 'b'), workMap), WorkValidationError);
});

test('assertNoUnifiedCycle rejects a candidate that would close the MIXED cycle', () => {
  // a exists plain; admitting candidate "b" with parent "a" AND deps=["a"]
  // closes a -> b (parent-child) -> a (blocks) in one write.
  const workMap = { a: item('a') };
  assert.throws(() => assertNoUnifiedCycle(item('b', ['a'], 'a'), workMap), WorkValidationError);
});

test('assertNoUnifiedCycle accepts a candidate that fits into a diamond', () => {
  const workMap = {
    d: item('d'),
    b: item('b', ['d']),
    c: item('c', ['d']),
  };
  assert.doesNotThrow(() => assertNoUnifiedCycle(item('a', ['b', 'c']), workMap));
});

test('assertNoUnifiedCycle error message composes the cycle path (single-arg WorkValidationError)', () => {
  const workMap = { b: item('b', [], 'a') };
  try {
    assertNoUnifiedCycle(item('a', [], 'b'), workMap);
    assert.fail('expected assertNoUnifiedCycle to throw');
  } catch (err) {
    assert.ok(err instanceof WorkValidationError);
    assert.match(err.message, /graph cycle/);
    assert.match(err.message, /a -> b -> a/);
  }
});
