---
id: p-kqs6fjalvh
title: "A pool login is left to a live seat's renewal and expires once the seat ends, so the next start or run on that account is refused (execution, priority high; source: supervisor and lead:WINCUSTODY, 2026-11-21)"
status: proposed
priority: P1
area: execution
created: 2026-11-21
---

# Why

At 14:46 the secretary's account claude-miu/vantt had 0 min of access-token life left after its seat was stopped. Refresh-ahead was in cooldown after a recent failure, so the secretary could not restart and was moved to the claude pool. At about 15:00 the claude/tetcu login showed 56 min left and was falling one minute per minute, with `refresh-ahead: skipped live-seat-owns-renewal`. Every `fgos run` whose timeout exceeds the remaining life then fails (see the silent run-error row p-vwkuthtqds). Nobody can see which live seat claims the renewal, or whether it ever renews.

# Done when

The renewal owner of each pool account is visible through the account's own verb (which seat, and when it last renewed). Refresh-ahead renews when the claiming seat does not, and records why a renewal failed together with its cooldown. A seat ending never leaves its account with an expired token without a recorded attempt. An owning test stops a renewal-owning seat near expiry and shows the next start succeeds or is refused by name with the renewal record.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
