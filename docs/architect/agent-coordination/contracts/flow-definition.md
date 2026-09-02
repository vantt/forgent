# FlowDefinition And Profile Schema Contract

Document type: Contract
Design status: Accepted
Implementation: Implemented (`src/runner/definitions/{schema,workflow-adapter,protocol-loader}.mjs`,
Step 08 Phase 02; Workflow-profile projection additive at zero diff to
`src/state/workflow-stage-graphs.mjs`; CoordinationProtocol-profile fixtures
ship in `core/coordination-protocols/` and are discoverable from a real
external consuming project, proven live at P07.2 R6. Full per-phase trace:
`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`)
Last reviewed: 2026-09-02
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
| `Workflow` profile | `topology`, `cohort`, `completion.mode` | Protocol-only; no Work lifecycle concept needs them. |
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
