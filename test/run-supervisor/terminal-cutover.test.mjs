// The controller half of a terminal attempt, through the real door (`executeAssignment`), a real host
// binary (supervisor, gate, step runner) and a fake herdr that keeps one real pane: what the controller
// prepares, what the envelope carries, and that a herdr-spawn seat is judged by the supervisor.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createTerminalProject, noHost, readJson, waitUntil } from './support/terminal-harness.mjs';

const projects = [];
after(() => { for (const project of projects) project.stop(); });
const newProject = async (name) => { const project = await createTerminalProject({ name }); projects.push(project); return project; };

/** Drive one attempt to its end the way a person-less CLI would: brief typed, taken, result written, agent leaves. */
async function finishAttempt(project, run) {
  const brief = await project.waitBriefTyped();
  project.briefTaken();
  const resultPath = project.writeResult(brief);
  await waitUntil(() => project.sent().some((s) => s.kind === 'prompt' && s.text === '/exit'), { what: 'the exit command typed after the result' });
  project.letAgentExit();
  const exit = await Promise.race([run.exited, waitUntil(() => false, { timeoutMs: 90_000, what: 'the controller to settle' })]);
  return { brief, resultPath, exit };
}

test('a herdr-spawn seat runs as a terminal attempt: brief typed by the supervisor, pane closed once, settled by the step', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('life');
  const run = project.startController();
  const { brief, exit } = await finishAttempt(project, run);
  assert.equal(exit.code, 0, JSON.stringify(run.output()));
  const answer = run.answer();
  assert.equal(answer?.ok, true, JSON.stringify(run.output()));
  assert.equal(answer.result.classification.execution.status, 'completed');
  assert.equal(answer.result.classification.outcome.reason, 'completed-pass');
  assert.equal(answer.result.adapter, 'herdr-spawn');

  const attemptDir = project.attemptDir();
  const envelope = readJson(path.join(attemptDir, 'envelope.json'));
  assert.equal(envelope.mode, 'terminal');
  assert.equal(envelope.slot.key, envelope.attemptId);
  assert.equal(envelope.agentProtocol.cli, 'claude');
  assert.deepEqual(envelope.steps.map((s) => s.stepId), ['settle-attempt', 'finalize-home', 'cleanup-trust', 'release-slot']);
  assert.equal(envelope.identity.writerId, `att-${envelope.attemptId}`);
  assert.equal(envelope.launch.briefPath, path.join(attemptDir, 'brief-1.md'));
  assert.equal(fs.readFileSync(envelope.launch.briefPath, 'utf8').trim(), brief.trim());

  assert.equal(project.callsStarting('pane close').length, 1, 'exactly one pane close');
  assert.equal(project.callsStarting('tab close').length, 0, 'no tab is ever closed');
  assert.equal(readJson(path.join(attemptDir, 'steps', 'release-slot.json'))?.detail?.disposition, 'close');
  assert.equal(fs.existsSync(path.join(attemptDir, 'controller', 'commands')), false, 'no launch-command record of the old herdr door');
});
