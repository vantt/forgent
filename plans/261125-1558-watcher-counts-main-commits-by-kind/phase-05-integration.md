# Phase 5: Integration and full gate

Capability: `code:test`

## Inputs

- The landed or merged branches of phases 1 to 4.
- The plan's "Acceptance criteria".

## Files this phase may write

- `plans/261125-1558-watcher-counts-main-commits-by-kind/reports/`

## Steps

1. Run the full DoD gate on the combined tree.
2. Run each acceptance-criterion command, from 1 to 6, and record its result.
3. Let one watcher tick run, or run `fgos watcher tick` if a manual tick exists, against this
   repository. Record whether `main-notes-outrun-code` was raised for the current hour and
   with what reason.
4. Write the result report under `reports/`. If it is a local record only, leave it
   untracked. Land it once, with the plan's `done` flip.

## Verify

```bash
npm test
cargo test --workspace
```

Pass: both green on the merged tree.

## Rollback

Nothing to undo. This phase writes only its report.
