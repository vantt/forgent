# Phase 3: Attention reader on the inspect use case

## Inputs (read first)
- `src/runner/dispatch/runtime-inspection.mjs`: `allRuns`, `result()`, `owner()`, `validateInspectionSelector`,
  `inspectDispatchRuntime` (the `cwd` branch builds `found` from `workspace()` keys; the attention view skips that filter).
- `src/verbs/dispatch/inspect.mjs` (`inspectDispatchUseCase`: `providerCapacity` and `terminal` branches are the model for a new branch;
  `withAttemptView` / `readAttemptView` from `src/verbs/dispatch/show-run.mjs` give `attemptState`, `unitState`, `resumeCommand`).
- `src/terminal-control/client.mjs:252` `scanTerminalAllocations` (panes that need a person).
- `docs/platform/run-supervisor/spec.md` sections "Watch", "Idle in a pane", "Early ends" (what blocked, needs-human, idle mean).
- `test/runner/dispatch-runtime-inspect.test.mjs` (fixture helpers to extend).

## Files this phase may write
`src/runner/dispatch/runtime-inspection.mjs`, `src/verbs/dispatch/inspect.mjs`, `test/runner/dispatch-runtime-inspect.test.mjs`.
Also regenerates the census file in its commit (hot file).

## Selector contract (phase 4 wires it)
`inspectDispatchUseCase(ctx, { attention: true, since: '<RFC3339 or YYYY-MM-DD>' })`. `since` is required with `attention`, and
`attention` counts as one selector (`validateInspectionSelector`: exactly one of run, assignment, cwd, attention; `terminal`
and `providerCapacity` keep their own branches). Result:
`{ contract:{id:'attention-view',version:1}, since, observedAt, rows:[{ runId, assignmentId, worktree, kind, reason, nextCommand, line }], terminal:{...scanTerminalAllocations result}, lines:[string] }`.
`kind` is one of `failed|blocked|refused|needs-human|past-deadline|idle`; `line` is `<kind> <runId> <worktree> <reason> -> <nextCommand>`.

## Steps
1. **Scout, record in `reports/phase-03-scout.md`:** (a) which root holds the runs of every worktree: show that a run launched
   from a linked worktree is listed by `allRuns(<root>)` for `<root>` = the main checkout, and that the verb is handed
   that root when called from a worktree (`repoRootForDispatch` in `bin/fgos.mjs`); if it is handed the worktree root, resolve the project's
   store root with the existing common-dir logic (`workspace().commonDir`), do not add a new resolver. (b) where a live run's
   deadline and idle are readable from Node: `effective-execution-contract.json` `limits.timeoutMs`, `run.json` start time, the
   supervisor envelope `deadlines`, `visibility.json`; use what `readAttemptView` already reads first. State which reads the
   view will use. (c) which settled outcomes map to failed, blocked, refused, needs-human (the run-result classification and the
   receipt `reason` `terminal:blocked:*` / `terminal:needs-setup`).
2. Add a pure function `attentionView(root, { since }, { now })` next to `inspectDispatchRuntime` that reuses `allRuns` and
   `result()`; no cwd filter. Row rules, in order, for each run started or settled at or after `since` (UTC ms compare, never lexicographic):
   settled with outcome failure/execution-failure -> `failed`; provider or login stop, trust dialog -> `blocked`; policy refusal ->
   `refused`; early end needs-human -> `needs-human`; no result and live and now past the declared timeout -> `past-deadline`
   (reason text names the declared timeout and elapsed); no result and live and idle record older than the idle limit -> `idle`
   (only when step 1 found a readable idle record). Settled pass, and a failed first attempt followed by a passing fallback in the same
   unit, are not rows (the audit: a retry that passed is a measure, not an alert).
3. `nextCommand`: `fgos run --resume <unitRunId>` when `unitState` says it waits for one (reuse `resumeCommand`), `fgos dispatch watch <runId>`
   for a live run, else `fgos dispatch inspect --run <runId>`; for a terminal finding, the command the terminal-control spec names for it
   (`fgos dispatch recover`, as `docs/platform/terminal-control/spec.md` row `terminal-allocations` says).
4. In `inspect.mjs` add the `attention` branch (like `terminal`): call `attentionView` and `scanTerminalAllocations` once, merge into the result.
   Reads only; the runs cache wrapper stays. Errors keep `DispatchInspectError`.
5. Tests (extend the file; one owner for each behaviour): one case per row kind from a built fixture of several assignments with
   different `cwd` (two worktrees); a settled pass and a retried-then-passed unit give no row; `since` excludes older runs (including a bound given as date only);
   `--attention` without `since` throws; no file under `.fgos` changed after the call (compare a recursive listing with mtimes before and after).
   Terminal scan is injected through `options.terminalControl`, as the existing terminal case does.
6. Regenerate the census.

## Verify
- `node --test test/runner/dispatch-runtime-inspect.test.mjs` passes.
- `node --test test/setup/git-mutation-census.test.mjs test/architecture.test.mjs` passes (the file stays below the Git ports and imports nothing new above its layer).

## Rollback
`git revert` the phase commit; the view is read-only and stores nothing.
