---
id: p-5i2avek4we
title: "One shared claude login (tetcu) lets a renewal in one pane log out the other running heads (runner; source: owner and supervisor, 2026-11-24 22:24)"
status: proposed
priority: P2
area: runner
created: 2026-11-24
---

# Why

On 2026-11-24 the lead of plan 261124-0004-heads-operate-without-owner and the planner ds-f3x53nlibp both showed "Login expired" while running on claude account `tetcu`. The owner's re-login at 22:08 did not fix a pane that was already running, because a confined pane keeps a copy of the login in a temporary home (`/tmp/fgos-confinement/<dispatch>/home`). The copy of the planner was written at 22:02 and the lead's first generation ended at 22:03.

Hypothesis, not yet proved: a renewal of the tetcu login by one pane revoked the refresh token that the other panes carry. `fgos doctor` already warns of this (`llm-accounts-default-login-home`: tetcu uses the claude CLI's own default login home). Who started the second lead generation at 22:03 is not recorded anywhere found.

Also found: a confined session shows no account in `/status`, so the owner cannot tell which account to log in again; the answer came from `.fgos/assignments/<head>-<gen>/runs/01/provider-capacity-selection.json`.

# Done when

1. The renewal log shows which pane renewed tetcu at 22:02 (or the hypothesis is disproved).
2. A head's pane that loses its login is reported with its account name by `fgos session read` or a doctor row, and a rotate takes the freshest login.
3. Heads of the long-lived roles and the pane pool no longer share one login store, or the sharing is made safe.

# Notes

Related: a unit of plan 0837 hung 35 minutes with no sign of progress until its deadline cut it; there is no heartbeat or progress read for a running unit. Not recorded as a separate row yet.
