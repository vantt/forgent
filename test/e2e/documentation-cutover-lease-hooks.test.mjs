import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_SIDECAR_PATH,
  DEFAULT_TOKEN_FILE,
} from '../../src/runner/documentation-cutover-lease.mjs';

import { acquireSync, createLockScope, runBorrowed } from '../../src/holder-lock/index.mjs';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';

const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lease-hooks-state-'));
process.env.FGOS_STATE_ROOT = stateRoot;
after(() => fs.rmSync(stateRoot, { recursive: true, force: true }));
ensureScriptAddon();
// Cold CLI children need their own checkout-matching addon bootstrap too;
// FGOS_HOST_BIN alone can name an unrelated activated release.
const cliBootstrap = `data:text/javascript,import { ensureScriptAddon } from ${JSON.stringify(new URL('../../scripts/lib/git-ports.mjs', import.meta.url).href)}; ensureScriptAddon();`;

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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
  put('.gitignore', '.fgos/\n');
  put('apps/fgos/Cargo.toml', '[package]\nname="fixture"\n');
  put('docs/guide.md', '# Guide\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'fixture baseline']);

  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));

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

  // boundary: real docs-lease CLI transitions and both Git hooks must share
  // the staged host/addon; module-only tests cannot prove their wiring.
  const rawCli = (args, cwd = repo, extraEnv = {}, json = true) => spawnSync(process.execPath, ['--import', cliBootstrap, path.join(sourceRoot, 'bin/fgos.mjs'), 'docs-lease', ...args, ...(json ? ['--json'] : [])], {
    cwd, env: { ...env, ...extraEnv }, encoding: 'utf8', timeout: 60_000,
  });
  const cli = (args, cwd = repo) => {
    const res = rawCli(args, cwd);
    assert.equal(res.status, 0, res.stderr + res.stdout);
    const output = JSON.parse(res.stdout);
    return output.data ?? output;
  };
  const setupLease = (worktree) => {
    const result = cli(['acquire', '--worktree', worktree ?? addWorktree('lease-holder')]);
    const token = fs.readFileSync(result.tokenPath, 'utf8').trim();
    assert.equal(JSON.stringify(result).includes(token), false, 'CLI must not print the token');
    return { token, tokenHash: result.tokenHash, sidecarData: result.sidecar };
  };

  const addWorktree = (branchName = 'side') => {
    const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-hook-wt-')), 'wt');
    t.after(() => fs.rmSync(path.dirname(wt), { recursive: true, force: true }));
    git(['worktree', 'add', '-q', '-b', branchName, wt]);
    return wt;
  };

  return { temp, repo, host, git, put, commit, setupLease, addWorktree, cli, rawCli };
}

test('both commit hooks observe the real main-checkout borrowed description', (t) => {
  const f = fixture(t);
  // A probe, not an injected committer: Git itself spawns both hooks with the
  // description lent by the public holder-lock door.
  const probeSource = `#!/usr/bin/env node
import fs from 'node:fs';
import { checkBorrowedDescription, resolveLock, LOCK_FD_ENV } from ${JSON.stringify(new URL('../../src/holder-lock/index.mjs', import.meta.url).href)};
const fgosDir = ${JSON.stringify(path.join(f.repo, '.fgos'))};
let answer;
try { answer = checkBorrowedDescription(resolveLock('main-checkout', { fgosDir }).v3Path, { fgosDir }); }
catch (error) { answer = { result: 'error', message: error.message }; }
fs.appendFileSync(${JSON.stringify(path.join(f.temp, 'borrow-observations.jsonl'))}, JSON.stringify({hook: process.argv[1], state: process.argv[2], env: process.env[LOCK_FD_ENV], ...answer}) + '\\n');
if (answer.result !== 'borrower') process.exit(1);
`;
  for (const name of ['pre-commit', 'reference-transaction']) {
    fs.writeFileSync(path.join(f.host, '.githooks', name), probeSource, { mode: 0o755 });
  }
  const scope = createLockScope('lease-hook-borrow-proof');
  const acquired = acquireSync(scope, 'main-checkout', { fgosDir: path.join(f.repo, '.fgos') });
  assert.equal(acquired.result, 'acquired');
  try {
    f.put('existing.txt', 'borrowed change\n');
    f.git(['add', 'existing.txt']);
    const result = runBorrowed(acquired.handle, { command: 'git', args: ['commit', '-qm', 'borrowed commit'], cwd: f.repo, env });
    const observations = fs.readFileSync(path.join(f.temp, 'borrow-observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(result.exit, 0, `${result.stderr}\n${JSON.stringify(observations)}`);
    assert.ok(observations.some(row => row.hook.endsWith('/pre-commit') && row.result === 'borrower'));
    assert.ok(observations.some(row => row.hook.endsWith('/reference-transaction') && row.state === 'prepared' && row.result === 'borrower'));
  } finally {
    acquired.handle.release();
  }
});

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
  const { token } = f.setupLease(wtHolder);

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
  f.setupLease();
  const leaseHead = f.git(['rev-parse', 'HEAD']);

  // Preserve the authoritative sidecar while building an out-of-scope tree.
  f.put('.fgos/checkpoint.txt', 'checkpoint data\n');
  f.git(['add', '-f', '.fgos/checkpoint.txt']);
  const fgosTreeSha = f.git(['write-tree']);
  f.git(['reset', '-q', 'HEAD']);

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

test('linked-worktree holder and non-holder have separate token authority', (t) => {
  const f = fixture(t);
  const wtHolder = f.addWorktree('holder-worktree');
  const wtOther = f.addWorktree('other-worktree');

  // Setup lease with wtHolder as holder
  const { token } = f.setupLease(wtHolder);

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

test('both hooks ignore forged working-tree sidecars', (t) => {
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

  // Reference updates must also ignore forged checkout-local evidence.
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
test('git clean -fdX does not reopen the freeze in worktrees', (t) => {
  const f = fixture(t);
  const wt = f.addWorktree('clean-test-wt');
  f.setupLease(wt);
  assert.ok(fs.existsSync(path.join(wt, DEFAULT_TOKEN_FILE)));

  // Clean deletes the holder's ignored token but not the committed freeze.
  f.git(['clean', '-fdX'], wt);
  assert.equal(fs.existsSync(path.join(wt, DEFAULT_TOKEN_FILE)), false);
  assert.notEqual(f.rawCli(['release'], wt).status, 0);

  // Commit to docs must still be refused
  f.put('docs/clean-test.md', '# Clean Test\n', wt);
  f.git(['add', 'docs/clean-test.md'], wt);
  const res = f.commit(['-m', 'clean test commit'], wt);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit refused: the documentation-cutover write lease is held/);
  f.git(['reset', '--hard', '-q'], wt);
  assert.equal(f.cli(['abandon', '--owner-confirmed', '--reason', 'holder token removed by clean']).result, 'abandoned');
});

test('pre-commit refuses renaming a scoped file outside scope', (t) => {
  const f = fixture(t);
  f.setupLease();

  // Existing file docs/guide.md renamed to apps/guide.md
  f.git(['mv', 'docs/guide.md', 'apps/guide.md']);

  // Pre-commit must detect docs/guide.md as modified/deleted and refuse
  const res = f.commit(['-m', 'rename out of scope']);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit refused: the documentation-cutover write lease is held/);
});

test('non-ASCII paths are refused with and without --no-verify', (t) => {
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

test('pre-commit refuses a scoped file changed to a symlink', (t) => {
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

test('CLI release and non-holder owner abandon each commit one legal sidecar transition', t => {
  const f = fixture(t); const holder = f.addWorktree('holder');
  f.setupLease(holder);
  const before = f.git(['rev-parse', 'main']);
  const released = f.cli(['release'], path.join(holder, 'docs'));
  assert.equal(released.result, 'released'); assert.deepEqual(released.drift, []);
  assert.equal(f.git(['rev-list', '--count', `${before}..main`]), '1');
  assert.equal(JSON.parse(f.git(['show', `main:${DEFAULT_SIDECAR_PATH}`])).state, 'released');
  assert.equal(fs.existsSync(path.join(f.repo, DEFAULT_TOKEN_FILE)), false, 'borrowed token is removed from committing checkout');
  assert.equal(fs.existsSync(path.join(holder, DEFAULT_TOKEN_FILE)), false, 'holder token is removed after successful release');
  // Released leases need neither a scoped diff nor native borrower/token
  // resolution. Reject those reads at the real Git adapter if attempted.
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const fastTools = path.join(f.temp, 'fast-tools'); fs.mkdirSync(fastTools);
  fs.writeFileSync(path.join(fastTools, 'git'), `#!/bin/sh
case "$1:$2" in --no-replace-objects:diff|--no-replace-objects:diff-tree) exit 42 ;; esac
exec '${realGit}' "$@"
`, { mode: 0o755 });
  f.put('docs/after-release.md', 'ordinary commit after release'); f.git(['add', 'docs/after-release.md']);
  const fast = f.commit(['-m', 'ordinary released commit'], f.repo, { PATH: `${fastTools}:${env.PATH}`, GIT_EXEC_PATH: fastTools, FGOS_HOST_BIN: '/nonexistent/fgos' });
  assert.equal(fast.status, 0, fast.stderr);
  f.setupLease(holder);
  const ownerBefore = f.git(['rev-parse', 'main']);
  const abandoned = f.cli(['abandon', '--owner-confirmed', '--reason', 'lost holder']);
  assert.equal(abandoned.result, 'abandoned');
  assert.equal(f.git(['rev-list', '--count', `${ownerBefore}..main`]), '1');
  assert.equal(JSON.parse(f.git(['show', `main:${DEFAULT_SIDECAR_PATH}`])).state, 'abandoned');
});

// The transition proof above uses JSON; it cannot catch failures in the human output step
// after a successful mutation. These cases own the four human-mode CLI render paths.
for (const sub of ['acquire', 'status', 'release', 'abandon']) {
  test(`CLI human-mode ${sub} exits successfully and renders stable text`, t => {
    const f = fixture(t);
    const holder = f.addWorktree('human-holder');
    if (sub !== 'acquire') f.setupLease(holder);
    const args = sub === 'acquire' ? [sub, '--worktree', holder]
      : sub === 'abandon' ? [sub, '--owner-confirmed', '--reason', 'human-mode proof'] : [sub];
    const result = f.rawCli(args, sub === 'release' ? holder : f.repo, {}, false);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const lines = result.stdout.trimEnd().split('\n');
    const expected = {
      acquire: /^acquired documentation-cutover lease \(token hash: [a-f0-9]{64}\)$/,
      status: /^documentation-cutover lease is held \(age: \d+s, kernel lock: .+\)$/,
      release: /^released documentation-cutover lease at .+; drift: none$/,
      abandon: /^abandoned documentation-cutover lease: human-mode proof$/,
    };
    assert.match(lines[0], expected[sub]);
    assert.equal(lines.length, sub === 'status' ? 3 : 1, 'only human text, not a second envelope');
    if (sub === 'status') {
      assert.match(lines[1], /^holder token hash: [a-f0-9]{64}$/);
      assert.equal(lines[2], `worktree: ${holder}`);
      f.cli(['release'], holder);
      const released = f.rawCli(['status'], f.repo, {}, false);
      assert.equal(released.status, 0, released.stderr + released.stdout);
      assert.equal(released.stdout, 'documentation-cutover lease is released\n');
      // JSON/held status cannot prove the corrupt human rendering path: a
      // corrupt record is held fail-closed, but has no holder fields or age.
      f.put(DEFAULT_SIDECAR_PATH, 'not JSON');
      f.git(['add', DEFAULT_SIDECAR_PATH]);
      f.git(['-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'corrupt status fixture']);
      const json = f.rawCli(['status']);
      assert.equal(json.status, 0, json.stderr + json.stdout);
      assert.deepEqual(JSON.parse(json.stdout).data, { state: 'corrupt', held: true, sidecar: null });
      const corrupt = f.rawCli(['status'], f.repo, {}, false);
      assert.equal(corrupt.status, json.status, corrupt.stderr + corrupt.stdout);
      assert.match(corrupt.stdout, /^documentation-cutover lease sidecar is corrupt; failing closed\n/);
      assert.doesNotMatch(corrupt.stdout, /NaN|undefined/);
      assert.match(corrupt.stdout, /fgos docs-lease abandon --owner-confirmed --reason/);
    }
  });
}

test('reference hook preserves NUL boundaries for multi-path commits and renames with --no-verify', t => {
  const f = fixture(t); f.setupLease(); const before = f.git(['rev-parse', 'main']);
  for (const [outside, inside] of [['apps/first.txt', 'docs/multi.md'], ['.gitignore', 'docs/tiếng.md']]) {
    f.put(outside, 'outside\n'); f.put(inside, 'inside\n'); f.git(['add', outside, inside]);
    const res = f.commit(['--no-verify', '-m', 'multi-path bypass']);
    assert.notEqual(res.status, 0); assert.match(res.stderr, /reference-transaction refused/);
    assert.equal(f.git(['rev-parse', 'main']), before);
    f.git(['reset', '--hard', '-q']);
  }
  f.git(['mv', 'docs/guide.md', 'apps/renamed.md']);
  const res = f.commit(['--no-verify', '-m', 'rename bypass']);
  assert.notEqual(res.status, 0); assert.match(res.stderr, /reference-transaction refused/);
  assert.equal(f.git(['rev-parse', 'main']), before);
});

test('raw main movement into frozen scope is refused even from the holder checkout without an expected old value', t => {
  const f = fixture(t); const holder = f.addWorktree('holder'); f.setupLease(holder);
  const old = f.git(['rev-parse', 'main']);
  f.put('docs/raw.md', 'raw\n', holder); f.git(['add', 'docs/raw.md'], holder);
  const next = f.git(['commit-tree', f.git(['write-tree'], holder), '-p', old, '-m', 'raw candidate'], holder);
  const res = spawnSync('git', ['update-ref', 'refs/heads/main', next], { cwd: holder, env, encoding: 'utf8' });
  assert.notEqual(res.status, 0); assert.match(res.stderr, /reference-transaction refused/);
  assert.equal(f.git(['rev-parse', 'main']), old);
});

// Existing update-ref and porcelain tests do not exercise symbolic refs,
// batched stdin, deletion or backwards movement of the authoritative branch.
test('reference guard preserves held main through aliases, batches, deletion and reset', t => {
  const f = fixture(t); f.setupLease();
  const old = f.git(['rev-parse', 'main']);
  f.put('docs/raw-alias.md', 'scoped candidate'); f.git(['add', 'docs/raw-alias.md']);
  const candidate = f.git(['commit-tree', f.git(['write-tree']), '-p', old, '-m', 'raw candidate']);
  f.git(['reset', '-q']);
  f.git(['symbolic-ref', 'refs/heads/alias', 'refs/heads/main']);
  const attempts = [
    { args: ['update-ref', 'refs/heads/alias', candidate, old] },
    { args: ['branch', '-f', 'alias', candidate] },
    { args: ['update-ref', '--stdin'], input: `update refs/heads/main ${candidate} ${old}\n` },
    { args: ['update-ref', '-d', 'refs/heads/main', old] },
    { args: ['reset', '--hard', 'main^'] },
  ];
  for (const attempt of attempts) {
    const res = spawnSync('git', attempt.args, { cwd: f.repo, env, input: attempt.input, encoding: 'utf8' });
    assert.notEqual(res.status, 0, attempt.args.join(' '));
    assert.match(res.stderr, /reference-transaction refused/);
    assert.equal(f.git(['rev-parse', 'main']), old);
  }
});

test('both hooks fail closed when their path diff fails under a held production lease', t => {
  const f = fixture(t); f.setupLease();
  f.put('docs/diff-failure.md', 'scoped change'); f.git(['add', 'docs/diff-failure.md']);
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const tools = path.join(f.temp, 'diff-tools'); fs.mkdirSync(tools);
  fs.writeFileSync(path.join(tools, 'git'), `#!/bin/sh
case "$1:$2" in --no-replace-objects:diff|--no-replace-objects:diff-tree) exit 42 ;; esac
exec '${realGit}' "$@"
`, { mode: 0o755 });
  for (const flags of [[], ['--no-verify']]) {
    const result = f.commit([...flags, '-m', 'diff failure'], f.repo, { PATH: `${tools}:${env.PATH}`, GIT_EXEC_PATH: tools });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /fail.*closed/);
  }
});

test('corrupt or unknown committed sidecars are rejected consistently by both hooks and CLI acquire', t => {
  const f = fixture(t);
  for (const raw of ['not JSON', '{"state":"HELD"}', '{"state":"held"}']) {
    f.put(DEFAULT_SIDECAR_PATH, raw); f.git(['add', DEFAULT_SIDECAR_PATH]);
    f.git(['-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'corrupt fixture']);
    f.put('docs/corrupt.md', raw); f.git(['add', 'docs/corrupt.md']);
    for (const flags of [[], ['--no-verify']]) {
      const res = f.commit([...flags, '-m', 'corrupt bypass']);
      assert.notEqual(res.status, 0); assert.match(res.stderr, /corrupt/);
    }
    assert.notEqual(f.rawCli(['acquire']).status, 0);
    assert.notEqual(f.rawCli(['release']).status, 0);
    assert.notEqual(f.rawCli(['abandon', '--reason', 'corrupt']).status, 0);
    assert.notEqual(f.rawCli(['abandon', '--owner-confirmed', '--reason', ' ']).status, 0);
    f.git(['restore', '--staged', '--', 'docs/corrupt.md']);
    fs.rmSync(path.join(f.repo, 'docs/corrupt.md'));
    const before = f.git(['rev-parse', 'main']);
    if (raw === 'not JSON') {
      // A borrower cannot use corruption as an acquire/release bypass, and a
      // confirmed repair record without the borrower is not the owner door.
      const repair = { state: 'abandoned', holderTokenHash: '0'.repeat(64), abandon: { ownerConfirmed: true, reason: 'repair' } };
      const lock = acquireSync(createLockScope('corrupt-transition-adversary'), 'main-checkout', { fgosDir: path.join(f.repo, '.fgos') });
      assert.equal(lock.result, 'acquired');
      try {
        for (const data of [
          { ...repair, state: 'held' }, { ...repair, state: 'released' },
          { ...repair, abandon: { ownerConfirmed: false, reason: 'repair' } },
          { ...repair, abandon: { ownerConfirmed: true, reason: ' ' } }, repair,
        ]) {
          f.put(DEFAULT_SIDECAR_PATH, JSON.stringify(data)); f.git(['add', DEFAULT_SIDECAR_PATH]);
          const candidate = f.git(['commit-tree', f.git(['write-tree']), '-p', before, '-m', 'forged repair']);
          f.git(['restore', '--staged', '--', DEFAULT_SIDECAR_PATH]);
          const result = data === repair
            ? spawnSync('git', ['update-ref', 'refs/heads/main', candidate, before], { cwd: f.repo, env, encoding: 'utf8' })
            : runBorrowed(lock.handle, { command: 'git', args: ['update-ref', 'refs/heads/main', candidate, before], cwd: f.repo, env });
          assert.notEqual(data === repair ? result.status : result.exit, 0);
          assert.match(result.stderr, /reference-transaction refused/);
          assert.equal(f.git(['rev-parse', 'main']), before);
        }
      } finally { lock.handle.release(); }
      f.put(DEFAULT_SIDECAR_PATH, raw);
    }
    const repaired = f.cli(['abandon', '--owner-confirmed', '--reason', 'repair corrupt lease']);
    assert.equal(repaired.result, 'abandoned');
    assert.equal(f.git(['rev-list', '--count', `${before}..main`]), '1');
    const sidecar = JSON.parse(f.git(['show', `main:${DEFAULT_SIDECAR_PATH}`]));
    assert.deepEqual(sidecar.abandon, repaired.sidecar.abandon);
    assert.equal(sidecar.abandon.ownerConfirmed, true);
    assert.equal(sidecar.abandon.repair, 'corrupt-sidecar');
    assert.equal(f.git(['status', '--porcelain']), '');
  }
});

test('a real main borrower cannot rewrite a held lease, change its hash, expand paths or change its parent', t => {
  const f = fixture(t); const { sidecarData } = f.setupLease();
  const old = f.git(['rev-parse', 'main']);
  const earlier = f.git(['rev-parse', 'main^']);
  const cases = [
    { data: { ...sidecarData, state: 'held' } },
    { data: { ...sidecarData, state: 'released', holderTokenHash: '0'.repeat(64) } },
    { data: { ...sidecarData, state: 'released', drift: [], releaseScopeDigests: sidecarData.scopeDigests } },
    { data: { ...sidecarData, state: 'abandoned' } },
    { data: { ...sidecarData, state: 'abandoned', abandon: { ownerConfirmed: true, reason: ' ' } } },
    { data: { ...sidecarData, state: 'abandoned', abandon: { ownerConfirmed: false, reason: 'lost token' } } },
    { data: { ...sidecarData, state: 'released' }, extra: true },
    { data: { ...sidecarData, state: 'released' }, parent: earlier },
    { data: { ...sidecarData, state: 'unknown' } },
  ];
  for (const entry of cases) {
    f.put(DEFAULT_SIDECAR_PATH, JSON.stringify(entry.data));
    f.git(['add', DEFAULT_SIDECAR_PATH]);
    if (entry.extra) { f.put('docs/extra.md', 'extra'); f.git(['add', 'docs/extra.md']); }
    const candidate = f.git(['commit-tree', f.git(['write-tree']), '-p', entry.parent ?? old, '-m', 'invalid transition']);
    f.git(['reset', '-q']);
    const lock = acquireSync(createLockScope('transition-adversary'), 'main-checkout', { fgosDir: path.join(f.repo, '.fgos') });
    assert.equal(lock.result, 'acquired');
    try {
      f.git(['add', DEFAULT_SIDECAR_PATH, ...(entry.extra ? ['docs/extra.md'] : [])]);
      for (const flags of [[], ['--no-verify']]) {
        const committed = runBorrowed(lock.handle, { command: 'git', args: ['commit', '-qm', 'forged transition', ...flags], cwd: f.repo, env });
        assert.notEqual(committed.exit, 0); assert.match(committed.stderr, /commit refused|reference-transaction refused/);
      }
      f.git(['reset', '-q']);
      const result = runBorrowed(lock.handle, { command: 'git', args: ['update-ref', 'refs/heads/main', candidate, old], cwd: f.repo, env });
      assert.notEqual(result.exit, 0); assert.match(result.stderr, /reference-transaction refused/);
      assert.equal(f.git(['rev-parse', 'main']), old);
    } finally { lock.handle.release(); }
  }
});

test('CLI release reports raw hook-disabled drift and commits the release without reopening early', t => {
  const f = fixture(t); const holder = f.addWorktree('holder'); f.setupLease(holder);
  f.put('docs/guide.md', 'raw bypass\n'); f.git(['add', 'docs/guide.md']);
  f.git(['-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'bypass']);
  const result = f.cli(['release'], holder);
  assert.deepEqual(result.drift, ['docs']);
  const committed = JSON.parse(f.git(['show', `main:${DEFAULT_SIDECAR_PATH}`]));
  assert.deepEqual(committed.drift, ['docs']); assert.equal(committed.state, 'released');
});

test('failed scope reads refuse CLI acquire before recording holder evidence', t => {
  const f = fixture(t); const before = f.git(['rev-parse', 'main']);
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const tools = path.join(f.temp, 'unreadable-tools'); fs.mkdirSync(tools);
  fs.writeFileSync(path.join(tools, 'git'), `#!/bin/sh
case " $* " in *" ls-tree -r -t -z --full-tree "*) exit 42 ;; esac
exec '${realGit}' "$@"
`, { mode: 0o755 });
  const result = f.rawCli(['acquire'], f.repo, { PATH: `${tools}:${env.PATH}` });
  assert.notEqual(result.status, 0); assert.match(result.stderr + result.stdout, /42|git.*refused|git.*failed|git.*exit/);
  assert.equal(f.git(['rev-parse', 'main']), before);
  assert.equal(fs.existsSync(path.join(f.repo, DEFAULT_SIDECAR_PATH)), false);
  assert.equal(fs.existsSync(path.join(f.repo, DEFAULT_TOKEN_FILE)), false);
});

test('concurrent raw main move during CLI acquire returns base-moved without retrying', t => {
  const f = fixture(t); const old = f.git(['rev-parse', 'main']);
  const next = f.git(['commit-tree', f.git(['rev-parse', 'HEAD^{tree}']), '-p', old, '-m', 'concurrent main']);
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const tools = path.join(f.temp, 'tools'); fs.mkdirSync(tools);
  const marker = path.join(f.temp, 'moved');
  // External Git driver shim moves main exactly when acquire lists its scope,
  // after production preflight. No callback or bypass is added to lease code.
  fs.writeFileSync(path.join(tools, 'git'), `#!/bin/sh
case " $* " in
  *" ls-tree -r -t -z --full-tree "*)
    if mkdir '${marker}' 2>/dev/null; then
      '${realGit}' -C '${f.repo}' -c core.hooksPath=/dev/null update-ref refs/heads/main '${next}' '${old}' || exit 90
    fi ;;
esac
exec '${realGit}' "$@"
`, { mode: 0o755 });
  const res = f.rawCli(['acquire'], f.repo, { PATH: `${tools}:${env.PATH}` });
  assert.ok(fs.existsSync(marker), res.stderr + res.stdout);
  assert.notEqual(res.status, 0); assert.match(res.stderr + res.stdout, /base-moved/);
  assert.equal(f.git(['rev-parse', 'main']), next);
  assert.throws(() => f.git(['show', `main:${DEFAULT_SIDECAR_PATH}`]));
  assert.equal(fs.existsSync(path.join(f.repo, DEFAULT_SIDECAR_PATH)), false);
  assert.equal(fs.existsSync(path.join(f.repo, DEFAULT_TOKEN_FILE)), false);
  assert.equal(f.git(['status', '--porcelain']), '');
});

// No earlier proof measures the ref-only hot path or import-failure isolation.
test('reference shell skips Node outside prepared main updates, including batched refs', t => {
  const f = fixture(t);
  const tools = path.join(f.temp, 'node-probe'); fs.mkdirSync(tools);
  const log = path.join(f.temp, 'node-invocations');
  fs.writeFileSync(path.join(tools, 'node'), `#!/bin/sh\nprintf 'spawn\\n' >> '${log}'\nexit 97\n`, { mode: 0o755 });
  const hook = path.join(f.host, '.githooks/reference-transaction');
  const run = (phase, input) => spawnSync(hook, [phase], { cwd: f.repo, env: { ...env, PATH: `${tools}:${env.PATH}` }, input, encoding: 'utf8' });
  const line = ref => `${'1'.repeat(40)} ${'2'.repeat(40)} ${ref}\n`;
  for (const phase of ['committed', 'aborted', 'preparing']) assert.equal(run(phase, line('refs/heads/main')).status, 0);
  for (const input of ['', line('HEAD'), line('refs/heads/main-extra') + line('refs/heads/other')]) assert.equal(run('prepared', input).status, 0);
  assert.equal(fs.existsSync(log), false);
  assert.equal(run('prepared', line('HEAD') + line('refs/heads/main') + line('refs/heads/other')).status, 97);
  assert.equal(fs.readFileSync(log, 'utf8'), 'spawn\n');

  // Break the real import path: only main updates depend on the Node policy.
  fs.unlinkSync(path.join(f.host, 'src/runner'));
  f.git(['checkout', '-qb', 'ordinary-branch']);
  f.put('existing.txt', 'branch edit'); f.git(['add', 'existing.txt']);
  assert.equal(f.commit(['--no-verify', '-m', 'ordinary branch']).status, 0);
  f.git(['checkout', '-q', 'main']);
  f.put('existing.txt', 'main edit'); f.git(['add', 'existing.txt']);
  const failed = f.commit(['--no-verify', '-m', 'main import failure']);
  assert.notEqual(failed.status, 0); assert.match(failed.stderr, /Cannot find module|ERR_MODULE_NOT_FOUND/);
});

test('no-lease branch five commits and five-commit rebase stay close to no-hook cost', t => {
  // Isolate reference-transaction cost: --no-verify omits the independent
  // pre-commit hook in both runs. Three paired timings reduce scheduler noise.
  const samples = { bare: [], hooked: [] };
  for (let trial = 0; trial < 3; trial++) {
    const f = fixture(t);
    for (const mode of trial % 2 ? ['hooked', 'bare'] : ['bare', 'hooked']) {
      f.git(['config', 'core.hooksPath', mode === 'bare' ? '/dev/null' : path.join(f.host, '.githooks')]);
      const start = performance.now();
      f.git(['checkout', '-qb', `${mode}-${trial}`, 'main']);
      for (let i = 0; i < 5; i++) {
        f.put('existing.txt', `${mode}-${trial}-${i}\n`); f.git(['add', 'existing.txt']);
        f.git(['commit', '--no-verify', '-qm', `branch edit ${i}`]);
      }
      f.git(['-c', 'core.editor=true', 'rebase', '--force-rebase', 'HEAD~5']);
      samples[mode].push(performance.now() - start);
      assert.equal(f.git(['rev-list', '--count', 'main..HEAD']), '5');
    }
  }
  const median = values => values.toSorted((a, b) => a - b)[1];
  const bare = median(samples.bare), hooked = median(samples.hooked);
  t.diagnostic(JSON.stringify({ bareMs: bare, hookedMs: hooked, samples }));
  assert.ok(hooked <= bare * 6 + 500, `ref-only hook overhead: ${hooked}ms versus ${bare}ms without hooks`);
});

// Prior successful transitions did not force a rejected production commit.
test('failed CLI transitions restore main sidecar bytes and remove only freshly written tokens', t => {
  const f = fixture(t); const holder = f.addWorktree('holder');
  const preCommit = path.join(f.host, '.githooks/pre-commit');
  const fail = () => fs.writeFileSync(preCommit, '#!/bin/sh\necho forced-commit-failure >&2\nexit 73\n', { mode: 0o755 });
  const enable = () => fs.copyFileSync(path.join(sourceRoot, '.githooks/pre-commit'), preCommit);
  const rejected = res => {
    assert.notEqual(res.status, 0);
    const error = JSON.parse(res.stderr.replace(/^fgos: /, '').trim());
    assert.equal(error.cause, 'commit-rejected');
    assert.equal(Buffer.from(error.stderr).toString('utf8'), 'forced-commit-failure\n');
  };
  const acquireFails = () => {
    const old = f.git(['rev-parse', 'main']);
    const res = f.rawCli(['acquire', '--worktree', holder]);
    rejected(res);
    assert.equal(f.git(['rev-parse', 'main']), old);
    assert.equal(fs.existsSync(path.join(holder, DEFAULT_TOKEN_FILE)), false);
    assert.equal(f.git(['status', '--porcelain']), '');
  };
  fail(); acquireFails();
  assert.equal(fs.existsSync(path.join(f.repo, DEFAULT_SIDECAR_PATH)), false);
  enable(); f.setupLease(holder);
  const heldBytes = fs.readFileSync(path.join(f.repo, DEFAULT_SIDECAR_PATH));
  const token = fs.readFileSync(path.join(holder, DEFAULT_TOKEN_FILE));
  f.put(DEFAULT_TOKEN_FILE, 'previous main token\n');
  fail();
  const res = f.rawCli(['release'], holder);
  rejected(res);
  assert.deepEqual(fs.readFileSync(path.join(f.repo, DEFAULT_SIDECAR_PATH)), heldBytes);
  assert.deepEqual(fs.readFileSync(path.join(holder, DEFAULT_TOKEN_FILE)), token);
  assert.equal(fs.readFileSync(path.join(f.repo, DEFAULT_TOKEN_FILE), 'utf8'), 'previous main token\n');
  assert.equal(f.git(['status', '--porcelain']), '');
  enable(); f.cli(['release'], holder);
  const releasedBytes = fs.readFileSync(path.join(f.repo, DEFAULT_SIDECAR_PATH));
  // Release restores pre-existing bytes; reacquire must report that stray copy
  // before writing another token or attempting its next transition.
  const releasedHead = f.git(['rev-parse', 'main']);
  const stray = f.rawCli(['acquire', '--worktree', holder]);
  assert.notEqual(stray.status, 0); assert.match(stray.stderr + stray.stdout, /token exists in main, but main is not the recorded holder checkout/);
  assert.equal(f.git(['rev-parse', 'main']), releasedHead);
  assert.equal(fs.readFileSync(path.join(f.repo, DEFAULT_TOKEN_FILE), 'utf8'), 'previous main token\n');
  fs.rmSync(path.join(f.repo, DEFAULT_TOKEN_FILE));
  fail(); acquireFails();
  assert.deepEqual(fs.readFileSync(path.join(f.repo, DEFAULT_SIDECAR_PATH)), releasedBytes);
  enable(); f.put(DEFAULT_SIDECAR_PATH, 'corrupt bytes without newline'); f.git(['add', DEFAULT_SIDECAR_PATH]);
  f.git(['-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'corrupt fixture']);
  fail();
  assert.notEqual(f.rawCli(['abandon', '--owner-confirmed', '--reason', 'repair']).status, 0);
  assert.equal(fs.readFileSync(path.join(f.repo, DEFAULT_SIDECAR_PATH), 'utf8'), 'corrupt bytes without newline');
  assert.equal(f.git(['status', '--porcelain']), '');
});

for (const operation of ['cherry-pick', 'rebase', 'am', 'pull']) {
  test(`reference guard refuses ${operation} of scoped changes onto main`, t => {
    const f = fixture(t);
    f.git(['checkout', '-qb', 'feature']);
    f.put('docs/feature.md', '# Feature\n'); f.git(['add', 'docs/feature.md']);
    f.git(['commit', '-q', '--no-verify', '-m', 'feature doc commit']);
    const featureSha = f.git(['rev-parse', 'HEAD']);
    const patch = operation === 'am' ? f.git(['format-patch', '-1', '--stdout', featureSha]) + '\n' : undefined;
    f.git(['checkout', '-q', 'main']); f.setupLease();
    const before = f.git(['rev-parse', 'main']);
    const args = operation === 'pull' ? ['pull', '--no-rebase', '--no-edit', '.', 'feature']
      : operation === 'am' ? ['am'] : [operation, featureSha];
    const result = spawnSync('git', args, { cwd: f.repo, env, encoding: 'utf8', input: patch, timeout: 30_000 });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /reference-transaction refused/);
    assert.equal(f.git(['rev-parse', 'main']), before);
  });
}
