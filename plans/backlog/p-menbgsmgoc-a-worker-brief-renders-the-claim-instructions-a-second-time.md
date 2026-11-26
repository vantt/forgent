---
id: p-menbgsmgoc
title: "A worker brief renders the claim instructions a second time instead of reusing the prompt's (execution, priority low; source: plan 261122-1946-agent-start-context phase 5, 2026-11-27)"
status: proposed
priority: P3
area: execution
created: 2026-11-27
---

# Why

`render_agent_result_claim_instructions` (`packages/execution/rust/src/run_result/claim.rs`) is called twice for one round: the assignment prompt's "Result artifact" block (`packages/execution/engine/src/assignment/builder.rs`) and the brief's "Claim requirements" (`packages/execution/engine/src/assignment/brief.rs`). The worker reads the text once, because the brief first strips the prompt's copy (`remove_structured_json`) and then renders its own under the brief's claim path. So the duplication is in the code, not in what the worker reads. Phase 5 of plan 261122-1946 asked for one rendering; doing it means the brief reuses the prompt's block, which changes the brief contract and its vectors, and a prompt built without a run directory carries no block to reuse.

# Done when

One call renders the claim instructions per round, the brief's text keeps its current meaning for prompts with and without a run directory, and the brief vectors in `packages/execution/engine/tests/assignment.rs` own the result.
