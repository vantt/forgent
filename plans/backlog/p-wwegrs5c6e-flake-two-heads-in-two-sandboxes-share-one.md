---
id: p-wwegrs5c6e
title: "Flake: \"two heads in two sandboxes share one record\" in `test/scripts/mailbox-live-confined.test.mjs` (mailbox, priority medium)"
status: proposed
priority: P2
area: agent-mailbox
created: 2026-11-16
---

# Why

It failed in shard 3 of PR run 43736170525 on 2026-11-16 (both heads registered, actual null). It is in the same file family as the zombie-fix flake, and that file is a frozen V7n measurement module, so it can only change through MAIL's V7n re-measure.

# Done when

MAIL's V7n re-measure decides the fix; the cause is proven from a reproduction or the log, and the test passes repeatedly under CI-like load.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
