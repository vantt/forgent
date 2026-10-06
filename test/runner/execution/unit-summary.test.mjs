import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildUnitSummary, writeUnitSummary, extractStance } from '../../../src/runner/execution/unit-summary.mjs';
import { readUnitRunHistory } from '../../../src/runner/execution/unit-run-history.mjs';
import { backfillUnitSummaries } from '../../../scripts/backfill-unit-summaries.mjs';
import { runPattern } from '../../../src/runner/execution/patterns/index.mjs';

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
  assert.deepEqual(summary.workflow, workflow);
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

test('inline record is a real final seat without dispatch runId and keeps its binding', (t) => {
  const { dir } = fixture(t, { unit: { id: 'inline-answer', capability: 'docs:write', pattern: 'solo', stanceOptions: ['a', 'b'] } });
  result(dir, 'producer', '1', '01', { runId: undefined, executorId: undefined, policy: undefined,
    unitRunId: 'unit-run-synthetic', settledAt: undefined, recordedAt: settledAt,
    binding: { executor: 'lead', persona: 'writer', model: 'local' }, result: { stance: { choice: 'b' } }, agentClaim: undefined });
  const summary = buildUnitSummary(dir);
  assert.equal(summary.inline, true);
  assert.equal(summary.seats[0].final.runId, null);
  assert.equal(summary.seats[0].final.executor, 'lead');
  assert.deepEqual(summary.seats[0].final.stance, { status: 'valid', choice: 'b', confidence: null });
  assert.equal(summary.settledAt, settledAt);
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
  assert.deepEqual(summary.workflow, { runId: 'wf-synthetic', stepId: 'step', unitId: 'question' });
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
  assert.equal(summary.seats.find((seat) => seat.role === 'reviewer' && seat.round === 1).final.outcome, 'findings');
  assert.equal(summary.seats.find((seat) => seat.role === 'reviewer' && seat.round === 2).final.outcome, 'pass');
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

test('panel summary kinds follow the dispatched membership for researcher and arbitrary role labels', async (t) => {
  for (const pattern of [
    'research-fan-out',
    'research-fan-out-gated',
    { pattern: 'panel', params: { members: 9, role: ['cost-lens', 'synthesizer', 'reviewer'], synthesizeRole: 'researcher-chair' } },
  ]) {
    const { root, dir, record } = fixture(t, { pattern });
    const dispatched = [];
    const execution = await runPattern(pattern, record.unit, {}, {
      runRole: async ({ role }) => {
        dispatched.push(role);
        result(dir, role, '1', '01');
        return { role, outcome: 'pass' };
      },
    });
    assert.equal(execution.outcome, 'pass');
    const summary = buildUnitSummary(dir);
    assert.equal(summary.outcome, 'pass');
    const byRole = new Map(summary.seats.map((seat) => [seat.role, seat]));
    for (const role of dispatched.slice(0, -1)) {
      assert.equal(byRole.get(role).kind, 'panelist');
      assert.equal(byRole.get(role).final.stance.status, 'valid');
    }
    assert.equal(byRole.get(dispatched.at(-1)).kind, 'synthesizer');
    assert.equal(backfillUnitSummaries({ repoRoot: root }).changed, 1);
    const stored = JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
    assert.deepEqual(stored.seats.map(({ role, kind }) => ({ role, kind })),
      summary.seats.map(({ role, kind }) => ({ role, kind })));
  }
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
  for (const status of ['running', 'pending-inline', 'pending']) {
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

test('backfill skips legacy pending inline and materialized attempts without terminal results', (t) => {
  for (const inline of [true, false]) {
    const { root, dir } = fixture(t, { pattern: 'solo' });
    result(dir, 'producer', '1', '01');
    if (inline) {
      fs.writeFileSync(path.join(dir, 'pending-inline.json'), JSON.stringify({ role: 'producer', nonce: 'pending' }));
    } else {
      const live = path.join(dir, 'producer', '1', 'runs', '02');
      fs.mkdirSync(live);
      fs.writeFileSync(path.join(live, 'run.json'), JSON.stringify({ status: 'running', runId: 'still-working' }));
    }
    const report = backfillUnitSummaries({ repoRoot: root });
    assert.equal(report.skippedActive, 1);
    assert.equal(report.changed, 0);
    assert.equal(fs.existsSync(path.join(dir, 'unit-summary.json')), false);
  }
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
  assert.equal(summary.seats.find((seat) => seat.role === 'reviewer').final.outcome, 'blocked', 'seat facts stay recorded');
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
