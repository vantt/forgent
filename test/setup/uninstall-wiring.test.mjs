// test/setup/uninstall-wiring.test.mjs — tsk-4iv-1: `fgos uninstall`
// reverses `fgos setup`'s own wiring (docs/history/fgos-uninstall/
// CONTEXT.md D2-D4). Package removal (D1) is out of scope here — that's
// tsk-4iv-2's own spike, layered onto this same verb later.
//
// tsk-25b D5: the two real `fgos uninstall` CLI round-trip tests each run a
// full `fgos setup` first (materializeSkillsIntoProject copies the whole
// `.agents/skills` tree), ~17s apiece — split into
// uninstall-wiring-2.test.mjs/uninstall-wiring-3.test.mjs so no single file
// carries both and crosses the ~30s per-file ceiling. Mechanical split only,
// same D2 invariant as the rest of this item.
//
// `setup` appends a source line under $HOME, so — same reasoning
// test/cli/fgos.test.mjs's own "setup inside a .fgos/-less linked worktree"
// test already gives — every CLI call below runs against a throwaway HOME,
// never the real one.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { installGitHooks, uninstallGitHooks } from '../../src/setup/git-hooks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function mkTemp(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function run(cwd, args, extraEnv = {}) {
  const opts = { cwd, encoding: 'utf8' };
  if (Object.keys(extraEnv).length > 0) {
    opts.env = { ...process.env, ...extraEnv };
  }
  return spawnSync(process.execPath, [FGOS, ...args], opts);
}

function initGitRepo(cwd) {
  initFixtureRepo(cwd);
}

// --- unit: uninstallGitHooks (mirrors installGitHooks's own fill-only test
// style in test/setup/git-hooks.test.mjs, if/when that file exists — written
// standalone here since none did at the time of this item). ---

test('uninstallGitHooks preserves a relative hook setting without ownership provenance', () => {
  const cwd = mkTemp('uninstall-hooks-owned-');
  initGitRepo(cwd);
  fs.mkdirSync(path.join(cwd, '.githooks'));
  fs.writeFileSync(path.join(cwd, '.githooks', 'pre-commit'), '#!/bin/sh\nexit 0\n');
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });

  const result = uninstallGitHooks(cwd);

  assert.deepEqual(result, { unwired: false, skippedExisting: '.githooks' });
  assert.equal(execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim(), '.githooks');
  assert.equal(fs.existsSync(path.join(cwd, '.githooks', 'pre-commit')), true);
  assert.equal(fs.existsSync(path.join(cwd, '.githooks')), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('uninstallGitHooks removes its journaled hook setting and the now-empty directory', () => {
  const cwd = mkTemp('uninstall-hooks-absolute-');
  initGitRepo(cwd);
  fs.mkdirSync(path.join(cwd, '.githooks'));
  fs.writeFileSync(path.join(cwd, '.githooks', 'pre-commit'), '#!/bin/sh\nexit 0\n');
  assert.deepEqual(installGitHooks(cwd), { wired: true, skippedExisting: null });

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

test('uninstallGitHooks preserves tracked hook bytes after removing owned configuration', () => {
  const cwd = mkTemp('uninstall-hooks-tracked-');
  try {
    initGitRepo(cwd);
    fs.mkdirSync(path.join(cwd, '.githooks'));
    const hook = path.join(cwd, '.githooks/pre-commit');
    fs.writeFileSync(hook, '#!/bin/sh\nexit 0\n');
    execFileSync('git', ['add', '.githooks/pre-commit'], { cwd });
    execFileSync('git', ['commit', '-qm', 'track hook'], { cwd });
    assert.equal(installGitHooks(cwd).wired, true);
    assert.deepEqual(uninstallGitHooks(cwd), { unwired: true, skippedExisting: null });
    assert.equal(fs.readFileSync(hook, 'utf8'), '#!/bin/sh\nexit 0\n');
    assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }).trim(), '');
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
