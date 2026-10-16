// driver.mjs -- the only module of the facade that knows there is a Rust
// host binary and a file descriptor. It finds the binary once per process
// (same rule as the writer identity: FGOS_HOST_BIN, then the activation),
// runs `fgos internal lock-fd` / `fgos internal state-root`, asks the
// guarantee of a lock directory once per directory, and scans /proc for the
// processes that hold a lock description. Nothing here decides a lock
// result: it carries the route's answer or names why there is none.
//
// There is no fallback to a lock implemented in Node: without a usable
// driver every acquire fails with `lock-driver-unavailable`.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { HolderLockError, PROTOCOL, parseRouteLine } from './protocol.mjs';

const MAX_OUTPUT_BYTES = 64 * 1024;
/** Bound for the route calls that neither wait nor kill: guarantee, state root, probe, borrowed check. */
export const ROUTE_CALL_TIMEOUT_MS = 2000;
/** Headroom added to every bounded wait, so the helper is only killed when it really hung. */
export const ROUTE_SLACK_MS = 1000;

let resolvedBin = null;

/**
 * The host binary, resolved once per process on first success. `fgosDir`
 * and `cwd` only matter for that first resolution (the activation next to
 * the store, then the nearest activation above cwd). No binary -> the named
 * error, with every place looked at.
 */
export function hostBin({ fgosDir, cwd } = {}) {
  if (resolvedBin) return resolvedBin;
  const { bin, tried } = resolveActiveHostBin({ fgosDir, cwd });
  if (!bin) {
    throw new HolderLockError(
      'lock-driver-unavailable',
      `no fgos host binary found (tried: ${tried.join('; ')}); run through the \`fgos\` command of an activated workspace, or set FGOS_HOST_BIN to a host binary`,
      { reason: 'no-host-binary', tried },
    );
  }
  resolvedBin = bin;
  return bin;
}

/** The child's environment: this process's own, minus the invocation
 * record path, so an internal route never writes a record. */
export function routeEnv(env = process.env) {
  const child = { ...env };
  delete child.FGOS_INVOCATION_RECORD_PATH;
  return child;
}

function unavailable(reason, detail, extra = {}) {
  return new HolderLockError('lock-driver-unavailable', detail, { reason, ...extra });
}

/** Turn a finished child (spawnSync result, or the same fields collected
 * from spawn) into the route's parsed line, or throw the named error. A
 * child this process killed on its own deadline comes back as
 * `{ result: 'killed' }`: nothing was acquired, the caller closes its fd. */
function interpretRoute({ status, signal, stdout, stderr, error, timedOut }, bin, verb) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw unavailable('no-host-binary', `cannot run ${bin} (${error.code})`, { tried: [bin] });
  }
  if (timedOut || (error && error.code === 'ETIMEDOUT')) {
    return { v: PROTOCOL, protocol: PROTOCOL, result: 'killed' };
  }
  if (error) {
    throw new HolderLockError('lock-route-error', `${bin} ${verb} failed to run: ${error.message}`, { cause: error.code ?? null });
  }
  const text = String(stdout ?? '');
  if (text.trim() === '') {
    const err = String(stderr ?? '').trim();
    if (/unknown verb "internal"/.test(err)) {
      throw unavailable('host-version-mismatch', `${bin} has no "internal" route: the active release is older than this payload; restage/activate it (fgctl), or set FGOS_HOST_BIN to a host built from this checkout`);
    }
    if (/host-version-mismatch/.test(err)) {
      throw unavailable('host-version-mismatch', `${bin} ${verb} refused protocol ${PROTOCOL}: ${err.slice(0, 300)}`);
    }
    const how = signal ? `signal ${signal}` : `exit ${status}`;
    throw new HolderLockError('lock-route-bad-output', `${bin} ${verb} printed nothing (${how})${err ? `: ${err.slice(0, 300)}` : ''}`, { status, signal, stderr: err.slice(0, 300) });
  }
  const line = parseRouteLine(text, bin);
  if (line.result === 'error') {
    if (line.code === 'host-version-mismatch') throw unavailable('host-version-mismatch', `${bin} ${verb}: ${line.message}`);
    if (line.code === 'usage') throw new HolderLockError('lock-route-usage', `${bin} ${verb}: ${line.message}`, { argv: verb });
    throw new HolderLockError('lock-route-error', `${bin} ${verb}: ${line.message}`, { routeCode: line.code, status });
  }
  return line;
}

function lockFdArgv(args) {
  return ['internal', 'lock-fd', '--protocol', String(PROTOCOL), ...args];
}

/**
 * Run `fgos internal lock-fd <args>` and wait. `fd`, when given, is handed to
 * the child at slot 3 (the one moment the description is not close-on-exec).
 * The child is killed with SIGKILL at `timeoutMs`; when this returns the
 * helper is dead and reaped, whatever happened.
 */
export function runLockRouteSync({ bin, args, fd, timeoutMs, env = routeEnv() }) {
  const stdio = fd === undefined ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe', fd];
  const res = spawnSync(bin, lockFdArgv(args), {
    env,
    encoding: 'utf8',
    stdio,
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
  });
  return interpretRoute(res, bin, `lock-fd ${args.join(' ')}`);
}

/** The async twin of runLockRouteSync: same argv, same fd mapping, same
 * SIGKILL at `timeoutMs`; resolves with the parsed line once the child
 * has exited and its output is drained. */
export function runLockRoute({ bin, args, fd, timeoutMs, env = routeEnv() }) {
  const verb = `lock-fd ${args.join(' ')}`;
  return new Promise((resolve, reject) => {
    const settle = (result) => {
      try {
        resolve(interpretRoute(result, bin, verb));
      } catch (err) {
        reject(err);
      }
    };
    const stdio = fd === undefined ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe', fd];
    let child;
    try {
      child = spawn(bin, lockFdArgv(args), { env, stdio, windowsHide: true });
    } catch (error) {
      settle({ error });
      return;
    }
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let spawnError = null;
    let settled = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk; });
    child.stderr.on('data', (chunk) => { if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk; });
    child.on('error', (error) => {
      spawnError = error;
      // A spawn failure (ENOENT) emits no 'close' with a status worth reading.
      if (!settled && (error.code === 'ENOENT' || error.code === 'EACCES')) {
        settled = true;
        clearTimeout(timer);
        settle({ error });
      }
    });
    child.on('close', (status, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      settle({ status, signal, stdout, stderr, error: spawnError, timedOut });
    });
  });
}

const guarantees = new Map();

/**
 * The driver's guarantee for the directory `lockPath` lives in, asked of
 * the route once per directory and cached for the process. The directory
 * must exist (the route reads its filesystem).
 */
export function guaranteeFor(lockPath, { fgosDir } = {}) {
  const dir = path.resolve(path.dirname(lockPath));
  const cached = guarantees.get(dir);
  if (cached) return cached;
  const bin = hostBin({ fgosDir });
  const line = runLockRouteSync({ bin, args: ['--guarantee', path.resolve(lockPath)], timeoutMs: ROUTE_CALL_TIMEOUT_MS });
  if (line.result === 'unavailable') {
    throw unavailable(line.reason, `${dir}: ${line.detail}`, { lockDir: dir });
  }
  if (line.result !== 'guarantee' || !line.guarantee || typeof line.guarantee !== 'object') {
    throw new HolderLockError('lock-route-bad-output', `${bin} --guarantee answered ${JSON.stringify(line.result)}`, { lockDir: dir });
  }
  guarantees.set(dir, line.guarantee);
  return line.guarantee;
}

/**
 * The guarantee of `lockPath`'s directory when the driver can exclude there;
 * the named `lock-driver-unavailable` otherwise (a network filesystem gives
 * `none`, a platform without a driver gives `unsupported`).
 */
export function assertDriverUsable(lockPath, opts = {}) {
  const guarantee = guaranteeFor(lockPath, opts);
  const dir = path.dirname(lockPath);
  if (guarantee.exclusion === 'none') {
    throw unavailable('unsupported-filesystem', `${dir}: the ${guarantee.driver} driver gives no exclusion on this filesystem (${(guarantee.notes ?? []).join('; ')})`, { lockDir: dir, guarantee });
  }
  if (guarantee.exclusion === 'unsupported') {
    throw unavailable('unsupported-platform', `${dir}: no holder-lock driver on ${guarantee.platform} (${(guarantee.notes ?? []).join('; ')})`, { lockDir: dir, guarantee });
  }
  return guarantee;
}

/** Run `fgos internal state-root` once and return `{ stateRoot, lockRoot, source }`.
 * `env` is the environment the root is resolved FROM (the caller's, by
 * default this process's); it reaches the route minus the invocation
 * record path, like every other route call. */
export function runStateRootRoute({ fgosDir, env = process.env } = {}) {
  const bin = hostBin({ fgosDir });
  const res = spawnSync(bin, ['internal', 'state-root', '--protocol', String(PROTOCOL)], {
    env: routeEnv(env),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: ROUTE_CALL_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
  });
  const line = interpretRoute(res, bin, 'state-root');
  // A killed helper is a route that hung, not a lock result: nothing to keep.
  if (line.result === 'killed') {
    throw new HolderLockError('lock-route-error', `${bin} state-root did not answer within ${ROUTE_CALL_TIMEOUT_MS} ms and was killed`);
  }
  if (typeof line.stateRoot !== 'string' || typeof line.lockRoot !== 'string' || typeof line.source !== 'string') {
    throw new HolderLockError('lock-route-bad-output', `${bin} state-root answered without stateRoot/lockRoot/source: ${String(res.stdout ?? '').slice(0, 200)}`);
  }
  return { stateRoot: line.stateRoot, lockRoot: line.lockRoot, source: line.source };
}

function fdTargetMatches(target, real) {
  return target === real || target === `${real} (deleted)`;
}

/**
 * The processes that hold a description of `lockPath` right now, as the
 * kernel shows them. Linux: every pid whose /proc/<pid>/fd has an entry
 * pointing at the file (processes of another user are skipped: they cannot
 * have inherited this process's description). Elsewhere: unlistable.
 * Returns `{ kind: 'list', pids }` or `{ kind: 'unlistable', reason }`.
 */
export function descriptionHolders(lockPath, { excludePid } = {}) {
  if (process.platform !== 'linux') return { kind: 'unlistable', reason: `no /proc fd table on ${process.platform}` };
  let real;
  try {
    real = fs.realpathSync(lockPath);
  } catch (err) {
    return { kind: 'unlistable', reason: `cannot resolve ${lockPath}: ${err.code}` };
  }
  const pids = [];
  let entries;
  try {
    entries = fs.readdirSync('/proc');
  } catch (err) {
    return { kind: 'unlistable', reason: `cannot read /proc: ${err.code}` };
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    if (pid === excludePid) continue;
    let fds;
    try {
      fds = fs.readdirSync(`/proc/${entry}/fd`);
    } catch {
      continue;
    }
    for (const fd of fds) {
      let target;
      try {
        target = fs.readlinkSync(`/proc/${entry}/fd/${fd}`);
      } catch {
        continue;
      }
      if (fdTargetMatches(target, real)) {
        pids.push(pid);
        break;
      }
    }
  }
  return { kind: 'list', pids };
}

/** One sweep: SIGKILL every process other than `excludePid` that still holds
 * a description of `lockPath`. Returns the pids signalled and the pids this
 * process could not signal (another user's, or already gone). */
export function killDescriptionHoldersOnce(lockPath, { excludePid }) {
  const holders = descriptionHolders(lockPath, { excludePid });
  if (holders.kind !== 'list') return { listable: false, killed: [], refused: [] };
  const killed = [];
  const refused = [];
  for (const pid of holders.pids) {
    try {
      process.kill(pid, 'SIGKILL');
      killed.push(pid);
    } catch (err) {
      if (err.code !== 'ESRCH') refused.push(pid);
    }
  }
  return { listable: true, killed, refused };
}
