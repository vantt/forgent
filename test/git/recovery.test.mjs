import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './land-fixture.mjs';
import { createGitRecovery, createGitSafeRestore } from '../../src/git/index.mjs';

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
