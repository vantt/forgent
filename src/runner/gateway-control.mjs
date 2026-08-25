// gateway-control.mjs — one-door lifecycle for the herdr-fgos gateway
// (REST API + web dashboard, herdr-plugin/src/gateway.rs) as a detached
// background process, so an agent never hand-rolls nohup/tmux/systemd
// (tsk-31v). Registry shape and PID-liveness technique mirror
// src/runner/session.mjs's existing pattern deliberately, but this is a
// SEPARATE concern: session.mjs tracks git-worktree lifecycles, this
// tracks one long-lived OS process per repo checkout. Registry lives at
// `.fgos/gateway.json` (a single object, not an array — one gateway
// process makes sense per repo checkout, since the bound port is a
// per-machine config value the Rust binary itself reads from
// `~/.fgos/config.json`, not from anything this module owns).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { resolveLogsDir } from './paths.mjs';

const REGISTRY_FILE = 'gateway.json';
const DEFAULT_PORT = 4170;
const STARTUP_TIMEOUT_MS = 30000;
const STARTUP_POLL_MS = 250;

/** Raised for any gateway lifecycle failure. Mirrors SessionError's shape
 * so store.mjs's `categoryOf` contract picks it up via `.category`. */
export class GatewayControlError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GatewayControlError';
    this.errorClass = 'gateway-control-fail';
    this.category = 'session-fail';
    Object.assign(this, details);
  }
}

/** Signal-0 liveness probe (mirrors session.mjs's isPidAlive). EPERM means
 * the pid exists under another user — still alive. */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function registryPath(fgosDir) {
  return path.join(fgosDir, REGISTRY_FILE);
}

/** A missing file is "not running" (fresh repo, or already stopped). A
 * present-but-unparseable file fails CLOSED — never silently overwritten
 * over unknown state (matches session.mjs's own corrupt-registry stance). */
function readRegistry(fgosDir) {
  const rp = registryPath(fgosDir);
  let raw;
  try {
    raw = fs.readFileSync(rp, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw new GatewayControlError(`reading gateway.json at "${rp}" failed: ${err.message}`, { registryPath: rp });
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new GatewayControlError(`gateway.json at "${rp}" is corrupt (not valid JSON): ${err.message}`, { registryPath: rp });
  }
}

function writeRegistry(fgosDir, entry) {
  const rp = registryPath(fgosDir);
  if (entry === null) {
    try {
      fs.unlinkSync(rp);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    return;
  }
  fs.writeFileSync(rp, `${JSON.stringify(entry, null, 2)}\n`);
}

/** Real port this repo's gateway would bind, read the SAME way the Rust
 * binary itself does (`gateway.rs`'s `load_gateway_config`: `~/.fgos/
 * config.json`'s `gateway.port`, default 4170) — never re-guessed or
 * hardcoded independently of the actual authority. */
function resolveConfiguredPort() {
  const configPath = path.join(os.homedir(), '.fgos', 'config.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    const port = parsed?.gateway?.port;
    if (Number.isInteger(port) && port > 0) return port;
  } catch {
    // missing/corrupt/no port set — DEFAULT_PORT below matches gateway.rs's
    // own DEFAULT_PORT constant.
  }
  return DEFAULT_PORT;
}

function herdrPluginDir(repoRoot) {
  return path.join(repoRoot, 'herdr-plugin');
}

function releaseBinaryPath(repoRoot) {
  return path.join(herdrPluginDir(repoRoot), 'target', 'release', 'herdr-fgos');
}

/** Synchronous backoff — mirrors session.mjs's own sleepSync (no busy
 * spin, no extra dependency). */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Start the gateway as a detached background process. Refuses (no
 * process spawned) when the registry already names a live pid. Builds
 * the release binary first (`cargo build --release`, synchronous —
 * cargo's own incremental cache makes a no-op rebuild fast) rather than
 * assuming a prior manual build, so `fgos gateway start` alone is always
 * sufficient. Returns the recorded registry entry once the log file
 * shows the real "listening on" line the Rust binary itself prints, or
 * throws if that never appears within STARTUP_TIMEOUT_MS (a real
 * startup failure — e.g. a missing gateway.token — surfaces in the log
 * either way).
 */
export function startGateway(repoRoot, fgosDir) {
  const existing = readRegistry(fgosDir);
  if (existing && isPidAlive(existing.pid)) {
    throw new GatewayControlError(
      `gateway is already running (pid ${existing.pid}, port ${existing.port}) — stop it first with "fgos gateway stop" if you meant to restart it`,
      { pid: existing.pid, port: existing.port },
    );
  }

  const pluginDir = herdrPluginDir(repoRoot);
  if (!fs.existsSync(pluginDir)) {
    throw new GatewayControlError(`no herdr-plugin/ directory found at "${pluginDir}" — this repo has no gateway to start`, { pluginDir });
  }

  try {
    execFileSync('cargo', ['build', '--release', '--bin', 'herdr-fgos'], { cwd: pluginDir, stdio: 'pipe' });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString('utf8') : err.message;
    throw new GatewayControlError(`building the release binary failed: ${stderr}`, { pluginDir });
  }

  const binaryPath = releaseBinaryPath(repoRoot);
  if (!fs.existsSync(binaryPath)) {
    throw new GatewayControlError(`cargo build reported success but no binary was found at "${binaryPath}"`, { binaryPath });
  }

  const logsDir = resolveLogsDir(fgosDir);
  fs.mkdirSync(logsDir, { recursive: true });
  const logPath = path.join(logsDir, 'gateway.log');
  const logFd = fs.openSync(logPath, 'a');

  let child;
  try {
    child = spawn(binaryPath, ['gateway'], {
      cwd: pluginDir,
      detached: true,
      stdio: ['ignore', logFd, logFd],
    });
  } finally {
    fs.closeSync(logFd);
  }
  // Detach fully: this Node process (the CLI invocation) is allowed to
  // exit without taking the gateway down with it.
  child.unref();

  const port = resolveConfiguredPort();
  const entry = {
    pid: child.pid,
    port,
    startedAt: new Date().toISOString(),
    logPath,
    binaryPath,
  };

  // Confirm real startup (the process printing its own "listening on"
  // line to the log) rather than trusting a returned pid alone — a pid
  // exists the instant spawn() returns even if the process panics a
  // moment later (e.g. a missing gateway.token, a port already in use).
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  for (;;) {
    if (!isPidAlive(child.pid)) {
      let tail = '';
      try {
        tail = fs.readFileSync(logPath, 'utf8').split('\n').slice(-20).join('\n');
      } catch {
        // best-effort — the error below still names the log path.
      }
      throw new GatewayControlError(`gateway process exited immediately after starting — see "${logPath}" for the real error:\n${tail}`, { logPath });
    }
    let logContent = '';
    try {
      logContent = fs.readFileSync(logPath, 'utf8');
    } catch {
      // log not yet flushed — keep polling.
    }
    if (logContent.includes('listening on')) break;
    if (Date.now() >= deadline) {
      throw new GatewayControlError(`gateway did not report "listening on" within ${STARTUP_TIMEOUT_MS}ms — see "${logPath}"`, { logPath, pid: child.pid });
    }
    sleepSync(STARTUP_POLL_MS);
  }

  writeRegistry(fgosDir, entry);
  return { ...entry };
}

/**
 * Stop the running gateway: SIGTERM the recorded pid and clear the
 * registry. Reports `alreadyStopped: true` (not an error) when no
 * registry entry exists or its pid is already dead — stopping something
 * already stopped is a no-op, not a failure.
 */
export function stopGateway(fgosDir) {
  const entry = readRegistry(fgosDir);
  if (!entry) {
    return { alreadyStopped: true };
  }
  if (!isPidAlive(entry.pid)) {
    writeRegistry(fgosDir, null);
    return { alreadyStopped: true, pid: entry.pid };
  }
  try {
    process.kill(entry.pid, 'SIGTERM');
  } catch (err) {
    if (err.code !== 'ESRCH') {
      throw new GatewayControlError(`sending SIGTERM to gateway pid ${entry.pid} failed: ${err.message}`, { pid: entry.pid });
    }
  }
  writeRegistry(fgosDir, null);
  return { alreadyStopped: false, pid: entry.pid, port: entry.port };
}

/**
 * Read-only status: registry contents, real pid liveness, plus a real
 * HTTP reachability check against `/v1/contract` (the one unauthenticated
 * endpoint, per the contract's own top-level note) — never a report
 * derived from the registry alone, which could go stale the moment the
 * process crashes without anyone calling `stop`.
 */
export async function gatewayStatus(fgosDir) {
  const entry = readRegistry(fgosDir);
  if (!entry) {
    return { running: false, reachable: false };
  }
  const alive = isPidAlive(entry.pid);
  if (!alive) {
    return { running: false, reachable: false, pid: entry.pid, port: entry.port, staleRegistry: true };
  }
  let reachable = false;
  try {
    const res = await fetch(`http://127.0.0.1:${entry.port}/v1/contract`);
    reachable = res.ok;
  } catch {
    reachable = false;
  }
  return {
    running: true,
    reachable,
    pid: entry.pid,
    port: entry.port,
    startedAt: entry.startedAt,
    logPath: entry.logPath,
  };
}
