// fgos-intake.test.mjs -- phần "add, submit, move, decision, ask, answer, ask/answer" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  ADD_BAD_FLAG_CASES,
  FGOS,
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
  initGitCwdInSubdir,
  initGitCwdMain,
  initGitCwdWithWorktree,
  initHeadlessGitCwd,
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
  moveToDurableDoingForTest,
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
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
} from './helpers/fgos-cli-harness.mjs';


// tsk-4fu-2: requiresExistingStore guard (command-registry.mjs) — a
// state-write verb no longer silently auto-vivifies `.fgos/` via
// creating a store itself when it's missing; it refuses instead.

// --- `fgos ask`/`fgos answer` (async-human-gate-3): the human-gate round-trip ---
//
// e2e per D5/D6/D7: `ask` parks a work item into `awaiting-human` carrying
// the question; while parked, `ready` must exclude it (D6) and `list` must
// surface it — status + its question, via the existing view.gates fold, no
// new formatter (D7); `answer` records the answer and resumes the item to
// `todo`, at which point it is actionable again (back in `ready`).

const VALID_ASK_TEXT = `## Chuyện gì đang xảy ra

We need to decide on the authentication mechanism for the application endpoints.

## Nguyên nhân

The chosen mechanism determines security requirements and user authentication flows.

## Các lựa chọn

(a) giữ cách hiện tại; (b) đổi sang cách đã đề xuất ở trên.

## Khuyến nghị

(b), vì nó giải quyết đúng vấn đề đã nêu.

## Phạm vi của câu trả lời

Đồng ý chỉ cho phép làm đúng thay đổi này, không gì thêm.`;


test('ask/answer round-trip on a todo item: park removes from ready and surfaces the ask via list, answer resumes to todo and reopens ready', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gated-item');

  const askResult = run(cwd, ['ask', 'gated-item', '--text', VALID_ASK_TEXT]);
  assert.equal(askResult.status, 0);
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-item', from: 'todo', to: 'awaiting-human', seq: 2 });
  assert.equal(stateView(cwd).work['gated-item'].status, 'awaiting-human');

  // D7: list surfaces the parked item's status and its question, no new
  // read command/formatter — the existing `view.gates` fold carries it.
  const listedWhileAwaiting = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listedWhileAwaiting.work['gated-item'].status, 'awaiting-human');
  assert.equal(listedWhileAwaiting.gates['gated-item'].ask, VALID_ASK_TEXT);
  assert.equal(listedWhileAwaiting.gates['gated-item'].answer, undefined);

  // D6: a parked item is never in the ready set.
  const readyWhileAwaiting = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyWhileAwaiting.some((i) => i.id === 'gated-item'));

  const answerResult = run(cwd, ['answer', 'gated-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-item', from: 'awaiting-human', to: 'todo', seq: 3 });
  assert.equal(stateView(cwd).work['gated-item'].status, 'todo');

  const listedAfterAnswer = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listedAfterAnswer.gates['gated-item'].ask, VALID_ASK_TEXT);
  assert.equal(listedAfterAnswer.gates['gated-item'].answer, 'OAuth');

  const readyAfterAnswer = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(readyAfterAnswer.some((i) => i.id === 'gated-item'));
});


// tsk-19zm D2: ask's checkpoint distillate and answer's authoritative word
// live in SEPARATE gates[id] fields -- neither overwrites the other, unlike
// rationale/alternatives/source before this item (answer-only fields).
test('ask keeps only --source beside its text; answer --rationale/--alternatives and --approve land on gates[id]', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'checkpoint-item');

  run(cwd, ['ask', 'checkpoint-item', '--text', VALID_ASK_TEXT, '--source', 'session']);
  const afterAsk = envelopeData(run(cwd, ['list']).stdout).gates['checkpoint-item'];
  assert.equal(afterAsk.askSource, 'session');
  assert.equal(afterAsk.rationale, undefined);
  assert.equal(afterAsk.approved, undefined);

  run(cwd, [
    'answer', 'checkpoint-item', '--approve', '--text', 'OAuth',
    '--rationale', 'confirmed OAuth per compliance requirement',
    '--alternatives', 'password: rejected, extra reset-flow maintenance',
    '--source', 'human',
  ]);
  const afterAnswer = envelopeData(run(cwd, ['list']).stdout).gates['checkpoint-item'];
  assert.equal(afterAnswer.rationale, 'confirmed OAuth per compliance requirement');
  assert.equal(afterAnswer.alternatives, 'password: rejected, extra reset-flow maintenance');
  assert.equal(afterAnswer.source, 'human');
  assert.equal(afterAnswer.askSource, 'session');
  assert.equal(afterAnswer.approved, true);
});


test('ask without --text is rejected as validation, exit 4, no event written, item stays in its prior status', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-text-ask');
  moveToDurableDoingForTest(cwd, 'no-text-ask');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['ask', 'no-text-ask']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['no-text-ask'].status, 'doing');
});


test('answer on an item that is not awaiting-human is rejected as precondition, exit 2, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'never-parked');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['answer', 'never-parked', '--text', 'irrelevant']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['never-parked'].status, 'todo');
});


