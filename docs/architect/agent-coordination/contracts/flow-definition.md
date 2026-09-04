# FlowDefinition And Profile Schema Contract

Document type: Contract
Design status: Accepted
Implementation: Implemented (`src/runner/definitions/{schema,workflow-adapter,protocol-loader}.mjs`,
Step 08 Phase 02; Workflow-profile projection additive at zero diff to
`src/state/workflow-stage-graphs.mjs`; CoordinationProtocol-profile fixtures
ship in `core/coordination-protocols/` and are discoverable from a real
external consuming project, proven live at P07.2 R6. Full per-phase trace:
`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.
Phase 00 (Step 09): driver-authorized optional operations, disposition,
recheck-vs-retry contract text accepted — implemented across
`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (the `activation` schema
field, `standalone-master-coordination-loop.yaml`'s real
`driver-authorized` bindings) and `step-09-mvp3-to-mvp5` Phase 03
(`policy.minTier` role-tier separation for the same fixture's operations).
Full per-phase trace:
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.
Phase 06 (Step 09 MVP6): `spec.profile.topology.visibilityWindows[]` and
`graph.nodes[].operations[].contextAccess.visibilityWindowRef` accepted and
implemented — schema/validation in `src/runner/definitions/schema.mjs`
(P06.1), runtime derivation and grant enforcement in
`src/runner/coordination/session-engine.mjs`
(`deriveVisibilityWindowState`, P06.2 plus four fix rounds), proved against
the committed opt-in fixture
`core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`
(P06.3, `test/runner/coordination-visibility-window-fixture.test.mjs`).
Promoted with the named limitations in Visibility Windows below, not
without them.
Phase 07 (Step 09 MVP7): `spec.profile.completion.aggregation` accepted and
implemented — schema/validation in `src/runner/definitions/schema.mjs` and
the runtime validation door in
`src/runner/coordination/session-engine.mjs` (P07.3), enforced at the request
door in `src/verbs/coordination/run.mjs` (P07.4). Promoted with the named
limitations in `completion.aggregation` below and in the CoordinationSession
contract's own Evidence-Preserving Aggregation section, not without them.
Phase 08 (Step 09 MVP8): `spec.operations[].contributions.allowedTypes[]`
accepted and implemented — schema/validation in
`src/runner/definitions/schema.mjs` (P08.3), consumed by
`linkSessionContribution`'s real (non-vacuous) operation/type narrowing in
`src/runner/coordination/session-engine.mjs`, proved against three committed
opt-in fixtures under `core/coordination-protocols/deliberation-*-chain.yaml`
(P08.3). See the CoordinationSession contract's own Deliberation
Contribution Ledger section for the runtime half.
Phase 09 (Step 09 MVP9): `spec.profile.topology.specialistSlots[]` and
`graph.nodes[].operations[].specialistSlotRef` accepted and implemented —
schema/validation in `src/runner/definitions/schema.mjs` (P09.1, plus a Wave
4 fix round closing slot-id disjointness and role/operation consistency
gaps), runtime authorization/binding/dispatch resolution in
`src/runner/coordination/{session-engine,store,replay}.mjs` (P09.2, 1 HIGH
fixed — see the CoordinationSession contract's own Specialist Slot Binding
section), negative/crash-recovery/structural-absence proof in
`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`
(P09.3, closing Phase 09). Promoted with the named limitations in Specialist
Slots below and in the CoordinationSession contract's own Specialist Slot
Binding section, not without them.
Phase 10 (Step 09 external acceptance, closing Step 09): three new, real
CoordinationProtocol FlowDefinitions
(`core/coordination-protocols/group-thinking-{rfc-review-lite,
nominal-group-lite,delphi-feedback-lite}.yaml`) exercising the MVP6-MVP9
mechanisms above through no protocol-specific kernel branch (P10.2-P10.4),
registered and proven reachable through a real external Group-Thinking
Protocol Pack (P10.1/P10.5-P10.9) — see the CoordinationSession contract's
own Group-Thinking Protocol Pack section for the pack-layer semantics. No
new FlowDefinition schema field added by Phase 10; one Forbidden Fields
Summary table row added below, closing a pre-existing contract-text gap
(`policy.preferExecutor` illegal on a portable definition) named by P10.2's
own Reviewer.
Full per-phase trace:
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.)
Last reviewed: 2026-09-04
Canonical for: the FlowDefinition IR schema, the Workflow/CoordinationProtocol profile discriminator, the operation primitive, and PolicyPatch provenance
Related: [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md), [Protocol Model](../architecture/protocol-model.md), [Workflow Stage Operation Contract](workflow-stage-operation.md), [CoordinationSession Contract](coordination-session.md)

## Scope

This contract defines the shared `FlowDefinition` schema and its two V1
typed profiles. It is additive: it does not change the accepted
[Workflow Stage Operation Contract](workflow-stage-operation.md) or any
existing consumer of `normalizeWorkflow()`, `getDomain`, `operationsForStage`,
`effectiveStage`, or `stageForStep`. A `Workflow`-profile FlowDefinition is a
second, adapter-produced projection of the already-normalized Workflow shape,
not a replacement input format, per [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md).

## Root Shape

```yaml
apiVersion: fgos.dev/v1alpha1
kind: FlowDefinition
metadata:
  id: <definition-id>
  version: <definition-version>       # required when the definition is reusable/reference-stable

spec:
  profile: { ... }                    # required, typed discriminator — see Profiles
  graph: { ... }                      # required
  roles: [ ... ]                      # required
  actors: [ ... ]                     # optional
  operations: [ ... ]                 # required
  policy: { ... }                     # optional PolicyPatch, see below
```

| Field | Required | Notes |
|---|---|---|
| `apiVersion` | yes | Schema-version namespace for the whole document. |
| `kind` | yes | Always `FlowDefinition`. |
| `metadata.id` | yes | Local definition identity. |
| `metadata.version` | yes for reusable definitions | Referenced together with `id` wherever an Assignment or session records provenance against a declared definition (`definitionId@version`). |
| `spec.profile` | yes | See Profiles. Selects which extended fields are legal. |
| `spec.graph` | yes | See Graph. |
| `spec.roles` | yes | List of Role ids this definition declares or references. |
| `spec.actors` | no | List of SessionActor declarations (see [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)); required whenever `spec.profile.kind: CoordinationProtocol` needs topology or actor-specific policy, optional otherwise. |
| `spec.operations` | yes | See Operation Primitive. |
| `spec.policy` | no | Definition-scope PolicyPatch, see PolicyPatch. |

## Graph

```yaml
graph:
  entry: <node-id>
  nodes:
    - id: <node-id>
      operations:
        - ref: <operation-id>
          actor: <actor-id>           # optional; omitted when the operation is Role-only
          specialistSlotRef: <slot-id> # optional; ALTERNATIVE to actor -- see Specialist Slots below
          activation:                 # optional; see Activation below
            mode: required | driver-authorized
            maxInvocations: <n>
      transitions: [<node-id>, ...]
```

- Node `kind` (Stage under `Workflow`, Phase under `CoordinationProtocol`) is
  **derived** from `spec.profile.kind` and is not a field on the node object
  (ADR-009 Decision 3). A validator must reject an explicit `kind` field on a
  node.
- `entry` must reference a declared node id. Every `transitions` target must
  reference a declared node id (no dangling reference).
- A node's `operations[].ref` must reference a declared `spec.operations[].id`.
- A node's `operations[].actor`, when present, must reference a declared
  `spec.actors[].id`.
- A node's `operations[].specialistSlotRef` (Phase 09, Step 09 MVP9) is the
  ALTERNATIVE to `actor` — never legal in combination with it on the same
  binding — and must reference a declared `spec.profile.topology.specialistSlots[].id`.
  See [Specialist Slots](#specialist-slots-phase-09-step-09-mvp9) below.

### Activation (Phase 00, Step 09 MVP1/MVP2)

Accepted contract text, scoped to MVP1/MVP2 of the Step 09 group-thinking
substrate ([Step 09 Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md#7-mvp2---driver-authorization-primitive)
remains a Discussion-status document; only `activation` as described here is
promoted out of it). This does not accept deliberation memory, richer
aggregation modes, or `addSessionEdge` — those stay deferred/discussion.
This cell treats substrate MVP2 (§7) and MVP3 recheck/disposition (§8) as
one accepted MVP1/MVP2 slice. Visibility windows were deferred here and are
now accepted separately, at the narrower shape Step 09 MVP6 actually
implemented and proved — see Visibility Windows under the
`CoordinationProtocol` profile below.

`graph.nodes[].operations[].activation` is scoped to the node-operation
**binding**, never to the reusable `spec.operations[]` template. The same
`operations[].id` may be declared `required` at one graph position and
`driver-authorized` at another — `activation` on the shared operation
template itself is not a legal field and must be rejected.

| Field | Notes |
|---|---|
| `mode` | `required` (default whenever `mode` itself is absent — whether `activation` is omitted entirely or present without a `mode` key, e.g. `activation: {maxInvocations: 3}`): the binding materializes through the normal graph path. `driver-authorized`: the binding cannot materialize into an Assignment without a matching `operation-authorized` CoordinationSession event for that exact binding (see [CoordinationSession Contract](coordination-session.md#driver-authorized-optional-operations-and-recheck-mvp1mvp2-step-09)). |
| `maxInvocations` | Optional per-binding invocation cap. It only NARROWS usage at that one binding — it can never widen `aggregateBounds.maxAssignments`, `aggregateBounds.maxRounds`, or `aggregateBounds.maxConcurrency` from the CoordinationSession contract. Aggregate session caps always win when they are stricter than a binding's `maxInvocations`. The binding's consumed-invocation count is counted fresh from the on-disk `operation-authorized` events for that exact binding (never from in-memory state) — the same freshness guarantee `aggregateBounds` carries in the CoordinationSession contract. |

An unknown `activation.mode` value is rejected at validation, the same as any
other unrecognized enum value in this contract.

## Operation Primitive

```yaml
operations:
  - id: <local-operation-id>
    role: <role-id>
    capabilities: [<mechanism-or-tool>]
    task:
      taskSpec: <optional-declared-taskspec-id>
      contractTemplate: <optional-inline-template-id>
    policy:
      minTier: lightweight | standard | creative | analytical | critical
    result:
      kind: advisory | gate-verdict | work-product
      evidenceRequired: reported | verified
    contributions:
      allowedTypes: [proposal | objection | response | clarification | rank | specialist-request, ...]
```

| Field | Notes |
|---|---|
| `id` | Local graph identity; referenced by `graph.nodes[].operations[].ref`. |
| `role` | The Role this operation requires; must reference a declared `spec.roles[]` entry. |
| `capabilities[]` | Required mechanisms/tools; stored and validated, does not resolve execution infrastructure directly. |
| `task.taskSpec` \| `task.contractTemplate` | Optional under `CoordinationProtocol`; `task.taskSpec` is required for a `Workflow` primary operation per the existing compatibility path. |
| `policy` | A PolicyPatch fragment (see below); carries constraints/hints, never commands, credentials, or lifecycle authority. |
| `result.kind` | Governs interpretation; `gate-verdict` is legal only under `Workflow` (see Profiles). |
| `result.evidenceRequired` | `verified` or `reported`, per the accepted [Assignment, Run, And RunResult Contract](assignment-run-runresult.md#confidence) confidence rules. |
| `contributions.allowedTypes[]` | Optional (Phase 08, Step 09 MVP8). Each entry must be one of the closed MVP8 contribution-type enum; no duplicates. **May be empty, and an ABSENT `contributions` key means the same thing as an explicit `allowedTypes: []`: this operation declares no allowed contribution type**, never "all types allowed" — see the CoordinationSession contract's [Deliberation Contribution Ledger](coordination-session.md#deliberation-contribution-ledger-mvp8-step-09) section for how `linkSessionContribution` consumes this field. Legal under either profile (like `capabilities`/`policy`); only `CoordinationProtocol` sessions can ever call `linkSessionContribution` to consume it. |

**V1 deliberately omits a `purpose` field on this primitive.** Operation `id`,
`role`, `capabilities`, and `policy` are the routing surface (ADR-009
Decision 5). A validator must reject an unknown top-level field on an
operation, including `purpose`, until a future ADR reopens this.

## Profiles

`spec.profile.kind` is a required discriminator. Exactly one of the following
two profiles applies in V1.

### `Workflow`

```yaml
profile:
  kind: Workflow
  work:
    baseStepMap:
      <stage-id>: <base-step-id>
```

- Graph nodes are Stages.
- `profile.work.baseStepMap` is required wherever the existing primary-
  operation compatibility path (`stage.skill`/`stage.taskSpec`, per the
  [Workflow Stage Operation Contract](workflow-stage-operation.md)) applies.
- `result.kind: gate-verdict` is legal only under this profile.
- **Forbidden under `CoordinationProtocol`:** `profile.work`, `baseStepMap`,
  a mandatory `task.taskSpec` on every operation, `result.kind: gate-verdict`.

### `CoordinationProtocol`

```yaml
profile:
  kind: CoordinationProtocol
  completion:
    mode: synthesize | all-required | explicit-partial
    aggregation: { ... }                # optional; see completion.aggregation below
  topology:
    contextVisibility: mediated | isolated-until-fan-in | broadcast
    edges:
      - from: <actor-id>
        to: <actor-id>
        intents: [<intent>]
        maxRounds: <n>
    visibilityWindows: [ ... ]          # optional; see Visibility Windows below
    specialistSlots: [ ... ]            # optional; see Specialist Slots below
  cohort:
    count: <n>
    distinctProviderFamilies: <n>
    requiredRoles: [<role-id>, ...]
    independence: isolated-until-fan-in
```

- Graph nodes are Phases.
- `topology` declares who may communicate with whom, for what intent, and
  under what round cap; an edge not declared here is illegal at runtime.
- `cohort` expresses cross-actor allocation constraints (see
  [CoordinationSession Contract](coordination-session.md) for how a Cohort
  Planner consumes them); it never spawns an executor directly.
- `completion.mode: synthesize` requires at least one operation with
  `result.kind: advisory` reachable from every legal completion path.
- **Forbidden under `Workflow`:** `topology`, `cohort`, `completion.mode`.
  A `Workflow` FlowDefinition that declares any of these fields is rejected
  at validation.

#### `completion.aggregation` (Phase 07, Step 09 MVP7)

```yaml
profile:
  kind: CoordinationProtocol
  completion:
    mode: synthesize
    aggregation:
      method: evidence-preserving-synthesis
      outputOperationRef: <operation-id>
      sourceOperationRefs: [<operation-id>, ...]
      requiredDisclosures: [<disclosure-id>, ...]
```

Cognitive aggregation is declared **separately from `completion.mode`**, never
as another mode value. That separation is the phase's whole point: completion
eligibility (which actors must finish), cognitive validation (whether the
contributions actually cohere), and terminal authority (who transitions the
session) stay three different things. Declaring `aggregation` changes nothing
about how `mode` is validated or what it means, and a definition that omits it
produces a byte-identical `completion` object.

| Field | Notes |
|---|---|
| `method` | `evidence-preserving-synthesis` is the only legal value; any other is rejected. One honest method before any voting/ranking machinery. |
| `outputOperationRef` | The operation that produces the aggregate. Must reference a declared `spec.operations[]` id; a dangling ref is rejected. |
| `sourceOperationRefs[]` | The contributions being aggregated. Non-empty, deduplicated, each a declared operation id, and none of them may be `outputOperationRef` itself — an aggregation may not be its own source. |
| `requiredDisclosures[]` | Non-empty. Each id the runtime cannot derive from session evidence fails the evaluator's disclosure coverage and forces `no-consensus`; a requirement is never silently skipped. |

**Declaring it makes it mandatory for that protocol.** A session bound to a
definition that declares `completion.aggregation` may not close on quorum
alone: the request door refuses the close until an aggregation has been
validated for that session, and the engine independently refuses any close
whose named aggregation did not reach `consensus`. "Bound" is literal — the
request door resolves the definition from the session's own
`manifest.definitionRef` and refuses version drift, so what the *current*
request names cannot change whether the session is gated. See
[Evidence-Preserving Aggregation](coordination-session.md#evidence-preserving-aggregation-mvp7-step-09)
in the CoordinationSession contract for the runtime half — the
`aggregation-validated` event, what replay refuses, and why a validated
outcome can only ever narrow a close, never cause or upgrade one.

**Opt-in, and opt-in at the schema level.** `aggregation` is optional. No
protocol shipped under `core/` declares one today, and a definition without it
reaches exactly the close it reached before this field existed.

**Named limitations.** `mode` remains *required* whenever `completion` is
present, so declaring `aggregation` alone is still rejected — pre-existing
behavior, deliberately left alone. The runtime-side limitations (a careful
same-driver forgery of the validation event, the definition being pinned by
`{id, version}` rather than by content, a `partialPolicy`-permitted omission
that can leave a declared-aggregation session permanently unclosable, and the
non-atomic "latest validated aggregation supersedes" selection) are named in
full in the CoordinationSession contract section linked above and are **not**
closed here.

- **Forbidden under `Workflow`:** `completion` entirely, and therefore
  `completion.aggregation` structurally.

#### Visibility Windows (Phase 06, Step 09 MVP6)

```yaml
profile:
  kind: CoordinationProtocol
  topology:
    visibilityWindows:
      - id: <window-id>
        opensAfter:
          milestone: listed-results-linked
          operationRefs: [<operation-id>, ...]
        permits:
          sourceOperationRefs: [<operation-id>, ...]
          delivery: artifact-refs

graph:
  nodes:
    - id: <node-id>
      operations:
        - ref: <operation-id>
          actor: <actor-id>
          activation:
            mode: driver-authorized
          contextAccess:
            visibilityWindowRef: <window-id>
```

A visibility window declares **what a later binding may be granted, and not
before when**. It never anonymizes, aggregates, transforms, or partially
discloses anything: the concrete authority over what was actually granted
stays exactly where it already was — `operation-authorized.grantedContextRefs`
and `assignment-created.contextGrant.refs` (see
[CoordinationSession Contract](coordination-session.md)). A window only
decides whether that grant is legal yet.

| Field | Notes |
|---|---|
| `visibilityWindows[].id` | Window identity, unique within the definition. A duplicate id is rejected. |
| `opensAfter.milestone` | `listed-results-linked` is the only legal value; any other is rejected. |
| `opensAfter.operationRefs[]` | The source obligations. Each must reference a declared `spec.operations[]` id; a dangling ref is rejected. The window is open only when **every** listed operation is satisfied, and an operation bound to several actors (a fan-out cohort sharing one template) is satisfied only when **every** binding of it is — a partial cohort never opens a window. **Degenerate case:** an EMPTY list is schema-legal and satisfies vacuously — every-of over zero sources is true — so the window is permanently open from session open, with no work done and nothing gated. A definition that means to gate must list at least one source operation. |
| `permits.sourceOperationRefs[]` | Declares which operations' outputs the window is meant to carry. Validated (each must reference a declared operation id), **not enforced as a per-ref runtime filter** — see Limitations. |
| `permits.delivery` | `artifact-refs` is the only legal value; any other is rejected. Same status as `sourceOperationRefs[]`: validated, not a runtime filter. |
| `contextAccess.visibilityWindowRef` | Binding-scoped, exactly like `activation`, and never legal on a `spec.operations[]` template. Must resolve to a declared window id; an unknown ref is rejected. |

**How a source obligation is satisfied, and by what evidence.** Window state
is never stored. It is derived, fresh on every check, from the session's own
`assignment-created` / `result-linked` events plus the on-disk RunResult each
`result-linked` names, so replay reaches the same verdict from the same disk
state with no cached or latched answer in between. A source operation is
satisfied when, for every actor the graph binds it to (following any
`actor-replaced` lineage recorded in this session's own log to the current
effective actor — the derivation follows that lineage as written and applies
no acceptance check of its own at read time; see Residuals), that actor has an
Assignment **that carries the engine's reserved `protocol-operation:` contract
stamp for that exact operation** and a linked RunResult that is not
`status: failed` / `confidence: failed` / `confidence: no-evidence`. Missing,
late (created but never linked), and failed all keep the window shut.

The reserved stamp is the enforcement primitive, and it is the only channel
consulted for *which operation an Assignment performed* (the bound actor still
selects which branch that Assignment answers). It is written by
`dispatchDeclaredOperation` — the sole **mediated** door that materializes a
declared operation — and the shared read-only contract constructor refuses any
caller-supplied constraint in that namespace, so a mediated door that does not
stamp produces Assignments that satisfy no window source at all, whatever
their actor, claim key, or provenance. Neither actor identity nor a claim key
is evidence of which operation was performed. That guarantee has a boundary,
stated here rather than left to a later paragraph: it holds for everything
reaching the store through a mediated door and for nothing that bypasses one.
The unmediated `createSessionAssignment` store door can write the reserved
stamp itself, and two further residuals are named at the end of this section.

**Where the gate applies.** Both checks sit on the driver-authorized grant
boundary: `authorizeDeclaredOperation` refuses to write an authorization for
a window-gated binding while its window is shut, and the dispatch path
independently re-derives the same verdict before materializing the
Assignment, so a raw-store-door authorization does not get through. The
existing same-session ownership rule for granted refs is unchanged and still
enforced — window legality is additive to it, never a replacement.

**Limitations, named rather than omitted.** All three are refusals or inert
metadata, never a silent widening:

1. `permits.sourceOperationRefs[]` / `permits.delivery` are validated
   structural intent, **not** enforced as a per-ref filter over
   `grantedContextRefs`. A window that is open permits the binding's whole
   grant; individual refs are checked for same-session ownership only. Real
   `grantedContextRefs` values are frequently opaque artifact strings, and
   this contract defines no primitive mapping such a ref back to the
   operation that produced it.
2. An operation bound at two **different** nodes to two **different** actors
   along mutually exclusive graph paths is treated as one cohort by the
   all-of rule, so its window can never open (a liveness limit, not a
   bypass). Telling a cohort apart from an either/or branch needs a
   discriminator this schema does not have. No definition committed to this
   repository has that shape.
3. `contextAccess.visibilityWindowRef` on a `required` binding is
   schema-valid but runtime-inert: a `required` binding has no grant, so
   there is nothing for the gate to refuse. A definition that means to gate
   an operation must declare it `activation.mode: driver-authorized`, as
   `independent-research-fan-out-fan-in-gated.yaml` does.

**Residuals.** Three narrower ones. Residuals 1 and 3 sit at the same
unmediated-store-door trust boundary — each reachable only by writing to
the store directly, past every mediated door. Residual 2 is different: it
is an ordinary consequence of graph structure, reachable through normal
mediated dispatch, no store-door access needed.

1. The unmediated `createSessionAssignment` store door can write the reserved
   `protocol-operation:` stamp itself. That is how a replacement actor's
   re-attempt declares the obligation it discharges, and it is the documented
   trust boundary.
2. One operation bound to the **same** actor at two different nodes collapses
   to a single branch, so one satisfied Assignment answers both positions.
3. An `actor-replaced` event written straight through the store
   (`recordActorReplacement`) can collapse two branches of one cohort onto a
   single effective actor: declare `researcher-a` replaced by its cohort
   sibling `researcher-b`, and researcher-b's one genuine, engine-stamped
   Assignment satisfies both branches, opening the window on half the real
   work. No stamp forgery is involved, so residual 1's defense does not cover
   this shape. The mediated door refuses exactly it — `replaceSessionActor`
   (`src/runner/coordination/session-engine.mjs:3156-3166`) rejects a
   replacement actor that already carries its own independent activity,
   because that is "the shape that lets one actor's real result get silently
   double-counted to cover two required slots" — and window derivation does
   not re-apply that collision rule at read time. Named here as a boundary of
   the unmediated door, not an oversight; re-applying the rule during
   derivation is future work this phase did not ship.

What holds across all three: window derivation reads only **this session's own
event log** for `assignment-created` / `result-linked`, then consults the
RunResult each names on disk. That event-log filter — not any session scoping
of `.fgos/assignments/`, which is repo-wide and has none — is what makes
another CoordinationSession's Assignment satisfy nothing here: it stays
invisible to a window until an `assignment-created` event for it exists in
this session's log.

- **Forbidden under `Workflow`:** `visibilityWindows` (structurally, as part
  of `topology`) and `contextAccess` on any node-operation binding. A
  `Workflow` FlowDefinition declaring either is rejected at validation.

#### Specialist Slots (Phase 09, Step 09 MVP9)

```yaml
profile:
  kind: CoordinationProtocol
  topology:
    specialistSlots:
      - id: <slot-id>
        role: <role-id>
        operationRefs: [<operation-id>, ...]
        requiredCapabilities: [<capability>, ...]
        allowedVisibilityWindows: [<window-id>, ...]
        maxBindings: <n>
        maxAssignments: <n>

graph:
  nodes:
    - id: <node-id>
      operations:
        - ref: <operation-id>
          specialistSlotRef: <slot-id>
          activation:
            mode: driver-authorized
```

A specialist slot declares a **bounded, predeclared capacity** for a
previously-unknown specialist identity to fill — never an open-ended actor
pool, and never a runtime topology edge. Filling one is a two-step, fully
mediated process: the driver authorizes a specialist actor identity into a
declared slot (`specialist-authorized`, see the
[CoordinationSession Contract](coordination-session.md#specialist-slot-binding-mvp9-step-09)
for the runtime half), and only then may a `specialistSlotRef` binding
resolve to a dispatchable actor.

| Field | Notes |
|---|---|
| `specialistSlots[].id` | Slot identity, unique within the definition and disjoint from every other declared id space (`spec.actors[].id`, `spec.roles[]`, `spec.operations[].id`, `spec.graph.nodes[].id`) — a slot id colliding with any of them is rejected. |
| `specialistSlots[].role` | Must reference a declared `spec.roles[]` id, and must equal the `role` of every operation named in this slot's own `operationRefs[]` — a slot naming an operation of a different role is statically unfillable and rejected. |
| `specialistSlots[].operationRefs[]` | Non-empty, deduplicated, each a declared `spec.operations[].id`. A specialist bound to this slot may act ONLY on these operations — never any operation outside this list, and never via an undeclared expansion path. |
| `specialistSlots[].requiredCapabilities[]` | Each must resolve against the definition-wide union of every declared operation's `capabilities[]`. May be empty — an empty list means "no gate on that dimension" (any capability set satisfies it), not "unfillable." An authorized specialist's own `capabilities[]` must be a SUPERSET of this list (the slot names a floor, not a ceiling). |
| `specialistSlots[].allowedVisibilityWindows[]` | Each must reference a declared `visibilityWindows[].id`. May be empty (same "no gate on that dimension" reading as `requiredCapabilities[]`). |
| `specialistSlots[].maxBindings` | Positive integer. A hard, monotonic ceiling on how many DISTINCT specialist actor identities may EVER be authorized into this slot across the session's whole history — never decremented by expiry or replacement. Re-authorizing the SAME actor already occupying the slot does not consume a new binding. |
| `specialistSlots[].maxAssignments` | Positive integer. A ceiling on the TOTAL `operation-authorized` invocations one authorized specialist actor may receive across every operation its slot declares (not a per-operation cap — a specialist filling two operations in the same slot shares one pool). |

A `graph.nodes[].operations[].specialistSlotRef` binding is the ALTERNATIVE
to `actor` (see Graph above) — mutually exclusive with it on the same
binding, never legal in combination — and must reference a declared
`specialistSlots[].id`. It must also declare `activation.mode:
driver-authorized`; the `required` (default) activation mode is not legal on
a specialist-slot binding, since a slot has no default occupant to
materialize against.

**"Undeclared slot expansion" is a structural closure property, not a
runtime check.** No schema field anywhere resolves `actor` against a slot
id — a slot id is never a member of the `spec.actors[]` id set a `actor`
binding validates against — so an operation binding can never "expand into"
a slot except through the one declared `specialistSlotRef` field. This is
proven by absence (no such resolution code path exists), not by a runtime
refusal, and is the same reading `topology.edges[]` uses: an edge naming a
declared specialist slot id as its `from`/`to` is rejected, since a slot is
declarative capacity, never a routable topology edge endpoint.

**Named limitations, not omitted.**

1. `requiredCapabilities[]`/`allowedVisibilityWindows[]` resolve against
   definition-wide unions (every declared operation's capabilities; every
   declared window), not against only the slot's own `operationRefs[]` —
   a slot may name a capability or window scoped to an operation outside
   its own operation list. Such a slot is over-declared, not unfillable:
   nothing about it is statically undispatchable. Narrowing either to the
   slot's own operations was named as a product decision for a later cell
   and has not been taken.
2. `allowedVisibilityWindows[]` is declared on the slot but not yet
   cross-checked against a specialist's dispatched operation binding's own
   `contextAccess.visibilityWindowRef` at authorize or dispatch time — the
   pre-existing `deriveVisibilityWindowState` gate applies unchanged and
   uniformly to a slot-bound operation exactly as it does to a
   statically-bound one, but nothing yet refuses an authorization naming a
   visibility window outside the slot's own declared list specifically.
3. `allowedContextRefs` (declared on the `specialist-authorized` event
   itself, not on the slot) is validated for session ownership at
   authorization time but not yet enforced as a ceiling on the later,
   per-invocation `operation-authorized.grantedContextRefs` choice. See the
   CoordinationSession contract's Specialist Slot Binding section for the
   full reasoning.

- **Forbidden under `Workflow`:** `specialistSlots` (structurally, as part
  of `topology`) and `specialistSlotRef` on any node-operation binding. A
  `Workflow` FlowDefinition declaring either is rejected at validation.

Both profiles reject an operation whose `role` is not declared in
`spec.roles`, and reject a `spec.actors[]` entry whose `role` is not declared
in `spec.roles` (no implicit Role creation from an actor declaration).

## PolicyPatch

One validated shape at every declared scope (definition, node, operation,
role, actor, Assignment, human/CLI, governance):

```yaml
policy:
  minTier: lightweight | standard | creative | analytical | critical
  preferPersona: <persona-id>
  preferExecutor: <executor-id>
  fallbackExecutors:
    - <executor-id>
  visibility: headless | visible
```

- `minTier` is monotonic across scopes: a more specific scope may raise the
  floor, never lower it below a less specific scope's requirement.
- `fallbackExecutors` is `reserved-not-executed` in V1 — parseable for
  compatibility, never automatically executed as failover (see dispatch
  Phase 00 R10). A FlowDefinition validator must not imply automatic failover
  from its presence.
- `preferExecutor`/`preferPersona`/`visibility` follow most-specific-wins
  before governance; governance stays final regardless of any declared
  preference.
- Literal executor/model names in `policy` are trusted session/human/project
  overrides, not portable framework defaults; a *portable* `CoordinationProtocol`
  or `Workflow` definition expresses requirements (`minTier`, `capabilities`),
  not literal executor/model pins.

**Provenance.** Wherever an effective policy value is persisted (Assignment
policy, session/actor policy), it is recorded as:

```json
{ "field": { "value": "<resolved-value>", "source": { "scope": "<scope>", "id": "<source-id>" } } }
```

for each of `executor`, `provider`, `model`, `tier`, `persona`, `visibility`,
`constraints`, and `governance`. `scope` names the layer that won
(`runner`, `definition`, `node`, `operation`, `role`, `actor`, `assignment`,
`cli`, `governance`); `id` names the specific source within that scope (for
example a definition id, a role id, or `cli`). This is the same shape the
[CoordinationSession Contract](coordination-session.md#policypatch-provenance)
references.

## Forbidden Fields Summary

| Context | Forbidden | Reason |
|---|---|---|
| Any `FlowDefinition` operation | `purpose` | ADR-009 Decision 5; no second consumer yet. |
| Any graph node | `kind` | Derived from `spec.profile.kind`; ADR-009 Decision 3. |
| `Workflow` profile | `topology` (`visibilityWindows`/`specialistSlots` included), `cohort`, `completion.mode`, `contextAccess`/`specialistSlotRef` on a node-operation binding | Protocol-only; no Work lifecycle concept needs them. |
| Any `spec.operations[]` template | `contextAccess` | Binding-scoped only, exactly like `activation` (Phase 06, Step 09 MVP6). |
| `CoordinationProtocol` profile | `profile.work`, `baseStepMap`, mandatory `task.taskSpec`, `result.kind: gate-verdict` | Would import Work lifecycle authority into a standalone protocol. |
| Any `FlowDefinition` | a `missionId` field anywhere | ADR-008 Decision 5; Mission stays deferred-preserved. |
| A literal `policy.preferExecutor` at definition/role/actor/operation scope, on any portable `CoordinationProtocol` or `Workflow` document | `preferExecutor` | A *portable* definition expresses requirements (`minTier`, `capabilities`), never a literal executor pin — that authority is trusted session/human/project-scope only (PolicyPatch, above). Runtime-enforced by `assertNoPortableExecutorPin` (`session-engine.mjs`); a request's own trusted per-actor `actors[].executor` field is the correct channel instead (proven protocol-agnostic, `P10.1.md`/`P10.3.md`, Step 09 Phase 10). Named as a contract-text gap by P10.2's own Reviewer (found investigating RFC-Review-Lite's own objector-actor `policy.minTier` elevation), closed here by P10.10. |

## Required Negative Tests

- A node declaring its own `kind` field is rejected regardless of value.
- A `CoordinationProtocol` definition declaring `profile.work` or
  `baseStepMap` is rejected.
- A `Workflow` definition declaring `topology` or `cohort` is rejected.
- An operation declaring `purpose` is rejected.
- An operation's `role` not present in `spec.roles` is rejected.
- A `graph.nodes[].operations[].actor` not present in `spec.actors` is
  rejected.
- A `policy.minTier` at a more specific scope that is lower than a less
  specific scope's already-resolved floor is rejected (monotonicity).
- Existing `domains/coding/workflows/*.yaml`, unchanged, continues to
  normalize through `normalizeWorkflow()` exactly as before; the
  `Workflow`-profile FlowDefinition adapter output is checked separately and
  never replaces that normalized shape as the loader's return value in this
  phase.
- An `activation.mode` value other than `required` or `driver-authorized` is
  rejected (Phase 00, Step 09 MVP1/MVP2).
- An `activation` field declared on a `spec.operations[]` template entry
  (rather than on a `graph.nodes[].operations[]` binding) is rejected —
  `activation` is binding-scoped only (Phase 00, Step 09 MVP1/MVP2).
- A `contextAccess.visibilityWindowRef` that resolves to no declared
  `visibilityWindows[].id` is rejected (Phase 06, Step 09 MVP6).
- A `visibilityWindows[]` entry with a duplicate `id`, a dangling
  `opensAfter.operationRefs[]` or `permits.sourceOperationRefs[]` entry, an
  `opensAfter.milestone` other than `listed-results-linked`, or a
  `permits.delivery` other than `artifact-refs` is rejected (Phase 06).
- A `Workflow`-profile definition declaring `visibilityWindows` or any
  binding `contextAccess` is rejected, and `contextAccess` on a
  `spec.operations[]` template entry is rejected as an unknown operation
  field (Phase 06).
- A window whose listed source operations have not all settled — including
  the case where only part of a fan-out cohort bound to one source operation
  has settled — leaves every binding that names it unauthorizable and
  undispatchable; an Assignment carrying no reserved `protocol-operation:`
  stamp for a listed source operation satisfies it not at all, regardless of
  that Assignment's actor or claim key; and an Assignment belonging to a
  different CoordinationSession satisfies it not at all (Phase 06, runtime).
- A window whose `opensAfter.operationRefs[]` is EMPTY is accepted by
  validation and is permanently open, gating nothing — the degenerate case is
  named in the field table rather than rejected (Phase 06, runtime).
- A `specialistSlots[]` entry with a dangling `role`, `operationRefs[]`,
  `requiredCapabilities[]`, or `allowedVisibilityWindows[]` reference; a
  non-positive-integer `maxBindings`/`maxAssignments`; an empty or
  duplicate-containing `operationRefs[]`; a `role` that does not match every
  named operation's own declared `role`; or a slot id colliding with a
  declared actor, role, operation, or graph node id is rejected (Phase 09,
  Step 09 MVP9).
- A `topology.edges[]` entry naming a declared specialist slot id as its
  `from`/`to` is rejected — a slot is declarative capacity, never a routable
  topology edge endpoint (Phase 09, Step 09 MVP9).
- A `graph.nodes[].operations[].specialistSlotRef` binding declaring both
  `actor` and `specialistSlotRef`, naming an undeclared slot id, naming an
  operation not among the slot's own `operationRefs[]`, or declaring
  `activation.mode` other than `driver-authorized` (including the default
  omitted case) is rejected (Phase 09, Step 09 MVP9).
- A `Workflow`-profile definition declaring `specialistSlots` or any binding
  `specialistSlotRef` is rejected (Phase 09, Step 09 MVP9).
