---
phase: 10
title: "Conditional on Q1 = (a): fewer fsyncs on a worktree add, the pin still durable before the effect"
status: pending
condition: "runs only if the owner answers yes to Q1 with option (a); with (b) the big lead re-plans this file; with (c) or no answer it does not run"
depends_on: [09]
parallel: "with phases 11, 12, 14 (disjoint files); before 13 and 15 (they also touch driver.rs only if run; refs.rs is this phase's alone)"
effort: ~0.5d
net_size: "Node 0 / Rust ±15 / tests +10 (estimate)"
---

# Phase 10 — Conditional Q1 (F-C2)

## Context

Arbitration §6 Q1 and D4 (a spec §10 change, owner's call); speed seat F-C2 and R2.3 (25 fsyncs ≈ 131 ms of a 184 ms add; ≈ 8–10 of them are the pin's two `core.fsync=all` ref writes and two `sync_refs` chains). Red-team: count reproduced from the traces, Medium. **Runs only if the owner answers Q1 = (a).** Nothing in phases 1–9 depends on it.

## Requirements

- Invariant kept (spec §10 "pin before target CAS"): the pin's ref file **and** its directory chain are durable before the TargetAttempt record of a Worktree operation; the release of the pin is durable before `PinReleased`.
- Change: the pin's `update-ref` (`refs.rs:290-335` `install_pin`, `:336-396` `release_pin`, `-c core.fsync=all` at `:375-376` and the install twin) uses the narrowest git fsync class that still covers the ref (`core.fsync=reference`, available at the 2.53 floor) instead of `all`, and the ref-directory chain (`sync_refs`, `refs.rs:241-273`) is synced **once per operation** before the effect instead of once per ref write. Other kinds (Publication, Land) are unchanged.
- Spec §10: one sentence stating the per-operation sync for Worktree kinds and why the invariant holds.
- Red test first (behaviour that must hold, not the count): extend `tests/worktree.rs` with a fault-injected crash between the pin write and the TargetAttempt record, asserting recovery finds the pin (existing fault seam of the WAL `FaultAdapter`; if the ref-file durability is not observable there, the witness is the E1 script `scripts/git/e1-power-cut.*` run, pasted).
- Measurement (not a test): strace marginal fsync per add before/after (speed seat method); expected 25 → ≈ 16–17.

## Files

**Modify**: `packages/git/rust/src/{refs.rs,worktree.rs}`, `packages/git/rust/tests/worktree.rs`, `docs/platform/git/spec.md` §10. **Delete**: `-c core.fsync=all` on the two pin writes of Worktree kinds; the per-write `sync_refs` call for them. **Tests to retire**: none.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p10-target cargo test -p fgos-git --test worktree --test refs_remote --test land_crash_matrix --test recovery_matrix`; Node one-file: `test/git/worktree.test.mjs test/runner/worktree-admin-multiprocess.test.mjs`; OPC review.

## Net size

Node 0 / Rust ±15 / tests +10.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| `core.fsync=reference` does not cover the loose ref file on some backend (reftable) | M × H | Both backends are in the floor probes; the crash case runs on both (`refs.test.mjs` runs ×2 backends) |
| A power cut loses the pin | L × H | Invariant test + E1 run; OPC review |

## Rollback

Revert the commit; spec sentence reverts with it.

## Done when

Invariant witness green, fsync count drop measured, OPC verdict, spec sentence merged.
