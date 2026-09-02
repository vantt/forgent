// dispatch/mission-lite.mjs — Mission-Lite Brainstorm And Debate for Team Dispatch V1 (Step 07).
//
// Rules:
// - Read-only mission-lite only.
// - Storage under .fgos/missions/<mission-id>/.
// - Creates mission.json and thread.jsonl.
// - Creates read-only assignments with workId: null.
// - Runs role assignments through hardened Assignment/RunResult path.
// - Refuses mutating operations in mission-lite mode.
// - Produces synthesis.md from structured role results.
// - Does NOT create or mutate Work items automatically — only recommends a Work item.
// - No Work lifecycle, no repo mutation, no Job, scheduler, daemon, or mailbox.

import fs from 'node:fs';
import path from 'node:path';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from '../paths.mjs';
import { resolveWriterIdentity } from '../../util/session-identity.mjs';
import { RunnerConfigError } from './config.mjs';
import { buildAssignment, isReadOnlyAssignment } from './assignment.mjs';
import { executeAssignment } from './assignment-runner.mjs';
import { stampDeclaredAssignment } from './assignment-normalizer.mjs';

// ADR-006 R8: mission-lite's role assignments always dispatch through the
// inline execution-contract path (no domain/workflow/stage/operation
// involved -- see createMissionAssignment below), so the declared-shape
// stage-graph import this file used to need is gone.

// ADR-006 R8: default budget for a mission-lite inline contract when the
// caller does not supply one. `timeoutMs` mirrors executeAssignment's own
// fallback run timeout (assignment-runner.mjs, `opts.timeoutMs ?? cfg.timeoutMs
// ?? 900000`) so a mission-lite role assignment gets the same default budget
// as any other dispatch; `maxRuns: 1` matches mission-lite's one-shot role
// assignment model (Step 07 -- no cross-pass retry concept here). Neither
// value is currently enforced by assignment-runner.mjs (ADR-006 R3: "budget
// = timeoutMs, maxRuns only (tokens recorded, not enforced)") -- this is
// recorded provenance, not a live limiter, same as every other inline
// contract's budget field.
const DEFAULT_INLINE_TIMEOUT_MS = 900000;
const DEFAULT_INLINE_MAX_RUNS = 1;

// createMissionAssignment's exclusive-create assignmentId claim (see its
// body) retries this many times on an id collision before giving up with a
// clear error, instead of spinning indefinitely.
const MAX_ASSIGNMENT_CLAIM_ATTEMPTS = 8;

/**
 * Resolve root and missions directory for a given workspace.
 *
 * @param {object} [opts]
 * @param {string} [opts.repoRoot]
 * @param {string} [opts.cwd]
 * @returns {{ root: string, fgosDir: string, missionsDir: string }}
 */
function resolveMissionsDir(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  let root = opts.repoRoot;
  if (!root) {
    root = resolveMainCheckoutRoot(cwd);
    if (!root) {
      root = resolveMainCheckoutRoot(process.cwd());
    }
  }
  if (!root) {
    root = process.cwd();
  }
  const fgosDir = fgosDirFromRoot(cwd);
  const missionsDir = path.join(fgosDir, 'missions');
  return { root, cwd, fgosDir, missionsDir };
}

/**
 * Create a new mission-lite envelope under .fgos/missions/<missionId>/ (Step 07 §4).
 *
 * @param {object} params
 * @param {string} [params.missionId] Optional mission ID; auto-generated if omitted
 * @param {string} params.objective Question or goal for this debate/brainstorm
 * @param {string} [params.mode] Mode name (defaults to 'debate')
 * @param {string[]} [params.constraints] Constraints list
 * @param {string[]} [params.successCriteria] Success criteria list
 * @param {object} [opts] Options ({ repoRoot, cwd })
 * @returns {Readonly<object>} Stored mission.json object
 */
export function createMission(
  {
    missionId,
    objective,
    mode = 'debate',
    constraints = ['read-only', 'no Work lifecycle', 'no repo mutation'],
    successCriteria = [
      'each role writes structured result',
      'synthesis names decision, tradeoffs, and recommended Work item',
    ],
  },
  opts = {},
) {
  if (!objective || typeof objective !== 'string' || objective.trim() === '') {
    throw new RunnerConfigError('createMission requires a non-empty objective string');
  }

  const { missionsDir } = resolveMissionsDir(opts);
  const id = missionId
    ? missionId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : `mission_debate_${Date.now().toString(36)}`;

  const missionDir = path.join(missionsDir, id);
  const assignmentsDir = path.join(missionDir, 'assignments');
  const resultsDir = path.join(missionDir, 'results');

  fs.mkdirSync(assignmentsDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  const missionPath = path.join(missionDir, 'mission.json');
  const threadPath = path.join(missionDir, 'thread.jsonl');

  const missionObj = {
    missionId: id,
    objective: objective.trim(),
    mode,
    status: 'open',
    createdAt: new Date().toISOString(),
    constraints: Object.freeze([...constraints]),
    successCriteria: Object.freeze([...successCriteria]),
  };

  fs.writeFileSync(missionPath, `${JSON.stringify(missionObj, null, 2)}\n`);

  if (!fs.existsSync(threadPath)) {
    fs.writeFileSync(threadPath, '');
  }

  return Object.freeze(missionObj);
}

/**
 * Read mission.json for a missionId (Step 07 §4).
 *
 * @param {string} missionId
 * @param {object} [opts]
 * @returns {Readonly<object>} Mission object
 */
export function getMission(missionId, opts = {}) {
  if (!missionId || typeof missionId !== 'string') {
    throw new RunnerConfigError('getMission requires a non-empty missionId string');
  }

  const { missionsDir } = resolveMissionsDir(opts);
  const missionPath = path.join(missionsDir, missionId, 'mission.json');

  if (!fs.existsSync(missionPath)) {
    throw new RunnerConfigError(`mission "${missionId}" does not exist at ${missionPath}`);
  }

  try {
    const raw = fs.readFileSync(missionPath, 'utf8');
    return Object.freeze(JSON.parse(raw));
  } catch (err) {
    throw new RunnerConfigError(`failed to read mission.json for "${missionId}": ${err.message}`);
  }
}

/**
 * List all missions stored under .fgos/missions/ (Step 07 §4).
 *
 * @param {object} [opts]
 * @returns {Readonly<object>[]} Array of mission objects
 */
export function listMissions(opts = {}) {
  const { missionsDir } = resolveMissionsDir(opts);
  if (!fs.existsSync(missionsDir)) return Object.freeze([]);

  const results = [];
  try {
    const entries = fs.readdirSync(missionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const missionPath = path.join(missionsDir, entry.name, 'mission.json');
        if (fs.existsSync(missionPath)) {
          try {
            const raw = fs.readFileSync(missionPath, 'utf8');
            results.push(JSON.parse(raw));
          } catch {
            // ignore malformed mission files during listing
          }
        }
      }
    }
  } catch {
    // ignore directory read errors
  }

  return Object.freeze(results);
}

/**
 * Append a thread message to .fgos/missions/<missionId>/thread.jsonl (Step 07 §4).
 *
 * @param {string} missionId
 * @param {object} message Semantic message object
 * @param {object} [opts]
 */
export function appendThreadMessage(missionId, message, opts = {}) {
  const { missionsDir } = resolveMissionsDir(opts);
  const threadPath = path.join(missionsDir, missionId, 'thread.jsonl');
  const line = `${JSON.stringify(message)}\n`;
  fs.appendFileSync(threadPath, line, 'utf8');
}

/**
 * Read thread messages from .fgos/missions/<missionId>/thread.jsonl (Step 07 §4).
 *
 * @param {string} missionId
 * @param {object} [opts]
 * @returns {object[]} Array of parsed message objects
 */
export function readThreadMessages(missionId, opts = {}) {
  const { missionsDir } = resolveMissionsDir(opts);
  const threadPath = path.join(missionsDir, missionId, 'thread.jsonl');
  if (!fs.existsSync(threadPath)) return [];

  const raw = fs.readFileSync(threadPath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim() !== '');
  const messages = [];
  for (const line of lines) {
    try {
      messages.push(JSON.parse(line));
    } catch {
      // ignore bad JSON lines
    }
  }
  return messages;
}

/**
 * Create a read-only role assignment for a mission-lite objective (Step 07 §5,
 * ADR-006 R8). Assignments created in mission-lite always have `workId: null`
 * and are built via the INLINE execution-contract path (ADR-006 R4) --
 * `mutation: 'read-only'` and `evidence.required: 'reported'` are hardcoded
 * here, never derived from caller input, since mission-lite is strictly
 * read-only for its first slice (ADR-006 §6). There is no `domain`/`stage`/
 * `operation` concept in this shape at all: `execution-contract.mjs` rejects
 * `mutation: 'mutating'` at build time (ADR-006 §6), so this function
 * cannot construct a mutating Assignment even if a caller tried -- the
 * `isReadOnlyAssignment` check below is defense-in-depth on top of that
 * build-time guarantee, not the only gate.
 *
 * ADR-006 R8: writes the ONE canonical copy of assignment.json, at creation
 * time, directly to `.fgos/assignments/<assignmentId>/assignment.json` --
 * the exact path `executeAssignment()` itself later reads back from
 * (assignment-runner.mjs). This is deliberately NOT a second write under
 * `.fgos/missions/<id>/assignments/` (the pre-ADR-006-R8 duplicate-write
 * pattern): writing directly to the canonical location, once, at creation
 * time keeps the Assignment recoverable purely from its assignmentId (the
 * reference the `thread.jsonl` TASK message below carries) even before
 * `runMissionAssignment` ever executes it, without ever holding two
 * divergence-prone copies of the same immutable object.
 *
 * @param {object} params
 * @param {string} params.missionId Target mission ID
 * @param {string} params.role Role hint for the inline contract (e.g. 'researcher', 'reviewer', 'advisor')
 * @param {string} [params.objective] Specific assignment objective (defaults to the mission's own objective)
 * @param {string[]} [params.contextRefs] Bounded context references
 * @param {string[]} [params.constraints] Constraints/authority the assignee must respect
 * @param {string[]} [params.expectedOutputs] Expected output descriptions
 * @param {string[]} [params.capabilities] Optional capability hints
 * @param {{timeoutMs?: number, maxRuns?: number, tokens?: number}} [params.budget] Optional budget override
 * @param {string} [params.createdBy] Identity of creator
 * @param {object} [opts] Workspace options
 * @returns {Readonly<object>} Stored Assignment object
 */
export function createMissionAssignment(
  {
    missionId,
    role,
    objective,
    contextRefs = [],
    constraints = [],
    expectedOutputs = [],
    capabilities,
    budget,
    createdBy,
  },
  opts = {},
) {
  const mission = getMission(missionId, opts);
  const { fgosDir } = resolveMissionsDir(opts);
  const assignmentsDir = path.join(fgosDir, 'assignments');

  // ADR-006 R1/R4: `caller.writerId` is expected to come from
  // `resolveWriterIdentity()` (src/util/session-identity.mjs) -- the pure
  // build-time validator (execution-contract.mjs) deliberately never calls
  // it itself, since resolving a writer identity is a caller-side
  // (session-aware) concern. This is that real call site. `String(...)`:
  // `resolveWriterIdentity`'s `id` is a number for a PID fallback (no
  // agent-session env var present) and a string otherwise -- mirrors every
  // other caller of this function in the codebase (state/store.mjs,
  // state/events.mjs, state/runtime-coordination.mjs all do the same
  // `String(resolveWriterIdentity(dir).id)` coercion) so `caller.writerId`
  // always satisfies execution-contract.mjs's `isNonEmptyString` + format
  // check regardless of which source resolved it.
  const writerId = String(resolveWriterIdentity(fgosDir).id);

  const buildCandidateAssignment = () =>
    buildAssignment({
      workId: null,
      createdBy,
      options: {
        assignmentsDir,
      },
      provenance: {
        kind: 'inline',
        contract: {
          objective: objective ?? mission.objective,
          contextRefs,
          constraints,
          expectedOutputs: expectedOutputs.length > 0 ? expectedOutputs : ['agent-result.json (status, summary)'],
          mutation: 'read-only',
          evidence: { required: 'reported' },
          role,
          ...(capabilities !== undefined ? { capabilities } : {}),
          budget: {
            timeoutMs: budget?.timeoutMs ?? DEFAULT_INLINE_TIMEOUT_MS,
            maxRuns: budget?.maxRuns ?? DEFAULT_INLINE_MAX_RUNS,
            ...(budget?.tokens !== undefined ? { tokens: budget.tokens } : {}),
          },
        },
        caller: { writerId },
      },
    });

  // `createAssignmentId` (assignment.mjs) only SCANS assignmentsDir for the
  // next free sequence number -- it never reserves the slot, so two
  // concurrent callers under the same writer identity (the real shape of a
  // multi-role "debate" mission) can compute the identical candidate
  // assignmentId before either one's directory/file exists on disk. Claim
  // the id atomically with an exclusive create (`wx`, fails EEXIST if
  // another writer already claimed this exact path) instead of the
  // previous check-then-write (`!fs.existsSync` then `writeFileSync`),
  // which silently let the second writer's real content lose with no error
  // anywhere in the chain. On EEXIST, rebuild the candidate: the losing
  // writer's own `mkdirSync` below already left a same-named directory
  // entry under `assignmentsDir`, so the next `buildAssignment()` call's
  // `createAssignmentId` scan sees it and advances past it, producing a
  // genuinely fresh id to retry with. Bounded, not infinite -- a run of
  // MAX_ASSIGNMENT_CLAIM_ATTEMPTS straight collisions signals something
  // structurally wrong (not an ordinary contention blip) and should fail
  // loudly rather than spin.
  let assignment;
  let assignmentJsonPath;
  let claimed = false;
  for (let attempt = 0; attempt < MAX_ASSIGNMENT_CLAIM_ATTEMPTS && !claimed; attempt += 1) {
    assignment = buildCandidateAssignment();

    // Step 07 §7 / ADR-006 §6: defense-in-depth only -- see the function
    // docstring above for why this can never actually fire for an
    // Assignment buildAssignment() itself produced (structurally
    // unreachable dead code, same shape as the already-reviewed
    // `fallbackMutationForAssignment` try/catch elsewhere in this cell's
    // history; kept because a future change to this function's own
    // construction above is exactly the kind of local regression this
    // check exists to catch).
    if (!isReadOnlyAssignment(assignment)) {
      throw new RunnerConfigError(
        `cannot create mutating assignment (role: "${assignment.role}") in mission-lite mode — mission-lite is strictly read-only`,
      );
    }

    const assignmentDir = path.join(assignmentsDir, assignment.assignmentId);
    fs.mkdirSync(assignmentDir, { recursive: true });
    assignmentJsonPath = path.join(assignmentDir, 'assignment.json');

    let fd;
    try {
      fd = fs.openSync(assignmentJsonPath, 'wx');
    } catch (err) {
      if (err.code === 'EEXIST') {
        continue; // another writer already claimed this exact id -- retry with a fresh candidate
      }
      throw err;
    }
    try {
      fs.writeSync(fd, `${JSON.stringify(assignment, null, 2)}\n`);
    } finally {
      fs.closeSync(fd);
    }
    claimed = true;
  }

  if (!claimed) {
    throw new RunnerConfigError(
      `createMissionAssignment could not claim a unique assignmentId for mission "${missionId}" after ${MAX_ASSIGNMENT_CLAIM_ATTEMPTS} attempts -- persistent assignmentId collisions`,
    );
  }

  appendThreadMessage(
    missionId,
    {
      type: 'TASK',
      assignmentId: assignment.assignmentId,
      toRole: assignment.role,
      objective: assignment.objective,
      createdAt: new Date().toISOString(),
    },
    opts,
  );

  return assignment;
}

// ADR-006 R7 (P02.4 Review HIGH fix): runMissionAssignment's string-ID
// branch reads a stored assignment.json back from disk via raw JSON.parse,
// bypassing buildAssignment()/the normalizer entirely -- so `mutation` is
// `undefined` on any assignment.json written before that field existed (or
// otherwise missing it). This mirrors the exact read-back gap already fixed
// for `findLatestAssignmentRunResult` in operation-choice.mjs: derive the
// SAME value assignment-normalizer.mjs would stamp for this role/operation
// pair, from that module's own single source of truth -- never a second,
// independently hand-maintained table that could drift from it.
function fallbackMutationForAssignment(asgn) {
  const operation = asgn?.operation;
  if (typeof operation !== 'string' || !operation) return undefined;
  try {
    return stampDeclaredAssignment({ role: asgn?.role, operation }).mutation;
  } catch {
    return undefined;
  }
}

/**
 * Execute a mission-lite assignment through the hardened Assignment/RunResult path (Step 07 §7).
 *
 * @param {string} missionId Mission ID
 * @param {string|object} assignmentOrId Assignment ID or Assignment object
 * @param {object} [opts] Execution options (cwd, repoRoot, cliOverride, runnerConfig, timeoutMs)
 * @returns {Promise<Readonly<object>>} Stored RunResult object
 */
export async function runMissionAssignment(missionId, assignmentOrId, opts = {}) {
  getMission(missionId, opts);
  const { root, cwd, fgosDir } = resolveMissionsDir(opts);

  let assignment = typeof assignmentOrId === 'string' ? null : assignmentOrId;
  const assignmentId = typeof assignmentOrId === 'string' ? assignmentOrId : assignmentOrId?.assignmentId;

  if (!assignment) {
    // ADR-006 R8: createMissionAssignment writes the ONE canonical copy of
    // assignment.json directly at creation time (see its own comment) --
    // there is no mission-scoped duplicate under
    // `.fgos/missions/<id>/assignments/` to read back from anymore.
    const assignmentPath = path.join(fgosDir, 'assignments', String(assignmentId), 'assignment.json');
    if (!fs.existsSync(assignmentPath)) {
      throw new RunnerConfigError(`assignment "${assignmentId}" not found in mission "${missionId}"`);
    }
    assignment = Object.freeze(JSON.parse(fs.readFileSync(assignmentPath, 'utf8')));
  }

  // ADR-006 R8: `thread.jsonl`'s own TASK messages are this mission's
  // authoritative membership index (unchanged schema, just consulted
  // here): confirm the resolved assignment was genuinely created for THIS
  // mission before it is ever executed under this mission's thread --
  // otherwise a caller that mixes up an Assignment (or assignmentId) from
  // a different mission would silently execute it under the wrong
  // mission's thread instead of failing loudly, a safety property the old
  // mission-scoped directory provided "for free" by construction. Runs
  // unconditionally for BOTH the string-ID and object-form call paths,
  // keyed off `assignment.assignmentId` (available in both cases once
  // `assignment` is resolved above), mirroring how the
  // effectiveMutation/isReadOnlyAssignment check below already applies
  // uniformly to both forms.
  const belongsToMission = readThreadMessages(missionId, opts).some(
    (m) => m && m.type === 'TASK' && m.assignmentId === assignment.assignmentId,
  );
  if (!belongsToMission) {
    throw new RunnerConfigError(`assignment "${assignment.assignmentId}" not found in mission "${missionId}"`);
  }

  // Step 07 §7: Refuse mutating operations in mission-lite. Backfill
  // `mutation` for a raw disk read-back (assignment.json predating the
  // field) instead of calling isReadOnlyAssignment on the unbackfilled
  // object directly -- see fallbackMutationForAssignment above. The
  // backfilled object (never the original mutated in place) is what
  // flows into executeAssignment below too, so its own internal legality
  // gate sees the same derived, correct `mutation` value. Note (ADR-006
  // R8): fallbackMutationForAssignment can only backfill from a declared
  // `role`+`operation` pair -- an inline Assignment never carries
  // `operation`, so a corrupted/tampered inline assignment.json missing
  // `mutation` cannot be recovered here and correctly fails CLOSED (refused
  // below) rather than silently treated as read-only. This is intentional:
  // unlike the declared shape's real "file predates the field" migration
  // scenario (ADR-006 R7), no historical inline assignment.json ever
  // existed without `mutation` stamped (execution-contract.mjs requires it
  // at build time), so there is no legitimate case to recover here, only a
  // corruption case, and refusing is the safe direction for that.
  const effectiveMutation =
    assignment.mutation === 'read-only' || assignment.mutation === 'mutating'
      ? assignment.mutation
      : fallbackMutationForAssignment(assignment);
  assignment = Object.freeze({ ...assignment, mutation: effectiveMutation });
  if (!isReadOnlyAssignment(assignment)) {
    throw new RunnerConfigError(
      `cannot execute mutating operation "${assignment.operation}" (role: "${assignment.role}") in mission-lite mode — mission-lite is strictly read-only`,
    );
  }

  const runResult = await executeAssignment(assignment, {
    ...opts,
    repoRoot: root,
    cwd,
    isMissionLite: true,
  });

  // ADR-006 R8: executeAssignment() already persists the canonical
  // RunResult, unconditionally, at
  // `.fgos/assignments/<assignmentId>/runs/<NN>/result.json`
  // (assignment-runner.mjs) -- no second full copy is written under
  // `.fgos/missions/<id>/results/` anymore. `thread.jsonl`'s RESULT
  // message instead carries a `resultRef` pointing at that canonical
  // location, expressed relative to `.fgos/` (mirroring the existing
  // fgosDir-relative path convention `cli.mjs` already uses for its own
  // assignment-path joins) so it is resolvable regardless of which of
  // `cwd`/`repoRoot` a later reader has on hand.
  const runNumber = typeof runResult.runId === 'string' ? runResult.runId.slice(runResult.runId.lastIndexOf('_') + 1) : null;
  if (!runNumber) {
    throw new RunnerConfigError(
      `executeAssignment returned a RunResult with no parseable runId for assignment "${assignment.assignmentId}" -- cannot record a canonical resultRef`,
    );
  }
  const resultRef = `assignments/${assignment.assignmentId}/runs/${runNumber}/result.json`;

  appendThreadMessage(
    missionId,
    {
      type: 'RESULT',
      assignmentId: assignment.assignmentId,
      status: runResult.status,
      confidence: runResult.confidence,
      resultRef,
      createdAt: new Date().toISOString(),
    },
    opts,
  );

  return runResult;
}

/**
 * Produce synthesis.md report for a mission-lite brainstorm/debate (Step 07 §8).
 *
 * Contract:
 * - Synthesis names recommendation, tradeoffs, risks, and recommended next Work item.
 * - Cites role result refs (canonical `assignments/<assignment-id>/runs/<NN>/result.json`, ADR-006 R8).
 * - Excludes or explicitly labels no-evidence / failed role results as unsupported (does not treat as consensus).
 * - Does NOT create or modify Work items in the store.
 *
 * @param {string} missionId Target mission ID
 * @param {object} params Synthesis inputs
 * @param {string} params.decisionRecommendation Clear decision recommendation text
 * @param {string} params.tradeoffs Key tradeoffs analyzed across roles
 * @param {string} params.risks Identified risks
 * @param {object} params.recommendedWorkItem Recommended work item scope ({ title, verify, description })
 * @param {string} [params.evidenceQualityNote] Optional evidence quality note
 * @param {string} [params.synthesizerRole] Role producing synthesis (defaults to 'driver')
 * @param {object} [opts] Workspace options
 * @returns {Readonly<object>} Synthesis result object containing synthesisPath, content, and recommendedWorkItem
 */
export function synthesizeMission(
  missionId,
  {
    decisionRecommendation,
    tradeoffs,
    risks,
    recommendedWorkItem,
    evidenceQualityNote,
    synthesizerRole = 'driver',
  },
  opts = {},
) {
  const mission = getMission(missionId, opts);
  const { missionsDir, fgosDir } = resolveMissionsDir(opts);
  const missionDir = path.join(missionsDir, missionId);

  if (!decisionRecommendation || typeof decisionRecommendation !== 'string') {
    throw new RunnerConfigError('synthesizeMission requires a non-empty decisionRecommendation string');
  }
  if (!tradeoffs || typeof tradeoffs !== 'string') {
    throw new RunnerConfigError('synthesizeMission requires a non-empty tradeoffs string');
  }
  if (!risks || typeof risks !== 'string') {
    throw new RunnerConfigError('synthesizeMission requires a non-empty risks string');
  }
  if (!recommendedWorkItem || typeof recommendedWorkItem !== 'object' || !recommendedWorkItem.title) {
    throw new RunnerConfigError('synthesizeMission requires a recommendedWorkItem object with a title property');
  }

  // ADR-006 R8: mission-lite no longer keeps its own copies of
  // assignment/result JSON under missionDir -- `thread.jsonl`'s own TASK/
  // RESULT messages (unchanged schema) are the mission-scoped index of
  // which assignments belong to this mission and what each one's outcome
  // was; the actual assignment/result content is read back from the
  // canonical store (`.fgos/assignments/<id>/...`) via the reference each
  // message already carries (`assignmentId`, `resultRef`) -- the same
  // "recoverable via reference, not by re-deriving from nothing" property
  // `runMissionAssignment`'s own string-ID lookup above relies on.
  const roleInputs = [];
  const noEvidenceRoles = [];

  const threadMsgs = readThreadMessages(missionId, opts);
  const resultByAssignmentId = new Map();
  for (const msg of threadMsgs) {
    if (msg && msg.type === 'RESULT' && msg.assignmentId) {
      resultByAssignmentId.set(msg.assignmentId, msg);
    }
  }

  for (const taskMsg of threadMsgs) {
    if (!taskMsg || taskMsg.type !== 'TASK' || !taskMsg.assignmentId) continue;
    const assignmentId = taskMsg.assignmentId;

    let asgn = null;
    try {
      const assignmentPath = path.join(fgosDir, 'assignments', assignmentId, 'assignment.json');
      if (fs.existsSync(assignmentPath)) {
        asgn = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
      }
    } catch {
      // ignore malformed/unreadable assignment.json
    }

    const resultMsg = resultByAssignmentId.get(assignmentId);
    const resultRef = resultMsg?.resultRef ?? null;

    let res = null;
    if (resultRef) {
      try {
        const resultPath = path.join(fgosDir, resultRef);
        if (fs.existsSync(resultPath)) {
          res = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        }
      } catch {
        // ignore malformed/unreadable result.json
      }
    }

    const role = asgn?.role ?? taskMsg.toRole;
    const operation = asgn?.operation; // undefined for inline (ADR-006 R4/R8) Assignments
    const status = resultMsg?.status ?? res?.status ?? 'missing';
    const confidence = resultMsg?.confidence ?? res?.confidence ?? 'none';
    const hasEvidence = res && res.status === 'done' && (res.confidence === 'reported' || res.confidence === 'verified');

    if (!hasEvidence) {
      noEvidenceRoles.push(role);
    }

    roleInputs.push({
      assignmentId,
      role,
      operation,
      resultRef: resultRef ?? '(no result recorded)',
      status,
      confidence,
      hasEvidence,
      summary: res?.agentClaim?.summary ?? 'No summary provided',
    });
  }

  // Build inputs section lines
  const inputLines = [];
  if (roleInputs.length > 0) {
    for (const input of roleInputs) {
      const statusLabel = input.hasEvidence
        ? `status: ${input.status}, confidence: ${input.confidence}`
        : `UNSUPPORTED / NO EVIDENCE (status: ${input.status}, confidence: ${input.confidence})`;
      const roleLabel = input.operation ? `${input.role} (${input.operation})` : input.role;
      inputLines.push(`- ${roleLabel}: ${input.resultRef} [${statusLabel}] — ${input.summary}`);
    }
  } else {
    inputLines.push('- (no role results registered)');
  }

  // Evidence Quality Section
  let evidenceQualityText = evidenceQualityNote ?? '';
  if (!evidenceQualityText) {
    if (noEvidenceRoles.length > 0) {
      evidenceQualityText = `Caution: Results from role(s) [${noEvidenceRoles.join(', ')}] produced no-evidence or failed, and were excluded from consensus support per Step 07 runtime rules. Decision is based on supported role evidence only.`;
    } else {
      evidenceQualityText = `All ${roleInputs.length} role assignment(s) produced valid structured claims with reported/verified evidence. Consensus is well supported.`;
    }
  }

  // Format synthesis.md according to Step 07 §8 contract
  const synthesisContent = [
    '# Mission Synthesis',
    '',
    '## Question',
    mission.objective,
    '',
    '## Inputs',
    ...inputLines,
    '',
    '## Decision Recommendation',
    decisionRecommendation.trim(),
    '',
    '## Tradeoffs',
    tradeoffs.trim(),
    '',
    '## Risks',
    risks.trim(),
    '',
    '## Recommended Work Item',
    `- Title: ${recommendedWorkItem.title}`,
    `- Verify: ${recommendedWorkItem.verify ?? 'npm test'}`,
    `- Description: ${recommendedWorkItem.description ?? recommendedWorkItem.title}`,
    ...(recommendedWorkItem.kind ? [`- Kind: ${recommendedWorkItem.kind}`] : []),
    ...(recommendedWorkItem.risk ? [`- Risk: ${recommendedWorkItem.risk}`] : []),
    '',
    '## Evidence Quality',
    evidenceQualityText.trim(),
    '',
  ].join('\n');

  const synthesisPath = path.join(missionDir, 'synthesis.md');
  fs.writeFileSync(synthesisPath, synthesisContent, 'utf8');

  // Update mission.json status to completed
  const updatedMission = {
    ...mission,
    status: 'completed',
    synthesizerRole,
    synthesizedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(missionDir, 'mission.json'), `${JSON.stringify(updatedMission, null, 2)}\n`);

  appendThreadMessage(
    missionId,
    {
      type: 'SYNTHESIS',
      synthesizerRole,
      synthesisRef: 'synthesis.md',
      recommendedWorkItemTitle: recommendedWorkItem.title,
      createdAt: new Date().toISOString(),
    },
    opts,
  );

  return Object.freeze({
    missionId,
    synthesisPath,
    synthesisContent,
    recommendedWorkItem: Object.freeze({ ...recommendedWorkItem }),
  });
}
