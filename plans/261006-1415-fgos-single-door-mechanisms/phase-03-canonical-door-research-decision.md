---
title: "Canonical door read-only research"
status: done
dependencies: [0]
requiresReview: true
---

# Phase 03 — Canonical door: completed read-only evidence for D1=B

> Historical revision note: Revision ready — read-only research completed; implementation not started or authorized in that planning assignment.

**Current execution evidence:** Phase03 read-only research is complete and retained unchanged. Its source/layout observations and “future Phase04” wording below describe that research snapshot, not the implementation now delivered in [Phase04 tests](reports/phase-04-tests.md) and [actual native/dev/shim proof](reports/phase-04-live.md). See [full-plan sync](reports/final-plan-sync.md) for the current whole-plan gate; research itself did not run builds or runtime acceptance.

Dependencies: Phase 00. This evidence branch can run independently of 01→02; its handoff is required by Phase 04.

## Context links

- [plan.md](plan.md); [completed research report](reports/phase-03-canonical-door-research.md); [Phase 04](phase-04-doctor-active-release-drift-check.md).
- Synthesis V1/H1c and cases M23, M30, M42 describe stale activated runtime observations, not successful acceptance of a development command.
- D1 is owner-approved **B**: name existing Rust development host as npm `fgos:dev`; A (restage) is used when plain `fgos` must change. C (dev activation) belongs to `plans/261006-1445-fgctl-dev-activation/`; do not repeat that research or reopen D1 here.

## Requirements

1. Preserve completed read-only answers needed by Phase 04: argument forwarding, runtime cwd versus payload source, manifest/binary paths, actual target-sharing observations, and confinement constraints.
2. No build, host invocation, stage, upgrade, setup, activation mutation, doctor fix, or timing experiment in this phase. The former D1-pre gate is removed, not deferred.
3. Source evidence is not runtime acceptance: no all-verbs success, performance, custom-target success, or fresh-shim success has been measured.
4. Findings describe current code, not changes already made. In particular INIT_CWD and end-to-end CARGO_TARGET_DIR handling are **planned Phase 04 corrections**.

## Files

- Existing evidence only: `reports/phase-03-canonical-door-research.md`.
- No source/config/doctrine modifications. No new research plan C or activation stage.

## Evidence and executable handoff

1. **Arguments proven by reading.** `scripts/run-rust-dev-host.mjs:91-101` forwards `process.argv.slice(2)` directly. Phase 04 can expose `npm run fgos:dev -- <verb> [args]`; no new argument parser. Existing spawn-error/status/signal propagation is retained.
2. **Source and workspace are separate.** Script derives checkout root from its URL and runs Cargo there (`:8-17`). Runtime child currently uses `cwd: process.cwd()` (`:93-95`), **not INIT_CWD**. npm moves cwd to package root, so Phase 04 must use `process.env.INIT_CWD ?? process.cwd()` for runtime child while leaving build source at script checkout. No npm smoke run was performed here.
3. **Artifacts currently hardcoded.** Manifest, binary hashing, binary execution, native file entries and `entries.fgos` use checkout `target/dev-manifest.json` and `target/debug/fgos` (`:28-40,69-99`). Cargo inherits `CARGO_TARGET_DIR` but the rest of wrapper does not honor it. Custom-target behavior may fail or select stale default binary [INFERENCE]; no such run occurred.
4. **Manifest confinement is a required design constraint.** Rust verifier rejects symlink path segments and paths outside canonical release root (`packages/distribution/rust/src/verify.rs:133-163`). An external target directory cannot simply be recorded as an escaping manifest file. Phase 04 must choose a confined artifact layout for custom targets without weakening verification or creating a new distribution capability; test real consumer behavior before claiming support.
5. **Actual filesystem finding corrects blanket sharing claim.** Read-only stat found no `target` entry in this isolated worktree, main has a real directory, and research process exported neither CARGO_TARGET_DIR nor INIT_CWD. Historical lead observation of shared symlink targets remains historical evidence, not this worktree's current state. Other worktrees/Cargo configuration were not inventoried. Where artifacts really are shared, require one development invocation at a time; symlink verification is a separate constraint, not just concurrency.
6. **Activation remains unchanged.** Wrapper invokes its debug Rust host directly with FGOS_ACTIVE_RELEASE_PATH/FGOS_ACTIVE_MANIFEST_PATH; plain shell `fgos` still prefers activated shim/release. The documented A route builds/stages/upgrades and verifies through shim, but no command in that route was run here and no latency was measured.
7. **Phase 04 consumes this evidence:** add npm name, correct child cwd, honor Cargo target consistently with verifier, implement Node-payload-only drift check against doctor's `dir`, catch unsafe-file errors, update registry/docs/how-to/changelog, cover all seven builder consumers. After authorized implementation, restage and run doctor through shim. All are future work, not completed research acceptance.

## Tests / validation

- Completed evidence gate: report contains source references, read-only stat/environment observations and D1=B handoff. No builds/tests/lint/formatters or runtime acceptance runs.
- Future Phase 04 must exercise subdirectory workspace resolution, custom-target selection, symlink refusal, drift check and post-restage shim behavior; this phase cannot mark them green.

## Risks and unresolved facts

- External/custom Cargo target layout versus manifest containment remains an implementation design prerequisite. Keep it explicit until concrete compatible layout and behavior evidence exist; do not silently drop custom-target support or relax verifier.
- Cold/incremental build time, development latency, staging/upgrade duration and doctor runtime remain unmeasured.
- Argument forwarding does not prove every verb works. Historical binding/confinement evidence remains read-only provenance, not live sandbox acceptance. Early advisory runtime feasibility and installed-entry product/confinement proof belong to [advisory capability completion](../261006-1408-advisory-capability-completion/plan.md); neither was measured here, and neither is a prerequisite for this plan.

## Rollback

No source/runtime changes to roll back. Retain research provenance even if a later implementation decision changes artifact layout.
