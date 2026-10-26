// The CLI wiring of merge, review, promote-to-component and sync-root: what only bin/fgos.mjs decides (flag parsing
// and forwarding, --trust-dir, the refusal of a directory without .fgos/). Each verb's cases are owned by
// test/direct/fgos-merge.test.mjs, which calls the use cases in process.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
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
  initGitCwdFast,
  initGitCwdInSubdir,
  initGitCwdMainFast,
  initGitCwdWithWorktree,
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
  removeAdHocWorktree,
  run,
  spawnSync,
  startSession,
  stateView,
  tmpCwdFast,
  tmpCwdFromTemplate,
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


test('P06 fixture pilot: in-process initialized cwd preserves the CLI-ready store shape', () => {
  const cwd = tmpCwdFast();
  assert.ok(fs.existsSync(path.join(cwd, '.fgos')), 'fixture must create .fgos/');
  assert.deepEqual(eventLines(cwd), [], 'fresh fixture event store starts empty');
  assert.deepEqual(Object.keys(stateView(cwd).work), [], 'fresh fixture view has no work');
  const manifest = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));
  assert.equal(manifest.v, 1);
  assert.equal(manifest.territory.data, '.fgos/');

  const result = run(cwd, ['list']);
  assert.equal(result.status, 0, result.stderr);
});


test('P06 fixture pilot: template-copy cwd is a fresh copy, not shared mutable state', () => {
  const first = tmpCwdFromTemplate();
  const second = tmpCwdFromTemplate();
  addOk(first, 'template-copy-only-first');

  assert.equal(stateView(first).work['template-copy-only-first'].id, 'template-copy-only-first');
  assert.equal(stateView(second).work['template-copy-only-first'], undefined, 'template state must not leak between cases');
  assert.deepEqual(JSON.parse(fs.readFileSync(coexistPath(first), 'utf8')), JSON.parse(fs.readFileSync(coexistPath(second), 'utf8')));
});


test('promote-to-component requires at least 2 ids, exit 4', () => {
  const cwd = initGitCwdMainFast();
  makeFlatMember(cwd, 'ptc-solo-a');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-solo-a', '--root-title', 'Component solo']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /at least 2/);
});


// review's one wiring proof: --github, --pr and FGOS_GH_COMMAND all reach the use case. Every gh is a
// subprocess-injected fake; no real gh binary, no network call.


test('review --github --pr on a still-open PR (closed:false) reports it is open and mutates neither FSM state nor friction', () => {
  const cwd = initGitCwdMainFast();
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


// --- tsk-4j9-3: `fgos merge list` (merge-readiness ranking) ---------------

test('merge list: unknown sub-verb is rejected as validation, exit 4', () => {
  const cwd = tmpCwdFast();
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
  // tsk-40m: no real claim needed (no branch) -- straight todo -> awaiting-approval.
  assert.equal(run(main, ['move', 'solo', '--to', 'awaiting-approval']).status, 0);
  // Confirm the real store genuinely has a ready item, so a refusal below
  // cannot be mistaken for a true "nothing ready" negative.
  assert.deepEqual(envelopeData(run(main, ['merge', 'list']).stdout).ready, ['solo']);

  const result = run(wt, ['merge', 'next']);
  assert.equal(result.status, 4, `expected a refusal, not the old silent false negative: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.equal(stateView(main).work.solo.status, 'awaiting-approval', 'the ready item at the real store must be untouched');
});


// --- tsk-4j9-4: `fgos merge next` (merge-readiness automation) -----------


test('merge next --acknowledge-iron-law forwarded by the caller: the picker does not pre-skip -- the flag applies to whichever item is picked, exactly as before', () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const result = run(cwd, ['merge', 'next', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, 'iron-next-item', 'an explicitly-forwarded acknowledgment must let the picker attempt it, unchanged from before this item');
  assert.ok(!('skipped' in data), 'nothing was skipped -- the flag made the candidate attemptable');
});


test('merge next --no-wait fails immediately while another process holds the trunk\'s merge slot -- proves the flag actually forwards into approve (bin/fgos.mjs:1152), not just documented as if it did', async () => {
  const cwd = initGitCwdMainFast();
  makeRunnerProposedItem(cwd, 'wait-merge-next-no-wait', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-merge-next-no-wait');
  const holder = await holdLockInChild('merge-slot', { fgosDir: path.join(cwd, '.fgos'), ref: encodeURIComponent('refs/heads/main') });
  try {
    const result = run(cwd, ['merge', 'next', '--no-wait']);

    // `merge next` only special-cases an Iron Law rejection (bin/fgos.mjs's
    // `sub === 'next'` case) -- any other error from the inner `runVerb('approve', ...)`
    // rethrows as-is, so this fails exactly like a direct `approve` call does.
    assert.equal(result.status, 9, result.stderr);
    assert.match(result.stderr, /merge slot of "refs\/heads\/main" is held by another process \(pid \d+/);
    // A run that waited would tag the final error with the time it waited; none appears when the
    // flag was forwarded. The holder never releases, so a waiting run could not have succeeded either.
    assert.doesNotMatch(result.stderr, /after waiting \d+ ms/, '--no-wait forwarded through merge next must not wait before giving up');
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});


test('sync-root --trust-dir with --dir succeeds from inside a linked worktree (tsk-4uj)', () => {
  const cwd = initGitCwdMainFast();
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
  const cwd = initGitCwdMainFast();
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


test('promote-to-component --trust-dir with --dir succeeds from inside a linked worktree (tsk-2bg)', () => {
  const cwd = initGitCwdMainFast();
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
  const cwd = initGitCwdMainFast();
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
