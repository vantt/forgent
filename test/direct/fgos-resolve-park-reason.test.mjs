// The cases of resolve-park-reason, called in this process through resolveParkReason. test/cli/fgos-edit.test.mjs
// keeps its CLI wiring: the required --note flag and the envelope.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { addOk, moveOk, stateView, tmpCwdFast, toDoneViaChain } from '../cli/helpers/fgos-cli-harness.mjs';
import { readRawEvents, resolveParkReason, StoreError } from '../../src/state/store.mjs';

const fgosDir = (cwd) => path.join(cwd, '.fgos');

function move(cwd, id, to, options = {}) {
  const result = moveOk(cwd, id, to, options);
  assert.equal(result.status, 0, `fixture move of ${id} to ${to}: ${result.stderr}`);
}

/** An item parked blocked with `reason`, then finished to done or wontfix. */
function parkThenFinish(cwd, id, { reason, finish }) {
  assert.equal(addOk(cwd, id).status, 0);
  move(cwd, id, 'awaiting-approval', { skipReturnGuard: 'test setup' });
  if (reason) move(cwd, id, 'blocked', { reason });
  if (finish === 'wontfix') {
    move(cwd, id, 'wontfix');
  } else {
    if (reason) move(cwd, id, 'awaiting-approval', { skipReturnGuard: 'test setup' });
    toDoneViaChain(cwd, id);
  }
}

const refused = (pattern) => (err) => err instanceof StoreError && err.category === 'validation' && pattern.test(err.message);

test('resolve-park-reason refuses an unknown id, an empty note and a non-terminal item as validation, writing no event', () => {
  const cwd = tmpCwdFast();
  assert.equal(addOk(cwd, 'resolve-non-terminal').status, 0);

  assert.throws(() => resolveParkReason(fgosDir(cwd), { id: 'unknown-id', note: 'human override' }), refused(/not found/));
  assert.throws(() => resolveParkReason(fgosDir(cwd), { id: 'resolve-non-terminal', note: '  ' }), refused(/non-empty --note/));
  // todo, then awaiting-approval, then blocked with a reason: none is terminal.
  assert.throws(() => resolveParkReason(fgosDir(cwd), { id: 'resolve-non-terminal', note: 'clearing' }), refused(/terminal items/));
  move(cwd, 'resolve-non-terminal', 'awaiting-approval', { skipReturnGuard: 'test setup' });
  assert.throws(() => resolveParkReason(fgosDir(cwd), { id: 'resolve-non-terminal', note: 'clearing' }), refused(/terminal items/));
  move(cwd, 'resolve-non-terminal', 'blocked', { reason: 'parked reason' });
  const parked = readRawEvents(fgosDir(cwd)).length;
  assert.throws(() => resolveParkReason(fgosDir(cwd), { id: 'resolve-non-terminal', note: 'clearing' }), refused(/terminal items/));

  assert.equal(readRawEvents(fgosDir(cwd)).length, parked, 'a refusal writes no event');
});

test('resolve-park-reason on a done item clears reason and parkReason and records the trimmed note in parkResolutions', () => {
  const cwd = tmpCwdFast();
  parkThenFinish(cwd, 'resolve-done-item', { reason: 'commit X is no longer reachable from fgw/parent', finish: 'done' });
  const before = stateView(cwd).work['resolve-done-item'];
  assert.equal(before.reason, 'commit X is no longer reachable from fgw/parent');
  assert.equal(before.parkReason, 'natural-finish');

  resolveParkReason(fgosDir(cwd), { id: 'resolve-done-item', note: '  Human confirmed content is present on main ' });

  const view = stateView(cwd);
  assert.equal(view.work['resolve-done-item'].reason, undefined);
  assert.equal(view.work['resolve-done-item'].parkReason, undefined);
  assert.deepEqual(view.parkResolutions['resolve-done-item'].map((r) => r.note), ['Human confirmed content is present on main']);
});

test('resolve-park-reason on a wontfix item clears its reason', () => {
  const cwd = tmpCwdFast();
  parkThenFinish(cwd, 'resolve-wontfix-item', { reason: 'stale park text', finish: 'wontfix' });
  assert.equal(stateView(cwd).work['resolve-wontfix-item'].reason, 'stale park text');

  resolveParkReason(fgosDir(cwd), { id: 'resolve-wontfix-item', note: 'Closed as wontfix and verified safe' });

  const view = stateView(cwd);
  assert.equal(view.work['resolve-wontfix-item'].reason, undefined);
  assert.equal(view.parkResolutions['resolve-wontfix-item'][0].note, 'Closed as wontfix and verified safe');
});

test('resolve-park-reason on a done item that never had a reason is a no-op clear that still records the note', () => {
  const cwd = tmpCwdFast();
  parkThenFinish(cwd, 'resolve-no-reason-item', { finish: 'done' });
  assert.equal(stateView(cwd).work['resolve-no-reason-item'].reason, undefined);

  resolveParkReason(fgosDir(cwd), { id: 'resolve-no-reason-item', note: 'Clean close check' });

  const view = stateView(cwd);
  assert.equal(view.work['resolve-no-reason-item'].reason, undefined);
  assert.equal(view.parkResolutions['resolve-no-reason-item'][0].note, 'Clean close check');
});

test('resolve-park-reason clears only its own item: another item parked afterwards keeps the reason its move recorded', () => {
  const cwd = tmpCwdFast();
  parkThenFinish(cwd, 'resolve-item-a', { reason: 'parked reason A', finish: 'done' });
  resolveParkReason(fgosDir(cwd), { id: 'resolve-item-a', note: 'cleared A' });
  assert.equal(addOk(cwd, 'active-item-b').status, 0);
  move(cwd, 'active-item-b', 'awaiting-approval', { skipReturnGuard: 'test setup' });
  move(cwd, 'active-item-b', 'blocked', { reason: 'parked reason B' });

  const view = stateView(cwd);
  assert.equal(view.work['resolve-item-a'].reason, undefined);
  assert.equal(view.work['active-item-b'].reason, 'parked reason B');
});
