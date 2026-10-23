---
phase: 15
title: "Conditional on A4: PATH out of the Git floor key"
status: pending
condition: "runs only if the owner picks A4 in Q3 (the arbitration recommends not to)"
depends_on: [09]
parallel: "with phases 10, 11, 12, 16; after phase 13 if both run (same driver functions)"
effort: ~0.5d
net_size: "Node 0 / Rust ±10 / tests +5 (estimate)"
---

# Phase 15 — Conditional A4 (F-C3's behaviour half)

## Context

Arbitration §6 Q3 A4, D9 (parked: behaviour change, not a fold; red-team). Speed F-C3: `PATH` in the floor key (`driver.rs:1331-1374`, `"path"` field) makes the floor re-probe when `PATH` changes although the key already records the git binary path and its identity (`"git"`, `"binary"`). Benefit small; risk: a different git earlier on `PATH` could reuse a stale floor. **Runs only if A4 is picked.**

## Requirements

- Remove `"path"` from the key only if every child git runs uses the absolute `self.git` and git's own exec-path (helpers like `git-remote-https` are resolved from `--exec-path`, not `PATH`); `ssh` stays resolved on `PATH` (`core.sshCommand=ssh …`, `remote.rs:24-39`), so the floor verdict must not depend on `ssh` — the lead proves this from the floor probes (`git-floor.v1.json` probes list) before the change.
- Bump the key version (`"v": 2` → `3`) so old records are re-probed once.
- Red test first: extend `driver.rs:2687` `floor_key_names_the_git_binary_and_config_identities` with "a different git binary changes the floor key whatever PATH says" and "a PATH change alone keeps the floor record".

## Files

**Modify**: `packages/git/rust/src/driver.rs` (`floor_key`, inline tests). **Delete**: the `"path"` key field. **Tests to retire**: none.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p15-target cargo test -p fgos-git --lib -- driver::`; OPC review.

## Net size

Node 0 / Rust ±10 / tests +5.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A probe outcome depends on a `PATH`-resolved helper | M × H | Proof step before the change; if any probe depends on `PATH`, the phase stops and reports "kept by evidence" |

## Rollback

Revert; the key version bump makes old and new records distinct, so a rollback re-probes once.

## Done when

Both cases green and the probe-independence proof recorded, or the phase closed "kept by evidence".
