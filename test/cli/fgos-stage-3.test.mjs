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




// --- `fgos compound` (tsk-3o3, restored from fcfbae5/tsk-1zi's removal,
// adapted to gate on status `retrospective` instead of the retired
// `compound-learn` stage move) ------------------------------------------

test('compound on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['compound', 'ghost']);
  assert.equal(result.status, 4);
});


test('compound on an item not at status retrospective is rejected as validation, exit 4, no events written', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'compound-wrong-status');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['compound', 'compound-wrong-status', '--doc-type', 'how-to']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected compound writes zero events');
  assert.equal(stateView(cwd).work['compound-wrong-status'].status, 'todo');
});


test('compound with an invalid --doc-type is rejected as validation, exit 4, before any write', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'compound-bad-doctype');
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'delivered']);
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-bad-doctype', '--doc-type', 'not-a-real-quadrant']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected --doc-type writes zero events');
});


test('compound with no --doc-type is a no-op: exit 0, docType null, no events written', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'compound-noop');
  run(cwd, ['move', 'compound-noop', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
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
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'compound-tag-only');
  run(cwd, ['move', 'compound-tag-only', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
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
// git-based and has nothing to observe in a non-git `tmpCwdFromTemplate()`.

test('compound with --doc-type and --doc-path tags both when the file is committed at HEAD, surfaced by `show`', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-tag-path');
  run(cwd, ['move', 'compound-tag-path', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
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
  run(cwd, ['move', 'compound-doc-absent', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
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
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
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
  run(cwd, ['move', 'compound-doc-staged', '--to', 'blocked']); // tsk-40m: blocked stands in for the retired todo->doing edge
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
