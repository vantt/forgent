# Global strict-E comparison (L10-6)

`scripts/compare-doc-global-closure.mjs` is a report comparator. It does not alter checkInventory, its exit status, decisions, identities or cutover semantics. Its accepted pre-cutover opens are the exact pending hold IDs, identical-unit digest/owner sets, candidate-list tuple union, and A34 partial-carry identity tuples. All other open categories/fatals fail. A successful comparison with open data reports `strictGreen: false`.

Tests first: step10-helper-red.log records the missing-module failure before implementation; step10-helper-green.log records 7/7 passing behavior tests (overlap dedupe; same-count ID/path/anchor/digest substitutions; unexpected fatal/category/count; hold identity; predecessor partial; identical owner set; incomplete input). A native-shape test subsequently failed before the helper fix: source rows must use sourceUnitDigest (text), whereas registry unitDigest denotes opaque unit identity. The final eight helper tests and review/format regression pass 47/47 (step10-tests-final.log); the real scoped comparison passes. No existing gate/extractor/vocabulary/baseline was changed.

Usage after the native package is generated:

```sh
env -u CLAUDE_CODE_SESSION_ID node scripts/compare-doc-global-closure.mjs --gate /tmp/fgos-work/global-strict.json --actual /tmp/fgos-work/global-applied-rows.json --expected plans/260925-documentation-authority-unification/reports/phase-06/step10-global-closure-expected.json
```

`--gate` is unmodified native strict-E JSON. `--actual` is `{claims, identityGaps}` from the SAME in-memory `applyDecisions` result used by that gate: claims filtered by the exact legacy-source scope, gaps from the returned registry filtered by that same scope. Do not supply raw undecided inventory, filter by expected IDs, replace stale identity, or drop a fatal. `--expected` is the committed set, prepared independently of gate output. Candidate identity fields are claimId/path/anchor/unitDigest; native E does not emit fileStatus, so status eligibility remains the native gate/list-accounting proof, not an inference by this helper. Identical groups use digest plus sorted unique owner paths; partial carries use the four native source identity fields.

The current expected snapshot includes all eight candidate-unverified row arrays (not their unrelated history/known-risk/spec-carrier arrays), deduplicated by the comparator; three Rings holds; explicit identical-unit exception files; 26 partial-carry identities, including both runner predecessor gaps; the root split is now reclassify-out-of-platform-scope. Source files and counts are in `_provenance`. This data turn does NOT claim global equality. The later native run must detect stale lists, undisposed gaps, the dashboard predecessor, changed bindings and any unexpected opens; a disagreement remains a blocker until lawfully resolved. Recompute/review list changes after the docs turn and remove the root partial only after its actual final disposition is independently accepted.

L10-15: the 32 groups outside item 2b’s three kinds stay queued for Phase 7/8. The queue is not a resolution; no global closure is claimed.
