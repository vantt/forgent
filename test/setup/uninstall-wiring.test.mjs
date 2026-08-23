// test/setup/uninstall-wiring.test.mjs — tsk-4iv-1: `fgos uninstall`
// reverses `fgos setup`'s own wiring (docs/history/fgos-uninstall/
// CONTEXT.md D2-D4). Package removal (D1) is out of scope here — that's
// tsk-4iv-2's own spike, layered onto this same verb later.
//
// `setup` appends a source line under $HOME, so — same reasoning
// test/cli/fgos.test.mjs's own "setup inside a .fgos/-less linked worktree"
// test already gives — every CLI call below runs against a throwaway HOME,
// never the real one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import { uninstallGitHooks } from '../../src/setup/git-hooks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function run(cwd, args, extraEnv = {}) {
  const opts = { cwd, encoding: 'utf8' };
  if (Object.keys(extraEnv).length > 0) {
    opts.env = { ...process.env, ...extraEnv };
  }
  return spawnSync(process.execPath, [FGOS, ...args], opts);
}

function initGitRepo(cwd) {
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
}

// --- unit: uninstallGitHooks (mirrors installGitHooks's own fill-only test
// style in test/setup/git-hooks.test.mjs, if/when that file exists — written
// standalone here since none did at the time of this item). ---

test('uninstallGitHooks unwires and deletes .githooks/pre-commit + the now-empty dir when hooksPath is exactly .githooks', () => {
  const cwd = mkTemp('uninstall-hooks-owned-');
  initGitRepo(cwd);
  fs.mkdirSync(path.join(cwd, '.githooks'));
  fs.writeFileSync(path.join(cwd, '.githooks', 'pre-commit'), '#!/bin/sh\nexit 0\n');
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });

  const result = uninstallGitHooks(cwd);

  assert.deepEqual(result, { unwired: true, skippedExisting: null });
  assert.throws(() => execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }));
  assert.equal(fs.existsSync(path.join(cwd, '.githooks', 'pre-commit')), false);
  assert.equal(fs.existsSync(path.join(cwd, '.githooks')), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('uninstallGitHooks unwires an absolute core.hooksPath resolving to repoRoot/.githooks, same as the relative form', () => {
  const cwd = mkTemp('uninstall-hooks-absolute-');
  initGitRepo(cwd);
  fs.mkdirSync(path.join(cwd, '.githooks'));
  fs.writeFileSync(path.join(cwd, '.githooks', 'pre-commit'), '#!/bin/sh\nexit 0\n');
  execFileSync('git', ['config', 'core.hooksPath', path.join(cwd, '.githooks')], { cwd });

  const result = uninstallGitHooks(cwd);

  assert.deepEqual(result, { unwired: true, skippedExisting: null });
  assert.throws(() => execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }));
  assert.equal(fs.existsSync(path.join(cwd, '.githooks', 'pre-commit')), false);
  assert.equal(fs.existsSync(path.join(cwd, '.githooks')), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('uninstallGitHooks leaves a custom hooksPath completely untouched', () => {
  const cwd = mkTemp('uninstall-hooks-custom-');
  initGitRepo(cwd);
  fs.mkdirSync(path.join(cwd, '.husky'));
  execFileSync('git', ['config', 'core.hooksPath', '.husky'], { cwd });

  const result = uninstallGitHooks(cwd);

  assert.deepEqual(result, { unwired: false, skippedExisting: '.husky' });
  assert.equal(
    execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim(),
    '.husky',
  );
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('uninstallGitHooks is a no-op when hooksPath was never set', () => {
  const cwd = mkTemp('uninstall-hooks-unset-');
  initGitRepo(cwd);

  const result = uninstallGitHooks(cwd);

  assert.deepEqual(result, { unwired: false, skippedExisting: null });
  fs.rmSync(cwd, { recursive: true, force: true });
});

// --- CLI: the real `fgos uninstall` verb, confirmation gate + full round
// trip against a real `fgos setup` run first. ---

test('uninstall with no --yes refuses (exit 4) and touches nothing', () => {
  const cwd = mkTemp('uninstall-cli-noyes-');
  const home = mkTemp('uninstall-cli-noyes-home-');
  initGitRepo(cwd);
  assert.equal(run(cwd, ['init']).status, 0);
  const setupResult = run(cwd, ['setup'], { HOME: home });
  assert.equal(setupResult.status, 0, `setup failed: ${setupResult.stderr}`);
  const hooksPathBefore = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
  assert.equal(hooksPathBefore, path.join(cwd, '.githooks'), 'setup must have wired hooksPath before this test proves uninstall refuses to touch it');

  const result = run(cwd, ['uninstall'], { HOME: home });

  assert.equal(result.status, 4, `expected validation refusal, got status ${result.status}: ${result.stderr}`);
  assert.equal(
    execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim(),
    path.join(cwd, '.githooks'),
    'a refused uninstall must not touch core.hooksPath',
  );
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
});

test('uninstall --yes unwires hooks, reports (never deletes) the shell-rc source line, and leaves .fgos/config.json byte-identical', () => {
  const cwd = mkTemp('uninstall-cli-yes-');
  const home = mkTemp('uninstall-cli-yes-home-');
  fs.writeFileSync(path.join(home, '.bashrc'), '# pre-existing rc content\n');
  initGitRepo(cwd);
  assert.equal(run(cwd, ['init']).status, 0);
  const setupResult = run(cwd, ['setup'], { HOME: home });
  assert.equal(setupResult.status, 0, `setup failed: ${setupResult.stderr}`);

  const rcFile = path.join(home, '.bashrc');
  const rcContentBeforeUninstall = fs.readFileSync(rcFile, 'utf8');
  assert.match(rcContentBeforeUninstall, /fgos-shell-integration\.sh/, 'setup must have inserted the fgos source line before this test proves uninstall reports (not deletes) it');

  const configPath = path.join(cwd, '.fgos', 'config.json');
  const configBefore = fs.readFileSync(configPath, 'utf8');

  const result = run(cwd, ['uninstall', '--yes'], { HOME: home });
  assert.equal(result.status, 0, `uninstall --yes failed: ${result.stderr}`);
  const data = JSON.parse(result.stdout).data;

  assert.equal(data.hooksUnwired, true);
  assert.equal(data.hooksSkippedExisting, null);
  assert.throws(
    () => execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }),
    'core.hooksPath must be unset after uninstall --yes',
  );
  assert.equal(fs.existsSync(path.join(cwd, '.githooks')), false);

  assert.equal(data.shellRcSourceLinesFound.length, 1);
  assert.equal(data.shellRcSourceLinesFound[0].rcFile, rcFile);
  assert.match(data.shellRcRemovalInstructions, /remove.*by hand/i);

  // D4's whole point: the rc file itself is never touched, byte-for-byte.
  assert.equal(fs.readFileSync(rcFile, 'utf8'), rcContentBeforeUninstall);

  // Pinned constraint (CONTEXT.md): .fgos/config.json is never touched.
  assert.equal(fs.readFileSync(configPath, 'utf8'), configBefore);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
});
