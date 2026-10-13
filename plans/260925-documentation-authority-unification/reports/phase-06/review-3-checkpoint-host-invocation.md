# Step 3 checkpoint review: Host Invocation

Reviewer: reviewer:claude-session:4df9e88c@2026-10-13
Author session: codex-session:1@2026-10-11
Pack commit: 76353c58eb885becc550d734fde5d7c2709cce33
Pack id: 31d576a0a8e687a2268a6862cacb1b71d7ea0fb2a5426c12bfd7c7e6481d55a6
Seed score: 8fda89ebb85e6581f813c08f29335131c8b2fd62237949ca97551bf10b5ae0ba

Scope: review-request-261013-1311-host-invocation-checkpoint.md at 48195b2c2. The 431 source rows in ledger/decisions/s3-host-invocation-checkpoint.json, 16 restore groups, the dropped-010 flag, the two-member exception, the promoted diff and HI-I027, A28 truth sample, stratified invented-claim draw, checkpoint red-team. Fresh readers are not part of this report.

Verdicts: 431 rows (431 distinct): ok 417, rework 14.

Method. One reviewer session with in-process subagents.
- Rows: 356 rows split into six slices and read in full against the shown source and target text, with real files opened where context was needed.
- History rows: the 75 rows that move documentation-standardization-plan.md into history were checked by machine. Each source unit text was found verbatim in the history file, and the history file contains the whole legacy file byte-equal.
- Sensitivity: the seeded pack was generated with propose-doc-decisions.mjs --seed-pack under a private seed and answered blind by a subagent that never read the key. It was scored with --score-pack: 6 of 6 mutations caught, 0 of 24 false flags, pass. The pack, key, verdicts and score are in sensitivity-3-checkpoint-host-invocation/.
- Truth sample and invented-claim draw: seeded draws over the 601 current-content units (non-heading, at least 40 characters) in the 31 non-history candidate files.
- Red-team: red-team-3.md.

## Source rows

| Claim | Verdict | Note |
|---|---|---|
| claim_f2da6bf482131501faac8d716a4dcb44 | ok | H1 unit carried as H3 with status, date, revised line and dependency paragraph verbatim; only heading depth and link depths changed, and the kernel link now points to the platform spec. |
| claim_825ecbc106eb49b18701b0d68c204d22 | ok | Status/Date/Revised block verbatim; only the relative link gained one directory level. |
| claim_765685b7bf189a9f81cf2d5e671efde2 | ok | Dependency paragraph verbatim; kernel link retargeted to the platform spec, a legitimate resolved-link rewrite. |
| claim_4a49679c5f81a5e86ab79f533fcf3470 | ok | Migration Status Note carried verbatim with links resolved relative to the new location. See Concerns on its self-referential wording. |
| claim_72b068a205f5bdb963a0c90a64a51038 | ok | Note body verbatim; links rewritten to relative sibling paths that match the files in the worktree. |
| claim_af6831310fe9fcdaa7c8e69902e3c767 | rework | Rationale says the unit retains all wording, but the Core, Packaged-extension, mapping table and classification paragraphs are no longer in this unit. They sit literally fenced in release-boundaries.md under Restored class definitions (carried by sibling claims) and the unit holds only a labelled pointer. No claim is lost, but the rationale must say the body was split to that owner, and the pointer cites a nonexistent legacy path. |
| claim_77dded3a2079c1d8caf108207f16bf68 | ok | Sentence identical, in the same owner file. |
| claim_8afb754fa120109518a42e75a5a381ed | ok | Code block identical, same owner. |
| claim_28ec0a05e5b83caab05627b76795ac43 | ok | ProviderDescriptor sentence identical, same owner. |
| claim_d90840823918415e74ddd353dae32ea3 | ok | Core component definition verbatim at release-boundaries.md inside a literal fenced restoration block, with a Checked status note. Release-boundaries is a sound owner for class definitions. |
| claim_2ce14ab31e5b889ce37c4e99735c69e5 | ok | Packaged extension definition verbatim in the same restoration at release-boundaries.md. The rationale is more specific than the others. It mentions sidecar and atomic-versus-separate-artifact release, which this text does not contain, so it partly misdescribes the row. |
| claim_2449df5feff7fcfb17a45340a08ef7a9 | ok | User plugin definition verbatim, retained in the protocol document next to the pointer. |
| claim_95063c4b27e671f29631d4fd68427008 | ok | Three-row class/mechanism table verbatim in the fenced restoration at release-boundaries.md. |
| claim_bb84143c32c84b94257bfeb7ca6dacd2 | ok | Closing classification paragraph verbatim at release-boundaries.md. |
| claim_d5dd5fbdb3483914743a14791a5f02a8 | rework | Rationale claims all direct-unit wording is retained, but the Provider enum, Built-In, External Process, External WebAssembly and native-library paragraphs are absent from this unit. They moved to release-boundaries.md (enum and mechanisms) and the unit now has pointer lines citing component-protocol.md and release-boundaries.md legacy-style anchors. Text is conserved elsewhere, so only the rationale and the unavailable-reference pointers need correcting. |
| claim_3f7b5a5b5b1c39251e56f0d232e11ec3 | ok | Provider enum verbatim, wrapped in the literal restoration fence at release-boundaries.md. |
| claim_669c64d8e42de3025275c34b12b3aaa5 | ok | Enum disclaimer sentence verbatim; Legacy CLI Transition link resolves to the sibling file. |
| claim_962d99a375bab41c2063612523bdf348 | ok | Built-In paragraph verbatim in the restoration fence at release-boundaries.md. |
| claim_f2755ef85799b9a6ec4fd4f5d03e9106 | ok | External Process paragraph verbatim at release-boundaries.md. |
| claim_66ce4edf221963b22ad02dbdf872da1c | ok | External WebAssembly paragraph verbatim at release-boundaries.md. |
| claim_8948a9c62d80ce2692687f3fcfbaf8ff | ok | Native-dynamic-library paragraph verbatim at release-boundaries.md. |
| claim_6ac894a939b9efb6725758fd6c4eb039 | ok | Heading unit; the heading is carried in the component-protocol.md restoration and its body is carried by the next claim, so nothing is lost. |
| claim_f8dc56c8e292eacb0d186f5dd16b7e52 | ok | Same-process versus runtime-extension paragraph verbatim at component-protocol.md; the contract owner fits. |
| claim_d03d06ad4a63b00a87a934ab594587c9 | ok | Heading carried at component-protocol.md; its body is the next claim. |
| claim_db4217b66dba7e00b2af5d10624b795d | ok | Cross-process cost paragraph verbatim at component-protocol.md. |
| claim_8066684d5e7c7159d6f58caeef26d8cc | rework | Rationale says all unit wording is retained, but the transport-neutral sentence was moved to component-protocol.md and the unit holds a pointer to a nonexistent legacy anchor. The sentence is conserved by its own claim, so fix the rationale and the pointer. The rest of the section is verbatim. |
| claim_4ab5b8aa8fb1c32df6244b6c78a58a8e | ok | Component protocol versioning paragraph identical. |
| claim_05483c4fc63f856b045c5482b4e367d9 | ok | JSON-RPC length-prefixed framing paragraph identical. |
| claim_ff86ac2f6a77ac8383807091f62ffb4a | ok | Handshake paragraph identical. |
| claim_d36b9adbb7ef7eaf80a7cabbf3bd9a2b | ok | Lifecycle lead-in line identical. |
| claim_53f264f62d89d4bb82b2f8fe16f159ef | ok | All seven lifecycle rules identical. |
| claim_d1c4102dc6dea3ae86434fb12c0abf71 | ok | Transport-neutral sentence verbatim at component-protocol.md. The rationale correctly says a binary codec or local socket is future design only. |
| claim_dd05e638e2f559c3a1fa4d0b0df49eaa | ok | EncodedMessage lead-in identical. |
| claim_fc8c5a33cd65b0099fc07e731833c037 | ok | EncodedMessage struct identical. |
| claim_9a5781f0086209a17330035ff0e58638 | rework | Rationale says the unit retains all wording, but the registry-linker procedure paragraph, input/output lead-in and formula block moved to compatibility-harness.md. The unit holds a pointer to a nonexistent legacy anchor. Text is conserved by sibling claims, so fix the rationale and the pointer. |
| claim_7a761122f6ca753ec06390f4c45a3874 | ok | Data-first discovery sentence identical. |
| claim_6a33b8904ea382ebff720a5af6690880 | ok | manifest.yaml declaration paragraph identical. |
| claim_d391a391012d4582caf4ad2bbc04a3a5 | ok | Canonical filename and kind paragraph identical. |
| claim_db3ed4e42ea9ea6300ddb1e2e4154308 | ok | Registry-definition paragraph identical. |
| claim_08172f75766eb1d002d4cba2669f9bbd | ok | Registry linker procedure verbatim, fenced, in compatibility-harness.md under Restored registry linker procedure. The verification owner is plausible. |
| claim_7e15be77fb7c4bff223728491df3e212 | ok | Lead-in line carried verbatim in the same restoration. It is trivial text. |
| claim_0f401249972ad0ce465e24e0932a2834 | ok | Input/output formula verbatim in the same restoration block. |
| claim_11a0a710a684fc412dce19dba175ad54 | ok | Durable-input versus derived-cache paragraph identical. |
| claim_059863b5abc9b69746bb7df19fd8ecc4 | ok | Precedence, fail-closed and replacement paragraph identical. |
| claim_085be633814f3655a406c6a9c130d686 | ok | Namespace Rules heading plus body verbatim as H4. |
| claim_8639855f2f9ae8cb40b4988ddec9b3ba | ok | Namespace paragraph identical. |
| claim_28d176804d2f5580604186adabcfcf90 | ok | Related Documents heading and both bullets carried; links resolve to the spec and the sibling file. |
| claim_6fad9fd73c3cc8187ccf2d1687595234 | ok | Two bullets carried with correct link rewrites. |
| claim_7deac467807f8e5aa9de52228dee00e5 | ok | Heading, status block and kernel paragraph carried in the spec. The roadmap link target exists and has a matching Implementation Plan heading. |
| claim_0ad7cac649772e91b98de923b0e597e0 | ok | Four-line status block identical, in spec.md. |
| claim_25109471da4be0edce65a48735584744 | ok | Kernel-contract paragraph carried; only the four links were remapped to the platform siblings. |
| claim_a4351841ba59f20ec7938e5b1ea38f66 | ok | Migration note verbatim with resolved links. See Concerns. |
| claim_37572a9d192f311dd68474b794f87d5e | ok | Note body verbatim with resolved links. |
| claim_d23d47b9e725baca5de150afd215e059 | ok | Architecture Name heading, paragraph and code block all present in the target unit. |
| claim_e96351fa78113b589f25b1b0b55e1623 | ok | Naming paragraph identical. |
| claim_0c88f05863191f643e3e9ad87275f0de | ok | Host invocation and provider routing code block identical. |
| claim_2a889b8deba739f9461cd029f6005746 | ok | Problem And Scope heading and paragraph verbatim. |
| claim_722917cd4b4e98c8e6ed1498c02a752c | ok | Problem paragraph identical. |
| claim_b5732dff8040a7546417569031da6864 | ok | Canonical Names heading, lead-in and the full 17-row table present; one link remapped. |
| claim_04aa8f5405a6c04bb829d2b8057f91cf | ok | One-name-per-concept sentence identical. |
| claim_6ccdb5afe9aeb2433d51be563f10c206 | ok | Table identical except the single legacy-cli-transition link retarget. |
| claim_2cea6c9894af01708d0ccadbe6e3700d | ok | Peer Host Use Cases fully present: mermaid diagram, three-row table, R3 note, shared boundary and transitional lane. Only the legacy-cli-transition link was retargeted. |
| claim_c4100e9f00123b488f2793cf48044cd9 | ok | Peers sentence identical. |
| claim_e4b8bd07e3f3a75850b54f7d8d4398e3 | ok | Mermaid flowchart identical. |
| claim_1c089a156e3b49003be410a6b22277b6 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-11). |
| claim_409136e69870a5b65fad1c316d27b2de | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-12). |
| claim_b36251074aafa1b9a7a18d09d35916c6 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-13). |
| claim_e48bce114dd451e01284dfedff3189b8 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-14). |
| claim_ff539e4d9e54b7a23852c01f926c5596 | ok | Transitional CLI lane paragraph carried whole in spec.md; only the legacy-cli-transition link is retargeted to architecture/legacy-cli-transition.md, which exists. |
| claim_80fe1621540d25e5e4f6968bea7e0a0b | rework | Rework (rationale only, no claim lost): target heading unit omits the Contract versioning paragraph and substitutes an Added-in-candidate pointer, yet the rationale says all direct-unit wording is retained and names no remainder; the paragraph is carried verbatim by claim_bbaec409 in contracts/component-protocol.md. Name that remainder and carrier; the pointer cites an unavailable legacy path and the vague label dropped-002 restoration, so give the real platform anchor. |
| claim_56a238faac6b847f9682d37b3120ee3d | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-16). |
| claim_6b0a503ec2f4be776646c3497dd2b654 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-17). |
| claim_8915e841d73567b51aeafbf90a505e53 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-18). |
| claim_172f16568383334882a377204d1bda92 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-19). |
| claim_2d8e20d6682672ff45ace69f776f586e | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-20). |
| claim_2d3c01cb290b26b07dea9f4253b48a2b | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-21). |
| claim_3093ee097f4a4c9dd5f2e4c1573baac0 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-22). |
| claim_26a29b7f2a7b3e9bb7b7f428c1af8ea7 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-23). |
| claim_bbaec409dcbaee8f33968727aa0abed5 | ok | Contract versioning paragraph carried verbatim (fenced restoration) in component-protocol.md with a checked-status note that range intersection and transforms remain design; this is the carrier for the paragraph dropped from the spec section. |
| claim_bf4e1d2585b99572e186d3a65714ca44 | ok | Only heading depth changes; router, pipeline, snapshot-immutability text and the OperationProvider trait block are otherwise identical in spec.md. |
| claim_305dece113643fd5b84ae2e927d0255c | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-25). |
| claim_05580d020f4747813ccde0f35a0d4253 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-26). |
| claim_bd9700b35680814aed54cb5ead71f93e | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-27). |
| claim_7cebe18b8107697678773ccc51789839 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-28). |
| claim_640e28371ba46f2a0b4d25d9bd4857cf | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-29). |
| claim_5ddfd281d81055c96fda317ce953758c | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-30). |
| claim_79be28c5dff309bf75120de9b05ae4d0 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-31). |
| claim_d6010b0b5e57e716fdbb2b573a5c2e4a | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-32). |
| claim_ac4f722cb56e970753490a07e2043811 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (7-authority-two-stage). |
| claim_50f8ffbbb93953f5a4d7b276700aaf6d | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-33). |
| claim_8242c1d38b001421e537d3c00881719e | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-34). |
| claim_eec8cf4f92eb6874379f999e36411748 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-35). |
| claim_8428870415cb04160f9b74b632be2f4e | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-36). |
| claim_dee53f3bfe9661d4d0fa015e3d0783ca | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-37). |
| claim_76dfcba31d147e73488ea3abeade7ef1 | rework | Rework (rationale only, no claim lost): target omits the lifecycle state chain and the idempotency-key paragraph (replaced by pointers) but the rationale claims all wording retained and names no remainder; carriers are claim_75c780a3 (chain) and claim_e365a92a (idempotency) in contracts/component-protocol.md. Name both remainders; pointers cite unavailable legacy anchors, use the real platform anchors. |
| claim_be7bb33b5eafddffe9363e3f77cb41b6 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-38). |
| claim_1af2a90d9a26d86dd7a4366de7cd1940 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-39). |
| claim_cf5c63a7dd524801f09ae8137fdc3d6e | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-40). |
| claim_75c780a31188a0fa1e19d03ccbd3b6b1 | ok | Lifecycle arrow chain carried verbatim in a fenced restoration in component-protocol.md with checked status stating the chain is vocabulary, not persisted states; carrier for the chain removed from the spec section 8. |
| claim_19fc68fdc1c3c1ab6616f2f973c66033 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-42). |
| claim_e365a92a236aa909b9148185aa8f0801 | ok | Idempotency-key paragraph carried verbatim (fenced restoration) in component-protocol.md under the contract-versioning restoration; carrier for the text removed from spec section 8. |
| claim_60fe87198f033ece2b006252ddc50e4e | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-44). |
| claim_080c5cdacf820ed661ab372086ca7e41 | rework | Rework (rationale only, no claim lost): the layout tree is replaced by a pointer while the rationale says all wording is retained; the tree is carried verbatim by claim_54536d10 in architecture/release-boundaries.md with a checked-status note. Name that remainder and give the real platform anchor instead of the unavailable legacy path. |
| claim_d261432b2a27b402bd3027b58e918774 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-45). |
| claim_54536d1078dc6a2b6eacd17105389f2b | ok | Physical-placement layout tree carried verbatim in release-boundaries.md with a checked-status note that it is illustrative and registry.rs replaced registry_linker.rs; carrier for the tree removed from spec section 9. |
| claim_a069d263becad79e86a1381d36e62f13 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-47). |
| claim_6bc953eb6105342ced582ea637d33f80 | ok | Distribution/fgctl paragraph identical; only the Runtime Identity link is retargeted to ../../architect/packaging-distribution/ which exists. |
| claim_851ddbaa6bc2c6725489d33799bd26f5 | ok | Release table R1-R3 and closing paragraph identical; only heading depth and the Future Constraints link change, link target exists. |
| claim_559fca19404946ba9ede9006edab6e63 | ok | Release table identical except the Future Constraints link retargeted to an existing file. |
| claim_21a5d8159161b20d737a94c96eb0a55d | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-50). |
| claim_f68e3c4f62dca2243859372c4b1029cf | ok | Open questions 1-5 and packaging pointer identical; only heading depth and link retarget. |
| claim_a8f97838dcc5ffcbacc85b316d50e496 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-51). |
| claim_eff16b53a71c2109f97bb2e2bab25e87 | ok | Packaging ownership sentence identical; only the link is retargeted to an existing file. |
| claim_8494129121a2674191af910332dc4502 | ok | Related Documents list carried with links retargeted to candidate files (the Rust plan maps to roadmap.md, which holds that heading); all targets exist. |
| claim_b2a8587f5b61f728d0136e54d808289f | ok | Related-links block identical to the heading unit content with the same retargeted links, all resolving. |
| claim_06ed1e74e28e628d68ae28927e3f14cb | ok | Title, status, date and kernel-dependency paragraph carried; Revised link depth and the spec link are correctly retargeted. |
| claim_3a3a8368338c8392adbdf48ddbf0285c | ok | Status/date/Revised lines carried verbatim; only the plans/reports link gains one level of depth, correct from the new location. |
| claim_aa86fb103683af614daa5edfc2329ed7 | ok | Kernel-dependency paragraph verbatim; only the link now points to ../spec.md. |
| claim_b4f3b7bbb0174373a63a66c57c4f3078 | rework | Rework: moved verbatim except links, the note says This document remains a legacy-current source and lists the promoted platform docs including this very file, which is false and self-referential once the text lives in the promoted document. This is migration bookkeeping about the legacy file; supersede it with a stated reason or relabel it as historical quote, do not move it as a live statement. |
| claim_2f85030181d51c92cbb5dfd094d20956 | rework | Rework: same defect as the Migration Status Note heading unit; the paragraph now sits in the promoted architecture doc yet states it is a legacy-current source and links to itself. Supersede with a reason or label as historical, do not carry as a live claim. |
| claim_7b3c9cdf89fe70d17f3f526bbdffa385 | rework | Rework (rationale only, no claim lost): the sentence Both adapters delegate a complete use case is replaced by a pointer while the rationale says all wording is retained; it is carried verbatim by claim_7046eb56 in contracts/component-protocol.md. Name the remainder; the pointer path docs/architect/contracts/component-protocol.md is not a real location. |
| claim_0780171ae7b22535547b733b282902e4 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-4). |
| claim_f399322c3c707a4363567075654a1189 | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-5). |
| claim_cbfa23989cabeec1fdde00b4d555b37d | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-6). |
| claim_06f923fa3e55bd9e8d8cab01146d573c | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-7). |
| claim_7046eb56f67c02ef82f621a3fa30286c | ok | Both adapters delegate a complete use case sentence carried verbatim (fenced restoration) in component-protocol.md; carrier for the sentence removed from legacy section 1. |
| claim_fb0a3b210d1cddacf4e38452291c338a | ok | Unit identical to its source (no text difference, equal digests) in the mapped single owner; nothing lost or added (unheaded-block-9). |
| claim_04f0605dc840e350f63e53d0e1e96843 | rework | Rework (rationale only, no claim lost): the package.json bin.fgos paragraph is replaced by a pointer while the rationale says all wording is retained; the paragraph exists verbatim in architecture/release-boundaries.md under Restored package json bin fgos removed, flagged obsolete, but its carrying claim is outside this slice and is not named. Name the remainder and carrier claim. |
| claim_7671f0c8195aa48b9e95bcc1a9dd9339 | ok | Unit text identical in source and target (unheaded-block-10 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_d132d054cc01b08ffa74ecfd60cc443c | ok | Unit text identical in source and target (unheaded-block-11 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_b098afd80d02a32e6c6dd6c0f1e23284 | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_c1993044e428f031329f23c67bc2a1d6 | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_6a37273a0a45d24c53e344928c3edf22 | ok | Replacing Checked status matches package.json:9-12 (both bin.fgos and bin.fgos-runner present) and the bin/fgos.mjs header (compatibility channels remain); the old clause is kept verbatim in the adjacent restored block. The root AGENTS.md sentence is not restated in the status text but survives in the verbatim block. |
| claim_0b85ea8ddcbd3d505edf8b110e3a42ad | ok | Unit text identical in source and target (unheaded-block-15 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_df8ecf59eaba9c13d5ebc60784018f80 | ok | Unit text identical in source and target (unheaded-block-16 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_418ba1eb913f8fb73c2076c098709b9e | ok | Unit text identical in source and target (unheaded-block-17 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_7cc93760fbe54867480b91577fcbbf34 | ok | Unit text identical in source and target (unheaded-block-18 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_174de09282f33f3be061af276a2f312c | ok | Unit text identical in source and target (unheaded-block-19 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_19d889291655b99062f6d2a96f4d46e0 | ok | Unit text identical in source and target (unheaded-block-20 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_98683c6667ec64317c110eb4fe42da11 | ok | Heading unit: paragraph 1 is carried verbatim in claim_7f7b3ba8 (component-protocol restoration), paragraphs 2 and 3 retained in place; the pointer path named is a nonexistent legacy path (see Concerns). |
| claim_7f7b3ba83bbde945cdd80d479b9d0b19 | ok | Paragraph carried verbatim in the Restored both adapters section. The rationale sentences about the CLI lane and state transactions describe the section, not this paragraph, but nothing is lost. |
| claim_2150505ad7a90a909c876f86d9f5045b | ok | Unit text identical in source and target (unheaded-block-22 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_e9ae0be6b74c4968b45802eb2cf6eb4f | ok | Unit text identical in source and target (unheaded-block-23 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_fc3eb11aedf895901962ef5e70f26de4 | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_87f8a5d0c80c3f928422a7ffbef9e8ee | ok | Unit text identical in source and target (unheaded-block-24 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_b44be17fc9825eab5a9a6822c1473110 | ok | Unit text identical in source and target (unheaded-block-25 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_d3a32297633d7d7cc626d7723dca46c7 | ok | Unit text identical in source and target (unheaded-block-26 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_9a1f08d0bc4045fde2455e9a8d196a29 | ok | Unit text identical in source and target (unheaded-block-27 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_b74991659ee3db4cb630f607d065ce52 | ok | Heading unit: first paragraph retained, cost paragraph carried verbatim by claim_8c44796a, replaced here by a labelled pointer (dangling path, see Concerns). |
| claim_039865ac614bd07bd3b1f00f89e39441 | ok | Unit text identical in source and target (unheaded-block-28 to architecture/legacy-cli-transition.md); fully carried, no remainder. |
| claim_8c44796ac827f6b1287421778b56511c | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_b1e44493c254c54dc18efa2088b0018a | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_949229109da1c08a1d85f8503ea3ee9d | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_14f599ac6c6af84bcd15a503faaaea03 | ok | H1 unit: Status/Date/Revised lines retained, scope paragraph carried verbatim by claim_2519e82b (release-boundaries Restored scope); labelled pointer is dangling (see Concerns). |
| claim_95f304c1b827f4b6f1d5070a006051bb | ok | Unit text identical in source and target (unheaded-block-1 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_2519e82bb2a6054b1b822fc266471424 | ok | Whole scope paragraph present verbatim in the Restored scope fence of release-boundaries.md; its relative links are unresolved there (verbatim by design). |
| claim_6275bba15f3262cd1adb35973216a47d | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_fd246fe0ad796f0ce1f3448b6ad8ec61 | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_416ff7a5bcd064e885b8fd36a8a1236f | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_6ff55a84cad191f74d5ba955c12176d5 | ok | Unit text identical in source and target (unheaded-block-4 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_dd0dd857d5e3520ae9dc78c58f0fc8ad | ok | Unit text identical in source and target (unheaded-block-5 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_2578e5e7c9eabf7bcd4a8f5e65a0c650 | ok | Unit text identical in source and target (unheaded-block-6 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_9394d4472d63f8e7c7694fb5292fa610 | ok | Unit text identical in source and target (unheaded-block-7 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_993f44595192c14f62bc1f2f87bf3be0 | ok | Unit text identical in source and target (unheaded-block-8 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_c66daabdf8cd04e568de890f07b21c27 | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_aec6fb3d8eed3c772ec8bac9808009d3 | ok | Option A body (txt block and rationale) carried verbatim by claims 38ab2fca and bb413cec; labelled pointer left here (dangling path, see Concerns). |
| claim_38ab2fca27e14c583debbe4bd42386c9 | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_bb413cec669065c6ea224f0a326fcad1 | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_f03a714ee76799cf8da8475e40245815 | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_44ccd4764a3854df36f1cc5c79fbd985 | ok | Unit text identical in source and target (unheaded-block-11 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_6b9a10b4a4db290948a1d116ceb41ec2 | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_4862726f445bfdcba1b58996cf47dfd8 | ok | Option C body carried verbatim by claims 2f8cc209 and 9c041351; labelled pointer left here (dangling path, see Concerns). |
| claim_2f8cc2098b8aab83a7d7442cc88028a8 | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_9c041351e42cf17447a86425475d1d50 | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_d3350f1f59df99f9dfa937d5ea894de4 | ok | Selected Option text fully retained. Two identical Added in candidate pointers were appended; they are redundant and the second effectively stands in for section 3 (see Concerns), but no source claim is lost. |
| claim_a2a90fc8f7288cae9b03d22aeb16c504 | ok | Unit text identical in source and target (unheaded-block-15 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_5b0f65a4cc7366113339fc3a47d9eded | ok | Heading line carried verbatim in the Restored rejected options rationale block; its body is carried by claims 666cd097, 50f628b5 and f2eb44e2 in the same section. No live section 3 heading remains in node-to-rust-migration.md (see Concerns). |
| claim_666cd097b96236ab3c885054b2240ead | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_50f628b5dcaf8dbdffee5607d27480f1 | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_f2eb44e222e17f54c6ccc94e0af4fa3e | ok | Whole unit carried verbatim inside a literal restoration block in contracts/component-protocol.md (only a code fence added); the parent unit in the architecture doc keeps a labelled Added in candidate pointer. |
| claim_de06d5be825c0a46599c25f4b5f41b0d | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_5ac4a4ce8501c135b57d3289f96d5a70 | ok | Unit text identical in source and target (unheaded-block-19 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_bb89ed52536b1289401a9172c85ec599 | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_3b0b946349b8fa27b333dc346315983f | ok | Unit text identical in source and target (unheaded-block-20 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_213f64c40ab34be11ddf0b4f82a8698b | ok | Unit text identical in source and target (unheaded-block-21 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_bf3d7167dae0b1afb1dbded1c3a1b910 | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_c636fbbe9cf7f50c068480a13103d857 | ok | Unit text identical in source and target (unheaded-block-22 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_c6b117438c78c0881915df368cb8f4d9 | ok | Unit text identical in source and target (unheaded-block-23 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_57e68cea3f9bf4d66fc048f02f59383d | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_1af65e52e9258010540ae12b62a51d26 | ok | Unit text identical in source and target (unheaded-block-24 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_5325339ee4038a9c701bb19edd74dd17 | ok | Unit text identical in source and target (unheaded-block-25 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_9856db4ff1c2d562e95ff0786f823389 | ok | Heading depth shift and two link rewrites (Runtime Identity path resolves to docs/architect/packaging-distribution; Legacy CLI Transition sibling); body otherwise unchanged. |
| claim_502a4f82b936983d2e826e42f613f60d | ok | Unit text identical in source and target (unheaded-block-26 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_a1db1d2b5ec77e9580555f69f4cad2be | ok | Unit text identical in source and target (unheaded-block-27 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_874ccce76215f5a036d08203211c2868 | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_cd920a5c6b37f91738221ce29db5e4d7 | ok | Unit text identical in source and target (unheaded-block-29 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_9f1e20c17bafe84ffd5c9170a751a5a0 | ok | Unit text identical in source and target (unheaded-block-30 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_fa0f4a4233cf24cffd3756f14d6e0ad6 | ok | Heading depth shift and link rewrites only; all body text retained. |
| claim_9c7bb3f6e802409a5b90faaac46a2c3f | ok | Only relative link destinations rewritten to resolve from the new location; wording otherwise identical. |
| claim_5641bb020619ed89671f878220ee6a81 | ok | Unit text identical in source and target (unheaded-block-32 to architecture/node-to-rust-migration.md); fully carried, no remainder. |
| claim_82c03ace667d3b9a6b3a4130445160e1 | ok | R2 exit sentence carried word for word in node-to-rust-migration.md at the same position; no text difference. |
| claim_6837def654317a6834bd8353f3d62683 | ok | R3 section carried in full in the mapped architecture doc; only heading depth and the Future Constraints link path differ, and that link resolves to the existing legacy file. |
| claim_3c20acd43697420d9cf2954ba122554a | ok | Lead-in line carried verbatim in the mapped architecture doc. |
| claim_363a3b2745d8220ca67a388e667ef69f | ok | Six-step route-by-route list carried verbatim, no difference. |
| claim_64d8ef6551f46c1a400b4b5953b6ba51 | ok | Captured-CLI-output and blast-radius paragraph carried verbatim. |
| claim_cb5f9407269b77080fbb088ca91118fd | ok | Project-local gateway paragraph carried verbatim; only the Future Constraints link path rewritten and it resolves. |
| claim_ac42bff1400920fcfd54f99e5c852012 | ok | Chat peer-host paragraph carried verbatim. |
| claim_1e2e21550762c240e9cdd8798da86400 | ok | Section 8 heading and its one sentence carried; heading demoted two levels only. |
| claim_cfc4ff3c049548b37886519af328eb5f | ok | Read-only operation sentence carried verbatim. |
| claim_8e655426dff7dfaa26b546b3bcc8a45e | ok | gate-bypass subsection carried in full with all three paragraphs and the exit condition; heading depth only. |
| claim_7226555e50f437af97567386259ab46c | ok | gate-bypass scope paragraph carried verbatim. |
| claim_9ab0a693a87bf70ad7512cd88a1d9daf | ok | Exclusion of approval-policy and risk-keyword evaluation carried verbatim. |
| claim_c005ecb1989a286b1757798cc7d2a94e | ok | Exit condition paragraph carried verbatim. |
| claim_18f1c32a71e8c60bca41d1d3284f18a2 | ok | Why-ready subsection carried in full; heading depth only. |
| claim_a916424d6dc432c47d25679e4bd81f5c | ok | Why-ready paragraph carried verbatim. |
| claim_c072318ec582affe5e0e6936961fadc4 | rework | Rationale says the target retains all direct-unit wording but the target drops the intro line and the whole ten-step list and substitutes an Added in candidate pointer. The pointer names the dead path docs/architect/contracts/component-protocol.md instead of the live docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure, and the rationale names no remainder. The words survive only through the sibling claims for blocks 44 and 45, so state the partial carry and the remainder anchors, and give a resolvable link. |
| claim_9f2283b25ef4be9f0e68b4381f1ce08e | ok | Lead-in line present in component-protocol.md under Restored per component repeat procedure, wrapped in a literal md fence with the restoration note; wording unchanged. See Concerns on the owner split. |
| claim_abc80009ab1bf59c40a645089fbc82fd | ok | All ten steps present verbatim in the fenced restoration block, including the advisory link text; relative link inside the fence is not rewritten but the fence makes it inert. |
| claim_b2148884a229612fc756e330b1399dd1 | ok | Near-thin read-only ordering sentence carried verbatim in the architecture doc. |
| claim_43dd4f7aa139c570ea072ea4f9b7221d | ok | Native-provider parked-outcome rule carried verbatim. |
| claim_e960a05c0b656d0dae2cffd3daee5a0d | rework | Same defect as section 9. The target drops the sequence-it-internally lead-in and the seven-step read-model list and leaves a pointer to the nonexistent docs/architect/contracts/component-protocol.md path, while the rationale claims all wording is retained. Carry survives only via the sibling claims for blocks 49 and 50. Name the remainder and point to the live component-protocol.md anchor. |
| claim_273dc85bcdf5ba25529e63b15e143f10 | ok | Read-side component sentence carried verbatim. |
| claim_99bf6932b3f44681c138edf8384d652b | ok | Lead-in Sequence it internally present in the component-protocol.md restoration section, fenced, unchanged. |
| claim_056d11e86ef88989c436bc14a24997a1 | ok | All seven read-model steps present verbatim in the fenced restoration block. |
| claim_0d3534934d94da41639a8bbc329bb899 | ok | Closing sentence on reusable Rust read models carried verbatim. |
| claim_b31f86388112e9f8aac5f3ea07c83bd5 | ok | State-writing section carried in full including all nine conditions and the no-dual-run rule; heading depth only. |
| claim_63860fe2462fbdab3c4d5b57444fb5a4 | ok | Lead-in carried verbatim. |
| claim_bd9900cec35acddc9849345a94c6db36 | ok | Nine writer-migration conditions carried verbatim. |
| claim_ae033477100f1de32bd90e0dfbc1864a | ok | No-dual-run-writes rule carried verbatim. |
| claim_acf1156543b8ec7d86e7b4e009201170 | ok | Remove-Node section carried in full with all six criteria; heading depth only. |
| claim_6cc2bd78692503007d071066315a111e | ok | Lead-in carried verbatim. |
| claim_8eb35e24ef106901ca1a2214ec25fdbd | ok | Six Node-removal criteria carried verbatim. |
| claim_119c3cb5a48455746661c2e7d0a2b898 | ok | Calendar-target sentence carried verbatim. |
| claim_ac2177776d1a367f2d8e81699b04fc63 | rework | Target keeps the first paragraph but drops the three rollback bullets (observation window, never delete Node writer before recovery proof, remove rollback code per component) in favour of a pointer to the dead path docs/architect/contracts/component-protocol.md#restored-rollback-bullets. Rationale still claims full retention and names no remainder. The bullets do exist verbatim via the block 59 claim, so the fix is naming that remainder and linking the live component-protocol.md anchor. |
| claim_485913c207130897d47aa1e1511faa50 | ok | Rollback paragraph carried verbatim; Runtime Identity link rewritten and resolves to the existing legacy file. |
| claim_a1c1085c9d77a84ca5e5aefe1de6d059 | ok | All three rollback bullets present verbatim in the fenced restoration under Restored rollback bullets with a checked-status note that does not overclaim. |
| claim_5d6afe6b9aac75dd4fb323e2a866d837 | ok | Verification Gates section carried in full including the seven-row table and the repository-wide proof sentence; heading depth only. |
| claim_20545e78518081973da7685f01636fee | ok | Lead-in carried verbatim. |
| claim_e919af7f6751a0a8df95673a9057c298 | ok | Seven-row gate table carried verbatim, including the performance-gate column. |
| claim_e205cd11ce321170320898e9845689a3 | ok | npm test and cargo test sentence carried verbatim. |
| claim_f3092763d47af8fa8eaffec73ca0fe63 | ok | Remaining decisions section carried in full: four open questions plus the settled packaging note; link rewritten and resolves. |
| claim_f16be2f3b890cb70b0c1492df480469d | ok | Four open migration decisions carried verbatim. |
| claim_9abc9022ffe0e22751258bd1dca6136d | ok | Settled packaging-ownership decision carried verbatim; link rewritten and resolves. |
| claim_15bf45a3b2bdf1083bc63a6f10d14e82 | ok | Plan title, status, dates and the four link lines plus scope paragraph carried in roadmap.md; links retargeted to spec.md and architecture/node-to-rust-migration.md which exist, and the legacy-relative ones resolve. |
| claim_182dc1f2f896d82f0cf35519579ebbbf | ok | Status, date, revised and link block carried verbatim with resolved links; the proposed-status label is covered by the dated-provenance note at roadmap.md line 319. |
| claim_c710c879488536d7a2b949141952f010 | ok | Scope paragraph carried verbatim. |
| claim_d4b9b2583e0b4b598a7610af9ced7d36 | ok | Migration status note carried with links rewritten to sibling promoted docs that all exist; sentence now reads as self-reference to the new roadmap, see Concerns. |
| claim_bb1dcfee5986a94c37e667c75bd3af84 | ok | Same paragraph with five promoted-doc links rewritten to existing siblings; wording unchanged. |
| claim_43c25aed966fdb607de17ca47cbce862 | ok | Outcome section carried in full: three releases and the R1-independence paragraph; heading depth only. |
| claim_a29012c7fb94f83828b7835413eebcc2 | ok | Lead-in carried verbatim. |
| claim_ab6683864cea05c444f1b78cd30475b9 | ok | R1, R2 and R3 outcome list carried verbatim. |
| claim_a411676b68cace20da24d92621ed8925 | ok | R1 independence paragraph carried verbatim. |
| claim_e8dfeedeba14914888b827064f151fa9 | ok | Non-goals section carried in full with all seven bullets; heading depth only. |
| claim_cde3d5a31e679710c732f892d197b7ef | ok | Seven non-goal bullets carried verbatim. |
| claim_ab778e44a43171006f82c08d9939dcf5 | ok | Decisions-before-R1 section carried in full including struck items, closed setup-doctor decision and recording note; heading depth only. |
| claim_edbd740417658e6cfc22ced75d91b633 | ok | Lead-in carried verbatim. |
| claim_c84180b3855a6187533b4f6f92c23630 | ok | Six-item decision list with strikethrough settled items carried verbatim. |
| claim_fb9821c822ae8aa2c943c79604fe94f1 | ok | Closed never-select-or-download decision carried verbatim. |
| claim_cf0272c9d88e7c921805226ce86f7a61 | ok | Recording instruction and P6 blockers carried verbatim; still names the legacy packaging-distribution directory as in source. |
| claim_53de40a0d6f29ad5ad76589e0a7df776 | ok | Delivery Graph section carried in full: mermaid graph, P7-P8 note and PK note; heading depth only. |
| claim_72cb929bf5ecffe3431de368d5cb7def | ok | Mermaid delivery graph carried verbatim. |
| claim_2f7f1c2f7b0f0673f7f2423731f30ae7 | ok | P7 does not block P8 note carried verbatim. |
| claim_9b87547dbf5c4930ad55f81ce588af0b | ok | PK external-dependency note carried verbatim. |
| claim_2ed84857b662413aec52b94409440707 | ok | P0 heading line carried with depth change only; the source unit is the heading alone. |
| claim_97675a05c81f8d594b0023e409ef78de | ok | All eleven P0 deliverable bullets carried verbatim; only the Legacy CLI Transition link retargeted to architecture/legacy-cli-transition.md which exists. |
| claim_ea3616daf5f3ce20345689c0f5513e44 | ok | Scout evidence subsection carried in full; heading depth only. |
| claim_beed103650a3300815a2f9fd55512980 | ok | Six scout-evidence bullets carried verbatim. |
| claim_2640fd2bf8f2de2fff20a9eecac26afb | ok | P0 exit-gate paragraph carried verbatim. |
| claim_1f4be3dfcd0e9431ceab5059ceed6633 | ok | Verify subsection with the sh block carried in full; heading depth only. |
| claim_edc2a35ab327afe6fae3c0079c44c33f | ok | Verify sh block carried verbatim. |
| claim_3c202991304027e73ce867fadfd87175 | ok | Source unit is only the P1 heading and it is carried; the target adds two identical Added in candidate pointer paragraphs that are labelled but duplicated and point to a nonexistent legacy path, see Concerns. |
| claim_89e8b193eb339f06478bf6998576080c | ok | Changed areas heading present in the fenced restoration in component-protocol.md; the txt path list is carried by the next claim, so conservation holds across the pair. |
| claim_49ffb5866f0a65b3a12eef5f66b6d667 | ok | All four changed-area paths present verbatim in the same restoration section, fenced. |
| claim_aacc6f817470b6af566684cf21db1371 | ok | All eight harness steps carried verbatim in roadmap.md. |
| claim_fc22ecebfdc6e506475e638d1ba86920 | ok | Coverage floor heading and all seven bullets carried in place; two extra labelled pointer paragraphs are harmless additions. |
| claim_d2f98c28ed63bf5bdde71ee9905a5b9c | ok | Seven coverage-floor bullets carried verbatim. |
| claim_5c200f279a9c0fcf20b7df169781b026 | ok | Heading line carried verbatim inside the labelled restored fence in component-protocol.md; the bullets of this source unit are carried by the next row (unheaded-block-64), so nothing is lost across the pair. |
| claim_82a6b9c5ebba8c1384c0bfaca9be39b8 | ok | The three performance-gate bullets (25 ms legacy exec overhead placeholder, 10 ms native version placeholder, regression gates in P6) are carried verbatim in the restored fence at component-protocol.md; placeholders stay labelled as unproven by the section status note. |
| claim_dce9740dd9f04988dc3d1ffc4c1069d5 | ok | Heading line carried verbatim in the restored fence; its sentence and the two verify commands are carried by the following rows (blocks 66 and 67), so the full unit is conserved. |
| claim_cea27866daa3823bc706fe737e7155d9 | ok | The sentence that the harness fails on every injected difference and passes Node-against-Node is carried verbatim in the restored fence of component-protocol.md; section status note states it was not executed. |
| claim_096b8a1eacd02f9b9f34e80d62ec57e3 | ok | The two verify commands (envelope-contract test and export-command-selectors --check) are carried verbatim in the restored fence; no execution is claimed. The rationale performance-budget sentence is section-level wording that does not describe this block. |
| claim_7bcefee6ff2cdb9278b506d5893547f9 | ok | Heading unit (starting: ## 7. P2 — Rust Workspace And Generated Inputs) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_6dc943f5835fe7eef52790b415a67475 | ok | Heading unit (starting: ### Target areas) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_2d10871c46be72d9e7255698a6fcaf9a | ok | Source text (starting: ```txt) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_8a89cd3726b6841b4cce0fccb3963711 | ok | Source text (starting: R1 is exactly these three crates. `packages/component-protoc) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_a86aab8a7c793278b0f40c41445b40ae | ok | Source text (starting: 1. Add explicit workspace members/excludes.) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_4c19c4afc310f49b917983466dd84051 | ok | Source text (starting: The workspace contains only intended members and causes no H) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_ad2a4c535503fa65a9d6aaf7e9e16b3f | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_d05c662260e9d5128581fc96a66c06d2 | ok | Heading unit (starting: ## 8. P3 — Invocation Kernel Vertical Slice) carried in roadmap.md with only the heading depth deepened by two levels and the relative link resolved to architecture/ (target file exists); wording otherwise identical. |
| claim_e64b800c425e9aeabfe7001e2f3b2654 | ok | Block (starting: The kernel exposes exactly one contract: `OperationRequest` ) carried in roadmap.md with only the relative link rewritten to architecture/ (target file exists); wording otherwise identical. |
| claim_4bb58b361010872dadfab11d31a82ea0 | ok | Source text (starting: - `OperationId` and typed in-process `OperationRequest`/`Pro) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_7c356f4986b78e8e534ba028cc9c367a | ok | Source text (starting: 1. Write failing tests for duplicate/missing bindings, incom) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_ce523f4693d5650f3b9318313ec44f5c | ok | Source text (starting: Both host projectors reach the same provider and all negativ) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_170a6657616537761a61c5f21bd16795 | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_c365039c0ed792fe357dc32da00152d3 | ok | Heading unit (starting: ## 9. P4 — CLI Adapter Legacy Exec) carried in roadmap.md with only the heading depth deepened by two levels and the relative link resolved to architecture/ (target file exists); wording otherwise identical. |
| claim_b45d296754409e2acbb77c0a4c1fef1b | ok | Block (starting: This lane lives in the CLI adapter, not the kernel: for `leg) carried in roadmap.md with only the relative link rewritten to architecture/ (target file exists); wording otherwise identical. |
| claim_3c530d80d64e3352d8588bc11e13ac6a | ok | Source text (starting: - Candidate Rust `fgos` executable.) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_d9af584b6c9f0301147adddd40c434dc | ok | Source text (starting: 1. Add the ownership header to `bin/fgos.mjs` and the `AGENT) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_9344ec4f4abbe45957e9e660949bcc50 | ok | Source text (starting: Stable bytes, status, and filesystem effects match P1. The r) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_67f27db330eee764c88b7e7b98fa7aec | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_70ebd393b20048105ee2d61ba1b80340 | ok | Heading unit (starting: ## 10. P5 — Native `version`) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_fe3f6f8ac10ba0e516faa2ba0669ab12 | ok | Source text (starting: - Typed `distribution.build.show` contracts and built-in pro) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_36867e29d791ecbb5a8afb6510e047f6 | ok | Source text (starting: 1. Port package version, product-checkout commit, and sorted) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_c0feb8d360ffddc02c84efc83661c458 | ok | Source text (starting: The immutable binding selects built-in `version`, matches No) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_99639b47347fba434b9b7d4bd1327bb5 | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_a79713a60f70e2b2c71c26a4a0982b65 | ok | Heading unit (starting: ## 11. P6 — Distribution And Installed-Entry Cutover) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_8b2997b208e7079cfdc61218ee3d2a50 | ok | Source text (starting: P6 is part of R1, not late cleanup. Install, activation, upg) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_9ee3c1e8a270afbecd9d993057f83607 | ok | Source text (starting: 1. Confirm the remaining §3 decisions (target matrix, previe) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_d4cc5fce1718a48b3f1510a87eb47273 | ok | Source text (starting: All targets pass P1/P5 through `fgctl init` from outside the) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_76de093f955dea43ee8202b61fd82aa3 | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_23895431539495abbc82161abcb35e9d | ok | Source text (starting: Add explicit matrix commands after §3's remaining target-mat) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_2aa069b8a259de3dda82fc48c4d48324 | ok | Heading unit (starting: ## 12. P7 — External Process Provider Preview) carried in roadmap.md with only the heading depth deepened by two levels and the relative link resolved to architecture/ (target file exists); wording otherwise identical. |
| claim_0d786a42ec0d0eb88bfad2d38909ace5 | ok | Block (starting: See [External Provider Protocol](./external-provider-protoco) carried in roadmap.md with only the relative link rewritten to architecture/ (target file exists); wording otherwise identical. |
| claim_51cc2bb9b57c4e57f4d874cedc48d5e1 | ok | Source text (starting: 1. Create the provider fixture in a temp external directory.) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_446d721d407f7da7777d6d7598181d1d | ok | Source text (starting: Built-in and process providers are distinguishable through o) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_57d3b9749e5c2300873b408d8bd4bff3 | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_336d6a1de7dfd1440b2165423909e544 | ok | Heading unit (starting: ## 13. P8 — Production Remote Native Route) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_a8936ca958a19b57756c7f1451c3d4ae | ok | Source text (starting: Use `distribution.build.show` first unless another already-n) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_f3a7761da9b79fcd907b36c8b2c83df1 | ok | Source text (starting: 1. Compose the production remote projector/presenter around ) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_9457144f140ce0f5c9c64f3063e3776f | ok | Source text (starting: One production route is a true peer invocation. Remaining ol) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_c6fb2d851a8aed27c31af82f9056a862 | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_cbdba798349c777e7f15979d300e0142 | ok | Heading, gate-bypass paragraph, parked-outcome paragraph and test commands carried with only heading depth changed; the two appended Added in candidate notes are labelled and point to the compat-harness restoration of section 15 (the note repeats, harmless). |
| claim_2bc13328f1e7a4d1ac848c004a8a0952 | ok | Source text (starting: `gate-bypass` is a candidate, not a pre-created component. C) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_61d6d1de22e22af7eb3be3da75284378 | ok | Source text (starting: The provider never blocks on human input; a `parked` outcome) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_137e7e29c20b6ff1f4855d7f465055ea | ok | Source text (starting: ```sh) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_ca69fde84ef390b737cc841f2e0722f8 | ok | Heading line carried in labelled fence at compatibility-harness.md; the gates table and the process-spy paragraph are carried by the next two rows (blocks 17 and 18), so section 15 is conserved across the three rows. |
| claim_ed367a232471867cbc3fb24c44d1baf6 | ok | The six-row gate table (per commit, R1 integration, R1 release, R2, R3, future writer) is carried verbatim in the restored fence at compatibility-harness.md. |
| claim_de0f6932bac03ad628e2470515e7fb5f | ok | The paragraph requiring process-spy evidence for no-spawn claims and timing only for the section 6 and 11 gates is carried verbatim in the restored fence at compatibility-harness.md. |
| claim_c245c752125bfa748075cb620216e537 | ok | Whole section 16 (12 slices and rollback rules) carried verbatim with heading depth changed; the appended Added in candidate note is labelled and explains that sections 15 and 17 now live in compatibility-harness.md. |
| claim_88d182e8f7f1827e07da42ec9d992e49 | ok | Source text (starting: Independently revertible slices:) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_b9014c66550a776442837dad43e46a3b | ok | Source text (starting: 1. harness and generated selector artifact;) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_add5109449e2f6aefc7489ff836f0734 | ok | Source text (starting: Before P6, discard the candidate binary. After P6, roll back) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_245edf82638eebaa26df985249540c8c | ok | Heading line carried verbatim in labelled fence at compatibility-harness.md; the risk table is carried by the next row (block 20), so section 17 is conserved across the pair. |
| claim_ce5758286602f8062fe2c8ac0d709f22 | ok | The fifteen-row risks and controls table is carried verbatim in the restored fence at compatibility-harness.md; verified identical to the source table. |
| claim_a264e3ef292f50c6f56a33929e6b8db5 | ok | Heading unit (starting: ## 18. Definition Of Done) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_ab8c5d3c7ef7884ec870084364b54da4 | ok | Source text (starting: 1. R1 installs Rust on every approved target while every unm) is byte-identical in roadmap.md, a mapped owner section with the same heading path; whole unit carried, nothing lost or added. |
| claim_c3affbd60bf0454d48b3666cdd79c6d4 | ok | Heading unit (starting: ### Deliverables) carried in roadmap.md with only the heading depth deepened by two levels and the relative link resolved to architecture/ (target file exists); wording otherwise identical. |
| claim_2158185ee753c7a808c309de30cae3ec | ok | Heading unit (starting: ### Exit gate) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_8fe84caa90063489ae91b4524baab644 | ok | Heading unit (starting: ### Steps) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_34b17a8d6492f2d4be87cb3e6dd2a593 | ok | Heading unit (starting: ### Steps) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_b11ef4abc110ba22303eb3f025541600 | ok | Heading unit (starting: ### Exit gate and verify) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_8f36febbbef5a0b00318aa552d8ba677 | ok | Heading unit (starting: ### Deliverables) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_4ab3e6e21afab0c12743395ae708c75d | ok | Heading unit (starting: ### Steps) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_52f5747b1cfac5ba88f2842044cf65c2 | ok | Heading unit (starting: ### Exit gate and verify) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_b4ee57b972d9fdd779cc2d35ed472925 | ok | Heading unit (starting: ### Deliverables) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_d71514962368cda1b73909568d6a28a9 | ok | Heading unit (starting: ### Steps) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_6658f5892f1b4e7dc4004664844953ee | ok | Heading unit (starting: ### Exit gate and verify) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_bf701b781e21f7713e78936e64426dbe | ok | Heading unit (starting: ### Deliverables) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_91db470727c7581589d7f5db966832d4 | ok | Heading unit (starting: ### Steps) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_f169b920f8e2999c9c22629b72ed863a | ok | Heading unit (starting: ### Exit gate and verify) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_a75423d87fabcab32bdaba2f464b3881 | ok | Heading unit (starting: ### Steps) carried in roadmap.md with only the heading depth deepened by two levels; wording otherwise identical. |
| claim_4c0106ddaba03877864b6ae2abb98c73 | ok | P6 exit gate (all-targets P1/P5 via fgctl init, missing-payload diagnosis, rollback, perf thresholds, three verify commands, matrix TODO) is carried verbatim in roadmap.md under section 11 P6; only heading depth changed. Diffed against the pinned source commit with no other difference. |
| claim_c371125b0a8a3ecdf03a2fdfbdea9290 | ok | All eight P7 steps are carried verbatim in roadmap.md under section 12 P7 (target lines 825-836); only heading depth differs. Rationale is generic but true of the texts. |
| claim_f78bf014e8a8b9db8499245ad280594e | ok | P7 exit gate (one router, fail-closed negatives, legacy-cli never reaches router, two verify commands) is verbatim in roadmap.md under section 12 P7; heading depth only. |
| claim_4951927a0e6f131730d27ccdc6440e06 | ok | All eight P8 steps including the VerbGateway deletion condition are verbatim in roadmap.md under section 13 P8 (target lines 853-865); heading depth only. |
| claim_95fde7454b1d6cc39c22b450f21f72d1 | ok | P8 exit gate (one true peer route, old routes visible, no envelope fallback, two verify commands) is verbatim in roadmap.md under section 13 P8; heading depth only. |
| claim_c44d8d3021e241465f869930b4b9aab8 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_7c54af89d90e049b48b8790fd9632d12 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_788c2eec80e17a0ed7ea8ea1b9a85b83 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_f1124cdad699ecc79bea44387b3d1953 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_3eb7d7c7a95456bd9f4fe5ae5e38e0f1 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_587aefd9771b63283a21ab1534224378 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_d4b8fa94edeb5c1f1df6948f9652f819 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_dc030066540aac742cc7cb37f87468ed | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_e13a904e11d2a25b53858b96fcbe396e | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_2a42ed177643017472bb188cbbba8d4d | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_15c6c55960df29c5a8e1aff46af62c34 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_3a2ef6107a17cc13c2a9778914be8495 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_d16ed0ed7a63031dcdebf0d705ca122a | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_0f5df8ca333631ca4996be7d8d1a410c | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_3681cacef3fd5234588449fbe99aa07e | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_68bfb6dfefbd11ba5955e8e23833f5d8 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_19eae100d4d3e08cc1a5bc31a667807b | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_869d9a19087da4c0ebcb53f60e90f093 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_4784c893e99834789a025c4f089f4e08 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_d015081f55b1b80d41cabc07d9e7de36 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_3fc5fb91642f00e7140c0be11ee1d7d2 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_ca3cc714aae7d40dabb10e533ef8b920 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_1b04e29307da7c5596121a0895c8f8c2 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_42aadb9d5bc9e15f8ec139cf0279ba67 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_7e8f753055dd52ccb7c308d941de6731 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_70065c36227f7e2e1fe1398103f64eb9 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_04976d896f4a24cd9d965c15445f7cc2 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_5aafe23b7b72e69105bd6be66f714f5d | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_617b9a309f779e4e9d7f93c0f1cb02cb | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_792cf2c77ff877c5674a490f82e64af8 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_3bbf46354c6272cd989a6cf3ad220d93 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_388a81f04ae157a81ae5bd7367fc5e0c | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_a568c446726169176a2b3eb4c108480c | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_877979729899be1e67d0e3b17f2709b2 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_ffe45ab21be39799cc8b27234fa44898 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_8f953d9d90d0d2a7a425be559ab4756a | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_da254f9e02d8b6b7c6f5de9ac12623eb | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_620e2a92708060174b56e69dbb172b04 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_a42ff22029685836bd1978fd836502c6 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_57c0f0c757e78049b5d43ffb8a25ec19 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_3cd4d14e880184fbb311059ccdf5ed1d | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_47d77b46afdd231a2ea178d16add7e0b | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_6fb02a2df20be10e41f8b2b4aa6efc80 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_76506b9830a45c7b96756cc5ecd201bc | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_04576882b3ccced931a06d26f8a024d7 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_4dd6f77e64f75bb11e14cc579cc3b2db | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_9ac9d9e7d56a60bc49add3df2411df46 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_73188c99303d26f7721650aeb7c726df | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_4a1dc6e813bea2f76ab98d63f4d76c7b | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_4ca2c1de6558448db99cc938627f8220 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_412b3a679b332d253324c7132a596d48 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_aab75422b06f2493a911b76279b4d071 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_52e65336920609181736e620210b1fdf | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_7902c2d7d96657ce067d889fe6b89e71 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_29c487876d62d6d2a163fecfd3bdac72 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_effef075c0b501ca23d2eea59acd3fe8 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_889688e9186f257b1b7ff55bd65e466a | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_5ecb193d4b186b22aae496ad911b9a3b | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_533cc5ab86177496fd278ebf71238eee | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_b265c67259d71c49f69cb14d62eb8db0 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_c520da3db22e42efe9335409c782b678 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_1f7686be187b49f550b9f252263d6a5f | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_7e1084633c4f3dda2caca2a85401b29f | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_fc28821592f1f50afa79682457bca275 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_c07503ccf6eb6dea0aa8160bfce80ba3 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_5a063ca74dcc212192695830891fb7f9 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_be4f29e71b9da29e5ee23c9297bca3ca | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_2b668ad3aedf279e96cdac6b0326f675 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_ae32c505d4e0cd37ba53ed4b44c43889 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_ed61f597241e1f063ce60e84212093ab | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_545f229f92817ae98582c2c633bed6af | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_149c34df047e6308a6797355af2ce23c | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_d54e530544275501ea8ca8a42a1f0c8d | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_f8a729a966cef8804807fdc0fad3e4f3 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |
| claim_086a7ca5b82fec82858bafe24fe89323 | ok | Retired policy file kept whole under history/documentation-migration/documentation-standardization-plan.md per A8; Lead machine check finds this source unit verbatim in the target fence and the whole legacy file contained byte-equal. |

## Rework summary

The 14 rework rows share one defect, and no text is lost; each relocated passage is carried verbatim by a sibling claim:
- The rationale claims whole retention and names no remainder, although part of the unit moved to a restore owner.
- The in-place pointer cites a docs/architect path that does not exist.

Fix: name the remainder and replace the pointer with a relative link to the live restored anchor under docs/platform/host-invocation-routing/. Then rebind.

The Migration Status Note rows are a content defect. The moved note still says this document remains a legacy-current source inside the candidate. Supersede it with a stated reason, or relabel it as historical.

## Restorations, flag, exception, promoted diff

# Host Invocation restoration, exception and promoted-diff verdicts

Reviewer method: read-only at worktree HEAD 48195b2c2. Byte checks done in a script: for every unit, the legacy file lines (startLine..endLine) at both 83d757f4d and HEAD equal the evidence text; each text occurs exactly once in the restoreOwner candidate doc; sourceBlob equals git rev-parse of the legacy file; the Checked status line and the code evidence line appear verbatim in the candidate; register entries dropped-002..017 agree with the evidence file on source path, anchors, owner, anchor, code list and status note. Totals: 16 groups, 51 units (2+1+1+9+4+1+3+2+1+1+1+8+4+1+7+5), all literal.

| Item | Verdict | Note |
|---|---|---|
| dropped-002 contract versioning (2 units) | ok | Literal in component-protocol.md. Status says exact version-pair matching only; range intersection and transforms are selected design. operation_provider_router.rs:108-119 does exact request/outcome version compare; contracts.rs:174-203 is ContractRef with id and version. |
| dropped-003 lifecycle state chain (1 unit) | ok | Literal arrow chain. Status says the chain is vocabulary, not separately persisted states. invocation_service.rs:161-234 has the terminal enum incl. Parked and the lifecycle record; 494-570 shows received and admit. Nit: the select stage (line 586) and grant stage (line 642) that back the admits-before-selection and grants-before-dispatch sentence sit just past the cited range; consider extending to 494-660. |
| dropped-004 physical layout tree (1 unit) | ok | Marked illustrative, not a directory listing. Cargo.toml:1-17 shows members apps/fgos, packages/host-runtime/rust and the apps/fgos-gateway exclude; registry.rs:19-69 is build_snapshot (not registry_linker.rs). Claims match. |
| dropped-005 class definitions (9 units) | ok | All 9 literal. Qualified as design policy; contracts.rs:377-393 ProviderDescriptor has open Cow string component_class and mechanism, which is exactly what the note says. |
| dropped-006 built-ins vs extensions, cross-process cost (4 units) | ok | Literal. Note says typed input plus framed JSON-RPC and no performance measurement. contracts.rs:205-220 OperationRequest has Box dyn Any input; frame_codec.rs:1-16 is the 4-byte length-prefixed JSON-RPC codec. |
| dropped-007 transport-neutral semantic contract (1 unit) | ok | Literal. Binary codec or socket labelled future design; frame_codec.rs:1-16 confirms only the length-prefixed JSON-RPC codec exists. |
| dropped-008 registry linker procedure and formula (3 units) | ok | Literal. Note says only duplicate-binding validation is implemented; registry.rs:19-69 does exactly that (panic on duplicate bindings, replacement pair exempt) and operation_provider_router.rs:24-40 shows RouterPolicy as an unused placeholder and SelectionInput. |
| dropped-009 adapters delegate complete use case (2 units) | ok | Literal. legacy_exec.rs:69-154 resolves the payload through the manifest and verify_legacy_node; 242-253 spawns node with the forwarded args and inherited stdio. Note claims no more than that. |
| dropped-010 npm bin removal clause (1 unit) | ok | See the separate dropped-010 row below; the group itself is literal and flagged. |
| dropped-011 rust-host-first cost (1 unit) | ok | Literal. legacy_exec.rs:242-253 Command::new node from the Rust adapter supports the structural two-runtime cost; no latency claim made. |
| dropped-012 scope (1 unit) | ok | Literal. Marked engineering guidance not a gate; Cargo.toml:1-17 is the real current placement. |
| dropped-013 rejected options rationale (8 units) | ok | All 8 literal. Marked dated reasoning, not measurement; cites are consistent with manifest-owned CLI delegation and make no big-bang claim. |
| dropped-014 per-component repeat procedure (4 units) | ok | Literal. Ten-step list called manual guidance, not registered automation. invocation_service.rs:161-209 shows Parked distinct from Succeeded; package.json:27-35 is the real scripts block. |
| dropped-015 rollback bullets (1 unit) | ok | Literal. Called manual selected policy, not executed rollback; operation_provider_router.rs:74-119 select reads snapshot bindings with no override and registry.rs:41-69 builds the snapshot. |
| dropped-016 P1 compatibility harness (7 units) | ok | All 7 literal. 25 ms and 10 ms budgets stated as source placeholders, UNPROVEN as measurements, not inferred from any run. package.json test script and legacy_exec.rs:242-253 exist as cited. |
| dropped-017 test and review gates table (5 units) | ok | All 5 literal. Stated as dated acceptance policy, no suite claimed run. package.json:27-35 contains the real test entry. |
| dropped-010 flagged obsolete clause | ok | Verified: package.json:9-12 still has bin.fgos (bin/fgos.mjs) and bin.fgos-runner; bin/fgos.mjs lines 3-10 carry the ownership header and say global npm bin.fgos and node bin/fgos.mjs remain compatibility channels. AGENTS.md section on the legacy-node boundary says the same. So the clause is obsolete as a current statement. Keeping it byte-literal in a fenced block, headed with a FLAGGED checked status (retained as dated design, not the current contract, no locked rule changed) is the right call: it preserves the claim, does not assert it, and the owner can accept or retire it independently. Recommend recording the supersede link to the checked note in the register decision as the author did; do not delete or rewrite the clause. Nit: the restored text lives in architecture/release-boundaries.md while its source is legacy-cli-transition.md; the register owner was chosen that way and is consistent across register and evidence, so acceptable. |
| Identical-unit exception (two members) | ok | Exact set verified: claim_825ecbc1... (external-provider-protocol.md unheaded-block-1) and claim_3a3a8368... (legacy-cli-transition.md unheaded-block-1). Recomputed sha256 of lines 3-5 of both legacy files at 83d757f4d equals ab6730b9...; the digest occurs in exactly two bindings and two byteChecks in accounting, and exactly twice each in working-identity-registry.json and doc-inventory part-0002 (these two docs only). The other four sources have different blocks (provider-routing adds a Source line, the rest use other headers). Each target block sits under its own document title heading (external-provider-protocol.md and legacy-cli-transition.md architecture docs, both at line 54-56 under Retained selected source material, unheaded-block-7). It is metadata provenance for two different subjects, not a duplicated semantic claim; no canonical semantic-owner exemption is requested. |
| Promoted diff (21 commits, 19 paths) | ok | accounting.promotedAreaDiff is byte-identical to git diff 83d757f4d ffab98791 over docs/platform/host-invocation-routing (2793 lines); that tree diff touches only the 19 listed paths, no file outside the area, 2452 insertions and 43 deletions, 18 modified plus one new history file. Legacy docs/architect tree, package.json, bin/fgos.mjs, AGENTS.md unchanged versus 83d757f4d. No authority flip: the only header changes are README additive provenance fields (Supersedes None, Superseded by None) and the R2 and R3 redirects; no Canonical Yes, Accepted or Closed status is introduced. All 43 deleted lines are accounted: 13 repoints of links to plans moved to archive/plans (now plain text labelled historical plan unavailable), R2/R3 redirect header and body rewrites, ledger link depth fixes and HI-I027, source-inventory and ledger rows for the standardization plan now pointing to the history carrier, and implementation-alignment supervisor.rs to bound_invocation_supervisor.rs (the latter file exists; supervisor.rs does not). R2 and R3 redirects: Design status Closed and Implementation status Implemented preview became Draft and Historical implemented-preview record; the old Closed and Implemented preview values are preserved in the body as historical execution status and are explicitly not recertified. That keeps history and matches the candidate Draft rule, so no rework. History file documentation-standardization-plan.md fenced body equals the legacy source (byte-equal modulo the final newline). Low nits: (1) the carriage pointers in spec.md, roadmap.md and the architecture docs say historical reference unavailable and name docs/architect/host-invocation-routing/<owner path>#restored-..., a path that never existed, and are inert text; a clickable link to the platform owner anchor would serve readers better. (2) The R2/R3 and Observe plan refs say unavailable in this checkout though the plans exist under archive/plans/; wording is literally true for the cited plans/ path, but a pointer to archive/plans would be more useful. Neither changes meaning or status. |
| HI-I027 | ok | grep found it in intent-preservation-ledger.md. New text: Rust adapter resolves the payload through verified release-manifest legacyNode fields, never PATH, caller cwd, alternate npm bin selection or an unconfined hardcoded payload path; npm and direct-Node entries are a separate compatibility channel. This matches the AGENTS.md Legacy-Node CLI Ownership Boundary (manifest fields only, never PATH, cwd or hardcoded locations outside the manifest; npm bin.fgos and node bin/fgos.mjs are compatibility channels). Code check: legacy_exec.rs:69-154 reads FGOS_ACTIVE_RELEASE_PATH or current_exe-relative manifest discovery, with no cwd or PATH use (its doc comment says so), validates manifest invariants and release files, then calls verify_legacy_node in packages/distribution/rust/src/verify.rs:189 which rejects absolute and dot-dot segments and symlinks; package.json:9-12 and bin/fgos.mjs:1-10 are the compatibility channels. Status cell changed from implemented preview to code-checked boundary with dated preview proofs retained, and it states no new install smoke is claimed: honest. Nit: the confinement is in verify.rs, cited range is the caller. |

Status: DONE

## Truth sample (A28)

Seed: s3-truth-draw-780384cf. Population: 601 current-content units (non-heading, >=40 chars) in 31 non-history files under docs/platform/host-invocation-routing/. First 30 by sha256(seed:path#anchor).

# Truth verdicts (worktree HEAD 48195b2c2)

| # | Unit | Verdict | Assertions and evidence |
| --- | --- | --- | --- |
| 1 | verification/source-preservation-audit.md#unheaded-block-3 | unverifiable | Meta claim that no settled source detail was dropped and open items stay marked unknown/planned/deferred. About docs, not code; no code evidence possible. |
| 2 | spec.md#unheaded-block-14 | n/a-design | Status/date/source header of a retained, dated September design source (section "Retained selected source material", labelled pinned provenance, not current certification). |
| 3 | contracts/component-protocol.md#unheaded-block-2 | true | JSON-RPC 2.0 over 4-byte big-endian length-prefixed UTF-8 JSON frames: packages/host-runtime/rust/src/providers/external_process/frame_codec.rs:1-4. |
| 4 | r3-remote-peer-rollout-plan.md#unheaded-block-5 | true | Link only; target verification/r3-remote-peer-proof.md exists. Page is a labelled Redirect to a historical record. |
| 5 | spec.md#unheaded-block-34 | n/a-design | Retained source-design text (inside "Retained selected source material"); describes target contract. ProviderOutcome/ProviderError do exist as Rust types (packages/host-runtime/rust/src/contracts.rs:334) but the presenter/trace-sink claims are design. |
| 6 | contracts/component-protocol.md#unheaded-block-60 | true | Code-evidence pointer. package.json:27-28 holds the test script entry (`test`: node scripts/run-tests.mjs); apps/fgos/src/legacy_exec.rs:242-253 is the node spawn with forwarded args and inherited stdio. |
| 7 | architecture/legacy-cli-transition.md#unheaded-block-35 | n/a-design | Provenance note stating the source reference is historical and unavailable; no implementation claim. |
| 8 | architecture/legacy-cli-transition.md#unheaded-block-16 | true | "the name bin/fgos.mjs currently conflates" three things: bin/fgos.mjs (4868 lines) is the Node entry and still holds dispatch and orchestration (e.g. case 'setup' at bin/fgos.mjs:3774); it is also the legacyNode payload entry used at apps/fgos/src/legacy_exec.rs:243. |
| 9 | vision.md#unheaded-block-5 | n/a-design | Vision doc, "The long-term model" (target design). |
| 10 | contracts/operation-request-outcome.md#unheaded-block-9 | true | Relationship table links; all targets exist (architecture/invocation-kernel.md, contracts/component-protocol.md, docs/architect/host-invocation-routing/host-invocation-provider-routing.md). |
| 11 | architecture/node-to-rust-migration.md#unheaded-block-18 | true | Under "Option B" (design option) but with a current claim: "R1 already has the CLI adapter's legacy-cli exec lane and the kernel's native-selector shape". Exec lane: apps/fgos/src/legacy_exec.rs:197-253; native catalog of const native reads: packages/host-runtime/rust/src/catalog.rs:6,15; selector via packages/host-runtime/rust/src/invocation_service.rs:28. |
| 12 | contracts/component-protocol.md#unheaded-block-37 | true | "present manifest-owned CLI delegation": payload path resolved from components.legacyNode root/entry, apps/fgos/src/legacy_exec.rs:49,69,150. Remaining text is a disclaimer. |
| 13 | roadmap.md#unheaded-block-73 | n/a-design | Roadmap plan: PK is delivered by the packaging stream, P-numbering P0-P9; dependency-graph plan statement. (docs/architect/packaging-distribution/ does exist.) |
| 14 | roadmap.md#unheaded-block-90 | n/a-design | "P3 Deliverables" list of a roadmap phase; planned work. (Code partly matches: distribution.build.show at packages/distribution/rust/src/lib.rs:43,111,124.) |
| 15 | README.md#unheaded-block-18 | true | Relationship link table; every target exists (vision, ledger, spec, roadmap, architecture/*, verification/*, history/source-inventory, decisions/README, ../component-boundary.md, ../packaging-distribution/README.md). |
| 16 | contracts/component-protocol.md#unheaded-block-28 | true | "CLI lane forwards the complete argument vector to the manifest-owned Node entry and inherits stdio": apps/fgos/src/legacy_exec.rs:243-249 (cmd.arg(payload_path); cmd.args(forward_args); stdin/stdout/stderr Stdio::inherit). Rest is design/no-claim. |
| 17 | spec.md#unheaded-block-43 | n/a-design | Retained pinned source design text (pipeline description). ProviderError families exist at packages/host-runtime/rust/src/contracts.rs:334 but admit/normalize/record stages are design prose. |
| 18 | r2-external-process-rollout-plan.md#unheaded-block-1 | n/a-design | Metadata header of a Redirect, "Historical implemented-preview record, not recertified". Related file verification/r2-external-process-proof.md exists. |
| 19 | contracts/component-protocol.md#unheaded-block-25 | true | Code evidence pointer: frame_codec.rs:1-16 is the 4-byte big-endian JSON-RPC 2.0 codec header and DEFAULT_MAX_FRAME_SIZE. |
| 20 | roadmap.md#unheaded-block-69 | false | "There is no `setup` verb". `fgos setup` exists: bin/fgos.mjs:3774 (case 'setup') and src/cli/command-registry.mjs:1439-1441 (name 'setup', described as "Legacy compatibility command ... Shell/global setup compatibility stays here until a compatibility-window decision retires it"). The very next clause ("inventorying `fgos setup` callers", roadmap.md:452) also presupposes it exists. The "never selects or downloads a release" part is plausible but not code-proven here. |
| 21 | roadmap.md#unheaded-block-56 | n/a-design | "Done when" acceptance criteria of the final release (future). |
| 22 | architecture/external-provider-protocol.md#unheaded-block-11 | n/a-design | Conceptual two-axis diagram (component class vs invocation mechanism); design framing, no checkable code claim. |
| 23 | architecture/node-to-rust-migration.md#unheaded-block-11 | true | "bin/fgos.mjs still combines entry, dispatch, use-case orchestration, and policy": bin/fgos.mjs is 4868 lines with COMMAND_REGISTRY dispatch and inline verb orchestration (bin/fgos.mjs:3774-3840). "Mostly Node" is plausible (src/ Node plus Rust crates); not exactly measured. |
| 24 | verification/compatibility-harness.md#unheaded-block-6 | true | Relationship link table; targets exist (contracts/command-route-descriptor.md, architecture/legacy-cli-transition.md, docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md). |
| 25 | roadmap.md#unheaded-block-89 | n/a-design | "P3 - Invocation Kernel Vertical Slice" roadmap phase statement of target contract. |
| 26 | contracts/operation-catalog.md#unheaded-block-1 | true | Metadata header: "Implementation status: Current partial" holds, since the catalog is a const array of native reads only (packages/host-runtime/rust/src/catalog.rs:6,15). Related files exist (architecture/provider-routing.md, verification/implementation-alignment.md). Source file named exists. |
| 27 | architecture/node-to-rust-migration.md#unheaded-block-17 | n/a-design | Option B diagram, a rationale for a design option (the thin Rust host plus exec lane does match legacy_exec.rs). |
| 28 | architecture/legacy-cli-transition.md#unheaded-block-20 | n/a-design | Provenance note: historical reference unavailable; no implementation claim. |
| 29 | roadmap.md#unheaded-block-63 | n/a-design | Roadmap "Outcome" of a plan: execution is complete in three releases; plan framing (document says it remains a legacy-current execution-plan source). |
| 30 | spec.md#unheaded-block-45 | n/a-design | Retained design sketch of OperationProvider inside "Retained selected source material". Notably it matches code exactly: packages/host-runtime/rust/src/invocation_service.rs:28-41. |

## Summary

- true: 13 (units 3, 4, 6, 8, 10, 11, 12, 15, 16, 19, 23, 24, 26)
- false: 1 (unit 20)
- n/a-design: 15 (units 2, 5, 7, 9, 13, 14, 17, 18, 21, 22, 25, 27, 28, 29, 30)
- unverifiable: 1 (unit 1)

Units with current assertions (true + false) = 14; false rate = 1/14 = 7.1 percent (1/15 = 6.7 percent if the unverifiable meta unit is counted as having an assertion).

Lead check of the false unit: roadmap.md line 405 says There is no setup verb, inside 3. Decisions Required Before R1 Execution, in present tense. bin/fgos.mjs line 3774 still dispatches setup, and src/cli/command-registry.mjs registers it as a legacy compatibility command. Truth rework: add a labelled status note that setup still exists as a legacy compatibility command until its scheduled removal. Do not edit the carried wording. False rate is 1 of 14 units with current assertions, 7 percent, under the 10 percent stop line.

Red-team F5 is a further truth rework outside the sample. The code-verified current snapshot says 73 selectors, 71 legacy-cli and 2 native. packages/host-runtime/contracts/command-routes.json has 75, 70 and 5. Recount and restate.

## Stratified invented-claim draw

Seed: s3-truth-draw-780384cf. Strata: 20 candidate blocks named by no decision (population 351), 20 decision targets whose text is not a verbatim source carry (population 35), 10 random.

| # | Stratum | Block | Verdict | Note |
|---|---|---|---|---|
| 1 | unnamed | 1 | structural | Audit-result bookkeeping in candidate-authored audit doc; borderline, no legacy source |
| 2 | unnamed | 2 | sourced | external-provider-protocol.md line 74 |
| 3 | unnamed | 3 | structural | portal link |
| 4 | unnamed | 4 | labelled-addition | Code evidence under a Restored section carrying Added in candidate |
| 5 | unnamed | 5 | labelled-addition | Added in candidate label |
| 6 | unnamed | 6 | sourced | host-invocation-provider-routing.md lines 8 and 35 (host, operation, provider separation) |
| 7 | unnamed | 7 | structural | relationship table |
| 8 | unnamed | 8 | labelled-addition | Checked status under Restored section with Added in candidate |
| 9 | unnamed | 9 | structural | relationship table |
| 10 | unnamed | 10 | labelled-addition | Checked status under Restored section with Added in candidate |
| 11 | unnamed | 11 | structural | redirect header metadata |
| 12 | unnamed | 12 | labelled-addition | Code evidence under Restored section with Added in candidate |
| 13 | unnamed | 13 | invented | Done when: contracts/legacy-payload.md becomes historical; spec.md removes legacy-current for Node payload only after code and release evidence agree - roadmap Phase H, no legacy source, no label; roadmap header says Source type Created after code scan only |
| 14 | unnamed | 14 | structural | relationship table |
| 15 | unnamed | 15 | structural | header metadata |
| 16 | unnamed | 16 | labelled-addition | Added in candidate label |
| 17 | unnamed | 17 | labelled-addition | Added in candidate label |
| 18 | unnamed | 18 | labelled-addition | Added in candidate label |
| 19 | unnamed | 19 | labelled-addition | Added in candidate label |
| 20 | unnamed | 20 | sourced | host-invocation-provider-routing.md lines 44 and 103 |
| 21 | rewritten | 21 | sourced | text matches legacy up to link rewriting |
| 22 | rewritten | 22 | sourced | text matches legacy up to link rewriting |
| 23 | rewritten | 23 | structural | two navigation links |
| 24 | rewritten | 24 | sourced | legacy migration status note, links retargeted |
| 25 | rewritten | 25 | sourced | text matches legacy up to link rewriting |
| 26 | rewritten | 26 | sourced | text matches legacy up to link rewriting |
| 27 | rewritten | 27 | sourced | text matches legacy up to link rewriting |
| 28 | rewritten | 28 | sourced | text matches legacy up to link rewriting |
| 29 | rewritten | 29 | sourced | text matches legacy up to link rewriting |
| 30 | rewritten | 30 | sourced | text matches legacy up to link rewriting |
| 31 | rewritten | 31 | sourced | text matches legacy up to link rewriting |
| 32 | rewritten | 32 | sourced | text matches legacy up to link rewriting |
| 33 | rewritten | 33 | sourced | text matches legacy up to link rewriting |
| 34 | rewritten | 34 | sourced | text matches legacy up to link rewriting |
| 35 | rewritten | 35 | labelled-addition | Checked status under Restored section with Added in candidate |
| 36 | rewritten | 36 | sourced | text matches legacy up to link rewriting |
| 37 | rewritten | 37 | sourced | text matches legacy up to link rewriting |
| 38 | rewritten | 38 | sourced | text matches legacy up to link rewriting |
| 39 | rewritten | 39 | sourced | text matches legacy up to link rewriting |
| 40 | rewritten | 40 | sourced | text matches legacy up to link rewriting |
| 41 | random | 41 | sourced | text found verbatim in legacy sources |
| 42 | random | 42 | sourced | text found verbatim in legacy sources |
| 43 | random | 43 | sourced | text found verbatim in legacy sources |
| 44 | random | 44 | sourced | text found verbatim in legacy sources |
| 45 | random | 45 | sourced | text found verbatim in legacy sources |
| 46 | random | 46 | sourced | text found verbatim in legacy sources |
| 47 | random | 47 | sourced | text found verbatim in legacy sources |
| 48 | random | 48 | sourced | external-provider-protocol.md line 24 |
| 49 | random | 49 | sourced | text found verbatim in legacy sources |
| 50 | random | 50 | sourced | text found verbatim in legacy sources |

## Counts

| Stratum | sourced | structural | labelled-addition | invented |
|---|---|---|---|---|
| unnamed | 3 | 7 | 9 | 1 |
| rewritten | 18 | 1 | 1 | 0 |
| random | 10 | 0 | 0 | 0 |

Lead check of block 13: the two sentences (legacy-payload.md becomes historical; spec.md removes legacy-current for Node payload) were already present in docs/platform/host-invocation-routing/roadmap.md at 83d757f4d, before this batch. This batch did not invent them. They are a pre-existing unlabelled roadmap criterion, recorded for the owning roadmap review. Invented-claim defects introduced by this batch: 0, under the stop threshold of 2.

## Red-team disposition

See red-team-3.md: 0 Critical, 0 High, 6 Medium, 4 Low.
- F1 dead restore pointers, F8 broken links: rework, the same fix as the 14 rows.
- F2 false "unavailable in this checkout": rework. The R2, R3 and Observe plans exist under archive/plans/; restore live links.
- F5 stale route counts: truth rework, above.
- F7 HI-I027 wording: rework. Keep never hardcoded and the spec status accepted-not-implemented.
- F3 restored text in fences and F4 owner of restore groups: they follow the frozen area map and literal restoration. Accepted as open Medium; revisit at promotion.
- F6 dropped-010, whether the npm bin removal promise is withdrawn or deferred: routed to the owner.
- F9 and F10: Low, fix opportunistically.
