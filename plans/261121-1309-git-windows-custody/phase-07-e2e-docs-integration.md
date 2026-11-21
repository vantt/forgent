# Phase 7: Windows unit-run commit end to end, docs, integration

## Inputs
- plan.md; phases 4-6 landed. apps/fgos/src/wiring/unit_run_host/tests/run_unit.rs; packages/execution/engine/src/unit_run/git_port.rs
  (`UnitGit::held`).
- docs/platform/holder-lock/spec.md 8.1, docs/platform/git/spec.md (sections 5, 12, 18 Q6 and its decision history),
  docs/platform/run-supervisor/spec.md (cwd lease).

## Files it may write
apps/fgos/src/wiring/unit_run_host/tests/run_unit.rs, .github/workflows/release-assets-check.yml, docs/platform/holder-lock/spec.md,
docs/platform/git/spec.md, docs/platform/run-supervisor/spec.md, CHANGELOG.md

## Steps
1. A Windows unit-run-host case: a writing Unit under a held custody commits its declared paths into the worktree
   branch through `UnitGit::held`, with a sync and a verify; add `cargo test --release -p fgos --bin fgos wiring::unit_run_host`
   to `windows git custody`.
2. Specs: holder-lock 8.1 (borrowed handle and borrow I/O on Windows), Git spec (custody on Windows, Q6 reversed by
   the owner 2026-11-21 in the decision history, C5 Windows), run-supervisor spec (lease served for the custody's
   life). The lead reports backlog rows p-nk6xf5laob and p-w4cxqq2sbw done to the supervisor (docs/backlog.md is not in this footprint). CHANGELOG Unreleased line.
3. Integration: on the combined tree run the Linux gates and one full `release-assets-check` run on main's tip.

## Verify
- Linux: `cargo test -p fgos --test unit_run_host`, clippy -D warnings, fmt, msvc check.
- Windows: `windows git custody`, `windows cwd lease owner` and `focused tests (windows-latest)` all green on one run.

## Rollback
Revert the phase's land commit.
