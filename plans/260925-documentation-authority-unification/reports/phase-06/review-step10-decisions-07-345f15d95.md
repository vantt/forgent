# Review step 10 decisions part 07 bounded re-review at 345f15d95

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16
Review mode: ordinary
Request commit: c939e9a51
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request `review-request-step10-decisions-07-345f15d95.md` with its `.json` sidecar: 11 entries, all new pending registry-gap rows superseding the native predecessors from 19ca8de23 to the current same-section units (step10-sync345-predecessor-reconciliation.json). The request asks for no sensitivity pack.

Read-only worktree /home/vantt/projects/forgentX-s8-review at c939e9a51 (docs bytes equal 345f15d95); git status was empty at the end. No sensitivity pack was requested or used (ordinary review). Read first: review-brief, owner answers A9 A15 A19 A22 A28 A31 A33-A42 with L9-* and L10-1..L10-22, F6, N1, Step 10 Close and its shared rules, step10-evidence, red-team-10, review-10-close-truth, promoted-edits, post-review-edits, and the previous reports review-step10-decisions-01..05-19ca8de23 and the c01, native and links notes for these claim IDs (each earlier rework was checked against its fix).

Mechanical checks on every row: the committed shard row equals the pack currentDecision field for field (11 of 11); source and target unit digests recomputed from the committed files with extractMarkdownConservationUnits (full 64 hex, equal to the pack and to the shard digest or its prefix), 0 mismatches; node scripts/list-doc-anchors.mjs --check on all 11 distinct target path#anchor pairs, 0 failures; rows with unequal digests were diffed word by word, rows with equal digests compared byte for byte; target ownership checked against every decision shard (shared targets are gap predecessors or footer successors accounted by design); retain-in-place rows (no target) checked for a source file byte-identical to its pin and for the quoted unit digest.

Sampling (A36): all 11 rows are deep (unequal digests; each predecessor text at 19ca8de23 was diffed word by word against the current unit), so no seeded draw was needed. The deep rework rate is 2 of 11, over 3 percent, so the whole request was read in full. The first-authored bytes (git show of the first commit of each file) settled the three link-cell rows.

## Verdicts

Counts: 9 ok, 2 rework, 0 hold.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_0cf686172891ae94a83c1993dab8e1f5 | ok | deep: gap predecessor at 19ca8de23 versus current unit, same anchor and ancestry; only the first row of the Related Files table changed, legacy-transition cell now links ../architecture/legacy-cli-transition.md which equals the first-authored bytes (git show 05b6bf861) and the source-transition row keeps the legacy architect link, so legacy and target links are in the right cells (L10-18b answered); rationale matches | 62d185bdf7449fb6b6664260598e25aebbbd33ef6f868b97809bab5c88b28d62 | 14c1c0ac5e7be57002c04a3c0beed23bc3afcb963eb9f6ece2afe2dbcb29e015 |
| claim_a93bd8da295ccacefb41a101085b898e | ok | deep: Source Coverage Matrix table, the three inverted rows (external-provider-protocol, legacy-cli-transition, node-to-rust-component-migration) now carry the legacy architect link in the Legacy source cell and the candidate link as first preservation target, identical to the first-authored file; rest of the table byte-equal to the predecessor, previous rework answered | 6bad0fe97aa355df9cb36c5956d863ab1a101cfa982bdbe724e4224952c2cd04 | bde5207b515b4be800ca245741a3c524e97067e3c96e39853879a1995d7c2ed0 |
| claim_12b5a84382034e873673bfc9cb09734c | ok | deep: Added in candidate note of h-51f5cd7279fd; only change is the evolve citation range 4373-4380 plus 4640-4643 replaced by 4414-4417, which brackets the default unknown-verb throw and closing braces at 345f15d95; nothing else differs | 25e5d283f7df610fc091c31b8ef48b747a8f5fa54530ff8b1b84a92da3887d09 | 3fab723eb054be1c1007c12f347887b98f4d864a5ae24d84527fa3eca45e3446 |
| claim_08f9b4c140ce931a064c131c2bd4e014 | rework | deep: Gate A intro line; only change is 4373 to 4415 (verified real unknown-verb throw); rework: the line still cites 4461 as unknown-verb evidence but bin/fgos.mjs:4461 is the labelFor helper and the help-door rejection is at 4503; fix the citation here and in the successor rows 224b5f54 and 979ec4a6 (same text) | 30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059 | 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 |
| claim_e0fc704182450d959f8452cc09da5f20 | ok | deep: Data Dictionary table, the only differences are the two bin/fgos.mjs:4373 citations (rows 9 and 10) changed to 4415, the real unknown-verb throw; all other rows byte-equal | fb31e222bd67854fd1f83cc81922b2000b03d972159a7c2b390a993e38177894 | 417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39 |
| claim_8e43ff23542c1a2386d7ce3d2bf5e30d | ok | deep: Edge Cases Settled bullet list, only the historical evolve scenario citation 4373 to 4415; byte-equal otherwise | 2e0561425f15bad2d92bbd21e6b7f837523159beb3b8de7fe250e67cbed1a27c | b4abd2b685fe57f6a2616db1b22d4ddc28196279ade0c0307087370b59671964 |
| claim_5c067230bc1c324d3691dc880edb2578 | ok | deep: Actors and Access table, single cell change 4373 to 4415 in the Gate A row | 69f0927ed54ab08aa5fc1e9f43beca35a3ad76e034a98945ea39674b4dc4cb2f | 6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110 |
| claim_792117ae3e90dcc79bb2522f59773b89 | ok | deep: Entry Points scaffold note, evolve entry-point correction range 4373-4380 plus 4640-4643 replaced by 4414-4417, consistent with the default branch; no other change | f88931593c55ac2afc6ae60cd52a96dda07aa2b673d169b001205b302ef544b4 | 3405ed4f32704ce2e17c155d22d3366a75bdf88bc026b500d66ed59f11314445 |
| claim_61244b0a84842a2771f7cdb493ebb699 | rework | deep: Pointers scaffold note; rework: the replace-deleted-ranking-pointer citation now reads "bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380", a descending range from a half edit (only the first number of 4373-4380 was updated) and 4640-4643 now points at unrelated hook-wiring output lines; the rationale claim that the reversed or stale scaffold ranges are corrected is therefore false for this file; replace the pair with the same corrected range used in the sibling Entry Points note (4414-4417) or a verified one | ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f | 35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca |
| claim_09ce5c9968f21e0b39b0f23170433a9b | ok | deep: Pointers list block-3, only the evolve pointer citation 4373 to 4415; the rest of the 51-line list byte-equal to the predecessor | eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891 | 853cf58afec64a9d7b507305bfadf959cf0f88ef17e3b90b199a85bf3ed71c43 |
| claim_cb4a2f19d067a329bce233f6e2252729 | ok | deep: work-state README Legacy Source Pointers sentence now reads docs/work-item-lifecycle-vision.md as the third retained source and vision.md as the platform vision candidate, identical to the first-authored bytes (swap fixed, previous rework answered); ../vision.md and ../../work-item-lifecycle-vision.md both exist | 4452faaea1546e83431eedbc99837a462b2ddce67c1466025d0e3fc185020898 | 4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793 |

## Notes

1. The three link-cell rows from the previous round (source-preservation-audit Source Coverage Matrix, work-state README sentence, legacy-payload Related Files) now equal the first-authored bytes: legacy architect links in the Legacy source cells, candidate links in the preservation cells (L10-18b answered).
2. The evolve citations moved from 4373 to 4415 (real unknown-verb throw) and the two ranges to 4414-4417 (default branch), except the defects in rows 3 and 8.
3. Row 8: the h-f34e0d170d89 scaffold note holds bin/fgos.mjs:4415-4380 (descending) and 4640-4643 (unrelated lines now).

Unresolved: none beyond the rework items.
