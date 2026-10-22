// The exec budget of Seat Binding: one host exec per bind, so a seat costs one for its first binding, one for
// each step of its walk and one for each lease conflict, and none is ever made while a state lock is held (the
// client refuses inside it). A spy on the process's spawnSync records every seat-binding call and whether a
// state lock was held when it started.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';

import { SKIP, setup, run, panel, attemptsOf } from '../helpers/failover-fixture.mjs';
import { bindSeat, resetSeatBindingClient, SeatBindingError } from '../../src/seat-binding/client.mjs';
import { withProviderStateLock } from '../../src/runner/dispatch/provider-capacity.mjs';
import { stateLockHeld } from '../../src/util/state-lock-held.mjs';
import { golden, caseInput } from './golden-cases.helper.mjs';

/** Records every seat-binding host exec until `restore()`: whether a state lock was held at its start. */
function spyOnSeatBindingExecs() {
  const calls = [];
  const original = childProcess.spawnSync;
  childProcess.spawnSync = function spy(command, args, ...rest) {
    if (Array.isArray(args) && args[0] === 'internal' && args[1] === 'seat-binding') calls.push({ op: args[2], underLock: stateLockHeld() });
    return original.call(this, command, args, ...rest);
  };
  syncBuiltinESMExports();
  resetSeatBindingClient();
  return {
    calls,
    restore() {
      childProcess.spawnSync = original;
      syncBuiltinESMExports();
      resetSeatBindingClient();
    },
  };
}

test('a panel makes one seat-binding exec per seat, one per walk step and one per lease conflict, none under a lock', { skip: SKIP }, async (t) => {
  const spy = spyOnSeatBindingExecs();
  t.after(() => spy.restore());

  // Three members and a synthesizer.
  const fx = setup({ alpha: { family: 'alpha', logins: { dead1: 'dead' } }, beta: { family: 'beta' }, gamma: { family: 'gamma' }, delta: { family: 'delta' }, epsilon: { family: 'epsilon' } });
  const res = await run(fx, panel('u-exec-budget'), { pattern: 'panel' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.seat, r.outcome])));

  // The first member's only account is dead and walks once; the synthesizer binds after it, is offered the
  // dead login (one real call may lift it), and its lease conflicts once.
  const seatKeys = ['member-1/1', 'member-2/1', 'member-3/1', 'synthesizer/1'];
  const attempts = seatKeys.flatMap((key) => attemptsOf(fx.repoRoot, res, key));
  const walkSteps = attempts.filter((a) => a.fallbackFrom?.kind === 'next-candidate').length;
  const conflicts = attempts.filter((a) => a.leaseConflict === true).length;
  assert.deepEqual([walkSteps, conflicts], [1, 1]);
  const seats = seatKeys.length;
  assert.equal(spy.calls.filter((c) => c.op === 'bind').length, seats + walkSteps + conflicts);
  assert.deepEqual(spy.calls.filter((c) => c.underLock), [], 'no seat-binding exec started while a state lock was held');
});

test('the provider state lock is a state lock: a seat-binding call made inside it is refused before any exec', (t) => {
  const spy = spyOnSeatBindingExecs();
  t.after(() => spy.restore());
  const inside = [];
  withProviderStateLock(() => {
    try {
      bindSeat(caseInput(golden.cases[0]));
      inside.push('exec');
    } catch (err) {
      inside.push(err instanceof SeatBindingError ? err.code : err.message);
    }
  });
  assert.deepEqual(inside, ['seat-binding-in-lock']);
  assert.deepEqual(spy.calls, [], 'the host was never started under the lock');
  assert.ok(bindSeat(caseInput(golden.cases[0])).protocol, 'the same call outside the lock answers');
  assert.deepEqual(spy.calls.map((c) => [c.op, c.underLock]), [['bind', false]]);
});
