// fgos-move.test.mjs -- CLI-level coverage for the `move` verb's own
// behavior (as opposed to fgos-approve.test.mjs's approve-path coverage).
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
import {
  addOk,
  assert,
  commitPendingBeforeApprove,
  envelopeData,
  gitAtCwd,
  initGitCwdMain,
  makeRunnerProposedItem,
  run,
  stateView,
} from './helpers/fgos-cli-harness.mjs';

// --- move --to delivered: unmerged-branch refusal (tsk-5dk) ---------------
//
// The merge-provenance contract (moveWork's mergedSha/mergedInto, tsk-5dk)
// only gets written by approve's real merge/GitHub-merge paths. A hand-typed
// `fgos move --to delivered` on an item whose `fgw/<id>` branch is still
// live and unmerged would silently mark it "delivered" with no such
// evidence ever produced — this is the gap tsk-5dk's own root-cause report
// names as the cause of "work done off-main, nobody notices" (tsk-4b2,
// tsk-64h, tsk-2t5). The refusal below closes that specific gap; a
// hand-typed move stays available for the cases where it's legitimate
// (no branch at all, or a branch already reachable from trunk), and via
// --override-reason for a real exception, logged to the decision log.

test('move --to delivered is allowed when no fgw/<id> branch exists at all (pull/legacy item, or a plain state fixture)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-no-branch');
  run(cwd, ['take', '--id', 'move-no-branch']); // tsk-40m: real claim, no durable move anymore
  run(cwd, ['move', 'move-no-branch', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['move', 'move-no-branch', '--to', 'delivered']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['move-no-branch'].status, 'delivered');
});

test('move --to delivered is allowed when fgw/<id> exists and IS reachable from trunk', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-reachable');
  run(cwd, ['take', '--id', 'move-reachable']); // tsk-40m: real claim, no durable move anymore
  gitAtCwd(cwd, ['branch', 'fgw/move-reachable', 'main']); // branched off main, never diverged: trivially an ancestor
  run(cwd, ['move', 'move-reachable', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);

  const result = run(cwd, ['move', 'move-reachable', '--to', 'delivered']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['move-reachable'].status, 'delivered');
});

test('move --to delivered is REFUSED when fgw/<id> exists and is NOT reachable from trunk, no event written', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'move-unmerged', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-unmerged');

  const before = stateView(cwd).work['move-unmerged'];
  const result = run(cwd, ['move', 'move-unmerged', '--to', 'delivered']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /fgw\/move-unmerged/);
  assert.match(result.stderr, /not.*reachable|reachable.*not/i);

  const after = stateView(cwd).work['move-unmerged'];
  assert.equal(after.status, before.status, 'refused move must not advance status');
});

test('move --to delivered with --override-reason proceeds despite an unreachable branch, and logs the reason to the decision log', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'move-override', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-override');

  const result = run(cwd, ['move', 'move-override', '--to', 'delivered', '--override-reason', 'hotfix landed via an out-of-band channel, evidence in incident-42']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['move-override'].status, 'delivered');

  const view = stateView(cwd);
  const decisions = view.decisions.filter((d) => d.id === 'move-override' || (d.text ?? '').includes('move-override'));
  assert.ok(decisions.length > 0, 'override must be recorded to the decision log');
  assert.match(decisions.at(-1).rationale, /incident-42/);
});

test('move --to delivered without --override-reason refuses even with an EMPTY --override-reason value (validation, not a silent bypass)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'move-empty-override', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-empty-override');

  const result = run(cwd, ['move', 'move-empty-override', '--to', 'delivered', '--override-reason', '']);
  assert.notEqual(result.status, 0);
  assert.equal(stateView(cwd).work['move-empty-override'].status, 'awaiting-approval');
});

test('move --to a status other than delivered is never gated by the branch-reachability check, even with a live unmerged branch', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'move-not-delivered', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-not-delivered');

  const result = run(cwd, ['move', 'move-not-delivered', '--to', 'blocked', '--reason', 'unrelated block reason']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['move-not-delivered'].status, 'blocked');
});

// --- move --to awaiting-approval from doing: return's own proof-of-progress ---
// guard bypass (tsk-280). `return` is the one door built to prove real
// progress before doing -> awaiting-approval (branch-advanced, clean tree,
// verify pass). `move` had zero precondition for this exact edge, silently
// bypassing all three. Mirrors the --to delivered guard above: refuse by
// default, require a non-empty --skip-return-guard reason, logged to the
// decision log.

test('move --to awaiting-approval on a "doing" item is REFUSED without --skip-return-guard, no event written', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-guard-doing');
  run(cwd, ['take', '--id', 'move-guard-doing']); // tsk-40m: real claim, no durable move anymore

  const before = stateView(cwd).work['move-guard-doing'];
  const result = run(cwd, ['move', 'move-guard-doing', '--to', 'awaiting-approval']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /fgos return/);
  assert.match(result.stderr, /no proof of real progress|proof of real progress/i);

  const after = stateView(cwd).work['move-guard-doing'];
  assert.equal(after.status, before.status, 'refused move must not advance status');
});

test('move --to awaiting-approval with --skip-return-guard proceeds despite "doing" status, and logs the reason to the decision log', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-guard-override');
  run(cwd, ['take', '--id', 'move-guard-override']); // tsk-40m: real claim, no durable move anymore

  const result = run(cwd, ['move', 'move-guard-override', '--to', 'awaiting-approval', '--skip-return-guard', 'manual recovery, evidence in incident-99']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval');
  assert.equal(stateView(cwd).work['move-guard-override'].status, 'awaiting-approval');

  const view = stateView(cwd);
  const decisions = view.decisions.filter((d) => d.id === 'move-guard-override' || (d.text ?? '').includes('move-guard-override'));
  assert.ok(decisions.length > 0, 'override must be recorded to the decision log');
  assert.match(decisions.at(-1).rationale, /incident-99/);
});

test('move --to awaiting-approval on a "doing" item refuses even with an EMPTY --skip-return-guard value (validation, not a silent bypass)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-guard-empty');
  run(cwd, ['take', '--id', 'move-guard-empty']); // tsk-40m: real claim, no durable move anymore

  const result = run(cwd, ['move', 'move-guard-empty', '--to', 'awaiting-approval', '--skip-return-guard', '']);
  assert.notEqual(result.status, 0);
  assert.equal(stateView(cwd).work['move-guard-empty'].status, 'doing');
});

test('move --to awaiting-approval on a NON-"doing" item is never gated by the return-guard check', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'move-guard-not-doing', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-guard-not-doing');
  run(cwd, ['take', '--id', 'move-guard-not-doing']); // tsk-40m: real claim, no durable move anymore
  run(cwd, ['move', 'move-guard-not-doing', '--to', 'blocked', '--reason', 'unrelated']);

  // blocked -> awaiting-approval (catchup's own edge) is a real FSM
  // transition never claimed by `doing`'s own precondition above.
  const result = run(cwd, ['move', 'move-guard-not-doing', '--to', 'awaiting-approval']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['move-guard-not-doing'].status, 'awaiting-approval');
});

// --- move --to wontfix from awaiting-human (tsk-2lc): the FSM table
// (status-fsm.mjs:169, tsk-2ub) already carries this edge, but `move`
// never forwarded an `--answer`, and transitionWork requires one for ANY
// exit from awaiting-human -- making the edge unreachable through `move`
// even though `fgos answer` (the other door out of awaiting-human) never
// targets wontfix at all. ---

test('move --to wontfix from awaiting-human succeeds when --answer is supplied, closing a moot question without fabricating a resume', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-wontfix-from-ask');
  run(cwd, ['take', '--id', 'move-wontfix-from-ask']); // tsk-40m: real claim, no durable move anymore
  run(cwd, ['ask', 'move-wontfix-from-ask', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: still relevant?']);
  assert.equal(stateView(cwd).work['move-wontfix-from-ask'].status, 'awaiting-human');

  const result = run(cwd, ['move', 'move-wontfix-from-ask', '--to', 'wontfix', '--answer', 'refuted by later evidence, closing']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['move-wontfix-from-ask'].status, 'wontfix');
});

test('move --to wontfix from awaiting-human still refuses with no --answer, same validation shape as before this item', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'move-wontfix-no-answer');
  run(cwd, ['take', '--id', 'move-wontfix-no-answer']); // tsk-40m: real claim, no durable move anymore
  run(cwd, ['ask', 'move-wontfix-no-answer', '--text', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: still relevant?']);

  const result = run(cwd, ['move', 'move-wontfix-no-answer', '--to', 'wontfix']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /"answer" is required/);
  assert.equal(stateView(cwd).work['move-wontfix-no-answer'].status, 'awaiting-human', 'a refused move must leave the item parked, unchanged');
});
