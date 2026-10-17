// The runtime claims and the event log share one state transaction: a live
// holder is never taken over, a nested transaction is refused, and the
// delivered gate takes its git evidence before the lock and retries when the
// branch moves while it waits.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { addWork, initStore, listWork, resolveWriterLogPath } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';
import { acquireClaim, readClaim, withMainState } from '../../src/state/runtime-coordination.mjs';
import { withStateTx, HotLockError } from '../../src/state/hot-lock.mjs';
import { holdStateLockInChild } from '../helpers/hold-state-lock-in-child.mjs';

const STORE_URL = new URL('../../src/state/store.mjs', import.meta.url).href;
const SAMPLE = { kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' };

function tmpFgosDir(prefix) {
  return path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix))), '.fgos');
}

test('a claim never takes over a live state-lock holder: it times out and leaves the claims untouched', async () => {
  const dir = tmpFgosDir('fgos-claim-live-holder-');
  initStore(dir);
  addWork(dir, { id: 'tsk-1', title: 'Task 1', ...SAMPLE });
  const holder = await holdStateLockInChild(dir);
  try {
    assert.throws(
      () => acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' }),
      (err) => err instanceof HotLockError && err.code === 'hot-lock-timeout',
    );
    assert.equal(readClaim(dir, 'tsk-1'), null, 'the refused claim wrote nothing');
    assert.ok(holder.child.exitCode === null, 'the holder is still inside its transaction');
  } finally {
    await holder.release();
  }
  assert.ok(acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' }).claimId, 'the claim goes through once the holder leaves');
});

test('a state transaction opened inside another is refused at once, whatever the resource', () => {
  const dir = tmpFgosDir('fgos-nested-tx-');
  initStore(dir);
  assert.throws(
    () => withMainState(dir, () => withStateTx(dir, () => {}, { resource: 'porting-events' })),
    (err) => err instanceof HotLockError && err.code === 'hot-lock-reentry',
  );
  assert.throws(
    () => withMainState(dir, () => acquireClaim(dir, { id: 'tsk-1', actor: 'session' })),
    (err) => err instanceof HotLockError && err.code === 'hot-lock-reentry',
  );
});

test('the delivered gate retries when the item branch gains its plan while the move waits for the lock', async () => {
  const repoRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plan-retry-')));
  const git = (...args) => execFileSync('git', args, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git('add', 'seed.txt');
  git('commit', '-q', '-m', 'seed');
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'heavy', title: 'Heavy', ...SAMPLE, risk: 'heavy' });
  appendEvent(resolveWriterLogPath(dir), { type: 'work.move', payload: { id: 'heavy', from: 'todo', to: 'doing' } }, dir);

  const holder = await holdStateLockInChild(dir);
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { moveWork } from ${JSON.stringify(STORE_URL)};
    try {
      const res = moveWork(${JSON.stringify(dir)}, { id: 'heavy', to: 'delivered', expectedStatus: 'doing', role: 'human' });
      process.stdout.write(JSON.stringify({ ok: true, status: res.view.work.heavy.status }));
    } catch (err) {
      process.stdout.write(JSON.stringify({ ok: false, category: err.category, message: err.message }));
    }
  `], { stdio: ['ignore', 'pipe', 'inherit'] });
  let out = '';
  child.stdout.on('data', (chunk) => { out += chunk; });
  const exited = new Promise((resolve) => child.once('exit', resolve));

  // Its first snapshot (no branch, no plan) is taken while it waits for the lock.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  git('checkout', '-q', '-b', 'fgw/heavy');
  fs.mkdirSync(path.join(repoRoot, 'docs', 'history', 'heavy'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'history', 'heavy', 'plan.md'), '# plan\n');
  git('add', 'docs');
  git('commit', '-q', '-m', 'plan');
  git('checkout', '-q', 'main');
  await holder.release();
  await exited;

  assert.deepEqual(JSON.parse(out), { ok: true, status: 'delivered' });
  assert.equal(listWork(dir).work.heavy.status, 'delivered');
});
