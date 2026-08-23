# Research — git merge --abort can itself fail (tsk-40a)

## Round 1 — 2026-08-23

**Asked:** For tsk-40a's discovery stage — (1) is the "concurrent write onto
`.fgos/events.jsonl` while an abort is in flight" precondition reachable in
real production usage, or only via fabricated fixture timing? (2) is the
shared main-checkout lock held across the whole window, making the race
impossible outside a lock bug? (3) does any recovery/doctor mechanism
already exist for a broken half-aborted git state?

**Checked:**

- `src/runner/merge.mjs:1116-1140` (`abortMergeIfPossible`) and its five call
  sites in `mergeRunnerItemLocked` (`merge.mjs:1242`, `:1270`, `:1308`,
  `:1324`, plus the pre-check at `:1198`). Every one of the four call sites
  reachable after a real git op already wraps an abort failure into a thrown
  `MergeError` with a descriptive message (e.g. `merge.mjs:1244`: `` `merge of
  "${branch}" failed and "git merge --abort" itself failed: ${abortErr.message}` ``)
  — none of them attempt any further recovery of the git state itself; the
  thrown error just propagates to the caller.
- `src/runner/merge.mjs:754-800` (`withMergeTargetSlot`) and the comment block
  at `:713-725`: the per-target merge slot lock (built on
  `main-checkout-lock.mjs`'s primitive) IS held across the entire
  `mergeRunnerItemLocked` call, including the verify run — confirmed by the
  `HEARTBEAT_INTERVAL_MS` comment describing measured holds up to ~185s.
- `bin/fgos.mjs:71,3904` — `acquireMainCheckoutLock` is called from exactly
  one other site in the whole CLI (the lock-status/unlock read path) plus the
  claim path (`take`/`pick`, per GitNexus's call-graph for
  `acquireMainCheckoutLock`). **No verb that appends an event
  (`report`/`handoff`/`edit`/`discover`/`move`/`decision`/…) acquires this
  lock.**
- `src/state/events.mjs:459-461` (`appendEvent`) — every event append goes
  through `withEventsLock(logPath, ...)`, a **separate** lock scoped only to
  `.fgos/events.jsonl`'s own read-seq/compute/append critical section
  (`events.mjs:446-457`'s own doc comment). This lock has no relationship to
  `main-checkout-lock.mjs`'s main-checkout/merge-slot lock at all — they are
  two independent locks over two different concerns (git working tree vs.
  one file's append race).
- `src/setup/checks.mjs` and `bin/fgos.mjs`: no reference to `MERGE_HEAD`
  anywhere outside `merge.mjs` itself. No doctor check currently detects a
  lingering/broken `MERGE_HEAD`.
- `bin/fgos.mjs:3992-4019` (`main-checkout-reset` verb) + at
  `src/runner/main-checkout-reset-guard.mjs` (`assertSafeMainCheckoutReset`):
  a manual recovery verb already exists — `fgos main-checkout-reset --sha
  <sha> [--confirm]`, refuses without `--dir` from inside a worktree, prints
  the full whole-repo `git status` and requires `--confirm` when the tree is
  dirty. This is the tool a human would already reach for today, but nothing
  detects the broken state automatically or points a stuck session at it.

**Found:**

1. **The race is reachable in ordinary production use, not fixture-only.**
   Any concurrent `fgos <verb>` call that appends an event — which is nearly
   every verb, including the `report`/`handoff` calls
   `fgos-coding-driving`/`fgos-coding-discovering`/`fgos-coding-exploring`/
   `fgos-coding-validating` all issue routinely per their own SKILL.md flows
   — writes directly to the on-disk `.fgos/events.jsonl` under
   `withEventsLock` alone. It never coordinates with the merge-slot lock the
   merge flow holds. So while one session's merge is mid-flight (holding the
   merge-slot lock, staging a union-merged `.fgos/events.jsonl` via
   `--no-commit`) any OTHER session doing completely unrelated work on a
   completely different item can append a line to the same real file on disk
   and reproduce the exact precondition the fixture manufactured by hand.
   Given fgOS's own architecture (many concurrent sessions, `fgos-fanout`
   running up to 5 agents at once, each issuing frequent `report`/`handoff`
   calls per `fgos-coding-driving`'s own hard rules), this is a realistic,
   not merely theoretical, production trigger — it needs only ordinary
   multi-session concurrency, no lock bug required.
2. **No auto-recovery or doctor check exists today.** Every call site that
   catches an abort failure only wraps it into a more descriptive thrown
   error (`MergeError`) and lets it propagate — none attempt a further reset.
   `src/setup/checks.mjs` has no check for a lingering `MERGE_HEAD` or a
   half-reset index. The only recovery path today is `fgos main-checkout-reset
   --sha <sha> --confirm`, run by hand once a human notices — nothing tells
   them to.

**Verdict:** `clear` — both discovery-scope questions the item's description
posed are answered with real evidence: the failure mode is reachable through
ordinary concurrent usage of this repo's own verbs (not a fixture curiosity),
and the safe-recovery gap is real (the reset verb exists but nothing detects
or auto-triggers it). A real, runnable verify for whatever gets built: a doctor
check test asserting `fgos doctor` flags a fixture repo with a leftover
`MERGE_HEAD`/half-reset index, e.g.
`node --test test/setup/checks.test.mjs -t "merge-head"` (name illustrative —
the actual planning stage picks the concrete check/test shape).
