# Review of whole-system request 05 (component-boundary-advisory slice)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:37@2026-10-15
Review mode: ordinary
Request commit: ffb7b73c8
Content commit: a8a10abc1a24218518a14764f68c8d86f4810f91

## Scope and method

Request `review-request-261015-0450-whole-system-05.md` and its sidecar, shard `s6-whole-system-component-component-boundary-advisory.json`, 6 rows (5 Weak-exact, 1 Judgment) for source lines 1006 to 1051 of `docs/architect/component-boundary/component-boundary-advisory.md`, moved into the labelled "Added in candidate: component-boundary-advisory source carriage" section of `docs/platform/component-boundary.md` (the frozen-map owner). Ordinary review at worktree HEAD ffb7b73c8; the Step 6 checkpoint sensitivity pack is separate and no sensitivity result is produced here.

Mechanical checks on all 6 rows: full digest recompute for source and target, equal to row and decision; shard claims equal sidecar decisions (6 of 6); anchors pass `list-doc-anchors.mjs --check`; rationale line ranges and anchors match; each target anchor is claimed once across all shards; target digests unique within the target file. Because the population is 6 (fewer than the 10 minimum) all 6 rows were deep-read. A line diff of source lines 1000 to 1052 (at the map pin fd6c9ab9e) against target lines 1097 to 1149 shows only the two heading levels shifted from 2 to 4 and one trailing blank line; every body line is identical. Differing-digest row: claim_27d3a09ef0b56afd3492c7213235e8ca (level shift). Absent-target rows: none. Sampling: all 6 of 6 Weak-exact plus Judgment rows, so no random draw was needed; hand recompute drew claim_057cf501335065a4f54a49eeb0eb0d59 with random.Random(261016) and its digests matched from raw file lines.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_4eca744c23d1052489bfce3c6d545ab5 | ok | deep: unheaded-block unheaded-block-140 src L1006-1007 tgt L1103-1104; Weak-exact; text identical to source, ancestry differs only by the labelled Added-in-candidate carriage heading as the rationale says; anchor exists | cb8a65913d31cbbba3ca80990c295a191d337f7ed9323f84b3eb40725f67f9be | cb8a65913d31cbbba3ca80990c295a191d337f7ed9323f84b3eb40725f67f9be |
| claim_7eb9780265a604bc3285eefd6046a236 | ok | deep: unheaded-block unheaded-block-141 src L1009-1029 tgt L1106-1126; Weak-exact; text identical to source, ancestry differs only by the labelled Added-in-candidate carriage heading as the rationale says; anchor exists | 472f88c8598588587368902ac9d3e029db6b242855fb7c195b332168280acf47 | 472f88c8598588587368902ac9d3e029db6b242855fb7c195b332168280acf47 |
| claim_27d3a09ef0b56afd3492c7213235e8ca | ok | deep: heading 21-suggested-next-discussion-artifact src L1031-1031 tgt L1128-1128; heading carried at level 4 instead of 2 (uniform +2 shift under the labelled advisory carriage section), title and section payload verbatim; digest differs only by the level; anchor exists | 9379011241408aa9c0707db68d1045cebc7039c465669be302f39370c1847402 | 52d7d5d860e2ecb33e7b15f4b2dc90d9c490d57bc3f0802807d2fae0dba22e4b |
| claim_057cf501335065a4f54a49eeb0eb0d59 | ok | deep: unheaded-block unheaded-block-142 src L1033-1035 tgt L1130-1132; Weak-exact; text identical to source, ancestry differs only by the labelled Added-in-candidate carriage heading as the rationale says; anchor exists; digest also recomputed by hand | 43ab4628e076c75678fca1154aca0c8bafd0f4da49c74ef742f0860a99b072b3 | 43ab4628e076c75678fca1154aca0c8bafd0f4da49c74ef742f0860a99b072b3 |
| claim_5ca2b6ffe0827597b89098f4c32ce644 | ok | deep: unheaded-block unheaded-block-143 src L1037-1046 tgt L1134-1143; Weak-exact; text identical to source, ancestry differs only by the labelled Added-in-candidate carriage heading as the rationale says; anchor exists | 14f6554299fda71e196ef3589ccc01223d9eb29d2565c387461fb1a9f6a7b59e | 14f6554299fda71e196ef3589ccc01223d9eb29d2565c387461fb1a9f6a7b59e |
| claim_2edc9ac16c08e3b8d4693f71bfd5369f | ok | deep: unheaded-block unheaded-block-144 src L1048-1051 tgt L1145-1148; Weak-exact; text identical to source, ancestry differs only by the labelled Added-in-candidate carriage heading as the rationale says; anchor exists | bc33b17dfd01c19eb8fb523aff986bf0738d4aeba3484fac4522f1fd77809368 | bc33b17dfd01c19eb8fb523aff986bf0738d4aeba3484fac4522f1fd77809368 |

## Notes

- The source file changed after the map pin (blob 5a93ed7f6 to e0e3b69ae, one line near line 650 adding "since removed with dispatch log, decision 0062"). The target at HEAD already carries the new wording (component-boundary.md line 747). It lies outside these six rows (lines 1006 to 1051) so it does not affect them, but the reviewer of the earlier rows of that file should check that row digests were bound to the current source, not the pinned blob.
- Rationales for the five Weak-exact rows are true: the text is identical and only the ancestor chain differs, by the labelled carriage headings.

Unresolved: none.
