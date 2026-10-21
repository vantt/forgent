import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './land-fixture.mjs';
import { createGitRecovery, createGitSafeRestore } from '../../src/git/index.mjs';
import { fixLandRecovery, checkLandRetainedCandidates } from '../../src/setup/git-checks.mjs';

test('Recovery lists and inspects an interrupted Land and delegates to its existing recovery', () => {
  const f = fixture();
  try {
    const land = f.port();
    land.prepare({operationId:'interrupted-land',request:f.request});
    land.close();
    const recovery = createGitRecovery(f.options,f.loader);
    const listed = recovery.listPending();
    assert.equal(listed.complete,true);
    assert.deepEqual(listed.operations.map(o => [o.operationId,o.kind]),[['interrupted-land','Land']]);
    const inspected = recovery.inspectOperation({operationId:'interrupted-land'});
    assert.equal(inspected.terminal,false);
    assert.match(inspected.requestDigest,/^[a-f0-9]{64}$/);
    const reconciled = recovery.reconcile({operationId:'interrupted-land'});
    assert.deepEqual(reconciled,land.recover({operationId:'interrupted-land'}).receipt);
    assert.equal(recovery.listPending().operations.length,0);
    assert.equal(recovery.inspectOperation({operationId:'interrupted-land'}).terminal,true);
    // An id with no journal is no attempt at all: its own exact cause, so a
    // caller can start one instead of failing on any read error.
    assert.throws(() => recovery.inspectOperation({operationId:'never-journalled'}), err => JSON.parse(err.message).cause === 'git-operation-unknown');
  } finally { f.close(); }
});
test('doctor --fix recovers an interrupted Land through the Recovery door and then has nothing left to recover', () => {
  const f = fixture();
  try {
    const land = f.port();
    land.prepare({operationId:'interrupted-fix',request:f.request});
    land.close();
    const fixed = fixLandRecovery(f.repo,f.loader,f.options);
    assert.equal(fixed.changed,true,fixed.message);
    assert.match(fixed.message,/recovered interrupted Land operations: interrupted-fix/);
    assert.equal(createGitRecovery(f.options,f.loader).inspectOperation({operationId:'interrupted-fix'}).terminal,true);
    assert.deepEqual(fixLandRecovery(f.repo,f.loader,f.options),{changed:false,message:'no interrupted Land operation'});
  } finally { f.close(); }
});
test('doctor warns, never fails, about a finished Land whose candidate is still retained', () => {
  const f = fixture();
  try {
    assert.deepEqual(checkLandRetainedCandidates(f.repo,f.loader),{passed:true,message:'no retained Land candidate'});
    const land = f.port();
    land.prepare({operationId:'retained-land',request:f.request});
    land.close();
    fixLandRecovery(f.repo,f.loader,f.options);
    const row = checkLandRetainedCandidates(f.repo,f.loader,f.options);
    assert.equal(row.passed,true);
    assert.match(row.message,/^warning: retained Land candidates: retained-land \(/);
    assert.match(row.message,/pins refs\/fgos\/git-operations\/retained-land\/candidate, refs\/fgos\/git-operations\/retained-land\/source\/candidate, refs\/fgos\/git-operations\/retained-land\/target\/candidate/);
    assert.match(row.message,/No manual release command exists today/);
  } finally { f.close(); }
});
test('Recovery terminal Restore replay delegates without changing its outcome', () => {
  const f = fixture();
  try {
    const restore = createGitSafeRestore(f.options,f.loader);
    const request = {expectedHead:f.request.target,target:f.request.source,reason:'recovery contract'};
    const result = restore.apply({operationId:'restore',request});
    const recovery = createGitRecovery(f.options,f.loader);
    assert.equal(recovery.inspectOperation({operationId:'restore'}).kind,'Restore');
    assert.deepEqual(recovery.reconcile({operationId:'restore'}),result);
    assert.deepEqual(recovery.listPending().operations,[]);
  } finally { f.close(); }
});
