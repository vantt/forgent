// test/workflow/case-projection.test.mjs — the pure fold from ledger events to milestones, reservations, frame and routes

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateWorkflow, createWorkflowRun, readWorkflowEvents } from '../../src/workflow/index.mjs';
import { projectCase } from '../../src/workflow/case-projection.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { appendAll, conductorWorkflow, eventsOf, openCase, projectionOf, settle, verifyReceipt, withHold, append } from '../helpers/workflow-case-fixture.mjs';

const reserve = (reservationId, activity, extra = {}) => ({
  type: 'reservation',
  payload: { reservationId, activity, writes: [], worktree: null, counters: { dispatches: 1, mutatingDispatches: 0 }, seatLaunchCeiling: null, ...extra },
});

test('projecting the same events twice, and a replay of them, gives the same answer', () => {
  const run = openCase();
  appendAll(run, [reserve('r1', 'plan'), settle('r1', { milestone: 'plan-ready', subjectDigest: 'sha256:plan', activity: 'plan' })]);
  const events = eventsOf(run);
  const once = JSON.stringify(projectCase(events, { currentDigests: { 'plan-ready': 'sha256:plan' } }), (k, v) => (v instanceof Map ? [...v] : v));
  const twice = JSON.stringify(projectCase(structuredClone(events), { currentDigests: { 'plan-ready': 'sha256:plan' } }), (k, v) => (v instanceof Map ? [...v] : v));
  assert.equal(once, twice);
  assert.equal(projectCase(events).milestones['plan-ready'].state, 'achieved');
});

test('a stored playbook run with no case events folds as a playbook case and keeps its steps readable', () => {
  const repoRoot = makeFixtureDir('fgos-legacy-');
  const workflow = validateWorkflow({ id: 'legacy-playbook', steps: [{ id: 'a' }, { id: 'b', dependsOn: ['a'] }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow });
  const hold = acquireAdvanceLock(repoRoot, workflowRunId);
  const record = (type, payload) => append({ repoRoot, caseId: workflowRunId }, hold, type, payload);
  record('step.start', { stepId: 'a' });
  record('step.complete', { stepId: 'a', outcome: 'pass' });
  hold.release();

  const projection = projectCase(readWorkflowEvents({ repoRoot, workflowRunId }));
  assert.equal(projection.kind, 'playbook');
  assert.equal(projection.open, true);
  assert.equal(projection.milestones['a.settled'].state, 'achieved');
  assert.equal(projection.milestones['b.settled'].state, 'unreached');
  assert.deepEqual(projection.eligible, ['a', 'b'], 'a is eligible again (an activity may repeat); b needs a.settled, which holds');
  assert.equal(projection.reservations.length, 0);
});

test('a milestone reached for one digest is stale when its subject has another now, and unknown now fails closed for that milestone only', () => {
  const run = openCase();
  appendAll(run, [
    reserve('r1', 'plan'),
    settle('r1', { milestone: 'plan-ready', subjectDigest: 'sha256:plan-v1', activity: 'plan' }),
    reserve('r2', 'scout'),
    settle('r2', { outcome: 'findings', milestone: 'findings-report', subjectDigest: 'sha256:found', activity: 'scout' }),
  ]);
  assert.equal(projectionOf(run).milestones['plan-ready'].state, 'achieved', 'no current digest passed: not rechecked');
  assert.equal(projectionOf(run, { 'plan-ready': 'sha256:plan-v1' }).milestones['plan-ready'].state, 'achieved');

  const changed = projectionOf(run, { 'plan-ready': 'sha256:plan-v2' });
  assert.deepEqual(
    { state: changed.milestones['plan-ready'].state, prior: changed.milestones['plan-ready'].prior, current: changed.milestones['plan-ready'].current },
    { state: 'stale', prior: 'sha256:plan-v1', current: 'sha256:plan-v2' },
  );
  assert.deepEqual(changed.eligible.filter((id) => id.startsWith('build')), [], 'stale plan-ready no longer makes the builders eligible');

  const unknown = projectionOf(run, { 'plan-ready': null });
  assert.equal(unknown.milestones['plan-ready'].state, 'stale');
  assert.equal(unknown.milestones['plan-ready'].reason, 'current-digest-unknown');
  assert.equal(unknown.milestones['findings-report'].state, 'achieved', 'only that milestone fails closed');
});

test('findings is an outcome: a diagnostic milestone accepts it, a delivery milestone needs pass and a current verify receipt', () => {
  const run = openCase();
  appendAll(run, [
    reserve('r1', 'scout'),
    settle('r1', { outcome: 'findings', milestone: 'findings-report', subjectDigest: 'sha256:f', activity: 'scout' }),
    reserve('r2', 'build-a'),
    settle('r2', { outcome: 'findings', milestone: 'child-built', subjectDigest: 'sha256:c', receipts: [verifyReceipt('child-built', 'sha256:c')], activity: 'build-a' }),
    reserve('r3', 'build-b'),
    settle('r3', { outcome: 'pass', milestone: 'child-built', subjectDigest: 'sha256:c', receipts: [], activity: 'build-b' }),
  ]);
  const p = projectionOf(run);
  assert.equal(p.milestones['findings-report'].state, 'achieved', 'findings reaches a diagnostic milestone');
  assert.equal(p.milestones['child-built'].state, 'unreached', 'findings, or pass without a receipt, does not deliver');
  assert.deepEqual(p.refusedAchievements.map((r) => r.reason), ['outcome-findings', 'receipt-missing']);
  assert.equal(p.open, true, 'findings never closes or fails the case by itself');
});

test('only a named evaluator writes a receipt: worker prose, a self-reported sha, and a receipt for another subject do not count', () => {
  const cases = [
    ['worker prose', verifyReceipt('child-built', 'sha256:c', { evaluator: 'worker' })],
    ['a self-reported verified sha', { kind: 'verify', evaluator: 'worker-claim', passed: true, milestone: 'child-built', subjectDigest: 'sha256:c', verifiedSha: 'abc' }],
    ['another milestone', verifyReceipt('integrated', 'sha256:c')],
    ['another digest', verifyReceipt('child-built', 'sha256:other')],
    ['a failed verify', verifyReceipt('child-built', 'sha256:c', { passed: false })],
  ];
  for (const [label, receipt] of cases) {
    const run = openCase();
    appendAll(run, [reserve('r1', 'build-a'), settle('r1', { milestone: 'child-built', subjectDigest: 'sha256:c', receipts: [receipt], activity: 'build-a' })]);
    assert.equal(projectionOf(run).milestones['child-built'].state, 'unreached', label);
  }
  const run = openCase();
  appendAll(run, [reserve('r1', 'build-a'), settle('r1', { milestone: 'child-built', subjectDigest: 'sha256:c', receipts: [verifyReceipt('child-built', 'sha256:c')], activity: 'build-a' })]);
  assert.equal(projectionOf(run).milestones['child-built'].state, 'achieved');
});

test('frame counters: reservations count, a refunded one does not, and a count left to the approver is unknown', () => {
  const run = openCase({ frame: { dispatches: 3, mutatingDispatches: 'set-at-approval', fallbackPerSeat: 2, deviationsBeforeAsk: 1, rigorFloor: 'standard' } });
  appendAll(run, [
    reserve('r1', 'plan'),
    reserve('r2', 'scout'),
    { type: 'settle', payload: { reservationId: 'r2', outcome: 'refunded', receipts: [], achieved: [], seatLaunchesUsed: 0 } },
    reserve('r3', 'build-a', { counters: { dispatches: 1, mutatingDispatches: 1 } }),
    { type: 'route', payload: { activity: 'explore', routeKind: 'unlisted', reason: 'curious' } },
  ]);
  const p = projectionOf(run);
  assert.deepEqual(p.frameUsed, { dispatches: 2, mutatingDispatches: 1 });
  assert.equal(p.frameRemaining.dispatches, 1);
  assert.equal(p.frameRemaining.mutatingDispatches, null, 'set-at-approval and never set: the remainder is unknown');
  assert.equal(p.frameRemaining.deviationsBeforeAsk, 0);
  assert.deepEqual(p.liveReservations.map((r) => r.reservationId), ['r1', 'r3'], 'a reservation lives until its settle');
});

test('the projection lists routes per decision point and always shows the unlisted path', () => {
  const run = openCase();
  appendAll(run, [reserve('r1', 'plan'), settle('r1', { milestone: 'plan-ready', subjectDigest: 'sha256:p', activity: 'plan' })]);
  const p = projectionOf(run);
  const atRequest = p.routePoints.find((d) => d.at === 'request-received');
  const atPlan = p.routePoints.find((d) => d.at === 'plan-ready');
  assert.deepEqual([atRequest.should, atRequest.mayInstead, atRequest.open, atRequest.listedRoutesOnly], [['plan'], ['scout'], true, false]);
  assert.deepEqual([atPlan.should, atPlan.open, atPlan.listedRoutesOnly], [['build-a', 'build-b'], true, true]);
  assert.deepEqual(p.unlistedPath, { proposable: true, requires: 'reason', refusedAt: ['plan-ready'] });
  assert.ok(p.eligible.includes('build-a') && p.eligible.includes('late-rogue'), 'eligible is not filtered by the list');
});

test('an open consent gate blocks the milestone it produces and keeps the case from closing; a stale closure milestone does too', () => {
  const repoRoot = makeFixtureDir('fgos-gate-');
  const workflow = validateWorkflow({ id: 'gated', steps: [{ id: 'a' }, { id: 'ok', dependsOn: ['a'], gate: { kind: 'human', question: 'Approve?' } }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow });
  const run = { repoRoot, caseId: workflowRunId };
  withHold(run, (hold) => {
    append(run, hold, 'step.complete', { stepId: 'a', outcome: 'pass' });
    append(run, hold, 'gate.park', { stepId: 'ok', question: 'Approve?' });
  });
  let p = projectCase(eventsOf(run));
  assert.equal(p.milestones['ok.settled'].state, 'blocked');
  assert.equal(p.milestones['ok.settled'].question, 'Approve?');
  assert.deepEqual(p.openGates.map((g) => g.stepId), ['ok']);
  assert.deepEqual(p.closable, { ok: false, reasons: ['consent-gate-parked:ok'] });

  withHold(run, (hold) => append(run, hold, 'gate.answer', { stepId: 'ok', answer: 'yes', approved: true, subjectDigest: 'sha256:copy' }));
  p = projectCase(eventsOf(run));
  assert.equal(p.milestones['ok.settled'].state, 'achieved');
  assert.equal(p.milestones['ok.settled'].consent, true);
  assert.equal(p.milestones['ok.settled'].digest, 'sha256:copy');
  assert.equal(p.closable.ok, true);

  const stale = projectCase(eventsOf(run), { currentDigests: { 'ok.settled': 'sha256:edited' } });
  assert.deepEqual(stale.closable, { ok: true, reasons: [] }, 'closure of this guide names no milestone');
  const conductor = openCase();
  appendAll(conductor, [reserve('r1', 'integrate'), settle('r1', { milestone: 'integrated', subjectDigest: 'sha256:t', receipts: [verifyReceipt('integrated', 'sha256:t')], activity: 'integrate' })]);
  assert.deepEqual(projectionOf(conductor, { integrated: 'sha256:t' }).closable, { ok: true, reasons: [] });
  assert.deepEqual(projectionOf(conductor, { integrated: 'sha256:t2' }).closable, { ok: false, reasons: ['closure-milestone-stale:integrated'] });
});

test('the guide of a case is the snapshot on its start event, not the file as it is now', () => {
  const run = openCase({ workflow: conductorWorkflow({ purpose: 'first purpose' }) });
  assert.equal(projectionOf(run).guide.purpose, 'first purpose');
  assert.equal(projectionOf(run).guideRef.sha256, 'sha256:guide');
});
