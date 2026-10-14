// test/runner/execution/partial-writes.test.mjs -- what changed in a worktree since a snapshot.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { worktreeSnapshot, writesSince } from '../../../src/runner/execution/partial-writes.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

const dirs = [];
after(() => { for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true }); });

function repoWithWorktree() {
  const repoRoot = makeFixtureDir('fgos-partial-');
  const worktree = makeFixtureDir('fgos-partial-wt-');
  dirs.push(repoRoot, worktree);
  fs.rmSync(worktree, { recursive: true, force: true });
  const git = (args, cwd = repoRoot) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'T']);
  git(['config', 'user.email', 't@t']);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# T\n');
  git(['add', 'README.md']);
  git(['commit', '-m', 'init']);
  git(['worktree', 'add', '-b', 'wt', worktree]);
  return { repoRoot, worktree, git };
}

test('a commit with a clean tree is a change: HEAD moved', () => {
  const { repoRoot, worktree, git } = repoWithWorktree();
  const before = worktreeSnapshot({ worktree, repoRoot });
  fs.writeFileSync(path.join(worktree, 'a.txt'), 'a');
  git(['add', 'a.txt'], worktree);
  git(['commit', '-m', 'a'], worktree);
  assert.deepEqual(writesSince(before, { worktree, repoRoot }), { paths: [], headMoved: true });
});

test('an untouched worktree, dirty or not, is no change', () => {
  const { repoRoot, worktree } = repoWithWorktree();
  fs.writeFileSync(path.join(worktree, 'mine.txt'), 'mine');
  const before = worktreeSnapshot({ worktree, repoRoot });
  assert.deepEqual(writesSince(before, { worktree, repoRoot }), { paths: [], headMoved: false });
});

test('a dirty file that cannot be read is recorded, not a crash', { skip: process.getuid?.() === 0 ? 'root reads every file' : false }, () => {
  const { repoRoot, worktree } = repoWithWorktree();
  const file = path.join(worktree, 'locked.txt');
  fs.writeFileSync(file, 'x');
  fs.chmodSync(file, 0o000);
  try {
    const snap = worktreeSnapshot({ worktree, repoRoot });
    assert.match(snap.files['locked.txt'], /^unreadable:/);
  } finally {
    fs.chmodSync(file, 0o600);
  }
});
