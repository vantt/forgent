// `fgos run --resume` after the controller died: the settled result of the attempt the dead controller left
// is taken through the adopt door, the agent does not run again, and a resume never starts a second
// supervisor for an attempt that is bound. Real processes: the controller, the supervisor, the gate and the
// bwrap sandbox are real; the agent is fixtures/direct-agent.mjs.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { bindingPids } from './helpers/envelope-fixture.mjs';
import { signalPids, waitGone } from './helpers/kill-on-file.mjs';
import { BIN_FGOS, bwrapUsable, createProject, killToken, readJson, startRun, waitUntil } from './support/direct-harness.mjs';

seedFileLocalBwrapRegistry();

const skip = !bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine';
const here = (dir, name) => path.join(dir, name);
const exists = (dir, name) => fs.existsSync(here(dir, name));
const tokens = [];
after(() => { for (const t of tokens) killToken(t); });

const starts = (dir) => fs.readFileSync(here(dir, 'worker-output/outbox/agent-starts.txt'), 'utf8').split('\n').filter(Boolean);
const attemptWhere = (project, where) => waitUntil(() => project.attemptDirs().find(where), { timeoutMs: 120_000, what: 'the attempt' });

function projectWithWorktree(agent) {
  const project = createProject({ agent });
  const worktree = path.join(project.tmpDir, 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'work', worktree], { cwd: project.repoDir, stdio: 'ignore' });
  return { project, worktree };
}

const writingUnit = (project, id) => project.unitFile(id, { writes: ['out.txt'] });

/** `fgos run --resume <unitRunId>` as a real child process. */
function startResume(project, unitRunId, { cwd = project.repoDir, args = [] } = {}) {
  const child = spawn(process.execPath, [BIN_FGOS, 'run', '--resume', unitRunId, '--dir', project.repoDir, ...args], { cwd, env: project.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return { child, exited, output: () => ({ stdout, stderr }) };
}

const unitRunIdOf = (project) => fs.readdirSync(path.join(project.repoDir, '.fgos', 'assignments')).find((n) => n.startsWith('unit-run-'));
const unitDirOf = (project) => path.join(project.repoDir, '.fgos', 'assignments', unitRunIdOf(project));
const runCount = (project) => project.attemptDirs().length;

/** Kill the controller once its attempt is bound; the supervisor and agent go on by themselves. */
async function orphanBound(project, unitFile, runOptions) {
  const run = startRun(project, unitFile, runOptions);
  const dir = await attemptWhere(project, (d) => exists(d, 'supervisor-binding.json'));
  run.child.kill('SIGKILL');
  await run.exited;
  return dir;
}

test('1. controller killed after the binding: --resume takes the settled result, runs the agent once and commits the writes', { skip, timeout: 300_000 }, async () => {
  const { project, worktree } = projectWithWorktree({ runMs: 2500, writeFile: 'out.txt' });
  const dir = await orphanBound(project, writingUnit(project, 'resume-settled'), { cwd: worktree, args: ['--worktree', worktree] });
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the attempt to close without its controller' });
  const resume = startResume(project, unitRunIdOf(project), { cwd: worktree, args: ['--worktree', worktree] });
  const { code } = await resume.exited;
  assert.equal(code, 0, resume.output().stderr);
  assert.equal(runCount(project), 1, 'no second attempt directory');
  assert.equal(starts(dir).length, 1, 'the agent ran exactly once');
  const unitDir = unitDirOf(project);
  assert.ok(fs.existsSync(here(unitDir, 'unit-summary.json')), 'the unit ran to its summary');
  const subjects = execFileSync('git', ['log', '--format=%s', 'main..work'], { cwd: worktree, encoding: 'utf8' });
  assert.ok(subjects.trim().length > 0, `the writes were committed on the work branch: ${JSON.stringify(readJson(here(unitDirOf(project), 'unit.json')).bindings)} ${JSON.stringify(resume.output())}`);
  const attempt = Object.values(readJson(here(unitDir, 'unit.json')).bindings)[0][0];
  assert.equal(attempt.outcome, 'pass');
});

test('2. --resume while the attempt still runs is refused by name and changes nothing', { skip, timeout: 240_000 }, async () => {
  const project = createProject({ agent: { runMs: 6000 } });
  const dir = await orphanBound(project, project.unitFile('resume-running'));
  assert.equal(exists(dir, 'closed.json'), false, 'the attempt is still running');
  const before = fs.readFileSync(here(unitDirOf(project), 'unit.json'), 'utf8');
  const resume = startResume(project, unitRunIdOf(project));
  const { code } = await resume.exited;
  assert.notEqual(code, 0);
  assert.match(resume.output().stderr, /still running|attempt-still-running/);
  assert.match(resume.output().stderr, /fgos dispatch inspect/);
  assert.equal(fs.readFileSync(here(unitDirOf(project), 'unit.json'), 'utf8'), before, 'unit.json untouched');
  assert.equal(runCount(project), 1);
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the attempt to close' });
  assert.equal(starts(dir).length, 1);
});

test('3. controller dead before the supervisor started: --resume launches a new attempt that supersedes the abandoned one', { skip, timeout: 300_000 }, async () => {
  const project = createProject({ agent: { runMs: 1500 } });
  let dir = null;
  for (let tries = 0; tries < 8 && !dir; tries += 1) {
    const run = startRun(project, project.unitFile(`resume-abandoned-${tries}`));
    let seen = null;
    const deadline = Date.now() + 30_000;
    while (!seen && Date.now() < deadline) {
      seen = project.attemptDirs().find((d) => exists(d, 'envelope.json') && !exists(d, 'supervisor.log')) ?? null;
      if (!seen) await new Promise((resolve) => setImmediate(resolve));
    }
    run.child.kill('SIGKILL');
    await run.exited;
    if (seen) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!exists(seen, 'supervisor-binding.json') && !exists(seen, 'supervisor.log')) dir = seen;
    }
  }
  assert.ok(dir, 'the controller was stopped between the prepare and the spawn');
  const unitRunId = path.basename(path.dirname(path.dirname(path.dirname(path.dirname(dir)))));
  const resume = startResume(project, unitRunId);
  const { code } = await resume.exited;
  assert.equal(code, 0, JSON.stringify(resume.output()).slice(0, 200) + (() => { try { const r = JSON.parse(resume.output().stdout).data.results[0]; return JSON.stringify({ o: r.outcome, c: r.runResult?.classification, e: r.runResult?.runtime, r: r.refused }); } catch { return ''; } })() + resume.output().stderr);
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'abandoned-not-started');
  const next = project.attemptDirs().filter((d) => d.startsWith(path.dirname(path.dirname(dir))) && d !== dir);
  assert.equal(next.length, 1, 'one new attempt');
  assert.equal(readJson(here(next[0], 'run.json')).supersedesRunId, readJson(here(dir, 'run.json')).runId);
  assert.equal(starts(next[0]).length, 1);
  assert.equal(fs.existsSync(here(dir, 'worker-output/outbox/agent-starts.txt')), false, 'the abandoned attempt never ran the agent');
});

test('4. the runner commit failed after the settle: --resume commits again and never spawns the agent', { skip, timeout: 300_000 }, async () => {
  const { project, worktree } = projectWithWorktree({ runMs: 1500, writeFile: 'out.txt' });
  const first = startRun(project, writingUnit(project, 'resume-commit'), { cwd: worktree, args: ['--worktree', worktree] });
  const { code } = await first.exited;
  assert.ok(code === 0, first.output().stderr);
  const unitDir = unitDirOf(project);
  const dir = project.attemptDirs()[0];
  // The state the dead controller left: the attempt settled and closed, its commit recorded as failed.
  const record = readJson(here(unitDir, 'unit.json'));
  const attempt = Object.values(record.bindings)[0][0];
  const head = execFileSync('git', ['rev-parse', 'HEAD~1'], { cwd: worktree, encoding: 'utf8' }).trim();
  execFileSync('git', ['reset', '-q', '--mixed', head], { cwd: worktree });
  attempt.commit = { status: 'failed', reason: 'commit-error', error: 'simulated' };
  attempt.outcome = 'execution-failure';
  delete record.settlement;
  fs.writeFileSync(here(unitDir, 'unit.json'), JSON.stringify(record, null, 2));
  fs.rmSync(here(unitDir, 'unit-summary.json'), { force: true });
  const resume = startResume(project, unitRunIdOf(project), { cwd: worktree, args: ['--worktree', worktree] });
  const done = await resume.exited;
  assert.equal(done.code, 0, resume.output().stderr);
  assert.equal(starts(dir).length, 1, 'the agent did not run again');
  assert.equal(runCount(project), 1);
  assert.equal(execFileSync('git', ['status', '--porcelain', '--', 'out.txt'], { cwd: worktree, encoding: 'utf8' }).trim(), '', 'out.txt is committed');
});

test('5. two --resume at once: one runs, the other is refused as resume-in-progress', { skip, timeout: 300_000 }, async () => {
  const project = createProject({ agent: { runMs: 1500 } });
  const dir = await orphanBound(project, project.unitFile('resume-twice'));
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the attempt to close' });
  const unitRunId = unitRunIdOf(project);
  const a = startResume(project, unitRunId);
  const b = startResume(project, unitRunId);
  const [ra, rb] = await Promise.all([a.exited, b.exited]);
  const codes = [ra.code, rb.code].sort();
  assert.equal(codes[0], 0, `${a.output().stderr}\n${b.output().stderr}`);
  const refused = [a, b].filter((r) => /resume-in-progress|another controller/.test(r.output().stderr));
  // The loser may also arrive after the winner finished; then it takes the same settled summary again.
  assert.ok(refused.length === 1 || codes[1] === 0, `${a.output().stderr}\n${b.output().stderr}`);
  assert.equal(starts(dir).length, 1);
  assert.equal(runCount(project), 1);
});

test('6. a resume of a bound attempt goes through adopt: no second supervisor is started for it', { skip, timeout: 300_000 }, async () => {
  const project = createProject({ agent: { runMs: 1500 } });
  const dir = await orphanBound(project, project.unitFile('resume-no-supervisor'));
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the attempt to close' });
  const { supervisor } = readJson(here(dir, 'supervisor-binding.json'));
  await waitUntil(() => { try { process.kill(supervisor.pid, 0); return false; } catch { return true; } }, { timeoutMs: 30_000, what: 'the supervisor to end' });
  const bindingBefore = fs.readFileSync(here(dir, 'supervisor-binding.json'), 'utf8');
  const logBefore = fs.readFileSync(here(dir, 'supervisor.log'), 'utf8');
  const resume = startResume(project, unitRunIdOf(project));
  assert.equal((await resume.exited).code, 0, resume.output().stderr);
  assert.equal(fs.readFileSync(here(dir, 'supervisor-binding.json'), 'utf8'), bindingBefore, 'the binding is the original supervisor\'s');
  assert.equal(fs.readFileSync(here(dir, 'supervisor.log'), 'utf8'), logBefore, 'no supervisor wrote to the attempt again');
  assert.equal(runCount(project), 1);
  assert.equal(starts(dir).length, 1);
});


test('7. after Ctrl-C the resume runs the unit again in a new attempt that supersedes the cancelled one', { skip, timeout: 300_000 }, async () => {
  const project = createProject({ agent: { runMs: 8000 }, dispatch: { gateKillGraceMs: 1000 } });
  const run = startRun(project, project.unitFile('resume-cancelled'));
  const dir = await attemptWhere(project, (d) => exists(d, 'agent-binding.json'));
  run.child.kill('SIGINT');
  assert.equal((await run.exited).code, 130, run.output().stderr);
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the cancelled attempt to close' });
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'cancelled');
  const resume = startResume(project, unitRunIdOf(project));
  assert.equal((await resume.exited).code, 0, resume.output().stderr);
  const next = project.attemptDirs().filter((d) => d !== dir);
  assert.equal(next.length, 1, 'one new attempt');
  assert.equal(readJson(here(next[0], 'run.json')).supersedesRunId, readJson(here(dir, 'run.json')).runId);
  assert.equal(starts(next[0]).length, 1);
});

test('8. controller, supervisor and gate all dead with the lock free: --resume adopts the attempt itself instead of refusing it as running', { skip, timeout: 300_000 }, async () => {
  const project = createProject({ agent: { runMs: 8000 } });
  const run = startRun(project, project.unitFile('resume-needs-adopt'));
  const dir = await attemptWhere(project, (d) => bindingPids(d).length === 2 && exists(d, 'agent-binding.json'));
  const pids = [run.child.pid, ...bindingPids(dir)];
  signalPids(pids);
  await run.exited;
  await waitGone(pids);
  assert.equal(exists(dir, 'closed.json'), false, 'nothing settled the attempt yet');
  const resume = startResume(project, unitRunIdOf(project));
  await resume.exited;
  const { stderr } = resume.output();
  assert.doesNotMatch(stderr, /attempt-still-running|is still needs-adopt/, stderr);
  assert.ok(exists(dir, 'closed.json'), 'the resume adopted and settled the attempt');
});

test('9. an attempt the legacy sweep settled is not carried on from: --resume launches a new attempt that supersedes it', { skip, timeout: 300_000 }, async () => {
  const project = createProject({ agent: { runMs: 1500 } });
  const first = startRun(project, project.unitFile('resume-legacy'));
  assert.equal((await first.exited).code, 0, first.output().stderr);
  const unitDir = unitDirOf(project);
  const [dir] = project.attemptDirs();
  // Shape of a run from before the supervisor that the legacy sweep settled: a launch record, no envelope, no
  // closed marker, and nothing in the unit recording how it ended.
  for (const name of ['envelope.json', 'closed.json', 'receipt.json', 'result.json', 'exit.json']) fs.rmSync(here(dir, name), { force: true });
  for (const name of fs.readdirSync(dir).filter((n) => n.startsWith('attempt.lock'))) fs.rmSync(here(dir, name), { recursive: true, force: true });
  fs.mkdirSync(here(dir, 'controller/commands'), { recursive: true });
  const status = readJson(here(dir, 'run.json'));
  fs.writeFileSync(here(dir, 'run.json'), `${JSON.stringify({ ...status, status: 'died', settlement: 'abandoned-legacy', settledAt: new Date().toISOString() })}\n`);
  const record = readJson(here(unitDir, 'unit.json'));
  for (const attempts of Object.values(record.bindings)) for (const attempt of attempts) delete attempt.outcome;
  fs.writeFileSync(here(unitDir, 'unit.json'), `${JSON.stringify(record, null, 2)}\n`);
  fs.rmSync(here(unitDir, 'unit-summary.json'), { force: true });
  const resume = startResume(project, unitRunIdOf(project));
  assert.equal((await resume.exited).code, 0, resume.output().stderr);
  const next = project.attemptDirs().filter((d) => d !== dir);
  assert.equal(next.length, 1, 'one new attempt');
  assert.equal(readJson(here(next[0], 'run.json')).supersedesRunId, status.runId);
  assert.equal(starts(next[0]).length, 1);
  assert.ok(fs.existsSync(here(unitDir, 'unit-summary.json')));
});
