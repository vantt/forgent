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

test('AC 5: Registry mutant metadata generator injects ruleHash and boundary', async (t) => {
  const crypto = await import('node:crypto');
  const { generateMutantPayload, generateMutantPayloads, computeRuleHash } = await import('../../scripts/test-select-mutate.mjs');
  const { mutants } = await import('../test-ownership-mutants.mjs');
  const { MANIFEST } = await import('../test-ownership.mjs');

  await t.test('computeRuleHash calculates sha256 of normalized rule and is invariant to status', () => {
    const sampleRule1 = { id: 'sample', status: 'shadow', pattern: 'src/sample.mjs', directTests: ['test/b.mjs', 'test/a.mjs'], boundaryTests: [] };
    const sampleRule2 = { pattern: 'src/sample.mjs', status: 'live', id: 'sample', boundaryTests: [], directTests: ['test/a.mjs', 'test/b.mjs'] };
    const hash1 = computeRuleHash(sampleRule1);
    const hash2 = computeRuleHash(sampleRule2);
    assert.equal(hash1, hash2, 'Hash must be identical regardless of status or key ordering');
    assert.match(hash1, /^[a-f0-9]{64}$/);
    assert.equal(computeRuleHash(null), null);
  });

  await t.test('generateMutantPayload rejects mutant lacking boundary and rule lacking boundary', () => {
    const mutantWithoutBoundary = {
      id: 'm-bad-1',
      ruleId: 'intake-classify',
      file: 'src/intake/classify.mjs',
      find: 'foo',
      replace: 'bar'
    };
    // intake-classify in MANIFEST has no boundary property, and mutant has no boundary -> must return null
    const payload = generateMutantPayload(mutantWithoutBoundary, MANIFEST);
    assert.equal(payload, null, 'Must reject mutant without boundary metadata instead of fabricating defaults');
  });

  await t.test('generateMutantPayload preserves explicit boundary when provided', () => {
    const rawMutant = {
      id: 'm-test-2',
      ruleId: 'intake-classify',
      file: 'src/intake/classify.mjs',
      boundary: 'custom-boundary-1',
      find: 'foo',
      replace: 'bar'
    };

    const payload = generateMutantPayload(rawMutant, MANIFEST);
    assert.ok(payload);
    assert.equal(payload.boundary, 'custom-boundary-1');
    assert.ok(payload.ruleHash);
    assert.match(payload.ruleHash, /^[a-f0-9]{64}$/);
  });

  await t.test('generateMutantPayloads successfully enriches all registry mutants with ruleHash and boundary', () => {
    const payloads = generateMutantPayloads(mutants, MANIFEST);
    assert.ok(payloads.length > 0);
    for (const p of payloads) {
      assert.ok(p.id, 'Mutant must have id');
      assert.ok(p.ruleHash, `Mutant ${p.id} must have ruleHash`);
      assert.match(p.ruleHash, /^[a-f0-9]{64}$/, `Mutant ${p.id} ruleHash must be sha256`);
      assert.ok(p.boundary, `Mutant ${p.id} must have boundary`);
      assert.notEqual(p.boundary.trim(), '');
    }
  });
});

