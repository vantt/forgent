// test/runner/execution/run-pre-admission.test.mjs -- what runUnit refuses before a unit run exists: the
// refusals here never launch a seat and leave no unit directory behind.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { runUnit as coreRunUnit, resolveGitRoots, assertRepositoryForWrites, snapshotRunnerConfig } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/runner-config-error.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { holdLockInChild } from '../../helpers/hold-lock-in-child.mjs';
import { setupGitRepo, panelSeats, withCancelHandlers } from '../../helpers/run-unit-repo-fixture.mjs';

test('outside a repository resolveGitRoots refuses unless the caller is read-only, and a unit that writes is refused there', () => {
  const dir = fs.realpathSync(makeFixtureDir('fgos-run-norepo-'));
  assert.throws(() => resolveGitRoots(dir), (err) => err instanceof RunnerConfigError && /must run inside a git repository/.test(err.message));
  const roots = resolveGitRoots(dir, { allowNoRepository: true });
  assert.deepEqual(roots, { worktreeRoot: dir, mainCheckoutRoot: dir, isLinkedWorktree: false, notARepository: true });
  assert.doesNotThrow(() => assertRepositoryForWrites(roots, dir, { writes: false }));
  assert.throws(() => assertRepositoryForWrites(roots, dir, { writes: true }), (err) => err instanceof RunnerConfigError && /must run inside a git repository/.test(err.message));
  const { repoRoot } = setupGitRepo();
  assert.doesNotThrow(() => assertRepositoryForWrites(resolveGitRoots(repoRoot, { allowNoRepository: true }), repoRoot, { writes: true }), 'inside a repository nothing is refused');
});

test('runUnit refuses a unit that writes in a directory that is no repository, before any unit run exists', async () => {
  const dir = fs.realpathSync(makeFixtureDir('fgos-run-norepo-write-'));
  await assert.rejects(
    () => coreRunUnit({ unitData: { id: 'u-norepo', objective: 'Write a file', capability: 'docs:write', writes: ['docs'] }, cwd: dir, repoRoot: dir }),
    (err) => err instanceof RunnerConfigError && /must run inside a git repository/.test(err.message),
  );
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'assignments')) && fs.readdirSync(path.join(dir, '.fgos', 'assignments')).some((name) => name.startsWith('unit-run-')), false);
});

test('mutating gate: refuses mutating unit in main checkout', async () => {
  const { repoRoot } = setupGitRepo();
  const unit = {
    id: 'u-mutate-main',
    objective: 'Implement feature in main',
    capability: 'docs:write',
    writes: ['src/feature.txt'],
  };

  await assert.rejects(
    async () => {
      await runUnit({
        unitData: unit,
        repoRoot,
        cwd: repoRoot, // main checkout, not linked worktree!
        pattern: 'solo',
      });
    },
    /resolves to the main checkout.*a mutating dispatch must run in a linked git worktree/,
  );
});

test('an anonymized input that cannot be copied is refused before any unit directory exists', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const assignmentsDir = path.join(repoRoot, '.fgos', 'assignments');
  const before = fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir) : [];
  await assert.rejects(
    () =>
      runUnit({
        unitData: { id: 'u-bad', objective: 'x', capability: 'docs:write', writes: [], inputs: ['unit-run:unit-run-nope/producer'], anonymizeInputs: true },
        repoRoot,
        cwd: worktreeDir,
        worktree: worktreeDir,
        pattern: 'solo',
      }),
    /handoff-ref-unresolved: unit-run:unit-run-nope\/producer: no-such-run/,
  );
  assert.deepEqual(fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir) : [], before);
});

test('a unit-run input that cannot be resolved is refused before any unit directory exists', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const assignmentsDir = path.join(repoRoot, '.fgos', 'assignments');
  const before = fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir) : [];
  await assert.rejects(
    () =>
      runUnit({
        unitData: { id: 'u-bad', objective: 'x', capability: 'docs:write', writes: [], inputs: ['unit-run:unit-run-nope/producer'] },
        repoRoot,
        cwd: worktreeDir,
        worktree: worktreeDir,
        pattern: 'solo',
      }),
    /handoff-ref-unresolved: unit-run:unit-run-nope\/producer: no-such-run/,
  );
  const after = fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir) : [];
  assert.deepEqual(after, before);
});

test('a unit persona whose file cannot be parsed or has the wrong shape refuses the run and leaves no unit directory', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(repoRoot, 'fgos', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'fgos', 'agents', 'broken-keeper.yaml'), 'name: broken-keeper\ndescription: fine\npersona:\n  voice: direct: no hedging\n');
  fs.writeFileSync(path.join(repoRoot, 'fgos', 'agents', 'mapping-keeper.yaml'), 'name: mapping-keeper\ndescription: fine\ndecision_boundary:\n  must_escalate:\n    - Escalate when: budget exceeded\n');
  const attempt = (persona) => runUnit({
    unitData: { id: 'u-bad-persona', objective: 'Write docs', capability: 'docs:write', writes: [], persona },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  await assert.rejects(attempt('broken-keeper'), /persona "broken-keeper" \(fgos\/agents\/broken-keeper\.yaml\) cannot be parsed: .*line 4/);
  await assert.rejects(attempt('mapping-keeper'), /persona "mapping-keeper" \(fgos\/agents\/mapping-keeper\.yaml\) decision_boundary\.must_escalate\[0\] is a mapping/);
  const assignments = path.join(repoRoot, '.fgos', 'assignments');
  assert.deepEqual(fs.existsSync(assignments) ? fs.readdirSync(assignments) : [], [], 'no unit directory is left behind');
});

test('custody admission refusal creates and announces no Unit run', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const { child, exited } = await holdLockInChild('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir });
  let announced = false;
  try {
    await assert.rejects(() => runUnit({
      unitData: { id: 'busy-admission', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
      repoRoot, cwd: worktreeDir, worktree: worktreeDir,
      onUnitRunCreated: () => { announced = true; },
    }), { code: 'dispatch-in-flight' });
    assert.equal(announced, false);
    const assignments = path.join(repoRoot, '.fgos', 'assignments');
    assert.deepEqual(fs.existsSync(assignments) ? fs.readdirSync(assignments) : [], []);
  } finally { child.kill('SIGKILL'); await exited; }
});

test('conflicting explicit pattern selectors refuse selector-conflict before admission and reserve nothing', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const unitData = { id: 'u-conflict', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed' };
  await assert.rejects(
    runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' }),
    (err) => err instanceof RunnerConfigError && err.code === 'selector-conflict',
  );
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'assignments')), false);
});

test('unit-explicit verify on panel or debate refuses before admission', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  await assert.rejects(
    runUnit({
      unitData: { id: 'u-panel-verify', objective: 'Panel with verify', capability: 'docs:write', writes: [], pattern: 'panel', verify: 'npm test', seats: panelSeats(3) },
      repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'panel',
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'verify-command-unsupported',
  );
  await assert.rejects(
    runUnit({
      unitData: { id: 'u-panel-opt-verify', objective: 'Panel with verify flag', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
      verify: 'npm test',
      repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'panel',
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'verify-command-unsupported',
  );
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'assignments')), false);
});

test('after a signal a new unit is refused before anything is created', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  await withCancelHandlers(async (exits) => {
    process.emit('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.deepEqual(exits, [143]);
    await assert.rejects(
      runUnit({ unitData: { id: 'late', capability: 'unserved:answer', objective: 'x', writes: [] }, repoRoot, cwd: worktreeDir }),
      { code: 'run-cancelled', signal: 'SIGTERM' },
    );
    assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'assignments')), false);
  });
});

test('an unreadable pin refuses collaboration-pin-unusable', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-unreadable-pin');
  fs.mkdirSync(unitDir, { recursive: true });
  const record = {
    unit: { id: 'u-unusable', capability: 'docs:write', writes: [], objective: 'Do write' },
    pattern: 'solo',
    seatSchema: 2,
    collaboration: 'corrupted-string',
    seats: [{ seat: 'producer', role: 'producer', posture: { writer: true } }],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));

  await assert.rejects(
    () => coreRunUnit({
      resumeUnitRunId: 'unit-run-unreadable-pin',
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'collaboration-pin-unusable',
  );

  // Unregistered loop refuses
  record.collaboration = {
    pattern: { name: 'solo' },
    effective: { loop: 'unknown-loop', params: {} },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  await assert.rejects(
    () => coreRunUnit({
      resumeUnitRunId: 'unit-run-unreadable-pin',
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'collaboration-pin-unusable',
  );

  // Unregistered pattern refuses
  record.collaboration = {
    pattern: { name: 'unknown-pattern-name' },
    effective: { loop: 'solo', params: {} },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  await assert.rejects(
    () => coreRunUnit({
      resumeUnitRunId: 'unit-run-unreadable-pin',
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'collaboration-pin-unusable',
  );
});
