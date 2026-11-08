// test/workflow/unit-handoff.test.mjs — what a Workflow hands from one step to the next, read from
// the settled Unit runs on disk: the "missing expertise" a gate question quotes from a producer packet.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { execFileSync } from 'node:child_process';

import { renderGateQuestion, foldUnitOutcome } from '../../src/workflow/unit-handoff.mjs';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { HandoffRefError } from '../../src/runner/execution/handoff-refs.mjs';

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

test('a unit whose write check cannot run ends as an infrastructure failure instead of throwing out of the run', () => {
  ensureScriptAddon();
  const root = makeFixtureDir('fgos-unit-writes-');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  git('init', '-b', 'main');
  git('config', 'user.name', 'Unit Test');
  git('config', 'user.email', 'unit@test.local');
  fs.writeFileSync(path.join(root, 'README.md'), '# x\n');
  git('add', 'README.md');
  git('commit', '-m', 'initial');
  activateGitFixture(root);

  const settled = foldUnitOutcome({
    mainRoot: root,
    unitData: { writes: ['a.txt'] },
    result: { unitRunId: 'unit-run-x', outcome: 'pass', results: [] },
    state: { steps: {} },
    base: null,
    branch: 'wf/gone',
    baseSha: git('rev-parse', 'HEAD'),
  });
  assert.equal(settled.result.outcome, 'execution-failure');
  assert.match(settled.result.error, /could not check the writes of the unit: .*writing branch/);
  assert.deepEqual(settled.outOfScope, []);
});
