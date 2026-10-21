# Review: seam 5 batch 7, payload part s4-src-p05

Scope: 30 file entries. 24 entries carry no items (judgment rejects omitted by R24), 6 carry items. The payload has no diff, no park and no coCutPath. `crossSeamChangedOnly` is False for every entry. Every record is preserve, and every admitted item is a preserve with `treeRetires` false.

All fixtures are synthetic temp-repo or temp-dir paths. In the tests that carry items (commit-unit-work, evidence-attribution, assignment-runresult, stray-write, dispatch-execute-effort, bind-committed-config), no `docs/...` or `plans/...` literal or dynamic tuple reads, writes or compares a real repository document.

## Per file (path, verdict, items reviewed)

| File | Verdict | Items reviewed |
|---|---|---|
| test/runner/assignment-runresult.test.mjs | ok | 5 dynamic (all REJECT) + 6 author-added (3 ADMIT preserve, 3 REJECT) = 11 |
| test/runner/dispatch-execute-effort.test.mjs | ok | 11 dynamic, all REJECT: `.fgos` state, `unit.json`, `bin/fgos.mjs` and a scalar `scope` role |
| test/runner/dispatch-stray-write-attribution.test.mjs | ok | 3 dynamic + 2 author-added (`docs/note.md`) = 5 |
| test/runner/evidence-attribution.test.mjs | ok | 16 dynamic + 23 author-added = 39, all REJECT |
| test/runner/execution/bind-committed-config.test.mjs | ok | 1 dynamic (`${executor} writes=${writes.length}` is a label, not a path) |
| test/runner/execution/commit-unit-work.test.mjs | ok | 49 dynamic + 33 author-added = 82 (2 ADMIT preserve) |
| 24 entries with no items (claim-*, custody-*, dispatch-confinement-*, dispatch-reconcil*, account-pin and others) | ok | 0; nothing in scope, checker-verified |

## OUTCOME defects

None.

## Rule checks

- **Rejects.** Every rejected tuple's `nonDocumentUse` is true. Each construction is a temp dir, a `.fgos` state path, `unit.json`, `bin/fgos.mjs`, a scalar or label join, or a synthetic `docs/x.md` fixture written into a `git init` temp repo that the code under test (`commitUnitWork`, `classifyRunEvidence`, `scopedWriteRun`) treats as an opaque path string.
- **Admits.** The admitted items are `docs/guide/a.md` (assignment-runresult 1701, 1702, 1715), `docs/old.md` (commit-unit-work 79) and `docs/wip.md` (commit-unit-work 223). Each is a document-path-comparison on a synthetic fixture path with `resolverWitness.treeRetires` false and no live holder. The preserve outcome is right. No patch, park or alias write destination applies.
- **No hidden needed change, no retiring target.** No preserve rests on a docs/specs/** or docs/architect/** witness.
- **Parks.** There are none, so the specificity check does not apply.
- **R26 and cross-seam.** No item in this part reads a path Phase 9 proposes to move. No crossSeamChangedOnly item is present.

## Record-text notes (not outcome defects)

1. **Admit/reject split on one literal.**
   - assignment-runresult: `docs/guide/a.md` is ADMITted at 1701, 1702 and 1715 but REJECTed at 1656, the fixture creation of the same literal. The glob `docs/**/*.md` at 1710 is also REJECTed.
   - commit-unit-work: `docs/old.md` is ADMITted at 79 but REJECTed at 80, 84 and 85, in the same test `d`. `docs/wip.md` is ADMITted at 223 but REJECTed at 224, 226 and 228, in the same test `m`.
   - The lines are in different passages and every disposition is preserve, so the outcome is unaffected. The labels are inconsistent, and a Lead may want one uniform label per synthetic fixture literal. Either all REJECT as fixture scalars, or all ADMIT as document-path-comparison.
2. **Boilerplate reason.** Many REJECT reasons repeat the boilerplate "Complete pinned test/helper source: ... remain unchanged". Items such as the dispatch-execute-effort `scope: { role: 'reviewer' }` at 351 carry a reason about fixture paths that does not describe the operand, which is a scalar object. The `nonDocumentUse: scalar-pass-through` is correct.
3. **Label for plans/other/reports.** stray-write 195-196 (`plans/other/reports/code-review.md`) is labelled `plans-report-artifact` under R11. It is a temp-repo fixture, so the REJECT is correct. The label could say "fixture inside temp repo" to be more precise.

## Lead-judgment questions

None.

## Counts

- Items and author-added references reviewed: 138 (53 dynamic + 85 author-added across the 6 non-empty files).
- Outcome defects: 0.
- Record-text notes: 3.
- Files rework: 0 of 30.
