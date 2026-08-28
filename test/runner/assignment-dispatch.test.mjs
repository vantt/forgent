import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { prepareDispatch } from '../../src/runner/dispatch/prepare.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { decideExecutorCli } from '../../src/runner/dispatch/cli.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-asgn-dispatch-test-'));
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
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
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


