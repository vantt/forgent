import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  REPO_ROOT,
  buildRustDistribution,
} from '../../scripts/build-rust-distribution.mjs';
import { DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FGCTL_BIN = path.resolve(REPO_ROOT, 'target', 'release', 'fgctl');

let fixtureReleaseDir = null;
let fixtureDigest = null;

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

before(() => {
  assert.ok(fs.existsSync(FGCTL_BIN), `fgctl binary must exist at ${FGCTL_BIN}`);
  fixtureReleaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-init-fixture-'));
  const res = buildRustDistribution({ outDir: fixtureReleaseDir, repoRoot: REPO_ROOT });
  fixtureDigest = res.artifactDigest;
});

after(() => {
  if (fixtureReleaseDir && fs.existsSync(fixtureReleaseDir)) {
    fs.rmSync(fixtureReleaseDir, { recursive: true, force: true });
  }
});

test('R5 drift guard: DEFAULT_TTL_MS in src/runner/main-checkout-lock.mjs:110 is 3 * 60 * 1000 ms', () => {
  assert.equal(DEFAULT_TTL_MS, 3 * 60 * 1000, 'DEFAULT_TTL_MS must match 180_000 ms');
});

test('R11 & R1-R8, R10: fgctl init in a fresh git project publishes shims, root.json, activation.json, and passes preflight/tail', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-init-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-init-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-init-proj-'));

  try {
    // 1. Fresh git init project
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // 2. Run fgctl init --from <Phase-09 tree>
    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.equal(res.status, 0, `fgctl init must exit 0: stdout=${res.stdout}, stderr=${res.stderr}`);

    // 3. Shims exist and are executable
    const shimFgos = path.join(tempProj, '.fgos', 'installation', 'bin', 'fgos');
    const shimRunner = path.join(tempProj, '.fgos', 'installation', 'bin', 'fgos-runner');

    assert.ok(fs.existsSync(shimFgos), 'bin/fgos shim must exist');
    assert.ok(fs.existsSync(shimRunner), 'bin/fgos-runner shim must exist');

    const fgosStat = fs.statSync(shimFgos);
    const runnerStat = fs.statSync(shimRunner);
    assert.ok((fgosStat.mode & 0o111) !== 0, 'bin/fgos must have executable bit set');
    assert.ok((runnerStat.mode & 0o111) !== 0, 'bin/fgos-runner must have executable bit set');

    // 4. root.json exists and contains required fields
    const rootJsonPath = path.join(tempProj, '.fgos', 'installation', 'root.json');
    assert.ok(fs.existsSync(rootJsonPath), 'root.json must exist');
    const rootJson = JSON.parse(fs.readFileSync(rootJsonPath, 'utf8'));
    assert.equal(rootJson.schemaVersion, 1);
    assert.equal(rootJson.repositoryRoot, fs.realpathSync(tempProj));
    assert.equal(rootJson.machineReleaseStore, tempState);
    assert.equal(rootJson.workspaceId.length, 16);
    assert.equal(rootJson.workStateId, rootJson.workspaceId);

    // 5. activation.json exists and status is ready
    const activationPath = path.join(tempProj, '.fgos', 'installation', 'activation.json');
    assert.ok(fs.existsSync(activationPath), 'activation.json must exist');
    const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(activation.status, 'ready');
    assert.equal(activation.schemaVersion, 1);
    assert.equal(activation.artifactDigest, fixtureDigest);
    assert.equal(activation.workspaceId, rootJson.workspaceId);
    assert.equal(activation.workStateId, rootJson.workStateId);
    assert.equal(activation.previousArtifactDigest, null);
    assert.equal(activation.shimVersion, '1');
    assert.ok(activation.resolvedDependencies?.node, 'resolvedDependencies.node must be present');
    assert.equal(activation.activatedBy?.tool, 'fgctl');

    // 6. Tracked .fgos/distribution.json was created with pin shape (R3)
    const distPinPath = path.join(tempProj, '.fgos', 'distribution.json');
    assert.ok(fs.existsSync(distPinPath), 'distribution.json must be created when absent');
    const distPin = JSON.parse(fs.readFileSync(distPinPath, 'utf8'));
    assert.equal(distPin.schemaVersion, 1);
    assert.equal(distPin.projectRuntime?.policy, 'exact-digest');
    assert.equal(distPin.projectRuntime?.artifactDigest, fixtureDigest);

    // 7. Install transaction record exists and is complete (R7/R8)
    const txPath = path.join(tempState, 'installs', `${activation.activationId}.json`);
    assert.ok(fs.existsSync(txPath), `transaction file must exist at ${txPath}`);
    const txRecord = JSON.parse(fs.readFileSync(txPath, 'utf8'));
    assert.equal(txRecord.status, 'complete');
    assert.equal(txRecord.artifactDigest, fixtureDigest);
    const statuses = txRecord.history.map((h) => h.status);
    assert.ok(statuses.includes('staging'));
    assert.ok(statuses.includes('verified'));
    assert.ok(statuses.includes('preparing'));
    assert.ok(statuses.includes('ready-published'));
    assert.ok(statuses.includes('complete'));

    // 8. version --runtime-json through the shim reports R10 fields with host: "rust"
    const versionRes = spawnSync(shimFgos, ['version', '--runtime-json'], {
      cwd: tempProj,
      env: { ...process.env, FGOS_STATE_HOME: tempState, HOME: tempHome },
      encoding: 'utf8',
    });
    assert.equal(versionRes.status, 0, `version --runtime-json must exit 0: ${versionRes.stderr}`);
    const versionEnv = JSON.parse(versionRes.stdout.trim());
    assert.equal(versionEnv.contract, 'fgos.v1');
    assert.equal(versionEnv.data.host, 'rust');
    assert.equal(versionEnv.data.artifactDigest, fixtureDigest);
    assert.equal(versionEnv.data.projectRoot, fs.realpathSync(tempProj));
    assert.equal(versionEnv.data.workspaceId, rootJson.workspaceId);
    assert.equal(versionEnv.data.workStateId, rootJson.workStateId);
    assert.equal(
      versionEnv.data.workHistoryRoot,
      path.join(fs.realpathSync(tempProj), '.fgos', 'local', 'work-state', rootJson.workStateId)
    );
    assert.equal(versionEnv.data.machineReleaseStore, tempState);
    assert.equal(versionEnv.data.schemaVersion, 1);
    assert.ok(versionEnv.data.components?.legacyNode, 'components.legacyNode must be present');
    assert.equal(versionEnv.data.components.legacyNode.entry, 'bin/fgos.mjs');

    // 9. ready --json through the shim matches node bin/fgos.mjs ready --json
    const shimReadyRes = spawnSync(shimFgos, ['ready', '--json'], {
      cwd: tempProj,
      env: { ...process.env, FGOS_STATE_HOME: tempState, HOME: tempHome },
      encoding: 'utf8',
    });
    assert.equal(shimReadyRes.status, 0, `shim ready --json must exit 0: ${shimReadyRes.stderr}`);

    const nodeReadyRes = spawnSync('node', [path.resolve(REPO_ROOT, 'bin/fgos.mjs'), 'ready', '--json'], {
      cwd: tempProj,
      env: { ...process.env, FGOS_STATE_HOME: tempState, HOME: tempHome },
      encoding: 'utf8',
    });
    assert.equal(nodeReadyRes.status, 0, `node ready --json must exit 0: ${nodeReadyRes.stderr}`);

    const parsedShim = JSON.parse(shimReadyRes.stdout.trim());
    const parsedNode = JSON.parse(nodeReadyRes.stdout.trim());

    assert.equal(parsedShim.contract, parsedNode.contract);
    assert.equal(parsedShim.data_hash, parsedNode.data_hash);
    assert.deepEqual(parsedShim.data, parsedNode.data);

    // Byte-for-byte match with timestamp normalized
    const normalizeTimestamp = (str) => str.replace(/"generated_at":\s*"[^"]+"/, '"generated_at": "NORMALIZED"');
    assert.equal(
      normalizeTimestamp(shimReadyRes.stdout.trim()),
      normalizeTimestamp(nodeReadyRes.stdout.trim()),
      'ready --json through shim must match node bin/fgos.mjs byte-for-byte (modulo timestamp)'
    );

    // 10. Re-running init at the same digest is idempotent (R9)
    const rerunRes = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(rerunRes.status, 0, `idempotent re-run must exit 0: ${rerunRes.stderr}`);

    const activationAfterRerun = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(
      activationAfterRerun.activationId,
      activation.activationId,
      'activationId must remain unchanged on idempotent re-run'
    );
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('R5 & R11: Hand-written live .fgos/main-checkout.lock refuses init writing nothing', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lock-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lock-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lock-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const lockPath = path.join(fgosDir, 'main-checkout.lock');

    // Write a live numeric-pid lock (current process is alive)
    fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, ts: Date.now() }));

    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.notEqual(res.status, 0, 'fgctl init must fail when lock is held');
    assert.match(res.stderr, /lock-held/, 'stderr must report lock-held');
    assert.match(res.stderr, new RegExp(String(process.pid)), 'stderr must name the holder process');

    // Assert no .fgos/installation was created
    assert.ok(
      !fs.existsSync(path.join(tempProj, '.fgos', 'installation')),
      'No .fgos/installation directory must be created on lock refusal'
    );
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('R5 & R11: Live string-identity lock within DEFAULT_TTL_MS refuses init writing nothing', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-strlock-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-strlock-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-strlock-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const lockPath = path.join(fgosDir, 'main-checkout.lock');

    // Write a fresh string-identity lock
    fs.writeFileSync(lockPath, JSON.stringify({ pid: 'active-session-123', ts: Date.now() }));

    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.notEqual(res.status, 0, 'fgctl init must fail when string-identity lock is fresh');
    assert.match(res.stderr, /lock-held/, 'stderr must report lock-held');
    assert.match(res.stderr, /active-session-123/, 'stderr must name the session');

    // Assert no .fgos/installation was created
    assert.ok(
      !fs.existsSync(path.join(tempProj, '.fgos', 'installation')),
      'No .fgos/installation directory must be created on lock refusal'
    );
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('R5: Ambiguous (unparseable) main-checkout.lock refuses init writing nothing', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ambig-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ambig-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ambig-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const lockPath = path.join(fgosDir, 'main-checkout.lock');

    // Write an invalid/unparseable lock record
    fs.writeFileSync(lockPath, 'this is not valid json or record');

    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.notEqual(res.status, 0, 'fgctl init must fail when lock is ambiguous');
    assert.match(res.stderr, /lock-ambiguous/, 'stderr must report lock-ambiguous');

    // Assert no .fgos/installation was created
    assert.ok(
      !fs.existsSync(path.join(tempProj, '.fgos', 'installation')),
      'No .fgos/installation directory must be created on ambiguous lock refusal'
    );
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('R1 & R11: Non-git directory refuses init with clear error and no .fgos/installation created', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-nongit-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-nongit-state-'));
  const tempNonGit = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-nongit-proj-'));

  try {
    // Deliberately no `git init`
    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempNonGit,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.notEqual(res.status, 0, 'fgctl init must fail outside git repo');
    assert.match(res.stderr, /not a git repository/i, 'stderr must report not a git repository');

    // Assert no .fgos/installation created
    assert.ok(
      !fs.existsSync(path.join(tempNonGit, '.fgos', 'installation')),
      'No .fgos/installation directory must be created outside git repo'
    );
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempNonGit, { recursive: true, force: true });
  }
});

test('R10: version --runtime-json outside activated workspace reports host: "dev-source" and null fields', () => {
  const fgosBin = path.resolve(REPO_ROOT, 'target', 'release', 'fgos');
  const tempEmptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-devsource-'));

  try {
    const res = spawnSync(fgosBin, ['version', '--runtime-json'], {
      cwd: tempEmptyDir,
      encoding: 'utf8',
    });

    assert.equal(res.status, 0, `version --runtime-json must exit 0: ${res.stderr}`);
    const parsed = JSON.parse(res.stdout.trim());
    assert.equal(parsed.contract, 'fgos.v1');
    assert.equal(parsed.data.host, 'dev-source');
    assert.equal(parsed.data.projectRoot, null);
    assert.equal(parsed.data.workspaceId, null);
    assert.equal(parsed.data.workHistoryRoot, null);
    assert.equal(parsed.data.workStateId, null);
    assert.equal(parsed.data.machineReleaseStore, null);
    assert.equal(parsed.data.artifactDigest, null);
    assert.equal(parsed.data.releaseVersion, null);
    assert.equal(parsed.data.schemaVersion, null);
    assert.equal(parsed.data.stateSchemas, null);
    assert.equal(parsed.data.components, null);
  } finally {
    fs.rmSync(tempEmptyDir, { recursive: true, force: true });
  }
});
