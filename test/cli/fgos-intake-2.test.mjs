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


test('add --parent "" (bare, no value) is rejected as a valueless flag, same as add --discovered-from', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'parent-bad', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', '--description', 'tsk-535 fixture description.']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--parent requires a non-empty id/);
});


test('add with no --priority/--intent leaves both fields absent (undefined), not null and not zero', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'add-no-priority-intent');
  const item = stateView(cwd).work['add-no-priority-intent'];
  assert.equal(item.priority, undefined);
  assert.equal(item.intent, undefined);
});


// --- work-item-priority-matrix D2/D3/D5: --urgent (add + edit),
// --impact/--effort (edit only) ---
//
// --urgent exists on BOTH `add` and `edit` (D2, human-entered at intake or
// later); --impact/--effort exist ONLY on `edit` (D3/D5, computed fields --
// no --impact/--effort equivalent on `add`'s parser wiring, same
// established shape --priority/--intent already use above).

test('add --urgent sets the item urgent field, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'add-urgent', '--title', 'Add urgent', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--urgent', 'high', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['add-urgent'].urgent, 'high');
});


test('add with no --urgent leaves the field absent (undefined), not a default of medium', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'add-no-urgent');
  assert.equal(stateView(cwd).work['add-no-urgent'].urgent, undefined);
});


test('decision logs one event and appears in the view, exit 0', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision', '--text', 'locked D5 naming', '--rationale', 'avoids a naming collision with an existing verb', '--relation', 'none']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  assert.equal(stateView(cwd).decisions.length, 1);
  assert.equal(stateView(cwd).decisions[0].text, 'locked D5 naming');
  assert.equal(stateView(cwd).decisions[0].rationale, 'avoids a naming collision with an existing verb');
  // source defaults to 'session' when omitted (tsk-63c D3)
  assert.equal(stateView(cwd).decisions[0].source, 'session');
});


test('decision without --text is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


// tsk-63c D2: rationale is required on `decision`, mirroring bee's own
// throw-if-blank rule -- --text alone is no longer sufficient.
test('decision without --rationale is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision', '--text', 'locked D5 naming']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


// tsk-63c D1/D3: alternatives/source are optional free text, and an explicit
// --source overrides the 'session' default.
test('decision with --alternatives, --source, and --id folds all fields, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-a');
  const before = eventLines(cwd).length;
  const result = run(cwd, [
    'decision',
    '--text', 'chose option B',
    '--rationale', 'option B has no external dependency',
    '--alternatives', 'option A was rejected -- needs a new package',
    '--source', 'human',
    '--id', 'item-a',
    '--relation', 'none',
  ]);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const view = stateView(cwd);
  const logged = view.decisions.at(-1);
  assert.equal(logged.alternatives, 'option A was rejected -- needs a new package');
  assert.equal(logged.source, 'human');
  assert.equal(logged.id, 'item-a');
  assert.equal(view.decisionsById['item-a'].length, 1);
  assert.equal(view.decisionsById['item-a'][0].text, 'chose option B');
});


test('add with no flags at all is rejected as validation (missing --title), exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 4);
});


test('add omitting --id auto-generates a collision-free tsk-<hash> id from --title, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', '--title', 'Auto id from title', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  const generatedId = envelopeData(result.stdout).id;
  assert.match(generatedId, /^tsk-[0-9a-z]{3,8}$/, `generated id "${generatedId}" should match generateId's tsk-<hash> shape`);
  assert.equal(stateView(cwd).work[generatedId].title, 'Auto id from title');
});


test('add with --title but no --id is rejected the same as a fully bare call (missing --title still checked first)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 4);
});


// --- D6 tier: --tier on `add` (phase-2-routing-3) ---

test('add with --tier records the given tier explicitly in the view, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'heavy-item', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--tier', 'heavy', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['heavy-item'].tier, 'heavy');
});


test('add without --tier defaults to work.mjs DEFAULTS.tier ("standard"), exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'default-tier-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['default-tier-item'].tier, 'standard');
});


test('add explicitly writes the tier into the work.add event payload itself, not only the folded view', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'explicit-tier-item');
  const lines = eventLines(cwd);
  const addEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(addEvent.type, 'work.add');
  assert.equal(addEvent.payload.tier, 'standard');
});
