import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(REPO_ROOT, 'target', 'debug', 'fgos');
if (!process.env.FGOS_HOST_BIN && fs.existsSync(BUILT_HOST)) {
  process.env.FGOS_HOST_BIN = BUILT_HOST;
}
import {
  DEFAULT_LOCK_NAME,
  DEFAULT_SIDECAR_PATH,
  DEFAULT_TOKEN_FILE,
  LEASE_SCOPE_PATTERNS,
  isScopedPath,
  intersectsScope,
  generateHolderToken,
  hashHolderToken,
  readSidecar,
  writeSidecarAtomic,
  acquireDocumentationCutoverLease,
  inspectDocumentationCutoverLease,
  releaseDocumentationCutoverLease,
  abandonDocumentationCutoverLease,
  leaseAdmission,
  checkLeaseCommitGuard,
  checkDocumentationCutoverLeaseDoctor,
} from '../../src/runner/documentation-cutover-lease.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

function tempWorktree(t) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-test-'));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(tmpDir, '.fgos', 'locks'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  return tmpDir;
}

test('scope matcher matches defined doc roots and rejects out-of-scope paths', () => {
  // 1. docs/**
  assert.equal(isScopedPath('docs/index.md'), true);
  assert.equal(isScopedPath('docs/specs/runner.md'), true);
  assert.equal(isScopedPath('docs/platform/git/spec.md'), true);

  // 2. AGENTS.md, CLAUDE.md
  assert.equal(isScopedPath('AGENTS.md'), true);
  assert.equal(isScopedPath('CLAUDE.md'), true);

  // 3. Transitional switchboard
  assert.equal(isScopedPath('docs/transitional-switchboard.md'), true);
  assert.equal(isScopedPath('plans/260925-documentation-authority-unification/transitional-switchboard.json'), true);

  // 4. Skills
  assert.equal(isScopedPath('core/skills/fgos-run/SKILL.md'), true);
  assert.equal(isScopedPath('.agents/skills/distill/SKILL.md'), true);
  assert.equal(isScopedPath('plugins/fgOS/skills/plan/SKILL.md'), true);

  // 5. Sidecar path itself
  assert.equal(isScopedPath(DEFAULT_SIDECAR_PATH), true);
  assert.equal(isScopedPath('custom/sidecar.json', { sidecarPath: 'custom/sidecar.json' }), true);

  // 6. Byte path (Buffer)
  assert.equal(isScopedPath(Buffer.from('docs/platform/spec.md')), true);
  assert.equal(isScopedPath(Buffer.from('src/index.js')), false);

  // 7. Out-of-scope paths
  assert.equal(isScopedPath('src/runner/documentation-cutover-lease.mjs'), false);
  assert.equal(isScopedPath('package.json'), false);
  assert.equal(isScopedPath('README.md'), false);
  assert.equal(isScopedPath('.githooks/pre-commit'), false);
  assert.equal(isScopedPath('packages/holder-lock/index.mjs'), false);

  // intersectsScope helper
  assert.equal(intersectsScope(['src/a.js', 'docs/b.md', 'test/c.js']), true);
  assert.equal(intersectsScope(['src/a.js', 'test/c.js']), false);
  assert.equal(intersectsScope([]), false);
});

test('acquire succeeds, generates holder token, writes sidecar and leaves token out of sidecar', (t) => {
  const repoRoot = tempWorktree(t);
  const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);
  const tokenPath = path.join(repoRoot, DEFAULT_TOKEN_FILE);

  const res = acquireDocumentationCutoverLease({ repoRoot });
  assert.equal(res.result, 'acquired');
  assert.ok(res.token && res.token.length >= 32);
  assert.ok(res.tokenHash);

  // Token file written with token
  assert.ok(fs.existsSync(tokenPath));
  const savedToken = fs.readFileSync(tokenPath, 'utf8').trim();
  assert.equal(savedToken, res.token);

  // Sidecar file written
  assert.ok(fs.existsSync(sidecarPath));
  const sidecar = readSidecar(sidecarPath);
  assert.equal(sidecar.state, 'held');
  assert.equal(sidecar.holderTokenHash, res.tokenHash);

  // Crucial: token itself is NEVER written to sidecar
  const sidecarRaw = fs.readFileSync(sidecarPath, 'utf8');
  assert.equal(sidecarRaw.includes(res.token), false);
  assert.equal(sidecar.token, undefined);
});

test('double acquire is refused when lease is held', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({ repoRoot });

  assert.throws(
    () => acquireDocumentationCutoverLease({ repoRoot }),
    (err) => err.code === 'lease-already-held' && err.message.includes('already held'),
  );
});

test('inspect reports status, held flag, age and token hash', (t) => {
  const repoRoot = tempWorktree(t);

  // Before acquire: free
  const initial = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(initial.state, 'free');
  assert.equal(initial.held, false);

  // After acquire: held
  const acq = acquireDocumentationCutoverLease({ repoRoot });
  const status = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(status.state, 'held');
  assert.equal(status.held, true);
  assert.equal(status.holderTokenHash, acq.tokenHash);
  assert.ok(status.ageMs >= 0);
  assert.equal(status.worktree, repoRoot);
});

test('release is allowed for holder and refused for non-holder', (t) => {
  const repoRoot = tempWorktree(t);
  const tokenPath = path.join(repoRoot, DEFAULT_TOKEN_FILE);
  const acq = acquireDocumentationCutoverLease({ repoRoot });

  // Non-holder with bad token is refused
  assert.throws(
    () => releaseDocumentationCutoverLease({ repoRoot, token: 'bad-token-123' }),
    (err) => err.code === 'not-holder',
  );

  // Holder release succeeds
  const rel = releaseDocumentationCutoverLease({ repoRoot, token: acq.token });
  assert.equal(rel.result, 'released');
  assert.ok(rel.releasedAt);

  // Token file removed
  assert.equal(fs.existsSync(tokenPath), false);

  // Sidecar state updated
  const sidecar = readSidecar(path.join(repoRoot, DEFAULT_SIDECAR_PATH));
  assert.equal(sidecar.state, 'released');

  // Second release throws lease-not-held
  assert.throws(
    () => releaseDocumentationCutoverLease({ repoRoot, token: acq.token }),
    (err) => err.code === 'lease-not-held',
  );
});

test('abandon refused while kernel lock held; requires owner flag and reason when kernel lock free', (t) => {
  const repoRoot = tempWorktree(t);
  const fgosDir = path.join(repoRoot, '.fgos');
  acquireDocumentationCutoverLease({ repoRoot });

  // 1. When kernel lock is held by a live process: abandon refused
  const scope = createLockScope('live-holder-test');
  const kernelHold = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir });
  assert.equal(kernelHold.result, 'acquired');

  try {
    assert.throws(
      () => abandonDocumentationCutoverLease({ repoRoot, ownerConfirmed: true, reason: 'Holder dead' }),
      (err) => err.code === 'live-holder-held',
    );
  } finally {
    kernelHold.handle.release();
  }

  // 2. Kernel lock is free: abandon without owner flag is refused
  assert.throws(
    () => abandonDocumentationCutoverLease({ repoRoot, reason: 'Holder dead' }),
    (err) => err.code === 'owner-confirmation-required',
  );

  // 3. Abandon without reason is refused
  assert.throws(
    () => abandonDocumentationCutoverLease({ repoRoot, ownerConfirmed: true, reason: '   ' }),
    (err) => err.code === 'owner-confirmation-required',
  );

  // 4. Abandon with owner flag and written reason succeeds
  const ab = abandonDocumentationCutoverLease({
    repoRoot,
    ownerConfirmed: true,
    reason: 'Session crashed during cutover',
  });
  assert.equal(ab.result, 'abandoned');
  assert.equal(ab.reason, 'Session crashed during cutover');

  const sidecar = readSidecar(path.join(repoRoot, DEFAULT_SIDECAR_PATH));
  assert.equal(sidecar.state, 'abandoned');
  assert.equal(sidecar.abandon.reason, 'Session crashed during cutover');
});

test('held sidecar with lock file gone still refuses (no TTL, fail-closed)', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({ repoRoot });

  // Remove lock file (simulating git clean -fdX or main-checkout-reset)
  const lockFile = path.join(repoRoot, '.fgos', 'locks', `${DEFAULT_LOCK_NAME}.lock`);
  if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

  // Inspect still reports held
  const status = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(status.state, 'held');
  assert.equal(status.held, true);

  // leaseAdmission still refuses non-holder
  const otherWorktree = tempWorktree(t);
  const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);
  const adm = leaseAdmission({ repoRoot: otherWorktree, sidecarPath, paths: ['docs/test.md'] });
  assert.equal(adm.allowed, false);
  assert.equal(adm.reason, 'documentation-cutover-lease');
});

test('token is never printed in refusal messages or exposed in env', (t) => {
  const repoRoot = tempWorktree(t);
  const acq = acquireDocumentationCutoverLease({ repoRoot });

  // leaseAdmission refusal message
  const otherWorktree = tempWorktree(t);
  const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);
  const adm = leaseAdmission({ repoRoot: otherWorktree, sidecarPath, paths: ['docs/test.md'] });
  assert.equal(adm.allowed, false);
  assert.equal(adm.message.includes(acq.token), false);
  assert.equal(adm.message.includes(acq.tokenHash), false);

  // pre-commit guard refusal message
  const guard = checkLeaseCommitGuard(otherWorktree, { sidecarPath, stagedPaths: ['docs/test.md'] });
  assert.ok(guard);
  assert.equal(guard.includes(acq.token), false);
  assert.equal(guard.includes(acq.tokenHash), false);
  // Environment variables do NOT grant holder rights
  const savedEnv = process.env.CLAUDE_CODE_SESSION_ID;
  const savedDocsEnv = process.env.FGOS_DOCS_LEASE_TOKEN;
  try {
    process.env.CLAUDE_CODE_SESSION_ID = acq.token;
    process.env.FGOS_DOCS_LEASE_TOKEN = acq.token;

    // Passing empty token in non-holder worktree still fails even with env vars set
    const otherWorktree = tempWorktree(t);
    const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);
    const foreignAdm = leaseAdmission({ repoRoot: otherWorktree, sidecarPath, paths: ['docs/platform.md'] });
    assert.equal(foreignAdm.allowed, false);
  } finally {
    if (savedEnv !== undefined) process.env.CLAUDE_CODE_SESSION_ID = savedEnv;
    else delete process.env.CLAUDE_CODE_SESSION_ID;
    if (savedDocsEnv !== undefined) process.env.FGOS_DOCS_LEASE_TOKEN = savedDocsEnv;
    else delete process.env.FGOS_DOCS_LEASE_TOKEN;
  }
});

test('no TTL: an aged lease from 30 days ago remains held and refuses', (t) => {
  const repoRoot = tempWorktree(t);
  const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);

  // Write sidecar from 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  writeSidecarAtomic(sidecarPath, {
    contract: { id: 'documentation-cutover-lease', version: 1 },
    state: 'held',
    holderTokenHash: 'mock-hash-1234',
    acquiredAt: thirtyDaysAgo,
    worktree: repoRoot,
    branch: 'main',
    baseCommit: 'commit-sha-123',
    scope: [...LEASE_SCOPE_PATTERNS],
    scopeDigests: {},
  });

  const status = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(status.state, 'held');
  assert.equal(status.held, true);
  assert.ok(status.ageMs >= 30 * 24 * 3600 * 1000);

  const adm = leaseAdmission({ repoRoot, paths: ['AGENTS.md'] });
  assert.equal(adm.allowed, false);
  assert.equal(adm.reason, 'documentation-cutover-lease');
});

test('doctor check passes when no lease, fails when held, reports missing lock/token', (t) => {
  const repoRoot = tempWorktree(t);
  const lockDir = path.join(repoRoot, '.fgos', 'locks');
  const lockFile = path.join(lockDir, `${DEFAULT_LOCK_NAME}.lock`);

  // 1. No lease: passes
  const checkFree = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkFree.passed, true);

  // 2. Acquire lease
  const acq = acquireDocumentationCutoverLease({ repoRoot });

  // Ensure lock file exists
  fs.writeFileSync(lockFile, '');

  // 3. Held lease: fails (reports actively held)
  const checkHeld = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkHeld.passed, false);
  assert.ok(checkHeld.message.includes('actively held'));

  // 4. Missing lock file while held: reports lock file missing
  fs.unlinkSync(lockFile);
  const checkLockMissing = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkLockMissing.passed, false);
  assert.ok(checkLockMissing.message.includes('lock file is missing'));

  // Restore lock file
  fs.writeFileSync(lockFile, '');

  // 5. Missing token file while held: reports token file missing/mismatched
  const tokenFile = path.join(repoRoot, DEFAULT_TOKEN_FILE);
  fs.unlinkSync(tokenFile);
  const checkTokenMissing = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkTokenMissing.passed, false);
  assert.ok(checkTokenMissing.message.includes('token file is missing or mismatched'));
});
