// dispatch/herdr-round.mjs — one interactive round through herdr: prepare a
// run directory, confine the worker, open a pane, start an agent, brief it,
// wait for its receipt, and end it.
//
// Split out of `transport.mjs`, where it had grown to 369 lines inside a file
// that also holds two unrelated adapters. The sequence, the signals it
// trusts, and the failures it names are unchanged from that version. What
// changed is that each step of the sequence is a named function a reader can
// take in one at a time, and `runHerdrRound` now reads as the sequence rather
// than as its implementation.
//
// Three refusals shaped every step below, each because doing the opposite
// failed in measured production:
//
// 1. The prompt never travels as keystrokes. It goes to disk; one line
//    pointing at it goes through the terminal. The old path quoted the prompt
//    into an argv string and let herdr type it, which corrupts every
//    multi-line prompt there is -- and a real implementation prompt is always
//    multi-line.
//
// 2. `agent_status` never concludes a round. That reading was wrong twice:
//    `idle` before the agent had started at all, and an `idle`-looking dip
//    between two tool calls of one turn. Completion is the worker's own
//    `outbox/result-<round>.json` existing, and nothing else.
//
// 3. A failed round keeps its pane. That screen is the only place the reason
//    is still legible, so every failure here names its reason and leaves the
//    pane id on the error for someone to go and look at.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { DispatchError } from './dispatch-error.mjs';
import { createHerdrClient, createBatchTab, normalizeAgentName, isReadyState } from './herdr-agent.mjs';
import { briefPaths, renderBrief, renderPointer } from './brief.mjs';
import { evaluateLadder, paneFateFor } from './liveness.mjs';
import { writeVisibility } from './visibility-session.mjs';
import { createWorkerHome, removeWorkerHome, redactWorkerHome } from './worker-home.mjs';
import { seedTrust, seedCodexTrust } from './trust-store.mjs';
import { ensureWorkerSession, DEFAULT_WORKER_SESSION } from './worker-session-boot.mjs';
import { normalizeLegacyConfinement } from './confinement/policies.mjs';
import { evaluateBypassPairing } from './confinement/bypass-pairing.mjs';
import {
  publishImmutableProof,
  publishMutableProjection,
  computeSha256Digest,
  canonicalJson,
  getProcessStartTime,
} from './cli-spawn-supervisor.mjs';

/**
 * Robust shell escaping for command-line arguments.
 */
export function shellEscapeArg(arg) {
  if (typeof arg !== 'string') arg = String(arg ?? '');
  if (arg.length === 0) return "''";
  if (/^[a-zA-Z0-9_./=+:,-]+$/.test(arg)) return arg;
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

/**
 * Generate the launcher script file content for confined launch.
 */
export function buildLauncherScriptContent({ argv0, command, args, env, workerCommandDigest }) {
  const lines = [
    '#!/usr/bin/env bash',
    'set -e',
    `# fgos-launcher-v1 workerCommandDigest: ${workerCommandDigest}`,
  ];
  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) {
        lines.push(`export ${k}=${shellEscapeArg(v)}`);
      }
    }
  }
  const escapedArgs = (args || []).map(shellEscapeArg).join(' ');
  const execLine = `exec -a ${shellEscapeArg(argv0)} ${shellEscapeArg(command)}${escapedArgs ? ' ' + escapedArgs : ''}`;
  lines.push(execLine);
  return lines.join('\n') + '\n';
}

/**
 * Verify that the foreground process in the pane is executing the prepared command.
 *
 * MEDIUM-3: herdr's own process-info reporting has been observed to drop
 * empty-string argv entries (a `''` array element never makes it into
 * `proc.argv`), which used to fail this comparison on length alone for any
 * prepared `args` that legitimately contained one -- a false mismatch, not
 * a real one. `args` is filtered the same way before comparing, so both
 * sides are measured on the same terms.
 */
export function verifyForegroundProcessArgv({ foregroundProcesses, shellPid, argv0, command, args }) {
  if (!Array.isArray(foregroundProcesses) || foregroundProcesses.length === 0) return null;
  const expectedRest = Array.isArray(args) ? args.filter((a) => a !== '') : [];
  for (const proc of foregroundProcesses) {
    if (proc.pid && proc.pid !== shellPid && Array.isArray(proc.argv) && proc.argv.length > 0) {
      const procArgv0 = proc.argv[0];
      const procRest = proc.argv.slice(1);
      const argv0Matches = procArgv0 === argv0 || procArgv0 === command || procArgv0 === path.basename(command);
      if (argv0Matches) {
        if (expectedRest.length === 0) {
          if (procRest.length === 0) return proc;
        } else if (procRest.length === expectedRest.length) {
          const allMatch = procRest.every((a, i) => a === expectedRest[i]);
          if (allMatch) return proc;
        }
      }
    }
  }
  return null;
}

/**
 * F3: a binary swap (same argv0/args, a different real executable behind
 * it) or an env-only tamper both pass `verifyForegroundProcessArgv` --
 * argv is a claim the process makes about itself, not proof of what is
 * actually executing. `/proc/<pid>/exe` is the kernel's own answer, the
 * same identity signal P02L's cli-spawn confinement path already resolves
 * for its own binary-identity proof (`getProcessStartTime`,
 * cli-spawn-supervisor.mjs, reads `/proc/<pid>/stat` the same way).
 *
 * Returns `true`/`false` when both sides resolve (Linux, process still
 * alive, `expectedCommand` resolvable on disk), or `null` when the signal
 * is unavailable (non-Linux, process already gone, `expectedCommand` not a
 * real path) -- `null` is "no evidence either way", never treated as a
 * pass.
 */
export function verifyProcessExeIdentity(pid, expectedCommand) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  let realExe;
  try {
    realExe = fs.readlinkSync(`/proc/${pid}/exe`);
  } catch {
    return null;
  }
  let expectedReal;
  try {
    expectedReal = fs.realpathSync(expectedCommand);
  } catch {
    return null;
  }
  return realExe === expectedReal;
}

/**
 * The ladder's outcome is the precise answer; `errorClass` stays the coarse
 * vocabulary `recovery.mjs` matches on, so the recovery matrix keeps working
 * unchanged. A caller that wants the real reason reads `outcome`.
 *
 * A known seam, stated rather than hidden: `blocked` and `paused-limit` both
 * map to `worker-timeout`, so the matrix will retry them like any other
 * timeout even though neither is worth retrying immediately. Fixing that
 * means giving the matrix its own entries, which belongs with Run truth, not
 * with the adapter.
 */
const ERROR_CLASS_FOR_OUTCOME = Object.freeze({
  died: 'worker-spawn-fail',
  blocked: 'worker-timeout',
  'timed-out-idle': 'worker-timeout',
  'timed-out-ceiling': 'worker-timeout',
  'paused-limit': 'worker-timeout',
});

/**
 * The transport's own deadlines.
 *
 * These are constants, not executor config. Each is a property of how herdr
 * behaves, not of which agent is being run: how long herdr may take to bring an
 * agent to ready, how long it may take to accept a submission, how patient to
 * be with a brief nobody acknowledged. They were declarable per executor for a
 * while; no executor ever set one, and nobody configuring an executor had a
 * basis to choose a different value. What is genuinely a person's decision --
 * how long the WORK may take -- stays in `timeoutMs`/`idleTimeoutMs`.
 */
/** `agent start`'s own documented default. */
const READY_TIMEOUT_MS = 30000;
/** herdr's own stall detector fires at 5000ms; anything shorter on this side
 * wins the race and hands the caller a bare timeout instead of the real
 * reason. Measured upstream: 5s broke, 20s worked. */
const PROMPT_TIMEOUT_MS = 20000;
/** A brief that never landed is worth re-sending a couple of times; a brief
 * that never lands twice is a broken transport, not a slow one. */
const MAX_RESENDS = 2;

/** How often the receipt poll looks at the outbox. */
const RECEIPT_POLL_MS = 500;
/** How often the poll stamps `visibility.json` to say the driver is still
 * here. Nothing else on disk distinguishes a run being driven from a run
 * abandoned mid-flight -- without this a reader has to guess, and the only
 * safe guess for a long round is the wrong one. */
const HEARTBEAT_MS = 10000;
/** How long the exit sequence waits for the agent process to actually leave
 * the pane before giving up and closing anyway. */
const EXIT_DRAIN_MS = 10000;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** The last line on screen with anything on it -- what a person would read to
 * see why an agent is blocked. Screen text explains a failure; it never
 * establishes that work happened. */
function lastScreenLine(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines[lines.length - 1] : null;
}

/**
 * Every deadline one round obeys, in three groups named for what each one
 * governs.
 *
 * `startup` bounds a herdr transport call: how long herdr may take to bring
 *   an agent to ready, and how long it may take to accept a submission.
 * `brief` bounds re-offering a brief nobody has acknowledged.
 * `round` bounds THE WORK rather than the transport: how long without
 *   progress, and how long in total.
 *
 * The executor's config surface is unchanged -- these are the same numbers
 * the caller already passed. Grouping them is what lets each step below be
 * handed the deadlines it uses and none of the ones it does not, which is
 * the difference between a real decomposition and passing the whole context
 * to every function.
 */
function groupDeadlines({ idleTimeoutMs, timeoutMs, transportDeadlines = {} }) {
  const promptMs = transportDeadlines.promptTimeoutMs ?? PROMPT_TIMEOUT_MS;
  return {
    startup: { readyMs: transportDeadlines.readyTimeoutMs ?? READY_TIMEOUT_MS, promptMs },
    brief: {
      // A brief is re-offered no sooner than one submission is allowed to take;
      // any less and the resend races the delivery it is waiting on.
      resendAfterMs: transportDeadlines.resendAfterMs ?? promptMs,
      maxResends: transportDeadlines.maxResends ?? MAX_RESENDS,
    },
    round: { idleMs: idleTimeoutMs, ceilingMs: timeoutMs },
  };
}

/**
 * One round's identity, plus the two things every step below does with it.
 *
 * `note` leaves a trace. Every binding is written BEFORE it is used, so a
 * dispatch process that dies mid-flight still leaves behind enough to find
 * what it started. It is never a gate: a visibility write that fails must not
 * take a working dispatch down with it, so it cannot throw.
 *
 * `fail` builds the error a caller can act on. `paneId` is unknown when a
 * round starts and belongs on every failure once it is known, which is why
 * this is one object rather than two free functions.
 */
function openRound({ runDir, workId, tier, model, agentName }) {
  const round = {
    runDir,
    workId,
    tier,
    model,
    agentName,
    paneId: null,
    note(patch) {
      try { writeVisibility(runDir, patch); } catch { /* a courtesy, not a contract */ }
    },
    fail(errorClass, reason, message, extra = {}) {
      return new DispatchError(errorClass, message, {
        workId, tier, model, reason, runDir, agentName, paneId: round.paneId, ...extra,
      });
    },
  };
  return round;
}

/**
 * The run directory, ready to be written into -- or a refusal.
 *
 * A run directory that already holds this round's result would settle on the
 * very first poll, before the worker just briefed has done anything, and the
 * exit sequence would then close a healthy agent's pane mid-work. The ladder
 * is right that a result file outranks everything; what it cannot know is
 * whether the file belongs to THIS round. Refusing here is the only place
 * that distinction still exists.
 */
function prepareRunDir({ runDir, roundNumber, workId, tier, model }) {
  const dir = runDir ? path.resolve(runDir) : fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-'));
  const paths = briefPaths(dir, roundNumber);
  fs.mkdirSync(paths.outbox, { recursive: true });

  if (fs.existsSync(paths.resultPath)) {
    throw new DispatchError(
      'invalid-config',
      `executor for work "${workId}" refused: ${paths.resultPath} already exists before this round started, so its first poll would settle on somebody else's result and close a working agent's pane. Use a fresh run directory or a new round.`,
      { workId, tier, model, reason: 'stale-result-in-run-dir', runDir: dir, resultPath: paths.resultPath },
    );
  }
  return { runDir: dir, paths };
}

/**
 * Apply declared confinement, before anything is launched.
 *
 * Two measures, and neither closes the hole alone. A private HOME closes the
 * `$HOME/.config/herdr/herdr.sock` fallback a worker would otherwise find
 * with no environment variable at all. It does NOT stop the worker reaching
 * the cockpit, because herdr injects `HERDR_SOCKET_PATH` into every pane it
 * creates and overwrites any override -- measured. What that leaves is the
 * one thing that does work: put the worker in a different session, so the
 * socket it is handed controls only worker panes.
 *
 * Declared, never inferred. An executor that declares nothing keeps the old
 * behaviour exactly, and Confinement Authority (`executeThroughConfinement`,
 * src/runner/dispatch/confinement/authority.mjs) has already refused any
 * `bypass` that did not declare all three confinement flags before this
 * function is ever reached on the real dispatch path.
 *
 * Confinement that was asked for and cannot be delivered is a refusal, not a
 * downgrade: running anyway would put a worker on the operator's cockpit
 * socket while the profile claims it is confined. The bypass-pairing and
 * `ownWorktree` checks below are backstops for callers that invoke this
 * adapter directly (bypassing Authority, as some tests do) -- not a second
 * policy implementation: the bypass-pairing check calls the exact same
 * `evaluateBypassPairing` function Authority itself calls
 * (confinement/bypass-pairing.mjs), so both entry points refuse an
 * incomplete pairing identically.
 */
export async function establishConfinement({ confinement, round, fullEnv, cwd, repoRoot, permissionMode, herdrBin }) {
  const normalized = confinement ? normalizeLegacyConfinement(confinement, `executor.${round.workId}.confinement`) : null;
  const effectiveConfinement = normalized ?? confinement;

  const hasOwnWorktree = Boolean(
    effectiveConfinement?.ownWorktree ||
    effectiveConfinement?.controls?.workspace === 'own',
  );
  const hasPrivateHome = Boolean(
    effectiveConfinement?.privateHome ||
    effectiveConfinement?.controls?.home === 'private',
  );
  const hasIsolatedSession = Boolean(
    effectiveConfinement?.isolatedSession ||
    effectiveConfinement?.controls?.session === 'isolated',
  );

  // Checked before ownWorktree/repoRoot, because an incomplete bypass pairing
  // is a refusal regardless of where the dispatch happens to be running.
  const { satisfied: bypassPairingSatisfied, missing: missingBypassControls } = evaluateBypassPairing({
    isBypass: permissionMode === 'bypass',
    hasOwnWorktree,
    hasPrivateHome,
    hasIsolatedSession,
  });
  if (!bypassPairingSatisfied) {
    throw round.fail('invalid-config', 'bypass-confinement-incomplete',
      `executor for work "${round.workId}" refused: permissionMode "bypass" requires full confinement (missing: ${missingBypassControls.join(', ')}).`);
  }

  // Checked next, because it is the one flag that is already true or already
  // false before anything is provisioned: a worker confined to its own
  // worktree cannot be running in the checkout it was told to stay out of.
  if (hasOwnWorktree && repoRoot && path.resolve(cwd) === path.resolve(repoRoot)) {
    throw round.fail('invalid-config', 'own-worktree-unavailable',
      `executor for work "${round.workId}" refused: confinement declares ownWorktree, but this dispatch runs in the repo root itself (${path.resolve(cwd)}) rather than a worktree of its own.`);
  }

  let workerHomePath = null;
  try {
    if (hasPrivateHome) {
      const home = createWorkerHome(os.tmpdir(), {
        runId: round.agentName,
        sourceHome: fullEnv.HOME ?? os.homedir(),
        workspacePath: path.resolve(cwd),
        repoRoot: repoRoot ?? path.resolve(cwd),
        permissionMode: permissionMode ?? 'ask',
      });
      workerHomePath = home.homePath;
      round.note({ workerHome: workerHomePath });
    }
    if (hasIsolatedSession) {
      // One worker session, never named by config: a config-supplied name could
      // point at the operator's own cockpit whenever that cockpit has a name
      // and the dispatch runs outside herdr, where there is no HERDR_SESSION
      // to compare it against.
      const session = await ensureWorkerSession(DEFAULT_WORKER_SESSION, {
        callerEnv: fullEnv,
        workerHome: workerHomePath,
        cwd,
        herdrBin,
      });
      round.note({ workerSession: session.sessionName });
      return { workerHomePath, sessionEnv: session.env, confined: true, status: 'confined' };
    }
    if (hasPrivateHome) {
      return { workerHomePath, sessionEnv: fullEnv, confined: true, status: 'confined' };
    }
    if (hasOwnWorktree) {
      return { workerHomePath: null, sessionEnv: fullEnv, confined: false, status: 'partial' };
    }
    return { workerHomePath: null, sessionEnv: fullEnv, confined: false, status: 'unconfined' };
  } catch (err) {
    if (workerHomePath) { try { removeWorkerHome(workerHomePath); } catch { /* nothing left to do */ } }
    throw round.fail('invalid-config', err.code ?? 'confinement-unavailable',
      `executor for work "${round.workId}" refused: confinement was declared but could not be established: ${err.message}`);
  }
}

/**
 * Pre-trust the workspace, or the agent stops at a folder-trust dialog with
 * nobody there to answer it and herdr reports `agent_not_ready`. Measured for
 * both claude and codex; agy shows no such dialog, which is why this is
 * DECLARED per executor rather than done for everyone -- an agent kind that
 * does not ask is not given an entry it never needed.
 *
 * Never throws. Refusing here would be worse than trying: the agent may
 * already be trusted by some other route, and the dialog it might still hit
 * is reported by name by the very next step anyway.
 */
function seedWorkspaceTrust({ trustStore, round, cwd, repoRoot, fullEnv }) {
  const projectPath = path.resolve(cwd);
  const repoRootForTrust = repoRoot ?? path.dirname(projectPath);
  try {
    if (trustStore.kind === 'codex-toml') {
      seedCodexTrust(
        trustStore.path ?? path.join(fullEnv.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'config.toml'),
        { projectPath, repoRoot: repoRootForTrust },
      );
    } else {
      seedTrust(
        trustStore.path ?? path.join(os.homedir(), '.claude.json'),
        { projectPath, repoRoot: repoRootForTrust },
      );
    }
    round.note({ trustSeeded: trustStore.kind });
  } catch (err) {
    round.note({ trustSeedFailed: err.message });
  }
}

/**
 * Bring an agent to ready in the pane, and record the session id herdr gave
 * it.
 *
 * `agent start` returns only once herdr has confirmed a ready agent, which is
 * what absorbs the shell boot race an earlier path had to poll around, and it
 * fails by name (`agent_not_ready`) instead of hanging. The pane stays open on
 * failure on purpose: whatever stopped the agent from becoming ready is still
 * on that screen.
 */
function startAgent({ client, round, agentKind, agentArgs, readyMs }) {
  try {
    client.agentStart(round.agentName, { kind: agentKind, paneId: round.paneId, timeoutMs: readyMs, agentArgs });
  } catch (err) {
    throw round.fail('worker-spawn-fail', err.code ?? 'agent_not_ready',
      `executor failed to start for work "${round.workId}": herdr could not bring a "${agentKind}" agent to ready in pane ${round.paneId} (${err.code ?? 'unknown'}): ${err.message}`);
  }

  // The agent session id exists from the moment the agent is ready, so it is
  // recorded now rather than at the first time something needs it -- a
  // reattach after a gateway restart matches on this.
  try {
    const info = client.agentGet(round.agentName);
    // This is the binding read elsewhere as `round.agentSession?.value`
    // (receipts, command projections) -- it was never assigned on `round`
    // itself, only logged via `note`, so a mismatch signal (a new
    // agent_session on the same pane) had no real data to compare against.
    //
    // herdr's own `agent_session` is ALREADY an object shaped
    // `{agent, kind, source, value}`, not a plain string -- `.value` is the
    // flat session-id string every downstream reader expects (receipts,
    // command projections, and reconcileHerdrSpawnRun's own incarnation
    // probe, which compares against a plain string it reads straight off a
    // live herdr call). Wrapping the whole object one level deeper here
    // doubly-nested it, so every consumer stored/compared an object instead
    // of a string and the reconcile probe's `!==` check never matched even
    // for a live, healthy worker.
    const flatAgentSession = (info.agentSession && typeof info.agentSession === 'object')
      ? info.agentSession.value
      : info.agentSession;
    round.agentSession = { value: flatAgentSession };
    round.note({ status: 'agent-ready', agentSession: info.agentSession, stateChangeSeq: info.stateChangeSeq });
  } catch {
    round.note({ status: 'agent-ready' });
  }
}

/**
 * What actually gets typed at the agent. `file-pointer` is the default
 * because one shape works for every agent kind; `inline` is a declared choice
 * with its own evidence, not a fallback taken when something goes wrong.
 */
function briefMessage({ delivery, briefText, runDir, roundNumber }) {
  return delivery === 'inline' ? briefText : renderPointer({ runDir, round: roundNumber });
}

/**
 * Submit the brief once.
 *
 * `--until working` confirms the submission was accepted and the turn began.
 * Waiting for a settled state instead would block this call for the entire
 * turn, and the turn is what the receipt poll is for.
 *
 * Returns the error instead of throwing it, because a first send and a later
 * re-send report the same failure differently.
 */
function submitBrief({ client, round, message, promptMs }) {
  const target = round.targetName ?? round.agentName;
  const isConfinedTarget = Boolean(round.targetName && round.targetName === round.paneId);
  try {
    if (isConfinedTarget) {
      client.agentPrompt(target, message, { wait: false, timeoutMs: promptMs });
    } else {
      client.agentPrompt(target, message, { wait: true, until: ['working'], timeoutMs: promptMs });
    }
    return null;
  } catch (err) {
    return err;
  }
}

/** The first submission. A brief the agent cannot even be handed is a spawn
 * failure, and `agent_blocked` means something is on screen worth quoting. */
function deliverBrief({ client, round, message, promptMs, resultPath }) {
  const err = submitBrief({ client, round, message, promptMs });
  if (!err) {
    round.note({ status: 'briefed' });
    return;
  }
  // `--until working` waits for herdr to observe the turn begin. A turn that
  // finishes faster than herdr polls would never be observed in that state,
  // and the wait would report a timeout for a brief that in fact landed and
  // was answered. Unverifiable without herdr's source, so it is guarded
  // instead of assumed: the worker's own result file outranks a transport
  // timeout, here exactly as it does everywhere else.
  if (err.code === 'timeout' && resultPath && fs.existsSync(resultPath)) {
    round.note({ status: 'briefed', briefTimeoutWithResultOnDisk: true });
    return;
  }
  let screen = null;
  if (err.code === 'agent_blocked') {
    const target = round.targetName ?? round.agentName;
    try { screen = lastScreenLine(client.agentRead(target, { lines: 40 })); } catch { screen = null; }
  }
  throw round.fail('worker-spawn-fail', err.code ?? 'agent_prompt_failed',
    `executor failed to brief the worker for work "${round.workId}": ${err.message}${screen ? ` -- last line on screen: ${screen}` : ''}`,
    screen ? { screen } : {});
}

/**
 * Is the worker's own process still in the pane?
 *
 * A probe that FAILS reports `unknown`, never `absent` -- the ladder needs
 * that distinction, since a single `unknown` resets an absent streak. A pane
 * that still exists proves nothing about the agent: an idle pane always lists
 * its own shell, so `present` means a foreground process that is not it.
 */
function livenessProbe(client, paneId) {
  return () => {
    try {
      const info = client.paneProcessInfo(paneId);
      return info.foregroundProcesses.some((p) => p.pid && p.pid !== info.shellPid)
        ? 'present'
        : 'absent';
    } catch {
      return 'unknown';
    }
  };
}

/**
 * Wait for the round to reach an outcome, offering the brief again if the
 * worker never acknowledged it.
 *
 * Receipt, not status: the ack proves the worker read the brief, and only the
 * result file ends the round. A round short enough to produce its result
 * before the first poll never shows an ack, and that is not a failure.
 */
async function pollForOutcome({ client, round, paths, message, deadlines, usageLimitPatterns, readLiveness }) {
  const limits = {
    idleTimeoutMs: deadlines.round.idleMs,
    ceilingMs: deadlines.round.ceilingMs,
    usageLimitPatterns,
  };

  const startedAt = Date.now();
  let ackSeen = false;
  let resends = 0;
  let lastResendAt = startedAt;
  let lastProgressAt = null;
  // How much of the current idle window nobody could see. Reset whenever
  // progress happens, because that starts a new window.
  let blindMs = 0;
  let lastTickAt = startedAt;
  let prior = { absentStreak: 0 };

  /**
   * One rung of the ladder.
   *
   * `evaluateLadder` is pure and stays that way: when it needs the screen it
   * says so and is asked again with the screen in hand, rather than being
   * handed a way to read one itself. It asks only once progress has already
   * stopped, so this never becomes a screen read per tick -- and because both
   * calls happen here, no screen text survives into the next tick.
   */
  const target = round.targetName ?? round.agentName;
  const decide = (observation) => {
    const first = evaluateLadder({ observation, limits, prior });
    if (!first.needsScreen) return first;
    let screen = '';
    try { screen = client.agentRead(target, { lines: 60 }); } catch { screen = ''; }
    return evaluateLadder({ observation: { ...observation, screen }, limits, prior });
  };

  let lastBeatAt = 0;

  for (;;) {
    // Say the driver is still here. A round can run for half an hour with no
    // state change at all, and `visibility.json` not moving for that long is
    // indistinguishable from a dispatch process that died -- which is what
    // makes an otherwise healthy run look abandoned to anyone reading it.
    if (Date.now() - lastBeatAt >= HEARTBEAT_MS) {
      lastBeatAt = Date.now();
      round.note({});
    }

    const tickAt = Date.now();

    if (!ackSeen && fs.existsSync(paths.ackPath)) {
      ackSeen = true;
      lastProgressAt = tickAt;
      blindMs = 0;
      round.note({ status: 'working' });
    }

    // Whether the status could be READ is tracked separately from what it
    // said. An interval herdr could not answer in is not an interval spent
    // watching a worker do nothing, so it is counted as blind and taken back
    // out of the idle measurement by the ladder.
    let agentState = 'unknown';
    let statusReadable = false;
    try {
      agentState = client.agentGet(target).agentStatus;
      statusReadable = true;
    } catch {
      agentState = 'unknown';
    }
    if (!statusReadable) blindMs += tickAt - lastTickAt;
    lastTickAt = tickAt;

    // `working` is a progress signal and nothing more. It never concludes a
    // round -- only the worker's own result file does that.
    if (agentState === 'working') {
      lastProgressAt = tickAt;
      blindMs = 0;
    }

    const decision = decide({
      resultFilePresent: fs.existsSync(paths.resultPath),
      liveness: readLiveness(),
      agentState,
      lastProgressAt,
      blindMs,
      startedAt,
      now: Date.now(),
      screen: null,
    });
    prior = decision;
    if (decision.outcome) return decision;

    if (!ackSeen && resends < deadlines.brief.maxResends
      && Date.now() - lastResendAt >= deadlines.brief.resendAfterMs) {
      // Re-send only when the agent is back at rest with still no ack. An
      // agent that is `working` has the brief and is acting on it; typing at
      // it again on a timer would interrupt the very turn being waited for.
      if (isReadyState(agentState)) {
        resends += 1;
        lastResendAt = Date.now();
        const retryError = submitBrief({ client, round, message, promptMs: deadlines.startup.promptMs });
        if (retryError) {
          throw round.fail('worker-spawn-fail', retryError.code ?? 'agent_prompt_failed',
            `executor failed to re-brief the worker for work "${round.workId}" (attempt ${resends + 1}): ${retryError.message}`);
        }
      }
    }

    await sleep(RECEIPT_POLL_MS);
  }
}

/**
 * End a round that did not settle, and build the error that says why.
 *
 * Any wait that gives up reads the screen on the way out, so the caller gets
 * a line it can quote instead of the word "timeout". That is one extra read
 * on a round that has already failed, so a false positive costs nothing.
 */
function concludeFailure({ client, round, decision, closeAlways }) {
  const target = round.targetName ?? round.agentName;
  let screenLine = decision.screenLine;
  if (!screenLine) {
    try { screenLine = lastScreenLine(client.agentRead(target, { lines: 60 })); } catch { screenLine = null; }
  }

  // `died` and `blocked` are states a watcher can act on; the timeouts have
  // no state of their own, so they leave the last real one standing and add
  // the outcome beside it rather than overwriting it with a worse word.
  round.note({
    ...(decision.outcome === 'died' || decision.outcome === 'blocked' ? { status: decision.outcome } : {}),
    outcome: decision.outcome,
    ...(screenLine ? { screen: screenLine } : {}),
  });

  const fate = paneFateFor(decision.outcome, { closeAlways });
  if (fate === 'close') client.paneClose(round.paneId);

  return round.fail(
    ERROR_CLASS_FOR_OUTCOME[decision.outcome] ?? 'worker-timeout',
    decision.outcome,
    `executor for work "${round.workId}" ended as ${decision.outcome}: ${decision.reason}.${
      screenLine ? ` Last line on screen: ${screenLine}` : ''
    }${fate === 'keep' ? ` Pane ${round.paneId} is left open.` : ''}`,
    { outcome: decision.outcome, ...(screenLine ? { screen: screenLine } : {}) },
  );
}

/**
 * End a settled round: take the worker's report, ask the agent to leave, wait
 * for the pane to be nothing but its own shell again, then close it. An agent
 * still tearing down would swallow anything sent after it, which is what the
 * drain is for.
 *
 * Closing a pane is not cancelling a worker: measured, the foreground process
 * dies and a `setsid` descendant survives it. Nothing here reports this round
 * as cancelled, and nothing should.
 */
async function settleRound({ client, round, paths, exitCommand = '/exit', promptMs, readLiveness, workerHomePath, launcherScriptPath }) {
  const target = round.targetName ?? round.agentName;
  let stdout = '';
  try {
    stdout = fs.existsSync(paths.reportPath)
      ? fs.readFileSync(paths.reportPath, 'utf8')
      : fs.readFileSync(paths.resultPath, 'utf8');
  } catch {
    stdout = '';
  }

  round.note({ status: 'settling', outcome: 'settled' });

  try {
    client.agentPrompt(target, exitCommand, { wait: false, timeoutMs: promptMs });
  } catch {
    // A worker that already produced its result but will not take /exit is
    // still a completed round; the pane close below is what actually ends it.
  }

  const drainDeadline = Date.now() + EXIT_DRAIN_MS;
  while (Date.now() < drainDeadline) {
    if (readLiveness() !== 'present') break;
    await sleep(250);
  }

  client.paneClose(round.paneId);
  round.note({ status: 'reconciled' });

  // The private HOME held a copy of the operator's credential, so it is
  // removed as soon as the round is over. A failed round keeps its home for
  // the same reason it keeps its pane: someone may need to look.
  // `removeWorkerHome` refuses any directory without the marker it wrote.
  if (workerHomePath) {
    try { removeWorkerHome(workerHomePath); } catch { /* a leftover home is not worth failing a settled round */ }
  }

  // LOW-11: the launcher script persists the full prepared env, including
  // session tokens, as a plain file -- the same lifecycle P02H's own
  // worker HOME already gets (removed once the round settles, kept on
  // failure for someone to inspect) applies here for the same reason.
  if (launcherScriptPath) {
    try { fs.rmSync(launcherScriptPath, { force: true }); } catch { /* a leftover script is not worth failing a settled round */ }
  }

  return stdout;
}

/**
 * One round, start to finish.
 *
 * The body below is the sequence and nothing else -- every step names what it
 * does and owns its own reasoning. Read top to bottom to see what happens to
 * a worker; open a step to see why it happens that way.
 */
export async function runHerdrRound(ctx) {
  const confinementReq = ctx.confinementRequirement ?? ctx.confinement ?? ctx.requirement;
  const reqMode = confinementReq?.mode;
  if (reqMode === 'required' || reqMode === 'preferred') {
    if (ctx.providerKindOnly === true || ctx.workerCommandSeam === false) {
      throw new DispatchError(
        'confinement-adapter-unsupported',
        `required or preferred confinement refused: herdr-spawn requires worker-command seam`,
        {
          code: 'confinement-adapter-unsupported',
          reason: 'confinement-adapter-unsupported',
          workId: ctx.workId,
          runDir: ctx.runDir,
        },
      );
    }
    if (ctx.backendId && ctx.backendId !== 'bwrap') {
      throw new DispatchError(
        'confinement-backend-unsupported',
        `confinement backend "${ctx.backendId}" unsupported for herdr-spawn`,
        {
          code: 'confinement-backend-unsupported',
          reason: 'confinement-backend-unsupported',
          workId: ctx.workId,
          runDir: ctx.runDir,
        },
      );
    }
    let hasPrepared = Boolean(ctx.workerInvocation);
    if (!hasPrepared && ctx.runDir && ctx.launchCommandId) {
      const prepPath = path.join(ctx.runDir, 'protected', 'prepared-invocation', `${ctx.launchCommandId}.json`);
      if (fs.existsSync(prepPath)) hasPrepared = true;
    }
    if (!hasPrepared) {
      throw new DispatchError(
        'confinement-adapter-unsupported',
        `required or preferred confinement refused: herdr-spawn requires prepared invocation`,
        {
          code: 'confinement-adapter-unsupported',
          reason: 'confinement-adapter-unsupported',
          workId: ctx.workId,
          runDir: ctx.runDir,
        },
      );
    }
  }

  // Only what setting a round up needs; everything the round itself reads is
  // unpacked in `driveRound`.
  const { herdrBin, fullEnv, confinement, permissionMode, repoRoot, prompt, cwd, workId, tier, model } = ctx;

  const roundNumber = 1;
  const deadlines = groupDeadlines(ctx);

  // F4: this resume/existing-state check must run BEFORE `prepareRunDir`
  // below -- `prepareRunDir` refuses outright (stale-result-in-run-dir) the
  // instant `outbox/result-1.json` already exists, which is exactly the
  // state a SETTLED prior round leaves behind. Checking resume state first
  // means a real settled/live launch command is found and reconciled
  // through the door below; checking it after means that door is dead code
  // for every run that actually reached settlement, and a resume attempt on
  // a completed round throws instead of reconciling. Uses a lightweight
  // resolve of the same `ctx.runDir` `prepareRunDir` would derive -- never
  // its mkdtemp fallback, since an ad-hoc dispatch with no `ctx.runDir` is
  // never `isAssignmentRun` (no `ctx.runId`/`ctx.launchCommandId`) and never
  // takes this branch.
  const isAssignmentRun = Boolean(ctx.runId && ctx.launchCommandId);
  const preResumeRunDir = ctx.runDir ? path.resolve(ctx.runDir) : null;
  if (isAssignmentRun && preResumeRunDir) {
    const commandsDir = path.join(preResumeRunDir, 'controller', 'commands');
    if (fs.existsSync(commandsDir)) {
      const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
      for (const f of existingFiles) {
        try {
          const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
          if (existing.runId === ctx.runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
            if (existing.launchCommandId !== ctx.launchCommandId || f !== `${ctx.launchCommandId}.json`) {
              throw new HerdrLaunchCollisionError(`launch command for run ${ctx.runId} already exists as ${existing.launchCommandId}`, {
                runId: ctx.runId,
                existingCommandId: existing.launchCommandId,
                existingCommand: existing,
              });
            }
          }
        } catch (err) {
          if (err instanceof HerdrLaunchCollisionError) throw err;
        }
      }
    }

    const existingCmd = readHerdrLaunchCommand(preResumeRunDir, ctx.launchCommandId);
    if (existingCmd) {
      if (existingCmd.state === 'reconciled' || (existingCmd.state === 'pending' && existingCmd.paneId)) {
        // Production `ctx` carries no `herdrClient`/`probe` -- only test
        // callers pass one explicitly -- so a resumed round for a
        // live-but-not-yet-observed worker fell through reconcile's probe
        // branch to `unknown-launch` instead of actually asking herdr.
        const reconcileClient = ctx.herdrClient ?? createHerdrClient({ herdrBin, cwd, env: fullEnv });
        return await reconcileHerdrSpawnRun(preResumeRunDir, { ...ctx, herdrClient: reconcileClient });
      }
    }
  }

  const { runDir, paths } = prepareRunDir({ runDir: ctx.runDir, roundNumber, workId, tier, model });

  const agentName = isAssignmentRun
    ? normalizeAgentName(`fgos-${ctx.runId}-${ctx.launchCommandId}`)
    : normalizeAgentName(`fgos-${workId ?? 'run'}-${Date.now().toString(36)}`);
  const round = openRound({ runDir, workId, tier, model, agentName });

  const briefText = renderBrief({ prompt, round: roundNumber, runDir, agentName });
  fs.writeFileSync(paths.briefPath, briefText);
  round.note({ status: 'requested', agentName, round: roundNumber });

  const { workerHomePath, sessionEnv, confined, status } = await establishConfinement({
    confinement, round, fullEnv, cwd, repoRoot, permissionMode, herdrBin,
  });
  round.note({ confinement: { status, confined } });

  // From here on the home exists, so every way out of this function that is
  // not a settled round has to take the credential back out of it. The home
  // itself is kept -- a failed round's settings and rc are worth reading --
  // but the credential is a copy of the operator's own, and one left behind
  // per failed round is an accumulating secret, not a diagnostic.
  try {
    return await driveRound({
      ctx, round, paths, runDir, briefText, roundNumber, deadlines,
      sessionEnv, workerHomePath,
    });
  } catch (err) {
    if (workerHomePath) {
      try { redactWorkerHome(workerHomePath); } catch { /* nothing further to do about a home we cannot read */ }
    }
    throw err;
  }
}

// One batch tab per `dispatchBatchKey`, for the lifetime of this process --
// which is also the lifetime of one `fgos coordination run` invocation (R1:
// its steps run sequentially in-process), so this is exactly "one tab per
// batch" without any cross-process persistence. Labeled with a per-process
// timestamp suffix so a coordinationId's separate invocations over time (a
// panel's open/fix/close) show up as visibly distinct tabs, not identically-
// named ones -- the label is only ever built here, at first creation, never
// passed in by the caller.
const batchTabsByKey = new Map();
let batchTabExitHookRegistered = false;

function batchTabFor(key, { cwd } = {}) {
  let batchTab = batchTabsByKey.get(key);
  if (!batchTab) {
    batchTab = createBatchTab({ label: `fgos-lead-${key}-${Date.now().toString(36)}`, cwd });
    batchTabsByKey.set(key, batchTab);
    if (!batchTabExitHookRegistered) {
      batchTabExitHookRegistered = true;
      process.once('exit', () => {
        for (const bt of batchTabsByKey.values()) bt.closeIfEmpty();
      });
    }
  }
  return batchTab;
}

/** The round proper, once its home and session exist. Split from
 * `runHerdrRound` only so the credential teardown above wraps every exit
 * from it -- not as a second seam. */
async function driveRound({ ctx, round, paths, runDir, briefText, roundNumber, deadlines, sessionEnv, workerHomePath }) {
  const {
    herdrBin, fullEnv, repoRoot, agentKind, agentArgs, delivery, exitCommand,
    trustStore, paneEnv, cwd, usageLimitPatterns, closeAlways, workId, tier, model,
    // A pane already sitting in the caller's own tab -- e.g. one lead's coding
    // panel or fanout batch -- so every sibling round of that same batch lands
    // beside it instead of wherever the operator happens to be focused. Absent
    // for a standalone dispatch, which keeps today's implicit-focus behaviour.
    anchorPaneId,
    // A caller-supplied string naming the batch this round belongs to (a
    // coordination round's own coordinationId, a future fanout batch id) --
    // never a live handle, so the caller (run.mjs) never has to import
    // anything herdr-shaped to build it. The batch tab itself is process-
    // local state owned entirely by this module (`batchTabFor`, above).
    dispatchBatchKey,
  } = ctx;

  const client = createHerdrClient({ herdrBin, cwd, env: sessionEnv });
  // A confined worker's pane gets the private HOME; herdr honours `--env` for
  // ordinary variables, which is exactly what this relies on.
  const effectivePaneEnv = workerHomePath ? { ...paneEnv, HOME: workerHomePath } : paneEnv;

  // A confined round talks to a different herdr server (a different socket,
  // a different pane-id namespace) than an unconfined one -- HERDR_SESSION is
  // what `isolatedSessionEnv` sets it to, so it is what distinguishes them.
  const sessionKey = sessionEnv?.HERDR_SESSION ?? 'default';
  const batchTab = dispatchBatchKey ? batchTabFor(dispatchBatchKey, { cwd }) : null;

  const isAssignmentRun = Boolean(ctx.runId && ctx.launchCommandId);
  const existingCmd = isAssignmentRun ? readHerdrLaunchCommand(runDir, ctx.launchCommandId) : null;

  const confinementReq = ctx.confinementRequirement ?? ctx.confinement ?? ctx.requirement;
  const reqMode = confinementReq?.mode;
  let preparedWorkerInvocation = ctx.workerInvocation || null;
  if (!preparedWorkerInvocation && runDir && ctx.launchCommandId) {
    const prepPath = path.join(runDir, 'protected', 'prepared-invocation', `${ctx.launchCommandId}.json`);
    if (fs.existsSync(prepPath)) {
      try {
        const prepRec = JSON.parse(fs.readFileSync(prepPath, 'utf8'));
        // F2: a record read straight off disk here was never checked against
        // its own `digest` field before being trusted -- a tampered record
        // (command/args swapped, `workerCommandDigest` edited to match) would
        // otherwise sail straight into the launcher script below. Every other
        // reader of this same file (reconcileHerdrSpawnRun, further down)
        // already refuses on this exact mismatch; launch itself must refuse
        // identically rather than being the one path that skips the check.
        const { digest: prepDigestOnDisk, ...prepBody } = prepRec;
        if (prepDigestOnDisk && prepDigestOnDisk !== computeSha256Digest(prepBody)) {
          throw new DispatchError('protected-artifact-corrupt',
            `prepared-invocation record for launch "${ctx.launchCommandId}" failed digest verification -- refusing to launch from a record that may have been tampered with.`,
            { workId: ctx.workId, runDir, launchCommandId: ctx.launchCommandId });
        }
        preparedWorkerInvocation = prepRec.workerInvocation || null;
      } catch (err) {
        if (err instanceof DispatchError) throw err;
      }
    }
  }
  const isConfined = (reqMode === 'required' || reqMode === 'preferred') && Boolean(preparedWorkerInvocation);

  // LOW-10: `establishConfinement` (runHerdrRound, above) only knows the
  // LEGACY confinement flags (ownWorktree/privateHome/isolatedSession) and
  // wrote whatever it concluded from those into visibility.json before this
  // function ever learns whether a bwrap-required/-preferred launch is
  // actually happening. A bwrap-confined round with no legacy flags set
  // left `visibility.json` reporting `unconfined` for a round that is, in
  // fact, running inside a bwrap sandbox -- correct the record once the
  // real answer is known.
  if (isConfined) {
    round.note({ confinement: { status: 'confined-bwrap', confined: true } });
  }

  if (existingCmd?.paneId) {
    round.paneId = existingCmd.paneId;
    round.note({ status: 'pane-reused', paneId: round.paneId });
  } else {
    let anchor = anchorPaneId;
    if (anchor === undefined && batchTab) {
      try {
        anchor = batchTab.ensure(client, sessionKey);
      } catch {
        anchor = undefined;
      }
    }

    try {
      round.paneId = isConfined
        ? client.paneSplit({ pane: anchor, direction: 'down', ratio: 0.3, focus: false, cwd, env: effectivePaneEnv })
        : client.paneSplit({ pane: anchor, cwd, env: effectivePaneEnv });
      round.note({ status: 'pane-created', paneId: round.paneId });
    } catch (err) {
      if (!anchor || err.code !== 'pane_not_found') {
        throw round.fail('worker-spawn-fail', err.code ?? 'pane_split_failed',
          `executor failed to start for work "${workId}": herdr could not open a pane (${err.code ?? 'unknown'}): ${err.message}`);
      }
      batchTab?.invalidate(sessionKey);
      try {
        round.paneId = isConfined
          ? client.paneSplit({ direction: 'down', ratio: 0.3, focus: false, cwd, env: effectivePaneEnv })
          : client.paneSplit({ cwd, env: effectivePaneEnv });
        round.note({ status: 'pane-created', paneId: round.paneId, anchorLost: true });
      } catch (retryErr) {
        throw round.fail('worker-spawn-fail', retryErr.code ?? 'pane_split_failed',
          `executor failed to start for work "${workId}": herdr could not open a pane (${retryErr.code ?? 'unknown'}): ${retryErr.message}`);
      }
    }
  }

  // A confined run needs no seeding here: its private HOME is provisioned with
  // the workspace already trusted, so writing to the operator's own store for
  // a directory only the worker will ever see would be pure side effect.
  if (trustStore && !workerHomePath) {
    seedWorkspaceTrust({ trustStore, round, cwd, repoRoot, fullEnv });
  }

  round.targetName = isConfined ? round.paneId : round.agentName;

  const agentKindToUse = agentKind ?? (ctx.command ? path.basename(ctx.command) : 'claude');
  const effectiveAgentArgs = (agentArgs && agentArgs.length) ? agentArgs : (ctx.args || []);

  const preparedCommand = isConfined ? preparedWorkerInvocation.command : ctx.command;
  const preparedArgs = isConfined ? (preparedWorkerInvocation.args || []) : (ctx.args || []);
  const preparedEnv = isConfined ? (preparedWorkerInvocation.env || null) : null;
  // F2: recomputed from the ACTUAL {command, args} that are about to be
  // written into the launcher script and exec'd -- never trusted from
  // `preparedWorkerInvocation.workerCommandDigest`, a self-declared field
  // that a tampered on-disk record could edit right alongside the
  // command/args it claims to attest, producing a digest that only ever
  // agrees with itself. This is the value bound into the receipt and is
  // what a caller checks a receipt against later, so it has to be an
  // independent measurement of what actually ran, not an echo.
  const workerCommandDigest = computeSha256Digest({ command: preparedCommand, args: preparedArgs });

  let herdrStartArgv;
  let resourceIncarnation = null;
  // LOW-11: hoisted out of the `isConfined` block so `settleRound` (below)
  // can remove it once the round settles -- an unconfined round never sets
  // this, and `settleRound` treats a null path as "nothing to clean up".
  let launcherScriptPath = null;

  if (isConfined) {
    const launcherDir = path.join(runDir, 'protected', 'launchers');
    fs.mkdirSync(launcherDir, { recursive: true });
    const scriptId = ctx.launchCommandId || `launcher-${Date.now().toString(36)}`;
    const scriptPath = path.join(launcherDir, `${scriptId}.sh`);
    launcherScriptPath = scriptPath;
    const scriptContent = buildLauncherScriptContent({
      argv0: agentKindToUse,
      command: preparedCommand,
      args: preparedArgs,
      env: preparedEnv,
      workerCommandDigest,
    });
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o700 });

    const readBack = fs.readFileSync(scriptPath, 'utf8');
    if (readBack !== scriptContent) {
      throw new DispatchError('protected-artifact-corrupt', 'launcher script content corrupted before execution');
    }

    herdrStartArgv = ['pane', 'run', round.paneId, 'bash', scriptPath];

    // F1: bind this pane to the launch-command record BEFORE calling
    // `pane run`, under the same `publishMutableProjection` discipline every
    // other commandPath write already uses. A crash between `pane run`
    // (which actually launches the worker process) and the post-launch
    // write further below used to leave the on-disk record with no paneId
    // at all -- a resume for this exact launchCommandId then had no way to
    // tell "the script may already be running in a pane we forgot about"
    // from "nothing has happened yet", and took the create-pane-and-launch
    // branch either way. Recording the paneId now means the NEXT attempt
    // (this process resuming after a crash, or a genuinely later call
    // reading this same commandPath) finds `existingCmd.paneId` already set
    // and checks the pane's real foreground process below before ever
    // deciding to launch a second real one.
    if (isAssignmentRun) {
      const commandPath = path.join(runDir, 'controller', 'commands', `${ctx.launchCommandId}.json`);
      if (fs.existsSync(commandPath)) {
        try {
          const cmd = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
          publishMutableProjection(commandPath, { ...cmd, paneId: round.paneId });
        } catch {}
      }
    }

    let verifiedProc = null;
    let pInfo = null;

    // F1: `existingCmd.paneId` already set (this round is reusing a pane
    // from a prior attempt at this same launchCommandId -- see the
    // pane-reused branch above) but no `resourceIncarnation` yet means the
    // prior attempt may have crashed anywhere from "pane created" to "script
    // launched, incarnation not yet recorded". Check what is REALLY running
    // in that pane before deciding whether a launch is still needed at all.
    if (existingCmd?.paneId && !existingCmd?.resourceIncarnation) {
      try {
        pInfo = client.paneProcessInfo(round.paneId);
        verifiedProc = verifyForegroundProcessArgv({
          foregroundProcesses: pInfo?.foregroundProcesses,
          shellPid: pInfo?.shellPid,
          argv0: agentKindToUse,
          command: preparedCommand,
          args: preparedArgs,
        });
      } catch {}
    }

    if (!existingCmd?.resourceIncarnation && !verifiedProc) {
      // LOW-8: the script path is generated (`launcherDir/<launchCommandId
      // or generated id>.sh`), never user input, so this was never an
      // injection vector -- quoted anyway for defense in depth, the same
      // way every other argument this module hands to a shell already is.
      client.paneRun(round.paneId, `bash ${shellEscapeArg(scriptPath)}`);

      let exeIdentityMismatch = false;
      const verifyDeadline = Date.now() + Math.min(deadlines.startup.readyMs || 10000, 5000);
      while (Date.now() < verifyDeadline) {
        try {
          pInfo = client.paneProcessInfo(round.paneId);
          verifiedProc = verifyForegroundProcessArgv({
            foregroundProcesses: pInfo?.foregroundProcesses,
            shellPid: pInfo?.shellPid,
            argv0: agentKindToUse,
            command: preparedCommand,
            args: preparedArgs,
          });
          if (verifiedProc) {
            // F3: argv is a claim the process makes about itself and cannot
            // catch a binary swap -- same argv0/args, a different real
            // executable behind it. Cross-check the kernel's own identity
            // signal when it is available (Linux, process still alive);
            // `null` (signal unavailable) is not treated as a pass, only an
            // explicit `false` is -- there is no live evidence to act on
            // either way when the check itself could not run.
            if (verifyProcessExeIdentity(verifiedProc.pid, preparedCommand) === false) {
              exeIdentityMismatch = true;
              verifiedProc = null;
              break;
            }
            break;
          }
        } catch {}
        await sleep(100);
      }

      if (!verifiedProc) {
        // F3: a caught tamper (argv mismatch, or a detected binary swap)
        // must never leave a live unaccounted process running, nor the
        // pane open for someone to unknowingly keep watching a process that
        // is not what it claims -- actively kill whatever IS in the pane
        // and close it, rather than only refusing and reporting.
        try {
          const stray = pInfo?.foregroundProcesses?.find((p) => p.pid && p.pid !== pInfo.shellPid);
          if (stray?.pid) process.kill(stray.pid, 'SIGKILL');
        } catch { /* already gone, or not killable -- close the pane regardless */ }
        client.paneClose(round.paneId);
        throw round.fail('worker-spawn-fail', 'confinement-mismatch',
          exeIdentityMismatch
            ? `foreground process in pane "${round.paneId}" matched prepared argv but its real executable (/proc/<pid>/exe) does not resolve to "${preparedCommand}" -- possible binary swap; process killed and pane closed.`
            : `foreground process in pane "${round.paneId}" does not match prepared command argv; process killed and pane closed.`);
      }
    }

    if (!existingCmd?.resourceIncarnation) {
      client.reportAgent(round.paneId, {
        source: 'fgos',
        agent: agentKindToUse,
        state: 'working',
      });

      try {
        const ag = client.agentGet(round.paneId);
        if (ag?.agentSession) {
          round.agentSession = { value: typeof ag.agentSession === 'object' ? ag.agentSession.value : ag.agentSession };
        }
      } catch {}

      resourceIncarnation = computeHerdrResourceIncarnation({
        paneId: round.paneId,
        shellPid: pInfo?.shellPid || null,
        workerPid: verifiedProc.pid,
        foregroundPgid: pInfo?.foregroundPgid || null,
        processStartTime: getProcessStartTime(verifiedProc.pid),
      });
    } else {
      resourceIncarnation = existingCmd.resourceIncarnation;
    }
  } else {
    herdrStartArgv = ['agent', 'start', round.agentName, '--kind', agentKindToUse, '--pane', round.paneId, '--timeout', String(deadlines.startup.readyMs), ...((effectiveAgentArgs && effectiveAgentArgs.length) ? ['--', ...effectiveAgentArgs] : [])];

    if (!existingCmd?.paneId || !existingCmd?.resourceIncarnation) {
      startAgent({ client, round, agentKind: agentKindToUse, agentArgs: effectiveAgentArgs, readyMs: deadlines.startup.readyMs });
    }

    if (existingCmd?.resourceIncarnation) {
      resourceIncarnation = existingCmd.resourceIncarnation;
    } else {
      try {
        const pInfo = client.paneProcessInfo(round.paneId);
        const workerProc = pInfo?.foregroundProcesses?.find((p) => p.pid && p.pid !== pInfo.shellPid);
        resourceIncarnation = computeHerdrResourceIncarnation({
          paneId: round.paneId,
          shellPid: pInfo?.shellPid || null,
          workerPid: workerProc?.pid || null,
          foregroundPgid: pInfo?.foregroundPgid || null,
          processStartTime: workerProc?.pid ? getProcessStartTime(workerProc.pid) : null,
        });
      } catch {
        resourceIncarnation = computeHerdrResourceIncarnation({ paneId: round.paneId });
      }
    }
  }

  if (isAssignmentRun) {
    const commandPath = path.join(runDir, 'controller', 'commands', `${ctx.launchCommandId}.json`);
    if (fs.existsSync(commandPath)) {
      try {
        const cmd = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
        publishMutableProjection(commandPath, {
          ...cmd,
          paneId: round.paneId,
          agentSession: round.agentSession?.value || cmd.agentSession || null,
          resourceIncarnation: resourceIncarnation || cmd.resourceIncarnation,
          workerCommandDigest,
          startArgvDigest: computeSha256Digest(herdrStartArgv),
        });
      } catch {}
    }
  }

  // One line so a person watching the runner's own stderr can find the pane to
  // watch and the directory this round's files will appear in. Diagnostic
  // only -- nothing reads it back.
  process.stderr.write(`fgos: herdr-spawn work=${workId} pane=${round.paneId} agent=${round.agentName} runDir=${runDir}\n`);

  const message = briefMessage({ delivery, briefText, runDir, roundNumber });
  deliverBrief({ client, round, message, promptMs: deadlines.startup.promptMs, resultPath: paths.resultPath });

  const readLiveness = livenessProbe(client, round.paneId);
  const decision = await pollForOutcome({
    client, round, paths, message: briefMessage({ delivery, briefText, runDir, roundNumber }), deadlines, usageLimitPatterns, readLiveness,
  });

  if (decision.outcome !== 'settled') {
    if (isAssignmentRun) {
      try {
        // Verify digests if preparedInvocation was expected (HIGH-4)
        let prepRec = null;
        const prepPath = path.join(runDir, 'protected', 'prepared-invocation', `${ctx.launchCommandId}.json`);
        if (fs.existsSync(prepPath)) {
          try { prepRec = JSON.parse(fs.readFileSync(prepPath, 'utf8')); } catch {}
        }
        const cmdOnDisk = readHerdrLaunchCommand(runDir, ctx.launchCommandId);
        let preparedInvocationDigest = ctx.preparedInvocationDigest || cmdOnDisk?.preparedInvocationDigest || null;
        if (cmdOnDisk?.preparedInvocationDigest && preparedInvocationDigest && preparedInvocationDigest !== cmdOnDisk.preparedInvocationDigest) {
          throw new DispatchError('confinement-mismatch', `preparedInvocationDigest mismatch: caller gave ${preparedInvocationDigest} but launch command has ${cmdOnDisk.preparedInvocationDigest}`);
        }
        if (prepRec) {
          const actualPDig = prepRec.digest || computeSha256Digest(prepRec);
          if (preparedInvocationDigest && preparedInvocationDigest !== actualPDig) {
            throw new DispatchError('confinement-mismatch', `preparedInvocationDigest mismatch: record is ${actualPDig} but got ${preparedInvocationDigest}`);
          }
        }

        const receiptData = {
          contract: 'herdr-adapter-receipt.v1',
          runId: ctx.runId,
          launchCommandId: ctx.launchCommandId,
          preparedInvocationDigest,
          herdrName: round.agentName,
          paneId: round.paneId || null,
          agentSession: round.agentSession?.value || null,
          resourceIncarnation,
          startArgvDigest: computeSha256Digest(herdrStartArgv),
          workerCommandDigest,
          completion: {
            kind: decision.outcome,
            reason: decision.detail || decision.outcome,
            settledAt: new Date().toISOString(),
          },
          result: null,
        };
        const receipt = publishHerdrAdapterReceipt(runDir, ctx.launchCommandId, receiptData);
        const commandPath = path.join(runDir, 'controller', 'commands', `${ctx.launchCommandId}.json`);
        if (fs.existsSync(commandPath)) {
          const cmd = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
          publishMutableProjection(commandPath, {
            ...cmd,
            state: 'reconciled',
            paneId: round.paneId,
            agentSession: round.agentSession?.value || null,
            resourceIncarnation,
            outcome: {
              kind: 'receipt-backed',
              receiptDigest: receipt.digest,
            },
          });
        }
      } catch (err) {
        // A genuine digest tamper (`confinement-mismatch`, thrown just above)
        // is a typed refusal that must reach the caller -- swallowing it here
        // silently downgraded a detected mismatch into the generic
        // `concludeFailure` below, losing the reason. Best-effort receipt
        // bookkeeping (file I/O around it) still swallows everything else.
        if (err instanceof DispatchError && err.errorClass === 'confinement-mismatch') {
          throw err;
        }
      }
    }
    throw concludeFailure({ client, round, decision, closeAlways });
  }

  const stdout = await settleRound({
    client, round, paths, exitCommand,
    promptMs: deadlines.startup.promptMs, readLiveness, workerHomePath, launcherScriptPath,
  });

  if (isAssignmentRun) {
    let resultDigest = null;
    let outboxRelPath = null;
    if (paths.resultPath && fs.existsSync(paths.resultPath)) {
      try {
        const resContent = fs.readFileSync(paths.resultPath, 'utf8');
        resultDigest = computeSha256Digest(resContent);
        outboxRelPath = path.relative(runDir, paths.resultPath);
      } catch {}
    }

    // `settled` means the ladder saw a result file at some earlier tick --
    // it is not proof this digest is real. A missing/unreadable outbox
    // result must refuse settlement, never publish a receipt claiming
    // `settled` against a null digest.
    if (!resultDigest) {
      throw new DispatchError(
        'protected-artifact-corrupt',
        `executor for work "${workId}" settled but its outbox result could not be read or digested at ${paths.resultPath}.`,
        { workId, tier, model, runDir, resultPath: paths.resultPath },
      );
    }

    // Verify digests (HIGH-4)
    let prepRec = null;
    const prepPath = path.join(runDir, 'protected', 'prepared-invocation', `${ctx.launchCommandId}.json`);
    if (fs.existsSync(prepPath)) {
      try { prepRec = JSON.parse(fs.readFileSync(prepPath, 'utf8')); } catch {}
    }
    const cmdOnDisk = readHerdrLaunchCommand(runDir, ctx.launchCommandId);
    let preparedInvocationDigest = ctx.preparedInvocationDigest || cmdOnDisk?.preparedInvocationDigest || null;
    if (cmdOnDisk?.preparedInvocationDigest && preparedInvocationDigest && preparedInvocationDigest !== cmdOnDisk.preparedInvocationDigest) {
      throw new DispatchError('confinement-mismatch', `preparedInvocationDigest mismatch: caller gave ${preparedInvocationDigest} but launch command has ${cmdOnDisk.preparedInvocationDigest}`);
    }
    if (prepRec) {
      const actualPDig = prepRec.digest || computeSha256Digest(prepRec);
      if (preparedInvocationDigest && preparedInvocationDigest !== actualPDig) {
        throw new DispatchError('confinement-mismatch', `preparedInvocationDigest mismatch: record is ${actualPDig} but got ${preparedInvocationDigest}`);
      }
    }

    const receiptData = {
      contract: 'herdr-adapter-receipt.v1',
      runId: ctx.runId,
      launchCommandId: ctx.launchCommandId,
      preparedInvocationDigest,
      herdrName: round.agentName,
      paneId: round.paneId || null,
      agentSession: round.agentSession?.value || null,
      resourceIncarnation,
      startArgvDigest: computeSha256Digest(herdrStartArgv),
      workerCommandDigest,
      completion: {
        kind: 'settled',
        reason: 'worker-outbox-settled',
        settledAt: new Date().toISOString(),
      },
      result: {
        outboxPath: outboxRelPath || 'outbox/result-1.json',
        outboxDigest: resultDigest,
      },
    };
    const receipt = publishHerdrAdapterReceipt(runDir, ctx.launchCommandId, receiptData);

    const commandPath = path.join(runDir, 'controller', 'commands', `${ctx.launchCommandId}.json`);
    if (fs.existsSync(commandPath)) {
      try {
        const cmd = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
        const updatedCmd = {
          ...cmd,
          state: 'reconciled',
          paneId: round.paneId,
          agentSession: round.agentSession?.value || null,
          resourceIncarnation,
          outcome: {
            kind: 'receipt-backed',
            receiptDigest: receipt.digest,
          },
        };
        publishMutableProjection(commandPath, updatedCmd);
      } catch {}
    }
  }

  return {
    status: 0,
    signal: null,
    stdout,
    stderr: '',
    tier,
    model,
    paneId: round.paneId,
    runDir,
    resultPath: paths.resultPath,
    outcome: 'settled',
  };
}

export class HerdrLaunchCollisionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'HerdrLaunchCollisionError';
    this.code = 'launch-collision';
    Object.assign(this, details);
  }
}

export function computeHerdrResourceIncarnation({
  paneId = null,
  shellPid = null,
  workerPid = null,
  foregroundPgid = null,
  gatewaySessionId = null,
  processStartTime = null,
} = {}) {
  return {
    contract: 'herdr-resource-incarnation.v1',
    paneId: paneId || null,
    shellPid: shellPid || null,
    workerPid: workerPid || null,
    foregroundPgid: foregroundPgid || null,
    gatewaySessionId: gatewaySessionId || null,
    processStartTime: processStartTime || null,
  };
}

function matchIncarnations(a, b) {
  if (!a || !b) return false;
  if (a.paneId && b.paneId && a.paneId !== b.paneId) return false;
  if (a.workerPid && b.workerPid) {
    if (a.workerPid !== b.workerPid) return false;
  } else if ((a.workerPid && !b.workerPid) || (!a.workerPid && b.workerPid)) {
    return false;
  }
  if (a.processStartTime && b.processStartTime) {
    if (a.processStartTime !== b.processStartTime) return false;
  } else if ((a.processStartTime && !b.processStartTime) || (!a.processStartTime && b.processStartTime)) {
    return false;
  }
  if (a.shellPid && b.shellPid && a.shellPid !== b.shellPid) return false;
  if (a.gatewaySessionId && b.gatewaySessionId && a.gatewaySessionId !== b.gatewaySessionId) return false;
  return true;
}

export function createHerdrLaunchCommand(runDir, launchContext, {
  state = 'pending',
  herdrName = null,
  preparedInvocationDigest = null,
  agentSession = null,
  paneId = null,
  resourceIncarnation = null,
  outcome = null,
  checkDuplicate = true,
} = {}) {
  const runId = launchContext.run?.runId || launchContext.runId;
  const launchCommandId = launchContext.command?.launchCommandId || launchContext.launchCommandId;
  const controlEpoch = launchContext.command?.controlEpoch ?? launchContext.controlEpoch ?? 1;
  const controlTokenDigest = launchContext.command?.controlTokenDigest || (launchContext.controlToken ? computeSha256Digest(launchContext.controlToken) : null);
  const requestDigest = computeSha256Digest(launchContext);
  const effectiveHerdrName = herdrName || `fgos-${runId}-${launchCommandId}`;

  const commandsDir = path.join(runDir, 'controller', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });
  const cmdPath = path.join(commandsDir, `${launchCommandId}.json`);

  if (checkDuplicate) {
    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new HerdrLaunchCollisionError(`launch command for run ${runId} already exists as ${existing.launchCommandId}`, {
              runId,
              existingCommandId: existing.launchCommandId,
              existingCommand: existing,
            });
          }
        }
      } catch (err) {
        if (err instanceof HerdrLaunchCollisionError) throw err;
      }
    }
  }

  const cmd = {
    contract: 'herdr-launch-command.v1',
    runId,
    launchCommandId,
    controlEpoch,
    controlTokenDigest,
    state,
    requestDigest,
    preparedInvocationDigest,
    herdrName: effectiveHerdrName,
    agentSession,
    paneId,
    resourceIncarnation,
    outcome,
  };

  publishMutableProjection(cmdPath, cmd);
  return cmd;
}

export function readHerdrLaunchCommand(runDir, launchCommandId) {
  const cmdPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
  if (!fs.existsSync(cmdPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cmdPath, 'utf8'));
  } catch {
    return null;
  }
}

export function publishHerdrAdapterReceipt(runDir, launchCommandId, receiptData) {
  const { digest: _existingDigest, ...receiptWithoutDigest } = receiptData;
  const digest = computeSha256Digest(receiptWithoutDigest);
  const fullReceipt = {
    ...receiptWithoutDigest,
    digest,
  };
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  fs.mkdirSync(receiptsDir, { recursive: true });
  const receiptPath = path.join(receiptsDir, `${launchCommandId}.json`);
  publishImmutableProof(receiptPath, fullReceipt);
  return fullReceipt;
}

export function readHerdrAdapterReceipt(runDir, launchCommandId) {
  const receiptPath = path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`);
  if (!fs.existsSync(receiptPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  } catch {
    return null;
  }
}

export async function reconcileHerdrSpawnRun(runDir, opts = {}) {
  // 1. Check action: unsupported operations
  if (opts.action === 'cancel' || opts.operation === 'cancel') {
    return { status: 'parked', reason: 'cancel-unsupported' };
  }
  if (opts.action === 'shared-cwd-takeover' || opts.operation === 'shared-cwd-takeover') {
    return { status: 'parked', reason: 'shared-cwd-takeover-unsupported' };
  }
  if (opts.resourceClosed === true) {
    return { status: 'parked', reason: 'closed-resource' };
  }

  // 2. Check result.json
  const resultJsonPath = path.join(runDir, 'result.json');
  if (fs.existsSync(resultJsonPath)) {
    try {
      const settledResult = JSON.parse(fs.readFileSync(resultJsonPath, 'utf8'));
      return { status: 'settled', settled: true, runResult: Object.freeze(settledResult) };
    } catch {}
  }

  // 3. Check controller/commands
  const commandsDir = path.join(runDir, 'controller', 'commands');
  if (!fs.existsSync(commandsDir)) {
    return { status: 'parked', reason: 'command-missing' };
  }
  const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
  if (commandFiles.length === 0) {
    return { status: 'parked', reason: 'command-missing' };
  }

  commandFiles.sort();
  const commandFile = commandFiles[commandFiles.length - 1];
  const launchCommandId = path.basename(commandFile, '.json');
  const commandPath = path.join(commandsDir, commandFile);
  let command;
  try {
    command = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  } catch {
    return { status: 'parked', reason: 'command-missing' };
  }

  // Stale controller verification
  const isStale = (opts.controlEpoch !== undefined && opts.controlEpoch < command.controlEpoch) ||
    (opts.controlToken !== undefined && command.controlTokenDigest && computeSha256Digest(opts.controlToken) !== command.controlTokenDigest);
  if (isStale) {
    return { status: 'observed', outcome: command.outcome, receipt: readHerdrAdapterReceipt(runDir, launchCommandId), settled: false };
  }
  if (opts.tokenCurrent === false) {
    return { status: 'observed', outcome: command.outcome, receipt: readHerdrAdapterReceipt(runDir, launchCommandId), settled: false };
  }

  // Check evaluator baseline if exists
  const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
  if (fs.existsSync(baselinePath)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      const { digest: baselineDigest, ...baselineWithoutDigest } = baseline;
      if (baselineDigest && baselineDigest !== computeSha256Digest(baselineWithoutDigest)) {
        return { status: 'refused', reason: 'evaluator-baseline-mismatch' };
      }
    } catch {
      return { status: 'parked', reason: 'evaluator-baseline-missing' };
    }
  }

  // Check receipt tamper if receipt already exists
  const receipt = readHerdrAdapterReceipt(runDir, launchCommandId);
  if (receipt) {
    if (receipt.digest) {
      const { digest: rDig, ...rBody } = receipt;
      if (rDig !== computeSha256Digest(rBody)) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    }
    const actualRecDigest = receipt.digest || computeSha256Digest(receipt);
    if (command.outcome?.receiptDigest && command.outcome.receiptDigest !== actualRecDigest) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }
    if (command.receiptDigest && command.receiptDigest !== actualRecDigest) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    // HIGH-4: Cross-check receipt digests against pending command
    if (receipt.preparedInvocationDigest || command.preparedInvocationDigest) {
      if (receipt.preparedInvocationDigest !== command.preparedInvocationDigest) {
        return { status: 'refused', reason: 'confinement-mismatch' };
      }
    }
  }

  // Window: command already reconciled
  if (command.state === 'reconciled') {
    if (command.outcome?.kind === 'submission-refused') {
      return { status: 'refused', outcome: command.outcome, reason: 'submission-refused' };
    }
    if (command.outcome?.kind === 'receipt-backed') {
      // F2: Settlement MUST require the real worker outbox result file to exist and be readable
      if (receipt && receipt.completion?.kind === 'settled' && receipt.result?.outboxPath) {
        const outboxFullPath = path.join(runDir, receipt.result.outboxPath);
        if (fs.existsSync(outboxFullPath)) {
          try {
            const outboxContent = fs.readFileSync(outboxFullPath, 'utf8');
            const outboxDigest = computeSha256Digest(outboxContent);
            if (receipt.result.outboxDigest && receipt.result.outboxDigest !== outboxDigest) {
              return { status: 'refused', reason: 'protected-artifact-corrupt', settled: false };
            }
            return { status: 'settled', outcome: command.outcome, receipt, settled: true };
          } catch {
            return { status: 'refused', reason: 'protected-artifact-corrupt', settled: false };
          }
        }
      }
      return {
        status: 'failed',
        outcome: command.outcome,
        receipt,
        settled: false,
        reason: receipt?.completion?.kind || 'unsettled-outcome',
      };
    }
  }

  // Window: command pending, no prepared invocation
  if (!command.preparedInvocationDigest) {
    if (opts.canPrepare && typeof opts.prepareConfinement === 'function') {
      try {
        const prep = await opts.prepareConfinement();
        command.preparedInvocationDigest = prep.preparedInvocationDigest;
        publishMutableProjection(commandPath, command);
      } catch (err) {
        return { status: 'parked', reason: 'prepared-invocation-missing', error: err.message };
      }
    } else {
      return { status: 'parked', reason: 'prepared-invocation-missing' };
    }
  }

  // Check prepared invocation on disk
  const prepPath = path.join(runDir, 'protected', 'prepared-invocation', `${launchCommandId}.json`);
  if (!fs.existsSync(prepPath)) {
    return { status: 'parked', reason: 'prepared-invocation-missing' };
  }
  // Authority's own canonical `workerInvocation.workerCommandDigest`
  // (sha256 of just {command, args}), hoisted out of the try block below so
  // a synthesized receipt (built further down when settlement is inferred
  // from a real outbox result with no receipt yet on disk) can reuse the
  // SAME value instead of falling back to `command.preparedInvocationDigest`
  // -- a different digest entirely (of the whole prepared-invocation
  // record, not the worker command), which conflated two distinct notions
  // of "workerCommandDigest" and could never agree with a receipt a live
  // round actually published.
  let authorityWorkerCommandDigest = null;
  try {
    const prepRec = JSON.parse(fs.readFileSync(prepPath, 'utf8'));
    const { digest: pDig, ...pBody } = prepRec;
    if (pDig && pDig !== computeSha256Digest(pBody)) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }
    const actualPDig = pDig || computeSha256Digest(prepRec);
    if (command.preparedInvocationDigest && command.preparedInvocationDigest !== actualPDig) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    if (receipt && receipt.preparedInvocationDigest && receipt.preparedInvocationDigest !== actualPDig) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    // Authority's real prepared-invocation record nests these under
    // `workerInvocation` (confinement-adapter-contract.md's Authority Prepared
    // Invocation V1 shape) -- reading them off `prepRec` directly compared
    // against `undefined` and this check silently never fired.
    if (receipt && prepRec.workerInvocation?.workerCommandDigest && receipt.workerCommandDigest && receipt.workerCommandDigest !== prepRec.workerInvocation.workerCommandDigest) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    if (receipt && prepRec.workerInvocation?.envDigest && receipt.envDigest && receipt.envDigest !== prepRec.workerInvocation.envDigest) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    authorityWorkerCommandDigest = prepRec.workerInvocation?.workerCommandDigest ?? null;
  } catch {
    return { status: 'refused', reason: 'protected-artifact-corrupt' };
  }

  // Check worker outbox result
  const outboxDirs = [
    path.join(runDir, 'outbox'),
    path.join(runDir, 'worker-output', 'outbox'),
  ];
  let outboxResultPath = null;
  for (const od of outboxDirs) {
    if (fs.existsSync(od)) {
      const files = fs.readdirSync(od).filter((f) => (f.startsWith('result-') || f === 'result.json') && f.endsWith('.json'));
      if (files.length > 0) {
        outboxResultPath = path.join(od, files[0]);
        break;
      }
    }
  }

  if (outboxResultPath && fs.existsSync(outboxResultPath)) {
    const outboxContent = fs.readFileSync(outboxResultPath, 'utf8');
    const outboxDigest = computeSha256Digest(outboxContent);
    let effectiveReceipt = receipt;
    if (!effectiveReceipt) {
      effectiveReceipt = publishHerdrAdapterReceipt(runDir, launchCommandId, {
        contract: 'herdr-adapter-receipt.v1',
        runId: command.runId,
        launchCommandId,
        preparedInvocationDigest: command.preparedInvocationDigest,
        herdrName: command.herdrName,
        paneId: command.paneId,
        agentSession: command.agentSession,
        resourceIncarnation: command.resourceIncarnation,
        startArgvDigest: command.startArgvDigest || computeSha256Digest({ herdrName: command.herdrName }),
        // Never fall back to `preparedInvocationDigest` here -- it digests
        // the whole prepared-invocation record, not {command, args}, and is
        // a different notion of "workerCommandDigest" entirely (see the
        // canonical definition this mirrors: confinement/authority.mjs's
        // `workerInvocation.workerCommandDigest`, read back here from the
        // same already-validated prepared-invocation record above).
        workerCommandDigest: command.workerCommandDigest ?? authorityWorkerCommandDigest,
        completion: {
          kind: 'settled',
          reason: 'worker-outbox-settled',
          settledAt: new Date().toISOString(),
        },
        result: {
          outboxPath: path.relative(runDir, outboxResultPath),
          outboxDigest,
        },
      });
    }

    command.state = 'reconciled';
    command.outcome = {
      kind: 'receipt-backed',
      receiptDigest: effectiveReceipt.digest,
    };
    publishMutableProjection(commandPath, command);

    return {
      status: 'settled',
      settled: true,
      receipt: effectiveReceipt,
      outcome: command.outcome,
    };
  }

  // If no outbox result, check closed resource
  if (opts.resourceClosed === true) {
    return { status: 'parked', reason: 'closed-resource' };
  }

  // Check Herdr probe
  const probe = opts.probe || (opts.herdrClient ? async (herdrName, paneId) => {
    let info = null;
    try {
      info = opts.herdrClient.agentGet(herdrName);
    } catch {
      if (paneId) {
        try {
          info = opts.herdrClient.agentGet(paneId);
        } catch {}
      }
    }
    if (info) {
      let pInfo = null;
      if (paneId) {
        try { pInfo = opts.herdrClient.paneProcessInfo(paneId); } catch {}
      }
      const workerProc = pInfo?.foregroundProcesses?.find((p) => p.pid && p.pid !== pInfo?.shellPid);
      const resourceIncarnation = pInfo ? computeHerdrResourceIncarnation({
        paneId,
        shellPid: pInfo.shellPid || null,
        workerPid: workerProc?.pid || null,
        foregroundPgid: pInfo.foregroundPgid || null,
        processStartTime: workerProc?.pid ? getProcessStartTime(workerProc.pid) : null,
      }) : null;
      return {
        status: info?.agent_status || info?.agentStatus || 'present',
        agentSession: info?.agent_session?.value || info?.agentSession || null,
        resourceIncarnation,
        info,
      };
    }
    if (paneId) {
      try {
        const pInfo = opts.herdrClient.paneProcessInfo(paneId);
        const workerProc = pInfo?.foregroundProcesses?.find((p) => p.pid && p.pid !== pInfo?.shellPid);
        return {
          status: workerProc ? 'present' : 'absent',
          resourceIncarnation: computeHerdrResourceIncarnation({
            paneId,
            shellPid: pInfo.shellPid || null,
            workerPid: workerProc?.pid || null,
            foregroundPgid: pInfo.foregroundPgid || null,
            processStartTime: workerProc?.pid ? getProcessStartTime(workerProc.pid) : null,
          }),
        };
      } catch {
        return { status: 'absent' };
      }
    }
    return { status: 'absent' };
  } : null);

  if (probe) {
    const probeResult = await probe(command.herdrName, command.paneId);
    if (probeResult.closed === true || probeResult.status === 'closed') {
      return { status: 'parked', reason: 'closed-resource' };
    }

    if (probeResult.status === 'absent' || probeResult.notFound || probeResult.absentProven === true) {
      return { status: 'parked', reason: 'unknown-launch' };
    }

    // Probed resource exists
    // Require non-trivial recorded incarnation (must have workerPid or shellPid)
    if (!command.resourceIncarnation || (!command.resourceIncarnation.workerPid && !command.resourceIncarnation.shellPid)) {
      return { status: 'parked', reason: 'incarnation-unknown' };
    }

    // Check agentSession from probe
    const probeSession = probeResult.agentSession ||
      probeResult.info?.agent_session?.value ||
      probeResult.info?.agent?.agent_session?.value ||
      probeResult.info?.agent_session ||
      probeResult.info?.agent?.agent_session;

    if (probeSession) {
      if (command.agentSession && probeSession !== command.agentSession) {
        return { status: 'parked', reason: 'incarnation-mismatch' };
      }
      if (!command.agentSession && probeResult.resourceIncarnation?.workerPid !== command.resourceIncarnation.workerPid) {
        return { status: 'parked', reason: 'incarnation-mismatch' };
      }
    }

    if (!probeResult.resourceIncarnation || (!probeResult.resourceIncarnation.workerPid && !probeResult.resourceIncarnation.shellPid)) {
      return { status: 'parked', reason: 'incarnation-unknown' };
    }

    if (!matchIncarnations(command.resourceIncarnation, probeResult.resourceIncarnation)) {
      return { status: 'parked', reason: 'incarnation-mismatch' };
    }

    // Alive and matches incarnation (F-b observation)
    return {
      status: 'waiting',
      state: 'worker-running',
      herdrName: command.herdrName,
      paneId: command.paneId,
      resourceIncarnation: command.resourceIncarnation,
    };
  }

  // Without live probe or outbox
  if (!command.resourceIncarnation) {
    return { status: 'parked', reason: 'incarnation-unknown' };
  }

  return { status: 'parked', reason: 'unknown-launch' };
}
