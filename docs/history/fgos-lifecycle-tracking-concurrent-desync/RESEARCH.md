# fgos-lifecycle-tracking-concurrent-desync — RESEARCH

## Round 1 — 2026-08-26 (tsk-38i discovery)

**Asked:** tsk-38i reports two distinct desync classes under concurrent
write load: (1) an item's entire discovery/planning/decision/gate event
history vanishing from `.fgos/events/*.jsonl` mid-drive (write-side loss),
and (2) `fgos show` reading back a stale `stage:discovery/status:todo`
for an item that `fgos list`/`fgos move` both correctly read as
`delivered` (read-path inconsistency). Goal: is each class still an open,
un-investigated problem, or does existing repo state already explain/cover
it?

**Checked — item 1 (write-side event loss):**
- `docs/history/events-jsonl-merge-abort-truncation-gap/` (the item's own
  cited prior research) has `CONTEXT.md`, `RESEARCH.md`, `plan.md`, and
  `iron-law-evidence.md` — a completed, delivered item (**tsk-1ji**,
  status `retrospective` per `fgos list --id tsk-1ji`). Its
  `iron-law-evidence.md` shows 129 passing tests across
  `test/state/events-jsonl-truncation-guard.test.mjs`,
  `test/runner/claim-port.test.mjs`, `test/runner/merge.test.mjs`,
  covering `src/state/store.mjs`, `src/runner/claim-port.mjs`,
  `src/runner/merge.mjs`.
- `docs/history/events-jsonl-merge-abort-truncation-gap/CONTEXT.md`
  records that tsk-1ji's own first planning pass hypothesized `git merge
  --abort` as the trigger and **falsified** it empirically (Round 5,
  three realistic git fixtures, no reproduction) — tsk-1ji shipped a
  re-scoped fix around tsk-24e's own D1/D2 decisions instead.
- **tsk-46v** (a sibling item in this same working batch, `fgos list --id
  tsk-46v`) is titled "events.jsonl truncation actively losing live writes
  today (2026-08-26), not just [historical]" and already carries a
  same-day `decision` entry (seq 22 in
  `.fgos/events/bace391f-9827-4ec0-ad7c-1646d7f0bafb-*.jsonl`) recording a
  **third independent live confirmation, 2026-08-26**, of exactly this
  write-side symptom recurring AFTER tsk-1ji's fix landed.
- **Conclusion:** item 1 is not a fresh unknown — it is a currently-open,
  more-specifically-evidenced problem already tracked as tsk-46v, with
  fresher (today's) reproduction data than tsk-38i's own 08-24/25
  incidents. Re-investigating it under tsk-38i would duplicate tsk-46v's
  own work.

**Checked — item 2 (show vs list/move read inconsistency):**
- `bin/fgos.mjs:4668` resolves `dir = dataDir(flags.dir)` exactly ONCE per
  CLI invocation, before the verb switch — `show` (line 2745), `list`
  (line 2529), and `move` all read through this SAME `dir` value within a
  single process run. No verb-specific `--dir` divergence exists in the
  dispatch code.
- `show`'s handler (`bin/fgos.mjs:2745-2761`) calls `listWork(dir)`
  directly. `list`'s handler (`bin/fgos.mjs:2544`) also calls
  `listWork(dir)` directly — the same function, same arguments.
  `src/state/store.mjs:1902` (`listWork`) is a one-line wrapper over
  `currentEffectiveView(dir)` (`store.mjs:1895-1899`), which is
  `currentView(dir)` (`store.mjs:152-154`, itself `rebuildViewFromDir(dir)`
  from `src/state/replay.mjs:952-956`) plus `readClaims(dir)`.
- `rebuildViewFromDir` (`replay.mjs:952-956`) tries `tryIncrementalRebuildFromDir`
  first (`replay.mjs:882-946`, the T4 incremental fast path), falling back
  to a full `foldEvents(readAllEventsFromDir(dir))` on ANY doubt. Every
  branch inside the fast path is explicitly "wrong-in-doubt": a file-count
  mismatch, a shrunk file, a rewritten prefix (`readLastLineBefore`
  boundary check), or a new event whose `ts` is not strictly greater than
  the snapshot's `maxTs` all return `null` and force the full fallback
  (`replay.mjs:877-880`, `899-936`). No code path was found where `show`
  and `list`/`move` could read two different results from the identical
  on-disk state at the identical instant.
- **Conclusion:** no per-verb code divergence exists between `show` and
  `list`/`move` — they are literally the same read call. The originally
  reported inconsistency (tsk-38i's own item 2) is far more consistent
  with a **call-timing artifact** — `fgos show tsk-ri8` was run before
  `fgos approve`'s merge-commit-plus-state-refresh had fully landed on
  disk, and `fgos list`/`fgos move` were run after — than with a
  `show`-specific caching or projection bug, which the original report
  itself only flagged as a hypothesis ("likely a caching or projection bug
  specific to the show verb"), not a confirmed one. This cannot be fully
  ruled in or out by static reading alone; it needs a live, timestamped
  reproduction (a test or a manual sequence pinning exact call order
  around a concurrent `approve`) to confirm whether a real race exists or
  whether the original report was an ordering artifact.

## Verdict

`clear`, scoped down from the original two-part report:
- Item 1 (write-side loss) is explicitly OUT of this item's scope —
  duplicates tsk-46v, which carries fresher evidence and should absorb any
  further write-side fix work.
- Item 2 (read-path inconsistency) is IN scope. No `show`-specific code
  bug was found in the current dispatch/read path; the remaining question
  is purely empirical (is there a real ordering race, or was the original
  report a timing artifact) and is answerable with a real, runnable
  reproduction test — a job for `planning`/`executing`, not further
  discovery-stage reading.

**Verify:** `node --test test/state/show-list-move-consistency.test.mjs`
— a new regression test (to be written in `executing`) that runs a
realistic concurrent sequence (an `approve`-style merge + state refresh
racing a `show`/`list`/`move` read) and asserts all three verbs return the
same `stage`/`status` for the same item at the same instant; if the
sequence cannot be made to reproduce a divergence after a good-faith
attempt, the test documents the non-reproduction and the item closes as
"could not reproduce, no code-level bug found" rather than a silent no-op.
