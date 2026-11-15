// fgos-disconnected-worktree-guard.test.mjs -- regression coverage for the
// dataDir()-level guard added in docs/history/agent-coordination-state-root
// (coord_state_root_rfc_20260909): a worktree made OUTSIDE fgOS's own
// lifecycle (a plain `git worktree add`, never `fgos pick`/`take`'s
// `createWorktree` (ADR0020-stripped) nor `fgos session start`
// (symlinked)) can carry a real, git-tracked, but frozen-at-branch-point
// `.fgos/` snapshot. Because that snapshot physically exists, the
// pre-existing `store require` ENOENT guard never fires, and a
// mutatesStore: true verb run there without `--dir` would silently
// read/write that disconnected snapshot instead of the live main store.
//
// The admission rule itself (which calls from which checkout are admitted or
// refused, and why) is owned by the tests of
// `packages/git/rust/src/store_admission.rs`; which invocation of which verb
// mutates the store is owned by `test/rust-host/fixtures/store-declaration-vectors.json`
// (read by `test/cli/fgos-manifest.test.mjs` and `apps/fgos/src/routing.rs`).
// This file keeps the wiring through the real CLI: one refusal from a linked
// worktree carrying a frozen `.fgos/` copy, one explicit `--dir` that bypasses
// it, one genuine `fgos session start` worktree that is admitted, and the
// invocation-root cases below.

import '../helpers/process-tmp-root.mjs';
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
import { activateGitFixture } from '../helpers/git-fixture.mjs';

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
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/cache/\n.fgos/runtime/\n.fgos/logs/\n.fgos/locks/\n.fgos/*.lock\n.fgos/sessions.json\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed with committed .fgos'], { cwd });
  activateGitFixture(cwd);
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

// --- Refusal from a linked worktree with a real disconnected .fgos/ ----

test('disconnected-worktree guard: refuses a mutatesStore: true verb from an ad-hoc worktree carrying a real disconnected .fgos copy', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-branch');
  try {
    // sanity: this is genuinely the bug shape, not the already-handled
    // ADR0020-stripped ENOENT case.
    assert.ok(fs.existsSync(path.join(wt, '.fgos', 'coexistence.json')), 'ad-hoc worktree really carries a checked-out .fgos copy');
    assert.equal(fs.lstatSync(path.join(wt, '.fgos')).isSymbolicLink(), false, 'not a session symlink either');

    const result = run(wt, ['submit', 'a task from a disconnected worktree', '--async']);
    assert.equal(result.status, 4, result.stderr); // EXIT_CODES.validation
    assert.match(result.stderr, /disconnected snapshot/);
    assert.match(result.stderr, /--dir/);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

// --- Explicit --dir bypasses the guard -----------------------------------

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

// --- A genuine session worktree is admitted ------------------------------

test('disconnected-worktree guard: a mutatesStore: true verb succeeds from a genuine "fgos session start" worktree', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const sess = createSession(main, { sessionId: 'guard-test-session' });
  try {
    const result = run(sess.worktreePath, ['submit', 'a task from a session worktree', '--async']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    endSession(main, sess.sessionId, { force: true });
  }
});

// --- Invocation root: a subdirectory of the project acts on the project --

test('invocation root: list from a subdirectory reads the real store, and no store appears under the subdirectory', () => {
  const cwd = initGitCwdMainWithCommittedFgos();
  assert.equal(run(cwd, ['submit', 'a task seen from docs', '--async']).status, 0);
  const docs = path.join(cwd, 'docs');
  fs.mkdirSync(docs);
  const result = run(docs, ['list', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /a task seen from docs/);
  assert.equal(fs.existsSync(path.join(docs, '.fgos')), false, 'no phantom store under the subdirectory');
});

test('invocation root: init from a subdirectory of a repository is refused naming the top level, creating nothing', () => {
  const cwd = initGitCwdMainWithCommittedFgos();
  const docs = path.join(cwd, 'docs');
  fs.mkdirSync(docs);
  const result = run(docs, ['init']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /top level/);
  assert.match(result.stderr, new RegExp(fs.realpathSync(cwd).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(fs.existsSync(path.join(docs, '.fgos')), false);
});

test('invocation root: main-checkout-reset --dir naming another repository is refused before anything is read', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const other = initGitCwdMainWithCommittedFgos();
  const result = run(main, ['main-checkout-reset', '--sha', 'HEAD', '--dir', other]);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /not the main checkout/);
});
