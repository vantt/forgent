# Workflow step inputs and Delphi round 2 (2026-10-05)

Branch `worktree-agent-a59d46b6789703250`, started from the lead's main (a087b56eb, fast-forwarded).

## Design

Sources: `handoff-unification-slice-1`, `anonymized-inputs-b`, `read-confinement-slice-2` reports; `buildUnitHandoff` in `src/workflow/runner.mjs`; `handoff-refs.mjs`.

- **Declaration.** A unit `template` may carry `inputs: [{ step, sameSeat?, label? }]`. No `inputs` means exactly today's transitive hand-off (no other workflow changes). `{ step }` is every role of every unit of that step (as before, `seat-A...` when `anonymizeInputs`). `sameSeat: true` is the receiving role's own seat's result of that step. `label` is author text shown beside the entry in the brief. Key is `sameSeat` (camelCase like `anonymizeInputs`, `dependsOn`); `same-seat` is rejected as an unknown key. Gate answers stay on the default path.
- **Validation** (`definition.mjs`): array of objects, known keys only, `step` required, booleans typed, and `step` must be declared and a transitive dependency of the owning step; errors name step, unit and index, before any run.
- **Placeholder, one place.** The Workflow runner puts `unit-run:<unitRunId>/{seat}` in the Unit's `inputs` (already valid under the Unit input grammar, so `unit.mjs` is untouched). `handoff-refs.mjs` owns it: `isSeatInput`, `SEAT_PLACEHOLDER`, `OWN_PREVIOUS_NAME`. `resolveUnitInputs` skips seat inputs at unit creation (so `resolvedInputs`/`inputMap` never contain them); with `{ seat: <role> }` it resolves only those, through the same `resolveUnitRunRef` (latest round, sha256 re-check), to entries named `own-previous.md`. A missing seat is the named failure `no-such-seat` (other reasons unchanged).
- **Moment.** `dispatchBound` (`run.mjs`) resolves the role's own entries and `copyHandoffsInto` its own assignment directory, blind or not (so the brief can name the file the same way in both modes). Resume keeps an identical copy; a changed source is refused by the existing sha check.
- **Identity/brief.** Entry text: `### seat-A (group summary)` and `### your own previous proposal` + "It is the file named "own-previous" under Context refs: what you yourself produced in an earlier step." No other seat, step, unit, run or role is named (tested).
- **Delphi.** `propose-round-2` now has `inputs: [{feedback-synthesis, label: group summary}, {blind-proposals, sameSeat, label: your own previous proposal}]`.

## Change
`src/runner/execution/handoff-refs.mjs`, `run.mjs`, `src/workflow/definition.mjs`, `runner.mjs`, `core/workflows/delphi.yaml`, `docs/specs/runner.md` (Vietnamese paragraph), `CHANGELOG.md`. No new files, so no manifest row. Setup, dispatch, confinement, bin untouched; `distribution.md` untouched.

## Tests (all green, run with `env -u CLAUDE_CODE_SESSION_ID`)
New: handoff-refs (seat skipped at unit level, per-role resolution + copy, failures `no-such-seat`/`no-such-run`/`report-changed-after-settle`); run (each panel role, blind and non-blind, gets only its own seat as `own-previous.md`, `resolvedInputs` empty; unknown seat refused); workflow-runner (panel -> solo -> panel with `inputs`: exact contextRefs per panelist, brief wording and no leaks, undeclared step still transitive; loader validation); discussion-workflows (delphi round 2 declaration, final-consensus has none).
Run: workflow-runner, discussion-workflows, architecture-advisory, business-discussion, handoff-refs, unit, run, architecture, bind-committed-config, operation-prompt-templates, checks-doctor-config, blind-steps-proven-pools-check. No live paid runs.

## Decisions
- Not a design fork: the declaration is opt-in (owner decision), one placeholder, one resolver.
- Other workflows unchanged. `nominal-group` `evaluate-votes` (votes only need the consolidated list) is the one plausible candidate, but it also has a human gate and no anonymity need, and whether voters should see raw ideas is a product call, so not "clearly right". The others (`architecture-advisory`, `business-discussion`, `group-cognition`) need earlier results across steps; none has a same-seat step.

## Open questions
- Every panel runs a `synthesizer` role, so in round 2 the synthesizer role also receives the round 1 synthesizer's result as `own-previous`, labelled "your own previous proposal" (slightly off for that role; harmless). Say if the label should become role-neutral.
- A seat that does not exist fails when that role is dispatched, after sibling panelists have started (not at unit creation); with identical panel size in both rounds this does not occur in `delphi`.
