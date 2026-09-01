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
} from './store.mjs';
import { replaySession } from './replay.mjs';
import { CoordinationError } from './schema.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { READ_ONLY_ROLES } from '../dispatch/assignment-normalizer.mjs';
import { RunnerConfigError } from '../dispatch/config.mjs';

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
