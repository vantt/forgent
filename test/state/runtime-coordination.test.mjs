import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initStore, addWork, settleClaim, listWork, readyWork, moveWork, editWork, graphWhatIf, footprintConflicts, computedSchedule, staleDoingAdvisory, readRawEvents, addDecision, recordGateApprove, StoreError } from '../../src/state/store.mjs';
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

test('settleClaim settles directly (no durable intermediate doing) and releases claim', () => {
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

  // tsk-40m code-review finding (blocker): res.event must be the real
  // final work.move event itself (matching moveWork's own return shape),
  // never a nested {event, view} object one level too deep -- bin/
  // fgos.mjs's `return` command reads `event.seq` straight off this for
  // its own CLI output.
  assert.equal(typeof res.event.seq, 'number', 'res.event must be the raw final event, not a nested {event, view} wrapper');
  assert.equal(res.event.type, 'work.move');
  assert.equal(res.event.payload.to, 'awaiting-approval');

  const events = listWork(dir);
  assert.equal(events.work['tsk-1'].status, 'awaiting-approval');
  assert.ok(events.work['tsk-1'].lastAttempt);
  assert.equal(events.work['tsk-1'].lastAttempt.result, 'success');
  assert.equal(events.work['tsk-1'].lastAttempt.from, 'todo');
  assert.equal(events.work['tsk-1'].lastAttempt.to, 'awaiting-approval');

  // tsk-40m (docs/architect/doing-coordination-redesign.md §7.3/§9.2):
  // the durable log carries exactly work.attempt + ONE work.move, straight
  // from preClaimStatus to finalStatus -- no durable work.move(->doing)
  // leg at all.
  const raw = readRawEvents(dir).filter((e) => e.payload?.id === 'tsk-1');
  const moves = raw.filter((e) => e.type === 'work.move');
  assert.equal(moves.length, 1, 'exactly one work.move -- no durable intermediate doing leg');
  assert.equal(moves[0].payload.from, 'todo');
  assert.equal(moves[0].payload.to, 'awaiting-approval');
  assert.equal(raw.filter((e) => e.type === 'work.attempt').length, 1);
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

// tsk-40m code-review finding (blocker, partial-segment write): move3's own
// FSM-edge validation (transitionWork) used to run AFTER move1 and the
// attempt were already durably appended -- a bad finalStatus threw only at
// that point, leaving a durable 'doing' with no active claim (settleClaim
// had already released it in the old unconditional finally) and an
// attempt record with no matching terminal transition to explain it.
test('settleClaim with an invalid finalStatus writes NOTHING durably -- no partial segment, claim survives untouched', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 12', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' });

  assert.throws(
    () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'not-a-status' }),
    (err) => err.category === 'precondition' || err.category === 'validation',
  );

  const events = readRawEvents(dir);
  assert.equal(events.filter((e) => e.type === 'work.move').length, 0, 'no partial work.move must land durably');
  assert.equal(events.filter((e) => e.type === 'work.attempt').length, 0, 'no orphaned work.attempt must land durably');
  assert.ok(readClaim(dir, 'tsk-1'), 'the claim must survive an invalid-finalStatus attempt, not be silently dropped');
  assert.equal(readClaim(dir, 'tsk-1').claimId, claim.claimId);
  assert.equal(listWork(dir).work['tsk-1'].status, 'doing', 'effective view must still show the still-active (untouched) claim as doing');
});

// tsk-40m code-review finding (blocker): a settle that fails BEFORE any
// durable write (a CAS/revision conflict) used to still release the claim
// in an unconditional `finally` -- destroying still-legitimate
// coordination state for real in-progress work on a failure that wrote
// nothing at all, silently dropping the item back to an unclaimed
// "todo"-looking effective status with no attempt history.
test('settleClaim on a CAS/revision conflict leaves the claim untouched -- a failed settle must never destroy still-legitimate coordination state', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 13', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo', preClaimRevision: 'a-revision-that-will-never-match' });

  assert.throws(
    () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' }),
    (err) => err instanceof StoreError && err.category === 'conflict',
  );

  const events = readRawEvents(dir);
  assert.equal(events.filter((e) => e.type === 'work.move').length, 0, 'no work.move must land durably on a CAS conflict');
  assert.equal(events.filter((e) => e.type === 'work.attempt').length, 0, 'no work.attempt must land durably on a CAS conflict');
  assert.ok(readClaim(dir, 'tsk-1'), 'the claim must survive a CAS conflict untouched, for its owner to retry or reconcile');
  assert.equal(readClaim(dir, 'tsk-1').claimId, claim.claimId);
  assert.equal(listWork(dir).work['tsk-1'].status, 'doing', 'effective view must still show the still-active claim as doing');
});

// tsk-40m code-review finding (blocker): a claim file can legitimately
// outlive the durable settle it belonged to (a process crash, or a
// releaseClaim failure, between the durable write succeeding and the
// claim file actually being unlinked). buildEffectiveView used to
// overlay ANY active claim as 'doing' unconditionally -- hiding a real
// durable awaiting-approval/blocked status behind a claim that no longer
// describes anything in progress, and potentially locking the item out of
// query/list flows that read effective status.
test('buildEffectiveView ignores a stale claim whose durable status has already moved past preClaimStatus, instead of overlaying it as doing', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 14', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' });

  // Simulate the crash scenario directly: the durable settle already
  // succeeded (moved the item to awaiting-approval), but the claim file
  // was never unlinked (a crash/timeout right after the durable write).
  moveWork(dir, { id: 'tsk-1', to: 'blocked', expectedStatus: 'todo' });

  const view = listWork(dir);
  assert.equal(view.work['tsk-1'].status, 'blocked', 'the real durable status must win over a stale claim, never hidden behind doing');
  assert.ok(view.work['tsk-1'].staleClaim, 'the stale claim must be surfaced, not silently dropped or silently trusted');
  assert.equal(view.work['tsk-1'].staleClaim.claimId, claim.claimId);
});

test('buildEffectiveView still trusts a claim with no preClaimStatus recorded (legacy data) -- never a false positive on old data', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 15', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  acquireClaim(dir, { id: 'tsk-1', actor: 'session' }); // no preClaimStatus passed

  const view = listWork(dir);
  assert.equal(view.work['tsk-1'].status, 'doing', 'a claim with no recorded preClaimStatus cannot be judged stale -- stays trusted as before');
  assert.equal(view.work['tsk-1'].staleClaim, undefined);
});

// tsk-40m code-review finding (non-blocking): buildEffectiveView's
// staleness check only compares status -- if durable CONTENT changes (an
// unrelated editWork) while status stays the same, the claim still reads
// as active (correct: it genuinely still IS the active claim for that
// status). settleClaim's own preClaimRevision check is the actual guard
// against this case, catching the content drift at settle time even
// though the effective-view overlay itself can't see it.
test('a durable content change with the SAME status is not flagged stale by buildEffectiveView, but settleClaim still catches it via preClaimRevision', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 16', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });

  // tsk-1ht: this test's own comment always claimed "a real edit by a
  // different actor", but originally called editWork with no writer
  // distinction at all -- same process, same default writer -- which
  // settleClaim's new same-writer reconcile branch would otherwise
  // legitimately let through. FGOS_SESSION_ID makes the different actor
  // genuine, so this test still proves what it always claimed to prove.
  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'session-A';
    const preClaimRevision = getItemDurableRevision(listWork(dir), 'tsk-1');
    const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo', preClaimRevision });

    // Durable content changes (title), status stays 'todo' -- a real edit by
    // a different actor, not this claim's own doing.
    process.env.FGOS_SESSION_ID = 'session-B';
    editWork(dir, { id: 'tsk-1', patch: { title: 'Task 16 (retitled)' } });

    const view = listWork(dir);
    assert.equal(view.work['tsk-1'].status, 'doing', 'status-only staleness check cannot see a content-only drift -- still reads as the active claim');
    assert.equal(view.work['tsk-1'].staleClaim, undefined);

    process.env.FGOS_SESSION_ID = 'session-A';
    assert.throws(
      () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' }),
      (err) => err instanceof StoreError && err.category === 'conflict',
      'settleClaim\'s own preClaimRevision check must still catch the content drift, even though the effective-view overlay could not',
    );
    assert.ok(readClaim(dir, 'tsk-1'), 'the claim must survive this conflict untouched');
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});

// tsk-1ht: settleClaim used to refuse ANY durable revision drift since claim
// time unconditionally, even when every intervening write came from the
// SAME writer that now holds the claim -- the routine mid-lifecycle `fgos
// edit` calls fgos-coding-planning/fgos-coding-discovering make by design
// (tier/kind/risk sync, docsRef registration, verify/action/footprint sync),
// never a concurrent conflict. Live repro: tsk-1sl (2026-08-26) claimed,
// edited several times by its own claiming session, then `fgos return`
// refused with exactly this conflict.
test('settleClaim reconciles a revision drift caused entirely by the SAME writer that holds the claim, instead of refusing', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 17', kind: 'bug', status: 'todo', deps: [], refs: [], risk: 'heavy', verify: 'npm test', domain: 'coding' });

  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'session-A';
    const preClaimRevision = getItemDurableRevision(listWork(dir), 'tsk-1');
    const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo', preClaimRevision });

    // Several routine same-writer edits, same shape fgos-coding-planning's
    // own field-sync steps make mid-lifecycle -- all writer "session-A".
    editWork(dir, { id: 'tsk-1', patch: { tier: 'standard' } });
    editWork(dir, { id: 'tsk-1', patch: { docsRef: 'docs/history/tsk-1/' } });
    editWork(dir, { id: 'tsk-1', patch: { verify: 'npm test -- test/foo.test.mjs', action: 'do the thing', footprint: ['src/foo.mjs'] } });

    const curRev = getItemDurableRevision(listWork(dir), 'tsk-1');
    assert.notEqual(curRev, preClaimRevision, 'the same-writer edits must actually have drifted the durable revision, or this test proves nothing');

    const res = settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' });
    assert.equal(res.view.work['tsk-1'].status, 'awaiting-approval', 'a same-writer drift must reconcile, not refuse');
    assert.equal(readClaim(dir, 'tsk-1'), null, 'the claim must release normally on a successful (reconciled) settle');
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});

// tsk-1ht: the live bug the first version of this fix actually shipped
// with -- `fgos decision`/`fgos gate-approve` never stamp `payload.writer`
// at all (confirmed: neither call site in store.mjs sets it), and
// fgos-coding-planning/fgos-coding-validating call them routinely
// mid-lifecycle. Treating them as drift-relevant made the reconcile fail
// closed on every real coding-domain item. Neither event actually mutates
// view.work[id] (decision -> view.decisions/decisionsById, gate-approve ->
// view.gates -- both side logs replay.mjs folds separately), so they must
// never block the same-writer reconcile regardless of writer stamp.
test('settleClaim reconciles a same-writer drift even when unstamped side-log events (decision, gate-approve) also happened mid-claim', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 20', kind: 'bug', status: 'todo', deps: [], refs: [], risk: 'heavy', verify: 'npm test', domain: 'coding' });

  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'session-A';
    const preClaimRevision = getItemDurableRevision(listWork(dir), 'tsk-1');
    const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo', preClaimRevision });

    editWork(dir, { id: 'tsk-1', patch: { tier: 'standard' } });
    addDecision(dir, { id: 'tsk-1', text: 'a routine mid-lifecycle decision', rationale: 'because', kind: 'engine' });
    recordGateApprove(dir, { id: 'tsk-1', gate: 'validateApprove', actor: 'bypass', verify: 'npm test' });

    const curRev = getItemDurableRevision(listWork(dir), 'tsk-1');
    assert.notEqual(curRev, preClaimRevision, 'the same-writer edit must actually have drifted the durable revision, or this test proves nothing');

    const res = settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' });
    assert.equal(res.view.work['tsk-1'].status, 'awaiting-approval', 'unstamped decision/gate-approve events must never block a real same-writer reconcile');
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});

// The distinguishing case the reconcile must never let through: a durable
// edit stamped with a GENUINELY DIFFERENT writer's identity landing on a
// claimed item must still refuse settle exactly as before this fix --
// nothing here weakens the real conflict-refusal floor. Unlike the existing
// "durable content change with the SAME status" test above (which calls
// editWork with no writer distinction at all), this test controls
// FGOS_SESSION_ID across the edit to construct a genuinely different writer.
test('settleClaim still refuses a revision drift caused by a GENUINELY DIFFERENT writer, even under the same-writer reconcile', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 18', kind: 'bug', status: 'todo', deps: [], refs: [], risk: 'heavy', verify: 'npm test', domain: 'coding' });

  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'session-A';
    const preClaimRevision = getItemDurableRevision(listWork(dir), 'tsk-1');
    const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo', preClaimRevision });

    process.env.FGOS_SESSION_ID = 'session-B';
    editWork(dir, { id: 'tsk-1', patch: { title: 'Task 18 (retitled by a different writer)' } });

    process.env.FGOS_SESSION_ID = 'session-A';
    assert.throws(
      () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' }),
      (err) => err instanceof StoreError && err.category === 'conflict',
      'a genuinely different writer\'s edit must still refuse settle -- the reconcile only ever covers the SAME writer',
    );
    assert.ok(readClaim(dir, 'tsk-1'), 'the claim must survive this genuine conflict untouched');
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});

// recordClaimAttempt's own reclaim record (src/runner/claim-port.mjs) never
// stamps `payload.writer` at all -- the reconcile must fail CLOSED on a
// missing writer stamp (never treat "no evidence" as "same writer"), or a
// genuinely different actor's stale-claim-reclaim could slip through
// unnoticed.
test('settleClaim treats an event with no writer stamp at all as NOT self-caused (fails closed, keeps refusing)', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 19', kind: 'bug', status: 'todo', deps: [], refs: [], risk: 'heavy', verify: 'npm test', domain: 'coding' });

  const originalSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'session-A';
    const preClaimRevision = getItemDurableRevision(listWork(dir), 'tsk-1');
    const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo', preClaimRevision });

    editWork(dir, { id: 'tsk-1', patch: { tier: 'standard' } });

    // Simulate an unstamped event touching this id landing in the log
    // directly (the shape recordClaimAttempt writes -- no payload.writer).
    const logPath = path.join(dir, 'events.jsonl');
    fs.appendFileSync(logPath, `${JSON.stringify({ type: 'work.attempt', payload: { id: 'tsk-1', phase: 'claim', result: 'reclaimed' }, ts: Date.now() })}\n`, 'utf8');

    assert.throws(
      () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-approval' }),
      (err) => err instanceof StoreError && err.category === 'conflict',
      'an unstamped event in the drift window must fail the reconcile closed',
    );
  } finally {
    if (originalSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = originalSessionId;
  }
});

// tsk-40m code-review finding (test gap): status-fsm.mjs requires a
// non-empty `ask` for the doing -> awaiting-human edge. This must go
// through the SAME build-both-legs-before-appending-either guard as an
// invalid finalStatus (they are both transitionWork failures on move3) --
// locked here as its own regression rather than relying on the invalid-
// finalStatus test to imply it.
test('settleClaim to finalStatus:"awaiting-human" with no ask writes NOTHING durably, claim survives untouched', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 17', kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'session', preClaimStatus: 'todo' });

  assert.throws(
    () => settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'awaiting-human' }),
    (err) => err.category === 'precondition' || err.category === 'validation',
  );

  const events = readRawEvents(dir);
  assert.equal(events.filter((e) => e.type === 'work.move').length, 0, 'no partial work.move must land durably');
  assert.equal(events.filter((e) => e.type === 'work.attempt').length, 0, 'no orphaned work.attempt must land durably');
  assert.ok(readClaim(dir, 'tsk-1'), 'the claim must survive a missing-ask attempt, not be silently dropped');
  assert.equal(readClaim(dir, 'tsk-1').claimId, claim.claimId);
});

// tsk-40m (docs/architect/doing-coordination-redesign.md §7.3): a
// same-state settle (finalStatus === preClaimStatus -- e.g. a branch-take
// item failing verify again while already 'blocked') has nothing to
// durably move: status-fsm.mjs has no self-loop edges by design. The
// work.attempt is the complete durable record; there is no work.move at
// all, and the returned event is the attempt itself (still real, still
// seq-bearing).
test('settleClaim with finalStatus === preClaimStatus writes only work.attempt, no work.move at all', () => {
  const dir = makeTmpDir();
  addWork(dir, { id: 'tsk-1', title: 'Task 18', kind: 'feature', status: 'blocked', deps: [], refs: [], risk: 'standard', verify: 'npm test', domain: 'coding' });
  const claim = acquireClaim(dir, { id: 'tsk-1', actor: 'runner', preClaimStatus: 'blocked' });

  const res = settleClaim(dir, { id: 'tsk-1', claimId: claim.claimId, finalStatus: 'blocked', reason: 'verify-fail', role: 'runner' });

  assert.equal(typeof res.event.seq, 'number');
  assert.equal(res.event.type, 'work.attempt', 'with nothing to durably move, the attempt itself is the returned final event');

  const raw = readRawEvents(dir).filter((e) => e.payload?.id === 'tsk-1');
  assert.equal(raw.filter((e) => e.type === 'work.move').length, 0, 'a same-state settle writes no work.move at all');
  assert.equal(raw.filter((e) => e.type === 'work.attempt').length, 1);
  assert.equal(raw[raw.length - 1].payload.from, 'blocked');
  assert.equal(raw[raw.length - 1].payload.to, 'blocked');
  assert.equal(raw[raw.length - 1].payload.reason, 'verify-fail');

  assert.equal(listWork(dir).work['tsk-1'].status, 'blocked');
  assert.equal(listWork(dir).work['tsk-1'].lastAttempt.reason, 'verify-fail');
  assert.equal(readClaim(dir, 'tsk-1'), null, 'the claim must still be released on a successful same-state settle');
});
