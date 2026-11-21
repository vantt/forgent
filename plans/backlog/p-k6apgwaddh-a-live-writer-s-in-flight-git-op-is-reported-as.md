---
id: p-k6apgwaddh
title: A live writer's in-flight Git op is reported as `resource-recovery-required` (git, priority medium; seen 2026-11-19)
status: proposed
priority: P2
area: git
created: 2026-11-19
---

# Why

Miu's `fgos session write` was refused `write-catch-up-refused (resource-recovery-required: fetch)` while a live `fgos watcher tick` (pid 112266) had a fetch pending; it cleared in ~10 s. The refusal sends people to `fgos git recover` for nothing.

# Done when

When the pending op's writer is live (same liveness proof the lock and identity doors use), the catch-up waits briefly / retries or refuses with a distinct busy code (e.g. `resource-busy`, retryable); `resource-recovery-required` only when the writer is dead or unknown; proven by a Git test with a live and a dead pending writer. Git reviewer: lead:OPC.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
