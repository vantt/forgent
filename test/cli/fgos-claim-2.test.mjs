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
