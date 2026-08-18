// tsk-1wr: the two-real-process proof `withMergeTargetSlot`'s own Iron Law
// evidence (`docs/history/tsk-xyr/iron-law-evidence.md`) discloses as missing.
//
// That file states plainly that every concurrency claim behind the target-ref
// merge slot is proven "at the unit/async level (two Promises racing the real
// lock files ...) — not with two genuinely separate OS processes". It argues
// the underlying mechanism (`wx`-atomic create + `link(2)`) cannot tell the
// two cases apart. That argument is sound about the syscall and still leaves
// one thing a same-process test cannot produce: two real, independent OS
// processes contending for real.
//
// tsk-18k UPDATE: before this item, `withMergeTargetSlot`'s identity was
// `resolveWriterIdentity`'s env-derived session id, which forked children
// inherit byte-identically — so two real processes used to contend under the
// literal SAME `identity` string. That was Finding 1's own bug surface: a
// string identity has no liveness probe (main-checkout-lock.mjs's dual
// numeric/string branch), so once one holder's lock went TTL-stale and a
// sibling reclaimed it, the original holder's own release/renew call could
// misidentify the reclaimer's fresh lock as its own (same string) and
// delete/overwrite it. This item switched the identity to `process.pid` —
// two real sibling processes forked here now carry genuinely DIFFERENT
// identities even though they share the same env session id, so that
// particular misidentify path no longer exists for this call site. The test
// below ("the merge-target-slot lock is keyed by the real OS pid...") proves
// this directly. The REST of this file's original point still holds
// independent of the identity model: only two real OS processes exercise the
// real `isPidAlive` liveness probe (only reachable for a numeric identity in
// the first place) and the real `wx`-atomic create/`link(2)` syscalls a
// same-process fake cannot reach. If acquisition ever grew a "this lock is
// already mine" shortcut, a same-process test would keep passing while real
// concurrent merges both entered the critical section. That is the
// regression this file exists for.
//
// Worth a real test rather than an argument because tsk-xyr is a self-declared
// hard-gate data-loss item: it changes which lock protects the `git branch -f`
// ref move that tsk-46a/tsk-2cd already lost real work to.
//
// DELIBERATELY NOT a stampede (plan.md): `test/state/events.test.mjs`'s
// twenty-process barrier test is exactly what tsk-3wn had to repair for
// load-sensitivity, and tsk-597 is open on the same class in porting-store.
// Mutual exclusion is a two-party property, so this uses the minimum real
// parties — one forked child plus the test process itself, which is already a
// separate OS process with its own pid. Synchronisation is on marker files
// (a condition), never a sleep or a wall-clock barrier, and every assertion
// is on an outcome, never on timing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { withMergeTargetSlot, MergeError } from '../../src/runner/merge.mjs';
import { mergeSlotLockFile } from '../../src/runner/main-checkout-lock.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// How long the parent will wait for the child to report that it is inside the
// critical section. Not a pacing knob: the child writes its marker as its
// first act after acquiring, so this only bounds a hang. Any real failure
// surfaces as a wrong outcome long before this matters.
const MARKER_WAIT_MS = 20_000;

function makeLockRoot() {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-target-slot-mp-'));
  fs.mkdirSync(path.join(lockRoot, '.fgos'), { recursive: true });
  return lockRoot;
}

/**
 * A child that acquires `targetRef`'s slot, announces itself by creating
 * `heldMarker`, then holds the slot until `releaseMarker` appears. Holding on
 * a file rather than a timer is what makes the overlap deterministic: the
 * parent's own attempt provably happens while the child is inside.
 */
function writeHolderChild(dir) {
  const childPath = path.join(dir, 'slot-holder-child.mjs');
  fs.writeFileSync(
    childPath,
    `import fs from 'node:fs';
import { withMergeTargetSlot } from ${JSON.stringify(path.join(REPO_ROOT, 'src/runner/merge.mjs'))};

const [lockRoot, targetRef, heldMarker, releaseMarker] = process.argv.slice(2);

await withMergeTargetSlot(lockRoot, targetRef, async () => {
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

async function waitForFile(filePath, childExited) {
  const deadline = Date.now() + MARKER_WAIT_MS;
  while (!fs.existsSync(filePath)) {
    if (childExited.code !== null) {
      throw new Error(`child exited (code ${childExited.code}) before reporting it held the slot`);
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${filePath}`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

function forkHolder(childPath, args) {
  const state = { code: null };
  const child = fork(childPath, args, { stdio: 'inherit' });
  const exited = new Promise((resolve) => {
    child.on('exit', (code) => {
      state.code = code ?? 0;
      resolve(state.code);
    });
  });
  return { child, state, exited };
}

test('a slot held by a REAL separate process is refused in this one, under the same inherited identity', async () => {
  const lockRoot = makeLockRoot();
  const childPath = writeHolderChild(lockRoot);
  const heldMarker = path.join(lockRoot, 'held');
  const releaseMarker = path.join(lockRoot, 'release');
  const targetRef = 'fgw/tsk-target';

  const holder = forkHolder(childPath, [lockRoot, targetRef, heldMarker, releaseMarker]);
  try {
    await waitForFile(heldMarker, holder.state);

    // Same env as the parent (a real fork), but tsk-18k switched this call
    // site's identity to `process.pid` — the child's own real OS pid, never
    // the shared session string the two processes still both inherit.
    let entered = false;
    const err = await withMergeTargetSlot(lockRoot, targetRef, async () => {
      entered = true;
    }).then(() => null, (e) => e);

    assert.equal(entered, false, 'the second process must never enter the critical section');
    assert.ok(err instanceof MergeError, `expected MergeError, got ${err}`);
    assert.equal(err.code, 'lock-held');
    assert.equal(err.targetRef, targetRef);
    assert.match(err.message, /merge slot is held by another live session/);
    assert.notEqual(err.holderPid, process.pid, 'the reported holder is the other process, not this one');
    assert.equal(err.holderPid, holder.child.pid, 'the reported holder is the CHILD\'s own real OS pid (tsk-18k identity fix), not a shared session string');
  } finally {
    fs.writeFileSync(releaseMarker, 'go');
    assert.equal(await holder.exited, 0);
  }
});

test('tsk-18k: the merge-target-slot lock is keyed by the real OS pid, not the shared env session id — two sibling processes never collide on release/renew', async () => {
  const lockRoot = makeLockRoot();
  const childPath = writeHolderChild(lockRoot);
  const heldMarker = path.join(lockRoot, 'held');
  const releaseMarker = path.join(lockRoot, 'release');
  const targetRef = 'fgw/tsk-identity';

  const holder = forkHolder(childPath, [lockRoot, targetRef, heldMarker, releaseMarker]);
  try {
    await waitForFile(heldMarker, holder.state);

    // Read the child's own lock record directly: before tsk-18k this held
    // `resolveWriterIdentity`'s env session id, which the parent process
    // (this test, forked from the same env) would ALSO have resolved to —
    // the exact collision Finding 1 exploited once the child's lock went
    // TTL-stale and the parent's own release/renew call, sharing that same
    // string, could misidentify a reclaimer's fresh lock as its own. Now it
    // must be the child's real, distinct OS pid.
    const lockPath = path.join(lockRoot, '.fgos', mergeSlotLockFile(targetRef));
    const record = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    assert.equal(record.pid, holder.child.pid, "the on-disk lock record is keyed by the child's own real pid");
    assert.notEqual(
      record.pid,
      process.pid,
      'the child and this parent test process must never be recorded under the same identity, even though both were forked from the same env',
    );
  } finally {
    fs.writeFileSync(releaseMarker, 'go');
    assert.equal(await holder.exited, 0);
  }
});

test('two DIFFERENT target refs never contend across processes — parallelism is per target', async () => {
  const lockRoot = makeLockRoot();
  const childPath = writeHolderChild(lockRoot);
  const heldMarker = path.join(lockRoot, 'held');
  const releaseMarker = path.join(lockRoot, 'release');

  const holder = forkHolder(childPath, [lockRoot, 'fgw/one', heldMarker, releaseMarker]);
  try {
    await waitForFile(heldMarker, holder.state);

    // The whole point of keying the slot to the target ref (D7: no fixed
    // concurrency cap) — a second target proceeds while the first is held.
    let entered = false;
    await withMergeTargetSlot(lockRoot, 'fgw/two', async () => {
      entered = true;
    });
    assert.equal(entered, true, 'a distinct target ref must not be blocked by another target’s holder');
  } finally {
    fs.writeFileSync(releaseMarker, 'go');
    assert.equal(await holder.exited, 0);
  }
});

test('the holder process leaves exactly one lock file, named for its own target', async () => {
  const lockRoot = makeLockRoot();
  const childPath = writeHolderChild(lockRoot);
  const heldMarker = path.join(lockRoot, 'held');
  const releaseMarker = path.join(lockRoot, 'release');
  const targetRef = 'fgw/tsk-named';

  const holder = forkHolder(childPath, [lockRoot, targetRef, heldMarker, releaseMarker]);
  try {
    await waitForFile(heldMarker, holder.state);
    const locks = fs.readdirSync(path.join(lockRoot, '.fgos')).filter((f) => f.endsWith('.lock'));
    assert.deepEqual(locks, [mergeSlotLockFile(targetRef)]);
    // Never the shared main-checkout lock: an ephemeral-worktree merge does
    // not touch the main checkout, which is the whole reason tsk-xyr moved
    // off it.
    assert.ok(!locks.includes('main-checkout.lock'));
  } finally {
    fs.writeFileSync(releaseMarker, 'go');
    assert.equal(await holder.exited, 0);
  }
});

test('the slot is released when the holding PROCESS exits, not merely when its promise settles', async () => {
  const lockRoot = makeLockRoot();
  const childPath = writeHolderChild(lockRoot);
  const heldMarker = path.join(lockRoot, 'held');
  const releaseMarker = path.join(lockRoot, 'release');
  const targetRef = 'fgw/tsk-reuse';

  const holder = forkHolder(childPath, [lockRoot, targetRef, heldMarker, releaseMarker]);
  await waitForFile(heldMarker, holder.state);
  fs.writeFileSync(releaseMarker, 'go');
  assert.equal(await holder.exited, 0);

  // A slot a dead process left behind must be reusable immediately — the
  // failure mode that would otherwise wedge the merge queue until a TTL.
  let entered = false;
  await withMergeTargetSlot(lockRoot, targetRef, async () => {
    entered = true;
  });
  assert.equal(entered, true, 'the slot must be free once the holding process is gone');
});
