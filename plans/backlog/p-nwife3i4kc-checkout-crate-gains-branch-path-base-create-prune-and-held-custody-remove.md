---
id: p-nwife3i4kc
title: "The checkout crate gains create at branch/path/base, prune of a missing checkout and remove under held custody, retiring the four checkout copies (git/checkout, priority P1; source: owner answer B to q-lnjt5zzbfq, 2026-11-23 23:18, relayed by the doors lead)"
status: proposed
priority: P1
area: git
created: 2026-11-23
---

# Why

The owner answered q-lnjt5zzbfq with B: phase 6 of plan 261121-2110-component-authority-doors keeps the checkout copies as named debt. The survivor (`packages/execution/checkout`, reached through `packages/git/node-addon/src/checkout.rs` and `src/runner/worktree.mjs`) only creates `fgw/<id>` branches, has no prune of a missing checkout's registration, and its remove takes no held custody handle. So four copies stay: `src/runner/repo-locks.mjs` (`createWorktreeCheckoutSync`, `addWorktreeSync`, `addWorktree`), `src/workflow/unit-handoff.mjs` (`wf/<run>/<unit>` create), `src/runner/merge.mjs` (catch-up create/remove under `dispatch-cwd` custody) and `scripts/lib/git-ports.mjs` (`pruneMissingCheckouts`). Evidence: `plans/261121-2110-component-authority-doors/reports/unit-261123-2305-p6-result.md`.

# Done when

The checkout crate offers create at an arbitrary branch, path and base, a prune of a missing checkout's registration, and a remove that accepts a held custody handle; the four callers above move onto it and the copies are deleted in the same change, and the debt entries on `packages/component-authority/model/doors/checkout-make-provision-remove.yaml` are removed.

# Notes

Covers the unit-handoff creator named in p-fdkdy26tba; whoever plans this should fold that item in. The owner's words were relayed by the doors lead; the supervisor has not read them directly.
