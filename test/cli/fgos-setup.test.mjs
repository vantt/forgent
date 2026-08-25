// fgos-setup.test.mjs -- phần "setup, init, repair, rebuild, schedule, gate-bypass" của bộ test CLI, tách nguyên văn
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
  rawPersistedView,
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


// tsk-3u2 (post-tsk-3c7 independent review): `schedule` was missing from
// STORE_MISSING_WARNING_VERBS, so from a linked worktree with no `.fgos/`
// it silently returned an empty-looking {waves:[],cycles:[]} instead of
// this warning -- indistinguishable from "graph is genuinely clean" for
// the exact context an agent normally runs it from.
test('schedule from a .fgos/-less linked worktree with no --dir warns on stderr, same as conflicts (tsk-3u2 regression guard)', () => {
  const { wt } = tmpLinkedWorktree();
  const scheduleResult = run(wt, ['schedule']);
  assert.equal(scheduleResult.status, 0, 'schedule is requiresExistingStore:false -- it warns, never refuses');
  assert.match(scheduleResult.stderr, /\.fgos\/ not found/);
  assert.deepEqual(envelopeData(scheduleResult.stdout), { waves: [], cycles: [] });

  const conflictsResult = run(wt, ['conflicts']);
  assert.match(conflictsResult.stderr, /\.fgos\/ not found/, 'schedule must warn under the exact same condition its sibling conflicts already does');
});

// tsk-3g5 (post-tsk-3u2 independent review): the same STORE_MISSING_
// WARNING_VERBS gap found and fixed for `schedule`, found again in 3 more
// requiresExistingStore:false verbs. `gate-bypass` is the sharpest
// instance: unwarned, it reports a CONFIDENTLY WRONG safety-policy level
// (the empty-store default "off") instead of an honestly-empty result --
// the exact opposite of "looks safer than reality" a caller checking
// bypass posture needs to be warned about.
test('gate-bypass from a .fgos/-less linked worktree with no --dir warns on stderr and reports the empty-store default, never the real main-checkout level', () => {
  const { main, wt } = tmpLinkedWorktree();
  const mainResult = run(main, ['gate-bypass']);
  assert.equal(mainResult.status, 0);

  const wtResult = run(wt, ['gate-bypass']);
  assert.equal(wtResult.status, 0, 'gate-bypass is requiresExistingStore:false -- it warns, never refuses');
  assert.match(wtResult.stderr, /\.fgos\/ not found/);
  assert.equal(envelopeData(wtResult.stdout).level, 'off', 'the .fgos/-less empty-store default, never silently trusted as the real policy');
});

test('init creates .fgos/ with an empty log and a rebuilt (empty) view, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(logPath(cwd)));
  const view = rawPersistedView(cwd);
  assert.deepEqual(view.work, {});
  assert.deepEqual(view.decisions, []);
  // work-graph-intelligence S3: the persisted (on-disk) view now carries a
  // deterministic revision-hash sibling — the fold return stays pure, but
  // state.json fingerprints its own folded state.
  assert.match(view.revision, /^[0-9a-f]{64}$/);
});

test('init in a git repo with zero commits reports gitHeadless: true', () => {
  const cwd = initHeadlessGitCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  const initData = envelopeData(result.stdout);
  assert.equal(initData.gitHeadless, true);
});

test('init in a git repo with a commit does not report gitHeadless', () => {
  const cwd = initGitCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  const initData = envelopeData(result.stdout);
  assert.equal(initData.gitHeadless, undefined);
});

test('init inside a linked worktree is refused, exit 4 (ADR0020: worktrees never carry .fgos/)', () => {
  const { wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const result = run(wt, ['init']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /linked worktree/);
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')), 'the refused init must not create .fgos/ in the worktree');
});

test('init on a fresh directory that is not a linked worktree still succeeds, exit 0', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.fgos')));
});

// `setup` appends a source line to every rc file it detects under $HOME, so
// this must run against a throwaway HOME: inheriting the real one made every
// `npm test` run permanently append a line naming a temp worktree that the
// test then deletes, leaving a dead `source` in the developer's own profile
// that errors on every interactive shell open. `run`'s `extraEnv` already
// merges over process.env, the same sandboxing test/setup/checks.test.mjs
// does when it spawns `setup`.
test('setup inside a .fgos/-less linked worktree still succeeds (setup never touches .fgos/, exempt from the guard)', () => {
  const { wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const result = run(wt, ['setup'], { HOME: rawTmpCwd() });
  assert.equal(result.status, 0, `setup unexpectedly refused: ${result.stderr}`);
});

// tsk-5hi: setup now also runs every registered fix (`runFixes()`, the same
// call `doctor --fix` already makes) instead of leaving a person to
// separately discover and run `doctor --fix`. FGOS_CLAUDE_COMMAND points at
// a nonexistent binary — same seam test/setup/plugin-marketplace-doctor-
// check.test.mjs already proves for the identical fix function — so this
// never shells out to a real `claude` CLI.
test('setup runs every registered fix and reports them under "fixed", never touching a real claude binary', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['setup'], {
    HOME: rawTmpCwd(),
    FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary',
  });
  assert.equal(result.status, 0, `setup unexpectedly failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data.fixed), 'setup result missing a "fixed" array');
  const byId = Object.fromEntries(data.fixed.map((entry) => [entry.id, entry]));
  assert.ok('gate-bypass-configured' in byId, 'setup did not run the gate-bypass-configured fix');
  assert.ok('claude-plugin-marketplace' in byId, 'setup did not run the claude-plugin-marketplace fix');
  assert.equal(byId['claude-plugin-marketplace'].changed, false);
  assert.match(byId['claude-plugin-marketplace'].message, /not found on PATH/);
});

test('rebuild reconstructs state.json from the log alone after the view file is deleted', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'a');
  addOk(cwd, 'b');
  run(cwd, ['move', 'a', '--to', 'doing']);
  const before = rawPersistedView(cwd);

  fs.rmSync(viewPath(cwd));
  assert.ok(!fs.existsSync(viewPath(cwd)));

  const result = run(cwd, ['rebuild']);
  assert.equal(result.status, 0);
  assert.deepEqual(rawPersistedView(cwd), before);
});

test('rebuild reconstructs state.json from the log alone when the view file still exists but is stale (not deleted)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'a');
  addOk(cwd, 'b');
  run(cwd, ['move', 'a', '--to', 'doing']);
  const freshFromLog = rawPersistedView(cwd);

  // Corrupt the view IN PLACE (file still exists) rather than deleting it:
  // wrong status for "a" and a missing item "b" — the exact failure mode
  // the risk map called out (a stale-but-present view), not a removed file.
  const stale = {
    work: {
      a: { ...freshFromLog.work.a, status: 'todo' },
    },
    decisions: [],
  };
  fs.writeFileSync(viewPath(cwd), `${JSON.stringify(stale, null, 2)}\n`, 'utf8');
  assert.ok(fs.existsSync(viewPath(cwd)));
  assert.notDeepEqual(rawPersistedView(cwd), freshFromLog);

  const result = run(cwd, ['rebuild']);
  assert.equal(result.status, 0);
  assert.deepEqual(rawPersistedView(cwd), freshFromLog);
});

test('repair fixes a truncated final line via the real CLI, log becomes readable and usable again', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-truncation');
  const before = eventLines(cwd).length;
  fs.appendFileSync(logPath(cwd), '{"seq":99,"partial', 'utf8');

  const repaired = run(cwd, ['repair']);
  assert.equal(repaired.status, 0);
  assert.equal(eventLines(cwd).length, before);

  const list = run(cwd, ['list']);
  assert.equal(list.status, 0);
  assert.ok(envelopeData(list.stdout).work['before-truncation']);
});

test('repair refuses mid-file corruption via the real CLI (valid, corrupt, valid), exit 5, log left untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'a');
  addOk(cwd, 'b');
  const [firstLine, secondLine] = eventLines(cwd);
  fs.writeFileSync(logPath(cwd), `${firstLine}\nnot json either\n${secondLine}\n`, 'utf8');
  const before = fs.readFileSync(logPath(cwd), 'utf8');

  const result = run(cwd, ['repair']);
  assert.equal(result.status, 5);
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), before);
});

test('init with no other harness present still writes .fgos/coexistence.json with an empty detected_harnesses', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /Detected other harness/);

  const manifest = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));
  assert.equal(manifest.v, 1);
  assert.deepEqual(manifest.detected_harnesses, []);
});

test('init in a project with a .bee/ marker detects it, reports it in the output, and leaves .bee/ byte/mtime unchanged (read-only)', () => {
  const cwd = tmpCwd();
  const beeDir = path.join(cwd, '.bee');
  fs.mkdirSync(beeDir);
  const beeMarkerFile = path.join(beeDir, 'state.json');
  fs.writeFileSync(beeMarkerFile, '{"phase":"idle"}');
  const beforeStat = fs.statSync(beeMarkerFile);
  const beforeContent = fs.readFileSync(beeMarkerFile);

  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  const initData = envelopeData(result.stdout);
  assert.deepEqual(initData.detectedHarnesses, [{ name: 'bee', markers: ['.bee'] }]);

  const manifest = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));
  assert.deepEqual(manifest.detected_harnesses, [{ name: 'bee', markers: ['.bee'] }]);

  const afterStat = fs.statSync(beeMarkerFile);
  assert.equal(afterStat.mtimeMs, beforeStat.mtimeMs);
  assert.deepEqual(fs.readFileSync(beeMarkerFile), beforeContent);
});

test('init never creates a host AGENTS.md that did not already exist', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(cwd, 'AGENTS.md')), false);
});

test('init runs a second time (idempotent) and rewrites coexistence.json with the same content when nothing in the project changed', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, '.claude'));

  assert.equal(run(cwd, ['init']).status, 0);
  const first = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));

  assert.equal(run(cwd, ['init']).status, 0);
  const second = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));

  assert.deepEqual(second, first);
});
