---
authoritative_for: .fgos store lifecycle tracking (stage/status/decisions/discovery/gates) desyncing under concurrent write load, two distinct classes confirmed live across at least 3 incidents — event-loss via git merge --abort discarding other drivers' uncommitted events.jsonl tail, and a read-path inconsistency between fgos show and fgos list/move; this item added a regression guard for the read-path class (found no divergence) and deferred the write-side event-loss class to tsk-46v
---

# Two different desync bugs, confirmed live, only one of them was this item's own fix

`tsk-38i` investigated `.fgos` store lifecycle tracking desyncing under
concurrent write load — confirmed live across two separate incidents in
the same session (multiple concurrent drivers doing approve/catchup/pick
retries against the shared main checkout), later joined by a third
incident.

## Two genuinely distinct bug classes

**1. Write-side event loss.** `tsk-ri8` and `tsk-3ys` both had their
entire session-long discovery/planning/decision/gate event history vanish
from every `.fgos/events/*.jsonl` shard mid-drive, reverting their
live-read status/stage back to the original-submission placeholder
(`todo`/`discovery`) — while their real git branch commits (plan.md,
implementation, Iron Law evidence) stayed fully intact. This matches an
already-researched gap
(`docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`):
`git merge --abort` reverts the whole main-checkout tree to pre-abort
HEAD, discarding any uncommitted `events.jsonl` tail appended
concurrently by OTHER drivers' lifecycle writes — not just the aborting
call's own. That research's fix apparently hadn't landed yet, or didn't
cover this trigger path.

A third live occurrence surfaced during this item's own investigation
(`tsk-4kn`, 2026-08-26 ~13:41-13:44Z): the entire session-long event
history vanished mid-drive, the session's own per-writer shard file
disappeared from disk entirely, and `main-checkout-guard-warnings.jsonl`
logged fresh content-mismatch/regressed-truncation entries across 7
unrelated shard files simultaneously — matching the git-stash/checkout/
reset/clean-on-shared-main-checkout fingerprint
`docs/how-to/resolve-an-events-jsonl-truncation.md` already documents. The
real deliverable survived only because it was committed to the git branch
independent of `.fgos/` — the work-item tracking itself was unrecoverable
per that runbook.

**2. Read-path inconsistency.** After `tsk-ri8`'s `fgos approve` genuinely
succeeded (a real merge commit confirmed on main, JSON response confirmed
`to: 'delivered'`), `fgos show tsk-ri8` still read back
`stage:discovery/status:todo` — while `fgos list` and `fgos move` (which
correctly refused "no transition from delivered to delivered") both agreed
the item WAS actually delivered. No data was lost this time — the store
had it right, but one read path reported it wrong.

## What this item actually did

Item 1 (write-side event loss) was explicitly deferred to a separate item,
`tsk-46v` — out of this item's own scope. This item's own action targeted
item 2 only: write
`test/state/show-list-move-consistency.test.mjs`, a regression guard
asserting `listWork` (used by `show` and `list`) and `rebuildViewFromDir`
(used by `moveWork`'s precondition check) report identical `stage` and
`status` for an item during and immediately following an approve-like
state transition — then fix the implicated function only if a real
divergence reproduced.

## What shipped: a guard, not a fix

The diff added only the new test file (200 lines) plus the item's own
`plan.md`/`RESEARCH.md` — no source change to `store.mjs`/`replay.mjs`.
The regression test did not reproduce a real divergence in the tested
scenario: `listWork` and `rebuildViewFromDir` stayed consistent. This
closes item 2 as a permanent guard against future regression, without
claiming the original live-observed `fgos show` inconsistency is fully
explained — only that this specific concurrent approve/refresh scenario,
as tested, does not reproduce it.
