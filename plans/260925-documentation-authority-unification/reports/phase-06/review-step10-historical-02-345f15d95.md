# Review step 10 re-review historical-02

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792089181794-89ae42db@2026-10-16
Review mode: ordinary
Request commit: c939e9a51
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request reviewed: review-request-step10-historical-02-345f15d95.md (7 historical-row entries, all deep). Read-only worktree at c939e9a51; ordinary review, no sensitivity pack. Every row was checked for: row in ledger/retired-unit-decisions.json equals the pack row byte for byte; native record equals working-identity-registry.json; exactly one decision row per claim across all shards; source digest recomputed with extractMarkdownConservationUnits at the witness commit and again with plain sha256 of the block text (the heading row by hand from the heading formula); anchor check with list-doc-anchors; approval fields compared with the verdict table of the report they cite. A36: all rows are deep rows, so the 15 percent draw is covered by reading them all; hand-recompute seed u4-s10v8-345f15d95, random.Random(seed).sample(sorted ids, 3) = claim_500d588a939fd6109cf102b8343484bb, claim_806342ec2a1c5fd1d0b6d82ebd54d4e0, claim_30f4d7e2306cb4ecdad78086848d139f (all three plus the heading row and the other unheaded rows matched). Rework share 0 of 7.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_b12ca1fdc3534fa31f9d7459c1be9ef7 | ok | deep: heading Dispatch routing work to a executor at 120af6b3d L99; digest recomputed by the extractor and by hand from the heading formula (level, title, section payload, following block); row equals the pack, native record equals the registry (registry says supersede, row says reclassify, as accepted last round); anchor is missing at HEAD and the rationale makes no live-anchor claim; approval fields equal my ok row at 4a18f35ff; rationale still ends with pending independent review although the row is now reviewed, stale wording only | 6f82f0a34b9d52aeb929fa62c63a49e558f0cf94e6552b59bca278097f14ea6d | none |
| claim_21f66ad1c973daaf6c31abf50b6c8cc3 | ok | deep: no historical witness text and the row says so (limitation recorded); digest 43d98a2d equals the registry unit, so it is verified as recorded, not recomputed; row equals the pack and native equals registry; anchor missing at HEAD, no live-anchor claim; approval fields equal my ok row; same stale pending wording at the end of the rationale | 43d98a2d84170eee45f9c337cd6700c7af2e32965c415e3fb26cf3c3ebe14bd7 | none |
| claim_806342ec2a1c5fd1d0b6d82ebd54d4e0 | ok | deep: sampled; unheaded block at 120af6b3d L101, digest recomputed by extractor and plain sha256 of the block text; row equals pack, native equals registry (registry delete-as-obsolete, row reclassify, accepted last round); unheaded-block-18 at HEAD is a different unit and the rationale claims no live anchor; approval fields equal my ok row; same stale pending wording | 818ed72de3118b43bbb9682e5b2231a74894d6001771d6375d08fcb626cd99b1 | none |
| claim_7a4fef4aa802940385df7cd8fc1bf6f0 | ok | deep: unheaded block at 120af6b3d L114-116 (the three mechanism bullets), digest recomputed by extractor and plain sha256; row equals pack, native equals registry; unheaded-block-23 at HEAD is another unit, no live-anchor claim; approval fields equal my ok row; same stale pending wording | 367c95ab6574855f85ab31608ca9438bddb2bef0839cfc45ff4bf2640c6ea2f4 | none |
| claim_7b209ce1498d7ab5ddafe25d203e5852 | ok | deep: unheaded block at 120af6b3d L118, digest recomputed by extractor and plain sha256; row equals pack, native equals registry; unheaded-block-24 at HEAD is another unit, no live-anchor claim; approval fields equal my ok row; same stale pending wording | bd95c2c1daeda69523d203dcefc33f2d50d81a401087e921c058a7d004f5a02a | none |
| claim_30f4d7e2306cb4ecdad78086848d139f | ok | deep: sampled; unheaded block at 5df843bdb L129-130, digest recomputed by extractor and plain sha256; row equals pack, native equals registry; unheaded-block-26 at HEAD is another unit, no live-anchor claim; approval fields equal my ok row; same stale pending wording | 52b2e04e2be1548ef98b8c68b27ee09c3cef2b516ce1cdd6925362d81dd2a306 | none |
| claim_dea64a2d50bdbadf3b2ebeceec84fa5d | ok | deep: unheaded block at f4a81c7ea L159 (the index-counts line), digest recomputed by extractor and plain sha256; row equals pack, native equals registry; shares its digest with the CLAUDE.md gap claim so one text has one disposition; unheaded-block-34 at HEAD is another unit, no live-anchor claim; approval fields equal my ok row; same stale pending wording | ba8b02c21fe45af0ba20b280ef182065e87c3410dae024d6ede3983845990c9c | none |

## Notes

1. The seven reclassify rationales still end with the sentence that the row is pending independent review and carries no approval, yet the rows are now reviewed; the approval was applied without touching the text. Not a conservation defect (identity accounting only), but a later reader sees a stale statement. Suggest dropping that sentence in the global turn.
2. Registry dispositions (supersede, delete-as-obsolete, retain-as-evidence) and the reclassify rows coexist as accepted last round; unchanged.

Unresolved: none for these rows.
