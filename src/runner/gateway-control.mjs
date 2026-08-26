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
//
// tsk-2n2 (real gap found reviewing tsk-31v): `start`/`stop` now run their
// whole read-check-write sequence under `.fgos/gateway.lock` — two
// concurrent `fgos gateway start` calls used to both pass the
// not-running check before either wrote the registry, AND both appended
// to the SAME fixed log path, so one invocation's startup-confirmation
// poll could see the OTHER invocation's process's "listening on" line
// and record the wrong pid. The lock is PID-liveness-based, not TTL —
// unlike main-checkout-lock.mjs's short critical sections, a cold
// `cargo build --release` plus startup confirmation can legitimately run
// 60-90s, and a TTL sized for that would be the wrong tool (the exact
// TTL-expires-mid-operation class of flake this repo has already hit
// elsewhere). Each `start` also gets its own uniquely-named log file
// (timestamp+pid) as a second, independent fix — no two starts ever
// share a log file even in a hypothetical future caller that bypasses
// the lock.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { resolveLogsDir } from './paths.mjs';

const REGISTRY_FILE = 'gateway.json';
const LOCK_FILE = 'gateway.lock';
const DEFAULT_PORT = 4170;
const STARTUP_TIMEOUT_MS = 30000;
const STARTUP_POLL_MS = 250;
const STOP_TIMEOUT_MS = 5000;
const STOP_POLL_MS = 100;
const STATUS_FETCH_TIMEOUT_MS = 3000;
const BUILD_MAX_BUFFER = 32 * 1024 * 1024; // 32MB — a verbose cold `cargo build` can exceed the 1MB default.

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

/** Synchronous backoff — mirrors session.mjs's own sleepSync (no busy
 * spin, no extra dependency). */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Poll (blocking, via sleepSync) until `pid` is no longer alive or
 * `deadline` (an absolute Date.now() timestamp) passes. Returns whether
 * it actually died. Shared by both the graceful (SIGTERM) and forced
 * (SIGKILL) wait phases in `stopGateway` — each phase gets its OWN full
 * window, since a signal taking effect is never instantaneous. */
function waitUntilDeadOrDeadline(pid, deadline) {
  while (isPidAlive(pid)) {
    if (Date.now() >= deadline) return false;
    sleepSync(STOP_POLL_MS);
  }
  return true;
}

// ---------------------------------------------------------------------
// Lock (tsk-2n2): link-atomic-create, PID-liveness-based staleness —
// the same proven technique session.mjs's tryAcquireOnce uses, ported
// here rather than shared, since main-checkout-lock.mjs's TTL model
// solves a different problem (short critical sections) this module's
// long build+startup phase does not fit.
// ---------------------------------------------------------------------

let lockTmpCounter = 0;

function tryAcquireLockOnce(lockPath, pid) {
  const dir = path.dirname(lockPath);
  lockTmpCounter += 1;
  const tmpPath = path.join(dir, `.gateway.lock.tmp-${pid}-${Date.now()}-${lockTmpCounter}`);
  fs.writeFileSync(tmpPath, String(pid), 'utf8');
  try {
    fs.linkSync(tmpPath, lockPath);
    return { acquired: true };
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { acquired: false, holderPid: null }; // released in between — retry create
    throw err;
  }
  const holderPid = parseInt(raw.trim(), 10);

  if (Number.isInteger(holderPid) && holderPid > 0 && isPidAlive(holderPid)) {
    return { acquired: false, holderPid }; // genuine live holder — back off, never touch its lock
  }

  // Stale (dead/garbage pid). Re-read right before unlinking: the
  // liveness probe is the slow window; changed content means a fresh
  // holder took the path and must not be touched.
  let current;
  try {
    current = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { acquired: false, holderPid: null };
    throw err;
  }
  if (current !== raw) {
    const freshPid = parseInt(current.trim(), 10);
    return { acquired: false, holderPid: Number.isInteger(freshPid) && freshPid > 0 ? freshPid : null };
  }
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { acquired: false, holderPid: null }; // cleaned and yield; next attempt creates
}

/** Blocking exclusive acquire of `.fgos/gateway.lock`. Retries until it
 * wins or `timeoutMs` elapses — generous by default, since a competing
 * `start` can legitimately hold it through a cold cargo build. Returns a
 * handle with `release()`; callers MUST release in a `finally`. */
export function acquireGatewayLock(fgosDir, { timeoutMs = 120000, retryMs = 100 } = {}) {
  fs.mkdirSync(fgosDir, { recursive: true });
  const lockPath = path.join(fgosDir, LOCK_FILE);
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = tryAcquireLockOnce(lockPath, process.pid);
    if (res.acquired) {
      return {
        release() {
          try {
            fs.unlinkSync(lockPath);
          } catch (err) {
            if (err.code !== 'ENOENT') throw err;
          }
        },
      };
    }
    if (Date.now() >= deadline) {
      throw new GatewayControlError(
        `timed out acquiring gateway.lock at "${lockPath}" after ${timeoutMs}ms` + (res.holderPid ? ` (held by pid ${res.holderPid})` : ''),
        { lockPath, holderPid: res.holderPid ?? null },
      );
    }
    sleepSync(retryMs);
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

/**
 * Start the gateway as a detached background process, under
 * `.fgos/gateway.lock` for the whole check-build-spawn-confirm sequence
 * (tsk-2n2). Refuses (no process spawned) when the registry already
 * names a live pid. Builds the release binary first (`cargo build
 * --release`, synchronous — cargo's own incremental cache makes a no-op
 * rebuild fast) rather than assuming a prior manual build, so `fgos
 * gateway start` alone is always sufficient. Returns the recorded
 * registry entry once the log file shows the real "listening on" line
 * the Rust binary itself prints, or throws if that never appears within
 * STARTUP_TIMEOUT_MS (a real startup failure — e.g. a missing
 * gateway.token — surfaces in the log either way).
 */
export function startGateway(repoRoot, fgosDir) {
  const lock = acquireGatewayLock(fgosDir);
  try {
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
      execFileSync('cargo', ['build', '--release', '--bin', 'herdr-fgos'], { cwd: pluginDir, stdio: 'pipe', maxBuffer: BUILD_MAX_BUFFER });
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
    // tsk-2n2: unique per-invocation log path — even though the lock
    // above already serializes every start, a distinct file per attempt
    // keeps an old attempt's content from ever being mistaken for a new
    // one's, and keeps the log genuinely scoped to the process it names.
    const logPath = path.join(logsDir, `gateway-${Date.now()}-${process.pid}.log`);
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
  } finally {
    lock.release();
  }
}

/**
 * Stop the running gateway, under `.fgos/gateway.lock` (tsk-2n2 — the
 * same lock `start` uses, so a `stop` can never race a `start` that is
 * mid-registry-write). Sends SIGTERM and waits up to STOP_TIMEOUT_MS for
 * the process to actually exit (escalating to SIGKILL once, at the
 * deadline) before clearing the registry — a caller reading `status`
 * immediately after `stop` returns sees the real, settled state, not a
 * brief window where the OS process is still alive. Reports
 * `alreadyStopped: true` (not an error) when no registry entry exists or
 * its pid is already dead — stopping something already stopped is a
 * no-op, not a failure.
 */
export function stopGateway(fgosDir) {
  const lock = acquireGatewayLock(fgosDir);
  try {
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

    // Graceful phase: wait up to STOP_TIMEOUT_MS for SIGTERM to take
    // effect. If it does not, escalate to SIGKILL and give THAT its own
    // full wait window too — a real bug caught writing this fix: checking
    // liveness only once, immediately after sending SIGKILL, and giving
    // up right away if it had not been reaped that exact instant, which
    // treated a real (if brief) kernel delay as "still alive forever".
    if (!waitUntilDeadOrDeadline(entry.pid, Date.now() + STOP_TIMEOUT_MS)) {
      try {
        process.kill(entry.pid, 'SIGKILL');
      } catch (err) {
        if (err.code !== 'ESRCH') throw new GatewayControlError(`sending SIGKILL to gateway pid ${entry.pid} failed: ${err.message}`, { pid: entry.pid });
      }
      waitUntilDeadOrDeadline(entry.pid, Date.now() + STOP_TIMEOUT_MS); // best-effort; proceed regardless of the outcome
    }

    writeRegistry(fgosDir, null);
    return { alreadyStopped: false, pid: entry.pid, port: entry.port };
  } finally {
    lock.release();
  }
}

/**
 * Read-only status: registry contents, real pid liveness, plus a real
 * HTTP reachability check against `/v1/contract` (the one unauthenticated
 * endpoint, per the contract's own top-level note) — never a report
 * derived from the registry alone, which could go stale the moment the
 * process crashes without anyone calling `stop`. The reachability fetch
 * carries an explicit timeout (tsk-2n2) — a gateway that is alive but
 * hung must still make `status` return promptly with `reachable: false`,
 * not hang the caller indefinitely.
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
    const res = await fetch(`http://127.0.0.1:${entry.port}/v1/contract`, { signal: AbortSignal.timeout(STATUS_FETCH_TIMEOUT_MS) });
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
