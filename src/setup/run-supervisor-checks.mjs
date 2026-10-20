// run-supervisor-checks.mjs -- the doctor checks and fixes of the run supervisor
// (docs/platform/run-supervisor/spec.md, "Doctor and setup"). `registrations.mjs`
// registers them; the bodies live here.
//
// Checks only read (the stuck-attempt probe asks adopt for `--probe-only`, which writes
// nothing). The fixes write: `runtime-socket-dir` creates or tightens the socket directory,
// `run-attempts-stuck` sends the unclosed attempts through the adopt door, `legacy-attempts-stuck`
// settles runs from before the supervisor through the legacy sweep (the recover door is passed in by
// the registration: it is a use case above this layer).
//
// Levels follow the doctor convention: `passed: false` fails, a message that starts with
// `warning:` warns, `info:` is informational, anything else passes.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hostBin, routeEnv } from '../holder-lock/driver.mjs';
import { PROTOCOL } from '../holder-lock/protocol.mjs';
import { readSharedConfig } from '../config/shared-config-file.mjs';
import { loadGlobalConfig } from '../config/global-config.mjs';
import { resolveRuntimeSocketDir, ensureRuntimeSocketDir, RuntimeDirError, SOCKET_PATH_MAX_BYTES } from '../run-supervisor/runtime-dir.mjs';
import { adoptRun, adoptScan, listOpenAttemptDirs } from '../run-supervisor/client.mjs';
import { sweepAttempts } from '../run-supervisor/sweep.mjs';
import { findLegacyStuck, judgeLegacyHolders, sweepLegacy } from '../run-supervisor/legacy-sweep.mjs';
import { GATE_KILL_GRACE_KEY, resolveGateKillGrace, gateKillGraceProblem, CANCEL_WAIT_KEY, resolveCancelWait, cancelWaitProblem } from '../run-supervisor/gate-kill-grace.mjs';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { deriveUnitState, unitDirOfAssignment } from '../runner/execution/unit-state.mjs';

const ROUTES = ['supervise', 'gate', 'adopt', 'attempt-step'];
const PROBE_TIMEOUT_MS = 15_000;
const MAX_LISTED = 5;
/** `<16 hex chars>.sock`, as the runtime directory module sizes it. */
const SOCKET_NAME_BYTES = 21;
const ATTEMPT_SOCKET_NAME = /^[0-9a-f]{16}\.sock$/;
const PROC_NET_UNIX = '/proc/net/unix';

const warn = (text) => `warning: ${text}`;
const info = (text) => `info: ${text}`;

function listed(items) {
  const head = items.slice(0, MAX_LISTED).join('; ');
  return items.length > MAX_LISTED ? `${head}; and ${items.length - MAX_LISTED} more` : head;
}

const fgosDirOf = (repoRoot) => path.join(path.resolve(repoRoot), '.fgos');
const assignmentsRootOf = (repoRoot) => path.join(fgosDirOf(repoRoot), 'assignments');

/** `fgos internal <route> --protocol 1 --probe`: the parsed answer line, or `{ error }` saying why not. */
function probeRoute(bin, route) {
  const res = spawnSync(bin, ['internal', route, '--protocol', String(PROTOCOL), '--probe'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: routeEnv(),
    timeout: PROBE_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: 1024 * 1024,
  });
  let line = null;
  try {
    line = JSON.parse(String(res.stdout ?? '').split('\n').find((text) => text.trim() !== '') ?? '');
  } catch {
    line = null;
  }
  if (line?.result === 'ok' && line.route === route && line.protocol === PROTOCOL) return line;
  if (line?.code === 'host-version-mismatch' || res.status === 3) return { error: `refused protocol ${PROTOCOL} (host-version-mismatch)` };
  const how = res.error ? res.error.message : res.signal ? `signal ${res.signal}` : `exit ${res.status}`;
  return { error: `no answer (${how})` };
}

function resolveBin(repoRoot, override) {
  if (override) return { bin: override };
  try {
    return { bin: hostBin({ fgosDir: fgosDirOf(repoRoot) }) };
  } catch (err) {
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------
// run-supervisor-route
// ---------------------------------------------------------------------

/** The host binary answers `--probe` on every route of the run supervisor at protocol 1. */
export function checkRunSupervisorRoute(repoRoot, { bin: binOverride } = {}) {
  const { bin, error } = resolveBin(repoRoot, binOverride);
  if (error) return { passed: false, message: `no host binary to ask for the run supervisor routes: ${error}` };
  const missing = [];
  for (const route of ROUTES) {
    const answer = probeRoute(bin, route);
    if (answer.error) missing.push(`${route}: ${answer.error}`);
  }
  if (missing.length > 0) {
    return { passed: false, message: `${bin} does not serve the run supervisor at protocol ${PROTOCOL} (${listed(missing)}); restage and activate a release built from this tree` };
  }
  return { passed: true, message: `${bin} serves ${ROUTES.join(', ')} at protocol ${PROTOCOL}` };
}

// ---------------------------------------------------------------------
// process-containment
// ---------------------------------------------------------------------

/**
 * The containment driver the host runs agents in on this machine, its level and the routes around
 * it. `kernel` passes. `best-effort` warns on Linux (no bwrap user namespace: the process-group
 * driver runs instead) and is informational on macOS (the best the platform offers).
 * `unsupported` fails.
 */
export function checkProcessContainment(repoRoot, { platform = process.platform, bin: binOverride } = {}) {
  const { bin, error } = resolveBin(repoRoot, binOverride);
  if (error) return { passed: false, message: `no host binary to ask for the containment driver: ${error}` };
  const answer = probeRoute(bin, 'supervise');
  if (answer.error) return { passed: false, message: `${bin} did not report its containment driver: ${answer.error}` };
  const { driver, level, escapes = [], error: driverError } = answer.containment ?? {};
  const escapeText = escapes.length > 0 ? `; escapes: ${listed(escapes)}` : '';
  if (level === 'kernel') return { passed: true, message: `${driver}, level kernel${escapeText}` };
  if (level === 'best-effort') {
    if (platform === 'linux') {
      return { passed: true, message: warn(`${driver}, level best-effort: bwrap with a user namespace is unavailable here (no bwrap, or user namespaces are disabled), so agents run in a process group${escapeText}`) };
    }
    return { passed: true, message: info(`${driver}, level best-effort${escapeText}`) };
  }
  return { passed: false, message: `no containment driver on this machine (${driverError ?? 'unsupported'}); fgos run cannot start an agent` };
}

// ---------------------------------------------------------------------
// runtime-socket-dir
// ---------------------------------------------------------------------

function socketDirState({ uid, env }) {
  const dir = resolveRuntimeSocketDir({ env, uid });
  if (Buffer.byteLength(dir) + 1 + SOCKET_NAME_BYTES > SOCKET_PATH_MAX_BYTES) {
    return { dir, problem: `${dir} leaves no room for a socket name within ${SOCKET_PATH_MAX_BYTES} bytes (shorten XDG_RUNTIME_DIR)`, unfixable: true };
  }
  let st;
  try {
    st = fs.lstatSync(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return { dir, missing: true };
    return { dir, problem: `${dir} unreadable (${err.code})` };
  }
  if (!st.isDirectory()) return { dir, problem: `${dir} is not a directory` };
  if (st.uid !== uid) return { dir, problem: `${dir} is owned by uid ${st.uid}, not ${uid}` };
  if ((st.mode & 0o077) !== 0) return { dir, problem: `${dir} mode ${(st.mode & 0o777).toString(8)} allows group or other access (should be 700)`, loose: true };
  return { dir };
}

/**
 * Paths some process has bound a unix socket to, read from the kernel table (Linux). `null` where
 * the table does not exist: nothing can then be judged, and nothing is reported or removed. Probing
 * by connecting is not an option: a live supervisor takes the first connection for its gate.
 */
function boundSocketPaths(procFile) {
  let text;
  try {
    text = fs.readFileSync(procFile, 'utf8');
  } catch {
    return null;
  }
  const bound = new Set();
  for (const line of text.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length >= 8) bound.add(fields.slice(7).join(' '));
  }
  return bound;
}

/**
 * Attempt sockets (`<hash>.sock`) in `dir` that no process holds any more: the supervisor that
 * listened on one was killed before it could remove the path. Sockets only, never other files.
 */
function orphanAttemptSockets(dir, { uid, procFile }) {
  const bound = boundSocketPaths(procFile);
  if (bound === null) return null;
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const orphans = [];
  for (const name of names.filter((entry) => ATTEMPT_SOCKET_NAME.test(entry)).sort()) {
    const file = path.join(dir, name);
    try {
      const st = fs.lstatSync(file);
      if (st.isSocket() && st.uid === uid && !bound.has(file)) orphans.push(file);
    } catch {
      // gone while looking: nothing to report
    }
  }
  return orphans;
}

/**
 * The runtime socket directory exists, is a real directory of this user and is 0700, and holds no
 * attempt socket without a supervisor behind it.
 */
export function checkRuntimeSocketDir({ env = process.env, uid = process.getuid?.(), procFile = PROC_NET_UNIX } = {}) {
  if (uid === undefined) return { passed: true, message: info('no runtime socket directory on this platform') };
  const state = socketDirState({ uid, env });
  if (state.problem) {
    const fixable = state.loose === true;
    return { passed: false, message: fixable ? `${state.problem} -- run "fgos doctor --fix"` : `${state.problem} -- fix it by hand, doctor --fix does not touch it` };
  }
  if (state.missing) return { passed: true, message: warn(`${state.dir} does not exist yet (fgos setup creates it)`) };
  const orphans = orphanAttemptSockets(state.dir, { uid, procFile });
  if (orphans && orphans.length > 0) {
    return { passed: false, message: `${orphans.length} attempt socket(s) in ${state.dir} have no supervisor: ${listed(orphans.map((file) => path.basename(file)))} -- run "fgos doctor --fix"` };
  }
  const judged = orphans === null ? ' (attempt sockets are not judged on this platform)' : '';
  return { passed: true, message: `${state.dir} is 0700 and owned by uid ${uid}${judged}` };
}

/** Unlinks the orphans (judged again just now); only socket files, never a lock or a directory. */
function removeOrphanAttemptSockets(dir, { uid, procFile }) {
  const removed = [];
  for (const file of orphanAttemptSockets(dir, { uid, procFile }) ?? []) {
    try {
      fs.unlinkSync(file);
      removed.push(file);
    } catch {
      // already removed by its own supervisor, or not ours to remove
    }
  }
  return removed;
}

export function fixRuntimeSocketDir({ env = process.env, uid = process.getuid?.(), procFile = PROC_NET_UNIX } = {}) {
  if (uid === undefined) return { changed: false, message: 'no runtime socket directory on this platform' };
  const before = socketDirState({ uid, env });
  if (before.loose) {
    try {
      fs.chmodSync(before.dir, 0o700);
      return { changed: true, message: `set ${before.dir} to 0700` };
    } catch (err) {
      return { changed: false, message: `${before.dir}: ${err.code ?? err.message}` };
    }
  }
  try {
    const dir = ensureRuntimeSocketDir({ env, uid });
    const removed = removeOrphanAttemptSockets(dir, { uid, procFile });
    if (removed.length > 0) return { changed: true, message: `removed ${removed.length} attempt socket(s) with no supervisor from ${dir}: ${listed(removed.map((file) => path.basename(file)))}` };
    return { changed: before.missing === true, message: before.missing ? `created ${dir} (0700)` : `${dir} already in order` };
  } catch (err) {
    if (err instanceof RuntimeDirError) return { changed: false, message: err.message };
    return { changed: false, message: `${before.dir}: ${err.code ?? err.message}` };
  }
}

// ---------------------------------------------------------------------
// run-attempts-stuck
// ---------------------------------------------------------------------

const STUCK_STATES = new Set(['needs-adopt', 'open']);

/**
 * Why adopt cannot finish an attempt whose envelope names a host binary or a Node payload that no longer
 * exists, or `null`. The envelope binds the attempt's steps to the release that wrote it: the host must be
 * that binary and the step runs that payload's `src/run-supervisor/attempt-step.mjs`. There is no fallback
 * to the active release; the remedy is to bring back what is gone at the same paths (for a dev-door host,
 * a host binary of the same protocol at that path and a checkout at the payload root).
 */
function releaseGoneReason(attemptDir) {
  try {
    const { hostBin, payloadRoot } = JSON.parse(fs.readFileSync(path.join(attemptDir, 'envelope.json'), 'utf8'));
    const gone = [];
    if (typeof hostBin === 'string' && hostBin !== '' && !fs.existsSync(hostBin)) gone.push(hostBin);
    if (typeof payloadRoot === 'string' && payloadRoot !== '') {
      const entry = path.join(payloadRoot, 'src', 'run-supervisor', 'attempt-step.mjs');
      if (!fs.existsSync(entry)) gone.push(entry);
    }
    if (gone.length > 0) {
      return `the release that wrote it was removed (${gone.map((p) => `${p} is gone`).join(', ')}) and the envelope binds its steps to that host and payload, so adopt cannot run them: restore them at those paths, then run "fgos doctor --fix" again`;
    }
  } catch { /* an envelope that cannot be read is judged by adopt itself */ }
  return null;
}

const stuckEntry = (verdict) => {
  const reason = releaseGoneReason(verdict.attemptDir) ?? verdict.reason;
  return `${verdict.attemptDir}${reason ? ` (${reason})` : ''}`;
};

/**
 * Attempts with a v3 envelope and no `closed.json` whose lock nobody holds, found through the adopt
 * route's `--probe-only` (nothing is written). A held lock is a running attempt, not a finding.
 */
export function checkRunAttemptsStuck(repoRoot) {
  const assignmentsRoot = assignmentsRootOf(repoRoot);
  if (listOpenAttemptDirs(assignmentsRoot).length === 0) return { passed: true, message: 'no attempt waits to be closed' };
  const { bin, error } = resolveBin(repoRoot);
  if (error) return { passed: true, message: warn(`attempts are open but the host cannot judge them: ${error}`) };
  let verdicts;
  try {
    verdicts = adoptScan({ assignmentsRoot, probeOnly: true, hostBin: bin });
  } catch (err) {
    return { passed: true, message: warn(`attempts are open but adopt could not judge them: ${err.message}`) };
  }
  const stuck = verdicts.filter((verdict) => STUCK_STATES.has(verdict.state));
  if (stuck.length === 0) {
    const running = verdicts.filter((verdict) => verdict.state === 'running' || verdict.state === 'being-adopted').length;
    return { passed: true, message: `${verdicts.length} open attempt(s), none stuck${running > 0 ? ` (${running} running)` : ''}` };
  }
  const named = stuck.map(stuckEntry);
  return { passed: false, message: `${stuck.length} attempt(s) have no holder and no closed.json: ${listed(named)} -- run "fgos doctor --fix"` };
}

export function fixRunAttemptsStuck(repoRoot) {
  const assignmentsRoot = assignmentsRootOf(repoRoot);
  if (listOpenAttemptDirs(assignmentsRoot).length === 0) return { changed: false, message: 'no attempt waits to be closed' };
  const { bin, error } = resolveBin(repoRoot);
  const result = sweepAttempts({ assignmentsRoot, adoptOptions: bin ? { hostBin: bin } : {} });
  if (result.adoptError) return { changed: false, message: `adopt could not run: ${result.adoptError}${error ? ` (${error})` : ''}` };
  const adopted = (result.adopt ?? []).filter((verdict) => verdict.state === 'adopted');
  const left = (result.adopt ?? []).filter((verdict) => STUCK_STATES.has(verdict.state));
  const message = `adopted ${adopted.length} attempt(s)${left.length > 0 ? `; ${left.length} still open: ${listed(left.map(stuckEntry))}` : ''}`;
  return { changed: adopted.length > 0, message };
}

// ---------------------------------------------------------------------
// gate-kill-grace
// ---------------------------------------------------------------------

/** `dispatch.gateKillGraceMs` after the config merge (project over global): value and source; below 1000 ms fails. */
export function checkGateKillGrace(repoRoot, { globalConfigPath } = {}) {
  let project;
  let global;
  try {
    project = readSharedConfig(path.resolve(repoRoot));
    global = globalConfigPath ? loadGlobalConfig(globalConfigPath) : loadGlobalConfig();
  } catch (err) {
    return { passed: false, message: `${GATE_KILL_GRACE_KEY} unreadable: ${err.message}` };
  }
  const { value, source } = resolveGateKillGrace({ project, global });
  const problem = gateKillGraceProblem(value);
  if (problem) return { passed: false, message: `${problem} (${source})` };
  return { passed: true, message: `${GATE_KILL_GRACE_KEY} = ${value} (${source})` };
}

// ---------------------------------------------------------------------
// legacy-attempts-stuck
// ---------------------------------------------------------------------

/**
 * Runs from before the run supervisor still `running` with no attempt lock. Each is judged on its own
 * records (every recorded pid dead, no version-1 home left): the ones that can be settled fail the check
 * (the fix settles them), the ones kept warn with the reason that keeps them. Nothing is written.
 * `judgeOptions` (`judgeRecord`, `confinementRoot`) reach `judgeLegacyHolders`.
 */
export function checkLegacyAttemptsStuck(repoRoot, judgeOptions = {}) {
  const stuck = findLegacyStuck({ assignmentsRoot: assignmentsRootOf(repoRoot) });
  if (stuck.length === 0) return { passed: true, message: 'no run from before the run supervisor is left running' };
  const settleable = [];
  const kept = [];
  for (const { runDir, runId } of stuck) {
    const verdict = judgeLegacyHolders(runDir, judgeOptions);
    if (verdict.allDead) settleable.push(`${runDir} (${runId})`);
    else kept.push(`${runDir} (${runId}): ${verdict.reason}`);
  }
  if (settleable.length > 0) {
    const tail = kept.length > 0 ? `; kept: ${listed(kept)}` : '';
    return { passed: false, message: `${settleable.length} run(s) from before the run supervisor are left running and every process they recorded is dead: ${listed(settleable)} -- run "fgos doctor --fix"${tail}` };
  }
  return { passed: true, message: warn(`${kept.length} run(s) from before the run supervisor are left running and stay open: ${listed(kept)}`) };
}

/**
 * Settle the provably dead ones as `abandoned-legacy` through the recover door and name each run kept.
 * @param {string} repoRoot
 * @param {{door: {observe: Function, apply: Function}}} options the recover door, passed in by the caller
 */
export function fixLegacyAttemptsStuck(repoRoot, { door, ...judgeOptions }) {
  const assignmentsRoot = assignmentsRootOf(repoRoot);
  if (findLegacyStuck({ assignmentsRoot }).length === 0) return { changed: false, message: 'no run from before the run supervisor is left running' };
  const { settled, kept } = sweepLegacy({ assignmentsRoot, door, repoRoot: path.resolve(repoRoot), ...judgeOptions });
  const left = kept.length > 0 ? `; kept: ${listed(kept.map((entry) => `${entry.runDir}: ${entry.reason}`))}` : '';
  return { changed: settled.length > 0, message: `settled ${settled.length} run(s) as abandoned-legacy${left}` };
}

// ---------------------------------------------------------------------
// units-awaiting-resume
// ---------------------------------------------------------------------

/**
 * Unit runs whose controller is gone and whose last attempt is closed, with no summary: information, not
 * a failure (nothing continues on its own; a person types `fgos run --resume <unit>`). Read-only; each
 * unit is judged by `deriveUnitState` over the adopt probe.
 */
export function checkUnitsAwaitingResume(repoRoot, { bin: binOverride } = {}) {
  const fgosDir = fgosDirOf(repoRoot);
  const unitDirs = new Set();
  for (const { assignmentId } of listAssignmentRuns(fgosDir)) {
    const unitDir = unitDirOfAssignment(fgosDir, assignmentId);
    if (unitDir) unitDirs.add(unitDir);
  }
  if (unitDirs.size === 0) return { passed: true, message: 'no unit run to resume' };
  const { bin, error } = resolveBin(repoRoot, binOverride);
  if (error) return { passed: true, message: warn(`unit runs exist but the host cannot judge their attempts: ${error}`) };
  const probe = (attemptDir) => adoptRun(attemptDir, { probeOnly: true, hostBin: bin });
  const waiting = [];
  try {
    for (const unitDir of [...unitDirs].sort()) {
      const unit = deriveUnitState(unitDir, { probe });
      if (unit.unitState === 'awaiting-resume') waiting.push(unit.resumeCommand);
    }
  } catch (err) {
    return { passed: true, message: warn(`unit runs exist but adopt could not judge them: ${err.message}`) };
  }
  if (waiting.length === 0) return { passed: true, message: `${unitDirs.size} unit run(s), none awaiting resume` };
  return { passed: true, message: warn(`${waiting.length} unit run(s) await resume: ${listed(waiting.map((command) => `"${command}"`))}`) };
}

// ---------------------------------------------------------------------
// cancel-wait
// ---------------------------------------------------------------------

/**
 * `dispatch.cancelWaitMs` after the config merge (project over global): value and source. It fails
 * when unusable or shorter than `dispatch.gateKillGraceMs`: the controller would leave before the gate
 * could finish stopping the agent.
 */
export function checkCancelWait(repoRoot, { globalConfigPath } = {}) {
  let project;
  let global;
  try {
    project = readSharedConfig(path.resolve(repoRoot));
    global = globalConfigPath ? loadGlobalConfig(globalConfigPath) : loadGlobalConfig();
  } catch (err) {
    return { passed: false, message: `${CANCEL_WAIT_KEY} unreadable: ${err.message}` };
  }
  const { value, source, grace } = resolveCancelWait({ project, global });
  const problem = cancelWaitProblem(value);
  if (problem) return { passed: false, message: `${problem} (${source})` };
  if (Number.isInteger(grace) && value < grace) {
    return { passed: false, message: `${CANCEL_WAIT_KEY} = ${value} (${source}) is shorter than ${GATE_KILL_GRACE_KEY} = ${grace}: a stopped controller would leave before the gate can finish stopping the agent` };
  }
  return { passed: true, message: `${CANCEL_WAIT_KEY} = ${value} (${source})` };
}
