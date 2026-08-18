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
  const result = run(cwd, ['move', 'reason-ignored-item', '--to', 'doing', '--reason', 'not a rejection']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, undefined);
});

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

// claim-lock §5.1 (intentional contract change from the test above): asking
// a "doing" item now resumes it to "doing", not a claimless "todo" — the
// exact bug the design fixes ("fgos ask/answer mid-claim silently dropped
// the claim"). The item never re-enters the ready set (still `doing`, not
// `todo`), unlike the todo-item round-trip above.
test('ask/answer round-trip on a doing item: answer resumes to doing, preserving the held claim (claim-lock §5.1)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gated-doing-item');
  assert.equal(run(cwd, ['move', 'gated-doing-item', '--to', 'doing']).status, 0);

  const askResult = run(cwd, ['ask', 'gated-doing-item', '--text', VALID_ASK_TEXT]);
  assert.equal(askResult.status, 0);
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-doing-item', from: 'doing', to: 'awaiting-human', seq: 3 });
  assert.equal(stateView(cwd).work['gated-doing-item'].status, 'awaiting-human');

  const readyWhileAwaiting = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyWhileAwaiting.some((i) => i.id === 'gated-doing-item'));

  const answerResult = run(cwd, ['answer', 'gated-doing-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-doing-item', from: 'awaiting-human', to: 'doing', seq: 4 });
  assert.equal(stateView(cwd).work['gated-doing-item'].status, 'doing');

  // Never resurfaces as ready — it resumed to "doing", not "todo".
  const readyAfterAnswer = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyAfterAnswer.some((i) => i.id === 'gated-doing-item'));
});

test('ask without --text is rejected as validation, exit 4, no event written, item stays in its prior status', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-text-ask');
  run(cwd, ['move', 'no-text-ask', '--to', 'doing']);
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
  run(cwd, ['move', 'cas-ask-item', '--to', 'doing']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['ask', 'cas-ask-item', '--text', VALID_ASK_TEXT, '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-ask-item'].status, 'doing');
});

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
