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
import { REPO_ROOT, buildRustDistribution, releaseOutputDir } from '../../scripts/build-rust-distribution.mjs';

export const FGCTL_BIN = releaseBinaryPath(releaseOutputDir(), 'fgctl');

export const releaseDirName = (digest) => (process.platform === 'win32' ? digest.replace(':', '-') : digest);

// Filled by the before() hook that useReleaseFixture() registers.
export const fixture = { releaseDir: null, digest: null };

/**
 * `env` without the variable pair that names the outer run's active release. A staged release
 * runs its own payload; handed that pair, its host would run the checkout's payload instead.
 */
export function withoutActiveRelease(env) {
  const { FGOS_ACTIVE_RELEASE_PATH, FGOS_ACTIVE_MANIFEST_PATH, ...rest } = env;
  return rest;
}

export function runFgctl(args, { cwd, stateHome, env = {} } = {}) {
  return spawnSync(FGCTL_BIN, args, {
    cwd,
    env: {
      ...withoutActiveRelease(process.env),
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

// A PATH whose first `git` drops the `-c gc.auto=0` and `-c maintenance.auto=false` switches a
// borrowed git runs with, then runs the real git: a git that can start a background gc while it
// borrows a lock. An environment fixture for the activation gate's escaped-holder case, not a code
// branch: the gc that escapes the borrow still holds the description and the drain must end it.
export function pathWithGcLeakingGit(dir) {
  const real = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
  const bin = path.join(dir, 'gc-leaking-git');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(
    path.join(bin, 'git'),
    [
      '#!/bin/sh',
      'n=$#',
      'while [ $n -gt 0 ]; do',
      '  a=$1; shift; n=$((n-1))',
      '  if [ "$a" = -c ] && { [ "$1" = gc.auto=0 ] || [ "$1" = maintenance.auto=false ]; }; then shift; n=$((n-1)); continue; fi',
      '  set -- "$@" "$a"',
      'done',
      `exec '${real}' "$@"`,
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  return `${bin}${path.delimiter}${process.env.PATH}`;
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
  fs.mkdirSync(state, { mode: 0o700 });
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

/**
 * Live processes whose working directory or any open file lies under one of `prefixes`, read from
 * `/proc` (Linux). On a platform without `/proc` this returns null: the caller cannot prove the
 * absence there and says so instead of passing on an empty list.
 */
export function processesUnder(prefixes) {
  if (!fs.existsSync('/proc/self/fd')) return null;
  const found = [];
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry) || Number(entry) === process.pid) continue;
    const links = [];
    try { links.push(fs.readlinkSync(`/proc/${entry}/cwd`)); } catch { /* gone or not ours */ }
    try {
      for (const fd of fs.readdirSync(`/proc/${entry}/fd`)) {
        try { links.push(fs.readlinkSync(`/proc/${entry}/fd/${fd}`)); } catch { /* closed meanwhile */ }
      }
    } catch { /* gone or not ours */ }
    const hit = links.find((link) => prefixes.some((prefix) => link.startsWith(prefix)));
    if (hit) {
      let cmdline = '';
      try { cmdline = fs.readFileSync(`/proc/${entry}/cmdline`, 'utf8').replace(/\0/g, ' ').trim(); } catch { /* gone */ }
      found.push({ pid: Number(entry), path: hit, cmdline });
    }
  }
  return found;
}
