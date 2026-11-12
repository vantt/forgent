// test/runner/execution/unit-run-result-fixtures.test.mjs -- the golden Unit run results agree with the outcome
// module that writes their facts, and a real run of an outcome hands up the same facts as its golden file.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VALID_OUTCOMES, NOT_STARTED_OUTCOME, UNDETERMINED_OUTCOME, evaluationsOf, infrastructure, isInfrastructure, outcomeAfterScopeRule,
} from '../../../src/runner/execution/outcome.mjs';

const DIR = fileURLToPath(new URL('../../../packages/run-result/contracts/fixtures/', import.meta.url));
const fixtures = fs.readdirSync(DIR).filter((name) => /^unit-result\..+\.v1\.json$/.test(name)).sort()
  .map((name) => ({ name, ...JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8')) }));

const OUTCOMES_COVERED = [...VALID_OUTCOMES, NOT_STARTED_OUTCOME, UNDETERMINED_OUTCOME];

test('every outcome a reader can meet has a golden file, and each file is named for its id', () => {
  assert.deepEqual(
    [...new Set(fixtures.map((f) => f.data.outcome))].sort(),
    [...OUTCOMES_COVERED].sort(),
  );
  for (const { id, name, why } of fixtures) {
    assert.equal(name, `unit-result.${id}.v1.json`);
    assert.ok(typeof why === 'string' && why.length > 0, `${name} says what it pins`);
  }
  assert.ok(fixtures.some((f) => f.id === 'crash-recovered'));
});

test('every golden file carries every field Execution writes, with its shape', () => {
  for (const { name, data } of fixtures) {
    assert.equal(typeof data.unitRunId, 'string', name);
    assert.ok(Array.isArray(data.results) && Array.isArray(data.findings), name);
    assert.equal(typeof data.infrastructure, 'boolean', name);
    assert.ok(Array.isArray(data.outOfScope) && Array.isArray(data.outOfScopeOnBranch), name);
    assert.ok(Array.isArray(data.evaluations) && Array.isArray(data.warnings), name);
    assert.ok(typeof data.started?.value === 'boolean' && (data.started.reason === null || typeof data.started.reason === 'string'), name);
    assert.deepEqual(Object.keys(data.launches).sort(), ['ceiling', 'ceilingHit', 'used'], name);
    assert.ok(typeof data.settled?.unit === 'boolean', name);
    for (const result of data.results) {
      assert.equal(typeof result.infrastructure, 'boolean', `${name} ${result.seat}`);
      if (result.runResult) assert.deepEqual(Object.keys(result.runResult.activity), ['turns', 'toolUses', 'transcriptPath'], `${name} ${result.seat}`);
    }
  }
});

test('the facts of every golden file are the ones the outcome module derives from its results', () => {
  for (const { name, data } of fixtures) {
    assert.deepEqual(data.evaluations, evaluationsOf(data.results), `${name}: evaluations`);
    assert.equal(data.infrastructure, infrastructure(data), `${name}: infrastructure`);
    for (const result of data.results) assert.equal(result.infrastructure, isInfrastructure(result.outcome), `${name} ${result.seat}: attempt infrastructure`);
    assert.equal(outcomeAfterScopeRule(data.outcome, data.outOfScope), data.outcome, `${name}: the outcome is already final`);
    assert.equal(data.started.value, data.outcome !== NOT_STARTED_OUTCOME, `${name}: only a run that never started says so`);
    assert.equal(data.outOfScope.length > 0 && data.infrastructure, false, `${name}: a path outside the scope is never infrastructure`);
  }
});

test('an outcome that is no verdict is never read as a pass, and only the infrastructure outcomes are infrastructure', () => {
  for (const { name, data } of fixtures) {
    const infra = [NOT_STARTED_OUTCOME, 'execution-failure'].includes(data.outcome);
    assert.equal(data.infrastructure, infra, name);
  }
  const undetermined = fixtures.find((f) => f.id === 'undetermined').data;
  assert.deepEqual([undetermined.infrastructure, undetermined.evaluations], [false, []]);
});
