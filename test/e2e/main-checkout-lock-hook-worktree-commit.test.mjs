import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireMainCheckoutLock, releaseMainCheckoutLock } from '../../src/runner/main-checkout-lock.mjs';

// tsk-sir -- reproduces the bug this item was filed against: a real linked
// worktree's `git commit` gets refused by the SAME main-checkout.lock a
// live session holds, even though the worktree writes to its own separate
// index/branch and never touches the main checkout at all.
//
// Deliberately does NOT reuse this directory's sibling
// main-checkout-lock-hook.test.mjs's own worktree fixture
// (initTempRepoWithFgwWorktree): that helper configures core.hooksPath
// separately per-root (relative to whichever cwd it's invoked with), so
// main and its worktree each end up with their OWN copy of the hook file
// and their OWN separate lock -- never actually sharing one, which is not
// how a real fgOS checkout is configured (`fgos setup` wires
// core.hooksPath exactly once, and `fgos pick`'s worktree creation never
// touches it again -- see src/runner/worktree.mjs). This fixture instead
// wires hooksPath ONCE, on the main root, as an ABSOLUTE path -- mirroring
// what this real repo's own checkout was actually observed to have
// (tsk-sir CONTEXT.md D7) -- so the worktree inherits the exact same
// shared config and both root and worktree commits resolve to the SAME
// physical hook file and the SAME main-checkout.lock, faithfully
// reproducing the real hazard.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_HOOK = path.resolve(__dirname, '../../.githooks/pre-commit');
const REAL_LOCK_MODULE = path.resolve(__dirname, '../../src/runner/main-checkout-lock.mjs');
const REAL_IDENTITY_MODULE = path.resolve(__dirname, '../../src/util/session-identity.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Builds a main checkout + a linked worktree that share ONE hook file via
 * an absolute core.hooksPath (see file header for why this, not the
 * sibling test's per-root fixture). Returns { mainRoot, worktreeRoot }. */
function initSharedAbsoluteHooksPathFixture() {
  const mainRoot = mkTempDir('fgos-tsk-sir-repro-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
  fs.writeFileSync(path.join(mainRoot, 'seed.txt'), 'seed\n');
  // tsk-56u: a tracked .fgos/ file, part of this SAME root commit -- before
  // core.hooksPath is ever configured below, so this commit never triggers
  // the real hook (which would otherwise write a real main-checkout.lock
  // mid-setup and pollute the lock-state assertions other tests in this
  // file make against a freshly created fixture). Mirrors this real repo's
  // own shape (`.fgos/` is git-tracked here, ADR0020) so `git worktree add`
  // below checks it out into the worktree the same way it would for real,
  // before ADR0020's own fs.rmSync strip ever runs.
  fs.mkdirSync(path.join(mainRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(mainRoot, '.fgos', 'state.json'), '{}\n');
  execFileSync('git', ['add', 'seed.txt', '.fgos/state.json'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: mainRoot });

  const hooksDir = path.join(mainRoot, '.githooks');
  const runnerDir = path.join(mainRoot, 'src', 'runner');
  const utilDir = path.join(mainRoot, 'src', 'util');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.mkdirSync(runnerDir, { recursive: true });
  fs.mkdirSync(utilDir, { recursive: true });
  fs.copyFileSync(REAL_HOOK, path.join(hooksDir, 'pre-commit'));
  fs.copyFileSync(REAL_LOCK_MODULE, path.join(runnerDir, 'main-checkout-lock.mjs'));
  fs.copyFileSync(REAL_IDENTITY_MODULE, path.join(utilDir, 'session-identity.mjs'));
  fs.chmodSync(path.join(hooksDir, 'pre-commit'), 0o755);
  // Absolute, not relative -- this is the load-bearing difference from
  // installGitHooks's own '.githooks' write (see file header).
  execFileSync('git', ['config', 'core.hooksPath', hooksDir], { cwd: mainRoot });

  const worktreeParent = mkTempDir('fgos-tsk-sir-repro-worktree-parent-');
  const worktreeRoot = path.join(worktreeParent, 'worktree');
  execFileSync('git', ['worktree', 'add', '-b', 'fgw/tsk-sir-repro', worktreeRoot], { cwd: mainRoot });

  return { mainRoot, worktreeRoot };
}

function commitAsSession(repoRoot, envOverlay) {
  const fileName = `change-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  fs.writeFileSync(path.join(repoRoot, fileName), `change\n`);
  execFileSync('git', ['add', fileName], { cwd: repoRoot });
  return spawnSync(
    'git',
    ['commit', '-q', '-m', `change`],
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

// --- reproduces the bug (fails today, before any fix) ------------------
//
// A live session (identity 'other-live-session') holds the main-checkout
// lock -- exactly the real-world case this item was filed against (another
// session actively working). A commit in the LINKED WORKTREE, which never
// touches the main checkout's own index/branch, should succeed regardless.
// Today it does not: it is refused by the same lock, because the hook has
// no worktree-vs-main distinction on its lock-acquire guard (tsk-sir D2).

test('tsk-sir: a worktree commit is wrongly refused while another session holds the main-checkout lock', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();
  const fgosDir = path.join(mainRoot, '.fgos');

  const lockResult = acquireMainCheckoutLock(fgosDir, { identity: 'other-live-session', ttlMs: 60_000 });
  assert.equal(lockResult.status, 'acquired', 'setup: the lock must actually be held for this repro to be meaningful');

  try {
    const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-in-worktree' });
    assert.equal(
      result.status,
      0,
      `a worktree commit must not be blocked by another session's main-checkout lock ` +
      `(tsk-sir) -- got refused: ${result.stderr}`,
    );
  } finally {
    releaseMainCheckoutLock(fgosDir);
  }
});

// --- tsk-1d7: stale-worktree-index guard -----------------------------
//
// Reproduces the real hazard tsk-2u5/tsk-1d7 were filed against (commit
// 2cb6519e): an external process force-moves the worktree's own `fgw/*`
// branch ref (mirroring `approve`'s leaf->root merge -- a detached
// ephemeral worktree, then `git branch -f`) without ever touching this
// worktree's own files/index. A subsequent commit from the stale worktree
// must now be REFUSED by the new guard, never silently allowed through.

function forceMoveBranchForward(mainRoot, branch) {
  const mergeDir = mkTempDir('fgos-tsk-1d7-force-move-');
  execFileSync('git', ['worktree', 'add', '--detach', mergeDir, branch], { cwd: mainRoot });
  const fileName = `external-${Date.now()}.txt`;
  fs.writeFileSync(path.join(mergeDir, fileName), 'external change\n');
  execFileSync('git', ['add', fileName], { cwd: mergeDir });
  execFileSync('git', ['commit', '-q', '-m', 'external change landed via force-move'], { cwd: mergeDir });
  const newTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: mergeDir, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, newTip], { cwd: mainRoot });
  execFileSync('git', ['worktree', 'remove', '--force', mergeDir], { cwd: mainRoot });
  return newTip;
}

test('tsk-1d7: a commit from a worktree whose branch was force-moved forward (ancestor, but behind) is refused, naming fgos resync-worktree', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  // Establish a real lastSynced inside the worktree (its own HEAD reflog
  // gains an entry) before the external force-move happens.
  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  forceMoveBranchForward(mainRoot, 'fgw/tsk-sir-repro');

  const result = commitAsSession(worktreeRoot, {});
  assert.notEqual(result.status, 0, 'a commit against a stale index must be refused, never silently allowed through');
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /fgos resync-worktree/, 'the refusal must name the real repair command');
});

test('tsk-1d7: a worktree whose branch tip has NOT moved since last sync still commits normally (no-op, no false positive)', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  // No external force-move here -- a second, ordinary commit from the same
  // worktree, still in sync with its own branch, must be unaffected.
  const second = commitAsSession(worktreeRoot, {});
  assert.equal(second.status, 0, `an in-sync worktree's ordinary next commit must not be refused -- got: ${second.stderr}`);
});

test('tsk-1d7: a commit from a worktree whose branch was rewritten backward (not an ancestor) is refused as diverged', () => {
  const { mainRoot, worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  // Rewrite the branch back to BEFORE the worktree's own lastSynced commit
  // -- lastSynced is now a descendant, not an ancestor, of the new tip.
  const rootCommit = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: mainRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', 'fgw/tsk-sir-repro', rootCommit], { cwd: mainRoot });

  const result = commitAsSession(worktreeRoot, {});
  assert.notEqual(result.status, 0, 'a commit against a diverged (rewritten) branch must be refused');
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /not an ancestor/);
});

// --- tsk-2cl: unreadable branch tip must fail closed, not fail open ------
//
// The precondition (`symbolic-ref` already succeeded, reflog already
// succeeded, but `git rev-parse <branch>` fails moments later) is
// genuinely a transient race in real git -- confirmed empirically that
// any STATIC on-disk corruption of the branch ref breaks `reflog show
// HEAD` identically to `rev-parse` (both need to resolve HEAD's current
// target), so a real ref-level corruption can never isolate "reflog ok,
// rev-parse not ok" the way a true concurrent race could. Reproduced here
// instead with a fake `git` wrapper placed first on PATH: every command
// proxies straight through to the real git binary except `rev-parse
// <this-branch>`, which is made to fail on purpose -- deterministic,
// no real ref corruption, and it still exercises the guard's actual catch
// branch and the real hook subprocess end to end.

// git ALWAYS prepends its own `--exec-path` (`/usr/lib/git-core`, which
// contains the real `git` binary itself) onto PATH before spawning a hook
// subprocess -- a deliberate git behavior, not a bug -- so a plain
// PATH-prepend trick can never shadow `git` for a hook's own subsequent
// `execFileSync('git', ...)` calls (confirmed empirically: the injected
// dir landed AFTER /usr/lib/git-core in the hook's own observed PATH).
// Mirror the real exec-path via symlinks into a fake dir, override only
// the top-level `git` entry, then point `GIT_EXEC_PATH` (which git
// prepends verbatim) at that fake dir instead -- every other git-core
// helper binary (git-upload-pack, etc.) still resolves normally via the
// symlinks, only the plain `git` lookup is redirected.
function makeFakeGitFailingRevParseFor(branch) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fake-git-'));
  const realExecPath = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
  const realGit = path.join(realExecPath, 'git');
  for (const name of fs.readdirSync(realExecPath)) {
    if (name === 'git') continue;
    fs.symlinkSync(path.join(realExecPath, name), path.join(dir, name));
  }
  const script = [
    '#!/bin/sh',
    `if [ "$1" = "rev-parse" ] && [ "$2" = "${branch}" ]; then`,
    '  echo "fatal: simulated transient ref-read race" >&2',
    '  exit 128',
    'fi',
    `exec "${realGit}" "$@"`,
    '',
  ].join('\n');
  const scriptPath = path.join(dir, 'git');
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, 0o755);
  return dir;
}

test('tsk-2cl: a commit whose branch tip becomes unreadable (rev-parse fails) is refused, not silently allowed through', () => {
  const { worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  // Establish a real lastSynced reflog entry first, same precondition
  // every sibling tsk-1d7 test uses -- otherwise the reflog-unreadable
  // branch (checked first) would fire instead of the one under test here.
  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  const fakeGitDir = makeFakeGitFailingRevParseFor('fgw/tsk-sir-repro');
  try {
    const result = commitAsSession(worktreeRoot, { PATH: `${fakeGitDir}:${process.env.PATH}`, GIT_EXEC_PATH: fakeGitDir });
    assert.notEqual(result.status, 0, 'a commit whose branch tip cannot be read must be refused, never silently allowed through');
    assert.match(result.stderr, /commit refused/);
    assert.match(result.stderr, /unreadable branch ref/);
  } finally {
    fs.rmSync(fakeGitDir, { recursive: true, force: true });
  }
});

test('tsk-2cl: a normal commit is unaffected when rev-parse succeeds (regression guard on the fake-git harness itself)', () => {
  const { worktreeRoot } = initSharedAbsoluteHooksPathFixture();
  const first = commitAsSession(worktreeRoot, {});
  assert.equal(first.status, 0, `setup: first worktree commit must succeed -- got: ${first.stderr}`);

  // Same fake-git harness, but targeting a branch name that does NOT
  // match this worktree's real branch -- proves the harness only trips
  // the intended target, not every commit.
  const fakeGitDir = makeFakeGitFailingRevParseFor('fgw/some-other-branch');
  try {
    const result = commitAsSession(worktreeRoot, { PATH: `${fakeGitDir}:${process.env.PATH}`, GIT_EXEC_PATH: fakeGitDir });
    assert.equal(result.status, 0, `an unrelated fake-git target must never affect this commit -- got: ${result.stderr}`);
  } finally {
    fs.rmSync(fakeGitDir, { recursive: true, force: true });
  }
});

// --- tsk-56u: staged-.fgos/-deletion guard --------------------------------
//
// The real near-miss this guard exists to catch: a linked worktree never
// keeps a working-tree copy of `.fgos/` (ADR0020's own fs.rmSync strip,
// `src/runner/worktree.mjs`'s `createWorktree`), so a bare `git add -A`
// there stages every `.fgos/` file as deleted. This guard must fire
// UNCONDITIONALLY -- in the worktree (the "away from home" case
// hookRunsAtHome would otherwise skip every other guard for) AND in the
// main checkout -- while a normal, `.fgos/`-untouched commit stays
// unaffected in either.

test('tsk-56u: a worktree commit staging a .fgos/ deletion (git add -A after the ADR0020 strip) is refused', () => {
  const { worktreeRoot } = initSharedAbsoluteHooksPathFixture();
  const fgosFile = path.join(worktreeRoot, '.fgos', 'state.json');
  assert.equal(fs.existsSync(fgosFile), true, 'setup: .fgos/state.json must be tracked and checked out into the worktree');

  // ADR0020's own strip, reproduced by hand (createWorktree isn't invoked
  // by this fixture -- it uses a plain `git worktree add`).
  fs.rmSync(path.join(worktreeRoot, '.fgos'), { recursive: true, force: true });
  execFileSync('git', ['add', '-A'], { cwd: worktreeRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'oops: git add -A in a worktree'], { cwd: worktreeRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /\.fgos\//);
});

test('tsk-56u: the same staged .fgos/ deletion is refused in the main checkout too, not gated by hookRunsAtHome', () => {
  const { mainRoot } = initSharedAbsoluteHooksPathFixture();

  fs.rmSync(path.join(mainRoot, '.fgos'), { recursive: true, force: true });
  execFileSync('git', ['add', '-A'], { cwd: mainRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'oops: manual .fgos removal on main'], { cwd: mainRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
});

test('tsk-56u: a normal commit that never touches .fgos/ still succeeds in the worktree', () => {
  const { worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-unrelated-change' });

  assert.equal(result.status, 0, result.stderr);
});

test('tsk-56u: a legitimate .fgos/ addition/modification (never a deletion) is unaffected -- the guard filters --diff-filter=D only', () => {
  const { mainRoot } = initSharedAbsoluteHooksPathFixture();

  // What fgOS's own state-writing verbs do: add/modify .fgos/ content
  // directly, never delete it. The guard must never fire here.
  fs.writeFileSync(path.join(mainRoot, '.fgos', 'state.json'), '{"changed":true}\n');
  fs.writeFileSync(path.join(mainRoot, '.fgos', 'new-file.json'), '{}\n');
  execFileSync('git', ['add', '.fgos/state.json', '.fgos/new-file.json'], { cwd: mainRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'fgos: legitimate .fgos/ write'], { cwd: mainRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
});

// --- tsk-5pb: staged .fgos/* change guard on worker branches --------------

test('tsk-5pb: a worktree commit staging a .fgos/ modification on a worker branch is refused', () => {
  const { worktreeRoot } = initSharedAbsoluteHooksPathFixture();
  fs.writeFileSync(path.join(worktreeRoot, '.fgos', 'state.json'), '{"modified":true}\n');
  execFileSync('git', ['add', '.fgos/state.json'], { cwd: worktreeRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'oops: modified .fgos file on worker branch'], { cwd: worktreeRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /\.fgos\//);
});

test('tsk-5pb: the same staged .fgos/ modification is allowed on main (not a fgw/* branch)', () => {
  const { mainRoot } = initSharedAbsoluteHooksPathFixture();

  fs.writeFileSync(path.join(mainRoot, '.fgos', 'state.json'), '{"modified":true}\n');
  execFileSync('git', ['add', '.fgos/state.json'], { cwd: mainRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'legitimate main checkout .fgos write'], { cwd: mainRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
});

test('tsk-5pb: a normal commit that never touches .fgos/ succeeds on a worker branch', () => {
  const { worktreeRoot } = initSharedAbsoluteHooksPathFixture();

  const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-normal-worker-commit' });

  assert.equal(result.status, 0, result.stderr);
});

// --- tsk-1i3: content-precedence line-count guard on main ------------------

test('tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with fewer lines than HEAD is refused', () => {
  const { mainRoot } = initSharedAbsoluteHooksPathFixture();
  const jsonlPath = path.join(mainRoot, '.fgos', 'events.jsonl');
  fs.writeFileSync(jsonlPath, 'line1\nline2\nline3\nline4\nline5\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'add multi-line events.jsonl'], { cwd: mainRoot });

  fs.writeFileSync(jsonlPath, 'line1\nline2\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: mainRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'regressed events.jsonl commit'], { cwd: mainRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0, 'commit staging regressed line count on main must be refused');
  assert.match(result.stderr, /commit refused/);
  assert.match(result.stderr, /\.fgos\/events\.jsonl/);
  assert.match(result.stderr, /main is left unchanged/i);
  assert.match(result.stderr, /fix-fgos-write-rejected-merge-block\.md/);
});

test('tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with equal-or-more lines succeeds', () => {
  const { mainRoot } = initSharedAbsoluteHooksPathFixture();
  const jsonlPath = path.join(mainRoot, '.fgos', 'events.jsonl');
  fs.writeFileSync(jsonlPath, 'line1\nline2\nline3\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'add multi-line events.jsonl'], { cwd: mainRoot });

  fs.writeFileSync(jsonlPath, 'line1\nline2\nline3\nline4\nline5\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: mainRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'appended events.jsonl commit'], { cwd: mainRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, `commit with more lines must succeed -- got: ${result.stderr}`);
});

test('tsk-1i3: a brand-new .fgos/* file addition is not refused', () => {
  const { mainRoot } = initSharedAbsoluteHooksPathFixture();
  const newFilePath = path.join(mainRoot, '.fgos', 'brand-new-log.jsonl');
  fs.writeFileSync(newFilePath, 'line1\nline2\n');
  execFileSync('git', ['add', '.fgos/brand-new-log.jsonl'], { cwd: mainRoot });

  const result = spawnSync('git', ['commit', '-q', '-m', 'add brand new log file'], { cwd: mainRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, `brand-new file addition must succeed -- got: ${result.stderr}`);
});

