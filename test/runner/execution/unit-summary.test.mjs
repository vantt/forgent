import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildUnitSummary, writeUnitSummary, extractStance, serializeUnitSummary } from '../../../src/runner/execution/unit-summary.mjs';
import { readUnitRunHistory } from '../../../src/runner/execution/unit-run-history.mjs';
import { backfillUnitSummaries } from '../../../scripts/backfill-unit-summaries.mjs';
import { runLoop } from '../../../src/runner/execution/loops/index.mjs';

const startedAt = '2026-10-05T01:00:00Z';
const settledAt = '2026-10-05T01:01:00Z';
function fixture(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unit-summary-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, '.fgos', 'assignments', 'unit-run-synthetic');
  fs.mkdirSync(dir, { recursive: true });
  const record = { unit: { id: 'question', capability: 'question:answer', pattern: 'panel', stanceOptions: ['a', 'b'] },
    createdAt: startedAt, ...extra };
  fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify(record));
  return { root, dir, record };
}
function result(dir, role, round, run, data = {}) {
  const runDir = path.join(dir, role, round, 'runs', run);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: `${role}-${round}-${run}`, settledAt, executorId: 'agent-a',
    policy: { providerModel: 'provider-a', persona: 'analyst', model: 'model-a' },
    classification: { outcome: { category: 'ok' } }, agentClaim: { stance: { choice: 'a', confidence: 0.8 } }, ...data,
  }));
}

test('complete summary uses owner workflow/outcome and only exposes measurement metadata', (t) => {
  const workflow = { runId: 'wf-synthetic', stepId: 'step', unitId: 'question' };
  const { dir } = fixture(t, { workflow, settlement: { outcome: 'pass', settledAt } });
  result(dir, 'panelist-1', '1', '01');
  result(dir, 'synthesizer', '1', '01', { agentClaim: {} });
  const summary = buildUnitSummary(dir);
  assert.deepEqual(summary.contract, { id: 'unit-summary', version: 2 });
  assert.deepEqual(summary.workflow, { caseId: 'wf-synthetic', activity: 'step', reservationId: null }, 'a record from before cases reads as the same link, without a reservation');
  assert.equal(summary.startedAt, startedAt);
  assert.equal(summary.settledAt, settledAt);
  assert.equal(summary.outcome, 'pass');
  assert.equal(summary.seats.length, 2);
  assert.deepEqual(summary.seats[0].final.stance, { status: 'valid', choice: 'a', confidence: 0.8 });
  assert.equal(summary.seats[0].final.provider, 'provider-a');
  assert.equal('agentClaim' in summary.seats[0].final, false);
});

test('final and history share highest fallback/latest resume selection; every attempt remains counted', (t) => {
  const { dir } = fixture(t, { bindings: { 'panelist-1/1': [
    { assignmentId: 'unit-run-synthetic/panelist-1/1-fb1', fallbackFrom: { executor: 'agent-a', reason: 'provider-limit' } },
  ] } });
  result(dir, 'panelist-1', '1', '01', { classification: { outcome: { category: 'infra' }, failure: { code: 'provider-limit' } } });
  result(dir, 'panelist-1', '1-fb1', '01', { classification: { outcome: { category: 'infra' } } });
  result(dir, 'panelist-1', '1-fb1', '02', { executorId: 'agent-b' });
  result(dir, 'panelist-1', '2', '01');
  const summary = buildUnitSummary(dir);
  assert.equal(summary.seats.length, 2);
  assert.equal(summary.seats[0].attempts.length, 3);
  assert.equal(summary.seats[0].attempts[0].outcome, 'provider-limit');
  assert.equal(summary.seats[0].final.runId, 'panelist-1-1-fb1-02');
  assert.deepEqual(summary.seats[0].final.fallbackFrom, { executor: 'agent-a', reason: 'provider-limit' });
  assert.deepEqual(readUnitRunHistory(dir).map((entry) => entry.runResult.runId), summary.seats.map((seat) => seat.final.runId));
});

test('failed seat maps classification without altering original run; no workflow stays null', (t) => {
  const { dir } = fixture(t, { settlement: { outcome: 'execution-failure', settledAt } });
  result(dir, 'panelist-1', '1', '01', { classification: { outcome: { category: 'infra' } } });
  const original = fs.readFileSync(path.join(dir, 'panelist-1', '1', 'runs', '01', 'result.json'), 'utf8');
  const summary = writeUnitSummary(dir).summary;
  assert.equal(summary.workflow, null);
  assert.equal(summary.outcome, 'execution-failure');
  assert.equal(summary.seats[0].final.outcome, 'execution-failure');
  assert.equal(fs.readFileSync(path.join(dir, 'panelist-1', '1', 'runs', '01', 'result.json'), 'utf8'), original);
});

test('owner refusal has zero seats, and creation is never used as settlement', (t) => {
  const { dir, record } = fixture(t, { settlement: { outcome: 'policy-refusal', settledAt } });
  assert.deepEqual(buildUnitSummary(dir).seats, []);
  assert.equal(buildUnitSummary(dir).outcome, 'policy-refusal');
  delete record.settlement;
  fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify(record));
  assert.equal(buildUnitSummary(dir).settledAt, null);
});

test('stance extraction is tolerant, exact and question-local', () => {
  assert.deepEqual(extractStance({}, ['a']), { status: 'missing' });
  assert.deepEqual(extractStance({ stance: { choice: 'other' } }, ['a']), { status: 'valid', choice: 'other', confidence: null });
  for (const stance of [null, [], 'a', 1]) assert.equal(extractStance({ stance }, ['a']).status, 'invalid');
  for (const stance of [{ choice: 'b' }, { choice: 'a', confidence: '1' }, { choice: 'a', confidence: 1.1 }, { choice: 'a', confidence: -0.1 }]) {
    assert.equal(extractStance({ stance }, ['a']).status, 'invalid');
  }
  assert.deepEqual(extractStance({ stance: { choice: 'a', confidence: 0, ignored: true } }, ['a']), { status: 'valid', choice: 'a', confidence: 0 });
});

test('corrupt latest result is not silently replaced by an earlier passing attempt', (t) => {
  const { dir } = fixture(t);
  result(dir, 'producer', '1', '01');
  result(dir, 'producer', '1-fb1', '01');
  fs.writeFileSync(path.join(dir, 'producer', '1-fb1', 'runs', '01', 'result.json'), '{broken');
  assert.deepEqual(readUnitRunHistory(dir), []);
});

test('backfill uses explicit owner completion for legacy refusal, dry-runs and reruns without rewriting originals', (t) => {
  const { root, dir } = fixture(t);
  const eventDir = path.join(root, '.fgos', 'workflow-runs', 'wf-synthetic');
  fs.mkdirSync(eventDir, { recursive: true });
  const eventFile = path.join(eventDir, 'events.jsonl');
  fs.writeFileSync(eventFile, `${JSON.stringify({ type: 'unit.complete', seq: 4, ts: settledAt,
    payload: { unitRunId: 'unit-run-synthetic', stepId: 'step', unitId: 'question', outcome: 'policy-refusal' } })}\n`);
  const original = fs.readFileSync(path.join(dir, 'unit.json'), 'utf8');
  const eventOriginal = fs.readFileSync(eventFile, 'utf8');
  assert.equal(backfillUnitSummaries({ repoRoot: root, dryRun: true }).changed, 1);
  assert.equal(fs.existsSync(path.join(dir, 'unit-summary.json')), false);
  assert.equal(backfillUnitSummaries({ repoRoot: root }).changed, 1);
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
  assert.equal(summary.outcome, 'policy-refusal');
  assert.equal(summary.settledAt, settledAt);
  assert.deepEqual(summary.workflow, { caseId: 'wf-synthetic', activity: 'step', reservationId: null });
  assert.equal(summary.derivation.seq, 4);
  const before = fs.statSync(path.join(dir, 'unit-summary.json')).mtimeMs;
  assert.equal(backfillUnitSummaries({ repoRoot: root }).unchanged, 1);
  assert.equal(fs.statSync(path.join(dir, 'unit-summary.json')).mtimeMs, before);
  assert.equal(fs.readFileSync(path.join(dir, 'unit.json'), 'utf8'), original);
  assert.equal(fs.readFileSync(eventFile, 'utf8'), eventOriginal);
});

test('numeric run attempts 99/100 share final selection and ordering across summary and history', (t) => {
  const { dir } = fixture(t);
  result(dir, 'producer', '1', '99', { classification: { outcome: { category: 'infra' } } });
  result(dir, 'producer', '1', '100');
  const seat = buildUnitSummary(dir).seats[0];
  assert.deepEqual(seat.attempts.map((attempt) => attempt.runId), ['producer-1-99', 'producer-1-100']);
  assert.equal(seat.final.runId, 'producer-1-100');
  assert.equal(seat.final.outcome, 'pass');
  assert.equal(readUnitRunHistory(dir)[0].runResult.runId, 'producer-1-100');
});

test('legacy reviewed findings followed by a complete passing round backfill as pass', (t) => {
  const { root, dir } = fixture(t, {
    unit: { id: 'reviewed-question', capability: 'docs:write', pattern: 'reviewed' },
  });
  result(dir, 'producer', '1', '01');
  result(dir, 'reviewer', '1', '01', { classification: { outcome: { category: 'verdict' }, assessment: { verdict: 'findings' } } });
  result(dir, 'producer', '2', '01');
  result(dir, 'reviewer', '2', '01');
  const report = backfillUnitSummaries({ repoRoot: root });
  assert.equal(report.summaries[0].outcome, 'pass');
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
  assert.equal(summary.outcome, 'pass');
  assert.equal(summary.seats.find((seat) => seat.seat === 'reviewer' && seat.round === 1).final.outcome, 'findings');
  assert.equal(summary.seats.find((seat) => seat.seat === 'reviewer' && seat.round === 2).final.outcome, 'pass');
});

test('legacy reviewed incomplete terminal round or absent verify evidence stays unknown', (t) => {
  const { dir, record } = fixture(t, {
    unit: { id: 'reviewed-question', capability: 'docs:write', pattern: 'reviewed' },
  });
  result(dir, 'producer', '1', '01');
  result(dir, 'reviewer', '1', '01', { classification: { outcome: { category: 'verdict' }, assessment: { verdict: 'findings' } } });
  result(dir, 'producer', '2', '01');
  assert.equal(buildUnitSummary(dir).outcome, 'unknown');
  result(dir, 'reviewer', '2', '01');
  record.configSnapshot = { runner: { capabilities: { 'docs:write': { verify: 'synthetic-verification-command' } } } };
  fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify(record));
  assert.equal(buildUnitSummary(dir).outcome, 'unknown');
  record.settlement = { outcome: 'pass', settledAt };
  fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify(record));
  assert.equal(buildUnitSummary(dir).outcome, 'pass', 'actual owner completion outranks absent historical verification evidence');
});

test('panel summary kinds follow the dispatched membership for researcher presets', async (t) => {
  for (const pattern of ['research-fan-out', 'research-fan-out-gated']) {
    const { root, dir, record } = fixture(t, { pattern });
    const dispatched = [];
    const fanOutSeats = [
      { seat: 'researcher-1', role: 'producer' },
      { seat: 'researcher-2', role: 'producer' },
      { seat: 'researcher-3', role: 'producer' },
      { seat: 'synthesizer', role: 'synthesizer' },
    ];
    const execution = await runLoop({ loop: 'panel', params: { seats: fanOutSeats } }, record.unit, {}, {
      runRole: async ({ seat }) => {
        dispatched.push(seat.seat);
        result(dir, seat.seat, '1', '01');
        return { seat: seat.seat, outcome: 'pass' };
      },
    });
    assert.equal(execution.outcome, 'pass');
    const summary = buildUnitSummary(dir);
    assert.equal(summary.outcome, 'pass');
    const bySeat = new Map(summary.seats.map((entry) => [entry.seat, entry]));
    for (const seat of dispatched.slice(0, -1)) {
      assert.equal(bySeat.get(seat).kind, 'panelist');
      assert.equal(bySeat.get(seat).role, 'producer');
      assert.equal(bySeat.get(seat).final.stance.status, 'valid');
    }
    assert.equal(bySeat.get(dispatched.at(-1)).kind, 'synthesizer');
    assert.equal(bySeat.get(dispatched.at(-1)).role, 'synthesizer');
    assert.equal(backfillUnitSummaries({ repoRoot: root }).changed, 1);
    const stored = JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
    assert.deepEqual(stored.seats.map(({ seat, role, kind }) => ({ seat, role, kind })),
      summary.seats.map(({ seat, role, kind }) => ({ seat, role, kind })));
  }
});

// Golden: a record written before seats existed (no `seatSchema`, role-keyed directories) is summarised
// through the one legacy read path, with the kinds and roles its pattern gave those names.
test('a pre-fence panel record is summarised through the legacy read path', (t) => {
  const { dir } = fixture(t, { pattern: 'panel' });
  for (const name of ['panelist-1', 'panelist-2', 'panelist-3']) result(dir, name, '1', '01');
  result(dir, 'synthesizer', '1', '01', { agentClaim: {} });
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'pass');
  assert.deepEqual(summary.seats.map(({ seat, role, kind }) => ({ seat, role, kind })), [
    { seat: 'panelist-1', role: 'producer', kind: 'panelist' },
    { seat: 'panelist-2', role: 'producer', kind: 'panelist' },
    { seat: 'panelist-3', role: 'producer', kind: 'panelist' },
    { seat: 'synthesizer', role: 'synthesizer', kind: 'synthesizer' },
  ]);
});

test('a pre-fence panel record with custom role labels keeps its kinds', (t) => {
  const pattern = { pattern: 'panel', params: { members: 9, role: ['cost-lens', 'synthesizer', 'reviewer'], synthesizeRole: 'researcher-chair' } };
  const { dir } = fixture(t, { pattern });
  for (const name of ['cost-lens', 'synthesizer', 'reviewer', 'researcher-chair']) result(dir, name, '1', '01');
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'pass');
  const kinds = Object.fromEntries(summary.seats.map((entry) => [entry.seat, entry.kind]));
  assert.deepEqual(kinds, { 'cost-lens': 'panelist', synthesizer: 'panelist', reviewer: 'panelist', 'researcher-chair': 'synthesizer' });
});

test('a record that carries its seats is summarised from them, by seat id', (t) => {
  const seats = [
    { seat: 'system', role: 'producer', posture: { stance: true } },
    { seat: 'alternative', role: 'producer', posture: { stance: true } },
    { seat: 'synthesis', role: 'synthesizer', posture: {} },
  ];
  const { dir } = fixture(t, { pattern: 'panel', seatSchema: 1, seats });
  for (const name of ['system', 'alternative', 'synthesis']) result(dir, name, '1', '01', { agentClaim: {} });
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'pass');
  assert.deepEqual(summary.seats.map(({ seat, role, kind }) => ({ seat, role, kind })), [
    { seat: 'alternative', role: 'producer', kind: 'panelist' },
    { seat: 'synthesis', role: 'synthesizer', kind: 'synthesizer' },
    { seat: 'system', role: 'producer', kind: 'panelist' },
  ]);
});

test('backfill never settles a passing partial panel or a reviewed producer without its checkers', (t) => {
  for (const pattern of ['panel', 'reviewed', 'code-change']) {
    const { root, dir } = fixture(t, { pattern });
    result(dir, pattern === 'panel' ? 'panelist-1' : 'producer', '1', '01');
    const before = fs.readFileSync(path.join(dir, 'unit.json'), 'utf8');
    const summary = buildUnitSummary(dir);
    assert.equal(summary.outcome, 'unknown');
    assert.equal(summary.settledAt, null);
    const report = backfillUnitSummaries({ repoRoot: root });
    assert.equal(report.units, 1);
    assert.equal(report.changed, 0);
    assert.equal(report.unchanged, 0);
    assert.equal(report.skippedUnsettled, 1);
    assert.deepEqual(report.errors, []);
    assert.equal(fs.existsSync(path.join(dir, 'unit-summary.json')), false);
    assert.equal(fs.readFileSync(path.join(dir, 'unit.json'), 'utf8'), before);
  }
});

test('backfill skips active owner execution even with complete history or old completion evidence', (t) => {
  for (const status of ['running', 'pending']) {
    const { root, dir } = fixture(t, { pattern: 'solo', execution: { status }, settlement: { outcome: 'pass', settledAt } });
    result(dir, 'producer', '1', '01');
    const before = fs.readFileSync(path.join(dir, 'unit.json'), 'utf8');
    const report = backfillUnitSummaries({ repoRoot: root });
    assert.equal(report.skippedActive, 1);
    assert.equal(report.changed, 0);
    assert.equal(report.skippedUnsettled, 0);
    assert.equal(fs.existsSync(path.join(dir, 'unit-summary.json')), false);
    assert.equal(fs.readFileSync(path.join(dir, 'unit.json'), 'utf8'), before);
  }
});

test('backfill skips materialized attempts without terminal results', (t) => {
  const { root, dir } = fixture(t, { pattern: 'solo' });
  result(dir, 'producer', '1', '01');
  const live = path.join(dir, 'producer', '1', 'runs', '02');
  fs.mkdirSync(live);
  fs.writeFileSync(path.join(live, 'run.json'), JSON.stringify({ status: 'running', runId: 'still-working' }));
  const report = backfillUnitSummaries({ repoRoot: root });
  assert.equal(report.skippedActive, 1);
  assert.equal(report.changed, 0);
  assert.equal(fs.existsSync(path.join(dir, 'unit-summary.json')), false);
});

test('backfill requires real completion, including every dispatched checker and verify result', (t) => {
  const { root, dir, record } = fixture(t, {
    pattern: 'reviewed',
    unit: { id: 'complete-review', capability: 'code:implement', verify: 'check-command' },
  });
  result(dir, 'producer', '1', '01');
  result(dir, 'reviewer', '1', '01', { classification: { outcome: { category: 'infra' } } });
  assert.equal(backfillUnitSummaries({ repoRoot: root }).skippedUnsettled, 1);
  result(dir, 'red-team', '1', '01');
  assert.equal(backfillUnitSummaries({ repoRoot: root }).skippedUnsettled, 1);
  result(dir, 'verify', '1', '01');
  const report = backfillUnitSummaries({ repoRoot: root });
  assert.equal(report.changed, 1);
  assert.equal(report.summaries[0].outcome, 'execution-failure');
  assert.equal(report.skippedActive + report.skippedUnsettled, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'unit.json'), 'utf8')), record);
});

test('settled owner evidence backfills without seats and complete solo history backfills without owner rewriting', (t) => {
  for (const ownerEvidence of [true, false]) {
    const { root, dir } = fixture(t, {
      pattern: 'solo',
      ...(ownerEvidence ? { settlement: { outcome: 'blocked', settledAt } } : {}),
    });
    if (!ownerEvidence) result(dir, 'producer', '1', '01');
    const before = fs.readFileSync(path.join(dir, 'unit.json'), 'utf8');
    const report = backfillUnitSummaries({ repoRoot: root });
    assert.equal(report.changed, 1);
    assert.equal(report.skippedActive + report.skippedUnsettled, 0);
    assert.equal(report.summaries[0].outcome, ownerEvidence ? 'blocked' : 'pass');
    assert.equal(fs.readFileSync(path.join(dir, 'unit.json'), 'utf8'), before);
  }
});

// A unit record written before the owner stored its pattern: the caller's --pattern was never kept.
const patternless = { unit: { id: 'legacy-question', capability: 'code:implement' } };

test('a finished unit without a recorded pattern is undetermined, never derived as a solo pass', (t) => {
  const { dir } = fixture(t, patternless);
  result(dir, 'producer', '1', '01', { settledAt: '2026-10-05T01:00:30Z' });
  result(dir, 'red-team', '1', '01');
  result(dir, 'reviewer', '1', '01', { classification: { outcome: { category: 'blocked' } } });
  const { summary, changed } = writeUnitSummary(dir);
  assert.equal(changed, true);
  assert.equal(summary.pattern, null);
  assert.equal(summary.outcome, 'undetermined');
  assert.equal(summary.settledAt, settledAt, 'the latest settled seat dates a finished unit');
  assert.deepEqual(summary.seats.map(({ role, kind }) => ({ role, kind })), [
    { role: 'producer', kind: 'unknown' }, { role: 'red-team', kind: 'unknown' }, { role: 'reviewer', kind: 'unknown' },
  ]);
  assert.equal(summary.seats.find((seat) => seat.seat === 'reviewer').final.outcome, 'blocked', 'seat facts stay recorded');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8')), summary);
});

test('owner completion still decides a patternless unit, and one that never ran stays unpublished', (t) => {
  const { dir } = fixture(t, { ...patternless, settlement: { outcome: 'blocked', settledAt } });
  result(dir, 'producer', '1', '01');
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'blocked');
  assert.equal(summary.seats[0].kind, 'unknown');
  const empty = fixture(t, patternless);
  const unpublished = writeUnitSummary(empty.dir);
  assert.equal(unpublished.skipped, 'unsettled');
  assert.equal(fs.existsSync(path.join(empty.dir, 'unit-summary.json')), false);
});

test('backfill keeps stored summaries by default and regenerate rewrites stale ones idempotently', (t) => {
  const { root, dir } = fixture(t, patternless);
  result(dir, 'producer', '1', '01');
  result(dir, 'reviewer', '1', '01', { classification: { outcome: { category: 'blocked' } } });
  const file = path.join(dir, 'unit-summary.json');
  // What an earlier writer published: an older contract that derived the unit as a solo pass.
  const stale = `${JSON.stringify({ contract: { id: 'unit-summary', version: 1 }, unitRunId: 'unit-run-synthetic', outcome: 'pass' })}\n`;
  fs.writeFileSync(file, stale);
  const kept = backfillUnitSummaries({ repoRoot: root });
  assert.equal(kept.stale, 1);
  assert.deepEqual(kept.staleSummaries, [{ unitRunId: 'unit-run-synthetic', derivedOutcome: 'undetermined', reason: 'differs' }]);
  assert.equal(kept.changed, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), stale);
  const dry = backfillUnitSummaries({ repoRoot: root, regenerate: true, dryRun: true });
  assert.equal(dry.changed, 1);
  assert.equal(dry.summaries[0].outcome, 'undetermined');
  assert.equal(fs.readFileSync(file, 'utf8'), stale, 'dry-run writes nothing');
  assert.equal(backfillUnitSummaries({ repoRoot: root, regenerate: true }).changed, 1);
  const rewritten = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(rewritten.contract, { id: 'unit-summary', version: 2 });
  assert.equal(rewritten.outcome, 'undetermined');
  const before = fs.statSync(file).mtimeMs;
  const again = backfillUnitSummaries({ repoRoot: root, regenerate: true });
  assert.equal(again.unchanged, 1);
  assert.equal(again.changed, 0);
  assert.equal(fs.statSync(file).mtimeMs, before);
  assert.equal(backfillUnitSummaries({ repoRoot: root }).unchanged, 1, 'a regenerated summary is no longer stale');
});

test('regenerate removes a stored summary the current writer cannot establish but never touches an active unit', (t) => {
  const stale = `${JSON.stringify({ contract: { id: 'unit-summary', version: 1 }, unitRunId: 'unit-run-synthetic', outcome: 'unknown', settledAt: null })}\n`;
  const finished = fixture(t, { pattern: 'panel' });
  result(finished.dir, 'panelist-1', '1', '01');
  const finishedFile = path.join(finished.dir, 'unit-summary.json');
  fs.writeFileSync(finishedFile, stale);
  assert.deepEqual(backfillUnitSummaries({ repoRoot: finished.root }).staleSummaries,
    [{ unitRunId: 'unit-run-synthetic', derivedOutcome: null, reason: 'unsettled' }]);
  const dry = backfillUnitSummaries({ repoRoot: finished.root, regenerate: true, dryRun: true });
  assert.deepEqual(dry.removedSummaries, ['unit-run-synthetic']);
  assert.equal(fs.existsSync(finishedFile), true);
  assert.equal(backfillUnitSummaries({ repoRoot: finished.root, regenerate: true }).removed, 1);
  assert.equal(fs.existsSync(finishedFile), false);
  assert.equal(backfillUnitSummaries({ repoRoot: finished.root, regenerate: true }).removed, 0);

  const active = fixture(t, { ...patternless, execution: { status: 'running' } });
  result(active.dir, 'producer', '1', '01');
  const activeFile = path.join(active.dir, 'unit-summary.json');
  fs.writeFileSync(activeFile, stale);
  for (const regenerate of [false, true]) {
    const report = backfillUnitSummaries({ repoRoot: active.root, regenerate });
    assert.equal(report.skippedActive, 1);
    assert.equal(report.changed + report.removed + report.stale, 0);
    assert.equal(fs.readFileSync(activeFile, 'utf8'), stale);
  }
});

test('a debate summary names each seat by its owner kind and derives the outcome from the judge', (t) => {
  const { dir } = fixture(t, { pattern: 'debate' });
  for (const role of ['thesis', 'antithesis']) for (const round of ['1', '2']) result(dir, role, round, '01', { agentClaim: {} });
  const unruled = buildUnitSummary(dir);
  assert.equal(unruled.outcome, 'unknown', 'no ruling yet, so completion cannot be established');
  result(dir, 'judge', '1', '01', { agentClaim: {} });
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'pass');
  const kinds = Object.fromEntries(summary.seats.filter((seat) => seat.round === 1).map((seat) => [seat.seat, [seat.role, seat.kind]]));
  assert.deepEqual(kinds, { antithesis: ['producer', 'producer'], judge: ['judge', 'judge'], thesis: ['producer', 'producer'] });
});

test('the summary shows the pin when present and older records keep their exact bytes', (t) => {
  const collaboration = {
    baseline: { source: 'unit', selector: 'code-change' },
    pattern: { name: 'code-change', layer: 'shipped', digest: 'abc123' },
    effective: {
      loop: 'reviewed',
      params: { maxRounds: 2, minCheckers: ['reviewer', 'red-team'] },
      seats: [
        { seat: 'producer', role: 'producer', posture: { writer: true } },
        { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
        { seat: 'red-team', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      ],
    },
    provenance: {
      params: { maxRounds: 'pattern-default' },
      checkers: { reviewer: 'pattern-invariant:code-change', 'red-team': 'pattern-invariant:code-change' },
    },
  };
  const { dir } = fixture(t, {
    pattern: 'code-change',
    seatSchema: 2,
    collaboration,
    settlement: { outcome: 'pass', settledAt },
  });
  result(dir, 'producer', '1', '01');
  result(dir, 'reviewer', '1', '01');
  result(dir, 'red-team', '1', '01');

  const summary = buildUnitSummary(dir);
  assert.deepEqual(summary.collaboration, {
    loop: 'reviewed',
    params: { maxRounds: 2, minCheckers: ['reviewer', 'red-team'] },
    provenance: {
      params: { maxRounds: 'pattern-default' },
      checkers: { reviewer: 'pattern-invariant:code-change', 'red-team': 'pattern-invariant:code-change' },
    },
  });

  // Older record without collaboration has no collaboration key in summary
  const older = fixture(t, {
    pattern: 'code-change',
    settlement: { outcome: 'pass', settledAt },
  });
  result(older.dir, 'producer', '1', '01');
  result(older.dir, 'reviewer', '1', '01');
  result(older.dir, 'red-team', '1', '01');
  const olderSummary = buildUnitSummary(older.dir);
  assert.equal('collaboration' in olderSummary, false);
  const serialized = serializeUnitSummary(olderSummary);
  assert.equal(serialized.includes('"collaboration"'), false);
  assert.equal(serializeUnitSummary(JSON.parse(serialized)), serialized, 'older records keep their exact bytes');
});

test('solo derived outcome derives from verify when configured, and falls back to producer without verify', (t) => {
  const passFix = fixture(t, {
    pattern: 'solo',
    unit: { id: 'u-solo-pass', capability: 'code:implement', verify: 'npm test' },
  });
  result(passFix.dir, 'producer', '1', '01');
  result(passFix.dir, 'verify', '1', '01');
  const passSummary = buildUnitSummary(passFix.dir);
  assert.equal(passSummary.outcome, 'pass');

  const findingsFix = fixture(t, {
    pattern: 'solo',
    unit: { id: 'u-solo-findings', capability: 'code:implement', verify: 'npm test' },
  });
  result(findingsFix.dir, 'producer', '1', '01');
  result(findingsFix.dir, 'verify', '1', '01', { classification: { outcome: { category: 'verdict' }, assessment: { verdict: 'findings' } } });
  const findingsSummary = buildUnitSummary(findingsFix.dir);
  assert.equal(findingsSummary.outcome, 'findings');

  const missingFix = fixture(t, {
    pattern: 'solo',
    unit: { id: 'u-solo-missing', capability: 'code:implement', verify: 'npm test' },
  });
  result(missingFix.dir, 'producer', '1', '01');
  const missingSummary = buildUnitSummary(missingFix.dir);
  assert.equal(missingSummary.outcome, 'unknown');

  const failProdFix = fixture(t, {
    pattern: 'solo',
    unit: { id: 'u-solo-fail-prod', capability: 'code:implement', verify: 'npm test' },
  });
  result(failProdFix.dir, 'producer', '1', '01', { classification: { outcome: { category: 'blocked' } } });
  const failProdSummary = buildUnitSummary(failProdFix.dir);
  assert.equal(failProdSummary.outcome, 'blocked');

  const noCmdFix = fixture(t, {
    pattern: 'solo',
    unit: { id: 'u-solo-no-cmd', capability: 'docs:write' },
  });
  result(noCmdFix.dir, 'producer', '1', '01');
  const noCmdSummary = buildUnitSummary(noCmdFix.dir);
  assert.equal(noCmdSummary.outcome, 'pass');
});

test('historical rfc retains its single-round terminal findings', (t) => {
  const { dir } = fixture(t, {
    pattern: 'rfc',
    unit: { id: 'u-rfc', capability: 'docs:write' },
  });
  result(dir, 'producer', '1', '01');
  result(dir, 'reviewer', '1', '01', { classification: { outcome: { category: 'verdict' }, assessment: { verdict: 'findings' } } });
  result(dir, 'red-team', '1', '01');
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'findings');
});

test('historical patternName selector remains visible in summary', (t) => {
  const { dir } = fixture(t, {
    pattern: { patternName: 'reviewed' },
    unit: { id: 'old-reviewed', capability: 'docs:write' },
  });
  const summary = buildUnitSummary(dir);
  assert.equal(summary.pattern, 'reviewed');
});

test('unpinned record with unknown non-null custom pattern does not fall back to solo', (t) => {
  const { dir } = fixture(t, {
    pattern: 'custom-unknown-pattern',
    unit: { id: 'custom-u', capability: 'docs:write' },
  });
  result(dir, 'producer', '1', '01');
  const summary = buildUnitSummary(dir);
  assert.equal(summary.outcome, 'undetermined');
});
