// Execution's one Node seam: what a Node caller above the Execution tier needs to reach the native unit run.
// Tier 0, so every layer may import it; it imports only Node built-ins.
//
// It holds the two error classes a caller branches on with `instanceof` (one declaration each, re-exported by
// their old modules, so an error thrown in process and one rethrown from a native result are the same class),
// the admission peer server (the Workflow's case admission port served as framed JSON lines over a stream pair,
// `packages/execution/contracts/admission-peer/admission-peer.v1.json`), and the rethrow of a native `run-unit`
// error result (`packages/execution/contracts/unit-run/run-unit.v1.json`), and the calls of the host's Execution
// operations (`fgos internal execution <op> --protocol 1`, `packages/execution/contracts/execution-routes/
// execution-routes.v1.json`): `executionOp`, `runUnitInHost` and `launchSessionInHost`, one host process per call,
// spawned asynchronously.
// It also serves the Execution Core helpers a caller above the tier asks in process (case paths, the unit-run
// record, the runner config, patterns, the unit and plan checks, hand-off names and digests, cancel and sweep),
// each one call of the native addon's `execution` namespace under the Node name it had.
// Besides Node built-ins it imports only the tier-0 host lookup (`src/util/host-bin-path.mjs`) and the tier-0
// addon door (`src/native/door.mjs`).
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';
import { DispatchError } from './dispatch-error.mjs';
import { withLegacyView } from './legacy-view.mjs';

import { nativeDoor } from './door.mjs';

export { DispatchError, withLegacyView };

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
    const answered = await answerPeerLine(port, line, events);
    if (answered !== null) output.write(answered);
  }
}

/** The framed answer to one line of the channel, or null for a line that is no peer message (stray output). */
async function answerPeerLine(port, line, events) {
  if (!line.startsWith(ADMISSION_PEER_PREFIX)) return null;
  let message;
  try {
    message = JSON.parse(line.slice(ADMISSION_PEER_PREFIX.length));
  } catch {
    return null;
  }
  return frame(await answer(port, message, events));
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
 * tag names (`CaseAdmissionRefusedError`, `RunnerConfigError`, `HolderLockError`, else `Error`) with that class's
 * fields. No named class carries an `errorClass`; any other error carries the result's class
 * (`custody-predecessor-unknown` and the other run supervisor classes) unless it is one Node threw without one.
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
  } else if (error.tag === 'HolderLockError') {
    // A holder-lock driver failure: the shape of src/holder-lock/protocol.mjs's HolderLockError, which this lower
    // layer cannot import; its `precondition` category is what the CLI exits by.
    thrown = new Error(error.message);
    thrown.name = 'HolderLockError';
    thrown.code = error.code;
    thrown.category = 'precondition';
  } else if (fields.name === 'DispatchError') {
    // A run supervisor DispatchError: its class is its code, its details its fields, all of them in `data` as the
    // constructor called with those details holds them.
    const details = Object.fromEntries(Object.entries(fields).filter(([key]) => !['name', 'message', 'stack'].includes(key)));
    thrown = new DispatchError(error.errorClass ?? error.code ?? 'error', error.message ?? 'run-unit failed', { ...details, ...(error.code !== undefined ? { code: error.code } : {}) });
  } else {
    thrown = new Error(error.message ?? 'run-unit failed');
    if (error.code !== undefined) thrown.code = error.code;
    if (error.phase !== undefined) thrown.phase = error.phase;
  }
  for (const [key, value] of Object.entries(fields)) {
    // `message` and `stack` are the error's own; `subpath` is derived from `path` and `paths`.
    if (key === 'message' || key === 'stack' || key === 'subpath' || (key === 'name' && thrown instanceof DispatchError)) continue;
    thrown[key] = value;
  }
  if (error.tag === 'Error' && typeof error.errorClass === 'string' && !CLASSLESS_IN_NODE.has(error.errorClass)) {
    thrown.errorClass = error.errorClass;
  }
  return thrown;
}

/** The prefix of the answer line of an Execution operation; every other line is a peer frame or stray output. */
export const EXECUTION_PREFIX = '\u001eFGOS-EXECUTION ';
/** The protocol of `fgos internal execution`. */
export const EXECUTION_PROTOCOL = 1;

/** A call of a host Execution operation that got no answer of the operation: no host, a dead host, a refusal. */
export class ExecutionRouteError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ExecutionRouteError';
    this.code = code;
  }
}

function hostBinOf(cwd) {
  const { bin, tried } = resolveActiveHostBin({ cwd });
  if (!bin) throw new ExecutionRouteError('execution-no-host-binary', `no fgos host binary to run the Execution operation: looked at ${tried.join(', ')}`);
  return bin;
}

/**
 * One host Execution operation: `payload` goes to `fgos internal execution <op> --protocol 1` on its stdin; the
 * answer line's `result` comes back. `port` (with `events`) is the case admission port the operation may ask over
 * the child's stdout and stdin; without one only the two events are served. The child is spawned asynchronously
 * and never through a shell. A child that ends without an answer resolves `{ ended: { code, signal, stderr } }`
 * for the caller to judge; a refusal of the route (usage, protocol, request) throws ExecutionRouteError.
 */
async function callHost(op, payload, { cwd = process.cwd(), port = {}, events = {} } = {}) {
  const bin = hostBinOf(cwd);
  const child = spawn(bin, ['internal', 'execution', op, '--protocol', String(EXECUTION_PROTOCOL)], {
    cwd,
    env: routeEnv(),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    if (stderr.length < 64 * 1024) stderr += chunk;
  });
  const ended = new Promise((resolve, reject) => {
    child.once('error', (err) => reject(new ExecutionRouteError('execution-no-host-binary', `cannot run ${bin}: ${err.message}`)));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  // A host that exits before it reads the request closes the pipe; its exit and stderr say why.
  child.stdin.on('error', () => {});
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  let answerLine = null;
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.startsWith(EXECUTION_PREFIX)) {
      try {
        answerLine = JSON.parse(line.slice(EXECUTION_PREFIX.length));
      } catch {
        answerLine = null;
      }
      continue;
    }
    const answered = await answerPeerLine(port, line, events);
    if (answered !== null && child.stdin.writable) child.stdin.write(answered);
  }
  child.stdin.end();
  const { code, signal } = await ended;
  if (answerLine === null) {
    if (/unknown internal route|unknown verb "internal"/.test(stderr)) {
      throw new ExecutionRouteError(HOST_VERSION_MISMATCH, `${bin} has no execution route: the active release is older than this payload`);
    }
    return { ended: { code, signal, stderr: stderr.trim().slice(0, 2000) } };
  }
  if (answerLine.protocol !== EXECUTION_PROTOCOL) {
    throw new ExecutionRouteError(HOST_VERSION_MISMATCH, `${HOST_VERSION_MISMATCH}: the host speaks protocol ${answerLine.protocol ?? 'none'}, this payload ${EXECUTION_PROTOCOL}`);
  }
  if (answerLine.error) {
    throw new ExecutionRouteError(answerLine.error.code ?? 'execution-route-failed', `fgos internal execution ${op}: ${answerLine.error.message ?? 'refused'}`);
  }
  return { result: answerLine.result };
}

/**
 * The result of one host Execution operation (`custody`, `verify`, `sweep-attempts`, `cancel`; the contract names
 * each payload and result). `options.caseAdmission` is the port `custody` asks `admit` of when its payload names a
 * proposal. A host that ends without an answer throws ExecutionRouteError `execution-route-no-answer`.
 */
export async function executionOp(op, payload, { cwd, caseAdmission } = {}) {
  const called = await callHost(op, payload, { cwd, port: caseAdmission ?? {} });
  if (called.ended) {
    const { code, signal, stderr } = called.ended;
    throw new ExecutionRouteError('execution-route-no-answer', `fgos internal execution ${op} ended without an answer (${signal ? `signal ${signal}` : `exit ${code}`})${stderr ? `: ${stderr}` : ''}`);
  }
  return called.result;
}

/**
 * `runUnit(request)` run by the host's engine: the same options (plain data; `caseAdmission`, `onUnitRunCreated`
 * and `onCaseAdmitted` are passed beside it) and the same result. An error result is rethrown as the class its tag
 * names (`runUnitErrorOf`), so `instanceof RunnerConfigError` holds for a refusal and an admission refusal. A host
 * that ends without an answer settles nothing. When a unit run may exist (a reservation was admitted and not settled,
 * `resumeUnitRunId` was given, or `onUnitRunCreated` was called) it throws ExecutionRouteError
 * `execution-route-unsettled` carrying `unsettled: { reservationId, unitRunId, code, signal, stderr }`: the unit run
 * and its reservation are left as they stand for the next caller to resume or sweep. Otherwise it throws
 * `execution-route-no-answer`.
 */
export async function runUnitInHost(request, { caseAdmission, onUnitRunCreated, onCaseAdmitted } = {}) {
  const BESIDE = new Set(['caseAdmission', 'onUnitRunCreated', 'onCaseAdmitted']);
  const options = Object.fromEntries(Object.entries(request ?? {}).filter(([key, value]) => value !== undefined && !BESIDE.has(key)));
  let admitted = null;
  let settled = false;
  let createdUnitRunId = null;
  const port = caseAdmission
    ? {
        ...Object.fromEntries(Object.keys(OPERATIONS).filter((op) => typeof caseAdmission[op] === 'function').map((op) => [op, caseAdmission[op].bind(caseAdmission)])),
        ...(typeof caseAdmission.settle === 'function'
          ? {
              settle: async (reservationId, settle) => {
                const done = await caseAdmission.settle(reservationId, settle);
                if (reservationId === admitted) settled = true;
                return done;
              },
            }
          : {}),
      }
    : {};
  const events = {
    onUnitRunCreated: (unitRunId) => {
      createdUnitRunId = unitRunId;
      onUnitRunCreated?.(unitRunId);
    },
    onCaseAdmitted: async (caseId, reservationId) => {
      admitted = reservationId;
      await onCaseAdmitted?.({ caseId, reservationId });
    },
  };
  const payload = {
    request: { contract: { id: 'run-unit-request', version: 1 }, options },
    admission: Boolean(caseAdmission),
  };
  const called = await callHost('run-unit', payload, { cwd: typeof options.cwd === 'string' ? options.cwd : process.cwd(), port, events });
  if (called.ended) {
    const { code, signal, stderr } = called.ended;
    const how = `${signal ? `signal ${signal}` : `exit ${code}`})${stderr ? `: ${stderr}` : ''}`;
    const unitRunId = createdUnitRunId ?? (typeof options.resumeUnitRunId === 'string' ? options.resumeUnitRunId : null);
    if ((admitted !== null && !settled) || unitRunId !== null) {
      const thrown = new ExecutionRouteError('execution-route-unsettled', `fgos internal execution run-unit ended without an answer after its unit run began, nothing settled (${how}`);
      thrown.unsettled = { reservationId: admitted, unitRunId, code, signal, stderr };
      throw thrown;
    }
    throw new ExecutionRouteError('execution-route-no-answer', `fgos internal execution run-unit ended without an answer (${how}`);
  }
  if (called.result?.ok === false) throw runUnitErrorOf(called.result);
  const result = called.result?.result;
  for (const seat of Array.isArray(result?.results) ? result.results : []) {
    if (seat?.runResult && typeof seat.runResult === 'object') withLegacyView(seat.runResult);
  }
  return result;
}

/**
 * `launchSessionAttempt(request)` run by the host's engine (`launch-session`): the same request (plain data) and the
 * same result, `{ placement: { host: 'terminal', key }, runDir, attemptId }`, once the supervisor bound the session.
 * A launch refusal is rethrown as the error Node's launch threw: `name` SessionLaunchError, its `code` and `message`,
 * and its extra fields (`refusal` of a refused lease, `launchState` of an unbound supervisor).
 */
export async function launchSessionInHost(request) {
  const cwd = typeof request?.projectRoot === 'string' ? request.projectRoot : process.cwd();
  const result = await executionOp('launch-session', request, { cwd });
  if (result?.refused) {
    const { code, message, ...extra } = result.refused;
    const thrown = new Error(message);
    thrown.name = 'SessionLaunchError';
    thrown.code = code;
    Object.assign(thrown, extra);
    throw thrown;
  }
  return result;
}

// ---- the Execution Core helpers, served by the addon's `execution` namespace --------------------------------

/**
 * One call of the addon's `execution` namespace; a refusal (a `run-unit` error document in the error's message) is
 * rethrown as the class Node threw (`runUnitErrorOf`), any other failure as it came.
 */
// The parser of a refusal document, taken once: a refusal is the addon's message, never caller data.
const parseRefusal = JSON.parse;

function addon(name, request) {
  const call = nativeDoor().execution?.[name];
  if (typeof call !== 'function') throw new ExecutionRouteError(HOST_VERSION_MISMATCH, `the native addon has no execution.${name}: the active release is older than this payload`);
  try {
    return call(request);
  } catch (err) {
    let doc = null;
    try { doc = parseRefusal(err?.message); } catch { /* not a refusal document */ }
    const error = doc?.error ?? doc;
    if (error && typeof error === 'object' && typeof error.tag === 'string') throw runUnitErrorOf({ error });
    throw err;
  }
}

/** Whether `id` is a case id. */
export const isCaseId = (id) => addon('isCaseId', { id });
/** The directory that holds every case, and the bindings directory beside them. */
export const runsRoot = (mainRoot) => addon('runsRoot', { mainRoot });
/** The directory of one case; refuses an id that is not a case id (`invalid-case-id`). */
export const runDirOf = (mainRoot, caseId) => addon('runDirOf', { mainRoot, caseId });
/** Where the owner's answer to one gate of a case is kept, absolute; null when an id names no file there. */
export const gateAnswerFile = (mainRoot, caseId, stepId) => addon('gateAnswerFile', { mainRoot, caseId, stepId });

/** Whether a dispatch holds custody of `worktree` right now (a directory that is gone is held by nobody). */
export const custodyHeld = (fgosDir, worktree) => addon('custodyHeld', { fgosDir, worktree });
/** The identity key of a worktree, the same for every spelling of its path; null when it does not exist. */
export const worktreeKey = (worktree) => addon('worktreeKey', { worktree });
/** The name of the lock scope under which a worktree is added to or removed from a repository. */
export const worktreeAdminScopeName = () => addon('worktreeAdminScopeName');
/** What a Unit run's directory says: `{ contract, exists, settled, controllerHeld, worktree, writeScope, resumable, caseId }`. */
export const unitRunFacts = (fgosDir, unitRunId) => addon('unitRunFacts', { fgosDir, unitRunId: typeof unitRunId === 'string' ? unitRunId : '' });
const ownerOf = (fgosDir, unitRunId, { caseId, unless = new Set() } = {}) => ({ fgosDir, unitRunId: typeof unitRunId === 'string' ? unitRunId : '', caseId, unless: [...unless] });
/** Where one Unit run of `caseId` stands: `{ dir }`, `{ gone: true }` or `{ keep, blocks }`. */
export const judgeUnitRun = (fgosDir, unitRunId, owner) => addon('judgeUnitRun', ownerOf(fgosDir, unitRunId, owner));
/** Delete a Unit run that judges removable, judged again now: `{ removed: true }`, `{ gone: true }` or `{ keep, blocks }`. */
export const removeUnitRun = (fgosDir, unitRunId, owner) => addon('removeUnitRun', ownerOf(fgosDir, unitRunId, owner));
/** The stored summary text of a unit run directory, or null when there is none. */
export const readStoredUnitSummary = (unitDir) => addon('readStoredUnitSummary', { unitDir });
/** The settle of a reservation whose Unit run can no longer run and never reported: no seat was given a brief. */
export const releasedUnitRunSettle = (caseId) => addon('releasedUnitRunSettle', { caseId });

const RUNNER_CONFIG_ORIGINS = Symbol.for('fgos.runner.origins');
/**
 * The project's checked runner config: project over global over the standard, with the origins of its attributed
 * values kept (non-enumerable) under `Symbol.for('fgos.runner.origins')`. A refusal throws `RunnerConfigError` (or
 * the class of the rule that refused); an advisory finding is printed as a warning.
 */
export function loadRunnerConfigForDir(dir) {
  const { config, origins, warnings } = addon('loadRunnerConfig', { dir });
  for (const warning of warnings ?? []) console.warn(warning);
  Object.defineProperty(config, RUNNER_CONFIG_ORIGINS, { value: Object.freeze([...(origins ?? [])]), writable: false, enumerable: false, configurable: true });
  return config;
}
/** The runner config a unit run records, and the hash of what seat choice and the run read from it. */
export const snapshotRunnerConfig = (mainRoot, runnerConfig) => addon('snapshotRunnerConfig', { runnerConfig: runnerConfig ?? loadRunnerConfigForDir(mainRoot) });

/** The loop a pattern name runs under `options` (`{ effective }`, a runner config or a pattern map), or null. */
export const loopOf = (name, options = {}) => addon('loopOf', { name: name ?? null, options: options ?? null });
/** The collaboration of a unit: its parameters, seats, launch bounds and pin, over the catalog and the runner config. */
export const resolveCollaboration = (options = {}) => addon('resolveCollaboration', options);
/** The pattern catalog checked and merged: `{ entries, merged, problems }`. */
export const checkCatalog = (options = {}) => addon('checkCatalog', options);
/** Structural equality as the catalog compares entries. */
export const deepEqual = (a, b) => addon('deepEqual', { a: a ?? null, b: b ?? null });
/** The normalized unit, or the refusal that names what is wrong with it. */
export const validateUnit = (raw) => addon('validateUnit', { unit: raw ?? null });
/** The stance options of a unit, checked. */
export const normalizeStanceOptions = (value = []) => addon('normalizeStanceOptions', { value });
/** `overrides` with one run-wide setting folded in. */
export const foldRunSetting = (overrides, key, value) => addon('foldRunSetting', { overrides: overrides ?? [], key, value: value ?? null });
/** The plan a unit file names, checked as `--plan` is; null for none. */
export const existingPlanRef = (value, mainRoot) => addon('existingPlanRef', { value: value ?? null, mainRoot });
/** The plan `--plan`/`--phase` name, checked; null for none. */
export const planFromFlags = (flags, mainRoot) => addon('planFromFlags', { flags: flags ?? {}, mainRoot });
/** `pool/account` split at the first `/`: `{ pool, id }`, or `{ refused: { reason, detail } }`. */
export const parseAccountPin = (value) => addon('parseAccountPin', { value: value ?? null });

/** Whether this process runs inside a live herdr session. */
export const detectHerdrPresent = () => addon('detectHerdrPresent');

// ---- outcomes, seats, the loop checks and the runner config rules ------------------------------------------

let vocabularyOnce = null;
/**
 * The named values a caller compares with, read once: `NOT_STARTED_OUTCOME`, `RESERVED_PATTERN_NAMES` (a Set),
 * `SEAT_BINDING_MARKER_PATH`, `MODEL_POLICY_TIERS` (weakest first), and `CASE_ID_ENV` and `CASE_RESERVATION_ENV`
 * (the case a worker was launched into).
 */
export function executionVocabulary() {
  if (vocabularyOnce === null) {
    const v = addon('vocabulary');
    vocabularyOnce = Object.freeze({ ...v, RESERVED_PATTERN_NAMES: new Set(v.RESERVED_PATTERN_NAMES), MODEL_POLICY_TIERS: Object.freeze([...v.MODEL_POLICY_TIERS]) });
  }
  return vocabularyOnce;
}

const orUndefined = (value) => (value === null ? undefined : value);
/** How deep in a chain of dispatches this process runs (`FGOS_DISPATCH_DEPTH`, else 0). */
export const currentDispatchDepth = () => addon('currentDispatchDepth');
/** Whether an outcome is a completed judgment of the work: `pass` or `findings`. */
export const isVerdict = (outcome) => addon('isVerdict', { outcome: outcome ?? null });
/** The process exit code of an execution outcome: 0 for `pass`, the table's code, else 1. */
export const exitCodeForOutcome = (outcome) => addon('exitCodeForOutcome', { outcome: outcome ?? null });
/** Whether a unit ended on infrastructure, so a rerun can still produce the verdict. */
export const infrastructure = (unitResult) => addon('infrastructure', { unitResult: unitResult ?? null });
/** One `{ kind, seat, round, passed }` per evaluator result that reached a verdict. */
export const evaluationsOf = (results = []) => addon('evaluationsOf', { results });
/** The seat a recorded result belongs to (`seat`, or the legacy `role`); only those two fields cross to the addon. */
export const seatKeyOf = (result) => orUndefined(addon('seatKeyOf', { result: { seat: result?.seat, role: result?.role } }));
/** The provider family an old result recorded, or null; only `runResult.policy.providerModel` crosses to the addon. */
export const legacyFamilyOf = (result) => addon('legacyFamilyOf', { result: { runResult: { policy: { providerModel: result?.runResult?.policy?.providerModel } } } });
/** The declared seats `[{ seat, role, persona?, tier? }]` checked; `tiers` checks each seat's tier. */
export const checkDeclaredSeats = (raw, label, { tiers } = {}) => addon('checkDeclaredSeats', { raw: raw ?? null, label, ...(tiers ? { tiers: [...tiers] } : {}) });
/** Refuses a seat list that carries a tier. */
export const assertNoSeatTier = (raw, source) => addon('assertNoSeatTier', { raw: raw ?? null, source });
/** Refuses a unit that carries a tier. */
export const assertNoUnitTier = (raw, source) => addon('assertNoUnitTier', { raw: raw ?? null, source });
/** The verify command a unit runs (its own, else its capability's), or null. */
export const verifyCommandOf = (unit, cfg) => addon('verifyCommandOf', { unit: unit ?? null, cfg: cfg ?? null });
/** The verify seat's result for one answer of the verify command. */
export const verifySeatResult = (answer, round) => addon('verifySeatResult', { answer: answer ?? null, ...(round === undefined ? {} : { round }) });

/** The retired `runner.patterns` keys a dotted path or a pattern map carries: `[{ key, replacement, instruction }]`. */
export const detectRetiredPatternKeys = (input) => addon('detectRetiredPatternKeys', { input: input ?? null });
/** `<key> was retired; <instruction>` for a dotted path or a finding. */
export const formatRetiredKeySentence = (item, instruction) => addon('formatRetiredKeySentence', { item: item ?? null, ...(typeof instruction === 'string' ? { instruction } : {}) });
/** Why `value` is not a usable run timeout (whole ms inside the floor and ceiling), or null when it is. */
export const runTimeoutProblem = (value, label = 'run timeout') => addon('runTimeoutProblem', { value: value === undefined ? null : value, label });
/** A run timeout in milliseconds, refused (`RunnerConfigError`) when it is not usable. */
export function assertRunTimeoutMs(value, label = 'run timeout') {
  const problem = runTimeoutProblem(value, label);
  if (problem) throw new RunnerConfigError(problem);
  return value;
}
/** `90m`, `5400s`, `2h`, `600000ms` as milliseconds, refused (`RunnerConfigError`) otherwise. */
export const parseRunTimeout = (text, label = '--timeout') => addon('parseRunTimeout', { ...(text === undefined ? {} : { text }), label });
/** The requested reasoning effort, refused (`RunnerConfigError`) outside the vocabulary or the executor's own list. */
export const assertReasoningEffort = (value, { supported, executorId } = {}) => addon('assertReasoningEffort', { value: value ?? null, ...(Array.isArray(supported) ? { supported } : {}), ...(typeof executorId === 'string' ? { executorId } : {}) });
/** The rules of `runner.loops` that read beyond its own fields; a refusal is a `RunnerConfigError` with its paths. */
export const validateRunnerLoopsShape = (loops, label = 'loops') => addon('validateRunnerLoopsShape', { loops: loops ?? {}, label });
/**
 * `err` attributed to the files and lines its values came from (`origins`), as a new `RunnerConfigError`; null for
 * an error that is no runner config refusal with a path, or one no origin names.
 */
export function attributeRunnerConfigError(err, origins, projectDir) {
  if (!(err instanceof RunnerConfigError) || !(err.paths?.length || err.path)) return null;
  const message = addon('attributedRefusal', { paths: err.paths ?? [err.path], detail: err.detail ?? err.message, origins: origins ?? [], projectDir });
  if (message === null) return null;
  return new RunnerConfigError(message, { code: err.code, phase: err.phase, path: err.path, paths: err.paths, detail: err.detail });
}

/** The accounts of `runner.llmAccounts` per state key, as the lease reads them. */
export const providerAccountInventory = (runnerConfig) => Object.freeze(addon('providerAccountInventory', { runnerConfig: runnerConfig ?? {} }));
/** The provider-capacity state key of an account pool. */
export const legacyStateKey = (pool) => addon('legacyStateKey', { pool });

// ---- the run result, the worker's claim and the assignment stamp -------------------------------------------

/**
 * The deterministic reading of a Run Result of any version: the record with its legacy `status` and `confidence`
 * (a version-3 record reads them from its classification, as a non-enumerable view) and `corrupt` when it cannot
 * be read soundly.
 */
export function interpretRunResult(input, options = {}) {
  const expectedRunId = typeof options === 'string' ? options : options?.expectedRunId;
  const { record } = addon('interpretRunResult', { input: input ?? null, ...(typeof expectedRunId === 'string' ? { expectedRunId } : {}) });
  return Object.hasOwn(record, 'status') ? record : withLegacyView(record);
}
/** The one outcome of a Run Result: `{ category, executed, verdict, refused, evidence, satisfied, infraFailure, failure }`. */
export const runOutcome = (result, { evidenceFloor } = {}) => Object.freeze(addon('runOutcome', { result: result ?? null, ...(evidenceFloor && typeof evidenceFloor === 'object' ? { evidenceFloor } : {}) }));
/** `{ valid, reason? }` of an untrusted worker claim, under the claim context `{ role, operation, posture }`. */
export const validateAgentResultClaim = (value, context = {}) => addon('validateAgentResultClaim', { value: value ?? null, context: { role: context.role ?? context.assignment?.role, operation: context.operation ?? context.assignment?.operation, posture: context.posture ?? context.assignment?.posture } });
/** Whether a report says something beyond placeholders and headings. */
export const isSubstantiveReportText = (text) => addon('isSubstantiveReportText', { text: typeof text === 'string' ? text : null });
/** Whether an assignment is read-only, from the `mutation` stamped at build time. */
export const isReadOnlyAssignment = (assignment) => addon('isReadOnlyAssignment', { assignment: assignment ?? null });
/** The declared stamp of an assignment: `{ mutation, evidence: { required }, resultKind, onAdvance? }`. */
export const stampDeclaredAssignment = ({ role, operation } = {}) => Object.freeze(addon('stampDeclaredAssignment', { ...(typeof role === 'string' ? { role } : {}), ...(typeof operation === 'string' ? { operation } : {}) }));
/** Where a worker's claim (`result-`, `.json`, `agent-result.json`) or report (`report-`, `.md`, `agent-report.md`) is. */
export const resolveWorkerArtifactPath = (runDir, roundPrefix, roundSuffix, legacyName) => addon('resolveWorkerArtifactPath', { runDir, roundPrefix, roundSuffix, legacyName });
/** The directory of an assignment, or null for an id that is no safe nested path under `assignments/`. */
export const assignmentDir = (fgosDir, assignmentId) => addon('assignmentDir', { fgosDir, assignmentId: typeof assignmentId === 'string' ? assignmentId : null });
/** Every attempt directory under `assignments/`: `{ assignmentId, attempt, runDir, hasAssignmentJson }`. */
export const listAssignmentRuns = (fgosDir) => addon('listAssignmentRuns', { fgosDir });

const deepFreeze = (value) => {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const inner of Object.values(value)) deepFreeze(inner);
  return value;
};
let shippedOnce = null;
/** The bundled standard's pattern catalog `{ patterns, loops }`, frozen and read once per process. */
export function shippedCatalog() {
  if (shippedOnce === null) shippedOnce = deepFreeze(addon('shippedCatalog'));
  return shippedOnce;
}

// ---- the hand-off -------------------------------------------------------------------------------------------

/** The neutral name (without extension) of the nth anonymized input: seat-A ... seat-Z, seat-AA, ... */
export const anonymousInputName = (index) => addon('anonymousInputName', { index });
/**
 * `{ path, bytes, sha256 }` of the report a seat of a unit run left in its latest round, as its bytes lie now; a
 * report that cannot be resolved or read throws `RunnerConfigError` with its `reason`.
 */
export const reportDigest = (unitRunId, seat, mainRoot) => addon('reportDigest', { unitRunId, seat, mainRoot });
/**
 * The path one hand-off input names: a `unit-run:<id>/<seat>` input the report it hands over, only while it keeps
 * the bytes settlement recorded unless `accept` covers the revision (`'any'`, or an array of the digests a person
 * approved; any other value accepts nothing); a
 * `gate-answer:<case>/<step>` input the owner's answer file; any other input itself. One that cannot be handed over
 * throws `RunnerConfigError` with its `reason`.
 */
export const handoffRef = (input, mainRoot, { accept } = {}) => addon('handoffRef', { input, mainRoot, ...(accept !== undefined ? { accept } : {}) });

// ---- executor facts a Work caller reads ---------------------------------------------------------------------

/** The executor block a name resolves to (`command`, `provider`, `governance`, ...); a refusal is `RunnerConfigError`. */
export const resolveExecutorConfig = (runnerConfig, executorId, { contentCarries, resolvedAgentType, invocationId } = {}) => addon('resolveExecutorConfig', { runnerConfig: runnerConfig ?? {}, ...Object.fromEntries(Object.entries({ executorId, contentCarries, resolvedAgentType, invocationId }).filter(([, v]) => typeof v === 'string')) });
/** `{ capability, anchorCapability }`: the canonical capability of a dispatch, from its hints. */
export const resolveCapabilityDetailsFromHints = ({ cfg, executorId, resolvedExecutor, purpose, hints } = {}) => addon('resolveCapabilityDetailsFromHints', { runnerConfig: cfg ?? {}, ...(typeof executorId === 'string' ? { executorId } : {}), ...(resolvedExecutor ? { resolvedExecutor } : {}), ...(typeof purpose === 'string' ? { purpose } : {}), hints: hints ?? {} });
