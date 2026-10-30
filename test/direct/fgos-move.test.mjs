// The cases of move, called in this process through moveUseCase. test/cli/fgos-move.test.mjs keeps what only
// bin/fgos.mjs decides: the empty-value refusals of its reason flags, the forwarding of --answer and --approve, and
// the envelope.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  addOk,
  commitPendingBeforeApprove,
  gitAtCwd,
  initGitCwdMainFast,
  makeRunnerProposedItem,
  stateView,
  takeOk,
} from '../cli/helpers/fgos-cli-harness.mjs';
import { putInAwaiting, readRawEvents, StoreError } from '../../src/state/store.mjs';
import { moveUseCase } from '../../src/verbs/state/move.mjs';

const fgosDir = (cwd) => path.join(cwd, '.fgos');
const move = (cwd, id, to, options = {}) => moveUseCase({ dir: fgosDir(cwd), repoRoot: cwd }, { id, to, ...options });
const SKIP_RETURN_GUARD = { skipReturnGuard: "test fixture setup, not exercising return's own guard" };

// A question in the decision-question template, as `fgos ask` requires.
const QUESTION = [
  '## Chuyện gì đang xảy ra', '', 'Background needed to understand this question without opening another file.', '',
  '## Nguyên nhân', '', 'This directly affects the outcome: still relevant?', '',
  '## Các lựa chọn', '', '(a) giữ cách hiện tại; (b) đổi sang cách đã đề xuất ở trên.', '',
  '## Khuyến nghị', '', '(b), vì nó giải quyết đúng vấn đề đã nêu.', '',
  '## Phạm vi của câu trả lời', '', 'Đồng ý chỉ cho phép làm đúng thay đổi này, không gì thêm.',
].join('\n');

async function claimed(cwd, id) {
  assert.equal(addOk(cwd, id).status, 0);
  await takeOk(cwd, id);
}

async function parkedForAnswer(cwd, id) {
  await claimed(cwd, id);
  putInAwaiting(fgosDir(cwd), { id, ask: QUESTION });
  assert.equal(stateView(cwd).work[id].status, 'awaiting-human');
}

function engineDecisionsFor(cwd, id) {
  return stateView(cwd).decisions.filter((d) => d.id === id || (d.text ?? '').includes(id));
}

const refused = (pattern) => (err) => err instanceof StoreError && err.category === 'validation' && pattern.test(err.message);

// ---------------------------------------------------------------------------
// --to delivered: a live fgw/<id> branch must already be reachable from trunk
// ---------------------------------------------------------------------------

test('move --to delivered is allowed when no fgw/<id> branch exists, or when it is reachable from trunk', async () => {
  const cwd = initGitCwdMainFast();
  await claimed(cwd, 'move-no-branch');
  await claimed(cwd, 'move-reachable');
  gitAtCwd(cwd, ['branch', 'fgw/move-reachable', 'main']); // branched off main, never diverged: trivially an ancestor
  for (const id of ['move-no-branch', 'move-reachable']) {
    move(cwd, id, 'awaiting-approval', SKIP_RETURN_GUARD);
    assert.equal(move(cwd, id, 'delivered').to, 'delivered');
    assert.equal(stateView(cwd).work[id].status, 'delivered');
  }
});

test('move --to delivered is refused while fgw/<id> is not reachable from trunk, writing no event; an override reason lets it through and is logged as a decision', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'move-unmerged', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-unmerged');

  const before = readRawEvents(fgosDir(cwd)).length;
  assert.throws(() => move(cwd, 'move-unmerged', 'delivered'), refused(/fgw\/move-unmerged.*not yet reachable/));
  assert.equal(readRawEvents(fgosDir(cwd)).length, before, 'a refused move writes no event');
  assert.equal(stateView(cwd).work['move-unmerged'].status, 'awaiting-approval');

  assert.equal(move(cwd, 'move-unmerged', 'delivered', { overrideReason: 'hotfix landed out of band, evidence in incident-42' }).to, 'delivered');
  assert.match(engineDecisionsFor(cwd, 'move-unmerged').at(-1).rationale, /incident-42/);
});

test('move to a status other than delivered is never gated by branch reachability, even with a live unmerged branch', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'move-not-delivered', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-not-delivered');

  assert.equal(move(cwd, 'move-not-delivered', 'blocked', { reason: 'unrelated block reason' }).to, 'blocked');
});

// ---------------------------------------------------------------------------
// --to awaiting-approval from doing: return's proof-of-progress guard
// ---------------------------------------------------------------------------

test('move --to awaiting-approval on a doing item is refused without a skip reason, naming fgos return, writing no event; a skip reason lets it through and is logged as a decision', async () => {
  const cwd = initGitCwdMainFast();
  await claimed(cwd, 'move-guard-doing');

  const before = readRawEvents(fgosDir(cwd)).length;
  assert.throws(() => move(cwd, 'move-guard-doing', 'awaiting-approval'), refused(/fgos return.*proof of real progress|proof of real progress.*fgos return/s));
  assert.equal(readRawEvents(fgosDir(cwd)).length, before, 'a refused move writes no event');
  assert.equal(stateView(cwd).work['move-guard-doing'].status, 'doing');

  assert.equal(move(cwd, 'move-guard-doing', 'awaiting-approval', { skipReturnGuard: 'manual recovery, evidence in incident-99' }).to, 'awaiting-approval');
  assert.match(engineDecisionsFor(cwd, 'move-guard-doing').at(-1).rationale, /incident-99/);
});

test('move --to awaiting-approval on an item that is not doing is never gated by the return guard', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'move-guard-not-doing', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-guard-not-doing');
  move(cwd, 'move-guard-not-doing', 'blocked', { reason: 'unrelated' });

  // blocked -> awaiting-approval is catchup's own edge, never claimed by doing's precondition.
  assert.equal(move(cwd, 'move-guard-not-doing', 'awaiting-approval').to, 'awaiting-approval');
});

// ---------------------------------------------------------------------------
// out of awaiting-human
// ---------------------------------------------------------------------------

test('move --to wontfix from awaiting-human closes a moot question when an answer is given, and refuses without one, leaving the item parked', async () => {
  const cwd = initGitCwdMainFast();
  await parkedForAnswer(cwd, 'move-wontfix-from-ask');

  assert.throws(() => move(cwd, 'move-wontfix-from-ask', 'wontfix'), (err) => /"answer" is required/.test(err.message));
  assert.equal(stateView(cwd).work['move-wontfix-from-ask'].status, 'awaiting-human');

  assert.equal(move(cwd, 'move-wontfix-from-ask', 'wontfix', { answer: 'refuted by later evidence, closing' }).to, 'wontfix');
});

test('move --to todo from awaiting-human records approved: true on the gate only when approved is passed with the answer', async () => {
  const cwd = initGitCwdMainFast();
  await parkedForAnswer(cwd, 'move-approve-item');
  await parkedForAnswer(cwd, 'move-no-approve-item');

  move(cwd, 'move-approve-item', 'todo', { answer: 'approved plan', approved: true });
  move(cwd, 'move-no-approve-item', 'todo', { answer: 'clarification only' });

  const view = stateView(cwd);
  assert.equal(view.work['move-approve-item'].status, 'todo');
  assert.equal(view.gates['move-approve-item'].approved, true);
  assert.equal(view.work['move-no-approve-item'].status, 'todo');
  assert.ok(!('approved' in view.gates['move-no-approve-item']));
});
