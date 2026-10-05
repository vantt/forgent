# Anonymized inputs (primitive B), 2026-10-05

Scope per the owner: one opt-in flag, one naming rule, no knobs. D (read confinement) not touched.

## Decisions

- **Carrier: a Unit field `anonymizeInputs: true`, and the same name on the Workflow unit template.** The flag is about how `inputs` are handed over, so it sits next to `inputs` in the Unit that `validateUnit` stores in `unit.json`; resume then honours it without a second store. It is not a `runUnit` option (that is where `persona`/`params` go, because G2 forbids execution mechanics on a Unit; this is not execution mechanics). Boolean only; false/absent is identical to today.
- **Naming rule: the nth `unit-run:` input in list order is `seat-A`, `seat-B`, ... (`seat-AA` after Z).** The caller controls the order. No shuffle: letter order cannot identify a seat to a receiver who does not know the source order, and a keyed shuffle would force the Workflow to predict names the Execution Core assigns. Left out as a rare-case knob.
- **Only `unit-run:` inputs are anonymized.** Repo paths and `gate-answer:` stay as they are (the owner's, not anonymous). No partial selection.
- **One resolver.** `resolveUnitInputs(inputs, mainRoot, { anonymizeInto })` in `src/runner/execution/handoff-refs.mjs` now returns `{ refs, inputMap }`. After the existing resolution and sha256 check it copies each report (`fs.copyFileSync`, source extension kept) to `<unitDir>/inputs/seat-X.<ext>`; `refs` lists the other refs first, then the copies. `unit.json` keeps `resolvedInputs` (the copy paths; resume and fallback reuse it, still the single list) plus `inputMap: [{name, input, source}]`, which is not written into any brief.
- **Failures before dispatch.** Unresolvable source, `report-changed-after-settle`, and the new `copy-failed: <cause>` are `HandoffRefError`. Resolution finishes before the `inputs` directory is created, and `run.mjs` removes the new unit directory on any resolver error, so nothing is left behind.
- **Brief text.** `buildUnitHandoff` (`src/workflow/runner.mjs`), when the template flag is on, writes `### seat-A` plus that role's `Summary:` line for each input, in the same order the inputs are listed, so the names match the copies. No step, unit, unit run or role appears. Gate-answer notes are unchanged.
- **YAML.** Added `anonymizeInputs: true` to `delphi.yaml` on `synthesize-feedback` and `propose-round-2` (Delphi is anonymous by definition; its step text already says "anonymized"). Other workflows untouched. The spec has an example for a cross-examination step.

## Changed files

`src/runner/execution/handoff-refs.mjs`, `unit.mjs`, `run.mjs`, `src/workflow/definition.mjs`, `src/workflow/runner.mjs`, `core/workflows/delphi.yaml`; docs: `docs/specs/runner.md` (new Vietnamese paragraph), `docs/routing-handoff-contract.md` (one sentence), `CHANGELOG.md`. No new `.mjs` file, so `docs/architecture-manifest.json` is unchanged.

## Tests (hermetic; 101 pass across handoff-refs, unit, run, workflow-runner, discussion-workflows)

- handoff-refs: neutral names in input order, copies byte-identical, only copies listed after other refs, no seat/run id in the paths, mapping content; default off copies nothing; edited report still refused and no directory left; unknown role refused; copy failure named; names past Z.
- run: contextRefs equal `['docs/a.md', <unitDir>/inputs/seat-A.md]`, `inputMap` in unit.json, assignment does not contain the earlier run id, resume reuses the list and copy after the source was edited; unresolvable input with the flag leaves no unit directory. The existing default-off test is unchanged and still passes.
- workflow-runner: panel step then an anonymized solo step: refs are `seat-A..D` only, objective has `### seat-A..D` and none of the step id, panel run id, `panelist`, `synthesizer`, `unit run`; `inputMap` has the originals. Definition keeps the flag only when true and rejects a non-boolean.
- unit: flag validation.

## Guarantee and its limit (also in the spec)

B hides identity by construction of what is handed over: the names, paths and brief lines a role is given carry no seat, role, unit, step or run. It does NOT stop a worker that goes looking: with `hostRead: allow` a worker can still read other files under `.fgos/assignments/`, including sibling outboxes and the real `source` reports. Only D (read confinement) closes that. Report text can also reveal its author by style.

## Left out, on purpose

- Shuffle or custom ordering, partial anonymization, per-role selection, any config knob.
- In-run hand-off of patterns: the `panel` synthesizer and the `reviewed` checker still get named reports (the synthesizer is told to state each panelist's position by name). For a blind synthesis use a separate Workflow step with the flag.
- Gate answers keep their own path.

## Concerns

- A role named `inputs` would collide with the new directory name in the unit directory; roles are fixed pattern names today, so no guard added.
- Round-2 Delphi panelists can no longer tell which proposal was their own; that matches Delphi but is a behaviour change for that workflow (not run live).
- The brief's stored `unit.json` `inputMap.source` holds real paths; it is owner-facing only, but it is in a directory a worker can read until D lands.

Status: DONE_WITH_CONCERNS
