import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { outcomeOfVerify, runUnderCustody, runVerify, custodyHeld, worktreeKey } from '../../../src/runner/execution/custody-door.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-door-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const fgosDir = path.join(root, '.fgos');
  const worktree = path.join(root, 'wt');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.mkdirSync(worktree);
  return { fgosDir, worktree: fs.realpathSync(worktree) };
}

const node = (script) => `"${process.execPath}" -e ${JSON.stringify(script)}`;

// --- the verify door: what a run proves ---------------------------------------------------------------------

test('verify door: exit 0 is a pass verdict and the output is hashed once', async (t) => {
  const { worktree } = fixture(t);
  const got = await runVerify({ command: node("console.log('green')"), cwd: worktree, timeoutMs: 20000 });
  assert.equal(got.verdict, 'pass');
  assert.equal(got.infrastructure, undefined);
  assert.match(got.outputDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(outcomeOfVerify(got), 'pass');
});

test('verify door: a non-zero exit is a findings verdict naming the status and the output tail', async (t) => {
  const { worktree } = fixture(t);
  const got = await runVerify({ command: node("console.error('assertion exploded'); process.exit(3)"), cwd: worktree, timeoutMs: 20000 });
  assert.equal(got.verdict, 'findings');
  assert.equal(got.status, 3);
  assert.equal(got.how, 'exited 3');
  assert.match(got.tail, /assertion exploded/);
  assert.equal(outcomeOfVerify(got), 'findings');
});

test('verify door: a run that outlives its timeout is infrastructure, never a verdict', async (t) => {
  const { worktree } = fixture(t);
  const got = await runVerify({ command: node('setTimeout(() => {}, 120000)'), cwd: worktree, timeoutMs: 700 });
  assert.equal(got.infrastructure, 'timeout');
  assert.equal(got.verdict, undefined);
  assert.equal(got.how, 'timed out after 700ms');
  assert.equal(outcomeOfVerify(got), 'execution-failure');
});

test('verify door: a run that cannot start is infrastructure not-run', async (t) => {
  const { worktree } = fixture(t);
  const got = await runVerify({ command: 'true', cwd: path.join(worktree, 'absent'), timeoutMs: 20000 });
  assert.equal(got.infrastructure, 'not-run');
  assert.equal(got.how, 'could not run');
  assert.equal(outcomeOfVerify(got), 'execution-failure');
});

// --- the custody door -------------------------------------------------------------------------------------

test('custody door: custody is held while the body runs and free once it ends, a returned value passes through', async (t) => {
  const { fgosDir, worktree } = fixture(t);
  assert.equal(custodyHeld(fgosDir, worktree), false);
  let heldInside;
  const result = await runUnderCustody(fgosDir, worktree, async () => {
    heldInside = custodyHeld(fgosDir, worktree);
    return { answer: 42 };
  });
  assert.equal(heldInside, true);
  assert.equal(result.answer, 42);
  assert.equal(custodyHeld(fgosDir, worktree), false);
});

test('custody door: a body that throws still releases custody and records no hand-off', async (t) => {
  const { fgosDir, worktree } = fixture(t);
  await assert.rejects(runUnderCustody(fgosDir, worktree, async () => { throw new Error('boom'); }), /boom/);
  assert.equal(custodyHeld(fgosDir, worktree), false);
});

test('custody door: a second holder is refused while the body runs', async (t) => {
  const { fgosDir, worktree } = fixture(t);
  await runUnderCustody(fgosDir, worktree, async () => {
    await assert.rejects(runUnderCustody(fgosDir, worktree, async () => ({})), (err) => err.code === 'dispatch-in-flight');
    return {};
  });
});

test('custody door: the worktree key is one for every spelling of the path and null for a directory that is gone', (t) => {
  const { worktree } = fixture(t);
  const link = `${worktree}-link`;
  fs.symlinkSync(worktree, link);
  assert.ok(worktreeKey(worktree));
  assert.equal(worktreeKey(link), worktreeKey(worktree));
  assert.equal(worktreeKey(path.join(worktree, 'absent')), null);
});
