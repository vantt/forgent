# Phase 02 - Shared FlowDefinition Kernel And Typed Profiles

## Objective

Extract only the proven common definition mechanics into a neutral, versioned
IR, then project current Workflow and new CoordinationProtocol definitions into
it without migrating either semantic owner.

## Requirements

- **R1 FlowDefinition IR.** Define a frozen, deterministic IR with
  `schemaVersion`, `id`, `profile`, graph nodes/transitions, roles, actors,
  operations, policies/PolicyPatches, topology, bounds, and result/evidence
  requirements. Node semantics are derived from profile; no duplicate node
  `kind` field and no `purpose` field exists in V1.
- **R2 Typed profiles.** `profile.kind: Workflow` requires Stage semantics and
  may carry Work/base-step/primary-operation compatibility metadata.
  `profile.kind: CoordinationProtocol` requires Phase semantics and may carry
  actors/topology/session bounds. Wrong-profile fields reject with exact paths;
  common fields retain one validator.
- **R3 Actor/role validation.** Every actor has stable id, declared role, and
  optional qualified definition provenance and policy patch. Operation declares
  Role; topology binds SessionActor ids. Reject duplicate ids, unknown roles,
  direct Persona-as-role, unqualified external actor provenance, and assignment
  identity fields. Role definitions own responsibilities and allowed actor
  multiplicity; runtime binding may fill declared slots and policy/persona but
  cannot rewrite a slot's Role.
- **R4 PolicyPatch schema.** Allow only the current policy vocabulary plus
  abstract cohort requirements introduced by accepted contract: min policy
  tier, persona/capabilities/tools/context/evidence/visibility and hard/soft
  diversity. Portable protocols reject concrete executor and literal model.
  Trusted runtime request policy remains a separate input.
- **R5 Additive Workflow projection.** Export/refactor the current normalized
  Workflow into a `FlowDefinition` adapter after `normalizeWorkflow` output.
  Existing `DOMAINS`, flattened active-workflow fields, `operationsForStage`,
  Stage FSM, skills, and TaskSpecs continue reading their current shapes. No
  consumer migration or output change is allowed.
- **R6 CoordinationProtocol loader.** Add deterministic YAML/JSON loading and
  project/domain/core discovery through one registry path. Duplicate ids,
  schema-version mismatch, path escape, unknown fields, and invalid references
  fail closed. Protocol selection remains optional and explicit.
- **R7 Fixtures.** Add one declared consult and one independent research
  fan-out/fan-in protocol fixture. Both normalize through the IR but do not
  execute in this phase. Add a coding `feature` Workflow golden projected
  through the same IR.
- **R8 Setup/doctor and packaging.** Register definition locations/validation
  with setup/doctor and package/architecture manifests. Project config overrides
  global by existing setup doctrine. Do not add a config default unless runtime
  genuinely reads it; if added, merge and doctor it in the same cell.

## Files

Prefer a neutral `src/runner/definitions/` package for schema, validators,
loader, registry, and profile adapters. Modify
`src/state/workflow-stage-graphs.mjs` only to export/use the additive projection;
modify `src/setup/registrations.mjs` and `src/setup/checks.mjs` for one shared
definition validation door. Store reusable foundation fixtures under a packaged
`core/coordination-protocols/` location and domain fixtures only when they add
domain semantics.

Do not modify CoordinationSession execution behavior, dispatch resolver,
Workflow YAML semantics, Stage FSM, Work entities, or CLI verbs.

## Tests First

- Pure deterministic normalization and deep-freeze tests.
- Unknown/duplicate ids, graph references, cycles where profile forbids them,
  missing operations, wrong profile fields, forbidden executor/model, and
  schema-version mismatch.
- Existing coding Workflow golden before/after is deep-equal outside the new
  additive projection.
- Core/project/domain fixture discovery and project-over-global precedence.
- Doctor reports malformed definition with source path and leaves files
  unchanged; setup remains idempotent.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/state/workflow-stage-graphs.test.mjs \
  test/setup/registrations.test.mjs \
  test/setup/*.test.mjs \
  'test/runner/flow-definition*.test.mjs'
npm test
```

## Proofs And Exit

Three fixtures normalize deterministically; every profile-negative fixture
fails loudly; all pre-existing Workflow consumers and tests remain unchanged.
Record AC-I003/005/006 must-not-preclude proofs and a zero-consumer-migration
diff audit.

## Risks / Rollback

The main risk is turning a shared IR into a replacement runtime. Keep the
Workflow adapter downstream of existing normalization and prohibit changing
consumer imports in this phase. Revert the adapter/kernel without touching
Stage behavior.
