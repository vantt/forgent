import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST } from '../test/test-ownership.mjs';
import { computeRuleHash } from './test-select-mutate.mjs';

export { computeRuleHash };

function log(msg) { console.log(msg); }

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Evaluates whether a rule qualifies for promotion (shadow -> live) or demotion (live -> quarantined).
 * Adheres to criteria in §3.1, §3.4, and §14 of tech-lead-ranking:
 * - Evidence must carry ruleHash matching current rule definition (§3.1).
 * - Clean baseline on both sides (selected set AND control set).
 * - Minimum K failure opportunities without being inconclusive (default K >= 10).
 * - 100% kill rate on valid mutants (minimum N >= 3).
 * - 0 confirmed misses on current hash.
 * - Wall-time ratio below threshold (H5), must be measured.
 * - coverage-set ⊆ rule-set (§3.4).
 * - Quarantined rule recovers only if repaired (ruleHash changed) with reproduction mutant.
 */
export function evaluateRulePromotion(rule, evidence, options = {}) {
  const minMutants = options.minMutants ?? 3;
  const minOpportunities = options.minOpportunities ?? 10;
  const maxWallTimeRatio = options.maxWallTimeRatio ?? 0.8;
  const currentHash = computeRuleHash(rule);

  // 1. Evidence must carry ruleHash matching current rule definition (§3.1)
  if (!evidence || !evidence.ruleHash || evidence.ruleHash !== currentHash) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: rule.status,
      newStatus: rule.status,
      reason: 'rule-hash-mismatch',
      details: 'Evidence missing ruleHash or rule definition changed; prior evidence invalidated (§3.1).'
    };
  }

  // 2. Recovery path for quarantined rules (§3.4)
  // quarantined ──▶ live khi: rule sửa (currentHash != quarantinedHash) + mutant tái hiện miss đó vào bộ nightly
  if (rule.status === 'quarantined') {
    const quarantinedHash = rule.quarantinedHash || evidence.quarantinedHash;
    const priorMisses = evidence.priorMissHashes || [];

    // Verify that the rule definition was actually repaired since quarantine
    const isRepaired = quarantinedHash
      ? (currentHash !== quarantinedHash)
      : (priorMisses.length > 0 ? !priorMisses.includes(currentHash) : (evidence.ruleRepaired === true || options.allowUnchangedHashRecovery === true));

    if (!isRepaired) {
      return {
        ruleId: rule.id,
        eligible: false,
        currentStatus: 'quarantined',
        newStatus: 'quarantined',
        reason: 'rule-not-repaired',
        details: 'Rule definition has not changed since quarantine: ruleHash must differ from quarantined hash (§3.4).'
      };
    }

    if (
      evidence.hasReproductionMutant &&
      typeof evidence.mutantKillRate === 'number' &&
      evidence.mutantKillRate === 1.0 &&
      evidence.confirmedMisses === 0 &&
      typeof evidence.validMutantCount === 'number' &&
      evidence.validMutantCount >= minMutants
    ) {
      return {
        ruleId: rule.id,
        eligible: true,
        currentStatus: 'quarantined',
        newStatus: 'live',
        reason: 'quarantine-repaired',
        details: 'Rule repaired, reproduction mutant killed with 0 misses.'
      };
    }
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'quarantined',
      newStatus: 'quarantined',
      reason: 'quarantined',
      details: 'Rule is quarantined; requires fix and reproduction mutant evidence.'
    };
  }

  // 3. Confirmed miss on current hash trips breaker: demote to quarantined (§3.4)
  if (evidence.confirmedMisses > 0) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: rule.status,
      newStatus: 'quarantined',
      reason: 'confirmed-miss',
      quarantinedHash: currentHash,
      details: `${evidence.confirmedMisses} confirmed miss(es) detected on current rule definition.`
    };
  }

  // 4. Already live
  if (rule.status === 'live') {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'live',
      newStatus: 'live',
      reason: 'already-live',
      details: 'Rule is already live.'
    };
  }

  // 5. Evaluate promotion criteria from shadow -> live (§14 & §3.4)
  // (a) Clean baseline on both sides
  if (options.requireCleanBaseline !== false && !evidence.baselineCleanBothSides) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'baseline-dirty',
      details: 'Baseline is failing on selected set or control set (both sides must be clean per §14).'
    };
  }

  // (b) Minimum valid mutants
  const validMutantCount = typeof evidence.validMutantCount === 'number' ? evidence.validMutantCount : 0;
  if (validMutantCount < minMutants) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'insufficient-mutants',
      details: `Valid mutants ${validMutantCount} < required ${minMutants}.`
    };
  }

  // (c) 100% mutant kill rate (must be measured, not defaulted)
  if (typeof evidence.mutantKillRate !== 'number') {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'mutant-kill-rate-missing',
      details: 'Mutant kill rate must be measured.'
    };
  }
  if (evidence.mutantKillRate < 1.0) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'mutant-kill-rate-sub-100',
      details: `Mutant kill rate ${(evidence.mutantKillRate * 100).toFixed(1)}% < 100%.`
    };
  }

  // (d) Minimum failure opportunities K >= 10
  const opportunities = evidence.failureOpportunities ?? 0;
  if (opportunities < minOpportunities) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'insufficient-opportunities',
      details: `Failure opportunities ${opportunities} < required ${minOpportunities}.`
    };
  }

  // (e) Wall-time ratio must be measured and < threshold (H5)
  if (typeof evidence.wallTimeRatio !== 'number') {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'wall-time-ratio-missing',
      details: 'Wall-time ratio (H5) must be measured before promotion.'
    };
  }
  if (evidence.wallTimeRatio > maxWallTimeRatio) {
    return {
      ruleId: rule.id,
      eligible: false,
      currentStatus: 'shadow',
      newStatus: 'shadow',
      reason: 'wall-time-ratio-too-high',
      details: `Wall-time ratio ${evidence.wallTimeRatio} > threshold ${maxWallTimeRatio}.`
    };
  }

  // (f) coverage-set ⊆ rule-set (§3.4)
  const coverageSet = rule.coverageSet || evidence.coverageSet;
  if (Array.isArray(coverageSet) && coverageSet.length > 0) {
    const ruleTests = new Set([...(rule.directTests || []), ...(rule.boundaryTests || [])]);
    const missingFromRule = coverageSet.filter(t => !ruleTests.has(t));
    if (missingFromRule.length > 0) {
      return {
        ruleId: rule.id,
        eligible: false,
        currentStatus: 'shadow',
        newStatus: 'shadow',
        reason: 'coverage-set-not-subset',
        details: `Coverage-derived test set is not a subset of rule-set (§3.4). Missing tests: ${missingFromRule.join(', ')}`
      };
    }
  }

  // All criteria satisfied per §14 & §3.4: promote shadow -> live
  return {
    ruleId: rule.id,
    eligible: true,
    currentStatus: 'shadow',
    newStatus: 'live',
    reason: 'criteria-met',
    details: {
      failureOpportunities: opportunities,
      validMutants: validMutantCount,
      killRate: evidence.mutantKillRate,
      baselineCleanBothSides: true,
      wallTimeRatio: evidence.wallTimeRatio
    }
  };
}

/**
 * Aggregates evidence for rules from comparison ledgers and nightly mutation ledgers.
 * §14 definition: control set = (i) full shadow (all cases outside selection) + (ii) control fault set.
 */
export function aggregateRuleEvidence(rule, { compareLedgers = [], nightlyLedgers = [] } = {}) {
  const currentHash = computeRuleHash(rule);
  const ruleTests = new Set([...(rule.directTests || []), ...(rule.boundaryTests || [])]);

  let baselineCleanBothSides = true;
  let failureOpportunities = 0;
  let confirmedMisses = 0;
  let wallTimeSum = 0;
  let wallTimeCount = 0;
  let hasReproductionMutant = false;
  let hasValidEvidence = false;
  const priorMissHashes = new Set();

  // Process PR compare ledgers
  for (const ledger of compareLedgers) {
    const plan = ledger.plan || {};
    const caseResults = ledger.caseResults || {};
    const matchedRule = (plan.matchedRules || []).find(mr => mr.ruleId === rule.id || mr.id === rule.id);

    if (matchedRule) {
      // Check if the compare run was on the current rule definition (§3.1)
      const isCurrentVersion = Boolean(matchedRule.ruleHash && matchedRule.ruleHash === currentHash);
      if (!isCurrentVersion) {
        // Run occurred on older or missing rule hash: record prior miss hashes and do not taint currentHash
        for (const [caseName, result] of Object.entries(caseResults)) {
          const classification = typeof result === 'object' && result !== null ? result.classification : result;
          if (classification === 'confirmed-miss' && matchedRule.ruleHash) {
            priorMissHashes.add(matchedRule.ruleHash);
          }
        }
        continue;
      }

      if (typeof plan.wallTimeRatio === 'number') {
        wallTimeSum += plan.wallTimeRatio;
        wallTimeCount++;
      }

      for (const [caseName, result] of Object.entries(caseResults)) {
        const classification = typeof result === 'object' && result !== null ? result.classification : result;
        const file = typeof result === 'object' && result !== null ? result.file : null;

        // Exclude inconclusive classifications from counting as K
        if (classification === 'inconclusive' || classification === 'base-missing' || classification === 'os-specific') {
          continue;
        }

        // B1: Baseline failing in PR matching this rule taints baselineCleanBothSides (§14 & §4.3)
        // Per §4.3: promote per-rule only requires test cases of the rule (file ∈ ruleTests) to be green at base
        if (classification === 'baseline-failing') {
          if ((file && ruleTests.has(file)) || ruleTests.has(caseName) || (!file && caseName.includes(rule.id))) {
            baselineCleanBothSides = false;
          }
          continue;
        }

        if (classification === 'confirmed-miss') {
          confirmedMisses++;
          failureOpportunities++;
          hasValidEvidence = true;
          continue;
        }

        // Cases caught or omitted-failing-test from full-shadow
        if (classification === 'caught' || classification === 'omitted-failing-test') {
          failureOpportunities++;
          hasValidEvidence = true;
        }
      }
    }
  }

  // Inconclusive mutant classifications per §3.1 & §3.3
  const INCONCLUSIVE_MUTANTS = new Set(['invalid', 'infra-error', 'timeout', 'invalid-syntax', 'equivalent-or-missing-test']);

  // Process nightly mutation ledgers
  const ruleMutants = [];
  let killedCount = 0;
  let missCount = 0;

  for (const ledger of nightlyLedgers) {
    const entries = Array.isArray(ledger) ? ledger : (ledger.entries || []);
    for (const m of entries) {
      if (m.ruleId === rule.id) {
        // Mutant must have ruleHash matching currentHash (§3.1); mutants lacking ruleHash are rejected
        if (!m.ruleHash || m.ruleHash !== currentHash) {
          if (m.ruleHash && m.classification === 'confirmed-miss') {
            priorMissHashes.add(m.ruleHash);
          }
          continue;
        }

        ruleMutants.push(m);
        hasValidEvidence = true;

        if (INCONCLUSIVE_MUTANTS.has(m.classification)) {
          // Inconclusive: do not count toward kill rate denominator
          continue;
        }

        if (m.classification === 'caught' || m.classification === 'killed') {
          killedCount++;
          failureOpportunities++;
          if (m.origin === 'reproduction' || m.isReproduction === true || m.reproduction === true) {
            hasReproductionMutant = true;
          }
        } else if (m.classification === 'confirmed-miss') {
          missCount++;
          confirmedMisses++;
          failureOpportunities++;
        }
      }
    }
  }

  const validMutantCount = killedCount + missCount;
  const mutantKillRate = validMutantCount > 0 ? (killedCount / validMutantCount) : undefined;

  return {
    ruleId: rule.id,
    ruleHash: hasValidEvidence ? currentHash : null,
    baselineCleanBothSides,
    failureOpportunities,
    confirmedMisses,
    validMutantCount,
    mutantKillRate,
    wallTimeRatio: wallTimeCount > 0 ? wallTimeSum / wallTimeCount : undefined,
    hasReproductionMutant,
    priorMissHashes: Array.from(priorMissHashes),
    mutants: ruleMutants
  };
}

/**
 * Evaluates and optionally updates manifest rules.
 */
export function promoteRules({
  manifest = MANIFEST,
  manifestPath,
  evidenceMap = {},
  compareLedgers = [],
  nightlyLedgers = [],
  options = {},
  apply = false
} = {}) {
  const evaluated = [];
  const promoted = [];
  const quarantined = [];

  const updatedManifest = manifest.map(rule => {
    let evidence = evidenceMap[rule.id];
    if (!evidence) {
      evidence = aggregateRuleEvidence(rule, { compareLedgers, nightlyLedgers });
    }

    const evaluation = evaluateRulePromotion(rule, evidence, options);
    evaluated.push(evaluation);

    if (evaluation.eligible && evaluation.newStatus === 'live') {
      promoted.push(evaluation);
      return { ...rule, status: 'live' };
    }
    if (evaluation.newStatus === 'quarantined' && rule.status !== 'quarantined') {
      quarantined.push(evaluation);
      return { ...rule, status: 'quarantined' };
    }
    return rule;
  });

  if (apply && manifestPath && fs.existsSync(manifestPath)) {
    // Format and persist manifest if apply is requested
    const content = fs.readFileSync(manifestPath, 'utf8');
    let newContent = content;
    for (const p of promoted) {
      // Update status to live and clean quarantinedHash if present
      const regex = new RegExp(`({\\s*id:\\s*['"]${escapeRegex(p.ruleId)}['"][\\s\\S]*?status:\\s*['"])([^'"]+)(['"])(?:,\\s*quarantinedHash:\\s*['"][^'"]*['"])?`);
      newContent = newContent.replace(regex, `$1live$3`);
    }
    for (const q of quarantined) {
      const qHash = q.quarantinedHash || computeRuleHash(manifest.find(r => r.id === q.ruleId));
      // Update status to quarantined and record quarantinedHash
      const regex = new RegExp(`({\\s*id:\\s*['"]${escapeRegex(q.ruleId)}['"][\\s\\S]*?status:\\s*['"])([^'"]+)(['"])(?:,\\s*quarantinedHash:\\s*['"][^'"]*['"])?`);
      newContent = newContent.replace(regex, `$1quarantined$3, quarantinedHash: '${qHash}'`);
    }
    fs.writeFileSync(manifestPath, newContent, 'utf8');
    log(`Updated manifest with ${promoted.length} promoted rules and ${quarantined.length} quarantined rules.`);
  }

  return {
    evaluated,
    promoted,
    quarantined,
    manifest: updatedManifest
  };
}

export function runPromoteCli() {
  log("Running test-select-promote CLI...");
  const manifestPath = path.resolve('test/test-ownership.mjs');
  const ledgerPath = path.resolve('ledger.json');
  const nightlyLedgerPath = path.resolve('nightly-ledger.json');

  const compareLedgers = fs.existsSync(ledgerPath) ? [JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))] : [];
  const nightlyLedgers = fs.existsSync(nightlyLedgerPath) ? [JSON.parse(fs.readFileSync(nightlyLedgerPath, 'utf8'))] : [];

  const apply = process.argv.includes('--apply');
  const result = promoteRules({
    manifestPath,
    compareLedgers,
    nightlyLedgers,
    apply
  });

  const promotionLedgerPath = 'plans/reports/promotion-ledger.json';
  const reportsDir = path.dirname(promotionLedgerPath);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(promotionLedgerPath, JSON.stringify(result, null, 2));

  log(`Promotion evaluation complete: ${result.promoted.length} promoted, ${result.quarantined.length} quarantined.`);
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-promote.mjs')) {
  runPromoteCli();
}
