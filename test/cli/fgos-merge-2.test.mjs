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
