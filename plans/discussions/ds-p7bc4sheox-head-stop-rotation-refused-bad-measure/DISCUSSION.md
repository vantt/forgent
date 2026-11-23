---
id: ds-p7bc4sheox
title: "A head's Stop-hook rotation request reaches the host with a valid measure, so heads over soft rotate and every stop leaves a trace"
status: settled
source:
  - p-vbv57yc4d5
created: 2026-11-23
---

discussion: settled

## Hand-off to the planner

Seeded by head:supervisor-forgent from backlog row `p-vbv57yc4d5` on the coordination-handoff event `2ca2450bba4d5f8b` of 2026-11-23 08:26. The owner ordered a plan at once (relayed by the secretary). The row holds Why and Done when; the cause is not proven, so the plan proves it first. No shaping round is needed.

- **Outcome:** a Stop at or above soft from a live head reaches the host, writes a `stop-trace.jsonl` line, and a head over soft rotates. A refused stop leaves a trace line or an incident row instead of failing silently.
- **Symptom (observed):** every Stop-hook `session rotate` from heads (secretary Miu gen 28, leads, planners) is refused `route bad-measure: fraction must be a number of at least 0, or null` by `checkMeasure` (`src/session-rotation/rotate.mjs:94`); evidence in `.fgos/assignments/head-secretary-miu-28/runs/01/supervisor.log`. No `stop-trace.jsonl` exists under `.fgos`. In the working tree the Rust hook (`apps/fgos/src/wiring/session_rotation_hook.rs`, `stop`) sends `fraction` as a number or null, which matches the validator.
- **Direction:** phase 1 proves the cause from the activated release (`.fgos/installation/activation.json`) or a captured request: version mismatch between the activated hook and its request route, or a transport step that drops or stringifies `fraction`. Then the cause-aligned fix, then the owning proof of the hook's real request shape across the request socket.
- **Constraints:** priority P1, small plan. Prior art first (`git log -S checkMeasure`, `-S bad-measure`, plan `261122-2307-heads-rotate-on-their-own` and discussion `ds-scjppt3ruk-heads-rotate-on-their-own`; same family as `p-4r4h3jqtth`). `apps/fgos/src/wiring/session_rotation_hook.rs` was just landed by `261123-0815-head-status-line-ak-land` (c447154e1); build on main. Footprint must not overlap running plans `261121-2110-component-authority-doors`, `261122-0118-heads-stable-and-able`, `261123-0726-contract-check-in-confined-heads`, `261123-0815-head-status-line-ak-land`; sequence with `blockedBy` where it must.
- **Non-goals:** changing rotation thresholds or the soft/hard policy.
- **Acceptance criteria:** the cause is named with evidence in a report; one owning proof of the real request shape across the socket; a refused stop is recorded, not silent; `npm test` and `cargo test --workspace` green; `p-vbv57yc4d5` closes with this plan.
- **Open points:** none blocking.
- **Source ids:** `p-vbv57yc4d5`.
