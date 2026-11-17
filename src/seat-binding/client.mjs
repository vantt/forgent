// client.mjs -- thin Node client of `fgos internal seat-binding --protocol 2`.
//
// One process per call: the request goes to the host binary on stdin, one JSON
// line comes back. Every decision (the bind, its walk, what serves a purpose,
// the pre-admission facts, the seat config digest) lives in the Rust crates;
// this module only carries the call and fails closed. There
// is no JS policy fallback: a host without the route, an answer that is not
// the contract, a timeout, or a call made while this process holds a state
// lock each throw a named SeatBindingError, and no path returns a binding
// without the route having answered.
//
// Host trust: inside an activated release the activation's host answers and
// FGOS_HOST_BIN is ignored (a worker or a stray environment cannot point the
// bind at another binary). Outside one (a checkout, the dev door, tests) the
// ordinary resolution applies and FGOS_HOST_BIN is honoured.

import { spawnSync } from 'node:child_process';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { OWN_PAYLOAD_ROOT, releasePayloadRoot, realpathOrNull } from '../run-supervisor/payload-root.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';

export const PROTOCOL = 2;
/** Same bound as the other short host routes (src/util/host-bin.mjs). */
export const SEAT_BINDING_TIMEOUT_MS = 5_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export class SeatBindingError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'SeatBindingError';
    this.code = code;
    Object.assign(this, extra);
  }
}

/**
 * resolveSeatBindingHost({ cwd, fgosDir, payloadRoot }) -> { bin, tried, activated }
 *
 * `activated` is true when this payload is the one the workspace's activation
 * runs; then the activation host is the only answer. Otherwise the ordinary
 * resolution (FGOS_HOST_BIN first) applies. The doctor row calls this same
 * function, so it probes exactly the binary the client would run.
 */
export function resolveSeatBindingHost({ cwd = process.cwd(), fgosDir, payloadRoot = OWN_PAYLOAD_ROOT } = {}) {
  const activation = resolveActiveHostBin({ cwd, fgosDir, ignoreEnv: true });
  if (activation.bin) {
    const own = realpathOrNull(payloadRoot);
    const owner = releasePayloadRoot(activation.bin);
    if (own && owner && own === owner) return { ...activation, activated: true };
  }
  return { ...resolveActiveHostBin({ cwd, fgosDir }), activated: false };
}

function interpret({ status, signal, stdout, stderr, error }, bin, op) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw new SeatBindingError('seat-binding-no-host-binary', `cannot run ${bin} (${error.code})`);
  }
  if (error && error.code === 'ETIMEDOUT') {
    throw new SeatBindingError('seat-binding-route-timeout', `${bin} seat-binding ${op} did not answer in time and was killed`);
  }
  // EPIPE: the host ran and exited before reading the request (an older host refuses the verb at once);
  // its exit status and stderr still say why, so they are read below like any other answer.
  if (error && error.code !== 'EPIPE') {
    throw new SeatBindingError('seat-binding-route-bad-output', `${bin} seat-binding ${op} failed to run: ${error.message}`);
  }
  const text = String(stdout ?? '').trim();
  const err = String(stderr ?? '').trim();
  if (text === '') {
    if (/unknown verb "internal"/.test(err) || /unknown internal route/.test(err)) {
      throw new SeatBindingError('host-version-mismatch', `${bin} has no seat-binding route: the active release is older than this payload; restage/activate it or set FGOS_HOST_BIN to a host built from this checkout`);
    }
    const how = signal ? `signal ${signal}` : `exit ${status}`;
    throw new SeatBindingError('seat-binding-route-bad-output', `${bin} seat-binding ${op} printed nothing (${how})${err ? `: ${err.slice(0, 300)}` : ''}`);
  }
  let line;
  try {
    line = JSON.parse(text.split('\n').filter(Boolean).pop());
  } catch {
    throw new SeatBindingError('seat-binding-route-bad-output', `${bin} seat-binding ${op} answered non-JSON: ${text.slice(0, 200)}`);
  }
  if (line === null || typeof line !== 'object' || line.op !== op || typeof line.hostVersion !== 'string') {
    throw new SeatBindingError('seat-binding-route-bad-output', `${bin} seat-binding ${op} answered something that is not the route contract: ${text.slice(0, 200)}`);
  }
  if (line.result === 'error') {
    // An older host refuses this protocol by name, or does not know the operation at all (`usage`).
    if (line.code === 'host-version-mismatch' || line.code === 'usage') throw new SeatBindingError('host-version-mismatch', `${bin} seat-binding ${op}: ${line.message}`);
    throw new SeatBindingError('seat-binding-route-rejected', `${bin} seat-binding ${op}: ${line.code}: ${line.message}`);
  }
  if (line.protocol !== PROTOCOL) {
    throw new SeatBindingError('host-version-mismatch', `${bin} seat-binding ${op} speaks protocol ${line.protocol}, this payload speaks ${PROTOCOL}`);
  }
  if (line.result === 'failed') throw decisionError(line.failure);
  if (line.result !== 'ok') {
    throw new SeatBindingError('seat-binding-route-bad-output', `${bin} seat-binding ${op} answered result ${JSON.stringify(line.result)}`);
  }
  return line;
}

/**
 * A decision the host could not make, as the error class the Node callers catch: a runner refusal is a
 * RunnerConfigError carrying its code, a value out of range a RangeError; any other class keeps its name.
 */
function decisionError(failure) {
  const { name, code, message } = failure ?? {};
  if (name === 'RunnerConfigError') return new RunnerConfigError(message, code === undefined ? {} : { code });
  const error = name === 'RangeError' ? new RangeError(message) : new Error(message);
  if (typeof name === 'string' && name !== 'RangeError') error.name = name;
  if (code !== undefined) error.code = code;
  return error;
}

/**
 * createSeatBindingClient({ hostBin, cwd, fgosDir, payloadRoot, timeoutMs }) ->
 *   { bind, explain, plan, preflight, digest, tierLadder, hostBin }
 *
 * Each operation takes its request (every one but the ladder carries the `runner` section it is decided under)
 * and returns the answer body plus `hostVersion`. A refused seat is a result (`binding.refused`), not an exception;
 * a decision the request cannot make throws its error class (RunnerConfigError, RangeError, ...). The host is
 * resolved once per client, and again when the resolved binary has gone.
 */
export function createSeatBindingClient({ hostBin, cwd, fgosDir, payloadRoot, timeoutMs = SEAT_BINDING_TIMEOUT_MS } = {}) {
  let resolved = hostBin ?? null;
  const bin = () => {
    if (resolved) return resolved;
    const { bin: found, tried } = resolveSeatBindingHost({ cwd, fgosDir, payloadRoot });
    if (!found) {
      throw new SeatBindingError(
        'seat-binding-no-host-binary',
        `no fgos host binary found (tried: ${tried.join('; ')}); run through an activated workspace or set FGOS_HOST_BIN`,
        { tried },
      );
    }
    resolved = found;
    return found;
  };

  const call = (op, body) => {
    if (hotLockDepth() > 0) {
      throw new SeatBindingError(
        'seat-binding-in-lock',
        'a seat binding would exec the host while the hot mutex is held; bind before taking the lock',
      );
    }
    const run = (hostPath) => spawnSync(hostPath, ['internal', 'seat-binding', op, '--protocol', String(PROTOCOL)], {
      input: JSON.stringify({ v: PROTOCOL, ...body }),
      env: routeEnv(),
      encoding: 'utf8',
      maxBuffer: MAX_OUTPUT_BYTES,
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      windowsHide: true,
    });
    let hostPath = bin();
    let res = run(hostPath);
    // A host resolved earlier that is gone now (the release was switched or removed under a long-lived
    // process) is looked up once more; a host the caller named is never replaced.
    if (res.error?.code === 'ENOENT' && !hostBin) {
      resolved = null;
      hostPath = bin();
      res = run(hostPath);
    }
    return interpret(res, hostPath, op);
  };

  /** One operation whose answer must carry `field` (checked by `valid`), returned with the host version. */
  const answered = (op, field, valid) => (request) => {
    const { v: _v, protocol: _protocol, op: _op, result: _result, ...body } = call(op, request);
    if (!valid(body[field])) {
      throw new SeatBindingError('seat-binding-route-bad-output', `${bin()} seat-binding ${op} answered without ${field}`);
    }
    return body;
  };
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

  return {
    hostBin: bin,
    /** `{ runner, ask, session, walk, accountState?, now }` -> `{ binding, hostVersion }`. */
    bind: answered('bind', 'binding', isObject),
    /** The bind request -> `{ binding, policy?, ranked?, explain?, launchView?, walk, hostVersion }`. */
    explain: answered('explain', 'walk', Array.isArray),
    /** `{ runner, purpose, repoRoot, session, now }` -> `{ seat, hostVersion }`. */
    plan: answered('plan', 'seat', isObject),
    /** `{ runner, session, pin?, accountState?, now }` -> `{ preflight, hostVersion }`. */
    preflight: answered('preflight', 'preflight', isObject),
    /** `{ runner }` -> `{ config, digest, hostVersion }`. */
    digest: answered('digest', 'digest', (digest) => typeof digest === 'string'),
    tierLadder() {
      const line = call('ladder', {});
      if (!Array.isArray(line.ladder?.vocabulary)) {
        throw new SeatBindingError('seat-binding-route-bad-output', `${bin()} seat-binding ladder answered without a ladder`);
      }
      return { ...line.ladder, hostVersion: line.hostVersion };
    },
  };
}

let defaultClient = null;
const client = () => (defaultClient ??= createSeatBindingClient());

/** The default client: the host this payload resolves (see `resolveSeatBindingHost`). */
export function seatBindingClient() {
  return client();
}

/** For tests: forget the host the default client resolved. */
export function resetSeatBindingClient() {
  defaultClient = null;
}

