# Review a38 step-02e mapping part 38 (phase9-row-flip)

- Reviewer: `reviewer:sonnet-session:a915c2c1d733c1fe3@2026-10-19`
- Worktree HEAD: `f1965d0a5` (verified, accounting); author `38c1ef8a5`
- Part: 38, population `phase9-row-flip`, 53 entries (17 in docs/platform/README.md, 36 in docs/transitional-switchboard.md), source table `step-02e-census-maps-portals-prose.json`
- Method: resolved all 53 IDs; read each source line in the pinned worktree; checked `cutoverPatch` (null for all 53), `rule` (migration-state), and column position; compared against sibling entries in the same tables and against the parser rule at `step-02e-parser.py` lines 222-226.

## Verdict basis

All 53 entries are cells of a migration-state table (README sections 1-2 "Current source during migration" columns; switchboard Section 2 route/retained/notes cells and Section 3 root-document rows). None carries a path-substitution patch (`cutoverPatch` null, no executable `new`); each is a Phase 9 row-flip with row semantics (status, route and source cells flip together). No generated-file, provenance, writer or authoritative_for cell is in this part. Entries with no `desiredOwner` (02300, 02302, 02305, 02310-02313, 05368, 05370, 05376-05378, 05384, 05390, 05394, 05399) are fine under row-flip since nothing is substituted.

## Entries

| Entry | Location | Reference | Check | Verdict |
|---|---|---|---|---|
| maps-e-02296 | README.md:32 col3 | `docs/platform-foundations.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02297 | README.md:32 col3 | `docs/work-item-lifecycle-vision.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02298 | README.md:33 col3 | `docs/architect/agent-coordination/intent-preservation-ledger.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02299 | README.md:34 col3 | `docs/platform-foundations.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02300 | README.md:34 col3 | `docs/specs/platform-foundations.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02301 | README.md:35 col3 | `docs/architecture-map.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02302 | README.md:36 col3 | `docs/architect/component-boundary` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02304 | README.md:37 col3 | `docs/routing-handoff-contract.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02305 | README.md:37 col3 | `docs/contracts` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02306 | README.md:45 col2 | `docs/specs/runner.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02307 | README.md:46 col2 | `docs/specs/work-state.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02308 | README.md:47 col2 | `docs/specs/distribution.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02309 | README.md:47 col2 | `docs/distribution-vision.md` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02310 | README.md:47 col2 | `docs/architect/packaging-distribution` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02311 | README.md:48 col2 | `docs/architect/host-invocation-routing` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02312 | README.md:50 col2 | `docs/architect/agent-coordination` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-02313 | README.md:63 col2 | `docs/ui-spec` | README "Current source during migration" cell; patch null, action phase9-row-flip | ok |
| maps-e-05352 | transitional-switchboard.md:53 col4 | `docs/specs/system-overview.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05359 | transitional-switchboard.md:55 col4 | `docs/specs/runner.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05360 | transitional-switchboard.md:55 col5 | `docs/routing-handoff-contract.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05361 | transitional-switchboard.md:55 col6 | `docs/specs/runner.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05362 | transitional-switchboard.md:55 col6 | `docs/routing-handoff-contract.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05368 | transitional-switchboard.md:58 col5 | `docs/architect/agent-coordination/**` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05369 | transitional-switchboard.md:58 col5 | `docs/specs/runner.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05370 | transitional-switchboard.md:58 col6 | `docs/architect/agent-coordination/**` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05371 | transitional-switchboard.md:59 col4 | `docs/specs/confinement-authority.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05372 | transitional-switchboard.md:60 col4 | `docs/specs/fgos-plugin.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05373 | transitional-switchboard.md:61 col4 | `docs/specs/herdr-web-dashboard.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05374 | transitional-switchboard.md:61 col5 | `docs/operator-runbook-herdr-cockpit.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05375 | transitional-switchboard.md:61 col5 | `docs/specs/runner.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05376 | transitional-switchboard.md:62 col4 | `docs/specs/enduser-docs-authoring.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05377 | transitional-switchboard.md:62 col4 | `docs/specs/enduser-docs-index.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05378 | transitional-switchboard.md:62 col5 | `docs/doc-registry.md`+ | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05379 | transitional-switchboard.md:63 col4 | `docs/specs/decision-citation-drift.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05380 | transitional-switchboard.md:64 col4 | `docs/specs/distillery.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05381 | transitional-switchboard.md:65 col4 | `docs/specs/observe.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05382 | transitional-switchboard.md:66 col4 | `docs/architect/domainization/README.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05383 | transitional-switchboard.md:67 col4 | `docs/ui-spec/00-overview.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05384 | transitional-switchboard.md:67 col4 | `docs/ui-spec/**` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05385 | transitional-switchboard.md:68 col4 | `docs/coexistence.md` | switchboard Section 2 route/retained/notes cell; patch null, action phase9-row-flip | ok |
| maps-e-05388 | transitional-switchboard.md:75 col1 | `docs/README.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05389 | transitional-switchboard.md:76 col1 | `docs/architecture-map.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05390 | transitional-switchboard.md:77 col1 | `docs/backlog.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05391 | transitional-switchboard.md:78 col1 | `docs/coexistence.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05393 | transitional-switchboard.md:80 col1 | `docs/doc-governance.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05394 | transitional-switchboard.md:81 col1 | `docs/doc-registry.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05395 | transitional-switchboard.md:82 col1 | `docs/id-systems-audit.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05396 | transitional-switchboard.md:83 col1 | `docs/io-contract.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05397 | transitional-switchboard.md:84 col1 | `docs/operator-runbook-herdr-cockpit.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05398 | transitional-switchboard.md:85 col1 | `docs/platform-foundations.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05399 | transitional-switchboard.md:86 col1 | `docs/reading-map.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05400 | transitional-switchboard.md:87 col1 | `docs/routing-handoff-contract.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |
| maps-e-05401 | transitional-switchboard.md:88 col1 | `docs/work-item-lifecycle-vision.md` | switchboard Section 3 root-doc row (key cell); patch null, action phase9-row-flip | ok |

## Concern outside this part (classification defect, not an entry defect here)

The same switchboard tables contain 24 state cells classified `preserve` (rule `provenance`, reason "L12-21 preserve source locator/pinned citation/audit/closeout evidence") that are not source locators, pinned citations, audits or closeouts:
`maps-e-05341..05351` (Section 2 rows 50-52, candidate), `maps-e-05353..05358` (row 54, legacy-current Work state, identical in kind to rows 55/59/60 that are in this part), `maps-e-05363..05367` (rows 56-57, promoted; sibling promoted row 58 is row-flip in this part), `maps-e-05386/05387` (row 69, legacy-current Documentation system), `maps-e-05392` (Section 3 row 79 key cell, while the identical-status key cells 05395/05397/05401 are row-flip).
None of those rows matches the parser's text-based provenance predicates (checked: no SHA, "from/at", "historical redirect" or closeout text); the classification can only come from the inherited prior-edge `edgeKind == 'provenance'` branch (`step-02e-parser.py` line 214), which wins over the `migration` branch because `provenance` is tested first. Recommendation to Lead: treat those 24 as rework (reclassify to phase9-row-flip) in whichever part holds them, and fix the generator ordering/inheritance rather than row by row. Spot-checked README rows outside this part: none left as non-flip state cells (README 38-44, 49, 51-62 carry no legacy refs; 02303 `docs/contracts` row 37 and 02314 line 70 are navigation/patch rows, acceptable).

## Totals

- ok: 53
- rework: 0
- needs-Lead-judgment: 0 (the 24 outside-part entries above are flagged as a systemic concern for Lead, not scored here)
