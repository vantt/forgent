// fgos-return.test.mjs -- phần "return, reject" của bộ test CLI, tách nguyên văn
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


test('return happy path: verify passes -> doing to proposed, actual outcome recorded, no settlement (settlement belongs to the -> done edge)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-ok']).status, 0);
  commitFile(cwd, 'proof.txt');

  const headAtReturn = gitHead(cwd);
  const result = run(cwd, ['return', 'pull-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.passed, true);

  const view = stateView(cwd);
  assert.equal(view.work['pull-return-ok'].status, 'awaiting-approval');
  assert.equal(view.outcomes['pull-return-ok'].actual.outcome, 'awaiting-approval');
  assert.equal(view.outcomes['pull-return-ok'].actual.passed, true);
  assert.equal(view.outcomes['pull-return-ok'].actual.aheadCount, 1);
  assert.equal(view.work['pull-return-ok'].headAtReturn, headAtReturn, 'pr-lifecycle D3/D4: return records HEAD at green-return time, mirroring headAtTake at claim time');
  assert.equal('settlements' in view, false, 'doing -> awaiting-approval never settles (D4: settlement belongs to the -> done edge)');
});


test('return (verify passes, main-source): a live main-checkout.lock recorded under THIS session\'s own identity is released early, instead of waiting out the TTL (tsk-45z D1/D2)', () => {
  const cwd = initGitCwd();
  const sessionId = 'tsk-45z-test-session-ok';
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-releases-own-lock', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-releases-own-lock'], { FGOS_SESSION_ID: sessionId }).status, 0);
  commitFile(cwd, 'proof.txt');

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: sessionId, ts: Date.now() }));

  const result = run(cwd, ['return', 'pull-return-releases-own-lock'], { FGOS_SESSION_ID: sessionId });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval');
  assert.equal(fs.existsSync(lockPath), false, 'return must release its own live lock once verify passes and the item settles to proposed');
});


test('return (verify FAILS, main-source): a live own-identity lock is released too — settling to blocked is just as much "done with the checkout" as proposed (tsk-45z D1/D2)', () => {
  const cwd = initGitCwd();
  const sessionId = 'tsk-45z-test-session-blocked';
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-own-lock-blocked', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-own-lock-blocked'], { FGOS_SESSION_ID: sessionId }).status, 0);
  commitFile(cwd, 'wrong-file.txt'); // advances HEAD, never satisfies verify

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: sessionId, ts: Date.now() }));

  const result = run(cwd, ['return', 'pull-return-own-lock-blocked'], { FGOS_SESSION_ID: sessionId });
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  assert.equal(fs.existsSync(lockPath), false, 'return must release its own live lock even when verify fails and the item settles to blocked');
});


test('return (main-source) never touches a DIFFERENT session\'s live lock — never a blind unlink (tsk-45z D2)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-other-untouched', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-other-untouched'], { FGOS_SESSION_ID: 'tsk-45z-this-session' }).status, 0);
  commitFile(cwd, 'proof.txt');

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 'tsk-45z-a-different-live-session', ts: Date.now() }));

  const result = run(cwd, ['return', 'pull-return-other-untouched'], { FGOS_SESSION_ID: 'tsk-45z-this-session' });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval');
  assert.equal(fs.existsSync(lockPath), true, 'a different session\'s live lock must survive this return untouched');
  assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).pid, 'tsk-45z-a-different-live-session');
});


test('return: a changed sensitive file outside the item\'s footprint surfaces a frozenJudgeHits advisory, and never blocks the return', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-judge', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-judge']).status, 0);
  commitFile(cwd, 'proof.txt');
  commitFile(cwd, 'package.json', '{}\n');

  const result = run(cwd, ['return', 'pull-return-judge']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.passed, true, 'the frozen-judge advisory never fails the return itself');
  assert.deepEqual(data.frozenJudgeHits, [{ file: 'package.json', rule: 'package manifest' }]);
});


test('return: a changed sensitive file DECLARED in the item\'s footprint is not a hit', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  assert.equal(run(cwd, ['add', 'pull-return-judge-declared', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'test -f proof.txt', '--footprint', 'package.json', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', 'pull-return-judge-declared']).status, 0);
  commitFile(cwd, 'proof.txt');
  commitFile(cwd, 'package.json', '{}\n');

  const result = run(cwd, ['return', 'pull-return-judge-declared']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.passed, true);
  assert.deepEqual(data.frozenJudgeHits, []);
});


// --- tsk-4hl (post-tsk-2ig independent review): footprintDiffHits wired
// into `return` next to frozenJudgeHits -- broader (any changed file
// outside footprint, not just the narrow sensitive-pattern set) and
// exempt when no footprint is declared at all (D5). ---

test('return: a changed file outside the item\'s footprint surfaces a footprintDiffHits advisory even when it matches no frozenJudgeHits pattern, never blocks (tsk-4hl)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  assert.equal(run(cwd, ['add', 'pull-return-footprint-diff', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'test -f proof.txt', '--footprint', 'proof.txt', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', 'pull-return-footprint-diff']).status, 0);
  commitFile(cwd, 'proof.txt');
  commitFile(cwd, 'random-outside.txt', 'not sensitive\n');

  const result = run(cwd, ['return', 'pull-return-footprint-diff']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.passed, true, 'the footprint-diff advisory never fails the return itself');
  assert.deepEqual(data.frozenJudgeHits, [], 'random-outside.txt matches no sensitive pattern, so the narrow frozenJudgeHits stays clean');
  // Not a strict deepEqual on the whole array: `git add -A` also sweeps in
  // whatever real .fgos/* deltas `take` itself produced since the last
  // commit (events.jsonl, coexistence.json) -- genuinely outside the
  // declared footprint too, so footprintDiffHits is CORRECT to flag them;
  // this test only asserts the one file it actually cares about is there.
  assert.ok(data.footprintDiffHits.some((hit) => hit.file === 'random-outside.txt'));
});


test('return: footprintDiffHits is empty when the item declares NO footprint at all (D5 absent-footprint exemption, same as footprintDiffHits\' own unit tests)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-no-footprint', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-no-footprint']).status, 0);
  commitFile(cwd, 'proof.txt');
  commitFile(cwd, 'anything.txt', 'x\n');

  const result = run(cwd, ['return', 'pull-return-no-footprint']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.deepEqual(envelopeData(result.stdout).footprintDiffHits, []);
});


test('return: a .fgos/* change bundled into the item\'s own commit (git add -A sweeping in take\'s own event-log write) is exempt from footprintDiffHits (tsk-x5r self-exempt)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  // tsk-5iv D2: commit the store's own bootstrap files (config.json,
  // coexistence.json, etc) BEFORE take/add -- matching the real main
  // checkout's topology, where these were committed long ago and only
  // events.jsonl changes on every take/return cycle. Without this, the
  // fixture's very first `git add -A` below would ALSO be the first time
  // config.json/coexistence.json are tracked at all, which is a one-time
  // bootstrap artifact this test is not about (D2 narrowed the exemption
  // to noise-only paths; those two are no longer exempt on purpose).
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'bootstrap .fgos/'], { cwd });
  const id = 'pull-return-fgos-exempt';
  assert.equal(run(cwd, ['add', id, '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'test -f proof.txt', '--footprint', 'proof.txt', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', id]).status, 0);
  // commitFile's git add -A sweeps in whatever .fgos/* delta `take` itself
  // produced since the last commit, alongside proof.txt -- the exact real
  // shape an ordinary `git commit -am` after `fgos take` produces, and
  // exactly what a concurrent session's own take/return/approve on the
  // shared main checkout can ALSO bundle into this item's own ownDiff
  // range (found by independent review after tsk-4hl merged). With the
  // bootstrap commit above, this delta is now genuinely just
  // events.jsonl's own append (take's real behavior), not a first-time
  // commit of the whole store.
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', id]);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.passed, true);
  assert.deepEqual(data.footprintDiffHits, [], 'a .fgos/* change bundled into the item\'s own commit must never be flagged');
});


// tsk-5iv D2 (round-3 review, MEDIUM): the original tsk-x5r exemption was a
// blanket `.fgos/**` match, which also swallowed hand-edited policy files
// (.fgos/config.json, .fgos/gate-bypass.json) that real items DO
// deliberately edit as their own work product -- an item that changes
// gate-bypass.json OUTSIDE its declared footprint must still surface in
// footprintDiffHits; only the append-only lifecycle noise (events.jsonl,
// entropy-history.jsonl) stays exempt.
test('return: a .fgos/gate-bypass.json change bundled into the item\'s own commit DOES surface in footprintDiffHits, unlike events.jsonl (tsk-5iv D2: exemption narrowed to noise only)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const id = 'pull-return-gb-not-exempt';
  assert.equal(run(cwd, ['add', id, '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'test -f proof.txt', '--footprint', 'proof.txt', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', id]).status, 0);
  // Simulates an item that quietly edits the safety-policy file outside its
  // declared footprint (proof.txt) -- fs.writeFileSync + take's own
  // events.jsonl delta both land in the same commit via commitFile's git
  // add -A, mirroring how a real gate-approve/policy edit would ride
  // alongside an item's own work.
  fs.writeFileSync(path.join(cwd, '.fgos', 'gate-bypass.json'), JSON.stringify({ level: 'off' }));
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', id]);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.passed, true, 'the footprint-diff advisory never fails the return itself');
  assert.ok(
    data.footprintDiffHits.some((hit) => hit.file === '.fgos/gate-bypass.json'),
    'a policy-file change outside the declared footprint must surface, not be silently swallowed by the noise exemption',
  );
});


test('return: the item\'s own docs/history/<id>/iron-law-evidence.md is exempt from footprintDiffHits (tsk-4hl self-exempt, avoids self-flagging every Iron-Law-gated item)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const id = 'pull-return-evidence-exempt';
  assert.equal(run(cwd, ['add', id, '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'test -f proof.txt', '--footprint', 'proof.txt', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', id]).status, 0);
  commitFile(cwd, 'proof.txt');
  fs.mkdirSync(path.join(cwd, 'docs', 'history', id), { recursive: true });
  commitFile(cwd, `docs/history/${id}/iron-law-evidence.md`, '# evidence\n');
  commitFile(cwd, 'random-outside.txt', 'not sensitive\n');

  const result = run(cwd, ['return', id]);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  // See the sibling test above for why this isn't a strict deepEqual --
  // real .fgos/* deltas from `take` legitimately show up here too.
  assert.ok(
    !data.footprintDiffHits.some((hit) => hit.file === `docs/history/${id}/iron-law-evidence.md`),
    'the evidence doc must never appear in footprintDiffHits',
  );
  assert.ok(data.footprintDiffHits.some((hit) => hit.file === 'random-outside.txt'), 'random-outside.txt must still be flagged');
});


test('return refuses a dirty working tree (uncommitted changes) as validation, exit 4, item stays doing', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-dirty']).status, 0);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'uncommitted\n'); // never git add/commit

  // Sanity: `.fgos/` is ALSO dirty here (take's own event, never committed —
  // reported collapsed as "?? .fgos/" since nothing inside it has ever been
  // tracked yet) — proving the .fgos/ exclusion below does not accidentally
  // mask this rejection; it's proof.txt, a real non-.fgos path, that trips it.
  assert.match(execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }), /\.fgos/);

  const result = run(cwd, ['return', 'pull-return-dirty']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-dirty'].status, 'doing');
});


test('return succeeds when a dirty file on cwd is UNRELATED to the item\'s own committed progress (tsk-598 D1/D2) — own-file-set scoping, not a whole-tree gate', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-unrelated-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-unrelated-dirty']).status, 0);
  commitFile(cwd, 'proof.txt'); // real committed progress since headAtTake

  // A path this item's headAtTake..HEAD diff never touches — another
  // session's uncommitted work sitting in the same main checkout (the
  // tsk-352 repro shape).
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated uncommitted work\n'); // never git add/commit

  const result = run(cwd, ['return', 'pull-return-unrelated-dirty']);
  assert.equal(result.status, 0, `return should succeed past an unrelated dirty file: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-return-unrelated-dirty'].status, 'awaiting-approval');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated uncommitted work\n', 'the unrelated dirty file must be left untouched, still uncommitted');
});


test('return still refuses when the SAME path the item committed is dirty again — a real conflict, tsk-598 D2, exit 4, item stays doing', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-real-conflict', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-real-conflict']).status, 0);
  commitFile(cwd, 'proof.txt'); // proof.txt is now IN this item's own committed diff

  // Re-dirty the SAME path after committing it — own-file-set membership
  // still blocks this, unchanged from before tsk-598.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'clobbered by another writer\n'); // never git add/commit

  const result = run(cwd, ['return', 'pull-return-real-conflict']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['pull-return-real-conflict'].status, 'doing');
});
