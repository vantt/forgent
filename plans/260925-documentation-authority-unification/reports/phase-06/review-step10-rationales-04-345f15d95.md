# Review of Step 10 rationale deltas, part 4

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16
Review mode: ordinary
Request commit: c939e9a51
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request: review-request-step10-rationales-04-345f15d95 (11 rationale-delta entries, each marked deep). Read-only worktree at c939e9a51; docs bytes equal 345f15d95. No sensitivity pack was requested or fabricated (ordinary review).

Mechanical checks on every entry (script in scratch dir work-v5, extractMarkdownConservationUnits from scripts/generate-doc-inventory.mjs): (1) the entry currentDecision equals the committed shard row and the entry after text equals the shard rationale; (2) the target anchor exists via scripts/list-doc-anchors.mjs --check (241 distinct targets, 0 failures) and the target ancestry equals the real heading chain (259 of 259 with a target); (3) full source and target unit digests recomputed; the source unit was located by digest prefix at HEAD or at the older commit named in the rationale; (4) source line ranges quoted in each rationale equal the real unit span; (5) every identity claim (byte-identical, line for line, text identical) tested by whole-text equality of source and target; (6) before to after rationale diff classified and each added or removed clause checked against git history (shard rows at 19ca8de23, 2300d6557, 62d147641, 4a18f35ff, 345f15d95); (7) retained rows: source file sha256 equals its pin.

Sampling (owner answer A36): seed 20261016 (python random.seed, random.sample of 40 of the 265 entries over all four requests, sorted by id); sampled entries carry deep (seeded sample) in the note. Of these 38 with a located line span were digests hand-recomputed with a separate implementation of the digest recipe (sha256 of the trimmed line span, and the heading recipe with section payload and following block): 38 of 38 equal, 2 skipped (no unit span). Because rework exceeded 3 percent of deep rows (44 of 265 across the four requests), I escalated to a whole-pack read: every entry was compared by script on its full source and target text, and every distinct rationale pattern and every non-pattern row was read in full; all notes are therefore deep.

Systemic findings of this re-review (details in the rows): (a) 36 rows keep a stale clause saying the current target was changed by link restoration or bookkeeping and that native --rebind is owed, next to a new sentence proving the target is the unchanged reviewed text; (b) three A35 rows open with a false byte-identical claim; (c) the Related Files rows of governance.md state nine adjustments and three repoints where there are six and two; (d) an inverted citation range bin/fgos.mjs:4415-4380 remains in h-f34e0d170d89/spec.md and three rationales mention it wrongly or not at all. Anchor-by-position defects are fixed: every L10-21 rebind matches content (digest equal at the new anchor, old anchor no longer holds that text). Legacy/target link swaps in predecessor units 205, 206, 215 are restored correctly.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_0cf686172891ae94a83c1993dab8e1f5 | ok | rationales-205: deep: link-cell fix: the legacy transition row now points to the candidate ../architecture/legacy-cli-transition.md (exists) and the source transition row keeps the legacy link; predecessor values match the reconciliation file; generic rationale is a shared three-way list but this delta fits its link-cell class. | 62d185bdf7449fb6b6664260598e25aebbbd33ef6f868b97809bab5c88b28d62 | 14c1c0ac5e7be57002c04a3c0beed23bc3afcb963eb9f6ece2afe2dbcb29e015 |
| claim_a93bd8da295ccacefb41a101085b898e | ok | rationales-206: deep: Legacy source column had candidate paths in three rows at 19ca8de23, now the legacy architect paths (files exist) with matching short labels; fits the link-cell class of the shared rationale; predecessor and successor texts equal the reconciliation file. | 6bad0fe97aa355df9cb36c5956d863ab1a101cfa982bdbe724e4224952c2cd04 | bde5207b515b4be800ca245741a3c524e97067e3c96e39853879a1995d7c2ed0 |
| claim_12b5a84382034e873673bfc9cb09734c | ok | rationales-207: deep: scaffold line changes the evolve citation from bin/fgos.mjs:4373-4380;4640-4643 to 4414-4417 (lines 4414-4417 hold the unknown-verb throw); fits the evolve citation class. | 25e5d283f7df610fc091c31b8ef48b747a8f5fa54530ff8b1b84a92da3887d09 | 3fab723eb054be1c1007c12f347887b98f4d864a5ae24d84527fa3eca45e3446 |
| claim_08f9b4c140ce931a064c131c2bd4e014 | ok | rationales-208: deep (seeded sample): single citation fix bin/fgos.mjs:4373,4461 to 4415,4461, line 4415 is the unknown-verb throw at the content pin; fits the evolve class. | 30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059 | 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 |
| claim_e0fc704182450d959f8452cc09da5f20 | ok | rationales-209: deep: table row 9 and row 10 are unchanged except 4373 to 4415 in the Gate A row; delta is exactly the evolve citation. | fb31e222bd67854fd1f83cc81922b2000b03d972159a7c2b390a993e38177894 | 417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39 |
| claim_8e43ff23542c1a2386d7ce3d2bf5e30d | ok | rationales-210: deep: one bullet, citation 4373 to 4415 only; the rest of the e2e line is byte equal. | 2e0561425f15bad2d92bbd21e6b7f837523159beb3b8de7fe250e67cbed1a27c | b4abd2b685fe57f6a2616db1b22d4ddc28196279ade0c0307087370b59671964 |
| claim_5c067230bc1c324d3691dc880edb2578 | ok | rationales-211: deep (seeded sample): one table row, citation 4373 to 4415 only. | 69f0927ed54ab08aa5fc1e9f43beca35a3ad76e034a98945ea39674b4dc4cb2f | 6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110 |
| claim_792117ae3e90dcc79bb2522f59773b89 | ok | rationales-212: deep: scaffold quote, ranges 4373-4380;4640-4643 replaced by 4414-4417 as in the sibling files; consistent and valid. | f88931593c55ac2afc6ae60cd52a96dda07aa2b673d169b001205b302ef544b4 | 3405ed4f32704ce2e17c155d22d3366a75bdf88bc026b500d66ed59f11314445 |
| claim_61244b0a84842a2771f7cdb493ebb699 | rework | rationales-213: deep: the target scaffold paragraph (h-f34e0d170d89/spec.md line 23, block-2) now reads bin/fgos.mjs:4415-4380, an inverted range from replacing 4373 only; sibling scaffolds in h-51f5cd7279fd and h-ce5b9771a26a were corrected to 4414-4417. The generic reconciliation sentence presents this as an evolve citation correction, so the rationale does not tell the truth about a still-broken citation (step-10-report line 70 admits it). Fix the range (and rebind) or state the defect. | ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f | 35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca |
| claim_09ce5c9968f21e0b39b0f23170433a9b | ok | rationales-214: deep: Pointers list line for the evolve verb, citation 4373 to 4415 only; the unit is the one in h-f34e0d170d89 block-3 (the inverted range is in block-2, see the row for block-2). | eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891 | 853cf58afec64a9d7b507305bfadf959cf0f88ef17e3b90b199a85bf3ed71c43 |
| claim_cb4a2f19d067a329bce233f6e2252729 | ok | rationales-215: deep: the two links in the third retained source sentence were swapped at 19ca8de23 (legacy and candidate cells); HEAD restores docs/work-item-lifecycle-vision.md as the retained source and platform vision.md as candidate, verified against the files. | 4452faaea1546e83431eedbc99837a462b2ddce67c1466025d0e3fc185020898 | 4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793 |

## Notes

Counts for this request: 10 ok, 1 rework, 0 hold.
Rows whose claim is a registryGaps or native tuple row (part 4, and gap rows elsewhere) are expected to report unknown-claim in the lint.
Source digests are the full text digest of the unit located in the legacy file (textDigest, equal to the shard sourceUnitDigest where that is 64 hex); target digest equals the shard targetUnitDigest; none for the six retained rows.

Unresolved: none beyond the rework items above; no hold needed.
