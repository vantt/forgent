// test/workflow/case-admission.test.mjs — may this proposed activity run now? The predicate, the frame and the nested charge

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateWorkflow } from '../../src/workflow/index.mjs';
import { admitProposal, newReservationId, recheckReservation } from '../../src/workflow/case-admission.mjs';
import { reserveParentFrame, refundParentFrame } from '../../src/workflow/case-frame.mjs';
import { appendAll, FRAME, openCase, projectionOf, settle, verifyReceipt, withHold, eventsOf } from '../helpers/workflow-case-fixture.mjs';

const UNBOUND = (worktree) => ({ [worktree]: { answer: 'unbound' } });

/** Admit a proposal against the ledger as it is now and, when allowed, record its events. */
function propose(run, proposal, { digests, bindings } = {}) {
  const projection = projectionOf(run, digests);
  const result = admitProposal({ projection, proposal, bindingAnswers: bindings ?? (proposal.worktree ? UNBOUND(proposal.worktree) : {}), reservationId: newReservationId() });
  if (result.reservation) appendAll(run, result.events);
  return result;
}
const codes = (result) => result.refused?.violations.map((v) => v.code);

/** A case whose plan is done, so the builders are eligible. */
function plannedCase(options) {
  const run = openCase(options);
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    settle('r-plan', { milestone: 'plan-ready', subjectDigest: 'sha256:plan', activity: 'plan' }),
  ]);
  return run;
}

/** A case whose children are built and integrated, each with its own verify receipt. */
function deliveredCase() {
  const run = plannedCase();
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-build', activity: 'build-a', writes: [], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-build', { milestone: 'child-built', subjectDigest: 'sha256:child', receipts: [verifyReceipt('child-built', 'sha256:child')], activity: 'build-a' }),
    { type: 'reservation', payload: { reservationId: 'r-int', activity: 'integrate', writes: [], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-int', { milestone: 'integrated', subjectDigest: 'sha256:tree', receipts: [verifyReceipt('integrated', 'sha256:tree')], activity: 'integrate' }),
  ]);
  return run;
}

test('two reservations with overlapping writes: the second is refused at reservation, a disjoint one is admitted', () => {
  const run = plannedCase();
  const first = propose(run, { activity: 'build-a', writes: ['src/a/**'], worktree: '/wt/a' });
  assert.ok(first.reservation, JSON.stringify(first));
  assert.deepEqual(first.bindings, [{ worktree: '/wt/a', action: 'create' }]);

  const overlap = propose(run, { activity: 'build-b', writes: ['src/a/deep/file.mjs'], worktree: '/wt/b' });
  assert.deepEqual(codes(overlap), ['writes-overlap']);
  assert.match(overlap.refused.condition, new RegExp(first.reservation.reservationId));
  assert.equal(projectionOf(run).liveReservations.length, 1, 'a refusal reserves nothing');

  const disjoint = propose(run, { activity: 'build-b', writes: ['src/b/**'], worktree: '/wt/b' });
  assert.ok(disjoint.reservation);
});

test('a refusal names every hard rule the proposal breaks, so two conflicting rules are both named', () => {
  const run = plannedCase({ frame: { ...FRAME, mutatingDispatches: 1 } });
  assert.ok(propose(run, { activity: 'build-a', writes: ['src/a'], worktree: '/wt/a' }).reservation);
  const refused = propose(run, { activity: 'build-b', writes: ['src/a'], worktree: '/wt/b' });
  assert.deepEqual(codes(refused).sort(), ['frame-exhausted', 'writes-overlap']);
  assert.deepEqual(refused.refused.violations.map((v) => v.rule).sort(), ['frame-allowance', 'write-scope-isolation']);
  assert.ok(refused.refused.code && refused.refused.condition, 'the first of them is the headline');
});

test('an approval a worker wrote never satisfies human-consent: only a gate answer carrying a digest does', () => {
  const run = deliveredCase();
  appendAll(run, [
    // The "approval" below is a milestone reached by an activity's own settle, as a worker's "approved.md" would be.
    { type: 'reservation', payload: { reservationId: 'r-fake', activity: 'approve-gate', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    settle('r-fake', { milestone: 'approved', subjectDigest: 'sha256:tree', activity: 'approve-gate' }),
  ]);
  const publish = { activity: 'publish', writes: ['content/out'], worktree: '/wt/p' };
  const forged = propose(run, publish, { digests: { approved: 'sha256:tree', integrated: 'sha256:tree' } });
  assert.deepEqual(codes(forged), ['consent-missing']);
});

test('an approved artifact that changed after approval is stale and the effect is refused; unknown now refuses too', () => {
  const run = deliveredCase();
  appendAll(run, [
    { type: 'gate.answer', payload: { stepId: 'approve-gate', answer: 'ship it', approved: true, subjectDigest: 'sha256:tree-A', answeredAt: '2026-10-19T00:00:00.000Z' } },
  ]);
  const publish = { activity: 'publish', writes: ['content/out'], worktree: '/wt/p' };
  const same = admitProposal({ projection: projectionOf(run, { approved: 'sha256:tree-A', integrated: 'sha256:tree' }), proposal: publish, bindingAnswers: UNBOUND('/wt/p'), reservationId: 'r-ok' });
  assert.ok(same.reservation, JSON.stringify(same));

  const changed = propose(run, publish, { digests: { approved: 'sha256:tree-B', integrated: 'sha256:tree' } });
  assert.ok(codes(changed).includes('consent-stale'), codes(changed).join());
  assert.match(changed.refused.violations.find((v) => v.code === 'consent-stale').condition, /needs a new approval/);

  const unknown = propose(run, publish, { digests: { approved: null, integrated: 'sha256:tree' } });
  assert.ok(codes(unknown).includes('consent-subject-unknown'));
});

test('a verify receipt on a child tree does not satisfy the integration milestone', () => {
  const run = plannedCase();
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-build', activity: 'build-a', writes: [], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-build', { milestone: 'child-built', subjectDigest: 'sha256:child', receipts: [verifyReceipt('child-built', 'sha256:child')], activity: 'build-a' }),
    { type: 'reservation', payload: { reservationId: 'r-int', activity: 'integrate', writes: [], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-int', { milestone: 'integrated', subjectDigest: 'sha256:merged', receipts: [verifyReceipt('child-built', 'sha256:child')], activity: 'integrate' }),
  ]);
  const refused = propose(run, { activity: 'approve-gate' });
  assert.deepEqual(codes(refused), ['entry-milestone-unmet'], 'integrated needs a receipt of its own tree');
  assert.match(refused.refused.condition, /integrated/);
});

test('frame counters: an exhausted frame refuses, and an unknown remainder refuses the next writing dispatch only', () => {
  const small = plannedCase({ frame: { ...FRAME, dispatches: 2, mutatingDispatches: 5 } });
  assert.ok(propose(small, { activity: 'scout' }).reservation, 'the plan took one of two');
  assert.deepEqual(codes(propose(small, { activity: 'explore', reason: 'why not' })), ['frame-exhausted']);

  const unknown = plannedCase({ frame: { ...FRAME, mutatingDispatches: 'set-at-approval' } });
  assert.deepEqual(codes(propose(unknown, { activity: 'build-a', writes: ['src/a'], worktree: '/wt/a' })), ['frame-remaining-unknown']);
  assert.ok(propose(unknown, { activity: 'scout' }).reservation, 'a read-only dispatch is not held up by an unknown writing count');
});

test('the planned seat launches are checked against the frame, the ceiling follows, and unknown launches refuse a writing dispatch', () => {
  const run = plannedCase({ frame: { ...FRAME, seatLaunchesPerDispatch: 6 } });
  assert.deepEqual(codes(propose(run, { activity: 'build-a', writes: ['src/a'], worktree: '/wt/a', seatLaunches: 9 })), ['seat-launch-ceiling-exceeded']);
  assert.deepEqual(codes(propose(run, { activity: 'build-a', writes: ['src/a'], worktree: '/wt/a' })), ['frame-remaining-unknown']);
  const ok = propose(run, { activity: 'build-a', writes: ['src/a'], worktree: '/wt/a', seatLaunches: 3 });
  assert.equal(ok.reservation.seatLaunchCeiling, 6, 'three planned launches times a fallback allowance of two');
});

test('rigor below the frame floor is refused', () => {
  const run = plannedCase();
  assert.deepEqual(codes(propose(run, { activity: 'scout', rigor: 'low' })), ['rigor-below-floor']);
  assert.ok(propose(run, { activity: 'scout', rigor: 'high' }).reservation);
});

test('an unlisted route is proposed and recorded with its reason; one violating a MUST is refused; a listed-routes-only point refuses it', () => {
  const run = plannedCase();
  assert.ok(propose(run, { activity: 'build-a', writes: ['src/a/**'], worktree: '/wt/a' }).reservation);

  const noReason = propose(run, { activity: 'explore' });
  assert.deepEqual(codes(noReason), ['route-reason-required']);

  const listedRoute = propose(run, { activity: 'scout' });
  assert.equal(listedRoute.events[0].payload.routeKind, 'may-instead');

  const unlisted = propose(run, { activity: 'explore', reason: 'the plan left a question open' });
  assert.equal(unlisted.events[0].payload.routeKind, 'unlisted');
  assert.equal(unlisted.events[0].payload.reason, 'the plan left a question open');
  const route = eventsOf(run).filter((e) => e.type === 'route').at(-1);
  assert.equal(route.payload.routeKind, 'unlisted', 'the deviation is on the ledger');
  assert.equal(projectionOf(run).deviations, 1);

  // MUST still applies to an unlisted route: its writes overlap a live reservation.
  const violating = propose(run, { activity: 'rogue-write', reason: 'quick fix', writes: ['src/a/z'], worktree: '/wt/z' });
  assert.deepEqual(codes(violating), ['writes-overlap']);
  assert.ok(propose(run, { activity: 'rogue-write', reason: 'quick fix', writes: ['docs/z'], worktree: '/wt/z' }).reservation, 'the same route with disjoint writes is allowed');

  // A point that lists routes only refuses the way outside the list, reason or not.
  const strict = propose(run, { activity: 'late-rogue', reason: 'because' });
  assert.equal(codes(strict)[0], 'unlisted-route-refused');
});

test('deviations stop at the frame limit: the next one waits for the owner', () => {
  const run = plannedCase({ frame: { ...FRAME, deviationsBeforeAsk: 1 } });
  assert.ok(propose(run, { activity: 'explore', reason: 'first' }).reservation);
  assert.deepEqual(codes(propose(run, { activity: 'rogue-write', reason: 'second', writes: ['x'], worktree: '/wt/x' })), ['deviation-limit-reached']);
});

test('independence: seats that produce the milestone must be encapsulated, and a later dispatch of them is not handed blind outputs', () => {
  const workflow = validateWorkflow({
    id: 'blind-fixture',
    kind: 'guide',
    milestones: [{ id: 'request-received' }, { id: 'positions' }, { id: 'verdict' }],
    activities: [
      { id: 'panel', entry: ['request-received'], produces: ['positions'], effects: 'none' },
      { id: 'synth', entry: ['positions'], produces: ['verdict'], effects: 'none' },
    ],
    must: [{ id: 'independent', guard: 'independence-blind', subject: 'positions', reason: 'a lens that read another is no longer independent' }],
    frameDefaults: { dispatches: 5, mutatingDispatches: 0, fallbackPerSeat: 2, deviationsBeforeAsk: 0, rigorFloor: 'standard' },
    steps: [{ id: 'lifecycle' }],
  });
  const run = openCase({ workflow, frame: { dispatches: 5, mutatingDispatches: 0, fallbackPerSeat: 2, deviationsBeforeAsk: 0, rigorFloor: 'standard' } });
  assert.deepEqual(codes(propose(run, { activity: 'panel', blind: false })), ['independence-not-encapsulated']);
  const first = propose(run, { activity: 'panel', blind: true });
  assert.ok(first.reservation);
  // The settle names the blind unit run.
  appendAll(run, [settle(first.reservation.reservationId, { milestone: 'positions', subjectDigest: 'sha256:pos', activity: 'panel', blind: true, unitRunId: 'ur-1' })]);

  const reread = propose(run, { activity: 'panel', blind: true, handoffRefs: ['unit-run:ur-1/panelist-1'] });
  assert.deepEqual(codes(reread), ['independence-blind-handoff']);
  const synth = propose(run, { activity: 'synth', handoffRefs: ['unit-run:ur-1/panelist-1', 'unit-run:ur-1/panelist-2'] });
  assert.ok(synth.reservation, 'a consumer of the blind outputs is the point of them');
});

test('binding answers: unbound asks for a binding, bound is used, anything else refuses by its own name', () => {
  const run = plannedCase();
  const write = { activity: 'build-a', writes: ['src/a'], worktree: '/wt/a' };
  const asked = (answer, extra = {}) => admitProposal({ projection: projectionOf(run), proposal: write, bindingAnswers: { '/wt/a': { answer, ...extra } }, reservationId: 'r-b' });
  assert.deepEqual(asked('unbound').bindings, [{ worktree: '/wt/a', action: 'create' }]);
  assert.deepEqual(asked('bound').bindings, [{ worktree: '/wt/a', action: 'have' }]);
  for (const answer of ['worktree-already-bound', 'binding-unsettled', 'binding-view-unavailable']) {
    assert.deepEqual(codes(asked(answer, { record: { caseId: 'other' } })), [answer]);
  }
  assert.deepEqual(codes(admitProposal({ projection: projectionOf(run), proposal: write, bindingAnswers: {}, reservationId: 'r-c' })), ['binding-unresolved']);
  assert.deepEqual(codes(admitProposal({ projection: projectionOf(run), proposal: { ...write, worktree: undefined }, bindingAnswers: {}, reservationId: 'r-d' })), ['writes-need-worktree']);
  assert.deepEqual(codes(propose(run, { activity: 'scout', writes: ['x'], worktree: '/wt/s' })), ['activity-has-no-write-effect']);
});

test('a closed case admits nothing and an unknown activity is named', () => {
  const run = openCase();
  assert.deepEqual(codes(propose(run, { activity: 'nope' })), ['unknown-activity']);
  appendAll(run, [{ type: 'case.closed', payload: { closedAt: '2026-10-19T00:00:00.000Z' } }]);
  assert.deepEqual(codes(propose(run, { activity: 'plan' })), ['case-closed']);
});

test('a nested case charges the parent frame in its own section, refunds it idempotently, and is refused when the frame is short', () => {
  const run = openCase({ frame: { ...FRAME, dispatches: 3, mutatingDispatches: 1 } });
  const reserve = (id, counters) => withHold(run, (hold) => reserveParentFrame({ mainRoot: run.repoRoot, parentCaseId: run.caseId, hold, reservationId: id, childRef: 'child-1', counters }));
  const refund = (id) => withHold(run, (hold) => refundParentFrame({ mainRoot: run.repoRoot, parentCaseId: run.caseId, hold, reservationId: id }));

  assert.deepEqual(reserve('n1', { dispatches: 2, mutatingDispatches: 1 }), { reserved: true, reservationId: 'n1' });
  assert.equal(projectionOf(run).frameRemaining.dispatches, 1);
  assert.equal(reserve('n1', { dispatches: 2, mutatingDispatches: 1 }).already, true, 'the same charge twice is one charge');
  assert.equal(projectionOf(run).frameRemaining.dispatches, 1);
  assert.equal(reserve('n2', { dispatches: 2 }).refused.code, 'frame-exhausted');

  assert.deepEqual(refund('n1'), { refunded: true });
  assert.deepEqual(refund('n1'), { refunded: false, already: true });
  assert.equal(projectionOf(run).frameRemaining.dispatches, 3, 'the child could not open: the parent has its frame back');
  assert.equal(projectionOf(run).frameRemaining.mutatingDispatches, 1);
  assert.equal(projectionOf(run).liveReservations.length, 0);
});

test('a live reservation is rechecked against the subjects as they are now: a changed approval refuses, frame and overlap do not', () => {
  const run = deliveredCase();
  appendAll(run, [
    { type: 'gate.answer', payload: { stepId: 'approve-gate', answer: 'ship it', approved: true, subjectDigest: 'sha256:tree-A', answeredAt: '2026-10-19T00:00:00.000Z' } },
  ]);
  const same = { approved: 'sha256:tree-A', integrated: 'sha256:tree' };
  const admitted = propose(run, { activity: 'publish', writes: ['content/out'], worktree: '/wt/p' }, { digests: same });
  assert.ok(admitted.reservation, JSON.stringify(admitted));
  const live = (digests) => {
    const projection = projectionOf(run, digests);
    return { projection, reservation: projection.liveReservations.find((r) => r.reservationId === admitted.reservation.reservationId) };
  };

  assert.equal(recheckReservation(live(same)), null, 'what was approved is what is there, and the reservation does not collide with itself');
  assert.ok(recheckReservation(live({ ...same, approved: 'sha256:tree-B' })).map((v) => v.code).includes('consent-stale'));
  assert.ok(recheckReservation(live({ ...same, approved: null })).map((v) => v.code).includes('consent-subject-unknown'));
});
