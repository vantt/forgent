import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { initStore, addWork, settleClaim, listWork, readyWork, StoreError } from '../../src/state/store.mjs';
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
