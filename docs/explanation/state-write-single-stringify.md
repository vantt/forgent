---
authoritative_for: writeView/serializeView single-JSON.stringify-per-mutation optimization, state.json write path
---

# `state.json` writes now stringify the view once, not twice

`tsk-37d` closed a residual performance gap: `src/state/store.mjs`'s
`writeView` and `src/state/replay.mjs`'s `viewRevision` each independently
ran a full `JSON.stringify` over largely-overlapping content on every
single fgOS state mutation — `viewRevision(view)` stringified `view` to
compute a hash/revision, then `writeView` separately built `persisted =
{...view, revision, snapshot}` and stringified *that* again for the
actual file write. Two full serialization passes per mutation.

## Scope note: the narrowed remainder of a larger, partly-stale report

This item is explicitly the one surviving claim from an earlier report
(`tsk-5nj`). That report's other two claims — `refreshView` running
outside the lock, and `state.json` being write-only/never read — were
**both since fixed or found false** (`tsk-1q5`, `tsk-4mx`, `tsk-49e`), so
`tsk-5nj` itself was closed `wontfix` as stale and this item re-scoped
narrowly to just the double-stringify claim. The original ~86ms
measurement (`viewRevision` 25.2ms + stringify 17.7ms + write 11.8ms)
came from an old report and was flagged as needing fresh measurement —
this item's own plan explicitly did not assume the old numbers still
held, given how much of `src/state/` had changed since.

## What shipped

`replay.mjs` gained `serializeView(view)`, returning `{viewStr, revision}`
from one `JSON.stringify` + hash pass; `viewRevision` now derives from it
(`serializeView(view).revision`). `writeView` reuses that same `viewStr`
directly via string surgery instead of re-stringifying the whole object:
it slices off `viewStr`'s trailing `}`, then appends
`,"revision":<hash>` and (when present) `,"snapshot":<value>` plus the
closing `}` — producing the final persisted content with a *single* pass
over the view's serialized form.

A test (`writeView serializes view content only once per mutation`)
proves this directly: it patches `JSON.stringify` to count calls carrying
a `view`-shaped object (has a `.work` property) and asserts exactly one
per write — 2 writes (`initStore` + one mutation) → exactly 2 stringify
calls total, not 4.

## A side effect worth naming: `state.json` is no longer pretty-printed

The old path wrote `JSON.stringify(persisted, null, 2)` — indented,
human-readable JSON. The string-surgery approach reuses `viewStr`
verbatim (compact, no indentation), so `state.json` on disk is now
single-line/compact rather than pretty-printed. This is a readability
change only — `state.json` was already confirmed effectively write-only
for the app's own purposes (per `tsk-5nj`'s stale-claim resolution
above) — but a person opening the file directly to inspect it by eye
will now see compact JSON instead of an indented one.
