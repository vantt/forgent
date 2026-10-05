# workflow start: detach from the caller

## What existed
- `fgos workflow start` (bin/fgos.mjs, `case 'workflow'`) awaited `startWorkflow`, which created the run and then ran `advanceWorkflowRun` in-process until completed/failed/parked. The caller blocked for the whole run.
- Sibling verbs: `status` (pure read of `.fgos/workflow-runs/<id>/events.jsonl`), `answer`, `resume` (both advance in-process too).
- `docs/specs/runner.md` was silent on start's blocking behaviour. `git log -S'detached'` on src/workflow and bin/fgos.mjs found no earlier detach mechanism for workflows.
- Prior art for the pattern: `startGateway` (src/runner/gateway-control.mjs) spawns `detached: true`, stdio to a log file, `unref()`.

## Decision
Spec silent, so the settled fact is written into the spec. `start` records the run, spawns `fgos workflow resume <id>` detached (log `advance.log` next to the event log), and returns the run id plus `detached: { pid, logPath, statusCommand }`. Reusing `resume` means no new internal verb and the detached process uses the same event log that `status` reads. `--foreground` keeps the old behaviour; existing CLI tests need it because they read a finished run right after `start`.
This is one user-visible default change with a flag escape hatch, requested by the task, not a fork.

## Change
- src/workflow/runner.mjs: `prepareWorkflowRun` (resolve definition, create run), `startWorkflow` (unchanged behaviour), new `startWorkflowDetached`. Exported via src/workflow/index.mjs.
- bin/fgos.mjs: `workflow start` picks detached by default, `--foreground` for in-process (also tolerates `--foreground <id>` where the arg parser swallows the id).
- src/cli/command-registry.mjs (outside the listed files, help text only): `foreground` parameter and an example, so `--help` shows the flag.
- docs/specs/runner.md: settled fact paragraph. CHANGELOG.md: one [Unreleased] entry.
- Tests: existing CLI start calls (workflow-runner, discussion-workflows, architecture-advisory) now pass `--foreground`; new test in workflow-runner.test.mjs proves start returns the run id and a log exists, and the detached process drives the run to `completed` as read through `statusWorkflow`.

## Tests run
`env -u CLAUDE_CODE_SESSION_ID node --test` on test/workflow/{workflow-runner,discussion-workflows,architecture-advisory-workflow}.test.mjs (25 pass), test/cli/{command-registry,fgos-help,fgos-manifest}.test.mjs and test/rust-host/command-routes.test.mjs (38 pass). Full suite not run.

## Follow-ups not done (out of scope)
- `workflow answer` and `workflow resume` still block; the same detach could apply but their tests and the answer-then-continue flow need their own decision.
- core/skills/fgos-group-thinking and fgos-architecture-panel call `fgos workflow start` and read the result as final state; they should poll `workflow status` or pass `--foreground`. Skills are outside the allowed file list.
