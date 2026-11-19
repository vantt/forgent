// Execution's one Node seam: what a Node caller above the Execution tier needs to reach the native unit run.
// Tier 0, so every layer may import it; it imports only Node built-ins.
//
// It holds the two error classes a caller branches on with `instanceof` (one declaration each, re-exported by
// their old modules, so an error thrown in process and one rethrown from a native result are the same class),
// the admission peer server (the Workflow's case admission port served as framed JSON lines over a stream pair,
// `packages/execution/contracts/admission-peer/admission-peer.v1.json`), and the rethrow of a native `run-unit`
// error result (`packages/execution/contracts/unit-run/run-unit.v1.json`).
import readline from 'node:readline';

export function commonDottedParent(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return '';
  if (paths.length === 1) return paths[0];
  const split = paths.map((p) => p.split('.'));
  const first = split[0];
  const common = [];
  for (let i = 0; i < first.length; i++) {
    const seg = first[i];
    if (split.every((p) => p[i] === seg)) {
      common.push(seg);
    } else {
      break;
    }
  }
  return common.join('.');
}

function deriveSubpath(paths, path) {
  const allPaths = paths?.length ? paths : (path ? [path] : []);
  if (allPaths.length === 0) return undefined;
  if (allPaths.length === 1) {
    return allPaths[0].replace(/^runner\./, '');
  }
  const common = commonDottedParent(allPaths);
  return common.replace(/^runner\./, '') || undefined;
}

/** The error every runner-config and dispatch-admission refusal raises. */
export class RunnerConfigError extends Error {
  constructor(message, { code, phase, path, paths, detail } = {}) {
    super(message);
    this.name = 'RunnerConfigError';
    this.category = 'validation';
    if (code !== undefined) this.code = code;
    if (phase !== undefined) this.phase = phase;
    if (path !== undefined) this.path = path;
    if (paths !== undefined) this.paths = paths;
    else if (path !== undefined) this.paths = [path];
    if (detail !== undefined) this.detail = detail;
  }

  get subpath() {
    return deriveSubpath(this.paths, this.path);
  }
}

/** The refusal a unit run throws when the case admission port refuses; the port's own answer rides along as `refusal`. */
export class CaseAdmissionRefusedError extends RunnerConfigError {
  constructor(refusal) {
    super(`case admission refused ${refusal.code}: ${refusal.condition}`, { code: refusal.code });
    this.name = 'CaseAdmissionRefusedError';
    this.refusal = refusal;
  }
}

/** The prefix of an admission peer message line; any other line on the channel is stray output. */
export const ADMISSION_PEER_PREFIX = '\u001eFGOS-ADMISSION-PEER ';
/** The protocol number every admission peer frame carries. */
export const ADMISSION_PEER_PROTOCOL = 1;
export const HOST_VERSION_MISMATCH = 'host-version-mismatch';

const frame = (message) => `${ADMISSION_PEER_PREFIX}${JSON.stringify(message)}\n`;

/** How each operation of the peer protocol calls the Node port: the port's own signatures. */
const OPERATIONS = Object.freeze({
  resolveBinding: (port, payload) => port.resolveBinding(payload),
  admit: (port, payload) => port.admit(payload),
  recheckEffect: (port, { reservationId, caseId, paths }) => port.recheckEffect(reservationId, { caseId, paths }),
  settle: (port, { reservationId, settle }) => port.settle(reservationId, settle),
  activityUnitOf: (port, payload) => port.activityUnitOf(payload),
  confinedWriteRefusal: (port, payload) => port.confinedWriteRefusal(payload),
});

/**
 * Serves `port` to a unit run over `input` (the run's requests) and `output` (the answers), one request at a time,
 * until `input` ends. `port` carries the operations the run may ask (`resolveBinding`, `admit`, `recheckEffect`,
 * `settle` of a case admission port, plus `activityUnitOf` and `confinedWriteRefusal`); an operation it lacks is
 * answered with an error, never guessed. `events` receives the two acknowledged events (`onUnitRunCreated(unitRunId)`,
 * `onCaseAdmitted(caseId, reservationId)`). Resolves once `input` ends.
 */
export async function serveAdmissionPeer(port, input, output, events = {}) {
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.startsWith(ADMISSION_PEER_PREFIX)) continue;
    let message;
    try {
      message = JSON.parse(line.slice(ADMISSION_PEER_PREFIX.length));
    } catch {
      continue;
    }
    output.write(frame(await answer(port, message, events)));
  }
}

async function answer(port, message, events) {
  const id = message?.id ?? null;
  const fail = (code, text) => ({ protocol: ADMISSION_PEER_PROTOCOL, id, error: { code, message: text } });
  if (message?.protocol !== ADMISSION_PEER_PROTOCOL) {
    return fail(HOST_VERSION_MISMATCH, `${HOST_VERSION_MISMATCH}: the run speaks protocol ${message?.protocol ?? 'none'}, this peer ${ADMISSION_PEER_PROTOCOL}`);
  }
  const { op, payload = {} } = message;
  try {
    if (op === 'event') {
      const data = payload?.data ?? {};
      if (payload?.event === 'unitRunCreated') await events.onUnitRunCreated?.(data.unitRunId);
      else if (payload?.event === 'caseAdmitted') await events.onCaseAdmitted?.(data.caseId, data.reservationId);
      else return fail('unknown-event', `the admission peer knows no event "${payload?.event}"`);
      return { protocol: ADMISSION_PEER_PROTOCOL, id, result: { acknowledged: true } };
    }
    const call = Object.hasOwn(OPERATIONS, op) ? OPERATIONS[op] : null;
    if (call === null) return fail('unknown-operation', `the admission peer knows no operation "${op}"`);
    if (typeof port?.[op] !== 'function') return fail('operation-not-served', `the admission peer serves no "${op}"`);
    const result = await call(port, payload);
    return { protocol: ADMISSION_PEER_PROTOCOL, id, result: result === undefined ? null : result };
  } catch (err) {
    return fail(typeof err?.code === 'string' && err.code ? err.code : 'peer-operation-failed', err?.message ?? String(err));
  }
}

/**
 * The classes the engine gives a failed port, Git, record or randomness call. Node threw each of those as an error
 * without an `errorClass`, so the rethrown error carries none and a caller reading `errorClass || 'error'` (the fanout
 * batch) reads `error`, as it did.
 */
const CLASSLESS_IN_NODE = new Set([
  'case-admission-port-failed',
  'canonical-json',
  'error',
  'git-error',
  'lock-registry-invalid',
  'random-unavailable',
  'unit-history-unreadable',
  'unit-record-not-written',
]);

/**
 * The error a native `run-unit` error result stands for, as the Node unit run threw it: an instance of the class its
 * tag names (`CaseAdmissionRefusedError`, `RunnerConfigError`, else `Error`) with that class's fields. Neither named
 * class carries an `errorClass`; any other error carries the result's class (`custody-predecessor-unknown` and the
 * other run supervisor classes) unless it is one Node threw without one.
 */
export function runUnitErrorOf(result) {
  const error = result?.error ?? {};
  const fields = error.fields && typeof error.fields === 'object' ? error.fields : {};
  let thrown;
  if (error.tag === 'CaseAdmissionRefusedError') {
    thrown = new CaseAdmissionRefusedError(error.refusal ?? { code: error.code, condition: error.message });
    thrown.message = error.message;
  } else if (error.tag === 'RunnerConfigError') {
    thrown = new RunnerConfigError(error.message, {
      ...(error.code !== undefined ? { code: error.code } : {}),
      ...(error.phase !== undefined ? { phase: error.phase } : {}),
    });
  } else {
    thrown = new Error(error.message ?? 'run-unit failed');
    if (error.code !== undefined) thrown.code = error.code;
    if (error.phase !== undefined) thrown.phase = error.phase;
  }
  for (const [key, value] of Object.entries(fields)) {
    // `message` and `stack` are the error's own; `subpath` is derived from `path` and `paths`.
    if (key === 'message' || key === 'stack' || key === 'subpath') continue;
    thrown[key] = value;
  }
  if (error.tag === 'Error' && typeof error.errorClass === 'string' && !CLASSLESS_IN_NODE.has(error.errorClass)) {
    thrown.errorClass = error.errorClass;
  }
  return thrown;
}
