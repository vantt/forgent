---
phase: 1
title: "Wire inputs into contextRefs"
status: pending
priority: P1
effort: "0.25d"
dependencies: []
---

# Phase 1: Wire `inputs` into `contextRefs`

## Overview

Make the `inputs` argument of `runRole` do what `panel.mjs` already assumes.

## Requirements

- Functional: for each input result, add the absolute path of its report artifact (fall back to
  its result claim artifact when no report) to the assignment `contextRefs`, after `unit.inputs`,
  in input order, deduplicated.
- Non-functional: no behavior change when `inputs` is empty; same refs on fallback attempt
  (`-fbN`) and on resume (history results carry the same artifact list); no new file format.

## Related Code Files

- Create: `src/runner/execution/role-input-refs.mjs` (one pure function
  `contextRefsFromRoleResults(results, root)`).
- Modify: `src/runner/execution/run.mjs` (the one `contextRefs:` line in `runRole`; resolve
  against `mainRoot` so a worktree-backed unit still finds the main checkout's `.fgos`).
- Tests: `test/runner/execution/role-input-refs.test.mjs` (new), `test/runner/execution/run.test.mjs`
  (extend), `test/runner/execution/patterns/panel.test.mjs` (assert synthesizer receives all
  member results incl. a 2-vs-1 split).
- Docs: `docs/specs/runner.md` Collaboration Pattern section (one settled fact: panel
  synthesizer receives member reports as context refs); `CHANGELOG.md` `[Unreleased]` line.
  Component-boundary: no change, record the note.

## Implementation Steps

1. Impact check on `runRole` (GitNexus index is stale: cross-check with `rg runRole`/`rg inputs`;
   only `panel.mjs` passes `inputs`).
2. Write the helper test first: results with `evidence.artifacts`, missing evidence, no report,
   duplicate, relative vs absolute input.
3. Implement helper; call it in `runRole`.
4. Extend `run.test.mjs`: panel unit with stubbed executor asserts synthesizer assignment
   `contextRefs` and that panelist/`reviewed` assignments are unchanged. Confirm the effective
   execution contract accepts absolute-path refs (it validates only string array).
5. Run `test/runner/execution/` narrowly, then full suite.
6. Acceptance rerun: same panel question via `fgos run --pattern panel` (persona overrides in
   `plans/reports/council-lens-experiment-261004/override.json`); read the synthesizer
   `brief-1.md` and output. Save as evidence under `reports/`.

## Success Criteria

- [ ] Synthesizer brief lists all panelist reports; others unchanged.
- [ ] Helper and run tests fail before the change, pass after.
- [ ] Suite green; docs and changelog updated.

## Risk Assessment

- A panelist with no report: it contributes no ref; the synthesizer silently sees fewer inputs.
  Signal: ref count below member count. Response: skip silently for now, record in report;
  if it recurs, make it a finding (separate change).
- Sandbox might not expose main `.fgos` to a worktree-confined worker. Signal: synthesizer says
  the path is unreadable. Response: stop and replan (grant read resource), do not copy files.
- Rollback: revert one line in `run.mjs` and delete the helper file.
