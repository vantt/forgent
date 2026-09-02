import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, execFileSync, execFile } from 'node:child_process';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { prepareDispatch } from '../../src/runner/dispatch/prepare.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { decideExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { createMission, createMissionAssignment } from '../../src/runner/dispatch/mission-lite.mjs';
import { initStore, addWork, listWork, settleClaim } from '../../src/state/store.mjs';
import { acquireClaim, readClaim } from '../../src/state/runtime-coordination.mjs';

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

test('dispatch CLI execute subcommand refuses a mutating, missionId-bearing assignment.json (mission-refusal gate restored for cli.mjs execute)', () => {
  const tempDir = mkTempDir();

  const assignment = buildAssignment({
    workId: 'tsk-cli-mission-refuse',
    missionId: 'mission_cli_refuse_test',
    stage: 'executing',
    operation: 'implement-item',
  });
  assert.equal(assignment.mutation, 'mutating');
  assert.equal(assignment.missionId, 'mission_cli_refuse_test');

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));

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

test('dispatch CLI execute subcommand refuses a mutating inline mission-lite assignment.json even though it carries no missionId field', () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_cli_inline_refuse_test',
      objective: 'Evaluate reviewer assignment for planning validation.',
    },
    { cwd: tempDir },
  );

  const assignment = createMissionAssignment(
    {
      missionId: 'mission_cli_inline_refuse_test',
      role: 'researcher',
      objective: 'Gather facts and existing code paths for planning validation.',
    },
    { cwd: tempDir },
  );
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.stage, undefined);
  assert.equal(assignment.operation, undefined);
  assert.equal(assignment.missionId, undefined);

  // Tamper the canonical assignment.json on disk (the only copy
  // createMissionAssignment ever writes) to mutation: 'mutating' -- the
  // real inline shape createMissionAssignment produces (no
  // stage/operation/missionId field, provenance.kind: 'inline'), so
  // `asgnObj.missionId` alone can never signal "apply the mission-refusal
  // gate" for this shape.
  const asgnPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
  const tampered = { ...JSON.parse(fs.readFileSync(asgnPath, 'utf8')), mutation: 'mutating' };
  fs.writeFileSync(asgnPath, `${JSON.stringify(tampered, null, 2)}\n`);

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

test('dispatch CLI execute subcommand rejects --contract combined with --for before doing anything else', () => {
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
      assert.match(String(err.stderr), /--contract cannot be combined with --for/);
      return true;
    },
  );
  assert.equal(
    fs.existsSync(path.join(tempDir, '.fgos', 'assignments')),
    false,
    'a rejected flag combination must never reach assignment building',
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

  const [result1, result2] = await Promise.all([run(contract1Path), run(contract2Path)]);
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


