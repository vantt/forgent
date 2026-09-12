---
area: dispatch-control-plane
updated: 2026-09-11
coverage: proposed
---

# Executor Fallback And Effect Eligibility

Design status: PROPOSED detailed contract. Implementation: not implemented.
Read [Runtime Recovery Design](runtime-recovery-design.md) first.
This activates existing fallbackExecutors through the existing recovery matrix,
compiler and runtime admission. No second health classifier or policy store.

## 1. Responsibility And Inputs

| Stage | Owner | Output |
|---|---|---|
| Worker result interpretation | Existing normalizer/evaluator | Per-Run result; not an executor-health judgment. |
| Liveness classification | Existing signal ladder | Nonterminal or settled/blocked/died/ceiling/paused-limit/idle outcome. |
| Effect and workspace retry eligibility | Operation recovery adapter plus runtime facts | Eligible/reconcile/forbidden verdict. |
| Retry/park/halt and bounds | Existing recovery matrix, extended with an explicit runtime projection | Coarse decision and cap reasons. |
| Candidate ordering | Pure fallback resolver | Ordered selection/rejections. |
| Governance | Existing compileDispatchPlan and Confinement Authority | Governed plan, then runtime enforcement before launch. |
| Admission | Run repository | One durable current attempt under authority. |

The application service composes these stages. Fallback receives values, never
calls herdr, traverses session graphs, moves Work or normalizes evidence.

FailureObservationV1:
`{contract: executor-failure-observation.v1, observationId,
assignmentId, runId, attempt, executorId, capability,
resourceScope, outcome, evidenceRefs, observedAt}`.
ResourceScope is optional provider/account/model identifiers without credentials.
Outcome is a discriminated union:
- infra-ok;
- ladder with `outcome` nullable while nonterminal, delivery, outputBytes,
  rawLimitLineRef?, retryAfter?;
- launch-failed with phase and creation/delivery certainty;
- config-invalid with typed code;
- confinement-refused with attestation/refusal ref.
Success/config/launch outcomes do not require fabricated ladder values.

## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.

A screen request is a second stage of the same sample, not another death reading.
Keep all failure panes by default. Paused-limit survives automated closeAlways;
operator destructive intent is separate and guarded. Never infer Run completion
from agent_status or pane idleness.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.

## 3. Coarse Matrix Mapping

Extend the existing recovery module's runtime-facing pure entry rather than
creating a parallel matrix. Preserve `resolveAction(errorClass, claimAttempt)`
for its current Work-runner callers and `resolveStaleDoing` semantics.

| Observation | Existing class / composed action |
|---|---|
| Creation failure proven before delivery | worker-spawn-fail; retry eligibility and bounds still required. |
| timed-out-idle or timed-out-ceiling | worker-timeout; never proof the worker is dead. |
| died without result | worker-spawn-fail for coarse retry class, with original died outcome retained; effect/quiescence gate remains mandatory. |
| paused-limit / blocked | **Proposed behavior change:** park current Run, before retry matrix. Existing callers currently classify these through the retry matrix; S0 must freeze that behavior and this mapping cannot ship as a silent port. |
| Nonterminal/present worker | wait; no failure classification or candidate selection. |
| Unknown delivery or effects | reconcile then park if unresolved. |
| Config-invalid / confinement-refused | refuse current dispatch; do not try another candidate to bypass policy. |
| Semantic RunResult rejection | No infrastructure fallback; caller decides a new semantic operation/recheck if authorized. |
| Unmapped internal error class | Preserve recovery matrix halt, scope reported to caller. |
| dispatch-in-flight | Admission contention, not health; wait/re-read without consuming a Run attempt. |

`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, original session/Run bounds remain binding; an expired
session cannot dispatch a fallback. An eligible retry under still-valid session
authority gets its own bounded Run; it does not extend the old Run ceiling.

## 4. One Attempt History, Explicit Caps

Canonical count A = number of committed admissions for the Assignment, including
admitted attempts that failed before launch. It never resets on restart, changed
executor, changed error class or a new observer. Repeating an admissionKey does
not increment A. Pure refusal before admission consumes no attempt.

For executor e, E(e) counts those same admissions selecting e.
Retry count R = max(0, A - 1). Session retry declarations may reserve the next
attempt before it is admitted; a pending declaration is resumed, not counted as
a completed extra Run. Reservation checks include any outstanding declaration.

Default policy is a derived view of effective DispatchRequest/PolicyPatch:
- candidates = unique `[selected primary, ...fallbackExecutors]`, preserving order;
- maxAttemptsPerExecutor = 1;
- maxAttemptsPerAssignment = 2 (the existing recovery default's total-attempt
  threshold for a retryable runtime failure);
- no automatic retry-same; no fallback if explicitly pinned no-fallback;
- no observation store, cooldown or scoring;
- retry backoff remains the caller's existing bounded scheduling policy; no new
  configurable exponential-backoff subsystem in the default.

A candidate can be admitted only if A < maxAttemptsPerAssignment and
E(candidate) < maxAttemptsPerExecutor. With maxAttempts=2, initial Run 1 fails,
Run 2 may use the next candidate; no third admission. The Session's existing
maxRetries counts retry declarations after the initial attempt: its allowance is
`1 + maxRetries` total attempts, not a number directly passed to the old
per-class claim resolver. The stricter effective cap always wins. Other session
assignment/concurrency/wall-time bounds remain independent predicates.

The runtime projection consumes the SAME recovery table's action/default limit,
using Assignment admission history as its counter input; it does not reset on
class changes. Existing claim-scoped callers of resolveAction keep their current
counter semantics. Name both scopes in APIs/tests so one integer is not silently
reinterpreted. Future policy can permit retry-same with the same history and caps,
but that is not today's default E-b proof.

## 5. EffectGuaranteePort

`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.

The operation contract declares repeat mode explicitly: before-delivery-only,
read-only, idempotent, dedup-keyed or never. The first protocol profile declares
`repeatMode: read-only` in its review/red-team YAML operation contracts. The
read-only effect boundary is derived from the selected executor's DispatchPlan
(`providerModel` and executor facts): provider endpoints may be allowed, while
unlisted external sinks are denied. Operations declare only sinks whose repeated
write is part of their contract; a sink that can change outcome needs its own
dedup identity. The runtime never infers this from `Assignment.mutation`.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.

| Guarantee | Required evidence |
|---|---|
| no-delivery | Proof original launch/input was never delivered and no pending command can later deliver it. |
| read-only | Actual permitted effect scope; writable output artifacts isolated per Run and no unaccounted external mutation. |
| idempotent | Operation contract version, same logical input/effect identity, and evidence that repetition satisfies its operation-specific invariant. |
| deduplicated | Stable effect key, input digest, effect-boundary namespace, verified dedup capability, validity window and destination compatibility. |

All eligible outcomes carry source Run, operation contract digest, input/effect
identity, evidence refs and assessedAt; window end is explicit when relevant.
The effect identity stays stable across attempts, unlike runId. Destination
selection revalidates that the same guarantee holds for that candidate.
`Assignment.mutation` remains descriptive and is not an effect guarantee.
`effectsObserved: false` is not proof of no effects; boolean labels cannot replace
typed unknown/reconcile outcomes. A generic effect ledger is not required.

For writable takeover, eligibility additionally requires proof all old writers
are stopped or deprived of access, and a held exclusive workspace grant. A dead
main PID or a closed pane is insufficient for surviving descendants. New isolated
workspaces can retain read-only snapshots of prior work, but cannot bypass
unknown external effects. Material and grants are passed through the existing
confinement/runtime boundary, not written into immutable Assignment semantics.

## 6. Resolver Output And Apply

FallbackDecisionV1:
`{contract: executor-fallback-decision.v1, assignmentId, sourceRunId,
historyRevision, policyProvenance, observationRef, decision,
rejectedCandidates[]}`.

Decision variants:
- collect-result with resultRef;
- wait with runId and optional nextCheckAt;
- reconcile with requiredFacts[];
- fallback with executorId and compiledPlanRef;
- park/refuse/halt with typed reasonCode and remedy;
- retry-same exists only when a non-default policy explicitly permits it.

Remedy is a typed union: inspect-run, reconcile-effect, repair-config,
request-budget, await-driver-input, none. Human display text is supplementary.
Reasons include run-live, delivery-unknown, effect-unknown, writer-not-quiescent,
candidate-unregistered, capability-mismatch, compile-refused, confinement-refused,
assignment-budget-exhausted, executor-budget-exhausted, candidates-exhausted,
deadline-exceeded, no-fallback-pinned, cancelled, unknown-error-class.

Candidate resolution rejects duplicates/previously exhausted executors, preserves
original capability, tier, provider/egress constraints, persona and provenance,
then calls the existing compiler. A fallback candidate is passed as an explicit
`cliOverride.preferExecutor` with
`policyProvenance.executor: {scope: fallback, id}`; the policy resolver must
recognize that scoped candidate as valid. If the current compiler still hard-
errors on this mismatch, fallback remains parked until that compiler contract is
amended. Its output is advice, not a permission token.
Apply re-reads admission history, budget, late results, cancellation and effect
window before Run admission. Compiling does not replace final confinement checks.

No fallback candidate does not imply a failed semantic task. Return parked/refused
with the precise reason; the caller can continue independent work. A quota pause
does not consume another attempt. Admission contention is neither a quota event
nor evidence an executor is unhealthy.

## 7. Proof, Rollout And Future Work

E-a..E-f and X01..X06 in
[the common proof matrix](runtime-recovery-design.md#10-proof-matrix)
are the acceptance scenarios. In particular E-b is reconcile then eligible
fallback, not unknown-delivery retry-same followed by an impossible third attempt.
Pair pure resolver tests with real admission/confinement integration.

Node changes extend recovery/assignment-policy/assignment-runner and runtime
interfaces; do not rename/rebuild dispatch core. Doctor validates referenced
executors, supported recovery guarantees and any introduced policy defaults.
Configuration still merges project over global through existing setup.

Future observation history is scoped by actual provider/account/model resource;
cooldown/scoring is not needed for correctness. Distributed effect ledgers,
cross-project health and additional repeat strategies remain explicitly unsupported
until their adapters and proof exist.
