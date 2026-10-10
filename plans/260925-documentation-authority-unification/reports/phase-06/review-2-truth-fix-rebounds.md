# Review 2 truth-fix: unchanged ordinal binding witnesses and A22 derived-row accounting
Reviewer: reviewer:claude-session:4df9e88c@2026-10-10
Author session: codex-session:1@2026-10-10
Review mode: ordinary
Pack commit: e4ff8b44e733ffc85d446d97b6dba6d41d9b9417
Request: reports/phase-06/review-request-2-truth-fix.md (author HEAD e485bf6e0; current-text commit f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f; accounting commit e4ff8b44e733ffc85d446d97b6dba6d41d9b9417; owner decisions A19, A20, A22; A5/A6/A11-A22 govern)
Reading method: Targeted truth-fix review; every current-state sentence of the changed sections checked against current code/CLI; owner-approved A19/A22. Each cited file:line range was opened and read by the reviewer (author citations treated as leads only); relative links and backtick paths of the 21 sections were resolved by script (40 links, 0 missing; 101 path references, only intentionally retired or template names unresolved); 44 line-range cites were bounds-checked. Digest columns are the sidecar native sourceUnitDigest and targetUnitDigest copied verbatim. Parallel Sonnet subagents read disjoint file groups and returned per-item findings; the reviewer re-verified every reported defect and the key changed sentences, and applied one common standard to all packages. Carriage dispositions are accepted history under A19; where a move/promote label no longer matches rewritten target text it is recorded as an observation, not scored.
Material: 25 retained approved rows (all in proposals/team-communication-protocol-v1.md, shard s2-agent-coordination-truth-judgment) plus the 74 other derived rows named in the request (22 pending target rebinds, 50 failed exact proofs, 2 retired successors).

## Result

- 25/25 witnesses confirmed: the stored target digest has exactly one match in the current file, equal heading ancestry (and equal ancestry at the pre-correction tree), only the ordinal anchor moved; the shown unit text and ancestry are unchanged; the prior approval pins a genuine committed independent report (the report row says ok with the same source and target digests and the same reviewer header; the report blob is identical at its first commit and at HEAD). No fresh approval is invented here.
- 22 pending rebinds confirmed: for each, the stored digest of the old target text has no match in the current file (it had one before the correction), so text changed and the row is pending with the approval fields removed.
- 50 failed exact proofs confirmed: classifyExactCarry recomputed independently gives the author's class and reason for every row (45 document exact share below one half: rubric 46 of 95 units exact = 0.484; 5 no target digest match). All 435 other script-exact rows in the six exact shards still prove Unit-exact at the pack commit, so no stale exact approval remains.
- 2 retired candidate successors confirmed pending A13-shaped supersede rows (see review-2-truth-fix-retired.md).
- Derived total 25+22+50+2 = 99; nothing outside the listed rows was touched in the accounted shards by this review's recomputation.

## Unchanged ordinal binding witnesses (25)

| Claim | Finding | Source digest | Target digest | Anchor | Pinned report |
|---|---|---|---|---|---|
| claim_57f26b5acbd6bb500ca353f84f486488 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 | 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 | unheaded-block-41 -> unheaded-block-42 | review-2-truth-files.md@947f6169e |
| claim_78524c36c6f57c543377be47620d748c | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 | unheaded-block-42 -> unheaded-block-43 | review-2-truth-files.md@947f6169e |
| claim_242208b542d4bb24c84796f43f775d4a | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 | 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 | unheaded-block-43 -> unheaded-block-44 | review-2-truth-files.md@947f6169e |
| claim_88cf23510b37d2048b1a578efc2ebb10 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 | 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 | unheaded-block-44 -> unheaded-block-45 | review-2-truth-files.md@947f6169e |
| claim_abb60eb206ce120877cc9c06f826ab57 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 | 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 | unheaded-block-45 -> unheaded-block-46 | review-2-truth-files.md@947f6169e |
| claim_a6f71d465ebccd696428b94ff6f664af | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 | 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 | unheaded-block-46 -> unheaded-block-47 | review-2-truth-files.md@947f6169e |
| claim_6b4789439adfb6eb3b05c85b7ed8f7e0 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 | f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 | unheaded-block-47 -> unheaded-block-48 | review-2-truth-files.md@947f6169e |
| claim_8b79ab2d01c7ce85912eb9f0a25bf3ea | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e | 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e | unheaded-block-49 -> unheaded-block-50 | review-2-truth-files.md@947f6169e |
| claim_e16b56644d520a0fe0a4cd6b40c2459a | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b | 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b | unheaded-block-50 -> unheaded-block-51 | review-2-truth-files.md@947f6169e |
| claim_a86887b78fbc23319db13f3bf4816dd8 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca | 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca | unheaded-block-51 -> unheaded-block-52 | review-2-truth-files.md@947f6169e |
| claim_fad0d749adc5ef611ee344c16b7c661e | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 | 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 | unheaded-block-52 -> unheaded-block-53 | review-2-truth-files.md@947f6169e |
| claim_f7388f36e2422375b8acf615e169e8c3 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a | dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a | unheaded-block-40 -> unheaded-block-41 | review-2-truth-files.md@947f6169e |
| claim_007ac529305107d794a6aa0752c8fa85 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 17e9dc29da21e0e2df5f6e5e004fbe6b74a1cc0c9d34284c1dcdddc41e3e048c | 17e9dc29da21e0e2df5f6e5e004fbe6b74a1cc0c9d34284c1dcdddc41e3e048c | unheaded-block-29 -> unheaded-block-30 | review-2-liveness-s2-agent-coordination-judgment-02.md@96a13ab21 |
| claim_9797e67aadf80be198afbc69817c9ea2 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 9ef607d56f86c6bc94be4ced0016146ed19fb944f589fc01ce349378ad84a384 | 9ef607d56f86c6bc94be4ced0016146ed19fb944f589fc01ce349378ad84a384 | unheaded-block-31 -> unheaded-block-32 | review-2-liveness-s2-agent-coordination-judgment-02.md@96a13ab21 |
| claim_d645da105a558068961c06e1d47aa9ee | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d | 5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d | unheaded-block-30 -> unheaded-block-31 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_50cc0ff73dabd1642950365f358125c2 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f | f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f | unheaded-block-34 -> unheaded-block-35 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_34284834ad2dd8f5a0fc5a924b8196a5 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a | 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a | unheaded-block-36 -> unheaded-block-37 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_b602d530010f3b2f66ef5485bbff5bcb | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269 | 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269 | unheaded-block-37 -> unheaded-block-38 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_c37da632abaadd051eff58492f71c8c7 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd | 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd | unheaded-block-38 -> unheaded-block-39 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_c52e0d7342545a9365e507c17a99e946 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f | d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f | unheaded-block-39 -> unheaded-block-40 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_f4f513bfd7ca5fd9708005243a624f95 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3 | 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3 | unheaded-block-53 -> unheaded-block-54 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_b165c6ca3702ce5335599867e447ae55 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f | 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f | unheaded-block-54 -> unheaded-block-55 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_8b6511ceef7788eaaecfbe1c17de0ccf | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264 | 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264 | unheaded-block-55 -> unheaded-block-56 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_033a7b790516e8618c276525412173f8 | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5 | 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5 | unheaded-block-58 -> unheaded-block-59 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |
| claim_6ed12fe83f43ad052bbcde7a88beee1d | confirmed: unique current match (new 1, old 1), equal ancestry, shown text unchanged; pinned report row ok with equal digests | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae | unheaded-block-59 -> unheaded-block-60 | review-2-liveness-s2-agent-coordination-exact-04.md@96a13ab21 |

## Pending target rebinds (22): stored digest absent from the current file, pending, no approval carried

| Claim | Target | Stored digest no longer present | Rebound anchor | Approval fields left |
|---|---|---|---|---|
| claim_7c56791bc2955ef63687b7134d2cd053 | architecture/dispatch-control-plane.md | yes (current matches 0, pre-correction matches 1) | component-internal-ownership -> component-internal-ownership | none |
| claim_3430135237f992f3c212eab86eb77067 | contracts/assignment-run-runresult.md | yes (current matches 0, pre-correction matches 1) | dispatch-operability-addendum -> dispatch-operability-addendum | none |
| claim_ab182560a5142f22e010e35a97b115dc | architecture/dispatch-control-plane.md | yes (current matches 0, pre-correction matches 1) | routing-identities -> routing-identities | none |
| claim_194da7d0a9b40e6ba93d40df2b58eaec | architecture/dispatch-control-plane.md | yes (current matches 0, pre-correction matches 1) | component-internal-ownership -> component-internal-ownership | none |
| claim_06019161f3eadb87a1a6fe714da0d8e6 | architecture/executor-health-and-fallback.md | yes (current matches 0, pre-correction matches 1) | 2-production-ladder-semantics -> 2-production-ladder-semantics | none |
| claim_a30e0ef293a9486cb916f09f5e245e6a | contracts/assignment-run-runresult.md | yes (current matches 0, pre-correction matches 1) | dispatch-operability-addendum -> dispatch-operability-addendum | none |
| claim_01a4127478b48d367f29f82a84b96736 | contracts/assignment-run-runresult.md | yes (current matches 0, pre-correction matches 1) | dispatch-operability-addendum -> dispatch-operability-addendum | none |
| claim_28c4a9baff6ea75b287aa8dba3ed8328 | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | 62-selector -> 62-selector | none |
| claim_23a302d963323aa22a6a9e8ff35aad4e | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | 72-policy-resolution-before-dispatchplan -> 72-policy-resolution-before-dispatchplan | none |
| claim_03bcf93f2a1eb641d2b4681160a35ce8 | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | 73-recommended-v1-provider-policy-for-coding-feature-flow -> 73-recommended-v1-provider-policy-for-coding-feature-flow | none |
| claim_74bb68261a023f96104ac9591bdddd6f | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | 73-recommended-v1-provider-policy-for-coding-feature-flow -> 73-recommended-v1-provider-policy-for-coding-feature-flow | none |
| claim_8e13ccc24f4c4a1a1b985b629e0e3fc3 | playbooks/architecture-advisory-role-doctrine.md | yes (current matches 0, pre-correction matches 1) | how-to-read-this -> how-to-read-this | none |
| claim_724c421fcb01a0bb978e646aed6b6406 | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | 62-selector -> 62-selector | none |
| claim_2ef5d353dab2d57f38906df73e709125 | proposals/team-communication-protocol-v1.md | yes (current matches 0, pre-correction matches 1) | 8-runresult-confidence -> 8-runresult-confidence | none |
| claim_11d149c1655503f91604b77b40e6a381 | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-63 -> unheaded-block-63 | none |
| claim_5eef231348dcdc9566a29285fce97d59 | proposals/dispatch-control-plane-redesign.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-64 -> unheaded-block-64 | none |
| claim_9431e63ec3fc3f89927e22abc8f14a91 | architecture/protocol-model.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-17 -> unheaded-block-17 | none |
| claim_c0ec44efc62ae8bbbf2c114f387739f5 | architecture/runtime-recovery-design.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-12 -> unheaded-block-12 | none |
| claim_1838df5e7c81c1fa79b336008e3b94bd | proposals/team-communication-protocol-v1.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-28 -> 7-agent-result-schema | none |
| claim_1c155ab462849e3ec4136ee9fa08a218 | proposals/team-communication-protocol-v1.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-35 -> unheaded-block-36 | none |
| claim_1053b6e0b639f5a2970343078b6e04fe | architecture/protocol-model.md | yes (current matches 0, pre-correction matches 1) | domain-augmentation -> domain-augmentation | none |
| claim_f0435011b158171bddbfd8053eb545be | architecture/runtime-recovery-design.md | yes (current matches 0, pre-correction matches 1) | unheaded-block-19 -> unheaded-block-19 | none |

## Failed exact proofs (50): demoted to pending manual review

| Claim | Source | Recomputed class | Reason |
|---|---|---|---|
| claim_fb0f85ad508f7f857ba4c0963879790a | unheaded-block-49 | Judgment | no target digest match (recomputed equal, target digest matches 0) |
| claim_234cfe4ee6319f76a699a920567daac2 | unheaded-block-51 | Judgment | no target digest match (recomputed equal, target digest matches 0) |
| claim_8c81cb12fcc0ff0408e9b5bb594cb1dc | unheaded-block-53 | Judgment | no target digest match (recomputed equal, target digest matches 0) |
| claim_0b93b00d9997cfc522b58c1c23c32e13 | unheaded-block-3 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_33c31ee80317cab62b0a67e2175b11c4 | unheaded-block-4 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_6819e349258c39b7bc588684ccffbeeb | unheaded-block-5 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_cfddaf4b23e373c8df008820e1039ef1 | unheaded-block-6 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_6e9fec30d912d2117dd60e3c97167af3 | unheaded-block-7 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_8be0c987b2b5938bde70a1bfb729697b | unheaded-block-11 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_66efdc615e979445ad3f85c897f53c81 | unheaded-block-12 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_66b8226725e683f52e41d5c597a30eda | unheaded-block-14 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_ea25ab4f530bd1f4c75ebd6035c25722 | unheaded-block-16 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_704be6b4082d38aaab90bd64bd564377 | unheaded-block-17 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_0249a02773059932f5a259a140fa4e27 | unheaded-block-20 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_dfb68fbaa7c62913ba4e9796875daca2 | unheaded-block-21 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_e28475efc6bae6a85c417aa7dc0b7de9 | unheaded-block-23 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_2e6406d2e7c7cbb0ac0e31a1ef22ddf7 | unheaded-block-25 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_f20003299bba9e342d80ae5e4afc0374 | unheaded-block-26 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_f0e656b4f18fd7ff9bd0ef8f4e424783 | unheaded-block-27 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_6268e576ecc66d8ca659d3ab43d3c246 | unheaded-block-28 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_2a888651a79e955c536b3ede362aaf01 | unheaded-block-30 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_5052319046aa4f42d387388996acb446 | unheaded-block-31 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_253fc0ba932a9713c024a202caa532df | unheaded-block-32 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_bc9125989f9d7de4625c7d8f45e3135b | unheaded-block-33 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_ac1f844239a51859c77c0270265120b6 | unheaded-block-35 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_5871e754e0a8cdddf95c4e17dbb963be | unheaded-block-36 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_1d8c785a4f460098ebe3b148f6efcea9 | unheaded-block-37 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_58f7ad23b121d8888f33b8cd3d2d4fc0 | unheaded-block-38 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_b92b91d896acc8e12cab661f32b82ec1 | unheaded-block-41 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_f7c0aa553e9100dbf3647b7e4957130e | unheaded-block-42 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_b565eca9e1cf36dac6b27e59ae090435 | unheaded-block-43 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_76aa81473d09688fc99edeb78b4200a2 | unheaded-block-45 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_87eb6f1855000fbe6716641a538751f2 | unheaded-block-46 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_45f6b33db66126c89c387d282432b588 | unheaded-block-47 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_819e886f021031f89a3f30e8c7d48f36 | unheaded-block-48 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_83408164d5b5b2b16d029d5d23a401fc | unheaded-block-49 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_b36c9a2774a560c9770ea76cac370981 | unheaded-block-51 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_75a159feeaecad3b083187df1ee065bb | unheaded-block-52 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_ee1436df8e38efc584bc20fd458e0ed9 | unheaded-block-53 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_2c1c075bf865ad25f689a7bcff5a5ae1 | unheaded-block-67 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_76d46bb8fbb8b5a54c06eb7f5ec5a6d5 | unheaded-block-68 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_3c83721357bc53cfbbd07bc74ed08855 | unheaded-block-69 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_046a56df8bafa56b39da741a0ded8235 | unheaded-block-70 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_237467a67a081ab1728facf6b17e1cd4 | unheaded-block-72 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_ea510114882c12807ce28686d0365332 | unheaded-block-73 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_aeca3cda9965168aa5eb28c3b9685a03 | unheaded-block-74 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_2355b0c098803869b71a5bba7b20a0a0 | unheaded-block-75 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_cf44ea69b1d788b6a9febc3504c075f1 | unheaded-block-76 | Weak-exact | document exact share below one half (recomputed equal, target digest matches 1) |
| claim_925b901f329f4bbe1a1246ea428c4794 | what-this-rubric-deliberately-does-not-measure | Judgment | no target digest match (recomputed equal, target digest matches 0) |
| claim_a3c5dcace145e25b55eeb9dca7a8221e | unheaded-block-77 | Judgment | no target digest match (recomputed equal, target digest matches 0) |

## Retired candidate successors (2)

- claim_69b011aac8a371496f54e1c681286bfd and claim_424bbeb8e8fe53a80b03440fb53ae248: pending supersede, A13 shape, listed in review-2-truth-fix-retired.md with source snapshot at a4e132ccd.
