# Phase 13b — Watcher definitions on the extended query grammar

Phase 13 landed the closest honest definitions the Observe grammar allowed. Seven gaps (B to H) are marked "pending
Observe grammar" in `core/watcher/README.md`. OPS-METRICS took all eight requested features into its phase 17 "query
grammar for the supervisor's definitions" (agreed 2026-11-18, `reports/request-261118-1521-observe-grammar-for-watcher.md`).
This phase rewrites the pending definitions on those features. Data files and their fixtures only; no Observe code.

## Inputs
- Waits: ops-metrics phase 17 landed on `main` (item 7, `--since/--until` with `--def`, lands first; then 1-6 and 8).
  Step 0 re-reads the landed operator and field names in `packages/observe/rust/src/{query,definition,metrics_cli}`
  and stops with `NEEDS_CONTEXT` if a feature differs from the request file.
- Also waits for the kinds the rewritten definitions read: `fgos.head.state` with its role attr (ops-metrics phase
  11) for `lead-ended` and `watcher-active`. Agreed with lead:OPS-METRICS on 2026-11-18: the attr is `fgos.head.role`
  (`head:<persona>-<name>` or `lead:<LANE>`); `fgos.plan.status` covers only `contract: plan-v1` plans, dedupes rebased
  copies across branches, and emits a creation transition (from absent) for a plan born at a status.
  Landed in ops-metrics phase 11 (0e7c8fc07), with attr `fgos.plan.history` (`complete|truncated`) and kind
  `fgos.plan.activity`. Known cost: a plan-history query takes 30-80 s until the Git lane adds a `walk_changes` door
  call, so definitions over `fgos.plan.*` keep their windows short; step 0 measures one run and records the time.
- The README's pending table and phase 13's spec (`phase-13-trigger-definitions.md`) for the behaviour each must have.

## Footprint
`core/watcher/**`, `packages/supervision/rust/tests/definitions.rs`, `packages/supervision/rust/tests/fixtures/definitions/**`.

## Steps
1. For each pending row (B lead-ended prefix, C wake counts since the last `started`, D own window, E watcher-active
   running plan OR live lead, F overdue factor from `watcher.overdueFactor`, G idle-burn on the tick in force, A one
   row per host with `max:end`), rewrite the definition to phase 13's required behaviour.
2. Replace each fixture that asserted the interim behaviour with one that proves the required behaviour (a matching
   and a non-matching record set per definition); the stability test proves a stable incident `ts` across advancing
   windows.
3. Drop the pending rows from `core/watcher/README.md` and give one row-to-event `ts` rule.

## Verify
- `cargo test -j 4 -p fgos-supervision --test definitions`, clippy `-D warnings`, fmt.
- `fgos metrics query --def core/watcher/definitions --since <t>` runs on the real host (item 7) and returns rows.

## Rollback
Revert the phase commit; phase 13's interim definitions come back.
