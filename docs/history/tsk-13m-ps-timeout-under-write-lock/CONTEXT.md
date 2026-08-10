# CONTEXT: bound `ppidOf`'s `execFileSync('ps', ...)` with a timeout

Item: `tsk-13m`. Feature boundary: `ppidOf`
(`src/runner/session-identity.mjs`) calls `execFileSync('ps', ...)` with no
`timeout`, so a hung `ps` can block the single cross-process `events.lock`
indefinitely — contradicting the invariant `resolveWriterIdentity`'s own 3
call sites in `store.mjs` already document ("never blocks the mutation,
D18"). Nothing else in this item's scope.

## Locked decisions

**D1 — Fix is exactly a bounded `timeout` on `ppidOf`'s `execFileSync`
call, not a relocation of `resolveWriterIdentity` relative to the lock.**
Per RESEARCH.md: moving the call outside `withEventsLockAndRefresh` would
help OTHER waiters on the lock but would not itself bound `ps` — only a
timeout does that, and it satisfies D18's literal "never blocks" claim
regardless of where the call sits. `ppidOf`'s existing catch-all already
treats a timeout-induced throw exactly like every other `ps` failure
(absent binary, non-zero exit, unparsable output) — zero new branching.

**D2 — Timeout value: 200ms per `ps` call.** `resolveWriterIdentity`'s hop
loop stops on the FIRST `ppidOf` failure (`session-identity.mjs:138-140`),
so a hang costs at most one timeout period, never up to
`MAX_HOPS` × timeout. 200ms is ~6x the item's own measured normal-case
worst case (31.7ms for the full non-hung 3-hop walk with no session env
var), while staying a full order of magnitude under `events.lock`'s own
2s acquire-timeout (`events.mjs:41-51`) — a genuinely hung `ps` degrades
one caller by 200ms instead of hanging the shared write door
indefinitely; it does not need to match the lock's own budget exactly, only
to stay a bounded, small fraction of it.

**D3 — `tsk-r87`'s broader "events.lock hold-time budget" question stays
out of scope, not folded in.** This item's own description explicitly
points at `tsk-r87` for that separate, wider concern (whether the 2s
timeout itself, or the 65-88ms measured lock-body hold time, need
rethinking) rather than asking this item to resolve it.

## Scout evidence

- `src/runner/session-identity.mjs:96-104` (`ppidOf`), `:129-145`
  (`resolveWriterIdentity`'s hop loop) — read in full, cited in
  RESEARCH.md.
- `src/state/store.mjs:362`, `:524`, `:765` — all 3 call sites, all inside
  `withEventsLockAndRefresh`, all carrying the same "never blocks (D18)"
  comment this item's fix makes literally true.
- `src/state/events.mjs:41-51` — the 2s `events.lock` timeout's own sizing
  rationale ("sub-millisecond to low-ms" holders).
- `test/runner/session-identity.test.mjs` — existing fake-`execFile`
  injection pattern; confirmed a `timeout` field added to the real call's
  options object does not affect any existing test (fakes destructure only
  `(_file, args)`, ignoring the third `options` argument).

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
- `tsk-r87` (separate, wider events.lock-budget item — D3's pointer)

## Outstanding questions

None
