import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  classifySource,
  reviewDiff,
  mergeRunnerItem,
  withMergeTargetSlot,
  cleanupMergedBranch,
  changedFiles,
  isWorkingTreeClean,
  isFgosOnlyStatusLine,
  buildOwnFileSet,
  classifyDecisionIndexCollision,
  abortMergeIfPossible,
  formatFgosWriteRejectedDetail,
  detectPostLandDrift,
  performCatchUp,
  MergeError,
} from '../../src/runner/merge.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';
// detectTrunk moved to runner/worktree.mjs (tsk-49i D1) — its cases stay in
// this file, next to the merge behavior that resolves a target through it.
import { branchNameFor, withMergeEphemeralWorktree, detectTrunk } from '../../src/runner/worktree.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import { acquireMainCheckoutLock, mergeSlotLockFile, ACQUIRED, DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';

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

// --- tsk-70l fanout-multiprocess helpers --------------------------------
// Mirrors merge-target-slot-multiprocess.test.mjs's own rationale for
// tsk-1wr's sibling fix: `resolveWriterIdentity` hands two real forked
// processes that share an inherited env session id the exact SAME string
// identity, a shape a same-process (in-memory) test cannot construct. Two
// SEPARATE repos share only `lockRoot` (mergeRunnerItem's own parameter,
// proven by tsk-2eq's "resolves the lock against lockRoot, not repoRoot")
// so a wrongly-admitted second merge lands on its own repo, never racing
// the held child's real git state.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FANOUT_MARKER_WAIT_MS = 20_000;

function makeLockRoot() {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fanout-mp-lockroot-'));
  fs.mkdirSync(path.join(lockRoot, '.fgos'), { recursive: true });
  return lockRoot;
}

/** A child that runs the REAL mergeRunnerItem root->main path (no
 * targetSlot) against its own repo, with a verify command that announces
 * itself via `heldMarker` then busy-waits for `releaseMarker` — pausing
 * WHILE the lock is held, before any commit, the same "hold on a
 * condition, never a sleep" discipline the target-slot precedent uses. */
function writeFanoutHolderChild(dir) {
  const childPath = path.join(dir, 'fanout-holder-child.mjs');
  fs.writeFileSync(
    childPath,
    `import { mergeRunnerItem } from ${JSON.stringify(path.join(REPO_ROOT, 'src/runner/merge.mjs'))};

const [repoRoot, lockRoot, branch, heldMarker, releaseMarker] = process.argv.slice(2);
const verify = 'node -e ' + JSON.stringify(
  "require('fs').writeFileSync(" + JSON.stringify(heldMarker) + ",'1');" +
  "const s=Date.now();" +
  "while(!require('fs').existsSync(" + JSON.stringify(releaseMarker) + ") && Date.now()-s<15000){}"
);

try {
  const result = await mergeRunnerItem(repoRoot, { id: branch.replace('fgw/', ''), verify }, { lockRoot });
  process.stdout.write('CHILD_OUTCOME:' + result.outcome + '\\n');
  process.exit(0);
} catch (err) {
  process.stdout.write('CHILD_ERROR:' + err.message + '\\n');
  process.exit(1);
}
`,
    'utf8',
  );
  return childPath;
}

async function waitForFile(filePath, deadlineMs = FANOUT_MARKER_WAIT_MS) {
  const deadline = Date.now() + deadlineMs;
  while (!fs.existsSync(filePath)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${filePath}`);
    await new Promise((r) => setTimeout(r, 10));
  }
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

// tsk-3tp-1 (D2): the merge commit ITSELF sweeps up whatever is dirty under
// `.fgos/events/` at merge time — no dedicated checkpoint commit needed for
// the common case where a merge happens often enough to carry it along.
test('mergeRunnerItem sweeps a dirty untracked .fgos/events/ shard file into its own merge commit', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const eventsDir = path.join(repoRoot, '.fgos', 'events');
  fs.mkdirSync(eventsDir, { recursive: true });
  const shardPath = path.join(eventsDir, 'writer-a-20260101T000000Z.jsonl');
  fs.writeFileSync(shardPath, '{"id":"e1"}\n');

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');

  // A merge commit has two parents — plain `diff-tree`/`diff-tree -r` prints
  // nothing for one unless told which parent(s) to diff against; `-m` diffs
  // against each parent in turn, same as `git show`'s own default for a
  // merge commit.
  const mergeCommitFiles = git(repoRoot, ['diff-tree', '--no-commit-id', '--name-only', '-r', '-m', headOf(repoRoot)]);
  assert.match(
    mergeCommitFiles,
    /\.fgos\/events\/writer-a-20260101T000000Z\.jsonl/,
    'the shard file must ride along inside the merge commit itself, not be left uncommitted',
  );
  assert.equal(isWorkingTreeClean(repoRoot), true, 'nothing should be left dirty after the sweep');
  assert.notEqual(headOf(repoRoot), headBefore);

  // Exactly one new commit landed — the merge commit itself — never a
  // separate dedicated checkpoint commit riding alongside it.
  // `--first-parent` walks only main's OWN lineage (never descending into
  // the just-merged branch's pre-existing commit, which `headBefore..HEAD`
  // alone would also include — that commit already existed before this
  // call ran, so it is not "new" in the sense this assertion cares about):
  // exactly one first-parent commit landing on main means the sweep really
  // did ride the merge commit itself, never a separate commit alongside it.
  const newCommitSubjects = git(repoRoot, ['log', '--first-parent', '--format=%s', `${headBefore}..HEAD`])
    .trim()
    .split('\n');
  assert.equal(newCommitSubjects.length, 1, 'the sweep must ride the merge commit, never add a commit of its own');
  assert.doesNotMatch(newCommitSubjects[0], /periodic events\.jsonl checkpoint|fallback events checkpoint/);
});

// tsk-3tp (fix, review r1): `.fgos` only ever exists under `lockRoot` — it is
// stripped from every ephemeral worktree per ADR0020 (see
// `docs/explanation/why-mergerunneritem-takes-a-separate-lockroot-param.md`),
// exactly the shape a leaf->parent approve or promote-engine merge passes in
// (`lockRoot` set explicitly, distinct from the ephemeral `repoRoot` used as
// the git-op cwd). Before this fix the sweep computed its pathspecs relative
// to `repoRoot` and ran `git status`/`git add` with `cwd: repoRoot` — a
// pathspec pointing at a sibling directory (`lockRoot`) that git refuses as
// "outside repository", silently swallowed by the surrounding catch, so the
// shard was never swept for this whole class of merges. Two separate real
// repos stand in for the ephemeral worktree (`repoRoot`) and the real main
// checkout (`lockRoot`), same shape as the "resolves the main-checkout lock
// against lockRoot" test below.
test('mergeRunnerItem sweeps a dirty .fgos/events/ shard under lockRoot (not repoRoot) into lockRoot\'s own index when lockRoot !== repoRoot', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const lockRoot = initRepo();
  const eventsDir = path.join(lockRoot, '.fgos', 'events');
  fs.mkdirSync(eventsDir, { recursive: true });
  const shardPath = path.join(eventsDir, 'writer-a-20260101T000000Z.jsonl');
  fs.writeFileSync(shardPath, '{"id":"e1"}\n');

  const lockRootHeadBefore = headOf(lockRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }), { lockRoot });
  assert.equal(result.outcome, 'merged');

  const lockRootStatus = git(lockRoot, ['status', '--porcelain']);
  assert.match(
    lockRootStatus,
    /^A\s+\.fgos\/events\/writer-a-20260101T000000Z\.jsonl$/m,
    'the dirty shard living under lockRoot must be staged (git add) even though the merge commit itself lands in repoRoot',
  );
  assert.equal(
    headOf(lockRoot),
    lockRootHeadBefore,
    'lockRoot itself must not gain a new commit from the sweep — only staged, ready to ride lockRoot\'s own next commit (e.g. the 1h fallback or a later root->main approve)',
  );
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

// tsk-4hj D1/D2/D3: a MERGE_HEAD already on disk BEFORE mergeRunnerItem's
// own `git merge --no-commit --no-ff` attempt ever runs belongs to a
// DIFFERENT item's in-progress/abandoned merge -- git itself refuses
// ("You have not concluded your merge") whenever this is true, regardless
// of which branch it belongs to. The pre-tsk-4hj code read
// mergeHeadExists() only AFTER this call failed, which could not tell
// "created by this call" apart from "already there before it ran", and
// misclassified this case as this call's own genuine conflict -- then
// called `git merge --abort`, discarding the OTHER item's real merge
// state. Must be reported as its own outcome, and must never touch the
// leftover MERGE_HEAD at all.
test('mergeRunnerItem reports "merge-blocked-other-item" (not "conflict") and never touches a pre-existing MERGE_HEAD from a different branch', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/other-item', 'other.txt', 'other-item content\n');
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'newfile.txt', 'clean-content\n');

  // Simulate another item's in-progress/abandoned merge already staged on
  // the main checkout, left behind by a session that has not yet
  // committed or aborted it.
  git(repoRoot, ['merge', '--no-commit', '--no-ff', 'fgw/other-item']);
  assert.doesNotThrow(
    () => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'fixture setup must actually leave a real MERGE_HEAD behind',
  );

  const headBefore = headOf(repoRoot);
  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'merge-blocked-other-item');
  assert.equal(result.branch, 'fgw/demo-item');

  // The OTHER item's merge state must be exactly as this call found it —
  // proves no abort ran against it.
  assert.doesNotThrow(
    () => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'the other item\'s MERGE_HEAD must survive untouched',
  );
  assert.match(git(repoRoot, ['diff', '--name-only', '--cached']).trim(), /other\.txt/);
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged');
  assert.equal(fs.existsSync(path.join(repoRoot, 'newfile.txt')), false, 'demo-item\'s own merge must never have been attempted');
});

test('mergeRunnerItem reports "lock-lost-mid-merge" when heartbeat renewal fails before commit and never calls abortMergeIfPossible', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'newfile.txt', 'clean-content\n');

  // Override heartbeat interval so ticks run rapidly during the test goalCheck
  process.env.FGOS_HEARTBEAT_INTERVAL_MS = '10';

  try {
    const headBefore = headOf(repoRoot);

    // Goal check script that simulates another session reclaiming the lock mid-hold,
    // then pauses briefly to guarantee a heartbeat tick executes and sees the change.
    const lockPath = path.join(repoRoot, '.fgos', 'main-checkout.lock');
    const lockOverwriter = `node -e "require('fs').writeFileSync('${lockPath}', JSON.stringify({pid: 999999, ts: Date.now()})); const end = Date.now() + 50; while (Date.now() < end) {}"`;

    const result = await mergeRunnerItem(repoRoot, makeItem({ verify: lockOverwriter }));

    assert.equal(result.outcome, 'lock-lost-mid-merge');
    assert.equal(result.branch, 'fgw/demo-item');
    assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged (no commit landed)');

    // Verify abortMergeIfPossible was NOT called: staged merge changes still remain on disk
    assert.doesNotThrow(
      () => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']),
      'MERGE_HEAD must survive untouched because abortMergeIfPossible was not called',
    );
  } finally {
    delete process.env.FGOS_HEARTBEAT_INTERVAL_MS;
  }
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

test('tsk-2iz: mergeRunnerItem\'s decision-ID auto-resolve considers the BRANCH\'s own new ids too, not just HEAD -- never mints an id that collides with the branch\'s own already-clean file', async () => {
  // Reproduces Finding 3's exact failure scenario: branch forked when HEAD's
  // max was 0040, and independently wrote BOTH 0041 (which collides with
  // main's own later 0041) AND a non-colliding 0042 of its own. HEAD-only
  // (the pre-fix computation) would return 0042 as "next free" and rename
  // the branch's colliding 0041 straight into it -- landing on top of the
  // branch's own already-clean 0042-branch-second.md. Considering both
  // trees finds 0043, the first id neither side has used.
  const repoRoot = initRepo();
  writeDecisionFile(repoRoot, '0040', 'seed', 'Seed');
  writeDecisionIndex(repoRoot, ['| [0040](0040-seed.md) | Seed |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'seed decisions']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  writeDecisionFile(repoRoot, '0041', 'branch-first', 'Branch first');
  writeDecisionFile(repoRoot, '0042', 'branch-second', 'Branch second');
  writeDecisionIndex(repoRoot, [
    '| [0040](0040-seed.md) | Seed |',
    '| [0041](0041-branch-first.md) | Branch first |',
    '| [0042](0042-branch-second.md) | Branch second |',
  ]);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'branch: add 0041 and 0042']);
  git(repoRoot, ['checkout', 'main']);

  writeDecisionFile(repoRoot, '0041', 'main-own', 'Main own');
  writeDecisionIndex(repoRoot, ['| [0040](0040-seed.md) | Seed |', '| [0041](0041-main-own.md) | Main own |']);
  git(repoRoot, ['add', 'docs/decisions']);
  git(repoRoot, ['commit', '-q', '-m', 'main: independently add 0041']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  assert.equal(result.outcome, 'merged');
  assert.equal(result.selfResolved, true);

  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0041-branch-first.md')), false, 'branch\'s colliding file must be renamed away');
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0042-branch-first.md')), false, 'the bug: must NEVER land on 0042, which the branch\'s own file already claims');
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0043-branch-first.md')), true, 'renamed to 0043 -- the real next-free id considering BOTH trees');
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/decisions/0042-branch-second.md')), true, 'the branch\'s own already-clean file must survive untouched, never overwritten');

  const ids = fs.readdirSync(path.join(repoRoot, 'docs/decisions'))
    .map((f) => f.match(/^(\d{4})-/)?.[1])
    .filter((id) => id && id !== '0000'); // 0000-index.md is the index itself, never a decision record
  assert.deepEqual([...ids].sort(), ['0040', '0041', '0042', '0043'], 'every id on disk is unique -- no duplicate 4-digit prefix (the actual bug this item closes)');

  const index = fs.readFileSync(path.join(repoRoot, 'docs/decisions/0000-index.md'), 'utf8');
  assert.doesNotMatch(index, /<<<<<<</);
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('tsk-2iz: a real failure INSIDE the decision-ID auto-resolve attempt (not the "doesn\'t match the shape" false case) still falls through to the same abort -- never leaves MERGE_HEAD or a half-renamed file behind', async () => {
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

  // Force renumberDecisionFile's own `git mv` to fail for real: pre-plant an
  // untracked file at the exact path the resolve step would rename onto
  // (0023, the real next-free id for this fixture) -- `git mv` refuses
  // outright when the destination already exists, a genuine execFileSync
  // throw, never the documented "shape mismatch" false-return case.
  fs.writeFileSync(path.join(repoRoot, 'docs/decisions/0023-branch-decision.md'), 'pre-existing garbage\n');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));

  assert.equal(result.outcome, 'merge-failed-unclassified', 'a real resolve-step failure is reported, never swallowed into a generic conflict or left to throw uncaught');
  assert.match(result.error.message, /decision-index auto-resolve failed/);
  assert.throws(
    () => git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']),
    'MERGE_HEAD must be cleaned up -- the abort below must still run even though the resolve attempt itself threw',
  );
  // The planted garbage file itself is this test's own fixture debris, not
  // evidence of anything the implementation left behind -- remove it before
  // checking for a partial STAGED rename (the actual thing under test).
  fs.rmSync(path.join(repoRoot, 'docs/decisions/0023-branch-decision.md'));
  assert.equal(isWorkingTreeClean(repoRoot), true, 'no partial staged rename left behind by the failed resolve attempt');
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
      assert.match(err.message, /cannot merge "fgw\/demo-item": main checkout is locked by pid a-different-live-session/);
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

// tsk-70l: mergeRunnerItem's root->main path now acquires the lock under a
// numeric process.pid identity instead of a session-id string, so isPidAlive
// can tell a live rival apart from a crashed same-session holder. These two
// tests exercise that against a REAL other OS process (not merely a
// different in-memory value), the shape a same-process test cannot
// construct — mirroring merge-target-slot-multiprocess.test.mjs's own
// rationale for tsk-1wr's sibling fix.
test('mergeRunnerItem refuses a REAL second root->main merge sharing the same inherited env session id — the fanout bug tsk-70l closes', async () => {
  const lockRoot = makeLockRoot();
  const childScriptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fanout-mp-child-'));
  const childPath = writeFanoutHolderChild(childScriptDir);

  const repoRootA = initRepo();
  makeBranchWithCommit(repoRootA, 'fgw/demo-item-a', 'produced-a.txt', 'ok\n');
  const repoRootB = initRepo();
  makeBranchWithCommit(repoRootB, 'fgw/demo-item-b', 'produced-b.txt', 'ok\n');

  const heldMarker = path.join(childScriptDir, 'held');
  const releaseMarker = path.join(childScriptDir, 'release');
  const sharedSessionId = 'fanout-shared-session-tsk-70l';

  const child = fork(childPath, [repoRootA, lockRoot, 'fgw/demo-item-a', heldMarker, releaseMarker], {
    stdio: 'inherit',
    env: { ...process.env, BEE_SESSION_ID: sharedSessionId, CLAUDE_CODE_SESSION_ID: undefined },
  });
  const childExit = new Promise((resolve) => child.on('exit', (code) => resolve(code ?? 0)));

  const savedBeeSessionId = process.env.BEE_SESSION_ID;
  const savedClaudeSessionId = process.env.CLAUDE_CODE_SESSION_ID;
  try {
    await waitForFile(heldMarker);

    // Same inherited env session id as the child — exactly the subagent
    // fanout shape (docs/history/main-checkout-lock-fanout-self-
    // recognition-gap/CONTEXT.md) two independent real processes end up
    // sharing. Pre-fix, main-checkout-lock.mjs's self-recognition
    // (record.pid === identity, both this string) would wrongly admit
    // this as "the same writer" and let the merge below proceed for
    // real, on repoRootB — reproducing the bug without racing repoRootA's
    // own git state. Post-fix, identity is process.pid (unique per real
    // process, tsk-70l D1), so self-recognition can never match across
    // two genuinely separate processes and this must be refused instead.
    process.env.BEE_SESSION_ID = sharedSessionId;
    delete process.env.CLAUDE_CODE_SESSION_ID;

    await assert.rejects(
      () => mergeRunnerItem(repoRootB, { id: 'demo-item-b', verify: 'true' }, { lockRoot }),
      (err) => {
        assert.equal(err.code, 'lock-held', `expected refusal, got: ${err.message}`);
        return true;
      },
    );
    assert.equal(isWorkingTreeClean(repoRootB), true, 'repoRootB must stay untouched — refused before any git mutation');
  } finally {
    if (savedBeeSessionId === undefined) delete process.env.BEE_SESSION_ID; else process.env.BEE_SESSION_ID = savedBeeSessionId;
    if (savedClaudeSessionId === undefined) delete process.env.CLAUDE_CODE_SESSION_ID; else process.env.CLAUDE_CODE_SESSION_ID = savedClaudeSessionId;
    fs.writeFileSync(releaseMarker, 'go');
    await childExit;
  }
});

test('mergeRunnerItem refuses when a REAL different live process holds the main-checkout lock', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  // A genuinely separate, live OS process — its own real pid, not a value
  // this test process merely invented.
  const holder = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  try {
    await new Promise((resolve) => { holder.once('spawn', resolve); });

    const fgosDir = path.join(repoRoot, '.fgos');
    const otherLock = acquireMainCheckoutLock(fgosDir, { identity: holder.pid });
    assert.equal(otherLock.status, ACQUIRED);

    const headBefore = headOf(repoRoot);
    await assert.rejects(
      () => mergeRunnerItem(repoRoot, makeItem({ verify: 'true' })),
      (err) => {
        assert.match(err.message, new RegExp(`main checkout is locked by pid ${holder.pid}\\b`));
        assert.equal(err.code, 'lock-held');
        assert.equal(err.holderPid, holder.pid);
        return true;
      },
    );
    assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged — a live rival process must fully exclude this merge');
  } finally {
    holder.kill();
  }
});

test('mergeRunnerItem reclaims the lock immediately (never waiting out the TTL) when its recorded pid belongs to an already-exited process', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  // A real pid that genuinely existed and has now genuinely exited — proves
  // reclaim is driven by isPidAlive, not merely "some number that never
  // matches", and that it never waits for DEFAULT_TTL_MS just because the
  // record's timestamp is fresh.
  const crashed = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
  const deadPid = await new Promise((resolve, reject) => {
    crashed.once('spawn', () => resolve(crashed.pid));
    crashed.once('error', reject);
  });
  await new Promise((resolve) => { crashed.once('exit', resolve); });

  const fgosDir = path.join(repoRoot, '.fgos');
  // Freshly timestamped, same as a lock this process itself would have
  // just written before crashing — a same-session retry must not need to
  // wait out DEFAULT_TTL_MS's full 3 minutes to resume.
  const staleLock = acquireMainCheckoutLock(fgosDir, { identity: deadPid });
  assert.equal(staleLock.status, ACQUIRED);

  const start = Date.now();
  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }));
  const elapsed = Date.now() - start;

  assert.equal(result.outcome, 'merged');
  assert.ok(elapsed < DEFAULT_TTL_MS / 2, `must reclaim promptly on a dead pid, not wait out the TTL (took ${elapsed}ms)`);
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

// withMergeTargetSlot / mergeRunnerItem's targetSlot option (tsk-xyr, §E of
// the Merge Conductor design: a queue keyed by target ref, not a directory).

test('withMergeTargetSlot acquires and releases cleanly around a successful fn', async () => {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-slot-'));
  const slotFile = mergeSlotLockFile('fgw/tsk-51m');

  let ranInsideSlot = false;
  const result = await withMergeTargetSlot(lockRoot, 'fgw/tsk-51m', async () => {
    assert.equal(fs.existsSync(path.join(lockRoot, '.fgos', slotFile)), true, 'the slot lock file must exist while fn runs');
    ranInsideSlot = true;
    return 'fn-result';
  });

  assert.equal(ranInsideSlot, true);
  assert.equal(result, 'fn-result');
  assert.equal(fs.existsSync(path.join(lockRoot, '.fgos', slotFile)), false, 'the slot lock file must be released once fn returns');
});

test('withMergeTargetSlot releases the slot even when fn throws', async () => {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-slot-'));
  const slotFile = mergeSlotLockFile('fgw/tsk-51m');

  await assert.rejects(
    () => withMergeTargetSlot(lockRoot, 'fgw/tsk-51m', async () => {
      throw new Error('fn blew up');
    }),
    /fn blew up/,
  );
  assert.equal(fs.existsSync(path.join(lockRoot, '.fgos', slotFile)), false, 'a thrown fn must still release the slot (finally)');
});

test('withMergeTargetSlot refuses when the SAME target ref is already held by another live identity — code lock-held', async () => {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-slot-'));
  const fgosDir = path.join(lockRoot, '.fgos');
  const slotFile = mergeSlotLockFile('fgw/tsk-51m');
  const otherLock = acquireMainCheckoutLock(fgosDir, { identity: 'a-different-live-session', lockFile: slotFile });
  assert.equal(otherLock.status, ACQUIRED);

  await assert.rejects(
    () => withMergeTargetSlot(lockRoot, 'fgw/tsk-51m', async () => 'should never run'),
    (err) => {
      assert.match(err.message, /target's merge slot is held by another live session/);
      assert.equal(err.code, 'lock-held');
      assert.equal(err.targetRef, 'fgw/tsk-51m');
      assert.equal(typeof err.remainingTtlMs, 'number');
      return true;
    },
  );
});

test('withMergeTargetSlot for TWO DIFFERENT target refs run concurrently — no shared serialization between them (acceptance 3)', async () => {
  const lockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-test-slot-'));
  let bothInsideAtOnce = false;

  const gate = { a: false, b: false };
  const runA = withMergeTargetSlot(lockRoot, 'fgw/tsk-xyr', async () => {
    gate.a = true;
    // Wait for b to also be inside before either finishes — if the two
    // slots contended with each other, this would deadlock and the test
    // would time out instead of passing.
    while (!gate.b) await new Promise((r) => setTimeout(r, 5));
    bothInsideAtOnce = true;
  });
  const runB = withMergeTargetSlot(lockRoot, 'fgw/tsk-55p', async () => {
    gate.b = true;
    while (!gate.a) await new Promise((r) => setTimeout(r, 5));
  });

  await Promise.all([runA, runB]);
  assert.equal(bothInsideAtOnce, true, 'both target slots must have been held simultaneously — they must not contend with each other');
});

test('mergeRunnerItem with targetSlot:true does NOT take main-checkout.lock — a concurrent holder of main-checkout.lock does not block it (acceptance: additive, unchanged default when omitted)', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  // Simulate another session holding the ORDINARY main-checkout.lock (the
  // resource mergeRunnerItem's default path contends on) — targetSlot:true
  // must not even look at it.
  const fgosDir = path.join(repoRoot, '.fgos');
  const otherLock = acquireMainCheckoutLock(fgosDir, { identity: 'a-different-live-session' });
  assert.equal(otherLock.status, ACQUIRED);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'true' }), { targetSlot: true });
  assert.equal(result.outcome, 'merged', 'targetSlot:true must merge successfully while main-checkout.lock is held by someone else');
});

test('mergeRunnerItem omitting targetSlot (default false) still takes main-checkout.lock exactly as before — byte-identical default', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const fgosDir = path.join(repoRoot, '.fgos');
  const otherLock = acquireMainCheckoutLock(fgosDir, { identity: 'a-different-live-session' });
  assert.equal(otherLock.status, ACQUIRED);

  await assert.rejects(
    () => mergeRunnerItem(repoRoot, makeItem({ verify: 'true' })),
    (err) => {
      assert.equal(err.code, 'lock-held');
      return true;
    },
  );
});

test('the target-slot pattern in practice: withMergeTargetSlot held around withMergeEphemeralWorktree blocks a second concurrent attempt on the SAME target BEFORE it can read the target tip (acceptance 7)', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/tsk-51m', 'root.txt', 'root\n');
  makeBranchWithCommit(repoRoot, 'fgw/leaf-a', 'a.txt', 'a\n');

  const targetRef = 'fgw/tsk-51m';
  const tipBefore = git(repoRoot, ['rev-parse', targetRef]).trim();

  // Hold the slot exactly as a real caller would (bin/fgos.mjs wraps
  // withMergeEphemeralWorktree in this), simulating a first, in-progress
  // merge into the same target from a different session.
  const fgosDir = path.join(repoRoot, '.fgos');
  const slotFile = mergeSlotLockFile(targetRef);
  const heldByOther = acquireMainCheckoutLock(fgosDir, { identity: 'a-different-live-session', lockFile: slotFile });
  assert.equal(heldByOther.status, ACQUIRED);

  // A second attempt on the SAME target must be refused by the slot BEFORE
  // withMergeEphemeralWorktree ever creates its detached checkout (which is
  // what reads the tip) — proven here by wrapping the whole ephemeral-merge
  // call in withMergeTargetSlot and asserting it throws lock-held, with the
  // target's tip completely unchanged.
  await assert.rejects(
    () => withMergeTargetSlot(repoRoot, targetRef, () => withMergeEphemeralWorktree(repoRoot, 'tsk-51m', async (ephemeral) => {
      throw new Error('must never reach here — the slot should refuse first');
    })),
    (err) => {
      assert.equal(err.code, 'lock-held');
      return true;
    },
  );
  assert.equal(git(repoRoot, ['rev-parse', targetRef]).trim(), tipBefore, 'target tip must be completely untouched — the ephemeral worktree must never even have been created');
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

test('formatFgosWriteRejectedDetail includes playbook recovery doc path', () => {
  const detail = formatFgosWriteRejectedDetail('fgw/demo-item', ['.fgos/events.jsonl'], 'main');
  assert.equal(
    detail,
    'fgw/demo-item staged a change under .fgos/ (.fgos/events.jsonl); merge aborted, main unchanged — ADR0020. See docs/how-to/fix-fgos-write-rejected-merge-block.md for the recovery steps.',
  );
  assert.ok(detail.includes('docs/how-to/fix-fgos-write-rejected-merge-block.md'));
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

// tsk-2xg: two-sided-drift-after-forced-restore shape deadlock regression test.
// When a worker branch merges main then restores .fgos/* back to its own pre-merge
// value to pass pre-commit hook checks, and main grows the log further before approve,
// the merge=union attribute prevents fgos-write-rejected and preserves all lines.
test('mergeRunnerItem resolves two-sided-drift-after-forced-restore cleanly via merge=union for diagnostic logs (tsk-2xg regression)', async () => {
  const repoRoot = initRepo();
  // phase-01 (plans/260825-0842-fgos-logs-dir-bucketing) moved this file
  // under the gitignored .fgos/logs/ bucket and retired its merge=union
  // entry from the real repo's own .gitattributes -- this test declares its
  // own, exercising the same isMergeUnionPath/restore-then-recheck
  // machinery for the legitimate legacy case: a branch/checkout whose
  // .gitattributes predates that retirement can still carry this file
  // tracked and force-added.
  const logRelPath = resolveFgosFile('.fgos', FGOS_FILE.APPROVE_FAULT_LOG);
  fs.writeFileSync(path.join(repoRoot, '.gitattributes'), `${logRelPath.replace(/\\/g, '/')} merge=union\n`);
  fs.mkdirSync(path.join(repoRoot, path.dirname(logRelPath)), { recursive: true });
  const baseContent = '{"ts":"2026-08-24T00:00:00.000Z","id":"base1"}\n{"ts":"2026-08-24T00:00:01.000Z","id":"base2"}\n';
  fs.writeFileSync(path.join(repoRoot, logRelPath), baseContent);
  git(repoRoot, ['add', '.gitattributes', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'seed .gitattributes and fault log']);

  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'worker code\n');

  const mainGrowth1 = '{"ts":"2026-08-24T00:01:00.000Z","id":"main1"}\n';
  fs.appendFileSync(path.join(repoRoot, logRelPath), mainGrowth1);
  git(repoRoot, ['add', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main grows fault log 1']);

  git(repoRoot, ['checkout', 'fgw/demo-item']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'main']);
  fs.writeFileSync(path.join(repoRoot, logRelPath), baseContent);
  git(repoRoot, ['add', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'worker restores .fgos per pre-commit hook rule']);
  git(repoRoot, ['checkout', 'main']);

  const mainGrowth2 = '{"ts":"2026-08-24T00:02:00.000Z","id":"main2"}\n';
  fs.appendFileSync(path.join(repoRoot, logRelPath), mainGrowth2);
  git(repoRoot, ['add', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main grows fault log 2']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');
  assert.equal(isWorkingTreeClean(repoRoot), true);

  const finalContent = fs.readFileSync(path.join(repoRoot, logRelPath), 'utf8');
  assert.ok(finalContent.includes('"id":"base1"'), 'base1 line must be preserved');
  assert.ok(finalContent.includes('"id":"base2"'), 'base2 line must be preserved');
  assert.ok(finalContent.includes('"id":"main1"'), 'main1 line must be preserved');
  assert.ok(finalContent.includes('"id":"main2"'), 'main2 line must be preserved');
});

// tsk-4gi: a merge=union-covered `.fgos/*.jsonl` file where the worker
// branch's OWN frozen copy genuinely diverges from main's (the worker wrote
// its own event line that main never saw, while main independently grew the
// same file with its own line) previously tripped fgos-write-rejected even
// though `git merge` itself succeeded cleanly via the union driver — the
// union result differs from main's own committed content, so the old
// unconditional "any staged .fgos/ path is rejected" check fired on a
// perfectly good, non-conflicting merge. Restoring the .fgos/ path to
// target's own pre-merge (HEAD) content right after a successful merge, and
// re-checking before rejecting, fixes this: main's own state must land
// completely unaffected by the worker's stale/independent copy.
test('mergeRunnerItem merges cleanly when a merge=union .fgos/ file genuinely diverges between branch and main (tsk-4gi regression)', async () => {
  const repoRoot = initRepo();

  // tsk-3tp-2 retired merge=union for the legacy single-file
  // .fgos/events.jsonl (now a frozen post-sharding baseline, never
  // actively grown); phase-01 (plans/260825-0842-fgos-logs-dir-bucketing)
  // later retired it for this diagnostic log too (moved under the
  // gitignored .fgos/logs/ bucket). This test declares its own
  // merge=union entry, exercising the same machinery for the legitimate
  // legacy case a branch/checkout whose .gitattributes predates that
  // retirement can still hit.
  const logRelPath = resolveFgosFile('.fgos', FGOS_FILE.APPROVE_FAULT_LOG);
  fs.writeFileSync(path.join(repoRoot, '.gitattributes'), `${logRelPath.replace(/\\/g, '/')} merge=union\n`);
  fs.mkdirSync(path.join(repoRoot, path.dirname(logRelPath)), { recursive: true });
  const baseContent = '{"ts":"2026-08-24T00:00:00.000Z","id":"base"}\n';
  fs.writeFileSync(path.join(repoRoot, logRelPath), baseContent);
  git(repoRoot, ['add', '.gitattributes', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'seed .gitattributes and diagnostic log']);

  // Worker branch grows its own frozen copy with a line main never sees.
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'produced.txt'), 'ok\n');
  git(repoRoot, ['add', 'produced.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'worker produces its own file']);
  const workerLine = '{"ts":"2026-08-24T00:00:02.000Z","id":"worker-only"}\n';
  fs.appendFileSync(path.join(repoRoot, logRelPath), workerLine);
  git(repoRoot, ['add', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'worker grows its own frozen diagnostic log']);
  git(repoRoot, ['checkout', 'main']);

  // Main grows the same file independently under concurrent write load,
  // BEFORE approve ever runs against the worker branch above.
  const mainLine = '{"ts":"2026-08-24T00:00:03.000Z","id":"main-only"}\n';
  fs.appendFileSync(path.join(repoRoot, logRelPath), mainLine);
  git(repoRoot, ['add', logRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main grows diagnostic log independently']);
  const mainOwnContent = fs.readFileSync(path.join(repoRoot, logRelPath), 'utf8');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt' }));
  assert.equal(result.outcome, 'merged');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')), 'the worker\'s real (non-.fgos) work must still land');

  // The final .fgos/events.jsonl state must match main's own pre-merge
  // content EXACTLY — not a union of both sides, and not the worker's
  // stale copy either.
  const finalContent = fs.readFileSync(path.join(repoRoot, logRelPath), 'utf8');
  assert.equal(finalContent, mainOwnContent, 'target .fgos/ state must be exactly its own pre-merge version, unaffected by the worker branch');
  assert.ok(!finalContent.includes('worker-only'), 'the worker branch\'s stale .fgos/ line must never land on main');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

// tsk-4s6: mirrors the tsk-4gi union regression test's shape (a worker
// branch that merges main in, then re-commits its OWN pre-merge .fgos/
// content back per the ADR0020 pre-commit hook's own rule -- the real
// mechanism that leaves a branch's committed blob for a NON-union path
// genuinely pinned to an old value even though wall-clock time and
// further main drift have passed) -- but for a NON-union path
// (`.fgos/config.json`), which `isMergeUnionPath` alone can never rescue.
// Two shapes were tried and rejected before this one:
//   1. branch simply never touches the path at all -- produces no staged
//      diff for git to even flag (a fast-moving auto-merge just keeps
//      HEAD's own content when theirs == base), so it passed identically
//      with or without this fix, proving it exercised nothing.
//   2. a single-line file where both sides edit that same one line --
//      a genuine content CONFLICT (git throws, never auto-merges), which
//      this fix's restore loop never even reaches (it only runs after a
//      CLEAN merge that still leaves a staged diff) -- failed even with
//      the fix applied, for the right reason (wrong bug entirely).
// This shape uses a two-field file so main's round-2 edit (field `b`) and
// the branch's revert (field `a`, back to its branchHeadAtTake value) land
// on different lines -- git auto-merges them into a THIRD combined value
// with no conflict, which is exactly the staged-diff-after-clean-merge
// shape this fix's restore loop inspects. Reproduces the real bug this
// item was filed against (`fgw/tsk-25b`, `docs/history/
// tsk-4s6-write-rejected-trust-branchheadattake/RESEARCH.md`).
test('mergeRunnerItem merges cleanly when a non-union .fgos/ path auto-merges to a value differing from HEAD, but the branch\'s own field is unchanged since branchHeadAtTake (tsk-4s6)', async () => {
  const repoRoot = initRepo();
  const configRelPath = path.join('.fgos', 'config.json');
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  // pad1-pad5 give git's line-based merge enough unchanged context between
  // the `a` and `b` edits to treat them as independent, non-overlapping
  // hunks -- with the two fields on adjacent lines, git's default merge
  // treats the edits as one ambiguous region and throws a real conflict
  // instead of auto-merging (confirmed empirically), which would exercise
  // the wrong code path entirely (this fix only runs after a CLEAN merge).
  const forkContent = '{\n  "a": 1,\n  "pad1": "x",\n  "pad2": "x",\n  "pad3": "x",\n  "pad4": "x",\n  "pad5": "x",\n  "b": 1\n}\n';
  fs.writeFileSync(path.join(repoRoot, configRelPath), forkContent);
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'seed .fgos/config.json on main']);

  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'produced.txt'), 'ok\n');
  git(repoRoot, ['add', 'produced.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'worker produces its own file']);
  const forkCommit = headOf(repoRoot);
  git(repoRoot, ['checkout', 'main']);

  // Main advances field `a` once before the branch's own catch-up.
  const mainRound1 = '{\n  "a": 2,\n  "pad1": "x",\n  "pad2": "x",\n  "pad3": "x",\n  "pad4": "x",\n  "pad5": "x",\n  "b": 1\n}\n';
  fs.writeFileSync(path.join(repoRoot, configRelPath), mainRound1);
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main updates config.json field a (round 1)']);

  // The branch catches up (merges main in, adopting a:2), then reverts
  // JUST field `a` back to its own pre-merge (branchHeadAtTake) value and
  // commits that -- the real ADR0020 pre-commit-hook-driven pattern
  // (docs/how-to/fix-fgos-write-rejected-merge-block.md step 3-4). Field
  // `b` is left as main's round-1 merge brought it in, untouched by this
  // revert -- the branch's own net content is now byte-identical to its
  // branchHeadAtTake commit (both `{a:1, b:1}`), even though its commit
  // history shows an intermediate touch.
  git(repoRoot, ['checkout', 'fgw/demo-item']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'main']);
  fs.writeFileSync(path.join(repoRoot, configRelPath), forkContent);
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'worker reverts .fgos/config.json field a per pre-commit hook rule']);
  git(repoRoot, ['checkout', 'main']);

  // Main drifts field `b` next, independently, after the branch's own
  // catch-up/revert -- a DIFFERENT line than the branch's own revert
  // touched, so the eventual merge auto-resolves cleanly (no conflict)
  // but the result still differs from HEAD.
  const mainRound2 = '{\n  "a": 2,\n  "pad1": "x",\n  "pad2": "x",\n  "pad3": "x",\n  "pad4": "x",\n  "pad5": "x",\n  "b": 2\n}\n';
  fs.writeFileSync(path.join(repoRoot, configRelPath), mainRound2);
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main updates config.json field b (round 2)']);
  const mainOwnContent = fs.readFileSync(path.join(repoRoot, configRelPath), 'utf8');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt', branchHeadAtTake: forkCommit }));
  assert.equal(result.outcome, 'merged');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')), 'the worker\'s real (non-.fgos) work must still land');

  const finalContent = fs.readFileSync(path.join(repoRoot, configRelPath), 'utf8');
  assert.equal(finalContent, mainOwnContent, 'target .fgos/ state must be exactly its own pre-merge version, unaffected by the branch\'s stale revert');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

// tsk-198: proves a .fgos/ path absent at branchHeadAtTake and absent on the
// branch's current tip is safely preserved when main keeps drifting it.
//
// Two shapes were tried and rejected before this one:
//   1. A path main creates for the FIRST time after the branch's own fork
//      (never existing at the merge-base at all) -- passed identically with
//      or without this fix; git's merge never even stages a diff for a path
//      only one side ever knew about, so it proved nothing (same lesson
//      tsk-4s6's own first rejected shape already recorded).
//   2. The path exists at the merge-base, the branch deletes it, AND main
//      also modifies its content after the fork -- a genuine
//      modify(main)/delete(branch) CONFLICT (git always throws for this,
//      confirmed empirically), which this fix's restore loop never reaches
//      at all (it only runs after a clean merge) -- failed even with the
//      fix, for the wrong reason.
// This shape mirrors the REAL bug (fgw/tsk-25b's own dead
// events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817 file, docs/history/
// tsk-198-write-rejected-no-diff-check/plan.md, confirmed by directly
// reproducing the real merge against the live repo): the path exists at the
// merge-base, the branch deletes it before branchHeadAtTake is ever
// recorded, and main leaves its OWN copy completely untouched afterward
// (never modifies it further) -- a one-sided deletion (only the branch
// changed anything relative to the merge-base) that git auto-resolves
// cleanly to "deleted" with no conflict thrown, but which still stages a
// real diff against HEAD (which still has the file).
test('mergeRunnerItem merges cleanly when a .fgos/ path is absent at branchHeadAtTake, absent on branch, and present on main (tsk-198)', async () => {
  const repoRoot = initRepo();
  const configRelPath = path.join('.fgos', 'config.json');
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  const seedContent = '{\n  "version": 1\n}\n';
  fs.writeFileSync(path.join(repoRoot, configRelPath), seedContent);
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'seed .fgos/config.json on main']);

  // Branch forks, then deletes the path BEFORE branchHeadAtTake is
  // recorded -- from the item's own perspective, it never had this path.
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  git(repoRoot, ['rm', '-q', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'branch removes .fgos/config.json before this item was ever taken']);
  fs.writeFileSync(path.join(repoRoot, 'produced.txt'), 'ok\n');
  git(repoRoot, ['add', 'produced.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'worker produces its own file']);
  const forkCommit = headOf(repoRoot);
  git(repoRoot, ['checkout', 'main']);
  // Main leaves the path completely untouched after the branch's fork --
  // only the branch changed anything relative to the merge-base, the exact
  // one-sided-deletion shape that auto-resolves without a conflict.

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'test -f produced.txt', branchHeadAtTake: forkCommit }));
  assert.equal(result.outcome, 'merged');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')), 'the worker\'s real (non-.fgos) work must still land');

  const finalContent = fs.readFileSync(path.join(repoRoot, configRelPath), 'utf8');
  assert.equal(finalContent, seedContent, 'main\'s own content must survive unaffected');
  assert.equal(isWorkingTreeClean(repoRoot), true);
});

// tsk-4gi: a NON-union `.fgos/` path (e.g. `.fgos/config.json`, no
// `merge=union` entry) that already exists on target's HEAD and gets edited
// on non-overlapping lines by both the worker branch and target auto-merges
// cleanly too (`git merge` never throws) -- the exact shape that would let
// `git checkout HEAD -- <path>` silently discard a REAL, non-append-only
// `.fgos/` write if the restore ran unconditionally for every staged
// `.fgos/` path. This must still be refused: the restore-then-recheck this
// fix adds only ever applies to a path `.gitattributes` actually declares
// `merge=union` for (isMergeUnionPath) -- protection for everything else
// must stay exactly as strong as before this fix.
test('mergeRunnerItem still refuses a non-union .fgos/ path that auto-merges cleanly on non-overlapping lines (tsk-4gi: fix must not weaken this)', async () => {
  const repoRoot = initRepo();
  const configRelPath = path.join('.fgos', 'config.json');
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, configRelPath), 'line1\nline2\nline3\n');
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'seed .fgos/config.json on main (no merge=union for this path)']);

  // Worker branch edits the FIRST line only.
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, configRelPath), 'worker-line1\nline2\nline3\n');
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'worker edits .fgos/config.json line 1']);
  git(repoRoot, ['checkout', 'main']);

  // Main independently edits the LAST line -- a non-overlapping change, so
  // git's default 3-way merge auto-resolves this without throwing.
  fs.writeFileSync(path.join(repoRoot, configRelPath), 'line1\nline2\nmain-line3\n');
  git(repoRoot, ['add', configRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main edits .fgos/config.json line 3']);
  const headBefore = headOf(repoRoot);

  const result = await mergeRunnerItem(repoRoot, makeItem());
  assert.equal(result.outcome, 'fgos-write-rejected');
  assert.deepEqual(result.paths, [configRelPath.split(path.sep).join('/')]);
  assert.equal(headOf(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(isWorkingTreeClean(repoRoot), true, 'tree must be clean after merge --abort');
});

// tsk-tr9: a worker branch (`fgw/<id>`) that at some point in its history
// recorded a DELETION of a merge=union-covered `.fgos/` shard (e.g. a
// prior manual `git rm --cached` recovery after some earlier, unrelated
// conflict) raises a REAL git conflict — modify/delete, never auto-
// resolved by the `merge=union` driver, which only ever resolves
// modify/modify text conflicts — the moment the SAME session's own
// subsequent event-append (an ordinary return/approve/catchup elsewhere)
// grows that exact shard on the other side. Confirmed empirically before
// this fix: `performCatchUp` returned `outcome: 'conflict'` and
// `mergeRunnerItem` returned `outcome: 'conflict'` for byte-identical
// repo states — a false conflict manufactured entirely by the calling
// session's own writes to its own shard, not a real content dispute
// (neither side has any legitimate claim over the OTHER's `.fgos/`
// state — ADR0020). `resolveFgosOnlyConflict` (merge.mjs) now resolves it
// automatically for both merge directions, so a stale branch like this
// self-heals on its very next catch-up/approve instead of staying stuck
// in the same manual-recovery loop every cycle.
function seedStaleDeletedFgosBranch(repoRoot, shardRelPath) {
  fs.mkdirSync(path.join(repoRoot, '.fgos', 'events'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, shardRelPath), '{"seq":1}\n');
  const repoGitattributes = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.gitattributes'));
  fs.writeFileSync(path.join(repoRoot, '.gitattributes'), repoGitattributes);
  git(repoRoot, ['add', '.gitattributes', shardRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'seed .gitattributes and event shard']);

  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  git(repoRoot, ['checkout', 'fgw/demo-item']);

  // An earlier merge/catch-up already pulled main's `.fgos/` state onto
  // this branch (mirrored directly here as the end-state a prior cycle
  // would have produced, rather than re-driving that whole cycle).
  fs.appendFileSync(path.join(repoRoot, shardRelPath), '{"seq":2}\n');
  git(repoRoot, ['add', shardRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'earlier merge landed main state onto the branch']);

  // The established manual workaround: a session hits some unrelated
  // fgos-write-rejected/conflict and "fixes" it by stripping `.fgos` back
  // out of the branch, then commits that deletion.
  git(repoRoot, ['rm', '-r', '--cached', '--ignore-unmatch', '--', '.fgos']);
  fs.rmSync(path.join(repoRoot, '.fgos'), { recursive: true, force: true });
  git(repoRoot, ['commit', '-q', '-m', 'manual workaround: strip stray .fgos from worker branch']);

  git(repoRoot, ['checkout', 'main']);

  // The calling session's own subsequent event-append grows the SAME
  // shard on main — the write that reopens the divergence.
  fs.appendFileSync(path.join(repoRoot, shardRelPath), '{"seq":3}\n');
  git(repoRoot, ['add', shardRelPath]);
  git(repoRoot, ['commit', '-q', '-m', 'main grows its own shard further']);
}

test('performCatchUp resolves a stale deleted-.fgos-shard branch cleanly instead of a false modify/delete conflict (tsk-tr9 regression)', async () => {
  const repoRoot = initRepo();
  const shardRelPath = path.join('.fgos', 'events', 'writer-a-1000.jsonl');
  seedStaleDeletedFgosBranch(repoRoot, shardRelPath);
  const item = makeItem({ id: 'demo-item', verify: 'test -f produced.txt' });

  const result = await performCatchUp(repoRoot, 'demo-item', item, 'main', null);
  assert.equal(result.outcome, 'merged', 'catch-up must resolve the false .fgos conflict, not report a real one');
});

test('mergeRunnerItem resolves a stale deleted-.fgos-shard branch cleanly instead of a false modify/delete conflict (tsk-tr9 regression)', async () => {
  const repoRoot = initRepo();
  const shardRelPath = path.join('.fgos', 'events', 'writer-a-1000.jsonl');
  seedStaleDeletedFgosBranch(repoRoot, shardRelPath);
  const item = makeItem({ id: 'demo-item', verify: 'test -f produced.txt' });
  const mainShardBefore = fs.readFileSync(path.join(repoRoot, shardRelPath), 'utf8');

  const result = await mergeRunnerItem(repoRoot, item);
  assert.equal(result.outcome, 'merged', 'approve must resolve the false .fgos conflict, not report a real one');
  assert.ok(fs.existsSync(path.join(repoRoot, 'produced.txt')), 'the worker\'s real (non-.fgos) work must still land');
  assert.equal(
    fs.readFileSync(path.join(repoRoot, shardRelPath), 'utf8'),
    mainShardBefore,
    'main\'s own .fgos state must land completely unaffected by the stale branch',
  );
  assert.equal(isWorkingTreeClean(repoRoot), true);
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
// main advancing past the fork on an overlapping path means the merged tree
// is no longer the tree that was verified, so the checks have to run again.
test('D5: main advancing past the fork on an overlapping path forces the checks to run again', async () => {
  const repoRoot = initRepo();
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\nbranch line\n');
  git(repoRoot, ['add', 'seed.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'branch modified seed.txt']);
  git(repoRoot, ['checkout', 'main']);

  const branchHeadAtReturn = tipOf(repoRoot, 'fgw/demo-item');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'main line\nseed\n');
  git(repoRoot, ['add', 'seed.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main advanced after return touching seed.txt']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', branchHeadAtReturn }));

  assert.equal(result.outcome, 'verify-fail', 'the verify must actually run, and its red must be honoured');
  assert.notEqual(result.check.skipped, true);
});

// tsk-2lq: main advancing past the fork on a disjoint path still allows skip.
test('D5: main advancing past the fork on a disjoint path still allows skip', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');
  const branchHeadAtReturn = tipOf(repoRoot, 'fgw/demo-item');
  fs.writeFileSync(path.join(repoRoot, 'moved-on.txt'), 'main moved\n');
  git(repoRoot, ['add', 'moved-on.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main advanced after the return on disjoint path']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', branchHeadAtReturn }));

  assert.equal(result.outcome, 'merged');
  assert.equal(result.check.passed, true);
  assert.equal(result.check.skipped, true);
  assert.match(result.check.output, /verify skipped: the merged tree is identical to/);
  assert.match(result.check.output, new RegExp(branchHeadAtReturn));
});

// tsk-2lq: main renaming a path that branch modified forces checks to run again.
test('D5: main renaming a path that branch modified forces checks to run again', async () => {
  const repoRoot = initRepo();
  git(repoRoot, ['checkout', '-b', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\nbranch line\n');
  git(repoRoot, ['add', 'seed.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'branch modified seed.txt']);
  git(repoRoot, ['checkout', 'main']);

  const branchHeadAtReturn = tipOf(repoRoot, 'fgw/demo-item');
  git(repoRoot, ['mv', 'seed.txt', 'renamed-seed.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'main renamed seed.txt']);

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1', branchHeadAtReturn }));

  assert.equal(result.outcome, 'verify-fail');
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

// --- detectPostLandDrift (D4) -------------------------------------------
//
// The git-facing half of post-land detection. This is a DETECTION point, not
// a catchup point: a root landing 13 children sequentially would otherwise
// cost ~78 catchup+verify rounds, nearly all of which discover that nothing
// actually collided. Nothing here may touch a branch or run a verify.

function driftItem(id, overrides = {}) {
  return { id, verify: 'true', ...overrides };
}

test('detectPostLandDrift: no shared path produces nothing at all -- no notification, no mark', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/landed', 'a.mjs', 'a\n');
  makeBranchWithCommit(repoRoot, 'fgw/leaf', 'b.mjs', 'b\n');
  const view = {
    work: {
      landed: driftItem('landed', { status: 'awaiting-approval' }),
      leaf: driftItem('leaf', { status: 'doing' }),
    },
  };

  const report = detectPostLandDrift(repoRoot, view, view.work.landed, {
    target: 'main',
    landedFiles: changedFiles(repoRoot, view.work.landed),
    sessions: [{ sessionId: 'sess-1', itemId: 'leaf' }],
  });

  assert.deepEqual(report.notify, []);
  assert.deepEqual(report.stale, []);
});

test('detectPostLandDrift: a shared path with a live session notifies that exact session and leaves its branch untouched', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/landed', 'shared.mjs', 'landed\n');
  makeBranchWithCommit(repoRoot, 'fgw/leaf', 'shared.mjs', 'leaf\n');
  const view = {
    work: {
      landed: driftItem('landed', { status: 'awaiting-approval' }),
      leaf: driftItem('leaf', { status: 'doing' }),
    },
  };
  const leafTipBefore = tipOf(repoRoot, 'fgw/leaf');

  const report = detectPostLandDrift(repoRoot, view, view.work.landed, {
    target: 'main',
    landedFiles: changedFiles(repoRoot, view.work.landed),
    sessions: [
      { sessionId: 'sess-leaf', itemId: 'leaf' },
      { sessionId: 'sess-elsewhere', itemId: 'someone-else' },
    ],
  });

  assert.deepEqual(report.notify, [{ id: 'leaf', shared: ['shared.mjs'], sessionIds: ['sess-leaf'] }]);
  assert.deepEqual(report.stale, []);
  // D2: the owning session decides what to do with its own branch; detection
  // never moves it.
  assert.equal(tipOf(repoRoot, 'fgw/leaf'), leafTipBefore);
});

test('detectPostLandDrift: a shared path with no live session is marked stale only', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/landed', 'shared.mjs', 'landed\n');
  makeBranchWithCommit(repoRoot, 'fgw/leaf', 'shared.mjs', 'leaf\n');
  const view = {
    work: {
      landed: driftItem('landed', { status: 'awaiting-approval' }),
      leaf: driftItem('leaf', { status: 'doing' }),
    },
  };
  const leafTipBefore = tipOf(repoRoot, 'fgw/leaf');

  const report = detectPostLandDrift(repoRoot, view, view.work.landed, {
    target: 'main',
    landedFiles: changedFiles(repoRoot, view.work.landed),
    sessions: [],
  });

  assert.deepEqual(report.notify, []);
  assert.deepEqual(report.stale, [{ id: 'leaf', shared: ['shared.mjs'] }]);
  assert.equal(tipOf(repoRoot, 'fgw/leaf'), leafTipBefore);
});

test('detectPostLandDrift runs no verify at all -- the whole reason this is a detection point', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/landed', 'shared.mjs', 'landed\n');
  makeBranchWithCommit(repoRoot, 'fgw/leaf', 'shared.mjs', 'leaf\n');
  // A verify command whose only observable effect is creating this file. If
  // any verify ran for either side, the file exists afterwards.
  const sentinel = path.join(repoRoot, 'verify-ran.sentinel');
  const verify = `touch ${JSON.stringify(sentinel)}`;
  const view = {
    work: {
      landed: driftItem('landed', { status: 'awaiting-approval', verify }),
      leaf: driftItem('leaf', { status: 'doing', verify }),
    },
  };

  detectPostLandDrift(repoRoot, view, view.work.landed, {
    target: 'main',
    landedFiles: changedFiles(repoRoot, view.work.landed),
    sessions: [],
  });

  assert.equal(fs.existsSync(sentinel), false);
});

test('detectPostLandDrift examines exactly the open leaves sharing the target -- O(open leaves)', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/landed', 'shared.mjs', 'landed\n');
  makeBranchWithCommit(repoRoot, 'fgw/live', 'shared.mjs', 'live\n');
  makeBranchWithCommit(repoRoot, 'fgw/resolved', 'shared.mjs', 'resolved\n');
  makeBranchWithCommit(repoRoot, 'fgw/otherTarget', 'shared.mjs', 'other\n');
  const view = {
    work: {
      landed: driftItem('landed', { status: 'awaiting-approval' }),
      live: driftItem('live', { status: 'doing' }),
      resolved: driftItem('resolved', { status: 'delivered' }),
      otherTarget: driftItem('otherTarget', { status: 'doing', parent: 'some-root' }),
      noBranch: driftItem('noBranch', { status: 'doing' }),
    },
  };

  const report = detectPostLandDrift(repoRoot, view, view.work.landed, {
    target: 'main',
    landedFiles: changedFiles(repoRoot, view.work.landed),
    sessions: [],
  });

  assert.deepEqual(report.examined, ['live']);
  assert.deepEqual(report.stale, [{ id: 'live', shared: ['shared.mjs'] }]);
});

test('detectPostLandDrift: a landed item with no branch of its own contributes no paths, so nothing is flagged', () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/leaf', 'shared.mjs', 'leaf\n');
  const view = {
    work: {
      landed: driftItem('landed', { status: 'awaiting-approval' }),
      leaf: driftItem('leaf', { status: 'doing' }),
    },
  };

  const report = detectPostLandDrift(repoRoot, view, view.work.landed, {
    target: 'main',
    landedFiles: changedFiles(repoRoot, view.work.landed),
    sessions: [],
  });

  assert.deepEqual(report.notify, []);
  assert.deepEqual(report.stale, []);
});

test('mergeRunnerItem attaches a postLand report whose landed paths were captured BEFORE the merge', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'shared.mjs', 'landed\n');

  const result = await mergeRunnerItem(repoRoot, makeItem());

  assert.equal(result.outcome, 'merged');
  // Once the merge lands, main contains fgw/demo-item, so the three-dot diff
  // main...fgw/demo-item is EMPTY -- a report computed after the fact would
  // find no paths at all and could never flag anything. A non-empty set here
  // is the proof the capture happened before the merge ran.
  assert.deepEqual(result.postLand.landedFiles, ['shared.mjs']);
  assert.deepEqual(changedFiles(repoRoot, makeItem()), []);
});

test('mergeRunnerItem attaches no postLand report when the merge did not land', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'produced.txt', 'ok\n');

  const result = await mergeRunnerItem(repoRoot, makeItem({ verify: 'exit 1' }));

  assert.equal(result.outcome, 'verify-fail');
  assert.equal(result.postLand, undefined);
});

test('performCatchUp pre-merge-refusal fixture returns merge-refused outcome without conflictedFiles', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/tsk-5et', 'f.txt', 'branch\n');
  git(repoRoot, ['checkout', 'main']);
  fs.writeFileSync(path.join(repoRoot, 'f.txt'), 'main\n');
  git(repoRoot, ['add', 'f.txt']);
  git(repoRoot, ['commit', '-m', 'main edit']);

  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bin-shim-'));
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const shimScript = `#!/bin/sh
if [ "$1" = "merge" ] && [ "$2" = "--no-commit" ]; then
  echo "error: Entry 'f.txt' not uptodate. Cannot merge." >&2
  exit 1
fi
exec ${realGit} "$@"
`;
  fs.writeFileSync(path.join(binDir, 'git'), shimScript, { mode: 0o755 });

  const origPath = process.env.PATH;
  process.env.PATH = `${binDir}:${origPath}`;

  try {
    const result = await performCatchUp(repoRoot, 'tsk-5et', makeItem(), 'main', 5000);
    assert.equal(result.outcome, 'merge-refused');
    assert.equal(result.reason, "error: Entry 'f.txt' not uptodate. Cannot merge.");
    assert.equal('conflictedFiles' in result, false);
  } finally {
    process.env.PATH = origPath;
    fs.rmSync(binDir, { recursive: true, force: true });
  }
});

test('performCatchUp genuine conflict returns conflict outcome with non-empty conflictedFiles', async () => {
  const repoRoot = initRepo();
  makeBranchWithCommit(repoRoot, 'fgw/tsk-5et', 'conflict.txt', 'branch content\n');
  git(repoRoot, ['checkout', 'main']);
  fs.writeFileSync(path.join(repoRoot, 'conflict.txt'), 'main content\n');
  git(repoRoot, ['add', 'conflict.txt']);
  git(repoRoot, ['commit', '-m', 'main edit']);

  const result = await performCatchUp(repoRoot, 'tsk-5et', makeItem(), 'main', 5000);
  assert.equal(result.outcome, 'conflict');
  assert.deepEqual(result.conflictedFiles, ['conflict.txt']);
});

test('abortMergeIfPossible throws MergeError with category merge-fail when merge abort fails on dirty staged merge', () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, '.gitattributes'), '.fgos/events.jsonl merge=union\n');
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos/events.jsonl'), 'line1\n');
  fs.writeFileSync(path.join(repoRoot, 'conflict.txt'), 'base\n');
  git(repoRoot, ['add', '.gitattributes', '.fgos/events.jsonl', 'conflict.txt']);
  git(repoRoot, ['commit', '-m', 'initial']);

  makeBranchWithCommit(repoRoot, 'fgw/demo-item', 'conflict.txt', 'branch\n');
  git(repoRoot, ['checkout', 'fgw/demo-item']);
  fs.writeFileSync(path.join(repoRoot, '.fgos/events.jsonl'), 'line1\nline2-branch\n');
  git(repoRoot, ['commit', '-am', 'branch events update']);

  git(repoRoot, ['checkout', 'main']);
  fs.writeFileSync(path.join(repoRoot, '.fgos/events.jsonl'), 'line1\nline3-main\n');
  fs.writeFileSync(path.join(repoRoot, 'conflict.txt'), 'main\n');
  git(repoRoot, ['commit', '-am', 'main events & conflict update']);

  try {
    git(repoRoot, ['merge', '--no-commit', '--no-ff', 'fgw/demo-item']);
  } catch {
    // staged merge=union events.jsonl and hit conflict on conflict.txt
  }
  fs.appendFileSync(path.join(repoRoot, '.fgos/events.jsonl'), 'concurrent append\n');

  assert.throws(
    () => {
      try {
        abortMergeIfPossible(repoRoot);
      } catch (abortErr) {
        throw new MergeError(`merge of "fgw/demo-item" failed and "git merge --abort" itself failed: ${abortErr.message}`, { branch: 'fgw/demo-item' });
      }
    },
    (err) => err instanceof MergeError && err.category === 'merge-fail',
  );
});
