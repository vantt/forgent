# Review: Specs and ui-spec script-exact spot-check (s8k)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792047735364-5c1a0eb5@2026-10-15
Review mode: ordinary
Request commit: 3c9b16c2c
Content commit: 1276467f37a99d19aff05808d42fafbf40341449

## Scope and method

One entry, script-exact-population, a separate non-source accounting channel; no source verdict is applied. No sensitivity result was requested or fabricated. Worktree read only (detached at 2107c4761); git status was empty before and after. Helper scripts live only in the scratch directory work-s8k.

Mechanical, all 275 rows: parsed the request population and its sidecar (identical); loaded every decision shard under ledger/decisions and matched each claim; read source and target units at the content commit through buildConservationUnitLookup; ran classifyExactCarry per row; compared source blob at the content commit with the blob at the source commit 111adc51f (equal for all 22 sources, though 2 sources, confinement-authority and herdr-web-dashboard, differ from the frozen map blob pin, which step8-evidence already records as drift handled before authoring); checked every markdown target and source anchor with list-doc-anchors --check (273 source and 273 target pass; the 2 file-block targets are non-Markdown and fail only because the CLI parses Markdown, in-process anchors exist and blobs are byte-equal); checked completeness (the other 291 of 566 s8 claims are 260 Weak-exact, 22 Judgment, 9 no-target and none classify Unit-exact).

Sampling (my own seed, not the author's): seed b4df3cfe8c3b9d642befbb5ef1f96550 (16 random bytes, hex), generated here. Method: stratify by source file, which maps one-to-one onto shard; allocation 100 proportional to stratum size by floor plus largest remainder, minimum 1 per stratum, capped at stratum size; within a stratum rows ranked by sha256(seed + "|" + claimId) ascending and the first n taken. No short strata: the two single-row strata (schema json, spec.config.yaml) were taken whole and no stratum needed capping. 100 distinct rows, no duplicates. Full population digest (sha256 of compact JSON array of the 275 population objects in request order) b3c08337fa5a233dd2a3bc0fa62787175c6f17c016bed12e1540ea606331f6a2; entry digest sha256 of compact entry JSON 7be58147bf423513f482c04132e9030540241c15bb9130d121f685bdb0e140c1 (equals the request's source digest).

| Stratum (source file) | Population | Sampled |
|---|---|---|
| docs/specs/confinement-authority.md | 67 | 24 |
| docs/specs/decision-citation-drift.md | 10 | 4 |
| docs/specs/distillery.md | 11 | 4 |
| docs/specs/fgos-plugin.md | 23 | 8 |
| docs/specs/herdr-web-dashboard.md | 24 | 9 |
| docs/specs/observe.md | 10 | 4 |
| docs/ui-spec/00-overview.md | 11 | 4 |
| docs/ui-spec/15-system-events.md | 8 | 3 |
| docs/ui-spec/20-domain-rules.md | 4 | 1 |
| docs/ui-spec/30-states-and-errors.md | 13 | 5 |
| docs/ui-spec/components/C01-item-card.md | 8 | 3 |
| docs/ui-spec/flows/F01-answer-a-parked-question.md | 6 | 2 |
| docs/ui-spec/flows/F02-approve-a-merge.md | 5 | 2 |
| docs/ui-spec/modals/M01-answer-question.md | 6 | 2 |
| docs/ui-spec/modals/M02-approve-merge.md | 7 | 2 |
| docs/ui-spec/modals/M03-add-edit-item.md | 8 | 3 |
| docs/ui-spec/schema/surface-contract.schema.json | 1 | 1 |
| docs/ui-spec/screens/S01-sign-in.md | 9 | 3 |
| docs/ui-spec/screens/S02-taskboard.md | 15 | 5 |
| docs/ui-spec/screens/S03-task-detail.md | 18 | 6 |
| docs/ui-spec/screens/S04-questions-needing-answer.md | 10 | 4 |
| docs/ui-spec/spec.config.yaml | 1 | 1 |

Sampled claim IDs (100): claim_027ad55814e7186aae754658b36a3da4, claim_0380d86ba81fabec2f0826967ca3371e, claim_0625608d3d14292eee1a9c772fdf2943, claim_093b3e6a5b56f2219f9056058964c884, claim_109add81bb924e6eee91fd71970cb736, claim_148f80fabb2860c02f3ecaae066d0dd9, claim_1528d6ae51b240a56a0e797f2791de5f, claim_1538dad17e4fa44207a7f70dc2ca7b55, claim_18f82ecfa8ca710243b4a9e2e4009871, claim_1b33df3ee3004adf514f1532e32002cc, claim_1d369d57f0c92d6946fd444b3c185ee9, claim_261fd234537163e9c306c0990de2cccb, claim_26c0a04e72c06c15be9a007f50fd312b, claim_28445ce7abe834f5e2bccedbe9b8889e, claim_2cc8f26dc0394eb2b7b92cc169beb784, claim_3048b1128d4d98dc6ee07aba2324c3b8, claim_31e7045fdfec6efddb4c1ba1c5c9d667, claim_32b42cc343ea5bed231dbfd43ef4b433, claim_34983077687032d7a49ecc61907a6806, claim_3556818f023663dfcad72a90b7782e02, claim_369a407225765e238efb7a418e0a44a5, claim_38f435fc7cb64228e37d157820f6222c, claim_398a2a6235ab1ae2d5264325daf42a5c, claim_45d619262877e3606c6434a80eac0ea7, claim_467d37a7c682201f64cf45145bb77633, claim_46d2aa894a82bd4231e161abc1de795a, claim_4a7fc646586751db12885986313c0350, claim_4e14a24a1ef22e30a058748641d53ec4, claim_4fb38e3e862e3f8fb1353ca7f5c38c87, claim_4fca4420a5f2baea4c37309fdc4f7555, claim_5176afd2c7a6b5cf980c6ea133419f9e, claim_54f630d44a33c5624ebeca834cf25ceb, claim_5764f10fa89eb4c38e22ce38a4fb1d6a, claim_579b1a0a3f1da1f0dd4b7cf68df7296c, claim_5877600a52b4cf5568796da3c9044b65, claim_5ae789a08a8f79f3c477af66da37991f, claim_5c674a057e92715ff96b88a32ae0f3f4, claim_5d1a541d049da86b8276fd5bca6a6ca1, claim_5f420ddb02566c9c8a56fbafd6b983e2, claim_5ff80d2788c64645819e4747c97586f3, claim_637b69327d2486602ee428a8b90936c8, claim_692e59d327dfdc4ac060b679ff60a8df, claim_6c75a8d85b8232cfedf1ae86a7eda90a, claim_7519a17d8b83682007e1040f0208a38a, claim_799091fae7d0b1a35a7053b22b43d065, claim_7ff19d6895d1d1e5ea2d56e881259e4d, claim_808f0e82855544f8d09f94e674e44287, claim_8103c8b9283356118e1c5f0126d387da, claim_83dd4d99cd52076452282b5565b0ea22, claim_878e9f5faa08a2977408f49e04af0a7a, claim_879a93675dea691099f52d778198f61a, claim_8c0f0587e917eb027f7904f9d2ec5ab1, claim_8c5e3f2968eb2cc04ee63b53168afadd, claim_8d3e88929e90d8bdcb24dd9051eeac45, claim_8fc8f5d9d754055cd3192f32178f0ef8, claim_91330f2248982f1d6df5071f335b1064, claim_91a51cee06251cc0d253768eb037c821, claim_9235033a167934865ae9528d85596b9d, claim_96fc409e143e98260cfd0695c72fa9a0, claim_974ab4ff20c3e4ef63805c191e7dec9c, claim_98824ede2fb41b178a6a92aed5591b28, claim_99de7a5a1f002e16db2bbcf68045d707, claim_9d863e7c1e4c3983292845628b60e041, claim_9e6f7a0b46212d4b4f91e785385c6ea9, claim_9fe8558f49b4210f3268eaa0a158d8ee, claim_a24a497ee44ed4600b872d298d5be9b2, claim_a299172986d37bd5b62d22f36bbb8779, claim_a2b2774f89a89257732a551b52addc22, claim_a6e14d898be041f4bc809648957380c1, claim_a7dc196cb13fecefb11ee504bd56df4d, claim_af10734d11a45127f86e662a27b20bff, claim_b1dd08c917b5378afded6ca097985955, claim_b78f1258e64bd182d527105502e087be, claim_ba270fdaa4bfeec20ceb3f52d7434e6d, claim_ba9a64fb389def2b21fce816844701ee, claim_c0cd54862f6365e2da2856925bef04c1, claim_c6659cd7ed74e445fe099f5236551cb7, claim_ca6cdaccc48e3ff8da4532ff2fc1fa55, claim_d233fa65d860141b65898ec00d944180, claim_d2d19426a24c78719c9ceb11bf924d33, claim_d3d16b8feb8e452e15fe031621dd4629, claim_d43968f2b346d8eb2c736f9cbf45a837, claim_d6076e6b828e60d4f4461a9fa942abd0, claim_d7150c78cea2f7c841c76814f9dfea0f, claim_d7fa39da9698c447594edefdc44d7ce5, claim_d81f120837aab96ba270276e5090e2e0, claim_d867754cefbf1a753fef272a57b00603, claim_d8df03b03865a0d0968739d00129f0a3, claim_d922400df0f2e4df9838ec9c5670c0df, claim_dd3ad839ba07d233d4389822d192e7a1, claim_de45b6ef8f78c2b53349376df8072f5d, claim_e0c32c0638e0318ea1837d3ba029b40a, claim_e3719cba1ffabfc2412cded7ca37041a, claim_e71250e07f6665431fa08d2d8e0b2dff, claim_e82c910f47e10ea84480da23a9b40d9e, claim_ee445ed3633ffaf1046847c22af0fb7f, claim_ee82a796cb4e8350b49633fc8b827c47, claim_f1aeeff92e7bbf3f52b1cc88896cc41e, claim_f2aac5602a04a55ae1af5277932bafa2, claim_f5414fdf7b56dcc5ecfee0dbbe5b9cd2

Hand recomputation: for all 100 sampled rows I recomputed the source and target unit digest in Python from raw committed lines using the extractor's published formula (sha256 of trimmed raw block; for headings sha256 of heading, level, title, payload digest and following block digest): 100/100 equal, covering 90 unheaded-block, 6 preamble, 2 heading and 2 file-block rows. That is 36% of the population, above the 10% minimum.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| script-exact-population | ok | deep: ok. Independently re-derived all 275 rows: entry digest sha256 of compact entry JSON equals 7be58147...140c1 and the .json sidecar entry is identical; 275 distinct claimIds; every row is in a single s8 shard whose claim is rationale-Unit-exact with equal pack source/target digests, targetOwner, and targetAnchor; classifyExactCarry (run at the content commit, not the pack) returns Unit-exact for 275/275 with source and target text byte-equal, ancestry equal, unique target digest and target (owner,anchor) owned by exactly one claim across every decision shard; 0 of the other 291 s8 claims classify Unit-exact so the population is complete; rationale line ranges and anchors match the committed units for 275/275; 100 stratified rows (seed b4df3cfe8c3b9d642befbb5ef1f96550) had source and target digests hand-recomputed in Python from raw blob lines with 0 mismatches; 12 more sampled units eyeballed incl. both file-block machine files, the 6 heading and preamble rows. Limits: unit boundaries and line ranges come from extractMarkdownConservationUnits so a boundary bug would not show; list-doc-anchors --check cannot resolve the file-block anchor of the 2 non-Markdown files (checked in process and by byte-equal blobs instead); legacy-source eligibility checked by registry blobSha=content blob and non-docs/platform path, not by the inventory item authorityStatus (the doc-inventory parts are not in the worktree); the request shows digests only so no shown text digest exists to recompute; this verdict approves no script rule, source, truth, retirement, promotion or cutover. | 7be58147bf423513f482c04132e9030540241c15bb9130d121f685bdb0e140c1 | none |

## Notes

- All 275 Unit-exact thresholds hold at the content commit: smallest source unit is 41 characters (above 40), every target digest occurs once, source occurrences do not exceed target ones, ancestry is equal, and the per-document exact share is at least one half. 255 of 275 units sit at moved line ranges, which the rationale reports correctly.
- Unit-exact proves unit text and heading ancestry only; it says nothing about stale sentences carried verbatim, which step8-evidence section 4 lists for the later truth pass.
- Concern for the author, not a verdict problem: list-doc-anchors --check cannot confirm the anchors the rationale cites for non-Markdown file-block units; consider teaching it mixed files.

Unresolved: none for this entry.
