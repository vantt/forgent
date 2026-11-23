---
id: ds-f4ocn3oiex
title: "The mutating-unit recheck replays the recorded account view instead of re-binding without it"
status: settled
source:
  - p-drfxqdzzon
created: 2026-11-23
---

discussion: settled

## Hand-off to the planner

Seeded by head:supervisor-forgent from backlog row `p-drfxqdzzon` on the coordination-handoff event `e402e66cc396c5a4` of 2026-11-23 08:18. The owner approved a small fix plan at once (relayed by lead:SUPERVISOR). The row and the diagnosis already hold Why, Done when and the cause, so no shaping round is needed.

- **Outcome:** a writing unit whose binding was shaped by account state (a quarantine removed the preferred candidate) passes the mutating recheck; the recheck reaches the same answer the run bind did.
- **Cause (proven, read-only):** `plans/reports/debugger-261123-0805-runner-recheck-ignores-account-view.md` (73b4490f3). The run bind passes the live overlay (`apps/fgos/src/wiring/unit_run_host/accounts.rs:110-116`); the recheck rebuilds with `accounts: None` (`packages/execution/engine/src/assignment_runner/legality.rs:318-323`), so `bind_facade.rs:169` sees no overlay and the comparison at `legality.rs:340-366` refuses. The bind already records `bindingInput.accountViewDigest`. The Node twin `src/runner/dispatch/assignment-runner.mjs:~325` has the same gap.
- **Direction:** the recheck replays the recorded account view; it refuses by name when it cannot reproduce it (like `binding-replay-config-mismatch`) and never silently re-binds. A quarantine that ends between the bind and the recheck must not cause a mismatch. The Node twin gets the same rule, or is retired if dead (L10, design principle 1).
- **Constraints:** priority P1, small plan. Prior art first (`git log -S accountViewDigest`, `walk_state_of`). Footprint must not overlap running plans `261121-2110-component-authority-doors`, `261122-0118-heads-stable-and-able`, `261123-0726-contract-check-in-confined-heads`, `261123-0815-head-status-line-ak-land`; sequence with `blockedBy` where it must.
- **Non-goals:** making deepseek primary (the owner keeps cheap families in fallback); changing quarantine policy or the walk.
- **Acceptance criteria:** one owning proof, a new vector in `packages/execution/contracts/assignment-runner/legality.v1.json` driven by `packages/execution/engine/tests/assignment_runner.rs` (a quarantine-shaped binding is accepted; an unreproducible view is refused by name). Node twin follows the same contract or is removed. `npm test` and `cargo test --workspace` green. `p-drfxqdzzon` closes with this plan.
- **Open points:** none blocking.
- **Source ids:** `p-drfxqdzzon`.
