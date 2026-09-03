---
authoritative_for: fanout-batch background-execution requirement, orphaned-claim detection and recovery, claimRole:session grace period caveat
---

# `fanout-batch` must run backgrounded — and a caller can outlive it

`tsk-vuj` fixed three real, practice-discovered bugs in `fgos-fanout`'s
own `references/wave-dispatch-mechanics.md` Step 3, discovered while
dispatching [`tsk-397`'s own review-remediation children
(`tsk-3ti-*`)](tsk-397-post-merge-review-remediation.md) through
`dispatch.mjs fanout-batch` (see [that consolidation
itself](fanout-execute-consolidation.md) for what the verb does).

## Bug 1: Step 3 instructed a plain foreground call

`fanout-batch` sequentially awaits `pick` → `execute` → `return` per
candidate in one synchronous loop (`fanoutBatchExecutorCli`,
`src/runner/dispatch/cli.mjs`). Running it foreground routinely exceeds
the Bash tool's 2-minute default timeout — confirmed live as exit `143`
for a 5-item batch.

## Bug 2: no guidance on how to wait for a backgrounded run

With no documented waiting pattern, an agent reached for `ScheduleWakeup`
to poll for completion — but `ScheduleWakeup` is a `/loop`-only tool
requiring a `prompt` unless `stop:true`, and fails immediately outside
that context.

## Bug 3 (discovered live, not anticipated): the backgrounded process can itself die mid-run, orphaning claims

Observed directly: a backgrounded `fanout-batch` run for `tsk-3ti-1..5`
died after claiming `tsk-3ti-1` and `tsk-3ti-4` — leaving both `status:
doing`, claimed under the session, with no process left driving them to
completion and no documented way to tell "still legitimately running"
apart from "orphaned." `tsk-3ti-1`'s fix was already committed on its
branch (safe to `return`/re-drive); `tsk-3ti-4` had uncommitted
work-in-progress (needed inspection before deciding resume vs. reclaim).

## What shipped: three fixes to Step 3 of `wave-dispatch-mechanics.md`

1. **Execution rule**: always run `fanout-batch` with
   `run_in_background: true` from the start, never foreground.
2. **Waiting rule**: wait for the harness's own background-completion
   notification — never `ScheduleWakeup`, never polling.
3. **Orphaned-claim handling**: `classifyStaleDoing` (via `/fgOS:stale` /
   `fgos stale`) is the detection mechanism for stuck `doing` items, but
   with a caveat — `fanout-batch`'s own `pick` call records `claimRole:
   session`, which places its claims under the **human grace period
   (~24h)** in `classifyStaleDoing` rather than the shorter agent grace
   period, so `/fgOS:stale` will not flag an orphaned `fanout-batch`
   claim quickly. Recovery: first confirm the background job is actually
   dead (not still legitimately running); if the item's changes are
   already committed on its branch, `return`/re-drive it
   (`/fgOS:pick <id>`) is safe; if it has uncommitted work-in-progress,
   inspect it before deciding whether to resume or reclaim.

## What was explicitly deferred, not fixed here

The `claimRole: session` / grace-period mismatch itself (why
`fanout-batch`'s claims get the long human grace instead of a shorter
agent-appropriate one) was **not** fixed in this item — split out as its
own follow-up, `tsk-62w`, rather than expanding this item's scope beyond
the documentation fix.
