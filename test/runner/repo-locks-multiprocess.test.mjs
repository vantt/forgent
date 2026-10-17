import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createLockScope, probe, HolderLockError } from '../../src/holder-lock/index.mjs';
import { withMainCheckout, withMergeTargetSlot, withWorktreeAdmin, addWorktree } from '../../src/runner/repo-locks.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

// The three repo locks (main checkout, merge slot, worktree-admin) across
// real processes. The lock core is exercised with no checkpoint adapter.

const skip = HOOK_TEST_SKIP;
const REPO_LOCKS = fileURLToPath(new URL('../../src/runner/repo-locks.mjs', import.meta.url));
const HOLDER = fileURLToPath(new URL('../../src/holder-lock/index.mjs', import.meta.url));

function tempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-repo-locks-'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  return { root, fgosDir: path.join(root, '.fgos') };
}

/** A child that runs withMainCheckout and, inside it, appends enter/leave lines to `log`. */
function mainCheckoutChild(fgosDir, log, holdMs) {
  const script = `
    import fs from 'node:fs';
    import { createLockScope } from ${JSON.stringify(HOLDER)};
    import { withMainCheckout } from ${JSON.stringify(REPO_LOCKS)};
    await withMainCheckout(createLockScope('child'), 'test', async () => {
      fs.appendFileSync(${JSON.stringify(log)}, 'enter ' + process.pid + ' ' + Date.now() + '\\n');
      await new Promise((r) => setTimeout(r, ${holdMs}));
      fs.appendFileSync(${JSON.stringify(log)}, 'leave ' + process.pid + ' ' + Date.now() + '\\n');
    }, { fgosDir: ${JSON.stringify(fgosDir)}, waitMs: 20000 });
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.once('exit', (code) => resolve({ code, stderr })));
  return { child, exited };
}

test('two withMainCheckout in two processes exclude each other', { skip }, async () => {
  const { fgosDir, root } = tempProject();
  const log = path.join(root, 'order.log');
  const a = mainCheckoutChild(fgosDir, log, 600);
  const b = mainCheckoutChild(fgosDir, log, 600);
  const [ra, rb] = await Promise.all([a.exited, b.exited]);
  assert.equal(ra.code, 0, ra.stderr);
  assert.equal(rb.code, 0, rb.stderr);
  const lines = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => line.split(' '));
  assert.deepEqual(lines.map((l) => l[0]), ['enter', 'leave', 'enter', 'leave']);
  assert.equal(lines[0][1], lines[1][1], 'the first holder leaves before the second enters');
  assert.ok(Number(lines[2][2]) >= Number(lines[1][2]), 'second entered at or after the first left');
});

test('a holder SIGKILLed inside withMainCheckout lets the next one in at once', { skip }, async () => {
  const { fgosDir } = tempProject();
  const holder = await holdLockInChild('main-checkout', { fgosDir });
  await assert.rejects(
    withMainCheckout(createLockScope('waiter'), 'blocked', () => {}, { fgosDir }),
    (err) => err instanceof HolderLockError && err.code === 'lock-held' && /main checkout \(blocked\)/.test(err.message) && err.holders.includes(holder.child.pid),
  );
  holder.child.kill('SIGKILL');
  await holder.exited;
  const entered = await withMainCheckout(createLockScope('waiter-2'), 'after-kill', () => 'in', { fgosDir, waitMs: 2000 });
  assert.equal(entered, 'in');
  assert.equal(probe('main-checkout', { fgosDir }).result, 'free');
});

test('withMainCheckout times out past waitMs and names it', { skip }, async () => {
  const { fgosDir } = tempProject();
  const holder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    await assert.rejects(
      withMainCheckout(createLockScope('short'), 'short-wait', () => {}, { fgosDir, waitMs: 150 }),
      (err) => err.code === 'lock-held' && err.timedOut === true,
    );
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('the handle is released when fn throws', { skip }, async () => {
  const { fgosDir } = tempProject();
  await assert.rejects(withMainCheckout(createLockScope('thrower'), 'boom', () => { throw new Error('boom'); }, { fgosDir }), /boom/);
  assert.equal(probe('main-checkout', { fgosDir }).result, 'free');
});

test('merge slots of different refs do not contend, the same ref does, and ranks only go up inside a scope', { skip }, async () => {
  const { root, fgosDir } = tempProject();
  const scope = createLockScope('slots');
  await withMergeTargetSlot(scope, root, 'main', async () => {
    await withMergeTargetSlot(createLockScope('other-ref'), root, 'fgw/other', () => {});
    await assert.rejects(
      withMergeTargetSlot(createLockScope('same-ref'), root, 'main', () => {}),
      (err) => err.code === 'lock-held' && /merge slot of "main"/.test(err.message),
    );
    // slot (20) -> worktree-admin (40) -> main (50) is the allowed order.
    await withWorktreeAdmin(scope, fgosDir, async () => {
      await withMainCheckout(scope, 'land', () => {}, { fgosDir });
    });
    // main (50) then worktree-admin (40) is a rank decrease: refused at once.
    await withMainCheckout(scope, 'land', async () => {
      await assert.rejects(withWorktreeAdmin(scope, fgosDir, () => {}), (err) => err.code === 'lock-order-violation');
    }, { fgosDir });
  });
});

test('addWorktree runs git worktree add under the worktree-admin lock', { skip }, async () => {
  const { root, fgosDir } = tempProject();
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('-c', 'user.email=t@example.com', '-c', 'user.name=T', 'commit', '-q', '--allow-empty', '-m', 'seed');
  const holder = await holdLockInChild('worktree-admin', { fgosDir });
  const target = path.join(root, 'wt');
  await assert.rejects(addWorktree(createLockScope('wt-blocked'), root, ['-b', 'fgw/wt', target]), (err) => err.code === 'lock-held');
  assert.equal(fs.existsSync(target), false);
  holder.child.kill('SIGKILL');
  await holder.exited;
  await addWorktree(createLockScope('wt'), root, ['-b', 'fgw/wt', target], { waitMs: 2000 });
  assert.equal(fs.existsSync(target), true);
  await assert.rejects(addWorktree(createLockScope('wt-bad'), root, ['-b', 'fgw/wt', target]), /git worktree add .* failed/);
});
