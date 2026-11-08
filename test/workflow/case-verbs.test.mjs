// test/workflow/case-verbs.test.mjs — start, status, resume and close on both kinds of case

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { startWorkflow, resumeWorkflow, answerWorkflow, statusWorkflow, closeWorkflow, gateWorkflow } from '../../src/workflow/index.mjs';
import { readWorkflowEvents } from '../../src/workflow/store.mjs';
import { acquireAdvanceLock, tryAcquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { acquireDispatchCwdLock } from '../../src/run-supervisor/cwd-lock.mjs';
import { readBinding } from '../../src/workflow/case-bindings.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { capabilityServedBy, readProjectConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';
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
  const detachedLike = await startWorkflow({ workflow: conductorWorkflow({ id: 'case-fixture-two' }), repoRoot: tmp, cwd: tmp, worktree: sub, detached: true });
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
  assert.equal((await resumeWorkflow(id, { ...opts(tmp), detached: true })).detached, undefined);
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

test('closing a case retires a case that closed more than two weeks ago and leaves a recent one', async () => {
  const tmp = setupRepo();
  const ledgerOf = (id) => path.join(tmp, '.fgos', 'workflow-runs', id, 'events.jsonl');
  const old = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  closeWorkflow(old.caseId, { repoRoot: tmp });
  const days = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  // Move the close of the first case 30 days back; the ledger stays a valid chain.
  fs.writeFileSync(ledgerOf(old.caseId), fs.readFileSync(ledgerOf(old.caseId), 'utf8').split('\n').map((line) => {
    if (!line.includes('"type":"case.closed"')) return line;
    const event = JSON.parse(line);
    return JSON.stringify({ ...event, payload: { ...event.payload, closedAt: days(30) } });
  }).join('\n'));
  const recent = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  closeWorkflow(recent.caseId, { repoRoot: tmp });

  assert.equal(fs.existsSync(path.dirname(ledgerOf(old.caseId))), false);
  assert.equal(fs.existsSync(ledgerOf(recent.caseId)), true);
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
const GATE = { capability: 'code:implement' };
/** The project declares the command its gate runs, as `capabilities.code:implement.verify`. */
function declareGate(tmp, command) {
  const cfg = readProjectConfig(tmp);
  cfg.runner.capabilities['code:implement'] = { ...capabilityServedBy('test-node', 'code:implement'), verify: command };
  writeProjectConfig(tmp, cfg);
}
const settleEvents = (tmp, id) => eventsOf(tmp, id).filter((e) => e.type === 'settle');

test('gate: the runner runs the whole-worktree command and a pass settles the integrated receipt, recording the command and an output digest', async () => {
  const tmp = setupRepo();
  declareGate(tmp, nodeExit(0));
  const id = await builtCase(tmp);
  const before = statusWorkflow(id, opts(tmp)).case.frameRemaining.mutatingDispatches;

  const result = await gateWorkflow(id, { ...opts(tmp), ...GATE, writes: ['README.md'] });
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
  declareGate(tmp, nodeExit(3));
  const id = await builtCase(tmp);

  const result = await gateWorkflow(id, { ...opts(tmp), ...GATE, writes: ['README.md'] });
  assert.equal(result.outcome, 'findings');
  assert.equal(result.gate.status, 3);

  assert.equal(statusWorkflow(id, opts(tmp)).case.milestones.integrated.state, 'unreached');
  const last = settleEvents(tmp, id).at(-1).payload;
  assert.equal(last.outcome, 'findings');
  assert.equal(last.gate.passed, false);
  assert.deepEqual(last.receipts, []);
});

test('gate: with no declared command, no tested paths or no worktree it refuses by name before touching the case; a command passed by the caller is never run', async () => {
  const tmp = setupRepo();
  const id = await builtCase(tmp);
  const count = () => eventsOf(tmp, id).length;
  const before = count();

  await assert.rejects(gateWorkflow(id, { ...opts(tmp), ...GATE, writes: ['README.md'] }), (err) => err.code === 'gate-command-missing' && /capabilities\.<capability>\.verify/.test(err.message));
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), writes: ['README.md'], verify: nodeExit(0) }), (err) => err.code === 'gate-command-missing');
  declareGate(tmp, nodeExit(0));
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), ...GATE }), (err) => err.code === 'gate-writes-required');
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), ...GATE, worktree: path.join(tmp, 'absent'), writes: ['README.md'] }), (err) => err.code === 'gate-worktree-missing');
  assert.equal(count(), before, 'a refused gate writes nothing to the ledger');
});

test('gate: a case that has not reached the activity entry refuses the gate through the same admission as any dispatch', async () => {
  const tmp = setupRepo();
  const { caseId: id } = await startWorkflow({ workflow: conductorWorkflow(), frame: { dispatches: 6, rigorFloor: 'standard' }, ...opts(tmp) });
  declareGate(tmp, nodeExit(0));
  await assert.rejects(gateWorkflow(id, { ...opts(tmp), ...GATE, writes: ['README.md'] }), (err) => err.code === 'entry-milestone-unmet');
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

test('answer refuses a caller inside a dispatched worker even when its views of the ledger are writable, and keeps no round', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({ id: 'answer-depth', steps: [{ id: 'first', gate: { kind: 'human', question: 'First?' } }] });
  const { workflowRunId: id } = await startWorkflow({ workflow, ...opts(tmp) });
  const before = process.env.FGOS_DISPATCH_DEPTH;
  process.env.FGOS_DISPATCH_DEPTH = '1';
  try {
    await assert.rejects(answerWorkflow(id, { ...opts(tmp), stepId: 'first', answer: 'yes', approved: true }), (err) => err.code === 'nested-write-from-confined-worker' && /confined worker/.test(err.message));
  } finally {
    if (before === undefined) delete process.env.FGOS_DISPATCH_DEPTH;
    else process.env.FGOS_DISPATCH_DEPTH = before;
  }
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs', id, 'gate-answers')), false, 'no round file was made');
  const answered = await answerWorkflow(id, { ...opts(tmp), stepId: 'first', answer: 'yes', approved: true });
  assert.equal(answered.status, 'completed', 'the owner, outside any worker, can answer');
});

test('answer accepts the activity of a decision point that carries a gate, and refuses an activity no gate names', async () => {
  const tmp = setupRepo();
  const workflow = conductorWorkflow({ decisions: [{ at: 'integrated', mayInstead: ['approve-gate'], gate: 'consent' }] });
  const started = await startWorkflow({ workflow, request: 'Ship the change', frame: { dispatches: 6, rigorFloor: 'standard' }, ...opts(tmp) });
  const run = { repoRoot: tmp, caseId: started.caseId };
  appendAll(run, [{ type: 'gate.park', payload: { stepId: 'approve-gate', question: 'Approve the integrated tree?' } }]);

  await assert.rejects(answerWorkflow(run.caseId, { ...opts(tmp), stepId: 'publish', answer: 'yes', approved: true }), (err) => err.code === 'gate-unknown' && /publish/.test(err.message));
  await answerWorkflow(run.caseId, { ...opts(tmp), stepId: 'approve-gate', answer: 'yes', approved: true });
  const answers = eventsOf(tmp, run.caseId).filter((e) => e.type === 'gate.answer');
  assert.deepEqual(answers.map((e) => [e.payload.stepId, e.payload.mode]), [['approve-gate', 'consent']]);
});

test('the detached advance child leaves progress lines in advance.log and no dump of its result', async () => {
  const tmp = setupRepo();
  const started = await startWorkflow({ workflow: validateWorkflow({ id: 'test/log-progress', steps: [{ id: 'only', dependsOn: [] }] }), ...opts(tmp), detached: true });
  const { pid, logPath } = started.detached;
  const alive = () => { try { process.kill(pid, 0); return true; } catch { return false; } };
  for (let i = 0; i < 150 && alive(); i += 1) await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(alive(), false, 'the child finished');
  const status = statusWorkflow(started.caseId, opts(tmp));
  assert.equal(status.status, 'completed');
  assert.equal(status.advance.running, false);
  assert.ok(status.advance.logPath.endsWith('advance.log'));
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  const stepLines = lines.filter((l) => l.includes('step only'));
  assert.equal(stepLines.length, 2, `one line when the step starts and one when it ends, got: ${lines.join('\n')}`);
  assert.match(stepLines[0], /started/);
  assert.match(stepLines[1], /completed/);
  assert.ok(lines.every((l) => !l.startsWith('{') && !l.startsWith('"')), `no result JSON in the log: ${lines.join('\n')}`);
});

test('every verb names a case that does not exist case-not-found, and a malformed id invalid-case-id, before any path is built', async () => {
  const tmp = setupRepo();
  const missing = 'wf-run-0000-missing';
  const notFound = (err) => err.code === 'case-not-found' && /not found/.test(err.message);
  assert.throws(() => statusWorkflow(missing, opts(tmp)), notFound);
  assert.throws(() => closeWorkflow(missing, opts(tmp)), notFound);
  await assert.rejects(resumeWorkflow(missing, opts(tmp)), notFound);
  await assert.rejects(resumeWorkflow(missing, { ...opts(tmp), detached: true }), notFound);
  await assert.rejects(answerWorkflow(missing, { ...opts(tmp), stepId: 'a', answer: 'yes' }), notFound);
  for (const bad of ['../escape', '.bindings', 'a/b']) {
    assert.throws(() => statusWorkflow(bad, opts(tmp)), (err) => err.code === 'invalid-case-id');
  }
});

test('a resume that finds the case held refuses naming the holder, takes nothing, and leaves the lock free when it ends', async () => {
  const tmp = setupRepo();
  const { workflowRunId: id } = await startWorkflow({ workflow: validateWorkflow({ id: 'held-playbook', steps: [{ id: 'a', units: [unit('ua')] }, { id: 'ok', dependsOn: ['a'], gate: { kind: 'human', question: 'Approve?' } }] }), ...opts(tmp) });
  const held = acquireAdvanceLock(tmp, id);
  for (const detached of [false, true]) {
    await assert.rejects(resumeWorkflow(id, { ...opts(tmp), detached }), (err) => err.code === 'case-advance-busy' && err.message.includes(`process ${process.pid}`));
  }
  held.release();
  const free = tryAcquireAdvanceLock(tmp, id);
  assert.ok(free, 'no refused resume kept the advance lock');
  free.release();
});

test('status judges the case\'s bindings without repairing them: sound while the record is there, naming the case when it is gone', async () => {
  const tmp = setupRepo();
  const { caseId: id } = await startWorkflow({ workflow: conductorWorkflow(), ...opts(tmp) });
  assert.deepEqual(statusWorkflow(id, opts(tmp)).bindingsJudgment, { sound: true, problems: [] });

  const dir = path.join(tmp, '.fgos', 'workflow-runs', '.bindings');
  const records = fs.readdirSync(dir).filter((n) => n.endsWith('.json'));
  assert.equal(records.length, 1);
  fs.rmSync(path.join(dir, records[0]));
  const judged = statusWorkflow(id, opts(tmp)).bindingsJudgment;
  assert.equal(judged.sound, false);
  assert.ok(judged.problems.length === 1 && judged.problems[0].includes(id), judged.problems.join('\n'));
  assert.equal(fs.readdirSync(dir).filter((n) => n.endsWith('.json')).length, 0, 'a status read repairs nothing');
});
