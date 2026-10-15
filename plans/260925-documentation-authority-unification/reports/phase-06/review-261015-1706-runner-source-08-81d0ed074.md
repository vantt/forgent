# Review: runner source pack 08 (group s9c)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Requests (all under plans/260925-documentation-authority-unification/reports/phase-06/): runner-source-07 (12 rows, target operations/h-51f5cd7279fd.md part 3/3, source lines 878-939), runner-source-08 (2 rows, subcomponents/h-6df5686d0d54/spec.md, Actors & Access, lines 941-950) and runner-source-09 (20 rows, subcomponents/h-6979005beaf7/spec.md part 1/2, Business Rules lines 952-1052). 34 rows, all Weak-exact, no Judgment, no unequal-digest pair, no map amendment or rebound anchor in these packs (the 11 added rows and 2 rebound anchors are decision rows, not in this group). No sensitivity pack was requested or fabricated.

Mechanical checks, all 34 rows: (1) shard ledger/decisions/s9-runner-01.json sha256 de26feee... equals the pack header, and each pack sidecar sha256 equals its header; each row decision equals the shard claim (digests, owner, anchor, disposition, rationale, ancestry). (2) Source and target units re-extracted with extractMarkdownConservationUnits from docs/specs/runner.md (blob ddfa78cc, equal at the 63fa6f15 provenance, content commit and review HEAD) and the three target files (docs bytes equal the content commit): unit textDigest, sectionPayloadDigest and identityFingerprint equal the pack and each other. (3) Source line range text equals target line range text byte for byte for every row. (4) 68 anchors (34 source, 34 target) pass list-doc-anchors --check. (5) The target heading row for each owner exists in area-map-runner.md with the exact target path and anchor; block units belong to their heading row. (6) Rationale facts (heading versus unheaded-block kind, line numbers, source and target path#anchor, the short-unit reason only on the two units under 40 characters) are true for all rows. Both directions: the three target files were compared as a whole against the source. operations/h-51f5cd7279fd.md lines 802-863 equal source 878-939 and the file ends there; subcomponents/h-6df5686d0d54/spec.md lines 25-34 equal source 941-950; subcomponents/h-6979005beaf7/spec.md lines 25-195 equal source 952-1122 (the whole Business Rules section, 106 RUL ids in identical order). Everything above each H2 or H3 anchor is the labelled scaffolding (H1 Added in candidate, metadata block, Added in candidate callout), so nothing is lost and nothing unlabelled is added.

Hand recomputation: all 29 block rows had source and target digests recomputed by a separate script as sha256 of the trimmed raw line range, independent of the extractor (29 of 29 equal; far above the 10 percent minimum). The 5 heading digests (heading level, title, section payload, following block) were recomputed by the extractor only.

A36 sample: seed string s9c-261015-1706 with Python random.sample per pack, minimum per pack (10 of 12, 2 of 2, 10 of 20): 22 deep rows, 12 mechanical rows. Sampled ids, pack 07: claim_0cc82088, claim_0d8f8fd8, claim_1bceeeeb, claim_23ed035d, claim_41571c8f, claim_a770eb9e, claim_c3971ec3, claim_d883159f, claim_dab55f62, claim_eb7624af. Pack 08: claim_0686418a, claim_add6d13e. Pack 09: claim_04863c85, claim_081653fc, claim_3318ea2d, claim_3fb365bd, claim_3ff43c5f, claim_476939c1, claim_4b223132, claim_763d1aa7, claim_d7bd9448, claim_ec700b24. Deep rework rate 0 of 22, so no full-pack escalation. Carriage only: truth of the carried text (stale sentences, runner.md line references, cross-references such as xem Open Gaps) is not judged here per A19.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_0686418ae7571d82eade8059c698709d | ok | deep: read heading unit text in both files, source lines 941-941 to target lines 25-25, byte-equal, no extra target text, anchors resolve, owner matches map row, rationale lines/anchors true | 3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7 | 3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7 |
| claim_add6d13e14df87ad5d5bd46cc5bb98d4 | ok | deep: read block unit text in both files, source lines 943-950 to target lines 27-34, byte-equal, no extra target text, anchors resolve, owner matches map row, rationale lines/anchors true, digest hand-recomputed by raw sha256 | 81c2724820c499b40d0e4d2964c798263c2ad99a479582176a95ee13b7f4d24e | 81c2724820c499b40d0e4d2964c798263c2ad99a479582176a95ee13b7f4d24e |

## Notes

- Counts: 2 ok, 0 rework, 0 hold for this pack.
- Not re-raised: the scaffold sentence at line 23 of each carrier (red-team finding R9-5) is being fixed separately; it is the only text in these targets outside the source, and it is labelled Added in candidate.
- Pack 09 is part 1/2; the remaining 15 Business Rules units are in runner-source-10 (not in this group). The target file is whole, so its end (line 195) matches source through line 1122.
- The review worktree git status --short was empty at the end.

Unresolved: none for conservation of these 34 rows.
