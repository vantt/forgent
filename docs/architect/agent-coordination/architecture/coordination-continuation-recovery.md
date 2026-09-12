---
area: agent-coordination-runtime
updated: 2026-09-11
coverage: proposed
---

# Coordination Recovery Planning And Session Continuation

Design status: PROPOSED detailed contract. Implementation: not implemented.
Read [Runtime Recovery Design](runtime-recovery-design.md) for identity, ownership,
versioning and proof. This file owns next-action planning and legal cross-session
transfer. It does not choose an executor, manage RunHandle state or redefine quorum.

## 1. Meaning And Boundary

Reconnect retains a Run. Retry creates a Run for the same Assignment. Actor
replacement uses the existing role-preserving engine door and retains old
Assignment membership. Session continuation creates a new ledger with fresh
execution authority. None implies a cell is complete.

Cell-to-session relationships belong to the consuming track, represented by
optional correlation, not a new core Cell object. In-cell worker takeover requires
no checkpoint. Deliberate cross-session continuation uses a declared protocol
entry and transfer policy; it never sets a graph cursor arbitrarily.

Application service reads stores/adapters -> snapshot builder calls existing
evaluators -> pure planner selects typed action -> existing command handler
revalidates and mutates. CLI/request builder is presentation/serialization only.
Planner imports value types and pure evaluator outputs, not stores or adapters.

## 2. Snapshot Contract

ContinuationSnapshotV1 has these required fields; optional collections default to
empty only when their read completed successfully. A failed read is represented
by `readFaults`, never an empty graph/result set.

| Field | Definition |
|---|---|
| contract | `coordination-continuation-snapshot.v1`. |
| coordinationId, sessionRevision | Session identity and replay event count. |
| definition | null for agent-led; otherwise `{id, version, digest}` validated against the bound definition. |
| policyRef | Version/digest of planner ordering policy, not dispatch policy. |
| manifest | `{status, createdAt, writerId, aggregateBounds, partialPolicy, actors, workUnits}`; validated projection of session fields. |
| bindings | BindingStateV1 array from existing graph/authorization evaluator. |
| runs | RunSummaryV1 array for session-owned Assignments. |
| results | ExistingResultV1 array from runtime/result read ports. |
| completion | `{canCloseFull, canClosePartial, missingBindingIds[], blockers[]}`; existing quorum/disposition/aggregation evaluator verdicts. |
| budgets | `{elapsedWallTimeMs, remainingWallTimeMs, assignmentsUsed, roundsByActor, concurrencyUsed, grants[]}`. |
| transfers | TransferSummaryV1 array and eligible transfer offers from the engine evaluator. |
| readFaults | `{scope, subjectRef, code}` array; failed critical reads block relevant mutation advice. |
| now | Injected UTC time used for this evaluation. |

BindingStateV1:
`{bindingId, nodeId, operationId, actorId, invocationOrdinal,
activation, authorizationId, invocationKey, taskKey, assignmentId,
state, legalNext, contextGrantRefs, inputRevision, blockers}`.
Nullable IDs explicitly mean not issued. State is unissued/authorized/materialized/
settled; activation is required/driver-authorized. `legalNext` is a typed evaluator
verdict: dispatch, request-authorization, request-disposition, wait, none.
The evaluator, not planner, validates graph reachability, visibility, specialist
allocation, invocation caps and aggregation/disposition. Repeated invocations have
different binding identity including authorization or input revision.

RunSummaryV1:
`{assignmentId, runId, attempt, admissionKey, phase, current, supersededBy,
delivery, settlementRef, execution, handleId, pause, runtimeRecovery}`.
Nullable fields mean unavailable/not present. `runtimeRecovery` is
collect/observe/reconcile/replacement-eligible/park with evidence refs, supplied
by runtime use case; planner does not infer effect eligibility from handle presence.

ExistingResultV1:
`{assignmentId, runId, artifactRef, artifactDigest, kind, normalization,
linkState, ownership, publishEligibility}`.
Kind is receipt/raw-result/normalized-result; normalization is pending/valid/invalid/
not-applicable; linkState is unlinked/current/historical. Ownership is verified/
foreign/unknown; publishEligibility is current/superseded/unknown.
Normalized-but-unlinked is a first-class crash window. Receipt alone never gets
a collect-and-link action. Invalid/foreign artifacts remain diagnostic and do not
mask another valid result.

Agent-led sessions can collect/observe/retry under existing authority and report
completion using their own evaluator. Protocol continuation is unsupported without
a declared destination/entry policy; null definition is not a schema error.

## 3. Typed Plan And Priority

ContinuationPlanV1:
`{contract: coordination-continuation-plan.v1, coordinationId,
basedOn: {sessionRevision, definitionDigest, policyDigest},
actionKey, action, hazards[], evaluatedAt}`.

| Action kind | Required payload and authority |
|---|---|
| collect-result | assignmentId, runId, artifactDigest; engine validates/normalizes then links only if eligible. |
| observe-run | runId; runtime refresh/reattach through owning adapter. |
| recover-assignment | assignmentId, expectedRunId; runtime reconciles, then may choose eligible replacement. |
| dispatch-authorized | bindingId, authorizationId or required activation identity, taskKey, inputRevision. |
| request-authorization | bindingId, proposed invocation identity, permitted context refs; requires driver decision. |
| request-disposition | nodeId, evidence revision, allowed disposition choices; requires authorized driver/person under existing rules. |
| close-session | mode full/partial, completion verdict revision; existing engine decides. |
| continue-session | transfer offer identity, grantRef, expected parent revision; apply uses section 6. |
| wait | targetRef, reasonCode, nextCheckAt optional. |
| refuse | targetRef, reasonCode. |

Priority: recover pending apply/transfer first; collect valid unlinked results;
identify live/unknown Runs and park only their affected bindings; select an
independent legal dispatch if budget allows; surface missing driver decisions;
close only if evaluator allows and no transfer blocks it; otherwise consider a
legal continuation offer when the session cannot progress. Stable selection uses
bindingId/runId ordering; waiting on one binding cannot starve another runnable
binding. Cancellation permits collection/observation but suppresses execution and
automatic continuation. No `command: string` or hidden shell rendering.

Hazards/reasons are typed: state-unreadable, definition-drift, result-invalid,
result-foreign, run-live, run-unknown, effect-unknown, budget-exhausted,
budget-authority-missing, partial-policy-missing, authorization-task-key-conflict,
context-transfer-forbidden, transfer-unavailable, transfer-pending,
transfer-payload-conflict, transferred-scope, stale-plan, cancelled,
owner-runtime-unavailable, unsupported-version. Display messages are not branching
inputs. Errors include subject refs and whether re-read can resolve them.

## 4. Action Identity And Apply

Canonical hashing: UTF-8 canonical JSON with sorted object keys, no undefined
values, integer counters, explicit nulls; semantic sets sorted/deduplicated by
identity, ordered execution sequences preserved. Use full SHA-256. Identity does
not include observedAt, evaluatedAt, filesystem enumeration order or temporary
paths. Wire timestamps are UTC but are not semantic keys.

Action keys:
- collect: session + assignment + Run + normalized/raw artifact digest;
- dispatch: session + binding + authorization/required invocation + input revision;
- recover: assignment + expected current Run + recovery purpose;
- close: session + mode + completion evidence revision;
- transfer: parent + transferPointId + transfer generation (section 6).

Mutation replays under locks; lookup an already-completed action before stale-plan
refusal. Same key/payload returns prior outcome. Same key/different semantic payload
refuses. Pending action resumes rather than allocating another identity.
Existing task claims/authorization identities remain the dedup mechanism for their
own operations. Transfer uses its own session event state because it spans ledgers;
do not add a generic applied-action database beside every existing door.

Run/outbox changes are not covered by sessionRevision. Apply re-reads result,
current Run, cancellation, authorization, workspace and budget before admitting
execution; it uses the lock order and launch linearization in the Run amendment.
Read-only show never records a claim or refreshes a handle.

## 5. Protocol Transfer Declaration

Proposed optional `CoordinationProtocol.profile.continuation.points[]`:
`{id, sourceScope, prerequisites, destination, inputs, allowedTrigger}`.

| Field | Meaning |
|---|---|
| sourceScope | session in the first profile; future binding-set scope must be explicitly supported. |
| prerequisites | Refs to existing completed binding/result/disposition requirements. No expressions, scripts or second predicate language. |
| destination | `{definitionId, version, digest, entry: graph-entry, requestTemplateRef}`. Entry must be the destination's actual declared graph entry. |
| inputs | Named slots mapping bounded source artifact roles to destination input slots; required flag and visibility constraints. |
| allowedTrigger | exhausted / immutable-shape / explicit-handoff; no implicit cancelled-intent recovery. |

Validator rejects dangling prerequisite refs, invalid destination input mappings,
unknown scope, unsupported version or an arbitrary destination node. Definition
resolution/validation is through the existing loader; request template is validated
data, not executable code or worker-authored authority. Target operations still
use normal Assignment building and dispatch governance.

First supported point: after candidate/review artifacts are stable, start a
repair-and-recheck protocol from its entry. That protocol validates imported
candidate/findings, freshly authorizes mutation as required, and obtains fresh
independent review/disposition. Old findings are inputs, not child quorum.
A task interrupted before a transfer point uses within-session recovery first.
If no point is legal and parent cannot execute, return transfer-unavailable with
missing prerequisites. A future explicit restart-from-entry point can consume
partial material, but cannot mark prerequisite operations completed.

A protocol with no continuation profile behaves exactly as before. This design
does not globally rewrite partialPolicy, graph reachability or close semantics.
C-a/C-b fixes remain the named engine backlog; C-c consumes an existing fresher
authorization with a distinct identity-derived taskKey, not an extra authorization.

## 6. Transfer Record And Transaction

TransferV1 is projected from the parent's schema-2 events:
`{transferId, generation, parentCoordinationId, pointId, childCoordinationId,
status, sourceRevision, sourceScope, payloadDigest, destination,
imports[], grant, workUnits[], preparedAt, committedAt?, abortedAt?}`.
Status is prepared/committed/aborted. Generation advances only by explicit engine
event after an aborted proposal or later distinct transfer; replan never increments
it merely to avoid a collision.

Child ID = `coord_` + SHA-256(parentCoordinationId, pointId, generation).
Transfer ID uses the same semantic tuple with its own namespace. Parent has at
most one non-aborted whole-session transfer. Child ID equality is insufficient:
existing child must match transferId, parent, writer identity and payloadDigest.

Grant is `{grantId, issuer, recipientScope, aggregateBounds, expiresAt?,
authorityRef}`. It is supplied by an authenticated/validated caller under the
existing driver trust boundary, never by a worker field asserting ownership.
The first profile grants a separate budget to exactly one child; grantId is
single-use within its declaring parent's grant records. A grant cannot be reused
in another parent scope. No automatic copying/resetting of parent bounds.
Shared chain budget is unsupported until a budget owner can atomically reserve
allocations across parents; reject that mode rather than accept an optional counter.

Imports:
`{importId, source: {parentCoordinationId, assignmentId?, runId?, artifactRef,
sha256}, destinationSlot, allowedActorIds[], grantRef, validationRef}`.
Create an immutable child-owned import manifest referencing pinned source content.
Resolve parent ownership, artifact digest and visibility before granting; a
parent-owned but unreleased artifact is not importable. Child authorization refs
resolve to this import namespace through the same context validator. No blanket
permission to read parent files, transcripts or sibling private material.
Confidential refs cannot leak through notes/objective text as a workaround.

Transaction, through the existing engine/store mutation doors:
1. Build/validate the candidate request and stage immutable import manifests.
   This performs no child admission and supplies no authority.
2. Under parent session then relevant Assignment locks, re-read source revision,
   artifacts, grant, no live/unknown affected Run, no pending launch/control,
   and no competing transfer. Append `continuation-prepared`, reserving grant
   and freezing parent new admission for the scope. This is the linearization
   point for ownership transfer preparation. A concurrent dispatch either
   reserved launch before this point (therefore blocks prepare), or is refused.
3. Create child manifest idempotently with `originTransfer` and input/grant
   fingerprint, using existing open-store publication/self-heal discipline.
   It may report active, but originTransfer imposes an execution gate: no
   Assignment may materialize until the parent transfer is committed.
4. Reacquire parent/child locks in sorted order, verify child fingerprint and
   current intent, then append `continuation-committed` to parent. Child
   admission reads this durable commit and its own matching originTransfer.
   Append an optional acknowledgement to child for presentation; it is not
   authority and may be rebuilt after crash.
5. Return child reference. Its normal command handler executes from legal entry.
   Parent history/late-result collection remains available; frozen scope cannot
   be reopened by another recovery request.

Prepared is irrevocable by timeout alone. Before commit, explicit cancellation or
invalid staging aborts under both locks: parent appends continuation-aborted,
release reservation, and child remains gated/gets cancelled if created. An aborted
child ID is never reused for another payload. Crash recovery completes the same
steps; it never rolls back by deleting records. Releasing the parent freeze after
abort does not restore expired budget or cancelled authority.

After commit the child owns fresh execution intent. Cancelling the parent alone
does not retroactively cancel independent child intent; a caller requesting chain
cancellation must explicitly name descendant scope, and engine applies it through
each existing cancellation door. Pending transfers are aborted. The UI/typed
outcome must distinguish parent-only from descendants so this is not a surprise.

Parent status is not changed to completed or partial merely by transfer. For an
active exhausted parent, status remains active with executionDisposition
derived as transferred. Close follows existing quorum/disposition only. A previously
terminal non-cancelled schema-2 parent refuses transfer in the first continuation
profile. No post-terminal bookkeeping event is appended. This keeps replay's
current rule that post-terminal events are neutralized. Supporting terminal
bookkeeping later is a separate versioned replay change, not an implicit
continuation feature. Schema-1 terminal ledgers are never silently upgraded.
Cancelled intent cannot auto-continue.

If a later profile needs an audit trail after terminal, it must introduce a
distinct non-authoritative event class (for example, an external transfer
receipt) whose replay treatment is explicitly specified. It must never be
interpreted as a continuation mutation, quorum input, or status transition.

## 7. Crash And Refusal Table

| Window | Resume result |
|---|---|
| Before prepared | No authority changed; repeat validation/staging. |
| Prepared, child absent | Same transfer creates same gated child. |
| Child partially published | Existing open-store recovery verifies/completes same fingerprint; no dispatch. |
| Child exists, parent not committed | Revalidate and commit or explicitly abort; no alternate child. |
| Parent committed, acknowledgement absent | Child gate reads parent commit, acknowledgement rebuilt. |
| Already committed, duplicate call | Return same child regardless of original plan revision. |
| Different child payload for same transfer | transfer-payload-conflict; do not overwrite or mint another generation automatically. |
| Late parent result after prepare | Store/validate per Run; it cannot silently rewrite frozen import set. Before commit revalidate material changes; abort/replan if required. After commit surface late evidence to child, never inject quorum. |
| Runtime unknown during prepare | Park this transfer; do not freeze unrelated sessions/work. |
| Source/destination version drift | Refuse before commit; no resolver fallback to another protocol. |

No multi-directory atomic transaction is claimed. Durable prepare + gated child +
single authoritative parent commit is the recovery protocol. Writer tests must
inject termination at every step and prove the same public recover door completes.

## 8. First Profile And Future Scope

Default continuation transfers whole-session execution responsibility at a
declared legal point, with no affected live/unknown Run and a separately granted
child budget. Cell correlation may be retained but never grants acceptance.

Future partial transfer must define exact binding ownership and collision checks;
future live transfer must fence old writers and queued commands; future shared
budget must have an allocation authority. Unsupported requested modes return a
typed refusal. None is silently approximated by default behavior.

Existing actor replacement stays separate: old membership is immutable, replacement
inherits role and new dispatch rechecks governance. There is no requirement to open
a child session simply to use another executor on one Assignment.

## 9. Implementation And Proof

Schema changes go through existing coordination and request validators, store,
replay, engine, run/show/chain and protocol loader. No new Work status, Mission
entity or graph interpreter. New file schema formats/contract versions require
explicit supported-version checks; the Node writer is amended before Rust port.

Primary proofs C-a..C-g, X06..X11 are in
[the proof matrix](runtime-recovery-design.md#10-proof-matrix).
Planner-only S4 proves deterministic advice and correct missing facts; it does
not claim S5's apply/transfer proofs. Open/close fixes tsk-5qj/tsk-40j/tsk-296 and
typed refusal tsk-1zu remain prerequisites where their behavior is exercised;
wall time is always measured from createdAt (tsk-oed).
