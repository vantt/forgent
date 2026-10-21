// test/workflow/case-runtime.test.mjs — gate answers as rounds nobody rewrites, settle-pending, and the one drain

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { validateWorkflow, createWorkflowRun, readWorkflowEvents } from '../../src/workflow/index.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { drainCaseInbox, readReservationFiles, recordGateAnswerRound, unconsumedGateRounds, writeReservationFile, writeSettlePending } from '../../src/workflow/case-runtime.mjs';
import { digestSubject, digestText, digestContextRefs } from '../../src/workflow/ref-digests.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { appendAll, append, eventsOf, openCase, withHold } from '../helpers/workflow-case-fixture.mjs';

function gatedRun() {
  const repoRoot = makeFixtureDir('fgos-rounds-');
  const workflow = validateWorkflow({ id: 'gate-rounds', steps: [{ id: 'a' }, { id: 'ok', dependsOn: ['a'], gate: { kind: 'human', question: 'Approve the copy?' } }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow });
  const run = { repoRoot, caseId: workflowRunId };
  appendAll(run, [{ type: 'step.complete', payload: { stepId: 'a', outcome: 'pass' } }, { type: 'gate.park', payload: { stepId: 'ok', question: 'Approve the copy?' } }]);
  return run;
}

const answer = (run, extra = {}) => recordGateAnswerRound({
  mainRoot: run.repoRoot, caseId: run.caseId, events: eventsOf(run), stepId: 'ok', answer: 'looks right', approved: true, question: 'Approve the copy?', subjectDigest: 'sha256:copy', ...extra,
});
const answerFile = (run) => path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId, 'gate-answers', 'ok.md');

test('a gate answer is one round file made once; a second answer to an answered gate is refused by name', () => {
  const run = gatedRun();
  const first = answer(run);
  assert.deepEqual(first, { stepId: 'ok', occurrence: 1, round: 1, settles: true });
  assert.equal(unconsumedGateRounds(run.repoRoot, run.caseId, eventsOf(run)).length, 1);

  // The answer is on disk before any event exists; an answer never writes the ledger itself.
  assert.equal(eventsOf(run).filter((e) => e.type === 'gate.answer').length, 0);
  const text = fs.readFileSync(answerFile(run), 'utf8');
  assert.match(text, /^---\napproved: yes\noccurrence: 1\nround: 1\nsubjectDigest: sha256:copy\n---/);
  assert.ok(text.includes('Approve the copy?') && text.includes('looks right'));

  assert.throws(() => answer(run, { answer: 'actually no', approved: false }), (err) => err.code === 'gate-already-answered');
  assert.equal(fs.readFileSync(answerFile(run), 'utf8'), text, 'the answered file did not change');

  // Consumed by the next holder of advance, once.
  // Taking advance is the drain, and draining again changes nothing.
  const drained = withHold(run, (hold) => drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold }));
  assert.equal(drained.answers, 0);
  assert.equal(eventsOf(run).filter((e) => e.type === 'gate.answer').length, 1);
  const event = eventsOf(run).find((e) => e.type === 'gate.answer');
  assert.deepEqual([event.payload.stepId, event.payload.approved, event.payload.subjectDigest, event.payload.occurrence, event.payload.round], ['ok', true, 'sha256:copy', 1, 1]);
  assert.throws(() => answer(run), (err) => err.code === 'gate-already-answered', 'still refused once consumed');
});

test('two processes answering one gate at once: exactly one round file is made, the other is refused by name', async () => {
  const run = gatedRun();
  const module = new URL('../../src/workflow/case-runtime.mjs', import.meta.url).href;
  const args = JSON.stringify({ mainRoot: run.repoRoot, caseId: run.caseId, events: eventsOf(run), stepId: 'ok', answer: 'looks right', approved: true, question: 'Approve the copy?', subjectDigest: 'sha256:copy' });
  const code = `import { recordGateAnswerRound } from ${JSON.stringify(module)};
    try { recordGateAnswerRound(${args}); console.log('answered'); } catch (err) { console.log(err.code); }`;
  const outcomes = await Promise.all([1, 2, 3].map(() => new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.once('exit', () => resolve(out.trim()));
  })));
  assert.equal(outcomes.filter((o) => o === 'answered').length, 1, outcomes.join());
  assert.ok(outcomes.filter((o) => o !== 'answered').every((o) => o === 'gate-already-answered'), outcomes.join());
});

test('a clarification does not settle the gate: rounds accumulate in one file until an approval, then it is immutable', () => {
  const run = gatedRun();
  answer(run, { answer: 'what budget?', approved: false });
  assert.throws(() => answer(run, { answer: 'second before the first is recorded' }), (err) => err.code === 'gate-already-answered', 'an unrecorded round blocks the next');
  withHold(run, (hold) => drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold }));
  assert.equal(answer(run, { answer: 'yes, 5k' }).round, 2);
  withHold(run, (hold) => drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold }));

  const text = fs.readFileSync(answerFile(run), 'utf8');
  assert.ok(text.includes('Clarification') && text.includes('Approved') && text.includes('what budget?') && text.includes('yes, 5k'));
  assert.throws(() => answer(run, { answer: 'again' }), (err) => err.code === 'gate-already-answered');
});

test('a gate that parks again is a new occurrence and can be answered again', () => {
  const run = gatedRun();
  answer(run);
  withHold(run, (hold) => {
    drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold });
    append(run, hold, 'gate.park', { stepId: 'ok', question: 'Approve the new copy?' });
  });
  const second = answer(run, { answer: 'the second copy is fine', subjectDigest: 'sha256:copy-2' });
  assert.deepEqual([second.occurrence, second.round], [2, 1]);
});

test('the file the Execution Core hands to later units still resolves through gate-answer refs', () => {
  const run = gatedRun();
  answer(run);
  const { refs } = resolveUnitInputs([`gate-answer:${run.caseId}/ok`], run.repoRoot);
  assert.equal(refs[0], answerFile(run));
});

test('a settle that could not take advance is a file the next holder appends first, and its reservation file goes with it', () => {
  const run = openCase();
  appendAll(run, [{ type: 'reservation', payload: { reservationId: 'r-1', activity: 'plan', writes: [], worktree: null, counters: { dispatches: 1, mutatingDispatches: 0 } } }]);
  writeReservationFile({ mainRoot: run.repoRoot, caseId: run.caseId, reservation: { reservationId: 'r-1', activity: 'plan', worktree: null } });
  writeSettlePending({ mainRoot: run.repoRoot, caseId: run.caseId, settle: { reservationId: 'r-1', outcome: 'pass', receipts: [], achieved: [], seatLaunchesUsed: 1 } });
  assert.equal(readReservationFiles(run.repoRoot, run.caseId).length, 1);

  // Taking advance is the drain: the settle is on the ledger before anything else reads it.
  const hold = acquireAdvanceLock(run.repoRoot, run.caseId);
  hold.release();
  const settles = eventsOf(run).filter((e) => e.type === 'settle');
  assert.equal(settles.length, 1);
  assert.equal(settles[0].payload.reservationId, 'r-1');
  assert.equal(readReservationFiles(run.repoRoot, run.caseId).length, 0);
  assert.equal(fs.readdirSync(path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId, 'settle-pending')).length, 0);

  // Idempotent: the same settle on a ledger that has it is not appended twice.
  writeSettlePending({ mainRoot: run.repoRoot, caseId: run.caseId, settle: { reservationId: 'r-1', outcome: 'pass', receipts: [], achieved: [] } });
  acquireAdvanceLock(run.repoRoot, run.caseId).release();
  assert.equal(eventsOf(run).filter((e) => e.type === 'settle').length, 1);
});

test('subject digests: files, trees and named subjects; an unknown subject is null, never a guess', () => {
  const root = makeFixtureDir('fgos-subject-');
  fs.mkdirSync(path.join(root, 'src', 'a'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'a', 'one.txt'), 'one');
  fs.writeFileSync(path.join(root, 'plan.md'), 'plan v1');

  const file = digestSubject({ files: ['plan.md'] }, root);
  assert.match(file, /^sha256:[0-9a-f]{64}$/);
  assert.equal(digestSubject({ files: ['plan.md'] }, root), file);
  fs.writeFileSync(path.join(root, 'plan.md'), 'plan v2');
  assert.notEqual(digestSubject({ files: ['plan.md'] }, root), file);
  assert.equal(digestSubject({ files: ['missing.md'] }, root), null, 'a declared file that is gone cannot be digested');

  const tree = digestSubject({ tree: ['src/a'] }, root);
  fs.writeFileSync(path.join(root, 'src', 'a', 'two.txt'), 'two');
  assert.notEqual(digestSubject({ tree: ['src/a'] }, root), tree, 'a file that appears under a path changes its digest');
  assert.notEqual(digestSubject({ tree: ['src/b'] }, root), null, 'a path with nothing under it is an empty tree, not unknown');

  assert.equal(digestSubject({ named: 'channel', value: { id: 7 } }, root), digestSubject({ named: 'channel', value: { id: 7 } }, root));
  assert.notEqual(digestSubject({ named: 'channel', value: { id: 8 } }, root), digestSubject({ named: 'channel', value: { id: 7 } }, root));
  assert.equal(digestSubject({}, root), null);
  assert.equal(digestText('x'), digestText('x'));
  assert.deepEqual(digestContextRefs(['gate-answer:r/s', 'unit-run:u/producer'], root), [], 'refs to another run are immutable files and are not digested here');
});
