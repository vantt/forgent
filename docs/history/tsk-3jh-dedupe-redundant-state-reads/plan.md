# Plan: dedupe claimWork's one redundant read

Item: `tsk-3jh`. Mode: **tiny** — one file, reorder two existing calls plus
one new import, no split.

## Approach

Per D1: in `src/runner/claim-port.mjs`'s `claimWork`, replace the current
`const view = listWork(dir);` (near the top) plus the later
`const rawEvents = readRawEvents(dir);` with:

```js
const rawEvents = readRawEvents(dir);
const view = foldEvents(rawEvents);
```

reading raw events exactly once and deriving the folded view from that
same array via `foldEvents` (`src/state/replay.mjs`, already exported,
pure — `rebuildView` itself is just `foldEvents(readEvents(logPath))`, so
this produces the byte-identical view `listWork` would have). New import:
`foldEvents` from `../state/replay.mjs`.

File touched: `src/runner/claim-port.mjs` only.

Impact-analysis posture: **degraded** (GitNexus present, stale) — low
actual risk: `foldEvents` is already the exact function `rebuildView`
delegates to for this same computation; this only changes which of two
already-reading call sites does the parse.

## Cases

- **Boundary**: empty log (`readRawEvents` returns `[]`) —
  `foldEvents([])` produces the same empty-view shape `listWork` already
  does on an empty log.
- **Existing behavior unchanged**: `view` carries the exact same shape/
  content as before (same underlying data, same fold function) — every
  downstream use of `view` in `claimWork` (item lookup, `resolveRoot`,
  deps checks) is unaffected.
- **Regression guard**: `test/runner/claim-port.test.mjs`'s existing
  suite must still pass unchanged — it exercises `claimWork` end to end,
  so a wrong fold would surface there.

## Outstanding questions

None
