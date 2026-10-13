# Main merge follow-up review

Reviewer: reviewer:claude-session:4df9e88c@2026-10-13
Author session: codex-session:1@2026-10-11
Receipt commit: a1fd2136a16dce642cc202a10b585efcf040fd3b
Review mode: ordinary
Pack commit: c112078b8

Scope: the A31 combined follow-up in review-request-2-main-merge.md only. That means the 39 evidence-only re-pins and the 7 newly live legacy-source identities. Not reviewed: code truth, the 134 changed-code receipts (they stay candidate-unverified under A31), and the 52 rows already accepted at cf5c64ce6. Verdicts: re-pins ok 39 of 39; legacy sources ok 7, rework 0, hold 0.

## Re-pin check

Method. I wrote a separate verifier and did not use the author's script. It reads the original receipts at 2269f2d27 (candidate-classifications-agent-coordination-recovery.json) and the re-pinned receipts at a1fd2136a (candidate-classifications-agent-coordination-main-repin.json), and checks each receipt as follows:
- Every field except currentEvidence is deep-equal to the original receipt.
- The evidence commit is f4ed59997.
- Each citation keeps its path, and its new blobSha equals the blob at f4ed59997 for that path.
- When the blob changed, the old line range of the old blob is byte-equal to the new line range of the new blob. When the blob is unchanged, the lines did not move.
- Every other evidence field is deep-equal after the pin fields are blanked.
- shownTextDigest is the sha256 of shownText.
- The original projection row in review-2-registry-projection.md (dd1fe8d80) is ok.
- The evidence digest is sha256(JSON.stringify(currentEvidence)), and it equals the template.

Result: 39 of 39 pass. 9 have unchanged line ranges and 30 have shifted ranges, across 51 changed citations. For 7 heading units the unit digest is not the shown-text digest, because the shown text is the whole section; this is the same pairing the projection review accepted. These are evidence pins only: they do not re-review whether the shown text is true.

| Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest |
|---|---|---|---|---|---|---|
| claim_e134b71a09a0a8fd7c62eef87959daf4 | candidate-native-content | ok | 45eb2c3f056d30141e5d53b6c349a7b8d46092bfc87346e0b2dd841f8b2081b9 | 45eb2c3f056d30141e5d53b6c349a7b8d46092bfc87346e0b2dd841f8b2081b9 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 30d26757edc2271e938dade5bd919972c17ace71ee74986f320764718f9d5a98 |
| claim_c7c1506a1c8d6e7bfe85935c0868d924 | candidate-native-content | ok | 76d215590439cb81c3b2cf2c436f9232b4e67a3670186038b25c43c774f80d0b | 76d215590439cb81c3b2cf2c436f9232b4e67a3670186038b25c43c774f80d0b | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 30d26757edc2271e938dade5bd919972c17ace71ee74986f320764718f9d5a98 |
| claim_95d630cee33a4aee7d6a44e1e0a3c4a9 | candidate-native-content | ok | 35ebb378e8d447d5f996404dad8eec4626b4f00311d2221a450ee6eb418c21ad | 35ebb378e8d447d5f996404dad8eec4626b4f00311d2221a450ee6eb418c21ad | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 30d26757edc2271e938dade5bd919972c17ace71ee74986f320764718f9d5a98 |
| claim_7731fbd40c6c0d51f94c7e55b93c0925 | candidate-native-content | ok | eaec6dc020fab8b2c62e171dce457ad67da1e92ed6d7310280c9a18593db508e | eaec6dc020fab8b2c62e171dce457ad67da1e92ed6d7310280c9a18593db508e | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 30d26757edc2271e938dade5bd919972c17ace71ee74986f320764718f9d5a98 |
| claim_4ec4e0906acc7fb09ca51129030e7230 | candidate-native-content | ok | dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785 | dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785 | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | ac2ecf2525f139f0443ca5d4a8abc4bda8338f49250cd8c5e152a81d94e5ef83 |
| claim_c38104d8972032b3b20db9bca5321871 | candidate-native-content | ok | f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be | f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | ac2ecf2525f139f0443ca5d4a8abc4bda8338f49250cd8c5e152a81d94e5ef83 |
| claim_3c55901c64cdf2f99a36062302427fcb | candidate-native-content | ok | 40e8420ecedfdc8389c27e6a3e7b8446da8062301b6a306fd601f59de579c8fd | d6dfa94679cf29d1dc8f8f53e24f9560ed39967f74c7d05120b737507bad33f7 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 68b1b516d35a883f8b2d0ace20e7906c906b5aed94e2d27dfbdfe7c594949f9d |
| claim_edf9b5d6a4118579e66fcdedf2a0e66a | candidate-native-content | ok | 36446e8234df1d9b71b5689bee83d41fa25dd3ef34eb8e6ea79c31641a74b4ad | 36446e8234df1d9b71b5689bee83d41fa25dd3ef34eb8e6ea79c31641a74b4ad | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 68b1b516d35a883f8b2d0ace20e7906c906b5aed94e2d27dfbdfe7c594949f9d |
| claim_c4ccebca77d2e1f1240fb4a3588803bd | candidate-native-content | ok | 92cf91fdafe6f647dcb2221e43f4ce687a88415b3a75437899771b413d16bcd6 | 92cf91fdafe6f647dcb2221e43f4ce687a88415b3a75437899771b413d16bcd6 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 68b1b516d35a883f8b2d0ace20e7906c906b5aed94e2d27dfbdfe7c594949f9d |
| claim_67592e838ebefa5d77fb98b4af14e367 | candidate-native-content | ok | b54abb5801b4e539ddd8dc29f1135d06a751a9833cd45a7fd27e72aff7b63cd6 | 097936745e3bd24722d05d5c02697903f13d2e8a95e1e7c7cee804833dfdaf68 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | aa2dc1049cdbf8550b482f7a47c8b22b1988843fb207e678dbebf35961b8bc15 |
| claim_eb8aa75ad4ff996ab1f5f477c6bbb630 | candidate-native-content | ok | fdec51c73bc036c0e680a60d482fb1ecc9e81e0b092639d33b9e5974833f1ad4 | fdec51c73bc036c0e680a60d482fb1ecc9e81e0b092639d33b9e5974833f1ad4 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 60eb7f737cda5bcba9119e264c03ced168ae08dc0984e2bbff4af2ca78915349 |
| claim_260feeee6a60be662bdda8b9b7666412 | candidate-native-content | ok | 716b58c5f151140195596e7539a793527c003faf50948f0fb0193233398f1d92 | 716b58c5f151140195596e7539a793527c003faf50948f0fb0193233398f1d92 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 60eb7f737cda5bcba9119e264c03ced168ae08dc0984e2bbff4af2ca78915349 |
| claim_6b9d77ea4dcd08cde0c9003939ebc000 | candidate-native-content | ok | 27ed3816193e24b624b27dc8db157ce4b0becb3b6647ae1604414ea1e44b35e1 | 27ed3816193e24b624b27dc8db157ce4b0becb3b6647ae1604414ea1e44b35e1 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | cfd02c99b65ecfbe449acad4c1760a025b2c54849f819adae06f4c74892ae94e |
| claim_d375b290e2ac560a3ea02781d5715e7b | candidate-native-content | ok | d4d6dd64727d26d9281be53d026bb9158f9e3a28661cd019f7af6232ba23e57b | d4d6dd64727d26d9281be53d026bb9158f9e3a28661cd019f7af6232ba23e57b | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | ce56447fa14d507148e617c947deef69635be31a86f54f207339849805af647b |
| claim_c7d3e8ef6acdffb1b08e61d5b5bd4d9a | candidate-native-content | ok | 8305af07b5cc1dfb4abafe35643b56651fee378610fe1722422cafde6213fb65 | 8305af07b5cc1dfb4abafe35643b56651fee378610fe1722422cafde6213fb65 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 8c430390cf8cd3be7928233a20a043d7cba5f8b974a8f89440de8fc2e383b7a0 |
| claim_456ad50a7253122ec3610059e0779e03 | candidate-native-content | ok | 9fe7fb81663c9b4a1776063cb5507a962b567dfeb4abfc56cf9568bfb82f9e09 | 9fe7fb81663c9b4a1776063cb5507a962b567dfeb4abfc56cf9568bfb82f9e09 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 8c430390cf8cd3be7928233a20a043d7cba5f8b974a8f89440de8fc2e383b7a0 |
| claim_59f6314467565caef24f13c7338a59be | candidate-native-content | ok | fdf16c7b6c6e97fb86f217bd1c120f4eaaaa2b7b3f94eafe45b19952f6240c21 | fdf16c7b6c6e97fb86f217bd1c120f4eaaaa2b7b3f94eafe45b19952f6240c21 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_041ac1009b965096340a81e9c4503cdc | candidate-native-content | ok | de49f21a79c2e1210ce53e02a812a1543bebc2c44330ee9bb80b3ac90c957f5c | de49f21a79c2e1210ce53e02a812a1543bebc2c44330ee9bb80b3ac90c957f5c | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_da2ae48948793578312ac28653ea94a1 | candidate-native-content | ok | fd7534633ff32b3b169a69223159dae4a84f85f6e60e7a5c47e9f582678c63e2 | fd7534633ff32b3b169a69223159dae4a84f85f6e60e7a5c47e9f582678c63e2 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_322d2c6df8da103a227d25767f5db2dd | candidate-native-content | ok | 92b7fc3962d8526dffe7d9828551775e3475c88042d386d34e125d9ef0bf663e | 92b7fc3962d8526dffe7d9828551775e3475c88042d386d34e125d9ef0bf663e | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_1566bd6207fd7d92e2df1af41f8d6282 | candidate-native-content | ok | 56204f37d31709c9f12dae208cf709ee21a707c9d8c79bc959832227fcbe079a | 56204f37d31709c9f12dae208cf709ee21a707c9d8c79bc959832227fcbe079a | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_92334b1c898f23a57c6d60f3c737f4d9 | candidate-native-content | ok | 1aa07833512c49fad7980356d992800a57bf2bac63398a662f1b5b595e3bf3d5 | 1aa07833512c49fad7980356d992800a57bf2bac63398a662f1b5b595e3bf3d5 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_2d967da655fb640e62cbbc74cc394b89 | candidate-native-content | ok | 9251008d29a480cf3aa8ff30eb72389256c4963c7e7677e1f075f55256f0c0de | 9251008d29a480cf3aa8ff30eb72389256c4963c7e7677e1f075f55256f0c0de | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_ce9cf7041e0794dd190740863312964a | candidate-native-content | ok | 5e464682f0c67ba75942629eaf249ac37f2273e88fdf76b79c6e3510fd684698 | 5e464682f0c67ba75942629eaf249ac37f2273e88fdf76b79c6e3510fd684698 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | b720c76266c0f2c0a64c3d70b5ad3a26862dddace876798b7ee59fc5feb586f4 |
| claim_9e78656a9656a956d8d18436eb513951 | candidate-native-content | ok | 0f92ff45e3f725fe4903ac850e30385d1199d6278c8a8ec2afd54232cce813bd | e98157308c83f0bd05e096838a8a7127087b57f0be4f3be32e1a91fc8d024c33 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | f1bc068d0bf2aeeae55aab29e8c1a98fb3c108a79abaecdcba5a771f3c8f20d6 |
| claim_25a8cfce7bd6938196e6b4ef2e4c02d9 | candidate-native-content | ok | 71a2d0b002b69d549be7a107e175e1dd8c54903c28734e84dbf75218eb5319de | 71a2d0b002b69d549be7a107e175e1dd8c54903c28734e84dbf75218eb5319de | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | f1bc068d0bf2aeeae55aab29e8c1a98fb3c108a79abaecdcba5a771f3c8f20d6 |
| claim_9950fd6826b0086a4413fdb3d1834075 | candidate-native-content | ok | c91b14b9a4ae7b59bba753d6cb386d9d883a3ddd59a3abcd0da593e34d1c6029 | 25391265a6f3b3016c824d8719c913fb1ebb17538de38a49cb13dc91c524e564 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 4745dab380cba20138be6aa4bfef1ca1e71fec3be5e16635ef21e59742aadd94 |
| claim_a8344e1a43226394f04114d9f4270ce2 | candidate-native-content | ok | 0e13876e4a761e17e1a93c5a254d556e8dddabefcd233e548e78bbf825030604 | 0e13876e4a761e17e1a93c5a254d556e8dddabefcd233e548e78bbf825030604 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 4745dab380cba20138be6aa4bfef1ca1e71fec3be5e16635ef21e59742aadd94 |
| claim_5a220e0966cb9c6872f42b471150726b | candidate-native-content | ok | 5622c06276f32ad74efed999035410c8d752835bbe3f671d5ac3368f4555384c | 860625505af248f5e4da75b5c8abbf0ca2d3732123931ab1947a70daa834164a | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | a08ea736137370d16e24cf2a529a977281035c6c46df620f89cd3e6933ae01fa |
| claim_1a0fd8e46885b7343da2f7c6cae17f2d | candidate-native-content | ok | 997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237 | 997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237 | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | a08ea736137370d16e24cf2a529a977281035c6c46df620f89cd3e6933ae01fa |
| claim_c080b888b647a84ccf899f6d715b0832 | candidate-native-content | ok | 9dd0abd09deade74c19beda55a72aa00dee88305e83b66fc6ef2f6e9b3c568fc | 9dd0abd09deade74c19beda55a72aa00dee88305e83b66fc6ef2f6e9b3c568fc | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 3ae6f1033ed1dabacd9fbd97e30899129289a7cb3422f7fe18fc9f21a6da994f |
| claim_2c7ca6512f1870baa15c6be84b52c0eb | candidate-native-content | ok | ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56 | ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56 | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | 2a87bdcc623b6b21f86af56b2cb62126c8875d5bce7414df56e6cfc11c994ac1 |
| claim_1c0c3cdd5486263d84af20ce969ece4c | candidate-native-content | ok | ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0 | ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0 | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | 2a87bdcc623b6b21f86af56b2cb62126c8875d5bce7414df56e6cfc11c994ac1 |
| claim_4b558ff641410c3268750f6261d1fc44 | candidate-native-content | ok | 39b03335c44fcb778cf7ee00cf3266ebf92a333145f6ef7c5b976630bb945445 | 39b03335c44fcb778cf7ee00cf3266ebf92a333145f6ef7c5b976630bb945445 | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | f5657c57d04e88860fb9c5f4585cf9ccc98bb3ba9ab80287aca9dd931b981df4 |
| claim_013abd94027531328ddccf8b8ea8a056 | candidate-native-content | ok | 9f86c10b3db679c6b1e77b8adbe126822d323fa1b106dcf3b90a6d8bf4e1a68f | 9f86c10b3db679c6b1e77b8adbe126822d323fa1b106dcf3b90a6d8bf4e1a68f | evidence re-pin to f4ed59997; cited lines shifted, cited bytes equal, other receipt fields equal; no truth re-review | 1b4b4e069cb49757b63b078bc5e32b99829e2a6cf8a2e22a9e7bd3a8a7296422 |
| claim_0605d63a7150fccffd52a88a25b08b36 | candidate-native-content | ok | eac723e36bcb6926e0680aaf014a1403ef242dd5daf271173e8c1421d30c6f0c | f5158f85b1bfec08a7cebc60639820e8e65d59f8f73290fe9861001ce6fd165b | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | b82dcf578e60aa19084afbac88e6946aea6ce18721ffda694adde9eacebc03c3 |
| claim_a2a8446112a1203bd413ab67e787ac52 | candidate-native-content | ok | 196b1ff54d776e4ff08ce7f645dbdf2224eb15fdb01bbb16f6d10c42526b2b67 | 196b1ff54d776e4ff08ce7f645dbdf2224eb15fdb01bbb16f6d10c42526b2b67 | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | b82dcf578e60aa19084afbac88e6946aea6ce18721ffda694adde9eacebc03c3 |
| claim_6bfeb31815aec16a77273fcc7d7a2af4 | candidate-native-content | ok | 880c39ba956eea4e56074fa44cb88a6c771452f58d9bfa0404834d63f40ee470 | bfd0de71c4c8d55d7859fb955fdf4bdf63e468cf2ca6a8f092ed4a7c8a35a86d | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | 6ecaadfe139723a732e783af864efa8a310dbb12c87b215c801878f13e4dd5f4 |
| claim_58b4cd24ec90b542b6099676b59ee117 | candidate-native-content | ok | fa955fd843b1e5476c55fa41c58ce988c9a2ed21d12405880b77767052038fdf | fa955fd843b1e5476c55fa41c58ce988c9a2ed21d12405880b77767052038fdf | evidence re-pin to f4ed59997; cited lines unchanged, cited bytes equal, other receipt fields equal; no truth re-review | 6ecaadfe139723a732e783af864efa8a310dbb12c87b215c801878f13e4dd5f4 |

## Seven legacy-source identities

Method. An in-process reviewer recomputed every source and target digest with extractMarkdownConservationUnits over both files at HEAD. Each digest maps to exactly one unit, and the two move pairs have equal digests. The reviewer then read every source statement against the target section. The test was conservation only: each statement is either carried or explicitly replaced by the candidate Workflow/preset contract. Implementation truth was not judged.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_550a2c60d3f044caa3540341697a88a7 | ok | Decision carries fgos-advise owning routing and handing a named Workflow or preset to fgos-group-thinking; the old execution-door and pack wording is replaced by not a current protocol-pack gate; no private execution path is carried. | f36f565d7adbf19091e7de525bca211dd6f45f7fa10caf704f11c6f211c6c67a | cdb22d6a5f42ae3a58e87493b0d7828e1f364ce9b0ddc43835a91f94264e988b |
| claim_3996ecc3d148fff06ead0332614567d3 | ok | The caveat that the audit table predates fgos-panel, now fgos-advise, is carried by the Baseline UX audit opening sentence with added historical qualifiers. | 9d2872c42475ac943dd19feb5f488a3fbb862771f1b3f7af4e6279002cd576a9 | 4ca30eb078631d99f2559bb221ecd5f6ac3f302c67c4ec61232c20b0e1fe91d4 |
| claim_7cac83d6593ca533fed2df39bd60c46c | ok | Ten of twelve audit rows are carried verbatim in order; the direct coordination run/show row is replaced by a historical row and the coding decision panel row by routing to fgos-run. | 3c495e4af0b84afab995afc2de9b6ada30c65f7557cb2e6f4934f0b5a034024a | 4ca30eb078631d99f2559bb221ecd5f6ac3f302c67c4ec61232c20b0e1fe91d4 |
| claim_0893be1de04c49bd33bdfc9a98df6d89 | ok | Move with equal digests; the vocabulary table is identical, including the panel row naming fgos-advise. | 2f3aed1c2c86a1e39301d385bcc233d7b4d1f2a6f7d316b655356e3d6ba26b00 | 2f3aed1c2c86a1e39301d385bcc233d7b4d1f2a6f7d316b655356e3d6ba26b00 |
| claim_58560c392f9b61dd94d592f0cb4a75d8 | ok | Move with equal digests; the pointer paragraph to request-kinds-and-routes.md and the fgos-advise skill is identical with its links. | b7c8760c894fef840cef9630c446a32f9ebcd8b838d6b82676968f2eb3d5a0e7 | b7c8760c894fef840cef9630c446a32f9ebcd8b838d6b82676968f2eb3d5a0e7 |
| claim_8f632c41e8a069dbfdfa1ea31994f14e | ok | Advise, architecture-panel and group-thinking rows are carried by the Entry-point choice first sentence; the code-panel row is replaced by fgos-run, and the coordination run/show and replay rows by retired doors not current with status by Workflow run id. | 3baa56c939fd599e8a11bed83f1905ea7ceb71f256dd85baefef70c0a29b3e29 | f9a3e8adf40d2ed782b6be16bcfe024b92a46769b35b36c03a3c5cfa984b0b96 |
| claim_cb0fc46cc04ed129b871f1c2a44fcb61 | ok | Heading and section body reviewed whole: one entrypoint and canonical table are carried; delegation to the pack gate and registered protocol is replaced by Workflow and CollaborationPattern owners keeping execution semantics; specialist skills remain via Alternatives C. | f460307c43635265a3b8a96c354440c606355d99b4d27a9da6d079a4bff00c1a | bb1ae7699ab58ef15b7ea30bf4d78b57cdd8eb69b9a4ef6a7713e83e50f9eb3c |

Non-blocking notes:
- claim_550a2c60: the candidate does not repeat the explicit "no CLI verb, protocol or capability is added" verbatim. Its Decision and Forbidden coupling sections carry the same meaning ("no private execution path", "must not manufacture a capability"), and the earlier review accepted that wording at cf5c64ce6. Optional: add one sentence at promotion.
- claim_cb0fc46c: the pack shows only the heading line in source.text, but the heading digest also covers the section body. The verdict covers the whole section. Future packs should show the section text for heading sources.
- claim_3996ecc3 and claim_7cac83d6 bind to the same target heading digest, so the rationale has to name the section.

## Verifier source

Run with node from any directory; it reads only the committed objects named above.

```js
// Independent check of evidence-only receipt re-pins: cited code bytes unchanged,
// every non-evidence field identical, new blobs equal the merge tree.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const WT = '/home/vantt/projects/forgentX-phase00-documentation-authority-unification';
const L = 'plans/260925-documentation-authority-unification/ledger';
const ORIG = '2269f2d2790f5bcef0a9ea4838cf27954619feda';
const REPIN = 'a1fd2136a16dce642cc202a10b585efcf040fd3b';
const MERGE = 'f4ed59997325b7bbe94ba38df16d66ab20d9251e';
const PROJ_REPORT = 'dd1fe8d808aa60d559722b4c604acaff1894837c';
const git = (...a) => execFileSync('git', ['-C', WT, ...a], { maxBuffer: 1 << 30 }).toString();
const sha = (s) => createHash('sha256').update(s).digest('hex');
const show = (c, p) => JSON.parse(git('show', `${c}:${p}`));
const lines = (blob, s, e) => git('cat-file', 'blob', blob).split('\n').slice(s - 1, e).join('\n');

const orig = show(ORIG, `${L}/candidate-classifications-agent-coordination-recovery.json`);
const rep = show(REPIN, `${L}/candidate-classifications-agent-coordination-main-repin.json`);
const origById = new Map(orig.receipts.map((r) => [r.claimId, r]));
const projReport = git('show', `${PROJ_REPORT}:plans/260925-documentation-authority-unification/reports/phase-06/review-2-registry-projection.md`);
const sidecar = JSON.parse(git('show', 'HEAD:plans/260925-documentation-authority-unification/reports/phase-06/review-request-2-main-merge.md.json')).a31Followup;
const tmpl = new Map(sidecar.classificationTemplateRows.map((r) => [r.claimId, r]));

const results = [];
let sameLines = 0, shifted = 0, changedCites = 0;
for (const r of rep.receipts) {
  const errs = [];
  const o = origById.get(r.claimId);
  if (!o) { results.push({ claimId: r.claimId, errs: ['no original'] }); continue; }
  const strip = (x) => { const c = structuredClone(x); delete c.currentEvidence; return c; };
  if (JSON.stringify(strip(o)) !== JSON.stringify(strip(r))) errs.push('non-evidence fields differ');
  const oe = structuredClone(o.currentEvidence), ne = structuredClone(r.currentEvidence);
  if (ne.commit !== MERGE) errs.push('evidence commit not merge');
  if (oe.citations.length !== ne.citations.length) errs.push('citation count differs');
  let anyShift = false;
  ne.citations.forEach((nc, i) => {
    const oc = oe.citations[i];
    if (oc.path !== nc.path) errs.push(`path differs ${i}`);
    const treeBlob = git('rev-parse', `${MERGE}:${nc.path}`).trim();
    if (treeBlob !== nc.blobSha) errs.push(`blob not merge tree ${nc.path}`);
    if (oc.blobSha !== nc.blobSha) {
      changedCites++;
      const before = lines(oc.blobSha, oc.startLine, oc.endLine);
      const after = lines(nc.blobSha, nc.startLine, nc.endLine);
      if (before !== after) errs.push(`excerpt differs ${nc.path}`);
      if (oc.startLine !== nc.startLine || oc.endLine !== nc.endLine) anyShift = true;
    } else if (oc.startLine !== nc.startLine || oc.endLine !== nc.endLine) errs.push('lines moved on same blob');
    // restore pin fields and require the rest of the citation equal
    oe.citations[i] = { ...oc, startLine: 0, endLine: 0, blobSha: '' };
    ne.citations[i] = { ...nc, startLine: 0, endLine: 0, blobSha: '' };
  });
  oe.commit = ne.commit = '';
  if (JSON.stringify(oe) !== JSON.stringify(ne)) errs.push('other evidence fields differ');
  anyShift ? shifted++ : sameLines++;
  if (sha(r.shownText) !== r.shownTextDigest) errs.push('shownTextDigest');
  if (r.unitDigest !== r.shownTextDigest) errs.push('unit != shown');
  const projRow = projReport.split('\n').find((l) => l.startsWith(`| ${r.claimId} |`));
  if (!projRow || projRow.split('|')[3].trim() !== 'ok') errs.push('original projection row not ok');
  const t = tmpl.get(r.claimId);
  const evd = sha(JSON.stringify(r.currentEvidence));
  if (!t || t.evidenceDigest !== evd || t.unitDigest !== r.unitDigest || t.shownTextDigest !== r.shownTextDigest || t.class !== r.class) errs.push('template mismatch');
  results.push({ claimId: r.claimId, class: r.class, unitDigest: r.unitDigest, shownTextDigest: r.shownTextDigest, evidenceDigest: evd, shifted: anyShift, errs });
}
const bad = results.filter((x) => x.errs.length);
const summary = { total: results.length, ok: results.length - bad.length, sameLines, shifted, changedCites, bad };
writeFileSync(new URL('./result.json', import.meta.url), JSON.stringify({ summary, results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
```
