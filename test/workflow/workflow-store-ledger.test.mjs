// test/workflow/workflow-store-ledger.test.mjs — the run ledger is written through one door that holds
// `advance`, is read fail-closed, and is shortened only by an explicit recovery of an unfinished tail.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun, appendWorkflowEvent, readWorkflowEvents, recoverWorkflowLedgerTail, projectWorkflowState } from '../../src/workflow/store.mjs';
import { startWorkflow, statusWorkflow, answerWorkflow } from '../../src/workflow/index.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const WORKFLOW = { id: 'test/ledger', steps: [{ id: 's1', dependsOn: [] }] };

function freshRun() {
  const repoRoot = makeFixtureDir('fgos-ledger-');
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: WORKFLOW.id, workflow: WORKFLOW });
  const file = path.join(repoRoot, '.fgos', 'workflow-runs', workflowRunId, 'events.jsonl');
  return { repoRoot, workflowRunId, file };
}

const append = (run, hold, type, payload = {}) => appendWorkflowEvent({ repoRoot: run.repoRoot, workflowRunId: run.workflowRunId, event: { type, payload }, hold });
const readError = (run) => {
  try {
    readWorkflowEvents(run);
  } catch (err) {
    return err;
  }
  return null;
};

test('an append without the run\'s advance hold is refused, and so is one with a released or another run\'s hold', () => {
  const run = freshRun();
  const other = freshRun();
  const event = { type: 'step.start', payload: { stepId: 's1' } };
  const attempt = (hold) => () => appendWorkflowEvent({ repoRoot: run.repoRoot, workflowRunId: run.workflowRunId, event, hold });

  assert.throws(attempt(undefined), /requires the advance lock/);
  assert.throws(attempt({ workflowRunId: run.workflowRunId, release() {} }), /requires the advance lock/, 'a look-alike is not a hold');

  const otherHold = acquireAdvanceLock(other.repoRoot, other.workflowRunId);
  assert.throws(attempt(otherHold), /requires the advance lock/);
  otherHold.release();

  const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
  assert.equal(append(run, hold, 'step.start', { stepId: 's1' }).seq, 2);
  hold.release();
  assert.throws(attempt(hold), /requires the advance lock/, 'a released hold proves nothing');
  assert.equal(readWorkflowEvents(run).length, 2);
});

test('appended events keep a dense seq and creating a run never reuses an id', () => {
  const run = freshRun();
  const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
  for (let i = 0; i < 5; i += 1) append(run, hold, 'step.start', { stepId: 's1' });
  hold.release();
  assert.deepEqual(readWorkflowEvents(run).map((e) => e.seq), [1, 2, 3, 4, 5, 6]);
  assert.throws(
    () => createWorkflowRun({ repoRoot: run.repoRoot, workflowRunId: run.workflowRunId, workflowId: WORKFLOW.id, workflow: WORKFLOW }),
    /already exists/,
  );
});

test('a line that does not parse in the middle of the ledger fails the read, naming the file and the line', () => {
  const run = freshRun();
  const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
  append(run, hold, 'step.start', { stepId: 's1' });
  append(run, hold, 'step.complete', { stepId: 's1' });
  hold.release();
  const lines = fs.readFileSync(run.file, 'utf8').split('\n');
  lines[1] = '{"seq":2,"ty';
  fs.writeFileSync(run.file, lines.join('\n'));

  const err = readError(run);
  assert.equal(err.code, 'workflow-ledger-corrupt');
  assert.ok(err.message.includes(run.file) && err.message.includes('line 2'), err.message);
});

test('a repeated or skipped seq fails the read', () => {
  for (const [name, seq] of [['repeated', 2], ['skipped', 4]]) {
    const run = freshRun();
    const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
    append(run, hold, 'step.start', { stepId: 's1' });
    hold.release();
    fs.appendFileSync(run.file, `${JSON.stringify({ seq, ts: 'x', type: 'step.complete', payload: { stepId: 's1' } })}\n`);
    fs.appendFileSync(run.file, `${JSON.stringify({ seq: 3, ts: 'x', type: 'workflow.complete', payload: {} })}\n`);
    assert.equal(readError(run)?.code, 'workflow-ledger-corrupt', `${name} seq`);
  }
});

test('an unfinished last line is reported, never dropped by the reader, even when it parses', () => {
  for (const tail of ['{"seq":3,"ty', JSON.stringify({ seq: 3, ts: 'x', type: 'step.start', payload: { stepId: 's1' } })]) {
    const run = freshRun();
    const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
    append(run, hold, 'step.start', { stepId: 's1' });
    hold.release();
    fs.appendFileSync(run.file, tail);
    assert.equal(readError(run)?.code, 'workflow-ledger-unterminated');
  }
});

test('recovery drops only the unfinished last line, under the advance hold, and records that it did', () => {
  const run = freshRun();
  const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
  append(run, hold, 'step.start', { stepId: 's1' });
  const before = fs.readFileSync(run.file, 'utf8');
  const tail = '{"seq":3,"ty';
  fs.appendFileSync(run.file, tail);

  assert.throws(() => recoverWorkflowLedgerTail({ ...run, hold: undefined }), /requires the advance lock/);
  assert.equal(fs.readFileSync(run.file, 'utf8'), before + tail, 'a refused recovery changes nothing');

  assert.deepEqual(recoverWorkflowLedgerTail({ ...run, hold }), { recovered: true, droppedBytes: Buffer.byteLength(tail) });
  assert.deepEqual(recoverWorkflowLedgerTail({ ...run, hold }), { recovered: false, droppedBytes: 0 }, 'a finished ledger is left alone');
  hold.release();

  const events = readWorkflowEvents(run);
  assert.deepEqual(events.map((e) => [e.seq, e.type]), [[1, 'workflow.start'], [2, 'step.start'], [3, 'ledger.recovered']]);
  assert.deepEqual(events[2].payload, { droppedBytes: Buffer.byteLength(tail) });
  assert.ok(fs.readFileSync(run.file, 'utf8').startsWith(before), 'every finished line is untouched');
});

test('a run id that is not one case-id segment reaches no ledger path: read, append, create and the lock all refuse it by name', () => {
  const run = freshRun();
  const outside = path.join(run.repoRoot, '.fgos', 'x');
  for (const bad of ['../x', '.bindings', '..']) {
    const refused = (fn) => assert.throws(fn, (err) => err.code === 'invalid-case-id', `refused: ${bad}`);
    refused(() => readWorkflowEvents({ repoRoot: run.repoRoot, workflowRunId: bad }));
    refused(() => createWorkflowRun({ repoRoot: run.repoRoot, workflowRunId: bad, workflowId: WORKFLOW.id, workflow: WORKFLOW }));
    refused(() => acquireAdvanceLock(run.repoRoot, bad));
  }
  assert.equal(fs.existsSync(outside), false, 'nothing was made outside the runs directory');
  assert.equal(fs.existsSync(path.join(run.repoRoot, '.fgos', 'workflow-runs', '.bindings')), false);
});

test('a write that stores only part of a ledger line is finished, and one that stores nothing is refused', (t) => {
  const run = freshRun();
  const hold = acquireAdvanceLock(run.repoRoot, run.workflowRunId);
  try {
    const realWrite = fs.writeSync;
    const half = t.mock.method(fs, 'writeSync', (fd, buffer, offset, length) => realWrite(fd, buffer, offset, Math.ceil(length / 2)));
    append(run, hold, 'step.start', { stepId: 's1' });
    half.mock.restore();
    const events = readWorkflowEvents(run);
    assert.deepEqual(events.map((e) => e.type), ['workflow.start', 'step.start'], 'the line is whole on disk');

    const before = fs.readFileSync(run.file, 'utf8');
    t.mock.method(fs, 'writeSync', () => 0);
    assert.throws(() => append(run, hold, 'step.complete', { stepId: 's1', outcome: 'pass' }), (err) => err.code === 'ledger-short-write');
    t.mock.restoreAll();
    assert.ok(fs.readFileSync(run.file, 'utf8').startsWith(before), 'finished lines are untouched');
  } finally { hold.release(); }
});

test('the next advance of a run whose ledger ends in an unfinished line repairs it before reading', async () => {
  const repoRoot = setupWorkflowFixtureRepo({ prefix: 'fgos-ledger-run-', readme: '# Ledger', gitName: 'Ledger Test', capabilities: [], workerBody: '' });
  const workflow = validateWorkflow({ id: 'test/ledger-gate', steps: [{ id: 'gate', gate: { kind: 'human', question: 'Go on?' } }] });
  const parked = await startWorkflow({ workflow, repoRoot, cwd: repoRoot });
  assert.equal(parked.status, 'parked');
  const id = parked.workflowRunId;
  fs.appendFileSync(path.join(repoRoot, '.fgos', 'workflow-runs', id, 'events.jsonl'), '{"seq":99,"ty');

  assert.throws(() => statusWorkflow(id, { repoRoot, cwd: repoRoot }), /without its newline/);
  const done = await answerWorkflow(id, { repoRoot, cwd: repoRoot, stepId: 'gate', answer: 'yes', approved: true });
  assert.equal(done.status, 'completed');
  const types = readWorkflowEvents({ repoRoot, workflowRunId: id }).map((e) => e.type);
  assert.ok(types.includes('ledger.recovered'));
  assert.ok(types.indexOf('ledger.recovered') < types.indexOf('gate.answer'), 'repaired before the answer was recorded');
});

test('a ledger written when the Playbook had an integrate step still folds and prints', () => {
  const repoRoot = makeFixtureDir('fgos-ledger-old-');
  const workflow = { id: 'old/integrate', steps: [
    { id: 'write', kind: 'standard', dependsOn: [], units: [{ id: 'u1', template: { capability: 'docs:write', writes: ['out.txt'] } }] },
    { id: 'land', kind: 'integrate', target: 'main', dependsOn: ['write'], units: [] },
  ] };
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow });
  const hold = acquireAdvanceLock(repoRoot, workflowRunId);
  try {
    for (const [type, payload] of [
      ['step.start', { stepId: 'write' }],
      ['unit.scheduled', { stepId: 'write', unitId: 'u1', branch: `wf/${workflowRunId}/u1`, worktreePath: '/gone/wt' }],
      ['unit.complete', { stepId: 'write', unitId: 'u1', outcome: 'pass' }],
      ['step.complete', { stepId: 'write', outcome: 'pass' }],
      ['step.start', { stepId: 'land' }],
      ['step.complete', { stepId: 'land', outcome: 'pass' }],
      ['workflow.complete', { outcome: 'pass' }],
    ]) appendWorkflowEvent({ repoRoot, workflowRunId, event: { type, payload }, hold });
  } finally { hold.release(); }

  const state = projectWorkflowState(readWorkflowEvents({ repoRoot, workflowRunId }));
  assert.equal(state.status, 'completed');
  assert.equal(state.steps.land.status, 'completed');
  assert.equal(state.steps.write.units.u1.outcome, 'pass');
  const printed = statusWorkflow(workflowRunId, { repoRoot, cwd: repoRoot });
  assert.equal(printed.status, 'completed');
  assert.equal(printed.steps.land.status, 'completed');
});

test('no code but the store names the run ledger file or writes to it, and the store writes through one fsynced function', () => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.mjs') ? [full] : [];
  });
  const namers = [...walk('src'), ...walk('bin')].filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return /['"`]events\.jsonl['"`]/.test(source) && (source.includes('workflow-runs') || source.includes('runDirOf'));
  });
  assert.deepEqual(namers, [path.join('src', 'workflow', 'store.mjs')]);

  const store = fs.readFileSync('src/workflow/store.mjs', 'utf8');
  assert.equal(/appendFileSync|writeFileSync/.test(store), false, 'the store has no unsynced write');
  const writeDurably = store.slice(store.indexOf('function writeDurably'), store.indexOf('export function fsyncDirectory'));
  assert.ok(writeDurably.indexOf('writeSync') < writeDurably.indexOf('fsyncSync') && writeDurably.indexOf('fsyncSync') < writeDurably.indexOf('closeSync'), 'write, then fsync, then close');
});

const foldOf = (workflow, rows) => projectWorkflowState([
  { type: 'workflow.start', payload: { workflowRunId: 'r1', workflowId: workflow.id, workflow } },
  ...rows.map(([type, payload]) => ({ type, payload })),
].map((event, i) => ({ seq: i + 1, ts: '2026-11-08T00:00:00.000Z', ...event })));

const TWO_UNITS = { id: 'fold/reopen', steps: [
  { id: 's1', dependsOn: [], units: [{ id: 'a', template: {} }, { id: 'b', template: {} }] },
  { id: 's2', dependsOn: ['s1'], units: [] },
] };
const FAILED_ROWS = (outcome, extraResult = {}) => [
  ['step.start', { stepId: 's1' }],
  ['unit.scheduled', { stepId: 's1', unitId: 'a' }],
  ['unit.started', { stepId: 's1', unitId: 'a', unitRunId: 'run-a' }],
  ['unit.complete', { stepId: 's1', unitId: 'a', unitRunId: 'run-a', outcome: 'pass', results: [] }],
  ['unit.scheduled', { stepId: 's1', unitId: 'b', worktreePath: '/wt/b', branch: 'wf/r1/b', baseRef: 'HEAD', baseSha: 'abc' }],
  ['unit.started', { stepId: 's1', unitId: 'b', unitRunId: 'run-b' }],
  ['unit.complete', { stepId: 's1', unitId: 'b', unitRunId: 'run-b', outcome, results: [{ seat: 'producer', outcome, runResult: {}, ...extraResult }] }],
  ['step.fail', { stepId: 's1', outcome, unitId: 'b', reason: `unit b ended ${outcome}` }],
  ['workflow.fail', { outcome, stepId: 's1', reason: `unit b ended ${outcome}` }],
  ['workflow.worktrees', { removed: [], kept: [{ stepId: 's1', unitId: 'b', worktreePath: '/wt/b' }] }],
];

test('a step started again after it failed on infrastructure reopens the run and only the units that did not reach a verdict, and the worktrees settle again', () => {
  for (const outcome of ['execution-failure', 'not-started']) {
    const failed = foldOf(TWO_UNITS, FAILED_ROWS(outcome));
    assert.equal(failed.status, 'failed');
    assert.equal(failed.steps.s1.units.b.rerunnable, true, `${outcome} is an infrastructure ending`);
    assert.equal(failed.steps.s1.units.a.rerunnable, undefined, 'a unit that passed is not rerunnable');

    const reopened = foldOf(TWO_UNITS, [...FAILED_ROWS(outcome), ['step.start', { stepId: 's1' }]]);
    assert.equal(reopened.status, 'running');
    assert.equal(reopened.outcome, null);
    assert.equal(reopened.worktrees, null, 'a second settle is allowed');
    assert.equal(reopened.steps.s1.status, 'running');
    assert.equal(reopened.steps.s1.reason, undefined);
    assert.equal(reopened.steps.s1.units.a.status, 'completed', 'the unit that passed is not run again');
    const b = reopened.steps.s1.units.b;
    assert.equal(b.status, 'pending');
    assert.deepEqual([b.worktreePath, b.branch, b.baseSha, b.unitRunId], ['/wt/b', 'wf/r1/b', 'abc', 'run-b'], 'the failed attempt stays as the predecessor');
    assert.equal(b.outcome, undefined);
  }
});

test('a unit that Execution says ended on infrastructure is rerunnable whatever its outcome string is, and one it says did not is terminal', () => {
  const rows = (completeFacts) => [
    ['step.start', { stepId: 's1' }],
    ['unit.scheduled', { stepId: 's1', unitId: 'b' }],
    ['unit.started', { stepId: 's1', unitId: 'b', unitRunId: 'run-b' }],
    ['unit.complete', { stepId: 's1', unitId: 'b', unitRunId: 'run-b', results: [{ seat: 'producer', outcome: 'x', runResult: {} }], ...completeFacts }],
  ];
  const unitB = (facts) => foldOf(TWO_UNITS, rows(facts)).steps.s1.units.b;
  assert.equal(unitB({ outcome: 'a-new-outcome', infrastructure: true }).rerunnable, true);
  assert.notEqual(unitB({ outcome: 'execution-failure', infrastructure: false }).rerunnable, true, 'Execution said it did not end on infrastructure');
  const refusedSeat = foldOf(TWO_UNITS, [
    ...rows({ outcome: 'execution-failure', infrastructure: true }).slice(0, 3),
    ['unit.complete', { stepId: 's1', unitId: 'b', unitRunId: 'run-b', outcome: 'execution-failure', infrastructure: true, results: [{ seat: 'producer', outcome: 'execution-failure', refused: { reason: 'policy', detail: 'x' } }] }],
  ]).steps.s1.units.b;
  assert.notEqual(refusedSeat.rerunnable, true, 'a refused seat is Workflow\'s own verdict and stays terminal');
});

test('a step started again after a verdict reopens nothing: refused, out-of-scope, findings and a settled seat verdict stay terminal', () => {
  const verdicts = [
    FAILED_ROWS('findings'),
    FAILED_ROWS('policy-refusal'),
    FAILED_ROWS('execution-failure', { refused: { reason: 'policy', detail: 'x' } }),
    FAILED_ROWS('execution-failure', { seat: 'reviewer', posture: { verdict: true }, outcome: 'findings' }),
  ];
  for (const rows of verdicts) {
    const state = foldOf(TWO_UNITS, [...rows, ['step.start', { stepId: 's1' }]]);
    assert.equal(state.steps.s1.units.b.status, 'completed', JSON.stringify(rows[6]));
    assert.notEqual(state.steps.s1.units.b.rerunnable, true);
  }
});

test('a unit.complete written with the full seat evidence folds as before: the new ledger is a subset of the old one', () => {
  const full = foldOf(TWO_UNITS, [
    ['step.start', { stepId: 's1' }],
    ['unit.scheduled', { stepId: 's1', unitId: 'a' }],
    ['unit.complete', { stepId: 's1', unitId: 'a', outcome: 'pass', results: [{ seat: 'producer', role: 'producer', round: 1, outcome: 'pass', binding: { executor: 'e' }, runResult: { executorId: 'e', evidence: { changedFiles: ['x'] }, agentClaim: { summary: 's' }, settleReports: [] } }] }],
  ]);
  const slim = foldOf(TWO_UNITS, [
    ['step.start', { stepId: 's1' }],
    ['unit.scheduled', { stepId: 's1', unitId: 'a' }],
    ['unit.complete', { stepId: 's1', unitId: 'a', outcome: 'pass', results: [{ seat: 'producer', role: 'producer', round: 1, outcome: 'pass', binding: { executor: 'e' }, runResult: { executorId: 'e', agentClaim: { summary: 's' }, settleReports: [] } }] }],
  ]);
  assert.equal(full.steps.s1.units.a.outcome, slim.steps.s1.units.a.outcome);
  assert.equal(slim.steps.s1.units.a.results[0].runResult.agentClaim.summary, 's');
});

// The fold of a case's events into the state a run is read by: what a step, a gate and a unit look like after each event.
function foldRun(workflow, extra = {}) {
  const repoRoot = makeFixtureDir('fgos-ledger-fold-');
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow, ...extra });
  const read = () => projectWorkflowState(readWorkflowEvents({ repoRoot, workflowRunId }));
  const appendAll = (...events) => {
    const hold = acquireAdvanceLock(repoRoot, workflowRunId);
    try {
      for (const [type, payload] of events) appendWorkflowEvent({ repoRoot, workflowRunId, event: { type, payload }, hold });
    } finally {
      hold.release();
    }
  };
  return { repoRoot, workflowRunId, read, appendAll };
}

test('a gate parks the run while its question is open and an answer releases it, keeping the answer on the step', () => {
  const run = foldRun({
    id: 'test/store-wf',
    steps: [
      { id: 's1', dependsOn: [] },
      { id: 's2', dependsOn: ['s1'], gate: { kind: 'human', question: 'Continue?' } },
    ],
  });
  const started = run.read();
  assert.equal(started.status, 'running');
  assert.equal(started.steps.s1.status, 'pending');
  assert.equal(readWorkflowEvents(run).length, 1);

  run.appendAll(['step.start', { stepId: 's1' }], ['step.complete', { stepId: 's1', outcome: 'pass' }], ['gate.park', { stepId: 's2', question: 'Continue?' }]);
  const parked = run.read();
  assert.equal(parked.status, 'parked');
  assert.equal(parked.questions.length, 1);
  assert.equal(parked.questions[0].question, 'Continue?');

  run.appendAll(['gate.answer', { stepId: 's2', answer: 'yes', approved: true }]);
  const answered = run.read();
  assert.equal(answered.status, 'running');
  assert.equal(answered.questions.length, 0);
  assert.equal(answered.steps.s2.answer, 'yes');
});

test('a completed unit keeps the id of the Unit run that produced it, and a scheduled one has none yet', () => {
  const workflow = validateWorkflow({
    id: 'unit-run-id-projection',
    steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', objective: 'x' } }] }],
  });
  const run = foldRun(workflow);
  const unitOf = () => run.read().steps.s1.units.u1;

  run.appendAll(['unit.scheduled', { stepId: 's1', unitId: 'u1' }]);
  assert.equal(unitOf().unitRunId, undefined, 'a scheduled unit has no Unit run id yet');
  run.appendAll(['unit.complete', { stepId: 's1', unitId: 'u1', unitRunId: 'unit-run-123-abcd', outcome: 'pass', results: [] }]);
  assert.equal(unitOf().unitRunId, 'unit-run-123-abcd');
});

test('what a run was started with is on its start event and comes back from every later read: request, stance options, context refs, effort, timeout, account and seats; a run started with none of them carries none', () => {
  const seats = { seats: ['a lens', '@finance-controller'], baseId: 'seat-base', personas: [{ seat: 'member-2', name: 'finance-controller', digest: 'abc', text: 't' }] };
  const run = foldRun(WORKFLOW, {
    request: 'Which retainer?', stanceOptions: ['incremental', 'full'], contextRefs: ['owner.txt'], seats, effort: 'high', timeoutMs: 5_400_000, account: 'node/acct-test',
  });
  const [start] = readWorkflowEvents(run);
  assert.deepEqual(
    [start.payload.request, start.payload.stanceOptions, start.payload.contextRefs, start.payload.effort, start.payload.timeoutMs, start.payload.account],
    ['Which retainer?', ['incremental', 'full'], ['owner.txt'], 'high', 5_400_000, 'node/acct-test'],
  );
  assert.deepEqual(start.payload.seats, seats);

  run.appendAll(['step.start', { stepId: 's1' }], ['step.complete', { stepId: 's1', outcome: 'pass' }], ['workflow.complete', { outcome: 'pass' }]);
  const state = run.read();
  assert.equal(state.status, 'completed');
  assert.deepEqual(
    [state.request, state.stanceOptions, state.contextRefs, state.effort, state.timeoutMs, state.account],
    ['Which retainer?', ['incremental', 'full'], ['owner.txt'], 'high', 5_400_000, 'node/acct-test'],
  );
  assert.deepEqual(state.seats, seats);

  // A run started with none of them projects none: no seat data, no effort, timeout or account keys.
  const plainRun = foldRun(WORKFLOW);
  const plain = plainRun.read();
  assert.deepEqual([plain.request, plain.stanceOptions, plain.contextRefs], [null, [], []]);
  const [plainStart] = readWorkflowEvents(plainRun);
  for (const key of ['seats', 'effort', 'timeoutMs', 'account']) {
    assert.equal(key in plainStart.payload, false, `start event: ${key}`);
    assert.equal(key in plain, false, `projection: ${key}`);
  }
});
