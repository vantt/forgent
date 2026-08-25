// fgos-claim.test.mjs -- phần "take, pick, session, unlock, lock-status, main-checkout-reset, take/pick/approve" của bộ test CLI, tách nguyên văn
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
  releaseClaimFor,
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


test('lock-status from a .fgos/-less linked worktree with no --dir warns on stderr instead of a silent "free"', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['lock-status']);
  assert.equal(result.status, 0, 'lock-status is requiresExistingStore:false -- it warns, never refuses');
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.equal(envelopeData(result.stdout).outcome, 'free', 'the structurally-forced empty-store answer, never silently trusted as a real lock read');
});


// tsk-5iv D1 (round-3 review, HIGH): main-checkout-reset's repoRoot =
// path.dirname(dir), and dir defaults to a cwd-strict resolution (never
// git-resolved) -- called with no --dir from a linked worktree, repoRoot
// silently resolved to the WORKTREE, not the main checkout, while this
// verb's own error text still said "main checkout, whole repo" and (with
// --confirm) would run `git reset --hard` against that wrong tree.
test('main-checkout-reset from a linked worktree with no --dir refuses before touching git (D1)', () => {
  const { main, wt } = tmpLinkedWorktree();
  const headBefore = gitHead(main);
  const wtHeadBefore = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim();

  const result = run(wt, ['main-checkout-reset', '--sha', headBefore]);
  assert.equal(result.status, 4, 'must be a clean validation refusal, never a crash or a silent reset');
  assert.match(result.stderr, /main-checkout-reset: refusing to run without --dir/);
  assert.match(result.stderr, /--dir <mainRoot>/);

  assert.equal(gitHead(main), headBefore, 'the main checkout must be untouched');
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim(),
    wtHeadBefore,
    'the worktree itself must also be untouched -- this is a refusal, not a redirected reset',
  );
});


test('main-checkout-reset from a linked worktree WITH --dir <mainRoot> targets the real main checkout, exactly as if run from there directly', () => {
  const { main, wt } = tmpLinkedWorktree();
  commitFile(main, 'second.txt');
  const targetSha = gitHead(main);
  commitFile(main, 'third.txt');
  assert.notEqual(gitHead(main), targetSha);

  const result = run(wt, ['main-checkout-reset', '--sha', targetSha, '--dir', main]);
  assert.equal(result.status, 0, `main-checkout-reset --dir unexpectedly failed: ${result.stderr}`);
  assert.equal(gitHead(main), targetSha, 'the real main checkout must land on the requested sha');
});


test('main-checkout-reset from the main checkout itself, no --dir, still works exactly as before (no regression on the common case)', () => {
  const cwd = initGitCwd();
  commitFile(cwd, 'second.txt');
  const targetSha = gitHead(cwd);
  commitFile(cwd, 'third.txt');
  assert.notEqual(gitHead(cwd), targetSha);

  const result = run(cwd, ['main-checkout-reset', '--sha', targetSha]);
  assert.equal(result.status, 0, `main-checkout-reset from the main checkout unexpectedly failed: ${result.stderr}`);
  assert.equal(gitHead(cwd), targetSha);
});


test('session start inside a .fgos/-less linked worktree still succeeds (D10 symlink actor exempt from the requiresExistingStore guard)', () => {
  const { wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const result = run(wt, ['session', 'start']);
  assert.equal(result.status, 0, `session start unexpectedly refused: ${result.stderr}`);
});


// --- take/return: cửa pull giao–nhận việc (stage-decompose S2-pull D1) -----

test('take with no --id claims the frontier head, defaults role to human, records headAtTake, and writes a predicted outcome', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-a', { verify: 'test -f done.txt' });
  const headBefore = gitHead(cwd);

  const result = run(cwd, ['take']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pull-a');
  assert.equal(data.role, 'human');

  const view = stateView(cwd);
  assert.equal(view.work['pull-a'].status, 'doing');
  assert.equal(view.work['pull-a'].claimRole, 'human');
  assert.equal(view.work['pull-a'].headAtTake, headBefore);
  assert.equal(view.outcomes['pull-a'].predicted.role, 'human');
  assert.equal(view.outcomes['pull-a'].predicted.headAtTake, headBefore);
  assert.equal(view.outcomes['pull-a'].predicted.tier, 'standard');
});


test('take --role session records claimRole "session" instead of the default human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-session');

  const result = run(cwd, ['take', '--role', 'session']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-session'].claimRole, 'session');
});


test('take --role with an invalid value is rejected as validation, exit 4, no event written', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-bad-actor');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take', '--role', 'robot']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


test('take on an empty frontier is rejected as validation, exit 4, no event written', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


test('take --id on a todo item outside the frontier (dep not done) is rejected as validation — take opens only the same set the runner would dispatch', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-dep-source');
  run(cwd, ['add', 'pull-dep-blocked', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--deps', 'pull-dep-source', '--description', 'tsk-535 fixture description.']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take', '--id', 'pull-dep-blocked']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected take never claims and never writes an event');
  assert.equal(stateView(cwd).work['pull-dep-blocked'].status, 'todo');
});


test('take --id on an item already claimed (doing) falls through to moveWork\'s own CAS — conflict, exit 3, not a duplicated validation message', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-double-take');
  assert.equal(run(cwd, ['take', '--id', 'pull-double-take']).status, 0);

  const result = run(cwd, ['take', '--id', 'pull-double-take']);
  assert.equal(result.status, 3);
  assert.equal(stateView(cwd).work['pull-double-take'].status, 'doing');
});


test('take --id not found is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const result = run(cwd, ['take', '--id', 'no-such-item']);
  assert.equal(result.status, 4);
});


// tsk-k8u D1/D2 regression guard: take used to pass repoRoot: process.cwd()
// to claimWork, independent of --dir -- a session running it (as instructed)
// from inside a .fgos/-less linked worktree with --dir pointed at the real
// root would record headAtTake against the WORKTREE's own HEAD instead of
// the real root's. Same "pin repoRoot to --dir like every other verb"
// pattern tsk-1wn already fixed for docs-index (see tmpLinkedWorktree above).
test('take --id from --dir records headAtTake against the real root, not the worktree cwd (tsk-k8u D1/D2)', () => {
  const { main, wt } = tmpLinkedWorktree();
  addOk(main, 'pull-via-dir');
  // Advance main's own HEAD past wt's fork point so headAtTake can actually
  // discriminate "read from --dir's root" vs "read from the worktree cwd" —
  // without this, both share the same commit and the assertion below would
  // pass by coincidence even under the pre-fix process.cwd() bug.
  commitFile(main, 'advance-main.txt');
  const headBefore = gitHead(main);
  assert.notEqual(headBefore, gitHead(wt), 'test setup must diverge main from wt before asserting');

  const result = run(wt, ['take', '--id', 'pull-via-dir', '--dir', main]);
  assert.equal(result.status, 0, `take --dir failed: ${result.stderr}`);

  const view = stateView(main);
  assert.equal(view.work['pull-via-dir'].status, 'doing');
  assert.equal(view.work['pull-via-dir'].headAtTake, headBefore, 'take --dir must record HEAD from --dir\'s root, not the worktree cwd');
});


// --- pick: take + createWorktree combined (str83-fgos-slash-commands-4) ---

test('pick with no --id claims the frontier head exactly like take does today, role fixed to "session", and stands up a real (non-detached) git branch/worktree for the claim', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-a', { verify: 'test -f done.txt' });
  const headBefore = gitHead(cwd);

  const result = run(cwd, ['pick']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pick-a');
  assert.equal(data.role, 'session');
  assert.equal(data.from, 'todo');
  assert.equal(data.to, 'doing');
  // A first pick claim records branchHeadAtTake, not the main-based
  // headAtTake — pick always creates a fgw/<id> worktree/branch below, on
  // this first claim exactly as much as on a blocked reclaim, so `return`
  // must take the SAME branch-source path either way.
  assert.equal(data.branchHeadAtTake, headBefore);
  assert.equal('headAtTake' in data, false, 'a pick claim never records the main-based headAtTake');
  assert.equal(data.worktree.branch, 'fgw/pick-a');
  assert.equal(data.worktree.reused, false);
  assert.ok(fs.existsSync(data.worktree.path), 'pick must leave a real worktree checkout on disk');
  // tsk-424 D1/D2: pick's worktree must live under .claude/worktrees/ so the
  // harness's EnterWorktree tool can chain a second in-session switch into
  // it (e.g. a root item decomposing into a child mid-session) — a location
  // outside .claude/worktrees/ is refused by the harness past the first switch.
  assert.ok(
    data.worktree.path.startsWith(path.join(cwd, '.claude', 'worktrees') + path.sep),
    `pick worktree path "${data.worktree.path}" must live under .claude/worktrees/`,
  );

  const view = stateView(cwd);
  assert.equal(view.work['pick-a'].status, 'doing');
  assert.equal(view.work['pick-a'].claimRole, 'session');
  assert.equal(view.work['pick-a'].branchHeadAtTake, headBefore);
  assert.equal(view.outcomes['pick-a'].predicted.role, 'session');

  // truth 3: the branch is real and non-detached — `symbolic-ref HEAD`
  // succeeds inside the worktree (mirrors session.test.mjs's negative check
  // for a genuinely detached session worktree, asserted the other way).
  assert.doesNotThrow(() =>
    execFileSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: data.worktree.path, stdio: 'ignore' }),
  );
});


// tsk-k8u D1/D2 regression guard: pick used to derive BOTH repoRoot and
// worktreeDir from process.cwd(), independent of --dir -- a session
// running it (as instructed) from inside a .fgos/-less linked worktree with
// --dir pointed at the real root would stand up the new worktree under the
// WORKTREE's own .claude/worktrees/ instead of the real root's (D2), and
// (D1) risk targeting git ops at the worktree cwd for anything reclaimed.
// Same "pin repoRoot to --dir" pattern tsk-1wn already fixed for docs-index.
test('pick --id from --dir stands up the worktree under --dir\'s own .claude/worktrees/, not the invoking worktree cwd\'s (tsk-k8u D1/D2)', () => {
  const { main, wt } = tmpLinkedWorktree();
  addOk(main, 'pick-via-dir');

  const result = run(wt, ['pick', '--id', 'pick-via-dir', '--dir', main]);
  assert.equal(result.status, 0, `pick --dir failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.ok(fs.existsSync(data.worktree.path), 'pick --dir must leave a real worktree checkout on disk');
  assert.ok(
    data.worktree.path.startsWith(path.join(main, '.claude', 'worktrees') + path.sep),
    `pick --dir worktree path "${data.worktree.path}" must live under --dir's own .claude/worktrees/, not the invoking cwd's`,
  );
  assert.ok(
    !data.worktree.path.startsWith(wt),
    'pick --dir must never place the new worktree under the invoking (worktree-resident) cwd',
  );

  const view = stateView(main);
  assert.equal(view.work['pick-via-dir'].status, 'doing');
});


// tsk-k8u repro (2026-08-02, tsk-2ie): a claim-release + re-pick sequence
// run FROM INSIDE the item's own already-existing worktree used to crash
// with `spawnSync git ENOENT` -- worktreeDir was ALSO process.cwd()-based,
// so the second pick's worktreeDir (the worktree's own path) didn't match
// where the checkout was actually registered (under main's worktreeDir),
// createClaimWorktree's reattach check failed, and it fell through to
// createWorktree's reclaim path with repoRoot === the worktree about to be
// force-removed. With repoRoot/worktreeDir both fixed to derive from --dir,
// worktreeDir stays the SAME stable path across both pick calls, so
// createClaimWorktree's reattach succeeds instead — same path, no removal,
// no crash, an even safer outcome than reclaim-and-recreate would be.
test('pick --id reattaches to its own already-existing worktree/branch when invoked FROM INSIDE that worktree via --dir, without crashing (tsk-k8u repro)', () => {
  const main = initGitCwd();
  run(main, ['init']);
  addOk(main, 'reclaim-from-inside');

  const firstPick = envelopeData(run(main, ['pick', '--id', 'reclaim-from-inside']).stdout);
  const ownWorktree = firstPick.worktree.path;

  // Simulate the claim-lock §3b release (item reached executing, claim
  // released back to todo) while the branch/worktree still stand.
  releaseClaimFor(main, 'reclaim-from-inside');

  // Re-pick FROM INSIDE the item's own worktree, --dir pointed at main —
  // repoRoot/worktreeDir must resolve to main (stable), never ownWorktree
  // (which the pre-fix bug would have force-removed out from under this
  // very call).
  const result = run(ownWorktree, ['pick', '--id', 'reclaim-from-inside', '--dir', main]);
  assert.equal(result.status, 0, `pick --dir from inside its own worktree failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.worktree.reused, true);
  assert.equal(data.worktree.path, ownWorktree, 'a stable repoRoot/worktreeDir makes this a clean reattach to the SAME checkout, not a force-remove-and-recreate');
  assert.ok(fs.existsSync(data.worktree.path));
});


test('pick --id claims that specific item, role fixed to "session" — pick has no --role flag at all, unlike take', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-explicit-other');
  addOk(cwd, 'pick-explicit-target');

  const result = run(cwd, ['pick', '--id', 'pick-explicit-target']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pick-explicit-target');
  assert.equal(data.role, 'session');
  assert.equal(data.worktree.branch, 'fgw/pick-explicit-target');

  assert.equal(stateView(cwd).work['pick-explicit-other'].status, 'todo', 'pick --id must not touch a different frontier item');
  assert.equal(stateView(cwd).work['pick-explicit-target'].status, 'doing');
  assert.equal(stateView(cwd).work['pick-explicit-target'].claimRole, 'session');
});


test('pick --id on an item already claimed (doing) fails the same way take does today — conflict, exit 3, no double-claim', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-double');
  assert.equal(run(cwd, ['pick', '--id', 'pick-double']).status, 0);

  const result = run(cwd, ['pick', '--id', 'pick-double']);
  assert.equal(result.status, 3);
  assert.equal(stateView(cwd).work['pick-double'].status, 'doing');
});


test('pick surfaces a real createWorktree failure and reverts the claim it already made, instead of orphaning the item in doing (tsk-4m0 D1)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-wt-fail');
  // Force `git worktree add -b fgw/pick-wt-fail ...` to fail deterministically
  // and for real (no mock): git's ref namespace cannot hold both a leaf ref
  // and a directory at the same path, so a pre-existing
  // "fgw/pick-wt-fail/leftover" ref makes git itself refuse to create the
  // leaf ref "fgw/pick-wt-fail" — exactly the kind of WorktreeError
  // createWorktree raises after the claim above has already committed.
  execFileSync('git', ['branch', 'fgw/pick-wt-fail/leftover'], { cwd });

  const result = run(cwd, ['pick', '--id', 'pick-wt-fail']);
  assert.notEqual(result.status, 0, 'pick must fail when createWorktree fails');
  assert.match(result.stderr, /git worktree add failed/);

  // tsk-4m0: previously the claim was NOT rolled back here (this test used
  // to assert status stayed "doing" with no worktree, per the original
  // pick cell's must_haves truth 5) — reproduced live on tsk-f31 as an
  // item permanently orphaned in doing with no automatic recovery
  // (docs/history/pick-worktree-claim-race/CONTEXT.md). The claim now
  // reverts back to todo so a failed pick looks like it never happened.
  const view = stateView(cwd);
  assert.equal(view.work['pick-wt-fail'].status, 'todo');
});


// --- pick: claim-lock §3a/§3c/§7 (guard loosen, branch-reuse generalize, claimTrigger) ---

test('pick --id claims a status:todo item at stage discovery (not the frontier at all) — the frontier/stage guard is gone (claim-lock §3a)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const id = JSON.parse(run(cwd, ['submit', 'Fuzzy request needing discovery']).stdout).data.id;
  assert.equal(stateView(cwd).work[id].stage, 'discovery');
  assert.ok(!envelopeData(run(cwd, ['ready']).stdout).some((i) => i.id === id), 'a discovery-stage item is never in the frontier');

  const result = run(cwd, ['pick', '--id', id]);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.from, 'todo');
  assert.equal(data.to, 'doing');
  assert.equal(stateView(cwd).work[id].status, 'doing');
  assert.equal(stateView(cwd).work[id].stage, 'discovery', 'pick claims the item without touching its stage');
});


test('pick with no --id still only opens the frontier head — the loosened guard applies to the explicit --id branch alone', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  run(cwd, ['submit', 'Fuzzy request never picked by id']); // stage discovery, never in the frontier
  const result = run(cwd, ['pick']);
  assert.notEqual(result.status, 0, 'the frontier is empty — a clarify-stage item must not be silently auto-picked');
});


test('pick --via stamps claimTrigger on the item; omitting --via leaves it entirely absent (claim-lock §7)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-via-herdr');
  addOk(cwd, 'pick-via-none');

  assert.equal(run(cwd, ['pick', '--id', 'pick-via-herdr', '--via', 'herdr']).status, 0);
  assert.equal(stateView(cwd).work['pick-via-herdr'].claimTrigger, 'herdr');

  assert.equal(run(cwd, ['pick', '--id', 'pick-via-none']).status, 0);
  assert.equal('claimTrigger' in stateView(cwd).work['pick-via-none'], false);
});


test('pick --via requires a non-empty value, rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-via-empty');
  const result = run(cwd, ['pick', '--id', 'pick-via-empty', '--via']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pick-via-empty'].status, 'todo', 'a rejected --via must not leave a partial claim');
});


test('pick reclaims a released todo item onto its OWN existing branch tip, not a fresh HEAD (claim-lock §3c: branch-reuse keyed on branchExists alone, not status)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'reuse-branch-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'reuse-branch-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  assert.equal(firstPick.worktree.reused, false);

  // Advance the branch's own tip past repoRoot's HEAD — simulates the
  // fgos-exploring/planning hard rule (commit CONTEXT.md/plan.md before the
  // release-triggering `fgos discover` call).
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  const branchTip = execFileSync('git', ['rev-parse', 'fgw/reuse-branch-item'], { cwd, encoding: 'utf8' }).trim();
  assert.notEqual(branchTip, gitHead(cwd), 'the branch must have genuinely advanced past main');

  // Release (claim-lock §3b's own edge, doing -> todo) without settling the
  // item — the branch and its commit survive (worktree.mjs never deletes it).
  releaseClaimFor(cwd, 'reuse-branch-item');
  assert.equal(stateView(cwd).work['reuse-branch-item'].status, 'todo');

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'reuse-branch-item']).stdout);
  assert.equal(secondPick.from, 'todo');
  assert.equal(secondPick.branchHeadAtTake, branchTip, 'reclaims the SAME branch tip, not repoRoot\'s current HEAD');
  assert.equal(secondPick.worktree.branch, 'fgw/reuse-branch-item');
  assert.equal(secondPick.worktree.reused, true, 'createWorktree reuses the existing fgw/<id> branch');
});


test('pick on a leaf item whose root has no fgw/<rootId> branch yet forks from repoRoot HEAD instead of orphaning the claim (claim-port.mjs baseRef guard)', () => {
  // A leaf claimed before the runner ever dispatched its root (e.g. a human
  // `pick` right after decompose, no runner involved yet) has no root branch
  // to fork from — claim-port.mjs must fall back to repoRoot's current HEAD,
  // the same as a non-leaf claim, rather than passing createWorktree a
  // baseRef naming a branch git doesn't have. Passing that nonexistent
  // baseRef used to throw AFTER moveWork had already committed the
  // doing-claim, leaving the item stuck in doing with no branch/worktree and
  // no automatic recovery (startupReap skips human/session claims by design).
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'orphan-root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'orphan-leaf-item', title: 'Leaf Item', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'orphan-root-item' });

  const result = run(cwd, ['pick', '--id', 'orphan-leaf-item']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'orphan-leaf-item');
  assert.equal(data.branchHeadAtTake, gitHead(cwd), 'no root branch exists yet — must fork from repoRoot HEAD, not a nonexistent baseRef');
  assert.equal(data.worktree.branch, 'fgw/orphan-leaf-item');
  assert.equal(data.worktree.reused, false);
  assert.equal(stateView(cwd).work['orphan-leaf-item'].status, 'doing');
});


test('pick on a leaf item whose root DOES have a live fgw/<rootId> branch forks the leaf worktree from that branch tip, not from repoRoot HEAD (claim-port.mjs D3 leaf-vs-root split, positive path)', () => {
  // The counterpart to the fallback test above: once fgw/<rootId> actually
  // exists (e.g. an earlier sibling already merged into it), a leaf pick
  // must fork FROM that tip — mirroring approve/review's own leaf-vs-root
  // split (bin/fgos.mjs's D3 comment) — never from main/repoRoot HEAD,
  // which would silently drop whatever the root branch already carries
  // (the tsk-1wd-3 dogfood incident this item exists to close).
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'baseref-root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'baseref-leaf-item', title: 'Leaf Item', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: 'baseref-root-item' });

  // Give fgw/baseref-root-item a tip that genuinely differs from repoRoot's
  // current HEAD (same tree, a distinct commit) so the assertion below can
  // tell "forked from root branch" apart from "forked from HEAD" for real.
  const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd, encoding: 'utf8' }).trim();
  const rootTip = execFileSync('git', ['commit-tree', tree, '-p', 'HEAD', '-m', 'root progress'], { cwd, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', 'fgw/baseref-root-item', rootTip], { cwd });
  assert.notEqual(rootTip, gitHead(cwd), 'the root branch tip must genuinely differ from repoRoot HEAD for this test to prove anything');

  const result = run(cwd, ['pick', '--id', 'baseref-leaf-item']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.branchHeadAtTake, rootTip, 'a live root branch exists — the leaf must fork from ITS tip, not repoRoot HEAD');
  assert.equal(data.worktree.branch, 'fgw/baseref-leaf-item');
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: data.worktree.path, encoding: 'utf8' }).trim(),
    rootTip,
    'the new worktree checkout itself must sit on the root branch tip, not main',
  );
});


test('pick on a leaf item refuses the claim when a dep is not yet status:done, instead of forking a worktree that could be missing that dep\'s content (claim-port.mjs D2 sibling-merge-ordering guard, tsk-3t4)', () => {
  // The tsk-1wd-3 dogfood scenario: a leaf picked directly by id (frontier
  // bypass, claim-lock §3a) whose dep hasn't been approved/merged into
  // fgw/<rootId> yet. Approve is the ONLY path a leaf dep reaches
  // status:'done' through, and it never lands 'done' without first merging
  // into the root branch (bin/fgos.mjs's leaf approve case) — so a dep
  // that isn't 'done' yet is exactly the case that must be refused, not
  // silently forked from a root branch missing that dep's content.
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'guard-root-item', { title: 'Root Item' });
  addOk(cwd, 'guard-dep-item', { title: 'Dep Item' }); // left status: todo — never approved
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'guard-leaf-item',
    title: 'Leaf Item',
    kind: 'task',
    status: 'todo',
    deps: ['guard-dep-item'],
    risk: 'light',
    refs: [],
    verify: 'true',
    parent: 'guard-root-item',
  });
  const before = eventLines(cwd).length;

  const result = run(cwd, ['pick', '--id', 'guard-leaf-item']);
  assert.notEqual(result.status, 0, 'pick must refuse a leaf claim while a dep is not yet status:done');
  assert.match(result.stderr, /guard-dep-item/, 'the refusal must name the unmerged dep');

  // The refusal must be a clean no-op — never the "claimed to doing but no
  // branch/worktree" orphan the 268b172 baseRef fix already closed once for
  // a different cause: no event written, status untouched, no branch made.
  assert.equal(eventLines(cwd).length, before, 'a refused claim must never write a claim event');
  assert.equal(stateView(cwd).work['guard-leaf-item'].status, 'todo');
  assert.equal(
    execFileSync('git', ['branch', '--list', 'fgw/guard-leaf-item'], { cwd, encoding: 'utf8' }).trim(),
    '',
    'a refused claim must never create the leaf\'s own branch',
  );
});


test('take --id on a blocked item with a live fgw/<id> branch claims via blocked -> doing, recording branchHeadAtTake (the branch\'s own HEAD, never the main-based headAtTake)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-take-a');
  const branchHead = gitAtCwd(cwd, ['rev-parse', 'fgw/branch-take-a']).trim();
  const mainHeadBefore = gitHead(cwd);
  assert.notEqual(branchHead, mainHeadBefore, 'sanity: the branch really is ahead of main');

  const result = run(cwd, ['take', '--id', 'branch-take-a']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  const takeData = envelopeData(result.stdout);
  assert.equal(takeData.from, 'blocked');
  assert.equal(takeData.to, 'doing');
  assert.equal(takeData.branch, 'fgw/branch-take-a');

  const view = stateView(cwd);
  assert.equal(view.work['branch-take-a'].status, 'doing');
  assert.equal(view.work['branch-take-a'].claimRole, 'human');
  assert.equal(view.work['branch-take-a'].branchHeadAtTake, branchHead);
  assert.equal('headAtTake' in view.work['branch-take-a'], false, 'a branch take never records the main-based headAtTake');
  assert.equal(view.outcomes['branch-take-a'].predicted.branchHeadAtTake, branchHead);
  assert.equal(gitHead(cwd), mainHeadBefore, "take never touches the human's own main checkout");
});


test('take --id on a blocked item with NO live branch still falls through to the old todo-only CAS — conflict, exit 3, item stays blocked', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'blocked-no-branch');
  run(cwd, ['move', 'blocked-no-branch', '--to', 'blocked']);

  const result = run(cwd, ['take', '--id', 'blocked-no-branch']);
  assert.equal(result.status, 3);
  assert.equal(stateView(cwd).work['blocked-no-branch'].status, 'blocked');
});


test('pick --id on a blocked item with a live fgw/<id> branch claims via blocked -> doing (the same edge take uses), role "session", and REUSES the existing branch/worktree instead of creating a duplicate', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'pick-branch-a');
  const branchHead = gitAtCwd(cwd, ['rev-parse', 'fgw/pick-branch-a']).trim();
  const mainHeadBefore = gitHead(cwd);

  const result = run(cwd, ['pick', '--id', 'pick-branch-a']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.role, 'session');
  assert.equal(data.from, 'blocked');
  assert.equal(data.to, 'doing');
  assert.equal(data.branch, 'fgw/pick-branch-a');
  assert.equal(data.branchHeadAtTake, branchHead);
  assert.equal(data.worktree.branch, 'fgw/pick-branch-a');
  assert.equal(data.worktree.reused, true, 'an existing branch must be reused, never recreated');

  const view = stateView(cwd);
  assert.equal(view.work['pick-branch-a'].status, 'doing');
  assert.equal(view.work['pick-branch-a'].claimRole, 'session');
  assert.equal(view.work['pick-branch-a'].branchHeadAtTake, branchHead);
  assert.equal(gitHead(cwd), mainHeadBefore, "pick never touches the human's own main checkout");

  // truth 3: the reused branch is real and non-detached inside its worktree.
  assert.doesNotThrow(() =>
    execFileSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: data.worktree.path, stdio: 'ignore' }),
  );
});


test('session start returns a session id and an existing worktree path, exit 0', () => {
  const cwd = initGitCwd();
  const { result, sessionId, worktreePath } = startSession(cwd);
  assert.equal(result.status, 0, `session start should succeed: ${result.stderr}`);
  assert.ok(sessionId, 'data names a session id');
  assert.ok(worktreePath, 'data names a worktree path to cd into');
  assert.ok(fs.existsSync(worktreePath), 'the worktree directory actually exists on disk');

  run(cwd, ['session', 'end', sessionId]);
});
