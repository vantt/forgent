// test/workflow/case-verbs.test.mjs — start, status, resume and close on both kinds of case

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';

import {
  validateWorkflow,
  startWorkflow,
  startWorkflowDetached,
  resumeWorkflow,
  resumeWorkflowDetached,
  answerWorkflow,
  statusWorkflow,
  closeWorkflow,
  gateWorkflow,
  readWorkflowEvents,
} from '../../src/workflow/index.mjs';
import { acquireDispatchCwdLock } from '../../src/run-supervisor/cwd-lock.mjs';
import { readBinding } from '../../src/workflow/case-bindings.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { appendAll, conductorWorkflow, settle, verifyReceipt } from '../helpers/workflow-case-fixture.mjs';

ensureScriptAddon();
seedFileLocalBwrapRegistry();

function setupRepo() {
  const tmp = setupWorkflowFixtureRepo({
    prefix: 'fgos-verbs-',
    readme: '# Verbs',
    gitName: 'Verbs Test',
    capabilities: ['docs:write'],
    workerBody: `
      fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    `,
  });
  fs.appendFileSync(path.join(tmp, '.gitignore'), '.fgos/\n*.mjs\n');
  return tmp;
}

const opts = (tmp) => ({ repoRoot: tmp, cwd: tmp, worktree: tmp });
const eventsOf = (tmp, id) => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id });
const unit = (id, extra = {}) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective: 'Read', writes: [], ...extra } });

test('an answered gate lets the integrate step land the writing unit branch on main', async () => {
  const tmp = setupRepo();
  const git = (...args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8' }).trim();
  git('checkout', '-qb', 'incoming');
  fs.mkdirSync(path.join(tmp, 'docs'));
  fs.writeFileSync(path.join(tmp, 'docs/delivery.md'), 'workflow delivery\n');
  git('add', 'docs'); git('commit', '-qm', 'writing unit output');
  git('checkout', '-q', 'main');
  const writer = path.join(tmp, 'writer');
  git('worktree', 'add', writer, 'incoming');
  const workflow = validateWorkflow({ id: 'integrate-gate', steps: [
    { id: 'consent', gate: { kind: 'human', question: 'Approve?' } },
    { id: 'write', dependsOn: ['consent'], units: [unit('writer', { writes: ['docs'] })] },
    { id: 'land', kind: 'integrate', dependsOn: ['write'] },
  ] });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'parked');
  const resumed = await resumeWorkflow(state.workflowRunId, opts(tmp));
  assert.equal(resumed.status, 'parked');
  // Seed only the earlier worker's settled output. The owning writing test
  // covers execution; this wiring proof runs the real integrate step and Land.
  appendAll({ repoRoot: tmp, caseId: state.workflowRunId }, [
    { type: 'step.start', payload: { stepId: 'write' } },
    { type: 'unit.scheduled', payload: { stepId: 'write', unitId: 'writer', branch: 'incoming', worktreePath: writer } },
    { type: 'unit.complete', payload: { stepId: 'write', unitId: 'writer', outcome: 'pass', results: [] } },
    { type: 'step.complete', payload: { stepId: 'write', outcome: 'pass' } },
  ]);
  const answered = await answerWorkflow(state.workflowRunId, { ...opts(tmp), stepId: 'consent', answer: 'yes', approved: true });
  assert.equal(answered.status, 'completed', JSON.stringify(answered.steps));
  assert.equal(answered.steps.land.status, 'completed');
  assert.equal(git('show', 'main:docs/delivery.md'), 'workflow delivery');
});

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

// A case that planned and built a child with a verify receipt, left open: the gate is what it may run next.
async function builtCase(tmp) {
  const started = await startWorkflow({ workflow: conductorWorkflow(), request: 'Ship the change', frame: { dispatches: 6, rigorFloor: 'standard' }, ...opts(tmp) });
  const run = { repoRoot: tmp, caseId: started.caseId };
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    settle('r-plan', { milestone: 'plan-ready', subjectDigest: 'sha256:plan', activity: 'plan' }),
    { type: 'reservation', payload: { reservationId: 'r-build', activity: 'build-a', writes: ['src/a'], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-build', { milestone: 'child-built', subjectDigest: 'sha256:child', receipts: [verifyReceipt('child-built', 'sha256:child')], activity: 'build-a' }),
  ]);
  return started.caseId;
}

const nodeExit = (code) => `"${process.execPath}" -e "process.exit(${code})"`;
const settleEvents = (tmp, id) => eventsOf(tmp, id).filter((e) => e.type === 'settle');

test('gate: the runner runs the whole-worktree command and a pass settles the integrated receipt, recording the command and an output digest', async () => {
  const tmp = setupRepo();
  const id = await builtCase(tmp);
  const before = statusWorkflow(id, opts(tmp)).case.frameRemaining.mutatingDispatches;

  const result = await gateWorkflow(id, { ...opts(tmp), writes: ['README.md'], verify: nodeExit(0) });
  assert.equal(result.outcome, 'pass');
  assert.equal(result.gate.passed, true);

  const status = statusWorkflow(id, opts(tmp));
  assert.equal(status.case.milestones.integrated.state, 'achieved');
  assert.equal(status.case.frameRemaining.mutatingDispatches, before - 1, 'the gate is admitted like any writing dispatch and counts against the frame');
  const last = settleEvents(tmp, id).at(-1).payload;
  assert.equal(last.activity, 'integrate');
  assert.equal(last.seatLaunchesUsed, 0);
  assert.equal(last.gate.command, nodeExit(0));
  assert.match(last.gate.outputDigest, /^sha256:[0-9a-f]{64}$/);
  assert.ok(last.receipts.some((r) => r.evaluator === 'harness-verify' && r.milestone === 'integrated' && r.passed === true));
});

test('gate: a failing command leaves the milestone unachieved and records why', async () => {
  const tmp = setupRepo();
  const id = await builtCase(tmp);

  const result = await gateWorkflow(id, { ...opts(tmp), writes: ['README.md'], verify: nodeExit(3) });
  assert.equal(result.outcome, 'findings');
  assert.equal(result.gate.status, 3);

  assert.equal(statusWorkflow(id, opts(tmp)).case.milestones.integrated.state, 'unreached');
  const last = settleEvents(tmp, id).at(-1).payload;
  assert.equal(last.outcome, 'findings');
  assert.equal(last.gate.passed, false);
  assert.deepEqual(last.receipts, []);
});

test('gate: with no command, no tested paths or no worktree it refuses by name before touching the case', async () => {
  const tmp = setupRepo();
  const id = await builtCase(tmp);
  const count = () => eventsOf(tmp, id).length;
  const before = count();

  await assert.rejects(gateWorkflow(id, { ...opts(tmp), writes: ['README.md'] }), (err) => err.code === 'gate-command-missing');
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), verify: nodeExit(0) }), (err) => err.code === 'gate-writes-required');
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), worktree: path.join(tmp, 'absent'), writes: ['README.md'], verify: nodeExit(0) }), (err) => err.code === 'gate-worktree-missing');
  assert.equal(count(), before, 'a refused gate writes nothing to the ledger');
});

test('gate: a case that has not reached the activity entry refuses the gate through the same admission as any dispatch', async () => {
  const tmp = setupRepo();
  const { caseId: id } = await startWorkflow({ workflow: conductorWorkflow(), frame: { dispatches: 6, rigorFloor: 'standard' }, ...opts(tmp) });
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), writes: ['README.md'], verify: nodeExit(0) }), (err) => err.code === 'entry-milestone-unmet');
  assert.equal(statusWorkflow(id, opts(tmp)).case.milestones.integrated.state, 'unreached');
});

test('answer refuses by name a step that is no gate of the run, and a gate that is not parked', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({ id: 'answer-guard', steps: [
    { id: 'first', gate: { kind: 'human', question: 'First?' } },
    { id: 'second', dependsOn: ['first'], gate: { kind: 'human', question: 'Second?' } },
  ] });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'parked');
  const id = state.workflowRunId;
  await assert.rejects(answerWorkflow(id, { ...opts(tmp), stepId: 'nowhere', answer: 'yes', approved: true }), (err) => err.code === 'gate-unknown' && /nowhere/.test(err.message));
  await assert.rejects(answerWorkflow(id, { ...opts(tmp), stepId: 'second', answer: 'yes', approved: true }), (err) => err.code === 'gate-not-parked' && /second/.test(err.message));
  assert.ok(!eventsOf(tmp, id).some((e) => e.type === 'gate.answer'), 'no answer reached the ledger');
});
