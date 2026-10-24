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
//   9. machine-private roots (Config's private directory, the user runtime directory, Claude Code
//      session sockets, herdr's sockets) hidden under every built-in policy (spec section 9.3)
//   10. (blind dispatches only) a peer's run state hidden
//
// Every probe includes a RED FALSIFIER: a deliberately broken sandbox config
// that the probe correctly catches and fails on.

import cp from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { BWRAP_DRIVER_VERSION, CONFINED_MARKER_ENV, prepareBwrapSync } from '../drivers/bwrap.mjs';
import { MACHINE_PRIVATE_ROOTS, SESSION_SOCKET_DIR, resolveConfinementResources } from '../resources.mjs';
import { SOCKET_PATH_MAX_BYTES } from '../../../../run-supervisor/runtime-dir.mjs';
import { BUILTIN_POLICIES, BUILTIN_POLICY_IDS } from '../policies.mjs';

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
  blind = false,
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
    machinePrivate: crypto.createHash('sha256').update(JSON.stringify(MACHINE_PRIVATE_ROOTS)).digest('hex'),
    ...(blind ? { blind: true } : {}),
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
 * Probe 9 (blind dispatches only): a worker run under `hostRead: blind` cannot see a peer
 * dispatch's run state, a peer's private home or a peer's process, and still reads its own
 * directory (read-only) and writes its outbox. The sandbox argv comes from the real
 * prepareBwrap, fed with resources the real resolver produced, so the probe cannot pass on a
 * shape the driver would never emit.
 *
 * RED FALSIFIER (`brokenConfig`): the same plan without its hidden-root masks must let the
 * worker read the planted peer file.
 */
export function probePeerRunHidden({ bwrapBin = '/usr/bin/bwrap', scratchDir, brokenConfig = false } = {}) {
  const root = fs.realpathSync(scratchDir);
  const project = path.join(root, 'project');
  const fgosDir = path.join(project, '.fgos');
  const peerReport = path.join(fgosDir, 'assignments', 'probe-unit', 'peer', '1', 'outbox', 'report-1.md');
  const ownDir = path.join(fgosDir, 'assignments', 'probe-unit', 'self', '1');
  const ownBrief = path.join(ownDir, 'brief.md');
  const runDir = path.join(ownDir, 'runs', '01');
  const outboxFile = path.join(runDir, 'worker-output', 'outbox', 'probe-out.txt');
  const tempRoot = path.join(root, 'confinement-temp');
  const peerHomeFile = path.join(tempRoot, 'peer-dispatch', 'home', 'transcript.txt');

  for (const file of [peerReport, ownBrief, peerHomeFile]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'PLANTED');
  }
  fs.mkdirSync(path.dirname(outboxFile), { recursive: true });

  const sibling = cp.spawn('sleep', ['60'], { stdio: 'ignore' });
  try {
    const resources = resolveConfinementResources({
      dispatchId: 'probe-peer-run-hidden',
      context: { cwd: project, repoRoot: project, runDir, fgosDir, assignmentLaunchContext: {} },
      grants: [
        { resource: 'run-output', access: 'write', scope: 'dispatch' },
        { resource: 'workspace', access: 'read', scope: 'dispatch' },
      ],
      backendConfig: { tempRoot },
      blind: true,
    }).filter((res) => !(brokenConfig && res.resource === 'hidden-root'));

    const script = `
      const fs = require('fs');
      const code = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.code; } };
      process.stdout.write(JSON.stringify({
        peerReport: code(() => fs.readFileSync(${JSON.stringify(peerReport)})),
        peerHome: code(() => fs.readFileSync(${JSON.stringify(peerHomeFile)})),
        peerProcess: code(() => fs.readFileSync('/proc/${sibling.pid}/cmdline')),
        ownBrief: code(() => fs.readFileSync(${JSON.stringify(ownBrief)})),
        ownBriefWrite: code(() => fs.writeFileSync(${JSON.stringify(ownBrief)}, 'EDIT')),
        outbox: code(() => fs.writeFileSync(${JSON.stringify(outboxFile)}, 'WRITTEN')),
      }));
    `;
    const request = {
      dispatchId: 'probe-peer-run-hidden',
      override: { controls: { hostRead: 'blind' } },
      invocation: { command: 'node', args: ['-e', script], env: {} },
      context: { cwd: project, repoRoot: project, runDir, fgosDir },
    };
    const prepared = prepareBwrapSync({ resources }, request, { id: 'bwrap', config: { executable: bwrapBin } });
    const res = cp.spawnSync(prepared.invocation.command, prepared.invocation.args, { encoding: 'utf8' });

    let seen = null;
    try {
      seen = JSON.parse(res.stdout);
    } catch {
      // seen stays null: the worker never reported
    }
    const outboxHostSide = fs.existsSync(outboxFile) && fs.readFileSync(outboxFile, 'utf8') === 'WRITTEN';
    const passed = Boolean(seen)
      && seen.peerReport === 'ENOENT'
      && seen.peerHome === 'ENOENT'
      && seen.peerProcess === 'ENOENT'
      && seen.ownBrief === 'ok'
      && seen.ownBriefWrite === 'EROFS'
      && seen.outbox === 'ok'
      && outboxHostSide;
    return {
      probe: 'peer-run-hidden',
      passed,
      detail: passed
        ? 'a blind worker cannot read a peer run, a peer home or a peer process, and keeps its own directory and outbox'
        : `blind read probe failed: ${seen ? JSON.stringify(seen) : (res.stderr || 'worker reported nothing')}`,
    };
  } finally {
    sibling.kill();
  }
}

/**
 * Probe 9: machine-private roots (spec section 9.3) are hidden from a worker under every
 * built-in policy, and under `hostRead: blind` as well when `blind` is set, for a direct and a
 * terminal launch. Stand-ins in a short scratch directory, handed to the real resolver and to the
 * worker alike: a home with files planted in `.fgos/private` and a listening herdr socket in
 * `.config/herdr`; a user runtime directory with listening stand-ins of the systemd user manager,
 * the session bus, ssh-agent and two attempts' GO sockets under `fgos/`; and a Claude socket base
 * outside it (Claude Code's fallback when the runtime directory is unset) with a session socket in
 * `cc-socks/`. The argv comes from the real prepareBwrap. The worker must reach none of them, but a
 * terminal launch reaches its own GO socket; it still writes its outbox and sees its workspace the
 * way the policy grants it.
 *
 * RED FALSIFIERS (`brokenConfig`): `true` drops every machine-private mask, and the worker must reach
 * everything; a name in MACHINE_PRIVATE_FALSIFIERS drops exactly that one mask, and the worker must
 * reach exactly what that mask hides while everything else stays hidden; `'own-socket'` launches the
 * terminal attempts with a gate that names no GO socket, and their worker must not reach its own.
 */
export const MACHINE_PRIVATE_FALSIFIERS = Object.freeze({
  private: Object.freeze(['accounts', 'token']),
  'runtime-dir': Object.freeze(['systemd', 'bus', 'sshAgent', 'otherAttempt']),
  'session-sockets': Object.freeze(['sessionSocket']),
  herdr: Object.freeze(['herdr']),
});

export function probeMachinePrivateHidden({ bwrapBin = '/usr/bin/bwrap', scratchDir, blind = false, brokenConfig = false } = {}) {
  // The sandbox starts with an empty /tmp, which would hide a planted file by itself and let the probe
  // pass without the mask: the stand-ins must live where the sandbox sees the host.
  const scratch = fs.realpathSync(scratchDir);
  const ownsRoot = scratch === '/tmp' || scratch.startsWith('/tmp/');
  const root = ownsRoot ? fs.mkdtempSync('/var/tmp/fgos-machine-private-probe-') : scratch;
  // A unix socket path must fit sun_path: the stand-ins sit in the scratch directory when that is
  // short enough, else in /var/tmp; both are host paths the sandbox sees.
  const short = shortStandInDir(root);
  if (!short) {
    if (ownsRoot) fs.rmSync(root, { recursive: true, force: true });
    return { probe: 'machine-private-hidden', passed: false, detail: `machine-private probe failed: no directory short enough for a unix socket path (tried ${root} and /var/tmp)` };
  }
  const servers = [];
  try {
    const stand = machinePrivateStandIns(short);
    for (const socket of Object.values(stand.sockets)) {
      fs.mkdirSync(path.dirname(socket), { recursive: true, mode: 0o700 });
      // listen() on a path binds synchronously; the kernel queues the worker's connect while spawnSync blocks.
      const server = net.createServer((conn) => conn.destroy());
      server.listen(socket);
      server.unref();
      servers.push(server);
    }
    return probeMachinePrivateHiddenIn({ bwrapBin, root, stand, blind, brokenConfig });
  } finally {
    for (const server of servers) server.close();
    fs.rmSync(short, { recursive: true, force: true });
    if (ownsRoot) fs.rmSync(root, { recursive: true, force: true });
  }
}

/** The longest stand-in socket path below the short directory. */
const LONGEST_STAND_IN = path.join('r', 'fgos', 'other-attempt.sock');

/** A fresh directory under the first candidate whose longest stand-in socket fits a unix socket path, or null. */
function shortStandInDir(root) {
  for (const parent of [root, '/var/tmp']) {
    if (Buffer.byteLength(path.join(parent, 'fgos-rt-XXXXXX', LONGEST_STAND_IN)) > SOCKET_PATH_MAX_BYTES) continue;
    try {
      return fs.mkdtempSync(path.join(parent, 'fgos-rt-'));
    } catch {
      // not writable: try the next one
    }
  }
  return null;
}

/** The stand-in host: a home (`h`), a user runtime directory (`r`) and a Claude socket base outside it (`c`). */
function machinePrivateStandIns(short) {
  const home = path.join(short, 'h');
  const runtimeDir = path.join(short, 'r');
  const claudeSocketBase = path.join(short, 'c');
  const privateDir = path.join(home, '.fgos', 'private');
  const herdrDir = path.join(home, '.config', 'herdr');
  for (const dir of [privateDir, runtimeDir, claudeSocketBase]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const planted = { accounts: path.join(privateDir, 'accounts.yaml'), token: path.join(privateDir, 'gateway-token') };
  for (const file of Object.values(planted)) fs.writeFileSync(file, 'PLANTED');
  return {
    home,
    runtimeDir,
    claudeSocketBase,
    privateDir,
    planted,
    herdrSocketPath: path.join(herdrDir, 'herdr.sock'),
    ownAttempt: path.join(runtimeDir, 'fgos', 'own-attempt.sock'),
    sockets: {
      systemd: path.join(runtimeDir, 'systemd', 'private'),
      bus: path.join(runtimeDir, 'bus'),
      sshAgent: path.join(runtimeDir, 'openssh_agent'),
      otherAttempt: path.join(runtimeDir, 'fgos', 'other-attempt.sock'),
      ownAttempt: path.join(runtimeDir, 'fgos', 'own-attempt.sock'),
      sessionSocket: path.join(claudeSocketBase, SESSION_SOCKET_DIR, '4242.sock'),
      herdr: path.join(herdrDir, 'herdr.sock'),
    },
    // The host directory each named falsifier unmasks.
    masks: {
      private: privateDir,
      'runtime-dir': runtimeDir,
      'session-sockets': path.join(claudeSocketBase, SESSION_SOCKET_DIR),
      herdr: herdrDir,
    },
  };
}

/** Which machine-private masks a falsifier leaves out. */
function droppedByFalsifier(res, brokenConfig, stand) {
  if (!res.machinePrivate || !brokenConfig || brokenConfig === 'own-socket') return false;
  return brokenConfig === true || res.hostTarget === fs.realpathSync(stand.masks[brokenConfig]);
}

function probeMachinePrivateHiddenIn({ bwrapBin, root, stand, blind, brokenConfig }) {
  if (brokenConfig && brokenConfig !== true && brokenConfig !== 'own-socket' && !(brokenConfig in MACHINE_PRIVATE_FALSIFIERS)) {
    throw new Error(`unknown machine-private falsifier "${brokenConfig}"`);
  }
  const hiddenKeys = Object.values(MACHINE_PRIVATE_FALSIFIERS).flat();
  const failures = [];
  const variants = BUILTIN_POLICY_IDS.flatMap((policyId) => (blind ? [false, true] : [false]).flatMap((blindVariant) => ['direct', 'terminal'].map((launchMode) => [policyId, blindVariant, launchMode])));
  for (const [policyId, blindVariant, launchMode] of variants) {
    const label = `${policyId}${blindVariant ? '+blind' : ''}/${launchMode}`;
    const slug = label.replace(/[+/]/g, '-');
    const dir = path.join(root, slug);
    const project = path.join(dir, 'project');
    const fgosDir = path.join(project, '.fgos');
    const ownDir = path.join(fgosDir, 'assignments', 'probe-unit', 'self', '1');
    const runDir = path.join(ownDir, 'runs', '01');
    const outboxFile = path.join(runDir, 'worker-output', 'outbox', 'probe-out.txt');
    const workspaceFile = path.join(project, 'probe-workspace.txt');
    const credsDir = path.join(dir, 'creds');
    for (const d of [path.dirname(outboxFile), credsDir]) fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(ownDir, 'brief.md'), 'OWN');
    const grants = BUILTIN_POLICIES[policyId].grants;

    const resources = resolveConfinementResources({
      dispatchId: `probe-machine-private-${slug}`,
      context: { cwd: project, repoRoot: project, runDir, fgosDir, assignmentLaunchContext: {} },
      grants,
      backendConfig: { tempRoot: path.join(dir, 'confinement-temp') },
      providerSources: { credentialsPath: credsDir },
      blind: blindVariant,
      homeDir: stand.home,
      claudeSocketBase: stand.claudeSocketBase,
      xdgRuntimeDir: stand.runtimeDir,
      xdgConfigHome: null,
      herdrSocketPath: stand.herdrSocketPath,
    }).filter((res) => !droppedByFalsifier(res, brokenConfig, stand));

    const script = `
      const fs = require('fs');
      const net = require('net');
      const code = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.code; } };
      const connect = (p) => new Promise((done) => {
        const c = net.connect(p);
        c.on('connect', () => { c.destroy(); done('ok'); });
        c.on('error', (e) => done(e.code));
      });
      (async () => {
        const seen = {};
        for (const [name, socket] of Object.entries(${JSON.stringify(stand.sockets)})) seen[name] = await connect(socket);
        Object.assign(seen, {
          marker: process.env[${JSON.stringify(CONFINED_MARKER_ENV)}],
          accounts: code(() => fs.readFileSync(${JSON.stringify(stand.planted.accounts)})),
          token: code(() => fs.readFileSync(${JSON.stringify(stand.planted.token)})),
          entries: (() => { try { return fs.readdirSync(${JSON.stringify(stand.privateDir)}).length; } catch (e) { return e.code; } })(),
          outbox: code(() => fs.writeFileSync(${JSON.stringify(outboxFile)}, 'WRITTEN')),
          workspace: code(() => fs.writeFileSync(${JSON.stringify(workspaceFile)}, 'WRITTEN')),
        });
        process.stdout.write(JSON.stringify(seen));
      })();
    `;
    const terminal = launchMode === 'terminal';
    const request = {
      dispatchId: `probe-machine-private-${slug}`,
      ...(blindVariant ? { override: { controls: { hostRead: 'blind' } } } : {}),
      invocation: { command: 'node', args: ['-e', script], env: {} },
      context: { cwd: project, repoRoot: project, runDir, fgosDir },
      // A terminal attempt: the prefix ends in `--` and its gate would dial its own GO socket. The gate
      // path is absolute: the driver binds a gate binary that lies under /tmp, resolved from the cwd.
      ...(terminal ? { launchMode, attemptId: `probe-${slug}`, gateCommand: ['/bin/true', 'internal', 'gate', ...(brokenConfig === 'own-socket' ? [] : ['--go-socket', stand.ownAttempt])] } : {}),
    };
    // The driver binds back only a GO socket in the run supervisor's socket directory, which it reads
    // from $XDG_RUNTIME_DIR: point that at the stand-in for this synchronous call.
    const previousRuntimeDir = process.env.XDG_RUNTIME_DIR;
    process.env.XDG_RUNTIME_DIR = stand.runtimeDir;
    let prepared;
    try {
      prepared = prepareBwrapSync({ resources }, request, { id: 'bwrap', config: { executable: bwrapBin } });
    } finally {
      if (previousRuntimeDir === undefined) delete process.env.XDG_RUNTIME_DIR;
      else process.env.XDG_RUNTIME_DIR = previousRuntimeDir;
    }
    const args = terminal ? [...prepared.invocation.args, 'node', '-e', script] : prepared.invocation.args;
    const res = cp.spawnSync(prepared.invocation.command, args, { encoding: 'utf8' });

    let seen = null;
    try {
      seen = JSON.parse(res.stdout);
    } catch {
      // seen stays null: the worker never reported
    }
    const workspaceWritable = grants.some((g) => g.resource === 'workspace' && g.access !== 'read');
    const outboxHostSide = fs.existsSync(outboxFile) && fs.readFileSync(outboxFile, 'utf8') === 'WRITTEN';
    const ok = Boolean(seen)
      && seen.marker === '1'
      && hiddenKeys.every((key) => seen[key] === 'ENOENT')
      && seen.entries === 0
      && seen.ownAttempt === (terminal ? 'ok' : 'ENOENT')
      && seen.outbox === 'ok'
      && outboxHostSide
      && (workspaceWritable ? seen.workspace === 'ok' : seen.workspace === 'EROFS');
    if (!ok) failures.push(`${label}: ${seen ? JSON.stringify(seen) : (res.stderr || 'worker reported nothing')}`);
  }

  const passed = failures.length === 0;
  return {
    probe: 'machine-private-hidden',
    passed,
    detail: passed
      ? `a worker under ${variants.length} policy, hostRead and launch combinations cannot read a machine-private directory or reach a runtime-directory, Claude Code session, herdr or other attempt's socket, and keeps its own GO socket, outbox and workspace`
      : `machine-private probe failed: ${failures.join('; ')}`,
  };
}

/**
 * Run all 9 probes against a bwrap executable and test directory. A blind dispatch adds a
 * tenth, probePeerRunHidden, and its machine-private probe also covers `hostRead: blind`.
 */
export function runAllConfinementProbes({
  bwrapBin = '/usr/bin/bwrap',
  scratchDir = null,
  blind = false,
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

    const machinePrivateDir = path.join(tempRoot, 'machine-private');
    for (const d of [runDir, targetDir, wsDir, outsideDir, otherRunDir, hostHomeDir, privateHomeDir, credsDir, machinePrivateDir]) {
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
      probeMachinePrivateHidden({ bwrapBin, scratchDir: machinePrivateDir, blind }),
    ];
    if (blind) {
      const blindDir = path.join(tempRoot, 'blind');
      fs.mkdirSync(blindDir, { recursive: true });
      results.push(probePeerRunHidden({ bwrapBin, scratchDir: blindDir }));
    }

    const allPassed = results.every((r) => r.passed);
    const failed = results.filter((r) => !r.passed);

    return {
      passed: allPassed,
      message: allPassed
        ? `all ${results.length} local-bwrap-v1 confinement probes passed`
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
