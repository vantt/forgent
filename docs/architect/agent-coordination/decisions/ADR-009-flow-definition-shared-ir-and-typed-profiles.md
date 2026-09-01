# ADR-009: Versioned FlowDefinition As Shared Graph/Operation/Policy IR With Typed Profiles

Document type: ADR
Design status: Accepted
Implementation: Not started
Last reviewed: 2026-09-01
Canonical for: the FlowDefinition intermediate representation, the Workflow/CoordinationProtocol profile split, and the V1 operation-primitive field set
Related: [Vision V-006/V-008/V-012](../vision.md), [Protocol Model](../architecture/protocol-model.md), [Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md), [FlowDefinition Contract](../contracts/flow-definition.md), [ADR-008](ADR-008-coordination-session-and-mission-deferral.md), [Intent Preservation Ledger AC-I003/AC-I005/AC-I006](../intent-preservation-ledger.md)

## Context

`normalizeWorkflow()` (`src/state/workflow-stage-graphs.mjs:188-275`) already
decomposes Workflow YAML into a graph of nodes/transitions plus an operation
map with an identical policy key set to what a standalone
`CoordinationProtocol` needs (`role`, `capabilities`, `policy.minTier`, and
friends — confirmed against `src/setup/registrations.mjs:834`). Workflow and
the proposed `CoordinationProtocol` are two concrete, unlike consumers of the
same graph/operation/policy shape, which meets the Vision's V-012
two-consumer threshold for a shared abstraction.

Two defects in the original checkpoint draft would have made a naive shared
kernel unsafe: (1) a node-level `kind: Stage | Phase` field would duplicate
the profile discriminator (`spec.profile.kind`), producing two sources of
truth for the same fact (finding M1); and (2) making `purpose` a
cross-definition routing key on every operation has no second consumer today
— nothing on the Assignment path reads it, and only the CLI's unrelated
`decide/execute --for <purpose>` door consumes a same-named string today
(finding M8). The workflow loader also has 15+ existing consumers
(`getDomain`, `operationsForStage`, `effectiveStage`, `stageForStep`, and
direct readers of `domain.stages`/`stepMap`/`operationMap` in
`src/runner/loop.mjs`, `src/intake/plan.mjs`, `src/report/entropy.mjs`,
`src/state/work.mjs`, `src/setup/registrations.mjs`); none of them may be
forced to migrate as a side effect of this decision (finding H3).

## Decision

1. **`FlowDefinition` is the shared, versioned graph/operation/policy IR.**
   One root kind (`apiVersion`, `kind: FlowDefinition`, `metadata.id`) carries
   a common `spec` kernel — `spec.graph`, `spec.roles`, `spec.actors`,
   `spec.operations`, `spec.policy` — plus a required typed `spec.profile`
   discriminator selecting `Workflow` (Stage semantics, Work lifecycle
   integration) or `CoordinationProtocol` (Phase semantics, topology, cohort,
   completion/synthesis, explicitly **no** Work lifecycle authority). The
   exact field set is defined in the
   [FlowDefinition Contract](../contracts/flow-definition.md).
2. **This IR is additive, not a migration of existing consumers.** The
   FlowDefinition/Workflow adapter is a second projection built from the
   *already-normalized* `normalizeWorkflow()` output, not a rewrite of
   `domains/<domain>/workflows/*.yaml` or of the raw-map reading behavior any
   existing consumer relies on. In this phase, none of `getDomain`,
   `operationsForStage`, `effectiveStage`, `stageForStep`, or any direct
   reader of `domain.stages`/`stepMap`/`operationMap` is required to move onto
   the new IR. The adapter's credibility rests on this rule holding; if a
   future phase needs a consumer to migrate, that migration is its own
   decision, not implied by this ADR.
3. **Node-level `kind` is derived, not restated.** A graph node's Stage-versus-
   Phase identity comes from `spec.profile.kind`; the node schema does not
   carry an independent `kind` field a validator could disagree with. A
   `Workflow` FlowDefinition's nodes are Stages; a `CoordinationProtocol`
   FlowDefinition's nodes are Phases. This closes finding M1's duplicated-
   discriminator defect.
4. **`role`/`seat`/responsibility-position stay one concept; `Stage` and
   `Phase` are the profile-typed graph-node public names.** `Workflow`
   normally declares only `roles`; `CoordinationProtocol` declares `actors`
   whenever topology or actor-specific allocation needs stable local
   identities (see [ADR-008](ADR-008-coordination-session-and-mission-deferral.md)
   for the SessionActor/Role/Persona/Stance split this reuses).
5. **`purpose` is dropped from the FlowDefinition V1 operation primitive.**
   The common operation shape is `id`, `role`, `capabilities[]`, `task`
   (`taskSpec` or `contractTemplate`), `policy`, `result`. Activity-kind
   tiering (diverge wants creative, critique wants analytical, judgment wants
   critical) attaches through `operation.policy.minTier`, which is already a
   legal, validated field — not through a new routing key. The existing CLI
   `decide`/`execute --for <purpose>` door is unrelated and unchanged; this
   decision does not touch it or ADR-006. The trigger for re-adding a
   cross-definition `purpose` routing key ("two real definitions need shared
   task-category routing") is recorded in the
   [Intent Preservation Ledger under AC-I006](../intent-preservation-ledger.md#ac-i006-one-governed-dispatch-and-evidence-core),
   not in this ADR's body, so a future revisit does not require amending an
   accepted decision to check whether its trigger has fired.
6. **PolicyPatch is one validated shape reused at every declared scope.**
   `minTier | preferPersona | preferExecutor | fallbackExecutors | visibility`
   is the same key set `src/setup/registrations.mjs:834` already validates.
   Effective values persist with field-level provenance
   `{field: {value, source: {scope, id}}}` (or an equivalent versioned
   machine-readable form); the exact scopes implemented in a given phase are
   a roadmap concern, not this ADR's.
7. **Profile validation keeps Work authority out of protocols.** A
   `CoordinationProtocol` FlowDefinition rejects `profile.work`,
   `baseStepMap`, a required `taskSpec`, and `resultKind: gate-verdict` — all
   Workflow-only fields. A `Workflow` FlowDefinition rejects protocol-only
   fields (`topology`, `cohort`, `completion.mode`). Both directions are
   explicit negative-fixture requirements in the
   [FlowDefinition Contract](../contracts/flow-definition.md).

## Consequences

- Workflow and CoordinationProtocol definitions share one normalization,
  reference-validation, and policy-vocabulary path without either profile
  gaining the other's authority.
- A domain or organization package can add a `CoordinationProtocol`
  definition without forking the loader used for `Workflow`.
- Cohort/diversity allocation (Step 08 Phase 04+) has a stable IR to build on
  without a second graph-normalization implementation.
- Existing Workflow consumers and golden tests are unaffected until an
  explicit future decision migrates them.
- A cross-definition `purpose` routing key remains available to add later
  without contradicting this ADR, once its recorded ledger trigger fires.

## Rejected Alternatives

- **Copy the Workflow schema into protocol definitions.** Rejected: forks
  normalization, validation, and policy vocabulary between the two profiles,
  which is exactly the duplication the Vision's two-consumer threshold exists
  to prevent.
- **Reuse `Stage` literally for standalone protocol nodes.** Rejected: `Stage`
  carries Work lifecycle meaning in the accepted vocabulary; reusing it for a
  Work-independent protocol would leak that meaning into standalone
  coordination.
- **One flat, universal YAML schema for both profiles.** Rejected: fields
  legal only in one profile (`baseStepMap`, `topology`) would become
  representable, and often accidentally legal, in the other.
- **Node-level `kind: Stage | Phase` as an explicit, independently-set
  field.** Rejected (finding M1): a Workflow FlowDefinition could then
  represent a node whose `kind` disagrees with its own `profile.kind`, with
  no single source of truth for which one governs.
- **Keep `purpose` on every operation with a `capabilities.<purpose>.prefer`
  routing rung.** Rejected (finding M8): the only current consumer of a
  `purpose`-shaped key is the unrelated CLI capability-purpose resolver;
  adding a second, semantically different `purpose` to the kernel before any
  Assignment-path consumer exists would widen the contract speculatively.
