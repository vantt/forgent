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

1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3057. Do not present the dormant stamp path as a current general session-runtime door.

7. **Retire the standalone read-only heuristic.** Once no declared caller
   passes `workId: null`, the `missionId || workId === null => read-only`
   clauses are removed; read-only status comes only from the stamped
   `mutation` field.

## Consequences

- Standalone Unit execution does not fabricate a coding Work stage.
- A registered domain harness is not proof that every proposed domain ships.
- Declared operations gain an explicit, inspectable mutation/evidence snapshot
  without parsing TaskSpec Markdown.
- Result interpretation becomes contract-driven and testable per field.
- Session references and dynamic session task graphs are historical/deferred
  vocabulary; Unit-run mutation is current and must not be called universally
  deferred just because the generic inline stamp gate remains.

## Rejected Alternatives

- A separate execution-contract entity in front of Assignment: no distinct
  authority beyond what the stamped Assignment already carries.
- Compiling TaskSpec Markdown into a universal contract object: opens an
  unrelated migration project; the code-level mapping already exists.
- Keeping operation-id switching in interpretation for declared operations
  only: would fork the interpretation path between the two provenance classes.
