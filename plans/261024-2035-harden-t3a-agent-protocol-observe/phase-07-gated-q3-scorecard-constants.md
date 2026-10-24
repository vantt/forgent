---
phase: 07
title: "GATED: owner Q3 — remove the constant or always-zero metrics harness sections and the unbuilt coordination-session contract"
status: pending
gated_by: "owner Q3 (open since decision 32: the owner asked what it means)"
depends_on: [04, "owner answers Q3 = remove"]
parallel: "runs only after 04 (same harness/scorecard files); never blocks 01–06 or the landing"
effort: ~0.5d
net_size: "Observe Rust src −560 / tests −335 / contract and fixture data −≈90 — estimates; only if Q3 = remove"
---

# Phase 07 — Gated: scorecard sections with no producer (owner Q3)

## Gate

Do nothing until the owner answers Q3. If the answer is "keep", this phase is closed as not done and the sections stay. If the answer comes after phase 06 landed, this phase writes its own spec and `CHANGELOG.md` lines (nothing else is editing them then); before that, phase 06 carries them.

**Plain wording for the owner (the owner asked what Q3 means):** `fgos metrics harness` prints a report card. Four parts of it never carry real numbers: `complexity` (two numbers are typed into the code, `total_routes = 50` and `native_routes = 2`, and it counts ≈ 494 k lines of tracked files on every call), `sessions` (always zero: nothing produces the `coordination`/`workflow` observations it reads), `friction` (always the text `"n/a (pre-F5)"`), and `entropy.counts.frictions` (always 0). Nothing reads them. Removing them makes `metrics harness` faster and stops it printing numbers that look measured but are not; the visible change is that these keys disappear from its JSON. The contract `coordination-session.read.v1.json` describes a source nobody builds and would go too.

## Requirements (only if Q3 = remove)

1. **`complexity` (D8):** delete `compute_complexity` (`packages/observe/rust/src/metrics_cli/harness.rs:161-179`, constants at `:169-170`), `compute_loc_breakdown` (`:181`), `extract_protocol_id_from_file` (`:231`), `scan_tier_directory` (`:268`), `count_protocols_defined` (`:294`), `count_protocols_used` (`:325`), the harness wiring (`:137`), `ComplexitySection` and `LocBreakdown` (`scorecard.rs:110-127`, field `:141`), `tracked_files` and `count_lines_of_code` (`sources/repo.rs:38`, `:56`) if no other caller remains (re-grep), `tests/harness_protocols_test.rs` (200 lines), and the `fgos-yaml-doc` dependency if `harness.rs:241` was its only use.
2. **`sessions` (D9):** delete `compute_sessions` (`scorecard.rs:344` onward), `SessionsSection` (`:52`), field `:136`, the harness wiring (`harness.rs:111`), and its unit test in `scorecard.rs`; `percentile` (`:330`) stays (used by `compute_work`).
3. **`friction` string (D10):** field `scorecard.rs:140` and `harness.rs:151`.
4. **D12:** `EntropyCompounded` (`metrics_cli/entropy.rs:48-52`) and `EntropyCounts.frictions` (`:37`, set `:96`).
5. **Coordination-session contract:** delete `packages/observe/contracts/coordination-session.read.v1.json`, its two uses in `test/observe/observe-contracts-fixtures.test.mjs` (`:43`, `:158-170` block), the fixture tree `test/fixtures/observe/.fgos/coordination/` and the regenerator section that writes it (`scripts/regenerate-observe-fixtures.mjs`, re-grep `coordination`), and the reference in `docs/specs/observe.md` § Contract (`:72`); the regenerator writes the tree at `:135-136` and lists it at `:356`.

## Files

- **Modify:** `packages/observe/rust/src/{metrics_cli/harness.rs,metrics_cli/entropy.rs,scorecard.rs,sources/repo.rs}`, `packages/observe/rust/Cargo.toml` (maybe), `test/observe/observe-contracts-fixtures.test.mjs`, `scripts/regenerate-observe-fixtures.mjs`, `docs/specs/observe.md`, `CHANGELOG.md`, census, `Cargo.lock` (maybe).
- **Delete:** `packages/observe/rust/tests/harness_protocols_test.rs`, `packages/observe/contracts/coordination-session.read.v1.json`, `test/fixtures/observe/.fgos/coordination/**`.
- **Tests to retire:** `tests/harness_protocols_test.rs` (behaviour removed), the `compute_sessions` unit test (behaviour removed), the coordination-session block of `observe-contracts-fixtures.test.mjs` (contract removed).

## Validation (focused)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p07-target
cargo test -p fgos-observe
node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/observe/observe-contracts-fixtures.test.mjs'])"
node scripts/regenerate-observe-fixtures.mjs && git status --short test/fixtures/observe   # only the deleted coordination tree
```

Land gates as in phase 04 for `fgos-observe`.

## Success criteria

- `rg -n "total_routes|native_routes|compute_sessions|n/a \(pre-F5\)|coordination-session" packages src test docs/specs` → 0 hits.
- `metrics harness` p50 drops by the tracked-file count (≈ 0.3 s, speed seat S-2), measured.

## Risk

| Risk | L × I | Mitigation |
|---|---|---|
| An unseen consumer reads a removed key | L × M | `rg` over `src`, `bin`, `apps`, `packages`, `herdr-dashboard`, `apps/fgos-gateway` for each key before deleting; the owner's "remove" covers the public JSON change; CHANGELOG line |

## Rollback

Revert the commit; the keys come back.
