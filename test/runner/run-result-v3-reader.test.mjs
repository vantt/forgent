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

