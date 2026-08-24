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


// --- work-graph-intelligence S9: footprint field + `fgos conflicts` -------

test('add --footprint persists the list; omitting the flag leaves footprint absent', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'withfp', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/a.mjs,src/b.mjs', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(addOk(cwd, 'nofp').status, 0);
  const view = stateView(cwd);
  assert.deepEqual(view.work.withfp.footprint, ['src/a.mjs', 'src/b.mjs']);
  assert.equal('footprint' in view.work.nofp, false, 'an omitted --footprint leaves the field absent, not []');
});


// --- str73-done-flip-cos-check cell 1: --acceptance on add/submit/edit ----

test('add --acceptance persists work.acceptance as the given array, validated through validateWork', () => {
  const cwd = tmpCwd();
  // tsk-5q5-2: evidence must resolve to a real path under cwd (the new
  // write-time traceability gate) -- tmpCwd() only guarantees `.fgos/`
  // files exist, so this points there rather than a fictional source path.
  const clauses = [{ text: 'CLI exits 0 on success' }, { text: 'field round-trips', evidence: '.fgos/events.jsonl' }];
  const result = run(cwd, ['add', 'with-acceptance', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(clauses), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['with-acceptance'].acceptance, clauses);
});


// tsk-5q5-2 (D1/D3, docs/history/judge-verdict-evidence-discipline/): the new
// narrow write-time evidence-traceability gate, end to end through the CLI.

test('add --acceptance is refused when a clause supplies text+evidence together but evidence cites no real path', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'root cause confirmed', evidence: 'trust me, this is definitely correct' }];
  const result = run(cwd, ['add', 'untraceable', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(clauses), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /evidence/);
  assert.equal(stateView(cwd).work['untraceable'], undefined, 'nothing is written on a rejected acceptance clause');
});


test('add --acceptance succeeds when a text+evidence clause cites a real path that exists under cwd', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'root cause confirmed', evidence: '.fgos/events.jsonl documents the real event log' }];
  const result = run(cwd, ['add', 'traceable', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(clauses), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['traceable'].acceptance, clauses);
});


test('add --acceptance with a text-only clause (no evidence yet) is completely unaffected by the traceability gate', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'ship it' }];
  const result = run(cwd, ['add', 'text-only', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(clauses), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['text-only'].acceptance, clauses);
});


test('submit --acceptance persists work.acceptance as the given array (opts -> submitWork work object)', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'the intake item satisfies its ask' }];
  const result = run(cwd, ['submit', 'Do the thing', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(stateView(cwd).work[data.id].acceptance, clauses);
});


test('add with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;

  const invalidJson = run(cwd, ['add', 'bad-json', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', 'not json', '--description', 'tsk-535 fixture description.']);
  assert.equal(invalidJson.status, 4);

  const notArray = run(cwd, ['add', 'bad-shape', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify({ text: 'x' }), '--description', 'tsk-535 fixture description.']);
  assert.equal(notArray.status, 4);

  const missingText = run(cwd, ['add', 'bad-entry', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify([{ evidence: 'e' }, '--description', 'tsk-535 fixture description.'])]);
  assert.equal(missingText.status, 4);

  const emptyText = run(cwd, ['add', 'bad-empty-text', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify([{ text: '' }, '--description', 'tsk-535 fixture description.'])]);
  assert.equal(emptyText.status, 4);

  const bareFlag = run(cwd, ['add', 'bad-bare-flag', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', '--description', 'tsk-535 fixture description.']);
  assert.equal(bareFlag.status, 4);

  assert.equal(eventLines(cwd).length, before, 'no malformed --acceptance attempt should append any event');
});


test('submit with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['submit', 'Try a bad acceptance value', '--acceptance', 'not json']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


// --- str73-done-flip-cos-check cell 2: per-clause CoS done-gate via the ----
// --- real CLI (move / approve) ---------------------------------------------
//
// Mirrors the RUL50 compound-learn tests above (`toCompoundLearn`, "move
// awaiting-approval -> done (approval) applies via the real CLI"): an item must clear
// BOTH the stage gate and this cell's acceptance-evidence gate before it can
// close. `approve` on a plain (non-git-backed) item resolves to the
// "legacy" source (no `fgw/<id>` branch, no headAtTake/headAtReturn) and its
// verify-only path re-runs `item.verify` against cwd before calling the same
// `moveWork(..., to: 'done')` a direct `move` uses — `verify: 'true'` keeps
// that check trivially green so the test isolates the acceptance gate.

test('move --to delivered is refused when a populated acceptance clause has no evidence: precondition, exit 2, item stays proposed, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-missing');
  run(cwd, ['edit', 'cli-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cli-cos-missing', '--to', 'delivered']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['cli-cos-missing'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
});


test('move --to delivered succeeds when every acceptance clause has non-empty evidence, exactly as before this cell', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-evidenced');
  // tsk-5q5-2: evidence must resolve to a real path under cwd -- assert the
  // edit itself succeeds too, so a future regression in the new write-time
  // gate can't silently no-op this edit and let the item coast through on
  // an acceptance field that was never actually set (RUL58's own
  // absent-is-unaffected rule would otherwise mask exactly that).
  const editResult = run(cwd, ['edit', 'cli-cos-evidenced', '--acceptance', JSON.stringify([{ text: 'ship it', evidence: '.fgos/events.jsonl' }])]);
  assert.equal(editResult.status, 0, 'edit --acceptance with real, traceable evidence must succeed');

  const result = run(cwd, ['move', 'cli-cos-evidenced', '--to', 'delivered']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['cli-cos-evidenced'].status, 'delivered');
});
