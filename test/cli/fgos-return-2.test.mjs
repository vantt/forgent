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

  // `.fgos/` has never had a tracked file inside it in this fixture, so git
  // reports it collapsed as a single untracked directory ("?? .fgos/")
  // rather than listing events.jsonl individually — either shape must still
  // count as "only .fgos/ dirty" for the exclusion below.
  const statusLines = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.equal(statusLines.length, 1, 'sanity: .fgos/ must be the ONLY dirty path at this point');
  assert.match(statusLines[0], /\.fgos\/?$/);

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
