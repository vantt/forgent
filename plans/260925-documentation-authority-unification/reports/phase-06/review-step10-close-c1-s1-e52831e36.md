# Step 10 close c1 ordinary review: generated-backlog heading (author session 515f6e95)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792173247556-515f6e95@2026-10-17
Review mode: ordinary
Request commit: e52831e36daf883afb3c9d7dcd3fe479302c44f6
Content commit: 38672e7f157788cbe1b2bf59511bd61046dce660

## Scope and method

One claim row of the request review-request-step10-close.json (entry d01) is authored by this session; entries d02, d03 and all non-claim entries are in the sibling report review-step10-close-c1-s2-e52831e36.md. No sensitivity pack is requested or produced (ordinary review).

Method: `row-auth.mjs` for d01 passed against the committed shard and the persisted registry. Docs/backlog.md at c3614f4d2, bc7358789, 0abc1c533, 38672e7f1 and HEAD were extracted with `git show` and re-digested with extractMarkdownConservationUnits. The heading digest was also recomputed by hand with printf and sha256sum from the section payload and following-block digests (5f190b84 new, 92be08bb old, both reproduced). The anchor `docs/backlog.md#product-backlog` passes list-doc-anchors --check. Sample seed for sampling record: c1-261017-a36 (the pack has 3 decision rows, so all 3 are deep-read across the two reports; minimum-10 rule means all if fewer).

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_f0b2a4079764d68b1102ddddb08776ce | ok | deep: heading Product Backlog of the generated backlog; docs/backlog.md differs c3614f4d2 to HEAD by exactly two added table rows (p-68be2ae3 and p-7eb9e65b, lines 20-21, byte-identical to main commit 0abc1c533 and to bc7358789), the heading digest moves 92be08bb to 5f190b84 only because the heading text digest folds in the section payload that includes the table; I recomputed both by hand; regenerate-from-source with null owner matches the vocabulary (generated, no owner, no authority) and the sibling reviewed rows for block-1 (8311fcb7), done-declined (10c0d318) and block-3 (2d178e51) still equal current unit digests; registry unit claim_f0b2 is retained (n12) with the same ID and new digest, no identity graft; wording: the rationale still says native retained-ID confirmation is pending although n12 now confirms it | 5f190b849165ce8115369ebb112a31b286e85237f5c3dd32f8493cc3cfd93d17 | none |

## Notes

- The row is byte-identical to its before copy in the request (re-carry carries no content change); the only change from the predecessor review state is that the pending state is intentionally kept, no approval is carried.
- Nothing unlabelled is added: the target is none and the file stays a frozen generated projection at its root path.

Unresolved: none.
