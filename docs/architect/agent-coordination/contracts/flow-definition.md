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
without them. Full per-phase trace:
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
  topology:
    contextVisibility: mediated | isolated-until-fan-in | broadcast
    edges:
      - from: <actor-id>
        to: <actor-id>
        intents: [<intent>]
        maxRounds: <n>
    visibilityWindows: [ ... ]          # optional; see Visibility Windows below
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
| `Workflow` profile | `topology` (`visibilityWindows` included), `cohort`, `completion.mode`, `contextAccess` on a node-operation binding | Protocol-only; no Work lifecycle concept needs them. |
| Any `spec.operations[]` template | `contextAccess` | Binding-scoped only, exactly like `activation` (Phase 06, Step 09 MVP6). |
| `CoordinationProtocol` profile | `profile.work`, `baseStepMap`, mandatory `task.taskSpec`, `result.kind: gate-verdict` | Would import Work lifecycle authority into a standalone protocol. |
| Any `FlowDefinition` | a `missionId` field anywhere | ADR-008 Decision 5; Mission stays deferred-preserved. |

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
