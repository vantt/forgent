// fgos-post-merge.test.mjs -- phần "catchup, cleanup, retrospective, docs-index, doc-sources" của bộ test CLI, tách nguyên văn
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

  const historyPath = path.join(cwd, '.fgos', 'logs', 'entropy-history.jsonl');
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
