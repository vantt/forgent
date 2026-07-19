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
} from '../../src/runner/merge.mjs';
import { branchNameFor } from '../../src/runner/worktree.mjs';

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

test('reviewDiff for a runner item diffs main...fgw/<id> and carries no warnings', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const result = reviewDiff(repoRoot, makeItem());
  assert.equal(result.source, 'runner');
  assert.match(result.diff, /produced\.txt/);
  assert.deepEqual(result.warnings, []);
});

test('reviewDiff for a runner item with an explicit opts.trunk diffs against that trunk instead of main (D3)', () => {
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

test('changedFiles honors an explicit opts.trunk (leaf diffs against its parent root, not main — D3)', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/parent-root', 'root-only.txt', 'root\n');
  git(repoRoot, ['checkout', 'fgw/parent-root']);
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'leaf-only.txt', 'leaf\n');
  git(repoRoot, ['checkout', 'main']);
  assert.deepEqual(changedFiles(repoRoot, makeItem(), { trunk: 'fgw/parent-root' }), ['leaf-only.txt']);
});

test('changedFiles returns an empty array for a pull-source item (Iron Law approve-check is runner-only, D16)', () => {
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

// --- isFgosOnlyStatusLine's prefix parameter -----------------------------

test('isFgosOnlyStatusLine with no prefix (default) matches only a bare top-level .fgos/ path — unchanged pre-STR60 behavior', () => {
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
