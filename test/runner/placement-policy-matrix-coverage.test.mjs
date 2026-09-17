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
// of Phase 00's 12 canonical executors × 3 work tiers (36 pairs, the same
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
import { resolveExecutorAndOverrides, modelForTier } from '../../src/runner/dispatch/resolve.mjs';
import { buildPlacementPolicyCandidate, resolveVerifiedPlacementModel } from '../../src/runner/dispatch/placement-policy.mjs';
import { BASELINE_SNAPSHOT_FIXTURE, CANONICAL_EXECUTOR_DESCRIPTORS } from './dispatch-policy-baseline-snapshot.test.mjs';

// executor-id-consolidation Step 2: PlacementPolicy's own scope is
// provider/model/executor ranking only (never invocation-level, per this
// file's own header comment) -- so every BASELINE_SNAPSHOT_FIXTURE row's
// `selector` (a historic LABEL, e.g. "claude-reviewer", possibly no longer
// a real registered id) is mapped back to its real `executorId` before
// being handed to any PlacementPolicy function here. Model/provider
// resolution depends only on executor-level fields (providerModel/
// rigorOverrides), never on which invocation was pinned, so this
// substitution changes nothing PlacementPolicy actually computes.
function realExecutorIdForLabel(label) {
  const descriptor = CANONICAL_EXECUTOR_DESCRIPTORS.find((d) => d.label === label);
  return descriptor ? descriptor.executorId : label;
}

// The "invocation class" test (visible/headless/bwrap) below DOES care
// which invocation, unlike model/provider -- returns the descriptor's own
// invocationId (possibly undefined, meaning "no pin, legacy default").
function realInvocationIdForLabel(label) {
  const descriptor = CANONICAL_EXECUTOR_DESCRIPTORS.find((d) => d.label === label);
  return descriptor?.invocationId;
}

let cfg;

before(() => {
  cfg = loadRunnerConfigFromDir(process.cwd());
});

test('Phase 07 matrix coverage: every one of Phase 00\'s 12 canonical executors × 3 work tiers (36 pairs) agrees between PlacementPolicy\'s shadow candidate and the real legacy resolution -- no unexplained divergence', () => {
  assert.equal(BASELINE_SNAPSHOT_FIXTURE.length, 36, 'the baseline matrix itself must still be the full 12×3 = 36 pairs this proof depends on');

  const divergences = [];
  for (const row of BASELINE_SNAPSHOT_FIXTURE) {
    let candidate;
    try {
      candidate = buildPlacementPolicyCandidate({ cfg, capabilityId: realExecutorIdForLabel(row.selector), workTier: row.workTier });
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

  assert.deepEqual(divergences, [], `PlacementPolicy diverges from legacy for ${divergences.length}/36 pairs -- not ready for Phase 07 promotion until this is empty`);
});

test('Phase 07 PRODUCTION BINDER proof: resolveVerifiedPlacementModel (the exact function spawnWorker/executeExecutorCli now call for real) never regresses AND is actually PlacementPolicy-sourced for all 36 real pairs', () => {
  const results = [];
  for (const row of BASELINE_SNAPSHOT_FIXTURE) {
    // Reproduce spawnWorker's own real legacyModel computation exactly
    // (resolve.mjs's resolveExecutorAndOverrides + modelForTier), never a
    // separately-authored approximation of it.
    const realExecutorId = realExecutorIdForLabel(row.selector);
    const { executor, overrides } = resolveExecutorAndOverrides(cfg, realExecutorId);
    const legacyModel = modelForTier(cfg, row.workTier, {
      providerModel: overrides?.providerModel ?? executor?.providerModel,
      rigorOverrides: overrides?.rigorOverrides ?? executor?.rigorOverrides,
    });
    // Ground truth: the legacy formula itself must still match the golden
    // fixture (otherwise this test would be proving the binder agrees with
    // a formula that has ALREADY drifted from truth).
    assert.equal(legacyModel, row.model, `legacy modelForTier itself diverged from the golden fixture for ${row.selector}/${row.workTier} -- fix the fixture assumption before trusting this proof`);

    const result = resolveVerifiedPlacementModel({ cfg, executorId: realExecutorId, workTier: row.workTier, legacyModel });
    results.push({ selector: row.selector, workTier: row.workTier, ...result });
  }

  // Safety property: the real spawn decision NEVER regresses, for any pair.
  const wrongModel = results.filter((r) => r.model !== BASELINE_SNAPSHOT_FIXTURE.find((f) => f.selector === r.selector && f.workTier === r.workTier).model);
  assert.deepEqual(wrongModel, [], 'resolveVerifiedPlacementModel must never produce a model different from the legacy golden fixture');

  // Production-binder property: PlacementPolicy is actually TRUSTED (not
  // silently falling back) for every one of the 36 real canonical pairs --
  // otherwise "promoted to production" would be true in name only.
  const fellBackToLegacy = results.filter((r) => r.source !== 'placement-policy');
  assert.deepEqual(fellBackToLegacy, [], `expected PlacementPolicy to be trusted for all 36 pairs; fell back for: ${JSON.stringify(fellBackToLegacy)}`);
  assert.equal(results.every((r) => r.divergence === null), true);
});

test('Phase 07 PRODUCTION BINDER proof: resolveVerifiedPlacementModel falls back safely (never throws, never trusts an unverified value) for an executor id outside the proven matrix', () => {
  const legacyModel = 'some-literal-legacy-model';
  const result = resolveVerifiedPlacementModel({ cfg, executorId: 'not-a-registered-executor-at-all', workTier: 'standard', legacyModel });
  assert.equal(result.model, legacyModel);
  assert.equal(result.source, 'legacy');
  assert.equal(result.divergence, null, 'an unconfigured id is a clean fallback, not a divergence -- there is no PlacementPolicy candidate to disagree with');
});

test('Phase 07 PRODUCTION BINDER proof: a genuine divergence (synthetic) falls back to legacy and is reported, never silently applied', () => {
  const cfgWithMismatch = {
    ...cfg,
    executors: {
      ...cfg.executors,
      agy: { ...cfg.executors.agy, rigorOverrides: { light: 'nano', standard: 'standard', heavy: 'flagship' } },
    },
  };
  // agy heavy now resolves to a DIFFERENT policy tier than the config
  // resolveVerifiedPlacementModel's own internal buildPlacementPolicyCandidate
  // call sees vs. whatever the caller's legacyModel actually was computed
  // against -- simulate the caller having computed against the OLD config.
  const staleLegacyModel = 'gemini-3.8-flash-high'; // the OLD (creative-tier) value
  const result = resolveVerifiedPlacementModel({ cfg: cfgWithMismatch, executorId: 'agy', workTier: 'heavy', legacyModel: staleLegacyModel });
  assert.equal(result.model, staleLegacyModel, 'a real divergence must fall back to the caller-supplied legacy value, never the unverified PlacementPolicy one');
  assert.equal(result.source, 'legacy');
  assert.ok(result.divergence);
  assert.equal(result.divergence.legacyModel, staleLegacyModel);
  assert.notEqual(result.divergence.placementModel, staleLegacyModel);
});

test('Phase 07 matrix coverage: invocation class (visible vs headless) agrees with the legacy adapter for every pair, confirming confinement/visibility is unaffected by this shadow module', () => {
  const mismatches = [];
  for (const row of BASELINE_SNAPSHOT_FIXTURE) {
    const candidate = buildPlacementPolicyCandidate({ cfg, capabilityId: realExecutorIdForLabel(row.selector), workTier: row.workTier, invocationId: realInvocationIdForLabel(row.selector) });
    if (!candidate) continue;
    const legacyVisible = row.adapter === 'herdr-spawn';
    const placementVisible = candidate.invocation === 'visible';
    if (legacyVisible !== placementVisible) {
      mismatches.push({ selector: row.selector, workTier: row.workTier, legacyAdapter: row.adapter, placementInvocation: candidate.invocation });
    }
  }
  assert.deepEqual(mismatches, []);
});
