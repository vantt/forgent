// A seat whose brief never reached its agent (the pane's foreground never became the agent, so the
// attempt settles `abandoned-not-started`) is launched once more on the same candidate inside the same
// `fgos run`, unless it is a writing seat that changed the worktree meanwhile; a second lost brief ends
// the seat. A real host, the real door, and a fake herdr whose pane can report no agent process.
import '../../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bwrapUsable, createTerminalProject, noHost, readJson, waitUntil } from '../../run-supervisor/support/terminal-harness.mjs';

const projects = [];
after(() => { for (const project of projects) project.stop(); });
const newProject = async (name) => {
  const project = await createTerminalProject({ name, confined: true });
  projects.push(project);
  return project;
};
const SKIP = noHost || (!bwrapUsable() && 'bwrap with a pid namespace is not usable here');

const firstAttemptDir = (project) => project.attemptDirs().find((dir) => dir.endsWith(path.join('producer', '1', 'runs', '01')));
const firstReceipt = (project) => { const dir = firstAttemptDir(project); return dir ? readJson(path.join(dir, 'receipt.json')) : null; };
const answerOf = (run) => { try { return JSON.parse(run.output().stdout); } catch { return null; } };
const attemptsOf = (project, answer) => readJson(path.join(project.repoDir, '.fgos', 'assignments', answer.data.unitRunId, 'unit.json')).bindings['producer/1'];
const tabsOpened = (project) => project.callsStarting('tab create').length;

/** Play the healthy attempt: brief taken, result claimed, agent leaves. */
async function finishHealthyAttempt(project) {
  const brief = await project.waitBriefTyped();
  project.briefTaken();
  const resultPath = /(\S*outbox\/result-1\.json)/.exec(brief)?.[1];
  assert.ok(resultPath, brief);
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(path.join(path.dirname(resultPath), 'report-1.md'), '# Report\nThe docs were inspected in full and every finding is written down here.\n');
  fs.writeFileSync(`${resultPath}.tmp`, JSON.stringify({ status: 'done', summary: 'done', assessment: { verdict: 'pass' } }));
  fs.renameSync(`${resultPath}.tmp`, resultPath);
  await waitUntil(() => project.sent().some((s) => s.kind === 'prompt' && s.text === '/exit'), { what: 'the exit command' });
  project.letAgentExit();
}

test('a seat whose brief never reached its agent runs once more on the same candidate and the unit passes', { skip: SKIP, timeout: 300_000 }, async () => {
  const project = await newProject('bnd1');
  project.setFlag('no-process');
  const run = project.startFgosRun({ executorIds: ['alpha', 'beta'] });
  await waitUntil(() => firstReceipt(project)?.outcome === 'abandoned-not-started', { timeoutMs: 180_000, what: 'the first attempt settled as never started' });
  project.setFlag('no-process', false);
  await finishHealthyAttempt(project);
  const exit = await run.exited;
  assert.equal(exit.code, 0, run.output().stderr.slice(-1500) + run.output().stdout.slice(-800));
  const answer = answerOf(run);
  assert.equal(answer.data.outcome, 'pass', JSON.stringify(answer).slice(0, 1500));
  const attempts = attemptsOf(project, answer);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome, a.briefNotDelivered === true]), [['alpha', 'execution-failure', true], ['alpha', 'pass', false]]);
  assert.equal(attempts[1].fallbackFrom.kind, 'brief-not-delivered');
  assert.equal(tabsOpened(project), 2, 'the second launch got a pane of its own');
});

test('a writing seat that changed the worktree while its brief was lost is not launched again', { skip: SKIP, timeout: 300_000 }, async () => {
  const project = await newProject('bndw');
  project.addWorktree();
  project.setFlag('no-process');
  const run = project.startFgosRun({ executorIds: ['alpha'], unit: { writes: ['probe-worktree.txt'] }, worktree: project.worktreeDir });
  await waitUntil(() => firstAttemptDir(project), { timeoutMs: 120_000, what: 'the first attempt started' });
  fs.writeFileSync(path.join(project.worktreeDir, 'probe-worktree.txt'), 'written while the brief was lost\n');
  const exit = await run.exited;
  assert.notEqual(exit.code, 0, 'a lost brief over changed work is not a pass');
  const answer = answerOf(run);
  const last = answer.data.results.at(-1);
  assert.equal(last.outcome, 'execution-failure', JSON.stringify(answer).slice(0, 1500));
  assert.equal(last.fallbackExhausted.reason, 'partial-writes');
  assert.deepEqual(last.fallbackExhausted.paths, ['probe-worktree.txt']);
  const attempts = attemptsOf(project, answer);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].briefNotDelivered, true);
  assert.equal(attempts[0].retryStopped.reason, 'partial-writes');
  assert.equal(tabsOpened(project), 1);
});

test('a brief lost twice in a row ends the seat as an execution failure', { skip: SKIP, timeout: 360_000 }, async () => {
  const project = await newProject('bnd2');
  project.setFlag('no-process');
  const run = project.startFgosRun({ executorIds: ['alpha', 'beta'] });
  const exit = await run.exited;
  assert.notEqual(exit.code, 0);
  const answer = answerOf(run);
  assert.equal(answer.data.outcome, 'execution-failure', JSON.stringify(answer).slice(0, 1500));
  assert.equal(answer.data.results.at(-1).fallbackExhausted.reason, 'brief-not-delivered');
  const attempts = attemptsOf(project, answer);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.briefNotDelivered === true]), [['alpha', true], ['alpha', true]]);
  assert.equal(tabsOpened(project), 2, 'no third launch');
});
