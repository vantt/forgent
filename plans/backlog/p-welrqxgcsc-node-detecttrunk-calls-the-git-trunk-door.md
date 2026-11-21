---
id: p-welrqxgcsc
title: Node `detectTrunk` calls the Git trunk door (runner, git; priority low; lead:OPC review of plan 261118-1045 phase 14, 2026-11-18)
status: proposed
priority: P3
area: git
created: 2026-11-18
---

# Why

`src/runner/worktree.mjs` `detectTrunk` keeps its own rule (origin/HEAD, then main, then master) beside the Git component's `resolve_trunk`, which now reports how it knew (explicit, remote-default, attached-head). Two trunk rules can disagree on a repository without origin/HEAD.

# Done when

`detectTrunk` and its Node callers read the trunk through the Git door (the addon's resolveTrunk), the Node rule is deleted, and callers that must not trust a side branch treat attached-head as unknown. Belongs to the S6/S7 Rust migration of the runner.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
