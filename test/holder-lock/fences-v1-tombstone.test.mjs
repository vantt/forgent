// Tombstones against the real v1 lock code (taken from the cutover's base
// commit, because the cutover deletes it): after placeFences, every old
// file-lock acquire of this workspace fails loudly, a present old lock
// stops the placement, and placing twice is a no-op.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { extractV1Source, probeV1 } from './fixtures/extract-v1.mjs';
import { placeFences, fenceStatus, fenceTargets, TOMBSTONE_FILE, V1_LOCK_PRESENT } from '../../src/holder-lock/fences.mjs';

const PROBE_TIMEOUT_MS = 15_000;
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'fences', GIT_AUTHOR_EMAIL: 'fences@test', GIT_COMMITTER_NAME: 'fences', GIT_COMMITTER_EMAIL: 'fences@test' };

let v1;
let scratch;
before(() => {
  v1 = extractV1Source();
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fences-tombstone-'));
});
after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
  v1?.cleanup();
});

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: GIT_ENV, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A workspace with one linked worktree, one workflow run and one assignment run: every old path family is present. */
function makeWorkspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(root);
  git(['init', '-q'], root);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], root);
  const worktree = path.join(scratch, `${name}-wt`);
  git(['worktree', 'add', '-q', worktree], root);
  const fgosDir = path.join(root, '.fgos');
  const workflowRunDir = path.join(fgosDir, 'workflow-runs', 'wf-1');
  fs.mkdirSync(workflowRunDir, { recursive: true });
  const start = { seq: 1, ts: new Date().toISOString(), type: 'workflow.start', payload: { workflowRunId: 'wf-1', workflowId: 'fence-check', workflow: { steps: [] } } };
  fs.writeFileSync(path.join(workflowRunDir, 'events.jsonl'), `${JSON.stringify(start)}\n`);
  const runDir = path.join(fgosDir, 'assignments', 'a1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-1', assignmentId: 'a1' }));
  // No provider ledgers in this workspace: the ledger fences have their own test.
  const providerRuntimeDir = path.join(scratch, `${name}-no-provider-capacity`);
  // The machine-scope install lock lives under the state root: one per workspace here, never the real one.
  const stateRoot = path.join(scratch, `${name}-state`);
  return { root, worktree, fgosDir, workflowRunDir, runDir, providerRuntimeDir, stateRoot };
}

function branchesOf(root) {
  return git(['for-each-ref', 'refs/heads', '--format=%(refname:short)'], root).split('\n').filter(Boolean);
}

function tombstoneRecord(lockPath) {
  return JSON.parse(fs.readFileSync(path.join(lockPath, TOMBSTONE_FILE), 'utf8'));
}

test('placeFences tombstones every old file-lock path of the workspace, in both cwd forms', () => {
  const ws = makeWorkspace('all-paths');
  const result = placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.skipped, []);

  const expected = [
    'gateway.lock', 'runner.lock', 'sessions.lock', path.join('dispatch', 'reconcile.lock'),
    path.join('workflow-runs', 'wf-1', 'advance.lock'),
    path.join('assignments', 'a1', 'runs', '01', '.recovery.lock'),
    path.join('installation', 'activation.lock'), path.join('observe', '.lock'),
    'main-checkout.lock', 'events.lock', path.join('runtime', 'claims.lock'), path.join('porting', 'events.lock'),
    ...branchesOf(ws.root).map((ref) => `merge-slot--${encodeURIComponent(ref)}.lock`),
  ].map((rel) => path.join(ws.fgosDir, rel));
  expected.push(path.join(ws.stateRoot, 'install.lock'));
  const cwds = new Set();
  for (const dir of [ws.root, ws.worktree]) {
    cwds.add(path.resolve(dir));
    cwds.add(fs.realpathSync(dir));
  }
  for (const cwd of cwds) expected.push(path.join(ws.fgosDir, `dispatch--${encodeURIComponent(cwd)}.lock`));
  assert.deepEqual([...result.placed].sort(), [...expected].sort());

  const byOwner = Object.fromEntries(fenceTargets({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).map((t) => [t.lock, `fgos ${t.owner}`]));
  for (const lockPath of expected) {
    assert.ok(fs.statSync(lockPath).isDirectory(), `${lockPath} is a directory`);
    const record = tombstoneRecord(lockPath);
    assert.equal(record.by, byOwner[record.lock], `${lockPath} names the release that fenced it`);
    assert.ok(typeof record.lock === 'string' && record.lock, 'names its lock');
    assert.ok(!Number.isNaN(Date.parse(record.at)), 'records when');
  }
  const locks = new Set(fenceTargets({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).map((t) => t.lock));
  assert.deepEqual([...locks].sort(), ['activation', 'advance', 'dispatch-cwd', 'gateway', 'install', 'main-checkout', 'merge-slot', 'observe', 'porting-events', 'reconcile', 'recovery', 'runner', 'sessions', 'state']);
  assert.equal(fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).complete, true);
});

test('every real v1 acquire fails loudly against the tombstones instead of taking the lock', (t) => {
  const ws = makeWorkspace('v1-acquires');
  assert.equal(placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).ok, true);
  const fgosDir = JSON.stringify(ws.fgosDir);
  const root = JSON.stringify(ws.root);

  const probes = {
    acquireGatewayLock: `async (v1) => { const m = await v1('src/runner/gateway-control.mjs'); const h = m.acquireGatewayLock(${fgosDir}, { timeoutMs: 2000, retryMs: 50 }); h.release(); return 'acquired'; }`,
    acquireSessionsLock: `async (v1) => { const m = await v1('src/runner/session.mjs'); const h = m.acquireSessionsLock(${fgosDir}, { timeoutMs: 2000, retryMs: 50 }); h.release(); return 'acquired'; }`,
    acquireRunnerLock: `async (v1) => { const m = await v1('src/runner/loop.mjs'); const r = m.acquireRunnerLock(${fgosDir}); if (r.acquired) { r.release(); return 'acquired'; } return r; }`,
    withAdvanceLock: `async (v1) => { const m = await v1('src/workflow/runner.mjs'); await m.resumeWorkflow('wf-1', { repoRoot: ${root}, cwd: ${root} }); return 'acquired'; }`,
    withRunLock: `async (v1) => { const m = await v1('src/verbs/dispatch/recover.mjs'); return m.recoverApplyUseCase({ repoRoot: ${root} }, { runId: 'run-1', action: { type: 'noop' }, expectedSnapshot: 'x', expectedControlEpoch: 0, expectedExpiresAt: '2099-01-01T00:00:00Z', actionKey: 'k' }); }`,
    withLocalLock: `async (v1) => { const m = await v1('src/runner/dispatch/reconciliation-planner.mjs'); return m.applyReconciliation(${root}, { actionKey: 'k', snapshot: { expiresAt: '2099-01-01T00:00:00Z' }, proposedAction: { kind: 'repair-projection', runId: 'run-1', path: ${JSON.stringify(path.join(ws.runDir, 'run.json'))} } }); }`,
    acquireMainCheckoutLockDispatchCwd: `async (v1) => { const m = await v1('src/runner/main-checkout-lock.mjs'); const r = m.acquireMainCheckoutLock(${fgosDir}, { lockFile: m.dispatchLockFile(${root}) }); if (r.status === 'acquired') { r.release(); return 'acquired'; } return r; }`,
  };
  // How each old acquire is expected to fail on a tombstone: the names it
  // throws, or the refusal it returns. None may hang and none may acquire.
  const expectations = {
    acquireGatewayLock: (r) => r.outcome === 'threw' && r.code === 'EISDIR',
    acquireSessionsLock: (r) => r.outcome === 'threw' && r.code === 'EISDIR',
    acquireRunnerLock: (r) => r.outcome === 'threw' && r.code === 'EISDIR',
    withAdvanceLock: (r) => r.outcome === 'threw' && /already being advanced/.test(r.message),
    withRunLock: (r) => r.outcome === 'threw' && r.code === 'lock-busy',
    withLocalLock: (r) => r.outcome === 'returned' && r.value?.outcome === 'blocked',
    acquireMainCheckoutLockDispatchCwd: (r) => r.outcome === 'threw' && r.code === 'EISDIR',
  };

  for (const [name, body] of Object.entries(probes)) {
    const started = Date.now();
    const observed = probeV1(v1, body, { timeoutMs: PROBE_TIMEOUT_MS, cwd: ws.root });
    const elapsed = Date.now() - started;
    t.diagnostic(`${name}: ${observed.outcome} ${observed.code ?? ''} ${JSON.stringify(observed.value ?? observed.message ?? '')} in ${elapsed}ms`);
    assert.notEqual(observed.outcome, 'hung', `${name} hung on the tombstone (killed after ${PROBE_TIMEOUT_MS}ms)`);
    assert.notEqual(observed.outcome, 'no-report', `${name} died without reporting: ${observed.stderr}`);
    assert.ok(observed.value !== 'acquired', `${name} took the lock through a tombstone`);
    assert.ok(expectations[name](observed), `${name} failed in an unexpected way: ${JSON.stringify({ outcome: observed.outcome, code: observed.code, name: observed.name, message: observed.message, value: observed.value })}`);
  }

  // The tombstones are untouched by the failed acquires.
  for (const target of fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).targets) {
    assert.equal(target.fenced, true, `${target.path} still fenced`);
  }
});

test('an old lock file still present stops the placement before anything is written', () => {
  const ws = makeWorkspace('v1-present');
  const gatewayLock = path.join(ws.fgosDir, 'gateway.lock');
  fs.writeFileSync(gatewayLock, String(process.pid));
  const result = placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.equal(result.ok, false);
  assert.equal(result.error, V1_LOCK_PRESENT);
  assert.deepEqual(result.paths, [gatewayLock]);
  assert.deepEqual(result.placed, []);
  assert.equal(fs.readFileSync(gatewayLock, 'utf8'), String(process.pid), 'the old lock is left as it was');
  const status = fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.deepEqual(status.v1Present, [gatewayLock]);
  assert.equal(status.targets.filter((target) => target.fenced).length, 0, 'no other path was fenced half-way');
  // Once the old holder is gone the same call places everything.
  fs.unlinkSync(gatewayLock);
  assert.equal(placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).ok, true);
});

test('placing fences twice places nothing the second time and reports every path as skipped', () => {
  const ws = makeWorkspace('idempotent');
  const first = placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  const records = Object.fromEntries(first.placed.map((lockPath) => [lockPath, fs.readFileSync(path.join(lockPath, TOMBSTONE_FILE), 'utf8')]));
  const second = placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.equal(second.ok, true);
  assert.deepEqual(second.placed, []);
  assert.deepEqual([...second.skipped].sort(), [...first.placed].sort());
  for (const [lockPath, record] of Object.entries(records)) {
    assert.equal(fs.readFileSync(path.join(lockPath, TOMBSTONE_FILE), 'utf8'), record, `${lockPath} record unchanged`);
  }
});

test('a tombstone directory whose record was never written is completed, not refused', () => {
  const ws = makeWorkspace('half-tombstone');
  const runnerLock = path.join(ws.fgosDir, 'runner.lock');
  fs.mkdirSync(runnerLock);
  const result = placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok(result.placed.includes(runnerLock));
  assert.equal(tombstoneRecord(runnerLock).lock, 'runner');
});

test('fenceStatus lists every missing path before placement and none after', () => {
  const ws = makeWorkspace('status');
  const before = fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.equal(before.complete, false);
  // Every path is missing: the ones this module places in `missing`, fgctl's controller path in `controllerMissing`.
  assert.equal(before.missing.length + before.controllerMissing.length, before.targets.length);
  assert.deepEqual(before.controllerMissing, [path.join(ws.fgosDir, 'locks', 'activation.lock')]);
  assert.deepEqual(before.v1Present, []);
  placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  const afterwards = fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot });
  assert.equal(afterwards.complete, true);
  assert.deepEqual(afterwards.missing, []);
  assert.deepEqual(afterwards.controllerMissing, [path.join(ws.fgosDir, 'locks', 'activation.lock')], 'placeFences leaves the controller fence to fgctl');
});
