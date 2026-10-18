// Ctrl-C of a controller (r6 §16): the supervisor of every delivered attempt is asked to cancel, the
// controller waits for the receipts and leaves with 130 / 143. Real controller process, real supervisor,
// real sandbox; the agent is fixtures/direct-agent.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { installCancelOnSignal, readCancelWaitMs, register, registeredRuns, requestCancel, unregister } from '../../src/run-supervisor/cancel-registry.mjs';
import { bwrapUsable, createProject, readJson, sleep, waitUntil } from './support/direct-harness.mjs';

seedFileLocalBwrapRegistry();

const skip = !bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine';
const CONTROLLER = path.resolve('test/run-supervisor/fixtures/cancel-controller.mjs');
const here = (dir, name) => path.join(dir, name);
const exists = (dir, name) => fs.existsSync(here(dir, name));

function startController(project, unitFile, { cancelWaitMs = 60_000 } = {}) {
  const child = spawn(process.execPath, [CONTROLLER, 'run', '--unit', unitFile, '--dir', project.repoDir], {
    cwd: project.repoDir, env: { ...project.env, CANCEL_WAIT_MS: String(cancelWaitMs) }, stdio: ['ignore', 'pipe', 'pipe'],
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

test('4. a signal before any binding writes no cancel file: the controller still holds the attempt lock and dying is enough', async () => {
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
  }
  assert.deepEqual(exits, [130]);
  assert.equal(exists(dir, 'cancel-requested.json'), false);
});
