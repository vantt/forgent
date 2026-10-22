---
phase: 07
title: "Closing report and handoff of T6–T9"
status: pending
depends_on: [06 closed]
effort: ~0.5d
---

# Phase 07 — Closing report and handoff of the layers above T5

## Requirements

1. **Closing report** (convention path): per layer T0–T5 the before/after table from that layer's own baseline (routes p50/p95, tests and wall time, LOC Rust/Node/test, doctor rows and conditions, backlog rows, parallel paths per job), measured net Δ of HARDEN commits vs the estimate, accepted/rejected findings with reasons, named owner-approved exceptions to "zero Node deciding logic in T0–T4", refuted hypotheses, the "proposed additions" the owner picked or not; whole-suite wall time re-measured against phase 00.
2. **One handoff table** for the out-of-scope layers — T6 Workflow (guide + case), T7 Work Lifecycle (WORK lane), T8 Skill/Domain, T9 Host & Surface (`bin/fgos.mjs`, gateway, herdr-dashboard) plus Packaging-Distribution (`fgctl`, `src/setup` 13 846 lines): per row, the items T0–T5 found there but did not own (e.g. host-runtime parts flagged at T0, the distribution canonical-JSON pair, herdr caller logic), the open owner decisions that touch it, and the main-SHA of the last measurement. Each layer measures its own baseline when its plan opens.
3. Board: HARDEN row → done with the report link; one log line.

## Inputs already recorded for the handoff table

From the T0 council ([arbitration](../reports/council-261021-1507-harden-t0-arbitration.md), plan ledger H9–H11):
- **T9 Host & Surface:**
  - `packages/host-runtime` is the T9 invocation kernel; only `civil_time` is a T0 leaf.
  - Delete candidates with no production caller: `providers/external_process/**` (≈ 4 600 lines incl. tests and the `fixture-echo-process` bin), and the test `EchoProvider` and `test.fixture.echo` registered in the production host (`apps/fgos/src/main.rs:105,225`, `catalog.rs:62-72`).
  - The admission gate is tautological in production (`authority_gate.rs:131-146`).
  - The empty `RouterPolicy`.
  - `command-routes-drift` spawns `node scripts/export-command-selectors.mjs` on every doctor run (150–250 ms); calling `checkCommandRoutes()` in-process keeps the condition.
- **Owner pick 2b (10-21 15:46):** doctor per-row timing in `fgos doctor --json`. Doctor takes 40.7 s for 145 rows on the second machine and cannot be attributed.
- **T9/Packaging, ledger H13 (owner 17:43, "nhớ nhắc T9 note vào plan"):** each CLI call should verify the release once. Today `fgos <verb>` re-hashes the whole release in the Rust host (`apps/fgos/src/legacy_exec.rs:145-148`, ~36 ms for 30 MB / 820 files on the second machine) and the Node loader hashes the addon again (~8 ms release, 75 ms debug in tests). T0 chose not to add a cross-process record (OQ-3 (c)); GIT's three criteria for any such record stand: fail closed on digest mismatch, invalidated by any change of dev/ino/size/mtime/ctime, never trusted across a different manifest digest; plus a rollback vector (activate A, B, roll back to A) and an older-release compatibility test.
- **T9/Packaging, ledger H14 (owner 17:43):** fgOS installed by `npm install -g github:vantt/forgent` is not supported; retire the channel formally (README:102-117, `docs/specs/distribution.md:34-36`, doctor messages naming it) and decide whether to block it.
- **T9 Host & Surface, ledger H17 (T1 arbitration 10-22):** two host-binary resolvers with different rules (`src/util/host-bin.mjs:41-64` falls back to *another* checkout's activation; `src/util/host-bin-path.mjs:69-98` does not), and the host's own `.fgos` ancestor walk (`apps/fgos/src/main.rs:123-143`) differs from Git's trusted main root when a worktree carries the `.fgos` symlink. Evidence: [T1 simplicity seat](../reports/council-261021-2338-harden-t1-seat-simplicity.md) S-E5, S-E7; [red-team](../reports/council-261021-2338-harden-t1-seat-redteam.md) on S-E5 (three test suites pin the fallback).
- **T9 Host & Surface, ledger H24 (T1 sub-plan D-T1-14, 10-22):** the gateway's `node <bin/fgos.mjs>` branch (`apps/fgos-gateway/src/gateway.rs:381-397`) runs the checkout channel that owner decision 10 makes unsupported for process, lock and identity verbs; T1 moves only the runner tick to the release's `fgos-runner` shim.
- **Packaging:** the release-manifest canonical-JSON producer/verifier pair (`scripts/build-rust-distribution.mjs:37-47`, `packages/distribution/rust/src/verify.rs:46-75`), if T0's corpus proof does not move it.

## Files

- **Create:** one closing report with the handoff table (convention path).
- **Modify:** `plan.md` status, board row + log.
- **Delete:** none. **Tests to retire:** none.

## Net size

Node 0, Rust 0, tests 0.

## Done when

Report committed; owner has the T6–T9 inputs to decide the next plan.
