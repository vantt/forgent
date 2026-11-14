import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  acquireNamedAccountLease,
  inspectProviderCapacity,
  probeQuarantinedAccounts,
  providerCapacityStatePaths,
  quarantineProviderAccount,
} from '../../src/runner/dispatch/provider-capacity.mjs';

const PROVIDER = 'openai-codex';

function setup(accountIds = ['a', 'b']) {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-quarantine-probe-test-'));
  const accounts = Object.fromEntries(accountIds.map((id) => [id, { label: id, credentialSource: { kind: 'codex-home', home: `/tmp/${id}` } }]));
  const runnerConfig = { executor: { command: 'claude', args: ['{prompt}'] }, timeoutMs: 1000, providers: { [PROVIDER]: { accounts } } };
  return { runtimeDir, runnerConfig };
}

const authQuarantine = (runtimeDir, accountId) => quarantineProviderAccount({
  provider: PROVIDER, accountId, reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir,
});

const quarantineOf = ({ runnerConfig, runtimeDir }, accountId) => inspectProviderCapacity({ runnerConfig, runtimeDir })
  .providers[PROVIDER].accounts[accountId].quarantine;

function recordingProbe(answers) {
  const calls = [];
  const probe = async ({ accountId }) => {
    calls.push(accountId);
    const answer = answers[accountId] ?? { ok: false, detail: 'no answer' };
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { probe, calls };
}

test('an account locked for a dead credential is unlocked by one successful call when nothing else is usable', async () => {
  const ctx = setup(['a']);
  authQuarantine(ctx.runtimeDir, 'a');
  const { probe, calls } = recordingProbe({ a: { ok: true } });

  const tried = await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe });

  assert.deepEqual(calls, ['a']);
  assert.deepEqual(tried, [{ accountId: 'a', unlocked: true, detail: null }]);
  assert.equal(quarantineOf(ctx, 'a'), null);
  const lease = acquireNamedAccountLease({ runnerConfig: ctx.runnerConfig, provider: PROVIDER, accountId: 'a', runId: 'run-1', runtimeDir: ctx.runtimeDir });
  assert.equal(lease.status, 'selected');
  const audit = fs.readFileSync(providerCapacityStatePaths(ctx.runtimeDir).auditPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(audit.at(-1).action, 'clear-quarantine');
  assert.equal(audit.at(-1).actor, 'fgos provider-capacity probe');
});

test('no call is made while any account of the provider is still usable', async () => {
  const ctx = setup(['a', 'b']);
  authQuarantine(ctx.runtimeDir, 'a');
  const { probe, calls } = recordingProbe({ a: { ok: true } });

  assert.deepEqual(await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe }), []);
  assert.deepEqual(calls, []);
  assert.notEqual(quarantineOf(ctx, 'a'), null);
});

test('a failed call keeps the account locked and records the attempt; the next dispatch within the cooldown does not call again', async () => {
  const ctx = setup(['a']);
  authQuarantine(ctx.runtimeDir, 'a');
  const first = recordingProbe({ a: { ok: false, detail: 'OAuth refresh failed' } });
  const t0 = Date.parse('2026-10-07T00:00:00.000Z');

  const tried = await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe: first.probe, now: t0 });
  assert.deepEqual(tried, [{ accountId: 'a', unlocked: false, detail: 'OAuth refresh failed' }]);
  assert.equal(quarantineOf(ctx, 'a').probe.status, 'failed');
  assert.equal(quarantineOf(ctx, 'a').probe.detail, 'OAuth refresh failed');

  const second = recordingProbe({ a: { ok: true } });
  assert.deepEqual(await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe: second.probe, now: t0 + 10 * 60 * 1000 }), []);
  assert.deepEqual(second.calls, []);

  const third = recordingProbe({ a: { ok: true } });
  const later = await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe: third.probe, now: t0 + 31 * 60 * 1000 });
  assert.deepEqual(third.calls, ['a']);
  assert.equal(later[0].unlocked, true);
  assert.equal(quarantineOf(ctx, 'a'), null);
});

test('a probe that throws counts as a failed call, never as an unlock and never as an error for the dispatch', async () => {
  const ctx = setup(['a']);
  authQuarantine(ctx.runtimeDir, 'a');
  const { probe } = recordingProbe({ a: new Error('spawn pi ENOENT') });

  const tried = await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe });

  assert.equal(tried[0].unlocked, false);
  assert.match(tried[0].detail, /ENOENT/);
  assert.notEqual(quarantineOf(ctx, 'a'), null);
});

test('a quota lock is probed only when its reset was unknown, once per run; other manual locks are left alone', async () => {
  const future = () => new Date(Date.now() + 3600_000).toISOString();
  const past = () => new Date(Date.now() - 60_000).toISOString();
  const quota = (ctx, accountId, until, resetKnown) => {
    quarantineProviderAccount({ provider: PROVIDER, accountId, reasonCode: 'quota-limit', until, resetKnown, runtimeDir: ctx.runtimeDir });
  };

  // A quota lock with a named reset, a lock with no marker (written before the marker) and another manual lock: never called.
  const known = setup(['a', 'b', 'c']);
  quota(known, 'a', future(), true);
  quota(known, 'b', future(), undefined);
  quarantineProviderAccount({ provider: PROVIDER, accountId: 'c', reasonCode: 'operator-hold', quarantineKind: 'manual-clear', runtimeDir: known.runtimeDir });
  const none = recordingProbe({ a: { ok: true }, b: { ok: true }, c: { ok: true } });
  assert.deepEqual(await probeQuarantinedAccounts({ ...known, provider: PROVIDER, probe: none.probe, runKey: 'run-1', accountId: 'a' }), []);
  assert.deepEqual(none.calls, []);

  // Active guessed lock: tried when no account is usable, once per run key, and a success releases it.
  const active = setup(['a']);
  quota(active, 'a', future(), false);
  const failing = recordingProbe({ a: { ok: false, detail: 'still exhausted' } });
  assert.equal((await probeQuarantinedAccounts({ ...active, provider: PROVIDER, probe: failing.probe, runKey: 'run-1' })).length, 1);
  assert.equal(quarantineOf(active, 'a').probe.runKey, 'run-1');
  assert.deepEqual(await probeQuarantinedAccounts({ ...active, provider: PROVIDER, probe: failing.probe, runKey: 'run-1' }), []);
  assert.deepEqual(failing.calls, ['a'], 'the same run does not call twice');
  const next = recordingProbe({ a: { ok: true } });
  assert.equal((await probeQuarantinedAccounts({ ...active, provider: PROVIDER, probe: next.probe, runKey: 'run-2' }))[0].unlocked, true);
  assert.equal(quarantineOf(active, 'a'), null);

  // No run key: no quota call. With a usable sibling an active lock is left alone.
  const sibling = setup(['a', 'b']);
  quota(sibling, 'a', future(), false);
  const idle = recordingProbe({ a: { ok: true } });
  assert.deepEqual(await probeQuarantinedAccounts({ ...sibling, provider: PROVIDER, probe: idle.probe, accountId: 'a' }), []);
  assert.deepEqual(await probeQuarantinedAccounts({ ...sibling, provider: PROVIDER, probe: idle.probe, runKey: 'run-1', accountId: 'a' }), []);
  assert.deepEqual(idle.calls, []);

  // Expired guessed lock: tried for the named account only, even though a sibling is usable.
  const expired = setup(['a', 'b']);
  quota(expired, 'a', past(), false);
  const named = recordingProbe({ a: { ok: true }, b: { ok: true } });
  assert.deepEqual(await probeQuarantinedAccounts({ ...expired, provider: PROVIDER, probe: named.probe, runKey: 'run-1', accountId: 'b' }), []);
  const tried = await probeQuarantinedAccounts({ ...expired, provider: PROVIDER, probe: named.probe, runKey: 'run-1', accountId: 'a', model: 'm-1' });
  assert.deepEqual(named.calls, ['a']);
  assert.equal(tried[0].unlocked, true);
  assert.equal(quarantineOf(expired, 'a'), null);
});

test('a quota stop the probe finds again re-dates the lock and keeps the run from calling twice', async () => {
  const ctx = setup(['a']);
  quarantineProviderAccount({ provider: PROVIDER, accountId: 'a', reasonCode: 'quota-limit', until: new Date(Date.now() + 3600_000).toISOString(), resetKnown: false, runtimeDir: ctx.runtimeDir });
  const probe = async () => ({ ok: false, reason: 'usage-limit', exitCode: 1, providerSignal: { requestedWaitMs: 600_000 }, detail: 'exhausted' });

  await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe, runKey: 'run-1' });

  const lock = quarantineOf(ctx, 'a');
  assert.equal(lock.resetKnown, true, 'the provider named a wait this time, so the guess is gone');
  assert.equal(lock.probe.runKey, 'run-1');
  assert.equal(lock.probe.status, 'failed');
});

test('with several locked accounts it stops at the first that answers, to spend one call', async () => {
  const ctx = setup(['a', 'b']);
  authQuarantine(ctx.runtimeDir, 'a');
  authQuarantine(ctx.runtimeDir, 'b');
  const { probe, calls } = recordingProbe({ a: { ok: false }, b: { ok: true } });

  const tried = await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe });

  assert.deepEqual(calls, ['a', 'b']);
  assert.deepEqual(tried.map((t) => t.unlocked), [false, true]);
  const stopsAtFirst = setup(['a', 'b']);
  authQuarantine(stopsAtFirst.runtimeDir, 'a');
  authQuarantine(stopsAtFirst.runtimeDir, 'b');
  const again = recordingProbe({ a: { ok: true }, b: { ok: true } });
  await probeQuarantinedAccounts({ ...stopsAtFirst, provider: PROVIDER, probe: again.probe });
  assert.deepEqual(again.calls, ['a']);
});

test('a person who clears the lock while the call runs is not overwritten', async () => {
  const ctx = setup(['a']);
  authQuarantine(ctx.runtimeDir, 'a');
  const probe = async () => {
    // The owner re-locks the account with a newer record while the call is in flight.
    await new Promise((resolve) => setTimeout(resolve, 5));
    authQuarantine(ctx.runtimeDir, 'a');
    return { ok: true };
  };

  await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER, probe });

  assert.notEqual(quarantineOf(ctx, 'a'), null, 'a record that changed during the call stays locked');
});

test('nothing happens without a probe function, an unknown provider or an empty inventory', async () => {
  const ctx = setup(['a']);
  authQuarantine(ctx.runtimeDir, 'a');
  assert.deepEqual(await probeQuarantinedAccounts({ ...ctx, provider: PROVIDER }), []);
  assert.deepEqual(await probeQuarantinedAccounts({ ...ctx, provider: 'xai', probe: async () => ({ ok: true }) }), []);
});
