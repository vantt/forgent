// dispatch/assignment-policy.mjs — Dispatch policy resolution for assignments (Step 01 Slice 3a / Step 03).
//
// Resolution order:
// Global defaults -> Domain defaults -> Workflow defaults -> Stage defaults
// -> Operation / taskSpec defaults -> Role defaults -> Persona defaults
// -> Work-item policy -> Assignment explicit policy -> Human / CLI explicit override
// -> Governance gate
//
// Invariants:
// - Constraints accumulate and fail closed.
// - Tier resolves to the strongest required tier (cannot be weakened).
// - Literal model names are accepted only from Assignment or human/CLI override (never workflow YAML).
// - Executor/provider preference uses the most specific value.

import { MODEL_POLICY_TIERS, RunnerConfigError } from './config.mjs';
import { modelForTier } from './resolve.mjs';

export const TIER_STRENGTH = Object.freeze({
  lightweight: 1,
  standard: 2,
  creative: 3,
  analytical: 4,
  critical: 5,
});

/**
 * Return the stronger of two tiers based on rigor hierarchy.
 *
 * @param {string} tierA
 * @param {string} tierB
 * @returns {string}
 */
export function resolveStrongerTier(tierA, tierB) {
  if (!tierA && !tierB) return 'standard';
  if (!tierA) return tierB;
  if (!tierB) return tierA;

  const strengthA = TIER_STRENGTH[tierA] ?? 0;
  const strengthB = TIER_STRENGTH[tierB] ?? 0;

  if (strengthA === 0 && strengthB === 0) return tierA;
  return strengthB > strengthA ? tierB : tierA;
}

/**
 * Resolve effective dispatch policy for an Assignment before execution attempt (Step 03 §3.1).
 *
 * @param {object} params
 * @param {object} params.assignment Assignment object (required)
 * @param {object} [params.work] Work item context (optional)
 * @param {object} [params.runnerConfig] Runner configuration (optional)
 * @param {object} [params.cliOverride] Human / CLI overrides (optional)
 * @param {object} [params.options] Governance and lookup options
 * @returns {Readonly<object>} Effective dispatch policy
 */
export function resolveAssignmentDispatchPolicy({
  assignment,
  work,
  runnerConfig,
  cliOverride = {},
  options = {},
}) {
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('resolveAssignmentDispatchPolicy requires an assignment object');
  }

  const opPolicy = assignment.policy || {};

  // Reject literal model in operation policy if it was not explicitly stamped as assignment-level
  if (opPolicy.model && !assignment._allowLiteralModel && !cliOverride.model) {
    // If model comes from declared operation YAML, it is prohibited
    if (opPolicy._fromYaml) {
      throw new RunnerConfigError('workflow YAML cannot pin literal model names; use minTier or persona');
    }
  }

  // 1. Tier Resolution (monotonicity: highest required tier wins)
  let effectiveTier = opPolicy.minTier || 'standard';

  // Work item tier / risk policy
  if (work) {
    if (work.tier && MODEL_POLICY_TIERS.includes(work.tier)) {
      effectiveTier = resolveStrongerTier(effectiveTier, work.tier);
    } else if (work.risk === 'heavy') {
      // High-risk work raises floor to at least standard or analytical
      effectiveTier = resolveStrongerTier(effectiveTier, 'analytical');
    }
  }

  // CLI override tier
  const cliTier = cliOverride.tier || cliOverride.minTier;
  if (cliTier) {
    if (!MODEL_POLICY_TIERS.includes(cliTier)) {
      throw new RunnerConfigError(`invalid override tier "${cliTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
    }
    effectiveTier = resolveStrongerTier(effectiveTier, cliTier);
  }

  if (!MODEL_POLICY_TIERS.includes(effectiveTier)) {
    throw new RunnerConfigError(`unrecognized tier "${effectiveTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }

  // 2. Persona Resolution
  const resolvedPersona =
    cliOverride.preferPersona ??
    opPolicy.preferPersona ??
    (assignment.role === 'reviewer' ? 'code-reviewer' : undefined);

  // 3. Executor Preference Resolution
  const primaryExecutor =
    cliOverride.preferExecutor ??
    opPolicy.preferExecutor ??
    runnerConfig?.executor?.command ??
    'claude';

  const declaredFallbacks = cliOverride.fallbackExecutors ?? opPolicy.fallbackExecutors ?? [];
  const executorList = [
    primaryExecutor,
    ...declaredFallbacks.filter((e) => e !== primaryExecutor),
  ];

  // 4. Provider Model & Literal Model Resolution
  const resolvedProvider = primaryExecutor;
  let resolvedModel = null;

  if (cliOverride.model) {
    resolvedModel = cliOverride.model;
  } else if (opPolicy.model) {
    resolvedModel = opPolicy.model;
  } else if (runnerConfig) {
    try {
      resolvedModel = modelForTier(runnerConfig, effectiveTier, { providerModel: resolvedProvider });
    } catch {
      // If runnerConfig does not have a mapping for this provider/tier, leave model null or let executor defaults apply
      resolvedModel = null;
    }
  }

  // 5. Visibility Resolution
  const resolvedVisibility = cliOverride.visibility ?? opPolicy.visibility ?? 'headless';

  // 6. Constraints Accumulation
  const skills = Array.isArray(assignment.skills) ? assignment.skills : [];
  const constraints = {
    requiresSkills: Object.freeze([...skills]),
    ...(opPolicy.constraints || {}),
  };

  // 7. Governance check
  if (options.disallowedProviders && options.disallowedProviders.includes(resolvedProvider)) {
    throw new RunnerConfigError(`governance gate rejected provider "${resolvedProvider}": disallowed egress`);
  }

  const effectivePolicy = {
    role: assignment.role,
    persona: resolvedPersona,
    executorPreference: Object.freeze(executorList),
    providerModel: resolvedProvider,
    tier: effectiveTier,
    model: resolvedModel,
    visibility: resolvedVisibility,
    constraints: Object.freeze(constraints),
  };

  return Object.freeze(effectivePolicy);
}
