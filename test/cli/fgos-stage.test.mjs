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

test('discover with an out-of-vocabulary --kind is rejected as validation (exit 4) before the item moves at all', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- bad-kind', '--kind', 'bogus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /work\.kind must be one of/);

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.stage, 'discovery', 'a rejected classification must never leave the item half-advanced');
  assert.notEqual(item.kind, 'bogus');
});

test('discover with an out-of-vocabulary --tier is rejected as validation (exit 4) before the item moves at all', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- bad-tier', '--tier', 'enormous']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /work\.tier must be one of/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery');
});

test('discover with a bare --risk (no value) is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- bare-risk', '--risk']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--risk/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery');
});

test('plan --verdict pass-through moves the item to executing', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  advanceThroughDiscoveryToPlanning(cwd, id);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'planning');

  const result = run(cwd, ['plan', id, '--verdict', 'pass-through', '--reason', 'single-piece, no split needed']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'pass-through');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].stage, 'executing');
  assert.equal(Object.values(view.work).some((item) => item.parent === id), false);
});

test('plan --verdict need-human --reason parks in awaiting-human with that exact reason', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  advanceThroughDiscoveryToPlanning(cwd, id);

  const result = run(cwd, ['plan', id, '--verdict', 'need-human', '--reason', 'Which auth provider?']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'need-human');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.match(view.gates[id].ask, /Which auth provider\?/);
});

test('plan --verdict decompose --children writes real children', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  advanceThroughDiscoveryToPlanning(cwd, id);

  const children = JSON.stringify([
    { title: 'Build parser', verify: 'npm test -- parser', action: 'tsk-3xd fixture: implement the parser.' },
    { title: 'Build renderer', verify: 'npm test -- renderer', action: 'tsk-3xd fixture: implement the renderer.' },
  ]);
  const result = run(cwd, ['plan', id, '--verdict', 'decompose', '--reason', 'two independent surfaces', '--children', children]);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'decompose');

  // tsk-4fg D1/D2: default `list` now hides a child whose parent is still
  // visible, replacing it with a `childProgress` badge on the parent --
  // `--all` is the untouched, byte-identical-shape view where split
  // children stay visible, so that is what proves the real children were
  // written with the right ids/titles.
  const defaultView = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(defaultView.work[id].stage, 'executing');
  assert.equal(defaultView.work[`${id}-1`], undefined);
  assert.equal(defaultView.work[`${id}-2`], undefined);
  assert.deepEqual(defaultView.work[id].childProgress, { done: 0, total: 2 });

  const allView = envelopeData(run(cwd, ['list', '--all']).stdout);
  assert.equal(allView.work[`${id}-1`].title, 'Build parser');
  assert.equal(allView.work[`${id}-2`].title, 'Build renderer');
});

test('plan --verdict decompose with malformed --children JSON is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // tsk-5q5-1: a clear caller-supplied verdict with a real `verify` still
  // triggers judgeVerifySemanticCorrectness's own second-pass call, same as
  // a model verdict (D3 — gates apply regardless of verdict origin) — this
  // config answers that prompt, not the (bypassed) first-pass judgeDiscovery.
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  advanceThroughDiscoveryToPlanning(cwd, id, 'npm test');

  const result = run(cwd, ['plan', id, '--verdict', 'decompose', '--reason', 'x', '--children', '{not valid json']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--children/);
});

test('plan --verdict decompose with no --children at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // tsk-5q5-1: a clear caller-supplied verdict with a real `verify` still
  // triggers judgeVerifySemanticCorrectness's own second-pass call, same as
  // a model verdict (D3 — gates apply regardless of verdict origin) — this
  // config answers that prompt, not the (bypassed) first-pass judgeDiscovery.
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  advanceThroughDiscoveryToPlanning(cwd, id, 'npm test');

  const result = run(cwd, ['plan', id, '--verdict', 'decompose', '--reason', 'x']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--children/);
});

test('plan --verdict with an unrecognized value is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // tsk-5q5-1: a clear caller-supplied verdict with a real `verify` still
  // triggers judgeVerifySemanticCorrectness's own second-pass call, same as
  // a model verdict (D3 — gates apply regardless of verdict origin) — this
  // config answers that prompt, not the (bypassed) first-pass judgeDiscovery.
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  advanceThroughDiscoveryToPlanning(cwd, id, 'npm test');

  const result = run(cwd, ['plan', id, '--verdict', 'maybe']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /"pass-through", "need-human", or "decompose"/);
});

test('discover (sync verb) on a clear verdict stamps role "session" on the work.stage event and folds into a clarify-pass settlement', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- proven']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const stageEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.stage');
  assert.equal(stageEvent.payload.role, 'session');

  const view = stateView(cwd);
  assert.equal(view.settlements[id].length, 1);
  assert.equal(view.settlements[id][0].kind, 'clarify-pass');
  assert.equal(view.settlements[id][0].role, 'session');
});

// --- `fgos evolve` (self-improve-loop P13 Slice 1, Gate A) -----------------
//
// Request-class per D1 (same contract as `ready`/`list`/`check`): a pure
// read over `listWork(dir)`, ranked by `src/evolve/candidates.mjs`. Two-shot
// per D11 — `evolve` lists, `evolve --pick <id>` reprints one candidate's
// friction record — never an interactive stdin loop, never a re-prompt on a
// bad id. Friction is seeded directly through store.mjs's addFriction (the
// same single write door the runner uses in production), same discipline as
// the friction-section tests for `check` above.

test('evolve with zero open friction returns an empty candidate list and exits 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'clean-item');
  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
});

test('evolve on a directory with no log at all returns an empty candidate list, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('evolve with candidates returns the ranked list with every field id/disposition/errorClass/layer/detail/attempts/score', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'rank-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'rank-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });

  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.length, 1);
  assert.equal(data[0].id, 'rank-item');
  assert.equal(data[0].score, 2);
  assert.equal(data[0].disposition, 'blocked');
  assert.equal(data[0].errorClass, 'verify-miss');
  assert.equal(data[0].layer, 'verification');
  assert.equal(data[0].attempts, 2);
  assert.equal(data[0].detail, 'goal-check failed (exit 1)');
});

test('evolve with a candidate missing disposition/errorClass/layer/attempts carries those fields as null/undefined, never the literal string "null"', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'sparse-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'sparse-item' });

  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /"disposition":"null"|"errorClass":"null"|"layer":"null"|"attempts":"null"/);
});

test('evolve --pick <valid-id> returns that candidate\'s full friction record, no state change', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'pick-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'pick-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });

  const result = run(cwd, ['evolve', '--pick', 'pick-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 1);
  assert.equal(data.recent[0].id, 'pick-item');
  assert.equal(data.recent[0].disposition, 'blocked');
  assert.equal(data.recent[0].errorClass, 'verify-miss');
  assert.equal(data.recent[0].layer, 'verification');
});

test('evolve --pick <invalid-id> prints a clean error and exits non-zero, with no state change', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'exists-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'exists-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const result = run(cwd, ['evolve', '--pick', 'nonexistent-id']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not an open candidate/);

  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by an invalid --pick');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by an invalid --pick');
});

test('evolve --pick with a bare flag (no value) is refused as validation, not a re-prompt', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-pick-item');
  const result = run(cwd, ['evolve', '--pick']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /evolve --pick requires a non-empty candidate id/);
});

test('evolve never touches git (no branch/worktree operation) — succeeds on a directory that is not even a git repo', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-git-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'no-git-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });
  assert.equal(fs.existsSync(path.join(cwd, '.git')), false);

  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  const pickResult = run(cwd, ['evolve', '--pick', 'no-git-item']);
  assert.equal(pickResult.status, 0);
});

// --- `fgos evolve --submit <id>` (self-improve-loop P13 Slice 3, D15) ------
//
// The only mutating action on the whole evolve/Gate A surface: bridges a
// ranked friction candidate into a real work item through the same
// submitWork door `submit` uses. `evolve` (no flag) and `evolve --pick` stay
// exactly as shipped in Slice 1 (asserted below too, not just by the golden
// test above).

test("evolve --submit <id> with a matching candidate creates exactly one new work item via submitWork, described from the candidate's fields", () => {
  const cwd = tmpCwd();
  addOk(cwd, 'submit-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'submit-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });

  const before = eventLines(cwd).length;
  const result = run(cwd, ['evolve', '--submit', 'submit-item']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  const item = envelope.data;
  assert.equal(item.status, 'todo');
  assert.equal(item.stage, 'discovery');
  assert.match(item.description, /Self-improve candidate submit-item/);
  assert.match(item.description, /blocked/);
  assert.match(item.description, /verify-miss/);
  assert.match(item.description, /layer verification/);
  assert.match(item.description, /2 attempt\(s\)/);
  assert.match(item.description, /goal-check failed \(exit 1\)/);

  assert.equal(eventLines(cwd).length, before + 1, 'evolve --submit appends exactly one new event');
  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.ok(view.work[item.id], 'the new work item persisted');
  assert.equal(view.work['submit-item'].status, 'todo', 'the candidate\'s own item is untouched');
});

test('evolve --submit <id> with no matching candidate creates no work item, prints a clean error, exits non-zero', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'exists-item-2');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'exists-item-2', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  const before = eventLines(cwd).length;
  const result = run(cwd, ['evolve', '--submit', 'nonexistent-id']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not an open candidate/);
  assert.equal(eventLines(cwd).length, before, 'no event appended on an invalid --submit id');
});

test('evolve --submit with a bare flag (no value) is refused as validation, not a re-prompt', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-submit-item');
  const result = run(cwd, ['evolve', '--submit']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /evolve --submit requires a non-empty candidate id/);
});

test('evolve --submit composes its description gracefully around missing candidate fields, never printing the literal "undefined"', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'sparse-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'sparse-item', disposition: 'blocked', attempts: 1 });

  const result = run(cwd, ['evolve', '--submit', 'sparse-item']);
  assert.equal(result.status, 0);
  const description = JSON.parse(result.stdout).data.description;
  assert.doesNotMatch(description, /undefined/);
  assert.match(description, /Self-improve candidate sparse-item/);
  assert.match(description, /blocked/);
  assert.match(description, /1 attempt\(s\)/);
});

test('evolve (no flag) and evolve --pick remain unaffected by the new --submit path: same output, no event appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unaffected-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'unaffected-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });

  const before = eventLines(cwd).length;
  const list = run(cwd, ['evolve']);
  assert.equal(list.status, 0);
  const listData = envelopeData(list.stdout);
  assert.equal(listData[0].id, 'unaffected-item');
  assert.equal(listData[0].score, 2);
  assert.equal(listData[0].disposition, 'blocked');

  const pick = run(cwd, ['evolve', '--pick', 'unaffected-item']);
  assert.equal(pick.status, 0);
  assert.equal(envelopeData(pick.stdout).count, 1);

  assert.equal(eventLines(cwd).length, before, 'evolve and evolve --pick still append no events');
});

// --- `fgos compound` (tsk-3o3, restored from fcfbae5/tsk-1zi's removal,
// adapted to gate on status `retrospective` instead of the retired
// `compound-learn` stage move) ------------------------------------------

test('compound on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['compound', 'ghost']);
  assert.equal(result.status, 4);
});

test('compound on an item not at status retrospective is rejected as validation, exit 4, no events written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-wrong-status');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['compound', 'compound-wrong-status', '--doc-type', 'how-to']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected compound writes zero events');
  assert.equal(stateView(cwd).work['compound-wrong-status'].status, 'todo');
});

test('compound with an invalid --doc-type is rejected as validation, exit 4, before any write', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-bad-doctype');
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'doing']);
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'delivered']);
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-bad-doctype', '--doc-type', 'not-a-real-quadrant']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected --doc-type writes zero events');
});

test('compound with no --doc-type is a no-op: exit 0, docType null, no events written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-noop');
  run(cwd, ['move', 'compound-noop', '--to', 'doing']);
  run(cwd, ['move', 'compound-noop', '--to', 'delivered']);
  run(cwd, ['move', 'compound-noop', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-noop']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data, { id: 'compound-noop', docType: null, docPath: null, status: 'retrospective' });
  assert.equal(eventLines(cwd).length, before, 'an omitted --doc-type writes zero events');
});

test('compound with --doc-type tags the outcome, surfaced by `show`; item stays at status retrospective (no stage/status move)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-tag-only');
  run(cwd, ['move', 'compound-tag-only', '--to', 'doing']);
  run(cwd, ['move', 'compound-tag-only', '--to', 'delivered']);
  run(cwd, ['move', 'compound-tag-only', '--to', 'retrospective']);

  const result = run(cwd, ['compound', 'compound-tag-only', '--doc-type', 'how-to']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.docType, 'how-to');
  assert.equal(data.docPath, null);

  assert.equal(stateView(cwd).work['compound-tag-only'].status, 'retrospective', 'compound never moves status — that stays the retro-loop\'s own job');

  const showResult = run(cwd, ['show', 'compound-tag-only']);
  assert.equal(showResult.status, 0, showResult.stderr);
  assert.equal(envelopeData(showResult.stdout).outcome.docType, 'how-to');
});

// retrospective-doc-write-path D3: `--doc-path` is only ever accepted for a
// document already committed at the main checkout's HEAD — the invariant
// that makes "a tag exists but its document never landed" (34 real
// documents, 2026-08-05) impossible to reproduce rather than detected
// later. These four tests are git-backed (`initGitCwdMain()`), unlike the
// rest of this suite's `compound` tests, because the check itself is
// git-based and has nothing to observe in a non-git `tmpCwd()`.

test('compound with --doc-type and --doc-path tags both when the file is committed at HEAD, surfaced by `show`', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-tag-path');
  run(cwd, ['move', 'compound-tag-path', '--to', 'doing']);
  run(cwd, ['move', 'compound-tag-path', '--to', 'delivered']);
  run(cwd, ['move', 'compound-tag-path', '--to', 'retrospective']);
  fs.mkdirSync(path.join(cwd, 'docs', 'explanation'), { recursive: true });
  commitFile(cwd, path.join('docs', 'explanation', 'example.md'), '# Example\n');

  const result = run(cwd, ['compound', 'compound-tag-path', '--doc-type', 'explanation', '--doc-path', 'docs/explanation/example.md']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.docType, 'explanation');
  assert.equal(data.docPath, 'docs/explanation/example.md');

  const showResult = run(cwd, ['show', 'compound-tag-path']);
  const outcome = envelopeData(showResult.stdout).outcome;
  assert.equal(outcome.docType, 'explanation');
  assert.equal(outcome.docPath, 'docs/explanation/example.md');
});

test('compound --doc-path is rejected as validation, exit 4, when the file does not exist at all', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-doc-absent');
  run(cwd, ['move', 'compound-doc-absent', '--to', 'doing']);
  run(cwd, ['move', 'compound-doc-absent', '--to', 'delivered']);
  run(cwd, ['move', 'compound-doc-absent', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-doc-absent', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/never-written.md']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not committed at the main checkout's HEAD/);
  assert.equal(eventLines(cwd).length, before, 'a rejected --doc-path writes zero events — no tag for a document that was never written');
});

test('compound --doc-path is rejected as validation, exit 4, when the file exists but is untracked', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-doc-untracked');
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'doing']);
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'delivered']);
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'retrospective']);
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'untracked.md'), '# Untracked\n');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-doc-untracked', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/untracked.md']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not committed at the main checkout's HEAD/);
  assert.equal(eventLines(cwd).length, before, 'present-but-untracked must reject exactly like absent — this is the exact gap that let 34 real documents go missing');
});

test('compound --doc-path is rejected as validation, exit 4, when the file exists and is staged but not committed', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-doc-staged');
  run(cwd, ['move', 'compound-doc-staged', '--to', 'doing']);
  run(cwd, ['move', 'compound-doc-staged', '--to', 'delivered']);
  run(cwd, ['move', 'compound-doc-staged', '--to', 'retrospective']);
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'staged-only.md'), '# Staged only\n');
  execFileSync('git', ['add', 'docs/how-to/staged-only.md'], { cwd });
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-doc-staged', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/staged-only.md']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not committed at the main checkout's HEAD/);
  assert.equal(eventLines(cwd).length, before, 'staged-but-uncommitted must reject exactly like absent — an index entry is not HEAD');
});
