// The cases of catchup, called in this process through catchupUseCase. test/cli/fgos-post-merge-3.test.mjs and
// fgos-post-merge-4.test.mjs keep its CLI wiring: --timeout/--no-timeout and the repo root taken from --dir when run
// from inside the item's own worktree.
import '../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { addOutcome, addWork, EXIT_CODES, StoreError } from '../../../src/state/store.mjs';
import { catchupUseCase } from '../../../src/verbs/merge/catchup.mjs';
import {
  addOk,
  commitPending,
  envelopeData,
  gitAtCwd,
  gitHead,
  initGitCwdMainFast,
  makeAlreadyCaughtUpItem,
  makeBlockedLeafItem,
  makeBlockedRunnerItem,
  run,
  stateView,
  tmpCwdFast,
  writeCleanupTtlConfig,
} from '../../cli/helpers/fgos-cli-harness.mjs';
import { approve, moveFixture } from './approve-fixtures.mjs';

const fgosDir = (cwd) => path.join(cwd, '.fgos');
const catchup = (cwd, id) => catchupUseCase({ dir: fgosDir(cwd), repoRoot: cwd }, { id, timeoutMs: 60_000 });

function refusal(exitCode, ...patterns) {
  return (err) => err instanceof StoreError && EXIT_CODES[err.category] === exitCode && patterns.every((pattern) => pattern.test(err.message));
}

/** A non-overlapping change lands on main after the park: another root's own approve. */
function mainMovesOn(cwd) {
  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);
}

/** A legacy item awaiting approval, then parked blocked with `reason`. */
function parkedLegacy(cwd, id, reason) {
  assert.equal(addOk(cwd, id).status, 0);
  moveFixture(cwd, id, 'awaiting-approval');
  moveFixture(cwd, id, 'blocked', { reason });
}

const worktrees = (cwd) => gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

// ---------------------------------------------------------------------------
// merging the target in
// ---------------------------------------------------------------------------

test('catchup on a root parked with reason integration-drift merges main into fgw/<id> in an ephemeral worktree and bounces blocked -> awaiting-approval, main untouched', async () => {
  const cwd = initGitCwdMainFast();
  await makeBlockedRunnerItem(cwd, 'catchup-root-drift', 'integration-drift', { verify: 'test -f catchup-root-drift-produced.txt' });
  mainMovesOn(cwd);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = worktrees(cwd);
  const data = await catchup(cwd, 'catchup-root-drift');
  assert.equal(data.from, 'blocked');
  assert.equal(data.to, 'awaiting-approval');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup never touches the main checkout");
  assert.equal(worktrees(cwd), worktreesBefore, 'the ephemeral catchup worktree is cleaned up');
  assert.equal(stateView(cwd).work['catchup-root-drift'].status, 'awaiting-approval');
  assert.match(gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-root-drift']), /catch-up: merge main into fgw\/catchup-root-drift/);
  assert.match(gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:catchup-root-drift-produced.txt']), /ok/);
  assert.match(gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:main-side-change.txt']), /landed while parked/);
});

test('catchup on a leaf parked with reason merge-conflict merges its parent branch fgw/<root>, not main', async () => {
  const cwd = initGitCwdMainFast();
  await makeBlockedLeafItem(cwd, 'catchup-leaf-root', 'catchup-leaf-child', 'merge-conflict', { verify: 'test -f catchup-leaf-child-produced.txt' });
  // A sibling leaf's merge lands on fgw/<root> after this leaf's park, on a different file.
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-leaf-root']);
  fs.writeFileSync(path.join(cwd, 'sibling-produced.txt'), 'sibling ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling leaf merged into root']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = worktrees(cwd);
  const data = await catchup(cwd, 'catchup-leaf-child');
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.target, 'fgw/catchup-leaf-root');

  assert.equal(gitHead(cwd), mainHeadBefore, 'a leaf catchup never touches main');
  assert.equal(worktrees(cwd), worktreesBefore, 'the ephemeral catchup worktree is cleaned up');
  assert.match(gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-leaf-child']), /catch-up: merge fgw\/catchup-leaf-root into fgw\/catchup-leaf-child/);
  assert.match(gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:catchup-leaf-child-produced.txt']), /ok/);
  assert.match(gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:sibling-produced.txt']), /sibling ok/);
});

test('catchup on an item whose target conflicts on the same line leaves it blocked, aborts with its branch tip unchanged, and names the conflicted file', async () => {
  const cwd = initGitCwdMainFast();
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);
  assert.equal(addOk(cwd, 'catchup-conflict-item').status, 0);
  commitPending(cwd, 'state: add catchup-conflict-item');
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  moveFixture(cwd, 'catchup-conflict-item', 'awaiting-approval');
  moveFixture(cwd, 'catchup-conflict-item', 'blocked', { reason: 'merge-conflict' });
  // main changes the same line differently after the park.
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim();
  const worktreesBefore = worktrees(cwd);
  const data = await catchup(cwd, 'catchup-conflict-item');
  assert.equal(data.outcome, 'conflict');
  assert.deepEqual(data.conflictedFiles, ['shared.txt']);

  assert.equal(gitHead(cwd), mainHeadBefore, 'main is unchanged by a failed catchup');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim(), branchHeadBefore, 'the branch tip is unchanged after the abort');
  assert.equal(worktrees(cwd), worktreesBefore, 'the ephemeral catchup worktree is cleaned up on abort too');
  assert.equal(stateView(cwd).work['catchup-conflict-item'].status, 'blocked');
});

test('catchup on a branch that already contains its target reports already-caught-up, still runs verify, and bounces to awaiting-approval with no new commit; a red verify there stays blocked', async () => {
  const cwd = initGitCwdMainFast();
  await makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up', 'test -f catchup-caught-up-produced.txt');
  await makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up-red', 'test -f never-produced.txt');

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = worktrees(cwd);
  const tips = Object.fromEntries(['catchup-caught-up', 'catchup-caught-up-red'].map((id) => [id, gitAtCwd(cwd, ['rev-parse', `fgw/${id}`]).trim()]));

  const green = await catchup(cwd, 'catchup-caught-up');
  assert.equal(green.outcome, 'already-caught-up');
  assert.equal(green.from, 'blocked');
  assert.equal(green.to, 'awaiting-approval');
  const red = await catchup(cwd, 'catchup-caught-up-red');
  assert.equal(red.outcome, 'verify-fail');

  const view = stateView(cwd);
  assert.equal(view.work['catchup-caught-up'].status, 'awaiting-approval');
  assert.equal(view.work['catchup-caught-up-red'].status, 'blocked');
  for (const [id, tip] of Object.entries(tips)) assert.equal(gitAtCwd(cwd, ['rev-parse', `fgw/${id}`]).trim(), tip, `${id}: no commit when there was nothing to merge`);
  assert.equal(gitHead(cwd), mainHeadBefore, 'catchup never touches the main checkout');
  assert.equal(worktrees(cwd), worktreesBefore, 'the ephemeral catchup worktree is cleaned up');
});

// ---------------------------------------------------------------------------
// cashing in the verify catchup ran
// ---------------------------------------------------------------------------

test('catchup records branchHeadAtReturn as the tip it verified, merged or already caught up, so the approve that follows does not run verify again', async () => {
  const cwd = initGitCwdMainFast();
  const sentinel = (id) => path.join(cwd, `${id}.verify-ran`);
  const verify = (id) => `touch ${JSON.stringify(sentinel(id))} && test -f ${id}-produced.txt`;
  await makeBlockedRunnerItem(cwd, 'catchup-cashin', 'integration-drift', { verify: verify('catchup-cashin') });
  await makeAlreadyCaughtUpItem(cwd, 'catchup-caughtup-cashin', verify('catchup-caughtup-cashin'));
  mainMovesOn(cwd);

  for (const id of ['catchup-cashin', 'catchup-caughtup-cashin']) {
    await catchup(cwd, id);
    assert.equal(fs.existsSync(sentinel(id)), true, `${id}: catchup ran the real verify`);
    assert.equal(stateView(cwd).work[id].branchHeadAtReturn, gitAtCwd(cwd, ['rev-parse', `fgw/${id}`]).trim(), `${id}: the verified tip is recorded`);
  }
  // Approving the first one merges main forward under the second, so approve the already-caught-up one first.
  for (const id of ['catchup-caughtup-cashin', 'catchup-cashin']) {
    fs.rmSync(sentinel(id));
    assert.equal((await approve(cwd, id)).to, 'delivered');
    assert.equal(fs.existsSync(sentinel(id)), false, `${id}: approve's outbound gate skipped the verify catchup already ran`);
  }
});

test('a catchup whose verify fails leaves the item blocked and never records a branchHeadAtReturn it did not verify green', async () => {
  const cwd = initGitCwdMainFast();
  await makeBlockedRunnerItem(cwd, 'catchup-redverify', 'integration-drift', { verify: 'test -f this-file-does-not-exist.txt' });
  const before = stateView(cwd).work['catchup-redverify'].branchHeadAtReturn;

  assert.equal((await catchup(cwd, 'catchup-redverify')).outcome, 'verify-fail');
  assert.equal(stateView(cwd).work['catchup-redverify'].status, 'blocked');
  assert.equal(stateView(cwd).work['catchup-redverify'].branchHeadAtReturn, before);
});

// ---------------------------------------------------------------------------
// which parks catchup accepts
// ---------------------------------------------------------------------------

test('catchup refuses a nonexistent id as validation, an item that is not blocked as precondition, and a park for an unrelated reason as validation naming that reason', async () => {
  const cwd = tmpCwdFast();
  assert.equal(addOk(cwd, 'catchup-not-blocked').status, 0);
  parkedLegacy(cwd, 'catchup-unrelated-reason', 'anti-loop-max-visits');

  await assert.rejects(catchup(cwd, 'ghost'), refusal(4, /not found/));
  await assert.rejects(catchup(cwd, 'catchup-not-blocked'), refusal(2, /not "blocked"/));
  await assert.rejects(catchup(cwd, 'catchup-unrelated-reason'), refusal(4, /anti-loop-max-visits/));
  assert.equal(stateView(cwd).work['catchup-unrelated-reason'].status, 'blocked');
});

test('catchup accepts a park with reason merge-blocked-other-item', async () => {
  const cwd = initGitCwdMainFast();
  assert.equal(addOk(cwd, 'catchup-blocked-other-item', { verify: 'true' }).status, 0);
  commitPending(cwd, 'state: add catchup-blocked-other-item');
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-blocked-other-item']);
  fs.writeFileSync(path.join(cwd, 'catchup-blocked-other-item-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'catchup-blocked-other-item-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for catchup-blocked-other-item']);
  gitAtCwd(cwd, ['checkout', 'main']);
  moveFixture(cwd, 'catchup-blocked-other-item', 'awaiting-approval');
  moveFixture(cwd, 'catchup-blocked-other-item', 'blocked', { reason: 'merge-blocked-other-item' });

  // The branch already contains main: an accepted reason reaches the merge and finds nothing to merge.
  assert.equal((await catchup(cwd, 'catchup-blocked-other-item')).outcome, 'already-caught-up');
});

/** A cleanup item whose branch is recorded at `branchHeadAtReturn`, with or without retrospective content. */
function cleanupItem(cwd, id, branchHeadAtReturn, { withDoc }) {
  addWork(fgosDir(cwd), { id, title: id, kind: 'task', status: 'cleanup', deps: [], risk: 'light', refs: [], verify: `test -f ${id}-produced.txt`, branchHeadAtReturn });
  if (withDoc) {
    fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'docs', 'how-to', `${id}.md`), '# doc\n');
    addOutcome(fgosDir(cwd), { id, docType: 'how-to', docPath: `docs/how-to/${id}.md` });
  }
  // boundary: cleanup is written inline in bin/fgos.mjs, with no use case to call in process.
  const parked = run(cwd, ['cleanup', id]);
  assert.equal(parked.status, 0, parked.stderr);
  return envelopeData(parked.stdout);
}

function branchWithWork(cwd, id) {
  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, `${id}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${id}`]);
  const sha = gitAtCwd(cwd, ['rev-parse', 'HEAD']).trim();
  gitAtCwd(cwd, ['checkout', 'main']);
  return sha;
}

test('catchup recovers a cleanup park whose recorded commit no longer resolves on main by merging main in again, but refuses a cleanup park that only lacks retrospective content', async () => {
  const cwd = initGitCwdMainFast();
  writeCleanupTtlConfig(cwd, 0);
  const staleSha = branchWithWork(cwd, 'cleanup-origin-recover');
  mainMovesOn(cwd); // the recorded commit is not reachable from main
  const retroOnlySha = branchWithWork(cwd, 'cleanup-origin-retro-only');
  gitAtCwd(cwd, ['merge', '--no-ff', '-q', '-m', 'merge cleanup-origin-retro-only', 'fgw/cleanup-origin-retro-only']);
  const mergedSha = gitAtCwd(cwd, ['rev-parse', 'HEAD']).trim();
  assert.notEqual(retroOnlySha, mergedSha);

  const unreachable = cleanupItem(cwd, 'cleanup-origin-recover', staleSha, { withDoc: true });
  assert.equal(unreachable.to, 'blocked');
  assert.match(unreachable.reason, /no longer reachable/);
  const retroOnly = cleanupItem(cwd, 'cleanup-origin-retro-only', mergedSha, { withDoc: false });
  assert.equal(retroOnly.to, 'blocked');
  assert.doesNotMatch(retroOnly.reason, /no longer reachable/);

  assert.equal((await catchup(cwd, 'cleanup-origin-recover')).to, 'awaiting-approval');
  assert.match(gitAtCwd(cwd, ['log', '--oneline', 'fgw/cleanup-origin-recover']), /catch-up: merge main into fgw\/cleanup-origin-recover/);
  // Merging main into the branch does nothing for missing retrospective docs.
  await assert.rejects(catchup(cwd, 'cleanup-origin-retro-only'), refusal(4, /catchup only resolves a merge-related park/));
  assert.equal(stateView(cwd).work['cleanup-origin-retro-only'].status, 'blocked');
});
