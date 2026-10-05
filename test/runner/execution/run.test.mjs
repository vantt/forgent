// test/runner/execution/run.test.mjs — Tests for fgos run door, mutating gate, and inline record (Phase 5)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import { runUnit, recordInlineRun, resolveGitRoots, snapshotRunnerConfig, detectHerdrPresent } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/config.mjs';
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
