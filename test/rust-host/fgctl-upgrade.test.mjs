import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  REPO_ROOT,
  buildRustDistribution,
} from '../../scripts/build-rust-distribution.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FGCTL_BIN = path.resolve(REPO_ROOT, 'target', 'release', 'fgctl');
const FGOS_BIN = path.resolve(REPO_ROOT, 'target', 'release', 'fgos');

let releaseDirA = null;
let digestA = null;
let releaseDirB = null;
let digestB = null;

function runFgctl(args, { cwd, stateHome, env = {} } = {}) {
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

function runFgos(args, { cwd, stateHome, env = {} } = {}) {
  return spawnSync(FGOS_BIN, args, {
    cwd,
    env: {
      ...process.env,
      FGOS_STATE_HOME: stateHome,
      ...env,
    },
    encoding: 'utf8',
  });
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashDirectory(dirPath) {
  const hashes = {};
  if (!fs.existsSync(dirPath)) return hashes;
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const rel = path.relative(dirPath, fullPath);
        hashes[rel] = hashFile(fullPath);
      }
    }
  }
  walk(dirPath);
  return hashes;
}

before(() => {
  assert.ok(fs.existsSync(FGCTL_BIN), `fgctl binary must exist at ${FGCTL_BIN}`);
  assert.ok(fs.existsSync(FGOS_BIN), `fgos binary must exist at ${FGOS_BIN}`);

  releaseDirA = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-upgrade-fixture-a-'));
  const resA = buildRustDistribution({
    outDir: releaseDirA,
    repoRoot: REPO_ROOT,
    releaseVersion: '0.1.0',
    stateSchemas: { read: ['1'], write: ['1'], migrations: [] },
  });
  digestA = resA.artifactDigest;

  releaseDirB = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-upgrade-fixture-b-'));
  const resB = buildRustDistribution({
    outDir: releaseDirB,
    repoRoot: REPO_ROOT,
    releaseVersion: '0.2.0',
    stateSchemas: { read: ['1'], write: ['1'], migrations: [] },
  });
  digestB = resB.artifactDigest;

  assert.notEqual(digestA, digestB, 'fixture digests A and B must differ');
});

after(() => {
  if (releaseDirA && fs.existsSync(releaseDirA)) {
    fs.rmSync(releaseDirA, { recursive: true, force: true });
  }
  if (releaseDirB && fs.existsSync(releaseDirB)) {
    fs.rmSync(releaseDirB, { recursive: true, force: true });
  }
});

test('R1, R2, R3, R6: A -> B upgrade then repair round-trips reported digest with zero work-state changes', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-upgrade-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-upgrade-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    // Step 1: fgctl init --from A
    const initRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(initRes.status, 0, `fgctl init must succeed: ${initRes.stderr}`);

    // Verify initial version
    const versionResA = runFgos(['version', '--runtime-json'], { cwd: projDir, stateHome });
    assert.equal(versionResA.status, 0, `version --runtime-json must succeed: ${versionResA.stderr}`);
    const versionJsonA = JSON.parse(versionResA.stdout.trim());
    assert.equal(versionJsonA.data.artifactDigest, digestA);
    assert.equal(versionJsonA.data.previousArtifactDigest, null);

    // Step 2: Establish work history directory and populate state files
    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const activationA = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    const workStateId = activationA.workStateId;
    const workHistoryDir = path.join(projDir, '.fgos', 'local', 'work-state', workStateId);
    fs.mkdirSync(workHistoryDir, { recursive: true });

    // Write schema.json with currentStateSchema = "1"
    fs.writeFileSync(
      path.join(workHistoryDir, 'schema.json'),
      JSON.stringify({ schemaVersion: 1, currentStateSchema: '1' }, null, 2),
      'utf8'
    );
    // Write arbitrary state file
    fs.writeFileSync(
      path.join(workHistoryDir, 'session-state.json'),
      JSON.stringify({ cursor: 42, activeTask: 'tsk-upgrade-test' }, null, 2),
      'utf8'
    );

    const hashesBefore = hashDirectory(workHistoryDir);
    assert.ok(Object.keys(hashesBefore).length >= 2, 'Must have at least 2 work-state files');

    // Step 3: fgctl upgrade --from B
    const upgradeRes = runFgctl(['upgrade', '--from', releaseDirB], { cwd: projDir, stateHome });
    assert.equal(upgradeRes.status, 0, `fgctl upgrade must succeed: ${upgradeRes.stderr}`);

    // Step 4: Verify upgraded activation
    const versionResB = runFgos(['version', '--runtime-json'], { cwd: projDir, stateHome });
    assert.equal(versionResB.status, 0, `version --runtime-json after upgrade: ${versionResB.stderr}`);
    const versionJsonB = JSON.parse(versionResB.stdout.trim());
    assert.equal(versionJsonB.data.artifactDigest, digestB, 'artifactDigest must be B');
    assert.equal(versionJsonB.data.previousArtifactDigest, digestA, 'previousArtifactDigest must be A');

    // Check status --json
    const statusResB = runFgctl(['status', '--json'], { cwd: projDir, stateHome });
    assert.equal(statusResB.status, 0, `status --json: ${statusResB.stderr}`);
    const statusJsonB = JSON.parse(statusResB.stdout.trim());
    assert.equal(statusJsonB.activeArtifactDigest, digestB);
    assert.equal(statusJsonB.previousArtifactDigest, digestA);
    assert.ok(!statusJsonB.quarantined, 'quarantined marker should not be set when healthy');

    // Old release directory under releases/ is retained (Retention decision)
    const storeRoot = stateHome;
    const oldReleaseDir = path.join(storeRoot, 'releases', digestA);
    assert.ok(fs.existsSync(oldReleaseDir), 'Previous release directory must be retained under releases/');

    // Step 5: fgctl repair rolls back to previousArtifactDigest (A)
    const repairRes = runFgctl(['repair'], { cwd: projDir, stateHome });
    assert.equal(repairRes.status, 0, `fgctl repair must succeed: ${repairRes.stderr}`);

    // Step 6: Verify rolled back activation
    const versionResRepaired = runFgos(['version', '--runtime-json'], { cwd: projDir, stateHome });
    assert.equal(versionResRepaired.status, 0, `version --runtime-json after repair: ${versionResRepaired.stderr}`);
    const versionJsonRepaired = JSON.parse(versionResRepaired.stdout.trim());
    assert.equal(versionJsonRepaired.data.artifactDigest, digestA, 'artifactDigest must be restored to A');

    // Step 7: Hash work-history directory and assert byte-identical
    const hashesAfter = hashDirectory(workHistoryDir);
    assert.deepEqual(hashesAfter, hashesBefore, 'work-state directory files must be byte-identical after upgrade/repair');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R4, R5, R6: Corrupting one byte in active release triggers quarantine and status reflects quarantined: true', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-verify-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-verify-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    const initRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(initRes.status, 0);

    // Verify works initially
    const verifyInitial = runFgctl(['verify'], { cwd: projDir, stateHome });
    assert.equal(verifyInitial.status, 0, `fgctl verify must succeed before tamper: ${verifyInitial.stderr}`);

    // Corrupt one byte in active staged release file
    const storeRoot = stateHome;
    const stagedFile = path.join(storeRoot, 'releases', digestA, 'bin', 'fgos');
    assert.ok(fs.existsSync(stagedFile), `Staged file must exist at ${stagedFile}`);
    fs.appendFileSync(stagedFile, 'TAMPER');

    // Run fgctl verify -> must fail and quarantine
    const verifyTampered = runFgctl(['verify'], { cwd: projDir, stateHome });
    assert.notEqual(verifyTampered.status, 0, 'fgctl verify must fail when file is tampered');

    // Releases dir for digestA must be gone, and moved to quarantine/
    const originalReleaseDir = path.join(storeRoot, 'releases', digestA);
    assert.ok(!fs.existsSync(originalReleaseDir), 'Release dir must be moved out of releases/');

    const quarantineDir = path.join(storeRoot, 'quarantine');
    assert.ok(fs.existsSync(quarantineDir), 'quarantine dir must exist');
    const quarantinedEntries = fs.readdirSync(quarantineDir);
    assert.ok(
      quarantinedEntries.some((e) => e.startsWith(digestA)),
      `quarantine must contain entry starting with ${digestA}`
    );

    // activation.json status is "quarantined"
    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(activation.status, 'quarantined');

    // status --json reflects quarantined: true
    const statusJsonRes = runFgctl(['status', '--json'], { cwd: projDir, stateHome });
    assert.equal(statusJsonRes.status, 0);
    const statusJson = JSON.parse(statusJsonRes.stdout.trim());
    assert.equal(statusJson.activeArtifactDigest, digestA);
    assert.equal(statusJson.quarantined, true, 'status --json must have quarantined: true');

    // status text output reflects quarantined: true
    const statusTextRes = runFgctl(['status'], { cwd: projDir, stateHome });
    assert.equal(statusTextRes.status, 0);
    assert.match(statusTextRes.stdout, /quarantined:\s*true/, 'status text must show quarantined: true');

    // Runtime reader treats quarantined as missing binding / fails closed
    const shimPath = path.join(projDir, '.fgos', 'installation', 'bin', 'fgos');
    const shimRes = spawnSync(shimPath, ['version'], { cwd: projDir, encoding: 'utf8' });
    assert.notEqual(shimRes.status, 0, 'shim execution must fail closed when runtime is quarantined');
    assert.match(shimRes.stderr, /quarantined/);
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R1, R6: Upgrade candidate whose stateSchemas.write omits workspace current schema is refused before publish', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-schema-write-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-schema-write-proj-'));
  const badWriteReleaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-bad-write-release-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    const initRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(initRes.status, 0);

    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const activationA = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    const workStateId = activationA.workStateId;
    const workHistoryDir = path.join(projDir, '.fgos', 'local', 'work-state', workStateId);
    fs.mkdirSync(workHistoryDir, { recursive: true });
    fs.writeFileSync(
      path.join(workHistoryDir, 'schema.json'),
      JSON.stringify({ schemaVersion: 1, currentStateSchema: '1' }, null, 2),
      'utf8'
    );

    const activationContentBefore = fs.readFileSync(activationPath, 'utf8');

    // Build candidate with write: ['2'] (omitting '1')
    buildRustDistribution({
      outDir: badWriteReleaseDir,
      repoRoot: REPO_ROOT,
      releaseVersion: '0.3.0',
      stateSchemas: { read: ['1'], write: ['2'], migrations: [] },
    });

    const upgradeRes = runFgctl(['upgrade', '--from', badWriteReleaseDir], { cwd: projDir, stateHome });
    assert.notEqual(upgradeRes.status, 0, 'upgrade must be refused');
    assert.match(upgradeRes.stderr, /state-schema-write-incompatible/);

    const activationContentAfter = fs.readFileSync(activationPath, 'utf8');
    assert.equal(activationContentAfter, activationContentBefore, 'activation.json must be byte-for-byte unchanged');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(badWriteReleaseDir, { recursive: true, force: true });
  }
});

test('R1, R6: Upgrade candidate whose stateSchemas.read omits workspace current schema is refused before publish', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-schema-read-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-schema-read-proj-'));
  const badReadReleaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-bad-read-release-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    const initRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(initRes.status, 0);

    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const activationA = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    const workStateId = activationA.workStateId;
    const workHistoryDir = path.join(projDir, '.fgos', 'local', 'work-state', workStateId);
    fs.mkdirSync(workHistoryDir, { recursive: true });
    fs.writeFileSync(
      path.join(workHistoryDir, 'schema.json'),
      JSON.stringify({ schemaVersion: 1, currentStateSchema: '1' }, null, 2),
      'utf8'
    );

    const activationContentBefore = fs.readFileSync(activationPath, 'utf8');

    // Build candidate with read: ['2'] (omitting '1')
    buildRustDistribution({
      outDir: badReadReleaseDir,
      repoRoot: REPO_ROOT,
      releaseVersion: '0.4.0',
      stateSchemas: { read: ['2'], write: ['1'], migrations: [] },
    });

    const upgradeRes = runFgctl(['upgrade', '--from', badReadReleaseDir], { cwd: projDir, stateHome });
    assert.notEqual(upgradeRes.status, 0, 'upgrade must be refused');
    assert.match(upgradeRes.stderr, /state-schema-incompatible/);

    const activationContentAfter = fs.readFileSync(activationPath, 'utf8');
    assert.equal(activationContentAfter, activationContentBefore, 'activation.json must be byte-for-byte unchanged');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(badReadReleaseDir, { recursive: true, force: true });
  }
});

test('Reviewer M1: a quarantined workspace recovers via fgctl init --from (documented door), status returns to ready', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m1-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m1-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    assert.equal(runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome }).status, 0);

    // Tamper and quarantine via verify (same repro as the R4/R5/R6 test above).
    const stagedFile = path.join(stateHome, 'releases', digestA, 'bin', 'fgos');
    fs.appendFileSync(stagedFile, 'TAMPER');
    assert.notEqual(runFgctl(['verify'], { cwd: projDir, stateHome }).status, 0);

    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    assert.equal(JSON.parse(fs.readFileSync(activationPath, 'utf8')).status, 'quarantined');

    // Before the fix, `fgctl init` (no --from) would idempotent-skip on
    // digest match alone and never reach the tail; confirm it now refuses
    // clearly instead, naming the quarantine.
    const initNoFrom = runFgctl(['init'], { cwd: projDir, stateHome });
    assert.notEqual(initNoFrom.status, 0, 'init with no --from must not silently no-op a quarantined workspace');
    assert.match(initNoFrom.stderr, /quarantined/i);

    // The documented recovery door: fgctl init --from <matching source>
    // must genuinely re-stage/re-verify/re-publish, not idempotent-skip.
    const recoverRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(recoverRes.status, 0, `init --from must recover a quarantined workspace: ${recoverRes.stderr}`);

    const recovered = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(recovered.status, 'ready', 'status must return to ready after recovery');
    assert.equal(recovered.artifactDigest, digestA);
    assert.ok(fs.existsSync(path.join(stateHome, 'releases', digestA)), 'digestA must be staged again under releases/');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('Reviewer M2: upgrading away from a quarantined activation chains previousArtifactDigest past it, not to the moved digest', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    assert.equal(runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome }).status, 0);

    const stagedFile = path.join(stateHome, 'releases', digestA, 'bin', 'fgos');
    fs.appendFileSync(stagedFile, 'TAMPER');
    assert.notEqual(runFgctl(['verify'], { cwd: projDir, stateHome }).status, 0);

    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    assert.equal(JSON.parse(fs.readFileSync(activationPath, 'utf8')).status, 'quarantined');

    // Upgrade away from the quarantined A straight to B.
    const upgradeRes = runFgctl(['upgrade', '--from', releaseDirB], { cwd: projDir, stateHome });
    assert.equal(upgradeRes.status, 0, `upgrade from a quarantined activation must succeed: ${upgradeRes.stderr}`);

    const afterUpgrade = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(afterUpgrade.artifactDigest, digestB);
    assert.equal(afterUpgrade.status, 'ready');
    // digestA's release directory was moved to quarantine/ and no longer
    // exists -- previousArtifactDigest must never point at it (a later
    // `fgctl repair` would otherwise fail looking for a directory that's
    // gone by design, per the M2 finding).
    assert.notEqual(afterUpgrade.previousArtifactDigest, digestA);
    if (afterUpgrade.previousArtifactDigest !== null) {
      assert.ok(
        fs.existsSync(path.join(stateHome, 'releases', afterUpgrade.previousArtifactDigest)),
        'previousArtifactDigest, if set, must name a release directory that still genuinely exists'
      );
    }
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('Red-team LOW: same-digest upgrade is idempotent (no new activationId, no self-referential previousArtifactDigest)', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-idem-upgrade-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-idem-upgrade-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    assert.equal(runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome }).status, 0);
    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const before = JSON.parse(fs.readFileSync(activationPath, 'utf8'));

    // Re-run upgrade against the SAME digest that's already active.
    const upgradeRes = runFgctl(['upgrade', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(upgradeRes.status, 0, `same-digest upgrade must succeed: ${upgradeRes.stderr}`);

    const after = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(after.activationId, before.activationId, 'same-digest upgrade must not mint a new activationId');
    assert.equal(after.artifactDigest, digestA);
    assert.notEqual(after.previousArtifactDigest, digestA, 'previousArtifactDigest must never self-reference the active digest');
    assert.equal(after.previousArtifactDigest, before.previousArtifactDigest, 'previousArtifactDigest must be unchanged by a same-digest upgrade');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('Red-team MEDIUM: repair of a tampered active release (no previousArtifactDigest) quarantines it, not just refuses', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-repair-tamper-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-repair-tamper-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    assert.equal(runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome }).status, 0);

    // Tamper the active release WITHOUT going through `fgctl verify` first --
    // `fgctl repair` (previousArtifactDigest null) must independently detect
    // and quarantine it, not merely refuse and leave a known-bad payload
    // sitting under releases/<digest>/.
    const stagedFile = path.join(stateHome, 'releases', digestA, 'bin', 'fgos');
    fs.appendFileSync(stagedFile, 'TAMPER');

    const repairRes = runFgctl(['repair'], { cwd: projDir, stateHome });
    assert.notEqual(repairRes.status, 0, 'repair of a tampered active release must fail');

    const releaseDir = path.join(stateHome, 'releases', digestA);
    assert.ok(!fs.existsSync(releaseDir), 'tampered release must be moved out of releases/ by repair, not left in place');

    const quarantineDir = path.join(stateHome, 'quarantine');
    assert.ok(fs.existsSync(quarantineDir), 'quarantine dir must exist after a failed repair');
    const quarantinedEntries = fs.readdirSync(quarantineDir);
    assert.ok(
      quarantinedEntries.some((e) => e.startsWith(digestA)),
      `quarantine must contain an entry for ${digestA} after repair fails`
    );

    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(activation.status, 'quarantined', 'activation.json must be marked quarantined after repair fails');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('Red-team MEDIUM: a "falsely ready" binding (release moved but status never updated) self-heals via init --from', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-falseready-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-falseready-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    assert.equal(runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome }).status, 0);

    // Simulate the exact crash window red-team found: `fgctl verify` moves
    // the release directory to quarantine/ but is killed before it
    // publishes status: "quarantined" -- activation.json still (falsely)
    // reads "ready" for a digest whose release directory no longer exists.
    const releaseDir = path.join(stateHome, 'releases', digestA);
    const quarantineDir = path.join(stateHome, 'quarantine', `${digestA}-simulated-crash`);
    fs.mkdirSync(path.dirname(quarantineDir), { recursive: true });
    fs.renameSync(releaseDir, quarantineDir);

    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const beforeActivation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(beforeActivation.status, 'ready', 'precondition: status must still read ready (simulating the crash window)');
    assert.ok(!fs.existsSync(releaseDir), 'precondition: the release directory must genuinely be gone');

    // Without the is_release_staged check, this would take the idempotent
    // fast path (digest matches, status looks ready) and never re-stage --
    // the tail would then fail against a missing binary with no recovery.
    const recoverRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(recoverRes.status, 0, `init --from must self-heal a falsely-ready binding: ${recoverRes.stderr}`);
    assert.ok(fs.existsSync(releaseDir), 'digestA must be genuinely re-staged under releases/');

    const afterActivation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(afterActivation.status, 'ready');
    assert.equal(afterActivation.artifactDigest, digestA);
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test('R3: Repair when previousArtifactDigest is null re-verifies active release and heals broken capsule', () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-repair-null-state-'));
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-repair-null-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: projDir });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: projDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projDir });

    const initRes = runFgctl(['init', '--from', releaseDirA], { cwd: projDir, stateHome });
    assert.equal(initRes.status, 0);

    const shimPath = path.join(projDir, '.fgos', 'installation', 'bin', 'fgos');
    assert.ok(fs.existsSync(shimPath), 'Shim must exist');

    // Delete shim
    fs.rmSync(shimPath);
    assert.ok(!fs.existsSync(shimPath), 'Shim must be deleted');

    // fgctl repair when previousArtifactDigest is null heals capsule
    const repairRes = runFgctl(['repair'], { cwd: projDir, stateHome });
    assert.equal(repairRes.status, 0, `fgctl repair must succeed: ${repairRes.stderr}`);

    assert.ok(fs.existsSync(shimPath), 'Shim must be restored by repair');

    // Verify identity unchanged
    const activationPath = path.join(projDir, '.fgos', 'installation', 'activation.json');
    const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(activation.artifactDigest, digestA);
    assert.equal(activation.previousArtifactDigest, null);
    assert.equal(activation.status, 'ready');
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});
