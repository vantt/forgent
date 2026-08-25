// fgos-read.test.mjs -- phần "list, show, ready, triage, graph, rollup, stale, conflicts, goal, check" của bộ test CLI, tách nguyên văn
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

test('graph verb: reports connected components (independent parallel tracks) in a fgos.v1 envelope, and is a pure read (no event appended, exit 0)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--deps', 'a', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(addOk(cwd, 'c').status, 0); // isolated -> its own track

  const before = eventLines(cwd).length;
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);

  const data = envelopeData(result.stdout); // asserts the C1 envelope shape
  assert.equal(data.order_version, 2); // FRONTIER_ORDER_VERSION bumped to v2 by str7-str8-priority-intent D2
  assert.equal(data.componentCount, 2);
  assert.deepEqual(data.components.map((component) => component.items), [['a', 'b'], ['c']]);

  // S6: the umbrella completes P43's stated acceptance — critical path,
  // stale-blocked, and greedy top-k-unblock. S7 adds the architecture frame.
  assert.deepEqual(Object.keys(data), ['order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock', 'stageByItem']);
  assert.deepEqual(data.criticalPath, { depth: 2, path: ['b', 'a'] });
  assert.deepEqual(data.staleBlocked, [{ id: 'b', status: 'todo', blockedBy: ['a'] }]);
  assert.deepEqual(data.topUnblock[0], { id: 'a', unblocks: 1, newlyUnblocks: 2 });
  // tsk-4zj D6: a/c via addOk carry addOk's own explicit --stage executing
  // default; b via the raw CLI `add` (no --stage) stamps 'discovery' by
  // default (add-stage-default-gap D1/D2; tsk-qod D1/D2: discovery is
  // stages[0] now, clarify retired).
  assert.deepEqual(data.stageByItem, { a: 'executing', b: 'discovery', c: 'executing' });
  assert.match(data.frame.revision, /^[0-9a-f]{64}$/);
  assert.equal(data.frame.nodeCount, 3);
  assert.deepEqual(data.frame.skipped, []);

  // Pure read: no event written by the verb.
  assert.equal(eventLines(cwd).length, before, 'graph must not append any event');
});


test('graph --what-if <id>: reports what completing that item unblocks, in a fgos.v1 envelope, pure read', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--deps', 'a', '--description', 'tsk-535 fixture description.']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['graph', '--what-if', 'a']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  // tsk-4zj D6: a via addOk carries addOk's own explicit --stage executing
  // default; b via the raw CLI `add` (no --stage) stamps 'discovery' by
  // default (add-stage-default-gap D1/D2; tsk-qod D1/D2: discovery is
  // stages[0] now, clarify retired).
  assert.deepEqual(data, { id: 'a', exists: true, unblocksTransitive: 1, newlyReady: ['b'], stageByItem: { a: 'executing', b: 'discovery' } });
  assert.equal(eventLines(cwd).length, before, 'what-if must not append any event');
});


test('graph --what-if on an unknown id: exists false, zero impact, still exit 0 + envelope', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['graph', '--what-if', 'ghost']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { id: 'ghost', exists: false, unblocksTransitive: 0, newlyReady: [] });
});


// --- work-graph-intelligence S8: `fgos stale` advisory --------------------

test('stale verb: a freshly-claimed doing item is NOT stale; a valid envelope + pure read (no event, exit 0)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  moveToDurableDoingForTest(cwd, 'a');

  const before = eventLines(cwd).length;
  const result = run(cwd, ['stale']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.stale, [], 'a just-claimed item is well within any grace window');
  assert.equal(data.thresholds.agentMs, 15 * 60 * 1000);
  assert.equal(data.thresholds.humanMs, 24 * 60 * 60 * 1000);
  assert.equal(eventLines(cwd).length, before, 'stale must not append any event');
});


test('stale verb on a store with nothing in doing: empty advisory, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // stays todo, never claimed
  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.stale, []);
});


// --- work-graph-intelligence S10 (tsk-1bl, CONTEXT.md D4/D7): `fgos stale`'s
// `postDelivery` field, additive alongside the existing `stale`/`thresholds`
// this verb already returns -- same one-verb surface, no new CLI command.

test('stale verb: postDelivery is additive — existing stale/thresholds shape is unchanged, postDelivery.stale is a sibling field', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  moveToDurableDoingForTest(cwd, 'a');

  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.stale, [], 'existing doing-advisory shape untouched');
  assert.equal(data.thresholds.agentMs, 15 * 60 * 1000, 'existing doing-advisory thresholds untouched');
  assert.deepEqual(data.postDelivery.stale, [], 'no delivered/retrospective/cleanup items yet');
  assert.ok(Number.isFinite(data.postDelivery.thresholds.deliveredMs));
});


test('stale verb: a just-delivered item is NOT flagged in postDelivery (well within the 3d threshold)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  addOk(cwd, 'just-delivered');
  moveToDurableDoingForTest(cwd, 'just-delivered');
  run(cwd, ['move', 'just-delivered', '--to', 'delivered']);

  const before = eventLines(cwd).length;
  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.postDelivery.stale, []);
  assert.equal(eventLines(cwd).length, before, 'stale must not append any event');
});


test('conflicts verb: two ready items sharing a footprint path are flagged with shared + suggestions, pure read', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
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
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // no footprint
  assert.deepEqual(envelopeData(run(cwd, ['conflicts']).stdout), { conflicts: [], stageByItem: {} });
});


// --- tsk-4so D1: conflicts must catch overlap ACROSS steps, not just within
// Execute (docs/history/execution-fanout/CONTEXT-tsk-4so.md) -------------

test('conflicts verb: items at DIFFERENT stages sharing a footprint are flagged (the real gap: a single-step frontier never saw this)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
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
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
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
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // stays todo, never blocked
  const before = eventLines(cwd).length;
  const result = run(cwd, ['recheck-blocked']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { resolvable: [], stillBlocked: [], notApplicable: [] });
  assert.equal(eventLines(cwd).length, before, 'recheck-blocked must not append any event -- report-only, never transitions anything');
});


test('recheck-blocked verb: a blocked item whose recorded commit is (still) a real ancestor of HEAD is reported resolvable, never auto-transitioned', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
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
  const cwd = initGitCwd();
  run(cwd, ['init']);
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
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.componentCount, 0);
  assert.deepEqual(data.components, []);
});


test('list --limit paginates work into {items, nextCursor}, AND scopes every other view key to just the paged ids (tsk-483, supersedes D5/D35)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-page-a');
  addOk(cwd, 'list-page-b');
  assert.equal(run(cwd, ['decision', '--id', 'list-page-a', '--text', 'decision for a', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(run(cwd, ['decision', '--id', 'list-page-b', '--text', 'decision for b', '--rationale', 'r', '--relation', 'none']).status, 0);
  const result = run(cwd, ['list', '--limit', '1']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(Object.keys(data.work).sort(), ['items', 'nextCursor']);
  const pagedIds = Object.keys(data.work.items);
  assert.equal(pagedIds.length, 1);
  // tsk-483: decisions now scoped to exactly the ids on THIS page -- the
  // other item's own decision must not leak through, unlike D5/D35's own
  // "every other view key untouched" behavior this item supersedes.
  assert.deepEqual(
    data.decisions.map((d) => d.id).sort(),
    pagedIds,
  );
});


test('list --all --limit combined: scopes side-logs to the paged ids too -- a combination herdr-plugin never uses (tsk-483 D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-all-page-a');
  addOk(cwd, 'list-all-page-b');
  assert.equal(run(cwd, ['decision', '--id', 'list-all-page-a', '--text', 'decision for a', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(run(cwd, ['decision', '--id', 'list-all-page-b', '--text', 'decision for b', '--rationale', 'r', '--relation', 'none']).status, 0);
  const result = run(cwd, ['list', '--all', '--limit', '1']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const pagedIds = Object.keys(data.work.items);
  assert.equal(pagedIds.length, 1);
  assert.deepEqual(
    data.decisions.map((d) => d.id).sort(),
    pagedIds,
  );
});


test('list default (no flags at all) scopes side-logs to only the open (non-done) ids -- a done item\'s own decision must not appear (tsk-483)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-default-open');
  assert.equal(run(cwd, ['decision', '--id', 'list-default-open', '--text', 'decision for open', '--rationale', 'r', '--relation', 'none']).status, 0);
  toProposed(cwd, 'list-default-done');
  assert.equal(run(cwd, ['decision', '--id', 'list-default-done', '--text', 'decision for done', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(toDoneViaChain(cwd, 'list-default-done').status, 0);
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(Object.keys(data.work).sort(), ['list-default-open']);
  assert.deepEqual(data.decisions.map((d) => d.id), ['list-default-open']);
});


test('list --all --json with NO pagination flags stays byte-identical -- herdr-plugin\'s own protected contract (tsk-483 D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-protected-open');
  assert.equal(run(cwd, ['decision', '--id', 'list-protected-open', '--text', 'decision for open', '--rationale', 'r', '--relation', 'none']).status, 0);
  toProposed(cwd, 'list-protected-done');
  assert.equal(run(cwd, ['decision', '--id', 'list-protected-done', '--text', 'decision for done', '--rationale', 'r', '--relation', 'none']).status, 0);
  assert.equal(toDoneViaChain(cwd, 'list-protected-done').status, 0);
  const result = run(cwd, ['list', '--all', '--json']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  // Both items' work rows present (D1: --all restores done items).
  assert.deepEqual(Object.keys(data.work).sort(), ['list-protected-done', 'list-protected-open']);
  // Both items' decisions present, UNSCOPED -- this exact combination must
  // never gain tsk-483's new scoping, matching herdr-plugin's own real,
  // vendored call sites (herdr-plugin/src/fgos.rs, confirmed directly:
  // every one of its 3 call sites is exactly ["list", "--all", "--json"]).
  // 'list-protected-done' carries its own explicit decision above --
  // tsk-40m: toProposed no longer claims through 'doing' at all (a direct
  // todo -> awaiting-approval move, the redesign's own new edge), so there
  // is no --skip-return-guard override left to log a second decision for.
  assert.deepEqual(
    data.decisions.map((d) => d.id).sort(),
    ['list-protected-done', 'list-protected-open'],
  );
});
