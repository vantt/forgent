// test/workflow/playbook-proposer.test.mjs — the Playbook proposer asks admission for every Unit, holds advance for its life,
// records a gate answer before it acts on it, and leaves a reservation alone when it dies

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import {
  validateWorkflow,
  createWorkflowRun,
  startWorkflow,
  resumeWorkflow,
  answerWorkflow,
  answerWorkflowDetached,
  statusWorkflow,
  closeWorkflow,
  readWorkflowEvents,
} from '../../src/workflow/index.mjs';
import { conductorWorkflow } from '../helpers/workflow-case-fixture.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { projectCase } from '../../src/workflow/case-projection.mjs';
import { readReservationFiles } from '../../src/workflow/case-runtime.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';

seedFileLocalBwrapRegistry();

// A worker that writes every file its brief names as WRITE:<path> and waits SLEEP:<ms> before it reports.
const WORKER_BODY = `
  for (const m of prompt.matchAll(/WRITE:(\\S+)/g)) { fs.mkdirSync(path.dirname(m[1]), { recursive: true }); fs.writeFileSync(m[1], m[1] + ' written\\n'); }
  const sleep = /SLEEP:(\\d+)/.exec(prompt);
  if (sleep) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(sleep[1]));
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
`;

function setupRepo() {
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-proposer-', readme: '# Proposer', gitName: 'Proposer Test', capabilities: ['docs:write'], workerBody: WORKER_BODY });
  fs.appendFileSync(path.join(tmp, '.gitignore'), '.fgos/\n*.mjs\n');
  return tmp;
}

const unit = (id, objective = 'Read', extra = {}) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [], ...extra } });
const opts = (tmp) => ({ repoRoot: tmp, cwd: tmp, worktree: tmp });
const eventsOf = (tmp, id) => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id });
const FRAME = { dispatches: 2, mutatingDispatches: 1, fallbackPerSeat: 2, deviationsBeforeAsk: 0, rigorFloor: 'standard' };

test('every Unit is admitted before it runs and settled after it, with the proposer\'s own advance hold', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'proposer-order',
    frameDefaults: FRAME,
    steps: [
      { id: 'read', units: [unit('u-read')] },
      { id: 'write', dependsOn: ['read'], units: [unit('u-write', 'WRITE:out/x.txt', { writes: ['out/**'] })] },
    ],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const events = eventsOf(tmp, state.workflowRunId);
  const types = events.map((e) => e.type);
  assert.equal(types[1], 'case.opened', 'the case opens on the ledger before anything else happens');
  for (const unitId of ['u-read', 'u-write']) {
    const route = events.find((e) => e.type === 'route' && e.payload.unitId === unitId);
    const reservation = events.find((e) => e.type === 'reservation' && e.payload.unitId === unitId);
    const scheduled = events.find((e) => e.type === 'unit.scheduled' && e.payload.unitId === unitId);
    const settle = events.find((e) => e.type === 'settle' && e.payload.unitId === unitId);
    assert.ok(route && reservation && scheduled && settle, unitId);
    assert.equal(route.payload.routeKind, 'should', 'the proposer\'s pick is the guide\'s single SHOULD');
    assert.ok(route.seq < reservation.seq && reservation.seq < scheduled.seq && scheduled.seq < settle.seq, `${unitId}: admit, run, settle in that order`);
    assert.equal(settle.payload.reservationId, reservation.payload.reservationId);
    assert.equal(settle.payload.outcome, 'pass');
  }
  const bindings = events.filter((e) => e.type === 'binding').map((e) => e.payload.state);
  assert.deepEqual(bindings, ['bound', 'unbound'], 'the writing Unit\'s worktree is bound for its attempt only');
  assert.deepEqual(readReservationFiles(tmp, state.workflowRunId), [], 'no reservation outlives its settle');

  const status = statusWorkflow(state.workflowRunId, opts(tmp));
  assert.equal(status.case.kind, 'playbook');
  assert.deepEqual(status.case.frameRemaining.dispatches, 0);
  assert.deepEqual(status.case.frameRemaining.mutatingDispatches, 0);
  assert.equal(status.case.milestones['write.settled'].state, 'achieved');
  assert.match(status.case.milestones['read.settled'].digest, /^sha256:/);
});

test('a Unit the frame has no room for is refused by name and ends its step', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'proposer-frame',
    frameDefaults: { ...FRAME, dispatches: 1 },
    steps: [{ id: 's', units: [unit('first'), unit('second')] }],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'failed');
  assert.match(state.steps.s.reason, /admission refused frame-exhausted/);
  assert.equal(state.steps.s.units.second, undefined, 'the second Unit never started');
  assert.equal(eventsOf(tmp, state.workflowRunId).filter((e) => e.type === 'reservation').length, 1);
});

test('a frame given at start only narrows the guide\'s defaults', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({ id: 'proposer-narrow', frameDefaults: FRAME, steps: [{ id: 's', units: [unit('only')] }] });
  await assert.rejects(startWorkflow({ workflow, frame: { dispatches: 5 }, ...opts(tmp) }), /widens the guide's default 2/);
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false, 'a refused frame creates no run');
  const state = await startWorkflow({ workflow, frame: { dispatches: 1 }, ...opts(tmp) });
  assert.equal(state.status, 'completed');
  assert.equal(projectCase(eventsOf(tmp, state.workflowRunId)).frame.dispatches, 1);
});

const APPROVAL_GUIDE = {
  id: 'proposer-consent',
  milestones: [{ id: 'copy-approved', subject: 'the approved copy', evidence: 'gate answer', acceptedBy: 'owner', settledBy: 'approval' }],
  must: [{ id: 'consent', guard: 'human-consent', subject: 'copy-approved', reason: 'publishing approves nothing by itself' }],
  frameDefaults: { dispatches: 3, mutatingDispatches: 1, fallbackPerSeat: 2, deviationsBeforeAsk: 0, rigorFloor: 'standard' },
  steps: [
    { id: 'draft', units: [unit('draft-copy', 'Write the copy')] },
    { id: 'approval', dependsOn: ['draft'], gate: { kind: 'human', question: 'Approve the copy?' } },
    { id: 'publish', dependsOn: ['approval'], units: [unit('publish-copy', 'WRITE:pub/copy.txt', { writes: ['pub/**'] })] },
  ],
};

test('an answer that arrives while a proposer holds advance reaches the ledger before the proposer acts on it, and approval of a changed artifact asks again', async () => {
  const tmp = setupRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(APPROVAL_GUIDE), ...opts(tmp) });
  assert.equal(parked.status, 'parked');
  const id = parked.workflowRunId;
  const before = eventsOf(tmp, id).length;

  // A live holder stands in for the proposer: the answer is only kept.
  const held = acquireAdvanceLock(tmp, id);
  const kept = await answerWorkflow(id, { stepId: 'approval', answer: 'looks right', approved: true, ...opts(tmp) });
  assert.deepEqual([kept.recorded, kept.appliedBy], [true, 'live proposer']);
  assert.equal(eventsOf(tmp, id).length, before, 'answer appends nothing while a proposer lives');
  held.release();

  // The approved copy is edited after the answer was given and before the next proposer acts.
  const draftRun = parked.steps.draft.units['draft-copy'].unitRunId;
  const [report] = resolveUnitInputs([`unit-run:${draftRun}/producer`], tmp).refs;
  fs.appendFileSync(report, '\nEdited after approval.\n');

  const state = await resumeWorkflow(id, opts(tmp));
  const events = eventsOf(tmp, id);
  const answerAt = events.find((e) => e.type === 'gate.answer').seq;
  assert.ok(events.every((e) => !(e.type === 'step.start' && e.payload.stepId === 'publish') || e.seq > answerAt), 'gate.answer precedes any action taken on it');
  assert.equal(state.status, 'parked', 'the approval no longer matches what is there: the gate asks again');
  const repark = events.filter((e) => e.type === 'gate.park').at(-1);
  assert.match(repark.payload.reason, /-stale$/, 'the approval is stale for the artifact now there');
  assert.match(repark.payload.question, /Asked again/);
  assert.equal(events.some((e) => e.type === 'route' && e.payload.unitId === 'publish-copy'), false, 'the publish Unit was never admitted');
  assert.equal(fs.existsSync(path.join(tmp, 'pub')), false);

  // A new answer is a new occurrence, given for the version that is there now: the publish Unit is admitted
  // this time (the Execution Core still refuses to hand a changed report on, which is its own check).
  await answerWorkflow(id, { stepId: 'approval', answer: 'the edited copy is fine', approved: true, ...opts(tmp) });
  const answers = eventsOf(tmp, id).filter((e) => e.type === 'gate.answer');
  assert.deepEqual(answers.map((e) => e.payload.occurrence), [1, 2]);
  assert.notEqual(answers[0].payload.subjectDigest, answers[1].payload.subjectDigest, 'each approval carries the digest of what it approved');
  assert.equal(eventsOf(tmp, id).filter((e) => e.type === 'route' && e.payload.unitId === 'publish-copy').length, 1);
});

test('the same approval stands while its artifact is untouched, and the publish Unit is admitted', async () => {
  const tmp = setupRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(APPROVAL_GUIDE), ...opts(tmp) });
  const state = await answerWorkflow(parked.workflowRunId, { stepId: 'approval', answer: 'yes', approved: true, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  const projection = projectCase(eventsOf(tmp, state.workflowRunId));
  assert.equal(projection.milestones['copy-approved'].consent, true);
});

test('a run edited on disk after it started keeps the guide it started with', async () => {
  const tmp = setupRepo();
  const dir = path.join(tmp, 'core', 'workflows');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'pinned.yaml');
  const yaml = (finalObjective, extra = '') => `id: pinned
steps:
  - id: prep
    units:
      - { id: u-prep, template: { capability: docs:write, pattern: solo, objective: prep } }
  - id: ok
    dependsOn: [prep]
    gate: { kind: human, question: Go on? }
  - id: fin
    dependsOn: [ok]
    units:
      - { id: u-fin, template: { capability: docs:write, pattern: solo, objective: ${finalObjective} } }
${extra}`;
  fs.writeFileSync(file, yaml('FIN-ORIGINAL'));
  const parked = await startWorkflow({ workflowId: 'pinned', ...opts(tmp) });
  assert.equal(parked.status, 'parked');

  fs.writeFileSync(file, yaml('FIN-CHANGED', '  - id: extra\n    dependsOn: [fin]\n'));
  const state = await answerWorkflow(parked.workflowRunId, { stepId: 'ok', answer: 'go', approved: true, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.steps.extra, undefined, 'a step added to the file is not part of the run');
  const assignment = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', state.steps.fin.units['u-fin'].unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.ok(assignment.objective.includes('FIN-ORIGINAL') && !assignment.objective.includes('FIN-CHANGED'));
});

test('concurrent resumes give exactly one proposer, and a run recorded before cases existed is opened by it', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({ id: 'proposer-one', steps: [{ id: 's', units: [unit('slow', 'SLEEP:1500')] }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });
  assert.equal(eventsOf(tmp, workflowRunId).some((e) => e.type === 'case.opened'), false);

  const settled = await Promise.allSettled([resumeWorkflow(workflowRunId, opts(tmp)), resumeWorkflow(workflowRunId, opts(tmp))]);
  assert.deepEqual(settled.map((r) => r.status).sort(), ['fulfilled', 'rejected']);
  assert.match(settled.find((r) => r.status === 'rejected').reason.message, /already being advanced/);
  const events = eventsOf(tmp, workflowRunId);
  assert.equal(events.filter((e) => e.type === 'case.opened').length, 1);
  assert.equal(events.find((e) => e.type === 'case.opened').payload.legacy, true);
  assert.equal(events.filter((e) => e.type === 'workflow.complete').length, 1);
});

test('a proposer killed while its Unit runs leaves the reservation in place; the next proposer takes the same Unit run and the same reservation', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({ id: 'proposer-killed', steps: [{ id: 's', units: [unit('slow', 'SLEEP:2500')] }] });
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { startWorkflow } from ${JSON.stringify(path.resolve('src/workflow/index.mjs'))};
    await startWorkflow({ workflow: ${JSON.stringify(workflow)}, repoRoot: ${JSON.stringify(tmp)}, cwd: ${JSON.stringify(tmp)}, worktree: ${JSON.stringify(tmp)} });
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const runsDir = path.join(tmp, '.fgos', 'workflow-runs');
  const findRun = () => (fs.existsSync(runsDir) ? fs.readdirSync(runsDir).find((n) => n.startsWith('wf-run-')) : undefined);
  const deadline = Date.now() + 20000;
  let id;
  while (Date.now() < deadline) {
    id = findRun();
    if (id && eventsOf(tmp, id).some((e) => e.type === 'unit.started')) break;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.ok(id && eventsOf(tmp, id).some((e) => e.type === 'unit.started'), 'the Unit run started');
  child.kill('SIGKILL');
  await exited;

  const mid = eventsOf(tmp, id);
  const reservation = mid.find((e) => e.type === 'reservation');
  assert.ok(reservation, 'admitted before it ran');
  assert.equal(mid.some((e) => e.type === 'settle'), false, 'the proposer\'s death settles nothing');
  assert.deepEqual(readReservationFiles(tmp, id).map((r) => r.reservationId), [reservation.payload.reservationId], 'the reservation is not released');

  await new Promise((resolve) => setTimeout(resolve, 3500)); // the worker that outlived it finishes
  const state = await resumeWorkflow(id, opts(tmp));
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  const after = eventsOf(tmp, id);
  assert.equal(after.filter((e) => e.type === 'reservation').length, 1, 'the same dispatch, not a second one');
  assert.equal(after.filter((e) => e.type === 'unit.started').length, 1, 'the same Unit run is continued');
  assert.equal(after.find((e) => e.type === 'settle').payload.reservationId, reservation.payload.reservationId);
  assert.deepEqual(readReservationFiles(tmp, id), []);
});

test('an answer kept as a file by the detached door is folded in by the next proposer', async () => {
  const tmp = setupRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(APPROVAL_GUIDE), ...opts(tmp) });
  const id = parked.workflowRunId;
  const held = acquireAdvanceLock(tmp, id);
  try {
    const kept = answerWorkflowDetached(id, { stepId: 'approval', answer: 'yes', approved: true, ...opts(tmp) });
    assert.equal(kept.recorded, true);
  } finally {
    held.release();
  }
  const state = await resumeWorkflow(id, opts(tmp));
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
});

test('a panel Unit is admitted under a ceiling of its planned seats times the fallback allowance, and settles the launches it used', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'proposer-ceiling',
    frameDefaults: { dispatches: 1, mutatingDispatches: 0, seatLaunchesPerDispatch: 4, fallbackPerSeat: 2, deviationsBeforeAsk: 0, rigorFloor: 'standard' },
    steps: [{ id: 'think', units: [unit('u-panel', 'Think', { pattern: 'panel', params: { members: 3 } })] }],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  const events = eventsOf(tmp, state.workflowRunId);
  const reservation = events.find((e) => e.type === 'reservation');
  const settle = events.find((e) => e.type === 'settle');
  assert.equal(reservation.payload.seatLaunchCeiling, 8, 'four seats, at most two launches each');
  assert.equal(settle.payload.seatLaunchesUsed, 4, 'three panelists and the synthesizer launched once each');
  assert.equal(settle.payload.frameExhausted, undefined);
  const between = events.filter((e) => e.seq > reservation.seq && e.seq < settle.seq).map((e) => e.type);
  assert.deepEqual(between.filter((t) => !['unit.scheduled', 'unit.started', 'unit.complete', 'step.start'].includes(t)), [], 'the Execution Core wrote nothing to the ledger between admit and settle');
});

test('a Playbook case that ran to a pass closes itself by the rules of close; failed, parked and conductor cases stay open', async () => {
  const tmp = setupRepo();
  const done = await startWorkflow({
    workflow: validateWorkflow({ id: 'auto-close', frameDefaults: FRAME, steps: [{ id: 'write', units: [unit('u-write', 'WRITE:out/y.txt', { writes: ['out/**'] })] }] }),
    ...opts(tmp),
  });
  assert.equal(done.status, 'completed', JSON.stringify(done.steps));
  const events = eventsOf(tmp, done.workflowRunId);
  const closed = events.find((e) => e.type === 'case.closed');
  assert.equal(closed.payload.reason, 'completed');
  assert.ok(closed.seq > events.find((e) => e.type === 'workflow.complete').seq, 'closed after the case completed');
  assert.deepEqual(events.filter((e) => e.type === 'binding').map((e) => e.payload.state), ['bound', 'unbound']);
  assert.equal(statusWorkflow(done.workflowRunId, opts(tmp)).case.open, false);
  assert.throws(() => closeWorkflow(done.workflowRunId, opts(tmp)), { code: 'case-closed' }, 'the verb agrees: already closed');

  // A failed case stays open: resume and answer keep working on it.
  const failed = await startWorkflow({
    workflow: validateWorkflow({ id: 'no-auto-close-failed', frameDefaults: { ...FRAME, dispatches: 1 }, steps: [{ id: 's', units: [unit('first'), unit('second')] }] }),
    ...opts(tmp),
  });
  assert.equal(failed.status, 'failed');
  assert.equal(projectCase(eventsOf(tmp, failed.workflowRunId)).open, true);

  // A case parked at its gate stays open.
  const parked = await startWorkflow({ workflow: validateWorkflow(APPROVAL_GUIDE), ...opts(tmp) });
  assert.equal(parked.status, 'parked');
  assert.equal(projectCase(eventsOf(tmp, parked.workflowRunId)).open, true);
  const finished = await answerWorkflow(parked.workflowRunId, { stepId: 'approval', answer: 'yes', approved: true, ...opts(tmp) });
  assert.equal(finished.status, 'completed');
  assert.equal(projectCase(eventsOf(tmp, parked.workflowRunId)).open, false, 'the answer that finishes the case closes it');

  // A conductor case closes only through its close verb.
  const conductor = await startWorkflow({ workflow: conductorWorkflow({ id: 'conductor-stays' }), ...opts(tmp) });
  assert.equal(projectCase(eventsOf(tmp, conductor.workflowRunId)).open, true);
  assert.equal(closeWorkflow(conductor.workflowRunId, opts(tmp)).closed, true);
});
