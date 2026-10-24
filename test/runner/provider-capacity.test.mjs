import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  acquireAccountLock,
  acquireNamedAccountLease,
  LEASE_CONFLICT_REASON,
  readAccountStates,
  clearProviderAccountQuarantine,
  probeQuarantinedAccounts,
  providerAccountDir,
  tryAcquireAccountLock,
  classifyProviderCapacityFault,
  parseQuotaResetWindowMs,
  parseQuotaResetClockTime,
  inspectProviderCapacity,
  ProviderCapacityLockError,
  providerCapacityStatePaths,
  quarantineProviderAccount,
    releaseProviderAccountLease,
  validateProviderAccountInventory,
} from '../../src/runner/dispatch/provider-capacity.mjs';
import { reconcileProviderCapacityQuarantineUseCase } from '../../src/verbs/dispatch/reconcile.mjs';
import { selfRecord } from '../../src/runner/dispatch/process-identity.mjs';
import { lockHolders, resolveLockRoot } from '../../src/holder-lock/index.mjs';
import { globalConfigPath as globalConfigFile } from '../helpers/config-fixture.mjs';

// Every lock here is machine-scoped under the state root: a private root keeps this file's locks off
// the machine's real ones, and every child process started below inherits it.
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-provider-capacity-state-root-'));

const PROVIDER_CAPACITY_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/runner/dispatch/provider-capacity.mjs');

// Process identity is read from /proc, so pid-reuse detection only works on
// Linux -- elsewhere resolveHolderLiveness has nothing to cross-check
// against and fails closed to 'held' by contract (process-identity.mjs's
// own documented decision table).
const HAS_PROC_START_TIME = typeof selfRecord().startTime === 'string';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-provider-capacity-test-'));
}

function runnerConfig() {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: { claude: { standard: 'sonnet' } },
    timeoutMs: 1000,
    providers: {
      'openai-codex': {
        accounts: {
          a: { label: 'codex/a', credentialSource: { kind: 'codex-home', home: '/tmp/a' } },
          b: { label: 'codex/b', credentialSource: { kind: 'codex-home', home: '/tmp/b' } },
          c: { label: 'codex/c', credentialSource: { kind: 'codex-home', home: '/tmp/c' } },
        },
      },
    },
  };
}

test('lease acquire/release uses runId and does not reclaim by elapsed time alone', () => {
  const runtimeDir = mkTempDir();
  const first = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn1',
    runId: 'run_asgn1_01',
    runtimeDir,
    now: new Date('2026-09-16T00:00:00.000Z'),
  });
  assert.equal(first.status, 'selected');
  const second = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn2',
    runId: 'run_asgn2_01',
    runtimeDir,
    now: new Date('2026-09-20T00:00:00.000Z'),
  });
  // Named by the caller, not chosen by load: the same account takes the second lease, and the first lease is still open days later.
  assert.equal(first.accountId, 'a');
  assert.equal(second.accountId, 'a');

  const inspected = inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir });
  assert.deepEqual(inspected.providers['openai-codex'].accounts.a.openLeases.map((lease) => lease.runId), ['run_asgn1_01', 'run_asgn2_01']);
  assert.equal(releaseProviderAccountLease({ provider: 'openai-codex', accountId: first.accountId, runId: 'run_asgn1_01', runtimeDir }), true);
  assert.deepEqual(
    inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir }).providers['openai-codex'].accounts.a.openLeases.map((lease) => lease.runId),
    ['run_asgn2_01'],
  );
});

test('lease reclaim requires dead-run proof', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: { deadRun: { runId: 'deadRun', pid: process.pid } } },
          b: { leases: {} },
          c: { leases: {} },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const selected = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn',
    runId: 'run_asgn_01',
    runtimeDir,
    runIsDead: (runId) => runId === 'deadRun',
  });
  assert.equal(selected.accountId, 'a');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.equal(state.providers['openai-codex'].accounts.a.leases.deadRun, undefined);
});

// A real, guaranteed-dead pid: spawn a real child and let it exit, mirroring
// process-identity.test.mjs's own `deadPid()` helper.
function deadPid() {
  const result = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
  return result.pid;
}

test('lease reclaim (S1, dispatch-engine-liveness-hardening Phase 2): a dead RUNNER pid alone does not reclaim a lease whose real worker is still alive', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const runnerPid = deadPid();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: { run_asgn_01: { runId: 'run_asgn_01', assignmentId: 'asgn', pid: runnerPid } } },
          b: { leases: {} },
          c: { leases: {} },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const selected = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'other-asgn',
    runId: 'run_other-asgn_01',
    runtimeDir,
    isRunWorkerAlive: (runId) => runId === 'run_asgn_01',
  });
  assert.equal(selected.accountId, 'a', 'the named account takes the lease however many leases it holds');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.ok(
    state.providers['openai-codex'].accounts.a.leases.run_asgn_01,
    'the lease must survive reclaim: the runner pid is dead but the detached worker using the credential is proven still alive',
  );
});

test('lease reclaim: a dead RUNNER pid with no isRunWorkerAlive evidence still reclaims exactly as before this fix (backward compatible)', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const runnerPid = deadPid();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: { run_asgn_01: { runId: 'run_asgn_01', assignmentId: 'asgn', pid: runnerPid } } },
          b: { leases: {} },
          c: { leases: {} },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const selected = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'other-asgn',
    runId: 'run_other-asgn_01',
    runtimeDir,
  });
  assert.equal(selected.accountId, 'a', 'no isRunWorkerAlive supplied -- a dead pid alone still reclaims, unchanged from before this fix');
});

test('lease reclaim (dispatch-engine-liveness-hardening Phase 4, C2): a live pid whose recorded processStartTime no longer matches (pid reused by an unrelated process) is reclaimed, not mistaken for the original holder', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          // A live pid (this test process itself) but a processStartTime
          // that can never match the real one -- simulating the exact C2
          // gap the audit names for this lock ("pid-only, no start time"):
          // a pid that is technically alive right now but is NOT the same
          // process that originally acquired this lease.
          a: { leases: { reused_run: { runId: 'reused_run', pid: process.pid, processStartTime: 'not-a-real-start-time' } } },
          b: { leases: {} },
          c: { leases: {} },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const selected = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn',
    runId: 'run_asgn_01',
    runtimeDir,
  });
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (HAS_PROC_START_TIME) {
    assert.equal(selected.accountId, 'a', "account a's stale lease (pid reused) must be reclaimed, not treated as still held by the live process wearing that pid");
    assert.equal(state.providers['openai-codex'].accounts.a.leases.reused_run, undefined);
  } else {
    // No /proc start-time available on this host -- resolveHolderLiveness
    // has nothing to cross-check and fails closed to 'held', same as before
    // this fix. Not a regression: documented fallback, not a bug.
    assert.ok(state.providers['openai-codex'].accounts.a.leases.reused_run, 'without /proc, an alive pid with no cross-checkable start time must stay held (fail-closed), unchanged from before this fix');
  }
});

// Real OS processes racing for a lock. The pool is forked ONCE per test and
// every trial reuses it (a trial is one "go" message per contender), instead
// of forking a fresh set per trial: ~150 short-lived node processes made
// the run's cost scale with machine load, and a loaded machine could starve
// a lock holder past the lock's own wait budget.
//
// Two properties keep a failure here a FAILURE rather than a hang:
//  - a contender that exits before replying rejects the wait, naming the
//    exit, instead of leaving the parent waiting forever on a dead process;
//  - `t.after` kills the pool even when the test is cut off by its own
//    timeout (a `finally` inside the test body never runs then), so no
//    contender survives to hold the test file's event loop open.
// Contenders stay alive between trials through their IPC channel alone, which
// also ends them if the parent dies.
function nextMessage(child) {
  return new Promise((resolve, reject) => {
    const onMessage = (message) => {
      child.off('exit', onExit);
      resolve(message);
    };
    const onExit = (code, signal) => {
      child.off('message', onMessage);
      reject(new Error(`contender pid ${child.pid} exited (code ${code}, signal ${signal}) before replying`));
    };
    child.once('message', onMessage);
    child.once('exit', onExit);
  });
}

// `handlerSource` is module source that imports what it needs and defines
// `function handle(job)`; its return value is sent back to the parent, and a
// throw is sent back as an error so the parent can fail the trial with it.
async function startContenders(t, count, handlerSource) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-provider-capacity-contenders-'));
  const scriptPath = path.join(workDir, 'contender.mjs');
  fs.writeFileSync(scriptPath, `${handlerSource}
process.on('message', (job) => {
  try {
    process.send({ value: handle(job) });
  } catch (err) {
    process.send({ error: String(err?.stack ?? err) });
  }
});
process.send({ ready: true });
`);
  const children = Array.from({ length: count }, () => fork(scriptPath, { stdio: 'inherit' }));
  t.after(() => {
    for (const child of children) child.kill('SIGKILL');
    fs.rmSync(workDir, { recursive: true, force: true });
  });
  await Promise.all(children.map((child) => nextMessage(child)));
  return {
    // One job per contender, all sent back to back to contenders that are all
    // already started and idle -- so they really do contend at the same moment.
    async race(jobs) {
      const replies = children.map((child) => nextMessage(child));
      children.forEach((child, i) => child.send(jobs[i]));
      const settled = await Promise.all(replies);
      const failed = settled.find((reply) => reply.error);
      if (failed) throw new Error(`a contender failed:\n${failed.error}`);
      return settled.map((reply) => reply.value);
    },
  };
}

// Concurrent lease acquires from real OS processes never lose a lease: every
// runId a contender reports "selected" is in state.json afterwards. Real
// concurrency needs real processes (one event loop never races itself);
// contenders are started once and released together by a 'go' message so
// they really contend at the same moment.
test('concurrent lease acquires from separate processes never lose a lease', { timeout: 60_000 }, async (t) => {
  const TRIALS = 10;
  const CONTENDERS = 10;
  const pool = await startContenders(t, CONTENDERS, `
import { acquireNamedAccountLease } from ${JSON.stringify(pathToFileURL(PROVIDER_CAPACITY_MJS).href)};
const runnerConfig = ${JSON.stringify(runnerConfig())};
function handle({ runtimeDir, runId, assignmentId }) {
  const result = acquireNamedAccountLease({
    accountId: 'a',
    runnerConfig,
    provider: 'openai-codex',
    assignmentId,
    runId,
    runtimeDir,
    // A lost lease is the property under test, not how long a contender may wait: a bound that a
    // busy disk can exhaust (the holder fsyncs inside the lock) would fail the trial for a reason
    // unrelated to whether any lease was lost.
    lockWaitMs: 45_000,
  });
  return { runId, status: result?.status ?? null };
}
`);

  for (let trial = 0; trial < TRIALS; trial += 1) {
    const runtimeDir = mkTempDir();
    t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
    const { statePath } = providerCapacityStatePaths(runtimeDir);

    const results = await pool.race(
      Array.from({ length: CONTENDERS }, (_, i) => ({ runtimeDir, runId: `run_t${trial}_${i}`, assignmentId: `asgn-${i}` })),
    );

    const selectedRunIds = results.filter((r) => r.status === 'selected').map((r) => r.runId).sort();
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const persistedRunIds = [];
    for (const acct of Object.values(state.providers?.['openai-codex']?.accounts ?? {})) {
      persistedRunIds.push(...Object.keys(acct.leases ?? {}));
    }
    persistedRunIds.sort();

    assert.equal(selectedRunIds.length, CONTENDERS, `trial ${trial}: every contender is selected`);
    assert.deepEqual(persistedRunIds, selectedRunIds, `trial ${trial}: every runId reported "selected" must persist its lease in state.json`);
  }
});

// The lease test above only infers a double entry from a clobbered write.
// This one sees it directly: each contender's critical section (inside the
// real, exported withProviderStateLock) first creates a marker file
// exclusively and records a violation if another holder's marker is there.
test('withProviderStateLock never grants two processes the state lock at once (marker proof)', { timeout: 300_000 }, async (t) => {
  const TRIALS = 15;
  const CONTENDERS = 10;
  const pool = await startContenders(t, CONTENDERS, `
import { withProviderStateLock } from ${JSON.stringify(pathToFileURL(PROVIDER_CAPACITY_MJS).href)};
import fs from 'node:fs';
function handle({ markerPath, violationsPath }) {
  // Mutual exclusion is the property under test, not how long a contender may wait.
  withProviderStateLock(() => {
    let mfd;
    try {
      mfd = fs.openSync(markerPath, 'wx');
    } catch (err) {
      fs.appendFileSync(violationsPath, \`MARKER-VIOLATION pid=\${process.pid} err=\${err.code}\\n\`);
    }
    const start = Date.now();
    while (Date.now() - start < 5) {} // widen the critical-section window
    if (mfd !== undefined) { fs.closeSync(mfd); fs.unlinkSync(markerPath); }
  }, { waitMs: 300_000 });
  return { done: true };
}
`);

  for (let trial = 0; trial < TRIALS; trial += 1) {
    const runtimeDir = mkTempDir();
    t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
    const markerPath = path.join(runtimeDir, 'marker');
    const violationsPath = `${markerPath}.violations`;

    await pool.race(Array.from({ length: CONTENDERS }, () => ({ markerPath, violationsPath })));

    const hasViolation = fs.existsSync(violationsPath);
    assert.equal(
      hasViolation,
      false,
      hasViolation
        ? `trial ${trial}: direct marker-exclusivity violation:\n${fs.readFileSync(violationsPath, 'utf8')}`
        : undefined,
    );
  }
});

// A process that holds the state lock and is started with `holdMs` prints
// "held" once it has it. `holdMs` 0 means hold until killed.
function spawnStateLockHolder(t, holdMs) {
  const holder = spawn(process.execPath, ['--input-type=module', '-e', `
import fs from 'node:fs';
import { withProviderStateLock } from ${JSON.stringify(pathToFileURL(PROVIDER_CAPACITY_MJS).href)};
withProviderStateLock(() => {
  fs.writeSync(1, 'held\\n');
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${holdMs || 600_000});
});
`], { stdio: ['ignore', 'pipe', 'inherit'] });
  t.after(() => holder.kill('SIGKILL'));
  const exited = new Promise((resolve) => holder.once('exit', (code, signal) => resolve({ code, signal })));
  const ready = new Promise((resolve, reject) => {
    holder.stdout.once('data', resolve);
    holder.once('exit', (code) => reject(new Error(`lock holder exited (code ${code}) before taking the lock`)));
  });
  return { holder, exited, ready };
}

// A real second process holds the state lock for HOLD_MS, then releases it.
// An explicit short lockWaitMs must give up with ProviderCapacityLockError
// well before the holder lets go; omitting lockWaitMs must keep the
// production default, which outlasts that hold and then selects normally.
test('lease acquire waits for a live lock holder only as long as lockWaitMs, and by default outlasts a short hold', { timeout: 30_000 }, async (t) => {
  const HOLD_MS = 1500;
  const runtimeDir = mkTempDir();
  t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
  const { holder, exited, ready } = spawnStateLockHolder(t, HOLD_MS);
  await ready;

  const args = { runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'a', runId: 'run_lock_wait', runtimeDir };
  const started = Date.now();
  assert.throws(
    () => acquireNamedAccountLease({ ...args, lockWaitMs: 50 }),
    (err) => err instanceof ProviderCapacityLockError && err.code === 'provider-capacity-lock-stale' && err.holderPid === holder.pid,
  );
  assert.ok(Date.now() - started < HOLD_MS, `a 50ms lockWaitMs must give up before the ${HOLD_MS}ms hold ends`);

  const selected = acquireNamedAccountLease(args);
  assert.equal(selected?.status, 'selected');
  assert.ok(Date.now() - started >= HOLD_MS - 100, 'the default wait must have outlasted the holder rather than finding the lock free');
  assert.equal((await exited).code, 0);
});

test('a state-lock holder killed by SIGKILL frees the lock at once', { timeout: 30_000 }, async (t) => {
  const runtimeDir = mkTempDir();
  t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
  const { holder, exited, ready } = spawnStateLockHolder(t, 0);
  await ready;
  assert.deepEqual(lockHolders('provider-state', { lockRoot: resolveLockRoot() }).holders.map((h) => h.pid), [holder.pid], 'the kernel lists the live holder');
  const args = { runnerConfig: runnerConfig(), provider: 'openai-codex', runId: 'run_after_kill', runtimeDir };
  assert.throws(() => acquireNamedAccountLease({
    accountId: 'a', ...args, lockWaitMs: 50 }), ProviderCapacityLockError);
  holder.kill('SIGKILL');
  await exited;
  const started = Date.now();
  assert.equal(acquireNamedAccountLease({
    accountId: 'a', ...args, lockWaitMs: 1000 })?.status, 'selected');
  assert.ok(Date.now() - started < 1000, 'no wait for a dead holder');
  assert.deepEqual(lockHolders('provider-state', { lockRoot: resolveLockRoot() }).holders, []);
});

test('classifier quarantines only high-confidence stderr/provider outcomes', () => {
  assert.equal(classifyProviderCapacityFault({ provider: 'openai', stderr: "ERROR: You've hit your usage limit" }).reasonCode, 'quota-limit');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai', stderr: 'No API key found for the selected model. Use /login.', adapterOutcome: 1 }).reasonCode, 'auth-token');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai', stderr: '', adapterOutcome: 'paused-limit' }).reasonCode, 'quota-limit');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai', stderr: '', structuredAgent: { stopReason: 'paused-limit' } }).reasonCode, 'quota-limit');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai', stderr: 'tests mention quota in a report' }).action, 'evidence-only');
});

// C2b (review probe): a plain test-suite failure whose stderr happens to
// contain the words "token" (from a JS SyntaxError) and "failed" (from a
// test runner summary) several lines apart used to be misclassified as
// `auth-token` (manual-clear, the more disruptive of the two outcomes) --
// nothing about it is actually an auth fault.
test('C2b negative fixture: "Unexpected token ... 1 test failed" is never classified as an auth fault', () => {
  const stderr = [
    'SyntaxError: Unexpected token } in JSON at position 42',
    '    at JSON.parse (<anonymous>)',
    '    at Object.<anonymous> (/repo/test/fixture.test.mjs:12:18)',
    'FAIL test/fixture.test.mjs',
    '1 test failed, 0 passed',
  ].join('\n');
  const result = classifyProviderCapacityFault({ provider: 'openai', stderr, adapterOutcome: 1 });
  assert.notEqual(result.reasonCode, 'auth-token');
  assert.equal(result.action, 'evidence-only');
});

test('C2b: provider is required -- omitting it never falls back to openai\'s own vocabulary (no more provider === undefined wildcard)', () => {
  const result = classifyProviderCapacityFault({ stderr: 'No API key found. Use /login.', adapterOutcome: 1 });
  assert.equal(result.action, 'evidence-only');
  assert.equal(result.reasonCode, 'provider-unknown');
});

test('C2b: an auth-anchored phrase without adapterOutcome corroboration (a clean/settled completion) is never quarantined', () => {
  const noOutcome = classifyProviderCapacityFault({ provider: 'openai', stderr: 'No API key found. Use /login.' });
  assert.equal(noOutcome.action, 'evidence-only');
  const settled = classifyProviderCapacityFault({ provider: 'openai', stderr: 'No API key found. Use /login.', adapterOutcome: 'settled' });
  assert.equal(settled.action, 'evidence-only');
});

test('C2b: an auth-anchored phrase far outside the trailing line window is not matched', () => {
  const stderr = ['No API key found. Use /login.', ...Array.from({ length: 20 }, (_, i) => `unrelated log line ${i}`)].join('\n');
  const result = classifyProviderCapacityFault({ provider: 'openai', stderr, adapterOutcome: 1 });
  assert.notEqual(result.reasonCode, 'auth-token');
});

// Pre-Phase-05 gate H1 (plans/260915-executor-policy-dispatch-seams/plan.md):
// quota/auth classification must pass quarantineKind/until/detail; a
// temporary quarantine without an expiry must not be considered healthy or
// selectable; missing reset text must not silently create an immediately
// selectable account.
test('H1: paused-limit adapter/structured-agent outcomes always carry a conservative until, never an expiry-less temporary quarantine', () => {
  const byAdapter = classifyProviderCapacityFault({ provider: 'openai', stderr: '', adapterOutcome: 'paused-limit' });
  assert.equal(byAdapter.quarantineKind, 'temporary');
  assert.ok(byAdapter.until, 'adapterOutcome: paused-limit must always produce a conservative until');
  assert.ok(Date.parse(byAdapter.until) > Date.now());

  const byStructured = classifyProviderCapacityFault({ provider: 'openai', stderr: '', structuredAgent: { stopReason: 'paused-limit' } });
  assert.ok(byStructured.until, 'structuredAgent.stopReason: paused-limit must always produce a conservative until');
});

test('H1: a quota message with no parseable reset window still gets a conservative until, not an expiry-less quarantine', () => {
  const withoutResetWindow = classifyProviderCapacityFault({
    provider: 'openai',
    stderr: 'ERROR: usage limit has been reached.',
  });
  assert.equal(withoutResetWindow.reasonCode, 'quota-limit');
  assert.equal(withoutResetWindow.quarantineKind, 'temporary');
  assert.ok(withoutResetWindow.until, 'missing reset text must not silently omit until');
  assert.ok(Date.parse(withoutResetWindow.until) > Date.now());

  const now = Date.parse('2026-09-16T00:00:00.000Z');
  const withResetWindow = classifyProviderCapacityFault({
    provider: 'openai',
    stderr: "You've hit your usage limit. It resets in 3h.",
    now,
  });
  assert.equal(withResetWindow.until, new Date(now + 3 * 60 * 60 * 1000).toISOString(), 'a real parsed reset window is used verbatim, not overridden by the conservative default');
});

test('H1: a temporary quarantine with no until (a malformed/legacy state record) is never healthy/selectable -- fails closed like manual-clear', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  // Simulate a record written by a hypothetical future/legacy caller that
  // forgot to set `until` -- the read-time defensive check must still
  // refuse to select this account, not silently treat it as expired.
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: {}, quarantine: { kind: 'temporary', reasonCode: 'quota-limit' } },
          b: { leases: {}, lastSelectedAt: '2026-09-16T01:00:00.000Z' },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const inspected = inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir });
  assert.equal(inspected.providers['openai-codex'].accounts.a.healthy, false);

  // The lease refuses the quarantined account, and the account facts say it is out for good.
  const conflict = acquireNamedAccountLease({ accountId: 'a', runnerConfig: runnerConfig(), provider: 'openai-codex', runId: 'run-h1', runtimeDir });
  assert.equal(conflict.status, 'refused');
  assert.equal(conflict.reason, LEASE_CONFLICT_REASON);
  assert.equal(readAccountStates({ provider: 'openai-codex', runtimeDir }).a.quarantinedUntil, Number.MAX_SAFE_INTEGER, 'an expiry-less temporary quarantine never ends');
  // `runnerConfig()`'s shared fixture also declares account "b" (never quarantined): it can still be leased.
  assert.equal(acquireNamedAccountLease({ accountId: 'b', runnerConfig: runnerConfig(), provider: 'openai-codex', runId: 'run-h1b', runtimeDir }).status, 'selected');
});

test('H1: a real conservative-TTL quarantine correctly EXPIRES once "until" has passed', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: { 'openai-codex': { accounts: { a: { leases: {}, quarantine: { kind: 'temporary', reasonCode: 'quota-limit', until: '2026-09-16T01:00:00.000Z' } }, b: { leases: {} } } } },
    assignments: {},
    audit: [],
  }));
  const lease = (now, runId) => acquireNamedAccountLease({ accountId: 'a', runnerConfig: runnerConfig(), provider: 'openai-codex', runId, runtimeDir, now: new Date(now) });
  assert.equal(lease('2026-09-16T00:00:00.000Z', 'run-before').reason, LEASE_CONFLICT_REASON);
  assert.equal(readAccountStates({ provider: 'openai-codex', runtimeDir, now: Date.parse('2026-09-16T00:00:00.000Z') }).a.quarantinedUntil, Date.parse('2026-09-16T01:00:00.000Z'));
  assert.equal(lease('2026-09-16T02:00:00.000Z', 'run-after').status, 'selected', 'a temporary quarantine with a real past `until` must expire normally');
});

test('manual clear refuses unknown and non-quarantined accounts unless forced, then writes audit', () => {
  const runtimeDir = mkTempDir();
  assert.throws(() => clearProviderAccountQuarantine({
    runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'missing', reason: 'x', runtimeDir,
  }), /unknown provider\/account/);
  assert.throws(() => clearProviderAccountQuarantine({
    runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'a', reason: 'x', runtimeDir,
  }), /not quarantined/);

  quarantineProviderAccount({ provider: 'openai-codex', accountId: 'a', reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });
  const audit = clearProviderAccountQuarantine({
    runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'a', reason: 'token refreshed', runtimeDir, caller: 'tester',
  });
  assert.equal(audit.action, 'clear-quarantine');
  assert.equal(audit.previousQuarantine.reasonCode, 'auth-token');
  assert.equal(inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir }).providers['openai-codex'].accounts.a.quarantine, null);
});

test('inventory: a home-files credential source lists relative files and is carried through to the selected account', () => {
  const inventory = validateProviderAccountInventory({
    providers: { xai: { accounts: { vantt: { credentialSource: { kind: 'home-files', home: '/home/u/.pi/accounts/x', files: ['auth.json', 'bin/fd'] } } } } },
  });
  assert.deepEqual(inventory.xai.accounts.vantt.credentialSource, { kind: 'home-files', home: '/home/u/.pi/accounts/x', files: ['auth.json', 'bin/fd'] });
});

test('inventory: a home-files source with no files, an escaping or absolute path, or files on another kind is refused by name', () => {
  const withSource = (credentialSource) => ({ providers: { xai: { accounts: { a: { credentialSource } } } } });
  const home = '/home/u/x';
  assert.throws(() => validateProviderAccountInventory(withSource({ kind: 'home-files', home })), /files\) must be a non-empty list of relative paths/);
  assert.throws(() => validateProviderAccountInventory(withSource({ kind: 'home-files', home, files: [] })), /non-empty list/);
  assert.throws(() => validateProviderAccountInventory(withSource({ kind: 'home-files', home, files: ['../up'] })), /relative paths without "\.\."/);
  assert.throws(() => validateProviderAccountInventory(withSource({ kind: 'home-files', home, files: ['/abs'] })), /relative paths without "\.\."/);
  assert.throws(() => validateProviderAccountInventory(withSource({ kind: 'codex-home', home, files: ['auth.json'] })), /only valid for kind "home-files"/);
  assert.throws(() => validateProviderAccountInventory(withSource({ kind: 'dir-mount', home })), /must be one of codex-home, home-files/);
});

test('a quota quarantine lasts as long as the provider says, in hours, minutes and seconds', () => {
  const now = Date.parse('2026-10-05T10:00:00.000Z');
  const fromScreen = classifyProviderCapacityFault({
    provider: 'gemini',
    stderr: 'executor ended as provider-limit: Last line on screen: ⚠ Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 24m1s.',
    adapterOutcome: 'provider-limit',
    now,
  });
  assert.equal(fromScreen.reasonCode, 'quota-limit');
  assert.equal(fromScreen.until, new Date(now + (24 * 60 + 1) * 1000).toISOString());
  assert.equal(parseQuotaResetWindowMs('quota reached, reset in 1h 30m'), 90 * 60 * 1000);
  assert.equal(parseQuotaResetWindowMs('no window named here'), null);
});

test('a round that ended on a dead credential quarantines the account as an auth fault until a person clears it', () => {
  const fault = classifyProviderCapacityFault({
    provider: 'xai',
    stderr: 'executor ended as provider-limit: Last line on screen: Error: OAuth refresh failed for xai: xAI OAuth token refresh failed (HTTP 400): invalid_grant',
    adapterOutcome: 'provider-limit',
  });
  assert.equal(fault.reasonCode, 'auth-token');
  assert.equal(fault.quarantineKind, 'manual-clear');
  assert.equal(fault.until, undefined);
});

test('an owner-set quarantine keeps the account out of selection until its end time', () => {
  const dir = mkTempDir();
  const globalConfigPath = globalConfigFile(dir);
  // Account pools live in the machine's accounts file, never in the global config file.
  fs.mkdirSync(path.join(dir, '.fgos', 'private'), { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, '.fgos', 'private', 'accounts.yaml'), JSON.stringify({ runner: { providers: runnerConfig().providers } }), { mode: 0o600 });
  const until = new Date(Date.now() + 3600_000).toISOString();

  const refusedPast = reconcileProviderCapacityQuarantineUseCase({}, {
    provider: 'openai-codex', account: 'a', reason: 'quota', until: new Date(Date.now() - 1000).toISOString(), globalConfigPath, runtimeDir: dir,
  });
  assert.equal(refusedPast.reasonCode, 'until-in-past');
  const refusedUnknown = reconcileProviderCapacityQuarantineUseCase({}, {
    provider: 'openai-codex', account: 'nope', reason: 'quota', until, globalConfigPath, runtimeDir: dir,
  });
  assert.equal(refusedUnknown.reasonCode, 'unknown-account');

  const result = reconcileProviderCapacityQuarantineUseCase({}, {
    provider: 'openai-codex', account: 'a', reason: 'quota exhausted', until, globalConfigPath, runtimeDir: dir,
  });
  assert.equal(result.status, 'quarantined');
  assert.equal(result.quarantine.detail.kind, 'owner');

  const lease = (now, runId) => acquireNamedAccountLease({ accountId: 'a', runnerConfig: runnerConfig(), provider: 'openai-codex', runId, runtimeDir: dir, now: new Date(now) });
  assert.equal(lease(Date.now(), 'run-owner-before').reason, LEASE_CONFLICT_REASON, 'out of selection before the end time');
  assert.equal(lease(Date.parse(until) + 1000, 'run-owner-after').status, 'selected', 'selectable again after the end time');
});

test('the clock time codex prints ("try again at 6:02 PM") becomes the next such local time', () => {
  const now = new Date(2026, 9, 9, 17, 0, 0).getTime();
  const reset = new Date(parseQuotaResetClockTime("You've hit your usage limit. Visit settings or try again at 6:02 PM.", now));
  assert.deepEqual([reset.getFullYear(), reset.getMonth(), reset.getDate(), reset.getHours(), reset.getMinutes()], [2026, 9, 9, 18, 2]);
  const nextDay = new Date(parseQuotaResetClockTime('try again at 9:30 AM', now));
  assert.equal(nextDay.getDate(), 10, 'a time already past today means tomorrow');
  assert.equal(parseQuotaResetClockTime('no reset named here', now), null);
  const classified = classifyProviderCapacityFault({ provider: 'openai', stderr: "You've hit your usage limit. try again at 6:02 PM.", now });
  assert.equal(new Date(classified.until).getHours(), 18);
});

// --- Account lock: one per provider account, separate from the state lock ---

test('the account lock is exclusive per account, independent of other accounts and of the state lock', () => {
  const runtimeDir = mkTempDir();
  const first = tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' });
  assert.ok(first);
  assert.equal(tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' }), null, 'a live holder keeps it');
  const other = tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'b' });
  assert.ok(other, 'another account is not affected');
  assert.ok(acquireNamedAccountLease({
    accountId: 'a', runnerConfig: runnerConfig(), provider: 'openai-codex', runId: 'run-1', runtimeDir }), 'leasing does not wait for an account lock');
  first.release();
  other.release();
  const again = tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' });
  assert.ok(again, 'released, it can be taken again');
  assert.equal(again.dir, providerAccountDir(runtimeDir, 'xai', 'a'));
  assert.equal(fs.statSync(again.dir).isDirectory(), true, 'the account directory exists while the lock is held');
  again.release();
});

test('an unsafe provider or account id never becomes a path', () => {
  const runtimeDir = mkTempDir();
  assert.equal(providerAccountDir(runtimeDir, 'xai', '../escape'), null);
  assert.equal(providerAccountDir(runtimeDir, 'a/b', 'a'), null);
  assert.throws(() => tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: '../escape' }), /unsafe provider\/account/);
});

test('the async acquire waits with timers, so the event loop keeps running, and times out with a lock error', async () => {
  const runtimeDir = mkTempDir();
  const held = tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' });
  let ticks = 0;
  const timer = setInterval(() => { ticks += 1; }, 10);
  setTimeout(() => held.release(), 120);
  const lock = await acquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a', waitMs: 2000 });
  clearInterval(timer);
  assert.ok(ticks >= 5, `timers fired while waiting (${ticks})`);
  await assert.rejects(
    () => acquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a', waitMs: 60 }),
    (err) => err instanceof ProviderCapacityLockError,
  );
  lock.release();
});

// A process that takes the account lock of xai/a, optionally starts a child through
// it (`node` sleeping `childMs`) and prints "held <childPid|0>", then waits to be killed.
function spawnAccountLockHolder(t, runtimeDir, { childMs = 0, wrap = [] } = {}) {
  const source = `
import fs from 'node:fs';
import { tryAcquireAccountLock } from ${JSON.stringify(pathToFileURL(PROVIDER_CAPACITY_MJS).href)};
const lock = tryAcquireAccountLock({ runtimeDir: ${JSON.stringify(runtimeDir)}, provider: 'xai', accountId: 'a' });
if (!lock) { fs.writeSync(1, 'busy\\n'); process.exit(3); }
let childPid = 0;
if (${childMs} > 0) {
  const child = lock.spawnHolding(process.execPath, ['-e', 'setTimeout(() => {}, ${childMs})'], { stdio: ['ignore', 'pipe', 'pipe'] });
  childPid = child.pid;
}
fs.writeSync(1, 'held ' + childPid + '\\n');
setInterval(() => {}, 1000);
`;
  const [command, ...prefix] = wrap.length > 0 ? [...wrap, process.execPath] : [process.execPath];
  const holder = spawn(command, [...prefix, '--input-type=module', '-e', source], { stdio: ['ignore', 'pipe', 'inherit'] });
  t.after(() => holder.kill('SIGKILL'));
  const exited = new Promise((resolve) => holder.once('exit', (code, signal) => resolve({ code, signal })));
  const ready = new Promise((resolve, reject) => {
    holder.stdout.once('data', (chunk) => {
      const m = /^held (\d+)/.exec(String(chunk));
      if (m) resolve(Number(m[1]));
      else reject(new Error(`holder did not take the lock: ${chunk}`));
    });
    holder.once('exit', (code) => reject(new Error(`lock holder exited (code ${code}) before taking the lock`)));
  });
  return { holder, exited, ready };
}

const pidAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; } };

test('an account-lock holder killed by SIGKILL with no child frees the lock at once', { timeout: 30_000 }, async (t) => {
  const runtimeDir = mkTempDir();
  const { holder, exited, ready } = spawnAccountLockHolder(t, runtimeDir);
  await ready;
  assert.equal(tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' }), null, 'a live holder keeps it');
  holder.kill('SIGKILL');
  await exited;
  const lock = tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' });
  assert.ok(lock, 'the dead holder released it at once');
  lock.release();
});

test('an account-lock holder killed while its probe child still runs keeps the lock until the child exits', { timeout: 30_000 }, async (t) => {
  const runtimeDir = mkTempDir();
  const CHILD_MS = 2000;
  const { holder, exited, ready } = spawnAccountLockHolder(t, runtimeDir, { childMs: CHILD_MS });
  const childPid = await ready;
  t.after(() => { try { process.kill(childPid, 'SIGKILL'); } catch { /* already gone */ } });
  assert.ok(childPid > 0 && pidAlive(childPid));
  holder.kill('SIGKILL');
  await exited;
  assert.ok(pidAlive(childPid), 'precondition: the child outlives its holder');
  assert.equal(tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' }), null, 'the live child keeps the lock for its dead holder');
  // A waiting acquire gets it once the child has exited, and not before.
  const lock = await acquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a', waitMs: CHILD_MS + 5000 });
  assert.equal(pidAlive(childPid), false, 'acquired only after the child exited');
  lock.release();
});

test('a process in its own PID namespace with the same pinned state root contends for the same account lock', { timeout: 30_000 }, async (t) => {
  const probe = spawnSync('bwrap', ['--unshare-pid', '--dev-bind', '/', '/', 'true']);
  if (probe.error || probe.status !== 0) {
    t.skip('bwrap --unshare-pid is not usable on this machine');
    return;
  }
  const runtimeDir = mkTempDir();
  const { holder, exited, ready } = spawnAccountLockHolder(t, runtimeDir, { wrap: ['bwrap', '--unshare-pid', '--die-with-parent', '--dev-bind', '/', '/'] });
  await ready;
  assert.equal(tryAcquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a' }), null, 'the sandboxed holder excludes the host');
  holder.kill('SIGKILL');
  await exited;
  // bwrap's own init holds nothing: once the sandbox is gone the lock is free.
  const lock = await acquireAccountLock({ runtimeDir, provider: 'xai', accountId: 'a', waitMs: 5000 });
  lock.release();
});

// --- Lazy-probe unlock holds the account lock around its real call ---

function lockedAccountFixture() {
  const runtimeDir = mkTempDir();
  const config = runnerConfig();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const quarantine = { kind: 'manual-clear', reasonCode: 'auth-token', quarantinedAt: new Date().toISOString() };
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: { 'openai-codex': { accounts: { a: { quarantine }, b: { quarantine }, c: { quarantine } } } },
    assignments: {},
    audit: [],
  }));
  return { runtimeDir, config };
}

test('the unlock probe runs while holding the account lock, so a renewal elsewhere cannot overlap it', async () => {
  const { runtimeDir, config } = lockedAccountFixture();
  const seen = [];
  const tried = await probeQuarantinedAccounts({
    runnerConfig: config,
    provider: 'openai-codex',
    runtimeDir,
    probe: async ({ accountId }) => {
      seen.push([accountId, tryAcquireAccountLock({ runtimeDir, provider: 'openai-codex', accountId }) === null]);
      return { ok: true };
    },
  });
  assert.equal(tried[0].unlocked, true);
  assert.deepEqual(seen, [[tried[0].accountId, true]], 'the lock was held during the call');
  const free = tryAcquireAccountLock({ runtimeDir, provider: 'openai-codex', accountId: tried[0].accountId });
  assert.ok(free, 'and released after it');
  free.release();
});

test('an unlock probe that cannot get the account lock in time reports that and keeps the account locked', async () => {
  const { runtimeDir, config } = lockedAccountFixture();
  const holders = ['a', 'b', 'c'].map((accountId) => tryAcquireAccountLock({ runtimeDir, provider: 'openai-codex', accountId }));
  let called = 0;
  const tried = await probeQuarantinedAccounts({
    runnerConfig: config,
    provider: 'openai-codex',
    runtimeDir,
    accountLockWaitMs: 40,
    probe: async () => { called += 1; return { ok: true }; },
  });
  assert.equal(called, 0);
  assert.equal(tried.every((t) => t.unlocked === false), true);
  holders.forEach((h) => h.release());
});

test('the unlock probe starts its call through the account lock, so the call holds it', async () => {
  const { runtimeDir, config } = lockedAccountFixture();
  let heldDuringCall = null;
  const tried = await probeQuarantinedAccounts({
    runnerConfig: config,
    provider: 'openai-codex',
    runtimeDir,
    probe: async ({ accountId, spawnHolding }) => {
      const child = spawnHolding(process.execPath, ['-e', 'setTimeout(() => {}, 200)'], { stdio: ['ignore', 'pipe', 'pipe'] });
      await child.borrowed;
      heldDuringCall = child.pid > 0;
      return { ok: true };
    },
  });
  assert.equal(tried[0].unlocked, true);
  assert.equal(heldDuringCall, true);
  const free = tryAcquireAccountLock({ runtimeDir, provider: 'openai-codex', accountId: tried[0].accountId });
  assert.ok(free, 'released after the call');
  free.release();
});
