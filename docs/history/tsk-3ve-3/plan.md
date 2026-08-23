# plan.md — tsk-3ve-3

Mode: small (single child of tsk-3ve; decisions already locked at the
parent — see `docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md`,
anchor `#task-multifile-read-replay`, and decisions TA-D3/TA-D7/TA-D12/TA-D13).

## Approach

Formalize T2's inline multi-file read logic (baseline-0 + `.fgos/events/*`)
into `replay.mjs` as two new exports: `readAllEventsFromDir(dir)` (raw
merged event array) and `rebuildViewFromDir(dir)` (its folded view). This
is the real discovery step: total order `(ts, file, seq)` per TA-D7,
dedupe by `h` for new-format events and by raw line content for legacy
baseline lines (TA-D13, precedent `events-jsonl-contiguity.mjs`'s
`fixContiguity`), and structural `archive/` exclusion (a non-recursive
`isFile()` filter, so a future subdirectory there is never walked).

`store.mjs`'s `readAllEvents`/`currentView` now delegate to these — every
call site from T2 (every mutation precondition, `listWork`, `readyWork`,
`staleDoingAdvisory`, `readRawEvents`, ...) is unchanged, only what they
call underneath moved.

**Real regression found and fixed in this task (T2 side-effect, outside
T2's own declared verify scope):** `test/state/replay.test.mjs`'s
tsk-49e incremental-fast-path battery seeds through `store.mjs`'s real
write path (by design, per its own doc comment) and then called
`rebuildView` directly against the OLD hardcoded `dir/events.jsonl`. Since
T2 moved real writes to `.fgos/events/<writer>.jsonl`, those tests were
silently checking an increasingly-empty baseline file — 7 of 13 tests in
that battery were failing on `fgw/tsk-3ve` (verified via `git stash`:
pre-existing before this task's own edits, and reproduced as clean on the
pre-T2 commit). Fixed within this task's own footprint
(`test/state/replay.test.mjs`):
- `logPathOf(dir)` now discovers the writer's real file under
  `.fgos/events/` instead of assuming baseline-0.
- Each of the 13 affected tests' `logPathOf(dir)` call moved to AFTER the
  test's own `addWork` (so the file it resolves to actually exists yet).
- 2 tests specifically asserted the fast path's ZERO-READ guarantee, which
  is structurally unreachable for a per-writer path today —
  `tryIncrementalRebuild` looks up `state.json` as `logPath`'s sibling,
  true for baseline-0, false for `.fgos/events/<writer>.jsonl` (state.json
  lives one level up). This is T4's territory to properly restore (a
  per-file anchor shape), not something to hack around here. Rewrote both
  to assert the correct INTERIM behavior instead: a graceful fallback to
  exactly one full read, still folding correctly — never a crash, never a
  wrong view (same wrong-in-doubt-costs-speed-not-truth guarantee tsk-49e
  always gave).

| Site | Risk | Proof point |
|---|---|---|
| `src/state/replay.mjs` (new discovery step) | heavy | `node --test test/state/replay.test.mjs test/state/store.test.mjs` — 161 passing, incl. 5 new multi-file tests (cross-file ts-tie determinism, hash dedupe, legacy-content dedupe, archive/ exclusion, and a real-repo 23K+-line rebuild-twice-deep-equal) |
| `src/state/store.mjs` (delegate to replay.mjs) | — | same suite |
| `test/state/replay.test.mjs` (fix T2's exposed regression + new T3 tests) | — | same suite |

No proof point leans on blast-radius/impact-analysis evidence beyond what's
recorded above (degraded posture, cross-checked with grep per the
`CLAUDE.md` gate — confirmed via `git stash`/worktree bisection at
`96f7071f` (pre-T1) and `18e3f450` (T1, pre-T2) that the replay.test.mjs
regression traces to T2, not this task or T1).

## Shape

One piece, no split.

## Known gaps (not fixed here, T4's declared territory)

- `rebuildView(logPath)`'s tsk-49e incremental fast path has no working
  mechanism for a per-writer file path (state.json is no longer its
  sibling) — always falls back to a full read, correctly but slower. T4
  ("Incremental anchor per-file") redefines the anchor shape to restore
  this.
- `rebuildViewFromDir` itself has no incremental fast path at all yet —
  always a full multi-file discovery + fold. Same T4 dependency.

## Outstanding questions

None.
