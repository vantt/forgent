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
import { resolvePolicyTierModel, deriveProviderFamily } from './resolve.mjs';

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

  const opId = assignment.operation;
  const strength = (t) => TIER_STRENGTH[t] ?? 0;

  // 1. Tier Resolution (monotonicity: highest required tier wins)
  let effectiveTier = opPolicy.minTier || 'standard';
  let tierSource = opPolicy.minTier ? { scope: 'opPolicy', id: opId } : { scope: 'default' };

  // Work item tier / risk policy
  if (work) {
    if (work.tier && MODEL_POLICY_TIERS.includes(work.tier)) {
      if (strength(work.tier) > strength(effectiveTier)) tierSource = { scope: 'work', id: work.id };
      effectiveTier = resolveStrongerTier(effectiveTier, work.tier);
    } else if (work.risk === 'heavy') {
      // High-risk work raises floor to at least standard or analytical
      if (strength('analytical') > strength(effectiveTier)) tierSource = { scope: 'work', id: work.id };
      effectiveTier = resolveStrongerTier(effectiveTier, 'analytical');
    }
  }

  // CLI override tier
  const cliTier = cliOverride.tier || cliOverride.minTier;
  if (cliTier) {
    if (!MODEL_POLICY_TIERS.includes(cliTier)) {
      throw new RunnerConfigError(`invalid override tier "${cliTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
    }
    if (strength(cliTier) > strength(effectiveTier)) tierSource = { scope: 'cliOverride' };
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
  const personaSource = cliOverride.preferPersona
    ? { scope: 'cliOverride' }
    : opPolicy.preferPersona
      ? { scope: 'opPolicy', id: opId }
      : resolvedPersona
        ? { scope: 'default', id: assignment.role }
        // Phase 00 R7/F4: still `{ scope: 'default' }` (no id) rather than
        // `undefined` when no persona resolves at all -- provenance.persona.source
        // must always be an object, per the documented shape.
        : { scope: 'default' };

  // 3. Executor Preference Resolution
  const primaryExecutor =
    cliOverride.preferExecutor ??
    opPolicy.preferExecutor ??
    runnerConfig?.executor?.command ??
    'claude';
  const executorSource = cliOverride.preferExecutor
    ? { scope: 'cliOverride' }
    : opPolicy.preferExecutor
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };

  const declaredFallbacks = cliOverride.fallbackExecutors ?? opPolicy.fallbackExecutors ?? [];
  // `fallbackExecutors` is reserved-not-executed (Phase 00 R10): only
  // `executorList[0]` (primaryExecutor) is ever actually dispatched --
  // entries beyond it are recorded for future automatic-failover, never
  // validated for registration and never spawned by this resolver.
  const executorList = [
    primaryExecutor,
    ...declaredFallbacks.filter((e) => e !== primaryExecutor),
  ];

  // 3b. Resolve `primaryExecutor` to its REGISTERED config entry (Phase 00
  // R6, fixes H2a/H2b) before deriving provider/model — a registered
  // executor's own `providerModel` field is the truth for provider family,
  // never the executor id string. The registered-executor check only
  // applies when `runnerConfig.executors` is itself present (a real
  // registry to check against) -- a caller that passes no `executors` map
  // at all (only a bare global `executor` block, or no runnerConfig)
  // legitimately has nothing to validate `primaryExecutor` against, same as
  // every other place in this file that treats `runnerConfig` as optional.
  const hasExecutorRegistry = Boolean(runnerConfig && runnerConfig.executors && typeof runnerConfig.executors === 'object');
  // Phase 00 RT1 fix: governance (`disallowedProviders`/`disallowedExecutors`)
  // is only trustworthy when there is a real `executors` registry to verify
  // `resolvedProvider`/`primaryExecutor` against -- without one, `resolvedProvider`
  // below either falls back to the raw executor id or a best-effort synthetic
  // derivation, neither of which is a verified provider family. Fail closed
  // here, before any resolution or governance check, rather than silently
  // under-enforcing governance against an unverifiable value. Gated strictly
  // on governance options being present so the F1 no-registry exemption path
  // stays untouched when governance isn't in play.
  const hasGovernanceOptions =
    (Array.isArray(options.disallowedProviders) && options.disallowedProviders.length > 0) ||
    (Array.isArray(options.disallowedExecutors) && options.disallowedExecutors.length > 0);
  if (hasGovernanceOptions && !hasExecutorRegistry) {
    throw new RunnerConfigError(
      `governance requires "disallowedProviders"/"disallowedExecutors" but runnerConfig.executors is absent -- provider family cannot be verified for executor "${primaryExecutor}"`,
    );
  }
  const registeredExecutorEntry = hasExecutorRegistry ? runnerConfig.executors[primaryExecutor] : undefined;
  // The literal "claude" identity (CLAUDE_CLI_COMMANDS' own default) and
  // whatever the base `runnerConfig.executor.command` already is are the
  // implicit global default -- always structurally valid (validated at
  // config-load time via `validateExecutorShape`) regardless of whether an
  // `executors{}` map also happens to list a matching entry. No silent
  // substitution occurs by resolving either of these without a registry
  // hit, so only a genuinely DIFFERENT, unregistered id fails closed here.
  const isImplicitDefaultExecutor = primaryExecutor === 'claude' || primaryExecutor === runnerConfig?.executor?.command;
  if (hasExecutorRegistry && !registeredExecutorEntry && !isImplicitDefaultExecutor) {
    throw new RunnerConfigError(`preferExecutor "${primaryExecutor}" is not a registered executor (runnerConfig.executors has no such entry).`);
  }

  // 4. Provider Model & Literal Model Resolution
  // `isImplicitDefaultExecutor` (above) exempts ONLY the "unregistered
  // executor" throw -- it must not also fall back to the raw executor-id
  // string here (that reproduces H2a's exact defect for this one carve-out;
  // Phase 00 R6 fix F1). Derive the provider family the same way a real
  // registered entry would, against a synthetic entry carrying the resolved
  // global command, with `primaryExecutor` itself as the command literal --
  // `isImplicitDefaultExecutor` guarantees `primaryExecutor` IS either the
  // literal `'claude'` or `runnerConfig?.executor?.command`, so passing
  // `runnerConfig?.executor?.command` instead here would derive the wrong
  // family whenever those two differ (e.g. an explicit `preferExecutor:
  // 'claude'` override while the global `executor.command` is `'pi'`).
  // A registered entry's real command lives under `invocations[].command`
  // (the `via: "cli"` entry — same selection resolve.mjs's
  // resolveExecutorConfig uses) for every currently-registered production
  // executor shape (.fgos/config.json's `runner.executors` — every entry
  // invocations[]-shaped). Without this, `deriveProviderFamily` below
  // would silently default its `resolvedCommand` parameter to `'claude'`,
  // disagreeing with resolve.mjs:429's own two-argument call for any
  // registered executor whose real command isn't a Claude CLI command
  // (e.g. `codex-cli`). A bare (non-invocations) entry shape has no such
  // structured signal to extract from — `registeredExecutorCommand` stays
  // `undefined` there, so `deriveProviderFamily`'s own default parameter
  // (`'claude'`) applies exactly as it did before this fix, unchanged for
  // every bare-shape entry (including one whose flat `.command` is a
  // locally-swapped-in test executable that carries no real provider
  // signal of its own).
  const registeredExecutorCommand = registeredExecutorEntry?.invocations?.find((inv) => inv.via === 'cli')?.command;
  const resolvedProvider = registeredExecutorEntry
    ? deriveProviderFamily(registeredExecutorEntry, registeredExecutorCommand)
    : isImplicitDefaultExecutor
      ? deriveProviderFamily({ command: runnerConfig?.executor?.command }, primaryExecutor)
      : primaryExecutor;
  const providerSource = registeredExecutorEntry
    ? { scope: 'registeredExecutor', id: primaryExecutor }
    : executorSource;
  let resolvedModel = null;
  // Phase 00 R7/F4: defaults to `{ scope: 'default' }` below when no
  // override/runnerConfig resolves a source -- provenance.model.source must
  // always be an object, never `undefined`, per the documented shape.
  let modelSource = { scope: 'default' };

  if (cliOverride.model) {
    resolvedModel = cliOverride.model;
    modelSource = { scope: 'cliOverride' };
  } else if (opPolicy.model) {
    resolvedModel = opPolicy.model;
    modelSource = { scope: 'opPolicy', id: opId };
  } else if (runnerConfig) {
    // Direct policy-tier resolution (Phase 00 R5, fixes B1): fails closed
    // with a named RunnerConfigError when the provider/tier pair is
    // unsupported -- never swallowed into a silent `null` model.
    resolvedModel = resolvePolicyTierModel(runnerConfig, effectiveTier, resolvedProvider);
    modelSource = { scope: 'runnerConfig', id: `${resolvedProvider}.${effectiveTier}` };
  }

  // 5. Visibility Resolution
  const resolvedVisibility = cliOverride.visibility ?? opPolicy.visibility ?? 'headless';
  const visibilitySource = cliOverride.visibility
    ? { scope: 'cliOverride' }
    : opPolicy.visibility
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };

  // 6. Constraints Accumulation
  const skills = Array.isArray(assignment.skills) ? assignment.skills : [];
  const constraints = {
    requiresSkills: Object.freeze([...skills]),
    ...(opPolicy.constraints || {}),
  };
  const constraintsSource = { scope: 'assignment', id: assignment.assignmentId };

  // 7. Governance check (Phase 00 R6/F2: `resolvedProvider` and
  // `primaryExecutor` are checked as two DISTINCT fields, never merged into
  // one -- `disallowedProviders` names a provider family, never a raw
  // executor id, per its own option name; `disallowedExecutors` is its
  // executor-id-keyed counterpart, for governance configs that need to
  // block one specific registered executor entry even when its declared
  // provider family is otherwise trusted)
  if (options.disallowedProviders && options.disallowedProviders.includes(resolvedProvider)) {
    throw new RunnerConfigError(`governance gate rejected provider "${resolvedProvider}": disallowed egress`);
  }
  if (options.disallowedExecutors && options.disallowedExecutors.includes(primaryExecutor)) {
    throw new RunnerConfigError(`governance gate rejected executor "${primaryExecutor}": disallowed`);
  }
  const governanceSource = { scope: 'governance', id: resolvedProvider };

  const effectivePolicy = {
    role: assignment.role,
    persona: resolvedPersona,
    executorPreference: Object.freeze(executorList),
    executorId: primaryExecutor,
    providerModel: resolvedProvider,
    tier: effectiveTier,
    model: resolvedModel,
    visibility: resolvedVisibility,
    constraints: Object.freeze(constraints),
    // Phase 00 R7: field-level provenance, additive alongside the flat
    // fields above (which stay unchanged in shape/values for backward
    // compatibility this phase) -- shape matches ADR-009's FlowDefinition
    // PolicyPatch provenance contract `{field: {value, source: {scope, id}}}`.
    provenance: Object.freeze({
      executor: Object.freeze({ value: primaryExecutor, source: Object.freeze(executorSource) }),
      provider: Object.freeze({ value: resolvedProvider, source: Object.freeze(providerSource) }),
      model: Object.freeze({ value: resolvedModel, source: modelSource ? Object.freeze(modelSource) : undefined }),
      tier: Object.freeze({ value: effectiveTier, source: Object.freeze(tierSource) }),
      persona: Object.freeze({ value: resolvedPersona, source: personaSource ? Object.freeze(personaSource) : undefined }),
      visibility: Object.freeze({ value: resolvedVisibility, source: Object.freeze(visibilitySource) }),
      constraints: Object.freeze({ value: constraints, source: Object.freeze(constraintsSource) }),
      governance: Object.freeze({ value: 'allowed', source: Object.freeze(governanceSource) }),
    }),
  };

  return Object.freeze(effectivePolicy);
}
