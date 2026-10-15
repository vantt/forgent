# Review: runner source packs 02

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request: review-request-261015-1706-runner-source-02-81d0ed074.md (shard s9-runner-01.json, SHA256 de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b; sidecar SHA256 in the request header equals the file). 8 rows, all Weak-exact or Judgment, no Unit-exact, no map amendments, no rebound anchors on these rows. Ordinary review; the request carries no sensitivity pack, so none was run or fabricated. Carriage review only: truth of carried text is not judged (A19; corrections run separately). Red-team-9 findings were read and not re-raised; R9-5 (boilerplate retirement sentence in non-decision carriers) and R9-6 (no navigation in spec.md) touch these target files but are being fixed separately.

Mechanical checks for every row: source unit digest recomputed from docs/specs/runner.md at 81d0ed074 and target digest recomputed from the committed target file at the review HEAD (docs bytes equal the content commit; git diff of docs and the shard between 81d0ed074 and HEAD is empty) with extractMarkdownConservationUnits; sidecar and shard decision objects equal one to one (495 shard claims, review status pending); pack markdown digests equal the sidecar; list-doc-anchors --check passed for every target anchor; each source anchor and line range matches the extractor; target owner and anchor equal the frozen map row (dispatch-runtime-inspection, guard-reconciliation to architecture/h-e53a3a9829a8.md; entry-points-triggers to subcomponents/h-ce5b9771a26a/spec.md; preamble and H1 to spec.md by the file default); no duplicate source or target owner for these 12 rows; nativeTargetClaimId values exist in step9-native-verification.json.

Sampling (A36): seed 90417 (python random.Random, sample of 3 of the 12 claim-id prefixes for the extra hand digest check: 3803, a48d, 383a). Because the pack is only 12 rows, all 12 were read in full both directions (source lines versus target lines compared byte for byte for every unit; the files' other text inspected for unlabelled additions) and every row is marked deep. Hand recompute with sha256 of trimmed text outside the extractor: blocks 1, 2, 3 and the target block 5 matched, plus the H1 heading composite shows the source payload empty (sha e3b0c442) versus the target payload non-empty, which explains the one unequal digest pair. Deep rework rate 0 of 12, below the 3 percent threshold, so no full-pack escalation was needed.

Both directions: source lines 1-7 and 9 reach spec.md, lines 11-54 reach architecture/h-e53a3a9829a8.md, lines 56-69 reach subcomponents/h-ce5b9771a26a/spec.md; the only target text not from the source is the H1 title, the fenced metadata block and the quoted Added in candidate paragraph in each of the three files, all labelled. No RUL ids or decision headings occur in these units.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_db73c791da40554dda8dacd8405de722 | ok | deep: H2 line 11 equals target line 25 verbatim, same level so heading digest equal; map row dispatch-runtime-inspection names architecture/h-e53a3a9829a8.md and anchor exists; target H1 above it is a labelled Added in candidate title; rationale true. | 5ed555b20633e3d02aab26557fd2c1a144c2cac1cc1da5e7048986c280cfa1e0 | 5ed555b20633e3d02aab26557fd2c1a144c2cac1cc1da5e7048986c280cfa1e0 |
| claim_383a6485c1aaed79a640a59463183fe8 | ok | deep: H3 Guard reconciliation line 13 equals target line 27 verbatim at the same level, directly under the retained H2; map row guard-reconciliation matches the owner and anchor; rationale true. | 16c2b3dace9daab9a6d90e29bd7f00fbad2c313cbedb0e28ed031664fa81b255 | 16c2b3dace9daab9a6d90e29bd7f00fbad2c313cbedb0e28ed031664fa81b255 |
| claim_9a0635bb67690683a0a7465eadae82af | ok | deep: source lines 15-19 equal target 29-33 byte for byte (reconcile door paragraph), hand sha256 matches 52b140cf, anchor unheaded-block-3 resolves; direct unit of Guard reconciliation so the map owner is right. | 52b140cfe4f41a03526182348d228ca206a88dade16f7969fe3852284677c39a | 52b140cfe4f41a03526182348d228ca206a88dade16f7969fe3852284677c39a |
| claim_cdf8c5562fb083bbdccf7d8c03decb7a | ok | deep: source lines 21-36 equal target 35-50 byte for byte, covering all four reconcile actions including the CoordinationSession refusals; hand sha256 matches 026046f0; anchor unheaded-block-4 resolves; nothing dropped or added. | 026046f0b0c9dff4fa16ad675837105849db185678d8263e091270e599c0ba72 | 026046f0b0c9dff4fa16ad675837105849db185678d8263e091270e599c0ba72 |
| claim_5d9ba2698cc42766513d2f6892f4456c | ok | deep: source lines 38-42 (dispatch inspect read-only selector paragraph) equal target 52-56 verbatim; digest 8e07eb62 recomputed by script; anchor unheaded-block-5 resolves; map owner correct as it sits under Guard reconciliation. | 8e07eb62e2a93097b82a4428a8f5bb3a2880bff4992130393b9b7783c4cccdc1 | 8e07eb62e2a93097b82a4428a8f5bb3a2880bff4992130393b9b7783c4cccdc1 |
| claim_a48d3e36ff3950e3637e7a0945d8a26a | ok | deep: source lines 44-48 (fail-closed projection paragraph) equal target 58-62 verbatim; hand sha256 of target block equals 0eced0ec; anchor unheaded-block-6 resolves. | 0eced0ecaa6ff9b75497aef41ccbf40df3e5435c41dd06de86afdc82047ce5c9 | 0eced0ecaa6ff9b75497aef41ccbf40df3e5435c41dd06de86afdc82047ce5c9 |
| claim_6dba9226798857c2c2eedd1837fc382b | ok | deep: source lines 50-52 (RunObservation never settles a Run; result.json remains terminal truth) equal target 64-66 verbatim; digest c46300ac recomputed; anchor unheaded-block-7 resolves. | c46300ac8ef4f83a196a65ab08fc44def29be98df645c8321a7b0a310d05a8de | c46300ac8ef4f83a196a65ab08fc44def29be98df645c8321a7b0a310d05a8de |
| claim_2073b7160c35c63c611d02087866ddec | ok | deep: the Vietnamese area-introduction paragraph at source line 54 equals target line 68 byte for byte; it sits under Guard reconciliation in the source so the map and the Added in candidate note in spec.md place it correctly in architecture/h-e53a3a9829a8.md; anchor unheaded-block-8 resolves; no text added. | a0ac201ce63ad313f1e8cd2584ab6ffc111a74a4b25a96f24c3a1c939b4ddeb2 | a0ac201ce63ad313f1e8cd2584ab6ffc111a74a4b25a96f24c3a1c939b4ddeb2 |

## Notes

- Observation, not rework: every rationale in this shard repeats a generic sentence ("Decision/history placement is not a retirement judgment", "P2 frozen map with explicit Lead additive amendment") even on rows with no amendment or decision placement. It is not false for the map as a whole and is the same boilerplate red-team R9-5 already covers.
- spec.md carries only the H1, metadata and label (red-team R9-6); the introduction paragraph lives in the architecture carrier as the map dictates.

Unresolved: none for these rows.
