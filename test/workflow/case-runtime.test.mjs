// test/workflow/case-runtime.test.mjs — gate answers as rounds nobody rewrites, settle-pending, and the one drain

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun, readWorkflowEvents } from '../../src/workflow/store.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { applySettle, drainCaseInbox, recordGateAnswerRound, unconsumedGateRounds, writeSettlePending } from '../../src/workflow/case-runtime.mjs';
import { bindWorktree, readBinding } from '../../src/workflow/case-bindings.mjs';
import { acquireDispatchCwdLock } from '../../src/run-supervisor/cwd-lock.mjs';
import { digestSubject, digestText, digestContextRefs } from '../../src/workflow/ref-digests.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { appendAll, append, eventsOf, FRAME, openCase, projectionOf, settle, withHold } from '../helpers/workflow-case-fixture.mjs';

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
  assert.match(text, /### Round at 20\d\d-\d\d-\d\dT[^ ]+ \(Approved\)/, 'the round is dated');

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

test('a settle that could not take advance is a file the next holder appends first and removes', () => {
  const run = openCase();
  appendAll(run, [{ type: 'reservation', payload: { reservationId: 'r-1', activity: 'plan', writes: [], worktree: null, counters: { dispatches: 1, mutatingDispatches: 0 } } }]);
  writeSettlePending({ mainRoot: run.repoRoot, caseId: run.caseId, settle: { reservationId: 'r-1', outcome: 'pass', receipts: [], achieved: [], seatLaunchesUsed: 1 } });

  // Taking advance is the drain: the settle is on the ledger before anything else reads it.
  const hold = acquireAdvanceLock(run.repoRoot, run.caseId);
  hold.release();
  const settles = eventsOf(run).filter((e) => e.type === 'settle');
  assert.equal(settles.length, 1);
  assert.equal(settles[0].payload.reservationId, 'r-1');
  assert.equal(fs.readdirSync(path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId, 'settle-pending')).length, 0);

  // Idempotent: the same settle on a ledger that has it is not appended twice.
  writeSettlePending({ mainRoot: run.repoRoot, caseId: run.caseId, settle: { reservationId: 'r-1', outcome: 'pass', receipts: [], achieved: [] } });
  acquireAdvanceLock(run.repoRoot, run.caseId).release();
  assert.equal(eventsOf(run).filter((e) => e.type === 'settle').length, 1);
});

test('taking advance while another process holds it is refused with its own code, naming the holder', () => {
  const run = openCase();
  withHold(run, () => {
    assert.throws(() => acquireAdvanceLock(run.repoRoot, run.caseId), (err) => err.code === 'case-advance-busy' && /already being advanced/.test(err.message));
  });
});

const inboxDir = (run, name) => path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId, name);

test('a settle file naming no reservation of the case is refused and kept, never applied', () => {
  const run = openCase();
  writeSettlePending({ mainRoot: run.repoRoot, caseId: run.caseId, settle: { reservationId: 'r-nobody', outcome: 'pass', receipts: [], achieved: [], seatLaunchesUsed: 1 } });
  const drained = withHold(run, (hold) => drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold }));
  assert.equal(drained.settles, 0);
  assert.equal(eventsOf(run).filter((e) => e.type === 'settle').length, 0);
  assert.match(drained.skipped[0].problem, /never made/);
  assert.equal(fs.readdirSync(inboxDir(run, 'settle-pending')).length, 1, 'the file stays for the owner to see');
});

test('the inbox is read as agent-written input: a pipe, a link and garbage are named and skipped, and the drain never waits on a pipe', { skip: process.platform === 'win32' }, () => {
  const run = gatedRun();
  const pending = inboxDir(run, 'settle-pending');
  fs.mkdirSync(pending, { recursive: true });
  execFileSync('mkfifo', [path.join(pending, 'pipe.json')]);
  fs.writeFileSync(path.join(pending, 'target.txt'), '{}');
  fs.symlinkSync(path.join(pending, 'target.txt'), path.join(pending, 'link.json'));
  fs.writeFileSync(path.join(pending, 'garbage.json'), '{"reservationId": ');
  const rounds = path.join(inboxDir(run, 'gate-answers'), 'ok.rounds');
  fs.mkdirSync(rounds, { recursive: true });
  execFileSync('mkfifo', [path.join(rounds, '1-1.json')]);

  const drained = withHold(run, (hold) => drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold }));
  assert.deepEqual(drained.skipped.map((s) => s.file).sort(), ['gate-answers/ok.rounds/1-1.json', 'settle-pending/garbage.json', 'settle-pending/link.json', 'settle-pending/pipe.json']);
  assert.ok(drained.skipped.every((s) => typeof s.problem === 'string' && s.problem.length > 0));
  assert.equal(fs.readdirSync(pending).length, 4, 'nothing was removed');
});

// --- a dead controller's reservation ---------------------------------------------------------

/** Put reservations on the ledger, each with its own bound worktree, under one hold so nothing releases them yet. */
function reserve(run, specs) {
  return withHold(run, (hold) => Object.fromEntries(specs.map(({ id, worktree = 'dir', unitRunId = `unit-run-${id}` }) => {
    let real = null;
    if (worktree === 'dir' || worktree === 'gone') {
      const dir = path.join(run.repoRoot, 'wt', id);
      fs.mkdirSync(dir, { recursive: true });
      real = fs.realpathSync(dir);
      if (worktree === 'dir') bindWorktree({ mainRoot: run.repoRoot, hold, caseId: run.caseId, worktree: real });
      else fs.rmSync(dir, { recursive: true });
    }
    append(run, hold, 'reservation', { reservationId: id, activity: 'build-a', writes: real ? ['src/a'] : [], worktree: real, counters: { dispatches: 1, mutatingDispatches: real ? 1 : 0 }, unitRunId });
    return [id, real];
  })));
}
const unitRecord = (run, unitRunId, text) => {
  const dir = path.join(run.repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'unit.json'), text);
};
const settledAs = (run) => Object.fromEntries(eventsOf(run).filter((e) => e.type === 'settle').map((e) => [e.payload.reservationId, e.payload.outcome]));

test('a hold releases the writing reservation of a dead controller as not-started, with no inbox directory present, and frees its binding', () => {
  const run = openCase();
  const { dead } = reserve(run, [{ id: 'dead' }]);
  assert.equal(fs.existsSync(inboxDir(run, 'settle-pending')) || fs.existsSync(inboxDir(run, 'gate-answers')), false, 'no inbox directory exists');
  assert.equal(readBinding({ mainRoot: run.repoRoot, worktree: dead, caseId: run.caseId }).answer, 'bound');

  acquireAdvanceLock(run.repoRoot, run.caseId).release();
  assert.deepEqual(settledAs(run), { dead: 'not-started' });
  assert.equal(projectionOf(run).liveReservations.length, 0);
  assert.equal(readBinding({ mainRoot: run.repoRoot, worktree: dead, caseId: run.caseId }).answer, 'unbound');
});

test('only a reservation proven dead is released: read-only, held custody, a resumable Unit run, a gone worktree and an unreadable record all stay', () => {
  const run = openCase();
  const planted = reserve(run, [
    { id: 'no-record' }, { id: 'settled-record' }, { id: 'gate', unitRunId: 'gate-run-1' },
    { id: 'read-only', worktree: null }, { id: 'held' }, { id: 'resumable' }, { id: 'gone', worktree: 'gone' }, { id: 'garbled' },
  ]);
  unitRecord(run, 'unit-run-settled-record', JSON.stringify({ execution: { status: 'settled' } }));
  unitRecord(run, 'unit-run-resumable', JSON.stringify({ execution: { status: 'running' } }));
  unitRecord(run, 'unit-run-garbled', '{"execution": ');
  const custody = acquireDispatchCwdLock(path.join(run.repoRoot, '.fgos'), planted.held);
  try {
    acquireAdvanceLock(run.repoRoot, run.caseId).release();
  } finally {
    custody.release();
  }
  assert.deepEqual(settledAs(run), { 'no-record': 'not-started', 'settled-record': 'not-started', gate: 'not-started' });
  assert.deepEqual(projectionOf(run).liveReservations.map((r) => r.reservationId).sort(), ['garbled', 'gone', 'held', 'read-only', 'resumable']);
  for (const stays of ['held', 'resumable', 'garbled']) {
    assert.equal(readBinding({ mainRoot: run.repoRoot, worktree: planted[stays], caseId: run.caseId }).answer, 'bound', `${stays} keeps its binding`);
  }
});

// --- a real settle wins over a release already on the ledger ------------------------------------

/** A writing reservation whose Unit run is settled with no controller left, released as not-started by the next hold. */
function releasedAfterSettling(id) {
  const run = openCase();
  const planted = reserve(run, [{ id }]);
  unitRecord(run, `unit-run-${id}`, JSON.stringify({ execution: { status: 'settled' } }));
  acquireAdvanceLock(run.repoRoot, run.caseId).release();
  assert.deepEqual(settledAs(run), { [id]: 'not-started' });
  return { run, worktree: planted[id] };
}
const realSettle = (id) => ({ ...settle(id, { milestone: 'plan-ready', subjectDigest: 'sha256:plan', activity: 'build-a', unitRunId: `unit-run-${id}` }).payload, settledAt: 'now' });
const settleCount = (run) => eventsOf(run).filter((e) => e.type === 'settle').length;

test('a reservation released as not-started by a hold and then settled for real ends settled with the real outcome and the milestone it earned', () => {
  const { run } = releasedAfterSettling('r1');
  assert.equal(projectionOf(run).frameRemaining.dispatches, FRAME.dispatches, 'the release refunded the dispatch');

  assert.equal(withHold(run, (hold) => applySettle({ mainRoot: run.repoRoot, caseId: run.caseId, hold, settle: realSettle('r1') })), true);
  const projection = projectionOf(run);
  assert.deepEqual(settledAs(run), { r1: 'pass' }, 'the later settle stands');
  assert.equal(projection.milestones['plan-ready'].state, 'achieved');
  assert.equal(projection.frameRemaining.dispatches, FRAME.dispatches - 1, 'the dispatch counts again');
  assert.equal(settleCount(run), 2, 'both settles are on the ledger, in order');
});

test('a real settle that waited in the settle-pending file supersedes a release a hold made first', () => {
  const { run } = releasedAfterSettling('r1');
  writeSettlePending({ mainRoot: run.repoRoot, caseId: run.caseId, settle: realSettle('r1') });
  const drained = withHold(run, (hold) => drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold }));
  assert.equal(drained.settles, 1);
  assert.equal(projectionOf(run).milestones['plan-ready'].state, 'achieved');
  assert.deepEqual(settledAs(run), { r1: 'pass' });
});

test('the superseding settle leaves alone a binding another reservation took on the same worktree after the release', () => {
  const { run, worktree } = releasedAfterSettling('r1');
  withHold(run, (hold) => {
    bindWorktree({ mainRoot: run.repoRoot, hold, caseId: run.caseId, worktree });
    append(run, hold, 'reservation', { reservationId: 'r2', activity: 'build-a', writes: ['src/a'], worktree, counters: { dispatches: 1, mutatingDispatches: 1 }, unitRunId: 'unit-run-r2' });
    applySettle({ mainRoot: run.repoRoot, caseId: run.caseId, hold, settle: realSettle('r1') });
  });
  assert.equal(readBinding({ mainRoot: run.repoRoot, worktree, caseId: run.caseId }).answer, 'bound', 'the newer reservation keeps its binding');
});

test('a real settle on the ledger is never followed by a release or by a second real settle', () => {
  const run = openCase();
  reserve(run, [{ id: 'r1' }]);
  unitRecord(run, 'unit-run-r1', JSON.stringify({ execution: { status: 'running' } }));
  assert.equal(withHold(run, (hold) => applySettle({ mainRoot: run.repoRoot, caseId: run.caseId, hold, settle: realSettle('r1') })), true);
  unitRecord(run, 'unit-run-r1', JSON.stringify({ execution: { status: 'settled' } }));
  acquireAdvanceLock(run.repoRoot, run.caseId).release();
  assert.equal(withHold(run, (hold) => applySettle({ mainRoot: run.repoRoot, caseId: run.caseId, hold, settle: { ...realSettle('r1'), outcome: 'fail' } })), false);
  assert.deepEqual(settledAs(run), { r1: 'pass' });
  assert.equal(settleCount(run), 1);
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

test('a gate that has not parked yet is refused by name and keeps no round', () => {
  const run = gatedRun();
  const other = validateWorkflow({ id: 'two-gates', steps: [{ id: 'g1', gate: { kind: 'human', question: 'one?' } }, { id: 'g2', dependsOn: ['g1'], gate: { kind: 'human', question: 'two?' } }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot: run.repoRoot, workflowId: other.id, workflow: other });
  const twoGates = { repoRoot: run.repoRoot, caseId: workflowRunId };
  appendAll(twoGates, [{ type: 'gate.park', payload: { stepId: 'g1', question: 'one?' } }]);
  assert.throws(() => answer(twoGates, { stepId: 'g2', question: 'two?' }), (err) => err.code === 'gate-not-parked' && /g2/.test(err.message));
  assert.equal(unconsumedGateRounds(twoGates.repoRoot, twoGates.caseId, eventsOf(twoGates)).length, 0, 'no round was kept');
  assert.deepEqual(answer(twoGates, { stepId: 'g1', question: 'one?' }), { stepId: 'g1', occurrence: 1, round: 1, settles: true });
});

/** Plant a round file the way a process that can write the case directory but not the ledger would. */
function plant(run, dirStep, name, record) {
  const dir = path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId, 'gate-answers', `${dirStep}.rounds`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), JSON.stringify({ stepId: dirStep, occurrence: 1, round: 1, answer: 'planted', approved: true, settles: true, mode: 'consent', question: 'Approve the copy?', subjectDigest: null, answeredAt: '2026-11-08T00:00:00.000Z', ...record }));
}
// Taking advance already drains, so a file is planted while advance is held and drained from that same hold.
const drain = (run, planted = () => {}) => withHold(run, (hold) => {
  planted();
  return drainCaseInbox({ mainRoot: run.repoRoot, caseId: run.caseId, hold });
});
const answersOf = (run) => eventsOf(run).filter((e) => e.type === 'gate.answer');

test('the drain leaves a planted round unfolded and names why: not a gate, not the open occurrence, a name or directory that disagrees', () => {
  const run = gatedRun();
  const drained = drain(run, () => {
    plant(run, 'a', '1-1.json', {});
    plant(run, 'ok', '2-1.json', { occurrence: 2 });
    plant(run, 'ok', '1-7.json', {});
    plant(run, 'other', '1-1.json', { stepId: 'ok' });
  });
  assert.equal(drained.answers, 0);
  assert.equal(answersOf(run).length, 0, 'nothing a planted file says reached the ledger');
  assert.equal(drained.refused.length, 4);
  assert.ok(drained.refused.some((r) => r.stepId === 'a' && /no gate of the guide/.test(r.problem)));
  assert.ok(drained.refused.some((r) => r.occurrence === 2 && /open one/.test(r.problem)));
  assert.ok(drained.refused.some((r) => /disagrees/.test(r.problem)));
  assert.ok(drained.refused.some((r) => /kept under gate "other"/.test(r.problem)));

  // A refused file neither settles the gate nor blocks the owner's real answer; that one is folded.
  assert.deepEqual(answer(run, { subjectDigest: null }), { stepId: 'ok', occurrence: 1, round: 2, settles: true });
  drain(run);
  assert.equal(answersOf(run).length, 1);
});

test('a second settling round for a gate that is already answered is not folded until the gate parks again', () => {
  const run = gatedRun();
  answer(run, { subjectDigest: null });
  drain(run);
  assert.equal(answersOf(run).length, 1);

  const again = drain(run, () => plant(run, 'ok', '1-2.json', { round: 2 }));
  assert.equal(again.answers, 0);
  assert.match(again.refused[0].problem, /already answered/);
  assert.equal(answersOf(run).length, 1);

  withHold(run, (hold) => append(run, hold, 'gate.park', { stepId: 'ok', question: 'Approve the new copy?' }));
  drain(run, () => plant(run, 'ok', '2-1.json', { occurrence: 2, round: 1 }));
  assert.equal(answersOf(run).length, 2, 'asked again, the gate takes an answer to its new occurrence');
});
