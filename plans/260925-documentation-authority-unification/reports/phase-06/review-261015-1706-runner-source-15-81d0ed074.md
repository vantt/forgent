# Review of runner source pack 15 (s9e)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request `review-request-261015-1706-runner-source-15-81d0ed074.md` (sidecar sha256 7846ced45f69bbff903859a2ba72fb304e87bde1c86364d0b71b49989ce651ef, shard s9-runner-01.json sha256 de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b, both re-hashed and equal). Target `docs/platform/runner/architecture/h-7af1f0242611.md` read at the review worktree HEAD; source read from `git show 81d0ed074:docs/specs/runner.md` (blob ddfa78cc, equal to HEAD blob). No sensitivity pack was requested; none produced.

Population: 5 Weak-exact rows, 0 Unit-exact, 0 Judgment, 0 unequal-digest pairs, 0 map amendments or rebound anchors in this pack. A36 floor for the whole s9e group (9 rows, fewer than 10) means all rows are deep-read; seed `s9e-261015` was recorded but the draw is moot, every row is sampled.

Mechanical checks done for every row: unit digests recomputed with extractMarkdownConservationUnits on both files (equal to pack digests); headings recomputed by hand from level, title, section payload and following-block digests, blocks by raw sha256 of the source line range; source line range diffed against target line range (identical); anchor check via list-doc-anchors (ok); pack decision equals the shard claim object exactly; map rows in area-map-runner.md name this owner and anchor. Both directions: the target file contains only the carried units plus the labelled Added in candidate H1, metadata block and scaffolding paragraph. RUL ids and decision headings are unchanged because the text is byte-identical. Carriage review only; no truth judgment (A19).

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_49a878f920dd60fd0449e74d71b5fc1b | ok | deep: heading Tu vung dispatch hien hanh source 1265 equals target 25 in architecture h-7af1f0242611; digest hand-recomputed; map row owner and anchor match; one owner only (grep shows no second carrier). | f43d4e34b06779c58f17e45c31f66be1d2a0daa7d90d6fbbe78f88131ea5d609 | f43d4e34b06779c58f17e45c31f66be1d2a0daa7d90d6fbbe78f88131ea5d609 |
| claim_df3b43cb418418ef385dc9adb09adec2 | ok | deep: paragraph (622 bytes, ADR 0026/0028/0029/0031/0034) source 1267 equals target 27; raw sha256 equals pack digest; claimKind decision is a fair label for the ADR-lineage sentence and does not alter carriage. | 289d09c0638b751d56c01bb15ddd9e052c0cf73c0938e093b1efdfca3f986bba | 289d09c0638b751d56c01bb15ddd9e052c0cf73c0938e093b1efdfca3f986bba |
| claim_532692d4c5ebdea48d2a8352129cc843 | ok | deep: level-3 heading Bang doi chieu tu vung dispatch source 1269 equals target 29; level kept at 3; digest hand-recomputed including following-block digest; map row names this owner and anchor. | 4d4c05e94bd4baf1756a0e253ce3a29ec9b73beaa546931acf49ac259e774f44 | 4d4c05e94bd4baf1756a0e253ce3a29ec9b73beaa546931acf49ac259e774f44 |
| claim_e212e87da06a0a552cc1ccde10b5aaab | ok | deep: 14-row dispatch vocabulary table (source 1271-1285, 2657 bytes) diffed against target 31-45 with no difference; RUL72 heading text verbatim in all three rows; raw sha256 equals pack digest. | ea328f8878d7b1816a6b23abc0b80e08352165da8a97ee753c80b855322d41d0 | ea328f8878d7b1816a6b23abc0b80e08352165da8a97ee753c80b855322d41d0 |
| claim_17f27ab085e951c529afff07f099e25b | ok | deep: Ghi chu bullet block (source 1287-1295, 2208 bytes) diffed against target 47-55 with no difference; raw sha256 equals pack digest; line 54 holds a relative link that does not resolve from the target folder, but carriage is verbatim and that link is already red-team finding R9-1 handled separately. | 75d27c27bf35d669cd2e4899d9ed3966cc2e628a6c37bfdd78483e02c35c28bc | 75d27c27bf35d669cd2e4899d9ed3966cc2e628a6c37bfdd78483e02c35c28bc |

## Notes

- Deep-read 100 percent of rows, 0 rework, so the 3 percent escalation does not apply.
- The frozen map carries source blob 473a0096 while the content commit source blob is ddfa78cc; the four heading rows used here resolve at the content commit and the map row text is unchanged, so this is not a defect of these rows.
- Worktree status: an untracked `verify-out.json` appeared in the worktree root during the review; I did not create it (another concurrent reviewer likely did).

Unresolved: none for these rows.
