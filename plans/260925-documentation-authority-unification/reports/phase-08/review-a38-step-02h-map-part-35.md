# Review a38 step-02h map part 35

- Reviewer: `reviewer:sonnet-session:a3457e86e89e7d926@2026-10-19`
- Reviewed commits: author `6c415d7ce`, accounting `b3d2c2ebd` (worktree detached HEAD verified `b3d2c2ebd4be66848520e3f3f797c6219a610dee`); source text at input commit `f5033e20ad6d6be137217f0a8c17c35b3dd7e8f1`
- Part: 35 of 105, population `phase9-row-flip`, 60 entries, resolved from the index entryIds against `step-02h-census-maps-portals-prose.json` (`entries[].edgeId`)
- Method: deep read of every entry (source line/column at input commit vs `matchedExpression`, table cell role, `rule`, `cutoverAction`, `cutoverPatch`, `parkedReason`, desired owner, mechanical target check); then repo-wide spot-check for migration-state cells left as patch/provenance.
- Checks run over all entries in this part: every `columnStart/EndExclusive` (1-based) matches the quoted expression in the committed source line; every entry has rule `migration-state`, role `reader`, `cutoverAction=phase9-row-flip`, `cutoverPatch=null`, `parkedReason=null`, `writeDestination=null`; every entry sits in a migration-state cell (status/route columns of the switchboard tables, or the Current source / Target doc columns of docs/platform/README.md); no entry carries a path-substitution patch.

| entry | consumer:line | cell | reference -> desired owner | verdict | note |
|---|---|---|---|---|---|
| maps-h-02291 | README.md:32 | README col 3 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-02292 | README.md:32 | README col 3 | `docs/work-item-lifecycle-vision.md` -> `docs/platform/vision.md` | ok |  |
| maps-h-02293 | README.md:33 | README col 3 | `docs/architect/agent-coordination/intent-preservation-ledger.md` -> `docs/platform/agent-coordination/README.md` | ok |  |
| maps-h-02294 | README.md:34 | README col 3 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-02295 | README.md:34 | README col 3 | `docs/specs/platform-foundations.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-02296 | README.md:35 | README col 3 | `docs/architecture-map.md` -> `docs/platform/architecture-map.md` | ok |  |
| maps-h-02297 | README.md:36 | README col 3 | `docs/architect/component-boundary/` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-02298 | README.md:37 | README col 1 | `docs/contracts/` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-02299 | README.md:37 | README col 3 | `docs/routing-handoff-contract.md` -> `docs/platform/runner/contracts/routing-handoff.md` | ok |  |
| maps-h-02300 | README.md:37 | README col 3 | `docs/contracts/` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-02301 | README.md:45 | README col 2 | `docs/specs/runner.md` -> `docs/platform/runner/README.md` | ok |  |
| maps-h-02302 | README.md:46 | README col 2 | `docs/specs/work-state.md` -> `docs/platform/work-state/README.md` | ok |  |
| maps-h-02303 | README.md:47 | README col 2 | `docs/specs/distribution.md` -> `docs/platform/packaging-distribution/README.md` | ok |  |
| maps-h-02304 | README.md:47 | README col 2 | `docs/distribution-vision.md` -> `docs/platform/packaging-distribution/history/distribution-vision.md` | ok |  |
| maps-h-02305 | README.md:47 | README col 2 | `docs/architect/packaging-distribution/` -> `docs/platform/packaging-distribution/` | ok |  |
| maps-h-02306 | README.md:48 | README col 2 | `docs/architect/host-invocation-routing/` -> `docs/platform/host-invocation-routing/` | ok |  |
| maps-h-02307 | README.md:50 | README col 2 | `docs/architect/agent-coordination/` -> `docs/platform/agent-coordination/` | ok |  |
| maps-h-02308 | README.md:63 | README col 2 | `docs/ui-spec/` -> `docs/ui-spec/` | ok |  |
| maps-h-05335 | transitional-switchboard.md:50 | switchboard col 4 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-05336 | transitional-switchboard.md:50 | switchboard col 5 | `docs/specs/platform-foundations.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05337 | transitional-switchboard.md:50 | switchboard col 5 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-05338 | transitional-switchboard.md:50 | switchboard col 6 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-05339 | transitional-switchboard.md:51 | switchboard col 4 | `docs/work-item-lifecycle-vision.md` -> `docs/platform/vision.md` | ok |  |
| maps-h-05340 | transitional-switchboard.md:51 | switchboard col 4 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-05341 | transitional-switchboard.md:51 | switchboard col 5 | `docs/work-item-lifecycle-vision.md` -> `docs/platform/vision.md` | ok |  |
| maps-h-05342 | transitional-switchboard.md:52 | switchboard col 4 | `docs/architecture-map.md` -> `docs/platform/architecture-map.md` | ok |  |
| maps-h-05343 | transitional-switchboard.md:52 | switchboard col 5 | `docs/architect/component-boundary/**` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05344 | transitional-switchboard.md:52 | switchboard col 6 | `docs/architecture-map.md` -> `docs/platform/architecture-map.md` | ok |  |
| maps-h-05345 | transitional-switchboard.md:52 | switchboard col 6 | `docs/architect/component-boundary/` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05346 | transitional-switchboard.md:53 | switchboard col 4 | `docs/specs/system-overview.md` -> `docs/platform/system-overview/spec.md` | ok |  |
| maps-h-05347 | transitional-switchboard.md:54 | switchboard col 4 | `docs/specs/work-state.md` -> `docs/platform/work-state/README.md` | ok |  |
| maps-h-05348 | transitional-switchboard.md:54 | switchboard col 5 | `docs/io-contract.md` -> `docs/platform/work-state/contracts/cli-io-contract.md` | ok |  |
| maps-h-05349 | transitional-switchboard.md:54 | switchboard col 5 | `docs/work-item-lifecycle-vision.md` -> `docs/platform/vision.md` | ok |  |
| maps-h-05350 | transitional-switchboard.md:54 | switchboard col 6 | `docs/specs/work-state.md` -> `docs/platform/work-state/README.md` | ok |  |
| maps-h-05351 | transitional-switchboard.md:54 | switchboard col 6 | `docs/io-contract.md` -> `docs/platform/work-state/contracts/cli-io-contract.md` | ok |  |
| maps-h-05352 | transitional-switchboard.md:54 | switchboard col 6 | `docs/specs/work-state.md` -> `docs/platform/work-state/README.md` | ok |  |
| maps-h-05353 | transitional-switchboard.md:55 | switchboard col 4 | `docs/specs/runner.md` -> `docs/platform/runner/README.md` | ok |  |
| maps-h-05354 | transitional-switchboard.md:55 | switchboard col 5 | `docs/routing-handoff-contract.md` -> `docs/platform/runner/contracts/routing-handoff.md` | ok |  |
| maps-h-05355 | transitional-switchboard.md:55 | switchboard col 6 | `docs/specs/runner.md` -> `docs/platform/runner/README.md` | ok |  |
| maps-h-05356 | transitional-switchboard.md:55 | switchboard col 6 | `docs/routing-handoff-contract.md` -> `docs/platform/runner/contracts/routing-handoff.md` | ok |  |
| maps-h-05357 | transitional-switchboard.md:56 | switchboard col 5 | `docs/specs/distribution.md` -> `docs/platform/packaging-distribution/README.md` | ok |  |
| maps-h-05358 | transitional-switchboard.md:56 | switchboard col 5 | `docs/distribution-vision.md` -> `docs/platform/packaging-distribution/history/distribution-vision.md` | ok |  |
| maps-h-05359 | transitional-switchboard.md:56 | switchboard col 5 | `docs/architect/packaging-distribution/**` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05360 | transitional-switchboard.md:57 | switchboard col 5 | `docs/architect/host-invocation-routing/**` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05361 | transitional-switchboard.md:57 | switchboard col 6 | `docs/architect/host-invocation-routing/**` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05362 | transitional-switchboard.md:58 | switchboard col 5 | `docs/architect/agent-coordination/**` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05363 | transitional-switchboard.md:58 | switchboard col 5 | `docs/specs/runner.md` -> `docs/platform/runner/README.md` | ok |  |
| maps-h-05364 | transitional-switchboard.md:58 | switchboard col 6 | `docs/architect/agent-coordination/**` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05365 | transitional-switchboard.md:59 | switchboard col 4 | `docs/specs/confinement-authority.md` -> `docs/platform/agent-confinement/README.md` | ok |  |
| maps-h-05366 | transitional-switchboard.md:60 | switchboard col 4 | `docs/specs/fgos-plugin.md` -> `docs/platform/claude-plugin/spec.md` | ok |  |
| maps-h-05367 | transitional-switchboard.md:61 | switchboard col 4 | `docs/specs/herdr-web-dashboard.md` -> `docs/platform/herdr-web-dashboard/spec.md` | ok |  |
| maps-h-05368 | transitional-switchboard.md:61 | switchboard col 5 | `docs/operator-runbook-herdr-cockpit.md` -> `docs/platform/herdr-web-dashboard/operations/operator-runbook.md` | ok |  |
| maps-h-05369 | transitional-switchboard.md:61 | switchboard col 5 | `docs/specs/runner.md` -> `docs/platform/runner/README.md` | ok |  |
| maps-h-05370 | transitional-switchboard.md:62 | switchboard col 4 | `docs/specs/enduser-docs-authoring.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05371 | transitional-switchboard.md:62 | switchboard col 4 | `docs/specs/enduser-docs-index.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05372 | transitional-switchboard.md:62 | switchboard col 5 | `docs/doc-registry.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05373 | transitional-switchboard.md:63 | switchboard col 4 | `docs/specs/decision-citation-drift.md` -> `docs/platform/decision-citation-drift/spec.md` | ok |  |
| maps-h-05374 | transitional-switchboard.md:64 | switchboard col 4 | `docs/specs/distillery.md` -> `docs/platform/distillery/spec.md` | ok |  |
| maps-h-05375 | transitional-switchboard.md:65 | switchboard col 4 | `docs/specs/observe.md` -> `docs/platform/observe/spec.md` | ok |  |
| maps-h-05376 | transitional-switchboard.md:66 | switchboard col 4 | `docs/architect/domainization/README.md` -> `docs/platform/domainization/architecture/domainization.md` | ok |  |

## Totals

- ok: 60
- rework: 0
- needs-Lead-judgment: 0
- Part verdict for assigned entries: all 60 are migration-state cells correctly set to whole-row flip with no path-substitution patch.

## Cross-part spot-check findings (outside parts 35/36; rework class: migration-state cell classified as provenance/navigation patch)

Class: **migration-state cell not flagged phase9-row-flip (still path-substitution patch or provenance)**. The spot-check was run against `f5033e20a` source text and the census `step-02h-census-maps-portals-prose.json` (rule/cutoverAction per edge).

1. **Candidate copy `docs/platform/documentation/switchboard.md` lines 49-68 and 74-87 (61 edges, `maps-h-03975`..`maps-h-04035`) -> rework.** The 39 table lines are byte-identical to the 61 rows of `docs/transitional-switchboard.md` lines 50-69/75-88 that the census does flag `migration-state` / `phase9-row-flip` (`maps-h-05335`..`05395`). In the candidate copy the same cells are `navigation / cutover-patch-only` (26), `provenance / preserve` (25 total incl. its own mirror lines), `navigation / preserve-pending-target` (4), `retained-reference / preserve` (4), `ui-spec-self-reference / preserve` (2). Zero `migration-state` entries exist for this file. It carries path-substitution patches for status/route cells (e.g. `maps-h-04019` coexistence, `04030` io-contract, `04032` platform-foundations), contradicting `dispositionReason` of the 79 mirror rows. docs/platform/README.md line 79 calls this file the operative transitional switchboard, and the review brief names it as in scope. Expected: all 61 become migration-state / phase9-row-flip with the same row-flip reason (the legacy-tree prose lines 33, 98, 107 stay as they are). Judgment note for Lead only if the candidate file is intended as a verbatim conservation carriage excluded from the flip: its header says "candidate only / Provenance: docs/transitional-switchboard.md at ad2ca83e", but then none of its cells should carry cutover-patch-only either.
2. **`docs/platform/work-state/README.md` lines 73-74 legacy-owner cells: `maps-h-04962` (self-reference-preserved/preserve, `../../specs/work-state.md`) and `maps-h-04963` (navigation/cutover-patch-only, `../../io-contract.md`) -> rework.** Cells labelled `legacy owner` in the Related Files table are migration-state (who currently owns); they should be row-flip, not preserved and not path-substituted. `maps-h-04964` (line 75 `retained source for the platform vision candidate`, provenance/preserve) -> needs-Lead-judgment (same table, retained-source label; row flips when the legacy owner is retired, but it may be treated as provenance).
3. **`docs/platform/host-invocation-routing/history/source-inventory.md` lines 24-27 (`maps-h-04204`..`04213`, status cell `legacy-current source until redirected`) -> needs-Lead-judgment.** Sits in a history/ inventory (preserve under L12-21/22 provenance), but the cell is literally a migration-state statement that Phase 9 will make false.
4. Checked and not defects: `docs/platform/README.md` line 38/62 (`skills`, `ui-spec`) rows reference non-retiring targets only; Decision Surface "Where" cells (`maps-h-02309/02310`, README lines 70-71, `docs/doc-governance.md`) are decision pointers (navigation patch), not status/route cells; `docs/platform/agent-coordination/spec.md:107` `current owner` already targets `../runner/spec.md`.
