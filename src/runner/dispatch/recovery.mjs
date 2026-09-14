// dispatch/recovery.mjs — the fallback ladder and the effect boundary
// (plans/260911-2305-runtime-recovery/phase-designs/
// fallback-and-effect-boundary.md): when a running Assignment cannot be
// carried forward on its own DispatchPlan, this module answers two
// SEPARATE questions, and never conflates them:
//
//   resolveFallback(originalPlan, candidateId)
//     May we even SUBSTITUTE a different executor for this dispatch? Only
//     when that candidate already carries the same governance/provenance
//     chain the original plan was resolved under (declared alongside it in
//     the SAME PolicyPatch's `fallbackExecutors`, dispatch/assignment-
//     policy.mjs), and only when the real DispatchPlan compiler accepts the
//     scoped result. A candidate that compiles clean but was never declared
//     next to the original is not a scoped variant of the same governance
//     decision -- it is a different, unvetted dispatch wearing a familiar
//     id.
//
//   assess(plan, repeatMode, confinement, attestation)
//     Given a plan we ARE allowed to run, may whatever it does be safely
//     REPEATED? `repeatMode` is read only from a declared operation/protocol
//     (never inferred from `Assignment.mutation` -- see assignment-
//     policy.mjs's own repeatMode resolution for why those two stay
//     independent). Pre-delivery (nothing has reached an external sink yet)
//     is always safe. Post-delivery is governed by the Acceptance Matrix
//     below, and defaults to parking: `local-bwrap-v1`, the only confinement
//     backend that exists today, only ever attests `networkEgress: allow`
//     (confinement/drivers/bwrap.mjs's `assessBwrap`), so it can never prove
//     the "provider-only" coverage a post-delivery repeat requires. Parking
//     there is the correct, contract-compliant answer, not a gap to close
//     later.
//
// Pure on purpose, matching liveness.mjs's own discipline: every reading
// (the compiled candidate plan, the confinement policy, the attestation) is
// gathered by the caller and handed in; this module only classifies. No fs,
// no dispatch, no compiler import -- `resolveFallback` takes the compiler as
// an injected function precisely so this file never has to know how a
// DispatchPlan gets built (dispatch/plan.mjs's `compileDispatchPlan`, not
// leased by this cell) or what a runnerConfig/Assignment look like.
//
// Non-goals (contract's own list): no generic effect ledger, no provider
// inference from worker output text -- every provider check here reads
// `plan.providerModel` (dispatch/plan.mjs's DispatchPlan field, itself
// derived from the resolved executor's own config, never worker text) --
// and no claim that declaring `repeatMode` in YAML alone proves an effect is
// safe to repeat: `assess` still requires a real, non-`unknown` attestation
// before it will ever return `eligible`.

import { REPEAT_MODE_VALUES } from '../definitions/schema.mjs';

export { REPEAT_MODE_VALUES };

/** Every outcome `resolveFallback` can reach. */
export const FALLBACK_STATUSES = Object.freeze(['scoped', 'candidate-not-governed', 'compiler-mismatch']);

/** Every outcome `assess` can reach. */
export const ASSESS_OUTCOMES = Object.freeze(['eligible', 'effect-unknown', 'provider-not-allowed', 'undeclared-sink']);

export class RecoveryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RecoveryError';
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Resolve whether `candidateId` may replace the executor `originalPlan` was
 * compiled against.
 *
 * `originalPlan` is a real DispatchPlan (dispatch/plan.mjs's
 * `compileDispatchPlan` output): this reads `originalPlan.policy.
 * executorPreference` (the resolved primary executor plus its own declared
 * `fallbackExecutors`, dispatch/assignment-policy.mjs) as the governed
 * candidate list, and `originalPlan.provenance`/`originalPlan.tier` as the
 * governance-relevant baseline a scoped candidate must still match.
 *
 * `options.compilePlan(candidateId)` is the caller's own closure over
 * whatever compiled the original plan (its runnerConfig, its Assignment,
 * its cliOverride) -- typically
 * `(id) => compileDispatchPlan(cfg, {assignment, cliOverride: {...cliOverride, preferExecutor: id}, options})`.
 * This module never imports the compiler itself: a caller that cannot
 * supply one gets a named `RecoveryError`, never a silent no-op.
 *
 * @returns {Readonly<object>} one of:
 *   `{status: 'candidate-not-governed', candidateId}` -- never reached the compiler
 *   `{status: 'compiler-mismatch', candidateId, reason}` -- the compiler refused, or
 *     the scoped result does not carry the same governance-relevant provenance
 *   `{status: 'scoped', candidateId, plan}` -- the compiler-accepted scoped DispatchPlan
 */
export function resolveFallback(originalPlan, candidateId, { compilePlan } = {}) {
  if (!isPlainObject(originalPlan)) {
    throw new RecoveryError('resolveFallback requires an originalPlan object');
  }
  if (typeof candidateId !== 'string' || !candidateId.trim()) {
    throw new RecoveryError('resolveFallback requires a non-empty candidateId string');
  }

  // Governed means: this exact id was already blessed by the SAME
  // PolicyPatch/governance resolution that produced originalPlan --
  // `executorPreference` is `[primaryExecutor, ...declaredFallbacks]`
  // (assignment-policy.mjs). A candidate absent from it was never seen by
  // that governance decision at all, regardless of whether it would
  // separately compile clean.
  const declaredCandidates = Array.isArray(originalPlan.policy?.executorPreference)
    ? originalPlan.policy.executorPreference
    : [];
  if (!originalPlan.provenance || declaredCandidates.length === 0 || !declaredCandidates.includes(candidateId)) {
    return Object.freeze({ status: 'candidate-not-governed', candidateId });
  }

  if (typeof compilePlan !== 'function') {
    throw new RecoveryError('resolveFallback requires options.compilePlan(candidateId) to attempt the scoped candidate plan');
  }

  let scopedPlan;
  try {
    scopedPlan = compilePlan(candidateId);
  } catch (err) {
    return Object.freeze({ status: 'compiler-mismatch', candidateId, reason: err.message });
  }

  // The compiler not throwing is necessary but not sufficient: a scoped
  // plan must still carry an allowed governance verdict, and the SAME
  // governance-relevant floor (tier, visibility) as the original -- a
  // candidate that compiles but lands on a different governance outcome is
  // not a scoped variant of the same plan, it never gets coerced into one.
  if (!isPlainObject(scopedPlan) || scopedPlan.provenance?.governance?.value !== 'allowed') {
    return Object.freeze({ status: 'compiler-mismatch', candidateId, reason: 'scoped plan carries no allowed governance verdict' });
  }
  if (
    scopedPlan.tier !== originalPlan.tier ||
    scopedPlan.provenance?.visibility?.value !== originalPlan.provenance?.visibility?.value
  ) {
    return Object.freeze({
      status: 'compiler-mismatch',
      candidateId,
      reason: 'scoped plan does not carry the same governance-relevant provenance (tier/visibility) as the original plan',
    });
  }

  return Object.freeze({ status: 'scoped', candidateId, plan: scopedPlan });
}

const NETWORK_EGRESS_VALUES = Object.freeze(['deny', 'filtered', 'allow']);

/**
 * Assess whether a repeat of `plan` is eligible, applying the contract's
 * Acceptance Matrix exactly (fallback-and-effect-boundary.md):
 *
 *   network allow                                          -> provider-not-allowed
 *   filtered provider + undeclared sink                     -> undeclared-sink
 *   filtered requested but adapter coverage unsupported      -> provider-not-allowed
 *   filtered provider-only + duplicable telemetry + proof    -> eligible
 *   fallback compiler mismatch (plan never reached `scoped`) -> effect-unknown
 *   unknown delivery/effect                                  -> effect-unknown
 *
 * `plan` accepts either a real DispatchPlan (must carry a non-empty
 * `providerModel`, per Effect Rule 1 -- provider endpoints derive from
 * DispatchPlan.providerModel, never worker output text) or a
 * `resolveFallback()` result: a non-`scoped` result (`candidate-not-
 * governed`/`compiler-mismatch`) has no valid provider endpoint to reason
 * about at all, so it always parks as `effect-unknown` here too.
 *
 * `repeatMode` must already be one of REPEAT_MODE_VALUES -- this function
 * never infers it (that is `assignment-policy.mjs`'s job, and even there it
 * only ever reads a DECLARED value, never `Assignment.mutation`). An
 * undeclared or invalid repeatMode is a caller/config bug, not a runtime
 * effect-boundary decision, so it throws rather than silently parking.
 *
 * `confinement` is `{policy: ConfinementPolicyV1, sinks: {declared, observed}}`
 * (confinement/policies.mjs's own `ConfinementPolicyV1` shape for `policy`;
 * `sinks.declared[]` entries are `{id, duplicable, outcomeAffecting?,
 * dedupIdentity?}`, `sinks.observed[]` entries are `{id}` -- Effect Rule 4:
 * every reached sink must be declared duplicable, and an outcome-affecting
 * one additionally needs a real dedup identity before a repeat may touch it
 * again).
 *
 * `attestation` is a ConfinementAttestationV1 (confinement/authority.mjs's
 * `buildConfinementAttestation` output) -- `attestation.coverage['control:
 * networkEgress']` must read `'satisfied'` before any restricted-network
 * posture is trusted; `local-bwrap-v1`'s own `assessBwrap` never sets that
 * for anything but `networkEgress: 'allow'`, which is exactly why this
 * function still parks under it (Effect Rule 3).
 */
export function assess(plan, repeatMode, confinement, attestation) {
  if (!REPEAT_MODE_VALUES.includes(repeatMode)) {
    throw new RecoveryError(
      `assess requires a declared repeatMode, one of [${REPEAT_MODE_VALUES.join(', ')}] -- never inferred from Assignment.mutation`,
    );
  }

  const resolvedPlan = isPlainObject(plan) && plan.status !== undefined
    ? (plan.status === 'scoped' ? plan.plan : null)
    : plan;
  if (!isPlainObject(resolvedPlan) || typeof resolvedPlan.providerModel !== 'string' || !resolvedPlan.providerModel.trim()) {
    // Covers both "fallback compiler mismatch" (a resolveFallback result
    // that never reached `scoped`) and any plan with no provider endpoint
    // to derive at all: with nothing to reason about, this can never be
    // construed as safe to repeat.
    return 'effect-unknown';
  }

  // Pre-delivery: no effect has reached an external sink yet, so there is
  // nothing a repeat could duplicate. Allowed today, unconditionally.
  if (repeatMode === 'pre-delivery') {
    return 'eligible';
  }

  // repeatMode === 'post-delivery' from here on -- the Acceptance Matrix.
  if (!isPlainObject(attestation) || attestation.outcome === 'unknown' || attestation.outcome === 'refused' || attestation.outcome === 'failed') {
    return 'effect-unknown';
  }

  const networkEgress = confinement?.policy?.controls?.networkEgress;
  if (!NETWORK_EGRESS_VALUES.includes(networkEgress)) {
    return 'effect-unknown';
  }

  // Effect Rule 2: network allow is never eligible for automatic repeat,
  // full stop -- unconstrained egress can never be shown to have reached
  // only the declared provider.
  if (networkEgress === 'allow') {
    return 'provider-not-allowed';
  }

  // Effect Rule 3: a restricted posture (filtered, or the stronger deny)
  // needs the active confinement adapter to actually ATTEST that coverage --
  // declaring it in policy is never enough on its own. `local-bwrap-v1`
  // never satisfies this today for anything but `allow`, so this branch is
  // the one that always parks under it.
  const coverageSatisfied = attestation.coverage?.['control:networkEgress'] === 'satisfied';
  if (!coverageSatisfied) {
    return 'provider-not-allowed';
  }

  const declaredSinks = Array.isArray(confinement?.sinks?.declared) ? confinement.sinks.declared : [];
  const observedSinks = Array.isArray(confinement?.sinks?.observed) ? confinement.sinks.observed : [];
  const declaredById = new Map(declaredSinks.map((sink) => [sink.id, sink]));

  // Effect Rule 5 / Effect Rule 4: any sink reached outside the declared set
  // parks (the offending sink is right there in `observedSinks` for the
  // caller to log); any declared sink that was reached must itself be
  // proven duplicable, and an outcome-affecting one additionally needs a
  // real dedup identity -- both failure modes name the same hazard (an
  // effect with no proof it is safe to touch twice), so both surface as the
  // one sink-shaped outcome this function has.
  for (const sink of observedSinks) {
    const declared = declaredById.get(sink.id);
    if (!declared || !declared.duplicable) return 'undeclared-sink';
    if (declared.outcomeAffecting && !declared.dedupIdentity) return 'undeclared-sink';
  }

  return 'eligible';
}
