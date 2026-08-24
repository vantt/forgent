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
