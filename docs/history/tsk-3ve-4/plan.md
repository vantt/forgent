# plan.md — tsk-3ve-4

Mode: small (single child of tsk-3ve; decisions already locked at the
parent — see `docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md`,
anchor `#task-incremental-anchor-multifile`, and decisions TA-D4/TA-D8).

## Approach

Restores tsk-49e's incremental-read fast path for the multi-file shape T2/T3
introduced (which left it structurally dead: `tryIncrementalRebuild`'s
existing single-file version looks up `state.json` as `logPath`'s sibling —
true for baseline-0, false for `.fgos/events/<writer>.jsonl`, one directory
up). Rather than mutate that still-valid single-file primitive (still
correctly used by its own direct unit tests and a couple of fixture-based
tests elsewhere), added a parallel dir-based layer in `replay.mjs`:

- `discoverEventFilePaths(dir)` — extracted from T3's `readAllEventsFromDir`
  (shared file-membership discovery, no behavior change).
- `buildSnapshotFromDir(dir)` — the write side of the new anchor: `{files:
  {[fileTag]: {size, lastLine}}, maxTs}`, built from a cheap per-file
  stat + tail-read pass (never a full-content read). `maxTs` is derived
  from each file's own last line (safe: one writer's own file is always
  append-ordered by ts), not trusted from a caller.
- `tryIncrementalRebuildFromDir(dir)` — the read side: exact file-set
  membership must match the snapshot; each file's size/boundary
  (`lastLine`) must still check out; and (TA-D8) every newly-read event's
  `ts` must be STRICTLY greater than the snapshot's `maxTs` — any mismatch
  on any of these returns `null`, and `rebuildViewFromDir` falls back to a
  full discovery + fold. Wrong-in-doubt costs one slower read, never a
  wrong view.
- `store.mjs`'s `refreshView` now builds the anchor via `buildSnapshotFromDir`
  after every mutation, replacing T2's placeholder single-writer-file stat.

No `mtimeMs` in the per-file anchor (unlike the original single-file
shape) — `maxTs`'s independent freshness gate plus the boundary
fingerprint together already catch a same-length rewrite that used to need
mtime as a third signal (see the doc comment on `tryIncrementalRebuildFromDir`
for the reasoning). This is the one place this task's action text's literal
anchor shape (`{files: {name: {size, lastLine}}, maxTs}`) was followed
exactly rather than re-derived.

| Site | Risk | Proof point |
|---|---|---|
| `src/state/replay.mjs` (new incremental layer) | heavy | `node --test test/state/replay.test.mjs` (100 passing, incl. 8 new T4 tests: zero-read hit, incremental fold, 3 fallback branches — new file, shrink, ts-tie — and 2 `buildSnapshotFromDir` unit tests) |
| `src/state/store.mjs` (wire refreshView to the new anchor) | — | same file, plus `store.test.mjs`/`events.test.mjs` sanity (189 total across all three files) |

No proof point leans on blast-radius/impact-analysis evidence beyond what's
recorded above (degraded posture, cross-checked with grep per the
`CLAUDE.md` gate).

## Shape

One piece, no split.

## Known gaps (not fixed here, later tasks' territory)

- `rebuildView(logPath)`'s own single-file fast path is unchanged and
  still cannot see a per-writer file's state.json (by design — that
  primitive stays for literal single-file callers). Not a gap this task
  needed to close.

## Outstanding questions

None.
