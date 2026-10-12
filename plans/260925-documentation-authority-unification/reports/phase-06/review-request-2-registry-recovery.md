# Bounded registry recovery: Lead review request

Status: READY FOR LEAD REVIEW; Agent Coordination is NOT closed.

Authorization: A29, owner-selected in this session. Author session: codex-session:1@2026-10-11. Ordinary independent review, no per-unit truth receipts and no old-chain reconstruction.

## Read and reproduce

- `owner-answers.md` A29 and A28.
- `closure-fixes-applied.json.boundedRegistryRecovery`: every exact binding, every required digest, all gate argv/results and full native membership differences.
- `working-identity-registry.json`: persisted actual input, 67299125 bytes, SHA256 `9d32ccc33bf7d83fae87ec509731175658b033d52a487502765d8b6f5c3a117f`. Native commit `44acff8ec03a60752495d2bec4a4cf96fb74890a`, bound to the unchanged source tree at `0fb011c8225fa5fb3f0f21a50a7505b90ee11480`.
- `candidate-unverified-agent-coordination.json`: all 326 path/anchor/digest/status records unchanged except 282 claim IDs replaced by their uniquely digest-matched current IDs.
- `ledger/retired-unit-decisions.json`, `ledger/decisions/s2-agent-coordination-closure-successors.json`, `pilot/decisions/b-io-contract.json` and `final-check-b-io-contract.md.json` (the first three paths are relative to the plan directory).

Regenerate with the exact `refreshCommand` in the bounded evidence, using the persisted working registry. Run the four exact recorded `gates[].command` arrays: each of D and scoped strict E against each prior registry. Do not repair a checker, change a baseline or invent a match from a locator.

## Completed exact recovery

The owner/Lead count of 58/65 literal reviewed-witness matches is preserved: 47 have an existing reviewed source disposition, 11 have only an accepted classification receipt. The 47 source dispositions and reviewed target bindings are copied into the corresponding native retired records, retaining their base IDs and all native unit metadata; the proof records both IDs, the exact full digest and committed report pin. The 11 classification receipts do not contain a vocabulary source disposition, so none is invented. Seven retired units have no exact reviewed witness.

Two io-contract unit identities are restored in the registry from their real committed sidecar, with exactly equal path, anchor and full source digest. The post-ed782 reconstruction IDs were never prior-registry identities. The existing approved ledger IDs and all reviewer notes/report pins remain byte-identical; no approval is restamped. Both decision-claim-unknown findings disappear. All eight historical gap rows refer to earlier text: current same-locator text has a different full digest, so none is guessed or silently carried.

All 748 physical retired-ledger rows now seen as live by the base remain intact. The entire ledger and pilot directory trees are unchanged, not merely those 748 rows. No document content, gate, checker, baseline, vocabulary, class, authority or main-checkout change.

## Items needing an independent decision

Fill verdicts and notes in the parser order below. `pending` is an unreviewed template, not an acceptance. A disposition/target cannot be created from a classification label alone: specify the existing vocabulary disposition and genuine retained/current target evidence or leave the unit open. The target-digest `none` is an unset target, not a claimed deletion. For gap rows, the digest is the exact earlier source witness; locate a proven current counterpart only if the bytes really match, otherwise give an explicit new reviewed successor/accounting decision rather than an ID guess.

### Seven retired units without an exact witness

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_0c66785ff0570ba81c898da97006aa04 | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/README.md#unheaded-block-11 | 434f2ba85eec52711ee8ba1a2f0245c5ea1cc3fe62033694b516fea323585c6e | none |
| claim_d407dd5807eec4dfaa767e82cd6b4d08 | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/contracts/README.md#unheaded-block-2 | 881b3c1c170cc040a5a8d337a6b01e6dfd005fb6359db440870bebc5547a54de | none |
| claim_26d04095f1979b804b1b76ec4a90980c | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/contracts/coordination-session.md#unheaded-block-62 | 802b66f9ec2b1f86157899aa5a8dfe9c3bd59cd5079e5a9f7d1d814a9036d31b | none |
| claim_6e984ee6e74bc55d1b09ac340d88ff49 | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/contracts/flow-definition.md#unheaded-block-53 | 4de99f83d8a1c56ecbc463fc40783e575ad5f20f38969479d601fc2a25eefdf5 | none |
| claim_acc839ea1e864470e69a01bb29ac2f82 | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/intent-preservation-ledger.md#unheaded-block-20 | 02b8fca7e65d051090b8a35be366a2c406092166a7bdb3c29b2226ae3fe3fce8 | none |
| claim_8a1f0a1170b002a1a4d1a604a68535d7 | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/proposals/dag-request-scheduler.md#unheaded-block-62 | b517cc7a908387e6aab40f2ea1b8f79f97b2cc87fee16799664d1f990c488a86 | none |
| claim_9045ea7bd495f1194a0d8558469a06f0 | pending | No exact reviewed source-digest or classification-unit-digest witness. Locator: docs/platform/agent-coordination/subcomponents/README.md#unheaded-block-3 | bf823848f462b9800fbacd036324e8bfdc6d193834facc40c04d9c53b2556f20 | none |

### Eleven exact classifications without a reviewed source disposition

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_2d663f66649fd2758f3d44e4a947b4a3 | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/architecture/system-context.md#unheaded-block-4 | d9aa9975e7a7e7fd8eb83bfade4faca1ed15556b2de8b0d6263ace6c199a90d1 | none |
| claim_89a548f857f749e8e749693a7df6dc24 | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-1 | 2205f5b26727e660d0ea709dcff98ca2945f21390710fbcaa186cab1077f0106 | none |
| claim_3e99c9ba0ea20c44649583632fef547f | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-11 | 139e7d6c9a1aee5db7ada78c939e4a7cfdbf3ee3627ede6436c67b2b6cd41ce3 | none |
| claim_4d2603d2448b20475b2a89ca2ea1ad6f | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-2 | 70b7d78dd9dc8e482d6ab7620785c06246f08d32df107530a136d7b96b52cbde | none |
| claim_c3bfb7cedbf63ea5a56ea1ee0f922bf9 | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-3 | c193308a3bd4014028b5d1f7e2e5ebc4651143f85bdf48293b17e6686b0959e9 | none |
| claim_b14e1fac0d2b3e70231806099e41a6e8 | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-4 | 2a1a3dc98841d36b8b13603a532482486a26e96162ac5b4100bfca375c531742 | none |
| claim_86b6325d4e0e524b97f2a9f028ba6795 | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-6 | af63a8a596d7e8a7863c8ce6c858e75816aca25b953b4ffce595ae9d4c969110 | none |
| claim_09fafb51d4b29cf1109cd0c9404b610b | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/proposals/semantic-cli-surface.md#unheaded-block-7 | e9e58fc019a2b0ed9f7539666b99fdfd9f4d0cfa5c892869101fa587f37627b4 | none |
| claim_080089dbbfe4408ec467814ef86f177b | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/subcomponents/README.md#unheaded-block-1 | a2f7f558687369ffb768196c543e8a1c54a307204b674ce222c214b14fd2aa7b | none |
| claim_9cb3ff4b30f2df802bf02a5b064be41a | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/verification/implementation-alignment.md#unheaded-block-1 | af85c8be98a22908a855a0656f011cf997dadcc253abdf85f402c11d33657c4d | none |
| claim_d1a817c37e5972f83310d2c7ca022f3d | pending | Exact bytes match the previously accepted classification, but the witness has no vocabulary source disposition. No classification-to-disposition guess. Locator: docs/platform/agent-coordination/verification/implementation-alignment.md#unheaded-block-3 | 68a20f3a858320cd01857afa7ecdec632ac2f11ec699122e03668688ed5f21e0 | none |

The matching receipts and their original independent verdicts are listed in the evidence. Their bytes are reviewed; a retirement source disposition is not supplied by that review. No classification is loosened or converted implicitly.

### Eight gaps with no exact current path/anchor/digest match

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_4c05b748365100a7b2cb1fd5daa040d2 | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38 | 21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e | none |
| claim_4a4bddcbf0fc4ffa406c51d5df8d5623 | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45 | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 | none |
| claim_8de909df847b8689807abcfe156b704a | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62 | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae | none |
| claim_0c80eeeb663fbf52cd06f23f7ba03a35 | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-31 | 77ec27c0fab5c3dcc3977ae078c9f10c67101aec51293bd8eed29532880e76d2 | none |
| claim_60bdeefbc7b8a3bee3c9ba06e7759dc4 | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-33 | 2e25b357cdeb5ecd739d6f3b5399ab27cf2153b1191d769d9352eda8c525d631 | none |
| claim_f1ff9633d8902c2e7c7063895cdb2e8a | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-4 | b3c903ac85ecab9f28e45c445a2893c61d3427805a3a7f7b867a62938c7a4a00 | none |
| claim_34a87472629191c59355e5f74ef2c2d2 | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-9 | 5861765263e6557b7b6542fbb308cc5bb10cd919f0e521532284054431e54a8e | none |
| claim_e9bb00004e75ca737f2eeca58152063d | pending | The prior gap witness refers to earlier text. The current locator alone cannot prove identity; digest equality fails. Locator: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38 | 4e6e8e73538d11308af160fc087ce34ae665f71430e79dbf0df679f5bc70d7b1 | none |

## Native strict membership difference

Both default D runs are exit 1 with exactly 26 findings: 18 retired dispositions plus eight gaps. Both strict E runs are exit 1 with those 26 plus the three expected open categories: 3 holds / 342 identical-owner exceptions / 997 reverse-open. Neither D=0 nor batch closure is asserted.

A real native API run checks full membership rather than examples: holds are exactly the three held IDs. The mapped 326 list has six entries now considered named, and the native reverse set has 677 additional units (net +671). Those six and all 677 exact path/anchor/digest/current-ID records are in `boundedRegistryRecovery.nativeEquality.result`; do not replace the list with 997 rows or remap accepted receipts outside the bounded authorization just to pass. Review the missing identity/reference continuity and decide the permitted recovery before closure. This is an identity/conservation check, not another 677-unit truth review.

## Stop and next action

Return one committed independent report with the decisions above and an explicit resolution of the native membership difference; any permission beyond exact identity recovery is an owner decision, not a checker patch. Then apply only genuinely approved accounting, regenerate from the persisted registry, rerun both prior-registry D/E and the full identity-set comparison. Close Agent Coordination and start Step 3 only after D=0 and strict equality hold. Until then both are UNPROVEN. Three Rings holds stay; no new archive/delete request, promoted-doc edit or main-spec conflict.

## Follow-up: current-ID binding representation

The 26-row request above is accepted by committed `review-2-registry-recovery.md` at `9855bf6cb` and applied; it is not reopened. D is now zero-fatal against both priors. All 683 units have exact committed classification matches, including the same current locator and complete shown text; no truth re-review is requested.

The remaining blocker is the unchanged executable contract, not evidence search. `check-doc-inventory-gates.mjs:1032` reads a receipt by `receipt.claimId === ref.claimId`; lines 1035–1037 require that ID to be a current inventory row; lines 1116–1118 require a committed Class-column verdict for the same receipt ID. Each of the 683 current IDs differs from its accepted receipt-row ID. The native smoke `node --expose-gc /tmp/phase06/compare-a30-binding.mjs` supplies all current-ID reference projections and closes zero units: 997 before/after, six listed-missing, 677 additional open. Its complete runnable source, real inputs and result are saved in `closure-fixes-applied.json.acceptedRegistryRecovery.nativeBindingProof`.

Please authorize the representation rather than re-review truth. Recommendation: project the existing receipts to current IDs while keeping every locator, full unit digest, complete shown text, class and evidence byte-identical, and attach provenance to the original receipt/report row. Lead commits a matching current-ID Class-column report with the projected receipt commit pin. The author must not produce that independent report or stamp those bindings reviewed before it exists. This satisfies H1 and the unchanged gate without a digest-alias exemption.

The alternative of changing the gate to accept a different report/receipt ID by digest is not authorized and would change the frozen binding contract. Restoring old IDs globally also changes the authorized reconstructed base: 28 currently live prior-registry identities would need accounting, and six lack reviewed retirements. No such change is made.

Current proof: both D exit 0; strict E is still 3 holds / 342 identical-owner exceptions / 997 reverse-open. All 683 associations, their receipt report/row ID/digest and the native full-set differences are in the persisted evidence. Three Rings holds remain; no new archive/delete, promoted-doc edit, main conflict or current-document edit. Close and Step 3 remain UNPROVEN pending an independently committed representation the gate can consume.
