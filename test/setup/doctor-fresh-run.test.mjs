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

test('e2e: addon-less npm channel refuses init actionably before project state writes', () => {
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

    // (3) externalCwd gets its own git repo -- a realistic stand-in for "the
    // user's own project", so main-checkout-hook-wired (str65) is fairly
    // assessed instead of failing for the unrelated reason of "not a git
    // repo at all". Test scaffolding only, never a product-code change.
    execFileSync('git', ['init', '-q'], { cwd: externalCwd, encoding: 'utf8', shell: isWin });

    // tsk-4xg: `doctor`/`doctor --fix` now also run the real
    // `claude-plugin-marketplace` check/fix, which shells out to a real,
    // mutating external CLI (`claude plugin marketplace add`/`install`)
    // when the `claude` binary is present. FGOS_CLAUDE_COMMAND
    // (registrations.mjs's own test-only seam, mirroring bin/fgos.mjs's
    // FGOS_GH_COMMAND for `gh`) points it at a path that never exists, so
    // this e2e run sees "claude CLI not found" and no-ops that fix, never
    // touching this machine's real Claude Code config as a side effect of
    // running the test suite.
    const run = (args) =>
      spawnSync(fgosBin, args, {
        cwd: externalCwd,
        encoding: 'utf8',
        shell: isWin,
        env: { ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' },
      });

    // M10: npm remains addon-less; refuse before either store is created.
    const init = run(['init']);
    assert.notEqual(init.status, 0, 'an addon-less npm channel must refuse init');
    assert.match(init.stderr, /git-addon-unavailable.*npm\/legacy Node channel/);
    assert.match(init.stderr, /fgctl.*components\.nativeAddon/);
    assert.equal(fs.existsSync(path.join(externalCwd, '.fgos')), false,
      'channel refusal must precede all project state writes');
    assert.equal(fs.existsSync(path.join(externalCwd, '.git', 'fgos')), false,
      'channel refusal must not create native store state');

  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installPrefix, { recursive: true, force: true });
    fs.rmSync(externalCwd, { recursive: true, force: true });
  }
});
