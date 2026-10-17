// client.mjs -- thin Node client of `fgos internal terminal-control`.
//
// One process per operation: the request goes to the host binary on stdin,
// one JSON line comes back. Every decision (grouping, placement, what may be
// closed) lives in the Rust core; this module only carries the call. A port
// result (`unsupported`, `unknown` included) is returned as the route gave it.
//
// The one thing kept here is the promise queue per `groupKey` for the async
// `allocate` and `release(close)`: a close must not run while an allocate of
// the same group is still choosing a pane next to it, and two allocates of
// one group must see each other's pane. One queue per coordinating process;
// two processes on one group at worst make two same-named tabs, which is
// harmless.

import { spawn, spawnSync } from 'node:child_process';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { routeEnv } from '../holder-lock/driver.mjs';

export const PROTOCOL = 1;
const OPS = ['allocate', 'attach', 'launch', 'send', 'read', 'inspect', 'release', 'label', 'capabilities', 'reconcile-scan'];
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export class TerminalControlError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'TerminalControlError';
    this.code = code;
    Object.assign(this, extra);
  }
}

let resolvedHostBin = null;

/** The host binary, resolved once per process (the S6 rule): the active
 * release, or FGOS_HOST_BIN. */
function activeHostBin() {
  if (resolvedHostBin) return resolvedHostBin;
  const { bin, tried } = resolveActiveHostBin();
  if (!bin) {
    throw new TerminalControlError(
      'terminal-control-no-host-binary',
      `no fgos host binary found (tried: ${tried.join('; ')}); run through an activated workspace or set FGOS_HOST_BIN`,
      { tried },
    );
  }
  resolvedHostBin = bin;
  return bin;
}

function interpret({ status, signal, stdout, stderr, error, timedOut }, bin, op) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw new TerminalControlError('terminal-control-no-host-binary', `cannot run ${bin} (${error.code})`);
  }
  if (timedOut || (error && error.code === 'ETIMEDOUT')) {
    throw new TerminalControlError('terminal-control-route-timeout', `${bin} terminal-control ${op} did not answer in time and was killed`);
  }
  if (error) {
    throw new TerminalControlError('terminal-control-route-error', `${bin} terminal-control ${op} failed to run: ${error.message}`);
  }
  const text = String(stdout ?? '').trim();
  const err = String(stderr ?? '').trim();
  if (text === '') {
    if (/unknown verb "internal"/.test(err) || /unknown internal route/.test(err)) {
      throw new TerminalControlError('host-version-mismatch', `${bin} has no terminal-control route: the active release is older than this payload; restage/activate it or set FGOS_HOST_BIN to a host built from this checkout`);
    }
    const how = signal ? `signal ${signal}` : `exit ${status}`;
    throw new TerminalControlError('terminal-control-route-bad-output', `${bin} terminal-control ${op} printed nothing (${how})${err ? `: ${err.slice(0, 300)}` : ''}`);
  }
  let line;
  try {
    line = JSON.parse(text.split('\n').filter(Boolean).pop());
  } catch {
    throw new TerminalControlError('terminal-control-route-bad-output', `${bin} terminal-control ${op} answered non-JSON: ${text.slice(0, 200)}`);
  }
  if (line.result === 'error') {
    if (line.code === 'host-version-mismatch') throw new TerminalControlError('host-version-mismatch', `${bin} terminal-control ${op}: ${line.message}`);
    throw new TerminalControlError('terminal-control-route-usage', `${bin} terminal-control ${op}: ${line.message}`);
  }
  const { v, protocol, op: _op, ...result } = line;
  if (typeof result.result !== 'string') {
    throw new TerminalControlError('terminal-control-route-bad-output', `${bin} terminal-control ${op} answered without a result: ${text.slice(0, 200)}`);
  }
  return result;
}

/**
 * createTerminalControl({ hostBin, herdrBin, env, config, timeoutMs }) ->
 *   { allocate, attach, launch, send, read, inspect, release, label,
 *     capabilities, reconcileScan, allocateAsync, releaseAsync }
 *
 * `hostBin` defaults to the active release's host (resolved on first call).
 * `herdrBin` is the caller's resolved herdr binary; `env` the driver's
 * environment overrides (HERDR_SESSION, HERDR_SOCKET_PATH of a confined
 * round); `config` the optional core settings the route accepts
 * (minCols, minRows, maxPanesPerTab, policy, allocationGraceMs,
 * launchIdentifyTimeoutMs).
 */
export function createTerminalControl({ hostBin, herdrBin, env, config, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const bin = () => hostBin ?? activeHostBin();

  const prepare = (op, request) => {
    const envelope = { v: PROTOCOL, driver: 'herdr', request };
    if (herdrBin) envelope.herdrBin = herdrBin;
    if (env) envelope.env = env;
    if (config) envelope.config = config;
    const hostPath = bin();
    return {
      hostPath,
      argv: ['internal', 'terminal-control', op, '--protocol', String(PROTOCOL), '--json'],
      input: JSON.stringify(envelope),
    };
  };

  const callSync = (op, request = {}) => {
    const { hostPath, argv, input } = prepare(op, request);
    const res = spawnSync(hostPath, argv, {
      input,
      env: routeEnv(),
      encoding: 'utf8',
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
    });
    return interpret({ ...res, timedOut: res.error?.code === 'ETIMEDOUT' }, hostPath, op);
  };

  const callAsync = (op, request = {}) => {
    let prepared;
    try {
      prepared = prepare(op, request);
    } catch (error) {
      return Promise.reject(error);
    }
    const { hostPath, argv, input } = prepared;
    return new Promise((resolve, reject) => {
      const settle = (res) => {
        try {
          resolve(interpret(res, hostPath, op));
        } catch (error) {
          reject(error);
        }
      };
      let child;
      try {
        child = spawn(hostPath, argv, { env: routeEnv(), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      } catch (error) {
        settle({ error });
        return;
      }
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let spawnError = null;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);
      child.stdout.on('data', (chunk) => { if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk; });
      child.stderr.on('data', (chunk) => { if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk; });
      child.stdin.on('error', () => {});
      child.on('error', (error) => { spawnError = error; });
      child.on('close', (status, signal) => {
        clearTimeout(timer);
        settle({ status, signal, stdout, stderr, error: spawnError, timedOut });
      });
      child.stdin.end(input);
    });
  };

  // One chain per groupKey; a failed call never blocks the next one.
  const chains = new Map();
  const groupOfKey = new Map();
  const queued = (groupKey, run) => {
    const previous = chains.get(groupKey) ?? Promise.resolve();
    const next = previous.then(run, run);
    const tail = next.catch(() => {});
    chains.set(groupKey, tail);
    tail.then(() => {
      if (chains.get(groupKey) === tail) chains.delete(groupKey);
    });
    return next;
  };

  const client = {
    allocate: (request) => callSync('allocate', request),
    attach: (request) => callSync('attach', request),
    launch: (request) => callSync('launch', request),
    send: (request) => callSync('send', request),
    read: (request) => callSync('read', request),
    inspect: (request) => callSync('inspect', request),
    release: (request) => callSync('release', request),
    label: (request) => callSync('label', request),
    capabilities: () => callSync('capabilities', {}),
    reconcileScan: (request) => callSync('reconcile-scan', request),

    /** Queued per `request.groupKey`; remembers the key's group for `releaseAsync`. */
    allocateAsync(request) {
      groupOfKey.set(request.key, request.groupKey);
      return queued(request.groupKey, () => callAsync('allocate', request));
    },

    /** `release` that waits behind earlier allocate/close calls of the same
     * group. `groupKey` is taken from the earlier `allocateAsync` of the key,
     * or given as `{ ..., groupKey }` (never sent to the route). */
    releaseAsync({ groupKey, ...request }) {
      const group = groupKey ?? groupOfKey.get(request.key) ?? request.key;
      if (request.disposition !== 'close') return callAsync('release', request);
      return queued(group, () => callAsync('release', request));
    },
  };
  return client;
}

export { OPS as TERMINAL_CONTROL_OPS };
