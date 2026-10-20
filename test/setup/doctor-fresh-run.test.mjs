// test/setup/doctor-fresh-run.test.mjs -- e2e proof for the npm/GitHub install channel in a
// genuinely fresh external project (pack -> npm install -g -> init). That channel ships no native
// Git addon, and Git has one door (the addon), so there is no addon-less Git read path: in a
// project no `fgctl init` has activated, `fgos init` refuses with a message that names
// `fgctl init` and changes nothing. New onboarding goes through `fgctl init`
// (docs/specs/distribution.md, Entry Points); the doctor-check state of an onboarded project is
// proven by the fgctl init tests, which run the real runtime tail (init, doctor --fix, doctor).
// Mirrors test/install-packaging.test.mjs's real-process pattern (spawnSync the actual installed
// binary, no mocks).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const isWin = process.platform === 'win32';

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('e2e: on the npm channel, fgos init in a fresh external project refuses and names fgctl init, and changes nothing', () => {
  const packDir = mkTemp('fgos-doctor-pack-');
  const installPrefix = mkTemp('fgos-doctor-install-');
  const externalCwd = mkTemp('fgos-doctor-external-');

  try {
    // (1) npm pack into the scratch dir, same as install-packaging.test.mjs.
    const packOut = execFileSync(
      'npm',
      ['pack', '--json', '--pack-destination', packDir],
      { cwd: REPO_ROOT, encoding: 'utf8', shell: isWin },
    );
    const tarballName = JSON.parse(packOut)[0].filename;
    const tarballPath = path.join(packDir, tarballName);

    // (2) npm install -g the tarball into a scratch --prefix.
    const install = spawnSync(
      'npm',
      ['install', '-g', tarballPath, '--prefix', installPrefix],
      { cwd: packDir, encoding: 'utf8', shell: isWin },
    );
    assert.equal(install.status, 0, `npm install -g failed: ${install.stderr}`);

    const fgosBin = isWin
      ? path.join(installPrefix, 'fgos.cmd')
      : path.join(installPrefix, 'bin', 'fgos');
    assert.ok(fs.existsSync(fgosBin), `installed fgos binary not found at ${fgosBin}`);

    // (3) externalCwd is the user's own fresh git project.
    execFileSync('git', ['init', '-q'], { cwd: externalCwd, encoding: 'utf8', shell: isWin });
    const before = fs.readdirSync(externalCwd).sort();

    const init = spawnSync(fgosBin, ['init'], {
      cwd: externalCwd,
      encoding: 'utf8',
      shell: isWin,
      env: { ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' },
    });
    assert.notEqual(init.status, 0, 'fgos init must refuse on a channel that ships no addon');
    assert.match(
      init.stderr,
      /git-addon-unavailable: addon not shipped on this channel: onboard this project with `fgctl init`/,
      'the refusal names the addon and the way to onboard',
    );
    assert.deepEqual(fs.readdirSync(externalCwd).sort(), before, 'a refused init changes nothing in the project');
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installPrefix, { recursive: true, force: true });
    fs.rmSync(externalCwd, { recursive: true, force: true });
  }
});
