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

test('a mutation (add) attempted on an already-corrupt log is refused as corrupt-log, exit 5, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-corruption');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['add', 'after-corruption', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 5);
  assert.equal(eventLines(cwd).length, before);
});

test('a mutation (move) attempted on an already-corrupt log is refused as corrupt-log, exit 5, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'move-target');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['move', 'move-target', '--to', 'doing']);
  assert.equal(result.status, 5);
  assert.equal(eventLines(cwd).length, before);
});

test('a dependency cycle is impossible to construct: add requires deps to already exist, so both sides of an attempted cycle are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // "a" depends on "b", but "b" does not exist yet — validation, exit 4.
  const firstAttempt = run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--deps', 'b', '--description', 'tsk-535 fixture description.']);
  assert.equal(firstAttempt.status, 4);
  assert.equal(eventLines(cwd).length, 0);

  // "b" depends on "a", but "a" was never added (the attempt above failed
  // before writing anything) — so this is also validation, exit 4. There is
  // no sequence of `add` calls that can ever produce a cycle, because a dep
  // must reference an id that already exists at add-time.
  const secondAttempt = run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--deps', 'a', '--description', 'tsk-535 fixture description.']);
  assert.equal(secondAttempt.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

test('a corrupt trailing line in the event log is reported as corrupt-log, exit 5', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-corruption');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');

  const result = run(cwd, ['list']);
  assert.equal(result.status, 5);
});

test('an unknown verb is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  // O1: the error path never prints a fgos.v1 envelope on stdout — diagnostics
  // go to stderr only, so a consumer can trust "stdout parses" as "success".
  assert.equal(result.stdout, '', 'a failing verb prints no stdout envelope');
  assert.throws(() => JSON.parse(result.stdout), 'stdout is not parseable JSON on the error path');
});

test('GOLDEN request-class: running ready twice never appends to events.jsonl, and the view file is untouched too', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'golden-a');
  addOk(cwd, 'golden-b');
  run(cwd, ['move', 'golden-b', '--to', 'doing']);

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewExistedBefore = fs.existsSync(viewPath(cwd));
  const viewBefore = viewExistedBefore ? fs.readFileSync(viewPath(cwd), 'utf8') : null;

  const first = run(cwd, ['ready']);
  assert.equal(first.status, 0);
  const second = run(cwd, ['ready']);
  assert.equal(second.status, 0);
  // generated_at legitimately differs between the two envelopes (each is
  // stamped at call time) — the golden byte-identical claim belongs to the
  // underlying data, not the envelope wrapper.
  assert.deepEqual(envelopeData(first.stdout), envelopeData(second.stdout));

  const logAfter = fs.readFileSync(logPath(cwd), 'utf8');
  assert.equal(logAfter, logBefore, 'events.jsonl must be byte-identical before/after ready x2');

  const viewAfter = fs.existsSync(viewPath(cwd)) ? fs.readFileSync(viewPath(cwd), 'utf8') : null;
  assert.equal(viewAfter, viewBefore, 'state.json must be untouched by ready (read never writes the view)');
});

// --- `fgos doc-sources <docPath>` (Slice ① gộp-sống, CONTEXT.md D13/D17):
// read-only gather of EVERY compound-learn capture linked to a docPath, not
// just the first (findSourceCaptureIds's plural gather, closing the D13
// no-loss gap `findSourceCaptureId`'s first-match leaves).

test('doc-sources returns every capture linked to a docPath (multiplicity)', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  toProposed(cwd, 'doc-sources-a');
  addOutcome(dir, { id: 'doc-sources-a', docType: 'how-to', docPath: 'docs/how-to/shared.md' });
  toProposed(cwd, 'doc-sources-b');
  addOutcome(dir, { id: 'doc-sources-b', docType: 'how-to', docPath: 'docs/how-to/shared.md' });
  // A third item linked to a DIFFERENT docPath must never leak into the result.
  toProposed(cwd, 'doc-sources-other');
  addOutcome(dir, { id: 'doc-sources-other', docType: 'how-to', docPath: 'docs/how-to/other.md' });

  const result = run(cwd, ['doc-sources', 'docs/how-to/shared.md']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.docPath, 'docs/how-to/shared.md');
  assert.equal(data.count, 2);
  assert.deepEqual(
    data.captures.map((c) => c.id).sort(),
    ['doc-sources-a', 'doc-sources-b'],
  );
  for (const capture of data.captures) {
    assert.equal(capture.docPath, 'docs/how-to/shared.md');
    assert.equal(capture.docType, 'how-to');
    assert.ok('predicted' in capture && 'actual' in capture, 'capture must carry the same check-content shape as `fgos check`');
  }
});

test('doc-sources on a docPath with zero linked captures is SUCCESS (exit 0), reporting none — not an error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['doc-sources', 'docs/how-to/never-linked.md']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.docPath, 'docs/how-to/never-linked.md');
  assert.equal(data.count, 0);
  assert.deepEqual(data.captures, []);
});

test('doc-sources never mutates state: events.jsonl and state.json are byte-identical before/after', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  toProposed(cwd, 'doc-sources-readonly');
  addOutcome(dir, { id: 'doc-sources-readonly', docType: 'how-to', docPath: 'docs/how-to/readonly.md' });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const result = run(cwd, ['doc-sources', 'docs/how-to/readonly.md']);
  assert.equal(result.status, 0);

  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by doc-sources');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by doc-sources');
});

test('doc-sources requires a docPath argument (validation, exit 4)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['doc-sources']);
  assert.equal(result.status, 4);
});

test('two submits of the same text get different ids, both persist, no duplicate-id error (collision retry)', () => {
  const cwd = tmpCwd();
  const text = 'Fix the broken login button';

  const first = run(cwd, ['submit', text]);
  assert.equal(first.status, 0);
  const second = run(cwd, ['submit', text]);
  assert.equal(second.status, 0);

  const idA = JSON.parse(first.stdout).data.id;
  const idB = JSON.parse(second.stdout).data.id;
  assert.notEqual(idA, idB, 'a second submit of the same text must not collide on id');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.ok(view.work[idA], 'first submitted item persisted');
  assert.ok(view.work[idB], 'second submitted item persisted');
});

test('entropy-history.jsonl is written in the SAME data dir as events.jsonl, not a hardcoded path, one line per check run', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'history-path-item');
  run(cwd, ['move', 'history-path-item', '--to', 'doing']);

  run(cwd, ['check']);
  run(cwd, ['check']);

  const historyPath = path.join(cwd, '.fgos', 'entropy-history.jsonl');
  assert.ok(fs.existsSync(historyPath));
  const lines = fs.readFileSync(historyPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, 2);
  for (const line of lines) {
    const entry = JSON.parse(line);
    assert.equal(typeof entry.score, 'number');
    assert.equal(typeof entry.counts.outcomes, 'number');
    assert.equal(typeof entry.counts.frictions, 'number');
    assert.equal(typeof entry.counts.settlements, 'number');
  }
});

test('GOLDEN evolve is read-only: events.jsonl and state.json are byte-identical before/after both the list and --pick paths', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'ro-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'ro-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const list = run(cwd, ['evolve']);
  assert.equal(list.status, 0);
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by evolve (list)');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by evolve (list)');

  const pick = run(cwd, ['evolve', '--pick', 'ro-item']);
  assert.equal(pick.status, 0);
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by evolve (--pick)');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by evolve (--pick)');
});

test('the CLI usage message for an unknown verb lists review/approve/sync-root/reject in the surface', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /review\|approve\|sync-root\|reject/);
});

test('catchup on a root parked with reason integration-drift, after a non-overlapping main-side change, merges main into fgw/<id> and bounces blocked -> awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-root-drift', 'integration-drift', { verify: 'test -f catchup-root-drift-produced.txt' });

  // A genuinely non-overlapping change lands on main AFTER the park
  // (another root's own approve, simulated directly).
  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);
  const result = run(cwd, ['catchup', 'catchup-root-drift']);
  assert.equal(result.status, 0, result.stderr);
  const catchupData = envelopeData(result.stdout);
  assert.equal(catchupData.from, 'blocked');
  assert.equal(catchupData.to, 'awaiting-approval');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-root-drift'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-root-drift']);
  assert.match(branchLog, /catch-up: merge main into fgw\/catchup-root-drift/);
  const producedFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:catchup-root-drift-produced.txt']);
  assert.match(producedFile, /ok/);
  const mainSideFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:main-side-change.txt']);
  assert.match(mainSideFile, /landed while parked/);
});

test('catchup on a leaf parked with reason merge-conflict targets its PARENT branch (fgw/<root>), not main, and succeeds the same way', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedLeafItem(cwd, 'catchup-leaf-root', 'catchup-leaf-child', 'merge-conflict', { verify: 'test -f catchup-leaf-child-produced.txt' });

  // A sibling leaf's own merge lands on fgw/<root> AFTER this leaf's park —
  // non-overlapping (a different file).
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-leaf-root']);
  fs.writeFileSync(path.join(cwd, 'sibling-produced.txt'), 'sibling ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling leaf merged into root']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);
  const result = run(cwd, ['catchup', 'catchup-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const leafCatchupData = envelopeData(result.stdout);
  assert.equal(leafCatchupData.from, 'blocked');
  assert.equal(leafCatchupData.to, 'awaiting-approval');
  assert.equal(leafCatchupData.target, 'fgw/catchup-leaf-root', 'catchup must merge the PARENT branch, not main');

  assert.equal(gitHead(cwd), mainHeadBefore, 'a leaf catchup must never touch main');
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-leaf-child'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-leaf-child']);
  assert.match(branchLog, /catch-up: merge fgw\/catchup-leaf-root into fgw\/catchup-leaf-child/);
  const ownFile = gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:catchup-leaf-child-produced.txt']);
  assert.match(ownFile, /ok/);
  const siblingFile = gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:sibling-produced.txt']);
  assert.match(siblingFile, /sibling ok/);
});

// tsk-4ax (D3): catchup's own successful verify must be CASHED IN for
// mergedTreeAlreadyVerified (merge.mjs:803) to skip the outbound gate's
// redundant re-verify — without recording branchHeadAtReturn, the second
// of its two conditions can never become true, and the ~185s verify keeps
// re-running INSIDE the main-checkout lock on every single land, the exact
// self-tightening loop this item exists to close.

test('catchup records branchHeadAtReturn as its own commit tip, so a subsequent approve skips re-verifying entirely (the core reason this item exists)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const sentinel = path.join(cwd, 'verify-ran.sentinel');
  makeBlockedRunnerItem(cwd, 'catchup-cashin', 'integration-drift', { verify: `touch ${JSON.stringify(sentinel)} && test -f catchup-cashin-produced.txt` });

  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const result = run(cwd, ['catchup', 'catchup-cashin']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(sentinel), true, 'catchup itself must have run the real verify once');

  const branchTipAfterCatchup = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-cashin']).trim();
  assert.equal(stateView(cwd).work['catchup-cashin'].branchHeadAtReturn, branchTipAfterCatchup, 'branchHeadAtReturn must record exactly the commit catchup just verified — the tip mergedTreeAlreadyVerified compares against');

  // Prove the outbound gate genuinely skips re-verifying: delete the
  // sentinel, then approve. If the full verify ran again inside the lock,
  // the sentinel would be recreated; asserting it stays absent is the
  // "assert, not measure time" proof acceptance 1 demands.
  fs.rmSync(sentinel);
  const approveResult = run(cwd, ['approve', 'catchup-cashin']);
  assert.equal(approveResult.status, 0, approveResult.stderr);
  const approveData = envelopeData(approveResult.stdout);
  assert.equal(approveData.to, 'delivered');
  assert.equal(fs.existsSync(sentinel), false, 'the outbound gate must NOT have re-run verify — mergedTreeAlreadyVerified must have skipped it');
});

test('catchup on the already-caught-up path ALSO records branchHeadAtReturn (no new commit, but still a real verify that must be cashed in)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const sentinel = path.join(cwd, 'verify-ran.sentinel');
  makeAlreadyCaughtUpItem(cwd, 'catchup-caughtup-cashin', `touch ${JSON.stringify(sentinel)} && test -f catchup-caughtup-cashin-produced.txt`);

  const result = run(cwd, ['catchup', 'catchup-caughtup-cashin']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).outcome, 'already-caught-up');
  assert.equal(fs.existsSync(sentinel), true);

  const branchTip = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caughtup-cashin']).trim();
  assert.equal(stateView(cwd).work['catchup-caughtup-cashin'].branchHeadAtReturn, branchTip);

  fs.rmSync(sentinel);
  const approveResult = run(cwd, ['approve', 'catchup-caughtup-cashin']);
  assert.equal(approveResult.status, 0, approveResult.stderr);
  assert.equal(envelopeData(approveResult.stdout).to, 'delivered');
  assert.equal(fs.existsSync(sentinel), false, 'already-caught-up must also cash in its verify for the outbound skip');
});

test('an item that trips catchup verify-fail (never reaches awaiting-approval) does not have branchHeadAtReturn touched, and a later successful catchup still fixes it (fail-closed unaffected)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-redverify', 'integration-drift', { verify: 'test -f this-file-does-not-exist.txt' });
  const before = stateView(cwd).work['catchup-redverify'].branchHeadAtReturn;

  const result = run(cwd, ['catchup', 'catchup-redverify']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).outcome, 'verify-fail');
  assert.equal(stateView(cwd).work['catchup-redverify'].status, 'blocked', 'a red catchup verify must leave the item blocked, not move it');
  assert.equal(stateView(cwd).work['catchup-redverify'].branchHeadAtReturn, before, 'a failed catchup must never record a tip it never actually verified green');
});

test('catchup on an item whose target has a REAL same-line conflict leaves it blocked, aborts cleanly (branch tip unchanged), and names the conflicted file', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  addOk(cwd, 'catchup-conflict-item');
  run(cwd, ['move', 'catchup-conflict-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim catchup-conflict-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'catchup-conflict-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose catchup-conflict-item');
  run(cwd, ['move', 'catchup-conflict-item', '--to', 'blocked', '--reason', 'merge-conflict']);
  commitPending(cwd, 'state: park catchup-conflict-item');

  // main changes the SAME line differently after the park — a genuine
  // conflict for catchup's merge (main into the branch) to detect.
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['catchup', 'catchup-conflict-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /conflicted/);
  assert.match(result.stdout, /shared\.txt/);

  assert.equal(gitHead(cwd), mainHeadBefore, 'main must be unchanged by a failed catchup');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim(), branchHeadBefore, "the item's own branch tip must be unchanged after an aborted catchup");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up even on abort — no leftover');
  assert.equal(stateView(cwd).work['catchup-conflict-item'].status, 'blocked');
});

test('catchup on a branch that already contains the target reports outcome "already-caught-up", still runs verify, and bounces blocked -> awaiting-approval without creating a commit', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up', 'test -f catchup-caught-up-produced.txt');

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['catchup', 'catchup-caught-up']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'already-caught-up');
  assert.equal(data.from, 'blocked');
  assert.equal(data.to, 'awaiting-approval');

  assert.equal(stateView(cwd).work['catchup-caught-up'].status, 'awaiting-approval');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up']).trim(), branchHeadBefore, 'no commit is created when there was nothing to merge');
  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
});

test('catchup on an already-caught-up branch whose verify is RED stays blocked and reports verify-fail, without attempting a merge --abort that has no merge to abort', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up-red', 'test -f never-produced.txt');

  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up-red']).trim();

  const result = run(cwd, ['catchup', 'catchup-caught-up-red']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'verify-fail');

  assert.equal(stateView(cwd).work['catchup-caught-up-red'].status, 'blocked');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up-red']).trim(), branchHeadBefore);
});

test('catchup on an item blocked for an unrelated reason (e.g. anti-loop-max-visits) is rejected with a validation error naming the actual reason, before any git operation runs', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-unrelated-reason');
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'doing']);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'blocked', '--reason', 'anti-loop-max-visits']);

  const result = run(cwd, ['catchup', 'catchup-unrelated-reason']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /anti-loop-max-visits/);
  assert.equal(stateView(cwd).work['catchup-unrelated-reason'].status, 'blocked');
});

// tsk-3vo D5: same shared --timeout/--no-timeout resolution as `return`
// (resolveVerifyTimeoutMs), wired into `catchup` too — must reject the same
// way, before any git operation runs.
test('catchup --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-timeout-conflict');
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'doing']);
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'blocked', '--reason', 'merge-conflict']);

  const result = run(cwd, ['catchup', 'catchup-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['catchup-timeout-conflict'].status, 'blocked', 'a rejected flag combination never runs verify or moves the item');
});

test('catchup on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['catchup', 'ghost']);
  assert.equal(result.status, 4);
});

test('catchup on a status other than blocked is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-not-blocked');
  const result = run(cwd, ['catchup', 'catchup-not-blocked']);
  assert.equal(result.status, 2);
});

test('the CLI usage message for an unknown verb lists catchup in the surface', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /catchup/);
});

test('an item added with no --acceptance flag has work.acceptance absent (undefined), not an empty array', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-acceptance-item');
  assert.equal(result.status, 0);
  const view = stateView(cwd);
  assert.equal('acceptance' in view.work['no-acceptance-item'], false, 'an omitted --acceptance leaves the field absent, not []');
  const listed = envelopeData(run(cwd, ['list']).stdout);
  assert.equal('acceptance' in listed.work['no-acceptance-item'], false);
});

test('an item with acceptance absent, or an empty array, closes via move --to delivered completely unaffected (no-op)', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-absent'); // no --acceptance ever set
  assert.equal(run(cwd, ['move', 'cli-cos-absent', '--to', 'delivered']).status, 0);
  assert.equal(stateView(cwd).work['cli-cos-absent'].status, 'delivered');

  const cwd2 = tmpCwd();
  toProposed(cwd2, 'cli-cos-empty');
  run(cwd2, ['edit', 'cli-cos-empty', '--acceptance', JSON.stringify([])]);
  assert.equal(run(cwd2, ['move', 'cli-cos-empty', '--to', 'delivered']).status, 0);
  assert.equal(stateView(cwd2).work['cli-cos-empty'].status, 'delivered');
});

test('retrospective sweeps every delivered item to retrospective, in one pass, leaving non-delivered items untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'retro-todo-item'); // stays todo
  addOk(cwd, 'retro-delivered-a');
  run(cwd, ['move', 'retro-delivered-a', '--to', 'doing']);
  run(cwd, ['move', 'retro-delivered-a', '--to', 'delivered']);
  addOk(cwd, 'retro-delivered-b');
  run(cwd, ['move', 'retro-delivered-b', '--to', 'doing']);
  run(cwd, ['move', 'retro-delivered-b', '--to', 'delivered']);

  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 2);
  assert.deepEqual(data.swept.map((s) => s.id).sort(), ['retro-delivered-a', 'retro-delivered-b']);

  const view = stateView(cwd);
  assert.equal(view.work['retro-todo-item'].status, 'todo', 'a non-delivered item is never touched');
  assert.equal(view.work['retro-delivered-a'].status, 'retrospective');
  assert.equal(view.work['retro-delivered-b'].status, 'retrospective');
});

test('retrospective on a store with no delivered items is a clean no-op, exit 0, empty sweep', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nothing-delivered');
  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { swept: [], count: 0 });
});

test('cleanup on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['cleanup', 'ghost']);
  assert.equal(result.status, 4);
});

test('cleanup on an item not at status cleanup is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-wrong-status');
  const result = run(cwd, ['cleanup', 'cleanup-wrong-status']);
  assert.equal(result.status, 2);
});

test('cleanup parks cleanup -> blocked, with every failing reason joined, when the TTL has not elapsed and no retrospective content exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-not-ready');
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'doing']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'retrospective']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'cleanup']);
  // Default TTL (7d, no config written) — freshly entered, not elapsed.

  const result = run(cwd, ['cleanup', 'cleanup-not-ready']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.match(data.reason, /not ready yet/);
  assert.match(data.reason, /no outcome docType\/docPath or decision record/);

  assert.equal(stateView(cwd).work['cleanup-not-ready'].status, 'blocked');
});

test('cleanup is a no-op — writes zero work.move events and stays at cleanup — when only TTL has not elapsed and the D8 checks pass', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-ttl-only');
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'doing']);
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-ttl-only.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-ttl-only', docType: 'how-to', docPath: 'docs/how-to/cleanup-ttl-only.md' });
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'cleanup']);
  // Default TTL (7d, no config written) — freshly entered, not elapsed.
  // No branchHeadAtReturn recorded -> checkMergeStillResolves passes
  // trivially ("nothing to check"), so the only failing check is TTL.

  const before = eventLines(cwd).length;
  const result = run(cwd, ['cleanup', 'cleanup-ttl-only']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'cleanup');
  assert.equal(data.noop, true);

  assert.equal(eventLines(cwd).length, before, 'TTL-not-elapsed alone must write zero events');
  assert.equal(stateView(cwd).work['cleanup-ttl-only'].status, 'cleanup', 'item must stay at cleanup, not move to blocked');
});

test('cleanup closes to done when TTL is configured to 0 and retrospective content + a resolving merge both exist', () => {
  // tsk-1p9: approve no longer calls cleanupMergedBranch at all — the
  // branch survives all the way from `delivered` through `cleanup`, and
  // this verb is now the ONLY thing that ever deletes it. `cleanupMergedBranch`
  // stays idempotent (branchExists guards it, never throws on an
  // already-gone branch, per merge.test.mjs) as a defensive property, not
  // because this path actually races another deletion anymore.
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedItem(cwd, 'cleanup-ready-item', { verify: 'test -f cleanup-ready-item-produced.txt' });
  commitPendingBeforeApprove(cwd, 'cleanup-ready-item');

  const approve = run(cwd, ['approve', 'cleanup-ready-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(stateView(cwd).work['cleanup-ready-item'].status, 'delivered');

  run(cwd, ['move', 'cleanup-ready-item', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-ready-item.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-ready-item', docType: 'how-to', docPath: 'docs/how-to/cleanup-ready-item.md' });
  run(cwd, ['move', 'cleanup-ready-item', '--to', 'cleanup']);

  const result = run(cwd, ['cleanup', 'cleanup-ready-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'done');

  assert.equal(stateView(cwd).work['cleanup-ready-item'].status, 'done');
  const branchAfter = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchAfter, /fgw\/cleanup-ready-item/, 'the branch is gone by the time cleanup finishes, whichever step actually deleted it');
});

// tsk-1p9 (D7/D8): the regression this item exists to close — a LEAF
// item's own branch, merged into its root's branch (never main), must
// still be deleted correctly by cleanup even while the root itself
// remains unmerged. Pre-tsk-1p9, checkMergeStillResolves checked ancestry
// against literal HEAD (always main from repoRoot), which would falsely
// fail for every leaf; this test proves the root-aware fix (D7) plus the
// verb's own force-delete (D8) actually get the leaf's branch gone.
test('cleanup of a LEAF item deletes its own branch even though the ROOT branch is still unmerged into main (tsk-1p9 D7/D8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedLeafItem(cwd, 'leaf-cleanup-root', 'leaf-cleanup-child', { verify: 'test -f leaf-cleanup-child-produced.txt' });
  commitPendingBeforeApprove(cwd, 'leaf-cleanup-child');

  const approve = run(cwd, ['approve', 'leaf-cleanup-child']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(stateView(cwd).work['leaf-cleanup-child'].status, 'delivered');

  // The leaf's branch survives approve (tsk-1p9 D1) — confirms the fixture
  // actually exercises the deferred-cleanup path this test is proving.
  const branchAfterApprove = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branchAfterApprove, /fgw\/leaf-cleanup-child\b/, 'the leaf branch must still exist right after approve');
  assert.match(branchAfterApprove, /fgw\/leaf-cleanup-root\b/, 'the root branch must still exist — never merged to main by this test');

  run(cwd, ['move', 'leaf-cleanup-child', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'leaf-cleanup-child.md'), '# doc\n');
  addOutcome(dir, { id: 'leaf-cleanup-child', docType: 'how-to', docPath: 'docs/how-to/leaf-cleanup-child.md' });
  run(cwd, ['move', 'leaf-cleanup-child', '--to', 'cleanup']);

  const result = run(cwd, ['cleanup', 'leaf-cleanup-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'done', `cleanup must close the leaf to done, not park it blocked: ${JSON.stringify(data)}`);

  assert.equal(stateView(cwd).work['leaf-cleanup-child'].status, 'done');
  const branchAfterCleanup = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchAfterCleanup, /fgw\/leaf-cleanup-child\b/, 'the leaf branch must actually be deleted by cleanup');
  assert.match(branchAfterCleanup, /fgw\/leaf-cleanup-root\b/, 'the still-open root branch must be untouched');
});

test('cleanup parks cleanup -> blocked when the recorded commit no longer resolves on main (force-pushed/rewritten away)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-bad-merge',
    title: 'Bad merge',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'true',
    headAtReturn: '0'.repeat(40), // a well-formed but nonexistent sha
  });
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-bad-merge.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-bad-merge', docType: 'how-to', docPath: 'docs/how-to/cleanup-bad-merge.md' });

  const result = run(cwd, ['cleanup', 'cleanup-bad-merge']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.match(data.reason, /no longer reachable/);
});

// tsk-2q8: a `cleanup -> blocked` park caused by checkMergeStillResolves
// (the recorded commit no longer resolving) has a REAL fgw/<id> branch —
// unlike the merge-conflict-family reasons above, `item.reason` here is
// never one of CATCHUP_REASONS' short enum values (the cleanup verb
// records the full diagnostic text instead), so catchup must recognize
// this case by live-re-checking checkMergeStillResolves, not by reason
// text. Re-merging main into fgw/<id> and re-verifying is exactly the fix:
// the item's own commit becomes a real descendant of main afterward.
test('catchup recovers a cleanup-origin blocked item whose recorded commit no longer resolves, by re-merging and re-verifying (tsk-2q8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/cleanup-origin-recover']);
  fs.writeFileSync(path.join(cwd, 'cleanup-origin-recover-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for cleanup-origin-recover']);
  const staleSha = gitAtCwd(cwd, ['rev-parse', 'HEAD']).trim();
  gitAtCwd(cwd, ['checkout', 'main']);

  // main advances INDEPENDENTLY after the branch forked (a non-overlapping
  // change, mirroring the existing `catchup-root-drift` test above) — the
  // real shape this item exists for: `staleSha` is not (yet) reachable from
  // main, and merging main forward requires a real merge commit, not a
  // fast-forward/no-op (which is what a lagging-main setup would produce).
  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-origin-recover',
    title: 'Cleanup-origin recover',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'test -f cleanup-origin-recover-produced.txt',
    branchHeadAtReturn: staleSha,
  });
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-origin-recover.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-origin-recover', docType: 'how-to', docPath: 'docs/how-to/cleanup-origin-recover.md' });

  const cleanupResult = run(cwd, ['cleanup', 'cleanup-origin-recover']);
  assert.equal(cleanupResult.status, 0, cleanupResult.stderr);
  const cleanupData = envelopeData(cleanupResult.stdout);
  assert.equal(cleanupData.to, 'blocked');
  assert.match(cleanupData.reason, /no longer reachable/);
  assert.equal(stateView(cwd).work['cleanup-origin-recover'].status, 'blocked');

  const catchupResult = run(cwd, ['catchup', 'cleanup-origin-recover']);
  assert.equal(catchupResult.status, 0, catchupResult.stderr);
  const catchupData = envelopeData(catchupResult.stdout);
  assert.equal(catchupData.to, 'awaiting-approval');
  assert.equal(stateView(cwd).work['cleanup-origin-recover'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/cleanup-origin-recover']);
  assert.match(branchLog, /catch-up: merge main into fgw\/cleanup-origin-recover/);
});

// The retrospective-content-only shape must NOT be treated as
// catchup-eligible even though it is also a `cleanup -> blocked` park —
// merging main into fgw/<id> does nothing to fix missing retrospective
// docs, so admitting it here would silently wave the item toward
// awaiting-approval without ever addressing the real gap.
test('catchup still rejects a cleanup-origin blocked item whose recorded commit DOES resolve (missing retrospective content only, not a merge-ancestry gap) (tsk-2q8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/cleanup-origin-retro-only']);
  fs.writeFileSync(path.join(cwd, 'cleanup-origin-retro-only-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for cleanup-origin-retro-only']);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-ff', '-q', '-m', 'merge cleanup-origin-retro-only', 'fgw/cleanup-origin-retro-only']);
  const mergedSha = gitAtCwd(cwd, ['rev-parse', 'HEAD']).trim();

  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-origin-retro-only',
    title: 'Cleanup-origin retro-only',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'test -f cleanup-origin-retro-only-produced.txt',
    branchHeadAtReturn: mergedSha,
  });
  // No outcome doc/decision recorded -- checkRetrospectiveContent fails,
  // checkMergeStillResolves passes (mergedSha genuinely IS an ancestor of
  // main now).

  const cleanupResult = run(cwd, ['cleanup', 'cleanup-origin-retro-only']);
  assert.equal(cleanupResult.status, 0, cleanupResult.stderr);
  const cleanupData = envelopeData(cleanupResult.stdout);
  assert.equal(cleanupData.to, 'blocked');
  assert.match(cleanupData.reason, /no outcome docType\/docPath or decision record/);
  assert.doesNotMatch(cleanupData.reason, /no longer reachable/);

  const catchupResult = run(cwd, ['catchup', 'cleanup-origin-retro-only']);
  assert.equal(catchupResult.status, 4);
  assert.match(catchupResult.stderr, /catchup only resolves a merge-related park/);
  assert.equal(stateView(cwd).work['cleanup-origin-retro-only'].status, 'blocked');
});

test('catchup accepts a blocked reason of merge-blocked-other-item as a valid precondition (tsk-4hj D2, mirrors tsk-18a\'s own precedent for merge-failed-unclassified)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'catchup-blocked-other-item');
  run(cwd, ['move', 'catchup-blocked-other-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim catchup-blocked-other-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-blocked-other-item']);
  fs.writeFileSync(path.join(cwd, 'catchup-blocked-other-item-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'catchup-blocked-other-item-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'worker output for catchup-blocked-other-item']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'catchup-blocked-other-item', '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, 'state: propose catchup-blocked-other-item');
  run(cwd, ['move', 'catchup-blocked-other-item', '--to', 'blocked', '--reason', 'merge-blocked-other-item']);
  commitPending(cwd, 'state: park catchup-blocked-other-item');

  const result = run(cwd, ['catchup', 'catchup-blocked-other-item']);
  // The precondition check itself must accept the reason -- a rejected
  // reason exits 4 (validation: "catchup only resolves a merge-related
  // park (...)"); anything else (including a real merge outcome, since
  // the branch already contains main and this is an "already-caught-up"
  // no-op) proves the reason was accepted.
  assert.notEqual(result.status, 4, result.stderr);
  assert.doesNotMatch(result.stderr, /catchup only resolves a merge-related park/);
});

test('catchup succeeds when invoked with cwd inside the item\'s own linked worktree and --dir pointed at the main checkout (tsk-5vl regression guard)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-worktree-cwd', 'integration-drift', { verify: 'test -f catchup-worktree-cwd-produced.txt' });

  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-catchup-wt-'));
  fs.rmdirSync(wt);
  gitAtCwd(cwd, ['worktree', 'add', wt, 'fgw/catchup-worktree-cwd']);

  const mainHeadBefore = gitHead(cwd);
  const result = run(wt, ['catchup', 'catchup-worktree-cwd', '--dir', cwd]);
  assert.equal(result.status, 0, `catchup from inside the item's own worktree unexpectedly failed: ${result.stderr}`);
  assert.doesNotMatch(result.stderr ?? '', /Cannot force update the current branch/);
  const catchupData = envelopeData(result.stdout);
  assert.equal(catchupData.from, 'blocked');
  assert.equal(catchupData.to, 'awaiting-approval');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(stateView(cwd).work['catchup-worktree-cwd'].status, 'awaiting-approval');
  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-worktree-cwd']);
  assert.match(branchLog, /catch-up: merge main into fgw\/catchup-worktree-cwd/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
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


