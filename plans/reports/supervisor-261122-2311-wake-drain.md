# Supervisor wake drain 2026-11-22 23:11

Pending owner question: q-rfxqncjrax (who runs the account probe for Miu's quota). It is still open, and only Miu's account move waits on it.

## Events
- `7676c84559cb0306` discussion-settled `heads-rotate-on-their-own`: no new planner was started. `head:planner-heads-rotate-on-their-own` is live (gen 1), and plan `261122-2307-heads-rotate-on-their-own` (draft, its `source` names the discussion) already exists. Marked handled. The planner gets stopped once the plan is `ready`.
- `4fe79e64c3246ed7` session-idle, ref `unknown`: no session was named. Marked handled.
- `33b210bf0c74f7a9` session-idle `39631fb7…` (`lead:SUPERVISOR`, a manual non-head session): this is not a head, so I may not type into it or stop it. Marked handled.

## Running plans
- `261122-0118-heads-stable-and-able`: the lead (gen 8) is live and idle on a verified external wait. Phases 1–7 and 12 are done, 8–10 are running (measure windows), and 11 is ready behind them. The phase 9 window closes 2026-11-23 14:20 and the phase 8/10 windows close 2026-11-23 21:06. No ticket is in flight. The lead's last screen and the plan's progress notes (`be8e7b7ef`) both record this wait. I took no action.

## Admission
- Lanes free: 4/4, leads live 1/4.
- `261122-1950-owner-communication-standard` is `ready` but `admissible: false`, held by the admission rule. Its footprint (core skills, including fgos-supervisor/fgos-lead) presumably overlaps the running heads-stable plan. It waits for that plan to close.
- No other plan is ready.
