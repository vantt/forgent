// What survives the death of a terminal attempt's controller or supervisor, on a fake herdr that keeps one
// real pane and a real host (supervisor, gate, step runner, adopt). The controller is its own process
// and the test kills it after the binding, the way a crash would; the fake's files stand for the screen.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { adoptRun } from '../../src/run-supervisor/client.mjs';
import { createTerminalProject, noHost, readJson, sleep, waitUntil } from './support/terminal-harness.mjs';

const projects = [];
after(() => { for (const project of projects) project.stop(); });
const newProject = async (name) => { const project = await createTerminalProject({ name }); projects.push(project); return project; };

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; } };
const file = (...parts) => path.join(...parts);

/** The attempt directory once the supervisor has bound the attempt, and the binding. */
async function bound(project) {
  const dir = await waitUntil(() => project.attemptDir(), { what: 'the attempt directory' });
  const binding = await waitUntil(() => readJson(file(dir, 'supervisor-binding.json')), { what: 'the supervisor binding' });
  return { dir, binding };
}

const stepReceipt = (dir, id) => readJson(file(dir, 'steps', `${id}.json`));

test('1. a controller killed with SIGKILL after the binding: the supervisor briefs the agent, the result settles, the pane closes', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('c1');
  const run = project.startController();
  const { dir } = await bound(project);
  run.child.kill('SIGKILL');
  await run.exited;

  const brief = await project.waitBriefTyped();
  project.briefTaken();
  project.writeResult(brief);
  await waitUntil(() => project.sent().some((s) => s.kind === 'prompt' && s.text === '/exit'), { what: 'the exit command' });
  project.letAgentExit();
  await waitUntil(() => readJson(file(dir, 'closed.json')), { what: 'the attempt to close' });

  const result = readJson(file(dir, 'result.json'));
  assert.equal(result?.classification?.outcome?.reason, 'completed-pass', 'the result settles without any controller');
  for (const id of ['settle-attempt', 'finalize-home', 'cleanup-trust', 'release-slot']) assert.ok(stepReceipt(dir, id), `${id} has its receipt`);
  assert.equal(stepReceipt(dir, 'release-slot').detail.disposition, 'close');
  assert.equal(project.callsStarting('pane close').length, 1, 'the pane is closed exactly once');
  assert.equal(readJson(file(dir, 'receipt.json')).outcome, 'exited');
});

test('2. the soft deadline passes after the controller died: the agent is stopped, the receipt says timeout and the pane stays', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('c2');
  const run = project.startController({ timeoutMs: 9_000 });
  const { dir } = await bound(project);
  run.child.kill('SIGKILL');
  await run.exited;

  await project.waitBriefTyped();
  project.briefTaken();
  const [agent] = await waitUntil(() => (project.agentStarts().length ? project.agentStarts() : null), { what: 'the agent to start' });
  await waitUntil(() => readJson(file(dir, 'closed.json')), { timeoutMs: 120_000, what: 'the attempt to close after its deadline' });

  const receipt = readJson(file(dir, 'receipt.json'));
  assert.equal(receipt.outcome, 'timeout');
  assert.equal(readJson(file(dir, 'gate-exit.json')).stoppedBy, 'soft-deadline');
  await waitUntil(() => !alive(agent), { what: 'the agent to be gone' });
  assert.equal(stepReceipt(dir, 'release-slot').detail.disposition, 'retain', 'the screen of a failed attempt is kept');
  assert.equal(project.callsStarting('pane close').length, 0, 'nothing closes the pane');
  assert.ok(readJson(file(dir, 'result.json')), 'the timeout is settled by the step, not by a controller');
});

test('3. a supervisor killed after the brief: the agent runs on, the gate ends the domain when the result shows, adopt settles and releases', { skip: noHost, timeout: 240_000 }, async () => {
  const project = await newProject('c3');
  const run = project.startController();
  const { dir, binding } = await bound(project);
  const brief = await project.waitBriefTyped();
  project.briefTaken();
  const [agent] = await waitUntil(() => (project.agentStarts().length ? project.agentStarts() : null), { what: 'the agent to start' });
  // The confirm loop looks once per poll; after this the brief is confirmed and delivery is on record.
  await sleep(4_000);
  process.kill(binding.supervisor.pid, 'SIGKILL');
  run.child.kill('SIGKILL');
  await run.exited;
  assert.ok(alive(agent), 'the agent outlives its supervisor');

  project.writeResult(brief);
  await waitUntil(() => readJson(file(dir, 'gate-exit.json')), { timeoutMs: 120_000, what: 'the orphaned gate to end the domain' });
  const exit = readJson(file(dir, 'gate-exit.json'));
  assert.equal(exit.stoppedBy, 'orphan');
  assert.equal(exit.cause, 'orphan-result');
  assert.equal(project.callsStarting('pane close').length, 0, 'nobody has released the slot yet');

  // Adopt runs in whatever process asks: it needs the same terminal-control state root and herdr server as
  // the supervisor had, which an operator's own environment gives it.
  const saved = { FGOS_STATE_ROOT: process.env.FGOS_STATE_ROOT, HERDR_SOCKET_PATH: process.env.HERDR_SOCKET_PATH };
  process.env.FGOS_STATE_ROOT = project.stateRoot;
  process.env.HERDR_SOCKET_PATH = project.herdrSocket;
  let judged;
  try { judged = adoptRun(dir); } finally {
    for (const [name, value] of Object.entries(saved)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
  assert.ok(['closed', 'adopted'].includes(judged.state) || readJson(file(dir, 'closed.json')), JSON.stringify(judged));
  await waitUntil(() => readJson(file(dir, 'closed.json')), { what: 'adopt to close the attempt' });
  assert.equal(readJson(file(dir, 'result.json'))?.classification?.outcome?.reason, 'completed-pass');
  assert.equal(stepReceipt(dir, 'release-slot').detail.disposition, 'close');
  assert.equal(project.callsStarting('pane close').length, 1);
});

test('4. a controller that dies before it hands the attempt over leaves a pane the port can find and no running agent', { skip: noHost, timeout: 120_000 }, async () => {
  const project = await newProject('c4');
  const run = project.startController();
  // The pane is allocated before the supervisor exists; kill the controller as soon as it is.
  await waitUntil(() => project.callsStarting('tab create').length > 0, { what: 'the pane allocation' });
  run.child.kill('SIGKILL');
  await run.exited;
  await sleep(1_500);
  assert.equal(project.agentStarts().length, 0, 'no agent runs: nothing was handed over');
  assert.equal(project.callsStarting('pane close').length, 0, 'nobody closes the pane of a dead controller');
});
