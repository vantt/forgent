// test/workflow/unit-handoff.test.mjs — what a Workflow hands from one step to the next: the objective and
// the inputs a unit is given from the owner's request, the earlier steps and the owner's gate answers (read
// from a hand-built case state), and the "missing expertise" a gate question quotes from a settled producer packet.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildUnitHandoff, unitPatternOf, renderGateQuestion } from '../../src/workflow/unit-handoff.mjs';
import { unitFieldsOfTemplate } from '../../src/workflow/steps.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { HandoffRefError, OWN_PREVIOUS_NAME, SEAT_PLACEHOLDER } from '../../src/runner/execution/handoff-refs.mjs';

const GATE = { id: 'close', gate: { kind: 'human', mode: 'input', question: 'Bring in {{report:synthesis/synthesize-recommendation:missing expertise}} or not?' } };

/**
 * A main checkout whose synthesis producer settled `report`, the way the runner leaves it, with an
 * optional `packet-1.json` beside the report: written before settlement, or touched a day after it.
 */
function settledProducer({ report, packet = null, touchedAfterSettle = false }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gate-packet-'));
  const unitRunId = 'unit-run-gate';
  const runDir = path.join(root, '.fgos', 'assignments', unitRunId, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportFile = path.join(runDir, 'report-1.md');
  fs.writeFileSync(reportFile, report);
  const settledMs = Date.now();
  if (packet !== null) {
    const packetFile = path.join(runDir, 'packet-1.json');
    fs.writeFileSync(packetFile, packet);
    const mtime = new Date(settledMs + (touchedAfterSettle ? 86400000 : -60000));
    fs.utimesSync(packetFile, mtime, mtime);
  }
  const rel = path.relative(root, reportFile);
  const runResult = {
    settledAt: new Date(settledMs).toISOString(),
    settleReports: [{ path: rel, sha256: crypto.createHash('sha256').update(report).digest('hex') }],
    evidence: { artifacts: [rel] },
    classification: { outcome: { category: 'ok' } },
  };
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(runResult));
  const state = { steps: { synthesis: { units: { 'synthesize-recommendation': {
    status: 'completed', unitRunId, results: [{ role: 'producer', round: 1, runResult }],
  } } } } };
  return { root, state, reportFile };
}

const question = ({ root, state }) => renderGateQuestion(GATE, state, root);
const recommendation = (packet) => JSON.stringify({ recommendation: 'Bound the design to its approved scope', ...packet });

test('a gate quotes the producer\'s "missing expertise" list from its settled raw JSON report', () => {
  for (const expertise of [['database sizing', 'security review'], []]) {
    assert.equal(question(settledProducer({ report: recommendation({ 'missing expertise': expertise }) })), `Bring in ${JSON.stringify(expertise)} or not?`);
  }
});

test('a "missing expertise" that is absent or not an array of non-empty strings is refused, never quoted', () => {
  for (const packet of [{}, { 'missing expertise': '' }, { 'missing expertise': 'security' }, { 'missing expertise': [''] }, { 'missing expertise': [' '] }]) {
    assert.throws(() => question(settledProducer({ report: recommendation(packet) })), RunnerConfigError, JSON.stringify(packet));
  }
});

test('a report that is not raw JSON is not searched for a packet: fenced or prose-embedded JSON is refused', () => {
  for (const report of ['```json\n{"missing expertise":[]}\n```', '# Advice\n{"missing expertise":[]}', 'Here is the recommendation: {"missing expertise":[]}']) {
    assert.throws(() => question(settledProducer({ report })), SyntaxError, report);
  }
});

test('a report edited after it settled is refused before its packet is read', () => {
  const fixture = settledProducer({ report: recommendation({ 'missing expertise': [] }) });
  fs.appendFileSync(fixture.reportFile, 'tampered');
  assert.throws(() => question(fixture), (err) => err instanceof HandoffRefError && err.reason === 'report-changed-after-settle');
});

test('the gate reads the settled report, then an untouched packet file beside it, with either key spelling', () => {
  const cases = [
    { name: 'underscore key in the raw JSON report', report: JSON.stringify({ missing_expertise: ['database sizing'] }), expect: '["database sizing"]' },
    { name: 'prose report with a packet file using the spaced key', report: '# Advice in prose', packet: JSON.stringify({ 'missing expertise': [] }), expect: '[]' },
    { name: 'prose report with a packet file using the underscore key', report: '# Advice in prose', packet: JSON.stringify({ missing_expertise: ['security review'] }), expect: '["security review"]' },
    { name: 'the report wins over a packet file', report: JSON.stringify({ 'missing expertise': ['from report'] }), packet: JSON.stringify({ missing_expertise: ['from packet'] }), expect: '["from report"]' },
  ];
  for (const scenario of cases) {
    assert.equal(question(settledProducer(scenario)), `Bring in ${scenario.expect} or not?`, scenario.name);
  }
});

test('a packet file touched after the report settled, malformed, or without the key is ignored and the prose report is refused', () => {
  const cases = [
    { name: 'packet file touched after the report settled', packet: JSON.stringify({ missing_expertise: [] }), touchedAfterSettle: true },
    { name: 'malformed packet file', packet: '{ not json' },
    { name: 'packet file without the key', packet: JSON.stringify({ verdict: 'x' }) },
  ];
  for (const scenario of cases) {
    assert.throws(() => question(settledProducer({ report: '# Advice in prose', ...scenario })), SyntaxError, scenario.name);
  }
});

// buildUnitHandoff over a hand-built case state: no repository, no run. A step is `{ id, dependsOn }`; a settled unit is
// `{ unitRunId, results: [{ seat, round, summary }] }` under its step, as the ledger fold leaves it.
const caseWorkflow = (...steps) => ({ id: 'wf', steps: steps.map((step) => ({ dependsOn: [], units: [], ...step })) });
const settledUnit = (unitRunId, seats) => ({ status: 'completed', unitRunId, results: seats.map(([seat, summary, round = 1]) => ({ seat, round, runResult: { agentClaim: { summary } } })) });
const handoffOf = (workflow, stepId, { state = {}, ...template } = {}) => buildUnitHandoff({
  template: { capability: 'docs:write', objective: 'Do the task', ...template },
  state: { workflowRunId: 'wf-run-1', request: null, contextRefs: [], steps: {}, ...state },
  step: workflow.steps.find((step) => step.id === stepId),
  workflow,
});
const PANEL_SEATS = [['member-1', 'one'], ['member-2', 'two'], ['member-3', 'three'], ['synthesizer', 'chair']];

test('a unit is handed its objective and the owner request, and an index of earlier units that names each by Unit run while the reports travel as inputs', () => {
  const workflow = caseWorkflow({ id: 'one' }, { id: 'two', dependsOn: ['one'] });
  const state = { request: 'Ship the pricing page by Friday', steps: { one: { units: { u1: settledUnit('unit-run-1', [['producer', 'first step summary']]) } } } };

  const first = handoffOf(workflow, 'one', { state, objective: 'Do the first thing' });
  assert.equal(first.objective, 'Do the first thing\n\nOwner request:\nShip the pricing page by Friday');
  assert.deepEqual(first.inputs, []);

  const second = handoffOf(workflow, 'two', { state, objective: 'Do the second thing' });
  assert.match(second.objective, /^Do the second thing\n\nOwner request:\nShip the pricing page by Friday\n\nOutput of earlier steps \(the full report of every seat is listed under Context refs; read them before answering\):\n\n### one \/ u1 \(unit run unit-run-1\)\nSummary: first step summary$/);
  assert.deepEqual(second.inputs, ['unit-run:unit-run-1/producer'], 'the report is a ref, never pasted text');

  // A unit with no objective and a state with no request add nothing.
  assert.equal(handoffOf(workflow, 'one', { objective: '' }).objective, '');
});

test('a step after a panel step is handed the report of every panelist and of the synthesizer, once each, whatever the rounds', () => {
  const workflow = caseWorkflow({ id: 'panel' }, { id: 'after', dependsOn: ['panel'] });
  const state = { steps: { panel: { units: { p: settledUnit('unit-run-panel', PANEL_SEATS) } } } };
  assert.deepEqual(handoffOf(workflow, 'after', { state }).inputs, ['member-1', 'member-2', 'member-3', 'synthesizer'].map((seat) => `unit-run:unit-run-panel/${seat}`));

  const reviewed = { steps: { panel: { units: { p: settledUnit('unit-run-rev', [['producer', 'draft 1'], ['reviewer', 'findings 1'], ['producer', 'draft 2', 2], ['reviewer', 'ok', 2]]) } } } };
  assert.deepEqual(handoffOf(workflow, 'after', { state: reviewed }).inputs, ['unit-run:unit-run-rev/producer', 'unit-run:unit-run-rev/reviewer']);
  assert.match(handoffOf(workflow, 'after', { state: reviewed }).objective, /### panel \/ p \(unit run unit-run-rev\)\nSummary: ok$/, 'the index line carries the summary of the last result');
});

test('a debate step hands the judge ruling on to the step that builds on it', () => {
  const workflow = caseWorkflow({ id: 'dialectic' }, { id: 'synthesis', dependsOn: ['dialectic'] });
  const state = { steps: { dialectic: { units: { d: settledUnit('unit-run-debate', [['thesis', 'for'], ['antithesis', 'against'], ['thesis', 'rebuttal', 2], ['antithesis', 'rebuttal', 2], ['judge', 'ruling']]) } } } };
  assert.deepEqual(handoffOf(workflow, 'synthesis', { state }).inputs, ['thesis', 'antithesis', 'judge'].map((seat) => `unit-run:unit-run-debate/${seat}`));
});

test('a unit with no Unit run yet is left out, and a Unit run with no settled result is listed with no input', () => {
  const workflow = caseWorkflow({ id: 'one' }, { id: 'two', dependsOn: ['one'] });
  const state = { steps: { one: { units: { scheduled: { status: 'running' }, bare: { unitRunId: 'unit-run-bare', results: [{ seat: 'producer' }] } } } } };
  const handoff = handoffOf(workflow, 'two', { state });
  assert.deepEqual(handoff.inputs, [], 'a result without a runResult names no seat');
  assert.match(handoff.objective, /### one \/ bare \(unit run unit-run-bare\)$/);
  assert.doesNotMatch(handoff.objective, /scheduled/);
});

test('anonymizeInputs lists the seats as seat-A, seat-B, ... and names no step, unit, Unit run or role', () => {
  const workflow = caseWorkflow({ id: 'independent-opinions' }, { id: 'cross-examine', dependsOn: ['independent-opinions'] });
  const state = { steps: { 'independent-opinions': { units: { p: settledUnit('unit-run-panel', PANEL_SEATS) } } } };
  const handoff = handoffOf(workflow, 'cross-examine', { state, objective: 'Cross-examine', anonymizeInputs: true });

  assert.deepEqual(handoff.inputs, ['member-1', 'member-2', 'member-3', 'synthesizer'].map((seat) => `unit-run:unit-run-panel/${seat}`), 'the Execution Core copies each under its neutral name, in this order');
  assert.match(handoff.objective, /Output of earlier steps, anonymized /);
  for (const [i, summary] of ['one', 'two', 'three', 'chair'].entries()) {
    assert.match(handoff.objective, new RegExp(`### seat-${'ABCD'[i]}\\nSummary: ${summary}`));
  }
  for (const leak of ['unit-run-panel', 'independent-opinions', 'panelist', 'synthesizer', 'unit run', 'member-1']) {
    assert.ok(!handoff.objective.includes(leak), `objective names ${leak}`);
  }

  // The numbering runs on across units and steps, in the order the inputs are listed.
  const two = caseWorkflow({ id: 'a' }, { id: 'b' }, { id: 'c', dependsOn: ['a', 'b'] });
  const across = handoffOf(two, 'c', { anonymizeInputs: true, state: { steps: { a: { units: { x: settledUnit('unit-run-a', [['producer', 'from a']]) } }, b: { units: { y: settledUnit('unit-run-b', [['producer', 'from b']]) } } } } });
  assert.match(across.objective, /### seat-A\nSummary: from a\n\n### seat-B\nSummary: from b$/);
});

test('a unit template that declares inputs gets only those steps, in that order; a same-seat input is the unit\'s own earlier result and does not take a number', () => {
  const workflow = caseWorkflow(
    { id: 'round-1' },
    { id: 'summary', dependsOn: ['round-1'] },
    { id: 'round-2', dependsOn: ['summary'] },
    { id: 'after', dependsOn: ['round-2'] },
  );
  const state = { steps: {
    'round-1': { units: { p1: settledUnit('unit-run-p1', PANEL_SEATS) } },
    summary: { units: { s: settledUnit('unit-run-s', [['producer', 'the summary']]) } },
    'round-2': { units: { p2: settledUnit('unit-run-p2', PANEL_SEATS) } },
  } };
  const inputs = [{ step: 'summary', label: 'group summary' }, { step: 'round-1', sameSeat: true, label: 'your own previous proposal' }];

  const declared = handoffOf(workflow, 'round-2', { state, anonymizeInputs: true, inputs });
  assert.deepEqual(declared.inputs, ['unit-run:unit-run-s/producer', `unit-run:unit-run-p1/${SEAT_PLACEHOLDER}`]);
  assert.match(declared.objective, /### seat-A \(group summary\)\nSummary: the summary\n\n### your own previous proposal\nIt is the file named "own-previous" under Context refs/);
  assert.equal(OWN_PREVIOUS_NAME, 'own-previous');
  for (const leak of ['unit-run-p1', 'round-1', 'panelist', 'synthesizer', 'seat-B']) assert.ok(!declared.objective.includes(leak), `objective names ${leak}`);

  const reversed = handoffOf(workflow, 'round-2', { state, inputs: [...inputs].reverse() });
  assert.deepEqual(reversed.inputs, [`unit-run:unit-run-p1/${SEAT_PLACEHOLDER}`, 'unit-run:unit-run-s/producer'], 'the order of the declaration is the order of the inputs');

  // A step with no declaration is still handed every earlier step it builds on, directly or not.
  const undeclared = handoffOf(workflow, 'after', { state });
  const runs = ['unit-run-p1', 'unit-run-s', 'unit-run-p2'];
  for (const run of runs) assert.ok(undeclared.inputs.some((input) => input.startsWith(`unit-run:${run}/`)), `${run} is handed over: ${undeclared.inputs}`);
  assert.equal(undeclared.inputs.length, 4 + 1 + 4);
});

test('a human gate answer reaches the unit of the gated step and of every step that builds on it, as a ref and a one-line note; earlier and unrelated steps get nothing of it', () => {
  const workflow = caseWorkflow(
    { id: 'prep' },
    { id: 'vote', dependsOn: ['prep'] },
    { id: 'side', dependsOn: ['prep'] },
    { id: 'final', dependsOn: ['vote'] },
    { id: 'after', dependsOn: ['final'] },
  );
  const answer = `Option B first. ${'because of cost '.repeat(20)}END-OF-ANSWER`;
  const state = { steps: { vote: { answer } } };
  const note = `owner's answer at the "vote" gate`;

  for (const stepId of ['vote', 'final', 'after']) {
    const { objective, inputs } = handoffOf(workflow, stepId, { state });
    assert.deepEqual(inputs, ['gate-answer:wf-run-1/vote'], stepId);
    assert.ok(objective.toLowerCase().includes(note), `${stepId}: ${objective}`);
    assert.ok(objective.includes(answer.slice(0, 200).trimEnd()), 'one line, the first 200 characters of the answer');
    assert.ok(!objective.includes('END-OF-ANSWER'), 'the rest is in the answer file');
  }
  for (const stepId of ['prep', 'side']) {
    const { objective, inputs } = handoffOf(workflow, stepId, { state });
    assert.deepEqual(inputs, [], stepId);
    assert.ok(!objective.includes('Option B first'), stepId);
  }

  // The note is one line however the answer is laid out, and an unanswered or null answer says nothing.
  const lines = handoffOf(workflow, 'vote', { state: { steps: { vote: { answer: 'first line\n\n  second\tline' } } } }).objective;
  assert.ok(lines.includes('the "vote" gate): first line second line'), lines);
  assert.deepEqual(handoffOf(workflow, 'vote', { state: { steps: { vote: { answer: null } } } }).inputs, []);
});

test('the run-level context refs go only to units of a step that builds on nothing, after the template\'s own refs; a later step gets only its own', () => {
  const workflow = caseWorkflow({ id: 'root' }, { id: 'later', dependsOn: ['root'] });
  const state = { contextRefs: ['owner.txt'] };
  assert.deepEqual(handoffOf(workflow, 'root', { state, contextRefs: ['template.txt'] }).inputs, ['template.txt', 'owner.txt']);
  assert.deepEqual(handoffOf(workflow, 'root', { state }).inputs, ['owner.txt'], 'a unit that waits on another unit of the same root step still gets them');
  assert.deepEqual(handoffOf(workflow, 'later', { state, contextRefs: ['template.txt'] }).inputs, ['template.txt']);
});

test('a unit template becomes the Unit\'s pattern, persona, seats and timeout; a persona is a Unit field, never an override', () => {
  const template = { capability: 'docs:write', pattern: 'panel', persona: 'panelist', seats: [{ seat: 'm1', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }], timeoutMs: 120000, params: { roleTasks: { chair: 'TASK for: {objective}' } } };
  assert.deepEqual(unitPatternOf(template), { pattern: 'panel', params: { roleTasks: { chair: 'TASK for: {objective}' } } }, 'params travel with the pattern name');
  assert.equal(unitPatternOf({ capability: 'docs:write' }), 'solo');
  assert.equal(unitPatternOf({ pattern: 'reviewed' }), 'reviewed');

  const fields = unitFieldsOfTemplate(template);
  assert.equal(fields.persona, 'panelist');
  assert.deepEqual(fields.seats, template.seats);
  assert.equal(fields.timeoutMs, 120000);
  assert.equal('params' in fields, false, 'params ride on the pattern, not on the Unit');
  const plain = unitFieldsOfTemplate({ capability: 'docs:write' });
  assert.deepEqual(Object.keys(plain).sort(), ['capability', 'pattern', 'rigor', 'writes'], 'a template that declares no persona gives the Unit none');
});
