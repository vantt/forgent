# ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot

Document type: ADR
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-09-01
Canonical for: how declared and agent-led execution requests converge on one Assignment
Related: [Vision V-003/V-004](../vision.md), [ADR-002](ADR-002-stage-operation-compatibility.md), [ADR-003](ADR-003-assignment-run-runresult-separation.md), [Assignment contract](../contracts/assignment-run-runresult.md)

## Context

`buildAssignment()` and `executeAssignment()` currently accept only a declared
`domain + workflow + stage + operation` whose TaskSpec exists on disk. The
standalone mission-lite prototype therefore borrows the coding `planning` Stage
to reach dispatch. Mutation classification is derived from operation/role sets
(`READ_ONLY_ROLES`, `KNOWN_MUTATING_OPS`, plus a `missionId || workId === null`
heuristic), and evidence requirements are per-operation branches in result
interpretation. A request without an operation id has no way to declare what it
may mutate or what evidence satisfies it.

The Vision requires agent-led planning to lower into the same governed
Assignment path with equivalent objective, constraint, output, mutation,
evidence, capability, budget, and provenance semantics.

## Decision

1. **Two provenance classes, one Assignment.** Every Assignment carries
   `provenance.kind = declared | inline`, plus `contractPolicyVersion`,
   `normalizerVersion`, and the validator chain that produced it.
   - `declared`: existing domain/workflow/stage/operation/TaskSpec legality
     validation, unchanged (ADR-002 preserved).
   - `inline`: an agent-proposed contract validated by the foundation validator
     and any selected domain harness (ADR-007), plus caller provenance
     (writer identity, optional parent Assignment reference).
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   are stamped from the existing operation/role mapping; inline contracts must
   declare them explicitly. A missing value is a build failure, never a default.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Operation-specific behavior is declared on the operation
   table or inline contract as `resultKind` (for example `gate-verdict`,
   `advisory`, `work-product`) and an optional `onAdvance` action, replacing
   `if (operation === ...)` branches.
4. **Minimum inline contract.** objective; bounded context references;
   constraints/authority; expected outputs; `mutation`; `evidence.required`;
   role and capability hints; budget (`timeoutMs`, `maxRuns`; token counts are
   telemetry only); caller provenance. Unknown fields are rejected.
5. **Same stores and governance.** Both classes use `.fgos/assignments/`,
   `executeAssignment()`, `compileDispatchPlan`, and the same Run/RunResult
   normalization. Neither class may bypass dispatch governance.
6. **First slice is read-only.** Until session-local isolation and
   serialization are proven, an inline contract with `mutation: mutating` is
   rejected fail-closed. The inline schema carries no session or coordination
   reference in this slice.
7. **Retire the standalone read-only heuristic.** Once no declared caller
   passes `workId: null`, the `missionId || workId === null => read-only`
   clauses are removed; read-only status comes only from the stamped
   `mutation` field.

## Consequences

- Standalone coordination no longer fabricates a coding Stage; the Vision's
  two-consumer proof becomes testable.
- Declared operations gain an explicit, inspectable mutation/evidence snapshot
  without parsing TaskSpec Markdown.
- Result interpretation becomes contract-driven and testable per field.
- A mutating inline path, session references, and dynamic task graphs remain
  future decisions and must not be implied by this ADR.

## Rejected Alternatives

- A separate execution-contract entity in front of Assignment: no distinct
  authority beyond what the stamped Assignment already carries.
- Compiling TaskSpec Markdown into a universal contract object: opens an
  unrelated migration project; the code-level mapping already exists.
- Keeping operation-id switching in interpretation for declared operations
  only: would fork the interpretation path between the two provenance classes.
