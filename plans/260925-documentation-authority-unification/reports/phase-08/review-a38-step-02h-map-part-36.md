# Review a38 step-02h map part 36

- Reviewer: `reviewer:sonnet-session:a3457e86e89e7d926@2026-10-19`
- Reviewed commits: author `6c415d7ce`, accounting `b3d2c2ebd` (worktree detached HEAD verified `b3d2c2ebd4be66848520e3f3f797c6219a610dee`); source text at input commit `f5033e20ad6d6be137217f0a8c17c35b3dd7e8f1`
- Part: 36 of 105, population `phase9-row-flip`, 19 entries, resolved from the index entryIds against `step-02h-census-maps-portals-prose.json` (`entries[].edgeId`)
- Method: deep read of every entry (source line/column at input commit vs `matchedExpression`, table cell role, `rule`, `cutoverAction`, `cutoverPatch`, `parkedReason`, desired owner, mechanical target check); then repo-wide spot-check for migration-state cells left as patch/provenance.
- Checks run over all entries in this part: every `columnStart/EndExclusive` (1-based) matches the quoted expression in the committed source line; every entry has rule `migration-state`, role `reader`, `cutoverAction=phase9-row-flip`, `cutoverPatch=null`, `parkedReason=null`, `writeDestination=null`; every entry sits in a migration-state cell (status/route columns of the switchboard tables, or the Current source / Target doc columns of docs/platform/README.md); no entry carries a path-substitution patch.

| entry | consumer:line | cell | reference -> desired owner | verdict | note |
|---|---|---|---|---|---|
| maps-h-05377 | transitional-switchboard.md:67 | switchboard col 4 | `docs/ui-spec/00-overview.md` -> `docs/ui-spec/00-overview.md` | ok |  |
| maps-h-05378 | transitional-switchboard.md:67 | switchboard col 4 | `docs/ui-spec/**` -> `docs/ui-spec/**` | ok | `docs/ui-spec/**` glob flagged mechanical `missing-target`; row-flip does not use that check and the target stays unchanged; observation only |
| maps-h-05379 | transitional-switchboard.md:68 | switchboard col 4 | `docs/coexistence.md` -> `docs/platform/coexistence/spec.md` | ok |  |
| maps-h-05380 | transitional-switchboard.md:69 | switchboard col 4 | `docs/doc-governance.md` -> `docs/platform/governance.md` | ok |  |
| maps-h-05381 | transitional-switchboard.md:69 | switchboard col 4 | `docs/reading-map.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05382 | transitional-switchboard.md:75 | switchboard col 1 | `docs/README.md` -> `docs/platform/documentation/operations/portals/docs-portal.md` | ok |  |
| maps-h-05383 | transitional-switchboard.md:76 | switchboard col 1 | `docs/architecture-map.md` -> `docs/platform/architecture-map.md` | ok |  |
| maps-h-05384 | transitional-switchboard.md:77 | switchboard col 1 | `docs/backlog.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05385 | transitional-switchboard.md:78 | switchboard col 1 | `docs/coexistence.md` -> `docs/platform/coexistence/spec.md` | ok |  |
| maps-h-05386 | transitional-switchboard.md:79 | switchboard col 1 | `docs/distribution-vision.md` -> `docs/platform/packaging-distribution/history/distribution-vision.md` | ok |  |
| maps-h-05387 | transitional-switchboard.md:80 | switchboard col 1 | `docs/doc-governance.md` -> `docs/platform/governance.md` | ok |  |
| maps-h-05388 | transitional-switchboard.md:81 | switchboard col 1 | `docs/doc-registry.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05389 | transitional-switchboard.md:82 | switchboard col 1 | `docs/id-systems-audit.md` -> `docs/platform/documentation/history/id-systems-audit.md` | ok |  |
| maps-h-05390 | transitional-switchboard.md:83 | switchboard col 1 | `docs/io-contract.md` -> `docs/platform/work-state/contracts/cli-io-contract.md` | ok |  |
| maps-h-05391 | transitional-switchboard.md:84 | switchboard col 1 | `docs/operator-runbook-herdr-cockpit.md` -> `docs/platform/herdr-web-dashboard/operations/operator-runbook.md` | ok |  |
| maps-h-05392 | transitional-switchboard.md:85 | switchboard col 1 | `docs/platform-foundations.md` -> `docs/platform/platform-foundations.md` | ok |  |
| maps-h-05393 | transitional-switchboard.md:86 | switchboard col 1 | `docs/reading-map.md` -> `None` | ok | no successor owner; row flip drops/retains legacy cell, no substitution |
| maps-h-05394 | transitional-switchboard.md:87 | switchboard col 1 | `docs/routing-handoff-contract.md` -> `docs/platform/runner/contracts/routing-handoff.md` | ok |  |
| maps-h-05395 | transitional-switchboard.md:88 | switchboard col 1 | `docs/work-item-lifecycle-vision.md` -> `docs/platform/vision.md` | ok |  |

## Totals

- ok: 19
- rework: 0
- needs-Lead-judgment: 0
- Part verdict for assigned entries: all 19 are migration-state cells correctly set to whole-row flip with no path-substitution patch.

## Cross-part spot-check findings (outside parts 35/36; rework class: migration-state cell classified as provenance/navigation patch)

Class: **migration-state cell not flagged phase9-row-flip (still path-substitution patch or provenance)**. The spot-check was run against `f5033e20a` source text and the census `step-02h-census-maps-portals-prose.json` (rule/cutoverAction per edge).

1. **Candidate copy `docs/platform/documentation/switchboard.md` lines 49-68 and 74-87 (61 edges, `maps-h-03975`..`maps-h-04035`) -> rework.** The 39 table lines are byte-identical to the 61 rows of `docs/transitional-switchboard.md` lines 50-69/75-88 that the census does flag `migration-state` / `phase9-row-flip` (`maps-h-05335`..`05395`). In the candidate copy the same cells are `navigation / cutover-patch-only` (26), `provenance / preserve` (25 total incl. its own mirror lines), `navigation / preserve-pending-target` (4), `retained-reference / preserve` (4), `ui-spec-self-reference / preserve` (2). Zero `migration-state` entries exist for this file. It carries path-substitution patches for status/route cells (e.g. `maps-h-04019` coexistence, `04030` io-contract, `04032` platform-foundations), contradicting `dispositionReason` of the 79 mirror rows. docs/platform/README.md line 79 calls this file the operative transitional switchboard, and the review brief names it as in scope. Expected: all 61 become migration-state / phase9-row-flip with the same row-flip reason (the legacy-tree prose lines 33, 98, 107 stay as they are). Judgment note for Lead only if the candidate file is intended as a verbatim conservation carriage excluded from the flip: its header says "candidate only / Provenance: docs/transitional-switchboard.md at ad2ca83e", but then none of its cells should carry cutover-patch-only either.
2. **`docs/platform/work-state/README.md` lines 73-74 legacy-owner cells: `maps-h-04962` (self-reference-preserved/preserve, `../../specs/work-state.md`) and `maps-h-04963` (navigation/cutover-patch-only, `../../io-contract.md`) -> rework.** Cells labelled `legacy owner` in the Related Files table are migration-state (who currently owns); they should be row-flip, not preserved and not path-substituted. `maps-h-04964` (line 75 `retained source for the platform vision candidate`, provenance/preserve) -> needs-Lead-judgment (same table, retained-source label; row flips when the legacy owner is retired, but it may be treated as provenance).
3. **`docs/platform/host-invocation-routing/history/source-inventory.md` lines 24-27 (`maps-h-04204`..`04213`, status cell `legacy-current source until redirected`) -> needs-Lead-judgment.** Sits in a history/ inventory (preserve under L12-21/22 provenance), but the cell is literally a migration-state statement that Phase 9 will make false.
4. Checked and not defects: `docs/platform/README.md` line 38/62 (`skills`, `ui-spec`) rows reference non-retiring targets only; Decision Surface "Where" cells (`maps-h-02309/02310`, README lines 70-71, `docs/doc-governance.md`) are decision pointers (navigation patch), not status/route cells; `docs/platform/agent-coordination/spec.md:107` `current owner` already targets `../runner/spec.md`.
