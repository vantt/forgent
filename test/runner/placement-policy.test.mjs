import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PLACEMENT_POLICY_SHADOW_CONTRACT,
  buildPlacementPolicyCandidate,
  evaluatePlacementPolicyShadow,
} from '../../src/runner/dispatch/placement-policy.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

// Self-contained fixture replicating the REAL .fgos/config.json shapes for
// agy-cli/agy-herdr/claude-reviewer/fgos-coding-implement (Phase 00's own
// baseline snapshot proof cases), not a synthetic invention -- so a real
// config divergence would show up here too, not just in a hand-tuned test.
function runnerConfig() {
  return {
    executor: { command: 'claude' },
    executors: {
      'agy-cli': {
        kind: 'agent',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy' }],
        providerModel: 'gemini',
        rigorOverrides: { light: 'lightweight', standard: 'standard', heavy: 'creative' },
      },
      'agy-herdr': {
        kind: 'agent',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'herdr-spawn', command: 'agy' }],
        providerModel: 'gemini',
        rigorOverrides: { light: 'lightweight', standard: 'standard', heavy: 'creative' },
      },
      'claude-reviewer': {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude' }],
      },
      'codex-readonly': {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'codex' }],
        providerModel: 'openai-codex',
        confinement: { backend: 'bwrap' },
      },
    },
    capabilities: {
      'fgos-coding-implement': {
        prefer: 'agy-herdr',
        overrides: {
          providerModel: 'gemini',
          rigorOverrides: { light: 'standard', standard: 'standard', heavy: 'standard' },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'sonnet', critical: 'opus' },
      gemini: {
        lightweight: 'gemini-3.8-flash-low',
        standard: 'gemini-3.8-flash-medium',
        creative: 'gemini-3.8-flash-high',
        analytical: 'gemini-3.1-pro-low',
        critical: 'gemini-3.1-pro-high',
      },
      'openai-codex': { standard: 'gpt-test-standard', critical: 'gpt-test-critical' },
    },
  };
}

test('Phase 05: buildPlacementPolicyCandidate reproduces Phase 00 baseline fact (a) -- raw agy-cli/agy-herdr heavy work resolves gemini-3.8-flash-high via lookupPolicyTier "creative"', () => {
  const cli = buildPlacementPolicyCandidate({ cfg: runnerConfig(), capabilityId: 'agy-cli', workTier: 'heavy' });
  assert.equal(cli.provider, 'gemini');
  assert.equal(cli.model, 'gemini-3.8-flash-high');
  assert.equal(cli.lookupPolicyTier, 'creative');
  assert.equal(cli.invocation, 'headless');
  assert.deepEqual([...cli.reasonCodes], ['executor-id', 'calibration.executor.rigorOverrides', 'calibration.executor.providerModel']);

  const herdr = buildPlacementPolicyCandidate({ cfg: runnerConfig(), capabilityId: 'agy-herdr', workTier: 'heavy' });
  assert.equal(herdr.model, 'gemini-3.8-flash-high');
  assert.equal(herdr.invocation, 'visible', 'agy-herdr is herdr-spawn -- visible invocation, distinct from agy-cli');
});

test('Phase 05: buildPlacementPolicyCandidate reproduces Phase 00 baseline fact (b) -- fgos-coding-implement heavy work resolves gemini-3.8-flash-medium via lookupPolicyTier "standard", WITHOUT living in capabilities.overrides at read time', () => {
  const candidate = buildPlacementPolicyCandidate({ cfg: runnerConfig(), capabilityId: 'fgos-coding-implement', workTier: 'heavy' });
  assert.equal(candidate.executorId, 'agy-herdr');
  assert.equal(candidate.provider, 'gemini');
  assert.equal(candidate.model, 'gemini-3.8-flash-medium');
  assert.equal(candidate.lookupPolicyTier, 'standard');
  assert.deepEqual([...candidate.reasonCodes], ['capabilities.prefer', 'calibration.rigorOverrides', 'calibration.providerModel']);
  // Same heavy work item, same underlying rigor -- the calibration override
  // retargets ONLY the model lookup, never the semantic classification
  // (design.md §5.3's "creative-column trap", same invariant Phase 04
  // established for resolveAssignmentDispatchPolicy).
  assert.notEqual(candidate.model, buildPlacementPolicyCandidate({ cfg: runnerConfig(), capabilityId: 'agy-cli', workTier: 'heavy' }).model);
});

test('Phase 05: buildPlacementPolicyCandidate resolves the correct provider for an invocations[]-shaped executor with no flat "command" (claude-reviewer)', () => {
  const candidate = buildPlacementPolicyCandidate({ cfg: runnerConfig(), capabilityId: 'claude-reviewer', workTier: 'standard' });
  assert.equal(candidate.provider, 'claude', 'must derive "claude" from invocations[].command, never the raw executor id string');
  assert.equal(candidate.model, 'sonnet');
});

test('Phase 05: buildPlacementPolicyCandidate returns null for an unconfigured capability/executor id, never throws', () => {
  assert.equal(buildPlacementPolicyCandidate({ cfg: runnerConfig(), capabilityId: 'not-a-real-capability', workTier: 'standard' }), null);
});

test('Phase 05: buildPlacementPolicyCandidate throws for a configured executor whose model genuinely cannot resolve', () => {
  const cfg = runnerConfig();
  cfg.executors['broken'] = { kind: 'agent', invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'broken-cli' }], providerModel: 'does-not-exist' };
  assert.throws(
    () => buildPlacementPolicyCandidate({ cfg, capabilityId: 'broken', workTier: 'standard' }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('Phase 05: shadow output shape matches the phase file exactly -- legacy/placementPolicy/divergence, no production-binding fields', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'fgos-coding-implement',
    workTier: 'heavy',
    legacy: { executorId: 'agy-herdr', provider: 'gemini', model: 'gemini-3.8-flash-medium' },
  });
  assert.equal(result.contract, PLACEMENT_POLICY_SHADOW_CONTRACT);
  assert.deepEqual(result.legacy, { executorId: 'agy-herdr', provider: 'gemini', model: 'gemini-3.8-flash-medium' });
  assert.equal(result.placementPolicy.candidates.length, 1);
  assert.equal(result.placementPolicy.candidates[0].executorId, 'agy-herdr');
  assert.deepEqual(result.divergence, [], 'the shadow candidate must AGREE with real legacy behavior for this real proof case -- zero divergence');
  assert.equal(result.placementPolicy.capacity.status, 'not-applicable', 'no providerCapacityRefusal was supplied');
  assert.deepEqual(result.placementPolicy.fallbackCandidates, []);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.placementPolicy));
});

test('Phase 05: divergence is reported field-by-field when the caller-supplied legacy binding disagrees with the shadow candidate, without changing production binding', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'agy-cli',
    workTier: 'heavy',
    // A deliberately WRONG legacy fact, simulating a real divergence this
    // phase exists to catch.
    legacy: { executorId: 'agy-cli', provider: 'gemini', model: 'gemini-3.1-pro-high' },
  });
  assert.deepEqual(result.divergence, [
    { field: 'model', legacy: 'gemini-3.1-pro-high', placementPolicy: 'gemini-3.8-flash-high' },
  ]);
  // The shadow result never claims to BE the binding -- it only reports.
  assert.equal(result.placementPolicy.candidates[0].model, 'gemini-3.8-flash-high');
});

test('Phase 05: capacity.status reflects a Provider Capacity Rotator structured refusal as an opaque input, without this module inspecting accounts', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'agy-cli',
    workTier: 'heavy',
    providerCapacityRefusal: { status: 'refused', reason: 'provider-capacity.exhausted-or-quarantined' },
  });
  assert.deepEqual(result.placementPolicy.capacity, { status: 'refused', refusalReason: 'provider-capacity.exhausted-or-quarantined' });
});

test('Phase 05: fallback admission re-checks governance for every candidate and skips (never downgrades) a disallowed one', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'agy-cli',
    workTier: 'heavy',
    providerCapacityRefusal: { status: 'refused', reason: 'provider-capacity.exhausted-or-quarantined' },
    declaredFallbackExecutorIds: ['codex-readonly', 'agy-herdr', 'not-a-real-executor'],
    options: { disallowedProviders: ['openai-codex'] },
  });

  // codex-readonly's provider (openai-codex) is disallowed -- skipped, not
  // silently downgraded to a different confinement/runtime class.
  assert.ok(!result.placementPolicy.fallbackCandidates.some((c) => c.executorId === 'codex-readonly'));
  assert.deepEqual(
    result.placementPolicy.fallbackSkipped.find((s) => s.executorId === 'codex-readonly'),
    { executorId: 'codex-readonly', reasonCode: 'governance.disallowed-provider' },
  );
  // agy-herdr is genuinely admissible -- included with its real invocation
  // class (visible/herdr-spawn), never downgraded to headless.
  const herdrFallback = result.placementPolicy.fallbackCandidates.find((c) => c.executorId === 'agy-herdr');
  assert.ok(herdrFallback);
  assert.equal(herdrFallback.invocation, 'visible');
  // An unresolvable id is skipped with a named reason, never thrown.
  assert.deepEqual(
    result.placementPolicy.fallbackSkipped.find((s) => s.executorId === 'not-a-real-executor'),
    { executorId: 'not-a-real-executor', reasonCode: 'unresolvable-runtime-class' },
  );
});

test('Phase 05: disallowedExecutors also gates fallback candidates by id, independent of provider family', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'agy-cli',
    workTier: 'heavy',
    providerCapacityRefusal: { status: 'refused', reason: 'provider-capacity.exhausted-or-quarantined' },
    declaredFallbackExecutorIds: ['agy-herdr'],
    options: { disallowedExecutors: ['agy-herdr'] },
  });
  assert.deepEqual(result.placementPolicy.fallbackCandidates, []);
  assert.deepEqual(result.placementPolicy.fallbackSkipped, [{ executorId: 'agy-herdr', reasonCode: 'governance.disallowed-executor' }]);
});

test('Phase 05: fallback candidates are never evaluated when capacity was not refused (nothing to fall back to)', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'agy-cli',
    workTier: 'heavy',
    declaredFallbackExecutorIds: ['agy-herdr'],
  });
  assert.deepEqual(result.placementPolicy.fallbackCandidates, []);
  assert.deepEqual(result.placementPolicy.fallbackSkipped, []);
});

test('Phase 05: a fallback candidate identical to the primary candidate is never listed as its own fallback', () => {
  const result = evaluatePlacementPolicyShadow({
    cfg: runnerConfig(),
    capabilityId: 'agy-cli',
    workTier: 'heavy',
    providerCapacityRefusal: { status: 'refused', reason: 'x' },
    declaredFallbackExecutorIds: ['agy-cli'],
  });
  assert.deepEqual(result.placementPolicy.fallbackCandidates, []);
  assert.deepEqual(result.placementPolicy.fallbackSkipped, []);
});
