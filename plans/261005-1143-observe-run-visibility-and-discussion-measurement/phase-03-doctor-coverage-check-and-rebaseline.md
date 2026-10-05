---
phase: 3
title: "Doctor coverage check and rebaseline"
status: pending
priority: P1
effort: "0.75d"
dependencies: [1, 2]
---

# Phase 3: Doctor coverage check and rebaseline

## Overview

Add `observe-run-coverage` to `fgos doctor` so a future layout change cannot hide again, and rebaseline the numbers the blind spot distorted.

## Requirements

- Functional: the check calls `metrics coverage` through the host helper and compares its `runDirsSeen` with the independent count from the phase 1 Node lister. Equal (allowing for `recentRuns`) passes; fewer seen fails with the shortfall and example paths the Node side can name.
- Functional: an **old host is recognised positively**: `metrics coverage` is an unknown subcommand (the case `src/util/host-bin.mjs:94-104` already reports) or the output has no `layoutRule`. That yields passed-but-degraded with a message that the host predates the layout rule. A host answering normally with the old numbers is therefore never read as healthy.
- Non-functional: the Node side reads directory names only (no JSON parsing of hundreds of files); the host call does not run the transcripts source.
- Non-functional: the check runs against the same root the helper passes (the main checkout root, `host-bin.mjs:81-82`); a worktree run says so instead of comparing different stores.

## Architecture

`registerCheck({ id: 'observe-run-coverage', description, check })` beside the existing observe checks (`src/setup/registrations.mjs:5766-5780`). The check takes an injectable host runner and lister so tests need no host. Comparison tolerance: runs whose `result.json` changed in the last 60 s on either side are excluded; a shortfall larger than that fails.

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

- [ ] Passes with the fixed host, degraded with the old staged host, fails against a fixture hiding a run.
- [ ] Rebaseline report committed; the 260930 plan consistent with it.
- [ ] `npm test` green.

## Risk Assessment

- False failure on a fresh install (no runs, no host): covered by tests.
- Doctor dictionary test is strict about row content: follow the id-only rule.
- Signal it broke: doctor red on a healthy store; response: fix the shared definition of a run, never widen tolerance.
