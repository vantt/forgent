// Every row of the adopt recovery matrix under a real crash, in both launch modes, and what `fgos run
// --resume` makes of the attempt that is left: the unit runs to its summary, the agent ran once, the private
// home went back once, the pane (terminal) closed once. Processes are real (controller, supervisor, gate, steps,
// bwrap); the crash is made from outside by stopping processes when a file of the attempt shows up, or by
// holding a step through the host command the envelope carries (helpers/envelope-fixture.mjs).
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { probe } from '../../src/holder-lock/index.mjs';
import { settleRunControl } from '../../src/runner/dispatch/run-lock.mjs';
import { adoptRun } from '../../src/run-supervisor/client.mjs';
import { BIN_FGOS, bwrapUsable, createProject, readJson, startRun, waitUntil } from './support/direct-harness.mjs';
import { createTerminalProject, noHost, sleep } from './support/terminal-harness.mjs';
import { bindingPids, stepProcess, supervisorProcess } from './helpers/envelope-fixture.mjs';
import { freezeChildOf, killOnFile, signalPids, waitGone } from './helpers/kill-on-file.mjs';

seedFileLocalBwrapRegistry();

const REAL_HOST = process.env.FGOS_HOST_BIN;
const skipDirect = (!REAL_HOST || !fs.existsSync(REAL_HOST)) ? 'FGOS_HOST_BIN must name a host binary built from this checkout'
  : (!bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine');

const here = (dir, name) => path.join(dir, name);
const exists = (dir, name) => fs.existsSync(here(dir, name));
/** A file the gate or a step published with content (the gate's exit file is created empty up front). */
const published = (dir, name) => readJson(here(dir, name)) !== null;
const startsOf = (dir) => { try { return fs.readFileSync(here(dir, 'worker-output/outbox/agent-starts.txt'), 'utf8').split('\n').filter(Boolean); } catch { return []; } };
// --- direct mode ------------------------------------------------------------------------------------

const directProject = (agent = { runMs: 1500 }) => ({ project: createProject({ agent }) });

function startResume(project, unitRunId) {
  const child = spawn(process.execPath, [BIN_FGOS, 'run', '--resume', unitRunId, '--dir', project.repoDir], { cwd: project.repoDir, env: project.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return { child, exited, output: () => ({ stdout, stderr }) };
}

/** The gate publishes its exit record a moment before it lets go of the attempt lock; an adopter that looks in between sees a live attempt. */
const attemptLockFree = (repoDir, dir) => probe('attempt', { fgosDir: path.join(repoDir, '.fgos'), runDir: path.dirname(path.dirname(dir)), NN: path.basename(dir) }).result === 'free';

const controlSettled = (dir) => { try { return fs.readdirSync(here(dir, 'control/generations')).some((n) => readJson(path.join(dir, 'control', 'generations', n))?.purpose === 'settled'); } catch { return false; } };

/** What the settle step does just before it publishes result.json: run control reads `settled` under the attempt's token. */
function settleControlAsTheStepDid(dir) {
  const side = readJson(here(dir, 'protected/attempt-secrets.json'));
  return side && settleRunControl(dir, { controlEpoch: side.controlEpoch, controlToken: side.controlToken }).status === 'settled';
}

const unitRunIdOf = (project) => fs.readdirSync(path.join(project.repoDir, '.fgos', 'assignments')).find((n) => n.startsWith('unit-run-'));
const unitDirOf = (project) => path.join(project.repoDir, '.fgos', 'assignments', unitRunIdOf(project));

/**
 * Freeze the step `what` (a step id, or a matcher of the supervisor's children) the moment the supervisor starts it, then kill it with the controller, the supervisor and
 * the gate: the attempt stands exactly before that step did anything.
 */
async function holdStepAndKill(project, startRunFn, id, what, afterStart = null) {
  const run = startRunFn(project, id);
  const play = afterStart ? afterStart(run) : Promise.resolve();
  const dir = await waitUntil(() => project.attemptDirs().find((d) => bindingPids(d).length === 2), { timeoutMs: 120_000, what: 'the binding' });
  const [supervisor] = bindingPids(dir);
  const frozen = await freezeChildOf({ parent: supervisor, match: typeof what === 'string' ? stepProcess(dir, what) : what(dir) });
  const victims = [run.child.pid, ...bindingPids(dir), ...(frozen ?? [])];
  signalPids(victims);
  await run.exited;
  await play;
  await waitGone(victims);
  return frozen ? dir : null;
}

/** Freeze the processes that match, then kill them together with the controller and (once bound) the supervisor and gate. */
async function holdAndKill({ project }, id, matchOf) {
  const run = startRun(project, project.unitFile(id));
  const dir = await waitUntil(() => project.attemptDirs()[0], { timeoutMs: 120_000, what: 'the attempt directory' });
  const frozen = await freezeChildOf({ parent: run.child.pid, match: matchOf(dir), timeoutMs: 60_000 });
  const victims = [run.child.pid, ...bindingPids(dir), ...(frozen ?? [])];
  signalPids(victims);
  await run.exited;
  await waitGone(victims);
  return frozen ? dir : null;
}

/**
 * Run `attempt()` against fresh projects until the crash left the state the row names (`confirm`): the edges of
 * a few rows are milliseconds wide, so the kill is repeated rather than assumed.
 */
async function crashUntilAsync(label, make, attempt, confirm, { tries = 8 } = {}) {
  for (let n = 1; n <= tries; n += 1) {
    const ctx = await make();
    const dir = await attempt(ctx, `u-${n}`);
    if (dir && await confirm(ctx, dir)) return { ...ctx, dir };
  }
  assert.fail(`the crash never left the "${label}" state in ${tries} tries`);
}

const DIRECT_CRASH = {
  // The supervisor is frozen the moment it exists, before it can bind: controller and supervisor die.
  'no-binding': {
    attempt: (ctx, id) => holdAndKill(ctx, id, supervisorProcess),
    confirm: (ctx, dir) => exists(dir, 'envelope.json') && !exists(dir, 'supervisor-binding.json') && !published(dir, 'receipt.json') && startsOf(dir).length === 0 && attemptLockFree(ctx.project.repoDir, dir),
  },
  'binding-no-gate-exit': {
    async attempt({ project }, id) {
      const run = startRun(project, project.unitFile(id));
      let dir = null;
      await killOnFile({
        appears: () => { dir = project.attemptDirs().find((d) => bindingPids(d).length === 2) ?? null; return dir; },
        targets: () => [run.child.pid, ...bindingPids(dir)],
      });
      await run.exited;
      if (dir) await waitGone(bindingPids(dir));
      return dir;
    },
    confirm: (ctx, dir) => !published(dir, 'gate-exit.json') && !published(dir, 'receipt.json'),
  },
  // Controller and supervisor die while the agent runs; the gate ends the attempt and writes its exit alone.
  'gate-exit-no-receipt': {
    async attempt({ project }, id) {
      const run = startRun(project, project.unitFile(id));
      const dir = await waitUntil(() => project.attemptDirs().find((d) => startsOf(d).length > 0 && bindingPids(d).length === 2), { timeoutMs: 120_000, what: 'the agent to run' });
      signalPids([run.child.pid, bindingPids(dir)[0]]);
      await run.exited;
      await waitUntil(() => published(dir, 'gate-exit.json') && attemptLockFree(project.repoDir, dir), { timeoutMs: 120_000, what: 'the gate to end the attempt alone and let go of the lock' });
      return dir;
    },
    confirm: (ctx, dir) => !published(dir, 'receipt.json'),
  },
  // The settle step dies before it ran; the ledger then gets the one record the step writes before result.json,
  // through the same primitive and the attempt's own token: the window between the two is microseconds wide in one
  // synchronous path, so it cannot be hit by a kill from outside.
  'settled-no-result': {
    async attempt(ctx, id) {
      const dir = await holdStepAndKill(ctx.project, (p, n) => startRun(p, p.unitFile(n)), id, 'settle-attempt');
      return dir && settleControlAsTheStepDid(dir) ? dir : null;
    },
    confirm: (ctx, dir) => published(dir, 'receipt.json') && !exists(dir, 'result.json') && !exists(dir, 'steps/settle-attempt.json') && controlSettled(dir),
  },
  'receipt-not-settled': {
    attempt: ({ project }, id) => holdStepAndKill(project, (p, n) => startRun(p, p.unitFile(n)), id, 'settle-attempt'),
    confirm: (ctx, dir) => published(dir, 'receipt.json') && !exists(dir, 'result.json') && !exists(dir, 'steps/settle-attempt.json'),
  },
  'result-no-finalize': {
    attempt: ({ project }, id) => holdStepAndKill(project, (p, n) => startRun(p, p.unitFile(n)), id, 'finalize-home'),
    confirm: (ctx, dir) => exists(dir, 'result.json') && exists(dir, 'steps/settle-attempt.json') && !exists(dir, 'steps/finalize-home.json'),
  },
  'all-steps-no-closed': {
    async attempt({ project }, id) {
      const run = startRun(project, project.unitFile(id));
      let dir = null;
      await killOnFile({
        appears: () => { dir = project.attemptDirs().find((d) => exists(d, 'steps/finalize-home.json')) ?? null; return dir; },
        targets: () => [run.child.pid, ...bindingPids(dir)],
      });
      await run.exited;
      if (dir) await waitGone(bindingPids(dir));
      return dir;
    },
    confirm: (ctx, dir) => exists(dir, 'steps/finalize-home.json') && !exists(dir, 'closed.json'),
  },
};

// --- terminal mode ----------------------------------------------------------------------------------
// `fgos run` with herdr present: a fake herdr keeps one real pane, a real supervisor briefs the agent in it, and
// the test plays the agent (takes the brief, writes the result claim, lets the process end).

const terminalProjects = [];
after(() => { for (const project of terminalProjects) project.stop(); });
const skipTerminal = noHost || (!bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine');

async function terminalCtx() {
  const project = await createTerminalProject({ name: 'cm', confined: true });
  terminalProjects.push(project);
  return { project, terminal: true };
}

/** `fgos run --unit` as the terminal harness starts it, wrapped to look like the direct harness's run handle. */
function startTerminalRun(project, id) {
  const run = project.startFgosRun({ unit: { id } });
  return { child: run.child, exited: run.exited, output: run.output };
}

function startTerminalResume(project, unitRunId) {
  const child = spawn(process.execPath, [BIN_FGOS, 'run', '--resume', unitRunId, '--dir', project.repoDir], { cwd: project.repoDir, env: { ...project.env(), HERDR_ENV: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  project.children.push(child);
  return { child, exited: new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal }))), output: () => ({ stdout, stderr }) };
}

/** The agent's work for a read-only unit: its report, then the result claim that ends the round (a rename, so a reader never sees half of it). */
function writeClaim(brief) {
  const claimPath = /(\S*outbox\/result-1\.json)/.exec(brief)?.[1];
  if (!claimPath) throw new Error(`the brief names no result path:\n${brief}`);
  fs.mkdirSync(path.dirname(claimPath), { recursive: true });
  fs.writeFileSync(path.join(path.dirname(claimPath), 'report-1.md'), '# Report\nThe assigned work was inspected and completed with a full explanation of what was checked.\n');
  fs.writeFileSync(`${claimPath}.tmp`, JSON.stringify({ status: 'done', summary: 'inspected', assessment: { verdict: 'pass' } }));
  fs.renameSync(`${claimPath}.tmp`, claimPath);
}

/** Play the agent of every brief typed after the first `seen` keystrokes, until `done` resolves. */
async function playAgentUntil(project, seen, done) {
  let finished = false;
  done.then(() => { finished = true; });
  while (!finished) {
    const sent = project.sent();
    if (sent.length >= seen + 2) {
      const brief = sent[seen].text;
      seen += 2;
      project.briefTaken();
      writeClaim(brief);
      project.letAgentExit();
    }
    await sleep(50);
  }
}

const terminalAttempts = (project) => project.attemptDirs();

const TERMINAL_CRASH = {
  'no-binding': {
    attempt: ({ project }, id) => holdAndKillTerminal({ project }, id, supervisorProcess),
    confirm: (ctx, dir) => exists(dir, 'envelope.json') && !exists(dir, 'supervisor-binding.json') && !published(dir, 'receipt.json') && attemptLockFree(ctx.project.repoDir, dir),
  },
  'binding-no-gate-exit': {
    async attempt({ project }, id) {
      const run = startTerminalRun(project, id);
      let dir = null;
      await killOnFile({
        appears: () => { dir = terminalAttempts(project).find((d) => bindingPids(d).length === 2) ?? null; return dir; },
        targets: () => [run.child.pid, ...bindingPids(dir)],
      });
      await run.exited;
      if (dir) await waitGone(bindingPids(dir));
      return dir;
    },
    confirm: (ctx, dir) => !published(dir, 'gate-exit.json') && !published(dir, 'receipt.json'),
  },
  // Supervisor and controller die after the brief was confirmed; the agent ends its work and the orphaned gate ends the domain alone.
  'gate-exit-no-receipt': {
    async attempt({ project }, id) {
      const run = startTerminalRun(project, id);
      const brief = await project.waitBriefTyped();
      project.briefTaken();
      await waitUntil(() => (project.agentStarts().length ? true : null), { what: 'the agent to start' });
      const dir = await waitUntil(() => terminalAttempts(project).find((d) => bindingPids(d).length === 2), { what: 'the binding' });
      // The confirm loop looks once per poll; after this the brief is confirmed and delivery is on record.
      await sleep(4_000);
      const victims = [run.child.pid, bindingPids(dir)[0]];
      signalPids(victims);
      await run.exited;
      await waitGone(victims);
      writeClaim(brief);
      await waitUntil(() => published(dir, 'gate-exit.json') && attemptLockFree(project.repoDir, dir), { timeoutMs: 120_000, what: 'the orphaned gate to end the domain and let go of the lock' });
      return dir;
    },
    confirm: (ctx, dir) => !published(dir, 'receipt.json'),
  },
  'settled-no-result': {
    async attempt({ project }, id) {
      const dir = await holdStepAndKill(project, startTerminalRun, id, 'settle-attempt', (run) => playAgentUntil(project, 0, run.exited));
      return dir && settleControlAsTheStepDid(dir) ? dir : null;
    },
    confirm: (ctx, dir) => published(dir, 'receipt.json') && !exists(dir, 'result.json') && !exists(dir, 'steps/settle-attempt.json') && controlSettled(dir),
  },
  'receipt-not-settled': {
    attempt: ({ project }, id) => holdStepAndKill(project, startTerminalRun, id, 'settle-attempt', (run) => playAgentUntil(project, 0, run.exited)),
    confirm: (ctx, dir) => published(dir, 'receipt.json') && !exists(dir, 'result.json') && !exists(dir, 'steps/settle-attempt.json'),
  },
  'result-no-finalize': {
    attempt: ({ project }, id) => holdStepAndKill(project, startTerminalRun, id, 'finalize-home', (run) => playAgentUntil(project, 0, run.exited)),
    confirm: (ctx, dir) => exists(dir, 'result.json') && exists(dir, 'steps/settle-attempt.json') && !exists(dir, 'steps/finalize-home.json'),
  },
  // The slot is released by the supervisor itself after the last step: its herdr call is frozen on the way.
  'release-slot-pending': {
    attempt: ({ project }, id) => holdStepAndKill(project, startTerminalRun, id, () => (args) => args.includes('pane') && args.includes('close'), (run) => playAgentUntil(project, 0, run.exited)),
    confirm: (ctx, dir) => exists(dir, 'steps/finalize-home.json') && !exists(dir, 'steps/release-slot.json') && ctx.project.callsStarting('pane close').length === 0,
  },
  'all-steps-no-closed': {
    async attempt({ project }, id) {
      const run = startTerminalRun(project, id);
      let dir = null;
      const play = playAgentUntil(project, 0, run.exited);
      await killOnFile({
        appears: () => { dir = terminalAttempts(project).find((d) => exists(d, 'steps/release-slot.json')) ?? null; return dir; },
        targets: () => [run.child.pid, ...bindingPids(dir)],
        timeoutMs: 120_000,
      });
      await run.exited;
      await play;
      if (dir) await waitGone(bindingPids(dir));
      return dir;
    },
    confirm: (ctx, dir) => exists(dir, 'steps/release-slot.json') && !exists(dir, 'closed.json'),
  },
};

/** Play the agent while `run` lives, freeze the process `matchOf(dir)` names, then kill it with the controller and supervisor. */
async function holdAndKillTerminal({ project }, id, matchOf, playAgent = false) {
  const run = startTerminalRun(project, id);
  const play = playAgent ? playAgentUntil(project, 0, run.exited) : Promise.resolve();
  const dir = await waitUntil(() => terminalAttempts(project)[0], { timeoutMs: 120_000, what: 'the attempt directory' });
  const frozen = await freezeChildOf({ parent: run.child.pid, match: matchOf(dir), timeoutMs: 60_000 });
  const victims = [run.child.pid, ...bindingPids(dir), ...(frozen ?? [])];
  signalPids(victims);
  await run.exited;
  await play;
  await waitGone(victims);
  return frozen ? dir : null;
}


// --- what every row must end in -----------------------------------------------------------------------

/** What the attempt becomes when adopt finishes it, per row (the same in both modes). */
const EXPECT = {
  'no-binding': { code: 0, attempts: 2, receipt: 'abandoned-not-started' },
  // The gate died with the supervisor: whatever the agent did cannot be told, so the attempt settles as lost and the unit fails.
  'binding-no-gate-exit': { failed: true, attempts: 1, receipt: 'gate-lost' },
  'gate-exit-no-receipt': { code: 0, attempts: 1, receipt: 'exited' },
};
const expectFor = (row) => EXPECT[row] ?? { code: 0, attempts: 1 };

const MODES = {
  direct: {
    skip: skipDirect,
    rows: DIRECT_CRASH,
    make: async () => directProject(),
    attempts: ({ project }) => project.attemptDirs(),
    agentStarts: ({ project }) => project.attemptDirs().reduce((n, d) => n + startsOf(d).length, 0),
    paneCloses: () => null,
    startResume: ({ project }) => startResume(project, unitRunIdOf(project)),
    adoptEnv: ({ project }) => project.env,
    unitDir: ({ project }) => unitDirOf(project),
    homesLeft: ({ project }) => project.homesLeft(),
    playWhile: () => Promise.resolve(),
  },
  terminal: {
    skip: skipTerminal,
    rows: TERMINAL_CRASH,
    make: terminalCtx,
    attempts: ({ project }) => project.attemptDirs(),
    // A confined agent's own notes go with its private home; each agent launch is one `pane run` (excluding handshake probes).
    agentStarts: ({ project }) => (project.paneRuns ? project.paneRuns().length : project.callsStarting('pane run').filter((c) => !c.includes("printf '%s%s\\n' fgos-ok-")).length),
    paneCloses: ({ project }) => project.callsStarting('pane close').length,
    startResume: ({ project }) => startTerminalResume(project, unitRunIdOf(project)),
    adoptEnv: ({ project }) => ({ ...project.env(), HERDR_ENV: '1' }),
    unitDir: ({ project }) => path.join(project.repoDir, '.fgos', 'assignments', unitRunIdOf(project)),
    homesLeft: () => [],
    // The resume may start a new attempt: its agent is played here, from the keystrokes seen so far.
    playWhile: (ctx, done) => playAgentUntil(ctx.project, ctx.project.sent().length, done),
  },
};

/** `fgos internal adopt` for one attempt as its own process, so two of them can race. */
function spawnAdopt(dir, env) {
  const child = spawn(REAL_HOST, ['internal', 'adopt', '--protocol', '1', '--run-dir', dir], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (chunk) => { out += chunk; });
  return new Promise((resolve) => child.on('exit', (code) => resolve({ code, answer: (() => { try { return JSON.parse(out.trim().split('\n').pop()); } catch { return null; } })() })));
}

// A kill during the publish of a receipt can leave its temp file behind (a dot name); it is not a receipt.
const stepReceipts = (dir) => (exists(dir, 'steps') ? fs.readdirSync(here(dir, 'steps')).filter((n) => !n.startsWith('.')).sort() : []);

for (const [modeName, mode] of Object.entries(MODES)) {
  for (const [row, def] of Object.entries(mode.rows)) {
    const expect = expectFor(row);
    test(`${modeName}: ${row}: --resume takes the attempt through adopt to the unit summary, the agent runs once`, { skip: mode.skip, timeout: 600_000 }, async () => {
      const ctx = await crashUntilAsync(row, mode.make, def.attempt, def.confirm);
      const { dir } = ctx;
      const resume = mode.startResume(ctx);
      const play = mode.playWhile(ctx, resume.exited);
      const { code } = await resume.exited;
      await play;
      const state = { code, attempts: mode.attempts(ctx).length, agentStarts: mode.agentStarts(ctx), closes: mode.paneCloses(ctx), stderr: resume.output().stderr.slice(0, 600) };
      if (expect.failed) assert.notEqual(code, 0, JSON.stringify(state)); else assert.equal(code, 0, JSON.stringify(state));
      assert.ok(exists(mode.unitDir(ctx), 'unit-summary.json'), `the unit ran to its summary: ${JSON.stringify(state)}`);
      assert.equal(mode.attempts(ctx).length, expect.attempts, `attempts of the unit: ${JSON.stringify(state)}`);
      if (expect.receipt) assert.equal(readJson(here(dir, 'receipt.json')).outcome, expect.receipt);
      if (expect.failed) assert.ok(mode.agentStarts(ctx) <= 1, JSON.stringify(state));
      else assert.equal(mode.agentStarts(ctx), 1, `the agent ran once across every attempt of the unit: ${JSON.stringify(state)}`);
      if (mode.paneCloses(ctx) !== null && !expect.failed) assert.equal(mode.paneCloses(ctx), 1, `the pane closed once: ${JSON.stringify(state)}`);
      assert.ok(exists(dir, 'closed.json'), 'the crashed attempt is closed');
      assert.deepEqual(stepReceipts(dir).filter((n) => n !== 'settle-attempt.json' && n !== 'finalize-home.json' && n !== 'cleanup-trust.json' && n !== 'release-slot.json'), [], 'only the named steps left receipts');
      assert.deepEqual(mode.homesLeft(ctx), [], 'every private home is gone');
    });

    if (row === 'no-binding') continue;
    test(`${modeName}: ${row}: two adopters at once, one adopts and the side effects happen once`, { skip: mode.skip, timeout: 600_000 }, async () => {
      const ctx = await crashUntilAsync(row, mode.make, def.attempt, def.confirm);
      const { dir } = ctx;
      const env = mode.adoptEnv(ctx);
      const [a, b] = await Promise.all([spawnAdopt(dir, env), spawnAdopt(dir, env)]);
      const states = [a.answer?.state, b.answer?.state].sort();
      assert.equal(states.filter((st) => st === 'adopted' || st === 'closed').length >= 1, true, JSON.stringify([a, b]));
      assert.ok(states.filter((st) => st === 'adopted').length <= 1, `at most one adopter adopted: ${JSON.stringify([a, b])}`);
      await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 60_000, what: 'the attempt to close' });
      const receipts = stepReceipts(dir);
      assert.ok(receipts.includes('settle-attempt.json') && receipts.includes('finalize-home.json'), receipts.join(','));
      assert.equal(adoptRun(dir, {}).state, 'closed');
    });
  }

  test(`${modeName}: a resume after adopt already closed the attempt uses its result and adopts nothing again`, { skip: mode.skip, timeout: 600_000 }, async () => {
    const row = 'gate-exit-no-receipt';
    const ctx = await crashUntilAsync(row, mode.make, mode.rows[row].attempt, mode.rows[row].confirm);
    const { dir } = ctx;
    const env = mode.adoptEnv(ctx);
    await spawnAdopt(dir, env);
    await waitUntil(() => exists(dir, 'closed.json'), { timeoutMs: 60_000, what: 'adopt to close the attempt' });
    const before = Object.fromEntries(['receipt.json', 'result.json', 'closed.json', ...stepReceipts(dir).map((n) => `steps/${n}`)].map((n) => [n, fs.readFileSync(here(dir, n), 'utf8')]));
    const resume = mode.startResume(ctx);
    const play = mode.playWhile(ctx, resume.exited);
    const { code } = await resume.exited;
    await play;
    assert.equal(code, 0, resume.output().stderr);
    assert.ok(exists(mode.unitDir(ctx), 'unit-summary.json'));
    assert.equal(mode.attempts(ctx).length, 1, 'no second attempt');
    assert.equal(mode.agentStarts(ctx), 1, 'the agent did not run again');
    for (const [name, text] of Object.entries(before)) assert.equal(fs.readFileSync(here(dir, name), 'utf8'), text, `${name} was left as adopt wrote it`);
  });
}
