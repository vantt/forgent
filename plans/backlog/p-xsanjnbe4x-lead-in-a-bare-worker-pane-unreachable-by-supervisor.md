---
id: p-xsanjnbe4x
title: "A lead started as a bare worker pane cannot be reached by any supervisor door, so a lead that parks on the supervisor never gets its answer (supervision, priority high; source: supervisor wake 2026-11-28 22:48)"
status: proposed
priority: P1
area: supervision
created: 2026-11-28
---

# Why

Plan 261128-2236's lead parked phase 1 on the supervisor (event ec54290fbb8697fc). The supervisor ran the host steps, but every way to hand the figures back was refused: `fgos session write` into the plan's reports dir (`path-not-granted`), `fgos session type` into the lead pane (`no-cli-profile`, the pane is registered with cli `worker`), `fgos mailbox send` to the role and handle (`unknown-name`, no mailbox), and SendMessage to `lead:SUPERVISOR`. The plan now waits on owner question q-7l4thbq2n5. Evidence: `plans/reports/supervisor-261128-2248-wake-drain.md`. Any plan whose host steps are given to the supervisor hits the same wall.

# Done when

A supervisor can deliver a host-step result to the lead that asked for it through one granted door (for example `session type` into a lead pane whatever its cli profile, or a lead mailbox, or a granted write into the plan's reports dir), and a test proves the round trip from a park event to the lead reading the result.

# Notes

Opened by the supervisor, 2026-11-28.
