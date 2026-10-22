// gateway-control.mjs — one-door lifecycle for the fgos gateway
// (REST API + web dashboard, apps/fgos-gateway/src/gateway.rs) as a detached
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
// tsk-2n2 (real gap found reviewing tsk-31v): `start`/`stop` run their
// whole read-check-write sequence under the `gateway` kernel lock
// (`.fgos/locks/gateway.lock`, src/holder-lock) — two concurrent
// `fgos gateway start` calls used to both pass the not-running check
// before either wrote the registry, AND both appended to the SAME fixed
// log path, so one invocation's startup-confirmation poll could see the
// OTHER invocation's process's "listening on" line and record the wrong
// pid. The kernel releases the lock when its holder dies, so there is no
// TTL to size against a cold `cargo build --release` plus startup
// confirmation (60-90s). Each `start` also gets its own uniquely-named
// log file (timestamp+pid) as a second, independent fix — no two starts
// ever share a log file even in a hypothetical future caller that
// bypasses the lock.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { resolveLogsDir } from './paths.mjs';
import { observe, judge, signalByIdentity } from './dispatch/process-identity.mjs';
import { acquireSync, createLockScope, lockHolders, resolveLock } from '../holder-lock/index.mjs';
import { replaceDurably } from '../native/door.mjs';
import { maintainEventStore } from '../event-store/maintenance.mjs';

const REGISTRY_FILE = 'gateway.json';
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

/** Synchronous backoff (no busy spin, no extra dependency). */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Poll (blocking, via sleepSync) while the process `record` names is
 * alive, until `deadline` (an absolute Date.now() timestamp) passes.
 * Returns the verdict it ended on: 'dead', 'unknown', or 'alive' at the
 * deadline. Shared by both the graceful (SIGTERM) and forced (SIGKILL)
 * wait phases in `stopGateway` — each phase gets its OWN full window,
 * since a signal taking effect is never instantaneous. */
function waitUntilDeadOrDeadline(record, deadline) {
  for (;;) {
    const verdict = judge(record);
    if (verdict !== 'alive' || Date.now() >= deadline) return verdict;
    sleepSync(STOP_POLL_MS);
  }
}

/** The identity tuple a registry entry carries; an old entry written before
 * identities were recorded is its bare pid, which judges `unknown` while live. */
const recordOf = (entry) => entry.record ?? entry;

/** Send `signal` to the recorded gateway only while it is still that process.
 * Returns 'sent', 'gone' (nothing was sent: the process is no longer the
 * recorded one) or 'unsupported' (no graceful signal on this platform). */
function signalGateway(entry, signal) {
  const outcome = signalByIdentity(recordOf(entry), signal);
  if (outcome === 'sent' || outcome === 'unsupported') return outcome;
  if (outcome === 'identity-mismatch' || outcome === 'not-found') return 'gone';
  throw new GatewayControlError(`sending ${signal} to gateway pid ${entry.pid} failed: ${outcome}`, { pid: entry.pid });
}

/** The first pid the kernel lists as holding `name`'s lock file, or null
 * where holders cannot be listed. Diagnostic only, for the timeout message. */
function lockHolderPid(name, params) {
  const holders = lockHolders(name, params);
  return holders.kind === 'list' && holders.pids.length > 0 ? holders.pids[0] : null;
}

/** Blocking exclusive acquire of the `gateway` kernel lock. Waits until it
 * wins or `timeoutMs` elapses — generous by default, since a competing
 * `start` can legitimately hold it through a cold cargo build. Returns a
 * handle with `release()`; callers MUST release in a `finally`. A holder
 * that dies releases at once. */
export function acquireGatewayLock(fgosDir, { timeoutMs = 120000 } = {}) {
  const params = { fgosDir };
  const res = acquireSync(createLockScope('gateway'), 'gateway', params, { waitMs: timeoutMs });
  if (res.result === 'acquired') return res.handle;
  const holderPid = lockHolderPid('gateway', params);
  const lockPath = resolveLock('gateway', params).v3Path;
  throw new GatewayControlError(
    `timed out acquiring gateway.lock at "${lockPath}" after ${timeoutMs}ms` + (holderPid ? ` (held by pid ${holderPid})` : ''),
    { lockPath, holderPid },
  );
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
  replaceDurably(fgosDir, path.basename(rp), `${JSON.stringify(entry, null, 2)}\n`, 0o644);
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

function gatewayCrateDir(repoRoot) {
  return path.join(repoRoot, 'apps', 'fgos-gateway');
}

function releaseBinaryPath(repoRoot) {
  return path.join(gatewayCrateDir(repoRoot), 'target', 'release', 'fgos-gateway');
}

/**
 * Start the gateway as a detached background process, under
 * the gateway lock for the whole check-build-spawn-confirm sequence
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
    const existingVerdict = existing ? judge(recordOf(existing)) : 'dead';
    if (existingVerdict === 'unknown') {
      throw new GatewayControlError(
        `gateway-start-identity-unknown: the registry names pid ${existing.pid} without a verifiable identity; confirm it is not a gateway, then delete ${registryPath(fgosDir)}`,
        { pid: existing.pid, port: existing.port },
      );
    }
    if (existingVerdict === 'alive') {
      throw new GatewayControlError(
        `gateway is already running (pid ${existing.pid}, port ${existing.port}) — stop it first with "fgos gateway stop" if you meant to restart it`,
        { pid: existing.pid, port: existing.port },
      );
    }

    const gatewayDir = gatewayCrateDir(repoRoot);
    if (!fs.existsSync(gatewayDir)) {
      throw new GatewayControlError(`no apps/fgos-gateway/ directory found at "${gatewayDir}" — this repo has no gateway to start`, { gatewayDir });
    }

    try {
      execFileSync('cargo', ['build', '--release', '--bin', 'fgos-gateway'], { cwd: gatewayDir, stdio: 'pipe', maxBuffer: BUILD_MAX_BUFFER });
    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString('utf8') : err.message;
      throw new GatewayControlError(`building the release binary failed: ${stderr}`, { gatewayDir });
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
      child = spawn(binaryPath, [], {
        cwd: gatewayDir,
        detached: true,
        stdio: ['ignore', logFd, logFd],
      });
    } finally {
      fs.closeSync(logFd);
    }
    // Detach fully: this Node process (the CLI invocation) is allowed to
    // exit without taking the gateway down with it.
    child.unref();

    // An absent or zombie child at this moment is the immediate exit named below.
    const seen = observe(child.pid);
    if (seen.kind === 'unreadable') {
      throw new GatewayControlError(`gateway-start-identity-unreadable: pid ${child.pid} cannot be observed (${seen.cause}); see "${logPath}"`, { logPath, pid: child.pid });
    }
    const { kind, ...identity } = seen;
    const record = kind === 'live' ? identity : null;
    const port = resolveConfiguredPort();
    const entry = {
      pid: child.pid,
      record,
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
      if (!record || judge(record) !== 'alive') {
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
 * Stop the running gateway, under the gateway lock (tsk-2n2 — the
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
    const record = recordOf(entry);
    const first = judge(record);
    if (first === 'dead') {
      writeRegistry(fgosDir, null);
      return { alreadyStopped: true, pid: entry.pid };
    }
    if (first === 'unknown') {
      throw new GatewayControlError(
        `gateway-stop-identity-unknown: the registry names pid ${entry.pid} without a verifiable identity; nothing was signalled. Confirm it is not a gateway, then delete ${registryPath(fgosDir)}`,
        { pid: entry.pid },
      );
    }

    // Graceful phase: wait up to STOP_TIMEOUT_MS for SIGTERM to take
    // effect. If it does not, escalate to SIGKILL and give THAT its own
    // full wait window too — a real bug caught writing this fix: checking
    // liveness only once, immediately after sending SIGKILL, and giving
    // up right away if it had not been reaped that exact instant, which
    // treated a real (if brief) kernel delay as "still alive forever".
    // Only a 'dead' verdict clears the registry.
    const settle = (signal) => {
      const sent = signalGateway(entry, signal);
      if (sent === 'unsupported') return 'alive';
      return sent === 'gone' ? judge(record) : waitUntilDeadOrDeadline(record, Date.now() + STOP_TIMEOUT_MS);
    };
    let verdict = settle('term');
    if (verdict === 'alive') verdict = settle('kill');
    if (verdict === 'unknown') {
      throw new GatewayControlError(
        `gateway-stop-unresolved: pid ${entry.pid} can no longer be judged after the signal; see ${entry.logPath}, then delete ${registryPath(fgosDir)} once it is gone`,
        { pid: entry.pid, logPath: entry.logPath },
      );
    }
    if (verdict === 'alive') {
      throw new GatewayControlError(`gateway-stop-failed: pid ${entry.pid} survived SIGKILL; see ${entry.logPath}`, { pid: entry.pid, logPath: entry.logPath });
    }

    writeRegistry(fgosDir, null);
    return { alreadyStopped: false, pid: entry.pid, port: entry.port };
  } finally {
    lock.release();
    // Shutdown seals what is still open (spec §16), outside the gateway lock.
    maintainEventStore(path.dirname(fgosDir), { shutdown: true });
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
  const verdict = judge(recordOf(entry));
  if (verdict === 'dead') {
    return { running: false, reachable: false, pid: entry.pid, port: entry.port, staleRegistry: true };
  }
  if (verdict === 'unknown') {
    return { running: null, reachable: false, pid: entry.pid, port: entry.port, staleRegistry: false, identity: 'unknown' };
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
