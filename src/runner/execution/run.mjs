// src/runner/execution/run.mjs — Single execution door (fgos run) and verifiable mutating gate
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { publishMutableProjection } from '../../native/proof-helpers.mjs';
import { gitWriter, readRepoFacts } from '../../git/inspect.mjs';

import {
  assertCaseAdmissionPort, normalizeCaseRef, briefNeverReached, noBriefDelivered, seatLaunchesUsed, SEAT_LAUNCH_CEILING, unitRunSettle,
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
import { rebindsOnResume, NOT_STARTED_OUTCOME, evaluationsOf, infrastructure, isInfrastructure, outcomeAfterScopeRule } from './outcome.mjs';
import { verifyCommandOf } from './loops/verify.mjs';
import { VERIFY_SEAT } from './seat-resolver.mjs';
import { answerOfVerify, runVerify } from './custody-door.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { buildUnitRunAssignment } from '../dispatch/assignment.mjs';
import { createCredentialProbe } from '../dispatch/provider-credential-probe.mjs';
import { accountInventoryConfigOf, auditLeaseReceipt, dropAssignmentRecord } from '../dispatch/provider-capacity.mjs';
import { LEASE_CONFLICT_FAILURE_CODE, extendedRunResult } from '../dispatch/run-result.mjs';
import { loadRunnerConfigForDir } from '../dispatch/config.mjs';
import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';
import { commitOnBranch, commitUnitWork, foreignIndexDetail, preflightUnitWorktree, recheckWriteConsent, seatRoundCommitArgs, settleCommitOperation } from './commit-unit-work.mjs';
import { assertSyncResumable, commitRoundWithSync, effectiveWriteScope, runPendingSync, syncBrief, syncSummary } from './unit-sync.mjs';
import { recordCustodyHandoff } from '../../run-supervisor/cwd-lock.mjs';
import { reportDigestOf, reportRefsOf, resolveUnitInputs, copyHandoffsInto, refIsHiddenFromBlind, plainInputName, isSeatInput } from './handoff-refs.mjs';
import { outcomeOfRunResult, readUnitRunHistory } from './unit-run-history.mjs';
import { writeUnitSummary } from './unit-summary.mjs';
import { createCredentialRenewal } from '../dispatch/provider-credential-renewal.mjs';
import { adoptRun, sweepAttempts } from '../../run-supervisor/client.mjs';
import { installCancelOnSignal, assertNotCancelled, RunCancelledError } from '../../run-supervisor/cancel-registry.mjs';
import { cancelOnSignalEnabled } from '../../run-supervisor/cancel-opt-in.mjs';
import { readCancelWaitMs } from '../../run-supervisor/gate-kill-grace.mjs';
import { listGenerations } from '../../run-supervisor/run-lock.mjs';
import { currentAttemptOf } from './unit-state.mjs';
import { admitFreshUnit, branchPathsOutsideScope, leftByDeadController, loadResumedUnit, writesWorktree } from './unit-run-start.mjs';

/** A problem the caller should know of, told on the result as a structured warning and on stderr for a person. */
function warnUnit(scope, code, message) {
  scope.warnings.push({ code, message });
  console.warn(`fgos: ${message}`);
}

function publishUnitSummary(unitDir, scope) {
  try { writeUnitSummary(unitDir); }
  catch (error) {
    warnUnit(scope, 'unit-summary-not-written', `could not write derived unit summary for "${path.basename(unitDir)}": ${error.message}`);
  }
}

/** Whether this process runs inside a live herdr session (herdr exports HERDR_ENV=1 and its socket path into every pane). */
export function detectHerdrPresent(env = process.env) {
  if (env.HERDR_ENV !== '1') return false;
  const socket = env.HERDR_SOCKET_PATH;
  return typeof socket === 'string' && socket !== '' && fs.existsSync(socket);
}

/** The main checkout root and the worktree path of `cwd`, read through Git Inspect. */
export function resolveGitRoots(cwd = process.cwd(), { allowNoRepository = false } = {}) {
  try {
    const result = readRepoFacts(cwd);
    // A read-only caller may work in a directory that is no repository: that directory is its own project root.
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

/** The runner config a unit run records, and the hash of what seat choice and the run read from it. */
export function snapshotRunnerConfig(mainCheckoutRoot, runnerConfig) {
  const cfg = runnerConfig ?? loadRunnerConfigForDir(mainCheckoutRoot);
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
  const hash = crypto.createHash('sha256').update(JSON.stringify(filtered)).digest('hex');
  // The account inventory (where logins are kept) is read live at every bind and launch, never recorded.
  const { llmAccounts, providers, ...runner } = cfg;
  return { hash, runner };
}

/** The account inventory, read from the config on every call (never a copy kept for the run) or from the caller's config. */
export function readAccountInventory(mainRoot, suppliedConfig) {
  return accountInventoryConfigOf(suppliedConfig ?? loadRunnerConfigForDir(mainRoot));
}

/**
 * A producer attempt whose agent turn passed but whose runner commit failed, which a resume commits again
 * without the agent; not when that commit is still on the branch with paths outside the scope.
 */
function commitPending(attempt, worktree, mainRoot, custody) {
  const commit = attempt?.commit;
  if (attempt?.commitOperation?.state === 'pending') return true;
  if (commit?.status !== 'failed') return false;
  return !(commit.reason === 'committed-set-mismatch' && commit.sha && commitOnBranch(worktree, commit.sha, mainRoot, custody));
}

/**
 * How one dispatch of `attempt` enters the admission ledger: a dispatch admitted earlier whose outcome was
 * never read keeps its retry id (and takes its settled result); any other, or an abandoned or cancelled
 * one, gets a new id naming the attempt it follows.
 */
function admissionIdentityFor(attempt, { unitRunId, assignmentId, worktree, assignmentsDir }) {
  const current = currentAttemptOf(assignmentsDir, assignmentId);
  const abandoned = () => {
    if (!current) return false;
    // A pre-supervisor run an earlier release settled as abandoned, one never started, or one cancelled: no result to carry on from.
    try {
      if (JSON.parse(fs.readFileSync(path.join(current.dir, 'run.json'), 'utf8')).settlement === 'abandoned-legacy') return true;
    } catch { /* no status record: judged by its envelope below */ }
    if (!fs.existsSync(path.join(current.dir, 'envelope.json'))) return false;
    if (adoptRun(current.dir, { probeOnly: true }).state !== 'closed') return false;
    try {
      const outcome = String(JSON.parse(fs.readFileSync(path.join(current.dir, 'receipt.json'), 'utf8')).outcome);
      return outcome.startsWith('abandoned') || outcome === 'cancelled';
    } catch { return false; }
  };
  // The ledger, not the directory, says whether the previous dispatch was admitted.
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
 * Run one unit headless: the one execution door.
 *
 * @param {object} options `unitPath` (file or '-') or `unitData`; `pattern`; `overrides` ([{ scope, origin,
 *   executor, invocation, tier, persona, reasoningEffort, account, timeoutMs }]); `raiseAuthorized` (no door is
 *   authorized yet); `workflowId`; `resumeUnitRunId`; `repoRoot`, `cwd`, `worktree`; `personaScope`
 *   ({ workflowDir, owningDomain }: where the persona lookup starts); `session` ({ provider, tier,
 *   hasNativeAgent, herdrPresent, headless }); `declared` (the Work step operation, stored in unit.json);
 *   `pinInputs` (paths hashed at launch); `runnerConfig` (snapshotted instead of `.fgos/config.json`); `onLog`
 * @returns {Promise<{unitRunId: string, outcome: string, rounds: number, results: Array}>}
 */
export async function runUnit(options = {}) {
  assertNotCancelled();
  // `admission` is what the case admission port answered for this run; `settled` says it was handed back.
  // `settled` and `warnings` are the arrays and flags the result carries: what settles after it is built (the case reservation) reaches the caller too.
  const scope = { control: null, custody: null, handedOff: false, admission: null, unitRecord: null, warnings: [], settled: { unit: false, case: null } };
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
      try { if (scope.handedOff) noteCustodyHandoff(scope); }
      finally { scope.custody?.release(); }
    } finally {
      try { scope.control?.release(); } catch { /* a seat that cannot be released is taken over as a dead holder */ }
      // After custody is released: the worktree is quiet, so the port may release the binding it took for this run.
      settleAdmission(scope, result, failure);
      uninstall();
    }
  }
}

/** Hands the worktree's custody domain back; a failure to record that is a warning on the result, not an error. */
function noteCustodyHandoff(scope) {
  const handoff = {};
  recordCustodyHandoff(scope.custody, handoff);
  for (const { code, detail } of handoff.warnings ?? []) scope.warnings.push({ code, message: detail });
}

/**
 * Hand the reservation back, once, with the Unit shape of the result (the run that failed with no result as
 * `execution-failure`, or `not-started` when no unit directory existed). A cancelled run is not settled: it stays
 * live, and the resume carries on. A settle that fails is told on the result and as a warning, never thrown.
 */
function settleAdmission(scope, result, failure) {
  const admission = scope.admission;
  if (!admission || admission.settled) return;
  if (failure instanceof RunCancelledError) return;
  admission.settled = true;
  const unit = result ?? failedUnitFacts(scope, admission);
  try {
    admission.port.settle(admission.reservationId, unitRunSettle(admission, unit));
    scope.settled.case = true;
  } catch (error) {
    scope.settled.case = false;
    scope.settled.settleError = error.message;
    warnUnit(scope, 'case-settle-failed', `could not settle reservation "${admission.reservationId}" of case "${admission.caseId}": ${error.message}`);
  }
}

/** The facts of a Unit run that ended in an error before it produced a result: nothing was judged, nothing is known to have been written. */
function failedUnitFacts(scope, admission) {
  const { unitRecord } = scope;
  return {
    outcome: admission.started ? 'execution-failure' : NOT_STARTED_OUTCOME,
    infrastructure: true,
    outOfScope: [],
    outOfScopeOnBranch: [],
    evaluations: [],
    started: { value: admission.started, reason: admission.started ? null : 'failed-before-start' },
    launches: launchesOf(scope, unitRecord),
    results: [],
  };
}

/** Seat launches (never retries) against the ceiling the case admission gave this run. */
const launchesOf = (scope, unitRecord) => ({
  ceiling: unitRecord?.seatLaunchCeiling ?? null,
  used: unitRecord ? seatLaunchesUsed(unitRecord) : 0,
  ceilingHit: scope.ceilingHit === true,
});

// A process that asked for it (`enableCancelOnSignal`) has Ctrl-C and SIGTERM cancel every attempt it delivered;
// one handler serves all its units, installed with the first and removed with the last.
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
/** How many times a seat whose brief never reached its agent is launched again on the same candidate. */
const MAX_BRIEF_RETRIES = 1;

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
  // Private homes of earlier runs whose pane has closed hold a login copy: the one run door reclaims them,
  // best effort, even outside a git checkout.
  const cwd = options.cwd ?? process.cwd();
  let roots = null;
  let rootsFailure = null;
  try { roots = resolveGitRoots(cwd, { allowNoRepository: true }); } catch (err) { rootsFailure = err; }
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots?.mainCheckoutRoot;
  try { sweepAttempts({ assignmentsRoot: mainRoot ? path.join(mainRoot, '.fgos', 'assignments') : undefined }); } catch { /* best effort */ }
  if (rootsFailure) throw rootsFailure;

  // The config this run reads live, at first use: the account inventory always comes from it, never from unit.json.
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
    // A cancelled run is not a failed one. A settlement that cannot be recorded is reported beside the error, never instead.
    if (!ctx.settled && !(error instanceof RunCancelledError)) {
      try { settleUnitRun(ctx, { outcome: 'execution-failure', infrastructure: true, infrastructureReason: 'run-error', refused: [] }); }
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
      if (error.code !== 'ENOENT') throw new RunnerConfigError(`cannot invalidate published summary before resuming "${unitRunId}": ${error.message}`);
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

/** The record keeps the facts finishUnit computed, so the unit summary copies them and never derives them again. */
function settleUnitRun(ctx, { outcome, infrastructure, infrastructureReason, refused }) {
  ctx.settled = true;
  ctx.unitRecord.settlement = { outcome, infrastructure, infrastructureReason, refused, settledAt: new Date().toISOString() };
  ctx.unitRecord.execution = { status: 'settled' };
  ctx.persist();
  ctx.scope.settled.unit = true;
  publishUnitSummary(ctx.unitDir, ctx.scope);
}

/**
 * The paths this Unit wrote outside its declared writes, and the outcome that follows (the rule "writing outside
 * the scope is not a pass"): what its commits reported (this run's or an earlier one a resume stands on), what its
 * branch carries since its base, and what the base Unit's branch already carried. A check that cannot run is an
 * infrastructure failure of the unit, never a throw out of the run.
 *
 * @returns {{ outcome: string, error: string|null, outOfScope: string[], outOfScopeOnBranch: string[] }}
 */
function applyScopeRule({ unitRecord, mainRoot }, { outcome, results }) {
  const inherited = unitRecord.branchBase?.outOfScopeOnBranch ?? [];
  const reported = [
    ...results.flatMap((result) => result?.commit?.outOfScope ?? []),
    ...Object.values(unitRecord.bindings ?? {}).flat().flatMap((attempt) => attempt.commit?.outOfScope ?? []),
  ];
  let onBranch = [];
  let error = null;
  if (unitRecord.unit.writes.length > 0) {
    try { onBranch = branchPathsOutsideScope(unitRecord, mainRoot); }
    catch (err) { error = `could not check the writes of the unit: ${err.message}`; }
  }
  const sorted = (paths) => [...new Set(paths)].sort();
  const outOfScope = sorted([...reported, ...onBranch, ...inherited]);
  const ruled = outcomeAfterScopeRule(outcome, outOfScope);
  return {
    outcome: error && ruled === 'pass' ? 'execution-failure' : ruled,
    error,
    outOfScope,
    outOfScopeOnBranch: sorted([...onBranch, ...inherited]),
  };
}

/**
 * What a seat's session left: `transcriptPath` is the absolute path of the transcript Execution kept in the attempt's
 * run directory, null when none was kept (the CLI wrote no session, or the seat has no credential store of its own).
 * Turns and tool uses have no source yet and read as null.
 */
export function activityOf({ unitRecord, assignmentsDir }, result) {
  const assignmentId = unitRecord.bindings?.[`${result.seat}/${result.round ?? 1}`]?.at(-1)?.assignmentId;
  const dir = assignmentId ? currentAttemptOf(assignmentsDir, assignmentId)?.dir : null;
  let kept = null;
  try { kept = JSON.parse(fs.readFileSync(path.join(dir, 'steps', 'finalize-home.json'), 'utf8')).detail?.transcriptPath ?? null; } catch { /* no step record: nothing was kept */ }
  return { turns: null, toolUses: null, transcriptPath: kept ? path.join(dir, kept) : null };
}

/** The wall time of the seat's last attempt as Execution recorded it; null for an attempt that never ran and for a record written before it was kept. */
function durationOf({ unitRecord }, result) {
  const duration = unitRecord.bindings?.[`${result.seat}/${result.round ?? 1}`]?.at(-1)?.durationMs;
  return Number.isInteger(duration) && duration >= 0 ? duration : null;
}

/**
 * What an attempt hands up of its work: the report it left (digest read by Execution), its claim, and whether the
 * report is complete, which only Dispatch settlement declares. An attempt settled before the declaration existed
 * has none, and reads as not known (no `output`).
 */
function outputOf({ mainRoot }, result) {
  const declaration = result?.runResult?.reportDeclaration;
  if (!declaration) return null;
  return { report: reportDigestOf(result, mainRoot), claim: result.runResult.agentClaim ?? null, complete: declaration.complete, incompleteReason: declaration.incompleteReason };
}

/**
 * Why a unit that ended on infrastructure did: the first reason that applies, from the run's own facts. The
 * vocabulary is named in the unit-run-result contract (section 3).
 */
function infrastructureReasonOf({ started, ruled, attempts }) {
  if (!started.value) return 'not-started';
  if (ruled.error) return 'scope-check-failed';
  const failed = attempts.find((attempt) => isInfrastructure(attempt.outcome));
  if (!failed) return 'execution-failure';
  if (failed.seat === VERIFY_SEAT && failed.infrastructureReason) return `verify-${failed.infrastructureReason}`;
  if (failed.commit?.status === 'failed') return `commit-failed:${failed.commit.reason ?? 'unknown'}`;
  return failed.runResult?.classification?.outcome?.reason ?? 'execution-failure';
}

/** The seats a policy decision refused, from the results that carry `refused`; they have no run directory to read later. */
const refusedSeatsOf = (attempts) => attempts.filter((attempt) => attempt.refused)
  .map(({ seat, round, refused }) => ({ seat, round, reason: refused.reason, detail: refused.detail ?? '' }));

/**
 * The one place the end of a Unit run becomes its record and its result: the scope rule and the verify round are
 * applied before the unit record settles, so the record, the case reservation and the caller read one outcome. A run
 * none of whose seats was given its brief did no work and ends `not-started`. Every fact is computed here, once; a
 * reader never derives it again.
 */
function finishUnit(ctx, { outcome, rounds, results = [], findings = [], ...rest }) {
  const { unitRecord, unitRunId, scope } = ctx;
  const ruled = applyScopeRule(ctx, { outcome, results });
  const started = ruled.outcome !== 'pass' && noBriefDelivered(unitRecord)
    ? { value: false, reason: 'brief-not-delivered' }
    : { value: true, reason: null };
  const attempts = results.map((result) => {
    const output = outputOf(ctx, result);
    return {
      ...result,
      infrastructure: isInfrastructure(result?.outcome),
      ...(result?.runResult ? { runResult: extendedRunResult(result.runResult, { activity: activityOf(ctx, result), durationMs: durationOf(ctx, result) }) } : {}),
      ...(output ? { output } : {}),
    };
  });
  const final = started.value ? ruled.outcome : NOT_STARTED_OUTCOME;
  const unitInfrastructure = infrastructure({ outcome: final, outOfScope: ruled.outOfScope, results: attempts });
  settleUnitRun(ctx, {
    outcome: ruled.outcome,
    infrastructure: unitInfrastructure,
    infrastructureReason: unitInfrastructure ? infrastructureReasonOf({ started, ruled, attempts }) : null,
    refused: refusedSeatsOf(attempts),
  });
  return {
    unitRunId, outcome: final, rounds, results: attempts, findings,
    ...(ruled.error ? { error: ruled.error } : {}),
    infrastructure: unitInfrastructure,
    outOfScope: ruled.outOfScope,
    outOfScopeOnBranch: ruled.outOfScopeOnBranch,
    evaluations: evaluationsOf(attempts),
    started,
    launches: launchesOf(scope, unitRecord),
    settled: scope.settled,
    warnings: scope.warnings,
    ...rest,
  };
}

/**
 * What the seats of this run share: the ledger of which executors filled which seat, the seats a resume
 * binds again (a seat whose last attempt failed, unless its commit is pending), and the pools whose login
 * failed in this unit (no later walk lands on one).
 */
function seatStateOf({ options, unitRecord, mainRoot, scope }) {
  const seatLedger = createSeatLedger();
  if (!unitRecord.bindings || typeof unitRecord.bindings !== 'object') unitRecord.bindings = {};
  // Read once, before this resume changes any attempt.
  const rebindKeys = new Set(Object.entries(unitRecord.bindings)
    .filter(([, attempts]) => {
      const last = attempts.at(-1);
      return options.resumeUnitRunId !== undefined && rebindsOnResume(last?.outcome)
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
 * The results the pattern may stand on: not a round whose commit is pending, whose controller died before
 * reading its outcome, or whose seat is about to be bound again (the pattern asks for those again).
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
 * The deterministic check a round ends with (the unit's `verify`, else its capability's): bounded by
 * `runner.timeoutMs`, holding the Unit's custody so the worktree is not freed while it writes.
 */
async function verifyUnit({ unitRecord, scope }, targetUnit) {
  assertNotCancelled();
  const runnerConfig = unitRecord.configSnapshot.runner;
  const verifyCmd = verifyCommandOf(targetUnit, runnerConfig);
  if (!verifyCmd) return { pass: true };
  const verified = await runVerify({ command: verifyCmd, cwd: unitRecord.worktree, timeoutMs: runnerConfig.timeoutMs, custody: scope.custody });
  return answerOfVerify(verified, 'Verification command', verifyCmd);
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
      return finishUnit(ctx, { outcome: early.outcome, rounds: 0, results: early.results, sync: syncSummary(unitRecord.sync) });
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
  // A reviewed run with nothing to verify says so: a pass without a verify is not a verified pass.
  const verifyCmd = verifyCommandOf(unit, unitRecord.configSnapshot.runner);
  const unverified = (effective.loop === 'reviewed' && !verifyCmd) || (!loopRunsVerify(effective.loop) && Boolean(verifyCmd));
  return finishUnit(ctx, {
    outcome: patternResult.outcome, rounds: patternResult.rounds, results: patternResult.results, findings: patternResult.findings,
    ...(unitRecord.sync ? { sync: syncSummary(unitRecord.sync) } : {}),
    ...(unverified ? { verify: { ran: false, reason: 'no verify command: set unit.verify, pass --verify, or declare capabilities.<capability>.verify' } } : {}),
  });
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
 * One seat: bind it, then launch it; a provider limit or a dead credential is answered by `answerProviderLimit`,
 * each attempt on a fresh pane or process, the failed one left as it was.
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
  // Before a mutating producer is spawned: a foreign staged index refuses it, and files already dirty in scope
  // are recorded so the runner never commits them (a resumed attempt keeps what its first launch saw).
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
    const briefNotDelivered = result.outcome !== 'provider-limit' && result.outcome !== 'pass' && attempts[attemptNo].briefNotDelivered === true;
    if (result.outcome !== 'provider-limit' && !briefNotDelivered) return result;
    const leaseConflict = isLeaseConflict(result.runResult);
    const answer = answerProviderLimit({
      result, bound, attempts, attemptNo, briefNotDelivered,
      ...(leaseConflict ? {} : {
        changed: writesSinceLaunch(ctx, attempts[attemptNo].writeBaseline),
        rotation: bound.pool && !briefNotDelivered ? inspectAccountRotation({ runnerConfig: ctx.withAccounts(unitRecord.configSnapshot.runner), pool: bound.pool, runtimeDir: ctx.options.providerCapacityRuntimeDir }) : null,
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
 * The seat's first binding, as one queued step (seats started together bind in listed order, each seeing its
 * earlier siblings); an earlier round's executor, model and effort are kept, a recorded attempt keeps its
 * binding, and a group launches only once all its seats are bound.
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
 * A later binding of the seat in the per-unit queue, with independence and spread read again now (siblings
 * may have moved); pools whose login failed in this unit are skipped.
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
    // In-scope files the agent changed that are gone (not taken by this round's sync merge) are not a pass.
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
 * A launch past the admission's seat-launch ceiling does not happen: a seat that ran keeps its result (with
 * `fallbackExhausted`), one that never ran is refused by name.
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
      seat: role.seat.seat, role: role.seat.role, round: role.round, assignmentId,
      binding: bound, transport: bound.transport, invocation: bound.invocation, fallbackFrom: bound.provenance?.fallbackFrom ?? null,
      ...(role.readOnly ? {} : { preExistingInScope, nativeBaseline }),
      boundAt: new Date().toISOString(), configHash: unitRecord.configSnapshot.hash,
    });
    ctx.persist();
  }
  const attempt = attempts[attemptNo];
  // The worktree as this writing seat launches (every launch, a resumed one too), so a provider limit can
  // tell whether the seat changed it.
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
  // The attempt's wall time: Execution's own span from handing the seat to Dispatch to getting its settled result back.
  const dispatchedAt = performance.now();
  const result = await dispatchBound(ctx, role, { bound, assignmentId, assignmentDir, objective, admission });
  attempt.durationMs = Math.max(0, Math.round(performance.now() - dispatchedAt));

  // The receipt lies where the worker can reach it: a pass stands only when the provider record agrees the
  // lease it names was granted, and a lease the record holds must show its receipt.
  const receipt = readAttemptJson(assignmentsDir, assignmentId, 'provider-capacity-selection.json')?.leaseReceipt ?? null;
  const receiptDiffers = result.outcome === 'pass' ? auditLeaseReceipt(receipt, { assignmentId, runtimeDir: options.providerCapacityRuntimeDir }) : null;
  if (receiptDiffers) {
    result.outcome = 'policy-refusal';
    result.refused = { reason: 'lease-receipt-mismatch', detail: receiptDiffers };
  }
  // A commit that cannot be made fails the round; paths changed outside the scope are reported, never committed.
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

/** What a writing seat changed since its launch: `{ paths, headMoved }`, `{ error }`, or null with no baseline. */
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
 * What a seat does after an attempt that ended on a provider limit, or whose brief surely never reached its
 * agent (`briefNotDelivered`). Pure: the caller performs the answer.
 * - A lease that could not take the named account (nothing ran): `{ rebind }` from a fresh account view,
 *   unless the account was pinned or lost more than MAX_LEASE_CONFLICTS times in a row (`{ stop }`).
 * - A writing seat that changed the worktree (`changed`) is never run again on top of that work.
 * - A lost brief: `{ rebind }` on the same candidate, at most MAX_BRIEF_RETRIES times per round.
 * - A pinned account is never answered with another account or executor.
 * - Else `{ walk }`: another account of the same candidate first (`rotation`, never a loop on one account),
 *   then the next candidate (`step`); `faultPool` names a pool whose login failed.
 * `attempts` are the seat's attempts of this round, `rotation` comes from inspectAccountRotation.
 * @returns {{ stop: { refused?: object, fallbackExhausted?: object, retryStopped?: object } }
 *   | { rebind: object } | { walk: { rotation?: object, step: object, faultPool?: string, accountRotations?: number } }}
 */
export function answerProviderLimit({ result, bound, attempts, attemptNo, briefNotDelivered = false, rotation = null, changed = null }) {
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
  if (briefNotDelivered && attempts.filter((a) => a.briefNotDelivered === true).length > MAX_BRIEF_RETRIES) {
    return { stop: { fallbackExhausted: { from, reason: 'brief-not-delivered', detail: `the agent never received its brief in ${MAX_BRIEF_RETRIES + 1} launches in a row` } } };
  }
  const pinned = pinnedAccount ? { accountPinned: pinnedAccount } : {};
  const ending = briefNotDelivered ? 'its brief was lost' : 'its provider limit';
  if (changed?.error !== undefined) {
    return stop('partial-writes', `could not tell whether the seat changed the worktree (${changed.error}), so it is not run again by itself`, { paths: [], ...pinned });
  }
  if (changed && (changed.paths.length > 0 || changed.headMoved)) {
    const what = [changed.paths.join(', '), changed.headMoved ? 'HEAD moved' : ''].filter(Boolean).join('; ');
    return stop('partial-writes', `the seat changed the worktree before ${ending} (${what}); it is not run again on top of that work: keep, finish or undo the changes, then resume`, { paths: changed.paths, headMoved: changed.headMoved, ...pinned });
  }
  if (briefNotDelivered) return { rebind: { continuity: bound, from: bound, reason: 'brief-not-delivered' } };
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
  const assignment = buildUnitRunAssignment(ctx, role, { bound, assignmentId, objective, contextRefs, carriesOperation, writes: effectiveWriteScope(unitRecord) });
  const runResult = await executeAssignment(assignment, {
    cwd: unitRecord.worktree, repoRoot: mainRoot, custody: readOnly ? null : scope.custody,
    // The case this launch was admitted into, so the worker's environment names it and no other.
    ...(scope.admission ? { caseContext: { caseId: scope.admission.caseId, reservationId: scope.admission.reservationId } } : {}),
    runnerConfig,
    ...admission,
    // The write gate replays a mutating seat's binding against the config read live, never unit.json's copy.
    committedRunnerConfig: ctx.liveConfig(),
    providerCredentialProbe: createCredentialProbe(),
    providerCredentialRenew: createCredentialRenewal(),
    // Seat Binding's own answer: Dispatch executes it and records its provenance as bound.
    binding: bound,
    isReadOnlyMode: readOnly,
    ...(bound.timeoutMs ? { timeoutMs: bound.timeoutMs } : {}),
    session: role.session,
    ...(carriesOperation ? { operations: unitRecord.declared.operations, pinInputs: unitRecord.pinInputs ?? [] } : {}),
    ...(options.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: options.providerCapacityRuntimeDir } : {}),
    // Every role of a blind unit is dispatched blind or refused, never run unblind.
    ...(unit.blind ? { blind: true } : {}),
    // Seats launched together as one group: their panes share the tab in equal parts. A seat alone sends none.
    ...(role.batch?.size > 1 ? { dispatchBatchSize: role.batch.size } : {}),
  });
  return { outcome: outcomeOfRunResult(runResult), ...role.tag, round, runResult, binding: bound };
}
