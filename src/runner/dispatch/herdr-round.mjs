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
import { DispatchError } from './dispatch-error.mjs';
import { createHerdrClient, normalizeAgentName, isReadyState } from './herdr-agent.mjs';
import { briefPaths, renderBrief, renderPointer } from './brief.mjs';
import { evaluateLadder, paneFateFor } from './liveness.mjs';
import { writeVisibility } from './visibility-session.mjs';
import { createWorkerHome, removeWorkerHome } from './worker-home.mjs';
import { seedTrust, seedCodexTrust } from './trust-store.mjs';
import { ensureWorkerSession, DEFAULT_WORKER_SESSION } from './worker-session-boot.mjs';

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

/** How often the receipt poll looks at the outbox. */
const RECEIPT_POLL_MS = 500;
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
function groupDeadlines({ readyTimeoutMs, promptTimeoutMs, resendAfterMs, maxResends, idleTimeoutMs, timeoutMs }) {
  return {
    startup: { readyMs: readyTimeoutMs, promptMs: promptTimeoutMs },
    brief: { resendAfterMs, maxResends },
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
 * behaviour exactly, and the config door has already refused any `bypass`
 * that did not declare all three confinement flags.
 *
 * Confinement that was asked for and cannot be delivered is a refusal, not a
 * downgrade: running anyway would put a worker on the operator's cockpit
 * socket while the profile claims it is confined.
 */
async function establishConfinement({ confinement, round, fullEnv, cwd, repoRoot, permissionMode, herdrBin }) {
  let workerHomePath = null;
  try {
    if (confinement?.privateHome) {
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
    if (confinement?.isolatedSession) {
      const session = await ensureWorkerSession(confinement.sessionName ?? DEFAULT_WORKER_SESSION, {
        callerEnv: fullEnv,
        workerHome: workerHomePath,
        cwd,
        herdrBin,
      });
      round.note({ workerSession: session.sessionName });
      return { workerHomePath, sessionEnv: session.env };
    }
    return { workerHomePath, sessionEnv: fullEnv };
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
  try {
    client.agentPrompt(round.agentName, message, { wait: true, until: ['working'], timeoutMs: promptMs });
    return null;
  } catch (err) {
    return err;
  }
}

/** The first submission. A brief the agent cannot even be handed is a spawn
 * failure, and `agent_blocked` means something is on screen worth quoting. */
function deliverBrief({ client, round, message, promptMs }) {
  const err = submitBrief({ client, round, message, promptMs });
  if (!err) {
    round.note({ status: 'briefed' });
    return;
  }
  let screen = null;
  if (err.code === 'agent_blocked') {
    try { screen = lastScreenLine(client.agentRead(round.agentName, { lines: 40 })); } catch { screen = null; }
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
  const decide = (observation) => {
    const first = evaluateLadder({ observation, limits, prior });
    if (!first.needsScreen) return first;
    let screen = '';
    try { screen = client.agentRead(round.agentName, { lines: 60 }); } catch { screen = ''; }
    return evaluateLadder({ observation: { ...observation, screen }, limits, prior });
  };

  for (;;) {
    if (!ackSeen && fs.existsSync(paths.ackPath)) {
      ackSeen = true;
      lastProgressAt = Date.now();
      round.note({ status: 'working' });
    }

    let agentState = 'unknown';
    try { agentState = client.agentGet(round.agentName).agentStatus; } catch { agentState = 'unknown'; }
    // `working` is a progress signal and nothing more. It never concludes a
    // round -- only the worker's own result file does that.
    if (agentState === 'working') lastProgressAt = Date.now();

    const decision = decide({
      resultFilePresent: fs.existsSync(paths.resultPath),
      liveness: readLiveness(),
      agentState,
      lastProgressAt,
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
  let screenLine = decision.screenLine;
  if (!screenLine) {
    try { screenLine = lastScreenLine(client.agentRead(round.agentName, { lines: 60 })); } catch { screenLine = null; }
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
async function settleRound({ client, round, paths, exitCommand, promptMs, readLiveness, workerHomePath }) {
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
    client.agentPrompt(round.agentName, exitCommand, { wait: false, timeoutMs: promptMs });
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
  const {
    herdrBin, fullEnv, confinement, permissionMode, repoRoot,
    agentKind, agentArgs, prompt, delivery, exitCommand, trustStore,
    paneEnv, cwd, usageLimitPatterns, closeAlways, workId, tier, model,
  } = ctx;

  const roundNumber = 1;
  const deadlines = groupDeadlines(ctx);
  const { runDir, paths } = prepareRunDir({ runDir: ctx.runDir, roundNumber, workId, tier, model });

  const agentName = normalizeAgentName(`fgos-${workId ?? 'run'}-${Date.now().toString(36)}`);
  const round = openRound({ runDir, workId, tier, model, agentName });

  const briefText = renderBrief({ prompt, round: roundNumber, runDir, agentName });
  fs.writeFileSync(paths.briefPath, briefText);
  round.note({ status: 'requested', agentName, round: roundNumber });

  const { workerHomePath, sessionEnv } = await establishConfinement({
    confinement, round, fullEnv, cwd, repoRoot, permissionMode, herdrBin,
  });

  const client = createHerdrClient({ herdrBin, cwd, env: sessionEnv });
  // A confined worker's pane gets the private HOME; herdr honours `--env` for
  // ordinary variables, which is exactly what this relies on.
  const effectivePaneEnv = workerHomePath ? { ...paneEnv, HOME: workerHomePath } : paneEnv;
  try {
    round.paneId = client.paneSplit({ cwd, env: effectivePaneEnv });
  } catch (err) {
    throw round.fail('worker-spawn-fail', err.code ?? 'pane_split_failed',
      `executor failed to start for work "${workId}": herdr could not open a pane (${err.code ?? 'unknown'}): ${err.message}`);
  }
  round.note({ status: 'pane-created', paneId: round.paneId });

  // A confined run needs no seeding here: its private HOME is provisioned with
  // the workspace already trusted, so writing to the operator's own store for
  // a directory only the worker will ever see would be pure side effect.
  if (trustStore && !workerHomePath) {
    seedWorkspaceTrust({ trustStore, round, cwd, repoRoot, fullEnv });
  }

  startAgent({ client, round, agentKind, agentArgs, readyMs: deadlines.startup.readyMs });

  // One line so a person watching the runner's own stderr can find the pane to
  // watch and the directory this round's files will appear in. Diagnostic
  // only -- nothing reads it back.
  process.stderr.write(`fgos: herdr-spawn work=${workId} pane=${round.paneId} agent=${agentName} runDir=${runDir}\n`);

  const message = briefMessage({ delivery, briefText, runDir, roundNumber });
  deliverBrief({ client, round, message, promptMs: deadlines.startup.promptMs });

  const readLiveness = livenessProbe(client, round.paneId);
  const decision = await pollForOutcome({
    client, round, paths, message, deadlines, usageLimitPatterns, readLiveness,
  });

  if (decision.outcome !== 'settled') {
    throw concludeFailure({ client, round, decision, closeAlways });
  }

  const stdout = await settleRound({
    client, round, paths, exitCommand,
    promptMs: deadlines.startup.promptMs, readLiveness, workerHomePath,
  });

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
