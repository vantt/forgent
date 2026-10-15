# Review of runner source pack 17 (s9f)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request `review-request-261015-1706-runner-source-17-81d0ed074.md` (+ sidecar SHA256 `79a83175068ef057429b307c8cac651fc51bf7f8a58c301e5c55ee2d362a9cec`, shard `ledger/decisions/s9-runner-01.json` SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`; both recomputed and equal to the pack header). 5 rows, all Weak-exact, no Unit-exact, no Judgment, no unequal-digest pair, no map addition and no rebound anchor in this pack (per the request JSON). No sensitivity pack was requested; none produced. Source lines 1362-1414 of `docs/specs/runner.md` (blob ddfa78cc, identical at content commit and review HEAD) go to `docs/platform/runner/decisions/h-aabefc85f0c9.md`. Worktree `/home/vantt/projects/forgentX-s8-review`, read only.

Mechanical checks on every row (scripts in work-s9f/, using the repo `extractMarkdownConservationUnits`): source unit found by anchor and stated lines; source and target full unit digests recomputed and equal to the stated full 64-hex digests and to each other; section payload equal; the row equals the shard claim (digests, owner, anchor, rationale); `list-doc-anchors --check` passes for every target anchor (41 across the three packs, 0 failures); owner equals the frozen map row (`area-map-runner.md` lines 47 to 49); rationale line numbers, source anchor and target anchor equal the row. Reverse direction: every unit of the target file is either a row of this pack or the `Added in candidate` title, header fence or scaffolding paragraph. Whole-unit conservation: lines of the target from the carried heading to end of file are byte-equal to source lines 1362-1414, so heading level and text, RUL ids (none in this section) and decision ids (none) are verbatim, and the source section ends exactly at the next source heading. Sample (A36): 5 of 5 (all; fewer than the 10 minimum); all 5 deep. No draw needed: every row was read in full, both directions. Hand recomputation of unit digests from raw source lines with an independent sha256 (seed 7731 over all 41 rows of s9f, 6 rows = 14.6 percent, recorded across the three reports): `claim_f6c6b09386500ad22dbd1626b3ed4e6d`, `claim_d7fd3778a5cbb74cad9fb5e476708647`, `claim_d29be3d33893c060220d82b135fcb7c0`, `claim_64b0cdea180e4a5760597816f59d901b`, `claim_7199fa94f36517e6e6624b9d1101c363`, `claim_e1d796c4b41dd038701bdca812ad80e1` all matched (the ones in this pack are marked in the notes). Deep rework count: 0 of the deep-read rows, so no full-pack escalation. Carriage only; truth of the carried sentences was not judged (A19; A41 runs separately).

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_39d792588a8be9f5c525406f7692f77c | ok | deep: heading source lines 1362-1362 read against target coordinationsession-lịch-sử-đã-thu-hồi-p lines 25-25; byte-equal to source, owner decisions/h-aabefc85f0c9.md equals map, digests equal, anchor resolves; Vietnamese/English text carried verbatim, no added text inside the unit. | e3b9637386370205add50577674190f948eb94fefd4b56a1ffa35cff7f701478 | e3b9637386370205add50577674190f948eb94fefd4b56a1ffa35cff7f701478 |
| claim_edb87e31d0f69ae2f7df349f4cb9ee45 | ok | deep: unheaded block source lines 1364-1364 read against target unheaded-block-3 lines 27-27; byte-equal to source, owner decisions/h-aabefc85f0c9.md equals map, digests equal, anchor resolves; Vietnamese/English text carried verbatim, no added text inside the unit. | 3e87ab95090ec039048f7985c02181ec1b1b5c6337fcd23410d76a3c76473d1c | 3e87ab95090ec039048f7985c02181ec1b1b5c6337fcd23410d76a3c76473d1c |
| claim_ba3f27a8e3fd4763efcfdbd1858b5789 | ok | deep: unheaded block source lines 1366-1385 read against target unheaded-block-4 lines 29-48; byte-equal to source, owner decisions/h-aabefc85f0c9.md equals map, digests equal, anchor resolves; Vietnamese/English text carried verbatim, no added text inside the unit. | fd8ce1aa63a5c152cadc1044080acf480f824b655a1b835583c6d875192e5700 | fd8ce1aa63a5c152cadc1044080acf480f824b655a1b835583c6d875192e5700 |
| claim_49b0591431ed2d1e033a6b960a760e1f | ok | deep: unheaded block source lines 1387-1396 read against target unheaded-block-5 lines 50-59; byte-equal to source, owner decisions/h-aabefc85f0c9.md equals map, digests equal, anchor resolves; Vietnamese/English text carried verbatim, no added text inside the unit. | c24373f085777c3f0f463c6073f22f2a495fefcc4ace8c4825dc1607beafee2a | c24373f085777c3f0f463c6073f22f2a495fefcc4ace8c4825dc1607beafee2a |
| claim_f572736a09f2e9266fa2f6b26ffb72ea | ok | deep: unheaded block source lines 1398-1414 read against target unheaded-block-6 lines 61-77; byte-equal to source, owner decisions/h-aabefc85f0c9.md equals map, digests equal, anchor resolves; Vietnamese/English text carried verbatim, no added text inside the unit. | 4ed88ac3a8b8a5561c875bb1d64928264a79047338e413aade84047c7fe6da6a | 4ed88ac3a8b8a5561c875bb1d64928264a79047338e413aade84047c7fe6da6a |

## Notes

- Every row's rationale uses the same template. Its phrase "P2 frozen map with explicit Lead additive amendment" is true of the map file as a whole but none of the rows here is an amended or rebound row (the amendments cover only the 0047 to 0063 decision headings); not a defect in the carried text, left as a non-blocking observation.
- The `claimKind` of the block rows is the per-unit inference (mostly `specification`) while the map's constitution kind for the owner is decision; the owner and anchor are the map's, so I did not treat this as a defect.
- Carried relative links and paths are unchanged from the source (the already-reported unresolved-link finding is not re-raised).

Unresolved: none for this pack.
