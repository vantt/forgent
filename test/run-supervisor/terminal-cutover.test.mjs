// The controller half of a terminal attempt, through the real door (`executeAssignment`), a real host
// binary (supervisor, gate, step runner) and a fake herdr that keeps one real pane: what the controller
// prepares, what the envelope carries, and that a herdr-spawn seat is judged by the supervisor.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bwrapUsable, createTerminalProject, noHost, readJson, waitUntil } from './support/terminal-harness.mjs';

const projects = [];
after(() => { for (const project of projects) project.stop(); });
const newProject = async (name, options = {}) => { const project = await createTerminalProject({ name, ...options }); projects.push(project); return project; };

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
  assert.equal(envelope.terminal.retainFailedPaneMs, null, 'the configured retain window travels with the attempt (the default keeps a genuine crash pane until a person closes it)');
  assert.equal(envelope.agentProtocol.cli, 'claude');
  assert.deepEqual(envelope.steps.map((s) => s.stepId), ['settle-attempt', 'finalize-home', 'cleanup-trust', 'release-slot']);
  assert.equal(envelope.identity.writerId, `att-${envelope.attemptId}`);
  assert.equal(envelope.deadlines.idleMs, 300_000, 'an attempt has an idle limit even when the runner config sets none');
  assert.equal(envelope.launch.briefPath, path.join(attemptDir, 'brief-1.md'));
  assert.equal(fs.readFileSync(envelope.launch.briefPath, 'utf8').trim(), brief.trim());

  // A claude REPL is given the run directory as a working directory, the one place its brief lives.
  const argv = project.agentEnv().argv;
  assert.equal(argv[argv.indexOf('--add-dir') + 1], attemptDir);
  assert.equal(argv.filter((arg) => arg === '--add-dir').length, 1, 'only the run directory is added');
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
  assert.equal(agent.argv.includes('--add-dir'), false, 'only a claude REPL is given the run directory');
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

test('a pane stopped on the provider\'s own limit screen settles as a provider limit, not as a person to wait for', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('limit');
  project.setVerdict('blocked');
  project.setScreen("■ You've hit your usage limit. Upgrade to Pro or try again at 11:40 PM.\n");
  const run = project.startController();
  const exit = await run.exited;
  assert.equal(exit.code, 0, JSON.stringify(run.output()));
  const { result } = run.answer();
  assert.equal(result.classification.failure.code, 'provider-limit', JSON.stringify(result.classification));
  assert.equal(result.classification.failure.family, 'provider');
  assert.equal(readJson(path.join(project.attemptDir(), 'steps', 'release-slot.json')).detail.disposition, 'close', 'the stopped worker output is captured');
});

test('an agent stopped on a trust prompt ends as blocked, not as a timeout, and the failure names the screen and the repair', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('trustprompt');
  project.setVerdict('blocked');
  project.setScreen('  Trust this folder? Codex can read, edit, and run files here.\n› 1. Trust and continue\n  2. Back to Agent Command Center\n');
  const run = project.startController();
  assert.equal((await run.exited).code, 0, JSON.stringify(run.output()));
  const { result } = run.answer();
  assert.equal(result.classification.failure.code, 'blocked');
  assert.equal(result.classification.outcome.category, 'blocked');
  assert.match(result.runnerNote.summary, /Back to Agent Command Center/);
  assert.match(result.runnerNote.summary, /grant trust for this project in the agent's own home/);
  assert.equal(project.callsStarting('pane close').length, 1, 'the stopped trust-prompt worker has captured output');
  assert.equal(project.callsStarting('tab create').length, 1, 'no second candidate was tried');
});

test('an executor declared by invocations[] runs the same way as one declared flat', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('invocations');
  const { command, args, env, interactiveMode } = project.executor({ commandName: 'claude' });
  const run = project.startController({ modelPolicies: { [command]: { standard: 'sonnet' } }, executor: { kind: 'agent', allowCrossProvider: true, invocations: [{ id: 'seat-herdr', via: 'cli', adapter: 'herdr-spawn', command, args, env, interactiveMode }] } });
  const { exit } = await finishAttempt(project, run);
  assert.equal(exit.code, 0, JSON.stringify(run.output()));
  assert.equal(run.answer().result.classification.outcome.reason, 'completed-pass');
  assert.equal(readJson(path.join(project.attemptDir(), 'envelope.json')).mode, 'terminal');
});

test('the brief the pane agent reads names the one result path, the outbox claim', { skip: noHost, timeout: 180_000 }, async () => {
  const project = await newProject('briefcontract');
  const run = project.startController();
  const { brief, exit } = await finishAttempt(project, run);
  assert.equal(exit.code, 0, JSON.stringify(run.output()));
  assert.match(brief, /## Execution contract/);
  assert.match(brief, /- Result claim path: [^\n]*outbox[/\\]result-1\.json/);
  assert.equal(brief.includes('agent-result.json'), false, 'no second, conflicting result path');
  const contract = readJson(path.join(project.attemptDir(), 'effective-execution-contract.json'));
  assert.match(contract.resultClaim?.path ?? '', /outbox[/\\]result-1\.json/, 'the persisted contract agrees with the brief');
});

test('fgos run with herdr present runs a confined read-only unit in a pane: the gate is inside the sandbox, its own socket is bound in, the agent has a pid namespace of its own', { skip: noHost || (!bwrapUsable() && 'bwrap with a pid namespace is not usable here'), timeout: 240_000 }, async () => {
  const project = await newProject('confined', { confined: true });
  const run = project.startFgosRun();
  const brief = await project.waitBriefTyped();
  project.briefTaken();
  // The agent's notes live in its private home, which goes with the attempt: read them while it runs.
  const agent = await waitUntil(() => project.agentEnv(), { what: 'the confined agent to start' });
  // A read-only unit's result claim lives in the outbox; the agent plays by writing it from outside.
  const resultPath = /(\S*outbox\/result-1\.json)/.exec(brief)?.[1];
  assert.ok(resultPath, brief);
  // A read-only operation is not done without its report; the claim comes last because it ends the round.
  fs.writeFileSync(path.join(path.dirname(resultPath), 'report-1.md'), '# Report\nThe assigned work was inspected and completed with a full explanation of what was checked.\n');
  fs.writeFileSync(`${resultPath}.tmp`, JSON.stringify({ status: 'done', summary: 'inspected', assessment: { verdict: 'pass' } }));
  fs.renameSync(`${resultPath}.tmp`, resultPath);
  await waitUntil(() => project.sent().some((s) => s.kind === 'prompt' && s.text === '/exit'), { what: 'the exit command' });
  project.letAgentExit();
  const exit = await run.exited;
  assert.equal(exit.code, 0, run.output().stderr.slice(-1500) + run.output().stdout.slice(-800));

  const envelope = readJson(path.join(project.attemptDir(), 'envelope.json'));
  assert.equal(envelope.mode, 'terminal');
  assert.equal(envelope.containment.preferred, 'linux-gate');
  const prefix = envelope.containment.bwrapPrefix;
  assert.ok(prefix.includes('--die-with-parent'), 'in a pane the sandbox goes with the pane');
  assert.ok(prefix.some((arg, i) => arg === '--ro-bind' && prefix[i + 1] === envelope.terminal.socketPath), 'the attempt\'s own GO socket is bound into the sandbox');
  assert.equal(prefix.includes(path.dirname(envelope.terminal.socketPath)), false, 'never the socket directory, which holds every attempt\'s socket');
  assert.ok(agent.pid < 100, `the agent runs in a namespace of its own (pid ${agent.pid})`);
  assert.equal(agent.env.FGOS_SESSION_ID, envelope.identity.writerId);
  assert.equal(project.callsStarting('pane close').length, 1);
  const result = readJson(path.join(project.attemptDir(), 'result.json'));
  assert.equal(result.adapter, 'herdr-spawn');
  assert.equal(result.classification.outcome.reason, 'completed-pass', JSON.stringify(result.classification));
});
