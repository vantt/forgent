// test/runner/execution/run-provider-failover.test.mjs -- a seat whose provider fails first rotates
// to another account of the same provider, then walks to the next candidate, and is a failure only
// when both are used up. Which answer a limit gets is the pure table in account-rotation.test.mjs and the
// walk is the golden cases of Seat Binding; this file keeps the real runs that wire them together. Everything
// goes through runUnit; the workers are real confined processes whose behaviour depends on the account
// login they were given (a marker file in the account home).

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { inspectProviderCapacity } from '../../../src/runner/dispatch/provider-capacity.mjs';
import {
  SKIP, setup, run, solo, writer, pin, unitRuns, attemptsOf, summaryOf, runFile, selectedAccount, readJson, unitDirOf,
} from '../../helpers/failover-fixture.mjs';

test('a dead login moves the seat to another account of the same provider, not to another provider', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, { ...solo('u-rotate'), timeoutMs: 5400000 });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']], 'the same executor runs again');
  assert.equal(attempts[1].assignmentId, `${res.unitRunId}/producer/1-fb1`);
  assert.equal(attempts[1].leaseReceipt.accountId, 'live1', 'a taken lease leaves the receipt the provider record agrees with');
  assert.deepEqual(attempts.map((a) => a.binding.pool), ['alpha', 'alpha']);
  assert.deepEqual(attempts.map((a) => a.binding.model), ['fake', 'fake']);
  assert.equal(attempts[1].binding.invocation, attempts[0].binding.invocation);
  assert.equal(attempts[0].fallbackFrom, null);
  assert.equal(attempts[1].fallbackFrom.kind, 'account-rotation');
  assert.equal(attempts[1].fallbackFrom.pool, 'alpha');
  assert.equal(attempts[1].fallbackFrom.reason, 'provider-limit');

  // The first attempt ran on the dead login and ended as a credential fault; the retry got the other account.
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'dead1');
  assert.equal(selectedAccount(fx.repoRoot, res, '1-fb1'), 'live1');
  const first = runFile(fx.repoRoot, res, '1', 'result.json');
  assert.equal(first.classification.failure.code, 'provider-limit');
  assert.equal(first.classification.failure.cause, 'credential');
  const capacity = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, provider: 'alpha', runtimeDir: fx.runtimeDir });
  assert.equal(capacity.providers.alpha.accounts.dead1.quarantine.reasonCode, 'auth-token');
  assert.equal(capacity.providers.alpha.accounts.live1.healthy, true);

  assert.ok(attempts.every((a) => a.writeBaseline === undefined), 'a read-only seat records no write baseline, so nothing it did not write can stop its retry');

  // The unit's own run timeout rides the retry, and an attempt whose outcome is recorded leaves no entry in the provider state.
  assert.deepEqual(attempts.map((a) => a.binding.timeoutMs), [5400000, 5400000]);
  for (const sub of ['1', '1-fb1']) assert.equal(runFile(fx.repoRoot, res, sub, 'run.json').timeoutMs, 5400000, sub);
  const { assignments } = readJson(path.join(fx.runtimeDir, 'state.json'));
  assert.deepEqual(Object.keys(assignments).filter((key) => key.includes(res.unitRunId)), []);

  // The other provider never ran, and the summary shows the seat's attempts in order.
  assert.equal(fs.existsSync(path.join(unitDirOf(fx.repoRoot, res), 'producer', '1-fb2')), false);
  const seat = summaryOf(fx.repoRoot, res).seats[0];
  assert.deepEqual(seat.attempts.map((a) => [a.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
  assert.equal(seat.final.fallbackFrom.kind, 'account-rotation');
});

test('a usage limit on a headless round moves the seat to another account of the same provider', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { spent1: 'quota', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const before = Date.now();
  const res = await run(fx, solo('u-quota'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.kind, 'account-rotation');
  assert.equal(attempts[0].failureCause, undefined, 'a quota stop does not mark the provider family as a dead login');
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'spent1');
  assert.equal(selectedAccount(fx.repoRoot, res, '1-fb1'), 'live1');

  // The round is a quota stop, not a dead login and not a generic non-zero exit.
  const first = runFile(fx.repoRoot, res, '1', 'result.json');
  assert.equal(first.classification.failure.code, 'provider-limit');
  assert.equal(first.classification.failure.cause, 'quota');

  // The account waits out the reset time the provider printed (11:39 PM local, the next one), held
  // by the existing quarantine record rather than a second field on the result.
  const capacity = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, provider: 'alpha', runtimeDir: fx.runtimeDir });
  const quarantine = capacity.providers.alpha.accounts.spent1.quarantine;
  assert.equal(quarantine.reasonCode, 'quota-limit');
  const until = Date.parse(quarantine.until);
  assert.ok(until > before && until <= before + 24 * 3600 * 1000, quarantine.until);
  assert.deepEqual([new Date(until).getHours(), new Date(until).getMinutes()], [23, 39]);
  assert.equal(capacity.providers.alpha.accounts.live1.healthy, true);
});


// An account pinned by an override is hard: the seat runs that account (what a limit on it does is decided by
// the pinned case of the answer table in account-rotation.test.mjs).

test('a pinned account runs, even when the lease would rank another account first', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live', a2: 'live' } } }, { recentlyUsed: { alpha: ['a2'] } });
  const res = await run(fx, solo('u-pin'), pin('alpha/a2'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'a2');
  const [attempt] = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempt.binding.account, { pool: 'alpha', id: 'a2' });
  assert.deepEqual(attempt.binding.provenance.account, { value: 'alpha/a2', source: 'override:human-cli' });
});

test('a quarantined pinned account is refused before any unit run exists, and a resume of a run pinned to it too', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { spent1: 'quota', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const first = await run(fx, solo('u-pin-quota'), pin('alpha/spent1'));
  assert.equal(first.outcome, 'provider-limit');
  const until = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, provider: 'alpha', runtimeDir: fx.runtimeDir }).providers.alpha.accounts.spent1.quarantine.until;
  assert.ok(until);

  const before = unitRuns(fx);
  await assert.rejects(run(fx, solo('u-pin-quota-again'), pin('alpha/spent1')), (err) => {
    assert.match(err.message, /account "alpha\/spent1" is quarantined/);
    assert.ok(err.message.includes(until), err.message);
    return true;
  });
  assert.deepEqual(unitRuns(fx), before, 'no unit run was created');

  await assert.rejects(runUnit({
    resumeUnitRunId: first.unitRunId,
    repoRoot: fx.repoRoot,
    cwd: fx.worktreeDir,
    worktree: fx.worktreeDir,
    session: { herdrPresent: false, headless: true },
    providerCapacityRuntimeDir: fx.runtimeDir,
  }), (err) => err.message.includes('"alpha/spent1"') && err.message.includes(until));
  assert.equal(attemptsOf(fx.repoRoot, first).length, 1, 'the resume dispatched nothing');
});

test('an account of a provider no candidate of the seat belongs to is refused before any unit run exists', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live' } }, beta: { family: 'beta', logins: { b1: 'live' } } }, { prefer: ['alpha'] });
  await assert.rejects(run(fx, solo('u-pin-other'), pin('beta/b1')), /applies to no seat.*"beta\/b1".*pool "beta"/s);
  assert.deepEqual(unitRuns(fx), []);
});

test('an account pin the caller asked to apply where it is served runs a unit no seat takes unpinned; a strict pin, the default, refuses it, and an unknown pin mode is refused', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live' } }, beta: { family: 'beta', logins: { b1: 'live' } } }, { prefer: ['alpha'] });
  const res = await run(fx, solo('u-pin-where-served'), { overrides: [{ account: 'beta/b1' }], accountPin: 'where-served' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const [attempt] = attemptsOf(fx.repoRoot, res);
  assert.equal(attempt.binding.executor, 'alpha');
  assert.notEqual(attempt.binding.account?.pool, 'beta');
  await assert.rejects(run(fx, solo('u-pin-strict'), { overrides: [{ account: 'beta/b1' }], accountPin: 'strict' }), /applies to no seat/);
  await assert.rejects(run(fx, solo('u-pin-default'), pin('beta/b1')), /applies to no seat/);
  await assert.rejects(run(fx, solo('u-pin-mode'), { overrides: [{ account: 'beta/b1' }], accountPin: 'anywhere' }), /accountPin must be one of strict, where-served/);
});

// A writing seat that already changed the worktree before its provider limit is not run again on top of its own
// half-done work: the seat stops, and the attempt lists what changed (the decision itself is a case of the answer
// table in account-rotation.test.mjs). A resume takes a new baseline, so work a person kept does not stop the next rotation.
test('a writing seat that changed the worktree before a provider limit stops; a resume takes a new baseline and its next rotation is not stopped by the work a person kept', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partial1: 'partial', spent2: 'quota', live3: 'live' } } },
    { recentlyUsed: { alpha: ['spent2', 'live3'] } },
  );
  const first = await run(fx, writer('u-partial-resume'));
  assert.equal(first.outcome, 'provider-limit', JSON.stringify(first.results[0]).slice(0, 1500));
  const firstAttempts = attemptsOf(fx.repoRoot, first);
  assert.deepEqual(firstAttempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit']]);
  const exhausted = first.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'partial-writes');
  assert.deepEqual(exhausted.paths, ['README.md', 'README.old', 'notes.txt']);
  assert.deepEqual(firstAttempts[0].retryStopped.paths, exhausted.paths, 'the stop is recorded on the attempt');
  assert.equal(fs.readFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'utf8'), 'half', 'the half-done work is left as it is');
  // The person keeps the half-done work (the files stay as they are) and resumes. The seat did not pass, so it
  // is bound again as a new attempt: partial1 is quarantined now, so the lease takes spent2, whose quota stop
  // writes nothing: that seat rotates.
  fs.writeFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'kept');
  const resumed = await runUnit({
    resumeUnitRunId: first.unitRunId,
    repoRoot: fx.repoRoot,
    cwd: fx.worktreeDir,
    worktree: fx.worktreeDir,
    session: { herdrPresent: false, headless: true },
    providerCapacityRuntimeDir: fx.runtimeDir,
  });
  const attempts = attemptsOf(fx.repoRoot, resumed);
  assert.deepEqual(attempts.slice(1).map((a) => a.fallbackFrom?.kind ?? null), [null, 'account-rotation'], JSON.stringify(resumed.results[0].fallbackExhausted));
  assert.equal(attempts[0].leaseConflict, undefined, 'the first attempt ran and stays as it was');
  assert.equal(selectedAccount(fx.repoRoot, resumed, '1-fb1'), 'spent2');
  assert.equal(selectedAccount(fx.repoRoot, resumed, '1-fb2'), 'live3');
});

