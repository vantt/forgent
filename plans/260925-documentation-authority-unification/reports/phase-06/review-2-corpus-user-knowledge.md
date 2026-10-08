Reviewer: reviewer:claude-session:4df9e88c@2026-10-08
Author session: codex-session:1@2026-10-08
Review mode: ordinary
Corpus: user-knowledge
Rule digest: 433e848c90ee0cf9805ceb2d031c714bf64a819f49e7352a0100aa7e9ac35cdd

Rule under review: disposition reclassify-out-of-platform-scope, 515 sources (reviewStatus pending); no claimKind override.
Shard: ledger/decisions/s2-corpus-user-knowledge.json (decision pins 576f9efea72de92d4191eb295afd9b2349bbb99a and d8a250ced380b855d50ce34fa749b50c64c7e45b; tree 5dd84a2ed). Request: reports/phase-06/review-request-2.md.

## Checks

- The rule digest was recomputed independently as sha256 of JSON.stringify({corpus, disposition, rationale[, claimKind]}) over the rule's own fields and equals the digest printed in this report (and in the request).
- Membership: the shard's source list and the rule's source list were compared with the classified inventory (review-doc-inventory, 4,320 items): both equal the set of inventory items with corpus=user-knowledge: 515 = 515, no duplicate. Composition: docs/knowledge 332, docs/explanation 137, docs/how-to 34, docs/reference 7, docs/specs 2, docs/tutorials 1 (.gitkeep), docs/doc-registry.md and docs/enduser-docs-index.json. All are non-authority; 513 are maintained-authority class (an allowed class for this disposition) and 2 are generated.
- Generated files: docs/doc-registry.md and docs/enduser-docs-index.json keep regenerate-from-source (N1, A9, s2-generated-projections.json); the rule governs their claims only. The vocabulary's allowed file classes for reclassify-out-of-platform-scope (maintained-authority, retained-source, history-evidence) cover the other 513.
- The end-user documentation convention explains the membership: 213 of the markdown members carry authoritative_for front matter, the key that the end-user docs index (docs/enduser-docs-index.json) uses; docs/explanation, how-to, reference and knowledge are the Diataxis quadrants fgos-coding-knowledge writes.

## Observations (not blocking the rule)

- Two area specs, docs/specs/enduser-docs-authoring.md and docs/specs/enduser-docs-index.md, are in the corpus through a scoped route of the frozen switchboard. They describe the platform feature that produces the end-user documents, so reclassifying them out of platform scope removes a feature spec from every platform area. The membership is frozen classification, not this batch's choice, but the owner should confirm it.
- Seven docs/reference files (claude-named-executor, coding-worker-contract-shape, dispatch-module-boundaries, fgos-faults-read-surface, runner-capabilities-advise-execute-slots, codebase-scatter-consolidation-roadmap, discussion-quality-rubric) read like internal platform reference rather than end-user learning. They sit in the end-user reference quadrant with authoritative_for front matter, so they were classified by directory; if any of them is treated as a contract by code or skills, it needs an owner in an area batch instead.

## Verdict

| Claim | Verdict | Note |
|---|---|---|
| corpus:user-knowledge | ok | The recomputed rule digest equals the request digest and all 515 members match the inventory's user-knowledge corpus (513 maintained-authority plus 2 generated files that keep regenerate-from-source). The set is the end-user documentation tree (knowledge, explanation, how-to, reference, tutorial and the two derived indexes), so keeping it governed as user knowledge instead of migrating its claims into platform contracts matches the rule's purpose; I accept it while recording the two enduser-docs area specs and seven docs/reference files as owner-visible membership questions. |
