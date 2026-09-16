import path from 'node:path';
import { listWork, graphMetrics, graphWhatIf, staleDoingAdvisory, stalePostDeliveryAdvisory, StoreError } from '../../state/store.mjs';
import { readGateBypassLevel, canAutoApprove, canAutoApproveMergedGate } from '../../state/gate-bypass.mjs';
import { DEFAULT_DOMAIN, resolveDomainName, operationsForStage } from '../../state/workflow-stage-graphs.mjs';
import { findRunningRuns, classifyRunOutcome, reconcileRun } from '../../runner/dispatch/visibility-session.mjs';

export function graphUseCase({ dir }, { whatIfId } = {}) {
  if (whatIfId !== undefined) return graphWhatIf(dir, whatIfId);
  return graphMetrics(dir);
}

export function workflowUseCase(_ctx, { stage, domain = DEFAULT_DOMAIN, workflow } = {}) {
  if (!stage) {
    throw new StoreError('validation', 'workflow operations requires --stage <stage>');
  }
  const ops = operationsForStage(domain, stage, { kind: workflow });
  return {
    domain: resolveDomainName(domain),
    workflow: workflow || 'feature',
    stage,
    operations: ops,
  };
}

export function gateCheckUseCase({ dir }, { id, gate, artifactText, planText, childSpecs = [], cost }) {
  const item = listWork(dir).work[id];
  if (!item) {
    throw new StoreError('validation', `gate-check: no work item "${id}"`);
  }
  const level = readGateBypassLevel(dir);
  if (gate === 'contextApprove') {
    return { canAutoApprove: canAutoApprove(item, artifactText, level) };
  }
  if (gate === 'validateApprove') {
    return { canAutoApprove: canAutoApproveMergedGate(item, planText, childSpecs, cost, level) };
  }
  throw new StoreError('validation', `gate-check: --gate must be "contextApprove" or "validateApprove", got "${gate}"`);
}

export function staleUseCase({ dir, repoRoot, cleanupTtlDays }, { reconcile = false } = {}) {
  const doing = staleDoingAdvisory(dir);
  const postDelivery = stalePostDeliveryAdvisory(dir, { ttlDays: cleanupTtlDays });
  const orphans = [];
  for (const run of findRunningRuns(dir)) {
    let verdict;
    try {
      verdict = classifyRunOutcome(run.runDir, { liveness: 'unknown' });
    } catch {
      continue;
    }
    if (!verdict.changed) continue;
    const row = {
      runId: run.runId,
      runDir: path.relative(repoRoot, run.runDir),
      startedAt: run.startedAt,
      wouldBecome: verdict.outcome,
      hasWorkerResult: Boolean(verdict.resultPath),
    };
    if (reconcile) {
      reconcileRun(run.runDir, { liveness: 'unknown' });
      row.reconciled = true;
    }
    orphans.push(row);
  }

  return { ...doing, postDelivery, orphanedRuns: orphans, reconciled: Boolean(reconcile) };
}
