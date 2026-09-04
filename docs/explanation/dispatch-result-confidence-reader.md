---
authoritative_for: the `fgos dispatch-report [id]` read-only CLI verb and `src/report/dispatch-confidence.mjs`, which classify recorded dispatch results into a confidence ladder (`reported` | `legacy-signal` | `inferred` | `missing`) from `.fgos/events.jsonl` + `.fgos/logs/<id>.log` before any telemetry write was added
---

# Reading dispatch result confidence before writing a telemetry field for it

`tsk-1g6` built the production **read surface** for dispatch result
confidence — deliberately before any telemetry write field, per its own
acceptance bar: "Không chỉ ghi field rồi bỏ đó" (don't just write a field
and abandon it). The item depended on `tsk-2tr`, which had already
extracted the `[DONE]`/`[BLOCKED]` token-scan + git-head-delta fallback
logic into a shared ladder helper
(`src/runner/dispatch/result-ladder.mjs`'s `buildDispatchResult`) —
`tsk-1g6` reused that helper rather than re-implementing the token scan a
second time.

## What shipped

- `src/report/dispatch-confidence.mjs` — `classifyDispatchResult({
  logContent, dispatchEvent })` classifies one dispatch's evidence into a
  four-rung confidence ladder:
  - **`reported`** — the executor's own durable `executor.dispatch` event
    carries a real `payload.outcome` (anything other than the
    ladder-helper's `'unsignaled'` sentinel) — a genuine structured
    report, not inference.
  - **`legacy-signal`** — no structured report, but the worker's raw
    stdout (parsed out of the `--- STDOUT ---` log-entry block) contains
    the `[DONE]`/`[BLOCKED]` token, read through `buildDispatchResult`'s
    same extracted scan (backtick-quoted spans stripped first, to avoid a
    false match inside quoted example text).
  - **`inferred`** — a local log exists but the ladder helper's own
    fallback (git head-delta / execution-completion signal) is all that's
    available — genuinely `'unsignaled'`.
  - **`missing`** — no local `.fgos/logs/<id>.log` exists at all, or it's
    empty/unreadable.
  `classifyDispatchConfidence(dir, { id })` is the production entry point:
  resolves `.fgos`, reads `executor.dispatch` events via
  `readAllEventsFromDir`, reads each dispatch's log file, classifies each,
  and returns per-dispatch rows plus a `{ total, reported, 'legacy-signal',
  inferred, missing }` summary count. When `id` is given but no
  `executor.dispatch` event was ever recorded for it, it still checks for
  a log file directly — so an item whose dispatch event never landed
  (event-log-loss shape, tracked separately) can still surface a
  `legacy-signal`/`inferred` read from raw stdout instead of reading as a
  false `missing`.
- A new read-only `fgos dispatch-report [id]` CLI verb registered in
  `src/cli/command-registry.mjs` — no work-item id filters to that one
  dispatch, omitted shows the aggregate summary across all recorded
  dispatches.

## Why read-before-write

The item's own scope line stated it plainly: "Scope: read surface trước,
write telemetry sau hoặc cùng item nếu proof rõ" (read surface first,
telemetry write later or in the same item only if the proof is clear).
Adding a telemetry field with nowhere real to read it back from risks
exactly the abandoned-field failure mode the acceptance bar named — this
item stopped at a working, tested read surface, and left any telemetry
write as a deliberately separate, not-yet-taken next step.

## Verify

`test/runner/dispatch.test.mjs` covers the classifier; the item required
new tests for the reader itself alongside that existing suite, per its own
`verify` line.
