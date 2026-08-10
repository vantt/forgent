# RESEARCH: state.json write-only cost — real snapshot vs drop

## Round 1 (tsk-5nj, stage discovery)

**Checked:** `src/state/store.mjs:88-112` (`paths`, `writeView`,
`refreshView`/`withEventsLockAndRefresh` — lock-scope boundary at :673-674),
`src/state/replay.mjs` (`foldEvents:30-33`, `rebuildView:523-526`,
`viewRevision:542-544`), `src/state/events.mjs` (`readEvents:78-108`,
`repairTruncatedLastLine:142-187`), `scripts/events-jsonl-contiguity.mjs`
(header comment, `--fix` behavior), `.gitattributes` (`events.jsonl
merge=union`), grep for every read site of `state.json` across `src/`+`bin/`.

**Confirms the item's own claim:** `writeView` (`store.mjs:92-102`) computes
`viewRevision(view)` (a sha256 of `JSON.stringify(view)`,
`replay.mjs:542-544`) and then itself does a second
`JSON.stringify(persisted, ...)` to write — the same ~3.66MB object
serialized twice per mutation. `refreshView` (`store.mjs:107-112`) always
calls `rebuildView(logPath)` (full `readEvents` + `foldEvents` from event
0) — never an incremental fold from a prior state. Grep across `src/` and
`bin/` finds zero production reads of `state.json`; only test files read it
directly.

**Confirms the two named defects:**
- `refreshView` is called at `store.mjs:674`, one line AFTER
  `withEventsLock`'s callback closes at `:673` — the write to `state.json`
  happens OUTSIDE the same lock that serializes writers of `events.jsonl`,
  so two concurrent mutations could race on `state.json` itself (lost
  update, not just a stale read).
- `writeView` is a bare `fs.writeFileSync(viewPath, ...)` — no
  tmp-file-then-rename. A crash or a concurrent read mid-write can observe
  a truncated/partial file.

**New finding, changes the assumed cost/benefit of "make it a real
snapshot" (not assumed, verified by reading the actual read path):**
`readEvents` (`events.mjs:78-108`) always does `fs.readFileSync(logPath,
'utf8')` — the ENTIRE file, then splits and JSON-parses every line. A
snapshot that lets `foldEvents` START from a prior view (skipping the fold
CPU work) does NOT by itself skip the read+parse cost, which the item's own
numbers show is the larger share (readEvents 26ms vs the whole rebuildView
31ms — fold-application itself is the small remainder). To actually skip
re-reading already-folded lines, the log read itself needs to seek/skip
past a byte offset, not just the fold step.

**Real correctness risk for byte-offset seeking, found by checking every
rewrite path that touches `events.jsonl`'s bytes (not assumed safe):**
three independent paths can rewrite the file wholesale, invalidating any
cached byte offset silently:
1. `repairTruncatedLastLine` (`events.mjs:142-187`) — drops a bad trailing
   line, rewrites the file under `withEventsLock`.
2. `scripts/events-jsonl-contiguity.mjs --fix` — dedupes exact-duplicate
   lines, stable-sorts the rest by `ts`, and renumbers `seq` 1..N
   contiguously — can reorder every line in the file.
3. Git's own `merge=union` driver (`.gitattributes`) on `.fgos/events.jsonl`
   — per `events-jsonl-contiguity.mjs`'s own header comment, git's docs
   say union "tends to leave the added lines... in random order" — this
   happens entirely outside any fgOS code path, at merge time.

A byte offset cached before any of these three run is silently wrong
afterward — reading from that offset could skip real events or replay
duplicates without any error surfacing. Any offset cache MUST be
content-validated before being trusted: store a hash of the byte range
`[0, offset)` alongside the offset; before seeking, re-hash that same
range in the CURRENT file and compare. A match means safe to skip; a
mismatch (log was rewritten by any of the three paths) means fall back to
a full read — always correct, only loses the perf win for that one call.

**Verdict:** `{clear: true, verify: "npm test"}` — proceeding to CONTEXT.md
with the user's own two locked decisions (real snapshot, full byte-offset
seeking) plus the split this research's own risk finding motivates.
