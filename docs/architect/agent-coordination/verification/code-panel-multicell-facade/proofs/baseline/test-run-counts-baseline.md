# Baseline Test Run Counts (Requirement R5 / Phase 04 Baseline)

Recorded: 2026-09-15  
Base Reference: `45569ac3379445e93436524c1226159b3869265c`  
Authority: `plans/260915-code-panel-multicell-facade/phase-00-contract-and-baseline.md` (R5 / Step 5)

This document captures the baseline counts of test executions (focused vs. affected vs. full test suite) across existing coordination traces under `docs/architect/agent-coordination/verification/`. This empirical baseline provides the before/after reference for Phase 04 to quantify feedback cost reduction and test reuse.

Note on terminal-close reproduction: Terminal-close verification for `tsk-1bh` relies explicitly on the already-committed trace recorded in commit `99812f28` rather than a fresh in-cell re-run. Historical test execution counts for pre-test-policy tracks are explicitly marked as `~unverified estimate` (historical approximations), whereas counts for `code-implementation-track-policy` are cited directly against committed verification traces.

---

## 1. Track Comparison: Test Execution Counts by Tier

| Track Name | Scope & Cells | Focused / Targeted Runs | Affected Runs | Full-Suite Runs (`npm test`) | Full Runs per Cell | Notes / Policy |
|---|---|---|---|---|---|---|
| **`code-implementation-track-policy`** (Immediate predecessor) | 5 cells (P01–P05), docs & engine policy | **7** | **0** (not isolated) | **3** (P02 baseline, P03 escalation, P05 Lead direct) | **0.6** | Introduced the 3-tier model (`focused`, `affected`, `full`) and proof reuse across identical `(tree, environment)` states. Eliminated redundant full runs on review/red-team. |
| **`rust-host-r1-kernel`** (Pre-test-policy track) | 17 cells (P00–P16), Rust binary + Node CLI | **~45 (~unverified estimate)** | **0** | **~32 (~unverified estimate)** (repeated across multiple fix rounds in P07, P09, P10, P11, P13, P15, P16) | **~1.9 (~unverified estimate)** | Full suite run repeatedly per cell and per fix round, taking ~3-5 minutes per run (historical approximation). |
| **`confinement-authority-implementation`** (Pre-test-policy track) | 9 cells (P00–P08), sandbox & authority | **~30 (~unverified estimate)** | **0** | **~12 (~unverified estimate)** (P00, P01, P04, P07, P08, merge) | **~1.3 (~unverified estimate)** | Full suite run whenever high-risk boundaries were touched or during final rounds (historical approximation). |
| **`runtime-recovery`** (Pre-test-policy track) | 10 cells (P00–P08), CAS recovery & runbooks | **~25 (~unverified estimate)** | **0** | **~18 (~unverified estimate)** | **~1.8 (~unverified estimate)** | Full suite executed mechanically across fix rounds (historical approximation). |

---

## 2. Detailed Breakdown: `code-implementation-track-policy` (Trace Data)

Source traces: `docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md` through `p05.md`.

- **P01 (Authoring Template & Coding Verification Fragment):**
  - Proof tier: `targeted` (docs-only)
  - Focused runs: 1 (`node --test test/setup/instruction-registry.test.mjs test/setup/instruction-composition.test.mjs`, 59 pass)
  - Affected runs: 0
  - Full-suite runs: 0
- **P02 (Plan-Loop Proof Tiers & Verification Block Contract):**
  - Proof tier: `targeted` with initial baseline capture
  - Focused runs: 1 (167 pass)
  - Affected runs: 0
  - Full-suite runs: 1 (`npm test` clean env; established corrected baseline of 52 unique failing tests: 51 test/rust-host/* due to missing compiled Rust binary in worktree + 1 in test/cli/fgos-intake-4.test.mjs:318 deterministic pre-existing seq mismatch; 6467 pass + 52 fail + 9 skipped = 6528 total)
- **P03 (FOCUSED_TESTS / AFFECTED_TESTS / FULL_TEST Execution Contract):**
  - Proof tier: escalated to `full-suite-gate` per Lead judgment
  - Focused runs: 1 (`node --test test/skills/*.test.mjs test/setup/*instruction*.test.mjs test/setup/skill-wrappers.test.mjs test/architecture.test.mjs`, 167 pass, ~1.9s)
  - Affected runs: 0
  - Full-suite runs: 1 (52/52 matched baseline, 0 new)
- **P04 (Proof Reuse & Tree-Identity Edge Cases):**
  - Proof tier: `targeted` (no FULL_TRIGGERS fired)
  - Focused runs: 2 (reviewer op_026 + lead re-run, 167 pass, ~1.8s)
  - Affected runs: 0
  - Full-suite runs: 0 (reused proof; no full re-run on merge because track-level gate handles main integration)
- **P05 (Engine Fix tsk-1bh & Stamped Provenance):**
  - Proof tier: `targeted` (839 coordination tests) + Lead full run
  - Focused runs: 2 (839/839 coordination suite + 167/167 targeted suite)
  - Affected runs: 0
  - Full-suite runs: 1 (Lead clean env run: 6467 pass, 52 fail [51 rust-host pre-existing + 1 fgos-intake-4 pre-existing], 9 skipped = 6528 total)

**Total `code-implementation-track-policy` counts:**
- Focused runs: 7
- Affected runs: 0
- Full runs: 3

---

## 3. Targets for `code-panel-multicell-facade` (P00–P05)

1. **Targeted / Focused tier:** Used as the default on every implementation and fix round for every cell.
2. **Affected tier:** Materialized when blast radius indicates downstream impact (e.g. via GitNexus impact analysis), avoiding immediate jump to full suite.
3. **Full suite gating:**
   - Run at most once per distinct `(tree, environment)` state per cell.
   - Run only when explicit `FULL_TRIGGERS` fire or at the final integrated gate before merging to main.
   - Reviewer and red-team evaluate existing valid proofs rather than re-running `npm test` mechanically.
4. **Expected total full suite runs for track (P00–P05):**
   - P00: 0 (docs-only cell; focused 130-test suite)
   - P01: 0 or 1 (full-suite gate only if projected/shared skill mechanical triggers hit)
   - P02: 0 (targeted test fixtures)
   - P03: 0 or 1 (full-suite gate only if resume implementation exceeds skill prose)
   - P04: 1 (merged; full-suite gate on session-engine.mjs orphaned-authorization engine bugfix certified clean at testedSha `b16dd524` / integratedSha `d13570c4` / post-merge `ebeef714`; 6530 tests, 6469 pass, 52 fail matching baseline)
   - P05: 1 (final integrated gate on track branch synced with main)
   - **Target full suite runs:** <= 3 across all cells.
