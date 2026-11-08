// run-supervisor-checks.mjs -- the doctor checks and fixes of the run supervisor
// (docs/platform/run-supervisor/spec.md, "Doctor and setup"). `registrations.mjs`
// registers them; the bodies live here.
//
// Checks only read. The one fix writes: `runtime-socket-dir` creates or tightens the socket directory.
// Four rows cover the layer: `run-supervisor-route` (routes and containment driver), `runtime-socket-dir`
// (existence, ownership and mode), `run-attempts-stuck` (a read-only pointer: the next `fgos run` adopts
// open attempts) and `run-supervisor-config` (kill grace and cancel wait).
//
// Levels follow the doctor convention: `passed: false` fails, a message that starts with
// `warning:` warns, `info:` is informational, anything else passes.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hostBin } from '../holder-lock/driver.mjs';
import { routeEnv } from '../util/host-bin-path.mjs';
import { RUN_SUPERVISOR_PROTOCOL as PROTOCOL } from '../run-supervisor/protocol.mjs';
import { resolveRuntimeSocketDir, ensureRuntimeSocketDir, RuntimeDirError, SOCKET_PATH_MAX_BYTES, SOCKET_NAME_BYTES } from '../run-supervisor/runtime-dir.mjs';
import { listOpenAttemptDirs } from '../run-supervisor/client.mjs';
import { GATE_KILL_GRACE_KEY, readDispatchConfig, resolveGateKillGrace, gateKillGraceProblem, CANCEL_WAIT_KEY, resolveCancelWait, cancelWaitProblem } from '../run-supervisor/gate-kill-grace.mjs';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { attemptLockState } from '../runner/dispatch/visibility-session.mjs';
import { fgosDirFromRoot } from '../runner/paths.mjs';
import { deriveUnitState, unitDirOfAssignment } from '../runner/execution/unit-state.mjs';

const ROUTES = ['supervise', 'gate', 'adopt', 'attempt-step'];
const PROBE_TIMEOUT_MS = 15_000;
const MAX_LISTED = 5;

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

/** The runtime socket directory exists, is a real directory of this user and is 0700. */
export function checkRuntimeSocketDir({ env = process.env, uid = process.getuid?.() } = {}) {
  if (uid === undefined) return { passed: true, message: info('no runtime socket directory on this platform') };
  const state = socketDirState({ uid, env });
  if (state.problem) {
    const fixable = state.loose === true;
    return { passed: false, message: fixable ? `${state.problem} -- run "fgos doctor --fix"` : `${state.problem} -- fix it by hand, doctor --fix does not touch it` };
  }
  if (state.missing) return { passed: true, message: warn(`${state.dir} does not exist yet (fgos doctor --fix creates it)`) };
  return { passed: true, message: `${state.dir} is 0700 and owned by uid ${uid}` };
}

export function fixRuntimeSocketDir({ env = process.env, uid = process.getuid?.() } = {}) {
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
    return { changed: before.missing === true, message: before.missing ? `created ${dir} (0700)` : `${dir} already in order` };
  } catch (err) {
    if (err instanceof RuntimeDirError) return { changed: false, message: err.message };
    return { changed: false, message: `${before.dir}: ${err.code ?? err.message}` };
  }
}

// ---------------------------------------------------------------------
// run-attempts-stuck
// ---------------------------------------------------------------------

/** Unit runs whose controller is gone and whose last attempt is closed, as the resume commands to type. */
function unitsAwaitingResume(repoRoot, openAttempts) {
  const fgosDir = fgosDirFromRoot(repoRoot);
  const unitDirs = new Set();
  for (const { assignmentId } of listAssignmentRuns(fgosDir)) {
    const unitDir = unitDirOfAssignment(fgosDir, assignmentId);
    if (unitDir) unitDirs.add(unitDir);
  }
  // An attempt that is not closed is not awaiting a resume: its controller or the next adopt still owns it.
  const probe = (attemptDir) => ({ state: openAttempts.has(attemptDir) ? 'open' : 'closed' });
  const waiting = [];
  for (const unitDir of [...unitDirs].sort()) {
    const unit = deriveUnitState(unitDir, { probe });
    if (unit.unitState === 'awaiting-resume') waiting.push(unit.resumeCommand);
  }
  return waiting;
}

/**
 * A read-only pointer: supervised attempts with no `closed.json` whose lock nobody holds (a running attempt holds it), and
 * the unit runs awaiting `fgos run --resume`. It adopts nothing: the next `fgos run` adopts them, and
 * `fgos dispatch recover` is the manual door. Warns, never fails.
 */
export function checkRunAttemptsStuck(repoRoot) {
  const open = listOpenAttemptDirs(assignmentsRootOf(repoRoot));
  // Only an attempt the supervisor started (an envelope) or a controller meant to start (its intent) is adopt's; a run
  // from before the supervisor has neither and nothing to adopt.
  const supervised = open.filter((attemptDir) => ['envelope.json', 'attempt-intent.json'].some((name) => fs.existsSync(path.join(attemptDir, name))));
  const stuck = supervised.filter((attemptDir) => attemptLockState(attemptDir) !== 'held');
  let waiting = [];
  try {
    waiting = unitsAwaitingResume(repoRoot, new Set(open));
  } catch (err) {
    return { passed: true, message: warn(`unit runs exist but could not be judged (${err.message}); run \`fgos dispatch inspect\``) };
  }
  if (stuck.length === 0 && waiting.length === 0) return { passed: true, message: supervised.length === 0 ? 'no attempt waits to be closed' : `${supervised.length} open attempt(s), all running` };
  return { passed: true, message: warn(`${stuck.length} attempt(s) have no holder and no closed.json, ${waiting.length} unit run(s) await resume; the next \`fgos run\` adopts them, or run \`fgos dispatch recover\``) };
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
