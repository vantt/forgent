import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn, execFileSync } from 'node:child_process';
import { DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';
import { useReleaseFixture, releaseDirName, fixture, runFgctl } from './fgctl-init-fixture.mjs';

useReleaseFixture();

test('Item 3: Idempotent re-run skips stage_release entirely (does not contend for install.lock)', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-m2-proj-'));

  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });

    // 1. Initial init
    const initRes = runFgctl(['init', '--from', fixture.releaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome },
    });
    assert.equal(initRes.status, 0);

    // 2. Intentionally block the release store's install.lock
    const installLockPath = path.join(tempState, 'install.lock');
    fs.writeFileSync(installLockPath, 'artificially locked store');

    // 3. Re-run init at the same digest: must skip stage_release and succeed without failing on install.lock!
    const rerunRes = runFgctl(['init', '--from', fixture.releaseDir], {
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
    const res = runFgctl(['init', '--from', fixture.releaseDir], {
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
    const stageRes = runFgctl(['stage', '--from', fixture.releaseDir], { stateHome: tempState });
    assert.equal(stageRes.status, 0);

    // Tamper with manifest in staged release dir
    const stagedManifestPath = path.join(tempState, 'releases', releaseDirName(fixture.digest), 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(stagedManifestPath, 'utf8'));
    manifest.artifactDigest = 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    fs.writeFileSync(stagedManifestPath, JSON.stringify(manifest, null, 2));

    // Pin workspace to fixture.digest (no --from provided)
    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const distPin = {
      schemaVersion: 1,
      projectRuntime: {
        policy: 'exact-digest',
        artifactDigest: fixture.digest,
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
    // releases/<fixture.digest>/manifest.json declares a different digest --
    // stage_release's own NoOp path (dir already exists) never re-verifies,
    // so only init's own post-match digest assertion can catch this.
    const stageRes = runFgctl(['stage', '--from', fixture.releaseDir], { stateHome: tempState });
    assert.equal(stageRes.status, 0);
    const stagedManifestPath = path.join(tempState, 'releases', releaseDirName(fixture.digest), 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(stagedManifestPath, 'utf8'));
    manifest.artifactDigest = 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    fs.writeFileSync(stagedManifestPath, JSON.stringify(manifest, null, 2));

    const fgosDir = path.join(tempProj, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const distPin = {
      schemaVersion: 1,
      projectRuntime: {
        policy: 'exact-digest',
        artifactDigest: fixture.digest,
        releaseVersion: '0.1.0',
        channel: null,
        allowPrerelease: false,
      },
    };
    fs.writeFileSync(path.join(fgosDir, 'distribution.json'), JSON.stringify(distPin, null, 2));

    // Pin + matching --from source (resolves to fixture.digest, matches the
    // pin) -> stage_release takes the NoOp path since releases/<digest>/
    // already exists -- the tampered on-disk manifest must still be caught.
    const res = runFgctl(['init', '--from', fixture.releaseDir], {
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
    const res = runFgctl(['init', '--from', fixture.releaseDir], {
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

    const res = runFgctl(['init', '--from', fixture.releaseDir], {
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

    const res = runFgctl(['init', '--from', fixture.releaseDir], {
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

