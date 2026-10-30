// fgos-post-merge.test.mjs -- phần "catchup, cleanup, retrospective, docs-index, doc-sources" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  ADD_BAD_FLAG_CASES,
  FGOS,
  REAL_REPO_ROOT,
  SUBMIT_BAD_FLAG_CASES,
  StoreError,
  addAdHocWorktree,
  addBareOrigin,
  addDiscovery,
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
  moveStep,
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
  assert.match(data.reason, /no outcome docType\/docPath, decision record, or knowledge-registry attestation/);

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


test('cleanup closes to done when TTL is configured to 0 and retrospective content + a resolving merge both exist', async () => {
  // tsk-1p9: approve no longer calls cleanupMergedBranch at all — the
  // branch survives all the way from `delivered` through `cleanup`, and
  // this verb is now the ONLY thing that ever deletes it. `cleanupMergedBranch`
  // stays idempotent (branchExists guards it, never throws on an
  // already-gone branch, per merge.test.mjs) as a defensive property, not
  // because this path actually races another deletion anymore.
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  await makeRunnerProposedItem(cwd, 'cleanup-ready-item', { verify: 'test -f cleanup-ready-item-produced.txt' });
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
test('cleanup of a LEAF item deletes its own branch even though the ROOT branch is still unmerged into main (tsk-1p9 D7/D8)', async () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  await makeRunnerProposedLeafItem(cwd, 'leaf-cleanup-root', 'leaf-cleanup-child', { verify: 'test -f leaf-cleanup-child-produced.txt' });
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


test('catchup succeeds when invoked with cwd inside the item\'s own linked worktree and --dir pointed at the main checkout (tsk-5vl regression guard)', async () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  await makeBlockedRunnerItem(cwd, 'catchup-worktree-cwd', 'integration-drift', { verify: 'test -f catchup-worktree-cwd-produced.txt' });

  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-catchup-wt-'));
  fs.rmdirSync(wt);
  gitAtCwd(cwd, ['worktree', 'add', wt, 'fgw/catchup-worktree-cwd']);

  // Events no longer ride main's tree, so main only drifts past the branch when something is committed on it.
  gitAtCwd(cwd, ['commit', '--allow-empty', '-q', '-m', 'main advances past the item branch']);
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
