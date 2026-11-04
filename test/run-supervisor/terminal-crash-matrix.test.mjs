// What survives the death of a terminal attempt's controller or supervisor, on a fake herdr that keeps one
// real pane and a real host (supervisor, gate, step runner, adopt). The controller is its own process
// and the test kills it after the binding, the way a crash would; the fake's files stand for the screen.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createTerminalProject, noHost, readJson, waitUntil } from './support/terminal-harness.mjs';

const projects = [];
after(() => { for (const project of projects) project.stop(); });
const newProject = async (name) => { const project = await createTerminalProject({ name }); projects.push(project); return project; };

const file = (...parts) => path.join(...parts);

/** The attempt directory once the supervisor has bound the attempt, and the binding. */
async function bound(project, run) {
  try {
    const dir = await waitUntil(() => project.attemptDir(), { what: 'the attempt directory' });
    const binding = await waitUntil(() => readJson(file(dir, 'supervisor-binding.json')), { what: 'the supervisor binding' });
    return { dir, binding };
  } catch (err) {
    const dir = project.attemptDir();
    let log = '';
    try { log = fs.readFileSync(file(dir, 'supervisor.log'), 'utf8'); } catch { /* none */ }
    throw new Error(`${err.message}\ncontroller: ${JSON.stringify(run.output()).slice(0, 1500)}\nsupervisor.log: ${log.slice(0, 1500)}\nherdr calls: ${project.calls().join(' | ').slice(0, 800)}`);
  }
}

const stepReceipt = (dir, id) => readJson(file(dir, 'steps', `${id}.json`));

test('1. a controller killed with SIGKILL after the binding: the supervisor briefs the agent, the result settles, the pane closes', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('c1');
  const run = project.startController();
  const { dir } = await bound(project, run);
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
