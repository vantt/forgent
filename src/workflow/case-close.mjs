// src/workflow/case-close.mjs — close a case under its `advance` hold: `case.closed`, then release the bindings that are quiet
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The one place a case is closed, so `fgos workflow close` and a Playbook proposer that finished its
// case close it by the same rules: refused while a closure milestone is stale or a consent gate is
// parked; every binding whose attempt is quiet is released, the others are kept and named.

import { appendWorkflowEvent, projectWorkflowState, readWorkflowEvents } from './store.mjs';
import { projectCase } from './case-projection.mjs';
import { unbindWorktree } from './case-bindings.mjs';
import { playbookSubjectDigests } from './unit-handoff.mjs';

/** The case as a reader sees it: the projection with the digests a playbook's subjects have now. */
export function readCaseProjection(mainRoot, workflowRunId) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  const state = projectWorkflowState(events);
  const guide = projectCase(events).guide;
  return { events, state, projection: projectCase(events, { currentDigests: playbookSubjectDigests({ state, workflow: state.workflow, guide, mainRoot }) }) };
}

/**
 * @param {object} params
 * @param {string} params.mainRoot
 * @param {string} params.workflowRunId
 * @param {object} params.hold the case's `advance` hold
 * @param {string} [params.reason] recorded on the ledger
 * @returns {{ closed: true, unbound: string[], kept: Array<{ key: string, reason: string }> } | { closed: false, code: 'case-closed' | 'close-refused', reasons: string[] }}
 */
export function closeCaseUnderHold({ mainRoot, workflowRunId, hold, reason }) {
  const { projection } = readCaseProjection(mainRoot, workflowRunId);
  if (!projection.open) return { closed: false, code: 'case-closed', reasons: ['case-closed'] };
  if (!projection.closable.ok) return { closed: false, code: 'close-refused', reasons: projection.closable.reasons };
  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId,
    hold,
    event: { type: 'case.closed', payload: { closedAt: new Date().toISOString(), ...(reason ? { reason } : {}) } },
  });
  const unbound = [];
  const kept = [];
  for (const binding of projection.bindings) {
    const result = unbindWorktree({ mainRoot, hold, caseId: workflowRunId, generation: binding.generation, key: binding.key, worktree: binding.worktreeRoot });
    if (result.unbound) unbound.push(binding.key);
    else kept.push({ key: binding.key, reason: result.reason });
  }
  return { closed: true, unbound, kept };
}
