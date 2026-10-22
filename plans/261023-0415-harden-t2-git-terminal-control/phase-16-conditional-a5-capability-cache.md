---
phase: 16
title: "Conditional on A5: herdr capabilities cached per binary identity and server incarnation"
status: pending
condition: "runs only if the owner picks A5 in Q3 (the arbitration recommends not to)"
depends_on: [09]
parallel: "with phases 10, 12, 13, 15; after phase 11 if both run (same driver file)"
effort: ~0.5d
net_size: "Node 0 / Rust +40 / tests +10 (estimate)"
---

# Phase 16 — Conditional A5 (F-C7's cache half)

## Context

Arbitration §6 Q3 A5, D9 (parked hidden addition). Speed F-C7: every terminal op re-runs `herdr --version` and `herdr pane layout --help` (`driver/herdr.rs:368-398`) and `status server --json` for the endpoint (`:335-355`); ≈ 2 herdr children per op at 8.7 ms p50 per op. Benefit ≈ 2 children per op; cost a cache. **Runs only if A5 is picked.**

## Requirements

- The capability report and endpoint are stored in the terminal store under the current incarnation directory, keyed by the herdr binary identity (path + inode + mtime, the same identity shape the store already records for its incarnation) and the server incarnation; an op reads it and re-probes only when either differs or the file is unreadable. Written with `publish_once` semantics (phase 6's honest durability).
- Red tests first: extend phase 6's invocation-count case in `herdr_driver_fake.rs`: "a second operation on the same server incarnation runs no probe command"; "a new incarnation or a replaced herdr binary probes again".

## Files

**Modify**: `packages/terminal-control/rust/src/{driver/herdr.rs,store.rs,core.rs}`, `packages/terminal-control/contracts/allocation-record.v1.json` (cache file shape), tests. **Delete**: none. **Tests to retire**: none.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p16-target cargo test -p fgos-terminal-control -p fgos-run-supervisor`; Node one-file: `test/terminal-control/client-route.test.mjs test/terminal-control/group-queue.test.mjs`.

## Net size

Node 0 / Rust +40 / tests +10.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A herdr upgrade in place keeps the old capability set | L × M | Binary identity in the key; red test 2 |

## Rollback

Revert; the cache file is ignored by the previous release (it reads no such file).

## Done when

Both cases green; per-op herdr children measured 2 → 0 on a warm incarnation.
