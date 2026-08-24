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

test('return: a .fgos/events-jsonl.truncation-guard.json change bundled into the item\'s own commit is exempt from footprintDiffHits (tsk-vim)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'bootstrap .fgos/'], { cwd });
  const id = 'pull-return-guard-exempt';
  assert.equal(run(cwd, ['add', id, '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'test -f proof.txt', '--footprint', 'proof.txt', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', id]).status, 0);
  fs.writeFileSync(path.join(cwd, '.fgos', 'events-jsonl.truncation-guard.json'), '{"truncated": false}\n');
  // -f: this fixture's own .gitignore (initGitCwd) now excludes this exact
  // path, matching this real repo's own root .gitignore (tsk-cgg) -- so a
  // plain `git add -A` would never even stage it, which would make this
  // test pass trivially without ever exercising FGOS_NOISE_ONLY_PATHS at
  // all. Force-adding it here reproduces the one real scenario where the
  // regex still matters: a branch/checkout whose .gitignore predates this
  // exclusion (or another fgOS-adopting project that never added it) can
  // still end up with this file committed alongside real work.
  execFileSync('git', ['add', '-f', '.fgos/events-jsonl.truncation-guard.json'], { cwd });
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', id]);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.passed, true);
  assert.deepEqual(data.footprintDiffHits, [], 'a .fgos/events-jsonl.truncation-guard.json change bundled into the item\'s own commit must never be flagged');
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

test('return with a declared footprint still refuses on an uncommitted footprint path (tsk-598 D3) even though it was never committed', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-footprint-dirty', { verify: 'test -f proof.txt', footprint: 'footprint-guarded.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-footprint-dirty']).status, 0);
  commitFile(cwd, 'proof.txt'); // real committed progress since headAtTake

  // footprint-guarded.txt is declared in item.footprint but was never
  // committed — absent from headAtTake..HEAD. Per D3, a footprint path
  // still blocks even uncommitted.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'forgot to commit this\n'); // never git add/commit

  const result = run(cwd, ['return', 'pull-return-footprint-dirty']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['pull-return-footprint-dirty'].status, 'doing');
});

test('return succeeds when ONLY .fgos/ (the live event log) is dirty — its own take/return writes are excluded from the clean-tree gate (no more manual events.jsonl commit before every return)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-fgos-only-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-fgos-only-dirty']).status, 0);

  // Commit ONLY the produced file — deliberately leave the take event's
  // `.fgos/events.jsonl` delta uncommitted, unlike commitFile's `git add -A`
  // which would fold both together and never isolate the exclusion.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  execFileSync('git', ['add', 'proof.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd });

  // `.fgos/` may collapse into a single untracked-directory line
  // ("?? .fgos/") when nothing inside it is tracked yet, OR — since
  // tsk-3ve's periodic-checkpoint-commit (T5) now bootstrap-commits the
  // initial per-writer events shard on its own schedule — show one line
  // per still-dirty path inside `.fgos/` once that shard exists (an "M"
  // for the shard itself alongside "??" for anything not yet committed,
  // e.g. coexistence.json). Either shape must still count as "only
  // .fgos/ dirty" for the exclusion below: assert every line is under
  // `.fgos/`, never a fixed line count.
  const statusLines = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.ok(statusLines.length >= 1, 'sanity: .fgos/ must be dirty at this point');
  for (const line of statusLines) {
    const changedPath = line.slice(3);
    assert.ok(
      changedPath === '.fgos' || changedPath.startsWith('.fgos/'),
      `sanity: every dirty path must be under .fgos/, got: ${line}`,
    );
  }

  const result = run(cwd, ['return', 'pull-return-fgos-only-dirty']);
  assert.equal(result.status, 0, `return should succeed with only .fgos/ dirty: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-return-fgos-only-dirty'].status, 'awaiting-approval');
});

test('return succeeds when cwd is a subdirectory of the real git top-level and only .fgos/ (under that subtree) is dirty', () => {
  const { cwd } = initGitCwdInSubdir();
  run(cwd, ['init']);
  addOk(cwd, 'sub-return-fgos-only-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'sub-return-fgos-only-dirty']).status, 0);

  // Commit ONLY the produced file, same isolation as the top-level
  // "ONLY .fgos/ dirty" test above — the take event's `.fgos/events.jsonl`
  // delta (under the subdirectory) is deliberately left uncommitted.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  execFileSync('git', ['add', 'proof.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd });

  const result = run(cwd, ['return', 'sub-return-fgos-only-dirty']);
  assert.equal(result.status, 0, `return should succeed with only the subdirectory's .fgos/ dirty: ${result.stderr}`);
  assert.equal(stateView(cwd).work['sub-return-fgos-only-dirty'].status, 'awaiting-approval');
});

test('return succeeds when cwd is a subdirectory and an unrelated file is dirty ELSEWHERE in the repo, outside cwd\'s own subtree', () => {
  const { cwd, topLevel } = initGitCwdInSubdir();
  run(cwd, ['init']);
  addOk(cwd, 'sub-return-scope-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'sub-return-scope-ok']).status, 0);

  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  execFileSync('git', ['add', 'proof.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd });

  // A different in-flight change elsewhere in the repo, unrelated to this
  // item, never staged/committed — must never block returning THIS item.
  fs.writeFileSync(path.join(topLevel, 'unrelated-elsewhere.txt'), 'unrelated\n');

  const result = run(cwd, ['return', 'sub-return-scope-ok']);
  assert.equal(result.status, 0, `an unrelated dirty file outside cwd's subtree must never block return: ${result.stderr}`);
  assert.equal(stateView(cwd).work['sub-return-scope-ok'].status, 'awaiting-approval');
});

test('return still refuses when cwd is a subdirectory and a non-.fgos file is dirty INSIDE cwd\'s own subtree (real dirt still caught, does not overcorrect)', () => {
  const { cwd } = initGitCwdInSubdir();
  run(cwd, ['init']);
  addOk(cwd, 'sub-return-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'sub-return-dirty']).status, 0);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'uncommitted\n'); // never git add/commit

  const result = run(cwd, ['return', 'sub-return-dirty']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['sub-return-dirty'].status, 'doing');
});

test('return refuses a main-source claim whose verify is still a discovery-stage placeholder — clean validation, exit 4, item stays doing (tsk-1zo: previously shelled out to the placeholder text itself, "<word>: not found", exit 127)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-placeholder', { verify: 'chưa xác định — P15 bổ sung' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-placeholder']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-placeholder']);
  assert.equal(result.status, 4, `expected a clean validation refusal, got: ${result.stderr}`);
  assert.match(result.stderr, /placeholder verify/);
  assert.doesNotMatch(result.stderr, /not found/);
  assert.equal(stateView(cwd).work['pull-return-placeholder'].status, 'doing');
});

test('return refuses a branch-source claim whose verify is still a discovery-stage placeholder — clean validation, exit 4, item stays doing (tsk-1zo)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-placeholder', { verify: 'chưa xác định — P15 bổ sung' });

  const pickResult = run(cwd, ['pick', '--id', 'branch-return-placeholder']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const pickData = envelopeData(pickResult.stdout);
  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by the pick\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });

  const result = run(cwd, ['return', 'branch-return-placeholder']);
  assert.equal(result.status, 4, `expected a clean validation refusal, got: ${result.stderr}`);
  assert.match(result.stderr, /placeholder verify/);
  assert.doesNotMatch(result.stderr, /not found/);
  assert.equal(stateView(cwd).work['branch-return-placeholder'].status, 'doing');
});

test('return refuses when HEAD has not advanced past headAtTake — a clean tree with zero real progress — as validation, exit 4, item stays doing', () => {
  // `.fgos/` entirely gitignored here (unlike initGitCwd's `.fgos/state.json`
  // only) so the tree is genuinely clean right after `take` with no commit
  // at all — isolating the HEAD-advance check from the tree-clean check,
  // which a tracked events.jsonl would otherwise always fail together (this
  // repo's own convention commits events.jsonl, so making the tree clean
  // there always requires a commit that also advances HEAD).
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });

  run(cwd, ['init']);
  addOk(cwd, 'pull-return-stale', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-stale']).status, 0);

  const result = run(cwd, ['return', 'pull-return-stale']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /HEAD has not advanced/);
  assert.equal(stateView(cwd).work['pull-return-stale'].status, 'doing');
});

test('return --no-new-commits-ok closes out a main-source claim whose HEAD already reflects fully-done, verify-passing work before this claim (tsk-4on) — succeeds, records aheadCount:0', () => {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  run(cwd, ['init']);
  addOk(cwd, 'main-return-predone', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'main-return-predone']).status, 0);

  const result = run(cwd, ['return', 'main-return-predone', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);
  const view = stateView(cwd);
  assert.equal(view.work['main-return-predone'].status, 'awaiting-approval');
  assert.equal(view.outcomes['main-return-predone'].actual.aheadCount, 0);
});

test('return --no-new-commits-ok never bypasses verify itself for a main-source claim — still parks doing -> blocked + friction when verify fails (tsk-4on)', () => {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });

  run(cwd, ['init']);
  addOk(cwd, 'main-return-flag-verify-fail', { verify: 'test -f proof.txt' }); // never created
  assert.equal(run(cwd, ['take', '--id', 'main-return-flag-verify-fail']).status, 0);

  const result = run(cwd, ['return', 'main-return-flag-verify-fail', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  const view = stateView(cwd);
  assert.equal(view.work['main-return-flag-verify-fail'].status, 'blocked');
  assert.equal(view.outcomes['main-return-flag-verify-fail'].actual.outcome, 'blocked');
});

test('return verify-fail: doing -> blocked + friction (verification layer), exit 0 (a defined outcome, not a CLI error) — mirrors the runner\'s own park path', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-red', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-red']).status, 0);
  commitFile(cwd, 'wrong-file.txt'); // advances HEAD, but never satisfies verify

  const result = run(cwd, ['return', 'pull-return-red']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const view = stateView(cwd);
  assert.equal(view.work['pull-return-red'].status, 'blocked');
  assert.equal(view.outcomes['pull-return-red'].actual.outcome, 'blocked');
  assert.equal(view.outcomes['pull-return-red'].actual.passed, false);
  assert.equal(view.frictions['pull-return-red'][0].layer, 'verification');
  assert.equal(view.frictions['pull-return-red'][0].errorClass, 'verify-miss');
});

test("return verify-fail: park edge stamps role 'system' (not human) on the doing -> blocked event", () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-red-role', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-red-role']).status, 0);
  commitFile(cwd, 'wrong-file.txt'); // advances HEAD, but never satisfies verify

  const result = run(cwd, ['return', 'pull-return-red-role']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const lines = eventLines(cwd);
  const moveEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.move' && e.payload.to === 'blocked');
  assert.ok(moveEvent, 'expected a work.move event to blocked');
  assert.equal(moveEvent.payload.role, 'system');
});

test('return on an item that is not "doing" (still todo) is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-not-doing');
  const result = run(cwd, ['return', 'pull-return-not-doing']);
  assert.equal(result.status, 4);
});

test('return on an item claimed by the runner (claimRole "runner", no headAtTake) is rejected as validation — return only completes a take', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-runner-claim');
  const dir = path.join(cwd, '.fgos');
  moveWork(dir, { id: 'pull-return-runner-claim', to: 'doing', expectedStatus: 'todo', role: 'runner' });

  const result = run(cwd, ['return', 'pull-return-runner-claim']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-runner-claim'].status, 'doing');
});

test('return with no id at all is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const result = run(cwd, ['return']);
  assert.equal(result.status, 4);
});

test('return --timeout with a non-numeric or non-positive value is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-bad-timeout', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-bad-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-bad-timeout', '--timeout', 'soon']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-bad-timeout'].status, 'doing', 'a rejected --timeout never runs verify or moves the item');
});

test('return omitting --timeout falls back to the runner config\'s timeoutMs, blocking a verify that outlives it', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  writeShortRunnerConfig(cwd, 200);
  const scriptPath = writeHangScript(cwd, 1500);
  addOk(cwd, 'pull-return-fallback-timeout', { verify: `${process.execPath} ${JSON.stringify(scriptPath)}` });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-fallback-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-fallback-timeout']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked', 'the 200ms fallback timeout should have killed the 1.5s verify');
  assert.equal(stateView(cwd).work['pull-return-fallback-timeout'].status, 'blocked');
});

test('return --no-timeout opts out of the fallback, letting a verify that outlives the config timeout finish and pass', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  writeShortRunnerConfig(cwd, 200);
  const scriptPath = writeHangScript(cwd, 500);
  addOk(cwd, 'pull-return-no-timeout', { verify: `${process.execPath} ${JSON.stringify(scriptPath)}` });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-no-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-no-timeout', '--no-timeout']);
  assert.equal(result.status, 0, `return should succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval', '--no-timeout should have let the 500ms verify finish past the 200ms config timeout');
  assert.equal(stateView(cwd).work['pull-return-no-timeout'].status, 'awaiting-approval');
});

test('return --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-timeout-conflict', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-timeout-conflict']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['pull-return-timeout-conflict'].status, 'doing', 'a rejected flag combination never runs verify or moves the item');
});

test('return --timeout error text no longer claims omitting --timeout means no timeout', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-timeout-error-text', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-timeout-error-text']).status, 0);
  commitFile(cwd, 'proof.txt');

  // A bare --timeout (no value, last arg) is what actually triggers this
  // specific message -- 'soon' fails the separate numeric-check message
  // instead, which never carried the old "omit ... for no timeout" wording.
  const result = run(cwd, ['return', 'pull-return-timeout-error-text', '--timeout']);
  assert.equal(result.status, 4);
  assert.doesNotMatch(result.stderr, /omit --timeout entirely for no timeout/);
});

test('reject on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['reject', 'ghost', '--reason', 'nope']);
  assert.equal(result.status, 4);
});

test('reject without --reason is rejected as validation, exit 4, item stays proposed', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-no-reason-item');
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'doing']);
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['reject', 'reject-no-reason-item']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['reject-no-reason-item'].status, 'awaiting-approval');
});

test('reject on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-not-proposed-item');
  const result = run(cwd, ['reject', 'reject-not-proposed-item', '--reason', 'nope']);
  assert.equal(result.status, 2);
});

test('reject moves awaiting-approval -> todo with the reason recorded, role human, and runs no git command at all — never a revert', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'reject-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'reject-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'reject-pull-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['reject', 'reject-pull-item', '--reason', 'needs more test coverage']);
  assert.equal(result.status, 0, result.stderr);
  const rejectData = envelopeData(result.stdout);
  assert.equal(rejectData.from, 'awaiting-approval');
  assert.equal(rejectData.to, 'todo');
  assert.equal(rejectData.reason, 'needs more test coverage');

  assert.equal(gitHead(cwd), headBefore, 'reject must never touch git — HEAD unchanged');
  assert.ok(fs.existsSync(path.join(cwd, 'proof.txt')), 'reject never reverts the code already on main (D4)');

  const view = stateView(cwd);
  assert.equal(view.work['reject-pull-item'].status, 'todo');

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, 'needs more test coverage');
  assert.equal(lastEvent.payload.role, 'human');
});

test('return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) once real work is committed on the fresh fgw/<id> worktree — a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch\'s own progress instead of checking the (unchanged) main checkout', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'pick-fresh-return-ok', { verify: 'test -f proof.txt' });
  const mainHeadBefore = gitHead(cwd);

  const pickResult = run(cwd, ['pick', '--id', 'pick-fresh-return-ok']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const pickData = envelopeData(pickResult.stdout);
  assert.equal(pickData.worktree.reused, false, 'sanity: this is a fresh claim, not a blocked reclaim');

  // The real work happens on the fresh worktree pick just stood up — never
  // on the human's own main checkout.
  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by the fresh pick\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });
  const branchHeadAtReturn = gitAtCwd(cwd, ['rev-parse', 'fgw/pick-fresh-return-ok']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['return', 'pick-fresh-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['pick-fresh-return-ok'].status, 'awaiting-approval');
  assert.equal(view.work['pick-fresh-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['pick-fresh-return-ok'], false, 'a branch-source return never records the main-based headAtReturn');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});

test('return on a branch-source take: verify passes in a disposable detached worktree at the branch tip -> awaiting-approval, branchHeadAtReturn recorded (never headAtReturn), the human\'s own main checkout is untouched and no worktree is left behind', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-ok']).status, 0);
  // take's own event lands on events.jsonl in the SAME main tree (take never
  // uses a worktree) — commit that bookkeeping to main before switching
  // branches, exactly like commitFile's own doc comment describes.
  commitPending(cwd, 'state: take branch-return-ok');

  // The human commits their fix ON THE BRANCH — never on main.
  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-ok']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  const branchHeadAtReturn = gitAtCwd(cwd, ['rev-parse', 'fgw/branch-return-ok']).trim();
  gitAtCwd(cwd, ['checkout', 'main']);
  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['return', 'branch-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-ok'].status, 'awaiting-approval');
  assert.equal(view.work['branch-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['branch-return-ok'], false, 'a branch return never records the main-based headAtReturn (D2 CẤM)');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});

test('return on a branch-source take whose branch declares a real npm dependency: verify passes because the disposable detached worktree gets its own node_modules provisioned first (tsk-2vd — reproduces the real failure that blocked tsk-32n\'s own return)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  gitAtCwd(cwd, ['add', 'package.json']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'declare a dependency']);

  makeBlockedBranchItem(cwd, 'branch-return-deps', { verify: `node -e "require('fgos-test-localdep')"` });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-deps']).status, 0);
  commitPending(cwd, 'state: take branch-return-deps');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-deps']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['return', 'branch-return-deps']);
  assert.equal(result.status, 0, `return failed (before this item's fix, this failed with ERR_MODULE_NOT_FOUND exactly like tsk-32n's own return did): ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-deps'].status, 'awaiting-approval');
});

test('return on a branch-source take never touches a live main-checkout.lock (tsk-45z D1 scope: only the main-source path releases early — worktree commits never contend for this shared lock)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-lock-untouched', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-lock-untouched']).status, 0);
  commitPending(cwd, 'state: take branch-return-lock-untouched');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-lock-untouched']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // A lock recorded under this session's OWN identity — if return's release
  // wiring wrongly fired on the branch-source path too, this would vanish.
  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 'tsk-45z-branch-session', ts: Date.now() }));

  const result = run(cwd, ['return', 'branch-return-lock-untouched'], { FGOS_SESSION_ID: 'tsk-45z-branch-session' });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);
  assert.equal(fs.existsSync(lockPath), true, 'a branch-source return must never touch main-checkout.lock, even one it could self-recognize');
});

test('return on a branch-source take refuses when the branch has NOT advanced past branchHeadAtTake (no new commit) — validation, exit 4, item stays doing', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-stale', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-stale']).status, 0);

  const result = run(cwd, ['return', 'branch-return-stale']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /has not advanced past branchHeadAtTake/);
  assert.equal(stateView(cwd).work['branch-return-stale'].status, 'doing');
});

test('return without --no-new-commits-ok still refuses a branch-source claim with zero commits since take, even when the branch already satisfies verify (tsk-4on default-unchanged)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-predone-noflag', { verify: 'test -f proof.txt' });
  // The real work is already done and committed BEFORE this claim — mirrors
  // tsk-4j9: a parent whose children's merged content already sits on its
  // own branch from a prior session.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-predone-noflag']).status, 0);

  const result = run(cwd, ['return', 'branch-return-predone-noflag']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /has not advanced past branchHeadAtTake/);
  assert.equal(stateView(cwd).work['branch-return-predone-noflag'].status, 'doing');
});

test('return --no-new-commits-ok closes out a branch-source claim whose branch already reflects fully-done, verify-passing work before this claim (tsk-4on) — succeeds, records aheadCount:0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-predone', { verify: 'test -f proof.txt' });
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-predone']).status, 0);

  // Zero commits on the branch since take — nothing new to prove, the work
  // was already there before the claim.
  const result = run(cwd, ['return', 'branch-return-predone', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-predone'].status, 'awaiting-approval');
  assert.equal(view.outcomes['branch-return-predone'].actual.outcome, 'awaiting-approval');
  assert.equal(view.outcomes['branch-return-predone'].actual.passed, true);
  assert.equal(view.outcomes['branch-return-predone'].actual.aheadCount, 0);
});

test('return --no-new-commits-ok refuses a branch-source claim that was already blocked by a real verify-fail — the flag closes out work never returned, never rescues a failed retry (tsk-4on D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-cheat', { verify: 'test -f proof.txt' });

  const pickResult = run(cwd, ['pick', '--id', 'branch-return-cheat']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const worktreePath = envelopeData(pickResult.stdout).worktree.path;

  // A genuine verify-fail: commits a WRONG file, never satisfies verify.
  fs.writeFileSync(path.join(worktreePath, 'wrong-file.txt'), 'nope\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'wrong fix'], { cwd: worktreePath });

  const failResult = run(cwd, ['return', 'branch-return-cheat']);
  assert.equal(failResult.status, 0, `return should exit 0 for a defined blocked outcome: ${failResult.stderr}`);
  assert.equal(envelopeData(failResult.stdout).to, 'blocked');
  assert.equal(stateView(cwd).outcomes['branch-return-cheat'].actual.outcome, 'blocked');

  // Retake resets branchHeadAtTake to the (still-failing) tip — the
  // deliberate anti-cheat gate for a blocked-branch retake (human-rounds D2).
  const retakeResult = run(cwd, ['take', '--id', 'branch-return-cheat']);
  assert.equal(retakeResult.status, 0, `retake failed: ${retakeResult.stderr}`);

  // Zero new commits since the retake, flag passed — refused: a real
  // blocked outcome is still on record for this item.
  const result = run(cwd, ['return', 'branch-return-cheat', '--no-new-commits-ok']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cannot use --no-new-commits-ok/);
  assert.equal(stateView(cwd).work['branch-return-cheat'].status, 'doing');
});

test('return --no-new-commits-ok never bypasses verify itself — a genuinely-fresh branch-source claim whose branch tip still fails verify still parks doing -> blocked + friction (tsk-4on)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-flag-verify-fail', { verify: 'test -f proof.txt' }); // proof.txt never created anywhere

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-flag-verify-fail']).status, 0);

  // Zero commits since take, flag passed — the advance-check is skipped,
  // but verify still runs and still fails.
  const result = run(cwd, ['return', 'branch-return-flag-verify-fail', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  const view = stateView(cwd);
  assert.equal(view.work['branch-return-flag-verify-fail'].status, 'blocked');
  assert.equal(view.outcomes['branch-return-flag-verify-fail'].actual.outcome, 'blocked');
  assert.equal(view.frictions['branch-return-flag-verify-fail'][0].errorClass, 'verify-miss');
});

test('return on a branch-source take never requires the human\'s own main tree to be clean ("tree người là việc của người") — a dirty main tree never blocks it and is left untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-dirty-main', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-dirty-main']).status, 0);
  commitPending(cwd, 'state: take branch-return-dirty-main');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-dirty-main']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // Dirty the human's own main working tree — untracked, uncommitted, and
  // unrelated to this item entirely.
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated in-progress work\n');

  const result = run(cwd, ['return', 'branch-return-dirty-main']);
  assert.equal(result.status, 0, `return must never inspect the main tree for a branch-source item: ${result.stderr}`);
  assert.equal(stateView(cwd).work['branch-return-dirty-main'].status, 'awaiting-approval');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated in-progress work\n', "the human's own dirty scratch file is untouched");
});

test('return on a branch-source take: verify-fail -> doing -> blocked + friction (verification layer), exit 0 (a defined outcome, not a CLI error)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-red', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-red']).status, 0);
  commitPending(cwd, 'state: take branch-return-red');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-red']);
  fs.writeFileSync(path.join(cwd, 'wrong-file.txt'), 'nope\n'); // advances the branch, never satisfies verify
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'wrong fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['return', 'branch-return-red']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.match(result.stdout, /blocked/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-red'].status, 'blocked');
  assert.equal(view.outcomes['branch-return-red'].actual.outcome, 'blocked');
  assert.equal(view.frictions['branch-return-red'][0].layer, 'verification');
  assert.equal(view.frictions['branch-return-red'][0].errorClass, 'verify-miss');
});

test('return succeeds unchanged from inside a real session worktree (created via session.mjs createSession) — doing -> awaiting-approval, exit 0', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  addOk(cwd, 'return-in-session', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'return-in-session']); // headAtTake = current main HEAD

  // Real detached-HEAD worktree at headAtTake, then advance it with a genuine
  // commit made FROM INSIDE the session worktree (a real dangling commit).
  const session = createSession(cwd, { sessionId: 'sess-return' });
  commitInWorktree(session.worktreePath, 'proof.txt', 'work\n');

  try {
    const result = run(session.worktreePath, ['return', 'return-in-session']);
    assert.equal(result.status, 0, `return from inside a session worktree should succeed unchanged: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /awaiting-approval/);
    assert.equal(stateView(cwd).work['return-in-session'].status, 'awaiting-approval');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('tsk-ikd: return refuses from an ad-hoc worktree never created through "fgos session start" (main-source take) — item stays doing, never reaches awaiting-approval, exit 4', () => {
  // The actual Finding 4 failure scenario: a main-source claim (via `take`)
  // returned from inside a leftover/unrelated linked worktree instead of
  // main. Before this fix, `return`'s main-source path had no guard at all
  // (unlike `approve`/`sync-root`/`promote-to-component`, all of which
  // already refuse here) -- it would read `currentHead`/run verify against
  // WHATEVER cwd happens to be, record `headAtReturn` against a sha that
  // may never actually be reachable from main's own history the way this
  // item's claim assumes. This is deliberately the OPPOSITE fixture from
  // the session-worktree test above: an ad-hoc worktree is never registered
  // via "fgos session start" (no `sessions.json` entry), so it must be
  // refused exactly like approve's own adhoc-worktree tests prove for
  // approve.
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  commitPending(cwd, 'state: init');
  addOk(cwd, 'return-adhoc-mainsource', { verify: 'test -f proof.txt' });
  commitPending(cwd, 'state: add');
  run(cwd, ['take', '--id', 'return-adhoc-mainsource']);
  commitPending(cwd, 'state: take');
  // Real progress actually committed to main -- would satisfy verify if this
  // guard did not fire first, proving the refusal is structural (WHERE this
  // runs), never a proxy for "would verify have passed anyway".
  commitFile(cwd, 'proof.txt');

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-return-mainsource-branch');
  try {
    assert.equal(stateView(cwd).work['return-adhoc-mainsource'].status, 'doing', 'sanity: the ad-hoc worktree really does see the item (real committed events log)');
    const result = run(worktreePath, ['return', 'return-adhoc-mainsource']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a return recorded against an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /registered "fgos session start" worktree/);
    assert.equal(stateView(cwd).work['return-adhoc-mainsource'].status, 'doing', 'item is untouched -- never reaches awaiting-approval from an unregistered worktree');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('return --worker-verified-sha skips runGoalCheck when sha matches branchHead, moving item to awaiting-approval with verify skipped output', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'worker-verified-item', { verify: 'exit 1' });
  const pickResult = run(cwd, ['pick', '--id', 'worker-verified-item']);
  assert.equal(pickResult.status, 0);
  const pickData = envelopeData(pickResult.stdout);

  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by worker\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });

  const branchHead = gitAtCwd(cwd, ['rev-parse', 'fgw/worker-verified-item']).trim();

  const result = run(cwd, ['return', 'worker-verified-item', '--worker-verified-sha', branchHead]);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /verify skipped/);

  const view = stateView(cwd);
  assert.equal(view.work['worker-verified-item'].status, 'awaiting-approval');
  assert.equal(view.work['worker-verified-item'].branchHeadAtReturn, branchHead);
});

test('return --worker-verified-sha falls through to real verify when sha is stale or mismatched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'worker-stale-item', { verify: 'exit 1' });
  const pickResult = run(cwd, ['pick', '--id', 'worker-stale-item']);
  assert.equal(pickResult.status, 0);
  const pickData = envelopeData(pickResult.stdout);

  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by worker\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });

  const staleSha = '0000000000000000000000000000000000000000';

  const result = run(cwd, ['return', 'worker-stale-item', '--worker-verified-sha', staleSha]);
  // Should fall through to real verify (which is `exit 1`), so return moves item to blocked
  const view = stateView(cwd);
  assert.equal(view.work['worker-stale-item'].status, 'blocked');
});
