# Executor Fallback And Effect Eligibility

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/executor-health-and-fallback.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| 1. Responsibility And Inputs | Unimplemented design proposal | FailureObservationV1/executor-failure-observation absent (git grep src/ packages/ apps/ core/ domains/ bin/ = 0); owners named in the stage table exist: src/runner/dispatch/liveness.mjs:211 evaluateLadder, src/runner/dispatch/plan.mjs:45 compileDispatchPlan, src/runner/dispatch/run-result.mjs:350 normalizeRunResult |
| 2. Production Ladder Semantics | Current contract/invariant | src/runner/dispatch/liveness.mjs:211 evaluateLadder (truth>blocked>died>ceiling>stale), :63 DEFAULT_DEATH_THRESHOLD=3, :105 paneFateFor keeps paused-limit under closeAlways, :99 keep-always |
| 3. Coarse Matrix Mapping | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/herdr-round.mjs:350-357 ERROR_CLASS_FOR_OUTCOME (died->worker-spawn-fail, others->worker-timeout); src/runner/recovery.mjs:106-115,133 resolveAction; src/runner/loop.mjs:515 resolveStaleDoing; blocked/paused-limit park is explicitly "Proposed behavior change" |
| 4. One Attempt History, Explicit Caps | Mixed implementation and proposal; no blanket implementation claim | Not implemented: maxAttemptsPerAssignment/maxAttemptsPerExecutor = 0 hits in code; src/runner/dispatch/assignment-policy.mjs:380-388 fallbackExecutors "reserved-not-executed"; admission counting live at src/runner/dispatch/assignment-runner.mjs:672-783 (runId per attempt); src/runner/recovery.mjs:91 DEFAULT_MAX_RETRIES=2 |
| 5. EffectGuaranteePort | Unimplemented design proposal | EffectGuaranteePort absent in code; related live subset: src/runner/dispatch/recovery.mjs:201 assess(plan, repeatMode, confinement, attestation) with ASSESS_OUTCOMES :56 and REPEAT_MODE never inferred from Assignment.mutation :202-206 |
| 6. Resolver Output And Apply | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/recovery.mjs:93 resolveFallback (FALLBACK_STATUSES :53), src/runner/dispatch/assignment-policy.mjs:334-339 cliOverride.preferExecutor; FallbackDecisionV1/rejectedCandidates absent; apply re-check in src/runner/dispatch/recovery-planner.mjs:281 checkApply |
| 7. Proof, Rollout And Future Work | Unimplemented design proposal | Refers to proof matrix runtime-recovery-design.md#10 (E-a..E-f, X01..X06) and future work; no code symbols |

## 1. Responsibility And Inputs

| Stage | Owner | Output |
|---|---|---|
| Worker result interpretation | Existing normalizer/evaluator | Per-Run result; not an executor-health judgment. |
| Liveness classification | Existing signal ladder | Nonterminal or settled/blocked/died/timed-out-ceiling/provider-limit/timed-out-idle; `paused-limit` is a compatibility pane-fate alias, not evaluateLadder's emitted limit outcome. |
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
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Operator destructive intent is separate and guarded. Pane idleness does not
prove Run completion.

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
For timed-out-ceiling, the Run's applicable admission/budget bounds remain
binding. Retry does not extend the failed Run's ceiling; a replacement needs
its own eligible admission. No current session graph grants fallback authority.

## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.

## 5. EffectGuaranteePort

`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.

An operation's repeat mode must be explicit; it is not inferred from
`Assignment.mutation`. Supported current policy values are checked by
`assignment-policy.mjs:439-453`, and recovery assessment refuses to infer mode
(`src/runner/dispatch/recovery.mjs:201-206`). No current review/red-team YAML
profile is claimed here to declare `repeatMode: read-only`.

The following effect-sink, deduplication and guarantee model belongs to the
proposed EffectGuaranteePort, not a shipped generic effect ledger. Operations
would need their own effect identity and adapter proof before enabling it.
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

