# Review step 10 frozen 04 at 62751458b

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792116045118-73cfbb42@2026-10-16
Review mode: ordinary
Request commit: f1f414b024bb0530caafaf8b2e49292f1220bbef
Content commit: 62751458b22b47e930dc33b8501d07798b91ace3

## Scope and method

Request review-request-step10-frozen-04-62751458b with 4 entries, each a frozen-rationale confirmation (restored L10-2 row in part 5). The request asks for no sensitivity pack; ordinary review, none produced. Read-only worktree f1f414b02 (docs bytes equal 62751458b).

Mechanical checks on every entry (script in my scratch dir): the entry frozenRecord equals the row in step10-frozen-rationales.json; that row equals the committed shard row at HEAD in rationale, source digest, target owner, target anchor and disposition; the entry currentDecision equals the shard row; the source unit digest is recomputed with extractMarkdownConservationUnits from the HEAD file (or the 345f15d95 blob for the four native predecessors) and equals the shard; the target digest is recomputed from the HEAD target; every target and HEAD-source citation passes list-doc-anchors --check (199 citations, 0 failures); the frozen text equals the shard row at 287a22d33 (the content the prior ok verdicts reviewed) so no approval is carried onto changed text; the latest prior report verdict for each claim is ok at the same digests (the only latest rework is the L10-2 row, answered in part 5); the four excludedLatestReworks claims are not frozen and are pending at HEAD with changed rationales.

Reruns from the request header (scratch outputs only): rationale-consistency checker over all shards printed scanned 12895, shards 92, generated 836, legacyFindings 0, generatedFindings 0, ok true; the 490 doc script tests passed 490, failed 0. I did not run the heavy inventory replay, verify, ownership and link replay chain (needs 4 GB and is shared by every group); those are outside the frozen-row question and are not approved here.

A36: every row has an ordinary verdict and the mechanical checks. Seed 20261016 (python random.Random, sample of 24 from the 116 non-L10-2 frozen rows) plus the six deliberate rows (four native predecessors, frozen-117, frozen-102) plus every Weak-exact and Judgment row, every row of parts 3 to 5 and the L10-2 row: 50 rows read in full across all parts, 4 in this part. Sampled ids: dadecacb, f1507b50, e68c14be, 0dd6189a, b1c9fa89, 46633163, 4063855a, 2d27908b, 427e36a5, 99fa84ee, 9dd28187, ac684976, c0adce3f, 4e04420f, 386a8c90, 69cd8997, 7baf6e69, 9baec27c, 22c44c85, 12e5db9c, c0f15780, 9974f737, ebfb0421, aa501f53. 0 deep rows needed rework, so no escalation to the whole set.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_d342cec565707124f0b4e7860db2193c | ok | deep: native predecessor vision.md read as word diff of the 345f15d95 unit against the current unit at unheaded-block-11: only the three Preserved from link destinations change (legacy destination restoration); source digest d02d7891 reproduces at 345f15d95 under the predecessor anchor and target digest ae9e5973 equals the current unit; the rationale names the delta only generically (destination restoration or citation correction) but the difference is one of the two and fully recorded in the reconciliation file; shard row did not exist at 287a22d33 so frozen text equals the 9b0526380 row | d02d7891949ca1a0284d509b5c8828e1631138f4d32c20830d5491efb75836c8 | ae9e5973a1589865f79a8daee8e14aa245ce6a8b7a0f7af3978006e63771ebb2 |
| claim_a4ed6ca5cfd26790037b35d1c99373b2 | ok | deep: native predecessor spec.md read as word diff of the 345f15d95 unit against the current unit at unheaded-block-75: only the workspace-topology link destination changes under the same label; source digest 9aefc76d reproduces at 345f15d95 under the predecessor anchor and target digest 19851b06 equals the current unit; the rationale names the delta only generically (destination restoration or citation correction) but the difference is one of the two and fully recorded in the reconciliation file; shard row did not exist at 287a22d33 so frozen text equals the 9b0526380 row | 9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c | 19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a |
| claim_c0f157804addf46fdb20b9c61882794b | ok | deep: native predecessor h-51f5cd7279fd.md read as word diff of the 345f15d95 unit against the current unit at unheaded-block-26: only bin/fgos.mjs:4415,4461 becomes 4415,4503; source digest 0dce2b78 reproduces at 345f15d95 under the predecessor anchor and target digest 0f61fde6 equals the current unit; the rationale names the delta only generically (destination restoration or citation correction) but the difference is one of the two and fully recorded in the reconciliation file; shard row did not exist at 287a22d33 so frozen text equals the 9b0526380 row | 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 | 0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a |
| claim_647a9d5f06216a5e9d6fa267e77cbf03 | ok | deep: native predecessor spec.md read as word diff of the 345f15d95 unit against the current unit at unheaded-block-2: only the pointer pair 4640-4643; 4415-4380 becomes 4414-4417; source digest 35107e63 reproduces at 345f15d95 under the predecessor anchor and target digest c354e335 equals the current unit; the rationale names the delta only generically (destination restoration or citation correction) but the difference is one of the two and fully recorded in the reconciliation file; shard row did not exist at 287a22d33 so frozen text equals the 9b0526380 row | 35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca | c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc |

## Notes

- Prior-round reworks answered: the three systemic defects (anchors by position, swapped link cells, false boilerplate) do not occur in these frozen rows; anchors were checked by content digest, and the four promote families differ from their source only in the heading line, with bodies byte-identical.
- Observation only, not a defect: frozen-114 carries a long stacked Judgment rationale (several Package at sentences) and frozen-068 says forty-line direct source body for what is the heading plus 39 body lines; both are true as read and were reviewed ok before.
- Observation only: the 73 rows whose shard digest differs from identity-registry.json are bound by the shard digest, which reproduces from the current source; the compact registry still carries the older digest for them.
- Heading rows in the retired-decision shards translate Vietnamese titles to English and prefix ADR numbers; the rationale states this each time and the earlier reviewed decision stands (verified decisions are not reversed).

Unresolved: none for these rows; inventory replay chain not rerun by this reviewer.
