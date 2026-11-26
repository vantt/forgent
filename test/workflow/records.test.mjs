import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { nativeDoor, nativeHelperExe } from '../../src/native/door.mjs';
import { conductorWorkflow, openCase, appendAll, eventsOf, settle } from '../helpers/workflow-case-fixture.mjs';
import { projectCase } from '../../src/workflow/case-projection.mjs';
import { projectWorkflowState } from '../../src/workflow/store.mjs';
import { recordsOfCase } from '../../src/workflow/records.mjs';
import { workflowRecords } from '../../src/workflow/case-verbs.mjs';

function parallel() {
  return conductorWorkflow({ activities: [
    { id: 'left', entry: ['request-received'], produces: ['plan-ready'], effects: 'none', unit: { capability: 'review' } },
    { id: 'right', entry: ['request-received'], produces: ['findings-report'], effects: 'none', unit: { capability: 'advise' } },
    { id: 'later', entry: ['plan-ready'], produces: [], effects: 'none', unit: { capability: 'execute' } },
  ], decisions: [] });
}

test('two parallel open activities project separate capability needs and the approved frame cap', () => {
  // Owning proof of the new source: case projection tests do not produce scheduling records.
  const run = openCase({ workflow: parallel() });
  const records = workflowRecords({ repoRoot: run.repoRoot }).records;
  assert.deepEqual(records, [
    { item: run.caseId, step: 'left', needs: { kind: 'capability', ref: 'review', maxRounds: 8 } },
    { item: run.caseId, step: 'right', needs: { kind: 'capability', ref: 'advise', maxRounds: 8 } },
  ]);
  // One wiring proof: the host route reaches this projection and keeps the CLI envelope.
  const cli = spawnSync(nativeHelperExe(nativeDoor()), ['workflow', 'records', '--json', '--dir', run.repoRoot], { cwd: run.repoRoot, encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  const answer = JSON.parse(cli.stdout);
  assert.equal(answer.contract, 'fgos.v1');
  assert.deepEqual(answer.data, { records, closedItems: [] });
});

test('a parked gate carries its question id, not question prose, and an answer removes that wait', () => {
  const run = openCase({ workflow: conductorWorkflow({ steps: [{ id: 'left', gate: { question: 'Continue?' } }], activities: parallel().guide.activities, decisions: [] }) });
  appendAll(run, [{ type: 'gate.park', payload: { stepId: 'left', question: 'Continue?', questionId: 'q-abcdefghij' } }]);
  let records = workflowRecords({ repoRoot: run.repoRoot }).records;
  assert.deepEqual(records[0].waitingOn, { kind: 'person', ref: 'q-abcdefghij' });
  appendAll(run, [{ type: 'gate.answer', payload: { stepId: 'left', approved: true, answer: 'yes' } }]);
  records = workflowRecords({ repoRoot: run.repoRoot }).records;
  assert.equal(records[0].waitingOn, undefined);
  assert.equal(records[0].outcome, 'done');
});

test('live reservations wait on their actor and settled activities carry an outcome without closing the case', () => {
  const run = openCase({ workflow: parallel() });
  appendAll(run, [{ type: 'reservation', payload: { reservationId: 'r-left', activity: 'left', unitRunId: 'unit-left' } }]);
  assert.deepEqual(workflowRecords({ repoRoot: run.repoRoot }).records[0].waitingOn, { kind: 'actor', ref: 'unit-left' });
  appendAll(run, [settle('r-left', { activity: 'left', milestone: 'plan-ready', outcome: 'findings' })]);
  const records = workflowRecords({ repoRoot: run.repoRoot }).records;
  assert.equal(records.find((r) => r.step === 'left').outcome, 'done');
  assert.ok(records.some((r) => r.step === 'later'));
  appendAll(run, [{ type: 'case.closed', payload: { closedAt: new Date().toISOString() } }]);
  assert.deepEqual(workflowRecords({ repoRoot: run.repoRoot }), { records: [], closedItems: [run.caseId] });
});

test('a stale settled milestone reopens its activity and a missing binding never invents a capability', () => {
  const run = openCase({ workflow: parallel() });
  appendAll(run, [{ type: 'reservation', payload: { reservationId: 'r', activity: 'left' } }, settle('r', { activity: 'left', milestone: 'plan-ready', subjectDigest: 'old' })]);
  const events = eventsOf(run);
  const state = projectWorkflowState(events);
  const projection = projectCase(events, { currentDigests: { 'plan-ready': 'new' } });
  assert.equal(recordsOfCase({ events, state, projection })[0].outcome, undefined);
  projection.guide = { ...projection.guide, activities: [{ ...projection.guide.activities[0], unit: undefined }] };
  assert.equal(recordsOfCase({ events, state, projection })[0].needs, undefined);
});

test('legacy prose-only gates need judgement per item while unreadable ledgers still fail the source', () => {
  const run = openCase({ workflow: conductorWorkflow({ steps: [{ id: 'left', gate: { question: 'Continue?' } }], activities: parallel().guide.activities, decisions: [] }) });
  appendAll(run, [{ type: 'gate.park', payload: { stepId: 'left', question: 'Continue?' } }]);
  const records = workflowRecords({ repoRoot: run.repoRoot }).records;
  assert.deepEqual(records.find((r) => r.step === 'left'), { item: run.caseId, step: 'left' });
  assert.equal(records.find((r) => r.step === 'right').needs.ref, 'advise');
  fs.writeFileSync(`${run.repoRoot}/.fgos/workflow-runs/${run.caseId}/events.jsonl`, 'broken\n');
  assert.throws(() => workflowRecords({ repoRoot: run.repoRoot }));
});
