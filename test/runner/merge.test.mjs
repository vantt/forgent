import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  detectTrunk,
  classifySource,
  reviewDiff,
  mergeRunnerItem,
  cleanupMergedBranch,
  changedFiles,
  isWorkingTreeClean,
  isFgosOnlyStatusLine,
  buildOwnFileSet,
  classifyDecisionIndexCollision,
  abortMergeIfPossible,
  MergeError,
} from '../../src/runner/merge.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';
import { branchNameFor, withMergeEphemeralWorktree } from '../../src/runner/worktree.mjs';
import { acquireMainCheckoutLock, ACQUIRED } from '../../src/runner/main-checkout-lock.mjs';

// Every test here creates its own disposable git repo (mirrors
// worktree.test.mjs's own initTempRepo) — never this repo's own checkout.
// The trunk is pinned to "main" via `git init -b main`: merge.mjs's runner
// diff (main...fgw/<id>) and merge (`git merge ... fgw/<id>` while on main)
// both assume that literal trunk name, per plan.md's locked Approach.

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return repoRoot;
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function headOf(repoRoot) {
  return git(repoRoot, ['rev-parse', 'HEAD']).trim();
}

function makeBranchWithCommit(repoRoot, branch, filename, content) {
  git(repoRoot, ['checkout', '-b', branch]);
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `on ${branch}`]);
  git(repoRoot, ['checkout', 'main']);
}

function makeItem(overrides = {}) {
  return { id: 'demo-item', verify: 'true', ...overrides };
}

// --- classifySource ---------------------------------------------------

test('classifySource returns "runner" when a live fgw/<id> branch exists', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  assert.equal(classifySource(repoRoot, makeItem()), 'runner');
});

test('classifySource returns "pull" when no branch exists but headAtTake/headAtReturn are both present', () => {
  const repoRoot = initRepo();
  const head = headOf(repoRoot);
  assert.equal(classifySource(repoRoot, makeItem({ headAtTake: head, headAtReturn: head })), 'pull');
});

test('classifySource returns "legacy" when neither a branch nor headAtTake/headAtReturn exist', () => {
  const repoRoot = initRepo();
  assert.equal(classifySource(repoRoot, makeItem()), 'legacy');
});

test('classifySource prefers "runner" even when headAtTake/headAtReturn are also present (branch existence wins)', () => {
  const repoRoot = initRepo();
  const head = headOf(repoRoot);
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  assert.equal(classifySource(repoRoot, makeItem({ headAtTake: head, headAtReturn: head })), 'runner');
});

// --- reviewDiff ---------------------------------------------------------

test('reviewDiff for a runner item with an explicit opts.trunk diffs against that trunk instead of main', () => {
  const repoRoot = initRepo();
  // A non-main trunk, forked from main, with its own commit — then a leaf
  // branch forked from THAT trunk's tip, per D3's fgw/<root> tree shape.
  makeBranchWithCommit(repoRoot, 'fgw/parent-root', 'root-only.txt', 'root\n');
  git(repoRoot, ['checkout', 'fgw/parent-root']);
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  git(repoRoot, ['checkout', 'main']);

  const result = reviewDiff(repoRoot, makeItem(), { trunk: 'fgw/parent-root' });
  assert.equal(result.source, 'runner');
  assert.match(result.diff, /produced\.txt/);
  assert.doesNotMatch(result.diff, /root-only\.txt/, 'diff against the custom trunk must not include the trunk\'s own changes relative to main');
  assert.deepEqual(result.warnings, []);
});

test('reviewDiff for a runner item with no opts.trunk still defaults to main (regression)', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const result = reviewDiff(repoRoot, makeItem());
  assert.equal(result.source, 'runner');
  assert.match(result.diff, /produced\.txt/);
  assert.deepEqual(result.warnings, []);
});

test('reviewDiff for a pull item diffs headAtTake..headAtReturn with no warning for a single-commit range', () => {
  const repoRoot = initRepo();
  const headAtTake = headOf(repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'proof.txt'), 'proof\n');
  git(repoRoot, ['add', 'proof.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'return commit']);
  const headAtReturn = headOf(repoRoot);

  const result = reviewDiff(repoRoot, makeItem({ headAtTake, headAtReturn }));
  assert.equal(result.source, 'pull');
  assert.match(result.diff, /proof\.txt/);
  assert.deepEqual(result.warnings, []);
});

test('reviewDiff for a pull item warns when the range contains more than one commit (possible interleaved session)', () => {
  const repoRoot = initRepo();
  const headAtTake = headOf(repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'other.txt'), 'other\n');
  git(repoRoot, ['add', 'other.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'interleaved commit from another session']);
  fs.writeFileSync(path.join(repoRoot, 'proof.txt'), 'proof\n');
  git(repoRoot, ['add', 'proof.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'return commit']);
  const headAtReturn = headOf(repoRoot);

  const result = reviewDiff(repoRoot, makeItem({ headAtTake, headAtReturn }));
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /2 commits/);
});

test('reviewDiff for a legacy item (no branch, no head markers) returns a null diff and a non-throwing warning', () => {
  const repoRoot = initRepo();
  const result = reviewDiff(repoRoot, makeItem());
  assert.equal(result.source, 'legacy');
  assert.equal(result.diff, null);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /no live diff source/);
});

// tsk-648: a diff larger than Node's own 1 MiB execFileSync default (the
// default in force before this item, since `git()` used to pass no
// maxBuffer at all) must still succeed under reviewDiff's own generous
// ceiling -- direct regression proof for the reported ENOBUFS crash
// (fgw/tsk-19y, 332 commits stale).
test('reviewDiff succeeds on a diff larger than Node\'s old 1 MiB execFileSync default (tsk-648 regression)', () => {
  const repoRoot = initRepo();
  const bigContent = `${'x'.repeat(2 * 1024 * 1024)}\n`; // 2 MiB, well past the old 1 MiB default
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'big.txt', bigContent);

  const result = reviewDiff(repoRoot, makeItem());
  assert.equal(result.source, 'runner');
  assert.ok(result.diff.length > 1024 * 1024, 'the diff itself must exceed the old 1 MiB default to be a real regression proof');
  assert.match(result.diff, /big\.txt/);
  assert.deepEqual(result.warnings, []);
});

// tsk-648: once a diff still overflows maxBuffer (proven deterministically
// here via an explicitly tiny override, not by needing an actually
// gigantic diff), reviewDiff must throw a MergeError naming the real
// condition -- never a raw, unhelpful "spawnSync git ENOBUFS" passthrough,
// and never an uncaught crash.
test('reviewDiff reports a diagnosable MergeError, not a raw ENOBUFS passthrough, when a diff still exceeds maxBuffer', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', `${'y'.repeat(4096)}\n`);

  assert.throws(
    () => reviewDiff(repoRoot, makeItem(), { maxBuffer: 64 }),
    (err) => {
      assert.ok(err instanceof MergeError, 'must still be a MergeError, not an uncaught raw exception');
      assert.match(err.message, /exceeds the .*-byte diff limit/);
      assert.match(err.message, /stale/i);
      assert.doesNotMatch(err.message, /spawnSync/, 'must not forward Node\'s raw spawnSync message verbatim');
      return true;
    },
  );
});

// --- changedFiles (the Iron Law classifier's approve-side input, D16) ----

test('changedFiles returns a runner branch\'s changed paths as an array (repo-relative, reusing the runner branch/trunk resolution)', () => {
  const repoRoot = initRepo();
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.mkdirSync(path.join(repoRoot, 'src', 'runner'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'src', 'runner', 'probe.mjs'), 'export const x = 1;\n');
  git(repoRoot, ['add', '-A']);
  git(repoRoot, ['commit', '-q', '-m', 'on fgw/demo-item']);
  git(repoRoot, ['checkout', 'main']);
  assert.deepEqual(changedFiles(repoRoot, makeItem()), ['src/runner/probe.mjs']);
});

test('changedFiles returns every changed path when a runner branch touches several files', () => {
  const repoRoot = initRepo();
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.mkdirSync(path.join(repoRoot, 'src', 'runner'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'src', 'runner', 'a.mjs'), 'a\n');
  fs.writeFileSync(path.join(repoRoot, 'plain.txt'), 'plain\n');
  git(repoRoot, ['add', '-A']);
  git(repoRoot, ['commit', '-q', '-m', 'two files']);
  git(repoRoot, ['checkout', 'main']);
  assert.deepEqual(changedFiles(repoRoot, makeItem()).sort(), ['plain.txt', 'src/runner/a.mjs']);
});

test('changedFiles honors an explicit opts.trunk (leaf diffs against its parent root, not main)', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/parent-root', 'root-only.txt', 'root\n');
  git(repoRoot, ['checkout', 'fgw/parent-root']);
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'leaf-only.txt', 'leaf\n');
  git(repoRoot, ['checkout', 'main']);
  assert.deepEqual(changedFiles(repoRoot, makeItem(), { trunk: 'fgw/parent-root' }), ['leaf-only.txt']);
});

test('changedFiles returns an empty array for a pull-source item (Iron Law approve-check is runner-only)', () => {
  const repoRoot = initRepo();
  const head = headOf(repoRoot);
  assert.deepEqual(changedFiles(repoRoot, makeItem({ headAtTake: head, headAtReturn: head })), []);
});

test('changedFiles returns an empty array for a legacy-source item (no branch, no head markers)', () => {
  const repoRoot = initRepo();
  assert.deepEqual(changedFiles(repoRoot, makeItem()), []);
});

// --- isWorkingTreeClean (.fgos/ exclusion) -------------------------------

test('isWorkingTreeClean is true when the only pending change is inside .fgos/', () => {
  const repoRoot = initRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'));
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(repoRoot, ['add', '.fgos/events.jsonl']);
  git(repoRoot, ['commit', '-q', '-m', 'seed .fgos/events.jsonl']);

  fs.appendFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":2}\n');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('isWorkingTreeClean is false when a non-.fgos path is dirty, even alongside a dirty .fgos/', () => {
  const repoRoot = initRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'));
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(repoRoot, ['add', '.fgos/events.jsonl']);
  git(repoRoot, ['commit', '-q', '-m', 'seed .fgos/events.jsonl']);

  fs.appendFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":2}\n');
  fs.writeFileSync(path.join(repoRoot, 'scratch.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(repoRoot), false);
});

// isWorkingTreeClean's own `.fgos/` exclusion needs to stay correct when
// `repoRoot` itself is a subdirectory of the real git top-level (STR60):
// `isMainWorktree` tolerates approve running from such a subdirectory, so
// `git status --porcelain` from there still reports paths relative to the
// TRUE top-level (e.g. "sub/.fgos/events.jsonl", never bare ".fgos/...").
test('isWorkingTreeClean(repoRoot) still recognizes its own .fgos/ as excluded when repoRoot is a subdirectory of the real git top-level', () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  fs.mkdirSync(path.join(sub, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(sub, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(topLevel, ['add', 'sub/.fgos/events.jsonl']);
  git(topLevel, ['commit', '-q', '-m', 'seed sub/.fgos/events.jsonl']);

  fs.appendFileSync(path.join(sub, '.fgos', 'events.jsonl'), '{"seq":2}\n');
  assert.equal(isWorkingTreeClean(sub), true);
});

test('isWorkingTreeClean(repoRoot) still scans the WHOLE repo when repoRoot is a subdirectory — a dirty file elsewhere still counts (approve is a whole-tree gate, unlike return)', () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(topLevel, 'elsewhere.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(sub), false);
});

// --- isWorkingTreeClean's ownFileSet parameter (tsk-598 D1-D3) -----------

test('isWorkingTreeClean(repoRoot, ownFileSet) is true when the only dirty path is outside ownFileSet', () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'unrelated.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(repoRoot, new Set(['src/a.mjs'])), true);
});

test('isWorkingTreeClean(repoRoot, ownFileSet) is false when the dirty path IS in ownFileSet', () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'src.mjs'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(repoRoot, new Set(['src.mjs'])), false);
});

test('isWorkingTreeClean(repoRoot) with no ownFileSet argument reproduces the strict pre-tsk-598 default', () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'unrelated.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(repoRoot), false);
});

// --- isFgosOnlyStatusLine's prefix parameter -----------------------------

test('isFgosOnlyStatusLine with no prefix (default) matches only a bare top-level .fgos/ path — unchanged prior behavior', () => {
  assert.equal(isFgosOnlyStatusLine(' M .fgos/events.jsonl'), true);
  assert.equal(isFgosOnlyStatusLine('?? .fgos'), true);
  assert.equal(isFgosOnlyStatusLine(' M sub/.fgos/events.jsonl'), false, 'without a matching prefix, a nested .fgos/ path must not match');
});

test('isFgosOnlyStatusLine with a prefix matches that prefix\'s own .fgos/ path, not a bare top-level one', () => {
  assert.equal(isFgosOnlyStatusLine(' M sub/.fgos/events.jsonl', 'sub/'), true);
  assert.equal(isFgosOnlyStatusLine('?? sub/.fgos', 'sub/'), true);
  assert.equal(isFgosOnlyStatusLine(' M .fgos/events.jsonl', 'sub/'), false, 'a top-level .fgos/ must not match a subdirectory prefix');
  assert.equal(isFgosOnlyStatusLine(' M sub/other.txt', 'sub/'), false, 'a real non-.fgos path under the prefix must still be rejected');
});

// --- isFgosOnlyStatusLine's ownFileSet parameter (tsk-598 D1-D3) ---------

test('isFgosOnlyStatusLine: omitted ownFileSet (default null) still blocks any non-.fgos path — fail-safe, unchanged from before tsk-598', () => {
  assert.equal(isFgosOnlyStatusLine(' M other.txt'), false);
  assert.equal(isFgosOnlyStatusLine(' M other.txt', '', null), false);
});

test('isFgosOnlyStatusLine: a non-.fgos path OUTSIDE ownFileSet is ignorable (does not block)', () => {
  const ownFileSet = new Set(['src/a.mjs']);
  assert.equal(isFgosOnlyStatusLine(' M unrelated.txt', '', ownFileSet), true);
  assert.equal(isFgosOnlyStatusLine('?? unrelated.txt', '', ownFileSet), true);
});

test('isFgosOnlyStatusLine: a non-.fgos path INSIDE ownFileSet still blocks — a real conflict', () => {
  const ownFileSet = new Set(['src/a.mjs']);
  assert.equal(isFgosOnlyStatusLine(' M src/a.mjs', '', ownFileSet), false);
});

test('isFgosOnlyStatusLine: a .fgos/ path is always ignorable regardless of ownFileSet', () => {
  const ownFileSet = new Set(['.fgos/events.jsonl']);
  assert.equal(isFgosOnlyStatusLine(' M .fgos/events.jsonl', '', ownFileSet), true);
  assert.equal(isFgosOnlyStatusLine(' M .fgos/events.jsonl', '', new Set()), true);
});

test('isFgosOnlyStatusLine: a rename line ("a -> b") blocks if EITHER side is in ownFileSet', () => {
  const ownFileSet = new Set(['new-name.txt']);
  assert.equal(isFgosOnlyStatusLine('R  old-name.txt -> new-name.txt', '', ownFileSet), false);
  assert.equal(isFgosOnlyStatusLine('R  old-name.txt -> other-new-name.txt', '', ownFileSet), true);
});

test('buildOwnFileSet: unions committed-diff paths and footprint, normalized the same way frozenJudgeHits normalizes footprint', () => {
  const set = buildOwnFileSet(['src/a.mjs', './src/b.mjs'], ['package.json']);
  assert.deepEqual([...set].sort(), ['package.json', 'src/a.mjs', 'src/b.mjs']);
});

test('buildOwnFileSet: tolerates an absent footprint (item.footprint undefined) and an empty diff', () => {
  assert.deepEqual([...buildOwnFileSet([], undefined)], []);
  assert.deepEqual([...buildOwnFileSet(['src/a.mjs'], undefined)], ['src/a.mjs']);
});

// --- mergeRunnerItem (spike-proven mechanics: --no-commit --no-ff, verify
// on the staged tree BEFORE commit, --abort on any red path) --------------

test('mergeRunnerItem merges cleanly, verify passes, and commits — outcome "merged"', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')));
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('mergeRunnerItem aborts cleanly on a real conflict — main left byte-for-byte unchanged, outcome "conflict"', async () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'base\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'seed shared.txt']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'branch-change\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'branch changes shared.txt']);
  git(repoRoot, ['checkout', 'main']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'main-change\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main changes shared.txt']);

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'conflict');
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'shared.txt'), 'utf8'), 'main-change\n');
});

// tsk-18a D1: `git merge --no-commit --no-ff` can fail WITHOUT ever
// creating MERGE_HEAD -- git refuses up front, before starting the merge,
// when an untracked file at the target checkout collides with a path the
// incoming branch would introduce ("The following untracked working tree
// files would be overwritten by merge"). This is not a real textual
// conflict -- empirically confirmed in a real repo (no mocking): exit 128,
// `git rev-parse --verify MERGE_HEAD` fails. Must be reported as its own
// outcome, carrying the real error, never folded into 'conflict'.
test('mergeRunnerItem reports "merge-failed-unclassified" (not "conflict") when the merge fails without ever creating MERGE_HEAD', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'newfile.txt', 'from-branch\n');

  // A stray untracked file already sitting at the exact path the branch
  // introduces -- e.g. left behind by an interrupted concurrent operation
  // on a shared checkout, the real-world shape this item's own description
  // names.
  fs.writeFileSync(path.join(repoRoot, 'newfile.txt'), 'stray-untracked\n');

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'merge-failed-unclassified');
  assert.equal(result.branch, 'fgw/demo-item');
  assert.match(result.error.stderr, /untracked working tree files would be overwritten/);
  assert.equal(result.error.status, 128);
  assert.throws(
    () => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'MERGE_HEAD must never have existed -- this was never a real conflict',
  );
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'newfile.txt'), 'utf8'), 'stray-untracked\n', 'the stray untracked file must be left exactly as it was');
});

// --- mergeRunnerItem: decision-ID collision auto-resolve (tsk-3mv-1 D1a) ---
// Mirrors the real occurrence (tsk-66l,
// docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md):
// two branches independently pick the same "next free" decision id and each
// insert their own row for it into docs/decisions/0000-index.md at the same
// position, while adding two DIFFERENT decision files under that id.

function writeDecisionIndex(repoRoot, rows) {
  const content = ['---', 'title: index', '---', '', '# Index', '', ...rows, ''].join('\n');
  fs.mkdirSync(path.join(repoRoot, 'docs/decisions'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs/decisions/0000-index.md'), content);
}

function writeDecisionFile(repoRoot, id, slug, title) {
  const relPath = `docs/decisions/${id}-${slug}.md`;
  const content = ['---', `title: ${id} — ${title}`, '---', '', `# ${id} — ${title}`, '', 'body', ''].join('\n');
  fs.mkdirSync(path.join(repoRoot, 'docs/decisions'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, relPath), content);
  return relPath;
}

test('mergeRunnerItem self-resolves a decision-ID collision (both sides independently claim the same next-free id under two different files) -- renumbers the branch\'s file to the real next-free id, keeps both rows, outcome "merged" with selfResolved', async () => {
  const repoRoot = initRepo();
  writeDecisionFile(repoRoot, '0021', 'x', 'X');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'seed decisions']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  writeDecisionFile(repoRoot, '0022', 'branch-decision', 'Branch decision');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |', '| [0022](0022-branch-decision.md) | Branch decision |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'branch: add 0022']);
  git(repoRoot, ['checkout', 'main']);

  writeDecisionFile(repoRoot, '0022', 'main-decision', 'Main decision');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |', '| [0022](0022-main-decision.md) | Main decision |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'main: add 0022']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  assert.equal(result.outcome, 'merged');
  assert.equal(result.selfResolved, true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0022-branch-decision.md')), false, 'branch\'s colliding file must be renamed away, not left under its old id');
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0023-branch-decision.md')), true, 'renamed to the real next-free id (0021,0022 already taken)');
  const renamed = fs.readFileSync(path.join(repoRoot, 'docs/decisions/0023-branch-decision.md'), 'utf8');
  assert.match(renamed, /title: 0023 — Branch decision/, 'frontmatter title self-reference must be rewritten to the new id');
  assert.match(renamed, /^# 0023 — Branch decision/m, 'heading self-reference must be rewritten to the new id');
  const index = fs.readFileSync(path.join(repoRoot, 'docs/decisions/0000-index.md'), 'utf8');
  assert.doesNotMatch(index, /<<<<<<</, 'no leftover conflict markers');
  assert.match(index, /\| \[0022\]\(0022-main-decision\.md\) \| Main decision \|/, 'ours (main\'s own) row is never touched');
  assert.match(index, /\| \[0023\]\(0023-branch-decision\.md\) \| Branch decision \|/, 'theirs row reflects the rename, both rows kept');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('mergeRunnerItem self-resolves a purely positional decision-index collision (two DIFFERENT, non-colliding ids inserted at the same position) without renumbering either side', async () => {
  const repoRoot = initRepo();
  writeDecisionFile(repoRoot, '0021', 'x', 'X');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'seed decisions']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  writeDecisionFile(repoRoot, '0030', 'branch-only', 'Branch only');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |', '| [0030](0030-branch-only.md) | Branch only |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'branch: add 0030']);
  git(repoRoot, ['checkout', 'main']);

  writeDecisionFile(repoRoot, '0025', 'main-only', 'Main only');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |', '| [0025](0025-main-only.md) | Main only |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'main: add 0025']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  assert.equal(result.outcome, 'merged');
  assert.equal(result.selfResolved, true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0030-branch-only.md')), true, 'no collision -- branch\'s file keeps its own id, never renamed');
  const index = fs.readFileSync(path.join(repoRoot, 'docs/decisions/0000-index.md'), 'utf8');
  assert.doesNotMatch(index, /<<<<<<</);
  const rowOrder = [...index.matchAll(/\| \[(\d{4})\]/g)].map((m) => m[1]);
  assert.deepEqual(rowOrder, ['0021', '0025', '0030'], 'both new rows kept, in numeric order');
});

test('mergeRunnerItem does NOT self-resolve a same-row edit dispute inside docs/decisions/0000-index.md (both sides change the SAME existing row\'s text) -- classifyDecisionIndexCollision returns null, outcome stays "conflict"', async () => {
  const repoRoot = initRepo();
  writeDecisionFile(repoRoot, '0021', 'x', 'X');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | Original |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'seed decisions']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | Branch-edited |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'branch: edit 0021 row text']);
  git(repoRoot, ['checkout', 'main']);

  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | Main-edited |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'main: edit 0021 row text']);

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'conflict');
  assert.equal(result.selfResolved, undefined, 'a same-row edit must never be reported as self-resolved');
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged -- an edit dispute is never auto-resolved');
  assert.equal(isWorkingTreeClean(repoRoot), true);
  assert.equal(fs.readFileSync(path.join(repoRoot, 'docs/decisions/0000-index.md'), 'utf8'), '---\ntitle: index\n---\n\n# Index\n\n| [0021](0021-x.md) | Main-edited |\n', 'main\'s own row content is untouched after the abort');
});

test('classifyDecisionIndexCollision returns null for a same-row edit dispute even in isolation (shared link target between ours/theirs)', async () => {
  const repoRoot = initRepo();
  writeDecisionFile(repoRoot, '0021', 'x', 'X');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | Original |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'seed decisions']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | Branch-edited |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'branch: edit 0021 row text']);
  git(repoRoot, ['checkout', 'main']);

  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | Main-edited |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'main: edit 0021 row text']);

  try {
    git(repoRoot, ['merge', '--no-commit', '--no-ff', 'fgw/demo-item']);
    assert.fail('expected the merge to conflict');
  } catch {
    // expected -- stay mid-conflict to classify it, same state mergeRunnerItemLocked sees
  }
  assert.equal(classifyDecisionIndexCollision(repoRoot), null);
  git(repoRoot, ['merge', '--abort']);
});

test('mergeRunnerItem does NOT self-resolve when the conflict is not confined to docs/decisions/0000-index.md (an otherwise-self-resolvable index collision alongside an unrelated real conflict)', async () => {
  const repoRoot = initRepo();
  writeDecisionFile(repoRoot, '0021', 'x', 'X');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'base\n');
  git(repoRoot, ['add', 'docs/decisions', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'seed decisions + shared.txt']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  writeDecisionFile(repoRoot, '0022', 'branch-decision', 'Branch decision');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |', '| [0022](0022-branch-decision.md) | Branch decision |']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'branch-change\n');
  git(repoRoot, ['add', 'docs/decisions', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'branch: add 0022 + edit shared.txt']);
  git(repoRoot, ['checkout', 'main']);

  writeDecisionFile(repoRoot, '0022', 'main-decision', 'Main decision');
  writeDecisionIndex(repoRoot, ['| [0021](0021-x.md) | X |', '| [0022](0022-main-decision.md) | Main decision |']);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'main-change\n');
  git(repoRoot, ['add', 'docs/decisions', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main: add 0022 + edit shared.txt']);

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'conflict');
  assert.equal(result.selfResolved, undefined);
  assert.equal(headOf(repoRoot), headBefore);
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('mergeRunnerItem aborts cleanly when the staged merge fails its own verify — main left unchanged, outcome "verify-fail"', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f required-file-never-produced.txt' }));
  assert.equal(result.outcome, 'verify-fail');
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort');
  assert.equal(fs.existsSync(path.join(repoRoot, 'produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');
});

// A real pre-commit hook (e.g. this repo's own .githooks/pre-commit main-
// checkout-lock guard) refusing the commit is a distinct failure mode from
// a merge conflict or a failed verify: the merge --no-commit already landed
// cleanly and verify already passed — only the final `git commit` itself
// fails. Every other failure branch in mergeRunnerItem aborts the merge
// before returning/throwing; this one must too, or a commit-hook refusal
// leaves a half-applied `--no-commit` merge sitting in the checkout.
test('mergeRunnerItem aborts the merge when "git commit" itself fails (e.g. a refusing pre-commit hook) — main left unchanged', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const hookPath = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hookPath, '#!/bin/sh\necho "refused by test hook" >&2\nexit 1\n');
  fs.chmodSync(hookPath, 0o755);

  const headBefore = headOf(repoRoot);
  await assert.rejects(
    () => mergeRunnerItem(repoRoot, makeItem({ verify: 'true' })),
    /verify passed for "fgw\/demo-item" but "git commit" failed/,
  );
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after the aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort, not left mid-merge');
  assert.equal(fs.existsSync(path.join(repoRoot, 'produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');
});

// tsk-50i7: the thrown MergeError's own `.message` only ever carried
// execFileSync's generic wrapper text ("Command failed: git commit
// --no-edit"), never the real git reason (hook rejection, nothing to
// commit, missing identity, ...) that lives on the underlying error's
// `.stderr` — diverging from this same file's own convention (the `git()`
// helper already captures stderr on every call; a sibling catch already
// surfaces it). Pin that `.stderr`/`.status` now reach the caller.
test('mergeRunnerItem carries the real "git commit" stderr/status on its thrown MergeError, not just the generic wrapper message', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const hookPath = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hookPath, '#!/bin/sh\necho "refused by test hook for stderr-pinning" >&2\nexit 1\n');
  fs.chmodSync(hookPath, 0o755);

  let caught;
  try {
    await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
    assert.fail('expected mergeRunnerItem to throw');
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof MergeError, 'must still be a MergeError');
  assert.match(caught.stderr, /refused by test hook for stderr-pinning/, 'the real git stderr must reach the caller, not just the generic execFileSync wrapper message');
  assert.equal(typeof caught.status, 'number', 'the real git commit exit status must reach the caller');
});

// The pre-commit hook only ever locked the final `git commit` — the merge
// --no-commit/verify steps before it ran unprotected, letting a concurrent
// session's own merge/commit land in that window and pull MERGE_HEAD out
// from under this one. mergeRunnerItem now acquires the same lock up front.
test('mergeRunnerItem refuses to even attempt the merge when another identity already holds the main-checkout lock', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const fgosDir = path.join(repoRoot, '.fgos');
  const otherLock = acquireMainCheckoutLock(fgosDir, { identity: 'a-different-live-session' });
  assert.equal(otherLock.status, ACQUIRED);

  const headBefore = headOf(repoRoot);
  await assert.rejects(
    () => mergeRunnerItem(repoRoot, makeItem({ verify: 'true' })),
    (err) => {
      assert.match(err.message, /cannot merge "fgw\/demo-item": main checkout is locked by another live session/);
      // tsk-6c2: a caller-side retry wrapper needs a way to tell "lock
      // contested, worth retrying" apart from a real merge conflict or
      // verify failure — errorClass/category alone can't (both are always
      // 'merge-fail'). This `code` is that discriminator.
      assert.equal(err.code, 'lock-held');
      assert.equal(typeof err.remainingTtlMs, 'number');
      return true;
    },
  );
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged — the merge must never even start while locked');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must stay clean — refusing before the merge means nothing was ever staged');
});

// tsk-2eq: a leaf approve calls mergeRunnerItem with an ephemeral,
// freshly-.fgos-stripped worktree as `repoRoot` (the git-op cwd) — before
// this fix, the lock resolved against that same ephemeral path and so
// never contended with a real concurrent leaf merge. The two tests below
// simulate that shape with two separate directories: `repoRoot` (a real
// git checkout, standing in for the ephemeral worktree) and `lockRoot` (a
// plain directory, standing in for the real main checkout).
test('mergeRunnerItem resolves the main-checkout lock against lockRoot, not repoRoot', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-lockroot-'));

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }), { lockRoot });

  assert.equal(result.outcome, 'merged');
  assert.equal(fs.existsSync(path.join(lockRoot, '.fgos')), true, 'the lock directory must be created under lockRoot');
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos')), false, 'repoRoot must never receive a lock directory when lockRoot is set explicitly');
});

test('mergeRunnerItem refuses when lockRoot (not repoRoot) already holds the main-checkout lock — proves a leaf-approve-shaped call now actually contends', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-lockroot-'));

  const fgosDir = path.join(lockRoot, '.fgos');
  const otherLock = acquireMainCheckoutLock(fgosDir, { identity: 'a-different-live-session' });
  assert.equal(otherLock.status, ACQUIRED);

  const headBefore = headOf(repoRoot);
  await assert.rejects(
    () => mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }), { lockRoot }),
    (err) => {
      assert.equal(err.code, 'lock-held');
      return true;
    },
  );
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged — refused before the merge ever started');
});

test('mergeRunnerItem: an ambiguous (unparseable) lock file carries code "lock-ambiguous", distinct from "lock-held" -- a retry wrapper must never retry this one either', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'main-checkout.lock'), 'not json at all {{{');

  await assert.rejects(
    () => mergeRunnerItem(repoRoot, makeItem({ verify: 'true' })),
    (err) => {
      assert.match(err.message, /main checkout lock is ambiguous/);
      assert.equal(err.code, 'lock-ambiguous');
      return true;
    },
  );
});

test('mergeRunnerItem merges normally when the lock is free, and releases it afterward', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');

  // Lock released (not left held past this call) — a second, differently-
  // identified caller must be able to acquire it immediately afterward.
  const fgosDir = path.join(repoRoot, '.fgos');
  const afterLock = acquireMainCheckoutLock(fgosDir, { identity: 'someone-else' });
  assert.equal(afterLock.status, ACQUIRED, 'lock must be released after a successful merge, not left held');
});

// tsk-3yl: idempotent already-merged branch (docs/backlog.md p-b91d487a) —
// a prior approve run already landed the merge commit but died at a LATER
// step, so a retry finds the branch already an ancestor of HEAD. Reproduced
// here by fast-forwarding the merge in directly (bypassing mergeRunnerItem
// entirely), simulating "a prior successful run already committed it".

test('mergeRunnerItem is idempotent: a branch already merged into HEAD returns outcome "merged" without attempting a redundant commit', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  // Simulate an earlier, already-successful merge that landed the commit.
  git(repoRoot, ['merge', '--no-ff', '-q', '-m', 'earlier successful merge', 'fgw/demo-item']);
  const headAfterFirstMerge = headOf(repoRoot);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');
  assert.equal(result.check.passed, true);
  assert.equal(headOf(repoRoot), headAfterFirstMerge, 'no new commit should be created for an already-merged branch');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('mergeRunnerItem on an already-merged branch still re-runs verify and returns "verify-fail" if HEAD has since regressed', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  git(repoRoot, ['merge', '--no-ff', '-q', '-m', 'earlier successful merge', 'fgw/demo-item']);

  // Something else broke on HEAD since that earlier merge landed.
  fs.unlinkSync(path.join(repoRoot, 'produced.txt'));
  git(repoRoot, ['add', '-A']);
  git(repoRoot, ['commit', '-q', '-m', 'unrelated regression removes produced.txt']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'verify-fail');
  assert.equal(result.check.passed, false);
});

// tsk-2j9: `abortMergeIfPossible` guards every abort call in
// `mergeRunnerItemLocked` against a genuine `git merge --no-commit --no-ff`
// no-op (branch already an ancestor of HEAD by merge-attempt time — the
// TOCTOU window between `isAlreadyMerged`'s pre-check and this call, e.g. a
// main-checkout writer that bypasses `acquireMainCheckoutLock`). That no-op
// exits 0 with "Already up to date." and creates no `MERGE_HEAD`, so the
// unconditional `git merge --abort` this replaced used to crash with
// "fatal: There is no merge to abort (MERGE_HEAD missing)" on the very next
// abort attempt. `isAlreadyMerged`'s own ancestor check and git's own
// up-to-date determination test the same condition, so this scenario is not
// reproducible through `mergeRunnerItem`'s public entry point without real
// concurrency — these two tests instead prove the exported guard directly,
// the same direct-unit-test pattern this file already uses for the other
// merge-conflict helpers (`classifyDecisionIndexCollision` and siblings).

test('abortMergeIfPossible is a no-op when there is no MERGE_HEAD (the tsk-2j9 no-op-merge case) — never throws "no merge to abort"', () => {
  const repoRoot = initRepo();
  const headBefore = headOf(repoRoot);

  assert.doesNotThrow(() => abortMergeIfPossible(repoRoot));

  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be untouched');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('abortMergeIfPossible still aborts a real in-progress merge when MERGE_HEAD does exist', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  git(repoRoot, ['merge', '--no-commit', '--no-ff', 'fgw/demo-item']);
  assert.doesNotThrow(() => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']), 'merge must actually be in progress before this test proves anything');
  const headBefore = headOf(repoRoot);

  abortMergeIfPossible(repoRoot);

  assert.throws(() => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']), 'MERGE_HEAD must be gone after the abort');
  assert.equal(headOf(repoRoot), headBefore, 'abort must not move HEAD');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

// tsk-15k: the false-done bug this item fixes — `isAlreadyMerged`'s bare
// `is-ancestor` check is not proof the branch's content is really in HEAD's
// tree. A merge landed with `-s ours` keeps the branch as a real parent
// (so is-ancestor reports true) while discarding 100% of its content.
// Before this fix, a weak/generic verify command (one not scoped to the
// item's own artifact — a real risk this repo's own items can carry, see
// docs/history/merge-verify-only-false-done/CONTEXT.md) let this slip
// through as outcome "merged". This is the constructed repro from
// plan.md's feasibility validation, turned into a permanent regression
// test.

test('mergeRunnerItem does not report "merged" when an already-ancestor branch had its content discarded by an earlier "git merge -s ours"', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  // Simulate a prior merge that kept the branch as a parent (so is-ancestor
  // is true) but discarded all of its content via the "ours" strategy —
  // the exact shape that used to slip past isAlreadyMerged's bare check.
  git(repoRoot, ['merge', '--no-ff', '-s', 'ours', '-q', '-m', 'merge but discard content (ours strategy)', 'fgw/demo-item']);

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'produced.txt')),
    false,
    'sanity check: the -s ours merge must actually have discarded the content',
  );

  // A weak/generic verify command not scoped to the item's own artifact —
  // the exact condition that used to let this slip through as "merged".
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  assert.equal(result.outcome, 'verify-fail');
  assert.equal(result.check.passed, false);
  assert.match(result.check.output, /integrity check failed/);
  assert.match(result.check.output, /produced\.txt/);
});

// tsk-107: branchContentMismatch used to compare the branch's own tree
// against ref's CURRENT tree — so once a LATER, unrelated already-merged
// branch also touched the same path, the branch's own tree would legitimately
// differ from HEAD forever after, even though the branch's real content was
// never discarded. This false-flagged a re-approve of an already-merged item
// as "verify-fail-post-merge" (reproduced live on tsk-2eq right after tsk-15k
// landed this check — see docs/history/ for that item). The fix compares
// against the merge commit itself (firstMerge vs firstMerge^1), which is
// immune to any later commits on the same path.

test('mergeRunnerItem does not false-flag an already-merged branch just because a later unrelated already-merged branch also touched the same file', async () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'line1\n');
  git(repoRoot, ['add', 'shared.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'add shared.txt']);

  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'shared.txt', 'line1\ndemo added\n');
  makeBranchWithCommit(repoRoot, 'fgw/other-item', 'shared.txt', 'other added\nline1\n');

  // Land the unrelated branch first — a real, ordinary merge, no conflict
  // (it edits the top of the file; demo-item edits the bottom).
  git(repoRoot, ['merge', '--no-ff', '-q', '-m', 'merge other-item first', 'fgw/other-item']);

  // First real merge of demo-item: a normal 3-way merge combining both
  // edits — exercises the ordinary (not-yet-ancestor) path.
  const firstResult = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  assert.equal(firstResult.outcome, 'merged');
  assert.equal(
    fs.readFileSync(path.join(repoRoot, 'shared.txt'), 'utf8'),
    'other added\nline1\ndemo added\n',
  );

  // Re-approving the now-already-merged demo-item is exactly the path that
  // runs branchContentMismatch. shared.txt legitimately differs between
  // demo-item's own branch tip ("line1\ndemo added\n") and current HEAD
  // ("other added\nline1\ndemo added\n") — that must not be mistaken for
  // discarded content.
  const secondResult = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  assert.equal(secondResult.outcome, 'merged');
  assert.equal(secondResult.check.passed, true);
});

// --- mergeRunnerItem rejects a .fgos/ write on the branch (ADR0020) -------
//
// worktree.mjs's createWorktree no longer checks .fgos/ out into a worker's
// worktree at all, so this should never trigger from an ordinary dispatch —
// it is the trusted-side backstop for the residual case: a worker `mkdir`s
// a fresh `.fgos/` itself and commits it despite having no checked-out copy
// to begin with. `git add`/`git commit` do not care whether a path was
// pre-existing; approve must still refuse it.

test('mergeRunnerItem refuses a branch that stages a change under .fgos/ — main left byte-for-byte unchanged, outcome "fgos-write-rejected"', async () => {
  const repoRoot = initRepo();
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.mkdirSync(path.join(repoRoot, '.fgos'));
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(repoRoot, ['add', '.fgos/events.jsonl']);
  git(repoRoot, ['commit', '-q', '-m', 'worker wrote .fgos/events.jsonl']);
  git(repoRoot, ['checkout', 'main']);

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'fgos-write-rejected');
  assert.deepEqual(result.paths, ['.fgos/events.jsonl']);
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort');
});

test('mergeRunnerItem merges normally when the branch touches ordinary files alongside an untouched .fgos/', async () => {
  const repoRoot = initRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'));
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(repoRoot, ['add', '.fgos/events.jsonl']);
  git(repoRoot, ['commit', '-q', '-m', 'seed .fgos/events.jsonl on main']);

  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')));
});

// --- withMergeEphemeralWorktree's CAS guard (tsk-46a) ---------------------
// Reproduces the race deterministically, without real concurrency: git only
// refuses a second checkout of the same BRANCH -- a detached checkout of the
// same COMMIT is unrestricted (worktree.mjs's own module doc on
// createDetachedMergeWorktree) -- so nesting one withMergeEphemeralWorktree
// call inside another's `fn`, both against the same root branch, gives two
// independent ephemeral checkouts starting from the SAME tip, exactly like
// two sessions approving different leaves of the same root near-
// simultaneously. The inner call (session B) runs to completion first and
// lands its own branch -f; the outer call (session A) only resumes and
// attempts its own branch -f afterward, using its now-stale startCommit --
// the same interleaving the item's own description verified experimentally.

test('withMergeEphemeralWorktree refuses to force-move the branch when it moved since this call started (concurrent merge already landed) -- the losing commit is never silently discarded', async () => {
  const repoRoot = initRepo();
  git(repoRoot, ['branch', 'fgw/root-item']);

  let bCommit;
  await assert.rejects(
    withMergeEphemeralWorktree(repoRoot, 'root-item', async (ephemeralA) => {
      fs.writeFileSync(path.join(ephemeralA.path, 'from-a.txt'), 'a\n');
      git(ephemeralA.path, ['add', 'from-a.txt']);
      git(ephemeralA.path, ['commit', '-q', '-m', 'session A commit']);

      // Session B interleaves here, starting from the same tip A started
      // from (the branch has not moved yet), and lands completely before A
      // resumes.
      await withMergeEphemeralWorktree(repoRoot, 'root-item', async (ephemeralB) => {
        fs.writeFileSync(path.join(ephemeralB.path, 'from-b.txt'), 'b\n');
        git(ephemeralB.path, ['add', 'from-b.txt']);
        git(ephemeralB.path, ['commit', '-q', '-m', 'session B commit']);
      });
      bCommit = git(repoRoot, ['rev-parse', 'fgw/root-item']).trim();

      // fnA returns here; the outer call now tries to force-move
      // fgw/root-item to A's own end commit, built on the now-stale
      // startCommit -- this must be refused, not silently overwrite B.
    }),
    (err) => {
      assert.match(err.message, /refusing to force-move "fgw\/root-item"/);
      assert.equal(err.errorClass, 'worktree-fail');
      assert.equal(err.category, 'worktree-fail');
      return true;
    },
  );

  assert.equal(
    git(repoRoot, ['rev-parse', 'fgw/root-item']).trim(),
    bCommit,
    "session B's commit must still be the branch tip -- A's rejected force-move must not have touched it",
  );
});

test('withMergeEphemeralWorktree still force-moves normally when nothing else touched the branch in the meantime', async () => {
  const repoRoot = initRepo();
  git(repoRoot, ['branch', 'fgw/root-item']);

  const result = await withMergeEphemeralWorktree(repoRoot, 'root-item', async (ephemeral) => {
    fs.writeFileSync(path.join(ephemeral.path, 'solo.txt'), 'solo\n');
    git(ephemeral.path, ['add', 'solo.txt']);
    git(ephemeral.path, ['commit', '-q', '-m', 'solo commit']);
    return 'ok';
  });

  assert.equal(result, 'ok');
  const tipFile = git(repoRoot, ['show', 'fgw/root-item:solo.txt']).trim();
  assert.equal(tipFile, 'solo');
});

// --- cleanupMergedBranch -------------------------------------------------

test('cleanupMergedBranch deletes the now-fully-merged branch and never throws', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));

  const result = cleanupMergedBranch(repoRoot, 'fgw/demo-item');
  assert.deepEqual(result.warnings, []);
  const branches = git(repoRoot, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branches, /fgw\/demo-item/);
});

test('cleanupMergedBranch never throws even if the branch is already gone (idempotent, reports a warning instead)', () => {
  const repoRoot = initRepo();
  const result = cleanupMergedBranch(repoRoot, 'fgw/never-existed');
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /branch delete failed/);
});

// --- detectTrunk on a master-trunk repo (human-added per reject reason, ---
// --- dogfood item bo-hardcode-ten-trunk: the fix must hold when the     ---
// --- host repo's trunk is named `master`, not `main`)                   ---

function initMasterRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-master-'));
  execFileSync('git', ['init', '-q', '-b', 'master'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return repoRoot;
}

test('detectTrunk resolves "master" on a repo whose only trunk branch is master (no origin remote)', () => {
  const repoRoot = initMasterRepo();
  assert.equal(detectTrunk(repoRoot), 'master');
});

test('reviewDiff diffs a runner branch against the detected master trunk (no hardcoded main)', () => {
  const repoRoot = initMasterRepo();
  const item = makeItem();
  makeBranchWithCommitOn(repoRoot, 'master', branchNameFor(item.id), 'change.txt', 'branch change\n');
  const out = reviewDiff(repoRoot, item);
  assert.equal(out.source, 'runner');
  assert.match(out.diff, /change\.txt/);
});

function makeBranchWithCommitOn(repoRoot, trunk, branch, filename, content) {
  git(repoRoot, ['checkout', '-b', branch]);
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `on ${branch}`]);
  git(repoRoot, ['checkout', trunk]);
}

// --- detectTrunk via the origin/HEAD target (the FIRST resolution branch) ---
// A cloned repo carries refs/remotes/origin/HEAD as a symbolic ref to the
// remote's own default branch. detectTrunk prefers that over any local
// main/master guess. The upstream default branch is deliberately named
// neither `main` nor `master`, so a passing assertion can only come from the
// origin/HEAD path firing — never from the fallback loop.

function initClonedRepoWithOriginHead(defaultBranch) {
  const upstream = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-upstream-'));
  execFileSync('git', ['init', '-q', '-b', defaultBranch], { cwd: upstream });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: upstream });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: upstream });
  fs.writeFileSync(path.join(upstream, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: upstream });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: upstream });

  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-clone-'));
  execFileSync('git', ['clone', '-q', upstream, clone]);
  return clone;
}

test('detectTrunk resolves the origin/HEAD target branch, not the local main/master fallback', () => {
  const repoRoot = initClonedRepoWithOriginHead('release-line');
  assert.equal(detectTrunk(repoRoot), 'release-line');
});

// --- repo-invariant gate + redundant-check skip (tsk-516) ------------------
//
// docs/history/tsk-516-approve-reverify-scope/CONTEXT.md D3/D4 (the gate)
// and D5 (the skip). The skip is the dangerous half: a false positive lands
// a tree nobody verified on main, so both directions are pinned below, and
// the "does skip" cases are written so that ANY unwanted execution would be
// visibly red (the item's verify and the invariant command are both set to
// commands that fail).

function configureInvariantChecks(repoRoot, commands) {
  writeSharedConfig(repoRoot, { invariantChecks: { commands } });
}

function tipOf(repoRoot, branch) {
  return git(repoRoot, ['rev-parse', branch]).trim();
}

test('a red repo-invariant check blocks the merge even when the item verify is green', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  configureInvariantChecks(repoRoot, ['exit 9']);
  const before = headOf(repoRoot);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));

  assert.equal(result.outcome, 'verify-fail');
  assert.match(result.check.output, /repo-invariant check failed: exit 9/);
  assert.equal(headOf(repoRoot), before, 'the merge must be aborted, leaving HEAD untouched');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'the aborted merge must leave no half-merged tree behind');
});

test('a green repo-invariant check lets the merge land', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  configureInvariantChecks(repoRoot, ['exit 0']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));

  assert.equal(result.outcome, 'merged');
  assert.equal(fs.existsSync(path.join(repoRoot, 'produced.txt')), true);
});

// Backward compatibility: every repo that never opted in must behave exactly
// as it did before this gate existed.
test('no invariantChecks config means no invariant check runs at merge', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));

  assert.equal(result.outcome, 'merged');
});

// D5, the skip direction. `verify: 'exit 1'` and a failing invariant command
// would BOTH fail if they ran — so a 'merged' outcome here is proof neither
// was executed, not merely that they happened to pass.
test('D5: the merged tree already verified at return skips both the verify and the invariant checks', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  configureInvariantChecks(repoRoot, ['exit 9']);
  const branchHeadAtReturn = tipOf(repoRoot, 'fgw/demo-item');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', branchHeadAtReturn }));

  assert.equal(result.outcome, 'merged');
  assert.equal(result.check.passed, true);
  assert.equal(result.check.skipped, true);
  assert.match(result.check.output, /verify skipped: the merged tree is identical to/);
  assert.match(result.check.output, new RegExp(branchHeadAtReturn));
});

// D5, the must-NOT-skip direction — the one whose failure would be silent.
// main advancing by a single commit means the merged tree is no longer the
// tree that was verified, so the checks have to run again.
test('D5: main advancing past the fork forces the checks to run again', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const branchHeadAtReturn = tipOf(repoRoot, 'fgw/demo-item');
  fs.writeFileSync(path.join(repoRoot, 'moved-on.txt'), 'main moved\n');
  git(repoRoot, ['add', 'moved-on.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main advanced after the return']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', branchHeadAtReturn }));

  assert.equal(result.outcome, 'verify-fail', 'the verify must actually run, and its red must be honoured');
  assert.notEqual(result.check.skipped, true);
});

// A commit pushed onto the branch after `return` is unverified content: the
// recorded SHA no longer matches the tip, so the skip must not apply.
test('D5: a branch tip that moved past branchHeadAtReturn forces the checks to run again', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const branchHeadAtReturn = tipOf(repoRoot, 'fgw/demo-item');
  git(repoRoot, ['checkout', '-q', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'added-after-return.txt'), 'unverified\n');
  git(repoRoot, ['add', 'added-after-return.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'pushed after the return']);
  git(repoRoot, ['checkout', '-q', 'main']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', branchHeadAtReturn }));

  assert.equal(result.outcome, 'verify-fail');
  assert.notEqual(result.check.skipped, true);
});

// A main-source return records headAtReturn, never branchHeadAtReturn — so
// it can never satisfy the skip condition, and must always be checked.
test('D5: an item with no branchHeadAtReturn is never eligible for the skip', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', headAtReturn: headOf(repoRoot) }));

  assert.equal(result.outcome, 'verify-fail');
  assert.notEqual(result.check.skipped, true);
});
