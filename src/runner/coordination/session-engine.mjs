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
} from './store.mjs';
import { replaySession } from './replay.mjs';
import { CoordinationError } from './schema.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { READ_ONLY_ROLES } from '../dispatch/assignment-normalizer.mjs';
import { RunnerConfigError } from '../dispatch/config.mjs';
import { TIER_STRENGTH } from '../dispatch/assignment-policy.mjs';
import { loadCoordinationProtocol } from '../definitions/protocol-loader.mjs';
import { mergePolicyStack, activationModeOf } from '../definitions/schema.mjs';
import { planCohort, verifyPlannedAllocationAgainstCurrentConfig } from './cohort-planner.mjs';

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
function buildReadOnlyContract({ objective, contextRefs, constraints, expectedOutputs, evidenceRequired, role, capabilities, budget, timeoutMs, minTier }) {
  return {
    objective,
    contextRefs,
    constraints,
    expectedOutputs,
    mutation: 'read-only',
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
 * this file never grows a second one) -- both `createAndExecuteSessionTask`
 * (first dispatch) and `retrySessionTask` (Phase 06 R2, a new Run for an
 * EXISTING Assignment) call through this same tiny wrapper rather than
 * reaching `executeAssignment` directly, so "retry re-resolution through
 * EXISTING dispatch APIs, never a new dispatch surface" holds structurally,
 * not just by convention.
 */
async function runExecutorAttempt(assignment, opts) {
  return executeAssignment(assignment, { ...opts, isReadOnlyMode: true });
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

  const contract = buildReadOnlyContract({
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

  const contract = buildReadOnlyContract({
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
function resolveDeclaredOperationActor(definition, operationId, targetActorId) {
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
  const picked = targetActorId !== undefined ? matches.find((m) => m.ref.actor === targetActorId) : matches[0];
  if (!picked) {
    throw new CoordinationError(
      'validation',
      targetActorId !== undefined
        ? `dispatchDeclaredOperation: operation "${operationId}" bound to actor "${targetActorId}" is not wired into this protocol's graph -- no node pairs this operation with that actor`
        : `dispatchDeclaredOperation: operation "${operationId}" is not wired into this protocol's graph -- an operation must be reachable from a node to be materialized`,
    );
  }
  const { node: matchedNode, ref: matchedRef } = picked;
  if (!matchedRef.actor) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" is role-only (no actor binding at node "${matchedNode.id}") -- this materialization requires a bound SessionActor`,
    );
  }

  const actorEntry = (definition.spec.actors ?? []).find((a) => a.id === matchedRef.actor);
  if (!actorEntry) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" node "${matchedNode.id}" references actor "${matchedRef.actor}", which is not declared in spec.actors`,
    );
  }
  if (actorEntry.role !== operation.role) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" declares role "${operation.role}", but its bound actor "${actorEntry.id}" declares role "${actorEntry.role}" -- actor/operation role mismatch`,
    );
  }

  // `binding` is the node-operation binding itself (`{ref, actor,
  // activation?}`) -- the ONLY scope `activation` is ever declared at, so
  // every caller that needs the activation mode reads it from here rather
  // than from the shared `operation` template, which can never carry one.
  return { operation, actorId: actorEntry.id, actorEntry, node: matchedNode, binding: matchedRef };
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
function resolveBindingAuthorization(authorizations, { nodeId, operationId, targetActorId, resumedAssignmentId }) {
  const forThisBinding = authorizations.filter(
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
  const resumeMatch = resumedAssignmentId
    ? forThisBinding.find((record) => record.consumedByAssignmentId === resumedAssignmentId)
    : undefined;
  return resumeMatch ?? forThisBinding.find((record) => record.consumedByAssignmentId === null);
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

  const { actorId, node, binding } = resolveDeclaredOperationActor(definition, operationId, targetActorId);
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
    // `activation.maxInvocations` lives on the binding, which only this
    // definition-aware door can read; store.mjs enforces it lock-held.
    binding.activation?.maxInvocations !== undefined
      ? { ...opts, maxInvocationsForBinding: binding.activation.maxInvocations }
      : opts,
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

  const { operation, actorId, actorEntry, node, binding } = resolveDeclaredOperationActor(definition, operationId, targetActorId);
  const topology = definition.spec.profile.topology;
  const incomingEdge = topology?.edges?.find((edge) => edge.to === actorId);

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
    const { assignmentRefs, events } = replaySession(coordinationId, opts);
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

    taskKey = explicitTaskKey ?? `declared:${operationId}:round-${round}`;
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
    taskKey = explicitTaskKey ?? `declared:${operationId}`;
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
  if (activationModeOf(binding) === 'driver-authorized') {
    const { sessionDir } = resolveSessionPaths(coordinationId, opts);
    const { authorizations, ignoredAuthorizations } = replaySession(coordinationId, opts);
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

  const contract = buildReadOnlyContract({
    objective,
    contextRefs: resolvedContextRefs,
    constraints: [
      ...constraints,
      `protocol-operation:${definition.metadata.id}@${definition.metadata.version}#${operationId}`,
    ],
    expectedOutputs,
    evidenceRequired: operation.result?.evidenceRequired ?? 'reported',
    role: operation.role,
    capabilities: capabilities ?? operation.capabilities,
    budget,
    timeoutMs: opts.timeoutMs,
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

  const contract = buildReadOnlyContract({
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
  return classifySessionQuorum(coordinationId, manifest, events, fgosDir);
}

// Shared classification body behind `evaluateSessionQuorum` (its own
// standalone unlocked read+classify) AND `closeSessionByQuorum`'s internal
// locked path below -- ONE classification implementation, never two
// independently-maintained copies, regardless of which caller supplies
// `{manifest, events}` (a fresh unlocked read for the former, a fresh read
// taken INSIDE the terminal write's lock for the latter).
function classifySessionQuorum(coordinationId, manifest, events, fgosDir) {
  const requiredActorIds = (manifest.actors ?? []).map((actor) => actor.id);

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
 * @returns {Readonly<object>} The transitioned manifest.
 */
export function closeSessionByQuorum(coordinationId, { dissentingActorIds = [] } = {}, opts = {}) {
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
      const { manifest, events } = replaySession(coordinationId, opts);
      const quorum = classifySessionQuorum(coordinationId, manifest, events, paths.fgosDir);
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
