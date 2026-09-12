---
area: agent-coordination-runtime
updated: 2026-09-11
coverage: proposed
---

# RunHandle And Recovery Material

Design status: PROPOSED detailed contract. Implementation: not implemented.
Read [Runtime Recovery Design](runtime-recovery-design.md) first for ownership,
local locking, version rollout, proof IDs and the long-horizon scope. This file
owns runtime observation/control and recoverable-state capture, not Run admission
or session policy. Two ports (repository/runtime) and one guard application service.

## 1. Identity And Facts

RunHandle identifies a runtime resource for one admitted Run. Losing it does not
authorize another Run. Assignment identity and acceptance remain immutable;
runtime locator is opaque outside its adapter.

| RunHandleV1 field | Type / semantics |
|---|---|
| contract, id, revision | `run-handle.v1`, opaque stable id, nonnegative integer CAS revision. |
| subject | `{assignmentId, runId, attempt}`; validated against committed Run admission. |
| ownerRuntime | `{kind: node or rust, releaseRef}`; immutable spawning implementation, not PID. |
| controller | Optional current lock-token reference; diagnostic projection of lock store, never lock authority. |
| runtime | `{adapter, locator}`; adapter name versioned/namespaced; locator adapter-validated. |
| role | driver / observer / replacement. |
| capabilities | Supported operations: inspect, snapshot, send-input, rename, terminate, reconcile-command. |
| execution | launching / running / paused / unknown / terminated. No success/done state. |
| attachment | attached / detached; observer connection, independent of execution. |
| observation | ObservationV1 below, nullable until first observation. |
| delivery | not-sent / sent / unknown; mirrors Run fact via the runtime writer, not a second authority. |
| pause | Optional `{reason, retryAfter?, rawMessageRef?}`; reasons provider-limit, awaiting-operator, transport-backpressure, unknown. |
| diagnosticRefs | DiagnosticRefV1 array; empty allowed. |
| createdAt, updatedAt | UTC timestamps; not identity inputs. |
| displayName, labels | Optional presentation metadata; never lookup/permission keys. |

ObservationV1: `{sequence, observedAt, source, liveness, agentState,
lastProgressAt, outputBytes, lastOutputAt, freshness}`.
Liveness is present/absent/unknown; agentState is working/idle/blocked/unknown.
Nullable progress/output timestamps mean unavailable. Freshness is fresh/stale.
Sequence belongs to this observer and allows its classifier to avoid counting
one probe twice when a subsequent screen read completes that same observation.

The signal ladder owns classification. Caller threads absentStreak, lastProgressAt
and blindMs, not the session graph or Guard. Restart resets absence streak and
treats unobserved elapsed time as blind for idle; absolute ceiling still uses
the original Run start time. Worker result is normalized before any runtime
reading is used to admit replacement. Receipt is delivery evidence, not result.

## 2. State Transitions

| From | To | Required fact |
|---|---|---|
| launching | running | Worker receipt/progress identified by adapter; transport ack alone need not mean execution started. |
| launching/running | paused | Explicit pause/provider-limit observation. |
| launching/running/paused | unknown | Runtime cannot currently establish execution; preserve last pause metadata. |
| unknown | paused | Inspection confirms pause; do not convert a limit screen into running. |
| unknown | running | Positive progress and matching incarnation; not merely a successful gateway request. |
| paused | running | Positive progress/resume confirmation; expiry of retryAfter is only an inspect trigger. |
| any nonterminal | terminated | Confirmed worker stop under declared coverage, or ladder death under matching identity. |
| terminated | terminated | Terminal resource fact; reattach cannot revive this incarnation. |

A paused worker proven dead can become terminated without a user kill request.
This differs from initiating termination of a paused worker, which is guarded.
The Run may be settled while its pane remains open. Observation freshness can
be stale while execution remains running. A transient caller timeout changes
freshness, not automatically execution.

DiagnosticRefV1: `{kind, ref, sha256?, capturedAt}`. Kinds: stdout-log,
stderr-log, pane-snapshot, process-info, worker-result, confinement-attestation.
Worker-result refs still pass the normalizer. A diagnostic is not quorum evidence.

## 3. Ports And Control Outcomes

RunHandleRepository supplies:
- `get(handleId)`, `list({runId?, assignmentId?, adapter?})`;
- `put(handle, expectedRevision)` with atomic CAS;
- `acquireControl(runId, holderIdentity, purpose)` returning a unique lock token;
- `releaseControl(token)`, idempotent for that token only;
- `readPending(runId)`, `recordPending(command, token)`,
  `recordOutcome(commandId, result, token)`.

Lock semantics and physical publication are defined once in
[Local Concurrency And Durability](runtime-recovery-design.md#6-local-concurrency-and-durability).
Purpose is bind/drive/terminate/recover. Observers doing pure reads take no lock;
an explicit refresh that writes observations takes the writer guard. Every handle
of a Run resolves to the same control lock. Owner runtime and holder process
are different identities. Cross-runtime control routes to the owner or refuses.

RuntimeAdapterPort supplies:
- `launch(runId, preparedInvocation, commandContext)`;
- `reconcileLaunch(runId, launchCommandId, commandContext)`;
- `inspect(locator, commandContext)`;
- `sendInput(locator, input, commandContext)`;
- `snapshot(locator, commandContext)`;
- `rename(locator, displayName, commandContext)`;
- `terminate(locator, {graceMs, force}, commandContext)`;
- `reconcileCommand(commandId, locator?, commandContext)`.

All are asynchronous typed results; none writes a Run/handle or chooses policy.
CommandContext is `{commandId, payloadHash, cancellation, deadlineAt}`.
Mutating commandId is stable per logical command, not per CLI invocation.
Same commandId/different payloadHash refuses. Read IDs are diagnostic, not dedup
claims. An unsupported operation fails by code before attempting its effect.

| Operation | Typed result variants |
|---|---|
| launch/reconcileLaunch | found(locator, incarnation) / absent-proven / pending / unknown. Launch failure also carries not-created proof or unknown. |
| inspect | observed(ObservationV1, incarnation match/mismatch/unknown). |
| sendInput | delivered(receiptRef) / not-delivered(proofRef) / unknown(commandId). Sent-without-ack is unknown. |
| snapshot | captured(refs, coverage complete/partial, omissions[]) / unavailable(reason). |
| rename | applied / already-applied / unknown(commandId). |
| terminate | stopped(coverage, proofRef) / still-live / unknown(commandId). |
| reconcileCommand | applied(originalResult) / not-applied(proofRef) / pending / unknown. |

Errors: `{code, message, handleId?, runId?, retry: never | reconcile | later}`.
Codes: handle-not-found, subject-mismatch, revision-conflict, control-held,
incarnation-mismatch, incarnation-unknown, capability-unsupported, active-close-refused,
locator-invalid, adapter-failed, version-unsupported, owner-runtime-unavailable,
command-payload-conflict, pending-command-unknown, run-handle-missing.
CLI prefixes these with `run-handle-` in its public error namespace. Cancellation
before submission returns not-applied; after possible submission it returns
unknown unless an outcome is reconciled. No promise that aborting a Promise stops
a remote command.

## 4. Guard Sequence

Bind checks committed Run identity and owner, reconciles launch, validates locator
incarnation and persists the handle before work input. Missing binding after a
crash invokes reconcileLaunch; it never reruns launch merely because a handle
file is absent. The Run contract defines crash admission behavior.

Deliver/rename/terminate:
1. Acquire per-Run control; re-read Run and handle revision.
2. Reconcile pending command before a new mutation. Unknown leaves the Run parked.
3. Verify caller authority, current admission where required, exact target and
   adapter incarnation. Capability is not permission.
4. Persist pending command with stable key/hash before submission.
5. Submit once; persist typed result and corresponding facts. Crash before step 5
   leaves a command that the next controller must reconcile.

Every control critical section releases its token in `finally` and appends a
release marker, including cancellation and adapter-error paths. This invariant
is required for Node/R1-R2. An operator force-release door for a live process is
deferred to R3; if introduced, it must carry explicit attestation and audit
evidence and is never a TTL-only steal.

The pending record is stored even when delivery was never acknowledged. Adapter
launch/control must supply either idempotent command execution or authoritative
reconciliation before safe repetition. An adapter with neither cannot advertise
automatic takeover for this scenario. This protects correctness without pretending
local filesystem locks fence remotely queued input.

Termination requires exact handle identity for an active/unknown Run, separate
operator authority and diagnostic snapshot where obtainable. Automated cleanup
cannot force-close paused-limit. A user's explicit force intent may do so, but
stopped must name coverage: resource-only / worker-tree / write-access-revoked.
Closing a pane proves only resource-only; setsid descendants may remain. Only
worker-tree or proven write-access-revoked satisfies writable takeover. Snapshot
failure is recorded; it must not prevent urgent explicitly authorized cancellation.

Herdr launch identity is a durable run-scoped key. The gateway-side adapter must
be able to look up a resource by that key before locator persistence completes.
For the current Herdr client, a deterministic agent/resource name derived from
`runId` is one possible strategy (and the only currently exposed `agentGet`
strategy); a gateway registry or idempotent launch record is preferable when
available. Gateway identity + agentSessionId + pane coordinates are then checked
against the gateway at each control. Process locator: host/boot + pid/startTime,
and process-tree or confinement ownership when required. `agent_session` is
correlation, not proof an old gateway command cannot affect a new resource.
Mismatch/unknown refuses destructive control. If a crash occurs before the
locator is persisted, reconciliation is possible only through this deterministic
run-scoped identity; adapters without that primitive remain observe/park only.
Unknown adapter permits metadata reads but no control.

## 5. RecoveryMaterialV1

Recovery material is optional to task correctness but necessary to claim partial
work was preserved. It is not a required worker-written checkpoint.

| Field | Meaning |
|---|---|
| contract, materialId | `run-recovery-material.v1`, digest of canonical manifest. |
| assignmentId, sourceRunIds | Immutable task and admitted contributing attempts. |
| level | baseline / recoverable-state / declared-checkpoint. |
| base | Original input/baseline refs with digests. |
| workspace | Resource identity and captured manifest ref; never an arbitrary worker-supplied path. |
| artifacts | `{ref, sha256, originRunId?, attribution: observed or verified}` array. |
| verification | `{resultRef, testedSnapshotDigest}` array; stale results remain labeled stale. |
| notes | Optional untrusted note refs, timestamped; absence allowed. |
| effects | Operation-specific reconciliation refs; no generic false=no-effect assumption. |
| writerQuiescence | `{status: confirmed or unknown, coverage, proofRef?}`. |
| capture | `{coverage: complete or partial, omissions[], capturedAt}`. |
| checkpoint | Only for declared-checkpoint: `{adapter, version, payloadRef, inputDigest}`. |

The operation recovery adapter implements `capture(inputs)` and
`validateMaterial(material, currentInputs)`. The coding adapter captures tracked,
staged and untracked permitted artifacts, file deletions/modes and baseline
identity; a git diff alone is not a complete workspace manifest. Capture occurs
after writer quiescence and under workspace ownership coordination. Unknown
external writers or concurrent changes make the capture partial/invalid, never
a consistent checkpoint. Private/ungranted paths and credentials are excluded;
omissions are explicit. Large artifacts can remain content-addressed refs with
retention pins rather than copied bytes.

Takeover passes an envelope `{assignmentRef, sourceRunIds, materialRef,
workspaceGrantRef}` into the replacement invocation; it does not mutate Assignment.
The replacement gets original objective/constraints, current verified facts and
explicit uncertainty. It must inspect partial edits before continuing. The runtime
holds the exclusive writable-resource grant across replacement; concurrency checks
use workspace identity, not just Assignment identity. Different Assignments sharing
a workspace are not currently serialized by a workspace owner. `workspaceGrantRef`
is valid only when issued by a named workspace-grant repository, or by the
Work-runner's existing worktree claim in that profile. Until that issuer and lock
scope exist, shared writable takeover returns `workspace-authority-unavailable`
and parks; read-only or isolated snapshots may proceed.

Material is evidence input, not acceptance. Current-run output and inherited work
are labeled separately. Missing capture permits baseline restart only when operation
effect policy and workspace handling authorize it; never silently discard user
edits. General external-effect protection is defined in the fallback contract.

## 6. Persistence And Supported Profile

Default: `runDir/run-handle.json` stores
`{contract: run-handle-store.v1, revision, currentHandleId, handles[], commands[]}`.
Retired handles stay in this small per-Run envelope, detached and not selectable
as current; exact-ID reads still resolve them. New binding changes currentHandleId
under CAS. Commands are append-preserved records with reconciled outcome; no
independent control ledger/database. Run owns admission/delivery truth; the envelope
is an operational projection repaired from Run and adapter facts.

Recovery manifests live under `runDir/recovery/<materialId>.json`, immutable
with referenced snapshots pinned while any active attempt/transfer needs them.
Retention compaction cannot delete active dependencies. These are local runtime
artifacts, not committed Work truth. Corrupt authoritative state fails closed;
missing diagnostic projection is repairable.

RunHandle replaces `visibility.json` as binding authority for the new writer
profile. During transition, legacy visibility is a one-way projection; no dual
writer and no silent adoption of an unknown legacy live binding. Old schema-1 Runs
remain on their legacy path. Existing `show` reads do not refresh or write files.

First adapter: herdr with explicit capability proof for launch discovery,
incarnation and command reconciliation. Process/remote adapters implement the same
ports later. Until supported, they return a named unsupported recovery outcome
and remain on their declared legacy execution profile, not universal RunHandle
guarantees. S2 cannot ship automatic writable takeover solely on pane-close proof.

Setup/doctor: local atomic publication/fsync support, handle/material directory
writability, adapter capabilities, quiescence coverage and retained pending-command
diagnostics. No new config precedence. All runtime paths are resolver-owned.

## 7. Proof And Deferred Scope

Primary proofs F-a..F-g and X01..X05/X10 are specified once in
[the proof matrix](runtime-recovery-design.md#10-proof-matrix).
Also exercise every state transition and cancellation before/after submission.
Default needs no distributed lease, generic checkpoint framework, full worker
memory snapshot, health store or dashboard. Future adapters must explicitly
advertise checkpoint/remote-control support rather than accepting arbitrary blobs.
