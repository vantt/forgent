---
id: p-fdkdy26tba
title: "A second worktree creator beside the checkout door (git/checkout, priority P2; source: shaper of ds-6psli4i4xl, 2026-11-23)"
status: proposed
priority: P2
area: git
created: 2026-11-23
---

# Why

`createWorktreeCheckoutSync` (src/runner/repo-locks.mjs) calls the Git worktree port directly and is imported by src/workflow/unit-handoff.mjs, while the door rule packages/component-authority/model/doors/checkout-make-provision-remove.json says only fgos-checkout makes a linked checkout. Two creators means two sets of refusal rules.

# Done when

One door creates linked checkouts; the second creator is moved onto it and the old path is removed in the same change. Anchor: `plans/discussions/ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads/DISCUSSION.md#task-overlap-workflow-create`.

# Notes

Relayed by the shaper of ds-6psli4i4xl; the secretary has not read the owner's words directly.
