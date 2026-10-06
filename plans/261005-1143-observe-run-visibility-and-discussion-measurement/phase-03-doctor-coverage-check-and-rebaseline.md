---
phase: 3
title: "Doctor coverage check and rebaseline"
status: completed
priority: P1
effort: "0.75d"
dependencies: [1, 2]
---

# Phase 3: Doctor coverage check and rebaseline

## Overview

Add `observe-run-coverage` to `fgos doctor` so a future layout change cannot hide again, and rebaseline the numbers the blind spot distorted.

Execution evidence: [historical rebaseline](../reports/observe-rebaseline-261005.md) and [acceptance repairs](../reports/observe-acceptance-fixes-261006.md).
The initial foundation suite passed 6,730 tests after the watchdog correction; that dated result is not the repair's final gate. The feature was subsequently committed as `0b06824a7`, and doctor/admission repairs as `c439264cd`. Actual rebuilt/old-host doctor checks were exercised; unrelated baseline check failures remain, so overall doctor is not represented as entirely green.


## Requirements

- Functional: compare host candidate directories with the independent Node inventory and host observed results with independently eligible unique Node results. A shortfall names counts and explicitly sample candidates, not invented confirmed omissions.
- Functional: an **old host is recognised positively**: `metrics coverage` is an unknown subcommand (the case `src/util/host-bin.mjs:94-104` already reports) or the output has no `layoutRule`. That yields passed-but-degraded with a message that the host predates the layout rule. A host answering normally with the old numbers is therefore never read as healthy.
- Non-functional: one Node directory walk; the separate admission projection reads bounded result/owner metadata over that inventory. The host does not run the transcripts source.
- Non-functional: the check runs against the same root the helper passes (the main checkout root, `host-bin.mjs:81-82`); a worktree run says so instead of comparing different stores.

## Architecture

`registerCheck({ id: 'observe-run-coverage', description, check })` remains in the existing observe registry. Compare candidate directories and eligible unique results separately. Tolerance is the larger of recent candidate-directory count (including future-clock mtimes and absent results) and unchanged host recent-result count; it is not restricted to result.json existence.

## Related Code Files

- Modify: `src/setup/registrations.mjs`, `docs/specs/distribution.md` (doctor row: only the check id in backticks, per the dictionary test), `docs/specs/observe.md` §5 doctor list, `test/setup/checks.test.mjs` (id list near :129), `test/setup/observe-doctor-checks.test.mjs`, `docs/architecture-manifest.json` if a new `.mjs` is added, `CHANGELOG.md`.
- Create: `plans/reports/observe-rebaseline-261005.md`.

## Implementation Steps

1. Implement the check with injectable host and lister.
2. Tests: equal passes; fewer seen fails with example paths; old host (unknown subcommand, no `layoutRule`) degrades; empty store passes; run changed within tolerance does not fail.
3. Registry housekeeping the repo enforces (id-only backticks, manifest row, command registry already done in phase 2).
4. Rebaseline report: `metrics runs`, `harness`, `entropy` before and after phase 2; stored snapshots stay as written and are labelled pre-fix in the report.
5. Confirm plan `260930-0335-measure-runresult-classification-impact` carries `blockedBy` this plan and a note that "after" data counts only from the rebaseline.
6. Run `fgos doctor` here and on mdview with the rebuilt host.

## Success Criteria

- [x] Passes with the fixed host, degraded with the old staged host, fails against a fixture hiding a run.
- [x] Rebaseline report committed; dependent classification plan retains its historical before/after boundary.
- [x] Initial foundation `npm test` gate passed; the repair's single final gate is recorded separately in the acceptance ledger.

Evidence: [rebaseline](../reports/observe-rebaseline-261005.md) and [acceptance repairs](../reports/observe-acceptance-fixes-261006.md); current eligible/observed parity, recent-directory regressions and old-host upgrade messaging are exercised.

## Risk Assessment

- False failure on a fresh install (no runs, no host): covered by tests.
- Doctor dictionary test is strict about row content: follow the id-only rule.
- Signal it broke: doctor red on a healthy store; response: fix the shared definition of a run, never widen tolerance.
