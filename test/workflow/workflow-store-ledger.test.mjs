// test/workflow/workflow-store-ledger.test.mjs — the run ledger is written through one door that holds
// `advance`, is read fail-closed, and is shortened only by an explicit recovery of an unfinished tail.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  validateWorkflow,
  createWorkflowRun,
  appendWorkflowEvent,
  readWorkflowEvents,
  recoverWorkflowLedgerTail,
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
} from '../../src/workflow/index.mjs';
import { acquireAdvanceLock } from '../../src/workflow/runner.mjs';
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

test('no code but the store names the run ledger file or writes to it, and the store writes through one fsynced function', () => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.mjs') ? [full] : [];
  });
  const namers = [...walk('src'), ...walk('bin')].filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return /['"`]events\.jsonl['"`]/.test(source) && source.includes('workflow-runs');
  });
  assert.deepEqual(namers, [path.join('src', 'workflow', 'store.mjs')]);

  const store = fs.readFileSync('src/workflow/store.mjs', 'utf8');
  assert.equal(/appendFileSync|writeFileSync/.test(store), false, 'the store has no unsynced write');
  const writeDurably = store.slice(store.indexOf('function writeDurably'), store.indexOf('function fsyncDirectory'));
  assert.ok(writeDurably.indexOf('writeSync') < writeDurably.indexOf('fsyncSync') && writeDurably.indexOf('fsyncSync') < writeDurably.indexOf('closeSync'), 'write, then fsync, then close');
});
