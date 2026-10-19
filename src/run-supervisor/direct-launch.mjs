// The controller half of a supervised attempt, `direct` or `terminal` (r6 §9.4): take the attempt lock (and the cwd lease when the
// agent writes), let the caller prepare, write the immutable envelope and the secret side file, start
// `fgos internal supervise` detached with the locks handed over as descriptors, wait for its binding, and
// then only read: progress from the capture files, the answer from `result.json` that the settle step
// writes. The controller never settles, never signals the agent and never owns a process of the attempt.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { spawn } from 'node:child_process';
import { acquireSync, createLockScope, spawnWithLocks, resolveLock, resolveStateRoot, readPredecessorKillWaitMs, HolderLockError } from '../holder-lock/index.mjs';
import { admitSuccessor } from '../runner/dispatch/cwd-lock.mjs';
import { DispatchError } from '../runner/dispatch/dispatch-error.mjs';
import { computeSha256Digest, publishImmutableProof, publishMutableProjection } from '../runner/dispatch/proof-helpers.mjs';
import { getBootId } from '../runner/dispatch/process-identity.mjs';
import { interpretRunResult } from '../runner/dispatch/run-result.mjs';
import { adoptRun, resolveRouteHostBin, RunSupervisorError } from './client.mjs';
import { readGateKillGraceMs } from './gate-kill-grace.mjs';
import { ensureRuntimeSocketDir } from './runtime-dir.mjs';
import { OWN_PAYLOAD_ROOT, realpathOrNull, releasePayloadRoot } from './payload-root.mjs';

const PROTOCOL = 1;
const BINDING_WAIT_MS = 30_000;
const POLL_MS = 25;
const CLOSE_WAIT_MS = 60_000;
const TAIL_CHUNK_BYTES = 1024 * 1024;
const ADOPT_POLL_MS = 250;
const ADOPT_WAIT_MS = 60_000;
const STEP_TIMEOUT_MS = 10 * 60 * 1000;
/** Slack past the soft deadline for SIGTERM, the kill grace and the supervisor's own domain sweep. */
const HARD_CEILING_SLACK_MS = 15_000;
const ENV_ALLOW = ['PATH', 'HOME', 'USERPROFILE', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'LC_ALL', 'SYSTEMROOT', 'XDG_RUNTIME_DIR'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The host binary of the running release and the payload the steps run from, resolved once per launch. */
export function resolveAttemptHost() {
  const hostBin = realpathOrNull(resolveRouteHostBin());
  if (!hostBin) throw new RunSupervisorError('host-unavailable', 'the host binary does not exist');
  return { hostBin, payloadRoot: releasePayloadRoot(hostBin) ?? OWN_PAYLOAD_ROOT };
}

/**
 * Take `attempt` (rank 15) and, for an agent that writes, `dispatch-cwd` (rank 30), in one scope so the
 * order is checked. Throws `attempt-in-flight` / `dispatch-in-flight` by name; nothing stays held.
 */
export function acquireAttemptLocks({ fgosDir, assignmentDir, attemptStr, cwd, mutating, custody = null, executorId = null, capability = null }) {
  if (custody && (custody.released || custody.name !== 'dispatch-cwd' || custody.path !== resolveLock('dispatch-cwd', { fgosDir, cwd }).v3Path)) {
    throw new DispatchError('custody-required', 'attempt custody must be the held lease of this cwd', { cwd, executorId, capability });
  }
  const scope = createLockScope('attempt');
  const taken = acquireSync(scope, 'attempt', { fgosDir, runDir: assignmentDir, NN: attemptStr });
  if (taken.result !== 'acquired') {
    throw new DispatchError('attempt-in-flight', `attempt ${attemptStr} of ${assignmentDir} is already held by another process`, { assignmentDir, attemptStr });
  }
  let cwdLease = custody;
  if (mutating && !custody) {
    try {
      cwdLease = admitSuccessor(scope, fgosDir, cwd);
    } catch (err) {
      taken.handle.release();
      throw err;
    }
  }
  return {
    attempt: taken.handle,
    cwdLease,
    releaseAttempt() { taken.handle.release(); },
    /** Close this process's copies; the supervisor keeps its own. Safe to call twice. */
    release() {
      for (const handle of [custody ? null : cwdLease, taken.handle]) {
        if (!handle) continue;
        try { handle.release(); } catch { /* already closed */ }
      }
    },
  };
}

/** Where one attempt keeps the files its gate and its agent write, derived from the attempt directory. */
export function attemptPaths(runDir, attemptId) {
  const dir = path.resolve(runDir);
  const captureDir = path.join(dir, 'protected', 'capture', attemptId);
  return {
    runDir: dir,
    sideFile: path.join(dir, 'protected', 'attempt-secrets.json'),
    captureDir,
    stdout: path.join(captureDir, 'stdout.log'),
    stderr: path.join(captureDir, 'stderr.log'),
    gateExit: path.join(dir, 'gate-exit.json'),
    outboxDir: path.join(dir, 'worker-output', 'outbox'),
  };
}

/**
 * Create, empty, the files a sandboxed gate must write (its exit record and the two capture files) and
 * the outbox. The sandbox binds exactly these files writable; the attempt directory around them stays
 * read-only. Returns the list the sandbox is asked to bind.
 */
export function prepareAttemptFiles(runDir, attemptId) {
  const paths = attemptPaths(runDir, attemptId);
  fs.mkdirSync(path.join(paths.runDir, 'protected'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(paths.captureDir, { recursive: true });
  fs.mkdirSync(paths.outboxDir, { recursive: true });
  const binds = [paths.stdout, paths.stderr, paths.gateExit];
  for (const file of binds) fs.closeSync(fs.openSync(file, 'a', 0o600));
  return binds;
}

/**
 * The command the sandbox runs: the gate of this attempt. `direct`: GO channel at descriptor 5 (what the
 * supervisor appends). `terminal`: the gate dials the attempt's unix socket `goSocket`.
 */
export function attemptGateCommand(hostBin, runDir, { goSocket = null } = {}) {
  const base = [hostBin, 'internal', 'gate', '--protocol', String(PROTOCOL), '--envelope', path.join(path.resolve(runDir), 'envelope.json')];
  return goSocket ? [...base, '--go-socket', goSocket] : [...base, '--go-fd', '5'];
}

/**
 * Where the gate of a `terminal` attempt reaches its supervisor: the owner-only runtime socket directory,
 * a name derived from the attempt id so no id can name another attempt's socket.
 */
export function terminalSocketPath(attemptId) {
  const name = crypto.createHash('sha256').update(attemptId).digest('hex').slice(0, 16);
  return path.join(ensureRuntimeSocketDir(), `${name}.sock`);
}

/** CLOCK_BOOTTIME now, in the shape the envelope uses. */
function boottimeNow() {
  return { bootId: getBootId(), boottimeNs: Math.round(os.uptime() * 1e9) };
}

/** The same boot, `afterMs` from now. */
function boottimeAfter(afterMs) {
  const now = boottimeNow();
  return { bootId: now.bootId, boottimeNs: now.boottimeNs + Math.round(afterMs * 1e6) };
}

/** The environment of every step and of the supervisor: nothing but what the Node payload reads. */
export function attemptStepEnv({ fgosDir, env = process.env } = {}) {
  const out = {};
  for (const name of ENV_ALLOW) if (typeof env[name] === 'string') out[name] = env[name];
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('FGOS_') && typeof value === 'string' && name !== 'FGOS_LOCK_FD' && name !== 'FGOS_LOCK_JOB' && name !== 'FGOS_RUST_HOST_RECURSION_GUARD') out[name] = value;
  }
  out.FGOS_STATE_ROOT = resolveStateRoot({ env, fgosDir }).stateRoot;
  return out;
}

/** The two variables an attempt's writer id travels in. */
export function identityEnv(identity) {
  if (!identity) return {};
  return {
    FGOS_SESSION_ID: identity.writerId,
    ...(identity.parentWriterId ? { FGOS_PARENT_WRITER_ID: identity.parentWriterId } : {}),
  };
}

/**
 * Build the envelope v3 body (without digest) and the side file of one attempt.
 *
 * @param {object} p
 * @param {string} p.attemptId        minted by the controller; equals the launch command id
 * @param {string} p.runDir           absolute attempt directory (`runs/<NN>`)
 * @param {object} p.attempt          `prepareConfinementForLaunch(...).attempt`
 * @param {string} p.capture          directory that holds the agent's stdout and stderr files
 */
export function buildEnvelope({ attemptId, unitRunId, runDir, host, cwd, mutating, attempt, timeoutMs, idleTimeoutMs, maxOutputBytes, cli, stepEnv, gateKillGraceMs, killWaitMs, cwdLeaseFile, cwdLeaseOwner, identity, terminal = null, extraSteps = [] }) {
  const paths = attemptPaths(runDir, attemptId);
  const sideFile = paths.sideFile;
  const step = (stepId) => ({
    stepId,
    hostBin: host.hostBin,
    payloadRoot: host.payloadRoot,
    argv: ['internal', 'attempt-step', stepId, '--protocol', String(PROTOCOL), '--run-dir', runDir],
    cwd: runDir,
    env: stepEnv,
    stepTimeoutMs: STEP_TIMEOUT_MS,
  });
  const confined = Array.isArray(attempt.bwrapPrefix);
  const mode = terminal ? 'terminal' : 'direct';
  const body = {
    v: 3,
    attemptId,
    unitRunId,
    runDir,
    mode,
    protocolId: PROTOCOL,
    hostBin: host.hostBin,
    payloadRoot: host.payloadRoot,
    cwd,
    mutation: mutating ? 'mutating' : 'read-only',
    launch: {
      command: attempt.command,
      args: attempt.args,
      // The writer id of the attempt and its lineage are not secrets; the gate sets both again last.
      env: { ...attempt.env, ...identityEnv(identity) },
      stdinPolicy: 'null',
      briefPath: terminal ? terminal.briefPath : null,
      outboxDir: terminal?.outboxDir ?? paths.outboxDir,
      ...(maxOutputBytes ? { maxOutputBytes } : {}),
      capture: { stdout: paths.stdout, stderr: paths.stderr },
    },
    containment: { preferred: confined ? 'linux-gate' : (process.platform === 'win32' ? 'windows-job' : process.platform === 'darwin' ? 'macos-tree' : 'linux-pgroup'), ...(confined ? { bwrapPrefix: [attempt.bwrapExecutable, ...attempt.bwrapPrefix] } : {}) },
    deadlines: {
      softAt: timeoutMs ? boottimeAfter(timeoutMs) : null,
      idleMs: idleTimeoutMs || null,
      hardCeiling: boottimeAfter((timeoutMs || STEP_TIMEOUT_MS) + gateKillGraceMs + HARD_CEILING_SLACK_MS),
      gateKillGraceMs,
      killWaitMs,
    },
    agentProtocol: { cli, mode },
    identity,
    steps: [
      step('settle-attempt'),
      step('finalize-home'),
      ...extraSteps.map(step),
      ...(terminal ? [{ stepId: 'release-slot', builtin: true, disposition: { onSuccess: 'close', onFailure: 'retain' } }] : []),
    ],
    sideFile,
    createdAt: boottimeNow(),
    ...(terminal ? {
      slot: { key: attemptId, groupKey: terminal.groupKey },
      terminal: { socketPath: terminal.socketPath, exitCommand: terminal.exitCommand ?? null, orphanSettleMs: terminal.orphanSettleMs, ...(terminal.retainFailedPaneMs !== undefined ? { retainFailedPaneMs: terminal.retainFailedPaneMs } : {}) },
    } : {}),
    ...(cwdLeaseFile ? { cwdLeaseFile, ...(cwdLeaseOwner ? { cwdLeaseOwner } : {}) } : {}),
  };
  return body;
}

/** Write envelope.json (digest included) and the 0600 side file; both exactly once. */
export function writeAttemptFiles({ runDir, body, secretEnv, controlEpoch, controlToken }) {
  const envelope = { ...body, digest: computeSha256Digest(body) };
  fs.mkdirSync(path.join(runDir, 'protected'), { recursive: true, mode: 0o700 });
  const side = { v: 1, attemptId: body.attemptId, env: secretEnv, controlEpoch, controlToken };
  fs.writeFileSync(body.sideFile, JSON.stringify(side), { mode: 0o600, flag: 'wx' });
  if (!publishImmutableProof(path.join(runDir, 'envelope.json'), envelope)) {
    throw new DispatchError('launch-collision', `attempt ${body.attemptId} already has an envelope`, { runDir });
  }
  return envelope;
}

/** What the settle step needs from this controller that no file of the attempt carries. */
export function writeSettleContext(runDir, context) {
  publishMutableProjection(path.join(runDir, 'controller', 'settle-context.json'), { v: 1, ...context });
}

/** Read the controller side settings once: the kill grace and the predecessor kill wait. */
export function readLaunchSettings(projectRoot) {
  return { gateKillGraceMs: readGateKillGraceMs({ projectRoot }), killWaitMs: readPredecessorKillWaitMs({ projectRoot }) };
}

/**
 * Start the supervisor for `envelope`. Unix: the locks go over as descriptors 3 (and 4); the controller
 * keeps cwd custody through commit, closing only the attempt copy at binding. Windows: the controller
 * releases the attempt copy after spawn; its existing helper keeps the cwd lease and the supervisor
 * declares its job on that same lease without reacquiring.
 * @returns {{child: import('node:child_process').ChildProcess}}
 */
export function startSupervisor({ envelope, locks, stepEnv, extraEnv = {} }) {
  const runDir = envelope.runDir;
  const log = fs.openSync(path.join(runDir, 'supervisor.log'), 'a', 0o600);
  let started = false;
  const argv = ['internal', 'supervise', '--envelope', path.join(runDir, 'envelope.json'), '--protocol', String(PROTOCOL)];
  try {
    if (process.platform === 'win32') {
      const child = spawn(envelope.hostBin, argv, { cwd: runDir, env: { ...stepEnv, ...extraEnv }, stdio: ['ignore', log, log], detached: true, windowsHide: true });
      child.once('error', (err) => { child.spawnError = err; });
      child.unref();
      started = true;
      return { child, handsOverLocks: false };
    }
    const held = [locks.attempt, ...(locks.cwdLease ? [locks.cwdLease] : [])];
    const child = spawnWithLocks(held, { command: envelope.hostBin, args: argv, cwd: runDir, env: { ...stepEnv, ...extraEnv }, stdout: log, stderr: log });
    started = true;
    return { child, handsOverLocks: true };
  } finally {
    fs.closeSync(log);
    // Nothing was handed over: the secrets and the control token have no reader, so they do not stay on disk.
    if (!started) fs.rmSync(envelope.sideFile, { force: true });
  }
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

/**
 * Follow the capture files by offset and hand new text to `onChunk(stream, text)`; no IPC. The agent writes
 * these files, so each look reads at most TAIL_CHUNK_BYTES and never follows a link; a multibyte character
 * that straddles two looks is held back until its rest arrives.
 */
export function captureTail(paths, onChunk) {
  const offsets = { stdout: 0, stderr: 0 };
  const decoders = { stdout: new StringDecoder('utf8'), stderr: new StringDecoder('utf8') };
  return () => {
    for (const stream of ['stdout', 'stderr']) {
      let fd;
      try {
        fd = fs.openSync(paths[stream], fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.size <= offsets[stream]) continue;
        const length = Math.min(stat.size - offsets[stream], TAIL_CHUNK_BYTES);
        const buffer = Buffer.alloc(length);
        const read = fs.readSync(fd, buffer, 0, length, offsets[stream]);
        offsets[stream] += read;
        const text = decoders[stream].write(buffer.subarray(0, read));
        if (text && onChunk) { try { onChunk(stream, text); } catch { /* an observer never stops the run */ } }
      } catch { /* the file is not there yet */ } finally {
        if (fd !== undefined) try { fs.closeSync(fd); } catch { /* closed */ }
      }
    }
  };
}

/**
 * Wait until the supervisor has bound the attempt. Returns `'bound'`, `'exited'` (the supervisor ended
 * without a binding, its exit code in `exit`) or `'unknown'` (still alive, no binding in time).
 */
export async function waitForBinding(runDir, child, { timeoutMs = BINDING_WAIT_MS } = {}) {
  const binding = path.join(runDir, 'supervisor-binding.json');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(binding)) return { state: 'bound' };
    if (child.spawnError || child.exitCode !== null || child.signalCode !== null) {
      // The binding may have been published in the instant before it exited.
      return fs.existsSync(binding) ? { state: 'bound' } : { state: 'exited', exit: child.exitCode, signal: child.signalCode, ...(child.spawnError ? { error: child.spawnError.code ?? String(child.spawnError.message) } : {}) };
    }
    await sleep(POLL_MS);
  }
  return fs.existsSync(binding) ? { state: 'bound' } : { state: 'unknown' };
}

/** The settled result of the attempt, or null while there is none (or it cannot be read). */
export function readSettledResult(runDir, runId) {
  const file = path.join(runDir, 'result.json');
  if (!fs.existsSync(file)) return null;
  try {
    const result = interpretRunResult(file, { expectedRunId: runId });
    return result && !result.corrupt && !result.contractCorrupt && !result.resultCorrupt && result.classification?.provenance !== 'contract-corrupt' ? result : null;
  } catch { return null; }
}

/**
 * The result is written by the first step; the supervisor still runs the steps after it and holds the
 * attempt lock until it has written `closed.json`. Whoever dispatches next over the same cwd or attempt must
 * not meet that tail, so the controller waits for it (bounded: a stuck step never holds the caller).
 */
async function waitForClosed(runDir, child, { timeoutMs = CLOSE_WAIT_MS } = {}) {
  const closed = path.join(runDir, 'closed.json');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const gone = child.exitCode !== null || child.signalCode !== null;
    // The supervisor drops the attempt lock when its process ends, a moment after it wrote closed.json.
    if (gone) return fs.existsSync(closed);
    await sleep(POLL_MS);
  }
  return fs.existsSync(closed);
}

/**
 * After the binding: read progress, wait for `result.json`. If the supervisor ends before the result
 * exists, the adopt door finishes whatever it left (the steps), then the result is read again.
 * Returns the frozen run result, or null when nothing settled it.
 */
export async function awaitSettledResult({ runDir, runId, child, capture, onChunk, ceilingMs }) {
  const follow = captureTail(capture, onChunk);
  const giveUpAt = Date.now() + ceilingMs;
  // The gate ends the agent by its hard ceiling, so an attempt that is still alive past ours is stuck.
  const hardGiveUpAt = giveUpAt + ADOPT_WAIT_MS;
  for (;;) {
    follow();
    const result = readSettledResult(runDir, runId);
    if (result) {
      follow();
      await waitForClosed(runDir, child);
      return Object.freeze(result);
    }
    const supervisorGone = child.exitCode !== null || child.signalCode !== null;
    if (supervisorGone || Date.now() >= giveUpAt) {
      // No supervisor left to write the answer: the adopt door judges the attempt and finishes whatever it
      // left (the steps). An agent that still lives (the gate holds the attempt lock) is waited for here.
      let judged;
      try { judged = adoptRun(runDir); } catch { return readSettledResult(runDir, runId); }
      const waiting = judged.state === 'running' || judged.state === 'being-adopted' || judged.state === 'held' || judged.state === 'needs-adopt';
      if (!waiting || Date.now() >= hardGiveUpAt) {
        const last = readSettledResult(runDir, runId);
        return last ? Object.freeze(last) : null;
      }
      await sleep(ADOPT_POLL_MS);
      continue;
    }
    await sleep(POLL_MS);
  }
}

export { HolderLockError };
