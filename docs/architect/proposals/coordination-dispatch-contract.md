# Coordination ↔ Dispatch & Execution Contract

Document type: Proposal
Design status: Discussion
Implementation: Existing dispatch substrate; proposed coordination seam not yet accepted
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; conceptual boundary for the current architecture review
State class: State

Related: [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),
[Coordination capability envelope](coordination-capability-envelope.md),
[Worker/provider/control boundary](coordination-worker-provider-boundary.md),
[Progress](coordination-envelope-progress.md).

## Correction to the current discussion

Dispatch & Execution is not an implementation detail or a possible future
provider broker. It is the existing execution substrate through which every
capacity, role, workflow, and stage request is dispatched, unless dispatch
returns `in-process` and the caller uses its live capability to execute inline.

The architecture question is how coordinator judgment becomes a legal request
for this existing system, and how its result returns to deliberation without
Dispatch taking over cognitive method.

```text
coordinator soul / judgment
  -> proposed semantic action
  -> coordination authority + grants + bounds
  -> Assignment / dispatch request
  -> Dispatch & Execution resolution
       -> executor / provider / model / tier / persona / mechanism
       -> in-process OR governed external execution
  -> Run / RunResult / evidence
  -> durable deliberation memory
  -> coordinator chooses the next action
```

`in-process` is a dispatch result, not a coordinator bypass. It means the
current caller has the required live capability; the dispatch decision remains
the authority on whether that mechanism is available.

## Responsibility split

| Concern | Coordination | Dispatch & Execution |
|---|---|---|
| Understand/reframe objective | Owns | Does not interpret |
| Choose next cognitive move | Owns within grants/obligations | Does not choose method |
| Choose/request specialist | Proposes and requests | Resolves whether legal and dispatchable |
| Semantic operation | Proposes objective, posture, evidence | Normalizes into Assignment and validates execution contract |
| Role doctrine/soul | Supplies doctrine packet/reference | Delivers packet and records resolved form |
| Capability/context request | Requests attenuation-compatible grants | Enforces scope, egress, and mechanism policy |
| Executor/provider/model/tier | Expresses preference inside authority | Resolves final binding and provenance |
| In-process vs external | Consumes returned mechanism | Decides mechanism and capability requirements |
| Bounds | Chooses within remaining budget | Enforces run limits and reports consumption |
| Worker execution | Interprets result and evidence | Launches, observes, terminates, normalizes |
| Agreement/sufficiency | Assesses evidence and dissent | Reports facts; never infers consensus |
| Close/reopen | Requests or decides within authority | Enforces lifecycle/effect legality |

The same Assignment → DispatchPlan → Run → RunResult path must serve agent-led,
declared-protocol, workflow/stage, and domain-assisted callers. A dynamic
coordinator creates a new Assignment request; it never calls an executor adapter
directly. FlowDefinition supplies defaults and obligations, not a second path.

## Request shape without cognitive enums

```yaml
proposedAction:
  objective: <what this invocation should establish or change>
  posture: <open doctrine or role packet reference>
  contextGrant: <attenuated refs and exposure constraints>
  capabilityRequest: <tools/resources requested>
  expectedEvidence: <artifact/result/evidence requirements>
  mutation: read-only | mutating
  parent: <coordinator/session lineage>
  bounds: <remaining child budget and depth>
  routingPreference: <executor/provider/model/tier/persona preferences>
```

Runtime validates effectful fields and produces an Assignment. “Investigate”,
“challenge”, “reframe”, “synthesize”, “Delphi”, and “red-team” remain doctrine
unless a use case explicitly turns one into a hard obligation. They do not create
new execution engines.

## Adaptive recruitment

1. Coordinator proposes a bounded Assignment with objective, posture, context,
   capability request, evidence requirement, and routing preference.
2. Coordination authority checks membership, obligation preservation, budget,
   depth, and disclosure rules.
3. Dispatch & Execution resolves the request and returns a legal mechanism or a
   refusal with reason.
4. Run/RunResult joins the same session lineage and replay log.
5. Coordinator evaluates the result and chooses the next action.

This is adaptive coordination judgment, not arbitrary runtime graph mutation.
The runtime still refuses an unbounded worker pool, ambient context, foreign
evidence, or a mutation outside the grant.

The current public request surface has not proven this complete path. Engine
internals contain consult/specialist/retry/replacement/cancellation capabilities,
but the audit has not shown that an adaptive coordinator can use them through one
public session contract with complete lineage and bounds. This is the next
capability-fit question; it does not imply a new executor stack.

## Minimal capability contract

Coordination should depend on a small effect-oriented Dispatch port, not on the
internal names of one protocol graph. These capabilities describe authority and
evidence obligations; they are not cognitive role enums.

| Capability | Coordinator may propose | Dispatch must enforce | Durable result |
|---|---|---|---|
| `createAssignment` | New bounded semantic work, including an unanticipated specialist | Principal, lineage, context subset, capability floor, budget, depth, mutation policy | Assignment and resolved policy/provenance |
| `retryRun` | Repeat an uncertain or failed attempt | Idempotency, retry cap, revision validity, budget reservation | New Run linked to prior attempt |
| `recheckRevision` | Reassess a changed candidate/evidence revision | Target revision pin and independent context rules | New assessment Run and invalidation link |
| `replaceActor` | Replace unavailable or unsuitable executor/actor | Replacement authority and obligation compatibility | Replacement event and provenance |
| `cancelRun` | Stop work no longer useful or safe | Caller authority, process/effect cancellation, reconciliation | Cancellation event and unresolved-effect status |
| `requestMutation` | Ask for candidate-producing or mutating execution | Resource owner, root, expected revision, mutation grant | Candidate artifact and RunResult; never automatic integration |
| `executeInProcess` | Use caller's live capability when resolved | Declared capability identity, same bounds/evidence contract | In-process receipt with capability provenance |

The port returns a governed execution result or a typed refusal. A refusal is
ordinary coordination input: the coordinator may choose another method, ask a
human, or stop. It is not permission to import the engine and call an adapter.

## Coordinator-facing Dispatch port

The coordinator-facing surface should expose one intent-neutral request door. It
does not need separate kernel operations named `investigate`, `challenge`,
`debate`, or `reframe`. Those remain in the objective and doctrine packet.

Conceptually:

```js
dispatchCoordinationAction({
  coordination: {
    id,
    epoch,
    parentRef,
    obligationRefs,
  },
  action: {
    kind: 'assignment' | 'retry' | 'recheck' | 'replacement' | 'cancel' | 'mutation',
    objective,
    actor: { id?, role?, doctrineRef?, capabilities? },
    contextGrant: { refs, revisions, disclosure },
    evidenceContract: { expectedOutputs, checks, sourcePins },
    mutation: 'read-only' | 'candidate-only' | 'resource-effect',
    routingPreference: { executor?, provider?, model?, tier?, persona? },
    bounds: { attempts?, concurrency?, depth?, cost? },
    idempotencyKey,
  },
}, callerContext)
```

The exact API shape is deliberately not accepted here. The important boundary is
that the request contains a semantic objective and effect constraints, while the
runtime derives the concrete Assignment, binding, mechanism, and Run. `kind`
selects an effect family, not a cognitive posture; the same Assignment path is
used after validation.

The response has two layers:

```yaml
dispatchDecision:
  status: accepted | refused | pending-reconciliation
  refusal: <typed reason, when refused>
  assignmentRef: <when materialized>
  runRef: <when launched>
  mechanism: <resolved mechanism, including in-process>
  policyProvenance: <resolved executor/provider/model/tier/persona/grants>
  boundsReservation: <what was reserved and consumed>
  evidenceRefs: <RunResult/artifact refs when settled>
```

`pending-reconciliation` is necessary after a crash or uncertain external effect:
the coordinator must not turn an unknown result into a retry or a success merely
because the local process disappeared.

### Invariants at the door

The port must enforce these before materialization or launch:

1. The caller holds the current coordinator epoch for the session.
2. `parentRef` belongs to the same coordination session and is eligible to spawn
   the requested child action.
3. Context refs are a subset of the caller's grant and are pinned to revisions.
4. Requested capabilities are attenuated by, never wider than, the parent grant.
5. Assignment, attempt, concurrency, depth, active-time, and cost bounds are
   reserved atomically where their counters can race.
6. A mutation request has an authorized resource owner, expected revision, and
   candidate/evidence contract; coordination close cannot integrate it.
7. Retry, recheck, replacement, and cancellation reference a real prior object
   and preserve its history.
8. Routing preferences resolve only to approved targets; the final binding and
   observed execution identity are recorded separately.
9. A refusal is durable enough for replay and contains no hidden side effect.
10. A settled RunResult never implies agreement, acceptance, or human decision.

The caller may supply an open role label or doctrine reference. The port must not
derive authority from the role string, and it must not require every possible
role to be listed in a protocol graph before accepting a bounded Assignment.

### Mapping the existing primitives

The proposal is a unifying door, not a replacement implementation for each
primitive:

| Port action | Existing implementation to reuse or adapt |
|---|---|
| `assignment` | `dispatchPrimaryTask`, `proposeConsult`, `dispatchDeclaredOperation` and common Assignment/Run path |
| `retry` | `retrySessionTask` and its lock/idempotency/reconciliation behavior |
| `recheck` | Existing new Assignment/operation path plus explicit target-revision obligation; no semantic alias to retry |
| `replacement` | `replaceSessionActor`, followed by ordinary dispatch for the replacement |
| `cancel` | `cancelSession` plus process/effect reconciliation |
| `mutation` | `dispatchDeclaredOperation` mutation gate, workspace/root policy, and resource-owner integration |
| `in-process` | Existing Dispatch resolver mechanism result, with an execution receipt rather than an adapter bypass |

The mapping table is an investigation guide, not permission to expose internal
functions directly. Before implementation, each mapping needs an impact check,
public caller authentication, and a test showing that it preserves the common
execution path.

### Assignment contract

Every dynamic Assignment should carry, at minimum:

```yaml
assignmentRequest:
  session: <coordination session and coordinator epoch>
  parent: <assignment or deliberation checkpoint>
  objective: <semantic objective>
  doctrine: <resolved role/soul packet reference and content hash>
  contextGrant: <refs, revisions, and disclosure limits>
  capabilityRequest: <requested tools/resources>
  evidenceContract: <expected artifacts, checks, and source pins>
  mutation: read-only | candidate-only | resource-effect
  bounds: <remaining budget, concurrency, depth, attempts>
  routingPreference: <executor/provider/model/tier/persona preferences>
```

`role` remains descriptive. Effective capabilities come from grants and policy,
never from role names. Routing preference is not authorization to select an
unapproved target. Doctrine is delivered content, not a runtime enum; its hash
and source are recorded so a fresh process knows what the worker received.

### Retry, recheck, replacement, and completion

Retry repeats an attempt whose contract/revision remains valid, or records why it
changed. Recheck evaluates a new candidate/evidence revision; prior assessments
remain historical and cannot certify the new revision silently. Replacement
changes who performs an obligation without erasing prior failure or missing
evidence. Cancellation reconciles unknown external effects before retrying.

Dispatch reports execution facts and evidence validity. Coordination owns semantic
disposition. A successful Run may still yield dissent, insufficient evidence, or
another Assignment. A process exit or roster quorum is never an implicit answer
to whether deliberation should close.

## In-process branch

If Dispatch returns `in-process`, the caller must possess the declared live
capability. The result still needs the same execution identity, context and
capability checks, bounds, cancellation semantics where applicable, evidence
normalization, and provenance naming the caller capability. In-process must not
be used for an untrusted worker to import runtime modules or write control state.

## Consequence for experiments

The next experiment is not “choose a host or build a relay”. It is to construct a
synthetic coordinator request asking Dispatch for a specialist Assignment not
predicted by a graph; observe the returned mechanism, including `in-process` if
selected; verify grants, bounds, doctrine, routing provenance, and evidence
lineage; and record exactly where the current public Coordination door prevents
this. Worker filesystem, environment, output, and credential boundaries remain a
separate mechanism-level proof.

Visibility and interactive contact are intentionally outside this contract and
will be reviewed separately as Dispatch mechanism concerns.
