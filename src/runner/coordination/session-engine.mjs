// coordination/session-engine.mjs — the ONE entry point for driving a
// standalone CoordinationSession end to end (Phase 01 R5-R7), built on top
// of P01.1's `store.mjs`/`replay.mjs`/`schema.mjs`.
//
// This module is the ONLY place in `src/runner/coordination/**` that ever
// runs an executor. It calls `createSessionAssignment()` (store.mjs, which
// itself calls `buildAssignment()`) followed by `executeAssignment()`
// (dispatch/assignment-runner.mjs) -- never `child_process`,
// `dispatch/transport.mjs`, or any other spawn mechanism directly. In
// production this dispatches through the real governed Assignment runner;
// in tests, the caller injects a fake executor the SAME way every other
// test in this codebase already does (see
// `test/runner/assignment-runresult.test.mjs`'s `runnerConfig.executor =
// { command: process.execPath, args: [scriptPath, '{prompt}'] }` pattern)
// -- a real subprocess running a local script through the real
// `executeExecutorCli` path, never a JS-level stub that replaces
// `executeAssignment` itself.
//
// R6 dynamic consult -- this engine's exact interpretation, written down
// once here rather than left implicit:
// - "one request/response round" = at most ONE specialist actor, ever,
//   bound to a given session (`validateConsultProposal` rejects a second
//   proposal the moment any actor other than the primary is already
//   bound). Phase 01's own proof only ever needs one primary + one
//   specialist; a richer per-role-pair round count is Phase 04 Cohort
//   Planner scope, not this cell's.
// - "context visibility / sibling leakage" is checked proportionally: a
//   consult's `contextRefs` may reference the primary's own Assignment (the
//   whole point of a consult) but must never reference an Assignment that
//   exists on disk yet does not belong to THIS session, and must never
//   reference a different `coordinationId`. Real multi-branch
//   isolated-until-fan-in semantics belong to Phase 04, not here.
//
// R7 resume/idempotency -- `createAndExecuteSessionTask` (below) is the
// SAME code path whether this is a session's first-ever dispatch or a
// post-crash retry: it always calls `replaySession()` first and always
// calls `createSessionAssignment()` with the same caller-supplied
// `taskKey`, so "resume" is not a separate, second-tested branch -- it is
// the only branch. A crash "after result/before event" (RunResult written
// to disk but never linked into the session) is detected by checking the
// Assignment's own runs directory directly, not just the event log, and
// self-heals by linking the already-completed run rather than dispatching
// a second one.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  openSession,
  bindActor,
  createSessionAssignment,
  authorizeOperation,
  linkResult,
  recordRunRetry,
  recordActorReplacement,
  transitionSessionStatus,
  transitionSessionStatusLocked,
  withSessionLock,
  readManifest,
  resolveSessionPaths,
  hashTaskKey,
  assertSafeCoordinationId,
  assertValidRunIdForAssignment,
  recordAggregationValidation,
  recordContributionLink,
  recordSpecialistAuthorization,
  knownContributionsFromEvents,
  asCoordinationError,
} from './store.mjs';
import { validateContributionLineage } from '../deliberation/schema.mjs';
import { replaySession } from './replay.mjs';
import { CoordinationError, CONTRIBUTION_REF_PREFIX } from './schema.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { READ_ONLY_ROLES } from '../dispatch/assignment-normalizer.mjs';
import { RunnerConfigError } from '../dispatch/config.mjs';
import { TIER_STRENGTH } from '../dispatch/assignment-policy.mjs';
import { PROTOCOL_OPERATION_STAMP_PREFIX } from '../dispatch/execution-contract.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot } from '../paths.mjs';
import { loadCoordinationProtocol } from '../definitions/protocol-loader.mjs';
import { mergePolicyStack, activationModeOf } from '../definitions/schema.mjs';
import { planCohort, verifyPlannedAllocationAgainstCurrentConfig } from './cohort-planner.mjs';
// The Team Cognition evaluator is CALLED, never forked: `classifyAggregationOutcome`
// is P07.1/P07.2's own hardened pure function, and this module supplies it
// session-derived evidence rather than re-deriving its rules. The dependency
// points one way only -- team-cognition still imports nothing from
// `src/runner/coordination/**` (`team-cognition-static.test.mjs` enforces it).
import { classifyAggregationOutcome } from '../team-cognition/aggregation-evaluator.mjs';

export const PRIMARY_ACTOR_ID = 'primary';
export const DEFAULT_SPECIALIST_ACTOR_ID = 'specialist';

// "objective: non-empty, bounded" (R6) -- a generous but real cap, not
// unbounded-by-omission, matching the same posture aggregateBounds' own
// defaults take (schema.mjs's DEFAULT_AGGREGATE_BOUNDS doc comment).
export const CONSULT_OBJECTIVE_MAX_LENGTH = 4000;

// Descriptive-only default for the inline contract's `budget.timeoutMs`
// field (ADR-006 §4: budget is recorded metadata, not the actual spawn
// timeout -- the real spawn timeout is `opts.timeoutMs` forwarded to
// `executeAssignment` separately, below).
const DEFAULT_TASK_TIMEOUT_MS = 300000;

const EVIDENCE_REQUIRED_VALUES = new Set(['reported', 'verified']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * The LAST (most recent) event of `type` for `assignmentId`, or `undefined`.
 * Every reader of a `result-linked` event in this file uses this instead of
 * a plain `.find()` (which would return the FIRST/original match): after a
 * Phase 06 R2 retry, store.mjs's `linkResult({allowSupersede: true})` can
 * legally append a SECOND `result-linked` event for the same assignment, and
 * that later event is always the authoritative "current" view -- the
 * original stays in the log, immutable, as historical evidence.
 */
function lastEventFor(events, type, assignmentId) {
  let found;
  for (const event of events) {
    if (event.type === type && event.payload.assignmentId === assignmentId) found = event;
  }
  return found;
}

function assertKnownReadOnlyRole(role, label) {
  if (!READ_ONLY_ROLES.has(role)) {
    throw new CoordinationError(
      'validation',
      `${label}: role "${role}" is not a legal/known role (expected one of: ${[...READ_ONLY_ROLES].join(', ')})`,
    );
  }
}

// `minTier` (Step 08 P04.2b, optional): when supplied, sets
// `contract.policy = {minTier}` on the built inline contract --
// `execution-contract.mjs`'s own narrow, exactly-one-field-wide
// `contract.policy` exception (see that module's own doc comment). This is
// the ONLY channel that reaches `resolveAssignmentDispatchPolicy`'s
// `opPolicy.minTier` starting floor (`assignment-policy.mjs`,
// `effectiveTier = opPolicy.minTier || 'standard'`) -- `cliOverride.minTier`
// (composed separately by `dispatchDeclaredOperation` below) can only ever
// RAISE that floor via `resolveStrongerTier`, never lower it, so without
// this parameter a caller-composed tier requirement below `'standard'` had
// no way to actually take effect. Every pre-existing caller omits this
// parameter, so `contract.policy` stays absent and behavior is
// byte-identical to before this parameter existed.
// A RESERVED constraint namespace, writable by this module alone. The
// `protocol-operation:` stamp (imported from dispatch/execution-contract.mjs
// -- the ONE definition either side of the coordination/dispatch layer
// boundary trusts, Phase 01 R6a) is the durable, on-disk record of WHICH
// declared operation an Assignment was materialized for, and
// `assignmentServesOperation` (below) trusts it as engine-derived proof --
// so it must never be something a caller can put there. Every mediated
// contract door in this file goes through `buildSessionContract`, which is
// therefore the ONE place that both refuses a caller-supplied entry in this
// namespace and appends the engine's own. (An Assignment built outside this
// module -- the raw `createSessionAssignment` store door -- is unmediated by
// design and carries no such guarantee; see this cell's trace.) The SAME
// stamp is also what lets a mutating inline contract past
// `execution-contract.mjs`'s/`assignment-normalizer.mjs`'s own gates (R6a)
// -- this module is the ONLY legal minter of it.
function protocolOperationStamp(definition, operationId) {
  return `${PROTOCOL_OPERATION_STAMP_PREFIX}${definition.metadata.id}@${definition.metadata.version}#${operationId}`;
}

function assertNoReservedOperationStamp(constraints) {
  // Non-arrays pass through untouched so the contract validator downstream
  // still raises its own typed error for them, exactly as it did before this
  // guard existed.
  if (!Array.isArray(constraints)) return;
  for (const constraint of constraints) {
    if (typeof constraint === 'string' && constraint.startsWith(PROTOCOL_OPERATION_STAMP_PREFIX)) {
      throw new CoordinationError(
        'validation',
        `buildSessionContract: constraint "${constraint}" uses the reserved "${PROTOCOL_OPERATION_STAMP_PREFIX}" namespace -- that stamp is engine-derived operation provenance and may not be supplied by a caller`,
      );
    }
  }
}

// `constraints` is materialized ONCE below, and that same snapshot is both
// guarded and persisted. Reading the caller's own container twice -- once to
// check it, again to store it -- would make the guard time-of-check/
// time-of-use: an array with an accessor property, an Array subclass with a
// lying `Symbol.iterator`, or a Proxy can answer the check with a benign value
// and the store with the reserved stamp. Snapshotting collapses both reads
// into one, so what was guarded is provably what is persisted, whatever the
// container does on a second read. A non-array is passed through untouched
// (never spread, which would raise an untyped TypeError) so the contract
// validator downstream still rejects it with its own typed error -- and
// rejects it BEFORE persistence, which is what keeps a non-string forgery off
// disk.
//
// Phase 01 mutation-unlock (R4): renamed from `buildReadOnlyContract` --
// "read-only" stopped being an accurate name once this can build either
// posture. `mutation` defaults to `'read-only'`, which every pre-existing
// caller (`dispatchPrimaryTask`, `proposeConsult`) still relies on
// implicitly by never passing it -- byte-identical contract shape for both.
// Only `dispatchDeclaredOperation` ever passes `mutation: 'mutating'`, and
// only after its OWN R2/R3 checks (operation declares `result.kind:
// 'work-product'`; `cwd` resolves to a linked worktree, never the main
// checkout) have already passed -- this function trusts its caller for that
// legality decision and only shapes the contract, exactly like every other
// field here.
function buildSessionContract({ objective, contextRefs, constraints, expectedOutputs, evidenceRequired, role, capabilities, budget, timeoutMs, minTier, protocolOperationRef, mutation = 'read-only' }) {
  const declared = Array.isArray(constraints) ? [...constraints] : constraints;
  assertNoReservedOperationStamp(declared);
  const stamped = protocolOperationRef !== undefined && Array.isArray(declared) ? [...declared, protocolOperationRef] : declared;
  return {
    objective,
    contextRefs,
    constraints: stamped,
    expectedOutputs,
    mutation,
    evidence: { required: evidenceRequired },
    role,
    ...(capabilities !== undefined ? { capabilities } : {}),
    budget: budget ?? { timeoutMs: timeoutMs ?? DEFAULT_TASK_TIMEOUT_MS, maxRuns: 1 },
    ...(minTier !== undefined ? { policy: { minTier } } : {}),
  };
}

/**
 * Read the RunResult a `result-linked` event points at, straight off disk.
 * Fails closed (`CoordinationError`) on any shape the event log promised
 * but the filesystem does not actually have -- an ambiguous/foreign state,
 * never silently guessed past.
 */
function readLinkedRunResultFromDisk(fgosDir, assignmentId, runId) {
  // R6 round 2: FULL-SHAPE validation (store.mjs's `assertValidRunIdForAssignment`,
  // shared with `linkResult`'s own write-time gate), not a prefix-only check.
  // A prefix-only check here previously let a same-prefix, malicious-suffix
  // `runId` (e.g. `run_<assignmentId>_../../../../tmp/evil-marker`) reach the
  // unvalidated `path.join` below via a hand-crafted/corrupt event log --
  // defense in depth even though `linkResult` itself now also refuses this
  // shape at write time (R6's own "corrupt ledger" attack class assumes the
  // event log cannot always be trusted, even when the write-time gate is
  // airtight).
  assertValidRunIdForAssignment(assignmentId, runId, 'readLinkedRunResultFromDisk (result-linked event)');
  const prefix = `run_${assignmentId}_`;
  const attemptStr = runId.slice(prefix.length);
  const resultPath = path.join(fgosDir, 'assignments', assignmentId, 'runs', attemptStr, 'result.json');
  if (!fs.existsSync(resultPath)) {
    throw new CoordinationError('dangling-ref', `session recorded result-linked for runId "${runId}" but no result.json exists at ${resultPath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  } catch (err) {
    throw new CoordinationError('corrupt-log', `result.json at ${resultPath} is not valid JSON: ${err.message}`);
  }
}

/**
 * Find the latest settled RunResult for an Assignment directly on disk,
 * regardless of whether the session's event log has linked it yet. This is
 * what lets `createAndExecuteSessionTask` self-heal the "after result/
 * before event" crash window instead of re-dispatching a completed task.
 * Returns `null` when the Assignment has no runs directory, no attempts,
 * or its latest attempt never settled (still genuinely pending -- safe to
 * (re)dispatch).
 */
function findLatestRunResult(fgosDir, assignmentId) {
  const runsDir = path.join(fgosDir, 'assignments', assignmentId, 'runs');
  if (!fs.existsSync(runsDir)) return null;
  const attempts = fs
    .readdirSync(runsDir)
    .filter((d) => /^\d+$/.test(d))
    .sort((a, b) => Number(a) - Number(b));
  if (attempts.length === 0) return null;
  const latest = attempts[attempts.length - 1];
  const resultPath = path.join(runsDir, latest, 'result.json');
  if (!fs.existsSync(resultPath)) return null;
  let raw;
  try {
    raw = fs.readFileSync(resultPath, 'utf8');
  } catch (err) {
    throw new CoordinationError('corrupt-log', `result.json for assignment "${assignmentId}" run "${latest}" could not be read: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new CoordinationError('corrupt-log', `result.json for assignment "${assignmentId}" run "${latest}" is not valid JSON: ${err.message}`);
  }
}

/**
 * The engine's ONE literal `executeAssignment()` call site (a static
 * structural test in `coordination-declared-consult.test.mjs` enforces
 * this file never grows a second one; a SECOND, codebase-wide static test,
 * `test/architecture.test.mjs`, additionally enforces this is the only real
 * call site anywhere allowed to ever pass `isReadOnlyMode: false`, Phase 01
 * R6b) -- both `createAndExecuteSessionTask` (first dispatch) and
 * `retrySessionTask` (Phase 06 R2, a new Run for an EXISTING Assignment)
 * call through this same tiny wrapper rather than reaching
 * `executeAssignment` directly, so "retry re-resolution through EXISTING
 * dispatch APIs, never a new dispatch surface" holds structurally, not just
 * by convention.
 *
 * Phase 01 mutation-unlock (R5): `isReadOnlyMode` is derived from the
 * Assignment's OWN already-stamped `mutation` field, never a second,
 * independently-decided boolean -- `assignment.mutation` is set once, by
 * `buildSessionContract`+`stampInlineAssignment` (assignment-normalizer.mjs),
 * before this function ever runs, so there is exactly one place upstream
 * that ever decides "mutating is legal here" (`dispatchDeclaredOperation`'s
 * own R2/R3 gate) and exactly one place downstream that acts on it. Every
 * pre-existing caller (`dispatchPrimaryTask`, `proposeConsult`) only ever
 * builds `mutation: 'read-only'` contracts, so `assignment.mutation` is
 * always `'read-only'` for them and this resolves to `isReadOnlyMode: true`
 * byte-identically to before this parameter existed.
 */
async function runExecutorAttempt(assignment, opts) {
  return executeAssignment(assignment, { ...opts, isReadOnlyMode: assignment.mutation !== 'mutating' });
}

/**
 * The engine's single dispatch primitive, shared by the primary task and
 * the dynamic consult task -- both are "one logical task under this
 * session," differing only in which actor/contract/caller they carry.
 *
 * Always reconciles via `replaySession()` first (R7's own words: "reconstruct
 * ... by calling replaySession() ... and reading manifest.assignmentRefs"),
 * then calls `createSessionAssignment()` with the caller's `taskKey`
 * unchanged, then decides whether to execute:
 * - a `result-linked` event already exists for this Assignment -> read the
 *   linked RunResult off disk, never re-execute (true idempotent resume).
 * - no linked event, but a settled `result.json` already exists on disk ->
 *   the "after result/before event" crash window; link it now (self-heal)
 *   instead of dispatching a second run.
 * - neither -> genuinely pending; dispatch through `executeAssignment()`,
 *   the ONLY execution entry point this engine calls, then link the result.
 *
 * Both `priorLink` and `unlinked` above are read from state captured BEFORE
 * `executeAssignment()` is ever called (`priorLink` from `replaySession()`
 * at the top of this function; `unlinked` only detects a SETTLED run,
 * `result.json` on disk). Neither one detects a run another concurrent
 * caller has already STARTED but not yet settled, so a plain, unconditional
 * `await executeAssignment(...)` here would let two callers racing within
 * the SAME process (this function genuinely awaits, unlike the fully
 * synchronous `validateConsultProposal`/`bindActor` pair fixed earlier in
 * this file) both spawn a real executor for the identical Assignment. The
 * exclusive `dispatch.claim` file below closes that window the same way
 * `createSessionAssignment`'s own `taskClaimPath` closes the analogous
 * window for Assignment CREATION: written synchronously, right before the
 * step it guards, with no gap where a second caller could observe "no claim
 * yet" and proceed anyway. Unlike `taskClaimPath`, this claim is never
 * consulted to resolve/return anything -- its sole job is to make a second
 * concurrent dispatch attempt fail loudly (`EEXIST`) instead of silently
 * duplicating; it is intentionally never removed on success (the `priorLink`
 * check above already makes a later legitimate resume short-circuit before
 * reaching this code at all).
 *
 * On failure, the claim is removed ONLY when `executeAssignment` threw a
 * `RunnerConfigError` -- every `RunnerConfigError` throw site in
 * assignment-runner.mjs (asserted assignment shape, unknown/human-only
 * operation, read-only-mode violation, corrupt assignment.json, governance/
 * decide-blocked mechanism, decide/policy executor mismatch) fires strictly
 * before that function's own `fs.mkdirSync(runDir, ...)`, i.e. before any
 * per-attempt run directory or subprocess for THIS Assignment has ever been
 * created. Removing the claim there is provably safe: nothing was spawned,
 * so there is no ambiguous in-flight state and no concurrency window left
 * open -- the SAME `taskKey`/assignmentId can be retried (e.g. after an
 * operator fixes a governance-blocked executor config) without leaving a
 * stale claim wedged forever. Any OTHER thrown error type -- most notably
 * anything thrown once `executeAssignment` is past that point -- leaves the
 * claim in place exactly as before: a crashed in-flight dispatch still needs
 * manual reconciliation, not silent auto-retry -- fail closed, matching this
 * module's own dangling-ref/duplicate-ref posture elsewhere. The original
 * error is always rethrown unchanged either way; this only ever affects
 * whether the claim file survives the throw.
 */
async function createAndExecuteSessionTask({ coordinationId, taskKey, actorId, contract, caller, authorizationProvenance }, opts = {}) {
  const reconciled = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);

  const assignment = createSessionAssignment({ coordinationId, taskKey, actorId, contract, caller, authorizationProvenance }, opts);

  const priorLink = lastEventFor(reconciled.events, 'result-linked', assignment.assignmentId);
  if (priorLink) {
    const runResult = readLinkedRunResultFromDisk(fgosDir, assignment.assignmentId, priorLink.payload.runId);
    return { assignment, runResult, resumed: true };
  }

  const unlinked = findLatestRunResult(fgosDir, assignment.assignmentId);
  if (unlinked) {
    linkResult(coordinationId, { assignmentId: assignment.assignmentId, runId: unlinked.runId }, opts);
    return { assignment, runResult: unlinked, resumed: true };
  }

  const dispatchClaimPath = path.join(fgosDir, 'assignments', assignment.assignmentId, 'dispatch.claim');
  try {
    fs.closeSync(fs.openSync(dispatchClaimPath, 'wx'));
  } catch (err) {
    if (err.code === 'EEXIST') {
      throw new CoordinationError(
        'validation',
        `createAndExecuteSessionTask: a dispatch is already in progress for assignment "${assignment.assignmentId}" in session "${coordinationId}" -- refusing to spawn a second concurrent executor run for the same Assignment`,
      );
    }
    throw err;
  }

  let runResult;
  try {
    runResult = await runExecutorAttempt(assignment, opts);
  } catch (err) {
    if (err instanceof RunnerConfigError) {
      try {
        fs.unlinkSync(dispatchClaimPath);
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') throw unlinkErr;
      }
    }
    throw err;
  }
  linkResult(coordinationId, { assignmentId: assignment.assignmentId, runId: runResult.runId }, opts);
  return { assignment, runResult, resumed: false };
}

/**
 * Open a new standalone CoordinationSession for one primary investigator.
 * Binds the primary actor up front (Recovery Rule #1: the manifest records
 * the intended actor set before the first Assignment for that actor is
 * created) -- `definitionRef` stays null (agent-led, no predeclared
 * protocol, Vision V-009) and no `topology`/`edges` are declared, since the
 * dynamic consult (R6) is proposed later by the primary itself, not
 * predeclared here.
 *
 * @param {object} params
 * @param {string} [params.coordinationId] Optional explicit id; auto-generated when omitted.
 * @param {string} params.objective
 * @param {string} params.writerId Caller identity opening the session.
 * @param {string} [params.parentAssignmentId]
 * @param {string} params.primaryRole Must be a legal/known read-only role (READ_ONLY_ROLES).
 * @param {object} [params.aggregateBounds] Partial bounds; omitted fields default (schema.mjs).
 * @param {string|null} [params.workRef] Optional read-only Work reference; never grants lifecycle authority.
 * @param {{minimumActors?: number, allowedOmissions?: string[]}} [params.partialPolicy] R1: declared up front, before any Assignment is dispatched (store.mjs's openSession).
 * @param {object} [opts] Workspace options ({ cwd, repoRoot })
 * @returns {Readonly<object>} The stored manifest
 */
export function openStandaloneSession(
  { coordinationId, objective, writerId, parentAssignmentId, primaryRole, aggregateBounds, workRef = null, partialPolicy = null },
  opts = {},
) {
  assertKnownReadOnlyRole(primaryRole, 'openStandaloneSession');
  return openSession(
    {
      coordinationId,
      objective,
      provenanceRoot: { writerId, ...(parentAssignmentId !== undefined ? { parentAssignmentId } : {}) },
      workRef,
      actors: [{ id: PRIMARY_ACTOR_ID, role: primaryRole }],
      aggregateBounds,
      partialPolicy,
    },
    opts,
  );
}

/**
 * Reconstruct a session's pending/completed state from disk -- literally
 * `replaySession()` (P01.1's own fail-closed reconciliation), re-exported
 * under this name so callers have one obvious "resume" door on this
 * module rather than reaching into `replay.mjs` directly. Never reinvents
 * replay's own crash-safety reasoning.
 */
export function resumeSession(coordinationId, opts = {}) {
  return replaySession(coordinationId, opts);
}

/**
 * Materialize and dispatch the primary actor's bounded inline task.
 * Read-only always (`mutation: 'read-only'`, `isReadOnlyMode: true` forced
 * on the `executeAssignment` call) -- the whole standalone-session slice is
 * read-only per plan.md's Locked Product Decisions.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} [params.taskKey] Logical task identity for idempotent resume (default 'primary').
 * @param {string} params.objective
 * @param {string[]} [params.contextRefs]
 * @param {string[]} [params.constraints]
 * @param {string[]} params.expectedOutputs
 * @param {'reported'|'verified'} params.evidenceRequired
 * @param {string[]} [params.capabilities]
 * @param {object} [params.budget]
 * @param {string} params.writerId
 * @param {string} [params.parentAssignmentId]
 * @param {object} [opts] Forwarded to store.mjs/executeAssignment (cwd, repoRoot, runnerConfig, cliOverride, timeoutMs, ...)
 */
export async function dispatchPrimaryTask(
  coordinationId,
  { taskKey = 'primary', objective, contextRefs = [], constraints = [], expectedOutputs, evidenceRequired, capabilities, budget, writerId, parentAssignmentId },
  opts = {},
) {
  const manifest = readManifest(coordinationId, opts);
  const primaryActor = (manifest.actors ?? []).find((actor) => actor.id === PRIMARY_ACTOR_ID);
  if (!primaryActor) {
    throw new CoordinationError(
      'validation',
      `dispatchPrimaryTask: session "${coordinationId}" has no "${PRIMARY_ACTOR_ID}" actor bound -- open it with openStandaloneSession()`,
    );
  }

  // R5: session bounds enforced BEFORE materialization/launch -- same
  // wall-time/task-depth checks `dispatchDeclaredOperation` already applies
  // to the declared-protocol path (see that function's own module-level
  // comment, above `assertWithinWallTimeBudget`, for why neither check is
  // concurrency-sensitive and both are safe to run pre-lock here too). This
  // is the agent-led, undeclared-protocol path's own admission gate --
  // without it, a session opened via `openStandaloneSession` had NO
  // wall-time or task-depth enforcement at all, regardless of what
  // `aggregateBounds` declared.
  assertWithinWallTimeBudget(manifest, 'dispatchPrimaryTask');
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  assertWithinTaskDepth(fgosDir, parentAssignmentId, manifest.aggregateBounds.maxTaskDepth, 'dispatchPrimaryTask');

  const contract = buildSessionContract({
    objective,
    contextRefs,
    constraints,
    expectedOutputs,
    evidenceRequired,
    role: primaryActor.role,
    capabilities,
    budget,
    timeoutMs: opts.timeoutMs,
  });
  const caller = { writerId, ...(parentAssignmentId !== undefined ? { parentAssignmentId } : {}) };

  // R5 (continued): the 3 remaining, concurrency-sensitive bounds
  // (maxAssignments/maxConcurrency/maxRounds, session-wide) are forwarded
  // unconditionally and enforced authoritatively inside
  // `createSessionAssignment`'s own lock (store.mjs) -- same reasoning and
  // forwarding shape as `dispatchDeclaredOperation`'s own call below. Before
  // this fix, this was the ONE bound-enforcement gap in this file: the
  // primary-task dispatch path forwarded none of these three, so a session
  // opened via `openStandaloneSession` could create Assignments past its own
  // declared `aggregateBounds.maxAssignments`/`maxConcurrency`/`maxRounds`
  // ceiling with no error at all (confirmed empirically before this fix).
  return createAndExecuteSessionTask(
    { coordinationId, taskKey, actorId: PRIMARY_ACTOR_ID, contract, caller },
    {
      ...opts,
      maxAssignmentsForSession: manifest.aggregateBounds.maxAssignments,
      maxConcurrencyForSession: manifest.aggregateBounds.maxConcurrency,
      maxRoundsForSession: manifest.aggregateBounds.maxRounds,
    },
  );
}

/**
 * Validate a proposed dynamic consult BEFORE any Assignment is created for
 * it (R6). Pure w.r.t. execution -- throws `CoordinationError` on the
 * first violated rule, never dispatches. Exported separately from
 * `proposeConsult` so negative tests can assert each rejection reason
 * directly without needing a real (or injected) executor at all.
 *
 * Checks, in order: mutation must be read-only; role must be legal/known
 * (READ_ONLY_ROLES); objective non-empty and bounded; evidence.required
 * declared; contextRefs shape; session active; primaryAssignmentId is a
 * real member of this session AND actually belongs to the primary actor
 * (which is what makes the consult's `caller.parentAssignmentId` a true
 * reference to the primary's Assignment, ADR-006); exactly one consult
 * round (no specialist actor already bound); aggregateBounds.maxAssignments
 * would not be exceeded; contextRefs do not leak a foreign Assignment or a
 * different session's id.
 */
export function validateConsultProposal(
  coordinationId,
  { primaryAssignmentId, specialistActorId = DEFAULT_SPECIALIST_ACTOR_ID, role, objective, evidenceRequired, contextRefs = [], mutation = 'read-only' },
  opts = {},
) {
  if (!isNonEmptyString(primaryAssignmentId)) {
    throw new CoordinationError('validation', 'proposeConsult: primaryAssignmentId is required');
  }
  if (mutation !== 'read-only') {
    throw new CoordinationError(
      'validation',
      `proposeConsult: mutation "${mutation}" is rejected -- the whole standalone-session slice is read-only (plan.md Locked Product Decisions: "Standalone proofs are read-only")`,
    );
  }
  assertKnownReadOnlyRole(role, 'proposeConsult');
  if (!isNonEmptyString(objective) || objective.length > CONSULT_OBJECTIVE_MAX_LENGTH) {
    throw new CoordinationError(
      'validation',
      `proposeConsult: objective must be a non-empty, bounded string (max ${CONSULT_OBJECTIVE_MAX_LENGTH} characters)`,
    );
  }
  if (!EVIDENCE_REQUIRED_VALUES.has(evidenceRequired)) {
    throw new CoordinationError('validation', 'proposeConsult: evidence.required must be declared ("reported" or "verified")');
  }
  if (!Array.isArray(contextRefs) || !contextRefs.every(isNonEmptyString)) {
    throw new CoordinationError('validation', 'proposeConsult: contextRefs must be an array of strings');
  }

  const { manifest, assignmentRefs, events } = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);

  if (manifest.status !== 'active') {
    throw new CoordinationError('validation', `proposeConsult: session "${coordinationId}" is not active (status: "${manifest.status}")`);
  }
  if (!assignmentRefs.includes(primaryAssignmentId)) {
    throw new CoordinationError('validation', `proposeConsult: primaryAssignmentId "${primaryAssignmentId}" is not a member of session "${coordinationId}"`);
  }
  const primaryCreatedEvent = events.find(
    (event) => event.type === 'assignment-created' && event.payload.assignmentId === primaryAssignmentId,
  );
  if (!primaryCreatedEvent || primaryCreatedEvent.payload.actorId !== PRIMARY_ACTOR_ID) {
    throw new CoordinationError('validation', `proposeConsult: primaryAssignmentId "${primaryAssignmentId}" is not the primary actor's Assignment`);
  }

  // R5: session bounds enforced BEFORE materialization -- same wall-time/
  // task-depth checks `dispatchDeclaredOperation` applies to the declared-
  // protocol path (module-level comment above `assertWithinWallTimeBudget`
  // for why both are safe pre-lock/unlocked checks). `primaryAssignmentId`
  // is the consult's real `parentAssignmentId` (`proposeConsult` always sets
  // `caller.parentAssignmentId = primaryAssignmentId`, never caller-
  // overridable), so task depth is measured from there, exactly mirroring
  // `recordConsultDisposition`'s own placement of this identical check.
  assertWithinWallTimeBudget(manifest, 'proposeConsult');
  assertWithinTaskDepth(fgosDir, primaryAssignmentId, manifest.aggregateBounds.maxTaskDepth, 'proposeConsult');

  // Exactly ONE request/response round (this engine's documented
  // interpretation, module header): reject once a DIFFERENT non-primary
  // actor is already bound. Resuming the SAME specialistActorId (R7: the
  // engine's resume path must reuse the same taskKey/actor identity, never
  // mint a second one) is not a new round -- it is the idempotent retry
  // this whole mechanism exists to support. A resume that names the same
  // actor id but a DIFFERENT role is a genuine conflict, not a retry, and
  // is rejected.
  const existingSpecialists = (manifest.actors ?? []).filter((actor) => actor.id !== PRIMARY_ACTOR_ID);
  const conflictingSpecialist = existingSpecialists.find((actor) => actor.id !== specialistActorId);
  if (conflictingSpecialist) {
    throw new CoordinationError(
      'validation',
      `proposeConsult: session "${coordinationId}" already has a specialist actor bound ("${conflictingSpecialist.id}") -- exactly one consult round is allowed per session`,
    );
  }
  const resumingSpecialist = existingSpecialists.find((actor) => actor.id === specialistActorId);
  if (resumingSpecialist && resumingSpecialist.role !== role) {
    throw new CoordinationError(
      'validation',
      `proposeConsult: specialist actor "${specialistActorId}" is already bound with role "${resumingSpecialist.role}", which conflicts with the requested role "${role}"`,
    );
  }

  // A resume of the SAME specialist actor references an aggregate count
  // that already includes its own prior Assignment -- only a genuinely NEW
  // consult (no specialist bound yet) needs the "would exceed" check.
  if (!resumingSpecialist && assignmentRefs.length >= manifest.aggregateBounds.maxAssignments) {
    throw new CoordinationError(
      'validation',
      `proposeConsult: aggregateBounds.maxAssignments (${manifest.aggregateBounds.maxAssignments}) would be exceeded by this consult`,
    );
  }

  // Context visibility / sibling leakage: a contextRef naming another real,
  // on-disk Assignment must belong to THIS session; a contextRef naming a
  // coordination session id must be THIS session. A string that merely
  // resembles an id but does not exist on disk is left to the generic
  // execution-contract validator (it only requires contextRefs to be
  // strings) -- this check exists to catch a genuine foreign-state leak,
  // not to police contextRef naming conventions.
  assertRefsOwnedBySession(contextRefs, {
    coordinationId,
    assignmentRefs,
    fgosDir,
    label: 'proposeConsult: contextRefs entry',
  });

  return { manifest, assignmentRefs };
}

/**
 * Validate (via `validateConsultProposal`) then dispatch exactly one
 * dynamic consult Assignment for a specialist actor, under the primary
 * actor's Assignment as `caller.parentAssignmentId` (ADR-006's existing
 * field, reused unchanged -- never caller-overridable here, always set to
 * `primaryAssignmentId` by construction).
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.primaryAssignmentId
 * @param {string} [params.specialistActorId] Default 'specialist'.
 * @param {string} params.role Must be a legal/known read-only role.
 * @param {string} params.objective
 * @param {string[]} [params.contextRefs]
 * @param {string[]} [params.constraints]
 * @param {string[]} params.expectedOutputs
 * @param {'reported'|'verified'} params.evidenceRequired
 * @param {string[]} [params.capabilities]
 * @param {object} [params.budget]
 * @param {string} params.writerId
 * @param {string} [params.taskKey] Default `consult:<specialistActorId>`.
 * @param {object} [opts]
 */
export async function proposeConsult(
  coordinationId,
  {
    primaryAssignmentId,
    specialistActorId = DEFAULT_SPECIALIST_ACTOR_ID,
    role,
    objective,
    contextRefs = [],
    constraints = [],
    expectedOutputs,
    evidenceRequired,
    capabilities,
    budget,
    writerId,
    taskKey,
  },
  opts = {},
) {
  validateConsultProposal(coordinationId, { primaryAssignmentId, specialistActorId, role, objective, evidenceRequired, contextRefs }, opts);

  const manifest = readManifest(coordinationId, opts);
  const existingSpecialist = (manifest.actors ?? []).find((actor) => actor.id === specialistActorId);
  if (!existingSpecialist) {
    // `primaryActorId` makes this bind the SAME lock-held critical section
    // that actually enforces "at most one specialist actor, ever" -- the
    // earlier `validateConsultProposal` call above is a fast, cheap,
    // UNLOCKED pre-check (still useful for the ordinary sequential-caller
    // case) but is not by itself atomic with this write across two
    // processes. See store.mjs's `bindActor` doc comment for the full
    // cross-process TOCTOU this closes.
    bindActor(coordinationId, { id: specialistActorId, role }, { ...opts, primaryActorId: PRIMARY_ACTOR_ID });
  } else if (existingSpecialist.role !== role) {
    // This SECOND, later, independent read of manifest state can observe a
    // specialist bound by a DIFFERENT racing caller AFTER the earlier
    // validateConsultProposal call above already passed against a stale,
    // pre-bind manifest -- the resuming caller then skips bindActor
    // entirely (the branch above), bypassing the HIGH fix's own invariant
    // check. Re-check the role here, against this fresher read, mirroring
    // validateConsultProposal's own resumingSpecialist.role comparison, so
    // a role-mismatched "resume" is rejected instead of silently returning
    // another caller's Assignment under a different role.
    throw new CoordinationError(
      'validation',
      `proposeConsult: specialist actor "${specialistActorId}" is already bound with role "${existingSpecialist.role}", which conflicts with the requested role "${role}"`,
    );
  }

  const contract = buildSessionContract({
    objective,
    contextRefs,
    constraints,
    expectedOutputs,
    evidenceRequired,
    role,
    capabilities,
    budget,
    timeoutMs: opts.timeoutMs,
  });
  const caller = { writerId, parentAssignmentId: primaryAssignmentId };

  // R5 (continued): forward the 3 concurrency-sensitive session-wide bounds,
  // same shape as `dispatchDeclaredOperation`/`recordConsultDisposition`
  // below -- `validateConsultProposal`'s own `maxAssignments` check above is
  // a fast, unlocked pre-check only (same TOCTOU caveat as its "exactly one
  // specialist" bindActor race, documented at that call site); this is the
  // authoritative, lock-held enforcement inside `createSessionAssignment`.
  return createAndExecuteSessionTask(
    { coordinationId, taskKey: taskKey ?? `consult:${specialistActorId}`, actorId: specialistActorId, contract, caller },
    {
      ...opts,
      maxAssignmentsForSession: manifest.aggregateBounds.maxAssignments,
      maxConcurrencyForSession: manifest.aggregateBounds.maxConcurrency,
      maxRoundsForSession: manifest.aggregateBounds.maxRounds,
    },
  );
}

// ─── Phase 03 R1-R4: declared CoordinationProtocol materialization ────────
//
// Everything below is a SECOND, EXPLICIT, opt-in caller of the exact same
// `createAndExecuteSessionTask` primitive `dispatchPrimaryTask`/
// `proposeConsult` already use above -- never a second execution core. The
// only new execution-adjacent call in this block is `mergePolicyStack()`
// (`../definitions/schema.mjs`, P02.1's own PolicyPatch monotonicity
// validator, reused unmodified -- this file never reimplements the
// "minTier may only raise, never lower" rule), plus one small, additive,
// backward-compatible extension to `dispatch/assignment-policy.mjs`'s own
// `resolveAssignmentDispatchPolicy()` (see that module's header) that lets
// this file report WHICH scope in a fuller precedence chain produced a
// `cliOverride`-carried value, instead of that resolver's generic
// `{scope:'cliOverride'}` label.
//
// A declared protocol never writes a concrete `preferExecutor`/model pin at
// a portable scope (definition/operation/role/actor): `assertNoPortableExecutorPin`
// below rejects that BEFORE any Assignment is created, matching R1's own
// words ("protocol materialization never writes a concrete executor/model
// into the contract") and flow-definition.md's PolicyPatch section ("a
// portable CoordinationProtocol ... expresses requirements, not literal
// executor/model pins"). Only the `assignment`/`cli` scopes -- a trusted,
// caller-supplied, session-specific override -- may legally carry one;
// governance (`options.disallowedProviders`/`disallowedExecutors`, resolved
// downstream inside `executeAssignment`/`resolveAssignmentDispatchPolicy`,
// unchanged) still has the final veto regardless.

// Scopes a portable FlowDefinition materialization may never pin a literal
// executor at (flow-definition.md PolicyPatch section). `assignment` (a
// caller-supplied per-dispatch override, this cell's own concept, not a
// FlowDefinition field) and `cli` (the trusted human/CLI scope) are
// deliberately absent -- both are legitimate places for a concrete
// preference per the same contract section ("a trusted request/CLI actor
// preference may still select concrete infrastructure").
const PORTABLE_POLICY_SCOPES = new Set(['runner', 'definition', 'operation', 'role', 'actor']);

function assertNoPortableExecutorPin(scopeStack) {
  for (const entry of scopeStack) {
    if (PORTABLE_POLICY_SCOPES.has(entry.scope) && entry.policy && entry.policy.preferExecutor !== undefined) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: scope "${entry.scope}" (id: "${entry.id}") declares a literal preferExecutor "${entry.policy.preferExecutor}" -- a portable protocol/role/actor scope must express requirements (minTier, capabilities) only, never a concrete executor pin (flow-definition.md PolicyPatch section)`,
      );
    }
  }
}

/**
 * Source of the LAST (most specific) scope entry in `scopeStack` that sets
 * `field`, or `{scope: 'default'}` when none does. `minTier` is monotonic
 * (raise-only, enforced by `mergePolicyStack` itself, which throws before
 * this is ever consulted for an invalid stack) so the last entry to set it
 * is, by construction, the one that produced the final resolved value;
 * every other field here is already most-specific-wins per the contract, so
 * the same "last entry wins" rule applies identically. This function only
 * tracks PROVENANCE (which scope gets credit) -- it never recomputes or
 * second-guesses the actual resolved value, which stays `mergePolicyStack`'s
 * job alone.
 */
function lastSourceFor(scopeStack, field) {
  let source = { scope: 'default' };
  for (const entry of scopeStack) {
    if (entry.policy && entry.policy[field] !== undefined) {
      source = { scope: entry.scope, ...(entry.id !== undefined ? { id: entry.id } : {}) };
    }
  }
  return source;
}

/**
 * Resolve one ordered policy scope stack (least specific first) through
 * `mergePolicyStack` (reused, unmodified) and derive per-field provenance
 * alongside it. Rejects a portable-scope executor pin first (before even
 * attempting the merge), so a rejected materialization never partially
 * resolves a policy.
 *
 * @param {{scope: string, id?: string, policy: object}[]} scopeStack Ordered
 *   least-specific-first, per flow-definition.md's provenance scope order.
 * @returns {{merged: Readonly<object>, provenance: {tier: object, persona: object, executor: object, visibility: object}}}
 */
function resolveDeclaredPolicyStack(scopeStack) {
  assertNoPortableExecutorPin(scopeStack);
  const merged = mergePolicyStack(scopeStack.map(({ scope, id, policy }) => ({ scope, source: id, policy: policy ?? {} })));
  return {
    merged,
    provenance: {
      tier: lastSourceFor(scopeStack, 'minTier'),
      persona: lastSourceFor(scopeStack, 'preferPersona'),
      executor: lastSourceFor(scopeStack, 'preferExecutor'),
      visibility: lastSourceFor(scopeStack, 'visibility'),
    },
  };
}

/**
 * Resolve which declared `spec.operations[]` entry, graph node, and
 * `spec.actors[]` entry a `dispatchDeclaredOperation` call targets. Fails
 * closed (R1: "materialize ... legal operations") when the operation is
 * undeclared, unreachable from the graph, role-only (no actor binding --
 * out of this cell's scope, a Cohort Planner concern), or bound to an actor
 * whose declared role disagrees with the operation's own declared role (a
 * malformed definition, or a materialization-time actor-impersonation
 * shape R6's later negative sweep will exercise more fully).
 *
 * `targetActorId` (Phase 04 R5 addition): a Cohort's independent fan-out
 * branches legitimately share ONE `operationId` template across MULTIPLE
 * distinct actors (e.g. `independent-research` wired once per researcher
 * in the SAME graph node, one `{ref, actor}` pair per researcher) --
 * without a disambiguator, the previous "first match wins" behavior would
 * silently resolve every branch to the SAME single actor. When provided,
 * this selects the specific `{ref, actor}` pairing for `targetActorId`
 * instead of the first match; omitted (every pre-existing caller), it
 * keeps the exact prior behavior (first match across all nodes, in graph
 * order) byte-for-byte unchanged.
 */
/**
 * `true` when `operationId` is wired, ANYWHERE in `definition`'s graph, to a
 * binding that names `specialistSlotRef` rather than a static `actor`.
 *
 * A cheap, definition-only pre-check (no I/O) so `authorizeDeclaredOperation`/
 * `dispatchDeclaredOperation` only ever pay for a `replaySession()` call
 * when a specialist-slot binding is actually in play -- every pre-P09.2
 * fixture (no `specialistSlotRef` anywhere) takes byte-for-byte the same
 * path it always did, with zero extra replay cost.
 */
function definitionOperationUsesSpecialistSlot(definition, operationId) {
  for (const node of definition.spec.graph.nodes) {
    for (const ref of node.operations) {
      if (ref.ref === operationId && ref.specialistSlotRef !== undefined) return true;
    }
  }
  return false;
}

/**
 * The session-wide "current round" used ONLY to gate specialist-slot
 * liveness (`resolveLiveSpecialistBindings`, below) -- never the same value
 * as `dispatchDeclaredOperation`'s own caller-supplied `round` parameter,
 * which remains a per-edge taskKey/maxRounds disambiguator unrelated to this
 * gate (see that function's own doc comment).
 *
 * Round-1 fix (Phase 09 P09.2, post-Red-Team): the ORIGINAL P09.2 shape
 * reused `dispatchDeclaredOperation`'s caller-supplied `round` for this gate
 * too. The one real production caller (`src/verbs/coordination/run.mjs`'s
 * "authorize" step) never forwarded `step.round` at all, so it always
 * defaulted to `1` -- and since `expiresAfterRound` is schema-validated as a
 * positive integer (always >= 1), that default structurally NEVER expired
 * anything through the real request-step path, no matter how much real
 * session progress had elapsed. Trusting a caller-supplied number for a
 * legality decision is exactly the bug class this track has already closed
 * four times (P06.2, P07.3, P07.4, P08.2); this gate now derives its own
 * round purely from replayed session state instead, with no caller input at
 * all.
 *
 * Derivation: one plus the count of `assignment-created` events already in
 * this session, session-wide (not scoped to any one actor/slot). This is a
 * real, monotonic quantity -- it can only ever increase, and only when a
 * real Assignment actually materializes -- so it cannot be gamed by a
 * caller the way a bare parameter could. It starts at 1 for a brand-new
 * session (matching the pre-fix default's own round-1 starting point, so an
 * authorization with `expiresAfterRound: 1` is still live for the session's
 * very first Assignment), and advances to 2 the moment that first Assignment
 * is created -- so `expiresAfterRound: 1` correctly means "good for exactly
 * one Assignment, session-wide, then expired."
 *
 * @param {ReturnType<import('./replay.mjs').replaySession>} replayed
 * @returns {number}
 */
function resolveCurrentSessionRound(replayed) {
  return replayed.events.filter((event) => event.type === 'assignment-created').length + 1;
}

/**
 * The specialist currently bound to each `topology.specialistSlots[]` slot,
 * for dispatch purposes, "now" meaning the REAL, internally-derived current
 * round (`resolveCurrentSessionRound`, above; Phase 09, P09.2, round-1 fix).
 *
 * "Live" is derived, never stored: the LAST (most recent, log-order)
 * pre-terminal `specialist-authorized` record for a given `slotId` is that
 * slot's current occupant -- a later authorization for the SAME slot IS the
 * supersession signal (mirroring `actor-replaced`'s own "last wins"
 * semantics, `buildActorReplacementMap` elsewhere in this file), so there
 * is no separate "specialist-superseded" event to look for. A slot with no
 * `specialist-authorized` record at all is simply absent from the returned
 * map.
 *
 * Expiry ("`expiresAfterRound` prevents future Assignments but never erases
 * actor/event history") is applied HERE, as a pure filter on the read side,
 * never by rewriting or deleting the authorization event: a slot whose
 * current authorization's `expiresAfterRound` is behind the real, derived
 * current round is treated as having no live occupant right now --
 * `resolveDeclaredOperationActor`'s existing "no specialist is currently
 * bound to that slot" refusal covers it for free, with no separate
 * expiry-specific error path to maintain. The expired record itself is
 * untouched in `replayed.specialistAuthorizations` and remains fully
 * inspectable there.
 *
 * Deliberately takes NO caller-supplied `round` at all (unlike the original
 * P09.2 shape) -- see `resolveCurrentSessionRound`'s own doc comment for
 * why a caller-trusted value is never acceptable for this specific legality
 * decision.
 *
 * @param {ReturnType<import('./replay.mjs').replaySession>} replayed
 * @returns {Map<string, object>} slotId -> live specialistAuthorization record
 */
export function resolveLiveSpecialistBindings(replayed) {
  const round = resolveCurrentSessionRound(replayed);
  const currentBySlot = new Map();
  for (const record of replayed.specialistAuthorizations) {
    currentBySlot.set(record.slotId, record); // log order: last write wins
  }
  const live = new Map();
  for (const [slotId, record] of currentBySlot) {
    if (round <= record.expiresAfterRound) live.set(slotId, record);
  }
  return live;
}

/**
 * Resolve the node-operation binding for `operationId` (optionally pinned to
 * `targetActorId`) into a concrete actor -- either a statically declared
 * `spec.actors[]` entry (`binding.actor`), or the currently-live specialist
 * bound to a declared slot (`binding.specialistSlotRef`, resolved against
 * `specialistBindings`, Phase 09 P09.2). This function stays pure/
 * definition-only: it does no I/O of its own, so a `specialistSlotRef`
 * binding is resolvable only when its CALLER already took a fresh
 * `replaySession()` and passed the live bindings in via
 * `resolveLiveSpecialistBindings` -- the exact same "caller reads the
 * session, this function only reasons about the definition" split
 * `deriveVisibilityWindowState`'s callers already follow.
 *
 * `specialistBindings` defaults to an empty Map, under which this function
 * is byte-for-byte identical to its pre-P09.2 behavior: no fixture without a
 * `specialistSlotRef` binding anywhere can observe any difference.
 */
function resolveDeclaredOperationActor(definition, operationId, targetActorId, specialistBindings = new Map()) {
  const operation = definition.spec.operations.find((op) => op.id === operationId);
  if (!operation) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" is not declared in this protocol's spec.operations`,
    );
  }

  const matches = [];
  for (const node of definition.spec.graph.nodes) {
    for (const ref of node.operations) {
      if (ref.ref === operationId) matches.push({ node, ref });
    }
  }
  // The effective actor id a binding currently resolves to -- a static
  // `actor` resolves to itself; a `specialistSlotRef` resolves to whichever
  // specialist is currently live for that slot (or `undefined`, if none is).
  // Matching by this derived id, rather than by `ref.actor` alone, is what
  // lets a caller find a specialist-filled binding by `targetActorId` the
  // exact same way it already finds a statically-bound one.
  const effectiveActorIdOf = (ref) =>
    ref.actor !== undefined ? ref.actor : ref.specialistSlotRef !== undefined ? specialistBindings.get(ref.specialistSlotRef)?.specialistActorId : undefined;

  const picked = targetActorId !== undefined ? matches.find((m) => effectiveActorIdOf(m.ref) === targetActorId) : matches[0];
  if (!picked) {
    // A `targetActorId` that names the specialist a slot-bound ref USED to
    // (or will) resolve to, but does not RIGHT NOW (no live binding, or an
    // expired one), gets its own more actionable refusal instead of the
    // generic "not wired" message below -- the binding IS wired to that
    // slot, it simply has no live occupant this round.
    const unboundSlotMatch = matches.find((m) => m.ref.specialistSlotRef !== undefined && specialistBindings.get(m.ref.specialistSlotRef) === undefined);
    if (targetActorId !== undefined && unboundSlotMatch) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" at node "${unboundSlotMatch.node.id}" is bound to specialist slot "${unboundSlotMatch.ref.specialistSlotRef}" -- no specialist is currently authorized for that slot in this session (or its authorization has expired), so this materialization requires an authorized specialist actor first`,
      );
    }
    throw new CoordinationError(
      'validation',
      targetActorId !== undefined
        ? `dispatchDeclaredOperation: operation "${operationId}" bound to actor "${targetActorId}" is not wired into this protocol's graph -- no node pairs this operation with that actor`
        : `dispatchDeclaredOperation: operation "${operationId}" is not wired into this protocol's graph -- an operation must be reachable from a node to be materialized`,
    );
  }
  const { node: matchedNode, ref: matchedRef } = picked;

  let actorEntry;
  if (matchedRef.specialistSlotRef !== undefined) {
    const bound = specialistBindings.get(matchedRef.specialistSlotRef);
    if (!bound) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" at node "${matchedNode.id}" is bound to specialist slot "${matchedRef.specialistSlotRef}" -- no specialist is currently authorized for that slot in this session (or its authorization has expired), so this materialization requires an authorized specialist actor first`,
      );
    }
    // Synthesized, not looked up in `spec.actors[]` -- a specialist is by
    // definition a previously-unknown identity the static actor roster
    // never declared. `id`/`role` are the only two fields any caller below
    // reads off an `actorEntry` (`persona`/`policy` are never populated for
    // a specialist; `dispatchDeclaredOperation`'s own policy stack reads
    // `actorEntry.policy ?? {}`, which degrades cleanly to `{}`).
    actorEntry = Object.freeze({ id: bound.specialistActorId, role: bound.role });
  } else if (matchedRef.actor === undefined) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" is role-only (no actor binding at node "${matchedNode.id}") -- this materialization requires a bound SessionActor`,
    );
  } else {
    actorEntry = (definition.spec.actors ?? []).find((a) => a.id === matchedRef.actor);
    if (!actorEntry) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" node "${matchedNode.id}" references actor "${matchedRef.actor}", which is not declared in spec.actors`,
      );
    }
  }
  if (actorEntry.role !== operation.role) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" declares role "${operation.role}", but its bound actor "${actorEntry.id}" declares role "${actorEntry.role}" -- actor/operation role mismatch`,
    );
  }

  // `binding` is the node-operation binding itself (`{ref, actor|
  // specialistSlotRef, activation?}`) -- the ONLY scope `activation` is
  // ever declared at, so every caller that needs the activation mode reads
  // it from here rather than from the shared `operation` template, which
  // can never carry one. `specialistAuthorization`, when present, is the
  // live `specialist-authorized` record this resolution used -- callers
  // that need the specialist's own `maxAssignments` cap (authorization
  // gating) read it from here rather than re-resolving it a second time.
  return {
    operation,
    actorId: actorEntry.id,
    actorEntry,
    node: matchedNode,
    binding: matchedRef,
    ...(matchedRef.specialistSlotRef !== undefined ? { specialistAuthorization: specialistBindings.get(matchedRef.specialistSlotRef) } : {}),
  };
}

/**
 * Resolve the ONE `operation-authorized` record (if any) that legitimately
 * authorizes this exact node-operation binding for this dispatch.
 *
 * Matching is by the FULL `(nodeId, operationId, targetActorId)` triple --
 * never by actor alone and never by operation id alone. Neither is
 * sufficient on its own, and both failure modes are real rather than
 * theoretical: one actor is routinely bound to several DIFFERENT operations
 * at several different graph nodes (a `reviewer` doing both the first-pass
 * review and a later recheck), and one operation template is routinely
 * bound at several different nodes and/or actors (an independent fan-out
 * cohort sharing one template). Under-disambiguating either way would let an
 * authorization issued for one graph position silently materialize a
 * different one.
 *
 * `resumedAssignmentId`, when supplied, is the Assignment a prior attempt
 * already claimed for this same taskKey. Its own already-consumed
 * authorization is preferred over an unconsumed one, so an idempotent resume
 * never spends a second authorization to redo work the first one already
 * paid for.
 */
function bindingAuthorizations(authorizations, { nodeId, operationId, targetActorId }) {
  return authorizations.filter(
    // Do NOT drop `record.nodeId === nodeId` as "redundant" on the strength
    // of a mutation test. Through the engine doors it can never discriminate
    // on its own -- `authorizeDeclaredOperation` writes `node.id` from the
    // same deterministic `resolveDeclaredOperationActor(definition,
    // operationId, targetActorId)` call this gate resolves through, so nodeId
    // is a pure function of the other two and no fixture can make dropping it
    // fail. It is still load-bearing at runtime: an authorization forged
    // straight through the raw `store.authorizeOperation` door with a real
    // operationId + targetActorId but a MISMATCHED nodeId reaches the log,
    // and this comparison is what refuses the dispatch.
    (record) => record.nodeId === nodeId && record.operationId === operationId && record.targetActorId === targetActorId,
  );
}

function resolveBindingAuthorization(authorizations, { nodeId, operationId, targetActorId, resumedAssignmentId }) {
  const forThisBinding = bindingAuthorizations(authorizations, { nodeId, operationId, targetActorId });
  const resumeMatch = resumedAssignmentId
    ? forThisBinding.find((record) => record.consumedByAssignmentId === resumedAssignmentId)
    : undefined;
  return resumeMatch ?? forThisBinding.find((record) => record.consumedByAssignmentId === null);
}

/**
 * "A recheck's idempotent-claim key (`taskKey`) MUST incorporate the new
 * artifact/evidence revision or the authorizing `invocationKey`/
 * `authorizationId`, so it can never collide with (be claim-equal to) the
 * original reviewing Assignment's own `taskKey`" (coordination-session.md,
 * "Recheck Is Not Retry"). This picks the authorization whose id becomes that
 * discriminator, BEFORE any taskKey exists to peek a claim record with:
 *
 * - an UNCONSUMED authorization for this binding is the invocation being
 *   spent, so its id keys a genuinely new Assignment -- structurally unable
 *   to be claim-equal to any earlier invocation's, or to the original
 *   binding's `nodeId`+`operationId`+`actorId`-derived key;
 * - with none left, the sole ALREADY-CONSUMED one (when there is exactly
 *   one) keeps a repeat call landing on the key its own invocation first
 *   claimed, so a genuine idempotent/crash resume still resolves to its own
 *   Assignment rather than minting a second one;
 * - two or more consumed and none pending is AMBIGUOUS -- a keyless caller
 *   cannot mean any specific one of them, and guessing would silently
 *   substitute a different invocation's Assignment/RunResult for the
 *   caller's own. Returns `null` in this case too.
 *
 * Returns `null` when the binding has no authorization at all -- the dispatch
 * gate below is what refuses that, with its own message.
 */
function resolveTaskKeyAuthorization(authorizations, binding) {
  const forThisBinding = bindingAuthorizations(authorizations, binding);
  const unconsumed = forThisBinding.find((record) => record.consumedByAssignmentId === null);
  if (unconsumed) return unconsumed;
  // No fresh authorization pending: this is either a genuine idempotent
  // resume (exactly one prior invocation was ever consumed at this binding
  // -- the ONLY shape resume actually needs) or an AMBIGUOUS repeat (two or
  // more invocations already consumed, none pending). Guessing "most
  // recent" in the ambiguous case would silently hand a keyless caller a
  // DIFFERENT invocation's Assignment/RunResult under its own key -- refuse
  // by returning null instead (the caller falls through to the unsuffixed
  // default taskKey, which no claim yet owns, and the dispatch gate's own
  // existing "no unconsumed authorization" refusal fires cleanly).
  const consumed = forThisBinding.filter((record) => record.consumedByAssignmentId !== null);
  return consumed.length === 1 ? consumed[0] : null;
}

/**
 * "Every `grantedContextRefs` entry must resolve to an artifact/ref owned by
 * this same `coordinationId` (this session); a ref belonging to a different
 * CoordinationSession is rejected."
 *
 * The ONE rule both `dispatchDeclaredOperation`'s grant-scope gate and
 * `validateConsultProposal`'s sibling/foreign-leakage check apply -- not two
 * divergent copies: a ref naming a real, on-disk Assignment that is not a
 * member of this session is a genuine foreign-state leak and is refused; a
 * ref naming a coordination session other than this one is refused BY DISK
 * EXISTENCE, not by a `coord_`-prefix naming convention (session ids carry
 * no required prefix), checked by PATH SEGMENT so a path-form ref into
 * another session's directory is caught the same as a bare id (see
 * `refSegments`); and a string that merely resembles an id but resolves to
 * nothing on disk is left alone, because this codebase has no artifact
 * registry to resolve it against and policing naming conventions is not
 * what this clause is for.
 */
// Checked by SEGMENT, not by whole-string prefix: a bare id like
// "coord_other" or "asgn_x" is its own single segment and keeps behaving
// exactly as before, but a PATH-FORM ref naming the same foreign
// session/Assignment (e.g. ".fgos/coordination/sessions/coord_other/
// events.jsonl") is caught too -- a whole-string `/^coord_/`/`/^asgn_/`
// test never fires on that shape, because the string does not itself start
// with either prefix.
function refSegments(ref) {
  return ref.split(/[\\/]/).filter(Boolean);
}

function assertRefsOwnedBySession(refs, { coordinationId, assignmentRefs, fgosDir, label }) {
  for (const ref of refs) {
    if (typeof ref !== 'string') {
      throw new CoordinationError('validation', `${label}: ref must be a string, got ${typeof ref}`);
    }
    // The third copy of the ownership rule (store.mjs's
    // `assertDispositionRefOwnedBySession` and show.mjs's
    // `isRefOwnedBySession` are the other two) recognizes MVP8's reserved
    // `contribution:` namespace too, so no copy silently accepts a ref shape
    // the others police. This door grants an Assignment READ access, and a
    // contribution is content-free by construction -- ref + revision, never a
    // body -- so there is nothing behind such a ref to grant. Refused flatly
    // rather than resolved against a contribution set: fail-closed, and it
    // needs no replay this pre-write path does not already have.
    if (ref.startsWith(CONTRIBUTION_REF_PREFIX)) {
      throw new CoordinationError(
        'validation',
        `${label}: ref "${ref}" is in the reserved "${CONTRIBUTION_REF_PREFIX}" namespace -- a contribution carries no content to grant, so it is not a grantable context ref (it is targetable only by a disposition)`,
      );
    }
    for (const segment of refSegments(ref)) {
      // Checked by DISK EXISTENCE, not by a `coord_` naming convention:
      // `openSession`/`openDeclaredProtocolSession` accept any
      // `assertSafeCoordinationId`-legal id (alnum/underscore/hyphen, no
      // required prefix), so a real foreign session named e.g. "privatebox"
      // is invisible to a prefix test. Mirrors the `asgn_` existence check
      // immediately below rather than diverging from it.
      if (segment !== coordinationId && fs.existsSync(path.join(fgosDir, 'coordination', 'sessions', segment, 'session.json'))) {
        throw new CoordinationError(
          'validation',
          `${label}: ref "${ref}" names a different coordination session -- cross-session grant authority is out of scope`,
        );
      }
      if (/^asgn_/.test(segment)) {
        const exists = fs.existsSync(path.join(fgosDir, 'assignments', segment, 'assignment.json'));
        if (exists && !assignmentRefs.includes(segment)) {
          throw new CoordinationError(
            'validation',
            `${label}: ref "${ref}" resolves to an Assignment that is not a member of coordination session "${coordinationId}" -- every granted ref must resolve to a ref owned by this same coordinationId`,
          );
        }
      }
    }
  }
}

// ─── Phase 06 R2 (P06.2): visibility-window runtime derivation ────────────
//
// A window's open/closed state is NEVER stored -- it is recomputed, fresh,
// from the SAME event-log primitives every other read-side reconstruction
// in this file already uses (`assignment-created`/`result-linked`/
// `actor-replaced`, plus the on-disk RunResult a `result-linked` event
// points at). `deriveVisibilityWindowState` is the ONE function both
// `authorizeDeclaredOperation` and `dispatchDeclaredOperation` call --
// never two independently-maintained copies -- and it is exported so a
// caller holding an independently-taken `replaySession()` result (replay's
// own reconstruction, or a test proving parity) reaches the identical
// verdict the live dispatch path would have reached from the same disk
// state, with no cache/latch anywhere in between (Bug Taxonomy: "a window
// that silently stays permanently open once any single source links").

/**
 * `oldActorId -> replacementActorId` for every ACCEPTED `actor-replaced`
 * event in `events`. Built once per `deriveVisibilityWindowState` call and
 * threaded through to `resolveOperationOutcome`, mirroring
 * `classifySessionQuorum`'s own `resolveEffectiveActor` map exactly (same
 * lineage-following semantics, independently built here so this module
 * stays a single self-contained read of the event log per call).
 */
function buildActorReplacementMap(events) {
  const map = new Map();
  for (const event of events) {
    if (event.type === 'actor-replaced') map.set(event.payload.oldActorId, event.payload.replacementActorId);
  }
  return map;
}

/**
 * EVERY distinct actor the graph binds `operationId` to, in graph order.
 *
 * One operation template is routinely bound to several actors (an
 * independent fan-out cohort sharing one template -- this repo's own
 * `independent-research-fan-out-fan-in.yaml` binds `independent-research` to
 * both `researcher-a` and `researcher-b` at one node), so resolving only the
 * FIRST binding would let one cohort member's result answer for the whole
 * cohort. Each candidate is re-resolved through
 * `resolveDeclaredOperationActor` with its own `targetActorId` so every
 * binding gets the identical declared/role/actor validation the single-
 * binding resolver applies -- never a second, looser copy of those rules.
 *
 * With no actor-bound match at all (undeclared operation, unwired from the
 * graph, or every binding role-only), the single-binding resolver is called
 * for its own named `CoordinationError`. Note the deliberate narrowing: an
 * operation with a MIX of role-only and actor-bound bindings now resolves
 * through its actor-bound ones instead of raising the single-binding
 * resolver's role-only error, which fired whenever the FIRST graph match
 * happened to be the role-only one. Role-only bindings are a Cohort Planner
 * concern out of this cell's scope; they contribute no branch either way,
 * and positive operation proof is still required for every branch that does.
 */
/** Does any graph node pair `operationId` with a concrete actor? */
function hasBoundActor(definition, operationId) {
  return definition.spec.graph.nodes.some((node) => node.operations.some((ref) => ref.ref === operationId && ref.actor));
}

function declaredOperationBindingActors(definition, operationId) {
  const actorIds = [];
  for (const node of definition.spec.graph.nodes) {
    for (const ref of node.operations) {
      if (ref.ref === operationId && ref.actor && !actorIds.includes(ref.actor)) actorIds.push(ref.actor);
    }
  }
  if (actorIds.length === 0) return [resolveDeclaredOperationActor(definition, operationId).actorId];
  return actorIds.map((actorId) => resolveDeclaredOperationActor(definition, operationId, actorId).actorId);
}

/**
 * P10-KERNEL-FIX (Step 09 MVP6-9, Phase 10 group-thinking-lite cross-cell
 * finding -- P10.6/P10.7/P10.8): the graph-declared operation ids that GATE
 * `actorId`'s own quorum completion for a declared-protocol session --
 * `classifySessionQuorum`'s multi-operation-aware path, below.
 *
 * Every `required` binding gates completion (this is `classifySessionQuorum`'s
 * pre-existing, always-correct semantics for the single-op-per-actor shape
 * this mechanism was originally built for -- unchanged). ADDITIONALLY, a
 * `driver-authorized` binding gates completion too, but ONLY when it ALSO
 * declares `contextAccess.visibilityWindowRef` -- a REAL, later phase of the
 * SAME actor's own work, gated by the MVP6 visibility-window mechanism
 * purely for ACCESS CONTROL (the driver must explicitly grant read access to
 * upstream context before this actor may act), never a genuinely optional
 * branch. RFC-Review-Lite's `respond`, Nominal-Group-Lite's `share`/`clarify`
 * are exactly this shape: each is `driver-authorized` (the driver must
 * `authorizeDeclaredOperation` it before it can dispatch), but the protocol's
 * own fixed 4-phase pipeline always reaches it -- there is no real usage
 * where the driver decides to skip it forever.
 *
 * A `driver-authorized` binding with NO `contextAccess.visibilityWindowRef`
 * is deliberately EXCLUDED from the gating set -- it is a free-standing
 * driver's-choice branch, not a graph-gated later phase of the same actor's
 * work. `standalone-master-coordination-loop.yaml`'s `revise-candidate`/
 * `reviewer-recheck`/`red-team-recheck` are exactly this shape (no
 * `spec.profile.topology`/visibility windows declared anywhere in that
 * fixture at all): the driver may legitimately never authorize a revision
 * round, and `coordination-launch-master-loop.test.mjs`'s own
 * `coord_launcher_live` case already proves and depends on the session
 * correctly staying open (actor "fixer" reported `missing`) when that
 * happens -- counting an ungated driver-authorized binding here would
 * regress that real, already-shipped test. See this file's own
 * P10-KERNEL-FIX.md Design Notes for the full investigation (including why
 * the simpler "count every required binding, ignore every driver-authorized
 * one" framing this cell started from is not sufficient on its own: it
 * reproduces P10.6/P10.7's own bug unchanged, since RFC-Review-Lite's
 * `respond` and Nominal-Group-Lite's `share`/`clarify` are ALL
 * `driver-authorized`, never `required`).
 *
 * Returns `[]` when `actorId` has no gating binding anywhere in the graph
 * (every binding it has, if any, is an ungated driver-authorized one) --
 * `classifySessionQuorum`'s caller falls back to the pre-existing
 * "first-assignment-ever, for this actor" rule for exactly that actor. That
 * fallback is NOT byte-identical behavior for a gating actor, only for a
 * NON-gating one (P10-KERNEL-FIX Fix Round 1, HIGH-3, redteam-report.md):
 * the fallback accepts ANY `assignment-created` event for the actor,
 * however it arrived, while the gating path above demands an
 * operation-stamped, settled Assignment (`resolveBindingOutcome` /
 * `assignmentServesOperation`). An actor with at least one gating binding
 * genuinely trades the loose fallback for the stricter stamped check --
 * this is what keeps `fixer`, above, `missing` until its own sole binding
 * actually dispatches, and what keeps every single-op-per-actor fixture
 * -- declared-consult, standalone sessions, research fan-out/fan-in, MVP7
 * aggregation-close, group-cognition-framework -- passing today, since
 * their own Assignments arrive stamped through `dispatchDeclaredOperation`.
 * A single-`required`-op actor whose Assignment instead arrives through a
 * non-stamping public door (`createSessionAssignment`/`dispatchPrimaryTask`/
 * `proposeConsult` -- `assertNoReservedOperationStamp` actively forbids a
 * caller-supplied stamp on those) can never satisfy a gating binding and
 * would be permanently unclosable. Confirmed currently LATENT: no
 * `runCoordinationUseCase` path reaches this today (the `agent-led` branch
 * uses `openStandaloneSession`, which has no `definitionRef`) -- named here,
 * and in P10-KERNEL-FIX.md's own Gaps, for whichever door reaches this path
 * next.
 */
function actorGatingOperationIds(definition, actorId) {
  // MVP7 (Phase 07): the protocol's own `completion.aggregation.
  // outputOperationRef`, when declared, names the operation that the
  // aggregation's OWN output represents -- but `validateSessionAggregation`
  // never requires a dispatched Assignment for it (its own `assignmentId`/
  // `runId`/`outputArtifactRef` params are all optional, and every real
  // caller -- test/verbs/coordination-aggregation-surface.test.mjs,
  // test/runner/coordination-aggregation.test.mjs -- validates without
  // supplying any of them). Its completion is represented by the validated
  // `aggregation-validated` event `closeSessionByQuorum`'s own `aggregationId`
  // param consults, a SEPARATE narrowing gate on top of quorum, never by a
  // literal operation-stamped Assignment -- so it is excluded from gating
  // here, or it would permanently block the bound actor (confirmed
  // empirically: without this exclusion, this fixture's own coordinator-actor,
  // bound to both `review` [required] and `synthesize` [required,
  // `outputOperationRef`], never settles `synthesize` as a real Assignment
  // anywhere in either test file, and would stay "missing" forever).
  //
  // P10-KERNEL-FIX Fix Round 1 (MEDIUM-5, redteam-report.md): the exclusion
  // is scoped to the actor the graph itself binds to the aggregation's
  // `outputOperationRef` -- never to every actor who happens to share that
  // operation id for an unrelated reason. A different actor bound to the
  // same operation id keeps that binding as an ordinary gating operation,
  // needing its own real settled Assignment like any other.
  //
  // P10-KERNEL-FIX Fix Round 2 (N4/NEW-MEDIUM-C, redteam-recheck-report.md):
  // Fix Round 1 designated "the" aggregation actor as whichever binding came
  // FIRST in graph order -- ambiguous and authoring-order-dependent when 2+
  // actors legitimately bind the same `outputOperationRef` (a semantic no-op
  // reordering of two sibling entries in one node's `operations[]` silently
  // flipped who was excused and who deadlocked permanently, since
  // `validateSessionAggregation` never materializes an Assignment for this
  // operation for ANY actor). This is a kernel session-engine cell, not a
  // schema cell, so no heuristic picks a "correct" designated actor: the
  // exclusion applies ONLY when EXACTLY ONE actor's binding matches
  // `outputOperationRef` anywhere in the graph. When 2+ distinct actors bind
  // it, NO exclusion applies to any of them -- every such actor falls back
  // to ordinary required-operation gating, the same conservative default
  // this fix already uses elsewhere for ambiguous/unclear cases. See
  // P10-KERNEL-FIX.md §5 Gaps for the 2+-actors shape (a future cell may
  // want schema-level rejection instead -- not built here).
  const aggregationOutputOperationRef = definition.spec.profile.completion?.aggregation?.outputOperationRef;
  let aggregationActorId;
  if (aggregationOutputOperationRef !== undefined) {
    const boundActorIds = new Set();
    for (const node of definition.spec.graph.nodes) {
      for (const ref of node.operations) {
        if (ref.ref === aggregationOutputOperationRef && ref.actor) boundActorIds.add(ref.actor);
      }
    }
    if (boundActorIds.size === 1) {
      [aggregationActorId] = boundActorIds;
    }
  }

  const operationIds = [];
  for (const node of definition.spec.graph.nodes) {
    for (const ref of node.operations) {
      if (ref.actor !== actorId) continue;
      if (ref.ref === aggregationOutputOperationRef && actorId === aggregationActorId) continue;
      const mode = activationModeOf(ref);
      const gates = mode === 'required' || (mode === 'driver-authorized' && ref.contextAccess?.visibilityWindowRef !== undefined);
      if (gates && !operationIds.includes(ref.ref)) operationIds.push(ref.ref);
    }
  }
  return operationIds;
}

/**
 * Does this Assignment carry the reserved engine stamp for EXACTLY this
 * declared operation? That is the whole question, and the ONLY channel that
 * can answer it.
 *
 * `opensAfter.operationRefs[]` names a `spec.operations[]` template -- a
 * DECLARED operation -- and `dispatchDeclaredOperation` is the only door in
 * this codebase that materializes one. It stamps unconditionally, before any
 * caller input is consulted, so requiring the stamp costs a legitimate source
 * nothing. Everything else -- an ad-hoc primary task, a consult proposal, a
 * disposition, an Assignment that merely happens to share a claim key or an
 * actor -- is not a declared operation completing, and must never be read as
 * one.
 *
 * The three earlier, weaker predicates were each removed for the same reason:
 * they answered "which operation" from a channel some OTHER door could also
 * write.
 * - Actor identity alone: one actor is routinely bound to several different
 *   operations, and an `actor-replaced` replacement can complete work that has
 *   nothing to do with the obligation it inherited.
 * - The claiming taskKey's `declared:<operationId>` namespace: `taskKey` is a
 *   documented public parameter on more than one mediated door, so consulting
 *   it let ANY door that did not stamp -- `dispatchPrimaryTask` above, reached
 *   through its own exported signature and through the CLI request file --
 *   assert an operation identity it never performed.
 * - `assignment-created.payload.operationId`: engine-derived, but only ever
 *   written by `dispatchDeclaredOperation`'s own driver-authorized branch
 *   (`authorizationProvenance`, the single producer in this file), which
 *   stamps the very same Assignment. It could therefore never satisfy a source
 *   the stamp did not already satisfy -- redundant on every mediated path, and
 *   a second forgeable surface on the unmediated one.
 *
 * What makes the stamp different in kind, rather than merely a fourth door:
 * `PROTOCOL_OPERATION_STAMP_PREFIX` is a RESERVED namespace,
 * `buildSessionContract` refuses any caller-supplied entry in it, and
 * `dispatchDeclaredOperation` is the sole caller that passes
 * `protocolOperationRef`. So "which door remembered to stamp" stops being a
 * question a future door can get wrong: a door that does not stamp produces
 * Assignments that satisfy NO window source, which is the safe answer by
 * construction rather than by enumeration.
 */
function assignmentServesOperation(definition, operationId, { assignmentId, fgosDir }) {
  const assignmentPath = path.join(fgosDir, 'assignments', assignmentId, 'assignment.json');
  if (!fs.existsSync(assignmentPath)) return false;
  let assignment;
  try {
    assignment = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
  } catch (err) {
    throw new CoordinationError('corrupt-log', `assignment.json at ${assignmentPath} is not valid JSON: ${err.message}`);
  }
  const constraints = assignment?.provenance?.inline?.contract?.constraints;
  // Exact equality, never a prefix/substring test: a leading space or a
  // different casing dodges the writer's guard and fails this comparison too.
  // A NON-STRING forgery (a boxed `String`, a `toJSON` object) is a different
  // story and this reader is NOT what stops it -- such a value would
  // JSON-round-trip into a plain string and match here. It never reaches disk
  // because `validateExecutionContract`'s `isStringArray`
  // (`../dispatch/execution-contract.mjs`) runs inside `buildAssignment`
  // BEFORE persistence and rejects a `constraints` array that is not all
  // primitive strings. That ordering is the load-bearing part: this reader
  // alone would accept a boxed-String forgery.
  return Array.isArray(constraints) && constraints.includes(protocolOperationStamp(definition, operationId));
}

/**
 * Classify ONE already-operation-verified Assignment exactly the way
 * `classifySessionQuorum`/`synthesizeResearchFanIn` already classify a
 * settled Assignment -- the SAME failed/late vocabulary, never a second one.
 */
function classifyOperationAssignment(events, fgosDir, effectiveActorId, assignmentId) {
  const linkedEvent = lastEventFor(events, 'result-linked', assignmentId);
  if (!linkedEvent) return { satisfied: false, reason: 'late', actorId: effectiveActorId, assignmentId };
  const runResult = readLinkedRunResultFromDisk(fgosDir, assignmentId, linkedEvent.payload.runId);
  if (runResult.status === 'failed' || runResult.confidence === 'failed' || runResult.confidence === 'no-evidence') {
    return { satisfied: false, reason: 'failed', actorId: effectiveActorId, assignmentId, runId: runResult.runId };
  }
  return { satisfied: true, reason: null, actorId: effectiveActorId, assignmentId, runId: runResult.runId };
}

/**
 * The outcome of ONE graph binding of a source operation: follow any accepted
 * `actor-replaced` lineage to the CURRENT effective actor (so "the
 * replacement's own result-linked counts toward the window; the original
 * failed/missing attempt's event stays in the log, untouched" holds without
 * rewriting or re-deriving anything from the original attempt), then classify
 * the Assignments that actor was given FOR THIS OPERATION
 * (`assignmentServesOperation` -- the lineage transfers the obligation, never
 * a licence for any work at all to answer it):
 * - no operation-verified `assignment-created` for the effective actor ->
 *   `'missing'`.
 * - created but no `result-linked` yet -> `'late'`.
 * - linked but `runResult.status === 'failed'` or `confidence` in
 *   `{failed, no-evidence}` -> `'failed'`.
 * - otherwise -> satisfied.
 *
 * With several attempts toward the same binding (a re-attempt after a failed
 * one), a satisfied attempt settles the binding and the unsatisfied
 * attempts' events stay on the log untouched; with none satisfied, the LAST
 * attempt in event order is the reported outcome.
 */
function resolveBindingOutcome(definition, operationId, boundActorId, { events, fgosDir, replacedBy }) {
  let effectiveActorId = boundActorId;
  const seen = new Set();
  while (replacedBy.has(effectiveActorId) && !seen.has(effectiveActorId)) {
    seen.add(effectiveActorId);
    effectiveActorId = replacedBy.get(effectiveActorId);
  }

  const assignmentIds = events
    .filter(
      (event) =>
        event.type === 'assignment-created' &&
        event.payload.actorId === effectiveActorId &&
        assignmentServesOperation(definition, operationId, { assignmentId: event.payload.assignmentId, fgosDir }),
    )
    .map((event) => event.payload.assignmentId);

  if (assignmentIds.length === 0) {
    return { boundActorId, satisfied: false, reason: 'missing', actorId: effectiveActorId, assignmentId: null };
  }
  let lastOutcome;
  for (const assignmentId of assignmentIds) {
    lastOutcome = classifyOperationAssignment(events, fgosDir, effectiveActorId, assignmentId);
    if (lastOutcome.satisfied) return { boundActorId, ...lastOutcome };
  }
  return { boundActorId, ...lastOutcome };
}

/**
 * The outcome of ONE `opensAfter.operationRefs[]` entry: satisfied only when
 * EVERY graph binding of that operation is satisfied. A source operation
 * wired to a fan-out cohort is the whole cohort's obligation, not the first
 * contributor's -- opening on one branch would be exactly the partial-window
 * bypass the all-of rule across `operationRefs[]` itself already refuses, one
 * level deeper.
 */
function resolveOperationOutcome(definition, operationId, ctx) {
  const branches = declaredOperationBindingActors(definition, operationId).map((boundActorId) =>
    resolveBindingOutcome(definition, operationId, boundActorId, ctx),
  );
  const reported = branches.find((branch) => !branch.satisfied) ?? branches[0];
  return {
    operationRef: operationId,
    satisfied: branches.every((branch) => branch.satisfied),
    reason: reported.reason,
    actorId: reported.actorId,
    assignmentId: reported.assignmentId,
    ...(reported.runId !== undefined ? { runId: reported.runId } : {}),
    branches: Object.freeze(branches.map((branch) => Object.freeze(branch))),
  };
}

/**
 * Derive whether `windowId` (a `spec.profile.topology.visibilityWindows[]`
 * entry on `definition`) is currently OPEN: true iff EVERY
 * `opensAfter.operationRefs[]` entry resolves to a satisfied
 * `resolveOperationOutcome` (see above) -- a partial subset never opens it
 * (Bug Taxonomy: "a partial-window bypass"). Pure function of `replayed`
 * (a `replaySession()` result -- live dispatch and an independently-taken
 * replay both pass one) and `fgosDir`; never reads or writes any stored
 * "window state" of its own.
 *
 * @param {object} definition Loaded FlowDefinition (`loadCoordinationProtocol`).
 * @param {string} windowId
 * @param {{manifest: object, events: object[]}} replayed A `replaySession()` result.
 * @param {string} fgosDir
 * @returns {Readonly<{window: object, open: boolean, sources: Readonly<object>[]}>}
 */
export function deriveVisibilityWindowState(definition, windowId, replayed, fgosDir) {
  const window = (definition.spec.profile.topology?.visibilityWindows ?? []).find((w) => w.id === windowId);
  if (!window) {
    throw new CoordinationError(
      'dangling-ref',
      `deriveVisibilityWindowState: visibility window "${windowId}" is not declared on protocol "${definition.metadata.id}@${definition.metadata.version}"`,
    );
  }
  const replacedBy = buildActorReplacementMap(replayed.events);
  const sources = window.opensAfter.operationRefs.map((operationRef) =>
    resolveOperationOutcome(definition, operationRef, { events: replayed.events, fgosDir, replacedBy }),
  );
  const open = sources.every((source) => source.satisfied);
  return Object.freeze({ window, open, sources: Object.freeze(sources.map((s) => Object.freeze(s))) });
}

/**
 * The Assignment id a prior attempt already claimed for `taskKey`, or
 * `null`. Read-only peek at `createSessionAssignment`'s own claim record
 * (`store.mjs`'s `tasks/<hashTaskKey>.json`) -- never a second claim
 * mechanism, and never written here.
 */
function peekClaimedAssignmentId(sessionDir, taskKey) {
  const taskClaimPath = path.join(sessionDir, 'tasks', `${hashTaskKey(taskKey)}.json`);
  if (!fs.existsSync(taskClaimPath)) return null;
  try {
    const claim = JSON.parse(fs.readFileSync(taskClaimPath, 'utf8'));
    return claim.taskKey === taskKey && isNonEmptyString(claim.assignmentId) ? claim.assignmentId : null;
  } catch (err) {
    throw new CoordinationError('corrupt-log', `task claim record for taskKey "${taskKey}" at ${taskClaimPath} is not valid JSON: ${err.message}`);
  }
}

/**
 * Bind a previously-unknown `specialistActorId` to a declared
 * `topology.specialistSlots[]` slot (Phase 09, P09.2), appending the
 * `specialistAuthorizationId`-keyed `specialist-authorized` event.
 *
 * This is the definition-aware door `store.mjs`'s `recordSpecialistAuthorization`
 * structurally cannot be on its own: it resolves `slotId` against the
 * session's own bound protocol, and refuses an authorization that could
 * never legally fill it --
 *
 * - `slotId` must name a real `topology.specialistSlots[]` entry.
 * - `role` must equal that slot's own declared `role` exactly (mirrors
 *   `resolveDeclaredOperationActor`'s existing actor/operation role-mismatch
 *   gate -- a specialist whose role does not match could never be dispatched
 *   for any of the slot's operations anyway).
 * - `capabilities` must be a SUPERSET of the slot's own
 *   `requiredCapabilities[]` (every capability the slot requires must be
 *   among the ones this specialist is authorized with; a specialist may
 *   carry MORE than the slot requires -- the slot names a floor, not a
 *   ceiling).
 * - `triggerEvidenceRefs`/`allowedContextRefs` must resolve to refs this
 *   session actually owns -- the SAME `assertRefsOwnedBySession` check
 *   `authorizeDeclaredOperation` already applies to `grantedContextRefs`,
 *   reused rather than re-implemented (Bug Taxonomy: "Foreign context
 *   refused... reusing assertRefsOwnedBySession, never a freshly-invented
 *   check").
 * - The slot's own `maxBindings` cap is forwarded to
 *   `recordSpecialistAuthorization` as `opts.maxBindingsForSlot`, enforced
 *   lock-held there against fresh on-disk events (see that function's doc
 *   comment for exactly what "binding" counts).
 *
 * Driver-only: enforced by `recordSpecialistAuthorization`'s own
 * `assertDriverIdentity` call (the SAME shared check `authorizeOperation`
 * uses), not re-implemented here -- `authorizedBy.id` must equal this
 * session's own `provenanceRoot.writerId`, so a worker/peer can never
 * self-authorize into a slot.
 *
 * @param {string} coordinationId Must already have a non-null `definitionRef`.
 * @param {object} params
 * @param {string} params.slotId
 * @param {string} params.specialistActorId The previously-unknown identity being recruited.
 * @param {string} params.role Must equal the slot's own declared role.
 * @param {string[]} [params.capabilities] Must be a superset of the slot's requiredCapabilities; defaults to none.
 * @param {{type: 'driver', id: string}} params.authorizedBy
 * @param {string} params.reason
 * @param {string[]} [params.triggerEvidenceRefs] Session-owned refs; defaults to none.
 * @param {string[]} [params.allowedContextRefs] Session-owned refs the specialist may read; defaults to none.
 * @param {number} params.maxAssignments This authorization's own dispatch cap.
 * @param {number} params.expiresAfterRound Last round this authorization may still authorize a new Assignment for.
 * @param {string} params.specialistAuthorizationId Unique id for this authorization instance.
 * @param {object} [opts] Workspace options ({ cwd, repoRoot, packageRoot })
 */
export function authorizeSpecialistSlot(
  coordinationId,
  {
    slotId,
    specialistActorId,
    role,
    capabilities = [],
    authorizedBy,
    reason,
    triggerEvidenceRefs = [],
    allowedContextRefs = [],
    maxAssignments,
    expiresAfterRound,
    specialistAuthorizationId,
  },
  opts = {},
) {
  const manifest = readManifest(coordinationId, opts);
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `authorizeSpecialistSlot: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- there is no slot for an authorization to name`,
    );
  }
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `authorizeSpecialistSlot: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to authorize against a drifted definition`,
    );
  }

  const slot = (definition.spec.profile.topology?.specialistSlots ?? []).find((s) => s.id === slotId);
  if (!slot) {
    throw new CoordinationError(
      'validation',
      `authorizeSpecialistSlot: slot "${slotId}" is not declared in this protocol's spec.profile.topology.specialistSlots`,
    );
  }
  if (role !== slot.role) {
    throw new CoordinationError(
      'validation',
      `authorizeSpecialistSlot: role "${role}" does not match specialist slot "${slotId}"'s own declared role "${slot.role}" -- a specialist of this role could never be dispatched for any of the slot's operations`,
    );
  }
  // Cheap identity-disjointness guard (Red-Team round 1, LOW/INFO): a
  // specialist is by definition a previously-unknown identity, never one of
  // the protocol's own statically-declared `spec.actors[]`. No exploit was
  // constructed through the real doors (operation-id-scoped matching plus
  // per-operation role invariance already blocks the paths tried), but
  // refusing the collision outright at authorization time is free here and
  // keeps a specialist's synthesized `actorEntry` (`resolveDeclaredOperationActor`)
  // from ever aliasing a real, statically-bound actor id.
  if ((definition.spec.actors ?? []).some((actorEntry) => actorEntry.id === specialistActorId)) {
    throw new CoordinationError(
      'validation',
      `authorizeSpecialistSlot: specialistActorId "${specialistActorId}" collides with a statically-declared spec.actors[] id -- a specialist must be a previously-unknown identity`,
    );
  }
  const missingCapabilities = slot.requiredCapabilities.filter((cap) => !capabilities.includes(cap));
  if (missingCapabilities.length > 0) {
    throw new CoordinationError(
      'validation',
      `authorizeSpecialistSlot: capabilities [${capabilities.join(', ')}] do not satisfy specialist slot "${slotId}"'s own declared requiredCapabilities -- missing [${missingCapabilities.join(', ')}]`,
    );
  }

  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  assertRefsOwnedBySession(triggerEvidenceRefs, {
    coordinationId,
    assignmentRefs: manifest.assignmentRefs,
    fgosDir,
    label: `authorizeSpecialistSlot: triggerEvidenceRefs`,
  });
  assertRefsOwnedBySession(allowedContextRefs, {
    coordinationId,
    assignmentRefs: manifest.assignmentRefs,
    fgosDir,
    label: `authorizeSpecialistSlot: allowedContextRefs`,
  });

  return recordSpecialistAuthorization(
    coordinationId,
    {
      specialistAuthorizationId,
      slotId,
      specialistActorId,
      role,
      capabilities,
      authorizedBy,
      reason,
      triggerEvidenceRefs,
      allowedContextRefs,
      maxAssignments,
      expiresAfterRound,
    },
    { ...opts, maxBindingsForSlot: { slotId, cap: slot.maxBindings } },
  );
}

/**
 * Authorize ONE `activation.mode: driver-authorized` node-operation binding
 * of the protocol bound to `coordinationId`, appending the
 * `operation-authorized` event `dispatchDeclaredOperation`'s gate then
 * requires (R2/R4).
 *
 * This is the door that can answer what `store.mjs`'s `authorizeOperation`
 * structurally cannot: whether `(nodeId, operationId, targetActorId)` names
 * a REAL binding in this session's own declared protocol, and whether that
 * binding is actually `driver-authorized`. An authorization naming an
 * undeclared operation, an actor the graph never pairs with that operation,
 * or a node that does not host that pairing is rejected before anything is
 * appended. Authorizing a `required` binding is rejected too: it would be a
 * meaningless record that no gate will ever consult.
 *
 * `nodeId` is optional and derived from the resolved binding when omitted;
 * when supplied it must name the node that actually hosts this
 * operation/actor pairing.
 *
 * @param {string} coordinationId Must already have a non-null `definitionRef`.
 * @param {object} params
 * @param {string} params.operationId
 * @param {string} [params.targetActorId] Disambiguates which actor binding when the operation is wired to more than one.
 * @param {string} [params.nodeId] Checked against the resolved binding's node when supplied.
 * @param {string} params.authorizationId Unique id for this authorization instance.
 * @param {string} params.invocationKey Idempotency key for this logical optional-operation invocation.
 * @param {{type: 'driver', id: string}} params.authorizedBy
 * @param {string} params.reason
 * @param {string[]} [params.grantedContextRefs] Refs the resulting Assignment may read; defaults to none.
 * @param {string} [params.targetArtifactRef] The artifact revision being revised/rechecked.
 * @param {object} [opts] Workspace options ({ cwd, repoRoot, packageRoot })
 */
export function authorizeDeclaredOperation(
  coordinationId,
  { operationId, targetActorId, nodeId, authorizationId, invocationKey, authorizedBy, reason, grantedContextRefs = [], targetArtifactRef },
  opts = {},
) {
  const manifest = readManifest(coordinationId, opts);
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `authorizeDeclaredOperation: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- there is no binding for an authorization to name`,
    );
  }
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `authorizeDeclaredOperation: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to authorize against a drifted definition`,
    );
  }

  // Only a `specialistSlotRef` binding ever needs a live replay to resolve
  // its actor -- see `definitionOperationUsesSpecialistSlot`'s own doc
  // comment for why this stays a no-op (no extra replay call) for every
  // pre-P09.2 fixture. `resolveLiveSpecialistBindings` derives its own
  // current round internally (round-1 fix, Phase 09 P09.2) -- no `round`
  // input from this door at all.
  const specialistBindings = definitionOperationUsesSpecialistSlot(definition, operationId)
    ? resolveLiveSpecialistBindings(replaySession(coordinationId, opts))
    : undefined;
  const { actorId, node, binding, specialistAuthorization } = resolveDeclaredOperationActor(definition, operationId, targetActorId, specialistBindings);
  if (nodeId !== undefined && nodeId !== node.id) {
    throw new CoordinationError(
      'validation',
      `authorizeDeclaredOperation: nodeId "${nodeId}" does not host operation "${operationId}" bound to actor "${actorId}" (that binding lives at node "${node.id}")`,
    );
  }
  const mode = activationModeOf(binding);
  if (mode !== 'driver-authorized') {
    throw new CoordinationError(
      'validation',
      `authorizeDeclaredOperation: operation "${operationId}" at node "${node.id}" for actor "${actorId}" declares activation.mode "${mode}" -- only a "driver-authorized" binding can be authorized`,
    );
  }

  // The grant's same-session scope is checked HERE as well as at dispatch:
  // refusing an out-of-session ref before the authorization is ever written
  // keeps an illegal grant off the log entirely, rather than leaving a
  // permanently unusable authorization behind for the gate to refuse later.
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  assertRefsOwnedBySession(grantedContextRefs, {
    coordinationId,
    assignmentRefs: manifest.assignmentRefs,
    fgosDir,
    label: `authorizeDeclaredOperation: grantedContextRefs`,
  });
  // The artifact revision this authorization names is a session-linked ref
  // too, checked by the same rule as the grant (the dispatch gate re-checks
  // it, for the same reason it re-checks the grant: the raw store door has no
  // session awareness of its own).
  if (targetArtifactRef !== undefined) {
    assertRefsOwnedBySession([targetArtifactRef], {
      coordinationId,
      assignmentRefs: manifest.assignmentRefs,
      fgosDir,
      label: `authorizeDeclaredOperation: targetArtifactRef`,
    });
  }

  // Visibility-window legality (Phase 06 R2, additive alongside the
  // same-session ownership checks above -- never a replacement for them).
  // Only a binding that actually declares `contextAccess.visibilityWindowRef`
  // is gated; a binding with none stays byte/behavior-identical to before
  // this check existed. Re-derived fresh from a NEW `replaySession()` call
  // every time (never cached/latched -- Bug Taxonomy), so a window that was
  // closed a moment ago and only just opened is picked up correctly, and one
  // that silently closes again (it cannot, under the current append-only
  // event vocabulary, but this call never assumes otherwise) is too.
  const visibilityWindowRef = binding.contextAccess?.visibilityWindowRef;
  if (visibilityWindowRef !== undefined) {
    const replayedForWindow = replaySession(coordinationId, opts);
    const { open } = deriveVisibilityWindowState(definition, visibilityWindowRef, replayedForWindow, fgosDir);
    if (!open) {
      throw new CoordinationError(
        'validation',
        `authorizeDeclaredOperation: operation "${operationId}" at node "${node.id}" for actor "${actorId}" requires visibility window "${visibilityWindowRef}" to be open before any context may be granted, and it is not open yet -- refusing to authorize`,
      );
    }
  }

  return authorizeOperation(
    coordinationId,
    {
      authorizationId,
      operationId,
      nodeId: node.id,
      targetActorId: actorId,
      invocationKey,
      authorizedBy,
      reason,
      grantedContextRefs,
      targetArtifactRef,
    },
    // `activation.maxInvocations` lives on the binding, and a specialist's
    // own `maxAssignments` cap lives on its live authorization -- both only
    // this definition-aware door can read; store.mjs enforces both
    // lock-held.
    {
      ...opts,
      ...(binding.activation?.maxInvocations !== undefined ? { maxInvocationsForBinding: binding.activation.maxInvocations } : {}),
      ...(specialistAuthorization !== undefined
        ? { maxAssignmentsForSpecialist: { specialistActorId: actorId, cap: specialistAuthorization.maxAssignments } }
        : {}),
    },
  );
}

// ─── Phase 03 R5: session bounds, enforced before materialization/launch ──
//
// aggregateBounds has 5 fields (schema.mjs's DEFAULT_AGGREGATE_BOUNDS):
// wallTimeMs, maxAssignments, maxConcurrency, maxRounds, maxTaskDepth. Only
// TWO of them (maxAssignments, maxConcurrency, maxRounds -- session-wide,
// distinct from this file's own per-topology-edge maxRounds/
// opts.maxRoundsForActor) need lock-held, authoritative enforcement inside
// `createSessionAssignment` (store.mjs): a check-then-act on a shared,
// concurrently-writable counter is exactly the TOCTOU class P03.1's own
// maxRounds fix closed, so those three are forwarded unconditionally as
// store.mjs opts below, never enforced by a pre-lock read alone.
//
// wallTimeMs and maxTaskDepth are different in kind -- neither is a shared
// mutable counter two concurrent callers could both "pass" before either
// commits:
// - wallTimeMs is `Date.now() - manifest.createdAt`, a pure function of real
//   time. Two concurrent callers reading it concurrently observe the SAME
//   answer (give or take clock granularity); there is no write for either to
//   race against.
// - maxTaskDepth is the length of a `provenance.inline.caller.parentAssignmentId`
//   chain of Assignments that ALREADY EXIST (immutable once created) at the
//   moment a new one is materialized. Two siblings racing to create children
//   under the SAME already-existing parent compute the identical depth.
// Both are therefore checked once, synchronously, before the lock is ever
// taken -- authoritative by construction, not merely an advisory UX
// shortcut (unlike this file's own pre-lock maxRounds fast-fail, which
// P03.1's Red-Team proved IS just advisory for a genuinely shared counter).

/**
 * R5 wall-time bound: reject materializing a new declared-path Assignment
 * once the session's `aggregateBounds.wallTimeMs` budget (measured from
 * `manifest.createdAt`) has elapsed.
 */
function assertWithinWallTimeBudget(manifest, label) {
  const elapsedMs = Date.now() - Date.parse(manifest.createdAt);
  if (elapsedMs >= manifest.aggregateBounds.wallTimeMs) {
    throw new CoordinationError(
      'validation',
      `${label}: session "${manifest.coordinationId}" wall-time budget (aggregateBounds.wallTimeMs: ${manifest.aggregateBounds.wallTimeMs}ms) has elapsed (${elapsedMs}ms since ${manifest.createdAt}) -- refusing to materialize a new Assignment`,
    );
  }
}

/**
 * R5 task-depth bound: reject materializing a new declared-path Assignment
 * whose real `parentAssignmentId` chain would reach a depth beyond
 * `aggregateBounds.maxTaskDepth`. A root task (no parent) is depth 1; each
 * hop up a REAL, on-disk `provenance.inline.caller.parentAssignmentId` chain
 * (never a caller-asserted depth number) adds one. Every Assignment this
 * chain walks is already a session member by the time this runs (the
 * caller's own fromAssignmentId/consultantAssignmentId membership checks run
 * first), so this never reads outside `.fgos/assignments/`.
 */
function assertWithinTaskDepth(fgosDir, immediateParentId, maxTaskDepth, label) {
  let depth = 1;
  let currentId = immediateParentId;
  const visited = new Set();
  while (currentId) {
    if (visited.has(currentId)) {
      throw new CoordinationError('corrupt-log', `${label}: parentAssignmentId chain contains a cycle at "${currentId}"`);
    }
    visited.add(currentId);
    depth += 1;
    if (depth > maxTaskDepth) {
      throw new CoordinationError(
        'validation',
        `${label}: materializing this Assignment would reach task depth ${depth}, above the declared aggregateBounds.maxTaskDepth cap of ${maxTaskDepth}`,
      );
    }
    const assignmentPath = path.join(fgosDir, 'assignments', currentId, 'assignment.json');
    if (!fs.existsSync(assignmentPath)) {
      throw new CoordinationError('dangling-ref', `${label}: parentAssignmentId "${currentId}" has no assignment.json on disk`);
    }
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
    } catch (err) {
      throw new CoordinationError('corrupt-log', `${label}: assignment.json for "${currentId}" is not valid JSON: ${err.message}`);
    }
    currentId = parsed?.provenance?.inline?.caller?.parentAssignmentId ?? null;
  }
}

/**
 * Open a new standalone CoordinationSession bound to a declared, validated
 * `CoordinationProtocol` FlowDefinition (R1). Loads `definitionId` through
 * `loadCoordinationProtocol()` (`../definitions/protocol-loader.mjs`, P02.2 --
 * never reimplemented or forked here), creates one stable SessionActor per
 * `spec.actors[]` entry (`role`/`persona`/`policy` carried through verbatim),
 * and records `{id, version}` on the manifest's `definitionRef` field --
 * the SAME field `coordination-session.md`'s contract already reserves for
 * exactly this ("a reference to a CoordinationProtocol FlowDefinition when
 * the session is declared-protocol-led"). Every later `dispatchDeclaredOperation`
 * call re-resolves and version-checks against this recorded reference
 * (never trusts a second, separately-passed `definitionId`), so the
 * manifest is the actual source of truth for which protocol governs this
 * session, not just a decorative record.
 *
 * @param {object} params
 * @param {string} params.definitionId `metadata.id` of a `CoordinationProtocol` FlowDefinition (e.g. 'core.coordination-protocol.declared-consult').
 * @param {string} [params.coordinationId] Optional explicit id; auto-generated when omitted.
 * @param {string} params.objective
 * @param {string} params.writerId Caller identity opening the session.
 * @param {string} [params.parentAssignmentId]
 * @param {object} [params.aggregateBounds] Partial bounds; omitted fields default (schema.mjs).
 * @param {string|null} [params.workRef] Optional read-only Work reference; never grants lifecycle authority.
 * @param {{minimumActors?: number, allowedOmissions?: string[]}} [params.partialPolicy] R1: declared up front, before any Assignment is dispatched (store.mjs's openSession).
 * @param {object} [opts] Workspace options ({ cwd, repoRoot, packageRoot })
 * @returns {Readonly<object>} The stored manifest
 */
export function openDeclaredProtocolSession(
  { definitionId, coordinationId, objective, writerId, parentAssignmentId, aggregateBounds, workRef = null, partialPolicy = null },
  opts = {},
) {
  const definition = loadCoordinationProtocol(definitionId, { cwd: opts.cwd, packageRoot: opts.packageRoot });

  if (definition.spec.profile.kind !== 'CoordinationProtocol') {
    throw new CoordinationError(
      'validation',
      `openDeclaredProtocolSession: definition "${definitionId}" is not a CoordinationProtocol-profile FlowDefinition (profile.kind: "${definition.spec.profile.kind}")`,
    );
  }
  if (!Array.isArray(definition.spec.actors) || definition.spec.actors.length === 0) {
    throw new CoordinationError(
      'validation',
      `openDeclaredProtocolSession: definition "${definitionId}" declares no spec.actors -- a declared standalone session requires stable SessionActor identities`,
    );
  }
  if (!isNonEmptyString(definition.metadata.version)) {
    throw new CoordinationError(
      'validation',
      `openDeclaredProtocolSession: definition "${definitionId}" has no metadata.version -- a session's definitionRef requires a stable, versioned reference`,
    );
  }

  const actors = definition.spec.actors.map((actor) => ({
    id: actor.id,
    role: actor.role,
    ...(actor.persona !== undefined ? { persona: actor.persona } : {}),
    ...(actor.policy !== undefined ? { policy: actor.policy } : {}),
  }));

  return openSession(
    {
      coordinationId,
      objective,
      provenanceRoot: { writerId, ...(parentAssignmentId !== undefined ? { parentAssignmentId } : {}) },
      definitionRef: { id: definition.metadata.id, version: definition.metadata.version },
      workRef,
      actors,
      aggregateBounds,
      partialPolicy,
    },
    opts,
  );
}

/**
 * Phase 01 mutation-unlock (R1-R3): the narrow, testable four-condition gate
 * a declared `operation` step's `mutation: 'mutating'` must clear BEFORE
 * `dispatchDeclaredOperation` materializes anything. A no-op for `'read-only'`
 * (R1's own default/every pre-existing caller) and for `undefined`. Throws a
 * `CoordinationError('validation', ...)` naming the SPECIFIC failed condition
 * -- never a generic message -- for every other case, including an illegal
 * `mutation` value outright.
 *
 * R2: the bound operation must declare `result.kind: 'work-product'` --
 * read from the definition's own resolved operation (never trusted from a
 * caller-supplied claim; there is no parameter path for one here at all).
 *
 * R3: `opts.cwd` must resolve to a LINKED WORKTREE, never the main checkout,
 * and never fail open on an unresolvable root. The exact comparison (this
 * cell's own direct investigation, phase-01-mutation-unlock.md R3):
 * `resolveMainCheckoutRoot(cwd) === resolveRepoRoot(cwd)` -- i.e. the
 * toplevel of `cwd` IS the main checkout root -- refuses, since `cwd` may
 * legitimately be a SUBDIRECTORY of either the main checkout or a worktree
 * (comparing against raw `cwd` directly would wrongly refuse that case). A
 * `null` `resolveMainCheckoutRoot` result (cwd outside any git checkout
 * entirely) also refuses -- fail closed, never fail open.
 *
 * @param {'read-only'|'mutating'|undefined} mutation
 * @param {{ operationId: string, operation: object, cwd: string|undefined }} ctx
 */
function assertMutatingDispatchAllowed(mutation, { operationId, operation, cwd }) {
  if (mutation === undefined || mutation === 'read-only') return;
  if (mutation !== 'mutating') {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: mutation "${mutation}" is not a legal value (expected "read-only" or "mutating")`,
    );
  }

  const declaredKind = operation.result?.kind;
  if (declaredKind !== 'work-product') {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" declares result.kind "${declaredKind ?? 'undefined'}" -- a mutating dispatch requires the bound operation to declare result.kind "work-product"`,
    );
  }

  let mainCheckoutRoot;
  try {
    mainCheckoutRoot = resolveMainCheckoutRoot(cwd);
  } catch {
    mainCheckoutRoot = null;
  }
  if (mainCheckoutRoot === null) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: mutation "mutating" refused for operation "${operationId}" -- cwd "${cwd}" does not resolve inside any git checkout (fail closed on an unresolvable root, never fail open)`,
    );
  }
  let repoRoot;
  try {
    repoRoot = resolveRepoRoot(cwd);
  } catch (err) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: mutation "mutating" refused for operation "${operationId}" -- cwd "${cwd}" toplevel could not be resolved (${err.message}); fail closed, never fail open`,
    );
  }
  if (mainCheckoutRoot === repoRoot) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: mutation "mutating" refused for operation "${operationId}" -- cwd "${cwd}" resolves to the main checkout ("${repoRoot}"); a mutating dispatch must run in a linked git worktree, never the main checkout`,
    );
  }
}

/**
 * Materialize and dispatch ONE declared operation of the protocol bound to
 * `coordinationId` (R1), through the declared topology's request/response
 * edges (R2) and the full policy precedence chain (R3), reusing
 * `createAndExecuteSessionTask` -- the SAME shared dispatch primitive
 * `dispatchPrimaryTask`/`proposeConsult` already call -- as the ONLY place
 * this function ever reaches `executeAssignment`/`createSessionAssignment`.
 *
 * Topology (R2): resolves the operation's bound actor and looks up any
 * topology edge whose `to` is that actor.
 * - No such edge (a graph "entry"-shaped operation, e.g. this fixture's
 *   `request-consult`): dispatches as a root task, no upstream reference
 *   required, caller-supplied `contextRefs` allowed (bounded, defaults []) --
 *   mirrors `dispatchPrimaryTask`'s own shape.
 * - A declared edge exists (e.g. `provide-consult`, edge
 *   `requester-actor -> consultant-actor`): `params.fromAssignmentId` is
 *   REQUIRED and must be a real member of this session belonging to the
 *   edge's declared `from` actor (never a fabricated or foreign id -- this
 *   is what makes "response before request" structurally unreachable, not
 *   merely discouraged); `params.intent` must be one of the edge's declared
 *   `intents` (defaults to the edge's own single intent when only one is
 *   declared); the edge's `maxRounds` cap is enforced against the number of
 *   Assignments already created for the target actor (a brand-new
 *   `taskKey` -- see `params.round` -- counts as a new round; a taskKey
 *   that already has a claim record on disk is an idempotent RESUME of an
 *   already-counted round, never a new one, mirroring
 *   `createSessionAssignment`'s own claim-file semantics exactly, peeked at
 *   read-only here); and `contextRefs` is ALWAYS exactly
 *   `[params.fromAssignmentId]`, non-caller-overridable -- the specialist
 *   actor never sees anything but the authorized request (mediated
 *   visibility), never unrelated/sibling/global session state.
 *
 * Policy (R3): composes an ordered scope stack --
 * `runner < definition < operation < role < actor < assignment < cli`
 * (`params.runnerPolicy`/`params.rolePolicy`/`params.assignmentPolicy`/
 * `params.cliPolicy` are optional caller-supplied PolicyPatch fragments for
 * the scopes this V1 FlowDefinition schema has no first-class field for yet
 * -- `runner`/`role`/`assignment` -- so the full documented chain is
 * genuinely exercised even where the schema itself only ever populates
 * `definition`/`operation`/`actor`) -- through `resolveDeclaredPolicyStack`
 * (above), then forwards the merged, pre-governance PolicyPatch as
 * `opts.cliOverride` to `createAndExecuteSessionTask` (the ONLY channel an
 * inline Assignment contract has for a `minTier`/`preferPersona`/
 * `preferExecutor`/`visibility` value at all -- `execution-contract.mjs`'s
 * own field whitelist has no `policy` field for an inline contract to
 * carry). `cliOverride.policyProvenance` (this cell's additive extension to
 * `assignment-policy.mjs`) carries the derived per-field scope labels
 * through, so the RunResult's own `policy.provenance` -- ALREADY the exact
 * FlowDefinition PolicyPatch Provenance shape,
 * `{field: {value, source: {scope, id}}}`, for every one of `executor`,
 * `provider`, `model`, `tier`, `persona`, `visibility`, `constraints`,
 * `governance` -- becomes the single, already-persisted, authoritative R3
 * proof for this dispatch; this function never builds or persists a second,
 * competing provenance record. Governance (`options.disallowedProviders`/
 * `disallowedExecutors`) still runs downstream, inside
 * `resolveAssignmentDispatchPolicy` itself, completely unchanged -- it
 * stays final regardless of any declared or CLI-composed preference.
 *
 * @param {string} coordinationId Must already have a non-null `definitionRef` (opened via `openDeclaredProtocolSession`).
 * @param {object} params
 * @param {string} params.operationId
 * @param {string} [params.targetActorId] Disambiguates which actor binding
 *   to target when `operationId` is wired to MORE THAN ONE actor (an
 *   independent fan-out cohort sharing one operation template, R5).
 *   Omitted (every non-fan-out caller): resolves the first `{ref, actor}`
 *   match, unchanged prior behavior.
 * @param {string} params.objective
 * @param {string[]} params.expectedOutputs
 * @param {string[]} [params.contextRefs] Only honored for a root (no-incoming-edge) operation.
 * @param {string[]} [params.constraints]
 * @param {string[]} [params.capabilities] Defaults to the operation's own declared `capabilities`.
 * @param {object} [params.budget]
 * @param {string} params.writerId
 * @param {string} [params.parentAssignmentId] Only honored for a root operation.
 * @param {string} [params.fromAssignmentId] Required when the operation's actor has a declared incoming edge.
 * @param {string} [params.intent] Must be one of the edge's declared `intents`.
 * @param {number} [params.round] Default 1; a fresh (never-before-used) value is a NEW round, checked against `edge.maxRounds`.
 * @param {string} [params.taskKey] Overrides the default `declared:<operationId>[:round-N]` taskKey.
 * @param {object} [params.runnerPolicy] Runner/global-scope PolicyPatch fragment.
 * @param {object} [params.rolePolicy] Role-scope PolicyPatch fragment.
 * @param {object} [params.assignmentPolicy] Assignment-scope PolicyPatch fragment.
 * @param {object} [params.cliPolicy] Human/CLI-scope PolicyPatch fragment (the one scope legally allowed to carry a literal `preferExecutor`).
 * @param {'read-only'|'mutating'} [params.mutation] Phase 01 mutation-unlock (R1). Default `'read-only'`, byte-identical to every pre-existing caller. `'mutating'` is refused unless the bound operation declares `result.kind: 'work-product'` (R2) AND `opts.cwd` resolves to a linked git worktree, never the main checkout (R3) -- see `assertMutatingDispatchAllowed`.
 * @param {object} [opts] Forwarded to `createAndExecuteSessionTask`/`executeAssignment` (cwd, repoRoot, packageRoot, runnerConfig, timeoutMs, options, ...)
 */
export async function dispatchDeclaredOperation(
  coordinationId,
  {
    operationId,
    targetActorId,
    objective,
    expectedOutputs,
    contextRefs = [],
    constraints = [],
    capabilities,
    budget,
    writerId,
    parentAssignmentId,
    fromAssignmentId,
    intent,
    round = 1,
    taskKey: explicitTaskKey,
    runnerPolicy = {},
    rolePolicy = {},
    assignmentPolicy = {},
    cliPolicy = {},
    // Phase 01 mutation-unlock (R1/R4): default 'read-only' preserves every
    // pre-existing caller's behavior byte-for-byte -- only a caller that
    // explicitly passes 'mutating' ever reaches assertMutatingDispatchAllowed
    // below, and only dispatchDeclaredOperation itself (never
    // dispatchPrimaryTask/proposeConsult/recordConsultDisposition, none of
    // which accept this parameter at all) can ever thread a non-default
    // value into buildSessionContract.
    mutation = 'read-only',
  },
  opts = {},
) {
  const manifest = readManifest(coordinationId, opts);
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- open it with openDeclaredProtocolSession()`,
    );
  }
  // R5: session bounds enforced BEFORE materialization/launch. wallTimeMs is
  // not concurrency-sensitive (see the module-level comment above this
  // function) -- this pre-lock check is authoritative by itself.
  assertWithinWallTimeBudget(manifest, 'dispatchDeclaredOperation');
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);

  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to materialize against a drifted definition`,
    );
  }

  // One reconstruction per dispatch, shared by specialist-slot resolution
  // (below), the edge validation, and the driver-authorization gate further
  // down (nothing writes in between).
  let replayed = null;
  const replayOnce = () => (replayed ??= replaySession(coordinationId, opts));

  // Only a `specialistSlotRef` binding ever needs the replay taken above --
  // see `definitionOperationUsesSpecialistSlot`'s own doc comment for why
  // this stays a no-op (`replayOnce()` never actually called) for every
  // pre-P09.2 fixture. `resolveLiveSpecialistBindings` derives its own
  // current round internally (round-1 fix, Phase 09 P09.2) -- this
  // function's own `round` parameter is unrelated: it stays a per-edge
  // taskKey/maxRounds disambiguator only, below.
  const specialistBindings = definitionOperationUsesSpecialistSlot(definition, operationId)
    ? resolveLiveSpecialistBindings(replayOnce())
    : undefined;
  const { operation, actorId, actorEntry, node, binding } = resolveDeclaredOperationActor(definition, operationId, targetActorId, specialistBindings);

  // Phase 01 mutation-unlock (R1-R3): refused BEFORE any further
  // materialization work, with an error naming the SPECIFIC condition that
  // failed -- never a generic validation message. A no-op (returns
  // immediately) for every pre-existing caller, since `mutation` defaults to
  // `'read-only'` above.
  assertMutatingDispatchAllowed(mutation, { operationId, operation, cwd: opts.cwd });

  const topology = definition.spec.profile.topology;
  const incomingEdge = topology?.edges?.find((edge) => edge.to === actorId);

  const isDriverAuthorized = activationModeOf(binding) === 'driver-authorized';

  // Recheck-vs-retry: a driver-authorized invocation's default claim key
  // carries the id of the authorization it spends, so a recheck reaches a NEW
  // Assignment instead of resuming the original binding's one. Derived here,
  // before the key is built, because the key is what a claim record is looked
  // up by (see `resolveTaskKeyAuthorization`). A caller-supplied `taskKey` is
  // left exactly as given -- the caller owns its own claim identity, and the
  // gate below still refuses a key that would resume somebody else's
  // Assignment.
  let authorizationKeySuffix = '';
  if (isDriverAuthorized && explicitTaskKey === undefined) {
    const keyAuthorization = resolveTaskKeyAuthorization(replayOnce().authorizations, {
      nodeId: node.id,
      operationId,
      targetActorId: actorId,
    });
    if (keyAuthorization) authorizationKeySuffix = `:auth:${keyAuthorization.authorizationId}`;
  }

  let resolvedContextRefs;
  let resolvedIntent = null;
  let taskKey;

  if (incomingEdge) {
    if (!isNonEmptyString(fromAssignmentId)) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" is reached by a declared topology edge from "${incomingEdge.from}" -- fromAssignmentId is required`,
      );
    }
    const { assignmentRefs, events } = replayOnce();
    if (!assignmentRefs.includes(fromAssignmentId)) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: fromAssignmentId "${fromAssignmentId}" is not a member of session "${coordinationId}"`,
      );
    }
    const fromCreatedEvent = events.find(
      (event) => event.type === 'assignment-created' && event.payload.assignmentId === fromAssignmentId,
    );
    if (!fromCreatedEvent || fromCreatedEvent.payload.actorId !== incomingEdge.from) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: fromAssignmentId "${fromAssignmentId}" does not belong to declared edge source actor "${incomingEdge.from}" -- undeclared edge/direction`,
      );
    }

    resolvedIntent = intent ?? incomingEdge.intents?.[0];
    if (!incomingEdge.intents || !incomingEdge.intents.includes(resolvedIntent)) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: intent "${resolvedIntent}" is not declared on the topology edge "${incomingEdge.from}" -> "${incomingEdge.to}" (declared intents: [${(incomingEdge.intents ?? []).join(', ')}])`,
      );
    }

    taskKey = explicitTaskKey ?? `declared:${operationId}:round-${round}${authorizationKeySuffix}`;
    const { sessionDir } = resolveSessionPaths(coordinationId, opts);
    const taskClaimPath = path.join(sessionDir, 'tasks', `${hashTaskKey(taskKey)}.json`);
    const isResumeOfThisRound = fs.existsSync(taskClaimPath);
    if (!isResumeOfThisRound) {
      const maxRounds = incomingEdge.maxRounds ?? Infinity;
      const roundsAlreadyUsed = events.filter(
        (event) => event.type === 'assignment-created' && event.payload.actorId === actorId,
      ).length;
      if (roundsAlreadyUsed >= maxRounds) {
        throw new CoordinationError(
          'validation',
          `dispatchDeclaredOperation: topology edge "${incomingEdge.from}" -> "${incomingEdge.to}" allows at most ${maxRounds} round(s); a new round for actor "${actorId}" is rejected`,
        );
      }
    }

    // Mediated context visibility (R2): the specialist actor's contract
    // NEVER carries caller-supplied contextRefs -- only the one authorized
    // upstream Assignment, by construction. This is not a filter applied to
    // caller input; there is no parameter path for extra contextRefs to
    // reach this branch at all.
    resolvedContextRefs = [fromAssignmentId];
  } else {
    taskKey = explicitTaskKey ?? `declared:${operationId}${authorizationKeySuffix}`;
    resolvedContextRefs = Array.isArray(contextRefs) ? contextRefs : [];
  }

  // R4 driver-authorization gate. Applies ONLY to a binding that actually
  // declares `activation.mode: driver-authorized`; a `required` binding (the
  // default, and every pre-existing fixture) never reaches this branch and
  // its dispatch path is byte-for-byte unchanged.
  //
  // This read is unlocked, like every other pre-lock check in this function,
  // so it is a fast-fail. The AUTHORITATIVE "one authorization materializes
  // at most one Assignment" enforcement is `createSessionAssignment`'s own
  // lock-held check on `authorizationProvenance.authorizationId`
  // (store.mjs), reached via the provenance forwarded below -- the same
  // pre-lock-advisory / lock-held-authoritative split the round and
  // aggregate-bounds caps already use.
  let authorizationProvenance;
  if (isDriverAuthorized) {
    const { sessionDir } = resolveSessionPaths(coordinationId, opts);
    const { authorizations, ignoredAuthorizations } = replayOnce();
    const resumedAssignmentId = peekClaimedAssignmentId(sessionDir, taskKey);
    const authorization = resolveBindingAuthorization(authorizations, {
      nodeId: node.id,
      operationId,
      targetActorId: actorId,
      resumedAssignmentId,
    });
    if (!authorization) {
      // An authorization for this exact binding that replay neutralized as
      // post-terminal is reported alongside the refusal, so an operator can
      // tell "none was ever issued" apart from "one was issued but landed
      // after the session closed" -- the only observability cost of replay's
      // ignore-rather-than-throw reading of Recovery Rule point 5.
      const neutralized = ignoredAuthorizations.filter(
        (record) => record.nodeId === node.id && record.operationId === operationId && record.targetActorId === actorId,
      );
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" at node "${node.id}" for actor "${actorId}" declares activation.mode "driver-authorized", and no unconsumed "operation-authorized" event in session "${coordinationId}" authorizes that exact binding -- refusing to materialize an Assignment${
          neutralized.length > 0
            ? ` (${neutralized.length} "operation-authorized" event(s) for this binding were ignored as post-terminal: ${neutralized.map((record) => `"${record.authorizationId}"`).join(', ')})`
            : ''
        }`,
      );
    }

    // Minimal safety guard, NOT recheck semantics (Phase 03's job, Non-Goals):
    // with no explicit `taskKey`, this operation's default derivation
    // (`declared:${operationId}`, above) carries no per-invocation
    // discriminator -- and, for THIS branch specifically, no `targetActorId`
    // discriminator either -- so a taskKey can collide two ways: a SECOND
    // authorized invocation at the SAME binding, or (fan-out: one
    // operationId wired to two different actors) a DIFFERENT binding
    // entirely. Either way `resumedAssignmentId` resolves to an
    // ALREADY-REGISTERED Assignment that a DIFFERENT authorization never
    // consumed, and `createSessionAssignment`'s claim-branch early return
    // would hand that Assignment (and its RunResult) back as if it were the
    // caller's own, discarding the real authorization with no error. Fail
    // loudly instead: refusing invents no new taskKey-derivation behavior
    // (that stays Phase 03's), it just stops this shape from looking like
    // success. `manifest.assignmentRefs.includes(...)` is the load-bearing
    // guard against firing on a genuine crash-recovery self-heal target,
    // whose claim is NOT yet registered.
    if (resumedAssignmentId && manifest.assignmentRefs.includes(resumedAssignmentId)) {
      if (authorization.consumedByAssignmentId !== resumedAssignmentId) {
        // Cross-binding collision (fan-out): the authorization THIS call
        // resolved to (by its own nodeId/operationId/targetActorId triple)
        // was never the one that produced the Assignment this taskKey
        // already claims -- a different binding's authorization, still
        // unconsumed, is about to be silently discarded while this caller
        // is handed the OTHER binding's result as its own.
        throw new CoordinationError(
          'validation',
          `dispatchDeclaredOperation: taskKey "${taskKey}" already resolves to Assignment "${resumedAssignmentId}", but authorization "${authorization.authorizationId}" for this exact binding (node "${node.id}", operation "${operationId}", actor "${actorId}") is not the one that Assignment consumed -- resuming would silently substitute a different binding's result for this one; pass an explicit, distinct taskKey (e.g. including the target actor) to invoke this binding`,
        );
      }
      // Same-binding collision: `authorization` IS the one resumedAssignmentId
      // already consumed (a genuine resume-match) -- still refuse if a
      // FRESHER unconsumed sibling authorization for this exact triple
      // exists, so a caller-issued second invocation at the SAME binding is
      // never silently ignored either.
      const freshUnconsumed = authorizations.find(
        (record) =>
          record.nodeId === node.id &&
          record.operationId === operationId &&
          record.targetActorId === actorId &&
          record.consumedByAssignmentId === null,
      );
      if (freshUnconsumed) {
        throw new CoordinationError(
          'validation',
          `dispatchDeclaredOperation: taskKey "${taskKey}" already resolves to Assignment "${resumedAssignmentId}", but a fresher unconsumed authorization "${freshUnconsumed.authorizationId}" exists for this same binding (node "${node.id}", operation "${operationId}", actor "${actorId}") -- resuming would silently discard that authorization instead of consuming it; pass an explicit, distinct taskKey to invoke this binding again`,
        );
      }
    }

    // Context-grant enforcement, both halves, INSIDE the dispatch path --
    // between resolving the authorization and building the contract this
    // function then hands to the executor. There is no other route to a
    // driver-authorized dispatch (this block is the only producer of
    // `authorizationProvenance`), so this is a gate, not an advisory filter
    // a caller could skip.
    //
    // (a) The grant itself must stay inside this session. Re-checked here
    //     even though `authorizeDeclaredOperation` already refused it at
    //     write time, because the raw `store.authorizeOperation` door has no
    //     session-membership awareness and can put such a record on the log.
    assertRefsOwnedBySession(authorization.grantedContextRefs, {
      coordinationId,
      assignmentRefs: manifest.assignmentRefs,
      fgosDir,
      label: `dispatchDeclaredOperation: authorization "${authorization.authorizationId}" grantedContextRefs`,
    });

    //     `targetArtifactRef` -- the artifact revision this invocation is
    //     revising or rechecking -- is a ref the session LINKS, on the same
    //     footing as the granted refs, so it is scope-checked identically.
    //     A session that could name another session's artifact revision as
    //     what it is rechecking would be recording cross-session lineage the
    //     grant clause exists to keep out.
    if (authorization.targetArtifactRef !== undefined) {
      assertRefsOwnedBySession([authorization.targetArtifactRef], {
        coordinationId,
        assignmentRefs: manifest.assignmentRefs,
        fgosDir,
        label: `dispatchDeclaredOperation: authorization "${authorization.authorizationId}" targetArtifactRef`,
      });
    }

    // (a2) Visibility-window legality, independently re-derived HERE at
    //      dispatch time -- never trusting whatever `authorizeDeclaredOperation`
    //      concluded earlier, the same "defense in depth, not merely two call
    //      sites of one cached answer" posture the ownership checks above
    //      already take (both re-run `assertRefsOwnedBySession`, not just
    //      authorize time). Uses the SAME `deriveVisibilityWindowState`
    //      function and the SAME already-taken `replayOnce()` reconstruction
    //      this dispatch is already using for the edge/authorization checks
    //      above, so a genuinely different verdict between authorize and
    //      dispatch can only mean the underlying event log itself changed
    //      between the two calls -- never a second, divergent derivation.
    const visibilityWindowRef = binding.contextAccess?.visibilityWindowRef;
    if (visibilityWindowRef !== undefined) {
      const { open } = deriveVisibilityWindowState(definition, visibilityWindowRef, replayOnce(), fgosDir);
      if (!open) {
        throw new CoordinationError(
          'validation',
          `dispatchDeclaredOperation: operation "${operationId}" at node "${node.id}" for actor "${actorId}" requires visibility window "${visibilityWindowRef}" to be open, and it is not open -- refusing to dispatch a driver-authorized worker whose granted context is not yet legal`,
        );
      }
    }

    // (b) The dispatched worker may read ONLY the granted refs plus the base
    //     context that is always legal for this Assignment. The single base
    //     ref is the mediated-visibility upstream request under a declared
    //     topology edge -- structurally imposed by the topology (already
    //     validated to belong to the edge's declared `from` actor) and never
    //     caller-widenable. Everything else on a driver-authorized dispatch
    //     is caller-supplied and must be named by the grant, so a sibling
    //     Assignment's output the driver never granted stays illegal to read.
    const legalContextRefs = new Set(authorization.grantedContextRefs);
    if (incomingEdge) legalContextRefs.add(fromAssignmentId);
    for (const ref of resolvedContextRefs) {
      if (!legalContextRefs.has(ref)) {
        throw new CoordinationError(
          'validation',
          `dispatchDeclaredOperation: contextRefs entry "${ref}" is not granted by authorization "${authorization.authorizationId}" (grantedContextRefs: [${authorization.grantedContextRefs.join(', ')}]) -- a driver-authorized worker may read only the granted refs plus its own always-legal base context`,
        );
      }
    }

    authorizationProvenance = {
      operationId,
      nodeId: node.id,
      authorizationId: authorization.authorizationId,
      invocationKey: authorization.invocationKey,
      contextGrant: { refs: [...authorization.grantedContextRefs] },
    };
  }

  // Claim-key squatting. `createSessionAssignment` resolves an ALREADY-CLAIMED
  // taskKey to its existing Assignment and hands it back as a success. When
  // that Assignment was materialized by a door that does not stamp -- an
  // ad-hoc `dispatchPrimaryTask` under a `declared:<operationId>` key, say --
  // this dispatch would "resume" work carrying no proof of THIS operation and
  // report success, while every visibility window gated on the operation
  // stayed shut forever with nothing anywhere naming the cause. Refusing
  // invents no new claim-key behavior (that stays Phase 03's); it just stops
  // the shape from looking like success, the same posture as the
  // driver-authorized collision guard above. `manifest.assignmentRefs` is the
  // load-bearing guard, exactly as it is there: a crash-recovery self-heal
  // target's claim is not yet registered, so a genuine resume of an
  // interrupted write still passes through untouched.
  const squattedAssignmentId = peekClaimedAssignmentId(resolveSessionPaths(coordinationId, opts).sessionDir, taskKey);
  if (
    squattedAssignmentId &&
    manifest.assignmentRefs.includes(squattedAssignmentId) &&
    !assignmentServesOperation(definition, operationId, { assignmentId: squattedAssignmentId, fgosDir })
  ) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: taskKey "${taskKey}" already resolves to Assignment "${squattedAssignmentId}", which carries no "${protocolOperationStamp(definition, operationId)}" provenance -- it was not materialized for operation "${operationId}" by this declared-dispatch door, so resuming it would report success while leaving the operation permanently unperformed; pass an explicit, distinct taskKey to dispatch this operation`,
    );
  }

  // R5: task-depth bound, checked against the REAL parent chain (never a
  // caller-asserted number) -- authoritative pre-lock, see the module-level
  // comment above this function for why this one needs no lock.
  assertWithinTaskDepth(fgosDir, incomingEdge ? fromAssignmentId : parentAssignmentId, manifest.aggregateBounds.maxTaskDepth, 'dispatchDeclaredOperation');

  const scopeStack = [
    { scope: 'runner', id: 'runner-default', policy: runnerPolicy },
    { scope: 'definition', id: definition.metadata.id, policy: definition.spec.policy ?? {} },
    { scope: 'operation', id: operationId, policy: operation.policy ?? {} },
    { scope: 'role', id: operation.role, policy: rolePolicy },
    { scope: 'actor', id: actorId, policy: actorEntry.policy ?? {} },
    { scope: 'assignment', id: taskKey, policy: assignmentPolicy },
    { scope: 'cli', id: 'cli', policy: cliPolicy },
  ];
  const { merged, provenance: policyProvenance } = resolveDeclaredPolicyStack(scopeStack);

  const cliOverride = {
    ...(merged.minTier !== undefined ? { minTier: merged.minTier } : {}),
    ...(merged.preferPersona !== undefined ? { preferPersona: merged.preferPersona } : {}),
    ...(merged.preferExecutor !== undefined ? { preferExecutor: merged.preferExecutor } : {}),
    ...(merged.fallbackExecutors !== undefined ? { fallbackExecutors: merged.fallbackExecutors } : {}),
    ...(merged.visibility !== undefined ? { visibility: merged.visibility } : {}),
    policyProvenance,
  };

  const contract = buildSessionContract({
    objective,
    contextRefs: resolvedContextRefs,
    constraints,
    // Appended by `buildSessionContract` itself, never spliced into the
    // caller-shared `constraints` array here -- that array is exactly what a
    // caller populates, so an engine stamp mixed into it would be
    // indistinguishable from a forged one to the reader below.
    protocolOperationRef: protocolOperationStamp(definition, operationId),
    expectedOutputs,
    evidenceRequired: operation.result?.evidenceRequired ?? 'reported',
    role: operation.role,
    capabilities: capabilities ?? operation.capabilities,
    budget,
    timeoutMs: opts.timeoutMs,
    // Phase 01 mutation-unlock (R1/R4): already refused above
    // (assertMutatingDispatchAllowed) if this is 'mutating' and R2/R3 don't
    // both hold -- reaching this line means it is legal to persist verbatim.
    mutation,
    // Step 08 P04.2b: thread the composed policy stack's own resolved
    // `minTier` into the inline contract's own `policy.minTier` ONLY when it
    // resolves BELOW `resolveAssignmentDispatchPolicy`'s hardcoded default
    // floor ('standard') -- that resolver's `effectiveTier = opPolicy.minTier
    // || 'standard'` already starts at 'standard', and `cliOverride.minTier`
    // (set unconditionally below, carrying this SAME `merged.minTier` value)
    // already reaches and correctly attributes provenance for anything AT or
    // ABOVE 'standard' by RAISING that default floor (`resolveStrongerTier`,
    // monotonic, provenance sourced to whichever scope in `policyProvenance`
    // actually won). Below 'standard' is the one case that channel can never
    // reach (raise-only), which is the entire reason this parameter exists.
    // Threading the SAME value through both channels unconditionally would
    // make `opPolicy.minTier` and `cliOverride.minTier` equal whenever
    // `merged.minTier` is 'standard' or higher, which collapses
    // `resolveAssignmentDispatchPolicy`'s own `strength(cliTier) >
    // strength(effectiveTier)` provenance-update check (strict `>`, ties
    // don't update) -- misattributing the resolved tier's provenance to a
    // synthetic `{scope: 'opPolicy', id: undefined}` instead of the real
    // scope `policyProvenance.tier` names. Confirmed empirically: threading
    // it unconditionally broke this exact provenance assertion in
    // `coordination-declared-consult.test.mjs`'s R3 precedence-chain test.
    minTier:
      merged.minTier !== undefined && TIER_STRENGTH[merged.minTier] < TIER_STRENGTH.standard
        ? merged.minTier
        : undefined,
  });
  const caller = {
    writerId,
    ...(incomingEdge
      ? { parentAssignmentId: fromAssignmentId }
      : parentAssignmentId !== undefined
        ? { parentAssignmentId }
        : {}),
  };

  // The pre-lock `roundsAlreadyUsed >= maxRounds` check above (inside the
  // `if (incomingEdge)` branch) is a fast-fail/UX shortcut only -- it can be
  // stale under real cross-process concurrency (two OS processes can both
  // read `replaySession()` before either has created an Assignment). The
  // AUTHORITATIVE, race-proof enforcement is `createSessionAssignment`'s own
  // opt-in `opts.maxRoundsForActor` (store.mjs), which re-checks on a FRESH
  // read taken INSIDE its own `withEventsLock` critical section. Forwarded
  // unconditionally whenever a declared topology edge governs this
  // dispatch (regardless of this function's own, possibly stale,
  // `isResumeOfThisRound` guess) -- `createSessionAssignment`'s own
  // `taskClaimPath` check already runs first and takes priority, so a
  // genuine resume of the SAME taskKey still short-circuits before the cap
  // check is ever reached, and is never double-counted.
  // R5 (continued): the 3 remaining bounds (maxAssignments, maxConcurrency,
  // maxRounds -- session-wide) ARE concurrency-sensitive (see the
  // module-level comment above this function), so they are forwarded here
  // unconditionally and enforced authoritatively inside
  // `createSessionAssignment`'s own lock (store.mjs), never decided by a
  // pre-lock read in this function.
  const dispatchResult = await createAndExecuteSessionTask(
    { coordinationId, taskKey, actorId, contract, caller, authorizationProvenance },
    {
      ...opts,
      cliOverride,
      maxAssignmentsForSession: manifest.aggregateBounds.maxAssignments,
      maxConcurrencyForSession: manifest.aggregateBounds.maxConcurrency,
      maxRoundsForSession: manifest.aggregateBounds.maxRounds,
      ...(incomingEdge ? { maxRoundsForActor: incomingEdge.maxRounds ?? Infinity } : {}),
      // A binding cap only ever NARROWS this one binding; store.mjs runs it
      // after every session-wide cap, so an aggregate bound that is stricter
      // still refuses first and a binding cap can never widen one. Forwarded
      // regardless of activation mode: the count comes from
      // `operation-authorized` events, which a `required` binding never has,
      // so declaring `maxInvocations` without `driver-authorized` stays inert
      // rather than silently meaning something different.
      ...(binding.activation?.maxInvocations !== undefined
        ? {
            bindingInvocationCap: {
              maxInvocations: binding.activation.maxInvocations,
              nodeId: node.id,
              operationId,
              targetActorId: actorId,
            },
          }
        : {}),
    },
  );

  return {
    ...dispatchResult,
    definitionRef: manifest.definitionRef,
    edge: incomingEdge ? { from: incomingEdge.from, to: incomingEdge.to, intent: resolvedIntent } : null,
  };
}

const DISPOSITION_VALUES = new Set(['accepted', 'rejected', 'partially-accepted']);
// Same posture as CONSULT_OBJECTIVE_MAX_LENGTH above -- generous but real,
// never unbounded by omission.
const DISPOSITION_RATIONALE_MAX_LENGTH = 2000;

/**
 * Require the primary (requester) actor to record a disposition --
 * `accepted | rejected | partially-accepted` plus a non-empty rationale --
 * for a specialist's already-settled advice (R4). Advice is persisted as
 * its own RunResult/evidence ref the moment `dispatchDeclaredOperation`
 * links it (unchanged, existing mechanism); THIS function additionally
 * requires that advice to already be linked before a disposition can be
 * recorded at all -- "primary receives the specialist's result only after
 * accepted evidence" (R2) is enforced here as an ordering precondition, not
 * merely a naming convention.
 *
 * The disposition itself is materialized as one more governed Assignment
 * under the requester actor -- reusing `createAndExecuteSessionTask` again,
 * never a bespoke persistence path -- whose `constraints` array carries the
 * caller-decided `disposition:<value>`/`rationale:<text>` pair verbatim (the
 * inline contract schema has no dedicated structured field for this; see
 * this cell's own report for the reasoning). `evidenceRequired` stays
 * `'reported'` unconditionally: advice is advisory and a disposition can
 * never make it "verified" -- there is no branch anywhere in this function
 * that could produce `'verified'`.
 *
 * R6 foreign-evidence / actor-impersonation guard: beyond "already a session
 * member" and "already linked," this function also requires
 * `consultantAssignmentId`'s bound actor to be reachable from
 * `requesterAssignmentId`'s bound actor via a REAL declared topology edge
 * (`edge.from === requesterActorId && edge.to === consultantActorId`) on the
 * session's own bound protocol. Without this, a caller could disposition ANY
 * already-linked, already-a-member Assignment as if it were "the
 * specialist's advice" -- including, in the degenerate case,
 * `requesterAssignmentId` itself (self-referential: the requester
 * "dispositioning" its own settled result) -- since neither prior check
 * verifies WHICH actor produced the referenced evidence relative to the
 * disposer. This is why `recordConsultDisposition` requires a declared
 * protocol (`manifest.definitionRef`) even though nothing else in this
 * function otherwise needs one: there is no session-topology-free way to
 * decide "is this really the consultant's advice, from THIS requester's own
 * consult" at all.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.requesterAssignmentId The primary's own Assignment (its actor's role is used for the disposition Assignment).
 * @param {string} params.consultantAssignmentId The specialist Assignment whose advice is being dispositioned; must already have a linked RunResult.
 * @param {'accepted'|'rejected'|'partially-accepted'} params.disposition
 * @param {string} params.rationale Non-empty, bounded.
 * @param {string} params.writerId
 * @param {string[]} [params.expectedOutputs]
 * @param {object} [params.budget]
 * @param {object} [opts]
 */
export async function recordConsultDisposition(
  coordinationId,
  { requesterAssignmentId, consultantAssignmentId, disposition, rationale, writerId, expectedOutputs, budget },
  opts = {},
) {
  if (!DISPOSITION_VALUES.has(disposition)) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: disposition must be one of ${[...DISPOSITION_VALUES].join(', ')}`,
    );
  }
  if (!isNonEmptyString(rationale) || rationale.length > DISPOSITION_RATIONALE_MAX_LENGTH) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: rationale must be a non-empty, bounded string (max ${DISPOSITION_RATIONALE_MAX_LENGTH} characters)`,
    );
  }

  const { assignmentRefs, events } = replaySession(coordinationId, opts);
  if (!assignmentRefs.includes(requesterAssignmentId)) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: requesterAssignmentId "${requesterAssignmentId}" is not a member of session "${coordinationId}"`,
    );
  }
  if (!assignmentRefs.includes(consultantAssignmentId)) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: consultantAssignmentId "${consultantAssignmentId}" is not a member of session "${coordinationId}"`,
    );
  }
  const consultLinked = events.some(
    (event) => event.type === 'result-linked' && event.payload.assignmentId === consultantAssignmentId,
  );
  if (!consultLinked) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: consultantAssignmentId "${consultantAssignmentId}" has no linked RunResult yet -- advice must settle before a disposition can be recorded`,
    );
  }
  const requesterCreatedEvent = events.find(
    (event) => event.type === 'assignment-created' && event.payload.assignmentId === requesterAssignmentId,
  );
  const requesterActorId = requesterCreatedEvent?.payload?.actorId;
  const manifest = readManifest(coordinationId, opts);
  const requesterRole = (manifest.actors ?? []).find((actor) => actor.id === requesterActorId)?.role;
  if (!requesterActorId || !requesterRole) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: requesterAssignmentId "${requesterAssignmentId}" is not bound to a known SessionActor`,
    );
  }

  // R6 foreign-evidence / actor-impersonation guard (see doc comment above):
  // `consultantAssignmentId` must belong to an actor the session's own
  // declared topology names as reachable FROM the requester's actor -- never
  // trusted merely because it is "a real session member with a linked
  // result" (that alone would also accept a self-referential or otherwise
  // unrelated Assignment).
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `recordConsultDisposition: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- disposition requires a declared topology to verify the consultant actor is legitimately reachable from the requester`,
    );
  }
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  const consultantCreatedEvent = events.find(
    (event) => event.type === 'assignment-created' && event.payload.assignmentId === consultantAssignmentId,
  );
  const consultantActorId = consultantCreatedEvent?.payload?.actorId;
  const legitimateEdge = definition.spec.profile.topology?.edges?.find(
    (edge) => edge.from === requesterActorId && edge.to === consultantActorId,
  );
  if (!consultantActorId || !legitimateEdge) {
    throw new CoordinationError(
      'foreign-ref',
      `recordConsultDisposition: consultantAssignmentId "${consultantAssignmentId}" (actor "${consultantActorId ?? 'unknown'}") is not reachable from requester actor "${requesterActorId}" via any declared topology edge -- refusing to disposition foreign or self-referential evidence as if it were specialist advice`,
    );
  }

  // R5: session bounds enforced BEFORE materialization -- same reasoning as
  // dispatchDeclaredOperation's own module-level comment above.
  assertWithinWallTimeBudget(manifest, 'recordConsultDisposition');
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  assertWithinTaskDepth(fgosDir, consultantAssignmentId, manifest.aggregateBounds.maxTaskDepth, 'recordConsultDisposition');

  const contract = buildSessionContract({
    objective: `Record disposition for consult advice from assignment "${consultantAssignmentId}".`,
    contextRefs: [consultantAssignmentId],
    constraints: [`disposition:${disposition}`, `rationale:${rationale}`],
    expectedOutputs: expectedOutputs ?? ['agent-result.json (status, summary)'],
    evidenceRequired: 'reported',
    role: requesterRole,
    budget,
    timeoutMs: opts.timeoutMs,
  });
  const caller = { writerId, parentAssignmentId: consultantAssignmentId };

  const dispatchResult = await createAndExecuteSessionTask(
    { coordinationId, taskKey: `disposition:${consultantAssignmentId}`, actorId: requesterActorId, contract, caller },
    {
      ...opts,
      maxAssignmentsForSession: manifest.aggregateBounds.maxAssignments,
      maxConcurrencyForSession: manifest.aggregateBounds.maxConcurrency,
      maxRoundsForSession: manifest.aggregateBounds.maxRounds,
    },
  );

  return { ...dispatchResult, disposition, rationale };
}

// ─── Phase 04 R5-R9: independent research fan-out / isolated fan-in ───────
//
// Everything below consumes P04.1's Cohort Planner (`cohort-planner.mjs`,
// read-only import -- this file never forks its allocation logic) and
// dispatches ONLY through `dispatchDeclaredOperation` above -- itself the
// only caller of `createAndExecuteSessionTask`, the sole shared execution
// primitive. No second execution path is introduced here.
//
// R5 "record the intended set before launch, one-way refs atomically":
// reused, not reinvented. `openDeclaredProtocolSession` already binds every
// `spec.actors[]` entry (`actor-bound` events) before any Assignment for
// this session exists (store.mjs's `openSession`); as long as the caller's
// FlowDefinition declares every fan-out branch actor up front (this cell's
// own fixture does), the intended cohort is already recorded atomically by
// the time `dispatchResearchFanOut` runs. `manifest.assignmentRefs`'s own
// atomic append (store.mjs's `completeAssignmentRegistration`, unchanged)
// is the one-way ref ledger this function relies on for every branch.
//
// R5 "execute concurrently under session and runner caps": reused, not
// reinvented, on BOTH halves of that phrase:
// - "session cap": `dispatchDeclaredOperation` already forwards
//   `maxAssignmentsForSession`/`maxConcurrencyForSession`/
//   `maxRoundsForSession` from `manifest.aggregateBounds` on every call;
//   calling it N times CONCURRENTLY (`Promise.allSettled`, below)
//   exercises the SAME lock-held checks inside `createSessionAssignment`
//   (store.mjs, P03.1/P03.2) N times racing for real, never a second,
//   fan-out-specific concurrency primitive.
// - "runner cap": this codebase already has ONE, pre-existing and
//   completely outside this file's or this cell's ownership --
//   `src/runner/main-checkout-lock.mjs`'s `dispatchLockFile(cwd)` +
//   `acquireMainCheckoutLock`, consumed unconditionally by every
//   out-of-process dispatch inside `dispatch/cli.mjs`'s
//   `executeExecutorCli` (tsk-64hk, "per-item dispatch concurrency
//   protection"). It allows only ONE real subprocess dispatch in flight
//   per `cwd` at a time, held for that dispatch's full duration,
//   regardless of mutation/read-only status. This function never
//   bypasses it (every branch still dispatches exclusively through
//   `dispatchDeclaredOperation` -> `createAndExecuteSessionTask` ->
//   `executeAssignment` -> the real out-of-process transport, the SAME
//   path every other caller in this file uses) -- a branch that loses
//   that race settles with an HONEST, explicit RunResult
//   (status/confidence: 'failed', `agentClaim.summary` naming
//   "already in flight"), never a silent drop, a hang, or a duplicate
//   dispatch. See this cell's own report for the full empirical trace
//   that discovered this (mis-labeled at first as a suspected bug in
//   this file, confirmed instead to be this pre-existing, correctly-
//   functioning runner-level cap).

/**
 * R5/R4: fan out ONE declared operation template to N distinct, named
 * branch actors, CONCURRENTLY, after re-verifying every planned allocation
 * against the CURRENT runner config immediately before dispatch (R4's
 * contract, wired for the first time in this track). Zero Assignments are
 * created if planning (`planCohort`) or any single allocation's handoff
 * verification fails -- the whole batch aborts before ANY branch launches,
 * the same "launch nothing on a planning/verification failure" posture
 * R9's impossible-fixture proof exercises explicitly.
 *
 * "No sibling edges" (R5) is checked structurally, not merely trusted from
 * the caller's own topology design: this function rejects a definition
 * whose topology declares ANY edge directly between two of the named
 * branch actors. Each branch's own context isolation (R6) then falls out
 * of `dispatchDeclaredOperation`'s EXISTING, unmodified edge-driven
 * behavior: a branch actor reached by a declared topology edge (this
 * fixture's `coordinator-actor -> researcher-*` shape) always resolves
 * `contextRefs` to EXACTLY `[fromAssignmentId]` -- the dispatcher's own
 * Assignment, never caller-overridable, never a sibling's -- and
 * `fromAssignmentId` itself must belong to the edge's declared `from`
 * actor (already enforced), so a sibling assignment id can never be
 * substituted in. `synthesizeResearchFanIn` (below) independently
 * re-verifies this from disk at fan-in time rather than only trusting
 * dispatch-time construction.
 *
 * @param {string} coordinationId Must already have a non-null `definitionRef`.
 * @param {object} params
 * @param {string} params.operationId The shared operation template every branch actor is wired to (e.g. `independent-research`).
 * @param {Array<{actorId: string, objective: string, expectedOutputs: string[], constraints?: string[], capabilities?: string[], budget?: object, writerId?: string, fromAssignmentId?: string, intent?: string, taskKey?: string}>} params.branches One entry per independent branch; `actorId` values must be distinct.
 * @param {string} [params.writerId] Default caller identity used for any branch that omits its own.
 * @param {string} [params.fromAssignmentId] Default dispatcher Assignment id (e.g. the coordinator's own fan-out dispatch task) used for any branch that omits its own; required when every branch actor is reached by a declared topology edge.
 * @param {Array<{id?: string, appliesTo: string, reason?: string}>} [params.fallbackRules] Forwarded to `planCohort` for soft diversity degradation.
 * @param {object} [opts] Forwarded to `dispatchDeclaredOperation`/`planCohort` (cwd, repoRoot, packageRoot, runnerConfig, timeoutMs, options, ...). `opts.runnerConfig` is read as the CURRENT runner config for both planning and the R4 re-verification.
 * @returns {Promise<Readonly<{status: 'planning-failed'|'aborted'|'dispatched', plan?: object, reason?: string, actorId?: string, branches?: Array<object>}>>}
 */
export async function dispatchResearchFanOut(
  coordinationId,
  { operationId, branches, writerId, fromAssignmentId, fallbackRules = [] },
  opts = {},
) {
  const manifest = readManifest(coordinationId, opts);
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `dispatchResearchFanOut: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- open it with openDeclaredProtocolSession()`,
    );
  }
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `dispatchResearchFanOut: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to materialize against a drifted definition`,
    );
  }

  const cohort = definition.spec.profile.cohort;
  if (!cohort || cohort.independence !== 'isolated-until-fan-in') {
    throw new CoordinationError(
      'validation',
      `dispatchResearchFanOut: definition "${definition.metadata.id}" does not declare spec.profile.cohort.independence: "isolated-until-fan-in" -- this entry point only fans out a genuinely independent cohort`,
    );
  }
  if (!Array.isArray(branches) || branches.length === 0) {
    throw new CoordinationError('validation', 'dispatchResearchFanOut: branches must be a non-empty array of {actorId, objective, expectedOutputs, ...}');
  }
  const branchActorIds = branches.map((b) => b.actorId);
  if (branchActorIds.some((id) => !isNonEmptyString(id))) {
    throw new CoordinationError('validation', 'dispatchResearchFanOut: every branch requires a non-empty actorId');
  }
  if (new Set(branchActorIds).size !== branchActorIds.length) {
    throw new CoordinationError('validation', 'dispatchResearchFanOut: branches must name distinct actorIds -- no actor may be dispatched twice in one fan-out');
  }

  // R5 structural proof (not merely trusted from the fixture's own design):
  // reject any declared topology edge directly between two named branch
  // actors -- "independent fan-out branches, no sibling edges."
  const branchActorIdSet = new Set(branchActorIds);
  const siblingEdge = (definition.spec.profile.topology?.edges ?? []).find(
    (edge) => branchActorIdSet.has(edge.from) && branchActorIdSet.has(edge.to),
  );
  if (siblingEdge) {
    throw new CoordinationError(
      'validation',
      `dispatchResearchFanOut: topology declares an edge between two named fan-out branch actors ("${siblingEdge.from}" -> "${siblingEdge.to}") -- independent fan-out branches must have NO sibling edges`,
    );
  }

  // R2/R4: plan cohort allocation (P04.1's planCohort, reused verbatim) then
  // re-verify EVERY relevant planned allocation against the CURRENT runner
  // config immediately before dispatch, aborting the WHOLE batch before any
  // branch launches on the first `abort: true` -- R4's contract, wired for
  // the first time in this track. `opts.runnerConfig` is read once and used
  // identically for both planning and re-verification, so "current" means
  // the same config snapshot throughout this call.
  const currentRunnerConfig = opts.runnerConfig;
  const plan = planCohort({ definition, runnerConfig: currentRunnerConfig, fallbackRules });
  if (plan.status !== 'allocated') {
    return Object.freeze({ status: 'planning-failed', plan, branches: Object.freeze([]) });
  }

  const relevantAllocations = plan.allocations.filter((a) => branchActorIdSet.has(a.actorId));
  const missingAllocationActorId = branchActorIds.find((id) => !relevantAllocations.some((a) => a.actorId === id));
  if (missingAllocationActorId) {
    throw new CoordinationError(
      'validation',
      `dispatchResearchFanOut: cohort plan has no allocation for branch actor "${missingAllocationActorId}" -- confirm it is declared in spec.actors and wired into the protocol graph`,
    );
  }

  for (const allocation of relevantAllocations) {
    const verification = verifyPlannedAllocationAgainstCurrentConfig(allocation, currentRunnerConfig);
    if (verification.abort) {
      return Object.freeze({
        status: 'aborted',
        reason: verification.reason,
        actorId: allocation.actorId,
        plan,
        branches: Object.freeze([]),
      });
    }
  }

  // R5: dispatch every branch CONCURRENTLY through the SAME
  // dispatchDeclaredOperation -> createAndExecuteSessionTask ->
  // executeAssignment path every other declared-protocol dispatch in this
  // file already uses. `cliPolicy` carries the planner's concrete
  // `preferExecutor`/`minTier` choice at the ONE scope legally allowed to
  // pin a literal executor (the trusted human/CLI scope,
  // `assertNoPortableExecutorPin` above) -- never written into a portable
  // definition/operation/role/actor scope.
  const settled = await Promise.allSettled(
    branches.map((branch) => {
      const allocation = relevantAllocations.find((a) => a.actorId === branch.actorId);
      return dispatchDeclaredOperation(
        coordinationId,
        {
          operationId,
          targetActorId: branch.actorId,
          objective: branch.objective,
          expectedOutputs: branch.expectedOutputs,
          constraints: branch.constraints,
          capabilities: branch.capabilities,
          budget: branch.budget,
          writerId: branch.writerId ?? writerId,
          fromAssignmentId: branch.fromAssignmentId ?? fromAssignmentId,
          intent: branch.intent,
          taskKey: branch.taskKey ?? `research-branch:${branch.actorId}`,
          cliPolicy: { preferExecutor: allocation.executorId, minTier: allocation.tier },
        },
        opts,
      );
    }),
  );

  const dispatchedBranches = settled.map((outcome, i) => ({
    actorId: branches[i].actorId,
    allocation: relevantAllocations.find((a) => a.actorId === branches[i].actorId),
    status: outcome.status,
    ...(outcome.status === 'fulfilled' ? { result: outcome.value } : { error: outcome.reason?.message ?? String(outcome.reason) }),
  }));

  return Object.freeze({ status: 'dispatched', plan, branches: Object.freeze(dispatchedBranches.map((b) => Object.freeze(b))) });
}

/**
 * R6/R7: synthesize a fan-in over the named branch actors AFTER
 * `dispatchResearchFanOut`, reading each branch's persisted Assignment/
 * RunResult directly off disk (never trusting the dispatcher's own
 * in-memory return value alone) so this function can run independently,
 * any time after dispatch -- including a later process, matching this
 * file's existing resume/replay discipline elsewhere.
 *
 * R6 (independently re-verified here, not just trusted from dispatch-time
 * construction): for each branch, the persisted `assignment.json`'s own
 * `provenance.inline.contract.contextRefs` must never reference ANOTHER
 * named branch actor's Assignment -- a genuine on-disk proof of "no
 * sibling visibility before fan-in," not an assertion.
 *
 * R7 (never launders, never erases, never infers consensus from count):
 * - A branch RunResult's `confidence` is read and reported EXACTLY as
 *   persisted -- only `confidence === 'verified'` branches enter
 *   `accepted` (the bucket a caller may treat as a material, checkable
 *   fact); `'reported'`/`'inferred'` branches are recorded in `unverified`,
 *   NEVER promoted into `accepted`. (Read-only Assignments in this whole
 *   standalone-session slice can never actually classify as `'verified'`
 *   -- `classifyRunEvidence`'s read-only branch has no path to it,
 *   confirmed directly in `assignment-runner.mjs` and already documented
 *   by this track's own `coordination-declared-consult.test.mjs` R4 tests
 *   -- so a real dispatch's `accepted` bucket is legitimately expected to
 *   stay empty; this function proves it does not silently paper over that
 *   by upgrading a `'reported'` finding instead.)
 * - `caller-declared `contradictions` are passed through UNCHANGED into the
 *   returned object -- this function has no domain knowledge to detect a
 *   semantic contradiction between two branches' prose findings (out of
 *   scope, no NLP/scoring), so it never invents or erases one; it only
 *   guarantees whatever the caller already knows to be contradictory is
 *   never silently dropped from the synthesis record.
 * - `explanation` never claims "consensus" from `accepted.length` alone: it
 *   is empty/absent when there are zero accepted entries, explicitly scoped
 *   to "partial" when any required branch is missing/failed and a partial
 *   policy is in effect, and explicitly withheld when `contradictions` is
 *   non-empty.
 * - Missing (no Assignment ever created, or created but not yet settled)
 *   and failed (`status === 'failed'`/`confidence` in `{failed, no-evidence}`)
 *   branches are both named explicitly, never silently absent from the
 *   result.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string[]} params.branchActorIds The full set of required branch actor ids for this fan-in.
 * @param {Array<{branchActorIds: string[], reason?: string}>} [params.contradictions] Caller-declared, pass-through only.
 * @param {boolean} [params.partial] When true, synthesizes over whatever branches HAVE settled even if some required branches are still missing/failed (an explicit partial-completion policy, R6's "or an explicit partial policy is evaluated"); when false (default), returns `status: 'incomplete'` with zero accepted/unverified entries until every required branch has settled.
 * @param {object} [opts] Workspace options (cwd, repoRoot).
 * @returns {Readonly<object>}
 */
export function synthesizeResearchFanIn(coordinationId, { branchActorIds, contradictions = [], partial = false }, opts = {}) {
  if (!Array.isArray(branchActorIds) || branchActorIds.length === 0) {
    throw new CoordinationError('validation', 'synthesizeResearchFanIn: branchActorIds must be a non-empty array');
  }
  const { events } = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  const branchActorIdSet = new Set(branchActorIds);

  const createdEventByActor = new Map();
  for (const actorId of branchActorIds) {
    const createdEvent = events.find((e) => e.type === 'assignment-created' && e.payload.actorId === actorId);
    if (createdEvent) createdEventByActor.set(actorId, createdEvent);
  }

  const accepted = [];
  const unverified = [];
  const failed = [];
  const missing = [];

  for (const actorId of branchActorIds) {
    const createdEvent = createdEventByActor.get(actorId);
    if (!createdEvent) {
      missing.push({ actorId, reason: 'no Assignment was ever created for this branch actor' });
      continue;
    }
    const assignmentId = createdEvent.payload.assignmentId;

    // R6, independently re-verified at fan-in time: the persisted
    // Assignment's own inline contract must never reference a SIBLING
    // branch actor's Assignment as a contextRef.
    const assignmentJsonPath = path.join(fgosDir, 'assignments', assignmentId, 'assignment.json');
    let assignmentJson;
    try {
      assignmentJson = JSON.parse(fs.readFileSync(assignmentJsonPath, 'utf8'));
    } catch (err) {
      throw new CoordinationError('corrupt-log', `synthesizeResearchFanIn: assignment.json for "${assignmentId}" (actor "${actorId}") could not be read: ${err.message}`);
    }
    const branchContextRefs = assignmentJson?.provenance?.inline?.contract?.contextRefs ?? [];
    for (const [otherActorId, otherCreatedEvent] of createdEventByActor) {
      if (otherActorId === actorId) continue;
      if (branchActorIdSet.has(otherActorId) && branchContextRefs.includes(otherCreatedEvent.payload.assignmentId)) {
        throw new CoordinationError(
          'foreign-ref',
          `synthesizeResearchFanIn: branch actor "${actorId}"'s Assignment "${assignmentId}" contextRefs references sibling branch actor "${otherActorId}"'s Assignment -- sibling visibility before fan-in is rejected`,
        );
      }
    }

    const linkedEvent = lastEventFor(events, 'result-linked', assignmentId);
    if (!linkedEvent) {
      missing.push({ actorId, assignmentId, reason: 'Assignment created but not yet settled (no linked RunResult)' });
      continue;
    }
    const runResult = readLinkedRunResultFromDisk(fgosDir, assignmentId, linkedEvent.payload.runId);

    if (runResult.status === 'failed' || runResult.confidence === 'failed' || runResult.confidence === 'no-evidence') {
      failed.push({ actorId, assignmentId, runId: runResult.runId, status: runResult.status, confidence: runResult.confidence });
    } else if (runResult.confidence === 'verified') {
      accepted.push({ actorId, assignmentId, runId: runResult.runId, confidence: runResult.confidence });
    } else {
      // 'reported' / 'inferred': recorded explicitly, NEVER promoted into
      // `accepted` -- the evidence-laundering guard R7 requires.
      unverified.push({ actorId, assignmentId, runId: runResult.runId, confidence: runResult.confidence });
    }
  }

  const allRequiredSettled = missing.length === 0;
  if (!allRequiredSettled && !partial) {
    return Object.freeze({
      status: 'incomplete',
      reason: `${missing.length} of ${branchActorIds.length} required branch(es) have not settled -- fan-in requires every required branch to settle, or an explicit partial policy`,
      accepted: Object.freeze([]),
      unverified: Object.freeze([]),
      failed: Object.freeze([]),
      missing: Object.freeze(missing),
      contradictions: Object.freeze([...contradictions]),
    });
  }

  const explanation =
    accepted.length === 0
      ? missing.length > 0 || failed.length > 0
        ? `No branch produced verified evidence under an explicit partial policy (${missing.length} missing, ${failed.length} failed) -- synthesis has no accepted material findings.`
        : 'No branch produced verified evidence -- synthesis has no accepted material findings.'
      : contradictions.length > 0
        ? `${accepted.length} branch(es) produced verified evidence, but ${contradictions.length} declared contradiction(s) remain unresolved -- no consensus is reported.`
        : missing.length > 0 || failed.length > 0
          ? `${accepted.length} branch(es) accepted with verified evidence under an explicit partial policy (${missing.length} missing, ${failed.length} failed) -- consensus is scoped to the accepted branches only, never inferred from the full declared cohort's branch count.`
          : `${accepted.length}/${branchActorIds.length} branch(es) produced verified evidence with no declared contradictions.`;

  return Object.freeze({
    status: 'synthesized',
    accepted: Object.freeze(accepted.map((a) => Object.freeze(a))),
    unverified: Object.freeze(unverified.map((a) => Object.freeze(a))),
    failed: Object.freeze(failed.map((a) => Object.freeze(a))),
    missing: Object.freeze(missing.map((a) => Object.freeze(a))),
    contradictions: Object.freeze([...contradictions]),
    explanation,
  });
}

// ─── Phase 06 R1-R4: quorum/partial policy, retry/replacement, crash
// recovery, cancellation ───────────────────────────────────────────────────
//
// Everything below reuses the SAME store.mjs/replay.mjs primitives every
// earlier phase already relies on (`replaySession`, `linkResult`,
// `transitionSessionStatus`, `bindActor`) plus three new store.mjs doors
// added for this phase (`recordRunRetry`, `recordActorReplacement`, and
// `linkResult`'s `allowSupersede` opt-in) -- no new execution/dispatch
// surface is introduced; retry re-executes through the EXISTING
// `executeAssignment` import this file already uses for every other
// dispatch, and actor replacement materializes new work only through the
// EXISTING `dispatchDeclaredOperation`/`dispatchPrimaryTask`/`proposeConsult`
// functions above (never a shortcut), which is what makes "re-runs
// governance" true by construction rather than by a second, parallel check.

/**
 * R1: resolve each required SessionActor's outcome for `coordinationId`,
 * following any `actor-replaced` chain to the CURRENT actor fulfilling that
 * original slot. Pure/read-only -- never transitions the session; see
 * `closeSessionByQuorum` for the write side.
 *
 * @param {string} coordinationId
 * @param {object} [opts]
 * @returns {Readonly<{requiredActorIds: string[], completed: object[], failed: object[], late: object[], missing: object[], replaced: object[]}>}
 *   Every bucket entry carries `{actorId}` (the ORIGINAL required actor id);
 *   `completed`/`failed` also carry `{assignmentId, runId}`; `late` carries
 *   `{assignmentId}` (created, not yet settled); `replaced` carries
 *   `{actorId, replacedBy}` (the actor id that now fulfills this slot) IN
 *   ADDITION to that actor's own entry in exactly one of the other buckets
 *   (a replaced slot is never silently absent from completed/failed/late/missing).
 */
export function evaluateSessionQuorum(coordinationId, opts = {}) {
  const { manifest, events } = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  return classifySessionQuorum(coordinationId, manifest, events, fgosDir, opts);
}

// Shared classification body behind `evaluateSessionQuorum` (its own
// standalone unlocked read+classify) AND `closeSessionByQuorum`'s internal
// locked path below -- ONE classification implementation, never two
// independently-maintained copies, regardless of which caller supplies
// `{manifest, events}` (a fresh unlocked read for the former, a fresh read
// taken INSIDE the terminal write's lock for the latter).
//
// P10-KERNEL-FIX: `manifest.definitionRef` set (a declared-protocol session)
// additionally loads that definition so each actor can be classified against
// `actorGatingOperationIds` (ALL of that actor's gating bindings, not just
// its first-ever settled Assignment) via `resolveBindingOutcome` -- the same
// per-operation classifier `resolveOperationOutcome`/visibility windows
// already use, reused here rather than reimplemented. An actor with no
// gating binding at all (or a session with no declared protocol,
// `definitionRef: null`) falls through to the ORIGINAL "first
// assignment-created event for this actor, anywhere" rule, byte-for-byte
// unchanged -- see `actorGatingOperationIds`'s own doc comment for exactly
// which bindings gate and why, and P10-KERNEL-FIX.md for the full
// investigation.
//
// P10-KERNEL-FIX Fix Round 1 (HIGH-1/HIGH-2) + Fix Round 2 (N1/N2/NEW-HIGH-A,
// reviewer-recheck-report.md / redteam-recheck-report.md): this is a
// read/close-decision path invoked on EVERY request against a
// declared-protocol session, including `coordination show`. Two failure
// classes can stop the bound definition from classifying cleanly --
// RESOLUTION failure (registry cannot resolve the id at all: a malformed
// sibling file, a removed/renamed protocol, a missing `yaml` module) and
// VERSION DRIFT (resolution succeeds, but to a version other than the one
// this session was opened against). Both are now handled SYMMETRICALLY
// across the two doors this function serves, by posture rather than by
// cause:
//
// - READ (`evaluateSessionQuorum`, and `show.mjs`'s use of it) always
//   degrades to `definition = null` -- the pre-existing fallback path,
//   below -- on EITHER failure class, and never throws. `show` must keep
//   working under an unresolvable OR a drifted definition (its own stated
//   invariant); a drifted read reports the honest pre-fix answer (the loose
//   fallback rule) rather than silently misclassifying an already-settled
//   actor as "missing" under stamps that embed a version the read can no
//   longer match (Fix Round 2, N2/NEW-HIGH-A: this was a genuine new
//   regression against pre-fix HEAD, not "pre-existing laxness" as an
//   earlier draft of this comment and P10-KERNEL-FIX.md §7.2 both,
//   incorrectly, claimed).
// - CLOSE (`closeSessionByQuorum`, only -- `opts.enforceDefinitionVersion`,
//   below) requires a CLEANLY-RESOLVED, VERSION-MATCHED definition, or
//   refuses explicitly with an honest, correctly-attributed reason -- never
//   a silent fallback for either failure class. A resolution failure at
//   close time is a MUTATION-door failure (Fix Round 2, N1,
//   reviewer-recheck-report.md): falling back silently there disables the
//   whole multi-operation gating rule this cell exists to add and restores
//   this cell's own premature-close bug (one unrelated half-written
//   protocol file in the registry would silently reopen it). Both failure
//   classes therefore refuse through the SAME mechanism at close -- one
//   unified "a close needs a real, matching definition" path, not two
//   independent special cases -- matching every sibling definition-consuming
//   mutation door in this file (`authorizeDeclaredOperation`/
//   `dispatchDeclaredOperation`/`validateSessionAggregation`/
//   `linkSessionContribution`).
function classifySessionQuorum(coordinationId, manifest, events, fgosDir, opts = {}) {
  const requiredActorIds = (manifest.actors ?? []).map((actor) => actor.id);

  let definition = null;
  if (manifest.definitionRef) {
    let resolved = null;
    try {
      resolved = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
    } catch {
      resolved = null;
    }
    const drifted = resolved !== null && resolved.metadata.version !== manifest.definitionRef.version;

    if (opts.enforceDefinitionVersion) {
      if (resolved === null) {
        throw new CoordinationError(
          'validation',
          `classifySessionQuorum: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved -- refusing to close against an unresolvable definition`,
        );
      }
      if (drifted) {
        throw new CoordinationError(
          'validation',
          `classifySessionQuorum: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${resolved.metadata.version}" -- refusing to close against a drifted definition`,
        );
      }
      definition = resolved;
    } else {
      definition = drifted ? null : resolved;
    }
  }

  const replacedBy = new Map(); // oldActorId -> replacementActorId
  const replacementTargets = new Set(); // every id that is SOMEONE's replacement (never evaluated as its own top-level slot)
  for (const event of events) {
    if (event.type === 'actor-replaced') {
      replacedBy.set(event.payload.oldActorId, event.payload.replacementActorId);
      replacementTargets.add(event.payload.replacementActorId);
    }
  }
  function resolveEffectiveActor(id) {
    let current = id;
    const seen = new Set();
    while (replacedBy.has(current) && !seen.has(current)) {
      seen.add(current);
      current = replacedBy.get(current);
    }
    return current;
  }

  const completed = [];
  const failed = [];
  const late = [];
  const missing = [];
  const replaced = [];

  for (const originalActorId of requiredActorIds) {
    if (replacementTargets.has(originalActorId)) continue; // covered via its predecessor's resolution below
    const effectiveId = resolveEffectiveActor(originalActorId);
    if (effectiveId !== originalActorId) {
      replaced.push({ actorId: originalActorId, replacedBy: effectiveId });
    }

    const gatingOperationIds = definition ? actorGatingOperationIds(definition, originalActorId) : [];
    if (gatingOperationIds.length > 0) {
      // Multi-operation-aware path (P10-KERNEL-FIX): EVERY gating binding
      // for this actor must resolve to a satisfied, operation-stamped
      // Assignment -- `resolveBindingOutcome` already follows the SAME
      // `actor-replaced` lineage (`replacedBy`, built above) and the SAME
      // failed/late/missing vocabulary this function's own fallback path
      // (below) uses, so both paths report through one shared vocabulary.
      const outcomes = gatingOperationIds.map((operationId) => resolveBindingOutcome(definition, operationId, originalActorId, { events, fgosDir, replacedBy }));
      const unsatisfied = outcomes.find((outcome) => !outcome.satisfied);
      if (!unsatisfied) {
        const last = outcomes[outcomes.length - 1];
        completed.push({ actorId: originalActorId, assignmentId: last.assignmentId, runId: last.runId });
      } else if (unsatisfied.reason === 'missing') {
        missing.push({ actorId: originalActorId });
      } else if (unsatisfied.reason === 'late') {
        late.push({ actorId: originalActorId, assignmentId: unsatisfied.assignmentId });
      } else {
        failed.push({ actorId: originalActorId, assignmentId: unsatisfied.assignmentId, runId: unsatisfied.runId });
      }
      continue;
    }

    // Fallback (pre-existing, unchanged): no gating binding anywhere for
    // this actor -- either this session has no declared protocol at all, or
    // every binding this actor has is an ungated driver-authorized one
    // (`actorGatingOperationIds`). "First assignment-created event for this
    // actor, anywhere" is exactly correct for a session with no protocol
    // (no graph to consult in the first place) and for the real shipped
    // shape this fallback exists to preserve (`standalone-master-
    // coordination-loop.yaml`'s "fixer", whose only binding, revise-
    // candidate, is a single ungated driver-authorized operation --
    // `coordination-launch-master-loop.test.mjs`'s own `coord_launcher_live`
    // proves and depends on "missing until dispatched" for exactly this
    // shape). A HYPOTHETICAL actor with two-or-more ungated
    // driver-authorized bindings and no required binding at all would still
    // see this fallback count it complete after only the FIRST of those
    // settles -- the same limitation this whole fix addresses for gating
    // bindings, just not (yet) extended to the ungated case, because no
    // real fixture in this repo has that shape today (P10-KERNEL-FIX.md
    // Gaps).
    const createdEvent = events.find((event) => event.type === 'assignment-created' && event.payload.actorId === effectiveId);
    if (!createdEvent) {
      missing.push({ actorId: originalActorId });
      continue;
    }
    const assignmentId = createdEvent.payload.assignmentId;
    const latestLink = lastEventFor(events, 'result-linked', assignmentId);
    if (!latestLink) {
      late.push({ actorId: originalActorId, assignmentId });
      continue;
    }
    const runResult = readLinkedRunResultFromDisk(fgosDir, assignmentId, latestLink.payload.runId);
    if (runResult.status === 'failed' || runResult.confidence === 'failed' || runResult.confidence === 'no-evidence') {
      failed.push({ actorId: originalActorId, assignmentId, runId: runResult.runId });
    } else {
      completed.push({ actorId: originalActorId, assignmentId, runId: runResult.runId });
    }
  }

  return Object.freeze({
    requiredActorIds: Object.freeze(requiredActorIds),
    completed: Object.freeze(completed.map((e) => Object.freeze(e))),
    failed: Object.freeze(failed.map((e) => Object.freeze(e))),
    late: Object.freeze(late.map((e) => Object.freeze(e))),
    missing: Object.freeze(missing.map((e) => Object.freeze(e))),
    replaced: Object.freeze(replaced.map((e) => Object.freeze(e))),
  });
}

/**
 * R1: close `coordinationId` to a terminal status by evaluating quorum
 * against every required SessionActor (`evaluateSessionQuorum`).
 * - Every required actor `completed` (none missing/failed/late) -> transitions
 *   to `'completed'`.
 * - Otherwise, requires the session's OWN declared `manifest.partialPolicy`
 *   (set at `openSession`/`openStandaloneSession`/`openDeclaredProtocolSession`
 *   time -- never conjured here) to explicitly name every incomplete actor in
 *   `allowedOmissions`, and (when declared) requires at least
 *   `minimumActors` to have completed. Closes to `'partial'` ONLY when both
 *   hold -- "partial never serializes as consensus" (a distinct status from
 *   `'completed'`, always).
 * - No declared policy, or the policy does not cover every incomplete actor,
 *   or too few actors completed: throws `CoordinationError('validation', ...)`
 *   and the session stays `'active'` -- default completion requires every
 *   required actor, and an unauthorized partial close is refused rather than
 *   silently accepted.
 *
 * `dissentingActorIds` (optional): caller-declared pass-through, same
 * philosophy as `synthesizeResearchFanIn`'s own `contradictions` parameter --
 * this engine has no semantic model of "disagreement," so it never infers
 * dissent, only records what the caller already knows to be true (e.g. from
 * a `recordConsultDisposition` rejection it observed).
 *
 * @param {string} coordinationId
 * @param {object} [params]
 * @param {string[]} [params.dissentingActorIds]
 * @param {string} [params.aggregationId] Phase 07: consult this session's own
 *   validated aggregation as terminal input. Can only REFUSE a close (see the
 *   inline note); omitting it leaves every path here unchanged.
 * @returns {Readonly<object>} The transitioned manifest.
 */
export function closeSessionByQuorum(coordinationId, { dissentingActorIds = [], aggregationId } = {}, opts = {}) {
  // The classification (which actors are complete/missing/failed/late) and
  // the terminal write both happen INSIDE this ONE held lock, from a fresh
  // `replaySession()` taken after acquiring it -- never from an earlier
  // unlocked read. A result that genuinely lands between "we started
  // closing" and "we actually write" is either (a) not yet durable when we
  // acquire the lock, in which case it is correctly still missing/late, or
  // (b) already durable (its own write went through this SAME lock first),
  // in which case this fresh read sees it. There is no window where a
  // genuinely-completed actor's result can be permanently, falsely recorded
  // as missing in the absorbing terminal event.
  return withSessionLock(
    coordinationId,
    (paths) => {
      const replayed = replaySession(coordinationId, opts);
      const { manifest, events } = replayed;

      // Phase 07 (MVP7): a validated cognitive aggregation used as terminal
      // INPUT. Strictly a NARROWING -- the only thing it can do is refuse a
      // close that quorum would otherwise have allowed. It never selects a
      // status, never relaxes the partialPolicy rules below, and never closes
      // a session quorum would have refused, so terminal-transition authority
      // stays entirely with this function. Omitting `aggregationId` leaves
      // every path below byte-identical to what it was before aggregation
      // existed.
      //
      // The outcome is read from `replayed.aggregations` -- the event log,
      // inside this same held lock -- never from a caller-supplied verdict,
      // and never from `ignoredAggregations` (a post-terminal event, which by
      // definition cannot inform a close that already happened).
      if (aggregationId !== undefined) {
        const validated = replayed.aggregations.find((record) => record.aggregationId === aggregationId);
        if (!validated) {
          throw new CoordinationError(
            'dangling-ref',
            `closeSessionByQuorum: session "${coordinationId}" has no valid "aggregation-validated" event for aggregation "${aggregationId}" -- refusing to close against an aggregation this session never validated`,
          );
        }
        if (validated.outcome !== 'consensus') {
          throw new CoordinationError(
            'validation',
            `closeSessionByQuorum: aggregation "${aggregationId}" of session "${coordinationId}" validated as "${validated.outcome}", not "consensus" -- refusing to close; resolve the aggregation and validate a new one, or close this session by another declared route`,
          );
        }
      }

      const quorum = classifySessionQuorum(coordinationId, manifest, events, paths.fgosDir, { ...opts, enforceDefinitionVersion: true });
      const incomplete = [...quorum.failed, ...quorum.late, ...quorum.missing];
      const incompleteActorIds = incomplete.map((entry) => entry.actorId);

      if (incompleteActorIds.length === 0) {
        return transitionSessionStatusLocked(
          coordinationId,
          'completed',
          {
            ...(quorum.replaced.length > 0 ? { replacedActors: quorum.replaced.map((r) => r.actorId) } : {}),
            ...(dissentingActorIds.length > 0 ? { dissentingActors: dissentingActorIds } : {}),
          },
          paths,
        );
      }

      const policy = manifest.partialPolicy;
      if (!policy) {
        throw new CoordinationError(
          'validation',
          `closeSessionByQuorum: session "${coordinationId}" is missing required actor(s) [${incompleteActorIds.join(', ')}] and declares no partialPolicy -- default completion requires every required SessionActor (R1)`,
        );
      }
      const allowed = new Set(policy.allowedOmissions ?? []);
      const notAllowed = incompleteActorIds.filter((id) => !allowed.has(id));
      if (notAllowed.length > 0) {
        throw new CoordinationError(
          'validation',
          `closeSessionByQuorum: actor(s) [${notAllowed.join(', ')}] are missing/failed/late but not named in session "${coordinationId}"'s declared partialPolicy.allowedOmissions -- refusing an undeclared partial close`,
        );
      }
      if (policy.minimumActors !== undefined && quorum.completed.length < policy.minimumActors) {
        throw new CoordinationError(
          'validation',
          `closeSessionByQuorum: only ${quorum.completed.length} actor(s) completed in session "${coordinationId}", below the declared partialPolicy.minimumActors (${policy.minimumActors})`,
        );
      }

      return transitionSessionStatusLocked(
        coordinationId,
        'partial',
        {
          missingActors: incompleteActorIds,
          ...(quorum.failed.length > 0 ? { failedActors: quorum.failed.map((f) => f.actorId) } : {}),
          ...(quorum.late.length > 0 ? { lateActors: quorum.late.map((l) => l.actorId) } : {}),
          ...(quorum.replaced.length > 0 ? { replacedActors: quorum.replaced.map((r) => r.actorId) } : {}),
          ...(dissentingActorIds.length > 0 ? { dissentingActors: dissentingActorIds } : {}),
        },
        paths,
      );
    },
    opts,
  );
}

// ─── Phase 07 (Step 09 MVP7): evidence-preserving aggregation ──────────────
//
// The Team Cognition evaluator (`../team-cognition/aggregation-evaluator.mjs`)
// is a pure function with no session or store access, by its own design. This
// section is the ONE place that gives it session-derived evidence and records
// what it decided. The split of authority is the point of the whole phase:
//
//   evaluator  -> decides the cognitive OUTCOME from evidence handed to it
//   this file  -> decides what evidence is real, and owns every transition
//
// so a validated outcome is terminal INPUT (`closeSessionByQuorum`'s optional
// `aggregationId` below), never a transition of its own.

const AGGREGATION_METHOD = 'evidence-preserving-synthesis';

// The disclosure ids this engine can derive from session evidence. Every one
// is ENGINE-classified, never worker-asserted: `status`/`confidence` come from
// `classifyRunEvidence`'s verdict on the filesystem (assignment-runner.mjs),
// not from the worker's own `agentClaim`. A definition whose
// `requiredDisclosures[]` names anything outside this set gets a disclosure
// coverage failure from the evaluator -- fail-closed, never a silently
// skipped requirement.
function deriveDisclosures(runResult) {
  return {
    status: runResult.status,
    confidence: runResult.confidence,
    // A contribution that came back `blocked` is a settled result that
    // nonetheless carries an objection. Surfacing it as a `dissent` disclosure
    // is what lets the evaluator's hidden-dissent check do real work here: if
    // the driver's own `dissentRefs` never names that source operation, the
    // aggregation quietly counted an objecting contribution as agreement.
    // A fixed marker, never the worker's own summary text -- no prose is
    // parsed for meaning anywhere in this path (plan.md Non-Negotiable
    // Deferrals).
    dissent: runResult.status === 'blocked' ? 'blocked' : 'none',
  };
}

function sha256OfFile(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return undefined;
  }
}

/**
 * Turn ONE satisfied source binding into the evaluator's `AggregationSource`
 * shape, plus the artifact's CURRENT revision for staleness checking.
 *
 * The immutability pin is `settleReports[].sha256` -- the hash
 * `assignment-runner.mjs` takes of the exact report bytes it classified, for
 * exactly this purpose ("a report planted or edited after settle is not in
 * the set (or no longer matches) and can never satisfy a report gate"). The
 * current revision is that same file's hash recomputed now, so a report edited
 * after settle makes its source stale and the outcome `no-consensus`.
 *
 * The file is located by DERIVING its path from the validated
 * `assignmentId`/`runId` (identical derivation to `readLinkedRunResultFromDisk`
 * above, including the full-shape runId check), never by joining the
 * `settleReports[].path` string out of `result.json`. That string is recorded
 * provenance and is used only as an opaque map key: joining it into a
 * filesystem path would make a hand-edited `result.json` a traversal surface,
 * which is precisely the class R6 closed for `runId`.
 *
 * Returns `null` when the run carries no usable pin -- the caller records that
 * contribution as unresolved rather than feeding an unpinned source in.
 */
function aggregationSourceFrom(fgosDir, sourceOperationRef, assignmentId, runId, runResult) {
  const settleReports = Array.isArray(runResult.settleReports) ? runResult.settleReports : [];
  // Today's runner records at most one settle report per run (the single
  // `agent-report.md`), so this is a guard against a shape this code has no
  // rule for, not a routine branch: with several artifacts there is no
  // declared way to pick which one the revision pin refers to.
  if (settleReports.length !== 1) return null;
  const [report] = settleReports;
  if (typeof report?.path !== 'string' || typeof report?.sha256 !== 'string') return null;

  assertValidRunIdForAssignment(assignmentId, runId, 'aggregationSourceFrom (settle-report artifact)');
  const attemptStr = runId.slice(`run_${assignmentId}_`.length);
  const reportPath = path.join(fgosDir, 'assignments', assignmentId, 'runs', attemptStr, 'agent-report.md');

  return {
    source: {
      sourceOperationRef,
      assignmentId,
      runId,
      artifactRef: report.path,
      revision: report.sha256,
      disclosures: deriveDisclosures(runResult),
    },
    currentRevision: sha256OfFile(reportPath),
  };
}

/**
 * Validate one cognitive aggregation for `coordinationId` against this
 * session's own evidence, and record the result as an `aggregation-validated`
 * event.
 *
 * What is DERIVED from the session (never taken from the caller):
 * - the FlowDefinition itself -- loaded from `manifest.definitionRef`, with
 *   the same version-drift refusal every other definition-consuming door
 *   here already applies. A caller-supplied definition would let the caller
 *   choose which operations count as sources and which bindings form each
 *   cohort, which is the entire input the verdict is derived from;
 * - which operations are sources -- the bound definition's own
 *   `completion.aggregation.sourceOperationRefs[]`;
 * - which Assignments answer them -- `resolveOperationOutcome`, the SAME
 *   stamp-verified derivation visibility windows use, so an Assignment that
 *   merely shares an actor or a claim key answers nothing;
 * - each source's artifact ref, revision pin, and disclosures -- read off the
 *   linked RunResult on disk;
 * - the outcome itself -- `classifyAggregationOutcome`, called, never forked.
 *
 * What the CALLER supplies: identity (`aggregationId`, `validatedBy`), the
 * aggregate's own output (`assignmentId`/`runId`/`outputArtifactRef`), and
 * `dissentRefs` -- declared dissent, on exactly the footing
 * `synthesizeResearchFanIn`'s `contradictions` and `closeSessionByQuorum`'s
 * `dissentingActorIds` already established: this engine has no semantic model
 * of disagreement and never infers it, it only records what a driver already
 * knows. There is no `outcome` parameter: a caller cannot assert a verdict,
 * only submit evidence and receive one.
 *
 * Never transitions the session. See `closeSessionByQuorum`'s `aggregationId`
 * for how a validated outcome is consumed as terminal input.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.aggregationId
 * @param {{type: 'driver', id: string}} params.validatedBy
 * @param {string} [params.assignmentId] The aggregate's own output Assignment.
 * @param {string} [params.runId]
 * @param {string} [params.outputArtifactRef]
 * @param {{sourceOperationRef: string, resolved: boolean}[]} [params.dissentRefs]
 * @returns {Readonly<{outcome: string, classification: object, event: object}>}
 */
export function validateSessionAggregation(
  coordinationId,
  { aggregationId, validatedBy, assignmentId, runId, outputArtifactRef, dissentRefs = [] },
  opts = {},
) {
  if (!isNonEmptyString(aggregationId)) {
    throw new CoordinationError('validation', 'validateSessionAggregation: aggregationId is required');
  }

  const manifest = readManifest(coordinationId, opts);
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `validateSessionAggregation: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- there is no declared aggregation to validate against`,
    );
  }
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `validateSessionAggregation: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to validate against a drifted definition`,
    );
  }

  const declaration = definition?.spec?.profile?.completion?.aggregation;
  if (!declaration) {
    throw new CoordinationError(
      'validation',
      `validateSessionAggregation: protocol "${definition?.metadata?.id}" declares no spec.profile.completion.aggregation -- there is nothing to validate against`,
    );
  }
  if (declaration.method !== AGGREGATION_METHOD) {
    throw new CoordinationError(
      'validation',
      `validateSessionAggregation: aggregation method "${declaration.method}" is not supported (only "${AGGREGATION_METHOD}" exists in MVP7)`,
    );
  }

  const replayed = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  const replacedBy = buildActorReplacementMap(replayed.events);

  const sources = [];
  const currentRevisions = {};
  const sourceResultRefs = [];
  const artifactRevisionRefs = [];
  const unresolvedContributionRefs = [];
  const missingActors = [];
  const failedActors = [];
  const unboundSourceOperationRefs = [];

  for (const sourceOperationRef of declaration.sourceOperationRefs) {
    // A declared source operation that no node pairs with an actor has no
    // cohort to resolve at all. `resolveOperationOutcome` would raise the
    // binding resolver's own dispatch-shaped error here -- accurate, but it
    // names neither this aggregation nor which declared source went
    // unanswerable, and it leaves nothing on the ledger. Named, never
    // dropped: the operation contributes no source (so the evaluator's
    // coverage check still forces `no-consensus`) and the record says which
    // one and why.
    if (!hasBoundActor(definition, sourceOperationRef)) {
      unboundSourceOperationRefs.push(sourceOperationRef);
      continue;
    }
    const outcome = resolveOperationOutcome(definition, sourceOperationRef, { events: replayed.events, fgosDir, replacedBy });

    // All-of over the operation's bindings, exactly the rule
    // `resolveOperationOutcome` already computes for visibility windows: a
    // source operation wired to a fan-out cohort is the WHOLE cohort's
    // obligation. When any binding is unsatisfied, this operation contributes
    // NO source at all -- so the evaluator's own coverage check fails it and
    // the outcome can only be `no-consensus`. Contributing the satisfied
    // branches alone would let a half-answered cohort read as fully covered,
    // which is the partial-cohort bypass P06 refused one layer down.
    if (!outcome.satisfied) {
      for (const branch of outcome.branches) {
        if (branch.satisfied) continue;
        // Named, never dropped: a contribution that never arrived or failed
        // is recorded on the event, so an aggregate can never look complete
        // by omission. `late` (created, not yet settled) counts as missing
        // for the same reason `classifySessionQuorum` treats it as incomplete.
        if (branch.reason === 'failed') failedActors.push(branch.actorId);
        else missingActors.push(branch.actorId);
      }
      continue;
    }

    // Same all-of discipline one level deeper: every binding of this operation
    // must yield a revision-pinned source, or the operation contributes none.
    // A cohort where one contributor settled without an immutable pin is not
    // fully evidence-backed, and letting its pinned siblings cover for it
    // would be the same partial-cohort bypass in a different coat.
    const built = outcome.branches.map((branch) => {
      const runResult = readLinkedRunResultFromDisk(fgosDir, branch.assignmentId, branch.runId);
      return { branch, pinned: aggregationSourceFrom(fgosDir, sourceOperationRef, branch.assignmentId, branch.runId, runResult) };
    });
    if (built.some((entry) => entry.pinned === null)) {
      // Named, never dropped -- and since this operation now contributes no
      // source, the evaluator's coverage check fails it and the outcome can
      // only be `no-consensus`.
      for (const entry of built) unresolvedContributionRefs.push(entry.branch.assignmentId);
      continue;
    }
    for (const { branch, pinned } of built) {
      sources.push(pinned.source);
      sourceResultRefs.push(branch.assignmentId);
      artifactRevisionRefs.push(`${pinned.source.artifactRef}@${pinned.source.revision}`);
      // A source whose artifact cannot be hashed now gets NO entry here, and
      // `validateSourceRevisionCurrency` fails closed on a missing entry --
      // an unreadable artifact is stale, never assumed current.
      if (pinned.currentRevision !== undefined) currentRevisions[pinned.source.artifactRef] = pinned.currentRevision;
    }
  }

  // Zero surviving sources is a real verdict, not an error to raise at the
  // driver. With a single declared source operation -- the likeliest protocol
  // shape -- one missing or failed contributor wipes out every source, and
  // throwing here would drop the very names this function just accumulated:
  // the gap would exist with nothing on the ledger saying so. The evaluator's
  // own coverage check turns an empty source set into `no-consensus`, and the
  // event carries the named missing/failed/unbound reason with it.
  const classification = classifyAggregationOutcome({
    sourceOperationRefs: [...declaration.sourceOperationRefs],
    sources,
    requiredDisclosures: [...declaration.requiredDisclosures],
    dissentRefs,
    currentRevisions,
  });

  const event = recordAggregationValidation(
    coordinationId,
    {
      aggregationId,
      method: AGGREGATION_METHOD,
      outcome: classification.outcome,
      sourceResultRefs,
      validatedBy,
      ...(assignmentId !== undefined ? { assignmentId } : {}),
      ...(runId !== undefined ? { runId } : {}),
      ...(outputArtifactRef !== undefined ? { outputArtifactRef } : {}),
      ...(dissentRefs.length > 0 ? { dissentRefs: dissentRefs.map((entry) => entry.sourceOperationRef) } : {}),
      ...(unresolvedContributionRefs.length > 0 ? { unresolvedContributionRefs } : {}),
      ...(missingActors.length > 0 ? { missingActors } : {}),
      ...(failedActors.length > 0 ? { failedActors } : {}),
      ...(unboundSourceOperationRefs.length > 0 ? { unboundSourceOperationRefs } : {}),
      ...(artifactRevisionRefs.length > 0 ? { artifactRevisionRefs } : {}),
    },
    opts,
  );

  return Object.freeze({ outcome: classification.outcome, classification, event });
}

// ─── Phase 08 (Step 09 MVP8): deliberation contribution ledger ─────────────
//
// `../deliberation/schema.mjs` is a pure lineage validator with no session or
// store access, by its own design (P08.1). This section is the ONE place that
// gives it session-derived truth and records what it accepted -- the same
// split of authority Phase 07 drew around the aggregation evaluator:
//
//   deliberation/schema.mjs -> decides whether a contribution's SHAPE and
//                              LINEAGE are legal, given a context
//   this file               -> decides what that context actually IS
//
// Every value that context is built from comes off the session or its bound
// definition. A caller supplies identity and its own semantic claims
// (`contributionId`, `type`, `roundKey`, lineage refs) and nothing that a
// legality decision is made from.

// Same posture as DISPOSITION_RATIONALE_MAX_LENGTH/CONSULT_OBJECTIVE_MAX_LENGTH
// above: a caller-supplied string persisted verbatim into the immutable ledger
// is bounded at the mediated door, generously but really. Without it, the
// content-freedom discipline is closed against field NAMES and wide open
// against field VOLUME -- an artifact body does not need a `content` field, it
// needs a long `roundKey`.
const CONTRIBUTION_FIELD_MAX_LENGTH = 2000;

/**
 * The log `seq` at which ONE satisfied binding branch became satisfied: the
 * EARLIEST `result-linked` for its settling Assignment whose run classified as
 * satisfied, using `classifyOperationAssignment`'s own failed/no-evidence rule.
 *
 * Earliest, never latest. Satisfaction is sticky in `resolveBindingOutcome`
 * and windows are monotone closed->open, so a branch opened when its first
 * satisfying run linked; a later retry of an already-satisfied source appends
 * another `result-linked` without re-closing anything, and reading the latest
 * would move "opened at" forward for a window that never moved.
 */
function branchSatisfiedAtSeq(events, fgosDir, assignmentId) {
  for (const event of events) {
    if (event.type !== 'result-linked' || event.payload.assignmentId !== assignmentId) continue;
    const runResult = readLinkedRunResultFromDisk(fgosDir, assignmentId, event.payload.runId);
    if (runResult.status === 'failed' || runResult.confidence === 'failed' || runResult.confidence === 'no-evidence') continue;
    return event.seq;
  }
  return 0;
}

/**
 * The log `seq` at which the window actually opened: the latest position at
 * which any of its `opensAfter` source branches became satisfied. Only
 * meaningful for an already-open window, where every branch is satisfied.
 */
function visibilityWindowOpenedAtSeq(events, fgosDir, sources) {
  let openedAt = 0;
  for (const source of sources) {
    for (const branch of source.branches) {
      const seq = branchSatisfiedAtSeq(events, fgosDir, branch.assignmentId);
      if (seq > openedAt) openedAt = seq;
    }
  }
  return openedAt;
}

/**
 * The log `seq` of the event that AUTHORIZED the Run `linkedEvent` settled --
 * `assignment-created` for a first attempt, the `run-retried` that declared it
 * for a retry. In log terms that is simply the most recent authorization for
 * this Assignment before the link.
 *
 * This, not the `result-linked` position, is the Run's REASONING position. The
 * two coincide in the ordinary case and diverge exactly where it matters:
 * `retrySessionTask`'s documented crash self-heal links a Run that executed
 * long before at a fresh, high `seq`, so a link position would place reasoning
 * after events it could never have seen.
 */
function runAuthorizedAtSeq(events, assignmentId, linkedEvent) {
  let authorizedAt = 0;
  for (const event of events) {
    if (event.seq >= linkedEvent.seq) break;
    if (event.type !== 'assignment-created' && event.type !== 'run-retried') continue;
    if (event.payload.assignmentId !== assignmentId) continue;
    authorizedAt = event.seq;
  }
  return authorizedAt;
}

/**
 * Which DECLARED operation an Assignment of this session actually performed,
 * or `null`. Answered only through the reserved `protocol-operation:` stamp --
 * the same single channel `deriveVisibilityWindowState` consults, for the same
 * reason it consults nothing else: `payload.operationId`, the claiming
 * taskKey, and the actor binding are all writable by doors that never
 * performed the operation, and this codebase already refused each of them one
 * boundary down.
 */
function stampedOperationRefOf(definition, assignmentId, fgosDir) {
  for (const operation of definition.spec.operations) {
    if (assignmentServesOperation(definition, operation.id, { assignmentId, fgosDir })) return operation.id;
  }
  return null;
}

/**
 * `Map<assignmentId, {sessionId, operationRef}>` over every Assignment of this
 * session that carries a declared-operation stamp -- the real-store
 * `knownAssignments` channel P08.1 declared and left for its caller to
 * populate ("Assignment existence can only ever be known to a caller that has
 * a store"). Assignments with no stamp are deliberately absent: an ad-hoc
 * primary task or a consult proposal performed no declared operation, so it
 * can back no contribution.
 */
function knownStampedAssignments(definition, replayed, coordinationId, fgosDir) {
  const known = new Map();
  for (const event of replayed.events) {
    if (event.type !== 'assignment-created') continue;
    const operationRef = stampedOperationRefOf(definition, event.payload.assignmentId, fgosDir);
    if (operationRef === null) continue;
    known.set(event.payload.assignmentId, { sessionId: coordinationId, operationRef });
  }
  return known;
}

/**
 * Link ONE typed deliberation contribution into `coordinationId`'s ledger
 * (MVP8), enforcing MVP6 window/context legality on the way in.
 *
 * What is DERIVED from the session (never taken from the caller):
 * - the **FlowDefinition** -- loaded from `manifest.definitionRef`, with the
 *   same version-drift refusal every other definition-consuming door here
 *   applies. This is the value three earlier cells in this track shipped a
 *   bypass by accepting as a parameter; it is not a parameter here;
 * - the **operationRef** the contribution answers -- read off the backing
 *   Assignment's reserved `protocol-operation:` stamp, so an Assignment that
 *   merely shares an actor or a claim key can back no contribution;
 * - the **visibilityWindowRef** -- read off that operation's own node binding
 *   (`contextAccess.visibilityWindowRef`), so a caller cannot choose which
 *   window rule its contribution is judged against;
 * - whether that window is **open** -- `deriveVisibilityWindowState`, called,
 *   never reimplemented, and re-derived fresh from a new `replaySession()`
 *   rather than trusting that the dispatch-time gate already ran;
 * - the **runId** -- the latest accepted `result-linked` for that Assignment;
 * - the **artifactRef and revision pin** -- `aggregationSourceFrom`, the same
 *   settle-report derivation MVP7's sources use, so the pin is the hash of the
 *   bytes the runner classified. An artifact edited since settle is refused
 *   outright rather than linked under a pin it no longer matches;
 * - the **lineage context** -- `knownContributions` and `knownAssignments`
 *   built from this session's own log.
 *
 * What the CALLER supplies: `contributionId`, the contribution's `type` (its
 * own semantic claim, bounded by the closed MVP8 enum), `roundKey` (an opaque
 * grouping label, length-bounded here exactly as `rationale`/`objective` are
 * at the sibling mediated doors -- a verbatim string reaching the immutable
 * ledger is never unbounded by omission), the backing `assignmentId`, its
 * `anchors`/`respondsTo` lineage
 * claims (each checked against the real ledger), and `linkedBy`.
 *
 * Never transitions the session, and never copies artifact content: the event
 * carries `artifactRef` + `revision` and nothing else about the artifact.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.contributionId
 * @param {string} params.type One of the closed MVP8 contribution types.
 * @param {string} params.assignmentId The Assignment whose settled Run backs this contribution.
 * @param {string} params.roundKey
 * @param {{type: 'driver', id: string}} params.linkedBy
 * @param {string[]} [params.anchors]
 * @param {string} [params.respondsTo]
 * @param {object} [opts] Workspace options ({ cwd, repoRoot, packageRoot })
 */
export function linkSessionContribution(
  coordinationId,
  { contributionId, type, assignmentId, roundKey, linkedBy, anchors, respondsTo },
  opts = {},
) {
  if (!isNonEmptyString(contributionId) || contributionId.length > CONTRIBUTION_FIELD_MAX_LENGTH) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: contributionId must be a non-empty, bounded string (max ${CONTRIBUTION_FIELD_MAX_LENGTH} characters)`,
    );
  }
  if (!isNonEmptyString(roundKey) || roundKey.length > CONTRIBUTION_FIELD_MAX_LENGTH) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: roundKey must be a non-empty, bounded string (max ${CONTRIBUTION_FIELD_MAX_LENGTH} characters)`,
    );
  }
  if (!isNonEmptyString(assignmentId)) {
    throw new CoordinationError('validation', 'linkSessionContribution: assignmentId is required');
  }

  const manifest = readManifest(coordinationId, opts);
  if (!manifest.definitionRef) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: session "${coordinationId}" has no declared protocol bound (definitionRef is null) -- there is no declared operation or visibility window for a contribution to be judged against`,
    );
  }
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to link a contribution against a drifted definition`,
    );
  }

  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  const replayed = replaySession(coordinationId, opts);

  const createdEvent = lastEventFor(replayed.events, 'assignment-created', assignmentId);
  if (!createdEvent) {
    throw new CoordinationError(
      'foreign-ref',
      `linkSessionContribution: assignment "${assignmentId}" was never created in session "${coordinationId}" -- a contribution may only be backed by this session's own work`,
    );
  }
  // The stamp is asked first, because it is the more fundamental question: an
  // Assignment that performed no declared operation can back no contribution
  // whatever else is true of it.
  const operationRef = stampedOperationRefOf(definition, assignmentId, fgosDir);
  if (operationRef === null) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: assignment "${assignmentId}" carries no declared-operation provenance stamp for protocol "${definition.metadata.id}@${definition.metadata.version}" -- it did not materialize a declared operation, so it can back no contribution`,
    );
  }
  const actorId = createdEvent.payload.actorId;
  if (!isNonEmptyString(actorId)) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: assignment "${assignmentId}" names no actor -- there is no node binding to resolve its declared operation's context access from`,
    );
  }

  // Window/context legality, MVP6's own mechanism. The ref comes from the
  // binding, not the caller; the verdict comes from the shared derivation, not
  // a second copy of the rule.
  const { binding, node } = resolveDeclaredOperationActor(definition, operationRef, actorId);
  const visibilityWindowRef = binding.contextAccess?.visibilityWindowRef;
  if (visibilityWindowRef === undefined) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: operation "${operationRef}" at node "${node.id}" for actor "${actorId}" declares no contextAccess.visibilityWindowRef -- a contribution records the window its reasoning was legal under, so an ungated binding has no window provenance to record and cannot contribute`,
    );
  }
  const { open, sources } = deriveVisibilityWindowState(definition, visibilityWindowRef, replayed, fgosDir);
  if (!open) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: operation "${operationRef}" at node "${node.id}" requires visibility window "${visibilityWindowRef}" to be open before its reasoning may enter the deliberation ledger, and it is not open yet -- refusing to link contribution "${contributionId}"`,
    );
  }

  const linkedEvent = lastEventFor(replayed.events, 'result-linked', assignmentId);
  if (!linkedEvent) {
    throw new CoordinationError(
      'dangling-ref',
      `linkSessionContribution: assignment "${assignmentId}" has no linked RunResult -- a contribution is backed by a settled Run, never by one still in flight`,
    );
  }
  // The window claim is about the REASONING, not about the clock at write
  // time. "The window is open now" is not the same statement as "this
  // reasoning was produced under an open window": a Run that STARTED before
  // the window opened demonstrably could not have seen what the window
  // admits, so recording `visibilityWindowRef` for it would put a provenance
  // claim on the immutable ledger that the Run could never have witnessed.
  //
  // That shape is reachable today, not hypothetical: `dispatchDeclaredOperation`'s
  // own window gate sits inside its `driver-authorized` branch, so a binding
  // with `activation.mode: required` is dispatched and settles with no window
  // check at all. Comparing log positions is what turns the link-time verdict
  // into a reasoning-time one -- the same event log, the same derivation, one
  // more question asked of it.
  //
  // BOTH positions are the Run's own, never a link position: the backing side
  // is the Run's authorization (`assignment-created`/`run-retried`), and each
  // window source is the EARLIEST link that satisfied it. A `result-linked`
  // `seq` says when a result was RECORDED, which diverges from when its
  // reasoning happened across a crash-resume (backing side) and across a retry
  // of an already-satisfied source (window side).
  const windowOpenedAtSeq = visibilityWindowOpenedAtSeq(replayed.events, fgosDir, sources);
  const runAuthorizedSeq = runAuthorizedAtSeq(replayed.events, assignmentId, linkedEvent);
  if (runAuthorizedSeq <= windowOpenedAtSeq) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: the run of assignment "${assignmentId}" that settled at log position ${linkedEvent.seq} was authorized at log position ${runAuthorizedSeq}, not after visibility window "${visibilityWindowRef}" opened at log position ${windowOpenedAtSeq} -- its reasoning could not have seen what that window admits, so it carries no "${visibilityWindowRef}" provenance to record; re-run the operation under the open window instead`,
    );
  }

  const runId = linkedEvent.payload.runId;
  const runResult = readLinkedRunResultFromDisk(fgosDir, assignmentId, runId);
  const pinned = aggregationSourceFrom(fgosDir, operationRef, assignmentId, runId, runResult);
  if (pinned === null) {
    throw new CoordinationError(
      'dangling-ref',
      `linkSessionContribution: run "${runId}" of assignment "${assignmentId}" carries no single settle-report revision pin -- a contribution without immutable artifact backing is not a contribution`,
    );
  }
  if (pinned.currentRevision !== pinned.source.revision) {
    throw new CoordinationError(
      'validation',
      `linkSessionContribution: the artifact backing assignment "${assignmentId}" no longer matches its settle-time revision pin -- it was edited after settle, so linking it would pin a revision the file no longer has`,
    );
  }

  // Every declared operation of the BOUND protocol, narrowed to the REAL
  // per-operation `contributions.allowedTypes[]` declaration
  // (`src/runner/definitions/schema.mjs`'s `spec.operations[]` whitelist,
  // P08.3). Derived from the definition, never from the caller. An operation
  // with no `contributions` key at all, or with `allowedTypes: []`, converges
  // on the SAME meaning: "declares no allowed types", which
  // `validateOperationDeclaresType` (../deliberation/schema.mjs) already
  // treats as reject-everything for an empty/absent entry -- so both shapes
  // are represented identically here, as `allowedTypes: []`, rather than
  // omitting the operation from the map (an absent operationRef is refused
  // one layer up as `foreign-provenance` before this map is even consulted,
  // via `stampedOperationRefOf`, so this map never needs to represent "no
  // such operation").
  const declaredOperations = Object.fromEntries(
    definition.spec.operations.map((operation) => [
      operation.id,
      { allowedTypes: operation.contributions?.allowedTypes ? [...operation.contributions.allowedTypes] : [] },
    ]),
  );

  const contribution = {
    contributionId,
    sessionId: coordinationId,
    operationRef,
    type,
    assignmentId,
    runId,
    artifactRef: pinned.source.artifactRef,
    revision: pinned.source.revision,
    roundKey,
    visibilityWindowRef,
    ts: new Date().toISOString(),
    ...(anchors !== undefined ? { anchors } : {}),
    ...(respondsTo !== undefined ? { respondsTo } : {}),
  };
  try {
    validateContributionLineage(contribution, {
      sessionId: coordinationId,
      declaredOperations,
      knownContributions: knownContributionsFromEvents(replayed.events, coordinationId),
      knownAssignments: knownStampedAssignments(definition, replayed, coordinationId, fgosDir),
    });
  } catch (err) {
    asCoordinationError(err, `linkSessionContribution: session "${coordinationId}" contribution "${contributionId}"`);
  }

  // `sessionId` and `ts` stay out of the persisted payload: the first is a
  // forbidden field (the log IS the session), the second is stamped on the
  // event envelope. Both were needed only to hand P08.1's validator a complete
  // contribution object.
  return recordContributionLink(
    coordinationId,
    {
      contributionId,
      operationRef,
      type,
      assignmentId,
      runId,
      artifactRef: contribution.artifactRef,
      revision: contribution.revision,
      roundKey,
      visibilityWindowRef,
      linkedBy,
      ...(anchors !== undefined ? { anchors } : {}),
      ...(respondsTo !== undefined ? { respondsTo } : {}),
    },
    opts,
  );
}

// A retry must always declare WHY (records intent, never a silent
// resubmission) and a bounded policy -- "never unbounded by omission" is
// this codebase's own established posture for every other cap
// (aggregateBounds, schema.mjs DEFAULT_AGGREGATE_BOUNDS). 1 is the smallest
// real, non-zero default: at most one retry unless the caller explicitly
// declares a higher policy.
const DEFAULT_MAX_RETRIES = 1;

/**
 * R2 (first half): retry `assignmentId` -- dispatch ONE new Run for the SAME
 * Assignment (never a new Assignment) when the declared `maxRetries` policy
 * still permits it, and record the new Run as the session's current result
 * (`linkResult({allowSupersede: true})`) without ever deleting or rewriting
 * the prior RunResult (it stays on disk, immutable, and stays in the event
 * log as the earlier `result-linked` entry).
 *
 * Resume-safe (R3): always reconciles via `replaySession()` first. Three
 * crash windows, each closed the same way `createAndExecuteSessionTask`'s
 * own precedent closes the analogous windows for a first dispatch:
 * - A settled attempt already sits on disk with no matching `result-linked`
 *   yet (crash after the retry's `executeAssignment` succeeded, before
 *   `linkResult`): self-heals by linking it, never re-dispatching.
 * - A `run-retried` declaration exists with no settled attempt yet (crash
 *   right after `recordRunRetry`, before dispatch started): `recordRunRetry`
 *   itself detects this (`pendingRetries > 0`) and resumes the SAME
 *   declaration rather than appending a second one or re-checking
 *   `maxRetries` again.
 * - A per-attempt claim file already exists with no settled result (crash
 *   mid-dispatch, subprocess killed): fails closed with a named
 *   `CoordinationError` describing exactly how to repair it (R3: "Ambiguous
 *   state fails with repair guidance") -- the SAME posture
 *   `createAndExecuteSessionTask`'s own `dispatch.claim` precedent already
 *   established for a first dispatch, reused unchanged for a retry.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.assignmentId Must already be a member of this session.
 * @param {string} params.reason Non-empty; retry must record why.
 * @param {number} [params.maxRetries] Default 1.
 * @param {object} [opts] Forwarded to `executeAssignment`/store.mjs (cwd, repoRoot, runnerConfig, timeoutMs, ...)
 */
export async function retrySessionTask(coordinationId, { assignmentId, reason, maxRetries = DEFAULT_MAX_RETRIES }, opts = {}) {
  if (!isNonEmptyString(assignmentId)) throw new CoordinationError('validation', 'retrySessionTask: assignmentId is required');
  if (!isNonEmptyString(reason)) throw new CoordinationError('validation', 'retrySessionTask: reason is required -- retry must record why');
  if (!Number.isInteger(maxRetries) || maxRetries < 1) throw new CoordinationError('validation', 'retrySessionTask: maxRetries must be a positive integer');

  const reconciled = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  if (!reconciled.assignmentRefs.includes(assignmentId)) {
    throw new CoordinationError('validation', `retrySessionTask: assignment "${assignmentId}" is not a member of session "${coordinationId}"`);
  }
  const createdEvent = reconciled.events.find((event) => event.type === 'assignment-created' && event.payload.assignmentId === assignmentId);
  const actorId = createdEvent?.payload?.actorId;

  // Self-heal: a settled attempt already sits on disk but is not yet the
  // linked view -- link it now, never re-dispatch a redundant attempt.
  const latestOnDisk = findLatestRunResult(fgosDir, assignmentId);
  const latestLinked = lastEventFor(reconciled.events, 'result-linked', assignmentId);
  if (latestOnDisk && (!latestLinked || latestLinked.payload.runId !== latestOnDisk.runId)) {
    linkResult(coordinationId, { assignmentId, runId: latestOnDisk.runId }, { ...opts, allowSupersede: true });
    return { assignmentId, actorId, runResult: latestOnDisk, retried: false, resumed: true };
  }

  // R5: "enforce wall time ... before each launch" applies to a retry
  // dispatch too (it spawns a real new executor subprocess, same as any
  // other launch this file makes) -- checked ONLY past the self-heal branch
  // above, never before it: self-heal only links an already-settled disk
  // result, it launches nothing, so it must never be blocked by an elapsed
  // wall-time budget (that would strand an already-completed result that
  // can never be linked). A genuinely new or resumed-but-undispatched retry
  // attempt, below, is a real launch and is gated the same way
  // `dispatchDeclaredOperation`/`dispatchPrimaryTask` gate their own first
  // dispatch.
  assertWithinWallTimeBudget(reconciled.manifest, 'retrySessionTask');

  // recordRunRetry itself resumes a pending-but-undispatched declaration
  // (never double-declares) and enforces maxRetries atomically, lock-held.
  const { attempt } = recordRunRetry(coordinationId, { assignmentId, reason, previousRunId: latestLinked?.payload?.runId, maxRetries }, opts);

  const assignmentPath = path.join(fgosDir, 'assignments', assignmentId, 'assignment.json');
  let assignment;
  try {
    assignment = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
  } catch (err) {
    throw new CoordinationError('corrupt-log', `retrySessionTask: assignment.json for "${assignmentId}" could not be read: ${err.message}`);
  }

  // Per-attempt exclusive claim -- same crash-safety shape as
  // createAndExecuteSessionTask's own `dispatch.claim`, numbered per retry
  // attempt so a resumed declaration (same `attempt` number) collides
  // correctly with a genuinely still-in-flight sibling instead of a
  // permanent one-shot flag from the FIRST dispatch.
  const retryClaimPath = path.join(fgosDir, 'assignments', assignmentId, `retry-${attempt}.claim`);
  try {
    fs.closeSync(fs.openSync(retryClaimPath, 'wx'));
  } catch (err) {
    if (err.code === 'EEXIST') {
      throw new CoordinationError(
        'validation',
        `retrySessionTask: retry attempt ${attempt} for assignment "${assignmentId}" in session "${coordinationId}" already has a claim in progress -- either a concurrent retry is genuinely in flight, or a prior attempt crashed mid-dispatch (ambiguous state, repair guidance: confirm no live process is still running this retry, then remove ${retryClaimPath} before retrying again)`,
      );
    }
    throw err;
  }

  let runResult;
  try {
    runResult = await runExecutorAttempt(assignment, opts);
  } catch (err) {
    if (err instanceof RunnerConfigError) {
      try {
        fs.unlinkSync(retryClaimPath);
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') throw unlinkErr;
      }
    }
    throw err;
  }
  linkResult(coordinationId, { assignmentId, runId: runResult.runId }, { ...opts, allowSupersede: true });
  return { assignmentId, actorId, runResult, retried: true, resumed: false };
}

/**
 * R2 (second half): replace `oldActorId` with a newly-bound `newActorId`
 * for `coordinationId`, recording old/new actor and (optional) allocation
 * provenance. Because an Assignment's `assignment-created.actorId` is
 * immutable once written (ADR-008), replacement never rewrites the old
 * actor's existing Assignments -- it only binds a new SessionActor identity
 * and an explicit `actor-replaced` link; the CALLER dispatches the
 * replacement's actual work through the ordinary
 * `dispatchDeclaredOperation`/`dispatchPrimaryTask`/`proposeConsult`
 * functions above, which is what makes "re-runs governance" true by
 * construction (there is no second, shortcut dispatch path here to bypass
 * provider/tier/diversity/evidence requirements).
 *
 * The replacement actor's `role` is always inherited from `oldActorId`
 * unchanged -- the one hard constraint R2 names explicitly ("cannot
 * silently relax ... requirements"): a replacement may change WHO performs
 * the role (persona/policy, which flow into WHICH provider/tier get
 * selected) but never WHAT role governs the work.
 *
 * Resume-safe (R3): both writes below (`bindActor`, `recordActorReplacement`)
 * are independently idempotent -- a crash between them leaves the new actor
 * bound but unrecorded; a resumed call (the SAME `oldActorId`/`newActorId`
 * pair as a prior, already-recorded `actor-replaced` event) skips the
 * already-done `bindActor` step and only completes `recordActorReplacement`.
 *
 * A `newActorId` that is already bound but is NOT a resume of this exact
 * pair is refused when the collision is decisively provable from on-disk
 * EVENT state (`newActorId` already has its OWN independent
 * `assignment-created` on record, or is already serving as some OTHER
 * actor's replacement) -- either would let one actor's real result get
 * silently double-counted to cover two required slots.
 *
 * The event log alone, however, can never disambiguate the remaining case:
 * `newActorId` bound (an `actor-bound` event exists) with NEITHER of the
 * above. `actor-bound` carries no provenance tying it to a specific
 * caller's intent, so this state is genuinely identical on disk whether it
 * came from THIS call's own crashed `bindActor` step, OR from a completely
 * unrelated actor that merely happens to already be bound -- and that
 * second case is not a rare corner case: EVERY session-declared required
 * actor is bound via `actor-bound` at `openSession` time
 * (`store.mjs#openSession`), with no `assignment-created` required, so
 * "required but not yet dispatched" is the DEFAULT state for a fresh
 * required actor. Treating that ambiguous state as an automatic resume
 * (this function's earlier posture) let `newActorId` silently absorb an
 * unrelated, still-required actor's own slot.
 *
 * A crash-file marker closes this gap the SAME way `retrySessionTask`'s own
 * per-attempt `retry-${attempt}.claim` closes the analogous ambiguity for a
 * retry dispatch: a `replaceClaimPath` file, keyed on the exact
 * `(oldActorId, newActorId)` pair, is written to disk strictly BEFORE the
 * `bindActor` call below. Its presence on a later call is the only thing
 * that can durably prove "this is MY earlier, crashed `bindActor` step" --
 * something no `actor-bound` event can ever prove by itself. So: bound +
 * ambiguous event log + a claim file for this exact pair => genuine
 * crash-resume (skip `bindActor`, proceed to `recordActorReplacement`).
 * Bound + ambiguous event log + NO claim file for this exact pair => refused
 * outright, since it cannot be told apart from an unrelated, independently
 * required actor.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.oldActorId Must already be bound to this session, and not itself already replaced.
 * @param {string} params.newActorId Refused if it already has its own independent `assignment-created` on record, or already serves as some OTHER actor's replacement. Otherwise, if already bound, refused UNLESS a claim file for this exact `(oldActorId, newActorId)` pair already exists on disk (proving a genuine crash-resume of this exact call).
 * @param {string} [params.persona]
 * @param {object} [params.policy]
 * @param {string} params.reason Non-empty.
 * @param {object} [params.allocationProvenance] Opaque pass-through (e.g. a cohort-planner allocation record).
 * @param {object} [opts]
 * @returns {Readonly<object>} The updated manifest.
 */
export function replaceSessionActor(coordinationId, { oldActorId, newActorId, persona, policy, reason, allocationProvenance }, opts = {}) {
  if (!isNonEmptyString(oldActorId) || !isNonEmptyString(newActorId)) {
    throw new CoordinationError('validation', 'replaceSessionActor: oldActorId and newActorId are required');
  }
  if (oldActorId === newActorId) {
    throw new CoordinationError('validation', 'replaceSessionActor: newActorId must differ from oldActorId');
  }
  if (!isNonEmptyString(reason)) {
    throw new CoordinationError('validation', 'replaceSessionActor: reason is required');
  }
  // R6 (round 2, Bug #2): both ids must stay within the SAME safe filesystem
  // charset `assertSafeCoordinationId` already enforces for `coordinationId`
  // (store.mjs) -- both are interpolated directly into a `path.join` for
  // this call's own crash-safety claim file below
  // (`actor-replace-${oldActorId}--${newActorId}.claim`), with no other
  // charset restriction before this fix. An unvalidated id (e.g.
  // `newActorId = 'x/../../../../tmp/PWNED'`) could otherwise make that
  // `path.join` resolve outside `.fgos/coordination/sessions/` entirely.
  // Checked here, fail-fast, before `replaySession` does any real work for
  // this call.
  assertSafeCoordinationId(oldActorId, { label: 'replaceSessionActor: oldActorId' });
  assertSafeCoordinationId(newActorId, { label: 'replaceSessionActor: newActorId' });

  const { manifest, events } = replaySession(coordinationId, opts);
  if (manifest.status !== 'active') {
    throw new CoordinationError(
      'validation',
      `replaceSessionActor: session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot replace an actor once new materialization has stopped`,
    );
  }
  const oldActor = (manifest.actors ?? []).find((actor) => actor.id === oldActorId);
  if (!oldActor) {
    throw new CoordinationError('validation', `replaceSessionActor: actor "${oldActorId}" is not bound to session "${coordinationId}"`);
  }
  const alreadyReplaced = events.some((event) => event.type === 'actor-replaced' && event.payload.oldActorId === oldActorId);
  if (alreadyReplaced) {
    throw new CoordinationError(
      'validation',
      `replaceSessionActor: actor "${oldActorId}" in session "${coordinationId}" has already been replaced -- replace the actor that superseded it instead of replacing the same slot twice`,
    );
  }

  // Crash-file marker for THIS EXACT (oldActorId, newActorId) pair -- same
  // shape/location convention as retrySessionTask's own per-attempt
  // `retry-${attempt}.claim` (session-engine.mjs, search that name),
  // written strictly BEFORE bindActor below so its on-disk presence can
  // later prove "this exact call reached this point before", completely
  // separate from (and never inferable from) the event log. See the doc
  // comment above for why the event log alone is not enough.
  const { sessionDir } = resolveSessionPaths(coordinationId, opts);
  const replaceClaimPath = path.join(sessionDir, `actor-replace-${oldActorId}--${newActorId}.claim`);

  const alreadyBound = (manifest.actors ?? []).some((actor) => actor.id === newActorId);
  if (alreadyBound) {
    // Mirror recordActorReplacement's OWN idempotency check (store.mjs) --
    // the exact same (oldActorId, newActorId) pair comparison -- so
    // "already bound" is only ever treated as a resume of THIS SAME
    // replacement call, never silently accepted as a collision with some
    // other, independently-required actor that happens to already be bound
    // for its own unrelated reason (which would otherwise let one actor's
    // real result get double-counted to cover two required slots while the
    // other required actor's work is never actually verified done).
    const isResumeOfThisReplacement = events.some(
      (event) => event.type === 'actor-replaced' && event.payload.oldActorId === oldActorId && event.payload.replacementActorId === newActorId,
    );
    if (!isResumeOfThisReplacement) {
      // A definite, unambiguous collision: newActorId is EITHER (a) already
      // has its OWN independent dispatch activity on record (an
      // `assignment-created` under its own actorId -- never possible for
      // THIS call's own crashed `bindActor` step, since replaceSessionActor
      // never dispatches anything itself; the CALLER always dispatches the
      // replacement's work in a SEPARATE call strictly AFTER this one
      // returns -- see the doc comment above), or (b) already serving as
      // some OTHER actor's replacement (`actor-replaced` names it as
      // `replacementActorId`/`oldActorId` for a DIFFERENT pair). Both are
      // refused outright -- this is exactly the shape that lets one actor's
      // real result get silently double-counted to cover two required
      // slots (the bug this check exists to close).
      const isDefiniteCollision = events.some(
        (event) =>
          (event.type === 'assignment-created' && event.payload.actorId === newActorId) ||
          (event.type === 'actor-replaced' && (event.payload.replacementActorId === newActorId || event.payload.oldActorId === newActorId)),
      );
      if (isDefiniteCollision) {
        throw new CoordinationError(
          'validation',
          `replaceSessionActor: newActorId "${newActorId}" is already bound to session "${coordinationId}" with its own independent activity on record -- cannot replace "${oldActorId}" with an actor id that collides with it`,
        );
      }
      // A `newActorId` that is bound but has NEITHER of those -- e.g. a
      // session-declared required actor never yet dispatched, or an actor
      // bound by some OTHER standalone `bindActor` call (`proposeConsult`'s
      // specialist) -- is genuinely ambiguous from the EVENT LOG alone:
      // `actor-bound` carries no provenance tying it to a specific caller's
      // intent, so it cannot be told apart from THIS call's own crashed
      // `bindActor` step by events alone. The claim file (see doc comment
      // above) is what actually disambiguates: its presence proves this
      // exact call already reached this point once before; its absence
      // means this is some other, unrelated already-bound actor -- refuse
      // outright rather than silently absorbing its required slot.
      if (!fs.existsSync(replaceClaimPath)) {
        throw new CoordinationError(
          'validation',
          `replaceSessionActor: newActorId "${newActorId}" is already bound to session "${coordinationId}" with no prior replacement claim recorded for this exact (oldActorId "${oldActorId}", newActorId "${newActorId}") pair -- refusing to replace "${oldActorId}" with an actor id that collides with an independently bound actor (e.g. a required actor never yet dispatched)`,
        );
      }
      // else: our own claim file for this exact pair exists on disk --
      // a genuine crash-resume of THIS call's earlier, incomplete
      // `bindActor` step. Fall through to recordActorReplacement without
      // re-binding.
    }
  } else {
    // Write the claim BEFORE bindActor -- this is the durable marker that a
    // later resumed call (or a genuinely concurrent one) checks above/below.
    fs.mkdirSync(sessionDir, { recursive: true });
    try {
      fs.closeSync(fs.openSync(replaceClaimPath, 'wx'));
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      // The claim already exists but newActorId is NOT bound yet -- either a
      // genuinely concurrent replaceSessionActor call for this exact pair is
      // in flight right now, or a prior attempt crashed in the narrow window
      // between writing the claim and calling bindActor. Both are ambiguous
      // the same way retrySessionTask's own mid-dispatch claim collision is
      // (R3: "ambiguous state fails with repair guidance") -- fail closed
      // rather than guess.
      throw new CoordinationError(
        'validation',
        `replaceSessionActor: a replacement from "${oldActorId}" to "${newActorId}" in session "${coordinationId}" already has a claim in progress -- either a concurrent replacement is genuinely in flight, or a prior attempt crashed before "${newActorId}" was bound (ambiguous state, repair guidance: confirm no live process is still running this replacement, then remove ${replaceClaimPath} before retrying again)`,
      );
    }
    // role inherited unchanged from oldActorId -- see doc comment above.
    bindActor(coordinationId, { id: newActorId, role: oldActor.role, persona, policy }, opts);
  }

  recordActorReplacement(coordinationId, { oldActorId, replacementActorId: newActorId, reason, allocationProvenance }, opts);
  return readManifest(coordinationId, opts);
}

/**
 * R4: cancel `coordinationId`. Records `reason` plus a snapshot of every
 * currently in-flight Assignment (`assignment-created` with no
 * `result-linked` yet, taken from a fresh `replaySession()`), then
 * transitions to the terminal `'cancelled'` status via the SAME
 * `transitionSessionStatus` primitive `closeSessionByQuorum` uses --
 * absorbing (no further transition is ever legal afterward, per that
 * function's own doc comment) and never deleting or mutating any persisted
 * Assignment/Run/RunResult. "Stops new materialization" is enforced
 * globally and for free: every write door that can create a new Assignment
 * or dispatch a new Run (`createSessionAssignment`, `recordRunRetry`,
 * `bindActor`) already refuses once `manifest.status !== 'active'`, and
 * `'cancelled'` is exactly such a status. A genuinely in-flight Run that
 * finishes AFTER cancellation is still allowed to `linkResult` (that
 * function is intentionally status-agnostic) -- cancellation records what
 * was in flight at the moment of cancellation, it never discards an outcome
 * that arrives late.
 *
 * @param {string} coordinationId
 * @param {object} params
 * @param {string} params.reason Non-empty.
 * @param {object} [opts]
 * @returns {Readonly<object>} The transitioned manifest.
 */
export function cancelSession(coordinationId, { reason }, opts = {}) {
  if (!isNonEmptyString(reason)) throw new CoordinationError('validation', 'cancelSession: reason is required');

  // Same fresh-read-inside-the-lock shape as closeSessionByQuorum, applied
  // here for structural consistency even though this snapshot is
  // informational only (never a completion-consensus claim) -- a smaller
  // blast radius than H2, but the same unlocked-read/locked-write race
  // exists structurally, so it gets the same fix.
  return withSessionLock(
    coordinationId,
    (paths) => {
      const { assignmentRefs, events } = replaySession(coordinationId, opts);
      const inFlightAssignmentIds = assignmentRefs.filter((id) => !lastEventFor(events, 'result-linked', id));
      return transitionSessionStatusLocked(
        coordinationId,
        'cancelled',
        { reason, ...(inFlightAssignmentIds.length > 0 ? { inFlightAssignmentIds } : {}) },
        paths,
      );
    },
    opts,
  );
}

/**
 * R4: derive a session's current lifecycle phase for observability/testing
 * of the phase file's own named vocabulary ("planned/running/
 * partially-complete/completed/failed/cancelled"). Per
 * `coordination-session.md`'s own Status Vocabulary, only
 * `active/completed/partial/failed/cancelled` are ever PERSISTED
 * `manifest.status` values -- "planned" and "running" are transient,
 * INFERRED sub-phases of `active` (never a separate persisted status), and
 * the persisted `'partial'` status is reported here under the phase file's
 * own more descriptive name, `'partially-complete'`.
 *
 * @param {string} coordinationId
 * @param {object} [opts]
 * @returns {'planned'|'running'|'partially-complete'|'completed'|'failed'|'cancelled'}
 */
export function deriveSessionPhase(coordinationId, opts = {}) {
  const { manifest } = replaySession(coordinationId, opts);
  if (manifest.status === 'active') {
    return manifest.assignmentRefs.length === 0 ? 'planned' : 'running';
  }
  return manifest.status === 'partial' ? 'partially-complete' : manifest.status;
}
