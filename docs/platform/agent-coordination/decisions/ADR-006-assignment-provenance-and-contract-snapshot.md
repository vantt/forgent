# ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Context

The original first-slice motivation is preserved in the complete historical input. Current build/execute accepts validated declared, inline and Unit-run provenance through the same governed Assignment path.

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
6. **Historical first-slice restriction.** The former session-isolation prerequisite is preserved in the full historical snapshot. Current normalized mutation/evidence validation is implemented by assignment-normalizer.mjs and assignment.mjs; the old first-slice restriction must not be asserted as the current general inline contract (docs/specs/runner.md:3057).

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
