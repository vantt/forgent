import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import {
  resolveAssignmentDispatchPolicy,
  resolveStrongerTier,
  TIER_STRENGTH,
} from '../../src/runner/dispatch/assignment-policy.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

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
  assert.deepEqual(effective.executorPreference, ['claude', 'pi']);
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

  assert.throws(
    () =>
      resolveAssignmentDispatchPolicy({
        assignment,
        options: { disallowedProviders: ['disallowed-provider'] },
      }),
    (err) => err instanceof RunnerConfigError && /disallowed egress/i.test(err.message),
  );
});
