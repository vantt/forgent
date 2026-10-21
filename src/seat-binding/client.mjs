// client.mjs -- thin Node client of `fgos internal seat-binding`.
//
// One process per call: the request goes to the host binary on stdin, one JSON
// line comes back. Every decision (tier, ranking, refusal, explanation) lives
// in the Rust crate; this module only carries the call and fails closed. There
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
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { stateLockHeld } from '../util/state-lock-held.mjs';
import { OWN_PAYLOAD_ROOT, releasePayloadRoot, realpathOrNull } from '../run-supervisor/payload-root.mjs';
import { routeEnv } from '../holder-lock/driver.mjs';

export const PROTOCOL = 1;
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
  if (error) {
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
    if (line.code === 'host-version-mismatch') throw new SeatBindingError('host-version-mismatch', `${bin} seat-binding ${op}: ${line.message}`);
    throw new SeatBindingError('seat-binding-route-rejected', `${bin} seat-binding ${op}: ${line.code}: ${line.message}`);
  }
  if (line.protocol !== PROTOCOL) {
    throw new SeatBindingError('host-version-mismatch', `${bin} seat-binding ${op} speaks protocol ${line.protocol}, this payload speaks ${PROTOCOL}`);
  }
  return line;
}

/**
 * createSeatBindingClient({ hostBin, cwd, fgosDir, payloadRoot, timeoutMs }) ->
 *   { bindSeat(request), tierLadder(), hostBin() }
 *
 * `bindSeat(request)` takes the crate's BindInput (the facade collects the
 * ask, config, peers, walk, accountView, launchView and `now`) and returns the
 * crate's BindOutput plus `hostVersion`. A refusal comes back as a result
 * (`ok: false`, `refusal`), not as an exception: it is a decision. The host is
 * resolved once per client.
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
    if (stateLockHeld()) {
      throw new SeatBindingError(
        'seat-binding-in-lock',
        'a seat binding would exec the host while the state lock is held; bind before taking the lock',
      );
    }
    const hostPath = bin();
    const res = spawnSync(hostPath, ['internal', 'seat-binding', op, '--protocol', String(PROTOCOL)], {
      input: JSON.stringify({ v: PROTOCOL, ...body }),
      env: routeEnv(),
      encoding: 'utf8',
      maxBuffer: MAX_OUTPUT_BYTES,
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      windowsHide: true,
    });
    return interpret(res, hostPath, op);
  };

  return {
    hostBin: bin,
    bindSeat(request) {
      const line = call('bind', { input: { protocol: PROTOCOL, ...request } });
      if (!line.output || typeof line.output.ok !== 'boolean' || (line.result !== (line.output.ok ? 'ok' : 'refused'))) {
        throw new SeatBindingError('seat-binding-route-bad-output', `${bin()} seat-binding bind answered without a bind output`);
      }
      return { ...line.output, hostVersion: line.hostVersion };
    },
    tierLadder() {
      const line = call('ladder', {});
      if (line.result !== 'ok' || !Array.isArray(line.ladder?.vocabulary)) {
        throw new SeatBindingError('seat-binding-route-bad-output', `${bin()} seat-binding ladder answered without a ladder`);
      }
      return { ...line.ladder, hostVersion: line.hostVersion };
    },
  };
}

let defaultClient = null;
const client = () => (defaultClient ??= createSeatBindingClient());

export function bindSeat(request) {
  return client().bindSeat(request);
}

export function tierLadder() {
  return client().tierLadder();
}

/** For tests: forget the host the default client resolved. */
export function resetSeatBindingClient() {
  defaultClient = null;
}

