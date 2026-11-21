---
id: p-djrgdijd2c
title: Finished Worktree and Refs WAL chains are never compacted, so admission cost grows with history
status: proposed
priority: P2
area: general
created: 2026-11-21
---

# Why

Every Refs/Worktree/config admission inspects every retained chain once (`wal.active`); this checkout held 322 chains / 2.2 MB after four days, about 80 a day on a busy repo, ≈ 0.05 ms per chain per admission. Compacting on the hot path was tried in HARDEN T2 and reverted: ≈ 47 ms of fsync per compacted chain on every add, plus replay and resume defects (OPC review; [T2 sub-plan](../plans/261023-0415-harden-t2-git-terminal-control/plan.md) big-lead answer 8). Compact off the hot path instead, through an existing housekeeping door (doctor `--fix` or the guarded prune); keep a WorktreeCreate chain while its registration or checkout exists (prune proves ownership from it); a compacted Worktree id replays as recovery-required; Refs replay from the receipt; spec sentence before code. Trigger: `retained_bytes` and the retained-chain count in doctor's `git-operation-journal`.

# Done when

A finished-chain backlog of 1 000 on a test repo is drained by the housekeeping door with no change to worktree-add latency; prune, same-id replay and recovery keep their proofs.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
