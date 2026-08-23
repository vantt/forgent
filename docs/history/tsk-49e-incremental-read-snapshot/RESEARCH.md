# RESEARCH: an incremental-read snapshot that actually saves I/O

## Round 1 (tsk-49e, stage decompose, planning)

**Checked:** `src/state/replay.mjs` (`foldEvents`, `rebuildView`,
`viewRevision`), `src/state/store.mjs` (`writeView`, `refreshView`,
`withEventsLockAndRefresh` — confirmed under lock per `tsk-4mx`'s own
finding), `src/state/events.mjs` (`readEvents`, `repairTruncatedLastLine`
— full rewrite via `fs.writeFileSync(logPath, repaired, 'utf8')`),
`src/state/events-jsonl-contiguity.mjs` (`fixContiguity`,
`fixEventsJsonlContiguity` — corrected citation from the parent's own
RESEARCH.md, which named `scripts/events-jsonl-contiguity.mjs`; the real
logic lives in `src/state/events-jsonl-contiguity.mjs`, the `scripts/`
file is a thin CLI wrapper importing from it — read in full, confirms
`fixContiguity` dedupes + stable-sorts by `ts` + renumbers `seq` 1..N,
`fixEventsJsonlContiguity` writes the WHOLE rewritten file via a single
`fs.writeFileSync`, under `withEventsLock`), `.gitattributes`
(`events.jsonl merge=union`, unchanged from parent RESEARCH.md).

**Correction found while designing the real algorithm (not assumed):**
the parent's own locked D2 ("content hash of the log bytes `[0, offset)`,
re-hash before trusting the offset") does not actually skip the dominant
I/O cost. Computing `sha256(bytes[0, offset))` fresh on every read
requires READING all `offset` bytes from disk — the exact same disk read
the design was meant to avoid. Hashing only saves the JSON-parse+fold CPU
work (the smaller share, per the parent's own numbers: readEvents 26ms of
rebuildView's ~31ms), not the read itself. User confirmed (asked
directly, see CONTEXT.md D2-correction): replace the content-hash
approach with `fs.statSync`'s `mtimeMs`+`size` (O(1), no file-content
read at all) for the "nothing changed" fast path, plus a cheap
last-folded-line content check (a bounded tail read, not the whole
prefix) for the "safely extend an existing snapshot" incremental path.

**Real algorithm, worked out against all 3 known rewrite paths:**

1. **Write side** (`refreshView`, already holding the lock per `tsk-4mx`):
   after folding, `fs.statSync(logPath)` (cheap, metadata only) to get
   `{size, mtimeMs}` as of the read just performed (no concurrent append
   possible — the whole call runs under `withEventsLock`), plus the raw
   text of the LAST folded line (`snap.lastLine`, already in hand from
   `readEvents`'s own raw-line splitting — no extra read). Persist
   `{size, mtimeMs, lastLine}` as a `snapshot` sibling field on
   `state.json`, alongside the existing `revision` field (same
   "additive, never folded back into the view" pattern `revision`
   already establishes, per `replay.mjs`'s own doc comment).

2. **Read side** (`rebuildView`, changed to try a fast path first):
   - Read `state.json`. No file, unreadable, or no `snapshot` field ->
     fall back to today's full read (`readEvents` + `foldEvents`).
   - `fs.statSync(logPath)` (cheap). If `mtimeMs === snap.mtimeMs AND
     size === snap.size`: NOTHING has touched the log since the
     snapshot — return the persisted view directly, zero bytes of
     `events.jsonl` read at all.
   - If `size < snap.size` OR (`size === snap.size` AND `mtimeMs`
     differs): the file shrank, or was rewritten in place at the same
     length — never safe to trust the prefix, fall back to a full read.
   - If `size > snap.size`: the file GREW. Before trusting the old
     prefix is untouched, read a small bounded tail ending exactly at
     byte `snap.size` (well under 8KB — generous for one JSON Lines
     record) and extract what should be the LAST LINE of that prefix
     (working back to the preceding `\n`). Compare it, as a plain string,
     to `snap.lastLine`. Match -> read ONLY the new bytes (`[snap.size,
     size)`, parsed as new JSON Lines) and fold them onto the persisted
     view via `foldEvents(newEvents, seedView)` (D2's own original,
     still-valid idea: `foldEvents` gains an optional seed-view
     parameter). Mismatch -> fall back to a full read.

**Verified safe against each of the 3 known rewrite paths:**

- **`repairTruncatedLastLine`**: only ever drops the truly-last
  (corrupt) trailing line; `readEvents` already throws
  `EventLogError('corrupt-log')` on any unparseable line, so no snapshot
  could ever have been successfully written WITH a corrupt line included
  in the first place — a snapshot's own `snap.size` always corresponds
  to a byte offset that was valid and complete at write time. If the
  corruption happened strictly after that offset, the prefix `[0,
  snap.size)` is genuinely untouched by a repair that only removes the
  later corrupt tail — the fingerprint check correctly passes, and the
  incremental read correctly reflects the post-repair state (the corrupt
  line is simply gone from the new-bytes range, exactly as it should be
  since it was never a valid event to begin with).
- **`fixEventsJsonlContiguity --fix`**: dedupe+resort+reseq touches
  essentially every line's content and position. The specific line
  landing at byte `snap.size` after such a rewrite is, in every
  practical case, different content than `snap.lastLine` (a different
  original event entirely, or the same event carrying a changed `seq`
  after renumbering) — the fingerprint mismatch correctly triggers a
  full-read fallback. The only failure mode (byte-for-byte identical
  content and position after resort+reseq) means the prefix genuinely
  IS unchanged, so trusting it would be correct anyway, not a bug.
- **git `merge=union`**: reorders lines "in random order" per git's own
  documented behavior (cited in the fix module's own header comment) —
  same reasoning as `--fix` above: the line at any fixed byte offset is
  overwhelmingly likely to differ after a reorder, correctly triggering
  the fallback.

**Read-side helpers needed, checked against Node's own fs API (no
external dependency):** a bounded-tail read via `fs.openSync` +
`fs.fstatSync` + `fs.readSync` into a right-sized buffer (not
`fs.readFileSync`, which has no start-offset option) — for both the
tail-fingerprint check and the "new bytes only" incremental read.

**Verdict:** `{clear: true, verify: "node --test test/state/store.test.mjs test/state/replay.test.mjs test/state/events.test.mjs test/scripts/events-jsonl-contiguity.test.mjs && npm test"}`
