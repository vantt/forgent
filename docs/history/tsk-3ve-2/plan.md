# plan.md — tsk-3ve-2

Mode: small (single child of tsk-3ve; decisions already locked at the
parent — see `docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md`,
anchor `#task-multifile-write-path`, and decisions TA-D2/TA-D11/TA-D14).

## Approach

Move new event writes from the single top-level `.fgos/events.jsonl` to
one open file per writer under `.fgos/events/` (`<writer-id>-<openTs>.jsonl`,
TA-D11), while keeping `events.lock`'s scope unchanged — the whole `.fgos/`
directory, not per-file (TA-D14) — since store.mjs's CAS preconditions
(`moveWork`'s `expectedStatus`, `addWork`'s dup-id check) and `refreshView`
need one shared critical section across every writer.

`paths(dir).logPath` (`.fgos/events.jsonl`) stays exactly as-is and is
never appended to again: it is baseline-0, frozen legacy content (TA-D12),
and its own dirname is reused purely as the lock anchor so `events.lock`'s
physical location doesn't move.

A single new helper, `readAllEvents(dir)`, merges baseline-0 + every file
under `.fgos/events/` into the `(ts, file, seq)` total order TA-D7 already
locked, and every mutation precondition / read facade in store.mjs
(`listWork`, `readyWork`, `graphMetrics`, `staleDoingAdvisory`,
`readRawEvents`, ...) now folds through it instead of `rebuildView` on the
single baseline path. This is a stand-in for T3's own discovery step in
`replay.mjs` (dedupe-by-hash, `archive/` exclusion come there); T3 depends
on this task.

| Site | Risk | Proof point |
|---|---|---|
| `src/state/store.mjs` (write + all read facades) | heavy | `node --test test/state/store.test.mjs test/state/events.test.mjs`, incl. a new two-writer-interleaving test |

No proof point leans on blast-radius/impact-analysis evidence beyond
what's already recorded above (degraded posture, cross-checked with grep
per the `CLAUDE.md` gate — confirmed every `rebuildView(logPath)` and raw
`readEvents(logPath)` call site in `store.mjs` via `grep -n`, and confirmed
no other module in `src/` imports `rebuildView` against the live `.fgos/`
tree — the other hits GitNexus's symbol index surfaced were doc-comment
mentions only, or `porting-store.mjs`'s unrelated `porting/` subdir).

## Shape

One piece, no split — footprint stays `src/state/store.mjs` +
`test/state/store.test.mjs`.

## Known gaps (not fixed here, out of this task's footprint)

- `readRawEventsAndText` (its `text` field specifically) still reads only
  baseline-0. Its one caller, `src/runner/claim-port.mjs`, is unaffected
  until something needs post-cutover event text — no test exercises this
  today.
- Several CLI-level tests outside this footprint assert on the legacy
  single-file path directly (e.g. `test/cli/fgos-approve.test.mjs`'s "only
  `.fgos/events.jsonl` is dirty" check, `test/cli/take-pick-claim-
  eligibility.test.mjs`'s line-count delta). These will need updating once
  T3 formalizes the read side; expected to surface at the full `npm test`
  gate after all of tsk-3ve's children land, not fixed within this task's
  declared footprint.

## Outstanding questions

None.
