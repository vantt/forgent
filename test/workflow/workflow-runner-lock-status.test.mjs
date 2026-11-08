// test/workflow/workflow-runner-lock-status.test.mjs — the advance lock and what `status` says of it: a second advance is refused
// while a process holds it, a dead or orphaned holder frees it, reading status never takes it, and the advance log is tailed only
// while it matters.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun, readWorkflowEvents } from '../../src/workflow/store.mjs';
import { startWorkflow, statusWorkflow, answerWorkflow, resumeWorkflow } from '../../src/workflow/index.mjs';
import { acquireSync, createLockScope, probe } from '../../src/holder-lock/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupTestRepo, GATE_WORKFLOW, advanceParams, holdAdvanceHere, holdAdvanceInChild } from '../helpers/workflow-runner-fixture.mjs';

seedFileLocalBwrapRegistry();

test('a run already being advanced by a live process refuses a second advance; an answer is kept for the live proposer and the ledger is left to it', async () => {
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  assert.equal(probe('advance', advanceParams(tmp, id)).result, 'free', 'the lock is released when an advance ends');

  const held = holdAdvanceHere(tmp, id);
  const eventCount = () => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id }).length;
  const before = eventCount();
  const opts = { repoRoot: tmp, cwd: tmp };
  const answer = { stepId: 'step-gate', answer: 'yes', approved: true, ...opts };

  await assert.rejects(resumeWorkflow(id, { ...opts, detached: true }), new RegExp(`already being advanced by process ${process.pid}`));
  await assert.rejects(resumeWorkflow(id, opts), /already being advanced/);
  assert.equal(eventCount(), before, 'a refused resume records nothing');

  // An answer never writes the ledger itself: it is kept as a file and the live holder records it.
  const kept = await answerWorkflow(id, { ...answer, detached: true });
  assert.equal(kept.recorded, true);
  assert.equal(kept.appliedBy, 'live proposer');
  assert.equal(kept.detached, undefined, 'no second process is started');
  assert.equal(eventCount(), before, 'the answer reached no ledger line while a holder lives');
  await assert.rejects(answerWorkflow(id, answer), (err) => err.code === 'gate-already-answered', 'a second answer to the same gate is refused by name');
  assert.equal(probe('advance', advanceParams(tmp, id)).result, 'held', 'the holder lock is left alone');
  held.release();

  // The next holder of advance folds the kept answer in before it acts on anything.
  const state = await resumeWorkflow(id, opts);
  assert.equal(state.status, 'completed');
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: id }).map((e) => e.type);
  assert.ok(types.indexOf('gate.answer') < types.lastIndexOf('step.complete'), 'gate.answer is on the ledger before the step it releases completes');
  assert.equal(probe('advance', advanceParams(tmp, id)).result, 'free');
});

test('an advance holder killed right after it took the lock does not block the next advance', async () => {
  if (process.platform === 'win32') return;
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  const answer = { stepId: 'step-gate', answer: 'yes', approved: true, repoRoot: tmp, cwd: tmp };

  const { child, exited } = await holdAdvanceInChild(tmp, id);
  await assert.rejects(resumeWorkflow(id, { repoRoot: tmp, cwd: tmp }), new RegExp(`already being advanced by process ${child.pid}`));
  child.kill('SIGKILL');
  await exited;

  const startedAt = Date.now();
  const state = await answerWorkflow(id, answer);
  assert.equal(state.status, 'completed', 'the next advance goes in at once, with no stale lock to clear');
  assert.ok(Date.now() - startedAt < 10000);
});

test('a run directory deleted while a process holds its advance lock gives the next advance a fresh lock', async () => {
  if (process.platform === 'win32') return;
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  const runDir = path.join(tmp, '.fgos', 'workflow-runs', id);
  const answer = { stepId: 'step-gate', answer: 'yes', approved: true, repoRoot: tmp, cwd: tmp };

  const { child, exited } = await holdAdvanceInChild(tmp, id);
  try {
    // The run is removed and recorded again under the same id while the old holder lives on.
    const events = fs.readFileSync(path.join(runDir, 'events.jsonl'));
    fs.rmSync(runDir, { recursive: true, force: true });
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'events.jsonl'), events);

    assert.equal(statusWorkflow(id, { repoRoot: tmp, cwd: tmp }).advance.running, false, 'the old holder holds a file that is gone');
    const state = await answerWorkflow(id, answer);
    assert.equal(state.status, 'completed', 'the old holder\'s lock on the deleted inode does not hold the new run');
  } finally {
    child.kill('SIGKILL');
    await exited;
  }
});

test('reading status while another process advances never makes the advance see the lock held', async () => {
  if (process.platform === 'win32') return;
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  const donePath = path.join(tmp, 'status-loop-done');
  const reader = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { statusWorkflow } from ${JSON.stringify(path.resolve('src/workflow/index.mjs'))};
    const stopAt = Date.now() + 1500;
    let reads = 0;
    while (Date.now() < stopAt) { statusWorkflow(${JSON.stringify(id)}, { repoRoot: ${JSON.stringify(tmp)}, cwd: ${JSON.stringify(tmp)} }); reads += 1; }
    fs.writeFileSync(${JSON.stringify(donePath)}, String(reads));
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => reader.once('exit', resolve));
  let tries = 0;
  while (!fs.existsSync(donePath)) {
    const res = acquireSync(createLockScope('test-advance'), 'advance', advanceParams(tmp, id));
    assert.equal(res.result, 'acquired', 'a status read must never hold the advance lock');
    res.handle.release();
    tries += 1;
  }
  await exited;
  assert.ok(tries > 10 && Number(fs.readFileSync(donePath, 'utf8')) > 10, 'both loops overlapped');
});

function writeRunLog(tmp, id, text) {
  fs.writeFileSync(path.join(tmp, '.fgos', 'workflow-runs', id, 'advance.log'), text);
}

// Rewrites every event timestamp so a run looks as if nothing was recorded for `ageMs`.
function ageRunEvents(tmp, id, ageMs) {
  const file = path.join(tmp, '.fgos', 'workflow-runs', id, 'events.jsonl');
  const ts = new Date(Date.now() - ageMs).toISOString();
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.stringify({ ...JSON.parse(l), ts }));
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

test('status reports a live advance holder and the tail of the advance log', async () => {
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  const opts = { repoRoot: tmp, cwd: tmp };
  const runDir = path.join(tmp, '.fgos', 'workflow-runs', id);

  const idle = statusWorkflow(id, opts).advance;
  assert.equal(idle.running, false);
  assert.equal(idle.pid, null);
  assert.equal(idle.logPath, path.join(runDir, 'advance.log'));
  assert.equal(idle.lastLines, undefined, 'an empty or absent log has nothing to tail');
  assert.equal(idle.hint, undefined, 'a parked run is waiting for an answer, not for a restart');

  const held = holdAdvanceHere(tmp, id);
  const lines = Array.from({ length: 30 }, (_, i) => `line-${i + 1} ${'x'.repeat(i === 29 ? 500 : 0)}`);
  writeRunLog(tmp, id, lines.join('\n') + '\n');

  const live = statusWorkflow(id, opts).advance;
  held.release();
  assert.equal(live.running, true);
  assert.equal(live.pid, process.pid);
  assert.equal(live.lastLines.length, 20, 'the tail is the last 20 lines');
  assert.ok(live.lastLines[0].startsWith('line-11'));
  assert.equal(live.lastLines[19].length, 300, 'each line is capped at 300 characters');
  assert.equal(live.hint, undefined);
});

test('status says a running run has no live advance and names resume once the last event is old', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] });
  const { workflowRunId: id } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });
  const opts = { repoRoot: tmp, cwd: tmp };

  const fresh = statusWorkflow(id, opts);
  assert.equal(fresh.status, 'running');
  assert.equal(fresh.advance.running, false);
  assert.equal(fresh.advance.hint, undefined, 'a just-recorded run may still be starting its advance');
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs', id, 'locks')), false, 'status of a run never advanced creates no lock file');

  ageRunEvents(tmp, id, 10 * 60 * 1000);
  writeRunLog(tmp, id, 'Error: spawn failed\n');
  if (process.platform !== 'win32') {
    const { child, exited } = await holdAdvanceInChild(tmp, id);
    child.kill('SIGKILL');
    await exited;
  }

  const stale = statusWorkflow(id, opts).advance;
  assert.equal(stale.running, false, 'a lock whose holder died is not a live advance');
  assert.equal(stale.pid, null);
  assert.match(stale.hint, /not running/);
  assert.ok(stale.hint.includes(`fgos workflow resume ${id}`));
  assert.deepEqual(stale.lastLines, ['Error: spawn failed'], 'whatever the dead child printed stays readable');

  // A live holder means the run is being advanced, however old the last event.
  const held = holdAdvanceHere(tmp, id);
  const live = statusWorkflow(id, opts).advance;
  held.release();
  assert.equal(live.running, true);
  assert.equal(live.hint, undefined);
});

test('status shows no log tail for a completed run', async () => {
  const tmp = setupTestRepo();
  const state = await startWorkflow({
    workflow: validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] }),
    repoRoot: tmp,
    cwd: tmp,
  });
  assert.equal(state.status, 'completed');
  writeRunLog(tmp, state.workflowRunId, 'step only completed\n');
  const advance = statusWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp }).advance;
  assert.equal(advance.lastLines, undefined);
  assert.equal(advance.hint, undefined);
});

test('a foreground advance writes no log file; an explicit onLog receives the progress lines', async () => {
  const tmp = setupTestRepo();
  const lines = [];
  const state = await startWorkflow({
    workflow: validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] }),
    repoRoot: tmp,
    cwd: tmp,
    onLog: (line) => lines.push(line),
  });
  assert.equal(state.status, 'completed');
  assert.equal(lines.length, 2, 'one line when the step starts and one when it ends');
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs', state.workflowRunId, 'advance.log')), false);
});
