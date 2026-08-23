# CONTEXT: the incremental-read snapshot mechanism (tsk-49e)

Item: `tsk-49e`, child of `tsk-5nj`. Inherits `tsk-5nj`'s own locked
decisions in full (`docs/history/tsk-5nj-state-json-write-only-cost/
CONTEXT.md` D1-D3: real snapshot direction, full byte-offset seeking
scope, split-into-two-pieces-safety-first). This document adds the
decisions specific to piece 2's own real algorithm, discovered while
designing it.

## Locked decisions

**D2-correction — content-hash-of-prefix replaced with mtime+size (fast
path) plus a bounded last-line fingerprint (incremental path).** Per
RESEARCH.md: the parent's own D2 ("content hash of bytes `[0, offset)`")
does not actually skip the dominant I/O cost, since computing that hash
requires reading the same bytes it was meant to avoid reading. User
confirmed (asked directly) replacing it with `fs.statSync`'s
`mtimeMs`+`size` for the "log genuinely untouched" fast path (O(1), zero
content read) and a small bounded tail-read fingerprint (last folded
line's raw text, not the whole prefix) for the "safely extend an
existing snapshot" incremental path. This is a refinement of D2's own
mechanism, not a reversal of D2's own scope (still full byte-offset
seeking, still validated against all 3 known rewrite paths) — the parent
CONTEXT.md's own D2 wording ("content hash") is superseded by this
document for piece 2's actual implementation.

**D5 — Verified safe against all 3 known rewrite paths, per RESEARCH.md's
own case-by-case reasoning** (`repairTruncatedLastLine`,
`fixEventsJsonlContiguity --fix`, git `merge=union`) — each either
leaves the fingerprint-checked prefix genuinely untouched (safe, correct
incremental read) or changes the specific last-line content enough that
the fingerprint mismatches and the mechanism falls back to a full read
(always correct, only loses the perf win for that one call — never
produces a wrong view).

**D6 — Citation correction:** the parent's own RESEARCH.md named
`scripts/events-jsonl-contiguity.mjs` as the location of the dedupe/
resort/reseq logic. The real logic lives in `src/state/
events-jsonl-contiguity.mjs`; `scripts/events-jsonl-contiguity.mjs` is a
thin CLI wrapper importing from it (confirmed by reading both files in
full). Its own test lives at `test/scripts/events-jsonl-contiguity.test.mjs`,
not `test/state/`.

## Scout evidence

- `src/state/events-jsonl-contiguity.mjs` (`fixContiguity`,
  `fixEventsJsonlContiguity`) — read in full, cited in RESEARCH.md.
- `src/state/store.mjs` (`writeView`, `refreshView`,
  `withEventsLockAndRefresh`) — confirms `refreshView` already runs
  under the same lock as the append (per `tsk-4mx`'s own finding, this
  item's own dependency), so the write-side snapshot capture
  (`fs.statSync` + last-line text) races nothing.
- `src/state/replay.mjs` (`foldEvents`, `rebuildView`) — confirms
  `foldEvents(events)` always starts from a fresh empty view; the
  optional seed-view parameter (parent D2's own idea) is additive, no
  existing caller's behavior changes when the parameter is omitted.
- Node's `fs` module docs (own knowledge, not web-fetched): no
  start-offset option on `fs.readFileSync`; a bounded tail/partial read
  needs `fs.openSync` + `fs.readSync` into a sized buffer.

## Canonical references

- `docs/history/tsk-5nj-state-json-write-only-cost/CONTEXT.md` (parent,
  D1-D3 inherited in full)
- `docs/history/tsk-4mx/iron-law-evidence.md` (piece 1, the lock-scope
  correctness this piece's write-side capture depends on)

## Outstanding questions

None
