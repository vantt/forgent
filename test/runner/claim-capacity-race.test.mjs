import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initStore, addWork } from '../../src/state/store.mjs';
import { readClaim, readClaims, releaseClaim } from '../../src/state/runtime-coordination.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';
import { createLockScope } from '../../src/holder-lock/index.mjs';
import { withMainCheckout } from '../../src/runner/repo-locks.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

const CLAIM_PORT_URL = new URL('../../src/runner/claim-port.mjs', import.meta.url).href;
const ROUNDS = 30;

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-capacity-'));
  const git = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git('add', 'seed.txt');
  git('commit', '-q', '-m', 'init');
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  return { repoRoot, dir, git };
}

function addTodo(dir, id) {
  addWork(dir, { id, title: id, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
}

// One real process that claims `id` and prints the outcome as one JSON line.
// It waits for `goPath` to appear so both claimants start together.
function claimInChild({ dir, repoRoot, id, isolate = false, goPath }) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    const { claimWork } = await import(${JSON.stringify(CLAIM_PORT_URL)});
    while (${JSON.stringify(goPath ?? '')} && !fs.existsSync(${JSON.stringify(goPath ?? '')})) await new Promise((r) => setTimeout(r, 2));
    try {
      const claim = await claimWork(${JSON.stringify(dir)}, { id: ${JSON.stringify(id)}, actor: 'session', isolate: ${isolate}, repoRoot: ${JSON.stringify(repoRoot)}, waitMs: 20000 });
      console.log(JSON.stringify({ ok: true, claim }));
    } catch (err) {
      console.log(JSON.stringify({ ok: false, code: err.code, occupied: err.occupied, ceiling: err.ceiling, message: err.message }));
    }
  `], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CLAUDE_CODE_SESSION_ID: '', FGOS_SESSION_ID: `race-${id}-${Math.random().toString(36).slice(2)}` } });
  let out = '';
  let err = '';
  child.stdout.on('data', (b) => { out += b; });
  child.stderr.on('data', (b) => { err += b; });
  const done = new Promise((resolve) => child.once('exit', (code) => {
    try {
      resolve(JSON.parse(out.trim().split('\n').pop()));
    } catch {
      resolve({ ok: false, code: `child-exit-${code}`, message: `${out}\n${err}` });
    }
  }));
  return { child, done };
}

async function waitFor(predicate, what, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) assert.fail(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}

test('two processes claiming the last worker slot: exactly one wins, the other gets worker-slot-ceiling', { skip: HOOK_TEST_SKIP }, async () => {
  const { repoRoot, dir } = initRepo();
  writeSharedConfig(repoRoot, { workerSlots: { ceiling: 1 } });
  addTodo(dir, 'item-a');
  addTodo(dir, 'item-b');

  for (let round = 0; round < ROUNDS; round += 1) {
    const goPath = path.join(repoRoot, `go-${round}`);
    const a = claimInChild({ dir, repoRoot, id: 'item-a', goPath });
    const b = claimInChild({ dir, repoRoot, id: 'item-b', goPath });
    await new Promise((r) => setTimeout(r, 150));
    fs.writeFileSync(goPath, 'go');
    const [ra, rb] = await Promise.all([a.done, b.done]);

    const winners = [ra, rb].filter((r) => r.ok);
    const losers = [ra, rb].filter((r) => !r.ok);
    assert.equal(winners.length, 1, `round ${round}: exactly one claim wins, got ${JSON.stringify([ra, rb])}`);
    assert.equal(losers[0].code, 'worker-slot-ceiling', `round ${round}: the loser is refused by the ceiling, got ${JSON.stringify(losers[0])}`);
    assert.equal(losers[0].ceiling, 1);
    assert.equal(Object.keys(readClaims(dir)).length, 1, `round ${round}: one claim on disk`);

    for (const [id, claim] of Object.entries(readClaims(dir))) releaseClaim(dir, { id, claimId: claim.claimId, adminReason: 'reset between rounds' });
  }
});

test('a claim holds neither main nor state while git creates the worktree', { skip: HOOK_TEST_SKIP }, async () => {
  const { repoRoot, dir } = initRepo();
  addTodo(dir, 'item-a');
  const marker = path.join(repoRoot, 'checkout-started');
  const hook = path.join(repoRoot, '.git', 'hooks', 'post-checkout');
  fs.writeFileSync(hook, `#!/bin/sh\ntouch ${JSON.stringify(marker)}\nsleep 1\n`);
  fs.chmodSync(hook, 0o755);

  const claimant = claimInChild({ dir, repoRoot, id: 'item-a', isolate: true });
  await waitFor(() => fs.existsSync(marker), 'git worktree add to start its post-checkout hook');

  // The claim is mid `git worktree add`: another session can take main and
  // write state at once instead of waiting for the checkout to finish.
  const startedAt = Date.now();
  await withMainCheckout(createLockScope('probe'), 'probe', () => 'in', { fgosDir: dir, waitMs: 1 });
  addTodo(dir, 'item-c');
  assert.ok(Date.now() - startedAt < 800, 'main and state were free while the worktree was being created');
  assert.ok(readClaim(dir, 'item-a'), 'the claim was already written when the worktree add started');

  const result = await claimant.done;
  assert.equal(result.ok, true, JSON.stringify(result));
});

test('headAtTake of the claim is the commit the new worktree was created from, even when main moves in between', { skip: HOOK_TEST_SKIP }, async () => {
  const { repoRoot, dir, git } = initRepo();
  addTodo(dir, 'item-a');
  const headAtClaim = git('rev-parse', 'HEAD').trim();

  // Holding worktree-admin stops the claim after its record is written and
  // before git creates the worktree.
  const holder = await holdLockInChild('worktree-admin', { fgosDir: dir });
  const claimant = claimInChild({ dir, repoRoot, id: 'item-a', isolate: true });
  try {
    await waitFor(() => readClaim(dir, 'item-a'), 'the claim record');
    fs.writeFileSync(path.join(repoRoot, 'later.txt'), 'later\n');
    git('add', 'later.txt');
    git('commit', '-q', '-m', 'later commit on main');
    assert.notEqual(git('rev-parse', 'HEAD').trim(), headAtClaim);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }

  const result = await claimant.done;
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.claim.branchHeadAtTake, headAtClaim, 'the claim recorded the commit read before any lock');
  const worktreeHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: result.claim.worktree.path, encoding: 'utf8' }).trim();
  assert.equal(worktreeHead, headAtClaim, 'the worktree forks from that same commit');
  assert.equal(readClaim(dir, 'item-a').branchHeadAtTake, headAtClaim);
});
