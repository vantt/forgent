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

test('review --github --pr on a still-open PR (closed:false) reports it is open and mutates neither FSM state nor friction', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-open');
  const ghLog = path.join(cwd, 'gh-view.log');
  const fake = writeViewFake(cwd, 'gh-view-open.cjs', ghLog,
    { state: 'OPEN', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: null, closed: false, closedAt: null });

  const result = run(cwd, ['review', 'gh-status-open', '--github', '--pr', '11'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const statusData = envelopeData(result.stdout);
  assert.equal(statusData.prNumber, '11');
  assert.equal(statusData.outcome, 'open');
  // Crossed the real process boundary as a status read, never a create/push.
  assert.match(fs.readFileSync(ghLog, 'utf8'), /pr view 11/);
  const view = stateView(cwd);
  assert.equal(view.work['gh-status-open'].status, 'awaiting-approval');
  assert.equal(view.frictions?.['gh-status-open'], undefined, 'the status check never records friction');
});

test('review --github --pr on a merged PR (closed:true, mergedAt set) reports it merged, informational only, with no local state or friction change', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-merged');
  const ghLog = path.join(cwd, 'gh-view.log');
  const fake = writeViewFake(cwd, 'gh-view-merged.cjs', ghLog,
    { state: 'MERGED', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: '2026-07-17T10:00:00Z', closed: true, closedAt: '2026-07-17T10:00:00Z' });

  const result = run(cwd, ['review', 'gh-status-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const mergedStatusData = envelopeData(result.stdout);
  assert.equal(mergedStatusData.prNumber, '42');
  assert.equal(mergedStatusData.outcome, 'merged');
  assert.equal(mergedStatusData.mergedAt, '2026-07-17T10:00:00Z');
  const view = stateView(cwd);
  // This cell never reconciles a GitHub-side merge into FSM state (out of scope, D4/D6).
  assert.equal(view.work['gh-status-merged'].status, 'awaiting-approval');
  assert.equal(view.frictions?.['gh-status-merged'], undefined);
});

test('review --github --pr on a closed-without-merge PR names the PR, points to fgos reject, mutates nothing, and resolves in exactly one gh invocation with mergeable UNKNOWN — proving pollTimeoutMs:0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-closed');
  const ghLog = path.join(cwd, 'gh-view.log');
  // mergeable:"UNKNOWN" is the honest test: were pollTimeoutMs the default 10s
  // (fix absent), viewGitHubPRStatus would re-invoke this fake on a poll loop
  // while mergeable stays UNKNOWN. Exactly one logged invocation proves the
  // pollTimeoutMs:0 override collapsed the loop to a single read.
  const fake = writeViewFake(cwd, 'gh-view-closed.cjs', ghLog,
    { state: 'CLOSED', mergeable: 'UNKNOWN', mergeStateStatus: 'UNKNOWN', mergedAt: null, closed: true, closedAt: '2026-07-17T09:00:00Z' });

  const startedAt = Date.now();
  const result = run(cwd, ['review', 'gh-status-closed', '--github', '--pr', '77'], { FGOS_GH_COMMAND: fake });
  const elapsedMs = Date.now() - startedAt;

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const closedData = envelopeData(result.stdout);
  assert.equal(closedData.prNumber, '77');
  assert.equal(closedData.outcome, 'closed-unmerged');

  const invocations = fs.readFileSync(ghLog, 'utf8').trim().split('\n').filter(Boolean);
  assert.equal(invocations.length, 1, `expected exactly one gh invocation under pollTimeoutMs:0, got ${invocations.length}`);
  assert.ok(elapsedMs < 5000, `status check must resolve well under the default 10s poll timeout, took ${elapsedMs}ms`);

  const view = stateView(cwd);
  assert.equal(view.work['gh-status-closed'].status, 'awaiting-approval', 'a GitHub-side close is not a reject — no FSM mutation');
  assert.equal(view.frictions?.['gh-status-closed'], undefined, 'the status check never records friction');
});

test('review --github --pr reports a gh status-check failure as plain output with no state mutation or friction', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-failed');
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['review', 'gh-status-failed', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const failedData = envelopeData(result.stdout);
  assert.equal(failedData.outcome, 'check-failed');
  assert.equal(failedData.reason, 'auth-failure');
  const view = stateView(cwd);
  assert.equal(view.work['gh-status-failed'].status, 'awaiting-approval');
  assert.equal(view.frictions?.['gh-status-failed'], undefined);
});

// --- tsk-4j9-3: `fgos merge list` (merge-readiness ranking) ---------------

test('merge list: unknown sub-verb is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['merge', 'bogus']);
  assert.equal(result.status, 4);
});

// tsk-66x: `merge` is a `requiresExistingStore: true` verb (like `submit`/
// `approve`) -- a missing `.fgos/` must refuse loudly, never fold silently
// into an empty-but-valid-looking ready/waiting/conflicts result.
test('merge list on a directory with no .fgos/ at all is refused, exit 4, writes nothing (no auto-vivify)', () => {
  const cwd = rawTmpCwd();
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
  const result = run(cwd, ['merge', 'list']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'the refused verb must not create .fgos/ as a side effect');
});

test('merge next on a directory with no .fgos/ at all is refused, exit 4, no merge attempted', () => {
  const cwd = rawTmpCwd();
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'the refused verb must not create .fgos/ as a side effect');
});

test('merge next run from inside a linked worktree without --dir is refused, exit 4 -- never the old silent "nothing ready" false negative even though the real store has a ready item', () => {
  const { main, wt } = tmpLinkedWorktree();
  assert.equal(run(main, ['add', 'solo', '--title', 'Solo', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(main, ['move', 'solo', '--to', 'doing']).status, 0);
  assert.equal(run(main, ['move', 'solo', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);
  // Confirm the real store genuinely has a ready item, so a refusal below
  // cannot be mistaken for a true "nothing ready" negative.
  assert.deepEqual(envelopeData(run(main, ['merge', 'list']).stdout).ready, ['solo']);

  const result = run(wt, ['merge', 'next']);
  assert.equal(result.status, 4, `expected a refusal, not the old silent false negative: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.equal(stateView(main).work.solo.status, 'awaiting-approval', 'the ready item at the real store must be untouched');
});

test('merge list on an empty store: empty ready/waiting/conflicts, exit 0, no event appended', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['merge', 'list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { ready: [], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: {}, supersededOut: [], stageByItem: {}, tree: [] });
  assert.equal(eventLines(cwd).length, before, 'merge list must not append any event');
});

test('merge list: a proposed item whose dep is already done is ready', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  // Built explicitly (not via toCompoundLearn/addOk) so --verify is a
  // trivially-passing command: addOk's default ('npm test') has no
  // package.json to run against in this bare sandbox, so approve would
  // park it 'blocked' instead of 'done' — a false negative for this test.
  assert.equal(run(cwd, ['add', 'dep', '--title', 'Dep', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);
  const approveResult = envelopeData(run(cwd, ['approve', 'dep']).stdout);
  assert.equal(approveResult.to, 'delivered', `expected dep to reach delivered, got: ${JSON.stringify(approveResult)}`);
  // merge list still reads RESOLVED_STATUSES = {done, wontfix} at this point
  // in the sequence (RUL12's own fix is a separate piece) -- walk the rest
  // of the chain so the dep genuinely reaches done.
  assert.equal(run(cwd, ['move', 'dep', '--to', 'retrospective']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'cleanup']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'done']).status, 0);
  assert.equal(run(cwd, ['add', 'leaf', '--title', 'Leaf', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--deps', 'dep', '--description', 'tsk-535 fixture description.']).status, 0);
  toProposed(cwd, 'leaf');
  const data = envelopeData(run(cwd, ['merge', 'list']).stdout);
  assert.deepEqual(data, { ready: ['leaf'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [], stageByItem: data.stageByItem, tree: [{ id: 'leaf', title: 'Leaf', status: 'ready', children: [] }] });
  // tsk-4zj D6: both dep and leaf were `add`ed directly (no --stage),
  // which stamps an explicit entry-stage default ('discovery' as of
  // tsk-qod D1/D2, 'clarify' before it — add-stage-default-gap D1/D2);
  // every subsequent `move`/`approve`/toProposed step only ever touches
  // `status`, never `stage`, so both stay at 'discovery'.
  assert.deepEqual(data.stageByItem, { dep: 'discovery', leaf: 'discovery' });
});

test('merge list: a proposed item whose dep is NOT done waits, never ready', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'dep').status, 0); // stays todo
  assert.equal(run(cwd, ['add', 'leaf', '--title', 'Leaf', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--deps', 'dep', '--description', 'tsk-535 fixture description.']).status, 0);
  toProposed(cwd, 'leaf');
  const data = envelopeData(run(cwd, ['merge', 'list']).stdout);
  assert.deepEqual(data, { ready: [], waiting: ['leaf'], conflicts: [], mergeSets: [], blockedOnSync: [], strandedByResolvedRoot: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [], stageByItem: data.stageByItem, tree: [{ id: 'leaf', title: 'Leaf', status: 'waiting', children: [] }] });
  // tsk-4zj D6: dep via addOk carries addOk's own explicit --stage
  // executing default; leaf was added via the raw CLI `add` (no --stage),
  // which stamps an entry-stage default ('discovery' as of tsk-qod D1/D2,
  // 'clarify' before it — add-stage-default-gap D1/D2) — toProposed's
  // internal addOk(cwd,'leaf') fails silently (leaf already exists) so
  // only `status` moves, `stage` stays at its original 'discovery'.
  assert.deepEqual(data.stageByItem, { dep: 'executing', leaf: 'discovery' });
});

test('merge list: two dep-clear proposed items sharing a footprint are excluded from ready and listed as conflicts', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/x.mjs', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/x.mjs', '--description', 'tsk-535 fixture description.']).status, 0);
  toProposed(cwd, 'a');
  toProposed(cwd, 'b');
  const data = envelopeData(run(cwd, ['merge', 'list']).stdout);
  assert.deepEqual(data.ready, []);
  assert.deepEqual(data.conflicts, [{ a: 'a', b: 'b', shared: ['src/x.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }]);
});

// --- tsk-4j9-4: `fgos merge next` (merge-readiness automation) -----------

test('merge next on an empty store: reports nothing ready, exit 0, no merge attempted', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { picked: null, reason: 'nothing ready to merge' });
});

test('merge next merges the single ready item by recursing into approve, item reaches done', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  // Explicit --verify true (not addOk's 'npm test' default) -- same
  // sandbox pitfall documented in docs/how-to/add-a-read-only-fgos-verb-
  // and-plugin-skill.md.
  assert.equal(run(cwd, ['add', 'solo', '--title', 'Solo', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['move', 'solo', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'solo', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);

  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, 'solo');
  assert.equal(data.approve.to, 'delivered', `expected the picked item to reach delivered: ${JSON.stringify(data)}`);
  assert.equal(stateView(cwd).work.solo.status, 'delivered');
});

test('merge next picks the higher-ranked (mvp goalTier) item first when two are ready', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  for (const id of ['plain', 'important']) {
    assert.equal(run(cwd, ['add', id, '--title', id, '--kind', 'task', '--risk', 'light', '--verify', 'true', '--description', 'tsk-535 fixture description.', ...(id === 'important' ? ['--goal-tier', 'mvp'] : [])]).status, 0);
    assert.equal(run(cwd, ['move', id, '--to', 'doing']).status, 0);
    assert.equal(run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);
  }
  const data = envelopeData(run(cwd, ['merge', 'next']).stdout);
  assert.equal(data.picked, 'important', 'the mvp-goalTier item outranks the plain one per rankImpact');
});

// tsk-xyr (absorbs tsk-1zd): the picker now SKIPS a provably Iron-Law-
// required candidate instead of returning it as "picked" and merging
// nothing -- classifyIronLaw is pure, so this is decided before any merge
// is even attempted. The two tests below replace the old single-item
// "picked then blocked" contract with the new one: a SOLE ready item that
// trips Iron Law is never attempted at all ("every ready item is blocked"),
// and when a second, non-blocked ready item also exists, THAT one gets
// picked and merged instead -- the acceptance criterion this item exists
// for ("an Iron-Law item is not returned next turn; other ready items get
// a turn").

test('merge next on a SOLE ready item that trips the Iron Law: skips it without attempting a merge, never auto-acknowledges', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `merge next itself must not exit non-zero on an all-skipped pool: ${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, null, 'the Iron-Law-required item must never be reported as picked -- it was never attempted');
  assert.equal(data.reason, 'every ready item is blocked');
  assert.deepEqual(data.skipped, [{ id: 'iron-next-item', reason: 'iron-law' }]);
  assert.ok(!('blocked' in data), 'blocked is for a real attempted-and-failed merge -- this candidate was never attempted');

  assert.equal(stateView(cwd).work['iron-next-item'].status, 'awaiting-approval', 'a skipped pick leaves the item exactly where it was');
  assert.equal(gitHead(cwd), headBefore, 'a skipped pick attempts no merge -- HEAD is unchanged');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/iron-next-item/, 'the branch survives -- nothing was merged or cleaned up');
});

test('merge next with one Iron-Law-required ready item AND one ordinary ready item: skips the first, picks and merges the other (the core acceptance criterion)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  makeRunnerProposedItem(cwd, 'ordinary-next-item', { verify: 'true' });

  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);

  assert.equal(data.picked, 'ordinary-next-item', 'the non-blocked ready item must be picked, not the Iron-Law one, regardless of rank order');
  assert.equal(data.approve.to, 'delivered');
  assert.deepEqual(data.skipped, [{ id: 'iron-next-item', reason: 'iron-law' }]);

  assert.equal(stateView(cwd).work['ordinary-next-item'].status, 'delivered');
  assert.equal(stateView(cwd).work['iron-next-item'].status, 'awaiting-approval', 'the skipped item is untouched -- still there for a human to acknowledge, next call');
});

test('merge next --acknowledge-iron-law forwarded by the caller: the picker does not pre-skip -- the flag applies to whichever item is picked, exactly as before', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const result = run(cwd, ['merge', 'next', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, 'iron-next-item', 'an explicitly-forwarded acknowledgment must let the picker attempt it, unchanged from before this item');
  assert.ok(!('skipped' in data), 'nothing was skipped -- the flag made the candidate attemptable');
});

// --- tsk-173: merge next auto sync-root on blockedOnSync (docs/history/
// merge-next-auto-sync-root/) -----------------------------------------------

test('merge next with nothing ready and no blockedOnSync candidate: unchanged shape, no syncRoot key at all (zero behavior change, D1)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data, { picked: null, reason: 'nothing ready to merge' });
  assert.ok(!('syncRoot' in data), 'no blockedOnSync candidate exists -- the new branch must never fire');
});

test('merge next auto-syncs a blockedOnSync root before giving up: drift clears, the now-ready item merges to delivered (tsk-173 D1)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'auto-sync-happy', { verify: 'test -f auto-sync-happy-produced.txt' });
  // driftStatus's own findRootIds only tracks ids that are some OTHER
  // item's `parent` -- a childless root is invisible to it, so it would
  // never show up in blockedOnSync at all without this.
  assert.equal(run(cwd, ['add', 'auto-sync-happy-child', '--title', 'child', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--parent', 'auto-sync-happy', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['move', 'auto-sync-happy', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);
  commitPendingBeforeApprove(cwd, 'auto-sync-happy');

  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.syncRoot.id, 'auto-sync-happy');
  assert.equal(data.syncRoot.outcome, 'synced');
  assert.equal(data.picked, 'auto-sync-happy', `expected the synced root to be picked next: ${JSON.stringify(data)}`);
  assert.equal(data.approve.to, 'delivered', `expected the synced+ready item to reach delivered: ${JSON.stringify(data)}`);
  assert.ok(fs.existsSync(path.join(cwd, 'auto-sync-happy-produced.txt')), 'sync-root\'s merge must land on main before approve re-verifies');
  assert.equal(stateView(cwd).work['auto-sync-happy'].status, 'delivered');
});

test('merge next on a blockedOnSync root whose sync-root attempt hits a genuine conflict: picked is the root id (never null), blocked, main untouched (tsk-173 D1/D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'auto-sync-conflict', { verify: 'true' });
  // Same collision shape as the direct sync-root conflict test above: an
  // unrelated main commit on the exact path the root's own commit touches.
  fs.writeFileSync(path.join(cwd, 'auto-sync-conflict-produced.txt'), 'conflicting main content\n');
  gitAtCwd(cwd, ['add', 'auto-sync-conflict-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'unrelated main edit that collides']);
  // See auto-sync-happy above: driftStatus only tracks ids that are some
  // other item's `parent`.
  assert.equal(run(cwd, ['add', 'auto-sync-conflict-child', '--title', 'child', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--parent', 'auto-sync-conflict', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['move', 'auto-sync-conflict', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);
  commitPendingBeforeApprove(cwd, 'auto-sync-conflict');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `merge next itself must not exit non-zero on a blocked sync: ${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  // picked must be the resolved root id, NEVER null -- picked: null here
  // would collide with merge-loop's own frontier-empty bullet and silently
  // swallow this real conflict as if nothing were wrong (validated against
  // plugins/fgOS/skills/merge-loop/SKILL.md during fgos-validating).
  assert.equal(data.picked, 'auto-sync-conflict');
  assert.equal(data.blocked, 'merge-conflict');
  assert.equal(data.syncRoot.outcome, 'blocked');
  assert.equal(data.syncRoot.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted auto-sync');
  assert.equal(stateView(cwd).work['auto-sync-conflict'].status, 'awaiting-approval', 'a blocked sync must never touch the root item\'s own status');
});

test('merge next on a blockedOnSync root whose sync-root attempt hits a dirty main checkout: picked is the root id (never null), blocked: dirty-tree, main untouched (tsk-66t)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'auto-sync-dirty', { verify: 'true' });
  // See auto-sync-happy above: driftStatus only tracks ids that are some
  // other item's `parent`.
  assert.equal(run(cwd, ['add', 'auto-sync-dirty-child', '--title', 'child', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--parent', 'auto-sync-dirty', '--description', 'tsk-66t fixture description.']).status, 0);
  assert.equal(run(cwd, ['move', 'auto-sync-dirty', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]).status, 0);
  commitPendingBeforeApprove(cwd, 'auto-sync-dirty');
  // auto-sync-dirty-produced.txt IS in this root's own fgw/auto-sync-dirty
  // diff (makeDriftedRoot committed it there) — re-dirtying that SAME path
  // on main, uncommitted, AFTER the legitimate state commits above is the
  // own-file-set conflict the new gate exists to catch, exercised through
  // the unattended merge-next path this item's own description names (an
  // UNRELATED dirty path is explicitly tolerated by isMainTreeClean's own
  // ownFileSet scoping, tsk-598 D2, so this must be a same-path conflict).
  fs.writeFileSync(path.join(cwd, 'auto-sync-dirty-produced.txt'), 'clobbered by another writer\n'); // never git add/commit

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `merge next itself must not exit non-zero on a blocked sync: ${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  // picked must be the resolved root id, NEVER null -- same tsk-173
  // invariant the conflict test above already proves for merge-conflict;
  // this proves it holds for the new dirty-tree reason too.
  assert.equal(data.picked, 'auto-sync-dirty');
  assert.equal(data.blocked, 'dirty-tree');
  assert.match(data.message, /is not clean/);
  assert.equal(data.syncRoot.id, 'auto-sync-dirty');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after a refused auto-sync');
  assert.equal(fs.readFileSync(path.join(cwd, 'auto-sync-dirty-produced.txt'), 'utf8'), 'clobbered by another writer\n', 'the uncommitted local change must survive untouched');
  assert.equal(stateView(cwd).work['auto-sync-dirty'].status, 'awaiting-approval', 'a blocked sync must never touch the root item\'s own status');
});

test('merge next --no-wait fails immediately on a live-held lock -- proves the flag actually forwards into approve (bin/fgos.mjs:1152), not just documented as if it did', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'wait-merge-next-no-wait', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-merge-next-no-wait');
  writeLiveLock(cwd, 1000);

  const start = Date.now();
  const result = run(cwd, ['merge', 'next', '--no-wait']);
  const elapsed = Date.now() - start;

  // `merge next` only special-cases an Iron Law rejection (bin/fgos.mjs's
  // `sub === 'next'` case) -- any other error from the inner `runVerb('approve', ...)`
  // rethrows as-is, so this fails exactly like a direct `approve` call does.
  assert.equal(result.status, 9, result.stderr);
  assert.match(result.stderr, /main checkout is locked by pid \d+/);
  assert.ok(elapsed < 2000, `--no-wait forwarded through merge next must still fail fast, not wait (took ${elapsed}ms)`);
});

test('sync-root never reports outcome "synced" when mergeRunnerItem returns an outcome it does not explicitly handle -- proves the defensive guard closes the false-success gap D4 found', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-blocked-other', { verify: 'true' });

  // Simulate another item's in-progress/abandoned merge already staged on
  // the main checkout -- a real, unrelated branch, staged but never
  // committed or aborted, which makes mergeRunnerItem return
  // 'merge-blocked-other-item' for THIS sync-root call (tsk-4hj D1).
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/sync-root-other-blocker']);
  fs.writeFileSync(path.join(cwd, 'sync-root-other-blocker-produced.txt'), 'other\n');
  gitAtCwd(cwd, ['add', 'sync-root-other-blocker-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for sync-root-other-blocker']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', 'fgw/sync-root-other-blocker']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-blocked-other']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.notEqual(data.outcome, 'synced', 'must never report success for an outcome it does not recognize');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'merge-blocked-other-item');

  assert.equal(gitHead(cwd), headBefore, 'main must be unchanged');
  assert.doesNotThrow(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'the other item\'s MERGE_HEAD must survive untouched',
  );
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-blocked-other-produced.txt')), false, 'the drifted root\'s own content must NOT have landed on main');
  assert.equal(stateView(cwd).work['sync-root-blocked-other'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');

  const lines = eventLines(cwd);
  const mergedDecisions = lines.map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === 'sync-root-blocked-other' && /merged/.test(e.payload?.text ?? ''));
  assert.equal(mergedDecisions.length, 0, 'must never record a "merged" decision for a merge that never actually completed');
});

test('sync-root outcome guard catches merge-failed-unclassified and records unhandled-outcome friction (tsk-12o)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-merge-failed', { verify: 'true' });

  // tsk-18a D1: `git merge --no-commit --no-ff` can fail WITHOUT ever
  // creating MERGE_HEAD when an untracked file at the target checkout
  // collides with a DIRECTORY path the incoming branch needs to create.
  // The collision path must be the DIRECTORY itself
  // ('sync-root-merge-failed-dir'), never the leaf file the branch's own
  // diff introduces ('sync-root-merge-failed-dir/leaf.txt') -- an
  // untracked file at that leaf path would instead trip the EARLIER
  // dirty-tree refusal the 'sync-root-dirty' test above already covers
  // (isMainTreeClean's ownFileSet only ever contains leaf paths from
  // `git diff --name-only trunk...branch`, never their parent
  // directories), so this reaches mergeRunnerItem itself rather than
  // being refused before it.
  gitAtCwd(cwd, ['checkout', 'fgw/sync-root-merge-failed']);
  fs.mkdirSync(path.join(cwd, 'sync-root-merge-failed-dir'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'sync-root-merge-failed-dir', 'leaf.txt'), 'from-branch\n');
  gitAtCwd(cwd, ['add', 'sync-root-merge-failed-dir/leaf.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch adds a nested leaf file']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // A stray untracked file already sitting at the exact directory path the
  // branch needs to create -- the real-world shape test/runner/merge.test.mjs
  // (mergeRunnerItem unit level) already proves reports 'merge-failed-unclassified',
  // never 'conflict', for exactly this git failure mode.
  fs.writeFileSync(path.join(cwd, 'sync-root-merge-failed-dir'), 'stray-untracked\n');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-merge-failed']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.notEqual(data.outcome, 'synced', 'must never report success for an outcome it does not recognize');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'merge-failed-unclassified');
  assert.ok(data.error?.stderr || data.error?.message, 'CLI response must carry real git error details (tsk-3tv)');

  assert.equal(gitHead(cwd), headBefore, 'main must be unchanged');
  assert.throws(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'MERGE_HEAD must never have existed -- this was never a real conflict, git refused before staging anything',
  );
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-merge-failed-produced.txt')), false, 'the drifted root\'s own top-level content must NOT have landed on main');
  assert.equal(fs.readFileSync(path.join(cwd, 'sync-root-merge-failed-dir'), 'utf8'), 'stray-untracked\n', 'the stray untracked file must survive untouched');
  assert.equal(stateView(cwd).work['sync-root-merge-failed'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');

  const frictions = stateView(cwd).frictions?.['sync-root-merge-failed'] ?? [];
  assert.ok(
    frictions.some((f) => f.errorClass === 'sync-root-unhandled-outcome'),
    'frictions must contain an entry with errorClass === "sync-root-unhandled-outcome"',
  );
  const unhandledFriction = frictions.find((f) => f.errorClass === 'sync-root-unhandled-outcome');
  assert.ok(
    unhandledFriction.detail.includes(data.error.stderr || data.error.message),
    'friction detail must carry real git error text/stderr (tsk-3tv)',
  );

  const lines = eventLines(cwd);
  const mergedDecisions = lines.map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === 'sync-root-merge-failed' && /merged/.test(e.payload?.text ?? ''));
  assert.equal(mergedDecisions.length, 0, 'must never record a "merged" decision for a merge that never actually completed');
});

test('sync-root outcome guard catches lock-lost-mid-merge and records unhandled-outcome friction (tsk-3df)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  const lockOverwriter = `node -e "require('fs').writeFileSync('${lockPath}', JSON.stringify({pid: 999999, ts: Date.now()})); const end = Date.now() + 50; while (Date.now() < end) {}"`;

  makeDriftedRoot(cwd, 'sync-root-lock-lost', { verify: lockOverwriter });

  const headBefore = gitHead(cwd);
  process.env.FGOS_HEARTBEAT_INTERVAL_MS = '10';
  let result;
  try {
    result = run(cwd, ['sync-root', 'sync-root-lock-lost']);
  } finally {
    delete process.env.FGOS_HEARTBEAT_INTERVAL_MS;
  }

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.notEqual(data.outcome, 'synced', 'must never report success for lock-lost-mid-merge');
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'lock-lost-mid-merge');

  const frictions = stateView(cwd).frictions?.['sync-root-lock-lost'] ?? [];
  assert.ok(
    frictions.some((f) => f.errorClass === 'sync-root-unhandled-outcome'),
    'frictions must contain an entry with errorClass === "sync-root-unhandled-outcome"',
  );

  assert.equal(gitHead(cwd), headBefore, 'main must be unchanged');
  assert.doesNotThrow(
    () => gitAtCwd(cwd, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'MERGE_HEAD must survive untouched because abortMergeIfPossible was not called',
  );
  assert.equal(fs.existsSync(path.join(cwd, 'sync-root-lock-lost-produced.txt')), true, 'staged merge file must survive untouched on disk');
  assert.equal(stateView(cwd).work['sync-root-lock-lost'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');

  const lines = eventLines(cwd);
  const mergedDecisions = lines.map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === 'sync-root-lock-lost' && /merged/.test(e.payload?.text ?? ''));
  assert.equal(mergedDecisions.length, 0, 'must never record a "merged" decision for a merge that never actually completed');
});

test('sync-root --trust-dir with --dir succeeds from inside a linked worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-trust-dir', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-trust-dir');

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-sync-root-trust-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'sync-root-trust-dir-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'sync-root', 'sync-root-trust-dir', '--trust-dir', '--dir', cwd], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'synced');

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});

test('sync-root --trust-dir WITHOUT --dir is a no-op -- still refuses from inside a linked worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-trust-dir-noop', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-trust-dir-noop');

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-sync-root-trust-noop-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'sync-root-trust-dir-noop-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'sync-root', 'sync-root-trust-dir-noop', '--trust-dir'], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /main checkout/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});

test('promote-to-component refuses from inside a linked worktree (must land on the real main checkout)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-worktree-guard-a');
  makeFlatMember(cwd, 'ptc-worktree-guard-b', { deps: ['ptc-worktree-guard-a'] });

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-ptc-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'ptc-worktree-guard-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'promote-to-component', '--ids', 'ptc-worktree-guard-a,ptc-worktree-guard-b', '--root-title', 'Component worktree guard'], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /main checkout/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});

test('promote-to-component --trust-dir with --dir succeeds from inside a linked worktree (tsk-2bg)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  registerFlatMember(cwd, 'ptc-trust-dir-a');
  registerFlatMember(cwd, 'ptc-trust-dir-b', { deps: ['ptc-trust-dir-a'] });
  commitPending(cwd, 'state: setup ptc-trust-dir members');
  cutMemberBranch(cwd, 'ptc-trust-dir-a');
  cutMemberBranch(cwd, 'ptc-trust-dir-b');

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-ptc-trust-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'ptc-trust-dir-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'promote-to-component', '--ids', 'ptc-trust-dir-a,ptc-trust-dir-b', '--root-title', 'Component trust dir', '--trust-dir', '--dir', cwd], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.results.find((r) => r.id === 'ptc-trust-dir-a').outcome, 'merged');
  assert.equal(data.results.find((r) => r.id === 'ptc-trust-dir-b').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-trust-dir-a'].parent, data.rootId);
  assert.equal(view.work['ptc-trust-dir-b'].parent, data.rootId);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});

test('promote-to-component --trust-dir WITHOUT --dir is a no-op -- still refuses from inside a linked worktree (tsk-2bg)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-trust-dir-noop-a');
  makeFlatMember(cwd, 'ptc-trust-dir-noop-b', { deps: ['ptc-trust-dir-noop-a'] });

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-ptc-trust-noop-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'ptc-trust-dir-noop-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'promote-to-component', '--ids', 'ptc-trust-dir-noop-a,ptc-trust-dir-noop-b', '--root-title', 'Component trust dir noop', '--trust-dir'], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /main checkout/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});

