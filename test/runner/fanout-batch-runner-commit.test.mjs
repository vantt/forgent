import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { fanoutBatchExecutorCli } from '../../src/runner/fanout-batch.mjs';
import { initStore, addWork, listWork } from '../../src/state/store.mjs';
import { confinedRunnerConfig } from './loop-worker-fixture.helper.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

// The fan-out batch picks an item, runs its worker as one Unit run (runUnit) in
// the item's worktree and then `fgos return`s it. The worker runs confined and
// only edits files; the Unit run commits them before return, which demands an
// advanced branch.

const FANOUT_ENTRY = fileURLToPath(new URL('../../src/runner/fanout-batch.mjs', import.meta.url));

seedFileLocalBwrapRegistry();

// Outside /tmp: a confined worker sees a private tmpfs there.
function mkTempDir() {
  return fs.realpathSync(makeFixtureDir('fgos-fanout-commit-'));
}

function mkRepo() {
  const repoRoot = mkTempDir();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir);
  initStore(fgosDir);
  return { repoRoot, fgosDir };
}

function setup(workerBody) {
  const { repoRoot, fgosDir } = mkRepo();
  const scriptPath = path.join(mkTempDir(), 'worker.mjs');
  fs.writeFileSync(scriptPath, workerBody);
  fs.writeFileSync(
    path.join(fgosDir, 'config.json'),
    JSON.stringify({
      runner: confinedRunnerConfig({
        executor: { command: '/global/executor', args: ['{prompt}'] },
        executors: { 'fgos-coding-implement': { kind: 'agent', command: process.execPath, args: [scriptPath], allowCrossProvider: true } },
        modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
        timeoutMs: 20000,
      }),
    }),
  );
  addWork(fgosDir, {
    id: 'cand1',
    title: 'Produce the file',
    kind: 'task',
    status: 'todo',
    domain: 'coding',
    workflowStep: 'executing',
    deps: [],
    refs: [],
    risk: 'light',
    verify: 'test -f output.txt',
  });
  return { repoRoot, fgosDir };
}

function branchSubjects(repoRoot) {
  return execFileSync('git', ['log', '--format=%s', 'main..fgw/cand1'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

test('fanout batch: a worker that only edits files is committed by its Unit run, so return advances the item', async () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    fs.writeFileSync('output.txt', 'produced\\n');
  `);

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired.length, 1);
  const [fired] = result.fired;
  assert.equal(fired.id, 'cand1');
  assert.match(fired.unitRunId, /^unit-run-/);
  assert.ok(fs.existsSync(path.join(fgosDir, 'assignments', fired.unitRunId, 'unit.json')), 'the fired entry names a real Unit run');
  assert.equal(fired.outcome, 'pass');
  assert.equal(fired.commit.status, 'committed');
  assert.equal(fired.errorClass, undefined);
  assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');
  assert.equal(branchSubjects(repoRoot), 'chore(work-cand1-executing): producer changes');
  assert.equal(execFileSync('git', ['rev-parse', 'fgw/cand1'], { cwd: repoRoot, encoding: 'utf8' }).trim(), fired.commit.sha, 'return judged the Unit run commit');
});

test('fanout batch: a worker cannot commit itself (its git dir is read-only), so the round fails and the item returns blocked', async () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    import { execFileSync, spawnSync } from 'node:child_process';
    fs.writeFileSync('output.txt', 'produced\\n');
    execFileSync('git', ['add', 'output.txt']);
    execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);
  `);

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired[0].outcome, 'execution-failure');
  assert.match(result.fired[0].unitRunId, /^unit-run-/);
  assert.equal(listWork(fgosDir).work.cand1.status, 'blocked', 'never left claimed in doing');
  assert.equal(branchSubjects(repoRoot), '', 'no commit landed');
});

test('fanout batch: a failing runner commit returns the item blocked, never left claimed', async () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    fs.writeFileSync('output.txt', 'produced\\n');
  `);
  const hook = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\necho rejected-by-hook >&2\nexit 1\n');
  fs.chmodSync(hook, 0o755);

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired.length, 1);
  assert.equal(result.fired[0].outcome, 'execution-failure');
  assert.equal(result.fired[0].commit.status, 'failed', 'the Unit run commit was refused by the hook');
  assert.equal(listWork(fgosDir).work.cand1.status, 'blocked');
});

test('fanout batch runs from its own node entry: `node src/runner/fanout-batch.mjs "<ids>"` prints the same result JSON', () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    fs.writeFileSync('output.txt', 'produced\\n');
  `);
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  const out = spawnSync(process.execPath, [FANOUT_ENTRY, 'cand1'], { cwd: repoRoot, encoding: 'utf8', env });

  assert.equal(out.status, 0, out.stderr);
  const result = JSON.parse(out.stdout.trim().split('\n').at(-1));
  assert.deepEqual(result.fired.map((f) => [f.id, f.outcome, f.commit?.status]), [['cand1', 'pass', 'committed']]);
  assert.deepEqual(result.deferred, []);
  assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');
});

test('fanout batch node entry with no candidate ids is a usage error, not an empty batch', () => {
  const out = spawnSync(process.execPath, [FANOUT_ENTRY], { cwd: mkTempDir(), encoding: 'utf8' });
  assert.equal(out.status, 1);
  assert.match(out.stderr, /usage: node src\/runner\/fanout-batch\.mjs "<id>,<id>\.\.\." \[--has-live-task-access\]/);
});

test('the fanout command the fgos-fanout skill teaches runs as written: node src/runner/fanout-batch.mjs "<ids>" --has-live-task-access', () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    fs.writeFileSync('output.txt', 'produced\\n');
  `);
  const skill = fs.readFileSync(fileURLToPath(new URL('../../core/skills/fgos-fanout/references/wave-dispatch-mechanics.md', import.meta.url)), 'utf8');
  assert.match(skill, /^node src\/runner\/fanout-batch\.mjs "<batch-comma-separated>" --has-live-task-access$/m);
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;

  const out = spawnSync(process.execPath, [FANOUT_ENTRY, 'cand1', '--has-live-task-access'], { cwd: repoRoot, encoding: 'utf8', env });

  assert.equal(out.status, 0, out.stderr);
  const result = JSON.parse(out.stdout.trim().split('\n').at(-1));
  for (const key of ['fired', 'mechanismChanged', 'unavailable', 'deferred']) assert.ok(Array.isArray(result[key]), key);
  assert.deepEqual(result.fired.map((f) => [f.id, f.outcome, f.commit?.status]), [['cand1', 'pass', 'committed']]);
  assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');
});

/** A repo with `executors` (completed with confined invocations) serving the implement step. */
function setupExecutors(executors, items) {
  const { repoRoot, fgosDir } = mkRepo();
  fs.writeFileSync(
    path.join(fgosDir, 'config.json'),
    JSON.stringify({
      runner: confinedRunnerConfig({
        executors,
        capabilities: { 'code:implement': { prefer: Object.keys(executors).map((executor) => ({ executor })) } },
        modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
        timeoutMs: 60000,
      }),
    }),
  );
  for (const item of items) {
    addWork(fgosDir, {
      title: item.id, kind: 'task', status: 'todo', domain: 'coding', workflowStep: 'executing',
      deps: [], refs: [], risk: 'light', verify: 'true', ...item,
    });
  }
  return { repoRoot, fgosDir };
}

const nodeExecutor = (body) => {
  const scriptPath = path.join(mkTempDir(), 'worker.mjs');
  fs.writeFileSync(scriptPath, body);
  return { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true, providerModel: 'node' };
};

test('fanout batch: in one batch a passing item reaches awaiting-approval and a failing one returns blocked, each with its own Unit run', async () => {
  // The worker is told which item it serves by its prompt; one item's worker fails.
  const worker = nodeExecutor(`
    import fs from 'node:fs';
    const prompt = process.argv.slice(2).join(' ');
    if (prompt.includes('cand-fail')) { console.error('fatal executor failure'); process.exit(1); }
    fs.writeFileSync('output.txt', 'produced\\n');
  `);
  const { repoRoot, fgosDir } = setupExecutors({ 'fgos-coding-implement': worker }, [{ id: 'cand-ok' }, { id: 'cand-fail' }]);

  const result = await fanoutBatchExecutorCli(['cand-ok', 'cand-fail'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired.length, 2);
  const ok = result.fired.find((e) => e.id === 'cand-ok');
  const failed = result.fired.find((e) => e.id === 'cand-fail');
  assert.equal(ok.outcome, 'pass');
  assert.equal(failed.outcome, 'execution-failure');
  assert.notEqual(ok.unitRunId, failed.unitRunId);
  const view = listWork(fgosDir);
  assert.equal(view.work['cand-ok'].status, 'awaiting-approval');
  assert.equal(view.work['cand-fail'].status, 'blocked', 'a failed worker is settled blocked, never left in doing');
});

test('fanout batch: the batch runs its candidates concurrently -- each worker sees the other\'s Unit run before it finishes', async () => {
  // Concurrency is proven by a rendezvous, not by how long a sleep lasts: a Unit run's directory
  // exists before its worker starts and the run settles only after the worker exits, so a worker
  // that sees two Unit runs in flight while it is still running proves the other one is in
  // flight too. Sequential fan-out never shows a worker more than its own.
  const worker = nodeExecutor(`
    import fs from 'node:fs';
    const assignments = process.env.FGOS_TEST_ASSIGNMENTS;
    const inFlight = () => fs.readdirSync(assignments).filter((n) => n.startsWith('unit-run-')).length;
    const giveUpAt = Date.now() + 30000;
    while (inFlight() < 2 && Date.now() < giveUpAt) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    fs.writeFileSync('output.txt', 'produced\\n');
    process.stdout.write('sawPeer=' + (inFlight() >= 2) + '\\n');
  `);
  const { repoRoot, fgosDir } = setupExecutors({ 'fgos-coding-implement': worker }, [{ id: 'cand1' }, { id: 'cand2' }]);
  const prior = process.env.FGOS_TEST_ASSIGNMENTS;
  process.env.FGOS_TEST_ASSIGNMENTS = path.join(fgosDir, 'assignments');
  let result;
  try {
    result = await fanoutBatchExecutorCli(['cand1', 'cand2'], { repoRoot, hasLiveTaskAccess: false });
  } finally {
    if (prior === undefined) delete process.env.FGOS_TEST_ASSIGNMENTS;
    else process.env.FGOS_TEST_ASSIGNMENTS = prior;
  }

  assert.equal(result.fired.length, 2);
  for (const fired of result.fired) {
    assert.equal(fired.outcome, 'pass', JSON.stringify(fired));
    const stdout = fs.readFileSync(path.join(fgosDir, 'assignments', fired.unitRunId, 'producer', '1', 'runs', '01', 'stdout.log'), 'utf8');
    assert.match(stdout, /sawPeer=true/, `${fired.id}'s worker saw the other run in flight`);
  }
});
