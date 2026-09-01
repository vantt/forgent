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
  linkResult,
  readManifest,
  resolveSessionPaths,
  hashTaskKey,
} from './store.mjs';
import { replaySession } from './replay.mjs';
import { CoordinationError } from './schema.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { READ_ONLY_ROLES } from '../dispatch/assignment-normalizer.mjs';
import { RunnerConfigError } from '../dispatch/config.mjs';
import { loadCoordinationProtocol } from '../definitions/protocol-loader.mjs';
import { mergePolicyStack } from '../definitions/schema.mjs';
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

function assertKnownReadOnlyRole(role, label) {
  if (!READ_ONLY_ROLES.has(role)) {
    throw new CoordinationError(
      'validation',
      `${label}: role "${role}" is not a legal/known role (expected one of: ${[...READ_ONLY_ROLES].join(', ')})`,
    );
  }
}

function buildReadOnlyContract({ objective, contextRefs, constraints, expectedOutputs, evidenceRequired, role, capabilities, budget, timeoutMs }) {
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
  };
}

/**
 * Read the RunResult a `result-linked` event points at, straight off disk.
 * Fails closed (`CoordinationError`) on any shape the event log promised
 * but the filesystem does not actually have -- an ambiguous/foreign state,
 * never silently guessed past.
 */
function readLinkedRunResultFromDisk(fgosDir, assignmentId, runId) {
  const prefix = `run_${assignmentId}_`;
  if (!runId.startsWith(prefix)) {
    throw new CoordinationError(
      'foreign-ref',
      `result-linked event runId "${runId}" does not match the expected shape for assignment "${assignmentId}"`,
    );
  }
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
async function createAndExecuteSessionTask({ coordinationId, taskKey, actorId, contract, caller }, opts = {}) {
  const reconciled = replaySession(coordinationId, opts);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);

  const assignment = createSessionAssignment({ coordinationId, taskKey, actorId, contract, caller }, opts);

  const priorLink = reconciled.events.find(
    (event) => event.type === 'result-linked' && event.payload.assignmentId === assignment.assignmentId,
  );
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
    runResult = await executeAssignment(assignment, { ...opts, isReadOnlyMode: true });
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
 * @param {object} [opts] Workspace options ({ cwd, repoRoot })
 * @returns {Readonly<object>} The stored manifest
 */
export function openStandaloneSession(
  { coordinationId, objective, writerId, parentAssignmentId, primaryRole, aggregateBounds, workRef = null },
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

  return createAndExecuteSessionTask({ coordinationId, taskKey, actorId: PRIMARY_ACTOR_ID, contract, caller }, opts);
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
  for (const ref of contextRefs) {
    if (/^asgn_/.test(ref)) {
      const exists = fs.existsSync(path.join(fgosDir, 'assignments', ref, 'assignment.json'));
      if (exists && !assignmentRefs.includes(ref)) {
        throw new CoordinationError(
          'validation',
          `proposeConsult: contextRefs entry "${ref}" references an Assignment outside this session -- sibling/foreign context leakage is rejected`,
        );
      }
    }
    if (/^coord_/.test(ref) && ref !== coordinationId) {
      throw new CoordinationError(
        'validation',
        `proposeConsult: contextRefs entry "${ref}" references a different coordination session -- cross-session leakage is rejected`,
      );
    }
  }

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

  return createAndExecuteSessionTask(
    { coordinationId, taskKey: taskKey ?? `consult:${specialistActorId}`, actorId: specialistActorId, contract, caller },
    opts,
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

  return { operation, actorId: actorEntry.id, actorEntry, node: matchedNode };
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
 * @param {object} [opts] Workspace options ({ cwd, repoRoot, packageRoot })
 * @returns {Readonly<object>} The stored manifest
 */
export function openDeclaredProtocolSession(
  { definitionId, coordinationId, objective, writerId, parentAssignmentId, aggregateBounds, workRef = null },
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

  const { operation, actorId, actorEntry } = resolveDeclaredOperationActor(definition, operationId, targetActorId);
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
    { coordinationId, taskKey, actorId, contract, caller },
    {
      ...opts,
      cliOverride,
      maxAssignmentsForSession: manifest.aggregateBounds.maxAssignments,
      maxConcurrencyForSession: manifest.aggregateBounds.maxConcurrency,
      maxRoundsForSession: manifest.aggregateBounds.maxRounds,
      ...(incomingEdge ? { maxRoundsForActor: incomingEdge.maxRounds ?? Infinity } : {}),
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

    const linkedEvent = events.find((e) => e.type === 'result-linked' && e.payload.assignmentId === assignmentId);
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
