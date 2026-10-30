// The CLI wiring of approve: what only bin/fgos.mjs decides (the envelope and exit code, flag parsing and
// forwarding, --trust-dir). The cases of approve are owned by test/verbs/merge/approve.test.mjs, which calls
// approveUseCase in process.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import {
  addAdHocWorktree,
  addOk,
  assert,
  commitPending,
  commitPendingBeforeApprove,
  envelopeData,
  gitHead,
  initGitCwdMainFast,
  makeRunnerProposedItem,
  makeRunnerProposedItemTouching,
  makeRunnerProposedLeafItem,
  moveOk,
  path,
  removeAdHocWorktree,
  run,
  stateView,
  tmpCwdFast,
} from './helpers/fgos-cli-harness.mjs';

const SKIP_RETURN_GUARD = { skipReturnGuard: "test fixture setup, not exercising return's own guard" };

test('fgos approve of a runner item prints the fgos.v1 envelope of the delivered result, exit 0', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'cli-approve-runner', { verify: 'test -f cli-approve-runner-produced.txt' });
  commitPendingBeforeApprove(cwd, 'cli-approve-runner');

  const result = run(cwd, ['approve', 'cli-approve-runner']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'delivered');
  assert.equal(data.branch, 'fgw/cli-approve-runner');
  assert.equal(stateView(cwd).work['cli-approve-runner'].status, 'delivered');
});

test('fgos approve of an item not awaiting approval exits 2, the precondition code', () => {
  const cwd = tmpCwdFast();
  addOk(cwd, 'cli-approve-not-proposed');

  const result = run(cwd, ['approve', 'cli-approve-not-proposed']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /not "awaiting-approval"/);
});

test('approve --timeout and --no-timeout together are rejected as validation, exit 4, before any verify runs', () => {
  const cwd = tmpCwdFast();
  addOk(cwd, 'approve-timeout-conflict', { verify: 'true' });
  assert.equal(moveOk(cwd, 'approve-timeout-conflict', 'awaiting-approval', SKIP_RETURN_GUARD).status, 0);

  const result = run(cwd, ['approve', 'approve-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['approve-timeout-conflict'].status, 'awaiting-approval');
});

test('approve --acknowledge-iron-law false (a value, not the bare flag) still refuses: only the bare flag acknowledges', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItemTouching(cwd, 'iron-ack-false-item', 'src/runner/probe.mjs', { verify: 'test -f src/runner/probe.mjs' });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-ack-false-item', '--acknowledge-iron-law', 'false']);
  assert.equal(result.status, 4, `a value form must refuse exactly like no flag at all: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.equal(stateView(cwd).work['iron-ack-false-item'].status, 'awaiting-approval');
  assert.equal(gitHead(cwd), headBefore);
});

test('approve --acknowledge-drift is forwarded: a leaf whose root is already delivered merges onto fgw/<root>', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedLeafItem(cwd, 'cli-resolved-root', 'cli-resolved-root-leaf', { verify: 'true' });
  assert.equal(moveOk(cwd, 'cli-resolved-root', 'awaiting-approval', SKIP_RETURN_GUARD).status, 0);
  assert.equal(moveOk(cwd, 'cli-resolved-root', 'delivered').status, 0);
  commitPending(cwd, 'state: resolve cli-resolved-root');

  const result = run(cwd, ['approve', 'cli-resolved-root-leaf', '--acknowledge-drift']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).target, 'fgw/cli-resolved-root');
});

test('approve --no-wait fails at once while another process holds the trunk\'s merge slot, exit 9, item left awaiting approval', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'wait-no-wait-approve', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-no-wait-approve');
  const holder = await holdLockInChild('merge-slot', { fgosDir: path.join(cwd, '.fgos'), ref: encodeURIComponent('refs/heads/main') });
  try {
    const result = run(cwd, ['approve', 'wait-no-wait-approve', '--no-wait']);
    // 9 is the merge-fail code: every MergeError carries that category.
    assert.equal(result.status, 9, result.stderr);
    assert.match(result.stderr, /merge slot of "refs\/heads\/main" is held by another process \(pid \d+/);
    // A run that waited tags its error with the time it waited; the holder never releases, so waiting could not succeed.
    assert.doesNotMatch(result.stderr, /after waiting \d+ ms/, '--no-wait must not wait before giving up');
    assert.equal(stateView(cwd).work['wait-no-wait-approve'].status, 'awaiting-approval');
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('approve --trust-dir with --dir approves from inside an ad-hoc worktree; without --dir it is a no-op and the worktree is refused', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'approve-trust-dir', { verify: 'test -f approve-trust-dir-produced.txt' });
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-trust-dir-branch');
  try {
    const refused = run(worktreePath, ['approve', 'approve-trust-dir', '--trust-dir']);
    assert.equal(refused.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${refused.stdout}${refused.stderr}`);
    assert.equal(stateView(cwd).work['approve-trust-dir'].status, 'awaiting-approval');
    assert.equal(gitHead(cwd), headBefore, 'nothing landed on main');

    const result = run(worktreePath, ['approve', 'approve-trust-dir', '--trust-dir', '--dir', cwd]);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-trust-dir'].status, 'delivered');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve --github is forwarded and refused, exit 4', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'cli-approve-github');

  const result = run(cwd, ['approve', 'cli-approve-github', '--github', '--pr', '42']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /approve --github is explicitly forbidden/);
  assert.equal(stateView(cwd).work['cli-approve-github'].status, 'awaiting-approval');
});
