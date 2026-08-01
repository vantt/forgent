// test/setup/doctor-fresh-run.test.mjs — tsk-49r D4 e2e proof: a genuinely
// fresh external project (pack -> npm install -g -> init -> setup) reaches
// the doctor-check state a real first-time user would see. Mirrors
// test/install-packaging.test.mjs's real-process pattern (spawnSync the
// actual installed binary, no mocks).
//
// shell-integration-sourced is asserted separately, never folded into the
// "must pass" set: it is architecturally exclusive to a dev-checkout copy
// (README.md's own "Dev shell helpers" section, integrationScriptPath()'s
// own doc comment in src/setup/checks.mjs) -- a globally npm-installed copy
// has no stable checkout path to source, so `fgos setup` deliberately
// declines writing that source line (rcWriteDeclinedReason) and the check
// can never legitimately report passed:true here. Confirmed by manually
// tracing init -> setup -> doctor against a real fresh external dir before
// writing this file, not assumed from source reading alone.
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

test('e2e: fresh external project reaches expected fgos doctor state after init + setup', () => {
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

    const run = (args) => spawnSync(fgosBin, args, { cwd: externalCwd, encoding: 'utf8', shell: isWin });

    const init = run(['init']);
    assert.equal(init.status, 0, `fgos init failed: ${init.stderr}`);

    const setup = run(['setup']);
    assert.equal(setup.status, 0, `fgos setup failed: ${setup.stderr}`);

    const doctor = run(['doctor']);
    assert.equal(doctor.status, 0, `fgos doctor failed: ${doctor.stderr}`);
    const { checks } = JSON.parse(doctor.stdout).data;

    // fgos doctor always exits 0 regardless of individual check results (it
    // is a read-only diagnostic, never a gate by exit code) -- confirmed by
    // reading bin/fgos.mjs's doctor case before writing this assertion, so
    // the real proof has to walk the parsed checks array itself.
    const byId = new Map(checks.map((c) => [c.id, c]));
    const mustPass = [
      'node-version-and-git',
      'config-not-stale',
      'main-checkout-hook-wired',
      'tool-registry-configured',
    ];
    for (const id of mustPass) {
      const c = byId.get(id);
      assert.ok(c, `doctor did not report a "${id}" check`);
      assert.equal(c.passed, true, `"${id}" expected to pass on a fresh init+setup project: ${c.message}`);
    }

    // shell-integration-sourced: never asserted passed:true here (see file
    // header) -- only that doctor reports it sanely (a real boolean, no
    // crash) rather than silently dropping the check.
    const shellCheck = byId.get('shell-integration-sourced');
    assert.ok(shellCheck, 'doctor did not report a "shell-integration-sourced" check');
    assert.equal(typeof shellCheck.passed, 'boolean', 'shell-integration-sourced must report a real boolean, not crash or omit passed');
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installPrefix, { recursive: true, force: true });
    fs.rmSync(externalCwd, { recursive: true, force: true });
  }
});
