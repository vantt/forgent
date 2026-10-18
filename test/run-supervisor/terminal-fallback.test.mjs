// What `fgos run` does when a seat in a pane stops on the provider's own limit screen: the role moves to the
// next candidate in a new pane and the stopped pane stays open for the person. The decision to move on is
// the run's (it does not depend on how an agent is launched); these tests prove the terminal attempt path
// feeds it: the attempt settles as `provider-limit`, the next candidate runs as its own attempt in its own
// pane, and the mutating gate still commits the fallback's work. A real host, the real door, and a fake
// herdr whose pane screens are scripted per started command.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bwrapUsable, createTerminalProject, noHost, readJson, waitUntil } from './support/terminal-harness.mjs';

const projects = [];
after(() => { for (const project of projects) project.stop(); });
const newProject = async (name) => {
  const project = await createTerminalProject({ name, confined: true });
  projects.push(project);
  return project;
};

const LIMIT_SCREEN = "■ You've hit your usage limit. Upgrade to Pro or try again at 11:40 PM.\n";
const SKIP = noHost || (!bwrapUsable() && 'bwrap with a pid namespace is not usable here');

/** The n-th started command stops on the limit screen; the commands after it are healthy. */
function limitOnRuns(project, runs) {
  for (const n of runs) {
    fs.writeFileSync(path.join(project.herdrDir, `explain.run${n}.json`), JSON.stringify({ agent: 'claude', state: 'blocked', visible_idle: false, visible_working: false, visible_blocker: true }));
    fs.writeFileSync(path.join(project.herdrDir, `screen.run${n}.txt`), LIMIT_SCREEN);
  }
}

/** Play the healthy candidate: brief taken, work done, result claimed, agent leaves. */
async function finishHealthyAttempt(project, { writes = false } = {}) {
  const brief = await project.waitBriefTyped();
  project.briefTaken();
  const resultPath = /(\S*outbox\/result-1\.json)/.exec(brief)?.[1];
  assert.ok(resultPath, brief);
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  if (writes) {
    assert.ok(project.worktreeDir, 'the writing attempt has a worktree');
    fs.writeFileSync(path.join(project.worktreeDir, 'probe-worktree.txt'), 'written by the fallback candidate\n');
  }
  fs.writeFileSync(path.join(path.dirname(resultPath), 'report-1.md'), '# Report\nThe assigned work was inspected and completed with a full explanation of what was checked.\n');
  fs.writeFileSync(`${resultPath}.tmp`, JSON.stringify({ status: 'done', summary: 'done', assessment: { verdict: 'pass' } }));
  fs.renameSync(`${resultPath}.tmp`, resultPath);
  await waitUntil(() => project.sent().some((s) => s.kind === 'prompt' && s.text === '/exit'), { what: 'the exit command' });
  project.letAgentExit();
}

/** The JSON envelope `fgos run` prints when it ends (the whole of stdout, pretty-printed). */
function answerOf(run) {
  try { return JSON.parse(run.output().stdout); } catch { return null; }
}

const unitRecord = (project, answer) => {
  const unitRunId = answer.data.unitRunId ?? answer.data.results?.[0]?.unitRunId;
  return readJson(path.join(project.repoDir, '.fgos', 'assignments', unitRunId, 'unit.json'));
};
const tabsOpened = (project) => project.callsStarting('tab create');

test('a limit screen moves the role to the next candidate in a new pane and keeps the stopped pane open', { skip: SKIP, timeout: 240_000 }, async () => {
  const project = await newProject('fb2');
  limitOnRuns(project, [1]);
  const run = project.startFgosRun({ executorIds: ['alpha', 'beta'] });
  await finishHealthyAttempt(project);
  const exit = await run.exited;
  assert.equal(exit.code, 0, run.output().stderr.slice(-1500) + run.output().stdout.slice(-800));
  const answer = answerOf(run);
  assert.equal(answer.data.outcome ?? answer.data.results?.at(-1)?.outcome, 'pass', JSON.stringify(answer).slice(0, 1500));

  const attempts = unitRecord(project, answer).bindings['producer/1'];
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.executor, 'alpha');
  assert.equal(attempts[1].binding.transport, 'herdr');
  assert.equal(tabsOpened(project).length, 2, 'the next candidate got a pane of its own');
  assert.equal(project.callsStarting('pane close').length, 1, 'only the finished attempt closed its pane; the limited one stays for the person');
  const limited = project.attemptDirs().find((dir) => dir.endsWith(path.join('producer', '1', 'runs', '01')));
  assert.ok(limited, project.attemptDirs().join('\n'));
  assert.equal(readJson(path.join(limited, 'steps', 'release-slot.json')).detail.disposition, 'retain');
  assert.equal(readJson(path.join(limited, 'result.json')).classification.failure.code, 'provider-limit');
});

test('a fallback runs along a chain of three candidates, one pane each', { skip: SKIP, timeout: 300_000 }, async () => {
  const project = await newProject('fb3');
  limitOnRuns(project, [1, 2]);
  const run = project.startFgosRun({ executorIds: ['alpha', 'beta', 'gamma'] });
  await finishHealthyAttempt(project);
  assert.equal((await run.exited).code, 0, run.output().stderr.slice(-1500));
  const answer = answerOf(run);
  const attempts = unitRecord(project, answer).bindings['producer/1'];
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'provider-limit'], ['gamma', 'pass']]);
  assert.deepEqual(attempts.map((a) => [a.skipCandidateIndex, a.candidateIndex]), [[-1, 0], [0, 1], [1, 2]]);
  assert.equal(tabsOpened(project).length, 3);
  assert.equal(project.callsStarting('pane close').length, 1);
});

test('with no candidate left a limit stays a structured provider-limit outcome and opens no second pane', { skip: SKIP, timeout: 240_000 }, async () => {
  const project = await newProject('fb1');
  limitOnRuns(project, [1]);
  const run = project.startFgosRun({ executorIds: ['alpha'] });
  const exit = await run.exited;
  const answer = answerOf(run);
  assert.notEqual(exit.code, 0, 'a limit with nothing to fall back to is not a pass');
  const results = answer?.data?.results ?? [];
  const last = results.at(-1) ?? {};
  assert.equal(answer?.data?.outcome ?? last.outcome, 'provider-limit', JSON.stringify(answer).slice(0, 1500));
  assert.equal(last.fallbackExhausted?.from?.executor, 'alpha');
  assert.ok(last.fallbackExhausted?.reason);
  assert.equal(tabsOpened(project).length, 1, 'no second pane is opened');
  assert.equal(project.callsStarting('pane close').length, 0, 'the stopped pane stays');
});

test('a writing unit whose first candidate hits a limit is committed through the mutating gate from the fallback', { skip: SKIP, timeout: 300_000 }, async () => {
  const project = await newProject('fbw');
  project.addWorktree();
  limitOnRuns(project, [1]);
  const run = project.startFgosRun({ executorIds: ['alpha', 'beta'], unit: { writes: ['probe-worktree.txt'] }, worktree: project.worktreeDir });
  await finishHealthyAttempt(project, { writes: true });
  const exit = await run.exited;
  assert.equal(exit.code, 0, run.output().stderr.slice(-1500) + run.output().stdout.slice(-800));
  const answer = answerOf(run);
  const attempts = unitRecord(project, answer).bindings['producer/1'];
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.deepEqual(attempts.map((a) => [a.skipCandidateIndex, a.candidateIndex]), [[-1, 0], [0, 1]]);
  assert.equal(attempts[1].commit.status, 'committed');
  const subject = execFileSync('git', ['log', '-1', '--format=%H', '--', 'probe-worktree.txt'], { cwd: project.worktreeDir, encoding: 'utf8' }).trim();
  assert.ok(subject, 'the fallback attempt\'s file is in a commit of the worktree branch');
});
