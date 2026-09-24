// test/runner/herdr-spawn-assignment-dispatch.test.mjs
//
// Coverage gap this closes (op_058/op_059/op_060): every existing herdr-spawn
// test dispatches through EXECUTOR_ADAPTERS['herdr-spawn'] directly or through
// executeExecutorCli -- never through executeAssignment itself, the real
// production door (assignment-runner.mjs). That gap is exactly how a wrong
// `compiledPlan.policy.adapter` field read (RT059-F1) and a herdr-spawn branch
// that never built assignmentLaunchContext (RT059-F2) both shipped and went
// unnoticed: nothing exercised the seam they broke.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';

function mkTempDir(prefix = 'fgos-herdr-assignment-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initGitRepo(repoDir) {
  execFileSync('git', ['init'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: repoDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test\n');
  execFileSync('git', ['add', '.'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: repoDir, stdio: 'ignore' });
}

/**
 * A fake herdr binary, in the same shape test/runner/herdr-spawn-adapter.test.mjs's
 * own `createMockHerdr` already proves works for `agent start`/`agent get`/
 * `agent prompt`/`pane split`/`pane close`/`pane process-info`: it answers
 * enough of herdr 0.8.2's real envelope shapes to carry one round to
 * settlement, then plays the worker by writing the ack/report/result files
 * the brief pointed it at.
 *
 * Unlike that helper, this one ALSO writes a real file mutation directly into
 * `repoDir` (via an absolute path baked in at script-generation time, never
 * relying on the mock subprocess's own cwd) -- an Assignment dispatch is a
 * MUTATING operation here, and classifyRunEvidence (assignment-runner.mjs)
 * requires real git-visible evidence, not just the worker's own claim, before
 * a mutating Run classifies as 'done'.
 */
function createMockHerdr(repoDir) {
  const scriptPath = path.join(repoDir, 'mock-herdr.mjs');
  const wrapperPath = path.join(repoDir, 'mock-herdr.sh');
  const logPath = path.join(repoDir, 'mock-log.jsonl');
  const mutationPath = path.join(repoDir, 'herdr-worker-output.txt');

  fs.writeFileSync(logPath, '');

  fs.writeFileSync(scriptPath, `
import fs from 'node:fs';
import path from 'node:path';

const logPath = ${JSON.stringify(logPath)};
const mutationPath = ${JSON.stringify(mutationPath)};
const args = process.argv.slice(2);
fs.appendFileSync(logPath, JSON.stringify(args) + '\\n');

const ok = (result) => { console.log(JSON.stringify({ id: 'cli:mock', result })); process.exit(0); };
const fail = (code, message) => { console.log(JSON.stringify({ error: { code, message: message ?? code }, id: 'cli:mock' })); process.exit(1); };

const [group, action] = args;

if (group === 'pane' && action === 'split') ok({ pane: { pane_id: 'mock-pane-1' } });
if (group === 'pane' && action === 'close') ok({ closed: true });
if (group === 'pane' && (action === 'report-agent' || action === 'report-agent-session')) ok({ type: 'ok' });
if (group === 'pane' && action === 'process-info') {
  ok({ process_info: { pane_id: 'mock-pane-1', shell_pid: 100, foreground_process_group_id: 200, foreground_processes: [{ pid: 200, name: 'agy' }, { pid: 100, name: 'zsh' }] } });
}
if (group === 'agent' && action === 'start') ok({ agent: { agent_status: 'idle' } });
if (group === 'agent' && action === 'read') ok({ read: { text: '' } });
if (group === 'agent' && action === 'get') ok({ agent: { agent_status: 'idle', pane_id: 'mock-pane-1', state_change_seq: 0 } });
if (group === 'agent' && action === 'prompt') {
  const text = args[3];
  if (text.startsWith('/')) ok({ agent: { agent_status: 'idle' } });

  // Play the worker: find the brief (file-pointer delivery), then write
  // exactly what it asked for, plus a real repo mutation.
  let briefText = text;
  const pointer = text.match(/^Read (.+) and do what it says\\.$/);
  if (pointer) briefText = fs.readFileSync(pointer[1], 'utf8');
  const ackMatch = briefText.match(/(\\/\\S+\\/outbox\\/ack-1\\.json)/);
  if (ackMatch) {
    const outbox = path.dirname(ackMatch[1]);
    const atomicWrite = (file, body) => { fs.writeFileSync(file + '.tmp', body); fs.renameSync(file + '.tmp', file); };
    atomicWrite(path.join(outbox, 'ack-1.json'), JSON.stringify({ round: 1, receivedAt: new Date().toISOString() }));
    atomicWrite(path.join(outbox, 'report-1.md'), 'herdr-spawn worker report: change applied.');
    // A valid agent-result.json claim (validateAgentResultClaim,
    // assignment.mjs): status must be one of done|blocked|failed|no-evidence,
    // plus a non-empty summary.
    atomicWrite(path.join(outbox, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'herdr-spawn assignment worker finished.' }));
    fs.writeFileSync(mutationPath, 'herdr worker mutation\\n');
  }
  ok({ agent: { agent_status: 'working' } });
}
ok({});
`);

  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  return {
    herdrBin: wrapperPath,
    calls: () => fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)),
  };
}

async function dispatchHerdrAssignment(repoDir, mock, executorBlock, { workId }) {
  initGitRepo(repoDir);
  const runnerConfig = {
    executor: executorBlock,
    models: { standard: 'sonnet' },
    timeoutMs: 15000,
  };
  const assignment = buildAssignment({
    workId,
    operation: 'implement-item',
    stage: 'executing',
    role: 'implement',
    description: 'herdr-spawn assignment dispatch test',
  });

  const savedBin = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = mock.herdrBin;
  try {
    return await executeAssignment(assignment, {
      cwd: repoDir,
      repoRoot: repoDir,
      runnerConfig,
      isReadOnlyMode: false,
    });
  } finally {
    if (savedBin === undefined) delete process.env.FGOS_HERDR_BIN;
    else process.env.FGOS_HERDR_BIN = savedBin;
  }
}

/**
 * Asserts the dispatch actually reached the real herdr worker-command seam
 * (herdr-round.mjs's runHerdrRound), not a misrouted cli-spawn supervisor and
 * not the pre-fix legacy fallback that skipped controller/protected entirely.
 */
function assertReachedHerdrSeam(result, repoDir) {
  const runResult = result.runResult || result;
  assert.equal(runResult.status, 'done');

  const runDir = path.join(repoDir, '.fgos', 'assignments', runResult.assignmentId, 'runs', '01');

  const commandsDir = path.join(runDir, 'controller', 'commands');
  assert.ok(fs.existsSync(commandsDir), 'controller/commands must exist');
  const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
  assert.ok(commandFiles.length > 0, 'a launch command record must have been published');
  const command = JSON.parse(fs.readFileSync(path.join(commandsDir, commandFiles[0]), 'utf8'));
  assert.equal(command.contract, 'herdr-launch-command.v1', 'the seam must be the real herdr contract, not a cli-spawn one');

  // Deterministic identity: the launch command's own runId matches this Run's
  // runId (herdr-round.mjs derives `herdrName` from exactly this pair via
  // normalizeAgentName(`fgos-${runId}-${launchCommandId}`)).
  assert.equal(command.runId, runResult.runId);
  assert.match(command.herdrName, /^fgos-/);

  const protectedDir = path.join(runDir, 'protected');
  assert.ok(fs.existsSync(protectedDir), 'protected/ must exist');
  // Never the cli-spawn contract: a herdr-spawn dispatch must not have been
  // misresolved into the local supervisor process and its envelope shape.
  assert.ok(
    !fs.existsSync(path.join(protectedDir, 'launch-envelope.json')),
    'a herdr-spawn dispatch must never publish a cli-spawn-launch-envelope.v1',
  );

  const receiptPath = path.join(protectedDir, 'adapter-receipts', `${command.launchCommandId}.json`);
  assert.ok(fs.existsSync(receiptPath), 'a receipt must have been produced');
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  assert.equal(receipt.contract, 'herdr-adapter-receipt.v1');

  return { runDir, command, receipt };
}

test('executeAssignment dispatches a herdr-spawn executor (flat adapter shape) through the real herdr seam', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const repoDir = mkTempDir();
  try {
    const mock = createMockHerdr(repoDir);
    const result = await dispatchHerdrAssignment(repoDir, mock, {
      kind: 'agent',
      command: 'agy',
      args: ['-i', '{prompt}', '--mode', 'accept-edits'],
      adapter: 'herdr-spawn',
      allowCrossProvider: true,
      interactiveMode: { exitCommand: '/exit', kind: 'agy' },
    }, { workId: 'tsk-herdr-flat' });

    assertReachedHerdrSeam(result, repoDir);
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
});

test('executeAssignment dispatches a herdr-spawn executor (invocations[] shape) through the real herdr seam', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const repoDir = mkTempDir();
  try {
    const mock = createMockHerdr(repoDir);
    const result = await dispatchHerdrAssignment(repoDir, mock, {
      kind: 'agent',
      allowCrossProvider: true,
      invocations: [{
        via: 'cli',
        adapter: 'herdr-spawn',
        interactiveMode: { exitCommand: '/exit', kind: 'agy' },
        command: 'agy',
        args: ['-i', '{prompt}', '--mode', 'accept-edits'],
      }],
    }, { workId: 'tsk-herdr-invocations' });

    assertReachedHerdrSeam(result, repoDir);
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
});

test('a genuine, untampered herdr-spawn receipt is accepted -- workerCommandDigest agrees with Authority\'s own prepared-invocation digest', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const repoDir = mkTempDir();
  try {
    const mock = createMockHerdr(repoDir);
    const result = await dispatchHerdrAssignment(repoDir, mock, {
      kind: 'agent',
      command: 'agy',
      args: ['-i', '{prompt}', '--mode', 'accept-edits'],
      adapter: 'herdr-spawn',
      allowCrossProvider: true,
      interactiveMode: { exitCommand: '/exit', kind: 'agy' },
    }, { workId: 'tsk-herdr-digest' });

    const { runDir, command, receipt } = assertReachedHerdrSeam(result, repoDir);

    const preparedInvocationPath = path.join(runDir, 'protected', 'prepared-invocation', `${command.launchCommandId}.json`);
    assert.ok(fs.existsSync(preparedInvocationPath), 'Authority must have published a prepared-invocation record');
    const prepared = JSON.parse(fs.readFileSync(preparedInvocationPath, 'utf8'));

    // The exact fact op_058/RT059-F4 regressed on: a real, untampered
    // receipt's workerCommandDigest must equal the digest Authority itself
    // recorded for the SAME {command, args} pair -- not the full herdr start
    // argv digest, and not conflated with preparedInvocationDigest.
    assert.ok(prepared.workerInvocation?.workerCommandDigest, 'Authority must have recorded a workerCommandDigest');
    assert.equal(receipt.workerCommandDigest, prepared.workerInvocation.workerCommandDigest);
    assert.notEqual(receipt.workerCommandDigest, receipt.preparedInvocationDigest);
    assert.notEqual(receipt.startArgvDigest, receipt.workerCommandDigest);
    assert.equal(receipt.preparedInvocationDigest, command.preparedInvocationDigest);
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
});
