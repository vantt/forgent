# Review step 10 frozen 05 at 62751458b

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16
Review mode: ordinary
Request commit: f1f414b024bb0530caafaf8b2e49292f1220bbef
Content commit: 62751458b22b47e930dc33b8501d07798b91ace3

## Scope and method

Request review-request-step10-frozen-05-62751458b with 1 entries, each a frozen-rationale confirmation (restored L10-2 row in part 5). The request asks for no sensitivity pack; ordinary review, none produced. Read-only worktree f1f414b02 (docs bytes equal 62751458b).

Mechanical checks on every entry (script in my scratch dir): the entry frozenRecord equals the row in step10-frozen-rationales.json; that row equals the committed shard row at HEAD in rationale, source digest, target owner, target anchor and disposition; the entry currentDecision equals the shard row; the source unit digest is recomputed with extractMarkdownConservationUnits from the HEAD file (or the 345f15d95 blob for the four native predecessors) and equals the shard; the target digest is recomputed from the HEAD target; every target and HEAD-source citation passes list-doc-anchors --check (199 citations, 0 failures); the frozen text equals the shard row at 287a22d33 (the content the prior ok verdicts reviewed) so no approval is carried onto changed text; the latest prior report verdict for each claim is ok at the same digests (the only latest rework is the L10-2 row, answered in part 5); the four excludedLatestReworks claims are not frozen and are pending at HEAD with changed rationales.

Reruns from the request header (scratch outputs only): rationale-consistency checker over all shards printed scanned 12895, shards 92, generated 836, legacyFindings 0, generatedFindings 0, ok true; the 490 doc script tests passed 490, failed 0. I did not run the heavy inventory replay, verify, ownership and link replay chain (needs 4 GB and is shared by every group); those are outside the frozen-row question and are not approved here.

A36: every row has an ordinary verdict and the mechanical checks. Seed 20261016 (python random.Random, sample of 24 from the 116 non-L10-2 frozen rows) plus the six deliberate rows (four native predecessors, frozen-117, frozen-102) plus every Weak-exact and Judgment row, every row of parts 3 to 5 and the L10-2 row: 50 rows read in full across all parts, 1 in this part. Sampled ids: dadecacb, f1507b50, e68c14be, 0dd6189a, b1c9fa89, 46633163, 4063855a, 2d27908b, 427e36a5, 99fa84ee, 9dd28187, ac684976, c0adce3f, 4e04420f, 386a8c90, 69cd8997, 7baf6e69, 9baec27c, 22c44c85, 12e5db9c, c0f15780, 9974f737, ebfb0421, aa501f53. 0 deep rows needed rework, so no escalation to the whole set.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_5c520fcb1a68ba27e2093341834258c7 | ok | deep: L10-2 rationale read in full against the facts: pinned registry blob cc945a07 reproduces old digest 938342cd for the historical two-line unit (AGENTS.md lines 146-147 at the pin); both quoted lines are verbatim; HEAD AGENTS.md block-22 (line 152) and block-24 (line 156) recompute to b093c6fb and e4e33c14 as named; claim_bfd24ffa and claim_2ae81c7b exist at those anchors and the 2ae81c7b row in s5-root-boundary-sync.json is byte-identical at every commit from aecdc30aa to HEAD; residual file sha256 d4bd139d and AGENTS.md sha256 47f3a4e5 (equal at 59b9b7087 and HEAD) match; text equals the 5035fed52 rationale; the superseded A34 note and why status is pending are stated; answers the 287a22d33 rework; target none by design | 938342cd7dfcb965b91bb4ab13461c296dbda391d975bca9d1f5e296e9b75895 | none |

## Notes

- Prior-round reworks answered: the three systemic defects (anchors by position, swapped link cells, false boilerplate) do not occur in these frozen rows; anchors were checked by content digest, and the four promote families differ from their source only in the heading line, with bodies byte-identical.
- Observation only, not a defect: frozen-114 carries a long stacked Judgment rationale (several Package at sentences) and frozen-068 says forty-line direct source body for what is the heading plus 39 body lines; both are true as read and were reviewed ok before.
- Observation only: the 73 rows whose shard digest differs from identity-registry.json are bound by the shard digest, which reproduces from the current source; the compact registry still carries the older digest for them.
- Heading rows in the retired-decision shards translate Vietnamese titles to English and prefix ADR numbers; the rationale states this each time and the earlier reviewed decision stands (verified decisions are not reversed).

Unresolved: none for these rows; inventory replay chain not rerun by this reviewer.
