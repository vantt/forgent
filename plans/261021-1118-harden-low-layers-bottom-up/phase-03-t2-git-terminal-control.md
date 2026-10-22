---
phase: 03
title: "T2: Git, Terminal-control"
status: pending
depends_on: [02 closed]
effort: ~5d (rough)
---

# Phase 03 — T2: Git, Terminal-control

Template layer: follow the loop in [plan.md](plan.md#the-per-layer-loop).

## Context links

Specs: [git](../../docs/platform/git/spec.md) (§12 one-door gate, §15 E6 test inventory), [terminal-control](../../docs/platform/terminal-control/spec.md); [component-boundary](../../docs/platform/component-boundary.md); backlog `p-d2dc4f2e`, `p-f97bb935` (brief typed into a shell pane; being fixed by lead `brief-shell-guard` — take its result as input, do not redo); [TEST plan](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) phase 2 rows git (92 Node tests in 22 files vs 202 Rust) and terminal-control (19 in 3 vs 88).


## Received from other lanes (record here, never lose)

- **R2: contained git cost (TEST runner lead, 2026-10-21 23:10).** Every Rust git-port command runs under `bwrap --unshare-pid --as-pid-1 --dev-bind / /`; 10 `addWorktreeSync` calls = 218 bwrap + 249 git execs, ≈ 0.5 s per worktree add against ≈ 20 ms for a plain `git worktree add`. Users pay it on every worktree add; it is the main cost of the runner test area. Same root as ledger H6 (now an input row of the OPC design, `plans/reports/design-261020-1035-operation-scoped-containment.md`). The T2 Git council owns it together with the GIT lane's OPC design: decide which git calls need a pid namespace, and whether one containment domain per typed operation replaces one bwrap per git child. Evidence: `plans/reports/phase-lead-261021-2137-test-governance-p3-runner.md` §4.
  - **OPC baseline (2026-10-22 16:00, [report](../reports/research-261022-1341-opc-phase-a-baseline.md), main `2eec4aea9`):** one run of `test/runner/worktree-admin-multiprocess.test.mjs` starts 376 contained git children, 51 borrowed and 63 plain. Re-measure R2 against this after OPC Phase A lands.
  - **OPC measurement (2026-10-22 13:20, `forgent-35`):** per contained child, bwrap adds ≈ 2.3 ms (central) and `driver.rs`'s 2 ms poll ≈ 1.4 ms; at ≈ 22 bwrap per worktree add that is ≈ 80 ms, which does **not** explain R2's ≈ 0.5 s. T2 re-measures R2 end to end before designing, and designs around OPC's operation-domain port proposal.
  - **When R2 lands, ping TEST** (`forgent-f8`, or whoever owns TEST then): the owner cut `test/runner/worktree-admin-multiprocess.test.mjs` from 8 × 20 to 8 × 5 rounds (`ROUNDS`) until contained git is cheap; TEST plan row W2 (`plans/261020-1757-…/plan.md`) puts it back to 20. Recorded 2026-10-22 07:58.

## Components, crates, Node

| Component | Rust | Node around it |
|---|---|---|
| Git | `packages/git/rust` (35 474 lines), N-API addon `packages/git/node-addon` | `src/git/*` 13 files, 301 lines (already a thin facade over the addon); no raw `git` spawn left in `src`/`bin` (`rg` for `spawn*/exec*('git'` = 0) |
| Terminal-control | `packages/terminal-control/rust` (4 717) | `src/terminal-control/{client,config}.mjs` (383); `herdr` appears in 55 Node files (`rg -l herdr src`; 12 with a quoted `'herdr'` literal), including whole modules `src/runner/dispatch/herdr-round.mjs`, `herdr-agent.mjs`, `herdr-deadlines.mjs`, `worker-session*.mjs` — council separates pane access that bypasses the port (T2) from transport caller logic (T5) |

Doctor rows: git — 8 rows registered in one loop at `src/setup/registrations.mjs:6652-6664` (`git-worktree-recovery`, `git-component-compatible`, `git-transport-config`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`) plus `git-mutation-one-door` :6666 and 4 fixes :6683-6686; terminal — `terminal-control` :4680, `terminal-config` :4685, `terminal-allocations` :4690, config default `terminal` :4694, fix `terminal-dir` :4695. Gate 8: doctor table; git's 9 rows are a fold candidate.

## Constraints

- Git is the largest crate added recently (+32 337 Rust lines since 10-10, review §1): the council's weight lens asks what in it can go.
- OPC (operation-scoped containment) is a held, separate capability: not built here.
- The combined addon's ownership question from phase 01 Q1 lands here if T0 chose a T0 loader leaf: the Git loader delegates to it.
- Terminal-control callers in SEAT files (`run.mjs`) wait for SEAT landing.

## Files

Filled by the T2 sub-plan with Create / Modify / **Delete** / **Tests to retire**. Tests to retire: what TEST phase 2 has not already retired, plus tests of mechanisms T2 deletes.

## Net size

Estimate before council (HARDEN commits only): Node −200 to −1 000 (herdr pane access moving behind the port), Rust −500 to 0 (dead paths in a 35 k-line crate), tests −200 to −600. Layer total ≤ 0.

## Risks (layer-specific)

| Risk | L × I | Mitigation |
|---|---|---|
| Git changes touch every land/commit path | M × H | Red test first, full suite + Git crash matrix. |
| herdr-specific Node code outside the port is caller code of T5 | M × M | List here, move with T5 when it is caller logic. |

## Done when

Loop close criteria; Node decides no git operation or pane allocation; T2 net size ≤ 0.
