# Iron Law evidence — tsk-66o

## classifyIronLaw result (at approve time)

```json
matchedModules: [bin/fgos.mjs, src/runner/dispatch.mjs, src/runner/frozen-judge.mjs, src/state/store.mjs]
```

`tsk-66o` split into two children (`tsk-3c7`, `tsk-2ig`, D1) and never
carries its own separate implementation diff — its own `verify` command
is the union of both children's, and `fgw/tsk-66o`'s diff to `main` is
exactly the union of `tsk-3c7`'s + `tsk-2ig`'s already-merged commits.
Real failing-before/passing-after proof already exists per child, each
captured from a real scratch git worktree at that child's own parent
commit — no new transcript is fabricated here, only cited:

- `docs/history/tsk-3c7/iron-law-evidence.md` — `bin/fgos.mjs`,
  `src/state/store.mjs` (via `computedSchedule`/`schedule` CLI verb).
- `docs/history/tsk-2ig/iron-law-evidence.md` — `src/runner/dispatch.mjs`,
  `src/runner/frozen-judge.mjs` (via `captureDispatchAttestation`/
  `footprintDiffHits`).

## Test command (root's own recorded `verify`, the union of both)

```bash
grep -q 'computeSchedule\|detectCycles' src/state/graph-metrics.mjs && grep -q 'baseCommit' src/runner/dispatch.mjs && grep -q 'footprintDiffHits' src/runner/frozen-judge.mjs && node --test test/runner/frozen-judge.test.mjs test/runner/dispatch.test.mjs test/state/graph-metrics.test.mjs
```

Run fresh on `fgw/tsk-66o` at `return` time (this same session): 210/210
passing.
