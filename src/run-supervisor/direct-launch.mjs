// The controller half of a supervised attempt, `direct` or `terminal` (r6 §9.4): take the attempt lock (and
// the cwd lease when the agent writes), write the immutable envelope and the secret side file, start
// `fgos internal supervise` detached with the locks handed over as descriptors, wait for its binding, then
// only read: progress from the capture files, the answer from the `result.json` the settle step writes.
// The controller never settles, never signals the agent and never owns a process of the attempt.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { spawn } from 'node:child_process';
import { acquireSync, createLockScope, spawnWithLocks, resolveLock, resolveStateRoot } from '../holder-lock/index.mjs';
import { DEFAULT_KILL_WAIT_MS } from '../holder-lock/protocol.mjs';
import { admitSuccessor } from './cwd-lock.mjs';
import { DispatchError } from './dispatch-error.mjs';
import { computeSha256Digest, openAgentFileSync, publishImmutableProof, publishMutableProjection } from '../native/proof-helpers.mjs';
import { selfRecord } from '../native/process-identity.mjs';
import { adoptRun, resolveRouteHostBin, RunSupervisorError } from './client.mjs';
import { readGateKillGraceMs } from './gate-kill-grace.mjs';
import { ensureRuntimeSocketDir } from './runtime-dir.mjs';
import { OWN_PAYLOAD_ROOT, realpathOrNull, releasePayloadRoot } from './payload-root.mjs';
import { RUN_SUPERVISOR_PROTOCOL as PROTOCOL, ATTEMPT_STEP_TIMEOUT_MS, MAX_ATTEMPT_STEPS } from './protocol.mjs';

// The supervisor's start budgets for a terminal seat, summed, plus 15 000 slack for the herdr calls:
// shell-ready 10 000 and launch-identify 5 000 (terminal-control route.rs), HELLO_LIMIT 15 000 (supervise.rs).
const BINDING_WAIT_MS = 45_000;
const POLL_MS = 25;
const CLOSE_WAIT_MS = 60_000;
const TAIL_CHUNK_BYTES = 1024 * 1024;
const ADOPT_POLL_MS = 250;
const ADOPT_WAIT_MS = 60_000;
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
 * order is checked. Throws `attempt-in-flight` / `dispatch-in-flight`; nothing stays held.
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

/** Where one attempt keeps the files its gate and its agent write. */
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
 * Create, empty, the files a sandboxed gate must write (exit record, two capture files) and the outbox.
 * The sandbox binds exactly these writable; the attempt directory around them stays read-only.
 * Returns the list the sandbox is asked to bind.
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

/** The sandbox command: the gate of this attempt. `direct`: GO channel at descriptor 5; `terminal`: the gate dials `goSocket`. */
export function attemptGateCommand(hostBin, runDir, { goSocket = null } = {}) {
  const base = [hostBin, 'internal', 'gate', '--protocol', String(PROTOCOL), '--envelope', path.join(path.resolve(runDir), 'envelope.json')];
  return goSocket ? [...base, '--go-socket', goSocket] : [...base, '--go-fd', '5'];
}

/** Where the gate of a `terminal` attempt reaches its supervisor: a hashed name in the owner-only runtime socket directory. */
export function terminalSocketPath(attemptId) {
  const name = crypto.createHash('sha256').update(attemptId).digest('hex').slice(0, 16);
  return path.join(ensureRuntimeSocketDir(), `${name}.sock`);
}

/** CLOCK_BOOTTIME now, in the envelope's shape. */
function boottimeNow() {
  return { bootId: selfRecord().bootId ?? 'unknown-boot', boottimeNs: Math.round(os.uptime() * 1e9) };
}

function boottimeAfter(afterMs) {
  const now = boottimeNow();
  return { bootId: now.bootId, boottimeNs: now.boottimeNs + Math.round(afterMs * 1e6) };
}

/** The environment of every step and of the supervisor: nothing but what the Node payload reads. */
export function attemptStepEnv({ env = process.env } = {}) {
  const out = {};
  for (const name of ENV_ALLOW) if (typeof env[name] === 'string') out[name] = env[name];
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('FGOS_') && typeof value === 'string' && name !== 'FGOS_LOCK_FD' && name !== 'FGOS_LOCK_JOB' && name !== 'FGOS_RUST_HOST_RECURSION_GUARD') out[name] = value;
  }
  out.FGOS_STATE_ROOT = resolveStateRoot({ env }).stateRoot;
  return out;
}

/**
 * `env` with the attempt's writer id applied (`FGOS_SESSION_ID` set, `FGOS_PARENT_WRITER_ID` set or removed),
 * so what the controller carried never reaches the agent. Both env sources of an attempt go through here.
 */
export function withIdentityEnv(env, identity) {
  if (!identity) return env;
  const out = { ...env };
  delete out.FGOS_PARENT_WRITER_ID;
  return { ...out, FGOS_SESSION_ID: identity.writerId, ...(identity.parentWriterId ? { FGOS_PARENT_WRITER_ID: identity.parentWriterId } : {}) };
}

/** The steps an attempt runs after its receipt, in order: the one list the envelope and the intent both carry. */
function attemptSteps({ runDir, host, stepEnv, extraSteps = [] }) {
  return ['settle-attempt', 'finalize-home', ...extraSteps].map((stepId) => ({
    stepId,
    hostBin: host.hostBin,
    payloadRoot: host.payloadRoot,
    argv: ['internal', 'attempt-step', stepId, '--protocol', String(PROTOCOL), '--run-dir', runDir],
    cwd: runDir,
    env: stepEnv,
    stepTimeoutMs: ATTEMPT_STEP_TIMEOUT_MS,
  }));
}

/**
 * Publish `attempt-intent.json` (contract attempt-intent.v1.json) right after the attempt lock is taken:
 * what the adopt door needs to close this attempt if the controller dies before it writes the envelope.
 * Written under the lock and replaced atomically; a resumed attempt with no envelope gets its new launch's intent.
 * A terminal attempt publishes it again with `pane` (`{slot: {key, groupKey}, endpointEnv}`) right before its
 * pane is allocated, so adopt can release that pane by its key.
 */
export function writeAttemptIntent({ runDir, attemptId, unitRunId, terminal, cwd, host, stepEnv, pane = null }) {
  const paths = attemptPaths(runDir, attemptId);
  publishMutableProjection(path.join(paths.runDir, 'attempt-intent.json'), {
    v: 1,
    attemptId,
    unitRunId,
    runDir: paths.runDir,
    mode: terminal ? 'terminal' : 'direct',
    cwd,
    launch: { capture: { stdout: paths.stdout, stderr: paths.stderr }, outboxDir: paths.outboxDir },
    steps: attemptSteps({ runDir: paths.runDir, host, stepEnv, extraSteps: terminal ? ['cleanup-trust'] : [] }),
    sideFile: paths.sideFile,
    ...(terminal && pane ? { terminal: { slot: pane.slot, endpointEnv: pane.endpointEnv } } : {}),
  });
}

/** Take the intent back once the run is settled without a launch: nothing is left for adopt to close. */
export function removeAttemptIntent(runDir) {
  fs.rmSync(path.join(runDir, 'attempt-intent.json'), { force: true });
}

/**
 * Build the envelope v3 body (without digest) of one attempt.
 * `attemptId` is minted by the controller and equals the launch command id; `runDir` is the absolute
 * attempt directory (`runs/<NN>`); `attempt` is `prepareConfinementForLaunch(...).attempt`.
 */
export function buildEnvelope({ attemptId, unitRunId, runDir, host, cwd, mutating, attempt, timeoutMs, idleTimeoutMs, maxOutputBytes, cli, stepEnv, gateKillGraceMs, killWaitMs, cwdLeaseFile, cwdLeaseOwner, identity, terminal = null, extraSteps = [] }) {
  if (2 + extraSteps.length > MAX_ATTEMPT_STEPS) throw new DispatchError('too-many-steps', `an attempt runs at most ${MAX_ATTEMPT_STEPS} steps`, { runDir });
  const paths = attemptPaths(runDir, attemptId);
  const confined = Array.isArray(attempt.bwrapPrefix);
  const mode = terminal ? 'terminal' : 'direct';
  return {
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
      // The writer id of the attempt and its lineage are not secrets.
      env: withIdentityEnv(attempt.env, identity),
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
      hardCeiling: boottimeAfter((timeoutMs || ATTEMPT_STEP_TIMEOUT_MS) + gateKillGraceMs + HARD_CEILING_SLACK_MS),
      gateKillGraceMs,
      killWaitMs,
    },
    agentProtocol: { cli, mode },
    identity,
    steps: [
      ...attemptSteps({ runDir, host, stepEnv, extraSteps }),
      ...(terminal ? [{ stepId: 'release-slot', builtin: true, disposition: { onSuccess: 'close', onFailure: 'retain' } }] : []),
    ],
    sideFile: paths.sideFile,
    createdAt: boottimeNow(),
    ...(terminal ? {
      slot: { key: attemptId, groupKey: terminal.groupKey },
      terminal: { socketPath: terminal.socketPath, exitCommand: terminal.exitCommand ?? null, orphanSettleMs: terminal.orphanSettleMs, ...(terminal.retainFailedPaneMs !== undefined ? { retainFailedPaneMs: terminal.retainFailedPaneMs } : {}) },
    } : {}),
    ...(cwdLeaseFile ? { cwdLeaseFile, ...(cwdLeaseOwner ? { cwdLeaseOwner } : {}) } : {}),
  };
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

/** The kill grace and the predecessor kill wait the envelope carries. */
export function readLaunchSettings(projectRoot) {
  return { gateKillGraceMs: readGateKillGraceMs({ projectRoot }), killWaitMs: DEFAULT_KILL_WAIT_MS };
}

/**
 * Start the supervisor for `envelope`. Unix: the locks go over as descriptors 3 (and 4); the controller
 * keeps cwd custody through commit, closing only the attempt copy at binding. Windows: the controller
 * releases the attempt copy after spawn; its existing helper keeps the cwd lease and the supervisor
 * declares its job on that same lease without reacquiring.
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

/**
 * Follow the capture files by offset and hand new text to `onChunk(stream, text)`. The agent writes these
 * files, so each look reads at most TAIL_CHUNK_BYTES and never follows a link; a multibyte character
 * that straddles two looks is held back until its rest arrives.
 */
export function captureTail(paths, onChunk) {
  const offsets = { stdout: 0, stderr: 0 };
  const decoders = { stdout: new StringDecoder('utf8'), stderr: new StringDecoder('utf8') };
  return () => {
    for (const stream of ['stdout', 'stderr']) {
      let fd;
      try {
        let stat;
        ({ fd, stat } = openAgentFileSync(paths[stream]));
        if (stat.size <= offsets[stream]) continue;
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

/** Wait for the supervisor's binding: `{state}` is `'bound'`, `'exited'` (ended without one; `exit` has its code) or `'unknown'` (alive, none in time). */
export async function waitForBinding(runDir, child, { timeoutMs = BINDING_WAIT_MS } = {}) {
  const binding = path.join(runDir, 'supervisor-binding.json');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(binding)) return { state: 'bound' };
    if (child.spawnError || child.exitCode !== null || child.signalCode !== null) {
      // The binding may have been published just before it exited.
      return fs.existsSync(binding) ? { state: 'bound' } : { state: 'exited', exit: child.exitCode, signal: child.signalCode, ...(child.spawnError ? { error: child.spawnError.code ?? String(child.spawnError.message) } : {}) };
    }
    await sleep(POLL_MS);
  }
  return fs.existsSync(binding) ? { state: 'bound' } : { state: 'unknown' };
}

/**
 * The result is written by the first step; the supervisor still runs the steps after it and holds the
 * attempt lock until it wrote `closed.json`. The next dispatch over the same cwd or attempt must not meet
 * that tail, so the controller waits for it (bounded: a stuck step never holds the caller).
 */
async function waitForClosed(runDir, child, { timeoutMs = CLOSE_WAIT_MS } = {}) {
  const closed = path.join(runDir, 'closed.json');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // The supervisor drops the attempt lock when its process ends, a moment after it wrote closed.json.
    if (child.exitCode !== null || child.signalCode !== null) return fs.existsSync(closed);
    await sleep(POLL_MS);
  }
  return fs.existsSync(closed);
}

/**
 * After the binding: read progress, wait for `result.json`. If the supervisor ends before the result
 * exists, the adopt door finishes whatever it left (the steps), then the result is read again.
 * Returns the frozen run result, or null when nothing settled it.
 */
export async function awaitSettledResult({ runDir, runId, child, capture, onChunk, ceilingMs, readSettledResult }) {
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
      // No supervisor left to write the answer: the adopt door judges the attempt and finishes its steps;
      // an agent that still lives (the gate holds the attempt lock) is waited for here.
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
