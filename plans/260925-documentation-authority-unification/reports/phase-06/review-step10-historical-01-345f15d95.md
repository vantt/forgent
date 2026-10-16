# Review step 10 re-review historical-01

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:27@2026-10-14
Review mode: ordinary
Request commit: c939e9a51
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request reviewed: review-request-step10-historical-01-345f15d95.md (1 historical-row entries, all deep). Read-only worktree at c939e9a51; ordinary review, no sensitivity pack. Every row was checked for: row in ledger/retired-unit-decisions.json equals the pack row byte for byte; native record equals working-identity-registry.json; exactly one decision row per claim across all shards; source digest recomputed with extractMarkdownConservationUnits at the witness commit and again with plain sha256 of the block text (the heading row by hand from the heading formula); anchor check with list-doc-anchors; approval fields compared with the verdict table of the report they cite. A36: all rows are deep rows, so the 15 percent draw is covered by reading them all; hand-recompute seed u4-s10v8-345f15d95, random.Random(seed).sample(sorted ids, 3) = claim_500d588a939fd6109cf102b8343484bb, claim_806342ec2a1c5fd1d0b6d82ebd54d4e0, claim_30f4d7e2306cb4ecdad78086848d139f (all three plus the heading row and the other unheaded rows matched). Rework share 0 of 1.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_500d588a939fd6109cf102b8343484bb | ok | deep: the pending reclassify duplicate is gone (L10-22) and the single row is the retain-as-evidence row reviewed on 2026-10-15; row equals the pack and the working registry record byte for byte, one disposition per claim in all shards; unit digest recomputed (extractor and plain sha256 of the three bullets at fba5d0426 L168-170, and the same unit is unheaded-block-28 at c18020da3 L165-167, absent at 6c6a65e85 and HEAD) so the rationale's git evidence at c18020da3 is true; at HEAD the unavailable and in-process bullets are verbatim and only the out-of-process bullet is rewritten to fgos run, which the note says; approval pin 68b95dbd8 holds the matching ok row with the same digest; the report header there names author session 28 while the row says 27, a provenance nit only | 45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e | none |

## Notes

1. The seven reclassify rationales still end with the sentence that the row is pending independent review and carries no approval, yet the rows are now reviewed; the approval was applied without touching the text. Not a conservation defect (identity accounting only), but a later reader sees a stale statement. Suggest dropping that sentence in the global turn.
2. Registry dispositions (supersede, delete-as-obsolete, retain-as-evidence) and the reclassify rows coexist as accepted last round; unchanged.

Unresolved: none for these rows.
