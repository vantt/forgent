import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  REPO_ROOT,
  buildRustDistribution,
  canonicalJson,
  computeArtifactDigest,
} from '../../scripts/build-rust-distribution.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FGCTL_BIN = path.resolve(REPO_ROOT, 'target', 'release', 'fgctl');

let fixtureReleaseDir = null;
let fixtureDigest = null;

function runFgctl(args, { stateHome, env = {} } = {}) {
  return spawnSync(FGCTL_BIN, args, {
    env: {
      ...process.env,
      FGOS_STATE_HOME: stateHome,
      ...env,
    },
    encoding: 'utf8',
  });
}

before(() => {
  assert.ok(fs.existsSync(FGCTL_BIN), `fgctl binary must exist at ${FGCTL_BIN}`);
  fixtureReleaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-test-fixture-'));
  const res = buildRustDistribution({ outDir: fixtureReleaseDir, repoRoot: REPO_ROOT });
  fixtureDigest = res.artifactDigest;
});

after(() => {
  if (fixtureReleaseDir && fs.existsSync(fixtureReleaseDir)) {
    fs.rmSync(fixtureReleaseDir, { recursive: true, force: true });
  }
});

test('R1: CLI recognizes exactly stage and status; refuses other subcommands naming only those two', () => {
  const disallowed = ['init', 'upgrade', 'repair', 'help', '--help', 'bogus'];
  for (const sub of disallowed) {
    const res = runFgctl([sub]);
    assert.notEqual(res.status, 0, `fgctl ${sub} must exit non-zero`);
    assert.match(res.stderr, /Usage: fgctl <stage\|status>/, `Must name only stage and status in usage`);
    assert.doesNotMatch(res.stderr, /\binit\b.*\bupgrade\b/, `Must not declare placeholder subcommands`);
  }

  // No args
  const resNoArgs = runFgctl([]);
  assert.notEqual(resNoArgs.status, 0, 'fgctl with no args must exit non-zero');
  assert.match(resNoArgs.stderr, /Usage: fgctl <stage\|status>/);
});

test('R8: status --json on empty store reports empty array, not an error', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-empty-store-'));
  try {
    const res = runFgctl(['status', '--json'], { stateHome });
    assert.equal(res.status, 0, 'status --json must exit 0 on empty store');
    const parsed = JSON.parse(res.stdout.trim());
    assert.deepEqual(parsed, []);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R6 & R9: Staging a valid release tree verifies digests and creates releases/<digest>', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-stage-valid-'));
  try {
    const res = runFgctl(['stage', '--from', fixtureReleaseDir], { stateHome });
    assert.equal(res.status, 0, `stage must succeed: ${res.stderr}`);
    assert.match(res.stdout, new RegExp(`staged release ${fixtureDigest}`));

    // Assert releases/<digest>/manifest.json exists
    const stagedManifestPath = path.join(stateHome, 'releases', fixtureDigest, 'manifest.json');
    assert.ok(fs.existsSync(stagedManifestPath), `Staged manifest must exist at ${stagedManifestPath}`);

    // Verify artifactDigest recomputes identically
    const rawManifest = JSON.parse(fs.readFileSync(stagedManifestPath, 'utf8'));
    const manifestCopy = { ...rawManifest };
    delete manifestCopy.artifactDigest;
    const recomputed = computeArtifactDigest(manifestCopy);
    assert.equal(rawManifest.artifactDigest, recomputed, 'Staged manifest digest must match recomputed value');
    assert.equal(recomputed, fixtureDigest);

    // Verify status --json lists this release
    const statusRes = runFgctl(['status', '--json'], { stateHome });
    assert.equal(statusRes.status, 0);
    const releases = JSON.parse(statusRes.stdout.trim());
    assert.equal(releases.length, 1);
    assert.equal(releases[0].artifactDigest, fixtureDigest);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R6 & R9: Corrupting one byte before staging triggers quarantine and puts nothing in releases/', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-stage-corrupt-'));
  const corruptCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-corrupt-candidate-'));

  try {
    // Copy fixture to candidate dir
    cpSyncRecursive(fixtureReleaseDir, corruptCandidateDir);

    // Corrupt one byte in a file listed in manifest
    const targetFile = path.join(corruptCandidateDir, 'bin', 'fgos-runner');
    assert.ok(fs.existsSync(targetFile), 'Target file to corrupt must exist');
    const originalContent = fs.readFileSync(targetFile);
    const corruptedContent = Buffer.from(originalContent);
    corruptedContent[0] ^= 0xff; // Flip first byte
    fs.writeFileSync(targetFile, corruptedContent);

    // Run stage
    const res = runFgctl(['stage', '--from', corruptCandidateDir], { stateHome });
    assert.notEqual(res.status, 0, 'Staging corrupted tree must fail');
    assert.match(res.stderr, /quarantined/i, 'Stderr must report quarantine');

    // Assert nothing under releases/
    const releasesDir = path.join(stateHome, 'releases');
    if (fs.existsSync(releasesDir)) {
      const entries = fs.readdirSync(releasesDir);
      assert.equal(entries.length, 0, 'Nothing must appear under releases/ for a failed stage');
    }

    // Assert quarantine directory exists and contains the corrupted release
    const quarantineDir = path.join(stateHome, 'quarantine');
    assert.ok(fs.existsSync(quarantineDir), 'quarantine/ directory must exist');
    const quarantineEntries = fs.readdirSync(quarantineDir);
    assert.ok(quarantineEntries.length >= 1, 'quarantine/ must contain at least one quarantine record');
    const matching = quarantineEntries.filter((name) => name.startsWith(fixtureDigest));
    assert.ok(matching.length >= 1, `quarantine record must start with ${fixtureDigest}`);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(corruptCandidateDir, { recursive: true, force: true });
  }
});

test('R6 & R9: Concurrent stage invocations back-to-back observe lock refusal (exactly one winner)', async () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-concurrent-'));
  try {
    // We launch proc1 with a delay hook so it holds the lock for 300ms
    const proc1 = spawn(FGCTL_BIN, ['stage', '--from', fixtureReleaseDir], {
      env: {
        ...process.env,
        FGOS_STATE_HOME: stateHome,
        __FGCTL_STAGE_LOCK_DELAY_MS: '300',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait 50ms to ensure proc1 has acquired the lock
    await new Promise((r) => setTimeout(r, 50));

    // Launch proc2 which should immediately see "stage already in progress"
    const proc2 = spawn(FGCTL_BIN, ['stage', '--from', fixtureReleaseDir], {
      env: {
        ...process.env,
        FGOS_STATE_HOME: stateHome,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const [res1, res2] = await Promise.all([waitForProcess(proc1), waitForProcess(proc2)]);

    const exitCodes = [res1.code, res2.code].sort();
    assert.deepEqual(exitCodes, [0, 1], 'Exactly one stage must succeed (exit 0) and one must fail (exit 1)');

    const failed = res1.code === 1 ? res1 : res2;
    const succeeded = res1.code === 0 ? res1 : res2;

    assert.match(failed.stderr, /stage already in progress/i, 'Failed invocation must report lock refusal');
    assert.match(succeeded.stdout, /staged release/, 'Winning invocation must report staged release');

    // releases/ has exactly one release
    const statusRes = runFgctl(['status', '--json'], { stateHome });
    const releases = JSON.parse(statusRes.stdout.trim());
    assert.equal(releases.length, 1);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R6 & R9: Re-staging an already-staged digest is a no-op (manifest mtime unchanged)', async () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-noop-'));
  try {
    // 1. Initial stage
    const res1 = runFgctl(['stage', '--from', fixtureReleaseDir], { stateHome });
    assert.equal(res1.status, 0);

    const manifestPath = path.join(stateHome, 'releases', fixtureDigest, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath));
    const mtime1 = fs.statSync(manifestPath).mtimeMs;

    // Sleep 100ms so that if the file were rewritten, mtime would differ
    await new Promise((r) => setTimeout(r, 100));

    // 2. Re-stage identical release
    const res2 = runFgctl(['stage', '--from', fixtureReleaseDir], { stateHome });
    assert.equal(res2.status, 0);
    assert.match(res2.stdout, /already staged/, 'Must report already staged');

    const mtime2 = fs.statSync(manifestPath).mtimeMs;
    assert.equal(mtime2, mtime1, 'manifest.json mtime must remain unchanged on no-op');
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R7: Staging from a .tar.gz archive extracts with pure Rust and stages successfully', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-stage-'));
  const tarTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-archive-'));
  const archivePath = path.join(tarTemp, 'release.tar.gz');

  try {
    // Create archive from fixtureReleaseDir
    execFileSync('tar', ['-czf', archivePath, '-C', fixtureReleaseDir, '.']);
    assert.ok(fs.existsSync(archivePath));

    const res = runFgctl(['stage', '--from', archivePath], { stateHome });
    assert.equal(res.status, 0, `Tar staging failed: ${res.stderr}`);
    assert.match(res.stdout, new RegExp(`staged release ${fixtureDigest}`));

    const manifestPath = path.join(stateHome, 'releases', fixtureDigest, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'Staged manifest from tar.gz must exist');
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(tarTemp, { recursive: true, force: true });
  }
});

function cpSyncRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, ent.name);
    const dstPath = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      cpSyncRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
      const stat = fs.statSync(srcPath);
      fs.chmodSync(dstPath, stat.mode);
    }
  }
}

function waitForProcess(proc) {
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
