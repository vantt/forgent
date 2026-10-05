# Empty per-dispatch directories

## Cause

Product bug, not test fixtures. `finalizeConfinementResources`
(`src/runner/dispatch/confinement/authority.mjs`) removed the private home
`<tempRoot>/<dispatchId>/home` with `fs.rmSync` but never removed the
`<tempRoot>/<dispatchId>` parent. `cleanupConfinementResource` already did,
so only the finalization path (every normal `executeAssignment` run) leaked.
Confirmed with an fs trace: mkdir parent, mkdir home, rmSync home, no rmdir.

## Where the shells came from (each file run alone, private TMPDIR)

| test file | empty `disp_*` before | after |
|---|---|---|
| test/workflow/discussion-workflows.test.mjs | 41 | 0 |
| test/runner/execution/run.test.mjs | 40 | 0 |
| test/workflow/workflow-runner.test.mjs | 27 | 0 |
| test/workflow/architecture-advisory-workflow.test.mjs | 18 | 0 |
| test/workflow/business-discussion-workflow.test.mjs | 9 | 0 |
| test/runner/execution/run-posture.test.mjs | 4 | 0 |
| test/runner/execution/run-herdr.test.mjs | 2 (1 empty) | 1 (not empty) |
| test/cli/run-verb.test.mjs | 1 | 0 |
| test/runner/herdr-reconciliation.test.mjs | 1 (not empty) | 1 (not empty) |

All 43 test files that mention confinement or dispatchId were scanned; the rest
leave nothing. Total empty before: 142; after: 0.

## Fix

- `cleanup.mjs`: new `removeEmptyDispatchParent(removedPath, dispatchId)` (rmdir
  of the parent when it is named after the dispatch; refuses a non-empty one);
  `cleanupConfinementResource` uses it.
- `authority.mjs`: finalization reads the marker's dispatchId before deleting
  the home and calls the same helper afterwards.
- Regression test `16b` in `test/runner/cli-spawn-reconciliation.test.mjs`:
  fails before the fix, passes after; also checks a parent holding a sibling stays.
- CHANGELOG `[Unreleased] > Fixed`, one line.

## Remaining, not empty shells

`run-herdr` and `herdr-reconciliation` each leave one `disp_*` holding a home
with its ownership marker (a run whose home is never finalized in those
fixtures). Not empty, so the marker-based reaper handles it; left alone as out
of scope. Some fixtures also leave `fgos-herdr-recon-*` temp dirs; not touched.
