// dispatch/assignment.mjs — Assignment builder, ID creation, prompt rendering,
// read-only classification, and agent-result validation for Team Dispatch V1
// (Step 01 / Step 03 / Step 04).
//
// Pure data module:
// - createAssignmentId: deterministic asgn_<work>_<op>_<seq> generator.
// - buildAssignment: converts one declared stage operation into an Assignment;
//   refuses operations whose taskSpec file does not resolve on disk (Step 04).
// - renderAssignmentPrompt: renders the standard semantic prompt for workers,
//   including concrete result artifact paths when runDir is supplied (Step 04).
// - isReadOnlyAssignment: classifies assignment as read-only or mutating (Step 04).
// - validateAgentResultClaim: validates agent-result.json schema; malformed
//   claims must produce failed/failed, not no-evidence (Step 04).
//
// Rules:
// - Assignment != Work (Assignment does not own lifecycle and receives asgn_* ids).
// - Deeply frozen return objects.
// - Never mutates work state, never creates child work.

import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_DOMAIN,
  resolveDomainName,
  operationsForStage,
  resolveTaskSpecPath,
} from '../../state/workflow-stage-graphs.mjs';
import { RunnerConfigError } from './config.mjs';

/**
 * Sanitize a string token for use in assignment / run IDs.
 * Lowercases and replaces non [a-zA-Z0-9_-] characters with '_'.
 */
function sanitizeToken(token) {
  if (!token || typeof token !== 'string') return '';
  return token.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Generate a deterministic assignment id: asgn_<safe-work-id>_<safe-operation-id>_<seq>
 *
 * @param {object} params
 * @param {string} [params.workId] Work item id (e.g. 'tsk-abc')
 * @param {string} [params.missionId] Mission id (e.g. 'mission_001')
 * @param {string} [params.stage] Stage name
 * @param {string} params.operation Operation id (e.g. 'validate-plan')
 * @param {string[]|Set<string>} [params.existingIds] Existing assignment IDs to avoid collision
 * @param {string} [params.assignmentsDir] Directory containing existing assignment folders
 * @returns {string} e.g. 'asgn_tsk_abc_validate_plan_001'
 */
export function createAssignmentId({ workId, missionId, stage, operation, existingIds = [], assignmentsDir }) {
  const safeWork = workId ? sanitizeToken(workId) : (missionId ? sanitizeToken(missionId) : 'nowork');
  const safeOp = sanitizeToken(operation || stage || 'op');
  const prefix = `asgn_${safeWork}_${safeOp}_`;

  const existingSet = Array.isArray(existingIds) ? new Set(existingIds) : new Set(existingIds || []);

  if (assignmentsDir && fs.existsSync(assignmentsDir)) {
    try {
      const entries = fs.readdirSync(assignmentsDir);
      for (const entry of entries) {
        if (typeof entry === 'string' && entry.startsWith(prefix)) {
          existingSet.add(entry);
        }
      }
    } catch {
      // ignore
    }
  }

  let maxSeq = 0;
  existingSet.forEach((id) => {
    if (typeof id === 'string' && id.startsWith(prefix)) {
      const suffix = id.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let seqStr = String(nextSeq).padStart(3, '0');
  let candidateId = `${prefix}${seqStr}`;

  if (assignmentsDir) {
    while (fs.existsSync(path.join(assignmentsDir, candidateId))) {
      nextSeq += 1;
      seqStr = String(nextSeq).padStart(3, '0');
      candidateId = `${prefix}${seqStr}`;
    }
  }

  return candidateId;
}

/**
 * Convert one selected stage operation into an immutable Assignment object (Step 03).
 *
 * @param {object} params
 * @param {object} [params.work] Optional work item
 * @param {string} [params.workId] Work item id (if work object omitted)
 * @param {string} [params.missionId] Optional mission id for mission-lite
 * @param {string} [params.domain] Domain name (defaults to work.domain or 'coding')
 * @param {string} [params.workflow] Workflow name (defaults to 'feature')
 * @param {string} params.stage Stage name (e.g. 'planning')
 * @param {string} params.operation Operation id (e.g. 'validate-plan')
 * @param {string} [params.objective] Concise semantic request
 * @param {string[]} [params.contextRefs] List of context file/work references
 * @param {string[]} [params.expectedOutputs] List of expected output artifacts or verdicts
 * @param {string[]} [params.expectedFiles] Declared footprint (repo-relative paths) the
 *   assigned helper is expected to touch — used by `scoped-subtask` to refuse undeclared
 *   or caller-overlapping file mutations (Step 06 Slice 6.4). Optional; omitted/empty means
 *   no footprint was declared.
 * @param {object} [params.policy] Optional caller-supplied policy overrides
 * @param {string} [params.role] Optional role override
 * @param {string} [params.reason] Optional roleGraph handoff reason
 * @param {string} [params.createdBy] Identity of creator
 * @param {object} [params.options] Optional execution / lookup options
 * @returns {Readonly<object>} Frozen Assignment object
 */
export function buildAssignment({
  work,
  workId,
  missionId,
  domain,
  workflow,
  stage,
  operation,
  objective,
  contextRefs = [],
  expectedOutputs = [],
  expectedFiles = [],
  policy,
  role,
  reason,
  createdBy,
  options = {},
}) {
  if (!stage || typeof stage !== 'string') {
    throw new RunnerConfigError('buildAssignment requires a non-empty stage name');
  }
  if (!operation || typeof operation !== 'string') {
    throw new RunnerConfigError('buildAssignment requires a non-empty operation id');
  }

  const resolvedDomain = resolveDomainName(domain ?? work?.domain ?? DEFAULT_DOMAIN);
  const resolvedWorkflow = workflow ?? work?.workflow ?? 'feature';
  const resolvedWorkId = work?.id ?? workId ?? null;
  const resolvedMissionId = missionId ?? options.missionId ?? null;

  const stageOps = operationsForStage(resolvedDomain, stage, { kind: resolvedWorkflow });
  const matchedOp = stageOps.find((o) => o.id === operation);

  if (!matchedOp) {
    throw new RunnerConfigError(
      `unknown operation "${operation}" for stage "${stage}" in domain "${resolvedDomain}" (declared operations: [${stageOps.map((o) => o.id).join(', ')}])`,
    );
  }

  if (!matchedOp.taskSpec) {
    throw new RunnerConfigError(`operation "${operation}" in stage "${stage}" declares no taskSpec`);
  }

  // Step 04 §5.6: refuse runtime dispatch when the taskSpec file does not resolve
  // to an existing file on disk. This prevents synthetic compatibility operations
  // (e.g. 'decompose') from being treated as dispatchable assignments when no
  // task-spec file exists. Pass `options.allowSyntheticCompatibilityOperation: true`
  // only when the caller explicitly accepts a compatibility-mode dispatch.
  if (!options.allowSyntheticCompatibilityOperation) {
    const checkRoot = options.repoRoot ?? options.cwd ?? process.cwd();
    const taskSpecAbsPath = resolveTaskSpecPath(resolvedDomain, matchedOp.taskSpec, { cwd: checkRoot });
    if (!fs.existsSync(taskSpecAbsPath)) {
      throw new RunnerConfigError(
        `operation "${operation}" in stage "${stage}": taskSpec file does not exist: ${taskSpecAbsPath} — refuse runtime dispatch for missing taskSpec`,
      );
    }
  }

  const targetRole = role ?? matchedOp.role ?? 'implementer';
  const dispatchMode = matchedOp.dispatch ?? 'assignment';
  const opReason = reason ?? matchedOp.reason ?? undefined;

  let mergedPolicy;
  if (matchedOp.policy || policy) {
    const combined = { ...(matchedOp.policy || {}), ...(policy || {}) };
    if (matchedOp.policy?.model && !policy?.model) {
      combined._fromYaml = true;
    }
    if (Array.isArray(combined.fallbackExecutors)) {
      combined.fallbackExecutors = Object.freeze([...combined.fallbackExecutors]);
    }
    mergedPolicy = Object.freeze(combined);
  }

  const existingIds = options.existingIds ?? [];
  const assignmentId = createAssignmentId({
    workId: resolvedWorkId,
    missionId: resolvedMissionId,
    stage,
    operation: matchedOp.id,
    existingIds,
    assignmentsDir: options.assignmentsDir,
  });

  const defaultObjective = objective ?? `Execute ${stage}.${matchedOp.id} operation`;

  const frozenSkills = Array.isArray(matchedOp.skills)
    ? Object.freeze([...matchedOp.skills])
    : Object.freeze([]);

  const derivedContextRefs = Array.isArray(contextRefs) ? [...contextRefs] : [];
  if (work) {
    if (work.docsRef && derivedContextRefs.length === 0) {
      derivedContextRefs.push(work.docsRef);
      derivedContextRefs.push(path.join(work.docsRef, 'plan.md'));
      derivedContextRefs.push(path.join(work.docsRef, 'CONTEXT.md'));
    }
    if (Array.isArray(work.refs)) {
      for (const r of work.refs) {
        if (r && !derivedContextRefs.includes(r)) derivedContextRefs.push(r);
      }
    }
  }

  const derivedExpectedOutputs = Array.isArray(expectedOutputs) ? [...expectedOutputs] : [];
  if (derivedExpectedOutputs.length === 0) {
    if (operation === 'validate-plan') {
      derivedExpectedOutputs.push('agent-result.json (verdict: READY | NOT READY | READY WITH CONSTRAINTS)');
      derivedExpectedOutputs.push('agent-report.md (reviewer findings and evaluation)');
    } else if (operation === 'review-item') {
      derivedExpectedOutputs.push('agent-result.json (verdict: APPROVED | REJECT, evidenceRefs: [candidate diff ref, verify result ref])');
      derivedExpectedOutputs.push('agent-report.md (reviewer findings and evaluation)');
    }
  }

  const frozenContextRefs = Object.freeze([...derivedContextRefs]);
  const frozenExpectedOutputs = Object.freeze([...derivedExpectedOutputs]);
  const frozenExpectedFiles = Object.freeze(
    Array.isArray(expectedFiles) ? expectedFiles.filter((f) => typeof f === 'string' && f.trim() !== '') : [],
  );

  const assignment = {
    assignmentId,
    workId: resolvedWorkId,
    ...(resolvedMissionId ? { missionId: resolvedMissionId } : {}),
    domain: resolvedDomain,
    workflow: resolvedWorkflow,
    stage,
    operation: matchedOp.id,
    role: targetRole,
    dispatch: dispatchMode,
    taskSpec: matchedOp.taskSpec,
    skills: frozenSkills,
    objective: defaultObjective,
    contextRefs: frozenContextRefs,
    expectedOutputs: frozenExpectedOutputs,
    expectedFiles: frozenExpectedFiles,
    ...(opReason ? { reason: opReason } : {}),
    ...(mergedPolicy ? { policy: mergedPolicy } : {}),
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...(createdBy ? { createdBy } : {}),
  };

  return Object.freeze(assignment);
}

/**
 * Render standard prompt text for an Assignment (Step 03 / Step 04).
 * Keeps prompt references as refs rather than embedding large file contents.
 * When `options.runDir` is supplied, the prompt includes concrete result artifact
 * paths so the worker knows exactly where to write agent-result.json and
 * agent-report.md (Step 04 §5.1).
 *
 * @param {object} assignment Assignment object
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {string} [options.runDir] Absolute path to the run directory for this attempt.
 *   When present, result artifact paths are included in the prompt.
 * @returns {string} Prompt string
 */
export function renderAssignmentPrompt(assignment, options = {}) {
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('renderAssignmentPrompt requires an assignment object');
  }

  const taskSpecRelPath = resolveTaskSpecPath(assignment.domain, assignment.taskSpec, options);

  const lines = [
    `Assignment: ${assignment.assignmentId}`,
    `Work: ${assignment.workId || '(none)'}`,
    ...(assignment.missionId ? [`Mission: ${assignment.missionId}`] : []),
    `Stage operation: ${assignment.stage}.${assignment.operation}`,
    `Role: ${assignment.role}`,
    `Task-spec: ${taskSpecRelPath}`,
    `Objective: ${assignment.objective}`,
  ];

  lines.push('Context refs:');
  if (assignment.contextRefs && assignment.contextRefs.length > 0) {
    for (const ref of assignment.contextRefs) {
      lines.push(`- ${ref}`);
    }
  } else {
    lines.push('- (none)');
  }

  lines.push('Expected outputs:');
  if (assignment.expectedOutputs && assignment.expectedOutputs.length > 0) {
    for (const output of assignment.expectedOutputs) {
      lines.push(`- ${output}`);
    }
  } else {
    lines.push('- (none)');
  }

  // Step 04 §5.1: include concrete result artifact paths when runDir is known.
  // Prefer absolute paths so the worker is unambiguous across worktrees.
  if (options.runDir) {
    const agentResultPath = path.join(options.runDir, 'agent-result.json');
    const agentReportPath = path.join(options.runDir, 'agent-report.md');
    lines.push('Result artifact:');
    lines.push(`- Write structured JSON to ${agentResultPath}`);
    lines.push(`- Optional human-readable report: ${agentReportPath}`);
    lines.push('- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.');
  }

  return lines.join('\n');
}

/**
 * Classify an assignment as read-only or mutating (Step 04 §5.4 / Step 07 §7).
 *
 * Initial rule:
 * - reviewer / researcher / advisor => read-only unless operation id is
 *   explicitly known mutating.
 * - implementer / helper => mutating unless taskSpec/operation is read-only
 *   or assignment belongs to mission-lite read-only mode.
 *
 * @param {object} assignment Assignment object
 * @returns {boolean} true when the assignment is read-only
 */
// Roles whose Assignments must only ever produce verdict/report artifacts,
// never a Work-lifecycle edge or a repo mutation (Step 04 §5.4 / Step 07 §7).
// Hoisted to module scope (was function-local) so a dispatch-time executor
// resolution can also gate on it directly, not just isReadOnlyAssignment's
// broader read-only classification below.
export const READ_ONLY_ROLES = new Set(['reviewer', 'researcher', 'advisor']);

export function isReadOnlyAssignment(assignment) {
  if (!assignment || typeof assignment !== 'object') return false;
  const KNOWN_MUTATING_OPS = new Set(['implement-item', 'fix-verify-red', 'scoped-subtask']);
  const READ_ONLY_OPS = new Set([
    'validate-plan',
    'resolve-question',
    'scout-blast-radius',
    'shape-plan',
    'lock-decisions',
    'judge-ambiguity',
    'compound-learn',
  ]);
  const role = assignment.role ?? 'implementer';
  const op = assignment.operation ?? '';
  if (KNOWN_MUTATING_OPS.has(op)) {
    return false;
  }
  if (READ_ONLY_ROLES.has(role) || READ_ONLY_OPS.has(op) || assignment.missionId || assignment.workId === null) {
    return true;
  }
  return false;
}

// Allowed status values for agent-result.json (Step 04 §5.2).
const ALLOWED_AGENT_CLAIM_STATUSES = new Set(['done', 'blocked', 'failed', 'no-evidence']);

/**
 * Validate the parsed content of agent-result.json (Step 04 §5.2).
 *
 * Returns `{ valid: true }` when the claim passes all requirements.
 * Returns `{ valid: false, reason: string }` when the claim is invalid.
 *
 * Allowed statuses: done | blocked | failed | no-evidence.
 * Required for all statuses: status (allowed string), summary (non-empty string).
 * Additional required fields:
 * - blocked: requires `blocker` (non-empty string).
 * - failed: requires `error` (non-empty string).
 * - done: requires at least one of evidenceRefs (non-empty array), or
 *   the caller must verify companion artifact / post-run delta separately.
 *   The validator does NOT inspect the filesystem; it only checks the JSON fields.
 *
 * Malformed JSON or invalid schema must produce failed/failed, not no-evidence.
 *
 * @param {unknown} value Parsed agent-result.json content
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateAgentResultClaim(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, reason: 'agent-result.json must be a JSON object' };
  }

  const { status, summary } = value;

  if (!status || typeof status !== 'string' || !ALLOWED_AGENT_CLAIM_STATUSES.has(status)) {
    return {
      valid: false,
      reason: `agent-result.json status must be one of [${[...ALLOWED_AGENT_CLAIM_STATUSES].join(', ')}]; got: ${JSON.stringify(status)}`,
    };
  }

  if (!summary || typeof summary !== 'string' || summary.trim() === '') {
    return { valid: false, reason: 'agent-result.json requires a non-empty summary string' };
  }

  if (status === 'blocked') {
    const { blocker } = value;
    if (!blocker || typeof blocker !== 'string' || blocker.trim() === '') {
      return { valid: false, reason: 'agent-result.json with status "blocked" requires a non-empty blocker string' };
    }
  }

  if (status === 'failed') {
    const { error } = value;
    if (!error || typeof error !== 'string' || error.trim() === '') {
      return { valid: false, reason: 'agent-result.json with status "failed" requires a non-empty error string' };
    }
  }

  if (value.evidenceRefs !== undefined) {
    if (!Array.isArray(value.evidenceRefs)) {
      return { valid: false, reason: 'agent-result.json evidenceRefs must be an array if provided' };
    }
    for (const ref of value.evidenceRefs) {
      if (typeof ref !== 'string' || ref.trim() === '') {
        return { valid: false, reason: 'agent-result.json evidenceRefs items must be non-empty strings' };
      }
    }
  }

  return { valid: true };
}
