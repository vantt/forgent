// run-supervisor-checks.mjs -- the doctor checks and fixes of the run supervisor
// (docs/platform/run-supervisor/spec.md, "Doctor and setup"). `registrations.mjs`
// registers them; the bodies live here.
//
// Checks only read (the stuck-attempt probe asks adopt for `--probe-only`, which writes
// nothing). The fixes write: `runtime-socket-dir` creates or tightens the socket directory,
// `run-attempts-stuck` sends the unclosed attempts through the adopt door.
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
import { adoptScan, listOpenAttemptDirs } from '../run-supervisor/client.mjs';
import { sweepAttempts } from '../run-supervisor/sweep.mjs';
import { resolveConfinementTempRoot } from '../runner/dispatch/confinement/cleanup.mjs';
import { GATE_KILL_GRACE_KEY, resolveGateKillGrace, gateKillGraceProblem } from '../run-supervisor/gate-kill-grace.mjs';

const ROUTES = ['supervise', 'gate', 'adopt', 'attempt-step'];
const PROBE_TIMEOUT_MS = 15_000;
const MAX_LISTED = 5;
/** `<16 hex chars>.sock`, as the runtime directory module sizes it. */
const SOCKET_NAME_BYTES = 21;

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

/** The runtime socket directory exists, is a real directory of this user and is 0700. */
export function checkRuntimeSocketDir({ env = process.env, uid = process.getuid?.() } = {}) {
  if (uid === undefined) return { passed: true, message: info('no runtime socket directory on this platform') };
  const state = socketDirState({ uid, env });
  if (state.problem) {
    const fixable = state.loose === true;
    return { passed: false, message: fixable ? `${state.problem} -- run "fgos doctor --fix"` : `${state.problem} -- fix it by hand, doctor --fix does not touch it` };
  }
  if (state.missing) return { passed: true, message: warn(`${state.dir} does not exist yet (fgos setup creates it)`) };
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

const STUCK_STATES = new Set(['needs-adopt', 'open']);

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
  const named = stuck.map((verdict) => `${verdict.attemptDir}${verdict.reason ? ` (${verdict.reason})` : ''}`);
  return { passed: false, message: `${stuck.length} attempt(s) have no holder and no closed.json: ${listed(named)} -- run "fgos doctor --fix"` };
}

export function fixRunAttemptsStuck(repoRoot) {
  const assignmentsRoot = assignmentsRootOf(repoRoot);
  if (listOpenAttemptDirs(assignmentsRoot).length === 0) return { changed: false, message: 'no attempt waits to be closed' };
  const { bin, error } = resolveBin(repoRoot);
  const result = sweepAttempts({ assignmentsRoot, tempRoot: resolveConfinementTempRoot(), adoptOptions: bin ? { hostBin: bin } : {} });
  if (result.adoptError) return { changed: false, message: `adopt could not run: ${result.adoptError}${error ? ` (${error})` : ''}` };
  const adopted = (result.adopt ?? []).filter((verdict) => verdict.state === 'adopted');
  const left = (result.adopt ?? []).filter((verdict) => STUCK_STATES.has(verdict.state));
  const message = `adopted ${adopted.length} attempt(s)${left.length > 0 ? `; ${left.length} still open: ${listed(left.map((verdict) => `${verdict.attemptDir}${verdict.reason ? ` (${verdict.reason})` : ''}`))}` : ''}`;
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
