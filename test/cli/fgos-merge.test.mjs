// fgos-merge.test.mjs -- phần "merge, review, promote-to-component, sync-root" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
// The retrospective-content gate itself, so the two tests below can assert
// the CONSEQUENCE of tagging these verbs' decisions as engine bookkeeping —
// not merely that the field is present. Imported straight from src rather
// than re-exported through the harness: only these two tests need it.
import { checkRetrospectiveContent } from '../../src/state/cleanup-harness.mjs';
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


test('review on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['review', 'ghost']);
  assert.equal(result.status, 4);
});


test('review on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'not-proposed-review');
  const result = run(cwd, ['review', 'not-proposed-review']);
  assert.equal(result.status, 2);
});


test('review of a runner-source proposed item prints the branch diff and no warnings, exit 0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'review-runner-item');

  const result = run(cwd, ['review', 'review-runner-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.mode, 'local');
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-runner-item-produced\.txt/);
  assert.deepEqual(data.warnings, []);
});


test('review of a pull-door proposed item prints the headAtTake..headAtReturn diff, exit 0', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'review-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'review-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'review-pull-item']);

  const result = run(cwd, ['review', 'review-pull-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'pull');
  assert.match(data.diff, /proof\.txt/);
  assert.deepEqual(data.warnings, []);
});


test('review of a legacy proposed item (no branch, no headAtTake/headAtReturn) degrades honestly — a warning, no throw, exit 0 (must_have: legacy degrade)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'review-legacy-item');
  run(cwd, ['move', 'review-legacy-item', '--to', 'doing']);
  run(cwd, ['move', 'review-legacy-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['review', 'review-legacy-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'legacy');
  assert.match(data.warnings.join('\n'), /no live diff source/);
});


test('review of a leaf proposed item diffs against its resolved root branch (fgw/<root>), not main', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'review-leaf-root', 'review-leaf-child', { rootDivergesFromMain: true });

  const result = run(cwd, ['review', 'review-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-leaf-child-produced\.txt/);
  assert.doesNotMatch(data.diff, /root-only\.txt/, 'diff against fgw/<root> must not include the root branch\'s own divergence from main');
});


test('review of a root proposed item is unchanged — still diffs against main (regression)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'review-root-regression-item');

  const result = run(cwd, ['review', 'review-root-regression-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-root-regression-item-produced\.txt/);
});


test('sync-root on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const result = run(cwd, ['sync-root', 'sync-root-ghost']);
  assert.equal(result.status, 4);
});


test('sync-root on a root with no fgw/<id> branch is rejected as validation, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'sync-root-no-branch', { verify: 'true' });
  const result = run(cwd, ['sync-root', 'sync-root-no-branch']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /does not exist/);
});


test('sync-root happy path: merges fgw/<root> into main, root item status/stage UNCHANGED, fgw/<root> survives (not deleted)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-happy', { verify: `test -f sync-root-happy-produced.txt` });
  commitPendingBeforeApprove(cwd, 'sync-root-happy');

  const result = run(cwd, ['sync-root', 'sync-root-happy']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'synced');
  assert.equal(data.target, 'main');
  assert.equal(data.branch, 'fgw/sync-root-happy');

  assert.ok(fs.existsSync(path.join(cwd, 'sync-root-happy-produced.txt')), 'the synced content must land on main');

  const view = stateView(cwd);
  assert.equal(view.work['sync-root-happy'].status, 'doing', 'sync-root must never change the root item\'s own status');

  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/sync-root-happy\b/, 'sync-root must NOT delete the root branch — it stays open for further leaf merges');
});


test('sync-root records a real decision on the root item', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-decision', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-decision');

  const result = run(cwd, ['sync-root', 'sync-root-decision']);
  assert.equal(result.status, 0, result.stderr);

  const lines = eventLines(cwd);
  const decisionEvents = lines.map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === 'sync-root-decision');
  assert.equal(decisionEvents.length, 1, 'sync-root must append exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /sync-root-decision|fgw\/sync-root-decision/);
});


// A branch sync is machinery, not reflection. The record above still exists
// and still shows in `fgos show` (which filters decisions by id, never by
// kind) -- but it must not read as someone having thought about the work,
// because that is the one thing standing between an item and `done`.
// Untagged, it satisfied the retrospective gate outright: the same hole
// tsk-qrs closed for the driver's closing report, still open through this
// verb. Asserted end to end, on the decision the real verb actually wrote,
// because the gate itself was never the defective half.
test('sync-root tags its decision as engine bookkeeping, so it cannot satisfy the retrospective gate', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-engine-kind', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-engine-kind');

  const result = run(cwd, ['sync-root', 'sync-root-engine-kind']);
  assert.equal(result.status, 0, result.stderr);

  const decisionEvents = eventLines(cwd)
    .map((l) => JSON.parse(l))
    .filter((e) => e.type === 'decision' && e.payload?.id === 'sync-root-engine-kind');
  assert.equal(decisionEvents.length, 1, 'still exactly one decision record -- tagging must not change how many are written');
  assert.equal(decisionEvents[0].payload.kind, 'engine', 'a mechanical branch sync is engine bookkeeping, not a design decision');

  const gate = checkRetrospectiveContent(stateView(cwd), 'sync-root-engine-kind', cwd);
  assert.equal(gate.ok, false, 'a synced root with no retrospective document must not pass the cleanup gate on its sync record alone');
});


test('sync-root nested: a root with a parent merges into fgw/<parentId>, not main; main stays untouched; the child root\'s status stays unchanged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // grandroot (target for the nested sync) is itself a plain root with a
  // real branch but no drift of its own.
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'sync-root-grandparent', title: 'Title grandparent', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add grandparent');

  // fgw/<grandparent> must be cut AFTER the child's own state events (add +
  // claim, inside makeDriftedRoot) already landed on main — cutting it
  // earlier leaves fgw/child's later commits carrying a legitimate .fgos/
  // diff relative to fgw/grandparent (the child's add/claim events main
  // gained afterward), which mergeRunnerItem's ADR0020 guard correctly
  // refuses as fgos-write-rejected. Same ordering makeDriftedRoot's own
  // `checkout -b fgw/<rootId>` already relies on for its OWN branch.
  makeDriftedRoot(cwd, 'sync-root-nested-child', { parent: 'sync-root-grandparent', verify: `test -f sync-root-nested-child-produced.txt` });
  gitAtCwd(cwd, ['branch', 'fgw/sync-root-grandparent', 'main']);
  commitPendingBeforeApprove(cwd, 'sync-root-nested-child');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-nested-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.target, 'fgw/sync-root-grandparent');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged by a nested sync-root');
  assert.equal(
    fs.existsSync(path.join(cwd, 'sync-root-nested-child-produced.txt')),
    false,
    'the nested child\'s content must not land on the human\'s own main checkout',
  );
  const producedOnParent = gitAtCwd(cwd, ['show', 'fgw/sync-root-grandparent:sync-root-nested-child-produced.txt']);
  assert.match(producedOnParent, /ok/);

  const view = stateView(cwd);
  assert.equal(view.work['sync-root-nested-child'].status, 'doing');
});


test('sync-root aborts cleanly on a genuine conflict: main left byte-for-byte unchanged, root status untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-conflict', { verify: 'true' });
  // Create a conflicting change on main AFTER the root branch forked, on
  // the exact same path the root's own commit touches.
  fs.writeFileSync(path.join(cwd, 'sync-root-conflict-produced.txt'), 'conflicting main content\n');
  gitAtCwd(cwd, ['add', 'sync-root-conflict-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'unrelated main edit that collides']);
  commitPendingBeforeApprove(cwd, 'sync-root-conflict');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-conflict']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted sync-root');
  assert.equal(stateView(cwd).work['sync-root-conflict'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');
});


test('sync-root on a no-parent root refuses when the shared main checkout carries an uncommitted change on a path the root itself touches, exit 4, no merge lands (tsk-66t)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-dirty', { verify: 'true' });
  // sync-root-dirty-produced.txt IS in this root's own fgw/sync-root-dirty
  // diff (makeDriftedRoot committed it there) — re-dirtying that SAME path
  // on main, uncommitted, is the own-file-set conflict this gate exists to
  // catch (mirrors approve's own real-conflict test, tsk-598 D2: an
  // UNRELATED dirty path is explicitly tolerated by isMainTreeClean's own
  // ownFileSet scoping, so the negative case here must be a same-path one).
  fs.writeFileSync(path.join(cwd, 'sync-root-dirty-produced.txt'), 'clobbered by another writer\n'); // never git add/commit

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-dirty']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /is not clean/);

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged when sync-root refuses on a dirty tree');
  assert.equal(fs.readFileSync(path.join(cwd, 'sync-root-dirty-produced.txt'), 'utf8'), 'clobbered by another writer\n', 'the uncommitted local change must survive untouched');
  assert.equal(stateView(cwd).work['sync-root-dirty'].status, 'doing', 'a refused sync-root must never touch the root item\'s status');
});


test('sync-root refuses from inside a linked worktree (must land on the real main checkout)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-worktree-guard', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-worktree-guard');

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-sync-root-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'sync-root-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'sync-root', 'sync-root-worktree-guard'], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /main checkout/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});


// --- sync-root Iron Law + verify-fail (tsk-n2x, docs/history/sync-root-
// direct-outcome-tests/) -----------------------------------------------
//
// The 2 sync-root outcomes with no DIRECT test coverage until this item:
// the Iron Law refusal (validation, exit 4, before any git mutation) and
// the verify-fail blocked outcome. Mirrors approve's own already-proven
// pattern for the same 2 outcomes (makeRunnerProposedItemTouching /
// approve-verify-fail-item, above), adapted to sync-root's own
// makeDriftedRoot helper and outcome shape -- unlike approve, sync-root
// never changes the root item's own status.

test('sync-root of a root whose diff touches a self-modifying-capable module REFUSES without --acknowledge-iron-law: exit 4, root status untouched, no merge', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'sync-root-iron-refuse', title: 'Title sync-root-iron-refuse', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'test -f src/runner/probe.mjs' });
  commitPending(cwd, 'state: add sync-root-iron-refuse');
  run(cwd, ['move', 'sync-root-iron-refuse', '--to', 'doing']);
  commitPending(cwd, 'state: claim sync-root-iron-refuse');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/sync-root-iron-refuse']);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/probe.mjs'), 'export const produced = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for sync-root-iron-refuse']);
  gitAtCwd(cwd, ['checkout', 'main']);
  commitPendingBeforeApprove(cwd, 'sync-root-iron-refuse');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-iron-refuse']);
  assert.equal(result.status, 4, `expected a validation refusal: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.match(result.stderr, /--acknowledge-iron-law/);

  assert.equal(gitHead(cwd), headBefore, 'a refused sync-root attempts no merge -- HEAD is unchanged');
  const view = stateView(cwd);
  assert.equal(view.work['sync-root-iron-refuse'].status, 'doing', 'sync-root must never change the root item\'s own status, including on Iron Law refusal');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/sync-root-iron-refuse/, 'the branch survives an Iron Law refusal -- nothing was merged or cleaned up');
});


test('sync-root of a root whose staged merge fails its own verify: outcome blocked reason verify-fail, root status untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-verify-fail', { verify: 'test -f file-never-produced.txt' });
  commitPendingBeforeApprove(cwd, 'sync-root-verify-fail');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-verify-fail']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'verify-fail');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted sync-root');
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-verify-fail-produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');

  const view = stateView(cwd);
  assert.equal(view.work['sync-root-verify-fail'].status, 'doing', 'sync-root must never change the root item\'s own status, including on a verify-fail block');
});


test('promote-to-component requires at least 2 ids, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-solo-a');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-solo-a', '--root-title', 'Component solo']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /at least 2/);
});


test('promote-to-component on a nonexistent member id is rejected as validation, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-real-a');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-real-a,ptc-ghost', '--root-title', 'Component ghost']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /ptc-ghost.*not found/);
});


test('promote-to-component refuses a member that already has a parent, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-sibling');
  makeFlatMember(cwd, 'ptc-already-parented', { deps: ['ptc-sibling'] });
  editWork(path.join(cwd, '.fgos'), { id: 'ptc-already-parented', patch: { parent: 'some-other-root' } });
  commitPending(cwd, 'state: pre-parent ptc-already-parented');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-already-parented,ptc-sibling', '--root-title', 'Component reject']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /already has parent/);
});


test('promote-to-component refuses ids that are not connected via deps/mergeAfter, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-disconnected-a');
  makeFlatMember(cwd, 'ptc-disconnected-b');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-disconnected-a,ptc-disconnected-b', '--root-title', 'Component disconnected']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not all connected/);
});


test('promote-to-component happy path (D1 new-item): creates a fresh root, merges both members into it, sets parent only after real success, records one decision', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  registerFlatMember(cwd, 'ptc-new-root-a');
  registerFlatMember(cwd, 'ptc-new-root-b', { deps: ['ptc-new-root-a'] });
  commitPending(cwd, 'state: setup ptc-new-root members');
  cutMemberBranch(cwd, 'ptc-new-root-a');
  cutMemberBranch(cwd, 'ptc-new-root-b');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-new-root-a,ptc-new-root-b', '--root-title', 'Component new root']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.rootCreated, true);
  assert.equal(data.results.find((r) => r.id === 'ptc-new-root-a').outcome, 'merged');
  assert.equal(data.results.find((r) => r.id === 'ptc-new-root-b').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-new-root-a'].parent, data.rootId);
  assert.equal(view.work['ptc-new-root-b'].parent, data.rootId);
  assert.equal(view.work[data.rootId].status, 'todo', 'a freshly created root is not claimed by this action');

  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', `fgw/${data.rootId}`]);
  assert.match(rootFiles, /ptc-new-root-a-produced\.txt/);
  assert.match(rootFiles, /ptc-new-root-b-produced\.txt/);

  const decisionEvents = eventLines(cwd).map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === data.rootId);
  assert.equal(decisionEvents.length, 1, 'promote-to-component must append exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /ptc-new-root-a/);
  assert.match(decisionEvents[0].payload.text, /ptc-new-root-b/);

  // Same reasoning as sync-root's own engine-kind test above: converging
  // siblings into a component is machinery, so its record must not read as
  // reflection at the retrospective gate.
  assert.equal(decisionEvents[0].payload.kind, 'engine', 'a mechanical component promotion is engine bookkeeping, not a design decision');
  const gate = checkRetrospectiveContent(stateView(cwd), data.rootId, cwd);
  assert.equal(gate.ok, false, 'a promoted root with no retrospective document must not pass the cleanup gate on its promotion record alone');
});


test('promote-to-component happy path (D1 reuse-member): promotes an existing member to root, root itself is skipped not merged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // Connectivity edge direction matters here: buildUnifiedAdjacency
  // (src/state/dep-graph.mjs) adds parent -> child for a `parent` edge and
  // id -> target for both `deps` and `mergeAfter` — the SAME direction.
  // Promoting ptc-reuse-root to root sets ptc-reuse-other.parent =
  // 'ptc-reuse-root' (edge root -> other); if the connectivity edge were
  // ptc-reuse-other -> ptc-reuse-root (either field), that closes a real
  // cycle (see the dedicated merged-parent-rejected test below). Declaring
  // the edge on the ROOT side instead (root -> other) matches the parent
  // edge's own direction, so no cycle — this is the genuine happy path.
  registerFlatMember(cwd, 'ptc-reuse-other');
  registerFlatMember(cwd, 'ptc-reuse-root', { mergeAfter: ['ptc-reuse-other'] });
  commitPending(cwd, 'state: setup ptc-reuse members');
  cutMemberBranch(cwd, 'ptc-reuse-root');
  cutMemberBranch(cwd, 'ptc-reuse-other');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-reuse-root,ptc-reuse-other', '--root-id', 'ptc-reuse-root']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.rootCreated, false);
  assert.equal(data.rootId, 'ptc-reuse-root');
  assert.equal(data.results.find((r) => r.id === 'ptc-reuse-root').outcome, 'skipped');
  assert.equal(data.results.find((r) => r.id === 'ptc-reuse-other').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-reuse-other'].parent, 'ptc-reuse-root');
  assert.equal(view.work['ptc-reuse-root'].parent, undefined, 'root never sets its own parent to itself');

  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', 'fgw/ptc-reuse-root']);
  assert.match(rootFiles, /ptc-reuse-other-produced\.txt/);
});


test('promote-to-component reports merged-parent-rejected (never crashes) when the real git merge succeeds but setting parent would close a deps+parent cycle', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  registerFlatMember(cwd, 'ptc-cycle-root');
  // deps (not mergeAfter) deliberately: ptc-cycle-other depends on the very
  // item this test promotes to root, so setting ptc-cycle-other.parent =
  // 'ptc-cycle-root' afterward closes a real deps+parent cycle
  // (assertNoUnifiedCycle) — the exact failure mode the try/catch around
  // editWork above exists for.
  registerFlatMember(cwd, 'ptc-cycle-other', { deps: ['ptc-cycle-root'] });
  commitPending(cwd, 'state: setup ptc-cycle members');
  cutMemberBranch(cwd, 'ptc-cycle-root');
  cutMemberBranch(cwd, 'ptc-cycle-other');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-cycle-root,ptc-cycle-other', '--root-id', 'ptc-cycle-root']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  const otherResult = data.results.find((r) => r.id === 'ptc-cycle-other');
  assert.equal(otherResult.outcome, 'merged-parent-rejected');
  assert.match(otherResult.reason, /graph cycle/);

  // The real git merge landed regardless of the state-layer rejection —
  // this outcome exists precisely because git succeeded where state didn't.
  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', 'fgw/ptc-cycle-root']);
  assert.match(rootFiles, /ptc-cycle-other-produced\.txt/);

  const view = stateView(cwd);
  assert.equal(view.work['ptc-cycle-other'].parent, undefined, 'a rejected parent-set never silently applies anyway');

  const decisionEvents = eventLines(cwd).map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === data.rootId);
  assert.equal(decisionEvents.length, 1, 'a per-member rejection still gets exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /ptc-cycle-other/);
});


test('promote-to-component bails a conflicting member without setting its parent, still processes and merges the rest', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'ptc-conflict-b', title: 'Title conflict b', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  addWork(dir, { id: 'ptc-conflict-a', title: 'Title conflict a', kind: 'task', status: 'todo', deps: ['ptc-conflict-b'], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add ptc-conflict members');
  run(cwd, ['move', 'ptc-conflict-a', '--to', 'doing']);
  run(cwd, ['move', 'ptc-conflict-b', '--to', 'doing']);
  commitPending(cwd, 'state: claim ptc-conflict members');

  // ptc-conflict-a edits seed.txt one way; the fresh root (branched from
  // current main) will independently... actually the root is created AFTER
  // this, from main's current tip, so give the root-to-be a conflicting
  // edit by pre-seeding seed.txt differently on a throwaway commit on main
  // first, then letting ptc-conflict-a diverge from an EARLIER point.
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/ptc-conflict-a']);
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'edited by ptc-conflict-a\n');
  gitAtCwd(cwd, ['add', 'seed.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'ptc-conflict-a edits seed.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'edited by main after branch cut\n');
  gitAtCwd(cwd, ['add', 'seed.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main also edits seed.txt']);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/ptc-conflict-b']);
  fs.writeFileSync(path.join(cwd, 'ptc-conflict-b-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'ptc-conflict-b-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'work for ptc-conflict-b']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-conflict-a,ptc-conflict-b', '--root-title', 'Component conflict']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  const aResult = data.results.find((r) => r.id === 'ptc-conflict-a');
  const bResult = data.results.find((r) => r.id === 'ptc-conflict-b');
  assert.equal(aResult.outcome, 'bailed');
  assert.equal(aResult.reason, 'merge-conflict');
  assert.equal(bResult.outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-conflict-a'].parent, undefined, 'a bailed member never gets parent set');
  assert.equal(view.work['ptc-conflict-b'].parent, data.rootId);
});


test('review --github on a legacy (non-runner) item is a validation error, no state change, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-review-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['review', 'gh-review-legacy', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-review-legacy'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call');
});


test('review --github on a runner item pushes the branch and opens a PR via a real subprocess-injected fake gh, reports the PR number, and never mutates FSM state', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-review-ok');
  addBareOrigin(cwd);
  const ghLog = path.join(cwd, 'gh-invocations.log');
  const fake = writeCreateFake(cwd, ghLog, 314);

  const result = run(cwd, ['review', 'gh-review-ok', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const ghData = envelopeData(result.stdout);
  assert.equal(ghData.outcome, 'created');
  assert.equal(ghData.prNumber, 314);
  assert.equal(ghData.head, 'fgw/gh-review-ok');
  assert.equal(ghData.base, 'main');

  // Crossed the real process boundary: the fake logged its argv.
  assert.match(fs.readFileSync(ghLog, 'utf8'), /pr create .*-H fgw\/gh-review-ok -B main/);
  // The branch really got pushed to origin.
  assert.match(execFileSync('git', ['ls-remote', '--heads', 'origin', 'fgw/gh-review-ok'], { cwd, encoding: 'utf8' }), /fgw\/gh-review-ok/);
  // review stays read-only on FSM state.
  assert.equal(stateView(cwd).work['gh-review-ok'].status, 'awaiting-approval');
});


test('review --github reports a gh failure as plain output with no state mutation (read-only contract holds on the blocked path)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-review-blocked');
  addBareOrigin(cwd);
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['review', 'gh-review-blocked', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const ghData = envelopeData(result.stdout);
  assert.equal(ghData.outcome, 'failed');
  assert.equal(ghData.reason, 'auth-failure');
  assert.equal(stateView(cwd).work['gh-review-blocked'].status, 'awaiting-approval', 'review never transitions state, even on a gh failure');
  assert.equal(stateView(cwd).frictions?.['gh-review-blocked'], undefined, 'review never records friction');
});


// --- `review --github --pr <n>` read-only status check (github-adapter D6/D4) ---
//
// Detection-only: reports an existing PR's live GitHub status and never mutates
// FSM state or friction under any outcome (a GitHub-side close is not itself an
// approval or reject action — only local `fgos reject` moves the item, D6).
// Classification branches solely on `closed` + `mergedAt`, never the `state`
// string (S1's spike never observed state's closed/merged values). Every gh is
// the same subprocess-injected fake; no real gh binary, no network call.

test('review --github --pr on a legacy (non-runner) item is the same runner-sourced validation error as without --pr, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-status-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['review', 'gh-status-legacy', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-status-legacy'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call, --pr present or not');
});
