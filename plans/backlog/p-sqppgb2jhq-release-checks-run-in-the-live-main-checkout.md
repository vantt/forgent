---
id: p-sqppgb2jhq
title: "Release checks run in the live main checkout, not on the commit they release, so concurrent heads and local state turn them red (release, priority P0; source: lead:SUPERVISOR, owner order 2026-11-27)"
status: done
priority: P0
area: release
created: 2026-11-27
---

# Why

`fgos release run` reads the trunk tip it will release, then runs the recipe `checks` in the project's main checkout (`packages/session-host/rust/src/release.rs`). That checkout is live. Other heads land into it, shapers edit discussions in it, and it carries local state: a 35G `.fgos`, a stale projection ledger, untracked reports and test leftovers.

On 2026-11-27, four release runs failed `checks-failed` on causes that were not in the released commit:

- a land moving the index mid-read (`inspect-cursor-stale`);
- `/tmp` inode exhaustion under parallel suites;
- an e2e test reading the whole `.fgos`;
- a stale local ledger;
- an untracked report name.

The same suite was green in a clean worktree of the same commit.

# Done when

The release door runs its checks in a clean, detached checkout of exactly the tip it releases, made and removed through the worktree door. The checks then prove the commit that ships, and nothing the live checkout holds can turn them red.

# Notes

Discussion: ds-r2sv5l5vnu.
