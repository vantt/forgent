// test/helpers/workflow-case-fixture.mjs — a conductor-shaped guide and helpers to put a case on a ledger,
// so the case model is exercised through real ledger events and no worker.

import { validateWorkflow, createWorkflowRun, appendWorkflowEvent, readWorkflowEvents } from '../../src/workflow/index.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { projectCase } from '../../src/workflow/case-projection.mjs';
import { makeFixtureDir } from './fixture-dir.mjs';

export const FRAME = Object.freeze({ dispatches: 8, mutatingDispatches: 4, fallbackPerSeat: 2, deviationsBeforeAsk: 2, rigorFloor: 'standard' });

/** A guide with a diagnostic milestone, two delivery milestones, a consent milestone and both kinds of decision point. */
export function conductorWorkflow(extra = {}) {
  return validateWorkflow({
    id: 'case-fixture',
    kind: 'guide',
    purpose: 'exercise the case model',
    milestones: [
      { id: 'request-received' },
      { id: 'plan-ready' },
      { id: 'findings-report', subject: 'what a scout found' },
      { id: 'child-built', subject: 'the tested paths of a child' },
      { id: 'integrated', subject: 'the integrated tree' },
      { id: 'approved', subject: 'the integrated tree as approved' },
    ],
    activities: [
      { id: 'plan', entry: ['request-received'], produces: ['plan-ready'], effects: 'none' },
      { id: 'scout', entry: ['request-received'], produces: ['findings-report'], effects: 'none' },
      { id: 'explore', entry: ['request-received'], produces: [], effects: 'none' },
      { id: 'build-a', entry: ['plan-ready'], produces: ['child-built'], effects: 'writes' },
      { id: 'build-b', entry: ['plan-ready'], produces: ['child-built'], effects: 'writes' },
      { id: 'late-rogue', entry: ['plan-ready'], produces: [], effects: 'none' },
      { id: 'rogue-write', entry: ['request-received'], produces: [], effects: 'writes' },
      { id: 'integrate', entry: ['child-built'], produces: ['integrated'], effects: 'writes' },
      { id: 'approve-gate', entry: ['integrated'], produces: ['approved'], effects: 'none' },
      { id: 'publish', entry: ['approved'], produces: [], effects: 'writes' },
    ],
    decisions: [
      { at: 'request-received', should: ['plan'], reason: 'plan before building', mayInstead: ['scout'] },
      { at: 'plan-ready', should: ['build-a', 'build-b'], reason: 'children build in parallel', listedRoutesOnly: true },
    ],
    must: [
      { id: 'child-receipt', guard: 'verify-receipt', subject: 'child-built', reason: 'a worker claim of passing tests is not a receipt' },
      { id: 'integration-receipt', guard: 'verify-receipt', subject: 'integrated', reason: 'tests on a child prove nothing about the integrated tree' },
      { id: 'consent-before-publish', guard: 'human-consent', subject: 'approved', reason: 'approving tree A is not approving tree B' },
      { id: 'no-overlap', guard: 'write-scope-isolation', reason: 'two writers never share a path' },
    ],
    frameDefaults: { dispatches: 8, mutatingDispatches: 4, fallbackPerSeat: 2, deviationsBeforeAsk: 2, rigorFloor: 'standard' },
    closure: ['integrated'],
    steps: [{ id: 'lifecycle' }],
    ...extra,
  });
}

/** Open a case on a fresh ledger: the run, then `case.opened` appended under its `advance`. */
export function openCase({ workflow = conductorWorkflow(), frame = FRAME, repoRoot = makeFixtureDir('fgos-case-'), requestDigest = 'sha256:request' } = {}) {
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow });
  const run = { repoRoot, caseId: workflowRunId };
  withHold(run, (hold) => append(run, hold, 'case.opened', { caseId: workflowRunId, kind: workflow.guide.kind, guide: { id: workflow.guide.id, sha256: 'sha256:guide' }, frame, requestDigest }));
  return run;
}

export function append(run, hold, type, payload = {}) {
  return appendWorkflowEvent({ repoRoot: run.repoRoot, workflowRunId: run.caseId, event: { type, payload }, hold });
}

/** Append several events under one hold. */
export function appendAll(run, events) {
  return withHold(run, (hold) => events.map(({ type, payload }) => append(run, hold, type, payload)));
}

export function withHold(run, action) {
  const hold = acquireAdvanceLock(run.repoRoot, run.caseId);
  try {
    return action(hold);
  } finally {
    hold.release();
  }
}

export const eventsOf = (run) => readWorkflowEvents({ repoRoot: run.repoRoot, workflowRunId: run.caseId });
export const projectionOf = (run, currentDigests) => projectCase(eventsOf(run), { currentDigests });

/** A settle that achieved one milestone with the receipts given. */
export function settle(reservationId, { outcome = 'pass', milestone, subjectDigest, receipts = [], activity, blind = false, unitRunId } = {}) {
  return {
    type: 'settle',
    payload: { reservationId, outcome, receipts, achieved: milestone ? [{ milestone, subjectDigest }] : [], seatLaunchesUsed: 1, activity, blind, ...(unitRunId ? { unitRunId } : {}) },
  };
}

export const verifyReceipt = (milestone, subjectDigest, overrides = {}) => ({
  kind: 'verify', evaluator: 'harness-verify', passed: true, milestone, subjectDigest, paths: ['src/a'], ...overrides,
});
