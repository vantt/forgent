// run-supervisor-checks.mjs -- the doctor checks and fixes of the run supervisor
// (docs/platform/run-supervisor/spec.md, "Doctor and setup"). `registrations.mjs`
// registers them; the bodies live here.
//
// Checks only read (the stuck-attempt probe asks adopt for `--probe-only`, which writes
// nothing). The fixes write: `runtime-socket-dir` creates or tightens the socket directory,
// `run-attempts-stuck` sends the unclosed attempts through the adopt door.
// Four rows cover the layer: `run-supervisor-route` (routes and containment driver), `runtime-socket-dir`,
// `run-attempts-stuck` (stuck attempts, attempts whose release is gone, units awaiting resume) and
// `run-supervisor-config` (kill grace and cancel wait).
//
// Levels follow the doctor convention: `passed: false` fails, a message that starts with
// `warning:` warns, `info:` is informational, anything else passes.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hostBin } from '../holder-lock/driver.mjs';
import { routeEnv } from '../util/host-bin-path.mjs';
import { RUN_SUPERVISOR_PROTOCOL as PROTOCOL } from '../run-supervisor/protocol.mjs';
import { resolveRuntimeSocketDir, ensureRuntimeSocketDir, RuntimeDirError, SOCKET_PATH_MAX_BYTES } from '../run-supervisor/runtime-dir.mjs';
import { adoptScan, listOpenAttemptDirs, sweepAttempts } from '../run-supervisor/client.mjs';
import { GATE_KILL_GRACE_KEY, readDispatchConfig, resolveGateKillGrace, gateKillGraceProblem, CANCEL_WAIT_KEY, resolveCancelWait, cancelWaitProblem } from '../run-supervisor/gate-kill-grace.mjs';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { fgosDirFromRoot } from '../runner/paths.mjs';
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

const assignmentsRootOf = (repoRoot) => path.join(fgosDirFromRoot(repoRoot), 'assignments');

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
    return { bin: hostBin({ fgosDir: fgosDirFromRoot(repoRoot) }) };
  } catch (err) {
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------
// run-supervisor-route
// ---------------------------------------------------------------------

/**
 * The containment driver the host runs agents in on this machine, its level and the routes around
 * it, from the answer of the `supervise` probe. `kernel` passes. `best-effort` warns on Linux (no bwrap
 * user namespace: the process-group driver runs instead) and is informational on macOS (the best the
 * platform offers). `unsupported` fails.
 */
function containmentOf(answer, { platform }) {
  const { driver, level, escapes = [], error: driverError, selectedBecause } = answer.containment ?? {};
  const escapeText = escapes.length > 0 ? `; escapes: ${listed(escapes)}` : '';
  if (level === 'kernel') return { passed: true, message: `${driver}, level kernel${escapeText}` };
  if (level === 'best-effort') {
    if (platform === 'linux') {
      if (selectedBecause?.startsWith('containment-mount-refused:')) {
        const line = selectedBecause.slice('containment-mount-refused:'.length).trim();
        return { passed: true, message: warn(`${driver}, level best-effort: a host mount cannot be remounted (${line}); unmount or fix it, then restart long-running fgOS processes (gateway, supervisors), which keep the answer they probed at start, to get kernel containment${escapeText}`) };
      }
      const reason = selectedBecause ? `(${selectedBecause})` : '(no bwrap, or user namespaces are disabled)';
      return { passed: true, message: warn(`${driver}, level best-effort: bwrap with a user namespace is unavailable here ${reason}, so agents run in a process group${escapeText}. Install bwrap and enable unprivileged user namespaces for kernel containment`) };
    }
    return { passed: true, message: info(`${driver}, level best-effort${escapeText}`) };
  }
  return { passed: false, message: `no containment driver on this machine (${driverError ?? 'unsupported'}); fgos run cannot start an agent. Rebuild the host from this checkout (\`npm run fgos:dev\`) or restage the active release, then run \`fgos doctor\`` };
}

/**
 * The host binary answers `--probe` on every route of the run supervisor at protocol 1, and the
 * `supervise` answer names a usable containment driver: one probe of that route serves both.
 */
export function checkRunSupervisorRoute(repoRoot, { platform = process.platform, bin: binOverride } = {}) {
  const { bin, error } = resolveBin(repoRoot, binOverride);
  if (error) return { passed: false, message: `no host binary to ask for the run supervisor routes: ${error}` };
  const missing = [];
  let supervise;
  for (const route of ROUTES) {
    const answer = probeRoute(bin, route);
    if (answer.error) missing.push(`${route}: ${answer.error}`);
    else if (route === 'supervise') supervise = answer;
  }
  if (missing.length > 0) {
    return { passed: false, message: `${bin} does not serve the run supervisor at protocol ${PROTOCOL} (${listed(missing)}); restage and activate a release built from this tree` };
  }
  const containment = containmentOf(supervise, { platform });
  if (!containment.passed) return containment;
  // The containment text keeps its own level prefix; the row carries it in front.
  const level = /^(warning|info): /.exec(containment.message)?.[0] ?? '';
  return { passed: true, message: `${level}${bin} serves ${ROUTES.join(', ')} at protocol ${PROTOCOL}; containment: ${containment.message.slice(level.length)}` };
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
  // The directory is listed before the table is read: a socket bound in between is then not in the
  // listing at all, instead of being listed while missing from an older table.
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    names = [];
  }
  const bound = boundSocketPaths(procFile);
  if (bound === null) return null;
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

/** Unit runs whose controller is gone and whose last attempt is closed, as the resume commands to type. */
function unitsAwaitingResume(repoRoot, verdicts) {
  const fgosDir = fgosDirFromRoot(repoRoot);
  const unitDirs = new Set();
  for (const { assignmentId } of listAssignmentRuns(fgosDir)) {
    const unitDir = unitDirOfAssignment(fgosDir, assignmentId);
    if (unitDir) unitDirs.add(unitDir);
  }
  // The scan already judged every attempt that is not closed; one that is not in it is closed.
  const byDir = new Map(verdicts.map((verdict) => [verdict.attemptDir, verdict]));
  const probe = (attemptDir) => byDir.get(attemptDir) ?? { state: 'closed' };
  const waiting = [];
  for (const unitDir of [...unitDirs].sort()) {
    const unit = deriveUnitState(unitDir, { probe });
    if (unit.unitState === 'awaiting-resume') waiting.push(unit.resumeCommand);
  }
  return waiting;
}

/**
 * Attempts with a v3 envelope and no `closed.json` whose lock nobody holds, found through one adopt
 * `--probe-only` scan (nothing is written): they fail, except an attempt whose release was removed, which
 * adopt can never close and so only warns. A held lock is a running attempt, not a finding. The same scan
 * judges the unit runs awaiting `fgos run --resume`, which warn and never fail.
 */
export function checkRunAttemptsStuck(repoRoot) {
  const assignmentsRoot = assignmentsRootOf(repoRoot);
  let verdicts = [];
  if (listOpenAttemptDirs(assignmentsRoot).length > 0) {
    const { bin, error } = resolveBin(repoRoot);
    if (error) return { passed: true, message: warn(`attempts are open but the host cannot judge them: ${error}`) };
    try {
      verdicts = adoptScan({ assignmentsRoot, probeOnly: true, hostBin: bin });
    } catch (err) {
      return { passed: true, message: warn(`attempts are open but adopt could not judge them: ${err.message}`) };
    }
  }
  const stuck = verdicts.filter((verdict) => STUCK_STATES.has(verdict.state));
  const gone = stuck.filter((verdict) => releaseGoneReason(verdict.attemptDir));
  const failing = stuck.filter((verdict) => !gone.includes(verdict));
  const warnings = [];
  if (gone.length > 0) warnings.push(`${gone.length} attempt(s) cannot be closed by adopt: ${listed(gone.map(stuckEntry))}`);
  try {
    const waiting = unitsAwaitingResume(repoRoot, verdicts);
    if (waiting.length > 0) warnings.push(`${waiting.length} unit run(s) await resume: ${listed(waiting.map((command) => `"${command}"`))}`);
  } catch (err) {
    warnings.push(`unit runs exist but adopt could not judge them: ${err.message}`);
  }
  if (failing.length > 0) {
    const text = `${failing.length} attempt(s) have no holder and no closed.json: ${listed(failing.map(stuckEntry))} -- run "fgos doctor --fix"`;
    return { passed: false, message: warnings.length > 0 ? `${text}; ${warnings.join('; ')}` : text };
  }
  if (warnings.length > 0) return { passed: true, message: warn(warnings.join('; ')) };
  if (verdicts.length === 0) return { passed: true, message: 'no attempt waits to be closed' };
  const running = verdicts.filter((verdict) => verdict.state === 'running' || verdict.state === 'being-adopted').length;
  return { passed: true, message: `${verdicts.length} open attempt(s), none stuck${running > 0 ? ` (${running} running)` : ''}` };
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
// run-supervisor-config
// ---------------------------------------------------------------------

/**
 * `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` after the config merge (project over global), read
 * once: value and source of each. The grace fails below 1000 ms or when not an integer; the cancel wait
 * fails when unusable or shorter than the grace (the controller would leave before the gate could finish
 * stopping the agent).
 */
export function checkRunSupervisorConfig(repoRoot, { globalConfigPath } = {}) {
  let snapshot;
  try {
    snapshot = readDispatchConfig({ projectRoot: path.resolve(repoRoot), globalConfigPath });
  } catch (err) {
    return { passed: false, message: `${GATE_KILL_GRACE_KEY} and ${CANCEL_WAIT_KEY} unreadable: ${err.message}` };
  }
  const grace = resolveGateKillGrace(snapshot);
  const wait = resolveCancelWait(snapshot);
  const problems = [];
  const graceProblem = gateKillGraceProblem(grace.value);
  if (graceProblem) problems.push(`${graceProblem} (${grace.source})`);
  const waitProblem = cancelWaitProblem(wait.value);
  if (waitProblem) problems.push(`${waitProblem} (${wait.source})`);
  else if (Number.isInteger(wait.grace) && wait.value < wait.grace) {
    problems.push(`${CANCEL_WAIT_KEY} = ${wait.value} (${wait.source}) is shorter than ${GATE_KILL_GRACE_KEY} = ${wait.grace}: a stopped controller would leave before the gate can finish stopping the agent`);
  }
  if (problems.length > 0) return { passed: false, message: problems.join('; ') };
  return { passed: true, message: `${GATE_KILL_GRACE_KEY} = ${grace.value} (${grace.source}); ${CANCEL_WAIT_KEY} = ${wait.value} (${wait.source})` };
}
