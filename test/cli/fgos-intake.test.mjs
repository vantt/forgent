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

test('submit on a directory with no .fgos/ at all is refused, exit 4, writes nothing (no auto-vivify)', () => {
  const cwd = rawTmpCwd();
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
  const result = run(cwd, ['submit', 'should never land']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'the refused verb must not create .fgos/ as a side effect');
});


test('add creates exactly one work.add event and the view reflects the new item, exit 0', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = addOk(cwd, 'build-cli', { title: 'Build CLI', kind: 'feature', risk: 'standard', verify: "node --test 'test/cli/*.test.mjs'" });
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);

  const view = stateView(cwd);
  assert.equal(view.work['build-cli'].status, 'todo');
  assert.equal(view.work['build-cli'].title, 'Build CLI');
  assert.equal(view.work['build-cli'].kind, 'feature');
  assert.equal(view.work['build-cli'].risk, 'standard');
});


test('add with a missing required field (--verify) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'no-verify', '--title', 'X', '--kind', 'task', '--risk', 'light', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});


// tsk-535 D1: --description is now required on add, same discipline as
// --title/--kind/--risk/--verify above -- no default fallback (e.g.
// silently reusing --title), per plan.md's rejected-alternative.
test('add with a missing required field (--description) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'no-description', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'x']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--description/);
  assert.equal(eventLines(cwd).length, 0);
});


test('add --description persists the given description on the new item, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'with-description',
    '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'x',
    '--description', 'The full story behind this item.',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['with-description'].description, 'The full story behind this item.');
});


test('add with an invalid (non kebab-case) id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'Not_Kebab');
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});


test('add with a duplicate id is rejected as validation, exit 4, no extra event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'dup-id');
  const before = eventLines(cwd).length;
  const result = addOk(cwd, 'dup-id');
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});


test('add with an unknown dep id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'has-bad-dep', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--deps', 'ghost-dep', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 4);
});


test('move applies a legal transition, appends one event, and updates the view, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'movable');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'movable', '--to', 'doing']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  assert.equal(stateView(cwd).work.movable.status, 'doing');
});


// fsm-wontfix-terminal-status D1/D3: move --to wontfix is legal from each
// of its 3 entry statuses (blocked/todo/doing) through the existing
// generic move verb — no dedicated CLI verb needed.
for (const from of ['blocked', 'todo', 'doing']) {
  test(`move applies ${from} -> wontfix through the generic verb, exit 0`, () => {
    const cwd = tmpCwd();
    addOk(cwd, `wontfix-from-${from}`);
    if (from !== 'todo') run(cwd, ['move', `wontfix-from-${from}`, '--to', from]);
    const result = run(cwd, ['move', `wontfix-from-${from}`, '--to', 'wontfix', '--reason', 'superseded']);
    assert.equal(result.status, 0);
    assert.equal(stateView(cwd).work[`wontfix-from-${from}`].status, 'wontfix');
  });
}

test('move rejects an illegal transition as precondition, exit 2, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'stuck-todo');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'stuck-todo', '--to', 'done']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
});


test('move rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cas-item');
  run(cwd, ['move', 'cas-item', '--to', 'doing']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cas-item', '--to', 'done', '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-item'].status, 'doing');
});


test('move on a nonexistent id is rejected as validation (not-found), exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['move', 'never-added', '--to', 'doing']);
  assert.equal(result.status, 4);
});


for (const [label, badFlagArgs] of MOVE_BAD_FLAG_CASES) {
  test(`move with ${label} is rejected as validation, exit 4, no event written`, () => {
    const cwd = tmpCwd();
    addOk(cwd, 'move-bad-flag-item');
    const before = eventLines(cwd).length;
    const result = run(cwd, ['move', 'move-bad-flag-item', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
  });
}

test('move reports the real event seq in its envelope data, not undefined', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seq-check'); // event #1
  const result = run(cwd, ['move', 'seq-check', '--to', 'doing']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.seq, 2);
  assert.equal(data.id, 'seq-check');
  assert.equal(data.from, 'todo');
  assert.equal(data.to, 'doing');
});


// parent-flag-cli D1/D2: --parent on add/edit was a CLI gap — the field
// existed and was validated (work.mjs) and cycle-guarded (store.mjs) since
// record 0012, but no sanctioned CLI door could ever set it. `fgos-planning`
// SKILL.md step 5 assumed this door already existed.

test('add --parent sets lineage; omitting --parent leaves it unset', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-root').status, 0);

  const withParent = run(cwd, ['add', 'parent-child', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--parent', 'parent-root', '--description', 'tsk-535 fixture description.']);
  assert.equal(withParent.status, 0);
  assert.equal(stateView(cwd).work['parent-child'].parent, 'parent-root');

  assert.equal(addOk(cwd, 'parent-none').status, 0);
  assert.equal(stateView(cwd).work['parent-none'].parent, undefined);
});
