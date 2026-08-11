# CONTEXT: main-checkout lock TTL is shorter than the verify window it must cover

Item: `tsk-4l8`. Feature boundary: `mergeRunnerItem`'s main-checkout lock
(`src/runner/main-checkout-lock.mjs`, acquired once in
`src/runner/merge.mjs:705`) has no refresh/heartbeat while it holds across
`runGoalCheck`'s verify run (`merge.mjs:877`) — a live holder's lock can
read as free once the verify exceeds `DEFAULT_TTL_MS` (180s), letting a
second session's merge interleave with the first's still-in-progress one.
This item now covers both confirming that mechanism (done, see
`RESEARCH.md`) AND designing/implementing a real fix for it — not just
documenting the finding.

## Locked decisions

**D1 — Scope extends past investigation into a real fix, not split into a
separate item.** The mechanism is already fully grounded (`RESEARCH.md`:
every citation in the item's own description checks out against current
source, corroborated by an independent report's own measurement, 184.93s
> 180s). The existing patches this bug is the root cause of (`tsk-18a`,
`tsk-2j9` MERGE_HEAD guards, `merge.mjs:773-806`) treat symptoms, not the
TTL-vs-verify-window gap itself, and no other backlog item currently tracks
that root fix. Asked the user directly (2026-08-11): keep this item
investigation-only and split the fix into a new item, or extend this
item's own scope to include it. **Answered: extend this item — B.**
`fgos-coding-planning` designs and implements the fix as part of tsk-4l8 itself.

## Scout evidence

- `src/runner/main-checkout-lock.mjs:70-90` (TTL history/tension already
  documented in the file's own header comment), `:201-236` (`held =
  pidLive && withinTtl`, no refresh path for a numeric-pid holder whose
  age exceeds `ttlMs`).
- `src/runner/merge.mjs:705` (single acquire, before first git call),
  `:877` (`runGoalCheck` — the long verify runs while holding the same
  lock, with no re-acquire/refresh anywhere in this file's own merge path
  — grepped for `refresh`/`heartbeat`/repeat `acquire`, none found).
- `plans/reports/project-instability-scan-260809-1608-ship-faster-
  stability-report.md:221-239` — independent corroboration, same
  citations, measured `npm test`: 184.93s.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus present. Per `CLAUDE.md`'s three-way framing this reads
  **full**: `impact` MUST be run on `main-checkout-lock.mjs`/`merge.mjs`
  symbols before `fgos-coding-planning`/`fgos-coding-implement` edit them.

## Canonical references

- `docs/history/tsk-4l8-main-checkout-lock-ttl-verify-window/RESEARCH.md`
- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md` (finding 5)
- `docs/history/tsk-1d9-pre-commit-hook-ttl-split/CONTEXT.md` (the sibling TTL constant this fix must not disturb — `HOOK_TTL_MS` is a separate, already-tuned consumer)

## Outstanding questions

None
