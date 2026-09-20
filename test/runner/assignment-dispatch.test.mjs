import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync, execFileSync, execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { executeAssignment, resolveWorkerArtifactPath } from '../../src/runner/dispatch/assignment-runner.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { prepareDispatch } from '../../src/runner/dispatch/prepare.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { decideExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { openSession, createSessionAssignment } from '../../src/runner/coordination/store.mjs';
import { acquireRunControl, releaseRunControl } from '../../src/runner/dispatch/run-lock.mjs';
import { initStore, addWork, listWork, settleClaim } from '../../src/state/store.mjs';
import { acquireClaim, readClaim } from '../../src/state/runtime-coordination.mjs';
import { inspectProviderCapacity, providerCapacityStatePaths, PROVIDER_CAPACITY_STATE_CONTRACT } from '../../src/runner/dispatch/provider-capacity.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-asgn-dispatch-test-'));
}

// Genuine OS-level concurrency (real subprocesses launched via Promise.all),
// not sequential execFileSync -- the only way to actually exercise the
// assignmentId claim race, as opposed to the sequential/retry case the
// earlier Fix Round 1 test already covers.
function execFileAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function writeEchoExecutor(dir) {
  const scriptPath = path.join(dir, 'echo-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    let runDir;
    if (match) {
      runDir = path.dirname(match[1]);
    } else {
      const asgnDir = path.join(dir, '.fgos', 'assignments');
      if (fs.existsSync(asgnDir)) {
        for (const asgn of fs.readdirSync(asgnDir)) {
          const rDir = path.join(asgnDir, asgn, 'runs', '01');
          if (fs.existsSync(rDir)) {
            runDir = rDir;
            break;
          }
        }
      }
    }
    if (runDir) {
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed successfully with full report content.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    process.stdout.write("All good\\n");
    process.exit(0);
    `,
  );
  return scriptPath;
}

function writeFailingExecutor(dir, exitCode = 1) {
  const scriptPath = path.join(dir, 'failing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stderr.write("Simulated failure\\n");
    process.exit(${exitCode});
    `,
  );
  return scriptPath;
}

// Records the exact argv the spawned process received (Cell 6.3 Fix Round 1
// regression coverage), then completes the run the same way writeEchoExecutor
// does so executeAssignment settles the RunResult as "done".
function writeArgvRecordingExecutor(dir, label) {
  const scriptPath = path.join(dir, `${label}-argv-executor.mjs`);
  const argvCapturePath = path.join(dir, `${label}-argv.json`);
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(${JSON.stringify(argvCapturePath)}, JSON.stringify(process.argv.slice(2)));
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = path.dirname(match[1]);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed successfully with full report content.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    process.exit(0);
    `,
  );
  return { scriptPath, argvCapturePath };
}

function writeHangingExecutor(dir) {
  const scriptPath = path.join(dir, 'hanging-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write("Starting long work...\\n");
    setTimeout(() => {
      process.stdout.write("Finished\\n");
      process.exit(0);
    }, 10000);
    `,
  );
  return scriptPath;
}

test('executeAssignment executes non-mutating validate-plan assignment through fake executor', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-test-1', status: 'doing', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.assignmentId, assignment.assignmentId);
  assert.equal(result.workId, 'tsk-test-1');
  assert.equal(result.runtime.exitCode, 0);
  assert.equal(result.status, 'done');
  assert.equal(result.confidence, 'reported');

  // Verify Work object remains completely unchanged
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('executeAssignment captures stderr and nonzero exit code as failed result without throwing or altering Work', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeFailingExecutor(tempDir, 2);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-test-fail', status: 'doing', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.assignmentId, assignment.assignmentId);
  assert.equal(result.runtime.exitCode, 2);
  assert.equal(result.status, 'failed');
  assert.equal(result.confidence, 'failed');

  // Work remains untouched
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('executeAssignment captures timeout with partial stdout and writes failed RunResult storage (P2)', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeHangingExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 150,
  };

  const work = { id: 'tsk-test-timeout', status: 'doing', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    timeoutMs: 150,
  });

  assert.equal(result.assignmentId, assignment.assignmentId);
  assert.equal(result.status, 'failed');
  assert.equal(result.confidence, 'failed');
  assert.equal(result.runtime.exitCode, 124);

  // Storage assertions
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  assert.ok(fs.existsSync(path.join(runDir, 'run.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'stdout.log')));
  assert.ok(fs.existsSync(path.join(runDir, 'stderr.log')));
  assert.ok(fs.existsSync(path.join(runDir, 'exit.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'evidence.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'result.json')));

  const stdoutContent = fs.readFileSync(path.join(runDir, 'stdout.log'), 'utf8');
  assert.match(stdoutContent, /Starting long work/);

  const exitData = JSON.parse(fs.readFileSync(path.join(runDir, 'exit.json'), 'utf8'));
  assert.equal(exitData.exitCode, 124);
  assert.equal(exitData.signal, 'SIGTERM');

  // run.json used to be written once as `running` and never again, so a run
  // that ended and a run whose process was killed read identically off disk
  // forever after. A run that reached its end says so -- including this one,
  // whose work failed. Whether the WORK succeeded is result.json's business.
  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runMeta.status, 'settled');
  assert.ok(runMeta.settledAt, 'and records when it ended');

  // Work remains untouched
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('executeAssignment rejects human-only assignment before spawning', async () => {
  const tempDir = mkTempDir();
  const assignment = buildAssignment({
    stage: 'exploring',
    operation: 'answer-question',
  });

  await assert.rejects(
    () => executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof RunnerConfigError && /cannot execute human-only/i.test(err.message),
  );
});

test('prepareDispatch accepts an Assignment unit with assignmentId', () => {
  const assignment = buildAssignment({
    workId: 'tsk-prep-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const prepared = prepareDispatch(assignment);
  assert.equal(prepared.unit.assignmentId, assignment.assignmentId);
});

test('compileDispatchPlan produces selector.type: "assignment" and resolves executor from assignment policy', () => {
  const cfg = {
    executors: {
      claude: { command: 'claude', args: ['{prompt}'] },
    },
    modelPolicies: {
      claude: {
        standard: 'claude-3-7-sonnet-20250219',
      },
    },
  };

  const assignment = buildAssignment({
    workId: 'tsk-plan-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const plan = compileDispatchPlan(cfg, {
    assignment: assignment.assignmentId,
    assignmentItem: assignment,
  });

  assert.equal(plan.selector.type, 'assignment');
  assert.equal(plan.selector.value, assignment.assignmentId);
  assert.equal(plan.mechanism, 'out-of-process');
  assert.equal(plan.executorId, 'claude');
});

test('decideExecutorCli resolves dispatch plan for an assignment', async () => {
  const tempDir = mkTempDir();
  const assignment = buildAssignment({
    workId: 'tsk-decide-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  // Write assignment.json under .fgos/assignments/<id>/
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));

  const decided = await decideExecutorCli(undefined, {
    cwd: tempDir,
    repoRoot: tempDir,
    assignment: assignment.assignmentId,
  });

  assert.equal(decided.mechanism, 'out-of-process');
  assert.equal(decided.executorId, 'claude');
});

test('dispatch CLI execute subcommand with --assignment executes assignment and outputs RunResult JSON', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-exec-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));

  const fgosConfigPath = path.join(tempDir, '.fgos', 'config.json');
  fs.writeFileSync(fgosConfigPath, JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--assignment', assignment.assignmentId, '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );

  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.assignmentId, assignment.assignmentId);
  assert.equal(parsed.status, 'done');
  assert.equal(parsed.confidence, 'reported');
});

test('dispatch CLI execute subcommand with --assignment and --executor dispatches through the named executor', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    executors: {
      named_executor: {
        kind: 'agent',
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-exec-flag-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--assignment', assignment.assignmentId, '--executor', 'named_executor', '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );

  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.status, 'done');

  const storedPlan = JSON.parse(
    fs.readFileSync(path.join(asgnDir, 'runs', '01', 'dispatch-plan.json'), 'utf8'),
  );
  assert.equal(storedPlan.executorId, 'named_executor');
});

test('dispatch CLI execute subcommand with --assignment and an unregistered --executor rejects before spawn with a non-zero exit', () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    executors: {
      named_executor: {
        kind: 'agent',
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-exec-flag-bad-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--assignment', assignment.assignmentId, '--executor', 'no_such_executor', '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /preferExecutor "no_such_executor" is not a registered executor/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --assignment and a duplicate --executor flag rejects before spawn with a non-zero exit', () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    executors: {
      named_executor: {
        kind: 'agent',
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-exec-flag-dup-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [
          dispatchScript, 'execute', '--assignment', assignment.assignmentId,
          '--executor', 'named_executor', '--executor', 'named_executor', '--cwd', tempDir,
        ],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /duplicate flag "--executor" -- pass it at most once before launch/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --assignment and a trailing bare duplicate --executor flag (no value after it) still rejects as a duplicate', () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    executors: {
      named_executor: {
        kind: 'agent',
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-exec-flag-dup-trailing-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [
          // --cwd placed before the flags under test so the duplicate
          // --executor genuinely lands as the very last token in `rest`,
          // not shielded by a trailing --cwd.
          dispatchScript, 'execute', '--assignment', assignment.assignmentId, '--cwd', tempDir,
          '--executor', 'named_executor', '--executor',
        ],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /duplicate flag "--executor" -- pass it at most once before launch/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --assignment does not false-positive a duplicate --executor when a flag name string only appears as a preceding flag\'s dangling value slot', () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    executors: {
      named_executor: {
        kind: 'agent',
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-exec-flag-no-false-dup-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  // `--tier` here has no value of its own -- `--executor` immediately
  // follows it, so `--executor`'s literal string is consumed as `--tier`'s
  // dangling value slot. There is genuinely only one real `--executor`
  // occurrence (the one paired with `named_executor`), so this must never
  // be rejected with the "duplicate flag" message, whatever else happens.
  let stderr = '';
  try {
    execFileSync(
      process.execPath,
      [
        dispatchScript, 'execute', '--assignment', assignment.assignmentId, '--cwd', tempDir,
        '--tier', '--executor', 'named_executor',
      ],
      { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (err) {
    stderr = String(err.stderr);
  }
  assert.doesNotMatch(stderr, /duplicate flag/);
});

// The `missionId`-bearing declared-assignment scenario this test used to
// cover (a declared, Work-attached Assignment tagged with a `missionId`
// that the CLI's `isMissionLite` flag inspected) is retired along with
// `missionId` itself (Step 08 Phase 01 R4, ADR-008 Decision 5) --
// `buildAssignment()` never stamps that field onto any Assignment shape
// any more, so the scenario is now structurally unreachable through any
// real construction path. Its coverage intent (a mutating Assignment
// refused under read-only-mode enforcement) lives on in the inline-shape
// test immediately below, which is the shape a standalone
// CoordinationSession actually uses.

test('dispatch CLI execute subcommand refuses a mutating inline Assignment (mission-refusal / read-only-mode gate for cli.mjs execute)', () => {
  const tempDir = mkTempDir();

  openSession(
    {
      coordinationId: 'coord_cli_inline_refuse_test',
      objective: 'Evaluate reviewer assignment for planning validation.',
      provenanceRoot: { writerId: 'test-writer-cli-inline-refuse' },
    },
    { cwd: tempDir },
  );

  const assignment = createSessionAssignment(
    {
      coordinationId: 'coord_cli_inline_refuse_test',
      taskKey: 'researcher-round-1',
      contract: {
        objective: 'Gather facts and existing code paths for planning validation.',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json (status, summary)'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'researcher',
        budget: { timeoutMs: 60000, maxRuns: 1 },
      },
      caller: { writerId: 'test-writer-cli-inline-refuse' },
    },
    { cwd: tempDir },
  );
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.stage, undefined);
  assert.equal(assignment.operation, undefined);
  assert.equal(assignment.missionId, undefined);

  // Tamper the canonical assignment.json on disk (the only copy
  // createSessionAssignment ever writes) to mutation: 'mutating' -- the
  // real inline shape it produces (no stage/operation/missionId field,
  // provenance.kind: 'inline'), so `asgnObj.provenance?.kind === 'inline'`
  // alone is what signals "apply the mission-refusal / read-only-mode
  // gate" for this shape.
  const asgnPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
  const tampered = { ...JSON.parse(fs.readFileSync(asgnPath, 'utf8')), mutation: 'mutating' };
  fs.writeFileSync(asgnPath, `${JSON.stringify(tampered, null, 2)}\n`);
  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [writeEchoExecutor(tempDir), '{prompt}'],
    },
    models: { standard: 'test-model' },
  };
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--assignment', assignment.assignmentId, '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /mission-lite mode.*strictly read-only/i);
      return true;
    },
  );
});

test('compileDispatchPlan and executeAssignment respect cliOverride.preferExecutor without dispatch plan mismatch (Finding P2 fix)', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    executors: {
      custom_executor: {
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-cli-override-asgn',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const plan = compileDispatchPlan(runnerConfig, {
    assignment: assignment.assignmentId,
    assignmentItem: assignment,
    cliOverride: { preferExecutor: 'custom_executor' },
  });

  assert.equal(plan.executorId, 'custom_executor');

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    cliOverride: { preferExecutor: 'custom_executor' },
  });

  assert.equal(result.status, 'done');
  assert.equal(result.confidence, 'reported');

  const storedPlan = JSON.parse(
    fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01', 'dispatch-plan.json'), 'utf8'),
  );
  assert.equal(storedPlan.executorId, 'custom_executor');
});

test('settleClaim atomically applies patch before releasing runtime claim (Finding P2 fix)', () => {
  const dir = path.join(mkTempDir(), '.fgos');
  initStore(dir);
  addWork(dir, { id: 'tsk-settle-patch', title: 'Test Settle Patch', domain: 'coding', kind: 'feature', status: 'todo', stage: 'executing', risk: 'standard', priority: 0, verify: 'true', deps: [], refs: [] });

  const claim = acquireClaim(dir, { id: 'tsk-settle-patch', actor: 'runner' });
  assert.ok(claim.claimId);

  settleClaim(dir, {
    id: 'tsk-settle-patch',
    claimId: claim.claimId,
    finalStatus: 'todo',
    reason: 'testing-patch-settle',
    role: 'runner',
    patch: { nextOperation: 'fix-verify-red', secondaryOperation: null },
  });

  const updated = listWork(dir).work['tsk-settle-patch'];
  assert.equal(updated.nextOperation, 'fix-verify-red');
  assert.equal(updated.secondaryOperation ?? null, null);
  assert.equal(readClaim(dir, 'tsk-settle-patch'), null);
});

test('settleClaim({ patch }) runs full editWork validation suite (Finding P2 fix)', () => {
  const dir = path.join(mkTempDir(), '.fgos');
  initStore(dir);
  addWork(dir, { id: 'tsk-a', title: 'Task A', domain: 'coding', kind: 'feature', status: 'doing', stage: 'executing', risk: 'standard', priority: 0, verify: 'true', deps: [], refs: [] });

  const claim = acquireClaim(dir, { id: 'tsk-a', actor: 'runner' });
  assert.ok(claim.claimId);

  // Rejects un-editable fields
  assert.throws(
    () => settleClaim(dir, { id: 'tsk-a', claimId: claim.claimId, finalStatus: 'todo', patch: { stage: 'planning' } }),
    /edit cannot change "stage"/,
  );

  // Rejects changing kind when status is not todo
  assert.throws(
    () => settleClaim(dir, { id: 'tsk-a', claimId: claim.claimId, finalStatus: 'todo', patch: { kind: 'bug' } }),
    /edit cannot change "kind" on work "tsk-a"/,
  );
});

test('Finding 3 regression test: read-only assignment committing a new file leaves checkout clean after failing closed', async () => {
  const tempDir = mkTempDir();
  execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.name "Test" && git config user.email "test@test.local"', { cwd: tempDir, stdio: 'ignore' });
  initStore(tempDir);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-commit-readonly');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nPlan.\n');
  execSync(`git add ${docsDir} && git commit -m "add plan"`, { cwd: tempDir, stdio: 'ignore' });

  addWork(tempDir, {
    id: 'tsk-commit-readonly',
    title: 'Test read-only commit rollback',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-commit-readonly',
  });

  const assignment = buildAssignment({
    work: listWork(tempDir).work['tsk-commit-readonly'],
    stage: 'planning',
    operation: 'validate-plan',
  });

  const newFilePath = path.join(tempDir, 'new-from-readonly.txt');
  const executorScript = path.join(tempDir, 'mutating-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    import { execSync } from 'node:child_process';
    fs.writeFileSync('${newFilePath}', 'committed new file');
    try {
      const out = execSync('git config user.email "test@example.com" && git config user.name "Test" && git add new-from-readonly.txt && git commit -m "added file from readonly"', { cwd: '${tempDir}' });
      fs.writeFileSync(path.join('${tempDir}', 'exec-out.log'), out.toString());
    } catch (err) {
      fs.writeFileSync(path.join('${tempDir}', 'exec-error.log'), (err.stderr ? err.stderr.toString() : '') + (err.stack || String(err)));
    }

    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    let runDir;
    if (match) {
      runDir = path.dirname(match[1]);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    process.exit(0);
    `,
  );

  const cfg = {
    executor: {
      kind: 'cli',
      command: process.execPath,
      args: [executorScript, '{prompt}'],
      allowCrossProvider: true,
    },
    models: { standard: 'test-model' },
  };

  const runResult = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: cfg,
  });

  assert.equal(runResult.status, 'failed');
  assert.equal(runResult.confidence, 'failed');
  assert.ok(runResult.evidence.changedFiles.some((f) => f.includes('new-from-readonly.txt')), 'changedFiles must record the mutated file');
  assert.equal(fs.existsSync(newFilePath), true, 'read-only execution must fail closed without automatic destructive file rollback');
});

test('Cell 6.3 Fix Round 1: a role:reviewer assignment resolves the scoped claude-reviewer executor, never the git-write worker profile', async () => {
  const tempDir = mkTempDir();
  const worker = writeArgvRecordingExecutor(tempDir, 'worker');
  const reviewer = writeArgvRecordingExecutor(tempDir, 'reviewer');

  const runnerConfig = {
    executors: {
      claude: {
        command: process.execPath,
        args: [worker.scriptPath, '{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
        allowCrossProvider: true,
      },
      'claude-reviewer': {
        command: process.execPath,
        args: [reviewer.scriptPath, '{prompt}'],
        allowCrossProvider: true,
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-cell63-reviewer-scope', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
    role: 'reviewer',
  });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'claude-reviewer');
  assert.equal(fs.existsSync(worker.argvCapturePath), false, 'a reviewer-role assignment must never spawn the worker executor profile');

  const reviewerArgs = JSON.parse(fs.readFileSync(reviewer.argvCapturePath, 'utf8'));
  assert.ok(
    !reviewerArgs.some((arg) => arg.includes('Bash(git commit')),
    'reviewer-resolved executor args must never include Bash(git commit',
  );

  // Cell 6.7 Bug B: the persisted record must not be self-contradictory --
  // `policy.executorPreference[0]` stays the DECLARED preference ("claude"),
  // `executorId` is the ACTUALLY-resolved executor ("claude-reviewer"), and
  // `executorRedirected` makes that intentional divergence explicit instead
  // of leaving an auditor to infer it from two disagreeing fields.
  assert.equal(result.policy.executorPreference[0], 'claude');
  assert.equal(result.executorId, 'claude-reviewer');
  assert.equal(result.executorRedirected, true);
});

test('read-only claude redirect can leave the Claude provider and recomputes the model for the target executor', async () => {
  const tempDir = mkTempDir();
  const worker = writeArgvRecordingExecutor(tempDir, 'worker');
  const reviewer = writeArgvRecordingExecutor(tempDir, 'reviewer');
  const codex = writeArgvRecordingExecutor(tempDir, 'codex');

  const runnerConfig = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          default: ['claude-reviewer'],
          operations: {
            'shape-plan': ['codex-bwrap'],
          },
        },
      },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [worker.scriptPath, '{prompt}', '--model', '{model}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
        allowCrossProvider: true,
      },
      'claude-reviewer': {
        command: process.execPath,
        args: [reviewer.scriptPath, '{prompt}', '--model', '{model}'],
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: {
        nano: 'haiku',
        standard: 'sonnet',
        advanced: 'sonnet',
        flagship: 'opus',
        frontier: 'opus',
      },
      'openai-codex': {
        nano: 'gpt-test-low',
        standard: 'gpt-test-standard',
        advanced: 'gpt-test-standard',
        flagship: 'gpt-test-analytical',
        frontier: 'gpt-test-critical',
      },
    },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-readonly-cross-provider-redirect', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'shape-plan',
  });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'codex-bwrap');
  assert.equal(result.executorRedirected, true);
  assert.equal(result.policy.executorPreference[0], 'claude');
  assert.equal(result.policy.providerModel, 'openai-codex');
  assert.equal(result.policy.model, 'gpt-test-standard');
  assert.equal(fs.existsSync(worker.argvCapturePath), false, 'read-only operation must not spawn the git-write claude profile');
  assert.equal(fs.existsSync(reviewer.argvCapturePath), false, 'operation override must not fall through to claude-reviewer');

  const codexArgs = JSON.parse(fs.readFileSync(codex.argvCapturePath, 'utf8'));
  assert.ok(codexArgs.includes('gpt-test-standard'), 'spawned argv must receive the target provider model, not Claude sonnet');
  assert.ok(!codexArgs.includes('opus'), 'Claude model literals must not leak into a cross-provider redirect');
  assert.ok(!codexArgs.includes('sonnet'), 'Claude model literals must not leak into a cross-provider redirect');
});

// Pre-Phase-05 gate H5 (plans/260915-executor-policy-dispatch-seams/plan.md):
// The read-only redirect target must never bypass disallowedProviders/
// disallowedExecutors governance for the executor it retargets to.
test('H5: a readOnlyRedirect target cannot bypass disallowedProviders governance', async () => {
  const tempDir = mkTempDir();
  const worker = writeArgvRecordingExecutor(tempDir, 'h5-worker');
  const codex = writeArgvRecordingExecutor(tempDir, 'h5-codex');

  const runnerConfig = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: { operations: { 'shape-plan': ['codex-bwrap'] } },
      },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [worker.scriptPath, '{prompt}', '--model', '{model}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      'openai-codex': { standard: 'gpt-test-standard' },
    },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-h5-redirect-governance', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  // Project governance disallows openai-codex outright -- the redirect
  // target is exactly that provider. Before the H5 fix, this call silently
  // dispatched through codex-bwrap anyway: the disallowedProviders check
  // only ever ran against the DECLARED "claude" executor, never against
  // what the redirect actually resolved to.
  await assert.rejects(
    executeAssignment(assignment, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['openai-codex'] },
    }),
    (err) => /governance gate rejected provider "openai-codex"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(codex.argvCapturePath), false, 'the disallowed redirect target must never actually spawn');

  // Same shape, disallowedExecutors naming the redirect target by id instead
  // of by provider family.
  const assignment2 = buildAssignment({ work: { ...work, id: 'tsk-h5-redirect-governance-2' }, stage: 'planning', operation: 'shape-plan' });
  await assert.rejects(
    executeAssignment(assignment2, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedExecutors: ['codex-bwrap'] },
    }),
    (err) => /governance gate rejected executor "codex-bwrap"/.test(err.message),
  );

  // Control: the SAME governance options do not spuriously refuse an
  // UNREDIRECTED dispatch (a mutating operation, never routed through
  // readOnlyRedirect at all) -- this fix must be a no-op when nothing was
  // actually redirected.
  const mutatingAssignment = buildAssignment({
    work: { ...work, id: 'tsk-h5-control' },
    stage: 'executing',
    operation: 'implement-item',
  });
  const controlResult = await executeAssignment(mutatingAssignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    options: { disallowedProviders: ['openai-codex'] },
  });
  assert.equal(controlResult.executorId, 'claude');
  assert.equal(controlResult.executorRedirected, false);
});

test('provider capacity selection happens after Run admission, records redacted run-owned evidence, and releases lease at settle', async () => {
  const tempDir = mkTempDir();
  const runtimeDir = mkTempDir();
  const codex = writeArgvRecordingExecutor(tempDir, 'codex-capacity');

  const runnerConfig = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: { operations: { 'shape-plan': ['codex-bwrap'] } },
      },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}'],
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        kind: 'agent',
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      'openai-codex': { standard: 'gpt-test-standard' },
    },
    timeoutMs: 5000,
    providers: {
      'openai-codex': {
        accounts: {
          tetcu72: {
            label: 'codex/tetcu72',
            credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'codex-tetcu72') },
          },
        },
      },
    },
  };

  const work = { id: 'tsk-provider-capacity-run', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
  });

  assert.equal(result.executorId, 'codex-bwrap');
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const dispatchPlan = JSON.parse(fs.readFileSync(path.join(runDir, 'dispatch-plan.json'), 'utf8'));
  assert.equal(dispatchPlan.providerCapacity, undefined, 'dispatch-plan must not preselect an account before admission');

  const selection = JSON.parse(fs.readFileSync(path.join(runDir, 'provider-capacity-selection.json'), 'utf8'));
  assert.equal(selection.provider, 'openai-codex');
  assert.equal(selection.accountId, 'tetcu72');
  assert.equal(selection.lease.runId, `run_${assignment.assignmentId}_01`);
  assert.equal(selection.credentialSource, undefined);

  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runMeta.providerCapacitySelectionPath, path.relative(tempDir, path.join(runDir, 'provider-capacity-selection.json')));

  const effectiveContract = JSON.parse(fs.readFileSync(path.join(runDir, 'effective-execution-contract.json'), 'utf8'));
  assert.equal(effectiveContract.providerCapacity.provider, 'openai-codex');
  assert.equal(effectiveContract.providerCapacity.accountId, 'tetcu72');
  assert.equal(effectiveContract.providerCapacity.credentialSource, undefined);

  const inspected = inspectProviderCapacity({ runnerConfig, runtimeDir });
  assert.deepEqual(inspected.providers['openai-codex'].accounts.tetcu72.openLeases, []);
});

// Pre-Phase-05 gate H2 (plans/260915-executor-policy-dispatch-seams/plan.md):
// provider-capacity refusal after Run admission must settle the attempt as
// provider-capacity-refused, never leave an admitted Run permanently
// "running"/unsettled via an unclassified throw.
test('provider capacity refusal after Run admission settles the attempt (never an orphaned running Run / unclassified throw)', async () => {
  const tempDir = mkTempDir();
  const runtimeDir = mkTempDir();
  const codex = writeArgvRecordingExecutor(tempDir, 'codex-capacity-refused');

  const runnerConfig = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: { operations: { 'shape-plan': ['codex-bwrap'] } },
      },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}'],
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        kind: 'agent',
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      'openai-codex': { standard: 'gpt-test-standard' },
    },
    timeoutMs: 5000,
    providers: {
      'openai-codex': {
        accounts: {
          tetcu72: {
            label: 'codex/tetcu72',
            credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'codex-tetcu72') },
          },
        },
      },
    },
  };

  // Pre-seed the ONE declared account as already quarantined (manual-clear,
  // no expiry) so real selection logic genuinely refuses -- not a stubbed
  // refusal, the actual rankProviderAccounts/acquireProviderAccountLease
  // path this test exercises end to end.
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: PROVIDER_CAPACITY_STATE_CONTRACT,
    providers: {
      'openai-codex': {
        accounts: {
          tetcu72: { quarantine: { kind: 'manual-clear', reasonCode: 'auth-token', quarantinedAt: new Date().toISOString() } },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const work = { id: 'tsk-provider-capacity-refused', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
  });

  // Settled, not thrown: the caller gets a real result back.
  assert.equal(result.status, 'failed');
  assert.equal(result.classification.execution.status, 'failed');
  assert.equal(result.classification.failure.family, 'provider');
  assert.equal(result.classification.failure.code, 'provider-capacity-refused');
  assert.match(result.classification.failure.message, /provider capacity refused/);
  // "needs-input" -- not a terminal contract violation -- matches the
  // bounded settle-and-reattempt spirit: a caller may retry with
  // predecessorRunId using the existing admission retry channel.
  assert.equal(result.classification.policy.disposition, 'needs-input');

  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  assert.ok(fs.existsSync(path.join(runDir, 'result.json')), 'result.json must exist -- the Run must not be left admitted-but-unsettled');
  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  // markRunSettled's own vocabulary: "settled" means the Run reached its end
  // and produced a RunResult -- the verdict itself lives in result.json's
  // classification, asserted above. The property this test exists to prove
  // is simply that run.json is no longer "running".
  assert.equal(runMeta.status, 'settled');
  assert.notEqual(runMeta.status, 'running', 'run.json must never be left "running" after a provider-capacity refusal');
  assert.equal(fs.existsSync(codex.argvCapturePath), false, 'a refused account must never let the worker actually spawn');
});

// Phase B (plans/260917-executor-profile-schema-migration/plan.md): real
// cross-provider PlacementPolicy fallback in production dispatch, wired
// via dispatch/recovery.mjs's `resolveFallback` into the exact
// provider-capacity-refused branch the H2 test above proves settles
// cleanly. Each test below shares that same two-provider fixture shape
// (`claude` primary / `codex-bwrap` fallback, each its own provider),
// varying only which accounts are pre-quarantined and which
// `fallbackExecutors` are declared.
function buildFallbackFixture(tempDir, { primaryQuarantined, fallbackQuarantined, secondFallbackQuarantined = null } = {}) {
  const claudeExecutor = writeArgvRecordingExecutor(tempDir, 'claude-fallback-primary');
  const codexExecutor = writeArgvRecordingExecutor(tempDir, 'codex-fallback-candidate');
  const runnerConfig = {
    executors: {
      claude: { command: process.execPath, args: [claudeExecutor.scriptPath, '{prompt}'], allowCrossProvider: true },
      'codex-bwrap': {
        command: process.execPath,
        args: [codexExecutor.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        kind: 'agent',
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      'openai-codex': { standard: 'gpt-test-standard' },
    },
    timeoutMs: 5000,
    providers: {
      claude: {
        accounts: {
          'claude-acct': { label: 'claude/primary', credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'claude-home') } },
        },
      },
      'openai-codex': {
        accounts: {
          'codex-acct': { label: 'codex/fallback', credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'codex-home') } },
        },
      },
    },
  };
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const accounts = {};
  if (primaryQuarantined) accounts.claude = { accounts: { 'claude-acct': { quarantine: { kind: 'manual-clear', reasonCode: 'auth-token', quarantinedAt: new Date().toISOString() } } } };
  if (fallbackQuarantined) accounts['openai-codex'] = { accounts: { 'codex-acct': { quarantine: { kind: 'manual-clear', reasonCode: 'auth-token', quarantinedAt: new Date().toISOString() } } } };
  fs.writeFileSync(statePath, JSON.stringify({
    contract: PROVIDER_CAPACITY_STATE_CONTRACT,
    providers: accounts,
    assignments: {},
    audit: [],
  }));
  return { claudeExecutor, codexExecutor, runnerConfig, runtimeDir };
}

test('Phase B: no fallbackExecutors declared -> byte-identical terminal provider-capacity-refused settlement (regression guard)', async () => {
  const tempDir = mkTempDir();
  const { runnerConfig, runtimeDir } = buildFallbackFixture(tempDir, { primaryQuarantined: true, fallbackQuarantined: false });

  const work = { id: 'tsk-fallback-none-declared', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    // No cliOverride.fallbackExecutors at all.
  });

  assert.equal(result.classification.failure.code, 'provider-capacity-refused');
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runMeta.executorId, 'claude', 'executorId must stay the primary -- no fallback was ever declared');
  assert.equal(runMeta.fallback, undefined, 'run.json must carry no fallback field at all when nothing was declared');
  const evidence = JSON.parse(fs.readFileSync(path.join(runDir, 'evidence.json'), 'utf8'));
  assert.equal(evidence.fallback, undefined, 'evidence.json must carry no fallback field at all when nothing was declared');
});

test('Phase B: a declared fallback with real capacity is actually dispatched, evidenced, and the primary account is untouched', async () => {
  const tempDir = mkTempDir();
  const { claudeExecutor, codexExecutor, runnerConfig, runtimeDir } = buildFallbackFixture(tempDir, { primaryQuarantined: true, fallbackQuarantined: false });

  const work = { id: 'tsk-fallback-selected', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    cliOverride: { fallbackExecutors: ['codex-bwrap'] },
  });

  // Dispatch proceeded -- this is NOT a provider-capacity-refused terminal
  // settlement, the worker actually ran against the fallback.
  assert.notEqual(result.classification?.failure?.code, 'provider-capacity-refused');
  assert.equal(fs.existsSync(codexExecutor.argvCapturePath), true, 'the fallback worker must actually have spawned');
  assert.equal(fs.existsSync(claudeExecutor.argvCapturePath), false, 'the refused primary must never spawn');

  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runMeta.executorId, 'codex-bwrap');
  assert.equal(runMeta.fallback.declaredPrimary, 'claude');
  assert.equal(runMeta.fallback.resolved, 'codex-bwrap');
  assert.equal(runMeta.fallback.reasonCode, 'provider-capacity-refused');

  const dispatchPlan = JSON.parse(fs.readFileSync(path.join(runDir, 'dispatch-plan.json'), 'utf8'));
  assert.equal(dispatchPlan.executorId, 'codex-bwrap');
  assert.equal(dispatchPlan.provenance?.executor?.source?.scope, 'fallback', 'the scoped plan must honestly record it was resolved via the fallback path, not cliOverride');

  const computedDigest = `sha256:${crypto.createHash('sha256').update(fs.readFileSync(path.join(runDir, 'dispatch-plan.json'), 'utf8').trimEnd()).digest('hex')}`;
  // run.json's dispatchPlanDigest must agree with the SAME formula the
  // runner itself used (JSON.stringify of the in-memory plan object, not a
  // digest of the file bytes -- re-derive via the object to avoid a
  // whitespace-sensitive false failure).
  const rederivedDigest = `sha256:${crypto.createHash('sha256').update(JSON.stringify(dispatchPlan)).digest('hex')}`;
  assert.equal(runMeta.dispatchPlanDigest, rederivedDigest, 'run.json.dispatchPlanDigest must match the persisted dispatch-plan.json -- confinement prep cross-checks this and throws on any mismatch');

  const capacity = inspectProviderCapacity({ runnerConfig, runtimeDir });
  assert.deepEqual(capacity.providers.claude.accounts['claude-acct'].openLeases, [], 'the refused primary account must never receive a lease');
  assert.deepEqual(capacity.providers['openai-codex'].accounts['codex-acct'].openLeases, [], 'the fallback lease must be released after settlement (finally-block release keyed by the CURRENT providerCapacitySelection)');
});

test('Phase B: every declared candidate governance-refused or unresolvable -> falls through to terminal settlement, never a bare throw', async () => {
  const tempDir = mkTempDir();
  const { runnerConfig, runtimeDir } = buildFallbackFixture(tempDir, { primaryQuarantined: true, fallbackQuarantined: false });

  const work = { id: 'tsk-fallback-all-refused', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    cliOverride: { fallbackExecutors: ['codex-bwrap'] },
    options: { disallowedExecutors: ['codex-bwrap'] },
  });

  assert.equal(result.classification.failure.code, 'provider-capacity-refused', 'must still settle as terminal, never throw');
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runMeta.executorId, 'claude', 'executorId stays the primary -- the fallback was never adopted');
  const evidence = JSON.parse(fs.readFileSync(path.join(runDir, 'evidence.json'), 'utf8'));
  assert.equal(evidence.fallback.declaredPrimary, 'claude');
  assert.equal(evidence.fallback.skippedCandidates.length, 1);
  assert.equal(evidence.fallback.skippedCandidates[0].executorId, 'codex-bwrap');
  // 'compiler-mismatch', not 'candidate-not-governed': the candidate IS a
  // declared executorPreference entry (resolveFallback's own
  // "never-declared" bucket), it is the disallowedExecutors governance
  // check INSIDE the real compileDispatchPlan() recompilation that refuses
  // it -- proving the exact same governance re-admission this phase's own
  // design argument (recovery.mjs's resolveFallback is a strict superset
  // of placement-policy.mjs's disallowed-provider/executor checks) relies on.
  assert.equal(evidence.fallback.skippedCandidates[0].reasonCode, 'compiler-mismatch');
});

test('Phase B: bounded to exactly one capacity attempt -- a second declared candidate with real capacity is never tried', async () => {
  const tempDir = mkTempDir();
  const { runnerConfig, runtimeDir } = buildFallbackFixture(tempDir, { primaryQuarantined: true, fallbackQuarantined: true });
  const thirdExecutor = writeArgvRecordingExecutor(tempDir, 'third-fallback-candidate');
  runnerConfig.executors['pi-fallback'] = {
    command: process.execPath,
    args: [thirdExecutor.scriptPath, '{prompt}', '--model', '{model}'],
    providerModel: 'test-provider-c',
    kind: 'agent',
    allowCrossProvider: true,
  };
  runnerConfig.modelPolicies['test-provider-c'] = { standard: 'model-c-standard' };
  runnerConfig.providers['test-provider-c'] = {
    accounts: { 'pi-acct': { label: 'pi/third', credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'pi-home') } } },
  };

  const work = { id: 'tsk-fallback-bounded', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    // Both declared fallback candidates are governed and compile clean;
    // the FIRST (codex-bwrap) has its account quarantined too, the SECOND
    // (pi-fallback) has real capacity -- but only the first is ever
    // attempted; the second must never be leased.
    cliOverride: { fallbackExecutors: ['codex-bwrap', 'pi-fallback'] },
  });

  assert.equal(result.classification.failure.code, 'provider-capacity-refused');
  assert.equal(fs.existsSync(thirdExecutor.argvCapturePath), false, 'the never-attempted second fallback candidate must never spawn');
  const capacity = inspectProviderCapacity({ runnerConfig, runtimeDir });
  assert.deepEqual(capacity.providers['test-provider-c'].accounts['pi-acct'].openLeases, [], 'the never-attempted candidate must never receive a lease');

  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const evidence = JSON.parse(fs.readFileSync(path.join(runDir, 'evidence.json'), 'utf8'));
  assert.equal(evidence.fallback.attempted, 'codex-bwrap', 'exactly the first candidate must be the one whose capacity was attempted');
  assert.equal(evidence.fallback.skippedCandidates.length, 0, 'the second candidate is never reached at all -- it is bounded-out, not skipped-for-cause');
});

// --- executor-id-consolidation Step 2: fallback confinement preservation --
// a provider-capacity fallback substitution must never silently trade a
// confined primary for an unconfined substitute.

function buildConfinementFallbackFixture(tempDir, { fallbackHasConfinedInvocation }) {
  const claudeExecutor = writeArgvRecordingExecutor(tempDir, 'claude-confined-primary');
  const codexUnconfinedExecutor = writeArgvRecordingExecutor(tempDir, 'codex-fallback-unconfined');
  const codexConfinedExecutor = writeArgvRecordingExecutor(tempDir, 'codex-fallback-confined');
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        allowCrossProvider: true,
        invocations: [
          { id: 'cli-bwrap', via: 'cli', command: process.execPath, args: [claudeExecutor.scriptPath, '{prompt}'], confinement: { backend: 'bwrap' } },
        ],
      },
      'codex-bwrap': {
        kind: 'agent',
        providerModel: 'openai-codex',
        allowCrossProvider: true,
        invocations: fallbackHasConfinedInvocation
          ? [
              { id: 'cli', via: 'cli', command: process.execPath, args: [codexUnconfinedExecutor.scriptPath, '{prompt}', '--model', '{model}'] },
              { id: 'cli-bwrap', via: 'cli', command: process.execPath, args: [codexConfinedExecutor.scriptPath, '{prompt}', '--model', '{model}'], confinement: { backend: 'bwrap' } },
            ]
          : [
              { id: 'cli', via: 'cli', command: process.execPath, args: [codexUnconfinedExecutor.scriptPath, '{prompt}', '--model', '{model}'] },
            ],
      },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      'openai-codex': { standard: 'gpt-test-standard' },
    },
    timeoutMs: 5000,
    providers: {
      claude: {
        accounts: {
          'claude-acct': { label: 'claude/primary', credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'claude-home') } },
        },
      },
      'openai-codex': {
        accounts: {
          'codex-acct': { label: 'codex/fallback', credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'codex-home') } },
        },
      },
    },
  };
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: PROVIDER_CAPACITY_STATE_CONTRACT,
    providers: {
      claude: { accounts: { 'claude-acct': { quarantine: { kind: 'manual-clear', reasonCode: 'auth-token', quarantinedAt: new Date().toISOString() } } } },
    },
    assignments: {},
    audit: [],
  }));
  return { claudeExecutor, codexUnconfinedExecutor, codexConfinedExecutor, runnerConfig, runtimeDir };
}

test('Step 2: a fallback candidate with NO confined invocation at all is refused, never silently dispatched unconfined, when the primary was confined', async () => {
  const tempDir = mkTempDir();
  const { claudeExecutor, codexUnconfinedExecutor, runnerConfig, runtimeDir } = buildConfinementFallbackFixture(tempDir, { fallbackHasConfinedInvocation: false });

  const work = { id: 'tsk-confinement-fallback-refused', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  await assert.rejects(
    () => executeAssignment(assignment, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      providerCapacityRuntimeDir: runtimeDir,
      cliOverride: { fallbackExecutors: ['codex-bwrap'] },
    }),
    (err) => {
      assert.match(err.message, /fallback executor "codex-bwrap" has no confined invocation available/);
      assert.match(err.message, /primary "claude"/);
      return true;
    },
  );
  assert.equal(fs.existsSync(codexUnconfinedExecutor.argvCapturePath), false, 'the unconfined fallback invocation must never spawn');
  assert.equal(fs.existsSync(claudeExecutor.argvCapturePath), false, 'the quarantined primary must never spawn either');
});

test('Step 2: a fallback candidate WITH a confined invocation is dispatched through that confined invocation specifically, not its unconfined default', async () => {
  const tempDir = mkTempDir();
  const { claudeExecutor, codexUnconfinedExecutor, codexConfinedExecutor, runnerConfig, runtimeDir } = buildConfinementFallbackFixture(tempDir, { fallbackHasConfinedInvocation: true });

  const work = { id: 'tsk-confinement-fallback-selected', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    cliOverride: { fallbackExecutors: ['codex-bwrap'] },
  });

  assert.notEqual(result.classification?.failure?.code, 'provider-capacity-refused');
  assert.equal(fs.existsSync(codexConfinedExecutor.argvCapturePath), true, 'the CONFINED invocation must be the one that actually spawned');
  assert.equal(fs.existsSync(codexUnconfinedExecutor.argvCapturePath), false, 'the unconfined default invocation on the same executor must never spawn once confinement is required');
  assert.equal(fs.existsSync(claudeExecutor.argvCapturePath), false, 'the quarantined primary must never spawn');
});

test('Phase B: a resumed Run that already committed a fallback rehydrates the fallback, never recompiles the refused primary', async () => {
  const tempDir = mkTempDir();
  const { claudeExecutor, codexExecutor, runnerConfig, runtimeDir } = buildFallbackFixture(tempDir, { primaryQuarantined: true, fallbackQuarantined: false });

  const work = { id: 'tsk-fallback-resume', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const first = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    cliOverride: { fallbackExecutors: ['codex-bwrap'] },
  });
  assert.equal(first.executorId, 'codex-bwrap');

  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  // Simulate a crash-then-resume: same runId/attempt, result.json/commands
  // wiped as if the worker never got to settle, run.json (with its
  // committed `fallback` field) and dispatch-plan.json survive untouched.
  fs.rmSync(path.join(runDir, 'result.json'), { force: true });
  fs.rmSync(path.join(runDir, 'controller'), { recursive: true, force: true });
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), '');
  fs.rmSync(path.join(runDir, 'agent-result.json'), { force: true });

  const resumed = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
    cliOverride: { fallbackExecutors: ['codex-bwrap'] },
  });

  assert.equal(resumed.executorId, 'codex-bwrap', 'resume must rehydrate the fallback, never recompile/re-dispatch the refused primary');
  const runMeta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runMeta.executorId, 'codex-bwrap');
});

test('tool executors bypass provider capacity selection even with matching provider accounts configured', async () => {
  const tempDir = mkTempDir();
  const runtimeDir = mkTempDir();
  const codex = writeArgvRecordingExecutor(tempDir, 'codex-tool-capacity-bypass');

  const runnerConfig = {
    executor: {
      command: process.execPath,
      args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
      providerModel: 'openai-codex',
      kind: 'tool',
      allowCrossProvider: true,
    },
    modelPolicies: {
      'openai-codex': { standard: 'gpt-test-standard' },
    },
    timeoutMs: 5000,
    providers: {
      'openai-codex': {
        accounts: {
          tetcu72: {
            label: 'codex/tetcu72',
            credentialSource: { kind: 'codex-home', home: path.join(tempDir, 'codex-tetcu72') },
          },
        },
      },
    },
  };

  const work = { id: 'tsk-provider-capacity-tool-bypass', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });
  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    providerCapacityRuntimeDir: runtimeDir,
  });

  assert.equal(result.status, 'done');
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  assert.equal(fs.existsSync(path.join(runDir, 'provider-capacity-selection.json')), false);
  const effectiveContract = JSON.parse(fs.readFileSync(path.join(runDir, 'effective-execution-contract.json'), 'utf8'));
  assert.equal(effectiveContract.providerCapacity, undefined);
  const inspected = inspectProviderCapacity({ runnerConfig, runtimeDir });
  assert.deepEqual(inspected.providers['openai-codex'].accounts.tetcu72.openLeases, []);
});

test('a genuinely mutating assignment (implement-item, default implementer role) is unaffected -- still resolves the git-write claude profile', async () => {
  // Fix Round 1's original version of this test used operation:
  // 'validate-plan' with an explicit role:'implementer' override. That op is
  // intrinsically read-only via READ_ONLY_OPS regardless of role, so the
  // test only proved the gate was role-scoped, not that a real mutating
  // assignment stays unaffected -- exactly the coverage gap the Fix Round 1
  // review flagged. This version uses implement-item (in KNOWN_MUTATING_OPS)
  // at its real default role, so isReadOnlyAssignment resolves false and the
  // worker profile must still be selected.
  const tempDir = mkTempDir();

  // Real git repo so the worker's file mutation produces genuine changedFiles
  // evidence (classifyRunEvidence requires external evidence for a mutating
  // operation to settle "done", per assignment-runner.mjs:398-437).
  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'tracked.txt'), 'initial content\n');
  execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });

  const reviewer = writeArgvRecordingExecutor(tempDir, 'reviewer');
  const workerArgvCapturePath = path.join(tempDir, 'worker-argv.json');
  const workerScriptPath = path.join(tempDir, 'worker-mutator-executor.mjs');
  fs.writeFileSync(
    workerScriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(${JSON.stringify(workerArgvCapturePath)}, JSON.stringify(process.argv.slice(2)));
    fs.writeFileSync(path.join(process.cwd(), 'tracked.txt'), 'modified content\\n');
    process.stdout.write("Code modified.\\n");
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executors: {
      claude: {
        command: process.execPath,
        args: [workerScriptPath, '{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
        allowCrossProvider: true,
      },
      'claude-reviewer': {
        command: process.execPath,
        args: [reviewer.scriptPath, '{prompt}'],
        allowCrossProvider: true,
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-cell63-worker-unaffected', status: 'todo', stage: 'executing', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'executing',
    operation: 'implement-item',
  });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'claude');
  assert.ok(result.evidence.changedFiles.includes('tracked.txt'), 'the mutation must be captured as real changedFiles evidence');
  assert.equal(fs.existsSync(reviewer.argvCapturePath), false, 'a mutating assignment must never spawn the claude-reviewer profile');
  // Cell 6.7 Bug B: no redirection happened here, so the record must say so.
  assert.equal(result.executorRedirected, false);

  const workerArgs = JSON.parse(fs.readFileSync(workerArgvCapturePath, 'utf8'));
  assert.ok(
    workerArgs.some((arg) => arg.includes('Bash(git commit')),
    'a mutating assignment must keep the git add/commit grant unchanged',
  );
});

test('a read-only-by-operation assignment (shape-plan) at its real default implementer role resolves the scoped claude-reviewer executor', async () => {
  // Cell 6.3 Fix Round 1 review HIGH finding: the gate checked
  // READ_ONLY_ROLES.has(role) only, so shape-plan/lock-decisions/
  // judge-ambiguity -- read-only by operation, not role, and declared
  // role: implementer by default in feature.yaml -- still resolved the
  // full worker executor. The gate must key off isReadOnlyAssignment so
  // this default-wired case is covered without any role override.
  const tempDir = mkTempDir();
  const worker = writeArgvRecordingExecutor(tempDir, 'worker');
  const reviewer = writeArgvRecordingExecutor(tempDir, 'reviewer');

  const runnerConfig = {
    executors: {
      claude: {
        command: process.execPath,
        args: [worker.scriptPath, '{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
        allowCrossProvider: true,
      },
      'claude-reviewer': {
        command: process.execPath,
        args: [reviewer.scriptPath, '{prompt}'],
        allowCrossProvider: true,
      },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-cell63-shape-plan-readonly-op', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'shape-plan',
  });

  assert.equal(assignment.role, 'implementer', 'shape-plan must default to role: implementer per feature.yaml, not an override');

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'claude-reviewer');
  assert.equal(fs.existsSync(worker.argvCapturePath), false, 'a read-only-by-operation assignment must never spawn the worker executor profile');

  const reviewerArgs = JSON.parse(fs.readFileSync(reviewer.argvCapturePath, 'utf8'));
  assert.ok(
    !reviewerArgs.some((arg) => arg.includes('Bash(git commit')),
    'reviewer-resolved executor args must never include Bash(git commit',
  );
});

test('Cell 6.3 Fix Round 1: absent claude-reviewer config entry falls back unchanged to plain claude for a reviewer-role assignment', async () => {
  const tempDir = mkTempDir();
  const worker = writeArgvRecordingExecutor(tempDir, 'worker');

  const runnerConfig = {
    executors: {
      claude: {
        command: process.execPath,
        args: [worker.scriptPath, '{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
        allowCrossProvider: true,
      },
      // no "claude-reviewer" entry configured
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-cell63-absent-fallback', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
    role: 'reviewer',
  });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'claude');
  assert.equal(fs.existsSync(worker.argvCapturePath), true, 'absent config must still fall back to spawning plain claude');
});

// ─── ADR-007 R3: `execute --contract <file>` CLI door ──────────────────────

// The file IS the contract (ADR-006 §4's field list, flat) -- a minimal
// read-only inline contract a human or calling agent could hand-write.
function inlineContractFileContent(overrides = {}) {
  return {
    objective: 'Answer one bounded design question about this repo.',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['a written report'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'reviewer',
    budget: { timeoutMs: 5000, maxRuns: 1 },
    ...overrides,
  };
}

test('dispatch CLI execute subcommand rejects --for outright (dispatch-path unification: the purpose door is retired), before doing anything else, even combined with --contract', () => {
  const tempDir = mkTempDir();
  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent()));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--contract', contractPath, '--for', 'reviewer', '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /execute --for is no longer supported/);
      return true;
    },
  );
  assert.equal(
    fs.existsSync(path.join(tempDir, '.fgos', 'assignments')),
    false,
    'a rejected flag combination must never reach assignment building',
  );
});

test('dispatch CLI execute subcommand rejects --for on its own, with no --contract/--assignment at all', () => {
  const tempDir = mkTempDir();
  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--for', 'reviewer', '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /execute --for is no longer supported/);
      assert.match(String(err.stderr), /decide --for/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand rejects --contract combined with --assignment before doing anything else', () => {
  const tempDir = mkTempDir();
  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent()));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--contract', contractPath, '--assignment', 'asgn_does_not_exist_001', '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /--contract cannot be combined with --assignment/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --contract exits non-zero for a mutating contract before any executor is invoked', () => {
  const tempDir = mkTempDir();
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });

  const markerPath = path.join(tempDir, 'executor-was-invoked.marker');
  const executorScript = path.join(tempDir, 'marker-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    fs.writeFileSync(${JSON.stringify(markerPath)}, 'invoked');
    process.exit(0);
    `,
  );
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent({ mutation: 'mutating' })));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--contract', contractPath, '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /mutating.*rejected/i);
      return true;
    },
  );
  assert.equal(fs.existsSync(markerPath), false, 'a mutating contract must be rejected before any executor is ever spawned');
  assert.equal(
    fs.existsSync(path.join(tempDir, '.fgos', 'assignments')),
    false,
    'no assignment/run directory should be created for a rejected mutating contract',
  );
});

test('dispatch CLI execute subcommand with --contract exits non-zero when the contract omits mutation entirely', () => {
  const tempDir = mkTempDir();
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  const contractPath = path.join(tempDir, 'contract.json');
  const { mutation, ...withoutMutation } = inlineContractFileContent();
  fs.writeFileSync(contractPath, JSON.stringify(withoutMutation));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--contract', contractPath, '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /mutation/i);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --contract and --work fires the domain harness seam through a real subprocess run', async () => {
  const tempDir = mkTempDir();
  const fgosDir = path.join(tempDir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, {
    id: 'tsk-contract-cli-seam',
    title: 'Contract CLI seam target',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'true',
    docsRef: 'docs/history/contract-cli-seam',
  });

  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(
    contractPath,
    JSON.stringify(inlineContractFileContent({ role: 'advisor', supports: 'validate-plan' })),
  );

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--contract', contractPath, '--work', 'tsk-contract-cli-seam', '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );

  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.status, 'done');
  assert.equal(parsed.workId, 'tsk-contract-cli-seam');

  const assignmentJson = JSON.parse(
    fs.readFileSync(path.join(fgosDir, 'assignments', parsed.assignmentId, 'assignment.json'), 'utf8'),
  );
  assert.equal(assignmentJson.provenance.kind, 'inline');
  assert.deepEqual(assignmentJson.provenance.validators, ['execution-contract-schema', 'domain-harness-seam']);
  assert.equal(assignmentJson.workId, 'tsk-contract-cli-seam');
  assert.ok(
    assignmentJson.contextRefs.includes('docs/history/contract-cli-seam/plan.md'),
    'the harness-added context refs must be visible on the persisted assignment.json',
  );
});

test('dispatch CLI execute subcommand with --contract and no --work builds a standalone inline Assignment, no Stage/domain involved (Proof 1 shape)', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent()));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--contract', contractPath, '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );

  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.status, 'done');
  assert.equal(parsed.workId, null);

  const assignmentJson = JSON.parse(
    fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', parsed.assignmentId, 'assignment.json'), 'utf8'),
  );
  assert.equal(assignmentJson.provenance.kind, 'inline');
  assert.deepEqual(assignmentJson.provenance.validators, ['execution-contract-schema']);
  assert.equal(assignmentJson.stage, undefined);
  assert.equal(assignmentJson.domain, undefined);
  assert.equal(assignmentJson.operation, undefined);
  assert.ok(
    typeof assignmentJson.provenance.inline.caller.writerId === 'string' && assignmentJson.provenance.inline.caller.writerId.length > 0,
    'caller.writerId must be auto-resolved via resolveWriterIdentity() when the contract file omits it',
  );
});

test('dispatch CLI execute subcommand with --contract and --executor dispatches through the named executor', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    executors: {
      named_executor: { kind: 'agent', allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent()));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--contract', contractPath, '--executor', 'named_executor', '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );

  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.status, 'done');

  const storedPlan = JSON.parse(
    fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', parsed.assignmentId, 'runs', '01', 'dispatch-plan.json'), 'utf8'),
  );
  assert.equal(storedPlan.executorId, 'named_executor');
});

test('dispatch CLI execute subcommand with --contract and an unregistered --executor rejects before spawn with a non-zero exit', () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    executors: {
      named_executor: { kind: 'agent', allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent()));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--contract', contractPath, '--executor', 'no_such_executor', '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /preferExecutor "no_such_executor" is not a registered executor/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --contract and a duplicate --executor flag rejects before spawn with a non-zero exit', () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    executors: {
      named_executor: { kind: 'agent', allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent()));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [
          dispatchScript, 'execute', '--contract', contractPath,
          '--executor', 'named_executor', '--executor', 'named_executor', '--cwd', tempDir,
        ],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /duplicate flag "--executor" -- pass it at most once before launch/);
      return true;
    },
  );
});

test('dispatch CLI execute subcommand with --contract honors a file-supplied caller.writerId verbatim instead of overwriting it', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(
    contractPath,
    JSON.stringify({ ...inlineContractFileContent(), caller: { writerId: 'explicit-caller-007' } }),
  );

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--contract', contractPath, '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );

  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.status, 'done');

  const assignmentJson = JSON.parse(
    fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', parsed.assignmentId, 'assignment.json'), 'utf8'),
  );
  assert.equal(assignmentJson.provenance.inline.caller.writerId, 'explicit-caller-007');
  assert.match(parsed.assignmentId, /^asgn_explicit_caller_007_op_\d{3}$/);
});

test('dispatch CLI execute subcommand with --contract and an unknown --work id fails clearly without building an assignment', () => {
  const tempDir = mkTempDir();
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  const contractPath = path.join(tempDir, 'contract.json');
  fs.writeFileSync(contractPath, JSON.stringify(inlineContractFileContent({ role: 'advisor', supports: 'validate-plan' })));

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  assert.throws(
    () => {
      execFileSync(
        process.execPath,
        [dispatchScript, 'execute', '--contract', contractPath, '--work', 'tsk-does-not-exist', '--cwd', tempDir],
        { encoding: 'utf8', cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    },
    (err) => {
      assert.match(String(err.stderr), /no work item "tsk-does-not-exist" found/);
      return true;
    },
  );
  assert.equal(
    fs.existsSync(path.join(tempDir, '.fgos', 'assignments')),
    false,
    'an unknown --work id must fail before any assignment is built',
  );
});

test('dispatch CLI execute subcommand with --contract computes a distinct assignmentId on a second --work invocation instead of silently re-executing the stale first one (Fix Round 1)', () => {
  const tempDir = mkTempDir();
  const fgosDir = path.join(tempDir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, {
    id: 'tsk-contract-collision',
    title: 'Contract collision regression target',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'true',
    docsRef: 'docs/history/contract-collision',
  });

  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contract1Path = path.join(tempDir, 'contract1.json');
  fs.writeFileSync(
    contract1Path,
    JSON.stringify(inlineContractFileContent({
      role: 'advisor',
      supports: 'validate-plan',
      objective: 'FIRST invocation objective — should be run 1.',
      caller: { writerId: 'collision-writer' },
    })),
  );
  const contract2Path = path.join(tempDir, 'contract2.json');
  fs.writeFileSync(
    contract2Path,
    JSON.stringify(inlineContractFileContent({
      role: 'advisor',
      supports: 'validate-plan',
      objective: 'SECOND invocation objective — should be run 2, not run 1.',
      caller: { writerId: 'collision-writer' },
    })),
  );

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const stdout1 = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--contract', contract1Path, '--work', 'tsk-contract-collision', '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );
  const parsed1 = JSON.parse(stdout1.trim());
  assert.equal(parsed1.status, 'done');

  const stdout2 = execFileSync(
    process.execPath,
    [dispatchScript, 'execute', '--contract', contract2Path, '--work', 'tsk-contract-collision', '--cwd', tempDir],
    { encoding: 'utf8', cwd: tempDir },
  );
  const parsed2 = JSON.parse(stdout2.trim());
  assert.equal(parsed2.status, 'done');

  assert.notEqual(parsed2.assignmentId, parsed1.assignmentId, 'a second --contract --work invocation under the same writer must never collide with the first assignmentId');

  const assignment2Json = JSON.parse(
    fs.readFileSync(path.join(fgosDir, 'assignments', parsed2.assignmentId, 'assignment.json'), 'utf8'),
  );
  assert.equal(
    assignment2Json.provenance.inline.contract.objective,
    'SECOND invocation objective — should be run 2, not run 1.',
    'the second call must persist its OWN contract content, not silently re-execute the first',
  );
});

test('dispatch CLI execute subcommand with --contract computes distinct assignmentIds for genuinely concurrent invocations under the same --work id, and both contracts persist (Red-Team fix)', async () => {
  const tempDir = mkTempDir();
  const fgosDir = path.join(tempDir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, {
    id: 'tsk-contract-race',
    title: 'Contract concurrency race target',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'true',
    docsRef: 'docs/history/contract-race',
  });

  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contract1Path = path.join(tempDir, 'race-contract1.json');
  fs.writeFileSync(
    contract1Path,
    JSON.stringify(inlineContractFileContent({
      role: 'advisor',
      supports: 'validate-plan',
      objective: 'RACE CONTRACT ONE',
      caller: { writerId: 'race-writer' },
    })),
  );
  const contract2Path = path.join(tempDir, 'race-contract2.json');
  fs.writeFileSync(
    contract2Path,
    JSON.stringify(inlineContractFileContent({
      role: 'advisor',
      supports: 'validate-plan',
      objective: 'RACE CONTRACT TWO',
      caller: { writerId: 'race-writer' },
    })),
  );

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const run = (contractPath) =>
    execFileAsync(
      process.execPath,
      [dispatchScript, 'execute', '--contract', contractPath, '--work', 'tsk-contract-race', '--cwd', tempDir],
      { encoding: 'utf8', cwd: tempDir },
    );

  const [result1, result2] = await Promise.all([run(contract1Path), run(contract2Path)]);
  const parsed1 = JSON.parse(result1.stdout.trim());
  const parsed2 = JSON.parse(result2.stdout.trim());

  // Do NOT assert both calls reach status 'done': cli.mjs:467-483's
  // pre-existing per-cwd single-flight lock (unrelated to assignmentId
  // claiming -- it serializes actual executor SPAWNS, not the id claim)
  // can legitimately reject one of two genuinely concurrent executor runs
  // against the same cwd with a loud 'dispatch ... already in flight'
  // failure. That is an honest, visible error, not the silent false
  // success this fix targets -- what must never happen is a collided
  // assignmentId or lost contract content, asserted below.
  assert.ok(parsed1.assignmentId, 'call 1 must produce an assignmentId');
  assert.ok(parsed2.assignmentId, 'call 2 must produce an assignmentId');
  assert.notEqual(
    parsed2.assignmentId,
    parsed1.assignmentId,
    'two genuinely concurrent --contract --work invocations under the same Work must never collide on assignmentId',
  );

  const assignmentsDir = path.join(fgosDir, 'assignments');
  const readObjective = (assignmentId) =>
    JSON.parse(fs.readFileSync(path.join(assignmentsDir, assignmentId, 'assignment.json'), 'utf8')).provenance
      .inline.contract.objective;
  assert.equal(
    readObjective(parsed1.assignmentId),
    'RACE CONTRACT ONE',
    'call 1 own persisted assignment.json must carry its own contract content, not be silently discarded',
  );
  assert.equal(
    readObjective(parsed2.assignmentId),
    'RACE CONTRACT TWO',
    'call 2 own persisted assignment.json must carry its own contract content, not be silently discarded',
  );
});

test('dispatch CLI execute subcommand with --contract computes distinct assignmentIds for genuinely concurrent invocations with no --work at all (writer-identity-only fallback id path) (Red-Team fix)', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
  fs.mkdirSync(path.join(tempDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, '.fgos', 'config.json'), JSON.stringify({ runner: runnerConfig }, null, 2));

  const contract1Path = path.join(tempDir, 'nowork-race1.json');
  fs.writeFileSync(
    contract1Path,
    JSON.stringify(inlineContractFileContent({
      objective: 'NOWORK RACE ONE',
      caller: { writerId: 'nowork-race-writer' },
    })),
  );
  const contract2Path = path.join(tempDir, 'nowork-race2.json');
  fs.writeFileSync(
    contract2Path,
    JSON.stringify(inlineContractFileContent({
      objective: 'NOWORK RACE TWO',
      caller: { writerId: 'nowork-race-writer' },
    })),
  );

  const dispatchScript = path.resolve('src/runner/dispatch.mjs');
  const run = (contractPath) =>
    execFileAsync(
      process.execPath,
      [dispatchScript, 'execute', '--contract', contractPath, '--cwd', tempDir],
      { encoding: 'utf8', cwd: tempDir },
    );
  const runWithJsonReadRetry = async (contractPath) => {
    try {
      return await run(contractPath);
    } catch (err) {
      if (!String(err?.stderr || err?.message || '').includes('Unexpected end of JSON input')) throw err;
      return run(contractPath);
    }
  };

  const [result1, result2] = await Promise.all([runWithJsonReadRetry(contract1Path), runWithJsonReadRetry(contract2Path)]);
  const parsed1 = JSON.parse(result1.stdout.trim());
  const parsed2 = JSON.parse(result2.stdout.trim());

  // See the same-Work race test above for why this does not assert both
  // calls reach status 'done' -- the pre-existing per-cwd single-flight
  // lock (cli.mjs:467-483) can legitimately reject one concurrent
  // executor spawn with a loud, honest error unrelated to assignmentId
  // claiming. What must never happen -- a collided id or lost content --
  // is asserted below.
  assert.ok(parsed1.assignmentId, 'call 1 must produce an assignmentId');
  assert.ok(parsed2.assignmentId, 'call 2 must produce an assignmentId');
  assert.notEqual(
    parsed2.assignmentId,
    parsed1.assignmentId,
    'two genuinely concurrent --contract invocations with no --work under the same caller.writerId must never collide on assignmentId',
  );

  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  const readObjective = (assignmentId) =>
    JSON.parse(fs.readFileSync(path.join(assignmentsDir, assignmentId, 'assignment.json'), 'utf8')).provenance
      .inline.contract.objective;
  assert.equal(
    readObjective(parsed1.assignmentId),
    'NOWORK RACE ONE',
    'call 1 own persisted assignment.json must carry its own contract content, not be silently discarded',
  );
  assert.equal(
    readObjective(parsed2.assignmentId),
    'NOWORK RACE TWO',
    'call 2 own persisted assignment.json must carry its own contract content, not be silently discarded',
  );
});



// Two dispatch contracts, one collector. A worker launched through cli-spawn
// writes agent-result.json flat; one launched through herdr-spawn writes
// outbox/result-<round>.json, because the outbox is the only place it is
// allowed to write. Before this, the second one's claim was silently
// discarded and the run was classified off git alone.

function writeOutboxRound(runDir, round, { status = 'done', summary = 'did the thing', report = 'A real report about the work that was done.' } = {}) {
  const outbox = path.join(runDir, 'outbox');
  fs.mkdirSync(outbox, { recursive: true });
  fs.writeFileSync(path.join(outbox, `result-${round}.json`), JSON.stringify({ status, summary, findings: [], evidenceRefs: [] }));
  if (report !== null) fs.writeFileSync(path.join(outbox, `report-${round}.md`), report);
}

test('a claim written to the worker outbox is collected, not thrown away', async () => {
  const tempDir = mkTempDir();
  const executorScript = path.join(tempDir, 'outbox-worker.mjs');
  const runDirFor = path.join(tempDir, '.fgos', 'assignments');
  fs.writeFileSync(executorScript, `
import fs from 'node:fs';
import path from 'node:path';
// Behaves like an interactive worker: writes only inside its own outbox.
const root = ${JSON.stringify(runDirFor)};
const asgn = fs.readdirSync(root)[0];
const runDir = path.join(root, asgn, 'runs', '01');
fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
fs.writeFileSync(path.join(runDir, 'outbox', 'report-1.md'), 'The worker explains what it actually changed here.');
fs.writeFileSync(path.join(runDir, 'outbox', 'result-1.json'), JSON.stringify({ status: 'done', summary: 'wrote the thing', findings: [], evidenceRefs: [] }));
console.log('done');
`);

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 20000,
  };
  const work = { id: 'tsk-outbox', status: 'doing', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'validate-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.agentClaim?.summary, 'wrote the thing', 'the worker\'s own account survives to the RunResult');
  assert.equal(result.status, 'done');
  assert.notEqual(result.confidence, 'no-evidence', 'a settled round with a real claim is never no-evidence');
});

test('the flat legacy name still works, so cli-spawn workers are untouched', async () => {
  const tempDir = mkTempDir();
  const executorScript = path.join(tempDir, 'flat-worker.mjs');
  const runDirFor = path.join(tempDir, '.fgos', 'assignments');
  fs.writeFileSync(executorScript, `
import fs from 'node:fs';
import path from 'node:path';
const root = ${JSON.stringify(runDirFor)};
const asgn = fs.readdirSync(root)[0];
const runDir = path.join(root, asgn, 'runs', '01');
fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'The worker explains what it actually changed here.');
fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'legacy shape', findings: [], evidenceRefs: [] }));
console.log('done');
`);

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 20000,
  };
  const work = { id: 'tsk-flat', status: 'doing', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'validate-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  assert.equal(result.agentClaim?.summary, 'legacy shape');
  assert.equal(result.status, 'done');
});

test('executeAssignment rejects a reviewer v2 claim without assessment.verdict at the production classification gate', async () => {
  const tempDir = mkTempDir();
  const executorScript = path.join(tempDir, 'reviewer-missing-assessment.mjs');
  fs.writeFileSync(executorScript, `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const runDir = path.dirname(/Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt)[1]);
fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'Reviewer report with substantive detail.');
fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 'Reviewed.' }));
`);
  const assignment = buildAssignment({
    work: { id: 'tsk-reviewer-assessment-gate', status: 'todo', stage: 'planning', domain: 'coding' },
    stage: 'planning', operation: 'validate-plan', role: 'reviewer',
  });
  const result = await executeAssignment(assignment, {
    cwd: tempDir, repoRoot: tempDir,
    runnerConfig: { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, models: { standard: 'test-model' }, timeoutMs: 5000 },
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.confidence, 'failed');
  assert.deepEqual(result.agentClaim, { status: 'failed', summary: 'agent-result.json was present but failed schema validation' });
});

test('executeAssignment rejects a legacy failed claim with an object error at the production classification gate', async () => {
  const tempDir = mkTempDir();
  const executorScript = path.join(tempDir, 'legacy-object-error.mjs');
  fs.writeFileSync(executorScript, `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const runDir = path.dirname(/Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt)[1]);
fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'failed', summary: 'Legacy failure.', error: { code: 'ELEGACY' } }));
`);
  const assignment = buildAssignment({
    work: { id: 'tsk-legacy-error-gate', status: 'todo', stage: 'planning', domain: 'coding' },
    stage: 'planning', operation: 'validate-plan',
  });
  const result = await executeAssignment(assignment, {
    cwd: tempDir, repoRoot: tempDir,
    runnerConfig: { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, models: { standard: 'test-model' }, timeoutMs: 5000 },
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.confidence, 'failed');
  assert.deepEqual(result.agentClaim, { status: 'failed', summary: 'agent-result.json was present but failed schema validation' });
});


test('resolveWorkerArtifactPath prefers the outbox, and orders rounds by number rather than by name', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, 'runs', '01');
  const outbox = path.join(runDir, 'outbox');
  fs.mkdirSync(outbox, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), '{}');

  fs.writeFileSync(path.join(outbox, 'result-2.json'), '{}');
  fs.writeFileSync(path.join(outbox, 'result-10.json'), '{}');
  // Sorted as text, "result-10" comes before "result-2", so a naive sort would
  // classify a resumed run on the older claim. Round order is numeric.
  assert.equal(
    resolveWorkerArtifactPath(runDir, /^result-(\d+)\.json$/, 'agent-result.json'),
    path.join(outbox, 'result-10.json'),
  );
});

test('resolveWorkerArtifactPath falls back to the flat legacy name when the outbox has nothing', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, 'runs', '01');
  fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'outbox', 'ack-1.json'), '{}');

  assert.equal(
    resolveWorkerArtifactPath(runDir, /^result-(\d+)\.json$/, 'agent-result.json'),
    path.join(runDir, 'agent-result.json'),
    'an ack is not a result, and a run dir with no outbox at all still resolves',
  );
  const noOutbox = path.join(tempDir, 'runs', '02');
  fs.mkdirSync(noOutbox, { recursive: true });
  assert.equal(
    resolveWorkerArtifactPath(noOutbox, /^result-(\d+)\.json$/, 'agent-result.json'),
    path.join(noOutbox, 'agent-result.json'),
  );
});

// =============================================================================
// Run admission and fencing (runtime-recovery P01): executeAssignment's
// atomic admission ledger (run-lock.mjs's shared generation primitive),
// replacing the prior readdirSync + max-attempt scan. See
// admitRunAttempt's own doc comment in assignment-runner.mjs for the full
// commit algorithm this proves.
// =============================================================================

function writeAssignmentJsonFor(tempDir, assignment) {
  const dir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'assignment.json'), `${JSON.stringify(assignment, null, 2)}\n`);
  return dir;
}

/** Runs `executeAssignment(assignment, { cwd, repoRoot, runnerConfig, ...extraOpts })`
 * in a genuinely separate child process (never a JS-level stub), reporting
 * back `{ ok: true, result }` on success or `{ ok: false, message }` on a
 * thrown error -- always exiting 0 so a Promise.all over an expected
 * winner+loser pair never rejects on the loser. */
function spawnExecuteAssignment(tempDir, assignment, runnerConfig, extraOpts = {}) {
  const moduleUrl = pathToFileURL(path.resolve('src/runner/dispatch/assignment-runner.mjs')).href;
  const script = [
    `import('${moduleUrl}').then(async ({ executeAssignment }) => {`,
    `  try {`,
    `    const result = await executeAssignment(${JSON.stringify(assignment)}, {`,
    `      cwd: ${JSON.stringify(tempDir)},`,
    `      repoRoot: ${JSON.stringify(tempDir)},`,
    `      runnerConfig: ${JSON.stringify(runnerConfig)},`,
    `      ...${JSON.stringify(extraOpts)},`,
    `    });`,
    `    process.stdout.write(JSON.stringify({ ok: true, result }));`,
    `  } catch (err) {`,
    `    process.stdout.write(JSON.stringify({ ok: false, message: err.message }));`,
    `  }`,
    `  process.exit(0);`,
    `});`,
  ].join('\n');
  return execFileAsync(process.execPath, ['-e', script], { encoding: 'utf8' }).then((r) => JSON.parse(r.stdout));
}

function admissionRunnerConfig(executorScript) {
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
}

test('executeAssignment: the same (retryId, destination, payloadDigest) tuple returns the identical committed Run without dispatching a second executor', async () => {
  const tempDir = mkTempDir();
  const counterPath = path.join(tempDir, 'invocation-count.txt');
  const executorScript = path.join(tempDir, 'counting-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prior = fs.existsSync(${JSON.stringify(counterPath)}) ? Number(fs.readFileSync(${JSON.stringify(counterPath)}, 'utf8')) : 0;
    fs.writeFileSync(${JSON.stringify(counterPath)}, String(prior + 1));
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = path.dirname(match[1]);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    process.exit(0);
    `,
  );
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-dup', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const tuple = { retryId: 'retry-dup-1', destination: 'fixed-destination', payloadDigest: 'fixed-payload-digest' };
  const first = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, ...tuple });
  const second = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, ...tuple });

  assert.equal(second.runId, first.runId, 'the same idempotency tuple must resolve to the SAME committed Run');
  assert.equal(fs.readFileSync(counterPath, 'utf8'), '1', 'the executor must only ever be dispatched once for a duplicate admission tuple');
});

test('executeAssignment: reusing a retryId with a CHANGED destination/payload is refused as duplicate-retry', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-dup-retry', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, retryId: 'retry-a', destination: 'dest-1', payloadDigest: 'digest-1' });

  await assert.rejects(
    () => executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, retryId: 'retry-a', destination: 'dest-1', payloadDigest: 'digest-2' }),
    (err) => err instanceof RunnerConfigError && /duplicate-retry/.test(err.message),
  );
});

test('executeAssignment: a predecessorRunId that does not name the current committed Run is refused as invalid-predecessor', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-bad-pred', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const initial = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, retryId: 'retry-initial', destination: 'dest', payloadDigest: 'digest-1' });
  assert.equal(initial.runtime.exitCode, 0);

  await assert.rejects(
    () =>
      executeAssignment(assignment, {
        cwd: tempDir,
        repoRoot: tempDir,
        runnerConfig,
        retryId: 'retry-wrong-predecessor',
        predecessorRunId: 'run_does_not_exist_99',
        destination: 'dest',
        payloadDigest: 'digest-2',
      }),
    (err) => err instanceof RunnerConfigError && /invalid-predecessor/.test(err.message),
  );
});

test('executeAssignment: concurrent identical admission (same retryId/tuple, two genuinely separate processes) produces exactly one Run identity, never two', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-concurrent-dup', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });
  writeAssignmentJsonFor(tempDir, assignment);

  const tuple = { retryId: 'retry-concurrent-dup', destination: 'fixed-destination', payloadDigest: 'fixed-payload-digest' };
  const [a, b] = await Promise.all([
    spawnExecuteAssignment(tempDir, assignment, runnerConfig, tuple),
    spawnExecuteAssignment(tempDir, assignment, runnerConfig, tuple),
  ]);

  // Both calls resolve to the SAME admission identity. Execution-level
  // deduplication is NOT this cell's contract (P01 owns admission, not
  // adapter idempotency): the second call may either observe the same
  // already-committed runId, or be refused by per-Run control fencing if
  // it genuinely raced the first call's still-in-flight execution -- a
  // correct, desired refusal ("second controller on an un-settled Run
  // refused"), never a second, DIFFERENT Run.
  const outcomes = [a, b];
  const succeeded = outcomes.filter((o) => o.ok);
  assert.ok(succeeded.length >= 1, `at least one call must succeed: ${JSON.stringify(outcomes)}`);
  const runIds = new Set(succeeded.map((o) => o.result.runId));
  assert.equal(runIds.size, 1, `every successful call must report the SAME Run identity, got ${JSON.stringify(outcomes)}`);
  for (const o of outcomes) {
    if (!o.ok) assert.match(o.message, /could not acquire control|invalid-predecessor|duplicate-retry/, `an unsuccessful call must fail for an expected admission/control reason, got: ${o.message}`);
  }

  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  const attemptDirs = fs.readdirSync(runsDir).filter((d) => /^\d+$/.test(d));
  assert.deepEqual(attemptDirs, ['01'], 'exactly one attempt directory must exist -- one Run, never two');
});

test('executeAssignment: concurrent DIFFERENT retry tuples racing for the same (empty) predecessor produce exactly one winner and one typed invalid-predecessor loser', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-concurrent-race', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });
  writeAssignmentJsonFor(tempDir, assignment);

  const [a, b] = await Promise.all([
    spawnExecuteAssignment(tempDir, assignment, runnerConfig, { retryId: 'retry-race-a', predecessorRunId: null, destination: 'dest', payloadDigest: 'digest-a' }),
    spawnExecuteAssignment(tempDir, assignment, runnerConfig, { retryId: 'retry-race-b', predecessorRunId: null, destination: 'dest', payloadDigest: 'digest-b' }),
  ]);

  const outcomes = [a, b];
  const winners = outcomes.filter((o) => o.ok);
  const losers = outcomes.filter((o) => !o.ok);
  assert.equal(winners.length, 1, `expected exactly one winner, got ${JSON.stringify(outcomes)}`);
  assert.equal(losers.length, 1, `expected exactly one loser, got ${JSON.stringify(outcomes)}`);
  assert.match(losers[0].message, /invalid-predecessor/);

  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  const attemptDirs = fs.readdirSync(runsDir).filter((d) => /^\d+$/.test(d));
  assert.deepEqual(attemptDirs, ['01'], 'the loser must never materialize its own competing attempt directory');
});

test('executeAssignment: crash after admission-ledger commit but before the run directory ever materializes leaves NO admitted (visible) Run -- a repeat call with the same tuple self-heals it', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-crash-before-rename', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const tuple = { retryId: 'retry-crash-1', destination: 'dest', payloadDigest: 'digest-1' };
  const first = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, ...tuple });
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  assert.equal(fs.existsSync(runDir), true);

  // Simulate "crash after the admission ledger committed attempt 1, before
  // (or during) the run directory's own staging+rename ever completed" --
  // the observable state left behind is: the ledger record exists, but
  // runs/01/ does not. Directly constructing this on-disk fixture (rather
  // than a literal process kill) matches this repo's own established crash-
  // point test convention.
  fs.rmSync(runDir, { recursive: true, force: true });
  assert.equal(fs.existsSync(runDir), false, 'no committed Run is visible at this crash point');

  const resumed = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig, ...tuple });

  assert.equal(resumed.runId, first.runId, 'a repeat call for the SAME declared tuple must resume the exact same identity, never allocate a new attempt');
  assert.equal(fs.existsSync(path.join(runDir, 'run.json')), true, 'the run directory must be fully re-materialized');
  assert.equal(fs.existsSync(path.join(runDir, 'dispatch-plan.json')), true);
  assert.equal(resumed.status, 'done');

  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  const attemptDirs = fs.readdirSync(runsDir).filter((d) => /^\d+$/.test(d));
  assert.deepEqual(attemptDirs, ['01'], 'self-heal must never allocate attempt 02 for a resumed identical tuple');
});

test('executeAssignment: an abandoned staging directory from a prior crashed attempt is never trusted -- it is removed and rebuilt fresh, never left as a phantom empty attempt', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-abandoned-staging', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  fs.mkdirSync(runsDir, { recursive: true });
  const stagingDir = path.join(runsDir, '.staging-01');
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.writeFileSync(path.join(stagingDir, 'garbage.txt'), 'leftover from a crashed attempt');

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(fs.existsSync(stagingDir), false, 'the abandoned staging directory must be gone -- consumed by the rebuild, not left dangling');
  const runDir = path.join(runsDir, '01');
  assert.equal(fs.existsSync(path.join(runDir, 'run.json')), true);
  assert.equal(fs.existsSync(path.join(runDir, 'garbage.txt')), false, 'stale staging content must never leak into the real committed attempt directory');
});

test('executeAssignment: a live sibling staging directory is never removed during admission cleanup', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-live-staging', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  fs.mkdirSync(runsDir, { recursive: true });

  const retryId = 'retry-sibling-test';
  const payloadDigest = 'digest-test-sibling';
  // Plant a live sibling staging directory whose PID is this live process
  const liveStagingDir = path.join(runsDir, `.staging-01-${process.pid}-${crypto.randomUUID()}`);
  fs.mkdirSync(liveStagingDir, { recursive: true });
  fs.writeFileSync(
    path.join(liveStagingDir, 'run.json'),
    JSON.stringify({ retryId, payloadDigest: `sha256:${payloadDigest}` }),
  );

  // Also plant an abandoned staging directory from a dead PID
  const deadPid = 99999999;
  const deadStagingDir = path.join(runsDir, `.staging-01-${deadPid}-${crypto.randomUUID()}`);
  fs.mkdirSync(deadStagingDir, { recursive: true });
  fs.writeFileSync(
    path.join(deadStagingDir, 'run.json'),
    JSON.stringify({ retryId, payloadDigest: `sha256:${payloadDigest}` }),
  );

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    retryId,
    predecessorRunId: null,
    destination: tempDir,
    payloadDigest,
  });

  assert.equal(result.status, 'done');
  assert.equal(fs.existsSync(deadStagingDir), false, 'dead pid staging directory must be cleaned up');
  assert.equal(fs.existsSync(liveStagingDir), true, 'live sibling staging directory must NEVER be removed');

  // Clean up planted live directory
  fs.rmSync(liveStagingDir, { recursive: true, force: true });
});

test('executeAssignment: fenced caller on pre-ledger runs/NN directory allocates next attempt, never adopting legacy settlement', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-fenced-legacy', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  const legacyDir = path.join(runsDir, '01');
  fs.mkdirSync(legacyDir, { recursive: true });
  const legacyRunId = `run_${assignment.assignmentId}_01`;
  fs.writeFileSync(path.join(legacyDir, 'run.json'), JSON.stringify({ runId: legacyRunId, attempt: 1, status: 'settled' }, null, 2));
  fs.writeFileSync(path.join(legacyDir, 'result.json'), JSON.stringify({ runId: legacyRunId, status: 'failed', agentClaim: { status: 'failed', summary: 'LEGACY-SETTLED-EVIDENCE' } }, null, 2));

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    retryId: 'retry-fenced-1',
    predecessorRunId: null,
    destination: tempDir,
    payloadDigest: 'digest-fenced-1',
  });

  assert.equal(result.status, 'done');
  assert.equal(result.runId, `run_${assignment.assignmentId}_02`, 'fenced caller must allocate attempt 02, never adopt legacy attempt 01');
  const attemptDirs = fs.readdirSync(runsDir).filter((d) => /^\d+$/.test(d)).sort();
  assert.deepEqual(attemptDirs, ['01', '02']);
  const legacyResult = JSON.parse(fs.readFileSync(path.join(legacyDir, 'result.json'), 'utf8'));
  assert.equal(legacyResult.agentClaim?.summary, 'LEGACY-SETTLED-EVIDENCE', 'legacy result must not be overwritten');
});

test('executeAssignment: a control token that is superseded mid-flight (a fresher controller cleanly took over while the adapter call was still in flight) refuses to append a settlement', async () => {
  const tempDir = mkTempDir();
  const executorScript = path.join(tempDir, 'slow-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    setTimeout(() => {
      const prompt = process.argv.slice(2).join(' ');
      const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
      if (match) {
        const runDir = path.dirname(match[1]);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
        fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
      }
      process.exit(0);
    }, 300);
    `,
  );
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-stale-token', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const controlGenerationsDir = path.join(runDir, 'control', 'generations');

  // Interject once this attempt's control generation has actually been
  // published (the executor is still "running" behind its own 300ms
  // setTimeout) -- read the real epoch/token off disk (run-lock.mjs's own
  // on-disk shape: one JSON record per epoch under control/generations/),
  // cleanly release it, and let a fresh interloper take over, simulating a
  // controller that legitimately superseded the original mid-flight.
  const interject = async () => {
    for (let i = 0; i < 100; i += 1) {
      if (fs.existsSync(controlGenerationsDir) && fs.readdirSync(controlGenerationsDir).some((f) => f.endsWith('.json'))) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    const [genFile] = fs.readdirSync(controlGenerationsDir).filter((f) => f.endsWith('.json')).sort();
    const record = JSON.parse(fs.readFileSync(path.join(controlGenerationsDir, genFile), 'utf8'));
    const controlEpoch = Number(genFile.replace('.json', ''));

    releaseRunControl(runDir, { controlEpoch, controlToken: record.controlToken });
    const interloper = acquireRunControl(runDir, { holder: { id: 'interloper', pid: process.pid }, purpose: 'test' });
    assert.equal(interloper.status, 'acquired');
    assert.equal(interloper.controlEpoch, controlEpoch + 1);
  };

  const [outcome] = await Promise.all([
    executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }).then(
      (result) => ({ ok: true, result }),
      (err) => ({ ok: false, message: err.message }),
    ),
    interject(),
  ]);

  assert.equal(outcome.ok, false, 'a superseded controller must never successfully append a settlement');
  assert.match(outcome.message, /no longer current/);
  assert.equal(fs.existsSync(path.join(runDir, 'result.json')), false, 'no settlement (result.json) may be appended by a controller that lost its token mid-flight');
});

test('executeAssignment: an unfenced caller (no retryId, every pre-existing call site) keeps getting "next available attempt", byte-compatible with the replaced readdirSync scan', async () => {
  const tempDir = mkTempDir();
  const executorScript = writeEchoExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const assignment = buildAssignment({ work: { id: 'tsk-admit-unfenced', status: 'doing', stage: 'planning', domain: 'coding' }, stage: 'planning', operation: 'validate-plan' });

  const first = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  const second = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  const third = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.deepEqual([first.runId, second.runId, third.runId].map((id) => id.split('_').pop()), ['01', '02', '03']);
});

test('committed config pins code-review Claude profiles to high effort only on reviewer invocations (executor-id-consolidation Step 2: reviewer/herdr-reviewer are now claude\'s own cli-readonly/herdr-readonly invocations, not separate executor ids)', () => {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..');
  const cfg = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'config.json'), 'utf8')).runner;

  const argsForInvocation = (executorId, invocationId) => cfg.executors[executorId].invocations.find((inv) => inv.id === invocationId).args;
  const hasHighEffort = (args) => {
    const effortIndex = args.indexOf('--effort');
    return effortIndex >= 0 && args[effortIndex + 1] === 'high';
  };

  assert.equal(hasHighEffort(argsForInvocation('claude', 'claude-cli-readonly')), true);
  assert.equal(hasHighEffort(argsForInvocation('claude', 'claude-herdr-readonly')), true);
  assert.equal(argsForInvocation('claude', 'claude-cli').includes('--effort'), false);
  assert.equal(cfg.executors['glm'].invocations[0].args.includes('--effort'), false);
});
