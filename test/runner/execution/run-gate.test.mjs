// test/runner/execution/run-gate.test.mjs — the git roots of a run, persona rendering and the mutating gate of a unit-run assignment

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import { resolveGitRoots } from '../../../src/git/inspect.mjs';
import { snapshotRunnerConfig } from '../../../src/native/execution-door.mjs';
import { loadRunnerConfigForDir } from '../../../src/runner/dispatch/config-twin.mjs';
import { digest as seatConfigDigest } from '../../../src/seat-binding/client.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

import { writeProjectConfig, readProjectConfig } from '../../helpers/config-fixture.mjs';
import { setupGitRepo } from '../../helpers/run-unit-repo-fixture.mjs';

test('resolveGitRoots resolves main checkout root and linked worktree', () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const roots = resolveGitRoots(worktreeDir);
  assert.equal(fs.realpathSync(roots.mainCheckoutRoot), fs.realpathSync(repoRoot));
  assert.equal(fs.realpathSync(roots.worktreeRoot), fs.realpathSync(worktreeDir));
  assert.equal(roots.isLinkedWorktree, true);
});

test('mutating gate: refuses mutating unit when worktree mismatches unit.json', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const otherWt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-other-wt-'));
  execFileSync('git', ['worktree', 'add', '-b', 'other-branch', otherWt], { cwd: repoRoot, stdio: 'ignore' });

  const { executeAssignment } = await import('../../../src/runner/dispatch/assignment-runner.mjs');
  const unitRunId = 'unit-run-mismatch-test';
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });

  const unitRecord = {
    unit: { id: 'u-1', objective: 'Tamper worktree', capability: 'docs:write', writes: ['file.txt'] },
    overrides: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));

  const assignment = {
    assignmentId: `${unitRunId}/producer/1`,
    unitRunId,
    role: 'producer',
    round: 1,
    mutation: 'mutating',
    provenance: { kind: 'unit-run', unitRunId, role: 'producer', round: 1 },
    expectedOutputs: [],
    contextRefs: [],
    writes: ['file.txt'],
  };

  await assert.rejects(
    async () => {
      await executeAssignment(assignment, {
        cwd: otherWt,
        repoRoot,
        isReadOnlyMode: false,
      });
    },
    /worktree mismatch: cwd.*does not match unit\.json worktree/,
  );
});

test('persona rendering: renders persona body from core/agents/<persona>.yaml in prompt', async () => {
  const { repoRoot } = setupGitRepo();
  const { renderAssignmentPrompt } = await import('../../../src/runner/dispatch/assignment.mjs');

  const assignment = {
    assignmentId: 'asgn_test_persona_001',
    role: 'reviewer',
    objective: 'Review code',
  };

  const prompt = renderAssignmentPrompt(assignment, {
    persona: { value: 'code-reviewer' },
    repoRoot: process.cwd(), // Point to real repo with core/agents/code-reviewer.yaml
  });

  assert.ok(prompt.includes('# Persona'));
  assert.ok(prompt.includes('code-reviewer'));
  assert.ok(prompt.includes('Evidence-first'));
  assert.ok(prompt.includes('## Decision Boundaries'));
  assert.ok(prompt.includes('can_decide') || prompt.includes('Can decide:'));
  assert.ok(prompt.includes('must_escalate') || prompt.includes('Must escalate:'));
});

// ── Gate branches that sit behind the worktree check ──────────────────────────

async function mutatingGateFixture({ writeUnitJson = true, corrupt = false, twoCandidates = false, attempts = null, bindings = null } = {}) {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const { executeAssignment } = await import('../../../src/runner/dispatch/assignment-runner.mjs');
  const unitRunId = 'unit-run-gate-' + Math.random().toString(36).slice(2, 8);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });
  if (twoCandidates) {
    // A second executor behind the first, so a fallback walk has somewhere to go. The replay reads the
    // committed config, so the second executor is committed to the project config.
    const file = path.join(repoRoot, '.fgos', 'config.json');
    const committed = readProjectConfig(repoRoot);
    const runner = committed.runner;
    runner.executors['test-node-2'] = { ...runner.executors['test-node'], providerModel: 'node2' };
    runner.capabilities['docs:write'].prefer = [{ executor: 'test-node' }, { executor: 'test-node-2' }];
    runner.modelPolicies.node2 = runner.modelPolicies.node;
    writeProjectConfig(repoRoot, committed);
  }
  const record = {
    unit: { id: 'u-gate', objective: 'Gate probe', capability: 'docs:write', writes: ['file.txt'] },
    overrides: [],
    // Taking the snapshot fills in the config's missing defaults, so the digest is read after it.
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
  };
  // What a bind records: the digest of the seat config it was bound under.
  const configDigest = seatConfigDigest({ runner: loadRunnerConfigForDir(repoRoot) });
  if (attempts) record.bindings = { 'producer/1': attempts(unitRunId, configDigest) };
  if (bindings) record.bindings = bindings(unitRunId, configDigest);
  if (writeUnitJson) {
    fs.writeFileSync(path.join(unitDir, 'unit.json'), corrupt ? '{not json' : JSON.stringify(record, null, 2));
  }
  const baseAssignment = {
    assignmentId: `${unitRunId}/producer/1`,
    unitRunId,
    role: 'producer',
    round: 1,
    mutation: 'mutating',
    provenance: { kind: 'unit-run', unitRunId, role: 'producer', round: 1 },
    expectedOutputs: [],
    contextRefs: [],
    writes: ['file.txt'],
  };
  const run = (assignment) => executeAssignment(assignment, { cwd: worktreeDir, repoRoot, isReadOnlyMode: false });
  return { baseAssignment, run, record, repoRoot, configDigest };
}

test('mutating gate: refuses a unit-run assignment whose unit.json is missing', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({ writeUnitJson: false });
  await assert.rejects(() => run(baseAssignment), /refers to missing unit\.json/);
});

test('mutating gate: refuses a unit-run assignment whose unit.json is corrupt', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({ corrupt: true });
  await assert.rejects(() => run(baseAssignment), /has corrupt unit\.json/);
});

test('mutating gate: refuses a unit-run assignment that carries no binding', async () => {
  const { baseAssignment, run } = await mutatingGateFixture();
  await assert.rejects(() => run(baseAssignment), /carries no binding/);
});

// What bind() records for each fixture executor: its own family is its pool, its cell's model, and the digest of
// the seat config it was bound under.
const gateBinding = (executor, configDigest) => ({ executor, invocation: 'cli-default', pool: executor === 'test-node' ? 'node' : 'node2', model: 'node-std', bindingInput: { configDigest } });
const gateAttempt = (unitRunId, n, executor, outcome, configDigest) => ({
  role: 'producer',
  round: 1,
  assignmentId: n === 0 ? `${unitRunId}/producer/1` : `${unitRunId}/producer/1-fb${n}`,
  binding: gateBinding(executor, configDigest),
  ...(outcome ? { outcome } : {}),
});

test('mutating gate: refuses a binding that differs from the one bind() recomputes', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({ attempts: (id, digest) => [gateAttempt(id, 0, 'test-node', undefined, digest)] });
  const forged = { ...baseAssignment, binding: { executor: 'some-other-executor', tier: 'standard', posture: 'write' } };
  await assert.rejects(() => run(forged), /binding mismatch/);
});

test('mutating gate: refuses an assignment that pins an executor other than the verified binding', async () => {
  const { baseAssignment, run, record } = await mutatingGateFixture({ attempts: (id, digest) => [gateAttempt(id, 0, 'test-node', undefined, digest)] });
  const { bind } = await import('../../../src/runner/execution/bind.mjs');
  const verified = bind(
    { unit: record.unit, role: 'producer', readOnly: false, overrides: [] },
    { runnerConfig: record.configSnapshot.runner, session: {} },
  );
  assert.ok(verified.executor, 'fixture must produce a real binding');
  const pinned = {
    ...baseAssignment,
    binding: { executor: verified.executor, pool: verified.pool, tier: verified.tier, posture: verified.posture },
    policy: { preferExecutor: 'rogue-executor' },
  };
  await assert.rejects(() => run(pinned), /pins executor "rogue-executor"/);
});

test('mutating gate: an assignment whose attempt the runner never recorded has no binding input to replay', async () => {
  const { baseAssignment, run } = await mutatingGateFixture();
  const forged = { ...baseAssignment, binding: { executor: 'test-node', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(forged), (err) => err.code === 'binding-replay-snapshot-missing');
});

test('mutating gate: a config committed after the bind refuses the write, whatever copy of the config unit.json holds', async () => {
  const { baseAssignment, run, record, repoRoot, configDigest } = await mutatingGateFixture({ attempts: (id, digest) => [gateAttempt(id, 0, 'test-node', undefined, digest)] });
  const verified = (await import('../../../src/runner/execution/bind.mjs')).bind(
    { unit: record.unit, role: 'producer', readOnly: false, overrides: [] },
    { runnerConfig: loadRunnerConfigForDir(repoRoot), session: {} },
  );
  const assignment = { ...baseAssignment, binding: { executor: verified.executor, pool: verified.pool, tier: verified.tier, posture: verified.posture } };
  // The snapshot kept in unit.json still carries the config the seat was bound under; the committed one moved on.
  const file = path.join(repoRoot, '.fgos', 'config.json');
  const committed = readProjectConfig(repoRoot);
  committed.runner.defaults.tier = 'advanced';
  committed.runner.modelPolicies.node.advanced = 'node-adv';
  writeProjectConfig(repoRoot, committed);
  assert.notEqual(seatConfigDigest({ runner: loadRunnerConfigForDir(repoRoot) }), configDigest);
  await assert.rejects(() => run(assignment), (err) => err.code === 'binding-replay-config-mismatch');
});

test('mutating gate: a recorded bindingInput that carries a config copy of its own is ignored; only its digest is read', async () => {
  const { baseAssignment, run, record, repoRoot } = await mutatingGateFixture({
    attempts: (id, digest) => [{ ...gateAttempt(id, 0, 'test-node', undefined, digest), binding: { ...gateBinding('test-node', digest), bindingInput: { configDigest: digest, config: { modelPolicies: { node: { standard: 'forged-model' } } } } } }],
  });
  const verified = (await import('../../../src/runner/execution/bind.mjs')).bind(
    { unit: record.unit, role: 'producer', readOnly: false, overrides: [] },
    { runnerConfig: loadRunnerConfigForDir(repoRoot), session: {} },
  );
  const assignment = { ...baseAssignment, binding: { executor: verified.executor, pool: verified.pool, tier: verified.tier, posture: verified.posture } };
  // Reaches the point after the gate: the executable it would spawn is not the point of this test.
  await run(assignment).catch((err) => { assert.doesNotMatch(String(err.message), /binding (mismatch|input)|different seat config/); });
});

test('mutating gate: a fallback attempt must follow a provider-limit attempt the runner recorded', async () => {
  // Attempt 0 settled as a pass, yet the assignment claims the second candidate.
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    attempts: (id, digest) => [gateAttempt(id, 0, 'test-node', 'pass', digest), gateAttempt(id, 1, 'test-node-2', undefined, digest)],
  });
  const forged = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/producer/1-fb1`, binding: { executor: 'test-node-2', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(forged), /binding mismatch/);
});

test('mutating gate: an assignment the runner never recorded cannot claim a fallback binding', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    attempts: (id, digest) => [gateAttempt(id, 0, 'test-node', 'provider-limit', digest)],
  });
  const forged = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/producer/1-fb1`, binding: { executor: 'test-node-2', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(forged), (err) => err.code === 'binding-replay-snapshot-missing');
});

test('mutating gate: a recorded fallback attempt cannot be rebound to the candidate that already hit its limit', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    attempts: (id, digest) => [gateAttempt(id, 0, 'test-node', 'provider-limit', digest), gateAttempt(id, 1, 'test-node-2', undefined, digest)],
  });
  const replay = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/producer/1-fb1`, binding: { executor: 'test-node', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(replay), /binding mismatch/);
});

test('mutating gate: a producer cannot borrow the fallback attempt of another role or round', async () => {
  const other = (id, role, round, digest) => [
    { role, round, assignmentId: `${id}/${role}/${round}`, binding: gateBinding('test-node', digest), outcome: 'provider-limit' },
    { role, round, assignmentId: `${id}/${role}/${round}-fb1`, binding: gateBinding('test-node-2', digest) },
  ];
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    bindings: (id, digest) => ({
      'producer/1': [gateAttempt(id, 0, 'test-node', 'pass', digest)],
      'checker/1': other(id, 'checker', 1, digest),
      'producer/2': other(id, 'producer', 2, digest),
    }),
  });
  const claimed = { executor: 'test-node-2', tier: 'standard', posture: 'workspace-write' };
  for (const borrowed of ['checker/1-fb1', 'producer/2-fb1']) {
    const forged = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/${borrowed}`, binding: claimed };
    await assert.rejects(() => run(forged), (err) => err.code === 'binding-replay-snapshot-missing', borrowed);
  }
});
