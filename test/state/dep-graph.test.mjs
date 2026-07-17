import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDepCycle, assertNoCycle } from '../../src/state/dep-graph.mjs';
import { WorkValidationError } from '../../src/state/work.mjs';

// Pure lib — every workMap here is a literal object keyed by id, same shape
// as view.work (frontier.test.mjs's style); no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file.
function item(id, deps = []) {
  return { id, title: id, kind: 'task', status: 'todo', deps, risk: 'low', refs: [], verify: 'true' };
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
