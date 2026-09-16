// dispatch/placement-policy.mjs — PlacementPolicy shadow resolver
// (Phase 05, plans/260915-executor-policy-dispatch-seams/).
//
// SHADOW MODE ONLY (design.md §3.6, phase-05-placement-policy-shadow.md):
// computes what the target PlacementPolicy architecture would choose for
// provider/model/executor ranking, reframed through its own target
// vocabulary, and compares it against the caller's ALREADY-PRODUCED legacy
// binding. Never changes production binding; this module has no caller in
// the real dispatch path yet. Never selects a provider ACCOUNT -- Provider
// Capacity Rotator (plans/260916-account-rotator/) owns account inventory,
// leases, quarantine, and credential provisioning; this module only
// consumes its structured capacity refusal as a fallback-analysis input.
//
// Required separation (phase-05 "Required separation"):
//   BusinessCasePreset      -> semantic defaults only (not this module)
//   Capability registry     -> capability description/hard compatibility only
//   PlacementPolicy (here)  -> provider/model/executor ranking
//   Provider/model catalog  -> modelPolicies.<provider>.<policyTier> calibration
//   Provider Capacity Rotator -> account inventory/leases/quarantine/credentials
//
// This phase deliberately reads the SAME legacy capabilities.<name>.prefer/
// overrides config every production dispatch path already reads (D2,
// config.mjs's CAPABILITY_OVERRIDE_FIELDS) -- it does not invent a second,
// independently-authored placement data source (that would itself become
// "a fourth hidden placement source", the exact failure mode the track's
// close criteria forbid). What is new is the MODULE BOUNDARY and target
// vocabulary this reads that config INTO, proving the target shape can
// represent current behavior before any config migration (a Phase 07/08
// concern, out of scope here).

import crypto from 'node:crypto';
import { DEFAULT_TIER_TO_POLICY, MODEL_POLICY_TIERS, RunnerConfigError } from './config.mjs';
import { resolvePolicyTierModel, deriveProviderFamily, resolveExecutorAndOverrides } from './resolve.mjs';

export const PLACEMENT_POLICY_SHADOW_CONTRACT = 'placement-policy-shadow.v1';

// Same formula as plan.mjs's policyTierForDispatchTier / cli.mjs's inline
// duplicate (resolve.mjs's modelForTier already documents the pre-existing
// third copy) -- reused here, not re-derived independently, so this
// module's `lookupPolicyTier` agrees with what the real capability-override
// dispatch path (cli.mjs's spawnWorker/executeExecutorCli) actually
// computes for the SAME work tier + rigorOverrides. Unifying these three
// copies into one shared helper is real, named debt (AGENTS.md's RUL11
// "gom lại" principle applies) but is out of this phase's scope: it would
// touch the two live production call sites, not just this new shadow one.
function policyTierForWorkTier(workTier, rigorOverrides) {
  const tier = workTier ?? 'standard';
  return rigorOverrides?.[tier] ?? DEFAULT_TIER_TO_POLICY[tier] ?? (MODEL_POLICY_TIERS.includes(tier) ? tier : undefined);
}

function candidateInvocation(executorEntry) {
  const cliInvocation = Array.isArray(executorEntry?.invocations) ? executorEntry.invocations.find((inv) => inv.via === 'cli') : undefined;
  const adapter = executorEntry?.adapter ?? cliInvocation?.adapter;
  if (adapter === 'herdr-spawn') return 'visible';
  if (executorEntry?.confinement?.backend === 'bwrap') return 'bwrap';
  return 'headless';
}

/**
 * Build the target-shaped PlacementPolicy candidate for one capability or
 * executor id, from the live registered executor/capability config. Returns
 * `null` when the capability/executor id is not configured at all (mirrors
 * `resolveExecutorAndOverrides`'s own `configured: false` case) -- never
 * throws for an unconfigured id, only for one that IS configured but whose
 * model/tier cannot resolve.
 *
 * @param {object} cfg
 * @param {string} capabilityId capability name or bare executor id
 * @param {string} [workTier] light|standard|heavy (D9's work-size vocabulary)
 * @returns {{executorId: string, provider: string, model: string, lookupPolicyTier: string, invocation: string, reasonCodes: string[]}|null}
 */
export function buildPlacementPolicyCandidate({ cfg, capabilityId, workTier }) {
  const resolved = resolveExecutorAndOverrides(cfg, capabilityId);
  if (!resolved.configured) return null;
  const { executorId, executor, overrides, bindingSource } = resolved;

  // `resolveExecutorAndOverrides` only ever populates `overrides` for a
  // CAPABILITY-prefer binding (`capabilities.<name>.overrides`) -- a bare
  // executor id resolved directly (bindingSource: 'executor-id', e.g.
  // `agy-cli` dispatched by its own id, Phase 00's own baseline snapshot
  // proof case) returns `overrides: undefined` unconditionally, even though
  // that executor may declare its OWN top-level `rigorOverrides`/
  // `providerModel`/`model` fields (cli.mjs's spawnWorker/executeExecutorCli
  // already read both sources with capability winning: `capabilityOverrides
  // ?? executor`). Missing this second source here would silently pick a
  // DIFFERENT model than the real legacy path for any bare-executor-id
  // capability -- exactly the executor?.rigorOverrides case.
  const rigorOverrides = overrides?.rigorOverrides ?? executor?.rigorOverrides;
  const providerModel = overrides?.providerModel ?? executor?.providerModel;
  const literalModel = overrides?.model ?? executor?.model;

  // A registered entry's real command lives under invocations[].command
  // (the via:"cli" entry) for every currently-registered invocations[]-
  // shaped executor -- assignment-policy.mjs's own resolver already had to
  // fix this exact gap (its "Phase 00 R6, fixes H2a/H2b" comment): falling
  // back to the executor's own flat `.command` alone silently derives the
  // WRONG provider family for any invocations[]-shaped entry with no flat
  // command of its own (e.g. claude-reviewer).
  const registeredExecutorCommand = executor?.invocations?.find((inv) => inv.via === 'cli')?.command;
  const provider = providerModel || deriveProviderFamily(executor, registeredExecutorCommand ?? executor?.command ?? executorId);

  const lookupPolicyTier = policyTierForWorkTier(workTier, rigorOverrides);
  if (!lookupPolicyTier) {
    throw new RunnerConfigError(`placement-policy shadow: cannot derive a policy tier for work tier "${workTier}" (capability/executor "${capabilityId}")`);
  }

  const model = literalModel ?? resolvePolicyTierModel(cfg, lookupPolicyTier, provider);

  return {
    executorId,
    provider,
    model,
    lookupPolicyTier,
    invocation: candidateInvocation(executor),
    reasonCodes: Object.freeze([
      bindingSource === 'capability.prefer' ? 'capabilities.prefer' : bindingSource === 'capability.for' ? 'capabilities.for' : 'executor-id',
      ...(overrides?.rigorOverrides ? ['calibration.rigorOverrides'] : executor?.rigorOverrides ? ['calibration.executor.rigorOverrides'] : []),
      ...(overrides?.providerModel ? ['calibration.providerModel'] : executor?.providerModel ? ['calibration.executor.providerModel'] : []),
      ...(overrides?.model ? ['calibration.model'] : executor?.model ? ['calibration.executor.model'] : []),
    ]),
  };
}

/**
 * Re-admit one fallback candidate executor id against the same governance
 * axes design.md §3.6's "Fallback admission" names: disallowed providers,
 * required runtime class (must resolve to a real registered executor with a
 * real invocation), confinement (carried structurally by `invocation`
 * already), and disallowed-executor id. A candidate that fails ANY of these
 * is skipped with a reason code -- never silently downgraded to a weaker
 * runtime/confinement class.
 */
function admitFallbackCandidate({ cfg, executorId, workTier, options }) {
  if (options?.disallowedExecutors?.includes(executorId)) {
    return { skipped: true, executorId, reasonCode: 'governance.disallowed-executor' };
  }
  let candidate;
  try {
    candidate = buildPlacementPolicyCandidate({ cfg, capabilityId: executorId, workTier });
  } catch {
    return { skipped: true, executorId, reasonCode: 'unresolvable-runtime-class' };
  }
  if (!candidate) {
    return { skipped: true, executorId, reasonCode: 'unresolvable-runtime-class' };
  }
  if (options?.disallowedProviders?.includes(candidate.provider)) {
    return { skipped: true, executorId, reasonCode: 'governance.disallowed-provider' };
  }
  return { skipped: false, candidate };
}

/**
 * Full shadow evaluation: legacy binding (caller-supplied, this module
 * never re-derives it independently -- see module header) vs. the
 * PlacementPolicy candidate this module computes from the same config,
 * plus a provider-capacity-refusal-driven fallback candidate list.
 *
 * @param {object} params
 * @param {object} params.cfg
 * @param {string} params.capabilityId
 * @param {string} [params.workTier]
 * @param {{executorId: string, provider: string, model: string}} [params.legacy]
 *   The real production resolution already produced by the caller, for
 *   divergence comparison. `null`/omitted when the caller has none to
 *   compare against (e.g. an unconfigured capability).
 * @param {{status: 'refused', reason?: string}} [params.providerCapacityRefusal]
 *   A structured refusal from Provider Capacity Rotator's
 *   `acquireProviderAccountLease`. This module treats it as an opaque input
 *   signal only -- it never selects, inspects, or reasons about accounts.
 * @param {string[]} [params.declaredFallbackExecutorIds]
 *   The assignment/policy's own reserved-not-executed fallback list
 *   (assignment-policy.mjs's `executorPreference.slice(1)` /
 *   `fallbackExecutors`) -- this module does not invent a new
 *   capability-level fallback field; capabilities have none today.
 * @param {{disallowedProviders?: string[], disallowedExecutors?: string[]}} [params.options]
 */
export function evaluatePlacementPolicyShadow({
  cfg,
  capabilityId,
  workTier,
  legacy = null,
  providerCapacityRefusal = null,
  declaredFallbackExecutorIds = [],
  options = {},
}) {
  const candidate = buildPlacementPolicyCandidate({ cfg, capabilityId, workTier });
  const candidates = candidate ? [candidate] : [];

  const divergence = [];
  if (legacy && candidate) {
    for (const field of ['executorId', 'provider', 'model']) {
      if (legacy[field] !== candidate[field]) {
        divergence.push({ field, legacy: legacy[field] ?? null, placementPolicy: candidate[field] ?? null });
      }
    }
  }

  const capacity = providerCapacityRefusal?.status === 'refused'
    ? Object.freeze({ status: 'refused', refusalReason: providerCapacityRefusal.reason ?? 'provider-capacity.exhausted-or-quarantined' })
    : Object.freeze({ status: 'not-applicable' });

  // Fallback candidates are only evaluated on an actual capacity refusal
  // (design.md §3.6: "Fallback admission" applies to fallback CANDIDATES,
  // and there is nothing to fall back to when the primary candidate is
  // simply selected/not-applicable).
  const fallbackCandidates = [];
  const fallbackSkipped = [];
  if (capacity.status === 'refused') {
    for (const fbExecutorId of declaredFallbackExecutorIds) {
      if (fbExecutorId === candidate?.executorId) continue; // not a fallback from itself
      const admitted = admitFallbackCandidate({ cfg, executorId: fbExecutorId, workTier, options });
      if (admitted.skipped) {
        fallbackSkipped.push({ executorId: admitted.executorId, reasonCode: admitted.reasonCode });
      } else {
        fallbackCandidates.push(admitted.candidate);
      }
    }
  }

  return Object.freeze({
    contract: PLACEMENT_POLICY_SHADOW_CONTRACT,
    legacy: legacy ? Object.freeze({ ...legacy }) : null,
    placementPolicy: Object.freeze({
      candidates: Object.freeze(candidates.map((c) => Object.freeze(c))),
      capacity,
      fallbackCandidates: Object.freeze(fallbackCandidates.map((c) => Object.freeze(c))),
      fallbackSkipped: Object.freeze(fallbackSkipped.map((s) => Object.freeze(s))),
    }),
    divergence: Object.freeze(divergence.map((d) => Object.freeze(d))),
  });
}

/**
 * Phase 07 production binder, self-verifying. `buildPlacementPolicyCandidate`
 * is proven identical to the legacy `modelForTier` formula for every
 * canonical executor × work-tier pair this track's own matrix coverage
 * proves (`test/runner/placement-policy-matrix-coverage.test.mjs`), but
 * that proof only covers the executors THIS repo declares today -- never an
 * arbitrary project's own custom executor. Trusting the new path
 * unconditionally would risk a silent behavior change for exactly the
 * configs this track never tested against.
 *
 * Real production call sites (`cli.mjs`'s `spawnWorker`/`executeExecutorCli`)
 * call this with the model their OWN unchanged legacy formula already
 * computed -- `legacyModel` is never recomputed here, so this function
 * cannot itself introduce a second, drifting model-resolution algorithm.
 * PlacementPolicy's candidate is used ONLY when it agrees with that legacy
 * value; a genuine divergence (an untested/custom executor) falls back to
 * the legacy value and is reported, never silently applied. The real spawn
 * decision can therefore never regress relative to before this function
 * existed, for any config, while still being PlacementPolicy-sourced for
 * every case the matrix already proves.
 *
 * @param {object} params
 * @param {object} params.cfg
 * @param {string} params.executorId
 * @param {string} [params.workTier]
 * @param {string} params.legacyModel the model the caller's own unchanged
 *   legacy formula already computed for this exact executorId/workTier
 * @returns {{model: string, source: 'placement-policy'|'legacy', divergence: {executorId: string, workTier: string, legacyModel: string, placementModel: string}|null}}
 */
export function resolveVerifiedPlacementModel({ cfg, executorId, workTier, legacyModel }) {
  if (!executorId) {
    return { model: legacyModel, source: 'legacy', divergence: null };
  }
  let candidate;
  try {
    candidate = buildPlacementPolicyCandidate({ cfg, capabilityId: executorId, workTier });
  } catch {
    candidate = null;
  }
  if (!candidate) {
    return { model: legacyModel, source: 'legacy', divergence: null };
  }
  if (candidate.model !== legacyModel) {
    return {
      model: legacyModel,
      source: 'legacy',
      divergence: Object.freeze({ executorId, workTier: workTier ?? null, legacyModel, placementModel: candidate.model }),
    };
  }
  return { model: candidate.model, source: 'placement-policy', divergence: null };
}

// ─── Phase 08 (executor-policy-dispatch-seams): read-only redirect executor
// ranking/selection ────────────────────────────────────────────────────────
//
// `readOnlyExecutorRedirects` (assignment-runner.mjs) does EXECUTOR
// selection among a declared candidate pool -- a different job than
// buildPlacementPolicyCandidate's model/provider ranking above. Its
// selection algorithm is a deterministic, assignment-seeded stable-hash
// distribution across the pool (never a "prefer the best one" ranking),
// so PlacementPolicy's equivalent here is its own dedicated function, not
// a reuse of buildPlacementPolicyCandidate.
//
// This module still does not own the candidate POOL declaration itself --
// `readOnlyExecutorRedirects` config remains the source of which executors
// are even eligible (design.md §9: rewriting `.fgos/config.json` to a final
// ExecutorProfile schema is out of scope for this whole track, not just
// this phase). What moves to PlacementPolicy is the SELECTION algorithm
// among that pool, self-verified against the legacy formula exactly like
// Phase 07's resolveVerifiedPlacementModel.

/**
 * Deterministic index into a size-`size` pool from `seed`. BYTE-IDENTICAL
 * to assignment-runner.mjs's own `stableIndex` -- deliberately duplicated
 * rather than imported (assignment-runner.mjs already imports FROM this
 * module; importing back would be circular), so any accidental drift
 * between the two copies shows up immediately as a
 * `resolveVerifiedRedirectExecutor` divergence, never silently.
 */
export function stablePoolIndex(seed, size) {
  if (!Number.isInteger(size) || size <= 0) return 0;
  const hash = crypto.createHash('sha256').update(String(seed)).digest();
  return hash.readUInt32BE(0) % size;
}

/**
 * PlacementPolicy's own read-only redirect selection: filter the declared
 * candidate pool to admissible entries (not the source executor itself,
 * and actually registered), then pick deterministically by `seed`. Returns
 * `sourceExecutorId` unchanged when nothing is admissible -- same
 * "no candidate, no redirect" fallback the legacy function already uses.
 */
export function selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId, candidatePool, seed }) {
  const executors = cfg?.executors && typeof cfg.executors === 'object' ? cfg.executors : {};
  const admissible = (Array.isArray(candidatePool) ? candidatePool : [])
    .filter((candidate) => candidate !== sourceExecutorId && executors[candidate]);
  if (admissible.length === 0) return sourceExecutorId;
  return admissible[stablePoolIndex(seed, admissible.length)];
}

/**
 * Phase 08 production binder, self-verifying -- same safety posture as
 * Phase 07's `resolveVerifiedPlacementModel`. The caller's own UNCHANGED
 * legacy selection (`legacyExecutorId`, already computed by
 * `selectReadOnlyRedirectExecutor`) is never recomputed here. PlacementPolicy's
 * own selection is used ONLY when it agrees; a genuine divergence (a bug in
 * this module, or a future drift between the two stable-hash copies) falls
 * back to the legacy value and is reported, never silently applied. Because
 * both algorithms are the SAME deterministic formula over the SAME pool,
 * they are expected to agree for every real config -- this wrapper exists
 * as defense-in-depth, not because disagreement is expected.
 *
 * @param {object} params
 * @param {object} params.cfg
 * @param {string} params.sourceExecutorId
 * @param {string[]} params.candidatePool the SAME pool
 *   `readOnlyRedirectCandidates` already computed for this call
 * @param {string} params.seed the SAME seed string the legacy
 *   `stableIndex` call already used (`${operation}:${assignmentId}`)
 * @param {string} params.legacyExecutorId what `selectReadOnlyRedirectExecutor`
 *   already computed for this exact input
 */
export function resolveVerifiedRedirectExecutor({ cfg, sourceExecutorId, candidatePool, seed, legacyExecutorId }) {
  let placementExecutorId;
  try {
    placementExecutorId = selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId, candidatePool, seed });
  } catch {
    return { executorId: legacyExecutorId, source: 'legacy', divergence: null };
  }
  if (placementExecutorId !== legacyExecutorId) {
    return {
      executorId: legacyExecutorId,
      source: 'legacy',
      divergence: Object.freeze({ sourceExecutorId, candidatePool: Object.freeze([...candidatePool]), legacyExecutorId, placementExecutorId }),
    };
  }
  return { executorId: placementExecutorId, source: 'placement-policy', divergence: null };
}

// ─── Follow-up (post-Phase-08): resolveAssignmentDispatchPolicy unification ─
//
// design.md's close criteria: "no production path has a fourth hidden
// placement source beside PlacementPolicy target semantics." Phase 07 only
// wired cli.mjs's modelForTier-based paths (spawnWorker/executeExecutorCli).
// resolveAssignmentDispatchPolicy (assignment-policy.mjs) -- the resolver
// executeAssignment's real production dispatch path uses -- has its OWN
// separate model resolution: `resolvePolicyTierModel(cfg, lookupPolicyTier,
// provider)`, called directly, never through this module. That is the
// remaining "fourth source" this closes.
//
// Unlike Phase 07's model/redirect binders, this one's two sides were
// ALREADY calling the identical underlying primitive
// (resolvePolicyTierModel) with the identical inputs -- lookupPolicyTier
// and provider are computed once, by resolveAssignmentDispatchPolicy itself
// (Phase 04), and simply handed to this wrapper rather than recomputed. So
// this is honestly more a PROVENANCE/OWNERSHIP move (marking `modelSource`
// as PlacementPolicy-attributed in evidence) than a case where a genuine
// algorithmic divergence was ever possible -- the self-verify guard is kept
// anyway, as the same defense-in-depth posture as every other verified
// binder in this track, in case a future change to either side drifts.

/**
 * @param {object} params
 * @param {object} params.cfg
 * @param {string} params.lookupPolicyTier the SAME value
 *   resolveAssignmentDispatchPolicy already computed (Phase 04)
 * @param {string} params.provider the SAME resolvedProvider
 *   resolveAssignmentDispatchPolicy already computed
 * @param {string} params.legacyModel what resolvePolicyTierModel already
 *   produced for this exact (lookupPolicyTier, provider) pair
 */
export function resolveVerifiedAssignmentModel({ cfg, lookupPolicyTier, provider, legacyModel }) {
  let placementModel;
  try {
    placementModel = resolvePolicyTierModel(cfg, lookupPolicyTier, provider);
  } catch {
    return { model: legacyModel, source: 'legacy', divergence: null };
  }
  if (placementModel !== legacyModel) {
    return {
      model: legacyModel,
      source: 'legacy',
      divergence: Object.freeze({ lookupPolicyTier, provider, legacyModel, placementModel }),
    };
  }
  return { model: placementModel, source: 'placement-policy', divergence: null };
}
