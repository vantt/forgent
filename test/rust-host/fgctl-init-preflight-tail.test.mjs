import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { computeArtifactDigest, hashFile } from '../../scripts/build-rust-distribution.mjs';
import { holdLock } from './fgctl-lock-holder.mjs';
import { useReleaseFixture, releaseDirName, fixture, runFgctl, runShim, pathWithGcLeakingGit, processesUnder } from './fgctl-init-fixture.mjs';

useReleaseFixture();

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
    fs.cpSync(fixture.releaseDir, badPreflightDir, { recursive: true });

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

test('P7 (red-team HIGH): a hostile candidate that passes every static preflight check is never executed before publish and cannot write outside its release tree', async () => {
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
    fs.cpSync(fixture.releaseDir, hostileReleaseDir, { recursive: true });
    const sentinel = path.join(outsideDir, 'pwned');
    const sentinelPosix = sentinel.replaceAll('\\', '/');
    const hostileBin = path.join(hostileReleaseDir, 'bin', 'fgos');
    fs.writeFileSync(
      hostileBin,
      [
        '#!/bin/sh',
        `printf executed > "${sentinelPosix}"`,
        'printf executed > "$PWD/AGENTS.md"',
        `printf '{"contract":"fgos.v1","data":{"host":"rust","artifactDigest":"%s"}}\\n' "\${FGOS_CANDIDATE_ARTIFACT_DIGEST:-none}"`,
        'exit 0',
        '',
      ].join('\n'),
      { mode: 0o755 }
    );
    fs.chmodSync(hostileBin, 0o755);
    if (process.platform === 'win32') {
      fs.copyFileSync(hostileBin, path.join(hostileReleaseDir, 'bin', 'fgos.exe'));
    }

    const manifestPath = path.join(hostileReleaseDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const f of manifest.files) {
      if (f.path === 'bin/fgos' || f.path === 'bin/fgos.exe') {
        f.digest = hashFile(hostileBin);
      }
    }
    delete manifest.artifactDigest;
    manifest.artifactDigest = computeArtifactDigest(manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    // Control: the hostile entry really does write its sentinel when run,
    // so a missing sentinel below proves fgctl never ran it -- not that the
    // script is broken.
    const control = process.platform === 'win32'
      ? spawnSync('sh', [hostileBin, 'version', '--runtime-json'], {
          cwd: hostileReleaseDir,
          encoding: 'utf8',
        })
      : spawnSync(hostileBin, ['version', '--runtime-json'], {
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
    const holder = await holdLock('activation', { fgosDir: path.join(tempProj, '.fgos') });
    let res;
    try {
      res = runFgctl(['init', '--from', hostileReleaseDir], {
        cwd: tempProj,
        stateHome: tempState,
        env: { HOME: tempHome },
      });
    } finally {
      await holder.kill();
    }

    assert.notEqual(res.status, 0, 'init must stop at the held activation lock');
    assert.match(res.stderr, /activation-lock-held/, 'control must have reached lock acquisition, i.e. past preflight');
    assert.doesNotMatch(res.stderr, /preflight failed/i, 'the hostile candidate is statically well-formed and must pass preflight');

    // The candidate was staged (its tree is a valid release) ...
    assert.ok(fs.existsSync(path.join(tempState, 'releases', releaseDirName(manifest.artifactDigest), 'manifest.json')));
    // ... but never executed: no sentinel outside the release tree, no
    // host-visible file in the candidate dir, the staged copy, or the project.
    assert.ok(!fs.existsSync(sentinel), 'preflight executed candidate bin/fgos (sentinel written outside release tree)');
    assert.ok(!fs.existsSync(path.join(hostileReleaseDir, 'AGENTS.md')), 'candidate wrote into its own source tree');
    assert.ok(!fs.existsSync(path.join(tempState, 'releases', releaseDirName(manifest.artifactDigest), 'AGENTS.md')), 'candidate wrote into the staged release');
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

    const res = runFgctl(['init', '--from', fixture.releaseDir], {
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
    assert.equal(activation.artifactDigest, fixture.digest);

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
    fs.cpSync(fixture.releaseDir, tailFailReleaseDir, { recursive: true });

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
    const versionRes = runShim(shimFgos, ['version', '--runtime-json'], {
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


test('holder-lock gate: a git that leaves a background gc while it borrows a lock passes init, and the escaped gc is ended with nothing left holding a lock', { skip: process.platform === 'win32' && 'no holder-lock driver on Windows' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lock-gate-gc-'));
  const tempHome = path.join(root, 'home');
  const tempState = path.join(root, 'state');
  const tempProj = path.join(root, 'proj');
  // The borrow vectors build their throwaway repository under TMPDIR: pin it so the escaped gc can be looked for.
  const tempTmp = path.join(root, 'tmp');
  try {
    for (const dir of [tempHome, tempState, tempProj, tempTmp]) fs.mkdirSync(dir, { mode: 0o700 });
    execFileSync('git', ['init'], { cwd: tempProj });

    const res = runFgctl(['init', '--from', fixture.releaseDir], {
      cwd: tempProj,
      stateHome: tempState,
      env: { HOME: tempHome, TMPDIR: tempTmp, PATH: pathWithGcLeakingGit(root) },
    });

    // The refined description rule: an escaped holder of a borrowed description is killed, drained and verified.
    assert.equal(res.status, 0, `init must pass the gate: ${res.stderr}`);
    assert.doesNotMatch(res.stderr, /lock-(kernel-semantics|borrow-vectors)-failed/);
    assert.ok(fs.existsSync(path.join(tempProj, '.fgos', 'installation', 'activation.json')), 'activation.json written');
    const left = processesUnder([path.join(tempTmp, 'fgos-borrow-vectors-'), path.join(tempProj, '.fgos', 'locks'), path.join(tempState, 'locks')]);
    if (left !== null) assert.deepEqual(left, [], 'the escaped gc is gone and no process holds a lock file');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('holder-lock gate: init with the real git passes the gate and checks both lock directories', { skip: process.platform === 'win32' && 'no holder-lock driver on Windows' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-lock-gate-green-'));
  const tempHome = path.join(root, 'home');
  const tempState = path.join(root, 'state');
  const tempProj = path.join(root, 'proj');
  try {
    for (const dir of [tempHome, tempState, tempProj]) fs.mkdirSync(dir, { mode: 0o700 });
    execFileSync('git', ['init'], { cwd: tempProj });

    const res = runFgctl(['init', '--from', fixture.releaseDir], { cwd: tempProj, stateHome: tempState, env: { HOME: tempHome } });

    assert.equal(res.status, 0, `init must pass the gate: ${res.stderr}`);
    assert.doesNotMatch(res.stderr, /lock-(kernel-semantics|borrow-vectors)-failed/);
    assert.ok(fs.statSync(path.join(tempProj, '.fgos', 'locks')).isDirectory(), 'workspace lock directory probed');
    assert.ok(fs.statSync(path.join(tempState, 'locks')).isDirectory(), 'lock root probed');
    assert.deepEqual(fs.readdirSync(path.join(tempState, 'locks')).filter((f) => f.startsWith('.semantics-probe-')), [], 'probe files removed');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
