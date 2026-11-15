---
phase: 11
title: "S2 close: docs, proof consolidation, parity re-run, gates"
status: pending
effort: 1d
wave: D
step: S2
blockedBy: [2, 3, 4, 5, 6]
---

# Phase 11: S2 close

Write down what S2 settled where a stranger agent looks for it, rerun every S2 parity table on the integration head
against the base release, delete the transitional runner and tables, add the step's retired-code row, run every
gate, and hand the branch to the step lead for landing (S2 lands before S3).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p11`. Report slug `s2-p11-close`.

## Requirements

1. **Parity re-run, then deletion.** Run `test/rust-host/verb-parity.test.mjs` with every S2 table (`git`,
   `lock-status`, `lock`) host-vs-base-release; record cases, passes and the accepted
   differences per verb (plan.md Outcome). Then delete the runner and the tables (they never reach `main`), remove the
   base worktree (`fgos worktree remove --discard-ignored` or `git -C` after asserting it is a registered linked
   worktree) and delete its target `rvm-s2-base-target`.
2. **Retired-code row** "retired Node S2 verb code" (allowed: none): `\bcollectLockStatus\b`, `\bfenceLock\b`,
   `\bparseLockParams\b`, `\bconfirmFence\b`, `\bLOCK_FILES\b`, `\bcutOverLockFiles\b`. A name still used elsewhere stays
   out of the row (say which).
3. **Docs** (read each before editing; owners through `docs/platform/governance.md#decision-scope-to-holder-table`):
   - `docs/platform/holder-lock/spec.md`: §13 (lock-status judges through the crate, no internal route hop if 04
     removed one), §14 (the beacon contract, if it lands there), §15 (hot record read and cleared by `hot_record.rs`; the
     writer stays Node until S7), §17 (the fence runs in the host; confirmation as S23-Q3 answered), §20 one dated entry
     per decision (D5 hot record owner; status by registry template glob with run directories from the host, D6; fence
     in Rust and its confirmation; beacon contract).
   - `docs/platform/git/spec.md` §20: Git status/recover composition in `incidents.rs`, adapter for init and doctor
     until S4.
   - `docs/platform/host-invocation-routing/spec.md` §2 counts and §9 (the parity-against-base-release lane; ported
     verbs read only the shared parser; the pre-door list's three uses), `contracts/command-route-descriptor.md` recount.
   - `docs/reading-map.md` rows 189 (holder-lock: new modules, lock verbs native) and new source paths; row 192 if it
     names the deleted modules.
   - `AGENTS.md` "Legacy-Node CLI Ownership Boundary": only if its sentence on lock verbs from a checkout changes.
   - `core/skills/fgos-lock-fence/SKILL.md`: as S23-Q3 = b answered (05 edits it); regenerate render surfaces with
     `npm run build:skills` if it changes.
   - `docs/platform/runner/spec.md` or the Execution owner's doc: one line that the run-directory listers have a Rust
     twin in `apps/fgos/src/wiring/run_dirs.rs` until S6a (D6).
4. **Proof consolidation.** For each deleted or shrunk Node test, the report's owner table (from 02-06) checked once
   more against the code: every named owner test exists and asserts the behaviour.
5. **Gates on the integration head** (numbers in the report): plan.md exit criterion 8 in full; latency (criterion 9)
   for `lock-status` and `git status` against 00's medians; one-door scan with 0 undeclared.
6. **File-set check:** `git diff --name-only origin/main...HEAD` against plan.md's file set; add what is missing to
   plan.md under "Added during execution".
7. Hand-off: the `## [Unreleased]` lines (lock verbs and `git` native and faster; malformed calls recorded; the generic
   sub-command refusal text) go to the step lead in the report.

## Files

- Modify: the docs above, `docs/architecture-manifest.json` (retired-code row), `plan.md` (status, file set), census,
  `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks).
- Delete: `test/rust-host/verb-parity.test.mjs`, `test/rust-host/parity-cases/*.cases.mjs` of S2.

## Risk and rollback

- Drift between a spec claim and the code (M x L): drift and doc-health tests after every doc edit.
- Rollback: revert the phase; S2's code stands.
