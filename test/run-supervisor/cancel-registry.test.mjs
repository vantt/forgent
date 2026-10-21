// Ctrl-C of a controller (r6 §16): the supervisor of every delivered attempt is asked to cancel, the
// controller waits for the receipts and leaves with 130 / 143. Real controller process, real supervisor,
// real sandbox; the agent is fixtures/direct-agent.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { RunCancelledError, assertNotCancelled, beginLaunch, endLaunch, installCancelOnSignal, register, registeredRuns, requestCancel, resetCancelRequest, unregister } from '../../src/run-supervisor/cancel-registry.mjs';
import { readCancelWaitMs } from '../../src/run-supervisor/gate-kill-grace.mjs';
import { bwrapUsable, createProject, readJson, sleep, waitUntil } from './support/direct-harness.mjs';

seedFileLocalBwrapRegistry();

const skip = !bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine';
const FGOS_CLI = path.resolve('bin/fgos.mjs');
const here = (dir, name) => path.join(dir, name);
const exists = (dir, name) => fs.existsSync(here(dir, name));

// The real CLI is the controller: it asks for the signal handling itself, the wait is the configured one.
function startController(project, unitFile) {
  const child = spawn(process.execPath, [FGOS_CLI, 'run', '--unit', unitFile, '--dir', project.repoDir], {
    cwd: project.repoDir, env: project.env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return { child, exited, stderr: () => stderr };
}

// The agent runs: the controller saw the binding long ago and has the attempt registered.
const boundAttempt = (project) => waitUntil(() => project.attemptDirs().find((d) => exists(d, 'agent-binding.json')), { timeoutMs: 120_000, what: 'the agent to start' });

test('registry keeps the delivered runs, once each', () => {
  const dir = makeFixtureDir('cancel-registry-');
  register(dir); register(dir);
  assert.deepEqual(registeredRuns(), [path.resolve(dir)]);
  unregister(dir);
  assert.deepEqual(registeredRuns(), []);
});

test('the cancel wait defaults to the kill grace plus five seconds and refuses a value below one second', () => {
  const root = makeFixtureDir('cancel-wait-');
  const write = (dispatch) => { fs.mkdirSync(path.join(root, '.fgos'), { recursive: true }); fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ dispatch })); };
  write({});
  assert.equal(readCancelWaitMs({ projectRoot: root }), 15_000);
  write({ gateKillGraceMs: 2000 });
  assert.equal(readCancelWaitMs({ projectRoot: root }), 7000);
  write({ cancelWaitMs: 3000 });
  assert.equal(readCancelWaitMs({ projectRoot: root }), 3000);
  write({ cancelWaitMs: 10 });
  assert.throws(() => readCancelWaitMs({ projectRoot: root }), /cancelWaitMs/);
});

test('a request names who asked and stands once written', () => {
  const dir = makeFixtureDir('cancel-request-');
  assert.equal(requestCancel(dir, 'SIGINT'), false, 'no envelope, no request');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ attemptId: 'att-1', unitRunId: 'unit-1' }));
  assert.equal(requestCancel(dir, 'SIGINT'), true);
  assert.equal(requestCancel(dir, 'SIGTERM'), true);
  const file = readJson(path.join(dir, 'cancel-requested.json'));
  assert.equal(file.attemptId, 'att-1');
  assert.equal(file.by, 'signal:SIGINT', 'the first request stands');
  assert.equal(file.requester.pid, process.pid);
  assert.equal(file.v, 1);
  assert.match(file.requestedBy, /controller pid/);
});

// The supervisor compares the requester's pidNs with its own, which it reads in the namespace
// form (`pid:[N]` on Linux, `none` where there are none); a bare inode number never matches it.
test("the cancel request's self tuple uses the pidNs form the supervisor compares (pid:[N] on Linux, none elsewhere)", () => {
  const dir = makeFixtureDir('cancel-request-pidns-');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ attemptId: 'att-1', unitRunId: 'unit-1' }));
  assert.equal(requestCancel(dir, 'SIGINT'), true);
  const { requester } = readJson(path.join(dir, 'cancel-requested.json'));
  const expected = process.platform === 'linux' ? fs.readlinkSync('/proc/self/ns/pid') : 'none';
  assert.equal(requester.pidNs, expected);
});

test('1. SIGINT after the binding: cancel request, receipt cancelled, the resume line, exit 130 within the wait', { skip, timeout: 240_000 }, async () => {
  const project = createProject({ agent: { runMs: 120_000 }, timeoutMs: 180_000, dispatch: { gateKillGraceMs: 1000 } });
  const run = startController(project, project.unitFile('cancel-sigint'));
  const dir = await boundAttempt(project);
  run.child.kill('SIGINT');
  const { code } = await run.exited;
  assert.equal(code, 130, run.stderr());
  assert.ok(exists(dir, 'cancel-requested.json'));
  assert.equal(readJson(here(dir, 'cancel-requested.json')).by, 'signal:SIGINT');
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'cancelled');
  assert.match(run.stderr(), /chờ resume: fgos run --resume \S+/);
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 60_000, what: 'the attempt to close' });
});

test('2. a second SIGINT within 100 ms ends the controller at once and the attempt still ends cancelled', { skip, timeout: 240_000 }, async () => {
  const project = createProject({ agent: { runMs: 120_000 }, timeoutMs: 180_000, dispatch: { gateKillGraceMs: 1000 } });
  const run = startController(project, project.unitFile('cancel-twice'));
  const dir = await boundAttempt(project);
  run.child.kill('SIGINT');
  await sleep(100);
  run.child.kill('SIGINT');
  const { code } = await run.exited;
  assert.equal(code, 130);
  assert.ok(exists(dir, 'cancel-requested.json'), 'the request was written before the controller left');
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 90_000, what: 'the attempt to close without its controller' });
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'cancelled');
});

test('3. SIGTERM exits 143', { skip, timeout: 240_000 }, async () => {
  const project = createProject({ agent: { runMs: 120_000 }, timeoutMs: 180_000, dispatch: { gateKillGraceMs: 1000 } });
  const run = startController(project, project.unitFile('cancel-sigterm'));
  const dir = await boundAttempt(project);
  run.child.kill('SIGTERM');
  const { code } = await run.exited;
  assert.equal(code, 143, run.stderr());
  assert.equal(readJson(here(dir, 'cancel-requested.json')).by, 'signal:SIGTERM');
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'cancelled');
});

test('4. a signal with nothing handed over writes no cancel file and leaves at once', async () => {
  const dir = makeFixtureDir('cancel-before-binding-');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ attemptId: 'att-early', unitRunId: 'unit-early' }));
  // Nothing is registered for this attempt, which is the state until the supervisor binds it.
  const exits = [];
  const uninstall = installCancelOnSignal({ cancelWaitMs: 1000, exit: (code) => exits.push(code), stderr: { write() {} } });
  try {
    process.emit('SIGINT');
    await waitUntil(() => exits.length > 0, { timeoutMs: 5000, what: 'the exit' });
  } finally {
    uninstall();
    resetCancelRequest();
  }
  assert.deepEqual(exits, [130]);
  assert.equal(exists(dir, 'cancel-requested.json'), false);
});

/** Installs the handlers with a stand-in exit, sends a signal, and always puts the process back as it was. */
async function withSignalHandlers(fn, { cancelWaitMs = 2000 } = {}) {
  const exits = [];
  let stderr = '';
  const uninstall = installCancelOnSignal({ cancelWaitMs, exit: (code) => exits.push(code), stderr: { write: (text) => { stderr += text; } } });
  try {
    await fn({ exits, stderr: () => stderr });
  } finally {
    uninstall();
    resetCancelRequest();
    for (const dir of registeredRuns()) unregister(dir);
  }
}

const attemptWithEnvelope = (name, unitRunId) => {
  const dir = makeFixtureDir(`cancel-${name}-`);
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ attemptId: `att-${name}`, unitRunId }));
  return dir;
};

test('5. a signal while an attempt is handed over waits for its binding, then cancels it and names the unit', async () => {
  const dir = attemptWithEnvelope('handover', 'unit-handover');
  await withSignalHandlers(async ({ exits, stderr }) => {
    beginLaunch(dir);
    process.emit('SIGINT');
    await sleep(300);
    assert.deepEqual(exits, [], 'the controller keeps waiting while the binding is unknown');
    register(dir);
    endLaunch(dir);
    await waitUntil(() => exists(dir, 'cancel-requested.json'), { timeoutMs: 5000, what: 'the cancel request of the bound attempt' });
    assert.equal(readJson(here(dir, 'cancel-requested.json')).by, 'signal:SIGINT');
    assert.deepEqual(exits, [], 'and for the receipt');
    fs.writeFileSync(here(dir, 'receipt.json'), JSON.stringify({ outcome: 'cancelled' }));
    await waitUntil(() => exits.length > 0, { timeoutMs: 5000, what: 'the exit' });
    assert.deepEqual(exits, [130]);
    assert.match(stderr(), /unit unit-handover chờ resume: fgos run --resume unit-handover/);
  });
});

test('6. a launch that fails before any binding ends the wait and still prints the resume line', async () => {
  const dir = attemptWithEnvelope('failed-launch', 'unit-failed-launch');
  await withSignalHandlers(async ({ exits, stderr }) => {
    beginLaunch(dir);
    process.emit('SIGTERM');
    await sleep(150);
    endLaunch(dir);
    await waitUntil(() => exits.length > 0, { timeoutMs: 5000, what: 'the exit' });
    assert.deepEqual(exits, [143]);
    assert.match(stderr(), /unit unit-failed-launch chờ resume/);
    assert.equal(exists(dir, 'cancel-requested.json'), false, 'nothing was bound, nothing to cancel');
  });
});

test('7. after a signal no launch and no step starts', async () => {
  const dir = attemptWithEnvelope('refused', 'unit-refused');
  await withSignalHandlers(async ({ exits }) => {
    assert.doesNotThrow(assertNotCancelled);
    process.emit('SIGINT');
    await waitUntil(() => exits.length > 0, { timeoutMs: 5000, what: 'the exit' });
    assert.throws(assertNotCancelled, RunCancelledError);
    assert.throws(() => beginLaunch(dir), { code: 'run-cancelled', signal: 'SIGINT' });
  });
  assert.doesNotThrow(assertNotCancelled, 'a host that outlives its controller can clear the request');
});
