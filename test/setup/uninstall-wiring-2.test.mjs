// test/setup/uninstall-wiring-2.test.mjs — split out of uninstall-wiring.test.mjs
// (tsk-25b D5): the real `fgos uninstall` CLI round-trip tests each run a
// full `fgos setup` first, ~17s apiece — kept apart so no single file
// carries two of them and crosses the ~30s per-file ceiling.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

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
