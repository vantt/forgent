import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startGateway, stopGateway, gatewayStatus, acquireGatewayLock, GatewayControlError } from '../../src/runner/gateway-control.mjs';

const GATEWAY_CONTROL_MOD_PATH = fileURLToPath(new URL('../../src/runner/gateway-control.mjs', import.meta.url));

// Every test builds its own disposable temp dir (mkdtemp) for both the fake
// repo root and its `.fgos` -- no test ever touches THIS repo's real
// .fgos/gateway.json or spawns the real herdr-fgos binary (that pipeline is
// proven separately by a real manual run, tsk-31v's own plan.md). What IS
// real here: process spawning, SIGTERM delivery, PID liveness, and an actual
// HTTP reachability check against a real (fake-content) local server.

function mkFgosDir() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gateway-test-repo-'));
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return { repoRoot, fgosDir };
}

function cleanup(repoRoot) {
  try {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  } catch {
    // best-effort
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** A real, throwaway long-lived process this test controls entirely --
 * gives a genuinely live pid without depending on the real herdr-fgos
 * binary or cargo. Spawned as a genuine ORPHAN (via `setsid` backgrounded
 * from a `sh -c` that itself exits immediately), never a direct Node
 * child of this test process -- matching real production topology, where
 * `fgos gateway stop` always targets an already-detached, already-
 * orphaned process from a long-exited `start` invocation, never its own
 * child. A direct `spawn()`-ed child here would go zombie the moment
 * `stopGateway`'s synchronous `Atomics.wait` poll loop blocks this
 * process's own event loop from ever reaping it -- a real artifact of
 * same-process children, not a bug in `stopGateway` itself (confirmed
 * live: an orphaned process dies within ~50ms under the exact same
 * blocking poll). Returns `{ pid, kill(signal) }`. */
function spawnThrowaway() {
  const out = execFileSync('sh', [
    '-c',
    `setsid "$0" -e "$1" </dev/null >/dev/null 2>&1 & echo $!`,
    process.execPath,
    'setInterval(() => {}, 1000)',
  ]);
  const pid = parseInt(out.toString().trim(), 10);
  return {
    pid,
    kill(signal) {
      try {
        process.kill(pid, signal);
      } catch (err) {
        if (err.code !== 'ESRCH') throw err;
      }
    },
  };
}

function writeRegistry(fgosDir, entry) {
  fs.writeFileSync(path.join(fgosDir, 'gateway.json'), JSON.stringify(entry));
}

test('gatewayStatus: no registry file means not running, not reachable', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  try {
    const status = await gatewayStatus(fgosDir);
    assert.deepEqual(status, { running: false, reachable: false });
  } finally {
    cleanup(repoRoot);
  }
});

test('gatewayStatus: corrupt registry fails closed with GatewayControlError, never silently treated as "not running"', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  try {
    fs.writeFileSync(path.join(fgosDir, 'gateway.json'), '{ not json');
    await assert.rejects(() => gatewayStatus(fgosDir), GatewayControlError);
  } finally {
    cleanup(repoRoot);
  }
});

test('gatewayStatus: a registry entry whose pid is dead reports running:false and staleRegistry:true', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  try {
    // A pid essentially guaranteed dead: spawn-and-immediately-reaped.
    const dead = spawnSync(process.execPath, ['-e', '']);
    assert.equal(dead.status, 0);
    writeRegistry(fgosDir, { pid: dead.pid, port: 4170, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    const status = await gatewayStatus(fgosDir);
    assert.equal(status.running, false);
    assert.equal(status.staleRegistry, true);
  } finally {
    cleanup(repoRoot);
  }
});

test('gatewayStatus: a live pid whose port serves /v1/contract reports running:true, reachable:true', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  const server = http.createServer((req, res) => {
    if (req.url === '/v1/contract') {
      res.writeHead(200).end('openapi: 3.1.0');
    } else {
      res.writeHead(404).end();
    }
  });
  const child = spawnThrowaway();
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    writeRegistry(fgosDir, { pid: child.pid, port, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    const status = await gatewayStatus(fgosDir);
    assert.equal(status.running, true);
    assert.equal(status.reachable, true);
    assert.equal(status.pid, child.pid);
    assert.equal(status.port, port);
  } finally {
    child.kill('SIGKILL');
    await new Promise((resolve) => server.close(resolve));
    cleanup(repoRoot);
  }
});

test('gatewayStatus: a live pid but nothing listening on the recorded port reports running:true, reachable:false', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  const child = spawnThrowaway();
  try {
    // Port 1 is a real, always-unbound-by-anyone-here low port -- fetch
    // fails with a real connection error, exercising the catch branch.
    writeRegistry(fgosDir, { pid: child.pid, port: 1, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    const status = await gatewayStatus(fgosDir);
    assert.equal(status.running, true);
    assert.equal(status.reachable, false);
  } finally {
    child.kill('SIGKILL');
    cleanup(repoRoot);
  }
});

test('stopGateway: no registry reports alreadyStopped:true, not an error', () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  try {
    assert.deepEqual(stopGateway(fgosDir), { alreadyStopped: true });
  } finally {
    cleanup(repoRoot);
  }
});

test('stopGateway: a dead-pid registry entry is cleared and reports alreadyStopped:true', () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  try {
    const dead = spawnSync(process.execPath, ['-e', '']);
    writeRegistry(fgosDir, { pid: dead.pid, port: 4170, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    const result = stopGateway(fgosDir);
    assert.equal(result.alreadyStopped, true);
    assert.equal(fs.existsSync(path.join(fgosDir, 'gateway.json')), false);
  } finally {
    cleanup(repoRoot);
  }
});

test('stopGateway: a live pid is genuinely SIGTERM-ed and the registry is cleared', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  const child = spawnThrowaway();
  try {
    writeRegistry(fgosDir, { pid: child.pid, port: 4170, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    const result = stopGateway(fgosDir);
    assert.equal(result.alreadyStopped, false);
    assert.equal(result.pid, child.pid);
    assert.equal(isAlive(child.pid), false); // stopGateway itself already waited for real death (tsk-2n2)
    assert.equal(fs.existsSync(path.join(fgosDir, 'gateway.json')), false);
  } finally {
    child.kill('SIGKILL');
    cleanup(repoRoot);
  }
});

test('stopGateway: escalates to SIGKILL when the process ignores SIGTERM, and still clears the registry', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  // A process with a real SIGTERM handler that swallows the signal --
  // proves the escalation path fires for a genuine "won't die" process,
  // not just a slow-but-cooperative one. It writes a ready-marker file
  // right after registering the handler; the test polls for that marker
  // before calling stopGateway, since a Node process' own startup
  // (module bootstrap) takes real time and sending SIGTERM before the
  // handler line has executed would just terminate it normally (a real
  // race caught live while writing this test: an immediate kill after
  // spawn killed the "SIGTERM-swallowing" process anyway).
  const readyPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gateway-test-ready-')), 'ready');
  const script = `process.on('SIGTERM', () => {}); require('fs').writeFileSync(${JSON.stringify(readyPath)}, '1'); setInterval(() => {}, 1000);`;
  const out = execFileSync('sh', ['-c', `setsid "$0" -e "$1" </dev/null >/dev/null 2>&1 & echo $!`, process.execPath, script]);
  const child = { pid: parseInt(out.toString().trim(), 10) };
  try {
    const readyDeadline = Date.now() + 5000;
    while (!fs.existsSync(readyPath)) {
      assert.ok(Date.now() < readyDeadline, 'throwaway process never reached its SIGTERM-handler line');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    writeRegistry(fgosDir, { pid: child.pid, port: 4170, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    const start = Date.now();
    const result = stopGateway(fgosDir);
    assert.equal(result.alreadyStopped, false);
    assert.ok(Date.now() - start >= 5000, 'expected stopGateway to wait through STOP_TIMEOUT_MS before escalating');
    assert.equal(isAlive(child.pid), false);
    assert.equal(fs.existsSync(path.join(fgosDir, 'gateway.json')), false);
  } finally {
    try {
      process.kill(child.pid, 'SIGKILL');
    } catch (err) {
      if (err.code !== 'ESRCH') throw err;
    }
    cleanup(repoRoot);
    cleanup(path.dirname(readyPath));
  }
});

test('startGateway: refuses with no side effects when the registry already names a live pid', () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  const child = spawnThrowaway();
  try {
    writeRegistry(fgosDir, { pid: child.pid, port: 4170, startedAt: new Date().toISOString(), logPath: '/dev/null' });
    assert.throws(() => startGateway(repoRoot, fgosDir), GatewayControlError);
    // Refusal happens before ever touching herdr-plugin/ -- no herdr-plugin
    // dir exists in this fixture at all, proving the check really is
    // ordered before any cargo/binary work, not just coincidentally fast.
    assert.equal(fs.existsSync(path.join(repoRoot, 'herdr-plugin')), false);
  } finally {
    child.kill('SIGKILL');
    cleanup(repoRoot);
  }
});

test('startGateway: a repo with no herdr-plugin/ directory is refused with a real, named error', () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  try {
    assert.throws(() => startGateway(repoRoot, fgosDir), (err) => {
      assert.ok(err instanceof GatewayControlError);
      assert.match(err.message, /no herdr-plugin\/ directory found/);
      return true;
    });
  } finally {
    cleanup(repoRoot);
  }
});

// tsk-2n2: real cross-process mutual exclusion. A single JS thread cannot
// prove a lock actually excludes a CONCURRENT holder (everything in one
// process is serialized by the event loop regardless of the lock) -- a
// second real OS process is spawned to hold `gateway.lock` while this
// process attempts to acquire the SAME lock, proving the exclusion is
// real, not just an in-process illusion.
test('acquireGatewayLock: a live holder in ANOTHER process blocks this process from acquiring, and names the real holder pid', async () => {
  const { repoRoot, fgosDir } = mkFgosDir();
  fs.mkdirSync(fgosDir, { recursive: true });
  const holderReadyPath = path.join(fgosDir, 'holder-ready');
  const holderScript = `
    import fs from 'node:fs';
    import { acquireGatewayLock } from ${JSON.stringify(GATEWAY_CONTROL_MOD_PATH)};
    const lock = acquireGatewayLock(${JSON.stringify(fgosDir)});
    fs.writeFileSync(${JSON.stringify(holderReadyPath)}, String(process.pid));
    setTimeout(() => { lock.release(); }, 2000);
    setInterval(() => {}, 1000);
  `;
  const out = execFileSync('sh', [
    '-c',
    `setsid "$0" --input-type=module -e "$1" </dev/null >/dev/null 2>&1 & echo $!`,
    process.execPath,
    holderScript,
  ]);
  const holderPid = parseInt(out.toString().trim(), 10);
  try {
    const readyDeadline = Date.now() + 5000;
    while (!fs.existsSync(holderReadyPath)) {
      assert.ok(Date.now() < readyDeadline, 'holder process never acquired the lock');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.throws(
      () => acquireGatewayLock(fgosDir, { timeoutMs: 300, retryMs: 20 }),
      (err) => {
        assert.ok(err instanceof GatewayControlError);
        assert.match(err.message, /timed out acquiring gateway\.lock/);
        assert.equal(err.holderPid, holderPid);
        return true;
      },
    );

    // The holder releases after 2s (already elapsed by now) -- a fresh
    // acquire attempt with a real window succeeds, proving this is a
    // real, releasable lock, not a permanent deadlock.
    const lock = acquireGatewayLock(fgosDir, { timeoutMs: 3000, retryMs: 20 });
    lock.release();
  } finally {
    process.kill(holderPid, 'SIGKILL');
    cleanup(repoRoot);
  }
});
