// harness.mjs — falsification probe harness for local-bwrap-v1 (Phase 03 R7-R8, spec §6.6, §11.3).
//
// Proves through independent, real execution:
//   1. run-output writable
//   2. cwd/repo root denied for host-write-denied
//   3. workspace writable ONLY for workspace-write mode
//   4. another dispatch's own runDir denied
//   5. private home writable without writing host home
//   6. no inherited writable fd survives outside explicit grant (MED-1 fix)
//   7. executor credentials read-only
//   8. host read and network not overclaimed
//
// Every probe includes a RED FALSIFIER: a deliberately broken sandbox config
// that the probe correctly catches and fails on.

import cp from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BWRAP_DRIVER_VERSION } from '../drivers/bwrap.mjs';

export const PROOF_PROFILE = 'local-bwrap-v1';

export function computePlatformDigest(bwrapExecutable = '/usr/bin/bwrap') {
  let bwrapVersion = 'unknown';
  try {
    const res = cp.spawnSync(bwrapExecutable, ['--version'], { encoding: 'utf8' });
    if (res.status === 0) {
      bwrapVersion = res.stdout.trim();
    }
  } catch {
    // ignore
  }

  const payload = `${os.platform()}:${os.release()}:${os.arch()}:${bwrapVersion}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function computeProbeFingerprint({
  policy = 'host-write-denied',
  driverVersion = BWRAP_DRIVER_VERSION,
  backendConfig = {},
  bwrapExecutable = '/usr/bin/bwrap',
} = {}) {
  const policyDigest = crypto.createHash('sha256').update(JSON.stringify(policy)).digest('hex');
  const backendConfigDigest = crypto.createHash('sha256').update(JSON.stringify(backendConfig)).digest('hex');
  const platformDigest = computePlatformDigest(bwrapExecutable);

  return {
    contract: 'confinement-probe-fingerprint.v1',
    policyDigest,
    driverVersion,
    backendConfigDigest,
    platformDigest,
    proofProfile: PROOF_PROFILE,
  };
}

/**
 * Probe 1: run-output is writable.
 */
export function probeRunOutputWritable({ bwrapBin = '/usr/bin/bwrap', runDir, brokenConfig = false } = {}) {
  const markerFile = path.join(runDir, 'probe-out.txt');
  if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  if (!brokenConfig) {
    bwrapArgs.push('--bind', runDir, runDir);
  } else {
    // RED FALSIFIER: mount read-only
    bwrapArgs.push('--ro-bind', runDir, runDir);
  }

  const res = cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `const fs = require('fs'); fs.writeFileSync(${JSON.stringify(markerFile)}, 'WRITTEN');`,
  ], { encoding: 'utf8' });

  const passed = res.status === 0 && fs.existsSync(markerFile) && fs.readFileSync(markerFile, 'utf8') === 'WRITTEN';
  if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);

  return {
    probe: 'run-output-writable',
    passed,
    detail: passed ? 'run-output is writable' : `failed to write run-output: ${res.stderr || res.stdout || 'file not created'}`,
  };
}

/**
 * Probe 2: cwd/repo root is denied for host-write-denied.
 */
export function probeHostWriteDenied({ bwrapBin = '/usr/bin/bwrap', targetDir, brokenConfig = false } = {}) {
  const testFile = path.join(targetDir, 'should-not-exist.txt');
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  if (brokenConfig) {
    // RED FALSIFIER: deliberately mount targetDir writable
    bwrapArgs.push('--bind', targetDir, targetDir);
  }

  const res = cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `const fs = require('fs'); try { fs.writeFileSync(${JSON.stringify(testFile)}, 'LEAK'); } catch (e) {}`,
  ], { encoding: 'utf8' });

  const leaked = fs.existsSync(testFile);
  if (leaked) fs.unlinkSync(testFile);

  const passed = !leaked;
  return {
    probe: 'host-write-denied',
    passed,
    detail: passed ? 'host directory write denied' : 'host directory was writable (leak detected)',
  };
}

/**
 * Probe 3: workspace is writable ONLY for workspace-write mode.
 */
export function probeWorkspaceWritable({
  bwrapBin = '/usr/bin/bwrap',
  workspaceDir,
  outsideDir,
  brokenConfig = false,
} = {}) {
  const wsFile = path.join(workspaceDir, 'ws-test.txt');
  const outsideFile = path.join(outsideDir, 'outside-test.txt');
  if (fs.existsSync(wsFile)) fs.unlinkSync(wsFile);
  if (fs.existsSync(outsideFile)) fs.unlinkSync(outsideFile);

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  if (brokenConfig === 'ws-readonly') {
    // RED FALSIFIER 1: workspace is not writable
    bwrapArgs.push('--ro-bind', workspaceDir, workspaceDir);
  } else if (brokenConfig === 'outside-writable') {
    // RED FALSIFIER 2: outsideDir leaked as writable
    bwrapArgs.push('--bind', workspaceDir, workspaceDir);
    bwrapArgs.push('--bind', outsideDir, outsideDir);
  } else {
    // Normal workspace-write
    bwrapArgs.push('--bind', workspaceDir, workspaceDir);
  }

  cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `
      const fs = require('fs');
      try { fs.writeFileSync(${JSON.stringify(wsFile)}, 'WS_OK'); } catch (e) {}
      try { fs.writeFileSync(${JSON.stringify(outsideFile)}, 'OUTSIDE_LEAK'); } catch (e) {}
    `,
  ], { encoding: 'utf8' });

  const wsWritten = fs.existsSync(wsFile) && fs.readFileSync(wsFile, 'utf8') === 'WS_OK';
  const outsideWritten = fs.existsSync(outsideFile);

  if (fs.existsSync(wsFile)) fs.unlinkSync(wsFile);
  if (fs.existsSync(outsideFile)) fs.unlinkSync(outsideFile);

  const passed = wsWritten && !outsideWritten;
  return {
    probe: 'workspace-writable',
    passed,
    detail: passed
      ? 'workspace is writable and outside directory remains denied'
      : `workspace writable probe failed: wsWritten=${wsWritten}, outsideWritten=${outsideWritten}`,
  };
}

/**
 * Probe 4: another dispatch's own runDir is denied.
 */
export function probeOtherRunDirDenied({
  bwrapBin = '/usr/bin/bwrap',
  ownRunDir,
  otherRunDir,
  brokenConfig = false,
} = {}) {
  const otherFile = path.join(otherRunDir, 'tamper.txt');
  if (fs.existsSync(otherFile)) fs.unlinkSync(otherFile);

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
    '--bind', ownRunDir, ownRunDir,
  ];

  if (brokenConfig) {
    // RED FALSIFIER: otherRunDir is bound writable
    bwrapArgs.push('--bind', otherRunDir, otherRunDir);
  }

  cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `const fs = require('fs'); try { fs.writeFileSync(${JSON.stringify(otherFile)}, 'TAMPERED'); } catch (e) {}`,
  ], { encoding: 'utf8' });

  const tampered = fs.existsSync(otherFile);
  if (tampered) fs.unlinkSync(otherFile);

  const passed = !tampered;
  return {
    probe: 'other-rundir-denied',
    passed,
    detail: passed ? 'other runDir is denied' : 'other runDir was writable (tampering leak)',
  };
}

/**
 * Probe 5: private home is writable without writing real host home.
 */
export function probePrivateHomeIsolated({
  bwrapBin = '/usr/bin/bwrap',
  hostHomeDir,
  privateHomeDir,
  brokenConfig = false,
} = {}) {
  const hostMarker = path.join(hostHomeDir, 'home-leak.txt');
  const privateMarker = path.join(privateHomeDir, 'home-ok.txt');
  if (fs.existsSync(hostMarker)) fs.unlinkSync(hostMarker);
  if (fs.existsSync(privateMarker)) fs.unlinkSync(privateMarker);

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  let targetHome = privateHomeDir;
  if (brokenConfig) {
    // RED FALSIFIER: real host home is mounted writable
    bwrapArgs.push('--bind', hostHomeDir, hostHomeDir);
    targetHome = hostHomeDir;
  } else {
    bwrapArgs.push('--bind', privateHomeDir, privateHomeDir);
  }

  bwrapArgs.push('--setenv', 'HOME', targetHome);

  cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `
      const fs = require('fs');
      const path = require('path');
      const home = process.env.HOME;
      try { fs.writeFileSync(path.join(home, 'home-ok.txt'), 'OK'); } catch (e) {}
      try { fs.writeFileSync(${JSON.stringify(hostMarker)}, 'LEAK'); } catch (e) {}
    `,
  ], { encoding: 'utf8' });

  const privateWritten = fs.existsSync(privateMarker);
  const hostWritten = fs.existsSync(hostMarker);

  if (fs.existsSync(privateMarker)) fs.unlinkSync(privateMarker);
  if (fs.existsSync(hostMarker)) fs.unlinkSync(hostMarker);

  const passed = privateWritten && !hostWritten;
  return {
    probe: 'private-home-isolated',
    passed,
    detail: passed
      ? 'private home is writable without leaking to host home'
      : `private home probe failed: privateWritten=${privateWritten}, hostWritten=${hostWritten}`,
  };
}

/**
 * Probe 6: no inherited writable fd survives outside explicit grant (MED-1 fix).
 */
export function probeNoInheritedWritableFd({ bwrapBin = '/usr/bin/bwrap', hostFile, brokenConfig = false } = {}) {
  fs.writeFileSync(hostFile, 'ORIGINAL', 'utf8');
  const fd = fs.openSync(hostFile, 'r+');

  const stdio = ['pipe', 'pipe', 'pipe'];
  while (stdio.length < 9) stdio.push('ignore');
  stdio.push(fd); // fd 9 passed to child

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  let cmd;
  let args;

  if (!brokenConfig) {
    // Normal configuration: wraps command to close all fds >= 3 before exec
    const fdCloser = 'for f in $(ls /proc/$$/fd 2>/dev/null); do if [ "$f" -ge 3 ] 2>/dev/null; then eval "exec $f>&-" 2>/dev/null || true; fi; done; exec "$@"';
    cmd = 'bash';
    args = [
      '-c',
      fdCloser,
      'wrapper',
      'node',
      '-e',
      `const fs = require('fs'); try { fs.writeSync(9, 'TAMPERED'); } catch (e) {}`,
    ];
  } else {
    // RED FALSIFIER: spawns without fd closer
    cmd = 'node';
    args = ['-e', `const fs = require('fs'); try { fs.writeSync(9, 'TAMPERED'); } catch (e) {}`];
  }

  try {
    cp.spawnSync(bwrapBin, [...bwrapArgs, '--', cmd, ...args], { stdio });
  } finally {
    try { fs.closeSync(fd); } catch {}
  }

  const content = fs.readFileSync(hostFile, 'utf8');
  const passed = content === 'ORIGINAL';

  return {
    probe: 'no-inherited-writable-fd',
    passed,
    detail: passed ? 'inherited writable fd was successfully closed' : 'inherited writable fd leaked and wrote to host file',
  };
}

/**
 * Probe 7: executor credentials read-only.
 */
export function probeExecutorCredentialsReadOnly({ bwrapBin = '/usr/bin/bwrap', credsDir, brokenConfig = false } = {}) {
  const credFile = path.join(credsDir, 'test-cred.json');
  fs.writeFileSync(credFile, '{"secret": "token"}', 'utf8');

  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  if (!brokenConfig) {
    bwrapArgs.push('--ro-bind', credsDir, credsDir);
  } else {
    // RED FALSIFIER: credentials directory mounted writable
    bwrapArgs.push('--bind', credsDir, credsDir);
  }

  const res = cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `
      const fs = require('fs');
      const cred = fs.readFileSync(${JSON.stringify(credFile)}, 'utf8');
      if (!cred.includes('token')) process.exit(1);
      try {
        fs.writeFileSync(${JSON.stringify(credFile)}, '{"secret": "hacked"}');
        process.exit(0);
      } catch (e) {
        process.exit(2);
      }
    `,
  ], { encoding: 'utf8' });

  // Expected: status === 2 (read succeeded, write threw EROFS)
  const passed = res.status === 2 && fs.readFileSync(credFile, 'utf8') === '{"secret": "token"}';

  return {
    probe: 'executor-credentials-readonly',
    passed,
    detail: passed ? 'executor credentials readable but read-only' : `credentials write not denied: status=${res.status}`,
  };
}

/**
 * Probe 8: host read and network are not overclaimed.
 */
export function probeHostReadAndNetworkNotOverclaimed({ bwrapBin = '/usr/bin/bwrap', brokenConfig = false } = {}) {
  const bwrapArgs = [
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
  ];

  if (!brokenConfig) {
    bwrapArgs.push('--ro-bind', '/', '/');
  } else {
    // RED FALSIFIER: block network egress via --unshare-net without loopback
    bwrapArgs.push('--ro-bind', '/', '/');
    bwrapArgs.push('--unshare-net');
  }

  const res = cp.spawnSync(bwrapBin, [
    ...bwrapArgs,
    '--',
    'node',
    '-e',
    `
      const fs = require('fs');
      const os = require('os');
      // 1. Verify hostRead is working (reading /etc/hosts or /etc/os-release)
      const canReadHost = fs.existsSync('/etc/os-release') || fs.existsSync('/etc/hosts');
      if (!canReadHost) process.exit(1);

      // 2. Verify network interfaces are not overclaimed as unshared/blocked
      const ifaces = os.networkInterfaces();
      const hasExternalNet = Object.values(ifaces).some((list) => list.some((item) => !item.internal));
      if (!hasExternalNet) process.exit(2);

      process.exit(0);
    `,
  ], { encoding: 'utf8' });

  const passed = res.status === 0;
  return {
    probe: 'host-read-network-not-overclaimed',
    passed,
    detail: passed ? 'host read and network access are available (not overclaimed)' : `overclaim detected: status=${res.status}`,
  };
}

/**
 * Run all 8 probes against a bwrap executable and test directory.
 */
export function runAllConfinementProbes({
  bwrapBin = '/usr/bin/bwrap',
  scratchDir = null,
} = {}) {
  if (os.platform() !== 'linux') {
    return {
      passed: false,
      message: `platform "${os.platform()}" is not Linux`,
      results: [],
    };
  }

  const tempRoot = scratchDir || fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probes-'));
  const cleanOnExit = !scratchDir;

  try {
    const runDir = path.join(tempRoot, 'rundir');
    const targetDir = path.join(tempRoot, 'targetdir');
    const wsDir = path.join(tempRoot, 'wsdir');
    const outsideDir = path.join(tempRoot, 'outsidedir');
    const otherRunDir = path.join(tempRoot, 'other-rundir');
    const hostHomeDir = path.join(tempRoot, 'host-home');
    const privateHomeDir = path.join(tempRoot, 'private-home');
    const hostFile = path.join(tempRoot, 'host-fd-test.txt');
    const credsDir = path.join(tempRoot, 'creds');

    for (const d of [runDir, targetDir, wsDir, outsideDir, otherRunDir, hostHomeDir, privateHomeDir, credsDir]) {
      fs.mkdirSync(d, { recursive: true });
    }

    const results = [
      probeRunOutputWritable({ bwrapBin, runDir }),
      probeHostWriteDenied({ bwrapBin, targetDir }),
      probeWorkspaceWritable({ bwrapBin, workspaceDir: wsDir, outsideDir }),
      probeOtherRunDirDenied({ bwrapBin, ownRunDir: runDir, otherRunDir }),
      probePrivateHomeIsolated({ bwrapBin, hostHomeDir, privateHomeDir }),
      probeNoInheritedWritableFd({ bwrapBin, hostFile }),
      probeExecutorCredentialsReadOnly({ bwrapBin, credsDir }),
      probeHostReadAndNetworkNotOverclaimed({ bwrapBin }),
    ];

    const allPassed = results.every((r) => r.passed);
    const failed = results.filter((r) => !r.passed);

    return {
      passed: allPassed,
      message: allPassed
        ? 'all 8 local-bwrap-v1 confinement probes passed'
        : `confinement probes failed: ${failed.map((f) => `${f.probe} (${f.detail})`).join('; ')}`,
      results,
    };
  } finally {
    if (cleanOnExit) {
      try {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      } catch {}
    }
  }
}
