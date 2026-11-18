// test/portfolio/work-questions.test.mjs -- what the Work layer holds for the owner, as the doctor bridge's
// `work-questions` request answers it for `fgos questions`: open Workflow gates and `fgos ask` items.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { parseRequest, readWorkQuestions, serve, RESULT_PREFIX } from '../../src/setup/doctor-bridge.mjs';
import { runsRoot, isCaseId } from '../../src/runner/execution/case-run-paths.mjs';
import { readCaseProjection } from '../../src/workflow/case-projection.mjs';
import { addWork, listWork, putInAwaiting } from '../../src/state/store.mjs';
import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun } from '../../src/workflow/store.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { append } from '../helpers/workflow-case-fixture.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';

const ASK = '## Chuyện gì đang xảy ra\n\nThe output file has two possible owners and nobody chose one.\n\n## Nguyên nhân\n\nBoth modules write it today, checked in the code.\n\n## Các lựa chọn\n\n(a) module A; (b) module B.\n\n## Khuyến nghị\n\n(a), vì nó đã giữ file này.\n\n## Phạm vi của câu trả lời\n\nĐồng ý thì được đổi chủ sở hữu file, không được đổi định dạng.';

const readers = { runsRoot, isCaseId, readCaseProjection, listWork };

function parkedGate(root) {
  const workflow = validateWorkflow({ id: 'gated', steps: [{ id: 'approve', gate: { mode: 'consent', question: 'Ship it?' } }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot: root, workflowId: workflow.id, workflow });
  const hold = acquireAdvanceLock(root, workflowRunId);
  append({ repoRoot: root, caseId: workflowRunId }, hold, 'gate.park', { stepId: 'approve', question: 'Ship it?' });
  hold.release();
  return workflowRunId;
}

function snapshot(root) {
  const out = {};
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else out[p] = fs.readFileSync(p, 'utf8');
  });
  walk(root);
  return out;
}

test('an open gate of a parked case is listed with the command that answers it, and reading writes nothing', () => {
  const root = makeFixtureDir('fgos-work-questions-');
  const runId = parkedGate(root);
  const before = snapshot(root);

  const { gates, asks } = readWorkQuestions({ dir: root }, { ...readers, listWork: () => ({ work: {}, gates: {} }) });

  assert.deepEqual(gates, [{
    ref: `workflow:${runId}#approve`,
    question: 'Ship it?',
    answerDoor: `fgos workflow answer ${runId} --step approve --answer "<answer>"`,
  }]);
  assert.deepEqual(asks, []);
  assert.deepEqual(snapshot(root), before, 'reading writes nothing');
});

test('a workflow case whose ledger cannot be read is listed as unreadable, never dropped', () => {
  const root = makeFixtureDir('fgos-work-questions-');
  const runId = parkedGate(root);
  fs.writeFileSync(path.join(root, '.fgos', 'workflow-runs', runId, 'events.jsonl'), '{not json\n');

  const { gates } = readWorkQuestions({ dir: root }, { ...readers, listWork: () => ({ work: {}, gates: {} }) });

  assert.equal(gates.length, 1);
  assert.equal(gates[0].ref, `workflow:${runId}`);
  assert.match(gates[0].question, /^unreadable workflow case: .*corrupt/);
  assert.equal(gates[0].answerDoor, `fgos workflow status ${runId}`);
});

test('an item parked by `fgos ask` is listed with its question and the command that answers it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-work-questions-ask-'));
  const storeDir = initializeWorkRepository(root);
  addWork(storeDir, {
    id: 'item-x', title: 'Produce the output file', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: 'x', workflowStep: 'discovery',
  });
  putInAwaiting(storeDir, { id: 'item-x', ask: ASK });

  const { asks, gates } = readWorkQuestions({ dir: path.dirname(storeDir) }, readers);

  assert.deepEqual(gates, []);
  assert.deepEqual(asks, [{
    ref: 'work:item-x',
    title: 'Produce the output file',
    question: ASK,
    answerDoor: 'fgos answer item-x --text "<answer>"',
  }]);
});

test('the work-questions request answers one data line and an end line, and a failed read is one refusal line', async () => {
  assert.deepEqual(parseRequest('{"phase":"work-questions","ids":[],"dir":"/p"}'), { phase: 'work-questions', ids: [], dir: '/p' });
  assert.throws(() => parseRequest('{"phase":"work-questions","ids":["a"],"dir":"/p"}'), /no list of ids/);

  const lines = [];
  const data = { gates: [], asks: [] };
  const code = await serve('{"phase":"work-questions","ids":[],"dir":"/p"}', { write: (l) => lines.push(l), workQuestions: async ({ dir }) => ({ ...data, dir }), nodeVersion: 'v0' });
  assert.equal(code, 0);
  assert.equal(lines.length, 2);
  assert.ok(lines.every((l) => l.startsWith(RESULT_PREFIX)));
  assert.deepEqual(JSON.parse(lines[0].slice(RESULT_PREFIX.length)), { kind: 'data', data: { gates: [], asks: [], dir: '/p' } });
  assert.deepEqual(JSON.parse(lines[1].slice(RESULT_PREFIX.length)), { kind: 'end', count: 1, nodeVersion: 'v0' });

  const refused = [];
  const failed = await serve('{"phase":"work-questions","ids":[],"dir":"/p"}', { write: (l) => refused.push(l), workQuestions: async () => { throw new Error('corrupt-log'); } });
  assert.equal(failed, 2);
  assert.equal(refused.length, 1);
  assert.deepEqual(JSON.parse(refused[0].slice(RESULT_PREFIX.length)), { kind: 'refusal', message: 'corrupt-log' });
});
