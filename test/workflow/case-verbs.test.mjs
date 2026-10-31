// test/workflow/case-verbs.test.mjs — start, status, resume and close on both kinds of case

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  validateWorkflow,
  startWorkflow,
  startWorkflowDetached,
  resumeWorkflow,
  resumeWorkflowDetached,
  statusWorkflow,
  closeWorkflow,
  readWorkflowEvents,
} from '../../src/workflow/index.mjs';
import { acquireDispatchCwdLock } from '../../src/runner/dispatch/cwd-lock.mjs';
import { readBinding } from '../../src/workflow/case-bindings.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { appendAll, conductorWorkflow, settle, verifyReceipt } from '../helpers/workflow-case-fixture.mjs';
import { execFileSync } from 'node:child_process';

seedFileLocalBwrapRegistry();

function setupRepo() {
  const tmp = setupWorkflowFixtureRepo({
    prefix: 'fgos-verbs-',
    readme: '# Verbs',
    gitName: 'Verbs Test',
    capabilities: ['docs:write'],
    workerBody: `
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    `,
  });
  fs.appendFileSync(path.join(tmp, '.gitignore'), '.fgos/\n*.mjs\n');
  return tmp;
}

const opts = (tmp) => ({ repoRoot: tmp, cwd: tmp, worktree: tmp });
const eventsOf = (tmp, id) => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id });
const unit = (id, extra = {}) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective: 'Read', writes: [], ...extra } });

test('a guide with its own activities opens a conductor case: no process, a case id, the frame narrowed, its worktree bound', async () => {
  const tmp = setupRepo();
  const state = await startWorkflow({ workflow: conductorWorkflow(), frame: { dispatches: 4, rigorFloor: 'high' }, ...opts(tmp) });
  const id = state.caseId;
  assert.equal(id, state.workflowRunId);
  assert.equal(state.detached, undefined);
  assert.equal(state.case.kind, 'conductor');
  assert.deepEqual([state.case.frame.dispatches, state.case.frame.mutatingDispatches, state.case.frame.rigorFloor], [4, 4, 'high']);
  assert.equal(state.case.milestones['request-received'].state, 'achieved');
  assert.deepEqual(state.case.eligible.sort(), ['explore', 'plan', 'rogue-write', 'scout']);

  const events = eventsOf(tmp, id);
  assert.deepEqual(events.map((e) => e.type), ['workflow.start', 'case.opened', 'binding']);
  assert.equal(readBinding({ mainRoot: tmp, worktree: tmp, caseId: id }).answer, 'bound');
  assert.ok(!fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs', id, 'advance.log')), 'nothing was started to drive it');

  // A second case cannot bind the same worktree; it is closed with the reason and says so.
  await assert.rejects(startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) }), (err) => err.code === 'worktree-already-bound' && /held by case/.test(err.message));
  const other = fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).filter((n) => n.startsWith('wf-run-') && n !== id);
  assert.equal(other.length, 1);
  assert.equal(eventsOf(tmp, other[0]).at(-1).type, 'case.closed');

  // The detached door is the same: a case id back, no child.
  const sub = path.join(tmp, 'sub');
  fs.mkdirSync(sub);
  const detachedLike = startWorkflowDetached({ workflow: conductorWorkflow({ id: 'case-fixture-two' }), repoRoot: tmp, cwd: tmp, worktree: sub });
  assert.equal(detachedLike.detached, undefined);
});

test('a conductor case is running while an attempt of it lives, never stale, and never needs a resume', async () => {
  const tmp = setupRepo();
  const { caseId: id } = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  const run = { repoRoot: tmp, caseId: id };
  const idle = statusWorkflow(id, opts(tmp));
  assert.equal(idle.advance.running, false);

  appendAll(run, [{ type: 'reservation', payload: { reservationId: 'r1', activity: 'scout', writes: [], worktree: null, counters: { dispatches: 1, mutatingDispatches: 0 } } }]);
  // The last event is old: a playbook would call this stale; a conductor case with a live attempt is running.
  const file = path.join(tmp, '.fgos', 'workflow-runs', id, 'events.jsonl');
  const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.stringify({ ...JSON.parse(l), ts: old })).join('\n') + '\n');
  const live = statusWorkflow(id, opts(tmp));
  assert.equal(live.advance.running, true);
  assert.equal(live.advance.hint, undefined, 'no resume is suggested because advance is free');
  assert.equal(live.case.liveReservations.length, 1);

  // resume takes advance once and starts nothing.
  const resumed = await resumeWorkflow(id, opts(tmp));
  assert.equal(resumed.caseId, id);
  assert.equal(resumeWorkflowDetached(id, opts(tmp)).detached, undefined);
});

test('findings without delivery fail no case: a diagnostic milestone takes them, a delivery milestone does not', async () => {
  const tmp = setupRepo();
  const { caseId: id } = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  const run = { repoRoot: tmp, caseId: id };
  const reserve = (reservationId, activity) => ({ type: 'reservation', payload: { reservationId, activity, writes: [], worktree: null, counters: { dispatches: 1, mutatingDispatches: 0 } } });
  appendAll(run, [
    reserve('r1', 'scout'),
    settle('r1', { outcome: 'findings', milestone: 'findings-report', subjectDigest: 'sha256:f', activity: 'scout' }),
    reserve('r2', 'build-a'),
    settle('r2', { outcome: 'findings', milestone: 'child-built', subjectDigest: 'sha256:c', receipts: [verifyReceipt('child-built', 'sha256:c')], activity: 'build-a' }),
  ]);
  const status = statusWorkflow(id, opts(tmp));
  assert.equal(status.case.milestones['findings-report'].state, 'achieved');
  assert.equal(status.case.milestones['child-built'].state, 'unreached');
  assert.equal(status.status, 'running', 'no case is failed by a Unit that returned findings');
  assert.equal(status.case.open, true);
  assert.equal(status.case.frameRemaining.dispatches, 6);
});

test('close: refused while a consent gate is parked or a closure milestone went stale; allowed otherwise; keeps the binding of a live attempt', async () => {
  const tmp = setupRepo();

  // A playbook parked at a consent gate cannot close.
  const gated = await startWorkflow({
    workflow: validateWorkflow({ id: 'close-gated', steps: [{ id: 'a', units: [unit('ua')] }, { id: 'ok', dependsOn: ['a'], gate: { kind: 'human', question: 'Approve?' } }] }),
    ...opts(tmp),
  });
  assert.equal(gated.status, 'parked');
  assert.throws(() => closeWorkflow(gated.workflowRunId, { repoRoot: tmp }), (err) => err.code === 'close-refused' && /consent-gate-parked:ok/.test(err.message));

  // An open playbook whose closure milestone no longer matches its subject cannot close.
  const stalled = await startWorkflow({
    workflow: validateWorkflow({ id: 'close-stale', closure: ['a.settled'], steps: [{ id: 'a', units: [unit('ua')] }, { id: 'ok', dependsOn: ['a'], gate: { kind: 'human', question: 'Approve?' } }] }),
    ...opts(tmp),
  });
  assert.equal(stalled.status, 'parked');
  const [report] = resolveUnitInputs([`unit-run:${stalled.steps.a.units.ua.unitRunId}/producer`], tmp).refs;
  fs.appendFileSync(report, '\nchanged\n');
  const stale = statusWorkflow(stalled.workflowRunId, opts(tmp));
  assert.equal(stale.case.milestones['a.settled'].state, 'stale');
  assert.ok(stale.case.closable.reasons.includes('closure-milestone-stale:a.settled'));
  assert.throws(() => closeWorkflow(stalled.workflowRunId, { repoRoot: tmp }), (err) => /closure-milestone-stale:a\.settled/.test(err.message));

  // A Playbook case that ran to a pass has closed itself, so the verb finds it closed.
  const done = await startWorkflow({ workflow: validateWorkflow({ id: 'close-done', steps: [{ id: 'a', units: [unit('ua')] }] }), ...opts(tmp) });
  assert.equal(done.status, 'completed');
  assert.equal(eventsOf(tmp, done.workflowRunId).some((e) => e.type === 'case.closed' && e.payload.reason === 'completed'), true);
  assert.throws(() => closeWorkflow(done.workflowRunId, { repoRoot: tmp }), (err) => err.code === 'case-closed');
  assert.equal(statusWorkflow(done.workflowRunId, opts(tmp)).case.open, false);

  // A conductor case with an attempt still alive keeps its worktree binding when it closes.
  const conductor = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  const lease = acquireDispatchCwdLock(path.join(tmp, '.fgos'), tmp);
  try {
    const result = closeWorkflow(conductor.caseId, { repoRoot: tmp });
    assert.deepEqual(result.unbound, []);
    assert.deepEqual(result.kept.map((k) => k.reason), ['attempt-not-quiet']);
    assert.equal(readBinding({ mainRoot: tmp, worktree: tmp, caseId: conductor.caseId }).answer, 'bound', 'the exclusivity stays while the attempt lives');
  } finally {
    lease.release();
  }
});

test('a quiet conductor case closes and lets go of its worktree', async () => {
  const tmp = setupRepo();
  const conductor = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  const result = closeWorkflow(conductor.caseId, { repoRoot: tmp });
  assert.equal(result.unbound.length, 1);
  assert.equal(readBinding({ mainRoot: tmp, worktree: tmp, caseId: 'another' }).answer, 'unbound');
});

// A closed case that planned, built a child with a verify receipt, and closed; the plan and the child are what a successor could take over.
async function closedPlannedCase(tmp, request = 'Ship the change') {
  const first = await startWorkflow({ workflow: conductorWorkflow(), request, ...opts(tmp) });
  const run = { repoRoot: tmp, caseId: first.caseId };
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    settle('r-plan', { milestone: 'plan-ready', subjectDigest: 'sha256:plan', activity: 'plan' }),
    { type: 'reservation', payload: { reservationId: 'r-build', activity: 'build-a', writes: ['src/a'], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-build', { milestone: 'child-built', subjectDigest: 'sha256:child', receipts: [verifyReceipt('child-built', 'sha256:child')], activity: 'build-a' }),
  ]);
  closeWorkflow(first.caseId, { repoRoot: tmp });
  return first.caseId;
}

test('inherit: a case takes over the plan a closed case of the same request and commit reached, never its delivery, and says where it came from', async () => {
  const tmp = setupRepo();
  const from = await closedPlannedCase(tmp);
  const next = await startWorkflow({ workflow: conductorWorkflow(), request: 'Ship the change', inheritFrom: from, ...opts(tmp) });

  assert.equal(next.case.milestones['plan-ready'].state, 'achieved');
  assert.deepEqual(next.case.milestones['plan-ready'].inherited, { fromCase: from });
  assert.equal(next.case.milestones['plan-ready'].digest, 'sha256:plan');
  assert.equal(next.case.milestones['child-built'].state, 'unreached', 'a delivery milestone is bound to a tree and is never taken over');
  assert.ok(['build-a', 'build-b'].every((id) => next.case.eligible.includes(id)), 'building can start without a second plan dispatch');
});

test('inherit: the opening event records the source case, the base commit and the milestones taken over', async () => {
  const tmp = setupRepo();
  const from = await closedPlannedCase(tmp);
  const next = await startWorkflow({ workflow: conductorWorkflow(), request: 'Ship the change', inheritFrom: from, ...opts(tmp) });
  const opened = eventsOf(tmp, next.caseId).find((e) => e.type === 'case.opened').payload;
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
  assert.equal(opened.baseCommit, head);
  assert.deepEqual([opened.inherits.fromCase, opened.inherits.baseCommit, opened.inherits.milestones.map((m) => m.milestone)], [from, head, ['plan-ready']]);
});

test('inherit: each condition that has moved is refused by name and creates no case', async () => {
  const tmp = setupRepo();
  const from = await closedPlannedCase(tmp);
  const runsBefore = fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).length;
  const refused = (params, code) => assert.rejects(
    () => startWorkflow({ workflow: conductorWorkflow(), request: 'Ship the change', ...opts(tmp), ...params }),
    (err) => err.code === code,
  );

  await refused({ inheritFrom: 'no-such-case' }, 'inherit-source-unknown');
  await refused({ inheritFrom: from, request: 'A different request' }, 'inherit-request-differs');
  await refused({ inheritFrom: from, workflow: conductorWorkflow({ purpose: 'another version of the same guide' }) }, 'inherit-guide-differs');

  const open = await startWorkflow({ workflow: conductorWorkflow(), request: 'Ship the change', ...opts(tmp) });
  await refused({ inheritFrom: open.caseId }, 'inherit-source-open');
  closeWorkflow(open.caseId, { repoRoot: tmp });
  await refused({ inheritFrom: open.caseId }, 'inherit-nothing');

  fs.writeFileSync(path.join(tmp, 'moved.txt'), 'the base commit moves\n');
  execFileSync('git', ['add', 'moved.txt'], { cwd: tmp });
  execFileSync('git', ['commit', '-q', '-m', 'move the base'], { cwd: tmp });
  await refused({ inheritFrom: from }, 'inherit-base-differs');

  assert.equal(fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).length, runsBefore + 1, 'only the case opened to be closed exists beside the source: no refusal created a run');
});
