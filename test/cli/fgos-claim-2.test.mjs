// fgos-claim.test.mjs -- phần "take, pick, session, unlock, lock-status, main-checkout-reset, take/pick/approve" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import {
  ADD_BAD_FLAG_CASES,
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
  moveStep,
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
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
} from './helpers/fgos-cli-harness.mjs';



test('session list shows a started session, then omits it after it ends', () => {
  const cwd = initGitCwdFast();
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
  const cwd = initGitCwdFast();
  const { sessionId, worktreePath } = startSession(cwd);
  assert.ok(fs.existsSync(worktreePath));

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.equal(ended.status, 0, `clean end should succeed: ${ended.stderr}`);
  assert.ok(!fs.existsSync(worktreePath), 'the worktree directory is removed from disk');
});


test('session end on a diverged session refuses at the CLI level and names the dangling sha, exit 4', () => {
  const cwd = initGitCwdFast();
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
  const cwd = initGitCwdFast();
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
  const cwd = initGitCwdFast();
  const result = run(cwd, ['session', 'end', 'no-such-session']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown or already-ended session/);
});


test('session with no sub-verb, and an unknown sub-verb, are both rejected as validation, exit 4', () => {
  const cwd = initGitCwdFast();
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
  const cwd = initGitCwdFast();
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
  const cwd = initGitCwdFast();
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
  const cwd = initGitCwdFast();
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


test('unlock is gone: an unknown verb, and no manifest entry', () => {
  const cwd = tmpCwdFast();
  const result = run(cwd, ['unlock']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /unknown verb "unlock"/);

  const manifest = JSON.parse(run(cwd, ['--help', '--json']).stdout);
  assert.equal(manifest.commands.find((c) => c.name === 'unlock'), undefined);
  const lock = manifest.commands.find((c) => c.name === 'lock');
  assert.ok(lock, 'lock entry missing from --help --json manifest');
  assert.equal(lock.touchesState, true);
  assert.equal(lock.externalEffect, true);
});


// --- `fgos lock-status`: read-only report of every repo/machine registry lock

test('lock-status: nothing held -- every row is free, main checkout included, and no lock file is created', () => {
  const cwd = tmpCwdFast();
  const result = run(cwd, ['lock-status']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.mainCheckout.outcome, 'free');
  assert.deepEqual(data.mainCheckout.holders, []);
  assert.ok(data.locks.length > 0);
  // The full-suite door holds the machine-wide full-suite queue lock for the whole run, so inside
  // it that one row is legitimately held; every other row must be free.
  const suiteQueueHeld = process.env.FGOS_FULL_SUITE_QUEUE_HELD === '1';
  for (const row of data.locks) {
    if (suiteQueueHeld && row.name === 'full-suite') continue;
    assert.ok(['free', 'not-node-owned'].includes(row.status), `${row.name} should be free, got ${row.status}`);
    assert.ok(['repo', 'machine'].includes(row.scope), `${row.name} scope ${row.scope} is not reported`);
  }
  // The fixture's activation fence is the only entry; a status read creates nothing beside it.
  assert.deepEqual(fs.readdirSync(path.join(cwd, '.fgos', 'locks')), ['activation.lock'], 'a status read creates nothing');
  assert.equal(data.beacon.status, 'none');
});


test('lock-status: main held by another process -- held with that pid, other rows stay free', async () => {
  const cwd = initGitCwdFast();
  await withMainHeldByChild(cwd, async (holder) => {
    const result = await runAsync(cwd, ['lock-status']);
    assert.equal(result.status, 0, result.stderr);
    const data = envelopeData(result.stdout);
    assert.equal(data.mainCheckout.outcome, 'held');
    assert.deepEqual(data.mainCheckout.holders, [holder.child.pid]);
    const main = data.locks.find((row) => row.name === 'main-checkout');
    assert.equal(main.status, 'held');
    assert.equal(main.via, 'probe');
    assert.ok(main.guarantee, 'the guarantee of the lock directory is reported');
    assert.equal(data.locks.find((row) => row.name === 'worktree-admin').status, 'free');
  });
});


test('lock-status: a merge slot held for one ref is listed as an instance of the parametric row', async () => {
  const cwd = initGitCwdFast();
  const holder = await holdLockInChild('merge-slot', { fgosDir: path.join(cwd, '.fgos'), ref: 'main' });
  try {
    const data = envelopeData((await runAsync(cwd, ['lock-status'])).stdout);
    const slot = data.locks.find((row) => row.name === 'merge-slot');
    assert.equal(slot.parametric, true);
    assert.equal(slot.status, 'held');
    assert.deepEqual(slot.instances.map((i) => i.holders), [[holder.child.pid]]);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});


test('lock-status: registered in the --help --json manifest as read-only (touchesState/externalEffect both false)', () => {
  const cwd = tmpCwdFast();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'lock-status');
  assert.ok(entry, 'lock-status entry missing from --help --json manifest');
  assert.equal(entry.touchesState, false);
  assert.equal(entry.externalEffect, false);
});


// The main checkout mutex is a kernel lock: a holder is a live process, never
// a record with a TTL, so these hold it from a real child and kill that child.
async function withMainHeldByChild(cwd, fn) {
  const holder = await holdLockInChild('main-checkout', { fgosDir: path.join(cwd, '.fgos') });
  try {
    return await fn(holder);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
}

function runAsync(cwd, args) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [FGOS, ...args], { cwd, env: { ...process.env, FGOS_SESSION_ID: 'fgos-cli-harness-test' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('exit', (status) => resolve({ status, stdout, stderr, elapsed: Date.now() - started }));
  });
}

test('take --wait rejects a non-numeric or non-positive value the same way --timeout already does', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'wait-bad-value-take');

  const result = run(cwd, ['take', 'wait-bad-value-take', '--wait', 'nope']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be a positive number of milliseconds/);
});


test('take --wait rejects a value above the 900000ms (15 min) cap -- tsk-2rf D3', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'wait-over-cap-take');

  const result = run(cwd, ['take', 'wait-over-cap-take', '--wait', '900001']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be at most 900000ms \(15 min\)/);
});


test('take/pick/approve are documented in the --help --json manifest with wait/no-wait properties', () => {
  const cwd = tmpCwdFast();
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
  const cwd = initGitCwdFast();
  addOk(cwd, 'repick-live-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  // A claim released at the clarify/decompose -> executing boundary, with the
  // session still sitting in its worktree.
  releaseClaimFor(cwd, 'repick-live-item');

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath, 'the live worktree is reattached, not replaced');
  assert.equal(secondPick.worktree.reused, true);
  assert.equal(fs.existsSync(worktreePath), true);
  assert.equal(fs.existsSync(path.join(worktreePath, 'CONTEXT.md')), true, 'work committed before the release is still there');
});


test('pick reattaches even when the live worktree has uncommitted work, leaving that work untouched', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'repick-dirty-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  fs.writeFileSync(path.join(worktreePath, 'draft.md'), 'half-written\n');
  releaseClaimFor(cwd, 'repick-dirty-item');

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath);
  assert.equal(fs.readFileSync(path.join(worktreePath, 'draft.md'), 'utf8'), 'half-written\n');
});


test('take refuses a todo item whose own fgw/<id> branch already exists, naming pick instead of silently claiming source:main', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'take-with-branch-item');

  // the branch (and worktree) come into being via pick; the claim is then
  // released, leaving a todo item whose work lives on the branch
  envelopeData(run(cwd, ['pick', '--id', 'take-with-branch-item']).stdout);
  releaseClaimFor(cwd, 'take-with-branch-item');

  const taken = run(cwd, ['take', '--id', 'take-with-branch-item']);

  assert.notEqual(taken.status, 0, 'a main-checkout take of branch-resident work is refused');
  assert.match(taken.stderr, /already has its own branch fgw\/take-with-branch-item/);
  assert.match(taken.stderr, /fgos pick take-with-branch-item/);
  assert.equal(stateView(cwd).work['take-with-branch-item'].status, 'todo', 'the refusal is a clean no-op');
});


test('take still claims a todo item that has no fgw/<id> branch of its own', () => {
  const cwd = initGitCwdFast();
  addOk(cwd, 'take-no-branch-item');

  const taken = run(cwd, ['take', '--id', 'take-no-branch-item']);

  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  const data = envelopeData(taken.stdout);
  assert.equal(data.source, 'main');
  assert.equal(stateView(cwd).work['take-no-branch-item'].status, 'doing');
});
