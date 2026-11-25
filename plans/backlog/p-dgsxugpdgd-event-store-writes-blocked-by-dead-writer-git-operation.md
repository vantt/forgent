---
id: p-dgsxugpdgd
title: Every watcher and questions tick fails with event-store-io because a dead writer's git operation blocks it (operation-recovery-required)
status: proposed
priority: P1
area: git
created: 2026-11-25
---

# Why

On 2026-11-25 the unconfined `lead:SUPERVISOR` session reported that every watcher tick and every questions tick fails with `event-store-io: Git blocking operation remote-2197219-1794971807928534033-1 operation-recovery-required`. The process with PID 2197219 no longer exists (checked 18:37 local time), so the pending operation belongs to a dead writer and nothing settles it. While it stays pending, the watcher raises no events and the question ticks write nothing, so supervision runs blind.

# Done when

The pending operation of a proven-dead writer no longer blocks event-store writes: it is settled by a normal recover on the component's own path, the watcher and questions ticks succeed again, and one test covers a dead writer's pending `remote-` operation.

# Notes

Check plan 261125-1558 (land door recovers half-done work) first. Phase 2 proves a bare PID writer dead from OS state, and phase 3 lets recover settle a dead writer's pending chains. If those phases cover `remote-` operations, close this row when that plan lands and verify that the ticks recover. If they cover only ScopedCommit or Land chains, widen that plan or plan this row separately.
