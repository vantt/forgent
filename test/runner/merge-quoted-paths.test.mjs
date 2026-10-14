// The approve/merge path reads file names git would quote (a non-ASCII byte, a tab, a quote)
// and names with edge spaces byte for byte, and a rename as both its halves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  changedFiles,
  isWorkingTreeClean,
  buildOwnFileSet,
  nextFreeDecisionId,
} from '../../src/runner/merge.mjs';
import { postLandDrift } from '../../src/state/postland-drift.mjs';

const VIET = 'tài liệu/ghi chú.md';
const EDGE = ' lề .md';

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function initRepo(t) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-merge-quoted-'));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  git(repoRoot, ['init', '-q', '-b', 'main']);
  git(repoRoot, ['config', 'user.email', 'test@example.com']);
  git(repoRoot, ['config', 'user.name', 'Test']);
  write(repoRoot, 'seed.txt', 'seed\n');
  commitAll(repoRoot, 'seed');
  return repoRoot;
}

function write(repoRoot, rel, content) {
  fs.mkdirSync(path.dirname(path.join(repoRoot, rel)), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, rel), content);
}

function commitAll(repoRoot, message) {
  git(repoRoot, ['add', '-A']);
  git(repoRoot, ['commit', '-q', '-m', message]);
}

test('changedFiles lists a branch\'s Vietnamese, edge-space and renamed paths byte for byte, a rename as both halves', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, 'cũ.md', 'old\n');
  commitAll(repoRoot, 'old');
  git(repoRoot, ['checkout', '-q', '-b', 'fgw/demo-item']);
  write(repoRoot, VIET, 'note\n');
  write(repoRoot, EDGE, 'edge\n');
  git(repoRoot, ['mv', 'cũ.md', 'mới.md']);
  commitAll(repoRoot, 'work');
  git(repoRoot, ['checkout', '-q', 'main']);

  assert.deepEqual(changedFiles(repoRoot, { id: 'demo-item' }).sort(), [EDGE, 'cũ.md', 'mới.md', VIET].sort());
});

test('isWorkingTreeClean blocks on the item\'s own dirty Vietnamese and edge-space paths', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, VIET, 'v1\n');
  write(repoRoot, EDGE, 'v1\n');
  commitAll(repoRoot, 'files');

  write(repoRoot, VIET, 'v2\n');
  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], [VIET])), false);
  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], ['other.md'])), true);

  git(repoRoot, ['checkout', '--', VIET]);
  write(repoRoot, EDGE, 'v2\n');
  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], [EDGE])), false);
});

test('isWorkingTreeClean blocks on a staged rename when either half is the item\'s own path', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, 'cũ.md', 'old\n');
  commitAll(repoRoot, 'old');
  git(repoRoot, ['mv', 'cũ.md', 'mới.md']);

  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], ['cũ.md'])), false);
  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], ['mới.md'])), false);
  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], ['khác.md'])), true);
});

test('isWorkingTreeClean blocks on the item\'s own untracked file inside a new directory', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, VIET, 'new\n');

  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], [VIET])), false);
  assert.equal(isWorkingTreeClean(repoRoot, buildOwnFileSet([], ['other.md'])), true);
});

test('isWorkingTreeClean still ignores a .fgos path git would quote', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, '.fgos/sự kiện.jsonl', '{}\n');

  assert.equal(isWorkingTreeClean(repoRoot), true);
});

test('nextFreeDecisionId reads a decision file with a Vietnamese slug', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, 'docs/decisions/0041-quyết-định.md', '# 0041\n');
  commitAll(repoRoot, 'decision');

  assert.equal(nextFreeDecisionId(repoRoot, 'HEAD'), '0042');
});

test('postLandDrift names a shared Vietnamese path and a path one side renamed away', (t) => {
  const repoRoot = initRepo(t);
  write(repoRoot, VIET, 'v1\n');
  write(repoRoot, 'cũ.md', 'old\n');
  commitAll(repoRoot, 'base');
  git(repoRoot, ['checkout', '-q', '-b', 'fgw/leaf1']);
  write(repoRoot, VIET, 'leaf\n');
  write(repoRoot, 'cũ.md', 'leaf edit\n');
  commitAll(repoRoot, 'leaf');
  git(repoRoot, ['checkout', '-q', 'main']);
  write(repoRoot, VIET, 'main\n');
  git(repoRoot, ['mv', 'cũ.md', 'mới.md']);
  commitAll(repoRoot, 'main');

  const view = { work: { landed1: { id: 'landed1', status: 'done' }, leaf1: { id: 'leaf1', status: 'doing' } } };
  const result = postLandDrift(repoRoot, view, { trunk: 'main', sessions: [{ sessionId: 's1', itemId: 'leaf1' }] });
  assert.deepEqual(result.leaf1?.shared, ['cũ.md', VIET].sort());
});
