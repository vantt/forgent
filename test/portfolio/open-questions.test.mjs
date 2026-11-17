// test/portfolio/open-questions.test.mjs -- the open owner questions across the discussion, plan and execution stages

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { collectOpenQuestions, renderOpenQuestions } from '../../src/portfolio/open-questions.mjs';
import { sectionText } from '../../src/portfolio/plan-sections.mjs';
import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun } from '../../src/workflow/store.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { append } from '../helpers/workflow-case-fixture.mjs';

const put = (root, rel, text) => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};

const QUESTIONS = `# Questions

| id | status | question | answer |
|----|--------|----------|--------|
| Q1 | open | Which store owns the index? | |
| Q2 | answered | Already settled? | yes |
`;
const planWith = (status, questions) => `---\ntitle: T\nstatus: ${status}\n---\n\n# Plan\n\n## Outcome\nx\n\n## Owner questions\n${questions}\n\n## Risks\nnone\n`;

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

test('one open question per stage yields one batch of three, tagged by topic and stage, and answered ones are absent', () => {
  const root = makeFixtureDir('fgos-open-questions-');
  put(root, 'docs/discussions/index-store/QUESTIONS.md', QUESTIONS);
  put(root, 'plans/260101-0000-draft-plan/plan.md', planWith('draft', '- Which region first?'));
  put(root, 'plans/260101-0001-ready-plan/plan.md', planWith('ready', '- Already approved question?'));
  put(root, 'plans/260101-0002-no-questions/plan.md', planWith('draft', 'None.'));
  const runId = parkedGate(root);
  const before = snapshot(root);

  const items = collectOpenQuestions(root);

  assert.deepEqual(items.map((i) => [i.stage, i.topic]), [
    ['discussion', 'index-store'], ['plan', '260101-0000-draft-plan'], ['execution', runId],
  ]);
  assert.equal(items[0].question, 'Which store owns the index?');
  assert.equal(items[0].ref, 'docs/discussions/index-store/QUESTIONS.md#Q1');
  assert.match(items[1].question, /Which region first\?/);
  assert.equal(items[2].question, 'Ship it?');
  assert.equal(items[2].answerDoor, `fgos workflow answer ${runId} --step approve --answer "<answer>"`);
  assert.ok(items.every((i) => i.answerDoor));
  assert.deepEqual(snapshot(root), before, 'reading writes nothing');

  const text = renderOpenQuestions(items);
  assert.match(text, /3 open owner questions, 3 topics/);
  assert.match(text, /\[discussion\].*\n.*Which store owns/);
});

test('a workflow case whose ledger cannot be read is listed as unreadable, never dropped', () => {
  const root = makeFixtureDir('fgos-open-questions-');
  const runId = parkedGate(root);
  fs.writeFileSync(path.join(root, '.fgos', 'workflow-runs', runId, 'events.jsonl'), '{not json\n');

  const items = collectOpenQuestions(root);

  assert.equal(items.length, 1);
  assert.equal(items[0].stage, 'execution');
  assert.equal(items[0].ref, `workflow:${runId}`);
  assert.match(items[0].question, /^unreadable workflow case: .*corrupt/);
  assert.equal(items[0].answerDoor, `fgos workflow status ${runId}`);
});

test('nothing open renders one plain line', () => {
  assert.equal(renderOpenQuestions(collectOpenQuestions(makeFixtureDir('fgos-open-questions-empty-'))), 'No open owner questions.');
});

test('a plan section ends at the next heading of its own or a higher level', () => {
  const body = '# P\n\n## Owner questions\nq1\n### Detail\nq2\n\n## Risks\nr\n';
  assert.equal(sectionText(body, 'owner questions'), 'q1\n### Detail\nq2');
  assert.equal(sectionText('# P\n', 'owner questions'), null);
});
