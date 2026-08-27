---
type: explanation
title: Why `state.json` became an incrementally-read snapshot
tags: [state, replay, store, performance, events-jsonl]
source_capture_ids: [tsk-49e]
framework: diataxis
mode: explanation
---

# Why `state.json` became an incrementally-read snapshot

Every mutation used to pay a full `readEvents` + `foldEvents` parse of
`.fgos/events.jsonl` on every read, even when nothing had changed since
the last read — a cost that scales with the whole log's size on every
single call, regardless of how small the actual change since the last
read was. This item (a child of `tsk-5nj`, depending on `tsk-4mx`'s
atomic-write fix landing first — see `docs/explanation/
why-state-json-writes-became-atomic-while-its-lock-scope-claim-turned-out-already-fixed.md`)
made `state.json` an incrementally-read snapshot instead.

## The mechanism

`state.json` now carries a `{size, mtimeMs, lastLine}` snapshot alongside
its existing `revision` field, written by `store.mjs`'s `refreshView`.
`rebuildView` tries this fast path first (`tryIncrementalRebuild`),
falling back to today's full read on any doubt:

- **Untouched since the snapshot** (`stat.mtimeMs === snap.mtimeMs &&
  stat.size === snap.size`): return the persisted view directly — zero
  bytes of `events.jsonl` read at all.
- **Grown since the snapshot** (`stat.size > snap.size`): verify the old
  prefix's last line still matches, via a *bounded tail read*
  (`readLastLineBefore`, not a read of the whole prefix) — if it matches,
  fold only the new bytes (`readEventsFromByte`) onto the saved view.
- **Any doubt at all** — shrank, same-size-different-mtime, fingerprint
  mismatch, malformed or missing snapshot — falls back to a full read.
  This is a wrong-in-doubt-by-design mechanism: it can only ever cost a
  slower call for that one read, never produce an incorrect view.

`foldEvents` gained an optional `seedView` parameter to make the partial
fold possible: when supplied, folding starts from a shallow clone of
`seedView` (`cloneTopLevel`) instead of an empty view, then only the new
events get applied on top. Omitting `seedView` is byte-identical to every
pre-existing caller.

## Why `mtime+size` instead of a content hash of the whole prefix

The original design (D2) proposed hashing the log's own byte prefix
`[0, offset)` on every check. Corrected during exploring (D2-correction)
to `mtime+size` as the cheap fast-path signal, backed by a *bounded*
last-line fingerprint rather than a full-prefix hash — hashing every byte
of a large, growing prefix on every single read would have undercut the
whole performance goal this item exists for. `mtime+size` is free (one
`stat` call); the last-line fingerprint only needs to read a small
bounded tail, not the whole prefix, to confirm the cached prefix is still
intact before trusting it.

## Why `cloneTopLevel` only needs to be one level deep

Every top-level key `applyEvent` ever writes to a view is either an array
that gets `.push`ed onto in place (only `decisions`) or reassigned via a
`{...oldValue, ...patch}` spread (every other container — `work`,
`gates`, `settlements`, `learnings`, `decisionsById`, `outcomes`,
`discovery`, `tools`, and any future one `applyEvent` adds) — never
mutated two levels deep in place. A generic one-level shallow clone of
each top-level key is therefore sufficient to protect a seed view's own
nested references from `applyEvent`'s later in-place mutations;
`foldEvents` only needs to guarantee its *own* `view` object (and each of
its direct children) is a fresh reference, never that every nested object
recursively is.

## Proof against all 3 known log-rewrite paths

Because a cached byte offset could in principle be silently invalidated
by something rewriting the log underneath it, this mechanism had to be
proven safe against every known way `.fgos/events.jsonl` gets rewritten,
not just appended to:

- **`repairTruncatedLastLine`** — tail-only; the cached prefix is
  genuinely untouched, so the fast path stays valid.
- **`fixEventsJsonlContiguity --fix`** (dedupe + resort + renumber) —
  changes the fingerprint, so the last-line check catches it and falls
  back to a full read.
- **git's own `merge=union` driver on `events.jsonl`** — a wholesale
  reordering rewrite, standing in for this case in the actual proof;
  same fingerprint-mismatch fallback applies.

## Related

- `docs/explanation/why-state-json-writes-became-atomic-while-its-lock-scope-claim-turned-out-already-fixed.md`
  — `tsk-4mx`, the dependency this item required before it could land.
- `docs/history/tsk-49e-incremental-read-snapshot/RESEARCH.md` — the
  full case-by-case proof against all 3 rewrite paths.
- `docs/history/tsk-5nj-state-json-write-only-cost/CONTEXT.md` — the
  parent item's own decision record (D1: real snapshot over deletion;
  D2: full byte-offset seeking scope; D3: the two-piece split).
