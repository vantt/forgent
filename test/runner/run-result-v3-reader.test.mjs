import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  interpretRunResult,
  validateRunResultV3,
  deriveOutcome,
  runOutcome,
} from '../../src/runner/dispatch/run-result.mjs';

import {
  readLinkedRunResultFromDisk,
  synthesizeResearchFanIn,
} from '../../src/runner/coordination/session-engine.mjs';

import { DEFAULT_AGGREGATE_BOUNDS } from '../../src/runner/coordination/schema.mjs';

function makeValidV3(overrides = {}) {
  const classification = {
    execution: { status: 'completed', exitCode: 0 },
    assessment: { verdict: 'pass' },
    confidence: { level: 'verified', basis: ['git-diff'] },
    failure: null,
    policy: { disposition: 'allow', code: null },
    delivery: { mode: 'fresh' },
    provenance: 'native-v3',
    outcome: { category: 'ok', reason: 'completed-pass' },
    ...(overrides.classification || {}),
  };

  return {
    contract: { id: 'assignment-run-result', version: 3 },
    runId: 'run_asgn_test_v3_01',
    assignmentId: 'asgn_test_v3',
    adapter: 'cli-spawn',
    role: 'worker',
    durationMs: 1250,
    classification,
    usage: {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      source: 'pi',
    },
    ...overrides,
  };
}

test('validateRunResultV3: validates valid v3 RunResult', () => {
  const v3 = makeValidV3();
  const validation = validateRunResultV3(v3, { expectedRunId: 'run_asgn_test_v3_01' });
  assert.equal(validation.valid, true);
  assert.equal(validation.corrupt, false);
  assert.deepEqual(validation.reasons, []);
});

test('validateRunResultV3: rejects record with mismatched runId', () => {
  const v3 = makeValidV3({ runId: 'run_other' });
  const validation = validateRunResultV3(v3, { expectedRunId: 'run_asgn_test_v3_01' });
  assert.equal(validation.valid, false);
  assert.equal(validation.corrupt, true);
  assert.ok(validation.reasons.some((r) => r.includes('does not match expectedRunId')));
});

test('validateRunResultV3: rejects spoofed category (checked cache invariant)', () => {
  // Classification execution is failed, but outcome.category is spoofed to 'ok'
  const spoofedV3 = makeValidV3({
    classification: {
      execution: { status: 'failed', exitCode: 1 },
      assessment: { verdict: 'not-applicable' },
      confidence: { level: 'failed', basis: ['failed-exit'] },
      failure: { family: 'provider', code: 'nonzero-exit' },
      policy: { disposition: 'needs-input', code: 'nonzero-exit' },
      outcome: { category: 'ok', reason: 'spoofed-pass' }, // Lie!
    },
  });

  const validation = validateRunResultV3(spoofedV3);
  assert.equal(validation.valid, false, 'Tampered category must fail validation');
  assert.equal(validation.corrupt, true);
  assert.ok(validation.reasons.some((r) => r.includes('does not match deriveOutcome')));
});

test('interpretRunResult: branches cleanly across v1, v2, and v3 contracts', () => {
  // 1. v1 record (contract absent)
  const v1Record = {
    runId: 'run_v1_01',
    assignmentId: 'asgn_v1',
    status: 'done',
    confidence: 'verified',
  };
  const interpretedV1 = interpretRunResult(v1Record);
  assert.equal(interpretedV1.classification.delivery.mode, 'legacy-derived');
  assert.equal(interpretedV1.status, 'done');

  // 2. v2 record
  const v2Record = {
    contract: { id: 'assignment-run-result', version: 2 },
    runId: 'run_v2_01',
    assignmentId: 'asgn_v2',
    status: 'done',
    confidence: 'verified',
    classification: {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict: 'pass' },
      confidence: { level: 'verified', basis: ['valid-agent-result-claim'] },
      failure: null,
      policy: { disposition: 'allow', code: null },
      delivery: { mode: 'fresh' },
      provenance: 'native-v2',
    },
  };
  const interpretedV2 = interpretRunResult(v2Record);
  assert.equal(interpretedV2.contract.version, 2);
  assert.equal(interpretedV2.corrupt, undefined);

  // 3. v3 record
  const v3Record = makeValidV3();
  const interpretedV3 = interpretRunResult(v3Record);
  assert.equal(interpretedV3.contract.version, 3);
  assert.equal(interpretedV3.corrupt, undefined);

  // 4. Unsupported contract (e.g. version 99) fails closed as contract-corrupt
  const unsupported = {
    contract: { id: 'assignment-run-result', version: 99 },
    runId: 'run_alien_01',
  };
  const interpretedAlien = interpretRunResult(unsupported);
  assert.equal(interpretedAlien.corrupt, true);
  assert.equal(interpretedAlien.contractCorrupt, true);
  assert.equal(interpretedAlien.classification.provenance, 'contract-corrupt');
});

test('session reader integration: session containing both v2 and v3 results reads cleanly', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-v2-v3-session-'));
  const fgosDir = path.join(tmp, '.fgos');
  const coordinationId = 'coord_mixed_versions';
  const sessDir = path.join(fgosDir, 'coordination', 'sessions', coordinationId);

  fs.mkdirSync(sessDir, { recursive: true });

  const asgn1Id = 'asgn_worker_v2';
  const asgn2Id = 'asgn_worker_v3';
  const run1Id = `run_${asgn1Id}_01`;
  const run2Id = `run_${asgn2Id}_01`;

  const v2Record = {
    contract: { id: 'assignment-run-result', version: 2 },
    runId: run1Id,
    assignmentId: asgn1Id,
    status: 'done',
    confidence: 'verified',
    classification: {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict: 'pass' },
      confidence: { level: 'verified', basis: ['claim'] },
      failure: null,
      policy: { disposition: 'allow', code: null },
      delivery: { mode: 'fresh' },
      provenance: 'native-v2',
    },
  };

  const v3Record = makeValidV3({
    runId: run2Id,
    assignmentId: asgn2Id,
  });

  // Write assignments and runs
  for (const [asgnId, record] of [[asgn1Id, v2Record], [asgn2Id, v3Record]]) {
    const asgnDir = path.join(fgosDir, 'assignments', asgnId);
    fs.mkdirSync(path.join(asgnDir, 'runs', '01'), { recursive: true });
    fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify({
      id: asgnId,
      assignmentId: asgnId,
      provenance: { inline: { contract: { contextRefs: [] } } },
    }));
    fs.writeFileSync(path.join(asgnDir, 'runs', '01', 'result.json'), JSON.stringify(record));
  }

  // Write session manifest and events
  fs.writeFileSync(path.join(sessDir, 'session.json'), JSON.stringify({
    schemaVersion: '2',
    coordinationId,
    status: 'active',
    objective: 'Mixed v2 and v3 test session',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'test-writer' },
    aggregateBounds: { ...DEFAULT_AGGREGATE_BOUNDS },
    assignmentRefs: [asgn1Id, asgn2Id],
  }));

  fs.writeFileSync(path.join(sessDir, 'events.jsonl'), [
    JSON.stringify({ seq: 1, type: 'assignment-created', payload: { actorId: 'worker-v2', assignmentId: asgn1Id } }),
    JSON.stringify({ seq: 2, type: 'result-linked', payload: { assignmentId: asgn1Id, runId: run1Id } }),
    JSON.stringify({ seq: 3, type: 'assignment-created', payload: { actorId: 'worker-v3', assignmentId: asgn2Id } }),
    JSON.stringify({ seq: 4, type: 'result-linked', payload: { assignmentId: asgn2Id, runId: run2Id } }),
  ].join('\n') + '\n');

  // Verify direct readLinkedRunResultFromDisk
  const r1 = readLinkedRunResultFromDisk(fgosDir, asgn1Id, run1Id);
  assert.equal(r1.contract.version, 2);
  const o1 = runOutcome(r1);
  assert.equal(o1.category, 'ok');
  assert.equal(o1.satisfied, true);

  const r2 = readLinkedRunResultFromDisk(fgosDir, asgn2Id, run2Id);
  assert.equal(r2.contract.version, 3);
  const o2 = runOutcome(r2);
  assert.equal(o2.category, 'ok');
  assert.equal(o2.satisfied, true);

  // Verify synthesizeResearchFanIn handles mixed v2/v3 session cleanly
  const fanIn = synthesizeResearchFanIn(coordinationId, {
    branchActorIds: ['worker-v2', 'worker-v3'],
  }, { cwd: tmp, repoRoot: tmp });

  assert.equal(fanIn.status, 'synthesized');
  assert.equal(fanIn.accepted.length, 2);
  assert.deepEqual(fanIn.accepted.map((x) => x.actorId).sort(), ['worker-v2', 'worker-v3']);
});
