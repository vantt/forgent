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
// this resolver's own generic `{scope: 'cliOverride'}` label. Purely
// additive: `policyProvenance` is undefined for every pre-existing caller,
// so their persisted provenance is byte-identical to before this field was
// added.

import { MODEL_POLICY_TIERS, RunnerConfigError, REASONING_EFFORT_VALUES } from './config.mjs';
import { resolvePolicyTierModel, deriveProviderFamily } from './resolve.mjs';
import { REPEAT_MODE_VALUES } from '../definitions/schema.mjs';
import { checkProviderDisallowed } from './provider-adapter.mjs';

export const TIER_STRENGTH = Object.freeze({
  nano: 1,
  mini: 2,
  standard: 3,
  advanced: 4,
  flagship: 5,
  frontier: 6,
});

// Phase 04 (executor-policy-dispatch-seams) — canonical quality axes.
// `minRigor` is ordinal (raise-only applies here, nowhere else); `mode` is
// nominal (design.md §3.2/§4). These are separate from `TIER_STRENGTH`'s
// legacy 6-tier vocabulary above, which stays the compatibility key for the
// live `modelPolicies` catalog until PlacementPolicy/model calibration has
// enough shadow proof to re-key safely (design.md §5.1/§8, phase-04.md
// "Catalog decision").
export const MIN_RIGOR_VALUES = Object.freeze(['low', 'standard', 'high', 'critical']);
const MIN_RIGOR_RANK = new Map(MIN_RIGOR_VALUES.map((rigor, index) => [rigor, index]));

export const QUALITY_MODE_VALUES = Object.freeze(['balanced', 'creative', 'analytical', 'adversarial']);

// Legacy tier -> canonical quality bridge (phase-04-quality-bridge.md
// "Legacy bridge" table). Bridge mode sourceKind is always
// `implied-by-tier-bridge` — the weakest of the three sourceKinds in the
// `explicit > implied-by-persona > implied-by-tier-bridge` precedence
// (design.md §3.2). `implied-by-persona` has no producer yet (persona ->
// mode is a later-phase PromptEnvelope/persona-registry concern) and is
// intentionally never selected by this resolver today. `mini` bridges to
// the same `{minRigor: 'low', mode: 'balanced'}` as `nano` — `MIN_RIGOR_VALUES`
// only has 4 discrete rungs (low/standard/high/critical) for 6 model tiers,
// and `mini` sits closer to `nano` (small/cheap model class) than to
// `standard` on every provider's own mapping (design.md's provider table).
// Every one of the 6 `MODEL_POLICY_TIERS` MUST resolve here: `resolveAssignmentDispatchPolicy`
// reads `derivedQuality.mode`/`derivedQuality.minRigor` unconditionally below,
// so a missing key here would throw a raw TypeError instead of a clean
// RunnerConfigError.
export const QUALITY_TIER_BRIDGE = Object.freeze({
  nano: Object.freeze({ minRigor: 'low', mode: 'balanced' }),
  mini: Object.freeze({ minRigor: 'low', mode: 'balanced' }),
  standard: Object.freeze({ minRigor: 'standard', mode: 'balanced' }),
  advanced: Object.freeze({ minRigor: 'standard', mode: 'creative' }),
  flagship: Object.freeze({ minRigor: 'high', mode: 'analytical' }),
  frontier: Object.freeze({ minRigor: 'critical', mode: 'analytical' }),
});

// Phase 03 (executor-policy-dispatch-seams) — canonical reasoningEffort
// (design.md §3.3). Most-specific-wins, unlike minRigor's raise-only rule
// (design.md §4 field rules table). Definition moved to config.mjs (Phase C,
// executor-profile-schema-migration) so `validateExecutorEntryShape`'s new
// `supports.reasoningEffort` check can reuse the exact same vocabulary
// without a config.mjs -> assignment-policy.mjs -> config.mjs import cycle;
// re-exported here unchanged so every existing caller of this module keeps
// working byte-identically.
export { REASONING_EFFORT_VALUES };
const REASONING_EFFORT_DEFAULT_FROM_MIN_RIGOR = Object.freeze({
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
  if (!tierA && !tierB) return 'standard';
  if (!tierA) return tierB;
  if (!tierB) return tierA;

  const strengthA = TIER_STRENGTH[tierA] ?? 0;
  const strengthB = TIER_STRENGTH[tierB] ?? 0;

  if (strengthA === 0 && strengthB === 0) return tierA;
  return strengthB > strengthA ? tierB : tierA;
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
export function resolveExecutorProvider({ runnerConfig, primaryExecutor, explicitProviderModel, options = {} }) {
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
  const resolvedProvider = explicitProviderModel
    ? explicitProviderModel
    : registeredExecutorEntry
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
      // High-risk work raises floor to at least standard or flagship
      if (strength('flagship') > strength(effectiveTier)) tierSource = { scope: 'work', id: work.id };
      effectiveTier = resolveStrongerTier(effectiveTier, 'flagship');
    }
  }

  // CLI override tier
  const cliTier = cliOverride.tier || cliOverride.minTier;
  if (cliTier) {
    if (!MODEL_POLICY_TIERS.includes(cliTier)) {
      throw new RunnerConfigError(`invalid override tier "${cliTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
    }
    // Step 08 R3: a caller that has already composed a full scoped policy
    // stack (runner/definition/operation/role/actor/assignment/cli, e.g. a
    // declared CoordinationProtocol materialization) may name the ACTUAL
    // winning scope via `cliOverride.policyProvenance.tier` instead of the
    // generic `{scope: 'cliOverride'}` this resolver would otherwise stamp
    // for every value it receives through this one channel -- additive only:
    // `policyProvenance` is undefined for every pre-existing caller, so this
    // is a value-preserving no-op unless a caller opts in.
    if (strength(cliTier) > strength(effectiveTier)) tierSource = cliOverride.policyProvenance?.tier ?? { scope: 'cliOverride' };
    effectiveTier = resolveStrongerTier(effectiveTier, cliTier);
  }

  if (!MODEL_POLICY_TIERS.includes(effectiveTier)) {
    throw new RunnerConfigError(`unrecognized tier "${effectiveTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }

  // 1a. Executor preference (hoisted ahead of quality/persona resolution,
  // Phase 03).
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

  // 1b. Quality bridge (Phase 04, executor-policy-dispatch-seams).
  //
  // `effectiveTier` above is the semantic tier: raise-only composed, exactly
  // as before this phase, never touched by rigorOverrides. It is the ONLY
  // input the canonical quality bridge derives from (phase-04.md step 2:
  // "Derive quality.minRigor from semanticTier; never derive it from
  // executor/capability rigorOverrides").
  const semanticTier = effectiveTier;
  const derivedQuality = QUALITY_TIER_BRIDGE[semanticTier];

  // `rigorOverrides` (an executor/capability's own model-calibration map,
  // keyed by this resolver's own policy-tier vocabulary) may retarget ONLY
  // the legacy `modelPolicies` lookup key -- never semanticTier, never
  // minRigor (phase-04.md step 3 / design.md §5.3 "creative-column trap").
  const rigorOverrides = cliOverride.rigorOverrides ?? opPolicy.rigorOverrides;
  const overriddenPolicyTier = rigorOverrides ? rigorOverrides[semanticTier] : undefined;
  if (overriddenPolicyTier !== undefined && !MODEL_POLICY_TIERS.includes(overriddenPolicyTier)) {
    throw new RunnerConfigError(`rigorOverrides["${semanticTier}"] = "${overriddenPolicyTier}" is not a recognized policy tier. Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  const lookupPolicyTier = overriddenPolicyTier ?? semanticTier;
  const lookupPolicyTierSource = overriddenPolicyTier !== undefined
    ? { scope: 'executor', kind: 'calibration' }
    : { ...tierSource, kind: 'semantic' };

  // Mode source precedence: explicit > implied-by-persona >
  // implied-by-tier-bridge (design.md §3.2). `implied-by-persona` has no
  // producer yet -- see the QUALITY_TIER_BRIDGE comment above.
  const explicitMode = cliOverride.mode ?? opPolicy.mode;
  let mode;
  let modeSourceKind;
  let modeSource;
  if (explicitMode !== undefined) {
    if (!QUALITY_MODE_VALUES.includes(explicitMode)) {
      throw new RunnerConfigError(`invalid mode "${explicitMode}". Valid modes: [${QUALITY_MODE_VALUES.join(', ')}]`);
    }
    mode = explicitMode;
    modeSourceKind = 'explicit';
    modeSource = cliOverride.mode ? { scope: 'cliOverride' } : { scope: 'opPolicy', id: opId };
  } else {
    mode = derivedQuality.mode;
    modeSourceKind = 'implied-by-tier-bridge';
    modeSource = { scope: 'tier-bridge', id: semanticTier };
  }

  // `minRigor` is derived/read-only this phase (phase-04.md "Resolver
  // rule"): an explicit value no stronger than the derived one is accepted
  // as a compatibility assertion, but the effective value stays the derived
  // one -- there is no independent raise (or lower) channel for it yet. A
  // stronger explicit value is rejected outright rather than silently
  // ignored, so a caller asking for more rigor than the semantic tier
  // provides finds out immediately instead of silently under-provisioning.
  const explicitMinRigor = cliOverride.minRigor ?? opPolicy.minRigor;
  if (explicitMinRigor !== undefined) {
    if (!MIN_RIGOR_VALUES.includes(explicitMinRigor)) {
      throw new RunnerConfigError(`invalid minRigor "${explicitMinRigor}". Valid values: [${MIN_RIGOR_VALUES.join(', ')}]`);
    }
    if (MIN_RIGOR_RANK.get(explicitMinRigor) > MIN_RIGOR_RANK.get(derivedQuality.minRigor)) {
      throw new RunnerConfigError(`explicit minRigor "${explicitMinRigor}" is stronger than the semantic-tier-derived value "${derivedQuality.minRigor}" (tier "${semanticTier}") -- minRigor is derived/read-only in this phase, not an independent raise channel.`);
    }
  }
  const minRigor = derivedQuality.minRigor;
  const minRigorSource = { scope: 'derived', id: semanticTier };

  const quality = Object.freeze({
    minRigor: Object.freeze({ value: minRigor, source: Object.freeze(minRigorSource) }),
    mode: Object.freeze({ value: mode, source: Object.freeze(modeSource), sourceKind: modeSourceKind }),
  });

  // Phase 03: canonical reasoningEffort, most-specific-wins (never raise-only
  // like minRigor -- design.md §4). Precedence mirrors every other field in
  // this resolver: explicit cliOverride/opPolicy > alias-supplied compat
  // default > derived from canonical minRigor.
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
    reasoningEffort = REASONING_EFFORT_DEFAULT_FROM_MIN_RIGOR[minRigor];
    reasoningEffortSource = { scope: 'derived', id: `quality.minRigor.${minRigor}` };
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
  // moving them here would fire a governance rejection before a validation
  // error (invalid mode/minRigor/repeatMode) that used to throw first for
  // the same malformed input, a real ordering change this extraction must
  // not introduce.
  const explicitProviderModel = cliOverride.providerModel ?? opPolicy.providerModel;
  const { resolvedProvider, registeredExecutorEntry } = resolveExecutorProvider({
    runnerConfig,
    primaryExecutor,
    explicitProviderModel,
    options,
  });
  const providerSource = explicitProviderModel
    ? (cliOverride.providerModel ? { scope: 'cliOverride' } : { scope: 'opPolicy', id: opId })
    : registeredExecutorEntry
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
    // unsupported -- never swallowed into a silent `null` model. Resolves
    // against `lookupPolicyTier`, not `effectiveTier` directly (Phase 04):
    // value-preserving for every caller that never supplies
    // `rigorOverrides`, since `lookupPolicyTier === effectiveTier` then.
    // dispatch-engine-liveness-hardening Phase 7: `resolveVerifiedAssignmentModel`
    // retired -- it called this exact same `resolvePolicyTierModel` with the
    // exact same (lookupPolicyTier, resolvedProvider) inputs, so its own
    // "legacy" fallback branch was unreachable (a second call with identical
    // args either produces the same value or throws exactly as this first
    // call already would have). Kept as one call; `source` is always
    // PlacementPolicy-attributed since PlacementPolicy target semantics IS
    // this resolution path per design.md's close criterion (post-Phase-08
    // follow-up comment, now realized in full).
    resolvedModel = resolvePolicyTierModel(runnerConfig, lookupPolicyTier, resolvedProvider);
    modelSource = { scope: 'placement-policy', id: `${resolvedProvider}.${lookupPolicyTier}` };
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
    tier: effectiveTier,
    model: resolvedModel,
    // Phase 04: additive quality/lookup-tier evidence alongside the legacy
    // `tier` field above (unchanged). `quality` and `lookupPolicyTier` are
    // new fields -- every pre-existing reader of `effectivePolicy.tier`
    // keeps seeing exactly what it saw before this phase.
    quality,
    lookupPolicyTier,
    // Phase 03: canonical reasoningEffort, additive alongside quality/tier.
    reasoningEffort,
    visibility: resolvedVisibility,
    repeatMode: resolvedRepeatMode ?? null,
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
      // Phase 04: `semanticTier` is a named alias of `tier` above (same
      // value, same source) -- kept as its own provenance key so a stranger
      // can name "the semantic tier canonical quality derives from"
      // without relying on the legacy `tier` field's dual meaning.
      semanticTier: Object.freeze({ value: semanticTier, source: Object.freeze(tierSource) }),
      quality,
      lookupPolicyTier: Object.freeze({ value: lookupPolicyTier, source: Object.freeze(lookupPolicyTierSource) }),
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
