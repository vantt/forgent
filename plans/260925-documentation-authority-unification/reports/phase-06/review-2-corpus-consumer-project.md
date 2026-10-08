Reviewer: reviewer:claude-session:4df9e88c@2026-10-08
Author session: codex-session:1@2026-10-08
Review mode: ordinary
Corpus: consumer-project
Rule digest: 47661c744c759ea1ffa1e6d7bee60fffb04b66d89c530c6c5259884990082d59

Rule under review: disposition reclassify-out-of-platform-scope, 40 sources (reviewStatus pending); no claimKind override.
Shard: ledger/decisions/s2-corpus-consumer-project.json (decision pins 576f9efea72de92d4191eb295afd9b2349bbb99a and d8a250ced380b855d50ce34fa749b50c64c7e45b; tree 5dd84a2ed). Request: reports/phase-06/review-request-2.md.

## Checks

- The rule digest was recomputed independently as sha256 of JSON.stringify({corpus, disposition, rationale[, claimKind]}) over the rule's own fields and equals the digest printed in this report (and in the request).
- Membership: the shard's source list and the rule's source list were compared with the classified inventory (review-doc-inventory, 4,320 items): both equal the set of inventory items with corpus=consumer-project: 40 = 40, no duplicate. All 40 live under docs/distillery (comparison matrix, deep dives, intake queue, porting log, reports, 15 source profiles, taxonomy.txt and the state files state/porting/events.jsonl and state.json); all non-authority, file class retained-source, which the vocabulary allows for this disposition.
- The frozen constitution already lists docs/distillery/** as a consumer-project corpus kept unchanged ('target: unchanged (for example docs/distillery/**)'), so the rule applies the existing placement, not a new one.
- Content check: the intake queue, porting log and source profiles are the reference-learning area's records about outside projects (herdr, beads, beehive, superpowers and others); none defines a platform contract.

## Observations (not blocking the rule)

- The corpus name suggests documents of projects that use the platform, while docs/distillery is the platform's own reference-learning workspace; docs/distillery/state/porting/events.jsonl and state.json are live state read and written by the distill tooling. 'Reclassify out of platform scope, unchanged' is still correct, but this mislabel and the live state files are worth a line in the corpus documentation.

## Verdict

| Claim | Verdict | Note |
|---|---|---|
| corpus:consumer-project | ok | The rule digest recomputes to the request value and the 40 members equal the inventory's consumer-project corpus, all under docs/distillery with file class retained-source. The constitution already places docs/distillery/** unchanged as a consumer corpus, and the files are learning records about external projects plus the porting state, none of which defines platform authority, so reclassify-out-of-platform-scope is the right treatment; the only caveat, the name and live state files, is recorded above. |
