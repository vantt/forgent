// test/runner/execution/run.test.mjs — Tests for fgos run door, mutating gate, and inline record (Phase 5)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import { runUnit, recordInlineRun, resolveGitRoots, snapshotRunnerConfig, detectHerdrPresent } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/config.mjs';
import { writeUnitSummary } from '../../../src/runner/execution/unit-summary.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

// Confined runs mount a private tmpfs over /tmp, so fixtures that the executor
// must reach (command, worker script, worktree) live outside it.
const FIXTURE_ROOT = fs.existsSync('/var/tmp') ? '/var/tmp' : os.tmpdir();

function setupGitRepo() {
  const tmp = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-run-test-'));
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
      rigorToTier: {
        low: 'nano',
        standard: 'standard',
        high: 'flagship',
        critical: 'frontier',
      },
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
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
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
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(runnerConfig, null, 2));

  // Create linked worktree
  const worktreeDir = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-run-wt-'));
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

test('snapshotRunnerConfig captures hash and filtered runner config from main checkout', () => {
  const { repoRoot } = setupGitRepo();
  const snap = snapshotRunnerConfig(repoRoot);
  assert.ok(snap.hash && typeof snap.hash === 'string');
  assert.ok(snap.runner.capabilities['docs:write']);
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

test('recordInlineRun admits valid producer nonce with existing evidenceRefs', () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const unitRunId = 'unit-run-inline-test';
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });

  const unitRecord = {
    unit: { id: 'u-1', objective: 'Do inline work', capability: 'code:implement', writes: ['output.txt'] },
    overrides: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));

  // Create real evidence file in worktree
  fs.writeFileSync(path.join(worktreeDir, 'output.txt'), 'done content\n');

  // Create pending-inline.json
  const pending = {
    unitRunId,
    role: 'producer',
    round: 1,
    nonce: 'secret-nonce-1234',
  };
  fs.writeFileSync(path.join(unitDir, 'pending-inline.json'), JSON.stringify(pending, null, 2));

  // Record inline run
  const recordResult = recordInlineRun({
    unitRunId,
    role: 'producer',
    round: 1,
    nonce: 'secret-nonce-1234',
    evidenceRefs: ['output.txt'],
    result: { status: 'pass' },
    repoRoot,
  });

  assert.equal(recordResult.ok, true);
  assert.equal(fs.existsSync(path.join(unitDir, 'pending-inline.json')), false); // Nonce consumed!

  const resultPath = path.join(unitDir, 'producer', '1', 'runs', '01', 'result.json');
  assert.ok(fs.existsSync(resultPath));
  const saved = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  assert.deepEqual(saved.evidenceRefs, ['output.txt']);
  const summary = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'));
  assert.equal(summary.inline, true);
  assert.equal(summary.seats[0].role, 'producer');
  assert.equal(summary.seats[0].final.runId, null);
  assert.equal(summary.settledAt, saved.recordedAt);
});

test('recordInlineRun refuses invalid nonce, non-producer role, or missing evidence', () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const unitRunId = 'unit-run-inline-reject';
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });

  const unitRecord = {
    unit: { id: 'u-2', objective: 'Reject inline', capability: 'code:review', writes: [] },
    overrides: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));

  const pending = {
    unitRunId,
    role: 'producer',
    round: 1,
    nonce: 'valid-nonce',
  };
  fs.writeFileSync(path.join(unitDir, 'pending-inline.json'), JSON.stringify(pending, null, 2));

  // 1. Wrong nonce
  assert.throws(
    () => recordInlineRun({ unitRunId, role: 'producer', round: 1, nonce: 'wrong-nonce', evidenceRefs: ['README.md'], repoRoot }),
    /invalid nonce/,
  );

  // 2. Non-producer role
  assert.throws(
    () => recordInlineRun({ unitRunId, role: 'reviewer', round: 1, nonce: 'valid-nonce', evidenceRefs: ['README.md'], repoRoot }),
    /only producer role may record inline run/,
  );

  // 3. Non-existent evidence file
  assert.throws(
    () => recordInlineRun({ unitRunId, role: 'producer', round: 1, nonce: 'valid-nonce', evidenceRefs: ['non-existent.txt'], repoRoot }),
    /evidenceRef "non-existent.txt" does not exist/,
  );
});

test('architecture guard: src/runner/execution/run.mjs does NOT import state, coordination, or worktree', () => {
  const runFile = path.resolve('src/runner/execution/run.mjs');
  const content = fs.readFileSync(runFile, 'utf8');
  assert.ok(!/from\s+['"].*state\//.test(content));
  assert.ok(!/from\s+['"].*coordination\//.test(content));
  assert.ok(!/from\s+['"].*worktree/.test(content));
  assert.ok(!/from\s+['"].*merge/.test(content));
});

test('mutating gate: admits mutating unit in linked worktree matching unit.json', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  const unit = {
    id: 'u-mutate-1',
    objective: 'Implement feature',
    capability: 'docs:write',
    writes: ['src/feature.txt'],
  };

  const res = await runUnit({
    unitData: unit,
    repoRoot,
    cwd: worktreeDir,
    pattern: 'solo',
  });

  assert.ok(res.unitRunId);
  assert.equal(res.rounds, 1);
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
  const record = {
    unit: { id: 'u-gate', objective: 'Gate probe', capability: 'docs:write', writes: ['file.txt'] },
    overrides: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
  };
  if (twoCandidates) {
    // A second executor behind the first, so a fallback walk has somewhere to go.
    const runner = record.configSnapshot.runner;
    runner.executors['test-node-2'] = { ...runner.executors['test-node'], providerModel: 'node2' };
    runner.capabilities['docs:write'].prefer = [{ executor: 'test-node' }, { executor: 'test-node-2' }];
    runner.modelPolicies.node2 = runner.modelPolicies.node;
  }
  if (attempts) record.bindings = { 'producer/1': attempts(unitRunId) };
  if (bindings) record.bindings = bindings(unitRunId);
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
  return { baseAssignment, run, record };
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

test('mutating gate: refuses a binding that differs from the one bind() recomputes', async () => {
  const { baseAssignment, run } = await mutatingGateFixture();
  const forged = { ...baseAssignment, binding: { executor: 'some-other-executor', tier: 'standard', posture: 'write' } };
  await assert.rejects(() => run(forged), /binding mismatch/);
});

test('mutating gate: refuses an assignment that pins an executor other than the verified binding', async () => {
  const { baseAssignment, run, record } = await mutatingGateFixture();
  const { bind } = await import('../../../src/runner/execution/bind.mjs');
  const verified = bind(
    { unit: record.unit, role: 'producer', readOnly: false, overrides: [] },
    { runnerConfig: record.configSnapshot.runner, session: {} },
  );
  assert.ok(verified.executor, 'fixture must produce a real binding');
  const pinned = {
    ...baseAssignment,
    binding: { executor: verified.executor, tier: verified.tier, posture: verified.posture },
    policy: { preferExecutor: 'rogue-executor' },
  };
  await assert.rejects(() => run(pinned), /pins executor "rogue-executor"/);
});

const gateAttempt = (unitRunId, n, executor, candidateIndex, outcome) => ({
  role: 'producer',
  round: 1,
  assignmentId: n === 0 ? `${unitRunId}/producer/1` : `${unitRunId}/producer/1-fb${n}`,
  binding: { executor, candidateIndex },
  ...(outcome ? { outcome } : {}),
});

test('mutating gate: a fallback attempt must follow a provider-limit attempt the runner recorded', async () => {
  // Attempt 0 settled as a pass, yet the assignment claims the second candidate.
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    attempts: (id) => [gateAttempt(id, 0, 'test-node', 0, 'pass'), gateAttempt(id, 1, 'test-node-2', 1)],
  });
  const forged = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/producer/1-fb1`, binding: { executor: 'test-node-2', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(forged), /binding mismatch/);
});

test('mutating gate: an assignment the runner never recorded cannot claim a fallback binding', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    attempts: (id) => [gateAttempt(id, 0, 'test-node', 0, 'provider-limit')],
  });
  const forged = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/producer/1-fb1`, binding: { executor: 'test-node-2', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(forged), /binding mismatch/);
});

test('mutating gate: a recorded fallback attempt cannot be rebound to the candidate that already hit its limit', async () => {
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    attempts: (id) => [gateAttempt(id, 0, 'test-node', 0, 'provider-limit'), gateAttempt(id, 1, 'test-node-2', 1)],
  });
  const replay = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/producer/1-fb1`, binding: { executor: 'test-node', tier: 'standard', posture: 'workspace-write' } };
  await assert.rejects(() => run(replay), /binding mismatch/);
});

test('mutating gate: a producer cannot borrow the fallback attempt of another role or round', async () => {
  const other = (id, role, round) => [
    { role, round, assignmentId: `${id}/${role}/${round}`, binding: { executor: 'test-node', candidateIndex: 0 }, outcome: 'provider-limit' },
    { role, round, assignmentId: `${id}/${role}/${round}-fb1`, binding: { executor: 'test-node-2', candidateIndex: 1 } },
  ];
  const { baseAssignment, run } = await mutatingGateFixture({
    twoCandidates: true,
    bindings: (id) => ({
      'producer/1': [gateAttempt(id, 0, 'test-node', 0, 'pass')],
      'checker/1': other(id, 'checker', 1),
      'producer/2': other(id, 'producer', 2),
    }),
  });
  const claimed = { executor: 'test-node-2', tier: 'standard', posture: 'workspace-write' };
  for (const borrowed of ['checker/1-fb1', 'producer/2-fb1']) {
    const forged = { ...baseAssignment, assignmentId: `${baseAssignment.unitRunId}/${borrowed}`, binding: claimed };
    await assert.rejects(() => run(forged), /binding mismatch/, borrowed);
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
  const cfgPath = path.join(repoRoot, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
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
  const prefer = executorNames.map((executor) => ({ executor }));
  cfg.runner.capabilities['docs:write'] = { prefer, rigor: 'standard' };
  cfg.runner.capabilities['docs:review'] = { prefer, persona: 'code-reviewer', rigor: 'standard' };
  cfg.runner.defaultExecutor = executorNames[0];
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
}

test('a reviewed run never lets the producer family also check its own work', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await runUnit({
    unitData: { id: 'u-indep', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
  });
  const byRole = Object.fromEntries(res.results.map((r) => [r.role, r.runResult?.executorId]));
  assert.equal(byRole.producer, 'alpha');
  assert.equal(byRole.reviewer, 'beta', 'the reviewer must run on a different provider family than the producer');
});

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
  const checker = res.results.find((r) => r.role === 'reviewer');
  assert.equal(checker.refused.reason, 'independence');
});

test('panel members run on different provider families', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await runUnit({
    unitData: { id: 'u-panel', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  const members = res.results.filter((r) => r.role.startsWith('panelist-')).map((r) => r.runResult?.executorId);
  assert.equal(members.length, 3);
  assert.equal(new Set(members).size, 3, `panelists must not share a provider family, got ${members.join(',')}`);
});

test('a panel with fewer provider families than members refuses instead of repeating one', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-2', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'policy-refusal');
  assert.ok(res.results.some((r) => r.refused?.reason === 'independence'));
});

test('the panel synthesizer runs on a provider family none of the panelists used', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-synth', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  const members = res.results.filter((r) => r.role.startsWith('panelist-')).map((r) => r.runResult?.executorId);
  const synth = res.results.find((r) => r.role === 'synthesizer');
  assert.equal(members.length, 3);
  assert.ok(synth?.runResult?.executorId, `synthesizer should have run, got ${JSON.stringify(res).slice(0, 1500)}`);
  assert.ok(!members.includes(synth.runResult.executorId), 'synthesizer shares a provider family with a panelist');
});

test('the panel synthesizer is told to read every panelist report; the panelists are told nothing', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-refs', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  const assignmentOf = (role) =>
    JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, role, '1', 'assignment.json'), 'utf8'));

  const refs = assignmentOf('synthesizer').contextRefs;
  assert.equal(refs.length, 3, `synthesizer refs: ${JSON.stringify(refs)}`);
  for (const [i, ref] of refs.entries()) {
    assert.ok(path.isAbsolute(ref), `ref is absolute: ${ref}`);
    assert.ok(ref.includes(`/panelist-${i + 1}/`), `ref ${i} points at panelist-${i + 1}: ${ref}`);
    assert.ok(/(report-\d+|agent-report)\.md$/.test(ref), `ref is a report: ${ref}`);
    assert.ok(fs.existsSync(ref), `ref exists: ${ref}`);
  }
  for (const n of [1, 2, 3]) assert.deepEqual(assignmentOf(`panelist-${n}`).contextRefs, []);

  // Each role is told its own task: the panelists the plain objective, the synthesizer a synthesis of it.
  for (const n of [1, 2, 3]) assert.equal(assignmentOf(`panelist-${n}`).objective, 'Review the design');
  const synthObjective = assignmentOf('synthesizer').objective;
  assert.match(synthObjective, /synthesizer/i);
  assert.ok(synthObjective.includes('Review the design'), 'the panel\'s task is quoted to the synthesizer');
});

test('a unit-run input reaches the roles as the absolute path of that role\'s report, resolved once into unit.json', async () => {
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

test('a reviewed run tells the reviewer to review and hands it the producer\'s report', async () => {
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

test('a panel whose every provider family is taken by panelists refuses the synthesizer', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await runUnit({
    unitData: { id: 'u-panel-synth-2', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'policy-refusal');
  const synth = res.results.find((r) => r.role === 'synthesizer');
  assert.equal(synth.refused.reason, 'independence');
});

test('fgos run reclaims a private home whose owning process is gone before it does anything else', async () => {
  const base = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-run-reap-'));
  const previousTmp = process.env.TMPDIR;
  process.env.TMPDIR = base;
  try {
    const root = path.join(base, 'fgos-confinement');
    const home = path.join(root, 'disp_stale', 'home');
    fs.mkdirSync(home, { recursive: true });
    fs.writeFileSync(path.join(home, 'auth.json'), '{}');
    fs.writeFileSync(
      path.join(home, '.fgos-confinement-owner.json'),
      JSON.stringify({
        contract: 'confinement-resource-ownership.v1',
        creator: 'fgos-confinement',
        dispatchId: 'disp_stale',
        resource: 'private-home',
        pid: 2 ** 22 + 1, // above the kernel's pid ceiling: never alive
        createdAt: new Date().toISOString(),
      }),
    );
    // No unit given: the run refuses, but only after the reap.
    await assert.rejects(() => runUnit({ cwd: base }), RunnerConfigError);
    assert.equal(fs.existsSync(path.join(root, 'disp_stale')), false);
  } finally {
    if (previousTmp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = previousTmp;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

// A worker that writes a file in its worktree and never touches git.
function writeFileWritingWorker(repoRoot) {
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
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Added the feature file', assessment: { verdict: 'pass' } }));
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
  assert.equal(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), 'Added the feature file');
  assert.notEqual(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), before);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), '', 'nothing left uncommitted');
  const unitRecord = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'), 'utf8'));
  assert.equal(Object.values(unitRecord.bindings)[0][0].commit.status, 'committed', 'the run record says what the runner committed');
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
    unitData: { id: 'u-panel-blind', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', blind: true },
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
    assert.ok(ref.includes(`panelist-${i + 1}`), `ref ${i} is the copy of panelist-${i + 1}'s report: ${ref}`);
    assert.ok(fs.statSync(ref).size > 0 && !fs.lstatSync(ref).isSymbolicLink());
  }
});

test('each role of a panel gets its own seat\'s earlier report as own-previous, blind or not, and not the other seats\'', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'panel' });
  const first = await run({ id: 'u-round-1', objective: 'Propose', capability: 'docs:write', writes: [], pattern: 'panel' });
  const reportOf = (role) => path.join(repoRoot, first.results.find((r) => r.role === role).runResult.settleReports[0].path);

  for (const blind of [false, true]) {
    const res = await run({
      id: `u-round-2-${blind}`, objective: 'Revise', capability: 'docs:write', writes: [], pattern: 'panel', blind,
      inputs: [`unit-run:${first.unitRunId}/{seat}`],
    });
    assert.equal(res.outcome, 'pass');
    const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).resolvedInputs, [], 'resolved per role, not for the unit');

    for (const role of ['panelist-1', 'panelist-2', 'panelist-3']) {
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
});

test('a seat the earlier run did not have is refused with a named reason when that role is dispatched', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const run = (unitData, pattern) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern });
  const first = await run({ id: 'u-panel', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'panel' }, 'panel');
  await assert.rejects(
    () => run({ id: 'u-own', objective: 'x', capability: 'docs:write', writes: [], pattern: 'solo', inputs: [`unit-run:${first.unitRunId}/{seat}`] }, 'solo'),
    /no-such-seat/,
  );
});

test('unit summaries cover refusal, thrown execution and resume without duplicating settled seats', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'summary-doors', capability: 'not-configured:answer', objective: 'Answer question', writes: [] };
  const refused = await runUnit({ unitData, repoRoot, cwd: worktreeDir });
  const dir = path.join(repoRoot, '.fgos', 'assignments', refused.unitRunId);
  const readSummary = () => JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
  assert.equal(refused.outcome, 'policy-refusal');
  assert.equal(readSummary().outcome, 'policy-refusal');
  assert.deepEqual(readSummary().seats, []);
  assert.equal(readSummary().workflow, null);
  // An unknown pattern throws after owner metadata exists.
  await assert.rejects(runUnit({ unitData, repoRoot, cwd: worktreeDir, pattern: 'nonexistent-pattern' }));
  const other = fs.readdirSync(path.dirname(dir)).find((name) => name !== refused.unitRunId);
  const thrown = JSON.parse(fs.readFileSync(path.join(path.dirname(dir), other, 'unit-summary.json'), 'utf8'));
  assert.equal(thrown.outcome, 'execution-failure');
  assert.ok(thrown.settledAt);
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
  const record = {
    unit: { id: 'recorded-question', objective: 'Answer the question', capability: 'not-configured:answer',
      writes: [], pattern, stanceOptions: ['a', 'b'] },
    pattern,
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    overrides: [],
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  const readRecord = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const readSummary = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'));
  return { repoRoot, worktreeDir, unitRunId, unitDir, record, readRecord, readSummary };
}

function pendingInlineFixture(fixture) {
  fs.writeFileSync(path.join(fixture.unitDir, 'pending-inline.json'), JSON.stringify({
    role: 'producer', round: 1, nonce: 'single-use', binding: { executor: 'lead' },
  }));
  return { repoRoot: fixture.repoRoot, unitRunId: fixture.unitRunId, role: 'producer', round: 1,
    nonce: 'single-use', evidenceRefs: ['README.md'], result: { status: 'done', summary: 'Answered' } };
}

test('inline reviewed producer remains pending and resume continues through checker settlement', async (t) => {
  const fixture = recordedUnitFixture(t, 'reviewed');
  const inline = recordInlineRun(pendingInlineFixture(fixture));
  assert.equal(inline.ok, true);
  assert.equal(fixture.readRecord().settlement, undefined);
  assert.equal(fixture.readRecord().execution.status, 'pending');
  assert.equal(fs.existsSync(path.join(fixture.unitDir, 'unit-summary.json')), false);
  const producerResult = path.join(fixture.unitDir, 'producer', '1', 'runs', '01', 'result.json');
  const originalProducer = fs.readFileSync(producerResult, 'utf8');
  const resumed = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId });
  assert.equal(resumed.outcome, 'policy-refusal');
  assert.deepEqual(resumed.results.map(({ role }) => role), ['producer', 'reviewer']);
  assert.ok(resumed.results[1].refused);
  assert.equal(fs.readFileSync(producerResult, 'utf8'), originalProducer);
  assert.equal(fixture.readRecord().settlement.outcome, 'policy-refusal');
  assert.equal(fixture.readSummary().outcome, 'policy-refusal');
  assert.equal(fixture.readSummary().seats[0].kind, 'producer');
});

test('inline producer for a multi-role preset does not publish final settlement', (t) => {
  for (const pattern of ['code-change', 'panel']) {
    const fixture = recordedUnitFixture(t, pattern);
    recordInlineRun(pendingInlineFixture(fixture));
    assert.equal(fixture.readRecord().settlement, undefined);
    assert.equal(fs.existsSync(path.join(fixture.unitDir, 'unit-summary.json')), false);
    assert.ok(fs.existsSync(path.join(fixture.unitDir, 'producer', '1', 'runs', '01', 'result.json')));
  }
});

test('requesting inline work does not publish a settled unit before the result is recorded', async (t) => {
  const fixture = recordedUnitFixture(t, 'reviewed');
  const pending = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId, session: { headless: false, hasNativeAgent: true, provider: 'lead' } });
  assert.equal(pending.outcome, 'blocked');
  assert.ok(pending.results[0].pendingInline);
  assert.equal(fixture.readRecord().settlement, undefined);
  assert.equal(fixture.readRecord().execution.status, 'pending-inline');
  assert.equal(fs.existsSync(path.join(fixture.unitDir, 'unit-summary.json')), false);
});

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
  fs.mkdirSync(path.join(fixture.unitDir, 'unit-summary.json'));
  const failure = new Error('inline request could not be persisted');
  const writeFile = fs.writeFileSync;
  t.mock.method(fs, 'writeFileSync', (file, ...args) => {
    if (file === path.join(fixture.unitDir, 'pending-inline.json')) throw failure;
    return writeFile(file, ...args);
  });
  const warning = t.mock.method(console, 'warn', () => {});
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId, session: { headless: false, hasNativeAgent: true, provider: 'lead' } }),
  (error) => {
    assert.equal(error, failure);
    return true;
  });
  assert.equal(fixture.readRecord().settlement.outcome, 'execution-failure');
  assert.equal(warning.mock.callCount(), 1);
});

test('summary I/O failure after inline solo completion warns without losing the recorded result', (t) => {
  const fixture = recordedUnitFixture(t);
  const params = pendingInlineFixture(fixture);
  fs.mkdirSync(path.join(fixture.unitDir, 'unit-summary.json'));
  const warning = t.mock.method(console, 'warn', () => {});
  assert.equal(recordInlineRun(params).ok, true);
  assert.equal(fixture.readRecord().settlement.outcome, 'pass');
  assert.equal(fixture.readRecord().execution.status, 'settled');
  assert.equal(fs.existsSync(path.join(fixture.unitDir, 'pending-inline.json')), false);
  assert.ok(fs.existsSync(path.join(fixture.unitDir, 'producer', '1', 'runs', '01', 'result.json')));
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
    'reviewer/1': [{ role: 'reviewer', round: 1, binding: { executor: 'beta', mechanism: 'inline' } }],
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
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }), (error) => error instanceof RunnerConfigError && /cannot be bound inline/.test(error.message));
  const summary = fixture.readSummary();
  assert.equal(summary.outcome, 'execution-failure');
  const sibling = summary.seats.find((seat) => seat.role === 'red-team');
  assert.ok(sibling?.final.runId);
  assert.equal(sibling.final.outcome, 'pass');
  assert.equal(sibling.kind, 'checker');
  assert.equal(fixture.readRecord().settlement.outcome, 'execution-failure');
});

test('a failed settlement write never replaces the execution error that caused it', async (t) => {
  const fixture = recordedUnitFixture(t, 'nonexistent-pattern');
  const unitFile = path.join(fixture.unitDir, 'unit.json');
  const rename = fs.renameSync;
  const read = fs.readFileSync;
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
  (error) => /Unknown collaboration pattern: "nonexistent-pattern"/.test(error.message));
  assert.equal(warning.mock.callCount(), 1);
  assert.match(warning.mock.calls[0].arguments[0], /could not record the failed settlement.*unit record storage unavailable/);
  assert.equal(fixture.readRecord().execution.status, 'running', 'the record keeps the last state that was written');
  assert.equal(fixture.readRecord().settlement, undefined);
  assert.deepEqual(fs.readdirSync(fixture.unitDir).filter((name) => name.endsWith('.tmp')), [], 'no partial record is left behind');
});
