# DAG Request Scheduler For Coordination Runs

> Migration status: This document is a legacy/current source for
> `docs/platform/agent-coordination/proposals/dag-request-scheduler.md`. Do not edit divergent design
> claims here without also updating the target doc or migration inventory.

Document type: Proposal
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-17
Canonical for: nothing; the accepted contracts remain [FlowDefinition](../contracts/flow-definition.md) and [CoordinationSession](../contracts/coordination-session.md).
Related: [Step 07 CoordinationSession / AdhocTask](step-07-coordination-session-adhoc-task.md), [Runtime Model](../architecture/runtime-model.md), [Standalone Master Coordination Protocol](../../../../core/coordination-protocols/standalone-master-coordination-loop.yaml)

## Problem

The core already has real concurrent dispatch for the special `fan-out` path:
`dispatchResearchFanOut()` uses `Promise.allSettled()` while the session-wide
`aggregateBounds.maxConcurrency` admission gate protects the cap. However,
the public `fgos coordination run` request path awaits every declared
`steps[]` entry in source order. As a result, a plan-loop first pass runs:

```txt
produce -> review -> red-team
```

even though both review operations depend only on `produce` and could run in
parallel. This is a runtime scheduling limitation, not an executor or
Assignment/Run limitation.

`FlowDefinition.graph` also describes node transitions but today validates
only node references and reachability. It is not a runtime readiness gate and
does not reject transition cycles. The system consequently has graph-shaped
configuration, special-case fan-out, and a sequential request interpreter,
rather than one explicit dependency model.

## Evidence Observed On 2026-09-17

| Observation | Source | Consequence |
| --- | --- | --- |
| Every request step is awaited in order. | `src/verbs/coordination/run.mjs` | Independent request steps cannot overlap. |
| Research fan-out uses `Promise.allSettled`. | `src/runner/coordination/session-engine.mjs` | Core Assignment/Run dispatch can overlap safely. |
| `maxConcurrency` is enforced at Assignment creation under the session lock. | `src/runner/coordination/{session-engine,store}.mjs` | A scheduler must respect remaining capacity; it must not invent another cap. |
| A mutating operation must use a linked worktree and two mutating actors must not share it concurrently. | CoordinationSession work-isolation contract | Readiness alone is insufficient; dispatch needs an isolation resource rule. |
| Step 07 already proposed explicit `dependsOn`, readiness, cycle rejection, and mutation isolation. | `step-07-coordination-session-adhoc-task.md` | The direction is not novel, but it was intentionally deferred before a scheduler existed. |

## Scope

This proposal is a bounded, synchronous scheduler inside one
`fgos coordination run` invocation. It is not a daemon, durable Job queue,
optimizer, new Work lifecycle, or an alternate Assignment/Run path.

Every materialized operation must still use the existing path:

```txt
request node -> Assignment -> DispatchPlan -> Run -> RunResult -> session evidence
```

The session remains the recovery source of truth. Scheduler state must be
reconstructable from the request plus Assignment/session events; no opaque
in-memory scheduler state becomes authoritative.

## Candidate Contract

### Request Nodes

Add `dependsOn?: string[]` to every declared-protocol request step. A value
references another step's unique `as` label. `$ref:<label>` references remain
data references and are additionally treated as dependency edges whenever
they point to a request step.

Example:

```json
{
  "kind": "declared-protocol",
  "objective": "Implement and independently assess one cell.",
  "writerId": "lead-1",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "steps": [
    { "type": "operation", "as": "produce", "operationId": "produce-candidate", "objective": "Implement the cell.", "expectedOutputs": ["agent-result.json"] },
    { "type": "operation", "as": "review", "operationId": "review-candidate", "dependsOn": ["produce"], "contextRefs": ["$ref:produce"], "objective": "Review the candidate.", "expectedOutputs": ["agent-result.json"] },
    { "type": "operation", "as": "redTeam", "operationId": "red-team-candidate", "dependsOn": ["produce"], "contextRefs": ["$ref:produce"], "objective": "Try to falsify the candidate.", "expectedOutputs": ["agent-result.json"] }
  ]
}
```

This produces waves `[[produce], [review, redTeam]]`. Result presentation
stays in request order, not completion order.

### Validation

Before opening or resuming a session, validate the entire request DAG:

1. every dependency targets a distinct declared `as` label;
2. no self-edge or cycle exists;
3. inferred `$ref` edges are included in the cycle check;
4. no operation that requires an authorization can race its authorization
   step in the same request; an explicit edge is required when the grant is
   created in that request;
5. the FlowDefinition transition graph is acyclic if it is to be treated as
   a phase-precedence source. A cycle must fail definition validation, not
   spin at runtime.

Backward compatibility needs an explicit decision: legacy requests without
`dependsOn` can remain source-order sequential, or the runtime can infer all
safe edges and expose new parallelism by default. The former is safer; the
latter yields adoption without template changes.

### Readiness And Capacity

A node is ready only when all dependency nodes have completed successfully,
its data/context references resolve, its activation/authorization gate is
satisfied, and the session has available `maxConcurrency` capacity.

The scheduler repeatedly dispatches a bounded ready frontier. It must call
the existing session engine for each node, so admission, policy, evidence,
idempotency, retries, and aggregate budgets remain unchanged.

For a shared physical checkout, a mutating operation is an exclusive resource:

- no two mutating nodes may run together;
- a read-only node may not run alongside a mutation unless its isolation and
  snapshot semantics are declared and proven;
- mutating nodes in separate linked worktrees are eligible for a later,
  explicitly designed parallel-isolation extension.

This conservative first slice enables the principal plan-loop benefit
without weakening worktree isolation.

### Failure And Resume

The recommended failure policy is branch-local:

- a failed node blocks only its transitive dependents;
- unrelated ready nodes continue;
- the result reports `completed`, `failed`, and `blocked` nodes distinctly;
- a resumed request relies on existing idempotent task keys and the session
  event log, then schedules only nodes that are still eligible.

Fail-fast remains an alternative. It preserves today's error shape but loses
useful independent evidence and reduces parallel execution's value.

## Design Options For Review

### A. Request-local DAG scheduler (recommended starting point)

`dependsOn` belongs to request steps; `runCoordinationUseCase` schedules
ready waves. `FlowDefinition` continues to define legal operations and phase
shape but does not become a general runtime plan.

Benefits: smallest migration, preserves dynamic driver authorization, and
works for arbitrary plan-cell DAGs.

Costs: dependency graph is supplied again in each request/resume invocation;
the engine needs a precise request-level result model.

### B. FlowDefinition-driven phase scheduler

Interpret `graph.transitions` as readiness edges and dispatch protocol nodes
automatically from the definition.

Benefits: one declared graph, less request boilerplate.

Costs: a static protocol graph cannot express per-plan-cell decomposition,
dynamic authorization, repeated rounds, or a particular plan's dependency
shape without growing a second planning language.

### C. Persisted session task-DAG

Create durable session-local task nodes and states (`pending`, `ready`,
`running`, `satisfied`, `failed`, `blocked`) before materialization.

Benefits: strongest crash recovery and visibility, naturally supports long
runs and incremental graph expansion.

Costs: substantially reopens the deferred Step 07 AdhocTask schema and risks
building a queue/scheduler product before the direct consumer is proven.

### D. Keep special-case fan-out and teach plan-loop to use it

Represent each review/research cohort as a `fan-out` step.

Benefits: minimal runtime work.

Costs: not an arbitrary DAG; it forces unrelated protocols into a cohort API,
does not model authorization dependencies, and repeats scheduling logic by
special case.

## Open Decisions

1. Should DAG scheduling be opt-in for compatibility or default for every
   request whose dependencies can be validated?
2. On predecessor failure, should unrelated branches continue (recommended)
   or should the invocation fail fast?
3. Should `dependsOn` be the only precedence input, with `$ref` validated to
   agree, or should data references always imply edges automatically?
4. Is the first delivery limited to read-only parallelism, with shared
   worktree mutations serialized, or do we require per-node worktree
   allocation immediately?
5. Does `FlowDefinition.graph.transitions` remain descriptive topology, or
   should a later accepted contract make it executable phase precedence?
6. What response/result shape reports blocked branches without confusing
   session quorum or RunResult truth?

## Review Record: Initial Counteranalysis (2026-09-17)

An independent review of this proposal confirmed the central diagnosis but
identified corrections that a design/implementation plan must not flatten.

### Confirmed Corrections

1. `aggregateBounds.maxConcurrency` is an admission refusal, not a queue or
   backpressure mechanism. `createSessionAssignment` currently throws a
   validation-category `CoordinationError` when the number of created-but-not-
   result-linked Assignments reaches the cap. A DAG scheduler therefore needs
   to distinguish capacity exhaustion from an ordinary refusal; otherwise it
   would incorrectly block dependents of a node that merely needs a later
   slot.
2. Existing sequential request execution does not stop merely because a
   prior RunResult reports `failed`; it stops when an engine call throws.
   Slice-one dependency readiness should therefore mean **settled** (a
   result-linked outcome exists), not automatically **successful**. This
   preserves useful review/debug-after-failure flows. A later contract may add
   an explicit success-only dependency condition for operations that need it.
3. The read-only posture is not risk-free under a shared cwd. The existing
   read-only gate uses whole-workspace git-state comparison and rollback.
   Concurrent misbehaving read-only runs can interfere with each other's
   verdict/rollback. Fan-out already has this posture; DAG scheduling would
   expose it to plan-loop. It needs a named contract risk and a proof, not an
   implicit safety claim.
4. The CoordinationSession engine is intentionally forbidden from creating
   worktrees, branches, or merges. Per-node workspace allocation is not an
   engine extension; it belongs to a caller/skill-level design outside this
   first slice.
5. `$ref` validation currently checks only lexical shape and can fail partway
   through execution when its label has not yet been produced. A DAG request
   validator must derive data-flow edges from `$ref` and reject missing,
   self-referential, or cyclic references before it opens or resumes a
   session.

### Recommendations Under Debate

The review recommends request-local DAG scheduling as the smallest safe core,
with `dependsOn` only for control-only edges and `$ref` as an implied data
edge. It recommends branch-local failure: a refused node blocks its
dependents, while independent siblings continue and response order stays
request order.

It also proposes a later "C-lite" addition: persist an append-only request
declaration but derive all node state from Assignment/Run/session evidence.
This would enable file-less resume, session-scoped label lookup, and `show`
visibility of nodes not yet materialized without persisting a second task
lifecycle.

### Reservations To Resolve

1. **Ledger barriers must be causal, not blanket source-order barriers.** An
   authorization must precede the operation it grants, but independent driver
   ledger writes should not automatically serialize all dispatch. The design
   needs a precise causal-edge rule.
2. **Static topological waves trade away latency.** They are simpler, but they
   delay a downstream node until every sibling in its level finishes. A
   dynamic ready frontier may be the correct target if the stated goal is
   materially shorter plan-loop duration.
3. **A machine-readable capacity result needs a contract-shaped field.**
   Adding an ad-hoc JavaScript `err.code` could conflict with existing Node or
   CLI error conventions. The implementation should first inspect the
   CoordinationError/envelope shape and choose a stable `reason` or structured
   detail field.
4. **A claimed cross-process Assignment-id allocator race is not yet recorded
   here as proven evidence.** It must be reproduced by a focused test before
   it becomes a prerequisite or a stated fact.
5. **FlowDefinition must not become the scheduler, but it may be a validator.**
   A later layer can reject a request DAG that violates declared phase
   precedence without treating `graph.transitions` as an implicit/default
   execution plan.

## Focused Reviewer Questions

Answer each item with the relevant source/test evidence, a recommended
decision, and any compatibility consequence. The purpose is to close the
request-local DAG contract, not restart broad architecture exploration.

1. What exact structured error shape can distinguish session capacity
   exhaustion from authorization/policy/isolation refusal without changing
   existing CLI error semantics? Should the scheduler retry/defer only that
   shape, and what is its bounded no-progress exit?
2. Is `settled` the correct slice-one dependency condition for every edge?
   Identify concrete protocol operations that need `successful` instead, or
   confirm that such a condition should be explicitly deferred.
3. Define the minimal causal rule for ledger steps. Which relationships must
   create an edge (`authorize -> granted operation`, human-turn
   `respondsTo`, disposition evidence), and which ledger writes are safe to
   overlap?
4. Does the actual runtime support a dynamic ready frontier without violating
   the current session-wide cap, idempotency claim, or quorum close behavior?
   Compare it against static Kahn waves with a latency example from the master
   coordination loop.
5. What is the observed behavior when two read-only runs sharing one cwd both
   touch the workspace? Provide a focused proof of verdict and rollback
   behavior, then recommend either an explicit accepted risk or a required
   isolation change before plan-loop DAG adoption.
6. Can `$ref`-derived edges and optional `dependsOn` be validated entirely at
   the request boundary before `openDeclaredProtocolSession` and resume? List
   each field that can carry a `$ref`, including fan-out branch fields, and
   define the expected errors for missing labels, self-edges, and cycles.
7. Should FlowDefinition graph transitions remain purely descriptive, or is a
   static "request must not violate phase precedence" validator both useful
   and implementable without turning the definition into an execution plan?
8. Reproduce or reject the reported multi-process Assignment-id allocator
   race. Until reproduced, should it be excluded from the initial DAG plan;
   if reproduced, does in-process DAG scheduling itself exercise the same
   race?
9. For a node whose engine call refuses after siblings have launched, what
   should the public `fgos.v1` response contain (node status, root cause,
   `blockedBy`, already-completed siblings, and close/quorum state), and which
   errors must still throw rather than be represented as a node outcome?
10. Is append-only persisted request declaration a justified second delivery
    after in-process DAG scheduling, or does it introduce enough replay and
    request-version complexity to defer until a concrete file-less resume
    consumer is proven?

## Reviewer Response And Revised Direction (2026-09-17)

The reviewer inspected the concrete doors and ran a focused multi-process
allocator reproduction. The following decisions supersede the earlier
tentative recommendations in this proposal unless a later design review
records contrary evidence.

### 1. Causal Ledger Edges, Not A Global Ledger Barrier

All current driver ledger doors run synchronously under the events lock, so
they do not overlap within this request interpreter. A type-wide source-order
barrier would nevertheless serialize unrelated operations around every ledger
write. The requested scheduler should instead derive causal edges:

| Step kind | Required incoming edges | Required outgoing edges |
| --- | --- | --- |
| `authorize` | Its `$ref` inputs; conservative source-order guards for earlier operation/fan-out work that can affect a visibility window or the same authorization binding. | The operation/fan-out invocation it authorizes. |
| `disposition` | `$ref` in `targetRef` and `evidenceRefs`. | None by default. |
| `contribution` | Its assignment `$ref`; a referenced prior contribution. | None by default. |
| `human-turn` | The immediately preceding human turn where ordinal sequencing requires it. | None by default. |

Two authorization-specific invariants are already fail-closed in the engine:
the newest unconsumed authorization is selected for a binding, and visibility
windows are derived from result-linked source operations rather than request
labels. The first delivery may conservatively retain source order around an
authorization to preserve these invariants without duplicating definition
resolution in the scheduler. Templates should move independent authorization
writes before their distinct operation cluster where that is legal.

**Resolved pairing rule: source-order alternation.** The table alone is insufficient for repeated
authorization/operation pairs on the same `(operationId, targetActorId)`
binding. For example, `auth_1, auth_2, op_1, op_2` can satisfy broad
"authorize precedes later operation" edges while the engine's newest-
unconsumed selection makes the intended pairing ambiguous. In DAG mode, steps
for a repeated binding must alternate in source order:
`authorize_1, operation_1, authorize_2, operation_2, ...`. Validation rejects
two outstanding authorizations before the first operation, and the scheduler
derives `authorize_k -> operation_k -> authorize_(k+1)`. This fixes a
pre-existing sequential-path hazard without changing the engine interface.
An explicit operation-side authorization reference remains a separate future
contract proposal, not a prerequisite for this slice.

### 2. Dependency Means Settled

A dependency guarantees that the predecessor's RunResult is linked and
readable; it does not assert that the predecessor succeeded. This matches
current request execution and permits review/debug branches to inspect a
failed predecessor. Existing outcome-sensitive gates remain at their current
doors: visibility-window derivation, aggregation validation, research fan-in,
and driver disposition.

Provider-capacity refusal now settles as a failed RunResult with
`classification.failure.code: "provider-capacity-refused"`, rather than
throwing. A downstream review may therefore run after work that never began;
this is wasteful but not a scheduler correctness failure. A future optional
success-only dependency condition is deferred rather than introduced in the
first schema slice.

### 3. Dynamic Ready Frontier

The selected runtime shape is dynamic ready-frontier scheduling, not static
topological waves. It may admit a newly-ready successor as soon as its own
predecessors settle, without waiting for unrelated in-flight siblings. The
existing lock-held concurrency check, per-Assignment task-key claim/prior-link
recovery, and end-of-invocation quorum evaluation do not require wave
barriers.

Shared-cwd mutation remains exclusive at scheduler admission: do not admit a
mutating node while any node is in flight, and do not admit another node while
a mutating node is in flight. Read-only concurrency is an explicitly accepted
limitation. A focused two-session proof with a pre-existing dirty doer diff
and one misbehaving read-only worker established that the violator always
settles failed, a clean concurrent sibling also deterministically settles
failed against the violator's changed file, and the violator is never masked.
There is no rollback: `rollbackReadOnlyMutations` has no production call site,
changed files remain, and a worker can alter a pre-existing dirty file.

Slice one accepts this fail-closed false-positive posture because serializing
read-only siblings removes the primary `review || red-team` use case. The
mutation contract must state that concurrent read-only Assignments sharing a
cwd have non-attributable violation verdicts. When overlapping read-only DAG
nodes settle with changed files, response entries carry
`sharedCwdVerdictCaveat: true` so the driver can request a recheck rather than
infer fault attribution. Removing or wiring the dead rollback helper, and
protecting pre-dirty files from worker mutation, are separate bug items.

### 4. Capacity Is Deferred, Other Refusals Are Visible Outcomes

Keep `CoordinationError.category: "validation"` for exit-code compatibility.
At the `store.mjs` concurrency-cap refusal site, add the established finer-
grained error code `"concurrency-cap"`. Only that code is deferrable.

When every ready node is deferred, no invocation-owned node remains in flight,
and no slot owned by this invocation can become free, stop without sleeping or
polling. Return deferred nodes together with `inFlightOutsideInvocation`; this
is bounded scheduling, not a retry queue.

Node outcomes use this strict allow-list, not category alone:

| Outcome | Exact conditions |
| --- | --- |
| `deferred` | The scheduler's call to `dispatchDeclaredOperation` or `dispatchResearchFanOut` throws a `CoordinationError` with `category: "validation"` and `code: "concurrency-cap"`. No other error is deferred. |
| `refused` | The error comes directly from the scheduler's node call to `dispatchDeclaredOperation`, `dispatchResearchFanOut`, `authorizeDeclaredOperation`, `recordDriverDisposition`, `linkSessionContribution`, or `recordHumanTurn`; it is a `CoordinationError`, `StoreError`, or `RunnerConfigError`; and it has `category: "validation"` but is not `concurrency-cap`. |
| throw | Everything else, after invocation-owned work settles. |

In particular, coordination-layer `not-found` is not caller validation:
`readManifestRaw` uses it when a session manifest disappears. A missing
definition reaches `FlowDefinitionError("not-found")` when the engine reloads
the protocol during dispatch. Both are integrity failures. So are corrupt
logs, schema-version mismatch, dangling/foreign/out-of-order references,
path escape, lock timeout, every `FlowDefinitionError` or `EventLogError`,
and errors thrown outside the six named node doors. No later event may be
appended to an untrustworthy session.

### 4.1 DAG Response Contract

Keep the existing RunResult `status` and `confidence` fields unchanged. Every
response step gains a separate scheduler `outcome`:

```txt
outcome = settled | refused | blocked | deferred
```

`settled` includes a RunResult whose own `status` is `failed`; it means the
result was linked and readable, not that the worker succeeded. This avoids a
real name collision because RunResult already uses values such as `blocked`.
Each node response contains its `assignmentId` (or `null`), `resumed`,
`blockedBy`, and, where refused, the original `{category, code, message}`.
It also records `door`, the scheduler call that produced the outcome. A refused
node can legitimately have a non-null `assignmentId`: a runner configuration
or `dispatch.claim` failure can occur after `assignment-created`. Refusal
therefore means no new terminal Run/RunResult and no later event from the
refusal path, not universally "nothing materialized".
The top-level response retains coordination/session/quorum/close fields and
adds scheduler counts (`settled`, `settledFailed`, `refused`, `blocked`,
`deferred`) plus `inFlightOutsideInvocation` on no-progress.

`closeSessionByQuorum` runs only when every DAG node settled. It must not
close under a partial policy while a capacity-deferred node remains, since a
terminal session is absorbing and would make that node permanently unrunnable.
Refused and blocked nodes likewise leave the session active for a driver
decision, cancellation, or a corrected later request.

### 5. Request DAG Syntax

Keep both forms of edge:

```txt
edges = dependsOn union inferred($ref)
```

Duplicate edges are harmless. `dependsOn` expresses control-only precedence;
`$ref` is a mandatory data-flow edge. Validate unknown labels, self-edges,
cycles, and invalid references to a ledger node before either new-session open
or resume. Every label is a scheduler node even where it does not materialize
an Assignment.

### 6. Definition Guard, Not Definition Scheduling

Do not make FlowDefinition transitions a default execution scheduler. A later
delivery may add a negative validator: if two request operations bind to
strictly ordered protocol phases, the request DAG must contain a path in the
same direction. This validator never inserts an edge or starts work. It is
deferred past the first delivery.

### 7. Persistence Is Deferred; Cross-Call Lookup May Reuse Claims

Persisted request declarations are deferred. Event schemas currently reject
unknown event kinds, so a new declaration event creates a real mixed-version
read break for older `show`/`chain` processes. The immediate cross-call value
can instead be explored through a `$taskKey:<key>` reference that resolves
against the existing task claim file and verifies membership in the session.
This needs a dedicated schema/compatibility check, but avoids a second source
of declaration/replay truth.

### 8. Allocator Race Is Not A DAG Prerequisite

The focused reproduction used two OS processes, one `.fgos` directory and
writer identity, and concurrently created 150 assignments over three runs.
It found zero duplicate ids and matching membership records. `mkdirSync`
claiming in the assignment-id path is atomic. The earlier live incident remains
unexplained and may involve distinct `.fgos` roots across worktrees, but it is
not recorded as an allocator fact or prerequisite for intra-process DAG
scheduling. It belongs to a separate live-topology bug investigation.

## Revised Acceptance Evidence

1. A `produce -> {review, red-team}` barrier/clock proof shows real overlap;
   output stays request ordered and dynamic frontier admits a successor without
   waiting for an unrelated slow sibling.
2. A diamond graph proves fan-in only admits after both predecessors settle.
3. Unknown dependencies, invalid `$ref`, self-edge, and cycle reject before
   new-session open or resume, with zero session events written.
4. Repeated authorization bindings reject non-alternating requests; an
   alternating pair consumes the matching authorization; resume, duplicate
   task-key, and different-binding parallel cases preserve that pairing.
5. A capacity cap proves `concurrency-cap` nodes defer rather than refuse,
   and no-progress returns `inFlightOutsideInvocation` without sleep/poll or
   session close.
6. A refusal blocks descendants while independent siblings settle; parity
   tests preserve original refusal `{category, code, message, door}` for
   authorization, policy, isolation, and claim failures, including a refusal
   after `assignment-created`. Integrity failures throw and append no later
   session event.
7. The two-timing shared-cwd read-only proof records deterministic false
   positive failure, no false negative, no rollback, unchanged pre-existing
   doer artifacts except worker writes, and `sharedCwdVerdictCaveat` on every
   overlapping affected node.
8. Mutating nodes never overlap another node in the same cwd.
9. A partial-policy session with a deferred node records
   `closeAttempted: false` and remains active.
10. Existing fan-out, driver-authorization, recovery, quorum, plan-loop, and
    code-panel coverage remains green.
11. Deleting `session.json` during an in-flight frontier throws `not-found`
    after workers settle, while renaming the protocol between a settled
    predecessor and its successors throws `FlowDefinitionError("not-found")`;
    neither case admits a later sibling or converts to `refused`.

## Independent Red-Team Gate (2026-09-17)

**Status: changes required before `plan.md`.** A final independent review
found two blockers and five high-severity gaps. This section supersedes any
earlier wording that treated the current request-local scheduler shape as
ready to plan.

### Blockers

1. **Shared-cwd mutation exclusion needs durable admission authority.**
   Frontier-local in-flight bookkeeping protects only one scheduler invocation.
   Another process, or a new invocation while an older Assignment remains in
   flight, can admit a conflicting mutating/read-only or mutating/mutating run
   in the same cwd. The existing Assignment admission door must atomically
   inspect persisted in-flight Assignment facts carrying canonical cwd and
   mutation posture under its lock. The scheduler may optimize with local
   knowledge but cannot be the authority. Required proof: two OS processes,
   same session/cwd, simultaneous mutation-vs-read-only and mutation-vs-
   mutation admission; exactly one executor launches. Include a pre-existing
   in-flight Assignment case.
2. **Fan-out currently erases branch error semantics.**
   `dispatchResearchFanOut` settles branch promises and returns rejected
   branches as strings under a dispatched top-level result. This loses the
   distinction among capacity deferral, ordinary refusal, and integrity
   failure. A DAG scheduler cannot safely treat that as a settled node. The
   engine/API must preserve typed per-branch outcomes, make a fan-out node
   settled only when every required branch has linked/readable evidence,
   rethrow an integrity branch failure after siblings settle, and retain a
   capacity branch as deferred. Required proof: mixed fulfilled,
   concurrency-cap, ordinary-validation, corrupt/missing-result branches and
   a successor that is never admitted incorrectly.

### High-Severity Gaps

1. **Error allow-list is still too broad.** Definition-version drift and an
   unresolved `dispatch.claim` can both reach the named node doors as
   validation-category errors but represent definition/recovery ambiguity, not
   ordinary caller-correctable refusal. The final design needs stable,
   explicit machine codes (or an equivalently exact trusted discriminator) for
   every deferrable/refusable family; definition drift and ambiguous claim
   state always throw.
2. **Cold resume has no immutable request-node identity.** A new request may
   relabel nodes, change edges/source order/task keys, add or drop nodes, and
   make prior deferred/refused/blocked outcomes invisible to `show` and
   `chain`. If plan-loop requires cold resume, either persist an immutable
   request fingerprint/node semantic identity plus enough derived projection,
   or explicitly narrow the feature so it cannot claim cold-resumable DAG
   coordination. The earlier decision to defer persisted declaration is
   therefore insufficient for the stated plan-loop consumer.
3. **Authorization alternation needs logical identity uniqueness.** Source
   order alone does not prevent duplicate `authorizationId`, `invocationKey`,
   or repeated-operation task identity from collapsing an apparent later pair
   into an earlier idempotent record/claim. DAG validation must define exact
   uniqueness and alias-equivalence rules, then prove crash/resume behavior
   for every pair boundary.
4. **Dependency extraction is incomplete.** `$ref` and `dependsOn` do not
   cover contribution anchors/responds-to bare ids, human-turn responds-to
   refs/ordinal lineage, authorization pairing, or every fan-out field. The
   request compiler needs one complete per-step dependency extractor that
   resolves each bare ledger identity uniquely to a request node or durable
   session record before any mutation.
5. **Consumer-facing response shape remains ambiguous.** Session status,
   derived phase, scheduler outcome, and RunResult status need separate,
   stable fields. A shared-cwd caveat must name the overlap group/canonical cwd
   and affected peer labels, not only boolean `true`. `show`, `chain`,
   headless, plan-loop, and code-panel must treat a caveated reviewer result
   as recheck-required rather than a trustworthy verdict.

### Additional Mandatory Evidence

- cancellation during an active frontier: in-flight work may settle, but no
  successor admits and no terminal session is reopened;
- retry/replacement or an external terminal transition racing a ready node;
- partial policy with refused/blocked as well as deferred nodes;
- maxAssignments, maxRounds, wall-time, and task-depth refusals distinguished
  from concurrency deferral;
- no-later-event assertions for each integrity family;
- legacy requests with no DAG syntax retain explicitly chosen behavior;
- CLI envelope, headless, `show`, `chain`, plan-loop, and code-panel consumer
  proofs, not scheduler-only unit tests.

### Consequence

Request-local DAG execution may still be the right runtime locus, but it is
not sufficient as previously scoped. The next design pass must decide whether
to provide durable request/node identity and projection for cold-resumable
plan-loop use, and must extend the existing admission/fan-out authorities
before a scheduler is added above them.

## Rescope Decisions For Delivery One (2026-09-17)

The design review resolved the red-team gate with the following boundaries.
These decisions replace the earlier proposal's broader first-slice scope.

### Preserve Cold-Resumable DAG Coordination

Plan-loop and code-panel require a fresh process to reconstruct a live cell
from `chain`; a one-invocation-only DAG would lose the primary consumer value
after a crash. Delivery one therefore includes:

- an immutable request declaration and request fingerprint;
- immutable node identities distinct from display labels;
- node outcomes derived from declaration plus Assignment/Run/session evidence,
  never a separately persisted node lifecycle;
- `show` and `chain` projections of declared/pending/derived node state;
- resume acceptance only for an equivalent request or a contractually allowed
  continuation.

### Read-Only, Individual-Operation DAG Only

Delivery one schedules only read-only individual `operation` nodes and the
ledger nodes needed to express their causal graph. A DAG request containing a
mutating operation is rejected. Existing sequential mutation behavior remains
unchanged outside DAG mode.

Mutation DAG is deferred until Dispatch has an authoritative ownership model
covering atomic cross-process admission, canonical cwd identity including
symlink aliases, process liveness, stale claims, takeover, and crash recovery.
Persisting only cwd and a mutation flag is insufficient to establish that
authority.

Existing `fan-out` is also excluded from DAG mode. It retains its current
behavior outside the scheduler until its engine contract preserves typed branch
outcomes and defines fan-out node settlement. The first consumer shape is the
individual-node graph `produce -> {review, red-team}`.

### Schema And Migration Contract

Durable request/node identity is a CoordinationSession schema migration, not
an implementation detail left to a plan:

1. DAG sessions use a bumped schema version. An older binary encountering it
   fails clearly with `schema-version-mismatch`; it never ignores an unknown
   declaration event or appends to that session.
2. A newer binary continues to read an older session through the legacy
   projection, but never infers a DAG declaration from Assignment events or
   task keys and never claims that old session is DAG-resumable.
3. A DAG session writes its declaration atomically before its first node
   materializes. Request labels/edges/node identities cannot be silently
   rewritten by a later resume.
4. A worktree or binary without support for the active DAG schema cannot append
   to that session.
5. `show` and `chain` explicitly render `unsupported-newer-schema` and
   `legacy-non-dag` states; neither may be silently presented as an ordinary
   active resumable DAG cell.

### Revised Delivery-One Shape

```txt
immutable DAG declaration + schema/replay/projection migration
  -> cold-resume equivalence/continuation gate
    -> dynamic ready frontier for read-only individual operations
      -> existing Assignment -> Run -> RunResult evidence path
```

This deliberately defers mutation DAG, fan-out DAG, priority/fairness queues,
and any scheduler daemon. It is the smallest scope that retains the promised
plan-loop/code-panel cold-resume behavior without claiming unsupported
cross-process mutation or flattened fan-out semantics.
