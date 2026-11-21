---
id: p-bv4xcs2xdl
title: The `executor-skills-installed` message still says a worktree gets skills "only from worktreeSetup provisioning"
status: proposed
priority: P2
area: domainization
created: 2026-11-21
---

# Why

Worktree skill provisioning is now a default step of `provisionWorktree` (`provisionSkillRoots`), not a `worktreeSetup` command (the `ak-*` command line was removed from this repository's config); the row text (`src/setup/model-pool-checks.mjs`, two strings and a comment) and the CHANGELOG line that quotes it are one wording behind.

# Done when

The two strings say a worktree receives the main checkout's git-ignored skill directories from its provisioning step; `test/setup/model-pool-checks.test.mjs` asserts the wording.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
