# events-jsonl-merge-driver-recurring-write-loss — RESEARCH

## Round 1 — 2026-08-10 (tsk-3wq, stage discovery)

**Asked:** tsk-3wq reports three live repros (tsk-4vo's children, tsk-5td,
tsk-2x9k) of the shared `.fgos/events.jsonl` silently losing already-appended
events under concurrent write — sequence numbers get "reused" by unrelated
later events, and the file's tail reverts to an older state. tsk-2x9k's own
decision log ruled out a `git checkout`/`git reset` as the mechanism ("an
ordinary uncommitted working-tree modification"). Question: is there a
concrete, checkable root-cause candidate, or is this still an open mystery?

**Checked — the in-process append lock itself (`src/state/events.mjs`):**
- `acquireEventsLock`/`tryAcquireEventsLockOnce` (`src/state/events.mjs:203-318`)
  use a link-atomic-create + stale-pid-reclaim primitive, already hardened
  once (tsk-3ld, `docs/history/events-lock-concurrency-race/CONTEXT.md`) after
  a spike-confirmed duplicate-seq bug was fixed by writing the pid to a temp
  file then `fs.linkSync`-ing it onto the lock path (never a partially-written
  lock file visible to a racing reader).
- `appendEventCore`/`appendEvent` (`src/state/events.mjs:346-392`) read the
  last seq and append, always inside `withEventsLock`. `store.mjs`'s own
  mutators (`addWork`/`editWork`/`moveWork`/`moveStage`) fold their own
  precondition read into the SAME held lock via `withEventsLock` +
  `appendEventLocked` (`src/state/store.mjs:30, 248, 363, 687, 766`) —
  this closes the read-then-write TOCTOU tsk-3ld found.
- **Verdict: this lock is not the culprit.** It only guards concurrent
  in-process `appendEvent` calls against each other; it says nothing about a
  process that rewrites the whole file through a different door.

**Checked — whole-file rewriters of `events.jsonl` that bypass the lock:**
- `repairTruncatedLastLine` (`src/state/events.mjs:141-184`, wired to `fgos
  repair`, `bin/fgos.mjs:2074-2078`) does an UNLOCKED read-modify-write of the
  entire log file. Its own docstring admits the gap: "A concurrent
  `appendEvent` landing between this function's read and its `writeFileSync`
  would be silently overwritten (dropped)." This is a real, already-documented
  candidate but is operator-invoked (rare) and only ever drops the single
  trailing malformed line it read, not a broad range — doesn't fully explain
  the tsk-2x9k shape (~70 events, spanning multiple item lifecycles, gone).
- `initStore` (`src/state/store.mjs:140-147`) writes an empty log only when
  `!fs.existsSync(logPath)` — narrow TOCTOU, but the log already exists in
  every live repro case, so this path never fires here.
- No other `writeFileSync`/`copyFileSync`/`truncateSync` targets the events
  log path anywhere in `src/` or `bin/` (checked via `grep -rn`).

**Checked — prior CONFIRMED incident with the same failure signature
(`docs/history/live-events-seq-corruption/CONTEXT.md`, tsk-n4i):**
- **D1 (locked):** "Root cause is ad hoc git-merge-conflict hand-resolution on
  the tracked `.fgos/events.jsonl`, not an `appendEvent` race." Confirmed via
  `git blame` on the corrupted lines, pointing at two real merge commits
  (`aa9ae156` "fix: resolve events.jsonl merge conflict - keep both sides
  sorted by timestamp", `9e3fb469` "fix: merge tsk-3oa events (keep theirs,
  rebuild)") — both dated 11 days AFTER `events.lock` was already in place
  (`3adfb3f`), ruling out the lock as the cause for that incident too.
- **D3 (locked):** scope explicitly included recurrence prevention, but the
  outstanding-questions section deferred the actual mechanism to planning:
  "a git merge driver for `.fgos/events.jsonl`, a documented hand-resolution
  procedure, a CI/pre-commit contiguity check, or some combination" — **never
  resolved to a locked decision**, no `.gitattributes` merge driver exists in
  this repo today (checked: no `.gitattributes` file at all), no
  hand-resolution procedure doc found under `docs/`.
- Confirms `.fgos/events.jsonl` IS git-tracked (not in `.gitignore` — checked;
  `.gitignore` excludes `state.json`, `sessions.json`, `*.lock`,
  `invocation-faults.jsonl`, `tool-status.local.json`, but not `events.jsonl`)
  and is periodically committed via ad hoc "chore: sync event log" /
  "chore: sync events.jsonl state" commits (seen directly in `git log
  --oneline -- .fgos/events.jsonl`). One such commit,
  `857695c6 fix(tsk-3v2): drop .fgos/ drift picked up from merging main`, is
  itself a manual patch for exactly this class of drift.

**Checked — `src/runner/merge.mjs`'s own `.fgos/` handling:**
- `isWorkingTreeClean`/`isFgosOnlyStatusLine` (`src/runner/merge.mjs:129-190`)
  deliberately EXCLUDE `.fgos/` from the pre-merge/pre-approve dirty-tree
  gate — the header comment at line 156-163 states plainly: "`.fgos/` itself
  is excluded: it's a live store with its own write door... only a manual
  `.fgos/events.jsonl` commit made that true before this exclusion existed."
  This confirms the design assumes `.fgos/events.jsonl` is normally an
  UNCOMMITTED, ever-dirty working-tree file (matching the session-start git
  status for THIS session: `M .fgos/events.jsonl` on `main`) — but nothing
  currently stops it from occasionally getting swept into a real commit on
  some branch (as tsk-n4i's D1 proved happened, and `857695c6` had to patch
  around).
- `mergeRunnerItem` itself explicitly states (line 28-31) "This module never
  writes to `.fgos/`" — the merge engine's own git operations
  (`git merge --no-commit --no-ff <branch>`) are otherwise ordinary,
  content-agnostic 3-way git merges with no special handling for
  `.fgos/events.jsonl` if it happens to differ between the two sides'
  histories.

**Finding — the mechanism, converged:** when `.fgos/events.jsonl` ends up
committed on two branches that have each accumulated real, different appends
since their common ancestor (as already proven possible once, tsk-n4i D1),
an ordinary `git merge` on that file is a line-based textual 3-way merge with
NO append-log-aware semantics — it can trivially interleave, duplicate, or
silently prefer one side's tail over the other's depending on where the diffs
land relative to each other, and any hand-resolution (human or agent) of an
actual conflict on it can pick a side wholesale. This is corroborated by:
(a) one already-confirmed historical incident with git-blame-level proof
(tsk-n4i), (b) the repo's own design comment acknowledging `.fgos/`
commits are an anomaly the merge gate has to tolerate, (c) a prior ad hoc
patch commit (`857695c6`) for "drift picked up from merging main", and
(d) the recurrence-prevention decision from that same historical incident
being explicitly left unresolved. `repairTruncatedLastLine`'s unlocked
whole-file rewrite (`fgos repair`) is a second, smaller, independently real
gap worth closing in the same pass, but does not by itself explain the
full-range write loss tsk-3wq's three new repros describe.

**Still open (for `fgos-coding-planning` to shape, not decided here):**
- Whether the fix is (1) a `.gitattributes` custom merge driver that folds
  two `events.jsonl` histories append-log-aware (union + reseq), (2) making
  `.fgos/events.jsonl` truly never-committed (stronger gitignore + a
  dedicated sync/snapshot mechanism instead of ad hoc commits), (3) a
  pre-commit/pre-merge contiguity guard that refuses a merge result with a
  corrupt seq sequence before it lands, or a combination — the same
  three-way choice tsk-n4i already named and deferred.
- Whether to also close `repairTruncatedLastLine`'s unlocked-write gap
  (`src/state/events.mjs:141-184`) in the same item or file it separately.
- Exactly which historical commits (beyond the two tsk-n4i already found)
  introduced the tsk-4vo/tsk-5td/tsk-2x9k losses — a `git log -- 
  .fgos/events.jsonl` / `git blame` sweep around each incident's timestamp,
  left for planning/exploring's own deeper dive, not required to establish
  that the goal itself is clear.

## Round 2 — 2026-08-10 (tsk-3wq, fgos-coding-validating reality gate)

**Asked:** the first `plan.md` draft proposed wiring a merge-driver fixup
call into `src/runner/merge.mjs`'s `mergeRunnerItemLocked`, immediately
after `git merge --no-commit --no-ff` stages cleanly and before
`runGoalCheck`. Before locking that as the wiring point: does that
function actually let a `.fgos/`-touching merge reach that point at all?

**Checked — `src/runner/merge.mjs:877-891`:** `mergeRunnerItemLocked`
already runs `git diff --name-only --cached` right after the merge stages,
and if ANY path under `.fgos/` shows up staged, it aborts the merge
outright (`abortMergeIfPossible`) and returns `outcome:
'fgos-write-rejected'` — it never reaches `runGoalCheck` in that case.
This guard is real, deliberate, and unconditional; inserting a "fix up and
continue" call before it would either never fire (the guard already
aborted first) or require also loosening/reordering that guard — a
second, larger, riskier design question this item's own CONTEXT.md
decisions never asked for.

**Checked — when this guard was introduced, relative to the known
incidents:**
- `git log --oneline -S "fgos-write-rejected" -- src/runner/merge.mjs` →
  commit `59551886` "fix(tsk-1an): keep .fgos/ out of fgw/<id> worker
  worktrees", dated **2026-07-28 19:58:18** — a few hours AFTER tsk-n4i's
  two corrupting merge commits (`aa9ae156`/`9e3fb469`, both `2026-07-28
  17:2x`), i.e. this guard was very likely added in direct response to
  that same-day incident.
- The three NEW repros this item (tsk-3wq) reports — tsk-4vo's children,
  tsk-5td, tsk-2x9k — are all dated **2026-08-09/2026-08-10**, roughly two
  weeks AFTER this guard already existed. So the guard has been in place
  and active for every one of the three new incidents, yet they still
  happened.

**Checked — is `mergeRunnerItemLocked` the only place fgOS code runs `git
merge` at all?** `grep -rn "'merge'\]" src bin scripts` (excluding tests):
zero other matches. fgOS's own code has exactly one `git merge` call site,
and it already refuses any `.fgos/`-touching result.

**Finding:** the three new incidents cannot be coming through `fgos
merge`'s own path — it already refuses before ever committing a
`.fgos/`-touching merge. The real, currently-unguarded vector is a raw
`git merge`/`git pull`/hand-resolution run directly by a session, outside
any fgOS verb — exactly the pattern already visible in this repo's own
recent history (e.g. a `catch-up: merge main into fgw/<id>` commit style,
syncing a feature branch forward from main by hand). This is also exactly
tsk-n4i's own original D1 finding ("ad hoc git-merge-conflict hand-
resolution"), just confirmed here to still be the live, unguarded vector
today, unaffected by the `fgos-write-rejected` guard added the same day.

**Consequence for the plan:** `.gitattributes: .fgos/events.jsonl
merge=union` is the correct fix BECAUSE it is git-level and path-scoped,
not code-path-scoped — it applies uniformly to every `git merge`
regardless of who invokes it (a live session's raw Bash command included),
unlike any change inside `merge.mjs`. No `merge.mjs` change is needed or
appropriate for this item's actual scope; touching its existing
`fgos-write-rejected` guard is a separate, bigger design question this
item's CONTEXT.md decisions never asked for.

**Checked — precedent for a non-install-config doctor check** (does a
data-integrity check even belong in `fgos doctor`'s registry, or only
config/install checks?): `src/setup/registrations.mjs:441-...`
(`checkRootDrift`, tsk-5m7) is already exactly this shape — a repo/data
health check (branches drifted ahead of their merge target), not a local
machine config check — confirms the registry already holds this class of
check, not just install-config ones.
