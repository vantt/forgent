import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { nulPaths, statusPaths, nameStatusPaths } from '../../src/util/git-paths.mjs';
import { checkoutDirtyPaths, isCheckoutDirty } from '../../src/runner/worktree.mjs';

const VIET = 'tài liệu/ghi chú.md';
const EDGE = ' lề .md';
const TAB = 'tab\there.md';

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function initRepo(t) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-git-paths-'));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  git(repoRoot, ['init', '-q', '-b', 'main']);
  git(repoRoot, ['config', 'user.email', 'test@example.com']);
  git(repoRoot, ['config', 'user.name', 'Test']);
  write(repoRoot, 'a b.md', 'a\n');
  write(repoRoot, 'cũ.md', 'old\n');
  git(repoRoot, ['add', '-A']);
  git(repoRoot, ['commit', '-q', '-m', 'seed']);
  return repoRoot;
}

function write(repoRoot, rel, content) {
  fs.mkdirSync(path.dirname(path.join(repoRoot, rel)), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, rel), content);
}

/** Every kind of path git quotes or a line parser cuts, plus a staged rename. */
function dirty(repoRoot) {
  write(repoRoot, 'a b.md', 'changed\n');
  write(repoRoot, VIET, 'new\n');
  write(repoRoot, EDGE, 'new\n');
  write(repoRoot, TAB, 'new\n');
  git(repoRoot, ['mv', 'cũ.md', 'mới.md']);
}

test('statusPaths reads git status -z byte for byte, a rename as both halves', (t) => {
  const repoRoot = initRepo(t);
  dirty(repoRoot);
  const out = git(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);

  assert.deepEqual(statusPaths(out).sort(), [EDGE, 'a b.md', 'cũ.md', 'mới.md', TAB, VIET].sort());
});

test('statusPaths drops the trailing slash of a collapsed untracked directory', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, VIET, 'new\n');
  const out = git(repoRoot, ['status', '--porcelain=v1', '-z']);

  assert.deepEqual(statusPaths(out), ['tài liệu']);
});

test('nulPaths reads a -z name list byte for byte', (t) => {
  const repoRoot = initRepo(t);
  dirty(repoRoot);
  git(repoRoot, ['add', '-A']);
  const out = git(repoRoot, ['diff', '--cached', '--name-only', '--no-renames', '-z']);

  assert.deepEqual(nulPaths(out).sort(), [EDGE, 'a b.md', 'cũ.md', 'mới.md', TAB, VIET].sort());
  assert.deepEqual(nulPaths(''), []);
});

test('nameStatusPaths reads diff --name-status -z, a rename or copy as both halves', (t) => {
  const repoRoot = initRepo(t);
  dirty(repoRoot);
  git(repoRoot, ['add', '-A']);
  const out = git(repoRoot, ['diff', '--cached', '--name-status', '--find-renames', '-z']);

  assert.ok(out.includes('R100\0'), 'fixture must produce a rename record');
  assert.deepEqual([...nameStatusPaths(out)].sort(), [EDGE, 'a b.md', 'cũ.md', 'mới.md', TAB, VIET].sort());
});

test('checkoutDirtyPaths reads Vietnamese, edge-space and tab names, a staged rename as both halves', (t) => {
  const repoRoot = initRepo(t);
  dirty(repoRoot);

  assert.deepEqual(checkoutDirtyPaths(repoRoot, repoRoot).sort(), [EDGE, 'a b.md', 'cũ.md', 'mới.md', TAB, VIET].sort());
});

test('checkoutDirtyPaths names a new file inside an already-untracked directory', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, 'scratch/old.txt', 'old\n');
  const before = checkoutDirtyPaths(repoRoot, repoRoot);
  write(repoRoot, 'scratch/stray.txt', 'stray\n');
  const after = checkoutDirtyPaths(repoRoot, repoRoot);

  assert.deepEqual(after.filter((p) => !before.includes(p)), ['scratch/stray.txt']);
});

test('checkoutDirtyPaths sees untracked files when status.showUntrackedFiles is no', (t) => {
  const repoRoot = initRepo(t);
  git(repoRoot, ['config', 'status.showUntrackedFiles', 'no']);
  write(repoRoot, 'new.md', 'new\n');

  assert.deepEqual(checkoutDirtyPaths(repoRoot, repoRoot), ['new.md']);
});

test('isCheckoutDirty sees an untracked file when status.showUntrackedFiles is no', (t) => {
  const repoRoot = initRepo(t);
  git(repoRoot, ['config', 'status.showUntrackedFiles', 'no']);
  assert.equal(isCheckoutDirty(repoRoot, repoRoot), false);
  write(repoRoot, 'new.md', 'new\n');

  assert.equal(isCheckoutDirty(repoRoot, repoRoot), true);
});
