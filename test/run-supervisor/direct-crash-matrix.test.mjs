// The direct launch under real crashes: `fgos run` as a real process, the sandbox real (bwrap), the
// supervisor, gate and settle steps real. The agent is fixtures/direct-agent.mjs.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { execFileSync } from 'node:child_process';
import { lockHolders, probe } from '../../src/holder-lock/index.mjs';
import { adoptRun } from '../../src/run-supervisor/client.mjs';
import { dispatchCwdHolder } from '../../src/runner/dispatch/cwd-lock.mjs';
import { BIN_FGOS, bwrapUsable, createProject, killToken, pidsWithToken, readJson, sleep, startRun, waitUntil } from './support/direct-harness.mjs';

seedFileLocalBwrapRegistry();

const skip = !bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine';
const here = (dir, name) => path.join(dir, name);
const exists = (dir, name) => fs.existsSync(here(dir, name));
const token = () => `tok-${crypto.randomBytes(6).toString('hex')}`;
const tokens = [];
after(() => { for (const t of tokens) killToken(t); });

function attemptLockState(project, dir) {
  return probe('attempt', { fgosDir: path.join(project.repoDir, '.fgos'), runDir: path.dirname(path.dirname(dir)), NN: path.basename(dir) }).result;
}

/** The first attempt directory that satisfies `where`, waited for at a 5 ms poll. */
const attemptWhere = (project, where, opts) => waitUntil(() => project.attemptDirs().find(where), { timeoutMs: 120_000, ...opts });

function assertSettledAttempt(project, dir) {
  for (const name of ['result.json', 'exit.json', 'evidence.json', 'receipt.json', 'steps/settle-attempt.json', 'steps/finalize-home.json', 'closed.json']) {
    assert.ok(exists(dir, name), `${name} is missing in ${dir}`);
  }
  assert.equal(attemptLockState(project, dir), 'free', 'the attempt lock is free');
  assert.deepEqual(project.homesLeft(), [], 'every private home is removed');
}

const starts = (dir) => fs.readFileSync(here(dir, 'worker-output/outbox/agent-starts.txt'), 'utf8').split('\n').filter(Boolean);

test('1. a controller killed with SIGKILL after the binding leaves an agent that finishes and an attempt that settles by itself', { skip, timeout: 240_000 }, async (t) => {
  const tok = token(); tokens.push(tok);
  const project = createProject({ agent: { runMs: 2500, grandchildToken: tok } });
  const run = startRun(project, project.unitFile('crash-sigkill'));
  const dir = await attemptWhere(project, (d) => exists(d, 'supervisor-binding.json'), { what: 'the supervisor binding' });
  assert.equal(project.homesLeft().length, 1, 'a private home exists while the attempt runs');
  run.child.kill('SIGKILL');
  assert.equal((await run.exited).signal, 'SIGKILL');
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the attempt to close without its controller' });
  assertSettledAttempt(project, dir);
  assert.equal(starts(dir).length, 1, 'the agent ran exactly once');
  assert.deepEqual(pidsWithToken(tok), [], 'the setsid grandchild did not outlive the attempt');
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'exited');
});

test('2. a controller that gets SIGTERM does not stop the attempt either: the controller catches no signal here', { skip, timeout: 240_000 }, async () => {
  const project = createProject({ agent: { runMs: 2500 } });
  const run = startRun(project, project.unitFile('crash-sigterm'));
  const dir = await attemptWhere(project, (d) => exists(d, 'supervisor-binding.json'), { what: 'the supervisor binding' });
  run.child.kill('SIGTERM');
  assert.equal((await run.exited).signal, 'SIGTERM');
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 150_000, what: 'the attempt to close without its controller' });
  assertSettledAttempt(project, dir);
  assert.equal(starts(dir).length, 1);
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'exited');
});

/** Kill the controller, then the supervisor, once the agent runs; returns the attempt directory. */
async function orphanTheAttempt(project, unitId) {
  const run = startRun(project, project.unitFile(unitId));
  const dir = await attemptWhere(project, (d) => exists(d, 'supervisor-binding.json'), { what: 'the supervisor binding' });
  const { supervisor } = readJson(here(dir, 'supervisor-binding.json'));
  run.child.kill('SIGKILL');
  await run.exited;
  process.kill(supervisor.pid, 'SIGKILL');
  await waitUntil(() => { try { process.kill(supervisor.pid, 0); return false; } catch { return true; } }, { what: 'the supervisor to be gone' });
  return dir;
}

/** A trivial run: its start sweeps the attempts nobody finished. */
async function sweepWith(project, unitId) {
  const run = startRun(project, project.unitFile(unitId));
  const { code } = await run.exited;
  assert.equal(code, 0, run.output().stderr);
}

test('3. a supervisor killed midway: the agent runs to its end and the next fgos run settles it from gate-exit and the outbox', { skip, timeout: 240_000 }, async () => {
  const tok = token(); tokens.push(tok);
  const project = createProject({ agent: { runMs: 2500, grandchildToken: tok } });
  const dir = await orphanTheAttempt(project, 'crash-supervisor');
  await waitUntil(() => exists(dir, 'gate-exit.json') && readJson(here(dir, 'gate-exit.json')), { timeoutMs: 120_000, what: 'the gate to end the attempt' });
  assert.equal(exists(dir, 'receipt.json'), false, 'no supervisor, no receipt yet');
  assert.equal(exists(dir, 'closed.json'), false);
  await sweepWith(project, 'crash-supervisor-next');
  assert.equal(readJson(here(dir, 'receipt.json')).synthesizedBy, 'adopt');
  assertSettledAttempt(project, dir);
  assert.equal(starts(dir).length, 1, 'the agent ran exactly once');
  assert.deepEqual(pidsWithToken(tok), []);
  assert.equal(readJson(here(dir, 'closed.json')).closedBy, 'adopt');
});

test('4. the soft deadline passes after the controller died: the supervisor stops the agent, the receipt says timeout and the grandchild is gone', { skip, timeout: 240_000 }, async () => {
  const tok = token(); tokens.push(tok);
  const project = createProject({ agent: { runMs: 120_000, grandchildToken: tok }, timeoutMs: 12_000, dispatch: { gateKillGraceMs: 1000 } });
  const run = startRun(project, project.unitFile('crash-deadline'));
  const dir = await attemptWhere(project, (d) => exists(d, 'supervisor-binding.json'), { what: 'the supervisor binding' });
  await waitUntil(() => pidsWithToken(tok).length > 0, { timeoutMs: 90_000, what: 'the grandchild to exist' });
  run.child.kill('SIGKILL');
  await run.exited;
  await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 120_000, what: 'the attempt to close' });
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'timeout');
  assert.deepEqual(pidsWithToken(tok), [], 'the setsid grandchild died with the attempt');
  assertSettledAttempt(project, dir);
});

test('5. controller and supervisor both dead: the gate enforces the hard ceiling and the next run settles a timeout', { skip, timeout: 300_000 }, async () => {
  const tok = token(); tokens.push(tok);
  const project = createProject({ agent: { runMs: 300_000, grandchildToken: tok, ignoreSigterm: true }, timeoutMs: 1000, dispatch: { gateKillGraceMs: 1000 } });
  const dir = await orphanTheAttempt(project, 'crash-ceiling');
  const exit = await waitUntil(() => readJson(here(dir, 'gate-exit.json')), { timeoutMs: 150_000, what: 'the gate to end the agent at its ceiling' });
  assert.ok(['hard-ceiling', 'timeout'].includes(exit.cause) || exit.stoppedBy !== 'agent', `unexpected gate exit ${JSON.stringify(exit)}`);
  assert.deepEqual(pidsWithToken(tok), [], 'the agent and its grandchild are dead');
  project.reconfigure({ agent: { runMs: 200 }, timeoutMs: 30_000 });
  await sweepWith(project, 'crash-ceiling-next');
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'timeout');
  assertSettledAttempt(project, dir);
});

test('6. two fgos run starting together over one attempt that needs adopting: it is adopted once', { skip, timeout: 240_000 }, async () => {
  const project = createProject({ agent: { runMs: 1500 } });
  const dir = await orphanTheAttempt(project, 'crash-two-adopters');
  await waitUntil(() => readJson(here(dir, 'gate-exit.json')), { timeoutMs: 120_000, what: 'the gate to end the attempt' });
  const first = startRun(project, project.unitFile('adopter-a'));
  const second = startRun(project, project.unitFile('adopter-b'));
  const [a, b] = await Promise.all([first.exited, second.exited]);
  assert.deepEqual([a.code, b.code], [0, 0], `${first.output().stderr}\n${second.output().stderr}`);
  assertSettledAttempt(project, dir);
  assert.equal(readJson(here(dir, 'closed.json')).closedBy, 'adopt');
  const receipts = fs.readdirSync(here(dir, 'steps')).filter((f) => f.endsWith('.json'));
  assert.deepEqual(receipts.sort(), ['finalize-home.json', 'settle-attempt.json'], 'each step ran once and left one receipt');
});

/**
 * Start `fgos run` and SIGKILL it the moment `edge(dir)` holds for an attempt directory; retried (fresh
 * project) until the kill landed on that edge, because the edge is a few milliseconds wide.
 * `confirm(project, dir)` says whether the state left behind is the one the edge names.
 */
async function killAtEdge(label, makeProject, edge, confirm, { tries = 8 } = {}) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    const project = makeProject();
    const run = startRun(project, project.unitFile(`edge-${label}-${attempt}`));
    const deadline = Date.now() + 30_000;
    let dir = null;
    while (!dir && Date.now() < deadline) {
      dir = project.attemptDirs().find(edge) ?? null;
      if (!dir) await new Promise((resolve) => setImmediate(resolve));
    }
    run.child.kill('SIGKILL');
    await run.exited;
    if (dir && await confirm(project, dir)) return { project, dir };
  }
  assert.fail(`the controller was never stopped on the "${label}" edge in ${tries} tries`);
}

const edgeProject = () => createProject({ agent: { runMs: 1500 } });

test('7a. a controller that dies before it took the lock leaves nothing to adopt', { skip, timeout: 240_000 }, async () => {
  const { project, dir } = await killAtEdge('before-lock', edgeProject, (d) => exists(d, 'run.json') && !exists(d, 'attempt.lock'), (p, d) => !exists(d, 'attempt.lock'));
  await sleep(1500);
  assert.equal(exists(dir, 'supervisor-binding.json'), false);
  assert.equal(exists(dir, 'envelope.json'), false);
  assert.equal(fs.existsSync(here(dir, 'worker-output/outbox/agent-starts.txt')), false, 'no agent ever started');
  assert.equal(adoptRun(dir).state, 'legacy-run', 'no envelope means no attempt for the adopt door');
  assert.deepEqual(project.homesLeft(), []);
});

test('7b. a controller that dies after the lock and before the prepare leaves no home and no envelope', { skip, timeout: 240_000 }, async () => {
  const { project, dir } = await killAtEdge('after-lock', edgeProject, (d) => exists(d, 'attempt.lock') && exists(d, 'controller/evaluator-baseline.json') && !exists(d, 'envelope.json'), (p, d) => !exists(d, 'envelope.json') && p.homesLeft().length === 0);
  await sleep(1500);
  assert.equal(exists(dir, 'supervisor-binding.json'), false);
  assert.equal(attemptLockState(project, dir), 'free', 'the lock went with the dead controller');
  assert.equal(adoptRun(dir).state, 'legacy-run');
});

test('7c. a controller that dies after the prepare and before the spawn: adopt closes it abandoned-not-started and removes the home', { skip, timeout: 240_000 }, async () => {
  const { project, dir } = await killAtEdge('after-prepare', edgeProject, (d) => exists(d, 'envelope.json') && !exists(d, 'supervisor.log'), async (p, d) => { await sleep(300); return !exists(d, 'supervisor-binding.json') && !exists(d, 'supervisor.log'); });
  assert.equal(project.homesLeft().length, 1, 'the prepare had made the home');
  await sweepWith(project, 'edge-after-prepare-sweep');
  assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'abandoned-not-started');
  assert.equal(fs.existsSync(here(dir, 'worker-output/outbox/agent-starts.txt')), false, 'the agent never started');
  assertSettledAttempt(project, dir);
});

test('7d. a controller that dies right after the spawn: the attempt is settled once, whichever side of the binding the kill fell on', { skip, timeout: 240_000 }, async () => {
  const { project, dir } = await killAtEdge('after-spawn', edgeProject, (d) => exists(d, 'supervisor.log'), () => true, { tries: 1 });
  await sleep(2500);
  if (exists(dir, 'supervisor-binding.json')) {
    // The supervisor outlived the controller and finishes the attempt by itself.
    await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 90_000, what: 'the supervisor to settle the attempt' });
    assert.equal(starts(dir).length, 1);
    assert.equal(readJson(here(dir, 'closed.json')).closedBy, 'supervisor');
  } else {
    await sweepWith(project, 'edge-after-spawn-sweep');
    assert.equal(readJson(here(dir, 'receipt.json')).outcome, 'abandoned-not-started');
    assert.equal(fs.existsSync(here(dir, 'worker-output/outbox/agent-starts.txt')), false);
  }
  assertSettledAttempt(project, dir);
});

/** `pid` and its parents up to init, read from /proc. */
function ancestry(pid) {
  const chain = [];
  for (let current = pid; current > 1 && chain.length < 32; ) {
    chain.push(current);
    try {
      const stat = fs.readFileSync(`/proc/${current}/stat`, 'utf8');
      current = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]);
    } catch { break; }
  }
  return chain;
}

function projectWithWorktree(agent) {
  const project = createProject({ agent });
  const worktree = path.join(project.tmpDir, 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'work', worktree], { cwd: project.repoDir, stdio: 'ignore' });
  return { project, worktree };
}

const writingRun = (project, worktree, id) => startRun(
  project,
  project.unitFile(id, { writes: ['out.txt'] }),
  { cwd: worktree, args: ['--worktree', worktree] },
);

test('8. no descriptor of the attempt or cwd lock reaches the agent or its grandchild', { skip, timeout: 240_000 }, async () => {
  const tok = token(); tokens.push(tok);
  const { project, worktree } = projectWithWorktree({ runMs: 1500, grandchildToken: tok, writeFile: 'out.txt' });
  const run = writingRun(project, worktree, 'leak');
  const { code } = await run.exited;
  assert.ok([0, 11, 12].includes(code), run.output().stderr);
  const [dir] = project.attemptDirs();
  for (const name of ['agent-fds.txt', 'grandchild-fds.txt']) {
    const listing = fs.readFileSync(here(dir, `worker-output/outbox/${name}`), 'utf8');
    assert.ok(listing.split('\n').filter(Boolean).length > 0, `${name} lists the descriptors`);
    assert.doesNotMatch(listing, /attempt\.lock|dispatch-cwd/, `${name} holds a lock description:\n${listing}`);
  }
  assert.deepEqual(pidsWithToken(tok), []);
});

test('9. read-only attempts on one cwd share it without a lease; a writing attempt holds the lease until its gate is gone', { skip, timeout: 180_000 }, async () => {
  const project = createProject({ agent: { runMs: 3000 } });
  const fgosDir = path.join(project.repoDir, '.fgos');
  const runs = ['ro-a', 'ro-b', 'ro-c'].map((id) => startRun(project, project.unitFile(id)));
  await waitUntil(() => project.attemptDirs().filter((d) => exists(d, 'supervisor-binding.json')).length === 3, { timeoutMs: 60_000, what: 'three read-only attempts to run side by side' });
  assert.equal(dispatchCwdHolder(fgosDir, project.repoDir), null, 'a read-only attempt takes no cwd lease');
  const outcomes = await Promise.all(runs.map((run) => run.exited));
  assert.deepEqual(outcomes.map((o) => o.code), [0, 0, 0], runs.map((r) => r.output().stderr).join('\n'));

  const { project: writer, worktree } = projectWithWorktree({ runMs: 2500, writeFile: 'out.txt' });
  const writerFgos = path.join(writer.repoDir, '.fgos');
  const run = writingRun(writer, worktree, 'writer');
  const dir = await attemptWhere(writer, (d) => exists(d, 'supervisor-binding.json'), { what: 'the writing attempt to bind' });
  const { supervisor, gate } = readJson(here(dir, 'supervisor-binding.json'));
  // The controller lets go of its copy right after it saw the binding; what remains are processes of the attempt.
  const holders = await waitUntil(() => {
    const listed = lockHolders('dispatch-cwd', { fgosDir: writerFgos, cwd: worktree });
    return listed.kind === 'list' && listed.pids.length > 0 && !listed.pids.includes(run.child.pid) ? listed.pids : null;
  }, { timeoutMs: 10_000, what: 'the controller to let go of the cwd lease' });
  for (const pid of holders) {
    assert.ok(ancestry(pid).some((p) => p === supervisor.pid || p === gate.pid), `lease holder ${pid} is not part of the attempt of supervisor ${supervisor.pid}`);
  }
  let freedBeforeClosed = null;
  await waitUntil(() => {
    if (freedBeforeClosed === null && exists(dir, 'gate-exit.json') && dispatchCwdHolder(writerFgos, worktree) === null) freedBeforeClosed = !exists(dir, 'closed.json') || 'at-close';
    return exists(dir, 'closed.json');
  }, { timeoutMs: 60_000, intervalMs: 2, what: 'the writing attempt to close' });
  assert.ok(freedBeforeClosed, 'the lease was free by the time the attempt closed');
  await run.exited;
  assert.equal(dispatchCwdHolder(writerFgos, worktree), null);
});
