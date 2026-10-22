// test/workflow/case-verbs.test.mjs — start, status, resume and close on both kinds of case

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { acquireDocumentationCutoverLease } from '../../src/runner/documentation-cutover-lease.mjs';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';

import {
  validateWorkflow,
  startWorkflow,
  startWorkflowDetached,
  resumeWorkflow,
  resumeWorkflowDetached,
  answerWorkflow,
  answerWorkflowDetached,
  statusWorkflow,
  closeWorkflow,
  readWorkflowEvents,
} from '../../src/workflow/index.mjs';
import { acquireDispatchCwdLock } from '../../src/runner/dispatch/cwd-lock.mjs';
import { readBinding } from '../../src/workflow/case-bindings.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
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

// Case-port tests do not prove documentation admission. Exercise start and
// all four later execute doors, including a foreign origin recorded before
// the freeze; answering from the holder must never upgrade that origin.
for (const originKind of ['main', 'foreign', 'non-Git']) test(`workflow start, resume and answer refuse a ${originKind} non-holder origin before effects`, async () => {
  const tmp = setupRepo();
  const git = (...args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8' });
  const holder = path.join(tmp, 'holder');
  git('worktree', 'add', '-qb', 'holder', holder);
  const origin = originKind === 'main' ? tmp : originKind === 'foreign' ? setupRepo() : makeFixtureDir('fgos-workflow-outside-');
  const workflow = validateWorkflow({ id: 'lease-gated', steps: [
    { id: 'consent', gate: { kind: 'human', question: 'Approve?' } },
    { id: 'write', dependsOn: ['consent'], units: [unit('writer', originKind === 'non-Git' ? {} : { objective: 'WRITE:docs/new.md', writes: ['docs'] })] },
    { id: 'land', kind: 'integrate', dependsOn: ['write'] },
  ] });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: origin, worktree: origin });
  assert.equal(state.status, 'parked');
  acquireDocumentationCutoverLease({ repoRoot: holder });
  const snapshot = () => {
    const files = {};
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else files[path.relative(tmp, file)] = entry.isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file).toString('base64');
      }
    };
    walk(path.join(tmp, '.fgos'));
    return { files, refs: git('show-ref'), worktrees: git('worktree', 'list', '--porcelain'), status: git('status', '--porcelain') };
  };
  const before = snapshot();
  const readOnly = validateWorkflow({ id: 'frozen-read', steps: [{ id: 'read', units: [unit('reader')] }] });
  const startOptions = { workflow: readOnly, repoRoot: tmp, cwd: origin, worktree: origin };
  await assert.rejects(() => startWorkflow(startOptions), { code: 'documentation-cutover-lease' });
  assert.deepEqual(snapshot(), before);
  assert.throws(() => startWorkflowDetached(startOptions), { code: 'documentation-cutover-lease' });
  assert.deepEqual(snapshot(), before, 'no ledger or detached spawn on a refused start');
  // Naming the holder on a later call must not rewrite this run's origin.
  const options = { repoRoot: tmp, cwd: holder, worktree: holder };
  const answer = { ...options, stepId: 'consent', answer: 'yes', approved: true };
  await assert.rejects(() => resumeWorkflow(state.workflowRunId, options), { code: 'documentation-cutover-lease' });
  assert.deepEqual(snapshot(), before);
  assert.throws(() => resumeWorkflowDetached(state.workflowRunId, options), { code: 'documentation-cutover-lease' });
  assert.deepEqual(snapshot(), before);
  await assert.rejects(() => answerWorkflow(state.workflowRunId, answer), { code: 'documentation-cutover-lease' });
  assert.deepEqual(snapshot(), before);
  assert.throws(() => answerWorkflowDetached(state.workflowRunId, answer), { code: 'documentation-cutover-lease' });
  assert.deepEqual(snapshot(), before, 'no answer round, advance, detached log, worktree or branch');
});

test('a holder workflow keeps its recorded checkout through resume, answer and integration from main', async () => {
  const tmp = setupRepo();
  const git = (...args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8' }).trim();
  git('checkout', '-qb', 'incoming');
  fs.mkdirSync(path.join(tmp, 'docs'));
  fs.writeFileSync(path.join(tmp, 'docs/delivery.md'), 'workflow delivery\n');
  git('add', 'docs'); git('commit', '-qm', 'writing unit output');
  git('checkout', '-q', 'main');
  const writer = path.join(tmp, 'writer');
  git('worktree', 'add', writer, 'incoming');
  const holder = path.join(tmp, 'holder');
  git('worktree', 'add', '-qb', 'holder', holder);
  acquireDocumentationCutoverLease({ repoRoot: holder });
  const workflow = validateWorkflow({ id: 'holder-gate', steps: [
    { id: 'consent', gate: { kind: 'human', question: 'Approve?' } },
    { id: 'write', dependsOn: ['consent'], units: [unit('writer', { writes: ['docs'] })] },
    { id: 'land', kind: 'integrate', dependsOn: ['write'] },
  ] });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: holder });
  assert.equal(state.status, 'parked');
  assert.equal(eventsOf(tmp, state.workflowRunId).find(e => e.type === 'case.opened').payload.callerCheckout, holder);
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
