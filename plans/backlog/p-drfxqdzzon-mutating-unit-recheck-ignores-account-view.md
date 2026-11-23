---
id: p-drfxqdzzon
title: "The mutating-unit recheck ignores the account view and refuses quarantine-driven bindings (runner, priority high; source: owner via lead:SUPERVISOR, 2026-11-23)"
status: done
priority: P1
area: runner
created: 2026-11-23
---

# Why

Every writing unit is refused whenever a preferred account is quarantined. The run bind uses the lease and quarantine overlay, but the recheck in `packages/execution/engine/src/assignment_runner/legality.rs:318-323` re-binds with `accounts: None`, so it reaches a different answer than the run did. The Node twin `src/runner/dispatch/assignment-runner.mjs` has the same gap. Diagnosis: `plans/reports/debugger-261123-0805-runner-recheck-ignores-account-view.md` (commit 73b4490f3).

# Done when

The recheck replays the recorded account view (`bindingInput.accountViewDigest`) and refuses by name when it cannot reproduce it. Both the Rust engine and the Node twin follow the same rule. The owning proof is one new vector in `packages/execution/contracts/assignment-runner/legality.v1.json`.

# Notes

Owner approved opening a small fix plan at once (relayed by lead:SUPERVISOR, 2026-11-23 08:2x); raised on the supervision queue so the supervisor starts its planner.
