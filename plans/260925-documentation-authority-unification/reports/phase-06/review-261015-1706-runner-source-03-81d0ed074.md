# Review: runner source packs 03

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request: review-request-261015-1706-runner-source-03-81d0ed074.md (shard s9-runner-01.json, SHA256 de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b; sidecar SHA256 in the request header equals the file). 2 rows, all Weak-exact or Judgment, no Unit-exact, no map amendments, no rebound anchors on these rows. Ordinary review; the request carries no sensitivity pack, so none was run or fabricated. Carriage review only: truth of carried text is not judged (A19; corrections run separately). Red-team-9 findings were read and not re-raised; R9-5 (boilerplate retirement sentence in non-decision carriers) and R9-6 (no navigation in spec.md) touch these target files but are being fixed separately.

Mechanical checks for every row: source unit digest recomputed from docs/specs/runner.md at 81d0ed074 and target digest recomputed from the committed target file at the review HEAD (docs bytes equal the content commit; git diff of docs and the shard between 81d0ed074 and HEAD is empty) with extractMarkdownConservationUnits; sidecar and shard decision objects equal one to one (495 shard claims, review status pending); pack markdown digests equal the sidecar; list-doc-anchors --check passed for every target anchor; each source anchor and line range matches the extractor; target owner and anchor equal the frozen map row (dispatch-runtime-inspection, guard-reconciliation to architecture/h-e53a3a9829a8.md; entry-points-triggers to subcomponents/h-ce5b9771a26a/spec.md; preamble and H1 to spec.md by the file default); no duplicate source or target owner for these 12 rows; nativeTargetClaimId values exist in step9-native-verification.json.

Sampling (A36): seed 90417 (python random.Random, sample of 3 of the 12 claim-id prefixes for the extra hand digest check: 3803, a48d, 383a). Because the pack is only 12 rows, all 12 were read in full both directions (source lines versus target lines compared byte for byte for every unit; the files' other text inspected for unlabelled additions) and every row is marked deep. Hand recompute with sha256 of trimmed text outside the extractor: blocks 1, 2, 3 and the target block 5 matched, plus the H1 heading composite shows the source payload empty (sha e3b0c442) versus the target payload non-empty, which explains the one unequal digest pair. Deep rework rate 0 of 12, below the 3 percent threshold, so no full-pack escalation was needed.

Both directions: source lines 1-7 and 9 reach spec.md, lines 11-54 reach architecture/h-e53a3a9829a8.md, lines 56-69 reach subcomponents/h-ce5b9771a26a/spec.md; the only target text not from the source is the H1 title, the fenced metadata block and the quoted Added in candidate paragraph in each of the three files, all labelled. No RUL ids or decision headings occur in these units.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_38036fa49508cc4b76e5e20fdb797a77 | ok | deep: H2 Entry Points & Triggers line 56 equals target line 25 verbatim at the same level, heading digest equal; map row entry-points-triggers names subcomponents/h-ce5b9771a26a/spec.md and the anchor exists; target H1 is labelled Added in candidate. | 72526beea6ee0dab3fb182c1754440a8b37f4be2a7c4ffe734e7ef583c833b68 | 72526beea6ee0dab3fb182c1754440a8b37f4be2a7c4ffe734e7ef583c833b68 |
| claim_9e761df1b2c15fd9a0e722d1f0324a4a | ok | deep: source lines 58-69 (the 12-line entry-point list from fgos-runner --once to the later bullets) equal target lines 27-38 byte for byte; digest 66c396e7 recomputed; anchor unheaded-block-3 resolves; stale-text content is carried verbatim as the A19 carriage and A35 rules require, truth not judged. | 66c396e78df6e72f66e4870a5c211b0deff5387b6985d9362a528e94cbfcd8a6 | 66c396e78df6e72f66e4870a5c211b0deff5387b6985d9362a528e94cbfcd8a6 |

## Notes

- Observation, not rework: every rationale in this shard repeats a generic sentence ("Decision/history placement is not a retirement judgment", "P2 frozen map with explicit Lead additive amendment") even on rows with no amendment or decision placement. It is not false for the map as a whole and is the same boilerplate red-team R9-5 already covers.
- spec.md carries only the H1, metadata and label (red-team R9-6); the introduction paragraph lives in the architecture carrier as the map dictates.

Unresolved: none for these rows.
