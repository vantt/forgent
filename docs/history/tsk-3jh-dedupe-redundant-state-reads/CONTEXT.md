# CONTEXT: dedupe claim-port.mjs's one redundant full-log read

Item: `tsk-3jh`. Feature boundary: eliminate the one genuinely redundant
full-log read in `claim-port.mjs`'s `claimWork` (a `listWork` call
followed by a `readRawEvents` call, both parsing the same file, nothing
mutating between them) — nothing else in this item's scope.

## Locked decisions

**D1 — Scope is exactly the one safe duplicate, not a general caching
layer.** Per `RESEARCH.md`: `moveWork`'s and `registerTool`'s own internal
`rebuildView` reads (inside `withEventsLockAndRefresh`) are the CAS
mechanism itself — reading fresh under the lock to catch a concurrent
writer between the caller's earlier read and this write. These are load-
bearing correctness reads, not redundant, and stay untouched. `addOutcome`
has no pre-read at all (pure append). The only safe removal is `claimWork`'s
own `listWork` + `readRawEvents` pair, both outside any lock, both reading
the identical file with nothing mutating in between.

**D2 — Broader fix (single-writer daemon / structural elimination of the
per-verb full-replay tax) is out of scope, captured separately.** See
`plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md` — a real,
larger architectural proposal discussed with the user, not decided or
scheduled. This item does not block on it, and does not attempt any part
of it.

## Scout evidence

- `src/runner/claim-port.mjs` (the `claimWork` call chain), `src/state/
  store.mjs` (`moveWork:470-513`, `addOutcome:893-899`,
  `registerTool:927+`), `src/state/replay.mjs:30` (`foldEvents`, already
  exported and pure) — all read in full, cited in `RESEARCH.md`.

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
- `plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md` (D2's pointer)

## Outstanding questions

None
