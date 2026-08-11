# live-events-seq-corruption — CONTEXT

## Feature boundary

tsk-n4i: the shared live `.fgos/events.jsonl` carries corrupted `seq`
values -- 2 duplicate-seq rows and 5 non-monotonic seq jumps -- discovered
when tsk-66l's dry run of `scripts/migrate-status-proposed-to-awaiting-approval.mjs`
refused to run because that script's own seq-contiguity guard tripped.
This item covers: (1) determining whether the corruption is an ongoing
append-time race or a one-off historical scar, (2) the actual blast radius
across code that reads `seq`, (3) repairing the historical data, and
(4) preventing recurrence. Out of scope: rewriting the two migrate
scripts' contiguity-check logic itself, and any store other than the one
live shared `.fgos/events.jsonl` (checked, both clean/absent -- see scout
evidence).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Root cause is ad hoc git-merge-conflict hand-resolution on the tracked `.fgos/events.jsonl`, not an `appendEvent` race. `events.lock` (commit `3adfb3f`, 2026-07-17) predates the corrupted rows (commits `aa9ae156` and `9e3fb469`, both 2026-07-28 17:2x) by 11 days -- the lock was already in place when the corruption happened, so this is a distinct gap the lock does not cover. |
| D2 | Blast radius is contained to the two migrate scripts. `readEvents` (`src/state/events.mjs:78`) validates only that each line parses as JSON -- no seq check. `replay.mjs` folds events in file/array order, never sorts or dedups by `seq` value. `cursor.mjs` pagination is explicitly seq-independent by design (opaque `{order, lastId}` cursor, comment at `src/state/cursor.mjs:1-16`: "none of them are keyed by the log's monotonic `seq`"). Only `scripts/migrate-status-proposed-to-awaiting-approval.mjs:84-90` and `scripts/migrate-actor-to-role.mjs:68-74` each hardcode a strict contiguity guard and refuse on this data. Every other consumer of `event.seq` (`bin/fgos.mjs`, multiple call sites) only echoes it as a descriptive field in verb output -- never uses it for ordering or logic. |
| D3 | Scope covers both historical repair and recurrence prevention. The merge-conflict-resolution gap has already produced two different ad hoc resolutions ("keep both sides sorted by timestamp" vs "keep theirs, rebuild") in the same session, with no defined procedure for resolving a git conflict on `events.jsonl` -- confirmed by user as in-scope rather than a separate follow-up item. |
| D4 | Repair fix shape: sequentially renumber `seq` from the first break (line 273) through EOF in the live `.fgos/events.jsonl`. Lines 1-272 are already correctly contiguous (`seq` 1..272) and stay byte-untouched to avoid reserialization noise; a full-file renumber and a from-first-break renumber produce identical output here since a single break cascades to EOF either way. Done as an in-place overwrite under ADR-0019's existing pre-release exemption (no compensating append event, per that ADR's own terms), scoped to the live store only. |

## Pinned terms

- **Live shared store**: `.fgos/events.jsonl` at the main checkout root --
  the one store this item's corruption was found in and the only one this
  item's repair touches.
- **Seq contiguity**: the invariant that every event's `seq` field equals
  the previous event's `seq` + 1, with no duplicates and no gaps. Enforced
  today only by the two migrate scripts named in D2, nowhere else.

## Scout evidence cited

- `git blame -L 270,315 .fgos/events.jsonl` -- pinpoints exactly which
  commit wrote each corrupted line: `aa9ae156ff1` ("fix: resolve
  events.jsonl merge conflict - keep both sides sorted by timestamp",
  2026-07-28 17:21:50 +0700) wrote the duplicate-seq rows at lines 273/275
  and the seq-260 regression at line 276; `9e3fb4690f7` ("fix: merge
  tsk-3oa events (keep theirs, rebuild)", 2026-07-28 17:35:32 +0700) is a
  second, differently-resolved merge in the same session window.
- `git log --format='%H %ci %s' -- src/state/events.mjs` -- `3adfb3f`
  ("guard appendEvent with a cross-process events.lock", 2026-07-17
  18:53:50 +0700) shows the lock predates the corruption by 11 days,
  ruling out "lock doesn't work" as the cause.
- Direct scan of `.fgos/events.jsonl` (1408 lines at scout time): exactly
  2 duplicate-seq rows (lines 273, 275) and 5 non-contiguous jumps (lines
  276, 286, 297, 308, 311), matching the item's own description exactly.
- `src/state/events.mjs:78-108` (`readEvents`) -- only try/catches
  `JSON.parse` per line (`EventLogError('corrupt-log', ...)` on failure);
  no seq validation of any kind.
- `src/state/replay.mjs:13,32,409-414` -- `rebuildView` calls `readEvents`
  then folds `for (const event of events)` in array order; never reads
  `event.seq` to reorder or dedup.
- `src/state/cursor.mjs:1-16` -- design comment: cursor is
  `{order, lastId}`, deliberately never a serial `seq` key, because each
  verb's `view.work` has its own internal ordering unrelated to log seq.
- `scripts/migrate-status-proposed-to-awaiting-approval.mjs:84-90` and
  `scripts/migrate-actor-to-role.mjs:68-74` -- each independently checks
  `parsed.seq !== prevSeq + 1` and throws "Refusing to migrate a log whose
  seq is not contiguous."
- `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` -- pre-release
  exemption to RUL11 ("committed log is inviolable -- migration never
  overwrites") explicitly covering the shared live store, permitting
  in-place rewrite (not a compensating append) until v1.0.0.
- `dogfood-fixture/.fgos/events.jsonl` scanned directly: 43 lines, 0
  contiguity breaks -- clean. `fgos-test-drive/.fgos/events.jsonl` does
  not exist in this repo.
- `bin/fgos.mjs` -- every `event.seq` reference (grep across the file)
  appears only inside a verb's returned JSON payload as a descriptive
  field, never in a comparison or sort.

## Canonical references

- `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` -- the exemption this
  item's repair relies on.
- `docs/history/events-lock-concurrency-race/CONTEXT.md` -- a related but
  distinct item (tsk-3ld) about a possible race *inside* `events.lock`
  itself; this item's D1 established the corruption predates and is
  unrelated to that concern.

## Outstanding questions deferred to planning

- Concrete shape of the recurrence-prevention guard (D3) -- a git merge
  driver for `.fgos/events.jsonl`, a documented hand-resolution procedure,
  a CI/pre-commit contiguity check, or some combination -- is an
  implementation choice for `fgos-coding-planning` to shape, not a product
  decision to lock here.
- Whether the repair script that performs the D4 renumber is a one-off
  throwaway or a reusable `scripts/` tool (mirroring the two existing
  migrate scripts' shape) is likewise an implementer's call for planning.
