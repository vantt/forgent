// test/setup/uninstall-wiring-3.test.mjs — split out of uninstall-wiring.test.mjs
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
