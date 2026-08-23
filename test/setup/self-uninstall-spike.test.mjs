// test/setup/self-uninstall-spike.test.mjs — tsk-4iv-2 SPIKE: can a running
// process reliably remove its own npm-installed package (Linux/macOS)? File
// biến mất sạch, lệnh hết resolve trên PATH, không lỗi file-lock giữa
// chừng. Scope is narrowly npm + Linux/macOS (docs/history/fgos-uninstall/
// CONTEXT.md D1, plan.md's spike reshape) — pnpm/yarn and Windows are
// explicitly out of scope here.
//
// Mirrors test/setup/doctor-fresh-run.test.mjs's real-process pattern: pack
// the real tarball, npm install -g it into a scratch --prefix, then run the
// INSTALLED binary against itself — never a mock, never the dev checkout's
// own in-place files.
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

test('SPIKE: fgos uninstall --yes --remove-package removes a real npm -g installed package on this platform', { skip: isWin && 'spike is scoped to Linux/macOS only (D1) — Windows self-deletion is a separate, still-unresolved risk' }, () => {
  const packDir = mkTemp('fgos-uninstall-spike-pack-');
  const installPrefix = mkTemp('fgos-uninstall-spike-install-');
  const home = mkTemp('fgos-uninstall-spike-home-');

  try {
    // (1) npm pack the real tarball, same as doctor-fresh-run.test.mjs.
    const packOut = execFileSync(
      'npm',
      ['pack', '--json', '--pack-destination', packDir],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    const tarballName = JSON.parse(packOut)[0].filename;
    const tarballPath = path.join(packDir, tarballName);

    // (2) npm install -g the tarball into a scratch --prefix — a real,
    // isolated global install, never the real system one.
    const install = spawnSync(
      'npm',
      ['install', '-g', tarballPath, '--prefix', installPrefix],
      { cwd: packDir, encoding: 'utf8' },
    );
    assert.equal(install.status, 0, `npm install -g failed: ${install.stderr}`);

    const fgosBin = path.join(installPrefix, 'bin', 'fgos');
    assert.ok(fs.existsSync(fgosBin), `installed fgos binary not found at ${fgosBin}`);
    const installedPackageDir = path.join(installPrefix, 'lib', 'node_modules', 'forgent');
    assert.ok(fs.existsSync(installedPackageDir), `installed package dir not found at ${installedPackageDir}`);

    // (3) The spike itself: run the INSTALLED binary's own uninstall verb
    // against itself, with npm's global prefix redirected to the same
    // scratch install (npm_config_prefix — the standard npm env-var lever,
    // no new fgos flag needed) so `npm uninstall -g forgent` inside the
    // verb targets this scratch install, never the real system one.
    const run = (args) => spawnSync(fgosBin, args, {
      cwd: home,
      encoding: 'utf8',
      env: { ...process.env, HOME: home, npm_config_prefix: installPrefix },
    });

    const result = run(['uninstall', '--yes', '--remove-package']);
    assert.equal(result.status, 0, `fgos uninstall --yes --remove-package failed: ${result.stderr}`);
    const data = JSON.parse(result.stdout).data;

    // Real evidence, not an assertion of success either way — this is what
    // the spike exists to measure.
    assert.equal(data.packageRemoval.attempted, true);
    console.log(`SPIKE RESULT: packageRemoval.outcome = ${data.packageRemoval.outcome}`);
    if (data.packageRemoval.outcome === 'failed') {
      console.log(`SPIKE RESULT: error = ${data.packageRemoval.error}`);
    }
    assert.equal(
      data.packageRemoval.outcome,
      'removed',
      `self-removal via "npm uninstall -g forgent" did not complete cleanly: ${data.packageRemoval.error ?? '(see packageRemoval.output above)'}`,
    );

    // The real proof: files gone, command no longer resolves.
    assert.equal(fs.existsSync(installedPackageDir), false, 'installed package dir must be gone after self-removal');
    assert.equal(fs.existsSync(fgosBin), false, 'fgos binary/shim must be gone after self-removal');
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installPrefix, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('tsk-652: fgos uninstall --yes --remove-package reports "skipped", never a false "removed", when this copy is not visible under npm\'s own global node_modules', () => {
  // Simulates the pnpm/yarn (or "no install at all") case this item was
  // filed against: npm_config_prefix points `npm root -g` at a real but
  // EMPTY prefix -- no "forgent" package dir exists there, the same shape
  // a pnpm-installed copy would present to npm. Runs the dev checkout's
  // own bin/fgos.mjs directly (real process, no mock) -- no pack/install
  // step needed since this test is about the pre-flight detection, not
  // about actually removing anything.
  const emptyPrefix = mkTemp('fgos-uninstall-not-npm-prefix-');
  const home = mkTemp('fgos-uninstall-not-npm-home-');
  try {
    const result = spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin', 'fgos.mjs'), 'uninstall', '--yes', '--remove-package'], {
      cwd: home,
      encoding: 'utf8',
      env: { ...process.env, HOME: home, npm_config_prefix: emptyPrefix },
    });
    assert.equal(result.status, 0, `fgos uninstall --yes --remove-package failed: ${result.stderr}`);
    const data = JSON.parse(result.stdout).data;
    assert.equal(data.packageRemoval.attempted, false, 'must never claim it attempted removal when npm never had this package');
    assert.equal(data.packageRemoval.outcome, 'skipped', 'must report "skipped", never a false "removed" or a misleading "failed"');
    assert.match(data.packageRemoval.reason, /npm's own global node_modules/);
    assert.match(data.packageRemoval.reason, /pnpm\/yarn/);
  } finally {
    fs.rmSync(emptyPrefix, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
});
