# Phase 1: Verify on main and close the row

Capability: `code:test`.

## Inputs

- `plans/261123-0828-head-stop-rotation-bad-measure/plan.md` (acceptance criteria 2 to 6)
- `plans/261123-0828-head-stop-rotation-bad-measure/reports/planner-261123-0829-head-stop-rotation-bad-measure-cause.md`
- `plans/backlog/p-vbv57yc4d5-every-head-stop-rotation-request-is-refused-bad-measure.md`, row `p-vbv57yc4d5` in
  `plans/backlog.md`

## Files it may write

- `plans/261123-0828-head-stop-rotation-bad-measure/reports/` (the phase report)
- `plans/backlog.md` (row `p-vbv57yc4d5` only)
- `plans/backlog/p-vbv57yc4d5-every-head-stop-rotation-request-is-refused-bad-measure.md`

## Steps

1. On current `main`, run the two owning proofs (acceptance criteria 2 and 3). Take the crate names from
   `packages/run-supervisor/rust/Cargo.toml` and `apps/fgos/Cargo.toml`.
2. Re-read the live evidence (acceptance criterion 4):
   - Find the activation time in `.fgos/installation/activation.json`.
   - Run `grep -l bad-measure .fgos/assignments/head-*/runs/*/supervisor.log`. Every hit must have an mtime before
     the activation.
   - Run `cat .fgos/runtime/session-rotation/*/stop-trace.jsonl | jq -r 'select(.decision=="at-or-above-soft") | .outcome'`.
     The output must contain `started`.
3. Run `npm test` and `cargo test --workspace`.
4. Write the phase report with the commands, the pass counts and the evidence lines. Take its name from
   `fgos convention name --kind report --type lead --slug head-stop-rotation-bad-measure-verify`.
5. Set `p-vbv57yc4d5` to `done` in its row file (frontmatter `status: done`, plus a short "Closed by" note that
   names `23d6c85a0` and this plan) and in `plans/backlog.md` (status column `done`, plan column linking
   `261123-0828-head-stop-rotation-bad-measure/plan.md`).
6. Land the report and both backlog files with `fgos land --paths`.

## Verify

The pass condition has two parts:
- Steps 1 to 3 are all green.
- `grep -n p-vbv57yc4d5 plans/backlog.md` shows `done`.

If anything is red or a post-activation `bad-measure` line exists, follow the plan's Risks section: record it and do
not close the row.

## Rollback

Revert the land commit from step 6.
