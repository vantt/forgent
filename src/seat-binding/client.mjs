// client.mjs -- thin Node client of `fgos internal seat-binding` (protocol 2).
//
// One process per call: the request goes to the host binary on stdin, one JSON
// line comes back. Six ops: bind, explain, plan, preflight, digest and ladder.
// Every decision (tier, ranking, refusal, explanation, pre-admission facts,
// the seat config digest) lives in the Rust host; this module only carries the
// call and fails closed. There
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
    // A `usage` answer is an older host that does not know this protocol or op: this client only sends well-formed calls.
    if (line.code === 'host-version-mismatch' || line.code === 'usage') throw new SeatBindingError('host-version-mismatch', `${bin} seat-binding ${op}: ${line.message}`);
    throw new SeatBindingError('seat-binding-route-rejected', `${bin} seat-binding ${op}: ${line.code}: ${line.message}`);
  }
  if (line.protocol !== PROTOCOL) {
    throw new SeatBindingError('host-version-mismatch', `${bin} seat-binding ${op} speaks protocol ${line.protocol}, this payload speaks ${PROTOCOL}`);
  }
  if (line.result === 'failed') {
    const failure = line.failure ?? {};
    throw new SeatBindingError('seat-binding-failed', `${bin} seat-binding ${op}: ${failure.message ?? 'the derivation refused the request'}`, { failure });
  }
  return line;
}

/** The answer's `key` section, or a named bad-output error when the host answered without it. */
function section(line, key, bin, ok = (value) => value !== null && typeof value === 'object') {
  if (!ok(line[key])) throw new SeatBindingError('seat-binding-route-bad-output', `${bin} seat-binding ${line.op} answered without ${key}`);
  return line[key];
}

/**
 * createSeatBindingClient({ hostBin, cwd, fgosDir, payloadRoot, timeoutMs }) ->
 *   { bind(request), explain(request), plan(request), preflight(request), digest(request), tierLadder(), hostBin() }
 *
 * Every request carries the run's `runner` section (the host reads no config of its own). `bind` answers the
 * binding, which is `{ refused }` for a refusal (a decision, not an exception); `explain` the explanation
 * (`binding`, `output`, `launchView`, `walk`); `plan` the purpose binding of dispatch; `preflight` the
 * pre-admission facts; `digest` the seat config digest. A derivation the host refuses as a model error
 * (an override naming a tier no seat could take) throws `seat-binding-failed` with its `failure`
 * (`name`, `code`, `message`). The host is resolved once per client, and again when the resolved binary has gone.
 * `session.herdrPresent` is sent when the caller states it; `false` also runs the call without the herdr environment,
 * because the host's machine reads herdr from its own environment.
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
    const { session, ...rest } = body;
    const sent = session === undefined ? rest : { ...rest, session: { headless: session.headless === true, hasNativeAgent: session.hasNativeAgent === true, postureAtLaunch: session.postureAtLaunch === true, ...(session.pathEnv ? { pathEnv: session.pathEnv } : {}), ...(typeof session.herdrPresent === 'boolean' ? { herdrPresent: session.herdrPresent } : {}) } };
    const run = (hostPath) => spawnSync(hostPath, ['internal', 'seat-binding', op, '--protocol', String(PROTOCOL)], {
      input: JSON.stringify({ v: PROTOCOL, ...sent }),
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

  return {
    hostBin: bin,
    bind(request) {
      const line = call('bind', request);
      const binding = section(line, 'binding', bin());
      if (line.result !== (binding.refused ? 'refused' : 'ok')) {
        throw new SeatBindingError('seat-binding-route-bad-output', `${bin()} seat-binding bind answered a result that does not match its binding`);
      }
      return { binding, hostVersion: line.hostVersion };
    },
    explain(request) {
      const line = call('explain', request);
      return { ...section(line, 'explanation', bin()), hostVersion: line.hostVersion };
    },
    plan(request) {
      return section(call('plan', request), 'plan', bin());
    },
    preflight(request) {
      return section(call('preflight', request), 'preflight', bin());
    },
    digest(request) {
      return section(call('digest', request), 'digest', bin(), (value) => typeof value === 'string' && value !== '');
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

export const bind = (request) => client().bind(request);
export const explain = (request) => client().explain(request);
export const plan = (request) => client().plan(request);
export const preflight = (request) => client().preflight(request);
export const digest = (request) => client().digest(request);
export const tierLadder = () => client().tierLadder();

/** For tests: forget the host the default client resolved. */
export function resetSeatBindingClient() {
  defaultClient = null;
}
