# Gate answers and persona/params in Workflow runs

Date: 2026-10-05. Branch `worktree-agent-af359e158be7c1abd`.

## Feature B: Workflow `persona` and `params` take effect

Verified against the code first. The council finding holds, and is wider than stated:

- `persona` was parsed by `definition.mjs` and then dropped; `runner.mjs` never put it in `unitData` or anywhere `bind()` reads.
- `params` was not parsed at all (not even dropped later): the template normalizer ignored it, and `pattern` reached `runUnit` only as a string, so `resolvePattern`'s object form (`{ pattern, params }`) was unreachable from a Workflow.
- `unit.mjs` forbids `overrides` on a Unit (G2), so the pass-through had to be through `runUnit` options, which is exactly where the CLI `--override` / `--pattern` land.

Change:

- `definition.mjs`: keeps `params` (must be a plain object, else `WorkflowDefinitionError`), trims `persona`.
- `workflow/runner.mjs`: passes `pattern: { pattern, params }` when the template has params (else the name) and `overrides: [{ scope: { unit: <id> }, persona, origin: 'workflow' }]` when it has a persona. No second mechanism: the same two options `fgos run` already passes.
- `run.mjs`: the object form of `options.pattern` wins over the unit's pattern string (it carries params; a string cannot).
- `reviewed.mjs`: the producer's `roleUnit` now also receives `params`, so `roleTasks.producer` works like the other roles.

Meaning of `persona` (smallest that fits the override model): the persona bound on every seat of the unit, source `override:workflow`. It does not choose an executor, so the candidate pool is unchanged. Documented in `docs/specs/runner.md`.

Concern, not a blocker: a unit has one `persona` but a `panel` unit has several seats, so the panel's own synthesizer seat also carries `panelist` in delphi/nominal-group YAML. The persona text is advisory (tone and emphasis), so the harm is small. Recommendation if it matters: extend by `scope.role` (a per-role persona map in the template), not a new mechanism. I did not invent that shape.

## Feature A: gate answers reach later units

Design as specified, one deviation noted below.

- Writing: `recordGateAnswer` (shared by the foreground and detached answer paths) writes `.fgos/workflow-runs/<id>/gate-answers/<stepId>.md` before appending the event: question, answer, run, step, time, and a statement that it is the owner's input, not agent output. Atomic (tmp + rename). A step id that cannot name a file (`/`, `..`, whitespace) is refused and no event is recorded. A second answer replaces the file.
- Grammar: `gate-answer:<workflowRunId>/<stepId>`, validated in `unit.mjs` next to `unit-run:`, resolved in `handoff-refs.mjs` (`resolveUnitInputs`, plus exported `gateAnswerFile` for the one path layout) into an absolute path; resolved into `resolvedInputs` at Unit-run creation, so resume and fallback reuse it. Missing file or unsafe id: `HandoffRefError` reason `no-such-answer`, before the unit directory exists.
- Scheduling: `buildUnitHandoff` adds a ref for every recorded answer of the unit's own step and its transitive dependency steps, plus one objective line each: `- <stepId> (owner's answer at the "<stepId>" gate): <first 200 chars, whitespace collapsed>`, under a heading that says it is the owner's input, not another agent's output.
- Deviation: the own step is included, not only dependency steps. In `nominal-group.yaml` the gated step `voting-ranking` has its own unit (`evaluate-votes`) that tallies the votes and needs the answer as much as `final-ranking` does.
- Not covered: a run answered before this change and resumed has no answer file, so its later units are refused with `no-such-answer` (no backward compat, per project policy).

Docs: `docs/specs/runner.md` hand-off paragraph (replaced the "not done yet" sentence, added the persona/params paragraph), `docs/routing-handoff-contract.md` (one entry in the trust-boundary context-ref bullet), `CHANGELOG.md` (two entries). No new `.mjs` files, so `docs/architecture-manifest.json` is unchanged. Component boundary: no change (same hand-off, one more ref kind).

## Tests (hermetic, fake executors)

- `test/workflow/workflow-runner.test.mjs`: definition keeps persona/params and rejects non-object params; persona and params reach binding, `members`, and the synthesizer's `roleTasks` objective, and a unit without persona gets none; a gate answer reaches the gated step, a later step and a transitive step (file content, ref, objective line, 200-char cut), not the earlier or parallel steps; an unsafe step id is refused with no event recorded.
- `test/runner/execution/handoff-refs.test.mjs`: gate-answer resolves to an absolute path, dedupes, and names `no-such-answer` for missing or traversal ids.
- `test/runner/execution/unit.test.mjs`: grammar accepted and malformed refs rejected.
- Narrow run: workflow-runner, handoff-refs, unit, run tests plus pattern tests: all pass (78 and 38).

Full suite: see the final result in the message that accompanies this report.

## Unresolved

- Persona granularity per seat (above).
- Existing parked-and-answered runs from before this change cannot continue past the gate's dependents without re-answering.

Status: DONE_WITH_CONCERNS
