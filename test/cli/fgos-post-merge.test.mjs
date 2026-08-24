// fgos-post-merge.test.mjs -- phần "catchup, cleanup, retrospective, docs-index, doc-sources" của bộ test CLI, tách nguyên văn
// từ test/cli/fgos.test.mjs (tsk-3um). Nội dung test không đổi, chỉ chỗ ở đổi.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
import { resolveWriterIdentity } from '../../src/util/session-identity.mjs';
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


test('a state verb given --dir succeeds from a .fgos/-less worktree cwd, against the real store at --dir', () => {
  const { main, wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const before = eventLines(main).length;
  const result = run(wt, ['submit', 'reached via --dir', '--dir', main]);
  assert.equal(result.status, 0, `submit --dir unexpectedly failed: ${result.stderr}`);
  assert.equal(eventLines(main).length, before + 1, '--dir must write into the given root, not the worktree cwd');
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')), '--dir must never create a .fgos/ at the worktree cwd itself');
});


test('the same state verb with no --dir, from the same .fgos/-less worktree cwd, still refuses exactly as before (tsk-4fu-2 regression guard)', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['submit', 'should never land']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
});


test('doc-sources from a .fgos/-less linked worktree with no --dir warns on stderr instead of a silent count: 0', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['doc-sources', 'docs/some-doc.md']);
  assert.equal(result.status, 0, 'doc-sources is requiresExistingStore:false -- it warns, never refuses');
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.deepEqual(envelopeData(result.stdout), { docPath: 'docs/some-doc.md', count: 0, captures: [] });
});


// tsk-5iv D3: docs-index was investigated for the same fix and found NOT
// to belong in STORE_MISSING_WARNING_VERBS -- its docPath/title entries
// come from a real docs/ scan under repoRoot, correct regardless of
// .fgos/ presence, so a "may be empty" warning would be actively
// misleading. Pins that this stays true: same docs/ content, same
// worktree-vs-main answer.
test('docs-index from a .fgos/-less linked worktree with no --dir gives the SAME real answer as from the main checkout, no warning (D3: correctly excluded)', () => {
  const { main, wt } = tmpLinkedWorktree();
  fs.mkdirSync(path.join(main, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(main, 'docs', 'how-to', 'example.md'), '# Example\n\nbody\n');
  execFileSync('git', ['add', '-A'], { cwd: main });
  execFileSync('git', ['commit', '-q', '-m', 'add doc'], { cwd: main });

  const mainResult = run(main, ['docs-index']);
  assert.equal(mainResult.status, 0);
  assert.equal(mainResult.stderr, '', 'main checkout run must never warn');

  const wtResult = run(wt, ['docs-index']);
  assert.equal(wtResult.status, 0, 'docs-index is requiresExistingStore:false -- it never refuses');
  assert.equal(wtResult.stderr, '', 'docs-index must never warn -- unlike gate-bypass/evolve, its answer is not distorted by a missing .fgos/');
  assert.equal(
    envelopeData(wtResult.stdout).length,
    envelopeData(mainResult.stdout).length,
    'the worktree and the main checkout must see the exact same doc count -- docs-index reads docs/ from disk, not from the store',
  );
});


test('--dir with no value (a bare trailing flag) is a clean validation error, exit 4, not a crash', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['submit', 'title', '--dir']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--dir requires a non-empty path value/);
});


test('--dir pointed at a path with no .fgos/ at all gives the same clean refusal as omitting it, not a crash', () => {
  const { wt } = tmpLinkedWorktree();
  const garbage = rawTmpCwd();
  const result = run(wt, ['submit', 'title', '--dir', garbage]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
});


test('--dir pointed at the main checkout itself (from main\'s own cwd) is a no-op, identical to omitting it', () => {
  const main = tmpCwd();
  const before = eventLines(main).length;
  const result = run(main, ['submit', 'reached with redundant --dir', '--dir', main]);
  assert.equal(result.status, 0);
  assert.equal(eventLines(main).length, before + 1);
});


test('docs-index run from a .fgos/-less worktree cwd with --dir writes the shared manifest at the real root, not the worktree cwd (tsk-1wn D1)', () => {
  const { main, wt } = tmpLinkedWorktree();
  fs.mkdirSync(path.join(main, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(main, 'docs', 'how-to', 'sample.md'), '# Sample Doc\n');

  const result = run(wt, ['docs-index', '--dir', main]);
  assert.equal(result.status, 0, `docs-index --dir unexpectedly failed: ${result.stderr}`);

  const data = envelopeData(result.stdout);
  assert.equal(data.count, 1);
  assert.equal(data.entries[0].docPath, 'docs/how-to/sample.md');
  assert.ok(fs.existsSync(docsIndexManifestPath(main)), 'manifest must land at the real main-checkout root');
  assert.ok(!fs.existsSync(docsIndexManifestPath(wt)), 'docs-index must never write into the worktree cwd\'s own docs/ tree');
});


test('docs-index re-run with no doc changes does not rewrite the manifest file (tsk-1wn D3 write-only-if-changed guard)', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'sample.md'), '# Sample Doc\n');

  assert.equal(run(cwd, ['docs-index']).status, 0);
  const mtimeAfterFirst = fs.statSync(docsIndexManifestPath(cwd)).mtimeMs;

  assert.equal(run(cwd, ['docs-index']).status, 0);
  const mtimeAfterSecond = fs.statSync(docsIndexManifestPath(cwd)).mtimeMs;

  assert.equal(mtimeAfterSecond, mtimeAfterFirst, 'unchanged doc content must skip the write, not touch the file');
});


test('docs-index re-run after a real doc change DOES rewrite the manifest (tsk-1wn D3 guard does not mask real updates)', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'sample.md'), '# Sample Doc\n');
  assert.equal(run(cwd, ['docs-index']).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(docsIndexManifestPath(cwd), 'utf8')).length, 1);

  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'second.md'), '# Second Doc\n');
  assert.equal(run(cwd, ['docs-index']).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(docsIndexManifestPath(cwd), 'utf8')).length, 2, 'a real doc addition must still update the manifest');
});


test('docs-index manifest entries come out in deterministic order regardless of directory-read order (tsk-1wn D3 sort)', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  // Written deliberately out of alphabetical order.
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'b-doc.md'), '# B Doc\n');
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'a-doc.md'), '# A Doc\n');

  const result = run(cwd, ['docs-index']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const paths = data.entries.filter((e) => e.quadrant === 'how-to').map((e) => e.docPath);
  assert.deepEqual(paths, ['docs/how-to/a-doc.md', 'docs/how-to/b-doc.md']);
});


test('two sequential edits both land — the second patch does not undo the first', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-twice');
  run(cwd, ['edit', 'edit-twice', '--risk', 'heavy']);
  const result = run(cwd, ['edit', 'edit-twice', '--verify', 'npm run check']);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['edit-twice'];
  assert.equal(item.risk, 'heavy');
  assert.equal(item.verify, 'npm run check');
});


test('a pre-existing event log with no work.edit events replays byte-identical', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-edit-here');
  const before = stateView(cwd);
  run(cwd, ['rebuild']);
  assert.deepEqual(stateView(cwd), before);
});


test('done is terminal via the real CLI: moving out of done is refused as precondition, exit 2, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'terminal-item');
  toDoneViaChain(cwd, 'terminal-item');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['move', 'terminal-item', '--to', 'doing']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['terminal-item'].status, 'done');
});

test('cleanup (to blocked branch) releases main-checkout lock held by caller session (tsk-5zv)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-lock-blocked');
  run(cwd, ['move', 'cleanup-lock-blocked', '--to', 'doing']);
  run(cwd, ['move', 'cleanup-lock-blocked', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-lock-blocked', '--to', 'retrospective']);
  run(cwd, ['move', 'cleanup-lock-blocked', '--to', 'cleanup']);

  const dir = path.join(cwd, '.fgos');
  const lockPath = mainCheckoutLockPath(cwd);
  const writerId = resolveWriterIdentity(dir).id;
  fs.writeFileSync(lockPath, JSON.stringify({ pid: writerId, ts: Date.now() }));
  assert.equal(fs.existsSync(lockPath), true);

  const result = run(cwd, ['cleanup', 'cleanup-lock-blocked']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  assert.equal(fs.existsSync(lockPath), false, 'cleanup -> blocked must release the session lock early');
});

test('cleanup (to done branch) releases main-checkout lock held by caller session (tsk-5zv)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedItem(cwd, 'cleanup-lock-done', { verify: 'test -f cleanup-lock-done-produced.txt' });
  commitPendingBeforeApprove(cwd, 'cleanup-lock-done');

  const approve = run(cwd, ['approve', 'cleanup-lock-done']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);

  run(cwd, ['move', 'cleanup-lock-done', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-lock-done.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-lock-done', docType: 'how-to', docPath: 'docs/how-to/cleanup-lock-done.md' });
  run(cwd, ['move', 'cleanup-lock-done', '--to', 'cleanup']);

  const lockPath = mainCheckoutLockPath(cwd);
  const writerId = resolveWriterIdentity(dir).id;
  fs.writeFileSync(lockPath, JSON.stringify({ pid: writerId, ts: Date.now() }));
  assert.equal(fs.existsSync(lockPath), true);

  const result = run(cwd, ['cleanup', 'cleanup-lock-done']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'done');
  assert.equal(fs.existsSync(lockPath), false, 'cleanup -> done must release the session lock early');
});

test('compound releases main-checkout lock held by caller session (tsk-5zv)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'compound-lock-item');
  run(cwd, ['move', 'compound-lock-item', '--to', 'doing']);
  run(cwd, ['move', 'compound-lock-item', '--to', 'delivered']);
  run(cwd, ['move', 'compound-lock-item', '--to', 'retrospective']);

  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'compound-lock-item.md'), '# doc\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'add doc']);

  const dir = path.join(cwd, '.fgos');
  const lockPath = mainCheckoutLockPath(cwd);
  const writerId = resolveWriterIdentity(dir).id;
  fs.writeFileSync(lockPath, JSON.stringify({ pid: writerId, ts: Date.now() }));
  assert.equal(fs.existsSync(lockPath), true);

  const result = run(cwd, ['compound', 'compound-lock-item', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/compound-lock-item.md']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(lockPath), false, 'compound must release the session lock early after addOutcome');
});


