// fgos-return.test.mjs -- phần "return, reject" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
import {
  ADD_BAD_FLAG_CASES,
  DEFAULT_TTL_MS,
  EDIT_BAD_FLAG_CASES,
  EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES,
  FGOS,
  MOVE_BAD_FLAG_CASES,
  REAL_REPO_ROOT,
  SUBMIT_BAD_FLAG_CASES,
  StoreError,
  addAdHocWorktree,
  addBareOrigin,
  addDiscovery,
  addFriction,
  addGoalItem,
  addOk,
  addOutcome,
  addWork,
  advanceThroughDiscoveryToPlanning,
  assert,
  coexistPath,
  commitFile,
  commitInWorktree,
  commitPending,
  commitPendingBeforeApprove,
  createSession,
  cutMemberBranch,
  docsIndexManifestPath,
  editWork,
  endSession,
  envelopeData,
  eventLines,
  execFileSync,
  fileURLToPath,
  fs,
  gitAtCwd,
  gitHead,
  initGitCwd,
  initGitCwdInSubdir,
  initGitCwdMain,
  initGitCwdWithWorktree,
  initHeadlessGitCwd,
  initSessionSafeCwd,
  linkFgosBinInto,
  logPath,
  mainCheckoutLockPath,
  makeAlreadyCaughtUpItem,
  makeBlockedBranchItem,
  makeBlockedLeafItem,
  makeBlockedRunnerItem,
  makeDriftedRoot,
  makeFlatMember,
  makeLegacyProposedItem,
  makeMilestone,
  makeRunnerProposedItem,
  makeRunnerProposedItemTouching,
  makeRunnerProposedLeafItem,
  makeSessionSafeRunnerItem,
  mkLocalDependency,
  moveStage,
  moveWork,
  os,
  path,
  rawTmpCwd,
  registerFlatMember,
  removeAdHocWorktree,
  run,
  spawnSync,
  startSession,
  stateView,
  tmpCwd,
  tmpLinkedWorktree,
  toDoneViaChain,
  toProposed,
  viewPath,
  writeAuthFailFake,
  writeCleanupTtlConfig,
  writeCreateFake,
  writeFakeGh,
  writeHangScript,
  writeLiveLock,
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
} from './helpers/fgos-cli-harness.mjs';



test('return on a branch-source take refuses when the branch has NOT advanced past branchHeadAtTake (no new commit) — validation, exit 4, item stays doing', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-stale', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-stale']).status, 0);

  const result = run(cwd, ['return', 'branch-return-stale']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /has not advanced past branchHeadAtTake/);
  assert.equal(stateView(cwd).work['branch-return-stale'].status, 'doing');
});


test('return without --no-new-commits-ok still refuses a branch-source claim with zero commits since take, even when the branch already satisfies verify (tsk-4on default-unchanged)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-predone-noflag', { verify: 'test -f proof.txt' });
  // The real work is already done and committed BEFORE this claim — mirrors
  // tsk-4j9: a parent whose children's merged content already sits on its
  // own branch from a prior session.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-predone-noflag']).status, 0);

  const result = run(cwd, ['return', 'branch-return-predone-noflag']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /has not advanced past branchHeadAtTake/);
  assert.equal(stateView(cwd).work['branch-return-predone-noflag'].status, 'doing');
});


test('return --no-new-commits-ok closes out a branch-source claim whose branch already reflects fully-done, verify-passing work before this claim (tsk-4on) — succeeds, records aheadCount:0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-predone', { verify: 'test -f proof.txt' });
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-predone']).status, 0);

  // Zero commits on the branch since take — nothing new to prove, the work
  // was already there before the claim.
  const result = run(cwd, ['return', 'branch-return-predone', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-predone'].status, 'awaiting-approval');
  assert.equal(view.outcomes['branch-return-predone'].actual.outcome, 'awaiting-approval');
  assert.equal(view.outcomes['branch-return-predone'].actual.passed, true);
  assert.equal(view.outcomes['branch-return-predone'].actual.aheadCount, 0);
});


test('return --no-new-commits-ok refuses a branch-source claim that was already blocked by a real verify-fail — the flag closes out work never returned, never rescues a failed retry (tsk-4on D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-cheat', { verify: 'test -f proof.txt' });

  const pickResult = run(cwd, ['pick', '--id', 'branch-return-cheat']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const worktreePath = envelopeData(pickResult.stdout).worktree.path;

  // A genuine verify-fail: commits a WRONG file, never satisfies verify.
  fs.writeFileSync(path.join(worktreePath, 'wrong-file.txt'), 'nope\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'wrong fix'], { cwd: worktreePath });

  const failResult = run(cwd, ['return', 'branch-return-cheat']);
  assert.equal(failResult.status, 0, `return should exit 0 for a defined blocked outcome: ${failResult.stderr}`);
  assert.equal(envelopeData(failResult.stdout).to, 'blocked');
  assert.equal(stateView(cwd).outcomes['branch-return-cheat'].actual.outcome, 'blocked');

  // Retake resets branchHeadAtTake to the (still-failing) tip — the
  // deliberate anti-cheat gate for a blocked-branch retake (human-rounds D2).
  const retakeResult = run(cwd, ['take', '--id', 'branch-return-cheat']);
  assert.equal(retakeResult.status, 0, `retake failed: ${retakeResult.stderr}`);

  // Zero new commits since the retake, flag passed — refused: a real
  // blocked outcome is still on record for this item.
  const result = run(cwd, ['return', 'branch-return-cheat', '--no-new-commits-ok']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cannot use --no-new-commits-ok/);
  assert.equal(stateView(cwd).work['branch-return-cheat'].status, 'doing');
});


test('return --no-new-commits-ok never bypasses verify itself — a genuinely-fresh branch-source claim whose branch tip still fails verify still parks doing -> blocked + friction (tsk-4on)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-flag-verify-fail', { verify: 'test -f proof.txt' }); // proof.txt never created anywhere

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-flag-verify-fail']).status, 0);

  // Zero commits since take, flag passed — the advance-check is skipped,
  // but verify still runs and still fails.
  const result = run(cwd, ['return', 'branch-return-flag-verify-fail', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  const view = stateView(cwd);
  assert.equal(view.work['branch-return-flag-verify-fail'].status, 'blocked');
  assert.equal(view.outcomes['branch-return-flag-verify-fail'].actual.outcome, 'blocked');
  assert.equal(view.frictions['branch-return-flag-verify-fail'][0].errorClass, 'verify-miss');
});


test('return on a branch-source take never requires the human\'s own main tree to be clean ("tree người là việc của người") — a dirty main tree never blocks it and is left untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-dirty-main', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-dirty-main']).status, 0);
  commitPending(cwd, 'state: take branch-return-dirty-main');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-dirty-main']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // Dirty the human's own main working tree — untracked, uncommitted, and
  // unrelated to this item entirely.
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated in-progress work\n');

  const result = run(cwd, ['return', 'branch-return-dirty-main']);
  assert.equal(result.status, 0, `return must never inspect the main tree for a branch-source item: ${result.stderr}`);
  assert.equal(stateView(cwd).work['branch-return-dirty-main'].status, 'awaiting-approval');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated in-progress work\n', "the human's own dirty scratch file is untouched");
});


test('return on a branch-source take: verify-fail -> doing -> blocked + friction (verification layer), exit 0 (a defined outcome, not a CLI error)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-red', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-red']).status, 0);
  commitPending(cwd, 'state: take branch-return-red');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-red']);
  fs.writeFileSync(path.join(cwd, 'wrong-file.txt'), 'nope\n'); // advances the branch, never satisfies verify
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'wrong fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['return', 'branch-return-red']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.match(result.stdout, /blocked/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-red'].status, 'blocked');
  assert.equal(view.outcomes['branch-return-red'].actual.outcome, 'blocked');
  assert.equal(view.frictions['branch-return-red'][0].layer, 'verification');
  assert.equal(view.frictions['branch-return-red'][0].errorClass, 'verify-miss');
});


test('return succeeds unchanged from inside a real session worktree (created via session.mjs createSession) — doing -> awaiting-approval, exit 0', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  addOk(cwd, 'return-in-session', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'return-in-session']); // headAtTake = current main HEAD

  // Real detached-HEAD worktree at headAtTake, then advance it with a genuine
  // commit made FROM INSIDE the session worktree (a real dangling commit).
  const session = createSession(cwd, { sessionId: 'sess-return' });
  commitInWorktree(session.worktreePath, 'proof.txt', 'work\n');

  try {
    const result = run(session.worktreePath, ['return', 'return-in-session']);
    assert.equal(result.status, 0, `return from inside a session worktree should succeed unchanged: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /awaiting-approval/);
    assert.equal(stateView(cwd).work['return-in-session'].status, 'awaiting-approval');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});


test('tsk-ikd: return refuses from an ad-hoc worktree never created through "fgos session start" (main-source take) — item stays doing, never reaches awaiting-approval, exit 4', () => {
  // The actual Finding 4 failure scenario: a main-source claim (via `take`)
  // returned from inside a leftover/unrelated linked worktree instead of
  // main. Before this fix, `return`'s main-source path had no guard at all
  // (unlike `approve`/`sync-root`/`promote-to-component`, all of which
  // already refuse here) -- it would read `currentHead`/run verify against
  // WHATEVER cwd happens to be, record `headAtReturn` against a sha that
  // may never actually be reachable from main's own history the way this
  // item's claim assumes. This is deliberately the OPPOSITE fixture from
  // the session-worktree test above: an ad-hoc worktree is never registered
  // via "fgos session start" (no `sessions.json` entry), so it must be
  // refused exactly like approve's own adhoc-worktree tests prove for
  // approve.
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  commitPending(cwd, 'state: init');
  addOk(cwd, 'return-adhoc-mainsource', { verify: 'test -f proof.txt' });
  commitPending(cwd, 'state: add');
  run(cwd, ['take', '--id', 'return-adhoc-mainsource']);
  commitPending(cwd, 'state: take');
  // Real progress actually committed to main -- would satisfy verify if this
  // guard did not fire first, proving the refusal is structural (WHERE this
  // runs), never a proxy for "would verify have passed anyway".
  commitFile(cwd, 'proof.txt');

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-return-mainsource-branch');
  try {
    assert.equal(stateView(cwd).work['return-adhoc-mainsource'].status, 'doing', 'sanity: the ad-hoc worktree really does see the item (real committed events log)');
    const result = run(worktreePath, ['return', 'return-adhoc-mainsource']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a return recorded against an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /registered "fgos session start" worktree/);
    assert.equal(stateView(cwd).work['return-adhoc-mainsource'].status, 'doing', 'item is untouched -- never reaches awaiting-approval from an unregistered worktree');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});


test('return --worker-verified-sha skips runGoalCheck when sha matches branchHead, moving item to awaiting-approval with verify skipped output', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'worker-verified-item', { verify: 'exit 1' });
  const pickResult = run(cwd, ['pick', '--id', 'worker-verified-item']);
  assert.equal(pickResult.status, 0);
  const pickData = envelopeData(pickResult.stdout);

  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by worker\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });

  const branchHead = gitAtCwd(cwd, ['rev-parse', 'fgw/worker-verified-item']).trim();

  const result = run(cwd, ['return', 'worker-verified-item', '--worker-verified-sha', branchHead]);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /verify skipped/);

  const view = stateView(cwd);
  assert.equal(view.work['worker-verified-item'].status, 'awaiting-approval');
  assert.equal(view.work['worker-verified-item'].branchHeadAtReturn, branchHead);
});


test('return --worker-verified-sha falls through to real verify when sha is stale or mismatched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'worker-stale-item', { verify: 'exit 1' });
  const pickResult = run(cwd, ['pick', '--id', 'worker-stale-item']);
  assert.equal(pickResult.status, 0);
  const pickData = envelopeData(pickResult.stdout);

  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by worker\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });

  const staleSha = '0000000000000000000000000000000000000000';

  const result = run(cwd, ['return', 'worker-stale-item', '--worker-verified-sha', staleSha]);
  // Should fall through to real verify (which is `exit 1`), so return moves item to blocked
  const view = stateView(cwd);
  assert.equal(view.work['worker-stale-item'].status, 'blocked');
});
