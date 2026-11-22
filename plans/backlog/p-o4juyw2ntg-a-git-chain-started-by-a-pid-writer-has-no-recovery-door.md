---
id: p-o4juyw2ntg
title: "A Git chain started by a pid writer with no session id has no recovery door once that pid dies (git, priority high; source: lead:OPC, 2026-11-22 12:40)"
status: proposed
priority: P1
area: git
created: 2026-11-22
---

# Why

At 2026-11-22 11:55 a main-checkout catch-up chain (land-50307-1795323301795703764-1, RefUpdate) was started by pid writer 50257, which had no session id. It moved refs/heads/main and wrote the working file, then died before updating the index. Every `fgos land` on fg-server2 was then refused with `resource-recovery-required` for about 45 minutes. `fgos git recover` (run by lead:SUPERVISOR with owner approval) kept the chain with `ref-authority-mismatch`, because only the writer that started a chain may recover it. lead:OPC could settle it only by running `FGOS_SESSION_ID=50257 fgos git recover`, borrowing the dead pid's id.

# Done when

A named recovery door settles a chain whose writer is a dead pid with no session id. The door proves the writer is dead from OS state, records who recovered it, and needs no `FGOS_SESSION_ID` impersonation. `fgos git status` points to that door, and a fixture shows the refused land succeeding after it.

# Notes

Evidence: lead:OPC board line d9c4da587. The stale index held a one-line staged deletion of the board log.md. Three older pending chains (two pushsrc-drop RefDeletes and one RemoteTransfer) remain and do not block lands.

Likely root cause (lead:OPC, 2026-11-22 18:35): both dead chains of the day (land-50307 at 11:55, land-258313 at 18:24) were pid writers with no session id. The secretary and shaper lands appear to run without FGOS_SESSION_ID, so a land that dies leaves a chain nobody can recover by its own id, and its pushed-or-not commit sits on local main (2a295e00b, cc8bb2699).
