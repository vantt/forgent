# Review step 10 round 3 historical part 1

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:27@2026-10-14
Review mode: ordinary
Request commit: bca590a4e
Content commit: 287a22d33a0eaf2d9e47549a1142daf62361bb8c

## Scope and method

Request reviewed: review-request-step10-historical-01-287a22d33.md and its sidecar (1 historical-row-change entry, deep). Read-only review worktree at bca590a4e (docs bytes equal the content commit 287a22d33; git diff 345f15d95 bca590a4e over docs shows only the four documents in the documents request, 6 lines). Ordinary review; the request carries no sensitivity pack and none was made (ignored in one line: no sensitivity result is claimed). I never ran the fgos CLI, never read secrets.local.env, and all scripts wrote only to my scratch dir. Checker and tool tests were rerun by me (see below).

Checks: currentDecision, after and the row in ledger/retired-unit-decisions.json at 287a22d33 and bca590a4e are equal; before differs from after only in reviewedAt, reviewNote, reviewReport and reviewReportCommit; the registry record at head equals the row identity fields; the approval report at 5035fed52 holds the ok row with the same note text; the three-bullet source unit digest was recomputed by plain sha256 at two commits.

Seed and sample: 1 row, population of Weak-exact and Judgment rows is 1, read deep. Hand recompute seed s10w1-287a22d33-hand-1 (see the accounting reports for the shared draw); this row was recomputed directly.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_500d588a939fd6109cf102b8343484bb | ok | deep: only the approval metadata moved: reviewedAt 2026-10-15 to 2026-10-16, reviewReport and reviewReportCommit now point at my review-step10-historical-01-345f15d95.md at 5035fed52 (that report exists there with an ok row for this claim, same source digest, none target, and the committed reviewNote equals the report note); disposition retain-as-evidence, target none, rationale and every digest field unchanged and equal to the working registry record; I recomputed the unit digest from the three AGENTS.md bullets at fba5d0426 L168-170 and at c18020da3 L165-167 (both 45945b0c...) and confirmed they are absent at 6c6a65e85 and at the worktree AGENTS.md, so the git evidence named in the rationale is true; one disposition for the claim across all shards; anchor unheaded-block-28 is a retired identity and is not a live-anchor claim. | 45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e | none |

## Notes

1. The approval metadata refresh keeps my earlier ok verdict and the earlier note; it does not change what the row accounts for.
2. Optional: the row rationale says full prior/current diff is shown for review and that approval is not carried, while the row is reviewed; unchanged from the previous round and accepted there.

Unresolved: none.
