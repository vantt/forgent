---
authoritative_for: tsk-3hks event history silent loss despite prior fixes, eventlog guard fail-closed at write path, DEFAULT_CHECKPOINT_EVENT_THRESHOLD event-count checkpointing, main-checkout-guard-warnings surfaced to doctor
---

# Another real `.fgos/events.jsonl` loss — even after two prior fixes had already landed

`tsk-1vc` (3 children: reproduction, guard fix, warning-surfacing) is
part of this repo's own recurring `events.jsonl` data-loss saga — real,
confirmed loss on `tsk-3hks`'s own event history, discovered **after**
both [`tsk-cgg`'s original detect-only truncation guard](events-jsonl-concurrent-data-loss-investigation.md)
and [`tsk-1ji`'s opportunistic checkpointing](events-jsonl-opportunistic-truncation-check.md)
had already shipped.

## Confirmed live, 2026-08-21

Claimed `tsk-3hks` via `/fgOS:pick`, completed real discovery (research
consult, clear verdict) and planning (`plan.md`/`RESEARCH.md` written)
via clean-success `fgos` CLI calls — then a later `fgos list --id
tsk-3hks` returned "not found." A full `fgos list --all` confirmed the
item, including its original pre-session `work.add` event, was entirely
gone from `events.jsonl`, while other items from the same time window
(`tsk-577p`, `tsk-2jz`) survived — a partial revert to an earlier point,
not a full rollback. Nothing in the pick/discover/plan sequence surfaced
the loss; it was only noticed by accident via an unrelated later list
call. A separate, larger, unacknowledged truncation was also found
already failing `fgos doctor`'s own `events-jsonl-not-truncated` check
during the investigation (re-baselined as understood, not resolved by
this item). Recovered by recreating the item (`fgos add` with the same
id/fields) and redoing pick/discover — `plan.md`/`RESEARCH.md` survived
because they were already committed to the item's own isolated worktree
branch, unaffected by the main-checkout store loss.

## Root cause left genuinely uncertain, not overclaimed

The item explicitly did not assert which of two candidate mechanisms
caused this specific loss: `tsk-cgg`'s original diagnosis (an ordinary
`git stash`/`checkout --`/`reset --hard`/`clean` reverting the tracked
log to `HEAD`) or a new failure mode from `tsk-1ji`'s then-recently-
landed opportunistic checks (already separately known, via `tsk-5k1`, to
cause unexpected *extra* writes — the opposite failure direction from
this incident's data *loss*). Only the correlation was flagged (same
subsystem file, adjacent timing, concurrent dispatch-lock activity
observed for two other worktrees during the loss window) for whoever
investigates next to check both directions.

## A self-correction during planning

An early planning pass made a seq-gap claim that turned out mistaken —
corrected in a follow-up commit ("retract mistaken seq-gap claim, ground
plan in real evidence") before the fix shipped, rather than building on
an unverified premise.

## What shipped — three pieces

- **`tsk-1vc-1`** — a live concurrent-claim reproduction test harness for
  the `tsk-3hks` eventlog loss, giving the investigation a repeatable
  fixture instead of relying only on the one-off live incident.
- **`tsk-1vc-2`** — the real structural fix: `runOpportunisticMain
  CheckoutChecks` now **fails closed** at its own write path — when the
  truncation guard detects a break, it refuses to advance the guard mark
  *and* refuses the periodic auto-commit, both gated behind a single
  `breakFlagged` check, instead of the prior detect-and-warn-but-still-
  proceed shape. Checkpointing also switched from purely time-based
  (every 900s) to **event-count-based** as well
  (`DEFAULT_CHECKPOINT_EVENT_THRESHOLD = 50`, configurable via
  `.fgos/config.json`, `getUncommittedEventCount` comparing on-disk lines
  against the last real git-committed count) — closing the gap where a
  burst of many events inside one 900-second window could still
  accumulate significant uncommitted, unprotected history before the
  next time-based checkpoint fired.
- **`tsk-1vc-3`** — surfaces `main-checkout-guard-warnings.jsonl` (the
  file `recordMainCheckoutGuardWarning` had already been writing to,
  silently, since `tsk-1ji`) to `fgos doctor`, so a recorded guard break
  is now visible through the normal doctor-check surface instead of
  sitting in a log file nobody was told to look at.

## Related, not duplicated

`tsk-cgg` (original root-cause diagnosis, done), `tsk-5k1` (`tsk-1ji`'s
own opportunistic-checks test fallout, separate), `tsk-4fu-1` (an earlier
investigation of the same truncation symptom, closed `wontfix`
unresolved) — this item neither repeats nor supersedes those, only
extends the guard's own behavior one step further after a fresh live
incident proved the prior state still insufficient.
