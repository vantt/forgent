import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  REPO_ROOT,
  buildRustDistribution,
  canonicalJson,
  computeArtifactDigest,
  hashFile,
} from '../../scripts/build-rust-distribution.mjs';

import {
  generateCoverageFloorCases,
  runParitySuite,
  ROUTES_PATH,
} from './harness.mjs';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('R1 & R2: Release tree builder stages release tree and produces canonical manifest with reproducible artifactDigest', () => {
  const tempOut = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-test-'));

  try {
    // 1. Refuse build if --out is inside checkout
    const insideOut = path.join(REPO_ROOT, 'disposable-release-tree');
    assert.throws(
      () => buildRustDistribution({ outDir: insideOut, repoRoot: REPO_ROOT }),
      /Refusing to stage release tree inside checkout directory/,
      'Must refuse to stage release tree inside the checkout directory'
    );

    // 2. Stage tree into disposable directory
    const result = buildRustDistribution({ outDir: tempOut, repoRoot: REPO_ROOT });
    assert.ok(result.artifactDigest.startsWith('sha256:'));
    assert.ok(result.fileCount > 500);

    // 3. Verify bin/fgos exists and is executable
    const fgosBin = path.join(tempOut, 'bin', 'fgos');
    assert.ok(fs.existsSync(fgosBin), 'bin/fgos must exist');
    const fgosStat = fs.statSync(fgosBin);
    assert.ok(Boolean(fgosStat.mode & 0o111), 'bin/fgos must be executable');

    // 4. Verify bin/fgos-runner exists, is executable, and is a relative POSIX sh shim
    const runnerBin = path.join(tempOut, 'bin', 'fgos-runner');
    assert.ok(fs.existsSync(runnerBin), 'bin/fgos-runner must exist');
    const runnerStat = fs.statSync(runnerBin);
    assert.ok(Boolean(runnerStat.mode & 0o111), 'bin/fgos-runner must be executable');
    const runnerContent = fs.readFileSync(runnerBin, 'utf8');
    assert.ok(runnerContent.startsWith('#!/bin/sh'), 'bin/fgos-runner must start with #!/bin/sh');
    assert.ok(
      runnerContent.includes('libexec/legacy-node/bin/fgos-runner.mjs'),
      'bin/fgos-runner must exec libexec/legacy-node/bin/fgos-runner.mjs relative to its location'
    );
    assert.ok(!runnerContent.includes(REPO_ROOT), 'bin/fgos-runner must never contain hardcoded checkout path');

    // 5. Verify libexec/legacy-node/ staged files
    const legacyNodeDir = path.join(tempOut, 'libexec', 'legacy-node');
    assert.ok(fs.existsSync(legacyNodeDir), 'libexec/legacy-node/ must exist');
    assert.ok(fs.existsSync(path.join(legacyNodeDir, 'bin', 'fgos.mjs')), 'bin/fgos.mjs must exist in legacy-node');
    assert.ok(fs.existsSync(path.join(legacyNodeDir, 'bin', 'fgos-runner.mjs')), 'bin/fgos-runner.mjs must exist in legacy-node');
    assert.ok(fs.existsSync(path.join(legacyNodeDir, 'package.json')), 'package.json must exist in legacy-node');
    assert.ok(fs.existsSync(path.join(legacyNodeDir, 'src', 'setup', 'registrations.mjs')), 'src/ must be staged intact in legacy-node');

    // 6. Verify manifest.json and its required §5 fields
    const manifestPath = path.join(tempOut, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.artifactDigest, result.artifactDigest);
    assert.equal(manifest.entries.fgos, 'bin/fgos');
    assert.equal(manifest.entries.fgosRunner, 'bin/fgos-runner');
    assert.equal(manifest.components.legacyNode.root, 'libexec/legacy-node');
    assert.equal(manifest.components.legacyNode.entry, 'bin/fgos.mjs');
    assert.ok(manifest.components.legacyNode.digest.startsWith('sha256:'));
    assert.equal(
      manifest.components.legacyNode.digest,
      hashFile(path.join(legacyNodeDir, 'bin', 'fgos.mjs'))
    );
    assert.equal(typeof manifest.requires.node, 'string');
    assert.deepEqual(manifest.target, { os: 'linux', arch: 'x64', libc: 'glibc' });

    // 7. Verify files[] canonicalization
    assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
    const paths = manifest.files.map((f) => f.path);
    const sortedPaths = [...paths].sort();
    assert.deepEqual(paths, sortedPaths, 'files[] paths must be lexicographically sorted');

    for (const file of manifest.files) {
      assert.ok(!file.path.startsWith('/'), `Path must not be absolute: ${file.path}`);
      assert.ok(!file.path.includes('\\'), `Path must use / separator: ${file.path}`);
      assert.equal(file.path, file.path.normalize('NFC'), `Path must be NFC-normalized: ${file.path}`);
      assert.equal(file.kind, 'file');
      assert.ok(file.digest.startsWith('sha256:'), `Digest must be sha256: ${file.digest}`);
      assert.ok(file.mode === '755' || file.mode === '644', `Mode must be 755 or 644: ${file.mode}`);
      assert.ok(
        ['immutable-entry', 'immutable-runtime', 'immutable-workshop-source', 'immutable-doc', 'metadata'].includes(file.class),
        `Valid class required: ${file.class}`
      );

      // Verify declared digest matches actual on-disk file bytes
      const diskPath = path.join(tempOut, file.path);
      assert.ok(fs.existsSync(diskPath), `Declared file must exist on disk: ${file.path}`);
      assert.equal(hashFile(diskPath), file.digest, `Digest mismatch for file: ${file.path}`);
    }

    // 8. Independently recompute artifactDigest and assert it matches manifest.artifactDigest
    const { artifactDigest: declaredDigest, ...withoutDigest } = manifest;
    const recomputedDigest = 'sha256:' + crypto.createHash('sha256').update(canonicalJson(withoutDigest)).digest('hex');
    assert.equal(
      recomputedDigest,
      declaredDigest,
      'Independently recomputed artifactDigest must match declared artifactDigest'
    );
  } finally {
    fs.rmSync(tempOut, { recursive: true, force: true });
  }
});

test('R3: Staged release tree runs P02 harness from outside checkout with cleaned PATH/NODE_PATH', async () => {
  const stagedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-stage-'));
  const outsideWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-outside-workdir-'));

  try {
    buildRustDistribution({ outDir: stagedDir, repoRoot: REPO_ROOT });
    const stagedBinary = path.join(stagedDir, 'bin', 'fgos');
    assert.ok(fs.existsSync(stagedBinary));

    // Clean PATH and NODE_PATH to remove all paths inside REPO_ROOT
    const cleanPath = (process.env.PATH || '')
      .split(path.delimiter)
      .filter((p) => p && !p.startsWith(REPO_ROOT))
      .join(path.delimiter);

    const cleanNodePath = (process.env.NODE_PATH || '')
      .split(path.delimiter)
      .filter((p) => p && !p.startsWith(REPO_ROOT))
      .join(path.delimiter);

    const origPath = process.env.PATH;
    const origNodePath = process.env.NODE_PATH;
    const origHarness = process.env.FGOS_HARNESS_ENTRY;

    try {
      process.env.PATH = cleanPath;
      if (cleanNodePath) {
        process.env.NODE_PATH = cleanNodePath;
      } else {
        delete process.env.NODE_PATH;
      }
      process.env.FGOS_HARNESS_ENTRY = `bin:${stagedBinary}`;

      // Generate the coverage-floor cases. For native `version`, output contains a dynamic
      // ISO timestamp, so mode "semantic-json" validates the envelope without timestamp divergence.
      const rawCases = generateCoverageFloorCases({ repoRoot: REPO_ROOT, routesPath: ROUTES_PATH });
      const cases = rawCases.map((c) => {
        if (c.id === 'coverage-help-version') {
          return { ...c, modes: ['semantic-json'] };
        }
        return c;
      });

      const reportPath = path.join(os.tmpdir(), `harness-report-staged-${Date.now()}.json`);
      const suiteResult = await runParitySuite(cases, {
        entryA: `bin:${stagedBinary}`,
        entryB: `bin:${stagedBinary}`,
        repoRoot: outsideWorkDir,
        reportPath,
        concurrency: 8,
      });

      assert.equal(
        suiteResult.failedCount,
        0,
        `Staged binary harness run had ${suiteResult.failedCount} failures: ${JSON.stringify(suiteResult.failedResults)}`
      );
      assert.equal(suiteResult.passed, true, 'Harness suite must pass');
      assert.ok(suiteResult.total >= 80, `Expected at least 80 coverage-floor cases, ran ${suiteResult.total}`);

      if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
      }
    } finally {
      process.env.PATH = origPath;
      if (origNodePath !== undefined) {
        process.env.NODE_PATH = origNodePath;
      } else {
        delete process.env.NODE_PATH;
      }
      if (origHarness !== undefined) {
        process.env.FGOS_HARNESS_ENTRY = origHarness;
      } else {
        delete process.env.FGOS_HARNESS_ENTRY;
      }
    }
  } finally {
    fs.rmSync(stagedDir, { recursive: true, force: true });
    fs.rmSync(outsideWorkDir, { recursive: true, force: true });
  }
});

test('R4: Doctor checks rust-host-binary-present, rust-host-target-supported, legacy-node-payload-present, command-routes-drift are registered and pass', () => {
  const checkIds = [
    'rust-host-binary-present',
    'rust-host-target-supported',
    'legacy-node-payload-present',
    'command-routes-drift',
  ];

  for (const id of checkIds) {
    const entry = DOCTOR_CHECKS.find((c) => c.id === id);
    assert.ok(entry, `Doctor check "${id}" must be registered in DOCTOR_CHECKS`);
    const result = entry.check(REPO_ROOT);
    assert.equal(
      result.passed,
      true,
      `Doctor check "${id}" expected to pass on clean repo, got: ${result.message}`
    );
  }
});
