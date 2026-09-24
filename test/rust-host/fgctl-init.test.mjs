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
  computeArtifactDigest,
  hashFile,
} from '../../scripts/build-rust-distribution.mjs';
import { DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FGCTL_BIN = path.resolve(REPO_ROOT, 'target', 'release', process.platform === 'win32' ? 'fgctl.exe' : 'fgctl');

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
    assert.equal(versionEnv.data.artifactDigest, activation.artifactDigest);
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

test('Item 1: Concurrent fgctl init invocations against pre-staged pinned workspace observe activation-lock refusal (exactly one winner)', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-conc-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-conc-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-conc-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Pre-stage fixture into release store
    const stageRes = runFgctl(['stage', '--from', fixtureReleaseDir], { stateHome: tempState });
    assert.equal(stageRes.status, 0, `Pre-staging fixture must succeed: ${stageRes.stderr}`);

    // Pre-pin workspace to fixtureDigest
    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const distPin = {
      schemaVersion: 1,
      projectRuntime: {
        policy: 'exact-digest',
        artifactDigest: fixtureDigest,
        releaseVersion: '0.1.0',
        channel: null,
        allowPrerelease: false,
      },
    };
    fs.writeFileSync(path.join(fgosDir, 'distribution.json'), JSON.stringify(distPin, null, 2));

    // Fire several truly concurrent fgctl init processes. A narrow window
    // between activation.lock's create and its content becoming fully
    // visible only shows up probabilistically under real concurrency, not
    // via a fixed handful of processes -- push the count up to widen the
    // odds of catching a regression of that class here.
    const procCount = 24;
    const procs = Array.from({ length: procCount }, () =>
      spawn(FGCTL_BIN, ['init'], {
        cwd: tempProj,
        env: { ...process.env, FGOS_STATE_HOME: tempState, HOME: tempHome },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );

    const results = await Promise.all(procs.map(waitForProcess));
    const succeeded = results.filter((r) => r.code === 0);
    const failed = results.filter((r) => r.code !== 0);

    assert.equal(succeeded.length, 1, 'Exactly one concurrent init must succeed');
    assert.equal(failed.length, procCount - 1, 'Every other concurrent init must fail');
    for (const r of failed) {
      assert.match(r.stderr, /activation-lock-held/, 'Failed invocation must report activation-lock-held');
    }

    // Exactly one completed install transaction record in store
    const installsDir = path.join(tempState, 'installs');
    assert.ok(fs.existsSync(installsDir), 'installs directory must exist');
    const txFiles = fs.readdirSync(installsDir).filter((f) => f.endsWith('.json'));
    assert.equal(txFiles.length, 1, 'Release store must contain exactly one completed install transaction');

    // activation.json exists, activation.lock is removed
    assert.ok(fs.existsSync(path.join(tempProj, '.fgos', 'installation', 'activation.json')));
    assert.ok(!fs.existsSync(path.join(tempProj, '.fgos', 'installation', 'activation.lock')));
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 2: Pinned workspace reconciles with matching --from source when unstaged, and refuses mismatching --from without overriding pin', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-pin-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-pin-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-pin-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });

    // Pinned to fixtureDigest
    const distPin = {
      schemaVersion: 1,
      projectRuntime: {
        policy: 'exact-digest',
        artifactDigest: fixtureDigest,
        releaseVersion: '0.1.0',
        channel: null,
        allowPrerelease: false,
      },
    };
    const pinPath = path.join(fgosDir, 'distribution.json');
    fs.writeFileSync(pinPath, JSON.stringify(distPin, null, 2));

    // A: Pinned and unstaged, NO --from: refuses clearly naming pin is unstaged
    const resNoFrom = runFgctl(['init'], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.notEqual(resNoFrom.status, 0);
    assert.match(resNoFrom.stderr, /pinned release .* is not staged .* and no --from source was provided/);
    assert.ok(!fs.existsSync(path.join(tempProj, '.fgos', 'installation')));

    // B: Pinned and unstaged, mismatching --from: refuses clearly with pin-mismatch and writes nothing
    const mismatchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-mismatch-'));
    const dummyManifest = JSON.parse(fs.readFileSync(path.join(fixtureReleaseDir, 'manifest.json'), 'utf8'));
    dummyManifest.artifactDigest = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
    fs.writeFileSync(path.join(mismatchDir, 'manifest.json'), JSON.stringify(dummyManifest, null, 2));

    const resMismatch = runFgctl(['init', '--from', mismatchDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.notEqual(resMismatch.status, 0);
    assert.match(resMismatch.stderr, /pin-mismatch/);
    assert.match(resMismatch.stderr, new RegExp(fixtureDigest));
    assert.ok(!fs.existsSync(path.join(tempProj, '.fgos', 'installation')), 'Must write nothing on pin mismatch');

    // Pin file in workspace was NOT overridden
    const pinAfter = JSON.parse(fs.readFileSync(pinPath, 'utf8'));
    assert.equal(pinAfter.projectRuntime.artifactDigest, fixtureDigest, 'Tracked pin must not be modified');

    // C: Pinned and unstaged, matching --from: reconciles, stages, and activates successfully
    const resMatching = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(resMatching.status, 0, `Matching --from must succeed: ${resMatching.stderr}`);
    assert.ok(fs.existsSync(path.join(tempProj, '.fgos', 'installation', 'activation.json')));

    fs.rmSync(mismatchDir, { recursive: true, force: true });
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 3: Idempotent re-run skips stage_release entirely (does not contend for install.lock)', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // 1. Initial init
    const initRes = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(initRes.status, 0);

    // 2. Intentionally block the release store's install.lock
    const installLockPath = path.join(tempState, 'install.lock');
    fs.writeFileSync(installLockPath, 'artificially locked store');

    // 3. Re-run init at the same digest: must skip stage_release and succeed without failing on install.lock!
    const rerunRes = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(rerunRes.status, 0, `Idempotent re-run must not touch install.lock: ${rerunRes.stderr}`);

    // Cleanup artificial lock
    fs.unlinkSync(installLockPath);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 4: Live-PID lock whose ts is older than DEFAULT_TTL_MS is treated as free', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l1-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l1-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l1-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const lockPath = path.join(fgosDir, 'main-checkout.lock');

    // Write a lock held by current live PID, but with ts older than DEFAULT_TTL_MS (3 mins)
    const expiredTs = Date.now() - DEFAULT_TTL_MS - 5000;
    fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, ts: expiredTs }));

    // Must be treated as free and succeed!
    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(res.status, 0, `Init must succeed when live PID lock is expired: ${res.stderr}`);
    assert.ok(fs.existsSync(path.join(tempProj, '.fgos', 'installation', 'activation.json')));
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 5: Staged release whose manifest.json digest mismatches pin is refused', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l7-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l7-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l7-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Pre-stage fixture into release store
    const stageRes = runFgctl(['stage', '--from', fixtureReleaseDir], { stateHome: tempState });
    assert.equal(stageRes.status, 0);

    // Tamper with manifest in staged release dir
    const stagedManifestPath = path.join(tempState, 'releases', fixtureDigest, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(stagedManifestPath, 'utf8'));
    manifest.artifactDigest = 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    fs.writeFileSync(stagedManifestPath, JSON.stringify(manifest, null, 2));

    // Pin workspace to fixtureDigest (no --from provided)
    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const distPin = {
      schemaVersion: 1,
      projectRuntime: {
        policy: 'exact-digest',
        artifactDigest: fixtureDigest,
        releaseVersion: '0.1.0',
        channel: null,
        allowPrerelease: false,
      },
    };
    fs.writeFileSync(path.join(fgosDir, 'distribution.json'), JSON.stringify(distPin, null, 2));

    // fgctl init without --from must detect the tampered manifest and refuse clearly
    const res = runFgctl(['init'], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /manifest digest mismatch/);
    assert.ok(!fs.existsSync(path.join(tempProj, '.fgos', 'installation')));
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 5 (widened): a tampered staged release is refused on the pin+matching --from NoOp arm too, not just the pin-only arm', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l7-noop-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l7-noop-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l7-noop-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Pre-stage fixture, then tamper with the staged copy's manifest so
    // releases/<fixtureDigest>/manifest.json declares a different digest --
    // stage_release's own NoOp path (dir already exists) never re-verifies,
    // so only init's own post-match digest assertion can catch this.
    const stageRes = runFgctl(['stage', '--from', fixtureReleaseDir], { stateHome: tempState });
    assert.equal(stageRes.status, 0);
    const stagedManifestPath = path.join(tempState, 'releases', fixtureDigest, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(stagedManifestPath, 'utf8'));
    manifest.artifactDigest = 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    fs.writeFileSync(stagedManifestPath, JSON.stringify(manifest, null, 2));

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const distPin = {
      schemaVersion: 1,
      projectRuntime: {
        policy: 'exact-digest',
        artifactDigest: fixtureDigest,
        releaseVersion: '0.1.0',
        channel: null,
        allowPrerelease: false,
      },
    };
    fs.writeFileSync(path.join(fgosDir, 'distribution.json'), JSON.stringify(distPin, null, 2));

    // Pin + matching --from source (resolves to fixtureDigest, matches the
    // pin) -> stage_release takes the NoOp path since releases/<digest>/
    // already exists -- the tampered on-disk manifest must still be caught.
    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.notEqual(res.status, 0, 'Tampered staged release must be refused even via the --from NoOp arm');
    assert.match(res.stderr, /manifest digest mismatch/);
    assert.ok(!fs.existsSync(path.join(tempProj, '.fgos', 'installation')));
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 6: Stale activation.json.tmp.* files left from crash are cleaned up on fgctl init', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l8-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l8-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-l8-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Simulate leftover tmp file from crashed previous run
    const installDir = path.join(tempProj, '.fgos', 'installation');
    fs.mkdirSync(installDir, { recursive: true });
    const staleTmp1 = path.join(installDir, 'activation.json.tmp.act_deadbeef12345678');
    const staleTmp2 = path.join(installDir, 'activation.json.tmp.act_0000111122223333');
    fs.writeFileSync(staleTmp1, '{"partial": true}');
    fs.writeFileSync(staleTmp2, '{"corrupt": true}');

    // Run fgctl init
    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(res.status, 0, `Init must succeed: ${res.stderr}`);

    // Stale tmp files must be cleaned up
    assert.ok(!fs.existsSync(staleTmp1), 'Stale tmp file 1 must be removed');
    assert.ok(!fs.existsSync(staleTmp2), 'Stale tmp file 2 must be removed');

    // Real activation.json must exist
    assert.ok(fs.existsSync(path.join(installDir, 'activation.json')), 'activation.json must exist');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 1 (HIGH): activation.lock orphaned by a killed process (dead pid) is reclaimed, not held forever', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lockreclaim-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lockreclaim-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lockreclaim-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Obtain a definitely-dead pid: spawn a short-lived child and wait for exit.
    const deadPidRes = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
    const deadPid = deadPidRes.pid;
    assert.ok(deadPid > 0, 'must have captured a real (now-dead) pid');

    // Simulate an activation.lock + activation.json.tmp.* left behind by a
    // process that was SIGKILLed between lock-acquire and rename -- Drop
    // never runs on SIGKILL, so both files are real, not hypothetical
    // (reproduces the reviewer's real strace-injected repro).
    const installDir = path.join(tempProj, '.fgos', 'installation');
    fs.mkdirSync(installDir, { recursive: true });
    const lockPath = path.join(installDir, 'activation.lock');
    fs.writeFileSync(lockPath, JSON.stringify({ pid: deadPid, ts: Date.now() }));
    const staleTmp = path.join(installDir, 'activation.json.tmp.act_deadbeef12345678');
    fs.writeFileSync(staleTmp, '{"partial": true}');

    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(res.status, 0, `Init must reclaim the orphaned lock and succeed: ${res.stderr}`);
    assert.ok(!fs.existsSync(staleTmp), 'Orphaned tmp file must be cleaned up');
    assert.ok(fs.existsSync(path.join(installDir, 'activation.json')), 'activation.json must be published');
    assert.ok(!fs.existsSync(lockPath), 'activation.lock must be released after this init completes');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('Item 1: A live-pid, within-ttl activation.lock is genuinely held, not reclaimed', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lockheld-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lockheld-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lockheld-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const installDir = path.join(tempProj, '.fgos', 'installation');
    fs.mkdirSync(installDir, { recursive: true });
    const lockPath = path.join(installDir, 'activation.lock');
    // This test process's own pid, fresh timestamp -- genuinely alive and within TTL.
    fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, ts: Date.now() }));

    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.notEqual(res.status, 0, 'Init must refuse while the lock is genuinely live');
    assert.match(res.stderr, /activation-lock-held/);
    assert.ok(fs.existsSync(lockPath), 'A genuinely held lock must not be removed by a refused init');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('P7: Candidate preflight failure refuses init before publishing activation and writes no host-visible projections or activation.json', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-preflight-fail-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-preflight-fail-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-preflight-fail-proj-'));
  const badPreflightDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-bad-preflight-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Copy fixture release into badPreflightDir
    fs.cpSync(fixtureReleaseDir, badPreflightDir, { recursive: true });

    // In manifest.json, declare node requirement that cannot be satisfied
    const manifestPath = path.join(badPreflightDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.requires = { node: '>=999.0.0' };
    delete manifest.artifactDigest;
    const newDigest = computeArtifactDigest(manifest);
    manifest.artifactDigest = newDigest;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    const res = runFgctl(['init', '--from', badPreflightDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.notEqual(res.status, 0, 'Init must be refused on preflight failure');
    assert.match(res.stderr, /preflight failed/i);
    assert.match(res.stderr, /runtime-dependency-missing/);

    // Host-visible projections and activation records must NOT be written
    const activationPath = path.join(tempProj, '.fgos', 'installation', 'activation.json');
    assert.ok(!fs.existsSync(activationPath), 'activation.json must not exist');
    const shimFgos = path.join(tempProj, '.fgos', 'installation', 'bin', 'fgos');
    assert.ok(!fs.existsSync(shimFgos), 'bin/fgos shim must not exist');
    const agentsMd = path.join(tempProj, 'AGENTS.md');
    assert.ok(!fs.existsSync(agentsMd), 'AGENTS.md must not be created by preflight');
    const claudeDir = path.join(tempProj, '.claude');
    assert.ok(!fs.existsSync(claudeDir), '.claude must not be created by preflight');
    const distPin = path.join(tempProj, '.fgos', 'distribution.json');
    assert.ok(!fs.existsSync(distPin), 'distribution.json must not be created on preflight failure');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
    fs.rmSync(badPreflightDir, { recursive: true, force: true });
  }
});

test('P7 (red-team HIGH): a hostile candidate that passes every static preflight check is never executed before publish and cannot write outside its release tree', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-hostile-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-hostile-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-hostile-proj-'));
  const hostileReleaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-hostile-rel-'));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-hostile-outside-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // A "successful" hostile candidate: every digest in its manifest is
    // consistent, so stage/verify/preflight all accept it, and its bin/fgos
    // exits 0 while printing a plausible `version --runtime-json` envelope
    // -- exactly what a runtime smoke would have called a pass. It also
    // writes a sentinel OUTSIDE the release tree and a host-visible file
    // into whatever cwd it is run from.
    fs.cpSync(fixtureReleaseDir, hostileReleaseDir, { recursive: true });
    const sentinel = path.join(outsideDir, 'pwned');
    const hostileBin = path.join(hostileReleaseDir, 'bin', 'fgos');
    fs.writeFileSync(
      hostileBin,
      [
        '#!/bin/sh',
        `printf executed > "${sentinel}"`,
        'printf executed > "$PWD/AGENTS.md"',
        `printf '{"contract":"fgos.v1","data":{"host":"rust","artifactDigest":"%s"}}\\n' "\${FGOS_CANDIDATE_ARTIFACT_DIGEST:-none}"`,
        'exit 0',
        '',
      ].join('\n'),
      { mode: 0o755 }
    );
    fs.chmodSync(hostileBin, 0o755);

    const manifestPath = path.join(hostileReleaseDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const f of manifest.files) {
      if (f.path === 'bin/fgos') {
        f.digest = hashFile(hostileBin);
      }
    }
    delete manifest.artifactDigest;
    manifest.artifactDigest = computeArtifactDigest(manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    // Control: the hostile entry really does write its sentinel when run,
    // so a missing sentinel below proves fgctl never ran it -- not that the
    // script is broken.
    const control = spawnSync(hostileBin, ['version', '--runtime-json'], {
      cwd: hostileReleaseDir,
      encoding: 'utf8',
    });
    assert.equal(control.status, 0, `hostile control run must exit 0: ${control.stderr}`);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'executed');
    fs.unlinkSync(sentinel);
    fs.unlinkSync(path.join(hostileReleaseDir, 'AGENTS.md'));

    // Hold the activation lock live so init stops AFTER preflight has
    // accepted the candidate and BEFORE publish -- the exact window where
    // preflight used to run <candidate>/bin/fgos. Nothing else in that
    // window may execute candidate code.
    const installDir = path.join(tempProj, '.fgos', 'installation');
    fs.mkdirSync(installDir, { recursive: true });
    fs.writeFileSync(path.join(installDir, 'activation.lock'), JSON.stringify({ pid: process.pid, ts: Date.now() }));

    const res = runFgctl(['init', '--from', hostileReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.notEqual(res.status, 0, 'init must stop at the held activation lock');
    assert.match(res.stderr, /activation-lock-held/, 'control must have reached lock acquisition, i.e. past preflight');
    assert.doesNotMatch(res.stderr, /preflight failed/i, 'the hostile candidate is statically well-formed and must pass preflight');

    // The candidate was staged (its tree is a valid release) ...
    assert.ok(fs.existsSync(path.join(tempState, 'releases', manifest.artifactDigest, 'manifest.json')));
    // ... but never executed: no sentinel outside the release tree, no
    // host-visible file in the candidate dir, the staged copy, or the project.
    assert.ok(!fs.existsSync(sentinel), 'preflight executed candidate bin/fgos (sentinel written outside release tree)');
    assert.ok(!fs.existsSync(path.join(hostileReleaseDir, 'AGENTS.md')), 'candidate wrote into its own source tree');
    assert.ok(!fs.existsSync(path.join(tempState, 'releases', manifest.artifactDigest, 'AGENTS.md')), 'candidate wrote into the staged release');
    assert.ok(!fs.existsSync(path.join(tempProj, 'AGENTS.md')), 'candidate wrote into the project');
    assert.ok(!fs.existsSync(path.join(installDir, 'activation.json')), 'no activation may be published');
    assert.ok(!fs.existsSync(path.join(tempProj, '.fgos', 'distribution.json')), 'no pin may be written');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
    fs.rmSync(hostileReleaseDir, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
});

test('P7: Atomic activation publish ensures valid activation.json without partial tmp artifacts', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-atomic-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-atomic-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-atomic-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    const installDir = path.join(tempProj, '.fgos', 'installation');
    fs.mkdirSync(installDir, { recursive: true });
    // Pre-seed an orphaned .tmp file left behind by a previous interrupted process
    const orphanedTmp = path.join(installDir, 'activation.json.tmp.orphaned999');
    fs.writeFileSync(orphanedTmp, '{"status": "partial-junk"}');

    const res = runFgctl(['init', '--from', fixtureReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });

    assert.equal(res.status, 0, `Init must succeed: ${res.stderr}`);

    // Orphaned tmp file must be cleaned up
    assert.ok(!fs.existsSync(orphanedTmp), 'Stale tmp files must be cleaned up');

    // activation.json must exist and be fully parseable
    const activationPath = path.join(installDir, 'activation.json');
    assert.ok(fs.existsSync(activationPath), 'activation.json must exist');
    const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(activation.status, 'ready');
    assert.equal(activation.schemaVersion, 1);
    assert.equal(activation.artifactDigest, fixtureDigest);

    // No tmp files remaining
    const remaining = fs.readdirSync(installDir);
    assert.ok(!remaining.some((f) => f.startsWith('activation.json.tmp.')), 'No tmp files should remain');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('P7: Local runtime tail failure leaves workspace in diagnosable state with ready-degraded transaction record', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tailfail-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tailfail-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tailfail-proj-'));
  const tailFailReleaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tailfail-rel-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // Copy fixture release into tailFailReleaseDir
    fs.cpSync(fixtureReleaseDir, tailFailReleaseDir, { recursive: true });

    // Modify legacy node payload to fail on doctor when SIMULATE_TAIL_FAILURE is set
    const fgosMjsPath = path.join(tailFailReleaseDir, 'libexec', 'legacy-node', 'bin', 'fgos.mjs');
    const originalContent = fs.readFileSync(fgosMjsPath, 'utf8');
    const firstLineEnd = originalContent.indexOf('\n');
    const shebang = originalContent.slice(0, firstLineEnd + 1);
    const rest = originalContent.slice(firstLineEnd + 1);
    const failInjection = `if (process.env.SIMULATE_TAIL_FAILURE === '1' && process.argv.includes('doctor')) {\n  console.error('simulated doctor failure in tail');\n  process.exit(42);\n}\n`;
    fs.writeFileSync(fgosMjsPath, shebang + failInjection + rest);

    // Update manifest.json with updated hash for bin/fgos.mjs and legacyNode component
    const manifestPath = path.join(tailFailReleaseDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const newMjsHash = hashFile(fgosMjsPath);
    const newMjsSize = fs.statSync(fgosMjsPath).size;

    for (const f of manifest.files) {
      if (f.path === 'libexec/legacy-node/bin/fgos.mjs') {
        f.digest = newMjsHash;
        f.size = newMjsSize;
      }
    }
    manifest.components.legacyNode.digest = newMjsHash;
    delete manifest.artifactDigest;
    const newDigest = computeArtifactDigest(manifest);
    manifest.artifactDigest = newDigest;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    const res = runFgctl(['init', '--from', tailFailReleaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome, SIMULATE_TAIL_FAILURE: '1' },
    });

    assert.notEqual(res.status, 0, 'fgctl init must fail when tail command fails');
    assert.match(res.stderr, /tail command 'doctor.*failed with status 42/);

    // 1. activation.json was published before tail and has status ready
    const activationPath = path.join(tempProj, '.fgos', 'installation', 'activation.json');
    assert.ok(fs.existsSync(activationPath), 'activation.json must be published before tail');
    const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
    assert.equal(activation.status, 'ready');
    assert.equal(activation.artifactDigest, newDigest);

    // 2. Install transaction record exists in release store and is marked ready-degraded
    const txPath = path.join(tempState, 'installs', `${activation.activationId}.json`);
    assert.ok(fs.existsSync(txPath), `Transaction record must exist at ${txPath}`);
    const txRecord = JSON.parse(fs.readFileSync(txPath, 'utf8'));
    assert.equal(txRecord.status, 'ready-degraded');
    const statuses = txRecord.history.map((h) => h.status);
    assert.ok(statuses.includes('ready-published'));
    assert.ok(statuses.includes('ready-degraded'));

    // 3. Workspace is left in diagnosable state: version --runtime-json works through shim
    const shimFgos = path.join(tempProj, '.fgos', 'installation', 'bin', 'fgos');
    const versionRes = spawnSync(shimFgos, ['version', '--runtime-json'], {
      cwd: tempProj,
      env: { ...process.env, FGOS_STATE_HOME: tempState, HOME: tempHome },
      encoding: 'utf8',
    });
    assert.equal(versionRes.status, 0, `version --runtime-json must work: ${versionRes.stderr}`);
    const versionData = JSON.parse(versionRes.stdout.trim());
    assert.equal(versionData.data.host, 'rust');
    assert.equal(versionData.data.artifactDigest, newDigest);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
    fs.rmSync(tailFailReleaseDir, { recursive: true, force: true });
  }
});

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
