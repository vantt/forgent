# Phase 3: Integration

Capability: `code:test`.

## Inputs

- The branches of phases 1 and 2, landed on main or merged into one worktree.
- `plan.md` acceptance criteria.

## Footprint

- `plans/261125-1556-event-store-io-errors-keep-path/reports/` (the gate's result, if a report is written)

## Steps

1. On the combined tree run the full gate (`npm test` rebuilds the host and the addon itself).
2. After activation of a release carrying phase 1, run one fgOS command in a repo whose end trigger fails (or read the
   next real `event-store-end-trigger` record in `.fgos/logs/invocation-faults.jsonl`) and confirm the message names
   the operation and the path. If no real fault appears, the phase 1 test is the proof; say so in the report.
3. Set the plan `status: done` when the gate is green.

## Verify

```bash
npm test
cargo test --workspace
```

Pass: both green.

## Rollback

Nothing to undo in this phase; revert phase 1 or 2 if the gate finds a regression in it.
