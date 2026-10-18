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

test('the agent runs as the attempt: its writer id is minted from the attempt, the controller\'s session ids and pane variables never reach it', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('ident');
  const run = project.startController({ env: { CLAUDE_CODE_SESSION_ID: 'parent-session', CODEX_THREAD_ID: 'parent-thread', HERDR_PANE_ID: 'cockpit:p1', TERM: 'xterm-256color' } });
  const { exit } = await finishAttempt(project, run);
  assert.equal(exit.code, 0, JSON.stringify(run.output()));

  const envelope = readJson(path.join(project.attemptDir(), 'envelope.json'));
  const agent = project.agentEnv();
  assert.equal(agent.env.FGOS_SESSION_ID, `att-${envelope.attemptId}`);
  assert.equal(agent.env.FGOS_SESSION_ID, envelope.identity.writerId);
  assert.ok(envelope.identity.parentWriterId, 'the controller\'s own writer id is the lineage');
  assert.equal(agent.env.FGOS_PARENT_WRITER_ID, envelope.identity.parentWriterId);
  assert.equal(agent.env.CLAUDE_CODE_SESSION_ID, null);
  assert.equal(agent.env.CODEX_THREAD_ID, null);
  // The pane sets its own terminal and herdr variables; the controller's must not travel in the envelope or the side file.
  const side = readJson(envelope.sideFile) ?? { env: {} };
  for (const env of [envelope.launch.env, side.env]) {
    assert.deepEqual(Object.keys(env).filter((name) => name === 'TERM' || name.startsWith('HERDR_')), []);
  }
});

test('codex gets the attempt writer id as an explicit setting of its argv, the other CLIs inherit the environment', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('codex');
  const run = project.startController({ executor: project.executor({ kind: 'codex', commandName: 'codex' }), timeoutMs: 20_000 });
  await project.waitBriefTyped();
  const agent = await waitUntil(() => project.agentEnv(), { what: 'the agent to start' });
  const envelope = readJson(path.join(project.attemptDir(), 'envelope.json'));
  assert.equal(envelope.agentProtocol.cli, 'codex');
  const at = agent.argv.indexOf('-c');
  assert.ok(at >= 0, `argv: ${agent.argv.join(' ')}`);
  assert.equal(agent.argv[at + 1], `shell_environment_policy.set={FGOS_SESSION_ID="att-${envelope.attemptId}"}`);
  assert.ok(!agent.argv.some((arg) => arg.includes('Brief')), 'the prompt is typed at the agent, never an argument');
  project.letAgentExit();
  await run.exited;
});

test('an agent that never started settles as a failed attempt with a named reason and keeps its pane', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('never');
  project.setFlag('no-process');
  const run = project.startController();
  const exit = await run.exited;
  assert.equal(exit.code, 0, JSON.stringify(run.output()));
  const { result } = run.answer();
  assert.equal(result.classification.execution.status, 'failed');
  assert.match(result.runnerNote.summary, /abandoned-not-started: the agent never received its brief/);
  const dir = project.attemptDir();
  assert.equal(readJson(path.join(dir, 'receipt.json')).outcome, 'abandoned-not-started');
  assert.equal(readJson(path.join(dir, 'steps', 'release-slot.json')).detail.disposition, 'retain');
  assert.equal(project.callsStarting('pane close').length, 0);
  assert.equal(project.agentStarts().length, 0, 'no agent ran');
});
