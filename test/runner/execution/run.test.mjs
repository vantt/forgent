// test/runner/execution/run.test.mjs — Tests for fgos run door, mutating gate, and inline record (Phase 5)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import { runUnit, recordInlineRun, resolveGitRoots, snapshotRunnerConfig, detectHerdrPresent } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/config.mjs';

function setupGitRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-run-test-'));
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
  const worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-run-wt-'));
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

async function mutatingGateFixture({ writeUnitJson = true, corrupt = false } = {}) {
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
      const runDir = path.dirname(match[1]);
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
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', command, args: [script, '{prompt}'] }],
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
