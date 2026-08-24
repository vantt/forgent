// fgos-approve.test.mjs -- phần "approve" của bộ test CLI, tách nguyên văn
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

function moveRootToResolved(cwd, rootId, finalStatus) {
  run(cwd, ['move', rootId, '--to', 'doing']);
  if (finalStatus === 'wontfix') {
    run(cwd, ['move', rootId, '--to', 'wontfix']);
  } else {
    run(cwd, ['move', rootId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
    run(cwd, ['move', rootId, '--to', 'delivered']);
  }
  commitPending(cwd, `state: resolve ${rootId} to ${finalStatus}`);
}


test('approve on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['approve', 'ghost']);
  assert.equal(result.status, 4);
});


test('approve on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'not-proposed-approve');
  const result = run(cwd, ['approve', 'not-proposed-approve']);
  assert.equal(result.status, 2);
});


test('approve of a runner item (happy path): merges fgw/<id> into main, verifies, awaiting-approval -> delivered with role human, and the branch SURVIVES (tsk-1p9: cleanup deferred to the cleanup verb)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-runner-item', { verify: 'test -f approve-runner-item-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-runner-item');

  const result = run(cwd, ['approve', 'approve-runner-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal('cleanupWarnings' in envelopeData(result.stdout), false, 'approve no longer performs branch/worktree cleanup itself (tsk-1p9 D1)');

  const view = stateView(cwd);
  assert.equal(view.work['approve-runner-item'].status, 'delivered');
  // The 'close' settlement (RUL20) fires on the actual done-close only —
  // now cleanup->done (work-item-status-delivered-retrospective-cleanup
  // D1/D4), not on approve reaching delivered — so no settlement exists
  // yet at this point in the sequence.
  assert.equal(view.settlements?.['approve-runner-item'], undefined);
  assert.ok(fs.existsSync(path.join(cwd, 'approve-runner-item-produced.txt')), 'the merged file must be present on main');
  // tsk-5dk: a real approve merge now records merge evidence — mergedSha
  // must be main's own real post-merge commit, readable straight off the
  // delivered event, not inferred from git afterward.
  assert.equal(view.work['approve-runner-item'].mergedInto, 'main');
  assert.equal(view.work['approve-runner-item'].mergedSha, gitAtCwd(cwd, ['rev-parse', 'main']).trim());

  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/approve-runner-item/, 'the merged branch must survive approve — deleted later by the cleanup verb, not here');
});


test('approve of a runner item succeeds when ONLY .fgos/ (the live event log) is dirty on main — no more manual events.jsonl commit before every approve', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-fgos-only-dirty', { verify: 'test -f approve-fgos-only-dirty-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-fgos-only-dirty');

  // Dirty ONLY the live event log on main after the item is proposed — an
  // unrelated `add` appends an event and never touches any other file —
  // deliberately left uncommitted (unlike makeRunnerProposedItem's own
  // commitPending calls, which fold everything together). Tầng A/T2
  // (TA-D2/TA-D11): the new event lands in a per-writer file under
  // `.fgos/events/<writer-id>-<openTs>.jsonl`, not baseline-0's
  // `.fgos/events.jsonl` — same live-log noise, different physical path.
  assert.equal(addOk(cwd, 'approve-fgos-only-dirty-noise').status, 0);

  const statusLines = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.equal(statusLines.length, 1, 'sanity: the live event log must be the ONLY dirty path at this point');
  assert.match(statusLines[0], /\.fgos\/events(\.jsonl|\/.*\.jsonl)$/);

  const result = run(cwd, ['approve', 'approve-fgos-only-dirty']);
  assert.equal(result.status, 0, `approve should succeed with only .fgos/ dirty: ${result.stderr}`);
  assert.equal(stateView(cwd).work['approve-fgos-only-dirty'].status, 'delivered');
});


test('approve of a runner item succeeds when a dirty file on main is UNRELATED to the item (tsk-598 D1/D2) — own-file-set scoping, not a whole-tree gate', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-unrelated-dirty', { verify: 'test -f approve-unrelated-dirty-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-unrelated-dirty');

  // A path the item's own branch-vs-trunk diff never touches — another
  // session's uncommitted work sitting on main, the exact repro shape
  // tsk-598 was filed for (tsk-veg's approve blocked by unrelated docs/
  // plans/ files from a different session).
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated uncommitted work\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-unrelated-dirty']);
  assert.equal(result.status, 0, `approve should succeed past an unrelated dirty file: ${result.stderr}`);
  assert.equal(stateView(cwd).work['approve-unrelated-dirty'].status, 'delivered');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated uncommitted work\n', 'the unrelated dirty file must be left untouched, still uncommitted');
});


test('approve of a runner item still refuses when the SAME path the item touched is dirty again on main — a real conflict, tsk-598 D2, exit 4, item stays proposed', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-real-conflict', { verify: 'test -f approve-real-conflict-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-real-conflict');

  // approve-real-conflict-produced.txt IS in this item's own branch-vs-trunk
  // diff (makeRunnerProposedItem committed it on fgw/approve-real-conflict);
  // re-dirtying that SAME path on main after propose is a real conflict —
  // own-file-set membership still blocks it, unchanged from before tsk-598.
  fs.writeFileSync(path.join(cwd, 'approve-real-conflict-produced.txt'), 'clobbered by another writer\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-real-conflict']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['approve-real-conflict'].status, 'awaiting-approval');
});


test('approve of a runner item with a declared footprint still refuses on an uncommitted footprint path (tsk-598 D3) even though it was never committed to the branch', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-footprint-dirty', {
    verify: 'test -f approve-footprint-dirty-produced.txt',
    footprint: 'footprint-guarded.txt',
  });
  commitPendingBeforeApprove(cwd, 'approve-footprint-dirty');

  // footprint-guarded.txt was never committed to fgw/approve-footprint-dirty
  // (so it is absent from the item's own committed diff) — only DECLARED in
  // item.footprint. Per D3, a footprint path still blocks even uncommitted,
  // protecting against exactly the "forgot to add it" gap a committed-diff-
  // only own-file-set would silently let through.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'forgot to commit this\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-footprint-dirty']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['approve-footprint-dirty'].status, 'awaiting-approval');
});


// tsk-kv3 (Q1): the main-checkout clean-tree gate no longer runs at all on
// the leaf->root path — that merge happens entirely inside a DETACHED
// ephemeral worktree (withMergeEphemeralWorktree) and never reads or
// writes repoRoot's own working tree. Gating on it protected a resource
// that path never touches, and could block a leaf approve on a dirty file
// that has nothing to do with the merge actually being attempted.

test('approve of a LEAF item is unaffected by a dirty main checkout, even one colliding with the leaf\'s own declared footprint path (tsk-kv3 Q1) — the root-to-main equivalent test above still refuses, this one must not', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'kv3-leaf-root', 'kv3-leaf-dirty', {
    verify: 'test -f kv3-leaf-dirty-produced.txt',
    footprint: 'footprint-guarded.txt',
  });
  commitPendingBeforeApprove(cwd, 'kv3-leaf-dirty');

  // Same shape as the root/standalone test above (an uncommitted footprint
  // path dirtying the main checkout) — for a root that still refuses (D3).
  // For a leaf, it must NOT: this file sits in repoRoot's own working tree,
  // which the leaf's ephemeral-worktree merge never reads or writes.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'unrelated to the ephemeral merge\n');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'kv3-leaf-dirty']);
  assert.equal(result.status, 0, `leaf approve must succeed despite the dirty main checkout: ${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, 'fgw/kv3-leaf-root');

  assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — the dirty file is still sitting there, untouched, exactly as it was');
  assert.equal(fs.readFileSync(path.join(cwd, 'footprint-guarded.txt'), 'utf8'), 'unrelated to the ephemeral merge\n', 'the dirty file itself must survive untouched — this gate never claimed to clean it up, only to block on it');
});


test('approve of a leaf item with a clean merge lands the work on fgw/<root> (not main) via an ephemeral worktree, leaf -> delivered, fgw/<leaf> SURVIVES the approve (tsk-1p9: teardown deferred to the cleanup verb), fgw/<root> survives', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'approve-leaf-root', 'approve-leaf-child', { verify: 'test -f approve-leaf-child-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-leaf-child');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const approveData = envelopeData(result.stdout);
  assert.equal(approveData.branch, 'fgw/approve-leaf-child');
  assert.equal(approveData.target, 'fgw/approve-leaf-root');
  assert.equal(approveData.to, 'delivered');
  assert.equal('cleanupWarnings' in approveData, false, 'approve no longer performs branch/worktree cleanup itself (tsk-1p9 D1)');

  // main must never be touched by a leaf approve.
  assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged by a leaf approve');
  assert.equal(
    fs.existsSync(path.join(cwd, 'approve-leaf-child-produced.txt')),
    false,
    'the leaf\'s produced file must not land on the human\'s own main checkout',
  );

  const view = stateView(cwd);
  assert.equal(view.work['approve-leaf-child'].status, 'delivered');

  // fgw/<leaf> must SURVIVE right after approve (tsk-1p9, restore-to-decision:
  // teardown is deferred to the `cleanup` verb, gated by D7's TTL and D8's
  // harness — no longer synchronous with merge).
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/approve-leaf-child\b/, 'the leaf\'s own branch must survive approve — deleted later by the cleanup verb, not here');
  assert.match(branches, /fgw\/approve-leaf-root\b/, 'the root\'s own integration branch must survive');

  // the merged content must actually be present on fgw/<root>'s tip.
  const rootTreeFile = gitAtCwd(cwd, ['show', 'fgw/approve-leaf-root:approve-leaf-child-produced.txt']);
  assert.match(rootTreeFile, /ok/);

  // tsk-5dk: mergedSha must be the ROOT branch's own tip (resolved from
  // repoRoot by branch name, never the ephemeral worktree's own HEAD —
  // see resolveRefSha's comment in bin/fgos.mjs for why that distinction
  // matters here specifically).
  assert.equal(view.work['approve-leaf-child'].mergedInto, 'fgw/approve-leaf-root');
  assert.equal(view.work['approve-leaf-child'].mergedSha, gitAtCwd(cwd, ['rev-parse', 'fgw/approve-leaf-root']).trim());
});


// tsk-4ax (D3): catchup as a STANDARD step of approve itself, not only a
// manual recovery from `blocked` — the core reason this item exists. A
// leaf whose root has moved since the leaf's own branch was cut must be
// caught up and landed by a single `approve` call, with no separate
// `fgos catchup` call ever needed, and the verify that ran during that
// inline catchup must be the ONLY verify that runs for the whole call —
// proven with a sentinel, not by timing.

test('approve of a leaf whose root has moved since: auto-catches-up inline, lands successfully, and its own inline verify is the ONLY verify that runs — exactly once, not twice (tsk-4ax core acceptance)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // Appends one line per verify invocation, so "ran exactly once" is a real
  // count, not just an existence check that a second run would pass too.
  const verifyLog = path.join(cwd, 'verify-runs.log');
  makeRunnerProposedLeafItem(cwd, 'auto-catchup-root', 'auto-catchup-leaf', { verify: `echo run >> ${JSON.stringify(verifyLog)} && test -f auto-catchup-leaf-produced.txt` });
  commitPendingBeforeApprove(cwd, 'auto-catchup-leaf');

  // The root advances AFTER the leaf's own branch was cut — a genuinely
  // non-overlapping change, simulating a sibling leaf's own approve
  // landing on the shared root branch first.
  gitAtCwd(cwd, ['checkout', 'fgw/auto-catchup-root']);
  fs.writeFileSync(path.join(cwd, 'sibling-produced.txt'), 'sibling ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling leaf merged into root first']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const headBefore = gitHead(cwd);
  // No `fgos catchup` call anywhere in this test — approve alone must do it.
  const result = run(cwd, ['approve', 'auto-catchup-leaf']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, 'fgw/auto-catchup-root');

  assert.equal(gitHead(cwd), headBefore, 'main must never be touched by a leaf approve');
  const verifyRunCount = fs.readFileSync(verifyLog, 'utf8').trim().split('\n').filter(Boolean).length;
  assert.equal(verifyRunCount, 1, `verify must run EXACTLY once (the inline catchup) for this whole approve call, not again during the land — ran ${verifyRunCount} times`);

  // Both the sibling's earlier content AND this leaf's own content must be
  // on the root — proof the catchup merge genuinely combined them, not
  // just fast-forwarded past one or the other.
  const rootSiblingFile = gitAtCwd(cwd, ['show', 'fgw/auto-catchup-root:sibling-produced.txt']);
  assert.match(rootSiblingFile, /sibling ok/);
  const rootLeafFile = gitAtCwd(cwd, ['show', 'fgw/auto-catchup-root:auto-catchup-leaf-produced.txt']);
  assert.match(rootLeafFile, /ok/);

  // The leaf's OWN branch must also carry the catchup commit (it was
  // caught up onto the root, then that whole thing landed).
  const leafLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/auto-catchup-leaf']);
  assert.match(leafLog, /catch-up: merge fgw\/auto-catchup-root into fgw\/auto-catchup-leaf/);
});
