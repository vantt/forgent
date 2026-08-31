import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { prepareDispatch } from '../../src/runner/dispatch/prepare.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { decideExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { initStore, addWork, listWork, settleClaim } from '../../src/state/store.mjs';
import { acquireClaim, readClaim } from '../../src/state/runtime-coordination.mjs';

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


