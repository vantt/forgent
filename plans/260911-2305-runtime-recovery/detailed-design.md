# Runtime Recovery Detailed Design

**Status:** DESIGN READY; IMPLEMENTATION HANDOFF ON HUMAN HOLD  
**Parent lock:** [architecture-decision-lock.md](architecture-decision-lock.md)  
**Implementation:** not authorized until review findings are closed

## Common Shape

The recovery use case is a thin application service. It reads a snapshot,
asks pure evaluators for legal actions, calls ports for external evidence, and
commits one mutation through the existing write door. Adapters never decide
policy. The stable flow is:

```text
read snapshot -> evaluate -> collect evidence -> re-evaluate -> plan one action
-> execute through write door -> append event -> project state
```

Every evidence record carries `schemaVersion`, `observedAt`, `source`,
`observationId`, and `confidence: proven|unknown`. Unknown is never coerced to
absent or safe.

## Phase Designs

### S0 / P00: Baseline Freeze

**Owner:** documentation and test fixtures.  **Mutation:** none.

Capture current retry matrix, blocked/paused-limit behavior, Herdr
resend-until-ack, close-after-steps, lock reclaim and result fencing. Fixtures
must reproduce BL1 and label current behavior as baseline, not desired policy.

**Exit:** focused suites green, fixture outputs recorded, no capability flag
enabled. This phase may run before all other designs.

### S1 / P01: Run Admission and Fencing

**Ports:** `RunStore`, `EventLog`, `ControlLock`, `Clock`, `ProcessEvidence`.
**Single owner:** Assignment-owned Run admission/write door.

Admission atomically checks Assignment version and active Run, creates a new
`runId` with `retryId`, predecessor, destination and payload digest. A retry with the same idempotency key
returns the existing Run; a different destination or digest refuses.

`attempt` fences supersession between Runs. Separate `controlEpoch` and
`controlToken` fence controller acquisitions within one Run. Result settlement
checks Run id, attempt, current control token, adapter-proven resource
incarnation and payload digest.
Stale results become typed `stale-run-result` and cannot mutate current state.
Lock release executes in `finally` and writes a release marker; marker absence
does not prove death. PID-dead evidence may reclaim; a live PID remains HELD.

**Crash matrix:** before admission commit, after Run commit, before launch,
after launch/before locator, before result, during release. Each row must have
one deterministic outcome and replay proof.

### S2 / P02L-P02H: Adapter-Profiled Launch Reconciliation

**Ports:** `LaunchRegistry`, `LocatorStore`, `WorkerTransport`,
`IncarnationProbe`, `RunHandle`.
**Adapters:** default local `cli-spawn` supervisor profile and Herdr Node
bwrap observe/park profile. Shared prepared-invocation seam:
[phase-designs/confinement-adapter-contract.md](phase-designs/confinement-adapter-contract.md).

P02L runs Assignment-owned CLI executions through a small Node supervisor.
The canonical implementation contract is
[`phase-designs/cli-spawn-local-contract.md`](phase-designs/cli-spawn-local-contract.md).
Confinement Authority first persists an immutable prepared-launch envelope
with the fully resolved invocation and execution options. The controller
persists the pre-launch evaluator baseline and owns command outcome. The
supervisor self-publishes process incarnation, durable protected stdout/stderr capture and
a protected adapter receipt, and executes exactly that envelope with the worker
in a process group distinct from the supervisor. Coordinator death therefore
does not erase the only process/output evidence. Only the current controller
collects the receipt into command outcome and Run settlement. Legacy ad-hoc
`cli-spawn` remains unchanged. Pending without binding parks; it is never
submitted again merely because the coordinator disappeared.

P02H's launch record is keyed by durable `runId` and includes launch request
digest, Authority-prepared invocation digest, gateway `agentSession` correlation,
adapter-proven resource incarnation, deterministic name (aid only), and locator
persistence state. Herdr starts the Authority-prepared worker command, including
bwrap argv when required confinement applies; Herdr remains transport and failure
detector, not Run truth. Before create, reconcile by launch identity. If identity
is unknown, inspect by aid and incarnation; never spawn when evidence is
ambiguous. Closed or mismatched resources produce `incarnation-mismatch`,
`unknown-launch`, or `no-resurrection` and park.

Locator persistence is ordered after the gateway resource exists but before a
replacement decision can be published. Recovery may reattach, observe,
collect after quiescence, or launch into isolated/read-only workspace. Shared
writable takeover returns `workspace-authority-unavailable`.

**Required races:** retry name collision, gateway restart/new session, same Run
different incarnation, crash between create and locator write, closed resource,
coordinator death with worker alive (F-b), duplicate spawn race (F-f).

### S3 / P03: Fallback and Effect Boundary

**Ports:** `ExecutorResolver`, `DispatchPlanReader`, `EffectGuaranteePort`,
`ConfinementPort`.

Fallback preserves original governance and records scoped fallback provenance.
Compiler mismatch parks until the compiler accepts that provenance. Operations
declare `repeatMode`; it is not inferred from mutation. Provider endpoints are
derived from the selected executor's `DispatchPlan.providerModel`. A filtered
provider-only scope can be eligible; network allow or an undeclared external
sink parks. A sink that can alter outcome must declare repeatability and a
dedup identity; telemetry-only duplicable sinks need no idempotency key.

### S4 / P04-P05: Read Evaluators, Planner and Public Door

**Ports:** existing session read projection and authorization/visibility seams.
No new durable plan-token store is introduced in the first profile.

Pure evaluators answer legal-next, authorization, visibility and completion.
Existing write doors call the same evaluators. The planner returns a typed
recommendation with observed snapshot hash, evidence ids, action and expiry.
`show --json` exposes it; `recover` rechecks the hash and executes exactly one
selected action. It never performs unconditional close-after-steps. Missing
driver replacement authority returns `needs-input`.

### S5 / P07: Continuation and Transfer

**Precondition:** CP section 6 amended and engine backlog closed.

The first profile refuses transfer from a terminal parent with
`transfer-unavailable`, remedy `open fresh session`, and premature-close hazard
counted in X11. Future transfer is protocol-declared and has prepared,
gated-child and committed events, a fresh authority, single-use grant and
replay version. Only event classes explicitly allowed by the amended contract
may be appended after terminal bookkeeping; replay preserves Rule #5.

`driver-replaced` requires current trusted-config operator authorization, a
single-use human-turn reference checked by `invocationKey`, and permits only
recover/observe/collect/close. Authorize, disposition and continue require a
new authorization. Replay checks event shape, identity, ordering and
single-use; it does not read mutable config.

### Writable Profile / P06

This is disabled by default and is not required for read-only recovery. A
workspace grant issuer must name workspace, writer, Run lineage, expiry and
quiescence evidence. The material evaluator compares the replacement's full
lineage (including inherited edits) and must not subtract inherited edits from
the accepted delta. Missing issuer, unknown writer, collision or non-quiescent
state parks. X05 is the acceptance gate.

### Closeout / P08

Verify the capability matrix against executable proofs, run `npm test`, audit
setup/doctor for any new dependency, render changed docs, and document every
disabled profile and typed refusal. No capability is advertised from a passing
unit test alone.

## Canonical Data Model

```text
Assignment { assignmentId, workId, cellId, protocolId, version,
             mutationMode, workspaceRef }
AssignmentProjection { activeRunId, status }
Run { runId, assignmentId, retryId, predecessorRunId, attempt,
      payloadDigest, dispatchPlanDigest,
      phase, outcome, createdAt }
RunControlGeneration { runId, controlEpoch, holder, purpose,
                       controlTokenDigest, acquiredAt }
VisibilityBinding { runId, agentSession, agentName, paneId,
                    resourceIncarnation?, status, lastSeenAt }
RecoveryRecommendation { runId, snapshotHash, expectedControlEpoch,
                         actionKey, evidenceIds, action, expiresAt, reason }
```

`runId` is immutable. `attempt` fences Run supersession; `controlEpoch/token`
fence controller ownership. `resourceIncarnation` identifies a worker resource
independently of conversation session. `snapshotHash` binds a
recommendation to the state that produced it. None of these are derived from a
timestamp or process-local counter.

## Port Contracts And Mutation Ownership

| Port | Operations | Typed outcomes |
|---|---|---|
| `RunStore` | `read`, `admit`, `settle` | `version-conflict`, `duplicate-retry`, `stale-run-result` |
| `LaunchRegistry` | `recordIntent`, `lookup`, `reconcile`, `bind` | `unknown-launch`, `incarnation-mismatch`, `closed-resource` |
| `WorkspacePort` | `inspect`, `quiesce`, `grant` | `workspace-busy`, `workspace-authority-unavailable`, `grant-invalid` |
| `EffectGuaranteePort` | `assess(plan, mode, attestation)` | `effect-unknown`, `undeclared-sink`, `provider-not-allowed` |
| `ProcessEvidence` | `inspect(pid, token)`, `heartbeat` | `controller-live-unreclaimable`, `evidence-unknown` |

Ports return evidence objects, never booleans. Adapters map transport failures
to `unknown`; only positive proof produces `proven`. Existing write doors are
the sole owners of event append and projection mutation.

## Crash-Window Matrix

| Window | Durable fact | Recovery result |
|---|---|---|
| before Run append | no Run | admission may retry |
| after Run append, before launch intent | Run exists | resume same Run |
| after launch intent, before local envelope or Herdr create | intent exists | local parks without envelope; Herdr reconciles then may create once only with profile proof |
| after local envelope/supervisor or Herdr create, before bind | resource may exist | bind/rebind if proven, else park; never blind spawn |
| after local worker bind or Herdr locator bind, before worker ack | bound resource | observe; reattach only when profile supports it |
| after result, before settle | uncommitted result | settle only with matching fence |
| during lock release | successor may contend | finally marker plus generation check |

## Detailed Algorithms

**S1 admission.** Under the append-only schema-2 session/Assignment generation
guards, read the Assignment version and reject a conflicting retry digest.
Publish a complete Run staging directory by atomic rename. Every schema-2
session mutator uses the same session guard; schema-1 retains its legacy path.
Session-owned attempts retain `run-retried` as their ledger event; standalone
attempts use the Run-file record as execution authority. Before rename no Run
is committed; after rename the idempotency key returns the same Run. Settlement checks Run id,
attempt, current control token, adapter-proven resource incarnation and payload
digest.

**S2 reconcile.** A fresh Run transitions once from not-requested to pending,
then the winning controller submits. For local `cli-spawn`, any resumed
pending state without the expected envelope, supervisor binding, worker
binding or receipt parks according to the local contract; it never spawns
again on absence alone. For Herdr, resume calls
`reconcile({runId, requestDigest})`; reattach only when gateway session and
adapter-proven resource incarnation match. Pre-bind ambiguity, gateway restart,
closed resource or mismatch parks. Only an explicit `absent-proven` permits
resubmit/replacement; current Herdr name lookup cannot supply this proof. Bind
locator and resource incarnation before publishing success.

**S3 effects.** Assess repeat mode, confinement, provider endpoints derived
from `DispatchPlan.providerModel`, declared sinks, repeatability and dedup
identity for outcome-affecting sinks. Network `allow` parks; filtered
provider-only is eligible only with a duplicable telemetry sink; any extra sink
parks.

**S4 plan consumption.** `show --json` returns snapshot hash, expected control
epoch, action key and expiry without creating a second durable authority. Apply
must echo these values. `recover` re-reads under a short write-door CAS,
consumes the action key once, then records exactly one selected command. A stale
caller gets `plan-stale`; a repeated apply returns the prior result.

**S5 transfer.** Future protocol is `prepared -> gated-child -> committed`, or
typed refusal. Events carry parent event id, child Run id, grant id,
invocationKey and protocol version. First profile refuses terminal-parent
transfer; only amended-contract event classes may follow terminal bookkeeping.

**Writable proof.** Grant issuer proves workspace identity, old-writer
quiescence, new-writer identity, lineage base and generation. Evaluator computes
cumulative delta from the common merge base through inherited artifacts; it
never subtracts inherited edits. Missing any proof parks.

## Cross-Phase Invariants

- Run truth is fgOS-owned; Herdr is transport/failure evidence only.
- Every recovery action is idempotent or explicitly parked as unknown.
- One write door owns each mutation; evaluators and adapters are side-effect
  free except their declared port operations.
- Evidence is append-only and replayable; missing evidence is unknown.
- Parallel design work is allowed only where file ownership and contracts are
  disjoint. Implementation remains blocked by the manifest policy.
