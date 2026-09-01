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

