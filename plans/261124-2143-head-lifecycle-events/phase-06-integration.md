# Phase 6: Integration, full gates and closing the rows

## Inputs

- The branches of phases 1-5; `plan.md` acceptance criteria.

## Footprint

- `CHANGELOG.md`, added back to the plan footprint at step 3 (see there)
- `plans/backlog.md`
- `plans/backlog/p-pv7ha3l5ss-head-lifecycle-events-end-of-work-stop-rule-and-lead-slots.md`
- `plans/backlog/p-iatzcg2gee-*.md`, `plans/backlog/p-6hqvgokerb-*.md`, `plans/backlog/p-tyowvhthul-*.md`
- `plans/261124-2143-head-lifecycle-events/reports/integration.md`

## Steps

1. Merge the phase branches on one tree; run `npm test` and `cargo test --workspace`.
2. Live check on this project: start a throwaway lead with `fgos session start lead --name <test name>`, kill its
   agent process, run one watcher tick, and confirm `fgos supervisor queue` shows `lead-ended` for it; then end it
   through `fgos session stop`. Record the commands and output in `reports/integration.md`.
3. `CHANGELOG.md` `## [Unreleased]`: one line each for the end signal, the close of finished heads, and the
   admission rule.
   The plan footprint leaves `CHANGELOG.md` out while another `ready` or `running` plan holds it (on 2026-11-25:
   `261125-1631-agent-context-engine`). When none does, land `CHANGELOG.md` back into the `plan.md` footprint and
   this phase row with `fgos land --paths`, then write the lines; until then park this step in the phase table on
   that plan, while steps 1, 2 and 4 go on.
4. Set `p-iatzcg2gee`, `p-6hqvgokerb`, `p-tyowvhthul` and `p-pv7ha3l5ss` to `done` in `plans/backlog/` and
   `plans/backlog.md`, each citing its owning proof from `plan.md` acceptance.

## Verify

```bash
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261124-2143-head-lifecycle-events
```

All green; `reports/integration.md` holds the live-check output.

This machine runs at most two full test suites at once (memory): run `npm test` and `cargo test --workspace` one
after the other, or together only when no other full suite is running.

## Rollback

Revert the merge commit; set the four rows back to `proposed`.
