# Review: Step 8 contextual identical-unit group (Behaviors and Operations)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792047735364-5c1a0eb5@2026-10-15
Review mode: ordinary
Request commit: 3c9b16c2c
Content commit: 1276467f37a99d19aff05808d42fafbf40341449

No sensitivity result is requested or supplied (ordinary review, none fabricated). This is a separate non-source accounting channel: the rows below apply no source verdict, approve no truth, retirement, promotion or cutover. Claim cells are entry IDs (or the real claim IDs where the request names them). Source digest cells are the digests printed in the request, recomputed by me; Target digest is none unless the request prints one. Seed for the hand-recomputed digest sample: 8841 (random.Random(8841).sample over the 44 entries of my five requests picked triage-10, triage-03, triage-14, a39-generated-route and generation-4; each recomputed independently with jq -c piped to sha256sum, all equal; the report entry also recomputed). The review worktree was read only at 2107c4761 (docs bytes equal the content commit).

## Scope and method

One entry. I checked the two-member membership against the applied decisions in ledger/decisions/s8-decision-citation-drift-01.json and s8-claude-plugin-01.json (claim IDs, source and target anchors, owners, and that sourceUnitDigest and targetUnitDigest are both 39a803b8...), recomputed that both anchors exist (list-doc-anchors --check ok for both candidates), and read both source sections and both candidate sections in full. The shown JSON equals the sidecar and its sha256 over the compact JSON equals the printed Source digest. Limit: this channel accepts no exception and changes no shared table.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| identical-1 | ok | deep: both members are exactly as listed (claim_293d81b1 to decision-citation-drift spec line 61, claim_3ec4250e to claude-plugin spec line 69, anchor behaviors-operations, H2 at source lines 39 and 47); the section bodies differ in subject, citation-drift has one child Run citation-drift scan with a read-only scan outcome, plugin has per-verb children submit, pick, move, return and so on, so the contextual two-owner accounting is truthful and neither owner can replace the other; the rationale matches what the files say | c2d4d30d80d9dd40cdc7ab0f7529465b9cc54b0e49248747e7ef04416ba89e8b | none |

## Notes

The same heading-only digest also names a Step 4 row (claim_35e55882, distribution.md#behaviors-operations to packaging-distribution, already reviewed, its target digest differs because the heading was carried at H4) and pilot rows. Scoped Step 8 strict E sees only the two members above (native proof shows exactly one duplicate group with these two members), so the request is complete for its scope, but whoever accounts identical-unit exceptions globally should list the Step 4 row too.

Unresolved: none for this entry.
