---
id: p-dc785743
title: bee write-guard's control-root resolution races against concurrent sessions for git/write checks in
status: proposed
priority: P2
area: str92
created: 2026-11-21
---

# Why

bee write-guard's control-root resolution races against concurrent sessions for git/write checks in a worktree

# Done when

A worktree session's own git add/commit/Edit calls resolve the intake-gate phase check against ITS OWN .bee store consistently -- never transiently against another concurrent session's control-root state (observed: two independent str92 swarming workers, and the orchestrator itself, each hit a spurious 'phase: compounding-complete' / 'phase: idle' denial while this worktree's own bee.mjs status correctly showed phase=swarming; retrying, or invoking git via a node subprocess instead of a literal git Bash command, worked around it every time without disabling any guard). Root-caused during str92 (2026-07-26): likely a resolveContext/controlRoot race under concurrent multi-session load, not a cwd-pin bug (ruled out by at least one worker whose pwd/bee status were confirmed correct at the moment of the false denial).

# Notes

Migrated from the legacy backlog table. Original status: proposed.
