// dispatch/herdr-round.mjs -- the herdr-specific half of a terminal attempt's controller.
//
// An interactive agent runs in a herdr pane as an attempt of the run supervisor: the controller prepares
// what only it can (the brief on disk, the confinement homes, the folder-trust entry, the pane the
// terminal-control port allocates for the attempt's key) and hands the attempt over; everything after the
// handover -- starting the agent in the pane, waiting for its prompt, typing the brief, watching the
// outbox, the deadlines, ending the agent, settling and releasing the pane -- belongs to the supervisor
// and the gate, which keep going when this process is gone (docs/specs/runner.md).
//
// Three refusals shaped what stays here, each because doing the opposite failed in measured production:
//
// 1. The prompt never travels as keystrokes through a shell. It goes to disk; the supervisor types what
//    the brief file holds (the whole brief, or a one-line pointer to it) at the agent.
//
// 2. `agent_status` never concludes a round. Completion is the worker's own `outbox/result-<round>.json`
//    existing, and nothing else.
//
// 3. A failed attempt keeps its pane. That screen is the only place the reason is still legible; the
//    supervisor releases the pane with `retain` unless the attempt ended cleanly.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { DispatchError } from './dispatch-error.mjs';
import { terminalRouteConfig } from '../../terminal-control/config.mjs';
import { normalizeAgentName } from './proof-helpers.mjs';
import { createRoundTerminalControl, portKey, slotDisplay, refusalError } from './terminal-slot.mjs';
import { briefPaths, renderBrief, renderPointer } from './brief.mjs';
import { writeVisibility } from './visibility-session.mjs';
import { createWorkerHome, removeWorkerHome, redactWorkerHome } from './worker-home.mjs';
import {
  seedTrust, seedCodexTrust, seedAgyTrust, defaultAgySettingsPath,
  seedCodexHookTrust, trustRoots,
} from './trust-store.mjs';
export { trustRoots };
import { ensureWorkerSession, DEFAULT_WORKER_SESSION } from './worker-session-boot.mjs';
import { normalizeLegacyConfinement } from './confinement/policies.mjs';
import { evaluateBypassPairing } from './confinement/bypass-pairing.mjs';
import { expandCredentialHome } from './provider-capacity.mjs';
import { publishMutableProjection } from './proof-helpers.mjs';
import { TRUST_CONTEXT_FILE, cleanupTrust } from '../../run-supervisor/steps/cleanup-trust.mjs';

/**
 * The variables a pane sets for the program in it: the terminal type and the identity of the pane, tab
 * and herdr server. The gate (which runs in the pane) keeps its own; the controller's -- another pane, or
 * none -- must not reach the agent, and `HERDR_SOCKET_PATH` of the operator's cockpit in particular would
 * hand a confined seat the cockpit.
 */
const PANE_TERMINAL_ENV = Object.freeze(['TERM', 'COLORTERM', 'TERM_PROGRAM', 'TERM_PROGRAM_VERSION']);

/** `env` without what a pane sets for its own program. */
export function withoutPaneEnv(env) {
  return Object.fromEntries(Object.entries(env ?? {}).filter(([name]) => !PANE_TERMINAL_ENV.includes(name) && !name.startsWith('HERDR_')));
}

/** How long an agent may show no progress before the supervisor stops it. Applies only when the runner
 * config sets no `idleTimeoutMs` (which also governs cli-spawn, where silence is normal). */
export const DEFAULT_IDLE_TIMEOUT_MS = 300000;

/** After a result file appeared while the supervisor is gone, how long the gate still waits for the
 * agent to finish its report before it ends the domain. */
export const ORPHAN_SETTLE_MS = 5000;

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
    // The terminal-control key of the pane, so a later close finds it by key.
    terminalKey: null,
    // The herdr session the pane lives in, so a later reaper or recovery asks the right server.
    herdrSession: null,
    // True only when this round wrote a trust entry, so teardown removes what it wrote and
    // never an entry a person vouched for.
    trustWritten: false,
    note(patch) {
      try { writeVisibility(runDir, patch); } catch { /* a courtesy, not a contract */ }
    },
    fail(errorClass, reason, message, extra = {}) {
      return new DispatchError(errorClass, message, {
        workId, tier, model, reason, runDir, agentName, paneId: round.paneId, terminalKey: round.terminalKey, herdrSession: round.herdrSession, ...extra,
      });
    },
  };
  return round;
}

/**
 * Apply declared confinement, before anything is launched.
 *
 * Two measures, and neither closes the hole alone. A private HOME closes the
 * default socket under `$HOME`, the fallback a worker would otherwise find
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
 * claude and codex; agy shows the same dialog under its own private HOME
 * (`~/.agy-homes/<x>/settings.json`, never the operator's own
 * `~/.gemini/...`), which is why the HOME to seed is resolved from the
 * executor's own env rather than the machine default -- seeding the wrong
 * HOME leaves agy's dialog exactly where it was. `trustStore` is still
 * DECLARED per executor, not assumed for everyone: an agent kind fgOS has
 * not measured a dialog for is not given an entry it may never have needed.
 *
 * Never throws. Refusing here would be worse than trying: the agent may
 * already be trusted by some other route, and the dialog it might still hit
 * is reported by name by the very next step anyway.
 */
export function seedWorkspaceTrust({ trustStore, round, cwd, repoRoot, fullEnv, workerEnv = null, accountSource = null }) {
  const projectPath = path.resolve(cwd);
  const roots = trustRoots(projectPath, repoRoot ?? path.dirname(projectPath));
  const stores = trustStorePaths({ trustStore, fullEnv, workerEnv, accountSource });
  let firstError = null;
  for (const root of roots) {
    try {
      let wrote;
      if (trustStore.kind === 'codex-toml') {
        wrote = seedCodexTrust(stores.target, { projectPath, repoRoot: root, rootConfigPath: stores.root });
        // Only into a worker's own private home: hook trust is never written to the account's real config.
        if (stores.target !== stores.root) seedHookTrust({ round, target: stores.target, projectPath, repoRoot: root, rootConfigPath: stores.root });
      } else if (trustStore.kind === 'agy' || trustStore.kind === 'agy-json') {
        wrote = seedAgyTrust(stores.target, { projectPath, repoRoot: root, rootSettingsPath: stores.root });
      } else {
        wrote = seedTrust(stores.target, { projectPath, repoRoot: root });
      }
      // A seed that finds the entry already there wrote nothing: the person (or an earlier
      // round) owns it, so this round must not remove it on teardown.
      if (wrote) {
        round.trustWritten = true;
        round.note({ trustSeeded: trustStore.kind });
      }
      return;
    } catch (err) {
      firstError ??= err;
    }
  }
  round.note({ trustSeedFailed: firstError?.message ?? 'no trust root to derive from' });
}

/** codex hook review is a second dialog after folder trust; seed it from the same trusted root.
 * Never throws: a failure is noted and the review it would have cleared is reported by name. */
function seedHookTrust({ round, target, projectPath, repoRoot, rootConfigPath }) {
  try {
    const { keys, skipped } = seedCodexHookTrust(target, { projectPath, repoRoot, rootConfigPath });
    if (keys.length) round.note({ hookTrustSeeded: keys.length });
    if (skipped) round.note({ hookTrustSkipped: skipped });
  } catch (err) {
    round.note({ hookTrustSeedFailed: err.message });
  }
}


/**
 * Where the trust decision is read (the account's real store) and where the
 * entry is written. They differ only for a confined worker with a private
 * home: it reads its store from the private CODEX_HOME / HOME, which starts
 * empty, so the entry goes there and the account's own store is never touched.
 *
 * `accountSource` is the credential source of the account the capacity layer
 * leased for this round. A private home carries THAT account's login, so the
 * decision is read from that account's own store, not from the account the
 * invocation's static env names: the two differ whenever the capacity layer
 * picks another account of the same provider, and the static one may never
 * have been asked about this repo. Without a private home the CLI reads the
 * invocation's home, so the leased account says nothing about it.
 */
export function trustStorePaths({ trustStore, fullEnv, workerEnv, accountSource = null }) {
  if (trustStore.kind === 'codex-toml') {
    const own = workerEnv?.CODEX_HOME && workerEnv.CODEX_HOME !== fullEnv.CODEX_HOME;
    const leased = own && accountSource?.kind === 'codex-home' ? expandCredentialHome(accountSource.home) : null;
    const real = trustStore.path ?? path.join(leased ?? fullEnv.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'config.toml');
    return { root: real, target: own ? path.join(workerEnv.CODEX_HOME, 'config.toml') : real };
  }
  if (trustStore.kind === 'agy' || trustStore.kind === 'agy-json') {
    const own = workerEnv?.HOME && workerEnv.HOME !== fullEnv.HOME;
    const leased = own && accountSource?.kind === 'home-files' ? expandCredentialHome(accountSource.home) : null;
    const real = trustStore.path ?? defaultAgySettingsPath(leased ?? fullEnv.HOME ?? os.homedir());
    return { root: real, target: own ? defaultAgySettingsPath(workerEnv.HOME) : real };
  }
  const real = trustStore.path ?? path.join(os.homedir(), '.claude.json');
  return { root: real, target: real };
}

/**
 * What typed at the agent: `inline` is the default so a person watching the pane sees the full brief in
 * the TUI conversation; `file-pointer` types a one-line pointer to `brief-<round>.md` on disk. The text
 * is written to a file the supervisor reads, so the same bytes reach the agent whoever delivers them.
 */
function writeTypedBrief({ delivery, briefText, runDir, roundNumber, paths }) {
  if (delivery !== 'file-pointer') return paths.briefPath;
  const typedPath = path.join(runDir, `brief-${roundNumber}.pointer.txt`);
  fs.writeFileSync(typedPath, renderPointer({ runDir, round: roundNumber }));
  return typedPath;
}

/**
 * The folder-trust entry for this attempt, written into the store the agent reads, and the record the
 * `cleanup-trust` step needs to take it back when the attempt is over. The record exists only when this
 * call wrote the entry, so an entry a person vouched for is never removed.
 */
function seedAttemptTrust({ trustStore, round, runDir, cwd, repoRoot, fullEnv, workerEnv, accountSource }) {
  seedWorkspaceTrust({ trustStore, round, cwd, repoRoot, fullEnv, workerEnv, accountSource });
  if (!round.trustWritten) return;
  const { target } = trustStorePaths({ trustStore, fullEnv, workerEnv });
  publishMutableProjection(path.join(runDir, TRUST_CONTEXT_FILE), {
    v: 1, kind: trustStore.kind, target, projectPath: path.resolve(cwd),
  });
}

/**
 * Everything a terminal attempt needs before its supervisor can start, in the order that makes every
 * failure leave nothing behind but the pane's key: the stale-result check, the brief, the confinement
 * homes, the pane, the trust entry.
 *
 * Returns what the envelope names (`briefPath`, `outboxDir`, `slot`), the herdr endpoint the supervisor
 * is started with, and `abandon()`: what a controller that fails before the handover calls to give the
 * pane back and take the credential and the trust entry out again. After the handover none of it is the
 * controller's: the supervisor releases the pane and the steps remove the trust entry.
 */
export async function prepareTerminalAttempt(ctx) {
  const {
    attemptId, runDir: rawRunDir, cwd, repoRoot, prompt, workId, tier, model, runId,
    herdrBin, fullEnv, confinement, permissionMode, agentKind, delivery = 'inline',
    trustStore, trustAccountSource, attemptEnv, dispatchBatchKey, anchorPaneId, terminalConfig, workLabel,
  } = ctx;
  const roundNumber = 1;
  const runDir = path.resolve(rawRunDir);
  const paths = briefPaths(runDir, roundNumber);

  // The key is the attempt id itself: the supervisor addresses the pane by it, and a key the port would
  // rewrite could never be found again.
  const key = portKey(attemptId);
  if (key !== attemptId) {
    throw new DispatchError('invalid-config', `attempt id "${attemptId}" is not usable as a terminal key`, { workId, tier, model, reason: 'terminal-key-invalid', runDir });
  }

  fs.mkdirSync(paths.outbox, { recursive: true });
  // A run directory that already holds this round's result would settle the attempt before the agent just
  // briefed has done anything. The result file outranks everything; what it cannot know is whether the
  // file belongs to THIS round, and this is the only place that distinction still exists.
  if (fs.existsSync(paths.resultPath)) {
    throw new DispatchError(
      'invalid-config',
      `executor for work "${workId}" refused: ${paths.resultPath} already exists before this round started, so the attempt would settle on somebody else's result. Use a fresh run directory or a new round.`,
      { workId, tier, model, reason: 'stale-result-in-run-dir', runDir, resultPath: paths.resultPath },
    );
  }

  const agentName = normalizeAgentName(`fgos-${runId ?? workId ?? 'run'}-${attemptId}`);
  const round = openRound({ runDir, workId, tier, model, agentName });
  round.terminalKey = key;

  const rawContract = ctx.effectiveContract ?? null;
  const effectiveContract = rawContract
    ? {
        ...rawContract,
        resultClaim: rawContract.resultClaim
          ? { ...rawContract.resultClaim, path: paths.resultPath }
          : { path: paths.resultPath, schema: 'agent-result.v1', required: true },
      }
    : null;
  const briefText = renderBrief({ prompt, round: roundNumber, runDir, agentName, effectiveContract });
  fs.writeFileSync(paths.briefPath, briefText);
  if (effectiveContract && fs.existsSync(paths.effectiveExecutionContractPath)) {
    try { publishMutableProjection(paths.effectiveExecutionContractPath, effectiveContract); } catch { /* the brief already names the claim path */ }
  }
  const briefPath = writeTypedBrief({ delivery, briefText, runDir, roundNumber, paths });
  round.note({ status: 'requested', agentName, round: roundNumber, terminalKey: key });

  const { workerHomePath, sessionEnv, confined, status } = await establishConfinement({
    confinement, round, fullEnv, cwd, repoRoot, permissionMode, herdrBin,
  });
  round.note({ confinement: { status, confined } });
  round.herdrSession = sessionEnv?.HERDR_SESSION ?? null;
  if (round.herdrSession) round.note({ herdrSession: round.herdrSession });

  const projectRoot = repoRoot ?? cwd;
  const groupKey = portKey(dispatchBatchKey ?? runId ?? workId ?? key);
  const tc = createRoundTerminalControl({
    herdrBin,
    herdrEnv: sessionEnv,
    config: { ...terminalRouteConfig(projectRoot), ...(terminalConfig ?? {}) },
  });
  const display = slotDisplay({ ...workLabel, agent: agentKind, model, role: rawContract?.assignment?.role });

  const abandon = async () => {
    try { await tc.releaseAsync({ key, groupKey, disposition: 'close' }); } catch { /* the pane is the port's to reconcile */ }
    try { await cleanupTrust({ runDir }); } catch { /* a leftover entry costs one line in the store */ }
    if (workerHomePath) { try { redactWorkerHome(workerHomePath); } catch { /* nothing further to do about a home we cannot read */ } }
  };

  try {
    // A pane already sitting in the caller's own tab joins the group, so the batch opens beside it. A pane
    // that cannot be taken is no anchor: the group simply opens its own tab.
    if (anchorPaneId) {
      try { tc.attach({ key: portKey(`anchor-${groupKey}`), pane: anchorPaneId, groupKey, display }); } catch { /* no anchor */ }
    }
    let slot;
    try {
      slot = await tc.allocateAsync({ key, groupKey, display, cwd, env: {} });
    } catch (err) {
      throw round.fail('worker-spawn-fail', err.code ?? 'pane_split_failed',
        `executor failed to start for work "${workId}": terminal-control could not open a pane (${err.code ?? 'unknown'}): ${err.message}`);
    }
    if (slot.result !== 'slot') {
      const err = refusalError(slot, `allocate ${key}`);
      throw round.fail('worker-spawn-fail', err.code === 'terminal_unknown' ? 'pane_split_failed' : err.code,
        `executor failed to start for work "${workId}": terminal-control could not open a pane (${err.code}): ${err.message}`);
    }
    round.paneId = slot.slot.paneId;
    round.note({ status: 'pane-created', paneId: round.paneId });

    // A confined run with a private home needs no seeding: that home is provisioned with the workspace
    // already trusted, so writing to the operator's own store for a directory only the worker will ever
    // see would be pure side effect.
    if (trustStore && !workerHomePath) {
      seedAttemptTrust({ trustStore, round, runDir, cwd, repoRoot, fullEnv, workerEnv: attemptEnv ?? null, accountSource: trustAccountSource ?? null });
    }
  } catch (err) {
    await abandon();
    throw err;
  }

  // One line so a person watching the runner's own stderr can find the pane to watch and the directory
  // this round's files will appear in. Diagnostic only -- nothing reads it back.
  process.stderr.write(`fgos: herdr-spawn work=${workId} pane=${round.paneId} agent=${agentName} runDir=${runDir}\n`);

  return {
    briefPath,
    outboxDir: paths.outbox,
    resultPath: paths.resultPath,
    slot: { key, groupKey },
    paneId: round.paneId,
    workerHomePath,
    // The herdr endpoint the supervisor reaches the pane through: the session this round lives in.
    endpointEnv: {
      ...(herdrBin ? { FGOS_HERDR_BIN: herdrBin } : {}),
      ...Object.fromEntries(Object.entries(sessionEnv ?? {}).filter(([name, value]) => name.startsWith('HERDR_') && typeof value === 'string')),
    },
    tc,
    display,
    abandon,
  };
}

/** Lines of `next` that `previous` did not already show: the screen scrolled, so the overlap is the longest
 * tail of `previous` that opens `next`. */
export function screenDelta(previous, next) {
  const before = String(previous ?? '').split('\n');
  const after = String(next ?? '').split('\n');
  for (let overlap = Math.min(before.length, after.length); overlap > 0; overlap -= 1) {
    if (before.slice(before.length - overlap).every((line, index) => line === after[index])) {
      return after.slice(overlap).join('\n');
    }
  }
  return after.join('\n');
}

const SCREEN_FOLLOW_MS = 3000;

/**
 * Show a person who watches the controller what the pane shows, from the moment the attempt is bound
 * until `stop()`. Display only: a screen that cannot be read is skipped, and nothing is concluded from it.
 */
export function followPaneScreen({ tc, key, onChunk, intervalMs = SCREEN_FOLLOW_MS }) {
  if (typeof onChunk !== 'function') return () => {};
  let previous = '';
  const look = () => {
    try {
      const seen = tc.read({ key, source: 'visible' });
      if (seen.result !== 'screen') return;
      const delta = screenDelta(previous, seen.screen).replace(/\s+$/, '');
      previous = seen.screen;
      if (delta.trim()) onChunk('stdout', `${delta}\n`);
    } catch { /* the pane is gone or busy: nothing to show */ }
  };
  const timer = setInterval(look, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
