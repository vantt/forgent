// src/runner/execution/run.mjs — Single execution door (fgos run) and verifiable mutating gate
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { publishMutableProjection } from '../../native/proof-helpers.mjs';
import { createGitInspect, gitWriter } from '../../git/inspect.mjs';

import {
  assertCaseAdmissionPort, normalizeCaseRef, briefNeverReached, noBriefDelivered, seatLaunchesUsed, SEAT_LAUNCH_CEILING,
} from './case-admission-port.mjs';
import { partitionPaths } from '../dispatch/write-scope.mjs';
import { askFor, bind } from './bind.mjs';
import { credentialFaultPools, failedAccountsOf, inspectAccountRotation, keptBindingOf, mayRotateAccount, triedBindingsOf } from './account-rotation.mjs';
import { runnerConfigForBinding } from './account-pin.mjs';
import { worktreeSnapshot, writesSince } from './partial-writes.mjs';
import { createSeatLedger } from './seat-ledger.mjs';
import { assertSeatId } from '../../convention/seat-id.mjs';
import { runLoop, loopRunsVerify } from './loops/index.mjs';
import { shippedCatalog } from '../dispatch/shipped-catalog.mjs';
import { ERROR_OUTCOMES } from './loops/reviewed.mjs';
import { verifyCommandOf } from './loops/verify.mjs';
import { runCommand } from '../goal-check.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { createCredentialProbe } from '../dispatch/provider-credential-probe.mjs';
import { accountInventoryConfigOf, auditLeaseReceipt, dropAssignmentRecord } from '../dispatch/provider-capacity.mjs';
import { LEASE_CONFLICT_FAILURE_CODE } from '../dispatch/run-result.mjs';
import { loadRunnerConfigForDir, RunnerConfigError } from '../dispatch/config.mjs';
import { commitOnBranch, commitUnitWork, foreignIndexDetail, preflightUnitWorktree, recheckWriteConsent, seatRoundCommitArgs, settleCommitOperation } from './commit-unit-work.mjs';
import { assertSyncResumable, commitRoundWithSync, effectiveWriteScope, runPendingSync, syncBrief, syncSummary } from './unit-sync.mjs';
import { recordCustodyHandoff } from '../../run-supervisor/cwd-lock.mjs';
import { reportRefsOf, resolveUnitInputs, copyHandoffsInto, refIsHiddenFromBlind, plainInputName, isSeatInput } from './handoff-refs.mjs';
import { outcomeOfRunResult, readUnitRunHistory } from './unit-run-history.mjs';
import { writeUnitSummary } from './unit-summary.mjs';
import { createCredentialRenewal } from '../dispatch/provider-credential-renewal.mjs';
import { adoptRun, sweepAttempts } from '../../run-supervisor/client.mjs';
import { installCancelOnSignal, assertNotCancelled, RunCancelledError } from '../../run-supervisor/cancel-registry.mjs';
import { cancelOnSignalEnabled } from '../../run-supervisor/cancel-opt-in.mjs';
import { readCancelWaitMs } from '../../run-supervisor/gate-kill-grace.mjs';
import { listGenerations } from '../../run-supervisor/run-lock.mjs';
import { currentAttemptOf } from './unit-state.mjs';
import { resolveStateRoot } from '../../holder-lock/index.mjs';
import { admitFreshUnit, leftByDeadController, loadResumedUnit, writesWorktree } from './unit-run-start.mjs';

function publishUnitSummary(unitDir) {
  try { writeUnitSummary(unitDir); }
  catch (error) {
    console.warn(`fgos: could not write derived unit summary for "${path.basename(unitDir)}": ${error.message}`);
  }
}

/**
 * `{ personaPin }` for an assignment policy when the persona bound for this seat carries pinned
 * text, else nothing. An override scoped to this very seat wins; otherwise the unit's own persona,
 * pinned when the unit run started, applies to whichever seat bound that same name. Matching on
 * name keeps a pin from reaching a seat that resolved a different persona.
 */
function pinnedPersonaFor(unitRecord, seatId, persona) {
  const hit = (unitRecord.overrides ?? []).find((o) => o?.personaPin && o.scope?.seat === seatId && o.persona === persona);
  if (hit) return { personaPin: hit.personaPin };
  const unitPin = unitRecord.personaPin;
  return unitPin && unitPin.name === persona ? { personaPin: unitPin } : {};
}

/**
 * Whether this process runs inside a live herdr session: herdr exports HERDR_ENV=1 and the
 * socket path into every pane it starts. A caller that already knows passes
 * `session.herdrPresent` and skips the probe.
 */
export function detectHerdrPresent(env = process.env) {
  if (env.HERDR_ENV !== '1') return false;
  const socket = env.HERDR_SOCKET_PATH;
  return typeof socket === 'string' && socket !== '' && fs.existsSync(socket);
}

/**
 * Resolve git main checkout root and worktree path without importing worktree.mjs.
 */
export function resolveGitRoots(cwd = process.cwd(), { allowNoRepository = false } = {}) {
  try {
    const result = createGitInspect({stateRoot:resolveStateRoot().stateRoot,
      repoPath:cwd,trustedMain:cwd}).resolveRepo();
    // A read-only caller may work in a directory that is no repository: Inspect's typed answer is
    // `notARepository`, and the directory is its own project root.
    if (result.notARepository && allowNoRepository) {
      let root = cwd;
      try { root = fs.realpathSync(cwd); } catch { /* the directory is as given */ }
      return {worktreeRoot:root,mainCheckoutRoot:root,isLinkedWorktree:false,notARepository:true};
    }
    if (result.notARepository || !result.worktreeRoot) throw new Error('not a working repository');
    return {worktreeRoot:result.worktreeRoot,mainCheckoutRoot:result.trustedMainRoot,
      isLinkedWorktree:result.worktreeRoot !== result.trustedMainRoot};
  } catch (error) {
    throw new RunnerConfigError(`fgos run must run inside a git repository (cwd: ${cwd}): ${error.message}`);
  }
}

/** A unit that writes or syncs needs a repository; a read-only one runs where roots say there is none. */
export function assertRepositoryForWrites(roots, cwd, { writes = false } = {}) {
  if (roots?.notARepository && writes) {
    throw new RunnerConfigError(`fgos run must run inside a git repository (cwd: ${cwd}): not a working repository`);
  }
}

/**
 * Capture snapshot of runner config from the main checkout root.
 */
export function snapshotRunnerConfig(mainCheckoutRoot, runnerConfig) {
  const cfg = runnerConfig ?? loadRunnerConfigForDir(mainCheckoutRoot);
  // What the hash covers is what seat choice and the run read: the tier defaults and ceiling, the
  // fallback order, the cells, the capability taste, the patterns (with the schema marker), the
  // executors and governance.
  const filtered = {
    defaults: cfg.defaults || {},
    maxTier: cfg.maxTier ?? null,
    tierFallback: cfg.tierFallback || {},
    capabilities: cfg.capabilities || {},
    loops: cfg.loops || {},
    patterns: cfg.patterns || {},
    modelPolicies: cfg.modelPolicies || {},
    executors: cfg.executors || {},
    governance: cfg.governance || null,
  };
  const serialized = JSON.stringify(filtered);
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');
  // The account inventory (`llmAccounts`, `providers`) holds the places logins are kept. It is machine
  // config read live at every bind and launch, so a unit record never carries it.
  const { llmAccounts, providers, ...runner } = cfg;
  return {
    hash,
    runner,
  };
}

/**
 * The account inventory, read from the config on every call and never from a copy kept for the run, so an
 * account added or removed while a unit runs is seen by the next bind. A caller-supplied config is its own
 * inventory.
 */
export function readAccountInventory(mainRoot, suppliedConfig) {
  return accountInventoryConfigOf(suppliedConfig ?? loadRunnerConfigForDir(mainRoot));
}

/**
 * A producer attempt whose agent turn passed but whose runner commit failed: a resume commits it
 * again without spawning the agent. Not when the failed commit is still on the branch carrying
 * paths outside the scope; a person has to take that commit off first.
 */
function commitPending(attempt, worktree, mainRoot, custody) {
  const commit = attempt?.commit;
  if (attempt?.commitOperation?.state === 'pending') return true;
  if (commit?.status !== 'failed') return false;
  return !(commit.reason === 'committed-set-mismatch' && commit.sha && commitOnBranch(worktree, commit.sha, mainRoot, custody));
}

/**
 * How one dispatch of `attempt` enters the admission ledger. A dispatch the previous controller started
 * and never read the outcome of keeps its retry id, so the dispatch finds that attempt again and takes
 * its settled result instead of running the agent; a dispatch with no such history, or whose attempt
 * was abandoned before it started or cancelled by the person, gets a new id and names the attempt it follows.
 */
function admissionIdentityFor(attempt, { unitRunId, assignmentId, worktree, assignmentsDir }) {
  const current = currentAttemptOf(assignmentsDir, assignmentId);
  const abandoned = () => {
    if (!current) return false;
    // A run from before the supervisor that an earlier release settled as abandoned has no result to carry on from.
    try {
      if (JSON.parse(fs.readFileSync(path.join(current.dir, 'run.json'), 'utf8')).settlement === 'abandoned-legacy') return true;
    } catch { /* no status record: judged by its envelope below */ }
    if (!fs.existsSync(path.join(current.dir, 'envelope.json'))) return false;
    if (adoptRun(current.dir, { probeOnly: true }).state !== 'closed') return false;
    try {
      const outcome = String(JSON.parse(fs.readFileSync(path.join(current.dir, 'receipt.json'), 'utf8')).outcome);
      // Never started, or stopped by the person's Ctrl-C: neither is a result to carry on from.
      return outcome.startsWith('abandoned') || outcome === 'cancelled';
    } catch { return false; }
  };
  // The ledger, not the directory, says whether the previous dispatch was admitted: a controller that
  // died between the admission commit and the directory's publication is completed by the same id.
  const generations = listGenerations(path.join(assignmentsDir, assignmentId, 'admission', 'generations'));
  const admitted = attempt.dispatchRetryId !== undefined && generations.some((g) => g.record?.retryId === attempt.dispatchRetryId);
  const continuing = attempt.outcome === undefined && admitted && !abandoned();
  const retryId = continuing ? attempt.dispatchRetryId : `${assignmentId}~${crypto.randomBytes(6).toString('hex')}`;
  return {
    retryId,
    predecessorRunId: generations.at(-1)?.record?.runId ?? null,
    destination: worktree,
    payloadDigest: crypto.createHash('sha256').update(`${unitRunId}|${assignmentId}`).digest('hex'),
  };
}

/**
 * Main headless unit execution entrypoint.
 *
 * @param {object} options
 * @param {string} [options.unitPath] Path to unit YAML/JSON file or '-' for stdin
 * @param {object} [options.unitData] Raw unit object (in-memory)
 * @param {string} [options.pattern] Pattern name
 * @param {Array} [options.overrides] Array of overrides [{scope, origin, executor, invocation, tier, persona, reasoningEffort, account, timeoutMs}]
 * @param {boolean} [options.raiseAuthorized] Whether the calling door may raise a tier or accept a dependence.
 *   No door is authorized yet: every caller passes false (the default)
 * @param {string} [options.workflowId] The workflow this unit belongs to, to name where a seat's recommended tier was declared
 * @param {string} [options.resumeUnitRunId] Unit run ID to resume
 * @param {string} [options.repoRoot] Main repository root
 * @param {string} [options.cwd] Current working directory / worktree
 * @param {{ workflowDir?: string|null, owningDomain?: string|null }} [options.personaScope] Where the persona lookup starts for the workflow this unit belongs to (a case passes it); omitted, workspace and core only
 * @param {string} [options.worktree] Explicit worktree path
 * @param {object} [options.session] Session context { provider, tier, hasNativeAgent, herdrPresent, headless }
 * @param {object} [options.declared] Work step operation this unit runs: { workId, domain, workflow,
 *   stage, operation, operations } (operations are the step's operation objects). Stored in unit.json.
 * @param {string[]} [options.pinInputs] Absolute paths whose bytes the dispatch hashes at launch
 *   (`inputDigests` of the result). Stored in unit.json.
 * @param {object} [options.runnerConfig] Runner config the caller already resolved (e.g. from
 *   `--config <path>`); snapshotted into unit.json instead of reading `.fgos/config.json`.
 * @param {Function} [options.onLog] Log callback
 * @returns {Promise<{unitRunId: string, outcome: string, rounds: number, results: Array}>}
 */
export async function runUnit(options = {}) {
  assertNotCancelled();
  // `admission` is what the case admission port answered for this run; `settled` says it was handed back.
  const scope = { control: null, custody: null, handedOff: false, admission: null, unitRecord: null };
  const uninstall = holdCancelOnSignal(options);
  let result;
  let failure = null;
  try {
    result = await runUnitBody(options, scope);
    scope.handedOff = true;
    return result;
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    try {
      try { if (scope.handedOff) recordCustodyHandoff(scope.custody, result); }
      finally { scope.custody?.release(); }
    } finally {
      try { scope.control?.release(); } catch { /* a seat that cannot be released is taken over as a dead holder */ }
      // After custody is released: the worktree is quiet, so the port may release the binding it took for this run.
      settleAdmission(scope, result, failure);
      uninstall();
    }
  }
}

/**
 * Hand the reservation back, once: after the pattern settled, or when the run failed. A cancelled run
 * is not settled: it stays live as a dead controller leaves it, and the resume carries on. A run that
 * never got a unit directory settles as `not-started`. The core writes nothing to the ledger before this.
 */
function settleAdmission(scope, result, failure) {
  const admission = scope.admission;
  if (!admission || admission.settled) return;
  if (failure instanceof RunCancelledError) return;
  admission.settled = true;
  const ended = failure ? (admission.started ? 'execution-failure' : 'not-started') : result.outcome;
  // A run whose seats were never given their brief did no work: it settles as one that never started.
  const refunded = ended !== 'pass' && admission.started && scope.unitRecord && noBriefDelivered(scope.unitRecord);
  const outcome = refunded ? 'not-started' : ended;
  try {
    admission.port.settle(admission.reservationId, {
      caseId: admission.caseId,
      outcome,
      unitRunId: admission.started && !refunded ? admission.unitRunId : null,
      results: result?.results ?? [],
      seatLaunchesUsed: scope.unitRecord ? seatLaunchesUsed(scope.unitRecord) : 0,
      frameExhausted: scope.ceilingHit === true,
    });
  } catch (error) {
    console.warn(`fgos: could not settle reservation "${admission.reservationId}" of case "${admission.caseId}": ${error.message}`);
  }
}

// A process that asked for it (the CLI entry, `enableCancelOnSignal`) has Ctrl-C and SIGTERM cancel every
// attempt it delivered (cancel-registry.mjs). One handler serves all units running in the process:
// installed with the first, removed with the last. Any other caller keeps its own signal handling.
let cancelHolders = 0;
let removeCancelHandlers = null;
function holdCancelOnSignal(options) {
  if (!cancelOnSignalEnabled()) return () => {};
  if (cancelHolders === 0) {
    const projectRoot = options.repoRoot ?? (() => { try { return resolveGitRoots(options.cwd ?? process.cwd()).mainCheckoutRoot; } catch { return undefined; } })();
    removeCancelHandlers = installCancelOnSignal({ cancelWaitMs: readCancelWaitMs({ projectRoot }) });
  }
  cancelHolders += 1;
  return () => {
    cancelHolders -= 1;
    if (cancelHolders === 0) { removeCancelHandlers?.(); removeCancelHandlers = null; }
  };
}

/** How many times in a row a seat's named account may be taken from it before the seat is refused. */
const MAX_LEASE_CONFLICTS = 8;

/** Whether an attempt ended because the lease refused the account Seat Binding named (nothing ran). */
function isLeaseConflict(runResult) {
  return runResult?.classification?.failure?.code === LEASE_CONFLICT_FAILURE_CODE;
}

/** A JSON file the run an attempt ended on left in its directory (the supervisor's receipt, the lease's selection), or null. */
function readAttemptJson(assignmentsDir, assignmentId, name) {
  try {
    const attempt = currentAttemptOf(assignmentsDir, assignmentId);
    return attempt ? JSON.parse(fs.readFileSync(path.join(attempt.dir, name), 'utf8')) : null;
  } catch {
    return null;
  }
}

async function runUnitBody(options, scope) {
  if (options.resumeUnitRunId && options.stanceOptions !== undefined) {
    throw new RunnerConfigError('cannot provide stanceOptions when resuming a unit run: the stored question is immutable');
  }
  // Private homes left by an earlier run (a failed round that kept its pane) hold a copy of an account
  // login; `fgos run` is the one door every such run goes through, so it is also where the ones whose pane
  // has since closed are reclaimed, even from a directory that is no git checkout. Best effort: a reap
  // problem never blocks the run.
  const cwd = options.cwd ?? process.cwd();
  let roots = null;
  let rootsFailure = null;
  try { roots = resolveGitRoots(cwd, { allowNoRepository: true }); } catch (err) { rootsFailure = err; }
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots?.mainCheckoutRoot;
  try {
    sweepAttempts({ assignmentsRoot: mainRoot ? path.join(mainRoot, '.fgos', 'assignments') : undefined });
  } catch { /* best effort */ }
  if (rootsFailure) throw rootsFailure;

  // The config this run reads live, at first use (a resume refused for its record never needs it): the
  // account inventory always comes from it, never from unit.json, and a fresh run snapshots the rest.
  let liveConfigRead;
  const liveConfig = () => (liveConfigRead ??= options.runnerConfig ?? loadRunnerConfigForDir(mainRoot));
  const base = {
    options, scope, mainRoot, liveConfig,
    worktreePath: options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot,
    caseRef: normalizeCaseRef(options.caseRef),
    port: options.caseAdmission === undefined ? null : assertCaseAdmissionPort(options.caseAdmission),
    assignmentsDir: path.join(mainRoot, '.fgos', 'assignments'),
    withAccounts: (runner) => ({ ...runner, ...readAccountInventory(mainRoot, options.runnerConfig) }),
    snapshot: () => snapshotRunnerConfig(mainRoot, liveConfig()),
    assertRepository: (writes) => assertRepositoryForWrites(roots, cwd, { writes }),
    herdrPresent: () => options.session?.herdrPresent ?? detectHerdrPresent(),
  };
  const admitted = options.resumeUnitRunId ? loadResumedUnit(base) : await admitFreshUnit(base);
  const ctx = openUnitRun({ ...base, ...admitted });
  try {
    Object.assign(ctx, seatStateOf(ctx));
    return await runCollaboration(ctx);
  } catch (error) {
    // A cancelled run is not a failed one: it stays as a dead controller leaves it, and the resume carries
    // on. The execution error is what the caller must see; failing to record the settlement is reported
    // beside it, never instead of it.
    if (!ctx.settled && !(error instanceof RunCancelledError)) {
      try { settleUnitRun(ctx, 'execution-failure'); }
      catch (settleError) {
        console.warn(`fgos: could not record the failed settlement of unit run "${ctx.unitRunId}": ${settleError.message}`);
      }
    }
    throw error;
  }
}

/** The unit run marked running on disk, with what every later step of it reads. */
function openUnitRun(ctx) {
  const { options, scope, mainRoot, unit, unitRecord, unitRunId } = ctx;
  if (writesWorktree(unit, unitRecord.sync)) unitRecord.gitWriter ??= gitWriter(path.join(mainRoot, '.fgos'));
  if (options.resumeUnitRunId) assertSyncResumable(unitRunId, unitRecord, mainRoot, scope.custody);
  scope.unitRecord = unitRecord;
  const unitDir = path.join(ctx.assignmentsDir, unitRunId);
  if (options.resumeUnitRunId) {
    const summaryFile = path.join(unitDir, 'unit-summary.json');
    try {
      if (fs.lstatSync(summaryFile).isFile()) fs.unlinkSync(summaryFile);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new RunnerConfigError(`cannot invalidate published summary before resuming "${unitRunId}": ${error.message}`);
      }
    }
  }
  delete unitRecord.settlement;
  unitRecord.execution = { status: 'running' };
  const persist = () => publishMutableProjection(path.join(unitDir, 'unit.json'), unitRecord);
  persist();
  return {
    ...ctx,
    unitDir,
    persist,
    settled: false,
    seatLaunchCeiling: unitRecord.seatLaunchCeiling ?? null,
    askContext: { overrides: unitRecord.overrides || [], workflowId: unitRecord.workflowId, raiseAuthorized: options.raiseAuthorized, blind: unit.blind === true },
  };
}

function settleUnitRun(ctx, outcome) {
  ctx.settled = true;
  ctx.unitRecord.settlement = { outcome, settledAt: new Date().toISOString() };
  ctx.unitRecord.execution = { status: 'settled' };
  ctx.persist();
  publishUnitSummary(ctx.unitDir);
}

/**
 * What the seats of this run share: the ledger of which executors filled which seat (`independentOf` seat
 * ids resolve through it; see seat-ledger.mjs), the seats a resume binds again, and the pools whose login
 * failed in this unit and that a seat then walked away from (no later walk of the unit lands on one).
 *
 * Bindings are recorded in unit.json per seat/round, one entry per attempt, each stamped with the hash of
 * the config it was bound from. A resumed run reuses the last binding of a seat that passed, or whose
 * commit or adopt result is still pending; a seat whose last attempt ended in a failure is bound again
 * from the current config as a new attempt.
 */
function seatStateOf({ options, unitRecord, mainRoot, scope }) {
  const seatLedger = createSeatLedger();
  if (!unitRecord.bindings || typeof unitRecord.bindings !== 'object') unitRecord.bindings = {};
  // Read once, before this resume changes any attempt. A seat with no recorded outcome is adopted, never bound again.
  const rebindKeys = new Set(Object.entries(unitRecord.bindings)
    .filter(([, attempts]) => {
      const last = attempts.at(-1);
      return options.resumeUnitRunId !== undefined && ERROR_OUTCOMES.includes(last?.outcome)
        && !commitPending(last, unitRecord.worktree, mainRoot, scope.custody);
    })
    .map(([key]) => key));
  for (const [key, attempts] of Object.entries(unitRecord.bindings)) {
    // A seat about to be bound again no longer holds the executor of its failed attempt.
    if (rebindKeys.has(key)) continue;
    for (const attempt of attempts) seatLedger.note(attempt.seat, attempt.binding?.executor);
  }
  return { seatLedger, rebindKeys, faultPools: credentialFaultPools(unitRecord) };
}

/**
 * The results the pattern may stand on. A producer round whose commit is still pending is not settled yet:
 * the pattern asks for it again, and the seat commits it without spawning the agent. The same for a round
 * whose controller died before it read the outcome (the resume carries on from that attempt's result), and
 * for a seat about to be bound again on this resume.
 */
function historyOf({ unitRecord, mainRoot, scope, assignmentsDir, unitDir, rebindKeys }) {
  const pending = new Set(Object.entries(unitRecord.bindings ?? {})
    .filter(([, attempts]) => {
      const last = attempts.at(-1);
      return commitPending(last, unitRecord.worktree, mainRoot, scope.custody) || leftByDeadController(last, assignmentsDir);
    })
    .map(([key]) => key));
  return readUnitRunHistory(unitDir).filter((h) => !pending.has(`${h.seat}/${h.round ?? 1}`) && !rebindKeys.has(`${h.seat}/${h.round ?? 1}`));
}

/**
 * The deterministic check a round ends with: the unit's own `verify`, else its capability's. It runs
 * through the one bounded command runner (goal-check.mjs), for at most `runner.timeoutMs`, borrowing the
 * Unit's custody lease so a controller death cannot free the worktree while it still writes.
 */
async function verifyUnit({ unitRecord, scope }, targetUnit) {
  assertNotCancelled();
  const runnerConfig = unitRecord.configSnapshot.runner;
  const verifyCmd = verifyCommandOf(targetUnit, runnerConfig);
  if (!verifyCmd) return { pass: true };
  const outcome = await runCommand(verifyCmd, unitRecord.worktree, runnerConfig.timeoutMs, { custody: scope.custody });
  if (outcome.passed) return { pass: true };
  const how = outcome.timedOut
    ? `timed out after ${runnerConfig.timeoutMs}ms`
    : outcome.status === null ? 'could not run' : `exited ${outcome.status}`;
  const tail = outcome.output.trim().split('\n').slice(-20).join('\n');
  return { pass: false, findings: [`Verification command ${how}: ${verifyCmd}${tail ? `\n${tail}` : ''}`] };
}

async function runCollaboration(ctx) {
  const { unitRecord, unit, unitRunId, scope, mainRoot } = ctx;
  const effective = unitRecord.collaboration?.effective ?? { loop: unitRecord.pattern ?? 'solo', params: {} };
  ctx.persist();
  // A unit with a syncBase merges it before any seat runs. A refusal, or a sync-only unit whose merge
  // needed no worker, ends the run here; a conflicted merge stays open for the producer.
  if (unitRecord.sync) {
    assertNotCancelled();
    const early = runPendingSync(unitRecord, mainRoot, ctx.persist, scope.custody);
    if (early) {
      settleUnitRun(ctx, early.outcome);
      return { unitRunId, outcome: early.outcome, rounds: 0, results: early.results ?? [], findings: [], sync: syncSummary(unitRecord.sync) };
    }
  }
  const patternResult = await runLoop(effective, unit, ctx.runnerConfigForLoop ?? unitRecord.configSnapshot.runner, {
    runRole: (args) => runRole(ctx, args),
    verify: (targetUnit) => verifyUnit(ctx, targetUnit),
    history: () => historyOf(ctx),
    // A pattern that would start another round asks whether `seats` more launches fit under the ceiling.
    hasLaunchRoom: (seats = 1) => {
      const room = ctx.seatLaunchCeiling === null || seatLaunchesUsed(unitRecord) + seats <= ctx.seatLaunchCeiling;
      if (!room) scope.ceilingHit = true;
      return room;
    },
    shippedCheckersByRigor: shippedCatalog().loops?.reviewed?.checkersByRigor,
  });
  settleUnitRun(ctx, patternResult.outcome);
  // A reviewed run with nothing to verify says so: a pass without a verify is not a verified pass.
  const verifyCmd = verifyCommandOf(unit, unitRecord.configSnapshot.runner);
  const unverified = (effective.loop === 'reviewed' && !verifyCmd) || (!loopRunsVerify(effective.loop) && Boolean(verifyCmd));
  return {
    unitRunId,
    outcome: patternResult.outcome,
    rounds: patternResult.rounds,
    results: patternResult.results,
    findings: patternResult.findings || [],
    ...(unitRecord.sync ? { sync: syncSummary(unitRecord.sync) } : {}),
    ...(unverified ? { verify: { ran: false, reason: 'no verify command: set unit.verify, pass --verify, or declare capabilities.<capability>.verify' } } : {}),
  };
}

/** The directory segment and assignment-id tail of a seat's attempt `n` in `round`: `1`, then `1-fb1`, ... */
const attemptSuffix = (round, n) => (n === 0 ? String(round) : `${round}-fb${n}`);
const assignmentIdOf = (ctx, role, n) => `${ctx.unitRunId}/${role.seat.seat}/${attemptSuffix(role.round, n)}`;
const launchedFrom = (bound) => ({ executor: bound.executor, invocation: bound.invocation, transport: bound.transport });
const refusedSeat = (role, refused) => ({ outcome: 'policy-refusal', ...role.tag, round: role.round, refused });

const sessionOf = ({ session: s }) => ({
  provider: s?.provider, tier: s?.tier, hasNativeAgent: s?.hasNativeAgent ?? false, herdrPresent: s?.herdrPresent ?? detectHerdrPresent(), headless: s?.headless ?? true,
});

/** What bind() reads beside the ask; the lease state is read for attempt `n` (the account it already holds ranks first). */
const bindCtxOf = (ctx, role, n) => ({
  runnerConfig: ctx.withAccounts(ctx.unitRecord.configSnapshot.runner),
  session: role.session,
  accounts: { runtimeDir: ctx.options.providerCapacityRuntimeDir, assignmentId: assignmentIdOf(ctx, role, n) },
});

/** The preflight refusal of a writing seat: an open merge this run did not start, or a foreign index. */
function preflightRefusal(role, { foreignMerge, foreignStaged }) {
  if (foreignMerge) {
    return refusedSeat(role, { reason: 'merge-in-progress', detail: `the worktree has a merge in progress (MERGE_HEAD ${foreignMerge}) that this run did not start; finish or abort it (git merge --abort), then run again` });
  }
  return foreignStaged.length > 0 ? refusedSeat(role, { reason: 'foreign-staged-index', detail: foreignIndexDetail(foreignStaged), paths: foreignStaged }) : null;
}

/** A seat of a group arrives at the group's barrier exactly once however it ends, so a seat that throws before it is bound never leaves its siblings waiting. */
async function runRole(ctx, args) {
  const barrier = args.batch;
  let arrived = false;
  const batch = barrier && { ...barrier, arrive() { if (!arrived) { arrived = true; barrier.arrive(); } } };
  try { return await runRoleBody(ctx, { ...args, batch }); } finally { batch?.arrive(); }
}

/**
 * One seat: bind it, then launch it. A provider limit or a dead credential is answered by
 * `answerProviderLimit`: the same executor first runs again on another account of its provider, then the
 * next candidate of the capability's prefer pool runs; each attempt gets a fresh pane/process and the
 * failed one is left exactly as it was. With nothing left the outcome stays provider-limit.
 */
async function runRoleBody(ctx, { seat, unit: seatUnit, round = 1, independentOf = [], preferIndependentOf = [], inputs = [], batch }) {
  assertNotCancelled();
  // A seat id names a directory and a ref segment of this run; only Convention's ids reach a path.
  assertSeatId(seat.seat);
  const request = { seat, unit: seatUnit || ctx.unit, independentOf, preferIndependentOf };
  const role = {
    seat, round, inputs, batch,
    unit: request.unit,
    key: `${seat.seat}/${round}`,
    tag: { seat: seat.seat, role: seat.role, posture: seat.posture },
    readOnly: seat.posture.readOnly,
    session: sessionOf(ctx.options),
    ask: () => askFor(request, ctx.seatLedger, ctx.askContext),
  };
  const { unitRecord, mainRoot, scope } = ctx;
  const recorded = unitRecord.bindings[role.key] ?? [];
  // A resumed seat whose last attempt did not pass is bound again, as the attempt after the last one.
  const rebinding = ctx.rebindKeys.delete(role.key);
  let attemptNo = rebinding ? recorded.length : Math.max(recorded.length - 1, 0);
  let bound = await bindSeat(ctx, role, { recorded, rebinding, attemptNo, independentOf });
  if (bound.refused) return refusedSeat(role, bound.refused);
  role.writeScope = effectiveWriteScope(unitRecord);
  let nativeBaseline = recorded[0]?.nativeBaseline;
  if (!role.readOnly && recorded.length > 0 && !nativeBaseline) {
    return refusedSeat(role, { reason: 'native-baseline-missing', detail: 'this writing attempt has no native pre-producer baseline; start a new Unit run' });
  }
  if (!role.readOnly && commitPending(recorded.at(-1), unitRecord.worktree, mainRoot, scope.custody)) {
    return finishPendingCommit(ctx, role, recorded.at(-1), nativeBaseline);
  }
  // Before a mutating producer is spawned: an index someone else staged refuses the run (the runner stages
  // only what it chose), and files already dirty in scope are recorded so the runner never commits them. A
  // resumed attempt keeps what its first launch saw.
  let preExistingInScope = [];
  if (!role.readOnly) {
    const preflight = preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, custody: scope.custody, writer: unitRecord.gitWriter, scope: role.writeScope, sync: unitRecord.sync });
    const refusal = preflightRefusal(role, preflight);
    if (refusal) return refusal;
    preExistingInScope = recorded[0]?.preExistingInScope ?? preflight.preExistingInScope;
    nativeBaseline = recorded[0]?.nativeBaseline ?? preflight.baseline;
  }

  let lastResult = null;
  for (;;) {
    const attempts = unitRecord.bindings[role.key] ??= [];
    const spent = launchCeilingSpent(ctx, role, { attempts, attemptNo, rebinding, lastResult, bound });
    if (spent) return spent;
    const result = await runAttempt(ctx, role, { attempts, attemptNo, bound, preExistingInScope, nativeBaseline });
    lastResult = result;
    if (result.outcome !== 'provider-limit') return result;
    const leaseConflict = isLeaseConflict(result.runResult);
    const answer = answerProviderLimit({
      result, bound, attempts, attemptNo,
      ...(leaseConflict ? {} : {
        changed: writesSinceLaunch(ctx, attempts[attemptNo].writeBaseline),
        rotation: bound.pool ? inspectAccountRotation({ runnerConfig: ctx.withAccounts(unitRecord.configSnapshot.runner), pool: bound.pool, runtimeDir: ctx.options.providerCapacityRuntimeDir }) : null,
      }),
    });
    if (answer.stop) {
      const { refused, retryStopped, fallbackExhausted } = answer.stop;
      if (refused) return refusedSeat(role, refused);
      if (retryStopped) {
        attempts[attemptNo].retryStopped = retryStopped;
        ctx.persist();
      }
      return { ...result, fallbackExhausted };
    }
    if (answer.rebind) {
      // The account Seat Binding named could not be taken any more: nothing ran. Bound again, in the queue,
      // from a fresh view of the accounts; a rebind, not a step of the walk and not a launch.
      const rebound = await bindInQueue(ctx, role, attemptNo + 1, answer.rebind);
      if (rebound.refused) return refusedSeat(role, rebound.refused);
      bound = rebound;
      attemptNo += 1;
      continue;
    }
    const { rotation, step, faultPool, accountRotations } = answer.walk;
    if (rotation) {
      // The same candidate again: the lease picks the next account of its pool.
      const again = bind(role.ask(), bindCtxOf(ctx, role, attemptNo + 1), { walk: rotation });
      if (!again.refused) {
        bound = again;
        attemptNo += 1;
        continue;
      }
    }
    if (faultPool) ctx.faultPools.add(faultPool);
    const next = await bindInQueue(ctx, role, attemptNo + 1, step);
    if (next.refused) {
      return { ...result, fallbackExhausted: { from: launchedFrom(bound), reason: next.refused.reason, detail: next.refused.detail, ...(accountRotations ? { accountRotations } : {}) } };
    }
    bound = next;
    attemptNo += 1;
  }
}

/**
 * The seat's binding for its next attempt. Ledger read, bind and publish are one queued step: seats
 * started together bind one after the other in the order they were listed, each seeing the executors its
 * earlier siblings were just given. A seat that already ran an earlier round of this unit keeps that
 * round's executor, model and effort; a recorded attempt that is not bound again keeps its binding. A
 * group of seats launches only after every seat of the group is bound.
 */
async function bindSeat(ctx, role, { recorded, rebinding, attemptNo, independentOf }) {
  let bound;
  try {
    bound = await ctx.seatLedger.serialize(() => {
      const kept = keptBindingOf(ctx.unitRecord, role.seat.seat, role.round);
      const first = recorded.length > 0 && !rebinding ? recorded.at(-1).binding : bind(role.ask(), bindCtxOf(ctx, role, attemptNo), kept ? { walk: { continuity: kept } } : {});
      if (!first.refused) {
        ctx.seatLedger.note(role.seat.seat, first.executor);
        ctx.seatLedger.noteDependence(role.seat.seat, independentOf);
      }
      return first;
    });
  } finally {
    role.batch?.arrive();
  }
  await role.batch?.bound;
  return bound;
}

/**
 * A later binding of the seat in the per-unit queue: the independence and the spread are read again now
 * (siblings may have changed executors since this seat first bound, and a hard `independentOf` must hold
 * for the executor it moves to), so two seats whose providers fail at once never both pick from the same
 * stale view of each other. Pools whose login failed in this unit are skipped.
 */
function bindInQueue(ctx, role, attemptNo, walk) {
  return ctx.seatLedger.serialize(() => {
    const kept = keptBindingOf(ctx.unitRecord, role.seat.seat, role.round);
    const next = bind(role.ask(), bindCtxOf(ctx, role, attemptNo), { walk: { ...walk, excludePools: [...ctx.faultPools], ...(kept ? { continuity: kept } : {}) } });
    if (!next.refused) ctx.seatLedger.note(role.seat.seat, next.executor);
    return next;
  });
}

/** The agent already did this round's work and only the runner commit failed: commit again, never spawn the agent a second time. */
function finishPendingCommit(ctx, role, lastRecorded, nativeBaseline) {
  const { unitRecord, mainRoot, scope } = ctx;
  const { writeScope } = role;
  const refusal = lastRecorded.commitOperation?.state === 'pending' ? null : preflightRefusal(role, preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, custody: scope.custody, writer: unitRecord.gitWriter, scope: writeScope, sync: unitRecord.sync }));
  if (refusal) return refusal;
  assertNotCancelled();
  const prior = readUnitRunHistory(ctx.unitDir).find((h) => h.seat === role.seat.seat && (h.round ?? 1) === role.round);
  const gate = recheckWriteConsent(scope.admission, prior?.runResult?.evidence?.changedFiles);
  if (gate) return refusedSeat(role, gate);
  const excludePaths = lastRecorded.preExistingInScope ?? [];
  let commit = commitRound(ctx, role, { baseline: nativeBaseline, runResult: prior?.runResult, excludePaths });
  if (commit.status === 'no-changes') {
    // The agent's in-scope files are gone (cleaned up with the index): that is not a pass. Files a sync
    // merge commit of this round took are not missing.
    const inMerge = commit.sync?.files ?? [];
    const missing = partitionPaths((prior?.runResult?.evidence?.changedFiles ?? [])
      .filter((p) => !excludePaths.includes(p) && !inMerge.includes(p)), writeScope).inScope;
    if (missing.length > 0) {
      commit = { ...commit, status: 'failed', reason: 'work-missing', missing,
        error: `the files this round changed in scope are no longer in the worktree: ${missing.join(', ')}; run the unit again` };
    }
  }
  lastRecorded.commit = commit;
  lastRecorded.outcome = commit.status === 'failed' ? 'execution-failure' : 'pass';
  ctx.persist();
  return { outcome: lastRecorded.outcome, ...role.tag, round: role.round, runResult: prior?.runResult, binding: lastRecorded.binding, commit };
}

/** The worker only writes files; this trusted code, outside the confinement, commits the ones inside the write scope. */
function commitRound(ctx, role, { baseline, runResult, excludePaths }) {
  const { unitRecord, mainRoot, scope } = ctx;
  const attempt = unitRecord.bindings[role.key]?.at(-1);
  const operationId = crypto.randomUUID();
  const commit = commitRoundWithSync(unitRecord, mainRoot, () => commitUnitWork(seatRoundCommitArgs({
    unitRecord, repoRoot: mainRoot, custody: scope.custody, baseline, attempt, persist: ctx.persist, operationId,
    unitId: role.unit.id, objective: role.unit.objective, runResult, scope: role.writeScope, excludePaths,
  })), excludePaths, scope.custody);
  settleCommitOperation(attempt, commit);
  ctx.persist();
  return commit;
}

/**
 * The seat-launch ceiling the admission handed this run: a launch that would pass it does not happen. A
 * seat that already ran keeps what it has (a provider limit stays one, with `fallbackExhausted`); a seat
 * that never ran is refused by name, never reported as `blocked`.
 */
function launchCeilingSpent(ctx, role, { attempts, attemptNo, rebinding, lastResult, bound }) {
  const ceiling = ctx.seatLaunchCeiling;
  if (attempts[attemptNo]?.dispatchRetryId !== undefined || ceiling === null || seatLaunchesUsed(ctx.unitRecord) < ceiling) return null;
  ctx.scope.ceilingHit = true;
  const detail = `the seat-launch ceiling of ${ceiling} for this Unit is spent`;
  if (attemptNo === 0 || (rebinding && lastResult === null)) return refusedSeat(role, { reason: SEAT_LAUNCH_CEILING, detail });
  return {
    ...(lastResult ?? { outcome: 'provider-limit', ...role.tag, round: role.round }),
    fallbackExhausted: { from: launchedFrom(bound), reason: SEAT_LAUNCH_CEILING, detail },
  };
}

/** One launch of the seat on `bound`, recorded in unit.json before and after; returns the settled result. */
async function runAttempt(ctx, role, { attempts, attemptNo, bound, preExistingInScope, nativeBaseline }) {
  const { unitRecord, mainRoot, scope, options, assignmentsDir } = ctx;
  const assignmentId = assignmentIdOf(ctx, role, attemptNo);
  const assignmentDir = path.join(ctx.unitDir, role.seat.seat, attemptSuffix(role.round, attemptNo));
  if (attempts.length <= attemptNo) {
    attempts.push({
      seat: role.seat.seat,
      role: role.seat.role,
      round: role.round,
      assignmentId,
      binding: bound,
      transport: bound.transport,
      invocation: bound.invocation,
      fallbackFrom: bound.provenance?.fallbackFrom ?? null,
      ...(role.readOnly ? {} : { preExistingInScope, nativeBaseline }),
      boundAt: new Date().toISOString(),
      configHash: unitRecord.configSnapshot.hash,
    });
    ctx.persist();
  }
  const attempt = attempts[attemptNo];
  // What the worktree looks like as this writing seat launches, so a provider limit can tell whether the
  // seat changed it (partial-writes.mjs). Taken again at every launch, a resumed one included: what a
  // person kept before resuming is not this launch's work. A read-only seat is sandboxed and records none.
  if (!role.readOnly) {
    try {
      attempt.writeBaseline = worktreeSnapshot({ worktree: unitRecord.worktree, repoRoot: mainRoot });
    } catch (error) {
      attempt.writeBaseline = { error: error.message };
    }
    ctx.persist();
  }
  // A writing seat over a merge left open for it is told which files hold the conflicts.
  const objective = `${role.unit.objective}${role.readOnly ? '' : syncBrief(unitRecord.sync)}`;
  // Recorded before the dispatch: a controller that dies from here on is resumed from this id.
  const admission = admissionIdentityFor(attempt, { unitRunId: ctx.unitRunId, assignmentId, worktree: unitRecord.worktree, assignmentsDir });
  attempt.dispatchRetryId = admission.retryId;
  delete attempt.outcome;
  ctx.persist();
  assertNotCancelled();
  const result = await dispatchBound(ctx, role, { bound, assignmentId, assignmentDir, objective, admission });

  // The receipt is read from a directory the worker can reach. A pass is only a pass when the provider
  // record agrees the lease it names was granted, and when the record holds a lease for this assignment the
  // attempt must show its receipt: nothing is committed on a receipt the provider never gave or one the
  // worker removed or corrupted.
  const receipt = readAttemptJson(assignmentsDir, assignmentId, 'provider-capacity-selection.json')?.leaseReceipt ?? null;
  const receiptDiffers = result.outcome === 'pass' ? auditLeaseReceipt(receipt, { assignmentId, runtimeDir: options.providerCapacityRuntimeDir }) : null;
  if (receiptDiffers) {
    result.outcome = 'policy-refusal';
    result.refused = { reason: 'lease-receipt-mismatch', detail: receiptDiffers };
  }
  // No change is recorded as such, a commit that cannot be made fails the round, and paths changed outside
  // the scope are reported, never committed. A pass whose commit never started is picked up by the resume.
  if (!role.readOnly && result.outcome === 'pass') {
    assertNotCancelled();
    const gate = recheckWriteConsent(scope.admission, result.runResult?.evidence?.changedFiles);
    if (gate) {
      result.outcome = 'policy-refusal';
      result.refused = gate;
    } else {
      const commit = commitRound(ctx, role, { baseline: nativeBaseline, runResult: result.runResult, excludePaths: attempt.preExistingInScope ?? preExistingInScope });
      result.commit = commit;
      attempt.commit = commit;
      if (commit.status === 'failed') result.outcome = 'execution-failure';
    }
  }

  attempt.outcome = result.outcome;
  attempt.runId = result.runResult?.runId ?? null;
  if (result.outcome !== 'pass' && briefNeverReached(readAttemptJson(assignmentsDir, assignmentId, 'receipt.json'))) attempt.briefNotDelivered = true;
  else delete attempt.briefNotDelivered;
  if (receipt && !receiptDiffers) attempt.leaseReceipt = receipt;
  if (result.outcome === 'provider-limit' && result.runResult?.classification?.failure?.cause === 'credential') attempt.failureCause = 'credential';
  if (result.outcome === 'provider-limit' && isLeaseConflict(result.runResult)) attempt.leaseConflict = true;
  ctx.persist();
  dropAssignmentRecord({ assignmentId, runtimeDir: options.providerCapacityRuntimeDir });
  return result;
}

/**
 * What a writing seat changed in the worktree since its launch (partial-writes.mjs): `{ paths, headMoved }`,
 * `{ error }` when that cannot be told, null for a seat that took no baseline (a read-only one).
 */
function writesSinceLaunch(ctx, baseline) {
  if (!baseline) return null;
  try {
    if (baseline.error) throw new Error(`no baseline was taken at launch: ${baseline.error}`);
    return writesSince(baseline, { worktree: ctx.unitRecord.worktree, repoRoot: ctx.mainRoot });
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * What a seat does after an attempt that ended on a provider limit. Pure: it binds, persists and reads
 * nothing; the caller performs the answer.
 *
 * - A lease that could not take the account Seat Binding named (nothing ran): `{ rebind }` from a fresh
 *   view of the accounts, unless the account was pinned or the seat lost its account more than
 *   MAX_LEASE_CONFLICTS times in a row (`{ stop }`).
 * - Otherwise two cases end the seat and leave the decision to a person: a writing seat that already
 *   changed the worktree is never run again on top of its own half-done work (checked first, so a pinned
 *   seat still names what it changed), and a pinned account is never answered with another account or
 *   executor.
 * - Else `{ walk }`: first another account of the same candidate (`rotation`, while a usable account is
 *   left and fewer retries than the pool has accounts were spent, never a loop on one account), then the
 *   next candidate (`step`). `faultPool` is a pool whose login failed, which no later walk of the unit
 *   may land on.
 *
 * @param {object} args
 * @param {object} args.result the attempt's settled result
 * @param {object} args.bound the binding the attempt ran on
 * @param {object[]} args.attempts the seat's recorded attempts of this round, the current one included
 * @param {number} args.attemptNo index of the current attempt
 * @param {{ total: number, healthy: number } | null} [args.rotation] from inspectAccountRotation
 * @param {{ paths: string[], headMoved: boolean } | { error: string } | null} [args.changed] what the seat changed since its launch
 * @returns {{ stop: { refused?: object, fallbackExhausted?: object, retryStopped?: object } }
 *   | { rebind: object } | { walk: { rotation?: object, step: object, faultPool?: string, accountRotations?: number } }}
 */
export function answerProviderLimit({ result, bound, attempts, attemptNo, rotation = null, changed = null }) {
  const from = launchedFrom(bound);
  const pinnedAccount = bound.account ? `${bound.account.pool}/${bound.account.id}` : null;
  if (isLeaseConflict(result.runResult)) {
    if (pinnedAccount) {
      return { stop: { fallbackExhausted: { from, reason: 'account-pinned', detail: `account "${pinnedAccount}" was pinned, but it cannot be leased now; pin another account or wait for this one` } } };
    }
    if (attempts.filter((a) => a.leaseConflict === true).length > MAX_LEASE_CONFLICTS) {
      return { stop: { refused: { reason: 'lease-conflict', detail: `the seat's account could not be leased ${MAX_LEASE_CONFLICTS + 1} times in a row` } } };
    }
    return { rebind: { from: bound, reason: 'lease-conflict', failedAccounts: failedAccountsOf(attempts) } };
  }
  let rotationsSpent = 0;
  for (let at = attemptNo; at > 0 && attempts[at]?.fallbackFrom?.kind === 'account-rotation'; at -= 1) rotationsSpent += 1;
  const accountRotations = rotationsSpent > 0 ? { accountRotations: rotationsSpent } : {};
  const stop = (reason, detail, extra = {}) => ({
    stop: { retryStopped: { reason, ...extra }, fallbackExhausted: { from, reason, detail, ...extra, ...accountRotations } },
  });
  const pinned = pinnedAccount ? { accountPinned: pinnedAccount } : {};
  if (changed?.error !== undefined) {
    return stop('partial-writes', `could not tell whether the seat changed the worktree (${changed.error}), so it is not run again by itself`, { paths: [], ...pinned });
  }
  if (changed && (changed.paths.length > 0 || changed.headMoved)) {
    const what = [changed.paths.join(', '), changed.headMoved ? 'HEAD moved' : ''].filter(Boolean).join('; ');
    return stop('partial-writes', `the seat changed the worktree before its provider limit (${what}); it is not run again on top of that work: keep, finish or undo the changes, then resume`, { paths: changed.paths, headMoved: changed.headMoved, ...pinned });
  }
  if (pinnedAccount) {
    return stop('account-pinned', `account "${pinnedAccount}" was pinned, so the seat is not moved to another account or executor; pin another account or wait for this one`);
  }
  const credentialFault = result.runResult?.classification?.failure?.cause === 'credential';
  return {
    walk: {
      ...(mayRotateAccount(rotation, rotationsSpent)
        ? { rotation: { continuity: bound, from: bound, rotation: true, failedAccounts: failedAccountsOf(attempts), detail: { accountsHealthy: rotation.healthy } } }
        : {}),
      step: { from: bound, tried: triedBindingsOf(attempts, attemptNo + 1) },
      ...(credentialFault && bound.pool ? { faultPool: bound.pool } : {}),
      ...accountRotations,
    },
  };
}

/**
 * The assignment one attempt of a seat dispatches. A unit that runs a Work step operation is that
 * operation's assignment: the seat that does the unit's own work (its posture says it writes) carries the
 * operation's role and stamp, and keeps its own name in provenance.role and its directory.
 */
function unitAssignmentOf(ctx, role, { bound, assignmentId, objective, contextRefs, carriesOperation }) {
  const { unitRecord, unitRunId, declaredOp, unit } = ctx;
  const { seat, round, readOnly } = role;
  return {
    assignmentId,
    unitRunId,
    seat: seat.seat,
    role: carriesOperation ? declaredOp.role : seat.role,
    posture: seat.posture,
    round,
    ...(carriesOperation ? {
      workId: unitRecord.declared.workId,
      ...(unitRecord.declared.title ? { title: unitRecord.declared.title } : {}),
      domain: declaredOp.domain,
      ...(declaredOp.workflow ? { workflow: declaredOp.workflow } : {}),
      stage: declaredOp.stage,
      operation: declaredOp.operation,
      dispatch: declaredOp.dispatch,
      taskSpec: declaredOp.taskSpec,
      skills: declaredOp.skills,
      ...(declaredOp.contractTemplate ? { contractTemplate: declaredOp.contractTemplate } : {}),
      evidence: declaredOp.evidence,
      resultKind: declaredOp.resultKind,
      ...(declaredOp.onAdvance ? { onAdvance: declaredOp.onAdvance } : {}),
    } : {}),
    // The role's own task when the pattern gave it a unit of its own (a reviewer is told to review, not to
    // redo the work); otherwise the unit's objective.
    objective,
    mutation: readOnly ? 'read-only' : 'mutating',
    binding: bound,
    provenance: {
      kind: 'unit-run',
      unitRunId,
      seat: seat.seat,
      role: seat.role,
      posture: seat.posture,
      round,
      binding: bound,
      ...(carriesOperation ? { declared: declaredOp.declared } : {}),
    },
    expectedOutputs: unit.expectedOutputs || [],
    contextRefs,
    writes: effectiveWriteScope(unitRecord),
    // The conflicted files of a merge the runner left open for this writing seat: settlement counts the
    // seat's edits to them as its evidence, though they were dirty at launch.
    ...(!readOnly && unitRecord.sync?.status === 'conflicted' ? { syncConflicts: [...unitRecord.sync.conflicts] } : {}),
    policy: {
      tier: bound.tier,
      preferExecutor: bound.executor,
      preferInvocation: bound.invocation,
      preferPersona: bound.persona,
      // The rigor the unit asked for, so the policy's own rigor reads match what bind tiered on.
      ...(unit.rigor ? { rigor: unit.rigor } : {}),
      // The persona text a caller pinned for this role when it supplied the override: the prompt renders
      // that text, never a file read again at dispatch time.
      ...pinnedPersonaFor(unitRecord, seat.seat, bound.persona),
    },
  };
}

/** What a seat reads: the unit's inputs (already resolved to paths), then the accounts of the seats whose work it judges. */
function contextRefsOf({ unitRecord, unit, mainRoot }, role, assignmentDir) {
  let contextRefs = [...new Set([...unitRecord.resolvedInputs, ...reportRefsOf(role.inputs, { mainRoot })])];
  if (unit.blind) {
    // A blind seat reads only its own directory of the run state, so what lies elsewhere in it reaches the
    // role as a copy there, byte for byte; the copies are what its refs list.
    const inRun = contextRefs.filter((ref) => refIsHiddenFromBlind(ref, mainRoot));
    const entries = [
      ...(unitRecord.inputMap ?? []),
      ...inRun.map((source, i) => ({ name: `${plainInputName((unitRecord.inputMap?.length ?? 0) + i, source, mainRoot)}${path.extname(source)}`, source })),
    ];
    contextRefs = [...contextRefs.filter((ref) => !inRun.includes(ref)), ...copyHandoffsInto(assignmentDir, entries)];
  }
  // What an earlier run's same seat left for this seat: its own previous result, copied into its own
  // directory whether the unit is blind or not.
  if (unit.inputs.some(isSeatInput)) {
    contextRefs = [...contextRefs, ...copyHandoffsInto(assignmentDir, resolveUnitInputs(unit.inputs, mainRoot, { seat: role.seat.seat, accept: unitRecord.acceptedReports ?? [] }).inputMap)];
  }
  return contextRefs;
}

/** One dispatch of an already-bound seat. Returns the settled outcome of that attempt. */
async function dispatchBound(ctx, role, { bound, assignmentId, assignmentDir, objective, admission }) {
  const { unitRecord, mainRoot, scope, options, unit, declaredOp } = ctx;
  const { seat, round, readOnly } = role;
  // A pinned account leases from an inventory holding only that account (account-pin.mjs).
  const runnerConfig = runnerConfigForBinding(ctx.withAccounts(unitRecord.configSnapshot.runner), bound);
  fs.mkdirSync(assignmentDir, { recursive: true });
  const carriesOperation = Boolean(declaredOp && seat.posture.writer);
  const contextRefs = contextRefsOf(ctx, role, assignmentDir);
  const assignment = unitAssignmentOf(ctx, role, { bound, assignmentId, objective, contextRefs, carriesOperation });
  const runResult = await executeAssignment(assignment, {
    cwd: unitRecord.worktree,
    repoRoot: mainRoot,
    custody: readOnly ? null : scope.custody,
    // The case this launch was admitted into, so the worker's environment names it and no other.
    ...(scope.admission ? { caseContext: { caseId: scope.admission.caseId, reservationId: scope.admission.reservationId } } : {}),
    runnerConfig,
    // The admission identity of this dispatch: a resume of an attempt whose outcome was never read finds
    // that attempt again (and its settled result) instead of admitting a new one.
    ...admission,
    // What the write gate replays a mutating seat's binding against: the config this run reads live, never
    // the copy kept in unit.json.
    committedRunnerConfig: ctx.liveConfig(),
    providerCredentialProbe: createCredentialProbe(),
    providerCredentialRenew: createCredentialRenewal(),
    cliOverride: {
      preferExecutor: bound.executor,
      // bind() already chose the invocation that carries bound.transport.
      preferInvocation: bound.invocation,
      tier: bound.tier,
      model: bound.model,
      // The pool that serves `model` and the account Seat Binding named in it: the lease takes exactly that one.
      ...(bound.pool ? { pool: bound.pool } : {}),
      ...(bound.leaseAccount ? { leaseAccount: bound.leaseAccount, accountViewDigest: bound.bindingInput?.accountViewDigest ?? null } : {}),
      // A level bind() accepted from an override; the launch renders it into the CLI's flag.
      ...(bound.reasoningEffort ? { reasoningEffort: bound.reasoningEffort } : {}),
    },
    isReadOnlyMode: readOnly,
    // The run's own time when bind() took one (override or unit); otherwise `runner.timeoutMs`.
    ...(bound.timeoutMs ? { timeoutMs: bound.timeoutMs } : {}),
    session: role.session,
    ...(carriesOperation ? { operations: unitRecord.declared.operations, pinInputs: unitRecord.pinInputs ?? [] } : {}),
    ...(options.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: options.providerCapacityRuntimeDir } : {}),
    // Every role of a blind unit is dispatched blind or refused, never run unblind.
    ...(unit.blind ? { blind: true } : {}),
    // Seats launched together as one group: their panes share the tab in equal parts. A seat alone sends none.
    ...(role.batch?.size > 1 ? { dispatchBatchSize: role.batch.size } : {}),
  });
  // The run result's category becomes the unit's outcome here (unit-run-history.mjs).
  return { outcome: outcomeOfRunResult(runResult), ...role.tag, round, runResult, binding: bound };
}
