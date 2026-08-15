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

  // Dirty ONLY `.fgos/events.jsonl` on main after the item is proposed —
  // an unrelated `add` appends an event and never touches any other file —
  // deliberately left uncommitted (unlike makeRunnerProposedItem's own
  // commitPending calls, which fold everything together).
  assert.equal(addOk(cwd, 'approve-fgos-only-dirty-noise').status, 0);

  const statusLines = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.equal(statusLines.length, 1, 'sanity: .fgos/events.jsonl must be the ONLY dirty path at this point');
  assert.match(statusLines[0], /\.fgos\/events\.jsonl$/);

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

test('approve of a leaf whose root has NOT moved: no catchup attempted at all, unchanged from before this item (regression guard)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'no-catchup-root', 'no-catchup-leaf', { verify: 'test -f no-catchup-leaf-produced.txt' });
  commitPendingBeforeApprove(cwd, 'no-catchup-leaf');

  const result = run(cwd, ['approve', 'no-catchup-leaf']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');

  const leafLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/no-catchup-leaf']);
  assert.doesNotMatch(leafLog, /catch-up:/, 'no catchup commit must exist when the root never moved — the ancestor check must have short-circuited before performCatchUp was ever called');
});

test('approve of a leaf whose root branch was never created (root only ever driven by a live session/pick, never the runner dispatch loop that creates fgw/<rootId> early per D17): falls back to creating it from main instead of crashing raw on the ancestor-check', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const dir = path.join(cwd, '.fgos');

  const rootId = 'no-early-branch-root';
  const leafId = 'no-early-branch-leaf';

  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  // Deliberately no `git branch fgw/${rootId} main` here — this is the
  // exact gap: a root only ever driven live never gets its own branch
  // created early.

  addWork(dir, {
    id: leafId,
    title: `Title ${leafId}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: `test -f ${leafId}-produced.txt`,
    parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, 'main']);
  fs.writeFileSync(path.join(cwd, `${leafId}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPendingBeforeApprove(cwd, leafId);

  const branchesBefore = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchesBefore, new RegExp(`fgw/${rootId}\\b`), 'fgw/<rootId> must not exist yet — the whole point of this fixture');

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');
  assert.equal(data.target, `fgw/${rootId}`);

  const branchesAfter = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branchesAfter, new RegExp(`fgw/${rootId}\\b`), 'fgw/<rootId> must exist after approve — created by the fallback');

  const rootTip = gitAtCwd(cwd, ['show', `fgw/${rootId}:${leafId}-produced.txt`]);
  assert.match(rootTip, /ok/);
});

test('approve of a leaf whose inline catchup hits a real conflict: parks blocked (reason merge-conflict), the leaf stays awaiting-approval-shaped (not silently delivered), root untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'catchup-conflict-root', 'catchup-conflict-leaf', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'catchup-conflict-leaf');

  // Same-line conflict: the root advances with a same-named file whose
  // content collides with what the leaf's own commit already touches.
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-conflict-root']);
  fs.writeFileSync(path.join(cwd, 'catchup-conflict-leaf-produced.txt'), 'root-side content, different from leaf\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'root touches the same file the leaf does']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const rootTipBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-root']).trim();
  const result = run(cwd, ['approve', 'catchup-conflict-leaf']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-conflict');
  assert.equal(data.target, 'fgw/catchup-conflict-root');

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-root']).trim(), rootTipBefore, 'root must be completely untouched by a failed inline catchup');
  assert.equal(stateView(cwd).work['catchup-conflict-leaf'].status, 'blocked');
});

test('approve of a runner item that conflicts: aborts the merge, awaiting-approval -> blocked (reason merge-conflict), main left byte-for-byte unchanged (must_have: main never holds a broken merge commit)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  addOk(cwd, 'approve-conflict-item');
  run(cwd, ['move', 'approve-conflict-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim approve-conflict-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/approve-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  run(cwd, ['move', 'approve-conflict-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose approve-conflict-item');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-conflict-item']);
  assert.equal(result.status, 0, result.stderr);
  const conflictData = envelopeData(result.stdout);
  assert.equal(conflictData.to, 'blocked');
  assert.equal(conflictData.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');

  const view = stateView(cwd);
  assert.equal(view.work['approve-conflict-item'].status, 'blocked');
  assert.equal(view.frictions['approve-conflict-item'][0].errorClass, 'merge-conflict');
});

test('approve of a runner item whose staged merge fails its own verify: aborts, awaiting-approval -> blocked (reason verify-fail-post-merge), main left unchanged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-verify-fail-item', { verify: 'test -f file-never-produced.txt' });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-verify-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const verifyFailData = envelopeData(result.stdout);
  assert.equal(verifyFailData.to, 'blocked');
  assert.equal(verifyFailData.reason, 'verify-fail-post-merge');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.existsSync(path.join(cwd, 'approve-verify-fail-item-produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');

  const view = stateView(cwd);
  assert.equal(view.work['approve-verify-fail-item'].status, 'blocked');
  assert.equal(view.frictions['approve-verify-fail-item'][0].errorClass, 'verify-miss');
});

test('approve of a root item that HAD children, whose merge into main conflicts, parks with the distinguishing reason integration-drift and a main@<sha> friction detail', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'drift-root-item');
  // A child (any status) is enough to mark this root as "actually had
  // children" (D8's check reads existence of `parent === id`, per
  // replay.mjs's fold never clearing `parent` even once the child is done).
  addWork(dir, {
    id: 'drift-root-child',
    title: 'drift child',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'true',
    parent: 'drift-root-item',
  });

  run(cwd, ['move', 'drift-root-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim drift-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/drift-root-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  run(cwd, ['move', 'drift-root-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose drift-root-item');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'drift-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).reason, 'integration-drift');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');

  const view = stateView(cwd);
  assert.equal(view.work['drift-root-item'].status, 'blocked');
  assert.equal(view.frictions['drift-root-item'][0].errorClass, 'merge-conflict');
  assert.match(view.frictions['drift-root-item'][0].detail, new RegExp(`main@${headBefore}`), 'friction detail must record the main@<sha> ref');
});

test('approve of a pull-door item (no merge, code already on main): re-verifies and closes awaiting-approval -> done with role human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-pull-item']);
  commitPendingBeforeApprove(cwd, 'approve-pull-item');

  const result = run(cwd, ['approve', 'approve-pull-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['approve-pull-item'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['approve-pull-item'], undefined);
});

test('approve of a legacy item with a failing verify: blocked (reason verify-fail), not merge-related, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-legacy-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const legacyFailData = envelopeData(result.stdout);
  assert.equal(legacyFailData.to, 'blocked');
  assert.equal(legacyFailData.reason, 'verify-fail');

  const view = stateView(cwd);
  assert.equal(view.work['approve-legacy-fail-item'].status, 'blocked');
});

test("approve verify-fail (legacy item): park edge stamps role 'system' (not human) on the awaiting-approval -> blocked event", () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-role-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-role-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-role-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-legacy-fail-role-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const lines = eventLines(cwd);
  const moveEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.move' && e.payload.to === 'blocked');
  assert.ok(moveEvent, 'expected a work.move event to blocked');
  assert.equal(moveEvent.payload.role, 'system');
});

test('approve of a legacy item with a passing verify closes it to done — legacy degrade never blocks approve/reject from working (must_have)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-ok-item', { verify: 'true' });
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-legacy-ok-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['approve-legacy-ok-item'].status, 'delivered');
});

// tsk-3vo D5: same shared --timeout/--no-timeout resolution as `return`
// (resolveVerifyTimeoutMs), wired into `approve` too — must reject the same
// way, before any verify runs.
test('approve --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-timeout-conflict', { verify: 'true' });
  run(cwd, ['move', 'approve-timeout-conflict', '--to', 'doing']);
  run(cwd, ['move', 'approve-timeout-conflict', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['approve-timeout-conflict'].status, 'awaiting-approval', 'a rejected flag combination never runs verify or moves the item');
});

test('approve twice: the second approve on an already-done item is rejected as precondition, exit 2 (done is terminal)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-twice-item', { verify: 'true' });
  run(cwd, ['move', 'approve-twice-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-twice-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  assert.equal(run(cwd, ['approve', 'approve-twice-item']).status, 0);

  const result = run(cwd, ['approve', 'approve-twice-item']);
  assert.equal(result.status, 2);
});

test('approve of a runner item whose diff touches a self-modifying-capable module (src/runner/**) REFUSES without --acknowledge-iron-law: validation exit 4, item stays proposed, no merge, message names the tripped module', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-refuse-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-refuse-item']);
  assert.equal(result.status, 4, `expected a validation refusal: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.match(result.stderr, /--acknowledge-iron-law/);

  const view = stateView(cwd);
  assert.equal(view.work['iron-refuse-item'].status, 'awaiting-approval', 'a refused approve leaves the item proposed');
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge — HEAD is unchanged');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/iron-refuse-item/, 'the branch survives an Iron Law refusal — nothing was merged or cleaned up');
});

test('approve --acknowledge-iron-law false (a value form, not the bare flag) still REFUSES -- fail-closed, review-20260718-self-improve-loop f02', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-false-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-ack-false-item', '--acknowledge-iron-law', 'false']);
  assert.equal(result.status, 4, `a value form must refuse exactly like no flag at all: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-false-item'].status, 'awaiting-approval');
  assert.equal(gitHead(cwd), headBefore);
});

test('approve of the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges, verifies, awaiting-approval -> delivered, branch SURVIVES (tsk-1p9: cleanup deferred to the cleanup verb)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  commitPendingBeforeApprove(cwd, 'iron-ack-item');

  const result = run(cwd, ['approve', 'iron-ack-item', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `approve with acknowledgment must succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-item'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['iron-ack-item'], undefined);
  assert.ok(fs.existsSync(path.join(cwd, 'src/runner/probe.mjs')), 'the merged module file is present on main');
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(branches, /fgw\/iron-ack-item/, 'the merged branch must survive approve — deleted later by the cleanup verb, not here');
});

test('approve of an ordinary runner item (diff touches no self-modifying module) is UNAFFECTED — proceeds to done with no --acknowledge-iron-law flag (backward compatibility)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-plain-item', 'docs/notes.txt', {
    verify: 'test -f docs/notes.txt',
  });
  commitPendingBeforeApprove(cwd, 'iron-plain-item');

  const result = run(cwd, ['approve', 'iron-plain-item']);
  assert.equal(result.status, 0, `an ordinary diff must approve without any acknowledgment: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work['iron-plain-item'].status, 'delivered');
});

// tsk-4voj-iron-law-leaf-scope CONTEXT.md D1: the Iron Law's own
// changedFiles input now diffs a leaf against its resolved root's branch
// (the same D3 leaf-vs-root split `approve`'s merge target and `review`'s
// diff already use), not blind trunk. Before this fix, a leaf forked AFTER
// a sibling already merged a gated-module change into the root inherited
// that sibling's files as if they were its own -- live-reproduced on
// tsk-52g-2. These two tests prove the false-positive is closed (below)
// without under-scoping a leaf's own genuine hit (further below).

test('approve of a leaf item forked AFTER a sibling already merged a gated-module change into the root does NOT trip Iron Law on the ancestor\'s file (tsk-4voj false-positive closed)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const rootId = 'iron-leaf-root';
  const leafId = 'iron-leaf-child';
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  // A sibling child's already-merged gated-module change, landed on the
  // root's own integration branch BEFORE this leaf forks from it -- the
  // exact tsk-52g-2 shape.
  gitAtCwd(cwd, ['checkout', `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/sibling-produced.mjs'), 'export const sibling = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling child merged into root (already has its own evidence elsewhere)']);
  gitAtCwd(cwd, ['checkout', 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: 'test -f docs/leaf-note.txt', parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs/leaf-note.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPendingBeforeApprove(cwd, leafId);

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, `leaf's own diff never touches a gated module -- must approve without --acknowledge-iron-law: ${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work[leafId].status, 'delivered');
});

// Superseded by docs/history/iron-law-gate-human-ux/CONTEXT.md D1: this used
// to assert the leaf REFUSES, back when the gate fired at every merge
// boundary. It now fires only where the target is trunk, and a leaf's target
// is `fgw/<root>` — so what stays worth proving here is the leaf-scoped diff
// itself (tsk-4voj D1's own subject): the leaf's own gated-module commit is
// still SEEN, it just no longer refuses at this boundary. The refusal half
// moved to test/cli/fgos-iron-law-gate.test.mjs, which pins the same diff
// tripping the gate at the trunk boundary it does still guard.
test('approve of a leaf item whose OWN commit touches a gated module (src/runner/**) PROCEEDS — the leaf lands on fgw/<root>, never trunk (iron-law-gate-human-ux D1)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const rootId = 'iron-leaf-genuine-root';
  const leafId = 'iron-leaf-genuine-child';
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: 'test -f src/runner/iron-leaf-genuine-child-produced.mjs', parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/iron-leaf-genuine-child-produced.mjs'), 'export const producedByLeaf = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPendingBeforeApprove(cwd, leafId);

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, `a leaf never lands on trunk -- the gate must not fire here: ${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work[leafId].status, 'delivered');
  assert.match(
    gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', `fgw/${rootId}`]),
    /src\/runner\/iron-leaf-genuine-child-produced\.mjs/,
    "the leaf's own gated-module file really did land on the root branch -- this is the diff the trunk-boundary gate will see when the root itself merges",
  );
});

test('approve of a milestone blocks when a targeted item\'s root has unsynced drift, exit 4, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'closeout-root', { verify: 'true' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-root' });
  commitPending(cwd, 'state: add closeout-child');

  makeMilestone(cwd, 'closeout-milestone', ['closeout-child']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'closeout-milestone']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unsynced drift/);
  assert.match(result.stderr, /closeout-child/);
  assert.match(result.stderr, /closeout-root/);
  assert.match(result.stderr, /fgos sync-root/);
  assert.equal(gitHead(cwd), headBefore, 'a blocked close-out attempts no merge');
  assert.equal(stateView(cwd).work['closeout-milestone'].status, 'awaiting-approval');
});

test('approve of a milestone succeeds with --acknowledge-drift despite a targeted item\'s root having unsynced drift', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'closeout-ack-root', { verify: 'true' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-ack-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-ack-root' });
  commitPending(cwd, 'state: add closeout-ack-child');

  makeMilestone(cwd, 'closeout-ack-milestone', ['closeout-ack-child']);

  const result = run(cwd, ['approve', 'closeout-ack-milestone', '--acknowledge-drift']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-ack-milestone'].status, 'delivered');
});

test('approve of a milestone with no drift on any target succeeds normally, unaffected by the guard', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // A root with a real branch but zero drift (no leaf work landed on it
  // beyond main's own tip).
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-clean-root', title: 'root', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add closeout-clean-root');
  gitAtCwd(cwd, ['branch', 'fgw/closeout-clean-root', 'main']);
  addWork(dir, { id: 'closeout-clean-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'closeout-clean-root' });
  commitPending(cwd, 'state: add closeout-clean-child');

  makeMilestone(cwd, 'closeout-clean-milestone', ['closeout-clean-child']);

  const result = run(cwd, ['approve', 'closeout-clean-milestone']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-clean-milestone'].status, 'delivered');
});

test('approve of an ordinary item with no targets is completely unaffected by the close-out guard (regression)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'closeout-no-targets-item', { verify: 'true' });
  run(cwd, ['move', 'closeout-no-targets-item', '--to', 'doing']);
  run(cwd, ['move', 'closeout-no-targets-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'closeout-no-targets-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-no-targets-item'].status, 'delivered');
});

test('approve --github on a legacy (non-runner) item is a validation error, no state change, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-approve-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  // --pr present too — the source gate must still win over the --pr check.
  const result = run(cwd, ['approve', 'gh-approve-legacy', '--github', '--pr', '7'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-approve-legacy'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call');
});

test('approve --github without --pr is a validation error, item stays proposed, and mergeGitHubPR is never called', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-nopr');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-nopr', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /requires --pr/);
  assert.equal(stateView(cwd).work['gh-approve-nopr'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'no gh call is made when --pr is missing');
});

// tsk-396 D2: regression for the merge-before-gate ordering bug on the
// --github transport specifically. Before this fix, mergeGitHubPR (a real,
// server-side GitHub merge) ran BEFORE the acceptance-evidence gate — unlike
// a local git merge, a GitHub-side merge can't be aborted, so this path
// carried irreversible-merge risk the local paths don't. The fake gh here
// would succeed if invoked; the test proves it is never invoked at all.
test('approve --github --pr on an item with a missing-evidence acceptance clause is refused BEFORE the real GitHub merge: precondition, exit 2, mergeGitHubPR/gh is never called', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-cos-missing');
  run(cwd, ['edit', 'gh-approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'gh-approve-cos-missing');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-cos-missing', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['gh-approve-cos-missing'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the acceptance-evidence gate must reject before any gh CLI call, including the real merge');
});

test('approve --github with a dirty main tree is NOT blocked by the local dirty-tree gate and proceeds to the GitHub merge', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-dirty');
  commitPendingBeforeApprove(cwd, 'gh-approve-dirty');
  // An unrelated dirty file on main — a LOCAL approve would refuse this, but
  // a GitHub-side merge never touches the local tree, so it must not gate.
  fs.writeFileSync(path.join(cwd, 'unrelated-dirt.txt'), 'uncommitted\n');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-dirty', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /not clean/);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['gh-approve-dirty'].status, 'delivered');
});

test('approve --github --pr on a fake gh merge success transitions the item awaiting-approval -> delivered with role human', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-merged');
  commitPendingBeforeApprove(cwd, 'gh-approve-merged');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const mergedData = envelopeData(result.stdout);
  assert.equal(mergedData.prNumber, '42');
  assert.equal(mergedData.to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-merged'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['gh-approve-merged'], undefined);
});

test('approve --github --pr on a fake gh merge failure transitions awaiting-approval -> blocked and records friction with the classified reason, layer, and gh detail', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-blocked');
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-blocked', '--github', '--pr', '99'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const blockedData = envelopeData(result.stdout);
  assert.equal(blockedData.to, 'blocked');
  assert.equal(blockedData.reason, 'auth-failure');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-blocked'].status, 'blocked');
  const friction = view.frictions['gh-approve-blocked'][0];
  assert.equal(friction.errorClass, 'auth-failure');
  assert.equal(friction.layer, 'environment');
  assert.match(friction.detail, /Bad credentials/);
});

test('approve refuses from inside a registered session worktree (runner source) — no merge, item stays proposed, main HEAD unchanged, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  makeSessionSafeRunnerItem(cwd, 'approve-nested-runner', { verify: 'test -f approve-nested-runner-produced.txt' });
  const headBefore = gitHead(cwd);

  const session = createSession(cwd, { sessionId: 'sess-runner' });
  try {
    const result = run(session.worktreePath, ['approve', 'approve-nested-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-runner/, 'the refusal names the session id cwd is nested inside');
    assert.match(result.stderr, /session end/, 'the refusal tells the caller how to proceed');
    assert.equal(stateView(cwd).work['approve-nested-runner'].status, 'awaiting-approval', 'item is untouched — no merge, no state change');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — no merge landed');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('approve refuses from inside a registered session worktree (pull source) — refuses before any goal-check, item stays proposed, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-nested-pull', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-nested-pull']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-nested-pull']);

  const session = createSession(cwd, { sessionId: 'sess-pull' });
  try {
    // proof.txt exists at HEAD, so an unguarded pull-source approve would run
    // goal-check, pass, and mark the item done. The guard must refuse first.
    const result = run(session.worktreePath, ['approve', 'approve-nested-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-pull/, 'the refusal names the session id cwd is nested inside');
    assert.equal(stateView(cwd).work['approve-nested-pull'].status, 'awaiting-approval', 'item stays proposed — goal-check never ran to close it');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('approve from the main checkout is unaffected by the guard even while a session is registered — runner and pull both close to done, exit 0', () => {
  // runner source: main-checkout approve still merges fgw/<id> and closes.
  const cwdR = initSessionSafeCwd();
  run(cwdR, ['init']);
  makeSessionSafeRunnerItem(cwdR, 'approve-main-runner', { verify: 'test -f approve-main-runner-produced.txt' });
  const sessionR = createSession(cwdR, { sessionId: 'sess-active-runner' });
  try {
    const resR = run(cwdR, ['approve', 'approve-main-runner']);
    assert.equal(resR.status, 0, `runner approve from main must still succeed with a session active: ${resR.stderr}`);
    assert.equal(stateView(cwdR).work['approve-main-runner'].status, 'delivered');
  } finally {
    endSession(cwdR, sessionR.sessionId, { force: true });
  }

  // pull source: main-checkout approve still re-verifies on main and closes.
  const cwdP = initSessionSafeCwd();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-main-pull']);
  const sessionP = createSession(cwdP, { sessionId: 'sess-active-pull' });
  try {
    const resP = run(cwdP, ['approve', 'approve-main-pull']);
    assert.equal(resP.status, 0, `pull approve from main must still succeed with a session active: ${resP.stderr}`);
    assert.equal(stateView(cwdP).work['approve-main-pull'].status, 'delivered');
  } finally {
    endSession(cwdP, sessionP.sessionId, { force: true });
  }
});

test('approve refuses from an ad-hoc worktree never created through "fgos session start" (runner source) — no merge, item stays proposed, main HEAD unchanged, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-adhoc-runner', { verify: 'test -f approve-adhoc-runner-produced.txt' });
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-runner-branch');
  try {
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'awaiting-approval', 'sanity: the ad-hoc worktree really does see the item (real committed events log)');
    const result = run(worktreePath, ['approve', 'approve-adhoc-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'awaiting-approval', 'item is untouched — no merge, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve refuses from an ad-hoc worktree never created through "fgos session start" (pull source) — refuses before any goal-check, item stays proposed, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  commitPending(cwd, 'state: init');
  addOk(cwd, 'approve-adhoc-pull', { verify: 'test -f proof.txt' });
  commitPending(cwd, 'state: add');
  run(cwd, ['take', '--id', 'approve-adhoc-pull']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-adhoc-pull']);
  commitPending(cwd, 'state: return');

  // proof.txt exists at HEAD, so an unguarded ad-hoc-worktree approve would
  // run goal-check, pass, and mark the item done without ever having proven
  // anything about the actual main checkout — the exact silent
  // false-verification this guard must close.
  const worktreePath = addAdHocWorktree(cwd, 'adhoc-pull-branch');
  try {
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'awaiting-approval', 'sanity: the ad-hoc worktree really does see the item');
    const result = run(worktreePath, ['approve', 'approve-adhoc-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a false-verified goal-check: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'awaiting-approval', 'item stays proposed — goal-check never ran to close it');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve from the main checkout is unaffected by the ad-hoc-worktree guard — runner and pull both still close to done, exit 0', () => {
  const cwdR = initGitCwdMain();
  run(cwdR, ['init']);
  makeRunnerProposedItem(cwdR, 'approve-adhoc-main-runner', { verify: 'test -f approve-adhoc-main-runner-produced.txt' });
  commitPendingBeforeApprove(cwdR, 'approve-adhoc-main-runner');
  const resR = run(cwdR, ['approve', 'approve-adhoc-main-runner']);
  assert.equal(resR.status, 0, `runner approve from main must still succeed: ${resR.stderr}`);
  assert.equal(stateView(cwdR).work['approve-adhoc-main-runner'].status, 'delivered');

  const cwdP = initGitCwdMain();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-adhoc-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-adhoc-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-adhoc-main-pull']);
  commitPendingBeforeApprove(cwdP, 'approve-adhoc-main-pull');
  const resP = run(cwdP, ['approve', 'approve-adhoc-main-pull']);
  assert.equal(resP.status, 0, `pull approve from main must still succeed: ${resP.stderr}`);
  assert.equal(stateView(cwdP).work['approve-adhoc-main-pull'].status, 'delivered');
});

// --- approve --github + worktree guard (approve-worktree-guard-github-fix) -
//
// P1 finding (review-260718-concurrency-hard-gate-cluster): the --github
// branch (github-adapter) merged server-side and called moveWork/returned
// BEFORE the registry guard loop or isMainWorktree ever ran, so it was never
// covered by P44/approve-worktree-guard — a linked worktree (registered
// session or ad-hoc) running `approve --github` reached `done` while GitHub
// showed the PR merged, exactly the false-verification class the guard
// exists to close. Red-before-green: run against the pre-fix code (guards
// positioned after the `if (flags.github)` branch), each test below fails —
// approve reaches the gh fake and/or moveWork; after relocating the guards
// ahead of the --github branch, both refuse cleanly, proving the fix.

test('approve --github --pr refuses from an ad-hoc worktree never created through "fgos session start" — no gh call, no moveWork, item stays proposed, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-adhoc-github', { verify: 'test -f approve-adhoc-github-produced.txt' });
  const headBefore = gitHead(cwd);
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-github-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-adhoc-github', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal, not a GitHub merge from an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /main working tree/, 'the structural worktree-identity message, not the --github source-mismatch message');
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-adhoc-github'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve --github --pr refuses from inside a registered session worktree, with the registry guard\'s friendlier session-naming message (same precedence as the local path) — no gh call, item stays proposed, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  makeSessionSafeRunnerItem(cwd, 'approve-session-github', { verify: 'test -f approve-session-github-produced.txt' });
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const session = createSession(cwd, { sessionId: 'sess-github' });
  try {
    const result = run(session.worktreePath, ['approve', 'approve-session-github', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-github/, "the registry guard's friendlier session-naming message wins, not the generic structural message");
    assert.match(result.stderr, /session end/, 'the refusal tells the caller how to proceed');
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-session-github'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

// review-20260718-self-improve-loop finding f01: the Iron Law check was
// hoisted ahead of the --github branch so a self-modifying diff cannot land
// via GitHub without ever being classified, mirroring the local path exactly.

test('approve --github --pr on a runner item touching a self-modifying-capable module REFUSES without --acknowledge-iron-law -- no gh call, item stays proposed, exit 4 (f01)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'gh-iron-refuse-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-iron-refuse-item', '--github', '--pr', '13'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `expected a clean Iron Law refusal, not a GitHub merge: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.ok(!fs.existsSync(marker), 'the Iron Law gate must refuse before any gh CLI call');
  assert.equal(stateView(cwd).work['gh-iron-refuse-item'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
});

test('approve --github --pr on the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges via the fake gh, awaiting-approval -> done (f01)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'gh-iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  commitPendingBeforeApprove(cwd, 'gh-iron-ack-item');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-iron-ack-item', '--github', '--acknowledge-iron-law', '--pr', '14'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `approve --github with acknowledgment must succeed: ${result.stdout}${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['gh-iron-ack-item'].status, 'delivered');
});

test('approve on a proposed item with a missing-evidence acceptance clause is refused the same way as move --to done: precondition, exit 2, item stays proposed, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-cos-missing', { verify: 'true' });
  run(cwd, ['edit', 'approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  run(cwd, ['move', 'approve-cos-missing', '--to', 'doing']);
  run(cwd, ['move', 'approve-cos-missing', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['approve', 'approve-cos-missing']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['approve-cos-missing'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
});

// tsk-396 D1: regression for the merge-before-gate ordering bug. Before this
// fix, a runner-sourced item's real `git merge` (mergeRunnerItem) landed on
// main BEFORE the acceptance-evidence gate ran (inside moveWork's own
// `to === 'delivered'` check), so a refused gate here would still leave a
// merge commit on main. assertAcceptanceEvidence now runs as a pre-flight,
// before mergeRunnerItem is ever called — this test proves main's HEAD is
// completely untouched by a refused approve, not just that approve reports
// an error.
test('approve on a runner-sourced item with a missing-evidence acceptance clause is refused BEFORE the real git merge: precondition, exit 2, main HEAD unchanged, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-cos-missing');
  run(cwd, ['edit', 'runner-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'runner-cos-missing');

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  const result = run(cwd, ['approve', 'runner-cos-missing']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ship it/);

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-cos-missing'].status, 'awaiting-approval');
});

// tsk-2p6: same pre-flight-before-merge shape as the acceptance-evidence
// regression test immediately above, for the plan-evidence gate.
test('approve on a risk:heavy runner-sourced item with no plan.md on its branch is refused BEFORE the real git merge: precondition, main HEAD unchanged, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-heavy-no-plan', { risk: 'heavy' });

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  const result = run(cwd, ['approve', 'runner-heavy-no-plan']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /no plan\.md found on branch "fgw\/runner-heavy-no-plan"/);

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-heavy-no-plan'].status, 'awaiting-approval');
});

test('approve on a risk:heavy runner-sourced item that DOES carry a plan.md on its branch succeeds normally', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-heavy-with-plan', { risk: 'heavy', verify: 'test -f runner-heavy-with-plan-produced.txt' });

  // makeRunnerProposedItem's own commit landed on fgw/<id> while main was
  // checked out -- add the plan.md as a follow-up commit on that same
  // branch, mirroring how a real session commits plan.md during planning.
  gitAtCwd(cwd, ['checkout', 'fgw/runner-heavy-with-plan']);
  fs.mkdirSync(path.join(cwd, 'docs', 'history', 'runner-heavy-with-plan'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'history', 'runner-heavy-with-plan', 'plan.md'), '# plan\n');
  gitAtCwd(cwd, ['add', 'docs']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'plan']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['approve', 'runner-heavy-with-plan']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['runner-heavy-with-plan'].status, 'delivered');
});

// --- tsk-480: approve's post-success moveWork guard ------------------------
//
// The bug: approve's own success paths call moveWork(...to:'delivered'...)
// as their last step. Before this fix, a throw there (e.g. an
// EventLogError('lock-timeout') from events.lock contention) propagated
// uncaught even though the precondition it was recording (a real merge, or
// a passed verify) had already happened — leaving the item stuck at
// awaiting-approval with zero diagnostic trail. FGOS_TEST_FORCE_APPROVE_
// LOCK_TIMEOUT (bin/fgos.mjs's moveDeliveredOrRecordFault) is a test-only
// seam, same shape as FGOS_GH_COMMAND, that simulates exactly that failure
// for one named item id without touching moveWork/store.mjs itself.

test('approve (pull-door/verify-only): a simulated post-verify lock-timeout is caught, recorded, and left diagnosable instead of crashing uncaught', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-lock-timeout', { verify: 'true' });
  run(cwd, ['move', 'approve-lock-timeout', '--to', 'doing']);
  run(cwd, ['move', 'approve-lock-timeout', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['approve', 'approve-lock-timeout'], { FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT: 'approve-lock-timeout' });

  // Caught, not an uncaught crash: exit 0, a well-formed envelope, not the
  // generic "fgos: <message>" exit-1/exit-2 shape an unhandled throw would
  // have produced.
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.mode, 'verify-only');
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.deliveryUnrecorded, true);
  assert.match(data.error, /lock-timeout/);
  assert.ok(data.diagnosticLog, 'envelope must point at a real diagnostic log path');

  // Visible immediately to whoever is watching the terminal, not just to a
  // later reader of the JSON envelope or the log file.
  assert.match(result.stderr, /status write failed/);
  assert.match(result.stderr, /diagnostic recorded/);

  // The status write genuinely never happened — no new event, item stays
  // exactly where it was, never silently promoted to "delivered".
  assert.equal(stateView(cwd).work['approve-lock-timeout'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);

  // The diagnostic record is real and on disk, independent of events.jsonl.
  const diagnosticLines = fs.readFileSync(data.diagnosticLog, 'utf8').trim().split('\n');
  const record = JSON.parse(diagnosticLines.at(-1));
  assert.equal(record.id, 'approve-lock-timeout');
  assert.equal(record.phase, 'pull-door verify-only');
  assert.match(record.detail, /lock-timeout/);
});

test('approve (pull-door/verify-only): with no simulated failure, the same item approves normally — the guard changes nothing on the happy path', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-lock-timeout-control', { verify: 'true' });
  run(cwd, ['move', 'approve-lock-timeout-control', '--to', 'doing']);
  run(cwd, ['move', 'approve-lock-timeout-control', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['approve', 'approve-lock-timeout-control']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.to, 'delivered');
  assert.equal(data.deliveryUnrecorded, undefined);
  assert.equal(typeof data.seq, 'number');
  assert.equal(stateView(cwd).work['approve-lock-timeout-control'].status, 'delivered');
});

test('approve --no-wait fails immediately on a live-held lock, main left untouched -- merge next inherits the same flag by forwarding, per bin/fgos.mjs:1152', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'wait-no-wait-approve', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-no-wait-approve');
  writeLiveLock(cwd, 1000);

  const start = Date.now();
  const result = run(cwd, ['approve', 'wait-no-wait-approve', '--no-wait']);
  const elapsed = Date.now() - start;

  // 9 ('merge-fail'), not 7 ('lock-timeout') -- MergeError's category is
  // unconditionally 'merge-fail' for every failure mode (pre-existing,
  // unrelated to this item's own `code` discriminator addition).
  assert.equal(result.status, 9, result.stderr);
  assert.match(result.stderr, /main checkout is locked by pid \d+/);
  assert.ok(elapsed < 2000, `--no-wait must fail fast (took ${elapsed}ms)`);
  assert.equal(stateView(cwd).work['wait-no-wait-approve'].status, 'awaiting-approval', 'a refused-before-merge attempt must leave the item exactly where it was');
});

test('approve of a runner item is blocked (reason merge-blocked-other-item), not misclassified as a conflict, when the main checkout already has an unrelated item\'s pre-existing MERGE_HEAD -- and that other item\'s merge state is left untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-blocked-item');

  // Simulate another item's in-progress/abandoned merge already staged on
  // the main checkout by a concurrent session -- a real, unrelated branch,
  // staged but never committed or aborted.
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/other-blocker-item']);
  fs.writeFileSync(path.join(cwd, 'other-blocker-produced.txt'), 'other\n');
  gitAtCwd(cwd, ['add', 'other-blocker-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for other-blocker-item']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', 'fgw/other-blocker-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-blocked-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.equal(data.reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged');
  assert.doesNotThrow(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'the other item\'s MERGE_HEAD must survive untouched',
  );
  assert.match(gitAtCwd(cwd, ['diff', '--name-only', '--cached']), /other-blocker-produced\.txt/);
  assert.equal(fs.existsSync(path.join(cwd, 'approve-blocked-item-produced.txt')), false, 'the approved item\'s own merge must never have been attempted');

  const view = stateView(cwd);
  assert.equal(view.work['approve-blocked-item'].status, 'blocked');
  assert.equal(view.frictions['approve-blocked-item'][0].errorClass, 'merge-blocked-other-item');
});

test('approve of a root item, whose merge into main hits a pre-existing MERGE_HEAD from an unrelated item, parks with reason merge-blocked-other-item (root→main call site, tsk-4hj D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'approve-blocked-root-item');
  run(cwd, ['move', 'approve-blocked-root-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim approve-blocked-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/approve-blocked-root-item']);
  fs.writeFileSync(path.join(cwd, 'approve-blocked-root-item-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'approve-blocked-root-item-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for approve-blocked-root-item']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'approve-blocked-root-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose approve-blocked-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/other-blocker-root-item']);
  fs.writeFileSync(path.join(cwd, 'other-blocker-root-produced.txt'), 'other\n');
  gitAtCwd(cwd, ['add', 'other-blocker-root-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for other-blocker-root-item']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', 'fgw/other-blocker-root-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-blocked-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged');
  assert.doesNotThrow(() => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']));

  const view = stateView(cwd);
  assert.equal(view.work['approve-blocked-root-item'].status, 'blocked');
  assert.equal(view.frictions['approve-blocked-root-item'][0].errorClass, 'merge-blocked-other-item');
});

test('approve of a leaf whose own root is delivered refuses, exit 4, item stays awaiting-approval, no merge attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'resolved-root', 'resolved-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'resolved-root', 'delivered');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'resolved-root-leaf']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /resolved-root/);
  assert.match(result.stderr, /delivered/);
  assert.match(result.stderr, /fgos sync-root/);
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge');
  assert.equal(stateView(cwd).work['resolved-root-leaf'].status, 'awaiting-approval');
});

test('approve of a leaf whose own root is wontfix ALSO refuses (D2 — wontfix blocks too, not just delivered/retrospective/cleanup/done)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'wontfix-root', 'wontfix-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'wontfix-root', 'wontfix');

  const result = run(cwd, ['approve', 'wontfix-root-leaf']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /wontfix-root/);
  assert.equal(stateView(cwd).work['wontfix-root-leaf'].status, 'awaiting-approval');
});

test('approve of a leaf whose own root is delivered succeeds with --acknowledge-drift, merges onto fgw/<root> same as before', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'resolved-root-ack', 'resolved-root-ack-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'resolved-root-ack', 'delivered');

  const result = run(cwd, ['approve', 'resolved-root-ack-leaf', '--acknowledge-drift']);
  assert.equal(result.status, 0, result.stderr);
  const approveData = envelopeData(result.stdout);
  assert.equal(approveData.target, 'fgw/resolved-root-ack');
  assert.equal(stateView(cwd).work['resolved-root-ack-leaf'].status, 'delivered');
});

test('approve of a leaf whose root is still open (not resolved) is unaffected by the resolved-root guard (regression)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'open-root', 'open-root-leaf', { verify: 'true' });
  // root stays at its default 'todo' status — never resolved.

  const result = run(cwd, ['approve', 'open-root-leaf']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['open-root-leaf'].status, 'delivered');
});

test('approve of a root-to-main item (no parent) is unaffected by the resolved-root guard even though the item is a fresh proposal (regression)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'standalone-root-item', { verify: 'true' });

  const result = run(cwd, ['approve', 'standalone-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['standalone-root-item'].status, 'delivered');
});

test('approve --github --pr on a leaf whose own root is delivered ALSO refuses before any gh call (hoisted ahead of --github, same as the Iron Law gate), gh is never invoked', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'gh-resolved-root', 'gh-resolved-root-leaf', { verify: 'true' });
  moveRootToResolved(cwd, 'gh-resolved-root', 'delivered');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-resolved-root-leaf', '--github', '--pr', '7'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4);
  assert.match(result.stderr, /gh-resolved-root/);
  assert.equal(stateView(cwd).work['gh-resolved-root-leaf'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the resolved-root guard must refuse before any gh CLI call');
});

test('approve --trust-dir with --dir succeeds from inside an ad-hoc worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-trust-dir', { verify: 'test -f approve-trust-dir-produced.txt' });

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-trust-dir-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-trust-dir', '--trust-dir', '--dir', cwd]);
    assert.equal(result.status, 0, `approve --trust-dir --dir from an ad-hoc worktree unexpectedly failed: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-trust-dir'].status, 'delivered');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve --trust-dir WITHOUT --dir is a no-op -- still refuses from inside an ad-hoc worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-trust-dir-noop', { verify: 'test -f approve-trust-dir-noop-produced.txt' });
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-trust-dir-noop-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-trust-dir-noop', '--trust-dir']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-trust-dir-noop'].status, 'awaiting-approval', 'item is untouched — no merge, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve --github --pr --trust-dir WITHOUT --dir is a no-op -- still refuses from an ad-hoc worktree before any gh call (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-gh-trust-noop', { verify: 'test -f approve-gh-trust-noop-produced.txt' });
  const headBefore = gitHead(cwd);
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-github-trust-dir-noop-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-gh-trust-noop', '--github', '--pr', '9', '--trust-dir'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal, not a GitHub merge from an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-gh-trust-noop'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

