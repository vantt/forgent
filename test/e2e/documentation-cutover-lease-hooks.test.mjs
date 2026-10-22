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
  put('docs/guide.md', '# Guide\n');
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

  const setupLease = (token = generateHolderToken(), worktree = repo) => {
    const tokenHash = hashHolderToken(token);
    const sidecarData = {
      contract: { id: 'documentation-cutover-lease', version: 1 },
      state: 'held',
      holderTokenHash: tokenHash,
      acquiredAt: new Date().toISOString(),
      worktree,
      branch: 'main',
      baseCommit: git(['rev-parse', 'HEAD']),
      scope: ['docs/**', 'AGENTS.md', 'CLAUDE.md'],
      scopeDigests: {},
    };
    put(DEFAULT_SIDECAR_PATH, `${JSON.stringify(sidecarData, null, 2)}\n`);
    git(['add', DEFAULT_SIDECAR_PATH]);
    git(['commit', '-q', '--no-verify', '-m', 'chore: setup lease sidecar on main']);
    return { token, tokenHash, sidecarData };
  };

  const addWorktree = (branchName = 'side') => {
    const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-hook-wt-')), 'wt');
    t.after(() => fs.rmSync(path.dirname(wt), { recursive: true, force: true }));
    git(['worktree', 'add', '-q', '-b', branchName, wt]);
    return wt;
  };

  return { temp, repo, host, git, put, commit, setupLease, addWorktree };
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
  const wtHolder = f.addWorktree('holder-branch');
  const { token } = f.setupLease(generateHolderToken(), wtHolder);

  // Write holder token file in holder worktree
  f.put(DEFAULT_TOKEN_FILE, `${token}\n`, wtHolder);

  f.put('docs/architecture.md', '# Architecture\n', wtHolder);
  f.git(['add', 'docs/architecture.md'], wtHolder);

  const res = f.commit(['-m', 'holder updating docs'], wtHolder);
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

  const parentCommit = f.git(['rev-parse', 'HEAD']);

  // Create an out-of-band tree touching docs/ using git commit-tree
  f.put('docs/secret.md', '# Secret\n');
  f.git(['add', 'docs/secret.md']);
  const docTreeSha = f.git(['write-tree']);
  f.git(['reset', '-q', 'HEAD']); // unstage before lease

  f.setupLease();
  const leaseHead = f.git(['rev-parse', 'HEAD']);

  const newCommit = f.git(['commit-tree', docTreeSha, '-p', leaseHead, '-m', 'direct tree commit']);

  // Attempt raw update-ref
  const res = spawnSync('git', ['update-ref', 'refs/heads/main', newCommit, leaseHead], {
    cwd: f.repo,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /reference-transaction refused/);

  // Main HEAD remains untouched
  assert.equal(f.git(['rev-parse', 'HEAD']), leaseHead);
});

test('reference-transaction refuses fast-forward merge on scoped paths for non-holder', (t) => {
  const f = fixture(t);
  f.setupLease();
  const baseCommit = f.git(['rev-parse', 'HEAD']);

  // Create branch from main (descendant of lease commit) with doc changes
  f.git(['checkout', '-q', '-b', 'feature-docs']);
  f.put('docs/new-guide.md', '# Guide\n');
  f.git(['add', 'docs/new-guide.md']);
  f.git(['commit', '-q', '--no-verify', '-m', 'add new guide']);
  const featureCommit = f.git(['rev-parse', 'HEAD']);

  // Switch back to main
  f.git(['checkout', '-q', 'main']);

  // Non-holder attempts fast-forward merge into main
  const res = spawnSync('git', ['merge', '--ff-only', featureCommit], {
    cwd: f.repo,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /reference-transaction refused/);
});

test('reference-transaction allows ref updates touching only .fgos/ (Work checkpoint)', (t) => {
  const f = fixture(t);
  const parentCommit = f.git(['rev-parse', 'HEAD']);

  // Create tree touching only .fgos/
  f.put('.fgos/checkpoint.txt', 'checkpoint data\n');
  f.git(['add', '.fgos/checkpoint.txt']);
  const fgosTreeSha = f.git(['write-tree']);
  f.git(['reset', '-q', 'HEAD']);

  f.setupLease();
  const leaseHead = f.git(['rev-parse', 'HEAD']);

  const newCommit = f.git(['commit-tree', fgosTreeSha, '-p', leaseHead, '-m', 'checkpoint commit']);

  const res = spawnSync('git', ['update-ref', 'refs/heads/main', newCommit, leaseHead], {
    cwd: f.repo,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.equal(res.status, 0, res.stderr);
  assert.equal(f.git(['rev-parse', 'HEAD']), newCommit);
});

test('linked-worktree holder vs non-holder (Finding H2, Ruling 2)', (t) => {
  const f = fixture(t);
  const wtHolder = f.addWorktree('holder-worktree');
  const wtOther = f.addWorktree('other-worktree');

  // Setup lease with wtHolder as holder
  const { token } = f.setupLease(generateHolderToken(), wtHolder);

  // Write token file ONLY in wtHolder
  f.put(DEFAULT_TOKEN_FILE, `${token}\n`, wtHolder);

  // 1. Holder commits in wtHolder -> allowed
  f.put('docs/holder-edit.md', '# Holder Edit\n', wtHolder);
  f.git(['add', 'docs/holder-edit.md'], wtHolder);
  const holderRes = f.commit(['-m', 'holder commit'], wtHolder);
  assert.equal(holderRes.status, 0, holderRes.stderr);

  // 2. Non-holder in wtOther stages doc edit -> refused
  f.put('docs/other-edit.md', '# Other Edit\n', wtOther);
  f.git(['add', 'docs/other-edit.md'], wtOther);
  const otherRes = f.commit(['-m', 'other commit'], wtOther);
  assert.notEqual(otherRes.status, 0);
  assert.match(otherRes.stderr, /commit refused: the documentation-cutover write lease is held/);
});

test('forged working-tree sidecar in worktree is ignored by both hooks (Finding H1, Repro C2)', (t) => {
  const f = fixture(t);
  const wtOther = f.addWorktree('forged-worktree');
  f.setupLease();
  const leaseHead = f.git(['rev-parse', 'main']);

  // In wtOther, drop untracked sidecar claiming released
  f.put(DEFAULT_SIDECAR_PATH, JSON.stringify({ state: 'released' }), wtOther);

  // 1. Pre-commit in worktree must still refuse because authority is on refs/heads/main
  f.put('docs/exploit.md', '# Exploit\n', wtOther);
  f.git(['add', 'docs/exploit.md'], wtOther);
  const commitRes = f.commit(['-m', 'exploit commit'], wtOther);
  assert.notEqual(commitRes.status, 0);
  assert.match(commitRes.stderr, /commit refused: the documentation-cutover write lease is held/);

  // 2. Reference-transaction hook must still refuse update-ref refs/heads/main even with forged sidecar (Repro C2)
  const exploitCommit = f.git(['commit-tree', f.git(['write-tree'], wtOther), '-p', leaseHead, '-m', 'exploit tree'], wtOther);
  const bypassRes = spawnSync('git', ['update-ref', 'refs/heads/main', exploitCommit, leaseHead], {
    cwd: wtOther,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.notEqual(bypassRes.status, 0);
  assert.match(bypassRes.stderr, /reference-transaction refused/);
});
test('git clean -fdX does not reopen the freeze in worktrees (Finding H1, Repro F)', (t) => {
  const f = fixture(t);
  const wt = f.addWorktree('clean-test-wt');
  f.setupLease();

  // Run git clean -fdX
  f.git(['clean', '-fdX'], wt);

  // Commit to docs must still be refused
  f.put('docs/clean-test.md', '# Clean Test\n', wt);
  f.git(['add', 'docs/clean-test.md'], wt);
  const res = f.commit(['-m', 'clean test commit'], wt);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit refused: the documentation-cutover write lease is held/);
});

test('rename out of scope is caught and refused by -z --no-renames (Finding H3)', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Existing file docs/guide.md renamed to apps/guide.md
  f.git(['mv', 'docs/guide.md', 'apps/guide.md']);

  // Pre-commit must detect docs/guide.md as modified/deleted and refuse
  const res = f.commit(['-m', 'rename out of scope']);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit refused: the documentation-cutover write lease is held/);
});

test('non-ASCII path is caught and refused with and without --no-verify (Finding H3)', (t) => {
  const f = fixture(t);
  f.setupLease();

  f.put('docs/tiếng.md', '# Tiếng Việt\n');
  f.git(['add', 'docs/tiếng.md']);

  // 1. Caught by pre-commit
  const res1 = f.commit(['-m', 'non-ascii commit']);
  assert.notEqual(res1.status, 0);
  assert.match(res1.stderr, /commit refused: the documentation-cutover write lease is held/);

  // 2. Caught by reference-transaction hook when bypassing pre-commit
  const res2 = f.commit(['--no-verify', '-m', 'non-ascii bypass']);
  assert.notEqual(res2.status, 0);
  assert.match(res2.stderr, /reference-transaction refused/);
});

test('typechange is caught and refused (Finding H3)', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Replace file docs/guide.md with a symlink (typechange T)
  fs.unlinkSync(path.join(f.repo, 'docs/guide.md'));
  fs.symlinkSync('../README.md', path.join(f.repo, 'docs/guide.md'));
  f.git(['add', 'docs/guide.md']);

  const res = f.commit(['-m', 'typechange file to symlink']);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit refused: the documentation-cutover write lease is held/);
});

test('rebase and cherry-pick touching scoped paths are caught and refused by reference-transaction', (t) => {
  const f = fixture(t);

  // Create commit touching docs on branch feature
  f.git(['checkout', '-q', '-b', 'feature']);
  f.put('docs/feature.md', '# Feature\n');
  f.git(['add', 'docs/feature.md']);
  f.git(['commit', '-q', '--no-verify', '-m', 'feature doc commit']);
  const featureSha = f.git(['rev-parse', 'HEAD']);

  // Switch back to main and acquire lease
  f.git(['checkout', '-q', 'main']);
  f.setupLease();

  // Attempt cherry-pick onto main
  const cpRes = spawnSync('git', ['cherry-pick', featureSha], {
    cwd: f.repo,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.notEqual(cpRes.status, 0);
  assert.match(cpRes.stderr, /reference-transaction refused/);
});
