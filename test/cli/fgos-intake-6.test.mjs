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


test('submit --discovered-from persists discoveredFrom (two-hop: opts -> submitWork work object), exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'origin-item');
  const result = run(cwd, ['submit', 'Follow up on the origin item', '--discovered-from', 'origin-item']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.discoveredFrom, 'origin-item');
});


// --- str83-fgos-slash-commands D4: --deps on `submit` (mirrors add's ---
// already-existing --deps handling, same parseListFlag helper, same
// addWork write-gate, cycle-checked)

test('submit without --deps stays byte-identical to today: deps: [], exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.deepEqual(item.deps, []);
  const id = item.id;
  assert.deepEqual(envelopeData(run(cwd, ['list']).stdout).work[id].deps, []);
});


test('submit --deps <id1,id2> persists those deps, validated through the same write-gate add uses, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'dep-one');
  addOk(cwd, 'dep-two');
  const result = run(cwd, ['submit', 'Follow up on two prior items', '--deps', 'dep-one,dep-two']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.deepEqual(item.deps, ['dep-one', 'dep-two']);
});


// --- str51-llm-assist-classify D2/D5: --tier/--kind/--risk overrides on ---
// `submit` (each independently overrides classify(text)'s per-field output;
// an omitted flag stays byte-identical to classify()'s own derived value)

test('submit with no --tier/--kind/--risk flags is byte-identical to pre-feature behavior (regression proof)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'standard');
  assert.equal(item.kind, 'task');
  assert.equal(item.risk, 'standard');
});


test('submit --tier heavy --kind bug --risk heavy overrides all three fields regardless of classify(text)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--tier', 'heavy', '--kind', 'bug', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.kind, 'bug');
  assert.equal(item.risk, 'heavy');
});


test('submit with only --kind overrides just that field; tier and risk still come from classify(text)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--kind', 'bug']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.kind, 'bug');
  assert.equal(item.tier, 'standard');
  assert.equal(item.risk, 'standard');
});


test('submit --tier override alone does not change risk -- risk still mirrors classify()\'s own tier, not the override', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--tier', 'heavy']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.risk, 'standard');
});


// --- tsk-5gu: --verify override on `submit`, same optionalField shape as ---
// --tier/--kind/--risk above (a submitter who already stated a real verify
// in free text can now attach it directly instead of round-tripping
// through `fgos edit --verify` after the fact).

test('submit --verify "npm test" sets the item\'s own verify to that command, not the sentinel', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page. Verify: npm test', '--verify', 'npm test']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.verify, 'npm test');
});


test('submit without --verify leaves verify at the sentinel, byte-identical to pre-feature behavior', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.verify, 'chưa xác định — P15 bổ sung');
});


test('submit without --docs-ref leaves docsRef unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'A task with no docs link']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].docsRef, undefined);
});


test('submit --docs-ref persists docsRef, exit 0 -- an item created through the public door can now carry this link from the start', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'A task with a docs link', '--docs-ref', 'docs/history/some-feature/']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].docsRef, 'docs/history/some-feature/');
});


// --- settlement channel role attribution (phase-3-compound-learning-5,
// S3-closeout) — real CLI call sites stamp `role` per vision §8: the
// `move`/`answer` verbs are always a human at the keyboard; `discover` is
// the sync, session-driven call site (the async runner sweep is 'runner',
// covered at the runner unit-test layer). ---------------------------------

test('answer via the real CLI stamps role "human" on the event payload and folds into an "answer" settlement', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'answer-actor-item');
  run(cwd, ['move', 'answer-actor-item', '--to', 'doing']);
  run(cwd, ['ask', 'answer-actor-item', '--text', VALID_ASK_TEXT]);

  const result = run(cwd, ['answer', 'answer-actor-item', '--text', 'OAuth']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.role, 'human');

  const view = stateView(cwd);
  assert.equal(view.settlements['answer-actor-item'].length, 1);
  assert.equal(view.settlements['answer-actor-item'][0].kind, 'answer');
  assert.equal(view.settlements['answer-actor-item'][0].role, 'human');
});


test('move to done via the real CLI stamps role "human" on the event payload and folds into a "close" settlement', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'close-actor-item');

  const result = toDoneViaChain(cwd, 'close-actor-item');
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.role, 'human');

  const view = stateView(cwd);
  assert.equal(view.settlements['close-actor-item'].length, 1);
  assert.equal(view.settlements['close-actor-item'][0].kind, 'close');
  assert.equal(view.settlements['close-actor-item'][0].role, 'human');
});


// --- `submit` extraction regression (self-improve-loop D15): the verb's
// body was pulled out into a shared submitWork(dir, text, opts) so `evolve
// --submit` below can reuse it without duplicating the work-object
// construction. These combined-flag calls were never exercised together
// pre-extraction (--async/--domain were each tested separately above) —
// proving they still combine correctly is the regression coverage D15
// requires.

test('submit stays byte-identical after the submitWork extraction: a plain call and a call combining --async + --domain', () => {
  const cwd = tmpCwd();

  const plain = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(plain.status, 0);
  const plainItem = JSON.parse(plain.stdout).data;
  assert.equal(plainItem.status, 'todo');
  assert.equal(plainItem.mode, 'sync');
  assert.equal(plainItem.domain, undefined);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[plainItem.id].stage, 'discovery');

  const flagged = run(cwd, ['submit', 'Try the synthetic domain', '--async', '--domain', 'synthetic']);
  assert.equal(flagged.status, 0);
  const flaggedItem = JSON.parse(flagged.stdout).data;
  assert.equal(flaggedItem.mode, 'async');
  assert.equal(flaggedItem.domain, 'synthetic');
  assert.equal(flaggedItem.stage, 'assembling');

  const unattended = run(cwd, ['submit', 'Draft the onboarding walkthrough', '--unattended']);
  assert.equal(unattended.status, 0);
  assert.equal(JSON.parse(unattended.stdout).data.mode, 'async');
});
