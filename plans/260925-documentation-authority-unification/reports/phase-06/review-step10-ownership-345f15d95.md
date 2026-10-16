# Review step 10 re-review ownership part 1 (L10-22 duplicate removal)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792093168554-f28af963@2026-10-16
Review mode: ordinary
Request commit: c939e9a51560a124e3723ba69ce39a202a1b7efc
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request reviewed: review-request-step10-ownership-01-345f15d95.md (2 L10-22-duplicate-removal entries; md blocks equal the json sidecar). Read-only worktree at c939e9a51; no sensitivity pack requested or made. Each entry removed a pending reclassify-out-of-platform-scope row so that the earlier reviewed native disposition is the only one. For each claim I counted rows with that claimId across ledger/ at 4a18f35ff and 345f15d95 (grep and a JSON load of retired-unit-decisions.json and main-sync-successors.json), loaded the surviving row and compared it with the pack's preservedNativeDisposition, recomputed the old and successor unit digests with extractMarkdownConservationUnits at the named commits (d98a5c5e7 retire commit chain, f33612119, c18020da3 all present), checked the successor anchor with list-doc-anchors --check, and read the reviewer reports that carry the original approvals. Both are item-specific entries with 2 rows; both rows are deep.

Result: 2 ok, 0 rework, 0 hold. Seed: not applicable (2 of 2 read in full).

## Item table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_c3ef3a4ddc116883db10a70d55ba7bd5 | ok | deep: L10-22 removal of the duplicate pending reclassify row is correct: at 4a18f35ff retired-unit-decisions.json held two rows for this claim (reviewed supersede from 4df9e88c and a pending reclassify), at HEAD exactly one remains (supersede, reviewed 2026-10-09, report review-2final-retired-unit.md present); the old unit 4485eb54 at f33612119^ and the successor 52ff86d6 at f33612119 recompute to the recorded digests with the extractor and the successor heading anchor passes list-doc-anchors --check at HEAD; main-sync-successors.json carries the identical row; no decision shard holds the claim. | 4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940 | 52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2 |
| claim_500d588a939fd6109cf102b8343484bb | ok | deep: L10-22: at 4a18f35ff the file held a single pending reclassify row for this claim, at HEAD it holds the earlier reviewed retain-as-evidence row (reviewer a4954387, 2026-10-15, report review-261015-0044-boundary-sync-resume-02.md line 68 is the same ok row); unit AGENTS.md#unheaded-block-28 at c18020da3 (lines 165-167) recomputes to 45945b0c and fingerprint 875b03c3 as recorded; targetOwner and targetAnchor are null as retain-as-evidence requires; only one disposition per claim now exists anywhere in ledger/. | 45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e | none |

## Notes

- The pack text says the removed pending rows were authored by the Step 10 session; at 4a18f35ff they were the only rows differing from the reviewed ones, confirming the removal restores the earlier state and loses no row.
- retired-unit-decisions.json still has two other claimIds with duplicate rows (claim_3b657b7a and claim_95855b8d); they are outside this request and not judged here.

Unresolved: none.
