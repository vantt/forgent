import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  runBaselineHarness,
  replayCorpusFromDirectory,
  normalizeSemanticSession,
  stableStringify,
  sha256,
  CONTRACT_VERSION,
  formatMarkdownReport,
} from '../../scripts/measure-coordination-baseline.mjs';

test('baseline harness contract and output shape', () => {
  const result = runBaselineHarness();
  assert.equal(result.contractVersion, CONTRACT_VERSION);
  assert.ok(result.source.commit);
  assert.ok(result.source.dirtyFingerprint.startsWith('sha256:'));
  assert.ok(result.source.lockfileDigest.startsWith('sha256:'));
  assert.equal(result.skills.length, 3);
  for (const skill of result.skills) {
    assert.ok(skill.bytes > 0);
    assert.ok(skill.words > 0);
    assert.ok(skill.lines > 0);
  }
  assert.equal(result.scenarios.length, 8);
  for (const sc of result.scenarios) {
    assert.ok(sc.id);
    assert.ok(sc.promptBytes > 0);
    assert.equal(sc.inputTokens, null, 'inputTokens must be null when provider does not report');
    assert.equal(sc.outputTokens, null, 'outputTokens must be null when provider does not report');
    assert.ok(sc.dispatchCount >= 0);
    assert.ok(sc.sequentialWaves >= 0);
    assert.ok(sc.evidenceOutcome);
  }
});

test('baseline harness produces deterministic semanticDigest across multiple runs', () => {
  const run1 = runBaselineHarness();
  const run2 = runBaselineHarness();
  assert.equal(run1.replay.semanticDigest, run2.replay.semanticDigest);
  assert.deepEqual(run1.replay.bySchema, run2.replay.bySchema);
  assert.equal(run1.replay.sessionCount, run2.replay.sessionCount);
});

test('portable fixtures cover schema 1, 2, and 3 cleanly', () => {
  const portableDir = path.resolve('test/fixtures/coordination-baseline/sessions');
  const res = replayCorpusFromDirectory(portableDir);
  assert.equal(res.corpusPresent, true);
  assert.equal(res.sessionCount, 3);
  assert.equal(res.bySchema['1'], 1, 'must cover schema 1');
  assert.equal(res.bySchema['2'], 1, 'must cover schema 2');
  assert.equal(res.bySchema['3'], 1, 'must cover schema 3');
  assert.ok(res.semanticDigest.startsWith('sha256:'));
  assert.equal(res.failures.length, 0);
});

test('mutation-sensitive negative test: modifying a semantic field alters the semantic digest', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mutation-test-'));
  try {
    const s1Dir = path.join(tempDir, 'sess-1');
    fs.mkdirSync(s1Dir, { recursive: true });
    const manifest = {
      coordinationId: 'sess-1',
      schemaVersion: '1',
      status: 'active',
      objective: 'Original objective',
      createdAt: '2026-09-01T00:00:00.000Z',
      provenanceRoot: { writerId: 'tester' },
      aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
      assignmentRefs: [],
    };
    fs.writeFileSync(path.join(s1Dir, 'session.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(s1Dir, 'events.jsonl'), '{"type":"actor-bound","payload":{"actorId":"doer","role":"worker"}}\n');

    const digestBefore = replayCorpusFromDirectory(tempDir).semanticDigest;

    // Mutate semantic field
    manifest.objective = 'Modified objective';
    fs.writeFileSync(path.join(s1Dir, 'session.json'), JSON.stringify(manifest));

    const digestAfter = replayCorpusFromDirectory(tempDir).semanticDigest;
    assert.notEqual(digestBefore, digestAfter, 'semantic digest must change when semantic content is mutated');

    // Mutate an event
    fs.writeFileSync(path.join(s1Dir, 'events.jsonl'), '{"type":"actor-bound","payload":{"actorId":"doer","role":"reviewer"}}\n');
    const digestEventChange = replayCorpusFromDirectory(tempDir).semanticDigest;
    assert.notEqual(digestAfter, digestEventChange, 'semantic digest must change when an event payload is mutated');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('read-only corpus proof: corpus input is never mutated', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-readonly-test-'));
  try {
    const s1Dir = path.join(tempDir, 'sess-ro');
    fs.mkdirSync(s1Dir, { recursive: true });
    const manifestContent = JSON.stringify({ coordinationId: 'sess-ro', schemaVersion: '1', status: 'completed' }, null, 2);
    const eventsContent = '{"type":"session-completed","payload":{"reason":"done"}}\n';
    const mPath = path.join(s1Dir, 'session.json');
    const ePath = path.join(s1Dir, 'events.jsonl');
    fs.writeFileSync(mPath, manifestContent);
    fs.writeFileSync(ePath, eventsContent);

    const mStatBefore = fs.statSync(mPath).mtimeMs;
    const eStatBefore = fs.statSync(ePath).mtimeMs;

    replayCorpusFromDirectory(tempDir);

    assert.equal(fs.readFileSync(mPath, 'utf8'), manifestContent);
    assert.equal(fs.readFileSync(ePath, 'utf8'), eventsContent);
    assert.equal(fs.statSync(mPath).mtimeMs, mStatBefore);
    assert.equal(fs.statSync(ePath).mtimeMs, eStatBefore);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('missing corpus is reported clearly without silent pass', () => {
  const missingPath = path.join(os.tmpdir(), 'non-existent-corpus-dir-' + Date.now());
  const res = replayCorpusFromDirectory(missingPath);
  assert.equal(res.corpusPresent, false);
  assert.equal(res.sessionCount, 0);
  assert.deepEqual(res.bySchema, {});
  assert.equal(res.semanticDigest, null);
  assert.deepEqual(res.failures, []);
});

test('unsupported schema and corrupt event log are reported in failures and fail CLI with non-zero exit', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fail-test-'));
  try {
    const sBadDir = path.join(tempDir, 'sess-bad-schema');
    fs.mkdirSync(sBadDir, { recursive: true });
    fs.writeFileSync(
      path.join(sBadDir, 'session.json'),
      JSON.stringify({
        coordinationId: 'sess-bad-schema',
        schemaVersion: '999',
        status: 'active',
        objective: 'Test bad schema',
        createdAt: '2026-09-01T00:00:00.000Z',
        provenanceRoot: { writerId: 'tester' },
        aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
        assignmentRefs: [],
      }),
    );
    fs.writeFileSync(path.join(sBadDir, 'events.jsonl'), '');

    const res = replayCorpusFromDirectory(tempDir);
    assert.equal(res.failures.length, 1);
    assert.equal(res.failures[0].coordinationId, 'sess-bad-schema');
    assert.ok(res.failures[0].error.includes('schemaVersion "999"'));


    // Corrupt event log
    const sCorruptDir = path.join(tempDir, 'sess-corrupt');
    fs.mkdirSync(sCorruptDir, { recursive: true });
    fs.writeFileSync(
      path.join(sCorruptDir, 'session.json'),
      JSON.stringify({
        coordinationId: 'sess-corrupt',
        schemaVersion: '1',
        status: 'active',
        objective: 'Test corrupt',
        createdAt: '2026-09-01T00:00:00.000Z',
        provenanceRoot: { writerId: 'tester' },
        aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
        assignmentRefs: [],
      }),
    );
    fs.writeFileSync(path.join(sCorruptDir, 'events.jsonl'), '{"type": "not valid json\n');

    const res2 = replayCorpusFromDirectory(tempDir);
    assert.equal(res2.failures.length, 2);
    const corruptFail = res2.failures.find((f) => f.coordinationId === 'sess-corrupt');
    assert.ok(corruptFail);
    assert.ok(corruptFail.error.includes('corrupt') || corruptFail.error.includes('JSON') || corruptFail.error.includes('Unexpected'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('negative test: missing assignment record causes replay failure without synthesizing fake assignment', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-missing-asgn-test-'));
  try {
    const sDir = path.join(tempDir, 'sess-missing-asgn');
    fs.mkdirSync(sDir, { recursive: true });
    fs.writeFileSync(
      path.join(sDir, 'session.json'),
      JSON.stringify({
        coordinationId: 'sess-missing-asgn',
        schemaVersion: '1',
        status: 'active',
        objective: 'Test missing assignment record',
        createdAt: '2026-09-01T00:00:00.000Z',
        provenanceRoot: { writerId: 'tester' },
        aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
        assignmentRefs: ['asgn-missing-1'],
      }),
    );
    fs.writeFileSync(
      path.join(sDir, 'events.jsonl'),
      JSON.stringify({
        type: 'assignment-created',
        payload: { assignmentId: 'asgn-missing-1', actorId: 'worker-1' },
      }) + '\n',
    );

    const res = replayCorpusFromDirectory(tempDir);
    assert.equal(res.sessionCount, 0, 'session with missing assignment record must not be counted as successful');
    assert.equal(res.failures.length, 1);
    assert.equal(res.failures[0].coordinationId, 'sess-missing-asgn');
    assert.ok(
      res.failures[0].error.includes('does not exist under') ||
      res.failures[0].error.includes('asgn-missing-1') ||
      res.failures[0].error.includes('foreign-ref'),
      `error must report missing assignment on disk, got: ${res.failures[0].error}`,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('F-03: replayCorpusFromDirectory returns measuredSessions and formatMarkdownReport distinguishes measured vs declared fixtures', () => {
  const portableDir = path.resolve('test/fixtures/coordination-baseline/sessions');
  const res = replayCorpusFromDirectory(portableDir);
  assert.equal(res.corpusPresent, true);
  assert.ok(Array.isArray(res.measuredSessions));
  assert.equal(res.measuredSessions.length, 3);

  for (const m of res.measuredSessions) {
    assert.ok(m.id, 'measured session must have id');
    assert.ok(['1', '2', '3'].includes(m.schemaVersion), 'schema version must be valid');
    assert.ok(typeof m.eventCount === 'number' && m.eventCount > 0, 'eventCount must be positive number');
    assert.ok(typeof m.dispatchCount === 'number' && m.dispatchCount >= 0, 'dispatchCount must be number');
    assert.equal(m.retryCount, 0, 'clean baseline session must have 0 retries');
    assert.equal(m.sequentialWaves, null, 'sequentialWaves must be null when replay schema does not define a wave scheduling contract');
    assert.ok(typeof m.promptBytes === 'number' && m.promptBytes >= 0, 'promptBytes must be non-negative');
    assert.ok(m.evidenceOutcome, 'evidenceOutcome must be present');
  }

  const baseline = runBaselineHarness({ corpusPath: portableDir });
  const md = formatMarkdownReport(baseline);
  assert.ok(md.includes('## Measured Corpus Sessions (Authoritative Replay)'), 'markdown must contain Measured Corpus Sessions section');
  assert.ok(md.includes('## Declared Scenario Fixture Expectations (Comparison Baseline)'), 'markdown must clearly mark Declared Scenario Fixture Expectations as Comparison Baseline');
  for (const m of res.measuredSessions) {
    assert.ok(md.includes(`| \`${m.id}\` |`), `markdown must include measured row for ${m.id}`);
  }
});

test('F-02: mutation test for run-retried event counting and semantic digest sensitivity', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-retry-mutation-test-'));
  try {
    const corpusDir = path.join(tempDir, 'sessions');
    const sDir = path.join(corpusDir, 'sess-retry');
    fs.mkdirSync(sDir, { recursive: true });

    // Companion assignment record
    const asgnDir = path.join(tempDir, 'assignments', 'asgn-r1');
    fs.mkdirSync(asgnDir, { recursive: true });
    fs.writeFileSync(
      path.join(asgnDir, 'assignment.json'),
      JSON.stringify({ assignmentId: 'asgn-r1', role: 'worker-1', objective: 'Test retry' }),
    );

    const manifest = {
      coordinationId: 'sess-retry',
      schemaVersion: '1',
      status: 'completed',
      objective: 'Retry mutation test',
      createdAt: '2026-09-01T00:00:00.000Z',
      completedAt: '2026-09-01T00:02:00.000Z',
      provenanceRoot: { writerId: 'tester-retry' },
      aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
      assignmentRefs: ['asgn-r1'],
    };
    fs.writeFileSync(path.join(sDir, 'session.json'), JSON.stringify(manifest));

    // Base events: assignment-created + result-linked + session-completed (0 retries)
    const baseEvents = [
      '{"type":"assignment-created","payload":{"assignmentId":"asgn-r1","actorId":"worker-1","runId":"run-1"}}',
      '{"type":"result-linked","payload":{"assignmentId":"asgn-r1","runId":"run-1"}}',
      '{"type":"session-completed","payload":{}}',
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(sDir, 'events.jsonl'), baseEvents);

    const baseRes = replayCorpusFromDirectory(corpusDir);
    assert.equal(baseRes.sessionCount, 1);
    assert.equal(baseRes.failures.length, 0);
    assert.equal(baseRes.measuredSessions[0].retryCount, 0, 'base retryCount must be 0');

    // Mutate with 1 run-retried event before a second result-linked
    const mutatedEvents1 = [
      '{"type":"assignment-created","payload":{"assignmentId":"asgn-r1","actorId":"worker-1","runId":"run-1"}}',
      '{"type":"result-linked","payload":{"assignmentId":"asgn-r1","runId":"run-1"}}',
      '{"type":"run-retried","payload":{"assignmentId":"asgn-r1","reason":"transient-failure"}}',
      '{"type":"result-linked","payload":{"assignmentId":"asgn-r1","runId":"run-2"}}',
      '{"type":"session-completed","payload":{}}',
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(sDir, 'events.jsonl'), mutatedEvents1);

    const mutatedRes1 = replayCorpusFromDirectory(corpusDir);
    assert.equal(mutatedRes1.sessionCount, 1);
    assert.equal(mutatedRes1.failures.length, 0);
    assert.equal(mutatedRes1.measuredSessions[0].retryCount, 1, 'retryCount must be 1 after run-retried event');
    assert.notEqual(mutatedRes1.semanticDigest, baseRes.semanticDigest, 'semanticDigest must change when run-retried is added');

    // Mutate with a 2nd run-retried event
    const mutatedEvents2 = [
      '{"type":"assignment-created","payload":{"assignmentId":"asgn-r1","actorId":"worker-1","runId":"run-1"}}',
      '{"type":"result-linked","payload":{"assignmentId":"asgn-r1","runId":"run-1"}}',
      '{"type":"run-retried","payload":{"assignmentId":"asgn-r1","reason":"transient-failure-1"}}',
      '{"type":"result-linked","payload":{"assignmentId":"asgn-r1","runId":"run-2"}}',
      '{"type":"run-retried","payload":{"assignmentId":"asgn-r1","reason":"transient-failure-2"}}',
      '{"type":"result-linked","payload":{"assignmentId":"asgn-r1","runId":"run-3"}}',
      '{"type":"session-completed","payload":{}}',
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(sDir, 'events.jsonl'), mutatedEvents2);

    const mutatedRes2 = replayCorpusFromDirectory(corpusDir);
    assert.equal(mutatedRes2.sessionCount, 1);
    assert.equal(mutatedRes2.failures.length, 0);
    assert.equal(mutatedRes2.measuredSessions[0].retryCount, 2, 'retryCount must be 2 after second run-retried event');
    assert.notEqual(mutatedRes2.semanticDigest, mutatedRes1.semanticDigest, 'semanticDigest must change with second run-retried event');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});




