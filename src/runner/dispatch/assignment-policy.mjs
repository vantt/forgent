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

import { MODEL_POLICY_TIERS, RunnerConfigError } from './config.mjs';
import { resolvePolicyTierModel, deriveProviderFamily } from './resolve.mjs';
import { REPEAT_MODE_VALUES } from '../definitions/schema.mjs';

export const TIER_STRENGTH = Object.freeze({
  lightweight: 1,
  standard: 2,
  creative: 3,
  analytical: 4,
  critical: 5,
});

// Phase 04 (executor-policy-dispatch-seams) — canonical quality axes.
// `minRigor` is ordinal (raise-only applies here, nowhere else); `mode` is
// nominal (design.md §3.2/§4). These are separate from `TIER_STRENGTH`'s
// legacy 5-tier vocabulary above, which stays the compatibility key for the
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
// intentionally never selected by this resolver today.
export const QUALITY_TIER_BRIDGE = Object.freeze({
  lightweight: Object.freeze({ minRigor: 'low', mode: 'balanced' }),
  standard: Object.freeze({ minRigor: 'standard', mode: 'balanced' }),
  creative: Object.freeze({ minRigor: 'standard', mode: 'creative' }),
  analytical: Object.freeze({ minRigor: 'high', mode: 'analytical' }),
  critical: Object.freeze({ minRigor: 'critical', mode: 'analytical' }),
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

  // 3. Executor Preference Resolution
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
  // Attempted follow-up, reverted (Dispatch Core Contract Normalization):
  // falling back to a bare entry's own flat `.command` here (mirroring
  // resolve.mjs's real-spawn derivation) is architecturally correct, but
  // measured against the real test suite it broke 125 tests across
  // coordination/group-thinking -- most fixtures use a bare-shape non-Claude
  // test executor (a real script path, `process.execPath`, ...) with no
  // declared `providerModel`, relying on this exact silent-default-to-
  // 'claude' behavior, unrelated to what any of those tests actually probe.
  // Checked against the real `.fgos/config.json`: every currently-registered
  // production executor is either invocations[]-shaped (already correctly
  // derived above) or declares `providerModel` explicitly (`claude-bwrap`,
  // `codex-readonly`, ...) -- so live production dispatch was never exposed
  // to the gap this would have closed, and the cross-provider
  // `allowCrossProvider` gate in resolve.mjs's `resolveExecutorConfig`
  // still catches a real bare-shape cross-provider executor at actual
  // dispatch time regardless. Left as `warnIfProviderFamilyUnreliable`
  // already recommends: declare `providerModel` explicitly on a bare-shape
  // non-Claude executor, rather than widen this resolver's own derivation.
  const registeredExecutorCommand = registeredExecutorEntry?.invocations?.find((inv) => inv.via === 'cli')?.command;
  // Explicit providerModel override channel (additive -- undefined for
  // every pre-existing caller): lets a capability's own
  // `overrides.providerModel` (config.mjs's `CAPABILITY_OVERRIDE_FIELDS`)
  // retune which `modelPolicies` table this dispatch's tier resolves
  // against, independent of the executor's own declared `providerModel`.
  // Previously only `executeExecutorCli` (cli.mjs) read this field, via its
  // own separate inline tier/model computation that never reached this
  // resolver or its governance checks at all.
  const explicitProviderModel = cliOverride.providerModel ?? opPolicy.providerModel;
  const resolvedProvider = explicitProviderModel
    ? explicitProviderModel
    : registeredExecutorEntry
      ? deriveProviderFamily(registeredExecutorEntry, registeredExecutorCommand)
      : isImplicitDefaultExecutor
        ? deriveProviderFamily({ command: runnerConfig?.executor?.command }, primaryExecutor)
        : primaryExecutor;
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
    resolvedModel = resolvePolicyTierModel(runnerConfig, lookupPolicyTier, resolvedProvider);
    modelSource = { scope: 'runnerConfig', id: `${resolvedProvider}.${lookupPolicyTier}` };
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
    // Phase 04: additive quality/lookup-tier evidence alongside the legacy
    // `tier` field above (unchanged). `quality` and `lookupPolicyTier` are
    // new fields -- every pre-existing reader of `effectivePolicy.tier`
    // keeps seeing exactly what it saw before this phase.
    quality,
    lookupPolicyTier,
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
      persona: Object.freeze({ value: resolvedPersona, source: personaSource ? Object.freeze(personaSource) : undefined }),
      visibility: Object.freeze({ value: resolvedVisibility, source: Object.freeze(visibilitySource) }),
      repeatMode: Object.freeze({ value: resolvedRepeatMode ?? null, source: Object.freeze(repeatModeSource) }),
      constraints: Object.freeze({ value: constraints, source: Object.freeze(constraintsSource) }),
      governance: Object.freeze({ value: 'allowed', source: Object.freeze(governanceSource) }),
    }),
  };

  return Object.freeze(effectivePolicy);
}
