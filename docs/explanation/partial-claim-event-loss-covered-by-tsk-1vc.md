---
authoritative_for: partial claim-event loss (work.move vanishing, work.add surviving) verified already covered by tsk-1vc's fix, no source change needed
---

# A claim event silently vanishing — a variant of `tsk-1vc`'s class, verified already fixed

`tsk-4te` reported a real partial-loss variant of
[`tsk-1vc`'s own events.jsonl loss](eventlog-guard-fail-closed-event-count-checkpoint.md):
a claimed item's live `status: doing` silently vanished from the shared
main checkout's `.fgos/events.jsonl`, leaving only the item's original
`work.add` event — the `work.move` (pick) event itself disappeared, not
the whole item.

## Confirmed live

On `tsk-4dk-2` (2026-08-21): `fgos pick tsk-4dk-2` recorded a real pick
event (seq `22851`, confirmed in the command's own JSON response), real
work was done and committed on `fgw/tsk-4dk-2`, then `fgos return
tsk-4dk-2` ~30 minutes later failed: `work "tsk-4dk-2" is "todo", not
"doing" — nothing to return.` Re-reading the live event log showed only
the single original `work.add` event — the pick event was gone entirely,
not stale-cached. Named explicitly as the same root-cause class as
`tsk-1vc` (confirmed the same day on `tsk-3hks`, where the *whole* item
vanished) — a partial-loss variant, not a fresh discovery of a new
mechanism. Real cost named: any session's claim tracking on the shared
main checkout can be silently dropped by unrelated concurrent activity,
with no error at the time — only discovered later when a downstream verb
refuses because state doesn't match expectations. Recovery here was
cheap (`fgos pick` re-run; the branch/commits were safe, git-committed
independently of `events.jsonl`), but a session that trusted claim state
without re-verifying could silently proceed on wrong assumptions.

## Resolution — verified already fixed, no code change

By the time this item was worked, `tsk-1vc` and its 3 children were all
`delivered`, and `tsk-1vc`'s own merge commit was confirmed a real git
ancestor of this item's branch. Verification, not re-fix:

- `test/runner/concurrent-claim-eventlog-loss.test.mjs` — the regression
  suite `tsk-1vc-1` created, exercising genuinely concurrent `fgos claim`
  calls across real OS processes with a barrier — re-run directly
  (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
  test/runner/concurrent-claim-eventlog-loss.test.mjs`) and confirmed
  3/3 passing, including the exact "genuinely concurrent... real OS
  processes with a barrier" scenario, in this environment.
- The guard's fail-closed behavior and event-count checkpointing
  (`tsk-1vc-2`) and warning-surfacing to `fgos doctor`/live sessions
  (`tsk-1vc-3`) were confirmed present and covering this failure class.

**No source code changes shipped for this item** — it closed as a
verified duplicate of an already-fixed root cause, with real regression-
test evidence rather than an assumption.
