// Records written before seats existed stay readable through one path, and are never resumed.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { legacySeatsOf, seatsOfRecord, seatKeyOf, isVerdictResult, isVerifyResult, isSeatRecord } from '../../../src/runner/execution/legacy-seat-read.mjs';
import { buildUnitSummary } from '../../../src/runner/execution/unit-summary.mjs';
import { readUnitRunHistory } from '../../../src/runner/execution/unit-run-history.mjs';
import { resolveUnitInputs } from '../../../src/runner/execution/handoff-refs.mjs';
import { runUnit } from '../../../src/runner/execution/run.mjs';

const settledAt = '2026-10-05T01:01:00Z';

function recordDir(t, record) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-seat-read-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: root });
  const dir = path.join(root, '.fgos', 'assignments', 'unit-run-prefence');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify({ createdAt: '2026-10-05T01:00:00Z', ...record }));
  return { root, dir };
}

function settle(dir, name, round = '1', data = {}) {
  const runDir = path.join(dir, name, round, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const report = path.join(runDir, 'report.md');
  fs.writeFileSync(report, `report of ${name}\n`);
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: `${name}-${round}`, settledAt, executorId: 'agent-a',
    policy: { providerModel: 'provider-a', persona: null, model: 'm' },
    classification: { outcome: { category: 'ok' } }, agentClaim: { stance: { choice: 'a', confidence: 1 } }, ...data,
  }));
}

test('golden: a pre-fence panel record (three role-keyed panelists and a synthesizer) reads as seats', (t) => {
  const record = { unit: { id: 'q', capability: 'question:answer', pattern: 'panel', stanceOptions: ['a', 'b'] }, pattern: 'panel', settlement: { outcome: 'pass', settledAt } };
  assert.equal(isSeatRecord(record), false);
  assert.deepEqual(legacySeatsOf(record).map(({ seat, role }) => [seat, role]), [
    ['panelist-1', 'producer'], ['panelist-2', 'producer'], ['panelist-3', 'producer'], ['synthesizer', 'synthesizer'],
  ]);
  const { dir } = recordDir(t, record);
  for (const name of ['panelist-1', 'panelist-2', 'panelist-3', 'synthesizer']) settle(dir, name);
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'pass');
  assert.deepEqual(summary.seats.map(({ seat, role, kind }) => [seat, role, kind]), [
    ['panelist-1', 'producer', 'panelist'], ['panelist-2', 'producer', 'panelist'], ['panelist-3', 'producer', 'panelist'], ['synthesizer', 'synthesizer', 'synthesizer'],
  ]);
  assert.deepEqual(readUnitRunHistory(dir).map((h) => h.seat).sort(), ['panelist-1', 'panelist-2', 'panelist-3', 'synthesizer']);
});

test('golden: a pre-fence debate record (thesis, antithesis, judge) reads as seats and derives its outcome from the judge', (t) => {
  const record = { unit: { id: 'd', capability: 'q:a', pattern: 'debate' }, pattern: 'debate' };
  const { dir } = recordDir(t, record);
  for (const name of ['thesis', 'antithesis']) for (const round of ['1', '2']) settle(dir, name, round);
  assert.equal(buildUnitSummary(dir).outcome, 'unknown');
  settle(dir, 'judge');
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'pass');
  assert.deepEqual(
    Object.fromEntries(summary.seats.filter((s) => s.round === 1).map((s) => [s.seat, [s.role, s.kind]])),
    { thesis: ['producer', 'producer'], antithesis: ['producer', 'producer'], judge: ['judge', 'judge'] },
  );
});

test('golden: a pre-fence reviewed record keeps tester a non-verdict reviewer', (t) => {
  const record = { unit: { id: 'r', capability: 'docs:write', rigor: 'high', pattern: 'reviewed' }, pattern: { pattern: 'reviewed', params: { minCheckers: ['tester'] } } };
  const seats = legacySeatsOf(record);
  assert.deepEqual(seats.map((s) => [s.seat, s.role, s.posture.verdict]), [
    ['producer', 'producer', false], ['reviewer', 'reviewer', true], ['red-team', 'red-team', true], ['tester', 'reviewer', false],
  ]);
});

test('pre-fence presets that carried role names as params are read the way they ran', () => {
  const panel = legacySeatsOf({ pattern: 'research-fan-out', unit: {} });
  assert.deepEqual(panel.map((s) => s.seat), ['researcher-1', 'researcher-2', 'researcher-3', 'synthesizer']);
  assert.deepEqual(legacySeatsOf({ pattern: 'consult', unit: {} }).map((s) => s.seat), ['advisor']);
  assert.deepEqual(legacySeatsOf({ pattern: null, unit: {} }), [], 'a record that never said its pattern has no seats to name');
  assert.deepEqual(legacySeatsOf({ pattern: { pattern: 'panel', params: { members: 2, role: 'lens', synthesizeRole: 'chair' } }, unit: {} }).map((s) => s.seat), ['lens-1', 'lens-2', 'chair']);
});

test('a fenced record lists its own seats and legacy never overrides them', () => {
  const own = [{ seat: 'system', role: 'producer', posture: {} }];
  assert.deepEqual(seatsOfRecord({ seatSchema: 1, seats: own, pattern: 'panel' }), own);
});

test('results written before seats are keyed by the name they carried', () => {
  assert.equal(seatKeyOf({ role: 'panelist-2' }), 'panelist-2');
  assert.equal(seatKeyOf({ seat: 'system', role: 'producer' }), 'system');
  // Verdict and verify results: by posture when there is one, by the retired name otherwise.
  assert.equal(isVerdictResult({ role: 'reviewer' }), true);
  assert.equal(isVerdictResult({ role: 'red-team' }), true);
  assert.equal(isVerdictResult({ role: 'tester' }), false);
  assert.equal(isVerdictResult({ seat: 'tester', role: 'reviewer', posture: { verdict: false } }), false);
  assert.equal(isVerdictResult({ seat: 'sec', role: 'reviewer', posture: { verdict: true } }), true);
  assert.equal(isVerifyResult({ role: 'verify' }), true);
  assert.equal(isVerifyResult({ seat: 'verify' }), true);
  assert.equal(isVerifyResult({ seat: 'producer' }), false);
});

test('a parked workflow gate answered after the fence still resolves its role-keyed hand-off refs', (t) => {
  const { root, dir } = recordDir(t, { unit: { id: 'q', capability: 'q:a', pattern: 'panel' }, pattern: 'panel' });
  for (const name of ['panelist-1', 'synthesizer']) settle(dir, name, '1', { settleReports: [] });
  const claimOnly = (name) => {
    const file = path.join(dir, name, '1', 'runs', '01', 'result.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const report = path.join(dir, name, '1', 'runs', '01', 'report.md');
    const sha = require_sha(report);
    fs.writeFileSync(file, JSON.stringify({ ...data, settleReports: [{ path: path.relative(root, report), sha256: sha }] }));
  };
  claimOnly('panelist-1');
  claimOnly('synthesizer');
  const { refs } = resolveUnitInputs(['unit-run:unit-run-prefence/panelist-1', 'unit-run:unit-run-prefence/synthesizer'], root);
  assert.equal(refs.length, 2);
  assert.ok(refs[0].endsWith(path.join('panelist-1', '1', 'runs', '01', 'report.md')));
});

import crypto from 'node:crypto';
function require_sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

test('a pre-fence record is refused on resume by name, whatever its execution says, and is left untouched', async (t) => {
  for (const execution of [{ status: 'running' }, { status: 'pending' }, { status: 'settled' }, undefined]) {
    const record = { unit: { id: 'q', capability: 'q:a', objective: 'x', writes: [] }, pattern: 'solo', ...(execution ? { execution } : {}) };
    const { root, dir } = recordDir(t, record);
    const before = fs.readFileSync(path.join(dir, 'unit.json'), 'utf8');
    await assert.rejects(
      runUnit({ repoRoot: root, cwd: root, resumeUnitRunId: 'unit-run-prefence' }),
      (error) => error.code === 'record-predates-seat-binding' && /record-predates-seat-binding/.test(error.message),
      JSON.stringify(execution),
    );
    assert.equal(fs.readFileSync(path.join(dir, 'unit.json'), 'utf8'), before);
    assert.equal(fs.existsSync(path.join(dir, 'unit-control')), false, 'no controller was taken for a record that cannot resume');
  }
});
