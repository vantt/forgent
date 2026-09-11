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

test('R1: CLI recognizes valid subcommands; refuses unrecognized subcommands', () => {
  const disallowed = ['help', '--help', 'bogus', 'foo'];
  for (const sub of disallowed) {
    const res = runFgctl([sub]);
    assert.notEqual(res.status, 0, `fgctl ${sub} must exit non-zero`);
    assert.match(res.stderr, /Usage: fgctl <stage\|status\|init\|upgrade\|repair\|verify>/, `Must name subcommands in usage`);
  }

  // No args
  const resNoArgs = runFgctl([]);
  assert.notEqual(resNoArgs.status, 0, 'fgctl with no args must exit non-zero');
  assert.match(resNoArgs.stderr, /Usage: fgctl <stage\|status\|init\|upgrade\|repair\|verify>/);
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

test('R6 & R9: Concurrent stage invocations observe lock refusal (exactly one winner)', async () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-concurrent-'));
  try {
    // Fire several truly concurrent stage processes (no delay hook -- the
    // production binary carries none) and assert the create-exclusive lock
    // lets exactly one through.
    const procCount = 8;
    const procs = Array.from({ length: procCount }, () =>
      spawn(FGCTL_BIN, ['stage', '--from', fixtureReleaseDir], {
        env: { ...process.env, FGOS_STATE_HOME: stateHome },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );

    const results = await Promise.all(procs.map(waitForProcess));
    const succeeded = results.filter((r) => r.code === 0);
    const failed = results.filter((r) => r.code !== 0);

    assert.equal(succeeded.length, 1, 'Exactly one concurrent stage must succeed');
    assert.equal(failed.length, procCount - 1, 'Every other concurrent stage must fail');
    for (const r of failed) {
      assert.match(r.stderr, /stage already in progress/i, 'Failed invocation must report lock refusal');
    }
    assert.match(succeeded[0].stdout, /staged release/, 'Winning invocation must report staged release');

    // releases/ has exactly one release; install.lock is gone afterward
    const statusRes = runFgctl(['status', '--json'], { stateHome });
    const releases = JSON.parse(statusRes.stdout.trim());
    assert.equal(releases.length, 1);
    assert.ok(!fs.existsSync(path.join(stateHome, 'install.lock')), 'install.lock must be released');
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

test('R7: A .tar.gz with a path-traversing member alongside a valid release is refused, nothing published, no leftover temp dir', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-traversal-'));
  const tarTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-traversal-archive-'));
  const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-traversal-payload-'));
  const archivePath = path.join(tarTemp, 'release.tar.gz');

  try {
    cpSyncRecursive(fixtureReleaseDir, payloadDir);
    fs.writeFileSync(path.join(payloadDir, '__extra_sentinel__.txt'), 'evil');

    execFileSync('tar', [
      '-czf',
      archivePath,
      '--transform',
      's,^\\./__extra_sentinel__\\.txt$,../../archive-traversal-sentinel,',
      '-C',
      payloadDir,
      '.',
    ]);
    assert.ok(fs.existsSync(archivePath));

    const res = runFgctl(['stage', '--from', archivePath], { stateHome });
    assert.notEqual(res.status, 0, 'Staging a traversal archive must fail');
    assert.match(res.stderr, /archive entry refused|unsafe path in archive entry/i);

    const releasesDir = path.join(stateHome, 'releases');
    if (fs.existsSync(releasesDir)) {
      assert.equal(fs.readdirSync(releasesDir).length, 0, 'Nothing must be published under releases/');
    }

    const sentinelOutsideDest = path.join(os.tmpdir(), 'archive-traversal-sentinel');
    assert.ok(!fs.existsSync(sentinelOutsideDest), 'Sentinel must not escape onto disk anywhere');

    const leftovers = fs
      .readdirSync(stateHome)
      .filter((name) => name.startsWith('.stage_tmp_') || name.startsWith('.stage_mv_'));
    assert.equal(leftovers.length, 0, 'No temp staging directory must survive a refused archive');
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(tarTemp, { recursive: true, force: true });
    fs.rmSync(payloadDir, { recursive: true, force: true });
    fs.rmSync(path.join(os.tmpdir(), 'archive-traversal-sentinel'), { force: true });
  }
});

test('R7: A .tar.gz with a symlink member alongside a valid release is refused, nothing published', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-symlink-'));
  const tarTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-symlink-archive-'));
  const payloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-targz-symlink-payload-'));
  const archivePath = path.join(tarTemp, 'release.tar.gz');

  try {
    cpSyncRecursive(fixtureReleaseDir, payloadDir);
    fs.symlinkSync('/etc/hostname', path.join(payloadDir, '__evil_link__'));

    execFileSync('tar', ['-czf', archivePath, '-C', payloadDir, '.']);
    assert.ok(fs.existsSync(archivePath));

    const res = runFgctl(['stage', '--from', archivePath], { stateHome });
    assert.notEqual(res.status, 0, 'Staging an archive with a symlink member must fail');
    assert.match(res.stderr, /archive entry refused|disallowed archive entry type/i);

    const releasesDir = path.join(stateHome, 'releases');
    if (fs.existsSync(releasesDir)) {
      assert.equal(fs.readdirSync(releasesDir).length, 0, 'Nothing must be published under releases/');
    }
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(tarTemp, { recursive: true, force: true });
    fs.rmSync(payloadDir, { recursive: true, force: true });
  }
});

test("L1: ./bin/fgos and bin/fgos are treated as a collision, not two different digests", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-dot-segment-'));
  const candidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-dot-segment-candidate-'));

  try {
    cpSyncRecursive(fixtureReleaseDir, candidateDir);
    const manifestPath = path.join(candidateDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const fgosEntry = manifest.files.find((f) => f.path === 'bin/fgos');
    assert.ok(fgosEntry, 'fixture manifest must declare bin/fgos');
    fgosEntry.path = './bin/fgos';

    const manifestCopy = { ...manifest };
    delete manifestCopy.artifactDigest;
    manifest.artifactDigest = computeArtifactDigest(manifestCopy);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const res = runFgctl(['stage', '--from', candidateDir], { stateHome });
    assert.notEqual(res.status, 0, 'A manifest with a ./bin/fgos dot-segment path must be refused');
    assert.match(res.stderr, /malformed path segment|quarantined/i);

    const releasesDir = path.join(stateHome, 'releases');
    if (fs.existsSync(releasesDir)) {
      assert.equal(fs.readdirSync(releasesDir).length, 0, 'Nothing must be published under releases/');
    }
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(candidateDir, { recursive: true, force: true });
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
