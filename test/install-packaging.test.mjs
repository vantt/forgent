// test/install-packaging.test.mjs — distribution-packaging (P29) e2e proof.
//
// Proves the packaging surface built in distribution-packaging-1 (package.json
// `version`/`files`) actually works end to end via real spawned processes: no
// fixtures or mocks of npm or the install mechanism, per critical-patterns.md
// "Claim hành-vi cần enforcement THẬT". Mirrors the real-process assertion shape
// already used by test/e2e/coexistence-canary.test.mjs
// (spawnSync(process.execPath, [FGOS, 'init'], { cwd: fx, encoding: 'utf8' })).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// REPO_ROOT/.fgos is this workshop's own tracked dogfood data (confirmed in
// plan.md's discovery notes) — it legitimately exists already, so the
// "source repo untouched" proof must be a byte-snapshot diff, not an
// existence check. Mirrors coexistence-canary.test.mjs's snapshotTree idiom.
function snapshotDir(root) {
  const out = new Map();
  if (!fs.existsSync(root)) return out;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      out.set(path.relative(root, full), fs.readFileSync(full));
    }
  }
  walk(root);
  return out;
}

function diffSnapshots(before, after) {
  const changed = [];
  for (const [rel, content] of after) {
    if (!before.has(rel)) changed.push(`added:${rel}`);
    else if (!before.get(rel).equals(content)) changed.push(`modified:${rel}`);
  }
  for (const rel of before.keys()) {
    if (!after.has(rel)) changed.push(`removed:${rel}`);
  }
  return changed;
}

test('e2e: npm pack -> npm install -g -> fgos init from a fresh external cwd', () => {
  // Three separate scratch dirs, per the cell's proof design: pack output,
  // install --prefix, and a fresh external cwd distinct from the repo, the
  // pack scratch dir, and the install prefix.
  const packDir = mkTemp('fgos-pack-');
  const installPrefix = mkTemp('fgos-install-');
  const externalCwd = mkTemp('fgos-external-');
  const repoFgosBefore = snapshotDir(path.join(REPO_ROOT, '.fgos'));

  try {
    // (1) npm pack into the scratch dir — never a bare `npm pack` in repo/,
    // which would drop an untracked .tgz into the tracked repo root.
    const packOut = execFileSync(
      'npm',
      ['pack', '--json', '--pack-destination', packDir],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    const packInfo = JSON.parse(packOut);
    const tarballName = packInfo[0].filename; // never hardcode forgent-0.1.0.tgz
    const tarballPath = path.join(packDir, tarballName);
    assert.ok(fs.existsSync(tarballPath), `tarball not found at ${tarballPath}`);

    // (2) npm install -g the discovered tarball into a scratch --prefix.
    const install = spawnSync(
      'npm',
      ['install', '-g', tarballPath, '--prefix', installPrefix],
      { cwd: packDir, encoding: 'utf8' },
    );
    assert.equal(install.status, 0, `npm install -g failed: ${install.stderr}`);

    // (3) content-scoping: the installed package tree excludes .fgos/,
    // .fgos-runner.json, and test/ (the `files` allowlist actually took effect).
    const installedPkgDir = path.join(installPrefix, 'lib', 'node_modules', 'forgent');
    assert.ok(fs.existsSync(installedPkgDir), `installed package dir not found at ${installedPkgDir}`);
    assert.equal(fs.existsSync(path.join(installedPkgDir, '.fgos')), false, '.fgos/ must not ship in the installed package');
    assert.equal(fs.existsSync(path.join(installedPkgDir, '.fgos-runner.json')), false, '.fgos-runner.json must not ship');
    assert.equal(fs.existsSync(path.join(installedPkgDir, 'test')), false, 'test/ must not ship');

    // (4) invoke the installed binary's `init` verb from a SEPARATE fresh
    // external tmp cwd (not the repo, not the install prefix, not the pack
    // scratch dir) and assert cwd-based dataDir behavior (D3, unchanged from P10).
    const fgosBin = path.join(installPrefix, 'bin', 'fgos');
    assert.ok(fs.existsSync(fgosBin), `installed fgos binary not found at ${fgosBin}`);

    const init = spawnSync(fgosBin, ['init'], { cwd: externalCwd, encoding: 'utf8' });
    assert.equal(init.status, 0, `fgos init failed: ${init.stderr}`);

    const externalFgosDir = path.join(externalCwd, '.fgos');
    assert.ok(fs.existsSync(externalFgosDir), '.fgos/ must be created in the external cwd, not the repo or install prefix');
    assert.equal(fs.existsSync(path.join(installPrefix, '.fgos')), false, '.fgos/ must not be created inside the install prefix');

    const repoFgosAfter = snapshotDir(path.join(REPO_ROOT, '.fgos'));
    const repoFgosDiff = diffSnapshots(repoFgosBefore, repoFgosAfter);
    assert.deepEqual(repoFgosDiff, [], `fgos init from the external cwd must not touch the source repo's own .fgos/: ${repoFgosDiff.join(', ')}`);
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installPrefix, { recursive: true, force: true });
    fs.rmSync(externalCwd, { recursive: true, force: true });
  }
});

test('no stray pack artifact is left under repo/ after packing', () => {
  const stray = fs.readdirSync(REPO_ROOT).filter((f) => f.endsWith('.tgz'));
  assert.deepEqual(stray, [], `repo/ must contain no .tgz pack artifact: ${stray.join(', ')}`);
});
