# Review a38 - Step 4 wave 2 part 31 (set step04-021)

Pin dc24ce645. packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs (861 lines): sourceContext equals the pinned blob; read the header and import region and searched the whole file for docs, spec, .md, decisions, plans, archive, render and AGENTS paths. Line 3 is the only path occurrence.

## File verdict

| File | Slots | Verdict |
| --- | ---: | --- |
| packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs | 1 | ok |

Slot class6-l-000204, L3 `docs/decisions/` in "Fills the `bound-invocation-supervisor` role (docs/decisions/):", disposition preserve, empty diff, stepFiveExcluded empty (correct, it is a doc comment, not a runtime string). `docs/decisions/` exists at the pin and holds only the generated index.md, whose rows 43-44 list the D-ADR0043 vocabulary decision that defines this role. L12-26(3) retains and preserves paths that exist outside docs/specs and docs/architect, and L12-60 ruling 5 preserves the generated index. A bare-directory comment pointer is not a writer, unlike AGENTS.md L70, so preserve is defensible. No behavior change: no diff.

## OUTCOME defects

None.

## Record-text notes (not rework)

- The reason's generic "native path, literal example or captured contract reference" label fits loosely; the passage is a reader-style pointer to the decision corpus.

## Lead-judgment questions

- The narrative for this role lives in docs/specs/runner.md section 0043 (the retiring spec tree, now also at docs/platform/runner/decisions/h-36d872fbb0e5.md), not in docs/decisions/, which has only the index. Preserve rests on the index row. If the Lead wants the comment to point at the narrative holder, this would become a Phase 9 patch or a park with a successor note. Sibling comments (src/state/store.mjs, src/runner/merge.mjs) preserve the same way, so preserve is consistent.

## Counts

step04-021: 1 file reviewed, 0 outcome rework, 1 slot reviewed.

Status: DONE
