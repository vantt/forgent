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


for (const [label, badFlagArgs] of ADD_BAD_FLAG_CASES) {
  test(`add with ${label} is rejected as validation, exit 4, no event written`, () => {
    const cwd = tmpCwd();
    const before = eventLines(cwd).length;
    const result = run(cwd, ['add', 'bad-flag-item', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', ...badFlagArgs, '--description', 'tsk-535 fixture description.']);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
  });
}

// --- base-workflow-model S2: --domain on `add` (D1-D4) ---

test('add without --domain leaves domain unset — the view still reads "coding" behavior unchanged, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'default-domain-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['default-domain-item'].domain, undefined);
});


test('add --domain synthetic persists work.domain and stamps stage "assembling" (no --stage flag needed), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'synthetic-item',
    '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x',
    '--domain', 'synthetic', '--description', 'tsk-535 fixture description.',
  ]);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['synthetic-item'];
  assert.equal(item.domain, 'synthetic');
  assert.equal(item.stage, 'assembling', 'per D1/D2 (add-stage-default-gap): add now stamps an entry stage explicitly; synthetic has no Clarify-mapped stage, so the same fallback that used to run lazily at read-time (domain.stages[0]) now runs at add-time instead, same resulting value');
  assert.deepEqual(envelopeData(run(cwd, ['ready']).stdout).map((w) => w.id), ['synthetic-item'], 'the item is stamped straight at its domain\'s one Execute-mapped stage ("assembling"), so it is already frontier-ready');
});


test('add --domain coding is explicit and behaves identically to omitting --domain, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'explicit-coding-item',
    '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x',
    '--domain', 'coding', '--description', 'tsk-535 fixture description.',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['explicit-coding-item'].domain, 'coding');
});


// --- add-stage-default-gap D1/D2: add stamps an entry stage (--stage, and a
// domain-entry-stage default when omitted -- 'discovery' as of tsk-qod
// D1/D2, 'clarify' before it), same door submit has always had ---

test('add without --stage or --domain now defaults to stage "discovery" (was implicit "executing"), and is NOT frontier-ready, exit 0', () => {
  const cwd = tmpCwd();
  // Raw run(), not addOk() -- addOk defaults its own --stage to 'executing'
  // for its many other callers' sake (see its own comment); this test is
  // specifically about the CLI's bare, flagless default.
  const result = run(cwd, ['add', 'default-stage-item', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['default-stage-item'].stage, 'discovery');
  assert.deepEqual(envelopeData(run(cwd, ['ready']).stdout).map((w) => w.id), [], 'a stage-discovery item has no dependencies and no unfinished descendants, but is not stage-executing, so it must not appear in the frontier');
});


test('add --stage decompose explicitly persists that stage, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'stage-flag-decompose', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--stage', 'decompose', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['stage-flag-decompose'].stage, 'decompose');
});


test('add --stage executing explicitly persists that stage and IS frontier-ready (opts back into pre-fix behavior), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'stage-flag-executing', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--stage', 'executing', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['stage-flag-executing'].stage, 'executing');
  assert.deepEqual(envelopeData(run(cwd, ['ready']).stdout).map((w) => w.id), ['stage-flag-executing']);
});


// --- work-graph-intelligence S2b: --discovered-from on `add` (producer A) ---

test('add without --discovered-from leaves discoveredFrom unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-discovered-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['no-discovered-item'].discoveredFrom, undefined);
});


test('add --discovered-from persists discoveredFrom on the new item, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'origin-item');
  const result = run(cwd, [
    'add', 'discovered-item',
    '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x',
    '--discovered-from', 'origin-item', '--description', 'tsk-535 fixture description.',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['discovered-item'].discoveredFrom, 'origin-item');
});


// --- str67-goal-directed-planning D1/D2: --goal-tier and --targets on `add` ---

test('add without --goal-tier/--targets leaves both fields unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-goal-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['no-goal-item'].goalTier, undefined);
  assert.equal(stateView(cwd).work['no-goal-item'].targets, undefined);
});


test('add --goal-tier mvp --targets a,b persists both fields, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'goal-item',
    '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x',
    '--goal-tier', 'mvp', '--targets', 'a,b', '--description', 'tsk-535 fixture description.',
  ]);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['goal-item'];
  assert.equal(item.goalTier, 'mvp');
  assert.deepEqual(item.targets, ['a', 'b']);
});


test('add --targets "" parses to [] explicitly, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'empty-targets-item', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--targets', '', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['empty-targets-item'].targets, []);
});


test('add with a bare --targets (no value) also parses to [], exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'bare-targets-item', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--targets', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['bare-targets-item'].targets, []);
});


// --- p50-workflow-induct D7: --docs-ref on `add` (ceremony decision-doc pointer) ---

test('add without --docs-ref leaves docsRef unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-docs-ref-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['no-docs-ref-item'].docsRef, undefined);
});


test('add --docs-ref persists docsRef and round-trips unchanged through fgos list, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'docs-ref-item',
    '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x',
    '--docs-ref', 'docs/history/p50-workflow-induct/', '--description', 'tsk-535 fixture description.',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['docs-ref-item'].docsRef, 'docs/history/p50-workflow-induct/');
  const listed = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listed.work['docs-ref-item'].docsRef, 'docs/history/p50-workflow-induct/');
});
