// fgos-read.test.mjs -- phần "list, show, ready, triage, graph, rollup, stale, conflicts, goal, check" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
import { graphUseCase, staleUseCase } from '../../src/verbs/state/read.mjs';
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
  initGitCwdFast,
  initGitCwdInSubdir,
  initGitCwdMain,
  initGitCwdMainFast,
  initGitCwdWithWorktree,
  initHeadlessGitCwd,
  initHeadlessGitCwdFast,
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
  moveToDurableDoingForTest,
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
  tmpCwdFast,
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


// tsk-56t D2: `list`/`ready`/etc. stay `requiresExistingStore: false` (a
// fresh non-worktree dir with no store is legitimately "not evaluated",
// not an error) — but a worktree-resident session that forgets `--dir`
// should not read that as "no open work" with zero signal. One
// object-shaped verb (`list`) and one array-shaped verb (`ready`, which
// returns a bare array via paginateVerbResult when unpaginated — the
// reason this is a stderr line, never a JSON field: JSON.stringify drops
// a named property set on an array).

// --- work-graph-intelligence S5: `fgos graph` read verb -------------------

test.todo('graph verb: reports connected components (independent parallel tracks) in a fgos.v1 envelope, and is a pure read - migrated to test/direct/fgos-read.test.mjs');
test.todo('graph use case --what-if <id>: reports what completing that item unblocks, pure read - migrated to test/direct/fgos-read.test.mjs');
test.todo('graph use case --what-if on an unknown id: exists false, zero impact - migrated to test/direct/fgos-read.test.mjs');
test.todo('stale verb: a freshly-claimed doing item is NOT stale - migrated to test/direct/fgos-read.test.mjs');
test.todo('stale use case on a store with nothing in doing: empty advisory - migrated to test/direct/fgos-read.test.mjs');
test.todo('stale use case: postDelivery is additive - migrated to test/direct/fgos-read.test.mjs');
test.todo('stale verb: a just-delivered item is NOT flagged in postDelivery - migrated to test/direct/fgos-read.test.mjs');


test('conflicts verb: two ready items sharing a footprint path are flagged with shared + suggestions, pure read', () => {
  const cwd = tmpCwdFast();
  assert.equal(run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/x.mjs,src/y.mjs', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/y.mjs,src/z.mjs', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'c', '--title', 'C', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/w.mjs', '--stage', 'executing', '--description', 'tsk-535 fixture description.']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['conflicts']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  // tsk-4zj D7: conflicts' output wraps into {conflicts, stageByItem} --
  // a/b/c were all added with --stage executing above.
  assert.deepEqual(data, {
    conflicts: [{ a: 'a', b: 'b', shared: ['src/y.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }],
    stageByItem: { a: 'executing', b: 'executing' },
  });
  assert.equal(eventLines(cwd).length, before, 'conflicts must not append any event');
});


test('conflicts verb on a store with no overlaps: empty list, exit 0', () => {
  const cwd = tmpCwdFast();
  assert.equal(addOk(cwd, 'a').status, 0); // no footprint
  assert.deepEqual(envelopeData(run(cwd, ['conflicts']).stdout), { conflicts: [], stageByItem: {} });
});


// --- tsk-4so D1: conflicts must catch overlap ACROSS steps, not just within
// Execute (docs/history/execution-fanout/CONTEXT-tsk-4so.md) -------------

test('conflicts verb: items at DIFFERENT stages sharing a footprint are flagged (the real gap: a single-step frontier never saw this)', () => {
  const cwd = tmpCwdFast();
  assert.equal(run(cwd, ['add', 'atdecompose', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'bin/fgos.mjs', '--stage', 'planning', '--description', 'tsk-4so fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'atexecuting', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'bin/fgos.mjs', '--stage', 'executing', '--description', 'tsk-4so fixture description.']).status, 0);

  const data = envelopeData(run(cwd, ['conflicts']).stdout);
  // tsk-4zj D7: this is exactly the scenario D7 corrects D6 for -- the two
  // conflicting items are at DIFFERENT stages, so stageByItem is genuinely
  // informative here, not a constant.
  assert.deepEqual(data, {
    conflicts: [{ a: 'atdecompose', b: 'atexecuting', shared: ['bin/fgos.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }],
    stageByItem: { atdecompose: 'planning', atexecuting: 'executing' },
  });
});


// tsk-qod D1/D2: KNOWN GAP, not a design intent of this item -- footprintConflicts
// (store.mjs) scans frontierAcrossSteps' default step set (Clarify/Divide/
// Execute only); `discovery`/`exploring` were already outside that
// vocabulary before this item (tsk-1w7 D10 — "outside the 5-step
// vocabulary", same as Init/Compound-learn). Pre-tsk-qod, a freshly
// submitted item started at `clarify`, which DID map to the `Clarify` step,
// so it was still caught here. Post-tsk-qod, a freshly submitted item
// starts at `discovery` (`stages[0]`) instead, which maps to no step at
// all -- so it is now invisible to this check for its entire default
// resting stage, not just a brief transient window. Widening
// footprintConflicts' candidate set to cover discovery/exploring is a real
// product decision (does conflicts scan by raw stage instead of by step
// vocabulary now?) outside this test-fixing pass's own scope -- recorded
// here plainly rather than silently patched over.
test('conflicts verb: a discovery-stage item and an executing-stage item sharing a footprint are NOT flagged (discovery has no step mapping, so footprintConflicts cannot see it — see comment above)', () => {
  const cwd = tmpCwdFast();
  assert.equal(run(cwd, ['add', 'atdiscovery', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/shared.mjs', '--stage', 'discovery', '--description', 'tsk-4so fixture description.']).status, 0);
  assert.equal(run(cwd, ['add', 'atexecuting', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/shared.mjs', '--stage', 'executing', '--description', 'tsk-4so fixture description.']).status, 0);

  const data = envelopeData(run(cwd, ['conflicts']).stdout);
  assert.deepEqual(data, { conflicts: [], stageByItem: {} });
});


// --- tsk-597z: `fgos recheck-blocked` -- report-only sweep re-running the
// merge-still-resolves ancestry check LIVE against every status:blocked
// item, instead of trusting stored reason/detail text (same live-recheck
// stance `fgos catchup`'s own eligibility gate already takes). ------------

test('recheck-blocked verb on a store with nothing blocked: all-empty envelope, exit 0, pure read (no event)', () => {
  const cwd = tmpCwdFast();
  assert.equal(addOk(cwd, 'a').status, 0); // stays todo, never blocked
  const before = eventLines(cwd).length;
  const result = run(cwd, ['recheck-blocked']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { resolvable: [], stillBlocked: [], notApplicable: [] });
  assert.equal(eventLines(cwd).length, before, 'recheck-blocked must not append any event -- report-only, never transitions anything');
});


test('recheck-blocked verb: a blocked item whose recorded commit is (still) a real ancestor of HEAD is reported resolvable, never auto-transitioned', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'catches-up', { verify: 'test -f proof.txt' });
  // Real claim -> commit -> return shape (mirrors fgos-return.test.mjs's
  // own happy-path fixture) so `headAtReturn` is a REAL recorded commit,
  // never a bare `move`'s no-op -- this is what tsk-4n7 (an item stuck
  // blocked from before an unrelated fix landed) actually looked like: a
  // real recorded commit whose ancestry check simply needs re-running.
  assert.equal(run(cwd, ['take', '--id', 'catches-up']).status, 0);
  commitFile(cwd, 'proof.txt');
  const returnResult = run(cwd, ['return', 'catches-up']);
  assert.equal(returnResult.status, 0, returnResult.stderr);
  // Park it by hand (as if an unrelated bug had parked it for a reason
  // that has nothing to do with this ancestry check) -- the sweep must
  // catch this without `reason` ever saying anything about a merge.
  run(cwd, ['move', 'catches-up', '--to', 'blocked', '--reason', 'integration-drift']);

  const data = envelopeData(run(cwd, ['recheck-blocked']).stdout);
  assert.deepEqual(data.stillBlocked, []);
  assert.equal(data.resolvable.length, 1);
  assert.equal(data.resolvable[0].id, 'catches-up');

  // report-only: item.status is untouched by the sweep itself.
  const listed = envelopeData(run(cwd, ['list', '--id', 'catches-up']).stdout);
  assert.equal(listed.work['catches-up'].status, 'blocked', 'recheck-blocked must never transition the item on its own');
});


test('recheck-blocked verb: a blocked item whose recorded commit is no longer reachable (force-pushed away) is reported stillBlocked, never resolvable', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'never-merged', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'never-merged']).status, 0);
  // Scoped `git add proof.txt` -- deliberately NOT `commitFile`'s own
  // `git add -A` (which would sweep the still-untracked `.fgos/`
  // directory into this commit, making it -- and the item's whole state
  // -- vanish under the `git reset --hard` below, the same class of
  // danger AGENTS.md's tsk-56u names for `-A` inside a worktree).
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  gitAtCwd(cwd, ['add', 'proof.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'work: proof.txt']);
  const returnResult = run(cwd, ['return', 'never-merged']);
  assert.equal(returnResult.status, 0, returnResult.stderr);
  run(cwd, ['move', 'never-merged', '--to', 'blocked', '--reason', 'integration-drift']);
  // Simulate a force-push/history-rewrite that drops the recorded commit
  // (same setup `checkMergeStillResolves`'s own unit test uses).
  gitAtCwd(cwd, ['reset', '--hard', 'HEAD~1']);

  const data = envelopeData(run(cwd, ['recheck-blocked']).stdout);
  assert.deepEqual(data.resolvable, []);
  assert.equal(data.stillBlocked.length, 1);
  assert.equal(data.stillBlocked[0].id, 'never-merged');
});


test('graph verb on an empty store: zero components, still a valid envelope, exit 0', () => {
  const cwd = tmpCwdFast();
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.componentCount, 0);
  assert.deepEqual(data.components, []);
});


test.todo('list --limit paginates work into {items, nextCursor}, AND scopes every other view key to just the paged ids - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --all --limit combined: scopes side-logs to the paged ids too - migrated to test/direct/fgos-read.test.mjs');
test.todo('list default (no flags at all) scopes side-logs to only the open (non-done) ids - migrated to test/direct/fgos-read.test.mjs');
test.todo('list --all with NO pagination flags stays byte-identical and unscoped - migrated to test/direct/fgos-read.test.mjs');

