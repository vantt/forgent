# Phase 6: Integration, full gates and closing the rows

## Inputs

- The branches of phases 1-5; `plan.md` acceptance criteria.

## Footprint

- `CHANGELOG.md`
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
4. Set `p-iatzcg2gee`, `p-6hqvgokerb`, `p-tyowvhthul` and `p-pv7ha3l5ss` to `done` in `plans/backlog/` and
   `plans/backlog.md`, each citing its owning proof from `plan.md` acceptance.

## Verify

```bash
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261124-2143-head-lifecycle-events
```

All green; `reports/integration.md` holds the live-check output.

## Rollback

Revert the merge commit; set the four rows back to `proposed`.
