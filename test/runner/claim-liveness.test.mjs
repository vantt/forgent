import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { lastActivityAt, isReclaimEligible } from '../../src/runner/claim-liveness.mjs';

// Every test here creates its own disposable git repo (git init in a
// mkdtemp dir), same convention worktree.test.mjs already uses — no test
// ever creates a worktree or branch in THIS repo (forgent itself). Every
// `fgw/<id>` branch is created via `git worktree add -b`, never via a
// checkout inside `repoRoot` itself — repoRoot's own working directory is
// never touched, so nothing here depends on the local default-branch name
// (`main` vs `master`).

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-liveness-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function mkWorktreeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-liveness-test-dir-'));
}

// `epochSeconds` backdates the COMMITTER date `%ct` actually reads —
// `--date`/GIT_AUTHOR_DATE alone would leave the committer date at "now".
function commitAt(cwd, filename, contents, epochSeconds) {
  fs.writeFileSync(path.join(cwd, filename), contents);
  execFileSync('git', ['add', filename], { cwd });
  execFileSync('git', ['commit', '-q', '-m', `test: ${filename}`], {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: `${epochSeconds} +0000`,
      GIT_COMMITTER_DATE: `${epochSeconds} +0000`,
    },
  });
}

function touchAt(filePath, epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  fs.utimesSync(filePath, date, date);
}

// Creates `fgw/<id>` as a fresh worktree (never a checkout in repoRoot),
// makes one backdated commit on it, then returns the worktree path.
function branchWithBackdatedCommit(repoRoot, id, commitSeconds) {
  const wtPath = path.join(mkWorktreeDir(), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', `fgw/${id}`, wtPath], { cwd: repoRoot });
  commitAt(wtPath, `${id}.txt`, id, commitSeconds);
  return wtPath;
}

test('lastActivityAt returns null when the branch does not exist', () => {
  const repoRoot = initTempRepo();
  assert.equal(lastActivityAt(repoRoot, 'no-such-item'), null);
});

test('lastActivityAt returns the commit time when the branch exists but has no live worktree', () => {
  const repoRoot = initTempRepo();
  const commitSeconds = Math.floor(Date.now() / 1000) - 3600;
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-a', commitSeconds);
  execFileSync('git', ['worktree', 'remove', wtPath], { cwd: repoRoot });

  const activityAt = lastActivityAt(repoRoot, 'item-a');
  assert.equal(activityAt, commitSeconds * 1000);
});

test('lastActivityAt reflects an uncommitted file touched in the branch\'s live worktree, newer than its last commit', () => {
  const repoRoot = initTempRepo();
  const commitSeconds = Math.floor(Date.now() / 1000) - 7200;
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-b', commitSeconds);

  const touchedSeconds = Math.floor(Date.now() / 1000) - 60;
  fs.writeFileSync(path.join(wtPath, 'uncommitted.txt'), 'still editing');
  touchAt(path.join(wtPath, 'uncommitted.txt'), touchedSeconds);

  const activityAt = lastActivityAt(repoRoot, 'item-b');
  assert.equal(activityAt, touchedSeconds * 1000, 'must reflect the newer uncommitted mtime, not the older commit time');
});

test('tsk-f8f: lastActivityAt reflects an untracked file whose NAME CONTAINS A SPACE -- the exact Finding 9 scenario (git-quotes this path in default porcelain output)', () => {
  const repoRoot = initTempRepo();
  const commitSeconds = Math.floor(Date.now() / 1000) - 7200;
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-space', commitSeconds);

  const touchedSeconds = Math.floor(Date.now() / 1000) - 60;
  fs.writeFileSync(path.join(wtPath, 'my draft report.txt'), 'still editing');
  touchAt(path.join(wtPath, 'my draft report.txt'), touchedSeconds);

  const activityAt = lastActivityAt(repoRoot, 'item-space');
  assert.equal(activityAt, touchedSeconds * 1000, 'must reflect the spaced file\'s real mtime -- the old whitespace-split parse silently dropped it (a trailing quote character never matches a real file, statSync fails, entry skipped)');
});

test('tsk-f8f: lastActivityAt reflects a file RENAMED to a spaced name -- the porcelain -z rename record\'s extra origin-path token is correctly skipped, never mistaken for a path to stat', () => {
  const repoRoot = initTempRepo();
  const commitSeconds = Math.floor(Date.now() / 1000) - 7200;
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-rename', commitSeconds);

  execFileSync('git', ['mv', `item-rename.txt`, 'renamed with space.txt'], { cwd: wtPath });
  const touchedSeconds = Math.floor(Date.now() / 1000) - 30;
  touchAt(path.join(wtPath, 'renamed with space.txt'), touchedSeconds);

  const activityAt = lastActivityAt(repoRoot, 'item-rename');
  assert.equal(activityAt, touchedSeconds * 1000, 'must reflect the renamed (destination) file\'s real mtime, never fail on the origin-path token that follows a rename record in -z mode');
});

test('lastActivityAt ignores .fgos changes (ADR0020 checkout artifact), never counting them as activity', () => {
  const repoRoot = initTempRepo();
  const commitSeconds = Math.floor(Date.now() / 1000) - 7200;
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-c', commitSeconds);

  // A recently-touched .fgos file (the ADR0020 checkout-strip artifact) —
  // must never be picked up as the newest activity.
  fs.mkdirSync(path.join(wtPath, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(wtPath, '.fgos', 'marker'), 'x');
  touchAt(path.join(wtPath, '.fgos', 'marker'), Math.floor(Date.now() / 1000));

  const activityAt = lastActivityAt(repoRoot, 'item-c');
  assert.equal(activityAt, commitSeconds * 1000, 'must fall back to commit time, not the excluded .fgos mtime');
});

test('isReclaimEligible is false (never conclusive) when the signal is unreadable', () => {
  const repoRoot = initTempRepo();
  assert.equal(isReclaimEligible(repoRoot, 'no-such-item', 'session'), false);
});

test('isReclaimEligible boundary: exactly at threshold is not eligible, just past it is', () => {
  const repoRoot = initTempRepo();
  const humanMs = 24 * 60 * 60 * 1000;
  const commitSeconds = Math.floor((Date.now() - humanMs) / 1000);
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-d', commitSeconds);
  execFileSync('git', ['worktree', 'remove', wtPath], { cwd: repoRoot });

  const activityAt = lastActivityAt(repoRoot, 'item-d');
  assert.equal(
    isReclaimEligible(repoRoot, 'item-d', 'session', { now: activityAt + humanMs }),
    false,
    'age exactly equal to the threshold must not be eligible (strictly greater-than, per D3)',
  );
  assert.equal(
    isReclaimEligible(repoRoot, 'item-d', 'session', { now: activityAt + humanMs + 1 }),
    true,
    'one ms past the threshold must be eligible',
  );
});

test('isReclaimEligible scopes runner claims to the shorter agentMs threshold, session/human to the longer humanMs one', () => {
  const repoRoot = initTempRepo();
  const agentMs = 15 * 60 * 1000;
  const commitSeconds = Math.floor((Date.now() - agentMs - 1000) / 1000);
  const wtPath = branchWithBackdatedCommit(repoRoot, 'item-e', commitSeconds);
  execFileSync('git', ['worktree', 'remove', wtPath], { cwd: repoRoot });

  const activityAt = lastActivityAt(repoRoot, 'item-e');
  const now = activityAt + agentMs + 1000;
  assert.equal(isReclaimEligible(repoRoot, 'item-e', 'runner', { now }), true, 'past the short agent threshold');
  assert.equal(isReclaimEligible(repoRoot, 'item-e', 'session', { now }), false, 'still well within the long human threshold');
});
