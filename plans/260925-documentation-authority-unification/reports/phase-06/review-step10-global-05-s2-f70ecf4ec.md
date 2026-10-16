Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: legacy/missing
Review mode: ordinary
Request commit: f70ecf4ec
Content commit: 498048c1a6651556a0ae977a2871135b5ac7c945

# Review step10 global pending, part 05, legacy/missing author

## Scope and method

Worktree /home/vantt/projects/forgentX-s8-review (detached, f70ecf4ec), read only; P = plans/260925-documentation-authority-unification. Ordinary review, no sensitivity pack (none requested). Every row was read deep: each is a supersede, registry gap, main re-carried or native transition row, or has differing source and target digests, so the A36 sample is the whole population and no row carries a mechanical-only note. Mechanical checks on every row: request entry equals the committed shard row (byte-equal JSON); source unit found at its pin (HEAD for current, the named historical commit for witnesses and retired rows) and its full unit digest recomputed with extractMarkdownConservationUnits equals the row; target unit at HEAD recomputed equal to the row target digest; list-doc-anchors --check on every target anchor ok; last-reviewed digests re-derived at the cited commits; target digests equal step10-global-rebindings.json (currentDigest) and the native tuples equal step10-global-native-reconciliation.json. Independent hand recompute of digests (python, raw lines, no repository extractor) with seed 20261016 over all 24 claims of groups g3 (random.Random(seed).sample, k=6, plus claim_d2f0c6b21e5f8a56ff7fa45ee1ee43c0 so each report has one): claim_383a6485c1aaed79a640a59463183fe8, claim_8c5b5c481eb8db2b10b341da7ba8be18, claim_c9ff2325fe395972a78673fbe0115f9e, claim_ae0d0d7e4327e6bc9dcbd8c737e560c6, claim_414105c9cc17eed2dd829bf494d7e0a3, claim_cdf8c5562fb083bbdccf7d8c03decb7a, claim_d2f0c6b21e5f8a56ff7fa45ee1ee43c0; all source and target digests equal. Scripts only in scratch work-g3/. Never ran fgos, native generation, global D or strict E.

Rows in this report: the single retired-unit entry of request part 05 (entry authorSession null, original record ledger/retired-unit-decisions.json row claim_d2f0c6b21e5f8a56ff7fa45ee1ee43c0, authoredBy codex-session:1@2026-10-10, sourceCommit d23045c2d). Hand-recomputed: that row.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_d2f0c6b21e5f8a56ff7fa45ee1ee43c0 | ok | deep: legacy historical-identity row (original record ledger/retired-unit-decisions.json, authoredBy codex-session:1@2026-10-10, sourceCommit d23045c2d, never reviewed); source heading Component-Outer Boundary Note L311-325 recomputed and hand-recomputed equal, shownSourceText equals the blob section; the history snapshot dispatch-control-plane.md contains the whole blob verbatim (Provenance path at commit and SHA256 equal, snapshot unit 17ecc00c recomputed equal); the earlier concern of an empty current heading is fixed, current architecture/dispatch-control-plane.md Component-Outer Boundary Note now carries the outer-caller rule in engine-free wording; wording: rationale is the shared boilerplate. | 31bba8ab97f45b4bc1d5887c1e8bc77cbdc9adcb4d88a806dbbc45118d2f0a94 | 17ecc00c3ce536698978b4d73be4c5f3a4bf6d3c3055779fb65103314712f96a |

## Notes

- 1 ok, 0 rework, 0 hold.
- The row has been pending since its first commit; its reviewNote text is the earlier liveness-review concern, which this review rechecked against the current file at HEAD (concern resolved, see the row).
- Whole-blob containment: the history file holds the complete d23045c2d blob of architecture/dispatch-control-plane.md inside one fenced literal snapshot (tail after it is only a dated upstream snapshot section), so every unit of that source is conserved at the named literal-snapshot anchor.

Unresolved: none.
