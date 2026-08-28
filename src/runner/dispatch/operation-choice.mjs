// dispatch/operation-choice.mjs — Stage operation selection helper for Team Dispatch V1 (Step 05).
//
// Pure helper:
// - chooseStageOperation: resolves legal stage operations via operationsForStage and
//   selects either the primary stage owner path or a secondary Assignment operation.
// - executeDriverOperationChoice: executes chosen stage operation (builds/executes Assignment
//   if requested) and consumes hardened RunResult conservatively.
// - Never mutates Work lifecycle state directly as a side effect.

import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_DOMAIN,
  resolveDomainName,
  operationsForStage,
} from '../../state/workflow-stage-graphs.mjs';
import { resolveContentRoot } from '../../intake/plan.mjs';
import { buildAssignment } from './assignment.mjs';
import { executeAssignment } from './assignment-runner.mjs';

/**
 * Check whether plan.md exists for a given work item.
 *
 * @param {object} params
 * @param {object} params.work Work item
 * @param {string} [params.repoRoot]
 * @returns {boolean}
 */
export function hasPlanMd({ work, repoRoot }) {
  if (!work) return false;
  const root = repoRoot ?? process.cwd();
  const docsRef = work.docsRef;
  if (!docsRef) return false;

  const contentRoot = resolveContentRoot(root, work.id, docsRef);
  const planPath = path.join(contentRoot, docsRef, 'plan.md');
  if (fs.existsSync(planPath)) {
    try {
      const content = fs.readFileSync(planPath, 'utf8');
      return content.trim().length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check whether plan.md contains recorded constraint evidence (e.g. ## Constraints section).
 *
 * @param {object} params
 * @param {object} [params.work] Work item
 * @param {string} [params.docsRef] docsRef path
 * @param {string} [params.repoRoot]
 * @returns {boolean}
 */
export function hasPlanConstraints({ work, docsRef, repoRoot }) {
  const resolvedDocsRef = docsRef ?? work?.docsRef;
  if (!resolvedDocsRef) return false;
  const root = repoRoot ?? process.cwd();
  const workId = work?.id ?? 'temp';

  const contentRoot = resolveContentRoot(root, workId, resolvedDocsRef);
  const planPath = path.join(contentRoot, resolvedDocsRef, 'plan.md');
  if (fs.existsSync(planPath)) {
    try {
      const content = fs.readFileSync(planPath, 'utf8');
      const upper = content.toUpperCase();
      return (
        upper.includes('## CONSTRAINT') ||
        upper.includes('# CONSTRAINT') ||
        upper.includes('CONSTRAINTS:') ||
        upper.includes('RECORDED CONSTRAINTS')
      );
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Select the legal stage operation for a Work item at its current stage (Step 05).
 *
 * Return shape:
 * {
 *   operation: string | null,
 *   reason: string,
 *   dispatch: 'direct-stage-skill' | 'assignment' | 'human-only' | null,
 *   stop: boolean,
 *   canAdvanceEdge?: boolean,
 * }
 *
 * @param {object} params
 * @param {object} params.work Work item object
 * @param {string} [params.stage] Current stage (defaults to work.stage)
 * @param {string} [params.domain] Domain (defaults to work.domain or 'coding')
 * @param {string} [params.workflow] Workflow (defaults to work.workflow or 'feature')
 * @param {readonly object[]} [params.availableOperations] Optional pre-resolved operations array
 * @param {object|null} [params.lastRunResult] Optional last Assignment RunResult for this stage
 * @param {object} [params.contextSignals] Optional signals (e.g. { hasPlan: boolean, validationDue: boolean })
 * @param {string} [params.repoRoot] Optional repo root path
 * @returns {Readonly<object>} Operation choice result
 */
export function chooseStageOperation({
  work,
  stage,
  domain,
  workflow,
  availableOperations,
  lastRunResult,
  contextSignals = {},
  repoRoot,
}) {
  const currentStage = stage ?? work?.stage;
  if (!currentStage) {
    return Object.freeze({
      operation: null,
      reason: 'no-stage-specified',
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  const domainInput = typeof domain === 'object' && domain !== null ? (domain.name ?? domain) : domain;
  const resolvedDomain = resolveDomainName(domainInput ?? work?.domain ?? DEFAULT_DOMAIN);
  const resolvedWorkflow = workflow ?? work?.workflow ?? 'feature';

  const ops = availableOperations ?? operationsForStage(resolvedDomain, currentStage, { kind: resolvedWorkflow });

  if (!ops || ops.length === 0) {
    return Object.freeze({
      operation: null,
      reason: 'no-operations-available',
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  // Explicit secondary operation requested via contextSignals
  if (contextSignals.secondaryOperation) {
    const selectedOp = ops.find((o) => o.id === contextSignals.secondaryOperation);
    if (selectedOp) {
      return Object.freeze({
        operation: selectedOp.id,
        reason: `secondary-operation-${selectedOp.id}`,
        dispatch: selectedOp.dispatch === 'human-only' ? 'human-only' : 'assignment',
        stop: selectedOp.dispatch === 'human-only',
        canAdvanceEdge: false,
      });
    }
  }

  const primaryOp = ops.find((o) => o.primary) ?? ops[0];

  // Deterministic rules per stage (Step 05 §6)

  // 1. Planning stage choice (Step 05 §6.2)
  if (currentStage === 'planning' || currentStage === 'decompose') {
    const validateOp = ops.find((o) => o.id === 'validate-plan');

    // Check if plan.md exists
    const planExists = contextSignals.hasPlan ?? (work ? hasPlanMd({ work, repoRoot }) : false);

    // If lastRunResult exists from validate-plan:
    if (lastRunResult) {
      const interpreted = interpretAssignmentRunResult({
        choice: { operation: 'validate-plan' },
        runResult: lastRunResult,
        contextSignals,
      });

      if (interpreted.reason === 'assignment-validate-plan-no-evidence') {
        return Object.freeze({
          operation: 'validate-plan',
          reason: 'validation-no-evidence-do-not-advance-work',
          dispatch: 'assignment',
          stop: true,
          canAdvanceEdge: false,
        });
      }

      if (interpreted.reason === 'assignment-validate-plan-failed') {
        return Object.freeze({
          operation: 'validate-plan',
          reason: 'validation-failed-do-not-advance-work',
          dispatch: 'assignment',
          stop: true,
          canAdvanceEdge: false,
        });
      }

      if (interpreted.nextOperation === 'shape-plan') {
        return Object.freeze({
          operation: primaryOp.id,
          reason: 'validation-returned-to-planning',
          dispatch: 'direct-stage-skill',
          stop: false,
          canAdvanceEdge: false,
        });
      }

      if (interpreted.canAdvanceEdge) {
        return Object.freeze({
          operation: primaryOp.id,
          reason: 'validation-passed-ready-for-planning-edge',
          dispatch: 'direct-stage-skill',
          stop: false,
          canAdvanceEdge: true,
        });
      }

      if (interpreted.stop) {
        return Object.freeze({
          operation: 'validate-plan',
          reason: interpreted.reason,
          dispatch: 'assignment',
          stop: true,
          canAdvanceEdge: false,
        });
      }
    }

    // If plan.md exists and validation is due (and validate-plan is a legal stage operation with a taskSpec)
    const validationDue = contextSignals.validationDue ?? planExists;
    const taskSpecExists = !repoRoot || fs.existsSync(path.join(repoRoot, 'domains', resolvedDomain, 'task-specs', 'validate-plan.md'));
    if (validateOp && planExists && validationDue && taskSpecExists) {
      return Object.freeze({
        operation: 'validate-plan',
        reason: 'plan-written-needs-reality-check',
        dispatch: validateOp.dispatch === 'human-only' ? 'human-only' : 'assignment',
        stop: validateOp.dispatch === 'human-only',
        canAdvanceEdge: false,
      });
    }

    // Default planning path: shape-plan primary path
    return Object.freeze({
      operation: primaryOp.id,
      reason: 'primary-stage-owner-work',
      dispatch: primaryOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill',
      stop: primaryOp.dispatch === 'human-only',
      canAdvanceEdge: false,
    });
  }

  // 2. Discovery stage choice (Step 05 §6.1)
  if (currentStage === 'discovery') {
    if (contextSignals.needsResearch && ops.some((o) => o.id === 'resolve-question')) {
      return Object.freeze({
        operation: 'resolve-question',
        reason: 'bounded-evidence-gap-research-consult',
        dispatch: 'assignment',
        stop: false,
        canAdvanceEdge: false,
      });
    }
    return Object.freeze({
      operation: primaryOp.id,
      reason: 'primary-stage-owner-work',
      dispatch: primaryOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill',
      stop: primaryOp.dispatch === 'human-only',
      canAdvanceEdge: false,
    });
  }

  // 3. Executing stage choice (Step 05 §6.3)
  if (currentStage === 'executing') {
    return Object.freeze({
      operation: primaryOp.id,
      reason: 'primary-stage-owner-work',
      dispatch: primaryOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill',
      stop: primaryOp.dispatch === 'human-only',
      canAdvanceEdge: false,
    });
  }

  // Fallback for other stages
  const isHumanOnly = primaryOp.dispatch === 'human-only';
  return Object.freeze({
    operation: primaryOp.id,
    reason: isHumanOnly ? 'human-only-operation' : 'primary-stage-owner-work',
    dispatch: isHumanOnly ? 'human-only' : 'direct-stage-skill',
    stop: isHumanOnly,
    canAdvanceEdge: false,
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function validationVerdict(agentClaim) {
  const explicit = normalizeText(agentClaim?.verdict);
  if (explicit) {
    if (explicit === 'REJECTED') return 'NOT READY - RETURN TO PLANNING';
    return explicit;
  }
  const summary = normalizeText(agentClaim?.summary);
  if (summary.includes('NOT READY') || summary.includes('REJECTED')) return 'NOT READY - RETURN TO PLANNING';
  if (summary.includes('READY WITH CONSTRAINTS')) return 'READY WITH CONSTRAINTS';
  if (summary.includes('READY')) return 'READY';
  return null;
}

function reviewVerdict(agentClaim) {
  const explicit = normalizeText(agentClaim?.verdict ?? agentClaim?.reviewVerdict);
  if (explicit) return explicit;
  const summary = normalizeText(agentClaim?.summary);
  if (summary.includes('REJECT') || summary.includes('CHANGES REQUESTED') || summary.includes('NOT APPROVED')) {
    return 'REJECT';
  }
  if (summary.includes('APPROVED') || summary.includes('APPROVE')) {
    return 'APPROVED';
  }
  return null;
}

/**
 * Interpret an Assignment RunResult for the selected stage operation.
 *
 * This function is deliberately conservative: only operation-specific verdicts
 * can unblock the driver. Generic `done` claims are not lifecycle evidence.
 *
 * @param {object} params
 * @param {object} params.choice Operation choice
 * @param {object} params.runResult Stored RunResult
 * @param {object} [params.contextSignals] Driver context signals
 * @returns {Readonly<object>}
 */
export function interpretAssignmentRunResult({ choice, runResult, contextSignals = {}, work, repoRoot }) {
  const confidence = runResult?.confidence;
  const status = runResult?.status;
  const operation = choice?.operation;

  if (confidence === 'no-evidence' || status === 'no-evidence') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-no-evidence`,
    });
  }

  if (confidence === 'failed' || status === 'failed') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-failed`,
    });
  }

  if (status === 'blocked') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-blocked`,
    });
  }

  const hasReportConfidence = confidence === 'reported' || confidence === 'verified';
  if (!hasReportConfidence || status !== 'done') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-insufficient-confidence`,
    });
  }

  if (operation === 'validate-plan') {
    const agentClaim = runResult?.agentClaim;
    const rawVerdict = agentClaim?.verdict;
    const verdict = validationVerdict(agentClaim);

    const verdictPayload = agentClaim?.verdictPayload ?? (
      rawVerdict === 'decompose' || (Array.isArray(agentClaim?.children) && agentClaim.children.length > 0)
        ? { verdict: 'decompose', children: agentClaim?.children, reason: agentClaim?.summary }
        : rawVerdict === 'need-human'
          ? { verdict: 'need-human', reason: agentClaim?.summary }
          : { verdict: 'pass-through', reason: agentClaim?.summary }
    );

    if (verdict === 'READY' || verdict === 'DECOMPOSE' || rawVerdict === 'decompose') {
      return Object.freeze({
        canAdvanceEdge: true,
        stop: false,
        reason: 'validate-plan-ready',
        verdict,
        verdictPayload,
      });
    }
    if (verdict === 'READY WITH CONSTRAINTS') {
      const targetWork = choice?.work ?? work;
      const recordedInPlan = hasPlanConstraints({ work: targetWork, repoRoot });
      const constraintsAccepted =
        recordedInPlan ||
        contextSignals.constraintsWritten === true ||
        contextSignals.constraintsAccepted === true;
      return Object.freeze({
        canAdvanceEdge: constraintsAccepted,
        stop: !constraintsAccepted,
        reason: constraintsAccepted
          ? 'validate-plan-ready-with-recorded-constraints'
          : 'validate-plan-ready-with-unrecorded-constraints',
        verdict,
        verdictPayload,
      });
    }
    if (verdict === 'NOT READY - RETURN TO PLANNING' || verdict === 'NOT READY') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: false,
        nextOperation: 'shape-plan',
        reason: 'validate-plan-return-to-planning',
        verdict,
      });
    }
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: 'validate-plan-missing-structured-verdict',
      verdict,
    });
  }

  if (operation === 'review-item') {
    const verdict = reviewVerdict(runResult.agentClaim);
    if (verdict === 'APPROVED' || verdict === 'APPROVE') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: false,
        canProceed: true,
        reason: 'review-item-approved',
        verdict,
      });
    }
    if (verdict === 'REJECT' || verdict === 'CHANGES REQUESTED' || verdict === 'NOT APPROVED') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: false,
        nextOperation: 'fix-verify-red',
        reason: 'review-item-rejected-route-fix',
        verdict,
      });
    }
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: 'review-item-missing-structured-verdict',
      verdict,
    });
  }

  if (operation === 'scout-blast-radius' || operation === 'resolve-question') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: false,
      canProceed: true,
      reason: `${operation}-reported`,
    });
  }

  if (operation === 'scoped-subtask' || operation === 'fix-verify-red') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: confidence !== 'verified',
      canProceed: confidence === 'verified',
      reason: confidence === 'verified'
        ? `${operation}-verified`
        : `${operation}-requires-verified-evidence`,
    });
  }

  return Object.freeze({
    canAdvanceEdge: false,
    stop: true,
    reason: `assignment-${operation}-has-no-adoption-rule`,
  });
}

/**
 * Execute an operation choice made by the coding driver.
 *
 * @param {object} params
 * @param {object} params.work Work item
 * @param {object} params.choice Operation choice object from chooseStageOperation
 * @param {object} [params.opts] Options for buildAssignment / executeAssignment
 * @returns {Promise<object>} Execution outcome
 */
export async function executeDriverOperationChoice(work, choice, opts = {}) {
  if (!choice || choice.stop || !choice.operation || choice.dispatch === null) {
    return {
      executed: false,
      reason: choice?.reason || 'operation-choice-stopped',
      canAdvanceEdge: false,
      stop: true,
    };
  }

  if (choice.dispatch === 'direct-stage-skill') {
    return {
      executed: true,
      dispatchType: 'direct-stage-skill',
      operation: choice.operation,
      canAdvanceEdge: choice.canAdvanceEdge ?? true,
      stop: false,
    };
  }

  if (choice.dispatch === 'human-only') {
    return {
      executed: false,
      dispatchType: 'human-only',
      operation: choice.operation,
      reason: 'human-only-operation-requires-person',
      canAdvanceEdge: false,
      stop: true,
    };
  }

  if (choice.dispatch === 'assignment') {
    const assignment = buildAssignment({
      work,
      stage: choice.stage ?? work.stage,
      operation: choice.operation,
      options: opts,
    });

    const runResult = await executeAssignment(assignment, opts);
    const interpreted = interpretAssignmentRunResult({
      choice: { ...choice, work: choice?.work ?? work },
      runResult,
      contextSignals: opts.contextSignals ?? choice.contextSignals ?? {},
      work,
      repoRoot: opts.repoRoot ?? opts.cwd,
    });

    const verdictPayload = interpreted.verdictPayload ?? (
      runResult?.agentClaim?.verdictPayload ?? (
        Array.isArray(runResult?.agentClaim?.children) && runResult.agentClaim.children.length > 0
          ? { verdict: 'decompose', children: runResult.agentClaim.children, reason: runResult?.agentClaim?.summary }
          : runResult?.agentClaim?.verdict === 'need-human'
            ? { verdict: 'need-human', reason: runResult?.agentClaim?.summary }
            : { verdict: 'pass-through', reason: runResult?.agentClaim?.summary }
      )
    );

    return {
      executed: true,
      dispatchType: 'assignment',
      assignment,
      runResult,
      verdictPayload,
      ...interpreted,
    };
  }

  return {
    executed: false,
    reason: 'unknown-dispatch-type',
    canAdvanceEdge: false,
    stop: true,
  };
}
