import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { createGitConfigGuard, installGitConfigGuard, parseGitConfigWrite } from '../../scripts/lib/test-git-config-guard.mjs';

const GUARD_SOURCE = fileURLToPath(new URL('../../scripts/lib/test-git-config-guard.mjs', import.meta.url));
const created = [];
after(() => { for (const dir of created) fs.rmSync(dir, { recursive: true, force: true }); });

function tempDir(prefix) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  created.push(dir);
  return dir;
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A repository standing in for "the checkout running the suite", with a linked worktree and an uninitialised subdirectory. */
function protectedRepo() {
  const root = tempDir('fgos-guard-real-');
  git(root, 'init', '-q');
  git(root, '-c', 'user.name=Owner', '-c', 'user.email=owner@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'seed');
  const linked = path.join(tempDir('fgos-guard-linked-'), 'wt');
  git(root, 'worktree', 'add', '-q', '--detach', linked);
  const loose = path.join(root, 'not-a-fixture');
  fs.mkdirSync(loose);
  return { root, linked, loose, common: path.join(root, '.git') };
}

function guardFor(repo, extra = {}) {
  return createGitConfigGuard({
    protectedCommonDir: repo.common,
    rawExecFileSync: execFileSync,
    tempRoots: [fs.realpathSync(os.tmpdir())],
    env: { HOME: tempDir('fgos-guard-home-') },
    ...extra,
  });
}

test('parseGitConfigWrite recognises writes and ignores reads', () => {
  assert.deepEqual(parseGitConfigWrite(['config', 'user.email', 'a@b']), { dirs: [], globalScope: false });
  assert.deepEqual(parseGitConfigWrite(['-C', '/x', '-c', 'k=v', 'config', 'user.name', 'T']), { dirs: ['/x'], globalScope: false });
  assert.deepEqual(parseGitConfigWrite(['config', '--global', 'user.name', 'T']), { dirs: [], globalScope: true });
  assert.ok(parseGitConfigWrite(['config', '--unset', 'user.name']));
  assert.ok(parseGitConfigWrite(['config', '--add', 'remote.origin.fetch', 'x']));
  assert.equal(parseGitConfigWrite(['config', 'user.name']), null, 'one positional is a read');
  assert.equal(parseGitConfigWrite(['config', '--get', 'user.name']), null);
  assert.equal(parseGitConfigWrite(['config', '--get-regexp', '^user']), null);
  assert.equal(parseGitConfigWrite(['config', '--list']), null);
  assert.equal(parseGitConfigWrite(['commit', '-m', 'config user.name x']), null);
  assert.equal(parseGitConfigWrite(['-C', '/x', 'status']), null);
});

test('a config write inside the protected checkout is refused: explicit cwd, -C, no cwd, subdirectory and linked worktree', () => {
  const repo = protectedRepo();
  const assertNotProtected = guardFor(repo);
  const write = ['config', 'user.email', 'test@example.com'];
  assert.throws(() => assertNotProtected(write, repo.root), /refusing .* resolves to the checkout running the suite/);
  assert.throws(() => assertNotProtected(['-C', repo.root, ...write], os.tmpdir()), /refusing/);
  assert.throws(() => assertNotProtected(write, repo.loose), /refusing/, 'an uninitialised directory inside the checkout resolves to it');
  assert.throws(() => assertNotProtected(write, repo.linked), /refusing/, 'a linked worktree shares the checkout config');
  assert.throws(() => assertNotProtected(['config', '--unset', 'user.email'], repo.root), /refusing/);
  const before = process.cwd();
  try {
    process.chdir(repo.root);
    assert.throws(() => assertNotProtected(write, undefined), /refusing/, 'a missing cwd means the process cwd');
    assert.throws(() => assertNotProtected(write, ''), /refusing/, 'an empty cwd means the process cwd');
  } finally {
    process.chdir(before);
  }
  assert.doesNotMatch(git(repo.root, 'config', '--local', '--list'), /^user\./m, 'the guard never ran git');
});

test('a config write in its own temporary repository, or any read, is allowed', () => {
  const repo = protectedRepo();
  const assertNotProtected = guardFor(repo);
  const fixture = tempDir('fgos-guard-fixture-');
  git(fixture, 'init', '-q');
  assert.doesNotThrow(() => assertNotProtected(['config', 'user.email', 'test@example.com'], fixture));
  assert.doesNotThrow(() => assertNotProtected(['-C', fixture, 'config', 'user.name', 'Test'], repo.root));
  assert.doesNotThrow(() => assertNotProtected(['config', '--get', 'user.email'], repo.root));
  assert.doesNotThrow(() => assertNotProtected(['config', '--list'], repo.root));
  assert.doesNotThrow(() => assertNotProtected(['config', 'user.email', 'x'], tempDir('fgos-guard-plain-')), 'not a repository: git itself fails');
});

test('a global or system config write is refused unless HOME or GIT_CONFIG_GLOBAL is a temporary directory', () => {
  const repo = protectedRepo();
  const realHome = guardFor(repo, { env: { HOME: os.homedir() }, tempRoots: [path.join(os.tmpdir(), 'nowhere-near-home')] });
  assert.throws(() => realHome(['config', '--global', 'user.name', 'Test'], repo.root), /machine's own git config/);
  assert.throws(() => realHome(['config', '--system', 'user.name', 'Test'], repo.root), /machine's own git config/);
  assert.doesNotThrow(() => guardFor(repo)(['config', '--global', 'user.name', 'Test'], repo.root));
  const redirected = guardFor(repo, { env: { HOME: os.homedir(), GIT_CONFIG_GLOBAL: path.join(tempDir('fgos-guard-gcg-'), 'gitconfig') } });
  assert.doesNotThrow(() => redirected(['config', '--global', 'user.name', 'Test'], repo.root));
});

test('every child_process entry point is guarded, for argv and shell forms, and the refused call never reaches git', () => {
  const repo = protectedRepo();
  const calls = [];
  const fake = {};
  for (const name of ['execFileSync', 'execFile', 'spawnSync', 'spawn', 'execSync', 'exec']) fake[name] = (...args) => { calls.push(name); return args; };
  installGitConfigGuard(fake, guardFor(repo));
  const write = ['config', 'user.email', 'test@example.com'];
  for (const name of ['execFileSync', 'execFile', 'spawnSync', 'spawn']) {
    assert.throws(() => fake[name]('git', write, { cwd: repo.root }), /refusing/, name);
    assert.throws(() => fake[name]('/usr/bin/git', write, { cwd: repo.linked }), /refusing/, name);
  }
  for (const name of ['execSync', 'exec']) {
    assert.throws(() => fake[name]('git config user.email "test@example.com"', { cwd: repo.root }), /refusing/, name);
    assert.throws(() => fake[name]('git config user.email x && git config user.name Test', { cwd: repo.loose }), /refusing/, name);
  }
  assert.deepEqual(calls, [], 'a refused call is never forwarded');
  fake.execFileSync('git', write, { cwd: tempDir('fgos-guard-other-') });
  fake.execFileSync('git', ['status'], { cwd: repo.root });
  fake.execFileSync('node', ['-e', '0']);
  assert.deepEqual(calls, ['execFileSync', 'execFileSync', 'execFileSync']);
});

test('preloaded with --import from a checkout, the guard stops a fixture that forgot its own repository', () => {
  const checkout = tempDir('fgos-guard-preload-');
  git(checkout, 'init', '-q');
  fs.mkdirSync(path.join(checkout, 'scripts', 'lib'), { recursive: true });
  const guardCopy = path.join(checkout, 'scripts', 'lib', 'test-git-config-guard.mjs');
  fs.copyFileSync(GUARD_SOURCE, guardCopy);
  const probe = path.join(tempDir('fgos-guard-probe-'), 'probe.mjs');
  fs.writeFileSync(probe, `
import { execFileSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
const outcome = {};
for (const [label, run] of [
  ['no cwd', () => execFileSync('git', ['config', 'user.email', 'test@example.com'], { stdio: 'ignore' })],
  ['-C checkout', () => spawnSync('git', ['-C', process.argv[2], 'config', 'user.name', 'Test'], { stdio: 'ignore' })],
]) {
  try { run(); outcome[label] = 'ran'; } catch (err) { outcome[label] = /refusing/.test(err.message) ? 'refused' : err.message; }
}
process.stdout.write(JSON.stringify(outcome));
`);
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const run = spawnSync(process.execPath, ['--import', pathToFileURL(guardCopy).href, probe, checkout], { cwd: checkout, env, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), { 'no cwd': 'refused', '-C checkout': 'refused' });
  assert.doesNotMatch(git(checkout, 'config', '--local', '--list'), /^user\./m, 'nothing was written to the checkout');
});

test('util.promisify still resolves { stdout, stderr } through a guarded exec and execFile, and refuses a protected write', async () => {
  const repo = protectedRepo();
  const fake = {
    execFile: Object.assign(() => 'callback form', { [promisify.custom]: async () => ({ stdout: 'out', stderr: 'err' }) }),
    exec: Object.assign(() => 'callback form', { [promisify.custom]: async () => ({ stdout: 'out', stderr: 'err' }) }),
  };
  for (const name of ['execFileSync', 'execFile', 'spawnSync', 'spawn', 'execSync', 'exec']) fake[name] ??= () => undefined;
  installGitConfigGuard(fake, guardFor(repo));
  assert.deepEqual(await promisify(fake.execFile)('git', ['status'], { cwd: repo.root }), { stdout: 'out', stderr: 'err' });
  assert.deepEqual(await promisify(fake.exec)('git status', { cwd: repo.root }), { stdout: 'out', stderr: 'err' });
  assert.throws(() => promisify(fake.execFile)('git', ['config', 'user.name', 'Test'], { cwd: repo.root }), /refusing/);
  assert.throws(() => promisify(fake.exec)('git config user.name Test', { cwd: repo.root }), /refusing/);
});
