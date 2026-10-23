---
phase: 12
title: "Conditional on A1: retained-chain count and oldest age in the git-operation-journal row"
status: pending
condition: "runs only if the owner picks A1 in Q3"
depends_on: [09]
parallel: "with phases 10, 11, 13, 15, 16"
effort: ~0.5d
net_size: "Node +5 / Rust +10 / tests +5 (estimate)"
---

# Phase 12 — Conditional A1

## Context

Arbitration §6 Q3 A1 (speed addition 4): 322 chains grew over four days unnoticed. Problem: an unbounded chain kind is invisible until it costs time. Benefit: the next one shows as a doctor warning. **Runs only if A1 is picked** (the arbitration recommends it). If A1 is picked before phase 5 slice 3 runs, that slice leaves `Backlog.ledger_entries`/`ledger_capacity_warning` in place for this phase to wire (phase 5 note).

## Requirements

- `inspectGit`'s journal facts (addon `packages/git/node-addon/src/git.rs` `inspect_git`, journal object) add `retainedChains` (count of non-compacted terminal chains, from the `scan` the call already runs) and `oldestRetainedAtMs`; `ledgerEntries` and `ledgerCapacityWarning` come from the existing `Backlog` fields (`wal.rs:2303-2305`) instead of being dropped.
- `git-operation-journal` (`src/setup/git-checks.mjs`) passes with a `warning:` sentence when retained terminal chains exceed **64** or the oldest is older than **7 days**, or the ledger capacity warning is set; the sentence names the count, the age and the next step (`fgos doctor` again after the next operation of that kind compacts it, or report it). The two thresholds are named constants in `git-checks.mjs`, stated in spec §12; the owner may change them in the answer.
- Red test first: `test/setup/git-checks.test.mjs` "the journal row warns when finished operations keep piling up" with an injected `inspectGit` facts object (the row's existing injection), plus one Rust case in `wal.rs` that `retained` counts only terminal non-compacted chains (extends the scan owner case).

## Files

**Modify**: `packages/git/node-addon/src/git.rs`, `packages/git/rust/src/wal.rs` (only if a field must be exposed), `src/setup/git-checks.mjs`, `test/setup/git-checks.test.mjs`, `docs/platform/git/spec.md` §12. **Delete**: none (the unread `Backlog` fields become read). **Tests to retire**: none.

## Verification (exact)

`CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p12-target cargo test -p fgos-git --lib -- wal::`; Node one-file: `test/setup/git-checks.test.mjs test/git/native-load.test.mjs`; OPC review (addon).

## Net size

Node +5 / Rust +10 / tests +5. Paid by phase 7's −55; layer ceiling unaffected.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Thresholds warn on a legitimately busy repository | M × L | A warning, never a failure; thresholds in the spec |

## Rollback

Revert the commit.

## Done when

The warning case green; the doctor row prints count and age on this checkout; spec §12 names the thresholds.
