# Position: do not add a mechanical dissent/agreement gate to `panel` now

Keep measuring. Don't gate yet. The repo has already chosen to measure agreement first and has written down the conditions for revisiting that choice. Two of the four council mechanisms already exist in another form. Also, the premise that "red-team already covers it" is only partly true.

## Strongest reasons

1. **Measure-first is a settled decision, and it has revisit criteria.** Agreement is "a passive measurement, not a workflow gate". Zero valid votes counts as unmeasured, not as a genuine split. The K2, K3 and K5 conditions are the agreed trigger for revisiting (docs/specs/runner.md:1435). The `genuineSplit` metric (no group reaches 2/3) is already computed (docs/specs/observe.md:61). Adding a >70% gate now would skip the evidence step the project set for itself.
2. **Mechanisms 3 and 4 already exist without changing the pattern.** An anonymized cross-examination step is documented as a Workflow step with `anonymizeInputs` (runner.md:1437). Blind panelists are available through `blind: true` (runner.md:1439). `panel.mjs` stays small and pure, which follows ADR 0047 (runner.md:3050).
3. **Neither safeguard is guaranteed, so gating the text is premature.** `panel.mjs:63-68` and `:94-97` only *request* independence. The spec records a Codex-only panel that was "not cross-provider independent review" (runner.md:1404-1405). Red-team runs only inside `reviewed`, at high or critical rigor or for `code:*` work (reviewed.mjs:24-29, 52-54). Nothing in `panel.mjs:50-105` sends panel output through red-team. A dissent quota would push models to produce disagreement while the actual weakness, correlated providers, stays in place.

## What would change my mind

- K2 fires: at least 90% of the first 30 logged panel runs are unanimous.
- K3 fires: a unanimous panel is later reversed by red-team or by a human within 14 days.

If either happens, I'd add a forced-counterfactual round that is opt-in per preset and triggered by the measured `agreement`. It would not be a default re-prompt.

## Next step

Run `fgos metrics discussions --by workflow` to count panel runs that carry valid `stanceOptions` stances. If the count is near zero, the sensor isn't collecting anything. In that case, pass `--stance-options` in the panel workflows first, so K2 and K3 can be checked before K5 expires.
