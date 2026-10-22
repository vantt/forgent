import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import {
  DEFAULT_LOCK_NAME, DEFAULT_SIDECAR_PATH, DEFAULT_TOKEN_FILE, LEASE_SCOPE_PATTERNS,
  isScopedPath, intersectsScope, hashHolderToken, readSidecarFromMain, computeScopeDigests,
  acquireDocumentationCutoverLease as acquire, inspectDocumentationCutoverLease as inspect,
  releaseDocumentationCutoverLease as release, abandonDocumentationCutoverLease as abandon,
  leaseAdmission, checkLeaseCommitGuard, checkDocumentationCutoverLeaseDoctor as doctor,
} from '../../src/runner/documentation-cutover-lease.mjs';

const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-state-'));
process.env.FGOS_STATE_ROOT = stateRoot;
after(() => fs.rmSync(stateRoot, { recursive: true, force: true }));
ensureScriptAddon();
const sourceRoot = fileURLToPath(new URL('../../', import.meta.url));
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repoRoot = path.join(temp, 'repo'); fs.mkdirSync(repoRoot);
  const git = (args, cwd = repoRoot) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = (name, data, root = repoRoot) => { const dest = path.join(root, name); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, data); };
  git(['init', '-qb', 'main']); git(['config', 'user.name', 'Fixture']); git(['config', 'user.email', 'fixture@example.invalid']);
  put('README.md', 'fixture\n'); put('.gitignore', '.fgos/\n'); put('docs/index.md', 'docs\n');
  git(['add', '.']); git(['commit', '-qm', 'baseline']);
  const fence = path.join(repoRoot, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  const worktree = (branch = 'holder') => { const root = path.join(temp, branch); git(['worktree', 'add', '-qb', branch, root]); return root; };
  return { repoRoot, temp, git, put, worktree };
}

test('scope matcher derives all roots from one list and accepts byte paths without whitespace trimming', () => {
  for (const pattern of LEASE_SCOPE_PATTERNS) {
    const name = pattern.replace('/**', '/nested/file.md');
    assert.equal(isScopedPath(name), true); assert.equal(isScopedPath(Buffer.from(name)), true);
  }
  assert.equal(isScopedPath('docs/tiếng.md'), true);
  assert.equal(isScopedPath(' docs/file.md'), false);
  assert.equal(intersectsScope(['apps/code', 'docs/a\nb.md']), true);
  assert.equal(intersectsScope(['README.md', 'src/code']), false);
});

test('production acquire commits exactly the sidecar with base evidence and keeps the token private', t => {
  const f = fixture(t); const before = f.git(['rev-parse', 'HEAD']);
  const result = acquire({ repoRoot: f.repoRoot });
  assert.equal(result.result, 'acquired'); assert.equal(result.token, undefined);
  const token = fs.readFileSync(result.tokenPath, 'utf8').trim();
  assert.equal(hashHolderToken(token), result.tokenHash); assert.ok(!JSON.stringify(result).includes(token));
  const held = readSidecarFromMain(f.repoRoot);
  assert.equal(held.status, 'held'); assert.equal(held.sidecar.baseCommit, before);
  assert.deepEqual(f.git(['diff-tree', '-r', '--no-commit-id', '--name-only', 'HEAD']).split('\n'), [DEFAULT_SIDECAR_PATH]);
  assert.equal(f.git(['status', '--porcelain']), '');
  assert.equal(held.sidecar.cleanWorktrees, undefined);
  assert.equal(inspect({ repoRoot: f.repoRoot }).held, true);
  assert.throws(() => acquire({ repoRoot: f.repoRoot }), { code: 'lease-already-held' });
});

test('holder release from a subdirectory uses the checkout-root token and lands on main', t => {
  const f = fixture(t); const holder = f.worktree(); const other = f.worktree('other');
  const result = acquire({ repoRoot: path.join(holder, 'docs') });
  assert.equal(result.tokenPath, path.join(holder, DEFAULT_TOKEN_FILE));
  assert.equal(fs.existsSync(path.join(holder, 'docs/.fgos')), false);
  assert.throws(() => release({ repoRoot: other }), { code: 'not-holder' });
  assert.equal(doctor(f.repoRoot).passed, true); // consumer repos do not use these hooks
  const released = release({ repoRoot: path.join(holder, 'docs') });
  assert.equal(released.result, 'released'); assert.deepEqual(released.drift, []);
  assert.equal(readSidecarFromMain(f.repoRoot).state, 'released');
  assert.equal(fs.existsSync(result.tokenPath), false);
  assert.throws(() => release({ repoRoot: holder }), { code: 'lease-not-held' });
});

test('scope root OIDs cover large subtrees and release records drift rather than refusing it', t => {
  const f = fixture(t);
  for (let i = 0; i < 300; i++) { f.put(`apps/${i}.txt`, 'outside'); f.put(`docs/${i}.md`, 'inside'); }
  f.git(['add', '.']); f.git(['commit', '-qm', 'large tree']);
  const acquired = acquire({ repoRoot: f.repoRoot });
  assert.equal(Object.keys(acquired.sidecar.scopeDigests).length, LEASE_SCOPE_PATTERNS.length - 1);
  const previous = computeScopeDigests(f.repoRoot);
  for (const [root, digest] of Object.entries(previous)) {
    const entry = f.git(['ls-tree', 'main', '--', root]);
    assert.equal(digest, entry ? entry.split(/\s+/)[2] : null, root);
  }
  assert.equal(isScopedPath('custom/lease.json', { sidecarPath: 'custom/lease.json' }), true);
  assert.equal(isScopedPath(DEFAULT_SIDECAR_PATH, { sidecarPath: 'custom/lease.json' }), true);
  f.put('docs/299.md', 'last page changed');
  f.git(['add', 'docs/299.md']); f.git(['-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'raw bypass']);
  const result = release({ repoRoot: f.repoRoot });
  assert.deepEqual(result.drift, ['docs']);
  assert.notEqual(result.sidecar.releaseScopeDigests.docs, previous.docs);
  assert.deepEqual(readSidecarFromMain(f.repoRoot).sidecar.drift, ['docs']);
});

test('owner abandon needs confirmation and reason, refuses a live kernel holder, and lands for a non-holder', t => {
  const f = fixture(t); const holder = f.worktree(); acquire({ repoRoot: holder });
  assert.throws(() => abandon({ repoRoot: f.repoRoot, reason: 'lost holder' }), { code: 'owner-confirmation-required' });
  assert.throws(() => abandon({ repoRoot: f.repoRoot, ownerConfirmed: true, reason: ' ' }), { code: 'owner-confirmation-required' });
  const scope = createLockScope('live-transition');
  const locked = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir: path.join(f.repoRoot, '.fgos') });
  assert.equal(locked.result, 'acquired');
  try { assert.throws(() => abandon({ repoRoot: f.repoRoot, ownerConfirmed: true, reason: 'lost holder' }), { code: 'lock-held' }); }
  finally { locked.handle.release(); }
  const result = abandon({ repoRoot: f.repoRoot, ownerConfirmed: true, reason: 'lost holder' });
  assert.equal(readSidecarFromMain(f.repoRoot).state, 'abandoned');
  assert.equal(result.sidecar.abandon.holderTokenHash, result.sidecar.holderTokenHash);
  assert.ok(result.sidecar.abandon.ageMs >= 0);
});

test('committed freeze ignores forged disk copies, missing locks, environment tokens and clean', t => {
  const f = fixture(t); const holder = f.worktree(); const other = f.worktree('other');
  const result = acquire({ repoRoot: holder });
  const token = fs.readFileSync(result.tokenPath, 'utf8').trim();
  f.put(DEFAULT_SIDECAR_PATH, '{"state":"released"}', other);
  fs.rmSync(path.join(f.repoRoot, '.fgos/locks'), { recursive: true });
  f.git(['clean', '-fdX'], holder);
  assert.equal(inspect({ repoRoot: other }).held, true);
  const prior = process.env.FGOS_DOCS_LEASE_TOKEN; process.env.FGOS_DOCS_LEASE_TOKEN = token;
  try {
    const refused = leaseAdmission({ repoRoot: other, paths: ['docs/a.md'] });
    assert.equal(refused.allowed, false); assert.ok(!refused.message.includes(token));
    assert.ok(checkLeaseCommitGuard(other, { stagedPaths: ['docs/a.md'] }));
    assert.equal(leaseAdmission({ repoRoot: other, paths: ['src/code'] }).allowed, true);
  } finally { if (prior === undefined) delete process.env.FGOS_DOCS_LEASE_TOKEN; else process.env.FGOS_DOCS_LEASE_TOKEN = prior; }
});

test('corrupt committed sidecars fail closed for acquire and every Node gate', t => {
  const f = fixture(t);
  for (const raw of ['<<< conflict >>>', '{"state":"HELD"}', '{"state":"held"}']) {
    f.put(DEFAULT_SIDECAR_PATH, raw); f.git(['add', DEFAULT_SIDECAR_PATH]); f.git(['commit', '-qm', 'corrupt fixture']);
    assert.throws(() => acquire({ repoRoot: f.repoRoot }), { code: 'corrupt-sidecar' });
    assert.equal(leaseAdmission({ repoRoot: f.repoRoot }).allowed, false);
    assert.match(checkLeaseCommitGuard(f.repoRoot, { stagedPaths: ['docs/a'] }), /corrupt/);
    assert.equal(inspect({ repoRoot: f.repoRoot }).state, 'corrupt');
  }
});

test('holder worktree must belong to this repository and its token cannot reside inside scope', t => {
  const f = fixture(t); const other = fixture(t);
  assert.throws(() => acquire({ repoRoot: f.repoRoot, worktree: other.repoRoot }), { code: 'invalid-worktree' });
  const nested = path.join(f.repoRoot, 'docs/holder'); f.git(['worktree', 'add', '-qb', 'nested', nested]);
  assert.throws(() => acquire({ repoRoot: f.repoRoot, worktree: nested }), { code: 'token-inside-scope' });
});

test('doctor is not applicable in non-git, plain git and consumer projects with their own hooks', t => {
  const f = fixture(t);
  assert.match(doctor(f.repoRoot).message, /not applicable/);
  assert.match(doctor(f.temp).message, /not applicable/);
  f.put('.githooks/pre-commit', '#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(f.repoRoot, '.githooks/pre-commit'), 0o755);
  f.git(['config', 'core.hooksPath', '.githooks']);
  assert.deepEqual(doctor(f.repoRoot), { passed: true, message: 'not applicable: project does not use repository hooks' });
});

test('doctor verifies repository hook wiring and reports held authority without looking for a main-checkout token', t => {
  const f = fixture(t);
  f.put('.githooks/pre-commit', '#!/bin/sh\nexit 0\n');
  f.put('.githooks/reference-transaction', '#!/bin/sh\nexit 0\n');
  for (const name of ['pre-commit', 'reference-transaction']) fs.chmodSync(path.join(f.repoRoot, '.githooks', name), 0o755);
  assert.equal(doctor(f.repoRoot).passed, false);
  assert.match(doctor(f.repoRoot).message, /not wired/);
  f.git(['config', 'core.hooksPath', '.githooks']);
  assert.equal(doctor(f.repoRoot).passed, true);
  const holder = f.worktree(); acquire({ repoRoot: holder });
  assert.equal(fs.existsSync(path.join(f.repoRoot, DEFAULT_TOKEN_FILE)), false);
  const active = doctor(f.repoRoot);
  assert.equal(active.passed, false); assert.match(active.message, /actively held/); assert.doesNotMatch(active.message, /token.*missing/);
  fs.rmSync(path.join(f.repoRoot, '.fgos/locks', `${DEFAULT_LOCK_NAME}.lock`));
  assert.match(doctor(f.repoRoot).message, /resource is missing/);
});

test('two production acquire processes have exactly one winner across twenty trials', async t => {
  for (let trial = 0; trial < 20; trial++) {
    const f = fixture(t);
    const script = `import { ensureScriptAddon } from ${JSON.stringify(path.join(sourceRoot, 'scripts/lib/git-ports.mjs'))};
      ensureScriptAddon();
      import { acquireDocumentationCutoverLease } from ${JSON.stringify(path.join(sourceRoot, 'src/runner/documentation-cutover-lease.mjs'))};
      try { const r = acquireDocumentationCutoverLease({repoRoot:${JSON.stringify(f.repoRoot)}}); console.log(JSON.stringify({status:r.result})); }
      catch(e) { console.log(JSON.stringify({status:'refused',code:e.code,message:e.message})); }`;
    const worker = () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = ''; let err = ''; child.stdout.on('data', d => out += d); child.stderr.on('data', d => err += d);
      child.once('error', reject); child.once('close', () => { try { resolve(JSON.parse(out.trim())); } catch { reject(new Error(out + err)); } });
    });
    const results = await Promise.all([worker(), worker()]);
    assert.equal(results.filter(r => r.status === 'acquired').length, 1, JSON.stringify(results));
    assert.equal(readSidecarFromMain(f.repoRoot).status, 'held');
    // Both producers have exited; committed authority still refuses non-holders.
    const other = f.worktree('non-holder'); assert.equal(leaseAdmission({ repoRoot: other }).allowed, false);
  }
});
