// fgos-intake.test.mjs -- phần "add, submit, move, decision, ask, answer, ask/answer" của bộ test CLI, tách nguyên văn
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
  writeLiveLock,
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
} from './helpers/fgos-cli-harness.mjs';


// tsk-4fu-2: requiresExistingStore guard (command-registry.mjs) — a
// state-write verb no longer silently auto-vivifies `.fgos/` via
// appendEventCore's own mkdirSync when it's missing; it refuses instead.

// --- `fgos ask`/`fgos answer` (async-human-gate-3): the human-gate round-trip ---
//
// e2e per D5/D6/D7: `ask` parks a work item into `awaiting-human` carrying
// the question; while parked, `ready` must exclude it (D6) and `list` must
// surface it — status + its question, via the existing view.gates fold, no
// new formatter (D7); `answer` records the answer and resumes the item to
// `todo`, at which point it is actionable again (back in `ready`).

const VALID_ASK_TEXT = `## Context

We need to decide on the authentication mechanism for the application endpoints.

## Why this matters

The chosen mechanism determines security requirements and user authentication flows.`;


test('move doing -> awaiting-approval applies via the real CLI, exit 0', () => {
  const cwd = tmpCwd();
  const result = toProposed(cwd, 'goal-checked');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['goal-checked'].status, 'awaiting-approval');
});


test('move awaiting-approval -> delivered (approval) applies via the real CLI, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'approved-item');
  const result = run(cwd, ['move', 'approved-item', '--to', 'delivered']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['approved-item'].status, 'delivered');
});


test('move awaiting-approval -> todo (rejection) without --reason is refused as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'no-reason-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'no-reason-item', '--to', 'todo']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['no-reason-item'].status, 'awaiting-approval');
});


test('move awaiting-approval -> todo with an empty --reason "" is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'empty-reason-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'empty-reason-item', '--to', 'todo', '--reason', '']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


test('move awaiting-approval -> todo (rejection) with --reason carries the reason into the event payload, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'rejected-item');
  const result = run(cwd, ['move', 'rejected-item', '--to', 'todo', '--reason', 'flaky test coverage']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['rejected-item'].status, 'todo');

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.type, 'work.move');
  assert.equal(lastEvent.payload.reason, 'flaky test coverage');
});


test('move awaiting-approval -> doing is a forbidden edge (proposed is never a re-entry point for doing), exit 2, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'no-reentry-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'no-reentry-item', '--to', 'doing']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
});


test('move awaiting-approval -> done rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cas-proposed-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cas-proposed-item', '--to', 'done', '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-proposed-item'].status, 'awaiting-approval');
});


test('move --reason on a non-rejection edge is accepted but ignored, not embedded in the payload', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reason-ignored-item');
  // tsk-40m: todo -> doing is retired -- blocked stands in as the generic
  // "some non-rejection edge" example this test actually needs.
  const result = run(cwd, ['move', 'reason-ignored-item', '--to', 'blocked', '--reason', 'not a rejection']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, undefined);
});


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
test('ask --rationale and answer --rationale both persist on gates[id], neither overwriting the other', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'checkpoint-item');

  run(cwd, [
    'ask', 'checkpoint-item', '--text', VALID_ASK_TEXT,
    '--rationale', 'leaning OAuth: fewer support tickets historically',
    '--alternatives', 'password rejected: extra reset-flow maintenance',
    '--source', 'session',
  ]);
  const afterAsk = envelopeData(run(cwd, ['list']).stdout).gates['checkpoint-item'];
  assert.equal(afterAsk.askRationale, 'leaning OAuth: fewer support tickets historically');
  assert.equal(afterAsk.askAlternatives, 'password rejected: extra reset-flow maintenance');
  assert.equal(afterAsk.askSource, 'session');
  assert.equal(afterAsk.rationale, undefined);

  run(cwd, [
    'answer', 'checkpoint-item', '--text', 'OAuth',
    '--rationale', 'confirmed OAuth per compliance requirement',
    '--alternatives', 'password: rejected, same reasons as checkpoint',
    '--source', 'human',
  ]);
  const afterAnswer = envelopeData(run(cwd, ['list']).stdout).gates['checkpoint-item'];
  // Answer's fields land in the answer-only trio, still authoritative.
  assert.equal(afterAnswer.rationale, 'confirmed OAuth per compliance requirement');
  assert.equal(afterAnswer.alternatives, 'password: rejected, same reasons as checkpoint');
  assert.equal(afterAnswer.source, 'human');
  // The agent's original checkpoint from `ask` is still there, untouched.
  assert.equal(afterAnswer.askRationale, 'leaning OAuth: fewer support tickets historically');
  assert.equal(afterAnswer.askAlternatives, 'password rejected: extra reset-flow maintenance');
  assert.equal(afterAnswer.askSource, 'session');
});


// claim-lock §5.1, tsk-40m P1 fix + hard-cut (docs/architect/doing-
// coordination-redesign.md): superseded by the redesign — asking a
// CLAIMED item (effective 'doing' via an active runtime claim, durable
// status still 'todo') now settles the claim DIRECTLY into awaiting-human,
// releasing it, and answering resumes to the durable base ('todo'), never
// a durable 'doing'. This is the exact P1 bug an independent review found
// after the redesign first landed ("take -> ask -> answer durably wrote
// awaiting-human -> doing with no backing claim at all") — repro'd here
// through the real CLI end to end.
test('ask/answer round-trip on a CLAIMED item: ask releases the claim and settles directly to awaiting-human, answer resumes to the durable base — never a durable doing (claim-lock §5.1 + tsk-40m P1 fix)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'gated-claimed-item');
  assert.equal(run(cwd, ['take', '--id', 'gated-claimed-item']).status, 0);
  assert.equal(stateView(cwd).work['gated-claimed-item'].status, 'doing', 'effective doing via the claim overlay, before ask');

  const askResult = run(cwd, ['ask', 'gated-claimed-item', '--text', VALID_ASK_TEXT]);
  assert.equal(askResult.status, 0);
  // Settles DIRECTLY from the claim's own preClaimStatus ('todo') — never
  // through a durable 'doing' leg.
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-claimed-item', from: 'todo', to: 'awaiting-human', seq: 4 });
  assert.equal(stateView(cwd).work['gated-claimed-item'].status, 'awaiting-human');

  const readyWhileAwaiting = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyWhileAwaiting.some((i) => i.id === 'gated-claimed-item'));

  const answerResult = run(cwd, ['answer', 'gated-claimed-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-claimed-item', from: 'awaiting-human', to: 'todo', seq: 5 });
  assert.equal(stateView(cwd).work['gated-claimed-item'].status, 'todo');

  // Resumes to the durable base ('todo') -- it re-enters the ready set,
  // unlike the OLD (retired) resume-to-doing behavior this test used to
  // pin. Reacquiring the claim (a separate, explicit `take`) is the only
  // way back to an effective 'doing'.
  const readyAfterAnswer = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(readyAfterAnswer.some((i) => i.id === 'gated-claimed-item'));
});

// Hard-cut companion (docs/architect/doing-coordination-redesign.md):
// awaiting-human -> doing is retired from status-fsm.mjs's TRANSITIONS
// table entirely — a genuinely legacy pre-migration item (no claim
// involved, durable status really was 'doing') still resumes to `todo`,
// never `doing`, since that edge no longer exists at all.
test('ask/answer round-trip on a genuinely legacy durable-doing item (no claim): answer clamps to todo — awaiting-human -> doing no longer exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gated-legacy-doing-item');
  moveToDurableDoingForTest(cwd, 'gated-legacy-doing-item');

  const askResult = run(cwd, ['ask', 'gated-legacy-doing-item', '--text', VALID_ASK_TEXT]);
  assert.equal(askResult.status, 0);
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-legacy-doing-item', from: 'doing', to: 'awaiting-human', seq: 2 });

  const answerResult = run(cwd, ['answer', 'gated-legacy-doing-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-legacy-doing-item', from: 'awaiting-human', to: 'todo', seq: 3 });
  assert.equal(stateView(cwd).work['gated-legacy-doing-item'].status, 'todo');
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


test('ask rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cas-ask-item');
  moveToDurableDoingForTest(cwd, 'cas-ask-item');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['ask', 'cas-ask-item', '--text', VALID_ASK_TEXT, '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-ask-item'].status, 'doing');
});
