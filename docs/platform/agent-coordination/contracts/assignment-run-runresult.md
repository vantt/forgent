# Assignment, Run, And RunResult Contract

```txt
Document type: Contract
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Assignment | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/assignment.mjs:17,276; assignment-normalizer.mjs:2-20 (stamps mutation/evidence.required); assignment-runner.mjs:431,560,574 (provenance.kind inline/declared/unit-run) |
| Run | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:697-940 (admitRunAttempt, attempt numbering, prior Runs kept), :1565-1590 (run.json contents) |
| Run Phases And Admission | Mixed implementation and proposal; no blanket implementation claim | assignment-runner.mjs:932 admission-run-in-flight, :784 expectedRunId refusal, :1941 result-corrupt, :1016/2024 publishMutableProjection/publishMarkerOnce; run-lock.mjs acquireRunControl/buildRunControlHolder/resolveHolderLiveness (assignment-runner.mjs:70-81); runtime-inspection.mjs:160 VALID_PHASES; git grep run-retried src -> none |
| Proposed Runtime Recovery Amendment | Mixed implementation and proposal; no blanket implementation claim | assignment-runner.mjs:1565-1585 writes contract 'assignment-run.v2' with phase/delivery/supersedesRunId/retryId/payloadDigest; launchCommandId at :2118; recovery-planner.mjs:251-327 (snapshotHash, expectedControlEpoch, actionKey); admission-* refusal codes at :917-940; admitRun/admissionKey/authorityRef/writerRuntime not in src |
| RunResult | Current contract/invariant | src/runner/dispatch/run-result.mjs:350-385 (normalizeRunResult fields), :1305-1325 (runOutcome) |
| Dispatch Operability Addendum | Current contract/invariant | src/runner/dispatch/run-result.mjs:7,22-23 (legacy-derived, contract-corrupt); agent-result-claim-contract.mjs:5 (claim v2); runtime-inspection.mjs:255; test/runner/dispatch-operability-production-door.test.mjs |
| Confidence | Current contract/invariant | src/runner/dispatch/run-result.mjs:1276-1285; packages/run-result/rust/src/lib.rs:129 CONFIDENCE_LEVELS; assignment-normalizer.mjs:67-69 |
| Evidence Freshness | Current contract/invariant | src/runner/dispatch/evidence-attribution.mjs:10 (levels proven/correlated/excluded/unattributed), :69,:197; test/runner/evidence-attribution.test.mjs |
| Work Boundary | Current contract/invariant | docs/specs/runner.md:3072-3081 (0049); no src/state import in src/runner/dispatch or src/runner/execution |
| Required Negative Tests | Mixed implementation and proposal; no blanket implementation claim | test/runner/assignment-runresult.test.mjs, evidence-attribution.test.mjs, run-lock-identity.test.mjs, dispatch-liveness.test.mjs; items about 'superseded Run late result' tied to run-retried (retired) |

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
`provenance.kind = declared | inline` in the original decision, with policy/normalizer versions and the validator chain. The normalizer stamps `mutation` and `evidence.required` onto the immutable snapshot. Current Unit-run provenance is also accepted by the dispatch path. Evidence: src/runner/dispatch/assignment-normalizer.mjs:2-20; assignment-runner.mjs:431,560,574. The former read-only first-slice restriction is historical, not a current blanket inline restriction.

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

Three guarantees, kept distinct:

- **Control fencing** — one controller per un-settled Run, implemented via
  `run-lock.mjs`'s exclusive-create generation ledger (`acquireRunControl`/
  `releaseRunControl`). Holder identity is `{id, pid, bootId, processStartTime,
  host}` (`buildRunControlHolder`); reclaim requires proven-dead identity
  (`resolveHolderLiveness`) — a live PID, a PID whose liveness cannot be
  disproven, or a PID reused after a host reboot is never mistaken for a dead
  holder's slot. Observers hold no lock. A controller that lost the lock may
  not deliver input, terminate, or write Run/RunHandle state.
- **Result fencing** — a superseded Run loses the right to publish the
  Assignment's authoritative result (`result-linked` after `run-retried`).
  Its late result is still stored and validated: it may prove an effect
  already happened.
- **Effect protection** — deduplication or isolation at the place the effect
  occurs. Owned by the operation contract and its adapter. Run promises no
  exactly-once external effect; a stopped worker does not mean its effects
  are absent.

Current admission uses deterministic Run identities, attempt numbering and existing-result refusal in `src/runner/dispatch/assignment-runner.mjs:697-940`. Run control is epoch/token-fenced in `run-lock.mjs:306-412`; corrupt settlement refuses rather than relaunching. `runtime-inspection.mjs:160-175` recognizes phase observations including bound/delivered; that is not proof that every proposed RunHandle transition/schema below has been implemented.

The former session `run-retried` event-order and result-link fencing rules are preserved in history. The current standalone Run record writes the implemented `assignment-run.v2` subset (`assignment-runner.mjs:1563-1590`). The admissionKey/admitRun/authorityRef/writerRuntime interface and stronger proposed supersession contract below remain design targets, not asserted runtime APIs.

### Proposed Runtime Recovery Amendment

Status: PROPOSED technical refinement beyond the implemented assignment-run.v2 subset, not an implicit
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

The former session-owned retry allocation is historical, not an available session-engine mutation door. Current standalone admission and control fencing are owned by assignment-runner.mjs and run-lock.mjs.

Standalone runtime persists equivalent supersession intent with the new Run's
atomic admission record; the record itself is the declared equivalent, rather
than an unrelated event stream. The predecessor identity is required. A superseded
Run may still be physically alive: new writable execution still needs quiescence
or isolation/effect proof. Result fencing alone is insufficient.

**Proposed launch gate and crash reconciliation.** Under an Assignment-owned gate
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
runId eligibility under the runtime-owned admission/control boundary, serialized with retry
declaration/admission. A pending retry fences its previous Run at declaration;
after abort before admission, the previous Run regains eligibility only through
the explicit abort event. Other historical Runs never gain eligibility from a
generic `allowSupersede` flag. A late initial link is checked just like a later
replacement link. Accepted prior result remains readable as historical/current
last-published view until an eligible new result links; readers expose that it is
superseded for execution when a retry is pending.


Typed refusal reasons include admission-conflict, admission-payload-conflict,
retry-pending, authority-revoked, budget-exhausted, writer-not-quiescent,
launch-unknown, result-superseded, version-unsupported and owner-runtime-unavailable.
They carry subject refs; no caller branches on message prose.

**Proposed profile migration.** Enable stronger runtime profiles only after adapters prove launch reconciliation and bind-before-delivery. Do not force unsupported adapters to claim RunHandle support. Existing Node/Rust readers and writers must agree on the supported `assignment-run.v2` subset; the stronger fields above remain proposed unless their writer is cited. The retired session-schema migration design is retained only in history.

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

### Dispatch Operability Addendum

The dispatch-operability design track
(`plans/260914-dispatch-operability-evidence-attribution/`) now supplies RunResult
v2 interpretation and read-only Dispatch runtime inspection while preserving
`result.json` as the one terminal RunResult location:

- `RunResult` remains the only immutable terminal truth for a Run.
- `RunObservation` is a mutable read projection for in-flight, ambiguous, or
  incomplete facts; it cannot settle, retry, cancel, authorize, or clear a
  guard.
- `ProviderOutcome` is a host-invocation wrapper, not Run truth.
- `agent-result.json` becomes `agent-result-claim.v2`, a worker claim consumed
  by the normalizer, never independent proof.
- New v2 results classify execution, assessment, confidence, failure, policy,
  delivery, and provenance separately.
- Historical v1 results are interpreted deterministically as `legacy-derived`
  and are not rewritten on read.
- A v2 result whose compatibility `status`/`confidence` disagrees with its
  classification is `contract-corrupt` and fails closed.

The accepted design authority is
`plans/260914-dispatch-operability-evidence-attribution/contracts/run-result-and-observation.md`.
The implementation proof for this slice is
`test/runner/dispatch-operability-production-door.test.mjs`, which exercises
the production Assignment door, public inspect CLI, historical/replayed result
interpretation, and negative reconciliation routes. Reconciliation remains
guard/projection repair only; it does not recover, retry, relaunch, resume,
reattach, reassign, take over, admit, cancel, kill, or signal execution.

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

Implemented evidence attribution makes this distinction explicit (src/runner/dispatch/evidence-attribution.mjs:10,69,197): pre/post Git
snapshots provide correlation only, not proof of process authorship. Attribution
levels are `proven`, `correlated`, `excluded`, and `unattributed`; only
adapter/confinement evidence with declared positive coverage can produce
`proven`.

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

Implementation-era detail remains in [Step 03](../history/retired-engine/files/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#literal-snapshot)
and [Step 04](../history/retired-engine/files/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#literal-snapshot).

