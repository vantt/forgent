---
id: ds-4qpcunq7n7
title: "Confinement to Rust, and the split of plan 261124-0004"
status: settled
source:
  - p-fsg6aolefe
created: 2026-11-24
---

discussion: settled

The owner chose, on 2026-11-24 through the manual supervisor, to split plan `261124-0004-heads-operate-without-owner`. The request is complete as written and is seeded here unchanged so a planner can bind to it.

## Hand-off to the planner

- **Outcome:** two plans that no longer overlap. (A) `261124-0004` keeps only phases 1, 2, 3, 6 and 7 (two-hand charter, argv window and Rust permission table, help channel and mail, release rule, integration). (B) A NEW plan "confinement to Rust" takes phase 4 (loosen the cage so the role's own work runs inside it, including `npm test` and `cargo test --workspace`, the old rule that kept test commands outside the cage) and phase 5 (a peers head keeps its own pid namespace), written in Rust once instead of patching Node and then porting it.
- **Constraints:** (B) is blocked by `261122-2108-delete-dead-node-execution-closure` (`blockedBy`), because 2108 deletes dead code first and the port then knows what is alive. (B) ports `workspace-paths.mjs`, `resources.mjs` and `drivers/bwrap.mjs` under `src/runner/dispatch/confinement/` and pays the authority debt of `bwrap.mjs`. Port source: `plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md` line 14.
- **Changes to plan 0004 (the planner edits it; the plan is a draft and already has the `plan-v1` marker, so the land gate accepts the edit):** drop phases 4 and 5 and every `src/runner/dispatch/confinement/**` file and `test/runner/dispatch-confinement-*.test.mjs` from its footprint, so it no longer overlaps 2108; record what moved away in its Non-goals or Owner questions; pay the authority debt in place for the files 0004 still touches (`head-start.mjs`: 3 door or debt lines; `head-request.mjs`: 1); update the sentence in phase 4 that says "if 2108 is active the lead stops and asks the supervisor", which moves with the phase. Do not set 0004 to `ready`: the owner approves after the split.
- **Non-goals:** changing 0004's phases 1, 2, 3, 6 or 7; starting any lead.
- **Acceptance criteria:** (1) the new plan exists with the marker, a footprint, `blockedBy` 2108, and phases 4 and 5 of 0004 as its scope; (2) 0004's footprint holds no confinement path and its phase table has no phases 4 or 5 (the integration phase no longer depends on them); (3) the moved scope is named in 0004; (4) both plans pass the plan contract check.
- **Open points:** none that block.
