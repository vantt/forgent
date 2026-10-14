// Shared fixture for the fgctl init test files: the fgctl binary, process helpers, and one
// staged release tree per test file. Split across files so the runner executes them in parallel;
// every `fgctl init` runs the real runtime tail (init, doctor --fix, doctor), which is the cost.
import { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { releaseBinaryPath } from '../../src/util/release-binary-path.mjs';
import { releaseTargetForHost } from '../../src/util/release-targets.mjs';
import { REPO_ROOT, buildRustDistribution } from '../../scripts/build-rust-distribution.mjs';

export const FGCTL_BIN = releaseBinaryPath(path.resolve(REPO_ROOT, 'target', 'release'), 'fgctl');

export const releaseDirName = (digest) => (process.platform === 'win32' ? digest.replace(':', '-') : digest);

// Filled by the before() hook that useReleaseFixture() registers.
export const fixture = { releaseDir: null, digest: null };

export function runFgctl(args, { cwd, stateHome, env = {} } = {}) {
  return spawnSync(FGCTL_BIN, args, {
    cwd,
    env: {
      ...process.env,
      FGOS_STATE_HOME: stateHome,
      ...env,
    },
    encoding: 'utf8',
  });
}

export function runShim(shimPath, args, opts = {}) {
  if (process.platform === 'win32') {
    const clean = shimPath.replace(/^\\\\\?\\/, '').replace(/\\/g, '/');
    return spawnSync('sh', [clean, ...args], opts);
  }
  return spawnSync(shimPath, args, opts);
}

/** Stages one release tree for the calling test file and removes it afterwards. */
export function useReleaseFixture() {
  before(() => {
    assert.ok(fs.existsSync(FGCTL_BIN), `fgctl binary must exist at ${FGCTL_BIN}`);
    fixture.releaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-init-fixture-'));
    const res = buildRustDistribution({ outDir: fixture.releaseDir, repoRoot: REPO_ROOT });
    fixture.digest = res.artifactDigest;
  });

  after(() => {
    if (fixture.releaseDir && fs.existsSync(fixture.releaseDir)) {
      fs.rmSync(fixture.releaseDir, { recursive: true, force: true });
    }
  });
}

export function waitForProcess(proc) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

// The target this host downloads; a host with no published release (a developer's macOS machine)
// still exercises the download path against the Linux-named fixture through FGCTL_TARGET.
export const RELEASE_TARGET = releaseTargetForHost()?.triple ?? 'x86_64-unknown-linux-gnu';

export function makeDownloadProject(tag) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `fgctl-${tag}-`));
  const proj = path.join(root, 'proj');
  fs.mkdirSync(proj);
  execFileSync('git', ['init'], { cwd: proj });
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: proj });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: proj });
  const home = path.join(root, 'home');
  const state = path.join(root, 'state');
  fs.mkdirSync(home);
  fs.mkdirSync(state);
  return { root, proj, home, state };
}

// Writes fgos-<tag>-<target>.tar.gz of the fixture release plus SHA256SUMS.
export function makeReleaseAssets(dir, tag, { sums = 'correct' } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const asset = `fgos-${tag}-${RELEASE_TARGET}.tar.gz`;
  const tarball = path.join(dir, asset);
  // Relative archive name from inside `dir`: a GNU tar (Git for Windows) reads `C:` as a remote host.
  execFileSync('tar', ['-czf', asset, '-C', fixture.releaseDir, '.'], { cwd: dir });
  const hash = (data) => crypto.createHash('sha256').update(data).digest('hex');
  let line;
  if (sums === 'correct') line = `${hash(fs.readFileSync(tarball))}  ${asset}\n`;
  else if (sums === 'wrong') line = `${hash('not the tarball')}  ${asset}\n`;
  else line = `${hash('x')}  unrelated-${asset}\n`;
  fs.writeFileSync(path.join(dir, 'SHA256SUMS'), line);
  return asset;
}

export function readActivation(proj) {
  return JSON.parse(fs.readFileSync(path.join(proj, '.fgos', 'installation', 'activation.json'), 'utf8'));
}

export function writePinFor(proj, releaseVersion) {
  fs.mkdirSync(path.join(proj, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(proj, '.fgos', 'distribution.json'),
    JSON.stringify({
      schemaVersion: 1,
      projectRuntime: { policy: 'exact-digest', artifactDigest: fixture.digest, releaseVersion, channel: null, allowPrerelease: false },
    }),
  );
}
