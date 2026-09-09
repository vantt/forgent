// fgos-disconnected-worktree-guard.test.mjs -- regression coverage for the
// dataDir()-level guard added in docs/history/agent-coordination-state-root
// (coord_state_root_rfc_20260909): a worktree made OUTSIDE fgOS's own
// lifecycle (a plain `git worktree add`, never `fgos pick`/`take`'s
// `createWorktree` (ADR0020-stripped) nor `fgos session start`
// (symlinked)) can carry a real, git-tracked, but frozen-at-branch-point
// `.fgos/` snapshot. Because that snapshot physically exists, the
// pre-existing `requiresExistingStore` ENOENT guard never fires, and a
// MUTATING_ONLY_VERBS verb run there without `--dir` would silently
// read/write that disconnected snapshot instead of the live main store.
//
// Five scenarios, matching this investigation's own acceptance criteria:
// main checkout (unaffected), a linked worktree with a real disconnected
// `.fgos/` (refused), explicit `--dir` (bypasses the guard, writes land in
// the real store), the legitimate pick/return/approve cycle (unaffected --
// proven by the existing fgos-claim*/fgos-approve*/fgos-post-merge*
// suites staying green, not duplicated here), and a genuine `fgos session
// start` worktree (unaffected -- `isSessionWorktree` admits it).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  execFileSync,
  fs,
  os,
  path,
  run,
  tmpCwd,
  eventLines,
  createSession,
  endSession,
} from './helpers/fgos-cli-harness.mjs';

// A real main checkout whose `.fgos/` is committed into HEAD -- mirrors this
// product repo's own convention (`.fgos/events.jsonl` and friends are
// git-tracked, not gitignored), the exact precondition that makes a plain
// `git worktree add` check out a real (not symlinked, not stripped) `.fgos/`
// copy into the new worktree.
function initGitCwdMainWithCommittedFgos() {
  const cwd = tmpCwd(); // bootstraps .fgos/ via a real `fgos init`
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/cache/\n.fgos/runtime/\n.fgos/logs/\n.fgos/*.lock\n.fgos/sessions.json\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed with committed .fgos'], { cwd });
  return cwd;
}

// A plain `git worktree add` -- never through `createWorktree`/`createSession`
// -- the exact shape an external harness's own worktree tool produces (this
// investigation's own root-cause finding).
function addDisconnectedAdHocWorktree(cwd, branch) {
  const worktreePath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-disconnected-wt-'));
  fs.rmdirSync(worktreePath); // git worktree add requires the path not exist yet
  execFileSync('git', ['worktree', 'add', '-b', branch, worktreePath, 'HEAD'], { cwd });
  return worktreePath;
}

// --- Scenario 1: main checkout -----------------------------------------

test('disconnected-worktree guard: a MUTATING_ONLY_VERBS verb succeeds normally from the real main checkout', () => {
  const cwd = initGitCwdMainWithCommittedFgos();
  const result = run(cwd, ['submit', 'a task from main', '--async']);
  assert.equal(result.status, 0, result.stderr);
});

// --- Scenario 2: linked worktree with a real disconnected .fgos/ -------

test('disconnected-worktree guard: refuses a MUTATING_ONLY_VERBS verb from an ad-hoc worktree carrying a real disconnected .fgos copy', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-branch');
  try {
    // sanity: this is genuinely the bug shape, not the already-handled
    // ADR0020-stripped ENOENT case.
    assert.ok(fs.existsSync(path.join(wt, '.fgos', 'events.jsonl')), 'ad-hoc worktree really carries a checked-out .fgos copy');
    assert.equal(fs.lstatSync(path.join(wt, '.fgos')).isSymbolicLink(), false, 'not a session symlink either');

    const result = run(wt, ['submit', 'a task from a disconnected worktree', '--async']);
    assert.equal(result.status, 4, result.stderr); // EXIT_CODES.validation
    assert.match(result.stderr, /disconnected snapshot/);
    assert.match(result.stderr, /--dir/);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: a non-MUTATING_ONLY_VERBS verb (list) is unaffected by the guard from the same disconnected worktree', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-branch-read');
  try {
    const result = run(wt, ['list']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

// --- Scenario 3: explicit --dir bypasses the guard ----------------------

test('disconnected-worktree guard: --dir <mainRoot> bypasses the guard and the event lands in the real main store, not the worktree copy', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-branch-dir');
  try {
    const before = eventLines(main).length;
    const result = run(wt, ['submit', 'a task via --dir', '--async', '--dir', main]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(eventLines(main).length > before, 'the event landed in the real main store via --dir');
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

// --- Scenario 4: pick/return/approve -- see file header. No new test here;
// the existing fgos-claim*.test.mjs / fgos-approve*.test.mjs /
// fgos-post-merge*.test.mjs suites already drive the real pick -> work ->
// return -> approve cycle end to end through `createWorktree` (ADR0020-
// stripped) and are run unchanged as this change's own regression proof.

// --- Scenario 5: concurrent/session invocation --------------------------

test('disconnected-worktree guard: a MUTATING_ONLY_VERBS verb succeeds from a genuine "fgos session start" worktree', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const sess = createSession(main, { sessionId: 'guard-test-session' });
  try {
    const result = run(sess.worktreePath, ['submit', 'a task from a session worktree', '--async']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    endSession(main, sess.sessionId, { force: true });
  }
});
