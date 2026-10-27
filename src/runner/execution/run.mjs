// src/runner/execution/run.mjs — Single execution door (fgos run) and verifiable mutating gate
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { uniqueTmpTag } from '../../util/unique-tmp-tag.mjs';
import { createGitInspect, gitWriter } from '../../git/inspect.mjs';

import { validateUnit, normalizeWorkflowLink } from './unit.mjs';
import {
  assertCaseAdmissionPort, CaseAdmissionRefusedError, normalizeCaseRef, seatLaunchesOf, seatLaunchesUsed,
  PORT_MISSING, SEAT_LAUNCH_CEILING,
} from './case-admission-port.mjs';
import { expandGenerated, partitionPaths } from '../dispatch/write-scope.mjs';
import { bind } from './bind.mjs';
import { credentialFaultPools, failedAccountsOf, inspectAccountRotation, keptBindingOf, mayRotateAccount, triedBindingsOf } from './account-rotation.mjs';
import { assertPinnedAccountsUsable, runnerConfigForBinding } from './account-pin.mjs';
import { simulateUnitBindings } from './dry-bind.mjs';
import { worktreeSnapshot, writesSince } from './partial-writes.mjs';
import { createSeatLedger } from './seat-ledger.mjs';
import { resolveSeats, assertNoSeatTier, effectiveRigorOf, workflowTierOf, SeatResolutionError } from './seat-resolver.mjs';
import { isSeatRecord } from './legacy-seat-read.mjs';
import { assertSeatId } from '../../convention/seat-id.mjs';
import { runLoop, loopRunsVerify } from './loops/index.mjs';
import { resolveCollaboration, CollaborationError } from './patterns/catalog.mjs';
import { shippedCatalog, catalogLayersOf } from '../dispatch/shipped-catalog.mjs';
import { canonicalJson } from '../../native/door.mjs';
import { ERROR_OUTCOMES, verifyCommandOf } from './loops/reviewed.mjs';
import { runCommand } from '../goal-check.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { resolveMutatingCwdPosture } from '../dispatch/execution-contract.mjs';
import { declaredOperationFields } from '../dispatch/assignment.mjs';
import { createCredentialProbe } from '../dispatch/provider-credential-probe.mjs';
import { accountInventoryConfigOf, auditLeaseReceipt } from '../dispatch/provider-capacity.mjs';
import { LEASE_CONFLICT_FAILURE_CODE } from '../dispatch/run-result.mjs';
import { loadRunnerConfigForDir, RunnerConfigError, assertRunTimeoutMs } from '../dispatch/config.mjs';
import { commitOnBranch, commitUnitWork, foreignIndexDetail, preflightUnitWorktree } from './commit-unit-work.mjs';
import { assertSyncResumable, commitRoundWithSync, effectiveWriteScope, runPendingSync, seedSync, syncBrief, syncSummary } from './unit-sync.mjs';
import { AgentNotFoundError, resolveAgentDefinition } from '../agent-definitions.mjs';
import { parseYaml } from '../../util/yaml.mjs';
import { dispatchCwdHolder, dispatchInFlightError, admitSuccessor, recordCustodyHandoff } from '../dispatch/cwd-lock.mjs';
import { reportRefsOf, resolveUnitInputs, copyHandoffsInto, refIsHiddenFromBlind, plainInputName, isSeatInput } from './handoff-refs.mjs';
import { outcomeOfRunResult, readUnitRunHistory } from './unit-run-history.mjs';
import { writeUnitSummary } from './unit-summary.mjs';
import { createConfinementCredentialRenewal } from '../dispatch/confinement/cleanup.mjs';
import { sweepAttempts } from '../../run-supervisor/sweep.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { installCancelOnSignal, assertNotCancelled, RunCancelledError } from '../../run-supervisor/cancel-registry.mjs';
import { cancelOnSignalEnabled } from '../../run-supervisor/cancel-opt-in.mjs';
import { readCancelWaitMs } from '../../run-supervisor/gate-kill-grace.mjs';
import { listGenerations } from '../dispatch/run-lock.mjs';
import { acquireUnitControl } from './unit-control.mjs';
import { currentAttemptOf, lastAttempts } from './unit-state.mjs';
import { createLockScope, resolveStateRoot } from '../../holder-lock/index.mjs';
import { defaultConfinementTempRoots } from '../dispatch/confinement/backend-registry.mjs';

/** Write `file` atomically so a reader never sees half a record. */
function writeJsonAtomic(file, value) {
  const tmp = `${file}.${uniqueTmpTag()}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, file);
  } catch (error) {
    // Removing the partial temp file is best effort; the write error is the one to report.
    try { fs.rmSync(tmp, { force: true }); } catch { /* keep the write error */ }
    throw error;
  }
}

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
 * The text of a unit's persona, read once from the persona tiers so every attempt and resume
 * renders the same definition, including one that lives only in the workspace tier. A name no tier
 * defines keeps today's rendering by name; the one-liner already refuses it before the run. A definition
 * that exists but cannot be parsed or has the wrong shape throws its named problem.
 */
function unitPersonaPin(persona, mainRoot, workflow) {
  if (typeof persona !== 'string') return null;
  try {
    const { name, digest, text, identity } = resolveAgentDefinition(persona, { projectRoot: mainRoot, workflow });
    return { name, digest, text, identity };
  } catch (err) {
    if (err instanceof AgentNotFoundError) return null;
    throw err;
  }
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

/** A resume cannot go past a commit that landed holding paths outside the unit's write scope. */
function assertNoStrayCommit(unitRunId, unitRecord, mainRoot) {
  for (const attempt of lastAttempts(unitRecord)) {
    const commit = attempt.commit;
    if (commit?.status !== 'failed' || commit.reason !== 'committed-set-mismatch' || !commit.sha) continue;
    if (!commitOnBranch(unitRecord.worktree, commit.sha, mainRoot)) continue;
    const diff = [
      ...(commit.unexpected ?? []).map((p) => `+${p}`),
      ...(commit.missing ?? []).map((p) => `-${p}`),
    ].join(', ');
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": commit ${commit.sha} is already on the branch but does not hold exactly the files of its write scope (${diff}; + is outside the scope, - is missing); inspect it and take it off the branch by hand (git reset HEAD~1 keeps its files in the worktree), then resume`);
  }
}

/**
 * An attempt of the supervisor era whose outcome the controller never recorded: it was handed to a
 * supervisor and the controller went away before reading the answer.
 */
function leftByDeadController(attempt, assignmentsDir) {
  if (!attempt || attempt.outcome !== undefined || typeof attempt.assignmentId !== 'string') return false;
  const prior = currentAttemptOf(assignmentsDir, attempt.assignmentId);
  return prior !== null && fs.existsSync(path.join(prior.dir, 'envelope.json'));
}

/** The newest `seatSchema` of a unit record this release can resume. It writes schema 1, so a record
 * that carries a later one came from a newer release: resuming it here would run it under rules this
 * release does not know. Read-only inspection of the record is unaffected. */
const KNOWN_SEAT_SCHEMA = 1;

function assertRecordNotFromNewerRelease(unitRunId, unitRecord) {
  const schema = unitRecord?.seatSchema;
  if (schema === undefined || schema === null) return;
  if (typeof schema === 'number' && schema <= KNOWN_SEAT_SCHEMA) return;
  throw new RunnerConfigError(
    `cannot resume unit run "${unitRunId}": unit.json field seatSchema is ${JSON.stringify(schema)}, written by a newer release than this one; resume it with that release`,
    { code: 'record-from-newer-release' },
  );
}

/**
 * A resume never starts a second agent over an attempt the previous controller left: an attempt whose
 * supervisor still works (or an adopter) is named and refused, an attempt from before the run supervisor
 * is refused for the doctor to settle. Only a closed attempt is carried on from. Asks the adopt door,
 * read-only, for every attempt whose outcome the dead controller never recorded.
 */
function assertAttemptsResumable(unitRunId, unitRecord, assignmentsDir) {
  for (const attempt of lastAttempts(unitRecord)) {
    if (!leftByDeadController(attempt, assignmentsDir)) continue;
    const prior = currentAttemptOf(assignmentsDir, attempt.assignmentId);
    const { state } = adoptRun(prior.dir, { probeOnly: true });
    if (state === 'closed') continue;
    const look = 'fgos dispatch inspect';
    if (state === 'legacy-run') {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": attempt "${prior.runId}" ran before the run supervisor and cannot be judged (${prior.dir}); fgos doctor --fix settles it`, { code: 'attempt-legacy-run' });
    }
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": attempt "${prior.runId}" is still ${state} (${prior.dir}); look with \`${look}\` and resume once it has closed`, { code: 'attempt-still-running', attemptState: state });
  }
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
    // A run from before the supervisor that the legacy sweep settled has no result to carry on from.
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
 * The operation a Work step declared for this unit, checked before anything is dispatched: the
 * operation must be one the step declares, never human-only, its stamped mutation must agree
 * with the unit's write scope, and the unit runs `solo` (one assignment for one operation).
 * Returns the operation fields every producer assignment of the unit carries.
 */
function declaredOperationOf(declared, unit, loop, { taskSpecRoot } = {}) {
  if (!declared || typeof declared !== 'object') throw new RunnerConfigError('runUnit: declared must be an object');
  for (const key of ['workId', 'domain', 'stage', 'operation']) {
    if (typeof declared[key] !== 'string' || !declared[key].trim()) {
      throw new RunnerConfigError(`runUnit: declared.${key} must be a non-empty string`);
    }
  }
  if (!Array.isArray(declared.operations)) {
    throw new RunnerConfigError('runUnit: declared.operations must be the step\'s operations');
  }
  const fields = declaredOperationFields({
    domain: declared.domain,
    workflow: declared.workflow ?? null,
    stage: declared.stage,
    operation: declared.operation,
    operations: declared.operations,
    taskSpecRoot,
  });
  if (fields.dispatch === 'human-only') {
    throw new RunnerConfigError(`runUnit: operation "${declared.operation}" is human-only and is never dispatched`);
  }
  const unitReadOnly = (unit.writes ?? []).length === 0;
  if ((fields.mutation === 'read-only') !== unitReadOnly) {
    throw new RunnerConfigError(`runUnit: operation "${declared.operation}" is ${fields.mutation} but the unit ${unitReadOnly ? 'writes nothing' : 'declares writes'}`);
  }
  if (loop !== 'solo') {
    throw new RunnerConfigError(`runUnit: a unit carrying operation "${declared.operation}" runs solo, not "${loop}"`);
  }
  return fields;
}

/** The sha256 hex digests of report revisions the caller stands behind; anything else is refused before the run. */
function checkedAcceptedReports(accepted) {
  if (accepted === undefined) return [];
  if (!Array.isArray(accepted) || accepted.some((d) => typeof d !== 'string' || !/^[0-9a-f]{64}$/.test(d))) {
    throw new RunnerConfigError('runUnit: acceptedReports must be sha256 hex digests');
  }
  return [...new Set(accepted)];
}

/** Absolute paths whose bytes a result is bound to; anything else is refused before the run. */
function checkedPinInputs(pinInputs) {
  if (pinInputs === undefined) return [];
  if (!Array.isArray(pinInputs) || pinInputs.some((p) => typeof p !== 'string' || !path.isAbsolute(p))) {
    throw new RunnerConfigError('runUnit: pinInputs must be absolute paths');
  }
  return [...new Set(pinInputs)];
}

function foreignIndexRefusal(tag, round, paths) {
  return {
    outcome: 'policy-refusal',
    ...tag,
    round,
    refused: { reason: 'foreign-staged-index', detail: foreignIndexDetail(paths), paths },
  };
}

/** The preflight refusal of a writing seat: an open merge this run did not start, or a foreign index. */
function preflightRefusal(tag, round, { foreignMerge, foreignStaged }) {
  if (foreignMerge) {
    return {
      outcome: 'policy-refusal',
      ...tag,
      round,
      refused: { reason: 'merge-in-progress', detail: `the worktree has a merge in progress (MERGE_HEAD ${foreignMerge}) that this run did not start; finish or abort it (git merge --abort), then run again` },
    };
  }
  return foreignStaged.length > 0 ? foreignIndexRefusal(tag, round, foreignStaged) : null;
}


const portMissing = () => new RunnerConfigError(
  'runUnit: a Unit that writes (or names a case) needs the case admission port in options.caseAdmission; none was given',
  { code: PORT_MISSING },
);

/** A standalone writing run needs the affirmative `unbound`; every other answer, a missing view included, refuses. */
function requireFreeWorktree(port, worktree) {
  const binding = port.resolveBinding({ worktree });
  if (binding?.answer === 'unbound') return;
  const answer = binding?.answer ?? 'binding-view-unavailable';
  const owner = binding?.record?.caseId ? ` (case ${binding.record.caseId})` : '';
  throw new CaseAdmissionRefusedError({ code: answer, condition: binding?.condition ?? `worktree ${worktree} is not free for a run that names no case: ${answer}${owner}` });
}

/**
 * What a seat's bind ask carries beyond the seat itself: the tier its workflow recommended and whether
 * the calling door may raise. The recommendation comes from the unit record, so a resume and a replay
 * ask what the run asked; `raiseAuthorized` is never
 * persisted, so a replay can only ever be the unauthorized one.
 */
function bindContextOf(unitRecord, seatUnit, seat, options = {}) {
  const workflowTier = workflowTierOf(seat, seatUnit, unitRecord.workflowId);
  return {
    ...(workflowTier ? { workflowTier } : {}),
    raiseAuthorized: options.raiseAuthorized === true,
  };
}

/**
 * Refuse what the calling door has no authority for, and a pinned account no seat takes, before a unit
 * run exists.
 *
 * - An override that accepts a dependence, and a tier above the one a seat resolves to (an override's, or
 *   its persona's), are raises. No door is authorized yet, so they
 *   are refused by name: `dependence-acceptance-unauthorized`, `tier-escalation-unauthorized`.
 * - Each seat an `account` override applies to (bound the way the run would bind it) must take that
 *   account, at least one seat must, and the account must not be quarantined now.
 */
async function assertDoorChoicesBeforeRun(unit, runnerConfig, options) {
  const overrides = options.overrides ?? [];
  const objects = overrides.filter((o) => o && typeof o === 'object');
  if (options.raiseAuthorized !== true && objects.some((o) => o.acceptDependence === true)) {
    throw new RunnerConfigError(
      'dependence-acceptance-unauthorized: accepting a dependence between seats needs an authorized door; no door of this release is authorized, so every seat keeps the independence its pattern asks for',
      { code: 'dependence-acceptance-unauthorized', phase: 'pre-admission' },
    );
  }
  const pinsAccount = objects.some((o) => o.account !== undefined);
  const { seats } = await simulateUnitBindings(
    unit,
    runnerConfig,
    {
      session: { herdrPresent: options.session?.herdrPresent ?? detectHerdrPresent(), ...(options.session ?? {}) },
      overrides,
      raiseAuthorized: options.raiseAuthorized === true,
      workflowId: options.workflowId,
      collaboration: options.collaboration,
    },
  );
  const unauthorized = seats.find((r) => r.refused?.reason === 'tier-escalation-unauthorized');
  if (unauthorized) {
    throw new RunnerConfigError(`tier-escalation-unauthorized: ${unauthorized.refused.detail}`, { code: 'tier-escalation-unauthorized', phase: 'pre-admission' });
  }
  if (!pinsAccount) return;
  const refused = seats.find((r) => r.refused?.reason?.startsWith('account-pin'));
  if (refused) throw new RunnerConfigError(`cannot pin the account for seat "${refused.seat}": ${refused.refused.detail}`);
  if (!seats.some((r) => r.account)) {
    const why = seats.filter((r) => r.accountSkipped).map((r) => `seat "${r.seat}": ${r.accountSkipped.detail}`);
    throw new RunnerConfigError(`the pinned account applies to no seat of this unit${why.length ? ` (${why.join('; ')})` : ': no seat its override names binds here'}`);
  }
  assertPinnedAccountsUsable(seats, { runnerConfig, runtimeDir: options.providerCapacityRuntimeDir, what: 'cannot start the unit run' });
}

/**
 * Main headless unit execution entrypoint.
 *
 * @param {object} options
 * @param {string} [options.unitPath] Path to unit YAML/JSON file or '-' for stdin
 * @param {object} [options.unitData] Raw unit object (in-memory)
 * @param {string} [options.pattern] Pattern name or preset
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
  const outcome = failure ? (admission.started ? 'execution-failure' : 'not-started') : result.outcome;
  try {
    admission.port.settle(admission.reservationId, {
      caseId: admission.caseId,
      outcome,
      unitRunId: admission.started ? admission.unitRunId : null,
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

/** The receipt the lease wrote for the run an attempt ended on, or null when it leased nothing. */
function readLeaseReceipt(assignmentsDir, assignmentId) {
  try {
    const attempt = currentAttemptOf(assignmentsDir, assignmentId);
    if (!attempt) return null;
    return JSON.parse(fs.readFileSync(path.join(attempt.dir, 'provider-capacity-selection.json'), 'utf8')).leaseReceipt ?? null;
  } catch {
    return null;
  }
}

async function runUnitBody(options, scope) {
  if (options.resumeUnitRunId && options.stanceOptions !== undefined) {
    throw new RunnerConfigError('cannot provide stanceOptions when resuming a unit run: the stored question is immutable');
  }
  // Private homes left by an earlier run (a failed round that kept its pane)
  // hold a copy of an account login; `fgos run` is the one door every such run
  // goes through, so it is also where the ones whose pane has since closed are
  // reclaimed. Best effort: a reap problem never blocks the run.
  const cwd = options.cwd ?? process.cwd();
  // A directory that is no git checkout still gets its homes reclaimed; the run then refuses as before.
  let roots = null;
  let rootsFailure = null;
  try { roots = resolveGitRoots(cwd, { allowNoRepository: true }); } catch (err) { rootsFailure = err; }
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots?.mainCheckoutRoot;
  try {
    sweepAttempts({ assignmentsRoot: mainRoot ? path.join(mainRoot, '.fgos', 'assignments') : undefined });
  } catch { /* best effort */ }
  if (rootsFailure) throw rootsFailure;
  const worktreePath = options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot;
  const caseRef = normalizeCaseRef(options.caseRef);
  const port = options.caseAdmission === undefined ? null : assertCaseAdmissionPort(options.caseAdmission);

  // The config this run reads live: the account inventory comes from it (never from unit.json), and a fresh
  // run snapshots the rest of it.
  // Read at first use, so a resume that is refused for its record never needs the config.
  let liveConfigRead;
  const liveConfig = () => (liveConfigRead ??= options.runnerConfig ?? loadRunnerConfigForDir(mainRoot));
  const withAccounts = (runner) => ({ ...runner, ...accountInventoryConfigOf(liveConfig()) });

  let unit;
  let unitRunId;
  let unitRecord;
  let declaredOp = null;
  // The seat launches the admission handed this run (kept in unit.json, so a resume keeps the same bound).
  let admittedCeiling = null;
  // sha256 of the revisions of a settled report its caller stands behind (see handoff-refs `accept`); kept in
  // unit.json so a resume and every seat's own inputs read the same.
  let acceptedReports = [];
  const assignmentsDir = path.join(mainRoot, '.fgos', 'assignments');

  if (options.resumeUnitRunId) {
    unitRunId = options.resumeUnitRunId;
    const unitDir = path.join(assignmentsDir, unitRunId);
    const unitJsonPath = path.join(unitDir, 'unit.json');
    if (!fs.existsSync(unitJsonPath)) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json not found at "${unitJsonPath}"`);
    }
    // A record written before seats existed keys its attempts by role name. It stays readable (history,
    // summaries, hand-off refs) and is never resumed: that would re-enter it under the new keys.
    if (!isSeatRecord(JSON.parse(fs.readFileSync(unitJsonPath, 'utf8')))) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": record-predates-seat-binding (its seats were keyed by role name; start the work again as a new unit run)`, { code: 'record-predates-seat-binding' });
    }
    // One controller per unit: a live one (the run itself, or another resume) refuses this resume; one
    // that died is taken over. Taken before unit.json is read, so a resume that waited behind another
    // never works from a record that other one has since moved on.
    const control = acquireUnitControl(unitDir, unitRunId);
    if (control.status !== 'acquired') {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": another controller drives it${control.holder?.pid ? ` (PID ${control.holder.pid})` : ''}`, { code: 'resume-in-progress' });
    }
    scope.control = control;
    unitRecord = JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
    assertRecordNotFromNewerRelease(unitRunId, unitRecord);
    unit = validateUnit(unitRecord.unit);
    assertRepositoryForWrites(roots, cwd, { writes: unit.writes.length > 0 || Boolean(unitRecord.sync) });
    // A writing run is never resumed without the port, and a standalone one only into a free worktree.
    const resumeLink = normalizeWorkflowLink(unitRecord.workflow);
    if (unit.writes.length > 0 || unitRecord.sync) {
      if (!port) throw portMissing();
      if (!resumeLink) requireFreeWorktree(port, worktreePath);
    }
    // The reservation the first run recorded is the one this resume settles; it is never admitted again.
    if (port && resumeLink?.reservationId) {
      scope.admission = { port, caseId: resumeLink.caseId, reservationId: resumeLink.reservationId, unitRunId, started: true, settled: false };
    }
    if (!Array.isArray(unitRecord.resolvedInputs)) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json has no resolvedInputs`);
    }

    assertAttemptsResumable(unitRunId, unitRecord, assignmentsDir);

    // A resume reads the config as it is now: a seat that did not pass is bound again from it (see runRole).
    // Attempts bound before this change are stamped with the config they were bound from first.
    const currentSnapshot = snapshotRunnerConfig(mainRoot, liveConfig());
    if (currentSnapshot.hash !== unitRecord.configSnapshot?.hash) {
      for (const attempts of Object.values(unitRecord.bindings ?? {})) {
        for (const attempt of attempts) attempt.configHash ??= unitRecord.configSnapshot?.hash;
      }
      unitRecord.configSnapshot = currentSnapshot;
    }

    // A mutating dispatch holds the worktree's dispatch-cwd lock while its
    // worker runs; resuming under a live holder would launch a second worker
    // into the same worktree.
    const cwdHolder = dispatchCwdHolder(path.join(mainRoot, '.fgos'), worktreePath);
    if (cwdHolder) {
      throw dispatchInFlightError(worktreePath, cwdHolder);
    }
    assertNoStrayCommit(unitRunId, unitRecord, mainRoot);

    assertPinnedAccountsUsable(lastAttempts(unitRecord).filter((a) => a.outcome !== 'pass').map((a) => a.binding ?? {}), {
      runnerConfig: withAccounts(unitRecord.configSnapshot?.runner ?? {}),
      runtimeDir: options.providerCapacityRuntimeDir,
      what: `cannot resume unit run "${unitRunId}"`,
    });
    if (unitRecord.declared) declaredOp = declaredOperationOf(unitRecord.declared, unit, unitRecord.collaboration?.effective?.loop ?? unitRecord.pattern);
  } else {
    if (options.declared === undefined && options.pinInputs !== undefined) {
      throw new RunnerConfigError('runUnit: pinInputs needs declared');
    }
    let raw;
    if (options.unitData) {
      raw = options.unitData;
    } else if (options.unitPath === '-') {
      const stdinContent = fs.readFileSync(0, 'utf8');
      try {
        raw = JSON.parse(stdinContent);
      } catch {
        raw = parseYaml(stdinContent, { filename: '<stdin>' });
      }
    } else if (options.unitPath) {
      const content = fs.readFileSync(path.resolve(options.unitPath), 'utf8');
      try {
        raw = JSON.parse(content);
      } catch {
        raw = parseYaml(content, { filename: options.unitPath });
      }
    } else {
      throw new RunnerConfigError('runUnit requires --unit <file|-> or unitData');
    }

    // A seat's tier is a recommendation only a registered workflow may make; a unit read from a file or
    // from stdin never carries one.
    if (!options.unitData) assertNoSeatTier(raw?.seats, 'a unit file');
    unit = validateUnit(options.stanceOptions === undefined ? raw : { ...raw, stanceOptions: options.stanceOptions });
    assertRepositoryForWrites(roots, cwd, { writes: unit.writes.length > 0 || Boolean(unit.syncBase) });

    const callerObject = typeof options.pattern === 'object' && options.pattern !== null
      ? (options.pattern.patternName && !options.pattern.pattern
        ? { ...options.pattern, pattern: options.pattern.patternName }
        : options.pattern)
      : null;
    const callerString = typeof options.pattern === 'string' && options.pattern ? options.pattern : null;

    let collaboration;
    try {
      collaboration = resolveCollaboration({
        unit,
        selectors: {
          callerObject,
          callerString,
          activityUnit: options.activityUnit,
        },
        request: options.request ?? null,
        inCase: Boolean(caseRef),
        reason: caseRef?.reason ?? options.reason ?? null,
        runnerConfig: liveConfig(),
        shipped: shippedCatalog(),
        layers: options.runnerConfig ? null : catalogLayersOf(mainRoot),
      });
    } catch (err) {
      if (err instanceof CollaborationError || err instanceof SeatResolutionError) {
        throw new RunnerConfigError(err.message, { code: err.code, phase: 'pre-admission' });
      }
      throw err;
    }

    const effective = collaboration.pin.effective;

    const hasUnitExplicitVerify = Boolean(
      (typeof options.verify === 'string' && options.verify.trim()) ||
      (typeof unit.verify === 'string' && unit.verify.trim())
    );
    if (!loopRunsVerify(effective.loop) && hasUnitExplicitVerify) {
      throw new RunnerConfigError(
        `runUnit: loop "${effective.loop}" has no verify checkpoint; pass no --verify or set no unit.verify, or use a loop that verifies (solo, reviewed)`,
        { code: 'verify-command-unsupported', phase: 'pre-admission' },
      );
    }

    // Checked before the unit directory exists: an operation the step does not allow leaves nothing
    // behind. The pattern checked is the one the run will use (see patternName below).
    if (options.declared !== undefined) {
      declaredOp = declaredOperationOf(options.declared, unit, effective.loop, { taskSpecRoot: mainRoot });
    }
    // Policy wins before seedSync or preflight can touch a native Git port or borrow custody.
    if (unit.writes.length > 0 && resolveMutatingCwdPosture(worktreePath).reason === 'main-checkout') {
      throw new RunnerConfigError(`runUnit refused -- cwd "${worktreePath}" resolves to the main checkout ("${mainRoot}"); a mutating dispatch must run in a linked git worktree, never the main checkout`);
    }
    const pinInputs = options.declared !== undefined ? checkedPinInputs(options.pinInputs) : [];
    acceptedReports = checkedAcceptedReports(options.acceptedReports);
    // A run timeout in an override is checked before the unit run exists (bind() checks it again).
    for (const ov of options.overrides ?? []) {
      if (ov && typeof ov === 'object' && ov.timeoutMs !== undefined) assertRunTimeoutMs(ov.timeoutMs, 'override timeoutMs');
    }
    const configSnapshot = snapshotRunnerConfig(mainRoot, liveConfig());
    const seats = collaboration.seats;
    // A pinned account is checked before the unit run exists: every seat it applies to must bind an
    // executor whose provider lists it, and it must not be quarantined now.
    await assertDoorChoicesBeforeRun(unit, withAccounts(configSnapshot.runner), options, collaboration);
    // A sync ref is resolved to its commit once, before the run exists; a resume merges that commit.
    const sync = seedSync(unit, { worktree: worktreePath, mainRoot });
    const writing = unit.writes.length > 0 || Boolean(sync);
    if (writing && options.forceSharedCwd === true) throw Object.assign(new RunnerConfigError('--force-shared-cwd cannot be used with writes', { code: 'custody-required' }), { cwd: worktreePath, executorId: null, capability: unit.capability });
    // Admission comes first, then custody, then the unit directory: a refusal leaves nothing behind.
    // A writing Unit with no port is refused here; a standalone one runs only into a free worktree.
    if ((writing || caseRef) && !port) throw portMissing();
    const unitRunIdAtAdmission = `unit-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    if (writing && !caseRef) requireFreeWorktree(port, worktreePath);
    if (caseRef) {
      const loop = effective.loop;
      const admitted = port.admit({
        unitRunId: unitRunIdAtAdmission,
        caseRef: {
          ...caseRef,
          ...(caseRef.reason ?? (options.reason ? { reason: options.reason } : {})),
        },
        activity: caseRef.activity,
        writes: unit.writes,
        worktree: fs.realpathSync(worktreePath),
        readOnly: !writing,
        pattern: loop,
        seatLaunches: collaboration.launchBound,
        blind: unit.blind === true,
        handoffRefs: unit.inputs,
        // The rigor the unit runs at (its own or its capability's, the stronger), so the frame's floor is
        // judged against what the seats will actually bind at.
        rigor: effectiveRigorOf(unit, configSnapshot.runner),
        reason: caseRef.reason ?? options.reason ?? null,
      });
      if (admitted.refused) throw new CaseAdmissionRefusedError(admitted.refused);
      scope.admission = { port, caseId: admitted.caseId, reservationId: admitted.reservationId, unitRunId: unitRunIdAtAdmission, started: false, settled: false };
      admittedCeiling = admitted.seatLaunchCeiling ?? null;
      options.onCaseAdmitted?.({ caseId: admitted.caseId, reservationId: admitted.reservationId });
    }
    if (writing) {
      scope.custody = admitSuccessor(createLockScope('unit-custody'), path.join(mainRoot, '.fgos'), worktreePath);
    }
    // Resolved before the unit directory exists, so a ref that points nowhere leaves nothing behind.
    unitRunId = unitRunIdAtAdmission;
    const unitDir = path.join(assignmentsDir, unitRunId);
    // A persona file that cannot be parsed or has the wrong shape refuses the run here, before the unit
    // directory exists, instead of seating a silently different persona.
    const personaPin = unitPersonaPin(unit.persona, mainRoot, options.personaScope);
    let resolved;
    try {
      // A blind unit's roles each get their copies in their own directory at dispatch, so nothing is copied here.
      resolved = resolveUnitInputs(
        unit.inputs,
        mainRoot,
        {
          accept: acceptedReports,
          ...(unit.blind
            ? { blind: true, anonymize: unit.anonymizeInputs === true }
            : unit.anonymizeInputs ? { anonymizeInto: path.join(unitDir, 'inputs') } : {}),
        },
      );
    } catch (err) {
      fs.rmSync(unitDir, { recursive: true, force: true });
      throw err;
    }
    fs.mkdirSync(unitDir, { recursive: true });

    unitRecord = {
      unit,
      seatSchema: 1,
      seats,
      collaboration: {
        ...collaboration.pin,
        pattern: {
          ...collaboration.pin.pattern,
          digest: crypto.createHash('sha256').update(canonicalJson(collaboration.entry)).digest('hex'),
        },
      },
      pattern: collaboration.pin.pattern.name,
      overrides: options.overrides || [],
      configSnapshot,
      // The scope this run may write, widened once to the render targets of generated sources it
      // touches. A resumed run reads it back and never recomputes it against a changed config.
      writeScope: expandGenerated(unit.writes, configSnapshot.runner.generatedPaths ?? []),
      ...(personaPin ? { personaPin } : {}),
      resolvedInputs: resolved.refs,
      ...(acceptedReports.length > 0 ? { acceptedReports } : {}),
      // Which input each neutral name stands for; only the owner reads this, never a role.
      ...(unit.anonymizeInputs || unit.blind ? { inputMap: resolved.inputMap } : {}),
      worktree: fs.realpathSync(worktreePath),
      ...(sync ? { sync } : {}),
      // The Work step operation and the files its verdict is bound to; a resume reads them back
      // from here and never takes them from its caller again.
      ...(options.declared !== undefined ? {
        declared: {
          workId: options.declared.workId,
          ...(options.declared.title ? { title: options.declared.title } : {}),
          domain: options.declared.domain,
          ...(options.declared.workflow ? { workflow: options.declared.workflow } : {}),
          stage: options.declared.stage,
          operation: options.declared.operation,
          operations: options.declared.operations,
        },
        pinInputs,
      } : {}),
      createdBy: process.env.USER || 'system',
      createdAt: new Date().toISOString(),
      execution: { status: 'running' },
    };

    fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));
    if (scope.admission) scope.admission.started = true;
    const fresh = acquireUnitControl(unitDir, unitRunId);
    if (fresh.status !== 'acquired') throw new RunnerConfigError(`unit run "${unitRunId}" is already driven by another controller`, { code: 'resume-in-progress' });
    scope.control = fresh;
    // Told once, as soon as the run exists and before any seat can start, so a caller can record
    // the id and resume this run if it dies. Not called for a resumed run: its id is already known.
    options.onUnitRunCreated?.(unitRunId);
  }

  if (!scope.custody && (unit.writes.length > 0 || unitRecord.sync)) {
    if (options.forceSharedCwd === true) throw Object.assign(new RunnerConfigError('--force-shared-cwd cannot be used with writes', { code: 'custody-required' }), { cwd: unitRecord.worktree, executorId: null, capability: unit.capability });
    scope.custody = admitSuccessor(createLockScope('unit-custody'), path.join(mainRoot, '.fgos'), unitRecord.worktree);
  }

  if (unit.writes.length > 0 || unitRecord.sync) unitRecord.gitWriter ??= gitWriter(path.join(mainRoot, '.fgos'));
  if (options.resumeUnitRunId) assertSyncResumable(unitRunId, unitRecord, mainRoot, scope.custody);
  scope.unitRecord = unitRecord;
  const seatLaunchCeiling = unitRecord.seatLaunchCeiling ?? null;
  const unitDir = path.join(assignmentsDir, unitRunId);
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
  writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);
  const settle = (outcome) => {
    unitRecord.settlement = { outcome, settledAt: new Date().toISOString() };
    unitRecord.execution = { status: 'settled' };
    writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);
    publishUnitSummary(unitDir);
  };

  let executionSettled = false;
  try {

  // A producer round whose commit is still pending is not settled yet: the pattern asks for it
  // again, and runRole commits it without spawning the agent.
  // The same for a round whose controller died before it read the outcome: the attempt may have settled
  // on its own, and the resume carries on from that result (commit, then the rest) instead of skipping it.
  const pendingCommitKeys = () => new Set(Object.entries(unitRecord.bindings ?? {})
    .filter(([, attempts]) => {
      const last = attempts[attempts.length - 1];
      return commitPending(last, unitRecord.worktree, mainRoot, scope.custody) || leftByDeadController(last, assignmentsDir);
    })
    .map(([key]) => key));
  const history = () => {
    const pending = pendingCommitKeys();
    // A seat about to be bound again on this resume is no result the pattern may stand on.
    return readUnitRunHistory(unitDir).filter((h) => !pending.has(`${h.seat}/${h.round ?? 1}`) && !rebindKeys.has(`${h.seat}/${h.round ?? 1}`));
  };

  // Which executors filled which seat; `independentOf` seat ids resolve through it (see seat-ledger.mjs).
  // Bind, publish to the ledger and launch are ordered per unit run: the ledger read, the bind and the
  // publish of one seat queue behind the seats listed before it, and a group of seats launches only once
  // every seat of the group is bound.
  const seatLedger = createSeatLedger();

  // Bindings recorded in unit.json, per seat/round, one entry per attempt (the first binding,
  // then one per provider-limit fallback or resume re-bind), each stamped with the hash of the config it
  // was bound from. A resumed run reuses the last binding of a seat that passed, or whose commit or
  // adopt result is still pending; a seat whose last attempt ended without a pass is bound again
  // from the current config as a new attempt.
  if (!unitRecord.bindings || typeof unitRecord.bindings !== 'object') unitRecord.bindings = {};
  // Read once, before this resume changes any attempt: the seats whose last attempt ended in a failure (not a
  // pass, not findings) and has no commit or adopt result pending. A seat with no recorded outcome is adopted, never bound again.
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
  // Pools whose login failed in this unit and that a seat then walked away from: no later fallback
  // walk of the unit lands on one (a resumed run rebuilds the set from its attempts).
  const credentialFaultPoolSet = credentialFaultPools(unitRecord);
  const persistUnitRecord = () => writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);

  // One dispatch of an already-bound role. Returns the settled outcome of that attempt.
  const dispatchBound = async ({ bound, seat, round, readOnly, assignmentId, assignmentDir, session, inputs = [], objective = unit.objective, admission, batchSize }) => {
    // A pinned account leases from an inventory holding only that account (account-pin.mjs).
    const runnerConfig = runnerConfigForBinding(withAccounts(unitRecord.configSnapshot.runner), bound);
    fs.mkdirSync(assignmentDir, { recursive: true });

    // What the unit names (already resolved to paths), then the accounts of the seats whose
    // work this seat judges (a panel synthesizer reads its members' reports).
    let contextRefs = [...new Set([...unitRecord.resolvedInputs, ...reportRefsOf(inputs, { mainRoot })])];
    if (unit.blind) {
      // A blind seat reads only its own directory of the run state, so what lies elsewhere in it
      // reaches the role as a copy there, byte for byte; the copies are what its refs list.
      const inRun = contextRefs.filter((ref) => refIsHiddenFromBlind(ref, mainRoot));
      const entries = [
        ...(unitRecord.inputMap ?? []),
        ...inRun.map((source, i) => ({ name: `${plainInputName((unitRecord.inputMap?.length ?? 0) + i, source, mainRoot)}${path.extname(source)}`, source })),
      ];
      contextRefs = [...contextRefs.filter((ref) => !inRun.includes(ref)), ...copyHandoffsInto(assignmentDir, entries)];
    }

    // What an earlier run's same seat left for this seat: its own previous result, copied
    // into its own directory whether the unit is blind or not.
    if (unit.inputs.some(isSeatInput)) {
      contextRefs = [...contextRefs, ...copyHandoffsInto(assignmentDir, resolveUnitInputs(unit.inputs, mainRoot, { seat: seat.seat, accept: unitRecord.acceptedReports ?? [] }).inputMap)];
    }

    // A unit that runs a Work step operation is that operation's assignment: its seat keeps its
    // name in provenance.role and its directory, the assignment carries the operation's role and stamp.
    // The seat that does the unit's own work (its posture says it writes) carries the operation.
    const carriesOperation = declaredOp && seat.posture.writer;
    const operationFields = carriesOperation ? {
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
    } : {};
    const assignment = {
      assignmentId,
      unitRunId,
      seat: seat.seat,
      role: carriesOperation ? declaredOp.role : seat.role,
      posture: seat.posture,
      round,
      ...operationFields,
      // The role's own task when the pattern gave it a unit of its own (a reviewer is told to
      // review, not to redo the work); otherwise the unit's objective.
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
      // The conflicted files of a merge the runner left open for this writing seat: settlement
      // counts the seat's edits to them as its evidence, though they were dirty at launch.
      ...(!readOnly && unitRecord.sync?.status === 'conflicted' ? { syncConflicts: [...unitRecord.sync.conflicts] } : {}),
      policy: {
        tier: bound.tier,
        preferExecutor: bound.executor,
        preferInvocation: bound.invocation,
        preferPersona: bound.persona,
        // The rigor the unit asked for, so the policy's own rigor reads match what bind tiered on.
        ...(unit.rigor ? { rigor: unit.rigor } : {}),
        // The persona text a caller pinned for this role when it supplied the override: the prompt
        // renders that text, never a file read again at dispatch time.
        ...pinnedPersonaFor(unitRecord, seat.seat, bound.persona),
      },
    };

    const runResult = await executeAssignment(assignment, {
      cwd: unitRecord.worktree,
      repoRoot: mainRoot,
      custody: readOnly ? null : scope.custody,
      // The case this launch was admitted into, so the worker's environment names it and no other.
      ...(scope.admission ? { caseContext: { caseId: scope.admission.caseId, reservationId: scope.admission.reservationId } } : {}),
      runnerConfig,
      // The admission identity of this dispatch: a resume of an attempt whose outcome was never read
      // finds that attempt again (and its settled result) instead of admitting a new one.
      ...admission,
      // What the write gate replays a mutating seat's binding against: the config this run reads live, never the
      // copy kept in unit.json.
      committedRunnerConfig: liveConfig(),
      providerCredentialProbe: createCredentialProbe(),
      providerCredentialRenew: createConfinementCredentialRenewal({ tempRoots: defaultConfinementTempRoots }),
      cliOverride: {
        preferExecutor: bound.executor,
        // bind() already chose the invocation that carries bound.transport: the executor's
        // herdr-spawn one for 'herdr', its cli one otherwise.
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
      session,
      ...(carriesOperation ? { operations: unitRecord.declared.operations, pinInputs: unitRecord.pinInputs ?? [] } : {}),
      ...(options.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: options.providerCapacityRuntimeDir } : {}),
      // Every role of a blind unit is dispatched blind or refused, never run unblind.
      ...(unit.blind ? { blind: true } : {}),
      // Seats launched together as one group: their panes share the tab in equal parts. A seat alone sends none.
      ...(batchSize > 1 ? { dispatchBatchSize: batchSize } : {}),
    });

    return {
      outcome: outcomeOfRunResult(runResult),
      seat: seat.seat,
      role: seat.role,
      posture: seat.posture,
      round,
      runResult,
      binding: bound,
    };
  };

  // Helper to run one seat: bind it, publish the binding, then launch it.
  const runRole = async ({ seat, unit: rUnit, round = 1, independentOf = [], preferIndependentOf = [], inputs = [], batch }) => {
    assertNotCancelled();
    const seatId = seat.seat;
    // A seat id names a directory and a ref segment of this run; only Convention's ids reach a path.
    assertSeatId(seatId);
    const seatTag = { seat: seatId, role: seat.role, posture: seat.posture };
    const readOnly = seat.posture.readOnly;
    const runnerConfig = withAccounts(unitRecord.configSnapshot.runner);
    const session = {
      provider: options.session?.provider,
      tier: options.session?.tier,
      hasNativeAgent: options.session?.hasNativeAgent ?? false,
      herdrPresent: options.session?.herdrPresent ?? detectHerdrPresent(),
      headless: options.session?.headless ?? true,
    };

    // What bind() is asked for this seat. The independence and the spread are read from the ledger when
    // the ask is built, so they see exactly the seats bound before this one.
    const askOf = () => ({
      unit: rUnit || unit,
      seat: seatId,
      role: seat.role,
      posture: seat.posture,
      ...(seat.persona ? { persona: seat.persona } : {}),
      ...bindContextOf(unitRecord, rUnit || unit, seat, options),
      readOnly,
      // Independence is symmetric: a seat bound earlier that must differ from this one holds this seat to it too.
      independentOf: [...seatLedger.resolve(independentOf), ...seatLedger.dependentExecutors(seatId)],
      ...(preferIndependentOf.length > 0 ? { preferIndependentOf: seatLedger.seats(preferIndependentOf) } : {}),
      overrides: unitRecord.overrides || [],
      ...(unit.blind ? { blind: true } : {}),
    });
    const assignmentIdOf = (n) => (n === 0 ? `${unitRunId}/${seatId}/${round}` : `${unitRunId}/${seatId}/${round}-fb${n}`);
    // The lease state is read for the attempt about to run (the account this assignment already holds ranks first).
    const bindCtxFor = (n) => ({ runnerConfig, session, accounts: { runtimeDir: options.providerCapacityRuntimeDir, assignmentId: assignmentIdOf(n) } });

    const key = `${seatId}/${round}`;
    const recorded = unitRecord.bindings[key] ?? [];
    // A resumed seat whose last attempt did not pass is bound again, as the attempt after the last one.
    const rebinding = rebindKeys.delete(key);
    let attemptNo = rebinding ? recorded.length : recorded.length > 0 ? recorded.length - 1 : 0;
    // Ledger read, bind and publish are one queued step: seats started together bind one after the other
    // in the order they were listed, each seeing the executors its earlier siblings were just given, even
    // when a bind takes time.
    let bound;
    try {
      bound = await seatLedger.serialize(() => {
        // A seat that already ran an earlier round of this unit keeps that round's executor, model and effort.
        const kept = keptBindingOf(unitRecord, seatId, round);
        const first = recorded.length > 0 && !rebinding ? recorded[recorded.length - 1].binding : bind(askOf(), bindCtxFor(attemptNo), kept ? { walk: { continuity: kept } } : {});
        if (!first.refused) {
          seatLedger.note(seatId, first.executor);
          seatLedger.noteDependence(seatId, independentOf);
        }
        return first;
      });
    } finally {
      batch?.arrive();
    }
    // A group of seats launches only after every seat of the group is bound.
    await batch?.bound;

    if (bound.refused) {
      return {
        outcome: 'policy-refusal',
        ...seatTag,
        round,
        refused: bound.refused,
      };
    }

    const writeScope = effectiveWriteScope(unitRecord);
    // A merge a sync left open for this round is concluded first (unit-sync.mjs), then the rest.
    let nativeBaseline = recorded[0]?.nativeBaseline;
    if (!readOnly && recorded.length > 0 && !nativeBaseline) return {outcome:'policy-refusal',role,round,
      refused:{reason:'native-baseline-missing',detail:'this writing attempt has no native pre-producer baseline; start a new Unit run'}};
    const commitWork = (summarySource, runResult, excludePaths) => {
      const operationId = crypto.randomUUID();
      const attempt = unitRecord.bindings[key]?.at(-1);
      const commit = commitRoundWithSync(unitRecord, mainRoot, (merge) => commitUnitWork({
        worktree: unitRecord.worktree,
        // The gitdir and hooks come from the main checkout, never from the worker-writable worktree.
        repoRoot: mainRoot,
        custody: scope.custody,
        writer: unitRecord.gitWriter,
        baseline: nativeBaseline && (unitRecord.sync?.commit?.sha ?? unitRecord.sync?.nativeHead) ? { ...nativeBaseline, head: unitRecord.sync.commit?.sha ?? unitRecord.sync.nativeHead } : nativeBaseline,
        operationId,
        resumeOperation: attempt?.commitOperation?.state === 'pending' ? attempt.commitOperation : undefined,
        onPrepared: prepared => { attempt.commitOperation = {...prepared,state:'pending'}; persistUnitRecord(); },
        unitId: summarySource.id,
        summary: runResult?.agentClaim?.summary,
        objective: summarySource.objective,
        scope: writeScope,
        changedFiles: runResult?.evidence?.changedFiles ?? null,
        excludePaths,
        needsWrites: runResult?.agentClaim?.needsWrites,
      }), excludePaths, scope.custody);
      if (attempt?.commitOperation && (commit.status !== 'failed' || ['commit-rejected','hook-refused'].includes(commit.nativeCause) || commit.reason === 'committed-set-mismatch')) attempt.commitOperation.state = 'settled';
      persistUnitRecord();
      return commit;
    };

    // The consent the admission stood on is checked again just before a writing round is committed,
    // through the same port object the run was given; a refusal commits nothing.
    const writeGate = (changedFiles) => {
      const admission = scope.admission;
      if (!admission) return null;
      const verdict = admission.port.recheckEffect(admission.reservationId, { caseId: admission.caseId, paths: changedFiles ?? [] });
      return verdict?.refused ? { reason: verdict.refused.code, detail: verdict.refused.condition } : null;
    };

    // The agent already did this round's work and only the runner commit failed: commit again,
    // never spawn the agent a second time.
    const lastRecorded = recorded[recorded.length - 1];
    if (!readOnly && commitPending(lastRecorded, unitRecord.worktree, mainRoot, scope.custody)) {
      const refusal = lastRecorded.commitOperation?.state === 'pending' ? null : preflightRefusal(seatTag, round, preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, custody: scope.custody, writer: unitRecord.gitWriter, scope: writeScope, sync: unitRecord.sync }));
      if (refusal) return refusal;
      assertNotCancelled();
      const prior = readUnitRunHistory(unitDir).find((h) => h.seat === seatId && (h.round ?? 1) === round);
      const gate = writeGate(prior?.runResult?.evidence?.changedFiles);
      if (gate) return { outcome: 'policy-refusal', ...seatTag, round, refused: gate };
      const excludePaths = lastRecorded.preExistingInScope ?? [];
      let commit = commitWork(rUnit || unit, prior?.runResult, excludePaths);
      if (commit.status === 'no-changes') {
        // The agent's in-scope files are gone (cleaned up with the index): that is not a pass.
        // Files a sync merge commit of this round took are not missing.
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
      persistUnitRecord();
      return { outcome: lastRecorded.outcome, ...seatTag, round, runResult: prior?.runResult, binding: lastRecorded.binding, commit };
    }

    // Before a mutating producer is spawned: an index someone else staged refuses the run (the
    // runner stages only what it chose), and files already dirty in scope are recorded so the
    // runner never commits them. A resumed attempt keeps what its first launch saw.
    let preExistingInScope = [];
    if (!readOnly) {
      const preflight = preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, custody: scope.custody, writer: unitRecord.gitWriter, scope: writeScope, sync: unitRecord.sync });
      const refusal = preflightRefusal(seatTag, round, preflight);
      if (refusal) return refusal;
      preExistingInScope = recorded[0]?.preExistingInScope ?? preflight.preExistingInScope;
      nativeBaseline = recorded[0]?.nativeBaseline ?? preflight.baseline;
    }

    // Out-of-process dispatch, with provider-limit failover: when the agent stops on a provider
    // limit or a dead credential, the same executor first runs again on another account of its
    // provider, then the next candidate of the capability's prefer pool runs; each attempt gets a
    // fresh pane/process and the failed one is left exactly as it was (its pane stays open). With
    // nothing left the outcome stays provider-limit -- no other executor is guessed at.
    let lastResult = null;
    for (;;) {
      const assignmentId = attemptNo === 0 ? `${unitRunId}/${seatId}/${round}` : `${unitRunId}/${seatId}/${round}-fb${attemptNo}`;
      const assignmentDir = path.join(unitDir, seatId, attemptNo === 0 ? String(round) : `${round}-fb${attemptNo}`);

      const attempts = unitRecord.bindings[key] ?? (unitRecord.bindings[key] = []);
      // The seat-launch ceiling the admission handed this run: a launch that would pass it does not
      // happen. A seat that already ran keeps what it has (a provider limit stays one, with
      // `fallbackExhausted`); a seat that never ran is refused by name, never reported as `blocked`.
      if (attempts[attemptNo]?.dispatchRetryId === undefined && seatLaunchCeiling !== null && seatLaunchesUsed(unitRecord) >= seatLaunchCeiling) {
        scope.ceilingHit = true;
        const detail = `the seat-launch ceiling of ${seatLaunchCeiling} for this Unit is spent`;
        if (attemptNo === 0 || (rebinding && lastResult === null)) return { outcome: 'policy-refusal', ...seatTag, round, refused: { reason: SEAT_LAUNCH_CEILING, detail } };
        return {
          ...(lastResult ?? { outcome: 'provider-limit', ...seatTag, round }),
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason: SEAT_LAUNCH_CEILING,
            detail,
          },
        };
      }
      if (attempts.length <= attemptNo) {
        attempts.push({
          seat: seatId,
          role: seat.role,
          round,
          assignmentId,
          binding: bound,
          transport: bound.transport,
          invocation: bound.invocation,
          fallbackFrom: bound.provenance?.fallbackFrom ?? null,
          ...(readOnly ? {} : { preExistingInScope, nativeBaseline }),
          boundAt: new Date().toISOString(),
          configHash: unitRecord.configSnapshot.hash,
        });
        persistUnitRecord();
      }
      // What the worktree looks like as this writing seat launches, so a provider limit can tell
      // whether the seat changed it (partial-writes.mjs). Taken again at every launch, a resumed
      // one included: what a person kept before resuming is not this launch's work. A read-only
      // seat is sandboxed and records none, so a change it could not have made never stops it.
      if (!readOnly) {
        try {
          attempts[attemptNo].writeBaseline = worktreeSnapshot({ worktree: unitRecord.worktree, repoRoot: mainRoot });
        } catch (error) {
          attempts[attemptNo].writeBaseline = { error: error.message };
        }
        persistUnitRecord();
      }

      // A writing seat over a merge left open for it is told which files hold the conflicts.
      const objective = `${(rUnit || unit).objective}${readOnly ? '' : syncBrief(unitRecord.sync)}`;
      // Recorded before the dispatch: a controller that dies from here on is resumed from this id.
      const admission = admissionIdentityFor(attempts[attemptNo], { unitRunId, assignmentId, worktree: unitRecord.worktree, assignmentsDir });
      attempts[attemptNo].dispatchRetryId = admission.retryId;
      delete attempts[attemptNo].outcome;
      persistUnitRecord();
      assertNotCancelled();
      const result = await dispatchBound({ bound, seat, round, readOnly, assignmentId, assignmentDir, session, inputs, objective, admission, batchSize: batch?.size });
      lastResult = result;

      // The receipt is read from a directory the worker can reach. A pass is only a pass when the provider
      // record agrees the lease it names was granted, so nothing is committed on a receipt it never gave.
      const receipt = readLeaseReceipt(assignmentsDir, assignmentId);
      const receiptDiffers = receipt && result.outcome === 'pass' ? auditLeaseReceipt(receipt, { assignmentId, runtimeDir: options.providerCapacityRuntimeDir }) : null;
      if (receiptDiffers) {
        result.outcome = 'policy-refusal';
        result.refused = { reason: 'lease-receipt-mismatch', detail: receiptDiffers };
      }

      // The worker only writes files; this trusted code, outside the confinement, commits the
      // ones inside the write scope. No change is recorded as such, and a commit that cannot be
      // made fails the round. Paths changed outside the scope are reported, never committed.
      if (!readOnly && result.outcome === 'pass') {
        // A pass whose commit never started is picked up by the resume: the work is on disk, the commit is pending.
        assertNotCancelled();
        const gate = writeGate(result.runResult?.evidence?.changedFiles);
        if (gate) {
          result.outcome = 'policy-refusal';
          result.refused = gate;
        } else {
          const commit = commitWork(rUnit || unit, result.runResult, attempts[attemptNo].preExistingInScope ?? preExistingInScope);
          result.commit = commit;
          attempts[attemptNo].commit = commit;
          if (commit.status === 'failed') result.outcome = 'execution-failure';
        }
      }

      attempts[attemptNo].outcome = result.outcome;
      attempts[attemptNo].runId = result.runResult?.runId ?? null;
      if (receipt && !receiptDiffers) attempts[attemptNo].leaseReceipt = receipt;
      const credentialFault = result.outcome === 'provider-limit' && result.runResult?.classification?.failure?.cause === 'credential';
      if (credentialFault) attempts[attemptNo].failureCause = 'credential';
      persistUnitRecord();

      // The account Seat Binding named could not be taken any more: nothing ran. The seat is bound again, in
      // the queue, from a fresh view of the accounts and the same policy (a family change is checked against
      // the seats bound before it); this is a rebind, not a step of the walk and not a launch.
      if (result.outcome === 'provider-limit' && isLeaseConflict(result.runResult)) {
        attempts[attemptNo].leaseConflict = true;
        persistUnitRecord();
        // A pinned account is hard: it is never answered with another account or executor.
        if (bound.account) {
          return { ...result, fallbackExhausted: { from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport }, reason: 'account-pinned', detail: `account "${bound.account.pool}/${bound.account.id}" was pinned, but it cannot be leased now; pin another account or wait for this one` } };
        }
        const rebound = attempts.filter((a) => a.leaseConflict === true).length > MAX_LEASE_CONFLICTS ? null : await seatLedger.serialize(() => {
          const kept = keptBindingOf(unitRecord, seatId, round);
          const next = bind(askOf(), bindCtxFor(attemptNo + 1), {
            walk: {
              from: bound,
              reason: 'lease-conflict',
              failedAccounts: failedAccountsOf(attempts),
              excludePools: [...credentialFaultPoolSet],
              ...(kept ? { continuity: kept } : {}),
            },
          });
          if (!next.refused) seatLedger.note(seatId, next.executor);
          return next;
        });
        if (!rebound || rebound.refused) {
          return { outcome: 'policy-refusal', ...seatTag, round, refused: rebound?.refused ?? { reason: 'lease-conflict', detail: `the seat's account could not be leased ${MAX_LEASE_CONFLICTS + 1} times in a row` } };
        }
        bound = rebound;
        attemptNo += 1;
        continue;
      }

      if (result.outcome !== 'provider-limit') return result;

      // A provider failure first goes to another account of the same provider: the same executor
      // and invocation run again as a new attempt and the lease picks the next ranked account. It
      // stops when no usable account is left, or after as many retries as the provider has
      // accounts (never a loop on one account), and only then does the walk leave the provider.
      let rotationsSpent = 0;
      for (let at = attemptNo; at > 0 && attempts[at]?.fallbackFrom?.kind === 'account-rotation'; at -= 1) rotationsSpent += 1;
      // Two cases end the seat here and leave the decision to a person. A writing seat that already
      // changed the worktree is never run again on top of its own half-done work (checked first, so
      // a pinned seat still names what it changed). And a pinned account is hard: its limit is never
      // answered with another account or executor.
      const stopRetry = (reason, detail, extra = {}) => {
        attempts[attemptNo].retryStopped = { reason, ...extra };
        persistUnitRecord();
        return {
          ...result,
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason,
            detail,
            ...extra,
            ...(rotationsSpent > 0 ? { accountRotations: rotationsSpent } : {}),
          },
        };
      };
      const pinned = bound.account ? { accountPinned: `${bound.account.pool}/${bound.account.id}` } : {};
      const baseline = attempts[attemptNo].writeBaseline;
      if (baseline) {
        let changed;
        try {
          if (baseline.error) throw new Error(`no baseline was taken at launch: ${baseline.error}`);
          changed = writesSince(baseline, { worktree: unitRecord.worktree, repoRoot: mainRoot });
        } catch (error) {
          return stopRetry('partial-writes', `could not tell whether the seat changed the worktree (${error.message}), so it is not run again by itself`, { paths: [], ...pinned });
        }
        if (changed.paths.length > 0 || changed.headMoved) {
          const what = [changed.paths.join(', '), changed.headMoved ? 'HEAD moved' : ''].filter(Boolean).join('; ');
          return stopRetry('partial-writes', `the seat changed the worktree before its provider limit (${what}); it is not run again on top of that work: keep, finish or undo the changes, then resume`, { paths: changed.paths, headMoved: changed.headMoved, ...pinned });
        }
      }
      if (bound.account) {
        return stopRetry('account-pinned', `account "${bound.account.pool}/${bound.account.id}" was pinned, so the seat is not moved to another account or executor; pin another account or wait for this one`);
      }
      const rotation = bound.pool ? inspectAccountRotation({ runnerConfig, pool: bound.pool, runtimeDir: options.providerCapacityRuntimeDir }) : null;
      if (mayRotateAccount(rotation, rotationsSpent)) {
        // The same candidate again: the lease picks the next account of its pool.
        const again = bind(askOf(), bindCtxFor(attemptNo + 1), { walk: { continuity: bound, from: bound, rotation: true, failedAccounts: failedAccountsOf(attempts), detail: { accountsHealthy: rotation.healthy } } });
        if (!again.refused) {
          bound = again;
          attemptNo += 1;
          continue;
        }
      }

      if (credentialFault && bound.pool) credentialFaultPoolSet.add(bound.pool);
      // The independence and the spread are read again now: sibling seats may have changed executors
      // since this seat first bound, and a hard `independentOf` must hold for the executor it falls back to.
      // The read, the walk and the publish are one queued step, so two seats whose providers fail at once
      // never both pick their next candidate from the same stale view of each other.
      const current = bound;
      const kept = keptBindingOf(unitRecord, seatId, round);
      const next = await seatLedger.serialize(() => {
        const candidate = bind(askOf(), bindCtxFor(attemptNo + 1), {
          walk: {
            from: current,
            tried: triedBindingsOf(attempts, attemptNo + 1),
            excludePools: [...credentialFaultPoolSet],
            ...(kept ? { continuity: kept } : {}),
          },
        });
        if (!candidate.refused) seatLedger.note(seatId, candidate.executor);
        return candidate;
      });
      if (next.refused) {
        return {
          ...result,
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason: next.refused.reason,
            detail: next.refused.detail,
            ...(rotationsSpent > 0 ? { accountRotations: rotationsSpent } : {}),
          },
        };
      }

      bound = next;
      attemptNo += 1;
    }
  };

  // The deterministic check a round ends with: the unit's own `verify`, else its capability's. It
  // runs through the one bounded command runner (goal-check.mjs), for at most `runner.timeoutMs`;
  // running past that is a failed verify that says so, never a hang.
  const verify = async (targetUnit) => {
    assertNotCancelled();
    const runnerConfig = unitRecord.configSnapshot.runner;
    const verifyCmd = verifyCommandOf(targetUnit, runnerConfig);
    if (!verifyCmd) return { pass: true };

    // The verify child borrows the Unit's custody lease, so a controller death cannot free the
    // worktree while it still writes.
    const outcome = await runCommand(verifyCmd, unitRecord.worktree, runnerConfig.timeoutMs, { custody: scope.custody });
    if (outcome.passed) return { pass: true };
    const how = outcome.timedOut
      ? `timed out after ${runnerConfig.timeoutMs}ms`
      : outcome.status === null ? 'could not run' : `exited ${outcome.status}`;
    const tail = outcome.output.trim().split('\n').slice(-20).join('\n');
    return {
      pass: false,
      findings: [`Verification command ${how}: ${verifyCmd}${tail ? `\n${tail}` : ''}`],
    };
  };

  const effective = unitRecord.collaboration?.effective
    ?? { loop: unitRecord.pattern ?? 'solo', params: {} };
  persistUnitRecord();

  // A unit with a syncBase merges it before any seat runs. A refusal, or a sync-only unit whose
  // merge needed no worker, ends the run here; a conflicted merge stays open for the producer.
  if (unitRecord.sync) {
    assertNotCancelled();
    const early = runPendingSync(unitRecord, mainRoot, persistUnitRecord, scope.custody);
    if (early) {
      executionSettled = true;
      settle(early.outcome);
      return { unitRunId, outcome: early.outcome, rounds: 0, results: early.results ?? [], findings: [], sync: syncSummary(unitRecord.sync) };
    }
  }

  const patternResult = await runLoop(effective, unit, unitRecord.configSnapshot.runner, {
    runRole,
    verify,
    history,
    // A pattern that would start another round asks whether `seats` more launches fit under the ceiling.
    hasLaunchRoom: (seats = 1) => {
      const room = seatLaunchCeiling === null || seatLaunchesUsed(unitRecord) + seats <= seatLaunchCeiling;
      if (!room) scope.ceilingHit = true;
      return room;
    },
  });
  executionSettled = true;
  settle(patternResult.outcome);

  // A reviewed run with nothing to verify says so: a pass without a verify is not a verified pass.
  const loop = effective.loop;
  const loopVerifies = loopRunsVerify(loop);
  const verifyCmd = verifyCommandOf(unit, unitRecord.configSnapshot.runner);
  const unverified = (loop === 'reviewed' && !verifyCmd)
    || (!loopVerifies && Boolean(verifyCmd));
  return {
    unitRunId,
    outcome: patternResult.outcome,
    rounds: patternResult.rounds,
    results: patternResult.results,
    findings: patternResult.findings || [],
    ...(unitRecord.sync ? { sync: syncSummary(unitRecord.sync) } : {}),
    ...(unverified ? { verify: { ran: false, reason: 'no verify command: set unit.verify, pass --verify, or declare capabilities.<capability>.verify' } } : {}),
  };
  } catch (error) {
    // A cancelled run is not a failed one: it stays as a dead controller leaves it, and the resume carries on.
    if (!executionSettled && !(error instanceof RunCancelledError)) {
      // The execution error is what the caller must see; failing to record the settlement is
      // reported beside it, never instead of it.
      try { settle('execution-failure'); }
      catch (settleError) {
        console.warn(`fgos: could not record the failed settlement of unit run "${unitRunId}": ${settleError.message}`);
      }
    }
    throw error;
  }
}

