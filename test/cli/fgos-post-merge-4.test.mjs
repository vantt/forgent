// fgos-post-merge.test.mjs -- phần "catchup, cleanup, retrospective, docs-index, doc-sources" của bộ test CLI, tách nguyên văn
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



test('an item with acceptance absent, or an empty array, closes via move --to delivered completely unaffected (no-op)', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-absent'); // no --acceptance ever set
  assert.equal(run(cwd, ['move', 'cli-cos-absent', '--to', 'delivered']).status, 0);
  assert.equal(stateView(cwd).work['cli-cos-absent'].status, 'delivered');

  const cwd2 = tmpCwd();
  toProposed(cwd2, 'cli-cos-empty');
  run(cwd2, ['edit', 'cli-cos-empty', '--acceptance', JSON.stringify([])]);
  assert.equal(run(cwd2, ['move', 'cli-cos-empty', '--to', 'delivered']).status, 0);
  assert.equal(stateView(cwd2).work['cli-cos-empty'].status, 'delivered');
});


test('retrospective sweeps every delivered item to retrospective, in one pass, leaving non-delivered items untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'retro-todo-item'); // stays todo
  addOk(cwd, 'retro-delivered-a');
  run(cwd, ['move', 'retro-delivered-a', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
  run(cwd, ['move', 'retro-delivered-a', '--to', 'delivered']);
  addOk(cwd, 'retro-delivered-b');
  run(cwd, ['move', 'retro-delivered-b', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
  run(cwd, ['move', 'retro-delivered-b', '--to', 'delivered']);

  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 2);
  assert.deepEqual(data.swept.map((s) => s.id).sort(), ['retro-delivered-a', 'retro-delivered-b']);

  const view = stateView(cwd);
  assert.equal(view.work['retro-todo-item'].status, 'todo', 'a non-delivered item is never touched');
  assert.equal(view.work['retro-delivered-a'].status, 'retrospective');
  assert.equal(view.work['retro-delivered-b'].status, 'retrospective');
});


test('retrospective on a store with no delivered items is a clean no-op, exit 0, empty sweep', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nothing-delivered');
  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { swept: [], count: 0 });
});


test('cleanup on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['cleanup', 'ghost']);
  assert.equal(result.status, 4);
});


test('cleanup on an item not at status cleanup is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-wrong-status');
  const result = run(cwd, ['cleanup', 'cleanup-wrong-status']);
  assert.equal(result.status, 2);
});


test('cleanup parks cleanup -> blocked, with every failing reason joined, when the TTL has not elapsed and no retrospective content exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-not-ready');
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'retrospective']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'cleanup']);
  // Default TTL (7d, no config written) — freshly entered, not elapsed.

  const result = run(cwd, ['cleanup', 'cleanup-not-ready']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.match(data.reason, /not ready yet/);
  assert.match(data.reason, /no outcome docType\/docPath or decision record/);

  assert.equal(stateView(cwd).work['cleanup-not-ready'].status, 'blocked');
});


test('cleanup is a no-op — writes zero work.move events and stays at cleanup — when only TTL has not elapsed and the D8 checks pass', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-ttl-only');
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-ttl-only.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-ttl-only', docType: 'how-to', docPath: 'docs/how-to/cleanup-ttl-only.md' });
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'cleanup']);
  // Default TTL (7d, no config written) — freshly entered, not elapsed.
  // No branchHeadAtReturn recorded -> checkMergeStillResolves passes
  // trivially ("nothing to check"), so the only failing check is TTL.

  const before = eventLines(cwd).length;
  const result = run(cwd, ['cleanup', 'cleanup-ttl-only']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'cleanup');
  assert.equal(data.noop, true);

  assert.equal(eventLines(cwd).length, before, 'TTL-not-elapsed alone must write zero events');
  assert.equal(stateView(cwd).work['cleanup-ttl-only'].status, 'cleanup', 'item must stay at cleanup, not move to blocked');
});


test('cleanup closes to done when TTL is configured to 0 and retrospective content + a resolving merge both exist', () => {
  // tsk-1p9: approve no longer calls cleanupMergedBranch at all — the
  // branch survives all the way from `delivered` through `cleanup`, and
  // this verb is now the ONLY thing that ever deletes it. `cleanupMergedBranch`
  // stays idempotent (branchExists guards it, never throws on an
  // already-gone branch, per merge.test.mjs) as a defensive property, not
  // because this path actually races another deletion anymore.
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedItem(cwd, 'cleanup-ready-item', { verify: 'test -f cleanup-ready-item-produced.txt' });
  commitPendingBeforeApprove(cwd, 'cleanup-ready-item');

  const approve = run(cwd, ['approve', 'cleanup-ready-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(stateView(cwd).work['cleanup-ready-item'].status, 'delivered');

  run(cwd, ['move', 'cleanup-ready-item', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-ready-item.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-ready-item', docType: 'how-to', docPath: 'docs/how-to/cleanup-ready-item.md' });
  run(cwd, ['move', 'cleanup-ready-item', '--to', 'cleanup']);

  const result = run(cwd, ['cleanup', 'cleanup-ready-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'done');

  assert.equal(stateView(cwd).work['cleanup-ready-item'].status, 'done');
  const branchAfter = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchAfter, /fgw\/cleanup-ready-item/, 'the branch is gone by the time cleanup finishes, whichever step actually deleted it');
});


// tsk-1p9 (D7/D8): the regression this item exists to close — a LEAF
// item's own branch, merged into its root's branch (never main), must
// still be deleted correctly by cleanup even while the root itself
// remains unmerged. Pre-tsk-1p9, checkMergeStillResolves checked ancestry
// against literal HEAD (always main from repoRoot), which would falsely
// fail for every leaf; this test proves the root-aware fix (D7) plus the
// verb's own force-delete (D8) actually get the leaf's branch gone.
test('cleanup of a LEAF item deletes its own branch even though the ROOT branch is still unmerged into main (tsk-1p9 D7/D8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedLeafItem(cwd, 'leaf-cleanup-root', 'leaf-cleanup-child', { verify: 'test -f leaf-cleanup-child-produced.txt' });
  commitPendingBeforeApprove(cwd, 'leaf-cleanup-child');

  const approve = run(cwd, ['approve', 'leaf-cleanup-child']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(stateView(cwd).work['leaf-cleanup-child'].status, 'delivered');

  // The leaf's branch survives approve (tsk-1p9 D1) — confirms the fixture
  // actually exercises the deferred-cleanup path this test is proving.
  const branchAfterApprove = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branchAfterApprove, /fgw\/leaf-cleanup-child\b/, 'the leaf branch must still exist right after approve');
  assert.match(branchAfterApprove, /fgw\/leaf-cleanup-root\b/, 'the root branch must still exist — never merged to main by this test');

  run(cwd, ['move', 'leaf-cleanup-child', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'leaf-cleanup-child.md'), '# doc\n');
  addOutcome(dir, { id: 'leaf-cleanup-child', docType: 'how-to', docPath: 'docs/how-to/leaf-cleanup-child.md' });
  run(cwd, ['move', 'leaf-cleanup-child', '--to', 'cleanup']);

  const result = run(cwd, ['cleanup', 'leaf-cleanup-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'done', `cleanup must close the leaf to done, not park it blocked: ${JSON.stringify(data)}`);

  assert.equal(stateView(cwd).work['leaf-cleanup-child'].status, 'done');
  const branchAfterCleanup = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchAfterCleanup, /fgw\/leaf-cleanup-child\b/, 'the leaf branch must actually be deleted by cleanup');
  assert.match(branchAfterCleanup, /fgw\/leaf-cleanup-root\b/, 'the still-open root branch must be untouched');
});


test('cleanup parks cleanup -> blocked when the recorded commit no longer resolves on main (force-pushed/rewritten away)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-bad-merge',
    title: 'Bad merge',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'true',
    headAtReturn: '0'.repeat(40), // a well-formed but nonexistent sha
  });
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-bad-merge.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-bad-merge', docType: 'how-to', docPath: 'docs/how-to/cleanup-bad-merge.md' });

  const result = run(cwd, ['cleanup', 'cleanup-bad-merge']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.match(data.reason, /no longer reachable/);
});


// tsk-2q8: a `cleanup -> blocked` park caused by checkMergeStillResolves
// (the recorded commit no longer resolving) has a REAL fgw/<id> branch —
// unlike the merge-conflict-family reasons above, `item.reason` here is
// never one of CATCHUP_REASONS' short enum values (the cleanup verb
// records the full diagnostic text instead), so catchup must recognize
// this case by live-re-checking checkMergeStillResolves, not by reason
// text. Re-merging main into fgw/<id> and re-verifying is exactly the fix:
// the item's own commit becomes a real descendant of main afterward.
test('catchup recovers a cleanup-origin blocked item whose recorded commit no longer resolves, by re-merging and re-verifying (tsk-2q8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/cleanup-origin-recover']);
  fs.writeFileSync(path.join(cwd, 'cleanup-origin-recover-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for cleanup-origin-recover']);
  const staleSha = gitAtCwd(cwd, ['rev-parse', 'HEAD']).trim();
  gitAtCwd(cwd, ['checkout', 'main']);

  // main advances INDEPENDENTLY after the branch forked (a non-overlapping
  // change, mirroring the existing `catchup-root-drift` test above) — the
  // real shape this item exists for: `staleSha` is not (yet) reachable from
  // main, and merging main forward requires a real merge commit, not a
  // fast-forward/no-op (which is what a lagging-main setup would produce).
  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-origin-recover',
    title: 'Cleanup-origin recover',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'test -f cleanup-origin-recover-produced.txt',
    branchHeadAtReturn: staleSha,
  });
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-origin-recover.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-origin-recover', docType: 'how-to', docPath: 'docs/how-to/cleanup-origin-recover.md' });

  const cleanupResult = run(cwd, ['cleanup', 'cleanup-origin-recover']);
  assert.equal(cleanupResult.status, 0, cleanupResult.stderr);
  const cleanupData = envelopeData(cleanupResult.stdout);
  assert.equal(cleanupData.to, 'blocked');
  assert.match(cleanupData.reason, /no longer reachable/);
  assert.equal(stateView(cwd).work['cleanup-origin-recover'].status, 'blocked');

  const catchupResult = run(cwd, ['catchup', 'cleanup-origin-recover']);
  assert.equal(catchupResult.status, 0, catchupResult.stderr);
  const catchupData = envelopeData(catchupResult.stdout);
  assert.equal(catchupData.to, 'awaiting-approval');
  assert.equal(stateView(cwd).work['cleanup-origin-recover'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/cleanup-origin-recover']);
  assert.match(branchLog, /catch-up: merge main into fgw\/cleanup-origin-recover/);
});


// The retrospective-content-only shape must NOT be treated as
// catchup-eligible even though it is also a `cleanup -> blocked` park —
// merging main into fgw/<id> does nothing to fix missing retrospective
// docs, so admitting it here would silently wave the item toward
// awaiting-approval without ever addressing the real gap.
test('catchup still rejects a cleanup-origin blocked item whose recorded commit DOES resolve (missing retrospective content only, not a merge-ancestry gap) (tsk-2q8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/cleanup-origin-retro-only']);
  fs.writeFileSync(path.join(cwd, 'cleanup-origin-retro-only-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for cleanup-origin-retro-only']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-ff', '-q', '-m', 'merge cleanup-origin-retro-only', 'fgw/cleanup-origin-retro-only']);
  const mergedSha = gitAtCwd(cwd, ['rev-parse', 'HEAD']).trim();

  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-origin-retro-only',
    title: 'Cleanup-origin retro-only',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'test -f cleanup-origin-retro-only-produced.txt',
    branchHeadAtReturn: mergedSha,
  });
  // No outcome doc/decision recorded -- checkRetrospectiveContent fails,
  // checkMergeStillResolves passes (mergedSha genuinely IS an ancestor of
  // main now).

  const cleanupResult = run(cwd, ['cleanup', 'cleanup-origin-retro-only']);
  assert.equal(cleanupResult.status, 0, cleanupResult.stderr);
  const cleanupData = envelopeData(cleanupResult.stdout);
  assert.equal(cleanupData.to, 'blocked');
  assert.match(cleanupData.reason, /no outcome docType\/docPath or decision record/);
  assert.doesNotMatch(cleanupData.reason, /no longer reachable/);

  const catchupResult = run(cwd, ['catchup', 'cleanup-origin-retro-only']);
  assert.equal(catchupResult.status, 4);
  assert.match(catchupResult.stderr, /catchup only resolves a merge-related park/);
  assert.equal(stateView(cwd).work['cleanup-origin-retro-only'].status, 'blocked');
});


test('catchup accepts a blocked reason of merge-blocked-other-item as a valid precondition (tsk-4hj D2, mirrors tsk-18a\'s own precedent for merge-failed-unclassified)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'catchup-blocked-other-item');
  run(cwd, ['move', 'catchup-blocked-other-item', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
  commitPending(cwd, 'state: claim catchup-blocked-other-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-blocked-other-item']);
  fs.writeFileSync(path.join(cwd, 'catchup-blocked-other-item-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'catchup-blocked-other-item-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for catchup-blocked-other-item']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'catchup-blocked-other-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose catchup-blocked-other-item');
  run(cwd, ['move', 'catchup-blocked-other-item', '--to', 'blocked', '--reason', 'merge-blocked-other-item']);
  commitPending(cwd, 'state: park catchup-blocked-other-item');

  const result = run(cwd, ['catchup', 'catchup-blocked-other-item']);
  // The precondition check itself must accept the reason -- a rejected
  // reason exits 4 (validation: "catchup only resolves a merge-related
  // park (...)"); anything else (including a real merge outcome, since
  // the branch already contains main and this is an "already-caught-up"
  // no-op) proves the reason was accepted.
  assert.notEqual(result.status, 4, result.stderr);
  assert.doesNotMatch(result.stderr, /catchup only resolves a merge-related park/);
});


test('catchup succeeds when invoked with cwd inside the item\'s own linked worktree and --dir pointed at the main checkout (tsk-5vl regression guard)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-worktree-cwd', 'integration-drift', { verify: 'test -f catchup-worktree-cwd-produced.txt' });

  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-catchup-wt-'));
  fs.rmdirSync(wt);
  gitAtCwd(cwd, ['worktree', 'add', wt, 'fgw/catchup-worktree-cwd']);

  const mainHeadBefore = gitHead(cwd);
  const result = run(wt, ['catchup', 'catchup-worktree-cwd', '--dir', cwd]);
  assert.equal(result.status, 0, `catchup from inside the item's own worktree unexpectedly failed: ${result.stderr}`);
  assert.doesNotMatch(result.stderr ?? '', /Cannot force update the current branch/);
  const catchupData = envelopeData(result.stdout);
  assert.equal(catchupData.from, 'blocked');
  assert.equal(catchupData.to, 'awaiting-approval');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(stateView(cwd).work['catchup-worktree-cwd'].status, 'awaiting-approval');
  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-worktree-cwd']);
  assert.match(branchLog, /catch-up: merge main into fgw\/catchup-worktree-cwd/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});
