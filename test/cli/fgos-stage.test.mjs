// fgos-stage.test.mjs -- phần "discover, decompose, evolve, compound" của bộ test CLI, tách nguyên văn
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


// tsk-5iv D3 (round-3 review, MEDIUM): same STORE_MISSING_WARNING_VERBS gap
// again, found in `evolve` -- `rankCandidates` over an empty-store view
// silently returns `[]` instead of the real candidate list.
test('evolve from a .fgos/-less linked worktree with no --dir warns on stderr instead of a silent []', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['evolve']);
  assert.equal(result.status, 0, 'evolve is requiresExistingStore:false -- it warns, never refuses');
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.deepEqual(envelopeData(result.stdout), [], 'the empty-store rankCandidates result, never silently trusted as "no real candidates exist"');
});


// RETARGET (stage-decompose D2, cell 3): `discover` on a stage-`clarify`
// item still only runs `resolveDiscovery` (one hop) — a clear verdict now
// lands it on stage `decompose`, not `executing` directly, since chia-việc
// is the next stop before executing. This assertion changed its expected
// destination from `executing` to `decompose` for exactly that reason (per
// D2, an intentional contract change, not a test nerf).
test('discover on a clear verdict moves the submitted item to stage planning with the caller-supplied verify (tsk-30v D2/D6: clear skips exploring, discovery -> planning directly)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  // tsk-1x3 D1/D9/D16: the judge subprocess this test used to configure via
  // writeRunnerConfig is retired -- a session-role caller with nothing to
  // go on now refuses instead of guessing, so an explicit --verdict is the
  // only way left to reach a clear outcome.
  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- proven']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(envelope.data.outcome, 'clear');

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.stage, 'planning');
  assert.equal(item.verify, 'npm test -- proven');
});


// tsk-2b0 D1 (hard split, no fallback): `discover` and `decompose` are now
// two separate verbs, each bound to exactly one stage. The old combined
// "call discover twice" scenario is split below into its own `decompose`
// calls plus two new wrong-stage-error tests proving the split actually
// removed the old dynamic-dispatch fallback, not just renamed it.
test("plan on an item sitting at stage planning dispatches to resolvePlan and pass-throughs it on to executing (sync/async parity)", () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  advanceThroughDiscoveryToPlanning(cwd, id);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'planning');

  // A caller-supplied decompose verdict with a child missing `verify` is
  // not a valid shape — resolveCallerDecomposeVerdict folds it to
  // `invalid`, and resolveDecompose leaves the item exactly where it was
  // for the next call to retry (mẫu C9, unchanged since tsk-1x3).
  const invalidAttempt = run(cwd, ['plan', id, '--verdict', 'decompose', '--reason', 'x', '--children', '[{"title":"x"}]']);
  assert.equal(invalidAttempt.status, 0);
  assert.equal(JSON.parse(invalidAttempt.stdout).data.outcome, 'invalid');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'planning', 'invalid verdict leaves the item untouched, not silently advanced');

  // A real pass-through verdict carries the item the rest of the way.
  const passThrough = run(cwd, ['plan', id, '--verdict', 'pass-through', '--reason', 'single cohesive change']);
  assert.equal(passThrough.status, 0);
  assert.equal(JSON.parse(passThrough.stdout).data.outcome, 'pass-through');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'executing');
});


test('discover on a planning-stage item errors instead of silently dispatching to resolvePlan (tsk-2b0 D1: hard split, no fallback)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  advanceThroughDiscoveryToPlanning(cwd, id);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'planning');

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not "discovery"\/"exploring"/);
  assert.match(result.stderr, /fgos plan/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'planning', 'a rejected call must never mutate the item');
});


test('plan on a discovery-stage item errors instead of silently dispatching to resolveDiscovery (tsk-2b0 D1: hard split, no fallback)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery');

  const result = run(cwd, ['plan', id]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not "planning"/);
  assert.match(result.stderr, /fgos discover/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery', 'a rejected call must never mutate the item');
});


test('plan with no id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['plan']);
  assert.equal(result.status, 4);
});


test('discover on an unclear verdict parks the submitted item in awaiting-human with the question, and advances it to exploring (tsk-30v D2/D3: unclear no longer parks in place)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Do the ambiguous work']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: Which service?']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'exploring');
  assert.equal(view.gates[id].ask, '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: Which service?');
});


test('discover with no id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['discover']);
  assert.equal(result.status, 4);
});


// str76-runner-bootstrap-e3: a fresh cwd with no runner config used to
// crash `discover` with RunnerConfigError/ENOENT (the bug this feature
// fixes) — it now bootstraps the D1 default config instead, BEFORE
// resolveDiscovery is ever called (bin/fgos.mjs's own `discover` case reads
// `cfg` first). tsk-1x3 D1/D9/D16: the config bootstrap still happens
// unconditionally, but resolveDiscovery itself no longer spawns a judge
// against it for a bare (no --verdict) session-role call — it refuses
// loudly instead. PATH is still neutralized here to prove the bootstrap
// path is exercised the same way (no live agent invoked either way).
test('discover on a fresh cwd with no runner config bootstraps the default config into the shared file instead of crashing on ENOENT, then still refuses without --verdict (D16)', () => {
  const cwd = tmpCwd();
  const configPath = path.join(cwd, '.fgos', 'config.json');
  assert.equal(fs.existsSync(configPath), false);

  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing with no config yet']).stdout).data.id;

  const result = run(cwd, ['discover', id], { PATH: '/usr/bin:/bin' });
  assert.equal(result.status, 4, `expected the D16 refusal, not a RunnerConfigError/ENOENT crash: ${result.stderr}`);
  assert.match(result.stderr, /no committed CONTEXT.md and no --verdict was given/);

  assert.equal(fs.existsSync(configPath), true, 'discover should have auto-written the default runner section into .fgos/config.json BEFORE refusing');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'todo', 'the refused call must never mutate the item');
  assert.equal(view.work[id].stage, 'discovery');
});


test('discover --config pointing at a missing path still throws RunnerConfigError unchanged, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing with an explicit missing config']).stdout).data.id;
  const missingConfigPath = path.join(cwd, 'no-such-runner-config.json');

  const result = run(cwd, ['discover', id, '--config', missingConfigPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cannot read runner config/);
  assert.equal(fs.existsSync(missingConfigPath), false, 'an explicit --config path must never be auto-written');
});


// --- caller-supplied verdict (tsk-27y D1/D2): `--verdict` on `discover`/
// `decompose` lets a live caller skip the judge subprocess entirely for one
// call. Each test below configures the runner's fake executor with the
// OPPOSITE verdict from what `--verdict` supplies — proving the flag
// actually bypassed the judge, not just that a real judge happened to agree.

test('discover --verdict clear --verify moves the item to planning with that exact verify, bypassing the configured (opposite) judge verdict (tsk-30v D2/D6: clear skips exploring)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: false, question: 'SHOULD NEVER SURFACE' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- cli-caller']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'clear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].stage, 'planning');
  assert.equal(view.work[id].verify, 'npm test -- cli-caller');
  assert.notEqual(view.work[id].status, 'awaiting-human');
});


test('discover --verdict unclear --question parks in awaiting-human with that exact question and advances to exploring, bypassing the configured (opposite) judge verdict (tsk-30v D2/D3)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'SHOULD NEVER SURFACE' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: Which provider?']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'exploring');
  assert.equal(view.gates[id].ask, '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: Which provider?');
});


test('discover --verdict clear with no --verify is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  const result = run(cwd, ['discover', id, '--verdict', 'clear']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--verify/);
});


test('discover --verdict with an unrecognized value is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  const result = run(cwd, ['discover', id, '--verdict', 'maybe']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /"clear" or "unclear"/);
});


// --- caller-supplied classification (D12): `--tier`/`--kind`/`--risk` on
// `discover` give the interactive path the same data contract the headless
// worker already has through its `fgos-verdict` block, routed through the
// SAME guard (`classificationPatchFromVerdict`) rather than a second copy of
// it. Decided at discovery on real evidence, never guessed from submit text.

test('discover --verdict clear with --tier/--kind/--risk applies the classification to the item', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- classified', '--tier', 'heavy', '--kind', 'bug', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'clear');

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.kind, 'bug');
  assert.equal(item.risk, 'heavy');
  assert.equal(item.stage, 'planning');
});


test('discover applies only the classification fields actually passed, leaving the rest untouched', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  const before = envelopeData(run(cwd, ['list']).stdout).work[id];

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- partial', '--kind', 'docs']);
  assert.equal(result.status, 0);

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.kind, 'docs');
  assert.equal(item.tier, before.tier, 'an unpassed field is never rewritten');
  assert.equal(item.risk, before.risk, 'an unpassed field is never rewritten');
});


test('discover --verdict unclear never applies classification — the same guard the headless path uses', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  const before = envelopeData(run(cwd, ['list']).stdout).work[id];

  const result = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: Which provider?', '--tier', 'heavy', '--kind', 'bug', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, before.tier);
  assert.equal(item.kind, before.kind);
  assert.equal(item.risk, before.risk);
  assert.equal(item.status, 'awaiting-human');
});
