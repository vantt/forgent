# Plan: collapse the double JSON.stringify per fgOS state mutation

Mode: small

Discovery skipped `exploring` (verdict `clear`) — no `CONTEXT.md` exists for
this feature; this plan is the first record. 1 lane flag applied: existing
covered behavior (`writeView`/`refreshView` and `viewRevision` are both under
direct test coverage — `test/state/store.test.mjs`, `test/state/replay.test.mjs`
— and `refreshView` runs on every single mutation, so a regression here is
wide-blast, not narrow). No hard-gate flag (no auth/data-loss/audit/external-
provider/validation-removal) — a few files, a real decision to make, no gray
area left unresolved by research.

## Approach

**Problem, confirmed against current code** (full evidence: `RESEARCH.md`
Round 1): `src/state/store.mjs:105` builds `persisted = { ...view,
revision: viewRevision(view), snapshot }`, then `store.mjs:111` does
`JSON.stringify(persisted, null, 2)` — a second full tree-walk over content
that overlaps almost entirely with what `viewRevision` (`replay.mjs:711`)
already stringified once (compact) to compute the hash. Fresh benchmark
against the real, current 8.46MB `.fgos/state.json`: ~110ms combined per
mutation (~59ms hash-stringify + ~51ms write-stringify), worse than the
stale ~86ms figure in the item's own description because `.fgos/` state has
grown since that old report.

**Chosen path:** reuse the ALREADY-COMPUTED `JSON.stringify(view)` string
inside `writeView` instead of re-serializing `view`'s content a second time
via `JSON.stringify(persisted, ...)`. Concretely: factor a small internal
helper in `store.mjs` that stringifies `view` once, uses that string both to
derive the hash (matching `viewRevision`'s own hash exactly — same input,
same algorithm) and to build the final on-disk bytes by splicing `revision`
and `snapshot` in around the reused string, instead of a second
`JSON.stringify` call over the merged object.

**Alternatives rejected:**
- *Hash `persisted`'s own final serialized string* (the item description's
  own suggested wording) — rejected, structurally circular: `revision` is
  itself one of the fields folded into `persisted` before serialization
  (`store.mjs:105`), so `persisted`'s own final string already contains the
  hash of itself. Cannot hash a string to produce a value already embedded
  in that string.
- *Change `viewRevision`'s own public contract* (e.g. have it return the
  stringified text alongside the hash) — rejected. `viewRevision(view)` has
  a second, independent caller (`src/state/graph-metrics.mjs:438`) that only
  wants the hash, plus direct unit coverage of its exact signature and
  determinism (`test/state/replay.test.mjs:768-790`, including an explicit
  "computing the hash must not mutate the view" assertion at :790). Reusing
  its string requires a NEW internal helper `viewRevision` itself can also
  call — `viewRevision`'s own signature/behavior stays byte-identical.

**Risk map:**
| Component | Risk | What proves it |
|---|---|---|
| Hash produced still matches `viewRevision`'s exact current output (same bytes hashed, same algorithm) | light | `test/state/replay.test.mjs`'s existing determinism/no-mutation assertions, unchanged, still green |
| `state.json` on-disk formatting changes from pretty (2-space indent) to compact, if the write path stops using `JSON.stringify(persisted, null, 2)` | light | grep across `src/`+`bin/`+`test/` already run in research: zero production reads of `state.json`, and `test/state/store.test.mjs:801` asserts content equality via `JSON.parse`, never raw-string/formatting — confirmed no formatting-dependent reader exists today |
| Atomic temp-file-then-rename write mechanism (tsk-4mx) preserved | light | `test/state/store.test.mjs:809-839` asserts this directly, exercised unchanged |
| `refreshView`'s incremental-rebuild fast path (`replay.mjs`, reads `snapshot` back) still receives the same `snapshot` shape | light | same fast-path tests in `test/state/replay.test.mjs` already cover this, no field shape change planned |

Impact-analysis posture: not invoked — no proof point here leans on
blast-radius/dependency evidence; the two real callers of `writeView`/
`viewRevision` were already found by direct grep (`RESEARCH.md` Round 1 plus
the `graph-metrics.mjs:438` finding above), which is a complete-enough
caller set for a two-function, single-module change. Per `CLAUDE.md`'s gate,
this only needs invoking before a proof point that WOULD lean on such
evidence — none does here.

`fgos graph --json`: `tsk-37d` does not appear in `criticalPath`
(componentCount 497, this item is its own size-1 component) — no ordering
constraint against other in-flight work; this plan's own file order is the
only one that matters.

## Files touched, in order

1. `src/state/store.mjs` — `writeView` (:93-113): stop building/stringifying
   `persisted` as a second full-object pass; reuse a once-computed
   `JSON.stringify(view)` string for both the hash input and the final
   write bytes.
2. `src/state/replay.mjs` — `viewRevision` (:696-712): stays byte-identical
   in signature and output; only touched if the reusable stringify-once
   helper is factored to live here so both call sites (this function and
   `store.mjs`'s `writeView`) share it without duplicating the
   `JSON.stringify` call.

No other file needs to change — `graph-metrics.mjs:438`'s own
`viewRevision(view)` call is unaffected since that function's contract does
not change.

## Outstanding questions

None
