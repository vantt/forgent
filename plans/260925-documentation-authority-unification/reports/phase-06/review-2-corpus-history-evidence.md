Reviewer: reviewer:claude-session:4df9e88c@2026-10-08
Author session: codex-session:1@2026-10-08
Review mode: ordinary
Corpus: history-evidence
Rule digest: efa84a36a83aad82772a6d64b71bcc5e7d24d6782aee97e9600a492be1c6088a

Rule under review: disposition retain-as-evidence, claimKind historical-context, 1,705 sources (reviewStatus pending).
Shard: ledger/decisions/s2-corpus-history-evidence.json (decision pins 576f9efea72de92d4191eb295afd9b2349bbb99a and d8a250ced380b855d50ce34fa749b50c64c7e45b; tree 5dd84a2ed). Request: reports/phase-06/review-request-2.md.

## Checks

- The rule digest was recomputed independently as sha256 of JSON.stringify({corpus, disposition, rationale[, claimKind]}) over the rule's own fields and equals the digest printed in this report (and in the request).
- Membership: the shard's source list and the rule's source list were compared with the classified inventory (review-doc-inventory, 4,320 items): both equal the set of inventory items with corpus=history-evidence: 1,705 = 1,705 with no duplicate and no extra path. Composition: docs/history 1,699 files (plan.md 612, iron-law-evidence.md 377, CONTEXT.md 321, RESEARCH.md 275, DISCUSSION.md 39, scout-notes.md 8, others), docs/journals 5, docs/decisions/index.md 1. All 1,705 have authorityStatus non-authority; 1,704 have file class history-evidence and 1 (docs/decisions/index.md) is generated.
- Disposition against the vocabulary: retain-as-evidence requires a rationale and is allowed only for file class history-evidence, which fits the 1,704 members; the generated docs/decisions/index.md keeps regenerate-from-source (owner N1, A9 and s2-generated-projections.json), so the rule is not applied to its file role, only its claims are governed by the corpus rule. claimKind historical-context matches the constitution's history kind.
- Spot checks: read the front matter of the 7 members that declare a status and of a sample of members with authority-style wording (31 members use phrases such as 'canonical for' or 'source of truth' in their first 3,000 characters); all are dated work-item records, not area contracts.

## Observations (not blocking the rule)

- docs/history/core-foundation-domain-boundary/DISCUSSION.md still declares status: open, and 38 other DISCUSSION.md files are living design notes kept by the shaping workflow. Calling them retained evidence is acceptable for conservation, but the owner should know that the corpus freezes their classification as non-authority history.
- The rationale says item classification and the source set are 'rechecked by the gate'; this review rechecked them by hand against the inventory.

## Verdict

| Claim | Verdict | Note |
|---|---|---|
| corpus:history-evidence | ok | I recomputed the rule digest and compared all 1,705 members with the inventory's history-evidence corpus (exact match, 1,704 history-evidence files plus the generated decisions index, which keeps regenerate-from-source). The docs/history and docs/journals records are dated work-item plans, context, research and iron-law evidence with no area-contract role, so retain-as-evidence with claimKind historical-context is correct; only DISCUSSION.md files with open status are noted for the owner. |
