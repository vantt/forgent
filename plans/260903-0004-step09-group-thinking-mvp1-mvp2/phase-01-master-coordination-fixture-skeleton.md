# Phase 01 - Master Coordination Fixture Skeleton

## Objective

Add and validate the static `standalone-master-coordination-loop`
CoordinationProtocol fixture without adaptive runtime behavior yet.

## Requirements

- **R1 Fixture file.** Add a reusable protocol fixture under
  `core/coordination-protocols/` with id
  `standalone-master-coordination-loop` and a stable version.
- **R2 Worker-only graph.** Declare worker actors only: Doer, Reviewer,
  Red-Team, and Fixer/Doer-followup. Do not declare a coordinator actor.
- **R3 Required first pass.** Express required candidate, review, and red-team
  operations in the static graph.
- **R4 Declared optional positions.** Express revision and recheck operations as
  declared graph positions in a way that can be made driver-authorized by Phase
  02. If the current schema cannot accept `activation` yet, keep those positions
  documented in the phase trace and do not fake runtime behavior.
- **R5 No Work fields.** The fixture must not use `profile.work`, Stage,
  Work lifecycle, git, merge, or coding-domain mutation fields.
- **R6 Existing fixture preservation.** Do not modify
  `core/coordination-protocols/group-cognition-framework.yaml`.

## Files

Expected source/test/docs:

- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
- `test/runner/flow-definition*.test.mjs`
- `docs/architect/agent-coordination/contracts/flow-definition.md` only if Phase
  00 accepted text needs implementation-aligned wording.

Do not modify CoordinationSession runtime or dispatch materialization in this
phase except where a validator import requires adding the new fixture to an
existing discovery test.

## Tests First

Add failing validation tests before the fixture implementation:

- fixture loads from the packaged protocol registry;
- fixture validates as `profile.kind: CoordinationProtocol`;
- fixture rejects if Work-profile fields are injected;
- fixture rejects a coordinator actor if the fixture schema explicitly forbids
  it;
- existing `group-cognition-framework.yaml` still validates unchanged.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/flow-definition*.test.mjs'
```

Run the full test command before closing the phase if any shared loader/schema
code changed.

## Proofs And Exit

- New fixture validates deterministically.
- Current FlowDefinition shape is proven sufficient for the static skeleton or
  the exact missing field is recorded for Phase 02.
- No Work/coding lifecycle field appears in the fixture.
- `group-cognition-framework.yaml` has zero diff.

## Risks / Rollback

Risk: trying to simulate adaptive rounds with static transitions. Do not do
that. Phase 01 only proves the declared skeleton. Adaptive materialization
belongs to Phase 02.

