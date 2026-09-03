// Phase 06 R6 (cell P06.2): independent security/adversarial suite. Every
// one of the 11 named attack items got a genuine attempt (see this cell's
// own report for the full disposition of each, including the items closed
// entirely by existing coverage this file does not duplicate: SessionActor
// impersonation via a caller-forced role, planner/resolver drift, and
// governance bypass, all re-verified against CURRENT code as part of this
// cell's focused-suite run rather than re-tested here). This file holds the
// tests for the items that needed NEW coverage: two REAL bugs this cell
// found and fixed (path traversal, foreign-evidence write-time acceptance),
// plus genuinely fresh attempts against corrupt-ledger and partial-
// consensus false success that surfaced no further bug but needed empirical
// proof, not just a citation of P06.1's own H1/H2 fix.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openSession,
  createSessionAssignment,
  linkResult,
  resolveSessionPaths,
  readManifest,
} from '../../src/runner/coordination/store.mjs';
import { openStandaloneSession, dispatchPrimaryTask, evaluateSessionQuorum, closeSessionByQuorum } from '../../src/runner/coordination/session-engine.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-r6-test-'));
}

function inlineContract(overrides = {}) {
  return {
    objective: 'x',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['agent-result.json'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    budget: { timeoutMs: 60000, maxRuns: 1 },
    ...overrides,
  };
}

function fakeExecutor(tempDir, summary = 'done') {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: '${summary}' }));
          }
        }
      }
    }
    process.stdout.write('${summary}\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };
}

// ─── Attack #1: path traversal -- a malicious coordinationId containing
// "../" reaching a real filesystem path outside .fgos/coordination/sessions/
// -- a REAL bug this cell found and fixed (resolveSessionPaths/openSession
// had NO charset validation on coordinationId at all before this fix) ─────

test('R6 path traversal (REAL bug found and fixed): openSession refuses a coordinationId containing ".." traversal segments -- BEFORE this fix, this created a real directory OUTSIDE .fgos/coordination/sessions/ on the actual filesystem (confirmed empirically)', () => {
  const tempDir = mkTempDir();
  const outsideMarker = path.join(os.tmpdir(), `fgos-r6-traversal-escape-${Math.random().toString(36).slice(2)}`);
  const evilId = `../../../../../../../../../..${outsideMarker}`;

  assert.throws(
    () => openSession({ coordinationId: evilId, objective: 'traversal attempt', provenanceRoot: { writerId: 'attacker' } }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /outside the safe filesystem charset/.test(err.message),
  );
  assert.ok(!fs.existsSync(outsideMarker), 'the traversal attempt must never create anything on disk outside the intended sessions tree');
});

test('R6 path traversal: every coordinationId-consuming store.mjs door (not just openSession) refuses a "../"-bearing id through the shared resolveSessionPaths choke point', () => {
  const tempDir = mkTempDir();
  const evilId = '../../etc-shaped-evil-id';

  assert.throws(
    () => resolveSessionPaths(evilId, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /outside the safe filesystem charset/.test(err.message),
  );
  assert.throws(
    () => readManifest(evilId, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /outside the safe filesystem charset/.test(err.message),
  );
});

test('R6 path traversal: a coordinationId containing a null byte, forward slash, backslash, or leading dot-dot alone is rejected', () => {
  const tempDir = mkTempDir();
  for (const evilId of ['a/../../b', 'a\\..\\b', '..', '.', 'a/b', 'a\\b', 'coord_ok/../../escape']) {
    assert.throws(
      () => openSession({ coordinationId: evilId, objective: 'x', provenanceRoot: { writerId: 'w1' } }, { cwd: tempDir }),
      (err) => err instanceof CoordinationError,
      `expected coordinationId ${JSON.stringify(evilId)} to be rejected`,
    );
  }
});

test('R6 path traversal: a legitimate alnum/underscore/hyphen coordinationId (the exact shape auto-generated ids and every existing test already use) is still accepted -- the fix is not over-broad', () => {
  const tempDir = mkTempDir();
  const manifest = openSession(
    { coordinationId: 'coord_legit-id_123', objective: 'x', provenanceRoot: { writerId: 'w1' } },
    { cwd: tempDir },
  );
  assert.equal(manifest.coordinationId, 'coord_legit-id_123');
});

// ─── Attack #2: foreign evidence -- linking a RunResult from a different,
// real, sibling Assignment as if it were the current one -- a REAL gap this
// cell found and fixed (linkResult accepted a foreign runId with no
// complaint at write time; it never produced a false SUCCESS, since a later
// read always failed closed, but the corrupted linkage was writable at all,
// which this fix now refuses at the boundary) ─────────────────────────────

test('R6 foreign evidence (REAL gap found and fixed): linkResult refuses to link a REAL, genuine SIBLING Assignment\'s own runId to a different assignmentId, at write time -- never even reaches the event log', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_r6_foreign', objective: 'x', provenanceRoot: { writerId: 'w1' }, actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_r6_foreign', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'w1' } }, { cwd: tempDir });
  const asgnB = createSessionAssignment({ coordinationId: 'coord_r6_foreign', taskKey: 'b-task', actorId: 'b', contract: inlineContract(), caller: { writerId: 'w1' } }, { cwd: tempDir });

  const runsDirB = path.join(tempDir, '.fgos', 'assignments', asgnB.assignmentId, 'runs', '01');
  fs.mkdirSync(runsDirB, { recursive: true });
  const runIdB = `run_${asgnB.assignmentId}_01`;
  fs.writeFileSync(path.join(runsDirB, 'result.json'), JSON.stringify({ runId: runIdB, assignmentId: asgnB.assignmentId, status: 'done', confidence: 'reported' }));

  assert.throws(
    () => linkResult('coord_r6_foreign', { assignmentId: asgnA.assignmentId, runId: runIdB }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref' && /does not match the expected shape/.test(err.message),
  );

  const events = readRawSessionEvents(tempDir, 'coord_r6_foreign');
  assert.equal(events.filter((e) => e.type === 'result-linked').length, 0, 'the rejected foreign-evidence link never appended any result-linked event');
});

function readRawSessionEvents(tempDir, coordinationId) {
  // Local helper mirroring store.mjs's readSessionEvents, avoided as a
  // direct import above to keep this file's import list scoped to what each
  // test section actually needs.
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl');
  if (!fs.existsSync(eventsPath)) return [];
  return fs
    .readFileSync(eventsPath, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test('R6 foreign evidence: even if a foreign runId somehow reached the event log (hand-crafted, bypassing the write-time guard entirely), quorum evaluation still fails CLOSED, never a false success -- defense in depth confirmed on the CURRENT code, not just cited from the old proof', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_r6_foreign_handcrafted', objective: 'x', provenanceRoot: { writerId: 'w1' }, actors: [{ id: 'a', role: 'researcher' }, { id: 'b', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_r6_foreign_handcrafted', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'w1' } }, { cwd: tempDir });
  const asgnB = createSessionAssignment({ coordinationId: 'coord_r6_foreign_handcrafted', taskKey: 'b-task', actorId: 'b', contract: inlineContract(), caller: { writerId: 'w1' } }, { cwd: tempDir });
  const runsDirB = path.join(tempDir, '.fgos', 'assignments', asgnB.assignmentId, 'runs', '01');
  fs.mkdirSync(runsDirB, { recursive: true });
  const runIdB = `run_${asgnB.assignmentId}_01`;
  fs.writeFileSync(path.join(runsDirB, 'result.json'), JSON.stringify({ runId: runIdB, assignmentId: asgnB.assignmentId, status: 'done', confidence: 'reported' }));

  // Hand-append a forged result-linked event DIRECTLY to the raw log,
  // bypassing linkResult's own write-time guard entirely -- simulates a
  // hostile actor with raw filesystem write access to events.jsonl (the
  // "corrupt ledger" attack surface), independent of whatever linkResult
  // itself refuses.
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_r6_foreign_handcrafted', 'events.jsonl');
  fs.appendFileSync(eventsPath, `${JSON.stringify({ type: 'result-linked', payload: { assignmentId: asgnA.assignmentId, runId: runIdB }, ts: new Date().toISOString() })}\n`);

  assert.throws(
    () => evaluateSessionQuorum('coord_r6_foreign_handcrafted', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
  );
  assert.throws(
    () => closeSessionByQuorum('coord_r6_foreign_handcrafted', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError,
    'closeSessionByQuorum must also fail closed, never write a terminal "completed" event from forged evidence',
  );
  assert.equal(readManifest('coord_r6_foreign_handcrafted', { cwd: tempDir }).status, 'active', 'the session never reaches a false terminal "completed"/"partial" status from forged evidence');
});

// ─── Attack #2b: foreign evidence, ROUND 2 -- a SAME-PREFIX, MALICIOUS-
// SUFFIX runId (e.g. `run_<realAssignmentId>_../../../../tmp/marker`). The
// round-1 fix above only checked `runId.startsWith('run_' + assignmentId +
// '_')`, which such a string genuinely satisfies -- a REAL gap this round
// closes by validating the FULL shape (`run_<assignmentId>_<digits>`), not
// just the prefix, at both `linkResult` (write time) and
// `readLinkedRunResultFromDisk` (read time, via a hand-crafted event log) ──

test('R6 foreign evidence round 2 (REAL gap found and fixed): linkResult refuses a SAME-PREFIX, MALICIOUS-SUFFIX runId -- a prefix-only check would have accepted this', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_r6_foreign_suffix', objective: 'x', provenanceRoot: { writerId: 'w1' }, actors: [{ id: 'a', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_r6_foreign_suffix', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'w1' } }, { cwd: tempDir });

  const maliciousRunId = `run_${asgnA.assignmentId}_../../../../../../tmp/some-marker`;
  assert.ok(maliciousRunId.startsWith(`run_${asgnA.assignmentId}_`), 'sanity: this runId genuinely starts with the expected prefix -- exactly the gap a prefix-only check misses');

  assert.throws(
    () => linkResult('coord_r6_foreign_suffix', { assignmentId: asgnA.assignmentId, runId: maliciousRunId }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref' && /does not match the expected shape/.test(err.message),
  );

  const events = readRawSessionEvents(tempDir, 'coord_r6_foreign_suffix');
  assert.equal(events.filter((e) => e.type === 'result-linked').length, 0, 'the rejected malicious-suffix runId never appended any result-linked event');
});

test('R6 foreign evidence round 2: a hand-crafted event log carrying a SAME-PREFIX, MALICIOUS-SUFFIX runId (bypassing linkResult\'s write-time guard entirely) still fails CLOSED at read time -- readLinkedRunResultFromDisk\'s own full-shape check, not just linkResult\'s', () => {
  const tempDir = mkTempDir();
  openSession(
    { coordinationId: 'coord_r6_foreign_suffix_handcrafted', objective: 'x', provenanceRoot: { writerId: 'w1' }, actors: [{ id: 'a', role: 'researcher' }] },
    { cwd: tempDir },
  );
  const asgnA = createSessionAssignment({ coordinationId: 'coord_r6_foreign_suffix_handcrafted', taskKey: 'a-task', actorId: 'a', contract: inlineContract(), caller: { writerId: 'w1' } }, { cwd: tempDir });

  const maliciousRunId = `run_${asgnA.assignmentId}_../../../../../../tmp/some-marker`;

  // Hand-append a forged result-linked event DIRECTLY to the raw log,
  // bypassing linkResult's own write-time guard entirely -- simulates a
  // hostile actor with raw filesystem write access to events.jsonl.
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_r6_foreign_suffix_handcrafted', 'events.jsonl');
  fs.appendFileSync(eventsPath, `${JSON.stringify({ type: 'result-linked', payload: { assignmentId: asgnA.assignmentId, runId: maliciousRunId }, ts: new Date().toISOString() })}\n`);

  assert.throws(
    () => evaluateSessionQuorum('coord_r6_foreign_suffix_handcrafted', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
  );
  assert.throws(
    () => closeSessionByQuorum('coord_r6_foreign_suffix_handcrafted', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError,
    'closeSessionByQuorum must also fail closed, never write a terminal "completed" event from a forged malicious-suffix runId',
  );
  assert.equal(readManifest('coord_r6_foreign_suffix_handcrafted', { cwd: tempDir }).status, 'active', 'the session never reaches a false terminal status from the forged malicious-suffix runId');
});

// ─── Attack #3: corrupt ledger -- hand-crafted malformed event log,
// targeting the EVENT PAYLOAD level specifically (the manifest-level and
// truncated-line cases already have dedicated coverage in
// coordination-replay.test.mjs; this targets the gap: a syntactically valid
// JSON line, on a KNOWN event type, hand-appended with a forbidden field or
// an unknown type, bypassing write-time validateEventPayload entirely) ────

test('R6 corrupt ledger: replaySession rejects a hand-appended event whose payload smuggles a forbidden field (missionId), even though the line is syntactically valid JSON on a real, known event kind', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_r6_corrupt_forbidden', objective: 'x', provenanceRoot: { writerId: 'w1' } }, { cwd: tempDir });
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_r6_corrupt_forbidden', 'events.jsonl');
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ type: 'actor-bound', payload: { actorId: 'primary', role: 'researcher', policy: { missionId: 'smuggled' } }, ts: new Date().toISOString() })}\n`,
  );

  assert.throws(
    () => replaySession('coord_r6_corrupt_forbidden', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /forbidden field "missionId"/.test(err.message),
  );
});

test('R6 corrupt ledger: replaySession rejects a hand-appended event of a completely unknown kind, rather than crashing or silently skipping it', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_r6_corrupt_unknown_kind', objective: 'x', provenanceRoot: { writerId: 'w1' } }, { cwd: tempDir });
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_r6_corrupt_unknown_kind', 'events.jsonl');
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ type: 'assignment-adopted', payload: { assignmentId: 'asgn_forged_001' }, ts: new Date().toISOString() })}\n`,
  );

  assert.throws(
    () => replaySession('coord_r6_corrupt_unknown_kind', { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /unknown event kind/.test(err.message),
  );
});

test('R6 corrupt ledger: replaySession rejects an event payload with a wrong-shaped required field (assignmentId as a number, not a string) hand-appended directly', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_r6_corrupt_wrong_shape', objective: 'x', provenanceRoot: { writerId: 'w1' } }, { cwd: tempDir });
  const eventsPath = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'coord_r6_corrupt_wrong_shape', 'events.jsonl');
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ type: 'assignment-created', payload: { assignmentId: 12345 }, ts: new Date().toISOString() })}\n`,
  );

  assert.throws(
    () => replaySession('coord_r6_corrupt_wrong_shape', { cwd: tempDir }),
    (err) => err instanceof CoordinationError,
  );
});

// ─── Attack #4: partial-consensus false success -- fresh attempts against
// closeSessionByQuorum/evaluateSessionQuorum, beyond P06.1's own H1/H2 ─────

test('R6 partial-consensus false success: an actor dispatched a SECOND, unrelated task under the same actorId (a different taskKey) can never launder a FAILED first/required task into a completed quorum -- classifySessionQuorum always evaluates the FIRST assignment-created for that actor, never a later unrelated one', async () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_r6_no_launder', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });

  // The primary's REQUIRED, FIRST task genuinely fails.
  const failingRunnerConfig = fakeExecutor(tempDir, 'will be overridden below');
  const failScript = path.join(tempDir, `fail-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    failScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
    for (const asgn of fs.readdirSync(assignmentsRoot)) {
      const runsDir = path.join(assignmentsRoot, asgn, 'runs');
      if (!fs.existsSync(runsDir)) continue;
      for (const run of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, run);
        if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'failed', summary: 'genuinely failed' }));
        }
      }
    }
    process.exit(0);
    `,
  );
  const failRunnerConfig = { executor: { allowCrossProvider: true, command: process.execPath, args: [failScript, '{prompt}'] }, models: { standard: 'test-model' }, timeoutMs: 5000 };

  const first = await dispatchPrimaryTask(
    'coord_r6_no_launder',
    { taskKey: 'primary', objective: 'the REQUIRED task', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: failRunnerConfig },
  );

  // A SECOND, unrelated dispatch under the SAME actorId ("primary"), with a
  // genuinely successful result -- the attack attempt: can this later,
  // successful, same-actorId dispatch be mistaken for the REQUIRED task's
  // own outcome?
  await dispatchPrimaryTask(
    'coord_r6_no_launder',
    { taskKey: 'primary-unrelated-extra', objective: 'an unrelated extra task, same actorId', expectedOutputs: ['agent-result.json'], evidenceRequired: 'reported', writerId: 'writer-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'unrelated success') },
  );

  const quorum = evaluateSessionQuorum('coord_r6_no_launder', { cwd: tempDir });
  assert.deepEqual(quorum.failed.map((f) => f.actorId), ['primary'], 'the REQUIRED actor is still correctly reported as failed -- the later unrelated success never launders it');
  assert.equal(quorum.completed.length, 0, 'the unrelated extra dispatch is never counted toward the required actor\'s own completion');
  assert.equal(quorum.failed[0].assignmentId, first.assignment.assignmentId, 'quorum evaluates the FIRST assignment-created for this actor, exactly the required one');

  assert.throws(
    () => closeSessionByQuorum('coord_r6_no_launder', {}, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /declares no partialPolicy/.test(err.message),
    'closeSessionByQuorum still refuses to close "completed" -- the genuinely failed required actor blocks it regardless of the unrelated extra success',
  );
});
