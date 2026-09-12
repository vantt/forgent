# Assignment, Run, And RunResult Contract

Document type: Contract
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-11
Canonical for: semantic requests, runtime attempts, normalized results, and evidence

## Assignment

Assignment is an immutable semantic request. It should identify:

- Assignment ID and schema version;
- optional Work/context reference;
- operation and Role;
- objective and bounded inputs;
- constraints and mutation policy;
- expected outputs and evidence requirements;
- dispatch policy inputs;
- result/artifact destination contract;
- creation timestamp and caller provenance.

Assignment construction has two accepted provenance classes:

1. a declared Stage Operation and TaskSpec;
2. an agent-proposed inline execution contract validated by foundation policy
   and any selected domain harness.

[ADR-006](../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md)
accepts how both classes converge: every Assignment carries
`provenance.kind = declared | inline` with policy/normalizer versions and the
validator chain, and the normalizer stamps `mutation` and `evidence.required`
onto the immutable snapshot. Result interpretation reads those fields rather
than switching on the operation id. The minimum inline field set is listed in
ADR-006; in the first slice inline contracts are read-only only and carry no
session reference. Implementation of the inline class and the stamped snapshot
has not started; the declared-operation path remains the only implemented
general builder until then.

Assignment does not contain attempt status as lifecycle truth. Retry does not
rewrite the Assignment.

## Run

Run is one execution attempt for one Assignment. It should identify:

- Run ID and Assignment reference;
- resolved DispatchPlan/executor/mechanism;
- start/settlement timestamps;
- process/transport metadata;
- result and artifact refs;
- exit/timeout/launch failure details;
- evidence snapshot boundaries needed for post-run comparison.

One Assignment may have multiple Runs. Prior attempts remain immutable evidence.

### Run Phases And Admission

A Run is the unit of admission: it is the one record that says "this attempt
is allowed to exist". Every runtime-layer concern (RunHandle, continuation
planning, executor fallback) reads and references Run; none of them admits an
attempt on its own.

Phases, in order:

| Phase | Meaning | Must hold before entering |
|---|---|---|
| `admitted` | Run record durably written: `runId`, `assignmentId`, `attempt`, resolved DispatchPlan. | No runtime resource exists yet. `runId` is the launch identity used to reconcile crashes and orphaned runtimes; it is deterministic per (Assignment, attempt). |
| `launched` | The runtime adapter created a runtime resource (pane, process, job). | An admitted Run. A runtime found without an admitted Run is an orphan: reconcile it by `runId`, never adopt it as a new Run. |
| `bound` | The RunHandle binding (locator + owner) is durably recorded. | Launched. Binding is written before any non-idempotent prompt or input is delivered. |
| `delivered` | The work prompt/input reached the worker. | Bound. Delivery is a tri-state fact: `not-sent`, `sent`, `unknown`. A request sent without acknowledgment is `unknown`, never "launch failed". |
| `settled` | A normalized RunResult or an explicit failure record exists. | Any earlier phase; crash windows settle as explicit failure with the phase reached. |

Admission rules:

- At most one current, non-superseded un-settled Run per Assignment. A new Run is legal only after the
  prior Run is settled or superseded through a declared supersession event
  (`run-retried` in CoordinationSession; standalone dispatch records the
  equivalent event before the new Run is admitted).
- `attempt` never resets on coordinator restart, candidate change, or
  executor fallback. Attempt budget is counted against the Assignment.
- A missing or lost RunHandle never grants a new admission. Recovery reads
  worker result first, then RunHandle, then classifies, and only then asks for
  a new Run through this admission rule.
- Cancellation requested is a fact about intent, not proof the worker stopped.
  A cancelled Run still settles through its late result if one arrives.

Three guarantees, kept distinct:

- **Control fencing** — one controller per un-settled Run. To be implemented with
  the repository's existing exclusive-create lock pattern (holder identity,
  expiry, stale-by-pid). Observers hold no lock. A controller that lost the
  lock may not deliver input, terminate, or write Run/RunHandle state.
- **Result fencing** — a superseded Run loses the right to publish the
  Assignment's authoritative result (`result-linked` after `run-retried`).
  Its late result is still stored and validated: it may prove an effect
  already happened.
- **Effect protection** — deduplication or isolation at the place the effect
  occurs. Owned by the operation contract and its adapter. Run promises no
  exactly-once external effect; a stopped worker does not mean its effects
  are absent.

Implementation status: deterministic `runId`, pre-spawn `run.json` metadata,
and `run-retried` declaration/event-order supersession are implemented
(`src/runner/dispatch/assignment-runner.mjs`, CoordinationSession store/replay).
Strict fencing against the exact superseded Run is not yet implemented: current
link/replay checks authorize a later link by intervening retry count/order, not
by the exact eligible destination Run. Atomic admission and crash durability, the
`bound`/`delivered` phases, the standalone supersession event, and the
per-Run controller lock are not implemented; they are specified here so
[RunHandle](../architecture/run-handle.md),
[Continuation Planner](../architecture/coordination-continuation-recovery.md),
and [Executor Fallback](../architecture/executor-health-and-fallback.md) share
one admission authority instead of each inventing its own.

### Proposed Runtime Recovery Amendment

Status: PROPOSED technical refinement, not implemented and not an implicit
promotion of the linked designs to Accepted. The accepted identity/authority
principles above remain; this section defines the proposed writer profile that
would make their guarantees verifiable. See
[Runtime Recovery Design](../architecture/runtime-recovery-design.md) for scope,
local publication/locking, compatibility and proof.

**Run record.** New writer format `assignment-run.v2` adds:

| Field | Semantics |
|---|---|
| contract, revision | Version and nonnegative CAS counter; writer must understand both. |
| runId, assignmentId, attempt | Existing deterministic identity; attempt positive, monotonic, never reused. |
| admissionKey, admissionPayloadDigest | Stable logical initial-dispatch/retry identity; same key with different payload refuses. |
| authorityRef | Trusted source declaration reference/digest; not a worker-provided permission assertion. |
| dispatchPlanRef | Immutable compiled plan digest/reference. |
| supersedesRunId | Null for initial Run, otherwise exact prior current Run. |
| phase, delivery | Phases above; delivered requires receipt/ack according to adapter contract. Unknown delivery retains bound plus unknown. |
| launchCommandId, launchState | Stable launch command; not-requested/pending/reconciled. |
| writerRuntime | Owning Node/Rust implementation and release reference. |
| recoveryMaterialRef | Optional pinned material manifest; not a mutation of Assignment or evidence of success. |
| settlement | Null or normalized result/explicit failure reference, reachedPhase and timestamp. |

One committed `run.json` under `assignments/<id>/runs/<attempt>/` owns each Run's
record. Mutable phase/settlement fields are atomically replaced under the runtime
write lock; admission identity/plan/provenance never change. Completed older Runs
and their evidence are never repurposed. Current admission is derived from
committed records and declared supersession; directory presence alone is not
admission. No second current-run database is required. An optional index is a
rebuildable projection, never a writer authority.

**Admission door.** `admitRun(assignmentId, admissionKey, expectedCurrentRunId,
authorityRef, compiledPlanRef, recoveryMaterialRef?)` returns created(existing
Run record), already-admitted(same record), or typed refused(reason). It is an
operation of the Run repository/runtime, not a new component. Under Assignment
serialization, scan committed admissions, return a matching prior key first,
otherwise check expected-current, authority, budget, result and writer-quiescence
requirements, then atomically publish one complete Run record before launch.
The planned initial key derives from Assignment identity; retry key derives from
the durable retry declaration identity. Unknown leftover metadata refuses; a
staging directory is not guessed to be a dispatched Run.

For session-owned work, the engine holds session then Assignment locks to allocate
the next attempt, check cancellation/transfer/bounds and append `run-retried` with
proposed fields `retryId`, required `previousRunId`, `nextRunId`, `nextAttempt`,
`admissionPayloadDigest` before publishing the corresponding Run. Initial admission
uses the already-created Assignment/authorization reference. No session lock spans
adapter I/O. Crash after retry declaration before Run publication resumes that
same declaration; it never derives fulfillment merely from number of result links.
A declaration may be explicitly aborted before admission, with reason, under the
same store door; its identity cannot later be reused. New retry cannot leapfrog a
pending declaration. Retry result remains per Run, even when earlier work failed.

Standalone runtime persists equivalent supersession intent with the new Run's
atomic admission record; the record itself is the declared equivalent, rather
than an unrelated event stream. The predecessor identity is required. A superseded
Run may still be physically alive: new writable execution still needs quiescence
or isolation/effect proof. Result fencing alone is insufficient.

**Launch gate and crash reconciliation.** Under a short session/Assignment gate
and Run control lock, check the Run is still authorized/current, then durably
record launch pending. Release outer locks before adapter I/O. Cancellation or
transfer after this point sees an in-flight launch, not a free slot. The adapter
receives runId as launch identity before creating a resource and must find that
identity after a crash, including before locator persistence. `absent-proven`
means both no resource and no pending launch that could create it later. Unknown
does not permit another launch. Confinement remains the only gate invoking the
launch adapter; RunHandle runtime methods cannot bypass its prepared invocation.

| Crash window | Recovery behavior |
|---|---|
| Before committed admission | No Run authorized; retry same admission request under locks. |
| Admitted, no pending launch | Resume same Run after fresh authority checks. |
| Pending launch, locator absent | Reconcile by runId/commandId; found binds, unknown parks, absent-proven may resubmit same command. |
| Launched, before bound | Reconcile and persist binding; never allocate another attempt because locator file is missing. |
| Bound, delivery pending/unknown | Reconcile command/receipt; no blind resend. |
| Result on disk, no settlement/link | Normalize/store and publish only if exact Run remains eligible. |
| Retry declared but parent cancelled | No new launch; keep declaration/admitted record as cancelled-before-launch explicit failure when applicable. |

**Result eligibility.** Per-Run normalization/storage is permitted for late and
superseded Runs. Publishing an Assignment's authoritative result requires exact
runId eligibility under session -> Assignment locks, serialized with retry
declaration/admission. A pending retry fences its previous Run at declaration;
after abort before admission, the previous Run regains eligibility only through
the explicit abort event. Other historical Runs never gain eligibility from a
generic `allowSupersede` flag. A late initial link is checked just like a later
replacement link. Accepted prior result remains readable as historical/current
last-published view until an eligible new result links; readers expose that it is
superseded for execution when a retry is pending.

Schema-2 `result-linked` records carry admission/retry identity in addition to
runId. Replay validates exact declared destination and event ordering, not just
retry counts. Existing schema-1 links retain their old meaning; do not reinterpret
historical event order as proof of stronger fencing. Late cancellation results
may link for the last eligible Run, but cancellation never authorizes a new Run.

Typed refusal reasons include admission-conflict, admission-payload-conflict,
retry-pending, authority-revoked, budget-exhausted, writer-not-quiescent,
launch-unknown, result-superseded, version-unsupported and owner-runtime-unavailable.
They carry subject refs; no caller branches on message prose.

**Profile migration.** Legacy Runs remain on their existing profile. Enable v2
only for adapters proving launch reconciliation/bind-before-delivery. Schema-1
session upgrades require quiescence and a validated migration mapping, not an
automatic on-read rewrite. Initially only new schema-2 sessions use v2 runtime
guarantees. Initial rollout must not force unsupported cli-spawn/in-process
mechanisms to claim RunHandle support. The Node owner implements/tests this first;
Rust ports the whole writer boundary with shared compatibility fixtures.

## RunResult

RunResult is the normalized outcome for one Run. It should identify:

- Run and Assignment refs;
- normalized status and confidence;
- worker claim and structured result ref;
- accepted/rejected evidence refs and reasons;
- artifacts and expected-output checks;
- verification commands/results when applicable;
- failure classification;
- timestamps and normalizer provenance.

## Confidence

The exact vocabulary may evolve, but these boundaries are mandatory:

- verified confidence requires independently checkable required evidence;
- reported confidence is allowed only when the operation permits analytical or
  advisory output without external verification;
- no-evidence cannot satisfy evidence-required success;
- malformed, stale, or cross-context evidence cannot raise confidence;
- process success cannot substitute for semantic success.

## Evidence Freshness

Mutating operations must distinguish pre-existing state from changes attributable
to the Run. Evidence checks should use pre/post snapshots, git state, artifact
timestamps/hashes, expected-file rules, or equivalent operation-specific proof.

## Work Boundary

Assignment, Run, and RunResult may reference Work and inform its driver. None is
authorized to move Work status/stage, accept, approve, claim, return, or merge.

## Required Negative Tests

- missing or malformed worker result;
- exit zero with absent expected output;
- stale result artifact;
- evidence belonging to another Assignment/Run;
- dirty-before file claimed as new output;
- mutating claim with no post-run delta;
- dispatch rejection before launch;
- timeout/non-zero exit with misleading success text;
- retry preserving prior Run and evidence;
- RunResult persistence failure not reported as success;
- crash after `admitted` before `launched`: reconcile finds no runtime, admits
  no duplicate;
- crash after `launched` before `bound`: orphan runtime reconciled by `runId`;
- delivery `unknown` never classified as launch failure;
- second controller on an un-settled Run refused;
- coordinator restart does not reset `attempt`;
- superseded Run's late result stored and validated, never accepted as the
  Assignment's authoritative result.

Implementation-era detail remains in [Step 03](../roadmap/team-dispatch-v1/step-03-assignment-runresult.md)
and [Step 04](../roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md).
