# Parser defect diff — 02c / 02e → 02f

Author measurements only; not independent acceptance. Populations overlap. Every measurement predicate, old ID and bounded before/after witness is in `step-02f-review-data.json`. Original 02c/02e artifacts remain unchanged.

## Complete-reference and disposition regressions

| Defect class | 02c before | 02e before | 02f after |
|---|---:|---:|---:|
| partial-reference-patch | 1312 | 1 | 0 |
| corrupted-reference-key | 251 | 4 | 0 |
| split-markdown-link | 168 | 0 | 0 |
| evidence-prefix-or-suffix-patch | 444 | 1 | 0 |
| prefix-inside-longer-token | 95 | 0 | 0 |
| code-token-as-path | 22 | 4 | 0 |
| unexpanded-brace-list | 2 | 0 | 0 |
| provenance-rewritten | 806 | 15 | 0 |
| migration-cell-path-substitution | 90 | 25 | 0 |
| generated-hand-patch | 40 | 0 | 0 |
| operative-read-to-area-portal | 51 | 0 | 0 |
| self-link-patch | 32 | 0 | 0 |
| verbatim-carriage-patch | 4 | 0 | 0 |
| authoritative-for-key-rewrite | 4 | 0 | 0 |
| reading-map-wrong-owner | 30 | 0 | 0 |
| evidence-wrong-mirror | 37 | 3 | 0 |
| live-writer-treated-as-navigation | 16 | 7 | 0 |
| checker-scope-treated-as-navigation | 12 | 0 | 0 |
| external-citation-with-fgos-owner | 4 | 0 | 0 |
| ui-compiler-self-reference-rewritten | 0 | 0 | 0 |
| roadmap-without-semantic-disposition | 4 | 0 | 0 |
| template-placeholder-rewritten | 4 | 1 | 0 |

## Remaining pilot classes

| Defect class | 02c before | 02e before | 02f after |
|---|---:|---:|---:|
| block-context-writer | 16 | 7 | 0 |
| migration-before-inherited-provenance | 90 | 25 | 0 |
| directory-trailing-slash | 444 | 3 | 0 |
| whole-template-placeholder | 0 | 1 | 0 |
| same-path-directory-mirror | 39 | 21 | 0 |
| retained-docs-history | 0 | 8 | 0 |
| deleted-target-successor-note | 3 | 3 | 0 |
| migration-plan-source-locator | 73 | 15 | 0 |
| retired-handoff-checkpoint-write | 2 | 2 | 0 |
| observe-exact-spec | 13 | 12 | 0 |
| carriage-without-alias-and-link-check-exclusion | 512 | 461 | 0 |
| code-snippet-relative-specifier | 0 | 4 | 0 |

The 02c columns use freshly joined 02f contextual populations, so some differ from the prior 02e report. For example, retaining the trailing slash creates 251 old identity disagreements rather than 192; this does not mean 59 newly corrupted paths. Whole-token identities, directory suffixes and semantic dispositions are measured separately. These are detection predicates, not interchangeable error-rate denominators.

The pilot called the migration concern “24” cells, but its explicit ID list contains **25** (11 + 6 + 5 + 2 + 1). All 25 now flip with row semantics. There are 78 row-flip edges overall, previously 53.

The 461 carriage-policy differences are missing explicit exclusion/alias-policy metadata, not 461 erroneous rewrites. Their preserved bytes remain unchanged. The Phase 9 link check must exclude **verbatim carriage regions**, including links with no alias; operative prose remains checked. Pilot part 60 reported 21 pre-existing broken carriage links. No checker or alias was edited here.

A 02c zero for relative code specifiers / whole placeholder topology / bare `docs/history` means the old scanner did not enumerate that source population, not proof of correctness. 02e provides the failing real witnesses for those regressions.

## Differential probes

`step-02f-probes.py` has **44 regressions**, each asserting that an immutable 02c/02e witness or executed 02e parser fails the expected outcome, and 02f passes. It covers all five L12-21 lexical classes, brace expansion, contextual dispositions, every L12-22 class, all four pilot imports and synthetic `import`, `require`, `node -e` snippets. Three invariant guards include ROSTER_SOURCE staying a reader and the already-correct ui-spec contract (no fabricated old failure). The full replay also retains nine syntax probes and eight mutation probes.

## Census conservation

02c: 5,427 edges / 1,018 mappings. 02e: 5,440 / 1,330. 02f: **5,436 / 1,325**, all in the same 1,036 tracked files. Exactly four 02e rows are excluded import specifiers (`maps-e-00637/00638/00648/00649`), with reasons and source spans. Original 02c reconciliation, 197 overlay controls and all downstream mapping/exception/sample/part fingerprints remain replayed.

Class 4 is not started: class-3 native/current-coordinate/adoption traces and the second independent pilot remain open. This turn stops at the existing class boundary.
