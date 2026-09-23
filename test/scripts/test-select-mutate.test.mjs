import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { classifyMutant, classifyOneMutant, relatedFilesForRule } from '../../scripts/test-select-mutate.mjs';

test('C2 Mutant Classifier Tests', async (t) => {
  await t.test('infra-error', () => {
    assert.equal(classifyMutant({ infraError: true }), 'infra-error');
  });
  await t.test('timeout', () => {
    assert.equal(classifyMutant({ timeout: true }), 'timeout');
  });
  await t.test('invalid-syntax', () => {
    assert.equal(classifyMutant({ syntaxError: true }), 'invalid-syntax');
  });
  await t.test('caught (related fails)', () => {
    assert.equal(classifyMutant({ relatedPassed: false }), 'caught');
  });
  await t.test('equivalent-or-missing-test (both pass)', () => {
    assert.equal(classifyMutant({ relatedPassed: true, fullPassed: true }), 'equivalent-or-missing-test');
  });
  await t.test('confirmed-miss (related passes, full fails)', () => {
    assert.equal(classifyMutant({ relatedPassed: true, fullPassed: false }), 'confirmed-miss');
  });
});

test('AC 5: Registry mutant metadata generator injects ruleHash and boundary', async (t) => {
  const crypto = await import('node:crypto');
  const { generateMutantPayload, generateMutantPayloads, computeRuleHash } = await import('../../scripts/test-select-mutate.mjs');
  const { mutants } = await import('../test-ownership-mutants.mjs');
  const { MANIFEST } = await import('../test-ownership.mjs');

  await t.test('computeRuleHash calculates sha256 of normalized rule and is invariant to status', () => {
    const sampleRule1 = { id: 'sample', status: 'shadow', pattern: 'src/sample.mjs', directTests: ['test/b.mjs', 'test/a.mjs'], boundaryTests: [] };
    const sampleRule2 = { pattern: 'src/sample.mjs', status: 'live', id: 'sample', boundaryTests: [], directTests: ['test/a.mjs', 'test/b.mjs'] };
    const hash1 = computeRuleHash(sampleRule1);
    const hash2 = computeRuleHash(sampleRule2);
    assert.equal(hash1, hash2, 'Hash must be identical regardless of status or key ordering');
    assert.match(hash1, /^[a-f0-9]{64}$/);
    assert.equal(computeRuleHash(null), null);
  });

  await t.test('generateMutantPayload rejects mutant lacking boundary and rule lacking boundary', () => {
    const mutantWithoutBoundary = {
      id: 'm-bad-1',
      ruleId: 'intake-classify',
      file: 'src/intake/classify.mjs',
      find: 'foo',
      replace: 'bar'
    };
    // intake-classify in MANIFEST has no boundary property, and mutant has no boundary -> must return null
    const payload = generateMutantPayload(mutantWithoutBoundary, MANIFEST);
    assert.equal(payload, null, 'Must reject mutant without boundary metadata instead of fabricating defaults');
  });

  await t.test('generateMutantPayload preserves explicit boundary when provided', () => {
    const rawMutant = {
      id: 'm-test-2',
      ruleId: 'intake-classify',
      file: 'src/intake/classify.mjs',
      boundary: 'custom-boundary-1',
      find: 'foo',
      replace: 'bar'
    };

    const payload = generateMutantPayload(rawMutant, MANIFEST);
    assert.ok(payload);
    assert.equal(payload.boundary, 'custom-boundary-1');
    assert.ok(payload.ruleHash);
    assert.match(payload.ruleHash, /^[a-f0-9]{64}$/);
  });

  await t.test('generateMutantPayloads successfully enriches all registry mutants with ruleHash and boundary', () => {
    const payloads = generateMutantPayloads(mutants, MANIFEST);
    assert.ok(payloads.length > 0);
    for (const p of payloads) {
      assert.ok(p.id, 'Mutant must have id');
      assert.ok(p.ruleHash, `Mutant ${p.id} must have ruleHash`);
      assert.match(p.ruleHash, /^[a-f0-9]{64}$/, `Mutant ${p.id} ruleHash must be sha256`);
      assert.ok(p.boundary, `Mutant ${p.id} must have boundary`);
      assert.notEqual(p.boundary.trim(), '');
    }
  });
});

// --- C2 classification rows against classifyOneMutant, via a fake runner --
// (the pure classifyMutant() switch above proves the 6 branches individually;
// these prove the surrounding baseline/mutate/run wiring actually reaches
// each branch correctly, without spawning a real worktree or test process.)

const createdDirs = [];
after(() => {
  for (const dir of createdDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tmpWorktree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mutate-fake-'));
  createdDirs.push(dir);
  return dir;
}

function writeMutantFixture(worktreePath, relFile, content) {
  const full = path.join(worktreePath, relFile);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

test('classifyOneMutant: the 6 classification rows via a fake runner', async (t) => {
  const rule = { id: 'fake-rule', directTests: ['test/fake.test.mjs'], boundaryTests: [] };
  const mutant = { id: 'm-fake', ruleId: 'fake-rule', file: 'src/fake.mjs', find: 'ORIGINAL', replace: 'MUTATED' };

  function setup() {
    const worktreePath = tmpWorktree();
    writeMutantFixture(worktreePath, mutant.file, 'const x = "ORIGINAL";\n');
    return worktreePath;
  }

  await t.test('caught: baseline green, mutated related run red', () => {
    const worktreePath = setup();
    let call = 0;
    const runRelated = () => {
      call++;
      return call === 1 ? { status: 0, signal: null, stderr: '' } : { status: 1, signal: null, stderr: '' };
    };
    const { classification } = classifyOneMutant({ mutant, rule, worktreePath, runRelated });
    assert.equal(classification, 'caught');
  });

  await t.test('equivalent-or-missing-test: baseline green, related green, full also green', () => {
    const worktreePath = setup();
    const runRelated = () => ({ status: 0, signal: null, stderr: '' });
    const execFileFn = () => '';
    const { classification } = classifyOneMutant({ mutant, rule, worktreePath, runRelated, execFileFn });
    assert.equal(classification, 'equivalent-or-missing-test');
  });

  await t.test('confirmed-miss: baseline green, related green, full run throws (red)', () => {
    const worktreePath = setup();
    const runRelated = () => ({ status: 0, signal: null, stderr: '' });
    const execFileFn = () => {
      throw new Error('full suite failed');
    };
    const { classification } = classifyOneMutant({ mutant, rule, worktreePath, runRelated, execFileFn });
    assert.equal(classification, 'confirmed-miss');
  });

  await t.test('timeout: mutated related run killed by signal', () => {
    const worktreePath = setup();
    let call = 0;
    const runRelated = () => {
      call++;
      return call === 1 ? { status: 0, signal: null, stderr: '' } : { status: null, signal: 'SIGTERM', stderr: '' };
    };
    const { classification } = classifyOneMutant({ mutant, rule, worktreePath, runRelated });
    assert.equal(classification, 'timeout');
  });

  await t.test('invalid-syntax: mutated related run red with a SyntaxError in stderr', () => {
    const worktreePath = setup();
    let call = 0;
    const runRelated = () => {
      call++;
      return call === 1
        ? { status: 0, signal: null, stderr: '' }
        : { status: 1, signal: null, stderr: 'SyntaxError: Unexpected token' };
    };
    const { classification } = classifyOneMutant({ mutant, rule, worktreePath, runRelated });
    assert.equal(classification, 'invalid-syntax');
  });

  await t.test('infra-error: baseline (unmutated) related run is already red', () => {
    const worktreePath = setup();
    const runRelated = () => ({ status: 1, signal: null, stderr: '' });
    const { classification, reason } = classifyOneMutant({ mutant, rule, worktreePath, runRelated });
    assert.equal(classification, 'infra-error');
    assert.match(reason, /baseline/);
  });
});

test('classifyOneMutant: invalid when the rule has no related test files at all', () => {
  const worktreePath = tmpWorktree();
  const mutant = { id: 'm-empty', ruleId: 'no-tests-rule', file: 'src/fake.mjs', find: 'x', replace: 'y' };
  writeMutantFixture(worktreePath, mutant.file, 'x');
  const { classification, reason } = classifyOneMutant({
    mutant,
    rule: { id: 'no-tests-rule', directTests: [], boundaryTests: [] },
    worktreePath,
  });
  assert.equal(classification, 'invalid');
  assert.match(reason, /no related test files/);
});

test('classifyOneMutant: invalid when the mutant find string is not present in the target file', () => {
  const worktreePath = tmpWorktree();
  const rule = { id: 'fake-rule-2', directTests: ['test/fake.test.mjs'], boundaryTests: [] };
  const mutant = { id: 'm-nomatch', ruleId: 'fake-rule-2', file: 'src/fake.mjs', find: 'DOES_NOT_EXIST', replace: 'y' };
  writeMutantFixture(worktreePath, mutant.file, 'const x = "ORIGINAL";\n');
  const runRelated = () => ({ status: 0, signal: null, stderr: '' });
  const { classification } = classifyOneMutant({ mutant, rule, worktreePath, runRelated });
  assert.equal(classification, 'invalid');
});

test('relatedFilesForRule dedupes directTests + boundaryTests and returns [] for a missing rule', () => {
  assert.deepEqual(relatedFilesForRule(null), []);
  assert.deepEqual(
    relatedFilesForRule({ directTests: ['a.mjs', 'b.mjs'], boundaryTests: ['b.mjs', 'c.mjs'] }).sort(),
    ['a.mjs', 'b.mjs', 'c.mjs'],
  );
});

// --- Integration: a real mutant, real detached git worktree, real spawns --

test('integration: a real mutant (m-edit-1) is applied and classified inside a real detached git worktree', async () => {
  const { mutants } = await import('../test-ownership-mutants.mjs');
  const { MANIFEST } = await import('../test-ownership.mjs');
  const mutant = mutants.find((m) => m.id === 'm-edit-1');
  assert.ok(mutant, 'fixture mutant m-edit-1 must exist in the registry');
  const rule = MANIFEST.find((r) => r.id === mutant.ruleId);
  assert.ok(rule, 'rule for m-edit-1 must exist in the manifest');

  const repoRoot = process.cwd();
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mutate-integration-'));
  createdDirs.push(baseDir);
  const worktreePath = fs.mkdtempSync(path.join(baseDir, 'wt-'));
  execFileSync('git', ['worktree', 'add', '--detach', worktreePath, 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  try {
    fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(worktreePath, 'node_modules'), 'dir');
    const { classification } = classifyOneMutant({ mutant, rule, worktreePath });
    // A real mutant against real code: any outcome other than 'invalid'/'infra-error'
    // proves the whole wire-up (baseline, mutation, related run, full run) actually
    // executed real processes end to end -- the thing that never happened before.
    assert.ok(
      ['caught', 'confirmed-miss', 'equivalent-or-missing-test'].includes(classification),
      `expected a real classification outcome, got "${classification}"`,
    );
  } finally {
    execFileSync('git', ['worktree', 'remove', '-f', worktreePath], { cwd: repoRoot, encoding: 'utf8' });
  }
});

