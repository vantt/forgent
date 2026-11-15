# Phase 07: the dispatch decision, the tool lookup and the hook verdict in Rust

Start after: 04 landed (all non-purpose paths); **finish the purpose path and land after 06**. Wave 3, parallel with
06 and 08. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F2. Worktree `erd-p07`, report slug
`erd-p07-decide`. Effort: 2.5d.

## Context

`fgos dispatch decide` answers through `compileDispatchPlan` (`plan.mjs:504`), whose decision part (selector,
executor lookup, governance, mechanism, tool providers, purpose seat through `bindWorkSeat`) is shared with
`assignment-runner.mjs:1215` (S6a) and `fanout-batch.mjs:75` (S7) (F2). D5: one decider, in Rust; Node's
`compileDispatchPlan` keeps only the launch policy it assembles around the decision and asks the route for the
decision (phase 09). The tool lookup (`tool-providers.mjs`) is the one reader of `for` (existing `doors` row); it moves
with the decision. The PreToolUse verdict (`dispatch/hook.mjs:41-75`) is a pure function of the decide answer.

## Requirements

1. `src/decide.rs`: `pub fn decide(req: &DecideRequest, machine: &dyn Machine, probe: &dyn ToolProbe) -> DecideAnswer`
   with selectors `executorId | for | needsSoul | assignment (record given) | work (hint given)`, `hasLiveTaskAccess`,
   `caller`; same refusals and texts as Node (usage text without the `node src/runner/dispatch.mjs` form, D13);
   answer shape per `bind.v1.json` (`mechanism`, `configured`, `reasonCodes`, `blockedReason?`, `agentType?`,
   `mcpTool?`, `command?`, `stale?`, `providers?`, `executorId?`). The purpose seat calls 06's `bind` with the
   `bindWorkSeat` ask (headless, `postureAtLaunch`, no writes).
2. `src/tools.rs`: `for` entries of tool executors, normalization, served capabilities; `trait ToolProbe { fn
   present(&self, command: &str) -> bool; fn index_commit(&self, provider) -> Option<String>; fn head(&self) ->
   Option<String>; }` (the staleness rule of `tool-providers.mjs`); the posture `full/degraded/inactive` used by the
   doctor row (11).
3. `src/hook.rs`: the verdict (allow / block with Node's exact texts, `dispatch/hook.mjs:44-74`), given the normalized
   call, whether the project dir exists, and the decide answer or its failure class (config refusal blocks; any other
   failure allows).
4. The Work hint and the assignment record are inputs, never read here (D6): the host adapter (10) reads the record
   and asks the S4 bridge for the hint.
5. `tests/golden_decide.rs` over the decide and hook vectors of `bind.v1.json`.

## Files

- Create: `packages/execution/rust/src/{decide.rs,tools.rs,hook.rs}`, `packages/execution/rust/tests/golden_decide.rs`.
- Modify: `packages/execution/rust/src/lib.rs`, mutation census.
- Delete: none. Tests retired: none here (Node arms go in 10, Node plan decision in 09).
- Net size: about +800 Rust lines, +300 test lines.

## Steps

1. Red: golden test. 2. Non-purpose paths; push. 3. After 06 lands: rebase, purpose path. 4. Rust gates.

## Acceptance

- Every decide and hook vector passes, including `--work` with a given hint and `--assignment` with a given record.

## Risks / rollback

- A text difference in a refusal (M x L): the vectors carry exact texts; the parity table (10) checks them end to end.
- Revert: one commit.
