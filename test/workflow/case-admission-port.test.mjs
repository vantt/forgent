// test/workflow/case-admission-port.test.mjs — the Workflow's port: admit, settle and recheck under `advance`

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { acquireDocumentationCutoverLease } from '../../src/runner/documentation-cutover-lease.mjs';
import { prepareWorkflowRun } from '../../src/workflow/case-start.mjs';

import { createCaseAdmissionPort } from '../../src/workflow/case-admission-port.mjs';
import { assertCaseAdmissionPort, seatLaunchesOf } from '../../src/runner/execution/case-admission-port.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { readReservationFiles } from '../../src/workflow/case-runtime.mjs';
import { readBinding, listBindingRecords } from '../../src/workflow/case-bindings.mjs';
import { appendAll, FRAME, eventsOf, openCase, projectionOf, withHold } from '../helpers/workflow-case-fixture.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

ensureScriptAddon();

// This is the Workflow start boundary, not another copy of lease token cases.
test('workflow preparation refuses a non-holder before config or ledger creation and lets its holder start', () => {
  const repoRoot = makeFixtureDir('fgos-workflow-lease-');
  initFixtureRepo(repoRoot, { branch: 'main', ignore: '.fgos/\n' });
  const holder = path.join(repoRoot, 'holder');
  execFileSync('git', ['worktree', 'add', '-qb', 'holder', holder], { cwd: repoRoot, stdio: 'ignore' });
  acquireDocumentationCutoverLease({ repoRoot: holder });
  const params = {
    repoRoot, cwd: repoRoot,
    workflow: { id: 'lease-start', steps: [{ id: 'read', units: [{ id: 'read', template: { capability: 'docs:write', objective: 'Read', writes: [] } }] }] },
  };
  const before = fs.readdirSync(path.join(repoRoot, '.fgos')).sort();
  assert.throws(() => prepareWorkflowRun(params), { code: 'documentation-cutover-lease' });
  assert.throws(() => prepareWorkflowRun({ ...params, cwd: makeFixtureDir('fgos-workflow-outside-'), worktree: repoRoot }), { code: 'documentation-cutover-lease' });
  assert.deepEqual(fs.readdirSync(path.join(repoRoot, '.fgos')).sort(), before, 'no config, ledger or parent frame write');
  const allowed = prepareWorkflowRun({ ...params, worktree: holder });
  assert.ok(allowed.workflowRunId);
  assert.ok(fs.existsSync(allowed.runDir));
});

const planned = (options) => {
  const run = openCase(options);
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    { type: 'settle', payload: { reservationId: 'r-plan', outcome: 'pass', receipts: [], achieved: [{ milestone: 'plan-ready', subjectDigest: 'sha256:plan' }], seatLaunchesUsed: 1, activity: 'plan' } },
  ]);
  return run;
};
const proposal = (run, extra = {}) => ({
  unitRunId: 'unit-run-1',
  caseRef: { caseId: run.caseId, activity: 'scout' },
  activity: 'scout',
  writes: [],
  worktree: run.repoRoot,
  readOnly: true,
  pattern: 'solo',
  seatLaunches: 1,
  blind: false,
  handoffRefs: [],
  ...extra,
});
const types = (run) => eventsOf(run).map((e) => e.type);

test('the port is complete: every operation the core asks is there', () => {
  const run = openCase();
  assert.doesNotThrow(() => assertCaseAdmissionPort(createCaseAdmissionPort({ repoRoot: run.repoRoot })));
  assert.throws(() => assertCaseAdmissionPort({ admit() {} }), { code: 'case-admission-port-missing' });
});

test('admit records route and reservation under advance, writes the reservation file, and lets go of advance', () => {
  const run = openCase();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  const answer = port.admit(proposal(run));
  assert.equal(answer.admitted, true, JSON.stringify(answer));
  assert.deepEqual(types(run).slice(-2), ['route', 'reservation']);
  assert.equal(readReservationFiles(run.repoRoot, run.caseId).length, 1);
  assert.equal(projectionOf(run).liveReservations[0].unitRunId, 'unit-run-1');
  // The lock was taken for the section only.
  const hold = acquireAdvanceLock(run.repoRoot, run.caseId);
  hold.release();
});

test('two writers with overlapping writes: the second is refused at reservation, a disjoint one is admitted', () => {
  const run = planned();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  const wtA = makeFixtureDir('fgos-port-wt-a-');
  const wtB = makeFixtureDir('fgos-port-wt-b-');
  const wtC = makeFixtureDir('fgos-port-wt-c-');
  const write = (activity, writes, worktree, id) => port.admit(proposal(run, { activity, caseRef: { caseId: run.caseId, activity }, writes, worktree, readOnly: false, unitRunId: id }));
  assert.equal(write('build-a', ['src/a/**'], wtA, 'u1').admitted, true);
  const second = write('build-b', ['src/a/deep.mjs'], wtB, 'u2');
  assert.equal(second.refused.code, 'writes-overlap');
  assert.equal(readBinding({ mainRoot: run.repoRoot, worktree: wtB, caseId: run.caseId }).answer, 'unbound', 'a refusal binds nothing');
  assert.equal(write('build-b', ['src/b/**'], wtC, 'u3').admitted, true);
  assert.equal(projectionOf(run).liveReservations.length, 2);
  assert.equal(readBinding({ mainRoot: run.repoRoot, worktree: wtA, caseId: run.caseId }).answer, 'bound');
});

test('the ceiling handed to a Unit is its planned seat launches times the frame\'s fallback allowance', () => {
  const run = planned({ frame: { ...FRAME, seatLaunchesPerDispatch: 4 } });
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  // council-lite is a panel of three plus a synthesizer: four seats, whatever the fallback does.
  const seats = seatLaunchesOf({ pattern: 'panel', unit: { id: 'u', writes: [], seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'c', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }] }, runnerConfig: {} });
  assert.equal(seats, 4);
  const answer = port.admit(proposal(run, { seatLaunches: seats, pattern: 'panel' }));
  assert.equal(answer.seatLaunchCeiling, 8, 'four seats, two launches each at most');
  assert.equal(projectionOf(run).liveReservations[0].seatLaunchCeiling, 8);
  const tooMany = port.admit(proposal(run, { unitRunId: 'u2', seatLaunches: 5, pattern: 'panel' }));
  assert.equal(tooMany.refused.code, 'seat-launch-ceiling-exceeded');
});

test('a case that is held answers case-admission-busy; the same port with the holder\'s hold never refuses itself', () => {
  const run = openCase();
  const free = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  withHold(run, (hold) => {
    assert.equal(free.admit(proposal(run)).refused.code, 'case-admission-busy');
    const own = createCaseAdmissionPort({ repoRoot: run.repoRoot, caseId: run.caseId, heldAdvance: hold });
    const answer = own.admit(proposal(run, { unitRunId: 'u-own' }));
    assert.equal(answer.admitted, true, JSON.stringify(answer));
    own.settle(answer.reservationId, { caseId: run.caseId, outcome: 'pass', unitRunId: 'u-own', results: [], seatLaunchesUsed: 1 });
  });
  assert.equal(types(run).filter((t) => t === 'settle').length, 1 + 0, 'settled with the same hold');
  assert.equal(projectionOf(run).liveReservations.length, 0);
});

test('a Unit that names a case that does not exist, or another case than the proposer\'s, is refused by name', () => {
  const run = openCase();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  assert.equal(port.admit(proposal(run, { caseRef: { caseId: 'wf-missing', activity: 'scout' } })).refused.code, 'authority-context-invalid');
  const bound = createCaseAdmissionPort({ repoRoot: run.repoRoot, caseId: run.caseId });
  assert.equal(bound.admit(proposal(run, { caseRef: { caseId: 'wf-other', activity: 'scout' } })).refused.code, 'authority-context-conflict');
});

test('settle appends once, releases the binding it created and the reservation file; a repeat changes nothing', () => {
  const run = planned();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  const wt = makeFixtureDir('fgos-port-settle-');
  const admitted = port.admit(proposal(run, { activity: 'build-a', caseRef: { caseId: run.caseId, activity: 'build-a' }, writes: ['src/a'], worktree: wt, readOnly: false }));
  assert.equal(admitted.admitted, true);
  const result = { caseId: run.caseId, outcome: 'pass', unitRunId: 'unit-run-1', results: [{ role: 'verify', outcome: 'pass' }], seatLaunchesUsed: 3, frameExhausted: true };
  port.settle(admitted.reservationId, result);
  port.settle(admitted.reservationId, result);
  const settles = eventsOf(run).filter((e) => e.type === 'settle' && e.payload.reservationId === admitted.reservationId);
  assert.equal(settles.length, 1);
  assert.deepEqual({ outcome: settles[0].payload.outcome, used: settles[0].payload.seatLaunchesUsed, exhausted: settles[0].payload.frameExhausted, receipts: settles[0].payload.receipts.map((r) => r.kind) }, { outcome: 'pass', used: 3, exhausted: true, receipts: ['verify'] });
  assert.equal(readBinding({ mainRoot: run.repoRoot, worktree: wt, caseId: run.caseId }).answer, 'unbound');
  assert.deepEqual(readReservationFiles(run.repoRoot, run.caseId), []);
  assert.equal(projectionOf(run).frameExhausted, true, 'frame-exhausted is recorded once, on settle');
  assert.equal(listBindingRecords(run.repoRoot).length, 0);
});

test('a settle that finds advance held leaves a settle-pending file the next holder folds in first', () => {
  const run = openCase();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  const admitted = port.admit(proposal(run));
  const linesBefore = eventsOf(run).length;
  withHold(run, () => {
    port.settle(admitted.reservationId, { caseId: run.caseId, outcome: 'pass', unitRunId: 'unit-run-1', results: [], seatLaunchesUsed: 1 });
    assert.equal(eventsOf(run).length, linesBefore, 'nothing is written while someone else holds advance');
  });
  assert.equal(fs.readdirSync(path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId, 'settle-pending')).length, 1);
  assert.equal(projectionOf(run).liveReservations.length, 1, 'still reserved until the next holder folds the settle in');
  acquireAdvanceLock(run.repoRoot, run.caseId).release();
  assert.equal(projectionOf(run).liveReservations.length, 0);
  assert.equal(eventsOf(run).filter((e) => e.type === 'settle' && e.payload.reservationId === admitted.reservationId).length, 1);
});

test('a Unit asked again under the same unit id keeps its live reservation instead of taking a second one', () => {
  const run = openCase();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  const ask = (id) => port.admit(proposal(run, { unitRunId: id, caseRef: { caseId: run.caseId, activity: 'scout', unitId: 'unit-a' } }));
  const first = ask('unit-run-1');
  const again = ask('unit-run-2');
  assert.equal(again.reservationId, first.reservationId);
  assert.equal(projectionOf(run).liveReservations.length, 1);
  assert.equal(projectionOf(run).frameRemaining.dispatches, FRAME.dispatches - 1);
});

test('recheckEffect refuses a reservation that is not live', () => {
  const run = openCase();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  assert.equal(port.recheckEffect('rsv-nope', { caseId: run.caseId, paths: [] }).refused.code, 'reservation-not-live');
  const admitted = port.admit(proposal(run));
  assert.deepEqual(port.recheckEffect(admitted.reservationId, { caseId: run.caseId, paths: [] }), { ok: true });
});

test('the port resolves a binding for a standalone caller: unbound, or whose it is', () => {
  const run = openCase();
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot });
  const wt = makeFixtureDir('fgos-port-binding-');
  assert.equal(port.resolveBinding({ worktree: wt }).answer, 'unbound');
  assert.equal(port.resolveBinding({ worktree: path.join(wt, 'gone') }).answer, 'worktree-missing');
});
