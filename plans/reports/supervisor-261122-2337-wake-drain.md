# Supervisor wake drain 2026-11-22 23:37

## Owner questions
- `q-rfxqncjrax` (who runs the account probe for Miu's quota) is still open. It blocks only Miu's account move.

## Events
- `dc7acc0b2b5fdd01` session-no-result `run_unit-run-1795364615654-3a7d793b/producer/1_01`: this is a heads-rotate wave-1 worker. The lead reads its tickets itself: phase 1 is done with 24 tests passing, and phase 2 is still running. Marked handled.
- `e020849297970fc6` lane-freed: no plan is admissible. The only ready plan, `261122-1950-owner-communication-standard`, has `admissible: false`. Marked handled.

## Admission
- leadsLive 2/4, lanes free 3. Nothing is admissible, so no lead was started.

## Running plans
- `261122-2307-heads-rotate-on-their-own`: the lead is live and busy. Phase 1 is finished, and the lead is waiting on phase 2 and lining up a review. Left alone.
- `261122-0118-heads-stable-and-able`: phases 1-7 and 12 are done, 8-10 are running (measure windows close on 2026-11-23), and 11 is ready. The lead is live but paused on the weekly usage limit and continues automatically at 00:00, as its screen shows. That wait is real.
  - The owner's footprint-trim order (unblocks component-authority) is typed into the lead's pane and not yet answered. The lead was not replaced, because a stop-then-start would drop that pending order. If the trim has not landed after 00:00, the next wake applies the idle check.
- `e9007161e125e7dc` session-idle `39631fb7…`: this is the secretary (Miu), idle after her 23:35 turn with a re-check booked for 00:07. It is not a lead, so nothing was done. Marked handled.
