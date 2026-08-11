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
  assert.equal(run(main, ['move', 'reclaim-from-inside', '--to', 'todo', '--expect', 'doing']).status, 0);

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
  assert.equal(run(cwd, ['move', 'reuse-branch-item', '--to', 'todo', '--expect', 'doing']).status, 0);
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

test('session list shows a started session, then omits it after it ends', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd, ['--item', 'work-x']);

  const listed = run(cwd, ['session', 'list']);
  assert.equal(listed.status, 0);
  const listedData = envelopeData(listed.stdout);
  const entry = listedData.find((e) => e.sessionId === sessionId);
  assert.ok(entry, 'the started session id is listed');
  assert.equal(entry.itemId, 'work-x', 'the bound item id is listed');
  assert.equal(entry.worktreePath, worktreePath, 'the worktree path is listed');

  assert.equal(run(cwd, ['session', 'end', sessionId]).status, 0);
  const listedAfter = run(cwd, ['session', 'list']);
  assert.equal(listedAfter.status, 0);
  const listedAfterData = envelopeData(listedAfter.stdout);
  assert.ok(!listedAfterData.some((e) => e.sessionId === sessionId), 'ended session no longer listed');
  assert.deepEqual(listedAfterData, [], 'empty registry returns an empty list');
});

test('session end removes a non-diverged session cleanly — exit 0, worktree gone', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  assert.ok(fs.existsSync(worktreePath));

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.equal(ended.status, 0, `clean end should succeed: ${ended.stderr}`);
  assert.ok(!fs.existsSync(worktreePath), 'the worktree directory is removed from disk');
});

test('session end on a diverged session refuses at the CLI level and names the dangling sha, exit 4', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  const danglingSha = commitInWorktree(worktreePath, 'change.txt');

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.equal(ended.status, 4, 'a diverged session is refused as a clean validation error, not a crash');
  assert.ok(ended.stderr.includes(danglingSha), `the refusal names the dangling commit sha: ${ended.stderr}`);
  assert.ok(fs.existsSync(worktreePath), 'the worktree is left in place — no silent loss of the dangling commit');

  // Cleanup: only --force can remove a diverged session.
  run(cwd, ['session', 'end', sessionId, '--force']);
});

test('session end --force removes a diverged session anyway, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  commitInWorktree(worktreePath, 'change.txt');

  const forced = run(cwd, ['session', 'end', sessionId, '--force']);
  assert.equal(forced.status, 0, `--force should override the divergence refusal: ${forced.stderr}`);
  assert.equal(envelopeData(forced.stdout).forced, true);
  assert.ok(!fs.existsSync(worktreePath), 'the worktree directory is removed under --force');
  const remaining = envelopeData(run(cwd, ['session', 'list']).stdout);
  assert.ok(!remaining.some((e) => e.sessionId === sessionId));
});

test('session end on an unknown session id is a clean validation error, exit 4, no crash', () => {
  const cwd = initGitCwd();
  const result = run(cwd, ['session', 'end', 'no-such-session']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown or already-ended session/);
});

test('session with no sub-verb, and an unknown sub-verb, are both rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  assert.equal(run(cwd, ['session']).status, 4);
  assert.equal(run(cwd, ['session', 'bogus']).status, 4);
});

// `session gc` (p-fgos-session-gc): reclaims registry entries whose worktree
// is gone from git or whose one-shot `session start` CLI pid has since
// exited — every started session qualifies for the pid half almost
// immediately (the CLI process that started it already exited), so these
// tests key on divergence/dirty-work to prove what gc does and does NOT
// touch, matching test/runner/session.test.mjs's own reclaim coverage.

test('session gc reclaims a clean, untouched session and reports it, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);

  const gced = run(cwd, ['session', 'gc']);
  assert.equal(gced.status, 0, `gc should succeed: ${gced.stderr}`);
  const data = envelopeData(gced.stdout);
  assert.deepEqual(data.reclaimed, [sessionId], 'the clean session is reclaimed');
  assert.deepEqual(data.skipped, []);
  assert.ok(!fs.existsSync(worktreePath), 'the reclaimed worktree is removed from disk');
  assert.deepEqual(envelopeData(run(cwd, ['session', 'list']).stdout), [], 'registry entry dropped');
});

test('session gc spares a diverged session and reports it as skipped, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  const danglingSha = commitInWorktree(worktreePath, 'change.txt');

  const gced = run(cwd, ['session', 'gc']);
  assert.equal(gced.status, 0);
  const data = envelopeData(gced.stdout);
  assert.deepEqual(data.reclaimed, []);
  assert.deepEqual(data.skipped, [sessionId], 'the diverged session is skipped, not reclaimed');
  assert.ok(fs.existsSync(worktreePath), 'the worktree with the dangling commit is preserved');

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.ok(ended.stderr.includes(danglingSha), 'end still names the preserved dangling commit');
  run(cwd, ['session', 'end', sessionId, '--force']);
});

test('session gc spares a session with uncommitted (never-committed) changes, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  fs.writeFileSync(path.join(worktreePath, 'wip.txt'), 'not committed yet\n');

  const gced = run(cwd, ['session', 'gc']);
  assert.equal(gced.status, 0);
  const data = envelopeData(gced.stdout);
  assert.deepEqual(data.reclaimed, [], 'nothing reclaimed — the only session is dirty');
  assert.deepEqual(data.skipped, [sessionId], 'dirty session is skipped, not silently discarded');
  assert.ok(fs.existsSync(path.join(worktreePath, 'wip.txt')), 'the uncommitted file survives gc');

  run(cwd, ['session', 'end', sessionId, '--force']);
});

test('unlock: no lock file present -- reports cleared, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['unlock']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.cleared, true);
  assert.equal(data.reason, 'stale-or-free');
});

test('unlock: lock held by a dead pid -- self-heals via the existing reclaim path, reports cleared', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // A pid essentially guaranteed dead: an implausibly high, never-assigned value.
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: 999999999, ts: Date.now() }));

  const result = run(cwd, ['unlock']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.cleared, true);
  assert.equal(data.reason, 'stale-or-free');
});

test('unlock: lock genuinely held by a live session -- refuses, reports the holder identity, never deletes the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // The test process's own pid is genuinely alive and distinct from the
  // spawned CLI child's pid -- a real live-other-holder case.
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const result = run(cwd, ['unlock']);

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, new RegExp(`held by a live session \\(${process.pid}, `));
  assert.match(result.stderr, /held \d+[ms].*expires in \d+[ms]/);
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
});

test('unlock: string-identity lock within TTL -- still refuses (D5 fail-closed, unchanged), but never claims "live session" (tsk-24t)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // The exact shape .githooks/pre-commit writes per commit: a STRING
  // identity, not a numeric pid -- tryAcquireOnce can never probe its
  // liveness (no pid to check), so held-ness is judged by TTL freshness
  // alone (main-checkout-lock.mjs's own documented D5 fail-closed design).
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: 'some-writer-session-id', ts: Date.now() }));

  const result = run(cwd, ['unlock']);

  // Behavior unchanged (D1): still refuses, still never deletes the file.
  assert.equal(result.status, 7, result.stderr);
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
  // Message honesty (D2): must not fabricate "live session" for a branch
  // that never checked liveness -- must say plainly that liveness is
  // undetermined.
  assert.doesNotMatch(result.stderr, /live session/);
  assert.match(result.stderr, /liveness cannot be determined/);
  assert.match(result.stderr, /some-writer-session-id/);
});

test('unlock: corrupt (unparseable) lock content -- force-reclaims via forceReclaimAmbiguousLock, removes the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), 'not json at all {{{');

  const result = run(cwd, ['unlock']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.cleared, true);
  assert.equal(data.reason, 'reclaimed');
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), false);
});

test('unlock: registered in the --help --json manifest with write-only touchesState/externalEffect labels', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'unlock');
  assert.ok(entry, 'unlock entry missing from --help --json manifest');
  assert.equal(entry.touchesState, true);
  assert.equal(entry.externalEffect, false);
});

// --- `fgos lock-status` (tsk-5z2, D1): read-only main-checkout.lock report -

test('lock-status: no lock file present -- reports "free"', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['lock-status']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'free');
  assert.equal(data.holderPid, null);
});

test('lock-status: held by a live session -- reports "live" with holder identity, age, and remaining TTL, exit 0 (never refuses)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const result = run(cwd, ['lock-status']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'live');
  assert.equal(data.holderPid, process.pid);
  assert.ok(typeof data.lockAgeMs === 'number');
  assert.ok(typeof data.remainingTtlMs === 'number');
  assert.match(data.lockAge, /^\d+[ms]/);
  assert.match(data.remainingTtl, /^\d+[ms]/);
});

test('lock-status: held by a dead pid -- reports "stale" and never reclaims the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: 999999999, ts: Date.now() }));

  const result = run(cwd, ['lock-status']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'stale');
  assert.equal(data.holderPid, 999999999);
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
});

test('lock-status: corrupt lock content -- reports "ambiguous" and never removes the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), 'not json at all {{{');

  const result = run(cwd, ['lock-status']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'ambiguous');
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
  assert.equal(fs.readFileSync(mainCheckoutLockPath(cwd), 'utf8'), 'not json at all {{{');
});

test('lock-status: registered in the --help --json manifest as read-only (touchesState/externalEffect both false)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'lock-status');
  assert.ok(entry, 'lock-status entry missing from --help --json manifest');
  assert.equal(entry.touchesState, false);
  assert.equal(entry.externalEffect, false);
});

test('take --no-wait fails immediately on a live-held lock, same message/exit code as an unwaited claim, no retry delay', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-no-wait-take', { verify: 'true' });
  writeLiveLock(cwd, 1000); // well within DEFAULT_TTL_MS -- would never clear on its own during this test

  const start = Date.now();
  const result = run(cwd, ['take', 'wait-no-wait-take', '--no-wait']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, /main checkout locked by pid/);
  assert.doesNotMatch(result.stderr, /waited \d+ms before giving up/, '--no-wait must never engage the retry loop at all');
  assert.ok(elapsed < 2000, `--no-wait must fail fast, not wait out any budget (took ${elapsed}ms)`);
});

test('take (default, no flags) retries through a lock whose remainingTtlMs is short, and succeeds once it clears -- D3\'s default-ON behavior', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-default-take', { verify: 'true' });
  // remainingTtlMs ~= 3s at write time: short enough to clear inside this
  // test without waiting out the real DEFAULT_TTL_MS (3 minutes). The
  // budget's own BOUNDARY_GRACE_MS (lock-wait.mjs) is what actually makes
  // this reliable, not a large margin here -- without it, the loop's own
  // give-up instant and the lock's real clearance instant are derived from
  // the same clock read and coincide almost exactly, racing event-loop
  // timer jitter regardless of how big this margin is.
  writeLiveLock(cwd, DEFAULT_TTL_MS - 3000);

  const start = Date.now();
  const result = run(cwd, ['take', 'wait-default-take']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).id, 'wait-default-take');
  assert.ok(elapsed >= 500, `must have actually waited for the lock to clear, not raced past it (took ${elapsed}ms)`);
});

test('take --wait <ms> tightens the budget below the lock\'s own remainingTtlMs, and fails with the exhausted-budget message once spent', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-tight-budget-take', { verify: 'true' });
  writeLiveLock(cwd, 1000); // remainingTtlMs ~179s -- would never clear naturally in a test

  const start = Date.now();
  const result = run(cwd, ['take', 'wait-tight-budget-take', '--wait', '600']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, /waited \d+ms before giving up/, 'an exhausted explicit --wait budget must be distinguishable from an immediate-fail');
  assert.ok(elapsed >= 500 && elapsed < 5000, `must have waited roughly the --wait budget, not the full remainingTtlMs (took ${elapsed}ms)`);
});

test('take --wait rejects a non-numeric or non-positive value the same way --timeout already does', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-bad-value-take');

  const result = run(cwd, ['take', 'wait-bad-value-take', '--wait', 'nope']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be a positive number of milliseconds/);
});

test('take --wait rejects a value above the 900000ms (15 min) cap -- tsk-2rf D3', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-over-cap-take');

  const result = run(cwd, ['take', 'wait-over-cap-take', '--wait', '900001']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be at most 900000ms \(15 min\)/);
});

test('pick --no-wait fails immediately on a live-held lock, same as take --no-wait', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-no-wait-pick', { verify: 'true' });
  writeLiveLock(cwd, 1000);

  const start = Date.now();
  const result = run(cwd, ['pick', 'wait-no-wait-pick', '--no-wait']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, /main checkout locked by pid/);
  assert.ok(elapsed < 2000, `--no-wait must fail fast (took ${elapsed}ms)`);
});

test('take/pick/approve are documented in the --help --json manifest with wait/no-wait properties', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  for (const name of ['take', 'pick', 'approve']) {
    const entry = manifest.commands.find((c) => c.name === name);
    assert.ok(entry, `${name} entry missing from --help --json manifest`);
    assert.ok(entry.parameters.properties.wait, `${name} manifest entry missing "wait" property`);
    assert.ok(entry.parameters.properties['no-wait'], `${name} manifest entry missing "no-wait" property`);
  }
});

// --- re-claiming an item whose branch and worktree are still standing
// (tsk-65n) -----------------------------------------------------------------

test('pick on an item whose fgw/<id> worktree is still live hands back that SAME worktree instead of removing it out from under the session working there', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'repick-live-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  // A claim released at the clarify/decompose -> executing boundary, with the
  // session still sitting in its worktree.
  assert.equal(run(cwd, ['move', 'repick-live-item', '--to', 'todo', '--expect', 'doing']).status, 0);

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath, 'the live worktree is reattached, not replaced');
  assert.equal(secondPick.worktree.reused, true);
  assert.equal(fs.existsSync(worktreePath), true);
  assert.equal(fs.existsSync(path.join(worktreePath, 'CONTEXT.md')), true, 'work committed before the release is still there');
});

test('pick reattaches even when the live worktree has uncommitted work, leaving that work untouched', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'repick-dirty-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  fs.writeFileSync(path.join(worktreePath, 'draft.md'), 'half-written\n');
  assert.equal(run(cwd, ['move', 'repick-dirty-item', '--to', 'todo', '--expect', 'doing']).status, 0);

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath);
  assert.equal(fs.readFileSync(path.join(worktreePath, 'draft.md'), 'utf8'), 'half-written\n');
});

test('take refuses a todo item whose own fgw/<id> branch already exists, naming pick instead of silently claiming source:main', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'take-with-branch-item');

  // the branch (and worktree) come into being via pick; the claim is then
  // released, leaving a todo item whose work lives on the branch
  envelopeData(run(cwd, ['pick', '--id', 'take-with-branch-item']).stdout);
  assert.equal(run(cwd, ['move', 'take-with-branch-item', '--to', 'todo', '--expect', 'doing']).status, 0);

  const taken = run(cwd, ['take', '--id', 'take-with-branch-item']);

  assert.notEqual(taken.status, 0, 'a main-checkout take of branch-resident work is refused');
  assert.match(taken.stderr, /already has its own branch fgw\/take-with-branch-item/);
  assert.match(taken.stderr, /fgos pick take-with-branch-item/);
  assert.equal(stateView(cwd).work['take-with-branch-item'].status, 'todo', 'the refusal is a clean no-op');
});

test('take still claims a todo item that has no fgw/<id> branch of its own', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'take-no-branch-item');

  const taken = run(cwd, ['take', '--id', 'take-no-branch-item']);

  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  const data = envelopeData(taken.stdout);
  assert.equal(data.source, 'main');
  assert.equal(stateView(cwd).work['take-no-branch-item'].status, 'doing');
});
