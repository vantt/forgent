// graph-adapter.test.mjs — the Work side of the graph and write-scope packages. The overlap rule and the graph
// algorithms are owned by the packages' own tests (packages/write-scope, packages/graph); this file owns only what the
// adapter adds: the Work footprint policy (no claim, unreadable entry) and fail-closed behaviour.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureGitAddon } from '../helpers/git-addon.mjs';
import { collidingFootprints, packWaves, GraphAdapterError } from '../../src/state/graph-adapter.mjs';
import { footprintOverlapAmong, computeSchedule } from '../../src/state/graph-metrics.mjs';

ensureGitAddon();

const cand = (id, footprint) => ({ id, footprint });

test('a directory and a file inside it conflict (Work advisory acceptance case: src/state/ and src/state/frontier.mjs)', () => {
  const pairs = collidingFootprints([cand('dir', ['src/state/']), cand('file', ['src/state/frontier.mjs']), cand('apart', ['docs/a.md'])]);
  assert.deepEqual(pairs, [{ a: 'dir', b: 'file', shared: ['src/state/'] }]);
});

test('a candidate with a missing or empty footprint made no claim and never conflicts', () => {
  assert.deepEqual(collidingFootprints([cand('a', ['src']), cand('none'), cand('empty', []), cand('b', ['src/x'])]), [{ a: 'a', b: 'b', shared: ['src'] }]);
});

test('an entry that cannot be read makes that one candidate conflict with every other, in candidate order, naming the entry', () => {
  const pairs = collidingFootprints([cand('a', ['src']), cand('bad', ['../escape', 'docs']), cand('none'), cand('b', ['lib'])]);
  assert.deepEqual(pairs.map(({ a, b }) => `${a}/${b}`), ['a/bad', 'bad/none', 'bad/b']);
  assert.ok(pairs.every(({ shared }) => shared.includes('../escape')));
});

test('an unreadable candidate and a readable one that also collide report one pair with both shared lists merged', () => {
  const pairs = collidingFootprints([cand('a', ['docs/x']), cand('bad', ['docs', '/abs'])]);
  assert.deepEqual(pairs, [{ a: 'a', b: 'bad', shared: ['docs/x', '/abs'] }]);
});

test('a non-string footprint entry is unreadable, not dropped', () => {
  const pairs = collidingFootprints([cand('a', ['src']), cand('odd', [42])]);
  assert.deepEqual(pairs, [{ a: 'a', b: 'odd', shared: ['42'] }]);
});

test('an entry or a footprint the package drops as too long or too large conflicts with every other candidate, never reads as absent', () => {
  const long = `src/${'x'.repeat(1030)}`;
  assert.deepEqual(collidingFootprints([cand('a', [long]), cand('b', ['docs/'])]).map(({ a, b }) => [a, b]), [['a', 'b']]);
  const many = Array.from({ length: 513 }, (_, n) => `d${n}/`);
  assert.deepEqual(collidingFootprints([cand('a', many), cand('b', ['hot/x'])]).map(({ a, b }) => [a, b]), [['a', 'b']]);
});

test('a pair scan that stops at its cap throws a named error and never answers a partial list', () => {
  const many = Array.from({ length: 460 }, (_, n) => cand(`i${n}`, ['src']));
  assert.throws(() => footprintOverlapAmong(many), (error) => error instanceof GraphAdapterError && error.code === 'footprint-scan-truncated');
  const view = { work: Object.fromEntries(many.map((c) => [c.id, { id: c.id, title: c.id, kind: 'task', status: 'todo', deps: [], footprint: c.footprint, risk: 'light', refs: [], verify: 'true' }])) };
  assert.throws(() => computeSchedule(view), (error) => error.code === 'footprint-scan-truncated');
});

test('packWaves defers a conflicting candidate to a later wave and keeps candidate order within a wave', () => {
  const candidates = [cand('a'), cand('b'), cand('c'), cand('d')];
  assert.deepEqual(packWaves(candidates, [{ a: 'a', b: 'b' }, { a: 'b', b: 'c' }]), [['a', 'c', 'd'], ['b']]);
  assert.deepEqual(packWaves([], []), []);
});
