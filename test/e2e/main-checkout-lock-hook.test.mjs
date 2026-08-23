import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// e2e -- exercises the real pre-commit hook (repo/.githooks/pre-commit) as a
// real git hook, via real `git commit` child-process invocations against a
// disposable temp repo. Never touches this real repo's own checkout or
// `.fgos/` -- every test builds its own mkdtemp git repo, its own hooks
// copy, and its own `.fgos/main-checkout.lock`.
//
// The hook (repo/.githooks/pre-commit) imports its two dependencies with
// paths relative to its OWN file location (`../src/runner/main-checkout-lock.mjs`
// and `../src/util/session-identity.mjs`), mirroring its production install
// layout. To keep this a faithful copy rather than a reimplementation, each
// test's temp repo gets a COPY of the real hook file plus COPIES of the same
// two real dependency files, nested the same way (`<repo>/.githooks/pre-commit`
// + `<repo>/src/runner/main-checkout-lock.mjs` +
// `<repo>/src/util/session-identity.mjs`) -- so the relative imports resolve
// exactly as they do in the real install.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_HOOK = path.resolve(__dirname, '../../.githooks/pre-commit');
const REAL_LOCK_MODULE = path.resolve(__dirname, '../../src/runner/main-checkout-lock.mjs');
const REAL_IDENTITY_MODULE = path.resolve(__dirname, '../../src/util/session-identity.mjs');
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initTempRepoWithHook() {
  const repoRoot = mkTempDir('fgos-main-checkout-hook-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });

  const hooksDir = path.join(repoRoot, '.githooks');
  const runnerDir = path.join(repoRoot, 'src', 'runner');
  const utilDir = path.join(repoRoot, 'src', 'util');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.mkdirSync(runnerDir, { recursive: true });
  fs.mkdirSync(utilDir, { recursive: true });
  fs.copyFileSync(REAL_HOOK, path.join(hooksDir, 'pre-commit'));
  fs.copyFileSync(REAL_LOCK_MODULE, path.join(runnerDir, 'main-checkout-lock.mjs'));
  fs.copyFileSync(REAL_IDENTITY_MODULE, path.join(utilDir, 'session-identity.mjs'));
  fs.chmodSync(path.join(hooksDir, 'pre-commit'), 0o755);
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: repoRoot });

  return repoRoot;
}

function initTempRepoWithDetachedWorktree() {
  const mainRoot = mkTempDir('fgos-main-checkout-hook-e2e-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
  fs.writeFileSync(path.join(mainRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: mainRoot });

  // A detached worktree off mainRoot -- this is the real deployment shape
  // (fgOS 'session start' and bee's --with-companion mount both use
  // 'git worktree add'). Its own '.git' is a FILE pointing at metadata
  // nested under mainRoot's '.git/worktrees/<name>', and git sets GIT_DIR
  // to that absolute path for any process spawned with cwd inside it --
  // exactly the environment shape that broke the old
  // 'git rev-parse --show-toplevel'-based resolution.
  const worktreeParent = mkTempDir('fgos-main-checkout-hook-e2e-worktree-parent-');
  const worktreeRoot = path.join(worktreeParent, 'worktree');
  execFileSync('git', ['worktree', 'add', '--detach', worktreeRoot], { cwd: mainRoot });

  const hooksDir = path.join(worktreeRoot, '.githooks');
  const runnerDir = path.join(worktreeRoot, 'src', 'runner');
  const utilDir = path.join(worktreeRoot, 'src', 'util');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.mkdirSync(runnerDir, { recursive: true });
  fs.mkdirSync(utilDir, { recursive: true });
  fs.copyFileSync(REAL_HOOK, path.join(hooksDir, 'pre-commit'));
  fs.copyFileSync(REAL_LOCK_MODULE, path.join(runnerDir, 'main-checkout-lock.mjs'));
  fs.copyFileSync(REAL_IDENTITY_MODULE, path.join(utilDir, 'session-identity.mjs'));
  fs.chmodSync(path.join(hooksDir, 'pre-commit'), 0o755);
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: worktreeRoot });

  return worktreeRoot;
}

// tsk-4hkd -- a repo checked out directly onto a fgw/<id> branch, simulating
// the exact mistake this hook's new guard exists to catch (checking out an
// item branch on the main checkout instead of claiming through `fgos pick`).

function initTempRepoWithHookOnBranch(branchName) {
  const repoRoot = initTempRepoWithHook();
  execFileSync('git', ['checkout', '-q', '-b', branchName], { cwd: repoRoot });
  return repoRoot;
}

// tsk-4hkd -- a real, non-detached linked worktree checked out onto a
// fgw/<id> branch: the LEGITIMATE shape (fgos pick's own worktree.mjs),
// which the new guard must never refuse.

function initTempRepoWithFgwWorktree(branchName) {
  const mainRoot = mkTempDir('fgos-main-checkout-hook-e2e-fgw-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
  fs.writeFileSync(path.join(mainRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: mainRoot });

  const worktreeParent = mkTempDir('fgos-main-checkout-hook-e2e-fgw-worktree-parent-');
  const worktreeRoot = path.join(worktreeParent, 'worktree');
  execFileSync('git', ['worktree', 'add', '-b', branchName, worktreeRoot], { cwd: mainRoot });

  const hooksDir = path.join(worktreeRoot, '.githooks');
  const runnerDir = path.join(worktreeRoot, 'src', 'runner');
  const utilDir = path.join(worktreeRoot, 'src', 'util');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.mkdirSync(runnerDir, { recursive: true });
  fs.mkdirSync(utilDir, { recursive: true });
  fs.copyFileSync(REAL_HOOK, path.join(hooksDir, 'pre-commit'));
  fs.copyFileSync(REAL_LOCK_MODULE, path.join(runnerDir, 'main-checkout-lock.mjs'));
  fs.copyFileSync(REAL_IDENTITY_MODULE, path.join(utilDir, 'session-identity.mjs'));
  fs.chmodSync(path.join(hooksDir, 'pre-commit'), 0o755);
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: worktreeRoot });

  return worktreeRoot;
}

let fileCounter = 0;

/** Stages a new, always-unique file and runs `git commit` as a child
 * process, under the given env overlay (simulating one "session"'s
 * identity + an optional lock ttl override). Returns the spawnSync result
 * (status/stdout/stderr) without throwing on a nonzero exit -- callers
 * assert on `status` themselves. */
function commitAsSession(repoRoot, envOverlay) {
  fileCounter += 1;
  const fileName = `change-${fileCounter}.txt`;
  fs.writeFileSync(path.join(repoRoot, fileName), `change ${fileCounter}\n`);
  execFileSync('git', ['add', fileName], { cwd: repoRoot });
  return spawnSync(
    'git',
    ['commit', '-q', '-m', `change ${fileCounter}`],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        FGOS_SESSION_ID: undefined,
        CLAUDE_CODE_SESSION_ID: undefined,
        ...envOverlay,
      },
    },
  );
}

function commitCount(repoRoot) {
  const out = execFileSync('git', ['log', '--oneline'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter(Boolean).length;
}

// --- truth 1: a solo commit with no existing lock succeeds silently -------

test('a solo git commit in a checkout with no existing lock succeeds', () => {
  const repoRoot = initTempRepoWithHook();
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-solo' });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(commitCount(repoRoot), before + 1);
});

// --- truth 2: the SAME session's second commit later still succeeds -------
// This is the exact case the prior pid:1-sentinel design got wrong (D6):
// self-recognition must let the caller's own identity always refresh,
// regardless of how much time passed since its last commit.

test("the same session's second commit a few minutes later still succeeds (self-recognition)", () => {
  const repoRoot = initTempRepoWithHook();
  const env = { FGOS_SESSION_ID: 'session-self', FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: '100' };

  const first = commitAsSession(repoRoot, env);
  assert.equal(first.status, 0, first.stderr);

  // Simulate "a few minutes later" by outliving the tiny ttl configured
  // above -- a DIFFERENT identity would now see this lock as stale, but
  // the SAME identity must self-recognize and refresh unconditionally.
  execFileSync('sleep', ['0.2']);

  const second = commitAsSession(repoRoot, env);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(commitCount(repoRoot), 3); // root + first + second
});

// --- truth 3: refused when a fresh lock exists under a different identity -

test('a git commit is refused when a fresh lock is held under a different identity (concurrent session)', () => {
  const repoRoot = initTempRepoWithHook();
  const holder = commitAsSession(repoRoot, {
    FGOS_SESSION_ID: 'session-holder',
    FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: String(15 * 60 * 1000),
  });
  assert.equal(holder.status, 0, holder.stderr);
  const before = commitCount(repoRoot);

  const rival = commitAsSession(repoRoot, {
    FGOS_SESSION_ID: 'session-rival',
    FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: String(15 * 60 * 1000),
  });

  assert.notEqual(rival.status, 0);
  assert.match(rival.stderr, /commit refused/);
  assert.equal(commitCount(repoRoot), before); // no new commit landed
});

// --- truth 4: succeeds once that different-identity lock is stale ---------

test('a git commit succeeds once a different-identity lock has gone stale (ttl expired)', () => {
  const repoRoot = initTempRepoWithHook();
  const holder = commitAsSession(repoRoot, {
    FGOS_SESSION_ID: 'session-holder',
    FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: '100',
  });
  assert.equal(holder.status, 0, holder.stderr);

  execFileSync('sleep', ['0.2']);
  const before = commitCount(repoRoot);

  const later = commitAsSession(repoRoot, {
    FGOS_SESSION_ID: 'session-later',
    FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: '100',
  });

  assert.equal(later.status, 0, later.stderr);
  assert.equal(commitCount(repoRoot), before + 1);
});

// --- truth 4b: the hook's own default TTL is short (HOOK_TTL_MS, tsk-1d9),
// not the long DEFAULT_TTL_MS shared with claim-port.mjs/merge.mjs --------

test('a git commit succeeds against a different-identity lock older than 20s but younger than 3 minutes, with NO env var override (proves the hook falls back to its own short default, not the old 180s one)', () => {
  const repoRoot = initTempRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(
    path.join(fgosDir, 'main-checkout.lock'),
    JSON.stringify({ pid: 'session-holder', ts: Date.now() - 25_000 }),
  );
  const before = commitCount(repoRoot);

  // No FGOS_MAIN_CHECKOUT_LOCK_TTL_MS here -- exercises resolveTtlMs()'s
  // real fallback. Under the old shared DEFAULT_TTL_MS (3 minutes) a 25s-old
  // lock would still read as HELD and this commit would be refused.
  const later = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-later' });

  assert.equal(later.status, 0, later.stderr);
  assert.equal(commitCount(repoRoot), before + 1);
});

// --- truth 5: refused when the lock file is corrupt/unparseable -----------

test('a git commit is refused when the lock file is corrupt, and the refusal never leaks a raw pid/session id', () => {
  const repoRoot = initTempRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'main-checkout.lock'), 'not-json-at-all{{{');
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-observer' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /fail-closed/);
  assert.equal(commitCount(repoRoot), before);
  // The refusal must explain the SITUATION, never print a raw pid or
  // session-id as if a human should recognize/act on it directly.
  assert.doesNotMatch(result.stderr, /session-observer/);
  assert.doesNotMatch(result.stderr, /\bpid\b/i);
});

// --- truth 5b: `fgos unlock` recovers exactly the corrupt-lock deadlock ----
// above (tsk-3h4) -- the one case truth 5 shows has zero automatic recovery
// otherwise, since the hook's own fail-closed refusal never touches the file.

test('fgos unlock clears a corrupt lock left behind by a refused commit, and the next commit then succeeds', () => {
  const repoRoot = initTempRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'main-checkout.lock'), 'not-json-at-all{{{');
  const before = commitCount(repoRoot);

  const refused = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-observer' });
  assert.notEqual(refused.status, 0);
  assert.equal(commitCount(repoRoot), before);

  const unlock = spawnSync(process.execPath, [FGOS, 'unlock'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(unlock.status, 0, unlock.stderr);
  assert.equal(JSON.parse(unlock.stdout).data.reason, 'reclaimed');
  assert.equal(fs.existsSync(path.join(fgosDir, 'main-checkout.lock')), false);

  const retried = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-observer' });
  assert.equal(retried.status, 0, retried.stderr);
  assert.equal(commitCount(repoRoot), before + 1);
});

// --- truth 6: real detached worktree resolves its OWN root, not __dirname -
// Regression coverage for the GIT_DIR-inheritance bug (str65 cell -9): a
// plain `git rev-parse --show-toplevel` run with cwd == the hooks dir
// inherits the worktree's GIT_DIR and incorrectly returns the hooks dir
// itself as "toplevel" instead of walking up to the real worktree root.

test('a commit inside a real detached git worktree writes the lock at the worktree\'s own .fgos, not under its hooks directory', () => {
  const worktreeRoot = initTempRepoWithDetachedWorktree();

  const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-worktree' });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    fs.existsSync(path.join(worktreeRoot, '.fgos', 'main-checkout.lock')),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(worktreeRoot, '.githooks', '.fgos')),
    false,
  );
});

// --- truth 7: the { id, source } identity shape still yields a usable token -
// resolveWriterIdentity now returns { id, source }; a hook that kept
// destructuring the old key would silently pass `undefined` into the lock,
// write a token-less record, read it back as AMBIGUOUS, and refuse every
// later commit. Asserting on the recorded token, not just the exit status,
// is what makes that failure mode visible here.

test('a commit still succeeds after the identity shape change, and the lock records a usable token', () => {
  const repoRoot = initTempRepoWithHook();
  const before = commitCount(repoRoot);

  const first = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-shape' });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(commitCount(repoRoot), before + 1);

  const lock = JSON.parse(
    fs.readFileSync(path.join(repoRoot, '.fgos', 'main-checkout.lock'), 'utf8'),
  );
  assert.equal(lock.pid, 'session-shape');

  // Same session again: self-recognition still refreshes its own lock, which
  // only works because the token above is the real identity, not undefined.
  const second = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-shape' });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(commitCount(repoRoot), before + 2);
});

// --- truth 8: main checkout on a fgw/* branch refuses commits (tsk-4hkd) --
// The mistake this guard exists to catch: checking out an item branch
// directly on the main checkout instead of claiming through `fgos pick`.

test('a git commit on the main checkout is refused when checked out to a fgw/* branch', () => {
  const repoRoot = initTempRepoWithHookOnBranch('fgw/tsk-example');
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-mistake' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /fgw\/tsk-example/);
  assert.equal(commitCount(repoRoot), before);
});

// --- truth 9: a linked worktree on a fgw/* branch is unaffected (tsk-4hkd) -
// The legitimate shape (fgos pick's own worktree.mjs) must never be refused
// by the new guard above -- only the MAIN checkout is disallowed a fgw/*
// branch, never a linked worktree, which is supposed to live on one.

test('a git commit inside a linked (non-detached) worktree on a fgw/* branch still succeeds', () => {
  const worktreeRoot = initTempRepoWithFgwWorktree('fgw/tsk-example');

  const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-worktree-fgw' });

  assert.equal(result.status, 0, result.stderr);
});

// --- truth 10: FGOS_MAIN_LOCK_HOLDER_PID (tsk-70l) -------------------------
// merge.mjs's root->main path (mergeRunnerItem's non-targetSlot branch) now
// acquires main-checkout.lock under a numeric process.pid identity instead
// of a session-id string, so two independent processes sharing an inherited
// session id can no longer wrongly self-recognize each other (a pid is
// unique per real OS process). That means the nested pre-commit hook can no
// longer self-recognize its parent via session-id equality either -- it
// reads FGOS_MAIN_LOCK_HOLDER_PID instead, scoped by merge.mjs to the one
// execFileSync call that spawns the commit, and uses that value AS ITS OWN
// identity for this one acquire, letting main-checkout-lock.mjs's existing,
// UNCHANGED self-recognition equality check match it. These three tests
// exercise the real hook process, not the identity-resolution function in
// isolation -- proving the env var is what decides the outcome, not the
// session id, which is deliberately never made to agree with the lock
// record in any of them.

function writeMainCheckoutLockRecord(repoRoot, pid, ts = Date.now()) {
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'main-checkout.lock'), JSON.stringify({ pid, ts }));
}

test('FGOS_MAIN_LOCK_HOLDER_PID lets the hook self-recognize a real live holder pid its own session id would never match', () => {
  const repoRoot = initTempRepoWithHook();
  // A real, live pid this test process can vouch for -- its own. Fresh
  // ttl, so absent the env var below this would read HELD under the
  // hook's normal numeric-liveness fallback (pidLive && withinTtl), not
  // merely AMBIGUOUS or already-stale -- a deterministic refusal, not a
  // coin flip, is what the next test proves that fallback still does.
  writeMainCheckoutLockRecord(repoRoot, process.pid);
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, {
    BEE_SESSION_ID: 'session-unrelated-to-the-lock-record',
    FGOS_MAIN_LOCK_HOLDER_PID: String(process.pid),
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(commitCount(repoRoot), before + 1);
});

test('the same live-pid lock record refuses the commit when FGOS_MAIN_LOCK_HOLDER_PID is absent -- the fallback path is untouched', () => {
  const repoRoot = initTempRepoWithHook();
  writeMainCheckoutLockRecord(repoRoot, process.pid);
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, {
    BEE_SESSION_ID: 'session-unrelated-to-the-lock-record',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.equal(commitCount(repoRoot), before);
});

test('a non-numeric FGOS_MAIN_LOCK_HOLDER_PID is never trusted blindly -- falls back to normal session-id resolution, same refusal as absent', () => {
  const repoRoot = initTempRepoWithHook();
  writeMainCheckoutLockRecord(repoRoot, process.pid);
  const before = commitCount(repoRoot);

  const result = commitAsSession(repoRoot, {
    BEE_SESSION_ID: 'session-unrelated-to-the-lock-record',
    FGOS_MAIN_LOCK_HOLDER_PID: 'not-a-pid',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.equal(commitCount(repoRoot), before);
});
