# Supervisor wake, 2026-11-23 00:28

## Queue
- Event `ffe11437b7391192` (session-idle, ref `39631fb7-…`): the observe fault log shows that writer id running
  `fgos supervisor queue`, so it is a supervisor session (the owner's manual `lead:SUPERVISOR`), not a head. No action;
  marked handled.

## Running plans (3 of 4 lead slots used; lanes free: 2)
- `261121-2109-component-authority`: lead live and busy, polling unit ticket `c-1441-1795367975302` with
  `fgos request result --wait`. Left alone.
- `261122-2307-heads-rotate-on-their-own`: lead live and busy, polling phase 3 ticket `c-20844-1795366492107`. Left alone.
- `261122-0118-heads-stable-and-able`: lead idle. Its wait is real: phases 8, 9 and 10 each need a 24-hour live
  measurement window (phase files step 3/4; phase 9's window started 2026-11-22 14:20). The lead plans phase 9 at
  14:20 on 2026-11-23, phase 10 after 21:06, then phase 11. No request of it is in flight. I did not type into it
  (no open event names it, and nothing is stuck). Gap: the phase table shows rows 8-10 as `running`, not parked with
  the window end; the lead should record it there.

## Admission
- No plan is admissible. `261122-1950-owner-communication-standard` is `ready` but blocked by component-authority.

## Problems
- `fgos convention path --kind report` without `--type` fails with `invalid-type: report type is empty or malformed`
  instead of naming the missing flag.

## Open
- Owner question `q-rfxqncjrax` (who runs the account probe for Miu's quota) is still open; it blocks only Miu's
  account move.
