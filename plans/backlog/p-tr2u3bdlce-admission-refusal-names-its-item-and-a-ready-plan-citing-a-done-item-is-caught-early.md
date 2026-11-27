---
id: p-tr2u3bdlce
title: "An admission refusal names the item it refuses, and a ready plan citing a done backlog item is caught before admission"
status: proposed
priority: P2
area: supervision
created: 2026-11-28
---

# Why

On 2026-11-27 to 28, plan 261125-2315 (ready, admissible) failed admission five times with `publish-failed:write-item-invalid`. The wake span carries only the code, so the supervisor, the secretary and lead:SUPERVISOR could not see which item was refused, and `plan-contract-check` and `fgos migrate portfolio --dry-run` both printed ok. The real cause was `drift-done-item-plan-running`: the plan's source `p-nnaksnxtwu` was `done`, and that error only appears once admission flips the plan to `running` (land backlog index check in `apps/fgos/src/wiring/portfolio.rs`). It took one supervisor wake reading the code to find. Report: `plans/reports/supervisor-261128-0643-wake-drain.md` (local).

# Done when

1. A failed admission publication records the refusal detail (the item and the rule), not only the code, where the supervisor reads it (`supervisor plans` or the wake span).
2. A `ready` plan whose `source` cites a `done` backlog item is flagged before admission (plan contract check or the plans read view), naming the item.
3. One owning proof per behaviour at the lowest layer.

# Notes

Raised by the supervisor from a wake drain; unblocked at the time by reopening `p-nnaksnxtwu` as `in-flight` (commit 1526671e37).
