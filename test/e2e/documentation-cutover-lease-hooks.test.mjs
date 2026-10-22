import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_SIDECAR_PATH,
  DEFAULT_TOKEN_FILE,
  generateHolderToken,
  hashHolderToken,
  writeSidecarAtomic,
} from '../../src/runner/documentation-cutover-lease.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(sourceRoot, 'target', 'debug', 'fgos');
if (!process.env.FGOS_HOST_BIN && fs.existsSync(BUILT_HOST)) {
  process.env.FGOS_HOST_BIN = BUILT_HOST;
}

const env = { ...process.env };
delete env.CLAUDE_CODE_SESSION_ID;
delete env.FGOS_SESSION_ID;
delete env.FGOS_DOCS_LEASE_TOKEN;

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-hooks-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));

  const repo = path.join(temp, 'repo');
  const host = path.join(temp, 'hook-host');
  fs.mkdirSync(repo);

  const git = (args, cwd = repo) =>
    execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

  const put = (relative, content, cwd = repo) => {
    const destination = path.join(cwd, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  };

  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.name', 'Lease Hook Fixture']);
  git(['config', 'user.email', 'lease-hooks@example.invalid']);

  put('README.md', '# Fixture\n');
  put('existing.txt', 'baseline\n');
  put('apps/fgos/Cargo.toml', '[package]\nname="fixture"\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'fixture baseline']);

  // Copy hooks to hook-host
  const preCommitDest = path.join(host, '.githooks/pre-commit');
  const refTxDest = path.join(host, '.githooks/reference-transaction');
  fs.mkdirSync(path.dirname(preCommitDest), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, '.githooks/pre-commit'), preCommitDest);
  fs.copyFileSync(path.join(sourceRoot, '.githooks/reference-transaction'), refTxDest);
  fs.chmodSync(preCommitDest, 0o755);
  fs.chmodSync(refTxDest, 0o755);

  // Link src/ into hook-host so imports resolve
  fs.mkdirSync(path.join(host, 'src'));
  for (const entry of fs.readdirSync(path.join(sourceRoot, 'src'))) {
    if (entry !== 'convention') {
      fs.symlinkSync(path.join(sourceRoot, 'src', entry), path.join(host, 'src', entry));
    }
  }

  // Wire core.hooksPath
  git(['config', 'core.hooksPath', path.join(host, '.githooks')]);

  const commit = (args = ['-m', 'test commit'], cwd = repo, extraEnv = {}) =>
    spawnSync('git', ['commit', '-q', ...args], {
      cwd,
      env: { ...env, ...extraEnv },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    });

  const setupLease = (token = generateHolderToken()) => {
    const tokenHash = hashHolderToken(token);
    const sidecarPath = path.join(repo, DEFAULT_SIDECAR_PATH);
    writeSidecarAtomic(sidecarPath, {
      contract: { id: 'documentation-cutover-lease', version: 1 },
      state: 'held',
      holderTokenHash: tokenHash,
      acquiredAt: new Date().toISOString(),
      worktree: repo,
      branch: 'main',
      baseCommit: git(['rev-parse', 'HEAD']),
      scope: ['docs/**', 'AGENTS.md', 'CLAUDE.md'],
      scopeDigests: {},
    });
    return { token, tokenHash };
  };

  return { temp, repo, host, git, put, commit, setupLease };
}

test('pre-commit refuses non-holder commit touching scoped paths', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Non-holder stages doc change
  f.put('docs/architecture.md', '# Architecture\n');
  f.git(['add', 'docs/architecture.md']);

  const res = f.commit(['-m', 'update docs']);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit refused: the documentation-cutover write lease is held/);
});

test('pre-commit allows holder commit touching scoped paths', (t) => {
  const f = fixture(t);
  const { token } = f.setupLease();

  // Write holder token file in repo
  f.put(DEFAULT_TOKEN_FILE, `${token}\n`);

  f.put('docs/architecture.md', '# Architecture\n');
  f.git(['add', 'docs/architecture.md']);

  const res = f.commit(['-m', 'holder updating docs']);
  assert.equal(res.status, 0, res.stderr);
});

test('pre-commit allows out-of-scope commit by non-holder while lease is held', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Non-holder stages code change (out of scope)
  f.put('src/runner/feature.js', 'console.log(1);\n');
  f.git(['add', 'src/runner/feature.js']);

  const res = f.commit(['-m', 'code only change']);
  assert.equal(res.status, 0, res.stderr);
});

test('reference-transaction hook catches --no-verify commit touching scoped paths', (t) => {
  const f = fixture(t);
  f.setupLease();

  f.put('docs/bypass.md', '# Bypassed\n');
  f.git(['add', 'docs/bypass.md']);

  // --no-verify skips pre-commit, but reference-transaction must refuse the ref update
  const res = f.commit(['--no-verify', '-m', 'bypass attempt']);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /reference-transaction refused/);
});

test('reference-transaction refuses git update-ref on target branch for scoped changes', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Create an out-of-band commit touching docs/ using git commit-tree
  const blobSha = f.git(['hash-object', '-w', '--stdin'], f.repo);
  const treeSha = f.git(['write-tree']);
  // Add doc to index to make a tree with docs/
  f.put('docs/secret.md', '# Secret\n');
  f.git(['add', 'docs/secret.md']);
  const docTreeSha = f.git(['write-tree']);
  f.git(['reset', '-q', 'HEAD']); // unstage

  const parentCommit = f.git(['rev-parse', 'HEAD']);
  const newCommit = f.git(['commit-tree', docTreeSha, '-p', parentCommit, '-m', 'direct tree commit']);

  // Attempt raw update-ref
  const res = spawnSync('git', ['update-ref', 'refs/heads/main', newCommit, parentCommit], {
    cwd: f.repo,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /reference-transaction refused/);

  // Main HEAD remains untouched
  assert.equal(f.git(['rev-parse', 'HEAD']), parentCommit);
});

test('reference-transaction refuses fast-forward merge on scoped paths for non-holder', (t) => {
  const f = fixture(t);
  const baseCommit = f.git(['rev-parse', 'HEAD']);

  // Create branch with doc changes BEFORE lease
  f.git(['checkout', '-q', '-b', 'feature-docs']);
  f.put('docs/new-guide.md', '# Guide\n');
  f.git(['add', 'docs/new-guide.md']);
  f.git(['commit', '-q', '--no-verify', '-m', 'add new guide']);
  const featureCommit = f.git(['rev-parse', 'HEAD']);

  // Switch back to main and establish lease
  f.git(['checkout', '-q', 'main']);
  f.setupLease();

  // Attempt ff-merge without token
  const res = spawnSync('git', ['merge', '--ff-only', 'feature-docs'], {
    cwd: f.repo,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /reference-transaction refused/);
  assert.equal(f.git(['rev-parse', 'HEAD']), baseCommit);
});

test('reference-transaction allows ref updates touching only .fgos/ (Work checkpoint)', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Create commit touching only .fgos/events.jsonl
  f.put('.fgos/events.jsonl', '{"event":"checkpoint"}\n');
  f.git(['add', '.fgos/events.jsonl']);

  // Commit with --no-verify to isolate reference-transaction behavior
  const res = f.commit(['--no-verify', '-m', 'Work checkpoint']);
  assert.equal(res.status, 0, res.stderr);
});

test('ordinary commits pass fast when no lease is held', (t) => {
  const f = fixture(t);
  // No lease held

  f.put('docs/ordinary.md', '# Ordinary\n');
  f.git(['add', 'docs/ordinary.md']);

  const res = f.commit(['-m', 'ordinary commit without lease']);
  assert.equal(res.status, 0, res.stderr);
});
