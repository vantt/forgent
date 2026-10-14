// test/runner/loop-rununit.test.mjs — the runner loop runs each Work item's worker as one Unit
// run (runUnit): the Unit record exists, the runner (never the worker) commits, the dispatch
// event names the run, and runUnit's own outcomes (a refused launch, a provider limit, a
// governance refusal) reach the loop's recovery matrix. Workers are real confined processes.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { initStore, addWork, moveWork, listWork, readRawEvents } from '../../src/state/store.mjs';
import { runOnce } from '../../src/runner/loop.mjs';
import { confinedRunnerConfig, persistRunnerConfig, unitRuns, countWorkerRuns } from './loop-worker-fixture.helper.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

// Provider capacity state and account inventory live under HOME: keep them off the real one.
const previousHome = process.env.HOME;
process.env.HOME = makeFixtureDir('fgos-loop-rununit-home-');
after(() => {
  if (previousHome === undefined) delete process.env.HOME;
  else process.env.HOME = previousHome;
});

const noLog = () => {};
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function setup() {
  const repoRoot = fs.realpathSync(makeFixtureDir('fgos-loop-rununit-repo-'));
  git(repoRoot, 'init', '-q', '-b', 'main');
  git(repoRoot, 'config', 'user.email', 'test@example.com');
  git(repoRoot, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git(repoRoot, 'add', 'seed.txt');
  git(repoRoot, 'commit', '-q', '-m', 'init');
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  const scriptDir = fs.realpathSync(makeFixtureDir('fgos-loop-rununit-exec-'));
  const worktreeDir = fs.realpathSync(makeFixtureDir('fgos-loop-rununit-wt-'));
  return { repoRoot, dir, scriptDir, worktreeDir };
}

function seedItem(dir, overrides = {}) {
  const item = {
    id: 'item-x', title: 'Produce the output file', kind: 'feature', status: 'todo',
    deps: [], risk: 'light', refs: [], verify: 'test -f output.txt', ...overrides,
  };
  addWork(dir, item);
  return item;
}

function writeWorker(scriptDir, name, body) {
  const scriptPath = path.join(scriptDir, `${name}.mjs`);
  fs.writeFileSync(scriptPath, `import fs from 'node:fs';\n${body}\n`);
  return scriptPath;
}

const PRODUCING = `fs.writeFileSync('output.txt', 'produced\\n');\nprocess.stdout.write('worker done\\n');`;
// The real codex ending of a round cut off by the account's usage limit.
const LIMITED = `const line = 'ERROR: You\\u2019ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:39 PM.';
process.stderr.write(line + '\\n' + line + '\\ntokens used\\n379,854\\n');
process.exit(1);`;

const executorFor = (scriptPath, family = 'node') => ({
  kind: 'agent', allowCrossProvider: true, providerModel: family,
  command: process.execPath, args: [scriptPath, family, '{prompt}'],
});

const modelPolicies = (...families) => Object.fromEntries(families.map((f) => [f, { nano: 'fake', mini: 'fake', standard: 'fake', advanced: 'fake', flagship: 'fake', frontier: 'fake' }]));

/** Run the loop once with `config` on disk (runUnit reads it there) and in memory. */
async function runLoop({ repoRoot, worktreeDir }, config) {
  const confined = confinedRunnerConfig({ timeoutMs: 30000, ...config });
  persistRunnerConfig(repoRoot, confined);
  return runOnce({ repoRoot, config: confined, worktreeDir, log: noLog });
}

test('a loop worker runs as a Unit run: the run records the item, the runner commits, and the dispatch event and worker log name the run', async () => {
  const fx = setup();
  seedItem(fx.dir, { id: 'item-unit' });
  const script = writeWorker(fx.scriptDir, 'producing', PRODUCING);

  const result = await runLoop(fx, { executors: { 'fgos-coding-implement': executorFor(script) }, modelPolicies: modelPolicies('node') });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const [run, ...rest] = unitRuns(fx.repoRoot);
  assert.equal(rest.length, 0, 'one item, one Unit run');
  assert.equal(run.record.unit.id, 'work-item-unit-executing');
  assert.deepEqual(run.record.unit.writes, ['**']);
  assert.ok(run.record.worktree.startsWith(path.join(fx.worktreeDir, 'item-unit')), 'the Unit ran in the item worktree');
  const attempt = run.record.bindings['producer/1'][0];
  assert.equal(attempt.commit.status, 'committed', 'the runner committed inside the Unit run');
  assert.deepEqual(attempt.commit.files, ['output.txt']);
  assert.equal(git(fx.repoRoot, 'rev-parse', 'fgw/item-unit'), attempt.commit.sha, 'the branch tip is the runner commit');

  const event = readRawEvents(fx.dir).find((e) => e.type === 'executor.dispatch');
  assert.equal(event.payload.unitRunId, run.unitRunId);
  assert.equal(event.payload.executorId, 'fgos-coding-implement');
  const log = fs.readFileSync(path.join(fx.dir, 'logs', 'item-unit.log'), 'utf8');
  assert.match(log, new RegExp(`unit run ${run.unitRunId}`));
  assert.match(log, /worker done/, 'the worker stdout reached the item log');
});

test('the human feedback of an item rides into the Unit objective', async () => {
  const fx = setup();
  // A rejected proposal: back to todo with the reviewer's reason.
  seedItem(fx.dir, { id: 'item-feedback', status: 'awaiting-approval' });
  moveWork(fx.dir, { id: 'item-feedback', to: 'todo', expectedStatus: 'awaiting-approval', reason: 'the first proposal used the wrong file name', role: 'human' });
  const script = writeWorker(fx.scriptDir, 'producing', PRODUCING);

  await runLoop(fx, { executors: { 'fgos-coding-implement': executorFor(script) }, modelPolicies: modelPolicies('node') });

  const [run] = unitRuns(fx.repoRoot);
  assert.match(run.record.unit.objective, /# Human feedback/);
  assert.match(run.record.unit.objective, /the first proposal used the wrong file name/);
});

test('an index someone else staged in the worktree refuses the launch before the worker spawns: worktree-fail, then the retry starts clean', async () => {
  const fx = setup();
  seedItem(fx.dir, { id: 'item-staged' });
  // Checking out a new worktree stages a stray file before the runner launches anything. The
  // retry resets the worktree to its dispatch baseline, which clears that index.
  const hooks = fs.realpathSync(makeFixtureDir('fgos-loop-rununit-hooks-'));
  fs.writeFileSync(path.join(hooks, 'post-checkout'), '#!/bin/sh\necho stray > stray.txt\ngit add stray.txt\n');
  fs.chmodSync(path.join(hooks, 'post-checkout'), 0o755);
  git(fx.repoRoot, 'config', 'core.hooksPath', hooks);
  const script = writeWorker(fx.scriptDir, 'producing', PRODUCING);

  const result = await runLoop(fx, { executors: { 'fgos-coding-implement': executorFor(script) }, modelPolicies: modelPolicies('node') });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].attempts, 2, 'the refused launch counted as one failed attempt');
  assert.equal(countWorkerRuns(fx.repoRoot), 1, 'the refused launch never started a worker');
  const [refused] = unitRuns(fx.repoRoot);
  assert.equal(refused.record.settlement.outcome, 'policy-refusal');
  const log = fs.readFileSync(path.join(fx.dir, 'logs', 'item-staged.log'), 'utf8');
  assert.match(log, /worktree-fail/);
  assert.match(log, /index holds changes the runner did not stage/);
  assert.equal(git(fx.repoRoot, 'log', '--format=%s', 'main..fgw/item-staged').split('\n').length, 1);
  assert.equal(git(fx.repoRoot, 'show', '--format=', '--name-only', 'fgw/item-staged'), 'output.txt', 'the stray staged file never entered the commit');
});

test('a provider limit on the first candidate moves the worker to the next candidate of the pool, and the event records the executor that really ran', async () => {
  const fx = setup();
  seedItem(fx.dir, { id: 'item-limit' });
  const limited = writeWorker(fx.scriptDir, 'limited', LIMITED);
  const producing = writeWorker(fx.scriptDir, 'producing', PRODUCING);

  const result = await runLoop(fx, {
    executors: { spent: executorFor(limited, 'spentquota'), beta: executorFor(producing, 'beta') },
    capabilities: { 'code:implement': { prefer: [{ executor: 'spent' }, { executor: 'beta' }] } },
    modelPolicies: modelPolicies('spentquota', 'beta'),
  });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const [run] = unitRuns(fx.repoRoot);
  assert.deepEqual(run.record.bindings['producer/1'].map((a) => [a.binding.executor, a.outcome]), [['spent', 'provider-limit'], ['beta', 'pass']]);
  const event = readRawEvents(fx.dir).find((e) => e.type === 'executor.dispatch');
  assert.equal(event.payload.executorId, 'beta');
});

test('every candidate at its provider limit parks the item as provider-limit and keeps the runner alive', async () => {
  const fx = setup();
  seedItem(fx.dir, { id: 'item-all-limited' });
  const limited = writeWorker(fx.scriptDir, 'limited', LIMITED);

  const result = await runLoop(fx, {
    executors: { spent: executorFor(limited, 'spentquota') },
    capabilities: { 'code:implement': { prefer: [{ executor: 'spent' }] } },
    modelPolicies: modelPolicies('spentquota'),
  });

  assert.equal(result.exitCode, 0, 'a provider limit is not a reason to halt the runner');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'provider-limit');
  assert.equal(result.dispatched[0].attempts, 1, 'retrying now would meet the same limits');
  assert.equal(listWork(fx.dir).work['item-all-limited'].status, 'blocked');
});

test('an executor governance blocks is passed over for the next candidate, and the event records that one', async () => {
  const fx = setup();
  seedItem(fx.dir, { id: 'item-governed' });
  const producing = writeWorker(fx.scriptDir, 'producing', PRODUCING);

  const result = await runLoop(fx, {
    executors: { 'fgos-coding-implement': executorFor(producing), beta: executorFor(producing, 'beta') },
    capabilities: { 'code:implement': { prefer: [{ executor: 'beta' }] } },
    governance: { disallowedExecutors: ['fgos-coding-implement'] },
    modelPolicies: modelPolicies('node', 'beta'),
  });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const event = readRawEvents(fx.dir).find((e) => e.type === 'executor.dispatch');
  assert.equal(event.payload.executorId, 'beta', 'the step preferred fgos-coding-implement; governance refused it; beta ran');
});
