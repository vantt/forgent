# events-jsonl-merge-driver-recurring-write-loss — CONTEXT

## Feature boundary

tsk-3wq: the shared `.fgos/events.jsonl` has silently lost already-appended
events at least three times (tsk-4vo's children, tsk-5td, tsk-2x9k), each
time showing the same signature — sequence numbers "reused" by unrelated
later events, the file's tail reverting to an older state, no git-level
checkout/reset involved. This item covers: (1) closing the actual root
cause (an ordinary git merge on the tracked `.fgos/events.jsonl` has no
append-log-aware semantics), (2) closing the smaller independently-real
`repairTruncatedLastLine` unlocked-write gap in the same pass, and (3) an
audit of the log's full history (not just its live tip) for any latent
break before this item is considered done. Out of scope: rewriting
`events.lock`'s own append-vs-append locking (already correct and
unrelated — see RESEARCH.md Round 1), and any store other than the one
live shared `.fgos/events.jsonl`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix direction is a custom git merge driver: a `.gitattributes` entry routing `.fgos/events.jsonl` to a dedicated merge driver script that folds two divergent event-log histories append-log-aware (union of both sides' events by content, then reseq contiguously from 1) instead of relying on git's line-based textual 3-way merge. This closes the root cause directly without changing the current git-tracked/committed workflow for `.fgos/events.jsonl` (rejected: stop-committing entirely — bigger behavior change, loses git history of state changes, needs a new backup/restore story; rejected: guard-only — only detects the problem after a merge attempt, doesn't prevent the loss). |
| D2 | `repairTruncatedLastLine`'s own unlocked whole-file read-modify-write race (`src/state/events.mjs:141-184`, backs `fgos repair`) is fixed in this same item, not filed separately — same root theme (unsafe whole-file writes to the shared log), avoids a second exploring/planning round for a closely related gap. |
| D3 | Scope includes a full historical seq-contiguity audit of `.fgos/events.jsonl` (every line, not only the live tip already confirmed healthy in RESEARCH.md Round 1 — 12119 lines, seq 1-12119, zero breaks/dups at audit time) before this item is considered done. If the audit finds a latent break anywhere in the history, repairing it is in scope for this item too, not a follow-up. |

## Pinned terms

- **Live shared store**: `.fgos/events.jsonl` at the main checkout root —
  the one store this item's fix and audit both target.
- **Append-log-aware merge**: a merge strategy that treats each line of
  `events.jsonl` as an opaque, order-independent-by-content event record
  (deduplicated by full content, not by `seq`, since `seq` is exactly the
  field two diverging histories cannot be trusted to agree on) and
  reconstructs a single contiguous `seq` sequence over the union — as
  opposed to git's default line-position-based textual 3-way merge, which
  has no concept of "this is a log of discrete records."

## Scout evidence cited

- `src/state/events.mjs:203-318` (`acquireEventsLock`/
  `tryAcquireEventsLockOnce`) — the in-process append lock is correctly
  hardened (tsk-3ld) and is NOT the cause of any of the three repros;
  it only guards concurrent in-process `appendEvent` calls against each
  other.
- `src/state/events.mjs:141-184` (`repairTruncatedLastLine`) — its own
  docstring admits: "A concurrent `appendEvent` landing between this
  function's read and its `writeFileSync` would be silently overwritten
  (dropped)." Wired to `fgos repair` (`bin/fgos.mjs:2074-2078`).
- `docs/history/live-events-seq-corruption/CONTEXT.md` (tsk-n4i) — D1
  (locked): "Root cause is ad hoc git-merge-conflict hand-resolution on
  the tracked `.fgos/events.jsonl`, not an `appendEvent` race," proven via
  `git blame` on two real merge commits (`aa9ae156`, `9e3fb469`), both 11
  days after `events.lock` was already in place — ruling out the lock as
  cause for that incident too. Its own "Outstanding questions deferred to
  planning" named the same three options this item's D1 chooses between,
  and left the choice unresolved — which is why this failure class has
  recurred three more times since.
- `.gitignore` — checked directly: excludes `state.json`, `sessions.json`,
  `*.lock`, `invocation-faults.jsonl`, `tool-status.local.json`, but NOT
  `events.jsonl` — confirms it is git-tracked, not an oversight.
- No `.gitattributes` file exists in this repo (checked directly) — no
  merge driver has ever been configured for any path, including
  `events.jsonl`.
- `git log --oneline -- .fgos/events.jsonl` — real ad hoc "chore: sync
  event log" / "chore: sync events.jsonl state" commits exist, plus
  `857695c6 fix(tsk-3v2): drop .fgos/ drift picked up from merging main` —
  a prior manual patch for exactly this class of drift.
- `src/runner/merge.mjs:129-190` (`isWorkingTreeClean`/
  `isFgosOnlyStatusLine`) — `.fgos/` is deliberately excluded from the
  pre-merge/pre-approve dirty-tree gate; header comment states `.fgos/`
  commits are an anomaly the merge gate already has to tolerate.
  `mergeRunnerItem` (line 28-31) states plainly it "never writes to
  `.fgos/`" and runs ordinary content-agnostic `git merge --no-commit
  --no-ff` with no special handling for `.fgos/events.jsonl`.
- Live audit at exploring time (`docs/history/events-jsonl-merge-driver-
  recurring-write-loss/RESEARCH.md` Round 1): the current
  `.fgos/events.jsonl` is fully contiguous — 12119 lines, seq 1-12119, 0
  breaks, 0 duplicates.
- `node bin/fgos.mjs tool query --capability impact-analysis --status
  present --dir <root>` — GitNexus is registered and `present` (full
  posture per `CLAUDE.md`'s three-way gate) — relevant once `executing`
  starts editing `src/state/events.mjs`/`src/runner/merge.mjs`/adding
  `.gitattributes`.

## Canonical references

- `docs/history/live-events-seq-corruption/CONTEXT.md` — the prior,
  git-blame-confirmed incident this item's root cause matches and whose
  deferred recurrence-prevention decision this item finally resolves (D1).
- `docs/history/events-lock-concurrency-race/CONTEXT.md` — the append-lock
  hardening (tsk-3ld) already ruled out as this bug's cause, cited here so
  a later reader doesn't re-suspect it.
- `docs/history/events-jsonl-merge-driver-recurring-write-loss/RESEARCH.md`
  — Round 1's full evidence trail behind D1-D3 above.

## Outstanding questions

None
