# Targeted independent truth-fix check

Status: **ready for independent review; author stops here**.

Author session: `codex-session:1@2026-10-10`
Authored binding commit: `e4ff8b44e733ffc85d446d97b6dba6d41d9b9417`
Current-text commit: `f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f`
Independent review being reworked: `947f6169e`
Lead amendments: `db9fa7608`, `c75558172`, `86f7bd0ee` (A21/A22), integrated by the required fast-forward merge.

## Read first and frozen scope

Read `owner-answers.md` A20-A22 and `review-brief.md`, then this request. The owner authorizes exactly the 21 rejected current sections/49 non-ok records plus the 99 consequences listed in `truth-fix-binding-stop.json`. No other current text, carriage, checker/gate/baseline/vocabulary or extractor changes. The accepted 433 section bodies, historical/payload tree and unrelated ledger rows stay unchanged. No tooling re-review, source migration, authority promotion or seeded review in this ordinary targeted check. Checkpoint sensitivity/red-team remains after Step 3, after Step 6 and at Step 10.

## Material and counts

| Material | Scope | Read |
|---|---:|---|
| Corrected current truth | 21 sections / 14 files | `review-pack-2-truth-fix-current.md` and truth ledger/code excerpts |
| Pending source judgments | 90, including 3 existing holds | Native `review-pack-2-truth-fix-source.md` and its bound JSON sidecar |
| Unchanged ordinal binding witnesses | 25 | Supplement full source/target and prior approval pins; re-confirm proof only |
| Pending retired successors | 19 = original 17 + new 2 | Supplement genuine source snapshots and current targets |
| Pending corrected native-content receipts | 14 | Supplement plus committed receipt artifact at `007edbbe7` |

There are 148 review records including the 25 unchanged witnesses, and 147 distinct historical scope IDs: `claim_69b011aac8a371496f54e1c681286bfd` is both an original rejected receipt identity and one of the two genuine retired successors. Its current receipt ID is explicitly traced, not silently dropped. Exactly 99 derived records/reasons are enumerated below and under repairs in `truth-binding-completion.json`; no unrelated rows are added to the check.

Machine inputs: `review-input-2-truth-fix-source.json` is a scoped view, not an active decision shard. Its 115 records comprise the 90 pending source rows plus the 25 retained witnesses. Original physical shard locations are in truth-binding-completion.json.sourcePack.sourceLocations. The supplement sidecar binds all 21 sections, 19 successors, 14 receipts and 25 witnesses.

## Reviewer work and committed outputs

Use a genuinely independent session; the author is session 1 regardless of date. Read every targeted judgment and every changed current-state sentence, verifying against current code or read-only CLI rather than trusting author citations. Distinguish proposal/manual guidance from implemented behavior, especially cancellation/budget, result publication, policy routing, v3/v4 normalization, schema/assessment rules, passive stance and optional dialogue artifacts. The existing carriage pass is accepted and outside this check.

Write and commit these ordinary reports under this directory:

1. `review-2-truth-fix-current.md`: one verdict for each of the 21 changed section keys, with file:line or command evidence.
2. `review-2-truth-fix-source.md`: exactly 90 pending source verdicts, format `Claim | Verdict | Note | Source digest | Target digest`. Use the full native digests from the sidecar, not the raw display SHA fields. Keep the three owner-intent holds held; a true responsibility-model paragraph does not clear the held design decision.
3. `review-2-truth-fix-rebounds.md`: all 25 unchanged witnesses; verify the unique current match, equal ancestry, unchanged shown text and genuine prior report pin. Record findings, not invented fresh approvals.
4. `review-2-truth-fix-retired.md`: exactly 19 pending successor verdicts in the same five-column native-digest format. Sources are sixteen proven stored historical witnesses and three genuinely recomputed parent-of-retirement snapshots; never substitute current candidate text as the historical source.
5. `review-2-truth-fix-classifications.md`: exactly 14 seven-column receipt verdicts: `Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest`. Headers include `Reviewer`, `Author session: codex-session:1@2026-10-10`, `Review mode: ordinary`, and `Receipt commit: 007edbbe75e19a35eb79c90ec626ca352d1d0b76`. Independently recompute the evidence digest from the committed currentEvidence object and check the actual code citations.

Every report names its real reviewer, actual reading method and pack commit `e4ff8b44e733ffc85d446d97b6dba6d41d9b9417`. Commit reports before any verdict application. The author does not self-approve or mark section acceptance now. Applying later: use the existing native ordinary apply path against the exact scoped source view, then merge only its named rows back at sourceLocations; use the same existing scoped historical-source application for the nineteen successors. Do not apply a partial report to an entire mixed shard with out-of-scope pending history rows. Classification closure uses the committed receipt/report pins unchanged.

## Exercised gates and runtime proof

Frozen refresh at the authored commit succeeds; retired projection accounts 3180 rows with zero unaccounted owned retired units. Full D exits 0/fatal 0 under both separate existing prior-registry invocations. Exact commands:

```sh
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/review-doc-inventory.json --identity-registry /tmp/phase06/review-identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --decisions plans/260925-documentation-authority-unification/ledger/decisions --previous-registry plans/260925-documentation-authority-unification/reports/identity-registry.json --json
```

```sh
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/review-doc-inventory.json --identity-registry /tmp/phase06/review-identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --decisions plans/260925-documentation-authority-unification/ledger/decisions --previous-registry plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json --json
```

Both batch-scoped strict E runs exit 1 only for the three honest review/closure categories: 136 unreviewed source rows (90 here and 46 accepted-history pending rows outside this check), 342 identical-owner diagnostics and 693 reverse-open units. All 99 binding fatal findings are gone. Strict batch closure is not claimed and must not be faked with a baseline or approval carry. Complete scoped command arguments and output messages are in truth-binding-completion.json.gates.

Ratchet: 995 legacy files, 25 accounted edits and one accounted addition, exit 0. Placement: 504 files, 503 matches and one unchanged exception, exit 0. Candidate status: 30 inherited findings, zero new Agent Coordination finding; no baseline change. C/I: no authority/instruction-reader link change. Check A: 179 first-parent non-merge commits, zero allowlist violations, only five inherited plus three exact Lead commit/path pairs; 74 history witnesses, 867 payloads and five frozen pins unchanged.

The exact `env -u CLAUDE_CODE_SESSION_ID node --test` command with 51 explicit paths is recorded in the proof: **912/912 pass**, no fail/skip/cancel. Four actual pure/read-only behavior smokes pass **41 assertions**. The real ordinary full-text pack invocation also succeeds (90 pending rows and 25 genuine retained witnesses). No worker launch, state-changing fgOS, or mutating recovery command is run.

Regeneration: run the frozen refresh/retired projection commands from the proof, then the recorded sourcePack.command. The bound pack commit is the authored commit above; for an exact replay, pin that commit rather than restamping the pack to a later report-only HEAD. No inventory .parts/ shards are committed.

## Owner lists and next step

- New archive/delete/history move: none. Promoted portal edits: none. No AGENTS/main/direct legacy write.
- Real runner conflicts: resolved on main by `59cd76672`, already synced. No new truth conflict.
- Three Coordination Rings source holds stay held; prior historical/candidate/successor holds stay held. The separately owned main-side confinement successor remains queued for its future owning batch review, outside this request.
- Out-of-scope accepted-history pending rows, identical-owner groups and other reverse-open units are not brought into this truth-fix check or converted to approvals.

**Next:** independent reviewer commits these narrowly scoped reports. Only then the author applies matching verdicts and follows the phase contract. No next batch, additional main merge, push, PR, ship or authority flip now. Independent acceptance, strict batch closure, live worker/provider/Herdr execution, mutating recovery and non-Node participant integration remain **UNPROVEN**.

## Exactly the 99 derived rows and reasons

| Claim | Kind | Current status | Reason |
|---|---|---|---|
| claim_7c56791bc2955ef63687b7134d2cd053 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_3430135237f992f3c212eab86eb77067 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_57f26b5acbd6bb500ca353f84f486488 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_78524c36c6f57c543377be47620d748c | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_242208b542d4bb24c84796f43f775d4a | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_88cf23510b37d2048b1a578efc2ebb10 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_abb60eb206ce120877cc9c06f826ab57 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_a6f71d465ebccd696428b94ff6f664af | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_6b4789439adfb6eb3b05c85b7ed8f7e0 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_8b79ab2d01c7ce85912eb9f0a25bf3ea | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_e16b56644d520a0fe0a4cd6b40c2459a | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_a86887b78fbc23319db13f3bf4816dd8 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_fad0d749adc5ef611ee344c16b7c661e | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_ab182560a5142f22e010e35a97b115dc | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_194da7d0a9b40e6ba93d40df2b58eaec | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_06019161f3eadb87a1a6fe714da0d8e6 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_a30e0ef293a9486cb916f09f5e245e6a | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_01a4127478b48d367f29f82a84b96736 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_28c4a9baff6ea75b287aa8dba3ed8328 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_23a302d963323aa22a6a9e8ff35aad4e | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_03bcf93f2a1eb641d2b4681160a35ce8 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_74bb68261a023f96104ac9591bdddd6f | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_8e13ccc24f4c4a1a1b985b629e0e3fc3 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_724c421fcb01a0bb978e646aed6b6406 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_f7388f36e2422375b8acf615e169e8c3 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_007ac529305107d794a6aa0752c8fa85 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_9797e67aadf80be198afbc69817c9ea2 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_2ef5d353dab2d57f38906df73e709125 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_11d149c1655503f91604b77b40e6a381 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_5eef231348dcdc9566a29285fce97d59 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_9431e63ec3fc3f89927e22abc8f14a91 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_c0ec44efc62ae8bbbf2c114f387739f5 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_1838df5e7c81c1fa79b336008e3b94bd | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_d645da105a558068961c06e1d47aa9ee | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_50cc0ff73dabd1642950365f358125c2 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_1c155ab462849e3ec4136ee9fa08a218 | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_34284834ad2dd8f5a0fc5a924b8196a5 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_b602d530010f3b2f66ef5485bbff5bcb | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_c37da632abaadd051eff58492f71c8c7 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_c52e0d7342545a9365e507c17a99e946 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_f4f513bfd7ca5fd9708005243a624f95 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_b165c6ca3702ce5335599867e447ae55 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_8b6511ceef7788eaaecfbe1c17de0ccf | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_033a7b790516e8618c276525412173f8 | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_6ed12fe83f43ad052bbcde7a88beee1d | manual-target-rebind | reviewed | unique native stored digest and equal heading ancestry; ordinal anchor updated, prior committed approval remains valid |
| claim_1053b6e0b639f5a2970343078b6e04fe | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_f0435011b158171bddbfd8053eb545be | manual-target-rebind | pending | stored target text or ancestry no longer matches; pending with no approval carry |
| claim_fb0f85ad508f7f857ba4c0963879790a | failed-exact-to-manual | pending | no target digest match |
| claim_234cfe4ee6319f76a699a920567daac2 | failed-exact-to-manual | pending | no target digest match |
| claim_8c81cb12fcc0ff0408e9b5bb594cb1dc | failed-exact-to-manual | pending | no target digest match |
| claim_0b93b00d9997cfc522b58c1c23c32e13 | failed-exact-to-manual | pending | document exact share below one half |
| claim_33c31ee80317cab62b0a67e2175b11c4 | failed-exact-to-manual | pending | document exact share below one half |
| claim_6819e349258c39b7bc588684ccffbeeb | failed-exact-to-manual | pending | document exact share below one half |
| claim_cfddaf4b23e373c8df008820e1039ef1 | failed-exact-to-manual | pending | document exact share below one half |
| claim_6e9fec30d912d2117dd60e3c97167af3 | failed-exact-to-manual | pending | document exact share below one half |
| claim_8be0c987b2b5938bde70a1bfb729697b | failed-exact-to-manual | pending | document exact share below one half |
| claim_66efdc615e979445ad3f85c897f53c81 | failed-exact-to-manual | pending | document exact share below one half |
| claim_66b8226725e683f52e41d5c597a30eda | failed-exact-to-manual | pending | document exact share below one half |
| claim_ea25ab4f530bd1f4c75ebd6035c25722 | failed-exact-to-manual | pending | document exact share below one half |
| claim_704be6b4082d38aaab90bd64bd564377 | failed-exact-to-manual | pending | document exact share below one half |
| claim_0249a02773059932f5a259a140fa4e27 | failed-exact-to-manual | pending | document exact share below one half |
| claim_dfb68fbaa7c62913ba4e9796875daca2 | failed-exact-to-manual | pending | document exact share below one half |
| claim_e28475efc6bae6a85c417aa7dc0b7de9 | failed-exact-to-manual | pending | document exact share below one half |
| claim_2e6406d2e7c7cbb0ac0e31a1ef22ddf7 | failed-exact-to-manual | pending | document exact share below one half |
| claim_f20003299bba9e342d80ae5e4afc0374 | failed-exact-to-manual | pending | document exact share below one half |
| claim_f0e656b4f18fd7ff9bd0ef8f4e424783 | failed-exact-to-manual | pending | document exact share below one half |
| claim_6268e576ecc66d8ca659d3ab43d3c246 | failed-exact-to-manual | pending | document exact share below one half |
| claim_2a888651a79e955c536b3ede362aaf01 | failed-exact-to-manual | pending | document exact share below one half |
| claim_5052319046aa4f42d387388996acb446 | failed-exact-to-manual | pending | document exact share below one half |
| claim_253fc0ba932a9713c024a202caa532df | failed-exact-to-manual | pending | document exact share below one half |
| claim_bc9125989f9d7de4625c7d8f45e3135b | failed-exact-to-manual | pending | document exact share below one half |
| claim_ac1f844239a51859c77c0270265120b6 | failed-exact-to-manual | pending | document exact share below one half |
| claim_5871e754e0a8cdddf95c4e17dbb963be | failed-exact-to-manual | pending | document exact share below one half |
| claim_1d8c785a4f460098ebe3b148f6efcea9 | failed-exact-to-manual | pending | document exact share below one half |
| claim_58f7ad23b121d8888f33b8cd3d2d4fc0 | failed-exact-to-manual | pending | document exact share below one half |
| claim_b92b91d896acc8e12cab661f32b82ec1 | failed-exact-to-manual | pending | document exact share below one half |
| claim_f7c0aa553e9100dbf3647b7e4957130e | failed-exact-to-manual | pending | document exact share below one half |
| claim_b565eca9e1cf36dac6b27e59ae090435 | failed-exact-to-manual | pending | document exact share below one half |
| claim_76aa81473d09688fc99edeb78b4200a2 | failed-exact-to-manual | pending | document exact share below one half |
| claim_87eb6f1855000fbe6716641a538751f2 | failed-exact-to-manual | pending | document exact share below one half |
| claim_45f6b33db66126c89c387d282432b588 | failed-exact-to-manual | pending | document exact share below one half |
| claim_819e886f021031f89a3f30e8c7d48f36 | failed-exact-to-manual | pending | document exact share below one half |
| claim_83408164d5b5b2b16d029d5d23a401fc | failed-exact-to-manual | pending | document exact share below one half |
| claim_b36c9a2774a560c9770ea76cac370981 | failed-exact-to-manual | pending | document exact share below one half |
| claim_75a159feeaecad3b083187df1ee065bb | failed-exact-to-manual | pending | document exact share below one half |
| claim_ee1436df8e38efc584bc20fd458e0ed9 | failed-exact-to-manual | pending | document exact share below one half |
| claim_2c1c075bf865ad25f689a7bcff5a5ae1 | failed-exact-to-manual | pending | document exact share below one half |
| claim_76d46bb8fbb8b5a54c06eb7f5ec5a6d5 | failed-exact-to-manual | pending | document exact share below one half |
| claim_3c83721357bc53cfbbd07bc74ed08855 | failed-exact-to-manual | pending | document exact share below one half |
| claim_046a56df8bafa56b39da741a0ded8235 | failed-exact-to-manual | pending | document exact share below one half |
| claim_237467a67a081ab1728facf6b17e1cd4 | failed-exact-to-manual | pending | document exact share below one half |
| claim_ea510114882c12807ce28686d0365332 | failed-exact-to-manual | pending | document exact share below one half |
| claim_aeca3cda9965168aa5eb28c3b9685a03 | failed-exact-to-manual | pending | document exact share below one half |
| claim_2355b0c098803869b71a5bba7b20a0a0 | failed-exact-to-manual | pending | document exact share below one half |
| claim_cf44ea69b1d788b6a9febc3504c075f1 | failed-exact-to-manual | pending | document exact share below one half |
| claim_925b901f329f4bbe1a1246ea428c4794 | failed-exact-to-manual | pending | no target digest match |
| claim_a3c5dcace145e25b55eeb9dca7a8221e | failed-exact-to-manual | pending | no target digest match |
| claim_69b011aac8a371496f54e1c681286bfd | retired-pending-successor | pending | genuine retired candidate identity from the authorized section correction; A13-shaped pending successor |
| claim_424bbeb8e8fe53a80b03440fb53ae248 | retired-pending-successor | pending | genuine retired candidate identity from the authorized section correction; A13-shaped pending successor |
