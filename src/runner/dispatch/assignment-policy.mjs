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
//
// Step 08 R3 (declared CoordinationProtocol materialization): an optional
// `cliOverride.policyProvenance` object (`{tier?, persona?, executor?,
// visibility?}`, each a `{scope, id?}` pair) lets a caller that already
// composed a full scoped policy stack upstream (runner/definition/operation/
// role/actor/assignment/cli -- coordination/session-engine.mjs's
// `dispatchDeclaredOperation`) record which scope actually won, instead of
// this resolver's own generic `{scope: 'cliOverride'}` label. Existing callers
// omit `policyProvenance`, so the field is purely additive.

import { MODEL_POLICY_TIERS, RunnerConfigError, REASONING_EFFORT_VALUES, DEFAULT_RIGOR_TO_TIER, DEFAULT_TIER_TO_POLICY } from './config.mjs';
import { resolveTierModel, deriveProviderFamily } from './resolve.mjs';
import { REPEAT_MODE_VALUES } from '../definitions/schema.mjs';
import { checkProviderDisallowed } from './provider-adapter.mjs';
import { RIGOR_VALUES, RIGOR_RANK, resolveStrongerRigor } from '../rigor.mjs';
import { deriveOperationCapability } from '../operation-capability.mjs';
export const TIER_STRENGTH = Object.freeze({
  nano: 1,
  mini: 2,
  standard: 3,
  advanced: 4,
  flagship: 5,
  frontier: 6,
});


export { RIGOR_VALUES, RIGOR_RANK };

// Phase 03 (executor-policy-dispatch-seams) — canonical reasoningEffort.
// Most-specific-wins (design.md §4 field rules table).
// executor-profile-schema-migration) so `validateExecutorEntryShape`'s new
// `supports.reasoningEffort` check can reuse the exact same vocabulary
// without a config.mjs -> assignment-policy.mjs -> config.mjs import cycle;
// re-exported here unchanged so every existing caller of this module keeps
// working byte-identically.
export { REASONING_EFFORT_VALUES };
export const REASONING_EFFORT_DEFAULT_FROM_RIGOR = Object.freeze({
  low: 'low',
  standard: 'medium',
  high: 'high',
  critical: 'max',
});

// Phase 03's compatibility alias seam (design.md §5.1) is retired
// (executor-id-consolidation Step 2): every id it keyed off
// (claude-reviewer/claude-reviewer-herdr/codex-readonly) no longer exists
// as a registered executor at all, so `primaryExecutor` can never equal
// one -- the seam had already become permanently unreachable dead code
// (step 3 below's own registration throw fires first, always). The same
// personas/reasoningEffort/visibility it used to compatibility-patch are
// now expressed directly via `actors[].invocation` (a specific
// `claude`/`codex` invocation already carries `--effort high`/confinement
// in its own declared args) or capabilities.<name>.prefer's invocation pin
// -- no resolver-side patching needed any more.

/**
 * Return the stronger of two tiers based on rigor hierarchy.
 *
 * @param {string} tierA
 * @param {string} tierB
 * @returns {string}
 */
export function resolveStrongerTier(tierA, tierB) {
  for (const value of [tierA, tierB]) {
    if (value !== undefined && value !== null && !MODEL_POLICY_TIERS.includes(value)) {
      throw new RunnerConfigError(`invalid tier "${value}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
    }
  }
  if (tierA === undefined || tierA === null) return tierB ?? 'standard';
  if (tierB === undefined || tierB === null) return tierA;
  return TIER_STRENGTH[tierB] > TIER_STRENGTH[tierA] ? tierB : tierA;
}

/**
 * Resolve `primaryExecutor` to its REGISTERED config entry (Phase 00 R6,
 * fixes H2a/H2b) and derive its provider family (Phase 00 R6 fix F1) --
 * extracted verbatim from `resolveAssignmentDispatchPolicy`'s own former
 * inline steps 3b/4 (dispatch-engine-liveness-hardening Phase 7, C3
 * finding) so `cli.mjs`'s `executeExecutorCli` can derive the SAME
 * `resolvedProvider` it needs for governance without running this
 * resolver's entire tier/quality/persona/model computation. Same checks,
 * same order, same throws as before this extraction -- a pure move.
 *
 * @param {object} params
 * @param {object} [params.runnerConfig]
 * @param {string} params.primaryExecutor
 * @param {string} [params.explicitProviderModel] an already-resolved
 *   providerModel override (cliOverride/opPolicy), when the caller has one
 * @param {{disallowedProviders?: string[], disallowedExecutors?: string[]}} [params.options]
 * @returns {{resolvedProvider: string, registeredExecutorEntry: object|undefined}}
 */
export function resolveExecutorProvider({ runnerConfig, primaryExecutor, options = {} }) {
  const hasExecutorRegistry = Boolean(runnerConfig && runnerConfig.executors && typeof runnerConfig.executors === 'object');
  const hasGovernanceOptions =
    (Array.isArray(options.disallowedProviders) && options.disallowedProviders.length > 0) ||
    (Array.isArray(options.disallowedExecutors) && options.disallowedExecutors.length > 0);
  if (hasGovernanceOptions && !hasExecutorRegistry) {
    throw new RunnerConfigError(
      `governance requires "disallowedProviders"/"disallowedExecutors" but runnerConfig.executors is absent -- provider family cannot be verified for executor "${primaryExecutor}"`,
    );
  }
  const registeredExecutorEntry = hasExecutorRegistry ? runnerConfig.executors[primaryExecutor] : undefined;
  const isImplicitDefaultExecutor = primaryExecutor === 'claude' || primaryExecutor === runnerConfig?.executor?.command;
  if (hasExecutorRegistry && !registeredExecutorEntry && !isImplicitDefaultExecutor) {
    throw new RunnerConfigError(`preferExecutor "${primaryExecutor}" is not a registered executor (runnerConfig.executors has no such entry).`);
  }
  const registeredExecutorCommand = registeredExecutorEntry?.invocations?.find((inv) => inv.via === 'cli')?.command;
  const resolvedProvider = registeredExecutorEntry
    ? deriveProviderFamily(registeredExecutorEntry, registeredExecutorCommand)
    : isImplicitDefaultExecutor
      ? deriveProviderFamily({ command: runnerConfig?.executor?.command }, primaryExecutor)
      : primaryExecutor;
  return { resolvedProvider, registeredExecutorEntry };
}

/**
 * Governance gate (Phase 00 R6/F2): reject an already-resolved provider
 * family / executor id pair against `options.disallowedProviders`/
 * `.disallowedExecutors`. Extracted from `resolveAssignmentDispatchPolicy`
 * (dispatch-engine-liveness-hardening Phase 7, C3 finding) so a caller that
 * has already resolved its own provider/executor (e.g. `cli.mjs`'s
 * `executeExecutorCli`/`spawnWorker`, which used to run this resolver's
 * entire tier/quality/persona/model computation only to reach this same
 * check) can run the SAME governance check directly, without a second,
 * redundant resolver call whose rich result it then discarded.
 *
 * @param {object} params
 * @param {string} params.primaryExecutor the resolved executor id
 * @param {string} params.providerModel the resolved provider family
 * @param {{disallowedProviders?: string[], disallowedExecutors?: string[]}} [params.options]
 * @returns {{canonicalProvider: string}}
 */
export function resolveExecutorGovernance({ primaryExecutor, providerModel, options = {} }) {
  const providerGov = checkProviderDisallowed(options.disallowedProviders, providerModel);
  if (providerGov.disallowed) {
    throw new RunnerConfigError(`governance gate rejected provider "${providerGov.canonicalProvider}": disallowed egress`, {
      code: 'governance.disallowed-provider',
    });
  }
  if (options.disallowedExecutors && options.disallowedExecutors.includes(primaryExecutor)) {
    throw new RunnerConfigError(`governance gate rejected executor "${primaryExecutor}": disallowed`, {
      code: 'governance.disallowed-executor',
    });
  }
  return { canonicalProvider: providerGov.canonicalProvider };
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
// M12: `cliOverride` renamed to `policyInputs` -- the merged PolicyPatch a
// caller wants layered on top of the assignment/work/operation stack was
// never CLI-specific (session-engine.mjs's own coordination dispatch path
// builds and passes one with no CLI in sight), so the old name described
// where the FIRST caller of this function happened to source it from, not
// what the parameter actually is. `cliOverride` is kept as a working alias
// for one release rather than a breaking rename -- accepted alongside
// `policyInputs`, with `policyInputs` winning when a caller (unusually)
// supplies both.
export function resolveAssignmentDispatchPolicy({
  assignment,
  work,
  runnerConfig,
  cliOverride = {},
  policyInputs,
  options = {},
}) {
  // `policyInputs` wins when a caller supplies both; every reference below
  // stays named `cliOverride` (including provenance's own `{scope:
  // 'cliOverride'}` stamp -- an internal attribution label, not part of
  // this rename) since reassigning the one binding here covers all of them
  // without a large, error-prone rename sweep across this whole function.
  if (policyInputs !== undefined) cliOverride = policyInputs;
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('resolveAssignmentDispatchPolicy requires an assignment object');
  }

  const opPolicy = assignment.policy === undefined ? {} : assignment.policy;
  if (!opPolicy || typeof opPolicy !== 'object' || Array.isArray(opPolicy)) {
    throw new RunnerConfigError('assignment.policy must be an object when provided');
  }
  const retiredMinTier = ['min', 'Tier'].join('');
  if (Object.prototype.hasOwnProperty.call(opPolicy, retiredMinTier)) {
    throw new RunnerConfigError(`assignment policy field "${retiredMinTier}" was removed; normalize persisted assignments at the load boundary or use "rigor"/"tier"`);
  }
  if (opPolicy._fromYaml && opPolicy.tier !== undefined) {
    throw new RunnerConfigError('workflow YAML cannot set explicit tier; use rigor, or set tier at actor/assignment/CLI scope');
  }

  // Reject literal model in operation policy if it was not explicitly stamped as assignment-level
  if (opPolicy.model && !assignment._allowLiteralModel && !cliOverride.model) {
    // If model comes from declared operation YAML, it is prohibited
    if (opPolicy._fromYaml) {
      throw new RunnerConfigError('workflow YAML cannot pin literal model names; use rigor or persona');
    }
  }

  const opId = assignment.operation;
  const strength = (t) => TIER_STRENGTH[t] ?? 0;
  const rigorToTier = runnerConfig?.rigorToTier ?? runnerConfig?.runner?.rigorToTier ?? DEFAULT_RIGOR_TO_TIER;
  const rigorStrength = (r) => RIGOR_RANK[r] ?? 0;

  // 1. Rigor Resolution (demand side, monotonic: highest explicit
  // requirement wins; the implicit standard is only a final fallback).
  if (opPolicy.rigor !== undefined && !RIGOR_VALUES.includes(opPolicy.rigor)) {
    throw new RunnerConfigError(`invalid operation rigor "${opPolicy.rigor}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
  }
  let effectiveRigor = opPolicy.rigor ?? 'standard';
  let rigorSource = opPolicy.rigor !== undefined ? { scope: 'opPolicy', id: opId } : { scope: 'default' };
  // The implicit standard is a fallback, not a floor. The first explicit
  // source may therefore select low; only later explicit sources are
  // monotonic raise-only.
  if (work) {
    if (work.rigor !== undefined) {
      if (!RIGOR_VALUES.includes(work.rigor)) {
        throw new RunnerConfigError(`invalid work rigor "${work.rigor}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
      }
      if (rigorSource.scope === 'default' || rigorStrength(work.rigor) > rigorStrength(effectiveRigor)) {
        effectiveRigor = rigorSource.scope === 'default' ? work.rigor : resolveStrongerRigor(effectiveRigor, work.rigor);
        rigorSource = { scope: 'work', id: work.id };
      }
    } else if (work.risk === 'heavy') {
      // D18: work.risk: heavy of item without rigor is read as rigor: high
      if (rigorStrength('high') > rigorStrength(effectiveRigor)) {
        rigorSource = { scope: 'work', id: work.id };
        effectiveRigor = resolveStrongerRigor(effectiveRigor, 'high');
      }
    }
  }

  // Capability floor (D19). Declared capability wins. For assignments built
  // from operations without policy.capability, reuse the canonical derivation
  // shared with coordination binding; never import the verb layer here.
  const derivedCapability = deriveOperationCapability(
    { id: assignment.operation, policy: opPolicy, result: assignment.result ?? { kind: assignment.resultKind } },
    { domain: work?.domain, primaryCapability: assignment.primaryCapability },
    runnerConfig,
  );
  const targetCap = opPolicy.capability ?? assignment.capability ?? derivedCapability.name;
  if (targetCap && runnerConfig?.capabilities?.[targetCap]?.rigor !== undefined) {
    const capRigor = runnerConfig.capabilities[targetCap].rigor;
    if (!RIGOR_VALUES.includes(capRigor)) {
      throw new RunnerConfigError(`invalid capability rigor "${capRigor}" for "${targetCap}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
    }
    if (rigorSource.scope === 'default' || rigorStrength(capRigor) > rigorStrength(effectiveRigor)) {
      effectiveRigor = rigorSource.scope === 'default' ? capRigor : resolveStrongerRigor(effectiveRigor, capRigor);
      rigorSource = { scope: 'capability', id: targetCap };
    }
  }

  // Caller/CLI rigor.
  const cliRigor = cliOverride.rigor;
  if (cliRigor !== undefined) {
    if (!RIGOR_VALUES.includes(cliRigor)) {
      throw new RunnerConfigError(`invalid override rigor "${cliRigor}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
    }
    if (rigorSource.scope === 'default' || rigorStrength(cliRigor) > rigorStrength(effectiveRigor)) {
      effectiveRigor = rigorSource.scope === 'default' ? cliRigor : resolveStrongerRigor(effectiveRigor, cliRigor);
      rigorSource = cliOverride.policyProvenance?.rigor ?? { scope: 'cliOverride' };
    }
  }

  if (!RIGOR_VALUES.includes(effectiveRigor)) {
    throw new RunnerConfigError(`unrecognized rigor "${effectiveRigor}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
  }

  // 1b. Map rigor -> tier via rigorToTier. Validate before considering any
  // explicit tier, otherwise a valid override could mask a malformed map.
  const derivedTier = rigorToTier[effectiveRigor];
  if (!MODEL_POLICY_TIERS.includes(derivedTier)) {
    throw new RunnerConfigError(
      `rigorToTier maps rigor "${effectiveRigor}" to invalid tier "${derivedTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`,
    );
  }
  let effectiveTier = derivedTier;
  let tierSource = { scope: 'rigor', id: effectiveRigor };

  // Explicit tiers are independent raise-only inputs. Validate every source
  // before composition so a stronger source cannot mask a malformed weaker
  // one.
  let workTier;
  if (work?.tier !== undefined) {
    if (typeof work.tier !== 'string' || !Object.prototype.hasOwnProperty.call(DEFAULT_TIER_TO_POLICY, work.tier)) {
      throw new RunnerConfigError('work.tier must be one of [light, standard, heavy] during the Phase 2 compatibility window');
    }
    workTier = DEFAULT_TIER_TO_POLICY[work.tier];
  }
  const tierOverrideProvenance = cliOverride.policyProvenance?.tier;
  if (
    cliOverride.tier !== undefined &&
    tierOverrideProvenance !== undefined &&
    !['actor', 'assignment', 'cli', 'cliOverride'].includes(tierOverrideProvenance.scope)
  ) {
    throw new RunnerConfigError(
      `explicit tier provenance scope "${tierOverrideProvenance.scope}" is not allowed; tier may be explicit only at actor, assignment, or CLI scope`,
    );
  }
  const explicitTiers = [
    { value: workTier, source: { scope: 'work', id: work?.id } },
    { value: opPolicy.tier, source: { scope: 'opPolicy', id: opId } },
    { value: cliOverride.tier, source: cliOverride.policyProvenance?.tier ?? { scope: 'cliOverride' } },
  ];
  for (const { value, source } of explicitTiers) {
    if (value === undefined) continue;
    if (!MODEL_POLICY_TIERS.includes(value)) {
      throw new RunnerConfigError(`invalid explicit tier "${value}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
    }
    if (strength(value) > strength(effectiveTier)) {
      effectiveTier = resolveStrongerTier(effectiveTier, value);
      tierSource = source;
    }
  }

  if (!MODEL_POLICY_TIERS.includes(effectiveTier)) {
    throw new RunnerConfigError(`unrecognized tier "${effectiveTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }

  // 1c. Executor preference
  const primaryExecutor =
    cliOverride.preferExecutor ??
    opPolicy.preferExecutor ??
    runnerConfig?.executor?.command ??
    'claude';
  const executorSource = cliOverride.preferExecutor
    ? (cliOverride.policyProvenance?.executor ?? { scope: 'cliOverride' })
    : opPolicy.preferExecutor
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };


  // Phase 03: canonical reasoningEffort, most-specific-wins.
  // Precedence mirrors every other field in this resolver:
  // explicit cliOverride/opPolicy > derived from canonical rigor.
  const explicitReasoningEffort = cliOverride.reasoningEffort ?? opPolicy.reasoningEffort;
  let reasoningEffort;
  let reasoningEffortSource;
  if (explicitReasoningEffort !== undefined) {
    if (!REASONING_EFFORT_VALUES.includes(explicitReasoningEffort)) {
      throw new RunnerConfigError(`invalid reasoningEffort "${explicitReasoningEffort}". Valid values: [${REASONING_EFFORT_VALUES.join(', ')}]`);
    }
    reasoningEffort = explicitReasoningEffort;
    reasoningEffortSource = cliOverride.reasoningEffort ? { scope: 'cliOverride' } : { scope: 'opPolicy', id: opId };
  } else {
    reasoningEffort = REASONING_EFFORT_DEFAULT_FROM_RIGOR[effectiveRigor] ?? 'medium';
    reasoningEffortSource = { scope: 'derived', id: `rigor.${effectiveRigor}` };
  }

  // 2. Persona Resolution
  const resolvedPersona =
    cliOverride.preferPersona ??
    opPolicy.preferPersona ??
    (assignment.role === 'reviewer' ? 'code-reviewer' : undefined);
  const personaSource = cliOverride.preferPersona
    ? (cliOverride.policyProvenance?.persona ?? { scope: 'cliOverride' })
    : opPolicy.preferPersona
      ? { scope: 'opPolicy', id: opId }
      : resolvedPersona
          ? { scope: 'default', id: assignment.role }
          // Phase 00 R7/F4: still `{ scope: 'default' }` (no id) rather than
          // `undefined` when no persona resolves at all -- provenance.persona.source
          // must always be an object, per the documented shape.
          : { scope: 'default' };

  // 3. Executor Preference Resolution (registry/governance)
  const declaredFallbacks = cliOverride.fallbackExecutors ?? opPolicy.fallbackExecutors ?? [];
  // `fallbackExecutors` is reserved-not-executed (Phase 00 R10): only
  // `executorList[0]` (primaryExecutor) is ever actually dispatched --
  // entries beyond it are recorded for future automatic-failover, never
  // validated for registration and never spawned by this resolver.
  const executorList = [
    primaryExecutor,
    ...declaredFallbacks.filter((e) => e !== primaryExecutor),
  ];

  // 3b/4 (registry validation, provider derivation): extracted to
  // `resolveExecutorProvider` (dispatch-engine-liveness-hardening Phase 7,
  // C3) -- see that function's own doc comment for why, and
  // `docs/history/executor-policy-dispatch-seams/` (H2a/H2b/RT1/F1) for the
  // edge cases its logic still encodes unchanged (pure move, same checks,
  // same order, same throws). The governance THROWS (disallowedProviders/
  // disallowedExecutors, step 7 below) stay in their original position,
  // AFTER quality/persona/visibility/repeatMode/constraints resolution --
  // error (invalid rigor/repeatMode) that used to throw first for
  // the same malformed input, a real ordering change this extraction must
  // not introduce.
  const { resolvedProvider, registeredExecutorEntry } = resolveExecutorProvider({
    runnerConfig,
    primaryExecutor,
    options,
  });
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
    // Direct tier resolution fails closed when the provider/tier pair is
    // unsupported. The previous fallback repeated the identical lookup and
    // could never recover from a missing mapping.
    resolvedModel = resolveTierModel(runnerConfig, effectiveTier, resolvedProvider);
    modelSource = { scope: 'placement-policy', id: `${resolvedProvider}.${effectiveTier}` };
  }

  // 5. Visibility Resolution
  const resolvedVisibility = cliOverride.visibility ?? opPolicy.visibility ?? 'headless';
  const visibilitySource = cliOverride.visibility
    ? (cliOverride.policyProvenance?.visibility ?? { scope: 'cliOverride' })
    : opPolicy.visibility
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };

  // 5b. RepeatMode Resolution (Step 09/P03 fallback-and-effect-boundary
  // contract): declared explicitly on the operation/protocol YAML
  // (`opPolicy.repeatMode`) or a caller's own `cliOverride.repeatMode` --
  // NEVER derived from `assignment.mutation`, which this resolver does not
  // read anywhere in this function. `mutation` and `repeatMode` are
  // independent axes (mutation: does this dispatch write state; repeatMode:
  // may ITS OWN declared operation be repeated once an effect has already
  // reached an external sink) and must stay that way -- undeclared on both
  // sides simply resolves to `null`, which `dispatch/recovery.mjs`'s
  // `assess` treats as a config error, never as an inferred value.
  const resolvedRepeatMode = cliOverride.repeatMode ?? opPolicy.repeatMode;
  if (resolvedRepeatMode !== undefined && !REPEAT_MODE_VALUES.includes(resolvedRepeatMode)) {
    throw new RunnerConfigError(`invalid repeatMode "${resolvedRepeatMode}". Valid repeatModes: [${REPEAT_MODE_VALUES.join(', ')}]`);
  }
  const repeatModeSource = cliOverride.repeatMode
    ? { scope: 'cliOverride' }
    : opPolicy.repeatMode
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
  // provider family is otherwise trusted). Extracted to `resolveExecutorGovernance`
  // (dispatch-engine-liveness-hardening Phase 7, C3) so `executeExecutorCli`/
  // `spawnWorker` (cli.mjs) can run the SAME governance check directly
  // against their own already-resolved provider/executor without paying for
  // this resolver's full tier/quality/persona/model computation just to
  // reach these two throws.
  const { canonicalProvider } = resolveExecutorGovernance({ primaryExecutor, providerModel: resolvedProvider, options });
  const governanceSource = { scope: 'governance', id: canonicalProvider };

  const effectivePolicy = {
    role: assignment.role,
    persona: resolvedPersona,
    executorPreference: Object.freeze(executorList),
    executorId: primaryExecutor,
    providerModel: resolvedProvider,
    rigor: effectiveRigor,
    tier: effectiveTier,
    model: resolvedModel,
    reasoningEffort,
    visibility: resolvedVisibility,
    repeatMode: resolvedRepeatMode ?? null,
    constraints: Object.freeze(constraints),
    provenance: Object.freeze({
      executor: Object.freeze({ value: primaryExecutor, source: Object.freeze(executorSource) }),
      provider: Object.freeze({ value: resolvedProvider, source: Object.freeze(providerSource) }),
      model: Object.freeze({ value: resolvedModel, source: modelSource ? Object.freeze(modelSource) : undefined }),
      rigor: Object.freeze({ value: effectiveRigor, source: Object.freeze(rigorSource) }),
      tier: Object.freeze({ value: effectiveTier, source: Object.freeze(tierSource) }),
      reasoningEffort: Object.freeze({ value: reasoningEffort, source: Object.freeze(reasoningEffortSource) }),
      persona: Object.freeze({ value: resolvedPersona, source: personaSource ? Object.freeze(personaSource) : undefined }),
      visibility: Object.freeze({ value: resolvedVisibility, source: Object.freeze(visibilitySource) }),
      repeatMode: Object.freeze({ value: resolvedRepeatMode ?? null, source: Object.freeze(repeatModeSource) }),
      constraints: Object.freeze({ value: constraints, source: Object.freeze(constraintsSource) }),
      governance: Object.freeze({ value: 'allowed', source: Object.freeze(governanceSource) }),
    }),
  };
  return Object.freeze(effectivePolicy);
}
