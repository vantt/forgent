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


// --- `fgos submit` (stage-intake-3): free-text intake verb (P14, D1-D6) ---
//
// e2e through the real binary (never a direct call to classify.mjs) per the
// plan's Learnings Applied: id-collision retry and the C1 envelope must be
// proven end-to-end. `submit` runs parallel to `add`, auto-derives title/id
// and mechanically classifies tier/kind/risk, persists through the same
// addWork door, and prints the fgos.v1 envelope.

test('submit prints a well-formed fgos.v1 envelope: contract + generated_at + data_hash + data, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.match(envelope.data_hash, /^[0-9a-f]{64}$/);
  assert.ok(!Number.isNaN(Date.parse(envelope.generated_at)));
  assert.equal(typeof envelope.data.id, 'string');
  assert.equal(envelope.data.status, 'todo');
});


test('submit persists the full text as description, separate from the (possibly truncated) title (P30)', () => {
  const cwd = tmpCwd();
  const text = 'Investigate the sluggish overview page and figure out why it takes so long to render for large accounts';
  const result = run(cwd, ['submit', text]);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.equal(item.description, text);

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[item.id].description, text);
});


test('submit without a mode flag records mode:"sync"; --async records mode:"async" — both visible via list', () => {
  const cwd = tmpCwd();

  const syncSubmit = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(syncSubmit.status, 0);
  const syncId = JSON.parse(syncSubmit.stdout).data.id;

  const asyncSubmit = run(cwd, ['submit', 'Rework the settings navigation flow', '--async']);
  assert.equal(asyncSubmit.status, 0);
  const asyncId = JSON.parse(asyncSubmit.stdout).data.id;

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[syncId].mode, 'sync');
  assert.equal(view.work[asyncId].mode, 'async');
});


test('submit with --unattended is treated the same as --async: mode:"async"', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Draft the onboarding walkthrough', '--unattended']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].mode, 'async');
});


// work-item-backlog-status D2: --backlog is the opt-in escape hatch that
// creates an item directly at the backlog status. The default must stay
// 'todo' for a flagless submit -- that regression guard is half of what
// this test exists for, since D2's whole point is that the default did NOT
// change. D3 gives backlog its own statusCategory, which is what keeps a
// backlog item out of the ready frontier with no frontier-side code change.
test('submit --backlog creates the item at status:"backlog" with its own category and out of ready; a flagless submit still creates status:"todo"', () => {
  const cwd = tmpCwd();

  const backlogSubmit = run(cwd, ['submit', 'Maybe rethink the settings navigation someday', '--backlog']);
  assert.equal(backlogSubmit.status, 0);
  const backlogId = JSON.parse(backlogSubmit.stdout).data.id;

  const plainSubmit = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(plainSubmit.status, 0);
  const plainId = JSON.parse(plainSubmit.stdout).data.id;

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[backlogId].status, 'backlog');
  assert.equal(view.work[backlogId].statusCategory, 'backlog');
  assert.equal(view.work[plainId].status, 'todo');

  const ready = envelopeData(run(cwd, ['ready']).stdout);
  const readyIds = JSON.stringify(ready);
  assert.ok(!readyIds.includes(backlogId), 'a backlog item must not appear in the ready frontier');
});


test('submit of text matching no keyword falls back to tier:"standard" and persists, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.equal(item.tier, 'standard');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[item.id].tier, 'standard');
});


test('submit with no text at all is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});


test("submit tags the new item with stage:'discovery', visible via list", () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery');
});


test('add stamps stage "discovery" by default (D1/D2, add-stage-default-gap; tsk-qod D1/D2: clarify retired, discovery is stages[0] now) — parity with submit, no longer the old implicit "executing"', () => {
  const cwd = tmpCwd();
  // Raw run(), not addOk() -- addOk defaults its own --stage to 'executing'
  // for its many other callers' sake (see its own comment); this test is
  // specifically about the CLI's bare, flagless default.
  run(cwd, ['add', 'plain-add', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']);
  const item = envelopeData(run(cwd, ['list']).stdout).work['plain-add'];
  assert.equal(item.stage, 'discovery');
});


// --- base-workflow-model S2: --domain on `submit` (D1-D4, E3) ---

test('submit without --domain is byte-identical to before: domain unset, stage "discovery" (coding\'s own entry stage, stages[0] — tsk-qod D1/D2: clarify retired), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.domain, undefined);
  assert.equal(item.stage, 'discovery');
});


test('submit --domain coding is explicit and still resolves stage to "discovery", exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--domain', 'coding']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.domain, 'coding');
  assert.equal(item.stage, 'discovery');
});


test('submit --domain synthetic persists work.domain and resolves stage to its own first stage ("assembling", no Clarify-mapped stage), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Try the synthetic domain', '--domain', 'synthetic']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.domain, 'synthetic');
  assert.equal(item.stage, 'assembling');
});


for (const [label, badFlagArgs] of SUBMIT_BAD_FLAG_CASES) {
  test(`submit with ${label} is rejected as validation, exit 4, no event written`, () => {
    const cwd = tmpCwd();
    const before = eventLines(cwd).length;
    const result = run(cwd, ['submit', 'Try a bad flag value', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
  });
}

test('submit --domain <bad> produces exactly one stderr line (the validation error), no stray "folding to coding" warning — parity with add (review-20260717-self-improve-base-workflow f3)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Try a bad domain again', '--domain', 'bogus']);
  assert.equal(result.status, 4);
  assert.doesNotMatch(result.stderr, /folding to "coding"/);
  const stderrLines = result.stderr.split('\n').filter(Boolean);
  assert.equal(stderrLines.length, 1, `expected exactly one stderr line, got: ${JSON.stringify(stderrLines)}`);
});


// --- work-graph-intelligence S2b: --discovered-from on `submit` (producer A, two-hop) ---

test('submit without --discovered-from leaves discoveredFrom unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.discoveredFrom, undefined);
});
