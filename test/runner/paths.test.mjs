import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

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

// The invocation-root door: which project, and which .fgos, a command acts on. The decision, its four policies and
// every refusal belong to fgos-git; its behaviour cases live in packages/git/rust/src/invocation_root.rs over the shared
// table (test/rust-host/fixtures/invocation-root-table.json), whose Node wiring proof is
// test/rust-host/invocation-root-table.test.mjs. These cases own only what the adapter itself does.

const real = (target) => fs.realpathSync.native(target);

test('facts passed in are the only Git answer the door and resolveMainCheckoutRoot use (one read per invocation)', () => {
  const plain = real(mkTempDir('paths-door-facts-'));
  const facts = { notARepository: false, worktreeRoot: plain, trustedMainRoot: plain };
  assert.equal(resolveMainCheckoutRoot('/nonexistent-cwd', { facts }), real(plain));
  assert.equal(resolveInvocationRoot({ cwd: '/nonexistent-cwd', policy: 'main-checkout', facts }).root, real(plain));
  fs.rmSync(plain, { recursive: true, force: true });
});

test("a refusal of the door is a validation error carrying the door's own text, for an untrusted checkout and for a blank --dir", () => {
  const repo = mkTempDir('paths-door-refusal-');
  initGitRepo(repo);
  const forged = real(mkTempDir('paths-door-forged-'));
  fs.writeFileSync(path.join(forged, '.git'), `gitdir: ${path.join(repo, '.git')}\n`);
  assert.throws(
    () => resolveInvocationRoot({ cwd: forged, policy: 'caller-tree', home: '/nonexistent-home' }),
    (err) => err.category === 'validation' && err.message.includes('cannot trust'),
  );
  assert.throws(
    () => resolveInvocationRoot({ cwd: repo, dir: ' ' }),
    (err) => err.category === 'validation' && err.message === '--dir requires a non-empty path value',
  );
  assert.throws(
    () => resolveInvocationRoot({ cwd: repo, dir: true }),
    (err) => err.category === 'validation' && err.message === '--dir requires a non-empty path value',
    'a flag given without a value',
  );
  fs.rmSync(forged, { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

test('an install with no Git door answers the directory itself for every policy but the destructive one, which refuses', () => {
  const plain = real(mkTempDir('paths-door-no-door-'));
  fs.mkdirSync(path.join(plain, '.fgos'));
  const module = pathToFileURL(path.resolve('src/runner/paths.mjs')).href;
  const ask = (request) => {
    const script = `import {resolveInvocationRoot} from ${JSON.stringify(module)};
      try { console.log(JSON.stringify(resolveInvocationRoot(${JSON.stringify(request)}))); } catch (e) { console.log(JSON.stringify({ category: e.category, message: e.message })); }`;
    const env = { ...process.env, FGOS_ACTIVE_RELEASE_PATH: '', FGOS_ACTIVE_MANIFEST_PATH: '', FGOS_HOST_BIN: '' };
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: plain, encoding: 'utf8', env }));
  };
  for (const policy of ['caller-tree', 'main-checkout', 'strict-cwd']) {
    assert.deepEqual(ask({ cwd: plain, policy }), { root: plain, fgosDir: path.join(plain, '.fgos'), found: true }, policy);
  }
  const refused = ask({ cwd: plain, policy: 'main-checkout-only' });
  assert.equal(refused.category, 'validation');
  assert.match(refused.message, /cannot establish the main checkout of .*git-addon-/);
  fs.rmSync(plain, { recursive: true, force: true });
});
