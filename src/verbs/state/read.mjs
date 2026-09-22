import path from 'node:path';
import { listWork, graphMetrics, graphWhatIf, staleDoingAdvisory, stalePostDeliveryAdvisory, StoreError } from '../../state/store.mjs';
import { readGateBypassLevel, canAutoApprove, canAutoApproveMergedGate } from '../../state/gate-bypass.mjs';
import { DEFAULT_DOMAIN, resolveDomainName, operationsForStage, getDomain, effectiveStage } from '../../state/workflow-stage-graphs.mjs';
import { findRunningRuns, classifyRunOutcome, reconcileRun } from '../../runner/dispatch/visibility-session.mjs';
import { isResolvedStatus } from '../../state/frontier.mjs';
import { paginate } from '../../state/cursor.mjs';
import { computeAwaitingContext } from '../../state/awaiting-context.mjs';

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

export function parseListFlag(value) {
  if (value === undefined || value === true) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function withStageEffective(item) {
  return { ...item, stageEffective: effectiveStage(item, getDomain(item.domain)) };
}

function childrenOf(view, id) {
  return Object.values(view.work ?? {}).filter((w) => w.parent === id);
}

const ALLOWED_ID_FIELDS = new Set([
  'stage', 'status', 'holder', 'title', 'docsRef',
  'verify', 'parent', 'id', 'domain', 'kind', 'risk', 'tier',
]);

const scopedByIds = (section, idSet) =>
  section ? Object.fromEntries(Object.entries(section).filter(([id]) => idSet.has(id))) : {};

const scopeSideLogsTo = (view, idSet) => ({
  ...view,
  decisions: (view.decisions ?? []).filter((d) => idSet.has(d.id)),
  discovery: scopedByIds(view.discovery, idSet),
  gates: scopedByIds(view.gates, idSet),
  settlements: scopedByIds(view.settlements, idSet),
  outcomes: scopedByIds(view.outcomes, idSet),
  frictions: scopedByIds(view.frictions, idSet),
  learnings: scopedByIds(view.learnings, idSet),
  decisionsById: scopedByIds(view.decisionsById, idSet),
});

export function listUseCase({ dir }, { id, fields, all = false, cursor, limit } = {}) {
  const rawView = listWork(dir);

  if (id !== undefined) {
    if (!id || typeof id !== 'string') {
      throw new StoreError('validation', 'list --id requires a non-empty work id');
    }
    const item = rawView.work[id];
    if (!item) {
      throw new StoreError('validation', `list: work "${id}" not found.`);
    }
    if (fields !== undefined) {
      const fieldList = Array.isArray(fields) ? fields : parseListFlag(fields);
      if (fieldList.length === 0) {
        throw new StoreError('validation', 'list --fields requires a non-empty comma-separated list of field names.');
      }
      for (const f of fieldList) {
        if (!ALLOWED_ID_FIELDS.has(f)) {
          throw new StoreError('validation', `list --fields: unknown field "${f}". Allowed fields: ${Array.from(ALLOWED_ID_FIELDS).join(', ')}.`);
        }
      }
      const fullItem = withStageEffective(item);
      const filteredItem = {};
      for (const f of fieldList) {
        if (fullItem[f] !== undefined) {
          filteredItem[f] = fullItem[f];
        }
      }
      const {
        decisions, discovery, gates, settlements, outcomes,
        frictions, learnings, decisionsById, callThreads,
        ...restView
      } = rawView;
      const singleView = {
        ...restView,
        work: { [id]: filteredItem },
      };
      if (item.status === 'awaiting-human') {
        const ctx = computeAwaitingContext(singleView, id);
        if (ctx) return { ...singleView, awaitingContext: { [id]: ctx } };
      }
      return singleView;
    }

    const scopedById = (section) => (section?.[id] !== undefined ? { [id]: section[id] } : {});
    const singleView = {
      ...rawView,
      work: { [id]: withStageEffective(item) },
      decisions: (rawView.decisions ?? []).filter((d) => d.id === id),
      discovery: scopedById(rawView.discovery),
      gates: scopedById(rawView.gates),
      settlements: scopedById(rawView.settlements),
      outcomes: scopedById(rawView.outcomes),
      frictions: scopedById(rawView.frictions),
      learnings: scopedById(rawView.learnings),
      decisionsById: scopedById(rawView.decisionsById),
      callThreads: scopedById(rawView.callThreads),
    };
    if (item.status === 'awaiting-human') {
      const ctx = computeAwaitingContext(singleView, id);
      if (ctx) return { ...singleView, awaitingContext: { [id]: ctx } };
    }
    return singleView;
  }

  const showAll = Boolean(all);
  const filteredWork = showAll
    ? rawView.work
    : Object.fromEntries(Object.entries(rawView.work).filter(([, item]) => !isResolvedStatus(item)));
  const view = {
    ...rawView,
    work: Object.fromEntries(Object.entries(filteredWork).map(([itemId, item]) => [itemId, withStageEffective(item)])),
  };

  if (!showAll) {
    const isHideableChild = (item) =>
      item.parent !== undefined && item.parent !== null && item.parent in view.work && item.status !== 'awaiting-human';
    view.work = Object.fromEntries(
      Object.entries(view.work)
        .filter(([, item]) => !isHideableChild(item))
        .map(([itemId, item]) => {
          const children = childrenOf(rawView, itemId);
          if (children.length === 0) return [itemId, item];
          const done = children.filter((w) => w.status === 'done').length;
          return [itemId, { ...item, childProgress: { done, total: children.length } }];
        }),
    );
  }

  const awaitingContext = {};
  for (const item of Object.values(view.work)) {
    if (item.status !== 'awaiting-human') continue;
    const ctx = computeAwaitingContext(view, item.id);
    if (ctx) awaitingContext[item.id] = ctx;
  }
  const base = Object.keys(awaitingContext).length > 0 ? { ...view, awaitingContext } : view;

  if (cursor === undefined && limit === undefined) {
    if (showAll) return base;
    return scopeSideLogsTo(base, new Set(Object.keys(base.work)));
  }
  const entries = Object.entries(view.work).map(([itemId, item]) => ({ id: itemId, item }));
  const { items: pagedEntries, nextCursor } = paginate(entries, { cursor, limit, order: 'list-work-v1' });
  const workPage = Object.fromEntries(pagedEntries.map(({ id: itemId, item }) => [itemId, item]));
  const scoped = scopeSideLogsTo(base, new Set(pagedEntries.map(({ id: itemId }) => itemId)));
  return { ...scoped, work: { items: workPage, nextCursor } };
}

