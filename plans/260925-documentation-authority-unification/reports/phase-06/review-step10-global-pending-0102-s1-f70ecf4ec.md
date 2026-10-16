# Step 10 global pending review, parts 01 and 02, author session legacy/missing

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: legacy/missing
Review mode: ordinary
Request commit: f70ecf4ec
Content commit: 498048c1a6651556a0ae977a2871135b5ac7c945

## Scope and method

Requests: review-request-step10-global-pending-01.json and review-request-step10-global-pending-02.json (24 entries; this report covers the 1 entries whose row authoredBy is the session above, entry-level authorSession shown per row in the notes where it differs). Ordinary review, no sensitivity result and no pack; none was requested.

Mechanical checks, all rows: shard row equals the request row byte for byte at HEAD f70ecf4ec (0 mismatches over 24); source occurrence recomputed with extractMarkdownConservationUnits at HEAD and, for historical gaps, at the cited witness commit (full digest found in the witness at the stated lines); target direct section recomputed at HEAD and equals the request targetUnitDigest (all 24 where a digest exists); step10-global-rebindings.json lists every row as checked with no drift and step10-global-native-reconciliation.json tuples match working-identity-registry.json for the five native transition rows; anchors checked with list-doc-anchors --check (all ok except the JSON file-block, which has no heading anchor by design). git status in the review worktree is empty.

Deep read: every row in this request is a Rings row, main re-carried row, supersede, registry gap or native transition, so all rows were read in both directions (word-level diff of source or witness text against the target unit, source words missing from target listed, unlabelled target additions checked). No row was left at mechanical level. Digest hand-recompute seed: python random.Random with the string g1-f70ecf4ec-2026-10-16, k=4 over the 24 requested rows in request order, giving claim_16abc69cd658a382c456cdaf23f64d87, claim_d6db58a3090422d42154f240f54c9f5a, claim_a6f43d98b3eebe97802fd01a4ac7863b, claim_4eeb2f406288458e61bad21531966ab1; recomputed by hand with plain sha256 and the heading formula, independently of the extractor, and all matched; the two heading digests of 4eeb2f40 and the Rings source and target headings were all hand-recomputed (4 of 4 headings, 2 of 2 plain units).

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_16abc69cd658a382c456cdaf23f64d87 | rework | deep: original record inspected is the b-files.json registryGaps row (no authoredBy, no reviewStatus, no digests) plus the working-identity-registry gap record (anchor unheaded-block-115, source digest 95a357e2 = the footer sentence 'Đổi quyết định này = supersede bằng record mới'). The footer text itself is fully conserved (7 live footer units at work-state.md 117/121/126/138/144/150/174, each with a reviewed promote row to retired-decision-history.md, equal digest) so no words are lost, but the row binds the wrong occupant: at HEAD unheaded-block-115 is the Quyết định block (digest 6d29bd75, reviewed promote claim_6f1392a7), not the footer, so the rationale line that the live unit at the same anchor carries the claim is false. At d480a05b5 anchor 115 was footer occurrence 2 of 7, which is unheaded-block-121 now. Fix: retarget to docs/specs/work-state.md#unheaded-block-121 (occurrence 2 of 7, equal digest 95a357e2, as the runner footers were fixed), add sourceUnitDigest and targetUnitDigest, authoredBy, reviewStatus pending and a binding-derived rationale. The six reviewed siblings (anchors 111/120/132/138/144/168 pointing at +2 units) show the same stale-anchor pattern and are outside this request. Target digest cell shows the digest of the unit the row names today (6d29bd75). | 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104 | 6d29bd75988172380cec9e3e8c6d38c00ca34fe475aec97c412f338cf6484ba4 |

## Notes

- Counts: 1 rows, 0 ok, 1 rework, 0 hold.
- Original record inspected for the missing author: plans/260925-documentation-authority-unification/pilot/decisions/b-files.json registryGaps, claim_16abc69cd658a382c456cdaf23f64d87, together with the registry gap record in reports/phase-06/working-identity-registry.json. Request entry authorSession is null; the row has no authoredBy, reviewStatus or digests, so it is reviewed as an unapproved legacy gap.
- Footer occurrences at HEAD of docs/specs/work-state.md (digest 95a357e2): unheaded-block-117, 121, 126, 138, 144, 150, 174, each decided by a reviewed promote row in b-decisions-first.json or b-decisions-second.json.

Unresolved: claim_16abc69cd658a382c456cdaf23f64d87 needs the retarget described in its note; the six reviewed sibling gap rows for work-state.md have the same stale anchors and need a Lead decision whether to reopen them.
