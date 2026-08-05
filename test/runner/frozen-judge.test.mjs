import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frozenJudgeHits, FROZEN_JUDGE_PATTERNS, footprintDiffHits } from '../../src/runner/frozen-judge.mjs';

test('frozenJudgeHits: no changed files -> no hits', () => {
  assert.deepEqual(frozenJudgeHits([], []), []);
});

test('frozenJudgeHits: a changed file matching no sensitive pattern -> no hits', () => {
  assert.deepEqual(frozenJudgeHits(['src/state/work.mjs'], []), []);
});

test('frozenJudgeHits: an undeclared test file is a hit, rule "test sources"', () => {
  const hits = frozenJudgeHits(['test/state/work.test.mjs'], []);
  assert.deepEqual(hits, [{ file: 'test/state/work.test.mjs', rule: 'test sources' }]);
});

test('frozenJudgeHits: a *.test.mjs file outside a test/ dir still matches "test file"', () => {
  const hits = frozenJudgeHits(['src/state/work.test.mjs'], []);
  assert.deepEqual(hits, [{ file: 'src/state/work.test.mjs', rule: 'test file' }]);
});

test('frozenJudgeHits: package.json is a hit, rule "package manifest"', () => {
  const hits = frozenJudgeHits(['package.json'], []);
  assert.deepEqual(hits, [{ file: 'package.json', rule: 'package manifest' }]);
});

test('frozenJudgeHits: package-lock.json is a hit, rule "lockfile"', () => {
  const hits = frozenJudgeHits(['package-lock.json'], []);
  assert.deepEqual(hits, [{ file: 'package-lock.json', rule: 'lockfile' }]);
});

test('frozenJudgeHits: a CI workflow file is a hit, rule "CI config"', () => {
  const hits = frozenJudgeHits(['.github/workflows/ci.yml'], []);
  assert.deepEqual(hits, [{ file: '.github/workflows/ci.yml', rule: 'CI config' }]);
});

test('frozenJudgeHits: a sensitive file DECLARED in footprint is not a hit', () => {
  assert.deepEqual(frozenJudgeHits(['package.json'], ['package.json']), []);
});

test('frozenJudgeHits: footprint match is exact-path only, no directory-prefix or glob', () => {
  const hits = frozenJudgeHits(['test/state/work.test.mjs'], ['test/']);
  assert.deepEqual(hits, [{ file: 'test/state/work.test.mjs', rule: 'test sources' }]);
});

test('frozenJudgeHits: normalizes "./" prefix and backslashes the same on both sides', () => {
  assert.deepEqual(frozenJudgeHits(['./package.json'], ['package.json']), []);
  assert.deepEqual(frozenJudgeHits(['src\\foo.test.mjs'], []), [{ file: 'src/foo.test.mjs', rule: 'test file' }]);
});

test('frozenJudgeHits: an absent/undefined footprint behaves like an empty one', () => {
  assert.deepEqual(frozenJudgeHits(['package.json']), [{ file: 'package.json', rule: 'package manifest' }]);
});

test('frozenJudgeHits: multiple changed files each classified independently, declared ones excluded', () => {
  const hits = frozenJudgeHits(
    ['src/state/work.mjs', 'package.json', 'test/state/work.test.mjs'],
    ['package.json'],
  );
  assert.deepEqual(hits, [{ file: 'test/state/work.test.mjs', rule: 'test sources' }]);
});

test('FROZEN_JUDGE_PATTERNS has no .bee-specific rule (fgOS has no .bee/)', () => {
  assert.ok(!FROZEN_JUDGE_PATTERNS.some((p) => p.rule === 'bee verify config'));
});

// --- tsk-2ig: footprintDiffHits (D3 mức 1, D5 absent-footprint exemption) --

test('footprintDiffHits: footprint declared, a file OUTSIDE it is a hit regardless of what kind of file it is', () => {
  const hits = footprintDiffHits(['src/state/work.mjs'], ['src/other.mjs']);
  assert.deepEqual(hits, [{ file: 'src/state/work.mjs' }]);
});

test('footprintDiffHits: a file INSIDE the declared footprint is never a hit', () => {
  assert.deepEqual(footprintDiffHits(['src/state/work.mjs'], ['src/state/work.mjs']), []);
});

test('footprintDiffHits: NO declared footprint (absent) exempts the whole diff -- empty hits (D5)', () => {
  assert.deepEqual(footprintDiffHits(['src/state/work.mjs', 'package.json', 'random.txt']), []);
});

test('footprintDiffHits: NO declared footprint (empty array) also exempts the whole diff (D5)', () => {
  assert.deepEqual(footprintDiffHits(['src/state/work.mjs'], []), []);
});

test('footprintDiffHits: multiple files, only the ones outside the declared footprint are hits', () => {
  const hits = footprintDiffHits(
    ['src/state/work.mjs', 'src/other.mjs', 'random.txt'],
    ['src/state/work.mjs'],
  );
  assert.deepEqual(hits, [{ file: 'src/other.mjs' }, { file: 'random.txt' }]);
});

test('footprintDiffHits: normalizes "./" prefix and backslashes the same way frozenJudgeHits does', () => {
  assert.deepEqual(footprintDiffHits(['./src/x.mjs'], ['src/x.mjs']), []);
  assert.deepEqual(footprintDiffHits(['src\\y.mjs'], ['src/x.mjs']), [{ file: 'src/y.mjs' }]);
});

// --- tsk-2ig regression: frozenJudgeHits's own narrow behavior is untouched -

test('frozenJudgeHits regression: still only flags FROZEN_JUDGE_PATTERNS files, unaffected by footprintDiffHits existing', () => {
  const hits = frozenJudgeHits(['src/other.mjs', 'package.json'], ['src/state/work.mjs']);
  // src/other.mjs matches no sensitive pattern -> not a hit here, even though
  // footprintDiffHits WOULD flag it. package.json is a hit (declared elsewhere).
  assert.deepEqual(hits, [{ file: 'package.json', rule: 'package manifest' }]);
});
