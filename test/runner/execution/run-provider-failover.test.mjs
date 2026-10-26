// test/runner/execution/run-provider-failover.test.mjs -- a seat whose provider fails first rotates
// to another account of the same provider, then walks to the next candidate, and is a failure only
// when both are used up. Everything goes through runUnit; the workers are real confined processes
// whose behaviour depends on the account login they were given (a marker file in the account home).

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { inspectProviderCapacity, quarantineProviderAccount } from '../../../src/runner/dispatch/provider-capacity.mjs';
import { seatLaunchesUsed } from '../../../src/runner/execution/case-admission-port.mjs';
import {
  SKIP, setup, run, solo, panel, writer, pin, unitRuns, attemptsOf, summaryOf, runFile, selectedAccount, readJson, unitDirOf,
} from '../../helpers/failover-fixture.mjs';

test('a dead login moves the seat to another account of the same provider, not to another provider', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, solo('u-rotate'));
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

test('a usage limit is recognised without an account lease and walks to the next provider', { skip: SKIP }, async () => {
  // No inventory for the spent provider: nothing is leased or quarantined, yet the stop is still a
  // provider limit, so the seat moves on instead of failing.
  const fx = setup({ spent: { family: 'spentquota' }, beta: { family: 'beta' } });
  const res = await run(fx, solo('u-quota-nolease'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['spent', 'provider-limit'], ['beta', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.kind, 'next-candidate');
  const first = runFile(fx.repoRoot, res, '1', 'result.json');
  assert.equal(first.classification.failure.cause, 'quota');
  assert.equal(fs.existsSync(path.join(unitDirOf(fx.repoRoot, res), 'producer', '1', 'runs', '01', 'provider-capacity-selection.json')), false);
});

test('a provider with one account goes straight to the next provider', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { dead1: 'dead' } }, beta: { family: 'beta' } });
  const res = await run(fx, solo('u-one-account'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.kind, 'next-candidate');
  assert.equal(attempts[1].fallbackFrom.executor, 'alpha');
  assert.equal(attempts[1].fallbackFrom.walk, 'family');
  assert.deepEqual(attempts.map((a) => a.binding.pool), ['alpha', 'beta']);
});

test('rotation stops after the accounts the provider has, then the walk leaves the provider; the unit\'s run timeout rides every attempt', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { dead1: 'dead', dead2: 'dead' } }, beta: { family: 'beta' } });
  const res = await run(fx, { ...solo('u-rotation-spent'), timeoutMs: 5400000 });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.deepEqual(attempts.map((a) => a.fallbackFrom?.kind ?? null), [null, 'account-rotation', 'next-candidate']);
  assert.deepEqual([selectedAccount(fx.repoRoot, res, '1'), selectedAccount(fx.repoRoot, res, '1-fb1')].sort(), ['dead1', 'dead2']);
  // The account-rotation retry and the next candidate keep the unit's own run timeout.
  assert.deepEqual(attempts.map((a) => a.binding.timeoutMs), [5400000, 5400000, 5400000]);
  const subdirs = fs.readdirSync(path.join(unitDirOf(fx.repoRoot, res), 'producer')).sort();
  assert.equal(subdirs.length, 3);
  for (const sub of subdirs) assert.equal(runFile(fx.repoRoot, res, sub, 'run.json').timeoutMs, 5400000, sub);
});

test('a provider whose login just failed is not picked again by the walk, even through another executor of it', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    'alpha-lite': { family: 'alpha' },
    beta: { family: 'beta' },
  });
  const res = await run(fx, solo('u-credential-family'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']], 'alpha-lite shares the failed provider and is skipped');
  assert.deepEqual(attempts.map((a) => a.binding.pool), ['alpha', 'beta']);
});

test('when every account and every candidate is used up the seat and the unit fail', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead', dead2: 'dead' } },
    beta: { family: 'beta', logins: { dead3: 'dead' } },
  });
  const res = await run(fx, solo('u-exhausted'));
  assert.equal(res.outcome, 'provider-limit');
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.from.executor, 'beta');
  assert.ok(exhausted.reason);
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'provider-limit'], ['beta', 'provider-limit']]);
  assert.notEqual(summaryOf(fx.repoRoot, res).outcome, 'pass');
});


test('a writing seat passes the mutating gate on its account-rotation retry', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, writer('u-writer-rotate'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
});

test('a writing seat passes the mutating gate on a walk that skipped a provider with a dead login', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    'alpha-lite': { family: 'alpha' },
    beta: { family: 'beta' },
  });
  const res = await run(fx, writer('u-writer-walk'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
});

test('a panel seat that rotated keeps its role and the unit passes', { skip: SKIP }, async () => {
  const fx = setup(
    {
      alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } },
      beta: { family: 'beta' },
      gamma: { family: 'gamma' },
      delta: { family: 'delta' },
    },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, panel('u-panel-rotate'), { pattern: 'panel' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.role, r.outcome])));

  const panelist1 = attemptsOf(fx.repoRoot, res, 'member-1/1');
  assert.deepEqual(panelist1.map((a) => [a.seat, a.binding.executor, a.outcome]), [['member-1', 'alpha', 'provider-limit'], ['member-1', 'alpha', 'pass']]);
  const summary = summaryOf(fx.repoRoot, res);
  const seat = summary.seats.find((s) => s.seat === 'member-1');
  assert.equal(seat.kind, 'panelist');
  assert.equal(seat.final.executor, 'alpha');
  assert.equal(seat.final.outcome, 'pass');
  assert.equal(seat.attempts.length, 2);
  assert.equal(summary.seats.filter((s) => s.kind === 'panelist').length, 3);
  assert.equal(summary.outcome, 'pass');
  assert.equal(summary.sharedFamilies, undefined, 'every seat still has a family of its own');
});

test('a panel seat that walked to another provider lands on a family its siblings did not use', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    beta: { family: 'beta' },
    gamma: { family: 'gamma' },
    delta: { family: 'delta' },
    epsilon: { family: 'epsilon' },
  });
  const res = await run(fx, panel('u-panel-walk'), { pattern: 'panel' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.role, r.outcome])));
  const panelist1 = attemptsOf(fx.repoRoot, res, 'member-1/1');
  assert.deepEqual(panelist1.map((a) => a.outcome), ['provider-limit', 'pass']);
  assert.equal(panelist1[1].fallbackFrom.kind, 'next-candidate');
  const finalExecutors = res.results.filter((r) => r.seat.startsWith('member-')).map((r) => r.runResult.executorId);
  assert.equal(new Set(finalExecutors).size, 3, `final panelist executors are pairwise distinct families, got ${finalExecutors.join(',')}`);
  assert.ok(!finalExecutors.includes('alpha'));
  assert.equal(summaryOf(fx.repoRoot, res).sharedFamilies, undefined);
});

test('a debate side keeps in its rebuttal the candidate its first round ended on, so a primary that failed is not bound again', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    beta: { family: 'beta' },
    gamma: { family: 'gamma' },
    delta: { family: 'delta' },
  });
  const debate = { id: 'u-debate-keep', objective: 'Argue it', capability: 'docs:write', writes: [], pattern: 'debate',
    seats: [{ seat: 'pro', role: 'producer' }, { seat: 'con', role: 'producer' }, { seat: 'judge', role: 'judge' }] };
  const res = await run(fx, debate, { pattern: 'debate' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.seat, r.outcome, r.refused])));
  const round1 = attemptsOf(fx.repoRoot, res, 'pro/1');
  assert.deepEqual(round1.map((a) => a.outcome), ['provider-limit', 'pass'], 'the first round walked away from the dead login');
  const walkedTo = round1.at(-1).binding.executor;
  assert.notEqual(walkedTo, 'alpha');
  const round2 = attemptsOf(fx.repoRoot, res, 'pro/2');
  assert.deepEqual(round2.map((a) => [a.binding.executor, a.outcome]), [[walkedTo, 'pass']], 'the rebuttal runs on the candidate round one ended on, with no attempt on the dead primary');
});

// A pool whose every login is dead is still offered (one real call may lift it); when the call fails the
// lease cannot take the account the bind named, nothing runs, and the seat is bound again.
const quarantineDead = (fx, provider, accountId) => quarantineProviderAccount({ provider, accountId, reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir: fx.runtimeDir });

test('a lease that cannot take the account the bind named rebinds the seat: the failed pool is skipped, no walk step and no launch is spent', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'dead' } }, beta: { family: 'beta' } });
  quarantineDead(fx, 'alpha', 'a1');
  const res = await run(fx, solo('u-conflict'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.leaseConflict === true, a.outcome]), [['alpha', true, 'provider-limit'], ['beta', false, 'pass']]);
  assert.equal(attempts[0].binding.leaseAccount, 'a1');
  assert.equal(attempts[1].fallbackFrom.kind, 'lease-conflict');
  assert.equal(attempts[0].leaseReceipt, undefined, 'a lease that was not taken leaves no receipt');
  assert.equal(seatLaunchesUsed(readJson(path.join(unitDirOf(fx.repoRoot, res), 'unit.json'))), 1, 'the conflicting attempt started no worker');
});

test('two checkers whose leases conflict at once rebind one after the other and each still differs from the producer and from the other checker', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha' },
    beta: { family: 'beta', logins: { b1: 'dead' } },
    gamma: { family: 'gamma', logins: { g1: 'dead' } },
    delta: { family: 'delta' },
    epsilon: { family: 'epsilon' },
  });
  quarantineDead(fx, 'beta', 'b1');
  quarantineDead(fx, 'gamma', 'g1');
  const res = await run(fx, { ...writer('u-two-conflicts'), rigor: 'high', pattern: 'reviewed' }, { pattern: 'reviewed' });
  const executors = (key) => attemptsOf(fx.repoRoot, res, key).map((a) => [a.binding.executor, a.leaseConflict === true]);
  assert.deepEqual(executors('reviewer/1'), [['beta', true], ['delta', false]]);
  assert.deepEqual(executors('red-team/1'), [['gamma', true], ['epsilon', false]]);
  assert.equal(attemptsOf(fx.repoRoot, res)[0].binding.executor, 'alpha');
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.seat, r.outcome, r.refused])));
});

test('a unit-preferred executor that hits its usage limit walks on to the capability pool', { skip: SKIP }, async () => {
  const fx = setup({ spent: { family: 'spentquota' }, beta: { family: 'beta' } }, { prefer: ['beta'] });
  const res = await run(fx, { ...solo('u-prefer-limit'), prefer: ['spent'] });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.binding.provenance.executor.source, a.outcome]), [
    ['spent', 'unit-prefer', 'provider-limit'],
    ['beta', 'capabilities."docs:write".prefer', 'pass'],
  ]);
  assert.equal(attempts[1].fallbackFrom.kind, 'next-candidate');
});

test('a writing unit with its own prefer passes the mutating gate, also on a walk out of it', { skip: SKIP }, async () => {
  const providers = () => ({ spent: { family: 'spentquota' }, alpha: { family: 'alpha' }, beta: { family: 'beta' } });
  const fx = setup(providers(), { prefer: ['beta'] });
  const direct = await run(fx, { ...writer('u-prefer-writer'), prefer: ['alpha'] });
  assert.equal(direct.outcome, 'pass', JSON.stringify(direct.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, direct).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'pass']]);

  // A fresh repo: the same file written twice in one worktree is no change, so no evidence.
  const fy = setup(providers(), { prefer: ['beta'] });
  const walked = await run(fy, { ...writer('u-prefer-writer-walk'), prefer: ['spent'] });
  assert.equal(walked.outcome, 'pass', JSON.stringify(walked.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fy.repoRoot, walked).map((a) => [a.binding.executor, a.outcome]), [['spent', 'provider-limit'], ['beta', 'pass']]);
});

// An account pinned by an override is hard: the seat runs that account, and a provider limit on it
// ends the seat instead of rotating to another account or walking to another executor.

test('a pinned account runs, even when the lease would rank another account first', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live', a2: 'live' } } }, { recentlyUsed: { alpha: ['a2'] } });
  const res = await run(fx, solo('u-pin'), pin('alpha/a2'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'a2');
  const [attempt] = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempt.binding.account, { pool: 'alpha', id: 'a2' });
  assert.deepEqual(attempt.binding.provenance.account, { value: 'alpha/a2', source: 'override:human-cli' });
});

test('a provider limit on a pinned account ends the seat: no rotation, no other executor', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, solo('u-pin-limit'), pin('alpha/dead1'));
  assert.equal(res.outcome, 'provider-limit');
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit']]);
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'account-pinned');
  assert.match(exhausted.detail, /dead1/);
  assert.equal(fs.existsSync(path.join(unitDirOf(fx.repoRoot, res), 'producer', '1-fb1')), false);
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

test('a pinned account on a reviewed unit pins the seat of its provider; the checker of another provider binds freely', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live', a2: 'live' } }, beta: { family: 'beta' } }, { recentlyUsed: { alpha: ['a2'] } });
  const res = await run(fx, { ...writer('u-pin-reviewed'), pattern: 'reviewed' }, { pattern: 'reviewed', ...pin('alpha/a2') });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.role, r.outcome, r.refused])));
  assert.deepEqual(attemptsOf(fx.repoRoot, res)[0].binding.account, { pool: 'alpha', id: 'a2' });
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'a2');
  const reviewer = attemptsOf(fx.repoRoot, res, 'reviewer/1')[0].binding;
  assert.equal(reviewer.executor, 'beta');
  assert.equal(reviewer.account, undefined);
  assert.equal(reviewer.provenance.account.skipped.reason, 'account-pin-other-pool');
});

// A writing seat that already changed the worktree before its provider limit is not run again on
// top of its own half-done work: the seat stops, and the attempt lists what changed.
test('a writing seat that changed the worktree before a provider limit stops instead of running again', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partial1: 'partial', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, writer('u-partial'));
  assert.equal(res.outcome, 'provider-limit', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit']]);
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'partial-writes');
  assert.deepEqual(exhausted.paths, ['README.md', 'README.old', 'notes.txt']);
  assert.deepEqual(attempts[0].retryStopped.paths, exhausted.paths, 'the stop is recorded on the attempt');
  assert.equal(fs.readFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'utf8'), 'half', 'the half-done work is left as it is');
});

test('a file already dirty before the launch that the seat changed again also stops the retry', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partialtouch1: 'partialtouch', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  fs.writeFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'mine');
  const res = await run(fx, writer('u-partial-touch'));
  assert.equal(res.outcome, 'provider-limit', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.equal(res.results[0].fallbackExhausted.reason, 'partial-writes');
  assert.deepEqual(res.results[0].fallbackExhausted.paths, ['notes.txt']);
});

test('a read-only seat of a writing unit still rotates: its sandbox kept the worktree as it was', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha' }, beta: { family: 'beta', logins: { partial2: 'partial', live2: 'live' } } },
    { recentlyUsed: { beta: ['live2'] } },
  );
  const res = await run(fx, { ...writer('u-reviewer-rotate'), pattern: 'reviewed' }, { pattern: 'reviewed' });
  const reviewer = attemptsOf(fx.repoRoot, res, 'reviewer/1');
  assert.deepEqual(reviewer.map((a) => [a.binding.executor, a.outcome]), [['beta', 'provider-limit'], ['beta', 'pass']], JSON.stringify(res.results.map((r) => [r.role, r.outcome, r.fallbackExhausted])));
  assert.equal(reviewer[1].fallbackFrom.kind, 'account-rotation');
  assert.ok(reviewer.every((a) => a.writeBaseline === undefined), 'a read-only seat records no write baseline, so nothing it did not write can stop it');
  assert.equal(res.outcome, 'pass');
});

test('a pinned writing seat that changed the worktree before its limit reports the changed paths, not only the pin', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { partial1: 'partial', live1: 'live' } } });
  const res = await run(fx, writer('u-pin-partial'), pin('alpha/partial1'));
  assert.equal(res.outcome, 'provider-limit');
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'partial-writes');
  assert.deepEqual(exhausted.paths, ['README.md', 'README.old', 'notes.txt']);
  assert.equal(exhausted.accountPinned, 'alpha/partial1');
});

test('a resume takes a new baseline: work a person kept after a partial-writes stop does not stop the next rotation', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partial1: 'partial', spent2: 'quota', live3: 'live' } } },
    { recentlyUsed: { alpha: ['spent2', 'live3'] } },
  );
  const first = await run(fx, writer('u-partial-resume'));
  assert.equal(first.results[0].fallbackExhausted?.reason, 'partial-writes');
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

// A seat whose accounts are used up walks the cells of its tier: the accounts of one pool in declared
// order, then the next entry of the family's cell (another pool, its own accounts), then the next family
// of the tier's list. The write gate recomputes each of these bindings from unit.json, so a writing seat
// passing proves it equals the one the runner made at every step.
const WALK_POOLS = {
  llmAccounts: {
    alpha: { a1: { family: 'alpha', login: 'dead' }, a2: { family: 'alpha', login: 'dead' } },
    router: { r1: { family: 'alpha', login: 'dead' }, r2: { family: 'alpha', login: 'dead' } },
  },
  cells: { alpha: ['alpha-direct@alpha', 'alpha-via-router@router'] },
  tierFallback: { standard: ['alpha', 'beta'] },
  declaredStore: true,
};

for (const [label, unit] of [['a reading seat', solo('u-walk-read')], ['a writing seat', writer('u-walk-write')]]) {
  test(`${label} that used up an account, a pool and a family walks pool accounts, the next entry, then the next family`, { skip: SKIP }, async () => {
    const fx = setup({ alpha: { family: 'alpha' }, beta: { family: 'beta' } }, WALK_POOLS);
    const res = await run(fx, unit);
    assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
    const attempts = attemptsOf(fx.repoRoot, res);
    assert.deepEqual(attempts.map((a) => [a.binding.executor, a.binding.pool, a.binding.model, a.outcome]), [
      ['alpha', 'alpha', 'alpha-direct', 'provider-limit'],
      ['alpha', 'alpha', 'alpha-direct', 'provider-limit'],
      ['alpha', 'router', 'alpha-via-router', 'provider-limit'],
      ['alpha', 'router', 'alpha-via-router', 'provider-limit'],
      ['beta', 'beta', 'fake', 'pass'],
    ]);
    assert.deepEqual(attempts.map((a) => a.fallbackFrom?.kind ?? null), [null, 'account-rotation', 'next-candidate', 'account-rotation', 'next-candidate']);
    assert.deepEqual(attempts.map((a) => a.fallbackFrom?.walk ?? null), [null, null, 'entry', null, 'family']);
    assert.deepEqual(attempts.map((a) => a.fallbackFrom?.pool ?? null), [null, 'alpha', 'alpha', 'router', 'router']);
    assert.deepEqual(['1', '1-fb1', '1-fb2', '1-fb3'].map((sub) => selectedAccount(fx.repoRoot, res, sub)), ['a1', 'a2', 'r1', 'r2'], 'each pool takes its accounts in declared order');
  });
}

test('a dead login in one pool leaves the other pool of the same family eligible, and a quota hit quarantines only that account', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha' }, beta: { family: 'beta' } }, {
    ...WALK_POOLS,
    llmAccounts: {
      alpha: { a1: { family: 'alpha', login: 'quota' }, a2: { family: 'alpha', login: 'live' } },
      router: { r1: { family: 'alpha', login: 'live' } },
    },
  });
  const res = await run(fx, solo('u-quota-order'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.pool, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
  const capacity = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, runtimeDir: fx.runtimeDir });
  assert.equal(capacity.providers.alpha.accounts.a1.healthy, false);
  assert.equal(capacity.providers.alpha.accounts.a2.healthy, true);
  assert.equal(capacity.providers.router.accounts.r1.healthy, true, 'the other pool of the family is untouched');

  // The next seat starts on the first account that can run, not on the one used least: a2 again.
  const next = await run(fx, solo('u-quota-order-next'));
  assert.equal(next.outcome, 'pass');
  assert.equal(selectedAccount(fx.repoRoot, next, '1'), 'a2');
});

test('a resumed unit recorded before bindings carried a pool restarts its walk at the primary without a crash', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', dead2: 'dead' } }, beta: { family: 'beta' } },
    { prefer: ['alpha'] },
  );
  const first = await run(fx, solo('u-old-record'));
  assert.equal(first.outcome, 'provider-limit');

  // Rewrite the record as an earlier release wrote it: one attempt, a binding without pool and model,
  // and a pool of two executors; the accounts' quarantine is forgotten.
  const unitFile = path.join(unitDirOf(fx.repoRoot, first), 'unit.json');
  const record = readJson(unitFile);
  const [attempt] = record.bindings['producer/1'];
  delete attempt.binding.pool;
  delete attempt.binding.model;
  delete attempt.outcome;
  delete attempt.failureCause;
  attempt.candidateIndex = 0;
  attempt.skipCandidateIndex = -1;
  record.bindings['producer/1'] = [attempt];
  record.configSnapshot.runner.capabilities['docs:write'].prefer.push({ executor: 'beta', invocation: 'beta-cli' });
  fs.writeFileSync(unitFile, JSON.stringify(record, null, 2));
  fs.rmSync(path.join(fx.runtimeDir, 'state.json'), { force: true });

  const resumed = await runUnit({
    resumeUnitRunId: first.unitRunId,
    repoRoot: fx.repoRoot,
    cwd: fx.worktreeDir,
    worktree: fx.worktreeDir,
    session: { herdrPresent: false, headless: true },
    providerCapacityRuntimeDir: fx.runtimeDir,
  });
  assert.equal(resumed.outcome, 'pass', JSON.stringify(resumed.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, resumed);
  // The recorded attempt settled on its own; the walk then restarts at the primary (whose accounts rotate), and goes on.
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.binding.pool ?? null, a.outcome]), [['alpha', null, 'provider-limit'], ['alpha', 'alpha', 'provider-limit'], ['alpha', 'alpha', 'provider-limit'], ['beta', 'beta', 'pass']]);
  assert.deepEqual(attempts.map((a) => a.fallbackFrom?.kind ?? null), [null, 'next-candidate', 'account-rotation', 'next-candidate']);
});
