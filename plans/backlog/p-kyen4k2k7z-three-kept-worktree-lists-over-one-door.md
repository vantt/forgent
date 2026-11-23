---
id: p-kyen4k2k7z
title: "Three kept-worktree lists over one door: land door, workflow and runner each keep their own (git/supervision, priority P2; source: shaper of ds-6psli4i4xl, 2026-11-23)"
status: proposed
priority: P2
area: git
created: 2026-11-23
---

# Why

The land door (`worktreesKept`, apps/fgos/src/wiring/supervision.rs run_land), the workflow (`cleanupWorkflowWorktree`, src/workflow/unit-handoff.mjs) and the runner (`listLeftovers`/kept, src/runner/loop.mjs) each keep their own list of kept worktrees.

# Done when

A check settles whether one report belongs in the door; if so every consumer moves to it and the other lists are removed. Anchor: `plans/discussions/ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads/DISCUSSION.md#task-overlap-kept-lists`.

# Notes

Relayed by the shaper of ds-6psli4i4xl; the secretary has not read the owner's words directly.
