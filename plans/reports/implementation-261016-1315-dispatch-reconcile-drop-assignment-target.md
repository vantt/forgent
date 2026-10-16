# Dispatch reconcile: drop the dead assignment target

## Proof nothing live uses it
- impact-analysis gate: tool query returned a result but GitNexus index is stale; fell back to grep over src, bin, apps, core, test, docs.
- `assignmentId` / `flags.assignment` in reconcile appeared only in: bin/fgos.mjs plan branch, src/verbs/dispatch/reconcile.mjs, planReconciliation signature + guard. No supported action (clear-cwd-lock, collect-result, repair-projection) read it; apply path takes only `plan`. No Rust host route or contract mentions reconcile `--assignment` (registry already had no such flag after c9026bf8c). `--assignment` remains valid on `dispatch inspect` and `decide` (untouched, live).

## Changes
- reconciliation-planner.mjs: exports `RECONCILE_RUN_REQUIRES_ACTION` (message defined once); `assignmentId` param removed.
- verbs/dispatch/reconcile.mjs: reuses the constant; `assignmentId` removed.
- bin/fgos.mjs: dropped `flags.assignment` plumbing and the duplicate message check (use case throws the same validation error, still exit 4).
- Tests: removed the two `--assignment` CLI tests; titles/regex updated; clear-assignment-claim refusal test kept (no assignmentId arg).
- CHANGELOG: extended the existing Unreleased line.

## `--assignment` behavior
The CLI ignores unrecognized flags generically (`--bogus` is accepted silently), so `--assignment` is now ignored the same way; no special case added. Concern: `plan --assignment x` without `--action` now silently runs the default clear-cwd-lock plan. Strict unknown-flag rejection would be a separate CLI-wide item.

## Tests
60/60 pass: dispatch-operability, dispatch-i08b-remediation, dispatch-reconciliation, command-registry, fgos-help, fgos-verb-help-json. No production-door test file exists; no Rust routes changed.
