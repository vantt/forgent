import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { fanoutBatchExecutorCli } from '../../src/runner/fanout-batch.mjs';
import { initStore, addWork, listWork } from '../../src/state/store.mjs';

// The fan-out batch picks an item, runs the worker in its worktree and then
// `fgos return`s it. The worker only edits files; the runner commits them
// before return, which demands an advanced branch.

const FANOUT_ENTRY = fileURLToPath(new URL('../../src/runner/fanout-batch.mjs', import.meta.url));

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fanout-commit-'));
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
      runner: {
        executor: { command: '/global/executor', args: ['{prompt}'] },
        executors: { 'fgos-coding-implement': { kind: 'agent', command: process.execPath, args: [scriptPath], allowCrossProvider: true } },
        modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
        timeoutMs: 5000,
      },
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

test('fanout batch: a worker that only edits files is committed by the runner, so return advances the item', async () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    fs.writeFileSync('output.txt', 'produced\\n');
  `);

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired.length, 1);
  assert.equal(result.fired[0].errorClass, null);
  assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');
  assert.equal(branchSubjects(repoRoot), 'chore(cand1): Produce the file');
});

test('fanout batch: a worker that committed itself is not committed twice', async () => {
  const { repoRoot, fgosDir } = setup(`
    import fs from 'node:fs';
    import { execFileSync, spawnSync } from 'node:child_process';
    fs.writeFileSync('output.txt', 'produced\\n');
    execFileSync('git', ['add', 'output.txt']);
    execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);
  `);

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired[0].errorClass, null);
  assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');
  assert.equal(branchSubjects(repoRoot), 'worker: output.txt');
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
  assert.notEqual(result.fired[0].status, 0);
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
  assert.deepEqual(result.fired.map((f) => [f.id, f.errorClass]), [['cand1', null]]);
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
  assert.deepEqual(result.fired.map((f) => [f.id, f.errorClass]), [['cand1', null]]);
  assert.equal(listWork(fgosDir).work.cand1.status, 'awaiting-approval');
});
