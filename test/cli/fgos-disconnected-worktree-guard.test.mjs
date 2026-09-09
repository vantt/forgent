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

// --- `return` explicitly, since the master prompt's own acceptance
// criteria name it by verb ("pick/return/approve") -- deliberately NOT
// added to MUTATING_ONLY_VERBS (see that set's own doc comment): its case
// block already has its own, more permissive, already-tested worktree
// guard (registered-session-aware, ~line 3862) predating this guard
// entirely. This test only pins that this guard's own message never fires
// for "return" -- return's pre-existing behavior is covered by
// test/cli/fgos-return.test.mjs, not duplicated here. ---------------------

test('disconnected-worktree guard: "return" is unaffected by this guard (it already has its own worktree check)', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-return');
  try {
    const result = run(wt, ['return', 'tsk-doesnotmatter']);
    assert.notEqual(result.status, 0, result.stderr); // still refused -- by return's OWN guard
    assert.doesNotMatch(result.stderr, /disconnected snapshot/, "this guard's own message must never fire for return");
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

// --- MUTATING_SUBCOMMAND_PREDICATES: per-invocation classification ------
// Refusal happens BEFORE the verb's own handler runs (this guard sits ahead
// of `runVerb` in main()), so the mutating-subcommand cases below are safe
// and cheap to exercise for real even for verbs whose real handler would
// otherwise have side effects (spawn a process, open a session) -- the
// handler is never reached. The read-subcommand cases run to real
// completion, since they are expected to succeed unaffected.

test('disconnected-worktree guard: "session start"/"session end"/"session gc" are refused, "session list" is unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-session');
  try {
    for (const sub of ['start', 'end', 'gc']) {
      const args = sub === 'end' ? ['session', 'end', 'some-session-id'] : ['session', sub];
      const result = run(wt, args);
      assert.equal(result.status, 4, `session ${sub}: ${result.stderr}`);
      assert.match(result.stderr, /disconnected snapshot/);
    }
    const listResult = run(wt, ['session', 'list']);
    assert.equal(listResult.status, 0, listResult.stderr);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: "goal set" is refused, "goal show" is unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-goal');
  try {
    const setResult = run(wt, ['goal', 'set', 'tsk-doesnotmatter']);
    assert.equal(setResult.status, 4, setResult.stderr);
    assert.match(setResult.stderr, /disconnected snapshot/);

    const showResult = run(wt, ['goal', 'show']);
    assert.equal(showResult.status, 0, showResult.stderr);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: "gateway start"/"gateway stop" are refused, "gateway status" is unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-gateway');
  try {
    for (const sub of ['start', 'stop']) {
      const result = run(wt, ['gateway', sub]);
      assert.equal(result.status, 4, `gateway ${sub}: ${result.stderr}`);
      assert.match(result.stderr, /disconnected snapshot/);
    }
    const statusResult = run(wt, ['gateway', 'status']);
    assert.equal(statusResult.status, 0, statusResult.stderr);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: "knowledge attest" is refused, "knowledge status" is unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-knowledge');
  try {
    const attestResult = run(wt, ['knowledge', 'attest']);
    assert.equal(attestResult.status, 4, attestResult.stderr);
    assert.match(attestResult.stderr, /disconnected snapshot/);

    const statusResult = run(wt, ['knowledge', 'status']);
    assert.equal(statusResult.status, 0, statusResult.stderr);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: "coordination run"/"coordination launch-master-loop" are refused, "coordination show"/"coordination chain" are unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-coordination');
  try {
    const runResult = run(wt, ['coordination', 'run', '--file', 'does-not-matter.json']);
    assert.equal(runResult.status, 4, runResult.stderr);
    assert.match(runResult.stderr, /disconnected snapshot/);

    const launchResult = run(wt, ['coordination', 'launch-master-loop', '--plan', 'x', '--objective', 'x', '--writer-id', 'x']);
    assert.equal(launchResult.status, 4, launchResult.stderr);
    assert.match(launchResult.stderr, /disconnected snapshot/);

    // show/chain reach their real (read-only) handlers, which then fail for
    // an ORDINARY reason (unknown id/track) -- never this guard's message.
    const showResult = run(wt, ['coordination', 'show', 'coord_does_not_exist']);
    assert.doesNotMatch(showResult.stderr, /disconnected snapshot/);
    const chainResult = run(wt, ['coordination', 'chain', 'track-does-not-exist']);
    assert.doesNotMatch(chainResult.stderr, /disconnected snapshot/);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: "merge next" is refused, "merge list" is unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-merge');
  try {
    const nextResult = run(wt, ['merge', 'next']);
    assert.equal(nextResult.status, 4, nextResult.stderr);
    assert.match(nextResult.stderr, /disconnected snapshot/);

    const listResult = run(wt, ['merge', 'list']);
    assert.equal(listResult.status, 0, listResult.stderr);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

test('disconnected-worktree guard: "evolve --submit" is refused, bare "evolve" and "evolve --pick" are unaffected', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-evolve');
  try {
    const submitResult = run(wt, ['evolve', '--submit', 'tsk-doesnotmatter']);
    assert.equal(submitResult.status, 4, submitResult.stderr);
    assert.match(submitResult.stderr, /disconnected snapshot/);

    const bareResult = run(wt, ['evolve']);
    assert.equal(bareResult.status, 0, bareResult.stderr);

    const pickResult = run(wt, ['evolve', '--pick', 'tsk-doesnotmatter']);
    // reaches the real handler (not this guard); it fails for an ordinary
    // reason (not an open candidate), never this guard's message.
    assert.doesNotMatch(pickResult.stderr, /disconnected snapshot/);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});

// --- Whole-verb additions with their own subcommands (every subcommand
// mutates, so the guard applies to the bare verb name, not per-subcommand)

test('disconnected-worktree guard: "topic register" and "doc reserve" are refused (every subcommand of these two verbs mutates)', () => {
  const main = initGitCwdMainWithCommittedFgos();
  const wt = addDisconnectedAdHocWorktree(main, 'adhoc-disconnected-topic-doc');
  try {
    const topicResult = run(wt, ['topic', 'register', 'some-topic', '--purpose-slug', 'x']);
    assert.equal(topicResult.status, 4, topicResult.stderr);
    assert.match(topicResult.stderr, /disconnected snapshot/);

    const docResult = run(wt, ['doc', 'reserve', 'some-topic', 'explanation', 'docs/x.md']);
    assert.equal(docResult.status, 4, docResult.stderr);
    assert.match(docResult.stderr, /disconnected snapshot/);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  }
});
