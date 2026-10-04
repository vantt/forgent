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

- Functional: for each input result, find its report in `runResult.evidence.artifacts` BY FILE
  NAME (`report-N.md`, else `agent-report.md`; fall back to `result-N.json` / `agent-result.json`).
  A report the system judged not substantive is absent from that list, so the fallback is real.
  Add the absolute path to the assignment `contextRefs`, after `unit.inputs`,
  in input order, deduplicated.
- Non-functional: no behavior change when `inputs` is empty; same refs on fallback attempt
  (`-fbN`) and on resume (history results carry the same artifact list); no new file format.

## Related Code Files

- Create: `src/runner/execution/role-input-refs.mjs` (one pure function
  `contextRefsFromRoleResults(results, root)`).
- Modify: `src/runner/execution/run.mjs`: pass `inputs` from `runRole` (:355) into `dispatchBound`
  (signature :299, call :440) and use it at the `contextRefs:` line (:319); resolve against
  `mainRoot` so a worktree-backed unit finds the main checkout's `.fgos`.
- Tests: `test/runner/execution/role-input-refs.test.mjs` (new), `test/runner/execution/run.test.mjs`
  (extend the existing test near :603; read `.fgos/assignments/<id>/synthesizer/1/assignment.json`
  `contextRefs`; the stub worker already writes `agent-report.md`, no live executor needed).
  `panel.test.mjs` already asserts the synthesizer receives 3 inputs in order (:57-59): no change.
- Docs: `docs/specs/runner.md` Collaboration Pattern section (one settled fact: panel
  synthesizer receives member reports as context refs); `CHANGELOG.md` `[Unreleased]` line.
  Component-boundary: no change, record the note.

## Implementation Steps

0. Verify first, empirically: `src/workflow/runner.mjs:29-31` states `.fgos` is closed to workers
   (that is why Workflow steps inline prior reports into the objective). The code review found no
   enforcement of that (bwrap `--ro-bind / /`), but a worker-side hook or policy could still block
   it. Have one real herdr worker read an absolute `.fgos/assignments/.../report-1.md` path. If
   it cannot, stop and replan (inline the report text like the Workflow runner does, or grant a
   read resource); do not proceed on the code review alone.
1. Impact check on `runRole` (GitNexus index is stale: cross-check with `rg runRole`/`rg inputs`;
   only `panel.mjs` passes `inputs`).
2. Write the helper test first: results with `evidence.artifacts`, missing evidence, no report,
   duplicate, relative vs absolute input.
3. Implement helper; call it in `runRole`.
4. Extend `run.test.mjs`: panel unit with stubbed executor asserts synthesizer assignment
   `contextRefs` and that panelist/`reviewed` assignments are unchanged. The inline-contract validator is
   not on the unit-run path and the effective contract builder ignores `contextRefs`: nothing
   to confirm there. Keep the test checkout under `/var/tmp` (bwrap hides `/tmp`).
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
- A main checkout under `/tmp` would hide the paths in a confined worker (`--tmpfs /tmp`).
- Rollback: revert the three `run.mjs` edits and delete the helper file.
