import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const DEPENDENCY_DIR = 'node' + '_modules';

// The pair a host sets for its own Node child; a staged release must not inherit the outer run's.
const ACTIVE_RELEASE_KEYS = ['FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH'];

test('the staged legacy-node payload carries the vendored YAML parser and any declared production dependencies, and loads them', () => {
  const tempOut = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-deps-'));
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-deps-work-'));
  try {
    buildRustDistribution({ outDir: tempOut, repoRoot: REPO_ROOT });
    const legacyNodeDir = path.join(tempOut, 'libexec', 'legacy-node');
    const declared = Object.keys(JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).dependencies ?? {});

    const manifest = JSON.parse(fs.readFileSync(path.join(tempOut, 'manifest.json'), 'utf8'));
    const listed = new Set(manifest.files.map((f) => f.path));
    for (const vendored of ['src/util/yaml.mjs', 'src/util/third-party/js-yaml.mjs']) {
      const rel = `libexec/legacy-node/${vendored}`;
      assert.ok(fs.existsSync(path.join(tempOut, rel)), `${vendored} must be staged with the legacy-node sources`);
      assert.ok(listed.has(rel), `${vendored} must be listed in manifest files[] so verify covers it`);
    }
    for (const dep of declared) {
      const rel = `libexec/legacy-node/${DEPENDENCY_DIR}/${dep}/package.json`;
      assert.ok(fs.existsSync(path.join(tempOut, rel)), `${dep} must be staged next to the legacy-node sources`);
      assert.ok(listed.has(rel), `${dep} must be listed in manifest files[] so verify covers it`);
    }

    // Modules that read YAML must load and run from the staged tree alone, with no checkout around it.
    const probe = [
      "const door = await import(process.argv[1] + '/src/util/yaml.mjs');",
      "await import(process.argv[1] + '/src/workflow/loader.mjs');",
      "await import(process.argv[1] + '/src/setup/instruction-registry.mjs');",
      "process.stdout.write(JSON.stringify(door.parseYaml('a: [1, 2]\\n')));",
    ].join('\n');
    const res = spawnSync(process.execPath, ['--input-type=module', '-e', probe, pathToFileURL(legacyNodeDir).href], {
      cwd: workDir,
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: '' },
    });
    assert.equal(res.status, 0, `${res.stdout}${res.stderr}`);
    assert.equal(res.stdout, '{"a":[1,2]}');
  } finally {
    fs.rmSync(tempOut, { recursive: true, force: true });
    fs.rmSync(workDir, { recursive: true, force: true });
  }
});

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

    // 2. Stage tree into disposable directory. The build reads the checkout through the host it
    // just compiled, never an inherited one: a clean checkout outside an activated workspace has
    // none, so an unusable FGOS_HOST_BIN must not matter.
    const inheritedHost = process.env.FGOS_HOST_BIN;
    process.env.FGOS_HOST_BIN = path.join(tempOut, 'no-such-host');
    let result;
    try {
      result = buildRustDistribution({ outDir: tempOut, repoRoot: REPO_ROOT });
    } finally {
      if (inheritedHost === undefined) delete process.env.FGOS_HOST_BIN;
      else process.env.FGOS_HOST_BIN = inheritedHost;
    }
    assert.ok(result.artifactDigest.startsWith('sha256:'));
    assert.ok(result.fileCount > 500);

    // 3. Verify bin/fgos exists and is executable
    const fgosBin = path.join(tempOut, 'bin', 'fgos');
    assert.ok(fs.existsSync(fgosBin), 'bin/fgos must exist');
    const fgosStat = fs.statSync(fgosBin);
    if (process.platform !== 'win32') {
      assert.ok(Boolean(fgosStat.mode & 0o111), 'bin/fgos must be executable');
    }

    // 4. Verify bin/fgos-runner exists, is executable, and is a relative POSIX sh shim
    const runnerBin = path.join(tempOut, 'bin', 'fgos-runner');
    assert.ok(fs.existsSync(runnerBin), 'bin/fgos-runner must exist');
    const runnerStat = fs.statSync(runnerBin);
    if (process.platform !== 'win32') {
      assert.ok(Boolean(runnerStat.mode & 0o111), 'bin/fgos-runner must be executable');
    }
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
    assert.ok(
      fs.existsSync(path.join(legacyNodeDir, 'packages', 'convention', 'contracts', 'convention.rules.v1.json')),
      'Convention rule data required by installed doctor must be staged in legacy-node',
    );
    assert.ok(
      fs.existsSync(path.join(legacyNodeDir, 'packages', 'holder-lock', 'contracts', 'lock-registry.v1.json')),
      'The lock registry every kernel lock resolves through must be staged in legacy-node',
    );

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
    assert.deepEqual(
      manifest.target,
      process.platform === 'win32'
        ? { os: 'windows', arch: 'x64' }
        : { os: 'linux', arch: 'x64', libc: 'glibc' },
    );

    // 7. Verify files[] canonicalization
    assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
    const paths = manifest.files.map((f) => f.path);
    const sortedPaths = [...paths].sort();
    assert.deepEqual(paths, sortedPaths, 'files[] paths must be lexicographically sorted');

    const conventionRulesPath = 'libexec/legacy-node/packages/convention/contracts/convention.rules.v1.json';
    assert.ok(paths.includes(conventionRulesPath), 'manifest files[] must cover installed doctor rule data');

    // Doctor's Claude plugin row would run the real `claude` CLI and reach the network.
    const doctorEnv = { ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' };
    delete doctorEnv.CLAUDE_CODE_SESSION_ID;
    delete doctorEnv.FGOS_HOST_BIN;
    // The staged release finds its own manifest; the outer run's active-release pair names another payload.
    for (const key of ACTIVE_RELEASE_KEYS) delete doctorEnv[key];
    const doctor = spawnSync(fgosBin, ['doctor', '--dir', REPO_ROOT], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: doctorEnv,
    });
    assert.equal(doctor.status, 0, `staged fgos doctor failed: ${doctor.stderr}`);
    const doctorEnvelope = JSON.parse(doctor.stdout);
    const conventionCheck = doctorEnvelope.data.checks.find((entry) => entry.id === 'convention-conformance');
    assert.ok(conventionCheck, 'staged fgos doctor must list convention-conformance');
    assert.equal(conventionCheck.passed, true);
    assert.match(conventionCheck.message, /convention violations: \d+ pre-cutoff, 0 post-cutoff/);
    assert.doesNotMatch(conventionCheck.message, /skipped|ENOENT/);

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
    const origActiveRelease = ACTIVE_RELEASE_KEYS.map((key) => [key, process.env[key]]);

    try {
      process.env.PATH = cleanPath;
      if (cleanNodePath) {
        process.env.NODE_PATH = cleanNodePath;
      } else {
        delete process.env.NODE_PATH;
      }
      process.env.FGOS_HARNESS_ENTRY = `bin:${stagedBinary}`;
      for (const key of ACTIVE_RELEASE_KEYS) delete process.env[key];

      // Generate the coverage-floor cases. `<verb> --help` prints the manifest
      // entry for every route kind, native included, so it is exact bytes.
      // `gate-bypass --help` may route through a JSON envelope or a help-text
      // path depending on the staged config, so it allows semantic JSON when
      // present and exact bytes otherwise.
      const rawCases = generateCoverageFloorCases({ repoRoot: REPO_ROOT, routesPath: ROUTES_PATH });
      const cases = rawCases.map((c) => {
        if (c.id === 'coverage-help-gate-bypass') {
          return { ...c, modes: ['semantic-json-or-exact-bytes'] };
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
      for (const [key, value] of origActiveRelease) if (value !== undefined) process.env[key] = value;
    }
  } finally {
    fs.rmSync(stagedDir, { recursive: true, force: true });
    fs.rmSync(outsideWorkDir, { recursive: true, force: true });
  }
});

test('R4: Doctor checks rust host packaging checks are registered and report the current target posture', () => {
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
    const approvedHost =
      process.arch === 'x64' && (process.platform === 'linux' || process.platform === 'win32');
    if (id === 'rust-host-target-supported' && !approvedHost) {
      assert.equal(
        result.passed,
        false,
        `Doctor check "${id}" should remain unsupported off the approved target, got: ${result.message}`
      );
      assert.match(result.message, /not an approved rust host target/);
      continue;
    }
    assert.equal(
      result.passed,
      true,
      `Doctor check "${id}" expected to pass on clean repo, got: ${result.message}`
    );
  }
});
