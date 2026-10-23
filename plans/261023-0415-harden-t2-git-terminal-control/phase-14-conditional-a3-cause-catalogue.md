---
phase: 14
title: "Conditional on A3: a cause catalogue causes.v1.json generated from one Cause enum"
status: pending
condition: "runs only if the owner picks A3 in Q3 for T2 (the arbitration recommends A3 later, as its own item)"
depends_on: [09]
parallel: "none: alone and last of the conditional phases (it touches every Git source file)"
effort: ~3d
net_size: "Node 0 / Rust large rename (estimate +150 net for the enum and generator) / tests +20"
---

# Phase 14 — Conditional A3 (F-6)

## Context

Arbitration §6 Q3 A3 (simplicity F-6 and its addition 4): ≈ 500 cause literals, none contracted, some free text with embedded data, several flattened to a generic name; the only machine field Node reads is `cause`. Problem: an agent cannot switch on a name it cannot look up. **Runs only if A3 is picked for T2.** Recommended instead: open it as its own backlog item after T2 (arbitration). If it runs, it runs alone after every other phase, because it renames causes across every port file.

## Requirements

- One `Cause` enum in `fgos-git` (kebab `Display`, serde), every `failure(..)`/`refused(..)`/`recovery(..)` constructor (phase 5's single constructors) takes a `Cause`; `format!` inside a cause is forbidden; variable data moves into `detail`.
- `packages/git/contracts/causes.v1.json` generated from the enum by a test-time generator (`tests/contracts.rs` writes nothing; it compares the committed file with the enum, like `result_codes_match_machine_contract`).
- Flattened generic causes split where callers need the difference (`checkout-command-failed`, `land-git-failed`, `failure(e)` on `io::Error`, `remote-outcome-unknown` overwrite at `remote.rs:582-589`, seat F-6 list); `SyncResult.state` closed to its named set.
- Every Node and Event Store site that compares a cause string moves in the same change (`rg -n "cause ===|cause\)\.startsWith|\.cause ==" src packages/event-store`), L10.
- Red test first: `tests/contracts.rs` "every cause the crate can emit is in the committed catalogue" (fails today: no catalogue).

## Files

**Create**: `packages/git/contracts/causes.v1.json`. **Modify**: every `packages/git/rust/src/*.rs`, `packages/git/rust/tests/*.rs`, cause-comparing Node sites, `docs/platform/git/spec.md` §2. **Delete**: free-text causes. **Tests to retire**: none; assertions on renamed causes move.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p14-target cargo test --workspace`; full `npm test` by the big lead; OPC review per port file.

## Net size

Node ±0 / Rust +150 (enum, generator check) offset by removed `format!` sites / tests +20. Counted against the layer ceiling; if it breaks the Rust ≤ 0 ceiling, it is not run in T2.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A renamed cause breaks a consumer outside the repo (other projects' scripts) | M × M | Catalogue lists old → new for one release in the CHANGELOG; no alias mechanism |
| Size and review load delay T2's close | H × M | Recommended as its own item; run last and alone |

## Rollback

Revert the phase's commits (one per port file).

## Done when

Catalogue committed and pinned; no free-text cause left (`rg -n 'failure\(format!' packages/git/rust/src` → nothing); full suites green.
