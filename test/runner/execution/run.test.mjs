// test/runner/execution/run.test.mjs — Tests for the fgos run door and its mutating gate

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import crypto from 'node:crypto';
import { resolveSeats } from '../../../src/runner/execution/seat-resolver.mjs';
import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { runUnit as coreRunUnit, resolveGitRoots, assertRepositoryForWrites, snapshotRunnerConfig, detectHerdrPresent } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError, loadRunnerConfigForDir, runnerOriginsOf } from '../../../src/runner/dispatch/config.mjs';
import { seatConfigDigestOf } from '../../../src/runner/execution/seat-policy.mjs';
import { writeUnitSummary, buildUnitSummary } from '../../../src/runner/execution/unit-summary.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { installCancelOnSignal, resetCancelRequest } from '../../../src/run-supervisor/cancel-registry.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

// Confined runs mount a private tmpfs over /tmp, so fixtures that the executor
// must reach (command, worker script, worktree) live outside it.
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { holdLockInChild } from '../../helpers/hold-lock-in-child.mjs';
import { writeProjectConfig, readProjectConfig } from '../../helpers/config-fixture.mjs';

function setupGitRepo() {
  const tmp = makeFixtureDir('fgos-run-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test Runner'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@runner.local'], { cwd: tmp, stdio: 'ignore' });

  // Commit initial file
  fs.writeFileSync(path.join(tmp, 'README.md'), '# Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmp, stdio: 'ignore' });

  // Create .fgos/config.json
  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const runnerConfig = {
    runner: {
      defaultExecutor: 'test-node',
      defaults: { tier: 'standard' },
      modelPolicies: {
        node: {
          standard: 'node-std',
          flagship: 'node-flagship',
        },
      },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test node agent',
          allowCrossProvider: true,
          command: process.execPath,
          args: [],
          providerModel: 'node',
          invocations: [
            {
              id: 'cli-default',
              via: 'cli',
              adapter: 'cli-spawn',
              confinement: { backend: 'bwrap' },
              command: process.execPath,
              args: [],
            },
          ],
        },
      },
      capabilities: {
        'docs:write': {
          prefer: [{ executor: 'test-node' }],
          rigor: 'standard',
        },
        'docs:review': {
          prefer: [{ executor: 'test-node' }],
          persona: 'code-reviewer',
          rigor: 'standard',
        },
        // Declared, but its only executor has no model at the tier it asks for: policy refuses every unit that names it.
        'unserved:answer': {
          prefer: [{ executor: 'test-node' }],
          tier: 'frontier',
        },
      },
      patterns: { seatBinding: { schema: 1 } },
      loops: {
        reviewed: {
          maxRounds: 2,
          checkersByRigor: {
            standard: ['reviewer'],
            high: ['reviewer', 'red-team'],
            critical: ['reviewer', 'red-team', 'tester'],
          },
        },
      },
    },
  };
  writeProjectConfig(tmp, runnerConfig);

  // Create linked worktree
  const worktreeDir = makeFixtureDir('fgos-run-wt-');
  execFileSync('git', ['worktree', 'add', '-b', 'wt-branch', worktreeDir], { cwd: tmp, stdio: 'ignore' });

  return { repoRoot: tmp, worktreeDir };
}

test('detectHerdrPresent needs the herdr marker and a socket that exists', () => {
  const sock = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-herdr-probe-')), 'herdr.sock');
  assert.equal(detectHerdrPresent({}), false);
  assert.equal(detectHerdrPresent({ HERDR_ENV: '1' }), false);
  assert.equal(detectHerdrPresent({ HERDR_ENV: '1', HERDR_SOCKET_PATH: sock }), false);
  fs.writeFileSync(sock, '');
  assert.equal(detectHerdrPresent({ HERDR_ENV: '1', HERDR_SOCKET_PATH: sock }), true);
  assert.equal(detectHerdrPresent({ HERDR_SOCKET_PATH: sock }), false);
});

test('resolveGitRoots resolves main checkout root and linked worktree', () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const roots = resolveGitRoots(worktreeDir);
  assert.equal(fs.realpathSync(roots.mainCheckoutRoot), fs.realpathSync(repoRoot));
  assert.equal(fs.realpathSync(roots.worktreeRoot), fs.realpathSync(worktreeDir));
  assert.equal(roots.isLinkedWorktree, true);
});

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

test('snapshotRunnerConfig captures hash and filtered runner config from main checkout', () => {
  const { repoRoot } = setupGitRepo();
  const loaded = loadRunnerConfigForDir(repoRoot);
  assert.ok(runnerOriginsOf(loaded), 'loaded config must carry internal origins metadata');
  const snap = snapshotRunnerConfig(repoRoot, loaded);
  assert.ok(snap.hash && typeof snap.hash === 'string');
  assert.ok(snap.runner.capabilities['docs:write']);
  const serialized = JSON.stringify(snap.runner);
  assert.equal(JSON.parse(serialized).origins, undefined, 'snapshot runner must persist no provenance in serialized form');
  assert.equal(Object.keys(snap.runner).includes('origins'), false);
});

test('runUnit runs solo read-only unit end-to-end', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const unit = {
    id: 'u-docs-1',
    objective: 'Write docs',
    capability: 'docs:write',
    writes: [],
  };

  const res = await runUnit({
    unitData: unit,
    repoRoot,
    cwd: worktreeDir,
    pattern: 'solo',
  });

  assert.ok(res.unitRunId.startsWith('unit-run-'));
  assert.equal(res.rounds, 1);
  assert.equal(res.results.length, 1);

  // Check unit.json was written
  const unitJsonPath = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json');
  assert.ok(fs.existsSync(unitJsonPath));
  const record = JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
  assert.equal(record.unit.id, 'u-docs-1');
  assert.equal(record.worktree, fs.realpathSync(worktreeDir));
  const summary = JSON.parse(fs.readFileSync(path.join(path.dirname(unitJsonPath), 'unit-summary.json'), 'utf8'));
  assert.equal(summary.unitRunId, res.unitRunId);
  assert.equal(summary.outcome, res.outcome);
  assert.ok(summary.settledAt);
});

test('architecture guard: src/runner/execution/run.mjs does NOT import state, coordination, or worktree', () => {
  const runFile = path.resolve('src/runner/execution/run.mjs');
  const content = fs.readFileSync(runFile, 'utf8');
  assert.ok(!/from\s+['"].*state\//.test(content));
  assert.ok(!/from\s+['"].*coordination\//.test(content));
  assert.ok(!/from\s+['"].*worktree/.test(content));
  assert.ok(!/from\s+['"].*merge/.test(content));
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
  const configDigest = seatConfigDigestOf(loadRunnerConfigForDir(repoRoot)).digest;
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
  assert.notEqual(seatConfigDigestOf(loadRunnerConfigForDir(repoRoot)).digest, configDigest);
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

// A worker that always settles as done, whatever it was asked: enough to reach the checker role.
function writeSettlingWorker(dir) {
  const script = path.join(dir, 'settling-worker.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      // A confined worker may only write the run's outbox; an unconfined one writes the run dir.
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    }
    `,
  );
  return script;
}

function reviewedConfig(repoRoot, executorNames) {
  const cfg = readProjectConfig(repoRoot);
  const script = writeSettlingWorker(repoRoot);
  const executors = {};
  for (const name of executorNames) {
    // Each executor is its own provider family (providerModel), with a distinct command name.
    const command = path.join(repoRoot, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
  }
  cfg.runner.executors = executors;
  delete cfg.runner.capabilities['unserved:answer']; // its pool named the executor this config replaces
  for (const name of executorNames) cfg.runner.modelPolicies[name] = { nano: `${name}-nano`, standard: `${name}-std`, advanced: `${name}-adv`, flagship: `${name}-flagship`, frontier: `${name}-frontier` };
  const prefer = executorNames.map((executor) => ({ executor }));
  cfg.runner.capabilities['docs:write'] = { prefer, rigor: 'standard', tier: 'standard' };
  cfg.runner.capabilities['docs:review'] = { prefer, persona: 'code-reviewer', rigor: 'standard', tier: 'standard' };
  cfg.runner.defaultExecutor = executorNames[0];
  writeProjectConfig(repoRoot, cfg);
}

test('a reviewed run with a single provider family refuses the checker instead of self-reviewing', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const res = await runUnit({
    unitData: { id: 'u-indep-1', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
  });
  assert.equal(res.outcome, 'policy-refusal');
  const checker = res.results.find((r) => r.seat === 'reviewer');
  assert.equal(checker.refused.reason, 'independence-unsatisfiable');
});

// A panel unit declares its seats: `n` producer members and one synthesizer.
function panelSeats(n) {
  return [...Array.from({ length: n }, (_, i) => ({ seat: `member-${i + 1}`, role: 'producer' })), { seat: 'synthesizer', role: 'synthesizer' }];
}

function panelRun(id, members) {
  const { repoRoot, worktreeDir } = setupGitRepo();
  return { repoRoot, worktreeDir, pattern: 'panel', id };
}

const summaryOf = (repoRoot, res) => JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit-summary.json'), 'utf8'));

test('a panel with fewer provider families than members runs anyway: seats share families in pool order and the summary says so', async () => {
  const { repoRoot, worktreeDir, pattern } = panelRun('u-panel-2', 6);
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await runUnit({
    unitData: { id: 'u-panel-2', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(6) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern,
  });
  assert.equal(res.outcome, 'pass');
  assert.ok(!res.results.some((r) => r.refused), 'no seat is refused for sharing a family');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((n) => byRole[`member-${n}`]),
    ['alpha', 'beta', 'gamma', 'alpha', 'beta', 'gamma'],
    'seats are bound in listed order, each on the first unused family in pool order, then the least used',
  );
  const summary = summaryOf(repoRoot, res);
  assert.equal(summary.seats.filter((seat) => seat.kind === 'panelist').length, 6);
  assert.deepEqual(summary.sharedFamilies.map((entry) => entry.seats.length).sort(), [2, 2, 3]);
  const alpha = summary.sharedFamilies.find((entry) => entry.seats.includes('member-1/1'));
  assert.deepEqual(alpha.seats, ['member-1/1', 'member-4/1', 'synthesizer/1']);
});

test('a panel with enough provider families lands every seat on its own family, the synthesizer on one no panelist used, and only the synthesizer is told to read the panelist reports', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-refs', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(res.results.map((r) => r.runResult?.executorId), ['alpha', 'beta', 'gamma', 'delta']);
  assert.equal(summaryOf(repoRoot, res).sharedFamilies, undefined);
  const members = res.results.filter((r) => r.seat.startsWith('member-')).map((r) => r.runResult?.executorId);
  const synth = res.results.find((r) => r.seat === 'synthesizer');
  assert.ok(synth?.runResult?.executorId, `synthesizer should have run, got ${JSON.stringify(res).slice(0, 1500)}`);
  assert.ok(!members.includes(synth.runResult.executorId), 'synthesizer shares a provider family with a panelist');
  const assignmentOf = (role) =>
    JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, role, '1', 'assignment.json'), 'utf8'));

  const refs = assignmentOf('synthesizer').contextRefs;
  assert.equal(refs.length, 3, `synthesizer refs: ${JSON.stringify(refs)}`);
  for (const [i, ref] of refs.entries()) {
    assert.ok(path.isAbsolute(ref), `ref is absolute: ${ref}`);
    assert.ok(ref.includes(`/member-${i + 1}/`), `ref ${i} points at member-${i + 1}: ${ref}`);
    assert.ok(/(report-\d+|agent-report)\.md$/.test(ref), `ref is a report: ${ref}`);
    assert.ok(fs.existsSync(ref), `ref exists: ${ref}`);
  }
  for (const n of [1, 2, 3]) assert.deepEqual(assignmentOf(`member-${n}`).contextRefs, []);

  // Each role is told its own task: the panelists the plain objective, the synthesizer a synthesis of it.
  for (const n of [1, 2, 3]) assert.equal(assignmentOf(`member-${n}`).objective, 'Review the design');
  const synthObjective = assignmentOf('synthesizer').objective;
  assert.match(synthObjective, /synthesizer/i);
  assert.ok(synthObjective.includes('Review the design'), 'the panel\'s task is quoted to the synthesizer');
});

test('a unit-run input reaches the roles as the absolute path of that role\'s report, resolved once into unit.json; a resume refuses a record from a newer release', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData, extra = {}) =>
    runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo', ...extra });

  const first = await run({ id: 'u-a', objective: 'Write docs', capability: 'docs:write', writes: [] });
  assert.equal(first.outcome, 'pass');
  const reportOfA = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);

  const second = await run({
    id: 'u-b',
    objective: 'Build on it',
    capability: 'docs:write',
    writes: [],
    inputs: ['docs/a.md', `unit-run:${first.unitRunId}/producer`],
  });
  assert.equal(second.outcome, 'pass');
  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', second.unitRunId);
  const expected = ['docs/a.md', reportOfA];
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8')).contextRefs, expected);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8')).resolvedInputs, expected);

  // A resume reuses the stored list: it neither re-reads nor re-checks the earlier report.
  fs.writeFileSync(reportOfA, 'edited after the fact\n');
  const resumed = await run(undefined, { resumeUnitRunId: second.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8')).resolvedInputs, expected);

  // A unit run recorded without the resolved list cannot be resumed.
  const unitJson = JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8'));
  delete unitJson.resolvedInputs;
  fs.writeFileSync(path.join(dirOfB, 'unit.json'), JSON.stringify(unitJson));
  await assert.rejects(() => run(undefined, { resumeUnitRunId: second.unitRunId }), /no resolvedInputs/);

  // A record carrying a seatSchema from a newer release is refused on resume and left untouched.
  const firstPath = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId, 'unit.json');
  fs.writeFileSync(firstPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(firstPath, 'utf8')), seatSchema: 3 }));
  await assert.rejects(
    () => run(undefined, { resumeUnitRunId: first.unitRunId }),
    (err) => err.code === 'record-from-newer-release' && /seatSchema/.test(err.message),
  );
  assert.equal(JSON.parse(fs.readFileSync(firstPath, 'utf8')).seatSchema, 3, 'the refused record is left untouched');

  // Schema 1 and 2 records are accepted by the fence
  fs.writeFileSync(firstPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(firstPath, 'utf8')), seatSchema: 1 }));
  const resumed1 = await run(undefined, { resumeUnitRunId: first.unitRunId });
  assert.equal(resumed1.outcome, 'pass');

  fs.writeFileSync(firstPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(firstPath, 'utf8')), seatSchema: 2 }));
  const resumed2 = await run(undefined, { resumeUnitRunId: first.unitRunId });
  assert.equal(resumed2.outcome, 'pass');
});

test('anonymizeInputs hands the role a copy under a neutral name, keeps the mapping in unit.json, and a resume reuses it', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData, extra = {}) =>
    runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo', ...extra });

  const first = await run({ id: 'u-a', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const reportOfA = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);
  const original = fs.readFileSync(reportOfA);

  const second = await run({
    id: 'u-b',
    objective: 'Judge it',
    capability: 'docs:write',
    writes: [],
    inputs: ['docs/a.md', `unit-run:${first.unitRunId}/producer`],
    anonymizeInputs: true,
  });
  assert.equal(second.outcome, 'pass');
  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', second.unitRunId);
  const copy = path.join(dirOfB, 'inputs', 'seat-A.md');
  const expected = ['docs/a.md', copy];
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8')).contextRefs, expected);
  assert.ok(fs.readFileSync(copy).equals(original));

  const unitJson = JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8'));
  assert.deepEqual(unitJson.resolvedInputs, expected);
  assert.deepEqual(unitJson.inputMap, [{ name: 'seat-A.md', input: `unit-run:${first.unitRunId}/producer`, source: reportOfA }]);

  // Neither the brief's assignment nor its context refs name the earlier run or role.
  const assignmentText = fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8');
  assert.ok(!assignmentText.includes(first.unitRunId), 'earlier unit run id not in the assignment');

  // A resume reuses the stored copy and list; the source is not read again.
  fs.writeFileSync(reportOfA, 'edited after the fact\n');
  const resumed = await run(undefined, { resumeUnitRunId: second.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8')).resolvedInputs, expected);
  assert.ok(fs.readFileSync(copy).equals(original));
});

test('an anonymized input that cannot be copied is refused before any unit directory exists', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
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
  reviewedConfig(repoRoot, ['alpha']);
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

test('a reviewed run never lets the producer family also check its own work; the reviewer is told to review and handed the producer\'s report', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await runUnit({
    unitData: { id: 'u-role-task', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
  });
  assert.equal(res.outcome, 'pass');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.equal(byRole.producer, 'alpha');
  assert.equal(byRole.reviewer, 'beta', 'the reviewer must run on a different provider family than the producer');
  const assignmentOf = (role) =>
    JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, role, '1', 'assignment.json'), 'utf8'));

  assert.equal(assignmentOf('producer').objective, 'Write docs', 'the producer is given the task itself');
  assert.deepEqual(assignmentOf('producer').contextRefs, []);

  const reviewer = assignmentOf('reviewer');
  assert.match(reviewer.objective, /reviewer/i);
  assert.match(reviewer.objective, /do not change any file/i);
  assert.ok(reviewer.objective.includes('Write docs'), 'the reviewer is told what the work was supposed to be');
  assert.equal(reviewer.contextRefs.length, 1);
  assert.ok(reviewer.contextRefs[0].includes('/producer/'), `the reviewer reads the producer's report: ${reviewer.contextRefs[0]}`);
  assert.ok(fs.existsSync(reviewer.contextRefs[0]));
});

test('panel members run on different provider families; when they take every family the synthesizer still runs, on the least used one', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await runUnit({
    unitData: { id: 'u-panel-synth-2', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  const members = res.results.filter((r) => r.seat.startsWith('member-')).map((r) => r.runResult?.executorId);
  assert.equal(members.length, 3);
  assert.equal(new Set(members).size, 3, `panelists must not share a provider family, got ${members.join(',')}`);
  const synth = res.results.find((r) => r.seat === 'synthesizer');
  assert.equal(synth.refused, undefined);
  assert.equal(synth.runResult.executorId, 'alpha', 'every family is used once, so pool order breaks the tie');
  assert.deepEqual(synth.binding.provenance.familySpread.value.sharedWith, ['member-1']);
});

// A worker that writes a file in its worktree and never touches git.
function writeFileWritingWorker(repoRoot, verdict = 'pass') {
  const script = path.join(repoRoot, 'settling-worker.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (true) {
      fs.mkdirSync('src', { recursive: true });
      fs.writeFileSync('src/feature.txt', 'feature\\n');
    }
    if (match) {
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Added the feature file', assessment: { verdict: ${JSON.stringify(verdict)} } }));
    }
    `,
  );
}

test('after a producer round passes, the runner commits what the worker wrote, with the agent summary as message', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeFileWritingWorker(repoRoot);
  const before = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim();

  const res = await runUnit({
    unitData: { id: 'u-commit', objective: 'Implement feature', capability: 'docs:write', writes: ['src/feature.txt'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.results[0].commit.status, 'committed');
  assert.deepEqual(res.results[0].commit.files, ['src/feature.txt']);
  assert.equal(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), 'chore(u-commit): Added the feature file');
  assert.notEqual(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), before);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), '', 'nothing left uncommitted');
  const unitRecord = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'), 'utf8'));
  assert.equal(Object.values(unitRecord.bindings)[0][0].commit.status, 'committed', 'the run record says what the runner committed');
});

test('mutating producer findings preserve dirty work and never create a runner commit', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeFileWritingWorker(repoRoot, 'findings');
  const before = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim();
  const res = await runUnit({
    unitData: { id: 'u-findings-no-commit', objective: 'Implement feature while retaining findings', capability: 'docs:write', writes: ['src/feature.txt'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'findings');
  assert.equal(res.results[0].runResult.classification.execution.status, 'completed');
  assert.equal(res.results[0].runResult.classification.confidence.level, 'verified');
  assert.equal(res.results[0].commit, undefined);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), before);
  assert.equal(fs.readFileSync(path.join(worktreeDir, 'src', 'feature.txt'), 'utf8'), 'feature\n');
  assert.match(execFileSync('git', ['status', '--porcelain'], { cwd: worktreeDir, encoding: 'utf8' }), /\?\? src\//);
  const record = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'), 'utf8'));
  const attempt = Object.values(record.bindings)[0][0];
  assert.equal(attempt.outcome, 'findings');
  assert.equal(attempt.commit, undefined);
});

// A worker that reports whether it can read a peer's report and which assignment directories it can see.
function writePeerProbingWorker(dir, peerReport) {
  fs.writeFileSync(
    path.join(dir, 'settling-worker.mjs'),
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const code = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.code; } };
      const peer = code(() => fs.readFileSync(${JSON.stringify(peerReport)}));
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\npeer-read: ' + peer + '\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    }
    `,
  );
}

test('a blind unit runs confined with its peers\' run state hidden; the same unit unblind reads it', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' });
  const reportOf = (res) => fs.readFileSync(path.join(repoRoot, res.results[0].runResult.settleReports[0].path), 'utf8');

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  assert.equal(first.outcome, 'pass');
  writePeerProbingWorker(repoRoot, path.join(repoRoot, first.results[0].runResult.settleReports[0].path));

  const unblind = await run({ id: 'u-open', objective: 'Look around', capability: 'docs:write', writes: [] });
  assert.equal(unblind.outcome, 'pass');
  assert.match(reportOf(unblind), /peer-read: ok/);

  const blind = await run({ id: 'u-blind', objective: 'Look around', capability: 'docs:write', writes: [], blind: true });
  assert.equal(blind.outcome, 'pass');
  assert.match(reportOf(blind), /peer-read: ENOENT/);
});

// A worker that lists the context refs it was given with what it reads at each, and what it reads
// at the absolute path of each source of those refs.
function writeRefReadingWorker(dir, sources) {
  fs.writeFileSync(
    path.join(dir, 'settling-worker.mjs'),
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const code = (fn) => { try { return fn(); } catch (e) { return e.code; } };
      const claimDir = path.dirname(match[1]);
      let up = claimDir; while (!fs.existsSync(path.join(up, 'assignment.json'))) up = path.dirname(up);
      const assignment = JSON.parse(fs.readFileSync(path.join(up, 'assignment.json'), 'utf8'));
      const lines = assignment.contextRefs.map((ref) => 'ref ' + path.basename(path.dirname(ref)) + '/' + path.basename(ref) + ': ' + String(code(() => fs.readFileSync(ref, 'utf8'))).trim());
      for (const source of ${JSON.stringify(sources)}) lines.push('source: ' + String(code(() => fs.readFileSync(source, 'utf8') && 'readable')));
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n' + lines.join('\\n') + '\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    }
    `,
  );
}

test('a blind unit reads its unit-run and gate-answer inputs as copies in its own directory, and cannot read the sources', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData, extra = {}) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo', ...extra });
  const reportOf = (res) => fs.readFileSync(path.join(repoRoot, res.results[0].runResult.settleReports[0].path), 'utf8');

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const source = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);
  const answer = path.join(repoRoot, '.fgos', 'workflow-runs', 'wf-run-1', 'gate-answers', 'gate.md');
  fs.mkdirSync(path.dirname(answer), { recursive: true });
  fs.writeFileSync(answer, 'the owner said go\n');
  writeRefReadingWorker(repoRoot, [source, answer]);

  const res = await run({
    id: 'u-blind-in', objective: 'Build on it', capability: 'docs:write', writes: [], blind: true,
    inputs: ['docs/a.md', `unit-run:${first.unitRunId}/producer`, 'gate-answer:wf-run-1/gate'],
  });
  assert.equal(res.outcome, 'pass');

  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const refs = JSON.parse(fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8')).contextRefs;
  const copies = [path.join(dirOfB, 'producer', '1', 'inputs', '1-producer-r1.md'), path.join(dirOfB, 'producer', '1', 'inputs', '2-gate-gate.md')];
  assert.deepEqual(refs, ['docs/a.md', ...copies]);
  assert.ok(fs.readFileSync(copies[0]).equals(fs.readFileSync(source)), 'byte-identical to the report');
  assert.equal(fs.readFileSync(copies[1], 'utf8'), 'the owner said go\n');

  const seen = reportOf(res);
  assert.match(seen, /ref inputs\/1-producer-r1\.md: #/, 'the copy of the report is readable by the role');
  assert.match(seen, /ref inputs\/2-gate-gate\.md: the owner said go/);
  assert.equal((seen.match(/source: ENOENT/g) ?? []).length, 2, 'the sources are not visible to the blind role');

  const unitJson = JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8'));
  assert.deepEqual(unitJson.resolvedInputs, ['docs/a.md']);
  assert.deepEqual(unitJson.inputMap.map((e) => e.name), ['1-producer-r1.md', '2-gate-gate.md']);

  // A resume hands the same copies again, with the sources gone.
  fs.rmSync(source);
  const resumed = await run(undefined, { resumeUnitRunId: res.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.ok(fs.existsSync(copies[0]));
});

test('a blind unit with anonymized inputs gets neutral names in its own directory', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' });

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const res = await run({
    id: 'u-blind-anon', objective: 'Judge it', capability: 'docs:write', writes: [], blind: true, anonymizeInputs: true,
    inputs: [`unit-run:${first.unitRunId}/producer`],
  });
  assert.equal(res.outcome, 'pass');
  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const assignment = fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8');
  assert.deepEqual(JSON.parse(assignment).contextRefs, [path.join(dirOfB, 'producer', '1', 'inputs', 'seat-A.md')]);
  assert.ok(!assignment.includes(first.unitRunId), 'the earlier run is not named');
  assert.equal(fs.existsSync(path.join(dirOfB, 'inputs')), false, 'no copy is shared between the roles of the unit');
});

test('a blind unit whose input cannot be copied is refused with the reason, before anything launches', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' });

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const source = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);
  fs.writeFileSync(source, 'edited after settle\n');
  await assert.rejects(
    () => run({ id: 'u-edited', objective: 'x', capability: 'docs:write', writes: [], blind: true, inputs: [`unit-run:${first.unitRunId}/producer`] }),
    /report-changed-after-settle/,
  );
  await assert.rejects(
    () => run({ id: 'u-missing', objective: 'x', capability: 'docs:write', writes: [], blind: true, inputs: ['unit-run:unit-run-nope/producer'] }),
    /no-such-run/,
  );
});

test('a blind panel synthesizer reads its panelists\' reports as copies in its own directory', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-blind', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3), blind: true },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  const synthDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'synthesizer', '1');
  const refs = JSON.parse(fs.readFileSync(path.join(synthDir, 'assignment.json'), 'utf8')).contextRefs;
  assert.deepEqual(refs.map((ref) => path.dirname(ref)), [1, 2, 3].map(() => path.join(synthDir, 'inputs')));
  for (const [i, ref] of refs.entries()) {
    assert.ok(ref.includes(`member-${i + 1}`), `ref ${i} is the copy of member-${i + 1}'s report: ${ref}`);
    assert.ok(fs.statSync(ref).size > 0 && !fs.lstatSync(ref).isSymbolicLink());
  }
});

test('each role of a panel gets its own seat\'s earlier report as own-previous, blind or not, and not the other seats\'; a seat the earlier run did not have is refused by name', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'panel' });
  const first = await run({ id: 'u-round-1', objective: 'Propose', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) });
  const reportOf = (role) => path.join(repoRoot, first.results.find((r) => r.seat === role).runResult.settleReports[0].path);

  for (const blind of [false, true]) {
    const res = await run({
      id: `u-round-2-${blind}`, objective: 'Revise', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3), blind,
      inputs: [`unit-run:${first.unitRunId}/{seat}`],
    });
    assert.equal(res.outcome, 'pass');
    const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).resolvedInputs, [], 'resolved per role, not for the unit');

    for (const role of ['member-1', 'member-2', 'member-3']) {
      const roleDir = path.join(unitDir, role, '1');
      const refs = JSON.parse(fs.readFileSync(path.join(roleDir, 'assignment.json'), 'utf8')).contextRefs;
      const own = path.join(roleDir, 'inputs', 'own-previous.md');
      assert.deepEqual(refs, [own], `${role} gets only its own earlier result`);
      assert.ok(fs.readFileSync(own).equals(fs.readFileSync(reportOf(role))));
    }
    // The synthesizer is a seat of the earlier run too; the panelists' reports reach it as before.
    const synthRefs = JSON.parse(fs.readFileSync(path.join(unitDir, 'synthesizer', '1', 'assignment.json'), 'utf8')).contextRefs;
    assert.ok(synthRefs.some((ref) => ref.endsWith('own-previous.md')));
    assert.equal(synthRefs.length, 4);
  }
  await assert.rejects(
    () => runUnit({ unitData: { id: 'u-own', objective: 'x', capability: 'docs:write', writes: [], pattern: 'solo', inputs: [`unit-run:${first.unitRunId}/{seat}`] }, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' }),
    /no-such-seat/,
  );
});

test('unit summaries cover refusal, thrown execution and resume without duplicating settled seats', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'summary-doors', capability: 'unserved:answer', objective: 'Answer question', writes: [] };
  const refused = await runUnit({ unitData, repoRoot, cwd: worktreeDir });
  const dir = path.join(repoRoot, '.fgos', 'assignments', refused.unitRunId);
  const readSummary = () => JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
  assert.equal(refused.outcome, 'policy-refusal');
  assert.equal(readSummary().outcome, 'policy-refusal');
  assert.deepEqual(readSummary().seats, []);
  assert.equal(readSummary().workflow, null);
  // An unknown pattern now refuses before admission: the run is refused before any unit directory exists.
  await assert.rejects(
    runUnit({ unitData, repoRoot, cwd: worktreeDir, pattern: 'nonexistent-pattern' }),
    (err) => err instanceof RunnerConfigError && /not in the catalog/.test(err.message),
  );
  assert.deepEqual(fs.readdirSync(path.dirname(dir)), [refused.unitRunId]);
  // A thrown execution after admission publishes a summary with outcome execution-failure.
  reviewedConfig(repoRoot, ['alpha']);
  const failure = new Error('the producer attempt could not be prepared');
  const mkdir = fs.mkdirSync;
  const mockedMkdir = t.mock.method(fs, 'mkdirSync', (target, ...args) => {
    if (typeof target === 'string' && target.includes(`${path.sep}producer${path.sep}`)) throw failure;
    return mkdir(target, ...args);
  });
  const thrownUnitData = { id: 'summary-thrown', capability: 'docs:write', objective: 'Write docs', writes: [] };
  await assert.rejects(
    runUnit({ unitData: thrownUnitData, repoRoot, cwd: worktreeDir }),
    (err) => err === failure,
  );
  mockedMkdir.mock.restore();
  const thrownDir = fs.readdirSync(path.dirname(dir)).find((id) => id !== refused.unitRunId);
  assert.ok(thrownDir);
  const thrownSummary = JSON.parse(fs.readFileSync(path.join(path.dirname(dir), thrownDir, 'unit-summary.json'), 'utf8'));
  assert.equal(thrownSummary.outcome, 'execution-failure');
  assert.equal(thrownSummary.workflow, null);
  // A resumed solo uses settled history and never launches the unavailable executor.
  const runDir = path.join(dir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'synthetic-resumed-run', settledAt: '2026-10-05T01:00:00Z',
    classification: { outcome: { category: 'ok' } },
  }));
  const resumed = await runUnit({ resumeUnitRunId: refused.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(readSummary().seats.length, 1);
  assert.equal(readSummary().seats[0].attempts.length, 1);
  assert.equal(readSummary().seats[0].final.runId, 'synthetic-resumed-run');
});

function recordedUnitFixture(t, pattern = 'solo') {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const unitRunId = 'unit-run-recorded';
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });
  const patternName = typeof pattern === 'string' ? pattern : (pattern?.pattern ?? pattern?.name ?? 'solo');
  const loop = patternName === 'rfc' ? 'reviewed' : patternName;
  const record = {
    unit: { id: 'recorded-question', objective: 'Answer the question', capability: 'unserved:answer',
      writes: [], pattern, stanceOptions: ['a', 'b'], ...(patternName === 'panel' ? { seats: panelSeats(3) } : {}) },
    pattern: patternName,
    seatSchema: 1,
    collaboration: {
      effective: {
        loop,
        params: patternName === 'rfc'
          ? { maxRounds: 1, minCheckers: ['reviewer', 'red-team'] }
          : (loop === 'reviewed' ? { maxRounds: 1 } : {}),
      },
      pattern: { name: patternName },
    },
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    overrides: [],
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
  };
  // A pattern the resolver does not know leaves a record with no seats, which a resume then refuses.
  if (patternName === 'rfc') {
    record.seats = [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true, forceOutOfProcess: true } },
      { seat: 'red-team', role: 'reviewer', posture: { readOnly: true, verdict: true, forceOutOfProcess: true } },
    ];
  } else {
    try {
      record.seats = resolveSeats({ pattern, unit: record.unit, runnerConfig: record.configSnapshot.runner });
    } catch {
      record.seats = [];
    }
  }
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  const readRecord = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const readSummary = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'));
  return { repoRoot, worktreeDir, unitRunId, unitDir, record, readRecord, readSummary };
}

test('summary I/O failure leaves a successful resumed execution successful and authoritative', async (t) => {
  const fixture = recordedUnitFixture(t);
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));
  fs.mkdirSync(path.join(fixture.unitDir, 'unit-summary.json'));
  const warning = t.mock.method(console, 'warn', () => {});
  const resumed = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(fixture.readRecord().settlement.outcome, 'pass');
  assert.ok(fixture.readRecord().settlement.settledAt);
  assert.equal(warning.mock.callCount(), 1);
});

test('a reopened unit cannot retain its prior terminal summary when republishing fails', async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.settlement = { outcome: 'policy-refusal', settledAt: '2026-10-05T01:01:00Z' };
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  writeUnitSummary(fixture.unitDir);
  assert.equal(fixture.readSummary().outcome, 'policy-refusal');
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:02:00Z', classification: { outcome: { category: 'ok' } },
  }));
  const summaryFile = path.join(fixture.unitDir, 'unit-summary.json');
  const rename = fs.renameSync;
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (to === summaryFile) throw new Error('summary storage unavailable');
    return rename(from, to);
  });
  t.mock.method(console, 'warn', () => {});
  const resumed = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(fixture.readRecord().settlement.outcome, 'pass');
  assert.equal(fs.existsSync(summaryFile), false);
});

test('failed invalidation leaves the prior settled unit and published artifact authoritative', async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.settlement = { outcome: 'policy-refusal', settledAt: '2026-10-05T01:01:00Z' };
  const unitFile = path.join(fixture.unitDir, 'unit.json');
  fs.writeFileSync(unitFile, JSON.stringify(fixture.record));
  writeUnitSummary(fixture.unitDir);
  const summaryFile = path.join(fixture.unitDir, 'unit-summary.json');
  const beforeUnit = fs.readFileSync(unitFile, 'utf8');
  const beforeSummary = fs.readFileSync(summaryFile, 'utf8');
  const unlink = fs.unlinkSync;
  t.mock.method(fs, 'unlinkSync', (file) => {
    if (file === summaryFile) throw Object.assign(new Error('directory is read-only'), { code: 'EACCES' });
    return unlink(file);
  });
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }), RunnerConfigError);
  assert.equal(fs.readFileSync(unitFile, 'utf8'), beforeUnit);
  assert.equal(fs.readFileSync(summaryFile, 'utf8'), beforeSummary);
});

test('summary I/O failure cannot replace the original execution error', async (t) => {
  const fixture = recordedUnitFixture(t);
  reviewedConfig(fixture.repoRoot, ['alpha']);
  fixture.record.unit.capability = 'docs:write';
  fixture.record.configSnapshot = snapshotRunnerConfig(fixture.repoRoot);
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  fs.mkdirSync(path.join(fixture.unitDir, 'unit-summary.json'));
  // The producer seat fails before it launches.
  const failure = new Error('the producer attempt could not be prepared');
  const producerDir = path.join(fixture.unitDir, 'producer');
  const mkdir = fs.mkdirSync;
  t.mock.method(fs, 'mkdirSync', (dir, ...args) => {
    if (typeof dir === 'string' && (dir === producerDir || dir.startsWith(producerDir + path.sep))) throw failure;
    return mkdir(dir, ...args);
  });
  const warning = t.mock.method(console, 'warn', () => {});
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }),
  (error) => {
    assert.equal(error, failure);
    return true;
  });
  assert.equal(fixture.readRecord().settlement.outcome, 'execution-failure');
  assert.equal(warning.mock.callCount(), 1);
});

test('resume refuses supplied stance options without altering the stored question or publishing a summary', async (t) => {
  const fixture = recordedUnitFixture(t);
  const before = fs.readFileSync(path.join(fixture.unitDir, 'unit.json'), 'utf8');
  for (const stanceOptions of [['a', 'b'], ['changed'], [], null]) {
    await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
      resumeUnitRunId: fixture.unitRunId, stanceOptions }), RunnerConfigError);
    assert.equal(fs.readFileSync(path.join(fixture.unitDir, 'unit.json'), 'utf8'), before);
    assert.equal(fs.existsSync(path.join(fixture.unitDir, 'unit-summary.json')), false);
  }
});

test('a reviewed execution error publishes its summary only after the dispatched sibling result exists', async (t) => {
  const fixture = recordedUnitFixture(t, 'rfc');
  reviewedConfig(fixture.repoRoot, ['alpha', 'beta']);
  fixture.record.unit.capability = 'docs:write';
  fixture.record.configSnapshot = snapshotRunnerConfig(fixture.repoRoot);
  fixture.record.bindings = {
    'producer/1': [{ role: 'producer', round: 1, binding: { executor: 'alpha' } }],
  };
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const producerDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(producerDir, { recursive: true });
  const reportFile = path.join(producerDir, 'agent-report.md');
  fs.writeFileSync(reportFile, '# Producer report\nThe requested source evidence was inspected and the proposed change was documented.\n');
  fs.writeFileSync(path.join(producerDir, 'result.json'), JSON.stringify({
    runId: 'prior-producer', settledAt: '2026-10-05T01:01:00Z', executorId: 'alpha',
    evidence: { artifacts: [path.relative(fixture.repoRoot, reportFile)] },
    classification: { outcome: { category: 'ok' } },
  }));
  // The reviewer seat fails before it launches; its sibling still runs to a result.
  const failure = new Error('the reviewer attempt could not be prepared');
  const reviewerDir = path.join(fixture.unitDir, 'reviewer');
  const mkdir = fs.mkdirSync;
  t.mock.method(fs, 'mkdirSync', (dir, ...args) => {
    if (typeof dir === 'string' && (dir === reviewerDir || dir.startsWith(reviewerDir + path.sep))) throw failure;
    return mkdir(dir, ...args);
  });
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }), (error) => error === failure);
  const summary = fixture.readSummary();
  assert.equal(summary.outcome, 'execution-failure');
  const sibling = summary.seats.find((seat) => seat.seat === 'red-team');
  assert.ok(sibling?.final.runId);
  assert.equal(sibling.final.outcome, 'pass');
  assert.equal(sibling.kind, 'checker');
  assert.equal(fixture.readRecord().settlement.outcome, 'execution-failure');
});

test('a failed settlement write never replaces the execution error that caused it', async (t) => {
  const fixture = recordedUnitFixture(t, 'solo');
  reviewedConfig(fixture.repoRoot, ['alpha']);
  fixture.record.unit.capability = 'docs:write';
  fixture.record.configSnapshot = snapshotRunnerConfig(fixture.repoRoot);
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const unitFile = path.join(fixture.unitDir, 'unit.json');
  const rename = fs.renameSync;
  const read = fs.readFileSync;
  const failure = new Error('the producer attempt could not be prepared');
  const producerDir = path.join(fixture.unitDir, 'producer');
  const mkdir = fs.mkdirSync;
  t.mock.method(fs, 'mkdirSync', (dir, ...args) => {
    if (typeof dir === 'string' && (dir === producerDir || dir.startsWith(producerDir + path.sep))) throw failure;
    return mkdir(dir, ...args);
  });
  t.mock.method(fs, 'renameSync', (from, to) => {
    // Only the settlement record fails to land; the earlier running-state writes succeed.
    if (to === unitFile && JSON.parse(read(from, 'utf8')).execution?.status === 'settled') {
      throw Object.assign(new Error('unit record storage unavailable'), { code: 'EIO' });
    }
    return rename(from, to);
  });
  const warning = t.mock.method(console, 'warn', () => {});
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }),
  (error) => error === failure);
  assert.equal(warning.mock.callCount(), 1);
  assert.match(warning.mock.calls[0].arguments[0], /could not record the failed settlement.*unit record storage unavailable/);
  assert.equal(fixture.readRecord().execution.status, 'running', 'the record keeps the last state that was written');
  assert.equal(fixture.readRecord().settlement, undefined);
  assert.deepEqual(fs.readdirSync(fixture.unitDir).filter((name) => name.endsWith('.tmp')), [], 'no partial record is left behind');
});

function setGeneratedPaths(repoRoot, generatedPaths) {
  const config = readProjectConfig(repoRoot);
  config.runner.generatedPaths = generatedPaths;
  writeProjectConfig(repoRoot, config);
}

const SKILL_RENDERS = [{ from: 'core/skills/**', also: ['.agents/skills/**', 'plugins/fgOS/skills/**'] }];

test('runUnit records the write scope widened by generatedPaths and hands it to the assignment', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  setGeneratedPaths(repoRoot, SKILL_RENDERS);
  const res = await runUnit({
    unitData: { id: 'u-skill', objective: 'Edit a skill', capability: 'docs:write', writes: ['./core/skills/x/SKILL.md', 'docs/'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const expected = ['core/skills/x/SKILL.md', 'docs', '.agents/skills/**', 'plugins/fgOS/skills/**'];
  assert.deepEqual(record.unit.writes, ['core/skills/x/SKILL.md', 'docs']);
  assert.deepEqual(record.writeScope, expected);
  const assignment = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.deepEqual(assignment.writes, expected);
});

test('a resumed unit keeps its recorded write scope even after generatedPaths changes', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  setGeneratedPaths(repoRoot, SKILL_RENDERS);
  const unitData = { id: 'u-resume-scope', objective: 'Edit a skill', capability: 'unserved:answer', writes: ['core/skills/y.md'] };
  const first = await runUnit({ unitData, repoRoot, cwd: worktreeDir });
  const unitJson = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId, 'unit.json');
  const expected = ['core/skills/y.md', '.agents/skills/**', 'plugins/fgOS/skills/**'];
  assert.deepEqual(JSON.parse(fs.readFileSync(unitJson, 'utf8')).writeScope, expected);
  setGeneratedPaths(repoRoot, []);
  await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.deepEqual(JSON.parse(fs.readFileSync(unitJson, 'utf8')).writeScope, expected);
});

test('a resumed unit recorded before write scopes existed hands its own writes to the assignment', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  setGeneratedPaths(repoRoot, SKILL_RENDERS);
  const first = await runUnit({
    unitData: { id: 'u-old-record', objective: 'Edit a skill', capability: 'docs:write', writes: ['core/skills/z.md'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId);
  const unitJson = path.join(unitDir, 'unit.json');
  const record = JSON.parse(fs.readFileSync(unitJson, 'utf8'));
  delete record.writeScope;
  delete record.settlement;
  record.execution = { status: 'running' };
  fs.writeFileSync(unitJson, JSON.stringify(record, null, 2));
  fs.rmSync(path.join(unitDir, 'producer'), { recursive: true, force: true });
  await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  // A producer that did not pass is bound again as a new attempt, so the assignment is the last attempt's.
  const attempts = JSON.parse(fs.readFileSync(unitJson, 'utf8')).bindings['producer/1'];
  const lastDir = attempts.length === 1 ? '1' : `1-fb${attempts.length - 1}`;
  const assignment = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', lastDir, 'assignment.json'), 'utf8'));
  assert.deepEqual(assignment.writes, ['core/skills/z.md']);
  assert.equal(JSON.parse(fs.readFileSync(unitJson, 'utf8')).writeScope, undefined);
});

test('a resumed unit keeps the run timeout it started with; an override passed to the resume does not change it', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const first = await runUnit({
    unitData: { id: 'u-resume-timeout', objective: 'Read the docs', capability: 'docs:write', writes: [] },
    overrides: [{ origin: 'human-cli', timeoutMs: 5400000 }],
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId);
  const unitJson = path.join(unitDir, 'unit.json');
  const record = JSON.parse(fs.readFileSync(unitJson, 'utf8'));
  // As if the run died mid-round: the binding stays recorded, the round's output is gone.
  delete record.settlement;
  record.execution = { status: 'running' };
  for (const attempt of record.bindings['producer/1']) delete attempt.outcome;
  fs.writeFileSync(unitJson, JSON.stringify(record, null, 2));
  fs.rmSync(path.join(unitDir, 'producer'), { recursive: true, force: true });
  await runUnit({ resumeUnitRunId: first.unitRunId, overrides: [{ origin: 'human-cli', timeoutMs: 120000 }], repoRoot, cwd: worktreeDir });
  const runJson = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', '1', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.timeoutMs, 5400000);
  assert.deepEqual(JSON.parse(fs.readFileSync(unitJson, 'utf8')).overrides, [{ origin: 'human-cli', timeoutMs: 5400000 }]);
});

test('a resume is refused while a live process holds the dispatch lock of the unit worktree, and proceeds once that holder is dead', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'resume-lock', capability: 'unserved:answer', objective: 'Answer question', writes: [] };
  const refused = await runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir });
  assert.equal(refused.outcome, 'policy-refusal');
  const runDir = path.join(repoRoot, '.fgos', 'assignments', refused.unitRunId, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'synthetic-resumed-run', settledAt: '2026-10-05T01:00:00Z',
    classification: { outcome: { category: 'ok' } },
  }));
  const resume = () => runUnit({ resumeUnitRunId: refused.unitRunId, repoRoot, cwd: worktreeDir, worktree: worktreeDir });

  // A mutating dispatch in another process holds the worktree's dispatch-cwd lock while its worker runs.
  const { child, exited } = await holdLockInChild('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir });
  try {
    await assert.rejects(resume, { name: 'DispatchError', code: 'dispatch-in-flight', holderPid: child.pid, cwd: worktreeDir });
  } finally {
    child.kill('SIGKILL');
    await exited;
  }
  assert.equal((await resume()).outcome, 'pass');
});

// A worker that writes `files` (path -> content) in its worktree and settles done. With `waitFor`, it
// first writes `.started` and waits (up to 20s) for that file to appear, so a test can act mid-round.
function writeScopedWorker(repoRoot, { files, waitFor = null, summary = 'Wrote the files' }) {
  const script = path.join(repoRoot, 'scoped-worker.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    const files = ${JSON.stringify(files)};
    for (const [rel, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(rel), { recursive: true });
      fs.writeFileSync(rel, content);
    }
    const waitFor = ${JSON.stringify(waitFor)};
    if (waitFor) {
      fs.writeFileSync('.started', '');
      const until = Date.now() + 20000;
      while (!fs.existsSync(waitFor) && Date.now() < until) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
    if (match) {
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: ${JSON.stringify(summary)}, assessment: { verdict: 'pass' } }));
    }
    `,
  );
  const cfg = readProjectConfig(repoRoot);
  for (const executor of Object.values(cfg.runner.executors)) {
    executor.args = [script, '{prompt}'];
    for (const invocation of executor.invocations) invocation.args = [script, '{prompt}'];
  }
  writeProjectConfig(repoRoot, cfg);
}

const gitIn = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const headOf = (cwd) => gitIn(cwd, 'rev-parse', 'HEAD').trim();
/** How many producer rounds were actually spawned (each settled spawn leaves a result.json). */
function producerSpawns(repoRoot, unitRunId) {
  const roleDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId, 'producer');
  if (!fs.existsSync(roleDir)) return 0;
  let n = 0;
  for (const attempt of fs.readdirSync(roleDir)) {
    const runs = path.join(roleDir, attempt, 'runs');
    if (fs.existsSync(runs)) n += fs.readdirSync(runs).filter((r) => fs.existsSync(path.join(runs, r, 'result.json'))).length;
  }
  return n;
}
const unitRecordOf = (repoRoot, unitRunId) => JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));

async function waitForFile(file, ms = 20000) {
  const until = Date.now() + ms;
  while (!fs.existsSync(file)) {
    if (Date.now() > until) throw new Error(`timed out waiting for ${file}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

test('a mutating unit with a foreign staged index is refused before any producer is spawned', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/a.md': 'a\n' } });
  fs.writeFileSync(path.join(worktreeDir, 'staged.txt'), 's\n');
  gitIn(worktreeDir, 'add', 'staged.txt');
  const res = await runUnit({
    unitData: { id: 'u-foreign', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results[0].refused.reason, 'foreign-staged-index');
  assert.deepEqual(res.results[0].refused.paths, ['staged.txt']);
  assert.match(res.results[0].refused.detail, /staged\.txt/);
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 0, 'the worker never ran');
  assert.equal(fs.existsSync(path.join(worktreeDir, 'docs', 'a.md')), false);
  assert.equal(gitIn(worktreeDir, 'diff', '--cached', '--name-only').trim(), 'staged.txt', 'the index is left as it was');
});

test('a file dirty in scope before launch is not committed and is recorded as preExistingInScope', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/new.md': 'n\n' } });
  fs.mkdirSync(path.join(worktreeDir, 'docs'));
  fs.writeFileSync(path.join(worktreeDir, 'docs', 'wip.md'), 'a person is half way through this\n');
  const res = await runUnit({
    unitData: { id: 'u-wip', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'pass');
  const commit = res.results[0].commit;
  assert.equal(commit.status, 'committed');
  assert.deepEqual(commit.files, ['docs/new.md']);
  assert.deepEqual(commit.preExistingInScope, ['docs/wip.md']);
  assert.match(gitIn(worktreeDir, 'status', '--porcelain', '--untracked-files=all'), /\?\? docs\/wip\.md/);
  const attempt = unitRecordOf(repoRoot, res.unitRunId).bindings['producer/1'][0];
  assert.deepEqual(attempt.preExistingInScope, ['docs/wip.md']);
  assert.deepEqual(attempt.commit.preExistingInScope, ['docs/wip.md']);
});

test('a producer writing in and out of scope gets only the in-scope file committed and still passes', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n', 'src/out.txt': 'o\n' }, summary: 'feat(docs): add the page' });
  const res = await runUnit({
    unitData: { id: 'u-scope', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'pass');
  const commit = res.results[0].commit;
  assert.deepEqual(commit.files, ['docs/in.md']);
  assert.deepEqual(commit.outOfScope, ['src/out.txt']);
  assert.equal(commit.subject, 'feat(docs): add the page');
  assert.equal(gitIn(worktreeDir, 'show', '--name-only', '--format=', 'HEAD').trim(), 'docs/in.md');
  assert.deepEqual(unitRecordOf(repoRoot, res.unitRunId).bindings['producer/1'][0].commit.outOfScope, ['src/out.txt']);
});

test('resume after a foreign index appeared mid-round only commits: the producer is not spawned again', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' }, waitFor: '.go' });
  const unitData = { id: 'u-midround', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] };
  const running = runUnit({ unitData, repoRoot, cwd: worktreeDir, pattern: 'solo' });
  await waitForFile(path.join(worktreeDir, '.started'));
  fs.writeFileSync(path.join(worktreeDir, 'foreign.txt'), 'f\n');
  gitIn(worktreeDir, 'add', 'foreign.txt');
  fs.writeFileSync(path.join(worktreeDir, '.go'), '');
  const first = await running;
  assert.equal(first.outcome, 'execution-failure');
  assert.equal(first.results[0].commit.reason, 'foreign-staged-index');
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1);
  const before = headOf(worktreeDir);

  gitIn(worktreeDir, 'reset', '-q', 'foreign.txt');
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1, 'resume committed without spawning the producer again');
  assert.equal(resumed.results[0].commit.status, 'committed');
  assert.deepEqual(resumed.results[0].commit.files, ['docs/in.md']);
  assert.notEqual(headOf(worktreeDir), before);
  const record = unitRecordOf(repoRoot, first.unitRunId);
  assert.equal(record.bindings['producer/1'].length, 1);
  assert.equal(record.bindings['producer/1'][0].commit.status, 'committed');
  assert.equal(record.bindings['producer/1'][0].outcome, 'pass');
  assert.equal(record.settlement.outcome, 'pass');
});

test('resume after committed-set-mismatch refuses while the commit is on the branch', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' } });
  const hooks = path.join(repoRoot, 'test-hooks');
  fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks, 'pre-commit'), '#!/bin/sh\necho sneaky > sneaky.txt\ngit add sneaky.txt\n', { mode: 0o755 });
  gitIn(repoRoot, 'config', 'core.hooksPath', hooks);
  const first = await runUnit({
    unitData: { id: 'u-hooked', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(first.outcome, 'execution-failure');
  const commit = first.results[0].commit;
  assert.equal(commit.reason, 'committed-set-mismatch');
  assert.equal(commit.sha, headOf(worktreeDir));

  await assert.rejects(
    () => runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir }),
    (error) => error instanceof RunnerConfigError
      && error.message.includes(commit.sha)
      && /sneaky\.txt/.test(error.message)
      && /outside the scope/.test(error.message),
  );
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1);

  // Once a person takes that commit off the branch (keeping its files), resume commits again.
  gitIn(repoRoot, 'config', '--unset', 'core.hooksPath');
  gitIn(worktreeDir, 'reset', '-q', 'HEAD~1');
  fs.rmSync(path.join(worktreeDir, 'sneaky.txt'));
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'pass');
  assert.deepEqual(resumed.results[0].commit.files, ['docs/in.md']);
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1, 'still no second spawn');
});

test('a commit-only resume whose in-scope work is gone fails as work-missing instead of passing empty', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' }, waitFor: '.go' });
  const running = runUnit({ unitData: { id: 'u-gone', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] }, repoRoot, cwd: worktreeDir, pattern: 'solo' });
  await waitForFile(path.join(worktreeDir, '.started'));
  fs.writeFileSync(path.join(worktreeDir, 'foreign.txt'), 'f\n');
  gitIn(worktreeDir, 'add', 'foreign.txt');
  fs.writeFileSync(path.join(worktreeDir, '.go'), '');
  const first = await running;
  assert.equal(first.results[0].commit.reason, 'foreign-staged-index');

  // The person clears the index and, with it, the agent's file.
  gitIn(worktreeDir, 'reset', '-q', 'foreign.txt');
  fs.rmSync(path.join(worktreeDir, 'docs'), { recursive: true, force: true });
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'execution-failure');
  assert.equal(resumed.results[0].commit.status, 'failed');
  assert.equal(resumed.results[0].commit.reason, 'work-missing');
  assert.deepEqual(resumed.results[0].commit.missing, ['docs/in.md']);
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1);
});

test('a unit persona defined in the workspace tier reaches the prompt as text pinned when the unit run starts', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const personaText = [
    'name: ledger-keeper',
    'version: 0.1.0',
    'description: Keeps the ledger straight for {objective}',
    'role: Producer',
    'persona:',
    '  voice: Plain ledger voice',
    '  style: Numbers first',
    '  archetype: A careful bookkeeper',
    'decision_boundary:',
    '  can_decide:',
    '    - How to order the entries',
    '  must_escalate:',
    '    - Anything that moves money',
    '',
  ].join('\n');
  fs.mkdirSync(path.join(repoRoot, 'fgos', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'fgos', 'agents', 'ledger-keeper.yaml'), personaText);
  const res = await runUnit({
    unitData: { id: 'u-persona', objective: 'Write docs', capability: 'docs:write', writes: [], persona: 'ledger-keeper' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const assignment = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.equal(assignment.policy.personaPin?.name, 'ledger-keeper');
  assert.equal(assignment.policy.personaPin?.text, personaText);
  // The pin is recorded once, so an edit to the file after the start never reaches a resume.
  assert.equal(JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).personaPin.text, personaText);
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

test('a committed Unit result survives a failed custody handoff with a warning', async (t) => {
  const { resolveLock } = await import('../../../src/holder-lock/index.mjs');
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(repoRoot, 'docs'));
  fs.writeFileSync(path.join(repoRoot, 'docs', 'in.md'), 'completed\n');
  gitIn(repoRoot, 'add', 'docs/in.md');
  gitIn(repoRoot, 'commit', '-qm', 'feat(docs): upstream change');
  const record = `${resolveLock('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir }).v3Path}.predecessor.json`;
  const hook = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, `#!/bin/sh\nprintf 'broken record' > '${record.replaceAll("'", "'\\''")}'\n`, { mode: 0o755 });
  const result = await runUnit({
    unitData: { id: 'handoff-warning', capability: 'docs:write', writes: ['docs'], syncBase: 'main' },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(result.outcome, 'pass');
  assert.equal(result.results[0].commit.status, 'committed');
  assert.equal(result.results[0].commit.sha, headOf(worktreeDir));
  assert.equal(result.warnings[0].code, 'custody-handoff-not-recorded');
  assert.equal(fs.readFileSync(record, 'utf8'), 'broken record');
});

// Gives each named executor family its own model for every tier a rigor may ask for.
function withModelPolicies(repoRoot, families, patch = {}) {
  const cfg = readProjectConfig(repoRoot);
  for (const family of families) cfg.runner.modelPolicies[family] = { standard: `${family}-std`, flagship: `${family}-flagship`, frontier: `${family}-frontier` };
  Object.assign(cfg.runner, patch);
  writeProjectConfig(repoRoot, cfg);
}

function reviewedRun(repoRoot, worktreeDir, unitData, pattern = 'reviewed') {
  return runUnit({ unitData: { objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed', ...unitData }, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern });
}

test('a reviewed run at rigor high puts the producer and both checkers on three provider families', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  withModelPolicies(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-high-3', rigor: 'high' });
  assert.equal(res.outcome, 'pass');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.equal(new Set([byRole.producer, byRole.reviewer, byRole['red-team']]).size, 3, JSON.stringify(byRole));
});

test('a reviewed run at rigor high refuses the checker that no unused family can serve', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  withModelPolicies(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-high-2', rigor: 'high' });
  assert.equal(res.outcome, 'policy-refusal');
  const refused = res.results.find((r) => r.refused);
  assert.equal(refused.seat, 'red-team');
  assert.equal(refused.refused.reason, 'independence-unsatisfiable');
});

test('a reviewed run at rigor standard lets two checkers share a family, as before', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  withModelPolicies(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-std-2', rigor: 'standard' }, { pattern: 'reviewed', params: { minCheckers: ['reviewer', 'red-team'] } });
  assert.equal(res.outcome, 'pass');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.equal(byRole.reviewer, byRole['red-team']);
  assert.notEqual(byRole.producer, byRole.reviewer);
});

test('a unit verify command runs in the worktree after the producing round and a zero exit passes', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-ok', verify: `node -e "require('fs').writeFileSync('verify-ran.txt', process.cwd())"` });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify, undefined, 'a run that verified says nothing about missing verify');
  assert.equal(res.results.filter((r) => r.seat === 'verify' && r.outcome === 'pass').length, 1);
  assert.equal(fs.realpathSync(fs.readFileSync(path.join(worktreeDir, 'verify-ran.txt'), 'utf8')), fs.realpathSync(worktreeDir));
});

test('a writing unit\'s verify child borrows the custody lease while it runs', { skip: process.platform === 'win32' && 'the hold transport keeps the description in its helper' }, async (t) => {
  const { resolveLock } = await import('../../../src/holder-lock/index.mjs');
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' } });
  // Only the producer writes; the checker keeps the read-only settling worker.
  const cfg = readProjectConfig(repoRoot);
  const settling = [path.join(repoRoot, 'settling-worker.mjs'), '{prompt}'];
  cfg.runner.executors.beta.args = settling;
  for (const invocation of cfg.runner.executors.beta.invocations) invocation.args = settling;
  writeProjectConfig(repoRoot, cfg);
  const probe = path.join(repoRoot, 'verify-probe.json');
  const script = `const fs = require('fs'); fs.writeFileSync(${JSON.stringify(probe)}, JSON.stringify({ name: process.env.FGOS_LOCK_FD, ino: String(fs.fstatSync(3, { bigint: true }).ino) }))`;
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-custody', writes: ['docs'], verify: `node -e ${JSON.stringify(script)}` });
  assert.equal(res.outcome, 'pass', JSON.stringify(res));
  assert.equal(res.results.find((r) => r.seat === 'producer').commit.status, 'committed');
  const seen = JSON.parse(fs.readFileSync(probe, 'utf8'));
  const lock = resolveLock('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir }).v3Path;
  assert.equal(seen.name, 'dispatch-cwd:3');
  assert.equal(seen.ino, String(fs.statSync(lock, { bigint: true }).ino), 'the verify child holds a copy of the lease description');
});

test('a failing unit verify becomes findings that carry its exit status and output', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-red', verify: `node -e "console.error('assertion exploded'); process.exit(3)"` });
  assert.equal(res.outcome, 'findings');
  assert.ok(res.findings.some((f) => /exited 3/.test(f) && /assertion exploded/.test(f)), res.findings.join('\n'));
});

test('a verify command that outlives runner.timeoutMs fails the verify with the timeout named, never hangs', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  withModelPolicies(repoRoot, [], { timeoutMs: 4000 });
  const started = Date.now();
  const res = await reviewedRun(
    repoRoot,
    worktreeDir,
    { id: 'u-verify-slow', verify: `node -e "setTimeout(() => {}, 9000)"` },
    { pattern: 'reviewed', params: { maxRounds: 1 } },
  );
  assert.equal(res.outcome, 'findings');
  assert.ok(res.findings.some((f) => /timed out after 4000ms/.test(f)), res.findings.join('\n'));
  assert.ok(Date.now() - started < 9000, 'the run did not wait for the verify command to finish by itself');
});

test('a verify declared on the capability is used when the unit names none', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.capabilities['docs:write'].verify = 'node -e "process.exit(5)"';
  writeProjectConfig(repoRoot, cfg);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-cap' });
  assert.equal(res.outcome, 'findings');
  assert.ok(res.findings.some((f) => /exited 5/.test(f)));
});

test('a reviewed run with no verify command passes but says it verified nothing; the code-change preset pins none', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-no-verify', pattern: 'code-change' }, 'code-change');
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify.ran, false);
  assert.match(res.verify.reason, /no verify command/);
  assert.equal(res.results.some((r) => r.seat === 'verify'), false);
});

test('a solo run needs no verify and does not claim to have skipped one', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-solo-no-verify', pattern: 'solo' }, 'solo');
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify, undefined);
});

test('a solo record with a command does not settle before verify completes and resume runs verify', async (t) => {
  // Solo record with a verify command: producer passed but verify not run leaves derived outcome unknown, not pass
  const cmdFix = recordedUnitFixture(t);
  cmdFix.record.unit.verify = 'node -e "process.exit(0)"';
  fs.writeFileSync(path.join(cmdFix.unitDir, 'unit.json'), JSON.stringify(cmdFix.record));
  const cmdRunDir = path.join(cmdFix.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(cmdRunDir, { recursive: true });
  fs.writeFileSync(path.join(cmdRunDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));
  const writeRes = writeUnitSummary(cmdFix.unitDir);
  assert.equal(writeRes.skipped, 'unsettled');
  assert.equal(fs.existsSync(path.join(cmdFix.unitDir, 'unit-summary.json')), false);
  assert.equal(buildUnitSummary(cmdFix.unitDir).outcome, 'unknown');
  // Resuming runs verify and settles with pass only after verify passes
  const resumed = await runUnit({
    repoRoot: cmdFix.repoRoot,
    cwd: cmdFix.worktreeDir,
    resumeUnitRunId: cmdFix.unitRunId,
  });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(resumed.results.filter((r) => r.seat === 'verify' && r.outcome === 'pass').length, 1);
  assert.equal(cmdFix.readRecord().execution?.status, 'settled');
  assert.equal(cmdFix.readRecord().settlement?.outcome, 'pass');
  assert.equal(cmdFix.readSummary().outcome, 'pass');
});

test('a solo run with a failing verify command settles with findings and no second producer launch', async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.unit.verify = 'node -e "console.error(\'failed verify check\'); process.exit(2)"';
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));

  const resumed = await runUnit({
    repoRoot: fixture.repoRoot,
    cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId,
  });
  assert.equal(resumed.outcome, 'findings');
  assert.ok(resumed.findings.some((f) => /exited 2/.test(f) && /failed verify check/.test(f)));
  assert.equal(resumed.results.filter((r) => r.seat === 'producer').length, 1);
  assert.equal(resumed.results.filter((r) => r.seat === 'verify' && r.outcome === 'findings').length, 1);
  assert.equal(fixture.readRecord().execution?.status, 'settled');
  assert.equal(fixture.readRecord().settlement?.outcome, 'findings');
  assert.equal(fixture.readSummary().outcome, 'findings');
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

test('capability-level verify on panel is neither run nor refused', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.capabilities['docs:write'].verify = 'node -e "process.exit(0)"';
  writeProjectConfig(repoRoot, cfg);

  const res = await runUnit({
    unitData: { id: 'u-panel-cap-verify', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify?.ran, false);
  assert.equal(res.results.some((r) => r.seat === 'verify'), false);
});

// A signal handled the way the CLI does it, with a stand-in exit so the test process survives.
async function withCancelHandlers(fn) {
  const exits = [];
  const uninstall = installCancelOnSignal({ cancelWaitMs: 1000, exit: (code) => exits.push(code), stderr: { write() {} } });
  try { await fn(exits); } finally { uninstall(); resetCancelRequest(); }
}

test('a signal that lands while the unit is set up stops it before any seat starts and leaves the run resumable', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'cancelled-midway', capability: 'unserved:answer', objective: 'Answer question', writes: [] };
  await withCancelHandlers(async () => {
    await assert.rejects(
      runUnit({ unitData, repoRoot, cwd: worktreeDir, onUnitRunCreated: () => { process.emit('SIGINT'); } }),
      { name: 'RunCancelledError', code: 'run-cancelled' },
    );
    const assignments = path.join(repoRoot, '.fgos', 'assignments');
    const [unitRunId] = fs.readdirSync(assignments);
    const record = JSON.parse(fs.readFileSync(path.join(assignments, unitRunId, 'unit.json'), 'utf8'));
    assert.equal(record.settlement, undefined, 'a cancel is not a failed settlement');
    assert.deepEqual(record.execution, { status: 'running' });
    assert.equal(fs.existsSync(path.join(assignments, unitRunId, 'unit-summary.json')), false);
    assert.deepEqual(record.bindings ?? {}, {}, 'no seat was bound');
  });
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

test('an in-process caller keeps its own signal handling: runUnit installs no SIGINT or SIGTERM handler unless the process asked', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const counts = () => [process.listenerCount('SIGINT'), process.listenerCount('SIGTERM')];
  const before = counts();
  let during = null;
  const res = await runUnit({
    unitData: { id: 'own-handlers', capability: 'unserved:answer', objective: 'x', writes: [] },
    repoRoot, cwd: worktreeDir, onUnitRunCreated: () => { during = counts(); },
  });
  assert.equal(res.outcome, 'policy-refusal');
  assert.deepEqual(during, before);
  assert.deepEqual(counts(), before);
});

test('resume settles a pending runner record after the native commit completed', { skip: process.platform === 'win32', timeout: 90000 }, async () => {
  const { repoRoot: main, worktreeDir: tree } = setupGitRepo();
  writeScopedWorker(main, { files: { 'docs/new': 'new' } });
  const marker = path.join(main, 'commit-returned.json');
  const idFile = path.join(main, 'unit-id');
  try {
    // Observe the existing adapter seam, call the real native commit, and kill the
    // controller before runUnit can settle its pending record. No unit state is seeded.
    assert.throws(() => execFileSync(process.execPath, ['--experimental-test-module-mocks', '--input-type=module', '-'], {
      cwd: new URL('../../../', import.meta.url), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000,
      input: `
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as commits from './src/runner/execution/commit-unit-work.mjs';
mock.module('./src/runner/execution/commit-unit-work.mjs', { namedExports: {
  ...commits,
  commitUnitWork(...args) {
    const committed = commits.commitUnitWork(...args);
    assert.equal(committed.status, 'committed', JSON.stringify(committed));
    fs.writeFileSync(${JSON.stringify(marker)}, JSON.stringify(committed));
    process.kill(process.pid, 'SIGKILL');
  },
}});
const { runUnitWithPort: runUnit } = await import('./test/helpers/run-unit-with-port.mjs');
await runUnit({repoRoot:${JSON.stringify(main)},cwd:${JSON.stringify(tree)},worktree:${JSON.stringify(tree)},pattern:'solo',
  unitData:{id:'crash',objective:'Write docs',capability:'docs:write',writes:['docs']},
  onUnitRunCreated:id => fs.writeFileSync(${JSON.stringify(idFile)},id)});
throw new Error('controller never reached the native commit');
`,
    }), error => error.signal === 'SIGKILL');
    const id = fs.readFileSync(idFile, 'utf8');
    const landed = JSON.parse(fs.readFileSync(marker, 'utf8')).sha;
    const file = path.join(main, '.fgos/assignments', id, 'unit.json');
    const pending = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(pending.bindings['producer/1'][0].commitOperation.state, 'pending');
    assert.equal(pending.bindings['producer/1'][0].commit, undefined);
    assert.equal(producerSpawns(main, id), 1);
    assert.equal(headOf(tree), landed);
    const resumed = await runUnit({ repoRoot: main, cwd: tree, resumeUnitRunId: id });
    assert.equal(resumed.outcome, 'pass', JSON.stringify(resumed));
    assert.equal(resumed.results[0].commit.status, 'committed');
    assert.equal(resumed.results[0].commit.sha, landed);
    assert.deepEqual(resumed.results[0].commit.files, ['docs/new']);
    assert.equal(headOf(tree), landed);
    assert.equal(producerSpawns(main, id), 1, 'resume never launches the producer again');
    const settled = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(settled.bindings['producer/1'][0].commitOperation.state, 'settled');
    assert.equal(settled.bindings['producer/1'][0].commit.status, 'committed');
    assert.equal(settled.settlement.outcome, 'pass');
  } finally {
    fs.rmSync(tree, { recursive: true, force: true });
    fs.rmSync(main, { recursive: true, force: true });
  }
});
function settleSeat(repoRoot, unitDir, role, round = '1', run = '01') {
  const runDir = path.join(unitDir, role, round, 'runs', run);
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'report.md');
  const reportContent = '# Report\nDone\n';
  fs.writeFileSync(reportPath, reportContent);
  const sha = crypto.createHash('sha256').update(reportContent).digest('hex');
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: `${role}-${round}-${run}`,
    outcome: 'pass',
    settledAt: '2026-10-05T01:01:00Z',
    classification: { outcome: { category: 'ok' } },
    agentClaim: { summary: 'Done', assessment: { verdict: 'pass' } },
    settleReports: [{ path: path.relative(repoRoot, reportPath), sha256: sha }],
  }));
}

test('a pinned unit keeps its effective meaning after a catalog and a config edit', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-pinned-edit');
  fs.mkdirSync(unitDir, { recursive: true });
  const record = {
    unit: { id: 'u-pinned', capability: 'code:implement', writes: [], pattern: 'reviewed', objective: 'Do review' },
    pattern: 'reviewed',
    seatSchema: 2,
    collaboration: {
      baseline: { source: 'unit', selector: 'reviewed' },
      pattern: { name: 'reviewed', layer: 'shipped', digest: 'abc123' },
      effective: {
        loop: 'reviewed',
        params: { maxRounds: 1 },
        seats: [
          { seat: 'producer', role: 'producer', posture: { writer: true } },
          { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
          { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
        ],
      },
      provenance: { params: {}, checkers: {} },
    },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
    ],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  settleSeat(repoRoot, unitDir, 'producer');
  settleSeat(repoRoot, unitDir, 'reviewer');
  settleSeat(repoRoot, unitDir, 'red-team');

  // Edit project config
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.loops = { reviewed: { maxRounds: 5 } };
  cfg.runner.patterns = { reviewed: { loop: 'reviewed', defaults: { maxRounds: 5 } } };
  writeProjectConfig(repoRoot, cfg);

  // Resume the pinned unit
  const res = await coreRunUnit({
    resumeUnitRunId: 'unit-run-pinned-edit',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1, 'loop received pin maxRounds 1, not edited config maxRounds 5');
  const stored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.equal(stored.collaboration.effective.params.maxRounds, 1);
  assert.equal(stored.collaboration.effective.loop, 'reviewed');
});
test('a pinned unit keeps its effective seats on resume after a snapshot refresh changes live checker config', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-pinned-roster');
  fs.mkdirSync(unitDir, { recursive: true });
  const record = {
    unit: { id: 'u-pinned-roster', capability: 'docs:write', writes: [], pattern: 'reviewed', objective: 'Do review' },
    pattern: 'reviewed',
    seatSchema: 2,
    collaboration: {
      baseline: { source: 'unit', selector: 'reviewed' },
      pattern: { name: 'reviewed', layer: 'shipped', digest: 'abc123' },
      effective: {
        loop: 'reviewed',
        params: { maxRounds: 1 },
        seats: [
          { seat: 'producer', role: 'producer', posture: { writer: true } },
          { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
          { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
        ],
      },
      provenance: { params: {}, checkers: {} },
    },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
    ],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  settleSeat(repoRoot, unitDir, 'producer');
  settleSeat(repoRoot, unitDir, 'reviewer');
  settleSeat(repoRoot, unitDir, 'red-team');

  // Change live capability config: docs:write has no default minCheckers, and live config restricts to reviewer only
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.capabilities = { 'docs:write': { minCheckers: ['reviewer'] } };
  cfg.runner.loops = { reviewed: { checkersByRigor: { standard: ['reviewer'] } } };
  writeProjectConfig(repoRoot, cfg);

  const firstRes = await coreRunUnit({
    resumeUnitRunId: 'unit-run-pinned-roster',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(firstRes.outcome, 'pass');
  assert.deepEqual(
    firstRes.results.map((r) => r.seat),
    ['producer', 'reviewer', 'red-team'],
    'resumed loop must execute all pinned seats from effective.seats rather than recomputed live config',
  );
  const firstStored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.deepEqual(firstStored.collaboration.effective.seats.map((s) => s.seat), ['producer', 'reviewer', 'red-team']);

});


test('an unreadable pin refuses collaboration-pin-unusable', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
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

test('resume ignores a caller --pattern', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-caller-pattern');
  fs.mkdirSync(unitDir, { recursive: true });
  settleSeat(repoRoot, unitDir, 'producer');
  const record = {
    unit: { id: 'u-ignore-caller-pattern', capability: 'docs:write', writes: [], objective: 'Do solo' },
    pattern: 'solo',
    seatSchema: 2,
    collaboration: {
      pattern: { name: 'solo' },
      effective: { loop: 'solo', params: {} },
    },
    seats: [{ seat: 'producer', role: 'producer', posture: { writer: true } }],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));

  const res = await coreRunUnit({
    resumeUnitRunId: 'unit-run-caller-pattern',
    pattern: 'panel', // caller pattern ignored
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.unitRunId, 'unit-run-caller-pattern');
  const stored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.equal(stored.collaboration.effective.loop, 'solo');
  assert.equal(stored.pattern, 'solo');
});

test('an unpinned schema-1 record resumes through the decoder', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-unpinned-schema1');
  fs.mkdirSync(unitDir, { recursive: true });
  settleSeat(repoRoot, unitDir, 'researcher-1');
  settleSeat(repoRoot, unitDir, 'researcher-2');
  settleSeat(repoRoot, unitDir, 'researcher-3');
  settleSeat(repoRoot, unitDir, 'synthesizer');
  const record = {
    unit: { id: 'u-unpinned', capability: 'code:implement', writes: [], pattern: 'research-fan-out-gated', objective: 'Do research' },
    pattern: 'research-fan-out-gated',
    seatSchema: 1,
    // No collaboration field
    seats: [
      { seat: 'researcher-1', role: 'producer', posture: { readOnly: true } },
      { seat: 'researcher-2', role: 'producer', posture: { readOnly: true } },
      { seat: 'researcher-3', role: 'producer', posture: { readOnly: true } },
      { seat: 'synthesizer', role: 'synthesizer', posture: {} },
    ],
    resolvedInputs: [],
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: { maxRounds: 3 },
        },
      },
    },
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));

  const res = await coreRunUnit({
    resumeUnitRunId: 'unit-run-unpinned-schema1',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  // Stored research-fan-out-gated was decoded to research-fan-out (loop panel)
  const stored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.equal(stored.collaboration.pattern.name, 'research-fan-out');
  assert.equal(stored.collaboration.effective.loop, 'panel');

  // Critical rigor record with snapshot listing tester resumes with tester seat
  const critDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-unpinned-crit');
  fs.mkdirSync(critDir, { recursive: true });
  const critRecord = {
    unit: { id: 'u-crit', capability: 'code:implement', writes: [], pattern: 'reviewed', rigor: 'critical', objective: 'Critical fix' },
    pattern: 'reviewed',
    seatSchema: 1,
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
      { seat: 'tester', role: 'reviewer', posture: { readOnly: true } },
    ],
    resolvedInputs: [],
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: {
            checkersByRigor: {
              critical: ['reviewer', 'red-team', 'tester'],
            },
          },
        },
      },
    },
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(critDir, 'unit.json'), JSON.stringify(critRecord));
  settleSeat(repoRoot, critDir, 'producer');
  settleSeat(repoRoot, critDir, 'reviewer');
  settleSeat(repoRoot, critDir, 'red-team');
  settleSeat(repoRoot, critDir, 'tester');

  const critRes = await coreRunUnit({
    resumeUnitRunId: 'unit-run-unpinned-crit',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(critRes.outcome, 'pass');
  const critStored = JSON.parse(fs.readFileSync(path.join(critDir, 'unit.json'), 'utf8'));
  assert.ok(critStored.collaboration.effective.seats.some((s) => s.seat === 'tester'));

  // Second resume across a live config checker-policy change preserves the decoded pin and passes
  const critCfg = readProjectConfig(repoRoot);
  critCfg.runner.loops = { reviewed: { checkersByRigor: { critical: ['reviewer', 'red-team'] } } };
  writeProjectConfig(repoRoot, critCfg);
  const secondResume = await coreRunUnit({
    resumeUnitRunId: 'unit-run-unpinned-crit',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(secondResume.outcome, 'pass');
  const secondStored = JSON.parse(fs.readFileSync(path.join(critDir, 'unit.json'), 'utf8'));
  assert.ok(secondStored.collaboration.effective.seats.some((s) => s.seat === 'tester'), 'tester seat preserved across second resume');
});
