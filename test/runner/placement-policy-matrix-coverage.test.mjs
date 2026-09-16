// Phase 07 (executor-policy-dispatch-seams) pre-promotion matrix coverage:
// "Trước khi promote phải có matrix coverage cho: mọi baseline executor ×
// tier; ... provider/model/executor ranking; không còn unexplained
// divergence."
//
// PlacementPolicy's declared scope (design.md "Required separation",
// phase-05's "Required separation") is provider/model/executor ranking
// ONLY -- read-only/mutating classification, confinement, and governance
// live in other modules this shadow module never touches or reads. So the
// matrix this file proves is exactly PlacementPolicy's own scope: every one
// of Phase 00's 13 canonical executors × 3 work tiers (39 pairs, the same
// matrix dispatch-policy-baseline-snapshot.test.mjs already locks) must
// agree with the real legacy resolution BEFORE any production binding
// changes. The read-only/confined/governance dimensions Phase 07's exit
// criteria also names stay covered by their own existing test suites
// (dispatch-policy-baseline-snapshot.test.mjs's readOnlyMechanism/
// confinement columns, assignment-dispatch.test.mjs's H5 governance test)
// -- PlacementPolicy does not alter any of them, so there is nothing new
// for this file to prove about them.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';

import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { buildPlacementPolicyCandidate } from '../../src/runner/dispatch/placement-policy.mjs';
import { BASELINE_SNAPSHOT_FIXTURE } from './dispatch-policy-baseline-snapshot.test.mjs';

let cfg;

before(() => {
  cfg = loadRunnerConfigFromDir(process.cwd());
});

test('Phase 07 matrix coverage: every one of Phase 00\'s 13 canonical executors × 3 work tiers (39 pairs) agrees between PlacementPolicy\'s shadow candidate and the real legacy resolution -- no unexplained divergence', () => {
  assert.equal(BASELINE_SNAPSHOT_FIXTURE.length, 39, 'the baseline matrix itself must still be the full 13×3 = 39 pairs this proof depends on');

  const divergences = [];
  for (const row of BASELINE_SNAPSHOT_FIXTURE) {
    let candidate;
    try {
      candidate = buildPlacementPolicyCandidate({ cfg, capabilityId: row.selector, workTier: row.workTier });
    } catch (err) {
      divergences.push({ selector: row.selector, workTier: row.workTier, reason: `threw: ${err.message}` });
      continue;
    }
    if (!candidate) {
      divergences.push({ selector: row.selector, workTier: row.workTier, reason: 'PlacementPolicy produced no candidate at all' });
      continue;
    }
    if (candidate.model !== row.model) {
      divergences.push({ selector: row.selector, workTier: row.workTier, reason: `model: legacy "${row.model}" vs placementPolicy "${candidate.model}"` });
    }
    if (candidate.provider !== row.provider) {
      divergences.push({ selector: row.selector, workTier: row.workTier, reason: `provider: legacy "${row.provider}" vs placementPolicy "${candidate.provider}"` });
    }
  }

  assert.deepEqual(divergences, [], `PlacementPolicy diverges from legacy for ${divergences.length}/39 pairs -- not ready for Phase 07 promotion until this is empty`);
});

test('Phase 07 matrix coverage: invocation class (visible vs headless) agrees with the legacy adapter for every pair, confirming confinement/visibility is unaffected by this shadow module', () => {
  const mismatches = [];
  for (const row of BASELINE_SNAPSHOT_FIXTURE) {
    const candidate = buildPlacementPolicyCandidate({ cfg, capabilityId: row.selector, workTier: row.workTier });
    if (!candidate) continue;
    const legacyVisible = row.adapter === 'herdr-spawn';
    const placementVisible = candidate.invocation === 'visible';
    if (legacyVisible !== placementVisible) {
      mismatches.push({ selector: row.selector, workTier: row.workTier, legacyAdapter: row.adapter, placementInvocation: candidate.invocation });
    }
  }
  assert.deepEqual(mismatches, []);
});
