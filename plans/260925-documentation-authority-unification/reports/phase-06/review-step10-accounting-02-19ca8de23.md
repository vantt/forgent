# Review step 10 accounting part 2 (re-review)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792090455209-159fbfed@2026-10-16
Review mode: ordinary
Request commit: 62d14764117e92699dfb0d2cd2ef105e2fd441bc
Content commit: 19ca8de23908e161c34c91626e41041b7813167c

## Scope and method

Request reviewed: `review-request-step10-accounting-02-19ca8de23.md` (8 non-claim entries). Read-only worktree at 62d147641; ordinary review, no sensitivity pack. No claim rows, so A36 sampling does not apply; every entry was checked in full and given an item verdict. Target digest cells are the sha256 of the committed artifact at HEAD. Checks are described per row.

## Item table

| Item | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| accounting-030 step10-sync19-predecessor-reconciliation.json | rework | deep: recomputed: the 13 receipts equal the 13 prior finding ids; every before equals the shard row at 19ca8de23; the 6 retained identities equal the working registry units and the 7 gaps equal identityGaps entries; gap after rows equal the HEAD registryGaps rows; the 14 resolved drafts equal HEAD shard rows and registry tuples; beforeSource digests recompute at 2300d6557; defect: six resolved reclassify-out-of-platform-scope drafts (ccf1acf8, c328f1aa, 8e290abb, 690e83ad, c8677c74, 42444c5f) embed a rationale saying the text was carried into a mapped candidate with link rebases, false for retain-in-place rows with no target (AGENTS pair reworked in native-01; the four reading-map rows belong to another part); regenerate after those rows are corrected, rest is accurate | none | e1185a7156c8d73bef893c26d207f864d0e0eaa1f029964e4dc6bf027d57c347 |
| accounting-031 step10-sync19-predecessor-residuals.json | ok | deep: all 4 entries recomputed: old unit digest equals sourceUnitDigest at 2300d6557, residual lines recomputed by line diff against the current successor give 3, 1, 0 and 1 lines with the recorded sha256 (b276baca, 4894dcf4, empty e3b0c442, ca9a59c1), file sha256 bd9b6665 equals the value recorded in the reconciliation, remainders in the HEAD gap rows quote the same shas, A34Accepted correctly false; the pointer to the successor block as primary target matches the pattern already accepted for the runner predecessors | none | bd9b6665e2dff46e6361df6059a046c2d76dc78b163a28489d813ea4db474365 |
| accounting-032 step10-sync19-checks.json | ok | deep: B recomputed (five extractor blobs identical at 19ca8de23 and HEAD); A path scope recomputed for the packaging commit (65 files all inside allowed-paths.json, nothing outside the plan); H reproduced exactly with check-doc-candidate-status --strict (609 docs, candidate 214, 217 checked, 0 findings); I recomputed: link set from the six reader files equals the baseline plus docs/platform/session-identity/spec.md, which comes from upstream AGENTS.md, baseline file untouched, as disclosed; 13 prior findings match; caveat: A historicalOffenders list not re-derived | none | 7d0cfe7bbce4227b5e7d2ac520f980a096d8ebb79d5bf9b98091797bc2e8e261 |
| accounting-033 transitional-switchboard.json (Session Identity route) | ok | deep: diff 19ca8de23 to HEAD is exactly 17 inserted lines, one new area with one route docs/platform/session-identity/**, same shape as the Platform contracts sibling, no existing status touched; classifyDocPath resolves docs/platform/session-identity/spec.md to candidate; strict candidate-status check clean; 24 native units for that spec in the registry (status future) confirm the pin limitation that 19ca8de23 predates the route; entry point file exists; sha256 a43e5a35 matches | none | a43e5a3547df5323a3e2209ae4f18833a8085108ff1da9031022534e496833fa |
| accounting-041 step10-sync19-rebindings.json | ok | deep: reran buildTargetUnitDigestLookup at 19ca8de23 over all decision rows: 9021 claim rows with a target and digest (9024 minus 3 without digest), 0 drift, so rowsRebound 0 is true; caveat for the author: this predicate only compares digest to anchor and cannot see the four s5 rows re-hashed onto the wrong shifted block (see native-01 reworks), so zero rebinds needed does not mean bindings are right | none | f2f718aab5ad815e117648c4c1485b10659128c20080b2bd228740e6499da90a |
| accounting-042 step10-sync19-prior-findings.json | rework | deep: 13 rows equal the 13 prior ids, nativeResult and collection agree with the reconciliation, every currentDecision equals the HEAD shard row; same defect as accounting-030: currentDecision of ccf1acf8 (and the retain-in-place reading-map rows) carries the false mapped-candidate rationale; regenerate once those rows are corrected | none | 103f569022f5693a2d3ff094328f18fff0fca58460ecc013217af82d8c609d95 |
| accounting-043 pilot/decisions/b-decisions-first.json | ok | deep: diff 19ca8de23 to HEAD is the single added authorSession header (codex-session:unit-run-1792089181794-89ae42db@2026-10-16); all 100 rows already carry that authoredBy and are pending, rows unchanged; independent of the reviewer identity | none | bf1e8e37a886a8fae92b514b839c31ed08e206a340caefc0d441d5705ea0018a |
| accounting-044 pilot/decisions/b-decisions-second.json | ok | deep: same header-only change; all 65 rows already carry that authoredBy and are pending, rows unchanged | none | 7a290cb74633f32636b0a425d9d38aca3711c0135ebfb52eea2705ff76aca4b1 |

## Notes

1. Both reworks are one defect, not two: the accounting files faithfully copy shard rows, and six of those rows (retain-in-place, no target) say the text was carried into a mapped candidate with link rebases. Fix the rows, then regenerate 030 and 042.
2. The row-level verdicts for the claims these files describe are in the native-01 report (four wrong-target reworks and the AGENTS rationale reworks).

Unresolved: whether the four reading-map rows are fixed in the same author turn.
