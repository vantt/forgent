// Two real OS processes contending for a target's merge slot. The slot is a
// kernel lock on an open file description: a process that dies releases it by
// dying, no TTL or pid record is involved, and two processes that inherit the
// same session environment still exclude each other because they hold distinct
// descriptions.
//
// Mutual exclusion is a two-party property, so this uses the minimum real
// parties: one forked holder plus the test process. Synchronisation is on
// marker files (a condition), never a sleep or a wall-clock barrier, and every
// assertion is on an outcome, never on timing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { withMergeSlot, MergeError } from '../../src/runner/merge.mjs';
import { withLockRetry } from '../../src/runner/lock-wait.mjs';
import { createLockScope, probe } from '../../src/holder-lock/index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Bounds a hang only: the child writes its marker as its first act after
// acquiring, so any real failure surfaces as a wrong outcome long before this.
const MARKER_WAIT_MS = 20_000;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function makeLockRoot() {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-target-slot-mp-'));
  fs.mkdirSync(path.join(lockRoot, '.fgos'), { recursive: true });
  return lockRoot;
}

function slotParams(lockRoot, targetRef) {
  return { fgosDir: path.join(lockRoot, '.fgos'), ref: encodeURIComponent(targetRef) };
}

/** A child that takes `targetRef`'s slot, announces itself by creating
 * `heldMarker`, then holds it until `releaseMarker` appears. */
function writeHolderChild(dir) {
  const childPath = path.join(dir, 'slot-holder-child.mjs');
  fs.writeFileSync(
    childPath,
    `import fs from 'node:fs';
import { withMergeSlot } from ${JSON.stringify(pathToFileURL(path.join(REPO_ROOT, 'src/runner/merge.mjs')).href)};
import { createLockScope } from ${JSON.stringify(pathToFileURL(path.join(REPO_ROOT, 'src/holder-lock/index.mjs')).href)};

const [lockRoot, targetRef, heldMarker, releaseMarker] = process.argv.slice(2);

await withMergeSlot(createLockScope('slot-holder'), lockRoot, targetRef, async () => {
  fs.writeFileSync(heldMarker, String(process.pid));
  while (!fs.existsSync(releaseMarker)) {
    await new Promise((r) => setImmediate(r));
  }
});
process.exit(0);
`,
    'utf8',
  );
  return childPath;
}

async function waitForFile(filePath, childState) {
  const deadline = Date.now() + MARKER_WAIT_MS;
  while (!fs.existsSync(filePath)) {
    if (childState.code !== null) throw new Error(`child exited (code ${childState.code}) before reporting it held the slot`);
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${filePath}`);
    await sleep(10);
  }
}

function forkHolder(childPath, args) {
  const state = { code: null };
  const child = fork(childPath, args, { stdio: 'inherit' });
  const exited = new Promise((resolve) => {
    child.on('exit', (code, signal) => {
      state.code = code ?? (signal ? 128 : 0);
      resolve(state.code);
    });
  });
  return { child, state, exited };
}

async function startHolder(targetRef) {
  const lockRoot = makeLockRoot();
  const childPath = writeHolderChild(lockRoot);
  const heldMarker = path.join(lockRoot, 'held');
  const releaseMarker = path.join(lockRoot, 'release');
  const holder = forkHolder(childPath, [lockRoot, targetRef, heldMarker, releaseMarker]);
  await waitForFile(heldMarker, holder.state);
  return { lockRoot, holder, release: () => fs.writeFileSync(releaseMarker, 'go') };
}

test('a slot held by a REAL separate process is refused in this one, naming the slot and that process\'s pid', async () => {
  const targetRef = 'fgw/tsk-target';
  const { lockRoot, holder, release } = await startHolder(targetRef);
  try {
    let entered = false;
    const err = await withMergeSlot(createLockScope('contender'), lockRoot, targetRef, async () => {
      entered = true;
    }).then(() => null, (e) => e);

    assert.equal(entered, false, 'the second process must never enter the critical section');
    assert.ok(err instanceof MergeError, `expected MergeError, got ${err}`);
    assert.equal(err.code, 'lock-held');
    assert.equal(err.targetRef, targetRef);
    assert.match(err.message, /merge slot of "fgw\/tsk-target" is held by another process/);
    assert.deepEqual(err.holders, [holder.child.pid], 'the kernel names the child as the one holder, not this process');
  } finally {
    release();
    assert.equal(await holder.exited, 0);
  }
});

test('two DIFFERENT target refs never contend across processes — parallelism is per target', async () => {
  const { lockRoot, holder, release } = await startHolder('fgw/one');
  try {
    let entered = false;
    await withMergeSlot(createLockScope('other-target'), lockRoot, 'fgw/two', async () => {
      entered = true;
    });
    assert.equal(entered, true, 'a distinct target ref must not be blocked by another target\'s holder');
  } finally {
    release();
    assert.equal(await holder.exited, 0);
  }
});

test('while the slot is held no main checkout mutex is taken: an ephemeral-worktree merge does not touch the main checkout', async () => {
  const { lockRoot, holder, release } = await startHolder('fgw/tsk-named');
  try {
    assert.equal(probe('main-checkout', { fgosDir: path.join(lockRoot, '.fgos') }).result, 'free');
    assert.equal(probe('merge-slot', slotParams(lockRoot, 'fgw/tsk-named')).result, 'held');
  } finally {
    release();
    assert.equal(await holder.exited, 0);
  }
});

test('a holder that is SIGKILLed lets the next merge into the same target in at once', async () => {
  const targetRef = 'fgw/tsk-reuse';
  const { lockRoot, holder } = await startHolder(targetRef);
  holder.child.kill('SIGKILL');
  await holder.exited;

  let entered = false;
  await withMergeSlot(createLockScope('after-kill'), lockRoot, targetRef, async () => {
    entered = true;
  });
  assert.equal(entered, true, 'the slot must be free once the holding process is gone, with no TTL to wait out');
});

test('waiting: withLockRetry gives the slot acquire its wait budget and it enters once the holder releases; no-wait fails at once with the same name', async () => {
  const targetRef = 'fgw/tsk-wait';
  const { lockRoot, holder, release } = await startHolder(targetRef);
  try {
    const noWaitStart = Date.now();
    const refused = await withMergeSlot(createLockScope('no-wait'), lockRoot, targetRef, async () => 'never').then(() => null, (e) => e);
    assert.equal(refused?.code, 'lock-held');
    assert.match(refused.message, /merge slot of "fgw\/tsk-wait"/);
    assert.ok(Date.now() - noWaitStart < 2000, 'a single try must fail at once, not wait');

    setTimeout(release, 400);
    const entered = await withLockRetry(
      ({ waitMs }) => withMergeSlot(createLockScope('waiter'), lockRoot, targetRef, async () => 'in', { waitMs }),
      { waitMs: 15_000 },
    );
    assert.equal(entered, 'in');
  } finally {
    release();
    assert.equal(await holder.exited, 0);
  }
});
