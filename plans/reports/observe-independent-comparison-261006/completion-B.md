# Synthesis: Should fgOS add a mechanical dissent/agreement gate to the panel pattern?

## Panelist positions

**panelist-1 — No (measure first, compose later).** Agreement is already a passive measurement, not a gate (docs/specs/runner.md:1435, observe.md:61), with pre-registered revisit conditions K2/K3. Cross-examination already exists as Workflow composition via `anonymizeInputs` and `blind` (runner.md:1437-1439), and a `cross-examine` step example plus `delphi.yaml` ship already. A dissent quota risks manufactured, indistinguishable-from-real objections; `reviewed.mjs:24-29,52-54` red-team covers adversarial checks. Next step: run `fgos metrics discussions --by workflow` after ~30 panel runs; if K2/K3 trip, prototype the gate as an opt-in Workflow step, not in `panel.mjs`.

**panelist-2 — No.** `panel.mjs` design centers on independent parallel dispatch (`independentOf`, panel.mjs:63,68) and a cross-family synthesizer (panel.mjs:94-97); adversarial review is covered by `reviewed.mjs:27` (high/critical → reviewer + red-team) and forced red-team for code (reviewed.mjs:52-54). Gates would distort the pattern's intent by forcing splits on legitimate agreement. Next step: log per-panelist outcome agreement and provider family for 20+ runs.

**panelist-3 — No (architectural boundary).** ADR 0047/0049 keep collaboration patterns minimal, pure, history-derived loops (runner.md:3050); stateful multi-round mechanics belong in Workflow DAGs (runner.md:1420) which already support `anonymizeInputs`/`blind`. `independentOf` (panel.mjs:65-71, 94-99) enforces provider independence, which is preferable to mechanical dissent; K2/K3 sensors exist as passive metrics (runner.md:1435, observe.md:61). Next step: package the four council gates into an opt-in `core/workflows/council.yaml` using `anonymizeInputs: true`.

## Disagreement (kept visible)

No panelist dissents on the core question — the vote is 3-0 against the gate. The remaining disagreement is only about emphasis and sequencing, not the verdict:

- panelist-1 emphasizes waiting for the pre-registered K2/K3 measurement thresholds before any build; panelist-3 is comfortable building the opt-in `council.yaml` workflow template now; panelist-2 proposes instrumentation before either.
- panelist-1 flags a genuinely unmeasured gap: panel units without a producer (advisory/discussion units) get no red-team coverage — the only acknowledged hole in the "enough" argument.
- On confidence-weighted tallies, panelist-1 notes observe.md:61 already computes agreement and `genuineSplit` (2/3 threshold), so item (4) of the council project needs no code change; the others do not contest this.

## Recommendation

**Do not add a mechanical dissent/agreement gate to `src/runner/execution/patterns/panel.mjs`.** Provider-distinct seats plus the reviewed pattern's red-team are sufficient for now, and the council features are deliverable as opt-in Workflow composition.

Evidence:
1. `panel.mjs:63-68, 94-97` — panelists and synthesizer are dispatched with `independentOf`, giving genuine provider-family independence rather than mechanically forced disagreement.
2. `reviewed.mjs:24-29, 52-54` — `high`/`critical` rigor and `code` capability already add a `red-team` checker with `independentOf: ['producer']` (reviewed.mjs:302), supplying adversarial dissent where errors matter.
3. `docs/specs/runner.md:1435` and `observe.md:61` — agreement/genuine-split is specified as a passive measurement with pre-registered K2/K3 revisit conditions; a gate now would pre-empt the data that should decide the question, and `runner.md:3050` (no new state) plus 1437-1439 (`anonymizeInputs`/`blind`, cross-examine step, `delphi.yaml`) show the composition path already exists.

Concrete next step: after ~30 panel runs, run `fgos metrics discussions --by workflow` (panelist-1) and log per-panelist agreement with provider family (panelist-2); if K2/K3 trip, build the council gates as an opt-in `core/workflows/council.yaml` with `anonymizeInputs: true` (panelist-3) rather than modifying the pattern.
