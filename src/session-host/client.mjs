// client.mjs -- thin Node client of `fgos internal session-host`.
//
// One process per operation: the request goes to the host binary on stdin, one JSON line comes
// back. Every decision (which adapter, which refusal, SIGTERM before
// the grace and SIGKILL after it) lives in the Rust crate; this module only carries the call. A
// port refusal (`unsupported`, `unknown`) is returned as the route gave it, never thrown.

import { spawn, spawnSync } from 'node:child_process';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';

const PROTOCOL = 1;
// A launch waits for the pane's shell to be ready and the launched process to be identified.
const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export class SessionHostError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'SessionHostError';
    this.code = code;
    Object.assign(this, extra);
  }
}

let resolvedHostBin = null;

function activeHostBin() {
  if (resolvedHostBin) return resolvedHostBin;
  const { bin, tried } = resolveActiveHostBin();
  if (!bin) {
    throw new SessionHostError(
      'session-host-no-host-binary',
      `no fgos host binary found (tried: ${tried.join('; ')}); run through an activated workspace or set FGOS_HOST_BIN`,
      { tried },
    );
  }
  resolvedHostBin = bin;
  return bin;
}

function interpret({ status, signal, stdout, stderr, error, timedOut }, bin, op) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw new SessionHostError('session-host-no-host-binary', `cannot run ${bin} (${error.code})`);
  }
  if (timedOut || (error && error.code === 'ETIMEDOUT')) {
    throw new SessionHostError('session-host-route-timeout', `${bin} session-host ${op} did not answer in time and was killed`);
  }
  if (error) {
    throw new SessionHostError('session-host-route-error', `${bin} session-host ${op} failed to run: ${error.message}`);
  }
  const text = String(stdout ?? '').trim();
  const err = String(stderr ?? '').trim();
  if (text === '') {
    if (/unknown verb "internal"/.test(err) || /unknown internal route/.test(err)) {
      throw new SessionHostError('host-version-mismatch', `${bin} has no session-host route: the active release is older than this payload; restage/activate it or set FGOS_HOST_BIN to a host built from this checkout`);
    }
    const how = signal ? `signal ${signal}` : `exit ${status}`;
    throw new SessionHostError('session-host-route-bad-output', `${bin} session-host ${op} printed nothing (${how})${err ? `: ${err.slice(0, 300)}` : ''}`);
  }
  let line;
  try {
    line = JSON.parse(text.split('\n').filter(Boolean).pop());
  } catch {
    throw new SessionHostError('session-host-route-bad-output', `${bin} session-host ${op} answered non-JSON: ${text.slice(0, 200)}`);
  }
  if (line.result === 'error') {
    // The route's own refusal codes keep their name (a terminal config below the measured floor is one); everything else it refuses is a usage error.
    const code = line.code === 'host-version-mismatch' || String(line.code).startsWith('terminal-config-') ? line.code : 'session-host-route-usage';
    throw new SessionHostError(code, `${bin} session-host ${op}: ${line.message}`, { routeMessage: line.message });
  }
  const { v: _v, protocol: _protocol, op: _op, ...result } = line;
  if (typeof result.result !== 'string') {
    throw new SessionHostError('session-host-route-bad-output', `${bin} session-host ${op} answered without a result: ${text.slice(0, 200)}`);
  }
  return result;
}


/** Runs the host binary once without blocking the event loop; resolves the raw result `interpret` reads. */
function spawnAsync(bin, argv, input, timeoutMs) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, argv, { env: routeEnv(), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    } catch (error) {
      resolve({ error });
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
    // Decode as a stream: a multi-byte character may straddle two chunks.
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT_BYTES) {
        spawnError = Object.assign(new Error('output exceeded the buffer'), { code: 'ENOBUFS' });
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', (chunk) => { if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk; });
    child.stdin.on('error', () => {});
    child.on('error', (error) => { spawnError = error; });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr, error: spawnError, timedOut });
    });
    child.stdin.end(input);
  });
}

/**
 * createSessionHost({ hostBin, herdrBin, env, config, timeoutMs, graceMs }) ->
 *   { open, launch, alive, front, retire, openAsync, retireAsync }
 *
 * `hostBin` defaults to the active release's host (resolved on first call). `herdrBin`, `env` and `config`
 * are the terminal driver's, as for Terminal Control (`config` the core settings the route accepts:
 * minCols, minRows, maxPanesPerTab, policy, ...). `graceMs` is how long a screenless process gets to leave after SIGTERM.
 *
 *   open(request)            -> { result: 'placed', placement } | refusal   (a slot, nothing started in it)
 *   launch(placement, spec)  -> { result: 'launched', identity } | { result: 'not-started', reason } | refusal
 *   alive(placement)         -> { result: 'live' | 'gone' | 'unknown' } | ...
 *   front(placement)         -> { result: 'fronted' } | refusal
 *   retire(placement, 'close' | 'retain') -> { result: 'retired' } | refusal
 *
 * `openAsync` and `retireAsync` do not block the event loop and are queued per group, as Terminal Control's
 * `allocateAsync` and `releaseAsync` were: two rounds of one batch never both open the batch's tab, and a
 * close waits behind the earlier opens of its group. The group of a close is the one the key was opened
 * under by this client, or `{ groupKey }`; a close of a key whose group is unknown is refused (rejected)
 * instead of running outside the queue. Another group, and `retain`, do not wait.
 */
export function createSessionHost({ hostBin, herdrBin, env, config, timeoutMs = DEFAULT_TIMEOUT_MS, graceMs } = {}) {
  const prepare = (op, request, extra) => {
    const body = { v: PROTOCOL, driver: 'herdr', timeoutMs, request, ...extra };
    if (herdrBin) body.herdrBin = herdrBin;
    if (env) body.env = env;
    if (config) body.config = config;
    if (graceMs !== undefined) body.graceMs = graceMs;
    const bin = hostBin ?? activeHostBin();
    return {
      bin,
      argv: ['internal', 'session-host', op, '--protocol', String(PROTOCOL), '--json'],
      input: JSON.stringify(body),
    };
  };
  const call = (op, request, extra = {}) => {
    const { bin, argv, input } = prepare(op, request, extra);
    const res = spawnSync(bin, argv, {
      input,
      env: routeEnv(),
      encoding: 'utf8',
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
    });
    return interpret(res, bin, op);
  };
  const callAsync = async (op, request) => {
    const { bin, argv, input } = prepare(op, request, {});
    return interpret(await spawnAsync(bin, argv, input, timeoutMs), bin, op);
  };

  // One chain per group; a failed call never blocks the next one.
  const chains = new Map();
  const queued = (group, run) => {
    const previous = chains.get(group) ?? Promise.resolve();
    const next = previous.then(run, run);
    const tail = next.catch(() => {});
    chains.set(group, tail);
    tail.then(() => {
      if (chains.get(group) === tail) chains.delete(group);
    });
    return next;
  };
  const groupOfKey = new Map();
  const retired = (key) => (result) => {
    if (result.result === 'retired') groupOfKey.delete(key);
    return result;
  };

  return {
    open: (request) => call('open', request),
    launch: (placement, spec) => call('launch', { placement, spec }),
    alive: (placement) => call('alive', { placement }),
    front: (placement) => call('front', { placement }),
    retire: (placement, disposition) => retired(placement.key)(call('retire', { placement, disposition })),
    openAsync(request) {
      const group = request.groupKey ?? request.key;
      groupOfKey.set(request.key, group);
      return queued(group, () => callAsync('open', request));
    },
    retireAsync(placement, disposition, { groupKey } = {}) {
      const request = { placement, disposition };
      if (disposition !== 'close') return callAsync('retire', request).then(retired(placement.key));
      const group = groupKey ?? groupOfKey.get(placement.key);
      if (!group) {
        return Promise.reject(new SessionHostError('session-host-unknown-group', `retire(close) of ${placement.key}: its groupKey is unknown to this client; pass { groupKey }`));
      }
      return queued(group, () => callAsync('retire', request)).then(retired(placement.key));
    },
  };
}
