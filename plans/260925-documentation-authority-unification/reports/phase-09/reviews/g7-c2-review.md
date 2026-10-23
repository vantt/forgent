# G7 composition review: batch g7-c2

Commit 8a9385eca (worktree forgentX-s8-review). There are 68 specs, all under docs/knowledge/.

## Counts
- APPROVE: 68
- REWORK: 0

## Checks done on each spec
1. The file's sha256 at the review commit equals beforeSha256 (68/68).
2. In a scratch copy, `patch --batch --fuzz=0 -p1` applied the diff and the result's sha equals expectedAfterSha256. The rollbackDiff then restored beforeSha256. This held for 68/68, with no .orig or .rej files.
3. Semantic check:
   - Changed lines differ from the originals only inside the reference spans. All other prose is byte-identical.
   - Every legacy how-to, explanation or reference path maps to the single docs/knowledge file with the same basename.
   - Every added path exists at the commit. All anchors resolve through `scripts/list-doc-anchors.mjs` (`anchorExists`).
   - Decision and spec anchors land on the correct section: 0011, 0020, 0021, 0022 and its candidates #2/#3, 0025, 0026, 0062, RUL25-27, RUL33/34, data dictionary row #4, and claim-lock §3b.
   - Where a bare file reference now points to a section, I checked that the section holds the cited content (for example tsk-2z3, tsk-5l2, STORE_MISSING_WARNING_VERBS, createClaimWorktree/claimWork, planApprove).

## Note (not a REWORK)
19 files still contain legacy references after the patch, for example #32 L16/L84, #8 L18/L30, #43 L102 and #60 L119. Every one I sampled (17) has a step-03 record:
- `preserve` (G6 scope), such as quoted CLI output or historical prose;
- `parked` description-rewrite or GAP-01/02 (G1/G7 park scope).

None of them is introduced by these specs.
