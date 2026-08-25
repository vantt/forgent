import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { initStore, addWork, settleClaim, listWork, readyWork, moveWork, graphWhatIf, footprintConflicts, computedSchedule, staleDoingAdvisory, StoreError } from '../../src/state/store.mjs';
import { acquireClaim, releaseClaim, readClaim, readClaims, buildEffectiveView, getItemDurableRevision } from '../../src/state/runtime-coordination.mjs';

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
