// The main checkout cutover fences against the real v1 code (taken from the
// cutover's base commit): the main checkout lock and every merge slot become
// tombstones, so each old acquire, the old hook's inspection and the old merge
// slot fail by name instead of taking a lock next to the new kernel lock. The
// state store locks are not part of this cutover and stay unfenced.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { REPO_ROOT, DEFAULT_V1_BASE } from './fixtures/extract-v1.mjs';
import { extractV1Source, probeV1 } from './fixtures/extract-v1.mjs';
import { placeFences, fenceStatus, fenceTargets, fenceBy, TOMBSTONE_FILE, V1_LOCK_PRESENT } from '../../src/holder-lock/fences.mjs';

const PROBE_TIMEOUT_MS = 15_000;
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'fences', GIT_AUTHOR_EMAIL: 'fences@test', GIT_COMMITTER_NAME: 'fences', GIT_COMMITTER_EMAIL: 'fences@test' };

let v1;
let scratch;
before(() => {
  v1 = extractV1Source();
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fences-main-door-'));
});
after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
  v1?.cleanup();
});

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: GIT_ENV, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A repository on `main` with a second branch whose name needs encoding. */
function makeWorkspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  git(['init', '-q', '-b', 'main'], root);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], root);
  git(['branch', 'feature/slot'], root);
  const providerRuntimeDir = path.join(scratch, `${name}-no-provider-capacity`);
  return { root, fgosDir: path.join(root, '.fgos'), providerRuntimeDir };
}

const options = (ws) => ({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir });
const mainDoorTargets = (ws) => fenceTargets(options(ws)).filter((t) => ['main-checkout', 'merge-slot'].includes(t.lock));

test('the main checkout lock and one merge slot per local branch are tombstoned, and nothing of the state store is', () => {
  const ws = makeWorkspace('targets');
  const targets = mainDoorTargets(ws);
  assert.deepEqual(
    targets.map((t) => path.relative(ws.fgosDir, t.path)).sort(),
    ['main-checkout.lock', 'merge-slot--feature%2Fslot.lock', 'merge-slot--main.lock'],
  );
  assert.ok(targets.every((t) => t.fence === 'tombstone'));

  const everyPath = fenceTargets(options(ws)).map((t) => t.path);
  for (const stateLock of ['events.lock', path.join('runtime', 'claims.lock'), path.join('porting', 'events.lock')]) {
    assert.ok(!everyPath.includes(path.join(ws.fgosDir, stateLock)), `${stateLock} is not fenced`);
  }
  assert.ok(!fenceTargets(options(ws)).some((t) => ['state', 'porting-events', 'worktree-admin'].includes(t.lock)));

  const result = placeFences(options(ws));
  assert.equal(result.ok, true, JSON.stringify(result));
  for (const target of targets) {
    const record = JSON.parse(fs.readFileSync(path.join(target.path, TOMBSTONE_FILE), 'utf8'));
    assert.equal(record.by, fenceBy('4.3'));
    assert.equal(record.lock, target.lock);
  }
  assert.equal(fenceStatus(options(ws)).complete, true);
});

test('the v1 main checkout acquire, the old hook inspection and the old merge slot all fail by name on the tombstones', () => {
  const ws = makeWorkspace('v1-probes');
  assert.equal(placeFences(options(ws)).ok, true);
  const fgosDir = JSON.stringify(ws.fgosDir);
  const root = JSON.stringify(ws.root);

  const probes = {
    acquireMainCheckoutLock: `async (v1) => { const m = await v1('src/runner/main-checkout-lock.mjs'); const r = m.acquireMainCheckoutLock(${fgosDir}, { identity: process.pid, ttlMs: 1000 }); if (r.status === 'acquired') { r.release(); return 'acquired'; } return r; }`,
    inspectMainCheckoutLock: `async (v1) => { const m = await v1('src/runner/main-checkout-lock.mjs'); return m.inspectMainCheckoutLock(${fgosDir}); }`,
    mergeSlotMain: `async (v1) => { const m = await v1('src/runner/merge.mjs'); await m.withMergeTargetSlot(${root}, 'main', async () => 'ran'); return 'acquired'; }`,
    mergeSlotEncodedRef: `async (v1) => { const m = await v1('src/runner/merge.mjs'); await m.withMergeTargetSlot(${root}, 'feature/slot', async () => 'ran'); return 'acquired'; }`,
  };
  // Each old door fails on the directory where it expects a file; none may
  // hang and none may take the lock.
  const failedByName = (r) => r.outcome === 'threw' && (r.code === 'EISDIR' || /EISDIR|illegal operation on a directory/.test(r.message));

  for (const [name, body] of Object.entries(probes)) {
    const observed = probeV1(v1, body, { timeoutMs: PROBE_TIMEOUT_MS, cwd: ws.root });
    assert.notEqual(observed.outcome, 'hung', `${name} hung on the tombstone`);
    assert.notEqual(observed.outcome, 'no-report', `${name} died without reporting: ${observed.stderr}`);
    assert.ok(observed.value !== 'acquired', `${name} took the lock through a tombstone`);
    assert.ok(failedByName(observed), `${name} failed in an unexpected way: ${JSON.stringify(observed)}`);
  }
  for (const target of mainDoorTargets(ws)) assert.ok(fenceStatus(options(ws)).targets.find((t) => t.path === target.path).fenced, `${target.path} still fenced`);
});

test('a v1 main checkout lock file that is still there stops the placement before anything is written', () => {
  const ws = makeWorkspace('v1-present');
  const lockFile = path.join(ws.fgosDir, 'main-checkout.lock');
  fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid }));
  const result = placeFences(options(ws));
  assert.equal(result.ok, false);
  assert.equal(result.error, V1_LOCK_PRESENT);
  assert.deepEqual(result.paths, [lockFile]);
  assert.deepEqual(result.placed, []);
  assert.equal(fs.statSync(lockFile).isFile(), true, 'the old lock is untouched');
});

test('a branch created after the fences were placed has no merge slot tombstone, and the status says which paths are missing', () => {
  const ws = makeWorkspace('late-branch');
  assert.equal(placeFences(options(ws)).ok, true);
  git(['branch', 'late'], ws.root);
  const status = fenceStatus(options(ws));
  assert.equal(status.complete, false);
  assert.deepEqual(status.missing.map((p) => path.basename(p)), ['merge-slot--late.lock']);
  assert.equal(placeFences(options(ws)).ok, true);
  assert.equal(fenceStatus(options(ws)).complete, true);
});

test('a branch that shares its short name with a tag still gets the merge slot tombstone named after the branch', () => {
  const ws = makeWorkspace('tag-name-clash');
  git(['tag', 'late'], ws.root);
  git(['branch', 'late'], ws.root);
  const slots = mainDoorTargets(ws).filter((t) => t.lock === 'merge-slot').map((t) => path.basename(t.path)).sort();
  assert.deepEqual(slots, ['merge-slot--feature%2Fslot.lock', 'merge-slot--late.lock', 'merge-slot--main.lock']);
});

test('the v1 pre-commit hook refuses a commit on main once the main checkout lock is a tombstone', () => {
  const ws = makeWorkspace('v1-hook');
  assert.equal(placeFences(options(ws)).ok, true);
  // The hook resolves its root from its own location and imports `src/` from
  // there, so the old hook runs inside a repository that links the old tree.
  const hook = execFileSync('git', ['show', `${DEFAULT_V1_BASE}:.githooks/pre-commit`], { cwd: REPO_ROOT, encoding: 'utf8' });
  fs.mkdirSync(path.join(ws.root, '.githooks'));
  fs.writeFileSync(path.join(ws.root, '.githooks', 'pre-commit'), hook, { mode: 0o755 });
  for (const entry of ['src', 'scripts', 'node_modules', 'package.json']) fs.symlinkSync(path.join(v1.dir, entry), path.join(ws.root, entry));
  git(['config', 'core.hooksPath', '.githooks'], ws.root);
  fs.writeFileSync(path.join(ws.root, 'change.txt'), 'x\n');
  git(['add', 'change.txt'], ws.root);
  const res = spawnSync('git', ['commit', '-q', '-m', 'blocked by the old hook'], { cwd: ws.root, encoding: 'utf8', env: GIT_ENV, timeout: PROBE_TIMEOUT_MS });
  assert.notEqual(res.status, 0, 'the old hook let the commit through');
  assert.match(res.stderr, /EISDIR/, res.stderr);
  assert.equal(git(['rev-list', '--count', 'HEAD'], ws.root).trim(), '1', 'no commit was made');
});
