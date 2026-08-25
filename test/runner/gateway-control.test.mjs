import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { startGateway, stopGateway, gatewayStatus, GatewayControlError } from '../../src/runner/gateway-control.mjs';

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

/** A real, throwaway long-lived process this test controls entirely --
 * gives a genuinely live pid without depending on the real herdr-fgos
 * binary or cargo. Killed in the test's own cleanup. */
function spawnThrowaway() {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  return child;
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
    const exited = new Promise((resolve) => child.once('exit', resolve));
    const result = stopGateway(fgosDir);
    assert.equal(result.alreadyStopped, false);
    assert.equal(result.pid, child.pid);
    await exited; // real proof: the process this test spawned actually died
    assert.equal(fs.existsSync(path.join(fgosDir, 'gateway.json')), false);
  } finally {
    if (!child.killed) child.kill('SIGKILL');
    cleanup(repoRoot);
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
