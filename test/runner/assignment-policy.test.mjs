import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import {
  resolveAssignmentDispatchPolicy,
  resolveStrongerTier,
  TIER_STRENGTH,
} from '../../src/runner/dispatch/assignment-policy.mjs';
import { RunnerConfigError, supportsPolicyTier } from '../../src/runner/dispatch/config.mjs';
import { resolvePolicyTierModel, deriveProviderFamily, resolveExecutorConfig } from '../../src/runner/dispatch/resolve.mjs';

test('resolveStrongerTier correctly orders tiers monotonically', () => {
  assert.equal(resolveStrongerTier('standard', 'lightweight'), 'standard');
  assert.equal(resolveStrongerTier('standard', 'analytical'), 'analytical');
  assert.equal(resolveStrongerTier('standard', 'critical'), 'critical');
  assert.equal(resolveStrongerTier('creative', 'analytical'), 'analytical');
});

test('resolveAssignmentDispatchPolicy resolves validate-plan defaults: reviewer/code-reviewer/claude/standard', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
  });

  const runnerConfig = {
    executor: { command: 'claude' },
    modelPolicies: {
      claude: {
        lightweight: 'claude-3-5-haiku-20241022',
        standard: 'claude-3-7-sonnet-20250219',
        creative: 'claude-3-7-sonnet-20250219',
        analytical: 'claude-3-7-sonnet-20250219',
        critical: 'claude-3-7-sonnet-20250219',
      },
    },
  };

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    runnerConfig,
  });

  assert.equal(effective.role, 'reviewer');
  assert.equal(effective.persona, 'code-reviewer');
  assert.deepEqual(effective.executorPreference, ['claude']);
  assert.equal(effective.providerModel, 'claude');
  assert.equal(effective.tier, 'standard');
  assert.equal(effective.model, 'claude-3-7-sonnet-20250219');
  assert.equal(effective.visibility, 'headless');
  assert.deepEqual(effective.constraints.requiresSkills, ['fgos-coding-validating']);
  assert.ok(Object.isFrozen(effective));
  assert.ok(Object.isFrozen(effective.executorPreference));
  assert.ok(Object.isFrozen(effective.constraints));
});

test('high-risk work raises tier rigor to analytical or critical without downgrade', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
  });

  const heavyWork = {
    id: 'tsk-risk-1',
    risk: 'heavy',
  };

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    work: heavyWork,
  });

  assert.equal(effective.tier, 'analytical');
});

test('assignment explicit policy can narrow executor preference to pi over operation default', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: {
      preferExecutor: 'pi',
      fallbackExecutors: ['claude'],
    },
  });

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
  });

  assert.equal(effective.executorPreference[0], 'pi');
  assert.deepEqual(effective.executorPreference, ['pi', 'claude']);
});

test('CLI/human explicit override wins over Assignment policy preference', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: {
      preferExecutor: 'pi',
      minTier: 'standard',
    },
  });

  const cliOverride = {
    preferExecutor: 'claude',
    tier: 'critical',
    preferPersona: 'custom-reviewer',
    visibility: 'visible',
  };

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride,
  });

  assert.equal(effective.executorPreference[0], 'claude');
  assert.equal(effective.tier, 'critical');
  assert.equal(effective.persona, 'custom-reviewer');
  assert.equal(effective.visibility, 'visible');
});

test('literal model override is accepted when passed via CLI override or assignment policy', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
  });

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride: { model: 'claude-3-opus-custom' },
  });

  assert.equal(effective.model, 'claude-3-opus-custom');
});

test('governance gate rejects disallowed egress/provider', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: {
      preferExecutor: 'disallowed-provider',
    },
  });
  // RT1 fix: governance options require a real executors registry to verify
  // resolvedProvider against -- register the executor so this test exercises
  // the actual governance rejection, not the registry-absent fail-closed path.
  const runnerConfig = {
    executor: { command: 'claude' },
    executors: { 'disallowed-provider': { kind: 'agent', providerModel: 'disallowed-provider', command: 'disallowed-provider' } },
    modelPolicies: { 'disallowed-provider': { standard: 'disallowed-provider-model' } },
  };

  assert.throws(
    () =>
      resolveAssignmentDispatchPolicy({
        assignment,
        runnerConfig,
        options: { disallowedProviders: ['disallowed-provider'] },
      }),
    (err) => err instanceof RunnerConfigError && /disallowed egress/i.test(err.message),
  );
});

test('literal model override is rejected if it originates from workflow YAML policy without explicit override', () => {
  const assignment = {
    assignmentId: 'asgn_test_001',
    role: 'reviewer',
    stage: 'planning',
    operation: 'validate-plan',
    policy: {
      model: 'pinned-yaml-model',
      _fromYaml: true,
    },
  };

  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment }),
    (err) => err instanceof RunnerConfigError && /workflow YAML cannot pin literal model names/i.test(err.message),
  );
});

// --- Phase 00 R5: direct policy-tier resolver (fixes B1) ---

test('resolvePolicyTierModel resolves policy tiers above "standard" directly against a provider table (no DEFAULT_TIER_TO_POLICY indirection)', () => {
  const cfg = {
    modelPolicies: {
      claude: {
        lightweight: 'claude-3-5-haiku-20241022',
        standard: 'claude-3-7-sonnet-20250219',
        creative: 'claude-3-7-sonnet-20250219',
        analytical: 'claude-opus-analytical',
        critical: 'claude-opus-critical',
      },
    },
  };

  assert.equal(resolvePolicyTierModel(cfg, 'analytical', 'claude'), 'claude-opus-analytical');
  assert.equal(resolvePolicyTierModel(cfg, 'critical', 'claude'), 'claude-opus-critical');
});

test('resolvePolicyTierModel fails closed with a named RunnerConfigError for an unsupported provider/tier pair', () => {
  const cfg = {
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' },
    },
  };

  assert.throws(
    () => resolvePolicyTierModel(cfg, 'analytical', 'claude'),
    (err) => err instanceof RunnerConfigError && /analytical/.test(err.message) && /claude/.test(err.message),
  );
  assert.throws(
    () => resolvePolicyTierModel(cfg, 'standard', 'z-ai'),
    (err) => err instanceof RunnerConfigError && /standard/.test(err.message) && /z-ai/.test(err.message),
  );
});

test('resolveAssignmentDispatchPolicy resolves an analytical-tier work item against a provider that declares it (B1 end-to-end)', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });
  const runnerConfig = {
    executor: { command: 'claude' },
    modelPolicies: {
      claude: {
        standard: 'claude-3-7-sonnet-20250219',
        analytical: 'claude-opus-analytical',
      },
    },
  };

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    work: { id: 'tsk-b1-1', risk: 'heavy' },
    runnerConfig,
  });

  assert.equal(effective.tier, 'analytical');
  assert.equal(effective.model, 'claude-opus-analytical');
});

test('resolveAssignmentDispatchPolicy fails closed (throws, never a silent null model) when the resolved tier is unsupported by the provider', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });
  const runnerConfig = {
    executor: { command: 'claude' },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' }, // no "analytical" entry
    },
  };

  assert.throws(
    () =>
      resolveAssignmentDispatchPolicy({
        assignment,
        work: { id: 'tsk-b1-2', risk: 'heavy' },
        runnerConfig,
      }),
    (err) => err instanceof RunnerConfigError && /analytical/.test(err.message),
  );
});

// --- Phase 00 R6: executor/provider truth (fixes H2a/H2b) ---

test('deriveProviderFamily reads providerModel off the registered executor entry, not the executor id', () => {
  assert.equal(deriveProviderFamily({ providerModel: 'z-ai' }), 'z-ai');
  assert.equal(deriveProviderFamily({ provider: 'openai-codex' }), 'openai-codex');
  assert.equal(deriveProviderFamily({}), 'claude');
  assert.equal(deriveProviderFamily(undefined), 'claude');
});

test('resolveAssignmentDispatchPolicy derives providerModel from the registered executor entry\'s own providerModel field, not the executor id string', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'glm-cli' },
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    executors: {
      'glm-cli': { kind: 'agent', providerModel: 'z-ai', command: 'glm' },
    },
    modelPolicies: {
      'z-ai': { standard: 'glm-4.6' },
    },
  };

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });

  assert.equal(effective.executorId, 'glm-cli');
  assert.equal(effective.providerModel, 'z-ai');
  assert.equal(effective.model, 'glm-4.6');
  assert.notEqual(effective.providerModel, effective.executorId);
});

test('resolveAssignmentDispatchPolicy agrees with resolve.mjs\'s resolveExecutorConfig on provider family for a registered executor with no providerModel/provider whose real command is not a Claude CLI command (codex-cli shape)', () => {
  const executors = {
    'codex-cli': {
      kind: 'agent',
      allowCrossProvider: true,
      invocations: [
        { via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['exec', '{prompt}'] },
      ],
    },
  };
  const runnerConfig = {
    executor: { command: 'claude' },
    executors,
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' },
      codex: { standard: 'codex-default-model' },
    },
  };
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'codex-cli' },
  });

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });

  // Pins the fix: a single-argument deriveProviderFamily call silently
  // defaults its resolvedCommand parameter to "claude", so before the fix
  // this asserted 'claude' instead of the executor's real command family.
  assert.equal(effective.providerModel, 'codex');
  assert.equal(effective.provenance.provider.value, 'codex');
  assert.notEqual(effective.providerModel, 'claude');

  // Cross-check against resolve.mjs's own resolveExecutorConfig (the
  // already-correct two-argument call site, resolve.mjs:429) for the same
  // executor shape — both call sites must derive the same provider family.
  const resolvedExecutor = resolveExecutorConfig(runnerConfig, 'standard', 'codex-cli');
  assert.equal(resolvedExecutor.governance.providerFamily, effective.providerModel);
});

test('resolveAssignmentDispatchPolicy defaults providerModel to "claude" only when the executor is registered but declares no providerModel of its own', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'custom-claude-executor' },
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    executors: {
      'custom-claude-executor': { kind: 'agent', command: 'claude' },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' },
    },
  };

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });

  assert.equal(effective.providerModel, 'claude');
});

test('resolveAssignmentDispatchPolicy rejects an unregistered preferExecutor before spawn when a runnerConfig executor registry is present', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'totally-made-up-executor' },
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    executors: {
      claude: { kind: 'agent', command: 'claude' },
    },
  };

  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment, runnerConfig }),
    (err) => err instanceof RunnerConfigError && /totally-made-up-executor/.test(err.message) && /not a registered executor/i.test(err.message),
  );
});

test('resolveAssignmentDispatchPolicy never validates preferExecutor registration when runnerConfig declares no executors registry at all (config genuinely unavailable to check against)', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'pi' },
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    modelPolicies: { claude: { standard: 'claude-3-7-sonnet-20250219' }, pi: { standard: 'pi-default-model' } },
  };

  // No `executors` map on runnerConfig -- nothing to check registration
  // against, so this must NOT throw (matches every other optional-runnerConfig
  // treatment in this file).
  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });
  assert.equal(effective.executorId, 'pi');
});

test('resolveAssignmentDispatchPolicy derives providerModel via deriveProviderFamily on the isImplicitDefaultExecutor exemption, not the raw executor id (Phase 00 R6 fix F1)', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    // Non-empty registry that does NOT list 'claude' -- the real scenario
    // (this machine's own .fgos/config.json registers 'pi' but not
    // 'claude') that forced the isImplicitDefaultExecutor exemption.
    executors: {
      pi: { kind: 'agent', command: 'pi' },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' },
    },
  };

  // preferExecutor left at its default -> primaryExecutor resolves to 'claude'.
  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });

  assert.equal(effective.executorId, 'claude');
  // Pinned expected value: deriveProviderFamily({command: 'claude'}, 'claude')
  // resolves through CLAUDE_CLI_COMMANDS to 'claude' -- correctly derived,
  // not merely coincidentally equal to the raw executor id.
  assert.equal(effective.providerModel, 'claude');
  assert.equal(effective.model, 'claude-3-7-sonnet-20250219');
});

test('governance disallowedProviders (family) and disallowedExecutors (id) are independent checks (Phase 00 R6 fix F2)', () => {
  const buildEffective = (options) => {
    const assignment = buildAssignment({
      stage: 'planning',
      operation: 'validate-plan',
      policy: { preferExecutor: 'glm-cli' },
    });
    const runnerConfig = {
      executor: { command: 'claude' },
      executors: {
        'glm-cli': { kind: 'agent', providerModel: 'z-ai', command: 'glm' },
      },
      modelPolicies: {
        'z-ai': { standard: 'glm-4.6' },
      },
    };
    return resolveAssignmentDispatchPolicy({ assignment, runnerConfig, options });
  };

  // Baseline: neither list blocks -- resolves cleanly.
  const baseline = buildEffective({});
  assert.equal(baseline.executorId, 'glm-cli');
  assert.equal(baseline.providerModel, 'z-ai');

  // (a) disallowedProviders blocks by family.
  assert.throws(
    () => buildEffective({ disallowedProviders: ['z-ai'] }),
    (err) => err instanceof RunnerConfigError && /disallowed egress/i.test(err.message),
  );

  // (b) disallowedExecutors blocks by id (new).
  assert.throws(
    () => buildEffective({ disallowedExecutors: ['glm-cli'] }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected executor "glm-cli"/.test(err.message),
  );

  // (c) the OTHER field's value in either list does NOT block -- confirms
  // the two checks are genuinely independent, not redundant.
  const notBlockedByProviderList = buildEffective({ disallowedProviders: ['glm-cli'] });
  assert.equal(notBlockedByProviderList.executorId, 'glm-cli');
  const notBlockedByExecutorList = buildEffective({ disallowedExecutors: ['z-ai'] });
  assert.equal(notBlockedByExecutorList.providerModel, 'z-ai');
});

test('resolveAssignmentDispatchPolicy fails closed with a named RunnerConfigError when governance options are present but runnerConfig.executors is absent (Phase 00 R6 fix RT1)', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'glm-cli' },
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    // No `executors` registry at all -- the exact RT1 live-reproduction shape.
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' },
      'z-ai': { standard: 'glm-4.6' },
    },
  };
  const cliOverride = { preferExecutor: 'glm-cli' };

  assert.throws(
    () =>
      resolveAssignmentDispatchPolicy({
        assignment,
        runnerConfig,
        cliOverride,
        options: { disallowedProviders: ['z-ai'] },
      }),
    (err) =>
      err instanceof RunnerConfigError &&
      /runnerConfig\.executors is absent/.test(err.message) &&
      /"glm-cli"/.test(err.message),
  );

  // Same shape with `disallowedExecutors` instead must throw too.
  assert.throws(
    () =>
      resolveAssignmentDispatchPolicy({
        assignment,
        runnerConfig,
        cliOverride,
        options: { disallowedExecutors: ['glm-cli'] },
      }),
    (err) => err instanceof RunnerConfigError && /runnerConfig\.executors is absent/.test(err.message),
  );
});

test('resolveAssignmentDispatchPolicy does not require an executors registry when no governance options are present (no regression to the F1 exemption path)', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'pi' },
  });
  const runnerConfig = {
    executor: { command: 'claude' },
    modelPolicies: { claude: { standard: 'claude-3-7-sonnet-20250219' }, pi: { standard: 'pi-default-model' } },
  };

  // No `executors` map, no governance options -- must resolve successfully,
  // same as the pre-existing "genuinely unavailable to check against" test.
  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig, options: {} });
  assert.equal(effective.executorId, 'pi');

  const effectiveNoOptions = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });
  assert.equal(effectiveNoOptions.executorId, 'pi');
});

// --- Phase 00 R7: field-level policy provenance ---

test('resolveAssignmentDispatchPolicy attaches field-level provenance additively, without changing the existing flat fields', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'pi' },
  });
  const cliOverride = { tier: 'critical' };

  const effective = resolveAssignmentDispatchPolicy({ assignment, cliOverride });

  // Flat fields still present, unchanged in shape.
  assert.equal(effective.role, 'reviewer');
  assert.equal(effective.tier, 'critical');

  // New provenance field, additive.
  assert.ok(effective.provenance);
  assert.equal(effective.provenance.tier.value, 'critical');
  assert.deepEqual(effective.provenance.tier.source, { scope: 'cliOverride' });
  assert.equal(effective.provenance.executor.value, 'pi');
  assert.deepEqual(effective.provenance.executor.source, { scope: 'opPolicy', id: 'validate-plan' });
  assert.ok(Object.isFrozen(effective.provenance));
});

test('provenance.model.source and provenance.persona.source default to {scope: "default"} objects, never undefined, when no runnerConfig and no persona override apply (Phase 00 R7 fix F4)', () => {
  // `shape-plan` (unlike `validate-plan`) declares no `policy` block at all
  // in feature.yaml -- role `implementer`, no `preferPersona` of its own --
  // so nothing but the role-based reviewer default could ever supply a
  // persona, and that default does not fire for this non-reviewer role.
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'shape-plan',
  });

  // No runnerConfig at all -> no model source can resolve. Non-reviewer role
  // and no persona override -> no persona source can resolve either.
  const effective = resolveAssignmentDispatchPolicy({ assignment });

  assert.equal(effective.role, 'implementer');
  assert.equal(effective.persona, undefined);
  assert.equal(effective.model, null);

  assert.deepEqual(effective.provenance.model.source, { scope: 'default' });
  assert.deepEqual(effective.provenance.persona.source, { scope: 'default' });
});

// --- Phase 00 R8: pure provider capability validation ---

test('supportsPolicyTier is a pure boolean query with no I/O -- true only for a declared string model', () => {
  const cfg = {
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet-20250219' },
    },
  };

  assert.equal(supportsPolicyTier(cfg, 'claude', 'standard'), true);
  assert.equal(supportsPolicyTier(cfg, 'claude', 'analytical'), false);
  assert.equal(supportsPolicyTier(cfg, 'unknown-provider', 'standard'), false);
  assert.equal(supportsPolicyTier(undefined, 'claude', 'standard'), false);
  assert.equal(supportsPolicyTier({}, 'claude', 'standard'), false);
});

// ─── Step 08 P04.2b: the tier-floor stop gate this cell closes ─────────────
//
// resolveAssignmentDispatchPolicy's `effectiveTier = opPolicy.minTier ||
// 'standard'` was previously UNCONDITIONAL: no inline (agent-led or declared
// coordination) Assignment had any way to populate `assignment.policy` at
// all (execution-contract.mjs's whitelist had no `policy` field), so every
// inline dispatch's floor was always AT LEAST 'standard' -- and a real
// `.fgos/config.json`-shaped runner config that only configures
// `lightweight` for a non-claude provider family (this repo's own committed
// config does, for gemini/openai-codex/z-ai) could never be dispatched
// through this resolver at all. These tests exercise the REAL resolver end
// to end, not a mock, against a realistic fixture matching that shape.

function lightweightOnlyRunnerConfig() {
  return {
    executor: { command: 'claude' },
    executors: {
      'agy-cli': {
        kind: 'agent',
        providerModel: 'gemini',
        invocations: [{ via: 'cli', command: 'agy', args: ['-p', '{prompt}', '--model', '{model}'] }],
      },
    },
    // Matches the real committed .fgos/config.json shape: claude configures
    // every tier, gemini configures ONLY lightweight.
    modelPolicies: {
      claude: { lightweight: 'haiku', standard: 'sonnet', creative: 'sonnet', analytical: 'sonnet', critical: 'opus' },
      gemini: { lightweight: 'gemini-3.6-flash-medium' },
    },
  };
}

function lightweightOnlyInlineAssignment(overrides = {}) {
  return buildAssignment({
    provenance: {
      kind: 'inline',
      contract: {
        objective: 'Read-only, bounded research task',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json (status, summary)'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'researcher',
        budget: { timeoutMs: 60000, maxRuns: 1 },
        ...overrides,
      },
      caller: { writerId: 'writer-tier-floor-probe' },
    },
  });
}

test('resolveAssignmentDispatchPolicy: WITHOUT contract.policy.minTier, an inline dispatch to a lightweight-only provider family fails closed at the default "standard" floor (proves the stop gate this cell closes was real)', () => {
  const assignment = lightweightOnlyInlineAssignment();
  assert.equal(assignment.policy, undefined);

  assert.throws(
    () =>
      resolveAssignmentDispatchPolicy({
        assignment,
        runnerConfig: lightweightOnlyRunnerConfig(),
        cliOverride: { preferExecutor: 'agy-cli' },
      }),
    (err) => err instanceof RunnerConfigError,
  );
});

test('resolveAssignmentDispatchPolicy: contract.policy = {minTier: "lightweight"} resolves effectiveTier "lightweight" (not "standard") through the REAL resolver, for a provider family that only configures "lightweight"', () => {
  const assignment = lightweightOnlyInlineAssignment({ policy: { minTier: 'lightweight' } });
  assert.deepEqual(assignment.policy, { minTier: 'lightweight' });

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    runnerConfig: lightweightOnlyRunnerConfig(),
    cliOverride: { preferExecutor: 'agy-cli' },
  });

  assert.equal(effective.tier, 'lightweight');
  assert.equal(effective.providerModel, 'gemini');
  assert.equal(effective.model, 'gemini-3.6-flash-medium');
  assert.deepEqual(effective.provenance.tier, { value: 'lightweight', source: { scope: 'opPolicy', id: undefined } });
});

// ─── Phase 04 (executor-policy-dispatch-seams): quality bridge ─────────────
//
// design.md §3.2 / phase-04-quality-bridge.md. `resolveAssignmentDispatchPolicy`
// is the single canonical resolver every dispatch path already funnels
// through (plan.mjs's compileDispatchPlan, cli.mjs's executeExecutorCli,
// cohort-planner.mjs's FlowDefinition dispatch) -- the quality bridge lives
// here so every caller gets it for free, additively: `quality` and
// `lookupPolicyTier` are new fields nobody read before this phase, and
// `effectiveTier`/`tier`/`model` stay byte-identical for every caller that
// never supplies the new optional `rigorOverrides`/`mode`/`minRigor` inputs.

import {
  QUALITY_TIER_BRIDGE,
  MIN_RIGOR_VALUES,
  QUALITY_MODE_VALUES,
  REASONING_EFFORT_VALUES,
  LEGACY_EXECUTOR_ALIASES,
} from '../../src/runner/dispatch/assignment-policy.mjs';

test('Phase 04: legacy tier bridge maps every MODEL_POLICY_TIERS value to its canonical quality', () => {
  assert.deepEqual(QUALITY_TIER_BRIDGE.lightweight, { minRigor: 'low', mode: 'balanced' });
  assert.deepEqual(QUALITY_TIER_BRIDGE.standard, { minRigor: 'standard', mode: 'balanced' });
  assert.deepEqual(QUALITY_TIER_BRIDGE.creative, { minRigor: 'standard', mode: 'creative' });
  assert.deepEqual(QUALITY_TIER_BRIDGE.analytical, { minRigor: 'high', mode: 'analytical' });
  assert.deepEqual(QUALITY_TIER_BRIDGE.critical, { minRigor: 'critical', mode: 'analytical' });
});

test('Phase 04: quality.minRigor/mode are derived from the raise-only-composed semantic tier, sourceKind implied-by-tier-bridge', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });
  const heavyWork = { id: 'tsk-quality-1', risk: 'heavy' };

  const effective = resolveAssignmentDispatchPolicy({ assignment, work: heavyWork });

  // Unchanged pre-existing composition: work.risk === 'heavy' raises the
  // floor to 'analytical' (pinned by the "high-risk work raises tier rigor"
  // test above) -- the quality bridge must derive FROM that already-composed
  // value, never re-derive tier composition of its own.
  assert.equal(effective.tier, 'analytical');
  assert.equal(effective.quality.minRigor.value, 'high');
  assert.deepEqual(effective.quality.minRigor.source, { scope: 'derived', id: 'analytical' });
  assert.equal(effective.quality.mode.value, 'analytical');
  assert.equal(effective.quality.mode.sourceKind, 'implied-by-tier-bridge');
  assert.ok(Object.isFrozen(effective.quality));
});

test('Phase 04: mode source precedence -- explicit wins over implied-by-tier-bridge', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });

  const viaCliOverride = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride: { tier: 'creative', mode: 'adversarial' },
  });
  assert.equal(viaCliOverride.quality.mode.value, 'adversarial');
  assert.equal(viaCliOverride.quality.mode.sourceKind, 'explicit');
  assert.deepEqual(viaCliOverride.quality.mode.source, { scope: 'cliOverride' });
  // minRigor stays derived from the tier bridge regardless of explicit mode.
  assert.equal(viaCliOverride.quality.minRigor.value, 'standard');

  const viaOpPolicy = resolveAssignmentDispatchPolicy({
    assignment: buildAssignment({
      stage: 'planning',
      operation: 'validate-plan',
      policy: { minTier: 'creative', mode: 'adversarial' },
    }),
  });
  assert.equal(viaOpPolicy.quality.mode.value, 'adversarial');
  assert.equal(viaOpPolicy.quality.mode.sourceKind, 'explicit');

  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment, cliOverride: { mode: 'not-a-real-mode' } }),
    (err) => err instanceof RunnerConfigError && /invalid mode/i.test(err.message),
  );
});

test('Phase 04: explicit minRigor at or below the derived value is accepted; the effective value stays the derived one (read-only, not an independent raise channel)', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan', policy: { minTier: 'analytical' } });

  // 'analytical' derives minRigor 'high'. An explicit 'standard' (weaker) or
  // 'high' (equal) must both be accepted without changing the effective
  // value away from the derived one.
  for (const explicit of ['standard', 'high']) {
    const effective = resolveAssignmentDispatchPolicy({ assignment, cliOverride: { minRigor: explicit } });
    assert.equal(effective.quality.minRigor.value, 'high', `explicit minRigor "${explicit}" must not change the derived value`);
  }
});

test('Phase 04: explicit minRigor stronger than the semantic-tier-derived value is rejected', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan', policy: { minTier: 'standard' } });

  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment, cliOverride: { minRigor: 'critical' } }),
    (err) => err instanceof RunnerConfigError && /stronger than the semantic-tier-derived value/i.test(err.message),
  );
  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment, cliOverride: { minRigor: 'not-a-real-rigor' } }),
    (err) => err instanceof RunnerConfigError && /invalid minRigor/i.test(err.message),
  );
});

test('Phase 04: raw agy heavy work preserves lookupPolicyTier "creative" -> gemini-3.8-flash-high, while semanticTier/quality.minRigor stay "critical"', () => {
  // Mirrors the real agy-cli/agy-herdr executor shape (rigorOverrides keyed
  // by this resolver's own policy-tier vocabulary): heavy work composes up
  // to the 'critical' semantic tier (DEFAULT_TIER_TO_POLICY.heavy ===
  // 'critical', dispatch/config.mjs), and agy's own rigorOverrides retarget
  // ONLY the model-lookup key for 'critical' to 'creative' -- design.md
  // §5.3's "creative-column trap" this phase must not fall into.
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { minTier: 'critical', rigorOverrides: { critical: 'creative' } },
  });
  const runnerConfig = {
    executor: { command: 'agy' },
    modelPolicies: { gemini: { standard: 'gemini-3.8-flash-medium', creative: 'gemini-3.8-flash-high', critical: 'gemini-3.8-flash-critical-unused' } },
  };

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig, cliOverride: { providerModel: 'gemini' } });

  assert.equal(effective.tier, 'critical', 'legacy flat tier field unaffected');
  assert.equal(effective.provenance.semanticTier.value, 'critical');
  assert.equal(effective.quality.minRigor.value, 'critical', 'canonical minRigor must not follow the calibration lookup tier');
  assert.equal(effective.lookupPolicyTier, 'creative');
  assert.deepEqual(effective.provenance.lookupPolicyTier.source, { scope: 'executor', kind: 'calibration' });
  assert.equal(effective.model, 'gemini-3.8-flash-high');
});

test('Phase 04: fgos-coding-implement capability override retargets lookupPolicyTier to "standard" -> gemini-3.8-flash-medium, for the SAME critical semantic tier/heavy work', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { minTier: 'critical', rigorOverrides: { critical: 'standard' } },
  });
  const runnerConfig = {
    executor: { command: 'agy' },
    modelPolicies: { gemini: { standard: 'gemini-3.8-flash-medium', creative: 'gemini-3.8-flash-high' } },
  };

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig, cliOverride: { providerModel: 'gemini' } });

  assert.equal(effective.provenance.semanticTier.value, 'critical');
  assert.equal(effective.quality.minRigor.value, 'critical', 'the same heavy work item keeps the same semantic rigor regardless of which provider calibration it dispatches through');
  assert.equal(effective.lookupPolicyTier, 'standard');
  assert.equal(effective.model, 'gemini-3.8-flash-medium');
});

test('Phase 04: without rigorOverrides, lookupPolicyTier equals semanticTier/effectiveTier (value-preserving no-op for every pre-Phase-04 caller)', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan', policy: { minTier: 'creative' } });

  const effective = resolveAssignmentDispatchPolicy({ assignment });

  assert.equal(effective.lookupPolicyTier, 'creative');
  assert.equal(effective.provenance.semanticTier.value, 'creative');
  assert.deepEqual(effective.provenance.lookupPolicyTier.source, { scope: 'opPolicy', id: 'validate-plan', kind: 'semantic' });
});

test('Phase 04: rigorOverrides naming an unrecognized policy tier fails closed', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { minTier: 'critical', rigorOverrides: { critical: 'not-a-real-tier' } },
  });

  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment }),
    (err) => err instanceof RunnerConfigError && /not a recognized policy tier/i.test(err.message),
  );
});

test('Phase 04: evidence separately exposes semanticTier, canonical quality, lookupPolicyTier, and model source provenance', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { minTier: 'critical', rigorOverrides: { critical: 'creative' } },
  });
  const runnerConfig = {
    executor: { command: 'agy' },
    modelPolicies: { gemini: { creative: 'gemini-3.8-flash-high' } },
  };

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig, cliOverride: { providerModel: 'gemini' } });

  assert.notEqual(effective.provenance.semanticTier.value, effective.lookupPolicyTier, 'semanticTier and lookupPolicyTier must be independently inspectable, not the same collapsed value');
  assert.equal(effective.provenance.semanticTier.value, 'critical');
  assert.equal(effective.lookupPolicyTier, 'creative');
  assert.equal(effective.quality.minRigor.value, 'critical');
  assert.equal(effective.quality.mode.value, 'analytical');
  assert.deepEqual(effective.provenance.model.source, { scope: 'runnerConfig', id: 'gemini.creative' });
  assert.equal(effective.model, 'gemini-3.8-flash-high');
});

test('Phase 04: MIN_RIGOR_VALUES/QUALITY_MODE_VALUES are the exact contract vocabularies', () => {
  assert.deepEqual(MIN_RIGOR_VALUES, ['low', 'standard', 'high', 'critical']);
  assert.deepEqual(QUALITY_MODE_VALUES, ['balanced', 'creative', 'analytical', 'adversarial']);
});

// ─── Phase 03 (executor-policy-dispatch-seams): reasoningEffort + alias seam ─

test('Phase 03: reasoningEffort defaults from canonical minRigor (low/standard/high/critical -> low/medium/high/max)', () => {
  const cases = [
    { minTier: 'lightweight', expectedEffort: 'low' },
    { minTier: 'standard', expectedEffort: 'medium' },
    { minTier: 'analytical', expectedEffort: 'high' },
    { minTier: 'critical', expectedEffort: 'max' },
  ];
  for (const { minTier, expectedEffort } of cases) {
    const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan', policy: { minTier } });
    const effective = resolveAssignmentDispatchPolicy({ assignment });
    assert.equal(effective.reasoningEffort, expectedEffort, `minTier "${minTier}" should default reasoningEffort "${expectedEffort}"`);
    assert.deepEqual(effective.provenance.reasoningEffort.source, { scope: 'derived', id: `quality.minRigor.${effective.quality.minRigor.value}` });
  }
});

test('Phase 03: explicit reasoningEffort is most-specific-wins, never raise-only like minRigor', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan', policy: { minTier: 'critical' } });

  // 'critical' derives reasoningEffort "max" -- an explicit weaker value must
  // still be honored (no raise-only constraint on this field).
  const effective = resolveAssignmentDispatchPolicy({ assignment, cliOverride: { reasoningEffort: 'low' } });
  assert.equal(effective.reasoningEffort, 'low');
  assert.deepEqual(effective.provenance.reasoningEffort.source, { scope: 'cliOverride' });

  assert.throws(
    () => resolveAssignmentDispatchPolicy({ assignment, cliOverride: { reasoningEffort: 'not-a-real-effort' } }),
    (err) => err instanceof RunnerConfigError && /invalid reasoningEffort/i.test(err.message),
  );
});

test('Phase 03: preferExecutor "claude-reviewer" at CLI scope expands the alias patch at CLI scope with viaAlias', () => {
  // A raw (non-declared-operation) assignment on purpose: `validate-plan`'s
  // own taskSpec already stamps a default `policy.preferPersona:
  // "code-reviewer"` (opPolicy), which correctly outranks the alias
  // (opPolicy is more specific than a compatibility bridge default) -- this
  // test isolates the alias's OWN contribution with no such opPolicy
  // default in the way, same raw-object pattern other tests in this file
  // already use for inline assignments.
  const assignment = {
    assignmentId: 'asgn_alias_test_001',
    role: 'implementer',
    stage: 'executing',
    operation: 'ad-hoc',
    objective: 'test',
    policy: {},
    skills: [],
  };

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride: { preferExecutor: 'claude-reviewer' },
  });

  assert.equal(effective.persona, 'code-reviewer');
  assert.equal(effective.reasoningEffort, 'high');
  assert.deepEqual(effective.provenance.executorAlias.source, { scope: 'cliOverride', viaAlias: 'claude-reviewer' });
  assert.equal(effective.provenance.executorAlias.value, 'claude-reviewer');
  assert.deepEqual([...effective.provenance.executorAlias.patchFields].sort(), ['preferPersona', 'reasoningEffort']);
  assert.deepEqual(effective.provenance.persona.source, { scope: 'cliOverride', viaAlias: 'claude-reviewer' });
  assert.deepEqual(effective.provenance.reasoningEffort.source, { scope: 'cliOverride', viaAlias: 'claude-reviewer' });
});

test('Phase 03: for a declared operation whose own opPolicy already sets preferPersona, that opPolicy value still wins over the alias -- alias is not a new precedence scope', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride: { preferExecutor: 'claude-reviewer' },
  });

  assert.equal(effective.persona, 'code-reviewer');
  assert.deepEqual(effective.provenance.persona.source, { scope: 'opPolicy', id: 'validate-plan' });
  // reasoningEffort has no such opPolicy default, so the alias DOES supply it here.
  assert.equal(effective.reasoningEffort, 'high');
  assert.deepEqual(effective.provenance.reasoningEffort.source, { scope: 'cliOverride', viaAlias: 'claude-reviewer' });
});

test('Phase 03: preferExecutor "claude-reviewer-herdr" at actor/opPolicy scope expands persona + reasoningEffort + visibility with viaAlias at that same scope', () => {
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'claude-reviewer-herdr' },
  });

  const effective = resolveAssignmentDispatchPolicy({ assignment });

  assert.equal(effective.persona, 'code-reviewer');
  assert.equal(effective.reasoningEffort, 'high');
  assert.equal(effective.visibility, 'visible');
  assert.deepEqual(effective.provenance.executorAlias.source, { scope: 'opPolicy', id: 'validate-plan', viaAlias: 'claude-reviewer-herdr' });
});

test('Phase 03: an explicit same-scope value always wins over the alias patch (alias never adds a new precedence scope)', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride: { preferExecutor: 'claude-reviewer', preferPersona: 'custom-reviewer', reasoningEffort: 'low' },
  });

  assert.equal(effective.persona, 'custom-reviewer');
  assert.equal(effective.reasoningEffort, 'low');
  assert.deepEqual(effective.provenance.persona.source, { scope: 'cliOverride' });
});

test('Phase 03: "codex-readonly" is recognized as a legacy alias with an empty patch -- it never carries a permission contract', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });

  const effective = resolveAssignmentDispatchPolicy({
    assignment,
    cliOverride: { preferExecutor: 'codex-readonly' },
  });

  assert.equal(effective.provenance.executorAlias.value, 'codex-readonly');
  assert.deepEqual(effective.provenance.executorAlias.patchFields, []);
  // No permission/visibility field was smuggled in through the alias.
  assert.equal(effective.visibility, 'headless');
});

test('Phase 03: an unaliased executor leaves executorAlias.value null and does not change persona/reasoningEffort defaults', () => {
  const assignment = buildAssignment({ stage: 'planning', operation: 'validate-plan' });
  const effective = resolveAssignmentDispatchPolicy({ assignment });

  assert.equal(effective.provenance.executorAlias.value, null);
  assert.deepEqual(effective.provenance.executorAlias.source, { scope: 'default' });
  assert.deepEqual(effective.provenance.executorAlias.patchFields, []);
});

test('Phase 03: LEGACY_EXECUTOR_ALIASES/REASONING_EFFORT_VALUES are the exact declared vocabularies', () => {
  assert.deepEqual(REASONING_EFFORT_VALUES, ['low', 'medium', 'high', 'max']);
  assert.deepEqual(Object.keys(LEGACY_EXECUTOR_ALIASES).sort(), ['claude-reviewer', 'claude-reviewer-herdr', 'codex-readonly']);
});

