// Blocking generations against the real v1 ledger code (taken from the
// cutover's base commit): the account lock and the provider state lock are
// generation ledgers, which a tombstone cannot stop. After placeFences the
// old code sees a holder it can never disprove (pid 1, no start time, no
// boot id) and refuses; before, it acquires. Also run inside a fresh PID
// namespace when bwrap is available, because pid 1 exists in every one.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { extractV1Source, probeV1 } from './fixtures/extract-v1.mjs';
import { placeFences, fenceStatus, FENCE_BY, V1_LOCK_PRESENT } from '../../src/holder-lock/fences.mjs';

// The machine-scope install lock is fenced under the state root: keep it in a scratch directory, never the real one.
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fences-state-'));

const PROBE_TIMEOUT_MS = 15_000;
const PROVIDER = 'openai';
const ACCOUNT = 'acct-a';

let v1;
let scratch;
before(() => {
  v1 = extractV1Source();
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fences-ledger-'));
});
after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
  v1?.cleanup();
});

/** A provider-capacity runtime dir with one account ledger and the state ledger, plus an empty workspace beside it. */
function makeLedgers(name) {
  const base = path.join(scratch, name);
  const providerRuntimeDir = path.join(base, 'provider-capacity');
  const accountLockDir = path.join(providerRuntimeDir, 'account-locks', PROVIDER, ACCOUNT, 'lock');
  const stateLockDir = path.join(providerRuntimeDir, 'state-lock');
  fs.mkdirSync(accountLockDir, { recursive: true });
  fs.mkdirSync(stateLockDir, { recursive: true });
  const fgosDir = path.join(base, 'workspace', '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return { providerRuntimeDir, accountLockDir, stateLockDir, fgosDir, workspaceRoot: path.dirname(fgosDir) };
}

function generations(lockDir) {
  return fs.readdirSync(lockDir).filter((name) => /^\d{10}\.json$/.test(name)).sort()
    .map((name) => ({ name, record: JSON.parse(fs.readFileSync(path.join(lockDir, name), 'utf8')) }));
}

function ledgerProbes(ledgers) {
  const runtimeDir = JSON.stringify(ledgers.providerRuntimeDir);
  const stateLockDir = JSON.stringify(ledgers.stateLockDir);
  return {
    tryAcquireAccountLock: `async (v1) => { const m = await v1('src/runner/dispatch/provider-capacity.mjs'); const handle = m.tryAcquireAccountLock({ runtimeDir: ${runtimeDir}, provider: ${JSON.stringify(PROVIDER)}, accountId: ${JSON.stringify(ACCOUNT)} }); if (handle === null) return null; handle.release(); return 'handle'; }`,
    withFileLock: `async (v1) => { const m = await v1('src/runner/dispatch/provider-capacity.mjs'); return m.withFileLock(${stateLockDir}, () => 'ran', { waitMs: 300 }); }`,
  };
}

function placeFor(ledgers) {
  return placeFences({ fgosDir: ledgers.fgosDir, workspaceRoot: ledgers.workspaceRoot, worktrees: [], branches: [], providerRuntimeDir: ledgers.providerRuntimeDir });
}

test('the real v1 ledger code acquires before the fence and refuses after it', (t) => {
  const ledgers = makeLedgers('before-after');
  const probes = ledgerProbes(ledgers);

  const accountBefore = probeV1(v1, probes.tryAcquireAccountLock, { timeoutMs: PROBE_TIMEOUT_MS });
  assert.equal(accountBefore.outcome, 'returned', accountBefore.stderr);
  assert.equal(accountBefore.value, 'handle', 'the account lock is free before the fence');
  const stateBefore = probeV1(v1, probes.withFileLock, { timeoutMs: PROBE_TIMEOUT_MS });
  assert.equal(stateBefore.outcome, 'returned', stateBefore.stderr);
  assert.equal(stateBefore.value, 'ran', 'the state lock runs its section before the fence');

  const result = placeFor(ledgers);
  assert.equal(result.ok, true, JSON.stringify(result));
  const ledgerDirs = [ledgers.accountLockDir, ledgers.stateLockDir].sort();
  // The same placement also tombstones the workspace's file-lock paths; only the ledgers matter here.
  assert.deepEqual([...result.placed].filter((p) => ledgerDirs.includes(p)).sort(), ledgerDirs);
  for (const lockDir of [ledgers.accountLockDir, ledgers.stateLockDir]) {
    const all = generations(lockDir);
    const last = all[all.length - 1].record;
    assert.deepEqual(last.holder, { pid: 1 });
    assert.equal(last.fence, FENCE_BY);
    assert.ok(!('processStartTime' in last.holder) && !('bootId' in last.holder), 'no start time or boot id: nothing an old reader can disprove');
    assert.ok(!last.releasedAt);
  }

  const started = Date.now();
  const accountAfter = probeV1(v1, probes.tryAcquireAccountLock, { timeoutMs: PROBE_TIMEOUT_MS });
  t.diagnostic(`tryAcquireAccountLock after fence: ${accountAfter.outcome} ${JSON.stringify(accountAfter.value)} in ${Date.now() - started}ms`);
  assert.equal(accountAfter.outcome, 'returned', accountAfter.stderr);
  assert.equal(accountAfter.value, null, 'tryAcquireAccountLock returns null against the blocking generation');

  const stateStarted = Date.now();
  const stateAfter = probeV1(v1, probes.withFileLock, { timeoutMs: PROBE_TIMEOUT_MS });
  t.diagnostic(`withFileLock after fence: ${stateAfter.outcome} ${stateAfter.name ?? ''} in ${Date.now() - stateStarted}ms`);
  assert.notEqual(stateAfter.outcome, 'hung', 'withFileLock gives up at its own waitMs');
  assert.equal(stateAfter.outcome, 'threw', JSON.stringify(stateAfter.value));
  assert.equal(stateAfter.name, 'ProviderCapacityLockError');
  assert.match(stateAfter.message, /pid 1/);

  // Neither refusal published, released or removed anything.
  for (const lockDir of [ledgers.accountLockDir, ledgers.stateLockDir]) {
    const all = generations(lockDir);
    assert.equal(all[all.length - 1].record.fence, FENCE_BY, `${lockDir} still ends with the fence`);
  }
});

test('the blocking generation holds inside a fresh PID namespace too', (t) => {
  let bwrap;
  try {
    bwrap = execFileSync('which', ['bwrap'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    bwrap = '';
  }
  if (!bwrap) {
    t.skip('bwrap is not installed on this machine');
    return;
  }
  const ledgers = makeLedgers('pid-namespace');
  assert.equal(placeFor(ledgers).ok, true);
  const wrapper = [bwrap, '--unshare-pid', '--dev-bind', '/', '/', '--proc', '/proc', '--'];
  const observed = probeV1(v1, ledgerProbes(ledgers).tryAcquireAccountLock, { timeoutMs: PROBE_TIMEOUT_MS, wrapper });
  if (observed.outcome === 'no-report' && /bwrap:/.test(observed.stderr ?? '')) {
    t.skip(`bwrap cannot create a PID namespace here: ${observed.stderr.trim()}`);
    return;
  }
  t.diagnostic(`tryAcquireAccountLock in a PID namespace: ${observed.outcome} ${JSON.stringify(observed.value)}`);
  assert.equal(observed.outcome, 'returned', observed.stderr);
  assert.equal(observed.value, null);
});

test('a live v1 holder in a ledger stops the placement and keeps its generation', async () => {
  const ledgers = makeLedgers('live-holder');
  // A real old holder: a child process that takes the account lock with the v1 code and keeps it.
  const holderScript = [
    'import { pathToFileURL } from "node:url";',
    `const m = await import(pathToFileURL(${JSON.stringify(v1.modulePath('src/runner/dispatch/provider-capacity.mjs'))}).href);`,
    `const handle = m.tryAcquireAccountLock({ runtimeDir: ${JSON.stringify(ledgers.providerRuntimeDir)}, provider: ${JSON.stringify(PROVIDER)}, accountId: ${JSON.stringify(ACCOUNT)} });`,
    'process.stdout.write(handle ? "held\\n" : "free\\n");',
    'setInterval(() => {}, 1000);',
  ].join('\n');
  const holder = spawn(process.execPath, ['--input-type=module', '-e', holderScript], { stdio: ['ignore', 'pipe', 'pipe'] });
  const stderr = [];
  holder.stderr.on('data', (chunk) => stderr.push(chunk));
  const first = await new Promise((resolve, reject) => {
    holder.stdout.once('data', (chunk) => resolve(String(chunk).trim()));
    holder.once('exit', (code) => reject(new Error(`holder exited early (${code}): ${Buffer.concat(stderr)}`)));
  });
  try {
    assert.equal(first, 'held');
    const generationsBefore = generations(ledgers.accountLockDir).map((g) => g.name);
    const result = placeFor(ledgers);
    assert.equal(result.ok, false);
    assert.equal(result.error, V1_LOCK_PRESENT);
    assert.deepEqual(result.paths, [ledgers.accountLockDir]);
    assert.deepEqual(result.placed, [], 'nothing is placed while an old holder is alive, not even the other ledger');
    assert.deepEqual(generations(ledgers.accountLockDir).map((g) => g.name), generationsBefore, 'the holder\'s generation is untouched');
    assert.deepEqual(generations(ledgers.stateLockDir), []);
    const status = fenceStatus({ fgosDir: ledgers.fgosDir, workspaceRoot: ledgers.workspaceRoot, worktrees: [], branches: [], providerRuntimeDir: ledgers.providerRuntimeDir });
    assert.deepEqual(status.v1Present, [ledgers.accountLockDir]);
  } finally {
    holder.kill('SIGKILL');
    await new Promise((resolve) => holder.once('exit', resolve));
  }
  // The holder died without releasing: its generation is dead, so the fence goes on top of it.
  const afterwards = placeFor(ledgers);
  assert.equal(afterwards.ok, true, JSON.stringify(afterwards));
  const all = generations(ledgers.accountLockDir);
  assert.equal(all.length, 2);
  assert.equal(all[1].record.fence, FENCE_BY);
});

test('a released v1 generation is superseded by the fence, and a second placement adds nothing', () => {
  const ledgers = makeLedgers('released-and-idempotent');
  const released = probeV1(v1, ledgerProbes(ledgers).withFileLock, { timeoutMs: PROBE_TIMEOUT_MS });
  assert.equal(released.value, 'ran');
  assert.equal(generations(ledgers.stateLockDir).length, 1);
  assert.ok(generations(ledgers.stateLockDir)[0].record.releasedAt, 'the v1 code released its generation');

  const first = placeFor(ledgers);
  assert.equal(first.ok, true);
  assert.equal(generations(ledgers.stateLockDir).length, 2);
  assert.equal(generations(ledgers.stateLockDir)[1].record.fence, FENCE_BY);

  const second = placeFor(ledgers);
  assert.equal(second.ok, true);
  assert.deepEqual(second.placed, []);
  const ledgerDirs = [ledgers.accountLockDir, ledgers.stateLockDir].sort();
  assert.deepEqual([...second.skipped].filter((p) => ledgerDirs.includes(p)).sort(), ledgerDirs);
  assert.equal(generations(ledgers.stateLockDir).length, 2, 'no extra generation');
  assert.equal(generations(ledgers.accountLockDir).length, 1);
});

test('a corrupt generation above the last readable one gets the fence published past it, and v1 still refuses', () => {
  const ledgers = makeLedgers('corrupt-top');
  const released = probeV1(v1, ledgerProbes(ledgers).withFileLock, { timeoutMs: PROBE_TIMEOUT_MS });
  assert.equal(released.value, 'ran');
  fs.writeFileSync(path.join(ledgers.stateLockDir, '0000000002.json'), '{"holder":');

  const placed = placeFor(ledgers);
  assert.equal(placed.ok, true, JSON.stringify(placed));
  const names = fs.readdirSync(ledgers.stateLockDir).filter((name) => /^\d{10}\.json$/.test(name)).sort();
  assert.deepEqual(names, ['0000000001.json', '0000000002.json', '0000000003.json']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ledgers.stateLockDir, '0000000003.json'), 'utf8')).fence, FENCE_BY);

  const after = probeV1(v1, ledgerProbes(ledgers).withFileLock, { timeoutMs: PROBE_TIMEOUT_MS });
  assert.equal(after.outcome, 'threw', JSON.stringify(after));
  assert.equal(after.name, 'ProviderCapacityLockError', after.message);
  assert.equal(placeFor(ledgers).placed.length, 0, 'a second placement sees the fence and adds nothing');
});

test('without a provider-capacity runtime dir there is no ledger to fence', () => {
  const fgosDir = path.join(scratch, 'no-ledgers', '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  const providerRuntimeDir = path.join(scratch, 'no-ledgers', 'never-created');
  const status = fenceStatus({ fgosDir, workspaceRoot: path.dirname(fgosDir), worktrees: [], branches: [], providerRuntimeDir });
  assert.deepEqual(status.targets.filter((target) => target.fence === 'blocking-generation'), []);
  assert.equal(fs.existsSync(providerRuntimeDir), false, 'nothing is created in a home that never ran a provider');
});
