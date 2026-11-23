# Supervisor wake 2026-11-23 10:55

## Queue
- 985f5d889266d869 session-idle, ref unknown: no head named, handled.
- 438ff867b940f713 session-idle, ref 39631fb7 = lead:SUPERVISOR helper (claude-b7gj), not a head: handled.

## Admission
- Lead pool full (leadsLive 4 = maxLeads 4). Ready plan 261123-0828-head-stop-rotation-bad-measure stays queued.

## Running plans
- 261121-2110-component-authority-doors: lead busy. Its own `fgos land --paths` of plan.md and the wave-1 report (the uncommitted main-checkout edit that blocked other lands) was in flight at 10:54. Phase 1 parked on runner recheck fix 261123-0821; phases 2-3 wait on q-swxkda2x5r; phase 5 on q-3iylevstr2.
- 261123-0726-contract-check-in-confined-heads: phase 1 land of branch -p01b in flight (started about 10:52).
- 261123-0821-runner-recheck-replays-account-view: lead busy in a land retry loop for -p01b.
- 261122-0118-heads-stable-and-able: lead idle with verified external waits (phase 9 measure ends 14:20, phases 8/10 end 21:06, phase 11 after). Left alone.

## Owner questions (open, not mine to close)
- q-sieckdvccb looks settled in frame by da5f26065 (footprint lines landed); its asker should ack it.
- q-7x7b33ekew (resource-recovery-required): lead:SUPERVISOR recovered main; lands run again. The asker should cancel it once its land succeeds.
- q-swxkda2x5r and q-3iylevstr2 still need the owner.
