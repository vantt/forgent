# Bounded re-review step 10 at 62751458b: decisions part 1 (native predecessor rows)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16
Review mode: ordinary
Request commit: f1f414b02
Content commit: 62751458b22b47e930dc33b8501d07798b91ace3

## Scope and method

Request reviewed: review-request-step10-decisions-01-62751458b.md and its json sidecar (2 package-native-predecessor-decision entries, both deep, both pending rows of plans/260925-documentation-authority-unification/ledger/decisions/s10-round4-native-predecessors.json that exist only from the request commit f1f414b02, not at the content commit; I bound them to f1f414b02 as the request header asks). The md blocks equal the sidecar; the sidecar row, currentDecision and after objects equal the shard rows at HEAD. Ordinary review; the request carries a sensitivity-pack clause that I ignored (no sensitivity result is claimed). I never ran the fgos CLI, never read secrets.local.env and wrote only into my scratch dir. The review worktree is /home/vantt/projects/forgentX-s8-review at f1f414b02 (docs, scripts and tests bytes equal the content commit 62751458b: git diff 62751458b f1f414b02 over docs, scripts, test and the three tool files is empty; the only registry-relevant change in the request commit is working-identity-registry.json).

Checks: both rows resolve through the extractor at 9b0526380 (source: unheaded-block-44 lines 436 to 437 digest 9643a6fe, unheaded-block-117 lines 1470 to 1471 digest 087d5cdd) and at HEAD (target: same anchors and lines, digests f0330242 and 7486a9e9); ancestry equals targetAncestry; link counts 0 and 0 are right; both source digests carry earlier ok verdicts for the unchanged block (review-261015-1110-proposals-redesigns-candidates-0f063d18f.md) which gives the printed last-reviewed commit 0f063d18f. The rationale text is derived from those facts: for decisions-001 it says the successor has different direct text (true: Registered becomes registered after the label), for decisions-002 it says the complete source direct section occurs verbatim inside the target section (true: the old two lines are a suffix and a full line of the new block). The labelled correction L10-31 quoted in both rationales equals the document edit (documents-001 and documents-002). Anchors pass list-doc-anchors. Hand-recompute seed s10x1-62751458b-hand-1: random.Random(seed).sample(sorted(ids of decisions-001..002, footers-001..008, native-002, native-004, native-013, native-014), 5) = decisions-001, footers-006, native-004, footers-007, native-013; plain python sha256 over raw block lines (no extractor) reproduced the source and target digests of all four decision and gap digests (9643a6fe, f0330242, 087d5cdd, 7486a9e9) and the footer sentence digest 95a357e2 at its 8 current lines (also 1665 equals 2792 byte for byte), and sha256sum of every committed file in the tools and documents groups equals the digest cell.

Seed and sample: both rows are deep reads (all rows of this part). Rework share 0 of 2.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_f15e4328e1e5df90c51f535e75da554b | ok | deep: supersede of architecture-advisory-artifact-templates.md unheaded-block-44 (lines 436 to 437) from the 9b0526380 witness to the same anchor now: the only change is the labelled prefix and the lowercased first word, source words all carried, the quoted correction fragments equal the committed lines, the rationale states differing digests and an unchanged-since-review disclaimer that matches the 0f063d18f approval, and its claim that the successor has different direct text is true. | 9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5 | f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca |
| claim_9e9d711e331efe5a12c8b8bf50371dc6 | ok | deep: supersede of architecture-advisory-role-doctrine.md unheaded-block-117 (lines 1470 to 1471): the source two lines occur verbatim inside the new block, which only gains the labelled current-Workflow prefix, so the rationale sentence that the complete source direct section occurs verbatim inside the target section is true; the correction fragment equals the committed line and the ancestry has three levels as stated. | 087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63 | 7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34 |

## Notes

1. These two predecessor rows give the two new identity gaps (native-013 and native-014 of the native part) the decision row the registry requires; the gap digests equal the source digests here.
2. The rows replace nothing reviewed: the earlier approvals belong to candidate classifications of the unchanged block and stay as they are.

Unresolved: none.
