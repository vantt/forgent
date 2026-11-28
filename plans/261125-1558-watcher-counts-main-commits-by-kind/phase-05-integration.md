# Phase 5: Integration and full gate

Capability: `code:test`

## Inputs

- The merged branches of phases 1 to 4, in one integrated linked worktree.
- The plan's "Acceptance criteria" and the phase results of phases 2 and 4 (the source timing
  and the live query answer).

## Files this phase may write

- `plans/261125-1558-watcher-counts-main-commits-by-kind/reports/`

## Steps

1. The lead runs the full gate on the integrated tree: `fgos release check --worktree <integrated worktree>`
   (the plan's host step; the lead persona may call it).
2. Run each acceptance-criterion command, 1 to 7, in the integrated worktree and record its
   result.
3. Write one result report under `reports/` with the gate result, each criterion's result, the
   source timing from phase 2 and the live query answer from phase 4. Land it once, with the
   plan's `done` flip.

The event is raised by the activated release's watcher only after a release that carries this
code; that is the normal release path, not a step of this plan.

## Verify

```bash
fgos release check --worktree <integrated worktree>
```

Pass: green on the merged tree, and every acceptance criterion recorded as met.

## Rollback

Nothing to undo. This phase writes only its report.
