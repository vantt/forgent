# Research — fanout-batch timeout and orphan detection

Item: tsk-vuj

## Round 1 — 2026-08-20 (discovery)

### Asked

1. Does `dispatch.mjs fanout-batch` really execute synchronously, running
   the full pick->execute->return loop inline (not backgrounded)?
2. Does the repo already have an orphaned-claim / stuck-in-`doing`
   detection mechanism the fix should point to, rather than inventing new
   detection logic?

### Checked

- `src/runner/dispatch/cli.mjs:687-799` (`fanoutBatchExecutorCli`), the
  implementation behind `node src/runner/dispatch.mjs fanout-batch`.
- `src/state/graph-metrics.mjs:483-514` (`STALE_DOING_DEFAULTS`,
  `classifyStaleDoing`).
- `src/state/store.mjs:1393-1408` (`staleDoingAdvisory`).
- fgOS skill roster: `fgOS:stale` (`/fgOS:stale`) — user-facing entry point
  onto `staleDoingAdvisory`.

### Found

1. **Confirmed synchronous, sequential, out-of-process loop.**
   `fanoutBatchExecutorCli` (`src/runner/dispatch/cli.mjs:687`) runs
   `for (const candidateId of batchToRun)` (line 715) and, per candidate,
   sequentially: `execFileSync(... 'pick' ...)` (line 745) ->
   `await executeExecutorCli(...)` (line 755) -> `execFileSync(... 'return'
   ...)` (line 776) — each awaited before moving to the next candidate.
   Nothing in this function backgrounds itself or returns early; the whole
   batch (up to 5 candidates) runs inline inside one call. This matches the
   observed exit-143 Bash timeout for a 5-item batch.

2. **An orphan/stuck-claim detection mechanism already exists —
   `staleDoingAdvisory` / `fgos stale` / `/fgOS:stale`.**
   `classifyStaleDoing` (`src/state/graph-metrics.mjs:499`) classifies
   every item stuck in `doing` by `claimRole`: a `runner`-claimed item gets
   `ownerClass: 'agent'` and a 15-minute grace
   (`STALE_DOING_DEFAULTS.agentMs`); anything else (`human`/`session`/
   unknown) gets `ownerClass: 'human'` and a 24-hour grace
   (`STALE_DOING_DEFAULTS.humanMs`) — "never auto-reclaimed anywhere"
   (comment at line 497). This is advisory-only (suggests, never acts).

3. **Real mismatch found: fanout-batch's own claims get the slow 24h
   grace, not the 15m agent grace.** `fanoutBatchExecutorCli`'s pick call
   (`src/runner/dispatch/cli.mjs:745`) invokes `fgos pick <id> --dir
   <root>` the same way a person or `/fgOS:pick` would — it never passes a
   `runner` claimRole. Observed directly on tsk-vuj's own claim in this
   session: `fgos pick` records `"role": "session"` / `"claimRole":
   "session"` (not `"runner"`). Under `classifyStaleDoing`'s branch this
   makes an orphaned fanout-batch claim `ownerClass: 'human'` — a 24-hour
   grace — even though the actual claimant was an unattended automated
   process that can die in seconds (confirmed live: a backgrounded
   `fanout-batch` run for tsk-3ti-1..5 died mid-batch after claiming
   tsk-3ti-1 and tsk-3ti-4, in a separate session/worktree). `/fgOS:stale`
   still eventually catches this — it is not undetectable — but the grace
   window is tuned for a human claim, not an automated one, so a caller
   waiting on `/fgOS:stale` to flag a dead fanout-batch run may wait far
   longer than necessary.

### Still open

None for this item's own scope — the fix is a documentation change to
`references/wave-dispatch-mechanics.md` (background the call, wait for
harness notification, and point to `/fgOS:stale` for orphan detection with
its real grace-window caveat noted) plus, optionally, a scope call on
whether `fanoutBatchExecutorCli`'s own `pick` call should pass a `runner`
claimRole to get the faster 15-minute grace — flagged as a scope
question for planning, not blocking discovery's own clear verdict.
