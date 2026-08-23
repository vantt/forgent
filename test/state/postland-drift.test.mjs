import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { postLandDrift } from '../../src/state/postland-drift.mjs';

const TRUNK = 'main';

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-postland-drift-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', TRUNK], { cwd: repoRoot });
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

function checkoutNewBranch(repoRoot, branch, from = 'main') {
  git(repoRoot, ['checkout', '-q', from]);
  git(repoRoot, ['checkout', '-q', '-b', branch]);
}

function commitFile(repoRoot, filename, content) {
  fs.writeFileSync(path.join(repoRoot, filename), content);
  git(repoRoot, ['add', filename]);
  git(repoRoot, ['commit', '-q', '-m', `add ${filename}`]);
}

function item(id, overrides = {}) {
  return { id, status: 'doing', ...overrides };
}

test('postLandDrift returns empty object when open leaf has no path overlap with landed work on target', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/leaf1');
  commitFile(repoRoot, 'leaf-file.txt', 'leaf work\n');
  checkoutNewBranch(repoRoot, 'fgw/landed1', 'main');
  commitFile(repoRoot, 'unrelated-landed.txt', 'landed work\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'fgw/landed1']);

  const view = {
    work: {
      landed1: item('landed1', { status: 'done' }),
      leaf1: item('leaf1', { status: 'doing' }),
    },
  };
  const sessions = [{ sessionId: 'sess-1', itemId: 'leaf1' }];

  const result = postLandDrift(repoRoot, view, { trunk: TRUNK, sessions });
  assert.deepEqual(result, {});
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('postLandDrift returns finding when open leaf overlaps paths with target land and has a live session', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/leaf1');
  commitFile(repoRoot, 'shared-file.txt', 'leaf version\n');
  checkoutNewBranch(repoRoot, 'fgw/landed1', 'main');
  commitFile(repoRoot, 'shared-file.txt', 'landed version\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'fgw/landed1']);

  const view = {
    work: {
      landed1: item('landed1', { status: 'done' }),
      leaf1: item('leaf1', { status: 'doing' }),
    },
  };
  const sessions = [{ sessionId: 'sess-1', itemId: 'leaf1' }];

  const result = postLandDrift(repoRoot, view, { trunk: TRUNK, sessions });
  assert.equal(result.leaf1.id, 'leaf1');
  assert.equal(result.leaf1.branch, 'fgw/leaf1');
  assert.equal(result.leaf1.target, 'main');
  assert.deepEqual(result.leaf1.shared, ['shared-file.txt']);
  assert.deepEqual(result.leaf1.sessionIds, ['sess-1']);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('postLandDrift excludes items with no live session (stale exclusion)', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/leaf1');
  commitFile(repoRoot, 'shared-file.txt', 'leaf version\n');
  checkoutNewBranch(repoRoot, 'fgw/landed1', 'main');
  commitFile(repoRoot, 'shared-file.txt', 'landed version\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'fgw/landed1']);

  const view = {
    work: {
      landed1: item('landed1', { status: 'done' }),
      leaf1: item('leaf1', { status: 'doing' }),
    },
  };
  const sessions = []; // no live sessions

  const result = postLandDrift(repoRoot, view, { trunk: TRUNK, sessions });
  assert.deepEqual(result, {});
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('postLandDrift returns union of changed files across multiple intervening lands (D6)', () => {
  const repoRoot = initRepo();
  checkoutNewBranch(repoRoot, 'fgw/leaf1');
  commitFile(repoRoot, 'fileA.txt', 'leaf version A\n');
  commitFile(repoRoot, 'fileB.txt', 'leaf version B\n');

  // Land 1 on main touches fileA.txt
  checkoutNewBranch(repoRoot, 'fgw/landed1', 'main');
  commitFile(repoRoot, 'fileA.txt', 'land 1 version A\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'fgw/landed1']);

  // Land 2 on main touches fileB.txt
  checkoutNewBranch(repoRoot, 'fgw/landed2', 'main');
  commitFile(repoRoot, 'fileB.txt', 'land 2 version B\n');
  git(repoRoot, ['checkout', '-q', 'main']);
  git(repoRoot, ['merge', '-q', '--no-ff', 'fgw/landed2']);

  const view = {
    work: {
      landed1: item('landed1', { status: 'done' }),
      landed2: item('landed2', { status: 'done' }),
      leaf1: item('leaf1', { status: 'doing' }),
    },
  };
  const sessions = [{ sessionId: 'sess-1', itemId: 'leaf1' }];

  const result = postLandDrift(repoRoot, view, { trunk: TRUNK, sessions });
  assert.deepEqual(result.leaf1.shared, ['fileA.txt', 'fileB.txt']);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('postLandDrift skips item silently when target branch is deleted/missing (D8)', () => {
  const repoRoot = initRepo();
  // fgw/root branch does NOT exist locally
  checkoutNewBranch(repoRoot, 'fgw/leaf1');
  commitFile(repoRoot, 'fileA.txt', 'leaf version\n');

  const view = {
    work: {
      root: item('root', { status: 'doing' }),
      leaf1: item('leaf1', { status: 'doing', parent: 'root' }),
    },
  };
  const sessions = [{ sessionId: 'sess-1', itemId: 'leaf1' }];

  assert.doesNotThrow(() => {
    const result = postLandDrift(repoRoot, view, { trunk: TRUNK, sessions });
    assert.deepEqual(result, {});
  });
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
