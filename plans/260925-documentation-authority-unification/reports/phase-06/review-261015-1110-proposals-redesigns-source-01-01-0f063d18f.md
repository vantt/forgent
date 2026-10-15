# Review: proposals and redesigns, docs/architect/dispatch-control-plane-redesign.md part 01

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Review mode: ordinary
Request commit: 453914972
Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238

## Scope and method

Request review-request-261015-1110-proposals-redesigns-source-01-01-0f063d18f.md, pack SHA256 8ce036a4f399d1c1926dfe06451099575a6883ce7755fd5927107cfb0cbb3bcf (recomputed from the file, equal), shard plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-01-dispatch-control-plane-redesign.json (SHA256 equals the pack's originalShardSHA256). 7 rows, one per claim. The sensitivity part of the request template does not apply to an ordinary review and is ignored. All reads are at worktree HEAD 453914972; docs and scripts are byte-identical to 0f063d18f (git diff over docs and scripts is empty). Source blob 6d66e789fbe1fdf433d1c9a72d8ab3de32b0f8b1 equals the frozen map pin.

Mechanical checks, all rows: unit located in source and in target by anchor and start line, digest recomputed with extractMarkdownConservationUnits and compared with the pack, sidecar and shard decision (0 mismatches); `list-doc-anchors --check` on owner#anchor (0 failures); shard decision object equals the pack decision; owner equals the frozen map target; rationale statement of source and target lines and anchors equals the row (0 mismatches); ancestry equal; every disposition is `move` and every row is `pending`.

Whole-unit conservation (both directions): after the source H1, the source file and the target body after the Source relationship line are byte-identical (checked by string equality, not only by digests); the only target text outside that body is the txt metadata fence, the Added in candidate paragraph and the Source relationship link, which are the three unclaimed target units (all labelled). Every source unit has a row, no target digest is claimed twice. Neither file contains an inline Markdown link outside the new Source relationship link, which resolves to the legacy source, so no link rebase exists to check; fenced literal blocks are inside the byte-equal body.

Deep reads (7): all 7 rows (every row was changed by 0f063d18f; the one differing-digest row and the one Weak-exact row are included). Weak-exact plus Judgment population 2; 15 percent is below the minimum of 10 rows, so 10 plus the mandatory pair is the floor applied. Hand-recomputed digests: independent re-implementation of the unit digest formula (python, no shared code) for a seeded draw (random.Random(26101599), 16 of 136 rows across the three packs, 11.8 percent), 16 of 16 equal.

0 of the deep-read rows need rework, so the 3 percent escalation does not apply.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_2ec7fc22c79d18b5f8d57cc79ec5e587 | ok | deep: judgment H1 row; target section differs from source only by the labelled candidate metadata fence, Added in candidate paragraph and Source relationship line; remaining section text is byte-equal to source, owner and anchor per frozen map, move fits maintained-authority file, rationale true | 7b5d3df68b88c26058760be3ed0d7f21c05f84e1512a07212d26e953156fc154 | b836a91ed4d5753a3192ae3a992e713477fc30524d664dc173024fb8ad889741 |
| claim_c1d6c7e71ac871df50ade9fbd9c197ef | ok | deep: weak-exact; source L3-3 unheaded-block 'Canonical architecture moved to:' -> unheaded-block-4 L27-27 read in source and target; pointer stub text carried verbatim, three inline-code legacy paths kept and queued for cutover as the rationale says; rationale line and anchor statement match the row, rewritten rationale names the pointer role truthfully | d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025 | d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025 |
| claim_6f1c18985eba573f3f0bc7af216dff30 | ok | deep: unit-exact; source L5-5 unheaded-block '`docs/architect/agent-coordination/arc...' -> unheaded-block-5 L29-29 read in source and target; pointer stub text carried verbatim, three inline-code legacy paths kept and queued for cutover as the rationale says; rationale line and anchor statement match the row, rewritten rationale names the pointer role truthfully | 9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d | 9f09d4dd432d5814defd450773102806aa4ebedd5a60c74d34fb56f6170a1b3d |
| claim_2aa7df6a5ea4807463b81b5181821702 | ok | deep: unit-exact; source L7-7 unheaded-block 'The unresolved redesign source is reta...' -> unheaded-block-6 L31-31 read in source and target; pointer stub text carried verbatim, three inline-code legacy paths kept and queued for cutover as the rationale says; rationale line and anchor statement match the row, rewritten rationale names the pointer role truthfully | 05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9 | 05f2f858d3dd1da2fd0f5aa24bca9bf5ac7461b094e730351f0f8fad6f3c4db9 |
| claim_62153be70af7b764bdb0d17617240bbf | ok | deep: unit-exact; source L9-9 unheaded-block '`docs/architect/agent-coordination/pro...' -> unheaded-block-7 L33-33 read in source and target; pointer stub text carried verbatim, three inline-code legacy paths kept and queued for cutover as the rationale says; rationale line and anchor statement match the row, rewritten rationale names the pointer role truthfully | 9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c | 9fbd6397234cea5609c4f7e3b1e780262da7cd2ce04debdff55681ec6fde983c |
| claim_47245c890a656f03be28dee6020f095a | ok | deep: unit-exact; source L11-11 unheaded-block 'For the full related architecture set,...' -> unheaded-block-8 L35-35 read in source and target; pointer stub text carried verbatim, three inline-code legacy paths kept and queued for cutover as the rationale says; rationale line and anchor statement match the row, rewritten rationale names the pointer role truthfully | 9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b | 9032365b4307c1ae7a2015ae1c788914f155ec78d775ce147f258345ed2d332b |
| claim_3811942485f2624b620b36b3a3aba933 | ok | deep: unit-exact; source L13-13 unheaded-block '`docs/architect/agent-coordination/REA...' -> unheaded-block-9 L37-37 read in source and target; pointer stub text carried verbatim, three inline-code legacy paths kept and queued for cutover as the rationale says; rationale line and anchor statement match the row, rewritten rationale names the pointer role truthfully | 08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d | 08a86f38c1e24a34199abc0740b5d43fdaa0459b4ea41669b3b6f226d6e7691d |

## Notes

- The rewritten rationale (0f063d18f) fixes the earlier red-team points: the Added in candidate paragraph no longer carries owner-answer labels or rebuttal wording, and owner-queue.md line 361 onward lists the three inline-code legacy paths owed at cutover. Both statements were checked against the committed file and queue.
- Observation, not blocking: runner.md lines 1273 and 1277-1278 cite `dispatch-control-plane-redesign.md:125/:175/:210`; those line numbers fit the 39K full proposal at docs/platform/agent-coordination/proposals, not this 13-line pointer stub. The rationale's evidence is true as a citation of the name and it already says the full body lives elsewhere, so the verdict stands, but the cutover repoint of runner.md should target the full proposal.
- Rows are authored by the correction session codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15 (pack states row-level authoredBy is authoritative); the request header names ...40d90d09, which is used above. Neither is the reviewer.
- claimKind on all rows is `architecture` while the map kind for the carrier is proposal; the vocabulary has no proposal claim kind and the shard's kind equals the pack, so no change is asked.

Unresolved: none for the verdicts.
