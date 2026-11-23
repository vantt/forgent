# Supervisor wake 2026-11-23 07:24

## Events

| id | kind | ref | action |
|---|---|---|---|
| 3ae065c07932bb8d | plan-became-ready | plans/261122-0056-orchestration-skeleton | not admitted; handled |
| 9228c0f278a57baa | plan-ready-waiting | plans/261122-0056-orchestration-skeleton | same; handled |

## Admission

- `261122-0056-orchestration-skeleton` (ready, `admissible: false`). All three `blockedBy` plans are done. Its footprint overlaps the running plan `261122-0118-heads-stable-and-able` on `apps/fgos/src/wiring/supervision.rs` and `apps/fgos/src/routing.rs`, so it is held until heads-stable closes. Lanes were free (4 of 4); the overlap is the only reason it is held.
- `261122-1950-owner-communication-standard` (ready, `admissible: false`) is `blockedBy` orchestration-skeleton.

## Running plans

- `261122-0118-heads-stable-and-able`: `leadLive: true`. Phases 1-7 and 12 are done. Phases 8, 9 and 10 are parked on dated measure windows (phase 9 ends 2026-11-23 14:20, phases 8 and 10 end 21:06). Phase 11 depends on all of them. A screen read of the lead confirms it is waiting on those windows with no run or land request in flight. This is a verified, recorded wait, so it was left alone.

## Owner questions

- `q-rfxqncjrax` (who runs the account probe for Miu's quota) is still open, 10 h old. It blocks only moving Miu to a fresh account.

## Next wake

- After 14:20, check that the lead has started phase 9's after report. After 21:06, check phases 8 and 10, then phase 11.
- When heads-stable closes, admit orchestration-skeleton.
