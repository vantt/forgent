# Review of runner source pack 11 (s9d)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request review-request-261015-1706-runner-source-11-81d0ed074.md (shard s9-runner-01.json, SHA256 de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b; target docs/platform/runner/subcomponents/h-37aced3896a8/spec.md, part 1/1); 4 Weak-exact rows, 0 Judgment, 0 unequal-digest pairs, 0 map amendments, 0 rebound anchors in this pack. No sensitivity pack was requested or run.

Mechanical checks on every row: source unit extracted from docs/specs/runner.md at 81d0ed074 (blob ddfa78cc, equal to HEAD of the review worktree) with extractMarkdownConservationUnits, full digest equal to the pack and the shard claim; target unit extracted from the committed target file, digest equal to the shard targetUnitDigest; list-doc-anchors --check passes for the target owner and anchor; pack decision equals the shard claim field by field (23 of 23 across the three packs); rationale cites the right source lines, target path and anchor and its class reason matches the sidecar; the pack full-source text matches the committed source.

A36 sample: seed 261015, Python random.seed(261015) then random.sample over the sorted claim IDs of pack 10 (10 of 15); packs 11 and 12 are read in full (4 of 4 each, minimum is all when fewer than 10). This pack deep-read 4 of 4 rows (min required 4). Deep rows were read with diff of the whole contiguous source range against the whole target range (empty diff) and their raw-unit sha256 recomputed by hand in Python (independent of the repo tool); heading digests were recomputed with the tool formula. Both directions: every non-scaffolding target unit of the file has a claim (no duplicates), and the only uncovered target units are the H1, metadata fence and blockquote, all labelled Added in candidate. 0 of the deep rows needed rework, so no full-pack escalation.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_099eb566c825967cf35f9397f2d7b947 | ok | deep: heading unit Edge Cases Settled level 2 carried verbatim, same level and title, source runner.md 1123-1123 vs target 25-25; target adds only the labelled Added in candidate H1, metadata fence and blockquote; rationale named target and lines are true. | c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4 | c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4 |
| claim_3332d3ab8fadd91605a8a92da08091b7 | ok | deep: source and target text diff-identical (source runner.md 1125-1161 vs target 27-63); RUL ids present and verbatim: RUL29, RUL30; hand sha256 of both raw units matches the pack; anchor ok, rationale lines and target match. | 968a9e65860acfe7d1f346e7b8de178845f40688a634e6cbef5c7e3d2c2841a2 | 968a9e65860acfe7d1f346e7b8de178845f40688a634e6cbef5c7e3d2c2841a2 |
| claim_e3bd4567b6cb5b3e9da820c7a01da19a | ok | deep: source and target text diff-identical (source runner.md 1163-1170 vs target 65-72); no RUL id in this block; hand sha256 of both raw units matches the pack; anchor ok, rationale lines and target match. | 798124b276040909ca49f18983810c338f880ce2a7c22cd3f347736ec9582710 | 798124b276040909ca49f18983810c338f880ce2a7c22cd3f347736ec9582710 |
| claim_36f4a3c4ae623f3a348faadd747dcba7 | ok | deep: source and target text diff-identical (source runner.md 1172-1173 vs target 74-75); RUL ids present and verbatim: RUL48; hand sha256 of both raw units matches the pack; anchor ok, rationale lines and target match. | 153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073 | 153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073 |

## Notes

- Carriage only; truth of the carried sentences is not judged (A19), and the carried text keeps its known stale statements per the author note.
- Minor observation, not rework: every rationale says the P2 frozen map carries an explicit Lead additive amendment, yet these rows record no map amendment and the map rows for business-rules, edge-cases-settled and open-gaps are unchanged at the older blob 473a0096; the sentence is shared boilerplate, harmless because the placement matches the map rows exactly.
- Target scaffolding (H1, metadata fence with Provenance pointing at blob ddfa78cc, blockquote) is labelled Added in candidate and is not a source claim.

Unresolved: none.
