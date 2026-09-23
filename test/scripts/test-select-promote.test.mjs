import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  computeRuleHash,
  evaluateRulePromotion,
  aggregateRuleEvidence,
  promoteRules
} from '../../scripts/test-select-promote.mjs';

test('AC 6: Evidence & Promote per-rule (§14 & §3.4 criteria)', async (t) => {
  const sampleRule = {
    id: 'rule-state-edit',
    status: 'shadow',
    pattern: 'src/verbs/state/edit.mjs',
    directTests: ['test/direct/fgos-edit.test.mjs'],
    boundaryTests: []
  };
  const hash = computeRuleHash(sampleRule);

  await t.test('computeRuleHash returns consistent sha256 hash', () => {
    const h1 = computeRuleHash(sampleRule);
    const h2 = computeRuleHash({ ...sampleRule });
    assert.equal(h1, h2);
    assert.match(h1, /^[a-f0-9]{64}$/);
  });

  await t.test('promotes shadow to live when all criteria are met (N=3, K=10, clean baseline, 0 miss, wallTime measured, coverage-set subset)', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 3,
      mutantKillRate: 1.0,
      failureOpportunities: 10,
      wallTimeRatio: 0.35
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, true);
    assert.equal(result.newStatus, 'live');
    assert.equal(result.reason, 'criteria-met');
  });

  await t.test('rejects promotion if baseline is dirty on selected or control set (per §14)', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: false,
      confirmedMisses: 0,
      validMutantCount: 5,
      mutantKillRate: 1.0,
      failureOpportunities: 15,
      wallTimeRatio: 0.3
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.newStatus, 'shadow');
    assert.equal(result.reason, 'baseline-dirty');
  });

  await t.test('rejects promotion if failure opportunities K < 10', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 4,
      mutantKillRate: 1.0,
      failureOpportunities: 9, // Below K=10
      wallTimeRatio: 0.3
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'insufficient-opportunities');
  });

  await t.test('rejects promotion if valid mutants N < 3', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 2, // Below N=3
      mutantKillRate: 1.0,
      failureOpportunities: 12,
      wallTimeRatio: 0.3
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'insufficient-mutants');
  });

  await t.test('rejects promotion if mutant kill rate is below 100%', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 4,
      mutantKillRate: 0.75, // Not 100%
      failureOpportunities: 12,
      wallTimeRatio: 0.3
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'mutant-kill-rate-sub-100');
  });

  await t.test('rejects promotion if mutant kill rate is missing', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 3,
      // mutantKillRate missing
      failureOpportunities: 12,
      wallTimeRatio: 0.3
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'mutant-kill-rate-missing');
  });

  await t.test('rejects promotion if wall-time ratio is missing (H5 must be measured)', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 3,
      mutantKillRate: 1.0,
      failureOpportunities: 10
      // wallTimeRatio missing
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'wall-time-ratio-missing');
  });

  await t.test('rejects promotion if wall-time ratio exceeds threshold', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 3,
      mutantKillRate: 1.0,
      failureOpportunities: 10,
      wallTimeRatio: 0.95 // Exceeds default 0.8
    };

    const result = evaluateRulePromotion(sampleRule, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'wall-time-ratio-too-high');
  });

  await t.test('rejects promotion if coverage-set is not a subset of rule-set (§3.4)', () => {
    const ruleWithCoverage = {
      ...sampleRule,
      coverageSet: ['test/direct/fgos-edit.test.mjs', 'test/unmapped/outside.test.mjs']
    };
    const evidence = {
      ruleHash: computeRuleHash(ruleWithCoverage),
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 3,
      mutantKillRate: 1.0,
      failureOpportunities: 10,
      wallTimeRatio: 0.3
    };

    const result = evaluateRulePromotion(ruleWithCoverage, evidence);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'coverage-set-not-subset');
  });

  await t.test('demotes to quarantined on confirmed miss (1 miss trips breaker)', () => {
    const evidence = {
      ruleHash: hash,
      baselineCleanBothSides: true,
      confirmedMisses: 1,
      validMutantCount: 5,
      mutantKillRate: 1.0,
      failureOpportunities: 15,
      wallTimeRatio: 0.3
    };

    const liveRule = { ...sampleRule, status: 'live' };
    const result = evaluateRulePromotion(liveRule, evidence);
    assert.equal(result.newStatus, 'quarantined');
    assert.equal(result.reason, 'confirmed-miss');
  });

  await t.test('invalidates evidence if ruleHash does not match current rule or is missing (§3.1)', () => {
    const evidenceStale = {
      ruleHash: 'old-stale-hash',
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 5,
      mutantKillRate: 1.0,
      failureOpportunities: 20,
      wallTimeRatio: 0.3
    };

    const resultStale = evaluateRulePromotion(sampleRule, evidenceStale);
    assert.equal(resultStale.eligible, false);
    assert.equal(resultStale.reason, 'rule-hash-mismatch');

    const evidenceMissingHash = {
      baselineCleanBothSides: true,
      confirmedMisses: 0,
      validMutantCount: 5,
      mutantKillRate: 1.0,
      failureOpportunities: 20,
      wallTimeRatio: 0.3
    };
    const resultMissing = evaluateRulePromotion(sampleRule, evidenceMissingHash);
    assert.equal(resultMissing.eligible, false);
    assert.equal(resultMissing.reason, 'rule-hash-mismatch');
  });

  await t.test('allows quarantined rule to recover if repaired with reproduction mutant', () => {
    const quarantinedRule = { ...sampleRule, status: 'quarantined', quarantinedHash: 'old-broken-hash' };
    const evidence = {
      ruleHash: hash,
      hasReproductionMutant: true,
      mutantKillRate: 1.0,
      validMutantCount: 3,
      confirmedMisses: 0
    };

    const result = evaluateRulePromotion(quarantinedRule, evidence);
    assert.equal(result.eligible, true);
    assert.equal(result.newStatus, 'live');
    assert.equal(result.reason, 'quarantine-repaired');
  });

  await t.test('aggregateRuleEvidence excludes inconclusive classifications and calculates failure opportunities and kill rate', () => {
    const compareLedgers = [
      {
        plan: { matchedRules: [{ ruleId: sampleRule.id, ruleHash: hash }], wallTimeRatio: 0.4 },
        caseResults: {
          'test/direct/fgos-edit.test.mjs': 'caught',
          'test-2': 'omitted-failing-test',
          'test-inconclusive': 'inconclusive',
          'test-base-missing': 'base-missing',
          'test-os': 'os-specific'
        }
      }
    ];

    const nightlyLedgers = [
      [
        { ruleId: sampleRule.id, ruleHash: hash, classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, classification: 'killed' },
        { ruleId: sampleRule.id, ruleHash: hash, classification: 'timeout' }, // Inconclusive: must not drop kill rate
        { ruleId: sampleRule.id, ruleHash: hash, classification: 'invalid-syntax' }, // Inconclusive
        { ruleId: sampleRule.id, ruleHash: 'stale-hash', classification: 'caught' } // Stale: must be ignored
      ]
    ];

    const aggregated = aggregateRuleEvidence(sampleRule, { compareLedgers, nightlyLedgers });
    assert.equal(aggregated.baselineCleanBothSides, true);
    assert.equal(aggregated.ruleHash, hash);
    // 2 from compare ('test/direct/fgos-edit.test.mjs' caught, 'test-2' omitted-failing-test) + 2 from nightly ('caught', 'killed') = 4
    assert.equal(aggregated.failureOpportunities, 4);
    assert.equal(aggregated.validMutantCount, 2);
    // Kill rate must be 1.0 (2 killed / 2 valid conclusive mutants, timeout/invalid-syntax excluded)
    assert.equal(aggregated.mutantKillRate, 1.0);
    assert.equal(aggregated.confirmedMisses, 0);
    assert.equal(aggregated.wallTimeRatio, 0.4);
  });

  await t.test('B1: baseline-failing in compare ledger blocks promotion with baseline-dirty', () => {
    const compareLedgers = [
      {
        plan: {
          matchedRules: [{ ruleId: sampleRule.id, ruleHash: hash }],
          wallTimeRatio: 0.35
        },
        caseResults: {
          'test-edit-fail': { classification: 'baseline-failing', file: 'test/direct/fgos-edit.test.mjs' },
          'test-1': { classification: 'caught', file: 'test/direct/fgos-edit.test.mjs' }
        }
      }
    ];

    const nightlyLedgers = [
      [
        { ruleId: sampleRule.id, ruleHash: hash, origin: 'authored', classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, origin: 'authored', classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, origin: 'authored', classification: 'caught' }
      ]
    ];

    const aggregated = aggregateRuleEvidence(sampleRule, { compareLedgers, nightlyLedgers });
    assert.equal(aggregated.baselineCleanBothSides, false, 'Must flag baselineCleanBothSides as false');

    const result = evaluateRulePromotion(sampleRule, aggregated);
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'baseline-dirty', 'Must reject promotion due to dirty baseline');
  });

  await t.test('B1 (Option a): baseline-failing in unrelated test file does NOT taint rule baseline', () => {
    const compareLedgers = [
      {
        plan: {
          matchedRules: [{ ruleId: sampleRule.id, ruleHash: hash }],
          wallTimeRatio: 0.35
        },
        caseResults: {
          'test-unrelated-fail': { classification: 'baseline-failing', file: 'test/runner/dispatch.test.mjs' },
          'test-1': { classification: 'caught', file: 'test/direct/fgos-edit.test.mjs' }
        }
      }
    ];

    const nightlyLedgers = [
      [
        { ruleId: sampleRule.id, ruleHash: hash, origin: 'authored', classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, origin: 'authored', classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, origin: 'authored', classification: 'caught' }
      ]
    ];

    const aggregated = aggregateRuleEvidence(sampleRule, { compareLedgers, nightlyLedgers });
    assert.equal(aggregated.baselineCleanBothSides, true, 'Unrelated baseline failure must not taint rule baseline');
  });

  await t.test('4.3: mutants or matchedRules lacking ruleHash are rejected and not counted', () => {
    const compareLedgers = [
      {
        plan: {
          matchedRules: [{ ruleId: sampleRule.id /* missing ruleHash */ }],
          wallTimeRatio: 0.35
        },
        caseResults: {
          'test-1': { classification: 'caught', file: 'test/direct/fgos-edit.test.mjs' }
        }
      }
    ];

    const nightlyLedgers = [
      [
        // Missing ruleHash
        { ruleId: sampleRule.id, origin: 'authored', classification: 'caught' },
        { ruleId: sampleRule.id, origin: 'authored', classification: 'caught' }
      ]
    ];

    const aggregated = aggregateRuleEvidence(sampleRule, { compareLedgers, nightlyLedgers });
    assert.equal(aggregated.validMutantCount, 0, 'Mutants lacking ruleHash must not be counted');
    assert.equal(aggregated.failureOpportunities, 0, 'Compare ledger lacking ruleHash must be ignored');
  });

  await t.test('B2: quarantine recovery requires hash change (repair) and reproduction mutant', () => {
    const oldHash = 'old-broken-hash-111111111111111111111111111111111111111111111111111111';
    const quarantinedRule = { ...sampleRule, status: 'quarantined', quarantinedHash: oldHash };

    // 1. If rule hash did NOT change since quarantine, recovery is rejected even with reproduction mutant
    const unrepairedRule = { ...sampleRule, status: 'quarantined', quarantinedHash: hash };
    const evidenceUnrepaired = {
      ruleHash: hash,
      hasReproductionMutant: true,
      mutantKillRate: 1.0,
      validMutantCount: 3,
      confirmedMisses: 0
    };
    const resUnrepaired = evaluateRulePromotion(unrepairedRule, evidenceUnrepaired);
    assert.equal(resUnrepaired.eligible, false);
    assert.equal(resUnrepaired.reason, 'rule-not-repaired');

    // 2. Old miss on oldHash does not block promotion once rule hash changes
    const compareLedgersWithOldMiss = [
      {
        plan: {
          matchedRules: [{ ruleId: sampleRule.id, ruleHash: oldHash }],
          wallTimeRatio: 0.3
        },
        caseResults: {
          'test-miss': { classification: 'confirmed-miss', file: 'test/direct/fgos-edit.test.mjs' }
        }
      }
    ];

    const nightlyLedgersWithRepro = [
      [
        { ruleId: sampleRule.id, ruleHash: hash, boundary: 'b1', origin: 'reproduction', classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, boundary: 'b2', origin: 'authored', classification: 'caught' },
        { ruleId: sampleRule.id, ruleHash: hash, boundary: 'b3', origin: 'authored', classification: 'caught' }
      ]
    ];

    const aggregated = aggregateRuleEvidence(sampleRule, {
      compareLedgers: compareLedgersWithOldMiss,
      nightlyLedgers: nightlyLedgersWithRepro
    });

    assert.equal(aggregated.confirmedMisses, 0, 'Miss on oldHash must not be counted against new hash');
    assert.equal(aggregated.hasReproductionMutant, true, 'Must detect reproduction mutant from origin field');
    assert.ok(aggregated.priorMissHashes.includes(oldHash), 'Must record old miss hash in priorMissHashes');

    // Quarantined rule with quarantinedHash: oldHash evaluates against aggregated evidence
    const resRepaired = evaluateRulePromotion(quarantinedRule, aggregated);
    assert.equal(resRepaired.eligible, true, 'Repaired rule with reproduction mutant must recover');
    assert.equal(resRepaired.newStatus, 'live');
    assert.equal(resRepaired.reason, 'quarantine-repaired');
  });

  await t.test('promoteRules batch evaluates and promotes eligible shadow rules', () => {
    const rules = [
      { id: 'rule-1', status: 'shadow', pattern: 'src/1.mjs', directTests: [], boundaryTests: [] },
      { id: 'rule-2', status: 'shadow', pattern: 'src/2.mjs', directTests: [], boundaryTests: [] }
    ];

    const evidenceMap = {
      'rule-1': {
        ruleHash: computeRuleHash(rules[0]),
        baselineCleanBothSides: true,
        confirmedMisses: 0,
        validMutantCount: 3,
        mutantKillRate: 1.0,
        failureOpportunities: 10,
        wallTimeRatio: 0.35
      },
      'rule-2': {
        ruleHash: computeRuleHash(rules[1]),
        baselineCleanBothSides: true,
        confirmedMisses: 0,
        validMutantCount: 1, // Not enough mutants
        mutantKillRate: 1.0,
        failureOpportunities: 10,
        wallTimeRatio: 0.35
      }
    };

    const res = promoteRules({ manifest: rules, evidenceMap });
    assert.equal(res.promoted.length, 1);
    assert.equal(res.promoted[0].ruleId, 'rule-1');
    assert.equal(res.manifest[0].status, 'live');
    assert.equal(res.manifest[1].status, 'shadow');
  });

  await t.test('promoteRules with apply persists quarantinedHash on demotion', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-promote-apply-'));
    const tmpManifest = path.join(tmpDir, 'manifest.mjs');
    try {
      const initialContent = `export const MANIFEST = [
  { id: 'rule-demote', status: 'live', pattern: 'src/1.mjs', directTests: [], boundaryTests: [] }
];\n`;
      fs.writeFileSync(tmpManifest, initialContent, 'utf8');

      const rules = [
        { id: 'rule-demote', status: 'live', pattern: 'src/1.mjs', directTests: [], boundaryTests: [] }
      ];
      const rHash = computeRuleHash(rules[0]);
      const evidenceMap = {
        'rule-demote': {
          ruleHash: rHash,
          confirmedMisses: 1
        }
      };

      const res = promoteRules({
        manifest: rules,
        manifestPath: tmpManifest,
        evidenceMap,
        apply: true
      });

      assert.equal(res.quarantined.length, 1);
      const saved = fs.readFileSync(tmpManifest, 'utf8');
      assert.ok(saved.includes("status: 'quarantined'"));
      assert.ok(saved.includes(`quarantinedHash: '${rHash}'`));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
