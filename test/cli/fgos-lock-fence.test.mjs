// `fgos lock fence`, `fgos lock-status`' view of a fenced lock, and
// `main-checkout-reset` under the main checkout mutex. Every holder here is a
// real process holding a real kernel lock; the verbs run as real CLI children.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import { parseLockParams } from '../../src/runner/lock-fence.mjs';
import { FGOS, commitFile, envelopeData, gitHead, initGitCwdFast, run } from './helpers/fgos-cli-harness.mjs';

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function lockStatus(cwd) {
  const result = run(cwd, ['lock-status']);
  assert.equal(result.status, 0, result.stderr);
  return envelopeData(result.stdout);
}

function runAsync(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [FGOS, ...args], { cwd, env: { ...process.env, FGOS_SESSION_ID: 'fgos-lock-fence-test' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('exit', (status) => resolve({ status, stdout, stderr }));
  });
}

test('lock fence main-checkout: lists the holder pid, refuses without --yes, and --yes ends the holder and frees the lock', async () => {
  const cwd = initGitCwdFast();
  const fgosDir = path.join(cwd, '.fgos');
  const holder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    const refused = await runAsync(cwd, ['lock', 'fence', 'main-checkout']);
    assert.notEqual(refused.status, 0, 'no terminal and no --yes: nothing may be signalled');
    assert.match(refused.stderr, new RegExp(`pid ${holder.child.pid}\\b`), 'the holder is listed');
    assert.match(refused.stderr, /nothing was signalled/);
    assert.equal(alive(holder.child.pid), true, 'an unconfirmed fence leaves the holder alone');
    assert.equal(lockStatus(cwd).mainCheckout.outcome, 'held');

    const fenced = await runAsync(cwd, ['lock', 'fence', 'main-checkout', '--yes']);
    assert.equal(fenced.status, 0, fenced.stderr);
    const data = envelopeData(fenced.stdout);
    assert.equal(data.status, 'fenced');
    assert.deepEqual(data.holders.map((h) => h.pid), [holder.child.pid]);
    assert.deepEqual(data.terminated, [holder.child.pid]);
    assert.deepEqual(data.killed, []);
    await holder.exited;
    assert.equal(lockStatus(cwd).mainCheckout.outcome, 'free');
  } finally {
    holder.child.kill('SIGKILL');
  }
});

test('lock fence escalates to SIGKILL when the holder ignores SIGTERM', async () => {
  const cwd = initGitCwdFast();
  const fgosDir = path.join(cwd, '.fgos');
  const readyFile = path.join(cwd, 'sigterm-ignored');
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { acquireSync, createLockScope } from ${JSON.stringify(new URL('../../src/holder-lock/index.mjs', import.meta.url).href)};
    const res = acquireSync(createLockScope('stubborn'), 'main-checkout', { fgosDir: ${JSON.stringify(fgosDir)} });
    if (res.result !== 'acquired') process.exit(3);
    process.on('SIGTERM', () => {});
    fs.writeFileSync(${JSON.stringify(readyFile)}, 'held');
    setInterval(() => {}, 1000);
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  try {
    for (let i = 0; i < 400 && !fs.existsSync(readyFile); i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
    assert.ok(fs.existsSync(readyFile), 'the stubborn holder took the lock');

    const fenced = await runAsync(cwd, ['lock', 'fence', 'main-checkout', '--yes']);
    assert.equal(fenced.status, 0, fenced.stderr);
    const data = envelopeData(fenced.stdout);
    assert.deepEqual(data.terminated, [child.pid]);
    assert.deepEqual(data.killed, [child.pid], 'SIGTERM was ignored, so SIGKILL ended it');
    await exited;
    assert.equal(lockStatus(cwd).mainCheckout.outcome, 'free');
  } finally {
    child.kill('SIGKILL');
  }
});

test('lock fence on a lock nobody holds reports free and signals nothing', () => {
  const cwd = initGitCwdFast();
  const result = run(cwd, ['lock', 'fence', 'main-checkout', '--yes']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.status, 'free');
  assert.deepEqual(data.holders, []);
});

test('lock fence takes a lock path parameter with --param and fences only that instance', async () => {
  const cwd = initGitCwdFast();
  const fgosDir = path.join(cwd, '.fgos');
  const onMain = await holdLockInChild('merge-slot', { fgosDir, ref: 'main' });
  const onDev = await holdLockInChild('merge-slot', { fgosDir, ref: 'dev' });
  try {
    const missing = await runAsync(cwd, ['lock', 'fence', 'merge-slot', '--yes']);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /lock-path-param-missing/);
    assert.equal(alive(onMain.child.pid) && alive(onDev.child.pid), true, 'a lock whose path is unknown is never guessed');

    const fenced = await runAsync(cwd, ['lock', 'fence', 'merge-slot', '--param', 'ref=main', '--yes']);
    assert.equal(fenced.status, 0, fenced.stderr);
    await onMain.exited;
    assert.equal(alive(onDev.child.pid), true, 'the other target keeps its slot');
  } finally {
    onMain.child.kill('SIGKILL');
    onDev.child.kill('SIGKILL');
  }
});

test('lock fence never fences a lock held by the process that runs it or its parents', () => {
  const cwd = initGitCwdFast();
  const scope = createLockScope('test-parent');
  const mine = acquireSync(scope, 'main-checkout', { fgosDir: path.join(cwd, '.fgos') });
  assert.equal(mine.result, 'acquired');
  try {
    const result = run(cwd, ['lock', 'fence', 'main-checkout', '--yes']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /lock-fence-self/);
    assert.equal(alive(process.pid), true);
  } finally {
    mine.handle.release();
  }
});

test('lock fence refuses an unknown lock name and a missing name', () => {
  const cwd = initGitCwdFast();
  const unknown = run(cwd, ['lock', 'fence', 'no-such-lock', '--yes']);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /unknown-lock/);
  const noName = run(cwd, ['lock', 'fence']);
  assert.equal(noName.status, 4);
  assert.match(noName.stderr, /lock fence requires a lock name/);
  const badSub = run(cwd, ['lock', 'steal']);
  assert.equal(badSub.status, 4);
  assert.match(badSub.stderr, /unknown lock sub-verb/);
});

test('parseLockParams reads repeated key=value pairs and refuses anything else', () => {
  assert.deepEqual(parseLockParams(['provider=codex', 'account=a=b']), { provider: 'codex', account: 'a=b' });
  assert.deepEqual(parseLockParams('ref=main'), { ref: 'main' });
  assert.deepEqual(parseLockParams(undefined), {});
  assert.throws(() => parseLockParams(['nokey']), /key=value/);
  assert.throws(() => parseLockParams(['=x']), /key=value/);
});

test('main-checkout-reset while another process holds main: refuses with the lock and the holder pid, touches no file', async () => {
  const cwd = initGitCwdFast();
  commitFile(cwd, 'second.txt');
  const target = gitHead(cwd);
  commitFile(cwd, 'third.txt');
  const head = gitHead(cwd);
  fs.writeFileSync(path.join(cwd, 'untracked-work.txt'), 'in flight\n');
  execFileSync('git', ['add', 'untracked-work.txt'], { cwd });
  const stagedBefore = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd, encoding: 'utf8' });

  const holder = await holdLockInChild('main-checkout', { fgosDir: path.join(cwd, '.fgos') });
  try {
    const result = await runAsync(cwd, ['main-checkout-reset', '--sha', target, '--confirm']);
    assert.equal(result.status, 7, result.stderr);
    assert.match(result.stderr, new RegExp(`main checkout \\(reset\\) is held by another process \\(pid ${holder.child.pid}\\)`));
    assert.equal(gitHead(cwd), head, 'HEAD did not move');
    assert.equal(execFileSync('git', ['diff', '--cached', '--name-only'], { cwd, encoding: 'utf8' }), stagedBefore, 'the index is untouched');
    assert.equal(fs.readFileSync(path.join(cwd, 'untracked-work.txt'), 'utf8'), 'in flight\n');
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }

  const after = run(cwd, ['main-checkout-reset', '--sha', target, '--confirm']);
  assert.equal(after.status, 0, after.stderr);
  assert.equal(gitHead(cwd), target, 'once main is free the reset runs');
  assert.equal(lockStatus(cwd).mainCheckout.outcome, 'free', 'the reset released main');
});
