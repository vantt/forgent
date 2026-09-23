import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMutant } from '../../scripts/test-select-mutate.mjs';

test('C2 Mutant Classifier Tests', async (t) => {
  await t.test('infra-error', () => {
    assert.equal(classifyMutant({ infraError: true }), 'infra-error');
  });
  await t.test('timeout', () => {
    assert.equal(classifyMutant({ timeout: true }), 'timeout');
  });
  await t.test('invalid-syntax', () => {
    assert.equal(classifyMutant({ syntaxError: true }), 'invalid-syntax');
  });
  await t.test('caught (related fails)', () => {
    assert.equal(classifyMutant({ relatedPassed: false }), 'caught');
  });
  await t.test('equivalent-or-missing-test (both pass)', () => {
    assert.equal(classifyMutant({ relatedPassed: true, fullPassed: true }), 'equivalent-or-missing-test');
  });
  await t.test('confirmed-miss (related passes, full fails)', () => {
    assert.equal(classifyMutant({ relatedPassed: true, fullPassed: false }), 'confirmed-miss');
  });
});
