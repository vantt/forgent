import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  acquireProviderAccountLease,
  clearProviderAccountQuarantine,
  classifyProviderCapacityFault,
  inspectProviderCapacity,
  providerCapacityStatePaths,
  quarantineProviderAccount,
  rankProviderAccounts,
  releaseProviderAccountLease,
  stableHash,
  validateProviderAccountInventory,
} from '../../src/runner/dispatch/provider-capacity.mjs';
import { getProcessStartTime } from '../../src/runner/dispatch/process-identity.mjs';

const PROVIDER_CAPACITY_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/runner/dispatch/provider-capacity.mjs');

// Process identity is read from /proc, so pid-reuse detection only works on
// Linux -- elsewhere resolveHolderLiveness has nothing to cross-check
// against and fails closed to 'held' by contract (process-identity.mjs's
// own documented decision table).
const HAS_PROC_START_TIME = getProcessStartTime(process.pid) !== null;

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

test('selector ranks by open leases, lastSelectedAt, then stable hash', () => {
  const inventory = validateProviderAccountInventory(runnerConfig());
  const state = {
    providers: {
      'openai-codex': {
        accounts: {
          a: { lastSelectedAt: '2026-09-16T01:00:00.000Z', leases: { run1: { pid: process.pid } } },
          b: { lastSelectedAt: '2026-09-16T02:00:00.000Z', leases: {} },
          c: { lastSelectedAt: '2026-09-16T03:00:00.000Z', leases: {} },
        },
      },
    },
    assignments: {},
  };
  assert.deepEqual(
    rankProviderAccounts({ provider: 'openai-codex', inventory, state, seed: 'seed' }).slice(0, 3),
    ['b', 'c', 'a'],
  );

  const hashSorted = rankProviderAccounts({
    provider: 'openai-codex',
    inventory,
    state: { providers: { 'openai-codex': { accounts: { a: { leases: {} }, b: { leases: {} }, c: { leases: {} } } } }, assignments: {} },
    seed: 'tie-seed',
  });
  assert.deepEqual(
    hashSorted,
    ['a', 'b', 'c'].sort((left, right) => stableHash('tie-seed', left).localeCompare(stableHash('tie-seed', right))),
  );
});

test('sticky assignment is honored only while account is present and not quarantined', () => {
  const inventory = validateProviderAccountInventory(runnerConfig());
  const state = {
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: {}, quarantine: { kind: 'manual-clear', reasonCode: 'auth-token' } },
          b: { leases: {}, lastSelectedAt: '2026-09-16T00:00:00.000Z' },
          c: { leases: {}, lastSelectedAt: '2026-09-16T01:00:00.000Z' },
        },
      },
    },
    assignments: { 'openai-codex:asgn1': { accountId: 'a' } },
  };
  assert.equal(rankProviderAccounts({ provider: 'openai-codex', inventory, state, assignmentId: 'asgn1', seed: 's' })[0], 'b');
  state.assignments['openai-codex:asgn1'] = { accountId: 'b' };
  assert.equal(rankProviderAccounts({ provider: 'openai-codex', inventory, state, assignmentId: 'asgn1', seed: 's' })[0], 'b');
});

test('lease acquire/release uses runId and does not reclaim by elapsed time alone', () => {
  const runtimeDir = mkTempDir();
  const first = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn1',
    runId: 'run_asgn1_01',
    seed: 's',
    runtimeDir,
    now: new Date('2026-09-16T00:00:00.000Z'),
  });
  assert.equal(first.status, 'selected');
  const second = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn2',
    runId: 'run_asgn2_01',
    seed: 's',
    runtimeDir,
    now: new Date('2026-09-20T00:00:00.000Z'),
  });
  assert.notEqual(second.accountId, first.accountId);

  const inspected = inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir });
  assert.equal(inspected.providers['openai-codex'].accounts[first.accountId].openLeases[0].runId, 'run_asgn1_01');
  assert.equal(releaseProviderAccountLease({ provider: 'openai-codex', accountId: first.accountId, runId: 'run_asgn1_01', runtimeDir }), true);
  assert.equal(inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir }).providers['openai-codex'].accounts[first.accountId].openLeases.length, 0);
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

  const selected = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn',
    runId: 'run_asgn_01',
    seed: 's',
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

  const selected = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'other-asgn',
    runId: 'run_other-asgn_01',
    seed: 's',
    runtimeDir,
    isRunWorkerAlive: (runId) => runId === 'run_asgn_01',
  });
  assert.notEqual(selected.accountId, 'a', 'account a still holds an open lease, so ranking must prefer an idle account');
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

  const selected = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'other-asgn',
    runId: 'run_other-asgn_01',
    seed: 's',
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

  const selected = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn',
    runId: 'run_asgn_01',
    seed: 's',
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

// S3 (dispatch-engine-liveness-hardening Phase 4): the audit's own live
// probe against the real module -- concurrent contenders racing a
// pre-seeded stale lock (dead pid), no re-check before unlink -- lost a
// lease 17/25 trials (`selected=12 leasesPersisted=10` example). Real
// concurrency requires real OS processes (one event loop can never expose
// a TOCTOU race against itself), so each contender is a genuine forked
// child process calling the real `acquireProviderAccountLease`, matching
// claim-port.test.mjs's own established real-cross-process-race pattern.
//
// Two adjustments beyond a plain "fork N children, race them" were needed
// to actually reproduce the audit's own repro rate (verified empirically:
// see this phase's own report) rather than passing vacuously:
//  1. Each contender waits for an explicit 'go' IPC message before calling
//     acquireProviderAccountLease, sent to every child only once ALL of
//     them have finished importing/starting up. Fork/import startup jitter
//     otherwise spreads contenders far enough apart in wall-clock time that
//     they rarely actually contend for the same stale lock at once -- an
//     unsynchronized version of this test measured only ~13% reproduction
//     against the pre-fix code, vs. the audit's own 68% (17/25) and this
//     synchronized version's measured 67% (10/15), a near-exact match.
//  2. Each contender stays alive (an unref'd-equivalent keep-alive timer)
//     after acquiring, until the parent explicitly kills it once the trial
//     is scored. `acquireProviderAccountLease`'s own reclaim step
//     (`reclaimDeadLeases`, Phase 2) correctly evicts a lease whose pid has
//     ALREADY exited by the time a later contender checks -- a short-lived
//     one-shot child that exits immediately after acquiring would trigger
//     that (unrelated, correct) reclaim path and produce a false failure
//     that has nothing to do with this phase's stale-lock TOCTOU fix.
test('S3 (dispatch-engine-liveness-hardening Phase 4): concurrent contenders racing a pre-seeded stale lock (dead pid) never lose a lease', { timeout: 60_000 }, async (t) => {
  const TRIALS = 10;
  const CONTENDERS = 10;
  const pool = await startContenders(t, CONTENDERS, `
import { acquireProviderAccountLease } from ${JSON.stringify(pathToFileURL(PROVIDER_CAPACITY_MJS).href)};
const runnerConfig = ${JSON.stringify(runnerConfig())};
function handle({ runtimeDir, runId, assignmentId }) {
  const result = acquireProviderAccountLease({
    runnerConfig,
    provider: 'openai-codex',
    assignmentId,
    runId,
    seed: runId,
    runtimeDir,
  });
  return { runId, status: result?.status ?? null };
}
`);

  for (let trial = 0; trial < TRIALS; trial += 1) {
    const runtimeDir = mkTempDir();
    t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
    const { statePath, lockDir } = providerCapacityStatePaths(runtimeDir);
    fs.mkdirSync(lockDir, { recursive: true });
    // Pre-seed a stale generation-1 lock record left behind by a crashed
    // holder: a dead pid, no re-checkable content -- exactly the audit's
    // own probe shape, expressed in the generation-ledger's own on-disk
    // format (dispatch-engine-liveness-hardening Phase 4 round 2).
    fs.writeFileSync(
      path.join(lockDir, '0000000001.json'),
      JSON.stringify({ holder: { pid: deadPid(), processStartTime: null }, acquiredAt: new Date(0).toISOString() }),
    );

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

    assert.deepEqual(
      persistedRunIds,
      selectedRunIds,
      `trial ${trial}: every runId reported "selected" must persist its lease in state.json -- a mismatch means a concurrent contender's write clobbered this one (the exact race the audit reproduced 17/25 trials before this fix)`,
    );
  }
});

// S3 round 2: the state.json-loss assertion above only INFERS a double
// critical-section entry from its downstream symptom (a clobbered write).
// This is Lead's own direct-proof technique, made a permanent part of the
// suite rather than a one-off debug script: each contender's `fn` (passed
// to the real, exported `withFileLock`) first attempts an EXCLUSIVE marker
// file create (`fs.openSync(markerPath, 'wx')`, the SAME atomic primitive
// the lock itself relies on) before doing any work, and records a
// violation if that create fails with EEXIST while it should be the sole
// holder. This catches a double-entry directly, independent of whether
// `state.json` happens to reveal it -- a future regression that somehow
// stops corrupting `state.json` (e.g. a change to what `fn` does) would
// still be caught here. The critical section briefly busy-waits (a few ms)
// to widen the window enough for a genuine violation to matter, matching
// what actually reproduced the round-1 regression during investigation.
test('S3 round 2 (dispatch-engine-liveness-hardening Phase 4): direct marker-file proof that withFileLock never grants two holders the same lock concurrently', { timeout: 60_000 }, async (t) => {
  const TRIALS = 15;
  const CONTENDERS = 10;
  const pool = await startContenders(t, CONTENDERS, `
import { withFileLock } from ${JSON.stringify(pathToFileURL(PROVIDER_CAPACITY_MJS).href)};
import fs from 'node:fs';
function handle({ lockDir, markerPath, violationsPath }) {
  withFileLock(lockDir, () => {
    let mfd;
    try {
      mfd = fs.openSync(markerPath, 'wx');
    } catch (err) {
      fs.appendFileSync(violationsPath, \`MARKER-VIOLATION pid=\${process.pid} err=\${err.code}\\n\`);
    }
    const start = Date.now();
    while (Date.now() - start < 5) {} // widen the critical-section window
    if (mfd !== undefined) { fs.closeSync(mfd); fs.unlinkSync(markerPath); }
  });
  return { done: true };
}
`);

  for (let trial = 0; trial < TRIALS; trial += 1) {
    const runtimeDir = mkTempDir();
    t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
    const { lockDir } = providerCapacityStatePaths(runtimeDir);
    fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(
      path.join(lockDir, '0000000001.json'),
      JSON.stringify({ holder: { pid: deadPid(), processStartTime: null }, acquiredAt: new Date(0).toISOString() }),
    );
    const markerPath = path.join(runtimeDir, 'marker');
    const violationsPath = `${markerPath}.violations`;

    await pool.race(Array.from({ length: CONTENDERS }, () => ({ lockDir, markerPath, violationsPath })));

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

  const inventory = validateProviderAccountInventory(runnerConfig());
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const ranked = rankProviderAccounts({ provider: 'openai-codex', inventory, state, seed: 's' });
  assert.ok(!ranked.includes('a'), 'an expiry-less temporary quarantine must never be selectable');
  // `runnerConfig()`'s shared fixture also declares account "c" (no state
  // entry at all, genuinely never quarantined) -- this test only asserts
  // the H1 property (quarantined "a" excluded), not the full ranking.
  assert.ok(ranked.includes('b'));
});

test('H1: a real conservative-TTL quarantine correctly EXPIRES once "until" has passed', () => {
  const acct = { quarantine: { kind: 'temporary', reasonCode: 'quota-limit', until: '2026-09-16T01:00:00.000Z' } };
  const inventory = validateProviderAccountInventory(runnerConfig());
  const beforeExpiry = rankProviderAccounts({
    provider: 'openai-codex',
    inventory,
    state: { providers: { 'openai-codex': { accounts: { a: acct, b: { leases: {} } } } }, assignments: {} },
    seed: 's',
    now: Date.parse('2026-09-16T00:00:00.000Z'),
  });
  assert.ok(!beforeExpiry.includes('a'));

  const afterExpiry = rankProviderAccounts({
    provider: 'openai-codex',
    inventory,
    state: { providers: { 'openai-codex': { accounts: { a: acct, b: { leases: {} } } } }, assignments: {} },
    seed: 's',
    now: Date.parse('2026-09-16T02:00:00.000Z'),
  });
  assert.ok(afterExpiry.includes('a'), 'a temporary quarantine with a real past `until` must expire normally');
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
