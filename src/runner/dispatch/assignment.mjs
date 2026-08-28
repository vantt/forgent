// dispatch/assignment.mjs — Assignment builder, ID creation, and prompt
// rendering for Team Dispatch V1 (Step 01 / Step 03).
//
// Pure data module:
// - createAssignmentId: deterministic asgn_<work>_<op>_<seq> generator.
// - buildAssignment: converts one declared stage operation into an Assignment.
// - renderAssignmentPrompt: renders the standard semantic prompt for workers.
//
// Rules:
// - Assignment != Work (Assignment does not own lifecycle and receives asgn_* ids).
// - Deeply frozen return objects.
// - Never mutates work state, never creates child work.

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
 * @param {string} [params.stage] Stage name
 * @param {string} params.operation Operation id (e.g. 'validate-plan')
 * @param {string[]|Set<string>} [params.existingIds] Existing assignment IDs to avoid collision
 * @returns {string} e.g. 'asgn_tsk_abc_validate_plan_001'
 */
export function createAssignmentId({ workId, stage, operation, existingIds = [] }) {
  const safeWork = workId ? sanitizeToken(workId) : 'nowork';
  const safeOp = sanitizeToken(operation || stage || 'op');
  const prefix = `asgn_${safeWork}_${safeOp}_`;

  const existingSet = Array.isArray(existingIds) ? new Set(existingIds) : existingIds;
  let maxSeq = 0;

  if (existingSet && typeof existingSet.forEach === 'function') {
    existingSet.forEach((id) => {
      if (typeof id === 'string' && id.startsWith(prefix)) {
        const suffix = id.slice(prefix.length);
        const num = parseInt(suffix, 10);
        if (!Number.isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(3, '0');
  return `${prefix}${seqStr}`;
}

/**
 * Convert one selected stage operation into an immutable Assignment object (Step 03).
 *
 * @param {object} params
 * @param {object} [params.work] Optional work item
 * @param {string} [params.workId] Work item id (if work object omitted)
 * @param {string} [params.domain] Domain name (defaults to work.domain or 'coding')
 * @param {string} [params.workflow] Workflow name (defaults to 'feature')
 * @param {string} params.stage Stage name (e.g. 'planning')
 * @param {string} params.operation Operation id (e.g. 'validate-plan')
 * @param {string} [params.objective] Concise semantic request
 * @param {string[]} [params.contextRefs] List of context file/work references
 * @param {string[]} [params.expectedOutputs] List of expected output artifacts or verdicts
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
  domain,
  workflow,
  stage,
  operation,
  objective,
  contextRefs = [],
  expectedOutputs = [],
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

  const targetRole = role ?? matchedOp.role ?? 'implementer';
  const dispatchMode = matchedOp.dispatch ?? 'assignment';
  const opReason = reason ?? matchedOp.reason ?? undefined;

  let mergedPolicy;
  if (matchedOp.policy || policy) {
    const combined = { ...(matchedOp.policy || {}), ...(policy || {}) };
    if (Array.isArray(combined.fallbackExecutors)) {
      combined.fallbackExecutors = Object.freeze([...combined.fallbackExecutors]);
    }
    mergedPolicy = Object.freeze(combined);
  }

  const existingIds = options.existingIds ?? [];
  const assignmentId = createAssignmentId({
    workId: resolvedWorkId,
    stage,
    operation: matchedOp.id,
    existingIds,
  });

  const defaultObjective = objective ?? `Execute ${stage}.${matchedOp.id} operation`;

  const frozenSkills = Array.isArray(matchedOp.skills)
    ? Object.freeze([...matchedOp.skills])
    : Object.freeze([]);

  const frozenContextRefs = Array.isArray(contextRefs)
    ? Object.freeze([...contextRefs])
    : Object.freeze([]);

  const frozenExpectedOutputs = Array.isArray(expectedOutputs)
    ? Object.freeze([...expectedOutputs])
    : Object.freeze([]);

  const assignment = {
    assignmentId,
    workId: resolvedWorkId,
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
    ...(opReason ? { reason: opReason } : {}),
    ...(mergedPolicy ? { policy: mergedPolicy } : {}),
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...(createdBy ? { createdBy } : {}),
  };

  return Object.freeze(assignment);
}

/**
 * Render standard prompt text for an Assignment (Step 03).
 * Keeps prompt references as refs rather than embedding large file contents.
 *
 * @param {object} assignment Assignment object
 * @param {object} [options]
 * @param {string} [options.cwd]
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

  return lines.join('\n');
}
