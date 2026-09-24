// test/runner/dispatch-i08b-remediation.test.mjs
// Dedicated regression test suite for Unit I08b remediation: F4, F5, F6, F7, F10.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  RunnerConfigError,
} from '../../src/runner/dispatch/config.mjs';
import {
  DispatchError,
  resolveHerdrBin,
} from '../../src/runner/dispatch/transport.mjs';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { interpretRunResult, validateRunResultV2 } from '../../src/runner/dispatch/run-result.mjs';
import { readRunSnapshot } from '../../src/verbs/dispatch/show-run.mjs';
import { watchRunUseCase } from '../../src/verbs/dispatch/watch.mjs';
import { reconcileHerdrSpawnRun } from '../../src/runner/dispatch/herdr-round.mjs';
import { reconcilePlanUseCase, DispatchReconcileError } from '../../src/verbs/dispatch/reconcile.mjs';
import { planReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

function runFgos(args, options = {}) {
  return spawnSync(process.execPath, ['bin/fgos.mjs', ...args], {
    cwd: REPO,
    encoding: 'utf8',
    ...options,
  });
}

function runDispatchDirect(args, options = {}) {
  return spawnSync(process.execPath, ['src/runner/dispatch.mjs', ...args], {
    cwd: REPO,
    encoding: 'utf8',
    ...options,
  });
}

// ─── 1. F4: Explicit Unregistered Executor Fails Closed ──────────────────────

test('F4: explicit unregistered executor fails closed across public CLI, compat door, and executeExecutorCli', async () => {
  const unregisteredId = 'unregistered-test-executor-f4-' + Date.now();

  // 1a. Public CLI door (fgos dispatch execute <id>)
  const cliRes = runFgos(['dispatch', 'execute', unregisteredId]);
  assert.equal(cliRes.status, 1, `expected exit code 1, got ${cliRes.status}\nstderr: ${cliRes.stderr}\nstdout: ${cliRes.stdout}`);
  assert.match(cliRes.stdout + cliRes.stderr, /executor-not-found/);

  // 1b. Compat door (node src/runner/dispatch.mjs execute <id>)
  const compatRes = runDispatchDirect(['execute', unregisteredId]);
  assert.equal(compatRes.status, 1, `expected exit code 1, got ${compatRes.status}\nstderr: ${compatRes.stderr}`);
  const compatParsed = JSON.parse(compatRes.stdout.trim());
  assert.equal(compatParsed.errorClass, 'executor-not-found');
  assert.match(compatParsed.error, new RegExp(unregisteredId));

  // 1c. Programmatic executeExecutorCli
  await assert.rejects(
    executeExecutorCli(unregisteredId, { prompt: 'test' }),
    (err) => {
      assert.ok(err instanceof DispatchError, 'must be an instance of DispatchError');
      assert.ok(err instanceof RunnerConfigError, 'DispatchError must extend RunnerConfigError');
      assert.equal(err.errorClass, 'executor-not-found');
      assert.match(err.message, new RegExp(unregisteredId));
      return true;
    },
  );
});

// ─── 2. F5: Canonicalize Provider Family Based on Real Command ───────────────

test('F5: spoofed providerModel is caught as cross-provider, intra-family is allowed, and canonical family recorded', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-f5-regression-'));
  const workerScript = path.join(tmp, 'worker.mjs');
  fs.writeFileSync(workerScript, 'process.exit(0);');

  // 2a. Spoofed providerModel: 'claude' but command is 'codex' (openai family)
  // Without allowCrossProvider: true, it must fail closed before spawning.
  const runnerConfigSpoofed = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': ['codex-spoofed'],
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-5-sonnet' },
      openai: { standard: 'gpt-4o' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerScript],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'codex-spoofed': {
        command: 'codex', // Actual command is codex (openai family)
        args: [workerScript],
        providerModel: 'claude', // Spoofed!
        allowCrossProvider: false,
      },
    },
  };

  const asgnSpoofed = buildAssignment({
    assignmentId: 'asgn_f5_spoofed_' + Date.now(),
    role: 'planner',
    operation: 'shape-plan',
    workId: 'wrk_f5_1',
    stage: 'planning',
    policy: {
      providerModel: 'claude',
      executorPreference: ['claude'],
      minTier: 'standard',
    },
    mutation: 'read-only',
  });

  await assert.rejects(
    executeAssignment(asgnSpoofed, {
      runnerConfig: runnerConfigSpoofed,
      repoRoot: tmp,
      cwd: tmp,
    }),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.match(err.message, /crosses provider family without explicit opt-in/);
      return true;
    },
  );

  // 2b. Intra-family redirect: openai -> openai-codex (both canonical family 'openai')
  // Should NOT be treated as cross-provider, even without allowCrossProvider: true on target!
  const runnerConfigIntraFamily = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': ['openai-codex-target'],
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-5-sonnet' },
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerScript],
        providerModel: 'openai',
        allowCrossProvider: true,
      },
      'openai-codex-target': {
        command: process.execPath,
        args: [workerScript],
        providerModel: 'openai-codex', // Same canonical family 'openai' as source!
        allowCrossProvider: true, // Executor egress permission
      },
    },
  };

  const asgnIntra = buildAssignment({
    assignmentId: 'asgn_f5_intra_' + Date.now(),
    role: 'planner',
    operation: 'shape-plan',
    workId: 'wrk_f5_2',
    stage: 'planning',
    policy: {
      providerModel: 'openai',
      executorPreference: ['claude'],
      minTier: 'standard',
    },
    mutation: 'read-only',
  });

  // executeAssignment will run workerScript (process.exit(0)) successfully without cross-provider error
  const intraRes = await executeAssignment(asgnIntra, {
    runnerConfig: runnerConfigIntraFamily,
    repoRoot: tmp,
    cwd: tmp,
  });
  assert.ok(intraRes);
  assert.notEqual(intraRes.status, 'failed');

  // Verify provenance in dispatch-plan.json
  const planPath = path.join(tmp, '.fgos', 'assignments', asgnIntra.assignmentId, 'runs', '01', 'dispatch-plan.json');
  assert.ok(fs.existsSync(planPath), 'dispatch-plan.json must exist');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  assert.ok(plan.redirectDecision);
  assert.equal(plan.redirectDecision.sourceProvider, 'openai-codex');
  assert.equal(plan.redirectDecision.selectedProvider, 'openai-codex'); // Canonical family!
  assert.equal(plan.redirectDecision.crossProvider, false);

  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── 3. F6: Trim and Precedence for resolveHerdrBin ──────────────────────────

test('F6: resolveHerdrBin trims whitespace and honors caller opts over env', () => {
  const prevEnv = process.env.FGOS_HERDR_BIN;
  try {
    // 3a. Option takes precedence over environment variable
    process.env.FGOS_HERDR_BIN = '  /usr/local/bin/env-herdr  ';
    assert.equal(resolveHerdrBin('  /opt/bin/caller-herdr  '), '/opt/bin/caller-herdr');

    // 3b. Environment variable trimmed when option is omitted
    assert.equal(resolveHerdrBin(), '/usr/local/bin/env-herdr');
    assert.equal(resolveHerdrBin(undefined), '/usr/local/bin/env-herdr');

    // 3c. Whitespace-only option falls back to trimmed environment variable
    assert.equal(resolveHerdrBin('   '), '/usr/local/bin/env-herdr');

    // 3d. Fallback to default 'herdr' when both are empty / whitespace
    delete process.env.FGOS_HERDR_BIN;
    assert.equal(resolveHerdrBin(), 'herdr');
    assert.equal(resolveHerdrBin('   '), 'herdr');

    process.env.FGOS_HERDR_BIN = '   ';
    assert.equal(resolveHerdrBin(), 'herdr');
  } finally {
    if (prevEnv !== undefined) {
      process.env.FGOS_HERDR_BIN = prevEnv;
    } else {
      delete process.env.FGOS_HERDR_BIN;
    }
  }
});

// ─── 4. F7: expectedRunId Mismatch Fails Closed Across Intake Doors ──────────

test('F7: result.json with mismatched runId is flagged contract-corrupt and never settles', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-f7-regression-'));

  // 4a. interpretRunResult directly
  const mismatchedV2 = {
    contract: { id: 'assignment-run-result', version: 2 },
    runId: 'run_actual_wrong',
    assignmentId: 'asgn_1',
    classification: {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict: 'pass' },
      confidence: { level: 'verified', basis: ['receipt'] },
      policy: { disposition: 'allow' },
      delivery: { mode: 'fresh' },
    },
  };
  const interpreted = interpretRunResult(mismatchedV2, { expectedRunId: 'run_expected_right' });
  assert.equal(interpreted.contractCorrupt, true);
  assert.equal(interpreted.resultCorrupt, true);
  assert.equal(interpreted.corrupt, true);
  assert.equal(interpreted.status, 'no-evidence');
  assert.equal(interpreted.confidence, 'failed');
  assert.equal(interpreted.classification.provenance, 'contract-corrupt');

  // 4b. readRunSnapshot in show-run.mjs
  const runDir = path.join(tmp, '.fgos', 'assignments', 'asgn_f7_test', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run_expected_123', status: 'running', assignmentId: 'asgn_f7_test' }));
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    ...mismatchedV2,
    runId: 'run_different_456',
  }));

  const snapshot = readRunSnapshot(runDir);
  assert.equal(snapshot.settled, false, 'must NOT be settled');
  assert.equal(snapshot.resultCorrupt, true, 'must be marked resultCorrupt');

  // 4c. watchRunUseCase in watch.mjs terminates with corrupt-evidence
  const watchResult = await watchRunUseCase(
    { cwd: tmp, repoRoot: tmp },
    { runId: 'run_expected_123', maxTicks: 5, intervalMs: 10 },
  );
  assert.equal(watchResult.stoppedBecause, 'corrupt-evidence');
  assert.equal(watchResult.settled, false);

  // 4d. reconcileHerdrSpawnRun in herdr-round.mjs returns corrupt, not settled
  const herdrReconcile = await reconcileHerdrSpawnRun(runDir, { expectedRunId: 'run_expected_123' });
  assert.equal(herdrReconcile.status, 'corrupt');
  assert.equal(herdrReconcile.corrupt, true);
  assert.equal(herdrReconcile.resultCorrupt, true);
  assert.notEqual(herdrReconcile.status, 'settled');

  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── 5. F10: reconcile plan without --action Fails with Exit 4 ───────────────

test('F10: reconcile plan with --run or --assignment requires --action before checking cwd lock', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-f10-regression-'));
  // Ensure no cwd lock exists in tmp workspace
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'dispatch.lock')), false);

  // 5a. CLI with --run without --action must exit 4
  const resRun = runFgos(['dispatch', 'reconcile', 'plan', '--run', 'run_f10_test', '--dir', tmp]);
  assert.equal(resRun.status, 4, `expected exit code 4, got ${resRun.status}\nstderr: ${resRun.stderr}`);
  assert.match(resRun.stderr, /requires --action/);

  // 5b. CLI with --assignment without --action must exit 4
  const resAsgn = runFgos(['dispatch', 'reconcile', 'plan', '--assignment', 'asgn_f10_test', '--dir', tmp]);
  assert.equal(resAsgn.status, 4, `expected exit code 4, got ${resAsgn.status}\nstderr: ${resAsgn.stderr}`);
  assert.match(resAsgn.stderr, /requires --action/);

  // 5c. CLI with --run and --action clear-cwd-lock must exit 4
  const resClear = runFgos(['dispatch', 'reconcile', 'plan', '--run', 'run_f10_test', '--action', 'clear-cwd-lock', '--dir', tmp]);
  assert.equal(resClear.status, 4, `expected exit code 4, got ${resClear.status}\nstderr: ${resClear.stderr}`);
  assert.match(resClear.stderr, /requires --action/);

  // 5d. reconcilePlanUseCase direct call throws DispatchReconcileError with category 'validation'
  assert.throws(
    () => reconcilePlanUseCase({ cwd: tmp }, { runId: 'run_f10_test' }),
    (err) => {
      assert.ok(err instanceof DispatchReconcileError);
      assert.equal(err.category, 'validation');
      assert.match(err.message, /requires --action/);
      return true;
    },
  );

  // 5e. planReconciliation direct call returns refused before examining cwd lock
  const planRes = planReconciliation(tmp, { runId: 'run_f10_test' });
  assert.equal(planRes.outcome, 'refused');
  assert.match(planRes.reason, /requires --action/);

  fs.rmSync(tmp, { recursive: true, force: true });
});
