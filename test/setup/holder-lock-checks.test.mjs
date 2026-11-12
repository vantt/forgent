// The holder-lock doctor checks and setup fixes, run for real: the in-process
// door answers the guarantee and the two-process probe, `flock(1)` of
// util-linux plays a foreign holder.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Every machine lock of this file lives under a private state root; children inherit it.
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-holder-lock-checks-state-root-'));

const {
  checkLockKernelSemantics,
  checkLockBorrowVectors,
  guaranteeRefusal,
  checkLockHolders,
  fixLockDirs,
} = await import('../../src/setup/holder-lock-checks.mjs');

const HOST_BIN = process.env.FGOS_HOST_BIN;
const STATE_ROOT = process.env.FGOS_STATE_ROOT;
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'checks', GIT_AUTHOR_EMAIL: 'checks@test', GIT_COMMITTER_NAME: 'checks', GIT_COMMITTER_EMAIL: 'checks@test' };

let scratch;
before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-holder-lock-checks-'));
});
after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.rmSync(STATE_ROOT, { recursive: true, force: true });
});

function workspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: root, env: GIT_ENV });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: root, env: GIT_ENV });
  return root;
}

// ─── lock-dirs fix + lock-kernel-semantics ──────────────────────────────

test('lock-dirs creates both lock directories with mode 0700, and only once', () => {
  const root = workspace('dirs');
  const lockRoot = path.join(STATE_ROOT, 'locks');
  fs.rmSync(lockRoot, { recursive: true, force: true });
  const first = fixLockDirs(root);
  assert.equal(first.changed, true, first.message);
  for (const dir of [path.join(root, '.fgos', 'locks'), lockRoot]) {
    assert.equal(fs.statSync(dir).mode & 0o777, 0o700, dir);
  }
  assert.deepEqual(fixLockDirs(root), { changed: false, message: 'lock directories present' });

  // A directory an acquire created before setup ran, with the umask's mode, is tightened.
  fs.chmodSync(lockRoot, 0o775);
  const tightened = fixLockDirs(root);
  assert.equal(tightened.changed, true);
  assert.match(tightened.message, /mode tightened to 0700/);
  assert.equal(fs.statSync(lockRoot).mode & 0o777, 0o700);
});

test('lock-kernel-semantics warns for a missing lock directory, then passes on the real mount once setup created it', async () => {
  const root = workspace('semantics');
  const missing = await checkLockKernelSemantics(root);
  assert.equal(missing.passed, true);
  assert.match(missing.message, /^warning: .*workspace .*\.fgos\/locks does not exist yet, not measured \(fgos doctor --fix creates it\)/);
  fixLockDirs(root);
  const res = await checkLockKernelSemantics(root);
  assert.equal(res.passed, true, res.message);
  assert.doesNotMatch(res.message, /^warning:/);
  assert.match(res.message, /workspace .*"driver":"flock","exclusion":"kernel","borrow":"kernel","holders":"kernel"}, two-process probe green/);
  assert.match(res.message, /machine .*, two-process probe green/);
  assert.ok(res.message.endsWith(`; stateRoot ${STATE_ROOT} (pinned); killWaitMs 2000 (fixed)`), res.message);
  assert.deepEqual(fs.readdirSync(path.join(root, '.fgos', 'locks')), [], 'the probe file is removed');
});

test('a guarantee of unsupported fails by name, a network filesystem too, a kernel one passes', () => {
  const shape = { driver: 'none', borrow: 'unsupported', holders: 'unsupported' };
  const unsupported = guaranteeRefusal('workspace', '/x/locks', { ...shape, exclusion: 'unsupported', platform: 'plan9' });
  assert.match(unsupported, /^workspace \/x\/locks .*"exclusion":"unsupported".*: holder-lock has no driver on plan9;/);
  assert.match(guaranteeRefusal('machine', '/x/locks', { ...shape, exclusion: 'none', notes: ['nfs'] }), /no lock exclusion \(nfs\)/);
  assert.equal(guaranteeRefusal('machine', '/x/locks', { driver: 'flock', exclusion: 'kernel', borrow: 'kernel', holders: 'kernel' }), null);
});

// ─── lock-borrow-vectors ────────────────────────────────────────────────

test('lock-borrow-vectors passes with the real host and real git', () => {
  const root = workspace('vectors');
  const res = checkLockBorrowVectors(root);
  assert.equal(res.passed, true, res.message);
  assert.match(res.message, /^all 4 vectors and the sibling check green \(git version /);
});

// ─── lock-holders ───────────────────────────────────────────────────────

// The judgments themselves (foreign holders, predecessor domains, hot records) are owned by test/runner/lock-status.test.mjs;
// the row only points at the verb that reads them.
test('lock-holders is a read-only pointer to fgos lock-status', () => {
  const res = checkLockHolders();
  assert.equal(res.passed, true);
  assert.match(res.message, /run `fgos lock-status`$/);
});
