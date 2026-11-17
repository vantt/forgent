---
contract: plan-v1
title: "Fold the Windows verbatim-path strip copies onto fgos_process::path"
description: "Ten hand-written \\?\ strips call the one door; a door row fails any new copy; a verbatim UNC root stops turning relative."
status: ready
priority: P2
effort: 1d
branch: trial/pathfold
tags: [rust, windows, one-door, process, distribution]
blockedBy: []
footprint:
  - packages/process/rust/src/path.rs
  - packages/holder-lock/rust/src/driver/windows.rs
  - packages/distribution/rust/src/workspace.rs
  - packages/distribution/rust/src/verify.rs
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/rust/src/uninstall.rs
  - packages/distribution/rust/src/test_scratch.rs
  - apps/fgos/src/legacy_exec.rs
  - apps/fgos/src/wiring/doctor/bridge.rs
  - apps/fgos/src/invocation_doors.rs
  - apps/fgctl/tests/uninstall_surface.rs
  - docs/architecture-manifest.json
  - packages/git/contracts/mutation-census.v1.json
  - CHANGELOG.md
  - docs/backlog.md
  - plans/261117-1524-windows-plain-path-fold
base: e8621a54826408a539af371ffc6a81b3ac16d76a
source:
  - docs/history/windows-plain-path-fold/DISCUSSION.md
  - p-2r54ft6njh
created: 2026-11-17
---

# Fold the Windows verbatim-path strip onto `fgos_process::path`

Input: `docs/history/windows-plain-path-fold/DISCUSSION.md` (design §6, tasks §7, settled D1-D6). Nothing here re-decides those; this plan only orders the work.

## Outcome

`packages/process/rust/src/path.rs` is the only Rust product file that strips the Windows verbatim prefix (`\\?\`). The seven production and three test copies call `plain_path` (or `fgos_process::path::plain_path_unc_share` for holder-lock, D6) and their hand-written strips are gone. A `door` row in `docs/architecture-manifest.json` fails any new raw-string `\\?\` literal outside path.rs. A verbatim UNC root (`\\?\UNC\h\s\x`) no longer becomes the relative path `UNC\h\s\x` in the agent-hook shim, workspace root, verified payload path, legacy payload path or doctor bridge module. No drive-path output changes anywhere.

## Acceptance criteria

1. `rg -n -F 'r"\\?\' --type rust` outside `packages/process/rust/src/path.rs` shows only test literals (`uninstall.rs` `mod tests`) and comments (`holder-lock driver/windows.rs` doc comment, if kept); no `strip_prefix` / `replacen` / `trim_start_matches` of the prefix remains.
2. `node scripts/run-tests.mjs test/architecture.test.mjs` green, including "every door row holds" with the new row; seeding `s.strip_prefix(r"\\?\")` into any other product `.rs` file under `apps/` or `packages/` makes that test fail (checked by hand once, then reverted).
3. `cargo test -p fgos-process -p fgos-distribution -p fgos -p fgctl -p fgos-holder-lock` and `cargo test --workspace` green.
4. `cargo check --target x86_64-pc-windows-msvc -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --tests` and the same for `aarch64-apple-darwin` green (needs the targets installed via `rustup target add`).
5. `cargo clippy --workspace --all-targets -- -D warnings` and `cargo fmt --all --check` green.
6. `node scripts/git-one-door-scan.mjs --root .` count not higher than at base; `packages/git/contracts/mutation-census.v1.json` regenerated with `--write-census` and staged; `node scripts/run-tests.mjs test/setup/git-mutation-census.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs` green.
7. `packages/process/rust/src/path.rs` holds `plain_path_unc_share` with one test case (`\\?\UNC\h\s\x` -> `\\h\s\x`; `\\?\D:\x` -> `D:\x`); holder-lock `description_path` calls it and strips nothing itself.
8. `CHANGELOG.md` `## [Unreleased]` has one line for the UNC fix; `docs/backlog.md` row p-2r54ft6njh marked done.

## Non-goals

- Node copies (`src/runner/worktree.mjs` `stripExtendedPrefix`, `test/rust-host/fgctl-init-fixture.mjs`) and the cmd.exe batch text in `packages/distribution/rust/src/shim.rs` (D5).
- One UNC spelling for every caller (option B of Q1): unfiled follow-up gated on a Windows CI case over `\\localhost\C$` (D6).
- Any new caller-level test: the strip has one owning proof in path.rs (design principle 8). No new verb, config key, crate, dependency or Cargo.toml change (D2).

## Prior art

Reused: `fgos_process::path::plain_path` / `plain_drive_path` (commit 136c17338, `packages/process/rust/src/path.rs:7,15`), its re-export `fgos_git::plain_path` (`packages/git/rust/src/driver.rs:1816`), the `doors` table + `checkDoors` (`test/architecture.test.mjs:1816`, test at :1878), the census writer `scripts/git-one-door-scan.mjs`. Missing: a UNC-to-share spelling in the door (added, moved from holder-lock) and a guard row (added). Every crate already depends on fgos-process (holder-lock, distribution, fgos) or reaches it via fgos-git dev-dep (fgctl) — verified in each Cargo.toml.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Door UNC spelling and holder-lock fold](phase-01-door-unc-and-holder-lock.md) | - | packages/process/rust/src/path.rs, packages/holder-lock/rust/src/driver/windows.rs | 1 | ready |
| 2 | [Fold the distribution copies](phase-02-fold-distribution.md) | - | packages/distribution/rust/src/workspace.rs, packages/distribution/rust/src/verify.rs, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/src/uninstall.rs, packages/distribution/rust/src/test_scratch.rs | 1 | ready |
| 3 | [Fold the app copies](phase-03-fold-apps.md) | - | apps/fgos/src/legacy_exec.rs, apps/fgos/src/wiring/doctor/bridge.rs, apps/fgos/src/invocation_doors.rs, apps/fgctl/tests/uninstall_surface.rs | 1 | ready |
| 4 | [Door row, census, changelog, integration gate](phase-04-integration.md) | 1, 2, 3 | docs/architecture-manifest.json, packages/git/contracts/mutation-census.v1.json, CHANGELOG.md, docs/backlog.md | 2 | ready |

Discussion tasks task-door-unc-spelling and task-fold-holder-lock are merged into phase 1: both are a few lines, holder-lock needs the new function, and merging lets all three folds start in wave 1.

Hot files: `packages/git/contracts/mutation-census.v1.json` (generated; only phase 4 regenerates it, never hand-merged), `docs/architecture-manifest.json`, `CHANGELOG.md`, `docs/backlog.md` — all phase 4 only. Wave-1 phases do not touch the census even though their files are listed in it; their branches fail the census test alone, which is expected, and phase 4 regenerates on the combined tree.

Partial tree: if a wave-1 phase has not merged when phase 4 runs, phase 4 lists each remaining strip site as a `debt` entry of the door row so the gate holds; the row ends with `debt: []` only when all three merged.

Checked with `node scripts/plan-contract-check.mjs --plan plans/261117-1524-windows-plain-path-fold`: waves after dependencies, wave-1 footprints disjoint.

## Owner questions

None. Q1 (the door's UNC spelling) was answered by HARDEN as option C, recorded as D6 in the discussion; the function name `plain_path_unc_share` is the planner's choice (D6 left it to the planner).

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| Windows-only code (holder-lock driver, `cfg(windows)` test blocks, `uninstall.rs` `comparable` Windows branch) cannot run on Linux | M x M | `cargo check --target x86_64-pc-windows-msvc ... --tests` per phase and in phase 4; Windows CI on push |
| `uninstall.rs` `comparable` drive-path result changes | L x H | `Path::components` of `\\?\C:\x` gives prefix `\\?\C:`, trimmed to `c:`; `plain_path` gives `C:\x` whose prefix is `C:` -> `c:`; same vector. Existing `uninstall.rs` tests (826, 828) cover verbatim home refusal on Windows CI |
| Non-UTF-8 path: old copies used `to_string_lossy` then stripped; `plain_path` uses `to_str` and returns a non-UTF-8 path unchanged (verbatim) | L x L | A lossy path was already a different, broken path; verbatim stays a valid path. Accepted, noted here |
| UNC workspace gets a new workspaceId (`compute_workspace_id` hashes the root, workspace.rs:71) | L x L | Accepted in discussion §3: the old relative root never worked with Git, so no working UNC workspace has an id to keep |
| Door-row regex catches a legitimate future literal | L x L | Test literals and comments are blanked by `doorText`; `tests/` dirs are pruned; a real need adds an `allowed` entry with a reason |
| Census drift from parallel branches | M x L | Census is regenerated once, by phase 4, on the merged tree |

Rollback: each phase is one commit on its own branch; revert the commit. Phase 4 revert removes the row, census and changelog together; reverting a wave-1 fold after phase 4 landed requires adding its site as a `debt` entry or reverting phase 4 too. Single revert path for the whole item: `git revert` the merge commit on main.
