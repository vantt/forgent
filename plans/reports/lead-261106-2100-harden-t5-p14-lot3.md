# HARDEN T5 phase 14, lot 3: pattern catalog, dispatch plan, settlement

Branch `harden/t5-p14-lot3`, one code commit (refactor) plus this report. Behaviour unchanged.

## What changed
- `catalog.mjs` `resolveCollaboration`: split into `selectPattern`, `normalizeRequest` (+ `parseRequestScalars`, `scalarPairsOf`, `parseScalarValue`), `activityDeclaredParamsOf`, `layerParams`, `applyFixedInvariants`, `checkRequestedBounds`, `checkersProvenanceOf`, `checkCarrierParams`. Check order, error codes and messages kept.
- `catalog-entries.mjs` `checkCatalog`: split into `checkDeclaredEntries`, `mergeEntry`, `checkShippedOverride`, `checkCustomEntry`, `checkMergedSections`, `checkInvariantForm`; one `flag()` replaces ~60 hand-built problem pushes; `checkLoopSeatCardinality` folded. Problem order unchanged.
- `plan.mjs` `compileDispatchPlan`: `selectorOf`, `planForUnconfiguredWork`, `mcpToolFor`, `policyForPlan`, `planOf` (key order of every plan kept). Dated finding comments replaced by one-line invariants.
- `settlement.mjs` `settleRunOutcome`: `readWorkerArtifacts`, `recordProviderCapacityFault`, `declaredScopeOf`.
- `loops/reviewed.mjs`: shared `roundEntry`, `finish`, `concludeRound` for the history and live paths.
- No export, signature, return shape, error code or message changed. No caller moved. Census regenerated (6 lines).

## Measured (worktree vs base 7055cf874)
| File | Before | After | Table target |
|---|---|---|---|
| catalog.mjs | 581 | 420 | <= 470 |
| catalog-entries.mjs | 752 | 494 | <= 650 |
| loops/reviewed.mjs | 421 | 287 | <= 380 |
| execution lot-3 sum | 1 754 | 1 201 | -250 aimed; got -553 |
| plan.mjs | 705 | 555 | must not grow |
| settlement.mjs | 903 | 895 | must not grow |

Function scan (acorn, execution + dispatch, outside confinement): largest of lot 3's four now below 230 (`resolveCollaboration`, `checkCatalog`, `compileDispatchPlan`, `settleRunOutcome` no longer listed at 230). Watch list unchanged: `interpretRunResult` 293, `executeAssignment` 277, `normalizeRunResultV3` 277.

Surplus of about 300 lines on the execution budget beyond the lot-3 aim: lot 2 may land short by that much and the area still meets 7 000.

## Evidence
- Red/green: refactor only, no new red tests. Focused set (all 20 files of the lot list) 869/869; plus importers (one-door, claim-port, dispatch-execute-effort, loops/index, loops/reviewed, unit-summary, provider-auth-failure, schema-vocabulary, confinement-label, driver-rununit, enumerator-guard, tier-cell, doc-health) 172/172. `git-one-door-scan` 0 undeclared.
- Before/after `compileDispatchPlan` on the same config (old file copied beside new, JSON compared, key order included): executor id, unregistered executor, `--for` known and unknown, needs-soul with and without live task access, `--work` with registered, unregistered and null executor, work without hint: 11/11 identical (incl. `reasonCodes`, `mechanism`, `selector`, thrown messages). No live host here, so not through `fgos dispatch decide`; the `executor-mcp` case threw identically on both (no activated host binary).
- Full suite (`node scripts/run-tests.mjs`, HERDR/CLAUDE unset): 8597 tests, 8564 pass, 1 fail = the known frozen V7n addendum; 0 `run-tests: ERROR` lines. Log `/dev/shm/p14-lot3-full.log`.

## Removed comment groups (live invariant kept in one line)
- plan.mjs: dated "Self-review finding" blocks (selector precedence kept; governance/preflight kept), "H6a/H6b/H7" stories (unregistered-name refusal, capability.unknown, work-unconfigured governance kept), Slice D narrative (policy-for-plan kept).
- settlement.mjs: none removed; scope-coverage comments merged into `declaredScopeOf`.
- catalog.mjs / reviewed.mjs: step labels only.

## Tests retired
None. No test edited.

## Deviations / items for others
- Settlement is net -8, not larger: helper signatures cost lines, offset by log-read and call compaction.
- Rust smoke (`fgos run` direct seat) not run here; behaviour-only JS refactor in `decide`, patterns, settlement.

Status: DONE
Summary: Four functions cut well below 300 lines, catalog files and reviewed loop down 553 lines, plan -150, settlement -8; focused, importer and full suites green except the known V7n test.
