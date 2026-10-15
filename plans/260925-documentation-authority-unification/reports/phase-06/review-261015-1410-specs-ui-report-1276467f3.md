# Review: Step 8 pinned batch report accounting

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792047735364-5c1a0eb5@2026-10-15
Review mode: ordinary
Request commit: 3c9b16c2c
Content commit: 1276467f37a99d19aff05808d42fafbf40341449

No sensitivity result is requested or supplied (ordinary review, none fabricated). This is a separate non-source accounting channel: the rows below apply no source verdict, approve no truth, retirement, promotion or cutover. Claim cells are entry IDs (or the real claim IDs where the request names them). Source digest cells are the digests printed in the request, recomputed by me; Target digest is none unless the request prints one. Seed for the hand-recomputed digest sample: 8841 (random.Random(8841).sample over the 44 entries of my five requests picked triage-10, triage-03, triage-14, a39-generated-route and generation-4; each recomputed independently with jq -c piped to sha256sum, all equal; the report entry also recomputed). The review worktree was read only at 2107c4761 (docs bytes equal the content commit).

## Scope and method

One entry (step-08-report.md at the pin and the native follow-up evidence). I confirmed pinnedReportText equals the report at 1276467f3 and that the file at 3c9b16c2c and HEAD ends with it; the whole-entry sha256 (compact JSON, 9.3 MB) equals the printed digest, recomputed with python and independently with jq and sha256sum. I recomputed from the committed files: the working registry size 61594143 and SHA256 0ce06b5c..., known IDs (units plus retiredUnits plus identityGaps) 97757 before (registry at the content commit) and 98430 after with zero ID missing, the carry-forward arithmetic (89733 + 366 + 673 = 90772), the six D/E outputs (D 0 structural fatal, E 0 structural fatal with exactly claims-not-reviewed 566, identical group 1, registry gaps without disposition 1, candidate blocks 117), the sync duration 547.279 s from its timestamps, the 109 preserved decision file hashes at HEAD, the candidate list count 117, the 44 of 44 passing tests in the log, the 34 source packs (566 rows, each pack byte count and sha256 equal the index, 31 mandatory deep rows) and the 15 non-source request entry counts, the class counts 275 Unit-exact, 260 Weak-exact and 31 Judgment (22 unequal pairs plus 9 no-target) from the shards, and that nothing but report, pack, request and registry files changed between the content and request commits. Limits: the scratch registry the report calls byte-equal is gone so only the persisted bytes were checked; the five-field candidate tuple SHA256 belongs to the reverse-list request; I did not rerun the native sync or E.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| batch-report | ok | deep: every count, hash and result I could recompute matches the report, including the honest statements that strict E stays open on one dashboard gap, that the three-gap fast estimate dropped to one after two existing reviewed records applied, and that nothing is closed, promoted or retired; the E runs print fatalCount 4 (the four open types) beside structuralFatalCount 0, which the report's 0 structural fatal wording covers but a reader could mistake | 6ff597c1aa5cc1c121ed1af356cb5388b6fcb81ae2dda1367e6d689a9b8671f6 | none |

## Notes

The report is accurate as a pinned historical statement; it does not and cannot approve later edits. The one point worth a clarifying sentence next time is the fatalCount versus structural fatal distinction.

Unresolved: none for this entry.
