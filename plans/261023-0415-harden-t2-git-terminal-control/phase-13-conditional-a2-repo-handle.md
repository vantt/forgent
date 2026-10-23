---
phase: 13
title: "Conditional on A2: one repository handle per process carrying formats and the config stamp"
status: pending
condition: "runs only if the owner picks A2 in Q3"
depends_on: [09]
parallel: "with phases 10, 11, 12, 16; before phase 15 if both run (same driver functions)"
effort: ~1d
net_size: "Node 0 / Rust +40 / tests +15 (estimate)"
---

# Phase 13 — Conditional A2 (F-C5's cache half)

## Context

Arbitration §6 Q3 A2, D9 (parked hidden addition, red-team); speed F-C5: `config --null --show-origin --list` and `rev-parse --show-object-format` are read 2–3 times per worktree add (`driver.rs:364-388` checkout handle never reuses formats, `:369`; `worktree.rs:537-550`); ≈ 15–20 ms per add. **Runs only if A2 is picked.** Phase 4 already did the non-cache half (reuse a held inspect port).

## Requirements

- A per-process map keyed by `(common_dir, checkout root)` holds the resolved `RepoHandle` facts (object format, ref format, trusted main root) and the `ConfigStamp`; a lookup re-validates with the existing stamp check (`driver.rs:686-729` `validated_config`: `ConfigStamp::read(paths) == cached.stamp`) and re-resolves on any difference; formats are re-read when the stamp or the `HEAD`/`config` inode changes. One cache door: `REPOSITORY_CONFIG` (`driver.rs` `publication_preflight`, `:676-684`) and this map become one structure, not two.
- Red tests first (`packages/git/rust/src/driver.rs` inline, owner of the config cache): "a second handle for the same repository in one process reads its config and formats once"; "a config change between two handles is seen by the second". Child count per add measured before/after (speed method).

## Files

**Modify**: `packages/git/rust/src/{driver.rs,worktree.rs}`, inline tests. **Delete**: the second cache (`REPOSITORY_CONFIG` folded into the handle map). **Tests to retire**: none.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p13-target cargo test -p fgos-git`; Node one-file: `test/git/worktree.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/git/inspect.test.mjs`; OPC review.

## Net size

Node 0 / Rust +40 / tests +15.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A stale handle survives a repository being re-initialised in place | L × H | Stamp includes the config files and `HEAD`/`config` inode; red test 2 |
| Cache grows in a long-lived process touching many repositories | L × L | Bounded by repositories touched; the supervisor and doctor touch few |

## Rollback

Revert the commit.

## Done when

Both cases green; child count per add drops by ≥ 3; OPC verdict.
