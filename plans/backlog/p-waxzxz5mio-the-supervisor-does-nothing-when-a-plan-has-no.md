---
id: p-waxzxz5mio
title: "The supervisor does nothing when a plan has no progress but its lead is still alive and idle (supervisor, priority high; source: owner via Miu and lead:supervisor, 2026-11-20)"
status: done
priority: P1
area: supervisor
created: 2026-11-20
---

# Why

The watcher raised `plan-no-progress` for plan `261119-1730-supervision-powers-cores` at 00:18 UTC, the supervisor answered `already-live` and took no action, and the lead sat idle for about nine hours after it landed its first phase and wrote "Next: Phase 2" without starting it. A live idle lead raises no `lead-ended`, so nothing else catches it.

# Done when

When `plan-no-progress` names a plan whose lead is live and idle, the supervisor procedure wakes the lead in its pane with the remaining phases, and replaces it if it stays idle; `already-live` is never the end of the answer. An owning test or fixture drives a live idle lead and shows the supervisor wakes it or replaces it.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0722-idle-lead-replace, commit 595a7f0b1).
