import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initStore, addWork, settleClaim, listWork, readyWork, moveWork, graphWhatIf, footprintConflicts, computedSchedule, staleDoingAdvisory, StoreError } from '../../src/state/store.mjs';
import { acquireClaim, releaseClaim, readClaim, readClaims, buildEffectiveView, getItemDurableRevision, ClaimError } from '../../src/state/runtime-coordination.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';

const STORE_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/state/store.mjs');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-test-'));
  initStore(dir);
  return dir;
}

test('acquireClaim and releaseClaim lifecycle', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 1', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  // 1. Acquire claim
  const claim = acquireClaim(dir, {
    id: 'tsk-1',
    actor: 'session',
    preClaimStatus: 'todo',
    claimRole: 'session',
  });
  assert.ok(claim.claimId.startsWith('clm-'));
  assert.equal(claim.id, 'tsk-1');
  assert.equal(claim.actor, 'session');

  // 2. Read claim
  const read = readClaim(dir, 'tsk-1');
  assert.equal(read.claimId, claim.claimId);

  // 3. Duplicate claim without force throws conflict
  assert.throws(
    () => acquireClaim(dir, { id: 'tsk-1', actor: 'session' }),
    (err) => err.category === 'conflict'
  );

  // 4. Effective view shows status as 'doing'
  const view = listWork(dir);
  assert.equal(view.work['tsk-1'].status, 'doing');
  assert.ok(view.work['tsk-1'].activeClaim);

  // 5. Release claim
  const rel = releaseClaim(dir, { id: 'tsk-1', claimId: claim.claimId });
  assert.equal(rel.released, true);
  assert.equal(readClaim(dir, 'tsk-1'), null);

  // Effective view returns to 'todo'
  const viewAfter = listWork(dir);
  assert.equal(viewAfter.work['tsk-1'].status, 'todo');
  assert.equal(viewAfter.work['tsk-1'].activeClaim, undefined);
});

test('settleClaim appends 3-event segment and releases claim', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 2', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  const preClaimRevision = getItemDurableRevision(listWork(dir), 'tsk-1');
  const claim = acquireClaim(dir, {
    id: 'tsk-1',
    actor: 'runner',
    preClaimStatus: 'todo',
    preClaimRevision,
  });

  // Effective view before settle shows doing
  assert.equal(listWork(dir).work['tsk-1'].status, 'doing');

  // Settle claim
  const res = settleClaim(dir, {
    id: 'tsk-1',
    claimId: claim.claimId,
    finalStatus: 'awaiting-approval',
    role: 'runner',
  });

  assert.equal(res.view.work['tsk-1'].status, 'awaiting-approval');
  assert.equal(readClaim(dir, 'tsk-1'), null);

  // Check event log has work.move(->doing), work.attempt, work.move(doing->awaiting-approval)
  const events = listWork(dir);
  assert.equal(events.work['tsk-1'].status, 'awaiting-approval');
  assert.ok(events.work['tsk-1'].lastAttempt);
  assert.equal(events.work['tsk-1'].lastAttempt.result, 'success');
});

test('settleClaim CAS validation failure', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 3', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  const claim = acquireClaim(dir, {
    id: 'tsk-1',
    actor: 'session',
    preClaimStatus: 'todo',
    preClaimRevision: 'bad-revision',
  });

  assert.throws(
    () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' }),
    (err) => err instanceof StoreError && err.category === 'conflict'
  );
});

// tsk-40m code-review finding (blocker, store.mjs settleClaim): a caller that
// omits claimId used to settle whatever claim currently happens to be active
// for the id -- a stale actor (its own claim already released/reclaimed)
// could silently settle a DIFFERENT actor's live claim. Once an active
// runtime claim exists for the id, settleClaim must refuse (not silently
// proceed) when the caller does not name it.
test('settleClaim rejects settling an active claim when the caller omits claimId', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 4', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  acquireClaim(dir, { id: 'tsk-1', actor: 'runner', preClaimStatus: 'todo' });

  assert.throws(
    () => settleClaim(dir, { id: 'tsk-1', finalStatus: 'awaiting-approval' }),
    (err) => err instanceof StoreError && err.category === 'validation'
  );
  // The active claim must survive the rejected settle attempt untouched.
  assert.ok(readClaim(dir, 'tsk-1'));
});

// A stale caller (its OWN claim already released, e.g. reclaimed by a new
// claimant) must not be able to settle whoever holds the claim now, even by
// naming a claimId -- the mismatch is caught the same way a wrong-claimId
// call always was, this just proves it still holds once "no claimId" is
// rejected outright above.
test('settleClaim rejects a stale caller naming a claimId that no longer matches the active claim', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 5', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  const staleClaim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' });
  releaseClaim(dir, { id: 'tsk-1', claimId: staleClaim.claimId });
  const freshClaim = acquireClaim(dir, { id: 'tsk-1', actor: 'runner', preClaimStatus: 'todo' });

  assert.throws(
    () => settleClaim(dir, { id: 'tsk-1', claimId: staleClaim.claimId, finalStatus: 'awaiting-approval' }),
    (err) => err instanceof StoreError && err.category === 'conflict'
  );
  assert.ok(readClaim(dir, 'tsk-1'));
  assert.equal(readClaim(dir, 'tsk-1').claimId, freshClaim.claimId);
});

// tsk-40m code-review finding (high): several read facades still fold the
// DURABLE-only view (currentView) instead of the effective view (D4:
// durable status overlaid with active runtime claims) — an actively-claimed
// item (durable status still 'todo' post-migration, since claim-time no
// longer writes durable doing) leaks through as if it were idle/ready.

test('graphWhatIf excludes an actively-claimed dependent from newlyReady -- it is already being worked, not idle', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'b', title: 'B', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  addWork(dir, { id: 'a', title: 'A', kind: 'feature', status: 'todo', deps: ['b'], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  acquireClaim(dir, { id: 'a', actor: 'session', preClaimStatus: 'todo' });
  moveWork(dir, { id: 'b', to: 'wontfix', expectedStatus: 'todo' });

  const result = graphWhatIf(dir, 'b');
  assert.ok(!result.newlyReady.includes('a'), 'a has an active claim (effective doing) -- it must not read as newly-ready idle work');
});

test('footprintConflicts excludes an actively-claimed item from candidates -- only the genuinely idle sibling is a real parallel-dispatch risk', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding', footprint: ['src/shared.mjs'] });
  addWork(dir, { id: 'b', title: 'B', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding', footprint: ['src/shared.mjs'] });

  acquireClaim(dir, { id: 'a', actor: 'session', preClaimStatus: 'todo' });

  const conflicts = footprintConflicts(dir);
  assert.equal(conflicts.length, 0, 'a is already claimed (effective doing) -- with only b idle-ready, there is no real parallel-dispatch collision to report');
});

test('computedSchedule excludes an actively-claimed item from every wave', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  addWork(dir, { id: 'b', title: 'B', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  acquireClaim(dir, { id: 'a', actor: 'session', preClaimStatus: 'todo' });

  const { waves } = computedSchedule(dir);
  const scheduled = waves.flat();
  assert.ok(!scheduled.includes('a'), 'a already has an active claim -- it is being worked, not an idle candidate for a new dispatch wave');
  assert.ok(scheduled.includes('b'));
});

test('staleDoingAdvisory flags a genuinely stale active claim using the claim record\'s own acquiredAt, not a durable work.move->doing event claim-time no longer writes', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  acquireClaim(dir, { id: 'a', actor: 'runner', preClaimStatus: 'todo', claimRole: 'runner' });

  const farFuture = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const report = staleDoingAdvisory(dir, { now: farFuture });
  assert.ok(
    report.stale.some((entry) => entry.id === 'a'),
    'an active runtime claim with no durable work.move->doing event must still be classifiable as stale, via the claim record\'s own acquiredAt',
  );
});

// tsk-40m code-review finding (non-blocking, fail-open on corrupt data):
// readClaim used to catch-all and return null on ANY read/parse error,
// indistinguishable from "no claim file at all". A claim file that EXISTS
// but is corrupt (a torn write, disk error) must fail closed instead --
// silently reading it as "unclaimed" would let acquireClaim overwrite real
// (if unreadable) claim data, and every effective-view read would show the
// item as plain 'todo' with no signal anything is wrong.
test('readClaim returns null only for a genuinely missing claim file, and fails closed (throws) on one that exists but is corrupt', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 7', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  assert.equal(readClaim(dir, 'tsk-1'), null, 'a genuinely missing claim file still reads as no active claim');

  const claimsDir = resolveFgosFile(dir, FGOS_FILE.CLAIMS_DIR);
  fs.mkdirSync(claimsDir, { recursive: true });
  fs.writeFileSync(path.join(claimsDir, 'tsk-1.json'), '{not valid json', 'utf8');

  assert.throws(
    () => readClaim(dir, 'tsk-1'),
    (err) => err instanceof ClaimError && err.category === 'corrupt-log',
  );
});

// tsk-40m code-review finding (blocker, TOCTOU race): settleClaim validated
// the active claim (claimId/writerId/preClaimStatus/preClaimRevision)
// BEFORE acquiring events.lock. Waiting for that lock (held by any other
// writer, real cross-process contention) is unbounded — long enough for a
// stale-claim reclaim to release THIS claim and hand it to a different
// actor in the meantime. This is a REAL cross-process race (in-process
// concurrency can never expose it — one event loop serializes calls for
// free): a genuine second OS process, spawned via fork, whose own
// settleClaim call gets deterministically stuck behind an events.lock this
// test itself holds (writes the lock file directly, the exact mechanism
// events.mjs's own acquireEventsLock uses, keyed to this live process's own
// pid so it reads as genuinely held, never stale) — never a delay/timing
// guess, since nothing can pass the lock file's existence check while it's
// there. While the child is provably stuck, THIS process (never blocked —
// release/acquireClaim only ever need claims.lock, a different lock)
// reclaims the item for a different actor, then removes the lock file to
// let the child through.
test('settleClaim re-validates the claim AFTER acquiring events.lock: a stale settle stuck behind the lock while the claim is reclaimed by a different actor must conflict, never overwrite the new claim\'s durable state', async () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 11', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  const claimA = acquireClaim(dir, { id: 'tsk-1', actor: 'session-a', preClaimStatus: 'todo' });

  const lockPath = path.join(dir, 'events.lock');
  fs.writeFileSync(lockPath, String(process.pid), 'utf8');

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-settle-race-'));
  // The child does its OWN pre-check readClaim and acks it BEFORE calling
  // the real settleClaim, immediately after (same synchronous tick, no
  // await/yield in between) -- so by the time this test process receives
  // that ack, settleClaim's own internal outer readClaim has, with the same
  // certainty, already run too (and seen claim A, since nothing has touched
  // the claim file yet at that point) and is now blocked spinning on
  // acquireEventsLock (this test process holds it). Only AFTER receiving
  // the ack does this test reclaim the item -- ordering the reclaim
  // strictly after settleClaim's outer checks passed with STALE (claim A)
  // data, and strictly before events.lock is released to let it through.
  const childScript = `
import { readClaim } from ${JSON.stringify(path.resolve(fileURLToPath(import.meta.url), '../../../src/state/runtime-coordination.mjs'))};
import { settleClaim } from ${JSON.stringify(STORE_MJS)};
const dir = ${JSON.stringify(dir)};
const id = ${JSON.stringify('tsk-1')};
const preCheck = readClaim(dir, id);
process.send({ ack: true, claimId: preCheck?.claimId });
try {
  settleClaim(dir, { id, claimId: ${JSON.stringify(claimA.claimId)}, finalStatus: 'blocked' });
  process.send({ ok: true });
} catch (err) {
  process.send({ ok: false, category: err.category, message: err.message });
}
`;
  const childPath = path.join(workDir, 'settle-race-child.mjs');
  fs.writeFileSync(childPath, childScript);

  const child = fork(childPath, { stdio: 'inherit' });
  const ack = await new Promise((resolve, reject) => {
    child.once('message', resolve);
    child.once('error', reject);
  });
  assert.equal(ack.claimId, claimA.claimId, "the child's own pre-check must see claim A before this test reclaims it");

  const childDone = new Promise((resolve, reject) => {
    child.on('message', resolve);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error(`settle-race-child exited ${code} with no message`));
    });
  });

  // The child cannot possibly pass acquireEventsLock while lockPath exists
  // (a live pid it reads as genuinely held) -- reclaiming here is ordered
  // BEFORE removing the lock, deterministically, not a timing guess.
  releaseClaim(dir, { id: 'tsk-1', claimId: claimA.claimId });
  const claimB = acquireClaim(dir, { id: 'tsk-1', actor: 'session-b', preClaimStatus: 'todo' });

  fs.unlinkSync(lockPath);
  const result = await childDone;

  assert.equal(result.ok, false, 'the stale settle must conflict, never silently succeed against the reclaimed item');
  assert.equal(result.category, 'conflict');

  // durable state must be untouched by the stale settle -- never 'blocked'
  assert.equal(listWork(dir).work['tsk-1'].status, 'doing', 'the reclaimed item stays effective doing under claim B, never overwritten by claim A\'s stale segment');
  const currentClaim = readClaim(dir, 'tsk-1');
  assert.ok(currentClaim, 'claim B must still be active');
  assert.equal(currentClaim.claimId, claimB.claimId);
});

test('acquireClaim never silently overwrites a claim file that exists but is corrupt', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 8', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  const claimsDir = resolveFgosFile(dir, FGOS_FILE.CLAIMS_DIR);
  fs.mkdirSync(claimsDir, { recursive: true });
  fs.writeFileSync(path.join(claimsDir, 'tsk-1.json'), '{not valid json', 'utf8');

  assert.throws(
    () => acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' }),
    (err) => err instanceof ClaimError && err.category === 'corrupt-log',
  );
  // the corrupt file must survive untouched -- never silently overwritten
  assert.equal(fs.readFileSync(path.join(claimsDir, 'tsk-1.json'), 'utf8'), '{not valid json');
});

// tsk-40m code-review finding (blocker, confirmed needed): a caller with no
// in-process capability token (a fresh CLI invocation, e.g. `fgos return`,
// separate from the take/pick that acquired the claim) can only ever
// discover a claimId by reading "whichever claim is active right now" --
// which trivially "matches" itself even for a DIFFERENT actor's session.
// writerId (recorded at acquireClaim time from session-identity.mjs, the
// same mechanism fgOS already uses to stamp every event's `writer` field)
// closes this independently of claimId, by comparing the CURRENT caller's
// own resolved session identity against the claim's recorded owner.
test('settleClaim rejects a different session presenting the correct claimId (writer-identity check)', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 9', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'session-A';
    const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' });
    assert.equal(claim.writerId, 'session-A');

    process.env.FGOS_SESSION_ID = 'session-B';
    assert.throws(
      () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' }),
      (err) => err instanceof StoreError && err.category === 'conflict',
    );
    // the claim must survive the rejected cross-session settle attempt
    assert.ok(readClaim(dir, 'tsk-1'));

    // the SAME session (A) presenting the same claimId still settles cleanly
    process.env.FGOS_SESSION_ID = 'session-A';
    const res = settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' });
    assert.equal(res.view.work['tsk-1'].status, 'awaiting-approval');
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});

test('settleClaim skips the writer-identity check for a claim written before the field existed (backward compat, never a false positive on old data)', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 10', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' });
  const claimsDir = resolveFgosFile(dir, FGOS_FILE.CLAIMS_DIR);
  const claimFilePath = path.join(claimsDir, 'tsk-1.json');
  const legacyClaim = JSON.parse(fs.readFileSync(claimFilePath, 'utf8'));
  delete legacyClaim.writerId;
  fs.writeFileSync(claimFilePath, JSON.stringify(legacyClaim, null, 2), 'utf8');

  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'a-totally-different-session';
    const res = settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' });
    assert.equal(res.view.work['tsk-1'].status, 'awaiting-approval');
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});
