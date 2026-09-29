import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  deriveOutcome,
  deriveLegacyOutcome,
  runOutcome,
} from '../../src/runner/dispatch/run-result.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/run-outcome/legacy-derivation.json');

test('legacy-derivation fixture suite: all 17 cases match expected outcomes', () => {
  const cases = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  assert.ok(cases.length >= 17, `Expected at least 17 cases, found ${cases.length}`);

  for (const c of cases) {
    const outcome = runOutcome(c.record);
    assert.equal(
      outcome.category,
      c.expected.category,
      `Case ${c.id}: expected category "${c.expected.category}", got "${outcome.category}"`,
    );
    assert.equal(
      outcome.satisfied,
      c.expected.satisfied,
      `Case ${c.id}: expected satisfied ${c.expected.satisfied}, got ${outcome.satisfied}`,
    );
    assert.equal(
      outcome.infraFailure,
      c.expected.infraFailure,
      `Case ${c.id}: expected infraFailure ${c.expected.infraFailure}, got ${outcome.infraFailure}`,
    );
  }
});

test('runOutcome: fail-closed on corrupt and invalid inputs', () => {
  // null / empty
  assert.equal(runOutcome(null).category, 'corrupt');
  assert.equal(runOutcome(undefined).category, 'corrupt');
  assert.equal(runOutcome({}).category, 'corrupt');

  // Corrupt v2 record
  const corruptV2 = {
    contract: { id: 'assignment-run-result', version: 2 },
    classification: { execution: { status: 'invalid' } },
  };
  const o = runOutcome(corruptV2);
  assert.equal(o.category, 'corrupt');
  assert.equal(o.satisfied, false);
  assert.equal(o.infraFailure, true);
});

test('runOutcome: applies evidenceFloor to downgrade spoofed pass', () => {
  const spoofedPass = {
    contract: { id: 'assignment-run-result', version: 2 },
    runId: 'run_test_spoofed_01',
    status: 'done',
    confidence: 'verified',
    classification: {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict: 'pass' },
      confidence: { level: 'verified', basis: ['claim'] },
      policy: { disposition: 'allow' },
      delivery: { mode: 'fresh' },
      provenance: 'native-v2',
    },
  };

  // Without floor: looks ok
  const rawOutcome = runOutcome(spoofedPass);
  assert.equal(rawOutcome.category, 'ok');
  assert.equal(rawOutcome.satisfied, true);

  // With evidenceFloor (nonzero exit code and dirty files in read-only):
  const downgraded = runOutcome(spoofedPass, {
    evidenceFloor: {
      exitCode: 1,
      isReadOnlyOperation: true,
      hasDirtyBeforeMutation: true,
    },
  });
  assert.equal(downgraded.category, 'infra');
  assert.equal(downgraded.satisfied, false);
  assert.equal(downgraded.infraFailure, true);
});

test('deriveOutcome: strict rule order verification', () => {
  // 1. execution failed + provider failure -> infra
  assert.equal(
    deriveOutcome({
      execution: { status: 'failed' },
      failure: { family: 'provider', code: 'timeout' },
      policy: { disposition: 'refuse' },
    }).category,
    'infra',
  );

  // 2. execution completed + policy refuse -> policy
  assert.equal(
    deriveOutcome({
      execution: { status: 'completed' },
      policy: { disposition: 'refuse', code: 'denied' },
      assessment: { verdict: 'pass' },
    }).category,
    'policy',
  );

  // 3. execution completed + policy needs-input -> infra
  assert.equal(
    deriveOutcome({
      execution: { status: 'completed' },
      policy: { disposition: 'needs-input' },
      assessment: { verdict: 'pass' },
    }).category,
    'infra',
  );

  // 4. verdict findings -> verdict
  assert.equal(
    deriveOutcome({
      execution: { status: 'completed' },
      policy: { disposition: 'allow' },
      assessment: { verdict: 'findings' },
    }).category,
    'verdict',
  );

  // 5. verdict blocked -> blocked
  assert.equal(
    deriveOutcome({
      execution: { status: 'completed' },
      policy: { disposition: 'allow' },
      assessment: { verdict: 'blocked' },
    }).category,
    'blocked',
  );

  // 6. execution completed + verdict pass -> ok
  assert.equal(
    deriveOutcome({
      execution: { status: 'completed' },
      policy: { disposition: 'allow' },
      assessment: { verdict: 'pass' },
    }).category,
    'ok',
  );

  // 7. execution completed + verdict inconclusive -> verdict
  assert.equal(
    deriveOutcome({
      execution: { status: 'completed' },
      policy: { disposition: 'allow' },
      assessment: { verdict: 'inconclusive' },
    }).category,
    'verdict',
  );
});
