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
  tmpCwdFromTemplate,
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
  const cwd = tmpCwdFromTemplate();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- bad-kind', '--kind', 'bogus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /work\.kind must be one of/);

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.stage, 'discovery', 'a rejected classification must never leave the item half-advanced');
  assert.notEqual(item.kind, 'bogus');
});


test('discover with an out-of-vocabulary --tier is rejected as validation (exit 4) before the item moves at all', () => {
  const cwd = tmpCwdFromTemplate();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- bad-tier', '--tier', 'enormous']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /work\.tier must be one of/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery');
});


test('discover with a bare --risk (no value) is rejected as validation, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- bare-risk', '--risk']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--risk/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'discovery');
});


test.todo('plan --verdict pass-through moves the item to executing - migrated to test/direct/fgos-stage.test.mjs');

test.todo('plan --verdict need-human --reason parks in awaiting-human with that exact reason - migrated to test/direct/fgos-stage.test.mjs');

test.todo('plan --verdict decompose --children writes real children - migrated to test/direct/fgos-stage.test.mjs');



test('plan --verdict decompose with malformed --children JSON is rejected as validation, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
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


test.todo('discover (sync verb) on a clear verdict stamps role "session" on the work.stage event and folds into a clarify-pass settlement - migrated to test/direct/fgos-stage.test.mjs');



