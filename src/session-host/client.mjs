// client.mjs -- thin Node client of `fgos internal session-host`.
//
// One process per operation: the request goes to the host binary on stdin, one JSON line comes
// back. Every decision (which adapter, which refusal, how an opening text is typed, SIGTERM before
// the grace and SIGKILL after it) lives in the Rust crate; this module only carries the call. A
// port refusal (`unsupported`, `unknown`) is returned as the route gave it, never thrown.

import { spawnSync } from 'node:child_process';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';

const PROTOCOL = 1;
// A start with an opening waits for the agent's prompt (60 s) and then types and confirms the text.
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

function interpret({ status, signal, stdout, stderr, error }, bin, op) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw new SessionHostError('session-host-no-host-binary', `cannot run ${bin} (${error.code})`);
  }
  if (error && error.code === 'ETIMEDOUT') {
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
    const code = line.code === 'host-version-mismatch' ? line.code : 'session-host-route-usage';
    throw new SessionHostError(code, `${bin} session-host ${op}: ${line.message}`, { routeMessage: line.message });
  }
  const { v: _v, protocol: _protocol, op: _op, ...result } = line;
  if (typeof result.result !== 'string') {
    throw new SessionHostError('session-host-route-bad-output', `${bin} session-host ${op} answered without a result: ${text.slice(0, 200)}`);
  }
  return result;
}

/**
 * createSessionHost({ hostBin, herdrBin, env, timeoutMs, readyMs, graceMs }) ->
 *   { start, alive, front, retire }
 *
 * `hostBin` defaults to the active release's host (resolved on first call). `herdrBin` and `env` are
 * the terminal driver's, as for Terminal Control. `readyMs` is how long an agent gets to put its
 * prompt up before an opening text is typed; `graceMs` how long a screenless process gets to leave
 * after SIGTERM.
 *
 *   start(request, { cli })  -> { result: 'placed', placement } | refusal
 *   alive(placement)         -> { result: 'live' | 'gone' | 'unknown' } | ...
 *   front(placement)         -> { result: 'fronted' } | refusal
 *   retire(placement, 'close' | 'retain') -> { result: 'retired' } | refusal
 *
 * `cli` selects the agent-protocol adapter that types an opening; it defaults to the command's name.
 */
export function createSessionHost({ hostBin, herdrBin, env, timeoutMs = DEFAULT_TIMEOUT_MS, readyMs, graceMs } = {}) {
  const call = (op, request, extra = {}) => {
    const envelope = { v: PROTOCOL, driver: 'herdr', timeoutMs, request, ...extra };
    if (herdrBin) envelope.herdrBin = herdrBin;
    if (env) envelope.env = env;
    if (readyMs !== undefined) envelope.readyMs = readyMs;
    if (graceMs !== undefined) envelope.graceMs = graceMs;
    const bin = hostBin ?? activeHostBin();
    const res = spawnSync(bin, ['internal', 'session-host', op, '--protocol', String(PROTOCOL), '--json'], {
      input: JSON.stringify(envelope),
      env: routeEnv(),
      encoding: 'utf8',
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
    });
    return interpret(res, bin, op);
  };
  return {
    start: (request, { cli } = {}) => call('start', request, cli ? { cli } : {}),
    alive: (placement) => call('alive', { placement }),
    front: (placement) => call('front', { placement }),
    retire: (placement, disposition) => call('retire', { placement, disposition }),
  };
}
