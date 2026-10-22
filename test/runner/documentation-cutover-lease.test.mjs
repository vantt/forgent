import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(REPO_ROOT, 'target', 'debug', 'fgos');
if (!process.env.FGOS_HOST_BIN && fs.existsSync(BUILT_HOST)) {
  process.env.FGOS_HOST_BIN = BUILT_HOST;
}

import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
try {
  ensureScriptAddon();
} catch {}

// Ensure state root is writable for Git Inspect driver
if (!process.env.FGOS_STATE_ROOT) {
  const tmpState = path.join(os.tmpdir(), 'fgos-state-test');
  fs.mkdirSync(tmpState, { recursive: true, mode: 0o700 });
  process.env.FGOS_STATE_ROOT = tmpState;
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
  readSidecarFromMain,
  computeScopeDigests,
  acquireDocumentationCutoverLease,
  inspectDocumentationCutoverLease,
  releaseDocumentationCutoverLease,
  abandonDocumentationCutoverLease,
  leaseAdmission,
  checkLeaseCommitGuard,
  checkDocumentationCutoverLeaseDoctor,
} from '../../src/runner/documentation-cutover-lease.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

function commitSidecarFixture(repoRoot, sidecarData) {
  const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);
  fs.mkdirSync(path.dirname(sidecarPath), { recursive: true });
  const content = typeof sidecarData === 'string' ? sidecarData : `${JSON.stringify(sidecarData, null, 2)}\n`;
  fs.writeFileSync(sidecarPath, content);
  execFileSync('git', ['add', DEFAULT_SIDECAR_PATH], { cwd: repoRoot });
  execFileSync('git', ['commit', '-qm', 'chore: documentation-cutover lease sidecar', '--no-verify'], { cwd: repoRoot });
}

function tempWorktree(t) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-test-'));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: tmpDir });
  execFileSync('git', ['config', 'user.name', 'Test Fixture'], { cwd: tmpDir });
  execFileSync('git', ['config', 'user.email', 'test@fixture.invalid'], { cwd: tmpDir });
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Initial\n');
  fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'docs/index.md'), '# Docs\n');
  execFileSync('git', ['add', '.'], { cwd: tmpDir });
  execFileSync('git', ['commit', '-qm', 'initial'], { cwd: tmpDir });
  fs.mkdirSync(path.join(tmpDir, '.fgos', 'locks'), { recursive: true });

  const hooksDir = path.join(tmpDir, '.githooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(path.join(hooksDir, 'reference-transaction'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  execFileSync('git', ['config', 'core.hooksPath', hooksDir], { cwd: tmpDir });

  return tmpDir;
}

function linkedWorktree(mainRepo, branchName = 'side') {
  const wtDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-wt-')), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', branchName, wtDir], { cwd: mainRepo });
  return wtDir;
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

  // 7. Non-ASCII paths (Finding H3)
  assert.equal(isScopedPath('docs/tiếng.md'), true);
  assert.equal(isScopedPath(Buffer.from('docs/tiếng.md')), true);
  assert.equal(isScopedPath('src/tiếng.js'), false);

  // 8. Out-of-scope paths
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

test('acquire succeeds, generates holder token, writes sidecar on main and never returns raw token', (t) => {
  const repoRoot = tempWorktree(t);
  const tokenPath = path.join(repoRoot, DEFAULT_TOKEN_FILE);

  const res = acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });
  assert.equal(res.result, 'acquired');
  // Raw token is NEVER returned in res (Ruling 2, Finding H5)
  assert.equal(res.token, undefined);
  assert.ok(res.tokenHash);
  assert.equal(res.tokenPath, tokenPath);

  // Token file written in holder worktree
  assert.ok(fs.existsSync(tokenPath));
  const savedToken = fs.readFileSync(tokenPath, 'utf8').trim();
  assert.equal(hashHolderToken(savedToken), res.tokenHash);

  // Sidecar blob committed on refs/heads/main (Ruling 1)
  const mainSidecar = readSidecarFromMain(repoRoot);
  assert.equal(mainSidecar.status, 'held');
  assert.equal(mainSidecar.sidecar.holderTokenHash, res.tokenHash);
  assert.equal(mainSidecar.sidecar.state, 'held');

  // Verify scopeDigests recorded on main
  assert.ok(mainSidecar.sidecar.scopeDigests);
  assert.ok(mainSidecar.sidecar.scopeDigests.docs);

  // Verify unverified cleanWorktrees flag was removed (Ruling 8, Finding M2)
  assert.equal(mainSidecar.sidecar.cleanWorktrees, undefined);
});

test('double acquire is refused when lease is held', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  assert.throws(
    () => acquireDocumentationCutoverLease({
      repoRoot,
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'lease-already-held' && err.message.includes('already held'),
  );
});

test('inspect reports status from refs/heads/main, held flag, age and token hash', (t) => {
  const repoRoot = tempWorktree(t);

  // Before acquire: free
  const initial = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(initial.state, 'free');
  assert.equal(initial.held, false);

  // After acquire: held
  const acq = acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });
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
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  // Non-holder in a linked worktree with no token is refused
  const otherDir = linkedWorktree(repoRoot, 'non-holder-side');
  assert.throws(
    () => releaseDocumentationCutoverLease({
      repoRoot: otherDir,
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'not-holder',
  );

  // Holder release in repoRoot succeeds
  const rel = releaseDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });
  assert.equal(rel.result, 'released');
  assert.ok(rel.releasedAt);

  // Token file removed
  assert.equal(fs.existsSync(tokenPath), false);

  // Sidecar state on refs/heads/main updated to released
  const sidecar = readSidecarFromMain(repoRoot);
  assert.equal(sidecar.status, 'present');
  assert.equal(sidecar.state, 'released');

  // Second release throws lease-not-held
  assert.throws(
    () => releaseDocumentationCutoverLease({
      repoRoot,
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'lease-not-held',
  );
});

test('release-time digest comparison catches drift and refuses release (Ruling 8, Finding M2)', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  // Out-of-band drift on main: modify docs/index.md directly on main
  fs.writeFileSync(path.join(repoRoot, 'docs/index.md'), '# Drifted Docs\n');
  execFileSync('git', ['add', 'docs/index.md'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-qm', 'raw bypass commit on main', '--no-verify'], { cwd: repoRoot });

  // Release must catch the drifted scope digest and refuse
  assert.throws(
    () => releaseDocumentationCutoverLease({
      repoRoot,
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'scope-drift' && err.message.includes('drifted during lease: docs'),
  );
});

test('abandon refused while kernel lock held; requires owner flag and reason when kernel lock free (Ruling 4)', (t) => {
  const repoRoot = tempWorktree(t);
  const fgosDir = path.join(repoRoot, '.fgos');
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  // 1. When kernel lock is held by a live process: abandon refused
  const scope = createLockScope('live-holder-test');
  const kernelHold = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir });
  assert.equal(kernelHold.result, 'acquired');

  try {
    assert.throws(
      () => abandonDocumentationCutoverLease({
        repoRoot,
        ownerConfirmed: true,
        reason: 'Holder dead',
        commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
      }),
      (err) => err.code === 'lock-held',
    );
  } finally {
    kernelHold.handle.release();
  }

  // 2. Kernel lock is free: abandon without owner flag is refused
  assert.throws(
    () => abandonDocumentationCutoverLease({
      repoRoot,
      reason: 'Holder dead',
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'owner-confirmation-required',
  );

  // 3. Undocumented force flag is NOT accepted (Ruling 4)
  assert.throws(
    () => abandonDocumentationCutoverLease({
      repoRoot,
      force: true,
      reason: 'Holder dead',
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'owner-confirmation-required',
  );

  // 4. Abandon without reason is refused
  assert.throws(
    () => abandonDocumentationCutoverLease({
      repoRoot,
      ownerConfirmed: true,
      reason: '   ',
      commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
    }),
    (err) => err.code === 'owner-confirmation-required',
  );

  // 5. Abandon with owner flag and written reason succeeds
  const ab = abandonDocumentationCutoverLease({
    repoRoot,
    ownerConfirmed: true,
    reason: 'Session crashed during cutover',
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });
  assert.equal(ab.result, 'abandoned');
  assert.equal(ab.reason, 'Session crashed during cutover');

  // Verify abandon record carries holderTokenHash and ageMs (Finding M3, §3.7)
  const sidecar = readSidecarFromMain(repoRoot);
  assert.equal(sidecar.state, 'abandoned');
  assert.equal(sidecar.sidecar.abandon.reason, 'Session crashed during cutover');
  assert.ok(sidecar.sidecar.abandon.holderTokenHash);
  assert.ok(typeof sidecar.sidecar.abandon.ageMs === 'number');
});

test('held sidecar with lock file gone still refuses (no TTL, fail-closed)', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  // Remove lock file (simulating git clean -fdX or main-checkout-reset)
  const lockFile = path.join(repoRoot, '.fgos', 'locks', `${DEFAULT_LOCK_NAME}.lock`);
  if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

  // Inspect still reports held
  const status = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(status.state, 'held');
  assert.equal(status.held, true);

  // leaseAdmission still refuses non-holder
  const otherWorktree = linkedWorktree(repoRoot, 'non-holder-check');
  const adm = leaseAdmission({ repoRoot: otherWorktree, paths: ['docs/test.md'] });
  assert.equal(adm.allowed, false);
  assert.equal(adm.reason, 'documentation-cutover-lease');
});

test('token is never printed in refusal messages or exposed in env (Finding H5)', (t) => {
  const repoRoot = tempWorktree(t);
  const acq = acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });
  const token = fs.readFileSync(acq.tokenPath, 'utf8').trim();

  // leaseAdmission refusal message in non-holder worktree
  const otherWorktree = linkedWorktree(repoRoot, 'non-holder-msg');
  const adm = leaseAdmission({ repoRoot: otherWorktree, paths: ['docs/test.md'] });
  assert.equal(adm.allowed, false);
  assert.equal(adm.message.includes(token), false);
  assert.equal(adm.message.includes(acq.tokenHash), false);

  // pre-commit guard refusal message
  const guard = checkLeaseCommitGuard(otherWorktree, { stagedPaths: ['docs/test.md'] });
  assert.ok(guard);
  assert.equal(guard.includes(token), false);
  assert.equal(guard.includes(acq.tokenHash), false);

  // Environment variables do NOT grant holder rights
  const savedEnv = process.env.CLAUDE_CODE_SESSION_ID;
  const savedDocsEnv = process.env.FGOS_DOCS_LEASE_TOKEN;
  try {
    process.env.CLAUDE_CODE_SESSION_ID = token;
    process.env.FGOS_DOCS_LEASE_TOKEN = token;

    const foreignAdm = leaseAdmission({ repoRoot: otherWorktree, paths: ['docs/platform.md'] });
    assert.equal(foreignAdm.allowed, false);
  } finally {
    if (savedEnv !== undefined) process.env.CLAUDE_CODE_SESSION_ID = savedEnv;
    else delete process.env.CLAUDE_CODE_SESSION_ID;
    if (savedDocsEnv !== undefined) process.env.FGOS_DOCS_LEASE_TOKEN = savedDocsEnv;
    else delete process.env.FGOS_DOCS_LEASE_TOKEN;
  }
});

test('forged working-tree sidecar is ignored because authority lives on main (Finding H1, Ruling 1)', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  const otherWorktree = linkedWorktree(repoRoot, 'forged-sidecar-wt');

  // Non-holder attempts to forge sidecar in working tree
  const forgedSidecarPath = path.join(otherWorktree, DEFAULT_SIDECAR_PATH);
  fs.mkdirSync(path.dirname(forgedSidecarPath), { recursive: true });
  fs.writeFileSync(forgedSidecarPath, JSON.stringify({ state: 'released' }));

  // Inspect and admission must ignore working-tree file and consult refs/heads/main
  const status = inspectDocumentationCutoverLease({ repoRoot: otherWorktree });
  assert.equal(status.state, 'held');

  const adm = leaseAdmission({ repoRoot: otherWorktree, paths: ['docs/secret.md'] });
  assert.equal(adm.allowed, false);
});

test('git clean -fdX does not reopen the freeze (Finding H1, Repro F)', (t) => {
  const repoRoot = tempWorktree(t);
  acquireDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  // Clean working tree
  execFileSync('git', ['clean', '-fdX'], { cwd: repoRoot });

  // Lease remains held because committed on refs/heads/main
  const status = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(status.state, 'held');

  const otherWorktree = linkedWorktree(repoRoot, 'clean-check-wt');
  const adm = leaseAdmission({ repoRoot: otherWorktree, paths: ['docs/architecture.md'] });
  assert.equal(adm.allowed, false);
});

test('corrupt sidecar on main fails closed (Finding M1, Ruling 5)', (t) => {
  const repoRoot = tempWorktree(t);

  // Commit corrupt JSON sidecar to refs/heads/main
  commitSidecarFixture(repoRoot, '<<< conflict >>>');

  // leaseAdmission must refuse (fail closed)
  const adm = leaseAdmission({ repoRoot, paths: ['docs/file.md'] });
  assert.equal(adm.allowed, false);
  assert.match(adm.reason, /corrupt/);

  // checkLeaseCommitGuard must refuse
  const guard = checkLeaseCommitGuard(repoRoot, { stagedPaths: ['docs/file.md'] });
  assert.ok(guard);
  assert.match(guard, /corrupt/);

  // Doctor check reports corrupt sidecar
  const doc = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(doc.passed, false);
  assert.match(doc.message, /corrupt/);
});

test('holder process death leaves lease held across processes (Finding H4, §3.7)', (t) => {
  const repoRoot = tempWorktree(t);

  // Child process acquires lease and commits sidecar
  const tokenPath = path.join(repoRoot, DEFAULT_TOKEN_FILE);
  const sidecarPath = path.join(repoRoot, DEFAULT_SIDECAR_PATH);
  const token = generateHolderToken();
  const tokenHash = hashHolderToken(token);
  fs.writeFileSync(tokenPath, `${token}\n`, { mode: 0o600 });
  const sidecarData = {
    contract: { id: 'documentation-cutover-lease', version: 1 },
    state: 'held',
    holderTokenHash: tokenHash,
    acquiredAt: new Date().toISOString(),
    worktree: repoRoot,
    branch: 'main',
    baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim(),
    scope: [...LEASE_SCOPE_PATTERNS],
    scopeDigests: computeScopeDigests(repoRoot),
  };
  commitSidecarFixture(repoRoot, sidecarData);

  // After acquiring process has died and exited:
  // Lease is still held on main!
  const status = inspectDocumentationCutoverLease({ repoRoot });
  assert.equal(status.state, 'held');

  // Non-holder operations are refused in another worktree
  const otherWorktree = linkedWorktree(repoRoot, 'non-holder-death-wt');
  const adm = leaseAdmission({ repoRoot: otherWorktree, paths: ['docs/guide.md'] });
  assert.equal(adm.allowed, false);

  // Holder process presenting token in holder worktree can release
  const rel = releaseDocumentationCutoverLease({
    repoRoot,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });
  assert.equal(rel.result, 'released');
});

test('two-process acquire race has exactly one winner (Finding H4, Ruling 7, N=20 trials)', async (t) => {
  const trials = 20;

  for (let trial = 0; trial < trials; trial++) {
    const repoRoot = tempWorktree(t);
    const workerScript = `
      import { ensureScriptAddon } from ${JSON.stringify(path.join(REPO_ROOT, 'scripts/lib/git-ports.mjs'))};
      try { ensureScriptAddon(); } catch {}
      import { acquireDocumentationCutoverLease } from ${JSON.stringify(path.join(REPO_ROOT, 'src/runner/documentation-cutover-lease.mjs'))};
      try {
        const res = acquireDocumentationCutoverLease({ repoRoot: ${JSON.stringify(repoRoot)} });
        process.stdout.write(JSON.stringify({ status: 'acquired', hash: res.tokenHash }));
      } catch (err) {
        process.stdout.write(JSON.stringify({ status: 'refused', code: err.code }));
      }
    `;

    const runWorker = () => new Promise((resolve) => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', workerScript], {
        env: process.env,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      let out = '';
      child.stdout.on('data', (d) => { out += d.toString(); });
      child.on('close', () => {
        try { resolve(JSON.parse(out)); } catch { resolve({ status: 'error', out }); }
      });
    });

    const [r1, r2] = await Promise.all([runWorker(), runWorker()]);

    const acquiredCount = (r1.status === 'acquired' ? 1 : 0) + (r2.status === 'acquired' ? 1 : 0);
    assert.equal(acquiredCount, 1, `Trial ${trial}: expected exactly 1 acquire winner, got ${acquiredCount} (r1: ${JSON.stringify(r1)}, r2: ${JSON.stringify(r2)})`);
  }
});
test('doctor check verifies sidecar on main, kernel lock, ref hook wired, and does not report token missing from main (Ruling 10, Finding M7)', (t) => {
  const repoRoot = tempWorktree(t);
  const lockDir = path.join(repoRoot, '.fgos', 'locks');
  const lockFile = path.join(lockDir, `${DEFAULT_LOCK_NAME}.lock`);
  // 1. No lease: passes (when ref hook wired)
  const checkFree = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkFree.passed, true);

  // 2. Ref hook not wired: fails
  execFileSync('git', ['config', '--unset', 'core.hooksPath'], { cwd: repoRoot });
  const checkNoHook = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkNoHook.passed, false);
  assert.match(checkNoHook.message, /reference-transaction hook is not wired/);

  // Re-wire hook
  const hooksDir = path.join(repoRoot, '.githooks');
  execFileSync('git', ['config', 'core.hooksPath', hooksDir], { cwd: repoRoot });

  // 3. Acquire lease in a linked worktree
  const linkedWt = linkedWorktree(repoRoot, 'holder-branch');

  acquireDocumentationCutoverLease({
    repoRoot: linkedWt,
    worktree: linkedWt,
    commitSidecar: (data) => commitSidecarFixture(repoRoot, data),
  });

  // Ensure kernel lock file exists in main
  fs.writeFileSync(lockFile, '');

  // 4. Running doctor from main checkout must NOT report "token missing" merely because token is in holder worktree (Ruling 10, Finding M7)
  const checkFromMain = checkDocumentationCutoverLeaseDoctor(repoRoot);
  assert.equal(checkFromMain.passed, false);
  assert.ok(checkFromMain.message.includes('actively held'));
  assert.equal(checkFromMain.message.includes('token file is missing'), false);

  // 5. Running doctor from holder worktree verifies token
  const checkFromHolder = checkDocumentationCutoverLeaseDoctor(linkedWt);
  assert.equal(checkFromHolder.passed, false);
  assert.ok(checkFromHolder.message.includes('actively held'));
});
