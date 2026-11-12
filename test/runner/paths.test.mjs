import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  resolveRepoRoot,
  resolveInvocationRoot,
  resolveMainCheckoutRoot,
  fgosDirFromRoot,
  resolveLogsDir,
  resolveSkillRoot,
} from '../../src/runner/paths.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initGitRepo(dir) {
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), '');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
}

test('resolveRepoRoot git-resolves the true top-level from a subdirectory', () => {
  const repo = mkTempDir('paths-git-root-');
  initGitRepo(repo);
  const subDir = path.join(repo, 'nested', 'deeper');
  fs.mkdirSync(subDir, { recursive: true });

  const root = resolveRepoRoot(subDir);

  assert.equal(
    fs.realpathSync.native ? fs.realpathSync.native(root) : fs.realpathSync(root),
    fs.realpathSync.native ? fs.realpathSync.native(repo) : fs.realpathSync(repo),
  );
  fs.rmSync(repo, { recursive: true, force: true });
});

test('resolveRepoRoot throws (validation) outside a git repository', () => {
  const dir = mkTempDir('paths-not-a-repo-');
  assert.throws(() => resolveRepoRoot(dir), (err) => err.category === 'validation');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fgosDirFromRoot joins .fgos onto an already-resolved root', () => {
  const root = path.resolve('/some/repo/root');
  assert.equal(fgosDirFromRoot(root), path.join(root, '.fgos'));
});

test('fgosDirFromRoot matches session.mjs\'s prior inline computation exactly (path.resolve + join)', () => {
  const root = 'relative/root';
  assert.equal(fgosDirFromRoot(root), path.join(path.resolve(root), '.fgos'));
});

test('resolveLogsDir joins logs onto an already-resolved .fgos dir', () => {
  assert.equal(resolveLogsDir('/repo/.fgos'), path.join('/repo/.fgos', 'logs'));
});

test('resolveSkillRoot returns null when CLAUDE_PROJECT_DIR is unset', () => {
  assert.equal(resolveSkillRoot({}), null);
});

test('resolveSkillRoot returns CLAUDE_PROJECT_DIR as-is when FGOS_NESTED_PREFIX is unset (standalone)', () => {
  assert.equal(resolveSkillRoot({ CLAUDE_PROJECT_DIR: '/workshop-root' }), '/workshop-root');
});

test('resolveSkillRoot joins FGOS_NESTED_PREFIX when set, matching the SKILL.md templates\' own ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} substitution', () => {
  assert.equal(
    resolveSkillRoot({ CLAUDE_PROJECT_DIR: '/workshop-root', FGOS_NESTED_PREFIX: 'repo' }),
    path.join('/workshop-root', 'repo'),
  );
});

// The invocation-root door: which project, and which .fgos, a command acts on. Retires the strict-cwd
// cases of resolveRepoRoot/resolveFgosDir (the strict-cwd policy below owns that behaviour).

const real = (target) => fs.realpathSync.native(target);

function projectWithStore() {
  const repo = real(mkTempDir('paths-door-'));
  initGitRepo(repo);
  fs.mkdirSync(path.join(repo, '.fgos'));
  fs.mkdirSync(path.join(repo, 'docs', 'deeper'), { recursive: true });
  return repo;
}

test('the door reads the project store from a subdirectory of the project, not a phantom one under it', () => {
  const repo = projectWithStore();
  const found = resolveInvocationRoot({ cwd: path.join(repo, 'docs', 'deeper'), home: '/nonexistent-home' });
  assert.deepEqual({ root: found.root, fgosDir: found.fgosDir, found: found.found }, { root: repo, fgosDir: path.join(repo, '.fgos'), found: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('the door never takes a store above the Git top level of the checkout', () => {
  const outer = real(mkTempDir('paths-door-outer-'));
  fs.mkdirSync(path.join(outer, '.fgos'));
  const inner = path.join(outer, 'nested');
  fs.mkdirSync(inner);
  initGitRepo(inner);
  const found = resolveInvocationRoot({ cwd: inner, home: '/nonexistent-home' });
  assert.deepEqual({ root: found.root, found: found.found }, { root: inner, found: false }, 'the nested repository owns its own store path');
  fs.rmSync(outer, { recursive: true, force: true });
});

test('the door never takes the global .fgos of the home directory as a project store', () => {
  const home = real(mkTempDir('paths-door-home-'));
  fs.mkdirSync(path.join(home, '.fgos'));
  const work = path.join(home, 'work', 'plain');
  fs.mkdirSync(work, { recursive: true });
  const found = resolveInvocationRoot({ cwd: work, home });
  assert.equal(found.found, false);
  assert.equal(resolveInvocationRoot({ cwd: home, home }).found, false);
  fs.rmSync(home, { recursive: true, force: true });
});

test('a linked worktree carries no store: the door finds none and names where one would be created', () => {
  const repo = projectWithStore();
  const worktree = path.join(real(mkTempDir('paths-door-wt-')), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', worktree, '-b', 'wt'], { cwd: repo });
  const found = resolveInvocationRoot({ cwd: worktree, home: '/nonexistent-home' });
  assert.deepEqual({ root: found.root, found: found.found }, { root: real(worktree), found: false });
  fs.rmSync(path.dirname(worktree), { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('main-checkout policy resolves the main root from a subdirectory and from a linked worktree', () => {
  const repo = projectWithStore();
  const worktree = path.join(real(mkTempDir('paths-door-main-wt-')), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', worktree, '-b', 'wt'], { cwd: repo });
  for (const cwd of [path.join(repo, 'docs'), worktree]) {
    assert.equal(resolveInvocationRoot({ cwd, policy: 'main-checkout' }).root, repo);
  }
  fs.rmSync(path.dirname(worktree), { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('main-checkout-only policy refuses a --dir that is another repository, and accepts the main root itself', () => {
  const repo = projectWithStore();
  const other = real(mkTempDir('paths-door-other-'));
  initGitRepo(other);
  assert.throws(
    () => resolveInvocationRoot({ cwd: repo, dir: other, policy: 'main-checkout-only' }),
    (err) => err.category === 'validation' && err.message.includes(repo),
  );
  assert.equal(resolveInvocationRoot({ cwd: path.join(repo, 'docs'), dir: repo, policy: 'main-checkout-only' }).root, repo);
  assert.equal(resolveInvocationRoot({ cwd: repo, dir: other, policy: 'main-checkout' }).root, other, 'main-checkout takes a named project as given');
  fs.rmSync(other, { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('caller-tree takes --dir as given, and an empty --dir is refused', () => {
  const dir = real(mkTempDir('paths-door-dir-'));
  assert.equal(resolveInvocationRoot({ cwd: '/', dir }).fgosDir, path.join(dir, '.fgos'));
  assert.throws(() => resolveInvocationRoot({ cwd: dir, dir: ' ' }), (err) => err.category === 'validation');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('strict-cwd policy is cwd itself, and refuses a subdirectory of a repository naming its top level', () => {
  const repo = projectWithStore();
  assert.equal(resolveInvocationRoot({ cwd: repo, policy: 'strict-cwd' }).fgosDir, path.join(repo, '.fgos'));
  assert.throws(
    () => resolveInvocationRoot({ cwd: path.join(repo, 'docs'), policy: 'strict-cwd' }),
    (err) => err.category === 'validation' && err.message.includes(repo),
  );
  const plain = real(mkTempDir('paths-door-plain-'));
  assert.equal(resolveInvocationRoot({ cwd: plain, policy: 'strict-cwd' }).root, plain);
  fs.rmSync(plain, { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('facts passed in are the only Git answer the door and resolveMainCheckoutRoot use (one read per invocation)', () => {
  const plain = real(mkTempDir('paths-door-facts-'));
  const facts = { notARepository: false, worktreeRoot: plain, trustedMainRoot: plain };
  assert.equal(resolveMainCheckoutRoot('/nonexistent-cwd', { facts }), real(plain));
  assert.equal(resolveInvocationRoot({ cwd: '/nonexistent-cwd', policy: 'main-checkout', facts }).root, real(plain));
  fs.rmSync(plain, { recursive: true, force: true });
});

test('a checkout whose gitfile does not point back to the repository it names is refused, never acted on as its cwd', () => {
  const repo = projectWithStore();
  const forged = real(mkTempDir('paths-door-forged-'));
  fs.writeFileSync(path.join(forged, '.git'), `gitdir: ${path.join(repo, '.git')}\n`);
  for (const policy of ['caller-tree', 'main-checkout', 'strict-cwd']) {
    assert.throws(
      () => resolveInvocationRoot({ cwd: forged, policy, home: '/nonexistent-home' }),
      (err) => err.category === 'validation' && err.message.includes('cannot trust'),
      policy,
    );
  }
  fs.rmSync(forged, { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('an unreadable Git answer refuses by name under every policy but caller-tree, and the destructive policy also refuses a non-repository', () => {
  const plain = real(mkTempDir('paths-door-unreadable-'));
  const broken = () => { throw new Error('git below the floor'); };
  const asked = (policy, extra = {}) => () => resolveInvocationRoot({ cwd: plain, policy, home: '/nonexistent-home', readFacts: broken, ...extra });
  const refused = (err) => err.category === 'validation' && err.message.includes('cannot establish the main checkout');
  assert.throws(asked('main-checkout-only'), refused, 'main-checkout-only without --dir');
  assert.throws(asked('main-checkout-only', { dir: plain }), refused, 'main-checkout-only with --dir never opens the gate');
  assert.throws(asked('main-checkout'), refused, 'main-checkout');
  assert.throws(asked('strict-cwd'), refused, 'strict-cwd');
  assert.equal(asked('caller-tree')().found, false, 'caller-tree reads an unreadable answer as no repository');
  const noDoor = () => { throw Object.assign(new Error('addon not shipped'), { code: 'git-addon-unavailable' }); };
  assert.equal(resolveInvocationRoot({ cwd: plain, policy: 'main-checkout', readFacts: noDoor }).root, plain, 'an install with no Git door has no repository to refuse on');
  assert.throws(
    () => resolveInvocationRoot({ cwd: plain, dir: plain, policy: 'main-checkout-only', readFacts: noDoor }),
    refused,
    'the destructive policy has no exception for a missing Git door',
  );
  const notARepo = () => ({ notARepository: true });
  assert.equal(resolveInvocationRoot({ cwd: plain, policy: 'main-checkout', readFacts: notARepo }).root, plain, 'a genuine non-repository falls back to cwd');
  assert.throws(
    () => resolveInvocationRoot({ cwd: plain, dir: plain, policy: 'main-checkout-only', readFacts: notARepo }),
    (err) => err.category === 'validation' && err.message.includes('not inside a Git repository'),
  );
  fs.rmSync(plain, { recursive: true, force: true });
});

test('the trust refusal is matched on the structured cause of the Git error, not on its message text', () => {
  const plain = real(mkTempDir('paths-door-cause-'));
  const trust = () => { throw new Error(JSON.stringify({ cause: 'untrusted-worktree', stderr: [] })); };
  assert.throws(
    () => resolveInvocationRoot({ cwd: plain, policy: 'caller-tree', home: '/nonexistent-home', readFacts: trust }),
    (err) => err.message.includes('cannot trust'),
  );
  const noise = () => { throw new Error('mentions untrusted-worktree only in text'); };
  assert.equal(resolveInvocationRoot({ cwd: plain, policy: 'caller-tree', home: '/nonexistent-home', readFacts: noise }).found, false);
  fs.rmSync(plain, { recursive: true, force: true });
});
