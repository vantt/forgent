# Review: runner source packs 01

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request: review-request-261015-1706-runner-source-01-81d0ed074.md (shard s9-runner-01.json, SHA256 de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b; sidecar SHA256 in the request header equals the file). 2 rows, all Weak-exact or Judgment, no Unit-exact, no map amendments, no rebound anchors on these rows. Ordinary review; the request carries no sensitivity pack, so none was run or fabricated. Carriage review only: truth of carried text is not judged (A19; corrections run separately). Red-team-9 findings were read and not re-raised; R9-5 (boilerplate retirement sentence in non-decision carriers) and R9-6 (no navigation in spec.md) touch these target files but are being fixed separately.

Mechanical checks for every row: source unit digest recomputed from docs/specs/runner.md at 81d0ed074 and target digest recomputed from the committed target file at the review HEAD (docs bytes equal the content commit; git diff of docs and the shard between 81d0ed074 and HEAD is empty) with extractMarkdownConservationUnits; sidecar and shard decision objects equal one to one (495 shard claims, review status pending); pack markdown digests equal the sidecar; list-doc-anchors --check passed for every target anchor; each source anchor and line range matches the extractor; target owner and anchor equal the frozen map row (dispatch-runtime-inspection, guard-reconciliation to architecture/h-e53a3a9829a8.md; entry-points-triggers to subcomponents/h-ce5b9771a26a/spec.md; preamble and H1 to spec.md by the file default); no duplicate source or target owner for these 12 rows; nativeTargetClaimId values exist in step9-native-verification.json.

Sampling (A36): seed 90417 (python random.Random, sample of 3 of the 12 claim-id prefixes for the extra hand digest check: 3803, a48d, 383a). Because the pack is only 12 rows, all 12 were read in full both directions (source lines versus target lines compared byte for byte for every unit; the files' other text inspected for unlabelled additions) and every row is marked deep. Hand recompute with sha256 of trimmed text outside the extractor: blocks 1, 2, 3 and the target block 5 matched, plus the H1 heading composite shows the source payload empty (sha e3b0c442) versus the target payload non-empty, which explains the one unequal digest pair. Deep rework rate 0 of 12, below the 3 percent threshold, so no full-pack escalation was needed.

Both directions: source lines 1-7 and 9 reach spec.md, lines 11-54 reach architecture/h-e53a3a9829a8.md, lines 56-69 reach subcomponents/h-ce5b9771a26a/spec.md; the only target text not from the source is the H1 title, the fenced metadata block and the quoted Added in candidate paragraph in each of the three files, all labelled. No RUL ids or decision headings occur in these units.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_a5f8435c8d549e5b41a34cf3e1f3e351 | ok | deep: lines 1-7 front matter byte-identical to spec.md lines 1-7 (diff empty), hand sha256 of trimmed block equals both digests, anchor unheaded-block-1 exists, owner spec.md matches the file-default map row (preamble only); rationale (whole preamble, lines 1-7, digest equal) is true. | 6995106e543166fec7e46573ed70ab54a171c1d87f545ef19ade28df2cd97866 | 6995106e543166fec7e46573ed70ab54a171c1d87f545ef19ade28df2cd97866 |
| claim_d8ac30166d62dd668cf76d7dfb0a8170 | ok | deep: unequal pair; H1 text byte-identical, heading digest differs only because source payload is empty (sha e3b0c442) while target now has the fenced metadata block and the Added in candidate quote, both labelled; owner spec.md follows the file default since the map has no H1 row; rationale truthful. Boilerplate phrase about a Lead additive amendment is generic (mapAmendments is empty for this row) but not false. | a86d867279b4935bdfdfe419a3121f088ead4fe51ea0a62fbfec1da3949cb54c | 8e268a88fd1470f40fe63c54b8f819ebdf8fcc3c539d6ad3165f39bd064ac705 |

## Notes

- Observation, not rework: every rationale in this shard repeats a generic sentence ("Decision/history placement is not a retirement judgment", "P2 frozen map with explicit Lead additive amendment") even on rows with no amendment or decision placement. It is not false for the map as a whole and is the same boilerplate red-team R9-5 already covers.
- spec.md carries only the H1, metadata and label (red-team R9-6); the introduction paragraph lives in the architecture carrier as the map dictates.

Unresolved: none for these rows.
