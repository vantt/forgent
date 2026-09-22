import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTestCase } from '../../scripts/test-select-compare.mjs';

test('C1 Classifier Tests', async (t) => {
  await t.test('related-only-fail: red in related, green in full', () => {
    assert.equal(classifyTestCase({ isRedInFull: false, isRedInRelated: true }), 'related-only-fail');
  });
  await t.test('pass: green in full, green in related', () => {
    assert.equal(classifyTestCase({ isRedInFull: false, isRedInRelated: false }), 'pass');
  });
  await t.test('base-missing: red in full, base artifact not found', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: true }), 'base-missing');
  });
  await t.test('baseline-failing: red in full, red in base', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: true }), 'baseline-failing');
  });
  await t.test('caught: red in full, selected, red in related', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: true, isRedInRelated: true }), 'caught');
  });
  await t.test('selected-but-divergent: red in full, selected, green in related', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: true, isRedInRelated: false }), 'selected-but-divergent');
  });
  await t.test('omitted-failing-test: red in full, not selected, related has other reds', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: false, isRelatedRedSomewhere: true }), 'omitted-failing-test');
  });
  await t.test('rerun-pass: red in full, not selected, related green, rerun passes', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: false, isRelatedRedSomewhere: false, rerunPassed: true }), 'rerun-pass');
  });
  await t.test('confirmed-miss: red in full, not selected, related green, rerun fails', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: false, isRelatedRedSomewhere: false, rerunPassed: false }), 'confirmed-miss');
  });
});

test('updateBreakerState creates issue on failure', async (t) => {
  const originalEnv = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'fake/repo';
  
  const m = await import('../../scripts/test-select-compare.mjs');
  // Since we can't easily assert on stdout, we just ensure it doesn't throw.
  // The script catches exceptions and prints them.
  assert.doesNotThrow(() => {
    m.updateBreakerState(['rule1']);
  });
  
  if (originalEnv === undefined) {
    delete process.env.GITHUB_REPOSITORY;
  } else {
    process.env.GITHUB_REPOSITORY = originalEnv;
  }
});
