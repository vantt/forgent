---
id: p-t5cqbsbdnd
title: "`fgos worktree remove` refuses a worktree whose commit is already on origin/main with `worktree-delivery-unproven` (worktree, priority medium; source: owner 2026-11-18 review of the OPS-METRICS lane)"
status: proposed
priority: P2
area: worktree
created: 2026-11-18
---

# Why

Worktree `om-p13` had HEAD `8a754445e`, an ancestor of origin/main, and the remove still said delivery was unproven; its content had landed as a different commit (`d59b56b6c`). Cause found by the OPS-METRICS takeover lead: the delivery check compared ancestry with the local `main` (109 commits behind origin, so it lacks `8a754445e`); with `--delivered-to origin/main` it passes, but the door then refuses with `worktree-ignored-repository-preserved` because of an empty nested git repo at `om-p13/.fgos/runtime/tmp/friction-dry`, and the `main-checkout-delete-guard` hook blocks `rm -rf` of that directory because it takes the linked worktree for the main checkout (a second defect).

# Done when

A worktree whose HEAD, or whose content, is reachable from origin/main is removable without hand work; the refusal names what it compared; one owning proof for the delivery check; ledger of the stuck case closed.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
